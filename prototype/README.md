# 🧭 TravelQuest — Protótipo local (dados mockados)

Protótipo navegável da arquitetura descrita em [`docs/arquitetura-gamificacao-viagens/`](../docs/arquitetura-gamificacao-viagens/README.md).
**Roda 100% na sua máquina, sem backend, sem banco, sem `npm install`** — os dados são mockados
e persistem no `localStorage` do navegador.

## Como rodar

Qualquer uma das opções:

```bash
# Opção 1 — qualquer servidor estático
npx serve prototype
# ou
python3 -m http.server 8000 --directory prototype
# e abra http://localhost:8000

# Opção 2 — sem servidor: dê dois cliques em prototype/index.html
```

> Os mapas usam tiles do OpenStreetMap via internet; o resto funciona offline.

## Testes automatizados das regras de negócio

O fake backend (`js/backend.js`) espelha a RPC `perform_checkin` do doc 01 — mesmas
validações, mesma ordem. As regras são verificadas por 36 asserts:

```bash
node prototype/test/backend.test.js
```

Cobre: geofence (`OUT_OF_RANGE`), tolerância `raio + min(accuracy, 50)`, `LOW_GPS_ACCURACY`,
idempotência (`ALREADY_CHECKED_IN`), viagem impossível e mock location (→ `flagged`),
desbloqueio transacional de conquista + bônus, estorno via ledger com revogação de conquista,
ciclo de vida do admin (draft → publish → archive, checklist, trava de missão ativa) e
janela de vigência de missão sazonal.

## O que dá para testar (e onde isso está nos docs)

| Você testa… | Conceito da arquitetura | Doc |
|---|---|---|
| Arrastar o marcador azul / teleporte e ver o botão habilitar dentro do raio | Geofencing client-side como UX (histerese de 15 m anti-flicker) | 03, 05 |
| "🧪 testar mesmo assim" fora do raio → erro do servidor | Servidor é a autoridade (`OUT_OF_RANGE` com distância real) | 03 |
| Slider de precisão > 100 m → rejeição; 50–100 m → tolerância | `LOW_GPS_ACCURACY` e tolerância capada | 01, 03 |
| Saltos grandes sem avançar o relógio virtual → ⚠️ flagged | Viagem impossível: soft signal, otimista + revisão (D8) | 03 |
| Toggle "mock location" → flagged | Sinal de GPS falso | 03 |
| Completar os 5 locais do Centro Histórico → modal de celebração | Progresso calculado na transação do check-in, `newly_unlocked` na resposta | 01, 03 |
| Home com seções Missões × Avulsos; pins estilizados no mapa | Regra de separação D7 (backend decide, app renderiza) | 02, 03 |
| Locais do "Festival de Inverno" 🔒 → avançar relógio +21 dias | Estado `bloqueado` + janela de vigência | 05 |
| Admin → Novo local (pin no mapa + slider de raio + aviso de sobreposição) | Wizard de Local, etapa de geofence | 04 |
| Admin → Nova conquista (vincular existentes **e** criar local inline) | Wizard de Conquista, dois caminhos no mesmo passo | 04 |
| Tentar editar locais de missão ativa / arquivar local em missão | Regras de ciclo de vida (D9, grandfathering) | 04 |
| Admin → Revisão: aprovar/revogar flagged → extrato no Perfil | Ledger imutável, estorno por linha negativa, revogação de conquista | 01, 04 |
| Perfil → Extrato | `points_ledger` como fonte da verdade | 01 |

## O que é simulado vs. real

| Simulado no protótipo | No produto real |
|---|---|
| Posição GPS (marcador arrastável + teleporte) | `watchPosition` / geofences nativos no app mobile |
| `js/backend.js` em memória + `localStorage` | PostgreSQL + PostGIS, RPC `perform_checkin`, RLS |
| Latência fake (350–750 ms) | Latência real de rede |
| Usuário único, sem login | Supabase Auth (JWT) |
| Relógio virtual (+5 min / +1 h / +1 dia) | `now()` do servidor |
| Emojis como fotos/badges | Storage + CDN |

Não simulado (de propósito, para não inflar o protótipo): rate limit por IP,
device fingerprint real, clustering de pins, push notifications.

## Estrutura

```
prototype/
├── index.html        # layout: telefone + simulador de GPS + admin
├── styles.css
├── js/
│   ├── mock-data.js  # seed: 14 locais e 3 missões em São Paulo (espelha as tabelas do doc 01)
│   ├── backend.js    # fake server: perform_checkin + APIs de leitura + admin (espelha docs 01/02)
│   ├── ui.js         # toasts, modais
│   ├── app.js        # App: Home, Mapa, sheet com máquina de estados, celebração, simulador
│   ├── admin.js      # Admin: locais, wizard de conquistas, fila de revisão
│   └── main.js       # bootstrap + re-render reativo (Bus)
└── test/
    └── backend.test.js  # 36 asserts das regras de negócio (node, zero deps)
```

## Caminho de evolução

Quando quiser sair do mock: crie um projeto Supabase, rode o DDL + RPC do
[doc 01](../docs/arquitetura-gamificacao-viagens/01-modelagem-dados.md), e troque as chamadas
`Backend.*` por `supabase.rpc('perform_checkin', ...)` e queries — os contratos já são os mesmos
([doc 02](../docs/arquitetura-gamificacao-viagens/02-contratos-api.md)). Para GPS real no bolso,
o passo seguinte é um app Expo (`expo-location`) consumindo essas mesmas APIs.

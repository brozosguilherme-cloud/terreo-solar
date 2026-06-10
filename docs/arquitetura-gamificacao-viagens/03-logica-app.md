# 03 — Frente 1: Lógica do Aplicativo

## 3.1 Consumo de dados na Home e no Mapa

### Princípio: o backend contextualiza, o app renderiza

Toda resposta da API já chega com o estado do usuário resolvido (`user_status`,
`progress`, `distance_m`). O app **não** decide o que é avulso ou de missão, **não**
soma pontos e **não** verifica conclusão de conquista. As duas únicas
responsabilidades de lógica no cliente são: (a) proximidade GPS em tempo real entre
um fetch e outro, e (b) orquestração de cache/estado.

### Home

1 request → `GET /app/v1/home?lat&lng` (doc 02) com duas seções:

| Seção | Conteúdo | Card |
|---|---|---|
| **Missões** | Conquistas ativas (na janela de datas), ordenadas por: em progresso primeiro, depois proximidade do `nearest_pending_place` | Capa + badge + barra "2/5" + atalho para o local pendente mais próximo |
| **Locais avulsos** | Locais `active` sem missão ativa, ordenados por distância | Foto + pontos + distância + estado |

Regras de separação (decisão D7):

- Local em ≥ 1 missão ativa → aparece **dentro** da missão (card da missão e tela de detalhe), nunca duplicado como avulso.
- Se a missão expira/arquiva e o Local segue `active` com `visibility = 'always'`, ele "volta" automaticamente para a seção de avulsos — sem mudança de cadastro, é só o resultado da query.
- `visibility = 'mission_only'` nunca aparece como avulso (e some do mapa se a missão sair do ar).

Estratégia de cache (React Query / SWR):

| Dado | Política |
|---|---|
| Home feed | `staleTime` 60 s, refetch on focus; re-fetch se o usuário se mover > 500 m |
| Pins do mapa | Cache por tile/bbox arredondado, `staleTime` 5 min |
| Progresso de missões | Invalidado por **resposta do check-in** (fonte primária) e por evento Realtime (fonte secundária, cobre multi-device) |
| Pós-check-in | Atualização **local** com o payload do `201` (progresso, pontos) — sem refetch da Home no momento da celebração |

### Mapa

- Carregamento por viewport: `GET /app/v1/map?bbox=...` ao parar o gesto de pan/zoom (debounce ~400 ms), não a cada frame.
- Clustering no cliente (supercluster). Pin com estilo por `kind` + `user_status`:
  - avulso disponível → pin padrão; concluído → pin com check verde;
  - de missão → pin com a cor/ícone da missão; concluído → versão "apagada" com check.
- Tap no pin → bottom-sheet com `GET /app/v1/places/{id}` (mostra contexto de missão "2/5" se houver) e o botão de check-in com a máquina de estados do doc 05.
- O app desenha o **círculo do geofence** (`radius_m`) no mapa quando o sheet está aberto — comunica ao usuário exatamente onde precisa estar (reduz frustração e tickets de suporte).

## 3.2 Geolocalização e antifraude

### Camadas

```
Camada 0 — App (UX, zero confiança):  habilita/desabilita botão, mostra distância
Camada 1 — Servidor (hard, bloqueia): geofence PostGIS, accuracy, idempotência, rate limit
Camada 2 — Servidor (soft, flag):     viagem impossível, mock location, fingerprint
Camada 3 — Assíncrona (revisão):      fila de flagged no admin, padrões por device/conta
```

### Front-end (Camada 0 — apenas UX)

A validação do cliente existe para **guiar** o usuário, nunca para autorizar. Ela
decide só uma coisa: o estado visual do botão.

- `watchPosition` com `enableHighAccuracy: true` **somente** com tela de detalhe/mapa aberta (bateria). Home usa uma posição pontual.
- Distância local via haversine contra `lat/lng/radius_m` do Local (já no payload).
- **Histerese anti-flicker**: entra em "pronto" quando `distance ≤ radius`, só sai quando `distance > radius + 15 m`. GPS urbano oscila ±10 m parado; sem histerese o botão pisca.
- Leituras com `accuracy > 50 m` no cliente → estado "GPS impreciso" com dica ("vá para área aberta"), em vez de falso "fora da área".
- Permissão de localização negada → app continua navegável (cards, mapa, missões); só o check-in explica que precisa da permissão (doc 05).
- v1.1: geofences nativos do SO (`expo-location` Geofencing) para push "Você está a 100 m de um local da Missão X" — re-engajamento, não validação.

### Back-end (Camadas 1–2 — a autoridade)

Pipeline da `perform_checkin` (transação única, doc 01):

```mermaid
sequenceDiagram
    participant App
    participant API as API / RPC
    participant DB as Postgres + PostGIS

    App->>App: watchPosition → entrou no raio → botão ativo
    App->>API: POST /places/:id/checkin {lat, lng, accuracy, device}
    API->>DB: perform_checkin() — BEGIN
    DB->>DB: 1. place.status = active?
    DB->>DB: 2. accuracy ≤ 100 m? (senão LOW_GPS_ACCURACY)
    DB->>DB: 3. ST_DWithin(geo, ponto, radius + min(accuracy,50))? (senão OUT_OF_RANGE)
    DB->>DB: 4. velocidade desde último check-in ≤ 900 km/h? mock? (senão status=flagged)
    DB->>DB: 5. INSERT checkin — unique(user,place) ⇒ ALREADY_CHECKED_IN
    DB->>DB: 6. ledger += pontos do local (trigger atualiza total_points)
    DB->>DB: 7. para cada missão do local: conta progresso; completou? INSERT user_achievements + bônus
    DB-->>API: COMMIT + JSON consolidado
    API-->>App: 201 {checkin, validation, achievements_progress, user}
    App->>App: animação de pontos; se newly_unlocked → modal de conquista
```

Decisões de antifraude e porquês:

| Vetor de fraude | Defesa | Camada |
|---|---|---|
| Enviar coordenada falsa no request | Servidor recalcula `ST_Distance` — a coordenada é insumo, não prova; cliente adulterado não muda a regra | 1 |
| Replay/duplo clique/retry | `Idempotency-Key` + índice único `(user_id, place_id)` | 1 |
| Script farmando todos os locais | Rate limit (ex.: 6 check-ins/h) + **viagem impossível**: distância/Δt do último check-in > 900 km/h ⇒ flag | 1–2 |
| Fake GPS app (Android) | `isFromMockProvider`/`isMocked` enviado pelo app ⇒ flag (sinal, não prova — app adulterado mente) | 2 |
| Multi-conta no mesmo aparelho | `device_fingerprint` por check-in; N contas/device em janela curta ⇒ flag na revisão | 2–3 |
| GPS spoof "bem feito" | Irresolvível com certeza absoluta; mitigação por padrões na fila de revisão + estorno via ledger | 3 |

Por que **flag em vez de rejeitar** nos sinais soft (decisão D8): GPS impreciso e
falso-positivo de velocidade (ex.: usuário fez check-in antes de embarcar num voo)
atingem usuários legítimos. Rejeitar na hora queima confiança no produto; aceitar com
`status = 'flagged'` mantém a UX fluida e a revogação posterior estorna os pontos no
ledger sem reescrever histórico.

Regras inegociáveis: timestamp **sempre** do servidor (`now()` na transação); `OUT_OF_RANGE`
retorna a distância calculada (transparência reduz suporte); tolerância
`radius + min(accuracy, 50)` — capada para o usuário não "comprar" raio infinito reportando accuracy gigante.

## 3.3 Atualização de progresso ("2/5 da Missão Centro Histórico")

### Fonte primária: a resposta do próprio check-in

O `201` devolve `achievements_progress` calculado **na mesma transação** que inseriu o
check-in. O app atualiza tudo de forma local e síncrona:

1. Marca o Local como `completed` (card, pin, sheet).
2. Anima `+30 pts` e atualiza `total_points` com o valor do servidor (não soma localmente).
3. Para cada item de `achievements_progress`: atualiza a barra "3/5" no cache da Home/Missões.
4. Se `newly_unlocked: true` → modal de celebração (badge + bônus) — dados já estão na resposta; nenhuma chamada extra no momento de pico emocional da jornada.

### Fonte secundária: Realtime/push (consistência entre superfícies)

Assinatura Realtime (filtrada por `user_id`) em `user_achievements` e `points_ledger`
cobre multi-device e qualquer concessão fora do fluxo local (ajuste de admin, estorno).
Recebeu evento → invalida queries de Home/perfil. Push notification para conquista
desbloqueada só se o app estiver em background.

### Otimismo de UI: parcial

- **Não** marque check-in como concluído otimisticamente antes do `201` — pontos são a moeda do produto; conceder e retirar é a pior interação possível.
- O que pode ser otimista: estado do botão (`Validando…` com spinner ≤ 2 s) e animações de transição.
- `ALREADY_CHECKED_IN` (409) é tratado como **sucesso silencioso**: o estado final desejado já existe (acontece em retry após timeout em área de sinal ruim — cenário comum em trilha/montanha).
- Offline: check-in **exige** rede no v1 (validação é server-side). Falha de rede → mensagem honesta "sem conexão; você continua na área? tente de novo" — nunca fila offline de check-ins (abriria o vetor de fraude mais óbvio: gravar coordenada e despachar depois de casa).

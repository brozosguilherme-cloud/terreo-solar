# 04 — Frente 2: Dashboard Admin (Gestão e Criação)

Princípio geral: **tudo nasce em `draft` e só entra no app via `publish` explícito**, que
roda um checklist de validação. O admin nunca consegue colocar no ar um Local sem
coordenada validada ou uma Conquista com 1 local só.

## 4.1 Criação de "Check-in Simples" (Local)

Formulário em **4 etapas** (stepper), salvando rascunho a cada etapa — cadastro de
coordenada no meio da rua acontece em campo, pelo celular, e não pode perder dados.

### Etapa 1 — Informações do Local
| Campo | Tipo | Validação |
|---|---|---|
| Nome | texto | obrigatório, ≤ 80 chars |
| Descrição | textarea | opcional, ≤ 600 chars |
| Categoria | select (`historico`, `gastronomia`, `natureza`, `cultura`, …) | obrigatório |
| Fotos | upload (Storage) | ≥ 1 para publicar |

### Etapa 2 — Localização e Geofence (a etapa crítica)
1. **Busca de endereço** (geocoding — Google/Mapbox/Nominatim) → preenche `address`, `city`, e posiciona o pin.
2. **Pin arrastável** no mapa para ajuste fino — geocoding erra dezenas de metros; a posição final é sempre ajuste visual humano (ex.: arrastar para o portão de entrada, não para o centroide do terreno).
3. **Raio do geofence** (`radius_m`): slider 30–1000 m, default 100, com **círculo desenhado em tempo real** sobre o mapa. O admin vê exatamente a área que valida o check-in.
4. Validações automáticas:
   - coordenada obrigatória e dentro do território de operação;
   - **aviso de sobreposição**: query `ST_DWithin` contra locais existentes — "há outro Local a 40 m (raios se sobrepõem). Continuar?" Evita cadastro duplicado por outro admin.

Diretriz de raio para o time de conteúdo: estátua/obra 30–50 m · prédio/restaurante 75–100 m · praça/parque 150–300 m · mirante/área natural 300–500 m.

### Etapa 3 — Gamificação e Exibição
| Campo | Tipo | Default |
|---|---|---|
| Pontos do check-in (`base_points`) | número | 10 (guia: 10 comum · 30 relevante · 50+ destino "âncora") |
| Visibilidade | radio `always` / `mission_only` | `always` |

### Etapa 4 — Revisão e Publicação
- Preview do card como aparecerá na Home + pin no mapa com o círculo do raio.
- Botões: `Salvar rascunho` / `Publicar` (`POST /places/:id/publish`).
- Checklist do publish (server-side): nome, categoria, ≥ 1 foto, coordenada, raio válido.
- **Modo teste** (v1.1): admin com app instalado vê locais `draft` num "modo preview" e valida o geofence in loco antes de publicar.

## 4.2 Criação de "Conquista" (Missão)

Wizard em **4 etapas**. Decisão-chave da sua pergunta — *vincular existentes ou criar
novos?* — resposta: **os dois caminhos no mesmo passo**, porque o fluxo real do time de
conteúdo é misto ("a missão tem 5 locais; 3 já existem no sistema, 2 são novos").

### Etapa 1 — Identidade da Missão
Nome, descrição/narrativa, imagem de capa, **badge** (arte do troféu), cidade/região.

### Etapa 2 — Locais da Missão (o coração do wizard)

Tela dividida: lista de selecionados à esquerda, **mapa com os pins à direita**
(a visão geográfica é o que faz o admin perceber "essa missão exige atravessar a
cidade 3 vezes").

Duas ações, sempre visíveis:

1. **`+ Vincular local existente`** → busca com autocomplete (nome/cidade/categoria) sobre locais `active` e `draft` → multi-select. Cada item mostra se já pertence a outras missões (lembrete do N:N — vincular **não** move nem duplica o local).
2. **`+ Criar novo local`** → abre o **mesmo formulário da seção 4.1 em modal** (mesmo componente, mesmas validações). Ao salvar, o local é criado como registro normal em `places` (em `draft`) e **auto-vinculado** à missão. Não existe "local que só vive dentro da missão" como entidade diferente — é sempre uma linha em `places` + uma linha em `achievement_places`; se quiser escondê-lo da Home, o admin marca `visibility = 'mission_only'`.

- Reordenação por drag-and-drop → `sort_order` (no v1 é só ordem de exibição; vira trilha sequencial no v2 sem mudar schema).
- Persistência declarativa: o wizard salva com um único `PUT /achievements/:id/places` (estado final completo — sem add/remove incremental).

### Etapa 3 — Regras e Recompensa
| Campo | Tipo | Default |
|---|---|---|
| Pontos bônus de conclusão (`bonus_points`) | número | sugestão automática: ~50% da soma dos pontos dos locais |
| Critério de conclusão | radio: **Todos os locais** / `X de N` (v2) | todos |
| Ordem obrigatória (`is_sequential`) | toggle (v2, desabilitado no v1) | off |
| Janela de vigência (`starts_at`/`ends_at`) | datas opcionais | sempre ativa |

### Etapa 4 — Revisão e Publicação
- Resumo: N locais (mapa geral), total de pontos possível (Σ locais + bônus), vigência.
- Checklist do publish (server-side): **≥ 2 locais vinculados**, todos os locais `active` (publicar a missão oferece publicar os locais `draft` criados inline em lote), badge enviado, datas coerentes.

## 4.3 Ciclo de vida e regras de edição (onde moram os bugs)

A pergunta que define essas regras: *o que acontece com quem já está no meio da missão?*

| Operação | Regra | Racional |
|---|---|---|
| Editar metadados de missão `active` (nome, capa, descrição) | ✅ Livre | Não afeta progresso |
| **Adicionar** local a missão `active` | ⚠️ Bloqueado por padrão. Caminho correto: arquivar e lançar "Missão X — Vol. 2" | Quem completou seria "desconcluído" (badge entregue ≠ badge revogável) ou ganharia conquista com buraco. Pior anti-padrão de gamificação. |
| **Remover** local de missão `active` | ⚠️ Permitido com confirmação mostrando impacto ("12 usuários têm check-in neste local") | Progresso é recalculado na hora (queries contam pela junção atual). Quem **já completou mantém** a conquista e o bônus (*grandfathering* — decisão D9): `user_achievements` não é apagada. O check-in do local removido permanece válido (o usuário esteve lá; o ponto é dele). |
| Arquivar **local** que pertence a missão ativa | ⚠️ Aviso bloqueante com link para as missões afetadas; exige remover o vínculo antes (ou arquivar a missão junto) | Evita missão impossível de completar — quebra silenciosa que só aparece em reclamação de usuário |
| Arquivar **missão** | ✅ Some do app; conclusões, badges e pontos concedidos são preservados | Histórico é do usuário, não do catálogo |
| Excluir local com check-ins | 🚫 Nunca (FK `on delete restrict`) — só `archived` | Check-in é registro histórico e financeiro (pontos) |
| Mudar `base_points` de local ativo | ✅ Vale para check-ins **futuros**; passados não são re-pontuados | Ledger é imutável; re-pontuação retroativa = caos de auditoria |

## 4.4 Fila de revisão antifraude

Tela `Check-ins → Sinalizados` consumindo `GET /admin/v1/checkins?status=flagged`:

- Cada item: usuário, local, mapa com o par (geofence × ponto reportado), `distance_m`, `accuracy_m`, velocidade desde o check-in anterior, `device_fingerprint` (com contagem de contas no mesmo device), `is_mock_location`.
- Ações: **Aprovar** (`→ confirmed`) ou **Revogar** (`→ revoked`).
- Revogação executa em transação: linha negativa no ledger (estorno dos pontos do check-in) e reavaliação das conquistas dependentes — se a conquista só se sustentava por esse check-in **e foi obtida de forma fraudulenta**, revoga `user_achievements` + estorna o bônus. (Exceção de grandfathering não se aplica a fraude.)
- Automação v1.1: usuário com ≥ 3 revogações → `shadow_flag` (todo check-in futuro nasce `flagged`).

## 4.5 Métricas que o admin precisa ver (GPM hat)

| Métrica | Decisão que ela habilita |
|---|---|
| Funil por missão: iniciaram (≥ 1 check-in) → completaram | Missão com funil 90/5 está longa/dispersa demais → redesenhar |
| Check-ins por local/dia | Local "morto" → revisar pontos, raio ou remover da missão |
| Taxa de `OUT_OF_RANGE` por local | Alta → raio mal calibrado ou pin no lugar errado (ajustar na Etapa 2) |
| Taxa de `flagged` por local | Alta → alvo de farming → revisar pontuação |
| Tempo médio para completar missão | Calibrar dificuldade e bônus |

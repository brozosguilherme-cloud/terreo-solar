# 02 — Contratos de API

Duas superfícies separadas por prefixo e por política de acesso:

- **`/app/v1/*`** — consumida pelo app mobile. Auth: JWT do usuário (Supabase Auth). Toda resposta já vem **contextualizada ao usuário** (`user_status`, progresso) — o app não calcula regra de negócio.
- **`/admin/v1/*`** — consumida pelo dashboard. Auth: JWT + claim/flag `is_admin` (verificada no servidor; no Supabase, Server Actions com service role após checar o perfil).

### Convenções

- Erros sempre no envelope:
  ```json
  { "error": { "code": "OUT_OF_RANGE", "message": "Você está a 230 m do local.", "details": { "distance_m": 230, "radius_m": 100 } } }
  ```
- Datas em ISO-8601 UTC. Paginação por cursor: `?cursor=&limit=` → `{ "items": [...], "next_cursor": "..." }`.
- `POST /checkin` aceita header `Idempotency-Key` (retry de rede seguro; o índice único de banco é a segunda linha de defesa).

---

## App — endpoints

### `GET /app/v1/home?lat={lat}&lng={lng}`

Alimenta a Home inteira em 1 request. `lat/lng` são opcionais (sem eles, `distance_m` vem `null` e a ordenação cai para curadoria/recência).

```json
{
  "missions": [
    {
      "id": "m-001",
      "name": "Missão Centro Histórico",
      "cover_image_url": "https://...",
      "badge_image_url": "https://...",
      "bonus_points": 200,
      "ends_at": null,
      "progress": { "completed": 2, "total": 5 },
      "user_status": "in_progress",          // not_started | in_progress | completed | expired
      "nearest_pending_place": { "id": "p-031", "name": "Theatro Municipal", "distance_m": 850 }
    }
  ],
  "standalone_places": [
    {
      "id": "p-104",
      "name": "Mirante 9 de Julho",
      "category": "natureza",
      "photo_url": "https://...",
      "base_points": 50,
      "lat": -23.561, "lng": -46.655,
      "distance_m": 1240,
      "user_status": "available"             // available | completed
    }
  ],
  "user": { "total_points": 1250, "achievements_unlocked": 3 }
}
```

**Regra de separação (D7):** um Local que pertence a ≥ 1 missão ativa entra **só** dentro do card da missão (`missions[].progress`, detalhe via `GET /achievements/:id`); `standalone_places` lista apenas Locais sem missão ativa. O backend resolve isso na query — o app nunca decide "o que é avulso".

### `GET /app/v1/map?bbox={minLng},{minLat},{maxLng},{maxLat}`

Pins leves por viewport (clustering é responsabilidade do cliente). Todos os Locais ativos viram pin — os de missão levam `mission_ids` para estilização e bottom-sheet contextual.

```json
{
  "pins": [
    { "id": "p-104", "lat": -23.561, "lng": -46.655, "kind": "standalone",
      "base_points": 50, "user_status": "available" },
    { "id": "p-031", "lat": -23.545, "lng": -46.638, "kind": "mission",
      "mission_ids": ["m-001"], "base_points": 30, "user_status": "completed" }
  ]
}
```

### `GET /app/v1/places/{id}?lat={lat}&lng={lng}`

Detalhe do Local (bottom-sheet do pin / card). Inclui contexto de missão e o raio, para o app desenhar o círculo do geofence e calcular proximidade localmente entre polls.

```json
{
  "id": "p-031",
  "name": "Theatro Municipal",
  "description": "...",
  "photo_url": "https://...",
  "address": "Praça Ramos de Azevedo, s/n",
  "lat": -23.545, "lng": -46.638,
  "radius_m": 100,
  "base_points": 30,
  "user_status": "available",
  "distance_m": 230,
  "missions": [
    { "id": "m-001", "name": "Missão Centro Histórico", "progress": { "completed": 2, "total": 5 } }
  ]
}
```

### `POST /app/v1/places/{id}/checkin`

**O endpoint mais importante do produto.** Mapeia 1:1 para a RPC `perform_checkin` (doc 01).

Request:
```json
{
  "lat": -23.5451,
  "lng": -46.6382,
  "accuracy_m": 12.5,
  "device": {
    "fingerprint": "ab3f...",
    "is_mock_location": false,
    "platform": "android",
    "app_version": "1.4.0"
  }
}
```

`201 Created`:
```json
{
  "checkin": { "id": "c-789", "place_id": "p-031", "points_awarded": 30,
               "status": "confirmed", "created_at": "2026-06-10T18:42:11Z" },
  "validation": { "distance_m": 23, "radius_m": 100 },
  "achievements_progress": [
    { "achievement_id": "m-001", "name": "Missão Centro Histórico",
      "completed": 3, "total": 5, "newly_unlocked": false, "bonus_points": 0 }
  ],
  "user": { "total_points": 1280 }
}
```

> Quando `newly_unlocked: true`, o app dispara a celebração da conquista (modal + badge + pontos bônus) **com os dados desta mesma resposta** — zero requests extras no momento mais importante da jornada.

Erros:

| HTTP | `code` | Quando | Ação do app |
|---|---|---|---|
| 422 | `OUT_OF_RANGE` | `distance > radius + tolerância` (servidor) | Mostra distância real, mantém botão desabilitado |
| 422 | `LOW_GPS_ACCURACY` | `accuracy_m > 100` | "Sinal de GPS fraco — vá para área aberta" + retry |
| 409 | `ALREADY_CHECKED_IN` | Índice único (user, place) | Trata como sucesso silencioso → estado `completed` |
| 404 | `PLACE_NOT_AVAILABLE` | Local inativo/arquivado | Remove card/pin do cache local |
| 429 | `RATE_LIMITED` | > N tentativas/min (gateway) | Backoff exponencial, mensagem genérica |
| 401 | `UNAUTHENTICATED` | Sessão expirada | Refresh token / re-login |

### Demais endpoints do App

| Método e rota | Descrição |
|---|---|
| `GET /app/v1/achievements` | Lista missões ativas com progresso do usuário (tela "Missões") |
| `GET /app/v1/achievements/{id}` | Detalhe: lista de Locais membros, cada um com `user_status`, `distance_m`, `sort_order` |
| `GET /app/v1/me` | Perfil + `total_points` + badges desbloqueados |
| `GET /app/v1/me/checkins?cursor=` | Histórico de check-ins (timeline/diário de viagem) |
| `GET /app/v1/me/ledger?cursor=` | Extrato de pontos (transparência do score) |

---

## Admin — endpoints

### Locais

| Método e rota | Descrição |
|---|---|
| `GET /admin/v1/places?status=&q=&city=&cursor=` | Listagem com busca e filtros |
| `POST /admin/v1/places` | Cria em `draft` |
| `GET /admin/v1/places/{id}` | Detalhe (inclui missões que o usam e contagem de check-ins) |
| `PATCH /admin/v1/places/{id}` | Edição parcial |
| `POST /admin/v1/places/{id}/publish` | `draft → active` (valida campos obrigatórios) |
| `POST /admin/v1/places/{id}/archive` | `active → archived` (bloqueado/avisado se em missão ativa — doc 04) |

`POST /admin/v1/places` request:
```json
{
  "name": "Theatro Municipal",
  "description": "...",
  "category": "historico",
  "photo_url": "https://...",
  "address": "Praça Ramos de Azevedo, s/n",
  "city": "São Paulo",
  "lat": -23.5451, "lng": -46.6382,
  "radius_m": 100,
  "base_points": 30,
  "visibility": "always"
}
```

### Conquistas

| Método e rota | Descrição |
|---|---|
| `GET /admin/v1/achievements?status=&cursor=` | Listagem |
| `POST /admin/v1/achievements` | Cria em `draft` (metadados; locais vêm depois) |
| `GET /admin/v1/achievements/{id}` | Detalhe com locais vinculados + métricas (iniciaram/completaram) |
| `PATCH /admin/v1/achievements/{id}` | Edição (restrita se `active` — doc 04) |
| `PUT /admin/v1/achievements/{id}/places` | **Substitui o conjunto** de locais vinculados (ordenado) |
| `POST /admin/v1/achievements/{id}/publish` | `draft → active` (checklist: ≥ 2 locais ativos, badge, pontos) |
| `POST /admin/v1/achievements/{id}/archive` | Encerra a missão (conclusões existentes preservadas) |

`PUT /admin/v1/achievements/{id}/places` — o vínculo é **declarativo** (estado final completo), o que simplifica o wizard de edição e evita APIs de add/remove com estados intermediários:

```json
{
  "places": [
    { "place_id": "p-031", "sort_order": 0 },
    { "place_id": "p-104", "sort_order": 1 },
    { "place_id": "p-217", "sort_order": 2 }
  ]
}
```

Resposta inclui o impacto, para o admin confirmar mudanças destrutivas:
```json
{
  "linked": 3, "removed": 1,
  "warnings": [
    { "code": "PROGRESS_AFFECTED", "message": "12 usuários tinham check-in no local removido; o progresso deles será recalculado." }
  ]
}
```

### Moderação e antifraude

| Método e rota | Descrição |
|---|---|
| `GET /admin/v1/checkins?status=flagged&cursor=` | Fila de revisão (distância, accuracy, velocidade, device, mock) |
| `POST /admin/v1/checkins/{id}/approve` | `flagged → confirmed` |
| `POST /admin/v1/checkins/{id}/revoke` | `→ revoked`: estorna pontos no ledger e recalcula conquistas (política no doc 04) |
| `GET /admin/v1/analytics/overview` | KPIs: check-ins/dia, missões iniciadas vs completadas, funil por missão |

---

## Mapeamento para Supabase (implementação de referência)

| Contrato | Implementação |
|---|---|
| `GET /app/v1/home`, `/map`, `/achievements` | Views/RPCs de leitura (`get_home_feed(lat,lng)`, `get_map_pins(bbox)`) — RLS garante só conteúdo `active` |
| `POST /app/v1/places/:id/checkin` | `rpc('perform_checkin', ...)` — Edge Function na frente se quiser rate-limit por IP e device-check |
| `/admin/v1/*` | Server Actions no Next.js com service role, após validar `profiles.is_admin` |
| Progresso em tempo real | Supabase Realtime em `user_achievements` e `points_ledger` filtrado por `user_id` |

# SolarMatch — MVP

Marketplace B2B2C que conecta proprietários de terrenos/telhados com empresas instaladoras de painéis solares.

## Stack

- **Next.js 14** — App Router, Server Components, Server Actions
- **Supabase** — Auth, PostgreSQL, Storage (fotos), RLS
- **Tailwind CSS** + **shadcn/ui** (componentes manuais)
- **TypeScript** — tipagem completa
- **Sonner** — toasts

## Estrutura de Arquivos

```
solar-match/
├── app/
│   ├── (auth)/               # Login e Registro
│   ├── (dashboard)/
│   │   ├── owner/            # Dashboard do proprietário
│   │   │   ├── dashboard/
│   │   │   ├── onboarding/
│   │   │   └── spaces/       # CRUD de espaços
│   │   └── company/          # Dashboard da empresa
│   │       ├── dashboard/
│   │       ├── onboarding/
│   │       └── search/       # Busca com filtros
│   ├── actions/              # Server Actions (auth, spaces, interests, messages)
│   ├── chat/[interestId]/    # Chat entre as partes
│   ├── spaces/[id]/          # Página de detalhe do espaço
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # Componentes base (button, input, card...)
│   ├── Navbar.tsx
│   ├── SpaceCard.tsx
│   └── SpaceForm.tsx
├── lib/
│   ├── supabase/             # Clients (browser + server)
│   └── utils.ts
├── types/database.ts         # Tipos TypeScript do banco
├── supabase/
│   ├── migrations/           # Schema SQL
│   └── seed.sql              # Dados de demo
└── middleware.ts             # Proteção de rotas + redirect por role
```

## Setup Local

### 1. Clonar e instalar dependências

```bash
cd solar-match
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **Settings > API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase
```

### 4. Rodar migrations

No **Supabase Dashboard > SQL Editor**, cole e execute o conteúdo de:

```
supabase/migrations/20240101000000_initial.sql
```

Isso cria todas as tabelas, políticas RLS e o bucket de storage.

### 5. Popular dados de demo

**Opção A — Usuários de demo via interface:**

1. Vá em **Authentication > Users > Add User** no Supabase Dashboard
2. Crie `owner@demo.com` com senha `demo123456` e anote o UUID
3. Crie `company@demo.com` com senha `demo123456` e anote o UUID
4. Edite `supabase/seed.sql` e substitua os UUIDs nas linhas:
   ```sql
   owner_id   uuid := 'aaaaaaaa-...';  -- UUID do owner@demo.com
   company_id uuid := 'bbbbbbbb-...';  -- UUID do company@demo.com
   ```
5. Execute o seed no SQL Editor

**Opção B — Cadastro manual:**

Acesse `/register` no app e crie suas contas. Os 3 espaços de demo podem ser criados via interface.

### 6. Rodar o projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon pública |

## Fluxos Principais

### Proprietário
1. Cadastro (`/register`) → seleciona perfil "Proprietário"
2. Onboarding (`/owner/onboarding`) → preenche nome e contato
3. Dashboard (`/owner/dashboard`) → vê espaços e interesses pendentes
4. Cadastro de espaço (`/owner/spaces/new`) → foto, área, orientação, valor
5. Aceita/recusa interesses → chat ativo

### Empresa
1. Cadastro (`/register`) → seleciona "Empresa"
2. Onboarding (`/company/onboarding`) → preenche dados da empresa
3. Busca (`/company/search`) → filtra por tipo, cidade, área, orientação, valor
4. Página de detalhe (`/spaces/:id`) → clica "Demonstrar Interesse"
5. Dashboard (`/company/dashboard`) → acompanha status das negociações
6. Chat (`/chat/:interestId`) → mensagens em tempo real (polling 5s)

## Contas de Demo

Após rodar o seed:

| Perfil | E-mail | Senha |
|---|---|---|
| Proprietário | `owner@demo.com` | `demo123456` |
| Empresa | `company@demo.com` | `demo123456` |

**Espaços de demo criados:**
- Terreno 2.500m² em Campinas/SP — R$ 3.500/mês (Disponível)
- Telhado metálico 800m² em Rio de Janeiro/RJ — R$ 1.200/mês (Disponível)
- Terreno 1.200m² em Belo Horizonte/MG — R$ 2.000/mês (Em negociação — com chat ativo)

## Decisões de Implementação

| Decisão | Escolha | Motivo |
|---|---|---|
| Chat realtime | Polling a cada 5s | Simplicidade de MVP, sem WebSocket overhead |
| Fotos | Supabase Storage (bucket público) | Zero infra, CDN incluído |
| Geocoding | Input manual (lat/lng) | MVP — evita dependência de API paga |
| Auth | Supabase Auth | Cookies SSR nativos com `@supabase/ssr` |
| Filtros de busca | URL search params | Compartilhável, sem estado no servidor |

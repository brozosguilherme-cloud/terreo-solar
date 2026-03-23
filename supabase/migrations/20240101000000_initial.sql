-- ============================================================
-- SolarMatch — Schema Inicial
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (espelha auth.users com dados extras)
-- ============================================================
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  name       text,
  role       text not null check (role in ('owner', 'company')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Usuários leem o próprio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Usuários editam o próprio perfil"
  on public.profiles for update using (auth.uid() = id);
create policy "Usuários criam o próprio perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- OWNER_PROFILES
-- ============================================================
create table public.owner_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade unique not null,
  full_name  text,
  cpf_cnpj   text,
  phone      text,
  updated_at timestamptz not null default now()
);

alter table public.owner_profiles enable row level security;
create policy "Owner lê o próprio perfil"
  on public.owner_profiles for select using (auth.uid() = user_id);
create policy "Owner edita o próprio perfil"
  on public.owner_profiles for all using (auth.uid() = user_id);

-- ============================================================
-- COMPANY_PROFILES
-- ============================================================
create table public.company_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade unique not null,
  company_name text not null,
  cnpj         text,
  website      text,
  description  text,
  updated_at   timestamptz not null default now()
);

alter table public.company_profiles enable row level security;
create policy "Empresa lê o próprio perfil"
  on public.company_profiles for select using (auth.uid() = user_id);
create policy "Empresa edita o próprio perfil"
  on public.company_profiles for all using (auth.uid() = user_id);
-- Empresas podem ver perfis de outras para exibir nome no chat
create policy "Qualquer usuário autenticado pode ver company_profiles"
  on public.company_profiles for select using (auth.role() = 'authenticated');

-- ============================================================
-- SPACES
-- ============================================================
create table public.spaces (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid references public.profiles(id) on delete cascade not null,
  type              text not null check (type in ('terreno', 'telhado')),
  address           text not null,
  city              text not null,
  state             text not null,
  lat               decimal(10, 8),
  lng               decimal(11, 8),
  area_m2           decimal(10, 2) not null,
  solar_orientation text[] not null default '{}',
  roof_type         text check (roof_type in ('ceramica', 'metalico', 'laje', 'fibrocimento')),
  desired_rent      decimal(10, 2),
  description       text,
  status            text not null default 'available'
                    check (status in ('available', 'negotiating', 'rented')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.spaces enable row level security;
-- Qualquer usuário autenticado pode ler espaços
create policy "Espaços são públicos para usuários autenticados"
  on public.spaces for select using (auth.role() = 'authenticated');
-- Espaços disponíveis são visíveis até para anônimos (landing page futura)
create policy "Espaços disponíveis são públicos"
  on public.spaces for select using (status = 'available');
create policy "Dono cria espaços"
  on public.spaces for insert with check (auth.uid() = owner_id);
create policy "Dono edita seus espaços"
  on public.spaces for update using (auth.uid() = owner_id);
create policy "Dono deleta seus espaços"
  on public.spaces for delete using (auth.uid() = owner_id);

-- ============================================================
-- SPACE_PHOTOS
-- ============================================================
create table public.space_photos (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid references public.spaces(id) on delete cascade not null,
  url       text not null,
  "order"   int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.space_photos enable row level security;
create policy "Fotos são públicas"
  on public.space_photos for select using (true);
create policy "Dono gerencia fotos"
  on public.space_photos for all using (
    exists (
      select 1 from public.spaces
      where spaces.id = space_photos.space_id
        and spaces.owner_id = auth.uid()
    )
  );

-- ============================================================
-- INTERESTS
-- ============================================================
create table public.interests (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid references public.spaces(id) on delete cascade not null,
  company_id uuid references public.profiles(id) on delete cascade not null,
  status     text not null default 'pending'
             check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(space_id, company_id)
);

alter table public.interests enable row level security;
-- Dono do espaço pode ver interesses nos seus espaços
create policy "Dono vê interesses nos seus espaços"
  on public.interests for select using (
    exists (
      select 1 from public.spaces
      where spaces.id = interests.space_id
        and spaces.owner_id = auth.uid()
    )
  );
-- Empresa vê seus próprios interesses
create policy "Empresa vê seus interesses"
  on public.interests for select using (auth.uid() = company_id);
-- Empresa cria interesse
create policy "Empresa cria interesse"
  on public.interests for insert with check (auth.uid() = company_id);
-- Dono atualiza status do interesse
create policy "Dono atualiza status do interesse"
  on public.interests for update using (
    exists (
      select 1 from public.spaces
      where spaces.id = interests.space_id
        and spaces.owner_id = auth.uid()
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  interest_id uuid references public.interests(id) on delete cascade not null,
  sender_id   uuid references public.profiles(id) on delete cascade not null,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;
-- Participantes do interesse podem ver mensagens
create policy "Participantes veem mensagens"
  on public.messages for select using (
    exists (
      select 1 from public.interests i
      join public.spaces s on s.id = i.space_id
      where i.id = messages.interest_id
        and (i.company_id = auth.uid() or s.owner_id = auth.uid())
    )
  );
-- Participantes enviam mensagens
create policy "Participantes enviam mensagens"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.interests i
      join public.spaces s on s.id = i.space_id
      where i.id = messages.interest_id
        and i.status = 'accepted'
        and (i.company_id = auth.uid() or s.owner_id = auth.uid())
    )
  );
-- Participantes marcam como lido
create policy "Participantes atualizam read_at"
  on public.messages for update using (
    exists (
      select 1 from public.interests i
      join public.spaces s on s.id = i.space_id
      where i.id = messages.interest_id
        and (i.company_id = auth.uid() or s.owner_id = auth.uid())
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('space-photos', 'space-photos', true)
on conflict (id) do nothing;

create policy "Fotos são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'space-photos');

create policy "Usuários autenticados fazem upload"
  on storage.objects for insert
  with check (bucket_id = 'space-photos' and auth.role() = 'authenticated');

create policy "Usuários autenticados deletam suas fotos"
  on storage.objects for delete
  using (bucket_id = 'space-photos' and auth.role() = 'authenticated');

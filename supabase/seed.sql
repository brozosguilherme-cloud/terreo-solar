-- ============================================================
-- SolarMatch — Seed de Dados de Exemplo
--
-- ATENÇÃO: Rode APÓS a migration.
-- Cria 2 usuários (1 proprietário, 1 empresa) + 3 espaços de demo.
--
-- Credenciais de demo:
--   Proprietário: owner@demo.com / demo123456
--   Empresa:      company@demo.com / demo123456
-- ============================================================

-- Criamos os usuários diretamente via auth.users (para ambientes de desenvolvimento)
-- Em produção, use a API de admin do Supabase ou registre via interface.

-- OBS: Este seed usa UUIDs fixos para facilitar referências cruzadas.
-- Substitua pelos IDs reais após criar os usuários via cadastro normal.

-- ============================================================
-- Para rodar o seed de demo manualmente:
-- 1. Acesse Supabase Dashboard > Authentication > Users
-- 2. Clique em "Add User" para criar:
--    - owner@demo.com / demo123456 (anote o UUID gerado)
--    - company@demo.com / demo123456 (anote o UUID gerado)
-- 3. Substitua os UUIDs abaixo pelos UUIDs reais
-- 4. Execute este SQL no SQL Editor
-- ============================================================

-- Substitua estes UUIDs pelos reais após criar os usuários!
do $$
declare
  owner_id   uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  company_id uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  space1_id  uuid := gen_random_uuid();
  space2_id  uuid := gen_random_uuid();
  space3_id  uuid := gen_random_uuid();
begin

  -- Profiles
  insert into public.profiles (id, email, name, role, onboarding_completed)
  values
    (owner_id,   'owner@demo.com',   'João Silva',         'owner',   true),
    (company_id, 'company@demo.com', 'SolarTech Energia',  'company', true)
  on conflict (id) do nothing;

  -- Owner profile
  insert into public.owner_profiles (user_id, full_name, phone)
  values (owner_id, 'João da Silva', '(11) 98765-4321')
  on conflict (user_id) do nothing;

  -- Company profile
  insert into public.company_profiles (user_id, company_name, cnpj, website, description)
  values (
    company_id,
    'SolarTech Energia Ltda.',
    '12.345.678/0001-99',
    'https://solartech.com.br',
    'Empresa especializada em instalação de painéis solares fotovoltaicos com mais de 10 anos de experiência. Atendemos todo o estado de São Paulo.'
  )
  on conflict (user_id) do nothing;

  -- Espaço 1: Terreno grande em SP
  insert into public.spaces (id, owner_id, type, address, city, state, lat, lng, area_m2, solar_orientation, desired_rent, description, status)
  values (
    space1_id,
    owner_id,
    'terreno',
    'Estrada Municipal km 12, Zona Rural',
    'Campinas',
    'SP',
    -22.9099,
    -47.0626,
    2500,
    array['Norte', 'Leste'],
    3500.00,
    'Terreno plano em área rural com excelente incidência solar. Acesso por estrada pavimentada, energia elétrica disponível no local. Ideal para usina solar de médio porte. Sem obstáculos que gerem sombra.',
    'available'
  );

  insert into public.space_photos (space_id, url, "order")
  values
    (space1_id, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 0),
    (space1_id, 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 1);

  -- Espaço 2: Telhado industrial em RJ
  insert into public.spaces (id, owner_id, type, address, city, state, lat, lng, area_m2, solar_orientation, roof_type, desired_rent, description, status)
  values (
    space2_id,
    owner_id,
    'telhado',
    'Av. Brasil, 4500 — Galpão Industrial',
    'Rio de Janeiro',
    'RJ',
    -22.8958,
    -43.2302,
    800,
    array['Norte', 'Oeste'],
    'metalico',
    1200.00,
    'Telhado metálico de galpão industrial em excelente estado. Estrutura reforçada que suporta o peso dos painéis. Localização estratégica próxima a grandes consumidores de energia.',
    'available'
  );

  insert into public.space_photos (space_id, url, "order")
  values
    (space2_id, 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80', 0),
    (space2_id, 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80', 1);

  -- Espaço 3: Terreno em MG (em negociação)
  insert into public.spaces (id, owner_id, type, address, city, state, lat, lng, area_m2, solar_orientation, desired_rent, description, status)
  values (
    space3_id,
    owner_id,
    'terreno',
    'Rua das Aroeiras, 200',
    'Belo Horizonte',
    'MG',
    -19.9167,
    -43.9345,
    1200,
    array['Norte'],
    2000.00,
    'Terreno residencial amplo em bairro consolidado. Topografia plana, sem árvores de grande porte. Próximo a subestação elétrica, facilitando conexão à rede.',
    'negotiating'
  );

  insert into public.space_photos (space_id, url, "order")
  values
    (space3_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 0);

  -- Interesse da empresa no espaço 3 (aceito — simula negociação ativa)
  insert into public.interests (space_id, company_id, status)
  values (space3_id, company_id, 'accepted')
  on conflict (space_id, company_id) do nothing;

  -- Mensagens de exemplo no chat do espaço 3
  insert into public.messages (interest_id, sender_id, content, created_at)
  select
    i.id,
    company_id,
    'Olá! Tenho muito interesse no seu terreno em BH. Poderia me contar mais sobre a infraestrutura elétrica disponível no local?',
    now() - interval '2 days'
  from public.interests i
  where i.space_id = space3_id and i.company_id = company_id;

  insert into public.messages (interest_id, sender_id, content, created_at)
  select
    i.id,
    owner_id,
    'Boa tarde! Sim, temos medidor trifásico e a subestação fica a 500m. Posso enviar fotos da entrada de energia se precisar.',
    now() - interval '1 day 20 hours'
  from public.interests i
  where i.space_id = space3_id and i.company_id = company_id;

  insert into public.messages (interest_id, sender_id, content, created_at)
  select
    i.id,
    company_id,
    'Perfeito! Por favor, envie as fotos. Também precisamos avaliar a resistência do solo — podemos agendar uma visita técnica essa semana?',
    now() - interval '1 day 15 hours'
  from public.interests i
  where i.space_id = space3_id and i.company_id = company_id;

end $$;

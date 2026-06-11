/* Dados de exemplo — São Paulo. Espelha as tabelas do doc 01-modelagem-dados.md */
(function () {
  'use strict';

  globalThis.SEED = function () {
    const days = (n) => new Date(Date.now() + n * 864e5).toISOString();

    return {
      schema: 1,
      seq: 100,
      clock_skew_ms: 0, // relógio virtual do simulador

      places: [
        // ─── Missão Centro Histórico ───
        { id: 'p1', photo_url: 'https://picsum.photos/seed/tq-p1/640/800', name: 'Theatro Municipal', emoji: '🎭', category: 'historico',
          description: 'Palco da Semana de Arte Moderna de 1922, joia arquitetônica inspirada na Ópera de Paris.',
          address: 'Praça Ramos de Azevedo, s/n', city: 'São Paulo',
          lat: -23.5451, lng: -46.6382, radius_m: 100, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p2', photo_url: 'https://picsum.photos/seed/tq-p2/640/800', name: 'Catedral da Sé', emoji: '⛪', category: 'historico',
          description: 'Marco zero da cidade e uma das maiores catedrais neogóticas do mundo.',
          address: 'Praça da Sé, s/n', city: 'São Paulo',
          lat: -23.5507, lng: -46.6342, radius_m: 120, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p3', photo_url: 'https://picsum.photos/seed/tq-p3/640/800', name: 'Pátio do Colégio', emoji: '🏛️', category: 'historico',
          description: 'Onde São Paulo nasceu, em 1554.',
          address: 'Praça Pátio do Colégio, 2', city: 'São Paulo',
          lat: -23.5480, lng: -46.6328, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },
        { id: 'p4', photo_url: 'https://picsum.photos/seed/tq-p4/640/800', name: 'Mosteiro de São Bento', emoji: '🛐', category: 'historico',
          description: 'Canto gregoriano aos domingos e o famoso pão dos monges.',
          address: 'Largo de São Bento, s/n', city: 'São Paulo',
          lat: -23.5440, lng: -46.6343, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },
        { id: 'p5', photo_url: 'https://picsum.photos/seed/tq-p5/640/800', name: 'Edifício Martinelli', emoji: '🏢', category: 'historico',
          description: 'O primeiro arranha-céu do Brasil, com terraço panorâmico.',
          address: 'Av. São João, 35', city: 'São Paulo',
          lat: -23.5457, lng: -46.6364, radius_m: 80, base_points: 30,
          visibility: 'always', status: 'active' },

        // ─── Rota da Paulista ───
        { id: 'p6', photo_url: 'https://picsum.photos/seed/tq-p6/640/800', name: 'MASP', emoji: '🖼️', category: 'cultura',
          description: 'O museu suspenso mais icônico da América Latina.',
          address: 'Av. Paulista, 1578', city: 'São Paulo',
          lat: -23.5614, lng: -46.6559, radius_m: 100, base_points: 40,
          visibility: 'always', status: 'active' },
        { id: 'p7', photo_url: 'https://picsum.photos/seed/tq-p7/640/800', name: 'IMS Paulista', emoji: '📷', category: 'cultura',
          description: 'Fotografia, cinema e música no coração da avenida.',
          address: 'Av. Paulista, 2424', city: 'São Paulo',
          lat: -23.5677, lng: -46.6492, radius_m: 80, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p8', photo_url: 'https://picsum.photos/seed/tq-p8/640/800', name: 'Casa das Rosas', emoji: '🌹', category: 'cultura',
          description: 'Casarão de 1935 dedicado à poesia, cercado por roseiras.',
          address: 'Av. Paulista, 37', city: 'São Paulo',
          lat: -23.5705, lng: -46.6449, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },

        // ─── Avulsos ───
        { id: 'p9', photo_url: 'https://picsum.photos/seed/tq-p9/640/800', name: 'Mercado Municipal', emoji: '🥪', category: 'gastronomia',
          description: 'O Mercadão: pastel de bacalhau e sanduíche de mortadela obrigatórios.',
          address: 'R. da Cantareira, 306', city: 'São Paulo',
          lat: -23.5416, lng: -46.6294, radius_m: 120, base_points: 50,
          visibility: 'always', status: 'active' },
        { id: 'p10', photo_url: 'https://picsum.photos/seed/tq-p10/640/800', name: 'Beco do Batman', emoji: '🎨', category: 'cultura',
          description: 'Galeria de arte urbana a céu aberto na Vila Madalena.',
          address: 'R. Gonçalo Afonso, s/n', city: 'São Paulo',
          lat: -23.5567, lng: -46.6913, radius_m: 100, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p11', photo_url: 'https://picsum.photos/seed/tq-p11/640/800', name: 'Mirante Sesc 9 de Julho', emoji: '🌆', category: 'natureza',
          description: 'Vista panorâmica gratuita do centro novo.',
          address: 'R. 24 de Maio, 109', city: 'São Paulo',
          lat: -23.5448, lng: -46.6420, radius_m: 80, base_points: 50,
          visibility: 'always', status: 'active' },
        { id: 'p12', photo_url: 'https://picsum.photos/seed/tq-p12/640/800', name: 'Parque Ibirapuera', emoji: '🌳', category: 'natureza',
          description: 'O parque mais famoso da cidade — entre pelo portão 10.',
          address: 'Av. Pedro Álvares Cabral, s/n', city: 'São Paulo',
          lat: -23.5874, lng: -46.6576, radius_m: 300, base_points: 20,
          visibility: 'always', status: 'active' },

        // ─── Festival de Inverno (missão futura → estado "bloqueado") ───
        { id: 'p13', photo_url: 'https://picsum.photos/seed/tq-p13/640/800', name: 'Palco do Festival — Anhangabaú', emoji: '🎪', category: 'evento',
          description: 'Palco principal do Festival de Inverno no Vale do Anhangabaú.',
          address: 'Vale do Anhangabaú, s/n', city: 'São Paulo',
          lat: -23.5447, lng: -46.6388, radius_m: 150, base_points: 40,
          visibility: 'mission_only', status: 'active' },
        { id: 'p14', photo_url: 'https://picsum.photos/seed/tq-p14/640/800', name: 'Vila Gastronômica — Praça das Artes', emoji: '🍲', category: 'evento',
          description: 'Food trucks e chefs convidados durante o festival.',
          address: 'Av. São João, 281', city: 'São Paulo',
          lat: -23.5435, lng: -46.6398, radius_m: 100, base_points: 30,
          visibility: 'mission_only', status: 'active' },
      ],

      achievements: [
        { id: 'm1', cover_image_url: 'https://picsum.photos/seed/tq-m1/800/640', name: 'Missão Centro Histórico', badge: '🏛️',
          description: 'Visite os 5 marcos fundadores de São Paulo e desbloqueie o badge de historiador.',
          bonus_points: 200, min_required: null, is_sequential: false,
          status: 'active', starts_at: null, ends_at: null, city: 'São Paulo' },
        { id: 'm2', cover_image_url: 'https://picsum.photos/seed/tq-m2/800/640', name: 'Rota da Paulista', badge: '🎨',
          description: 'Um mergulho cultural na avenida mais famosa do Brasil.',
          bonus_points: 120, min_required: null, is_sequential: false,
          status: 'active', starts_at: null, ends_at: null, city: 'São Paulo' },
        { id: 'm3', cover_image_url: 'https://picsum.photos/seed/tq-m3/800/640', name: 'Festival de Inverno', badge: '❄️',
          description: 'Missão sazonal: viva o festival no centro da cidade.',
          bonus_points: 150, min_required: null, is_sequential: false,
          status: 'active', starts_at: days(20), ends_at: days(40), city: 'São Paulo' },
      ],

      achievement_places: [
        { achievement_id: 'm1', place_id: 'p1', sort_order: 0 },
        { achievement_id: 'm1', place_id: 'p2', sort_order: 1 },
        { achievement_id: 'm1', place_id: 'p3', sort_order: 2 },
        { achievement_id: 'm1', place_id: 'p4', sort_order: 3 },
        { achievement_id: 'm1', place_id: 'p5', sort_order: 4 },
        { achievement_id: 'm2', place_id: 'p6', sort_order: 0 },
        { achievement_id: 'm2', place_id: 'p7', sort_order: 1 },
        { achievement_id: 'm2', place_id: 'p8', sort_order: 2 },
        { achievement_id: 'm3', place_id: 'p13', sort_order: 0 },
        { achievement_id: 'm3', place_id: 'p14', sort_order: 1 },
      ],

      // Estado do usuário demo (único usuário, sem auth no protótipo)
      checkins: [],
      user_achievements: [],
      ledger: [],

      // ─── Social: amigos, pedidos e sugestões ───
      // status: 'friend' | 'request_in' | 'suggested' | 'requested_out' | 'none'
      people: [
        { id: 'f1', name: 'Marina Costa', hue: 340, points: 480, mutual: 12, status: 'friend' },
        { id: 'f2', name: 'Rafael Lima', hue: 210, points: 320, mutual: 8, status: 'friend' },
        { id: 'f3', name: 'Júlia Severo', hue: 270, points: 1280, mutual: 21, status: 'friend' },
        { id: 'f4', name: 'Lucas Andrade', hue: 150, points: 95, mutual: 4, status: 'friend' },
        { id: 'r1', name: 'Bruno Tavares', hue: 25, points: 510, mutual: 3, status: 'request_in' },
        { id: 'r2', name: 'Ana Beatriz', hue: 300, points: 850, mutual: 5, status: 'request_in' },
        { id: 's1', name: 'Pedro Sales', hue: 190, points: 210, mutual: 2, status: 'suggested' },
        { id: 's2', name: 'Carla Mendes', hue: 45, points: 1620, mutual: 7, status: 'suggested' },
        { id: 's3', name: 'Tiago Nunes', hue: 110, points: 60, mutual: 1, status: 'suggested' },
      ],

      // ─── Feed social (posts de amigos; seus check-ins entram ao vivo) ───
      posts: [
        { id: 'po1', person_id: 'f3', likes: 125, comments: 1, liked: false,
          text: 'Fechei a Missão Centro Histórico! 5/5 locais e badge novo na coleção 🏛️✨ Bora pra próxima!',
          photo_url: 'https://picsum.photos/seed/tq-m1/800/500', ts: Date.now() - 2 * 36e5 },
        { id: 'po2', person_id: 'f1', likes: 47, comments: 0, liked: false,
          text: 'Pôr do sol no Mirante 9 de Julho pra fechar o dia. Mais +50 PinPoints na conta 🌇',
          photo_url: 'https://picsum.photos/seed/tq-p11/800/500', ts: Date.now() - 7 * 36e5 },
        { id: 'po3', person_id: 'f2', likes: 18, comments: 2, liked: false,
          text: 'Sanduíche de mortadela no Mercadão = o check-in mais gostoso da vida 🥪',
          photo_url: 'https://picsum.photos/seed/tq-p9/800/500', ts: Date.now() - 26 * 36e5 },
      ],
      event_likes: {},
    };
  };
})();

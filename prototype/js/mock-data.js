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
        { id: 'p1', name: 'Theatro Municipal', emoji: '🎭', category: 'historico',
          description: 'Palco da Semana de Arte Moderna de 1922, joia arquitetônica inspirada na Ópera de Paris.',
          address: 'Praça Ramos de Azevedo, s/n', city: 'São Paulo',
          lat: -23.5451, lng: -46.6382, radius_m: 100, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p2', name: 'Catedral da Sé', emoji: '⛪', category: 'historico',
          description: 'Marco zero da cidade e uma das maiores catedrais neogóticas do mundo.',
          address: 'Praça da Sé, s/n', city: 'São Paulo',
          lat: -23.5507, lng: -46.6342, radius_m: 120, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p3', name: 'Pátio do Colégio', emoji: '🏛️', category: 'historico',
          description: 'Onde São Paulo nasceu, em 1554.',
          address: 'Praça Pátio do Colégio, 2', city: 'São Paulo',
          lat: -23.5480, lng: -46.6328, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },
        { id: 'p4', name: 'Mosteiro de São Bento', emoji: '🛐', category: 'historico',
          description: 'Canto gregoriano aos domingos e o famoso pão dos monges.',
          address: 'Largo de São Bento, s/n', city: 'São Paulo',
          lat: -23.5440, lng: -46.6343, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },
        { id: 'p5', name: 'Edifício Martinelli', emoji: '🏢', category: 'historico',
          description: 'O primeiro arranha-céu do Brasil, com terraço panorâmico.',
          address: 'Av. São João, 35', city: 'São Paulo',
          lat: -23.5457, lng: -46.6364, radius_m: 80, base_points: 30,
          visibility: 'always', status: 'active' },

        // ─── Rota da Paulista ───
        { id: 'p6', name: 'MASP', emoji: '🖼️', category: 'cultura',
          description: 'O museu suspenso mais icônico da América Latina.',
          address: 'Av. Paulista, 1578', city: 'São Paulo',
          lat: -23.5614, lng: -46.6559, radius_m: 100, base_points: 40,
          visibility: 'always', status: 'active' },
        { id: 'p7', name: 'IMS Paulista', emoji: '📷', category: 'cultura',
          description: 'Fotografia, cinema e música no coração da avenida.',
          address: 'Av. Paulista, 2424', city: 'São Paulo',
          lat: -23.5677, lng: -46.6492, radius_m: 80, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p8', name: 'Casa das Rosas', emoji: '🌹', category: 'cultura',
          description: 'Casarão de 1935 dedicado à poesia, cercado por roseiras.',
          address: 'Av. Paulista, 37', city: 'São Paulo',
          lat: -23.5705, lng: -46.6449, radius_m: 80, base_points: 20,
          visibility: 'always', status: 'active' },

        // ─── Avulsos ───
        { id: 'p9', name: 'Mercado Municipal', emoji: '🥪', category: 'gastronomia',
          description: 'O Mercadão: pastel de bacalhau e sanduíche de mortadela obrigatórios.',
          address: 'R. da Cantareira, 306', city: 'São Paulo',
          lat: -23.5416, lng: -46.6294, radius_m: 120, base_points: 50,
          visibility: 'always', status: 'active' },
        { id: 'p10', name: 'Beco do Batman', emoji: '🎨', category: 'cultura',
          description: 'Galeria de arte urbana a céu aberto na Vila Madalena.',
          address: 'R. Gonçalo Afonso, s/n', city: 'São Paulo',
          lat: -23.5567, lng: -46.6913, radius_m: 100, base_points: 30,
          visibility: 'always', status: 'active' },
        { id: 'p11', name: 'Mirante Sesc 9 de Julho', emoji: '🌆', category: 'natureza',
          description: 'Vista panorâmica gratuita do centro novo.',
          address: 'R. 24 de Maio, 109', city: 'São Paulo',
          lat: -23.5448, lng: -46.6420, radius_m: 80, base_points: 50,
          visibility: 'always', status: 'active' },
        { id: 'p12', name: 'Parque Ibirapuera', emoji: '🌳', category: 'natureza',
          description: 'O parque mais famoso da cidade — entre pelo portão 10.',
          address: 'Av. Pedro Álvares Cabral, s/n', city: 'São Paulo',
          lat: -23.5874, lng: -46.6576, radius_m: 300, base_points: 20,
          visibility: 'always', status: 'active' },

        // ─── Festival de Inverno (missão futura → estado "bloqueado") ───
        { id: 'p13', name: 'Palco do Festival — Anhangabaú', emoji: '🎪', category: 'evento',
          description: 'Palco principal do Festival de Inverno no Vale do Anhangabaú.',
          address: 'Vale do Anhangabaú, s/n', city: 'São Paulo',
          lat: -23.5447, lng: -46.6388, radius_m: 150, base_points: 40,
          visibility: 'mission_only', status: 'active' },
        { id: 'p14', name: 'Vila Gastronômica — Praça das Artes', emoji: '🍲', category: 'evento',
          description: 'Food trucks e chefs convidados durante o festival.',
          address: 'Av. São João, 281', city: 'São Paulo',
          lat: -23.5435, lng: -46.6398, radius_m: 100, base_points: 30,
          visibility: 'mission_only', status: 'active' },
      ],

      achievements: [
        { id: 'm1', name: 'Missão Centro Histórico', badge: '🏛️',
          description: 'Visite os 5 marcos fundadores de São Paulo e desbloqueie o badge de historiador.',
          bonus_points: 200, min_required: null, is_sequential: false,
          status: 'active', starts_at: null, ends_at: null, city: 'São Paulo' },
        { id: 'm2', name: 'Rota da Paulista', badge: '🎨',
          description: 'Um mergulho cultural na avenida mais famosa do Brasil.',
          bonus_points: 120, min_required: null, is_sequential: false,
          status: 'active', starts_at: null, ends_at: null, city: 'São Paulo' },
        { id: 'm3', name: 'Festival de Inverno', badge: '❄️',
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
    };
  };
})();

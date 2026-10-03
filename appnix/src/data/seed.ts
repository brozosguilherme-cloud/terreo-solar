import type { Achievement, Mission } from '../services/types';

/** Conteúdo inicial (São Paulo). Usado no modo demo e pelo script `npm run seed`. */
export const SEED_MISSIONS: Mission[] = [
  { id: 'masp', title: 'MASP', description: 'O vão livre mais famoso do Brasil, na Avenida Paulista. Registre o icônico prédio vermelho suspenso.', points: 300, category: 'turismo', lat: -23.561414, lng: -46.655881, completions: 0, matchPercentage: 96 },
  { id: 'pinacoteca', title: 'Pinacoteca', description: 'Museu de arte mais antigo da cidade, em um prédio histórico no Jardim da Luz.', points: 250, category: 'turismo', lat: -23.534222, lng: -46.633841, completions: 0, matchPercentage: 88 },
  { id: 'catedral-se', title: 'Catedral da Sé', description: 'Marco zero de São Paulo e uma das maiores catedrais neogóticas do mundo.', points: 200, category: 'turismo', lat: -23.551038, lng: -46.634206, completions: 0, isDoublePoints: true, timeLimit: 'Até domingo' },
  { id: 'patio-colegio', title: 'Pátio do Colégio', description: 'Onde a cidade nasceu, em 1554. Um mergulho na história paulistana.', points: 150, category: 'turismo', lat: -23.548155, lng: -46.632486, completions: 0 },
  { id: 'theatro-municipal', title: 'Theatro Municipal', description: 'Palco da Semana de Arte Moderna de 1922, inspirado na Ópera de Paris.', points: 250, category: 'turismo', lat: -23.545235, lng: -46.638631, completions: 0 },
  { id: 'mercadao', title: 'Mercado Municipal', description: 'Prove o lendário sanduíche de mortadela e o pastel de bacalhau sob os vitrais.', points: 300, category: 'gastronomia', lat: -23.541838, lng: -46.629716, completions: 0, matchPercentage: 92 },
  { id: 'liberdade', title: 'Feira da Liberdade', description: 'Gastronomia japonesa, chinesa e coreana no bairro oriental mais famoso do país.', points: 200, category: 'gastronomia', lat: -23.555474, lng: -46.635546, completions: 0, timeLimit: 'Fins de semana' },
  { id: 'bixiga', title: 'Cantinas do Bixiga', description: 'O berço da cozinha ítalo-paulistana. Massa fresca e tradição na Rua 13 de Maio.', points: 200, category: 'gastronomia', lat: -23.557904, lng: -46.646326, completions: 0 },
  { id: 'ibirapuera', title: 'Parque Ibirapuera', description: 'O pulmão verde da cidade, com arquitetura de Niemeyer e paisagismo de Burle Marx.', points: 200, category: 'explorador', lat: -23.587416, lng: -46.657634, completions: 0, matchPercentage: 90 },
  { id: 'beco-batman', title: 'Beco do Batman', description: 'Galeria de grafite a céu aberto na Vila Madalena. Cada visita, uma obra nova.', points: 250, category: 'explorador', lat: -23.556089, lng: -46.687043, completions: 0, isDoublePoints: true, timeLimit: '48 h' },
  { id: 'edificio-italia', title: 'Terraço Itália', description: 'Vista 360º do centro do alto de um dos prédios mais altos da cidade.', points: 350, category: 'explorador', lat: -23.545570, lng: -46.643310, completions: 0 },
  { id: 'minhocao', title: 'Parque Minhocão', description: 'O elevado que vira parque aos fins de semana. Caminhe sobre a cidade.', points: 150, category: 'explorador', lat: -23.538560, lng: -46.651660, completions: 0 },
];

export const SEED_ACHIEVEMENTS: Achievement[] = [
  { id: 'circuito-historico', title: 'Circuito Histórico', description: 'Percorra o centro onde São Paulo nasceu: do Pátio do Colégio ao Theatro Municipal.', requiredMissions: ['patio-colegio', 'catedral-se', 'theatro-municipal', 'pinacoteca'], rewardPoints: 500, icon: 'landmark' },
  { id: 'rota-gastronomica', title: 'Rota Gastronômica', description: 'Do Mercadão ao Bixiga, um tour pelos sabores que definem a cidade.', requiredMissions: ['mercadao', 'liberdade', 'bixiga'], rewardPoints: 400, icon: 'utensils' },
  { id: 'arte-e-vistas', title: 'Arte & Vistas', description: 'Grafite, museus e mirantes: a São Paulo que se vê de cima e nos muros.', requiredMissions: ['masp', 'beco-batman', 'edificio-italia', 'minhocao'], rewardPoints: 600, icon: 'sparkles' },
];

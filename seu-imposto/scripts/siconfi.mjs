// Agrega as linhas do RREO Anexo 02 (despesa por função/subfunção) da União
// nas áreas exibidas no site. Sem rede — testável com dados de exemplo.

export const norm = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// funções de governo (Portaria MOG 42/1999) → áreas do site
const FUNCOES = {
  'previdencia social': 'previdencia',
  'saude': 'saude',
  'educacao': 'educacao',
  'assistencia social': 'assistencia',
  'trabalho': 'trabalho',
  'defesa nacional': 'defesa',
  'seguranca publica': 'defesa',
  'transporte': 'infraestrutura',
  'urbanismo': 'infraestrutura',
  'habitacao': 'infraestrutura',
  'saneamento': 'infraestrutura',
  'energia': 'infraestrutura',
  'comunicacoes': 'infraestrutura',
  'agricultura': 'economia',
  'organizacao agraria': 'economia',
  'gestao ambiental': 'economia',
  'ciencia e tecnologia': 'economia',
  'industria': 'economia',
  'comercio e servicos': 'economia',
  'legislativa': 'poderes',
  'judiciaria': 'poderes',
  'essencial a justica': 'poderes',
  'administracao': 'poderes',
  'relacoes exteriores': 'poderes',
  'direitos da cidadania': 'poderes',
  'cultura': 'poderes',
  'desporto e lazer': 'poderes',
};

export const AREAS = {
  previdencia: 'Previdência (INSS e servidores)',
  divida: 'Dívida pública (juros e amortização)',
  repasses: 'Repasses a estados, municípios e outros encargos',
  assistencia: 'Assistência social (Bolsa Família, BPC)',
  saude: 'Saúde',
  poderes: 'Poderes, administração e outros',
  educacao: 'Educação',
  defesa: 'Defesa e segurança pública',
  trabalho: 'Trabalho (seguro-desemprego, abono)',
  infraestrutura: 'Infraestrutura, transporte e cidades',
  economia: 'Agro, ciência, indústria e meio ambiente',
};

/** Coluna de despesas liquidadas acumuladas no ano (ex.: "DESPESAS LIQUIDADAS ATÉ O BIMESTRE (d)"). */
const ehColunaLiquidada = (coluna) => {
  const c = norm(coluna);
  return c.includes('liquidad') && c.includes('ate o bimestre') && !c.includes('%') && !c.includes('saldo');
};

/**
 * @param {Array<{conta:string, coluna:string, valor:number}>} items linhas da API
 * @returns {{areas: Array<{id,nome,valor}>}} valores em R$ bilhões
 * @throws se os dados não tiverem a estrutura esperada
 */
export function agregarGastos(items) {
  // a mesma conta pode aparecer em blocos diferentes (com e sem intra-orçamentárias): fica o maior valor
  const porConta = new Map();
  for (const it of items) {
    if (!ehColunaLiquidada(it.coluna)) continue;
    const conta = norm(it.conta);
    const valor = Number(it.valor) || 0;
    porConta.set(conta, Math.max(porConta.get(conta) ?? 0, valor));
  }
  const v = (nome) => porConta.get(nome) ?? 0;

  const somas = Object.fromEntries(Object.keys(AREAS).map((k) => [k, 0]));
  let funcoesEncontradas = 0;
  for (const [funcao, area] of Object.entries(FUNCOES)) {
    if (porConta.has(funcao)) {
      funcoesEncontradas++;
      somas[area] += v(funcao);
    }
  }

  const encargos = v('encargos especiais');
  const refinanciamento = v('refinanciamento da divida interna') + v('refinanciamento da divida externa');
  const servico = v('servico da divida interna') + v('servico da divida externa');

  if (funcoesEncontradas < 15) throw new Error(`só ${funcoesEncontradas} funções de governo encontradas`);
  if (!encargos || !servico || !refinanciamento) {
    throw new Error('não foi possível separar Encargos Especiais em dívida, refinanciamento e repasses');
  }
  somas.divida = servico;
  somas.repasses = Math.max(0, encargos - refinanciamento - servico);

  const areas = Object.entries(somas)
    .map(([id, valor]) => ({ id, nome: AREAS[id], valor: Math.round(valor / 1e7) / 100 }))
    .filter((a) => a.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  return { areas };
}

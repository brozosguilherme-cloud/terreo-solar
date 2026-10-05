/* Regras de cálculo da calculadora (sem DOM). Usado no browser e nos testes:
 *   browser → window.SeuImposto     node → require('./calc.js') */
(function (root) {
  'use strict';

  const r2 = (n) => Math.round(n * 100) / 100;

  /** INSS progressivo (empregado CLT), limitado ao teto da última faixa. */
  function inssMensal(bruto, inss) {
    let total = 0;
    let anterior = 0;
    for (const f of inss.faixas) {
      if (bruto <= anterior) break;
      total += (Math.min(bruto, f.ate) - anterior) * f.aliquota;
      anterior = f.ate;
    }
    return r2(total);
  }

  function irpfTabela(base, faixas) {
    if (base <= 0) return 0;
    const f = faixas.find((x) => x.ate === null || base <= x.ate);
    return Math.max(0, base * f.aliquota - f.deducao);
  }

  /** IRRF mensal: melhor entre deduções legais e desconto simplificado, com a redução de 2026. */
  function irpfMensal(bruto, inss, dependentes, irpf) {
    const legal = irpfTabela(bruto - inss - dependentes * irpf.deducao_dependente, irpf.faixas);
    const simplificado = irpfTabela(bruto - irpf.desconto_simplificado, irpf.faixas);
    const imposto = Math.min(legal, simplificado);

    const red = irpf.reducao;
    let reducao = 0;
    if (red) {
      if (bruto <= red.isencao_ate) reducao = red.reducao_maxima;
      else if (bruto <= red.parcial_ate) reducao = red.constante - red.fator * bruto;
    }
    return r2(Math.max(0, imposto - Math.max(0, reducao)));
  }

  /** Média ponderada da carga tributária embutida no consumo. */
  function cargaConsumo(consumo) {
    const peso = consumo.categorias.reduce((s, c) => s + c.peso, 0);
    return consumo.categorias.reduce((s, c) => s + c.peso * c.carga, 0) / peso;
  }

  /**
   * @param {{bruto:number, dependentes?:number, gastoPct?:number, ipva?:number, iptu?:number}} e
   *   bruto = salário bruto mensal; gastoPct = fração do salário líquido gasta em consumo (0–1);
   *   ipva/iptu = valores anuais.
   */
  function calcular(e, params) {
    const bruto = Math.max(0, Number(e.bruto) || 0);
    const dependentes = Math.max(0, Math.floor(Number(e.dependentes) || 0));
    const gastoPct = Math.min(1, Math.max(0, e.gastoPct ?? 0.85));
    const meses = 13; // 12 salários + 13º

    const inss = inssMensal(bruto, params.inss);
    const ir = irpfMensal(bruto, inss, dependentes, params.irpf);
    const liquido = bruto - inss - ir;

    const carga = cargaConsumo(params.consumo);
    const gastoAnual = liquido * meses * gastoPct;
    const consumoCats = params.consumo.categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      valor: r2(gastoAnual * (c.peso / params.consumo.categorias.reduce((s, x) => s + x.peso, 0)) * c.carga),
    }));

    const anual = {
      ir: r2(ir * meses),
      inss: r2(inss * meses),
      consumo: r2(consumoCats.reduce((s, c) => s + c.valor, 0)),
      patrimonio: r2((Number(e.ipva) || 0) + (Number(e.iptu) || 0)),
    };
    const total = r2(anual.ir + anual.inss + anual.consumo + anual.patrimonio);
    const rendaAnual = bruto * meses;
    const cargaEfetiva = rendaAnual > 0 ? total / rendaAnual : 0;

    return {
      mensal: { bruto, inss, ir, liquido: r2(liquido) },
      anual,
      consumoCats,
      cargaConsumo: carga,
      total,
      totalMensal: r2(total / 12),
      rendaAnual,
      cargaEfetiva,
      diasTrabalhados: Math.round(Math.min(1, cargaEfetiva) * 365),
    };
  }

  /** Divide um valor entre as áreas do orçamento, proporcionalmente ao gasto de cada uma. */
  function distribuir(total, areas) {
    const soma = areas.reduce((s, a) => s + a.valor, 0);
    return areas
      .map((a) => ({ ...a, share: soma ? a.valor / soma : 0, seu: soma ? r2((total * a.valor) / soma) : 0 }))
      .sort((a, b) => b.valor - a.valor);
  }

  const api = { inssMensal, irpfMensal, cargaConsumo, calcular, distribuir };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SeuImposto = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

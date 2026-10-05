// Roda sem dependências:  node --test seu-imposto/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { agregarGastos } from '../scripts/siconfi.mjs';

const require = createRequire(import.meta.url);
const S = require('../js/calc.js');
const params = JSON.parse(readFileSync(new URL('../data/parametros.json', import.meta.url)));
const perto = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test('INSS progressivo', () => {
  perto(S.inssMensal(1518, params.inss), 113.85);
  // 1518×7,5% + 1275,88×9% + 1396,95×12% + 482,17×14%
  perto(S.inssMensal(4673, params.inss), 113.85 + 114.83 + 167.63 + 67.50);
  // acima do teto, contribuição fica limitada
  assert.equal(S.inssMensal(20000, params.inss), S.inssMensal(8157.41, params.inss));
});

test('IR zerado até R$ 5 mil (redução 2026)', () => {
  for (const bruto of [2000, 3500, 4999.99, 5000]) {
    const inss = S.inssMensal(bruto, params.inss);
    assert.equal(S.irpfMensal(bruto, inss, 0, params.irpf), 0, `bruto ${bruto}`);
  }
});

test('IR com redução parcial entre R$ 5 mil e R$ 7.350', () => {
  const bruto = 6000;
  const inss = S.inssMensal(bruto, params.inss);
  const semReducao = Math.min(
    (bruto - inss) * 0.275 - 908.73,
    (bruto - 607.2) * 0.275 - 908.73,
  );
  const reducao = 978.62 - 0.133145 * 6000;
  perto(S.irpfMensal(bruto, inss, 0, params.irpf), semReducao - reducao);
});

test('IR sem redução acima de R$ 7.350 e dependentes reduzem o imposto', () => {
  const bruto = 10000;
  const inss = S.inssMensal(bruto, params.inss);
  perto(S.irpfMensal(bruto, inss, 0, params.irpf), (bruto - inss) * 0.275 - 908.73);
  assert.ok(S.irpfMensal(bruto, inss, 2, params.irpf) < S.irpfMensal(bruto, inss, 0, params.irpf));
});

test('calcular soma os componentes e usa 13 meses', () => {
  const r = S.calcular({ bruto: 8000, gastoPct: 0.8, ipva: 1200, iptu: 800 }, params);
  perto(r.anual.inss, r.mensal.inss * 13);
  perto(r.anual.ir, r.mensal.ir * 13);
  perto(r.anual.patrimonio, 2000);
  perto(r.anual.consumo, r.mensal.liquido * 13 * 0.8 * S.cargaConsumo(params.consumo), 0.05);
  perto(r.total, r.anual.ir + r.anual.inss + r.anual.consumo + r.anual.patrimonio);
  assert.ok(r.cargaEfetiva > 0.2 && r.cargaEfetiva < 0.5);
});

test('salário zero não quebra', () => {
  const r = S.calcular({ bruto: 0 }, params);
  assert.equal(r.total, 0);
  assert.equal(r.diasTrabalhados, 0);
});

test('distribuir reparte o total proporcionalmente', () => {
  const linhas = S.distribuir(1000, [{ id: 'a', valor: 1 }, { id: 'b', valor: 3 }]);
  assert.deepEqual(linhas.map((l) => [l.id, l.seu]), [['b', 750], ['a', 250]]);
});

test('agregarGastos: agrupa funções e separa Encargos Especiais', () => {
  const col = 'DESPESAS LIQUIDADAS ATÉ O BIMESTRE (d)';
  const funcoes = ['Previdência Social', 'Saúde', 'Educação', 'Assistência Social', 'Trabalho', 'Defesa Nacional',
    'Segurança Pública', 'Transporte', 'Urbanismo', 'Agricultura', 'Ciência e Tecnologia', 'Legislativa',
    'Judiciária', 'Administração', 'Gestão Ambiental', 'Cultura'];
  const items = [
    ...funcoes.map((conta) => ({ conta, coluna: col, valor: 10e9 })),
    { conta: 'Saúde', coluna: 'DOTAÇÃO INICIAL', valor: 999e9 }, // coluna ignorada
    { conta: 'Encargos Especiais', coluna: col, valor: 2000e9 },
    { conta: 'Refinanciamento da Dívida Interna', coluna: col, valor: 900e9 },
    { conta: 'Serviço da Dívida Interna', coluna: col, valor: 600e9 },
    { conta: 'Serviço da Dívida Externa', coluna: col, valor: 50e9 },
  ];
  const { areas } = agregarGastos(items);
  const por = Object.fromEntries(areas.map((a) => [a.id, a.valor]));
  assert.equal(por.saude, 10);
  assert.equal(por.defesa, 20);
  assert.equal(por.poderes, 40);
  assert.equal(por.divida, 650);
  assert.equal(por.repasses, 450);
  assert.equal(areas[0].id, 'divida');
});

test('agregarGastos falha se a estrutura não for a esperada', () => {
  assert.throws(() => agregarGastos([{ conta: 'Saúde', coluna: 'DESPESAS LIQUIDADAS ATÉ O BIMESTRE', valor: 1 }]));
});

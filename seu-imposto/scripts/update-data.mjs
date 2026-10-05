#!/usr/bin/env node
// Busca as despesas da União por função (RREO Anexo 02, 6º bimestre) na API do SICONFI
// e grava seu-imposto/data/gastos.json. Se algo falhar, o arquivo atual é mantido.
//
//   node seu-imposto/scripts/update-data.mjs            → último ano fechado
//   node seu-imposto/scripts/update-data.mjs 2024       → ano específico
//   node seu-imposto/scripts/update-data.mjs --dry-run  → só mostra o resultado

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { agregarGastos } from './siconfi.mjs';

const API = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo';
const SAIDA = fileURLToPath(new URL('../data/gastos.json', import.meta.url));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const anoArg = args.find((a) => /^\d{4}$/.test(a));

async function buscarAnexo02(ano) {
  const items = [];
  let offset = 0;
  for (;;) {
    const url = new URL(API);
    Object.entries({
      an_exercicio: ano,
      nr_periodo: 6,
      co_tipo_demonstrativo: 'RREO',
      no_anexo: 'RREO-Anexo 02',
      co_esfera: 'U',
      id_ente: 1,
      offset,
    }).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`SICONFI respondeu HTTP ${res.status} para ${url}`);
    const page = await res.json();
    items.push(...(page.items ?? []));
    if (!page.hasMore || !page.items?.length) break;
    offset += page.items.length;
  }
  return items;
}

async function main() {
  const atual = new Date().getFullYear();
  const anos = anoArg ? [Number(anoArg)] : [atual - 1, atual - 2];

  for (const ano of anos) {
    console.log(`→ buscando RREO Anexo 02 da União, exercício ${ano}…`);
    const items = await buscarAnexo02(ano);
    console.log(`  ${items.length} linhas recebidas`);
    if (!items.length) continue;

    const { areas } = agregarGastos(items);
    const dados = {
      estimado: false,
      exercicio: ano,
      atualizado_em: new Date().toISOString(),
      fonte: `Tesouro Nacional — SICONFI, RREO ${ano} (Anexo 02, despesas liquidadas por função, União).`,
      unidade: 'R$ bilhões',
      areas,
    };
    console.table(areas.map((a) => ({ área: a.nome, 'R$ bi': a.valor })));
    if (dryRun) return console.log('(dry-run: nada gravado)');
    await writeFile(SAIDA, JSON.stringify(dados, null, 2) + '\n');
    return console.log(`✓ gravado em ${SAIDA}`);
  }
  throw new Error(`nenhum dado encontrado para ${anos.join(', ')}`);
}

main().catch((err) => {
  console.error(`✗ atualização falhou, gastos.json não foi alterado: ${err.message}`);
  process.exit(1);
});

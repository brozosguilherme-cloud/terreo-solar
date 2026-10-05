#!/usr/bin/env node
// Gera dist/seu-imposto.html: um único arquivo com CSS, JS e dados embutidos,
// que abre com dois cliques (sem servidor). Rode de novo após update-data.mjs.
//
//   node seu-imposto/scripts/build-single.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const raiz = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const ler = (p) => readFile(raiz(p), 'utf8');
// impede que "</script>" dentro do conteúdo feche a tag antes da hora
const seguro = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');

let html = await ler('index.html');
const css = await ler('styles.css');
const calc = await ler('js/calc.js');
const app = await ler('js/app.js');
const icone = `data:image/svg+xml,${encodeURIComponent((await ler('icon.svg')).trim())}`;
const dados = {
  parametros: JSON.parse(await ler('data/parametros.json')),
  gastos: JSON.parse(await ler('data/gastos.json')),
};

const trocar = (de, para) => {
  if (!html.includes(de)) throw new Error(`trecho não encontrado em index.html: ${de}`);
  html = html.replace(de, () => para);
};
trocar('<link rel="stylesheet" href="styles.css" />', `<style>\n${seguro(css)}</style>`);
trocar('href="icon.svg"', `href="${icone}"`);
trocar('src="icon.svg"', `src="${icone}"`);
trocar(
  '<script src="js/calc.js"></script>',
  `<script>window.SEU_IMPOSTO_DATA = ${JSON.stringify(dados).replace(/</g, '\\u003c')};</script>\n  <script>\n${seguro(calc)}</script>`,
);
trocar('<script src="js/app.js"></script>', `<script>\n${seguro(app)}</script>`);

await mkdir(raiz('dist'), { recursive: true });
await writeFile(raiz('dist/seu-imposto.html'), html);
console.log(`✓ ${raiz('dist/seu-imposto.html')} (${Math.round(html.length / 1024)} KB)`);

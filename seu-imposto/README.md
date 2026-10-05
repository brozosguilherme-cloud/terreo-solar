# Seu Imposto: calculadora local

Mostra quanto do salário vira imposto (IR, INSS, tributos embutidos no consumo, IPVA/IPTU)
e para onde esse dinheiro vai, segundo o orçamento da União.
**Roda 100% na sua máquina**: HTML/CSS/JS puro, sem `npm install`, sem banco.

## Rodar

**Jeito mais fácil:** abra `dist/seu-imposto.html` com dois cliques. É um arquivo único, com tudo embutido.
Para regerá-lo depois de mudar código ou dados: `node seu-imposto/scripts/build-single.mjs`.

**Versão de desenvolvimento** (arquivos separados):

```bash
python3 -m http.server 8000 --directory seu-imposto
# ou: npx serve seu-imposto
# abra http://localhost:8000
```

> Precisa ser por um servidor local: abrindo o `index.html` com dois cliques o navegador bloqueia a leitura dos JSON.

## Atualizar os dados do orçamento (Tesouro Nacional)

```bash
node seu-imposto/scripts/update-data.mjs --dry-run   # só mostra o que viria
node seu-imposto/scripts/update-data.mjs             # grava data/gastos.json (último ano fechado)
node seu-imposto/scripts/update-data.mjs 2024        # ano específico
```

Requer Node 18+. Busca o **RREO Anexo 02** da União (despesas liquidadas por função de governo)
na API pública do **SICONFI** (`apidatalake.tesouro.gov.br`), agrupa em áreas e separa
"Encargos Especiais" em dívida pública e repasses, sem o refinanciamento da dívida.
Se a API falhar ou vier num formato inesperado, o arquivo atual não é alterado.
Enquanto o script não rodar, o site mostra valores aproximados com um aviso.

## Testes

```bash
node --test seu-imposto/test/*.test.mjs
```

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html`, `styles.css` | Página (tema claro/escuro, responsiva) |
| `js/calc.js` | Regras de cálculo, sem DOM (testado) |
| `js/app.js` | Interface: formulário, gráficos, tooltip |
| `data/parametros.json` | Tabelas de IR/INSS e carga média no consumo, que você edita quando mudarem |
| `data/gastos.json` | Gastos da União por área (gerado pelo script) |
| `scripts/update-data.mjs` | Atualizador via API do SICONFI |
| `scripts/build-single.mjs` | Gera `dist/seu-imposto.html` (arquivo único) |

## Próximos passos (quando quiser publicar)

- Publicar no GitHub Pages junto com o resto do repositório (`.github/workflows/deploy.yml`).
- Workflow agendado no GitHub Actions rodando o `update-data.mjs` todo mês.

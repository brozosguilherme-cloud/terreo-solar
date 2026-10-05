/* UI da calculadora: lê o formulário, chama SeuImposto.calcular e desenha os resultados. */
(function () {
  'use strict';
  const S = window.SeuImposto;
  const $ = (id) => document.getElementById(id);

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
  const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const bi = (v) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri` : `R$ ${num.format(v)} bi`);

  /** "4.500,50" → 4500.5 */
  const parseBRL = (s) => Number(String(s || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

  const TIPOS = [
    { key: 'ir', nome: 'Imposto de Renda', cor: 'var(--s1)' },
    { key: 'inss', nome: 'INSS', cor: 'var(--s2)' },
    { key: 'consumo', nome: 'Embutido no consumo', cor: 'var(--s3)' },
    { key: 'patrimonio', nome: 'IPVA e IPTU', cor: 'var(--s4)' },
  ];

  let params, gastos, modo = 'seu', ultimo;

  function lerEntrada() {
    return {
      bruto: parseBRL($('bruto').value),
      dependentes: Number($('dependentes').value),
      gastoPct: Number($('gasto').value) / 100,
      ipva: parseBRL($('ipva').value),
      iptu: parseBRL($('iptu').value),
    };
  }

  function render() {
    const r = S.calcular(lerEntrada(), params);
    ultimo = r;
    $('gasto-out').textContent = `${$('gasto').value}%`;
    $('total').textContent = brl0.format(r.total);
    $('total-mes').textContent = `≈ ${brl0.format(r.totalMensal)} por mês`;
    $('carga').textContent = pct.format(r.cargaEfetiva);

    const ano = new Date().getFullYear();
    const dia = new Date(ano, 0, Math.max(1, r.diasTrabalhados));
    $('dia-livre').textContent = r.diasTrabalhados ? dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '') : '—';
    $('dias').textContent = `${r.diasTrabalhados} dias de trabalho no ano`;

    // barra empilhada + legenda
    $('stack').innerHTML = TIPOS.map((t) =>
      `<span style="flex-grow:${r.anual[t.key]};background:${t.cor}" title="${t.nome}: ${brl0.format(r.anual[t.key])}"></span>`
    ).join('');
    $('stack').setAttribute('aria-label', TIPOS.map((t) => `${t.nome} ${brl0.format(r.anual[t.key])}`).join(', '));
    $('legend').innerHTML = TIPOS.map((t) => `
      <li>
        <span class="k"><i style="background:${t.cor}"></i>${t.nome}</span>
        <span class="v">${brl0.format(r.anual[t.key])}</span>
        <span class="p">${r.total ? pct.format(r.anual[t.key] / r.total) : '—'} do total</span>
      </li>`).join('');

    const cats = params.consumo.categorias;
    $('consumo-table').querySelector('tbody').innerHTML = r.consumoCats.map((c, i) =>
      `<tr><td>${c.nome}</td><td>${pct.format(cats[i].carga)}</td><td>${brl.format(c.valor)}</td></tr>`
    ).join('');

    renderBarras();
  }

  function renderBarras() {
    const linhas = S.distribuir(ultimo.total, gastos.areas);
    const max = Math.max(...linhas.map((l) => l.share));
    $('bars').innerHTML = linhas.map((l) => {
      const principal = modo === 'seu' ? brl0.format(l.seu) : bi(l.valor);
      return `
        <div class="bar-row" data-id="${l.id}" tabindex="0">
          <span class="name">${l.nome}</span>
          <span class="val">${principal}<small>${pct.format(l.share)}</small></span>
          <div class="track"><div class="fill" style="width:${max ? (l.share / max) * 100 : 0}%"></div></div>
        </div>`;
    }).join('');
    $('bars').querySelectorAll('.bar-row').forEach((el) => {
      const l = linhas.find((x) => x.id === el.dataset.id);
      const html = `<strong>${l.nome}</strong>${pct.format(l.share)} do orçamento · ${bi(l.valor)}<br>Sua parte: ${brl.format(l.seu)} por ano`;
      el.addEventListener('mousemove', (ev) => mostrarTooltip(html, ev.clientX, ev.clientY));
      el.addEventListener('mouseleave', esconderTooltip);
      el.addEventListener('focus', () => { const b = el.getBoundingClientRect(); mostrarTooltip(html, b.left + 16, b.top); });
      el.addEventListener('blur', esconderTooltip);
    });
  }

  function mostrarTooltip(html, x, y) {
    const t = $('tooltip');
    t.innerHTML = html;
    t.hidden = false;
    const w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = `${Math.min(window.innerWidth - w - 8, x + 14)}px`;
    t.style.top = `${Math.max(8, y - h - 12)}px`;
  }
  function esconderTooltip() { $('tooltip').hidden = true; }

  function formatarMoeda(input) {
    const digitos = input.value.replace(/\D/g, '');
    input.value = digitos ? (Number(digitos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  }

  function preencherMetodologia() {
    $('vig-ir').textContent = params.irpf.vigencia;
    $('vig-inss').textContent = params.inss.vigencia;
    $('carga-consumo').textContent = pct.format(S.cargaConsumo(params.consumo));
    $('exercicio').textContent = gastos.exercicio;
    $('estimado').hidden = !gastos.estimado;
    const quando = gastos.atualizado_em ? ` Última atualização: ${new Date(gastos.atualizado_em).toLocaleDateString('pt-BR')}.` : '';
    $('fonte').textContent = `Fonte atual: ${gastos.fonte}${quando}`;
  }

  function ligarEventos() {
    ['bruto', 'ipva', 'iptu'].forEach((id) => $(id).addEventListener('input', (e) => { formatarMoeda(e.target); render(); }));
    ['dependentes', 'gasto'].forEach((id) => $(id).addEventListener('input', render));
    document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
      const d = $('dependentes');
      d.value = Math.min(10, Math.max(0, Number(d.value) + Number(b.dataset.step)));
      render();
    }));
    document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
      modo = b.dataset.mode;
      document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      $('destino-sub').textContent = modo === 'seu'
        ? 'Seu imposto anual distribuído na mesma proporção dos gastos da União.'
        : 'Despesas liquidadas da União no ano, por área (sem refinanciamento da dívida).';
      renderBarras();
    }));
    $('theme-toggle').addEventListener('click', () => {
      const root = document.documentElement;
      const escuro = root.dataset.theme
        ? root.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = escuro ? 'light' : 'dark';
      try { localStorage.setItem('si-theme', root.dataset.theme); } catch (e) {}
    });
  }

  Promise.all([
    fetch('data/parametros.json').then((r) => r.json()),
    fetch('data/gastos.json').then((r) => r.json()),
  ]).then(([p, g]) => {
    params = p;
    gastos = g;
    preencherMetodologia();
    ligarEventos();
    render();
  }).catch((err) => {
    console.error(err);
    document.querySelector('.results').innerHTML =
      '<div class="badge-warn">Não foi possível carregar os dados. Abra o site por um servidor local (veja o README), não clicando direto no arquivo.</div>';
  });
})();

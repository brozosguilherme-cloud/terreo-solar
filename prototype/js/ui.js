/* Helpers de UI: toasts, modais, formatação */
(function () {
  'use strict';

  function toast(msg, type) {
    // dentro do telefone quando a view App está visível; flutuante global na view Admin
    let box = document.getElementById('toasts');
    const appHidden = document.getElementById('view-app')?.classList.contains('hidden');
    if (!box || appHidden) {
      box = document.getElementById('toasts-global');
      if (!box) {
        box = document.createElement('div');
        box.id = 'toasts-global';
        document.body.appendChild(box);
      }
    }
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = msg;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2800);
    setTimeout(() => el.remove(), 3300);
  }

  /* Modal empilhável. Retorna {root, body, close}. */
  function openModal(html, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const box = document.createElement('div');
    box.className = 'modal';
    if (opts.width) box.style.width = opts.width;
    box.innerHTML = html;
    overlay.appendChild(box);
    root.appendChild(overlay);
    const close = () => {
      if (opts.onClose) opts.onClose();
      overlay.remove();
    };
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay && !opts.modal) close(); });
    return { root: overlay, body: box, close };
  }

  function confirmModal(title, message, okLabel) {
    return new Promise((resolve) => {
      const m = openModal(`
        <h2>${title}</h2>
        <p style="color:#475569">${message}</p>
        <div class="footer">
          <button class="btn-outline" data-x="no">Cancelar</button>
          <button class="btn-primary" data-x="yes">${okLabel || 'Confirmar'}</button>
        </div>`, { modal: true });
      m.body.querySelector('[data-x="no"]').onclick = () => { m.close(); resolve(false); };
      m.body.querySelector('[data-x="yes"]').onclick = () => { m.close(); resolve(true); };
    });
  }

  function alertModal(title, html) {
    const m = openModal(`
      <h2>${title}</h2>
      <div style="color:#475569;font-size:13.5px">${html}</div>
      <div class="footer"><button class="btn-primary">Entendi</button></div>`, { modal: true });
    m.body.querySelector('.btn-primary').onclick = m.close;
    return m;
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* re-renderiza os ícones de linha (lucide) após trocas de innerHTML */
  function refreshIcons() {
    try { if (globalThis.lucide) globalThis.lucide.createIcons(); } catch (e) { /* offline: segue sem ícones */ }
  }

  globalThis.UI = { toast, openModal, confirmModal, alertModal, esc, fmtDate, fmtDateTime, refreshIcons };
})();

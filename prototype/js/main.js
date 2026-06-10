/* Bootstrap: liga backend, views e eventos globais */
(function () {
  'use strict';

  Backend.init();
  AppView.init();
  AdminView.init();

  // alternância App ↔ Admin
  const navApp = document.getElementById('nav-app');
  const navAdmin = document.getElementById('nav-admin');
  function switchView(which) {
    document.getElementById('view-app').classList.toggle('hidden', which !== 'app');
    document.getElementById('view-admin').classList.toggle('hidden', which !== 'admin');
    navApp.classList.toggle('active', which === 'app');
    navAdmin.classList.toggle('active', which === 'admin');
    if (which === 'admin') AdminView.render(); else AppView.render();
  }
  navApp.onclick = () => switchView('app');
  navAdmin.onclick = () => switchView('admin');

  // contador da fila de revisão
  function updateFlagCount() {
    const n = Backend.adminListFlagged().length;
    const el = document.getElementById('flag-count');
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  }

  // re-render coalescido: qualquer mudança de dados ou de posição simulada
  let raf = null;
  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      AppView.render();
      AppView.populateTeleport();
      AdminView.render();
      updateFlagCount();
    });
  }
  Bus.on('db:changed', scheduleRender);
  Bus.on('sim:moved', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; AppView.render(); });
  });

  // reset da demo
  document.getElementById('btn-reset').onclick = async () => {
    if (await UI.confirmModal('Resetar demo', 'Apaga check-ins, pontos e conteúdo criado no Admin, restaurando os dados de exemplo.', 'Resetar'))
      Backend.reset();
  };

  updateFlagCount();
})();

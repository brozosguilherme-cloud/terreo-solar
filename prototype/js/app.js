/* View do App (telefone) + Simulador de GPS */
(function () {
  'use strict';
  const { toast, esc, fmtDate, fmtDateTime } = UI;
  const fmtDist = (m) => Backend.fmtDist(m);
  const ic = (name) => `<span class="ic"><i data-lucide="${name}"></i></span>`;

  // níveis de experiência (apresentação — XP = pontos do ledger)
  const LEVELS = [
    { name: 'Iniciante', at: 0 },
    { name: 'Aventureiro', at: 150 },
    { name: 'Explorador', at: 400 },
    { name: 'Guia Local', at: 800 },
    { name: 'Lenda', at: 1500 },
  ];
  function levelInfo(points) {
    let i = 0;
    while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].at) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    if (!next) return { name: cur.name, cur: points, need: points, pct: 100, max: true };
    return {
      name: cur.name, max: false,
      cur: points - cur.at, need: next.at - cur.at,
      pct: Math.min(100, Math.round(((points - cur.at) / (next.at - cur.at)) * 100)),
    };
  }
  const xpLabel = (lvl, pts) => lvl.max ? `${pts} XP` : `${lvl.cur} / ${lvl.need} XP`;

  // ───────────── Simulador de GPS ─────────────
  globalThis.Sim = {
    lat: -23.5495, lng: -46.6355, accuracy: 15, mock: false,
    mode: 'sim', // 'sim' (marcador/teleporte) | 'real' (watchPosition do aparelho)
    setPos(lat, lng, opts) {
      this.lat = lat; this.lng = lng;
      if (userMarker) userMarker.setLatLng([lat, lng]);
      if (map && opts && opts.pan) map.setView([lat, lng], Math.max(map.getZoom(), 15));
      Bus.emit('sim:moved');
    },
  };

  // ───────────── GPS real (celular / localhost) ─────────────
  let watchId = null, firstFix = false;

  function canUseRealGps() {
    if (!('geolocation' in navigator)) { toast('❌ Este navegador não expõe geolocalização.', 'err'); return false; }
    if (!window.isSecureContext) {
      toast('❌ GPS real exige HTTPS (GitHub Pages / túnel) ou localhost — em http:// pela rede local o navegador bloqueia.', 'err');
      return false;
    }
    return true;
  }

  function setRealMode(on) {
    const cb = document.getElementById('sim-real');
    const slider = document.getElementById('sim-acc');
    const status = document.getElementById('real-status');
    if (on) {
      if (!canUseRealGps()) { cb.checked = false; return; }
      Sim.mode = 'real'; firstFix = false;
      slider.disabled = true;
      if (userMarker && userMarker.dragging) userMarker.dragging.disable();
      status.textContent = '⏳ Aguardando primeira leitura do GPS…';
      watchId = navigator.geolocation.watchPosition((pos) => {
        Sim.accuracy = Math.max(5, Math.round(pos.coords.accuracy || 15));
        const lbl = document.getElementById('sim-acc-label');
        if (lbl) lbl.textContent = Sim.accuracy + ' m (real)';
        status.textContent = `📡 GPS real ativo — precisão ${Sim.accuracy} m. Ande até um local para o botão habilitar.`;
        Sim.setPos(pos.coords.latitude, pos.coords.longitude, { pan: !firstFix });
        firstFix = true;
      }, (err) => {
        toast('❌ GPS: ' + esc(err.message), 'err');
        setRealMode(false);
      }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
      cb.checked = true;
    } else {
      if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
      Sim.mode = 'sim';
      slider.disabled = false;
      Sim.accuracy = Number(slider.value);
      const lbl = document.getElementById('sim-acc-label');
      if (lbl) lbl.textContent = Sim.accuracy + ' m';
      if (userMarker && userMarker.dragging) userMarker.dragging.enable();
      status.textContent = 'GPS real desligado — usando o marcador simulado.';
      cb.checked = false;
      Bus.emit('sim:moved');
    }
  }

  // ───────────── estado da view ─────────────
  let activeTab = 'home';
  let sheetState = null;          // {type:'place'|'mission', id, from}
  let validating = null;          // placeId em "Validando…"
  const inRangeMap = {};          // histerese por local
  let map = null, markersLayer = null, userMarker = null, focusCircle = null;
  const celebrationQueue = [];
  let celebrating = false;

  // Histerese (doc 05): entra com d ≤ raio, sai com d > raio + 15 m
  function inRange(placeId, dist, radius) {
    const was = !!inRangeMap[placeId];
    const now = was ? dist <= radius + 15 : dist <= radius;
    inRangeMap[placeId] = now;
    return now;
  }

  // ───────────── telas ─────────────
  function chipFor(st) {
    return {
      in_progress: '<span class="statuschip chip-progress">Em progresso</span>',
      not_started: '<span class="statuschip chip-new">Nova</span>',
      upcoming: '<span class="statuschip chip-soon">Em breve</span>',
      completed: '<span class="statuschip chip-done">✓ Concluída</span>',
    }[st] || '';
  }

  function statsRow() {
    const s = Backend.getStats();
    return `<div class="stats">
      <div class="stat">${ic('map-pin')}<b>${s.checkins}</b><span class="lbl">Check-ins</span></div>
      <div class="stat">${ic('sparkles')}<b>${s.points}</b><span class="lbl">Pontos</span></div>
      <div class="stat">${ic('trophy')}<b>${s.achievements}</b><span class="lbl">Conquistas</span></div>
    </div>`;
  }

  function xpCard() {
    const pts = Backend.getStats().points;
    const lvl = levelInfo(pts);
    return `<div class="xp-card">
      <div class="row"><span>Experiência</span><b>${xpLabel(lvl, pts)}</b></div>
      <div class="bar"><div style="width:${lvl.pct}%"></div></div>
    </div>`;
  }

  function renderHome() {
    const el = document.getElementById('screen-home');
    const st = el.scrollTop;
    const feed = Backend.getHomeFeed(Sim);
    const lvl = levelInfo(Backend.getStats().points);

    const missions = feed.missions.map((m) => {
      const pct = m.progress.total ? Math.round((m.progress.completed / m.progress.total) * 100) : 0;
      const body = m.user_status === 'upcoming'
        ? `<div class="nearest">${ic('lock')} Abre em ${fmtDate(m.starts_at)}<span class="dist">bônus +${m.bonus_points}</span></div>`
        : `<div class="bar slim"><div style="width:${pct}%"></div></div>
           <div class="nums"><span><b>${m.progress.completed}</b>/${m.progress.total} check-ins</span><span>bônus <b>+${m.bonus_points} pts</b></span></div>
           ${m.nearest_pending_place ? `<div class="nearest">${ic('map-pin')} ${esc(m.nearest_pending_place.name)}<span class="dist">${fmtDist(m.nearest_pending_place.distance_m)}</span></div>` : ''}`;
      return `<div class="m-card" data-mission="${m.id}">
        <div class="top"><div class="m-emoji">${m.badge}</div>
          <div><div class="ttl">${esc(m.name)}</div><div class="sub">${m.progress.total} locais</div></div>
          <span class="chipwrap">${chipFor(m.user_status)}</span>
        </div>${body}</div>`;
    }).join('') || '<p class="muted">Nenhuma missão ativa.</p>';

    const places = feed.standalone_places.map((p) => `
      <div class="p-row ${p.user_status === 'completed' ? 'done' : ''}" data-place="${p.id}">
        <div class="p-emoji">${p.emoji}</div>
        <div class="info"><div class="nm">${esc(p.name)}</div>
          <div class="mt">${esc(p.category)} · ${fmtDist(p.distance_m)}</div></div>
        <div class="right">${p.user_status === 'completed'
          ? `<div class="done-ic">${ic('check')}</div>`
          : `<div class="pts">+${p.base_points} pts</div>`}</div>
      </div>`).join('') || '<p class="muted">Nenhum local avulso por aqui.</p>';

    el.innerHTML = `<div class="app-pad">
      <div class="app-head">
        <div class="greet">Olá, viajante 👋<small>Pronto para a próxima descoberta?</small></div>
        <span class="level-pill">${esc(lvl.name)}</span>
      </div>
      ${xpCard()}
      ${statsRow()}
      ${Sim.accuracy > 50 ? '<div class="gps-warn">📡 Sinal de GPS fraco — precisão de ' + Sim.accuracy + ' m. Vá para área aberta.</div>' : ''}
      <div class="sec"><h3>Missões</h3><p>Complete trilhas de check-ins e ganhe badges</p></div>
      ${missions}
      <div class="sec"><h3>Para explorar</h3><p>Locais avulsos perto de você</p></div>
      ${places}
    </div>`;
    el.scrollTop = st;

    el.querySelectorAll('[data-mission]').forEach((c) =>
      c.addEventListener('click', () => openMissionDetail(c.dataset.mission)));
    el.querySelectorAll('[data-place]').forEach((c) =>
      c.addEventListener('click', () => openSheet(c.dataset.place)));
  }

  function renderProfile() {
    const el = document.getElementById('screen-profile');
    const st = el.scrollTop;
    const prof = Backend.getProfile();
    const stats = Backend.getStats();
    const lvl = levelInfo(stats.points);
    const ledger = Backend.getLedger();
    const allMissions = Backend.adminListAchievements().filter((a) => a.status !== 'archived');
    const unlockedSet = new Set(prof.badges.map((b) => b.achievement_id));

    const badgeCards = allMissions.map((a) => {
      const on = unlockedSet.has(a.id);
      const b = prof.badges.find((x) => x.achievement_id === a.id);
      return `<div class="badge-card ${on ? '' : 'off'}">
        <div class="bc">${a.badge}</div>
        <div class="bn">${esc(a.name)}</div>
        <div class="bd">${on ? 'em ' + fmtDate(b.completed_at) : a.progress.completed + '/' + a.progress.total}</div>
      </div>`;
    }).join('') || '<p class="muted">Nenhuma missão disponível ainda.</p>';

    const flagged = prof.flagged.length ? prof.flagged.map((f) => `
      <div class="gps-warn">⚠️ Check-in em <b>${esc(f.place)}</b> está em revisão — os pontos podem ser estornados.</div>`).join('') : '';

    const rows = ledger.map((l) => {
      const up = l.points >= 0;
      const cls = l.source_type === 'achievement' ? 'bonus' : up ? 'plus' : 'minus';
      const icon = l.source_type === 'achievement' ? 'trophy' : up ? 'map-pin' : 'rotate-ccw';
      return `<div class="ledger-row">
        <div class="li ${cls}">${ic(icon)}</div>
        <div class="info"><div class="ds">${esc(l.description)}</div>
          <div class="dt">${fmtDateTime(l.created_at)}</div></div>
        <div class="val ${up ? 'up' : 'dn'}">${up ? '+' : ''}${l.points}</div>
      </div>`;
    }).join('') || '<p class="muted">Sem movimentações ainda.</p>';

    el.innerHTML = `<div class="app-pad">
      <div class="profile-hero">
        <div class="avatar">🧭</div>
        <div><div class="nm">Viajante</div>
        <div class="rl">${esc(lvl.name)} · ${stats.points} pts</div></div>
      </div>
      ${xpCard()}
      ${statsRow()}
      <div class="sec"><h3>Conquistas</h3><p>${prof.badges.length} de ${allMissions.length} desbloqueadas</p></div>
      <div class="badges-grid">${badgeCards}</div>
      ${flagged}
      <div class="sec"><h3>Extrato de pontos</h3><p>Cada linha é uma entrada do ledger — auditável</p></div>
      ${rows}
    </div>`;
    el.scrollTop = st;
  }

  // ───────────── mapa ─────────────
  function initMap() {
    if (map) return;
    map = L.map('appmap', { zoomControl: false }).setView([Sim.lat, Sim.lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    userMarker = L.marker([Sim.lat, Sim.lng], {
      draggable: true, zIndexOffset: 1000,
      icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
    }).addTo(map);
    userMarker.on('drag', (e) => {
      const ll = e.target.getLatLng();
      Sim.lat = ll.lat; Sim.lng = ll.lng;
      Bus.emit('sim:moved');
    });
    if (Sim.mode === 'real' && userMarker.dragging) userMarker.dragging.disable();
    refreshMarkers();
  }

  function refreshMarkers() {
    if (!map) return;
    markersLayer.clearLayers();
    Backend.getMapPins().forEach((pin) => {
      const cls = pin.user_status === 'completed' ? 'done'
        : pin.user_status === 'locked' ? 'locked' : pin.kind;
      const mini = pin.user_status === 'completed' ? '<span class="mini">✓</span>'
        : pin.user_status === 'locked' ? '<span class="mini">🔒</span>'
        : pin.kind === 'mission' ? '<span class="mini">★</span>' : '';
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin2 ${cls}"><div class="c">${pin.emoji}</div><div class="tip"></div>${mini}</div>`,
        iconSize: [44, 52], iconAnchor: [22, 50],
      });
      L.marker([pin.lat, pin.lng], { icon })
        .on('click', () => openSheet(pin.id))
        .addTo(markersLayer);
    });
    updateFocusCircle();
  }

  function updateFocusCircle() {
    if (!map) return;
    if (focusCircle) { focusCircle.remove(); focusCircle = null; }
    if (sheetState && sheetState.type === 'place') {
      const p = Backend.getPlaceDetail(sheetState.id, Sim);
      if (p) {
        focusCircle = L.circle([p.lat, p.lng], {
          radius: p.radius_m, color: '#E5973A', weight: 2,
          fillColor: '#E5973A', fillOpacity: 0.1, dashArray: '6 6',
        }).addTo(map);
      }
    }
  }

  // ───────────── sheet (detalhe de local / missão) ─────────────
  function openSheet(placeId, opts) {
    sheetState = { type: 'place', id: placeId, from: opts && opts.from };
    renderSheet();
    updateFocusCircle();
    const p = Backend.getPlaceDetail(placeId, Sim);
    if (map && activeTab === 'map' && p) map.panTo([p.lat, p.lng]);
  }
  function openMissionDetail(missionId) {
    sheetState = { type: 'mission', id: missionId };
    renderSheet();
    updateFocusCircle();
  }
  function closeSheet() {
    sheetState = null;
    document.getElementById('sheet').classList.add('hidden');
    updateFocusCircle();
  }

  function renderSheet() {
    const el = document.getElementById('sheet');
    if (!sheetState) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.classList.toggle('tall', sheetState.type === 'mission');
    if (sheetState.type === 'place') renderPlaceSheet(el);
    else renderMissionSheet(el);
    UI.refreshIcons();
  }

  function renderPlaceSheet(el) {
    const d = Backend.getPlaceDetail(sheetState.id, Sim);
    if (!d) { closeSheet(); return; }

    const missionsCtx = d.missions.map((m) => `
      <div class="mission-ctx" data-mission="${m.id}">${m.badge} <b>${esc(m.name)}</b>
        ${m.window === 'upcoming' ? '· abre em ' + fmtDate(m.starts_at) : `— ${m.progress.completed}/${m.progress.total}`}
        <span class="chev">›</span>
      </div>`).join('');

    let action = '';
    if (d.user_status === 'completed') {
      const flaggedNote = d.checkin && d.checkin.status === 'flagged' ? ' · ⚠️ em revisão' : '';
      action = `<button class="btn-checkin done" disabled>✓ Check-in feito em ${fmtDate(d.checkin && d.checkin.created_at)} · +${d.checkin ? d.checkin.points_awarded : d.base_points} pts${flaggedNote}</button>`;
    } else if (d.user_status === 'locked') {
      const up = d.missions.find((m) => m.window === 'upcoming');
      action = `<button class="btn-checkin locked" disabled>🔒 ${up ? 'Disponível a partir de ' + fmtDate(up.starts_at) : 'Indisponível'}</button>
        <button class="force-link" data-force>🧪 testar mesmo assim (o servidor valida)</button>`;
    } else if (validating === d.id) {
      action = '<button class="btn-checkin" disabled><span class="spinner"></span>Confirmando sua presença…</button>';
    } else {
      const dist = d.distance_m;
      const ready = inRange(d.id, dist, d.radius_m);
      if (ready) {
        action = `<button class="btn-checkin ready" data-checkin>Fazer check-in · +${d.base_points} pts</button>`;
      } else {
        action = `<button class="btn-checkin" disabled>Você está a ${fmtDist(dist)} — chegue mais perto</button>
          <button class="btn-secondary" data-route>${ic('navigation')} Como chegar</button>
          <button class="force-link" data-force>🧪 testar mesmo assim (o servidor valida)</button>`;
      }
    }

    el.innerHTML = `
      <div class="grab"></div>
      <button class="close" data-close>✕</button>
      ${sheetState.from ? `<span class="backlink" data-back>‹ voltar para a missão</span>` : ''}
      <div class="sheet-head">
        <div class="s-emoji">${d.emoji}</div>
        <div><h2>${esc(d.name)}</h2><div class="addr">${esc(d.address)}</div></div>
      </div>
      <div class="factrow">
        <span class="fact">${ic('sparkles')} ${d.base_points} pts</span>
        <span class="fact">${ic('target')} ${d.radius_m} m</span>
        <span class="fact">${ic('footprints')} ${fmtDist(d.distance_m)}</span>
        <span class="fact">${ic('tag')} ${esc(d.category)}</span>
      </div>
      ${missionsCtx}
      <div class="desc">${esc(d.description)}</div>
      ${Sim.accuracy > 50 && d.user_status === 'available' ? '<div class="gps-warn">📡 GPS impreciso (' + Sim.accuracy + ' m) — o servidor tolera até raio + 50 m.</div>' : ''}
      ${action}`;

    el.querySelector('[data-close]').onclick = closeSheet;
    const back = el.querySelector('[data-back]');
    if (back) back.onclick = () => openMissionDetail(sheetState.from);
    el.querySelectorAll('.mission-ctx').forEach((m) =>
      m.addEventListener('click', () => openMissionDetail(m.dataset.mission)));
    const btn = el.querySelector('[data-checkin]');
    if (btn) btn.onclick = () => doCheckin(d.id);
    const force = el.querySelector('[data-force]');
    if (force) force.onclick = () => doCheckin(d.id);
    const route = el.querySelector('[data-route]');
    if (route) route.onclick = () =>
      toast('🧭 No app real: deep link para Google Maps / Waze.', '');
  }

  function renderMissionSheet(el) {
    const d = Backend.getAchievementDetail(sheetState.id, Sim);
    if (!d) { closeSheet(); return; }
    const pct = d.progress.total ? Math.round((d.progress.completed / d.progress.total) * 100) : 0;

    const rows = d.places.map((p) => {
      const stEl = p.user_status === 'completed' ? `<div class="st done">${ic('check')}</div>`
        : p.user_status === 'locked' ? `<div class="st lock">${ic('lock')}</div>`
        : `<div class="st">${p.emoji}</div>`;
      return `<div class="mission-place-row" data-place="${p.id}">
        ${stEl}
        <span class="nm">${esc(p.name)}</span>
        <span class="ds">${p.user_status === 'completed' ? '+' + p.base_points + ' pts' : fmtDist(p.distance_m)}</span>
        <span class="chev">›</span>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="grab"></div>
      <button class="close" data-close>✕</button>
      <div class="m-hero ${d.window === 'upcoming' ? 'locked' : ''}">
        <div class="badge-big">${d.badge}</div>
        <div><h2>${esc(d.name)}</h2>
        <div class="addr">${d.window === 'upcoming' ? '🔒 Abre em ' + fmtDate(d.starts_at) : 'Bônus de conclusão: +' + d.bonus_points + ' pts'}</div></div>
      </div>
      <div class="desc">${esc(d.description)}</div>
      ${d.unlocked ? `<div class="unlocked-banner">${ic('trophy')} Concluída em ${fmtDate(d.unlockedAt)} · +${d.bonus_points} pts creditados</div>` : ''}
      <div class="bar slim" style="margin-top:14px"><div style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);font-weight:600;margin:7px 0 8px">
        <span><b style="color:var(--ink)">${d.progress.completed}</b>/${d.progress.total} check-ins</span><span>${pct}%</span>
      </div>
      ${rows}`;

    el.querySelector('[data-close]').onclick = closeSheet;
    el.querySelectorAll('[data-place]').forEach((r) =>
      r.addEventListener('click', () => openSheet(r.dataset.place, { from: d.id })));
  }

  // ───────────── check-in ─────────────
  async function doCheckin(placeId) {
    if (validating) return;
    validating = placeId;
    renderSheet();
    try {
      const res = await Backend.performCheckin(placeId, {
        lat: Sim.lat, lng: Sim.lng, accuracy_m: Sim.accuracy, is_mock_location: Sim.mock,
      });
      validating = null;
      if (res.checkin.status === 'flagged') {
        toast(`+${res.checkin.points_awarded} pts — ⚠️ check-in sinalizado para revisão (veja Admin → Revisão)`, 'warn');
      } else {
        toast(`✅ Check-in confirmado! +${res.checkin.points_awarded} pts (a ${res.validation.distance_m} m do centro)`, 'ok');
      }
      res.achievements_progress.forEach((ap) => {
        if (ap.newly_unlocked) queueCelebration(ap);
        else if (ap.total) toast(`${ap.badge} ${esc(ap.name)}: ${ap.completed}/${ap.total}`, '');
      });
    } catch (e) {
      validating = null;
      if (e && e.code === 'ALREADY_CHECKED_IN') {
        toast('Você já tinha feito este check-in ✓', 'ok'); // 409 = sucesso silencioso (doc 05)
      } else if (e && e.code) {
        toast(`❌ ${e.code}: ${esc(e.message)}`, 'err');
      } else {
        toast('Erro inesperado: ' + esc(e && e.message), 'err');
        console.error(e);
      }
      render();
    }
  }

  // ───────────── celebração de conquista ─────────────
  function queueCelebration(ap) {
    celebrationQueue.push(ap);
    if (!celebrating) showNextCelebration();
  }
  function showNextCelebration() {
    const el = document.getElementById('celebration');
    const ap = celebrationQueue.shift();
    if (!ap) { celebrating = false; el.classList.add('hidden'); return; }
    celebrating = true;
    const confetti = Array.from({ length: 18 }, () => {
      const e = ['🎉', '🎊', '⭐', '✨'][Math.floor(Math.random() * 4)];
      const left = Math.random() * 100, dur = 2 + Math.random() * 2, delay = Math.random();
      return `<span class="confetti" style="left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s">${e}</span>`;
    }).join('');
    el.innerHTML = `${confetti}
      <div class="badge">${ap.badge || '🏆'}</div>
      <h2>Conquista desbloqueada!</h2>
      <div class="mn">${esc(ap.name)}</div>
      <div class="bonus">+${ap.bonus_points} pts de bônus</div>
      <button>Continuar explorando</button>`;
    el.classList.remove('hidden');
    el.querySelector('button').onclick = showNextCelebration;
  }

  // ───────────── tabs do telefone ─────────────
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tabbar button').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('screen-home').classList.toggle('hidden', tab !== 'home');
    document.getElementById('screen-map').classList.toggle('hidden', tab !== 'map');
    document.getElementById('screen-profile').classList.toggle('hidden', tab !== 'profile');
    if (tab === 'map') {
      initMap();
      setTimeout(() => { map.invalidateSize(); }, 60);
    }
    render();
  }

  // ───────────── painel do simulador ─────────────
  function populateTeleport() {
    const sel = document.getElementById('sim-teleport');
    const current = sel.value;
    const groups = [];
    const missions = Backend.adminListAchievements().filter((a) => a.status === 'active');
    missions.forEach((m) => {
      const opts = m.places.filter((p) => p.status === 'active')
        .map((p) => `<option value="${p.id}">${p.emoji} ${esc(p.name)}</option>`).join('');
      if (opts) groups.push(`<optgroup label="${m.badge} ${esc(m.name)}">${opts}</optgroup>`);
    });
    const standalone = Backend.getHomeFeed(Sim).standalone_places
      .map((p) => `<option value="${p.id}">${p.emoji} ${esc(p.name)}</option>`).join('');
    if (standalone) groups.push(`<optgroup label="📍 Avulsos">${standalone}</optgroup>`);
    sel.innerHTML = `<option value="">— escolha um destino —</option>
      <option value="__start">🏁 Ponto de partida (Praça da Sé)</option>` + groups.join('');
    sel.value = current || '';
  }

  function bindSimPanel() {
    populateTeleport();
    document.getElementById('sim-teleport').addEventListener('change', (e) => {
      const v = e.target.value;
      if (!v) return;
      if (Sim.mode === 'real') { setRealMode(false); toast('📡 GPS real desligado para teleportar.', ''); }
      document.querySelector('.simpanel').classList.remove('open'); // fecha a gaveta no mobile
      if (v === '__start') { Sim.setPos(-23.5495, -46.6355, { pan: true }); return; }
      const p = Backend.adminListPlaces().find((x) => x.id === v);
      if (p) {
        Sim.setPos(p.lat + 0.00012, p.lng + 0.00012, { pan: true }); // ~18 m do centro → dentro do raio
        if (activeTab !== 'map') switchTab('map');
      }
    });

    // GPS real + realocação da demo
    document.getElementById('sim-real').addEventListener('change', (e) => setRealMode(e.target.checked));
    document.getElementById('btn-relocate').addEventListener('click', () => {
      const apply = (lat, lng, label) => {
        const anchor = Backend.relocateDemo(lat, lng);
        Sim.setPos(lat, lng, { pan: true });
        document.querySelector('.simpanel').classList.remove('open');
        if (activeTab !== 'map') switchTab('map');
        toast(`🏠 Demo realocada (${label}): "${esc(anchor)}" agora está na sua posição — você já está no raio dele!`, 'ok');
      };
      if (Sim.mode === 'real') return apply(Sim.lat, Sim.lng, 'GPS real');
      if ('geolocation' in navigator && window.isSecureContext) {
        navigator.geolocation.getCurrentPosition(
          (p) => apply(p.coords.latitude, p.coords.longitude, 'GPS real'),
          () => apply(Sim.lat, Sim.lng, 'posição simulada'),
          { enableHighAccuracy: true, timeout: 12000 });
      } else {
        apply(Sim.lat, Sim.lng, 'posição simulada');
      }
    });

    // gaveta do simulador (mobile)
    const fab = document.getElementById('sim-fab');
    if (fab) fab.onclick = () => document.querySelector('.simpanel').classList.add('open');
    const sclose = document.getElementById('sim-close');
    if (sclose) sclose.onclick = () => document.querySelector('.simpanel').classList.remove('open');
    document.getElementById('sim-acc').addEventListener('input', (e) => {
      Sim.accuracy = Number(e.target.value);
      document.getElementById('sim-acc-label').textContent = Sim.accuracy + ' m';
      Bus.emit('sim:moved');
    });
    document.getElementById('sim-mock').addEventListener('change', (e) => {
      Sim.mock = e.target.checked;
    });
    document.querySelectorAll('[data-skew]').forEach((b) =>
      b.addEventListener('click', () => {
        Backend.addSkew(Number(b.dataset.skew));
        toast('🕐 Relógio virtual: ' + new Date(Backend.now()).toLocaleString('pt-BR'), '');
      }));
  }

  function updateSimReadout() {
    const pos = document.getElementById('sim-pos');
    if (pos) pos.textContent = Sim.lat.toFixed(5) + ', ' + Sim.lng.toFixed(5);
    const clock = document.getElementById('sim-clock');
    if (clock) clock.textContent = new Date(Backend.now()).toLocaleString('pt-BR',
      { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  // ───────────── render raiz ─────────────
  function render() {
    updateSimReadout();
    if (activeTab === 'home') renderHome();
    else if (activeTab === 'profile') renderProfile();
    refreshMarkers();
    renderSheet();
    UI.refreshIcons();
  }

  function init() {
    document.querySelectorAll('.tabbar button').forEach((b) =>
      b.addEventListener('click', () => switchTab(b.dataset.tab)));
    bindSimPanel();
    render();
  }

  globalThis.AppView = { init, render, populateTeleport, openSheet, openMissionDetail };
})();

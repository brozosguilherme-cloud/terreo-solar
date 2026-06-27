/* View do App (telefone) + Simulador de GPS */
(function () {
  'use strict';
  const { toast, esc, fmtDate, fmtDateTime } = UI;
  const fmtDist = (m) => Backend.fmtDist(m);
  const ic = (name) => `<span class="ic"><i data-lucide="${name}"></i></span>`;

  // ───────────── sistema visual: cenas SVG + anéis ─────────────
  const SCENES = {
    historico:  { sky: ['#F4DCA9', '#E0973F'], sun: '#FFF1D6', sil: '#B96528', shape: 'sky' },
    cultura:    { sky: ['#C9B7E8', '#6E51A8'], sun: '#ECDDFF', sil: '#4F3380', shape: 'sky' },
    gastronomia:{ sky: ['#F7CBA6', '#DF6A3A'], sun: '#FFE3CC', sil: '#B84E24', shape: 'hill' },
    natureza:   { sky: ['#C2E3A6', '#4F9B57', '#2F7E45'], sun: '#FCF8C8', sil: '#356E3B', shape: 'hill' },
    evento:     { sky: ['#AFCBEF', '#3F77C9'], sun: '#DCEBFF', sil: '#2C5494', shape: 'sky' },
    conquista:  { sky: ['#F4DCA9', '#E0973F'], sun: '#FFF1D6', sil: '#B96528', shape: 'sky' },
  };
  const SIL = {
    sky: 'M0,100 V80 H7 V73 H13 V83 H20 V67 H28 V78 H35 V62 H43 V75 H50 V69 H58 V79 H65 V64 H73 V77 H81 V70 H88 V81 H95 V74 H100 V100 Z',
    hillBack: 'M0,100 V88 Q26,74 52,86 Q78,96 100,82 V100 Z',
    hillFront: 'M0,100 V92 Q30,80 58,90 Q82,98 100,90 V100 Z',
  };
  function sceneSVG(cat) {
    const s = SCENES[cat] || SCENES.historico;
    const id = 'sk_' + cat;
    const stops = s.sky.map((c, i) =>
      `<stop offset="${(i / (s.sky.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('');
    const sil = s.shape === 'hill'
      ? `<path d="${SIL.hillBack}" fill="${s.sil}" opacity=".5"/><path d="${SIL.hillFront}" fill="${s.sil}" opacity=".95"/>`
      : `<path d="${SIL.sky}" fill="${s.sil}" opacity=".95"/>`;
    return `<svg class="scene" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>
      <rect width="100" height="100" fill="url(#${id})"/>
      <circle cx="73" cy="33" r="14" fill="${s.sun}" opacity=".88"/>
      ${sil}
    </svg>`;
  }
  function ringSVG(pct, size, sw, cls) {
    const r = (size - sw) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return `<svg class="ring ${cls || ''}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="rt" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/>
      <circle class="rp" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg>`;
  }

  function levelCard(stats, lvl) {
    const ptsLabel = lvl.max
      ? `Nível máximo — <span data-cuk="xp" data-cuv="${stats.points}">${stats.points}</span> PinPoints`
      : `<span data-cuk="xp" data-cuv="${stats.points}">${stats.points}</span> / ${lvl.nextAt} PinPoints para o próximo`;
    const streakLabel = stats.streak.today
      ? `<span class="lc-streak on">${ic('flame')} ${stats.streak.count} dias</span>`
      : (stats.streak.count ? `<span class="lc-streak">${ic('flame')} ${stats.streak.count}</span>` : '');
    return `<div class="lvl-card">
      <div class="lc-row">
        <div class="lc-icon">${lvl.emoji}</div>
        <div class="lc-body">
          <div class="lc-name">${esc(lvl.name)}</div>
          <div class="lc-pts">${ptsLabel}</div>
        </div>
        ${streakLabel}<div class="lc-trophy">${ic('trophy')}</div>
      </div>
      <div class="lc-bar"><div style="width:${lvl.pct}%"></div></div>
    </div>`;
  }

  // níveis de experiência (PinPoints = pontos do ledger)
  const LEVELS = [
    { name: 'Turista Curioso', at: 0, emoji: '🐣' },
    { name: 'Trilheiro Urbano', at: 150, emoji: '🥾' },
    { name: 'Nômade do Mapa', at: 400, emoji: '🧭' },
    { name: 'Cartógrafo Mestre', at: 800, emoji: '🗺️' },
    { name: 'Lenda Viva', at: 1500, emoji: '👑' },
  ];
  function levelInfo(points) {
    let i = 0;
    while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].at) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    if (!next) return { name: cur.name, emoji: cur.emoji, cur: points, need: points, nextAt: points, nextName: null, pct: 100, max: true };
    return {
      name: cur.name, emoji: cur.emoji, max: false, nextAt: next.at, nextName: next.name,
      cur: points - cur.at, need: next.at - cur.at,
      pct: Math.min(100, Math.round(((points - cur.at) / (next.at - cur.at)) * 100)),
    };
  }

  function timeAgo(ts) {
    const diff = Backend.now() - ts;
    if (diff < 90e3) return 'agora';
    if (diff < 36e5) return Math.round(diff / 6e4) + ' min atrás';
    if (diff < 864e5) return Math.round(diff / 36e5) + ' h atrás';
    if (diff < 1728e5) return 'ontem';
    return new Date(ts).toLocaleDateString('pt-BR');
  }

  // ───────────── motion: contadores, voos e memória entre telas ─────────────
  const prevCounts = {};       // última cifra exibida por contador (data-cuk)
  const recentlyUpdated = {};  // achievementId → timestamp (glow na Home pós-check-in)
  let animateNext = false;     // próxima renderização entra em cascata
  let animatePins = false;     // pins caem ao abrir o mapa

  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  function runCounters(entering) {
    document.querySelectorAll('#view-app [data-cuk]').forEach((el) => {
      const key = el.dataset.cuk;
      const to = Number(el.dataset.cuv);
      const from = entering ? 0 : (prevCounts[key] != null ? prevCounts[key] : to);
      prevCounts[key] = to;
      if (from === to) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 750;
      (function frame(t) {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(from + (to - from) * easeOut(k));
        if (k < 1) requestAnimationFrame(frame);
      })(t0);
    });
  }

  /* chip "+30" voa do botão de check-in em direção ao placar */
  function flyPoints(fromRect, label) {
    const phone = document.querySelector('.phone');
    if (!phone || !fromRect) return;
    const pr = phone.getBoundingClientRect();
    const chip = document.createElement('div');
    chip.className = 'fly-pts';
    chip.textContent = label;
    chip.style.left = (fromRect.left - pr.left + fromRect.width / 2 - 28) + 'px';
    chip.style.top = (fromRect.top - pr.top - 8) + 'px';
    chip.style.setProperty('--dy', '-' + Math.max(160, fromRect.top - pr.top - 90) + 'px');
    phone.appendChild(chip);
    setTimeout(() => chip.remove(), 1050);
  }

  const buzz = (pattern) => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* iOS */ } };

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
  function statsRow() {
    const s = Backend.getStats();
    return `<div class="stats">
      <div class="stat">${ic('map-pin')}<b data-cuk="ck" data-cuv="${s.checkins}">${s.checkins}</b><span class="lbl">Check-ins</span></div>
      <div class="stat">${ic('sparkles')}<b data-cuk="pts" data-cuv="${s.points}">${s.points}</b><span class="lbl">PinPoints</span></div>
      <div class="stat">${ic('trophy')}<b data-cuk="aw" data-cuv="${s.achievements}">${s.achievements}</b><span class="lbl">Conquistas</span></div>
      <div class="stat ${s.streak.today ? 'hot' : ''}">${ic('flame')}<b data-cuk="st" data-cuv="${s.streak.count}">${s.streak.count}</b><span class="lbl">Ofensiva${s.streak.at_risk ? ' ⚠️' : ''}</span></div>
    </div>`;
  }

  function xpCard() {
    const pts = Backend.getStats().points;
    const lvl = levelInfo(pts);
    const label = lvl.max
      ? `<span data-cuk="xp" data-cuv="${pts}">${pts}</span> PinPoints`
      : `<span data-cuk="xp" data-cuv="${lvl.cur}">${lvl.cur}</span> / ${lvl.need} PinPoints`;
    return `<div class="xp-card">
      <div class="row"><span>Experiência</span><b>${label}</b></div>
      <div class="bar"><div style="width:${lvl.pct}%"></div></div>
    </div>`;
  }

  // ───────────── home v4 ("PinPoints", Duolingo-style) ─────────────
  let homeCat = 'todos';
  const CATS = [
    ['todos', 'Todos'], ['historico', 'Histórico'], ['cultura', 'Cultura'],
    ['gastronomia', 'Gastronomia'], ['natureza', 'Natureza'], ['evento', 'Eventos'],
  ];
  const CAT_ICONS = {
    todos: 'compass', historico: 'landmark', cultura: 'palette',
    gastronomia: 'utensils', natureza: 'trees', evento: 'calendar-days',
  };

  function conquestCardsHtml(missions) {
    return missions.map((m) => {
      const glow = recentlyUpdated[m.id] && Date.now() - recentlyUpdated[m.id] < 9000 ? 'glow-new' : '';
      const locStr = m.user_status === 'completed' ? '✓ CONCLUÍDA'
        : m.user_status === 'upcoming' ? 'EM BREVE'
        : `${m.progress.completed}/${m.progress.total} LOCAIS`;
      const sub = m.user_status === 'upcoming' ? 'Abre em ' + fmtDate(m.starts_at)
        : m.user_status === 'completed' ? 'Badge desbloqueado na coleção'
        : (m.description || 'Explore os locais desta missão.');
      const bonusCls = m.user_status === 'completed' ? 'mc-bonus done' : 'mc-bonus';
      const bonusTxt = m.user_status === 'completed'
        ? `✓ +${m.bonus_points} PinPoints`
        : `+${m.bonus_points} PinPoints Extra`;
      return `<div class="mcard ${glow}" data-mission="${m.id}">
        <div class="mc-head">
          <div class="mc-icon">${m.badge}</div>
          <span class="mc-prog">${locStr}</span>
        </div>
        <div class="mc-title">${esc(m.name)}</div>
        <div class="mc-sub">${esc(sub)}</div>
        <span class="${bonusCls}">${bonusTxt}</span>
      </div>`;
    }).join('') || '<p class="muted">Nenhuma trilha por aqui.</p>';
  }

  function placeCardsHtml(places) {
    return places.map((p) => {
      const visited = p.user_status === 'completed';
      return `<div class="pcard" data-place="${p.id}">
        <div class="pc-photo g-${p.category}">
          ${sceneSVG(p.category)}
          <span class="pc-em">${p.emoji}</span>
        </div>
        <div class="pc-body">
          <div class="pc-chips">
            <span class="pc-cat">${esc(p.category).toUpperCase()}</span>
            <span class="pc-sep">·</span>
            <span class="pc-dist">${ic('map-pin')} ${fmtDist(p.distance_m)}</span>
          </div>
          <div class="pc-name">${esc(p.name)}</div>
          <div class="pc-desc">${esc(p.description || '')}</div>
        </div>
        ${visited
          ? `<span class="pc-vist">${ic('check')}</span>`
          : `<span class="pc-pts-badge">+${p.base_points}</span>`}
        <span class="pc-chev">›</span>
      </div>`;
    }).join('') ||
      `<p class="muted">Nenhum local avulso — explore as trilhas acima.</p>`;
  }

  function bindHomeLists(el) {
    el.querySelectorAll('[data-mission]').forEach((c) =>
      c.addEventListener('click', () => openMissionDetail(c.dataset.mission)));
    el.querySelectorAll('[data-place]').forEach((c) =>
      c.addEventListener('click', () => openSheet(c.dataset.place)));
  }

  function renderHome(entering) {
    const el = document.getElementById('screen-home');
    const st = el.scrollTop;
    const stats = Backend.getStats();
    const lvl = levelInfo(stats.points);
    const feed = Backend.getHomeFeed(Sim);
    const places = feed.standalone_places.filter((p) => homeCat === 'todos' || p.category === homeCat);

    el.innerHTML = `<div class="app-pad ${entering ? 'stagger' : ''}">
      <div class="big-head">
        <div>
          <div class="eyebrow-head">EXPLORADOR GLOBAL</div>
          <h1>Olá, Guilherme</h1>
        </div>
        <button class="notif-btn" data-bell>${ic('bell')}</button>
      </div>
      ${levelCard(stats, lvl)}
      <div class="hfilter">${CATS.map(([k, label]) =>
        `<button class="hchip ${homeCat === k ? 'on' : ''}" data-cat="${k}">${label}</button>`).join('')}</div>
      ${Sim.accuracy > 50 ? '<div class="gps-warn">Sinal de GPS fraco — precisão de ' + Sim.accuracy + ' m. Vá para área aberta.</div>' : ''}
      <div class="sec-h">${ic('trophy')}<h3>Trilhas &amp; Conquistas</h3><span class="sec-link" data-see-rank>Ranking</span></div>
      <div class="mcarousel" id="home-missions">${conquestCardsHtml(feed.missions)}</div>
      <div class="sec-h">${ic('map-pin')}<h3>Missões Próximas a você</h3><span class="sec-link" data-see-map>Ver mapa</span></div>
      <div id="home-explore">${placeCardsHtml(places)}</div>
    </div>`;
    el.scrollTop = st;

    bindHomeLists(el);
    el.querySelector('[data-bell]').onclick = () =>
      toast('Tudo em dia por aqui.', '');
    const seeMap = el.querySelector('[data-see-map]');
    const seeRank = el.querySelector('[data-see-rank]');
    if (seeMap) seeMap.onclick = () => switchTab('map');
    if (seeRank) seeRank.onclick = () => switchTab('social');
    el.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => {
      homeCat = b.dataset.cat;
      buzz(8);
      renderHome(false);
      UI.refreshIcons();
    });
  }

  function renderProfile(entering) {
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
    }).join('') || '<p class="muted">Nenhuma trilha disponível ainda.</p>';

    const flagged = prof.flagged.length ? prof.flagged.map((f) => `
      <div class="gps-warn">Check-in em <b>${esc(f.place)}</b> está em revisão — os pontos podem ser estornados.</div>`).join('') : '';

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

    el.innerHTML = `<div class="app-pad ${entering ? 'stagger' : ''}">
      <div class="big-head"><div><div class="eyebrow-head">SEU PROGRESSO</div><h1>Perfil</h1></div></div>
      ${levelCard(stats, lvl)}
      ${statsRow()}
      <div class="sec"><h3>Conquistas</h3><p>${prof.badges.length} de ${allMissions.length} desbloqueadas</p></div>
      <div class="badges-grid">${badgeCards}</div>
      ${flagged}
      <div class="sec"><h3>Atividade</h3><p>Extrato do ledger — auditável</p></div>
      ${rows}
    </div>`;
    el.scrollTop = st;
  }

  // ───────────── social: ranking entre amigos + pessoas ─────────────
  let socialSeg = 'ranking';

  const initialsOf = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const avatar = (p, size) =>
    `<div class="avt ${size}" style="--h:${p.hue}">${p.you ? '🧭' : initialsOf(p.name)}</div>`;

  function renderSocial(entering) {
    const el = document.getElementById('screen-social');
    const st = el.scrollTop;
    const soc = Backend.getSocial();

    // FLIP: memoriza onde cada linha estava para animar a reordenação
    const oldTops = {};
    if (!entering) {
      el.querySelectorAll('[data-id]').forEach((r) => {
        oldTops[r.dataset.id] = r.getBoundingClientRect().top;
      });
    }

    let body = '';
    if (socialSeg === 'ranking') {
      const medal = ['🥇', '🥈', '🥉'];
      const top3 = soc.ranking.slice(0, 3);
      const rest = soc.ranking.slice(3);
      const podium = top3.length >= 2 ? `<div class="podium">
        ${top3[1] ? `<div class="pod-col">
          <div class="pod-avt">${avatar(top3[1], 'md')}</div>
          <div class="pod-name">${esc(top3[1].name.split(' ')[0])}</div>
          <div class="pod-pts">${top3[1].points} PinPoints</div>
          <div class="pod-bar p2">🥈</div>
        </div>` : ''}
        <div class="pod-col first">
          <div class="pod-avt">${avatar(top3[0], 'md')}</div>
          <div class="pod-name">${esc(top3[0].name.split(' ')[0])}</div>
          <div class="pod-pts">${top3[0].points} PinPoints</div>
          <div class="pod-bar p1">🥇</div>
        </div>
        ${top3[2] ? `<div class="pod-col">
          <div class="pod-avt">${avatar(top3[2], 'md')}</div>
          <div class="pod-name">${esc(top3[2].name.split(' ')[0])}</div>
          <div class="pod-pts">${top3[2].points} PinPoints</div>
          <div class="pod-bar p3">🥉</div>
        </div>` : ''}
      </div>` : '';
      body = podium + rest.map((r) => `
        <div class="rank-row ${r.you ? 'me' : ''}" data-id="${r.id}">
          <span class="pos">${r.rank}</span>
          ${avatar(r, 'sm')}
          <div class="info"><div class="nm">${r.you ? 'Você' : esc(r.name)}</div>
            <div class="lv">${esc(levelInfo(r.points).name)}</div></div>
          <span class="pts">${r.points} PinPoints</span>
        </div>`).join('') +
        '<p class="muted" style="margin-top:16px;font-size:13px">Faça um check-in e suba ao vivo.</p>';
    } else {
      const reqs = soc.requests.map((p) => `
        <div class="req-row" data-id="${p.id}">
          ${avatar(p, 'sm')}
          <div class="info"><div class="nm">${esc(p.name)}</div>
            <div class="mt">${esc(levelInfo(p.points).name)} · ${p.mutual} em comum</div></div>
          <button class="btn-round" data-decline="${p.id}">${ic('x')}</button>
          <button class="btn-round ok" data-accept="${p.id}">${ic('check')}</button>
        </div>`).join('');
      const friends = soc.friends.map((p) => `
        <div class="friend-row" data-id="${p.id}">
          ${avatar(p, 'sm')}
          <div class="info"><div class="nm">${esc(p.name)}</div>
            <div class="mt">${esc(levelInfo(p.points).name)} · ${p.mutual} em comum</div></div>
          <button class="btn-round chat" data-chat="${p.id}">${ic('message-circle')}</button>
        </div>`).join('') || '<p class="muted">Aceite pedidos ou adicione pessoas.</p>';
      const sugs = soc.suggestions.map((p) => `
        <div class="friend-row" data-id="${p.id}">
          ${avatar(p, 'sm')}
          <div class="info"><div class="nm">${esc(p.name)}</div>
            <div class="mt">${esc(levelInfo(p.points).name)} · ${p.mutual} em comum</div></div>
          ${p.status === 'requested_out'
            ? `<button class="btn-add sent" disabled>${ic('check')} Solicitado</button>`
            : `<button class="btn-add" data-add="${p.id}">${ic('user-plus')} Adicionar</button>`}
        </div>`).join('') || '<p class="muted">Sem sugestões no momento.</p>';

      body = `
        ${soc.requests.length ? `<div class="sec" style="margin-top:6px"><h3 style="font-size:17px">Pedidos pendentes</h3><p>Pessoas que querem viajar com você</p></div>${reqs}` : ''}
        <div class="sec"><h3 style="font-size:17px">Amigos · ${soc.friends.length}</h3></div>
        ${friends}
        <div class="sec"><h3 style="font-size:17px">Adicionar pessoas</h3><p>Sugestões com amigos em comum</p></div>
        ${sugs}`;
    }

    el.innerHTML = `<div class="app-pad ${entering ? 'stagger' : ''}">
      <div class="big-head">
        <div><div class="eyebrow-head">RANKING GLOBAL</div><h1>Social</h1></div>
        <span class="my-rank-pill">#${soc.my_rank} lugar</span>
      </div>
      <div class="tabs2">
        <button class="${socialSeg === 'ranking' ? 'on' : ''}" data-seg="ranking">Ranking</button>
        <button class="${socialSeg === 'friends' ? 'on' : ''}" data-seg="friends">Amigos${soc.requests.length ? `<span class="count-pill">${soc.requests.length}</span>` : ''}</button>
      </div>
      ${body}
    </div>`;
    el.scrollTop = st;

    // FLIP: cada linha desliza da posição antiga para a nova
    el.querySelectorAll('[data-id]').forEach((r) => {
      const prev = oldTops[r.dataset.id];
      if (prev == null) return;
      const d = prev - r.getBoundingClientRect().top;
      if (!d) return;
      r.style.transition = 'none';
      r.style.transform = `translateY(${d}px)`;
      requestAnimationFrame(() => {
        r.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)';
        r.style.transform = '';
      });
    });

    el.querySelectorAll('[data-seg]').forEach((b) => b.onclick = () => {
      socialSeg = b.dataset.seg;
      animateNext = true;
      render();
    });
    el.querySelectorAll('[data-accept]').forEach((b) => b.onclick = () => {
      const p = Backend.acceptRequest(b.dataset.accept);
      buzz(20);
      toast(`${esc(p.name)} agora faz parte da sua tripulação — entrou no ranking.`, 'ok');
    });
    el.querySelectorAll('[data-decline]').forEach((b) => b.onclick = () => {
      Backend.declineRequest(b.dataset.decline);
      toast('Pedido recusado', '');
    });
    el.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => {
      const p = Backend.sendRequest(b.dataset.add);
      buzz(15);
      toast(`Pedido enviado para ${esc(p.name)}`, 'ok');
    });
    el.querySelectorAll('[data-chat]').forEach((b) => b.onclick = () =>
      toast('Chat entre amigos chega na v2', ''));
  }

  // ───────────── feed social ─────────────
  function renderFeed(entering) {
    const el = document.getElementById('screen-feed');
    const st = el.scrollTop;
    const items = Backend.getFeed();

    const posts = items.map((p) => `
      <div class="post" data-id="${p.id}">
        <div class="ph">
          ${avatar(p, 'sm')}
          <div><div class="pn">${p.you ? 'Você' : esc(p.name)}</div>
          <div class="pm">${esc(levelInfo(p.points).name)} · ${timeAgo(p.ts)}</div></div>
        </div>
        <p class="ptext">${esc(p.text)}</p>
        ${p.attachment ? `<div class="postcard g-${p.attachment.category}">
          ${sceneSVG(p.attachment.category)}
          <span class="pc">${p.attachment.emoji}</span>
          <span class="pc-label">${esc(p.attachment.label)}</span>
        </div>` : ''}
        <div class="pact">
          <button class="plike ${p.liked ? 'on' : ''}" data-like="${p.id}">${ic('heart')} ${p.likes}</button>
          <button class="pcmt" data-cmt>${ic('message-circle')} ${p.comments}</button>
        </div>
      </div>`).join('') || '<p class="muted">Faça um check-in para inaugurar o feed.</p>';

    el.innerHTML = `<div class="app-pad ${entering ? 'stagger' : ''}">
      <div class="big-head">
        <div><div class="eyebrow-head">ATIVIDADE</div><h1>Feed</h1></div>
      </div>
      <div class="feedlist">${posts}</div>
    </div>`;
    el.scrollTop = st;

    el.querySelectorAll('[data-like]').forEach((b) => b.onclick = () => {
      buzz(10);
      Backend.toggleLike(b.dataset.like);
    });
    el.querySelectorAll('[data-cmt]').forEach((b) => b.onclick = () =>
      toast('Comentários chegam na v2', ''));
  }

  // ───────────── mapa ─────────────
  function initMap() {
    if (map) return;
    map = L.map('appmap', { zoomControl: false }).setView([Sim.lat, Sim.lng], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    userMarker = L.marker([Sim.lat, Sim.lng], {
      draggable: true, zIndexOffset: 1000,
      icon: L.divIcon({ className: '', html: '<div class="user-wrap"><span class="ring"></span><div class="user-dot"></div></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
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
    let pins = Backend.getMapPins();
    if (mapFilter === 'missions') pins = pins.filter((p) => p.kind === 'mission');
    pins.forEach((pin, i) => {
      const cls = pin.user_status === 'completed' ? 'done'
        : pin.user_status === 'locked' ? 'locked' : '';
      const label = pin.user_status === 'completed' ? '✓'
        : pin.user_status === 'locked' ? '🔒' : '+' + pin.base_points;
      const drop = animatePins ? ` style="animation-delay:${i * 40}ms"` : '';
      const icon = L.divIcon({
        className: '',
        html: `<div class="pinpill ${cls} ${animatePins ? 'drop' : ''}"${drop}>${pin.emoji} ${label}</div>`,
        iconSize: [72, 30], iconAnchor: [36, 15],
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
          radius: p.radius_m, color: '#E0541A', weight: 2,
          fillColor: '#E0541A', fillOpacity: 0.1, dashArray: '6 6',
        }).addTo(map);
      }
    }
  }

  // ───────────── overlay do mapa: busca, chips e carrossel ─────────────
  let mapFilter = 'all';
  let mapQuery = '';

  function renderMapOverlay() {
    if (activeTab !== 'map') return;
    const cardsEl = document.getElementById('map-cards');
    if (!cardsEl) return;
    let list = Backend.getMapPins().filter((p) => p.user_status !== 'locked');
    if (mapFilter === 'missions') list = list.filter((p) => p.kind === 'mission');
    const q = mapQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    list.sort((a, b) =>
      Backend.haversine(Sim.lat, Sim.lng, a.lat, a.lng) -
      Backend.haversine(Sim.lat, Sim.lng, b.lat, b.lng));

    cardsEl.innerHTML = list.slice(0, 8).map((p) => {
      const d = Backend.haversine(Sim.lat, Sim.lng, p.lat, p.lng);
      return `<div class="mp-card" data-place="${p.id}">
        <div class="mp-thumb g-${p.category}"><span>${p.emoji}</span></div>
        <div class="mp-info"><b>${esc(p.name)}</b>
        <span>${esc(p.category)} · ${fmtDist(d)}${p.user_status === 'completed' ? ' · ✓ visitado' : ''}</span></div>
        <span class="mp-go">${ic('chevron-right')}</span>
      </div>`;
    }).join('') || '<div class="mp-card empty">Nada encontrado por aqui…</div>';

    cardsEl.querySelectorAll('[data-place]').forEach((c) =>
      c.onclick = () => openSheet(c.dataset.place));
    UI.refreshIcons();
  }

  function initMapOverlay() {
    const inp = document.getElementById('map-search');
    if (inp) inp.addEventListener('input', (e) => { mapQuery = e.target.value; renderMapOverlay(); });
    document.querySelectorAll('[data-mfilter]').forEach((b) => b.onclick = () => {
      mapFilter = b.dataset.mfilter;
      buzz(8);
      document.querySelectorAll('[data-mfilter]').forEach((x) => x.classList.toggle('on', x === b));
      refreshMarkers();
      renderMapOverlay();
    });
    const fab = document.getElementById('map-fab');
    if (fab) fab.onclick = () => { if (map) map.setView([Sim.lat, Sim.lng], 16); buzz(10); };
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
    if (!sheetState) { el.classList.add('hidden'); el.classList.remove('page'); return; }
    el.classList.remove('hidden');
    el.classList.add('page'); // detalhes são páginas photo-first (v3)
    if (sheetState.type === 'place') renderPlaceSheet(el);
    else renderMissionSheet(el);
    UI.refreshIcons();
  }

  function renderPlaceSheet(el) {
    const d = Backend.getPlaceDetail(sheetState.id, Sim);
    if (!d) { closeSheet(); return; }

    const dist = d.distance_m;
    const ready = d.user_status === 'available' && validating !== d.id && inRange(d.id, dist, d.radius_m);

    const missionsCtx = d.missions.length ? `<div class="mission-pills">
      <span class="mpill-ey">Faz parte de</span>
      ${d.missions.map((m) => `<div class="mission-pill" data-mission="${m.id}">
        <span class="mp-ico">${m.badge}</span>
        <div class="mp-d"><div class="mp-name">${esc(m.name)}</div>
          <div class="mp-prog">${m.window === 'upcoming' ? 'Abre em ' + fmtDate(m.starts_at) : m.progress.completed + '/' + m.progress.total + ' locais'}</div></div>
        <span class="mp-chev">›</span>
      </div>`).join('')}
    </div>` : '';

    let bar = '';
    let force = '';
    if (d.user_status === 'completed') {
      const flaggedNote = d.checkin && d.checkin.status === 'flagged' ? ' · em revisão' : '';
      bar = `<div class="bar-status done">${ic('check')} Visitado em ${fmtDate(d.checkin && d.checkin.created_at)} · +${d.checkin ? d.checkin.points_awarded : d.base_points} PinPoints${flaggedNote}</div>`;
    } else if (d.user_status === 'locked') {
      const up = d.missions.find((m) => m.window === 'upcoming');
      bar = `<div class="bar-status">${ic('lock')} ${up ? 'Disponível a partir de ' + fmtDate(up.starts_at) : 'Indisponível no momento'}</div>`;
      force = '<button class="force-link" data-force>Testar mesmo assim — o servidor valida</button>';
    } else if (validating === d.id) {
      bar = `<div class="bar-pts"><b><em>+${d.base_points}</em> PinPoints</b><span>validando…</span></div>
        <button class="btn-cta" disabled><span class="spinner"></span>Confirmando…</button>`;
    } else if (ready) {
      bar = `<div class="bar-pts"><b><em>+${d.base_points}</em> PinPoints</b><span>você está no raio</span></div>
        <button class="btn-cta ready" data-checkin>Fazer check-in</button>`;
    } else {
      bar = `<div class="bar-pts"><b><em>+${d.base_points}</em> PinPoints</b><span>a ${fmtDist(dist)} de você</span></div>
        <button class="btn-cta" disabled>Chegue mais perto</button>`;
      force = '<button class="force-link" data-force>Testar mesmo assim — o servidor valida</button>';
    }

    el.innerHTML = `
      <div class="hero2 g-${d.category}">
        ${sceneSVG(d.category)}
        <div class="h2shade"></div>
        <button class="hbtn2 l" data-close>${ic('arrow-left')}</button>
        <button class="hbtn2 r" data-fav>${ic('bookmark')}</button>
        <div class="h2info">
          <div class="h2t">${esc(d.name)}</div>
          <div class="h2s">${esc(d.category)} · ${esc(d.address)}</div>
        </div>
      </div>
      <div class="page-body2">
        ${sheetState.from ? '<span class="crumb" data-back>‹ Voltar para a trilha</span>' : ''}
        <div class="stat-chips">
          <span class="schip">${ic('footprints')} ${fmtDist(dist)}</span>
          <span class="schip">${ic('target')} raio ${d.radius_m} m</span>
          ${d.user_status === 'completed' ? `<span class="schip g">${ic('check')} Visitado</span>` : `<span class="schip a">${ic('star')} +${d.base_points} PinPoints</span>`}
        </div>
        ${d.user_status !== 'completed' ? `<div class="dt-actions"><button class="action-chip" data-route>${ic('navigation')} Como chegar</button></div>` : ''}
        ${missionsCtx}
        <p class="dt-desc">${esc(d.description)}</p>
        ${Sim.accuracy > 50 && d.user_status === 'available' ? '<div class="gps-warn">Sinal de GPS impreciso (' + Sim.accuracy + ' m) — o servidor tolera até raio + 50 m.</div>' : ''}
        ${force}
      </div>
      <div class="cta-bar">${bar}</div>`;

    el.querySelector('[data-close]').onclick = closeSheet;
    const back = el.querySelector('[data-back]');
    if (back) back.onclick = () => openMissionDetail(sheetState.from);
    const fav = el.querySelector('[data-fav]');
    if (fav) fav.onclick = () => toast('Favoritos chegam na v2', '');
    el.querySelectorAll('[data-mission]').forEach((m) =>
      m.addEventListener('click', () => openMissionDetail(m.dataset.mission)));
    const btn = el.querySelector('[data-checkin]');
    if (btn) btn.onclick = () => doCheckin(d.id);
    const forceBtn = el.querySelector('[data-force]');
    if (forceBtn) forceBtn.onclick = () => doCheckin(d.id);
    const route = el.querySelector('[data-route]');
    if (route) route.onclick = () => toast('No app real: deep link para Google Maps / Waze.', '');
  }

  function renderMissionSheet(el) {
    const d = Backend.getAchievementDetail(sheetState.id, Sim);
    if (!d) { closeSheet(); return; }
    const pct = d.progress.total ? Math.round((d.progress.completed / d.progress.total) * 100) : 0;

    const rows = d.places.map((p) => {
      const done = p.user_status === 'completed';
      const locked = p.user_status === 'locked';
      return `<div class="mpr ${done ? 'done' : ''}" data-place="${p.id}">
        <div class="mpr-t g-${p.category || 'historico'}">
          ${sceneSVG(p.category || 'historico')}
          <span class="mpr-em">${p.emoji}</span>
          ${done ? `<div class="mpr-chk">${ic('check')}</div>` : locked ? `<div class="mpr-lk">🔒</div>` : ''}
        </div>
        <div class="mpr-i">
          <div class="mpr-n">${esc(p.name)}</div>
          <div class="mpr-m">${done ? '✓ +' + p.base_points + ' PinPoints' : fmtDist(p.distance_m)}</div>
        </div>
        <div class="mpr-r">${done ? '<span class="mpr-badge">✓</span>' : '<span class="mpr-chev">›</span>'}</div>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="hero2 g-${d.category || 'conquista'}">
        ${sceneSVG(d.category || 'conquista')}
        <div class="h2shade"></div>
        <button class="hbtn2 l" data-close>${ic('arrow-left')}</button>
        <div class="h2info">
          <div class="h2t">${esc(d.name)}</div>
          <div class="h2s" style="text-transform:none">+${d.bonus_points} PinPoints de bônus ao completar</div>
        </div>
      </div>
      <div class="page-body2" style="padding-bottom:30px">
        ${d.unlocked ? `<div class="unlocked-banner">${ic('trophy')} Concluída em ${fmtDate(d.unlockedAt)} · +${d.bonus_points} PinPoints creditados</div>` : ''}
        <div class="mprogblock">
          <div class="mpb-row">
            <span class="mpb-frac">${d.progress.completed} de ${d.progress.total} locais visitados</span>
            <span class="mpb-pct">${pct}%</span>
          </div>
          <div class="mpb-bar"><div class="mpb-fill" style="width:${pct}%"></div></div>
        </div>
        <p class="dt-desc">${esc(d.description)}</p>
        <div class="sec row" style="margin:22px 0 8px"><h3 style="font-size:18px">Roteiro</h3><span class="muted">${d.places.length} locais</span></div>
        ${rows}
      </div>`;

    el.querySelector('[data-close]').onclick = closeSheet;
    el.querySelectorAll('[data-place]').forEach((r) =>
      r.addEventListener('click', () => openSheet(r.dataset.place, { from: d.id })));
  }

  // ───────────── check-in ─────────────
  async function doCheckin(placeId) {
    if (validating) return;
    // memória entre telas: nível e posição no ranking ANTES do check-in
    const btn = document.querySelector('#sheet [data-checkin], #sheet [data-force]');
    const btnRect = btn ? btn.getBoundingClientRect() : null;
    const prevLvlName = levelInfo(Backend.getStats().points).name;
    const prevRank = Backend.getSocial().my_rank;
    const prevStreakToday = Backend.getStats().streak.today;
    validating = placeId;
    renderSheet();
    try {
      const res = await Backend.performCheckin(placeId, {
        lat: Sim.lat, lng: Sim.lng, accuracy_m: Sim.accuracy, is_mock_location: Sim.mock,
      });
      validating = null;
      buzz(res.checkin.status === 'flagged' ? [20, 40, 20] : 35);
      flyPoints(btnRect, '+' + res.checkin.points_awarded);
      if (res.checkin.status === 'flagged') {
        toast(`+${res.checkin.points_awarded} PinPoints — ⚠️ check-in sinalizado para revisão (veja Admin → Revisão)`, 'warn');
      } else {
        toast(`✅ Check-in confirmado! +${res.checkin.points_awarded} PinPoints (a ${res.validation.distance_m} m do centro)`, 'ok');
      }
      res.achievements_progress.forEach((ap) => {
        recentlyUpdated[ap.achievement_id] = Date.now(); // a Home vai brilhar neste card
        if (ap.newly_unlocked) queueCelebration(ap);
        else if (ap.total) toast(`${ap.badge} ${esc(ap.name)}: ${ap.completed}/${ap.total}`, '');
      });
      // telas conversando: subiu de nível? ultrapassou alguém no ranking?
      const lvlNow = levelInfo(Backend.getStats().points);
      if (lvlNow.name !== prevLvlName) {
        queueCelebration({ kind: 'level', name: lvlNow.name, badge: lvlNow.emoji });
      }
      const socNow = Backend.getSocial();
      if (socNow.my_rank < prevRank) {
        const passed = socNow.ranking.find((r) => r.rank === socNow.my_rank + 1);
        toast(`🔥 Você subiu para #${socNow.my_rank} no ranking${passed ? ' — ultrapassou ' + esc(passed.name) + '!' : '!'}`, 'ok');
      }
      const streakNow = Backend.getStats().streak;
      if (streakNow.today && !prevStreakToday) {
        toast(streakNow.count === 1
          ? '🔥 Ofensiva iniciada! Volte amanhã para mantê-la.'
          : `🔥 Ofensiva de ${streakNow.count} dias mantida! Volte amanhã.`, 'ok');
      }
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
    const isLevel = ap.kind === 'level';
    el.innerHTML = `<div class="rays"></div>${confetti}
      <div class="badge">${ap.badge || '🏆'}</div>
      <h2>${isLevel ? 'Você subiu de nível!' : 'Conquista desbloqueada!'}</h2>
      <div class="mn">${isLevel ? 'Novo título de viajante' : esc(ap.name)}</div>
      <div class="bonus">${isLevel ? esc(ap.name) : '+' + ap.bonus_points + ' PinPoints de bônus'}</div>
      <button>${isLevel ? 'Continuar a jornada' : 'Continuar explorando'}</button>`;
    el.classList.remove('hidden');
    buzz([30, 60, 90]);
    el.querySelector('button').onclick = showNextCelebration;
  }

  // ───────────── tabs do telefone ─────────────
  const TAB_ORDER = ['home', 'map', 'feed', 'social', 'profile'];
  function switchTab(tab) {
    const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(activeTab) ? 'r' : 'l';
    activeTab = tab;
    buzz(8);
    document.querySelectorAll('.tabbar button').forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === tab));
    TAB_ORDER.forEach((t) => {
      const s = document.getElementById('screen-' + t);
      if (s) s.classList.toggle('hidden', t !== tab);
    });
    const scr = document.getElementById('screen-' + tab);
    if (scr) {
      scr.classList.remove('screen-enter-r', 'screen-enter-l');
      void scr.offsetWidth; // re-dispara a animação de entrada
      scr.classList.add('screen-enter-' + dir);
    }
    animateNext = true;
    if (tab === 'map') {
      animatePins = true;
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
    const entering = animateNext;
    animateNext = false;
    if (activeTab === 'home') renderHome(entering);
    else if (activeTab === 'profile') renderProfile(entering);
    else if (activeTab === 'social') renderSocial(entering);
    else if (activeTab === 'feed') renderFeed(entering);
    refreshMarkers();
    renderMapOverlay();
    renderSheet();
    UI.refreshIcons();
    runCounters(entering);
    animatePins = false;
  }

  function init() {
    document.querySelectorAll('.tabbar button').forEach((b) =>
      b.addEventListener('click', () => switchTab(b.dataset.tab)));
    bindSimPanel();
    initMapOverlay();

    // splash de identidade: 1x por sessão, toque pula
    const splash = document.getElementById('splash');
    if (splash) {
      let seen = false;
      try { seen = !!sessionStorage.getItem('tq_splash'); } catch (e) { /* file:// */ }
      if (seen) {
        splash.classList.add('hide');
      } else {
        try { sessionStorage.setItem('tq_splash', '1'); } catch (e) { /* ok */ }
        setTimeout(() => splash.classList.add('hide'), 1700);
        splash.addEventListener('click', () => splash.classList.add('hide'));
      }
    }

    animateNext = true;
    render();
  }

  globalThis.AppView = { init, render, populateTeleport, openSheet, openMissionDetail };
})();

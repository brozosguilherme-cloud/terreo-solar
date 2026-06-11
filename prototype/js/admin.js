/* Dashboard Admin: Locais, Conquistas (wizard) e fila de Revisão */
(function () {
  'use strict';
  const { toast, esc, fmtDate, fmtDateTime, openModal, confirmModal, alertModal } = UI;
  const fmtDist = (m) => Backend.fmtDist(m);

  let activeTab = 'places';
  const CATEGORIES = ['historico', 'cultura', 'gastronomia', 'natureza', 'evento'];

  function statusChip(s) {
    return { draft: '<span class="statuschip chip-draft">rascunho</span>',
             active: '<span class="statuschip chip-active">ativo</span>',
             archived: '<span class="statuschip chip-archived">arquivado</span>' }[s] || s;
  }

  // ═══════════════ LOCAIS ═══════════════
  function renderPlaces(el) {
    const places = Backend.adminListPlaces();
    const rows = places.map((p) => `
      <tr>
        <td>${p.emoji} <b>${esc(p.name)}</b><br><span class="muted" style="font-size:11.5px">${esc(p.city || '')}</span></td>
        <td>${statusChip(p.status)}</td>
        <td>${p.base_points} pts</td>
        <td>${p.radius_m} m</td>
        <td>${p.visibility === 'mission_only' ? '🔒 só missão' : '🌎 sempre'}</td>
        <td>${p.missions.length ? p.missions.map((m) => esc(m.name)).join('<br>') : '<span class="muted">— avulso</span>'}</td>
        <td>${p.checkins_count}</td>
        <td><div class="actions">
          <button class="btn-outline" data-edit="${p.id}">Editar</button>
          ${p.status === 'draft' ? `<button class="btn-primary" data-pub="${p.id}">Publicar</button>` : ''}
          ${p.status === 'active' ? `<button class="btn-danger-outline" data-arch="${p.id}">Arquivar</button>` : ''}
        </div></td>
      </tr>`).join('');

    el.innerHTML = `<div class="admin-card">
      <div class="admin-head">
        <h2>📍 Locais (Check-ins Simples)</h2>
        <button class="btn-primary" data-new>+ Novo local</button>
      </div>
      <div class="table-scroll"><table class="admin">
        <thead><tr><th>Local</th><th>Status</th><th>Pontos</th><th>Raio</th><th>Visibilidade</th><th>Missões</th><th>Check-ins</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;

    el.querySelector('[data-new]').onclick = () => openPlaceModal();
    el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openPlaceModal(b.dataset.edit));
    el.querySelectorAll('[data-pub]').forEach((b) => b.onclick = () => {
      try { Backend.adminPublishPlace(b.dataset.pub); toast('✅ Local publicado — já aparece no app', 'ok'); }
      catch (e) { alertModal('Pendências para publicar', '<ul><li>' + (e.details.problems || [e.message]).join('</li><li>') + '</li></ul>'); }
    });
    el.querySelectorAll('[data-arch]').forEach((b) => b.onclick = async () => {
      const p = places.find((x) => x.id === b.dataset.arch);
      const activeMs = p ? p.missions.filter((m) => m.status === 'active') : [];
      if (activeMs.length) { // aviso bloqueante (doc 04): nem abre a confirmação
        alertModal('⚠️ Local em missão ativa', `Este local faz parte de: <b>${activeMs.map((m) => esc(m.name)).join(', ')}</b>.<br><br>Arquivá-lo deixaria a missão impossível de completar. Remova o vínculo ou arquive a missão antes (regra do doc 04).`);
        return;
      }
      try {
        if (await confirmModal('Arquivar local', 'O local sai do app. Check-ins e pontos já concedidos são preservados.', 'Arquivar'))
          Backend.adminArchivePlace(b.dataset.arch);
      } catch (e) { alertModal('Erro', esc(e.message)); }
    });
  }

  /* Formulário de Local (doc 04, seção 4.1) — usado também dentro do wizard de missão */
  function openPlaceModal(placeId, opts) {
    opts = opts || {};
    const existing = placeId ? Backend.adminListPlaces().find((p) => p.id === placeId) : null;
    const d = existing || { name: '', emoji: '📍', category: 'historico', description: '',
      address: '', city: 'São Paulo', lat: null, lng: null, radius_m: 100,
      base_points: 10, visibility: 'always' };

    let mmap = null, marker = null, circle = null;
    const state = { lat: d.lat, lng: d.lng, radius: d.radius_m };

    const m = openModal(`
      <h2>${existing ? 'Editar local' : 'Novo local (Check-in Simples)'}</h2>
      <div class="grid3">
        <label class="field">Nome*<input type="text" id="pf-name" value="${esc(d.name)}"></label>
        <label class="field">Emoji<input type="text" id="pf-emoji" value="${esc(d.emoji)}"></label>
        <label class="field">Categoria*<select id="pf-cat">${CATEGORIES.map((c) => `<option ${c === d.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      </div>
      <label class="field">Descrição<textarea id="pf-desc" rows="2">${esc(d.description)}</textarea></label>
      <div class="grid2">
        <label class="field">Endereço<input type="text" id="pf-addr" value="${esc(d.address)}"></label>
        <label class="field">Cidade<input type="text" id="pf-city" value="${esc(d.city)}"></label>
      </div>
      <label class="field">📍 Posição e geofence — <b>clique no mapa</b> para posicionar o pin (arraste para ajuste fino)
        <div class="modal-map" id="pf-map"></div>
      </label>
      <label class="field">Raio do geofence: <b id="pf-radius-label">${d.radius_m} m</b>
        <input type="range" id="pf-radius" min="30" max="1000" step="10" value="${d.radius_m}">
        <span class="hint">guia: estátua 30–50 m · prédio 75–100 m · praça 150–300 m · parque 300–500 m</span>
      </label>
      <div id="pf-overlap"></div>
      <div class="grid2">
        <label class="field">Pontos do check-in<input type="number" id="pf-pts" value="${d.base_points}" min="0"></label>
        <label class="field">Visibilidade<select id="pf-vis">
          <option value="always" ${d.visibility === 'always' ? 'selected' : ''}>Sempre visível (card avulso + missões)</option>
          <option value="mission_only" ${d.visibility === 'mission_only' ? 'selected' : ''}>Somente dentro de missão</option>
        </select></label>
      </div>
      <div id="pf-err"></div>
      <div class="footer">
        <button class="btn-outline" data-cancel>Cancelar</button>
        <button class="btn-outline" data-save>Salvar rascunho</button>
        ${existing && existing.status === 'active' ? '<button class="btn-primary" data-save-active>Salvar alterações</button>'
          : '<button class="btn-primary" data-publish>Salvar e publicar</button>'}
      </div>`, {
      modal: true, width: '680px',
      onClose: () => { if (mmap) mmap.remove(); },
    });

    // mini-mapa com pin + círculo do raio em tempo real
    setTimeout(() => {
      const center = state.lat != null ? [state.lat, state.lng] : [-23.5495, -46.6355];
      mmap = L.map(m.body.querySelector('#pf-map')).setView(center, state.lat != null ? 16 : 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OSM &copy; CARTO' }).addTo(mmap);
      const setPoint = (lat, lng) => {
        state.lat = lat; state.lng = lng;
        if (!marker) {
          marker = L.marker([lat, lng], { draggable: true }).addTo(mmap);
          marker.on('drag', (e) => { const ll = e.target.getLatLng(); setPoint(ll.lat, ll.lng); });
        } else marker.setLatLng([lat, lng]);
        if (!circle) circle = L.circle([lat, lng], { radius: state.radius, color: '#4f46e5', fillOpacity: .12 }).addTo(mmap);
        else circle.setLatLng([lat, lng]);
        checkOverlap();
      };
      if (state.lat != null) setPoint(state.lat, state.lng);
      mmap.on('click', (e) => setPoint(e.latlng.lat, e.latlng.lng));
      setTimeout(() => mmap.invalidateSize(), 80);
      m.body.querySelector('#pf-radius').addEventListener('input', (e) => {
        state.radius = Number(e.target.value);
        m.body.querySelector('#pf-radius-label').textContent = state.radius + ' m';
        if (circle) circle.setRadius(state.radius);
        checkOverlap();
      });
    }, 30);

    function checkOverlap() {
      const box = m.body.querySelector('#pf-overlap');
      if (state.lat == null) { box.innerHTML = ''; return; }
      const ov = Backend.adminOverlaps(state.lat, state.lng, state.radius, placeId);
      box.innerHTML = ov.length
        ? `<div class="warnbox">⚠️ Geofence sobrepõe: ${ov.slice(0, 3).map((o) => `<b>${esc(o.place.name)}</b> (${fmtDist(o.distance)})`).join(', ')} — verifique se não é cadastro duplicado.</div>`
        : '';
    }

    function collect() {
      return {
        ...(placeId ? { id: placeId } : {}),
        name: m.body.querySelector('#pf-name').value.trim(),
        emoji: m.body.querySelector('#pf-emoji').value.trim() || '📍',
        category: m.body.querySelector('#pf-cat').value,
        description: m.body.querySelector('#pf-desc').value.trim(),
        address: m.body.querySelector('#pf-addr').value.trim(),
        city: m.body.querySelector('#pf-city').value.trim(),
        lat: state.lat, lng: state.lng, radius_m: state.radius,
        base_points: Number(m.body.querySelector('#pf-pts').value) || 0,
        visibility: m.body.querySelector('#pf-vis').value,
      };
    }
    function fail(e) {
      m.body.querySelector('#pf-err').innerHTML =
        `<div class="errbox">${e.details && e.details.problems ? e.details.problems.join(' · ') : esc(e.message)}</div>`;
    }

    m.body.querySelector('[data-cancel]').onclick = m.close;
    m.body.querySelector('[data-save]').onclick = () => {
      try {
        const p = Backend.adminSavePlace(collect());
        toast('💾 Rascunho salvo', 'ok'); m.close();
        if (opts.onSaved) opts.onSaved(p);
      } catch (e) { fail(e); }
    };
    const pub = m.body.querySelector('[data-publish]');
    if (pub) pub.onclick = () => {
      try {
        const p = Backend.adminSavePlace(collect());
        Backend.adminPublishPlace(p.id);
        toast('✅ Local publicado — já aparece no app', 'ok'); m.close();
        if (opts.onSaved) opts.onSaved(p);
      } catch (e) { fail(e); }
    };
    const saveActive = m.body.querySelector('[data-save-active]');
    if (saveActive) saveActive.onclick = () => {
      try {
        const p = Backend.adminSavePlace(collect());
        toast('💾 Alterações salvas (pontos novos valem só para check-ins futuros)', 'ok'); m.close();
        if (opts.onSaved) opts.onSaved(p);
      } catch (e) { fail(e); }
    };
  }

  // ═══════════════ CONQUISTAS ═══════════════
  function renderMissions(el) {
    const list = Backend.adminListAchievements();
    const cards = list.map((a) => `
      <div class="mission-admin-card">
        <span class="badge">${a.badge}</span>
        <div class="info">
          <b>${esc(a.name)}</b> ${statusChip(a.status)}
          ${a.window === 'upcoming' ? '<span class="statuschip chip-soon">abre ' + fmtDate(a.starts_at) + '</span>' : ''}
          ${a.window === 'expired' ? '<span class="statuschip chip-soon">expirada</span>' : ''}
          <div class="meta">${a.places.length} locais · bônus ${a.bonus_points} pts ·
            seu progresso: ${a.progress.completed}/${a.progress.total} ${a.unlocked ? '🏆' : ''}</div>
        </div>
        <div class="actions">
          <button class="btn-outline" data-edit="${a.id}">Editar</button>
          ${a.status === 'draft' ? `<button class="btn-primary" data-pub="${a.id}">Publicar</button>` : ''}
          ${a.status === 'active' ? `<button class="btn-danger-outline" data-arch="${a.id}">Arquivar</button>` : ''}
        </div>
      </div>`).join('');

    el.innerHTML = `<div class="admin-card">
      <div class="admin-head">
        <h2>🏆 Conquistas (Missões)</h2>
        <button class="btn-primary" data-new>+ Nova conquista</button>
      </div>
      ${cards || '<p class="muted">Nenhuma conquista criada.</p>'}
    </div>`;

    el.querySelector('[data-new]').onclick = () => openMissionWizard();
    el.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openMissionWizard(b.dataset.edit));
    el.querySelectorAll('[data-pub]').forEach((b) => b.onclick = () => {
      try { Backend.adminPublishAchievement(b.dataset.pub); toast('✅ Conquista publicada', 'ok'); }
      catch (e) { alertModal('Pendências para publicar', '<ul><li>' + (e.details.problems || [e.message]).join('</li><li>') + '</li></ul>'); }
    });
    el.querySelectorAll('[data-arch]').forEach((b) => b.onclick = async () => {
      if (await confirmModal('Arquivar conquista', 'A missão sai do app. Badges, conclusões e pontos já concedidos são preservados (grandfathering — doc 04).', 'Arquivar'))
        Backend.adminArchiveAchievement(b.dataset.arch);
    });
  }

  /* Wizard de Conquista (doc 04, seção 4.2) — 3 etapas */
  function openMissionWizard(missionId) {
    const existing = missionId ? Backend.adminListAchievements().find((a) => a.id === missionId) : null;
    const isActive = existing && existing.status === 'active';
    const state = {
      step: 1,
      info: existing
        ? { name: existing.name, badge: existing.badge, description: existing.description,
            bonus_points: existing.bonus_points, starts_at: existing.starts_at, ends_at: existing.ends_at }
        : { name: '', badge: '🏆', description: '', bonus_points: 0, starts_at: null, ends_at: null },
      links: existing ? existing.places.map((p) => p.id) : [],
      showPicker: false,
    };

    const m = openModal('<div id="wiz"></div>', { modal: true, width: '680px' });
    const wiz = () => m.body.querySelector('#wiz');

    function placeName(id) {
      const p = Backend.adminListPlaces().find((x) => x.id === id);
      return p ? `${p.emoji} ${p.name} ${p.status !== 'active' ? '<span class="statuschip chip-draft">rascunho</span>' : ''}` : id;
    }

    function render() {
      const s = state.step;
      let body = '';

      if (s === 1) {
        body = `
          <div class="grid3">
            <label class="field">Nome da missão*<input type="text" id="mw-name" value="${esc(state.info.name)}"></label>
            <label class="field">Badge (emoji)*<input type="text" id="mw-badge" value="${esc(state.info.badge)}"></label>
            <label class="field">Bônus de conclusão<input type="number" id="mw-bonus" value="${state.info.bonus_points}" min="0"></label>
          </div>
          <label class="field">Narrativa / descrição<textarea id="mw-desc" rows="3">${esc(state.info.description)}</textarea></label>
          <div class="grid2">
            <label class="field">Início da vigência (opcional)<input type="date" id="mw-starts" value="${state.info.starts_at ? state.info.starts_at.slice(0, 10) : ''}"></label>
            <label class="field">Fim da vigência (opcional)<input type="date" id="mw-ends" value="${state.info.ends_at ? state.info.ends_at.slice(0, 10) : ''}"></label>
          </div>
          <div class="infobox">💡 Sugestão de bônus: ~50% da soma dos pontos dos locais vinculados.</div>`;
      }

      if (s === 2) {
        if (isActive) {
          body = `<div class="warnbox">🔒 <b>Missão ativa:</b> o conjunto de locais não pode ser alterado — quem já completou seria "desconcluído"
            (decisão D9, doc 04). Para mudar a composição, arquive esta missão e crie a "Vol. 2".</div>
            <div class="linked-list">${state.links.map((id, i) => `<div class="linked-row"><span class="ord">${i + 1}</span><span class="nm">${placeName(id)}</span></div>`).join('')}</div>`;
        } else {
          const linked = state.links.map((id, i) => `
            <div class="linked-row">
              <span class="ord">${i + 1}</span>
              <span class="nm">${placeName(id)}</span>
              <button data-up="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button data-down="${i}" ${i === state.links.length - 1 ? 'disabled' : ''}>↓</button>
              <button data-rm="${i}">✕</button>
            </div>`).join('');
          const candidates = Backend.adminListPlaces()
            .filter((p) => p.status !== 'archived' && !state.links.includes(p.id));
          const picker = state.showPicker ? `
            <div class="picker">${candidates.map((p) => `
              <label><input type="checkbox" data-pick="${p.id}">
                ${p.emoji} ${esc(p.name)} ${p.status !== 'active' ? '<span class="statuschip chip-draft">rascunho</span>' : ''}
                <span class="sub">${p.missions.length ? 'já em: ' + p.missions.map((x) => esc(x.name)).join(', ') : 'avulso'}</span>
              </label>`).join('') || '<p class="muted">Todos os locais já estão vinculados.</p>'}
              <div class="footer" style="margin-top:8px"><button class="btn-primary" data-pick-add>Adicionar selecionados</button></div>
            </div>` : '';
          body = `
            <p class="muted">Uma conquista agrupa Locais existentes (N:N — vincular não move nem duplica) ou novos, criados aqui dentro.</p>
            <div class="linked-list">${linked || '<div class="linked-row muted">Nenhum local vinculado ainda.</div>'}</div>
            <div class="btnrow" style="margin-top:8px">
              <button class="btn-outline" data-add-existing>🔗 Vincular local existente</button>
              <button class="btn-outline" data-add-new>✨ Criar novo local</button>
            </div>
            ${picker}`;
        }
      }

      if (s === 3) {
        const places = state.links.map((id) => Backend.adminListPlaces().find((p) => p.id === id)).filter(Boolean);
        const drafts = places.filter((p) => p.status !== 'active');
        const sum = places.reduce((acc, p) => acc + p.base_points, 0);
        const checks = [
          { ok: !!state.info.name, label: 'Nome definido' },
          { ok: !!state.info.badge, label: 'Badge definido' },
          { ok: state.links.length >= 2, label: `Pelo menos 2 locais vinculados (${state.links.length})` },
          { ok: drafts.length === 0, label: drafts.length ? `Locais em rascunho: ${drafts.map((p) => esc(p.name)).join(', ')}` : 'Todos os locais publicados' },
        ];
        body = `
          <ul class="checklist">${checks.map((c) => `<li class="${c.ok ? 'ok' : 'bad'}">${c.label}</li>`).join('')}</ul>
          ${drafts.length ? `<button class="btn-outline" data-pub-drafts>📤 Publicar ${drafts.length} local(is) em rascunho</button>` : ''}
          <div class="infobox">Σ pontos da missão: <b>${sum} pts</b> nos check-ins + <b>${state.info.bonus_points} pts</b> de bônus = <b>${sum + Number(state.info.bonus_points)} pts</b> possíveis.</div>`;
      }

      wiz().innerHTML = `
        <h2>${existing ? 'Editar conquista' : 'Nova conquista (Missão)'}</h2>
        <div class="steps">
          <div class="step ${s >= 1 ? 'on' : ''}">1 · Identidade</div>
          <div class="step ${s >= 2 ? 'on' : ''}">2 · Locais</div>
          <div class="step ${s >= 3 ? 'on' : ''}">3 · Revisão</div>
        </div>
        ${body}
        <div id="mw-err"></div>
        <div class="footer">
          <button class="btn-outline" data-cancel>Cancelar</button>
          ${s > 1 ? '<button class="btn-outline" data-back>← Voltar</button>' : ''}
          ${s < 3 ? '<button class="btn-primary" data-next>Avançar →</button>' : `
            <button class="btn-outline" data-savedraft>Salvar rascunho</button>
            ${!isActive ? '<button class="btn-primary" data-publish>Publicar missão</button>' : '<button class="btn-primary" data-saveactive>Salvar alterações</button>'}`}
        </div>`;
      bind();
    }

    function collectStep1() {
      if (state.step !== 1) return;
      const g = (id) => wiz().querySelector(id);
      state.info.name = g('#mw-name').value.trim();
      state.info.badge = g('#mw-badge').value.trim();
      state.info.bonus_points = Number(g('#mw-bonus').value) || 0;
      state.info.description = g('#mw-desc').value.trim();
      state.info.starts_at = g('#mw-starts').value ? new Date(g('#mw-starts').value + 'T00:00:00').toISOString() : null;
      state.info.ends_at = g('#mw-ends').value ? new Date(g('#mw-ends').value + 'T23:59:59').toISOString() : null;
    }

    function persist(publish) {
      collectStep1();
      try {
        const a = Backend.adminSaveAchievement(
          { ...(missionId ? { id: missionId } : {}), ...state.info },
          isActive ? null : state.links);
        if (publish) Backend.adminPublishAchievement(a.id);
        toast(publish ? '✅ Conquista publicada — já aparece no app' : '💾 Rascunho salvo', 'ok');
        m.close();
      } catch (e) {
        wiz().querySelector('#mw-err').innerHTML =
          `<div class="errbox">${e.details && e.details.problems ? e.details.problems.join(' · ') : esc(e.message)}</div>`;
      }
    }

    function bind() {
      const q = (sel) => wiz().querySelector(sel);
      q('[data-cancel]').onclick = m.close;
      const back = q('[data-back]'); if (back) back.onclick = () => { collectStep1(); state.step--; render(); };
      const next = q('[data-next]'); if (next) next.onclick = () => { collectStep1(); state.step++; render(); };
      const sd = q('[data-savedraft]'); if (sd) sd.onclick = () => persist(false);
      const pb = q('[data-publish]'); if (pb) pb.onclick = () => persist(true);
      const sa = q('[data-saveactive]'); if (sa) sa.onclick = () => persist(false);

      const addEx = q('[data-add-existing]');
      if (addEx) addEx.onclick = () => { state.showPicker = !state.showPicker; render(); };
      const addNew = q('[data-add-new]');
      if (addNew) addNew.onclick = () => openPlaceModal(null, {
        onSaved: (p) => { state.links.push(p.id); state.showPicker = false; render(); }, // auto-vincula (doc 04)
      });
      const pickAdd = q('[data-pick-add]');
      if (pickAdd) pickAdd.onclick = () => {
        wiz().querySelectorAll('[data-pick]:checked').forEach((c) => state.links.push(c.dataset.pick));
        state.showPicker = false; render();
      };
      wiz().querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { state.links.splice(Number(b.dataset.rm), 1); render(); });
      wiz().querySelectorAll('[data-up]').forEach((b) => b.onclick = () => {
        const i = Number(b.dataset.up);
        [state.links[i - 1], state.links[i]] = [state.links[i], state.links[i - 1]]; render();
      });
      wiz().querySelectorAll('[data-down]').forEach((b) => b.onclick = () => {
        const i = Number(b.dataset.down);
        [state.links[i + 1], state.links[i]] = [state.links[i], state.links[i + 1]]; render();
      });
      const pd = q('[data-pub-drafts]');
      if (pd) pd.onclick = () => {
        state.links.forEach((id) => {
          const p = Backend.adminListPlaces().find((x) => x.id === id);
          if (p && p.status === 'draft') { try { Backend.adminPublishPlace(id); } catch (e) { toast('❌ ' + esc(p.name) + ': ' + (e.details.problems || [e.message]).join(', '), 'err'); } }
        });
        render();
      };
    }

    render();
  }

  // ═══════════════ REVISÃO (antifraude) ═══════════════
  function renderReview(el) {
    const flagged = Backend.adminListFlagged();
    const items = flagged.map((c) => `
      <div class="review-item">
        <div class="head">${c.place ? c.place.emoji + ' ' + esc(c.place.name) : c.place_id}
          <span class="statuschip chip-flagged">sinalizado</span>
          <span class="muted" style="margin-left:auto;font-weight:400">${fmtDateTime(c.created_at)}</span>
        </div>
        <div class="facts">
          <span class="fact">📏 distância validada: ${c.distance_m} m (raio ${c.place ? c.place.radius_m : '?'} m)</span>
          <span class="fact">📡 precisão: ${c.accuracy_m != null ? c.accuracy_m + ' m' : '—'}</span>
          ${c.speed_kmh != null ? `<span class="fact">🚀 velocidade desde o último check-in: ${c.speed_kmh} km/h</span>` : ''}
          ${c.is_mock_location ? '<span class="fact" style="background:#fee2e2;color:#b91c1c">🎭 mock location detectado</span>' : ''}
          <span class="fact">⭐ ${c.points_awarded} pts concedidos (revogáveis)</span>
        </div>
        <div class="actions">
          <button class="btn-outline" data-approve="${c.id}">✓ Aprovar (legítimo)</button>
          <button class="btn-danger-outline" data-revoke="${c.id}">✕ Revogar e estornar</button>
        </div>
      </div>`).join('');

    el.innerHTML = `<div class="admin-card">
      <div class="admin-head"><h2>🚩 Fila de revisão antifraude</h2></div>
      <p class="muted">Sinais "soft" (viagem impossível, mock location) não bloqueiam o check-in — concedem os pontos
      e caem aqui para decisão humana (decisão D8). A revogação estorna via ledger, nunca apaga histórico.</p>
      ${items || '<p class="muted">Nenhum check-in sinalizado. 🎉 (Dica: teleporte para longe sem avançar o relógio, ou ligue o mock location.)</p>'}
    </div>`;

    el.querySelectorAll('[data-approve]').forEach((b) => b.onclick = () => {
      Backend.adminApproveCheckin(b.dataset.approve);
      toast('✓ Check-in aprovado', 'ok');
    });
    el.querySelectorAll('[data-revoke]').forEach((b) => b.onclick = async () => {
      if (!await confirmModal('Revogar check-in', 'Os pontos serão estornados no ledger. Se uma conquista dependia deste check-in, ela também será revogada (fraude não tem grandfathering).', 'Revogar')) return;
      const res = Backend.adminRevokeCheckin(b.dataset.revoke);
      toast(`↩️ ${res.reversed_points} pts estornados${res.revoked_achievements.length ? ' · conquistas revogadas: ' + res.revoked_achievements.join(', ') : ''}`, 'warn');
    });
  }

  // ───────────── render raiz ─────────────
  function render() {
    const el = document.getElementById('admin-content');
    if (!el || document.getElementById('view-admin').classList.contains('hidden')) return;
    if (activeTab === 'places') renderPlaces(el);
    else if (activeTab === 'missions') renderMissions(el);
    else renderReview(el);
  }

  function init() {
    document.querySelectorAll('.admin-tabs button').forEach((b) =>
      b.addEventListener('click', () => {
        activeTab = b.dataset.atab;
        document.querySelectorAll('.admin-tabs button').forEach((x) =>
          x.classList.toggle('active', x === b));
        render();
      }));
  }

  globalThis.AdminView = { init, render };
})();

/* Fake backend — espelha a RPC perform_checkin e os contratos do doc 02.
 * Mesmas validações do servidor real (geofence, accuracy, idempotência,
 * viagem impossível, mock location), persistido em localStorage.
 * Em Node (testes) cai para memória. */
(function () {
  'use strict';

  const KEY = 'travelquest_demo_v1';
  const hasLS = (() => { try { return typeof localStorage !== 'undefined' && !!localStorage; } catch (e) { return false; } })();

  // ───────────── event bus ─────────────
  const listeners = {};
  globalThis.Bus = {
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit(ev, data) { (listeners[ev] || []).forEach((f) => f(data)); },
  };

  let db = null;
  let mem = null;

  function load() {
    if (hasLS) {
      try {
        const raw = localStorage.getItem(KEY);
        db = raw ? JSON.parse(raw) : SEED();
      } catch (e) { db = SEED(); }
    } else {
      db = mem || SEED();
    }
    if (!db.people) db.people = SEED().people; // migração: bases salvas antes do social
    if (!db.posts) db.posts = SEED().posts;    // migração: bases antes do feed
    if (!db.event_likes) db.event_likes = {};
    persist();
  }
  function persist() {
    if (hasLS) localStorage.setItem(KEY, JSON.stringify(db)); else mem = db;
  }
  function save() { persist(); Bus.emit('db:changed'); }

  // ───────────── relógio virtual ─────────────
  function now() { return Date.now() + (db.clock_skew_ms || 0); }
  function nowIso() { return new Date(now()).toISOString(); }

  // ───────────── geo ─────────────
  function haversine(aLat, aLng, bLat, bLng) {
    const R = 6371000, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function fmtDist(m) {
    if (m == null) return '—';
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
  }

  // ───────────── helpers de domínio ─────────────
  const placeById = (id) => db.places.find((p) => p.id === id);
  const achById = (id) => db.achievements.find((a) => a.id === id);
  const linksOf = (achId) =>
    db.achievement_places.filter((l) => l.achievement_id === achId)
      .sort((x, y) => x.sort_order - y.sort_order);
  const membershipsOf = (placeId) =>
    db.achievement_places.filter((l) => l.place_id === placeId)
      .map((l) => achById(l.achievement_id))
      .filter((a) => a && a.status !== 'archived');

  // janela da missão: 'upcoming' | 'open' | 'expired'
  function windowState(a) {
    const t = now();
    if (a.starts_at && t < Date.parse(a.starts_at)) return 'upcoming';
    if (a.ends_at && t > Date.parse(a.ends_at)) return 'expired';
    return 'open';
  }
  const isCounting = (a) => a.status === 'active' && windowState(a) === 'open';

  const checkedIn = (placeId) =>
    db.checkins.some((c) => c.place_id === placeId && c.status !== 'revoked');
  const checkinOf = (placeId) =>
    db.checkins.find((c) => c.place_id === placeId && c.status !== 'revoked');

  function missionProgress(a) {
    const members = linksOf(a.id).map((l) => placeById(l.place_id)).filter(Boolean);
    const total = members.length;
    const needed = a.min_required != null ? a.min_required : total;
    const completed = members.filter((p) => checkedIn(p.id)).length;
    const ua = db.user_achievements.find((u) => u.achievement_id === a.id);
    return { members, total, needed, completed, unlocked: !!ua, unlockedAt: ua ? ua.completed_at : null };
  }

  function totalPoints() { return db.ledger.reduce((s, l) => s + l.points, 0); }

  // estado do Local para o usuário (doc 05)
  // 'completed' | 'locked' | 'available' | null (oculto)
  function placeUserStatus(p) {
    if (checkedIn(p.id)) return 'completed';
    if (p.visibility === 'mission_only') {
      const ms = membershipsOf(p.id).filter((a) => a.status === 'active');
      if (ms.length === 0) return null; // sem missão ativa → oculto
      if (ms.some(isCounting)) return 'available';
      if (ms.some((a) => windowState(a) === 'upcoming')) return 'locked';
      return null; // só missões expiradas → oculto
    }
    return 'available';
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function err(code, message, details) {
    const e = { code, message, details: details || {} };
    return e;
  }

  // ═════════════════ API — App ═════════════════

  function getHomeFeed(pos) {
    const missions = db.achievements
      .filter((a) => a.status === 'active' && windowState(a) !== 'expired')
      .map((a) => {
        const w = windowState(a);
        const pr = missionProgress(a);
        const pending = pr.members.filter((p) => !checkedIn(p.id));
        let nearest = null;
        if (pos && pending.length) {
          nearest = pending
            .map((p) => ({ id: p.id, name: p.name, distance_m: haversine(pos.lat, pos.lng, p.lat, p.lng) }))
            .sort((x, y) => x.distance_m - y.distance_m)[0];
        }
        const user_status = pr.unlocked ? 'completed'
          : w === 'upcoming' ? 'upcoming'
          : pr.completed > 0 ? 'in_progress' : 'not_started';
        return {
          id: a.id, name: a.name, badge: a.badge, bonus_points: a.bonus_points,
          cover_image_url: a.cover_image_url, description: a.description,
          starts_at: a.starts_at, ends_at: a.ends_at, window: w,
          progress: { completed: pr.completed, total: pr.needed },
          user_status, nearest_pending_place: nearest,
        };
      })
      .sort((x, y) => {
        const ord = { in_progress: 0, not_started: 1, upcoming: 2, completed: 3 };
        return ord[x.user_status] - ord[y.user_status];
      });

    const standalone = db.places
      .filter((p) => p.status === 'active' && p.visibility === 'always')
      .filter((p) => !membershipsOf(p.id).some(isCounting))
      .map((p) => ({
        id: p.id, name: p.name, emoji: p.emoji, category: p.category,
        photo_url: p.photo_url,
        base_points: p.base_points, lat: p.lat, lng: p.lng,
        distance_m: pos ? haversine(pos.lat, pos.lng, p.lat, p.lng) : null,
        user_status: checkedIn(p.id) ? 'completed' : 'available',
      }))
      .sort((x, y) => {
        if (x.user_status !== y.user_status) return x.user_status === 'available' ? -1 : 1;
        return (x.distance_m || 0) - (y.distance_m || 0);
      });

    return {
      missions,
      standalone_places: standalone,
      user: { total_points: totalPoints(), achievements_unlocked: db.user_achievements.length },
    };
  }

  function getMapPins() {
    return db.places
      .filter((p) => p.status === 'active')
      .map((p) => {
        const st = placeUserStatus(p);
        if (!st) return null;
        const activeMs = membershipsOf(p.id).filter((a) => a.status === 'active' && windowState(a) !== 'expired');
        return {
          id: p.id, lat: p.lat, lng: p.lng, emoji: p.emoji,
          name: p.name, category: p.category, photo_url: p.photo_url,
          kind: activeMs.length ? 'mission' : 'standalone',
          mission_ids: activeMs.map((a) => a.id),
          base_points: p.base_points, radius_m: p.radius_m, user_status: st,
        };
      })
      .filter(Boolean);
  }

  function getPlaceDetail(id, pos) {
    const p = placeById(id);
    if (!p) return null;
    const st = placeUserStatus(p) || 'available';
    const ms = membershipsOf(p.id)
      .filter((a) => a.status === 'active' && windowState(a) !== 'expired')
      .map((a) => {
        const pr = missionProgress(a);
        return { id: a.id, name: a.name, badge: a.badge, window: windowState(a),
                 starts_at: a.starts_at, progress: { completed: pr.completed, total: pr.needed } };
      });
    const ck = checkinOf(id);
    return {
      ...p,
      user_status: st,
      distance_m: pos ? haversine(pos.lat, pos.lng, p.lat, p.lng) : null,
      missions: ms,
      checkin: ck ? { created_at: ck.created_at, points_awarded: ck.points_awarded, status: ck.status } : null,
    };
  }

  function getAchievementDetail(id, pos) {
    const a = achById(id);
    if (!a) return null;
    const pr = missionProgress(a);
    return {
      id: a.id, name: a.name, badge: a.badge, description: a.description,
      cover_image_url: a.cover_image_url,
      bonus_points: a.bonus_points, window: windowState(a),
      starts_at: a.starts_at, ends_at: a.ends_at,
      progress: { completed: pr.completed, total: pr.needed },
      unlocked: pr.unlocked, unlockedAt: pr.unlockedAt,
      places: pr.members.map((p) => ({
        id: p.id, name: p.name, emoji: p.emoji, base_points: p.base_points,
        photo_url: p.photo_url, category: p.category,
        user_status: checkedIn(p.id) ? 'completed' : (placeUserStatus(p) || 'available'),
        distance_m: pos ? haversine(pos.lat, pos.lng, p.lat, p.lng) : null,
      })),
    };
  }

  /* Espelho da RPC perform_checkin (doc 01) — mesma ordem de validações. */
  async function performCheckin(placeId, pos) {
    await sleep(350 + Math.random() * 400); // latência simulada p/ estado "Validando…"

    const p = placeById(placeId);

    // 1. Local existe e está ativo
    if (!p || p.status !== 'active') throw err('PLACE_NOT_AVAILABLE', 'Este local não está disponível.');

    // 1b. mission_only exige missão ativa dentro da janela
    if (p.visibility === 'mission_only') {
      const ms = membershipsOf(p.id).filter((a) => a.status === 'active');
      if (!ms.some(isCounting)) {
        const up = ms.find((a) => windowState(a) === 'upcoming');
        throw err('MISSION_LOCKED', up
          ? `Disponível a partir de ${new Date(up.starts_at).toLocaleDateString('pt-BR')}.`
          : 'Este local não está disponível.', up ? { starts_at: up.starts_at } : {});
      }
    }

    // 2. Precisão de GPS inaceitável
    if (pos.accuracy_m != null && pos.accuracy_m > 100) {
      throw err('LOW_GPS_ACCURACY', 'Sinal de GPS fraco demais para validar (precisão > 100 m). Vá para área aberta.');
    }

    // 3. Geofence — autoridade do servidor (tolerância = raio + min(accuracy, 50))
    const distance = haversine(p.lat, p.lng, pos.lat, pos.lng);
    const tolerance = p.radius_m + Math.min(pos.accuracy_m || 0, 50);
    if (distance > tolerance) {
      throw err('OUT_OF_RANGE',
        `Você está a ${fmtDist(distance)} do local (raio de ${p.radius_m} m).`,
        { distance_m: Math.round(distance), radius_m: p.radius_m });
    }

    // 4. Sinais "soft" → flag, não rejeição (decisão D8)
    let status = 'confirmed';
    let speed_kmh = null;
    const lastCk = db.checkins.filter((c) => c.status !== 'revoked').slice(-1)[0];
    if (lastCk) {
      const lastPlace = placeById(lastCk.place_id);
      if (lastPlace) {
        const dKm = haversine(lastPlace.lat, lastPlace.lng, pos.lat, pos.lng) / 1000;
        // piso de ~7s evita falso positivo em leituras quase simultâneas
        const hours = Math.max((now() - Date.parse(lastCk.created_at)) / 36e5, 0.002);
        speed_kmh = dKm / hours;
        if (speed_kmh > 900) status = 'flagged';
      }
    }
    if (pos.is_mock_location) status = 'flagged';

    // 5. Idempotência (índice único parcial user+place no banco real)
    if (checkedIn(placeId)) throw err('ALREADY_CHECKED_IN', 'Você já fez check-in neste local.');

    const checkin = {
      id: 'c_' + (db.seq++),
      place_id: placeId,
      reported_lat: pos.lat, reported_lng: pos.lng,
      accuracy_m: pos.accuracy_m != null ? pos.accuracy_m : null,
      distance_m: Math.round(distance),
      points_awarded: p.base_points,
      status,
      is_mock_location: !!pos.is_mock_location,
      speed_kmh: speed_kmh != null ? Math.round(speed_kmh) : null,
      created_at: nowIso(),
    };
    db.checkins.push(checkin);

    // 6. Ledger (mesmo flagged: otimista + revogável)
    db.ledger.push({
      id: db.seq++, source_type: 'checkin', source_id: checkin.id,
      points: p.base_points, description: 'Check-in: ' + p.name, created_at: nowIso(),
    });

    // 7. Progresso das conquistas que contêm o Local + desbloqueio
    const progress = [];
    for (const a of membershipsOf(placeId).filter(isCounting)) {
      const pr = missionProgress(a);
      let newly = false;
      if (pr.completed >= pr.needed && !pr.unlocked) {
        db.user_achievements.push({
          id: 'ua_' + (db.seq++), achievement_id: a.id,
          bonus_points_awarded: a.bonus_points, completed_at: nowIso(),
        });
        if (a.bonus_points > 0) {
          db.ledger.push({
            id: db.seq++, source_type: 'achievement', source_id: a.id,
            points: a.bonus_points, description: 'Conquista: ' + a.name, created_at: nowIso(),
          });
        }
        newly = true;
      }
      progress.push({
        achievement_id: a.id, name: a.name, badge: a.badge,
        completed: pr.completed, total: pr.needed,
        newly_unlocked: newly, bonus_points: newly ? a.bonus_points : 0,
      });
    }

    save();
    return {
      checkin: { id: checkin.id, place_id: placeId, points_awarded: p.base_points,
                 status, created_at: checkin.created_at },
      validation: { distance_m: Math.round(distance), radius_m: p.radius_m },
      achievements_progress: progress,
      user: { total_points: totalPoints() },
    };
  }

  function getLedger() { return [...db.ledger].reverse(); }
  function getStats() {
    return {
      checkins: db.checkins.filter((c) => c.status !== 'revoked').length,
      points: totalPoints(),
      achievements: db.user_achievements.length,
    };
  }
  function getProfile() {
    return {
      total_points: totalPoints(),
      badges: db.user_achievements.map((u) => {
        const a = achById(u.achievement_id);
        return { achievement_id: u.achievement_id, name: a ? a.name : '?', badge: a ? a.badge : '🏆',
                 bonus: u.bonus_points_awarded, completed_at: u.completed_at };
      }),
      flagged: db.checkins.filter((c) => c.status === 'flagged').map((c) => ({
        id: c.id, place: (placeById(c.place_id) || {}).name, created_at: c.created_at,
      })),
    };
  }

  // ═════════════════ API — Admin ═════════════════

  function adminListPlaces() {
    return db.places.map((p) => ({
      ...p,
      missions: membershipsOf(p.id).map((a) => ({ id: a.id, name: a.name, status: a.status })),
      checkins_count: db.checkins.filter((c) => c.place_id === p.id && c.status !== 'revoked').length,
    }));
  }

  function adminOverlaps(lat, lng, radius_m, excludeId) {
    return db.places
      .filter((p) => p.id !== excludeId && p.status !== 'archived')
      .map((p) => ({ place: p, distance: haversine(lat, lng, p.lat, p.lng) }))
      .filter((x) => x.distance < radius_m + x.place.radius_m)
      .sort((a, b) => a.distance - b.distance);
  }

  function adminSavePlace(data) {
    if (data.id) {
      const p = placeById(data.id);
      if (!p) throw err('NOT_FOUND', 'Local não encontrado.');
      Object.assign(p, data, { updated_at: nowIso() });
      save();
      return p;
    }
    const p = {
      id: 'p_' + (db.seq++),
      emoji: '📍', category: 'historico', description: '', address: '', city: '',
      radius_m: 100, base_points: 10, visibility: 'always',
      ...data,
      status: 'draft', created_at: nowIso(),
    };
    db.places.push(p);
    save();
    return p;
  }

  function adminPublishPlace(id) {
    const p = placeById(id);
    if (!p) throw err('NOT_FOUND', 'Local não encontrado.');
    const problems = [];
    if (!p.name) problems.push('Nome é obrigatório');
    if (p.lat == null || p.lng == null) problems.push('Defina a coordenada no mapa');
    if (!p.category) problems.push('Escolha uma categoria');
    if (!(p.radius_m >= 30 && p.radius_m <= 1000)) problems.push('Raio deve estar entre 30 e 1000 m');
    if (problems.length) throw err('PUBLISH_CHECKLIST', 'Pendências para publicar.', { problems });
    p.status = 'active';
    save();
    return p;
  }

  function adminArchivePlace(id) {
    const p = placeById(id);
    if (!p) throw err('NOT_FOUND', 'Local não encontrado.');
    const activeMs = membershipsOf(id).filter((a) => a.status === 'active' && windowState(a) !== 'expired');
    if (activeMs.length) {
      throw err('PLACE_IN_ACTIVE_MISSION',
        'Este local faz parte de missão ativa. Remova o vínculo (ou arquive a missão) antes.',
        { missions: activeMs.map((a) => a.name) });
    }
    p.status = 'archived';
    save();
    return p;
  }

  function adminListAchievements() {
    return db.achievements.map((a) => {
      const pr = missionProgress(a);
      return { ...a, window: windowState(a), places: pr.members,
               progress: { completed: pr.completed, total: pr.needed }, unlocked: pr.unlocked };
    });
  }

  function adminSaveAchievement(data, placeIds) {
    let a;
    if (data.id) {
      a = achById(data.id);
      if (!a) throw err('NOT_FOUND', 'Conquista não encontrada.');
      // D9: missão ativa não pode ter o conjunto de locais alterado por edição simples
      if (a.status === 'active' && placeIds) {
        const current = linksOf(a.id).map((l) => l.place_id);
        const changed = current.length !== placeIds.length ||
          current.some((id, i) => id !== placeIds[i]);
        if (changed) {
          throw err('MISSION_ACTIVE_LINKS_LOCKED',
            'Missão ativa: os locais não podem ser alterados. Arquive e crie uma nova versão (ex.: "Vol. 2").');
        }
      }
      Object.assign(a, data, { updated_at: nowIso() });
    } else {
      a = {
        badge: '🏆', description: '', bonus_points: 0, min_required: null,
        is_sequential: false, starts_at: null, ends_at: null, city: '',
        ...data,
        id: 'm_' + (db.seq++), status: 'draft', created_at: nowIso(),
      };
      db.achievements.push(a);
    }
    if (placeIds && a.status !== 'active') {
      db.achievement_places = db.achievement_places.filter((l) => l.achievement_id !== a.id);
      placeIds.forEach((pid, i) =>
        db.achievement_places.push({ achievement_id: a.id, place_id: pid, sort_order: i }));
    }
    save();
    return a;
  }

  function adminPublishAchievement(id) {
    const a = achById(id);
    if (!a) throw err('NOT_FOUND', 'Conquista não encontrada.');
    const links = linksOf(id);
    const problems = [];
    if (!a.name) problems.push('Nome é obrigatório');
    if (!a.badge) problems.push('Escolha um badge');
    if (links.length < 2) problems.push('Vincule pelo menos 2 locais');
    const drafts = links.map((l) => placeById(l.place_id)).filter((p) => p && p.status !== 'active');
    if (drafts.length) problems.push('Locais ainda não publicados: ' + drafts.map((p) => p.name).join(', '));
    if (problems.length) throw err('PUBLISH_CHECKLIST', 'Pendências para publicar.', { problems });
    a.status = 'active';
    save();
    return a;
  }

  function adminArchiveAchievement(id) {
    const a = achById(id);
    if (!a) throw err('NOT_FOUND', 'Conquista não encontrada.');
    a.status = 'archived'; // conclusões e pontos já concedidos são preservados (D9)
    save();
    return a;
  }

  function adminPublishDraftPlacesOf(achId) {
    const drafts = linksOf(achId).map((l) => placeById(l.place_id))
      .filter((p) => p && p.status === 'draft');
    drafts.forEach((p) => adminPublishPlace(p.id));
    return drafts.length;
  }

  function adminListFlagged() {
    return db.checkins.filter((c) => c.status === 'flagged').map((c) => ({
      ...c, place: placeById(c.place_id),
    })).reverse();
  }

  function adminApproveCheckin(id) {
    const c = db.checkins.find((x) => x.id === id);
    if (!c) throw err('NOT_FOUND', 'Check-in não encontrado.');
    c.status = 'confirmed';
    save();
    return c;
  }

  /* Revogação: estorno via ledger + reavaliação das conquistas dependentes.
   * Grandfathering NÃO se aplica a fraude (doc 04). */
  function adminRevokeCheckin(id) {
    const c = db.checkins.find((x) => x.id === id);
    if (!c) throw err('NOT_FOUND', 'Check-in não encontrado.');
    const p = placeById(c.place_id);
    c.status = 'revoked';
    db.ledger.push({
      id: db.seq++, source_type: 'adjustment', source_id: c.id,
      points: -c.points_awarded, description: 'Estorno (fraude): ' + (p ? p.name : c.place_id),
      created_at: nowIso(),
    });

    const revokedAchievements = [];
    for (const a of membershipsOf(c.place_id)) {
      const idx = db.user_achievements.findIndex((u) => u.achievement_id === a.id);
      if (idx === -1) continue;
      const pr = missionProgress(a); // já sem o check-in revogado
      if (pr.completed < pr.needed) {
        const ua = db.user_achievements[idx];
        db.user_achievements.splice(idx, 1);
        if (ua.bonus_points_awarded > 0) {
          db.ledger.push({
            id: db.seq++, source_type: 'adjustment', source_id: a.id,
            points: -ua.bonus_points_awarded, description: 'Estorno de conquista: ' + a.name,
            created_at: nowIso(),
          });
        }
        revokedAchievements.push(a.name);
      }
    }
    save();
    return { reversed_points: c.points_awarded, revoked_achievements: revokedAchievements };
  }

  /* Translada todos os locais para que a âncora (1º local da demo) caia em
   * (lat, lng) — permite testar geofencing andando de verdade, em qualquer cidade. */
  function relocateDemo(lat, lng) {
    const anchor = placeById('p1') || db.places[0];
    if (!anchor) return;
    const dLat = lat - anchor.lat, dLng = lng - anchor.lng;
    db.places.forEach((p) => { p.lat += dLat; p.lng += dLng; });
    save();
    return anchor.name;
  }

  // ═════════════════ API — Social ═════════════════

  /* Ranking entre amigos: amigos aceitos + você (pontos reais do ledger).
   * Aceitar um pedido coloca a pessoa no ranking na hora. */
  function getSocial() {
    const ppl = db.people || [];
    const me = { id: 'me', name: 'Você', hue: 38, points: totalPoints(), you: true };
    const ranking = [
      ...ppl.filter((p) => p.status === 'friend')
        .map((p) => ({ id: p.id, name: p.name, hue: p.hue, points: p.points })),
      me,
    ].sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }));
    return {
      requests: ppl.filter((p) => p.status === 'request_in'),
      friends: ppl.filter((p) => p.status === 'friend')
        .sort((a, b) => b.points - a.points),
      suggestions: ppl.filter((p) => p.status === 'suggested' || p.status === 'requested_out'),
      ranking,
      my_rank: ranking.find((r) => r.you).rank,
    };
  }

  function personById(id) { return (db.people || []).find((p) => p.id === id); }

  function acceptRequest(id) {
    const p = personById(id);
    if (!p || p.status !== 'request_in') throw err('NOT_FOUND', 'Pedido não encontrado.');
    p.status = 'friend';
    save();
    return p;
  }

  function declineRequest(id) {
    const p = personById(id);
    if (!p || p.status !== 'request_in') throw err('NOT_FOUND', 'Pedido não encontrado.');
    p.status = 'none';
    save();
    return p;
  }

  function sendRequest(id) {
    const p = personById(id);
    if (!p || p.status !== 'suggested') throw err('NOT_FOUND', 'Sugestão não encontrada.');
    p.status = 'requested_out';
    save();
    return p;
  }

  // ═════════════════ API — Feed Social ═════════════════

  /* Feed = posts dos amigos + SEUS check-ins e conquistas, ao vivo. */
  function getFeed() {
    const out = [];
    (db.posts || []).forEach((p) => {
      const per = personById(p.person_id) || { name: '?', hue: 200, points: 0 };
      out.push({
        id: 'post:' + p.id, you: false, name: per.name, hue: per.hue, points: per.points,
        text: p.text,
        attachment: p.emoji ? { emoji: p.emoji, category: p.category, label: p.label } : null,
        likes: p.likes + (p.liked ? 1 : 0), liked: !!p.liked,
        comments: p.comments || 0, ts: p.ts,
      });
    });
    db.checkins.filter((c) => c.status !== 'revoked').forEach((c) => {
      const pl = placeById(c.place_id);
      if (!pl) return;
      const ev = db.event_likes['ck:' + c.id] || {};
      out.push({
        id: 'ck:' + c.id, you: true, name: 'Você', hue: 28, points: totalPoints(),
        text: `Check-in em ${pl.name}! +${c.points_awarded} PinPoints 📍`,
        attachment: { emoji: pl.emoji, category: pl.category, label: pl.name },
        likes: ev.liked ? 1 : 0, liked: !!ev.liked, comments: 0, ts: Date.parse(c.created_at),
      });
    });
    db.user_achievements.forEach((u) => {
      const a = achById(u.achievement_id);
      if (!a) return;
      const ev = db.event_likes['ua:' + u.id] || {};
      out.push({
        id: 'ua:' + u.id, you: true, name: 'Você', hue: 28, points: totalPoints(),
        text: `Conquista desbloqueada: ${a.badge} ${a.name}! +${u.bonus_points_awarded} Pts Extra 🏆`,
        attachment: { emoji: a.badge, category: 'conquista', label: a.name },
        likes: ev.liked ? 1 : 0, liked: !!ev.liked, comments: 0, ts: Date.parse(u.completed_at),
      });
    });
    return out.sort((x, y) => y.ts - x.ts);
  }

  function toggleLike(id) {
    if (id.indexOf('post:') === 0) {
      const p = (db.posts || []).find((x) => 'post:' + x.id === id);
      if (p) p.liked = !p.liked;
    } else {
      const ev = db.event_likes[id] || (db.event_likes[id] = { liked: false });
      ev.liked = !ev.liked;
    }
    save();
  }

  // ───────────── exports ─────────────
  globalThis.Backend = {
    init: load,
    reset() { db = SEED(); save(); },
    now, nowIso,
    addSkew(ms) { db.clock_skew_ms = (db.clock_skew_ms || 0) + ms; save(); },
    relocateDemo,
    haversine, fmtDist,
    // app
    getHomeFeed, getMapPins, getPlaceDetail, getAchievementDetail,
    performCheckin, getLedger, getProfile, getStats,
    // social
    getSocial, acceptRequest, declineRequest, sendRequest,
    getFeed, toggleLike,
    // admin
    adminListPlaces, adminOverlaps, adminSavePlace, adminPublishPlace, adminArchivePlace,
    adminListAchievements, adminSaveAchievement, adminPublishAchievement,
    adminArchiveAchievement, adminPublishDraftPlacesOf,
    adminListFlagged, adminApproveCheckin, adminRevokeCheckin,
    // testes
    _db: () => db,
  };
})();

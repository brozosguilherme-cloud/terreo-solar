/* Teste das regras de negócio do fake backend (espelho da RPC perform_checkin).
 * Roda sem dependências:  node prototype/test/backend.test.js */
'use strict';
const fs = require('fs');
const path = require('path');

// carrega os scripts do browser em escopo global (sem localStorage → modo memória)
for (const f of ['mock-data.js', 'backend.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  (0, eval)(src); // eval indireto = escopo global
}

const B = globalThis.Backend;
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✅', msg); }
  else { failed++; console.log('  ❌', msg); }
}
async function rejects(fn, code, msg) {
  try { await fn(); failed++; console.log('  ❌', msg, '(não rejeitou)'); }
  catch (e) { ok(e.code === code, `${msg} → ${e.code}`); }
}
const at = (placeId, over) => {
  const p = B._db().places.find((x) => x.id === placeId);
  return { lat: p.lat + 0.0001, lng: p.lng + 0.0001, accuracy_m: 15, is_mock_location: false, ...over };
};

(async function main() {
  B.init();
  B.reset();

  console.log('\n— Geofence e validações hard —');
  await rejects(() => B.performCheckin('p1', { lat: -23.60, lng: -46.70, accuracy_m: 15 }),
    'OUT_OF_RANGE', 'check-in longe do local é rejeitado');
  await rejects(() => B.performCheckin('p1', at('p1', { accuracy_m: 150 })),
    'LOW_GPS_ACCURACY', 'accuracy > 100 m é rejeitada');
  await rejects(() => B.performCheckin('p13', at('p13')),
    'MISSION_LOCKED', 'local mission_only de missão futura é bloqueado');
  await rejects(() => B.performCheckin('p999', at('p1')),
    'PLACE_NOT_AVAILABLE', 'local inexistente é rejeitado');

  console.log('\n— Check-in feliz + idempotência —');
  const r1 = await B.performCheckin('p1', at('p1'));
  ok(r1.checkin.status === 'confirmed', 'check-in dentro do raio é confirmado');
  ok(r1.checkin.points_awarded === 30, 'pontos do local concedidos (30)');
  ok(r1.user.total_points === 30, 'total de pontos via ledger = 30');
  const m1p = r1.achievements_progress.find((a) => a.achievement_id === 'm1');
  ok(m1p && m1p.completed === 1 && m1p.total === 5, 'progresso da missão = 1/5');
  await rejects(() => B.performCheckin('p1', at('p1')),
    'ALREADY_CHECKED_IN', 'segundo check-in no mesmo local é bloqueado');

  console.log('\n— Tolerância de GPS (raio + min(accuracy, 50)) —');
  // p2 raio 120: ponto a ~150 m do centro passa com accuracy 40 (tolerância 160)
  const p2 = B._db().places.find((x) => x.id === 'p2');
  const off = { lat: p2.lat + 0.00135, lng: p2.lng, accuracy_m: 40 }; // ~150 m ao norte
  const r2 = await B.performCheckin('p2', off);
  ok(r2.checkin.status === 'confirmed' && r2.validation.distance_m > 120,
    `fora do raio estrito (${r2.validation.distance_m} m > 120 m) mas dentro da tolerância → aceito`);

  console.log('\n— Viagem impossível e mock location (soft → flagged) —');
  const r3 = await B.performCheckin('p12', at('p12')); // Sé → Ibirapuera ~5 km em segundos
  ok(r3.checkin.status === 'flagged', 'salto de ~5 km sem tempo → flagged (pontos concedidos)');
  ok(r3.user.total_points === 30 + 30 + 20, 'pontos do flagged entram no ledger (otimista)');
  B.addSkew(3600 * 1000); // +1 h no relógio virtual
  const r4 = await B.performCheckin('p10', at('p10', { is_mock_location: true }));
  ok(r4.checkin.status === 'flagged', 'mock location → flagged mesmo com velocidade ok');
  const r5 = await B.performCheckin('p9', at('p9', undefined));
  // p10 (Beco) → p9 (Mercadão) ~6 km logo em seguida → flagged de velocidade
  ok(r5.checkin.status === 'flagged', 'novo salto rápido → flagged');

  console.log('\n— Conclusão de conquista (transacional + bônus) —');
  B.addSkew(3600 * 1000);
  await B.performCheckin('p3', at('p3'));
  await B.performCheckin('p4', at('p4'));
  const rLast = await B.performCheckin('p5', at('p5'));
  const unlocked = rLast.achievements_progress.find((a) => a.achievement_id === 'm1');
  ok(unlocked && unlocked.newly_unlocked === true, 'última etapa desbloqueia a conquista');
  ok(unlocked.bonus_points === 200, 'bônus de 200 pts informado na resposta');
  ok(B._db().user_achievements.some((u) => u.achievement_id === 'm1'), 'user_achievements materializada');
  // conferência independente: total = soma do ledger
  const ledgerSum = B._db().ledger.reduce((s, l) => s + l.points, 0);
  ok(B.getProfile().total_points === ledgerSum, `total_points (${ledgerSum}) bate com a soma do ledger`);

  console.log('\n— Revogação de fraude (estorno + conquista) —');
  const before = B.getProfile().total_points;
  const flagged = B.adminListFlagged().find((c) => c.place_id === 'p12');
  const res = B.adminRevokeCheckin(flagged.id);
  ok(res.reversed_points === 20, 'estorno dos pontos do check-in (20)');
  ok(B.getProfile().total_points === before - 20, 'total atualizado via linha negativa no ledger');
  ok(B._db().checkins.find((c) => c.id === flagged.id).status === 'revoked', 'check-in marcado como revoked');
  // revogar parte de conquista completa → conquista cai junto (fraude não tem grandfathering)
  const ckP5 = B._db().checkins.find((c) => c.place_id === 'p5' && c.status !== 'revoked');
  const res2 = B.adminRevokeCheckin(ckP5.id);
  ok(res2.revoked_achievements.includes('Missão Centro Histórico'), 'conquista dependente é revogada');
  ok(!B._db().user_achievements.some((u) => u.achievement_id === 'm1'), 'user_achievement removida');
  // refazer o check-in após revogação é permitido (índice único parcial exclui revoked)
  const redo = await B.performCheckin('p5', at('p5'));
  ok(redo.checkin.status === 'confirmed', 'check-in pode ser refeito após revogação');
  const reun = redo.achievements_progress.find((a) => a.achievement_id === 'm1');
  ok(reun && reun.newly_unlocked === true, 'conquista re-desbloqueia ao refazer a etapa');

  console.log('\n— Admin: ciclo de vida —');
  const novo = B.adminSavePlace({ name: 'Ponte Estaiada', emoji: '🌉', category: 'natureza',
    lat: -23.6118, lng: -46.6939, radius_m: 150, base_points: 40, city: 'São Paulo' });
  ok(novo.status === 'draft', 'local novo nasce em draft');
  ok(!B.getMapPins().some((p) => p.id === novo.id), 'draft não aparece no mapa do app');
  B.adminPublishPlace(novo.id);
  ok(B.getMapPins().some((p) => p.id === novo.id), 'publicado aparece no mapa do app');
  ok(B.getHomeFeed({ lat: -23.55, lng: -46.63 }).standalone_places.some((p) => p.id === novo.id),
    'sem missão → aparece como avulso na Home');

  try { B.adminArchivePlace('p2'); failed++; console.log('  ❌ arquivar local de missão ativa deveria falhar'); }
  catch (e) { ok(e.code === 'PLACE_IN_ACTIVE_MISSION', 'arquivar local de missão ativa é bloqueado'); }

  const miss = B.adminSaveAchievement({ name: 'Teste', badge: '🧪', bonus_points: 10 }, [novo.id]);
  try { B.adminPublishAchievement(miss.id); failed++; console.log('  ❌ publicar com 1 local deveria falhar'); }
  catch (e) { ok(e.code === 'PUBLISH_CHECKLIST', 'checklist bloqueia missão com < 2 locais'); }
  B.adminSaveAchievement({ id: miss.id }, [novo.id, 'p11']);
  B.adminPublishAchievement(miss.id);
  ok(B._db().achievements.find((a) => a.id === miss.id).status === 'active', 'missão publica com 2 locais ativos');
  try { B.adminSaveAchievement({ id: miss.id }, [novo.id]); failed++; console.log('  ❌ alterar locais de missão ativa deveria falhar'); }
  catch (e) { ok(e.code === 'MISSION_ACTIVE_LINKS_LOCKED', 'locais de missão ativa são travados (D9)'); }

  console.log('\n— Janela de vigência (missão futura abre com o relógio) —');
  ok(B.getPlaceDetail('p13', { lat: -23.5447, lng: -46.6388 }).user_status === 'locked',
    'local do festival começa bloqueado');
  B.addSkew(21 * 864e5); // +21 dias
  ok(B.getPlaceDetail('p13', { lat: -23.5447, lng: -46.6388 }).user_status === 'available',
    'após abrir a janela, local desbloqueia');
  const rFest = await B.performCheckin('p13', at('p13'));
  ok(rFest.achievements_progress.some((a) => a.achievement_id === 'm3'),
    'check-in passa a contar para a missão sazonal');

  console.log('\n— Realocação da demo (teste com GPS real em qualquer cidade) —');
  const pA = { ...B._db().places.find((x) => x.id === 'p1') };
  const pB = { ...B._db().places.find((x) => x.id === 'p2') };
  const target = { lat: -30.0277, lng: -51.2287 }; // Porto Alegre
  B.relocateDemo(target.lat, target.lng);
  const pA2 = B._db().places.find((x) => x.id === 'p1');
  const pB2 = B._db().places.find((x) => x.id === 'p2');
  ok(Math.abs(pA2.lat - target.lat) < 1e-9 && Math.abs(pA2.lng - target.lng) < 1e-9,
    'âncora (p1) cai exatamente na posição alvo');
  ok(Math.abs((pB2.lat - pA2.lat) - (pB.lat - pA.lat)) < 1e-9 &&
     Math.abs((pB2.lng - pA2.lng) - (pB.lng - pA.lng)) < 1e-9,
    'geometria relativa entre locais é preservada');
  B.addSkew(3600 * 1000); // evita flag de velocidade após o "salto" da realocação
  const p6r = B._db().places.find((x) => x.id === 'p6');
  const rReloc = await B.performCheckin('p6', { lat: p6r.lat + 0.0001, lng: p6r.lng + 0.0001, accuracy_m: 15 });
  ok(rReloc.checkin.status === 'confirmed', 'check-in funciona nas novas coordenadas');

  console.log(`\n${'─'.repeat(40)}\n${passed} passaram · ${failed} falharam\n`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Erro fatal no teste:', e); process.exit(1); });

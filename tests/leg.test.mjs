/* Modell-Invarianten des Beinmoduls: Kalibrierungsanker aus der Literatur (±25 %) und Regressionsschutz.
   node --test tests/leg.test.mjs        (ohne Browser; three.js aus node_modules) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from './harness.mjs';

const m = loadModel('leg');
const between = (v, lo, hi, what) => assert.ok(v >= lo && v <= hi, `${what}: ${(+v).toFixed(2)} nicht in [${lo}, ${hi}]`);
const byId = (list, id) => { const x = list.find(p => p.id === id); assert.ok(x, id + ' fehlt'); return x; };
const preset = id => m.evalPose(byId(m.PRESETS, id).pose);

test('Stand: Rumpf nahezu aufrecht, Gleichgewicht, patellofemoral unbelastet, tibiofemoral ≈ halbes Körpergewicht, Muskeln neutral', () => {
  const r = preset('stand');
  assert.ok(r.rh.balanced); between(Math.abs(r.rh.lean), 0, 12, 'Rumpfneigung im Stand');
  between(r.M.pfBW, 0, 0.3, 'PF Stand'); between(r.M.tfBW, 0.4, 1.2, 'TF Stand'); between(r.M.achBW, 0, 0.5, 'Achilles Stand');
  for (const id in r.strain) assert.ok(Math.abs(r.strain[id]) < 0.06 || m.STRUCT_BY_ID[id].kind !== 'muscle', `Muskel ${id} im Stand nicht neutral (${r.strain[id].toFixed(2)})`);
});

test('Kniebeuge parallel (beidbeinig): PF 2,5–4,5 × KG, TF 1,5–4 × KG, Rumpf vorgeneigt, VKB entlastet', () => {
  const r = preset('squatPar');
  assert.ok(r.rh.balanced, 'Gleichgewicht mit Rumpfneigung möglich'); between(r.rh.lean, 30, 60, 'Rumpfneigung');
  between(r.M.pfBW, 2.5, 4.5, 'PF parallel'); between(r.M.tfBW, 1.5, 4.0, 'TF parallel');
  assert.ok(r.M.acl < 50, 'VKB in der Kniebeuge kaum belastet'); assert.ok(r.M.pcl > 50, 'HKB trägt in der Beugung');
  assert.ok((r.act.vastL || 0) > 0.2 && (r.act.rectF || 0) > 0.2, 'Quadrizeps hält');
});

test('Kniebeuge tief (140°): PF 4–7,5 × KG (Reilly & Martens 7,6 als Obergrenze), Druck > 4 MPa, Hinterhörner komprimiert, HKB belastet', () => {
  const r = preset('squatDeep');
  between(r.M.pfBW, 4.0, 7.5, 'PF tief'); between(r.M.pfPress, 4, 10, 'PF-Druck tief'); between(r.M.tfBW, 2.5, 6, 'TF tief');
  assert.ok(r.M.menComp >= 0.6, 'Meniskus-Hinterhörner komprimiert'); assert.ok(r.M.pcl > 150, 'HKB in tiefer Beugung');
  assert.ok(r.M.pfBW > preset('squatPar').M.pfBW, 'tiefer > parallel');
});

test('Treppe (einbeinig, 65°): PF ≈ 3,3 × KG (2,5–4,5), Hüftkontaktkraft 2–6 × KG', () => {
  const r = preset('stair');
  between(r.M.pfBW, 2.5, 4.5, 'PF Treppe'); between(r.M.hipBW, 2, 6, 'Hüftkraft Treppe');
});

test('Beinstrecker: VKB-Last nahe Streckung maximal, bei 60° gering, jenseits 90° null; ohne Hüftmoment (Sitz stützt)', () => {
  const load = { F: [0, -147, 0], at: 'foot', fixHip: true };
  const a15 = m.evalPose({ hipF: 90, knee: 15, ground: 0 }, { load }), a60 = m.evalPose({ hipF: 90, knee: 60, ground: 0 }, { load }), a100 = m.evalPose({ hipF: 90, knee: 100, ground: 0 }, { load });
  assert.ok(a15.M.acl > 150 && a15.M.acl > 3 * a60.M.acl, `VKB 15°: ${a15.M.acl.toFixed(0)} N, 60°: ${a60.M.acl.toFixed(0)} N`);
  assert.equal(a100.M.acl, 0, 'VKB jenseits 90° ohne vorderen Schub'); assert.equal(a15.M.mHip, 0, 'Hüftmoment abgestützt');
  between(a15.M.pfBW, 1.5, 4, 'PF Beinstrecker 15°');
});

test('Cutting (Valgus + Innenrotation, fast gestreckt): VKB-Spannung höher als im Stand; Innenband gespannt', () => {
  const c = preset('cutting'), s = preset('stand');
  assert.ok(c.M.aclStrain > s.M.aclStrain + 0.02, `VKB-Spannung Cutting ${c.M.aclStrain.toFixed(3)} vs Stand ${s.M.aclStrain.toFixed(3)}`);
  assert.ok(c.M.mcl > s.M.mcl + 0.03, 'Innenband bei Valgus');
});

test('Tractus iliotibialis: Reibzone (Übergleiten am Epikondylus) zwischen 10° und 35° Beugung, frei in Streckung und bei 90°', () => {
  let best = 0, at = null;
  for (let k = 0; k <= 90; k += 5) { const r = m.evalPose({ knee: k, ground: 0 }); if (r.M.itbComp > best) { best = r.M.itbComp; at = k; } }
  assert.ok(best >= 0.6, 'Kontakt in der Reibzone'); between(at, 10, 35, 'Lage der Reibzone');
  assert.ok(m.evalPose({ knee: 0, ground: 0 }).M.itbOff > 8 && m.evalPose({ knee: 90, ground: 0 }).M.itbOff < -3, 'vorn in Streckung, hinten in Beugung');
});

test('Sprunggelenk: vorderes Impingement in Dorsalextension, hinteres in Plantarflexion; ATFL bei Plantarflexion + Inversion, CFL bei Dorsalextension + Inversion', () => {
  const d = m.evalPose({ knee: 60, ankle: 35, ground: 0 }), p = m.evalPose({ ankle: -45, ground: 0 }), n = m.evalPose({ ground: 0 });
  assert.ok(d.M.ankAnt < 3 && n.M.ankAnt > 8, `vorn: ${d.M.ankAnt.toFixed(1)} mm bei 35°, ${n.M.ankAnt.toFixed(1)} mm neutral`);
  assert.ok(p.M.ankPost < 3 && n.M.ankPost > 8, `hinten: ${p.M.ankPost.toFixed(1)} mm bei −45°, ${n.M.ankPost.toFixed(1)} mm neutral`);
  const sup = preset('supTrauma');
  assert.ok(sup.M.atfl >= 0.08 && sup.M.atfl > n.M.atfl + 0.1, `ATFL Supinationstrauma ${sup.M.atfl.toFixed(2)}`);
  const cflDI = m.evalPose({ ankle: 20, sub: 30, ground: 0 }).M.cfl, cflN = n.M.cfl, cflPE = m.evalPose({ ankle: -30, sub: -15, ground: 0 }).M.cfl;
  assert.ok(cflDI > cflN + 0.05 && cflDI > cflPE, `CFL Dorsal+Inversion ${cflDI.toFixed(2)} > neutral ${cflN.toFixed(2)}`);
  assert.ok(m.evalPose({ sub: -15, ground: 0 }).M.delt > n.M.delt + 0.05, 'Deltaband bei Eversion');
});

test('Wadenheben einbeinig: Achillessehne 1–4 × KG, Ferse hebt ab (Auflage vorn), kein Hüftmoment-Ausreißer', () => {
  const r = preset('calfRaise');
  between(r.M.achBW, 1, 4, 'Achilles Wadenheben'); assert.ok((r.act.gastroM || 0) > 0.3 || (r.act.soleus || 0) > 0.3, 'Wadenmuskeln arbeiten');
  const w = m.evalPose(byId(m.PHYSIO, 'calfRaiseW').pose, { load: byId(m.PHYSIO, 'calfRaiseW').load });
  assert.ok(w.M.grf > r.M.grf, 'Zusatzlast erhöht die Bodenreaktion');
});

test('Screw-home: Tibia in Streckung ≈ 8° außenrotiert, ab 30° Beugung frei; Bewegungsgrenzen koppeln Hüfte/Knie und Sprunggelenk/Knie', () => {
  assert.ok(Math.abs(preset('stand').rh.screw + 8) < 0.5 && Math.abs(preset('squatPar').rh.screw) < 0.5);
  const l0 = m.limits({ knee: 0 }), l90 = m.limits({ knee: 90 });
  assert.ok(l0.hipF[1] < l90.hipF[1], 'Hüftbeugung mit gestrecktem Knie begrenzt (Hamstrings)');
  assert.ok(l0.ankle[1] < l90.ankle[1], 'Dorsalextension mit gestrecktem Knie begrenzt (Gastrocnemius)');
  assert.ok(l0.tibR[1] < l90.tibR[1] && l0.valg[1] < l90.valg[1], 'Rotation/Valgus in Streckung verriegelt');
});

test('Bewegungsgrenzen: clampPose hält jede Eingabe im Bereich; keine NaN im Bewegungsraum, mit und ohne Bodenkontakt', () => {
  const c = m.clampPose({ hipF: 999, knee: -5, ankle: 200, sub: -90, wt: 500, ground: 0.7 });
  assert.equal(c.knee, 0); assert.equal(c.sub, -15); assert.equal(c.wt, 100); assert.equal(c.ground, 1); assert.ok(c.hipF <= 130);
  let n = 0;
  for (const ground of [1, 0]) for (let hipF = -20; hipF <= 120; hipF += 35) for (let knee = 0; knee <= 140; knee += 35) for (const ankle of [-45, 0, 20]) for (const sub of [-15, 30]) for (const valg of [-15, 15]) {
    const r = m.evalPose({ hipF, knee, ankle, sub, valg, tibR: valg, wt: 100, ground }); n++;
    for (const k of ['pf', 'pfPress', 'tf', 'acl', 'pcl', 'patTen', 'ach', 'hipJ', 'itbOff', 'ankAnt', 'ankPost', 'aclStrain', 'atfl', 'cfl', 'mcl', 'lcl', 'nerve', 'mHip', 'mKnee', 'mAnk']) assert.ok(Number.isFinite(r.M[k]), `${k} nicht endlich bei H${hipF} K${knee} S${ankle} sub${sub} ground${ground}`);
    for (const id in r.strain) assert.ok(Number.isFinite(r.strain[id]), `Dehnung ${id} nicht endlich`);
    assert.ok(r.M.pfBW >= 0 && r.M.pfBW < 40 && r.M.tfBW < 30, 'Kräfte endlich und beschränkt (Extremposen auf den Zehen eingeschlossen)');
  }
  assert.ok(n > 400);
});

test('Presets, Abläufe und Übungen: eindeutige IDs, im Bewegungsraum; Lasten mit Kraftvektor und Text', () => {
  const all = [...m.PRESETS, ...m.ANIMS, ...m.PHYSIO];
  const ids = new Set(); for (const x of all) { assert.ok(!ids.has(x.id), 'doppelte ID ' + x.id); ids.add(x.id); }
  const keys = m.poseParams.map(p => p.key);
  for (const p of m.PRESETS) { const c = m.clampPose(Object.assign({}, p.pose)); for (const k of keys) assert.ok(Math.abs(c[k] - (p.pose[k] || 0)) <= 5, `Preset ${p.id}: ${k} außerhalb (${p.pose[k]} → ${c[k]})`); }
  for (const a of m.ANIMS) for (const pose of [a.from, a.to]) { const c = m.clampPose(Object.assign({}, pose)); for (const k of keys) assert.ok(Math.abs(c[k] - (pose[k] || 0)) <= 22, `Ablauf ${a.id}: ${k} außerhalb`); }
  for (const p of m.PHYSIO) { if (p.load) { assert.equal(p.load.F.length, 3); assert.ok(typeof p.load.label === 'string'); assert.ok(['foot', 'body'].includes(p.load.at)); } }
});

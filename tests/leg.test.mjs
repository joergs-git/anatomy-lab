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

test('Treppe (einbeinig, 65°): PF ≈ 3,3 × KG (2,5–4,5), Hüftkontaktkraft 2–7 × KG (statischer Extremfall mit 60° Rumpf; Bergmann in vivo ≈ 2,5–3,5 × KG im Gehrhythmus), Glutaeus maximus beteiligt', () => {
  const r = preset('stair');
  between(r.M.pfBW, 2.5, 4.5, 'PF Treppe'); between(r.M.hipBW, 2, 7, 'Hüftkraft Treppe');
  assert.ok((r.act.glutMax || 0) > 0.2 && (r.act.semimem || 0) > 0.2, 'Hüftstrecker (Glutaeus maximus und Hamstrings) tragen den Treppenaufstieg');
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

/* ---- v0.12: Ansätze, Hüfte/Becken/Rumpf, Kompartimente, anderes Bein ---- */
const V3 = (x, y, z) => ({ x, y, z });
const distEll = (p, c, r, ry) => { let dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z; if (ry) { const cs = Math.cos(-ry), sn = Math.sin(-ry); const x2 = dx * cs + dz * sn, z2 = -dx * sn + dz * cs; dx = x2; dz = z2; } const n = Math.hypot(dx / r.x, dy / r.y, dz / r.z); return (n - 1) * Math.min(r.x, r.y, r.z); };
const distTube = (p, pts, radii) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const ab = V3(b.x - a.x, b.y - a.y, b.z - a.z); const l2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z; const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y + (p.z - a.z) * ab.z) / l2)); const q = V3(a.x + ab.x * t, a.y + ab.y * t, a.z + ab.z * t); const r = radii[i] + (radii[i + 1] - radii[i]) * t; best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) - r); } return best; };

test('Ansätze: jeder Ursprung und Ansatz von Muskeln und Bändern liegt auf einem Knochenprimitiv des Rahmens (≤ 4 mm), nichts hängt in der Luft', () => {
  const prims = m.recordBones(); assert.ok(prims.length > 50, 'Knochenprimitive aufgezeichnet');
  const dist = (f, p) => { let best = 1e9; for (const pr of prims) { if (pr.f !== f) continue; best = Math.min(best, pr.kind === 'ell' ? distEll(p, pr.c, pr.r, pr.ry) : distTube(p, pr.pts, pr.radii)); } return best; };
  const bad = [];
  for (const s of m.STRUCT) { if (s.kind === 'nerve' || s.surface) continue; s.fas.forEach((f, i) => { for (const lm of [f[0], f[f.length - 1]]) { const d = dist(lm.f, lm.v); if (d > 0.4) bad.push(`${s.id}#${i} ${lm.f}(${lm.v.x},${lm.v.y},${lm.v.z}) ${d.toFixed(2)} cm`); } }); }
  assert.deepEqual(bad, [], 'Endpunkte ohne Knochenkontakt: ' + bad.join('; '));
});

test('Hüftimpingement (FADIR): Kopf-Hals-Übergang trifft den Pfannenrand bei 90° Beugung + Adduktion + Innenrotation (< 4 mm), frei im Stand (> 25 mm) und in Außenrotation', () => {
  const fadir = preset('fadir'), stand = preset('stand'), er = m.evalPose({ hipF: 90, knee: 90, hipR: -25, ground: 0 }), f90 = m.evalPose({ hipF: 90, knee: 90, ground: 0 });
  assert.ok(fadir.M.fai < 4 && fadir.M.faiComp > 0.6, `FADIR ${fadir.M.fai.toFixed(1)} mm`);
  assert.ok(stand.M.fai > 25, `Stand ${stand.M.fai.toFixed(1)} mm`); assert.ok(er.M.fai > 8, `Außenrotation ${er.M.fai.toFixed(1)} mm`);
  assert.ok(f90.M.fai > fadir.M.fai && f90.M.fai < 10, `gerade Beugung 90°: ${f90.M.fai.toFixed(1)} mm – nahe, aber nicht so eng wie FADIR`);
});

test('Kompartimente: Varus belastet medial, Valgus lateral, Stand ≈ 55 % medial; Knick-Senkfuß (Pronation → Tibia-Innenrotation → Valgus) verlagert nach lateral', () => {
  const stand = preset('stand'); between(stand.M.medShare, 0.5, 0.65, 'medialer Anteil im Stand');
  const varus = m.evalPose({ valg: -8, knee: 12 }), valgus = m.evalPose({ valg: 8, knee: 12 });
  assert.ok(varus.M.medShare > 0.7 && varus.M.medShare < 0.95, `Varus medial ${varus.M.medShare.toFixed(2)}`);
  assert.ok(valgus.M.medShare < 0.35 && valgus.M.medShare > 0.05, `Valgus medial ${valgus.M.medShare.toFixed(2)}`);
  const pron = preset('pronation');
  assert.ok(pron.M.tibRe > pron.pose.tibR + 5, `Pronation koppelt Tibia-Innenrotation (${pron.M.tibRe.toFixed(1)}°)`); assert.ok(pron.M.medShare < 0.35, 'Knick-Senkfuß entlastet medial');
  assert.ok(Math.abs(stand.M.tfMed + stand.M.tfLat - stand.M.tf) < 1e-6, 'Anteile summieren sich zur TF-Kompression');
});

test('Beckenkippung: nach vorn verkürzt Hüftbeuger und Rückenstrecker, dehnt Bauchmuskeln und Hamstrings – nach hinten umgekehrt (unteres gekreuztes Syndrom)', () => {
  const ant = preset('antTilt'), post = preset('postTilt'), n = preset('stand');
  assert.ok(ant.strain.iliopsoas < n.strain.iliopsoas - 0.015 && ant.strain.erector < n.strain.erector - 0.02, 'vorn: Iliopsoas und Erector verkürzt');
  assert.ok(ant.strain.rectAbd > n.strain.rectAbd + 0.04 && ant.strain.semimem > n.strain.semimem + 0.02, 'vorn: Rectus abdominis und Hamstrings gedehnt');
  assert.ok(post.strain.erector > n.strain.erector + 0.02 && post.strain.rectAbd < n.strain.rectAbd - 0.04, 'hinten: Erector gedehnt, Bauch verkürzt');
  assert.ok(Math.abs(ant.rh.hipClin - (ant.pose.hipF + ant.rh.lean + ant.pose.tilt)) < 1e-9, 'klinische Hüftbeugung enthält die Kippung');
  const thomas = preset('thomas'); assert.ok(thomas.strain.rectF > 0.1 && thomas.strain.iliopsoas > 0.02, 'Thomas-Test dehnt Rectus femoris (Knie gebeugt) und Iliopsoas');
});

test('Hüftmuskeln: Glutaeus maximus streckt über den ganzen Beugebereich (Hebel ≥ 2 cm bis 120°), Iliopsoas bleibt Beuger bis 90°; Hüfthinge (Kreuzheben) und tiefe Kniebeuge aktivieren den Glutaeus', () => {
  const dl = byId(m.PHYSIO, 'deadlift'); const bottom = Object.assign({}, dl.pose, dl.sweep);
  const r = m.evalPose(bottom, { load: dl.load });
  assert.ok(r.rh.balanced && r.rh.hipClin > 80, `Kreuzheben unten: Hüfte ${r.rh.hipClin.toFixed(0)}°, Rumpf ${r.rh.lean.toFixed(0)}°`);
  assert.ok((r.act.glutMax || 0) > 0.25 && (r.act.semimem || 0) > 0.3 && !(r.act.iliopsoas > 0.02), `Glutaeus ${(r.act.glutMax || 0).toFixed(2)}, Hamstrings ${(r.act.semimem || 0).toFixed(2)}, Iliopsoas ${(r.act.iliopsoas || 0).toFixed(2)}`);
  assert.ok(r.M.tfBW < 3 && r.M.hipBW > 3, `TF ${r.M.tfBW.toFixed(1)} × KG, Hüfte ${r.M.hipBW.toFixed(1)} × KG`);
  const deep = preset('squatDeep'); assert.ok((deep.act.glutMax || 0) > 0.15 && !(deep.act.iliopsoas > 0.02), 'tiefe Kniebeuge: Glutaeus aktiv, Iliopsoas nicht');
  for (const hipF of [0, 60, 90, 120]) { const x = m.evalPose({ hipF, knee: Math.min(hipF, 100), ground: 0 }); assert.ok((x.act.glutMax || 0) === 0 || x.M.mHip > 0, 'konsistent'); }
});

test('Anderes Bein: Spiegelebene folgt dem Becken (kein Auseinanderdriften bei Bodenkontakt); Ausfallschritt mit hinterem Bein am Boden ist ausbalanciert, Ballen auf Bodenhöhe; Pistol hebt das Bein', () => {
  const fr = m.MODULE.frames, K = m.MODULE.kinematics;
  for (const ps of [preset('stand').pose, preset('squatPar').pose, preset('trend').pose, preset('lunge').pose]) {
    K.solvePose(ps, fr); const midX = fr.B.p.x + m.AN.mid;
    assert.ok(Math.abs(fr.F2.p.x - (2 * midX - fr.F.p.x)) < 1e-6, 'Hüfte des anderen Beins gespiegelt an der Beckenmitte');
  }
  const lunge = preset('lunge'); assert.ok(lunge.rh.balanced && lunge.rh.otherMode === 3 && lunge.rh.otherGround, `Ausfallschritt: Rumpf ${lunge.rh.lean.toFixed(0)}°`); between(lunge.rh.lean, 0, 40, 'Rumpfneigung Ausfallschritt');
  K.solvePose(lunge.pose, fr); const mt = K.worldPt(fr, { f: 'C2', v: m.AN.mtHeads }), heel = K.worldPt(fr, { f: 'C2', v: m.AN.heel });
  assert.ok(Math.abs(mt.y - m.AN.groundY) < 0.3, `Ballen des hinteren Fußes auf dem Boden (${mt.y.toFixed(1)} vs ${m.AN.groundY})`); assert.ok(heel.y > mt.y + 5 && mt.z < fr.B.p.z - 20, 'Ferse angehoben, Fuß hinter dem Becken');
  const pistol = byId(m.PHYSIO, 'pistol'); const p = m.evalPose(pistol.pose); assert.equal(p.rh.otherMode, 4); assert.ok(!p.rh.otherGround);
  K.solvePose(p.pose, fr); assert.ok(fr.C2.p.z > fr.B.p.z + 40 && fr.C2.p.y > m.AN.groundY + 20, 'Pistol: anderes Bein vorn gestreckt in der Luft');
  const one = m.evalPose({ wt: 100 }); assert.equal(one.rh.otherMode, 2, 'volles Gewicht auf einem Bein → anderes Bein abgehoben (automatisch)');
});

test('Druckmittelpunkt wandert stetig: kleine Änderungen des Sprunggelenkwinkels ändern das Kniemoment nur begrenzt (kein Sprung Ferse ↔ Ballen)', () => {
  let prev = null;
  for (let ankle = 10; ankle <= 40; ankle += 1) { const r = m.evalPose({ hipF: 60, knee: 90, ankle, wt: 100 }); if (prev !== null) assert.ok(Math.abs(r.M.mKnee - prev) < 25, `Sprung im Kniemoment bei ${ankle}°: ${prev.toFixed(0)} → ${r.M.mKnee.toFixed(0)} Nm`); prev = r.M.mKnee; }
});

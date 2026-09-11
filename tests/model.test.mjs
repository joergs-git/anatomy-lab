/* Modell-Invarianten des Schultermoduls: Kalibrierungsanker aus der Literatur und Regressionsschutz.
   node --test tests/           (ohne Browser; three.js aus node_modules) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from './harness.mjs';

const m = loadModel('shoulder');
const mm = v => v * 10;                 // Modell rechnet in cm
const pct = v => v * 100;
const between = (v, lo, hi, what) => assert.ok(v >= lo && v <= hi, `${what}: ${v.toFixed(2)} nicht in [${lo}, ${hi}]`);
const byId = (list, id) => { const x = list.find(p => p.id === id); assert.ok(x, id + ' fehlt'); return x; };

test('Ruhestellung: subakromial ≈ 9,9 mm, Kapsel locker, Bizepssehne ohne Zusatzknick, kaum Gelenkkraft', () => {
  const r = m.evalPose({});
  between(mm(r.M.ahd), 9.5, 10.3, 'AHD Ruhe');
  between(mm(r.M.chd), 9, 13, 'CHD Ruhe');
  assert.ok(Math.abs(r.M.lbsDeflRel) < 0.5, 'LBS-Zusatzknick in Ruhe muss 0 sein (Referenz), ist ' + r.M.lbsDeflRel.toFixed(1));
  for (const k of ['capAnt', 'capPost', 'capSup']) between(pct(r.M[k]), -5, 4, k + ' Ruhe');
  between(r.M.jrf, 15, 80, 'JRF Ruhe (Armgewicht)');
  for (const id in r.strain) assert.ok(Math.abs(r.strain[id]) < 0.02 || m.STRUCT_BY_ID[id].kind !== 'muscle', `Muskel ${id} in Ruhe nicht neutral`);
});

test('Abduktion 90°: Subakromialraum ≈ 3–4,5 mm, Skapula ≈ 15° aufwärtsrotiert, Gelenkkraft ≈ 250–450 N', () => {
  const r = m.evalPose({ P: 10, E: 90 });
  between(mm(r.M.ahd), 3.0, 4.5, 'AHD Abd90');
  between(r.rh.UR, 12, 20, 'Skapula-Aufwärtsrotation bei 90°');
  between(r.M.jrf, 250, 450, 'JRF Abd90 unbelastet');
  assert.ok((r.act.deltM || 0) > 0.25 && (r.act.infra || 0) > 0.1, 'Deltoideus und Manschette tragen den Arm');
});

test('Überkopf 170°: Raum wieder offen, untere Kapsel endgradig, Skapula ≈ 25–30°', () => {
  const r = m.evalPose({ P: 35, E: 170 });
  between(mm(r.M.ahd), 8, 10.5, 'AHD Überkopf');
  between(pct(r.M.capInf), 9, 16, 'Kapsel unten Überkopf');
  between(r.rh.UR, 22, 32, 'Aufwärtsrotation Überkopf');
});

test('Wurf-/Apprehension-Position: internes Impingement ≈ 2 mm, vordere/untere Kapsel und IGHL endgradig', () => {
  const r = m.evalPose(byId(m.PRESETS, 'aber').pose);
  between(mm(r.M.psd), 1.0, 3.5, 'PSD ABER');
  assert.ok(pct(r.M.capAnt) >= 10 && pct(r.M.capInf) >= 10, `Kapsel vorn/unten endgradig: ${pct(r.M.capAnt).toFixed(0)}/${pct(r.M.capInf).toFixed(0)} %`);
  assert.ok(r.strain.GHL >= 0.09, 'GHL gespannt in ABER: ' + r.strain.GHL.toFixed(2));
  between(mm(r.M.ahd), 9, 10.5, 'subakromial frei in ABER');
});

test('Hawkins / Sleeper Stretch: Kontaktfenster bei 20–55° Innenrotation, Minimum ≈ 2 mm, danach wieder offen', () => {
  const s40 = m.evalPose({ P: 90, E: 90, IR: 40, elbow: 90 });
  between(mm(s40.M.ahd), 1.5, 3.0, 'AHD Sleeper IR40');
  assert.ok(s40.M.bursaComp >= 0.9, 'Bursa komprimiert');
  assert.ok(pct(s40.M.capPost) >= 10, 'hintere Kapsel endgradig im Sleeper');
  between(s40.M.lbsDeflRel, 35, 60, 'LBS-Zusatzknick Sleeper IR40');
  const s70 = m.evalPose({ P: 90, E: 90, IR: 70, elbow: 90 });
  between(mm(s70.M.ahd), 7.5, 10, 'AHD nach dem Engpass (IR70)');
  let minAhd = 99, atIR = null;
  for (let ir = 0; ir <= 78; ir += 2) { const r = m.evalPose({ P: 90, E: 90, IR: ir, elbow: 90 }); if (mm(r.M.ahd) < minAhd) { minAhd = mm(r.M.ahd); atIR = ir; } }
  between(atIR, 25, 50, 'Lage des Minimums');
});

test('Cross-Body-Dehnung: gleiche Kapselspannung hinten, aber deutlich mehr subakromialer Raum als der Sleeper', () => {
  const r = m.evalPose({ P: 125, E: 80, IR: 0 });
  between(mm(r.M.ahd), 5.5, 7.5, 'AHD Cross-Body neutral rotiert');
  assert.ok(pct(r.M.capPost) >= 10, 'hintere Kapsel endgradig');
  const ir = m.evalPose({ P: 125, E: 80, IR: 45 });
  assert.ok(ir.M.ahd < r.M.ahd - 0.2, 'Innenrotation schließt den Raum');
  const er = m.evalPose({ P: 125, E: 80, IR: -30 });
  assert.ok(er.M.ahd > r.M.ahd + 0.2, 'Außenrotation öffnet den Raum');
});

test('Schürzengriff: subakromial frei, hintere Kapsel endgradig, Supra-/Infraspinatus deutlich gedehnt', () => {
  const r = m.evalPose(byId(m.PRESETS, 'schuerze').pose);
  between(mm(r.M.ahd), 9, 10.5, 'AHD Schürzengriff');
  assert.ok(pct(r.M.capPost) >= 10, 'Kapsel hinten');
  between(r.strain.supra, 0.12, 0.30, 'Supraspinatus-Dehnung');
  between(r.strain.infra, 0.18, 0.35, 'Infraspinatus-Dehnung');
});

test('Lasten: 3 kg Seitheben bei 90° ≈ 700–1100 N, Band-Außenrotation aktiviert nur Rotatoren', () => {
  const lr = byId(m.PHYSIO, 'latraise');
  const r = m.evalPose(Object.assign({}, lr.pose, lr.sweep), { load: lr.load });
  between(r.M.jrf, 700, 1100, 'JRF Seitheben 3 kg');
  const er = byId(m.PHYSIO, 'erband');
  const e = m.evalPose(Object.assign({}, er.pose, er.sweep), { load: er.load });
  assert.ok((e.act.infra || 0) > 0.3, 'Infraspinatus arbeitet gegen das Band');
  for (const id of ['deltA', 'deltM', 'deltP', 'triLH', 'pecM']) assert.ok(!(e.act[id] > 0.05), `${id} darf bei abgestütztem Ellbogen nicht mitrechnen`);
  between(e.M.jrf, 150, 400, 'JRF Band-Außenrotation');
});

test('Pathologie: Kopfhochstand schließt den Subakromialraum, GIRD spannt die hintere Kapsel früher und begrenzt die Innenrotation', () => {
  const base = m.evalPose({ P: 10, E: 90 });
  const migr = m.evalPose({ P: 10, E: 90 }, { patho: { migr: 3 } });
  assert.ok(mm(migr.M.ahd) < mm(base.M.ahd) - 2.0, 'Hochstand 3 mm reduziert den Raum um ≥ 2 mm');
  const g = m.evalPose({ P: 90, E: 90, IR: 40, elbow: 90 }, { patho: { gird: 0.5 } });
  const b = m.evalPose({ P: 90, E: 90, IR: 40, elbow: 90 });
  assert.ok(g.M.capPost > b.M.capPost + 0.03, 'GIRD erhöht die hintere Kapselspannung');
  m.evalPose({});   // patho zurücksetzen
  const rl0 = m.rotLimits(90, 10), rlG = m.rotLimits(90, 10, { migr: 0, gird: 0.5, frozen: 0 });
  assert.ok(rlG.IR < rl0.IR - 15, 'GIRD begrenzt die Innenrotation');
});

test('Bewegungsgrenzen: clampPose hält jede Eingabe im erlaubten Bereich; keine NaN im ganzen Bewegungsraum', () => {
  m.evalPose({});
  const c = m.clampPose({ P: 999, E: -5, IR: 400, elbow: -20, pro: 300 });
  assert.equal(c.P, 150); assert.equal(c.E, 0); assert.equal(c.elbow, 0); assert.equal(c.pro, 80);
  const c2 = m.clampPose({ P: 10, E: 90, IR: -500 }); assert.equal(c2.IR, -m.rotLimits(90, 10).ER);
  let n = 0;
  for (let P = -90; P <= 150; P += 30) for (let E = 0; E <= 180; E += 30) for (let IR = -110; IR <= 110; IR += 55) for (const elbow of [0, 90]) {
    const r = m.evalPose({ P, E, IR, elbow }); n++;
    for (const k of ['ahd', 'chd', 'psd', 'capAnt', 'capPost', 'capInf', 'capSup', 'jrf', 'lbsDeflRel', 'lbsStrain', 'axStrain']) assert.ok(Number.isFinite(r.M[k]), `${k} nicht endlich bei P${P} E${E} IR${IR}`);
    for (const id in r.strain) assert.ok(Number.isFinite(r.strain[id]), `Dehnung ${id} nicht endlich bei P${P} E${E} IR${IR}`);
    assert.ok(mm(r.M.ahd) > -0.5, `Humeruskopf durchdringt das Dach (${mm(r.M.ahd).toFixed(1)} mm) bei P${P} E${E} IR${IR}`);
    assert.ok(r.M.jrf >= 0 && r.M.jrf < 3000, 'JRF plausibel');
  }
  assert.ok(n > 500);
});

test('Presets, Abläufe und Übungen haben eindeutige IDs und liegen im Bewegungsraum', () => {
  const all = [...m.PRESETS, ...m.ANIMS, ...m.PHYSIO];
  const ids = new Set(); for (const x of all) { assert.ok(!ids.has(x.id), 'doppelte ID ' + x.id); ids.add(x.id); }
  for (const p of m.PRESETS) { const c = m.clampPose(Object.assign({}, p.pose)); for (const k of ['P', 'E', 'IR', 'elbow', 'pro']) assert.ok(Math.abs(c[k] - (p.pose[k] || 0)) <= 5, `Preset ${p.id}: ${k} außerhalb (${p.pose[k]} → ${c[k]})`); }
  for (const a of m.ANIMS) for (const pose of [a.from, a.to]) { const c = m.clampPose(Object.assign({}, pose)); for (const k of ['P', 'E', 'IR', 'elbow', 'pro']) assert.ok(Math.abs(c[k] - (pose[k] || 0)) <= 22, `Ablauf ${a.id}: ${k} außerhalb`); }
  for (const p of m.PHYSIO) { if (p.load) { assert.equal(p.load.F.length, 3); assert.ok(typeof p.load.label === 'string'); } }
});

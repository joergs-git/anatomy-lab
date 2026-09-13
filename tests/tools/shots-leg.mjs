/* Sichtprüfung Bein: Presets, Schichten, Kameras → shots/leg-*.png.  Aufruf: npm run build && node tests/tools/shots-leg.mjs [name …]
   (ohne Namen alle Ansichten; braucht Playwright + Chromium wie tests/shots.mjs) */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const page = join(root, 'dist/test.html');
const pw = await import('playwright');
const out = join(root, 'shots'); if (!existsSync(out)) mkdirSync(out);
const args = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];
let browser; try { browser = await pw.chromium.launch({ args }); } catch (e) { browser = await pw.chromium.launch({ args, executablePath: '/opt/pw-browsers/chromium' }); }
const url = pathToFileURL(page).href; const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
async function shot(name, query, fn) {
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(name + ': ' + String(e)));
  await p.goto(url + '?m=leg' + (query ? '&' + query : '')); await p.waitForTimeout(1800);
  if (fn) { await p.evaluate(fn); await p.waitForTimeout(500); }
  await p.screenshot({ path: join(out, 'leg-' + name + '.png') }); await p.close();
}
const shots = process.argv.slice(2);
const all = {
  stand: ['', null],
  standBack: ['cam=-186,82,200', null],
  standSide: ['cam=-92,82,200', null],
  lunge: ['', () => window.AnatomyLab.runById('lunge')],
  lungeSide: ['cam=-92,82,220', () => window.AnatomyLab.runById('lunge')],
  trend: ['cam=-6,82,200', () => window.AnatomyLab.runById('trend')],
  pistol: ['cam=-92,82,220', () => window.AnatomyLab.runById('pistol')],
  fadir: ['cam=-40,70,180', () => window.AnatomyLab.runById('fadir')],
  antTilt: ['cam=-92,82,200', () => window.AnatomyLab.runById('antTilt')],
  postTilt: ['cam=-92,82,200', () => window.AnatomyLab.runById('postTilt')],
  thomas: ['cam=-92,82,200', () => window.AnatomyLab.runById('thomas')],
  deadlift: ['cam=-92,82,220', () => { const S = window.AnatomyLab; S.runById('deadlift'); S.stopAnim(); S.setPose({ hipF: 34, knee: 25, ankle: 5, tilt: 8 }); }],
  squatDeep: ['cam=-40,82,200', () => window.AnatomyLab.runById('squatDeep')],
  ankleLig: ['cam=-30,80,60,3,-86,3', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['atfl', 'cfl', 'ptfl', 'deltoid', 'peron', 'tibPost', 'tibAnt', 'plantar']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  ankleLigMed: ['cam=-150,80,60,3,-86,3', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['atfl', 'cfl', 'ptfl', 'deltoid', 'peron', 'tibPost', 'tibAnt', 'plantar']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  ankleSup: ['cam=-30,80,60,3,-86,3&ankle=-30&sub=25&ground=0', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['atfl', 'cfl', 'ptfl', 'deltoid']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  hipMuscles: ['cam=-150,75,110,3,-10,3', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas', 'erector', 'rectAbd', 'oblique', 'addLong', 'addMag']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  hipMusclesFront: ['cam=-20,75,110,3,-10,3', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas', 'erector', 'rectAbd', 'oblique', 'addLong', 'addMag', 'rectF', 'sart', 'tfl']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  hipSquat: ['cam=-150,75,120,3,-30,3&hipF=102&knee=140&ankle=38', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas', 'rectF', 'bicF', 'semimem']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  lungeBones: ['cam=-92,82,230,3,-48,-20', () => { window.AnatomyLab.runById('lunge'); document.querySelector('#layerPresets [data-lp="bones"]').click(); }],
  lungeBonesBack: ['cam=-186,82,230,3,-48,-20', () => { window.AnatomyLab.runById('lunge'); document.querySelector('#layerPresets [data-lp="bones"]').click(); }],
  splitTop: ['cam=-92,82,230,3,-48,-20', () => { const S = window.AnatomyLab; S.runById('splitSquat'); S.stopAnim(); S.setPose({ hipF: 42, knee: 50, ankle: 8, wt: 70, other: 3 }); document.querySelector('#layerPresets [data-lp="bones"]').click(); }],
  splitBottom: ['cam=-92,82,230,3,-48,-20', () => { const S = window.AnatomyLab; S.runById('splitSquat'); S.stopAnim(); S.setPose({ hipF: 75, knee: 95, ankle: 20, wt: 70, other: 3 }); document.querySelector('#layerPresets [data-lp="bones"]').click(); }],
  glut0: ['cam=-230,75,80,6,-2,-2&ground=0', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  glut90: ['cam=-230,75,80,6,-2,6&ground=0&hipF=90&knee=90', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  glut90side: ['cam=-100,80,80,6,-2,10&ground=0&hipF=90&knee=90', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['glutMax', 'glutMed', 'piri', 'iliopsoas']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  psoas0: ['cam=-30,75,80,6,-2,2&ground=0', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['iliopsoas', 'rectF', 'addLong']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  psoas90: ['cam=-60,75,80,6,-2,10&ground=0&hipF=90&knee=90', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['iliopsoas', 'rectF', 'addLong']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  trunkBack: ['cam=-200,75,100,6,8,-4&tilt=18', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['erector', 'rectAbd', 'oblique', 'glutMax', 'iliopsoas']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  trunkFront: ['cam=-30,75,110,3,5,-4&tilt=18', () => { document.querySelector('#layerPresets [data-lp="bones"]').click(); for (const id of ['erector', 'rectAbd', 'oblique', 'glutMax', 'iliopsoas']) { const it = document.getElementById('ly-' + id); if (it && !it.checked) it.click(); } }],
  kneeLig: ['cam=-30,80,60,3,-46,3&knee=30', () => document.querySelector('#layerPresets [data-lp="knee"]').click()],
};
for (const [name, [q, fn]] of Object.entries(all)) { if (shots.length && !shots.includes(name)) continue; await shot(name, q, fn); }
await browser.close();
if (errors.length) { console.error('Skriptfehler:\n' + errors.join('\n')); process.exit(1); }
console.log('ok →', out);

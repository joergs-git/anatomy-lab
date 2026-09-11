/* Sichtprüfung im Browser (optional): baut die Testseite, öffnet sie in Chromium, prüft auf Skriptfehler,
   macht Screenshots (Desktop, iPhone) und testet den Link-Roundtrip (Zustand → Link → Zustand).
   Voraussetzung:  npm i -D playwright && npx playwright install chromium
   Aufruf:         npm run build && npm run shots        → Bilder in shots/ */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = join(root, 'dist/test.html');
if (!existsSync(page)) { console.error('dist/test.html fehlt – zuerst `npm run build`'); process.exit(1); }
let pw; try { pw = await import('playwright'); } catch { console.error('playwright nicht installiert: npm i -D playwright && npx playwright install chromium'); process.exit(1); }

const out = join(root, 'shots'); if (!existsSync(out)) mkdirSync(out);
const args = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];
let browser;
try { browser = await pw.chromium.launch({ args }); }
catch (e) { const cand = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean).find(existsSync); if (!cand) throw e; browser = await pw.chromium.launch({ args, executablePath: cand }); }

const url = pathToFileURL(page).href;
const errors = [];
async function open(ctx, hash = '') { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(String(e))); await p.goto(url + hash); await p.waitForTimeout(2200); return p; }

// Desktop: Startansicht, Sleeper-Stretch-Position, Englisch
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
let p = await open(desk);
await p.screenshot({ path: join(out, 'desktop-start.png') });
await p.evaluate(() => { const S = window.AnatomyLab; S.stopAnim(); S.setPose({ P: 90, E: 90, IR: 40, elbow: 90, pro: 0 }); S.selectStructure('supra'); });
await p.waitForTimeout(400); await p.screenshot({ path: join(out, 'desktop-sleeper40.png') });
const state = await p.evaluate(() => { const S = window.AnatomyLab; const st = S.currentState(); return { url: S.buildShareURL(), token: S.compactEncode(st).token, ahd: S.EVAL.metrics.ahd }; });
await p.evaluate(() => window.AnatomyLab.setLang('en', true)); await p.waitForTimeout(300); await p.screenshot({ path: join(out, 'desktop-en.png') });
await p.close();

// Link-Roundtrip über den kompakten Token (frischer Kontext: kein gespeicherter Sprachwechsel)
const clean = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
p = await open(clean, '#' + state.token);
const back = await p.evaluate(() => { const S = window.AnatomyLab; return { token: S.compactEncode(S.currentState()).token, ahd: S.EVAL.metrics.ahd, sel: document.querySelector('#info h3') && document.querySelector('#info h3').textContent }; });
await p.close();
const roundtrip = back.token === state.token && Math.abs(back.ahd - state.ahd) < 1e-6;

// iPhone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE' });
p = await open(phone, '#E90_P90_R40_B90');
await p.screenshot({ path: join(out, 'iphone-sleeper40.png') });
await p.evaluate(() => window.AnatomyLab.openTab('metrics')); await p.waitForTimeout(400);
await p.screenshot({ path: join(out, 'iphone-monitor.png') });
await p.close();
await browser.close();

console.log('Screenshots →', out);
console.log('Link-Roundtrip:', roundtrip ? 'OK' : 'ABWEICHUNG', state.token, '→', back.token, '| gewählt:', back.sel);
if (errors.length) { console.error('Skriptfehler:\n' + errors.join('\n')); process.exit(1); }
if (!roundtrip) process.exit(1);
console.log('keine Skriptfehler');

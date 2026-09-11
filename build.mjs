#!/usr/bin/env node
/* Baut aus src/ eine einzelne HTML-Datei mit allen registrierten Modulen.
   node build.mjs [--registry <json>] [--out <dir>]
     --registry  Registry-Datei (Standard: src/modules/registry.json). Einträge sind Modul-IDs oder Objekte
                 {id, dir?, name?, nameEn?} – dir = Ordner unter src/modules (Standard: id). Reihenfolge = Index im Kurz-Link, nur anhängen!
     --out       Zielordner (Standard: Repo-Wurzel für index.html, dist/ für die Varianten)
   Ergebnis:
     index.html          – vollständige Seite für GitHub Pages / lokales Öffnen
     dist/artifact.html  – nur Seiteninhalt (ohne doctype/html/head/body) für den claude.ai-Artefakt-Viewer
     dist/test.html      – lokale Testvariante (three.js aus node_modules, keine Web-Fonts) für tests/shots.mjs

   Aufbau des Skripts: Engine-Kopf (Mathe, Wörterbuch, URL-Parameter) → REGISTRY + je Modul eine Fabrik
   MODULES[id]=function(){ …Modul-Dateien…; return MODULE; } → engine/boot.js wählt und instanziiert das Modul → Engine-Rest. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const registryPath = resolve(root, opt('--registry', 'src/modules/registry.json'));
const outRoot = resolve(root, opt('--out', '.'));
const outDist = opt('--out', null) ? outRoot : join(root, 'dist');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const read = p => readFileSync(join(root, 'src', p), 'utf8');

/* Engine-Bauteile in fester Reihenfolge; die Modul-Fabriken stehen zwischen Kopf und Rest */
const ENGINE_HEAD = ['engine/math.js', 'engine/i18n.js'];
const ENGINE_TAIL = ['engine/boot.js', 'engine/render.js', 'engine/ui.js', 'engine/share.js'];

const registry = JSON.parse(readFileSync(registryPath, 'utf8')).map(e => typeof e === 'string' ? { id: e } : e);
if (!registry.length) throw new Error('Registry ist leer');
const ids = new Set(); for (const e of registry) { if (ids.has(e.id)) throw new Error('doppelte Modul-ID ' + e.id); ids.add(e.id); }

const modules = registry.map(e => {
  const dir = e.dir || e.id;
  const meta = JSON.parse(readFileSync(join(root, 'src/modules', dir, 'module.json'), 'utf8'));
  const parts = meta.parts.map(p => read(`modules/${dir}/${p}`));
  return { id: e.id, name: e.name || meta.name, nameEn: e.nameEn || meta.nameEn, description: meta.description, alias: meta.alias || null, js: parts.join('\n') };
});
const first = modules[0];

const registryJs = `/* ---- Modul-Registry (Reihenfolge = Index im Kurz-Link, nur anhängen) und Fabriken; erzeugt von build.mjs ---- */
const REGISTRY=${JSON.stringify(modules.map(m => ({ id: m.id, name: m.name, nameEn: m.nameEn, alias: m.alias })))};
const MODULES={};
${modules.map(m => `MODULES[${JSON.stringify(m.id)}]=function(){\n${m.js}\nreturn MODULE;\n};`).join('\n')}`;

const js = [...ENGINE_HEAD.map(read), registryJs, ...ENGINE_TAIL.map(read)].join('\n');
const head = read('engine/page.html').replace(/__VERSION__/g, pkg.version).replace(/__TITLE__/g, first.name);

const errorMsg = 'Die 3D-Bibliothek (three.js) konnte nicht geladen werden. Bitte Internetverbindung prüfen und die Seite neu laden. / The 3D library (three.js) could not be loaded – please check your connection and reload.';
const body = `${head}
<script>
(function(){
'use strict';
if(!window.THREE){document.getElementById('mainView').innerHTML='<p style="padding:24px;max-width:48ch">${errorMsg}</p>';return;}
${js}
})();
</script>
`;

const [styleHead, rest] = splitOnce(body, '</style>');
const full = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${first.description.replace(/"/g, '&quot;')}">
${styleHead}</style>
</head>
<body>${rest}</body>
</html>
`;

if (!existsSync(outDist)) mkdirSync(outDist, { recursive: true });
writeFileSync(join(outRoot, 'index.html'), full);
writeFileSync(join(outDist, 'artifact.html'), body);

// Testvariante: three.js lokal, Fonts aus
const threeLocal = join(root, 'node_modules/three/build/three.min.js');
if (existsSync(threeLocal)) copyFileSync(threeLocal, join(outDist, 'three.min.js'));
const test = full
  .replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '');
writeFileSync(join(outDist, 'test.html'), test);

console.log(`built [${modules.map(m => m.id).join(', ')}] v${pkg.version}: ${join(outRoot, 'index.html')} (${full.length} bytes), artifact.html, test.html`);

function splitOnce(s, sep) { const i = s.indexOf(sep); return [s.slice(0, i), s.slice(i + sep.length)]; }

#!/usr/bin/env node
/* Baut aus src/ eine einzelne HTML-Datei je Modul.
   node build.mjs [modul]     (Standard: shoulder)
   Ergebnis:
     index.html          – vollständige Seite für GitHub Pages / lokales Öffnen
     dist/artifact.html  – nur Seiteninhalt (ohne doctype/html/head/body) für den claude.ai-Artefakt-Viewer
     dist/test.html      – lokale Testvariante (three.js aus node_modules, keine Web-Fonts) für tests/shots.mjs */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const moduleId = process.argv[2] || 'shoulder';
const mod = JSON.parse(readFileSync(join(root, 'src/modules', moduleId, 'module.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const parts = mod.parts.map(p => readFileSync(join(root, 'src', p), 'utf8'));
const head = parts.filter((_, i) => mod.parts[i].endsWith('.html')).join('\n').replace(/__VERSION__/g, pkg.version);
const js = parts.filter((_, i) => mod.parts[i].endsWith('.js')).join('\n');

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
<meta name="description" content="${mod.description.replace(/"/g, '&quot;')}">
${styleHead}</style>
</head>
<body>${rest}</body>
</html>
`;

const dist = join(root, 'dist');
if (!existsSync(dist)) mkdirSync(dist);
writeFileSync(join(root, 'index.html'), full);
writeFileSync(join(dist, 'artifact.html'), body);

// Testvariante: three.js lokal, Fonts aus
const threeLocal = join(root, 'node_modules/three/build/three.min.js');
if (existsSync(threeLocal)) copyFileSync(threeLocal, join(dist, 'three.min.js'));
const test = full
  .replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '');
writeFileSync(join(dist, 'test.html'), test);

console.log(`built ${moduleId} v${pkg.version}: index.html (${full.length} bytes), dist/artifact.html, dist/test.html`);

function splitOnce(s, sep) { const i = s.indexOf(sep); return [s.slice(0, i), s.slice(i + sep.length)]; }

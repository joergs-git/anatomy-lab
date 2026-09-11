/* Registry und Build: mehrere Module in einer Datei, Fabriken je Modul, Skript syntaktisch gültig.
   node --test tests/registry.test.mjs        (baut in ein Temp-Verzeichnis, verändert index.html nicht) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mainScript = html => { const i = html.lastIndexOf('<script>\n(function(){'); const j = html.indexOf('</script>', i); return html.slice(i + 8, j); };

test('Registry: beginnt mit shoulder (Index 0 im Kurz-Link) und enthält nur bekannte Module', () => {
  const reg = JSON.parse(readFileSync(join(root, 'src/modules/registry.json'), 'utf8')).map(e => typeof e === 'string' ? { id: e } : e);
  assert.equal(reg[0].id, 'shoulder', 'shoulder muss Index 0 behalten – alte Links kodieren das Modul als Index');
  for (const e of reg) JSON.parse(readFileSync(join(root, 'src/modules', e.dir || e.id, 'module.json'), 'utf8'));
});

test('Build mit Zwillings-Registry: zwei Fabriken, Umschalter-Daten, Skript syntaktisch gültig', () => {
  const dir = mkdtempSync(join(tmpdir(), 'anatomy-lab-'));
  try {
    const reg = join(dir, 'registry.json');
    writeFileSync(reg, JSON.stringify(['shoulder', { id: 'shoulder2', dir: 'shoulder', name: 'Zwilling', nameEn: 'Twin' }]));
    execFileSync('node', [join(root, 'build.mjs'), '--registry', reg, '--out', dir], { stdio: 'pipe' });
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    assert.match(html, /MODULES\["shoulder"\]=function\(\)\{/);
    assert.match(html, /MODULES\["shoulder2"\]=function\(\)\{/);
    const registry = JSON.parse(html.match(/const REGISTRY=(\[.*?\]);\n/)[1]);
    assert.deepEqual(registry.map(r => r.id), ['shoulder', 'shoulder2']);
    assert.equal(registry[1].name, 'Zwilling'); assert.equal(registry[1].nameEn, 'Twin'); assert.equal(registry[0].alias, 'Schulterlabor');
    new vm.Script(mainScript(html));   // Syntaxprüfung des gesamten Seitenskripts
    assert.match(html, /<title>Schulterlabor<\/title>/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Standard-Build: index.html enthält genau die registrierten Module und ist syntaktisch gültig', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const reg = JSON.parse(readFileSync(join(root, 'src/modules/registry.json'), 'utf8')).map(e => typeof e === 'string' ? e : e.id);
  const found = [...html.matchAll(/MODULES\["([^"]+)"\]=function/g)].map(m => m[1]);
  assert.deepEqual(found, reg);
  new vm.Script(mainScript(html));
});

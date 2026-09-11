# Aufgaben

## Schritt 2: Modul-Registry und Umschalter (HANDOVER §9)

Ziel: Die Engine instanziiert ein Modul über eine Schnittstelle (`MODULE`-Objekt), alle registrierten Module liegen in einer `index.html`, das Modul steht im Link (`m=<id>` / kompakt `x<Index>`), die Kopfzeile bekommt einen Umschalter (verborgen, solange nur ein Modul registriert ist). Verhalten des Schultermoduls bleibt identisch (A/B-Vergleich gegen den v0.9.1-Build wie in Schritt 1).

- [x] `build.mjs`: Registry (`src/modules/registry.json`, Reihenfolge = Link-Index, nur anhängen), Modul-Dateien als Fabrik `MODULES[id]=function(){…; return MODULE;}`, Engine-Reihenfolge fest, Optionen `--registry` und `--out` für Tests
- [x] `modules/shoulder/module.js`: Schnittstellenobjekt (Pose-/Pathologie-Parameter deklarativ mit Link-Codes, Anatomie, Kinematik, Presets, Knochen, Kameras, Detailfenster, Monitor, HUD, Drag, Render-Hooks, Startanimation, Alias)
- [x] `modules/shoulder/i18n.js`: modulspezifische Texte und `*_EN`-Tabellen aus `engine/i18n.js` herauslösen; Engine mischt beim Start
- [x] `engine/boot.js`: Modul aus URL wählen, Fabrik aufrufen, Wörterbuch mischen, modulabhängiges Markup erzeugen (Pose-Regler, Pathologie-Regler, Rhythmus-Block, Schicht-Schnellwahl, Detail-Dock, Umschalter)
- [x] `engine/render.js`: Materialien mit `userData` statt Identitätsvergleich, Zonen → Metrik aus dem Modul, Flächen-Strukturen generisch, `afterPose`-Hook
- [x] `engine/ui.js`: Regler generisch (`poseParams`/`pathoParams`), `stepAnim`, Intro, `window.AnatomyLab` + Alias
- [x] `engine/share.js`: Pose-/Patho-Codes aus den Parametern, Modul-Feld `m`/`x`, `switchModule`
- [x] `page.html`: Platzhalter statt Schulter-Markup, Umschalter-Element, Fußzeile
- [x] Tests: `harness.mjs` unverändert lauffähig, neuer `tests/registry.test.mjs` (Zwillings-Build, Syntaxprüfung), `shots.mjs` auf `AnatomyLab`
- [x] Verifikation: check, shots, A/B (Pixel, Texte, Metriken, Zustand, Interaktion) gegen v0.9.1; Zwillings-Build im Browser: Umschalter sichtbar, Wechsel funktioniert, Link trägt `m`
- [x] Doku: CLAUDE.md (Regeln: Registry anhängen, Modul-Wörterbuch, Schnittstelle), HANDOVER §9, README (Struktur, Link-Feld, Umschalter), LESSONS
- [x] Version 0.10.0, Commits, Push

## Offen (blockiert, Nutzerentscheidung)

- Git-Historie umschreiben (Autor „Joerg Klaas“/„Claude“ → joergs-git, Co-Authored-By-Trailer entfernen) braucht `git filter-branch` + `push --force-with-lease`; vom Auto-Modus blockiert, Befehle stehen im Abschlussbericht der Sitzung vom 11. September 2026.
- `git push origin main` wurde in dieser Sitzung vom Auto-Modus blockiert; Commits liegen lokal auf `main`.

## Results

- `npm run check`: Build mit Registry, 14 Tests grün (11 Modell, 3 Registry/Build inkl. Syntaxprüfung des Seitenskripts).
- `npm run shots`: keine Skriptfehler, Link-Roundtrip OK.
- A/B gegen v0.9.1: acht Link-Zustände (Desktop + iPhone) pixel-, text-, metrik- und zustandsidentisch; Arm-Drag, Rotationsmodus, Auswahl identisch.
- Zwillings-Build (shoulder + Kopie „Zwilling“): Umschalter sichtbar, Wechsel hin und zurück, Fußzeile/Link `m=shoulder2` bzw. `x1`, englische Modulnamen, Sprache bleibt beim Wechsel erhalten.
- Engine kennt kein Gelenk mehr beim Namen: Regler, Link-Codes, Dock, Monitor, Texte kommen aus `MODULE`.

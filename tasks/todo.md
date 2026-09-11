# Aufgaben

## Migration Schritt 1: schulterspezifische Teile aus `engine/` nach `modules/shoulder/` (HANDOVER §9)

Ziel: reine Verschiebung, kein Verhaltensunterschied. Nachweis: `npm run check` grün, `npm run shots` byte-identisch zur Baseline (Ausnahme `desktop-start.png`: ≤ 40 Pixel Animationsrauschen, wie zwischen zwei Baseline-Läufen gemessen).

- [x] Baseline: Build, Tests, Screenshots (zwei Läufe zur Rauschmessung)
- [x] `modules/shoulder/presets.js` – `PRESETS`, `ANIMS`, `PHYSIO`
- [x] `modules/shoulder/bones.js` – `buildBones(ctx)` (Thorax, Klavikula, Skapula, Humerus, Unterarm/Hand)
- [x] `modules/shoulder/views.js` – `ORBIT0`, `VIEWS`, `detailDefs` (mit `readout`), `PEEL`
- [x] `modules/shoulder/monitor.js` – `METRICS`, `MONITOR` (Top/Spezial/Kapsel-Sammelzeile), `LOAD_GROUPS`, `computeLoads`, `structReadouts`, `BONE_NAME_KEYS`, `LAYER_PRESETS`
- [x] `modules/shoulder/hud.js` – `planeLabel`, HUD-/Zusammenfassungs-/Skapula-Texte, `READOUT0`
- [x] `modules/shoulder/interaction.js` – `LABELS`, `DRAG` (Greifbare Teile, Rotationsachsen, Ziehen → Pose)
- [x] `engine/render.js`, `engine/ui.js` auf die Modul-Bausteine umstellen; `G`/`BONES` aus `frames` bzw. dynamisch
- [x] `module.json` Reihenfolge, `tests/harness.mjs` liest Presets aus `presets.js`
- [x] Verifikation: check + shots + Pixelvergleich
- [x] Doku: CLAUDE.md (Architektur), HANDOVER §9 (Stand, Restkopplungen), README (Struktur), LESSONS bei Bedarf
- [x] Version 0.9.1, Commit(s), Push, Merge nach `main`

## Results

- 11 Modell-Tests grün, `npm run shots` ohne Skriptfehler, Link-Roundtrip OK; vier von fünf Screenshots byte-identisch, Startbild im Rauschmaß (Monitor-Balken-Transition).
- Zusätzlicher A/B-Vergleich beider Builds mit acht festen Link-Zuständen (Desktop + iPhone): Pixel, Panel-Texte, Metriken, Link-Zustand identisch; Arm-Drag, Rotationsmodus und Klick-Auswahl identisch.
- `engine/render.js` 268 → 177 Zeilen, `engine/ui.js` 538 → 449 Zeilen; sechs neue Modul-Dateien. Restkopplungen in `docs/HANDOVER.md` §9 aufgelistet.

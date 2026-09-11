# CLAUDE.md – Arbeitsregeln für dieses Repo

Interaktive biomechanische Lehrmodelle als eine HTML-Datei (three.js r128, kein Build-Framework, kein Backend). Erstes Modul: Schulterlabor (rechte Schulter). Ausgeliefert über GitHub Pages aus dem Root von `main` (`index.html`).

## Befehle

- `npm run build` – baut `index.html` (Pages), `dist/artifact.html` (claude.ai-Viewer, ohne Dokumentgerüst), `dist/test.html` (lokal, three.js aus node_modules)
- `npm test` – Modell-Invarianten (`tests/model.test.mjs`, ohne Browser)
- `npm run shots` – Screenshots Desktop/iPhone + Link-Roundtrip in Chromium (braucht `npm i -D playwright && npx playwright install chromium`)
- Vor jedem Commit: `npm run check` (= build + test). **`index.html` immer mit committen**, die CI vergleicht sie mit dem Quellstand.

## Architektur in Kürze

- `src/modules/shoulder/anatomy.js`: Landmarken in knochenlokalen Koordinaten (`L(frame,x,y,z)`), Strukturen als Faszikel (`fas`), Schichtgruppen (`LAYER_GROUPS`), Infotexte (`INFO`).
- `src/modules/shoulder/kinematics.js`: `pose {P,E,IR,elbow,pro}` (humerothorakal) → Knochenrahmen (`solvePose`, skapulothorakaler Rhythmus landmarkengetrieben), Bewegungsgrenzen (`Emax`, `rotLimits`, `clampPose`), Referenzlängen (`computeReferenceLengths`), Auswertung (`evaluate`: Dehnung je Faszikel, Kapselregionen, Abstände, Kraftverteilung ∝ PCSA·Hebelarm, Gelenkreaktionskraft).
- `src/engine/render.js`: Szene, Röhren, Sichtbarkeit/Transparenz, Kameras, Detail-Dock mit Schichtstufen (`PEEL`).
- `src/engine/ui.js`: Regler, Presets (`PRESETS`, `ANIMS`, `PHYSIO`), Monitor (`METRICS`, Gruppen), belastete Strukturen (`LOAD_GROUPS`), Maus/Touch, Mobil-Sheets, Sprache.
- `src/engine/share.js`: `currentState()` → lesbare Query oder kompakter Hash-Token; `applyURLState()` beim Laden.
- Bauteile und Reihenfolge stehen in `src/modules/<modul>/module.json`; `build.mjs` konkateniert sie in eine IIFE.

## Regeln, die man leicht bricht

1. **Koordinaten**: Modell in cm, +X lateral rechts, +Y kranial, +Z ventral – linkshändig. `ROOT.scale.x = -1` spiegelt für die Darstellung; alles, was Bildschirm und Modell verbindet (Picking, Kameras, Beschriftungen, Clip-Ebenen), geht durch `toR()`.
2. **Index-Listen nur anhängen**: `allIds()` (Schichten), `PRESETS`+`ANIMS`+`PHYSIO` (= `RUN_LIST`), `LAYER_GROUPS`, `LOAD_GROUPS` stecken als Basis-36-Index in Kurz-Links. Neue Einträge ans Ende, nie umsortieren oder löschen.
3. **Kurz-Link-Token** (`compactEncode`): nur `[A-Za-z0-9._:~-]`, höchstens 120 Zeichen, Felder mit `_` getrennt, Kennbuchstabe + Wert. Großbuchstaben sind vergeben; neue Felder bekommen Kleinbuchstaben und gehören meist zu `OPTIONAL_KEYS`.
4. **Referenzlängen**: Muskeln relativ zur Neutralstellung; Bänder/Kapsel als normierte Spannung 0 … 12 % zwischen 85 % und 100 % ihrer Maximallänge im Bewegungsraum, mit anatomischen Ankern (`taut`, `endAt`). Wer in `computeReferenceLengths` eine Pose löst, muss am Ende **die Ruhestellung wieder herstellen**, bevor `REF.lbsDefl` gesetzt wird.
5. **`EVAL.metrics` ist ein wiederverwendetes Objekt** – für Vergleiche zwischen Posen kopieren (`Object.assign({}, EVAL.metrics)`).
6. **Sprache**: Deutsch im Markup und in den Datenstrukturen; Englisch ausschließlich in `i18n.js` (`data-i18n`, `STRUCT_EN`, `PRESET_EN`, `LOAD_EN`, `METRIC_EN`, `INFO_EN`, `LAYER_EN`). Zahlenformat über `fmt()` (Locale folgt der Sprache).
7. **Mobil (≤ 980 px)**: Bedienfelder sind Bottom-Sheets, das Detail-Dock verschwindet bei offenem Sheet, das HUD startet eingeklappt. Jede UI-Änderung auch bei 390 px prüfen (`npm run shots`).
8. **Feste Reihenfolge, nichts springt**: Monitor und Strukturliste sortieren nie dynamisch; Ein-/Ausblenden mit Hysterese (`updateLoads`).
9. Kein `//`-Kommentar am Zeilenende in Code, der per Skript ersetzt wird – `/* */` verwenden.

## Kalibrierung (Literaturwerte, siehe Tests)

Ruhe AHD ≈ 9,9 mm · 90° Abduktion ≈ 3–4 mm · Wurfposition: posterosuperiorer Kontakt ≈ 2 mm, vordere/untere Kapsel endgradig · Hawkins/Sleeper: Kontaktfenster 20–55° IR, Minimum ≈ 2 mm · Gelenkkraft ≈ 330 N (90° Abduktion, keine Last), ≈ 900 N (3 kg). Änderungen an Anatomie oder Kinematik immer gegen `npm test` prüfen und die Anker bei Bedarf bewusst nachziehen.

## Fahrplan

Engine/Modul-Schnittstelle → Bein-Modul (Hüfte–Knie–Sprunggelenk) → Rumpf-Modul (LWS–Becken–Hüfte) → HWS als Erweiterung der Schulter. Module nach kinetischen Ketten schneiden, nicht nach Einzelgelenken.

## Veröffentlichen

- GitHub Pages: `git push` auf `main` genügt (Root-Ausspielung). Live: https://joergs-git.github.io/anatomy-lab/
- claude.ai-Spiegel: `dist/artifact.html` als Artefakt neu veröffentlichen (nur aus der ursprünglichen Cowork-Sitzung möglich); dort gilt die Kurz-Link-Form.

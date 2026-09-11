# CLAUDE.md – Arbeitsregeln für dieses Repo

Interaktive biomechanische Lehrmodelle als eine HTML-Datei (three.js r128, kein Build-Framework, kein Backend). Module: Schulterlabor (rechte Schulter, engstellendominiert) und Beinlabor (Hüfte–Knie–Sprunggelenk, lastdominiert mit Bodenkontakt). Ausgeliefert über GitHub Pages aus dem Root von `main` (`index.html`).

## Zuerst lesen

- `docs/HANDOVER.md` – Stand, Methodik, Kalibrierung, Vereinfachungen, Entscheidungen, Backlog, Blaupause Bein-Modul, Zielbild der Engine-Schnittstelle
- `docs/LESSONS.md` – Fallen mit Symptom → Ursache → Regel; neue Erkenntnisse dort anhängen, nicht hier

## Befehle

- `npm run build` – baut alle Module aus `src/modules/registry.json` in `index.html` (Pages), `dist/artifact.html` (claude.ai-Viewer, ohne Dokumentgerüst), `dist/test.html` (lokal, three.js aus node_modules); `node build.mjs --registry <json> --out <dir>` für Testbuilds
- `npm test` – Modell-Invarianten Schulter (`tests/model.test.mjs`) und Bein (`tests/leg.test.mjs`) sowie Registry/Build (`tests/registry.test.mjs`), ohne Browser
- `npm run shots` – Screenshots Desktop/iPhone + Link-Roundtrip in Chromium (braucht `npm i -D playwright && npx playwright install chromium`)
- Vor jedem Commit: `npm run check` (= build + test). **`index.html` immer mit committen**, die CI vergleicht sie mit dem Quellstand.

## Architektur in Kürze

- `src/modules/shoulder/anatomy.js`: Landmarken in knochenlokalen Koordinaten (`L(frame,x,y,z)`), Strukturen als Faszikel (`fas`), Schichtgruppen (`LAYER_GROUPS`), Infotexte (`INFO`).
- `src/modules/shoulder/kinematics.js`: `pose {P,E,IR,elbow,pro}` (humerothorakal) → Knochenrahmen (`solvePose`, skapulothorakaler Rhythmus landmarkengetrieben), Bewegungsgrenzen (`Emax`, `rotLimits`, `clampPose`), Referenzlängen (`computeReferenceLengths`), Auswertung (`evaluate`: Dehnung je Faszikel, Kapselregionen, Abstände, Kraftverteilung ∝ PCSA·Hebelarm, Gelenkreaktionskraft).
- `src/modules/shoulder/presets.js`: `PRESETS`, `ANIMS`, `PHYSIO` (klinische Positionen, Abläufe, Übungen mit Lasten).
- `src/modules/shoulder/bones.js`: `buildBones(ctx)` – Knochengeometrie je Rahmen, Labrum, Bursa; `ctx` liefert `render.js` (`G`, `MAT`, `addBone`, …).
- `src/modules/shoulder/views.js`: `ORBIT0`, `VIEWS`, `detailDefs` (vier Detailfenster mit `fit` und `readout`), `PEEL` (Schichtstufen).
- `src/modules/shoulder/monitor.js`: `METRICS`, `MONITOR` (Top/Spezial/Kapsel-Sammelzeile), `LOAD_GROUPS`, `computeLoads`, `structReadouts`, `BONE_NAME_KEYS`, `LAYER_PRESETS`.
- `src/modules/shoulder/hud.js`: `planeLabel`, HUD-, Pose- und Skapula-Texte, `READOUT0`.
- `src/modules/shoulder/interaction.js`: `LABELS` (3D-Beschriftungen), `DRAG` (greifbare Teile, Rotationsachsen, Griffpunkt → Pose).
- `src/modules/shoulder/i18n.js`: modulspezifische Texte (`I18N_MOD`) und die englischen Namen (`STRUCT_EN`, `PRESET_EN`, `METRIC_EN`, `INFO_EN`, …).
- `src/modules/shoulder/module.js`: **die Schnittstelle** – `POSE_PARAMS`/`PATHO_PARAMS` (Regler, Link-Schlüssel, Kurz-Link-Buchstaben, Wertetexte, dynamische Grenzen) und das `MODULE`-Objekt, das die Fabrik zurückgibt.
- `src/modules/leg/`: gleicher Aufbau wie `shoulder/`. Rahmen B Becken, U Rumpf (Kontext), F Femur, P Patella, T Tibia+Fibula, A Talus, C Fuß, F2…C2 gespiegeltes anderes Bein. `kinematics.js`: Pose `{hipF,hipA,hipR,knee,tibR,valg,ankle,sub,wt,ground}`; bei Bodenkontakt steht der Fuß am festen Bodenpunkt, der Rumpf neigt sich für das Gleichgewicht (`hipF` = Oberschenkel zur Senkrechten, klinische Hüftbeugung = `hipF` + Neigung); Gelenkmomente aus Bodenreaktion/Segmentgewichten, Kraftverteilung je Gelent ∝ PCSA·Hebel (Quadrizeps am Knie über die Patellarsehne), PF-Kraft als Vektorsumme, TF-Kompression, VKB/HKB aus dem Schub entlang der Tibia, Achilles-/Hüftkraft, Tractus-Lage, Sprunggelenk-Impingements. `EXT.at` (`foot`/`body`) und `EXT.fixHip` für Lasten.
- `src/modules/registry.json`: registrierte Module in Link-Reihenfolge (Index im Kurz-Link, nur anhängen). `build.mjs` legt alle in eine Datei: Engine-Kopf → `REGISTRY` + `MODULES[id]=function(){…; return MODULE;}` → `engine/boot.js` → Engine-Rest.
- `src/engine/boot.js`: wählt das Modul (`m=<id>` / `x<Index>`), ruft die Fabrik, mischt `MOD.i18n` in `I18N`, löst `MOD` in die festen Engine-Namen auf und erzeugt das modulabhängige Markup (Pose-/Pathologie-Regler, Kopplungs-Block, Schicht-Schnellwahl, Detail-Dock, Umschalter `#moduleSeg`, Fußzeile).
- `src/engine/render.js`: Szene, Röhren, Flächen-Strukturen (`s.surface`), Sichtbarkeit über `material.userData` (`fixed`, `noPick`, `baseOpacity`), Zonen → Kompression über `MOD.render.zones`, `MOD.render.afterPose`, Kameras, Detail-Dock.
- `src/engine/ui.js`: Regler, Chips, Schichten, Monitor-Aufbau, Strukturliste, Maus/Touch, Mobil-Sheets, Sprache – generische Mechanik über die Modul-Tabellen; Testschnittstelle `window.AnatomyLab` (+ Alias aus `module.json`, z. B. `Schulterlabor`).
- `src/engine/share.js`: `currentState()` → lesbare Query oder kompakter Hash-Token (Pose/Patho-Felder aus den Parametern, Modul als `m`/`x`); `applyURLState()` beim Laden; `switchModule(id)` lädt die Seite mit dem Modul-Feld neu.
- Noch in der Engine mit Schulterbezug (siehe `docs/HANDOVER.md` §9): Startpose-Regler heißen generisch, aber `page.html` trägt die restlichen Blöcke (Presets-Überschriften, Legende) fest; der Umschalter wird auf dem Handy noch nicht gesondert gelegt.

## Regeln, die man leicht bricht

1. **Koordinaten**: Modell in cm, +X lateral rechts, +Y kranial, +Z ventral – linkshändig. `ROOT.scale.x = -1` spiegelt für die Darstellung; alles, was Bildschirm und Modell verbindet (Picking, Kameras, Beschriftungen, Clip-Ebenen), geht durch `toR()`.
2. **Index-Listen nur anhängen**: `registry.json` (Module), `allIds()` (Schichten), `PRESETS`+`ANIMS`+`PHYSIO` (= `RUN_LIST`), `LAYER_GROUPS`, `LOAD_GROUPS` stecken als Basis-36-Index in Kurz-Links. Neue Einträge ans Ende, nie umsortieren oder löschen.
3. **Kurz-Link-Token** (`compactEncode`): nur `[A-Za-z0-9._:~-]`, höchstens 120 Zeichen, Felder mit `_` getrennt, Kennbuchstabe + Wert. Engine-Buchstaben: `N A W S Q H V O L C I X T U D K Y J m k g x` (`x` = Modul). Pose-/Pathologie-Parameter bekommen ihre Buchstaben im Modul (`code` in `POSE_PARAMS`/`PATHO_PARAMS`; Schulter: `E P R B F` und `M G Z`) und dürfen mit keinem Engine-Buchstaben kollidieren (Warnung in der Konsole). Neue Engine-Felder bekommen Kleinbuchstaben und gehören meist zu `OPTIONAL_KEYS`.
4. **Referenzlängen**: Muskeln relativ zur Neutralstellung; Bänder/Kapsel als normierte Spannung 0 … 12 % zwischen 85 % und 100 % ihrer Maximallänge im Bewegungsraum, mit anatomischen Ankern (`taut`, `endAt`). Wer in `computeReferenceLengths` eine Pose löst, muss am Ende **die Ruhestellung wieder herstellen**, bevor `REF.lbsDefl` gesetzt wird.
5. **`EVAL.metrics` ist ein wiederverwendetes Objekt** – für Vergleiche zwischen Posen kopieren (`Object.assign({}, EVAL.metrics)`).
6. **Sprache**: Deutsch im Markup und in den Datenstrukturen; Englisch ausschließlich in den Wörterbüchern: `engine/i18n.js` für Engine-Texte, `modules/<modul>/i18n.js` für Modul-Texte (`I18N_MOD`, `STRUCT_EN`, `PRESET_EN`, `LOAD_EN`, `METRIC_EN`, `INFO_EN`, `LAYER_EN`). Gleiche Schlüssel: das Modul gewinnt. Zahlenformat über `fmt()` (Locale folgt der Sprache).
7. **Mobil (≤ 980 px)**: Bedienfelder sind Bottom-Sheets, das Detail-Dock verschwindet bei offenem Sheet, das HUD startet eingeklappt. Jede UI-Änderung auch bei 390 px prüfen (`npm run shots`).
8. **Feste Reihenfolge, nichts springt**: Monitor und Strukturliste sortieren nie dynamisch; Ein-/Ausblenden mit Hysterese (`updateLoads`).
9. Kein `//`-Kommentar am Zeilenende in Code, der per Skript ersetzt wird – `/* */` verwenden.
10. **Modul-Auswertung nutzt die gelöste Pose**: `evaluate(fr)` darf nicht das globale `pose` lesen (Harness und Referenzberechnung lösen Kopien) – das Modul merkt sich die zuletzt gelöste Pose (`LAST.pose` im Bein). Pose-Parameter mit Standardwert ≠ 0 (`wt`, `ground`) brauchen `def` im Parameter, sonst landen sie in jedem Link.
11. **Detailfenster im Headless-Test**: SwiftShader (Playwright ohne GPU) kopiert die Detailfenster nach dem ersten Frame eines Link-Zustands schwarz, bis sich die Pose ändert; auf echten GPUs nicht. `preserveDrawingBuffer` bleibt gesetzt, Screenshot-Skripte setzen vor Detailfenster-Aufnahmen eine Pose (LESSONS 31).

## Kalibrierung (Literaturwerte, siehe Tests)

Schulter: Ruhe AHD ≈ 9,9 mm · 90° Abduktion ≈ 3–4 mm · Wurfposition: posterosuperiorer Kontakt ≈ 2 mm, vordere/untere Kapsel endgradig · Hawkins/Sleeper: Kontaktfenster 20–55° IR, Minimum ≈ 2 mm · Gelenkkraft ≈ 330 N (90° Abduktion, keine Last), ≈ 900 N (3 kg).
Bein (75 kg, `BW` = 735 N): Stand PF ≈ 0, TF ≈ 0,9 × KG · Kniebeuge parallel PF 2,5–4,5 × KG, Rumpf 30–60° · tief (140°) PF 4–7,5 × KG, Druck 4–10 MPa, Hinterhörner komprimiert · Treppe einbeinig PF 2,5–4,5, Hüfte 2–6 × KG · Beinstrecker: VKB nahe Streckung > 150 N und > 3 × Wert bei 60°, jenseits 90° null · Tractus-Reibzone 10–35° · vorderes Sprunggelenk-Impingement < 3 mm bei 35° Dorsalextension, hinteres < 3 mm bei −45° · ATFL beim Supinationstrauma ≥ +8 % · Wadenheben Achilles 1–4 × KG. Änderungen an Anatomie oder Kinematik immer gegen `npm test` prüfen und die Anker bei Bedarf bewusst nachziehen.

## Fahrplan

Engine/Modul-Schnittstelle (Registry, Umschalter, `MODULE`-Objekt: **fertig, v0.10**) → Bein-Modul (Hüfte–Knie–Sprunggelenk: **erste Fassung, v0.11**; Verfeinerung siehe HANDOVER §8) → Rumpf-Modul (LWS–Becken–Hüfte) → HWS als Erweiterung der Schulter. Module nach kinetischen Ketten schneiden, nicht nach Einzelgelenken. Ein neues Modul: Ordner unter `src/modules/<id>/` mit `module.json` (Bauteile, Name, Alias), letzte Datei liefert `MODULE` nach dem Muster von `shoulder/module.js`, dann die ID an `registry.json` **anhängen**; der Umschalter erscheint automatisch.

## Arbeitsweise

- Kleine, benannte Commits; fachliche Änderungen (Anatomie, Kinematik, Kalibrierung) getrennt von Oberflächenänderungen.
- Jede Modelländerung: Zahlen vorher/nachher an den Ankern aus `tests/model.test.mjs` prüfen und im Commit nennen; Anker nur bewusst verschieben.
- Neue Erkenntnisse und Fehlschläge in `docs/LESSONS.md`, größere Entscheidungen in `docs/HANDOVER.md` (Abschnitt 6) nachtragen.
- Versionsnummer in `package.json` erhöhen, wenn eine Veröffentlichung ansteht (erscheint in der Fußzeile der Seite).

## Veröffentlichen

- GitHub Pages: `git push` auf `main` genügt (Root-Ausspielung). Live: https://joergs-git.github.io/anatomy-lab/
- claude.ai-Spiegel: `dist/artifact.html` als Artefakt neu veröffentlichen (nur aus der ursprünglichen Cowork-Sitzung möglich); dort gilt die Kurz-Link-Form. Der Modulwechsel lädt die Seite mit neuem Hash neu (`switchModule`).

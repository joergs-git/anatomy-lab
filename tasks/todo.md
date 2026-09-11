# Aufgaben

## Schritt 3: Bein-Modul (Hüfte–Knie–Sprunggelenk), Branch `feature/leg-module`

Blaupause: docs/HANDOVER.md §8. Lastdominiert statt engstellendominiert; Bodenkontakt als Analogon zum skapulothorakalen Rhythmus (Becken/Rumpf so, dass der Körperschwerpunkt über dem Fuß bleibt).

- [x] Engine-Reste: `'bursa'` in der Strukturliste (ui.js) entfernen, `DRAG.pose` bekommt den Griff-Rahmen, Umschalter auf dem Handy prüfen
- [x] `modules/leg/anatomy.js`: Rahmen B (Becken+Rumpf), F (Femur), T (Tibia+Fibula), P (Patella), A (Talus), C (Calcaneus/Fuß); Landmarken; Strukturen (Quadrizeps, Patellarsehne, Hamstrings, Pes anserinus, Tractus, Glutaeen, Iliopsoas, Gastrocnemius, Soleus/Achilles, Tibialis ant./post., Peronei; VKB AM/PL, HKB, MCL, LCL, ATFL, CFL, PTFL, Deltoidband, Plantarfaszie; Menisken als Fläche), Schichtgruppen, Infotexte
- [x] `modules/leg/kinematics.js`: Pose {hipF, hipA, hipR, knee, tibR, valg, ankle, sub, ground}; screw-home; Patella-Gleiten; Bodenkontakt + Rumpfausgleich; Referenzlängen mit Ankern; Auswertung: Gelenkmomente (Hüfte, Knie, Sprunggelenk) aus Bodenreaktion/Schwerkraft, Kraftverteilung ∝ PCSA·Hebel je Gelenk, PF-Kraft, TF-Kompression, Patellarsehnen-, Achillessehnenkraft, VKB-Last (Schub der Patellarsehne), Engstellen (vorderes/hinteres Sprunggelenk-Impingement, Tractus ↔ Epikondylus, Hinterhorn-Kompression)
- [x] `presets.js`, `bones.js`, `views.js`, `monitor.js`, `hud.js`, `interaction.js`, `i18n.js`, `module.js`, `module.json`
- [x] `tests/leg.test.mjs`: Kalibrierungsanker (PF ≈ 0,5 / 3,3 / 7 × KG; TF 2–3 / 5–7 × KG; VKB max nahe Streckung mit Quadrizepslast, locker in tiefer Beugung; HKB in tiefer Beugung; Tractus-Reibzone 20–30°; ATFL bei Plantarflexion+Inversion; Achilles 2,5–4 × KG Wadenheben), keine NaN im Bewegungsraum, Presets im Bewegungsraum
- [x] Registry: `leg` anhängen; Build, Tests, Browser (Umschalter, beide Module, Screenshots Desktop/iPhone), Schulter-A/B unverändert
- [x] Doku: HANDOVER (§8 → Stand), README, CLAUDE.md (Kalibrierung Bein), LESSONS; Version 0.11.0; Merge nach `main`, Push

## Results

- Beinmodul v0.11.0: 26 Strukturen (Hüfte, Quadrizeps, Hamstrings, Pes anserinus, Wade, Unterschenkel, Kreuz-/Seitenbänder, Patellarsehne, Menisken, Sprunggelenkbänder, Plantarfaszie, N. peroneus), 7 Rahmen + gespiegeltes Kontextbein, Bodenkontakt mit Gleichgewicht, Gelenkmomente und statische Kraftverteilung, 19 Monitorzeilen, 15 Positionen, 4 Abläufe, 10 Übungen, 4 Detailfenster, Deutsch/Englisch.
- 26 Tests grün (11 Schulter, 12 Bein-Anker, 3 Registry/Build); `npm run shots` ohne Skriptfehler; Bein-Screenshots Desktop/iPhone und Link-Roundtrip (`x1_…`) OK.
- Schulter-A/B gegen v0.9.1: Pixel identisch bis auf die Kopfzeile (Umschalter jetzt sichtbar), Texte/Metriken/Zustand identisch, Interaktion identisch.
- Engine-Erweiterungen fürs Bein: generisches `setLoad`, Checkbox-Parameter, Clip-Ebene und Griff-Rahmen aus dem Modul, Standardwerte im Link, `preserveDrawingBuffer`, Handy-Umschalter als Auswahlkasten; Harness lädt jedes Modul über `module.json`.
- Offen: siehe HANDOVER §8 „Stand Bein-Modul“ (Vorfuß/Zehen, Dynamik, Kniekapsel, Hüftimpingement, freies zweites Bein).

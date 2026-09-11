# Übergabe an Claude Code – Stand 11. September 2026

Dieses Dokument hält fest, was in der ursprünglichen Cowork-Sitzung entstanden ist, warum es so gebaut wurde und was als Nächstes ansteht. Es ergänzt `CLAUDE.md` (kurze Arbeitsregeln) und `docs/LESSONS.md` (Fallen, in die wir schon getreten sind). Wer neu ins Projekt kommt, liest zuerst dieses Dokument.

## 1. Stand

- **Version 0.9.0** im Repo entspricht **Version 10** des claude.ai-Artefakts (`https://claude.ai/code/artifact/2cc1f47c-4a88-4fc4-b328-7706d1a9f7ca`). Beide werden aus denselben Quellen gebaut (`index.html` bzw. `dist/artifact.html`).
- Live über GitHub Pages: `https://joergs-git.github.io/anatomy-lab/` (Root von `main`).
- Entwicklungsgeschichte in einem Tag (10./11. September 2026) aus einer Cowork-Sitzung: v1 Grundmodell → v2 Detail-Dock, Schichtstufen, Physio-Presets mit Lasten → v3 Endlosschleife, Beschriftungen unter den Detailfenstern, feste Listen → v4 Mobil-Sheets, HUD verschieb- und einklappbar → v5/v6 Deutsch/Englisch, Zustand in URL-Parametern → v7 kompakter Hash-Token für den claude.ai-Viewer → v8 Presets „Sleeper modifiziert“ und „Cross-Body-Dehnung“ → v9 Monitor und Strukturliste nach klinischer Relevanz, Kapsel-Sammelzeile, Akkordeons; Verankerung der vorderen Kapsel in der Wurfposition → v10 Korrektur der Bizepssehnen-Referenz, Node-Build, Tests, CI.

## 2. Was das Schulterlabor kann

Rechte Schulter mit Thorax, Klavikula, Skapula, Humerus, Unterarm und Hand; Rotatorenmanschette (4), Deltoideus (3 Anteile), Bizeps (2 Köpfe, lange Bizepssehne mit Sulcus-Umlenkung), Coracobrachialis, Trizeps langer Kopf, Pectoralis major/minor, Trapezius (3), Rhomboiden, Levator, Serratus, Latissimus, Teres major; Bänder (CAL, CHL, GHL-Komplex, AC-/CC-Bänder), Kapsel als 24-Faser-Fläche, Labrum, Bursa, N. axillaris, N. suprascapularis. Pose humerothorakal (Ebene, Elevation, Rotation, Ellbogen, Pro-/Supination), skapulothorakaler Rhythmus automatisch. Dehnungsfarben, Engstellen-Monitor (subakromial, Kapsel mit vier Regionen, lange Bizepssehne, Gelenkkraft; eingeklappt: posterosuperiorer Pfannenrand, subkorakoidal, N. axillaris), belastete Strukturen in sieben Gruppen, vier Detailansichten mit Schichtstufen, Struktur-Infotexte, 14 klinische Positionen, 4 Bewegungsabläufe, 16 Übungen mit Lasten, 3 Pathologieregler, Deutsch/Englisch, Links mit vollständigem Zustand, Maus und Touch, Bottom-Sheets auf dem iPhone.

## 3. Methodik (gilt für alle künftigen Module)

1. **Rahmenkette.** Jeder Knochen ist ein Rahmen (Position + Quaternion). Die Pose (wenige klinische Parameter) wird über Gelenkregeln in Rahmen aufgelöst (`solvePose`). Beim Schultermodell ist die Skapula nicht direkt gesteuert, sondern gleitet landmarkengetrieben auf dem Thorax (unterer und oberer Winkel auf dem Thorax-Loft, AC-Gelenk an der Klavikula, Dreieck-Rotation `triRotation`).
2. **Landmarken knochenlokal** (`L(frame, x, y, z, opt)`), Weltpunkte über `worldPt(frames, lm)`. Modellkoordinaten in cm, linkshändig (+X lateral rechts, +Y kranial, +Z ventral); die Darstellung spiegelt über `ROOT.scale.x = −1`.
3. **Strukturen als Faszikel**: Folge von Landmarken mit Bauch-/Sehnengewicht (`w`) und Zonen-Markern (`z` für Engstellen-Zonen); Wrapping um Kugeln (Humeruskopf) nach Garner & Pandy (`wrapSphere`/`wrapPath`); Röhrengeometrie mit fester Vertexzahl (`Tube`), Radius nach Sinusprofil.
4. **Referenzlängen**: Muskeln relativ zur Neutralstellung (Dehnung = ΔL/L₀). Bänder/Kapsel als normierte Spannung: 0 % beim Beginn des Tragens (85 % der Maximallänge im abgetasteten Bewegungsraum), 12 % bei Maximallänge; anatomische Anker korrigieren Ausreißer (`taut` für in Ruhe tragende Fasern, `endAt` für die antero-inferiore Kapsel in der Wurfposition).
5. **Engstellen als Abstände** zwischen Punktmengen (Akromion-Unterfläche + Lig. coracoacromiale ↔ Humeruskopf/Tub. majus; Coracoid ↔ Tub. minus; posterosuperiorer Pfannenrand ↔ Manschettenansatz) mit Schwellen für Kontakt/Enge; daraus Kompressionsgrade, die Faszikelzonen violett färben und in die Strukturliste gehen.
6. **Kraftverteilung**: Schwerkraftmoment des Arms (+ äußere Last an der Hand) wird statisch auf Muskeln verteilt, proportional zu PCSA × Hebelarm, nur Muskeln mit ausreichend ausgerichtetem Hebel (Schwelle 0,45); bei abgestütztem Ellbogen (`axialOnly`) nur das Moment um die Humeruslängsachse und nur Rotatoren. Gelenkreaktionskraft = Muskelzug + Armgewicht + Last. Grobe Schätzung, keine Optimierung.
7. **Pathologie** als Parameter der Referenzlängen und Bewegungsgrenzen (Kopfhochstand verschiebt den Kopf, GIRD verkürzt die hintere Kapsel, Frozen Shoulder alle Kapselanteile).
8. **Oberfläche**: Regler + Presets links, Monitor rechts, Detail-Dock im 3D-Fenster (Rendern per Scissor, dann Kopie in 2D-Canvas, weil Panels deckend sind), Zustand vollständig serialisierbar.

## 4. Kalibrierung – Modell gegen Literatur

| Größe | Modell | Literaturanker |
|---|---|---|
| Subakromialer Abstand, Ruhe | 9,9 mm | 9–10 mm (Röntgen/MRT, Erwachsene) |
| … 90° Abduktion frontal | 3,8 mm | 3–4 mm |
| … Skapulaebene 90° | 3,8 mm | 3,3–4,4 mm |
| … Hawkins/Sleeper (90° Flexion) | Minimum 2,1 mm bei 36° IR; Kontaktfenster < 5 mm zwischen 4° und 56° IR | Kontakt Tub. majus ↔ Dach/CAL im Hawkins-Test |
| Posterosuperiorer Kontakt, Wurfposition | 2,0 mm | internes Impingement bei Abduktion + max. Außenrotation |
| Vordere/untere Kapsel, Wurfposition | +12 % (endgradig), GHL +11 % | IGHL vorderes Band ist der Hauptstabilisator in ABER |
| Gelenkkraft 90° Abduktion, ohne Last | 333 N | ≈ 0,4–0,5 × Körpergewicht (≈ 350 N) |
| Gelenkkraft Seitheben 3 kg bei 90° | 906 N | ≈ 800–1000 N |
| Skapula-Aufwärtsrotation bei 90° / 170° | 15° / 27° | ≈ 2:1-Rhythmus, 30–45° bei voller Elevation |
| Schürzengriff | Supraspinatus +19 %, Infraspinatus +26 %, subakromial frei | funktionell typisch eingeschränkt nach Bursitis |

Alle Anker sind in `tests/model.test.mjs` mit Toleranzen hinterlegt.

## 5. Bekannte Vereinfachungen (ehrlich)

- Deltoideus als zwei gerade Faszikel pro Anteil mit Kugel-Wrapping um den Kopf: der hintere Deltoideus wird bei horizontaler Adduktion (Cross-Body) im Modell *nicht* gedehnt (real: ja). Für Aussagen zum Deltoideus nicht belastbar.
- Umlenkung der langen Bizepssehne: in Flexion/Adduktion vor dem Körper werden Zusatzknicke von 80–110° gemeldet; real gleitet die Sehne, die Werte sind überzeichnet. Als Tendenzanzeige brauchbar, als Zahl nicht.
- Kein Körpergewicht auf der Schulter, keine Skapula-Fixierung durch die Unterlage (Sleeper Stretch): nur über den Regler „Kopfhochstand“ näherungsweise darstellbar.
- Skapula-Rhythmus deterministisch (keine Muskelaktivität), Klavikula folgt festen Regeln; keine Thorax-Verformung.
- Kraftverteilung statisch, keine Kokontraktion, keine Antagonisten; Gelenkkraft ohne Kapsel-/Bandkräfte.
- Bewegungsgrenzen sind glatte Funktionen (`Emax`, `rotLimits`), keine Kollisionsberechnung; Ecken des Bewegungsraums (Hyperextension + Außenrotation) sind großzügig.
- Nur rechte Schulter, ein Erwachsener, keine Anthropometrie-Skalierung.

## 6. Entscheidungen und ihre Gründe

- **Eine Datei, kein Framework, kein Backend**: läuft aus dem Dateisystem, im Artefakt-Viewer und auf Pages ohne Infrastruktur; Konkatenation per `build.mjs` statt Bundler.
- **Feste Reihenfolgen, nichts springt** (Monitor, Strukturliste): dynamisches Umsortieren wurde als irritierend erlebt; Ein-/Ausblenden mit Hysterese.
- **Relevanz vor Vollständigkeit**: häufige Problemzonen oben, Spezialfälle eingeklappt mit Status-Badge, damit nichts verloren geht.
- **Zustand in der URL, nur Abweichungen vom Standard**: lesbar (`?E=90&rot=40`) für Pages/Datei; kompakter Hash-Token für den claude.ai-Viewer, weil der nur `#[A-Za-z0-9._:~-]{1,128}` an den iframe durchreicht (im Viewer-Bundle: `vr=/^#[A-Za-z0-9._:~-]{1,128}$/`). Daraus folgt: Index-Listen nur anhängen.
- **Deutsch als Quellsprache, Englisch als Wörterbuch**: kein Übersetzungssystem, ein `t(key)` plus Tabellen; Zahlenformat folgt der Sprache.
- **Gemeinsame App mit Modul-Umschalter statt getrennter Labs**; Module nach kinetischen Ketten (Schulter/HWS, Bein, Rumpf), weil Nachbargelenke gekoppelt sind.
- **GitHub Pages aus dem Root**: gebaute `index.html` wird committet, die CI erzwingt, dass sie zum Quellstand passt. Damit entfallen Pinning und Zeichengrenzen des Artefakt-Viewers.
- **Lizenz** bewusst offen gelassen – Entscheidung des Eigentümers.

## 7. Backlog (nicht begonnen)

- Modul-Umschalter in der Kopfzeile, Modul-Feld im Link (lesbar `m=leg`, kompakt Kleinbuchstabe + Index), Presets/Schichten je Modul.
- „Fokus“-Profile für den Monitor (Impingement / Wurfsport / Frozen Shoulder) als umsortierte Top-Gruppe.
- Weitere Metriken: N. suprascapularis (spinoglenoidal), AC-Gelenk-Kompression bei Adduktion.
- Linke Schulter per Spiegelung (Darstellung + Beschriftung), Anthropometrie-Skalierung.
- Kontrakt-Relax-Hinweise in Übungen (isometrische Phase), Wiederholungs-/Haltezeit-Anzeige.
- Bessere Deltoideus-Pfade (Via-Punkte am Schaft), realistischeres Gleiten der Bizepssehne.
- Export der Monitorwerte als CSV (Downloads-Fähigkeit im Artefakt oder Blob-Link auf Pages).

## 8. Nächster Schritt: Bein-Modul (Hüfte–Knie–Sprunggelenk)

Ziel: dieselbe Methodik, aber lastdominiert statt engstellendominiert. Das Modul soll die Engine/Modul-Trennung erzwingen (Abschnitt 9).

**Pose-Parameter (rechtes Bein, Fuß am Boden oder frei):** Hüftflexion (−20…120°), Hüftabduktion (−30…45°), Hüftrotation (±45°), Knieflexion (0…140°), Tibiarotation (±20°, in Streckung automatisch „screw-home“ ≈ 5–10° Außenrotation), Valgus/Varus (±15°, lastabhängig), Sprunggelenk Dorsal-/Plantarflexion (−45…+20°), Subtalar Inversion/Eversion (−15…+30°), Bodenkontakt ja/nein. Bei Bodenkontakt wird das Becken so gesetzt, dass der Körperschwerpunkt über dem Fuß bleibt (Rumpfneigung abgeleitet) – das Analogon zum skapulothorakalen Rhythmus.

**Rahmen:** Becken, Femur, Tibia (+ Fibula), Patella (eigener Rahmen: gleitet in der Trochlea, Eingriff ab ≈ 20° Flexion), Talus, Calcaneus/Fuß, Vorfuß.

**Strukturen:** Quadrizeps (Rectus femoris zweigelenkig, Vasti), Patellarsehne, Quadrizepssehne, Hamstrings (Bizeps femoris, Semimembranosus, Semitendinosus), Pes anserinus (Sartorius, Gracilis, Semitendinosus), Tractus iliotibialis (mit Übergang über den lateralen Epikondylus bei ≈ 30° Flexion), Gastrocnemius (zweigelenkig), Soleus, Achillessehne, Tibialis anterior/posterior, Peronei, Popliteus, Iliopsoas, Glutaeus max./med.; Bänder: VKB (AM- und PL-Bündel), HKB, MCL (oberflächlich/tief), LCL, Retinacula, Lig. patellae; Sprunggelenk: ATFL, CFL, PTFL, Deltoidband, Syndesmose; Menisken (medial/lateral, Hinterhörner), Hoffa-Fettkörper, Plantarfaszie.

**Engstellen/Lasten (Monitor, häufigste zuerst):** patellofemorale Gelenkkraft und -druck (Anker: ≈ 0,5 × KG Gehen, ≈ 3,3 × KG Treppe, ≈ 7 × KG tiefe Kniebeuge; Kontaktfläche 2–6 cm²), tibiofemorale Kompression (≈ 2–3 × KG Gehen, 5–7 × KG Kniebeuge), VKB-Dehnung (Maximum nahe Streckung mit Quadrizepslast, ≈ 4 % bei 0–30°; Valgus + Innenrotation als Verletzungsmechanismus), HKB-Last in tiefer Flexion, Tractus ↔ lateraler Epikondylus (Reibzone 20–30°), Hinterhorn-Kompression der Menisken > 120°, Hoffa-Impingement bei Hyperextension, Patellarsehnenkraft (Jumper's Knee, ≈ 6–8 × KG beim Springen); Sprunggelenk: vorderes Impingement bei Dorsalextension, hinteres (Os trigonum) bei Plantarflexion, ATFL bei Plantarflexion + Inversion (Supinationstrauma), CFL bei Dorsalextension + Inversion, Achillessehnenkraft (≈ 3–4 × KG Gehen, 6–8 × KG Laufen), Plantarfaszie (Windlass).

**Presets:** Kniebeuge parallel/tief (Langhantel als Last), Ausfallschritt, Treppe auf/ab, Landung nach Sprung, Cutting/Pivot (Valgus + Innenrotation), Wadenheben, Sprint-Abdruck, Fersensitz, Hocke, Supinationstrauma, Spitzentanz; Bewegungsabläufe: Kniebeuge 0–140°, Gangzyklus (vereinfacht), Sprunglandung.

**Detailansichten:** Patellofemoralgelenk von lateral (Femur aufgeschnitten), Kreuzbänder in der Fossa (von vorn, Patella ausgeblendet), lateraler Epikondylus mit Tractus, medialer Gelenkspalt (Meniskus, MCL, Pes anserinus), oberes Sprunggelenk von vorn, Außenbänder von lateral.

**Kalibrierungsanker in die Tests übernehmen** (Reilly & Martens 1972 für patellofemorale Kräfte; Beynnon für VKB-Dehnung; Nachemson-artige Faktoren für Gelenkkräfte), Toleranzen ±25 %.

### Stand Bein-Modul (11. September 2026, v0.11.0, erste Fassung)

Umgesetzt nach der Blaupause oben, mit diesen Entscheidungen:

- **Geschlossene Kette**: Bei Bodenkontakt (`ground`) wird die Kette so verschoben, dass der Auflagepunkt des Fußes (Ferse, Ballen oder Sohlenmitte, je nach Fußstellung) am festen Bodenpunkt steht; der Rumpf (Kontext, Rahmen U) neigt sich so weit, dass der Gesamtschwerpunkt (Rumpf + beide Beine + Zusatzlast) über dem Auflagepunkt liegt. Über 60° Neigung gilt „Abstützung nötig“ (Ausfallschritt, Cutting: zweites Bein trägt). Damit ist `hipF` der Winkel des Oberschenkels zur Senkrechten (klinische Hüftbeugung = `hipF` + Neigung, im HUD ausgewiesen); flacher Fuß ⇔ `hipF = knee − ankle`. Ohne Bodenkontakt hängt das Bein am ruhenden Becken.
- **Momente und Kräfte**: Je Gelenk (Hüfte, Knie, Sprunggelenk) das äußere Moment aus Bodenreaktion (`wt` % × 735 N + Zusatzlast `at:'body'`) bzw. Last am Fuß (`at:'foot'`) und Segmentgewichten; Verteilung ∝ PCSA · Hebelarm auf die Muskeln, die das Gelenk überspannen (Quadrizeps am Knie über die Patellarsehne, Ansatz Tuberositas); `EXT.fixHip` schaltet das Hüftmoment ab (Maschine, Sitz). Patellofemorale Kraft = Vektorsumme von Quadrizeps- und Patellarsehnenzug an der Patella (Verhältnis 1,0 → 0,75 mit der Beugung), Druck über die Kontaktfläche 2–5,5 cm²; TF-Kompression und VKB/HKB-Schub als Anteile entlang der Tibiaachsen; Achilles = Gastrocnemius + Soleus; Hüftkontaktkraft = Muskelzug + Bodenreaktion.
- **Kalibrierung** (Tests): Stand PF ≈ 0, TF 0,9 × KG; Kniebeuge parallel PF 3,2, tief 4,7 × KG (Reilly & Martens 7,6 gilt als Obergrenze, moderne Schätzungen 4–6); Treppe 3,1; Beinstrecker 15 kg bei 15°: VKB ≈ 230 N; Tractus-Reibzone 15–25°; Impingements vorn ab ≈ 25° Dorsalextension, hinten ab ≈ −35°; ATFL im Supinationstrauma +10 %; Wadenheben einbeinig Achilles 1,1 × KG (statisch; dynamische Werte 3–4 × KG sind nicht abgebildet).
- **Vereinfachungen**: keine Dynamik (Gehen, Laufen, Sprung nur als Posen); VKB-Spannung = Geometrie × 0,75 + heuristischer Zuschlag für Innenrotation/Valgus + Schub der Patellarsehne; Menisken als statische Ringe mit Kompressionsheuristik (> 115°); Patella auf einer Kreisbahn um das Kniezentrum (kein Trochlea-Profil); Subtalar-Achse 42° mit 25 % Talus-Mitkippung; Fuß als ein starrer Körper (kein Vorfuß-, kein Zehengelenk, Windlass fehlt); anderes Bein nur gespiegelter Kontext; Kraftverteilung statisch, keine Kokontraktion; zweigelenkige Muskeln bekommen das Maximum ihrer Gelenkzuweisungen.
- **Offen**: Vorfuß/Zehen (Windlass, Abdruck), Dynamikfaktoren für Gehen/Laufen/Sprung, Kniekapsel als Fläche, Hoffa-Impingement in Hyperextension (Knie < 0° fehlt), Pes-anserinus-Reibung, Hüftimpingement (Cam/Pincer), Umschalter auf dem Handy (Kopfzeile eng), zweites Bein bei einbeinigen Übungen frei hängend statt gespiegelt.

## 9. Zielbild der Engine-Schnittstelle

Ein Modul liefert ein Objekt, die Engine kennt kein Gelenk mehr beim Namen:

```
{
  id, name:{de,en}, description:{de,en},
  frames: ['T','C','S','H','F','R'],                 // Rahmenkette (Namen frei)
  pose: [{key:'E', min:0, max:180, step:1, label:'lElev', ends:['eHang','eOver'], def:0}, …],   // Regler
  patho: [{key:'migr', min:0, max:6, step:0.5, unit:'mm', label:'lMigr'}, …],
  anatomy: { AN, STRUCT, LAYER_GROUPS, INFO, LABELS },
  buildBones(G, tag, addBone),                        // Geometrie je Rahmen (heute in engine/render.js!)
  solvePose(pose, frames, patho) → readout,           // inkl. Rhythmus/Kopplungen
  limits: { clamp(pose), sliderRanges(pose) },
  computeReferenceLengths(), evaluate(frames) → { fas, metrics, act },
  metrics: [...], monitor: { top:[…], groups:[…] }, loadGroups: [...],
  presets, anims, physio,                             // RUN_LIST-Reihenfolge stabil
  detailViews, peel,                                  // Detailansichten + Schichtstufen
  camera: { orbit0, views },
  drag: { ids:Set, apply(hit, pointer) → posePatch },  // Ziehen am Körperteil
  hud(pose, readout, M) → text, i18n: { de:{…}, en:{…} }
}
```

Migrationsweg: zuerst die schulterspezifischen Teile aus `engine/render.js` (Knochenbau, `detailDefs`, `PEEL`, `orbit0`, `VIEWS`) und `engine/ui.js` (`PRESETS`/`ANIMS`/`PHYSIO`, `METRICS`, Monitor-Gruppen, `LOAD_GROUPS`, `LABELS`, `planeLabel`, HUD-Text, `ARM_IDS`/`dragArm`) in `modules/shoulder/` verschieben, ohne Verhalten zu ändern (Tests + `npm run shots` müssen identisch bleiben); dann die Registry und den Umschalter; dann das Bein-Modul gegen die Schnittstelle bauen.

### Stand der Migration (11. September 2026, v0.9.1)

Schritt 1 ist erledigt, ohne Verhaltensänderung (11 Tests grün; Screenshots aus `npm run shots` byte-identisch bis auf das Startbild, dessen Monitor-Balken während der Startanimation eine CSS-Transition durchlaufen; zusätzlich acht feste Link-Zustände auf Desktop und iPhone pixel-, text- und metrikidentisch gegen den alten Build verglichen, ebenso Ziehen am Arm, Rotationsmodus und Klick-Auswahl).

Verschoben nach `modules/shoulder/`:

| Datei | Inhalt (vorher) |
|---|---|
| `presets.js` | `PRESETS`, `ANIMS`, `PHYSIO` (aus `ui.js`) |
| `bones.js` | `buildBones(ctx)`: Thorax, Klavikula, Skapula, Humerus, Unterarm/Hand, Labrum, Bursa (aus `render.js`); `ctx` = `{G, LAYER, MAT, boneMat, addBone, ell, pickables, BONES}` |
| `views.js` | `ORBIT0`, `VIEWS`, `detailDefs` (jetzt mit `readout(M, rh)` für den Anzeigewert unter dem Fenster), `PEEL` (aus `render.js`) |
| `monitor.js` | `METRICS` (Sonderformat der Bizepssehne als `text(v, M)`), `MONITOR = {top, special, aggregate}` statt `METRIC_TOP`/`METRIC_SPECIAL`/`CAP_IDS`-Sonderfall, `LOAD_GROUPS`, `computeLoads`, `structReadouts` (Zusatzzeilen im Struktur-Info), `BONE_NAME_KEYS`, `LAYER_PRESETS` (aus `ui.js`) |
| `hud.js` | `planeLabel`, `hudMiniText`, `hudBodyHTML`, `poseSummaryText`, `scapReadoutHTML`, `READOUT0` (aus `ui.js`) |
| `interaction.js` | `LABELS`, `DRAG = {ids, frame, rot, pose(p0, p1, frames)}` statt `ARM_IDS`/`dragArm`-Mathematik (aus `ui.js`) |

Engine-Seite: `G` entsteht aus `Object.keys(frames)`, `BONES` wird von `addBone` dynamisch gefüllt, `frameOfMesh()` ersetzt die feste Zuordnung `fore → F/R`, `startRotDrag()` liest die Achsen aus `DRAG.rot`, `dragArm()` rechnet nur noch Griffpunkt und Ebene und ruft `DRAG.pose`. `tests/harness.mjs` lädt `presets.js` direkt statt Presets per Regex aus `ui.js` zu schneiden.

Noch in der Engine mit Schulterwissen (nächster Schritt, zusammen mit Registry und Umschalter):

- `page.html`: Regler (`sElev` … `sPro`, `sMigr` … `sFrozen`), Detailfenster-Markup `dv1` … `dv4`, Titel und Texte; `ui.js`: `SL`/`VL`/`PL`, `syncSliders` (Wertetexte, `rotLimits`/`Emax`), `setPatho`, `stepAnim` (Pose-Schlüssel), Startanimation `{P:30,E:70}`.
- `share.js`: `POSE_KEYS`, Kennbuchstaben `E P R B F` (Pose) und `M G Z` (Pathologie), `applyURLState` (Pathologie-Grenzen).
- `render.js`: `LAYER` (Namen), Zonen 1–4 → `bursaComp`/`corComp`/`grooveComp`/`psComp` in `applyPose`, Kapselfläche (`CAPS_N`/`CAPS_M`, `capsuleMesh`), Bursa-Dicke aus `ahd`, Sonderfälle `thorax`/`bursa`/`capsule` in `applyVisibility` und `pick`.
- `i18n.js`: ein gemeinsames Wörterbuch (UI und Schulteranatomie); `window.Schulterlabor` als Testschnittstelle.

### Stand Schritt 2 (11. September 2026, v0.10.0): Registry, Schnittstelle, Umschalter

Umgesetzt, Verhalten des Schultermoduls unverändert (A/B gegen v0.9.1 wie in Schritt 1: acht Link-Zustände pixel-, text- und metrikidentisch, Interaktion identisch; Zwillings-Build mit zwei Registry-Einträgen im Browser geprüft: Umschalter, Wechsel in beide Richtungen, `m=`/`x1` in beiden Link-Formen, englische Modulnamen).

- **Fabrik statt Konkatenation**: `build.mjs` legt Engine-Kopf (`math.js`, `i18n.js`), `REGISTRY` und je Modul `MODULES[id]=function(){…; return MODULE;}` und danach `boot.js`, `render.js`, `ui.js`, `share.js` in eine Datei. Nur die im Link gewählte Fabrik läuft; `computeReferenceLengths()` des Schultermoduls kostet also nur einmal. Optionen `--registry`/`--out` für Testbuilds (`tests/registry.test.mjs`).
- **Schnittstelle** (`modules/shoulder/module.js`), tatsächliche Form gegenüber dem Zielbild oben:

```
MODULE = {
  i18n:{de,en}, names:{struct,group,layer,preset,load,metric,info},
  pose, patho, frames,
  poseParams:[{key,url,code,min,max,step,def,label,ends,text(ps),range(ps)?}],
  pathoParams:[{key,url,code,min,max,step,sliderScale,urlScale,compactScale,label,text(v)}],
  intro,                                   // Zielpose der Startanimation (oder null)
  anatomy:{AN,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,INFO,LABELS},
  kinematics:{worldPt,solvePose,clampPose,evaluate,EVAL,EXT,REF,fasKey},
  presets, anims, physio,
  buildBones(ctx), render:{zones:{z→Metrik}, afterPose(M,{BONES,COL})},
  camera:{orbit0,views}, detailViews:[{id,title,label,fov,level,clipX?,fit(fr),readout(M,rh)}], peel,
  metrics, monitor:{top,special,aggregate}, loadGroups, computeLoads(), structReadouts(id,M), boneNameKeys, layerPresets:[{id,key,ids}],
  hud:{mini,body,summary}, readout:{sum,note,html}|null, readout0,
  drag:{ids,frame,rot:{x,y},pose(p0,p1,fr)}
}
```

- **boot.js** wählt das Modul (`URL_PARAMS.m` oder Kurz-Feld `x<Index>`), mischt `MOD.i18n` in `I18N`, destrukturiert `MOD` in die festen Engine-Namen und erzeugt das modulabhängige Markup (Pose-/Pathologie-Regler mit IDs `ps_<key>`/`pp_<key>`, Kopplungs-Block `#readout`, Schicht-Schnellwahl, Detail-Dock, Umschalter `#moduleSeg`, Fußzeile). `page.html` enthält dafür Platzhalter.
- **Wörterbuch geteilt**: 104 Engine-Schlüssel bleiben in `engine/i18n.js`, 133 Schulter-Schlüssel plus `*_EN`-Tabellen liegen in `modules/shoulder/i18n.js`.
- **render.js** generisch: Materialien tragen `userData.fixed` (Kontexthülle: Transparenz/Highlight unverändert), `noPick`, `baseOpacity`; Flächen-Strukturen (`s.surface`) beliebig viele; Zonen → Kompressionsmetrik aus `render.zones`; Bursa-Dicke über `render.afterPose`.
- **share.js**: Pose-/Patho-Felder generisch aus den Parametern (lesbare Schlüssel, Kurz-Buchstaben, Skalen), Modul-Feld `m` (lesbar) / `x` (kompakt, Basis-36-Index der Registry), `switchModule(id)` lädt mit Modul-Feld und ggf. Sprache neu (Artefakt/`file:` über Hash + `reload`). Engine-Buchstaben `N A W S Q H V O L C I X T U D K Y J m k g x`; Kollisionen mit Modul-Codes werden in der Konsole gemeldet.
- **Testschnittstelle** `window.AnatomyLab` (+ Alias aus `module.json`, `Schulterlabor`), `tests/shots.mjs` umgestellt.

Für das Bein-Modul noch zu klären bzw. offen:

- Der Umschalter sitzt in der Kopfzeile neben dem Titel und ist auf dem Handy bei zwei Modulen eng; ggf. in das Bewegungs-Sheet oder ein Menü legen.
- Presets-Überschriften (`hPresets`, `hPhysio`, `hAnims`), Legende und Hinweistexte sind Engine-Schlüssel; ein Modul kann sie über gleichnamige Schlüssel in seinem Wörterbuch überschreiben (Modul gewinnt).
- `LAYER` (three.js-Render-Layer) lebt im Modul (`bones.js`); Strukturen tragen `layer` in `anatomy.js`.
- `hashchange` lädt im eingebetteten Viewer weiterhin nicht neu (Viewer setzt den Hash selbst); der Umschalter ruft `reload()` explizit.
- Ein Modul ohne Pathologie-Parameter blendet den Block aus (`blk-patho`), ohne Kopplungs-Block (`readout:null`) entfällt der `<details>`-Teil.

# anatomy-lab

ShoulderLab, KneeLab and much more. A learning app to find out and get an idea when a body starts bugging or even hurting – or when you just want an idea of what your doctor was talking about.

**Live:** https://joergs-git.github.io/anatomy-lab/ · Sprache DE/EN in der Kopfzeile · läuft mit Maus und auf dem iPhone

Interaktive, vereinfachte biomechanische Lehrmodelle im Browser – eine einzige HTML-Datei ohne Backend (three.js r128). Das erste Modul ist das **Schulterlabor**: die rechte Schulter mit Knochen, Rotatorenmanschette, Deltoideus, Bizeps, Brust- und Rückenmuskeln, Bändern, Kapsel, Bursa und Nerven als schaltbare Schichten. Beim Bewegen färben sich die Strukturen nach Dehnung (rot), Entspannung (grün) und Einengung (violett); ein Engstellen-Monitor misst subakromialen und subkorakoidalen Abstand, Kapselspannung, die Umlenkung der langen Bizepssehne und die Gelenkkraft; vier synchron mitlaufende Detailansichten zeigen die typischen Engstellen. Klinische Testpositionen (Hawkins, Neer, Jobe, Apprehension, Schürzengriff …), Bewegungsabläufe und physiotherapeutische Übungen mit Lasten (Band, Hantel, Wand) sind als Presets hinterlegt; Pathologien (Humeruskopf-Hochstand, GIRD, Frozen Shoulder) lassen sich zuschalten.

Das zweite Modul ist das **Beinlabor** (Umschalter in der Kopfzeile): rechtes Bein mit Becken (Darmbeinschaufeln, Spinae, Sitz- und Schambein, Kreuzbein), Femur, Patella, Tibia, Fibula, Talus und Fuß, Hüft-, Oberschenkel-, Waden- und Unterschenkelmuskeln, Rumpfmuskeln (Rückenstrecker, gerade und schräge Bauchmuskeln), Adduktoren, Piriformis, Kreuz- und Seitenbändern, Patellar- und Achillessehne, Menisken, Sprunggelenkbändern und N. ischiadicus/peroneus. Steht der Fuß auf dem Boden, neigt sich der Rumpf automatisch so, dass der Körperschwerpunkt über dem Fuß bleibt (bei Ausfallschritt und Split Squat trägt das hintere Bein mit); aus Bodenreaktion und Segmentgewichten entstehen die Gelenkmomente, die statisch auf die Muskeln verteilt werden. Der Last-Monitor zeigt patellofemorale Kraft und Druck, tibiofemorale Kompression und ihre Verteilung auf das mediale/laterale Kompartiment, Kreuzbandlast, Patellar- und Achillessehnenkraft, Hüftkontaktkraft, Hüftimpingement (FADIR), Beckenkippung, die Lage des Tractus zum Epikondylus, Sprunggelenk-Impingements, Meniskus-Kompression und Bandspannungen. Presets: Kniebeuge, Ausfallschritt, Treppe, Landung, Cutting, Wadenheben, Hocke, Fersensitz, Supinationstrauma, Spitzentanz, Lachman, Schublade, Slump, FADIR, Trendelenburg, Hohlkreuz/Flachrücken, Knick-Senkfuß, Thomas-Test; Übungen mit Langhantel, Maschinen und Zusatzgewicht (Kniebeuge, Kreuzheben, Split Squat, Pistol, Step-up, Nordic Hamstring …).

> Vereinfachtes Lehrmodell (Landmarken- und Fadenmodell). Kein Diagnoseinstrument – Beschwerden bitte ärztlich oder physiotherapeutisch abklären.

## Links mit Zustand teilen

Alles, was vom Standard abweicht, steckt im Link („Link teilen“ in der Kopfzeile): Position oder laufender Ablauf, Last, Tempo, Endlosschleife, Pathologie, Schichten, Transparenz, Detailstufen, Kamera (Drehung, Zoom, Ziel), Modus, gewählte Struktur, Bedienfelder, Sprache.

Lesbare Form (GitHub Pages, lokale Datei, eigener Server):

```
https://joergs-git.github.io/anatomy-lab/?E=90&P=90&rot=40&elbow=90&sel=supra&lang=en
https://joergs-git.github.io/anatomy-lab/?run=sleeper&show=thorax,clav,scap,hum,fore,capsule,bursa,supra,infra,tmin,subsc&cam=-135,58,44
```

| Schlüssel | Bedeutung |
|---|---|
| `m` | Modul (`shoulder` oder `leg`; fehlt beim ersten Modul der Registry) |
| `E`, `P`, `rot`, `elbow`, `pro` | Elevation, Bewegungsebene, Rotation (+innen/−außen), Ellbogen, Pro-/Supination in Grad (Schultermodul) |
| `run` | laufender Ablauf: ID eines Presets, Bewegungsablaufs oder einer Übung (z. B. `hawkins`, `arc`, `erband`, `sleeper`) |
| `load` | Last einer Übung ohne deren Ablauf (z. B. `wall`) · `speed` Tempo · `loop=0` Endlosschleife aus |
| `migr`, `gird`, `frozen` | Kopfhochstand in mm, hintere Kapselverkürzung und Frozen Shoulder in % (Schultermodul) |
| `hipF`, `hipA`, `hipR`, `knee`, `tibR`, `valg`, `ankle`, `sub`, `wt`, `ground`, `tilt`, `other` | Beinmodul: Oberschenkel nach vorn, Abduktion, Rotation, Knie, Tibiarotation, Valgus, Sprunggelenk, Subtalar in Grad; Gewichtsanteil in %; Bodenkontakt 0/1; Beckenkippung gegen den Rumpf in Grad (+ vorn); anderes Bein 0 automatisch, 1 gespiegelt, 2 abgehoben, 3 hinten am Boden, 4 vorn gestreckt · `cart`, `acl` Knorpelverlust und VKB-Insuffizienz in % |
| `hide` / `show` | Schichten (Struktur-IDs, kommagetrennt) · `op=delt:0.4,chest:0.3` Gruppen-Transparenz |
| `peel` | Schichtstufen der vier Detailansichten · `cam=theta,phi,dist[,tx,ty,tz]` Kamera |
| `mode`, `strain=0`, `labels=1`, `sel`, `dock=0`, `hud`, `pl=0`, `pr=0`, `mon`, `cap`, `lgt` | Bedienzustand |
| `lang` | `de` oder `en` |

Kurzform für den claude.ai-Viewer: der reicht nur einen Hash aus `A–Z a–z 0–9 . _ : ~ -` mit höchstens 128 Zeichen durch, deshalb wird dort ein kompakter Token erzeugt, z. B. `#E90_P90_R40_B90_V0123456789abcdefj_Uc` (ein Kennbuchstabe je Feld, Schichten/Presets/Modul als Index, z. B. `x1` für das zweite Modul). Beide Formen werden beim Laden verstanden.

## Entwicklung

```
npm install          # einmalig (three.js für die Tests)
npm run build        # alle Module aus src/modules/registry.json → index.html (Pages), dist/artifact.html (claude.ai), dist/test.html (lokal)
npm test             # Modell-Invarianten und Registry/Build-Test ohne Browser (node --test)
npm run shots        # optional: Screenshots + Link-Roundtrip in Chromium (npm i -D playwright && npx playwright install chromium)
npm run serve        # lokal unter http://localhost:8080
```

`index.html` ist das Build-Ergebnis und wird **mit committet**, weil GitHub Pages den Root des Branches `main` ausliefert. Die CI baut nach jedem Push neu und schlägt fehl, wenn `index.html` nicht zum Quellstand passt oder eine Modell-Invariante verletzt ist.

### Struktur

```
src/engine/            gemeinsame Basis (kennt kein Gelenk beim Namen)
  page.html            Markup + CSS der Oberfläche (modulabhängige Teile als Platzhalter)
  math.js              Vektoren, Wrapping um Kugeln, Röhrengeometrie, Dehnungsfarben
  i18n.js              Deutsch/Englisch der Engine-Texte; URL-Parameter, Sprachwahl
  boot.js              Modul aus dem Link wählen, Fabrik aufrufen, Wörterbuch mischen, Regler/Dock/Umschalter erzeugen
  render.js            three.js-Szene, Röhren und Flächen, Schichten/Sichtbarkeit, Kameras, Detail-Dock
  ui.js                Regler, Chips, Schichten, Monitor-Aufbau, Strukturliste, Touch/Maus, Mobil-Sheets, Sprache
  share.js             Zustand ⇄ URL (lesbar und kompakt), Modulwechsel, Teilen-Dialog
src/modules/registry.json  registrierte Module in Link-Reihenfolge (nur anhängen)
src/modules/leg/       Beinmodul (gleicher Aufbau; Bodenkontakt mit Gleichgewicht, Gelenkmomente, PF-/TF-Kraft, Kreuzbänder, Sehnen, Tractus, Sprunggelenk)
src/modules/shoulder/  Schultermodul
  module.json          Name, Beschreibung, Alias, Bauteile in Reihenfolge
  anatomy.js           Landmarken, Strukturen (Faszikel), Schichtgruppen, Infotexte
  kinematics.js        Pose → Knochenrahmen (skapulothorakaler Rhythmus), Bewegungsgrenzen, Referenzlängen,
                       Auswertung: Dehnung, Engstellen, Kraftverteilung, Gelenkreaktionskraft
  presets.js           Klinische Positionen, Bewegungsabläufe, Übungen mit Lasten
  bones.js             Knochengeometrie je Rahmen (Thorax, Klavikula, Skapula, Humerus, Unterarm/Hand), Labrum, Bursa
  views.js             Standardkamera, Ansichten, Detailfenster (Kamera-Fit, Anzeigewert), Schichtstufen
  monitor.js           Engstellen-Monitor (Zeilen, Reihenfolge, Kapsel-Sammelzeile), Strukturgruppen, Belastungsregeln
  hud.js               Texte für HUD, Pose-Zusammenfassung, Skapula-Anzeige
  interaction.js       3D-Beschriftungen, Ziehen am Arm (greifbare Teile, Griffpunkt → Pose)
  i18n.js              Modul-Texte Deutsch/Englisch, englische Struktur-/Preset-/Metrik-Namen, Infotexte
  module.js            Schnittstelle: Pose-/Pathologie-Parameter (Regler, Link-Codes) und das MODULE-Objekt
tests/                 model.test.mjs (Schulter-Anker), leg.test.mjs (Bein-Anker), registry.test.mjs (Build/Registry), harness.mjs (Modell ohne Browser), shots.mjs (Browser), tools/ (Diagnose: Hebelarme, Bein-Screenshots)
build.mjs              legt Engine und alle registrierten Module (je eine Fabrik) in eine Datei
```

Jedes Modul ist eine Fabrik `MODULES[id]=function(){…; return MODULE;}` in derselben Datei; `engine/boot.js` ruft nur die im Link gewählte auf (`m=<id>`, kompakt `x<Index>`), mischt ihr Wörterbuch ein und erzeugt Regler, Detail-Dock und Umschalter aus dem `MODULE`-Objekt. Der Umschalter in der Kopfzeile erscheint, sobald mehr als ein Modul registriert ist; ein Wechsel lädt die Seite mit dem Modul-Feld neu. Ein neues Modul braucht einen Ordner mit `module.json`, eine `module.js` nach dem Muster des Schultermoduls und einen Eintrag am Ende von `registry.json`.

### Fahrplan

1. ~~Engine/Modul-Schnittstelle herausarbeiten (Modul-Registry, Modul-Umschalter in der Kopfzeile, Modul-Feld im Link)~~ – fertig (v0.10)
2. ~~Bein-Modul: Hüfte–Knie–Sprunggelenk (Patellofemoraldruck, Kreuzbänder, Tractus, Patellarsehne, Achillessehne, Außenbänder; Kniebeuge, Ausfallschritt, Landung)~~ – erste Fassung (v0.11), Verfeinerungen in `docs/HANDOVER.md` §8
3. Rumpf-Modul: LWS–Becken–Hüfte (Bandscheibenlast, Facetten, Foramen; Heben, Bücken)
4. Halswirbelsäule als Erweiterung des Schultermoduls (Trapezius, Levator, Foramenweite)

## Konventionen

- Modellkoordinaten in cm: +X lateral (rechts), +Y kranial, +Z ventral, Ursprung im Humeruskopfzentrum – ein linkshändiges System; die Darstellung spiegelt es über `ROOT.scale.x = −1`, Umrechnungen laufen über `toR()`.
- Listen, deren Index in Kurz-Links steckt (`registry.json`, `allIds()`, `PRESETS`/`ANIMS`/`PHYSIO`, `LAYER_GROUPS`, `LOAD_GROUPS`), werden **nur angehängt, nie umsortiert** – sonst zeigen alte Links auf falsche Dinge.
- Deutsch ist die Quellsprache (Markup, Code), Englisch liegt als Wörterbuch in `engine/i18n.js` (Engine) und `modules/<id>/i18n.js` (Modul: `data-i18n`-Schlüssel, `*_EN`-Tabellen).
- Kalibrierungsanker Schulter (Literaturwerte, in `tests/model.test.mjs` geprüft): subakromialer Abstand ≈ 9,9 mm in Ruhe und ≈ 3–4 mm bei 90° Abduktion; internes Impingement ≈ 2 mm in der Wurfposition; Kontaktfenster im Hawkins/Sleeper bei 20–55° Innenrotation mit Minimum ≈ 2 mm; Gelenkreaktionskraft ≈ 330 N bei 90° Abduktion ohne Last, ≈ 900 N mit 3 kg.
- Kalibrierungsanker Bein (`tests/leg.test.mjs`, 75 kg): patellofemorale Kraft ≈ 0 im Stand, 2,5–4,5 × KG in der parallelen und 4–7,5 × KG in der tiefen Kniebeuge, 2,5–4,5 × KG beim Treppensteigen; VKB-Last beim Beinstrecker nahe der Streckung maximal, jenseits 90° null; Tractus-Reibzone bei 10–35° Beugung; Sprunggelenk-Impingement vorn bei Dorsalextension, hinten bei Plantarflexion; ATFL beim Supinationstrauma endgradig; Achillessehne 1–4 × KG beim Wadenheben; FADIR schließt den Kopf-Hals-Übergang auf < 4 mm an den Pfannenrand; Varus/Valgus verlagern die TF-Kompression medial/lateral; Beckenkippung nach vorn verkürzt Hüftbeuger und Rückenstrecker; Glutaeus maximus streckt über den ganzen Beugebereich; jeder Ursprung/Ansatz liegt auf einem Knochenprimitiv (≤ 4 mm).

## Danksagung

three.js (MIT), IBM Plex (OFL). Entwickelt von joergsflow.

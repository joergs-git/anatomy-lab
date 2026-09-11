# anatomy-lab

ShoulderLab, KneeLab and much more. A learning app to find out and get an idea when a body starts bugging or even hurting – or when you just want an idea of what your doctor was talking about.

**Live:** https://joergs-git.github.io/anatomy-lab/ · Sprache DE/EN in der Kopfzeile · läuft mit Maus und auf dem iPhone

Interaktive, vereinfachte biomechanische Lehrmodelle im Browser – eine einzige HTML-Datei ohne Backend (three.js r128). Das erste Modul ist das **Schulterlabor**: die rechte Schulter mit Knochen, Rotatorenmanschette, Deltoideus, Bizeps, Brust- und Rückenmuskeln, Bändern, Kapsel, Bursa und Nerven als schaltbare Schichten. Beim Bewegen färben sich die Strukturen nach Dehnung (rot), Entspannung (grün) und Einengung (violett); ein Engstellen-Monitor misst subakromialen und subkorakoidalen Abstand, Kapselspannung, die Umlenkung der langen Bizepssehne und die Gelenkkraft; vier synchron mitlaufende Detailansichten zeigen die typischen Engstellen. Klinische Testpositionen (Hawkins, Neer, Jobe, Apprehension, Schürzengriff …), Bewegungsabläufe und physiotherapeutische Übungen mit Lasten (Band, Hantel, Wand) sind als Presets hinterlegt; Pathologien (Humeruskopf-Hochstand, GIRD, Frozen Shoulder) lassen sich zuschalten.

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
| `E`, `P`, `rot`, `elbow`, `pro` | Elevation, Bewegungsebene, Rotation (+innen/−außen), Ellbogen, Pro-/Supination in Grad |
| `run` | laufender Ablauf: ID eines Presets, Bewegungsablaufs oder einer Übung (z. B. `hawkins`, `arc`, `erband`, `sleeper`) |
| `load` | Last einer Übung ohne deren Ablauf (z. B. `wall`) · `speed` Tempo · `loop=0` Endlosschleife aus |
| `migr`, `gird`, `frozen` | Kopfhochstand in mm, hintere Kapselverkürzung und Frozen Shoulder in % |
| `hide` / `show` | Schichten (Struktur-IDs, kommagetrennt) · `op=delt:0.4,chest:0.3` Gruppen-Transparenz |
| `peel` | Schichtstufen der vier Detailansichten · `cam=theta,phi,dist[,tx,ty,tz]` Kamera |
| `mode`, `strain=0`, `labels=1`, `sel`, `dock=0`, `hud`, `pl=0`, `pr=0`, `mon`, `cap`, `lgt` | Bedienzustand |
| `lang` | `de` oder `en` |

Kurzform für den claude.ai-Viewer: der reicht nur einen Hash aus `A–Z a–z 0–9 . _ : ~ -` mit höchstens 128 Zeichen durch, deshalb wird dort ein kompakter Token erzeugt, z. B. `#E90_P90_R40_B90_V0123456789abcdefj_Uc` (ein Kennbuchstabe je Feld, Schichten/Presets als Index). Beide Formen werden beim Laden verstanden.

## Entwicklung

```
npm install          # einmalig (three.js für die Tests)
npm run build        # src/ → index.html (Pages), dist/artifact.html (claude.ai), dist/test.html (lokal)
npm test             # Modell-Invarianten ohne Browser (node --test)
npm run shots        # optional: Screenshots + Link-Roundtrip in Chromium (npm i -D playwright && npx playwright install chromium)
npm run serve        # lokal unter http://localhost:8080
```

`index.html` ist das Build-Ergebnis und wird **mit committet**, weil GitHub Pages den Root des Branches `main` ausliefert. Die CI baut nach jedem Push neu und schlägt fehl, wenn `index.html` nicht zum Quellstand passt oder eine Modell-Invariante verletzt ist.

### Struktur

```
src/engine/            gemeinsame Basis (soll modulunabhängig werden)
  page.html            Markup + CSS der Oberfläche
  math.js              Vektoren, Wrapping um Kugeln, Röhrengeometrie, Dehnungsfarben
  i18n.js              Deutsch/Englisch (UI-Texte, Struktur- und Preset-Namen, Beschreibungen)
  render.js            three.js-Szene, Schichten/Sichtbarkeit, Kameras, Detail-Dock
  ui.js                Regler, Presets/Abläufe/Übungen, Engstellen-Monitor, belastete Strukturen, Touch/Maus
  share.js             Zustand ⇄ URL (lesbar und kompakt), Teilen-Dialog
src/modules/shoulder/  Schultermodul
  module.json          Name, Beschreibung, Bauteile in Reihenfolge
  anatomy.js           Landmarken, Strukturen (Faszikel), Schichtgruppen, Infotexte
  kinematics.js        Pose → Knochenrahmen (skapulothorakaler Rhythmus), Bewegungsgrenzen, Referenzlängen,
                       Auswertung: Dehnung, Engstellen, Kraftverteilung, Gelenkreaktionskraft
tests/                 model.test.mjs (Invarianten), harness.mjs (Modell ohne Browser), shots.mjs (Browser)
build.mjs              Konkatenation der Bauteile eines Moduls zu einer Datei
```

Der Schnitt Engine/Modul ist auf Dateiebene angelegt, aber noch nicht sauber: `render.js` baut die Knochengeometrie der Schulter, `ui.js` enthält die Schulter-Presets und -Metriken, `i18n.js` die Übersetzungen der Schulteranatomie. Das zweite Modul (Bein: Hüfte–Knie–Sprunggelenk) soll diese Trennung erzwingen: Ein Modul liefert dann Anatomie, Kinematik, Metriken, Presets, Detailansichten und Texte über eine gemeinsame Schnittstelle, die Engine den Rest.

### Fahrplan

1. Engine/Modul-Schnittstelle herausarbeiten (Modul-Registry, Modul-Umschalter in der Kopfzeile, Modul-Feld im Link)
2. Bein-Modul: Hüfte–Knie–Sprunggelenk (Patellofemoraldruck, Kreuzbänder, Tractus, Patellarsehne, Achillessehne, Außenbänder; Kniebeuge, Ausfallschritt, Landung)
3. Rumpf-Modul: LWS–Becken–Hüfte (Bandscheibenlast, Facetten, Foramen; Heben, Bücken)
4. Halswirbelsäule als Erweiterung des Schultermoduls (Trapezius, Levator, Foramenweite)

## Konventionen

- Modellkoordinaten in cm: +X lateral (rechts), +Y kranial, +Z ventral, Ursprung im Humeruskopfzentrum – ein linkshändiges System; die Darstellung spiegelt es über `ROOT.scale.x = −1`, Umrechnungen laufen über `toR()`.
- Listen, deren Index in Kurz-Links steckt (`allIds()`, `PRESETS`/`ANIMS`/`PHYSIO`, `LAYER_GROUPS`, `LOAD_GROUPS`), werden **nur angehängt, nie umsortiert** – sonst zeigen alte Links auf falsche Dinge.
- Deutsch ist die Quellsprache (Markup, Code), Englisch liegt als Wörterbuch in `i18n.js` (`data-i18n`-Schlüssel, `*_EN`-Tabellen).
- Kalibrierungsanker (Literaturwerte, in `tests/model.test.mjs` geprüft): subakromialer Abstand ≈ 9,9 mm in Ruhe und ≈ 3–4 mm bei 90° Abduktion; internes Impingement ≈ 2 mm in der Wurfposition; Kontaktfenster im Hawkins/Sleeper bei 20–55° Innenrotation mit Minimum ≈ 2 mm; Gelenkreaktionskraft ≈ 330 N bei 90° Abduktion ohne Last, ≈ 900 N mit 3 kg.

## Danksagung

three.js (MIT), IBM Plex (OFL). Entwickelt von Joerg Klaas mit Claude.

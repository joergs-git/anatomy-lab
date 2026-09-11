# Lessons – Fallen, in die wir schon getreten sind

Jeweils Symptom → Ursache → Regel. Wer eine neue hinzufügt, hängt sie unten an.

## Modell und Geometrie

1. **Modell erschien als linke Schulter.** Die anatomischen Koordinaten (+X lateral rechts, +Y kranial, +Z ventral) bilden ein linkshändiges System; three.js ist rechtshändig. → `ROOT.scale.x = −1` spiegelt die Darstellung; alles, was Bildschirm und Modell verbindet (Picking, Detailkameras, Beschriftungen, Clip-Ebenen), geht durch `toR()`. Nie „mal eben“ eine Weltkoordinate direkt verwenden.
2. **Rotation bei 90° Flexion falsch herum (Hawkins).** Klinische Rotationsangaben folgen keiner festen Euler-Konvention. → `twistOffset(P,E)` blendet ab 30° Elevation eine ISB-artige Verdrehung ein, so dass bei 90° Flexion und 0° Rotation der gebeugte Unterarm nach medial zeigt; darunter verdrehungsfreie Schwenkung (kein Gimbal-Lock).
3. **Skapula verließ den Thorax.** Rotation um das AC-Gelenk in einer festen Ebene reicht nicht. → Landmarkengetriebenes Gleiten: unterer und oberer Winkel auf dem Thorax-Loft (`ribPt`), AC an der Klavikula, Rotation aus dem Dreieck (`triRotation`).
4. **Bänder in Mittelpositionen „endgradig“, in Endpositionen „locker“.** Normierung der Kapselspannung auf die Maximallänge im *gesamten* abgetasteten Bewegungsraum – der wird von unrealistischen Ecken (Hyperextension + Außenrotation, 165° frontale Abduktion) dominiert. → Anatomische Anker (`taut` in Ruhe, `endAt` in der Wurfposition für die antero-inferiore Kapsel und das vordere IGHL-Band). Bei neuen Bändern immer die klinische End-Position als Anker definieren.
5. **Bizepssehne in Ruhe plötzlich „+21° erhöht“.** Beim Nachziehen der Kapselanker wurde in `computeReferenceLengths` eine andere Pose gelöst und danach `REF.lbsDefl` (Referenz-Umlenkung in Ruhe) aus dem falschen Rahmenzustand gesetzt. → Nach jeder Hilfspose in der Referenzberechnung die Ruhestellung wiederherstellen; Test „Ruhe: Zusatzknick = 0“ fängt das ab.
6. **`EVAL.metrics` ist ein wiederverwendetes Objekt.** Zwei Posen „nacheinander auswerten und vergleichen“ verglich dieselben Zahlen. → Snapshot (`Object.assign({}, EVAL.metrics)`), im Test-Harness eingebaut.
7. **NaN bei Presets ohne alle Felder.** `pose` mit fehlendem `elbow` → NaN durch die ganze Kette. → `clampPose` setzt fehlende/ungültige Felder auf 0.
8. **Band-Außenrotation aktivierte Deltoideus und Trizeps.** Die statische Momentenverteilung berücksichtigt nicht, dass der Ellbogen am Körper abgestützt ist. → `axialOnly`: nur das Moment um die Humeruslängsachse, nur Rotatoren (`ROTATORS`), Ausrichtungsschwelle 0,45.
9. **Deltoideus wird bei Cross-Body kürzer.** Gerade Faszikel mit Kugel-Wrapping um den Kopf bilden den Umlauf um den Schaft nicht ab. Bekannt, nicht behoben – im Handover als Vereinfachung notiert.

## Rendering und Oberfläche

10. **Detailansichten blieben leer.** Die Viewports lagen über deckenden Panels; Scissor-Rendering direkt an ihre Position zeigte nichts. → An sicher sichtbarer Stelle rendern und per `drawImage` in ein 2D-Canvas je Ansicht kopieren.
11. **Grid kollabierte beim Ausblenden einer Spalte.** Automatische Platzierung verschob die Bühne. → Explizite `grid-column` für `#left`, `#stage`, `#right` und Klassen `noleft`/`noright`.
12. **`setPointerCapture` warf bei synthetischen Events.** → `try/catch` um jede Pointer-Capture.
13. **Regler auf dem iPhone unter dem Sheet unerreichbar.** → Bottom-Sheets mit Griff (Höhe ziehen), Peek-Modus, Ghost-Modus beim Berühren eines Reglers (Sheet wird durchsichtig), Dock verschwindet bei offenem Sheet, HUD startet eingeklappt.
14. **Dynamisch sortierte Listen irritieren.** → Feste Reihenfolge (heute nach klinischer Relevanz, innerhalb alphabetisch), Ein-/Ausblenden mit Hysterese (`0,12` ein / `0,06` aus).
15. **Endlosschleife nur für manche Abläufe.** → Ein globaler Schalter, `playSegment` entscheidet, `setLoopLive` schaltet ohne Sprung um (Zeitbasis wird umgerechnet).

## Links und Veröffentlichung

16. **`?E=75&…` am claude.ai-Artefakt kam nicht an.** Der Viewer bettet die Seite in einen iframe und reicht Query-Parameter nicht durch; nur ein Hash, der `^#[A-Za-z0-9._:~-]{1,128}$` erfüllt, wird an `iframe.src` angehängt (nachgelesen im Viewer-Bundle `frame-shell-*.js`). → Kompakter Token (`compactEncode`): Kennbuchstabe + Wert, `_` als Trenner, `~` in Listen, Indizes Basis 36, ≤ 120 Zeichen, Nebensächliches zuerst weglassen. `__frame_v`-Parameter des Viewers ignorieren (`__`-Präfix).
17. **Kurz-Links brechen, wenn Listen umsortiert werden.** Schichten, Presets/Abläufe/Übungen, Gruppen sind als Index kodiert. → Nur anhängen. Steht in `CLAUDE.md`, gilt für immer.
18. **Anonyme Betrachter sahen eine alte Version.** Der Artefakt-Link ist an eine freigegebene Version gepinnt; jede Neuveröffentlichung braucht ein Nachziehen im Teilen-Menü. → GitHub Pages als Hauptweg; das Artefakt ist Spiegel.
19. **`history.replaceState` auf `file://`** kann werfen und ist ratenbegrenzt (Safari). → try/catch, Hash-Form bei `file:`, höchstens einmal pro Sekunde, nur bei Änderung.
20. **`document.referrer` ist im Viewer leer** (`<meta name="referrer" content="no-referrer">`), `window.top.location` unzugänglich. → Basis-URL des Artefakts fest im Code (`ARTIFACT_URL`), Umgebung über `location.hostname` (`claudeusercontent.com`) bzw. iframe-Erkennung.

## Werkzeuge

21. **cdnjs aus der Sandbox nicht erreichbar.** → three.js für Tests aus `node_modules` (`dist/test.html`), die Seite selbst lädt cdnjs mit jsdelivr-Fallback per `document.write`.
22. **Python-Ersetzungen mit `//`-Zeilenkommentaren verschluckten Code**, wenn Zeilen zusammengezogen wurden. → In Code, der per Skript ersetzt wird, nur `/* */`.
23. **Sprache im Test-Browser „klebte“.** `setLang(…, true)` schreibt `localStorage`; ein zweiter Tab im selben Kontext lief auf Englisch und der Link-Roundtrip schien zu scheitern. → Roundtrip in frischem Browser-Kontext.
24. **`node --test tests/`** braucht ein Datei-Glob (`tests/*.test.mjs`) in älteren Node-Versionen.

## Refactoring und Nachweis

25. **Screenshots „identisch“ halten heißt nicht byte-identisch.** Das Startbild aus `npm run shots` unterscheidet sich zwischen zwei Läufen desselben Stands um einige Dutzend Pixel im Monitor: die Balken haben `transition: width .12s`, die Strukturliste eine Hysterese, beides hängt vom Refresh-Timing während der Startanimation ab. → Für den Nachweis „kein Verhaltensunterschied“ beide Builds mit festen Link-Zuständen (kein Intro) öffnen und Pixel, `document.body.innerText`, `EVAL.metrics` und `compactEncode(currentState())` vergleichen; Interaktion (Ziehen, Rotationsmodus, Klick) mit identischen Mausgesten auf beiden Builds prüfen.
26. **Erster WebGL-Kontext in frischem Chromium rendert spät.** Unter SwiftShader blieb die 3D-Fläche der ersten Seite nach 1,5 s schwarz, alle späteren Seiten waren fertig. → Vor Pixelvergleichen eine Aufwärmseite laden oder ≥ 2,5 s warten; ein schwarzes Bild ist ein Test-Artefakt, kein Build-Unterschied.
27. **Verschieben zwischen konkatenierten Dateien ist eine Reihenfolgefrage.** Alle Bauteile teilen eine IIFE; `const`-Tabellen müssen vor ihrer ersten Verwendung beim Aufbau ausgeführt sein, Funktionsdeklarationen nicht. → Modul-Dateien in `module.json` vor `render.js`/`ui.js` einreihen; Modulcode, der Engine-Zustand braucht (z. B. `DRAG.pose`, `buildBones`), als Funktion formulieren, die die Engine aufruft und mit Kontext versorgt.

/* ===================== Sprache (Deutsch / English) =====================
   Engine-Texte. Modulspezifische Schlüssel (Regler, Detailfenster, Monitor, Landmarken, …) liefert jedes Modul in seiner i18n.js;
   engine/boot.js mischt sie beim Start in I18N. Statuswörter (lv*), Strukturlisten-Wortlaute und Struktur-Info-Zeilen sind gemeinsam. */
let LANG='de';
const I18N={
de:{
 vFront:'Vorne', vSide:'Seite', vBack:'Hinten', vTop:'Oben', neutral:'Neutral', neutralT:'Arm in Neutralstellung', pLeft:'◧ Bewegung', pRight:'Monitor ◨',
 pLeftT:'Linkes Bedienfeld ein-/ausblenden', pRightT:'Rechtes Bedienfeld ein-/ausblenden', share:'Link teilen', shareT:'Link zu genau dieser Einstellung kopieren oder teilen',
 langT:'Switch to English', small:'Klein', big:'Groß', smallT:'Bedienfeld klein machen – Modell sichtbar', closeT:'Bedienfeld schließen', hMove:'Bewegung',
 hPresets:'Klinische Positionen & Tests', hPhysio:'Physiotherapie & Training', physioNote:'Mit Last (Band, Hantel, Wand) – die Kraft an der Hand fließt in Haltearbeit und Gelenkreaktionskraft ein. Ablaufpresets (▶) laufen einmal durch, Schleifen (↻) bis zum erneuten Antippen.',
 hAnims:'Bewegungsabläufe', loop:'Endlos wiederholen (gilt für alle Bewegungsabläufe ▶ ↻)', speed:'Tempo', hPatho:'Pathologie simulieren', hLayers:'Schichten',
 lyAll:'alles', opT:'Transparenz', lgStretched:'gedehnt', lgNeutral:'neutral', lgShort:'verkürzt / entspannt', lgImp:'eingeengt', lgBone:'Knochen', lgTendon:'Sehne / Band',
 lgBursa:'Bursa', lgNerve:'Nerv', labels:'Beschriftungen', strain:'Dehnungsfarben', disc2:'Vereinfachtes biomechanisches Lehrmodell. Kein Diagnoseinstrument.',
 hudTitle:'Position', hudT:'Antippen: ein-/ausklappen · Ziehen: verschieben', mCam:'Kamera', mCamT:'Ziehen dreht nur die Kamera', dockT:'Detailansichten',
 dockSub:'synchron zur Bewegung', dockHide:'Ausblenden', dockShow:'Detailansichten einblenden', peelLess:'weniger Schichten', peelMore:'mehr Schichten', hLoad:'Belastete Strukturen in dieser Position',
 loadNote:'Gruppiert nach klinischer Relevanz (häufigste Problemzonen oben), innerhalb alphabetisch; Gruppen ohne nennenswerte Belastung werden ausgeblendet. Rot = gedehnt/gespannt, violett = eingeengt, gelb = Haltearbeit gegen Schwerkraft/Last (Schätzung).',
 mgClear:'alles frei', mgN:'auffällig', hInfo:'Struktur', infoEmpty:'Klicke oder tippe auf einen Muskel, eine Sehne, ein Band oder einen Knochen.', tabMove:'Bewegung',
 tabLayers:'Schichten', tabInfo:'Info', shareTitle:'Link zu dieser Einstellung', copy:'Kopieren', copied:'Link kopiert', copyFail:'Bitte den Link markieren und kopieren',
 shareNative:'Teilen…', close:'Schließen', shareHint:'Der Link enthält alles, was vom Standard abweicht: Position bzw. laufender Ablauf, Last, Tempo, Schichten, Transparenz, Detailstufen, Kamera (Drehung, Zoom), Pathologie, Sprache. Wer ihn öffnet, sieht genau diese Ansicht.',
 shareNone:'Alles steht auf Standard – der Link öffnet die Startansicht.', shareTrunc:'Sehr viele Abweichungen – Nebensächliches (Modus, Beschriftungen, Bedienfelder) passt nicht mehr in den kurzen Link.',
 load:'Last:', removeLoad:'entfernen', stretched:'gedehnt +', holding:'Haltearbeit ≈', tensioned:'gespannt +', loadEmpty:'Keine Struktur nennenswert belastet – Mittelstellung.',
 liLen:'Länge vs. Neutral', liStretched:'(gedehnt)', liShort:'(verkürzt)', liHold:'Haltearbeit (Schätzung)', liOfMax:'der Maximalkraft', liTension:'Spannung',
 liEnd:'(endgradig)', liTens:'(gespannt)', liBears:'(trägt)', liSlack:'(locker)', fn:'Funktion:', probs:'Typische Probleme:', test:'Provokation / Test:',
 lvFree:'frei', lvContact:'Kontakt', lvNarrow:'Enge', lvSevere:'stark eingeengt', lvStop:'Anschlag', lvEnd:'endgradig', lvTens:'gespannt', lvBears:'trägt',
 lvSlack:'locker', lvStrong:'stark', lvRaised:'erhöht', lvRest:'wie in Ruhe', lvStretched:'gedehnt', lvRelaxed:'entspannt', lvVeryHigh:'sehr hoch', lvHigh:'hoch',
 lvMod:'moderat', lvLow:'gering',
},
en:{
 vFront:'Front', vSide:'Side', vBack:'Back', vTop:'Top', neutral:'Neutral', neutralT:'Arm in neutral position', pLeft:'◧ Movement', pRight:'Monitor ◨', pLeftT:'Show/hide left panel',
 pRightT:'Show/hide right panel', share:'Share link', shareT:'Copy or share a link to exactly this setup', langT:'Auf Deutsch umschalten', small:'Small',
 big:'Large', smallT:'Shrink the panel – model stays visible', closeT:'Close panel', hMove:'Movement', hPresets:'Clinical positions & tests', hPhysio:'Physiotherapy & training',
 physioNote:'With load (band, dumbbell, wall) – the force at the hand feeds into holding effort and joint reaction force. Sequence presets (▶) run once, loops (↻) until tapped again.',
 hAnims:'Motion sequences', loop:'Repeat endlessly (applies to all sequences ▶ ↻)', speed:'Speed', hPatho:'Simulate pathology', hLayers:'Layers', lyAll:'all',
 opT:'Transparency', lgStretched:'stretched', lgNeutral:'neutral', lgShort:'shortened / relaxed', lgImp:'impinged', lgBone:'bone', lgTendon:'tendon / ligament',
 lgBursa:'bursa', lgNerve:'nerve', labels:'Labels', strain:'Strain colours', disc2:'Simplified biomechanical teaching model. Not a diagnostic tool.', hudTitle:'Position',
 hudT:'Tap: collapse/expand · drag: move', mCam:'Camera', mCamT:'Dragging only orbits the camera', dockT:'Detail views', dockSub:'synchronised with the movement',
 dockHide:'Hide', dockShow:'Show detail views', peelLess:'fewer layers', peelMore:'more layers', hLoad:'Loaded structures in this position', loadNote:'Grouped by clinical relevance (most common problem zones first), alphabetical within groups; groups without appreciable load are hidden. Red = stretched/tensioned, violet = impinged, amber = holding effort against gravity/load (estimate).',
 mgClear:'all clear', mgN:'flagged', hInfo:'Structure', infoEmpty:'Click or tap a muscle, tendon, ligament or bone.', tabMove:'Movement', tabLayers:'Layers',
 tabInfo:'Info', shareTitle:'Link to this setup', copy:'Copy', copied:'Link copied', copyFail:'Please select and copy the link', shareNative:'Share…', close:'Close',
 shareHint:'The link contains everything that differs from the defaults: position or running sequence, load, speed, layers, transparency, detail levels, camera (rotation, zoom), pathology, language. Whoever opens it sees exactly this view.',
 shareNone:'Everything is at its default – the link opens the start view.', shareTrunc:'Very many deviations – minor items (mode, labels, panels) no longer fit into the short link.',
 load:'Load:', removeLoad:'remove', stretched:'stretched +', holding:'holding ≈', tensioned:'tensioned +', loadEmpty:'No structure under appreciable load – mid-range position.',
 liLen:'Length vs. neutral', liStretched:'(stretched)', liShort:'(shortened)', liHold:'Holding effort (estimate)', liOfMax:'of maximum force', liTension:'Tension',
 liEnd:'(end-range)', liTens:'(tensioned)', liBears:'(load-bearing)', liSlack:'(slack)', fn:'Function:', probs:'Typical problems:', test:'Provocation / test:',
 lvFree:'clear', lvContact:'contact', lvNarrow:'narrow', lvSevere:'severely narrowed', lvStop:'abutment', lvEnd:'end-range', lvTens:'tensioned', lvBears:'load-bearing',
 lvSlack:'slack', lvStrong:'marked', lvRaised:'increased', lvRest:'as at rest', lvStretched:'stretched', lvRelaxed:'relaxed', lvVeryHigh:'very high', lvHigh:'high',
 lvMod:'moderate', lvLow:'low',
}};
const t=k=>{ const d=I18N[LANG]; return (d&&d[k]!==undefined)?d[k]:(I18N.de[k]!==undefined?I18N.de[k]:k); };

/* URL-Parameter (Suchstring und/oder Hash) einmalig einlesen; erster Treffer je Schlüssel gilt */
const URL_PARAMS=(function(){ const o={}; const add=s=>{ s=(s||'').replace(/^[?#!\/]+/,''); if(!/=/.test(s)) return; for(const part of s.split('&')){ if(!part) continue; const i=part.indexOf('='); let k,v; try{ k=decodeURIComponent(i<0?part:part.slice(0,i)); v=i<0?'':decodeURIComponent(part.slice(i+1).replace(/\+/g,' ')); }catch(_){ continue; } if(k.startsWith('__')) continue; /* Viewer-interne Parameter (__frame_v) ignorieren */ if(!(k in o)) o[k]=v; } }; try{ add(location.search); add(location.hash); }catch(_){ } return o; })();
/* Kompakter Link-Token im Hash (nur A–Z a–z 0–9 . _ : ~ - , max. 128 Zeichen – so reicht ihn der claude.ai-Viewer an das eingebettete Modell durch) */
const COMPACT_TOKEN=(function(){ try{ const h=location.hash||''; if(h.length>1&&/^#[A-Za-z0-9._:~-]+$/.test(h)) return h.slice(1); }catch(_){ } return null; })();
let LANG_EXPLICIT=false;
(function initLang(){ let l=null; if(URL_PARAMS.lang==='en'||URL_PARAMS.lang==='de'){ l=URL_PARAMS.lang; LANG_EXPLICIT=true; }
  else if(COMPACT_TOKEN){ const f=COMPACT_TOKEN.split('_').find(x=>x[0]==='N'); if(f&&(f[1]==='e'||f[1]==='d')){ l=f[1]==='e'?'en':'de'; LANG_EXPLICIT=true; } }
  if(!l){ try{ const s=localStorage.getItem('sl-lang'); if(s==='en'||s==='de'){ l=s; LANG_EXPLICIT=true; } }catch(_){ } }
  if(!l){ const nl=(navigator.language||'de').toLowerCase(); l=nl.startsWith('de')?'de':'en'; } LANG=l; NUM_LOCALE=LANG==='en'?'en-GB':'de-DE'; })();

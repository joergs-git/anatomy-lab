/* ===================== Schulter: klinische Positionen, Bewegungsabläufe, Übungen =====================
   Reihenfolge nie ändern, neue Einträge nur anhängen – die Position in PRESETS+ANIMS+PHYSIO (RUN_LIST) steckt als Basis-36-Index in Kurz-Links. */
const PRESETS=[
 {id:'neutral',name:'Neutral',pose:{P:0,E:0,IR:0,elbow:0,pro:0}},
 {id:'abd90',name:'Abduktion 90° (frontal)',pose:{P:10,E:90,IR:0,elbow:0,pro:0}},
 {id:'scap90',name:'Skapulaebene 90°',pose:{P:35,E:90,IR:0,elbow:0,pro:0}},
 {id:'flex90',name:'Flexion 90°',pose:{P:90,E:90,IR:0,elbow:0,pro:0}},
 {id:'over',name:'Überkopf 170°',pose:{P:35,E:170,IR:0,elbow:0,pro:0}},
 {id:'jobe',name:'Jobe / Empty Can',pose:{P:35,E:90,IR:60,elbow:0,pro:70}},
 {id:'fullcan',name:'Full Can',pose:{P:35,E:90,IR:-30,elbow:0,pro:-60}},
 {id:'hawkins',name:'Hawkins-Kennedy ▶',pose:{P:90,E:90,IR:0,elbow:90,pro:0},sweep:{IR:70}},
 {id:'neer',name:'Neer ▶',pose:{P:95,E:60,IR:50,elbow:0,pro:60},sweep:{E:130}},
 {id:'aber',name:'Wurfposition / Apprehension',pose:{P:-10,E:90,IR:-95,elbow:90,pro:0}},
 {id:'cross',name:'Cross-Body-Adduktion',pose:{P:120,E:70,IR:20,elbow:110,pro:0}},
 {id:'schuerze',name:'Schürzengriff',pose:{P:-53,E:43,IR:100,elbow:135,pro:40}},
 {id:'nacken',name:'Nackengriff',pose:{P:90,E:140,IR:-20,elbow:140,pro:0}},
 {id:'speed',name:'Speed-Test (Bizeps)',pose:{P:90,E:90,IR:-30,elbow:0,pro:-80}},
];
const ANIMS=[
 {id:'arc',name:'Painful Arc (Abduktion 0–180°)',from:{P:10,E:0,IR:0,elbow:0,pro:0},to:{P:10,E:180,IR:0,elbow:0,pro:0},dur:5200},
 {id:'flexarc',name:'Flexion 0–180°',from:{P:90,E:0,IR:0,elbow:0,pro:0},to:{P:90,E:180,IR:0,elbow:0,pro:0},dur:5200},
 {id:'rot',name:'Rotation bei 90° Abduktion',from:{P:10,E:90,IR:-90,elbow:90,pro:0},to:{P:10,E:90,IR:70,elbow:90,pro:0},dur:4200},
 {id:'prosup',name:'Hand drehen (Pro-/Supination)',from:{P:0,E:0,IR:0,elbow:90,pro:-85},to:{P:0,E:0,IR:0,elbow:90,pro:80},dur:3200},
];
/* Physiotherapeutische Übungen & Haltemuster – Kräfte in N, Modellkoordinaten (+X lateral, +Y kranial, +Z ventral) */
const PHYSIO=[
 {id:'wall',name:'Isometrisches Wanddrücken',pose:{P:90,E:90,IR:0,elbow:0,pro:70},load:{F:[0,0,-80],label:'Wand drückt 80 N zurück'}},
 {id:'erband',name:'Außenrotation gegen Band (Ellbogen am Körper) ▶',pose:{P:0,E:0,IR:30,elbow:90,pro:0},sweep:{IR:-45},load:{F:[-20,0,0],label:'Band zieht 20 N nach innen, Ellbogen am Körper',axialOnly:true}},
 {id:'irband',name:'Innenrotation gegen Band (Ellbogen am Körper) ▶',pose:{P:0,E:0,IR:-40,elbow:90,pro:0},sweep:{IR:60},load:{F:[20,0,0],label:'Band zieht 20 N nach außen, Ellbogen am Körper',axialOnly:true}},
 {id:'er90band',name:'Außenrotation bei 90° Abduktion gegen Band ▶',pose:{P:10,E:90,IR:0,elbow:90,pro:0},sweep:{IR:-85},load:{F:[0,0,25],label:'Band zieht 25 N nach vorn'}},
 {id:'fullcanW',name:'Full Can mit 2 kg ▶',pose:{P:35,E:10,IR:-30,elbow:0,pro:-60},sweep:{E:90},load:{F:[0,-20,0],label:'Hantel 2 kg'}},
 {id:'latraise',name:'Seitheben 3 kg – Painful-Arc-Check ▶',pose:{P:10,E:10,IR:0,elbow:0,pro:60},sweep:{E:100},load:{F:[0,-30,0],label:'Hantel 3 kg'}},
 {id:'wallslide',name:'Wandrutschen ▶',pose:{P:85,E:85,IR:-75,elbow:90,pro:60},sweep:{E:150,elbow:25,IR:-20},load:{F:[0,0,-15],label:'Wandkontakt 15 N'}},
 {id:'elbowchest',name:'Ellbogen waagerecht zur Brustmitte (hintere Schulter dehnen)',pose:{P:135,E:85,IR:60,elbow:100,pro:0},load:{F:[-30,0,0],label:'Gegenhand zieht 30 N nach innen'}},
 {id:'schuerzeUp',name:'Schürzengriff, Daumen oben',pose:{P:-53,E:43,IR:85,elbow:135,pro:-25}},
 {id:'sleeper',name:'Sleeper Stretch (Seitlage) ▶',pose:{P:90,E:90,IR:0,elbow:90,pro:0},sweep:{IR:65}},
 {id:'pendel',name:'Pendeln (Codman) ↻',pose:{P:-40,E:18,IR:0,elbow:0,pro:0},loop:{P:50,E:18}},
 {id:'row',name:'Ruderzug gegen Band ▶',pose:{P:90,E:55,IR:0,elbow:20,pro:0},sweep:{P:-45,E:35,elbow:105},load:{F:[0,0,40],label:'Band zieht 40 N nach vorn'}},
 {id:'pushplus',name:'Wand-Liegestütz plus (Serratus) ▶',pose:{P:90,E:60,IR:-45,elbow:70,pro:70},sweep:{E:90,elbow:0,IR:-10},load:{F:[0,0,-120],label:'Wandreaktion 120 N'}},
 {id:'ohp',name:'Überkopfdrücken 5 kg ▶',pose:{P:30,E:90,IR:-90,elbow:100,pro:60},sweep:{E:170,elbow:0,IR:-20},load:{F:[0,-50,0],label:'Hantel 5 kg'}},
 /* Neue Einträge nur ANHÄNGEN – die Position in dieser Liste steckt in Kurz-Links */
 {id:'sleeperMod',name:'Sleeper Stretch, modifiziert (30° zurückgerollt) ▶',pose:{P:60,E:90,IR:0,elbow:90,pro:0},sweep:{IR:65}},
 {id:'crossStretch',name:'Cross-Body-Dehnung (hintere Kapsel) ▶',pose:{P:95,E:75,IR:20,elbow:100,pro:0},sweep:{P:135}},
];

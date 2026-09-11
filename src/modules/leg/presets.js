/* ===================== Bein: klinische Positionen, Bewegungsabläufe, Übungen =====================
   Reihenfolge nie ändern, neue Einträge nur anhängen – die Position in PRESETS+ANIMS+PHYSIO (RUN_LIST) steckt als Basis-36-Index in Kurz-Links.
   Pose-Felder, die fehlen, gelten als 0 (wt: 50, ground: 1 werden hier immer angegeben). */
const STAND={hipF:0,hipA:0,hipR:0,knee:0,tibR:0,valg:0,ankle:0,sub:0,wt:50,ground:1};
const P=o=>Object.assign({},STAND,o);
const PRESETS=[
 {id:'stand',name:'Stand',pose:P({})},
 {id:'squatPar',name:'Kniebeuge parallel',pose:P({hipF:75,knee:100,ankle:25})},
 {id:'squatDeep',name:'Kniebeuge tief',pose:P({hipF:102,knee:140,ankle:38})},
 {id:'lunge',name:'Ausfallschritt (vorderes Bein)',pose:P({hipF:72,knee:90,ankle:18,wt:70})},
 {id:'stair',name:'Treppe auf ▶',pose:P({hipF:50,knee:65,ankle:15,wt:100}),sweep:{hipF:5,knee:5,ankle:0}},
 {id:'landing',name:'Landung nach Sprung',pose:P({hipF:33,knee:45,ankle:12,valg:6,wt:100})},
 {id:'cutting',name:'Cutting / Pivot (Valgus + Innenrotation)',pose:P({hipF:20,knee:20,valg:12,tibR:15,wt:100})},
 {id:'calfRaise',name:'Wadenheben einbeinig',pose:P({ankle:-35,wt:100})},
 {id:'squatRest',name:'Hocke (tiefe Ruhehaltung)',pose:P({hipF:105,knee:140,ankle:35})},
 {id:'kneelSit',name:'Fersensitz',pose:P({hipF:70,knee:140,ankle:-40,ground:0})},
 {id:'supTrauma',name:'Supinationstrauma (Umknicken)',pose:P({knee:10,ankle:-35,sub:30,wt:100})},
 {id:'pointe',name:'Spitzentanz',pose:P({ankle:-45,wt:100})},
 {id:'lachman',name:'Lachman-Position (25°)',pose:P({knee:25,ground:0})},
 {id:'drawer',name:'Schubladentest (90°, sitzend)',pose:P({hipF:85,knee:90,ground:0})},
 {id:'slump',name:'Slump (Nervendehnung)',pose:P({hipF:85,knee:0,ankle:20,sub:15,ground:0})},
];
const ANIMS=[
 {id:'squatCycle',name:'Kniebeuge 0–140°',from:P({}),to:P({hipF:102,knee:140,ankle:38}),dur:5200},
 {id:'swing',name:'Gang: Schwungphase (vereinfacht)',from:P({hipF:-10,knee:5,ankle:5,ground:0}),to:P({hipF:30,knee:60,ankle:0,ground:0}),dur:3200},
 {id:'landingAnim',name:'Sprunglandung (einbeinig)',from:P({hipF:15,knee:5,ankle:-10,wt:100}),to:P({hipF:48,knee:70,ankle:22,wt:100}),dur:2400},
 {id:'ankleRom',name:'Sprunggelenk: Plantar-/Dorsalflexion',from:P({ankle:-45,ground:0}),to:P({knee:20,ankle:30,ground:0}),dur:3200},
];
/* Übungen mit Last – Kräfte in N. at:'body' = Zusatzgewicht am Rumpf (Langhantel, Weste), at:'foot' = Kraft am Fuß (Manschette, Maschine) */
const PHYSIO=[
 {id:'barbellSquat',name:'Kniebeuge mit Langhantel 40 kg ▶',pose:P({}),sweep:{hipF:82,knee:110,ankle:28},load:{F:[0,-392,0],at:'body',label:'Langhantel 40 kg auf den Schultern'}},
 {id:'wallSit',name:'Wandsitz (90°)',pose:P({hipF:90,knee:90})},
 {id:'stepUp',name:'Step-up 20 cm ▶',pose:P({hipF:48,knee:60,ankle:12,wt:100}),sweep:{hipF:5,knee:5,ankle:0}},
 {id:'legExt',name:'Beinstrecker 15 kg ▶',pose:P({hipF:90,knee:90,ground:0}),sweep:{knee:0},load:{F:[0,-147,0],at:'foot',fixHip:true,label:'Maschine 15 kg am Unterschenkel, Oberschenkel aufliegend'}},
 {id:'legCurl',name:'Beinbeuger 10 kg ▶',pose:P({hipF:0,knee:0,ground:0}),sweep:{knee:100},load:{F:[0,-98,0],at:'foot',fixHip:true,label:'Maschine 10 kg am Unterschenkel, Bauchlage'}},
 {id:'calfRaiseW',name:'Wadenheben mit 20 kg ▶',pose:P({wt:100}),sweep:{ankle:-35},load:{F:[0,-196,0],at:'body',label:'Hantel 20 kg'}},
 {id:'pistol',name:'Einbein-Kniebeuge (Pistol) ▶',pose:P({wt:100}),sweep:{hipF:75,knee:105,ankle:30}},
 {id:'splitSquat',name:'Split Squat ▶',pose:P({hipF:15,knee:15,wt:70}),sweep:{hipF:75,knee:95,ankle:20}},
 {id:'heelWalk',name:'Fersengang (Fußheber)',pose:P({ankle:20,wt:100})},
 {id:'nordic',name:'Nordic Hamstring ▶',pose:P({hipF:0,knee:90,ground:0}),sweep:{knee:30},load:{F:[0,0,150],at:'foot',fixHip:true,label:'Partner hält die Fersen, Rumpf kippt nach vorn'}},
];

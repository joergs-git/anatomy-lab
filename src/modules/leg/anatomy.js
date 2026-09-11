/* ===================== Anatomie des rechten Beins (Hüfte – Knie – Sprunggelenk) =====================
   Einheiten cm. +X lateral (rechts vom Patienten), +Y kranial, +Z ventral. Ursprung = Hüftgelenkzentrum im Stand.
   Rahmen: B Becken, U Rumpf (Kontext, neigt sich für das Gleichgewicht), F Femur, P Patella, T Tibia + Fibula, A Talus, C Calcaneus/Fuß;
   F2 T2 A2 C2 = gespiegeltes anderes Bein (nur Kontext). Landmarken sind rahmenlokal; Ursprünge: B/F Hüftzentrum, P Patellamitte,
   T Kniezentrum, A Sprunggelenkzentrum (Talusrolle), C Subtalargelenk. Maße eines Erwachsenen (≈ 1,78 m, 75 kg). */
const AN={};
AN.mid=-9;                         // Körpermitte (x): Hüftabstand 18 cm
AN.hip=V3(0,0,0);                  // Hüftzentrum (Femurkopf)
AN.headR=2.4;                      // Femurkopfradius
AN.knee=V3(0,-43,-0.3);            // Kniezentrum (Beugeachse), femurlokal
AN.femLen=43; AN.tibLen=41;        // Hüfte → Knie, Knie → Sprunggelenk
AN.ankle=V3(0,-41,0);              // Sprunggelenkzentrum, tibialokal
AN.subtalar=V3(0,-2.0,-1.0);       // Subtalargelenk, taluslokal (= Ursprung C)
AN.groundY=-91.2;                  // Bodenhöhe (Sohle) im Stand, Weltkoordinaten
AN.GT={c:V3(6.0,-2.0,-0.8),r:V3(2.0,2.8,2.0)};        // Trochanter major
AN.LT={c:V3(2.4,-5.4,1.4),r:V3(0.9,1.2,0.9)};         // Trochanter minor
AN.condM={c:V3(-2.2,-43.2,-0.6),r:2.3};               // medialer Femurkondylus (Kugel)
AN.condL={c:V3(2.3,-43.0,-0.6),r:2.25};               // lateraler Femurkondylus
AN.trochlea={c:V3(0,-41.4,1.7),r:V3(2.4,2.6,1.5)};    // Trochlea (Patellagleitlager)
AN.epiL=V3(4.4,-42.6,0.2); AN.epiM=V3(-4.5,-42.8,-0.3); AN.addTub=V3(-4.0,-40.5,-0.8);
AN.plateau={c:V3(0,-0.6,0),r:V3(3.9,0.8,2.7)};        // Tibiaplateau, tibialokal
AN.TT=V3(0,-5.2,3.6);                                  // Tuberositas tibiae
AN.gerdy=V3(3.0,-3.0,2.2);                             // Tuberculum Gerdy (Tractus-Ansatz)
AN.pes=V3(-2.3,-6.2,2.1);                              // Pes anserinus
AN.fibHead=V3(3.9,-3.5,-1.5); AN.LM=V3(3.4,-42.8,-0.5); AN.MM=V3(-3.0,-41.5,-0.2);   // Fibulakopf, Malleolus lateralis/medialis
AN.tibAntRim=V3(0,-39.6,2.0); AN.tibPostRim=V3(0,-39.8,-1.9);   // vorderer/hinterer Tibiarand am Sprunggelenk
AN.talusNeck=V3(0,0.2,2.8); AN.talusPost=V3(0,-0.2,-2.5);       // Talushals (vorderes Impingement), Processus posterior (Os trigonum)
AN.subtalarAxis=V3(0,Math.sin(42*DEG),Math.cos(42*DEG));         // Subtalarachse: 42° zur Horizontalen, nach vorn-oben
AN.calcTuber=V3(0,-1.5,-6.5);                          // Tuber calcanei (Achillessehnenansatz), fußlokal
AN.heel=V3(0,-4.7,-7.0); AN.mtHeads=V3(0,-5.2,12.5);   // Fersenauflage, Mittelfußköpfchen (Sohle), fußlokal
AN.navic=V3(-2.2,-3.0,3.4); AN.cuboid=V3(2.2,-3.8,2.5);
AN.patSup=V3(0,2.3,0.4); AN.patApex=V3(0,-2.4,0.2);   // Patella: oberer Pol (Quadrizepssehne), Spitze (Patellarsehne)
AN.patR0=6.6; AN.patPhi0=46;                           // Patellabahn: Radius um das Kniezentrum, Winkel über der Horizontalen in Streckung
AN.trunkCOM=V3(0,34,2.0);                              // Rumpf + Kopf + Arme (Schwerpunkt ≈ Th10), rumpflokal (Ursprung Beckenmitte)
AN.trunkOrigin=V3(-9,5,-3);                            // Rumpfursprung (L5/S1), beckenlokal

/* Landmarke in Knochen-lokalen Koordinaten. f: B Becken, U Rumpf, F Femur, P Patella, T Tibia, A Talus, C Fuß */
function L(f,x,y,z,opt={}){
  let v=(x instanceof THREE.Vector3)?x.clone():V3(x,y,z);
  if(x instanceof THREE.Vector3){ opt=y||{}; }
  return {f,v,w:opt.t?0:1,z:opt.z||0};
}
const B_=(x,y,z,o)=>L('B',x,y,z,o), F_=(x,y,z,o)=>L('F',x,y,z,o), P_=(x,y,z,o)=>L('P',x,y,z,o), T_=(x,y,z,o)=>L('T',x,y,z,o), A_=(x,y,z,o)=>L('A',x,y,z,o), C_=(x,y,z,o)=>L('C',x,y,z,o), U_=(x,y,z,o)=>L('U',x,y,z,o);
const TEND={t:1}, zMEN={t:1,z:5}, zITB={t:1,z:6}, zNRV={z:7};
/* Wrapping-Kugeln (rahmenlokal) */
const WRAP_KNEE={f:'F',v:V3(0,-43,-0.5),r:2.9};        // hintere Kondylen (Hamstrings, Gastrocnemius)
const WRAP_CONDM={f:'F',v:AN.condM.c,r:2.6};
const WRAP_EPI={f:'F',v:V3(4.6,-42.6,0.2),r:1.6};       // lateraler Epikondylus (Tractus)
const WRAP_GT={f:'F',v:AN.GT.c,r:2.6};
const WRAP_LM={f:'T',v:V3(3.4,-42.5,-0.6),r:1.3};
const WRAP_MM={f:'T',v:V3(-3.0,-41.5,-0.3),r:1.1};
const WRAP_HEEL={f:'C',v:V3(0,-2.6,-3.6),r:2.4};

/* ===================== Strukturen =====================
   kind: muscle | lig | nerve. fas: Landmarken (w=1 Bauch, w=0 Sehne, z Zonenmarker). r: Bauchradius. wrap: Kugeln.
   pcsa: relative Kraftfähigkeit (Kraftverteilung), joints: welche Gelenke der Muskel überspannt. */
const STRUCT=[
 /* ---- Hüfte ---- */
 {id:'iliopsoas',name:'Iliopsoas',group:'hip',kind:'muscle',r:1.1,pcsa:2.2,joints:['hip'],
  fas:[[U_(3.0,4.0,3.0),B_(-3.5,1.5,4.6),B_(0.5,-1.5,4.2,TEND),F_(2.3,-5.4,1.5,TEND)]]},
 {id:'glutMax',name:'Glutaeus maximus',group:'hip',kind:'muscle',r:1.5,pcsa:3.0,joints:['hip'],wrap:[WRAP_GT],layer:4,
  fas:[[B_(-6.0,6.5,-8.0),B_(-2.0,0.0,-7.5),F_(4.8,-9.0,-2.0,TEND)],[B_(-5.0,3.0,-8.5),B_(0.5,-2.5,-7.0),F_(6.4,-10.5,-0.6,TEND)]]},
 {id:'glutMed',name:'Glutaeus medius',group:'hip',kind:'muscle',r:1.2,pcsa:2.4,joints:['hip'],layer:4,
  fas:[[B_(2.5,10.5,-2.0),B_(4.8,4.5,-1.6),F_(6.0,-0.2,-0.6,TEND)],[B_(4.0,9.0,2.0),B_(5.5,4.0,0.5),F_(6.2,-0.4,0.0,TEND)]]},
 {id:'tfl',name:'Tensor fasciae latae · Tractus iliotibialis',group:'hip',kind:'muscle',r:0.75,pcsa:0.6,joints:['hip','knee'],wrap:[WRAP_EPI],layer:1,
  fas:[[B_(3.4,7.6,4.0),F_(7.0,-5.0,2.3),F_(6.9,-16,0.6,TEND),F_(6.7,-28,-0.2,TEND),F_(6.4,-36,-0.6,zITB),T_(3.1,-3.0,2.2,zITB)]]},
 {id:'addMag',name:'Adductor magnus',group:'hip',kind:'muscle',r:1.2,pcsa:2.5,joints:['hip'],layer:4,
  fas:[[B_(-5.0,-4.5,-2.5),F_(-1.5,-22,-1.8),F_(-4.0,-40.5,-0.8,TEND)],[B_(-7.5,-3.0,2.5),F_(-1.0,-18,-0.5,TEND)]]},
 /* ---- Quadrizeps ---- */
 {id:'rectF',name:'Rectus femoris',group:'quad',kind:'muscle',r:1.2,pcsa:1.8,joints:['hip','knee'],layer:1,
  fas:[[B_(1.5,4.0,5.5,TEND),F_(1.5,-10,4.0),F_(1.0,-25,4.6),F_(0.4,-35,4.2,TEND),P_(0,2.3,0.4,TEND)]]},
 {id:'vastL',name:'Vastus lateralis',group:'quad',kind:'muscle',r:1.5,pcsa:3.5,joints:['knee'],
  fas:[[F_(4.5,-9.0,-0.5),F_(4.2,-22,2.6),F_(2.6,-34,3.8,TEND),P_(1.4,2.0,0.3,TEND)]]},
 {id:'vastM',name:'Vastus medialis',group:'quad',kind:'muscle',r:1.4,pcsa:2.6,joints:['knee'],
  fas:[[F_(-1.5,-14,-0.8),F_(-3.0,-28,2.2),F_(-2.6,-37,3.6,TEND),P_(-1.4,1.6,0.3,TEND)]]},
 /* ---- Hamstrings & Pes anserinus ---- */
 {id:'bicF',name:'Biceps femoris (langer Kopf)',group:'ham',kind:'muscle',r:1.2,pcsa:1.6,joints:['hip','knee'],wrap:[WRAP_KNEE],
  fas:[[B_(-3.5,-5.5,-5.0,TEND),F_(2.5,-20,-3.5),F_(3.8,-34,-3.2,TEND),T_(3.9,-3.4,-1.6,TEND)]]},
 {id:'semimem',name:'Semimembranosus',group:'ham',kind:'muscle',r:1.2,pcsa:2.0,joints:['hip','knee'],wrap:[WRAP_KNEE],
  fas:[[B_(-3.8,-5.2,-5.2,TEND),F_(-2.5,-22,-3.4),F_(-3.4,-36,-3.0,TEND),T_(-3.0,-2.6,-1.6,TEND)]]},
 {id:'semitend',name:'Semitendinosus',group:'ham',kind:'muscle',r:0.9,pcsa:1.0,joints:['hip','knee'],wrap:[WRAP_CONDM],
  fas:[[B_(-3.2,-5.8,-4.6,TEND),F_(-1.8,-22,-4.2),F_(-3.2,-38,-2.6,TEND),T_(-2.2,-6.2,2.0,TEND)]]},
 {id:'sart',name:'Sartorius',group:'medial',kind:'muscle',r:0.6,pcsa:0.3,joints:['hip','knee'],
  fas:[[B_(3.2,7.2,4.6),F_(-0.5,-12,4.5),F_(-3.5,-30,1.5),F_(-4.6,-40,-0.6,TEND),T_(-2.4,-6.0,2.2,TEND)]]},
 {id:'gracilis',name:'Gracilis',group:'medial',kind:'muscle',r:0.6,pcsa:0.3,joints:['hip','knee'],
  fas:[[B_(-8.5,-2.5,5.0),F_(-4.5,-20,0.5),F_(-4.8,-38,-0.8,TEND),T_(-2.3,-6.4,2.1,TEND)]]},
 /* ---- Unterschenkel ---- */
 {id:'gastroM',name:'Gastrocnemius, Caput mediale',group:'calf',kind:'muscle',r:1.5,pcsa:2.4,joints:['knee','ankle'],wrap:[WRAP_KNEE],
  fas:[[F_(-2.4,-41.5,-2.6,TEND),T_(-1.6,-8,-3.6),T_(-1.0,-18,-3.8),T_(-0.4,-28,-3.0,TEND),T_(0,-36,-2.6,TEND),C_(0,-1.5,-6.5,TEND)]]},
 {id:'gastroL',name:'Gastrocnemius, Caput laterale',group:'calf',kind:'muscle',r:1.2,pcsa:1.2,joints:['knee','ankle'],wrap:[WRAP_KNEE],
  fas:[[F_(2.6,-41.5,-2.5,TEND),T_(1.8,-8,-3.5),T_(1.2,-18,-3.6),T_(0.5,-28,-3.0,TEND),T_(0.1,-36,-2.6,TEND),C_(0.1,-1.5,-6.5,TEND)]]},
 {id:'soleus',name:'Soleus · Achillessehne',group:'calf',kind:'muscle',r:1.6,pcsa:4.0,joints:['ankle'],
  fas:[[T_(2.4,-6.0,-2.4),T_(0.6,-16,-3.4),T_(0.0,-30,-2.9,TEND),T_(0,-38,-2.5,TEND),C_(0,-1.5,-6.5,TEND)]]},
 {id:'tibAnt',name:'Tibialis anterior',group:'shin',kind:'muscle',r:1.0,pcsa:1.2,joints:['ankle'],
  fas:[[T_(1.4,-8,1.6),T_(0.7,-22,1.7),T_(0.2,-34,1.6,TEND),T_(-0.6,-41,1.6,TEND),C_(-1.8,-3.6,4.5,TEND)]]},
 {id:'tibPost',name:'Tibialis posterior',group:'shin',kind:'muscle',r:0.9,pcsa:1.4,joints:['ankle'],wrap:[WRAP_MM],
  fas:[[T_(0.5,-10,-2.2),T_(-1.5,-30,-1.6,TEND),T_(-3.3,-41.0,-1.0,TEND),C_(-2.2,-3.0,3.4,TEND)]]},
 {id:'peron',name:'Peroneus longus',group:'shin',kind:'muscle',r:0.9,pcsa:1.2,joints:['ankle'],wrap:[WRAP_LM],
  fas:[[T_(3.8,-6.0,-1.2),T_(3.6,-22,-1.4),T_(3.5,-36,-1.3,TEND),T_(3.7,-43.2,-1.5,TEND),C_(2.2,-3.8,2.5,TEND),C_(-1.6,-4.8,5.0,TEND)]]},
 /* ---- Bänder Knie ---- */
 {id:'ACL',name:'Vorderes Kreuzband (AM · PL)',group:'joint',kind:'lig',r:0.32,
  fas:[[F_(1.1,-43.5,-1.4),T_(-0.3,-0.9,1.5)],[F_(1.3,-44.4,-1.0),T_(0.3,-1.0,0.9)]]},
 {id:'PCL',name:'Hinteres Kreuzband',group:'joint',kind:'lig',r:0.34,
  fas:[[F_(-1.0,-43.6,0.3),T_(0,-1.6,-2.2)],[F_(-0.8,-44.3,0.6),T_(0.4,-1.9,-2.4)]]},
 {id:'MCL',name:'Innenband (MCL)',group:'joint',kind:'lig',r:0.3,
  fas:[[F_(-4.5,-42.8,-0.3),T_(-3.4,-7.0,0.4)],[F_(-4.4,-43.4,-1.0),T_(-3.6,-2.2,-0.6)]]},
 {id:'LCL',name:'Außenband (LCL)',group:'joint',kind:'lig',r:0.28,
  fas:[[F_(4.4,-42.6,-0.3),T_(3.9,-3.6,-1.4)]]},
 {id:'patTen',name:'Patellarsehne',group:'joint',kind:'lig',r:0.55,static:true,
  fas:[[P_(0,-2.4,0.2),T_(0,-5.2,3.6)]]},
 {id:'menisci',name:'Menisken (medial · lateral)',group:'joint',kind:'lig',r:0.45,static:true,
  fas:[[T_(-1.2,-0.3,2.3),T_(-3.2,-0.3,1.6,TEND),T_(-4.2,-0.3,0.0,TEND),T_(-3.4,-0.3,-1.8,zMEN),T_(-1.6,-0.3,-2.6,zMEN)],
       [T_(1.0,-0.3,2.2),T_(3.0,-0.3,1.5,TEND),T_(3.9,-0.3,0.0,TEND),T_(3.2,-0.3,-1.7,zMEN),T_(1.5,-0.3,-2.5,zMEN)]]},
 /* ---- Bänder Sprunggelenk & Fuß ---- */
 {id:'atfl',name:'Lig. talofibulare anterius (ATFL)',group:'ankle',kind:'lig',r:0.26,
  fas:[[T_(3.3,-41.2,0.6),A_(1.9,-1.2,2.0)]]},
 {id:'cfl',name:'Lig. calcaneofibulare (CFL)',group:'ankle',kind:'lig',r:0.26,
  fas:[[T_(3.4,-43.0,-0.5),C_(2.0,-3.2,-0.8)]]},
 {id:'ptfl',name:'Lig. talofibulare posterius (PTFL)',group:'ankle',kind:'lig',r:0.24,
  fas:[[T_(3.0,-42.3,-1.4),A_(1.2,-0.6,-2.2)]]},
 {id:'deltoid',name:'Deltaband (medial)',group:'ankle',kind:'lig',r:0.3,
  fas:[[T_(-3.0,-42.0,0.0),C_(-1.6,-0.4,-1.2)],[T_(-3.0,-41.8,0.5),C_(-2.0,-2.6,3.2)]]},
 {id:'plantar',name:'Plantarfaszie',group:'ankle',kind:'lig',r:0.3,static:true,
  fas:[[C_(0,-4.2,-5.5),C_(0,-4.9,3.0,TEND),C_(0,-4.8,12.0,TEND)]]},
 /* ---- Nerv ---- */
 {id:'nPer',name:'N. peroneus communis (Fibulakopf)',group:'nerve',kind:'nerve',r:0.2,
  fas:[[B_(-2.5,-4.0,-4.8),F_(0.5,-16,-4.6),F_(2.6,-36,-3.6),T_(4.3,-5.6,-1.0,zNRV),T_(2.8,-9.5,1.0)]]},
];
const STRUCT_BY_ID={}; STRUCT.forEach(s=>STRUCT_BY_ID[s.id]=s);

/* ===================== Schichten (UI) – Reihenfolge nur anhängen (Index in Kurz-Links) ===================== */
const LAYER_GROUPS=[
 {id:'bones',name:'Knochen',color:'#e9dfcf',items:[['pelvis','Becken & Rumpf'],['femur','Femur'],['patella','Patella'],['tibia','Tibia & Fibula'],['foot','Talus, Calcaneus & Fuß'],['other','Anderes Bein (Kontext)'],['ground','Boden']]},
 {id:'joint',name:'Knie: Bänder & Menisken',color:'#d9d0e6',items:[['ACL','Vorderes Kreuzband'],['PCL','Hinteres Kreuzband'],['MCL','Innenband'],['LCL','Außenband'],['patTen','Patellarsehne'],['menisci','Menisken'],['hoffa','Hoffa-Fettkörper']]},
 {id:'ankle',name:'Sprunggelenk & Fuß',color:'#d9d0e6',items:[['atfl','ATFL'],['cfl','CFL'],['ptfl','PTFL'],['deltoid','Deltaband'],['plantar','Plantarfaszie']]},
 {id:'quad',name:'Quadrizeps',color:'#b5766a',items:[['rectF','Rectus femoris'],['vastL','Vastus lateralis'],['vastM','Vastus medialis']]},
 {id:'ham',name:'Hamstrings',color:'#b5766a',items:[['bicF','Biceps femoris'],['semimem','Semimembranosus'],['semitend','Semitendinosus']]},
 {id:'hip',name:'Hüfte',color:'#b5766a',items:[['iliopsoas','Iliopsoas'],['glutMax','Glutaeus maximus'],['glutMed','Glutaeus medius'],['tfl','Tensor · Tractus'],['addMag','Adductor magnus']]},
 {id:'medial',name:'Pes anserinus',color:'#b5766a',items:[['sart','Sartorius'],['gracilis','Gracilis']]},
 {id:'calf',name:'Wade',color:'#b5766a',items:[['gastroM','Gastrocnemius medial'],['gastroL','Gastrocnemius lateral'],['soleus','Soleus · Achillessehne']]},
 {id:'shin',name:'Unterschenkel vorn/seitlich',color:'#b5766a',items:[['tibAnt','Tibialis anterior'],['tibPost','Tibialis posterior'],['peron','Peroneus longus']]},
 {id:'nerve',name:'Nerven',color:'#f4d35e',items:[['nPer','N. peroneus communis']]},
];

/* ===================== Beschreibungen ===================== */
const INFO={
 iliopsoas:{k:'Muskel + Sehne',f:'Kräftigster Hüftbeuger (Psoas von der Lendenwirbelsäule, Iliacus aus der Beckenschaufel) zum Trochanter minor; richtet den Rumpf im Sitzen auf.',p:'Verkürzung bei viel Sitzen → Beckenkippung nach vorn, Hohlkreuz; schnappende Hüfte (Sehne über der Eminentia iliopubica); Hüftbeugerschmerz bei Sprintern.',t:'Thomas-Test (Hüftstreckung eingeschränkt), Beugung gegen Widerstand im Sitzen.'},
 glutMax:{k:'Muskel',f:'Hüftstreckung und Außenrotation, besonders aus der Beugung (Aufstehen, Treppe, Sprint); obere Fasern ziehen in den Tractus.',p:'Schwäche („Gluteal-Amnesie“) verlagert Arbeit auf Hamstrings und Rücken; Bursitis trochanterica.',t:'Hüftstreckung in Bauchlage, einbeinige Brücke.'},
 glutMed:{k:'Muskel',f:'Hüftabduktion und Beckenstabilisierung im Einbeinstand: hält das Becken waagerecht (Kraftpaar mit dem Körpergewicht).',p:'Schwäche → Trendelenburg-Zeichen, Knievalgus beim Landen/Kniebeugen, Tractus-Überlastung, Bursitis.',t:'Trendelenburg-Test, Einbein-Kniebeuge (Knie fällt nach innen?).'},
 tfl:{k:'Muskel + Tractus iliotibialis',f:'Spannt den Tractus, der außen am Oberschenkel bis zum Tuberculum Gerdy zieht; Hüftbeugung/Abduktion, Kniestabilisierung. Der Tractus gleitet bei 20–30° Beugung über den lateralen Epikondylus.',p:'Tractus-Syndrom („Läuferknie“): Reizung über dem Epikondylus, verstärkt durch Valgus, Innenrotation, schwache Abduktoren.',t:'Ober-Test (Tractus-Verkürzung), Noble-Test (Druck auf den Epikondylus bei 30° Beugung).'},
 addMag:{k:'Muskel',f:'Adduktion, hinterer Anteil streckt die Hüfte (Sitz am Adduktorenhöcker); wichtig beim Cutting und in der tiefen Kniebeuge.',p:'Adduktorenzerrung (Fußball, Eishockey), Ansatzreizung am Schambein.',t:'Adduktion gegen Widerstand, Squeeze-Test.'},
 rectF:{k:'Muskel + Sehne (zweigelenkig)',f:'Vom Becken (Spina iliaca anterior inferior) über die Patella zur Tuberositas tibiae: Hüftbeugung und Kniestreckung. Wird in Hüftstreckung + Kniebeugung maximal gedehnt.',p:'Zerrung bei Sprint/Schuss, Apophysitis am Becken (Jugendliche), Anteil an Patellaspitzensyndrom.',t:'Ely-Test (Fersen zum Gesäß in Bauchlage), modifizierter Thomas-Test.'},
 vastL:{k:'Muskel + Sehne',f:'Größter Kniestrecker, zieht die Patella nach lateral-proximal.',p:'Überwiegen gegenüber dem Vastus medialis begünstigt Patellalateralisation und vorderen Knieschmerz.',t:'Kniestreckung gegen Widerstand.'},
 vastM:{k:'Muskel + Sehne',f:'Kniestrecker; die schrägen Fasern (VMO) halten die Patella im Gleitlager und sind in den letzten 20° der Streckung wichtig.',p:'Atrophie nach Verletzung/Erguss innerhalb von Tagen; Schwäche → Patellalateralisation.',t:'Endgradige Streckung, Einbein-Kniebeuge.'},
 bicF:{k:'Muskel + Sehne (zweigelenkig)',f:'Hüftstreckung, Kniebeugung, Außenrotation des Unterschenkels; Ansatz am Fibulakopf neben dem N. peroneus.',p:'Häufigster Hamstring-Riss (Sprint, Endphase Schwung), Ansatztendinopathie am Fibulakopf.',t:'Kniebeugung gegen Widerstand in Bauchlage, Dehnung bei Hüftbeugung + Kniestreckung.'},
 semimem:{k:'Muskel + Sehne (zweigelenkig)',f:'Hüftstreckung, Kniebeugung, Innenrotation des Unterschenkels; zieht das Hinterhorn des Innenmeniskus bei Beugung nach hinten.',p:'Ansatztendinopathie, Baker-Zyste (Bursa zwischen Semimembranosus und Gastrocnemius).',t:'Kniebeugung mit Innenrotation gegen Widerstand.'},
 semitend:{k:'Muskel + Sehne (zweigelenkig)',f:'Lange Sehne zum Pes anserinus; Hüftstreckung, Kniebeugung, Innenrotation. Häufig als Transplantat für den Kreuzbandersatz genutzt.',p:'Pes-anserinus-Bursitis (medialer Schienbeinkopf), Kraftverlust nach Transplantatentnahme.',t:'Kniebeugung gegen Widerstand, Druckschmerz am Pes anserinus.'},
 sart:{k:'Muskel (zweigelenkig)',f:'Längster Muskel: Hüftbeugung, -abduktion, -außenrotation und Kniebeugung („Schneidersitz“); Teil des Pes anserinus.',p:'Selten isoliert; Pes-anserinus-Schmerz.',t:'Schneidersitz-Bewegung gegen Widerstand.'},
 gracilis:{k:'Muskel (zweigelenkig)',f:'Adduktion und Kniebeugung; Teil des Pes anserinus, Transplantat bei Kreuzbandersatz.',p:'Adduktorenzerrung, Pes-anserinus-Schmerz.',t:'Adduktion gegen Widerstand mit gebeugtem Knie.'},
 gastroM:{k:'Muskel + Achillessehne (zweigelenkig)',f:'Plantarflexion und Kniebeugung; von den hinteren Femurkondylen zum Fersenbein. Bei gestrecktem Knie maximal gedehnt und kraftvoll (Absprung).',p:'„Tennis leg“ (Riss des medialen Kopfes), Wadenkrämpfe, Achillessehnentendinopathie.',t:'Wadenheben mit gestrecktem Knie, Dehnung an der Wand.'},
 gastroL:{k:'Muskel + Achillessehne (zweigelenkig)',f:'Plantarflexion und Kniebeugung, lateraler Anteil.',p:'Seltener verletzt als der mediale Kopf.',t:'Wadenheben mit gestrecktem Knie.'},
 soleus:{k:'Muskel + Achillessehne',f:'Kräftigster Plantarflexor (große Querschnittsfläche), hält den Unterschenkel im Stand gegen das Vorkippen; nur eingelenkig.',p:'Achillessehnentendinopathie (Mitte oder Ansatz), Ruptur beim Antritt (30–50 Jahre), Soleus-Zerrung bei Läufern.',t:'Wadenheben mit gebeugtem Knie, Thompson-Test bei Verdacht auf Ruptur.'},
 tibAnt:{k:'Muskel + Sehne',f:'Dorsalextension und Supination; bremst den Fuß nach dem Fersenkontakt ab (exzentrisch).',p:'Schienbeinkantensyndrom (vorn), Fußheberschwäche bei Peroneuslähmung, Sehnenruptur (selten).',t:'Fersengang, Dorsalextension gegen Widerstand.'},
 tibPost:{k:'Muskel + Sehne',f:'Plantarflexion, Inversion und Stütze des Längsgewölbes; die Sehne läuft hinter dem Innenknöchel zum Kahnbein.',p:'Tibialis-posterior-Dysfunktion → erworbener Knick-Senkfuß, mediales Schienbeinkantensyndrom.',t:'Einbeiniges Wadenheben (Ferse dreht nach innen?), „too many toes“-Zeichen.'},
 peron:{k:'Muskel + Sehne',f:'Eversion und Plantarflexion; die Sehne läuft hinter dem Außenknöchel unter den Fuß zum ersten Mittelfußknochen und sichert gegen das Umknicken.',p:'Peronealsehnen-Luxation/-Tendinopathie, Schwäche nach Supinationstrauma (Rezidivgefahr).',t:'Eversion gegen Widerstand, Sehnenverlauf hinter dem Außenknöchel.'},
 ACL:{k:'Band (Kreuzband)',f:'Verhindert das Vorgleiten und die Innenrotation der Tibia. Anteromediales Bündel (AM) über den ganzen Bewegungsumfang, posterolaterales (PL) vor allem in Streckung. Größte Last nahe Streckung mit Quadrizepszug (Schub der Patellarsehne) sowie bei Valgus + Innenrotation.',p:'Ruptur beim Landen/Cutting ohne Gegnerkontakt (Valgus + Innenrotation + fast gestrecktes Knie), Instabilität („giving way“), Folgeschäden an Meniskus und Knorpel.',t:'Lachman-Test (25°), vorderer Schubladentest (90°), Pivot-Shift.'},
 PCL:{k:'Band (Kreuzband)',f:'Verhindert das Zurückgleiten der Tibia; trägt in tiefer Beugung und beim Abbremsen bergab.',p:'Ruptur durch Anprall der Tibia (Armaturenbrett, Sturz auf das gebeugte Knie); hintere Schublade.',t:'Hinterer Schubladentest (90°), Sag-Zeichen.'},
 MCL:{k:'Band',f:'Sichert gegen Valgus (Aufklappen nach innen) und Außenrotation; oberflächlicher Anteil lang, tiefer Anteil mit dem Innenmeniskus verbunden.',p:'Häufigste Bandverletzung des Knies (Valgusstress, Ski, Kontakt); meist konservativ heilend.',t:'Valgusstress bei 0° und 30°.'},
 LCL:{k:'Band',f:'Sichert gegen Varus; vom lateralen Epikondylus zum Fibulakopf, Teil der posterolateralen Ecke.',p:'Varusverletzung, posterolaterale Instabilität, oft mit Peroneusläsion.',t:'Varusstress bei 30°.'},
 patTen:{k:'Sehne (Lig. patellae)',f:'Überträgt die Quadrizepskraft von der Patella auf die Tuberositas tibiae; die Kraft entspricht 0,6–1,0 × Quadrizepskraft je nach Beugewinkel.',p:'Patellaspitzensyndrom („Jumper’s Knee“) bei Sprungsport (Kraft 6–8 × Körpergewicht beim Absprung), Ruptur bei Vorschädigung, Osgood-Schlatter an der Tuberositas (Jugendliche).',t:'Druckschmerz an der Patellaspitze, Absprung/Landung, Decline-Squat.'},
 menisci:{k:'Faserknorpel',f:'Verteilen die Last zwischen den runden Femurkondylen und dem flachen Tibiaplateau (Kontaktfläche ↑, Druck ↓) und stabilisieren. In tiefer Beugung werden die Hinterhörner nach hinten gedrängt und komprimiert.',p:'Degenerativer Riss (Hinterhorn medial, > 40 Jahre), traumatischer Riss (Drehung unter Last), Einklemmung („Blockierung“).',t:'McMurray, Thessaly, tiefe Hocke schmerzhaft, Gelenkspaltdruckschmerz.'},
 hoffa:{k:'Fettkörper',f:'Füllt den Raum hinter der Patellarsehne, stark schmerzempfindlich innerviert; puffert bei Streckung.',p:'Hoffa-Impingement bei Hyperextension oder nach Arthroskopie, vorderer Knieschmerz.',t:'Hoffa-Zeichen (Druck neben der Patellarsehne bei Streckung).'},
 atfl:{k:'Band',f:'Vom Außenknöchel zum Talushals; spannt sich bei Plantarflexion + Inversion – das klassische Umknicken.',p:'Häufigstes verletztes Band überhaupt (Supinationstrauma); chronische Instabilität bei fehlender Rehabilitation.',t:'Vorderer Schubladentest des Sprunggelenks, Druckschmerz vor dem Außenknöchel.'},
 cfl:{k:'Band',f:'Vom Außenknöchel zum Fersenbein; spannt sich bei Inversion, besonders in Dorsalextension; überbrückt auch das Subtalargelenk.',p:'Zweites Band beim schweren Supinationstrauma (Grad II–III).',t:'Talar-Tilt-Test (Inversionsstress).'},
 ptfl:{k:'Band',f:'Kräftigstes Außenband, vom Außenknöchel zum Talus hinten; spannt sich in Dorsalextension.',p:'Selten verletzt (nur bei Luxation).',t:'–'},
 deltoid:{k:'Band (mehrschichtig)',f:'Innenband vom Innenknöchel zu Talus, Kahnbein und Fersenbein; sichert gegen Eversion und Außenrotation, stützt das Längsgewölbe.',p:'Pronationstrauma, Begleitverletzung bei Außenknöchelfraktur, Überlastung beim Knick-Senkfuß.',t:'Eversionsstress, Druckschmerz unter dem Innenknöchel.'},
 plantar:{k:'Faszie',f:'Spannt das Längsgewölbe vom Fersenbein zu den Zehen; Windlass-Mechanismus: Zehenstreckung spannt die Faszie und hebt das Gewölbe (Abstoßphase).',p:'Plantarfasziitis (Anlaufschmerz an der Ferse), Fersensporn, Ruptur (selten).',t:'Druck am medialen Fersenbeinhöcker, Dehnung mit Zehenstreckung (Windlass-Test).'},
 nPer:{k:'Nerv',f:'Läuft um den Fibulahals in die Unterschenkelloge; versorgt Fußheber und Fußaußenrand. Dort oberflächlich und druckgefährdet.',p:'Druckläsion (Gips, übereinandergeschlagene Beine, Lagerung) → Fußheberschwäche (Steppergang); Dehnung bei Slump-Position (Hüftbeugung, Kniestreckung, Plantarflexion + Inversion).',t:'Tinel am Fibulakopf, Slump-Test, Fersengang.'},
 pelvis:{k:'Knochen (Kontext)',f:'Becken mit Hüftpfanne; der Rumpf darüber wird bei Bodenkontakt automatisch so geneigt, dass der Körperschwerpunkt über dem Fuß bleibt (Gleichgewicht).',p:'Beckenkippung und Rumpfneigung bestimmen die Hüft- und Kniemomente: aufrechter Rumpf → mehr Knielast, vorgeneigter Rumpf → mehr Hüft- und Rückenlast.',t:''},
 femur:{k:'Knochen',f:'Femurkopf (Kugel, r ≈ 2,4 cm), Schenkelhals (125° zum Schaft), Trochanter major (Abduktoren) und minor (Iliopsoas), Schaft mit Linea aspera (Vasti, Adduktoren), Kondylen (Kugelflächen r ≈ 2,3 cm) mit Trochlea für die Patella.',p:'Schenkelhalsfraktur (Alter), Hüftimpingement (Cam am Kopf-Hals-Übergang), Knorpelschaden an den Kondylen.',t:''},
 patella:{k:'Knochen (Sesambein)',f:'Vergrößert den Hebelarm des Quadrizeps; gleitet mit zunehmender Beugung von der Trochlea auf die Kondylen (Eingriff ab ≈ 20°). Kontaktfläche und -kraft steigen mit der Beugung; der Druck ist bei 60–90° am höchsten.',p:'Patellofemoraler Schmerz (häufigste Knie-Diagnose bei jungen Erwachsenen), Chondromalazie, Lateralisation/Luxation bei flacher Trochlea.',t:'Zohlen-Zeichen, Kniebeuge/Treppe abwärts schmerzhaft, Apprehension-Test der Patella.'},
 tibia:{k:'Knochen',f:'Tibiaplateau (medial größer, konkav; lateral konvex) mit Eminentia (Kreuzbandansätze), Tuberositas tibiae (Patellarsehne), Tuberculum Gerdy (Tractus), Pes anserinus medial; Fibula trägt kaum Last, bildet den Außenknöchel.',p:'Tibiakopffraktur, Stressfraktur, Osgood-Schlatter, Fibulakopf: N. peroneus.',t:''},
 foot:{k:'Knochen',f:'Talus (Rolle im Knöchelgabel: Dorsal-/Plantarflexion), Calcaneus (Subtalargelenk: Inversion/Eversion, Achillessehnenansatz), Mittel- und Vorfuß (Gewölbe, Abdruck über die Mittelfußköpfchen).',p:'Sprunggelenkarthrose nach Fraktur, vorderes Impingement (Fußballer: Osteophyten am Tibiavorderrand), hinteres Impingement (Os trigonum, Ballett).',t:''},
 other:{k:'Kontext',f:'Das andere Bein spiegelt die Pose (beidbeinige Übungen). Bei einbeiniger Belastung (Gewichtsanteil 100 %) trägt es nichts.',p:'',t:''},
 ground:{k:'Kontext',f:'Boden bei Bodenkontakt: Die Bodenreaktionskraft (Gewichtsanteil × Körpergewicht) greift unter dem Fuß an und erzeugt die Gelenkmomente.',p:'',t:''},
};

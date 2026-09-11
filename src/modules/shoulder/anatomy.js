/* ===================== Anatomie der rechten Schulter =====================
   Einheiten cm. +X lateral (rechts vom Patienten), +Y kranial, +Z ventral.
   Ursprung = Zentrum des Humeruskopfes in Ruhe (Arm hängend). Landmarken nach Standard-Anatomie (Erwachsener). */
const AN={};
AN.SC=V3(-16.5,3.6,6.0);        // Sternoklavikulargelenk (Drehpunkt Klavikula)
AN.AC=V3(-1.4,4.2,1.5);         // Akromioklavikulargelenk (Drehpunkt Skapula)
AN.GH=V3(0,0,0);                // glenohumerales Drehzentrum
AN.headR=2.4;                   // Humeruskopf-Radius
AN.elbow=V3(0,-30,0.3);         // Ellbogenzentrum (Humerus-lokal)
AN.ulnaHead=V3(-0.9,-25.5,-0.3);// Caput ulnae (Unterarm-lokal) = Drehpunkt Hand/Radius
AN.radHead=V3(1.6,-0.8,0.4);    // Caput radii (Unterarm-lokal)
AN.mid=-18;                     // Körpermitte (x)
// Skapulaebene (≈35° zur Frontalebene): Ursprung an der Cavitas glenoidalis
AN.sO=V3(-2.5,0,-0.2); AN.sU=V3(0.817,0,0.577); AN.sV=V3(0,1,0); AN.sN=V3(0.577,0,-0.817);
const scw=v=>0.18*Math.max(0,-v);      // unterer Skapulakörper folgt der Thoraxwölbung nach dorsal
function sc(u,v,w=0){ return AN.sO.clone().addScaledVector(AN.sU,u).addScaledVector(AN.sV,v).addScaledVector(AN.sN,w+scw(v)); }
// Thorax als Querschnitts-Stapel (Halbbreite rx, Halbtiefe rz, Zentrum cz)
AN.thorax=[{y:9,rx:4.2,rz:4.2,cz:-1.6},{y:5,rx:7.6,rz:5.8,cz:-1.2},{y:0,rx:10.6,rz:8.0,cz:0.4},{y:-6,rx:13.0,rz:9.6,cz:1.5},{y:-12,rx:14.0,rz:10.5,cz:2.0},{y:-18,rx:14.0,rz:10.4,cz:2.0},{y:-25,rx:12.8,rz:9.8,cz:1.4}];
function thoraxSec(y){
  const s=AN.thorax; if(y>=s[0].y) return s[0]; if(y<=s[s.length-1].y) return s[s.length-1];
  for(let i=0;i<s.length-1;i++){ if(y<=s[i].y&&y>=s[i+1].y){ const t=(s[i].y-y)/(s[i].y-s[i+1].y); return {y,rx:lerp(s[i].rx,s[i+1].rx,t),rz:lerp(s[i].rz,s[i+1].rz,t),cz:lerp(s[i].cz,s[i+1].cz,t)}; } }
  return s[0];
}
const spineBack=y=>{const s=thoraxSec(y); return s.cz-s.rz-0.9;};   // Dornfortsatzspitze
const sternumFront=y=>{const s=thoraxSec(y); return s.cz+s.rz+0.2;};
const ribPt=(y,ang,extra=0)=>{const s=thoraxSec(y); return V3(AN.mid+(s.rx+extra)*Math.cos(ang*DEG),y,s.cz+(s.rz+extra)*Math.sin(ang*DEG));};

/* Landmarke in Knochen-lokalen Koordinaten. f: T Thorax, C Klavikula, S Skapula, H Humerus, F Unterarm(Ulna), R Radius/Hand */
function L(f,x,y,z,opt={}){
  let v=(x instanceof THREE.Vector3)?x.clone():V3(x,y,z);
  if(x instanceof THREE.Vector3){ opt=y||{}; }
  if(f==='C') v.sub(AN.SC); else if(f==='S') v.sub(AN.AC); else if(f==='R') v.sub(AN.ulnaHead);
  return {f,v,w:opt.t?0:1,z:opt.z||0};
}
const LS=(u,v,w,opt)=>L('S',sc(u,v,w),opt);
const T_=(x,y,z,o)=>L('T',x,y,z,o), C_=(x,y,z,o)=>L('C',x,y,z,o), S_=(x,y,z,o)=>L('S',x,y,z,o), H_=(x,y,z,o)=>L('H',x,y,z,o), F_=(x,y,z,o)=>L('F',x,y,z,o), R_=(x,y,z,o)=>L('R',x,y,z,o);
const TEND={t:1}, zSA={z:1}, zSAt={t:1,z:1}, zCOR={t:1,z:2}, zGR={t:1,z:3}, zPS={t:1,z:4};

/* Akromion-Mittellinie (Skapula, Ruhe-Weltkoordinaten) und Coracoid */
AN.acromionPath=[V3(-5.6,2.7,-4.7),V3(-3.3,3.5,-3.9),V3(-1.4,3.95,-2.7),V3(0.2,4.05,-1.0),V3(0.7,3.9,1.0)];
AN.coracoidPath=[V3(-3.7,2.3,0.6),V3(-2.8,2.7,1.8),V3(-1.5,2.4,3.1),V3(-0.6,1.7,3.8)];
AN.spinePath=[V3(-11.6,1.0,-6.9),V3(-9.0,1.7,-6.2),V3(-6.5,2.2,-5.4),V3(-5.6,2.5,-4.7)];
AN.claviclePath=[V3(-16.5,3.6,6.0),V3(-13,4.3,6.8),V3(-9.5,4.8,6.0),V3(-6,4.8,4.2),V3(-3.3,4.5,2.4),V3(-1.4,4.2,1.5)];
AN.glenoid={c:V3(-2.45,0,-0.1),n:V3(0.99,0.05,0.1).normalize(),a:1.9,b:1.4};   // Pfanne: Zentrum, Normale, Halbachsen
AN.GT={c:V3(2.0,0.45,-0.3),r:V3(1.0,1.2,1.2)};   // Tuberculum majus (Humerus-lokal), Spitze ~5 mm unter Kopfscheitel
AN.LT={c:V3(0.7,0.6,2.0),r:V3(0.8,0.9,0.75)};   // Tuberculum minus
AN.coracoidTip=AN.coracoidPath[3].clone();
AN.deltTub=V3(1.3,-12.5,0.5);
AN.grooveEntry=V3(1.5,1.6,0.9);
AN.psRim=V3(-2.3,1.45,-1.25);     // posterosuperiorer Pfannenrand (Skapula)
AN.gtEdge=[V3(1.6,2.2,0.0),V3(1.5,2.0,-0.9),V3(1.6,1.5,-1.4),V3(1.6,0.9,-1.7)]; // Manschettenansatz am medialen Rand des Tub. majus (oben → hinten)
AN.neckAxis=V3(-0.72,0.62,-0.30).normalize(); // Richtung Gelenkfläche (Inklination ~130°, Retroversion ~25°)
AN.capOff=0.31; AN.capR=2.38;   // Gelenkflächenrand (Collum anatomicum): Kalotte ~165°

/* ===================== Strukturen =====================
   kind: muscle | tendon | lig | nerve. pts: Landmarken (w=1 Bauch, w=0 Sehne). r: Bauchradius. wrap: Wrapping-Radius um Humeruskopf */
const STRUCT=[
 /* ---- Rotatorenmanschette ---- */
 {id:'supra',name:'Supraspinatus',group:'cuff',kind:'muscle',r:0.75,wrap:2.6,pcsa:1.0,
  fas:[[LS(-9.6,2.6,0.7),LS(-6.0,2.5,0.85),S_(-3.2,3.0,-1.4,zSAt),S_(-1.0,2.95,-0.9,zSAt),H_(1.7,2.25,-0.1,zSAt)],
       [LS(-8.5,2.0,0.7),LS(-5.5,2.2,0.8),S_(-3.0,2.85,-1.9,zSAt),S_(-0.9,2.85,-1.5,zSAt),H_(1.8,2.15,-0.8,zSAt)]]},
 {id:'infra',name:'Infraspinatus',group:'cuff',kind:'muscle',r:0.9,wrap:2.6,pcsa:1.4,
  fas:[[LS(-9.8,-2.2,0.7),LS(-5.5,-1.0,0.8),S_(-2.6,1.0,-2.6,{t:1,z:4}),H_(1.7,1.5,-1.5,{t:1,z:4})],
       [LS(-9.2,-6.0,0.7),LS(-5.0,-3.0,0.8),S_(-2.4,0.2,-2.8,TEND),H_(1.7,1.0,-1.7,TEND)],
       [LS(-7.2,-9.5,0.6),LS(-4.5,-5.0,0.7),S_(-2.3,-0.6,-2.9,TEND),H_(1.6,0.6,-1.9,TEND)]]},
 {id:'tmin',name:'Teres minor',group:'cuff',kind:'muscle',r:0.55,wrap:2.6,pcsa:0.5,
  fas:[[LS(-5.2,-8.0,0.4),LS(-3.5,-4.8,0.5),H_(1.3,0.2,-2.3,TEND)]]},
 {id:'subsc',name:'Subscapularis',group:'cuff',kind:'muscle',r:0.95,wrap:2.6,pcsa:2.0,
  fas:[[LS(-9.0,1.0,-0.7),LS(-5.0,1.2,-0.8),S_(-2.6,1.3,1.6,zCOR),H_(0.6,1.0,2.25,zCOR)],
       [LS(-8.6,-3.5,-0.7),LS(-4.8,-1.5,-0.8),S_(-2.6,0.2,1.9,zCOR),H_(0.7,0.3,2.35,zCOR)],
       [LS(-6.5,-8.0,-0.6),LS(-4.0,-4.5,-0.7),S_(-2.6,-1.0,1.8,TEND),H_(0.6,-0.5,2.3,TEND)]]},
 /* ---- Deltoideus ---- */
 {id:'deltA',name:'Deltoideus, Pars clavicularis (vorn)',group:'delt',kind:'muscle',r:0.95,wrap:3.2,pcsa:1.5,layer:1,
  fas:[[C_(-5.8,4.5,4.2),H_(1.3,-12.6,0.7,TEND)],[C_(-3.3,4.4,2.6),H_(1.4,-12.4,0.7,TEND)]]},
 {id:'deltM',name:'Deltoideus, Pars acromialis (Mitte)',group:'delt',kind:'muscle',r:1.05,wrap:3.2,pcsa:2.0,layer:1,
  fas:[[S_(0.6,3.9,-2.3),H_(1.4,-12.5,0.4,TEND)],[S_(1.3,3.9,0.0),H_(1.4,-12.5,0.6,TEND)]]},
 {id:'deltP',name:'Deltoideus, Pars spinalis (hinten)',group:'delt',kind:'muscle',r:0.9,wrap:3.2,pcsa:1.2,layer:1,
  fas:[[S_(-3.6,2.9,-4.7),H_(1.2,-12.5,0.2,TEND)],[S_(-7.0,2.0,-5.7),H_(1.2,-12.4,0.3,TEND)]]},
 /* ---- Bizeps / Trizeps / Coracobrachialis ---- */
 {id:'bicLH',name:'Bizeps, langer Kopf – lange Bizepssehne (LBS)',group:'arm',kind:'muscle',r:1.0,wrap:2.55,pcsa:0.6,
  fas:[[S_(-2.7,2.05,0.05,zGR),H_(1.5,1.6,0.9,zGR),H_(1.4,0.2,1.75,zGR),H_(1.1,-2.5,1.95,zGR),H_(0.8,-5.5,1.95,TEND),H_(0.6,-12,2.7),H_(0.5,-20,2.6),H_(0.6,-26.5,2.4,TEND),H_(0.5,-29.5,2.2,TEND),R_(1.0,-3.6,1.0,TEND)]]},
 {id:'bicSH',name:'Bizeps, kurzer Kopf',group:'arm',kind:'muscle',r:0.9,wrap:2.55,pcsa:0.6,
  fas:[[S_(-0.9,1.6,3.4,TEND),H_(-0.1,-4.5,2.9,TEND),H_(0.0,-12,3.1),H_(0.3,-20,2.9),H_(0.5,-26.5,2.6,TEND),H_(0.5,-29.5,2.2,TEND),R_(1.0,-3.6,1.0,TEND)]]},
 {id:'corbr',name:'Coracobrachialis',group:'arm',kind:'muscle',r:0.6,wrap:2.6,pcsa:0.4,
  fas:[[S_(-1.1,1.4,3.5,TEND),H_(-1.2,-6.0,1.6),H_(-1.4,-13.5,0.6,TEND)]]},
 {id:'triLH',name:'Trizeps, langer Kopf',group:'arm',kind:'muscle',r:1.0,wrap:2.6,pcsa:1.0,
  fas:[[S_(-2.9,-2.3,-0.5,TEND),H_(-0.7,-6.0,-2.6,TEND),H_(-0.3,-16,-2.9),H_(0.0,-24,-2.5,TEND),F_(-0.4,1.0,-1.9,TEND)]]},
 /* ---- Brust ---- */
 {id:'pecM',name:'Pectoralis major',group:'chest',kind:'muscle',r:1.05,wrap:2.9,pcsa:2.4,layer:4,
  fas:[[C_(-14.2,4.0,6.7),T_(-6.0,0.5,7.8),H_(1.0,-4.8,2.3,TEND)],[C_(-10.2,4.7,5.9),T_(-4.5,-1.0,6.5),H_(1.0,-5.6,2.2,TEND)],
       [T_(-17.4,1.5,sternumFront(1.5)+0.4),T_(-6.5,-2.8,8.2),H_(0.95,-6.4,2.1,TEND)],[T_(-17.4,-3.0,sternumFront(-3)+0.4),T_(-6.5,-5.5,8.6),H_(0.95,-6.0,2.15,TEND)],
       [T_(-17.4,-7.5,sternumFront(-7.5)+0.4),T_(-7.0,-8.0,8.8),H_(0.95,-5.4,2.2,TEND)],[T_(-15.5,-11.5,sternumFront(-11.5)),T_(-7.5,-10,8.6),H_(0.9,-5.0,2.25,TEND)]]},
 {id:'pecMin',name:'Pectoralis minor',group:'chest',kind:'muscle',r:0.55,wrap:0,pcsa:0,
  fas:[[T_(-12.5,-2.5,sternumFront(-2.5)-0.5),S_(-1.3,1.5,3.3,TEND)],[T_(-11.8,-6.5,sternumFront(-6.5)-0.6),S_(-1.5,1.4,3.2,TEND)],[T_(-11.2,-10,sternumFront(-10)-0.8),S_(-1.7,1.3,3.1,TEND)]]},
 /* ---- Rücken ---- */
 {id:'trapU',name:'Trapezius, Pars descendens (oben)',group:'back',kind:'muscle',r:0.8,wrap:0,pcsa:0,layer:4,
  fas:[[T_(-15.5,17.5,-6.5),T_(-12.0,9.5,-3.5),C_(-4.6,4.9,3.7,TEND)],[T_(-17.5,11.0,-7.2),T_(-11.0,7.5,-4.0),C_(-2.6,4.7,2.3,TEND)]]},
 {id:'trapM',name:'Trapezius, Pars transversa (Mitte)',group:'back',kind:'muscle',r:0.9,wrap:0,pcsa:0,layer:4,
  fas:[[T_(-17.5,6.0,spineBack(6)),T_(-11,4.5,-6.5),S_(-2.8,3.7,-3.7,TEND)],[T_(-17.5,1.0,spineBack(1)),T_(-12,2.0,-7.6),S_(-6.5,2.5,-5.4,TEND)]]},
 {id:'trapL',name:'Trapezius, Pars ascendens (unten)',group:'back',kind:'muscle',r:0.8,wrap:0,pcsa:0,layer:4,
  fas:[[T_(-17.5,-5.5,spineBack(-5.5)),T_(-14,-2.0,-8.6),S_(-9.4,1.6,-6.2,TEND)],[T_(-17.5,-12,spineBack(-12)),T_(-14.5,-6.0,-8.8),S_(-9.0,1.4,-6.3,TEND)]]},
 {id:'rhomb',name:'Rhomboidei (major & minor)',group:'back',kind:'muscle',r:0.65,wrap:0,pcsa:0,layer:4,
  fas:[[T_(-17.5,4.5,spineBack(4.5)),LS(-10.8,1.2,0.2,TEND)],[T_(-17.5,0.5,spineBack(0.5)),LS(-10.6,-3.0,0.2,TEND)],[T_(-17.5,-3.5,spineBack(-3.5)),LS(-10.0,-7.0,0.2,TEND)],[T_(-17.5,-6.5,spineBack(-6.5)),LS(-9.2,-10.5,0.2,TEND)]]},
 {id:'lev',name:'Levator scapulae',group:'back',kind:'muscle',r:0.55,wrap:0,pcsa:0,
  fas:[[T_(-14.5,15.5,-4.5),T_(-13.5,9.0,-5.5),LS(-10.6,3.3,0.1,TEND)],[T_(-14.8,12.0,-5.5),LS(-10.3,2.8,0.1,TEND)]]},
 {id:'serr',name:'Serratus anterior',group:'back',kind:'muscle',r:0.7,wrap:0,pcsa:0,
  fas:[[L('T',ribPt(-0.5,45,0.4)),L('T',ribPt(-1.5,0,0.5)),L('T',ribPt(-2.0,-45,0.6)),LS(-10.7,2.4,-0.5,TEND)],
       [L('T',ribPt(-4.0,45,0.4)),L('T',ribPt(-5.0,0,0.5)),L('T',ribPt(-5.5,-45,0.6)),LS(-10.5,-1.5,-0.5,TEND)],
       [L('T',ribPt(-7.5,45,0.4)),L('T',ribPt(-8.5,0,0.5)),L('T',ribPt(-9.0,-45,0.6)),LS(-10.0,-5.5,-0.5,TEND)],
       [L('T',ribPt(-11,45,0.4)),L('T',ribPt(-12,0,0.5)),L('T',ribPt(-12.5,-45,0.6)),LS(-9.2,-10,-0.5,TEND)],
       [L('T',ribPt(-14.5,40,0.4)),L('T',ribPt(-15,0,0.5)),L('T',ribPt(-14.5,-45,0.6)),LS(-8.4,-12,-0.5,TEND)]]},
 {id:'lat',name:'Latissimus dorsi',group:'back',kind:'muscle',r:0.9,wrap:2.9,pcsa:1.6,layer:4,
  fas:[[T_(-17.5,-7,spineBack(-7)),T_(-6.5,-9.5,-6.0),H_(-1.7,-5.6,0.0,TEND),H_(0.3,-4.9,1.95,TEND)],[T_(-17.5,-14,spineBack(-14)),T_(-6.0,-11,-6.2),H_(-1.7,-5.4,0.1,TEND),H_(0.3,-4.7,1.95,TEND)],
       [T_(-17.5,-21,spineBack(-21)),T_(-5.5,-12.5,-6.2),H_(-1.6,-5.2,0.2,TEND),H_(0.3,-4.5,1.95,TEND)],[T_(-13,-26,spineBack(-25)+2),T_(-5.0,-14,-6.0),H_(-1.6,-5.0,0.3,TEND),H_(0.3,-4.3,1.95,TEND)]]},
 {id:'tmaj',name:'Teres major',group:'back',kind:'muscle',r:0.85,wrap:2.6,pcsa:0.8,
  fas:[[LS(-8.2,-11.5,0.4),H_(-1.9,-6.2,-0.3,TEND),H_(-0.9,-5.6,1.5,TEND)],[LS(-7.4,-9.6,0.3),H_(-1.9,-5.6,-0.2,TEND),H_(-0.9,-5.0,1.55,TEND)]]},
 /* ---- Bänder ---- */
 {id:'CAL',name:'Lig. coracoacromiale (Schulterdach)',group:'joint',kind:'lig',r:0.3,wrap:0,static:true,
  fas:[[S_(-0.9,2.2,3.0),S_(0.2,3.35,0.9)],[S_(-1.5,2.4,2.6),S_(-0.6,3.4,-0.3)]]},
 {id:'CHL',name:'Lig. coracohumerale',group:'joint',kind:'lig',r:0.25,wrap:2.5,
  fas:[[S_(-1.7,2.2,2.5),H_(1.4,2.0,0.5)],[S_(-1.7,2.1,2.6),H_(0.8,1.5,1.9)]]},
 {id:'GHL',name:'Glenohumerale Bänder (SGHL · MGHL · IGHL)',group:'joint',kind:'lig',r:0.26,wrap:2.48,
  fas:[[S_(-2.4,1.5,0.8),H_(0.5,1.3,2.1)],[S_(-2.4,0.3,1.3),H_(0.15,-0.2,2.3)],[S_(-2.5,-1.1,1.05),H_(0.3,-1.7,1.8)],[S_(-2.6,-1.85,-0.2),H_(0.3,-2.3,0.0)],[S_(-2.5,-1.1,-1.35),H_(0.3,-1.6,-1.9)]]},
 {id:'ACCC',name:'AC-Gelenk · Ligg. acromioclaviculare & coracoclavicularia',group:'joint',kind:'lig',r:0.28,wrap:0,static:true,
  fas:[[C_(-1.9,4.45,1.7),S_(-0.8,4.35,1.1)],[S_(-3.4,2.6,0.9),C_(-4.4,4.5,3.1)],[S_(-2.5,2.8,1.9),C_(-3.0,4.4,2.5)]]},
 /* ---- Nerven ---- */
 {id:'nAx',name:'N. axillaris (quadrilateraler Raum)',group:'nerve',kind:'nerve',r:0.2,wrap:2.7,
  fas:[[T_(-4.8,-2.0,1.2),H_(-1.5,-3.3,-0.5),H_(0.2,-3.7,-2.5),H_(1.9,-3.0,-1.0)]]},
 {id:'nSS',name:'N. suprascapularis',group:'nerve',kind:'nerve',r:0.16,wrap:0,
  fas:[[T_(-9.0,5.5,-0.5),S_(-5.4,3.1,-3.0),S_(-4.3,0.6,-2.9),S_(-7.0,-4.0,-5.3)]]},
];
const STRUCT_BY_ID={}; STRUCT.forEach(s=>STRUCT_BY_ID[s.id]=s);

/* ===================== Schichten (UI) ===================== */
const LAYER_GROUPS=[
 {id:'bones',name:'Knochen',color:'#e9dfcf',items:[['thorax','Thorax & Wirbelsäule'],['clav','Klavikula'],['scap','Skapula (Akromion, Coracoid, Glenoid)'],['hum','Humerus'],['fore','Unterarm & Hand']]},
 {id:'joint',name:'Gelenk & Bänder',color:'#d9d0e6',items:[['capsule','Gelenkkapsel'],['labrum','Labrum'],['GHL','Glenohumerale Bänder'],['CHL','Lig. coracohumerale'],['CAL','Lig. coracoacromiale'],['ACCC','AC-/CC-Bänder'],['bursa','Bursa subacromialis']]},
 {id:'cuff',name:'Rotatorenmanschette',color:'#b5766a',items:[['supra','Supraspinatus'],['infra','Infraspinatus'],['tmin','Teres minor'],['subsc','Subscapularis']]},
 {id:'delt',name:'Deltoideus',color:'#b5766a',items:[['deltA','vorn (klavikular)'],['deltM','Mitte (akromial)'],['deltP','hinten (spinal)']]},
 {id:'arm',name:'Oberarm',color:'#b5766a',items:[['bicLH','Bizeps langer Kopf + LBS'],['bicSH','Bizeps kurzer Kopf'],['corbr','Coracobrachialis'],['triLH','Trizeps langer Kopf']]},
 {id:'chest',name:'Brust',color:'#b5766a',items:[['pecM','Pectoralis major'],['pecMin','Pectoralis minor']]},
 {id:'back',name:'Rücken & Schultergürtel',color:'#b5766a',items:[['trapU','Trapezius oben'],['trapM','Trapezius Mitte'],['trapL','Trapezius unten'],['rhomb','Rhomboiden'],['lev','Levator scapulae'],['serr','Serratus anterior'],['lat','Latissimus dorsi'],['tmaj','Teres major']]},
 {id:'nerve',name:'Nerven',color:'#f4d35e',items:[['nAx','N. axillaris'],['nSS','N. suprascapularis']]},
];

/* ===================== Beschreibungen ===================== */
const INFO={
 supra:{k:'Rotatorenmanschette · Muskel + Sehne',f:'Leitet die Abduktion ein, zentriert den Humeruskopf gegen den nach oben ziehenden Deltoideus (Kraftpaar). Die Sehne läuft unter dem Akromiondach hindurch zum Tuberculum majus.',p:'Tendinopathie, Partial-/Komplettruptur, Kalkschulter, subakromiales Impingement; Nachtschmerz beim Liegen auf der Schulter.',t:'Painful Arc 60–120° Abduktion, Jobe-Test (Empty Can), Neer- und Hawkins-Kennedy-Test.'},
 infra:{k:'Rotatorenmanschette · Muskel + Sehne',f:'Kräftigster Außenrotator, hintere Zentrierung des Kopfes, bremst den Arm nach dem Wurf ab (exzentrisch).',p:'Tendinopathie/Ruptur bei Überkopfsport, Schwäche → Kopfhochstand; Zug bei Innenrotation und Adduktion vor dem Körper (hintere Manschette).',t:'Außenrotation gegen Widerstand (Patte), Cross-Body-Dehnung, Innenrotation bei 90° Abduktion.'},
 tmin:{k:'Rotatorenmanschette · Muskel + Sehne',f:'Außenrotator und unterer Anteil der hinteren Manschette; bildet die obere Begrenzung des quadrilateralen Raums (N. axillaris).',p:'Selten isoliert verletzt; Verspannung bei hinterer Kapselenge; Hornblower-Zeichen bei Ruptur.',t:'Außenrotation bei 90° Abduktion gegen Widerstand.'},
 subsc:{k:'Rotatorenmanschette · Muskel + Sehne',f:'Kräftigster Innenrotator, vordere Stabilisierung des Kopfes; die obere Sehne bildet den Boden des Rotatorenintervalls und hält die lange Bizepssehne im Sulcus.',p:'Ruptur (oft zusammen mit LBS-Instabilität), subkorakoidales Impingement bei Flexion + Innenrotation + Adduktion, Verkürzung → eingeschränkte Außenrotation.',t:'Lift-off-Test (Schürzengriff), Belly-Press, Bear-Hug; Dehnung bei Außenrotation.'},
 deltA:{k:'Deltoideus · vorderer Anteil',f:'Flexion, Innenrotation und horizontale Adduktion des Arms.',p:'Überlastung bei Druckübungen; mit verkürztem Pectoralis Teil des „Rundschulter“-Musters.',t:'Flexion gegen Widerstand.'},
 deltM:{k:'Deltoideus · mittlerer Anteil',f:'Hauptabduktor ab ca. 15–30°; zieht den Kopf nach oben – braucht die Manschette als Gegenspieler (Zentrierung).',p:'Bei Manschettenschwäche/-ruptur schiebt der Deltoideus den Kopf unter das Dach (Impingement, Hochstand).',t:'Abduktion gegen Widerstand.'},
 deltP:{k:'Deltoideus · hinterer Anteil',f:'Extension, Außenrotation, horizontale Abduktion.',p:'Verkürzung/Verspannung bei Überkopfsport; Zug bei Cross-Body-Adduktion.',t:'Horizontale Abduktion gegen Widerstand.'},
 bicLH:{k:'Muskel + lange Bizepssehne (LBS)',f:'Ursprung am Tuberculum supraglenoidale/oberen Labrum (SLAP-Region), verläuft über den Humeruskopf durch das Rotatorenintervall in den Sulcus intertubercularis. Beugt und supiniert den Unterarm; stabilisiert den Kopf nach vorn-oben.',p:'Tendinopathie im Sulcus, Subluxation aus dem Sulcus (bei Subscapularis-/Pulley-Läsion), SLAP-Läsion, Ruptur („Popeye“). Die Sehne wird bei Extension + Außenrotation und in der Wurfposition gedehnt und bei Innenrotation im Sulcuseingang umgelenkt; Pronation dehnt die distale Sehne.',t:'Speed-Test (Flexion 90°, supiniert, gegen Widerstand), Yergason (Supination gegen Widerstand), O’Brien (SLAP).'},
 bicSH:{k:'Muskel + Sehne',f:'Vom Processus coracoideus; Flexion und Adduktion der Schulter, Ellbogenbeugung, Supination.',p:'Ansatztendinopathie am Coracoid, distale Bizepssehnenruptur (gemeinsamer Ansatz).',t:'Flexion gegen Widerstand, Ellbogenbeugung supiniert.'},
 corbr:{k:'Muskel',f:'Flexion und Adduktion; vom Coracoid zur medialen Humerusmitte, wird vom N. musculocutaneus durchbohrt.',p:'Selten; Coracoid-Schmerz, Nervenreizung.',t:'Flexion/Adduktion gegen Widerstand.'},
 triLH:{k:'Muskel + Sehne',f:'Streckt den Ellbogen, adduziert/extendiert die Schulter; mediale Begrenzung des quadrilateralen Raums.',p:'Wird bei Elevation mit gebeugtem Ellbogen gedehnt (begrenzt Überkopfreichweite), Ansatzprobleme am Olecranon.',t:'Ellbogenstreckung über Kopf.'},
 pecM:{k:'Muskel + Sehne',f:'Adduktion, Innenrotation, Flexion (klavikular) und Extension aus der Elevation (sternal). Der Ansatz ist verdreht: untere Fasern setzen höher am lateralen Sulcusrand an.',p:'Verkürzung → Protraktion/Rundschulter → engt den Subakromialraum indirekt ein; Ruptur beim Bankdrücken; Zug bei Abduktion + Außenrotation.',t:'Horizontale Adduktion gegen Widerstand, Dehnung im Türrahmen.'},
 pecMin:{k:'Muskel',f:'Rippen 3–5 → Coracoid: zieht das Schulterblatt nach vorn-unten (Protraktion, anteriore Kippung).',p:'Verkürzung begünstigt Impingement (Dach kippt nach vorn-unten) und Thoracic-Outlet-Symptome (Plexus/Gefäße darunter).',t:'Dehnung bei Retraktion + Elevation; Druckschmerz unterhalb des Coracoids.'},
 trapU:{k:'Muskel',f:'Elevation und Aufwärtsrotation des Schulterblatts, Nackenstabilisierung.',p:'Oft überaktiv/verspannt (Nacken-Schulter-Schmerz), kompensiert einen schwachen unteren Trapezius/Serratus.',t:'Schulter hochziehen; Dehnung bei Seitneigung des Kopfes.'},
 trapM:{k:'Muskel',f:'Retraktion (Schulterblätter zusammen), stabilisiert die Skapula bei Elevation.',p:'Schwäche → Protraktion, Dyskinesie.',t:'Retraktion gegen Widerstand.'},
 trapL:{k:'Muskel',f:'Depression und Aufwärtsrotation der Skapula; Kraftpaar mit Serratus anterior bei der Elevation.',p:'Schwäche ist ein häufiger Faktor bei Impingement und Dyskinesie (Skapula rotiert zu wenig nach oben).',t:'„Y“-Heben in Bauchlage.'},
 rhomb:{k:'Muskel',f:'Retraktion und Abwärtsrotation, hält den medialen Skapularand am Thorax.',p:'Verspannung/Schmerz zwischen den Schulterblättern, Dehnung bei Protraktion (Cross-Body).',t:'Retraktion gegen Widerstand.'},
 lev:{k:'Muskel',f:'Hebt die Skapula (oberer Winkel) und rotiert sie nach unten; Seitneigung der HWS.',p:'Klassischer Verspannungsmuskel (Bildschirmarbeit, Stress), Schmerz am oberen Skapulawinkel.',t:'Dehnung: Kopf zur Gegenseite drehen und beugen.'},
 serr:{k:'Muskel',f:'Protraktion und Aufwärtsrotation, hält die Skapula am Thorax; Hauptrotator bei der Elevation (mit dem Trapezius).',p:'Schwäche/N.-thoracicus-longus-Läsion → Scapula alata (Winging), verminderte Aufwärtsrotation → Impingement.',t:'Liegestütz plus (Protraktion), Wandrutschen.'},
 lat:{k:'Muskel + Sehne',f:'Adduktion, Extension und Innenrotation (Klimmzug, Schwimmen); windet sich um den Teres major zum Sulcusboden.',p:'Verkürzung begrenzt die Elevation (Kompensation über Hohlkreuz), Zug in Überkopf- und Nackengriff-Position.',t:'Elevation mit Außenrotation, Dehnung an der Wand.'},
 tmaj:{k:'Muskel + Sehne',f:'„Kleiner Latissimus“: Adduktion, Innenrotation, Extension; untere Begrenzung des quadrilateralen Raums.',p:'Verspannung bei Überkopfsportlern, Zug bei Elevation/Außenrotation.',t:'Dehnung in Elevation + Außenrotation.'},
 CAL:{k:'Band',f:'Spannt sich vom Coracoid zum Akromion und bildet mit beiden das Schulterdach (Fornix humeri). Darunter liegen Supraspinatussehne, Bursa und Rotatorenintervall.',p:'Verdickung/Sporn → Einengung des Subakromialraums (Outlet-Impingement). Die Bandlänge ändert sich nicht, es begrenzt den Raum von oben.',t:'Kompression der darunterliegenden Sehne bei Flexion + Innenrotation (Hawkins).'},
 CHL:{k:'Band',f:'Vom Coracoid zu beiden Tubercula; verstärkt das Rotatorenintervall, trägt das Gewicht des hängenden Arms mit und begrenzt die Außenrotation im hängenden Arm.',p:'Verdickung/Schrumpfung bei Frozen Shoulder (Außenrotation zuerst eingeschränkt).',t:'Außenrotation bei anliegendem Arm.'},
 GHL:{k:'Bänder (Kapselverstärkungen)',f:'SGHL: Stabilisierung nach unten im hängenden Arm. MGHL: begrenzt Außenrotation bei 45° Abduktion. IGHL vorderes Band: hält den Kopf in Abduktion + Außenrotation (Wurf/Apprehension) – reißt bei der Luxation (Bankart). Hinteres Band: gespannt bei Flexion + Innenrotation.',p:'Vordere Instabilität, Hyperlaxität, Kapselschrumpfung.',t:'Apprehension-/Relocation-Test (90° Abduktion + Außenrotation).'},
 ACCC:{k:'Gelenk + Bänder',f:'Das AC-Gelenk verbindet Klavikula und Akromion; das Lig. acromioclaviculare hält horizontal, Conoid und Trapezoid (coracoclaviculär) hängen die Skapula an der Klavikula auf.',p:'AC-Arthrose, AC-Sprengung (Rockwood), Schmerz bei Adduktion vor dem Körper (Kompression des Gelenks) und Überkopf.',t:'Cross-Body-Adduktion, Druck aufs AC-Gelenk.'},
 capsule:{k:'Gelenkkapsel',f:'Weit und schlaff in Mittelstellung (Recessus axillaris unten), spannt sich nur endgradig. Vorne gespannt bei Außenrotation/ABER, hinten bei Innenrotation und Adduktion vor dem Körper, unten bei Elevation.',p:'Hintere Verkürzung (GIRD) → Kopf weicht bei Flexion nach vorn-oben aus → Impingement. Frozen Shoulder = Kapsulitis mit Schrumpfung (Außenrotation zuerst), Instabilität = zu weite Kapsel.',t:'Endgradige Bewegungen in alle Richtungen (Farbe zeigt, welcher Anteil trägt).'},
 labrum:{k:'Faserknorpelring',f:'Vergrößert und vertieft die Pfanne (Saugnapf-Effekt); Anker der langen Bizepssehne oben (SLAP-Region) und des IGHL vorne-unten (Bankart-Region).',p:'SLAP-Läsion (Wurfsport, Sturz auf den Arm), Bankart-Läsion nach Luxation, Rissbildung → Klicken/Blockieren.',t:'O’Brien-Test, Crank-Test; Wurfposition (Peel-back-Mechanismus am oberen Labrum).'},
 bursa:{k:'Schleimbeutel',f:'Gleitschicht zwischen Rotatorenmanschette und Akromion/Deltoideus (subacromial-subdeltoidal).',p:'Bursitis bei wiederholter Kompression unter dem Dach: Painful Arc, Nachtschmerz, Schmerz beim Seitheben; Kalkeinbruch aus der Supraspinatussehne.',t:'Abduktion 60–120°, Neer-Test.'},
 nAx:{k:'Nerv',f:'Aus dem hinteren Faszikel des Plexus, durch den quadrilateralen Raum um das Collum chirurgicum; versorgt Deltoideus und Teres minor sowie die Haut über der Schulter.',p:'Läsion bei Luxation/Humerusfraktur (Deltoideus-Ausfall); Quadrilateral-Space-Syndrom bei Abduktion + Außenrotation (Wurfsport).',t:'Abduktion + Außenrotation (Wurfposition).'},
 nSS:{k:'Nerv',f:'Durch die Incisura scapulae in die Fossa supraspinata, um die Spina (spinoglenoidale Enge) in die Fossa infraspinata; versorgt Supra- und Infraspinatus.',p:'Kompression an der Incisura oder spinoglenoidal (Ganglion, Volleyball) → Infraspinatus-Atrophie; Zug bei Protraktion/Cross-Body.',t:'Cross-Body-Adduktion, Druck an der Incisura.'},
 thorax:{k:'Knochen',f:'Brustkorb und Wirbelsäule: Ursprungsfläche für Trapezius, Rhomboiden, Latissimus, Serratus und Pectoralis; die Skapula gleitet auf den Rippen 2–7.',p:'BWS-Kyphose (Rundrücken) kippt das Schulterblatt nach vorn und engt den Subakromialraum bei der Elevation ein.',t:''},
 clav:{k:'Knochen',f:'Strebe zwischen Sternum und Akromion; hebt, zieht zurück und rotiert (ca. 30° nach hinten) bei der Elevation. Ansatz für Deltoideus (vorn), Trapezius, Pectoralis major, SC-/AC-Gelenk.',p:'Fraktur, AC-/SC-Instabilität, distale Klavikulaosteolyse (Kraftsport).',t:''},
 scap:{k:'Knochen',f:'Schulterblatt mit Spina, Akromion (Dach), Coracoid (Anker für Pectoralis minor, Bizeps kurzer Kopf, Coracobrachialis, Bänder) und Glenoid (Pfanne). Bewegt sich auf dem Thorax mit ca. 1/3 der Gesamtelevation.',p:'Dyskinesie (zu wenig Aufwärtsrotation/posteriore Kippung) → Impingement; Os acromiale, Akromionsporn Typ III (hakenförmig).',t:''},
 hum:{k:'Knochen',f:'Kopf (Kugel, ca. 24 mm Radius, Gelenkfläche nach medial-oben-hinten), Tuberculum majus (Manschettenansätze), Tuberculum minus (Subscapularis), dazwischen der Sulcus intertubercularis (LBS), Deltoideus-Ansatz (Tuberositas) und Collum chirurgicum (N. axillaris).',p:'Das Tuberculum majus taucht bei Abduktion unter das Dach – mit Außenrotation weicht es aus, mit Innenrotation (Hawkins) stößt es gegen Dach und Band.',t:''},
 fore:{k:'Knochen',f:'Ulna (Ellbogenscharnier, Olecranon = Trizepsansatz) und Radius (dreht um die Ulna: Pronation/Supination, trägt die Hand; Tuberositas radii = Bizepsansatz).',p:'Pronation wickelt die Bizepssehne um den Radius (Dehnung, Yergason); Supination entspannt sie.',t:''},
};

/* ===================== Schulter: Kameras, Detailansichten, Schichtstufen =====================
   ORBIT0: Standardkamera (Bezug für geteilte Links). VIEWS: Ansichts-Schalter der Kopfzeile.
   detailDefs: die vier Detailfenster (id = Element-ID, title/label = i18n-Schlüssel; Markup erzeugt engine/boot.js) mit Kamera-Fit je Pose, Anzeigetext (readout) und optionaler Schnittebene (clip(fr) → Modell-x, ab dem weggeschnitten wird).
   PEEL: Schichtstufen der Detailansichten – Reihenfolge nie ändern (Stufe steckt in Kurz-Links). */
const ORBIT0={tx:6,ty:-8,tz:0,theta:-32,phi:74,dist:112};   // Standardkamera (Grad / cm), Bezug für geteilte Links
const VIEWS={front:{theta:-12,phi:78},side:{theta:-92,phi:78},back:{theta:-186,phi:78},top:{theta:-35,phi:14}};

const detailDefs=[
  {id:'dv1',title:'dv1',label:'dv1l',fov:26,level:2,readout:(M)=>fmt(M.ahd*10,1)+' mm',
   fit(fr){ const t=worldPt(fr,AN.bursaCenter).add(V3(0.3,-0.8,0)); const d=V3(0.95,0.5,0.8).normalize(); return {t,pos:t.clone().addScaledVector(d,16)}; }},
  {id:'dv2',title:'dv2',label:'dv2l',fov:26,level:4,clip:fr=>fr.H.p.x+0.55,readout:(M)=>t('ant')+' '+fmt(M.capAnt*100)+' % · '+t('post')+' '+fmt(M.capPost*100)+' %',
   fit(fr){ const t=fr.H.p.clone().add(V3(-1.2,0,0)); const d=V3(1,0.28,0.32).normalize(); return {t,pos:t.clone().addScaledVector(d,14)}; }},
  {id:'dv3',title:'dv3',label:'dv3l',fov:26,level:2,readout:(M)=>t('kink')+' '+(M.lbsDeflRel>=0?'+':'')+fmt(M.lbsDeflRel)+'°',
   fit(fr){ const t=worldPt(fr,AN.grooveLm).add(V3(-0.5,-1.0,0)); const d=V3(0.45,0.55,0.75).normalize(); return {t,pos:t.clone().addScaledVector(d,15)}; }},
  {id:'dv4',title:'dv4',label:'dv4l',fov:28,level:0,readout:(M,rh)=>rh?t('scapUp')+fmt(rh.UR)+'° · '+t('tilt')+' '+fmt(rh.PT)+'°':null,
   fit(fr){ const t=worldPt(fr,L('S',sc(-6,-4,0))).add(V3(-3,2,0)); const d=V3(-0.12,0.18,-1).normalize(); return {t,pos:t.clone().addScaledVector(d,52)}; }},
];

/* Schichtstufen der Detailansichten (von außen nach innen abtragen) */
const PEEL=[{ids:[],key:'peel0'},{ids:['thorax','deltA','deltM','deltP'],key:'peel1'},{ids:['pecM','pecMin','lat','trapU','trapM','trapL','rhomb','lev','serr','tmaj'],key:'peel2'},{ids:['bicSH','corbr','triLH','nAx','nSS'],key:'peel3'},{ids:['supra','infra','tmin','subsc'],key:'peel4'},{ids:['bicLH','bursa','CHL','GHL','CAL','ACCC'],key:'peel5'},{ids:['capsule','labrum'],key:'peel6'}];
PEEL.forEach(p=>Object.defineProperty(p,'name',{get(){ return t(p.key); }}));

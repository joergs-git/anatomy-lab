/* ===================== Bein: Kameras, Detailansichten, Schichtstufen =====================
   ORBIT0: Standardkamera (Bezug für geteilte Links). VIEWS: Ansichts-Schalter. detailDefs: vier Detailfenster (id = Element-ID,
   title/label = i18n-Schlüssel) mit Kamera-Fit je Pose, Anzeigetext (readout) und optionaler Schnittebene (clip → Modell-x, ab dem weggeschnitten wird).
   PEEL: Schichtstufen der Detailansichten – Reihenfolge nie ändern (Stufe steckt in Kurz-Links). */
const ORBIT0={tx:3,ty:-48,tz:3,theta:-38,phi:82,dist:200};
const VIEWS={front:{theta:-6,phi:82},side:{theta:-92,phi:82},back:{theta:-186,phi:82},top:{theta:-40,phi:22}};

const detailDefs=[
  {id:'dv1',title:'dv1',label:'dv1l',fov:24,level:2,clip:fr=>fr.P.p.x+0.4,readout:M=>fmt(M.pfBW,1)+' × KG · '+fmt(M.pfPress,1)+' MPa',
   fit(fr){ const t=fr.P.p.clone().add(V3(0,-0.8,-1.2)); const d=V3(1,0.12,0.2).normalize(); return {t,pos:t.clone().addScaledVector(d,19)}; }},
  {id:'dv2',title:'dv2',label:'dv2l',fov:24,level:4,readout:M=>t('aclS')+' '+fmt(M.acl)+' N · '+t('pclS')+' '+fmt(M.pcl)+' N',
   fit(fr){ const t=fr.T.p.clone().add(V3(0,-0.6,0)); const d=V3(0.1,0.3,1).normalize(); return {t,pos:t.clone().addScaledVector(d,15)}; }},
  {id:'dv3',title:'dv3',label:'dv3l',fov:24,level:1,readout:M=>(M.itbOff>=0?t('itbAnt'):t('itbPost'))+' '+fmt(Math.abs(M.itbOff))+' mm',
   fit(fr){ const t=worldPt(fr,{f:'F',v:AN.epiL}).add(V3(0,0.5,0)); const d=V3(1,0.1,0.15).normalize(); return {t,pos:t.clone().addScaledVector(d,17)}; }},
  {id:'dv4',title:'dv4',label:'dv4l',fov:24,level:2,readout:M=>'ATFL '+(M.atfl>=0?'+':'')+fmt(M.atfl*100)+' % · '+t('ankFront')+' '+fmt(M.ankAnt)+' mm',
   fit(fr){ const t=fr.A.p.clone().add(V3(0,-1.2,1.0)); const d=V3(1,0.18,0.25).normalize(); return {t,pos:t.clone().addScaledVector(d,18)}; }},
];

/* Schichtstufen (von außen nach innen abtragen) */
const PEEL=[{ids:[],key:'peel0'},{ids:['pelvis','other','ground'],key:'peel1'},{ids:['glutMax','glutMed','tfl','addMag','iliopsoas','sart','gracilis','erector','rectAbd','oblique','addLong','piri'],key:'peel2'},
  {ids:['rectF','vastL','vastM','bicF','semimem','semitend','gastroM','gastroL','soleus','tibAnt','tibPost','peron','nPer'],key:'peel3'},
  {ids:['patella','patTen','hoffa'],key:'peel4'},{ids:['MCL','LCL','atfl','cfl','ptfl','deltoid','plantar'],key:'peel5'},{ids:['ACL','PCL','menisci'],key:'peel6'}];
PEEL.forEach(p=>Object.defineProperty(p,'name',{get(){ return t(p.key); }}));

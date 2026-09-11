/* ===================== Schulter: Engstellen-Monitor, belastete Strukturen, Struktur-Zusatzwerte =====================
   METRICS: Zeilen des Monitors (get liest EVAL.metrics; levels: Schwelle → Statuswort → Statusklasse; text: optionale Sonderformatierung).
   MONITOR: feste Reihenfolge – oben die häufigen Problemzonen, darunter eingeklappt die Spezialfälle; die Kapsel erscheint als Sammelzeile
   ihrer vier Regionen (aggregate). LOAD_GROUPS: Gruppen der Strukturliste – Reihenfolge nie ändern (Gruppenindex steckt in Kurz-Links). */
const METRICS=[
 {id:'ahd',name:'Subakromialer Abstand',unit:'mm',get:M=>M.ahd*10,levels:[[7,'lvFree','ok'],[5,'lvContact','warn'],[3,'lvNarrow','bad'],[-99,'lvSevere','crit']],max:12,sub:'Schulterdach ↔ Humeruskopf/Tub. majus; hier laufen Supraspinatussehne und Bursa (Ruhe ≈ 9–10 mm)'},
 {id:'chd',name:'Subkorakoidaler Abstand',unit:'mm',get:M=>M.chd*10,levels:[[8,'lvFree','ok'],[6,'lvContact','warn'],[4,'lvNarrow','bad'],[-99,'lvSevere','crit']],max:14,sub:'Coracoid ↔ Tub. minus; Subscapularissehne, Rotatorenintervall, lange Bizepssehne'},
 {id:'psd',name:'Posterosuperiorer Pfannenrand ↔ Manschettenansatz',unit:'mm',get:M=>M.psd*10,levels:[[8,'lvFree','ok'],[4,'lvContact','warn'],[-99,'lvStop','bad']],max:20,sub:'Internes Impingement in der Wurfposition (Abduktion + Außenrotation)'},
 {id:'capAnt',name:'Kapsel vorn (SGHL · MGHL · IGHL)',unit:'%',get:M=>M.capAnt*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capPost',name:'Kapsel hinten',unit:'%',get:M=>M.capPost*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capInf',name:'Kapsel unten (Recessus axillaris)',unit:'%',get:M=>M.capInf*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capSup',name:'Kapsel oben / Rotatorenintervall',unit:'%',get:M=>M.capSup*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'lbs',name:'Lange Bizepssehne: Umlenkung am Sulcuseingang',unit:'°',get:M=>M.lbsDeflRel,text:(v,M)=>(v>=0?'+':'')+fmt(v)+'°'+(M.lbsStrain<-0.1?' · '+fmt(M.lbsStrain*100)+t('shorter'):M.lbsStrain>0.05?' · +'+fmt(M.lbsStrain*100)+t('longer'):''),levels:[[40,'lvStrong','bad'],[15,'lvRaised','warn'],[-99,'lvRest','ok']],max:90,sub:'Zusatzknick gegenüber Ruhe (Innenrotation, Flexion); dazu Länge des intraartikulären Anteils'},
 {id:'nax',name:'N. axillaris (quadrilateraler Raum)',unit:'%',get:M=>M.axStrain*100,levels:[[8,'lvStretched','warn'],[-99,'lvRelaxed','ok']],max:12,tension:true},
 {id:'jrf',name:'Gelenkreaktionskraft (Kompression im Gelenk)',unit:'N',get:M=>M.jrf,levels:[[900,'lvVeryHigh','crit'],[500,'lvHigh','bad'],[200,'lvMod','warn'],[-1,'lvLow','ok']],max:1200,sub:'Schätzung aus Muskelzug, Armgewicht und äußerer Last (Band, Hantel, Wand)'},
];
/* Reihenfolge nach klinischer Häufigkeit: subakromial (≈ Hälfte aller Schulterbeschwerden), Kapsel (Frozen Shoulder, GIRD, Instabilität),
   lange Bizepssehne, Gelenkkraft – darunter eingeklappt die Spezialfälle (Wurfsport, selten). */
const CAP_IDS=['capAnt','capPost','capInf','capSup'];
const MONITOR={
  top:['ahd','capsule','lbs','jrf'], special:['psd','chd','nax'],
  /* Sammelzeile: stärkster Anteil der vier Kapselregionen; Text = Wert + Region */
  aggregate:{id:'capsule',ids:CAP_IDS,nameKey:'mCapsule',max:12,tension:true,
    text:(v,best)=>(v>=0?'+':'')+fmt(v)+' % '+t({capAnt:'ant',capPost:'post',capInf:'inf',capSup:'sup_'}[best])},
};

/* ---- Belastete Strukturen: Dehnung/Haltearbeit je Struktur plus Engstellen (Kompression) auf die betroffenen Strukturen abbilden ---- */
function computeLoads(){
  const M=EVAL.metrics; const out={};
  const add=(id,score,label,col)=>{ const e=out[id]||(out[id]={score:0,labels:[],col}); if(score>e.score){ e.score=score; e.col=col; } e.labels.push(label); };
  for(const s of STRUCT){ if(s.surface||s.static) continue; const st=structStrain(s.id);
    if(s.kind==='muscle'){ if(st>0.08) add(s.id,st/0.35,t('stretched')+fmt(st*100)+' %','var(--red)');
      const a=EVAL.act[s.id]||0; if(a>0.22) add(s.id,a*0.9,t('holding')+' '+fmt(Math.min(a,1.5)*100)+' %','var(--amber)'); }
    else if(st>0.04) add(s.id,st/0.12,t('tensioned')+fmt(st*100)+' %','var(--red)');
  }
  const capMax=Math.max(M.capAnt,M.capPost,M.capInf,M.capSup); if(capMax>0.04){ const reg=[[t('ant'),M.capAnt],[t('post'),M.capPost],[t('inf'),M.capInf],[t('sup_'),M.capSup]].filter(r=>r[1]>0.04).map(r=>r[0]).join(', '); add('capsule',capMax/0.12,t('tensionedReg')+' '+reg+' +'+fmt(capMax*100)+' %','var(--red)'); }
  if(M.bursaComp>0.05){ add('bursa',M.bursaComp+0.2,t('compressed')+fmt(M.ahd*10,1)+' mm)','var(--violet)'); add('supra',M.bursaComp+0.25,t('underArch')+fmt(M.ahd*10,1)+' mm)','var(--violet)'); }
  if(M.corComp>0.05){ add('subsc',M.corComp+0.15,t('underCor')+fmt(M.chd*10,1)+' mm)','var(--violet)'); }
  if(M.grooveComp>0.15){ add('bicLH',M.grooveComp+0.1,t('inGroove'),'var(--violet)'); }
  if(M.psComp>0.05){ add('infra',M.psComp+0.15,t('postRim')+fmt(M.psd*10,1)+' mm)','var(--violet)'); }
  return out;
}
/* Gruppen in fester klinischer Reihenfolge (häufigste Problemzonen oben), innerhalb alphabetisch; Zeilen mit Hysterese ein-/ausblenden, damit nichts springt.
   Reihenfolge nie ändern – Gruppenindex steckt in Kurz-Links. */
const LOAD_GROUPS=[
 {id:'cuff',key:'lgCuffB',ids:['supra','infra','tmin','subsc','bursa'],open:true},
 {id:'joint',key:'lgJointB',ids:['capsule','GHL','CHL'],open:true},
 {id:'arm',key:'lgArmB',ids:['bicLH','bicSH','corbr','triLH'],open:true},
 {id:'delt',key:'lgDeltB',ids:['deltA','deltM','deltP'],open:false},
 {id:'back',key:'lgBackB',ids:['trapU','trapM','trapL','rhomb','lev','serr','lat','tmaj'],open:false},
 {id:'chest',key:'lgChestB',ids:['pecM','pecMin'],open:false},
 {id:'nerve',key:'lgNerveB',ids:['nAx','nSS'],open:false},
];

/* Anzeigenamen der Teile, die keine Strukturen sind (Knochen, Labrum, Bursa, Kapsel) – Schlüssel in i18n.js */
const BONE_NAME_KEYS={thorax:'nameThorax',clav:'nameClav',scap:'nameScap',hum:'nameHum',fore:'nameFore',labrum:'nameLabrum',bursa:'nameBursa',capsule:'nameCapsule'};
/* Schnellwahl der Schichten (Buttons „nur Knochen“ / „Manschette“) */
const LAYER_PRESETS={bones:['thorax','clav','scap','hum','fore','labrum'],cuff:['thorax','clav','scap','hum','fore','labrum','capsule','bursa','CAL','CHL','GHL','ACCC','supra','infra','tmin','subsc','bicLH']};

/* Zusatzzeilen im Struktur-Info: welche Engstellen-Werte zu welcher Struktur gehören */
function structReadouts(id,M){
  const rows=[];
  if(id==='capsule') rows.push([t('liRegions'),[M.capAnt,M.capPost,M.capInf,M.capSup].map(v=>(v>=0?'+':'')+fmt(v*100)+' %').join(' · ')]);
  if(id==='supra'||id==='bursa') rows.push([t('liAHD'),fmt(M.ahd*10,1)+' mm']);
  if(id==='subsc') rows.push([t('liCHD'),fmt(M.chd*10,1)+' mm']);
  if(id==='bicLH') rows.push([t('liDefl'),(M.lbsDeflRel>=0?'+':'')+fmt(M.lbsDeflRel)+'° '+t('liVsRest')],[t('liIntra'),(M.lbsStrain>=0?'+':'')+fmt(M.lbsStrain*100)+' % '+t('liLength')]);
  if(id==='infra') rows.push([t('liPSD'),fmt(M.psd*10,1)+' mm']);
  if(id==='nAx') rows.push([t('liStrain'),(M.axStrain>=0?'+':'')+fmt(M.axStrain*100)+' %']);
  return rows;
}

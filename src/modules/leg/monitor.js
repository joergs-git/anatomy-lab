/* ===================== Bein: Last-Monitor, belastete Strukturen, Struktur-Zusatzwerte =====================
   METRICS: Zeilen (get liest EVAL.metrics; levels: Schwelle → Statuswort → Statusklasse, absteigend geprüft; text: Sonderformat).
   MONITOR: oben die häufigen Lasten (patellofemoral, tibiofemoral, VKB, Sehnen), darunter eingeklappt die Spezialfälle;
   die Sprunggelenkbänder als Sammelzeile (aggregate). LOAD_GROUPS: Gruppen der Strukturliste – Reihenfolge nie ändern. */
const LV_FORCE=[[5,'lvVeryHigh','crit'],[3,'lvHigh','bad'],[1.5,'lvMod','warn'],[-1,'lvLow','ok']];
const LV_TENS=[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']];
const METRICS=[
 {id:'pf',name:'Patellofemorale Kraft',unit:'× KG',get:M=>M.pfBW,levels:LV_FORCE,max:8,text:(v,M)=>fmt(v,1)+' × KG · '+fmt(M.pf)+' N',sub:'Quadrizeps- und Patellarsehnenzug pressen die Patella in die Trochlea; wächst mit Beugung und Last (Gehen ≈ 0,5, Treppe ≈ 3, tiefe Kniebeuge 5–7 × KG)'},
 {id:'pfPress',name:'Patellofemoraler Druck',unit:'MPa',get:M=>M.pfPress,levels:[[6,'lvVeryHigh','crit'],[4,'lvHigh','bad'],[2,'lvMod','warn'],[-1,'lvLow','ok']],max:8,text:(v,M)=>fmt(v,1)+' MPa · '+fmt(M.pfArea,1)+' cm²',sub:'Kraft ÷ Kontaktfläche (2–6 cm², wächst bis 90°); Knorpelverlust verkleinert die Fläche'},
 {id:'tf',name:'Tibiofemorale Kompression',unit:'× KG',get:M=>M.tfBW,levels:LV_FORCE,max:8,text:(v,M)=>fmt(v,1)+' × KG · '+fmt(M.tf)+' N',sub:'Bodenreaktion plus Sehnenzug entlang der Tibia (Gehen 2–3, Kniebeuge 5–7 × KG)'},
 {id:'acl',name:'Vorderes Kreuzband (VKB)',unit:'N',get:M=>M.acl,levels:[[400,'lvVeryHigh','crit'],[200,'lvHigh','bad'],[80,'lvMod','warn'],[-1,'lvLow','ok']],max:600,text:(v,M)=>fmt(v)+' N · '+(M.aclStrain>=0?'+':'')+fmt(M.aclStrain*100)+' %'+(M.aclShift>1?' · '+fmt(M.aclShift,1)+' mm':''),sub:'Vorderer Schub der Patellarsehne nahe der Streckung (Beinstrecker, Landung); Innenrotation + Valgus spannen zusätzlich'},
 {id:'pcl',name:'Hinteres Kreuzband (HKB)',unit:'N',get:M=>M.pcl,levels:[[400,'lvVeryHigh','crit'],[200,'lvHigh','bad'],[80,'lvMod','warn'],[-1,'lvLow','ok']],max:600,text:(v,M)=>fmt(v)+' N · '+(M.pclStrain>=0?'+':'')+fmt(M.pclStrain*100)+' %',sub:'Hinterer Schub durch Hamstrings und tiefe Beugung'},
 {id:'patTen',name:'Patellarsehne',unit:'× KG',get:M=>M.patTenBW,levels:LV_FORCE,max:8,text:(v,M)=>fmt(v,1)+' × KG · '+fmt(M.patTen)+' N',sub:'Zug der Quadrizepskraft auf die Tuberositas (Jumper’s Knee ab ≈ 6 × KG beim Absprung)'},
 {id:'ach',name:'Achillessehne',unit:'× KG',get:M=>M.achBW,levels:[[4,'lvVeryHigh','crit'],[2.5,'lvHigh','bad'],[1,'lvMod','warn'],[-1,'lvLow','ok']],max:6,text:(v,M)=>fmt(v,1)+' × KG · '+fmt(M.ach)+' N',sub:'Gastrocnemius + Soleus gegen das Sprunggelenkmoment (Gehen 3–4, Laufen 6–8 × KG)'},
 {id:'hipJ',name:'Hüftkontaktkraft',unit:'× KG',get:M=>M.hipBW,levels:[[4,'lvVeryHigh','crit'],[2.5,'lvHigh','bad'],[1,'lvMod','warn'],[-1,'lvLow','ok']],max:6,text:(v,M)=>fmt(v,1)+' × KG',sub:'Muskelzug + Bodenreaktion (Einbeinstand ≈ 2,5 × KG)'},
 {id:'itb',name:'Tractus ↔ lateraler Epikondylus',unit:'%',get:M=>M.itbComp*100,levels:[[60,'lvFriction','bad'],[25,'lvContact','warn'],[-1,'lvFree','ok']],max:100,text:(v,M)=>(M.itbOff>=0?t('itbAnt'):t('itbPost'))+' '+fmt(Math.abs(M.itbOff))+' mm',sub:'Der Tractus gleitet bei 15–30° Beugung über den Epikondylus (Läuferknie)'},
 {id:'ankAnt',name:'Vorderes Sprunggelenk-Impingement',unit:'mm',get:M=>M.ankAnt,levels:[[6,'lvFree','ok'],[3,'lvContact','warn'],[-99,'lvStop','bad']],max:20,sub:'Talushals ↔ Tibiavorderrand in Dorsalextension (Kniebeuge, Fußballer)'},
 {id:'ankPost',name:'Hinteres Impingement (Os trigonum)',unit:'mm',get:M=>M.ankPost,levels:[[6,'lvFree','ok'],[3,'lvContact','warn'],[-99,'lvStop','bad']],max:20,sub:'Processus posterior ↔ Tibiahinterrand in Plantarflexion (Ballett, Fußball)'},
 {id:'men',name:'Menisken: Hinterhorn-Kompression',unit:'%',get:M=>M.menComp*100,levels:[[60,'lvStrong','bad'],[20,'lvRaised','warn'],[-1,'lvRest','ok']],max:100,sub:'Ab ≈ 115° werden die Hinterhörner nach hinten gedrängt (tiefe Hocke, Fersensitz)'},
 {id:'atfl',name:'ATFL (vorderes Außenband)',unit:'%',get:M=>M.atfl*100,levels:LV_TENS,max:12,tension:true},
 {id:'cfl',name:'CFL (Fersenbein-Außenband)',unit:'%',get:M=>M.cfl*100,levels:LV_TENS,max:12,tension:true},
 {id:'ptfl',name:'PTFL (hinteres Außenband)',unit:'%',get:M=>M.ptfl*100,levels:LV_TENS,max:12,tension:true},
 {id:'delt',name:'Deltaband (Innenband)',unit:'%',get:M=>M.delt*100,levels:LV_TENS,max:12,tension:true},
 {id:'mcl',name:'Innenband (MCL)',unit:'%',get:M=>M.mcl*100,levels:LV_TENS,max:12,tension:true},
 {id:'lcl',name:'Außenband (LCL)',unit:'%',get:M=>M.lcl*100,levels:LV_TENS,max:12,tension:true},
 {id:'nerve',name:'N. peroneus communis',unit:'%',get:M=>M.nerve*100,levels:[[8,'lvStretched','warn'],[-99,'lvRelaxed','ok']],max:12,tension:true},
];
/* Reihenfolge nach klinischer Häufigkeit: vorderer Knieschmerz (patellofemoral), Arthrose/Meniskus (tibiofemoral), VKB, Sehnen; Sprunggelenkbänder als Sammelzeile.
   Eingeklappt: HKB, Hüfte, Tractus, Impingements, Menisken, Seitenbänder, Nerv. */
const ANKLE_LIG=['atfl','cfl','ptfl','delt'];
const MONITOR={
  top:['pf','pfPress','tf','acl','patTen','ach','ankleLig'], special:['pcl','hipJ','itb','ankAnt','ankPost','men','mcl','lcl','nerve'],
  aggregate:{id:'ankleLig',ids:ANKLE_LIG,nameKey:'mAnkleLig',max:12,tension:true,
    text:(v,best)=>(v>=0?'+':'')+fmt(v)+' % '+t({atfl:'ligAtfl',cfl:'ligCfl',ptfl:'ligPtfl',delt:'ligDelt'}[best])},
};

/* ---- Belastete Strukturen: Dehnung/Haltearbeit je Struktur plus Lasten und Engstellen auf die betroffenen Strukturen abbilden ---- */
function computeLoads(){
  const M=EVAL.metrics; const out={};
  const add=(id,score,label,col)=>{ const e=out[id]||(out[id]={score:0,labels:[],col}); if(score>e.score){ e.score=score; e.col=col; } e.labels.push(label); };
  for(const s of STRUCT){ if(s.surface||s.static) continue; const st=structStrain(s.id);
    if(s.kind==='muscle'){ if(st>0.08) add(s.id,st/0.35,t('stretched')+fmt(st*100)+' %','var(--red)');
      const a=EVAL.act[s.id]||0; if(a>0.22) add(s.id,a*0.9,t('holding')+' '+fmt(Math.min(a,1.5)*100)+' %','var(--amber)'); }
    else if(st>0.04) add(s.id,st/0.12,t('tensioned')+fmt(st*100)+' %','var(--red)');
  }
  if(M.patTenBW>0.5) add('patTen',M.patTenBW/4,t('force')+' '+fmt(M.patTen)+' N ('+fmt(M.patTenBW,1)+' × KG)','var(--amber)');
  if(M.acl>60) add('ACL',M.acl/400,t('force')+' '+fmt(M.acl)+' N','var(--red)');
  if(M.pcl>60) add('PCL',M.pcl/400,t('force')+' '+fmt(M.pcl)+' N','var(--red)');
  if(M.pfBW>1) add('patella',M.pfBW/6,t('pressed')+' '+fmt(M.pfBW,1)+' × KG · '+fmt(M.pfPress,1)+' MPa','var(--violet)');
  if(M.menComp>0.1) add('menisci',M.menComp,t('compressedPost'),'var(--violet)');
  if(M.itbComp>0.25) add('tfl',M.itbComp,t('overEpi'),'var(--violet)');
  if(M.ankAntComp>0.2) add('foot',M.ankAntComp,t('antImp')+' '+fmt(M.ankAnt)+' mm','var(--violet)');
  if(M.ankPostComp>0.2) add('foot',M.ankPostComp,t('postImp')+' '+fmt(M.ankPost)+' mm','var(--violet)');
  if(M.achBW>0.5) add('soleus',M.achBW/4,t('achForce')+' '+fmt(M.ach)+' N','var(--amber)');
  return out;
}
/* Gruppen in fester klinischer Reihenfolge, innerhalb alphabetisch; nie umsortieren – Gruppenindex steckt in Kurz-Links. */
const LOAD_GROUPS=[
 {id:'kneeJ',key:'lgKneeB',ids:['patella','patTen','ACL','PCL','MCL','LCL','menisci','hoffa'],open:true},
 {id:'quad',key:'lgQuadB',ids:['rectF','vastL','vastM'],open:true},
 {id:'ham',key:'lgHamB',ids:['bicF','semimem','semitend','sart','gracilis'],open:true},
 {id:'calf',key:'lgCalfB',ids:['gastroM','gastroL','soleus','tibAnt','tibPost','peron','plantar'],open:false},
 {id:'hip',key:'lgHipB',ids:['glutMax','glutMed','tfl','addMag','iliopsoas'],open:false},
 {id:'ankle',key:'lgAnkleB',ids:['atfl','cfl','ptfl','deltoid','foot'],open:false},
 {id:'nerve',key:'lgNerveB',ids:['nPer'],open:false},
];

/* Anzeigenamen der Teile, die keine Strukturen sind – Schlüssel in i18n.js */
const BONE_NAME_KEYS={pelvis:'namePelvis',femur:'nameFemur',patella:'namePatella',tibia:'nameTibia',foot:'nameFoot',other:'nameOther',ground:'nameGround',hoffa:'nameHoffa'};
/* Schnellwahl der Schichten */
const LAYER_PRESETS=[
 {id:'bones',key:'lyBones',ids:['pelvis','femur','patella','tibia','foot','other','ground']},
 {id:'knee',key:'lyKnee',ids:['pelvis','femur','patella','tibia','foot','other','ground','ACL','PCL','MCL','LCL','patTen','menisci','hoffa','rectF','vastL','vastM']},
];

/* Zusatzzeilen im Struktur-Info */
function structReadouts(id,M){
  const rows=[];
  if(id==='patella') rows.push([t('liPF'),fmt(M.pfBW,1)+' × KG · '+fmt(M.pf)+' N'],[t('liPFp'),fmt(M.pfPress,1)+' MPa']);
  if(id==='patTen'||id==='rectF'||id==='vastL'||id==='vastM') rows.push([t('liPT'),fmt(M.patTen)+' N ('+fmt(M.patTenBW,1)+' × KG)']);
  if(id==='ACL') rows.push([t('liForce'),fmt(M.acl)+' N'],[t('liShift'),fmt(M.aclShift,1)+' mm']);
  if(id==='PCL') rows.push([t('liForce'),fmt(M.pcl)+' N']);
  if(id==='tfl') rows.push([t('liItb'),(M.itbOff>=0?t('itbAnt'):t('itbPost'))+' '+fmt(Math.abs(M.itbOff))+' mm']);
  if(id==='soleus'||id==='gastroM'||id==='gastroL') rows.push([t('liAch'),fmt(M.ach)+' N ('+fmt(M.achBW,1)+' × KG)']);
  if(id==='menisci') rows.push([t('liMen'),fmt(M.menComp*100)+' %']);
  if(id==='foot') rows.push([t('liAnkA'),fmt(M.ankAnt)+' mm'],[t('liAnkP'),fmt(M.ankPost)+' mm']);
  if(id==='femur'||id==='tibia') rows.push([t('liTF'),fmt(M.tfBW,1)+' × KG']);
  if(id==='pelvis') rows.push([t('liHip'),fmt(M.hipBW,1)+' × KG']);
  return rows;
}

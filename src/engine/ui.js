/* ===================== Bedienung ===================== */
const UI={strain:true,labels:false,mode:'arm',speed:1,loopSweeps:true,langExplicit:LANG_EXPLICIT};
const $=id=>document.getElementById(id);
const SL={E:$('sElev'),P:$('sPlane'),IR:$('sRot'),elbow:$('sElbow'),pro:$('sPro')};
const VL={E:$('vElev'),P:$('vPlane'),IR:$('vRot'),elbow:$('vElbow'),pro:$('vPro')};
let syncing=false;
function planeLabel(P){ return t(P<-60?'plane0':P<-15?'plane1':P<=15?'plane2':P<=55?'plane3':P<=110?'plane4':'plane5'); }
function syncSliders(){
  syncing=true;
  for(const k in SL){ const v=Math.round(pose[k]); if(+SL[k].value!==v) SL[k].value=v; }
  VL.E.textContent=fmt(pose.E)+'°'; VL.P.textContent=fmt(pose.P)+'° · '+planeLabel(pose.P);
  VL.IR.textContent=(pose.IR<0?t('ER'):t('IR'))+' '+fmt(Math.abs(pose.IR))+'°'; VL.elbow.textContent=fmt(pose.elbow)+'°';
  VL.pro.textContent=Math.abs(pose.pro)<3?t('neutralS'):(pose.pro<0?t('sup'):t('pro'))+' '+fmt(Math.abs(pose.pro))+'°';
  const rl=rotLimits(pose.E,pose.P); SL.IR.min=Math.round(-rl.ER); SL.IR.max=Math.round(rl.IR); SL.E.max=Math.round(Emax(pose.P));
  syncing=false;
}
for(const k in SL){ SL[k].addEventListener('input',()=>{ if(syncing) return; stopAnim(); const o={}; o[k]=+SL[k].value; setPose(o); }); }
$('btnNeutral').addEventListener('click',()=>runPreset(PRESETS[0]));
// Pathologie
const PL={migr:$('sMigr'),gird:$('sGird'),frozen:$('sFrozen')};
function syncPathoLabels(){ $('vMigr').textContent=fmt(patho.migr,1)+' mm'; $('vGird').textContent=fmt(patho.gird*100)+' %'; $('vFrozen').textContent=fmt(patho.frozen*100)+' %'; }
function setPatho(p){ Object.assign(patho,p); PL.migr.value=patho.migr; PL.gird.value=Math.round(patho.gird*100); PL.frozen.value=Math.round(patho.frozen*100); syncPathoLabels(); setPose({}); }
PL.migr.addEventListener('input',()=>setPatho({migr:+PL.migr.value}));
PL.gird.addEventListener('input',()=>setPatho({gird:+PL.gird.value/100}));
PL.frozen.addEventListener('input',()=>setPatho({frozen:+PL.frozen.value/100}));
function syncSpeedLabel(){ $('vSpeed').textContent=fmt(UI.speed,2).replace(/[.,]?0+$/,'')+'×'; }
function setSpeed(v){ UI.speed=clamp(v,0.25,2); $('sSpeed').value=UI.speed; syncSpeedLabel(); }
$('sSpeed').addEventListener('input',e=>setSpeed(+e.target.value));
function setLoop(on){ UI.loopSweeps=!!on; $('cbLoop').checked=UI.loopSweeps; setLoopLive(UI.loopSweeps); }
$('cbLoop').addEventListener('change',e=>setLoop(e.target.checked));
/* Schleife auch während einer laufenden Animation umschalten – ohne Sprung */
function setLoopLive(on){
  if(!poseAnim) return; const a=poseAnim; const now=performance.now(); const d=a.dur/UI.speed;
  if(on&&!a.loop){ const t_=clamp((now-a.t0)/d,0,1); a.loop=true; a.t0=now-t_*d; a.then=null; }
  else if(!on&&a.loop){ let t_=((now-a.t0)/d)%2; const back=t_>1; if(back){ t_=2-t_; const f=a.from; a.from=a.to; a.to=f; }
    a.loop=false; a.t0=now-t_*d; a.then=()=>{ releaseChip(); }; }
}

/* ---- Klinische Positionen ---- */
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
const RUNNABLE={}; [...PRESETS,...ANIMS,...PHYSIO].forEach(x=>RUNNABLE[x.id]=x);
const presetName=pr=>LANG==='en'?(PRESET_EN[pr.id]||pr.name):pr.name;
const loadLabel=pr=>pr.load?(LANG==='en'?(LOAD_EN[pr.id]||pr.load.label):pr.load.label):'';
let poseAnim=null, activeChip=null, activeRunId=null;
function releaseChip(){ if(activeChip){ activeChip.classList.remove('on'); activeChip=null; } activeRunId=null; }
function stopAnim(){ poseAnim=null; releaseChip(); }
function setLoad(load,srcId){ if(load){ EXT.F=V3(load.F[0],load.F[1],load.F[2]); EXT.label=load.label; EXT.axialOnly=!!load.axialOnly; EXT.src=srcId||null; } else { EXT.F=null; EXT.label=''; EXT.axialOnly=false; EXT.src=null; } }
function animateTo(target,dur,opts={}){ poseAnim={t0:performance.now(),dur,from:Object.assign({},pose),to:Object.assign({},pose,target),loop:!!opts.loop,then:opts.then||null}; }
function stepAnim(now){
  if(!poseAnim) return false;
  const a=poseAnim; let t_=(now-a.t0)/(a.dur/UI.speed);
  if(a.loop){ t_=t_%2; if(t_>1) t_=2-t_; } else t_=clamp(t_,0,1);
  const s=smooth(t_); const p={}; for(const k of ['P','E','IR','elbow','pro']) p[k]=lerp(a.from[k],a.to[k],s);
  Object.assign(pose,p); const r=applyPose(); onPoseChanged(r,true);
  if(!a.loop&&t_>=1){ poseAnim=null; if(a.then) a.then(); else releaseChip(); }
  return true;
}
/* Bewegungsabschnitt start→ende: endlos (Pingpong) oder einmal hin (und bei Schleifenpresets zurück) */
function playSegment(target,dur,back){
  if(UI.loopSweeps) animateTo(target,dur,{loop:true});
  else animateTo(target,dur,{then:()=>{ if(back) animateTo(back,dur,{then:releaseChip}); else releaseChip(); }});
}
function runPreset(pr,chip){
  chip=chip||pr.chip;
  const wasOn=chip&&chip.classList.contains('on'); stopAnim(); setLoad(pr.load||null,pr.id);
  if(wasOn&&(pr.loop||pr.sweep)){ setPose({}); return; }   /* laufende Animation per erneutem Klick beenden */
  if(chip){ chip.classList.add('on'); activeChip=chip; activeRunId=pr.id; }
  animateTo(pr.pose,750,{then:()=>{
    if(pr.loop) playSegment(pr.loop,2800,pr.pose);
    else if(pr.sweep) playSegment(pr.sweep,2600,null);
    else releaseChip(); }});
}
function runAnim(an,chip){
  chip=chip||an.chip;
  const wasOn=chip.classList.contains('on'); stopAnim(); setLoad(null); if(wasOn){ setPose({}); return; }
  chip.classList.add('on'); activeChip=chip; activeRunId=an.id;
  animateTo(an.from,700,{then:()=>{ playSegment(an.to,an.dur,an.from); }});
}
function runById(id){ const x=RUNNABLE[id]; if(!x) return false; if(x.from) runAnim(x,x.chip); else runPreset(x,x.chip); return true; }
(function buildChips(){
  const pc=$('presets'); PRESETS.forEach(pr=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=presetName(pr); b.addEventListener('click',()=>runPreset(pr,b)); pc.appendChild(b); pr.chip=b; });
  const ph=$('physio'); PHYSIO.forEach(pr=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=presetName(pr); b.title=loadLabel(pr); b.addEventListener('click',()=>runPreset(pr,b)); ph.appendChild(b); pr.chip=b; });
  const ac=$('anims'); ANIMS.forEach(an=>{ const b=document.createElement('button'); b.className='chip anim'; b.textContent=presetName(an); b.addEventListener('click',()=>runAnim(an,b)); ac.appendChild(b); an.chip=b; });
})();
function relabelChips(){ for(const x of [...PRESETS,...ANIMS,...PHYSIO]){ x.chip.textContent=presetName(x); if(x.load) x.chip.title=loadLabel(x); } }

/* ---- Schichten ---- */
const LAYER_UI={groups:{},items:{}};
const groupName=g=>LANG==='en'?(GROUP_EN[g.id]||g.name):g.name;
const layerName=(id,de)=>LANG==='en'?(LAYER_EN[id]||de):de;
(function buildLayers(){
  const root=$('layers');
  for(const g of LAYER_GROUPS){
    const d=document.createElement('div'); d.className='lgroup';
    const h=document.createElement('div'); h.className='lgroup-h';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=true; cb.id='lg-'+g.id;
    const sw=document.createElement('span'); sw.className='sw'; sw.style.background=g.color;
    const lab=document.createElement('label'); lab.htmlFor=cb.id; lab.textContent=groupName(g);
    const op=document.createElement('input'); op.type='range'; op.className='op'; op.min=0.1; op.max=1; op.step=0.05; op.value=1; op.id='op-'+g.id; op.title=t('opT');
    h.append(cb,sw,lab,op); d.appendChild(h);
    LAYER_UI.groups[g.id]={cb,lab,op,g};
    const items=document.createElement('div'); items.className='litems';
    const boxes=[];
    for(const [id,name] of g.items){ const l=document.createElement('label'); const c=document.createElement('input'); c.type='checkbox'; c.checked=true; c.id='ly-'+id; c.dataset.id=id; const tn=document.createTextNode(layerName(id,name)); l.append(c,tn); items.appendChild(l); boxes.push(c);
      LAYER_UI.items[id]={c,l,tn,de:name};
      c.addEventListener('change',()=>{ VIS[id]=c.checked; l.classList.toggle('hl',c.checked); cb.checked=boxes.some(b=>b.checked); applyVisibility(); updateLabels(); }); }
    cb.addEventListener('change',()=>{ boxes.forEach(b=>{ b.checked=cb.checked; VIS[b.dataset.id]=cb.checked; }); applyVisibility(); updateLabels(); });
    op.addEventListener('input',()=>{ GROUP_OPACITY[g.id]=+op.value; applyVisibility(); });
    d.appendChild(items); root.appendChild(d);
  }
  $('btnLayersBones').addEventListener('click',()=>setAllLayers(id=>['thorax','clav','scap','hum','fore','labrum'].includes(id)));
  $('btnLayersCuff').addEventListener('click',()=>setAllLayers(id=>['thorax','clav','scap','hum','fore','labrum','capsule','bursa','CAL','CHL','GHL','ACCC','supra','infra','tmin','subsc','bicLH'].includes(id)));
  $('btnLayersAll').addEventListener('click',()=>setAllLayers(()=>true));
  $('cbLabels').addEventListener('change',e=>setLabelsOn(e.target.checked));
  $('cbStrain').addEventListener('change',e=>setStrainOn(e.target.checked));
})();
/* Sichtbarkeit aller Schichten per Funktion id→bool setzen (Buttons, geteilte Links) */
function setAllLayers(fn){ for(const id of allIds()){ VIS[id]=!!fn(id); const it=LAYER_UI.items[id]; if(it){ it.c.checked=VIS[id]; it.l.classList.toggle('hl',VIS[id]); } } for(const g of LAYER_GROUPS){ LAYER_UI.groups[g.id].cb.checked=g.items.some(it=>VIS[it[0]]); } applyVisibility(); updateLabels(); }
function setGroupOpacity(gid,v){ if(!(gid in GROUP_OPACITY)) return; GROUP_OPACITY[gid]=clamp(v,0.1,1); LAYER_UI.groups[gid].op.value=GROUP_OPACITY[gid]; applyVisibility(); }
function setLabelsOn(on){ UI.labels=!!on; $('cbLabels').checked=UI.labels; updateLabels(); }
function setStrainOn(on){ UI.strain=!!on; $('cbStrain').checked=UI.strain; setPose({}); }
function relabelLayers(){ for(const gid in LAYER_UI.groups){ const u=LAYER_UI.groups[gid]; u.lab.textContent=groupName(u.g); u.op.title=t('opT'); } for(const id in LAYER_UI.items){ const it=LAYER_UI.items[id]; it.tn.nodeValue=layerName(id,it.de); } }

/* ---- Engstellen-Monitor ---- */
const METRICS=[
 {id:'ahd',name:'Subakromialer Abstand',unit:'mm',get:M=>M.ahd*10,levels:[[7,'lvFree','ok'],[5,'lvContact','warn'],[3,'lvNarrow','bad'],[-99,'lvSevere','crit']],max:12,sub:'Schulterdach ↔ Humeruskopf/Tub. majus; hier laufen Supraspinatussehne und Bursa (Ruhe ≈ 9–10 mm)'},
 {id:'chd',name:'Subkorakoidaler Abstand',unit:'mm',get:M=>M.chd*10,levels:[[8,'lvFree','ok'],[6,'lvContact','warn'],[4,'lvNarrow','bad'],[-99,'lvSevere','crit']],max:14,sub:'Coracoid ↔ Tub. minus; Subscapularissehne, Rotatorenintervall, lange Bizepssehne'},
 {id:'psd',name:'Posterosuperiorer Pfannenrand ↔ Manschettenansatz',unit:'mm',get:M=>M.psd*10,levels:[[8,'lvFree','ok'],[4,'lvContact','warn'],[-99,'lvStop','bad']],max:20,sub:'Internes Impingement in der Wurfposition (Abduktion + Außenrotation)'},
 {id:'capAnt',name:'Kapsel vorn (SGHL · MGHL · IGHL)',unit:'%',get:M=>M.capAnt*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capPost',name:'Kapsel hinten',unit:'%',get:M=>M.capPost*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capInf',name:'Kapsel unten (Recessus axillaris)',unit:'%',get:M=>M.capInf*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'capSup',name:'Kapsel oben / Rotatorenintervall',unit:'%',get:M=>M.capSup*100,levels:[[10,'lvEnd','bad'],[5,'lvTens','warn'],[0,'lvBears','ok'],[-99,'lvSlack','ok']],max:12,tension:true},
 {id:'lbs',name:'Lange Bizepssehne: Umlenkung am Sulcuseingang',unit:'°',get:M=>M.lbsDeflRel,levels:[[40,'lvStrong','bad'],[15,'lvRaised','warn'],[-99,'lvRest','ok']],max:90,sub:'Zusatzknick gegenüber Ruhe (Innenrotation, Flexion); dazu Länge des intraartikulären Anteils'},
 {id:'nax',name:'N. axillaris (quadrilateraler Raum)',unit:'%',get:M=>M.axStrain*100,levels:[[8,'lvStretched','warn'],[-99,'lvRelaxed','ok']],max:12,tension:true},
 {id:'jrf',name:'Gelenkreaktionskraft (Kompression im Gelenk)',unit:'N',get:M=>M.jrf,levels:[[900,'lvVeryHigh','crit'],[500,'lvHigh','bad'],[200,'lvMod','warn'],[-1,'lvLow','ok']],max:1200,sub:'Schätzung aus Muskelzug, Armgewicht und äußerer Last (Band, Hantel, Wand)'},
];
const metricName=m=>LANG==='en'&&METRIC_EN[m.id]?METRIC_EN[m.id].name:m.name;
const metricSub=m=>LANG==='en'&&METRIC_EN[m.id]?(METRIC_EN[m.id].sub||''):(m.sub||'');
const metricEls={};
/* Reihenfolge nach klinischer Häufigkeit: subakromial (≈ Hälfte aller Schulterbeschwerden), Kapsel (Frozen Shoulder, GIRD, Instabilität),
   lange Bizepssehne, Gelenkkraft – darunter eingeklappt die Spezialfälle (Wurfsport, selten). */
const CAP_IDS=['capAnt','capPost','capInf','capSup'];
const METRIC_TOP=['ahd','capsule','lbs','jrf'], METRIC_SPECIAL=['psd','chd','nax'];
const MON={capOpen:false,specialOpen:false};
const LEVEL_RANK={ok:0,warn:1,bad:2,crit:3};
function metricRow(m,sub){ const d=document.createElement('div'); d.className='metric'+(sub?' sub':''); d.innerHTML=`<span class="mname"></span><span class="mval"><span class="v"></span><span class="stat ok"></span></span><div class="mbar"><i></i></div><span class="msub"></span>`;
  metricEls[m.id]={n:d.querySelector('.mname'),v:d.querySelector('.v'),s:d.querySelector('.stat'),b:d.querySelector('.mbar i'),sub:d.querySelector('.msub'),el:d}; return d; }
const M_BY_ID={}; METRICS.forEach(m=>M_BY_ID[m.id]=m);
(function buildMetrics(){
  const root=$('metrics');
  for(const id of METRIC_TOP){
    if(id==='capsule'){
      const d=document.createElement('div'); d.className='metric'; d.innerHTML=`<span class="mname"></span><span class="mval"><span class="v"></span><span class="stat ok"></span></span><div class="mbar"><i></i></div><button type="button" class="mtgl msub" id="capTgl"></button>`;
      metricEls.capsule={n:d.querySelector('.mname'),v:d.querySelector('.v'),s:d.querySelector('.stat'),b:d.querySelector('.mbar i'),el:d}; root.appendChild(d);
      const subs=document.createElement('div'); subs.className='msubs'; subs.id='capSubs'; subs.hidden=true; CAP_IDS.forEach(cid=>subs.appendChild(metricRow(M_BY_ID[cid],true))); root.appendChild(subs);
      $('capTgl').addEventListener('click',()=>setCapOpen(!MON.capOpen));
    } else root.appendChild(metricRow(M_BY_ID[id]));
  }
  const acc=document.createElement('button'); acc.type='button'; acc.className='acc'; acc.id='monAcc'; acc.setAttribute('aria-expanded','false');
  acc.innerHTML=`<span class="acc-chev">▸</span><span class="acc-t"><span id="monAccT"></span><span class="acc-sub" id="monAccS"></span></span><span class="stat ok acc-badge" id="monBadge"></span>`; root.appendChild(acc);
  const body=document.createElement('div'); body.className='acc-body'; body.id='monBody'; body.hidden=true; METRIC_SPECIAL.forEach(id=>body.appendChild(metricRow(M_BY_ID[id]))); root.appendChild(body);
  acc.addEventListener('click',()=>setSpecialOpen(!MON.specialOpen));
  relabelMetrics();
})();
function setCapOpen(on){ MON.capOpen=!!on; $('capSubs').hidden=!MON.capOpen; $('capTgl').textContent=t(MON.capOpen?'mCapHide':'mCapShow'); needsRender=true; }
function setSpecialOpen(on){ MON.specialOpen=!!on; $('monBody').hidden=!MON.specialOpen; $('monAcc').setAttribute('aria-expanded',String(MON.specialOpen)); needsRender=true; }
function relabelMetrics(){ for(const m of METRICS){ const e=metricEls[m.id]; e.n.textContent=metricName(m); const s=metricSub(m); e.sub.textContent=s; e.sub.style.display=s?'':'none'; }
  metricEls.capsule.n.textContent=t('mCapsule'); $('capTgl').textContent=t(MON.capOpen?'mCapHide':'mCapShow'); $('monAccT').textContent=t('mgSpecial'); $('monAccS').textContent=t('mgSpecialSub'); }
function levelOf(m,v){ for(const l of m.levels) if(v>=l[0]) return l; return m.levels[m.levels.length-1]; }
const statColor={ok:'var(--green)',warn:'var(--amber)',bad:'var(--red)',crit:'var(--violet)'};
function updateMetrics(M){
  const lv={};
  for(const m of METRICS){ const v=m.get(M); const l=levelOf(m,v); lv[m.id]={v,l}; const e=metricEls[m.id];
    let txt; if(m.id==='lbs') txt=(v>=0?'+':'')+fmt(v)+'°'+(M.lbsStrain<-0.1?' · '+fmt(M.lbsStrain*100)+t('shorter'):M.lbsStrain>0.05?' · +'+fmt(M.lbsStrain*100)+t('longer'):'');
    else if(m.tension) txt=(v>=0?'+':'')+fmt(v)+' %'; else txt=fmt(v,1)+' '+m.unit;
    e.v.textContent=txt; e.s.textContent=t(l[1]); e.s.className='stat '+l[2];
    const fill=m.tension?clamp((v+3)/(m.max+3),0,1):clamp(v/m.max,0,1); e.b.style.width=(fill*100).toFixed(1)+'%'; e.b.style.background=statColor[l[2]]; }
  /* Kapsel-Sammelzeile: stärkster Anteil */
  { const regKey={capAnt:'ant',capPost:'post',capInf:'inf',capSup:'sup_'}; let best=CAP_IDS[0]; for(const id of CAP_IDS) if(lv[id].v>lv[best].v) best=id;
    const {v,l}=lv[best]; const e=metricEls.capsule; e.v.textContent=(v>=0?'+':'')+fmt(v)+' % '+t(regKey[best]); e.s.textContent=t(l[1]); e.s.className='stat '+l[2];
    e.b.style.width=(clamp((v+3)/15,0,1)*100).toFixed(1)+'%'; e.b.style.background=statColor[l[2]]; }
  /* Badge des eingeklappten Blocks: schlechtester Status und Anzahl auffälliger Zeilen */
  { let worst=null, n=0; for(const id of METRIC_SPECIAL){ const {l}=lv[id]; if(l[2]!=='ok'){ n++; if(!worst||LEVEL_RANK[l[2]]>LEVEL_RANK[worst[2]]) worst=l; } }
    const b=$('monBadge'); if(n){ b.textContent=(n>1?n+'× ':'')+t(worst[1]); b.className='stat acc-badge '+worst[2]; } else { b.textContent=t('mgClear'); b.className='stat acc-badge ok'; } }
  $('dv1val').textContent=fmt(M.ahd*10,1)+' mm'; $('dv2val').textContent=t('ant')+' '+fmt(M.capAnt*100)+' % · '+t('post')+' '+fmt(M.capPost*100)+' %'; $('dv3val').textContent=t('kink')+' '+(M.lbsDeflRel>=0?'+':'')+fmt(M.lbsDeflRel)+'°';
  if(lastRh) $('dv4val').textContent=t('scapUp')+fmt(lastRh.UR)+'° · '+t('tilt')+' '+fmt(lastRh.PT)+'°';
}

/* ---- Belastete Strukturen ---- */
const NAME=id=>{ const s=STRUCT_BY_ID[id]; if(s) return LANG==='en'?(STRUCT_EN[id]||s.name):s.name; const m={thorax:'nameThorax',clav:'nameClav',scap:'nameScap',hum:'nameHum',fore:'nameFore',labrum:'nameLabrum',bursa:'nameBursa',capsule:'nameCapsule'}; return m[id]?t(m[id]):id; };
function structStrain(id){ const s=STRUCT_BY_ID[id]; if(!s) return 0; let mx=-9; s.fas.forEach((f,i)=>{ mx=Math.max(mx,EVAL.fas[fasKey(s,i)].strain); }); return mx; }
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
const LOAD_EL={}, LG_EL={};
(function buildLoadList(){
  const root=$('loadlist'); const known=new Set(LOAD_GROUPS.flatMap(g=>g.ids));
  const rest=[...STRUCT.filter(s=>!s.static).map(s=>s.id),'bursa'].filter(id=>!known.has(id)); if(rest.length) LOAD_GROUPS[LOAD_GROUPS.length-1].ids.push(...rest);
  for(const g of LOAD_GROUPS){
    const wrap=document.createElement('div'); wrap.className='lgrp'; wrap.hidden=true; wrap.dataset.g=g.id;
    const h=document.createElement('button'); h.type='button'; h.className='acc'; h.setAttribute('aria-expanded',String(g.open));
    h.innerHTML=`<span class="acc-chev">▸</span><span class="acc-t"></span><span class="lg-n"></span><span class="lg-bar"><i></i></span>`;
    const body=document.createElement('div'); body.className='acc-body'; body.hidden=!g.open;
    wrap.append(h,body); root.appendChild(wrap); LG_EL[g.id]={g,wrap,h,t:h.querySelector('.acc-t'),n:h.querySelector('.lg-n'),bar:h.querySelector('.lg-bar i'),body,open:g.open};
    h.addEventListener('click',()=>setLoadGroupOpen(g.id,!LG_EL[g.id].open));
    for(const id of g.ids){ const el=document.createElement('div'); el.className='load'; el.hidden=true; el.dataset.id=id;
      el.innerHTML=`<span class="ln"></span><span class="lv"></span><div class="lb"><i></i></div>`;
      el.addEventListener('click',()=>selectStructure(id)); body.appendChild(el); LOAD_EL[id]={el,ln:el.querySelector('.ln'),lv:el.querySelector('.lv'),bar:el.querySelector('.lb i'),g:g.id}; }
  }
  const empty=document.createElement('div'); empty.className='empty'; empty.id='loadEmpty'; root.appendChild(empty);
  sortLoadList();
})();
function setLoadGroupOpen(gid,on){ const u=LG_EL[gid]; if(!u) return; u.open=!!on; u.body.hidden=!u.open; u.h.setAttribute('aria-expanded',String(u.open)); needsRender=true; }
/* Innerhalb der Gruppen alphabetisch in der aktuellen Sprache anordnen */
function sortLoadList(){ for(const gid in LG_EL){ const u=LG_EL[gid]; u.t.textContent=t(u.g.key); const ids=[...u.g.ids]; ids.sort((a,b)=>NAME(a).localeCompare(NAME(b),LANG==='en'?'en':'de')); for(const id of ids){ LOAD_EL[id].ln.textContent=NAME(id); u.body.appendChild(LOAD_EL[id].el); } } $('loadEmpty').textContent=t('loadEmpty'); }
function updateLoads(){
  const items=computeLoads(); let shown=0; const gmax={}, gn={}, gcol={};
  for(const id in LOAD_EL){ const r=LOAD_EL[id]; const e=items[id]; const s=e?e.score:0;
    const show=r.el.hidden?s>0.12:s>0.06;          /* Hysterese */
    r.el.hidden=!show; if(!show) continue; shown++; gn[r.g]=(gn[r.g]||0)+1; if(!(r.g in gmax)||s>gmax[r.g]){ gmax[r.g]=s; gcol[r.g]=e.col; }
    r.lv.textContent=e.labels.join(' · '); r.bar.style.width=(clamp(s,0,1)*100).toFixed(0)+'%'; r.bar.style.background=e.col; }
  for(const gid in LG_EL){ const u=LG_EL[gid]; const n=gn[gid]||0; u.wrap.hidden=!n; if(!n) continue; u.n.textContent=String(n); u.bar.style.width=(clamp(gmax[gid],0,1)*100).toFixed(0)+'%'; u.bar.style.background=gcol[gid]; }
  $('loadEmpty').hidden=shown>0;
}

/* ---- Struktur-Info ---- */
let selectedId=null;
const infoOf=id=>(LANG==='en'?INFO_EN[id]:INFO[id])||INFO[id]||{};
function liveInfo(id){
  const s=STRUCT_BY_ID[id]; const M=EVAL.metrics; const rows=[];
  if(s&&!s.surface){ const st=structStrain(s.id);
    if(s.kind==='muscle'){ rows.push([t('liLen'),(st>=0?'+':'')+fmt(st*100)+' % '+(st>0.03?t('liStretched'):st<-0.03?t('liShort'):'')]); const a=EVAL.act[s.id]; if(a!==undefined) rows.push([t('liHold'),'≈ '+fmt(a*100)+' % '+t('liOfMax')]); }
    else rows.push([t('liTension'),(st>=0?'+':'')+fmt(st*100)+' % '+(st>=0.1?t('liEnd'):st>=0.05?t('liTens'):st>=0?t('liBears'):t('liSlack'))]);
  }
  if(id==='capsule') rows.push([t('liRegions'),[M.capAnt,M.capPost,M.capInf,M.capSup].map(v=>(v>=0?'+':'')+fmt(v*100)+' %').join(' · ')]);
  if(id==='supra'||id==='bursa') rows.push([t('liAHD'),fmt(M.ahd*10,1)+' mm']);
  if(id==='subsc') rows.push([t('liCHD'),fmt(M.chd*10,1)+' mm']);
  if(id==='bicLH') rows.push([t('liDefl'),(M.lbsDeflRel>=0?'+':'')+fmt(M.lbsDeflRel)+'° '+t('liVsRest')],[t('liIntra'),(M.lbsStrain>=0?'+':'')+fmt(M.lbsStrain*100)+' % '+t('liLength')]);
  if(id==='infra') rows.push([t('liPSD'),fmt(M.psd*10,1)+' mm']);
  if(id==='nAx') rows.push([t('liStrain'),(M.axStrain>=0?'+':'')+fmt(M.axStrain*100)+' %']);
  return rows;
}
function renderInfo(){
  const root=$('info'); if(!selectedId){ root.innerHTML=`<p class="empty">${t('infoEmpty')}</p>`; return; }
  const inf=infoOf(selectedId); const rows=liveInfo(selectedId);
  root.innerHTML=`<h3>${NAME(selectedId)}</h3><div class="kind">${inf.k||''}</div>`+(rows.length?`<div class="kv">${rows.map(r=>`<span>${r[0]}</span><span>${r[1]}</span>`).join('')}</div>`:'')+
    (inf.f?`<p><b>${t('fn')}</b> ${inf.f}</p>`:'')+(inf.p?`<p><b>${t('probs')}</b> ${inf.p}</p>`:'')+(inf.t?`<p><b>${t('test')}</b> ${inf.t}</p>`:'');
}
function setHighlight(id,on){ const ms=meshesOf(id); for(const m of ms){ const mat=m.material; if(mat===MAT.thorax||mat===MAT.ribs) continue; mat.emissive=mat.emissive||new THREE.Color(0); mat.emissive.setHex(on?0x4a3a2a:0x000000); } needsRender=true; }
function selectStructure(id,quiet){ if(selectedId) setHighlight(selectedId,false); selectedId=id; if(id) setHighlight(id,true); renderInfo(); if(isMobile()&&id&&!quiet) openTab('info'); }

/* ---- Beschriftungen ---- */
const LABELS=[
 {id:'scap',key:'lbAcr',lm:L('S',AN.acromionPath[3].clone().add(V3(0,0.5,0)))},{id:'scap',key:'lbCor',lm:L('S',AN.coracoidTip.clone().add(V3(0,0.4,0.4)))},
 {id:'clav',key:'nameClav',lm:L('C',V3(-9.5,5.4,6.0))},{id:'hum',key:'lbGT',lm:L('H',AN.GT.c.clone().add(V3(0.8,0.8,0)))},{id:'hum',key:'lbLT',lm:L('H',AN.LT.c.clone().add(V3(0,0.6,0.8)))},
 {id:'scap',key:'lbGlen',lm:L('S',AN.glenoid.c.clone().add(V3(0,-2.4,0)))},{id:'scap',key:'nameScap',lm:L('S',sc(-8,-6,0.8))},{id:'hum',key:'nameHum',lm:L('H',V3(1.5,-18,0))},
 {id:'fore',key:'lbRad',lm:L('R',V3(2.2,12,1.0))},{id:'fore',key:'lbUlna',lm:L('F',V3(-1.2,-12,-0.4))},{id:'thorax',key:'lbC7',lm:L('T',V3(AN.mid,6.5,spineBack(6)-0.5))},{id:'thorax',key:'lbStern',lm:L('T',V3(AN.mid,-2,sternumFront(-2)+0.5))},
];
STRUCT.forEach(s=>{ if(!s.surface) LABELS.push({id:s.id,struct:s}); });
LABELS.push({id:'capsule',key:'lbCaps',lm:L('S',AN.glenoid.c.clone().add(V3(1.3,-2.6,0.2)))},{id:'bursa',key:'lbBursa',lm:AN.bursaCenter},{id:'labrum',key:'lbLab',lm:L('S',AN.glenoid.c.clone().add(V3(0,2.4,0)))});
const labelText=l=>l.key?t(l.key):NAME(l.id).split(' – ')[0].split(',')[0];
const labelRoot=$('labels'); const labelEls=LABELS.map(l=>{ const d=document.createElement('div'); d.className='lbl'; d.textContent=labelText(l); d.style.display='none'; labelRoot.appendChild(d); return d; });
function relabel3D(){ LABELS.forEach((l,i)=>{ labelEls[i].textContent=labelText(l); }); }
const _pv=new THREE.Vector3();
function updateLabels(){
  if(!UI.labels){ labelEls.forEach(e=>e.style.display='none'); return; }
  const r=mainView.getBoundingClientRect(); const placed=[];
  LABELS.forEach((l,i)=>{ const e=labelEls[i]; if(!VIS[l.id]){ e.style.display='none'; return; }
    let p; if(l.struct){ const ev=EVAL.fas[fasKey(l.struct,0)]; if(!ev){ e.style.display='none'; return; } const it=ev.items; p=it[Math.floor(it.length/2)].p.clone(); } else p=worldPt(frames,l.lm);
    _pv.copy(toR(p)).project(mainCam); if(_pv.z>1||Math.abs(_pv.x)>1.05||Math.abs(_pv.y)>1.05){ e.style.display='none'; return; }
    const x=(_pv.x+1)/2*r.width, y=(1-_pv.y)/2*r.height;
    if(placed.some(q=>Math.abs(q[0]-x)<70&&Math.abs(q[1]-y)<16)){ e.style.display='none'; return; }
    placed.push([x,y]); e.style.display='block'; e.style.left=x+'px'; e.style.top=y+'px'; });
}

/* ---- Pose-Änderung → Panels ---- */
let lastPanelUpdate=0, panelDirty=false, lastRh=null;
function onPoseChanged(r,animating){
  lastRh=r.rh; syncSliders(); panelDirty=true;
  const now=performance.now(); if(!animating||now-lastPanelUpdate>120){ refreshPanels(); lastPanelUpdate=now; }
}
function refreshPanels(){
  panelDirty=false; const M=EVAL.metrics; const rh=lastRh||{UR:0,PT:0,ER:0,cEl:0,cRet:0};
  updateMetrics(M); updateLoads(); if(selectedId) renderInfo();
  const rotAbbr=pose.IR<0?t('ER'):t('IR');
  $('hudMini').textContent=`E ${fmt(pose.E)}° · ${rotAbbr} ${fmt(Math.abs(pose.IR))}° · ${fmt(M.ahd*10,1)} mm`;
  $('hudBody').innerHTML=`${t('elev')} ${fmt(pose.E)}° · ${planeLabel(pose.P)} (${fmt(pose.P)}°)<br>${pose.IR<0?t('ERfull'):t('IRfull')} ${fmt(Math.abs(pose.IR))}° · ${t('elbow')} ${fmt(pose.elbow)}° · ${Math.abs(pose.pro)<3?t('foreNeutral'):(pose.pro<0?t('supination'):t('pronation'))+' '+fmt(Math.abs(pose.pro))+'°'}<span class="hud-more"><br>${t('scapUp')}${fmt(rh.UR)}° · ${t('tilt')} ${fmt(rh.PT)}° · ${rh.ER>=0?t('ER'):t('IR')} ${fmt(Math.abs(rh.ER))}° · GH ≈ ${fmt(Math.max(0,pose.E-rh.UR))}°</span><br>${t('subac')} ${fmt(M.ahd*10,1)} mm · ${t('subcor')} ${fmt(M.chd*10,1)} mm · ${t('jforce')} ${fmt(M.jrf)} N`+(EXT.F?`<span class="hload">${t('load')} ${EXT.src&&RUNNABLE[EXT.src]?loadLabel(RUNNABLE[EXT.src]):EXT.label}<button type="button" id="btnNoLoad">${t('removeLoad')}</button></span>`:'');
  const bl=$('btnNoLoad'); if(bl) bl.addEventListener('click',()=>{ setLoad(null); stopAnim(); setPose({}); });
  $('poseSummary').textContent=`E ${fmt(pose.E)}° / ${fmt(pose.P)}° / ${rotAbbr} ${fmt(Math.abs(pose.IR))}°`;
  $('scapReadout').innerHTML=`${t('upRot')} ${fmt(rh.UR)}° · ${t('postTilt')} ${fmt(rh.PT)}° · ${rh.ER>=0?t('ERfull'):t('IRfull')} ${fmt(Math.abs(rh.ER))}°<br>${t('clav')}: ${t('elev')} ${fmt(rh.cEl)}° · ${rh.cRet>=0?t('retr'):t('protr')} ${fmt(Math.abs(rh.cRet))}°<br>${t('gh')} ${fmt(Math.max(0,pose.E-rh.UR))}° · ${t('st')} ${fmt(rh.UR)}°`;
  updateLabels();
}

/* ---- Maus & Touch ---- */
const raycaster=new THREE.Raycaster(); raycaster.layers.enableAll();
const ARM_IDS=new Set(['hum','fore']); STRUCT.forEach(s=>{ if(!s.surface&&s.fas.some(f=>f.some(lm=>lm.f==='H'||lm.f==='F'||lm.f==='R'))) ARM_IDS.add(s.id); }); ARM_IDS.add('capsule');
function pick(cx,cy){ const r=mainView.getBoundingClientRect(); const nd={x:((cx-r.left)/r.width)*2-1,y:-((cy-r.top)/r.height)*2+1}; raycaster.setFromCamera(nd,mainCam);
  const objs=pickables.filter(m=>m.visible&&m.material.opacity>0.35&&m.material!==MAT.thorax); const hits=raycaster.intersectObjects(objs,false); return hits.length?hits[0]:null; }
const ptrs=new Map(); let drag=null, pinch=null, hoverId=null;
const tooltip=$('tooltip');
function isMobile(){ return window.matchMedia('(max-width: 980px)').matches; }
mainView.addEventListener('pointerdown',e=>{
  try{ mainView.setPointerCapture(e.pointerId); }catch(_){ } ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){ const a=[...ptrs.values()]; pinch={d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),dist0:orbit.dist,mx:(a[0].x+a[1].x)/2,my:(a[0].y+a[1].y)/2}; drag=null; return; }
  const hit=pick(e.clientX,e.clientY);
  drag={x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,moved:false,hit,kind:'orbit',th0:orbit.theta,ph0:orbit.phi};
  if(hit&&UI.mode!=='orbit'&&ARM_IDS.has(hit.object.userData.sid)&&!(e.button===2)){
    stopAnim();
    if(UI.mode==='rot'){ drag.kind='rot'; drag.ir0=pose.IR; drag.el0=pose.elbow; }
    else { /* Greifpunkt im Knochen-Frame merken */
      const sid=hit.object.userData.sid; const f=sid==='fore'?(hit.object.parent===G.R?'R':'F'):'H';
      const fr=frames[f]; const local=toR(hit.point).sub(fr.p).applyQuaternion(fr.q.clone().invert());
      drag.kind='arm'; drag.f=f; drag.local=local; drag.normal=mainCam.getWorldDirection(V3()); }
    mainView.classList.add('arm');
  } else if(e.button===2&&hit&&ARM_IDS.has(hit.object.userData.sid)){ stopAnim(); drag.kind='rot'; drag.ir0=pose.IR; drag.el0=pose.elbow; }
  else mainView.classList.add('grab');
});
mainView.addEventListener('contextmenu',e=>e.preventDefault());
mainView.addEventListener('pointermove',e=>{
  if(ptrs.has(e.pointerId)) ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size===2){ const a=[...ptrs.values()]; const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); orbit.dist=clamp(pinch.dist0*pinch.d0/Math.max(10,d),25,260);
    const mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2; panCam(mx-pinch.mx,my-pinch.my); pinch.mx=mx; pinch.my=my; updateMainCam(); needsRender=true; return; }
  if(!drag){ if(e.pointerType==='mouse') hover(e); return; }
  const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
  if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>4) drag.moved=true;
  if(drag.kind==='orbit'){ if(e.buttons===2||e.shiftKey) panCam(dx,dy); else { orbit.theta-=dx*0.008; orbit.phi=clamp(orbit.phi-dy*0.008,0.08,3.05); } updateMainCam(); markView(); needsRender=true; }
  else if(drag.kind==='rot'){ setPose({IR:drag.ir0+(e.clientX-drag.x0)*0.45,elbow:drag.el0+(e.clientY-drag.y0)*0.45}); }
  else if(drag.kind==='arm'){ dragArm(e.clientX,e.clientY); }
});
function endPtr(e){
  ptrs.delete(e.pointerId); if(ptrs.size<2) pinch=null;
  if(drag&&e.pointerId!==undefined){ if(!drag.moved&&e.type!=='pointercancel'){ const hit=drag.hit||pick(e.clientX,e.clientY); selectStructure(hit?hit.object.userData.sid:null); } drag=null; }
  mainView.classList.remove('grab','arm');
}
mainView.addEventListener('pointerup',endPtr); mainView.addEventListener('pointercancel',endPtr);
mainView.addEventListener('pointerleave',()=>{ tooltip.style.display='none'; if(hoverId&&hoverId!==selectedId) setHighlight(hoverId,false); hoverId=null; });
mainView.addEventListener('wheel',e=>{ e.preventDefault(); orbit.dist=clamp(orbit.dist*(1+e.deltaY*0.0012),25,260); updateMainCam(); needsRender=true; },{passive:false});
function panCam(dx,dy){ const right=V3(),up=V3(); mainCam.matrixWorld.extractBasis(right,up,V3()); const k=orbit.dist*0.0016; orbit.target.addScaledVector(right,-dx*k).addScaledVector(up,dy*k); }
const _ray=new THREE.Ray(), _plane=new THREE.Plane();
function dragArm(cx,cy){
  const r=mainView.getBoundingClientRect(); raycaster.setFromCamera({x:((cx-r.left)/r.width)*2-1,y:-((cy-r.top)/r.height)*2+1},mainCam);
  const fr=frames[drag.f]; const p0=drag.local.clone().applyQuaternion(fr.q).add(fr.p);   /* Modellkoordinaten */
  _plane.setFromNormalAndCoplanarPoint(drag.normal,toR(p0)); const p1r=V3(); if(!raycaster.ray.intersectPlane(_plane,p1r)) return;
  const p1=toR(p1r);
  const GH=frames.H.p; const v0=p0.clone().sub(GH), v1=p1.clone().sub(GH); if(v0.length()<3||v1.length()<3) return;
  const q=new THREE.Quaternion().setFromUnitVectors(v0.normalize(),v1.normalize());
  const qH=q.multiply(frames.H.q); const d=V3(0,-1,0).applyQuaternion(qH);
  const P=Math.atan2(d.z,d.x)/DEG, E=Math.acos(clamp(-d.y,-1,1))/DEG;
  setPose({P:clamp(P,-90,150),E});
}
let hoverT=0;
function hover(e){ const now=performance.now(); if(now-hoverT<40) return; hoverT=now;
  const hit=pick(e.clientX,e.clientY); const id=hit?hit.object.userData.sid:null;
  if(id!==hoverId){ if(hoverId&&hoverId!==selectedId) setHighlight(hoverId,false); hoverId=id; if(id&&id!==selectedId) setHighlight(id,true); }
  if(id){ const r=mainView.getBoundingClientRect(); tooltip.style.display='block'; tooltip.style.left=(e.clientX-r.left)+'px'; tooltip.style.top=(e.clientY-r.top)+'px';
    const s=STRUCT_BY_ID[id]; let extra=''; if(s&&!s.surface){ const st=structStrain(id); extra=` · ${st>=0?'+':''}${fmt(st*100)} %`; } tooltip.textContent=NAME(id)+extra; }
  else tooltip.style.display='none';
}
/* Modus / Ansicht */
function setMode(m){ if(!['arm','rot','orbit'].includes(m)) return; UI.mode=m; document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.toggle('on',x.dataset.mode===m)); }
document.querySelectorAll('#modeSeg button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
/* Ansichts-Schalter markieren, wenn die Kamera einer Standardansicht entspricht */
function markView(){ const th=orbit.theta/DEG, ph=orbit.phi/DEG; const near=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180)<1.5;
  document.querySelectorAll('#viewSeg button').forEach(x=>{ const v=VIEWS[x.dataset.view]; x.classList.toggle('on',!!v&&near(v.theta,th)&&near(v.phi,ph)); }); }
document.querySelectorAll('#viewSeg button').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('#viewSeg button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); setView(b.dataset.view); }));

/* ---- HUD: einklappen (Tipp) und verschieben (Ziehen) ---- */
(function(){
  const hud=$('hud'), title=$('hudTitle'); let drag=null, off={x:0,y:0};
  if(isMobile()) hud.classList.add('collapsed');
  title.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,ox:off.x,oy:off.y,moved:false}; try{ title.setPointerCapture(e.pointerId); }catch(_){ } e.preventDefault(); });
  title.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.hypot(dx,dy)>5) drag.moved=true; if(!drag.moved) return;
    const r=mainView.getBoundingClientRect(); off.x=clamp(drag.ox+dx,-8,r.width-120); off.y=clamp(drag.oy+dy,-4,r.height-40); hud.style.transform=`translate(${off.x}px,${off.y}px)`; });
  const up=e=>{ if(!drag) return; if(!drag.moved) hud.classList.toggle('collapsed'); drag=null; };
  title.addEventListener('pointerup',up); title.addEventListener('pointercancel',up);
})();

/* ---- Desktop: Seitenspalten ein-/ausklappen ---- */
function setPanel(side,shown){ const cls=side==='left'?'noleft':'noright'; $('app').classList.toggle(cls,!shown); $(side==='left'?'btnLeftPanel':'btnRightPanel').classList.toggle('on',!!shown); resize(); layoutDock(); }
$('btnLeftPanel').addEventListener('click',()=>setPanel('left',$('app').classList.contains('noleft')));
$('btnRightPanel').addEventListener('click',()=>setPanel('right',$('app').classList.contains('noright')));

/* ---- Mobil: Tabs ---- */
let openTabId=null;
const tabNames=()=>({move:t('tabMove'),layers:t('tabLayers'),metrics:t('tabMetrics'),info:t('hInfo')});
function openTab(tab){
  const blocks=[...document.querySelectorAll('.block[data-tab]')];
  if(openTabId===tab){ tab=null; }
  openTabId=tab;
  document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  blocks.forEach(b=>b.classList.toggle('show',b.dataset.tab===tab));
  const left=$('left'), right=$('right');
  const inLeft=tab&&blocks.some(b=>b.dataset.tab===tab&&left.contains(b)); const inRight=tab&&blocks.some(b=>b.dataset.tab===tab&&right.contains(b));
  left.classList.toggle('open',!!inLeft); right.classList.toggle('open',!!inRight);
  document.body.classList.toggle('sheet-open',!!tab);
  const names=tabNames();
  document.querySelectorAll('.sheet-handle .sh-title').forEach(x=>x.textContent=names[tab]||'');
  if(tab){ const p=inLeft?left:right; if(sheetPeek[p.id]) sheetSetHeight(p,sheetHeights[p.id]||null); }
  layoutDock(); needsRender=true;
}
/* ---- Bottom-Sheet: Griff ziehen (Höhe), antippen/„Klein“ (Peek), Regler → Sheet wird durchsichtig ---- */
const sheetHeights={}, sheetPeek={};
function peekLabel(p){ const b=p.querySelector('[data-act=peek]'); if(b) b.textContent=sheetPeek[p.id]?t('big'):t('small'); }
function sheetSetHeight(p,h){ if(h===null){ p.style.height=''; sheetPeek[p.id]=false; } else { p.style.height=h+'px'; sheetPeek[p.id]=h<=170; } peekLabel(p); }
document.querySelectorAll('.sheet-handle').forEach(h=>{
  const p=$(h.dataset.panel); let drag=null;
  h.addEventListener('pointerdown',e=>{ if(e.target.closest('.sh-btn')) return; drag={y:e.clientY,h:p.getBoundingClientRect().height,moved:false}; try{ h.setPointerCapture(e.pointerId); }catch(_){ } e.preventDefault(); });
  h.addEventListener('pointermove',e=>{ if(!drag) return; const dy=e.clientY-drag.y; if(Math.abs(dy)>6) drag.moved=true; if(!drag.moved) return;
    const nh=clamp(drag.h-dy,120,window.innerHeight*0.88); p.style.height=nh+'px'; sheetPeek[p.id]=nh<=170; if(nh>170) sheetHeights[p.id]=nh; peekLabel(p); needsRender=true; });
  const up=e=>{ if(!drag) return; if(!drag.moved){ if(sheetPeek[p.id]) sheetSetHeight(p,sheetHeights[p.id]||null); else sheetSetHeight(p,150); } drag=null; needsRender=true; };
  h.addEventListener('pointerup',up); h.addEventListener('pointercancel',up);
  h.querySelector('[data-act=peek]').addEventListener('click',()=>{ if(sheetPeek[p.id]) sheetSetHeight(p,sheetHeights[p.id]||null); else sheetSetHeight(p,150); needsRender=true; });
  h.querySelector('[data-act=close]').addEventListener('click',()=>{ if(openTabId) openTab(openTabId); });
});
document.querySelectorAll('.panel input[type=range]').forEach(inp=>{
  const p=inp.closest('.panel'), ctl=inp.closest('.ctl,.lgroup-h');
  inp.addEventListener('pointerdown',()=>{ if(!isMobile()) return; p.classList.add('ghost'); if(ctl) ctl.classList.add('active'); });
  const off=()=>{ p.classList.remove('ghost'); if(ctl) ctl.classList.remove('active'); };
  inp.addEventListener('pointerup',off); inp.addEventListener('pointercancel',off); inp.addEventListener('lostpointercapture',off); inp.addEventListener('touchend',off,{passive:true});
});
document.querySelectorAll('#tabbar button').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));
['left','right'].forEach(id=>$(id).addEventListener('scroll',()=>{ needsRender=true; },{passive:true}));

/* ---- Detail-Dock & Schichtstufen ---- */
const dock=$('dock');
function layoutDock(){ const h=dock.offsetHeight; const b=(h+16)+'px'; mainView.style.bottom=b; $('labels').style.bottom=b; needsRender=true; }
function setDock(shown){ dock.classList.toggle('collapsed',!shown); const b=$('dockToggle'); b.textContent=shown?t('dockHide'):t('dockShow'); b.setAttribute('aria-expanded',String(!!shown)); layoutDock(); }
$('dockToggle').addEventListener('click',()=>setDock(dock.classList.contains('collapsed')));
window.addEventListener('resize',layoutDock);
function updatePeelLabels(){ for(const d of detailDefs){ const el=$(d.id+'pl'); if(el) el.textContent=PEEL[d.level].name;
  document.querySelectorAll(`.peel button[data-dv="${d.id}"]`).forEach(b=>{ const nd=d.level+(+b.dataset.d); b.disabled=nd<0||nd>=PEEL.length; b.title=(+b.dataset.d>0?t('peelLess'):t('peelMore'))+(nd>=0&&nd<PEEL.length?' → '+PEEL[nd].name:''); }); } }
function setPeel(id,level){ const def=detailDefs.find(d=>d.id===id); if(!def) return; def.level=clamp(Math.round(level),0,PEEL.length-1); updatePeelLabels(); needsRender=true; }
document.querySelectorAll('.peel button').forEach(b=>b.addEventListener('click',()=>{ const def=detailDefs.find(d=>d.id===b.dataset.dv); if(def) setPeel(def.id,def.level+(+b.dataset.d)); }));
updatePeelLabels();

/* ---- Sprache ---- */
function applyLang(){
  NUM_LOCALE=LANG==='en'?'en-GB':'de-DE'; document.documentElement.lang=LANG; document.title=t('title');
  document.querySelectorAll('[data-i18n]').forEach(e=>{ e.textContent=t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(e=>{ e.title=t(e.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e=>{ e.setAttribute('aria-label',t(e.dataset.i18nAria)); });
  const bl=$('btnLang'); bl.textContent=LANG==='de'?'EN':'DE'; bl.title=t('langT');
  relabelChips(); relabelLayers(); relabelMetrics(); sortLoadList(); relabel3D(); updatePeelLabels();
  $('dockToggle').textContent=dock.classList.contains('collapsed')?t('dockShow'):t('dockHide');
  document.querySelectorAll('.panel').forEach(peekLabel);
  if(openTabId){ const names=tabNames(); document.querySelectorAll('.sheet-handle .sh-title').forEach(x=>x.textContent=names[openTabId]||''); }
  syncSliders(); syncPathoLabels(); syncSpeedLabel(); renderInfo(); if(EVAL.metrics) refreshPanels();
}
function setLang(l,explicit){ if(l!=='de'&&l!=='en') return; LANG=l; if(explicit){ UI.langExplicit=true; try{ localStorage.setItem('sl-lang',l); }catch(_){ } } applyLang(); }
$('btnLang').addEventListener('click',()=>setLang(LANG==='de'?'en':'de',true));

/* ---- Theme ---- */
try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ sceneBg(); needsRender=true; }); }catch(_){ }
new MutationObserver(()=>{ sceneBg(); needsRender=true; }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* ---- Hauptschleife ---- */
function loop(now){
  requestAnimationFrame(loop);
  let changed=stepAnim(now);
  if(orbitAnim){ const t_=clamp((now-orbitAnim.t0)/orbitAnim.dur,0,1); const s=smooth(t_); orbit.theta=lerp(orbitAnim.th0,orbitAnim.th1,s); orbit.phi=lerp(orbitAnim.ph0,orbitAnim.ph1,s); updateMainCam(); if(t_>=1) orbitAnim=null; changed=true; }
  if(panelDirty&&!poseAnim) refreshPanels();
  if(needsRender||changed){ needsRender=false; renderAll(); if(UI.labels) updateLabels(); }
  if(typeof syncURL==='function') syncURL(now);
}
/* ---- Start ---- */
let skipIntro=false;
applyVisibility();
setPose({P:0,E:0,IR:0,elbow:0,pro:0});
applyLang();
layoutDock(); setTimeout(layoutDock,400);
requestAnimationFrame(loop);
/* Startansicht: leicht angehobener Arm zeigt Farbcodierung und Rhythmus */
setTimeout(()=>{ if(!skipIntro) animateTo({P:30,E:70,IR:0,elbow:0,pro:0},1400); },300);
window.Schulterlabor={setPose,runPreset,runAnim,runById,PRESETS,PHYSIO,ANIMS,EVAL,pose,patho,frames,selectStructure,openTab,stopAnim,setView,setLoad,detailDefs,PEEL,getAnim:()=>poseAnim,UI,setLang,get lang(){ return LANG; },MON,LOAD_GROUPS,LG_EL,setCapOpen,setSpecialOpen,setLoadGroupOpen};

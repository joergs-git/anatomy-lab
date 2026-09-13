/* ===================== Bedienung ===================== */
const UI={strain:true,labels:false,mode:'arm',speed:1,loopSweeps:true,langExplicit:LANG_EXPLICIT};
/* Pose-Regler (Markup aus engine/boot.js nach MOD.poseParams): Wert, Wertetext und dynamische Grenzen je Parameter */
const SL={},VL={}; for(const p of POSE_PARAMS){ SL[p.key]=$('ps_'+p.key); VL[p.key]=$('pv_'+p.key); }
let syncing=false;
function syncSliders(){
  syncing=true;
  for(const p of POSE_PARAMS){ const el=SL[p.key]; if(p.type==='check'){ el.checked=pose[p.key]>=0.5; continue; } const v=Math.round(pose[p.key]);
    if(p.type==='seg'){ el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v)); continue; } if(+el.value!==v) el.value=v; }
  for(const p of POSE_PARAMS){ VL[p.key].textContent=p.text(pose); }
  for(const p of POSE_PARAMS){ if(!p.range) continue; const r=p.range(pose); const el=SL[p.key]; if(r.min!==undefined) el.min=Math.round(r.min); if(r.max!==undefined) el.max=Math.round(r.max); }
  syncing=false;
}
for(const p of POSE_PARAMS){
  if(p.type==='seg'){ SL[p.key].querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ stopAnim(); const o={}; o[p.key]=+b.dataset.v; setPose(o); })); continue; }
  SL[p.key].addEventListener(p.type==='check'?'change':'input',()=>{ if(syncing) return; stopAnim(); const o={}; o[p.key]=p.type==='check'?(SL[p.key].checked?1:0):+SL[p.key].value; setPose(o); }); }
$('btnNeutral').addEventListener('click',()=>runPreset(PRESETS[0]));
// Pathologie (Regler in Anzeigeeinheit, Zustand in Modelleinheit: sliderScale)
const PL={}; for(const p of PATHO_PARAMS) PL[p.key]=$('pp_'+p.key);
function syncPathoLabels(){ for(const p of PATHO_PARAMS) $('pv2_'+p.key).textContent=p.text(patho[p.key]); }
function setPatho(pa){ Object.assign(patho,pa); for(const p of PATHO_PARAMS) PL[p.key].value=Math.round(patho[p.key]*p.sliderScale*1000)/1000; syncPathoLabels(); setPose({}); }
for(const p of PATHO_PARAMS) PL[p.key].addEventListener('input',()=>{ const o={}; o[p.key]=+PL[p.key].value/p.sliderScale; setPatho(o); });
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

/* ---- Klinische Positionen, Übungen, Bewegungsabläufe: Definitionen im Modul (presets.js) ---- */
const RUNNABLE={}; [...PRESETS,...ANIMS,...PHYSIO].forEach(x=>RUNNABLE[x.id]=x);
const presetName=pr=>LANG==='en'?(PRESET_EN[pr.id]||pr.name):pr.name;
const loadLabel=pr=>pr.load?(LANG==='en'?(LOAD_EN[pr.id]||pr.load.label):pr.load.label):'';
let poseAnim=null, activeChip=null, activeRunId=null;
function releaseChip(){ if(activeChip){ activeChip.classList.remove('on'); activeChip=null; } activeRunId=null; }
function stopAnim(){ poseAnim=null; releaseChip(); }
/* Äußere Last: alle Felder der Preset-Last (F als Vektor, dazu modulspezifische wie axialOnly oder at) in EXT übernehmen, sonst Grundzustand */
const EXT_DEFAULTS=Object.assign({},EXT);
function setLoad(load,srcId){ for(const k in EXT) delete EXT[k]; Object.assign(EXT,EXT_DEFAULTS); if(load){ Object.assign(EXT,load); EXT.F=V3(load.F[0],load.F[1],load.F[2]); EXT.src=srcId||null; } else EXT.src=null; }
function animateTo(target,dur,opts={}){ poseAnim={t0:performance.now(),dur,from:Object.assign({},pose),to:Object.assign({},pose,target),loop:!!opts.loop,then:opts.then||null}; }
function stepAnim(now){
  if(!poseAnim) return false;
  const a=poseAnim; let t_=(now-a.t0)/(a.dur/UI.speed);
  if(a.loop){ t_=t_%2; if(t_>1) t_=2-t_; } else t_=clamp(t_,0,1);
  const s=smooth(t_); const p={}; for(const pp of POSE_PARAMS) p[pp.key]=lerp(a.from[pp.key],a.to[pp.key],s);
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
  document.querySelectorAll('#layerPresets [data-lp]').forEach(b=>{ const lp=LAYER_PRESETS.find(x=>x.id===b.dataset.lp); b.addEventListener('click',()=>setAllLayers(id=>lp.ids.includes(id))); });
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
/* METRICS und MONITOR (Reihenfolge, Spezialblock, Kapsel-Sammelzeile) definiert das Modul (monitor.js) */
const metricName=m=>LANG==='en'&&METRIC_EN[m.id]?METRIC_EN[m.id].name:m.name;
const metricSub=m=>LANG==='en'&&METRIC_EN[m.id]?(METRIC_EN[m.id].sub||''):(m.sub||'');
const metricEls={};
const MON={capOpen:false,specialOpen:false};
const LEVEL_RANK={ok:0,warn:1,bad:2,crit:3};
function metricRow(m,sub){ const d=document.createElement('div'); d.className='metric'+(sub?' sub':''); d.innerHTML=`<span class="mname"></span><span class="mval"><span class="v"></span><span class="stat ok"></span></span><div class="mbar"><i></i></div><span class="msub"></span>`;
  metricEls[m.id]={n:d.querySelector('.mname'),v:d.querySelector('.v'),s:d.querySelector('.stat'),b:d.querySelector('.mbar i'),sub:d.querySelector('.msub'),el:d}; return d; }
const M_BY_ID={}; METRICS.forEach(m=>M_BY_ID[m.id]=m);
const AGG=MONITOR.aggregate;   /* Sammelzeile (Kapsel): fasst mehrere Metriken zusammen, Regionen ausklappbar */
(function buildMetrics(){
  const root=$('metrics');
  for(const id of MONITOR.top){
    if(id===AGG.id){
      const d=document.createElement('div'); d.className='metric'; d.innerHTML=`<span class="mname"></span><span class="mval"><span class="v"></span><span class="stat ok"></span></span><div class="mbar"><i></i></div><button type="button" class="mtgl msub" id="capTgl"></button>`;
      metricEls[AGG.id]={n:d.querySelector('.mname'),v:d.querySelector('.v'),s:d.querySelector('.stat'),b:d.querySelector('.mbar i'),el:d}; root.appendChild(d);
      const subs=document.createElement('div'); subs.className='msubs'; subs.id='capSubs'; subs.hidden=true; AGG.ids.forEach(cid=>subs.appendChild(metricRow(M_BY_ID[cid],true))); root.appendChild(subs);
      $('capTgl').addEventListener('click',()=>setCapOpen(!MON.capOpen));
    } else root.appendChild(metricRow(M_BY_ID[id]));
  }
  const acc=document.createElement('button'); acc.type='button'; acc.className='acc'; acc.id='monAcc'; acc.setAttribute('aria-expanded','false');
  acc.innerHTML=`<span class="acc-chev">▸</span><span class="acc-t"><span id="monAccT"></span><span class="acc-sub" id="monAccS"></span></span><span class="stat ok acc-badge" id="monBadge"></span>`; root.appendChild(acc);
  const body=document.createElement('div'); body.className='acc-body'; body.id='monBody'; body.hidden=true; MONITOR.special.forEach(id=>body.appendChild(metricRow(M_BY_ID[id]))); root.appendChild(body);
  acc.addEventListener('click',()=>setSpecialOpen(!MON.specialOpen));
  relabelMetrics();
})();
function setCapOpen(on){ MON.capOpen=!!on; $('capSubs').hidden=!MON.capOpen; $('capTgl').textContent=t(MON.capOpen?'mCapHide':'mCapShow'); needsRender=true; }
function setSpecialOpen(on){ MON.specialOpen=!!on; $('monBody').hidden=!MON.specialOpen; $('monAcc').setAttribute('aria-expanded',String(MON.specialOpen)); needsRender=true; }
function relabelMetrics(){ for(const m of METRICS){ const e=metricEls[m.id]; e.n.textContent=metricName(m); const s=metricSub(m); e.sub.textContent=s; e.sub.style.display=s?'':'none'; }
  metricEls[AGG.id].n.textContent=t(AGG.nameKey); $('capTgl').textContent=t(MON.capOpen?'mCapHide':'mCapShow'); $('monAccT').textContent=t('mgSpecial'); $('monAccS').textContent=t('mgSpecialSub'); }
function levelOf(m,v){ for(const l of m.levels) if(v>=l[0]) return l; return m.levels[m.levels.length-1]; }
const statColor={ok:'var(--green)',warn:'var(--amber)',bad:'var(--red)',crit:'var(--violet)'};
/* Balkenfüllung: Spannungen laufen von −3 % bis max, Abstände/Kräfte von 0 bis max */
const metricFill=(m,v)=>m.tension?clamp((v+3)/(m.max+3),0,1):clamp(v/m.max,0,1);
function updateMetrics(M){
  const lv={};
  for(const m of METRICS){ const v=m.get(M); const l=levelOf(m,v); lv[m.id]={v,l}; const e=metricEls[m.id];
    let txt; if(m.text) txt=m.text(v,M);
    else if(m.tension) txt=(v>=0?'+':'')+fmt(v)+' %'; else txt=fmt(v,1)+' '+m.unit;
    e.v.textContent=txt; e.s.textContent=t(l[1]); e.s.className='stat '+l[2];
    e.b.style.width=(metricFill(m,v)*100).toFixed(1)+'%'; e.b.style.background=statColor[l[2]]; }
  /* Sammelzeile: stärkster Anteil */
  { let best=AGG.ids[0]; for(const id of AGG.ids) if(lv[id].v>lv[best].v) best=id;
    const {v,l}=lv[best]; const e=metricEls[AGG.id]; e.v.textContent=AGG.text(v,best); e.s.textContent=t(l[1]); e.s.className='stat '+l[2];
    e.b.style.width=(metricFill(AGG,v)*100).toFixed(1)+'%'; e.b.style.background=statColor[l[2]]; }
  /* Badge des eingeklappten Blocks: schlechtester Status und Anzahl auffälliger Zeilen */
  { let worst=null, n=0; for(const id of MONITOR.special){ const {l}=lv[id]; if(l[2]!=='ok'){ n++; if(!worst||LEVEL_RANK[l[2]]>LEVEL_RANK[worst[2]]) worst=l; } }
    const b=$('monBadge'); if(n){ b.textContent=(n>1?n+'× ':'')+t(worst[1]); b.className='stat acc-badge '+worst[2]; } else { b.textContent=t('mgClear'); b.className='stat acc-badge ok'; } }
  /* Anzeigewerte unter den Detailfenstern */
  for(const d of detailDefs){ if(!d.readout) continue; const s=d.readout(M,lastRh); if(s!==null&&s!==undefined) $(d.id+'val').textContent=s; }
}

/* ---- Belastete Strukturen ---- */
const NAME=id=>{ const s=STRUCT_BY_ID[id]; if(s) return LANG==='en'?(STRUCT_EN[id]||s.name):s.name; return BONE_NAME_KEYS[id]?t(BONE_NAME_KEYS[id]):id; };
function structStrain(id){ const s=STRUCT_BY_ID[id]; if(!s) return 0; let mx=-9; s.fas.forEach((f,i)=>{ mx=Math.max(mx,EVAL.fas[fasKey(s,i)].strain); }); return mx; }
/* computeLoads (Belastung je Struktur) und LOAD_GROUPS definiert das Modul (monitor.js) */
const LOAD_EL={}, LG_EL={};
(function buildLoadList(){
  const root=$('loadlist'); const known=new Set(LOAD_GROUPS.flatMap(g=>g.ids));
  const rest=STRUCT.filter(s=>!s.static).map(s=>s.id).filter(id=>!known.has(id)); if(rest.length) LOAD_GROUPS[LOAD_GROUPS.length-1].ids.push(...rest);
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
  rows.push(...structReadouts(id,M));
  return rows;
}
function renderInfo(){
  const root=$('info'); if(!selectedId){ root.innerHTML=`<p class="empty">${t('infoEmpty')}</p>`; return; }
  const inf=infoOf(selectedId); const rows=liveInfo(selectedId);
  root.innerHTML=`<h3>${NAME(selectedId)}</h3><div class="kind">${inf.k||''}</div>`+(rows.length?`<div class="kv">${rows.map(r=>`<span>${r[0]}</span><span>${r[1]}</span>`).join('')}</div>`:'')+
    (inf.f?`<p><b>${t('fn')}</b> ${inf.f}</p>`:'')+(inf.p?`<p><b>${t('probs')}</b> ${inf.p}</p>`:'')+(inf.t?`<p><b>${t('test')}</b> ${inf.t}</p>`:'');
}
function setHighlight(id,on){ const ms=meshesOf(id); for(const m of ms){ const mat=m.material; if(mat.userData.fixed) continue; mat.emissive=mat.emissive||new THREE.Color(0); mat.emissive.setHex(on?0x4a3a2a:0x000000); } needsRender=true; }
function selectStructure(id,quiet){ if(selectedId) setHighlight(selectedId,false); selectedId=id; if(id) setHighlight(id,true); renderInfo(); if(isMobile()&&id&&!quiet) openTab('info'); }

/* ---- Beschriftungen ---- */
/* LABELS (Landmarken und Strukturen) definiert das Modul (interaction.js) */
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
  panelDirty=false; const M=EVAL.metrics; const rh=lastRh||READOUT0;
  updateMetrics(M); updateLoads(); if(selectedId) renderInfo();
  /* Texte liefert das Modul; die Last-Zeile mit „entfernen“-Knopf ist Engine-Sache */
  $('hudMini').textContent=MOD.hud.mini(pose,M);
  $('hudBody').innerHTML=MOD.hud.body(pose,rh,M)+(EXT.F?`<span class="hload">${t('load')} ${EXT.src&&RUNNABLE[EXT.src]?loadLabel(RUNNABLE[EXT.src]):EXT.label}<button type="button" id="btnNoLoad">${t('removeLoad')}</button></span>`:'');
  const bl=$('btnNoLoad'); if(bl) bl.addEventListener('click',()=>{ setLoad(null); stopAnim(); setPose({}); });
  $('poseSummary').textContent=MOD.hud.summary(pose);
  if(MOD.readout) $('readout').innerHTML=MOD.readout.html(pose,rh);
  updateLabels();
}

/* ---- Maus & Touch ---- */
const raycaster=new THREE.Raycaster(); raycaster.layers.enableAll();
/* DRAG (greifbare Teile, Rotationsachsen, Ziehen → Pose) definiert das Modul (interaction.js) */
function pick(cx,cy){ const r=mainView.getBoundingClientRect(); const nd={x:((cx-r.left)/r.width)*2-1,y:-((cy-r.top)/r.height)*2+1}; raycaster.setFromCamera(nd,mainCam);
  const objs=pickables.filter(m=>m.visible&&m.material.opacity>0.35&&!m.material.userData.noPick); const hits=raycaster.intersectObjects(objs,false); return hits.length?hits[0]:null; }
const ptrs=new Map(); let drag=null, pinch=null, hoverId=null;
const tooltip=$('tooltip');
function isMobile(){ return window.matchMedia('(max-width: 980px)').matches; }
mainView.addEventListener('pointerdown',e=>{
  try{ mainView.setPointerCapture(e.pointerId); }catch(_){ } ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){ const a=[...ptrs.values()]; pinch={d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),dist0:orbit.dist,mx:(a[0].x+a[1].x)/2,my:(a[0].y+a[1].y)/2}; drag=null; return; }
  const hit=pick(e.clientX,e.clientY);
  drag={x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,moved:false,hit,kind:'orbit',th0:orbit.theta,ph0:orbit.phi};
  if(hit&&UI.mode!=='orbit'&&DRAG.ids.has(hit.object.userData.sid)&&!(e.button===2)){
    stopAnim();
    if(UI.mode==='rot') startRotDrag();
    else { /* Greifpunkt im Knochen-Frame merken: Knochen hängen an ihrer Rahmen-Gruppe, Strukturen (an ROOT) am Standardrahmen des Moduls */
      const f=frameOfMesh(hit.object)||DRAG.frame;
      const fr=frames[f]; const local=toR(hit.point).sub(fr.p).applyQuaternion(fr.q.clone().invert());
      drag.kind='arm'; drag.f=f; drag.local=local; drag.normal=mainCam.getWorldDirection(V3()); }
    mainView.classList.add('arm');
  } else if(e.button===2&&hit&&DRAG.ids.has(hit.object.userData.sid)){ stopAnim(); startRotDrag(); }
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
  else if(drag.kind==='rot'){ const o={}; o[DRAG.rot.x]=drag.r0.x+(e.clientX-drag.x0)*0.45; o[DRAG.rot.y]=drag.r0.y+(e.clientY-drag.y0)*0.45; setPose(o); }
  else if(drag.kind==='arm'){ dragArm(e.clientX,e.clientY); }
});
/* Rotationsmodus: Ausgangswerte der beiden Pose-Achsen merken, die das Modul dem Ziehen zuordnet */
function startRotDrag(){ drag.kind='rot'; drag.r0={x:pose[DRAG.rot.x],y:pose[DRAG.rot.y]}; }
/* Rahmen, an dessen Gruppe ein Mesh hängt (Knochen) – null für Strukturen an ROOT */
function frameOfMesh(obj){ for(const k in G) if(G[k]===obj.parent) return k; return null; }
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
  const patch=DRAG.pose(p0,p1,frames,drag.f); if(patch) setPose(patch);   /* Griffpunkt-Versatz → Pose: Modulsache (f = Rahmen des Griffpunkts) */
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
  document.querySelectorAll('#moduleSeg button, #moduleSel option').forEach(b=>{ const r=REGISTRY.find(x=>x.id===(b.dataset.module||b.value)); b.textContent=LANG==='en'?(r.nameEn||r.name):r.name; });
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
{ const p0={}; for(const p of POSE_PARAMS) p0[p.key]=p.def; setPose(p0); }
applyLang();
layoutDock(); setTimeout(layoutDock,400);
requestAnimationFrame(loop);
/* Startansicht: das Modul nennt die Zielpose der Startanimation */
setTimeout(()=>{ if(!skipIntro&&MOD.intro) animateTo(MOD.intro,1400); },300);
/* Testschnittstelle (tests/shots.mjs); der Modul-Alias (z. B. window.Schulterlabor) bleibt für ältere Skripte */
window.AnatomyLab={module:MOD.id,REGISTRY,setPose,runPreset,runAnim,runById,PRESETS,PHYSIO,ANIMS,EVAL,pose,patho,frames,selectStructure,openTab,stopAnim,setView,setLoad,detailDefs,PEEL,getAnim:()=>poseAnim,UI,setLang,get lang(){ return LANG; },MON,LOAD_GROUPS,LG_EL,setCapOpen,setSpecialOpen,setLoadGroupOpen};
if(MODULE_META.alias) window[MODULE_META.alias]=window.AnatomyLab;

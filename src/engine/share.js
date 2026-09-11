/* ===================== Geteilte Links: Zustand ⇄ URL-Parameter =====================
   Nur Abweichungen vom Standard landen im Link. Schlüssel:
   m (Modul, wenn nicht das erste der Registry) · lang · run (laufender Ablauf) · Pose-Parameter (url-Schlüssel des Moduls, z. B. E P rot elbow pro) ·
   load · speed · loop · Pathologie-Parameter des Moduls (z. B. migr gird frozen) ·
   hide/show (Schichten) · op (Gruppen-Transparenz) · peel (Detailstufen) · cam (Drehung, Zoom, Ziel) ·
   mode · strain · labels · sel · dock · hud · pl · pr · mon (Spezialblock offen) · cap (Kapselregionen offen) · lgt (umgeschaltete Strukturgruppen) */
const ARTIFACT_URL='https://claude.ai/code/artifact/2cc1f47c-4a88-4fc4-b328-7706d1a9f7ca';
const IN_FRAME=(()=>{ try{ return window.self!==window.top; }catch(_){ return true; } })();
const PEEL_DEF=detailDefs.map(d=>d.level);
const POSE_KEYS=POSE_PARAMS.map(p=>[p.key,p.url]);
/* Lesbare Schlüssel und Kurz-Link-Buchstaben der Modul-Parameter; Engine-Buchstaben sind reserviert (siehe compactField) */
const POSE_BY_URL={}, PATHO_BY_URL={}, CODE_MAP={};
POSE_PARAMS.forEach(p=>{ POSE_BY_URL[p.url]=p; CODE_MAP[p.code]={pose:p}; });
PATHO_PARAMS.forEach(p=>{ PATHO_BY_URL[p.url]=p; CODE_MAP[p.code]={patho:p}; });
const ENGINE_CODES='NAWSQHVOLCIXTUDKYJmkgx';
for(const c in CODE_MAP) if(ENGINE_CODES.includes(c)) console.warn('Kurz-Link: Kennbuchstabe '+c+' des Moduls kollidiert mit der Engine');
const numStr=(v,d=1)=>{ const f=Math.pow(10,d); return String(Math.round(v*f)/f); };
const normAng=a=>((a+180)%360+360)%360-180;
const angDiff=(a,b)=>Math.abs(normAng(a-b));
function narrowFactor(){ return narrowAdj?1.35:1; }
function currentState(){
  const p=[]; const add=(k,v)=>p.push([k,v]);
  if(MOD.id!==REGISTRY[0].id) add('m',MOD.id);
  if(UI.langExplicit) add('lang',LANG);
  if(activeRunId) add('run',activeRunId);
  else for(const [k,key] of POSE_KEYS){ if(Math.abs(pose[k])>=0.05) add(key,numStr(pose[k])); }
  if(EXT.F&&EXT.src&&EXT.src!==activeRunId) add('load',EXT.src);
  if(Math.abs(UI.speed-1)>0.001) add('speed',numStr(UI.speed,2));
  if(!UI.loopSweeps) add('loop','0');
  for(const pp of PATHO_PARAMS){ if(patho[pp.key]>0) add(pp.url,numStr(patho[pp.key]*pp.urlScale)); }
  const ids=allIds(); const hidden=ids.filter(id=>!VIS[id]);
  if(hidden.length){ if(hidden.length<=ids.length/2) add('hide',hidden.join(',')); else add('show',ids.filter(id=>VIS[id]).join(',')); }
  const ops=LAYER_GROUPS.filter(g=>Math.abs(GROUP_OPACITY[g.id]-1)>0.001).map(g=>g.id+':'+numStr(GROUP_OPACITY[g.id],2)); if(ops.length) add('op',ops.join(','));
  const peel=detailDefs.map(d=>d.level); if(peel.some((l,i)=>l!==PEEL_DEF[i])) add('peel',peel.join(','));
  const th=normAng(orbit.theta/DEG), ph=orbit.phi/DEG, di=orbit.dist/narrowFactor(); const tg=orbit.target; const tgMoved=Math.abs(tg.x-ORBIT0.tx)+Math.abs(tg.y-ORBIT0.ty)+Math.abs(tg.z-ORBIT0.tz)>0.2;
  if(angDiff(th,ORBIT0.theta)>0.5||Math.abs(ph-ORBIT0.phi)>0.5||Math.abs(di-ORBIT0.dist)>0.5||tgMoved){ const s=[numStr(th),numStr(ph),numStr(di)]; if(tgMoved) s.push(numStr(tg.x),numStr(tg.y),numStr(tg.z)); add('cam',s.join(',')); }
  if(UI.mode!=='arm') add('mode',UI.mode);
  if(!UI.strain) add('strain','0'); if(UI.labels) add('labels','1');
  if(selectedId) add('sel',selectedId);
  if(dock.classList.contains('collapsed')) add('dock','0');
  const hudC=$('hud').classList.contains('collapsed'); if(hudC!==isMobile()) add('hud',hudC?'0':'1');
  if($('app').classList.contains('noleft')) add('pl','0'); if($('app').classList.contains('noright')) add('pr','0');
  if(MON.specialOpen) add('mon','1'); if(MON.capOpen) add('cap','1');
  const tog=LOAD_GROUPS.filter(g=>LG_EL[g.id].open!==g.open).map(g=>g.id); if(tog.length) add('lgt',tog.join(','));
  return p;
}
const serialize=p=>p.map(([k,v])=>k+'='+encodeURIComponent(v).replace(/%2C/gi,',').replace(/%3A/gi,':').replace(/%2E/gi,'.')).join('&');
/* ---- Kompakter Token für den claude.ai-Viewer: der reicht nur einen Hash aus [A-Za-z0-9._:~-] mit höchstens 128 Zeichen durch.
   Felder durch „_" getrennt, Kennbuchstabe + Wert; Schichten/Presets/Gruppen als Index (Basis 36). Reihenfolge der Tabellen nie ändern – alte Links! */
const IS_ARTIFACT=/claudeusercontent\.com$/i.test(location.hostname)||IN_FRAME;
const B36='0123456789abcdefghijklmnopqrstuvwxyz';
const ID_LIST=allIds(), RUN_LIST=[...PRESETS,...ANIMS,...PHYSIO].map(x=>x.id), GROUP_LIST=LAYER_GROUPS.map(g=>g.id);
const ix=(list,id)=>{ const i=list.indexOf(id); return i>=0&&i<36?B36[i]:null; };
const COMPACT_MAX=120, OPTIONAL_KEYS=new Set(['mode','labels','dock','hud','pl','pr','mon','cap','lgt']);
const LG_LIST=LOAD_GROUPS.map(g=>g.id);
function compactField(k,v){
  const n=x=>String(Math.round(+x));
  if(POSE_BY_URL[k]) return POSE_BY_URL[k].code+n(v);
  if(PATHO_BY_URL[k]){ const p=PATHO_BY_URL[k]; return p.code+Math.round(+v*p.compactScale/p.urlScale); }
  switch(k){
    case 'm': { const c=ix(MODULE_LIST,v); return c?'x'+c:null; }
    case 'lang': return 'N'+(v==='en'?'e':'d');
    case 'run': { const c=ix(RUN_LIST,v); return c?'A'+c:null; }
    case 'load': { const c=ix(RUN_LIST,v); return c?'W'+c:null; }
    case 'speed': return 'S'+Math.round(+v*100); case 'loop': return 'Q0';
    case 'hide': case 'show': { const cs=v.split(',').map(id=>ix(ID_LIST,id)).filter(Boolean).join(''); return cs?(k==='hide'?'H':'V')+cs:null; }
    case 'op': { const cs=v.split(',').map(pair=>{ const [g,o]=pair.split(':'); const c=ix(GROUP_LIST,g); return c?c+String(clamp(Math.round(+o*100),10,99)).padStart(2,'0'):''; }).join(''); return cs?'O'+cs:null; }
    case 'peel': return 'L'+v.split(',').map(x=>String(clamp(Math.round(+x),0,9))).join('');
    case 'cam': { const a=v.split(',').map(Number); return 'C'+a.map((x,i)=>i<3?n(x):String(Math.round(x*10)/10)).join('~'); }
    case 'mode': return v==='rot'?'Ir':v==='orbit'?'Io':null;
    case 'strain': return 'X0'; case 'labels': return 'T1';
    case 'sel': { const c=ix(ID_LIST,v); return c?'U'+c:null; }
    case 'dock': return 'D0'; case 'hud': return 'K'+v; case 'pl': return 'Y0'; case 'pr': return 'J0';
    /* Kleinbuchstaben: spätere Ergänzungen (Akkordeons) */
    case 'mon': return 'm1'; case 'cap': return 'k1';
    case 'lgt': { const cs=v.split(',').map(g=>ix(LG_LIST,g)).filter(Boolean).join(''); return cs?'g'+cs:null; }
  }
  return null;
}
/* Wichtiges zuerst; Nebensächliches nur, solange der Token kurz genug bleibt */
function compactEncode(pairs){
  const main=[], opt=[];
  for(const [k,v] of pairs){ const f=compactField(k,v); if(!f) continue; (OPTIONAL_KEYS.has(k)?opt:main).push(f); }
  let tok=main.join('_'); let truncated=false;
  for(const f of opt){ const t2=tok?tok+'_'+f:f; if(t2.length<=COMPACT_MAX) tok=t2; else truncated=true; }
  if(tok.length>COMPACT_MAX){ truncated=true; while(main.length&&main.join('_').length>COMPACT_MAX) main.pop(); tok=main.join('_'); }
  return {token:tok,truncated};
}
function compactDecode(tok){
  const o={}; const un=(list,c)=>list[B36.indexOf(c)];
  for(const f of tok.split('_')){ if(!f) continue; const k=f[0], v=f.slice(1);
    const cm=CODE_MAP[k];
    if(cm){ if(cm.pose) o[cm.pose.url]=v; else o[cm.patho.url]=String(+v*cm.patho.urlScale/cm.patho.compactScale); continue; }
    switch(k){
      case 'x': { const id=un(MODULE_LIST,v); if(id) o.m=id; break; }
      case 'N': o.lang=v==='e'?'en':'de'; break;
      case 'A': { const id=un(RUN_LIST,v); if(id) o.run=id; break; }
      case 'W': { const id=un(RUN_LIST,v); if(id) o.load=id; break; }
      case 'S': o.speed=String(+v/100); break; case 'Q': o.loop=v; break;
      case 'H': case 'V': { const ids=[...v].map(c=>un(ID_LIST,c)).filter(Boolean); o[k==='H'?'hide':'show']=ids.join(','); break; }
      case 'O': { const parts=[]; for(let i=0;i+2<v.length;i+=3){ const g=un(GROUP_LIST,v[i]); const val=parseInt(v.slice(i+1,i+3),10); if(g&&!isNaN(val)) parts.push(g+':'+(val/100)); } if(parts.length) o.op=parts.join(','); break; }
      case 'L': o.peel=[...v].join(','); break;
      case 'C': o.cam=v.split('~').join(','); break;
      case 'I': o.mode=v==='r'?'rot':v==='o'?'orbit':'arm'; break;
      case 'X': o.strain=v; break; case 'T': o.labels=v; break;
      case 'U': { const id=un(ID_LIST,v); if(id) o.sel=id; break; }
      case 'D': o.dock=v; break; case 'K': o.hud=v; break; case 'Y': o.pl=v; break; case 'J': o.pr=v; break;
      case 'm': o.mon=v; break; case 'k': o.cap=v; break;
      case 'g': { const gs=[...v].map(c=>un(LG_LIST,c)).filter(Boolean); if(gs.length) o.lgt=gs.join(','); break; }
    }
  }
  return o;
}
if(COMPACT_TOKEN){ const dec=compactDecode(COMPACT_TOKEN); for(const k in dec) if(!(k in URL_PARAMS)) URL_PARAMS[k]=dec[k]; }
function shareBase(){ if(IS_ARTIFACT) return ARTIFACT_URL; return location.href.split(/[?#]/)[0]; }
let shareTruncated=false;
function buildShareURL(){
  const st=currentState(); const base=shareBase(); shareTruncated=false;
  if(IS_ARTIFACT){ const c=compactEncode(st); shareTruncated=c.truncated; return c.token?base+'#'+c.token:base; }
  const q=serialize(st); if(!q) return base; const useHash=location.protocol==='file:'; return base+(useHash?'#':'?')+q;
}

/* ---- Beim Laden anwenden ---- */
function applyURLState(){
  const q=URL_PARAMS; if(!Object.keys(q).length) return false;
  const num=k=>{ if(!(k in q)) return null; const v=parseFloat(String(q[k]).replace(',','.')); return isNaN(v)?null:v; };
  let v;
  const pa={}; for(const pp of PATHO_PARAMS){ if((v=num(pp.url))!==null) pa[pp.key]=clamp(v,pp.min,pp.max)/pp.urlScale; } if(Object.keys(pa).length) setPatho(pa);
  if((v=num('speed'))!==null) setSpeed(v);
  if(q.loop==='0') setLoop(false);
  if('show' in q){ const s=new Set(q.show.split(',')); setAllLayers(id=>s.has(id)); } else if('hide' in q){ const h=new Set(q.hide.split(',')); setAllLayers(id=>!h.has(id)); }
  if(q.op){ for(const part of q.op.split(',')){ const [g,o]=part.split(':'); const f=parseFloat(o); if(g&&!isNaN(f)) setGroupOpacity(g,f); } }
  if(q.peel){ q.peel.split(',').forEach((l,i)=>{ const d=detailDefs[i]; if(d&&l!==''&&!isNaN(+l)) setPeel(d.id,+l); }); }
  if(q.strain==='0') setStrainOn(false); if(q.labels==='1') setLabelsOn(true);
  if(q.mode) setMode(q.mode);
  if(q.cam){ const a=q.cam.split(',').map(parseFloat); if(a.length>=3&&a.slice(0,3).every(x=>!isNaN(x))){ orbit.theta=a[0]*DEG; orbit.phi=clamp(a[1],5,175)*DEG; orbit.dist=clamp(a[2],25,260)*narrowFactor(); if(a.length>=6&&a.slice(3,6).every(x=>!isNaN(x))) orbit.target.set(a[3],a[4],a[5]); updateMainCam(); markView(); needsRender=true; } }
  if(q.dock==='0') setDock(false);
  if(q.hud==='0'||q.hud==='1') $('hud').classList.toggle('collapsed',q.hud==='0');
  if(!isMobile()){ if(q.pl==='0') setPanel('left',false); if(q.pr==='0') setPanel('right',false); }
  if(q.mon==='1') setSpecialOpen(true); if(q.cap==='1') setCapOpen(true);
  if(q.lgt){ for(const gid of q.lgt.split(',')){ const g=LOAD_GROUPS.find(x=>x.id===gid); if(g) setLoadGroupOpen(gid,!g.open); } }
  if(q.sel&&(STRUCT_BY_ID[q.sel]||BONES[q.sel])) selectStructure(q.sel,true);
  const P={}; for(const [k,key] of POSE_KEYS){ const x=num(key); if(x!==null) P[k]=x; }
  if(q.load&&RUNNABLE[q.load]&&RUNNABLE[q.load].load) setLoad(RUNNABLE[q.load].load,q.load);
  skipIntro=true;   /* Link beschreibt den Zustand vollständig – keine Startanimation */
  if(q.run&&RUNNABLE[q.run]) runById(q.run);
  else setPose(P);
  return true;
}
applyURLState();
/* Hash von Hand geändert (z. B. anderer Link in die Adresszeile eingefügt): Seite mit dem neuen Zustand neu laden */
window.addEventListener('hashchange',()=>{ if(!IN_FRAME) location.reload(); });

/* ---- Modul wechseln: Seite mit dem Modul-Feld (und ggf. Sprache) neu laden; alles andere startet im Standardzustand ---- */
function switchModule(id){
  if(id===MOD.id||!REGISTRY.some(r=>r.id===id)) return;
  const pairs=[]; if(id!==REGISTRY[0].id) pairs.push(['m',id]); if(UI.langExplicit) pairs.push(['lang',LANG]);
  const base=location.href.split(/[?#]/)[0];
  if(IS_ARTIFACT||location.protocol==='file:'){ const c=IS_ARTIFACT?compactEncode(pairs).token:serialize(pairs); location.replace(base+(c?'#'+c:'')); location.reload(); }
  else location.href=base+(pairs.length?'?'+serialize(pairs):'');
}
document.querySelectorAll('#moduleSeg button').forEach(b=>b.addEventListener('click',()=>switchModule(b.dataset.module)));

/* ---- Adresszeile laufend aktualisieren (eigenständige Seite; nicht im eingebetteten Viewer) ---- */
let lastURLq=null, lastURLt=0, urlSyncOK=!IN_FRAME&&!!(window.history&&history.replaceState);
function syncURL(now){
  if(!urlSyncOK||now-lastURLt<1000) return; lastURLt=now;
  const q=serialize(currentState()); if(q===lastURLq) return; lastURLq=q;
  try{ const base=location.href.split(/[?#]/)[0]; const useHash=location.protocol==='file:'; history.replaceState(null,'',base+(q?(useHash?'#':'?')+q:'')); }catch(_){ urlSyncOK=false; }
}

/* ---- Teilen-Dialog ---- */
const shareBox=$('shareBox');
function openShare(){
  const url=buildShareURL(); $('shareUrl').value=url; $('shareMsg').textContent='';
  $('shareHint').textContent=!currentState().length?t('shareNone'):shareTruncated?t('shareHint')+' '+t('shareTrunc'):t('shareHint');
  $('shareNative').hidden=!(navigator.share&&shareNativeOK);
  shareBox.hidden=false; const i=$('shareUrl'); i.focus(); i.select();
}
let shareNativeOK=true;
$('btnShare').addEventListener('click',()=>{ if(!shareBox.hidden){ shareBox.hidden=true; return; } openShare(); });
$('shareClose').addEventListener('click',()=>{ shareBox.hidden=true; });
$('shareCopy').addEventListener('click',async()=>{
  const u=$('shareUrl').value; let ok=false;
  try{ await navigator.clipboard.writeText(u); ok=true; }catch(_){ }
  if(!ok){ try{ const i=$('shareUrl'); i.focus(); i.select(); ok=document.execCommand('copy'); }catch(_){ } }
  $('shareMsg').textContent=ok?t('copied'):t('copyFail'); $('shareMsg').style.color=ok?'var(--green)':'var(--amber)';
});
$('shareNative').addEventListener('click',async()=>{ try{ await navigator.share({title:t('title'),url:$('shareUrl').value}); }catch(e){ if(e&&e.name!=='AbortError'){ shareNativeOK=false; $('shareNative').hidden=true; } } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!shareBox.hidden) shareBox.hidden=true; });
document.addEventListener('pointerdown',e=>{ if(!shareBox.hidden&&!shareBox.contains(e.target)&&!$('btnShare').contains(e.target)) shareBox.hidden=true; });
Object.assign(window.AnatomyLab,{currentState,buildShareURL,applyURLState,URL_PARAMS,compactEncode,compactDecode,switchModule});

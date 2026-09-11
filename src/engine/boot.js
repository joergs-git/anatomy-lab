/* ===================== Start: Modul wählen, instanziieren, Wörterbuch mischen, modulabhängiges Markup =====================
   Vor diesem Teil stehen (aus build.mjs) REGISTRY = [{id,name,nameEn,alias}] in Link-Reihenfolge und MODULES = {id → Fabrik}.
   Das Modul steht im Link als m=<id> (lesbar) oder x<Index Basis 36> (Kurz-Token); ohne Angabe gilt das erste der Registry. */
const MODULE_LIST=REGISTRY.map(r=>r.id);
const MODULE_META=(function(){
  let id=URL_PARAMS.m;
  if(!MODULES[id]&&COMPACT_TOKEN){ const f=COMPACT_TOKEN.split('_').find(x=>x[0]==='x'); if(f){ const i=parseInt(f.slice(1),36); if(!isNaN(i)&&REGISTRY[i]) id=REGISTRY[i].id; } }
  return REGISTRY.find(r=>r.id===id)||REGISTRY[0];
})();
const MOD=MODULES[MODULE_META.id](); MOD.id=MODULE_META.id;
/* Modul-Texte über das Engine-Wörterbuch legen (gleiche Schlüssel gewinnen im Modul) */
for(const l in MOD.i18n){ I18N[l]=Object.assign(I18N[l]||{},MOD.i18n[l]); }

/* Die Engine spricht das Modul über feste Namen an */
const {pose,patho,frames,poseParams:POSE_PARAMS,pathoParams:PATHO_PARAMS}=MOD;
const {AN,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,INFO,LABELS}=MOD.anatomy;
const {worldPt,solvePose,clampPose,evaluate,EVAL,EXT,REF,fasKey}=MOD.kinematics;
const PRESETS=MOD.presets, ANIMS=MOD.anims, PHYSIO=MOD.physio;
const {struct:STRUCT_EN,group:GROUP_EN,layer:LAYER_EN,preset:PRESET_EN,load:LOAD_EN,metric:METRIC_EN,info:INFO_EN}=MOD.names;
const ORBIT0=MOD.camera.orbit0, VIEWS=MOD.camera.views, detailDefs=MOD.detailViews, PEEL=MOD.peel;
const METRICS=MOD.metrics, MONITOR=MOD.monitor, LOAD_GROUPS=MOD.loadGroups, BONE_NAME_KEYS=MOD.boneNameKeys, LAYER_PRESETS=MOD.layerPresets;
const {computeLoads,structReadouts,buildBones}=MOD;
const RENDER=MOD.render||{}, DRAG=MOD.drag, READOUT0=MOD.readout0||{};

const $=id=>document.getElementById(id);
/* Markup, das vom Modul abhängt: Pose-Regler, Kopplungs-Block, Pathologie-Regler, Schicht-Schnellwahl, Detail-Dock, Umschalter, Fußzeile.
   Texte bleiben leer und werden von applyLang() über data-i18n gefüllt. */
(function buildModuleMarkup(){
  const pc=$('poseCtls');
  pc.innerHTML=POSE_PARAMS.map(p=>`<div class="ctl"><label for="ps_${p.key}" data-i18n="${p.label}"></label><span class="val" id="pv_${p.key}"></span><input type="range" id="ps_${p.key}" min="${p.min}" max="${p.max}" value="${p.def}" step="${p.step}"><div class="ends"><span data-i18n="${p.ends[0]}"></span><span data-i18n="${p.ends[1]}"></span></div></div>`).join('');
  if(MOD.readout) pc.insertAdjacentHTML('beforeend',`<details class="sub" id="readoutDetails"><summary data-i18n="${MOD.readout.sum}"></summary><div class="kvs" id="readout" style="font-family:var(--mono);font-size:11.5px;color:var(--muted);line-height:1.6"></div><p class="note" data-i18n="${MOD.readout.note}"></p></details>`);
  const pa=$('pathoCtls');
  pa.innerHTML=PATHO_PARAMS.map(p=>`<div class="ctl"><label for="pp_${p.key}" data-i18n="${p.label}"></label><span class="val" id="pv2_${p.key}"></span><input type="range" id="pp_${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${patho[p.key]*p.sliderScale}"></div>`).join('');
  if(!PATHO_PARAMS.length) $('blk-patho').hidden=true;
  /* Schnellwahl-Knöpfe durch Leerzeichen getrennt (Inline-Abstand wie im ursprünglichen Markup) */
  $('layerPresets').innerHTML=[...LAYER_PRESETS.map(lp=>`<button class="btn" data-lp="${lp.id}" style="padding:2px 7px;font-size:11px" data-i18n="${lp.key}"></button>`),`<button class="btn" id="btnLayersAll" style="padding:2px 7px;font-size:11px" data-i18n="lyAll"></button>`].join(' ');
  $('dockRow').innerHTML=detailDefs.map(d=>`<div class="dview"><div class="dcap"><b data-i18n="${d.title}"></b><div class="dctl"><span class="peel"><button data-dv="${d.id}" data-d="1">−</button><span class="pl" id="${d.id}pl"></span><button data-dv="${d.id}" data-d="-1">+</button></span><span class="dval" id="${d.id}val"></span></div></div><div class="dvp viewport" id="${d.id}"></div><div class="dlabel" data-i18n="${d.label}"></div></div>`).join('');
  const seg=$('moduleSeg');
  seg.hidden=REGISTRY.length<2; if(!seg.hidden) seg.innerHTML=REGISTRY.map(r=>`<button data-module="${r.id}"${r.id===MOD.id?' class="on"':''}></button>`).join('');
  $('verName').textContent=MODULE_META.name;
})();

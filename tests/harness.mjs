/* Lädt ein Modul ohne Browser (three.js aus node_modules): Engine-Mathe und -Wörterbuch, alle Modul-Dateien, dann das
   MODULE-Objekt wie in engine/boot.js. Stellt Pose → Metriken als Funktion bereit; DOM-freie Stubs für location/navigator. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE_NS from 'three';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, 'src', p), 'utf8');

export function loadModel(moduleId = 'shoulder') {
  const meta = JSON.parse(read(`modules/${moduleId}/module.json`));
  const engine = ['engine/math.js', 'engine/i18n.js'].map(read).join('\n');
  const mod = meta.parts.map(p => read(`modules/${moduleId}/${p}`)).join('\n');
  const body = `const location={search:'',hash:'',hostname:'',protocol:'file:'}; const navigator={language:'de'}; const localStorage={getItem(){ return null; },setItem(){}};
    ${engine}
    const MODULE=(function(){ ${mod}\n return MODULE; })();   /* Fabrik wie in build.mjs */
    for(const l in MODULE.i18n) Object.assign(I18N[l],MODULE.i18n[l]);
    const {pose,patho,frames,poseParams,pathoParams}=MODULE; const {solvePose,clampPose,evaluate,EVAL,EXT,fasKey}=MODULE.kinematics; const {STRUCT,STRUCT_BY_ID,LAYER_GROUPS,AN}=MODULE.anatomy;
    const fr=Object.assign({}, ...Object.keys(frames).map(k=>({[k]:{p:V3(),q:new THREE.Quaternion()}})));
    const EXT0=Object.assign({},EXT);
    function strainOf(id){ const s=STRUCT_BY_ID[id]; let mx=-9; s.fas.forEach((f,i)=>{ mx=Math.max(mx,EVAL.fas[fasKey(s,i)].strain); }); return mx; }
    function evalPose(ps,opts={}){
      for(const p of pathoParams) patho[p.key]=0; Object.assign(patho,opts.patho||{});
      const p0={}; for(const p of poseParams) p0[p.key]=p.def;
      const p=clampPose(Object.assign(p0,ps));
      for(const k in EXT) delete EXT[k]; Object.assign(EXT,EXT0);
      if(opts.load){ Object.assign(EXT,opts.load); EXT.F=V3(opts.load.F[0],opts.load.F[1],opts.load.F[2]); }
      const rh=solvePose(p,fr); evaluate(fr);
      const strain={}; for(const s of STRUCT){ if(!s.surface&&!s.static) strain[s.id]=strainOf(s.id); }
      const fasL={}; for(const k in EVAL.fas) fasL[k]=EVAL.fas[k].L;
      return {pose:p,rh:Object.assign({},rh),M:Object.assign({},EVAL.metrics),act:Object.assign({},EVAL.act),strain,fasL};
    }
    /* Knochenprimitive aufzeichnen (Ellipsoide, Röhren, Kugeln je Rahmen) – für Ansatzprüfungen ohne Szene */
    function recordBones(){
      const st=staticTube; const prims=[];
      staticTube=(pts,radii)=>({kind:'tube',pts:pts.map(p=>p.clone()),radii:Array.isArray(radii)?radii.slice():pts.map(()=>radii),rotation:{y:0},material:{userData:{}}});
      const G={}; for(const k in frames) G[k]={scale:{x:1},parent:{add(){}}};
      const ctx={G,MAT:{context:{},contextSolid:{},bursa:{clone(){ return {userData:{}}; },userData:{}}},boneMat:()=>({}),pickables:[],BONES:{},
        ell:(c,r)=>({kind:'ell',c:c.clone(),r:r.clone(),rotation:{y:0},material:{userData:{}}}),
        addBone:(g,mesh,id)=>{ const f=Object.keys(G).find(k=>G[k]===g);
          if(mesh.kind) prims.push({f,id,kind:mesh.kind,c:mesh.c,r:mesh.r,pts:mesh.pts,radii:mesh.radii,ry:mesh.rotation.y});
          else if(mesh.geometry&&mesh.geometry.parameters&&mesh.geometry.parameters.radius!==undefined) prims.push({f,id,kind:'ell',c:V3(),r:V3(1,1,1).multiplyScalar(mesh.geometry.parameters.radius),ry:0}); } };
      try{ MODULE.buildBones(ctx); } finally { staticTube=st; }
      return prims;
    }
    return Object.assign({evalPose,clampPose,recordBones,MODULE,PRESETS:MODULE.presets,ANIMS:MODULE.anims,PHYSIO:MODULE.physio,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,AN,poseParams,pathoParams},MODULE.testing||{});`;
  const THREE = THREE_NS.default || THREE_NS;
  return new Function('THREE', body)(THREE);
}

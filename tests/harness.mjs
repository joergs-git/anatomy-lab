/* Lädt Mathe, Anatomie, Kinematik und Presets eines Moduls ohne Browser (three.js aus node_modules) und
   stellt Pose → Metriken als Funktionen bereit. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE_NS from 'three';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, 'src', p), 'utf8');

export function loadModel(moduleId = 'shoulder') {
  const src = ['engine/math.js', `modules/${moduleId}/anatomy.js`, `modules/${moduleId}/kinematics.js`, `modules/${moduleId}/presets.js`].map(read).join('\n');
  const body = `${src}\n
    const fr=mkFrames();
    function strainOf(id){ const s=STRUCT_BY_ID[id]; let mx=-9; s.fas.forEach((f,i)=>{ mx=Math.max(mx,EVAL.fas[fasKey(s,i)].strain); }); return mx; }
    function evalPose(ps,opts={}){
      Object.assign(patho,{migr:0,gird:0,frozen:0},opts.patho||{});
      const p=clampPose(Object.assign({P:0,E:0,IR:0,elbow:0,pro:0},ps));
      if(opts.load){ EXT.F=V3(opts.load.F[0],opts.load.F[1],opts.load.F[2]); EXT.axialOnly=!!opts.load.axialOnly; } else { EXT.F=null; EXT.axialOnly=false; }
      const rh=solvePose(p,fr); evaluate(fr);
      const strain={}; for(const s of STRUCT){ if(!s.surface&&!s.static) strain[s.id]=strainOf(s.id); }
      return {pose:p,rh:Object.assign({},rh),M:Object.assign({},EVAL.metrics),act:Object.assign({},EVAL.act),strain};
    }
    return {evalPose,clampPose,Emax,rotLimits,PRESETS,ANIMS,PHYSIO,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,AN,CAPS_N};`;
  const THREE = THREE_NS.default || THREE_NS;
  return new Function('THREE', body)(THREE);
}

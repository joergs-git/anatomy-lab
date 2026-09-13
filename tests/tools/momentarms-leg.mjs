/* Diagnose: Momentarme (cm) der Hüftmuskeln über die Beugung – x = Streckung(+)/Beugung(−), y = Rotation, z = Abduktion(+)/Adduktion(−), Weltachsen –
   so wie evaluate() sie für die Kraftverteilung bildet (erster Faszikel, Zugrichtung am ersten distalen Punkt).
   Aufruf: node tests/tools/momentarms-leg.mjs [ids,kommagetrennt] [act]   (act: zusätzlich Aktivierungen je Pose) */
import { loadModel } from '../harness.mjs';
import * as THREE_NS from 'three'; const THREE=THREE_NS.default||THREE_NS; const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const m=loadModel('leg'); const K=m.MODULE.kinematics; const f=(v,d=1)=>(+v).toFixed(d);
const mk=()=>Object.assign({}, ...Object.keys(m.MODULE.frames).map(k=>({[k]:{p:V3(),q:new THREE.Quaternion()}})));
const ids=process.argv[2]?process.argv[2].split(','):['glutMax','iliopsoas','bicF','semimem','addMag','glutMed','piri','rectF','tfl','addLong','sart'];
function ma(id,fr){ const s=m.STRUCT_BY_ID[id]; const fas=s.fas[0]; const ev=K.EVAL.fas[K.fasKey(s,0)]; const idx=fas.findIndex(lm=>['F','P','T','A','C'].includes(lm.f)); const I=K.worldPt(fr,fas[idx]); let prev=null; for(let q=1;q<ev.items.length;q++){ if(ev.items[q].p.distanceToSquared(I)<1e-6){ prev=ev.items[q-1].p; break; } } if(!prev) prev=K.worldPt(fr,fas[idx-1]); const dir=prev.clone().sub(I).normalize(); return I.clone().sub(fr.F.p).cross(dir); }
const rows=[{n:'0°',ps:{hipF:0,ground:0}},{n:'30°',ps:{hipF:30,knee:30,ground:0}},{n:'60°',ps:{hipF:60,knee:60,ground:0}},{n:'90°',ps:{hipF:90,knee:90,ground:0}},{n:'120°',ps:{hipF:120,knee:100,ground:0}},{n:'ext−15°',ps:{hipF:-15,ground:0}},{n:'hinge',ps:{hipF:35,knee:25,ankle:5,tilt:8,ground:1},load:{F:[0,-589,0],at:'body'}},{n:'deepSq',ps:{hipF:102,knee:140,ankle:38,ground:1}},{n:'pistol',ps:{hipF:75,knee:105,ankle:30,wt:100,other:4,ground:1}}];
for(const id of ids){ let line=id.padEnd(10);
  for(const r of rows){ const fr=mk(); const p0={}; for(const p of m.poseParams) p0[p.key]=p.def; const ps=m.clampPose(Object.assign(p0,r.ps));
    for(const k in K.EXT) delete K.EXT[k]; Object.assign(K.EXT,{F:null,label:'',at:'foot',fixHip:false}); if(r.load){ K.EXT.F=V3(...r.load.F); K.EXT.at=r.load.at; }
    K.solvePose(ps,fr); K.evaluate(fr); const v=ma(id,fr); line+=` ${r.n}: ${f(v.x)}/${f(v.y)}/${f(v.z)}`; }
  console.log(line); }
if(process.argv[3]==='act'){ for(const r of rows){ const res=m.evalPose(r.ps,{load:r.load}); console.log(r.n.padEnd(8),'lean',f(res.rh.lean,0),'mHip',f(res.M.mHip,0),Object.entries(res.act).filter(([k,v])=>v>0.03).map(([k,v])=>k+' '+f(v,2)).join(', ')); } }

/* ===================== Bein: 3D-Beschriftungen und Ziehen am Bein =====================
   LABELS: Knochen-Landmarken (key → i18n) und je eine Beschriftung pro Struktur.
   DRAG: greifbare Teile; der Rahmen des Griffpunkts (f) entscheidet, welches Gelenk bewegt wird: Oberschenkel → Hüfte,
   Unterschenkel/Patella → Knie, Fuß → Sprunggelenk. Rotationsmodus: horizontal Hüftrotation, vertikal Sprunggelenk. */
const LABELS=[
 {id:'femur',key:'lbGT',lm:F_(AN.GT.c.clone().add(V3(1.0,1.6,0)))},{id:'femur',key:'nameFemur',lm:F_(2.4,-22,0.3)},{id:'femur',key:'lbEpiL',lm:F_(AN.epiL.clone().add(V3(1.2,0.6,0)))},
 {id:'patella',key:'namePatella',lm:P_(0,0,1.3)},{id:'tibia',key:'lbTT',lm:T_(0,-5.2,4.3)},{id:'tibia',key:'nameTibia',lm:T_(0,-20,1.8)},{id:'tibia',key:'lbFibHead',lm:T_(4.8,-3.5,-1.5)},
 {id:'tibia',key:'lbLM',lm:T_(4.4,-43.2,-0.5)},{id:'tibia',key:'lbMM',lm:T_(-4.0,-41.5,-0.2)},{id:'foot',key:'lbCalc',lm:C_(0,-2.4,-7.8)},{id:'foot',key:'lbTalus',lm:A_(0,1.9,0.4)},{id:'foot',key:'lbMT',lm:C_(0,-3.6,13)},
 {id:'pelvis',key:'lbASIS',lm:B_(3.6,8.2,5.8)},{id:'pelvis',key:'lbIschium',lm:B_(-3.6,-6.4,-5.6)},{id:'pelvis',key:'lbSacrum',lm:B_(-9,5,-10.8)},{id:'hoffa',key:'nameHoffa',lm:T_(0,-2.8,3.6)},
];
STRUCT.forEach(s=>{ if(!s.surface) LABELS.push({id:s.id,struct:s}); });

const ARM_IDS=new Set(['femur','patella','tibia','foot','hoffa']); STRUCT.forEach(s=>{ if(!s.surface&&s.fas.some(f=>f.some(lm=>lm.f!=='B'&&lm.f!=='U'))) ARM_IDS.add(s.id); });
const DRAG={
  ids:ARM_IDS,
  frame:'F',
  rot:{x:'hipR',y:'ankle'},
  /* Griffpunkt p0 → Zielpunkt p1 (Modellkoordinaten), f = Rahmen des Griffpunkts */
  pose(p0,p1,fr,f){
    if(f==='A'||f==='C'){ const c=fr.A.p, ax=V3(1,0,0).applyQuaternion(fr.T.q); const v0=p0.clone().sub(c), v1=p1.clone().sub(c); if(v0.length()<2||v1.length()<2) return null;
      return {ankle:pose.ankle-signedAngle(v0,v1,ax)}; }
    if(f==='T'||f==='P'){ const c=fr.T.p, ax=V3(1,0,0).applyQuaternion(fr.F.q); const v0=p0.clone().sub(c), v1=p1.clone().sub(c); if(v0.length()<3||v1.length()<3) return null;
      return {knee:pose.knee+signedAngle(v0,v1,ax)}; }
    const H=fr.F.p; const v0=p0.clone().sub(H), v1=p1.clone().sub(H); if(v0.length()<4||v1.length()<4) return null;
    const q=new THREE.Quaternion().setFromUnitVectors(v0.normalize(),v1.normalize());
    const d=V3(0,-1,0).applyQuaternion(q.multiply(fr.F.q));
    const hipF=Math.atan2(d.z,-d.y)/DEG, hipA=Math.asin(clamp(d.x,-1,1))/DEG;
    return {hipF:clamp(hipF,-20,130),hipA:clamp(hipA,-30,45)};
  },
};

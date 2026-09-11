/* ===================== Kinematik & Biomechanik ===================== */
const pose={P:0,E:0,IR:0,elbow:0,pro:0};          // humerothorakal: Ebene, Elevation, Innenrotation(+)/Außenrotation(−); Ellbogen; Pronation(+)/Supination(−)
const patho={migr:0,gird:0,frozen:0};
const mkFrames=()=>({T:{p:V3(),q:new THREE.Quaternion()},C:{p:V3(),q:new THREE.Quaternion()},S:{p:V3(),q:new THREE.Quaternion()},H:{p:V3(),q:new THREE.Quaternion()},F:{p:V3(),q:new THREE.Quaternion()},R:{p:V3(),q:new THREE.Quaternion()}});
const frames=mkFrames();
const worldPt=(fr,lm)=>fr[lm.f].p.clone().add(lm.v.clone().applyQuaternion(fr[lm.f].q));
/* Signierter Abstand eines Punktes zur Thoraxoberfläche (positiv außen) */
function thoraxGap(p){ const s=thoraxSec(p.y); const dx=(p.x-AN.mid)/s.rx, dz=(p.z-s.cz)/s.rz; const rho=Math.sqrt(dx*dx+dz*dz); return (rho-1)*Math.min(s.rx,s.rz); }
AN.infAngle=sc(-8.1,-12.5,0); AN.medBorder=sc(-10.4,-5.0,0);

/* Bewegungsgrenzen (humerothorakal, Grad) */
function Emax(P,pa=patho){
  let e;
  if(P<=-60) e=lerp(50,60,(P+90)/30);
  else if(P<=-20) e=lerp(60,168,(P+60)/40);
  else if(P<=0) e=lerp(168,172,(P+20)/20);
  else if(P<=25) e=lerp(172,180,P/25);
  else if(P<=100) e=180;
  else if(P<=150) e=lerp(180,110,(P-100)/50);
  else e=110;
  if(P>90) e*=1-0.25*pa.gird*Math.min(1,(P-90)/40);
  return e*(1-0.45*pa.frozen);
}
function rotLimits(E,P=0,pa=patho){
  let er=E<=90?lerp(70,100,E/90):lerp(100,20,(E-90)/90);
  let ir=E<=90?lerp(112,78,E/90):lerp(78,20,(E-90)/90);
  // Ebene: Außenrotation ist in Flexion und bei Adduktion vor dem Körper sowie in Extension geringer
  const pe=P<=30?1:P<=90?lerp(1,0.7,(P-30)/60):lerp(0.7,0.5,(P-90)/60);
  const pe2=P<0?lerp(1,0.8,-P/90):1;
  const k=clamp(E/25,0,1); er*=lerp(1,pe*pe2,k);
  return {ER:er*(1-0.5*pa.frozen),IR:ir*(1-0.45*pa.gird)*(1-0.3*pa.frozen)};
}
/* Rotationskonvention: klinisch/ISB – bei 90° Flexion und 0° Rotation zeigt der gebeugte Unterarm nach medial;
   bei tiefer Elevation stetig in die verdrehungsfreie Schwenkung übergeblendet (Gimbal-Lock vermeiden). */
function twistOffset(P,E){ return P*smooth(clamp((E-30)/60,0,1)); }
function clampPose(ps=pose){
  for(const k of ['P','E','IR','elbow','pro']) if(!(typeof ps[k]==='number')||isNaN(ps[k])) ps[k]=0;
  ps.P=clamp(ps.P,-90,150); ps.E=clamp(ps.E,0,Emax(ps.P));
  const rl=rotLimits(ps.E,ps.P); ps.IR=clamp(ps.IR,-rl.ER,rl.IR);
  ps.elbow=clamp(ps.elbow,0,145); ps.pro=clamp(ps.pro,-85,80);
  return ps;
}

/* Skapulothorakaler Rhythmus: das Schulterblatt hängt an der Klavikula (AC) und gleitet mit unterem und oberem Winkel
   auf dem Thorax entlang – daraus ergeben sich Aufwärtsrotation (~45° bei voller Elevation), posteriore Kippung und
   Protraktion (bei Adduktion vor dem Körper) bzw. anteriore Kippung (Arm hinter dem Rücken). Nach Ludewig u. a. */
function scapTargets(P,E,IR){
  const f=Math.pow(clamp(E/180,0,1),0.9);
  const cross=clamp((P-90)/60,0,1)*clamp(E/60,0,1);          // Arm vor dem Körper → Protraktion
  const ext=clamp((-P-30)/60,0,1)*clamp(E/45,0,1);            // Arm hinter dem Körper → Retraktion/anteriore Kippung
  const irk=(IR>45&&E<80)?(IR-45)/45*(1-E/80):0;              // Innenrotation im hängenden Arm kippt leicht nach vorn
  const iaAng=-48.5+40*f+16*cross-9*ext+4*irk, iaY=-12.5+6*f-1.0*cross;
  const saAng=-47-17*f+14*cross-7*ext, saY=3.5-4.5*f+0.5*cross;
  let cEl=30*Math.pow(E/180,1.2)-4*ext, cRet=20*(E/180)-22*cross+8*ext;
  return {IA:ribPt(iaY,iaAng,1.5),SA:ribPt(saY,saAng,1.4),cEl,cRet,cross,ext};
}
/* Rotation, die das Dreieck (A,B,C) auf (A2,B2,C2) abbildet (Kante A→B exakt, Ebene angenähert) */
function triRotation(A,B,C,A2,B2,C2){
  const basis=(a,b,c)=>{ const e1=b.clone().sub(a).normalize(); let e2=c.clone().sub(a); e2.addScaledVector(e1,-e2.dot(e1)).normalize(); const e3=e1.clone().cross(e2); return new THREE.Matrix4().makeBasis(e1,e2,e3); };
  const m1=basis(A,B,C), m2=basis(A2,B2,C2);
  const R=m2.multiply(m1.clone().invert());
  return new THREE.Quaternion().setFromRotationMatrix(R);
}
AN.superiorAngle=sc(-10.7,3.5,0);
function scapAngles(q){
  // Aufwärtsrotation: Drehung des medialen Randes in der Frontalebene; Kippung: AC→unterer Winkel in der Sagittalebene; Rotation: Pfannennormale in der Transversalebene
  const mb0=AN.infAngle.clone().sub(AN.superiorAngle), mb=mb0.clone().applyQuaternion(q);
  const UR=(Math.atan2(mb0.x,-mb0.y)-Math.atan2(mb.x,-mb.y))/DEG*-1;
  const ia0=AN.infAngle.clone().sub(AN.AC), ia=ia0.clone().applyQuaternion(q);
  const PT=(Math.atan2(ia.z,-ia.y)-Math.atan2(ia0.z,-ia0.y))/DEG;
  const n0=AN.glenoid.n.clone(), n=n0.clone().applyQuaternion(q);
  const ER=(Math.atan2(n.z,n.x)-Math.atan2(n0.z,n0.x))/DEG*-1;
  return {UR,PT,ER};
}

function solvePose(ps,fr,pa=patho){
  const tg=scapTargets(ps.P,ps.E,ps.IR);
  const d=AN.AC.clone().sub(AN.SC); d.y=0; d.normalize();
  const elevAxis=d.clone().cross(V3(0,1,0)).normalize();
  const qC=qMul(qAxis(V3(0,1,0),tg.cRet),qAxis(elevAxis,tg.cEl));
  fr.C.p.copy(AN.SC); fr.C.q.copy(qC);
  const ACw=AN.SC.clone().add(AN.AC.clone().sub(AN.SC).applyQuaternion(qC));
  const qS=triRotation(AN.AC,AN.infAngle,AN.superiorAngle,ACw,tg.IA,tg.SA);
  fr.S.p.copy(ACw); fr.S.q.copy(qS);
  const rh=scapAngles(qS); rh.cEl=tg.cEl; rh.cRet=tg.cRet;
  const GHw=ACw.clone().add(AN.GH.clone().sub(AN.AC).applyQuaternion(qS));
  if(pa.migr) GHw.add(V3(0,pa.migr/10,0).applyQuaternion(qS));
  const axis=V3(-Math.sin(ps.P*DEG),0,Math.cos(ps.P*DEG));
  const qH=qMul(qAxis(axis,ps.E),qAxis(V3(0,1,0),-(ps.IR+twistOffset(ps.P,ps.E))));
  fr.H.p.copy(GHw); fr.H.q.copy(qH);
  const elbowW=GHw.clone().add(AN.elbow.clone().applyQuaternion(qH));
  const qF=qMul(qH.clone(),qAxis(V3(1,0,0),-ps.elbow));
  fr.F.p.copy(elbowW); fr.F.q.copy(qF);
  const uhW=elbowW.clone().add(AN.ulnaHead.clone().applyQuaternion(qF));
  const proAxis=AN.radHead.clone().sub(AN.ulnaHead).normalize();
  const qR=qMul(qF.clone(),qAxis(proAxis,-ps.pro));
  fr.R.p.copy(uhW); fr.R.q.copy(qR);
  fr.T.p.set(0,0,0); fr.T.q.identity();
  return rh;
}

/* Faszikel auswerten: Pfad in Weltkoordinaten (mit Wrapping), Länge */
function evalFascicle(struct,fas,fr){
  const items=fas.map(lm=>({p:worldPt(fr,lm),r:0,w:lm.w,z:lm.z}));
  const spheres=struct.wrap>0?[{c:fr.H.p,r:struct.wrap}]:[];
  const wrapped=wrapPath(items,spheres);
  return {items:wrapped,L:pathLength(wrapped)};
}

/* ---- Gelenkkapsel: 24 Fasern vom Pfannenrand zum Collum anatomicum ---- */
const CAPS_N=24;
(function buildCapsuleDefs(){
  const g=AN.glenoid; const eUp=V3(0,1,0); const eAnt=g.n.clone().cross(eUp).normalize();   // zeigt nach ventral
  const n=AN.neckAxis; let f1=V3(0,1,0).addScaledVector(n,-n.y).normalize(); const f2=f1.clone().cross(n).normalize(); // f2 ventral
  const fibers=[];
  for(let k=0;k<CAPS_N;k++){
    const ph=k/CAPS_N*Math.PI*2;                       // 0 oben, 90° vorn, 180° unten, 270° hinten
    const rim=g.c.clone().addScaledVector(eUp,g.a*Math.cos(ph)).addScaledVector(eAnt,g.b*Math.sin(ph));
    const neck=n.clone().multiplyScalar(AN.capOff).addScaledVector(f1,AN.capR*Math.cos(ph)).addScaledVector(f2,AN.capR*Math.sin(ph));
    fibers.push([L('S',rim,{t:1}),L('H',neck,{t:1})]);
  }
  AN.capsuleFibers=fibers;
  AN.labrumRing=[]; for(let k=0;k<=36;k++){ const ph=k/36*Math.PI*2; AN.labrumRing.push(g.c.clone().addScaledVector(eUp,(g.a+0.15)*Math.cos(ph)).addScaledVector(eAnt,(g.b+0.15)*Math.sin(ph))); }
  AN.glenoidBasis={eUp,eAnt};
})();
const CAPSULE={id:'capsule',name:'Gelenkkapsel',group:'joint',kind:'lig',r:0,wrap:2.46,fas:AN.capsuleFibers,surface:true};
STRUCT.push(CAPSULE); STRUCT_BY_ID.capsule=CAPSULE;

/* Akromion-Unterfläche als Messpunkte, weitere Landmarken */
(function(){
  const items=AN.acromionPath.map(p=>({p,r:0,w:1})); const res=resamplePath(items,9);
  const s=[];
  for(let i=0;i<res.length;i++){
    const t=(i<res.length-1?res[i+1].p.clone().sub(res[i].p):res[i].p.clone().sub(res[i-1].p)); t.y=0; t.normalize();
    const perp=V3(-t.z,0,t.x);
    for(const off of [-1.0,-0.5,0,0.5,1.0]){ const p=res[i].p.clone().addScaledVector(perp,off); p.y-=0.42; if(p.x>-3.8) s.push(L('S',p)); }
  }
  // Schulterdach = Akromion + Lig. coracoacromiale
  const calA=[V3(0.2,3.45,0.9),V3(-0.9,2.4,3.0)], calB=[V3(-0.6,3.5,-0.3),V3(-1.5,2.6,2.6)];
  for(const seg of [calA,calB]) for(let i=0;i<=5;i++) s.push(L('S',seg[0].clone().lerp(seg[1],i/5)));
  AN.acroSamples=s;
  // Coracoid-Unterfläche
  const cs=[]; const cp=AN.coracoidPath; for(let i=2;i<cp.length;i++) for(let k=0;k<=2;k++){ const p=cp[i-1].clone().lerp(cp[i],k/2); p.y-=0.3; cs.push(L('S',p)); }
  AN.corSamples=cs;
  AN.gtEdgeLm=AN.gtEdge.map(p=>L('H',p));
  AN.GTlm=L('H',AN.GT.c); AN.LTlm=L('H',AN.LT.c); AN.corTipLm=L('S',AN.coracoidTip); AN.psRimLm=L('S',AN.psRim);
  AN.grooveLm=L('H',AN.grooveEntry); AN.headTopLm=L('H',V3(0,AN.headR,0));
  AN.bursaCenter=L('S',V3(-0.3,3.0,-0.7));
})();

/* ---- Referenzlängen ---- */
const REF={};   // key struct.id+'#'+i → L0
function fasKey(s,i){ return s.id+'#'+i; }
function computeReferenceLengths(){
  const fr=mkFrames(); const pa0={migr:0,gird:0,frozen:0};
  // Muskeln: Neutralstellung
  solvePose({P:0,E:0,IR:0,elbow:0,pro:0},fr,pa0);
  for(const s of STRUCT){ if(s.kind==='muscle') s.fas.forEach((f,i)=>{ REF[fasKey(s,i)]=evalFascicle(s,f,fr).L; }); }
  REF.lbsIA=lbsGeom(fr,evalFascicle(STRUCT_BY_ID.bicLH,STRUCT_BY_ID.bicLH.fas[0],fr)).ia;
  // Bänder/Kapsel/Nerven: 90 % der maximalen Länge im Bewegungsraum (endgradig gespannt)
  const maxL={};
  const ligs=STRUCT.filter(s=>s.kind!=='muscle');
  for(let P=-90;P<=150;P+=30){
    const em=Emax(P,pa0);
    for(let E=0;E<=em+1;E+=15){ const EE=Math.min(E,em); const rl=rotLimits(EE,P,pa0);
      for(let IR=-rl.ER;IR<=rl.IR+1;IR+=15){ const ir=Math.min(IR,rl.IR);
        solvePose({P,E:EE,IR:ir,elbow:60,pro:0},fr,pa0);
        for(const s of ligs) s.fas.forEach((f,i)=>{ const k=fasKey(s,i); const Lx=evalFascicle(s,f,fr).L; if(!(k in maxL)||Lx>maxL[k]) maxL[k]=Lx; });
      }
    }
  }
  for(const s of ligs) s.fas.forEach((f,i)=>{ const k=fasKey(s,i); REF[k]=(s.kind==='nerve'?0.93:0.85)*maxL[k]; REF[k+'max']=maxL[k]; });
  // obere Kapsel, SGHL und Lig. coracohumerale tragen den hängenden Arm: in Ruhe leicht gespannt
  solvePose({P:0,E:0,IR:0,elbow:0,pro:0},fr,pa0);
  const taut=(s,i)=>{ const k=fasKey(s,i); REF[k]=Math.min(REF[k],0.96*evalFascicle(s,s.fas[i],fr).L); };
  for(let k=0;k<CAPS_N;k++){ const ph=k/CAPS_N*360; if(ph<=60||ph>=300) taut(CAPSULE,k); }
  taut(STRUCT_BY_ID.CHL,0); taut(STRUCT_BY_ID.CHL,1); taut(STRUCT_BY_ID.GHL,0);
  // Antero-inferiore Kapsel (IGHL-Region) und vorderes IGHL-Band halten den Kopf in Abduktion + Außenrotation (Wurf-/Apprehension-Position):
  // dort endgradig (≈ 11 %) – sonst würde die Normierung von extremen Ecken des Bewegungsraums (Hyperextension + Außenrotation) bestimmt.
  { const rl=rotLimits(90,0,pa0); solvePose({P:0,E:90,IR:-rl.ER,elbow:90,pro:0},fr,pa0);
    const endAt=(s,i)=>{ const k=fasKey(s,i); const Lm=evalFascicle(s,s.fas[i],fr).L/0.98; if(Lm<REF[k+'max']){ REF[k+'max']=Lm; REF[k]=0.85*Lm; } };
    for(let k=0;k<CAPS_N;k++){ const ph=k/CAPS_N*360; if(ph>=120&&ph<=150) endAt(CAPSULE,k); }
    endAt(STRUCT_BY_ID.GHL,2); }
  solvePose({P:0,E:0,IR:0,elbow:0,pro:0},fr,pa0);   // zurück in die Ruhestellung – Referenz für die Umlenkung der Bizepssehne
  REF.lbsDefl=lbsGeom(fr,evalFascicle(STRUCT_BY_ID.bicLH,STRUCT_BY_ID.bicLH.fas[0],fr)).defl;
}
/* Pathologie-Anpassung der Referenzlänge (verkürzte Kapsel spannt früher) */
function refLength(s,i){
  let L0=REF[fasKey(s,i)];
  if(s.id==='capsule'||s.id==='GHL'||s.id==='CHL'){
    if(patho.frozen) L0*=1-0.11*patho.frozen;
    if(patho.gird&&s.id==='capsule'){ const ph=i/CAPS_N*360; if(ph>200&&ph<340) L0*=1-0.12*patho.gird; }
    if(patho.gird&&s.id==='GHL'&&i===4) L0*=1-0.12*patho.gird;
  }
  return L0;
}

/* Lange Bizepssehne: Länge des intraartikulären Anteils (Ursprung → Sulcuseingang) und Umlenkwinkel am Sulcuseingang */
function lbsGeom(fr,ev){
  const ge=worldPt(fr,AN.grooveLm); let gi=-1;
  for(let j=0;j<ev.items.length;j++){ if(ev.items[j].p.distanceToSquared(ge)<1e-6){gi=j;break;} }
  let ia=0,defl=0;
  if(gi>0){ for(let j=1;j<=gi;j++) ia+=ev.items[j].p.distanceTo(ev.items[j-1].p);
    if(gi<ev.items.length-1){ const a=ev.items[gi-1].p.clone().sub(ge).normalize(), b=ev.items[gi+1].p.clone().sub(ge).normalize(); defl=180-Math.acos(clamp(a.dot(b),-1,1))/DEG; } }
  return {ia,defl};
}

/* ---- Statische Haltearbeit gegen die Schwerkraft (grobe Schätzung) ---- */
const SEG=[{f:'H',com:V3(0,-13,0.2),m:2.0},{f:'F',com:V3(0,-11,0),m:1.2},{f:'R',com:V3(1.0,-8.5,0.6),m:0.45}];
function gravityTorque(fr){
  const tau=V3(); const GH=fr.H.p;
  for(const s of SEG){ const c=worldPt(fr,{f:s.f,v:s.com}); const r=c.clone().sub(GH).multiplyScalar(0.01); tau.add(r.cross(V3(0,-s.m*9.81,0))); }
  return tau; // Nm
}
/* Äußere Last an der Hand (Band, Hantel, Wand) – Kraft in N, Modellkoordinaten (+X lateral, +Y kranial, +Z ventral) */
const EXT={F:null,label:'',axialOnly:false};   // axialOnly: Ellbogen am Körper abgestützt → nur das Drehmoment um die Humeruslängsachse bleibt
const HAND_LM={f:'R',v:V3(1.0,-7.5,0.7)};
const ARM_MASS=SEG.reduce((a,s)=>a+s.m,0);
const ROTATORS=new Set(['supra','infra','tmin','subsc','pecM','lat','tmaj','deltA','deltP']);
function externalTorque(fr){ let tau=gravityTorque(fr); if(EXT.F){ const h=worldPt(fr,HAND_LM); const r=h.clone().sub(fr.H.p).multiplyScalar(0.01); tau.add(r.clone().cross(EXT.F)); }
  if(EXT.F&&EXT.axialOnly){ const a=V3(0,-1,0).applyQuaternion(fr.H.q); tau=a.multiplyScalar(tau.dot(a)); }   // Ellbogen abgestützt: nur Rotation um die Längsachse
  return tau; }

/* ---- Gesamtauswertung einer Pose ---- */
const EVAL={fas:{},metrics:{},act:{}};
function evaluate(fr){
  const GH=fr.H.p;
  // Engstellen
  let ahd=99; const gt=worldPt(fr,AN.GTlm);
  for(const s of AN.acroSamples){ const w=worldPt(fr,s); ahd=Math.min(ahd,w.distanceTo(GH)-AN.headR,w.distanceTo(gt)-1.15); }
  let chd=99; const lt=worldPt(fr,AN.LTlm);
  for(const s of AN.corSamples){ const w=worldPt(fr,s); chd=Math.min(chd,w.distanceTo(lt)-0.85-0.45); }
  // internes Impingement: Gelenkflächenrand (posterosuperior) ↔ posterosuperiorer Pfannenrand
  let psd=99; const psr=worldPt(fr,AN.psRimLm);
  for(const s of AN.gtEdgeLm){ const w=worldPt(fr,s); psd=Math.min(psd,w.distanceTo(psr)-0.45); }
  const M=EVAL.metrics; M.ahd=ahd; M.chd=chd; M.psd=psd;
  // Faszikel
  const tau=externalTorque(fr); const tauMag=tau.length(); const tauHat=tauMag>1e-6?tau.clone().normalize().negate():V3();   // Muskeln müssen −(τ_Gewicht+τ_Last) aufbringen
  let sumMA=0; const act=[];
  for(const s of STRUCT){
    s.fas.forEach((f,i)=>{
      const k=fasKey(s,i); const ev=evalFascicle(s,f,fr);
      const L0=refLength(s,i); ev.L0=L0;
      if(s.kind==='muscle') ev.strain=Math.min((ev.L-L0)/L0,0.6);
      else if(s.static) ev.strain=0;
      else { const Lm=REF[k+'max']*(L0/REF[k]); ev.strain=clamp((ev.L-L0)/Math.max(0.05,Lm-L0)*0.12,-0.3,0.3); }   // Band/Kapsel: 0 = beginnt zu tragen, 12 % = endgradig
      EVAL.fas[k]=ev;
      if(s.pcsa>0&&!(EXT.F&&EXT.axialOnly&&!ROTATORS.has(s.id))){
        // Kraftangriff: erster Punkt am Humerus/Unterarm; Richtung zum vorhergehenden Pfadpunkt
        const firstDist=f.findIndex(lm=>lm.f==='H'||lm.f==='F'||lm.f==='R'); if(firstDist<=0) return;
        const I=worldPt(fr,f[firstDist]);
        // vorheriger Pfadpunkt: im gewrappten Pfad der Punkt vor I
        let prev=null; for(let j=1;j<ev.items.length;j++){ if(ev.items[j].p.distanceToSquared(I)<1e-6){ prev=ev.items[j-1].p; break; } }
        if(!prev) prev=worldPt(fr,f[firstDist-1]);
        const fhat=prev.clone().sub(I).normalize();
        const ma=I.clone().sub(GH).multiplyScalar(0.01).cross(fhat); // m
        const proj=ma.dot(tauHat);
        if(proj>0.45*ma.length()){ /* nur Muskeln, deren Hebel zur geforderten Drehrichtung passt */ act.push({s,i,proj,pcsa:s.pcsa/s.fas.length,fhat}); sumMA+=(s.pcsa/s.fas.length)*proj*proj; }
      }
    });
  }
  // Kraftverteilung ∝ PCSA·Hebel, so dass Σ F·Hebel = τ
  EVAL.act={}; EVAL.tau=tauMag;
  const kf=sumMA>1e-9?tauMag/sumMA:0; const Fsum=V3();
  for(const a of act){ const F=kf*a.pcsa*a.proj; const Fmax=a.pcsa*6*40; const id=a.s.id; EVAL.act[id]=Math.max(EVAL.act[id]||0,F/Fmax); Fsum.addScaledVector(a.fhat,F); }
  // Gelenkreaktionskraft: Muskelzug + Armgewicht + äußere Last (grobe Schätzung)
  const Fj=Fsum.clone().add(V3(0,-ARM_MASS*9.81,0)); if(EXT.F) Fj.add(EXT.F);
  M.jrf=Fj.length(); M.muscleSum=Fsum.length();
  // Kapsel-Regionen
  const reg={ant:-1,inf:-1,post:-1,sup:-1};
  for(let k=0;k<CAPS_N;k++){ const st=EVAL.fas['capsule#'+k].strain; const ph=k/CAPS_N*360;
    const r=(ph<45||ph>=315)?'sup':ph<135?'ant':ph<225?'inf':'post'; reg[r]=Math.max(reg[r],st); }
  M.capAnt=reg.ant; M.capInf=reg.inf; M.capPost=reg.post; M.capSup=reg.sup;
  // LBS: intraartikulärer Anteil + Umlenkwinkel am Sulcuseingang
  const lb=EVAL.fas['bicLH#0']; const lg=lbsGeom(fr,lb);
  M.lbsIA=lg.ia; M.lbsStrain=(lg.ia-REF.lbsIA)/REF.lbsIA; M.lbsDefl=lg.defl; M.lbsTotal=lb.strain;
  M.axStrain=EVAL.fas['nAx#0'].strain; M.ssStrain=EVAL.fas['nSS#0'].strain;
  M.bursaComp=clamp((0.8-ahd)/0.5,0,1);
  M.corComp=clamp((0.7-chd)/0.5,0,1);
  M.psComp=clamp((0.6-psd)/0.4,0,1);
  M.lbsDeflRel=lg.defl-REF.lbsDefl;
  M.grooveComp=clamp(M.corComp*0.7+clamp((M.lbsDeflRel-15)/35,0,1)*0.6,0,1);
  return EVAL;
}
computeReferenceLengths();

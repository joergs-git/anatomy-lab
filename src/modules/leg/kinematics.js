/* ===================== Kinematik & Biomechanik des Beins =====================
   Pose (Grad): hipF Oberschenkel nach vorn (bei Bodenkontakt zur Senkrechten; klinische Hüftbeugung = hipF + Rumpfneigung), hipA Abduktion(+), hipR Innenrotation(+)/Außenrotation(−),
   knee Kniebeugung, tibR Tibia-Innenrotation(+), valg Valgus(+)/Varus(−), ankle Dorsalextension(+)/Plantarflexion(−), sub Inversion(+)/Eversion(−),
   wt Gewichtsanteil auf diesem Bein (%), ground Bodenkontakt (0/1).
   Bodenkontakt: die Kette wird so verschoben, dass der Fuß am festen Bodenpunkt steht, und der Rumpf so geneigt, dass der Körperschwerpunkt
   darüber liegt (Analogon zum skapulothorakalen Rhythmus). Ohne Bodenkontakt hängt das Bein am ruhenden Becken. */
const pose={hipF:0,hipA:0,hipR:0,knee:0,tibR:0,valg:0,ankle:0,sub:0,wt:50,ground:1};
const patho={cart:0,acl:0};             // cart: Knorpelverlust patellofemoral (0…1), acl: VKB-Insuffizienz (0…1)
const FRAME_IDS=['B','U','F','P','T','A','C','F2','T2','A2','C2'];
const mkFrames=()=>{ const o={}; for(const k of FRAME_IDS) o[k]={p:V3(),q:new THREE.Quaternion()}; return o; };
const frames=mkFrames();
const worldPt=(fr,lm)=>fr[lm.f].p.clone().add(lm.v.clone().applyQuaternion(fr[lm.f].q));
const BW=75*9.81;                                       // Körpergewicht in N (75 kg)
const MASS={thigh:0.100,shank:0.0465,foot:0.0145,trunk:0.678,leg:0.161};   // Anteile am Körpergewicht (Dempster)
const COM={F:V3(0.4,-18.6,0.4),T:V3(0,-17.8,-0.6),C:V3(0,-3.5,2.0)};        // Segmentschwerpunkte rahmenlokal
const F_MAX_PCSA=600;                                    // N je PCSA-Einheit (Quadrizeps gesamt ≈ 4,7 kN)
const GROUND_PT=V3(0,AN.groundY,2.7);                    // fester Auflagepunkt (Sohlenmitte im Stand)

/* ---- Bewegungsgrenzen (Grad): Hüftbeugung durch die Hamstrings bei gestrecktem Knie, Dorsalextension durch den Gastrocnemius bei gestrecktem Knie,
   Tibiarotation und Valgus nur bei gebeugtem Knie (in Streckung verriegelt) ---- */
function limits(ps){
  const k=clamp(ps.knee/30,0,1);
  return {hipF:[-20,Math.min(130,85+0.35*ps.knee)],hipA:[-30,45],hipR:[-45,45],knee:[0,140],
    tibR:[-(3+17*k),3+17*k],valg:[-(4+11*k),4+11*k],ankle:[-45,20+22*clamp(ps.knee/60,0,1)],sub:[-15,30],wt:[0,100],ground:[0,1]};
}
function clampPose(ps=pose){
  for(const k in pose) if(!(typeof ps[k]==='number')||isNaN(ps[k])) ps[k]=k==='wt'?50:k==='ground'?1:0;
  const lim=limits(ps); for(const k in lim) ps[k]=clamp(ps[k],lim[k][0],lim[k][1]);
  ps.ground=ps.ground>=0.5?1:0;
  return ps;
}
/* Screw-home: in den letzten 30° der Streckung dreht die Tibia automatisch ≈ 8° nach außen */
function screwHome(knee){ return -8*(1-smooth(clamp(knee/30,0,1))); }
/* Patellabahn: Mittelpunkt auf einem Bogen um das Kniezentrum (Radius nimmt in tiefer Beugung ab, Patella taucht in die Fossa) */
function patellaCenter(knee){ const phi=(AN.patPhi0-0.75*knee)*DEG, R=AN.patR0-1.0*clamp(knee/140,0,1); return AN.knee.clone().add(V3(0,R*Math.sin(phi),R*Math.cos(phi))); }
const mirrorX=p=>V3(2*AN.mid-p.x,p.y,p.z);
const mirrorQ=q=>new THREE.Quaternion(q.x,-q.y,-q.z,q.w);
let LAST={ground:false,S:GROUND_PT.clone(),grf:0,lean:0,bodyLoad:0};   // Zustand der letzten Pose für evaluate()

function solvePose(ps,fr,pa=patho){
  const gnd=ps.ground>=0.5;
  fr.B.p.set(0,0,0); fr.B.q.identity();
  const qF=qMul(qAxis(V3(0,0,1),ps.hipA),qAxis(V3(-1,0,0),ps.hipF),qAxis(V3(0,1,0),-ps.hipR));
  fr.F.p.copy(AN.hip); fr.F.q.copy(qF);
  const screw=screwHome(ps.knee);
  fr.T.p.copy(worldPt(fr,{f:'F',v:AN.knee}));
  fr.T.q.copy(qMul(qF.clone(),qAxis(V3(1,0,0),ps.knee),qAxis(V3(0,0,1),ps.valg),qAxis(V3(0,1,0),-(ps.tibR+screw))));
  fr.P.p.copy(fr.F.p.clone().add(patellaCenter(ps.knee).applyQuaternion(qF))); fr.P.q.copy(qMul(qF.clone(),qAxis(V3(1,0,0),0.7*ps.knee)));
  /* Talus: Dorsalextension(+); bei Inversion kippt der Talus leicht mit (Talar tilt). Fuß: Inversion(+) = Außenrand nach unten, um die schräge Subtalarachse */
  fr.A.p.copy(worldPt(fr,{f:'T',v:AN.ankle})); fr.A.q.copy(qMul(fr.T.q.clone(),qAxis(V3(-1,0,0),ps.ankle),qAxis(AN.subtalarAxis,-0.25*ps.sub)));
  fr.C.p.copy(worldPt(fr,{f:'A',v:AN.subtalar})); fr.C.q.copy(qMul(fr.A.q.clone(),qAxis(AN.subtalarAxis,-ps.sub)));
  /* Bodenkontakt: Auflagepunkt (Ferse, Ballen oder Sohlenmitte) an den festen Bodenpunkt schieben */
  const rh={lean:0,grf:0,balanced:true,screw,ground:gnd,comZ:0};
  const bodyLoad=(EXT.F&&EXT.at==='body')?EXT.F.length():0;
  if(gnd){
    const heel=worldPt(fr,{f:'C',v:AN.heel}), mt=worldPt(fr,{f:'C',v:AN.mtHeads});
    const dy=heel.y-mt.y; const S=Math.abs(dy)<1.0?heel.clone().lerp(mt,0.5):(dy<0?heel:mt);
    const d=GROUND_PT.clone().sub(S); for(const k of ['B','F','P','T','A','C']) fr[k].p.add(d);
  }
  /* Rumpf: bei Bodenkontakt so neigen, dass der Gesamtschwerpunkt (beide Beine gespiegelt, Rumpf + Zusatzlast) über dem Auflagepunkt liegt */
  fr.U.p.copy(fr.B.p.clone().add(AN.trunkOrigin));
  let lean=0;
  if(gnd){
    const zLegs=2*(MASS.thigh*worldPt(fr,{f:'F',v:COM.F}).z+MASS.shank*worldPt(fr,{f:'T',v:COM.T}).z+MASS.foot*worldPt(fr,{f:'C',v:COM.C}).z);
    const mU=MASS.trunk+bodyLoad/BW;                         // Zusatzlast (Langhantel) zählt zum Rumpf
    const c=(GROUND_PT.z*(1+bodyLoad/BW)-zLegs)/mU-fr.U.p.z; // gefordert: a·sinλ + b·cosλ = c
    const a=AN.trunkCOM.y, b=AN.trunkCOM.z, r=Math.hypot(a,b);
    if(Math.abs(c)<=r) lean=(Math.asin(c/r)-Math.atan2(b,a))/DEG; else lean=c>0?90:-90;
    if(Math.abs(lean)>60){ lean=clamp(lean,-60,60); rh.balanced=false; }   /* mehr als 60° Rumpfneigung: Abstützung oder zweites Bein nötig */
  }
  fr.U.q.copy(qAxis(V3(1,0,0),lean)); rh.lean=lean;
  rh.comZ=fr.U.p.z+AN.trunkCOM.y*Math.sin(lean*DEG)+AN.trunkCOM.z*Math.cos(lean*DEG);
  rh.hipClin=ps.hipF+lean;                                 // klinische Hüftbeugung (Rumpf zu Oberschenkel)
  fr.B.q.copy(qAxis(V3(1,0,0),lean));                       // Becken neigt sich mit dem Rumpf (um das Hüftzentrum)
  /* Anderes Bein: gespiegelt (Kontext) */
  for(const k of ['F','T','A','C']){ fr[k+'2'].p.copy(mirrorX(fr[k].p)); fr[k+'2'].q.copy(mirrorQ(fr[k].q)); }
  rh.grf=gnd?ps.wt/100*(BW+bodyLoad):0;
  LAST={ground:gnd,S:GROUND_PT,grf:rh.grf,lean,bodyLoad,pose:ps};
  return rh;
}

/* Faszikel auswerten: Pfad in Weltkoordinaten mit Wrapping um die Kugeln der Struktur, Länge */
function evalFascicle(struct,fas,fr){
  const items=fas.map(lm=>({p:worldPt(fr,lm),r:0,w:lm.w,z:lm.z}));
  const spheres=(struct.wrap||[]).map(w=>({c:worldPt(fr,{f:w.f,v:w.v}),r:w.r}));
  const wrapped=wrapPath(items,spheres);
  return {items:wrapped,L:pathLength(wrapped)};
}

/* ---- Referenzlängen: Muskeln relativ zum Stand; Bänder/Nerv normiert auf die Maximallänge im abgetasteten Bewegungsraum ---- */
const REF={};
function fasKey(s,i){ return s.id+'#'+i; }
function computeReferenceLengths(){
  const fr=mkFrames(); const pa0={cart:0,acl:0}; const EXT0=EXT.F; EXT.F=null;
  const P0={hipF:0,hipA:0,hipR:0,knee:0,tibR:0,valg:0,ankle:0,sub:0,wt:50,ground:0};
  solvePose(P0,fr,pa0);
  for(const s of STRUCT){ if(s.kind==='muscle') s.fas.forEach((f,i)=>{ REF[fasKey(s,i)]=evalFascicle(s,f,fr).L; }); }
  const ligs=STRUCT.filter(s=>s.kind!=='muscle'&&!s.static); const maxL={};
  const sample=ps=>{ solvePose(clampPose(Object.assign({},P0,ps)),fr,pa0); for(const s of ligs) s.fas.forEach((f,i)=>{ const k=fasKey(s,i); const Lx=evalFascicle(s,f,fr).L; if(!(k in maxL)||Lx>maxL[k]) maxL[k]=Lx; }); };
  for(let knee=0;knee<=140;knee+=20) for(const valg of [-15,0,15]) for(const tibR of [-20,0,20]) for(const ankle of [-45,-20,0,20]) for(const sub of [-15,0,15,30]) sample({knee,valg,tibR,ankle,sub});
  for(let hipF=-20;hipF<=120;hipF+=35) for(let knee=0;knee<=140;knee+=35) for(const ankle of [-45,0,20]) for(const sub of [-15,30]) sample({hipF,knee,ankle,sub});
  /* Anker: Kreuzbänder und Seitenbänder tragen in Streckung, sind aber erst mit Valgus/Rotation endgradig → Beginn des Tragens bei 88 % */
  const base={ACL:0.85,PCL:0.85,MCL:0.87,LCL:0.87,atfl:0.85,cfl:0.85,ptfl:0.85,deltoid:0.86,nPer:0.93};
  for(const s of ligs) s.fas.forEach((f,i)=>{ const k=fasKey(s,i); REF[k]=(base[s.id]||0.85)*maxL[k]; REF[k+'max']=maxL[k]; });
  EXT.F=EXT0;
}
function refLength(s,i){ return REF[fasKey(s,i)]; }

/* ---- Äußere Last: F in N (Weltkoordinaten); at:'foot' greift am Fuß an (Manschette, Maschine), at:'body' ist Zusatzgewicht am Rumpf (Langhantel) ---- */
const EXT={F:null,label:'',at:'foot',fixHip:false};   // fixHip: Oberschenkel/Becken abgestützt (Maschine, Sitz) → kein Hüftmoment
const FOOT_LOAD_LM={f:'C',v:V3(0,-3.5,2.0)};
const signedAngle=(a,b,axis)=>Math.atan2(a.clone().cross(b).dot(axis),a.dot(b))/DEG;

/* ---- Gesamtauswertung einer Pose: Gelenkmomente → Muskelkräfte → Gelenk-/Sehnenkräfte, Engstellen ---- */
const EVAL={fas:{},metrics:{},act:{}};
function evaluate(fr){
  const M=EVAL.metrics; const gnd=LAST.ground; const GRF=LAST.grf; const GRFv=V3(0,GRF,0);
  const H=fr.F.p, K=fr.T.p, Aj=fr.A.p;
  const cF=worldPt(fr,{f:'F',v:COM.F}), cT=worldPt(fr,{f:'T',v:COM.T}), cC=worldPt(fr,{f:'C',v:COM.C});
  const seg=[{c:cF,m:MASS.thigh,fr:'F'},{c:cT,m:MASS.shank,fr:'T'},{c:cC,m:MASS.foot,fr:'C'}];
  const extPt=gnd?LAST.S:worldPt(fr,FOOT_LOAD_LM); const extF=(!gnd&&EXT.F&&EXT.at!=='body')?EXT.F:null;
  /* Rahmenachsen der Tibia (Weltkoordinaten) */
  const yT=V3(0,1,0).applyQuaternion(fr.T.q), zT=V3(0,0,1).applyQuaternion(fr.T.q), xF=V3(1,0,0).applyQuaternion(fr.F.q);
  /* Faszikel */
  for(const s of STRUCT){ s.fas.forEach((f,i)=>{ const k=fasKey(s,i); const ev=evalFascicle(s,f,fr); const L0=refLength(s,i); ev.L0=L0;
    if(s.kind==='muscle') ev.strain=Math.min((ev.L-L0)/L0,0.6);
    else if(s.static) ev.strain=0;
    else { const Lm=REF[k+'max']; ev.strain=clamp((ev.L-L0)/Math.max(0.05,Lm-L0)*0.12,-0.3,0.3); }
    EVAL.fas[k]=ev; }); }
  /* Äußere Momente je Gelenk (Nm): Bodenreaktion bzw. Last am Fuß + Gewicht der distalen Segmente */
  const JOINTS={hip:{c:H,distal:new Set(['F','P','T','A','C'])},knee:{c:K,distal:new Set(['T','A','C'])},ankle:{c:Aj,distal:new Set(['A','C'])}};
  const tau={};
  for(const j in JOINTS){ const J=JOINTS[j]; const t=V3();
    for(const sg of seg){ if(!J.distal.has(sg.fr)) continue; t.add(sg.c.clone().sub(J.c).multiplyScalar(0.01).cross(V3(0,-sg.m*BW,0))); }
    if(gnd) t.add(extPt.clone().sub(J.c).multiplyScalar(0.01).cross(GRFv)); else if(extF) t.add(extPt.clone().sub(J.c).multiplyScalar(0.01).cross(extF));
    if(j==='hip'&&EXT.fixHip) t.set(0,0,0);
    tau[j]=t; }
  M.mHip=tau.hip.length(); M.mKnee=tau.knee.length(); M.mAnk=tau.ankle.length();
  M.mKneeDir=Math.sign(tau.knee.dot(xF));   // +1 = Beugemoment (Quadrizeps hält), −1 = Streckmoment (Hamstrings halten)
  /* Kraftverteilung je Gelenk ∝ PCSA · Hebelarm; Quadrizeps wirkt am Knie über die Patellarsehne */
  const TTw=worldPt(fr,{f:'T',v:AN.TT}), apexW=worldPt(fr,{f:'P',v:AN.patApex}), supW=worldPt(fr,{f:'P',v:AN.patSup});
  const vPT=apexW.clone().sub(TTw).normalize();          // Patellarsehne: Tuberositas → Patellaspitze
  const Fj={hip:{},knee:{},ankle:{}}; const fhat={hip:{},knee:{},ankle:{}};
  for(const j in JOINTS){ const J=JOINTS[j]; const t=tau[j]; const tauMag=t.length(); if(tauMag<1e-6) continue; const tauHat=t.clone().normalize().negate();
    const cand=[]; let sum=0;
    for(const s of STRUCT){ if(!(s.pcsa>0)||!s.joints||!s.joints.includes(j)) continue;
      let I,f;
      if(j==='knee'&&s.group==='quad'){ I=TTw; f=vPT; }
      else { const fas=s.fas[0]; const ev=EVAL.fas[fasKey(s,0)]; const idx=fas.findIndex(lm=>J.distal.has(lm.f)); if(idx<=0) continue;
        I=worldPt(fr,fas[idx]); let prev=null; for(let q=1;q<ev.items.length;q++){ if(ev.items[q].p.distanceToSquared(I)<1e-6){ prev=ev.items[q-1].p; break; } } if(!prev) prev=worldPt(fr,fas[idx-1]); f=prev.clone().sub(I).normalize(); }
      const ma=I.clone().sub(J.c).multiplyScalar(0.01).cross(f); const proj=ma.dot(tauHat);
      if(proj>0.45*ma.length()){ cand.push({s,proj,f}); sum+=s.pcsa*proj*proj; } }
    const kf=sum>1e-9?tauMag/sum:0;
    for(const c of cand){ Fj[j][c.s.id]=kf*c.s.pcsa*c.proj; fhat[j][c.s.id]=c.f; } }
  EVAL.act={}; const force={};
  for(const s of STRUCT){ if(!(s.pcsa>0)) continue; let F=0; for(const j in Fj) if(Fj[j][s.id]>F) F=Fj[j][s.id]; force[s.id]=F; if(F>0) EVAL.act[s.id]=F/(s.pcsa*F_MAX_PCSA); }
  /* Quadrizeps → Patellarsehne → patellofemorale Kraft (Vektorsumme von Quadrizeps- und Patellarsehnenzug an der Patella) */
  const ps=LAST.pose||pose; const knee=ps.knee;
  const Fq=(Fj.knee.rectF||0)+(Fj.knee.vastL||0)+(Fj.knee.vastM||0);
  const ptRatio=lerp(1.0,0.75,clamp((knee-30)/90,0,1));   // Patellarsehne/Quadrizeps (van Eijden): 1,0 in Streckung → 0,75 in tiefer Beugung
  const Fpt=Fq*ptRatio;
  const vQ=worldPt(fr,STRUCT_BY_ID.rectF.fas[0][3]).sub(supW).normalize();   // Richtung der Quadrizepssehne über der Patella
  const pfv=vQ.multiplyScalar(Fq).add(vPT.clone().negate().multiplyScalar(Fpt));
  M.quad=Fq; M.patTen=Fpt; M.patTenBW=Fpt/BW; M.pf=pfv.length(); M.pfBW=M.pf/BW;
  const area=(2.0+3.5*clamp(knee/90,0,1)-0.8*clamp((knee-100)/40,0,1))*(1-0.5*patho.cart);   // Kontaktfläche cm²
  M.pfArea=area; M.pfPress=M.pf/area/100;                                                     // MPa
  M.patEngaged=clamp((knee-12)/16,0,1);
  /* Tibiofemorale Kompression (Anteile entlang der Tibiaachse) und Schub (VKB/HKB) entlang der Tibia-Vorderachse */
  let axial=Fpt*Math.abs(vPT.dot(yT)), shear=Fpt*vPT.dot(zT);
  for(const id of ['bicF','semimem','semitend','sart','gracilis','gastroM','gastroL']){ const F=Fj.knee[id]||0; if(!F) continue; const f=fhat.knee[id]; axial+=F*Math.abs(f.dot(yT)); if(id!=='gastroM'&&id!=='gastroL') shear+=F*f.dot(zT); }
  const extAx=gnd?Math.max(0,GRFv.dot(yT)):(extF?Math.max(0,-extF.dot(yT)):0);
  M.tf=axial+extAx; M.tfBW=M.tf/BW;
  if(gnd) shear+=GRFv.dot(zT)*0.5;   // Bodenreaktion schiebt die Tibia relativ zum Femur (halb, weil auf beide Kompartimente verteilt)
  M.acl=Math.max(0,shear); M.pcl=Math.max(0,-shear);
  M.aclShift=M.acl/150*(1+4*patho.acl);                    // vordere Translation in mm (Bandsteifigkeit ≈ 150 N/mm)
  const ligMax=id=>{ const s=STRUCT_BY_ID[id]; let mx=-9; s.fas.forEach((f,i)=>{ mx=Math.max(mx,EVAL.fas[fasKey(s,i)].strain); }); return mx; };
  /* VKB-Spannung: Geometrie (in Streckung nahe der Maximallänge, daher × 0,75) + Innenrotation/Valgus (Verdrillung um das HKB, vereinfachter Zuschlag) + Schub der Patellarsehne */
  M.aclStrain=ligMax('ACL')*0.75+0.0025*Math.max(0,ps.tibR)+0.002*Math.max(0,ps.valg)+M.acl/8000; M.pclStrain=ligMax('PCL')+M.pcl/8000; M.mcl=ligMax('MCL'); M.lcl=ligMax('LCL');
  /* Achillessehne, Hüftkontaktkraft */
  M.ach=(Fj.ankle.gastroM||0)+(Fj.ankle.gastroL||0)+(Fj.ankle.soleus||0); M.achBW=M.ach/BW;
  { const Fsum=V3(); for(const id in Fj.hip){ Fsum.addScaledVector(fhat.hip[id],Fj.hip[id]); } const ext=gnd?V3(0,GRF-MASS.leg*BW,0):V3(0,-MASS.leg*BW,0); if(extF) ext.add(extF); M.hipJ=Fsum.add(ext).length(); M.hipBW=M.hipJ/BW; }
  M.grf=GRF; M.grfBW=GRF/BW; M.lean=LAST.lean;
  /* Tractus ↔ lateraler Epikondylus: Lage des Bandes relativ zum Epikondylus (vorn +, hinten −), Reibzone beim Übergleiten */
  { const epi=worldPt(fr,{f:'F',v:AN.epiL}); const ev=EVAL.fas['tfl#0']; let best=null,bd=1e9; const seg=new THREE.Line3(), tmp=V3();
    for(let q=1;q<ev.items.length;q++){ seg.set(ev.items[q-1].p,ev.items[q].p); seg.closestPointToPoint(epi,true,tmp); const d=tmp.distanceTo(epi); if(d<bd){ bd=d; best=tmp.clone(); } }
    const off=best.clone().sub(epi).dot(zT)*10; M.itbOff=off; const contact=bd<2.0; M.itbComp=contact?clamp(1-Math.abs(off)/11,0,1):0; }
  /* Sprunggelenk: vorderes Impingement (Talushals ↔ Tibiavorderrand), hinteres (Processus posterior ↔ Tibiahinterrand), in mm */
  M.ankAnt=Math.max(0,worldPt(fr,{f:'A',v:AN.talusNeck}).distanceTo(worldPt(fr,{f:'T',v:AN.tibAntRim}))-0.3)*10;
  M.ankPost=Math.max(0,worldPt(fr,{f:'A',v:AN.talusPost}).distanceTo(worldPt(fr,{f:'T',v:AN.tibPostRim}))-0.3)*10;
  M.ankAntComp=clamp((6-M.ankAnt)/5,0,1); M.ankPostComp=clamp((6-M.ankPost)/5,0,1);
  /* Menisken: Hinterhörner werden ab ≈ 115° Beugung nach hinten gedrängt und komprimiert */
  M.menComp=clamp((knee-115)/30,0,1);
  M.atfl=ligMax('atfl'); M.cfl=ligMax('cfl'); M.ptfl=ligMax('ptfl'); M.delt=ligMax('deltoid'); M.nerve=ligMax('nPer');
  M.nerveComp=0;
  return EVAL;
}
computeReferenceLengths();

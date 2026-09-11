/* ===================== Bein: Knochengeometrie =====================
   Baut Becken (+ Rumpf und Kopf als Kontext), Femur, Patella, Tibia + Fibula, Talus, Calcaneus und Vorfuß, Hoffa-Fettkörper, Boden
   und das gespiegelte andere Bein (Kontext). ctx aus engine/render.js: G (Gruppen je Rahmen), MAT, boneMat(id), addBone(group,mesh,id,layer),
   ell(center,radii,mat), pickables, BONES. Geometrie rahmenlokal in cm. */
const LAYER={thigh:1,trunk:2,shank:3,deep:4};
function buildBones({G,MAT,boneMat,addBone,ell,pickables,BONES}){
  const ROOT=G.B.parent;
  /* ---- Becken + Rumpf ---- */
  (function buildPelvis(){
    const g=G.B, mat=boneMat('pelvis');
    const wing=ell(V3(2.2,8.5,-1.5),V3(1.1,4.8,5.6),mat); wing.rotation.y=0.35; addBone(g,wing,'pelvis');   // Darmbeinschaufel rechts
    addBone(g,ell(V3(0,0.4,0),V3(3.1,3.1,3.1),mat),'pelvis');                                              // Hüftpfanne (Kugelschale um den Kopf)
    addBone(g,ell(V3(-3.6,-5.0,-4.6),V3(1.6,1.6,2.6),mat),'pelvis');                                         // Sitzbein
    addBone(g,staticTube([V3(-1.2,-2.2,4.2),V3(-5,-2.6,5.4),V3(-9,-2.4,5.6)],[1.0,0.9,1.0],8,{material:mat,rings:10}),'pelvis');   // Schambein
    addBone(g,ell(V3(-9,4.5,-8.5),V3(3.2,4.2,2.0),mat),'pelvis');                                             // Kreuzbein
    const wing2=ell(V3(-20.2,8.5,-1.5),V3(1.1,4.8,5.6),mat); wing2.rotation.y=-0.35; addBone(g,wing2,'pelvis'); // Darmbeinschaufel links
    addBone(g,ell(V3(-18,0.4,0),V3(3.1,3.1,3.1),mat),'pelvis');
    addBone(g,staticTube([V3(-16.8,-2.2,4.2),V3(-13,-2.6,5.4),V3(-9.2,-2.4,5.6)],[1.0,0.9,1.0],8,{material:mat,rings:10}),'pelvis');
    /* Rumpf und Kopf (Kontext, rumpflokal) */
    const torso=ell(V3(0,28,1.5),V3(14,25,10),MAT.context); torso.renderOrder=-1; addBone(G.U,torso,'pelvis',LAYER.trunk);
    addBone(G.U,ell(V3(0,64,1),V3(9,10,9.5),MAT.context),'pelvis',LAYER.trunk);
    addBone(G.U,staticTube([V3(0,2,-6),V3(0,20,-8),V3(0,40,-6),V3(0,52,-4)],[1.6,1.7,1.6,1.4],10,{material:MAT.contextSolid,rings:18}),'pelvis',LAYER.trunk);   // Wirbelsäule
  })();
  /* ---- Femur ---- */
  (function buildFemur(){
    const g=G.F, mat=boneMat('femur'), L=LAYER.thigh;
    addBone(g,new THREE.Mesh(new THREE.SphereGeometry(AN.headR,28,20),mat),'femur',L);
    addBone(g,staticTube([V3(0.3,-0.2,0),V3(3.0,-2.2,-0.3),V3(5.0,-3.8,-0.5)],[1.5,1.7,2.0],12,{material:mat,rings:10}),'femur',L);   // Schenkelhals
    addBone(g,ell(AN.GT.c,AN.GT.r,mat),'femur',L); addBone(g,ell(AN.LT.c,AN.LT.r,mat),'femur',L);
    addBone(g,staticTube([V3(5.0,-4.5,-0.5),V3(4.2,-12,0),V3(2.8,-24,0.3),V3(1.6,-34,0.2),V3(0.8,-40.5,-0.3)],[2.0,1.5,1.4,1.5,2.5],14,{material:mat,rings:26}),'femur',L);   // Schaft
    addBone(g,ell(AN.condM.c,V3(AN.condM.r,AN.condM.r,AN.condM.r*1.15),mat),'femur',L);
    addBone(g,ell(AN.condL.c,V3(AN.condL.r,AN.condL.r,AN.condL.r*1.15),mat),'femur',L);
    addBone(g,ell(AN.trochlea.c,AN.trochlea.r,mat),'femur',L);
    addBone(g,ell(V3(0,-41.5,-0.4),V3(4.2,2.0,2.2),mat),'femur',L);                                       // Kondylenmassiv
    addBone(g,ell(AN.epiL,V3(0.7,0.9,0.9),mat),'femur',L); addBone(g,ell(AN.epiM,V3(0.7,0.9,0.9),mat),'femur',L);
  })();
  /* ---- Patella ---- */
  addBone(G.P,ell(V3(0,0,0),V3(2.2,2.4,1.0),boneMat('patella')),'patella',LAYER.thigh);
  /* ---- Tibia + Fibula, Hoffa ---- */
  (function buildTibia(){
    const g=G.T, mat=boneMat('tibia'), L=LAYER.shank;
    addBone(g,ell(AN.plateau.c,AN.plateau.r,mat),'tibia',L);
    addBone(g,staticTube([V3(0,-1.6,0.8),V3(0,-10,1.2),V3(0,-20,1.0),V3(0,-30,0.6),V3(0,-38,0.2),V3(0,-41.5,0)],[2.7,1.7,1.3,1.3,1.9,2.2],12,{material:mat,rings:26}),'tibia',L);
    addBone(g,ell(V3(0,-5.0,3.2),V3(1.0,1.3,0.6),mat),'tibia',L);                                          // Tuberositas tibiae
    addBone(g,ell(AN.MM,V3(0.9,1.6,1.1),mat),'tibia',L);                                                     // Innenknöchel
    addBone(g,staticTube([AN.fibHead,V3(3.7,-12,-1.6),V3(3.6,-25,-1.5),V3(3.5,-38,-1.1),AN.LM.clone().add(V3(0,-0.8,0))],[1.0,0.6,0.6,0.7,1.0],10,{material:mat,rings:24}),'tibia',L);   // Fibula
    const hoffa=ell(V3(0,-2.8,2.3),V3(2.0,1.3,1.1),MAT.bursa.clone()); hoffa.material.userData=Object.assign({},MAT.bursa.userData); addBone(g,hoffa,'hoffa',L);
  })();
  /* ---- Talus, Calcaneus, Fuß ---- */
  (function buildFoot(){
    const mat=boneMat('foot'), L=LAYER.shank;
    addBone(G.A,ell(V3(0,0,0),V3(1.7,1.5,2.0),mat),'foot',L);
    addBone(G.A,ell(V3(0,-0.4,2.8),V3(1.3,1.1,1.6),mat),'foot',L);                                          // Talushals/-kopf
    addBone(G.A,ell(V3(0,-0.3,-2.3),V3(1.0,0.7,0.7),mat),'foot',L);                                         // Processus posterior
    const g=G.C;
    addBone(g,ell(V3(0,-2.4,-3.2),V3(1.8,2.2,4.3),mat),'foot',L);                                           // Calcaneus
    addBone(g,ell(V3(-0.5,-3.0,3.0),V3(2.4,1.4,2.2),mat),'foot',L);                                         // Kahn-, Keil-, Würfelbein
    for(const x of [-2.6,-1.3,0,1.3,2.6]){ const len=x<-2?7.6:x<0?8.6:x<1?8.4:7.6;
      addBone(g,staticTube([V3(x,-3.6,3.8),V3(x*1.05,-4.4,3.8+len*0.6),V3(x*1.1,-4.8,3.8+len)],[0.6,0.5,0.6],7,{material:mat,rings:10}),'foot',L);
      addBone(g,staticTube([V3(x*1.1,-4.8,3.8+len),V3(x*1.15,-4.9,3.8+len+2.2),V3(x*1.2,-4.9,3.8+len+3.6)],[0.5,0.45,0.35],7,{material:mat,rings:8}),'foot',L); }
  })();
  /* ---- Boden (Weltkoordinaten): flache Platte unter dem Auflagepunkt, nur bei Bodenkontakt sichtbar ---- */
  { const gm=new THREE.Mesh(new THREE.BoxGeometry(70,0.6,70),MAT.contextSolid); gm.position.set(AN.mid,AN.groundY-0.35,4); ROOT.add(gm); (BONES.ground||(BONES.ground=[])).push(gm); gm.userData.sid='ground'; gm.userData.kind='bone'; pickables.push(gm); }
  /* ---- Anderes Bein (Kontext): gespiegelte Rahmen, Geometrie x-gespiegelt ---- */
  (function buildOther(){
    const mat=MAT.context;
    for(const k of ['F2','T2','A2','C2']) G[k].scale.x=-1;
    addBone(G.F2,new THREE.Mesh(new THREE.SphereGeometry(AN.headR,20,14),mat),'other');
    addBone(G.F2,staticTube([V3(0.3,-0.2,0),V3(5.0,-3.8,-0.5),V3(4.2,-12,0),V3(2.8,-24,0.3),V3(1.6,-34,0.2),V3(0.8,-40.5,-0.3)],[1.6,2.0,1.5,1.4,1.5,2.5],10,{material:mat,rings:22}),'other');
    addBone(G.F2,ell(V3(0,-41.5,-0.4),V3(4.2,2.3,2.6),mat),'other');
    addBone(G.T2,staticTube([V3(0,-1.6,0.8),V3(0,-20,1.0),V3(0,-41.5,0)],[2.7,1.3,2.2],10,{material:mat,rings:16}),'other');
    addBone(G.T2,ell(AN.plateau.c,AN.plateau.r,mat),'other');
    addBone(G.C2,ell(V3(0,-2.4,-3.2),V3(1.8,2.2,4.3),mat),'other');
    addBone(G.C2,ell(V3(0,-4.2,6.5),V3(3.4,1.0,7.0),mat),'other');
  })();
}
/* Render-Hooks: Zonenmarker → Metrik (5 Meniskus-Hinterhorn, 6 Tractus-Reibzone, 7 N. peroneus am Fibulakopf); Boden nur bei Bodenkontakt */
const RENDER={
  zones:{5:'menComp',6:'itbComp',7:'nerveComp'},
  afterPose(M,{BONES}){ const g=BONES.ground&&BONES.ground[0]; if(g){ const s=LAST.ground?1:0.001; g.scale.set(s,s,s); } },
};

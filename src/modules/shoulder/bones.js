/* ===================== Schulter: Knochengeometrie =====================
   Baut die Knochen je Rahmen (T Thorax, C Klavikula, S Skapula, H Humerus, F Ulna, R Radius/Hand) plus Labrum und Bursa.
   ctx kommt aus engine/render.js: G (Gruppen je Rahmen), LAYER (Render-Layer), MAT (Materialien), boneMat(id), addBone(group,mesh,id,layer),
   ell(center,radii,mat), pickables (Trefferliste), BONES (id → Meshes). Geometrie in Modellkoordinaten (cm, +X lateral, +Y kranial, +Z ventral). */
function buildBones({G,LAYER,MAT,boneMat,addBone,ell,pickables,BONES}){
/* ---- Thorax ---- */
(function buildThorax(){
  const g=G.T, mat=boneMat('thorax');
  // Rumpfhülle
  const ys=[]; for(let y=9;y>=-25;y-=1.5) ys.push(y);
  const N=48, pos=[], idx=[];
  ys.forEach((y,i)=>{ const s=thoraxSec(y); for(let j=0;j<N;j++){ const a=j/N*Math.PI*2; pos.push(AN.mid+s.rx*Math.cos(a),y,s.cz+s.rz*Math.sin(a)); } });
  for(let i=0;i<ys.length-1;i++) for(let j=0;j<N;j++){ const a=i*N+j,b=i*N+(j+1)%N,c=(i+1)*N+j,d=(i+1)*N+(j+1)%N; idx.push(a,b,c,b,d,c); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setIndex(idx); geo.computeVertexNormals();
  const shell=new THREE.Mesh(geo,MAT.thorax); shell.renderOrder=-1; addBone(g,shell,'thorax',LAYER.thorax);
  // Rippen (beidseits), nach vorn abfallend
  for(let i=0;i<10;i++){
    const yb=6-2.6*i;
    for(const side of [1,-1]){
      const pts=[]; for(let a=-95;a<=72;a+=12){ const y=yb-3.6*(a+95)/167; const s=thoraxSec(y); pts.push(V3(AN.mid+side*(s.rx+0.25)*Math.cos(a*DEG),y,s.cz+(s.rz+0.25)*Math.sin(a*DEG))); }
      const rib=staticTube(pts,0.4,7,{material:MAT.ribs,rings:24}); addBone(g,rib,'thorax',LAYER.thorax);
    }
  }
  // Sternum
  const st=new THREE.Mesh(new THREE.BoxGeometry(2.6,15,0.8),mat); st.position.set(AN.mid,-3.5,sternumFront(-3.5)-0.2); st.rotation.x=-0.08; addBone(g,st,'thorax',LAYER.thorax);
  // Wirbelsäule: Körper + Dornfortsätze
  const sp=[]; for(let y=8;y>=-26;y-=2){ sp.push(V3(AN.mid,y,spineBack(y)+2.4)); }
  const spine=staticTube(sp,1.5,10,{material:mat,rings:20}); addBone(g,spine,'thorax',LAYER.thorax);
  for(let y=6;y>=-26;y-=2.5){ const b=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.8,2.4),mat); b.position.set(AN.mid,y,spineBack(y)+1.1); b.rotation.x=0.5; addBone(g,b,'thorax',LAYER.thorax); }
  // Hals & Kopf (nur Kontext)
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.2,10,24,1,true),MAT.thorax); neck.position.set(AN.mid,13.5,-1.4); addBone(g,neck,'thorax',LAYER.thorax);
  const head=new THREE.Mesh(new THREE.SphereGeometry(8.6,24,18),MAT.thorax); head.position.set(AN.mid,25,-0.5); addBone(g,head,'thorax',LAYER.thorax);
  // Halswirbel-Dornfortsätze für Trapezius/Levator
  for(let y=8;y<=15;y+=2.3){ const b=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.9,2.0),mat); b.position.set(AN.mid,y,-7.6); addBone(g,b,'thorax',LAYER.thorax); }
})();

/* ---- Klavikula ---- */
(function(){ const pts=AN.claviclePath.map(p=>p.clone().sub(AN.SC)); const m=staticTube(pts,[0.95,0.9,0.8,0.7,0.65,0.75],10,{material:boneMat('clav'),rings:22}); addBone(G.C,m,'clav'); })();

/* ---- Skapula ---- */
(function buildScapula(){
  const mat=boneMat('scap'), g=G.S, off=AN.AC.clone().negate();
  const shape=new THREE.Shape();
  const outline=[[0.0,1.9],[-0.6,2.75],[-3.2,2.9],[-6.5,3.3],[-10.7,3.5],[-11.0,0.5],[-10.6,-4.0],[-9.8,-8.5],[-8.1,-12.5],[-5.5,-8.3],[-3.0,-4.4],[-1.0,-2.5],[0.0,-1.9],[0.15,0.0]];
  shape.moveTo(outline[0][0],outline[0][1]); for(let i=1;i<outline.length;i++) shape.lineTo(outline[i][0],outline[i][1]); shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:0.35,bevelEnabled:true,bevelThickness:0.08,bevelSize:0.08,bevelSegments:1,curveSegments:6});
  const p=geo.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setZ(i,p.getZ(i)-0.17+scw(y)); }
  const M=new THREE.Matrix4().makeBasis(AN.sU,AN.sV,AN.sN); M.setPosition(AN.sO.clone().add(off)); geo.applyMatrix4(M); geo.computeVertexNormals();
  addBone(g,new THREE.Mesh(geo,mat),'scap');
  // Spina scapulae (Grat auf der Rückseite)
  const spinePts=AN.spinePath.map(q=>q.clone().addScaledVector(AN.sN,0.55).add(off));
  const spine=staticTube(spinePts,[0.45,0.5,0.55,0.6],8,{material:mat,rings:16,up:AN.sN.clone(),aspect:2.2}); addBone(g,spine,'scap');
  // Akromion (flache Platte) und Coracoid
  const acr=staticTube(AN.acromionPath.map(q=>q.clone().add(off)),[1.0,1.15,1.25,1.25,1.0],10,{material:mat,rings:20,up:V3(0,1,0),aspect:0.36}); addBone(g,acr,'scap');
  const cor=staticTube(AN.coracoidPath.map(q=>q.clone().add(off)),[0.85,0.75,0.62,0.5],10,{material:mat,rings:14}); addBone(g,cor,'scap');
  // Glenoid (Knorpelfläche) + Labrum
  const gl=ell(AN.glenoid.c.clone().add(V3(-0.2,0,0)).add(off),V3(0.38,2.0,1.5),MAT.cart); gl.quaternion.setFromUnitVectors(V3(1,0,0),AN.glenoid.n); addBone(g,gl,'scap');
  const lab=staticTube(AN.labrumRing.map(q=>q.clone().add(off)),0.27,7,{material:new THREE.MeshStandardMaterial({color:0xd7cfe3,roughness:0.55}),rings:40}); lab.userData.sid='labrum'; lab.userData.kind='lig'; g.add(lab); pickables.push(lab); BONES.labrum=[lab];
  // Bursa subacromialis (Dicke folgt dem Raum)
  const bu=ell(AN.bursaCenter.v,V3(2.0,0.3,1.8),MAT.bursa); bu.userData.sid='bursa'; bu.userData.kind='bursa'; g.add(bu); pickables.push(bu); BONES.bursa=[bu];
})();

/* ---- Humerus ---- */
(function buildHumerus(){
  const mat=boneMat('hum'), g=G.H, L=LAYER.arm;
  addBone(g,new THREE.Mesh(new THREE.SphereGeometry(AN.headR,36,24),mat),'hum',L);
  addBone(g,ell(AN.GT.c,AN.GT.r,mat),'hum',L); addBone(g,ell(AN.LT.c,AN.LT.r,mat),'hum',L);
  const prof=[[1.55,-1.6],[1.25,-2.6],[1.12,-4],[1.05,-9],[1.05,-15],[1.0,-21],[1.15,-26],[1.45,-28.5],[1.7,-29.6],[0.9,-30.4]];
  const lathe=new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[0],q[1])),20); addBone(g,new THREE.Mesh(lathe,mat),'hum',L);
  addBone(g,ell(V3(1.15,-12.5,0.45),V3(0.55,1.9,0.55),mat),'hum',L);          // Tuberositas deltoidea
  const troch=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,4.6,16),mat); troch.rotation.z=Math.PI/2; troch.position.copy(AN.elbow); addBone(g,troch,'hum',L);
  addBone(g,ell(V3(-2.6,-29.4,-0.2),V3(0.9,0.8,0.7),mat),'hum',L); addBone(g,ell(V3(2.3,-29.4,0.1),V3(0.7,0.65,0.6),mat),'hum',L);
})();

/* ---- Ulna, Radius, Hand ---- */
(function buildForearm(){
  const mat=boneMat('fore'), L=LAYER.arm;
  const ul=staticTube([V3(-0.4,1.4,-1.9),V3(-0.5,-0.4,-0.8),V3(-0.6,-6,-0.3),V3(-0.8,-18,-0.3),V3(-0.9,-25.5,-0.3)],[0.95,1.1,0.8,0.62,0.72],10,{material:mat,rings:22}); addBone(G.F,ul,'fore',L);
  const rh=AN.radHead.clone().sub(AN.ulnaHead);   // R-lokal
  const ra=staticTube([rh,V3(rh.x-0.2,rh.y-2.2,rh.z+0.05),V3(2.0,12,0.9),V3(1.6,1.6,1.0),V3(1.5,-0.4,1.0)],[0.78,0.55,0.62,0.92,0.5],10,{material:mat,rings:22}); addBone(G.R,ra,'fore',L);
  // Hand: Handteller (Fläche zeigt nach medial), Finger, Daumen (radial = +z in Neutralstellung)
  const palm=new THREE.Mesh(new THREE.BoxGeometry(1.5,8.5,7.4),mat); palm.position.set(1.0,-5.2,0.7); addBone(G.R,palm,'fore',L);
  for(const z of [-2.1,-0.7,0.75,2.2]){ const len=z<0?(z<-2?7.2:8.2):(z<1?8.6:7.8); const f=staticTube([V3(1.0,-9.5,0.7+z),V3(1.0,-9.5-len*0.55,0.7+z*1.02),V3(1.0,-9.5-len,0.7+z*1.05)],[0.62,0.58,0.45],7,{material:mat,rings:10}); addBone(G.R,f,'fore',L); }
  const th=staticTube([V3(1.2,-3.0,3.6),V3(1.35,-5.8,5.6),V3(1.45,-8.6,6.8)],[0.85,0.7,0.5],7,{material:mat,rings:10}); addBone(G.R,th,'fore',L);
})();
}

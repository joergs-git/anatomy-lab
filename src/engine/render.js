/* ===================== Szene & Geometrie ===================== */
const canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x6b7686,0.9));
const keyLight=new THREE.DirectionalLight(0xffffff,0.75); keyLight.position.set(40,70,90); scene.add(keyLight);
const fillLight=new THREE.DirectionalLight(0xdfe8ff,0.35); fillLight.position.set(-70,10,-50); scene.add(fillLight);
const rimLight=new THREE.DirectionalLight(0xffffff,0.25); rimLight.position.set(60,-30,-60); scene.add(rimLight);

const LAYER={deltoid:1,thorax:2,arm:3,sheet:4};
/* Das Modell ist in anatomischen Koordinaten (+X lateral rechts, +Y kranial, +Z ventral) definiert – ein linkshändiges System.
   ROOT spiegelt es für die rechtshändige Darstellung (x → −x). Alle Umrechnungen Modell ↔ Darstellung laufen über toR(). */
const ROOT=new THREE.Group(); ROOT.scale.x=-1; scene.add(ROOT);
const toR=v=>V3(-v.x,v.y,v.z);
const G={T:new THREE.Group(),C:new THREE.Group(),S:new THREE.Group(),H:new THREE.Group(),F:new THREE.Group(),R:new THREE.Group()};
for(const k in G) ROOT.add(G[k]);

const MAT={
  bone:new THREE.MeshStandardMaterial({color:COL.bone,roughness:0.62,metalness:0.02}),
  thorax:new THREE.MeshStandardMaterial({color:COL.bone,roughness:0.7,transparent:true,opacity:0.28,depthWrite:false}),
  ribs:new THREE.MeshStandardMaterial({color:COL.bone,roughness:0.62,transparent:true,opacity:0.55}),
  cart:new THREE.MeshStandardMaterial({color:COL.cart,roughness:0.35}),
  bursa:new THREE.MeshStandardMaterial({color:COL.bursa,roughness:0.3,transparent:true,opacity:0.65}),
  capsule:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,transparent:true,opacity:0.82,side:THREE.DoubleSide}),
};
const BONE_MATS={};  // pro Knochen eigene Kopie (Transparenz/Highlight)
function boneMat(id){ if(!BONE_MATS[id]) BONE_MATS[id]=MAT.bone.clone(); return BONE_MATS[id]; }
const pickables=[];
function tag(mesh,sid,kind,layer){ mesh.userData.sid=sid; mesh.userData.kind=kind; if(layer) mesh.layers.set(layer); pickables.push(mesh); return mesh; }
const BONES={thorax:[],clav:[],scap:[],hum:[],fore:[]};   // id → meshes
function addBone(group,mesh,id,layer){ group.add(mesh); BONES[id].push(mesh); tag(mesh,id,'bone',layer); return mesh; }
const ell=(c,r,mat)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat); m.position.copy(c); m.scale.set(r.x,r.y,r.z); return m; };

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
      const rib=staticTube(pts,0.4,7,{material:MAT.ribs,rings:24}); rib.layers.set(LAYER.thorax); g.add(rib); BONES.thorax.push(rib); tag(rib,'thorax','bone',LAYER.thorax);
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

/* ---- Muskeln, Sehnen, Bänder, Nerven als Röhren ---- */
const FMESH={};     // fasKey → Tube
const SMAT={};      // struct id → material
const STRUCT_MESHES={}; // id → [mesh]
function structLayer(s){ return s.layer||0; }
for(const s of STRUCT){
  if(s.surface) continue;
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:s.kind==='muscle'?0.6:0.45,metalness:0.0});
  SMAT[s.id]=mat; STRUCT_MESHES[s.id]=[];
  s.fas.forEach((f,i)=>{
    const L0=REF[fasKey(s,i)]||10;
    const rings=clamp(Math.round(L0*1.3)+6,9,34), radial=s.kind==='muscle'?9:6;
    const tube=new Tube(rings,radial,mat); tube.mesh.userData.sid=s.id; tube.mesh.userData.kind=s.kind; tube.mesh.layers.set(structLayer(s));
    ROOT.add(tube.mesh); pickables.push(tube.mesh); FMESH[fasKey(s,i)]=tube; STRUCT_MESHES[s.id].push(tube.mesh);
  });
}
/* Kapsel als Fläche (24 Fasern × 9 Stützpunkte) */
const CAPS_M=9;
const capsuleMesh=(function(){
  const geo=new THREE.BufferGeometry(); const nv=CAPS_N*CAPS_M;
  const pos=new Float32Array(nv*3), col=new Float32Array(nv*3);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const idx=[]; for(let k=0;k<CAPS_N;k++){ const k2=(k+1)%CAPS_N; for(let j=0;j<CAPS_M-1;j++){ const a=k*CAPS_M+j,b=k2*CAPS_M+j,c=k*CAPS_M+j+1,d=k2*CAPS_M+j+1; idx.push(a,b,c,b,d,c); } }
  geo.setIndex(idx);
  const m=new THREE.Mesh(geo,MAT.capsule); m.userData.sid='capsule'; m.userData.kind='lig'; m.frustumCulled=false; ROOT.add(m); pickables.push(m); STRUCT_MESHES.capsule=[m]; return m;
})();

/* ---- Sichtbarkeit ---- */
const VIS={};   // id → bool
const GROUP_OPACITY={};
function allIds(){ const ids=[]; LAYER_GROUPS.forEach(g=>g.items.forEach(it=>ids.push(it[0]))); return ids; }
allIds().forEach(id=>VIS[id]=true); LAYER_GROUPS.forEach(g=>GROUP_OPACITY[g.id]=1);
function meshesOf(id){ return BONES[id]||STRUCT_MESHES[id]||[]; }
function groupOf(id){ for(const g of LAYER_GROUPS) if(g.items.some(it=>it[0]===id)) return g.id; return null; }
function applyVisibility(){
  for(const id of allIds()){
    const ms=meshesOf(id); const gop=GROUP_OPACITY[groupOf(id)];
    for(const m of ms){ m.visible=!!VIS[id];
      const mat=m.material; const base=(id==='thorax'&&(mat===MAT.thorax||mat===MAT.ribs))?mat.opacity:(id==='bursa'?0.65:id==='capsule'?0.82:1);
      if(mat===MAT.thorax||mat===MAT.ribs) continue;
      const op=base*gop; mat.opacity=op; mat.transparent=op<0.999||id==='bursa'||id==='capsule'; mat.depthWrite=op>0.5; }
  }
  needsRender=true;
}

/* ---- Kameras & Ansichten ---- */
const mainView=document.getElementById('mainView');
const mainCam=new THREE.PerspectiveCamera(34,1,1,600); mainCam.layers.enableAll();
const ORBIT0={tx:6,ty:-8,tz:0,theta:-32,phi:74,dist:112};   // Standardkamera (Grad / cm), Bezug für geteilte Links
const orbit={target:V3(ORBIT0.tx,ORBIT0.ty,ORBIT0.tz),theta:ORBIT0.theta*DEG,phi:ORBIT0.phi*DEG,dist:ORBIT0.dist};   // Darstellungskoordinaten
function updateMainCam(){ const o=orbit; const sp=Math.sin(o.phi); mainCam.position.set(o.target.x+o.dist*sp*Math.sin(o.theta),o.target.y+o.dist*Math.cos(o.phi),o.target.z+o.dist*sp*Math.cos(o.theta)); mainCam.lookAt(o.target); }
updateMainCam();
const VIEWS={front:{theta:-12,phi:78},side:{theta:-92,phi:78},back:{theta:-186,phi:78},top:{theta:-35,phi:14}};
function setView(name){ const v=VIEWS[name]; if(!v) return; animateOrbit(v.theta*DEG,v.phi*DEG); }
let orbitAnim=null;
function animateOrbit(theta,phi){ orbitAnim={t0:performance.now(),dur:600,th0:orbit.theta,ph0:orbit.phi,th1:theta,ph1:phi}; needsRender=true; }

const detailDefs=[
  {id:'dv1',fov:26,level:2,
   fit(fr){ const t=worldPt(fr,AN.bursaCenter).add(V3(0.3,-0.8,0)); const d=V3(0.95,0.5,0.8).normalize(); return {t,pos:t.clone().addScaledVector(d,16)}; }},
  {id:'dv2',fov:26,level:4,clipX:0.55,
   fit(fr){ const t=fr.H.p.clone().add(V3(-1.2,0,0)); const d=V3(1,0.28,0.32).normalize(); return {t,pos:t.clone().addScaledVector(d,14)}; }},
  {id:'dv3',fov:26,level:2,
   fit(fr){ const t=worldPt(fr,AN.grooveLm).add(V3(-0.5,-1.0,0)); const d=V3(0.45,0.55,0.75).normalize(); return {t,pos:t.clone().addScaledVector(d,15)}; }},
  {id:'dv4',fov:28,level:0,
   fit(fr){ const t=worldPt(fr,L('S',sc(-6,-4,0))).add(V3(-3,2,0)); const d=V3(-0.12,0.18,-1).normalize(); return {t,pos:t.clone().addScaledVector(d,52)}; }},
];
const viewports=[{el:mainView,cam:mainCam,main:true}];
/* Schichtstufen der Detailansichten (von außen nach innen abtragen) */
const PEEL=[{ids:[],key:'peel0'},{ids:['thorax','deltA','deltM','deltP'],key:'peel1'},{ids:['pecM','pecMin','lat','trapU','trapM','trapL','rhomb','lev','serr','tmaj'],key:'peel2'},{ids:['bicSH','corbr','triLH','nAx','nSS'],key:'peel3'},{ids:['supra','infra','tmin','subsc'],key:'peel4'},{ids:['bicLH','bursa','CHL','GHL','CAL','ACCC'],key:'peel5'},{ids:['capsule','labrum'],key:'peel6'}];
PEEL.forEach(p=>Object.defineProperty(p,'name',{get(){ return t(p.key); }}));
const PEEL_CACHE=[]; function peelIds(level){ if(!PEEL_CACHE[level]){ const s=[]; for(let i=1;i<=level;i++) s.push(...PEEL[i].ids); PEEL_CACHE[level]=s; } return PEEL_CACHE[level]; }
for(const d of detailDefs){ const el=document.getElementById(d.id); const cam=new THREE.PerspectiveCamera(d.fov,1,1,400); cam.layers.enableAll();
  const c2d=document.createElement('canvas'); c2d.className='dvc'; el.insertBefore(c2d,el.firstChild); d.c2d=c2d; d.ctx2=c2d.getContext('2d');
  const clip=d.clipX!==undefined?[new THREE.Plane(V3(1,0,0),0)]:null; /* Darstellung: x_R < −x0 weggeschnitten ⇔ Modell x > x0 */ viewports.push({el,cam,def:d,clip}); }
function fitDetailCams(){ for(const vp of viewports){ if(!vp.def) continue; const f=vp.def.fit(frames); vp.cam.position.copy(toR(f.pos)); vp.cam.up.set(0,1,0); vp.cam.lookAt(toR(f.t)); if(vp.clip){ vp.clip[0].constant=frames.H.p.x+vp.def.clipX; } } }

/* ---- Pose anwenden ---- */
let needsRender=true;
const _cols=[];
function applyPose(){
  clampPose(pose);
  const rh=solvePose(pose,frames);
  for(const k in G){ G[k].position.copy(frames[k].p); G[k].quaternion.copy(frames[k].q); }
  const ev=evaluate(frames); const M=ev.metrics;
  const showStrain=UI.strain;
  for(const s of STRUCT){
    if(s.surface) continue;
    const full=s.kind==='muscle'?0.45:0.12;
    const base=s.kind==='muscle'?COL.muscle:s.kind==='nerve'?COL.nerve:COL.lig;
    const tendonR=s.kind==='muscle'?0.3:s.r;
    s.fas.forEach((f,i)=>{
      const k=fasKey(s,i); const e=ev.fas[k]; const tube=FMESH[k];
      const res=resamplePath(e.items,tube.rings);
      const n=res.length; const centers=[]; _cols.length=0;
      for(let j=0;j<n;j++){ const r=res[j]; const sN=j/(n-1);
        let rad=s.kind==='muscle'?tendonR+(s.r-tendonR)*r.w*(0.22+0.78*Math.pow(Math.sin(Math.PI*sN),0.7)):s.r;
        centers.push({p:r.p,r:rad});
        let bcol=base; if(s.kind==='muscle'){ bcol=_c2.copy(COL.tendon).lerp(COL.muscle,clamp(r.w,0,1)); }
        let comp=0; const z=Math.round(r.z);
        if(z===1) comp=M.bursaComp; else if(z===2) comp=M.corComp; else if(z===3) comp=M.grooveComp; else if(z===4) comp=M.psComp;
        if(r.z>0&&r.z<1) comp*=r.z;
        _cols.push(showStrain?strainColor(bcol,e.strain,full,comp):[bcol.r,bcol.g,bcol.b]);
      }
      tube.update(centers,_cols,null);
    });
  }
  // Kapsel
  { const pos=capsuleMesh.geometry.attributes.position, col=capsuleMesh.geometry.attributes.color;
    for(let k=0;k<CAPS_N;k++){ const e=ev.fas['capsule#'+k]; const res=resamplePath(e.items,CAPS_M);
      const c=showStrain?strainColor(COL.lig,e.strain,0.12,0):[COL.lig.r,COL.lig.g,COL.lig.b];
      for(let j=0;j<CAPS_M;j++){ const v=(k*CAPS_M+j); pos.setXYZ(v,res[j].p.x,res[j].p.y,res[j].p.z); col.setXYZ(v,c[0],c[1],c[2]); } }
    pos.needsUpdate=true; col.needsUpdate=true; capsuleMesh.geometry.computeVertexNormals(); capsuleMesh.geometry.computeBoundingSphere(); }
  // Bursa: Dicke & Farbe
  { const bu=BONES.bursa[0]; const gap=clamp(M.ahd,0.15,1.2); bu.scale.y=0.12+0.22*gap; _c1.copy(COL.bursa).lerp(COL.violet,M.bursaComp*0.85); bu.material.color.copy(_c1); }
  fitDetailCams();
  needsRender=true;
  return {rh,ev};
}
function setPose(p){ Object.assign(pose,p); const r=applyPose(); onPoseChanged(r); }

/* ---- Rendering ---- */
function sceneBg(){ const v=getComputedStyle(document.documentElement).getPropertyValue('--scene').trim(); scene.background=new THREE.Color(v||'#d9dfe7'); }
sceneBg();
let narrowAdj=false;
function resize(){ const w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h,false); const nr=mainView.getBoundingClientRect(); const narrow=nr.width<nr.height*0.9; if(narrow!==narrowAdj){ orbit.dist*=narrow?1.35:1/1.35; narrowAdj=narrow; updateMainCam(); } needsRender=true; }
window.addEventListener('resize',resize); resize();
function renderAll(){
  const H=window.innerHeight;
  renderer.setScissorTest(false); renderer.clippingPlanes=[]; renderer.clear();
  renderer.setScissorTest(true);
  const W=window.innerWidth, dpr=renderer.getPixelRatio();
  for(const vp of viewports){
    const r=vp.el.getBoundingClientRect(); if(r.width<4||r.height<4) continue;
    if(!vp.def&&(r.bottom<0||r.top>H)) continue;
    if(vp.def&&(r.bottom<-20||r.top>H+20)) continue;   // Detailfenster außerhalb: nicht aktualisieren
    const w=Math.round(Math.min(r.width,W)), h=Math.round(Math.min(r.height,H));
    // Detailfenster werden an einer sicher sichtbaren Stelle gerendert und dann in ihr 2D-Canvas kopiert (Panels sind deckend)
    const left=vp.def?Math.round(clamp(r.left,0,W-w)):Math.round(r.left), top=vp.def?Math.round(clamp(r.top,0,H-h)):Math.round(r.top);
    const bottom=H-(top+h);
    renderer.setViewport(left,bottom,w,h); renderer.setScissor(left,bottom,w,h);
    vp.cam.aspect=w/h; vp.cam.updateProjectionMatrix();
    renderer.clippingPlanes=vp.clip||[];
    const peel=vp.def&&vp.def.level>0?peelIds(vp.def.level):null;
    if(peel) for(const id of peel) for(const m of meshesOf(id)) m.visible=false;
    renderer.render(scene,vp.cam);
    if(peel) for(const id of peel){ const v=!!VIS[id]; for(const m of meshesOf(id)) m.visible=v; }
    if(vp.def){ const c=vp.def.c2d, sw=Math.round(w*dpr), sh=Math.round(h*dpr); if(c.width!==sw||c.height!==sh){ c.width=sw; c.height=sh; }
      vp.def.ctx2.drawImage(canvas,Math.round(left*dpr),Math.round(top*dpr),sw,sh,0,0,sw,sh); }
  }
  renderer.clippingPlanes=[];
}
ROOT.traverse(o=>{ if(o.isMesh) o.frustumCulled=false; });

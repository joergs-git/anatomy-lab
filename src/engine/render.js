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
/* Eine Gruppe je Rahmen der Modul-Rahmenkette (frames aus kinematics.js) */
const G={}; for(const k in frames) G[k]=new THREE.Group();
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
const BONES={};   // id → meshes (Knochen, Labrum, Bursa – gefüllt vom Modul über addBone bzw. direkt)
function addBone(group,mesh,id,layer){ group.add(mesh); (BONES[id]||(BONES[id]=[])).push(mesh); tag(mesh,id,'bone',layer); return mesh; }
const ell=(c,r,mat)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat); m.position.copy(c); m.scale.set(r.x,r.y,r.z); return m; };

/* ---- Knochen: Geometrie kommt aus dem Modul (modules/shoulder/bones.js) ---- */
buildBones({G,LAYER,MAT,boneMat,addBone,ell,pickables,BONES});

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
/* ORBIT0 (Standardkamera) und VIEWS (Ansichts-Schalter) definiert das Modul (views.js) */
const orbit={target:V3(ORBIT0.tx,ORBIT0.ty,ORBIT0.tz),theta:ORBIT0.theta*DEG,phi:ORBIT0.phi*DEG,dist:ORBIT0.dist};   // Darstellungskoordinaten
function updateMainCam(){ const o=orbit; const sp=Math.sin(o.phi); mainCam.position.set(o.target.x+o.dist*sp*Math.sin(o.theta),o.target.y+o.dist*Math.cos(o.phi),o.target.z+o.dist*sp*Math.cos(o.theta)); mainCam.lookAt(o.target); }
updateMainCam();
function setView(name){ const v=VIEWS[name]; if(!v) return; animateOrbit(v.theta*DEG,v.phi*DEG); }
let orbitAnim=null;
function animateOrbit(theta,phi){ orbitAnim={t0:performance.now(),dur:600,th0:orbit.theta,ph0:orbit.phi,th1:theta,ph1:phi}; needsRender=true; }

/* detailDefs (Detailfenster) und PEEL (Schichtstufen) definiert das Modul (views.js) */
const viewports=[{el:mainView,cam:mainCam,main:true}];
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

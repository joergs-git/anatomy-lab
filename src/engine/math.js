/* ===================== Mathe-Hilfen ===================== */
const V3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const DEG = Math.PI/180;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const smooth = t=>t*t*(3-2*t);
let NUM_LOCALE='de-DE';
const fmt = (v,d=0)=>v.toLocaleString(NUM_LOCALE,{minimumFractionDigits:d,maximumFractionDigits:d});
const qAxis = (axis,deg)=>new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(),deg*DEG);
const qMul = (...qs)=>qs.reduce((a,b)=>a.multiply(b),new THREE.Quaternion());

/* Kürzester Weg um eine Kugel (Muskel-/Sehnen-Wrapping, Garner & Pandy).
   Liefert Zwischenpunkte auf dem Bogen oder null, wenn die Strecke A-B die Kugel nicht schneidet. */
function wrapSphere(A,B,C,r){
  const a=A.clone().sub(C), b=B.clone().sub(C);
  const la=a.length(), lb=b.length();
  if(la<=r*1.001||lb<=r*1.001) return null;
  const ab=B.clone().sub(A); const L2=ab.lengthSq(); if(L2<1e-9) return null;
  const t=clamp(-a.dot(ab)/L2,0,1);
  const closest=A.clone().addScaledVector(ab,t);
  if(closest.distanceTo(C)>=r) return null;
  const e1=a.clone().normalize();
  let e2=b.clone().sub(e1.clone().multiplyScalar(b.dot(e1)));
  if(e2.lengthSq()<1e-8){ e2=V3(0,1,0).cross(e1); if(e2.lengthSq()<1e-6) e2=V3(1,0,0).cross(e1); }
  e2.normalize();
  const thB=Math.atan2(b.dot(e2),b.dot(e1));
  const phA=Math.acos(clamp(r/la,-1,1)), phB=Math.acos(clamp(r/lb,-1,1));
  const s=phA, e=thB-phB;
  if(e<=s+1e-4) return null;
  const n=Math.max(2,Math.ceil((e-s)/(10*DEG)));
  const pts=[];
  for(let i=0;i<=n;i++){ const ang=s+(e-s)*i/n; pts.push(C.clone().addScaledVector(e1,r*Math.cos(ang)).addScaledVector(e2,r*Math.sin(ang))); }
  return pts;
}

/* Pfad (Punkte mit Radius/Typ) um Kugeln wickeln. items: [{p:Vector3, r:number, w:number(0 Sehne..1 Bauch)}] */
function wrapPath(items,spheres){
  if(!spheres||!spheres.length) return items;
  let out=[items[0]];
  for(let i=1;i<items.length;i++){
    const A=out[out.length-1], B=items[i];
    let inserted=null;
    for(const s of spheres){
      const arc=wrapSphere(A.p,B.p,s.c,s.r);
      if(arc){ inserted=arc; break; }
    }
    if(inserted){
      const n=inserted.length;
      for(let k=0;k<n;k++){ const t=(k+1)/(n+1); out.push({p:inserted[k],r:lerp(A.r,B.r,t),w:lerp(A.w,B.w,t),z:lerp(A.z||0,B.z||0,t)}); }
    }
    out.push(B);
  }
  return out;
}

function pathLength(items){ let L=0; for(let i=1;i<items.length;i++) L+=items[i].p.distanceTo(items[i-1].p); return L; }

/* Gleichmäßige Neuabtastung entlang der Bogenlänge → n Punkte (Position, Radius, Bauch-Gewicht, Zone) */
function resamplePath(items,n){
  const cum=[0]; for(let i=1;i<items.length;i++) cum.push(cum[i-1]+items[i].p.distanceTo(items[i-1].p));
  const L=cum[cum.length-1]||1e-6;
  const res=[]; let j=0;
  for(let k=0;k<n;k++){
    const s=L*k/(n-1);
    while(j<cum.length-2&&cum[j+1]<s) j++;
    const seg=(cum[j+1]-cum[j])||1e-9; const t=clamp((s-cum[j])/seg,0,1);
    const A=items[j],B=items[j+1];
    res.push({p:A.p.clone().lerp(B.p,t),r:lerp(A.r,B.r,smooth(t)),w:lerp(A.w,B.w,t),z:lerp(A.z||0,B.z||0,t)});
  }
  return res;
}

/* Röhren-Geometrie mit fester Vertexzahl: rings × radial. Radien pro Ring, Farbe pro Ring. */
class Tube{
  constructor(rings,radial,material){
    this.rings=rings; this.radial=radial;
    const nv=rings*radial;
    const g=new THREE.BufferGeometry();
    this.pos=new Float32Array(nv*3); this.nor=new Float32Array(nv*3); this.col=new Float32Array(nv*3);
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));
    g.setAttribute('normal',new THREE.BufferAttribute(this.nor,3));
    g.setAttribute('color',new THREE.BufferAttribute(this.col,3));
    const idx=[];
    for(let i=0;i<rings-1;i++) for(let j=0;j<radial;j++){
      const a=i*radial+j, b=i*radial+(j+1)%radial, c=(i+1)*radial+j, d=(i+1)*radial+(j+1)%radial;
      idx.push(a,c,b, b,c,d);
    }
    g.setIndex(idx);
    this.geom=g; this.mesh=new THREE.Mesh(g,material);
    this.mesh.frustumCulled=false;
    this._n=V3(); this._b=V3(); this._t=V3(); this._tmp=V3();
  }
  /* centers: [{p,r}], colors: [[r,g,b]] pro Ring, ry optional (elliptisch) */
  update(centers,colors,flat){
    const R=this.radial, n=this.rings;
    const t=this._t, nrm=this._n, bin=this._b;
    // erste Normale
    t.subVectors(centers[1].p,centers[0].p).normalize();
    const up=flat?flat.clone():V3(0,1,0);
    nrm.crossVectors(t,up); if(nrm.lengthSq()<1e-6) nrm.crossVectors(t,V3(1,0,0));
    nrm.normalize(); bin.crossVectors(t,nrm).normalize();
    for(let i=0;i<n;i++){
      const c=centers[i];
      if(i>0){
        if(i<n-1) t.subVectors(centers[i+1].p,centers[i-1].p).normalize(); else t.subVectors(centers[i].p,centers[i-1].p).normalize();
        if(flat){ nrm.crossVectors(t,up).normalize(); }
        else { nrm.addScaledVector(t,-t.dot(nrm)); if(nrm.lengthSq()<1e-8) nrm.crossVectors(t,V3(0,1,0)); nrm.normalize(); }
        bin.crossVectors(t,nrm).normalize();
      }
      let r=c.r; if(i===0||i===n-1) r=Math.min(r,0.22);
      const rb=flat?r*flat.aspect:r; // bei "flat": Radius entlang up gestaucht
      const col=colors[i];
      for(let j=0;j<R;j++){
        const ang=j/R*Math.PI*2, ca=Math.cos(ang), sa=Math.sin(ang);
        const k=(i*R+j)*3;
        // Ring: Breite entlang nrm (ca), Höhe entlang bin (sa)
        this.pos[k]=c.p.x+nrm.x*ca*r+bin.x*sa*rb; this.pos[k+1]=c.p.y+nrm.y*ca*r+bin.y*sa*rb; this.pos[k+2]=c.p.z+nrm.z*ca*r+bin.z*sa*rb;
        this.nor[k]=nrm.x*ca+bin.x*sa; this.nor[k+1]=nrm.y*ca+bin.y*sa; this.nor[k+2]=nrm.z*ca+bin.z*sa;
        this.col[k]=col[0]; this.col[k+1]=col[1]; this.col[k+2]=col[2];
      }
    }
    this.geom.attributes.position.needsUpdate=true; this.geom.attributes.normal.needsUpdate=true; this.geom.attributes.color.needsUpdate=true;
    this.geom.computeBoundingSphere();
  }
}

/* Statische Röhre für Knochen (einmalig gebaut), optional elliptisch (aspect) und mit Radiusverlauf */
function staticTube(points,radii,radial,opts={}){
  const n=points.length;
  const items=points.map((p,i)=>({p:p.clone(),r:Array.isArray(radii)?radii[i]:radii,w:1}));
  const rs=opts.rings||Math.max(8,n*4);
  const res=resamplePath(items,rs);
  const tube=new Tube(rs,radial,opts.material);
  const cols=[]; for(let i=0;i<rs;i++) cols.push([1,1,1]);
  if(opts.up){ const up=opts.up.clone(); up.aspect=opts.aspect||1; tube.update(res,cols,up); }
  else tube.update(res,cols,null);
  tube.mesh.geometry.computeVertexNormals();
  return tube.mesh;
}

/* Farben */
const COL={
  bone:new THREE.Color(0xe9dfcf), cart:new THREE.Color(0xd6e8f0), muscle:new THREE.Color(0xb5766a), tendon:new THREE.Color(0xefe7dc),
  lig:new THREE.Color(0xd9d0e6), nerve:new THREE.Color(0xf4d35e), bursa:new THREE.Color(0x8fd3ff),
  red:new THREE.Color(0xe0453f), green:new THREE.Color(0x2fb56b), violet:new THREE.Color(0x9b5cf6), amber:new THREE.Color(0xf0b429)
};
const _c1=new THREE.Color(), _c2=new THREE.Color();
/* Dehnungsfarbe: strain>0 rot, <0 grün; full = Sättigungsgrenze */
function strainColor(base,strain,full,compress){
  _c1.copy(base);
  if(strain!==null&&strain!==undefined){
    const k=clamp(Math.abs(strain)/full,0,1)*0.9;
    _c1.lerp(strain>0?COL.red:COL.green,k);
  }
  if(compress>0) _c1.lerp(COL.violet,clamp(compress,0,1)*0.85);
  return [_c1.r,_c1.g,_c1.b];
}

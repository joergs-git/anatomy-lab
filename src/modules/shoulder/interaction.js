/* ===================== Schulter: 3D-Beschriftungen und Ziehen am Arm =====================
   LABELS: Knochen-Landmarken (key → i18n) und je eine Beschriftung pro Struktur (Mitte des ersten Faszikels).
   DRAG: welche Teile greifbar sind, an welchem Rahmen Strukturen hängen, welche Pose-Achsen der Rotationsmodus steuert
   und wie ein Griffpunkt-Versatz (Modellkoordinaten) in eine neue Pose übersetzt wird. */
const LABELS=[
 {id:'scap',key:'lbAcr',lm:L('S',AN.acromionPath[3].clone().add(V3(0,0.5,0)))},{id:'scap',key:'lbCor',lm:L('S',AN.coracoidTip.clone().add(V3(0,0.4,0.4)))},
 {id:'clav',key:'nameClav',lm:L('C',V3(-9.5,5.4,6.0))},{id:'hum',key:'lbGT',lm:L('H',AN.GT.c.clone().add(V3(0.8,0.8,0)))},{id:'hum',key:'lbLT',lm:L('H',AN.LT.c.clone().add(V3(0,0.6,0.8)))},
 {id:'scap',key:'lbGlen',lm:L('S',AN.glenoid.c.clone().add(V3(0,-2.4,0)))},{id:'scap',key:'nameScap',lm:L('S',sc(-8,-6,0.8))},{id:'hum',key:'nameHum',lm:L('H',V3(1.5,-18,0))},
 {id:'fore',key:'lbRad',lm:L('R',V3(2.2,12,1.0))},{id:'fore',key:'lbUlna',lm:L('F',V3(-1.2,-12,-0.4))},{id:'thorax',key:'lbC7',lm:L('T',V3(AN.mid,6.5,spineBack(6)-0.5))},{id:'thorax',key:'lbStern',lm:L('T',V3(AN.mid,-2,sternumFront(-2)+0.5))},
];
STRUCT.forEach(s=>{ if(!s.surface) LABELS.push({id:s.id,struct:s}); });
LABELS.push({id:'capsule',key:'lbCaps',lm:L('S',AN.glenoid.c.clone().add(V3(1.3,-2.6,0.2)))},{id:'bursa',key:'lbBursa',lm:AN.bursaCenter},{id:'labrum',key:'lbLab',lm:L('S',AN.glenoid.c.clone().add(V3(0,2.4,0)))});

/* Greifbare Teile: Humerus, Unterarm/Hand und alle Strukturen mit Ansatz am Arm, dazu die Kapsel */
const ARM_IDS=new Set(['hum','fore']); STRUCT.forEach(s=>{ if(!s.surface&&s.fas.some(f=>f.some(lm=>lm.f==='H'||lm.f==='F'||lm.f==='R'))) ARM_IDS.add(s.id); }); ARM_IDS.add('capsule');
const DRAG={
  ids:ARM_IDS,
  frame:'H',                 /* Rahmen für Strukturen ohne eigenen Knochen-Rahmen (Röhren hängen an ROOT) */
  rot:{x:'IR',y:'elbow'},    /* Rotationsmodus: horizontal → Innen-/Außenrotation, vertikal → Ellbogen */
  /* Griffpunkt p0 → Zielpunkt p1 (Modellkoordinaten): Drehung um das Humeruskopfzentrum, daraus Ebene und Elevation */
  pose(p0,p1,fr){
    const GH=fr.H.p; const v0=p0.clone().sub(GH), v1=p1.clone().sub(GH); if(v0.length()<3||v1.length()<3) return null;
    const q=new THREE.Quaternion().setFromUnitVectors(v0.normalize(),v1.normalize());
    const qH=q.multiply(fr.H.q); const d=V3(0,-1,0).applyQuaternion(qH);
    const P=Math.atan2(d.z,d.x)/DEG, E=Math.acos(clamp(-d.y,-1,1))/DEG;
    return {P:clamp(P,-90,150),E};
  },
};

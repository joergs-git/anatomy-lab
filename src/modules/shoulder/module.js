/* ===================== Schulter: Schnittstelle zur Engine =====================
   Letzte Datei des Moduls. Sammelt alles, was die Engine braucht, im Objekt MODULE – das ist der Rückgabewert der Modul-Fabrik
   (siehe build.mjs) und wird in engine/boot.js aufgelöst. Die Engine kennt kein Gelenk beim Namen: Regler, Link-Codes,
   Metriken, Detailfenster, Texte und Interaktion kommen von hier. Zielbild in docs/HANDOVER.md §9. */

/* Pose-Regler in Anzeigereihenfolge. key = Feld in pose, url = lesbarer Link-Schlüssel, code = Kennbuchstabe im Kurz-Link
   (Großbuchstabe, darf nicht mit den Engine-Buchstaben kollidieren – siehe engine/share.js), label/ends = i18n-Schlüssel,
   text(ps) = Wertetext neben dem Regler, range(ps) = dynamische Grenzen aus den Bewegungsgrenzen. */
const POSE_PARAMS=[
 {key:'E',url:'E',code:'E',min:0,max:180,step:1,def:0,label:'lElev',ends:['eHang','eOver'],text:ps=>fmt(ps.E)+'°',range:ps=>({max:Emax(ps.P)})},
 {key:'P',url:'P',code:'P',min:-90,max:150,step:1,def:0,label:'lPlane',ends:['ePlaneL','ePlaneR'],text:ps=>fmt(ps.P)+'° · '+planeLabel(ps.P)},
 {key:'IR',url:'rot',code:'R',min:-110,max:110,step:1,def:0,label:'lRot',ends:['eER','eIR'],text:ps=>(ps.IR<0?t('ER'):t('IR'))+' '+fmt(Math.abs(ps.IR))+'°',
  range:ps=>{ const rl=rotLimits(ps.E,ps.P); return {min:-rl.ER,max:rl.IR}; }},
 {key:'elbow',url:'elbow',code:'B',min:0,max:145,step:1,def:0,label:'lElbow',ends:['eExt','eFlex'],text:ps=>fmt(ps.elbow)+'°'},
 {key:'pro',url:'pro',code:'F',min:-85,max:80,step:1,def:0,label:'lPro',ends:['eSup','ePro'],text:ps=>Math.abs(ps.pro)<3?t('neutralS'):(ps.pro<0?t('sup'):t('pro'))+' '+fmt(Math.abs(ps.pro))+'°'},
];
/* Pathologie-Regler. Zustand in patho (migr in mm, gird/frozen 0…1); Regler und lesbarer Link in Anzeigeeinheit (sliderScale/urlScale),
   Kurz-Link als ganze Zahl (compactScale): M30 = 3,0 mm, G50 = 50 %. */
const PATHO_PARAMS=[
 {key:'migr',url:'migr',code:'M',min:0,max:6,step:0.5,sliderScale:1,urlScale:1,compactScale:10,label:'lMigr',text:v=>fmt(v,1)+' mm'},
 {key:'gird',url:'gird',code:'G',min:0,max:100,step:5,sliderScale:100,urlScale:100,compactScale:100,label:'lGird',text:v=>fmt(v*100)+' %'},
 {key:'frozen',url:'frozen',code:'Z',min:0,max:100,step:5,sliderScale:100,urlScale:100,compactScale:100,label:'lFrozen',text:v=>fmt(v*100)+' %'},
];

const MODULE={
  i18n:I18N_MOD,
  names:{struct:STRUCT_EN,group:GROUP_EN,layer:LAYER_EN,preset:PRESET_EN,load:LOAD_EN,metric:METRIC_EN,info:INFO_EN},
  /* Zustand und Rahmenkette */
  pose,patho,frames,poseParams:POSE_PARAMS,pathoParams:PATHO_PARAMS,
  intro:{P:30,E:70,IR:0,elbow:0,pro:0},          /* Startanimation: leicht angehobener Arm zeigt Farbcodierung und Rhythmus */
  /* Anatomie und Kinematik */
  anatomy:{AN,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,INFO,LABELS},
  kinematics:{worldPt,solvePose,clampPose,evaluate,EVAL,EXT,REF,fasKey},
  /* Presets (RUN_LIST-Reihenfolge stabil) */
  presets:PRESETS,anims:ANIMS,physio:PHYSIO,
  /* Darstellung */
  buildBones,render:RENDER,
  camera:{orbit0:ORBIT0,views:VIEWS},detailViews:detailDefs,peel:PEEL,
  /* Monitor und Strukturliste */
  metrics:METRICS,monitor:MONITOR,loadGroups:LOAD_GROUPS,computeLoads,structReadouts,boneNameKeys:BONE_NAME_KEYS,layerPresets:LAYER_PRESETS,
  /* Texte im 3D-Fenster und im Bewegungsblock */
  hud:{mini:hudMiniText,body:hudBodyHTML,summary:poseSummaryText},
  readout:{sum:'scapSum',note:'scapNote',html:scapReadoutHTML},readout0:READOUT0,
  /* Ziehen am Körperteil */
  drag:DRAG,
};

/* ===================== Bein: Schnittstelle zur Engine =====================
   Letzte Datei des Moduls; MODULE ist der Rückgabewert der Modul-Fabrik (build.mjs) und wird in engine/boot.js aufgelöst.
   Kurz-Link-Buchstaben: Engine reserviert N A W S Q H V O L C I X T U D K Y J m k g x; hier F B R E P M G Z w b (Pose) und c a (Pathologie). */
const POSE_PARAMS=[
 {key:'hipF',url:'hipF',code:'F',min:-20,max:130,step:1,def:0,label:'lHipF',ends:['eHipExt','eHipFlex'],
  text:ps=>fmt(ps.hipF)+'°'+(ps.ground>=0.5&&Math.abs(LAST.lean)>=1?' · '+t('hipS')+' '+fmt(ps.hipF+LAST.lean)+'°':''),range:ps=>({max:limits(ps).hipF[1]})},
 {key:'hipA',url:'hipA',code:'B',min:-30,max:45,step:1,def:0,label:'lHipA',ends:['eAdd','eAbd'],text:ps=>Math.abs(ps.hipA)<1?t('neutralS'):(ps.hipA<0?t('add'):t('abd'))+' '+fmt(Math.abs(ps.hipA))+'°'},
 {key:'hipR',url:'hipR',code:'R',min:-45,max:45,step:1,def:0,label:'lHipR',ends:['eER','eIR'],text:ps=>Math.abs(ps.hipR)<1?t('neutralS'):(ps.hipR<0?t('ER'):t('IR'))+' '+fmt(Math.abs(ps.hipR))+'°'},
 {key:'knee',url:'knee',code:'E',min:0,max:140,step:1,def:0,label:'lKnee',ends:['eExt','eFlex'],text:ps=>fmt(ps.knee)+'°'},
 {key:'tibR',url:'tibR',code:'P',min:-20,max:20,step:1,def:0,label:'lTibR',ends:['eER','eIR'],text:ps=>Math.abs(ps.tibR)<1?t('neutralS'):(ps.tibR<0?t('ER'):t('IR'))+' '+fmt(Math.abs(ps.tibR))+'°',range:ps=>{ const l=limits(ps).tibR; return {min:l[0],max:l[1]}; }},
 {key:'valg',url:'valg',code:'M',min:-15,max:15,step:1,def:0,label:'lValg',ends:['eVarus','eValgus'],text:ps=>Math.abs(ps.valg)<1?t('neutralS'):(ps.valg<0?t('varus'):t('valgus'))+' '+fmt(Math.abs(ps.valg))+'°',range:ps=>{ const l=limits(ps).valg; return {min:l[0],max:l[1]}; }},
 {key:'ankle',url:'ankle',code:'G',min:-45,max:42,step:1,def:0,label:'lAnkle',ends:['ePlantar','eDorsi'],text:ps=>Math.abs(ps.ankle)<1?t('neutralS'):(ps.ankle<0?t('plantar'):t('dorsi'))+' '+fmt(Math.abs(ps.ankle))+'°',range:ps=>({max:limits(ps).ankle[1]})},
 {key:'sub',url:'sub',code:'Z',min:-15,max:30,step:1,def:0,label:'lSub',ends:['eEver','eInv'],text:ps=>Math.abs(ps.sub)<1?t('neutralS'):(ps.sub<0?t('ev'):t('inv'))+' '+fmt(Math.abs(ps.sub))+'°'},
 {key:'wt',url:'wt',code:'w',min:0,max:100,step:5,def:50,label:'lWt',ends:['eWt0','eWt1'],text:ps=>fmt(ps.wt)+' % · '+fmt(ps.wt/100*BW)+' N'},
 {key:'ground',url:'ground',code:'b',type:'check',min:0,max:1,step:1,def:1,label:'lGround',ends:[],text:ps=>ps.ground>=0.5?t('groundOn'):t('groundOff')},
 /* nur anhängen (Reihenfolge = Regler) */
 {key:'tilt',url:'tilt',code:'t',min:-20,max:25,step:1,def:0,label:'lTilt',ends:['eTiltPost','eTiltAnt'],text:ps=>Math.abs(ps.tilt)<1?t('neutralS'):(ps.tilt<0?t('tiltPost'):t('tiltAnt'))+' '+fmt(Math.abs(ps.tilt))+'°'},
 {key:'other',url:'other',code:'o',type:'seg',min:0,max:4,step:1,def:0,label:'lOther',ends:[],options:[[0,'otAuto'],[1,'otMirror'],[2,'otLift'],[3,'otRear'],[4,'otFront']],text:ps=>t(['otAuto','otMirror','otLift','otRear','otFront'][Math.round(ps.other)]||'otAuto')+(ps.other<0.5?' → '+t(otherMode(ps)===2?'otLift':'otMirror'):'')},
];
const PATHO_PARAMS=[
 {key:'cart',url:'cart',code:'c',min:0,max:100,step:5,sliderScale:100,urlScale:100,compactScale:100,label:'lCart',text:v=>fmt(v*100)+' %'},
 {key:'acl',url:'acl',code:'a',min:0,max:100,step:5,sliderScale:100,urlScale:100,compactScale:100,label:'lAcl',text:v=>fmt(v*100)+' %'},
];

const MODULE={
  i18n:I18N_MOD,
  names:{struct:STRUCT_EN,group:GROUP_EN,layer:LAYER_EN,preset:PRESET_EN,load:LOAD_EN,metric:METRIC_EN,info:INFO_EN},
  pose,patho,frames,poseParams:POSE_PARAMS,pathoParams:PATHO_PARAMS,
  intro:{hipF:23,knee:35,ankle:12},          /* Startanimation: leichte Kniebeuge zeigt Rhythmus, Lasten und Farbcodierung */
  anatomy:{AN,STRUCT,STRUCT_BY_ID,LAYER_GROUPS,INFO,LABELS},
  kinematics:{worldPt,solvePose,clampPose,evaluate,EVAL,EXT,REF,fasKey},
  presets:PRESETS,anims:ANIMS,physio:PHYSIO,
  buildBones,render:RENDER,
  camera:{orbit0:ORBIT0,views:VIEWS},detailViews:detailDefs,peel:PEEL,
  metrics:METRICS,monitor:MONITOR,loadGroups:LOAD_GROUPS,computeLoads,structReadouts,boneNameKeys:BONE_NAME_KEYS,layerPresets:LAYER_PRESETS,
  hud:{mini:hudMiniText,body:hudBodyHTML,summary:poseSummaryText},
  readout:{sum:'balSum',note:'balNote',html:balanceReadoutHTML},readout0:READOUT0,
  drag:DRAG,
  testing:{limits,BW},
};

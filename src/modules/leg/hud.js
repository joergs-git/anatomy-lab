/* ===================== Bein: Texte für HUD, Pose-Zusammenfassung und Gleichgewichts-Block =====================
   Textbausteine aus pose, rh (Auswertung aus solvePose: lean, hipClin, screw, balanced, grf) und M (EVAL.metrics). */
const READOUT0={lean:0,hipClin:0,screw:-8,balanced:true,grf:0,ground:true,comZ:0};
const sgn=(v,a,b)=>v<0?t(a):t(b);
function hudMiniText(ps,M){ return `${t('kneeS')} ${fmt(ps.knee)}° · ${t('hipS')} ${fmt(ps.hipF)}° · PF ${fmt(M.pfBW,1)} × KG`; }
function hudBodyHTML(ps,rh,M){
  return `${t('hip')} ${fmt(rh.hipClin)}° (${t('thigh')} ${fmt(ps.hipF)}°) · ${sgn(ps.hipA,'add','abd')} ${fmt(Math.abs(ps.hipA))}° · ${sgn(ps.hipR,'ER','IR')} ${fmt(Math.abs(ps.hipR))}°<br>`+
    `${t('knee')} ${fmt(ps.knee)}° · ${t('tibRot')} ${sgn(ps.tibR+rh.screw,'ER','IR')} ${fmt(Math.abs(ps.tibR+rh.screw))}° · ${sgn(ps.valg,'varus','valgus')} ${fmt(Math.abs(ps.valg))}°<br>`+
    `${t('ankle')} ${sgn(ps.ankle,'plantar','dorsi')} ${fmt(Math.abs(ps.ankle))}° · ${t('subS')} ${sgn(ps.sub,'ev','inv')} ${fmt(Math.abs(ps.sub))}°`+
    `<span class="hud-more"><br>${rh.ground?`${t('trunk')} ${fmt(rh.lean)}°${rh.balanced?'':' · '+t('unbalanced')} · ${t('grf')} ${fmt(M.grf)} N`:t('noGround')} · ${t('moments')} H ${fmt(M.mHip)} · K ${fmt(M.mKnee)} · S ${fmt(M.mAnk)} Nm</span>`+
    `<br>PF ${fmt(M.pfBW,1)} × KG · TF ${fmt(M.tfBW,1)} × KG · ${t('aclS')} ${fmt(M.acl)} N · ${t('achS')} ${fmt(M.achBW,1)} × KG`;
}
function poseSummaryText(ps){ return `H ${fmt(ps.hipF)}° / K ${fmt(ps.knee)}° / S ${fmt(ps.ankle)}°`; }
/* Gleichgewichts-Block unter den Reglern (aufklappbar) */
function balanceReadoutHTML(ps,rh){
  const M=EVAL.metrics;
  if(!rh.ground) return `${t('noGround')}<br>${t('momentsL')}: ${t('hip')} ${fmt(M.mHip)} · ${t('knee')} ${fmt(M.mKnee)} · ${t('ankle')} ${fmt(M.mAnk)} Nm`;
  return `${t('trunkLean')} ${fmt(rh.lean)}°${rh.balanced?'':' · '+t('unbalanced')} · ${t('hipClinL')} ${fmt(rh.hipClin)}°<br>`+
    `${t('grfL')} ${fmt(M.grf)} N (${fmt(M.grfBW*100)} % KG)<br>`+
    `${t('momentsL')}: ${t('hip')} ${fmt(M.mHip)} · ${t('knee')} ${fmt(M.mKnee)} · ${t('ankle')} ${fmt(M.mAnk)} Nm<br>`+
    `${t('screwL')} ${fmt(Math.abs(rh.screw))}° ${t('ER')}`;
}

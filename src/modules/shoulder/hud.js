/* ===================== Schulter: Texte für HUD, Pose-Zusammenfassung und Skapula-Anzeige =====================
   Reine Textbausteine aus pose (humerothorakal), rh (Rhythmus-Auswertung aus solvePose) und M (EVAL.metrics); die Engine setzt sie in die Elemente. */
function planeLabel(P){ return t(P<-60?'plane0':P<-15?'plane1':P<=15?'plane2':P<=55?'plane3':P<=110?'plane4':'plane5'); }
/* Rhythmus-Auswertung, bevor die erste Pose gelöst ist */
const READOUT0={UR:0,PT:0,ER:0,cEl:0,cRet:0};
const rotAbbr=ps=>ps.IR<0?t('ER'):t('IR');
function hudMiniText(ps,M){ return `E ${fmt(ps.E)}° · ${rotAbbr(ps)} ${fmt(Math.abs(ps.IR))}° · ${fmt(M.ahd*10,1)} mm`; }
function hudBodyHTML(ps,rh,M){
  return `${t('elev')} ${fmt(ps.E)}° · ${planeLabel(ps.P)} (${fmt(ps.P)}°)<br>${ps.IR<0?t('ERfull'):t('IRfull')} ${fmt(Math.abs(ps.IR))}° · ${t('elbow')} ${fmt(ps.elbow)}° · ${Math.abs(ps.pro)<3?t('foreNeutral'):(ps.pro<0?t('supination'):t('pronation'))+' '+fmt(Math.abs(ps.pro))+'°'}<span class="hud-more"><br>${t('scapUp')}${fmt(rh.UR)}° · ${t('tilt')} ${fmt(rh.PT)}° · ${rh.ER>=0?t('ER'):t('IR')} ${fmt(Math.abs(rh.ER))}° · GH ≈ ${fmt(Math.max(0,ps.E-rh.UR))}°</span><br>${t('subac')} ${fmt(M.ahd*10,1)} mm · ${t('subcor')} ${fmt(M.chd*10,1)} mm · ${t('jforce')} ${fmt(M.jrf)} N`;
}
function poseSummaryText(ps){ return `E ${fmt(ps.E)}° / ${fmt(ps.P)}° / ${rotAbbr(ps)} ${fmt(Math.abs(ps.IR))}°`; }
function scapReadoutHTML(ps,rh){
  return `${t('upRot')} ${fmt(rh.UR)}° · ${t('postTilt')} ${fmt(rh.PT)}° · ${rh.ER>=0?t('ERfull'):t('IRfull')} ${fmt(Math.abs(rh.ER))}°<br>${t('clav')}: ${t('elev')} ${fmt(rh.cEl)}° · ${rh.cRet>=0?t('retr'):t('protr')} ${fmt(Math.abs(rh.cRet))}°<br>${t('gh')} ${fmt(Math.max(0,ps.E-rh.UR))}° · ${t('st')} ${fmt(rh.UR)}°`;
}

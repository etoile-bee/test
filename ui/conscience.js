// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — Lot 0] CONSCIENCE = dérivations PURES depuis les FAITS du Socle.
//   Recalculable, déterministe, JAMAIS stockée (INV-9). Ne décide rien (Loi I),
//   n'attribue aucun sens (Loi II) : en Lot 0 elle ne fait que SYNTHÉTISER des faits.
//   Aucune donnée durable ici ; elle LIT le Socle, n'écrit rien.
//   PUR : aucune I/O. Mêmes faits -> même lecture (reconstruction identique).
// ─────────────────────────────────────────────────────────────────────────────
const S = require('./socle');

// État LISIBLE dérivé (Lot 0) : brouillon tant que le cap n'est pas amorcé, sinon en cours.
function etat(facts) {
  const i = (facts && facts.intention) || {};
  const capPose = !!(i.message || i.emotion || i.public || i.objectif);
  return capPose ? '⏳ en cours' : '📝 brouillon';
}

// Ligne de cap (boussole) dérivée des composantes de l'intention.
function capLine(facts) {
  const i = (facts && facts.intention) || {};
  const bits = [i.message ? ('« ' + i.message + ' »') : '(cap à poser)'];
  if (i.emotion) bits.push('😊 ' + i.emotion);
  if (i.public) bits.push('👥 ' + i.public);
  if (i.objectif) bits.push('📍 ' + i.objectif);
  return bits.join(' · ');
}

// SITUATION = synthèse au présent (objet dérivé, non stocké).
function situation(facts) {
  return {
    nom: (facts && facts.intention && facts.intention.message) || S.friendlyName(facts && facts.cree_le),
    etat: etat(facts),
    cap: capLine(facts),
    declencheur: (facts && facts.intention && facts.intention.declencheur) || null,
    decisions: ((facts && facts.decisions) || []).length,
    medias: ((facts && facts.medias) || []).length,
  };
}

// FOCALISATION → PROCHAIN GESTE : une PROPOSITION dérivée (Loi I — l'auteur décide, peut l'ignorer).
function prochainGeste(facts) {
  const i = (facts && facts.intention) || {};
  if (!i.message) return { label: '✍️ Poser ton cap', cb: 'R0_CAP' };
  const medias = (facts && facts.medias) || [];
  if (!medias.length) return { label: '🖼 Convoquer une image', cb: 'R0_IMG' };
  return { label: '🔄 Regénérer l\'image', cb: 'R0_REGEN' };
}

// TITRE = compression minimale (Lot 0) : cap + état + mémoire. Déterministe.
function titre(facts) {
  const s = situation(facts);
  return '🧭 ' + s.cap + '\n📊 ' + s.etat + ' · 🗂 ' + s.decisions + ' décision(s)';
}

module.exports = { etat, capLine, situation, titre, prochainGeste };

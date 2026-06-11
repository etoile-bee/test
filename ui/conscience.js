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

// Lecture des manifestations (médias) par nature — image/vidéo sont des natures EXISTANTES du modèle.
//   La suppression est DOUCE : un média `supprime` RESTE dans le dossier (historique) mais n'est plus « visible ».
function medias(facts) { return (facts && facts.medias) || []; }                            // TOUT (historique compris)
function visibles(facts) { return medias(facts).filter(function (m) { return m && m.etat !== 'supprime'; }); }
function hasVideo(facts) { return visibles(facts).some(function (m) { return m.type === 'video'; }); }
function hasImage(facts) { return visibles(facts).some(function (m) { return m.type !== 'video'; }); }
function lastMedia(facts) { const ms = visibles(facts); return ms.length ? ms[ms.length - 1] : null; }
function lastImage(facts) { const ms = visibles(facts).filter(function (m) { return m.type !== 'video'; }); return ms.length ? ms[ms.length - 1] : null; }
function lastVideo(facts) { const ms = visibles(facts).filter(function (m) { return m.type === 'video'; }); return ms.length ? ms[ms.length - 1] : null; }
// KIND à matérialiser : la DERNIÈRE manifestation créée (esprit Option A : « je vois ce que je viens de créer »).
//   Créer une image -> on voit l'image ; faire une vidéo -> on voit la vidéo ; regénérer l'image -> on revoit l'image.
function mediaKind(facts) { const m = lastMedia(facts); if (!m) return 'text'; return m.type === 'video' ? 'video' : 'photo'; }

// FOCALISATION → PROCHAIN GESTE : PROPOSITION dérivée, MENÉE PAR LA CRÉATION (Loi I — l'auteur peut l'ignorer).
//   Esprit du modèle : matérialiser l'intention. Créer est le geste primaire ; le cap est un ancrage optionnel.
function prochainGeste(facts) {
  if (!hasImage(facts) && !hasVideo(facts)) return { label: '✨ Créer une image', cb: 'R0_IMG' };
  if (!hasVideo(facts)) return { label: '🎬 Faire une vidéo', cb: 'R0_VID' };
  return { label: '🔁 Regénérer l\'image', cb: 'R0_REGEN' };
}

// TITRE = compression minimale (Lot 0) : cap + état + mémoire. Déterministe.
function titre(facts) {
  const s = situation(facts);
  return '🧭 ' + s.cap + '\n📊 ' + s.etat + ' · 🗂 ' + s.decisions + ' décision(s)';
}

// (P9) STATUT du projet — DÉRIVÉ des faits (aucun objet/champ stocké). Évolue automatiquement.
//   Préparation photo → Photo validée → Préparation vidéo → Vidéo générée → Terminé.
function statutProjet(facts) {
  const p = (facts && facts.publication) || {};
  if (p.publie_le) return 'Terminé';
  if (hasVideo(facts)) return 'Vidéo générée';
  const dv = (facts && facts.draft && facts.draft.video) || {};
  const imgGardee = visibles(facts).some(m => m.type !== 'video' && m.etat === 'garde');
  if (dv.source) return 'Préparation vidéo';
  if (imgGardee) return 'Photo validée';
  return 'Préparation photo';
}

module.exports = { etat, capLine, situation, titre, prochainGeste, medias, visibles, hasImage, hasVideo, lastMedia, lastImage, lastVideo, mediaKind, statutProjet };

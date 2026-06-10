// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] MOTEUR DE PARCOURS (grammaire symétrique PHOTO ≡ VIDÉO).
//   SOURCE → PARAMÈTRES → FINALISER  (PRÊT-À-POSTER = statut de publication, pas une étape — design D/C.6)
//   - APERÇU = état permanent : le média actif (manifest.media_actif) est visible à CHAQUE étape (design C.9)
//   - AVANCE par ✅ VALIDER (C1/E108/E115) ; les GATES lisent le MÉDIA RÉEL du manifest, pas des drapeaux UI (corrige A2/A3)
//   - « Valider » sur FINALISER exige le GATE QC (C4/E92) AVANT toute génération payante
//   - Module PUR : pas de dépendance Telegram ni d'I/O ; gates(manifest) -> bool. Pilotable par programme (compat Auto E7/C5).
// ─────────────────────────────────────────────────────────────────────────────

// MODÈLE (A) — UN SEUL PROJET, deux PHASES (photo, vidéo) ; même grammaire par phase. Un seul manifest.
const FLOWS = ['photo', 'video'];          // ici « flow » = PHASE du projet unique (pas un projet séparé)
const PHASES = ['photo', 'video'];
const STEPS = ['source', 'parametres', 'finaliser']; // identique aux 2 phases (symétrie verrou 10)
const STEP_LABEL = { source: 'SOURCE', parametres: 'PARAMÈTRES', finaliser: 'FINALISER' };

function qcPasse(m) { return !!(m && m.qc && (m.qc.verdict === 'ok' || m.qc.verdict === 'force')); }
function hasScript(m) { return !!(m && m.scripts && m.scripts.some(s => s && s.text && String(s.text).trim())); }
function hasMedia(m) { return !!(m && m.media_actif); }

// GATES = conditions d'avance, basées sur l'ÉTAT RÉEL du dossier projet (manifest), jamais sur un drapeau d'écran.
const GATES = {
  photo: {
    source: hasMedia,                              // une image/look est devenu le média actif
    parametres: hasMedia,                           // params ont des défauts ; on exige au moins un média
    finaliser: qcPasse,                             // C4/E92 : QC validé AVANT Final HD payant
  },
  video: {
    source: hasMedia,                              // un média (image/look) alimente la vidéo
    parametres: hasScript,                          // une vidéo exige un script (E46)
    finaliser: qcPasse,                             // C4/E92 : QC validé AVANT Final HD payant
  },
};
const GATE_REASON = {
  photo: { source: 'Choisis/produis une image (média actif).', parametres: 'Aucun média actif.', finaliser: 'Contrôle qualité requis avant Final HD.' },
  video: { source: 'Choisis un média source pour la vidéo.', parametres: 'Écris un script avant de continuer.', finaliser: 'Contrôle qualité requis avant Final HD.' },
};

function steps() { return STEPS.slice(); }
function firstStep() { return STEPS[0]; }
function stepIndex(step) { return STEPS.indexOf(step); }
function nextStep(step) { const i = stepIndex(step); return (i >= 0 && i < STEPS.length - 1) ? STEPS[i + 1] : null; }
function prevStep(step) { const i = stepIndex(step); return i > 0 ? STEPS[i - 1] : null; }
function isLast(step) { return step === STEPS[STEPS.length - 1]; }

// APERÇU permanent : le média visible à toute étape = le média actif du projet (design C.9).
function previewMedia(manifest) { return manifest && manifest.media_actif ? manifest.media_actif : null; }

// Le gate de l'étape courante est-il satisfait ? (lecture du manifest réel)
function canValidate(flow, step, manifest) {
  const g = GATES[flow] && GATES[flow][step];
  return g ? !!g(manifest) : false;
}

// ✅ VALIDER : si le gate passe, avance ; sur la dernière étape (finaliser) -> action de FINALISATION.
// Retour : { ok, next?, action?, reason? }. Pur : ne mute rien (le caller persiste via project_store).
function validate(flow, step, manifest) {
  if (!canValidate(flow, step, manifest)) {
    return { ok: false, reason: (GATE_REASON[flow] && GATE_REASON[flow][step]) || 'Étape incomplète.' };
  }
  if (isLast(step)) {
    // FINALISER validé (QC OK) -> Final HD. Effet selon la PHASE (modèle A) :
    //  - phase VIDÉO : livrable final = la vidéo -> production + entre en PRÊT-À-POSTER.
    //  - phase PHOTO : image finalisée (production) ; on propose ENSUITE la vidéo (go:video) ou la publication —
    //    pas de passage automatique en prêt-à-poster (un projet avec vidéo finit par la vidéo).
    if (flow === 'video') return { ok: true, action: 'finaliser', phase: 'video', effect: { statut_qualite: 'production', statut_publication: 'pret_a_poster' } };
    // phase PHOTO : l'IMAGE est finalisée mais le PROJET reste EN COURS (la vidéo suit) -> aucun changement de statut projet ;
    // le projet demeure « brouillon » (donc reste le projet courant/ré-éditable, modèle A) ; on propose la vidéo.
    return { ok: true, action: 'finaliser', phase: 'photo', effect: {}, offer: 'video' };
  }
  return { ok: true, next: nextStep(step) };
}

// Étape de reprise = 1re étape NON satisfaite (sinon la dernière). Sert au repositionnement après reprise/restart (C.1).
function resumeStep(flow, manifest) {
  for (const s of STEPS) { if (!canValidate(flow, s, manifest)) return s; }
  return STEPS[STEPS.length - 1];
}

// ── MODÈLE (A) : PHASES d'un projet unique, ré-éditables et réversibles ──
// La phase vidéo est « disponible » dès qu'une image est le média actif (E41 : l'image validée EST la source vidéo).
function videoUnlocked(m) { return hasMedia(m); }
// Phase courante DÉRIVÉE du manifest (E122 : reconstructible) : vidéo si un travail vidéo existe, sinon photo.
function phaseOf(m) { return videoDownstreamExists(m) ? 'video' : 'photo'; }
// L'aval VIDÉO existe-t-il ? (script / média vidéo / montage touché) — pour E115 (propagation Conserver/MàJ/Régénérer).
function videoDownstreamExists(m) {
  return hasScript(m) || !!(m && m.video_media) || !!(m && m.montage && m.montage.touched) || !!(m && m.livrables && m.livrables.video_final);
}
// Slices AMONT (phase photo) dont une modif peut impacter l'aval vidéo (E114/E115).
const UPSTREAM_PHOTO = ['reference', 'look', 'decor', 'prompt', 'image', 'nb'];
// Une modif d'un slice amont impacte-t-elle un aval VIDÉO déjà existant ? -> déclenche le prompt E115.
function changeImpactsDownstream(m, slice) {
  return UPSTREAM_PHOTO.indexOf(slice) >= 0 && videoDownstreamExists(m);
}

module.exports = {
  FLOWS, PHASES, STEPS, STEP_LABEL, GATES,
  steps, firstStep, stepIndex, nextStep, prevStep, isLast,
  previewMedia, canValidate, validate, resumeStep,
  qcPasse, hasScript, hasMedia,
  videoUnlocked, phaseOf, videoDownstreamExists, changeImpactsDownstream, UPSTREAM_PHOTO,
};

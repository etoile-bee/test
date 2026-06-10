// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] MOTEUR DE PARCOURS (grammaire symétrique PHOTO ≡ VIDÉO).
//   SOURCE → PARAMÈTRES → FINALISER  (PRÊT-À-POSTER = statut de publication, pas une étape — design D/C.6)
//   - APERÇU = état permanent : le média actif (manifest.media_actif) est visible à CHAQUE étape (design C.9)
//   - AVANCE par ✅ VALIDER (C1/E108/E115) ; les GATES lisent le MÉDIA RÉEL du manifest, pas des drapeaux UI (corrige A2/A3)
//   - « Valider » sur FINALISER exige le GATE QC (C4/E92) AVANT toute génération payante
//   - Module PUR : pas de dépendance Telegram ni d'I/O ; gates(manifest) -> bool. Pilotable par programme (compat Auto E7/C5).
// ─────────────────────────────────────────────────────────────────────────────

const FLOWS = ['photo', 'video'];
const STEPS = ['source', 'parametres', 'finaliser']; // identique PHOTO/VIDÉO (symétrie verrou 10)
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
    // FINALISER validé (QC OK) -> lancer Final HD puis publication. (le caller exécute la génération payante)
    return { ok: true, action: 'finaliser', effect: { statut_qualite: 'production', statut_publication: 'pret_a_poster' } };
  }
  return { ok: true, next: nextStep(step) };
}

// Étape de reprise = 1re étape NON satisfaite (sinon la dernière). Sert au repositionnement après reprise/restart (C.1).
function resumeStep(flow, manifest) {
  for (const s of STEPS) { if (!canValidate(flow, s, manifest)) return s; }
  return STEPS[STEPS.length - 1];
}

module.exports = {
  FLOWS, STEPS, STEP_LABEL, GATES,
  steps, firstStep, stepIndex, nextStep, prevStep, isLast,
  previewMedia, canValidate, validate, resumeStep,
  qcPasse, hasScript, hasMedia,
};

// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] LOT 8 — COÛTS RÉELS (estimation avant dépense). Réutilise la logique legacy (COST + lookbook.pricing).
//   panel() = affichage AVANT toute dépense : ⏱ durée · 🎞 nb · 🖼 format · ⚙️ moteur · 💳 coût (crédits ≈ €) · 🔋 crédits.
//   PUR : lookbook injecté -> testable. (E10/E11/E12/E14)
// ─────────────────────────────────────────────────────────────────────────────
const COST = { EL_EUR_PER_1K_CHARS: 0.20, KLING_EUR_PER_PART: 0.40, CHARS_PER_WORD: 6, CURRENCY: '€' };

function eurPerCredit(lb) { return (lb && lb.pricing && lb.pricing.eur_per_credit) || 0.058; }
function ops(lb) { return (lb && lb.pricing && lb.pricing.ops) || {}; }
function planParts(sec) { sec = sec || 23; const n = Math.max(1, Math.ceil(sec / 30)); const words = Math.round((sec / 60) * 150); return { n: n, words: words }; }
function r2(x) { return Math.round(x * 100) / 100; }
function r3(x) { return Math.round(x * 1000) / 1000; }

// IMAGE : nb × coût unitaire (lookbook.ops['image_<mode>'] sinon 1 crédit/image).
function estimateImage(params, lb) {
  const nb = (params && params.nb_images) || 1;
  const mode = (params && params.mode) || 'eco';
  const unit = ops(lb)['image_' + mode];
  const credits = unit != null ? r3(unit * nb) : nb;
  return { kind: 'image', nb: nb, format: (params && params.format) || '9:16', moteur: 'Seedream', credits: credits, eur: r3(credits * eurPerCredit(lb)), gratuit: false };
}

// VIDÉO : parts (durée) × coût vidéo + voix (TTS ElevenLabs). Moteurs : Anthropic(script)+ElevenLabs(voix)+Kling(lipsync).
function estimateVideo(params, lb) {
  const dur = (params && params.duree) || (params && params.duration) || '23s';
  const sec = parseInt(dur, 10) || 23;
  const base = planParts(sec);
  const plan = { n: (params && params.nb_plans) || base.n, words: base.words }; // Q9 : nb plans = images retenues si fourni
  const chars = plan.words * COST.CHARS_PER_WORD;
  const el = r3((chars / 1000) * COST.EL_EUR_PER_1K_CHARS); // voix
  const opVideo = ops(lb).video30s;
  let credits = null, kling;
  if (opVideo != null) { credits = r3(opVideo * plan.n); kling = r3(credits * eurPerCredit(lb)); }
  else { kling = r3(plan.n * COST.KLING_EUR_PER_PART); }
  return { kind: 'video', nb: plan.n, format: (params && params.format) || '9:16', moteur: 'Anthropic+ElevenLabs+Kling', duree: dur, credits: credits, eur: r2(el + kling), detail: { voix_eur: el, lipsync_eur: kling }, gratuit: false };
}

function estimate(kind, params, lb) { return kind === 'video' ? estimateVideo(params, lb) : estimateImage(params, lb); }

// D2 — l'utilisateur choisit la DURÉE FINALE ; le système ADAPTE : nb plans, temps/plan, découpage script.
//   nbPlansRetenus (images retenues, Q9) sinon dérivé de la durée. Si script INCOHÉRENT -> alerte + proposition (jamais silencieux).
function adaptMontage(sec, scriptText, nbPlansRetenus) {
  sec = sec || 23;
  const words = (scriptText || '').trim() ? scriptText.trim().split(/\s+/).length : 0;
  const plans = nbPlansRetenus || planParts(sec).n;
  const sec_per_plan = Math.round((sec / plans) * 10) / 10;
  const expected = Math.round((sec / 60) * 150); // ~150 mots/min
  const lo = Math.round(expected * 0.6), hi = Math.round(expected * 1.4);
  const coherent = words === 0 || (words >= lo && words <= hi);
  let alerte = null, suggestion = null;
  if (!coherent) {
    const suggSec = Math.max(8, Math.round((words / 150) * 60));
    alerte = '⚠️ Script incohérent avec la durée (' + words + ' mots pour ' + sec + 's)';
    suggestion = words < lo
      ? ('Script court → réduire la durée à ~' + suggSec + 's, ou allonger le script')
      : ('Script long → allonger la durée à ~' + suggSec + 's, ou raccourcir le script');
  }
  return { plans: plans, sec_per_plan: sec_per_plan, words: words, expected: expected, coherent: coherent, alerte: alerte, suggestion: suggestion };
}

// Panneau « Avant de lancer » (E11) — texte court.
function panel(est, creditsRestants) {
  const bits = [];
  if (est.duree) bits.push('⏱ ' + est.duree);
  bits.push('🎞 ' + est.nb + (est.kind === 'image' ? ' img' : ' plan(s)'));
  bits.push('🖼 ' + est.format);
  bits.push('⚙️ ' + est.moteur);
  bits.push('💳 ' + (est.credits != null ? est.credits + ' cr ≈ ' : '') + est.eur + ' ' + COST.CURRENCY);
  if (creditsRestants != null) bits.push('🔋 ' + creditsRestants + ' cr');
  return bits.join(' · ');
}

module.exports = { COST, estimate, estimateImage, estimateVideo, planParts, panel, eurPerCredit, adaptMontage };

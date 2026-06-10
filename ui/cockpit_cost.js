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
  const plan = planParts(sec);
  const chars = plan.words * COST.CHARS_PER_WORD;
  const el = r3((chars / 1000) * COST.EL_EUR_PER_1K_CHARS); // voix
  const opVideo = ops(lb).video30s;
  let credits = null, kling;
  if (opVideo != null) { credits = r3(opVideo * plan.n); kling = r3(credits * eurPerCredit(lb)); }
  else { kling = r3(plan.n * COST.KLING_EUR_PER_PART); }
  return { kind: 'video', nb: plan.n, format: (params && params.format) || '9:16', moteur: 'Anthropic+ElevenLabs+Kling', duree: dur, credits: credits, eur: r2(el + kling), detail: { voix_eur: el, lipsync_eur: kling }, gratuit: false };
}

function estimate(kind, params, lb) { return kind === 'video' ? estimateVideo(params, lb) : estimateImage(params, lb); }

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

module.exports = { COST, estimate, estimateImage, estimateVideo, planParts, panel, eurPerCredit };

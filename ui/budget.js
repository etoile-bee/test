// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] SUIVI DES DÉPENSES RÉELLES — compteur PERSISTANT, SANS PLAFOND.
//   [#1' — Etoile 13/06/2026] Le quota de tests (≤10 + « réautorisation requise ») est SUPPRIMÉ : plus AUCUN blocage par compteur.
//   Ce module ne fait QUE COMPTER (informatif) : nb de générations réelles + crédits cumulés -> affichés sur l'écran de Validation (garde-fou financier conservé).
//   Le garde-fou par génération (écran moteur/coût/crédits + double confirmation) vit dans screens.js + le handler R0_GO ; il N'EST PAS touché ici.
//   Persistant : v4r_budget.json. `base` injectable -> testable hors-ligne. `exhausted` reste exposé (= toujours false) pour compat des appelants.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

function file(base) { return path.join(base, 'v4r_budget.json'); }
function load(base) { try { return JSON.parse(fs.readFileSync(file(base), 'utf8')); } catch (e) { return { tests: 0, credits: 0 }; } }
function save(base, s) { try { fs.writeFileSync(file(base), JSON.stringify(s, null, 2)); } catch (e) {} return s; }

// État lisible : nb de générations réelles + crédits cumulés. AUCUN plafond -> exhausted TOUJOURS false (plus de blocage).
function state(base) {
  const s = load(base); const tests = s.tests || 0;
  return { tests: tests, credits: s.credits || 0, exhausted: false };
}
// Enregistre UNE génération réelle (après une dépense validée). Accumule crédits + compteur informatif. JAMAIS de refus (plus de plafond).
function record(base, credits) {
  const s = load(base);
  save(base, { tests: (s.tests || 0) + 1, credits: (s.credits || 0) + (credits || 0) });
  return state(base);
}

module.exports = { state, record, file };

// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] BUDGET DE TESTS RÉELS — compteur PERSISTANT, plafond 10 (autorisation Etoile 11/06/2026).
//   N'effectue AUCUNE dépense : il COMPTE seulement les tests réels payants déjà validés (cumul + crédits).
//   À 10/10 -> `exhausted` : le câble BLOQUE toute nouvelle dépense réelle (réautorisation Etoile nécessaire).
//   Persistant : v4r_budget.json (état durable, hors dérivation). `base` injectable -> testable hors-ligne.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const MAX = 10;
function file(base) { return path.join(base, 'v4r_budget.json'); }
function load(base) { try { return JSON.parse(fs.readFileSync(file(base), 'utf8')); } catch (e) { return { tests: 0, credits: 0 }; } }
function save(base, s) { try { fs.writeFileSync(file(base), JSON.stringify(s, null, 2)); } catch (e) {} return s; }

// État lisible : nb de tests réels consommés, crédits cumulés, restant, prochain n°, épuisé ?
function state(base) {
  const s = load(base); const tests = s.tests || 0;
  return { tests: tests, credits: s.credits || 0, max: MAX, remaining: Math.max(0, MAX - tests), next: tests + 1, exhausted: tests >= MAX };
}
// Enregistre UN test réel (après une dépense réelle validée). Renvoie le nouvel état. Refuse au-delà de MAX.
function record(base, credits) {
  const s = load(base); const tests = s.tests || 0;
  if (tests >= MAX) return state(base); // sécurité : jamais au-delà du plafond
  save(base, { tests: tests + 1, credits: (s.credits || 0) + (credits || 0) });
  return state(base);
}

// [#1b RÉAUTORISATION] Etoile rouvre le budget de tests : remet le compteur à 0 (10 nouveaux tests). Crédits cumulés conservés (historique de dépense). Acte délibéré (clic d'Etoile).
function reauthorize(base) { const s = load(base); save(base, { tests: 0, credits: s.credits || 0 }); return state(base); }

module.exports = { MAX, state, record, reauthorize, file };

// [#1' QUOTA SUPPRIMÉ] Le plafond de tests (≤10 + « réautorisation requise ») est RETIRÉ. Ce test prouve :
//   - aucun blocage par compteur (jamais « épuisé », jamais de refus, même après BEAUCOUP de générations) ;
//   - le suivi crédits cumulés reste informatif (record accumule) ;
//   - le GARDE-FOU FINANCIER par génération est CONSERVÉ : Validation chiffrée (moteur/coût/crédits) + bouton Générer TOUJOURS présent, AUCUN bouton « Réautoriser ».
const fs = require('fs'), path = require('path'), os = require('os');
const BUD = require('../ui/budget');
const SC = require('../ui/screens');
const COST = require('../ui/cockpit_cost');
const S = require('../ui/socle');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
const cbs = v => [].concat.apply([], v.rows || []).map(b => b.cb);

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r_bud_'));

// État initial : jamais épuisé
let s = BUD.state(base);
chk('init : 0 génération, JAMAIS épuisé (plus de plafond)', s.tests === 0 && s.exhausted === false);

// Beaucoup de générations (bien au-delà de l'ancien plafond de 10) -> JAMAIS bloqué
for (let i = 0; i < 25; i++) BUD.record(base, 0.48);
s = BUD.state(base);
chk('après 25 générations : compteur=25, TOUJOURS non épuisé (aucun plafond)', s.tests === 25 && s.exhausted === false);
chk('crédits cumulés corrects (25 × 0,48 = 12)', Math.abs(s.credits - 12) < 1e-9);
chk('record n\'est JAMAIS refusé (le compteur avance toujours)', (BUD.record(base, 0.48), BUD.state(base).tests === 26));
chk('persistance : l\'état survit (relecture)', BUD.state(base).tests === 26);
chk('plus d\'API de réautorisation (reauthorize supprimé)', typeof BUD.reauthorize === 'undefined');

// ── GARDE-FOU FINANCIER CONSERVÉ : écran de Validation moteur·coût·crédits + bouton Générer toujours là ──
const f = S.defaultFacts('imany', 't', Date.UTC(2026, 5, 11, 13));
const est = COST.estimate('image', { nb_images: 1, mode: 'eco' }, { pricing: { ops: { eco: 0.48 }, eur_per_credit: 0.058 } });
// SIMULATION
const vSim = SC.validationView(f, { confirm: { mediaKind: 'photo', est: est, live: false, budget: BUD.state(base) } });
chk('Validation SIM : coût + crédits cumulés + état simulation', /Coût/.test(vSim.caption) && /Crédits/i.test(vSim.caption) && /simulation/i.test(vSim.caption));
chk('Validation SIM : bouton Générer présent (R0_GO2)', cbs(vSim).includes('R0_GO2'));
// RÉEL même après 26 générations : TOUJOURS Générer, AUCUN blocage / AUCUN « Réautoriser »
const vReal = SC.validationView(f, { confirm: { mediaKind: 'photo', est: est, live: true, budget: BUD.state(base) } });
chk('Validation RÉEL : « Dépense réelle » + coût (garde-fou financier conservé)', /Dépense réelle/i.test(vReal.caption) && /Coût/.test(vReal.caption));
chk('Validation RÉEL : Générer TOUJOURS dispo, JAMAIS bloqué', cbs(vReal).includes('R0_GO2'));
chk('Validation RÉEL : AUCUN « budget épuisé » / « Réautoriser »', !/épuisé/i.test(vReal.caption) && !cbs(vReal).includes('R0_BUDGET_REARM'));
// Confirmation (2e garde-fou) : Oui/Annuler, jamais bloquée
const c2 = SC.confirm2View(f, { confirm: { mediaKind: 'photo', est: est, live: true, budget: BUD.state(base) } });
chk('Confirmation : double-confirmation présente (Oui, générer)', cbs(c2).includes('R0_GO') && !cbs(c2).includes('R0_BUDGET_REARM'));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

// [RÉALISATION /v4r] BUDGET DE TESTS RÉELS (plafond 10) — logique testée EN SIMULATION, AUCUN appel réel.
//   Vérifie : compteur persistant · incrément sur GO réel simulé · blocage à 10 · affichage confirm (moteur/coût/crédits/X-10).
const fs = require('fs'), path = require('path'), os = require('os');
const BUD = require('../ui/budget');
const SC = require('../ui/screens');
const COST = require('../ui/cockpit_cost');
const S = require('../ui/socle');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r_bud_'));

// État initial
let s = BUD.state(base);
chk('init : 0 test consommé, plafond 10, prochain n°1, non épuisé', s.tests === 0 && s.max === 10 && s.next === 1 && !s.exhausted && s.remaining === 10);

// Incrément simulé (comme un GO réel) — on simule 9 tests à 0,48 cr (photo éco)
for (let i = 0; i < 9; i++) BUD.record(base, 0.48);
s = BUD.state(base);
chk('après 9 tests : compteur=9, restant=1, prochain n°10, non épuisé', s.tests === 9 && s.remaining === 1 && s.next === 10 && !s.exhausted);
chk('crédits cumulés corrects (9 × 0,48 = 4,32)', Math.abs(s.credits - 4.32) < 1e-9);

// 10e test -> épuisé
BUD.record(base, 0.48); s = BUD.state(base);
chk('après 10 tests : ÉPUISÉ (10/10), restant=0', s.tests === 10 && s.exhausted && s.remaining === 0);

// 11e tentative -> REFUSÉE (jamais au-delà du plafond)
const before = BUD.state(base).tests; BUD.record(base, 0.48);
chk('11e tentative REFUSÉE (plafond dur, aucune dépense au-delà)', BUD.state(base).tests === before);

// Persistance : relire depuis le disque
chk('persistance : l\'état survit (relecture)', BUD.state(base).tests === 10);

// ── Écran de confirmation : affichage moteur · coût · crédits consommés · X/10 · validation/blocage ──
const f = S.defaultFacts('imany', 't', Date.UTC(2026, 5, 11, 13));
const est = COST.estimate('image', { nb_images: 1, mode: 'eco' }, { pricing: { ops: { eco: 0.48 }, eur_per_credit: 0.058 } });
// cas SIMULATION (live=false) : pas de blocage, le clic ne dépense pas
const vSim = SC.validationView(f, { confirm: { mediaKind: 'photo', est: est, live: false, budget: { tests: 3, credits: 1.44, max: 10, next: 4, remaining: 7, exhausted: false } } });
chk('confirm SIM : coût + compteur tests + état simulation (compact)', /Coût/.test(vSim.caption) && /Tests : 3\/10/.test(vSim.caption) && /simulation/i.test(vSim.caption));
chk('confirm SIM : bouton valider présent (pas de blocage)', [].concat.apply([], vSim.rows).some(b => b.cb === 'R0_GO2'));
// cas RÉEL non épuisé : compteur « test réel n°X/10 »
const vReal = SC.validationView(f, { confirm: { mediaKind: 'photo', est: est, live: true, budget: { tests: 3, credits: 1.44, max: 10, next: 4, remaining: 7, exhausted: false } } });
chk('confirm RÉEL : affiche « test réel n°4/10 »', /test réel n°4\/10/i.test(vReal.caption) && [].concat.apply([], vReal.rows).some(b => b.cb === 'R0_GO2'));
// cas RÉEL épuisé : blocage, pas de R0_GO
const vBlocked = SC.validationView(f, { confirm: { mediaKind: 'photo', est: est, live: true, budget: { tests: 10, credits: 4.8, max: 10, next: 11, remaining: 0, exhausted: true } } });
chk('confirm RÉEL ÉPUISÉ : message « budget épuisé » + AUCUN bouton de dépense', /épuisé/i.test(vBlocked.caption) && !([].concat.apply([], vBlocked.rows).some(b => b.cb === 'R0_GO')));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

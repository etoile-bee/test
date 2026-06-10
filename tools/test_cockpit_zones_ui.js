// [cockpit-v4] Couche créative — pickers de ZONE via le contrôleur (critères 2/4) : ouvrir, verrouiller, réutiliser, historique.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const LS = require('../ui/cockpit_libstore');
const { createController } = require('../ui/cockpit_controller');
let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'zui_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
fs.writeFileSync(path.join(base, 'lookbook.json'), JSON.stringify({ envs: { studio: { label: 'Studio' }, jour: { label: 'Jour' } }, pricing: { eur_per_credit: 0.058, ops: {} } }, null, 2));
const deps = { base, persona, store: S, libstore: LS, now, generate: () => [], lookbook: {} };
const C = createController(deps);
C.dispatch('go:photo'); const pid = C.ui.projectId;
// forcer un média actif pour passer en paramètres
S.setActiveMedia(base, persona, pid, 'images/x.jpg', 'image', now());
C.ui.step = 'parametres';

// Ouvrir le picker Décor (zone réelle, pas stub)
let r = C.dispatch('P_DECOR');
chk('P_DECOR ouvre le picker de zone (pas stub)', C.ui.step === 'picker' && C.ui.picker === 'decor');
chk('picker zone : verrou + créer + enregistrer + options biblio', ['ZLOCK_decor', 'ZCREATE_decor', 'ZSAVE_decor'].every(x => cbs(C.render()).indexOf(x) >= 0) && cbs(C.render()).some(x => /^ZPICK_decor_/.test(x)));
// Réutiliser un décor de la bibliothèque (ZPICK) -> zone décor mise à jour
C.dispatch('ZPICK_decor_0');
chk('ZPICK : décor appliqué depuis la bibliothèque', S.loadManifest(base, persona, pid).zones.decor.value === 'studio');
// Verrouiller la zone
C.dispatch('P_DECOR'); C.dispatch('ZLOCK_decor');
chk('ZLOCK : zone décor verrouillée', S.loadManifest(base, persona, pid).zones.decor.locked === true);
// Changer décor (2e fois) -> historique
C.dispatch('ZPICK_decor_1');
let m = S.loadManifest(base, persona, pid);
chk('changement décor -> historique conserve l\'ancien', m.zones.decor.history.some(h => h.value === 'studio') && m.zones.decor.value === 'jour');
// Voir l'historique + restaurer
C.dispatch('P_DECOR'); C.dispatch('ZHIST_decor');
chk('vue historique zone', C.ui.step === 'zonehist' && cbs(C.render()).some(x => /^ZREST_decor_/.test(x)));
C.dispatch('ZREST_decor_0');
chk('ZREST : valeur précédente restaurée (studio)', S.loadManifest(base, persona, pid).zones.decor.value === 'studio');
// Réf via P_REF -> zone reference
C.ui.step = 'parametres'; C.dispatch('P_REF');
chk('P_REF -> zone reference', C.ui.picker === 'reference');

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

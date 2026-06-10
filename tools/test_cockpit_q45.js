// [cockpit-v4] Q4 (versions restaurables) + Q5 (préréglages persona, application explicite E124-safe) + Lot2 (décor CRUD via contrôleur).
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const LS = require('../ui/cockpit_libstore');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'q45_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
fs.writeFileSync(path.join(base, 'lookbook.json'), JSON.stringify({ envs: { studio: { label: 'Studio' } }, pricing: { eur_per_credit: 0.058, ops: { image_eco: 1 } }, style_rules: 'R' }, null, 2));
function gen(flow, m) { const dir = path.join(S.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'c0.jpg'), 'I'); return ['images/c0.jpg']; }
const deps = { base, persona, store: S, libstore: LS, now, generate: gen, lookbook: LS.readLookbook(base), libItems: () => [] };

const C = createController(deps);
C.dispatch('go:photo'); const pid = C.ui.projectId;
C.dispatch('SRC_NEW'); C.dispatch('GEN_CONFIRM'); C.dispatch('CAND_KEEP');

// Q4 — snapshot v1 (état neutre), édition, snapshot v2, restauration v1
C.dispatch('VERS_SNAP'); // v1
C.dispatch('CAND_EDIT'); C.dispatch('IMG_BR_UP'); C.dispatch('IMG_BR_UP'); // fx brightness=10
C.dispatch('BACK'); C.dispatch('VERS_SNAP'); // v2
let vers = S.listVersions(base, persona, pid);
chk('Q4 : 2 versions enregistrées', vers.length === 2);
chk('Q4 : v2 capture brightness=10', vers[1].params_snapshot.image_fx.brightness === 10);
chk('Q4 : v1 capture l\'état neutre', JSON.stringify(vers[0].params_snapshot.image_fx) === '{}');
C.dispatch('VERS_RESTORE_v1');
chk('Q4 : restauration v1 -> fx neutre rétabli', JSON.stringify(S.loadManifest(base, persona, pid).parametres.image_fx) === '{}');
chk('Q4 : versions NON perdues après restauration', S.listVersions(base, persona, pid).length === 2);

// Q5 — préréglage : enregistrer le réglage courant, l'appliquer EXPLICITEMENT à un AUTRE projet
C.dispatch('CAND_EDIT'); C.dispatch('IMG_SA_UP'); C.dispatch('BACK'); // saturation=5 sur projet 1
C.dispatch('PRESET_SAVE');
chk('Q5 : préréglage persona enregistré', LS.listPresets(base, persona).indexOf('préréglage') >= 0);
S.setStatutQualite(base, persona, pid, 'production', now()); // sort des "en cours"
const C2 = createController(deps); C2.dispatch('go:photo'); const pid2 = C2.ui.projectId;
chk('🔒 E124 : nouveau projet NEUTRE (préréglage PAS auto-appliqué)', JSON.stringify(S.loadManifest(base, persona, pid2).parametres.image_fx) === '{}');
C2.dispatch('PRESET_APPLY_préréglage');
chk('Q5 : application EXPLICITE -> préréglage copié dans le projet 2', S.loadManifest(base, persona, pid2).parametres.image_fx.saturation === 5);

// Lot 2 — décor CRUD via contrôleur (A3 : pricing intact)
const pricingBefore = JSON.stringify(LS.readLookbook(base).pricing);
C2.dispatch('DEC_DEL_studio');
chk('Lot2 : décor supprimé via contrôleur', LS.listDecors(base).length === 0);
chk('🔒 A3 : pricing INCHANGÉ après suppression décor', JSON.stringify(LS.readLookbook(base).pricing) === pricingBefore);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

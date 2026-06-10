// [cockpit-v4] Lot 3 (planche N séparées + vue contact) + Lot 4 (édition image PAR PROJET, E124).
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lot34_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
function gen(flow, m) { const dir = path.join(S.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true }); const r = []; for (let i = 0; i < (m.parametres.nb_images || 1); i++) { const f = 'c' + i + '.jpg'; fs.writeFileSync(path.join(dir, f), 'I'); r.push('images/' + f); } return r; }
const deps = { base, persona, store: S, now, generate: gen, lookbook: { pricing: { ops: { image_eco: 1 } } }, libItems: () => [] };

const C = createController(deps);
C.dispatch('go:photo'); const pid = C.ui.projectId;

// Lot 3 — nb 1/2/3/4/6 : NB_4 -> 4 images séparées
C.dispatch('NB_4');
chk('Lot3 : NB_4 -> nb_images=4 (manifest)', S.loadManifest(base, persona, pid).parametres.nb_images === 4);
C.dispatch('SRC_NEW'); C.dispatch('GEN_CONFIRM');
chk('Lot3 : 4 images SÉPARÉES générées (candidats)', (S.loadManifest(base, persona, pid).image_candidates || []).length === 4);
// vue planche-contact (aperçu) + sélection explicite
let pl = C.dispatch('PLANCHE');
chk('Lot3 : vue planche-contact (aperçu d\'ensemble)', C.ui.step === 'planche' && cbs(pl.render).filter(x => /^CAND_SEL_/.test(x)).length === 4);
C.dispatch('CAND_SEL_2');
chk('Lot3 : sélection explicite d\'une image (séparée) -> source', C.ui.step === 'source' && C.ui.candIdx === 2);

// Lot 4 — édition image PAR PROJET (E124)
C.dispatch('CAND_EDIT');
chk('Lot4 : entre dans l\'éditeur image', C.ui.step === 'imgedit');
C.dispatch('IMG_BR_UP'); C.dispatch('IMG_BR_UP'); C.dispatch('IMG_SA_DN');
let m = S.loadManifest(base, persona, pid);
chk('Lot4 : réglages écrits DANS le manifest projet (per-projet)', m.parametres.image_fx.brightness === 10 && m.parametres.image_fx.saturation === -5);
C.dispatch('IMG_CROP');
chk('Lot4 : crop = OUTIL (stocké projet, pas affichage auto)', !!S.loadManifest(base, persona, pid).parametres.crop);
C.dispatch('IMG_RESET');
let m2 = S.loadManifest(base, persona, pid);
chk('Lot4 : réinit -> fx vide + crop null', JSON.stringify(m2.parametres.image_fx) === '{}' && m2.parametres.crop === null);
C.dispatch('IMG_BR_UP'); C.dispatch('BACK');
chk('Lot4 : retour éditeur -> source', C.ui.step === 'source');

// E124 — ÉTANCHÉITÉ : un NOUVEAU projet n'hérite PAS des réglages image du précédent
S.setStatutQualite(base, persona, pid, 'production', now()); // sort des "en cours"
const C2 = createController(deps); C2.dispatch('go:photo'); const pid2 = C2.ui.projectId;
chk('E124 : nouveau projet ≠ ancien', pid2 !== pid);
chk('🔒 E124 : nouveau projet image_fx NEUTRE (aucune fuite)', JSON.stringify(S.loadManifest(base, persona, pid2).parametres.image_fx) === '{}');

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

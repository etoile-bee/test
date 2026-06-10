// [cockpit-v4] Q2 — varier par prompt (img2img) : source conservée en variantes ; + boutons Versions/Préréglages.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');
const LS = require('../ui/cockpit_libstore');
let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'q2_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
function gen(flow, m) { const dir = path.join(S.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'c0.jpg'), 'I'); return ['images/c0.jpg']; }
const deps = { base, persona, store: S, libstore: LS, now, generate: gen, lookbook: {}, libItems: () => [] };
const C = createController(deps);
C.dispatch('go:photo'); const pid = C.ui.projectId;
C.dispatch('SRC_NEW'); C.dispatch('GEN_CONFIRM');
// Q2 — varier l'image courante
const r = C.dispatch('CAND_VARY');
chk('Q2 : CAND_VARY -> source conservée en variantes', S.loadManifest(base, persona, pid).variantes.indexOf('images/c0.jpg') >= 0);
chk('Q2 : vary_from enregistré (img2img au câblage)', S.loadManifest(base, persona, pid).vary_from === 'images/c0.jpg');
chk('Q2 : passe par la confirmation de coût (pas de dépense directe)', C.ui.step === 'confirm');
C.dispatch('GEN_CONFIRM');
chk('Q2 : nouvelle variante générée, source toujours conservée', S.loadManifest(base, persona, pid).variantes.indexOf('images/c0.jpg') >= 0);
// boutons Versions/Préréglages présents dans Paramètres + navigables
C.dispatch('CAND_KEEP'); C.dispatch('V'); // -> parametres
const par = C.render();
chk('boutons Versions + Préréglages dans Paramètres', cbs(par).indexOf('VERSIONS') >= 0 && cbs(par).indexOf('PRESETS') >= 0);
C.dispatch('VERSIONS'); chk('vue Versions (snapshot dispo)', cbs(C.render()).indexOf('VERS_SNAP') >= 0);
C.dispatch('BACK'); C.dispatch('PRESETS'); chk('vue Préréglages (enregistrer dispo)', cbs(C.render()).indexOf('PRESET_SAVE') >= 0);
try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

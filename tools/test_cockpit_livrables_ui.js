// [cockpit-v4] Critère 5/6 — exposition des LIVRABLES : liste lisible + ouverture avec légendes/hashtags copiables.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const V = require('../ui/cockpit_view');
const { createController } = require('../ui/cockpit_controller');
let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'livui_'));
const persona = 'imany'; const T = s => Date.parse('2026-06-10T' + s + 'Z');
const pid = S.createProject(base, persona, { manifest: { name: 'P' } }, T('10:00:00')).projectId;
let m = S.loadManifest(base, persona, pid);
m.media_actif = 'images/a.jpg'; m.scripts = [{ text: 'Bonjour' }]; m.legendes = { courte: 'Courte!', longue: 'Longue version ici', tags: '#imany #demo' };
m.livrables = { image: 'images/a.jpg', video: 'videos/v.mp4' }; S.saveManifest(base, persona, pid, m, T('10:01:00'));
// Deux livrables (plusieurs par projet)
S.buildDeliverable(base, persona, pid, T('10:02:00'));
S.buildDeliverable(base, persona, pid, T('10:03:00'));

const deps = { base, persona, store: S, now: () => T('10:05:00'), generate: () => [], lookbook: {} };
const C = createController(deps); C.dispatch('OPEN_' + pid); C.ui.step = 'finaliser';
// FINALISER montre l'accès Livrables
chk('accès « 📦 Livrables » depuis finaliser', cbs(C.render()).indexOf('LIVRABLES') >= 0);
C.dispatch('LIVRABLES');
chk('liste livrables : liv1 + liv2 (plusieurs par projet, lisible)', cbs(C.render()).indexOf('LIVOPEN_0') >= 0 && cbs(C.render()).indexOf('LIVOPEN_1') >= 0);
C.dispatch('LIVOPEN_0');
const det = C.render();
chk('ouverture livrable : légende courte + longue + hashtags en blocs copiables (<code>)', /Légende courte/.test(det.caption) && /Légende longue/.test(det.caption) && /Hashtags/.test(det.caption) && /<code>/.test(det.caption));
chk('livrable : vidéo + image signalées', /✓ vidéo/.test(det.caption) && /✓ image/.test(det.caption));
C.dispatch('BACK'); chk('retour -> liste livrables', C.ui.step === 'livrables');
C.dispatch('BACK'); chk('retour -> finaliser', C.ui.step === 'finaliser');
// vue directe complétude (E125)
const d0 = S.loadManifest(base, persona, pid).livrables_dossiers[0];
chk('dossier livrable complet (E125)', S.deliverableComplete(d0));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

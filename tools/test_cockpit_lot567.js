// [cockpit-v4] Lot 5 (suivi/abort) + Lot 6 (publication statut A5) + Lot 7 (cloud/persistance A6).
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lot567_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
const pid = S.createProject(base, persona, {}, now()).projectId;

// Lot 5 — suivi/annulation
S.setGenStatus(base, persona, pid, 'running', now());
chk('Lot5 : gen_status running', S.loadManifest(base, persona, pid).gen_status === 'running');
const deps = { base, persona, store: S, now, generate: () => [], lookbook: {} };
const C = createController(deps); C.dispatch('OPEN_' + pid);
C.dispatch('GEN_ABORT');
chk('Lot5 : GEN_ABORT -> gen_status aborted (aucune dépense)', S.loadManifest(base, persona, pid).gen_status === 'aborted');

// Lot 7 (A6) — persistance : médias locaux au dossier (jamais dépendants d'URL temporaire)
S.setActiveMedia(base, persona, pid, 'images/c0.jpg', 'image', now());
chk('Lot7 : média actif LOCAL (rel, pas http)', S.isLocalMedia('images/c0.jpg') && !S.isLocalMedia('http://tmpfiles.org/x.jpg'));
chk('Lot7 : projet SURVIT à l\'expiration des URLs temporaires (médias locaux)', S.projectSurvit(base, persona, pid) === true);

// Lot 6 (A5) — publication : pret_a_poster -> publie ; sort de la file, reste en Historique
S.setStatutQualite(base, persona, pid, 'production', now());
S.setStatutPublication(base, persona, pid, 'pret_a_poster', now());
chk('Lot6 : en Prêt-à-poster (file)', S.viewPretAPoster(base, persona).some(x => x.projectId === pid));
C.dispatch('PUBLISH');
let m = S.loadManifest(base, persona, pid);
chk('Lot6 : PUBLISH -> statut publie', m.statut_publication === 'publie');
chk('Lot6 (A5) : SORT de la file Prêt-à-poster', !S.viewPretAPoster(base, persona).some(x => x.projectId === pid));
chk('Lot6 (A5) : RESTE dans l\'Historique (mémoire permanente)', S.viewHistorique(base, persona).some(x => x.projectId === pid));

// vue finaliser : bouton Publier présent quand pret_a_poster
const V = require('../ui/cockpit_view');
const fin = V.viewFinaliser('photo', { media_actif: 'x', qc: { verdict: 'ok' }, statut_publication: 'pret_a_poster', couts: {} });
chk('Lot6 : bouton 📣 Publier dans finaliser quand prêt-à-poster', cbs(fin).indexOf('PUBLISH') >= 0);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

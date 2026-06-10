// [cockpit-v4] Test contrôleur — MODÈLE (A) : UN projet, 2 phases réversibles, E115, garde-fou E122.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'ctrlA_'));
const persona = 'imany';
let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
function fakeGenerate(flow, m) {
  const dir = path.join(S.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true });
  const rels = []; for (let i = 0; i < (m.parametres.nb_images || 1); i++) { const f = 'cand' + i + '.jpg'; fs.writeFileSync(path.join(dir, f), 'IMG'); rels.push('images/' + f); }
  return rels;
}
function addScript(pid) { const m = S.loadManifest(base, persona, pid); m.scripts = [{ name: 'S1', text: 'Bonjour', duree: '23s' }]; S.saveManifest(base, persona, pid, m, now()); }
const deps = { base, persona, store: S, now, generate: fakeGenerate, generateVideo: () => 'videos/final.mp4', lookbook: { pricing: { eur_per_credit: 0.058, ops: { image_eco: 1, video30s: 5 } } }, libItems: () => [{ label: 'Robe', img: 'r.jpg' }] };
const C = createController(deps);

const POINTER_KEYS = ['projectId', 'flow', 'step', 'candIdx', 'libKey', 'libPage', 'picker', 'pendingSlice', 'pendingGen'];
const uiPointers = () => Object.keys(C.ui).every(k => POINTER_KEYS.indexOf(k) >= 0);
chk('E122 : état UI = pointeurs uniquement', uiPointers());

// PHASE PHOTO
C.dispatch('go:photo'); const pid = C.ui.projectId;
chk('(A) go:photo crée UN projet', !!pid && C.ui.flow === 'photo');
C.dispatch('NB_2'); C.dispatch('SRC_NEW'); C.dispatch('GEN_CONFIRM');
// E123 — rejeter une image NE la met PAS en média actif ni en livrable
C.dispatch('CAND_REJECT');
let mRej = S.loadManifest(base, persona, pid);
chk('E123 : rejeter -> trace rejetées, PAS média actif, PAS livrable', mRej.rejetees.length === 1 && mRej.media_actif === null && mRej.livrables.image === null);
// E123 — garder -> image active (média actif = source) sans devenir livrable tant que non promue
C.dispatch('CAND_KEEP');
chk('média actif persisté après GARDER (propagation)', S.loadManifest(base, persona, pid).media_actif === 'images/cand0.jpg');
chk('E123 : garder ne met PAS auto en livrable', S.loadManifest(base, persona, pid).livrables.image === null);
chk('après CAND_KEEP on reste sur SOURCE (pas de saut)', C.ui.step === 'source');
C.dispatch('CAND_DELIVER');
chk('E123 : CAND_DELIVER -> livrable image EXPLICITE', S.loadManifest(base, persona, pid).livrables.image === 'images/cand0.jpg');
C.dispatch('V'); chk('photo: source->parametres', C.ui.step === 'parametres');
C.dispatch('V'); chk('photo: parametres->finaliser', C.ui.step === 'finaliser');
C.dispatch('V'); chk('photo: finaliser bloqué sans QC', C.ui.step === 'finaliser');
C.dispatch('QC_RUN'); C.dispatch('V');
chk('(A) photo finaliser -> phase VIDÉO (sans rupture)', C.ui.flow === 'video');
chk('(A) un seul projet (même id en phase vidéo)', C.ui.projectId === pid);
chk('(A) projet RESTE en cours (brouillon) après image finalisée', S.loadManifest(base, persona, pid).statut_qualite === 'brouillon');
chk('(A) VIDÉO source auto-satisfaite -> parametres', C.ui.step === 'parametres');

// (A) UN SEUL PROJET (avant finalisation) : go:video et go:photo = MÊME projet
C.dispatch('go:video'); const pidV = C.ui.projectId; C.dispatch('go:photo'); const pidP = C.ui.projectId;
chk('(A) go:video et go:photo = MÊME projet (jamais 2 projets)', pidV === pid && pidP === pid);

// Script vidéo (écrit dans le manifest = source de vérité)
addScript(pid);

// (A) RÉVERSIBILITÉ : depuis VIDÉO·source, revenir à PHOTO sans rien perdre
C.ui.flow = 'video'; C.ui.step = 'source'; C.dispatch('BACK');
chk('(A) réversible : VIDÉO·source --BACK--> PHOTO·finaliser', C.ui.flow === 'photo' && C.ui.step === 'finaliser');
chk('(A) script vidéo conservé après retour photo', S.loadManifest(base, persona, pid).scripts.length === 1);

// E115 : modifier le look avec aval vidéo existant -> Conserver/MàJ/Régénérer
let r2 = C.dispatch('SET_tenue=Robe noire');
chk('E115 : modif look avec aval -> écran IMPACT', C.ui.step === 'impact' && cbs(r2.render).indexOf('PX_KEEP') >= 0);
chk('E115 : modif écrite dans le manifest', S.loadManifest(base, persona, pid).look.tenue === 'Robe noire');
C.dispatch('PX_KEEP');
chk('E115 : PX_KEEP conserve l\'aval (script intact)', S.loadManifest(base, persona, pid).scripts.length === 1 && C.ui.step !== 'impact');
C.dispatch('SET_tenue=Tailleur'); C.dispatch('PX_REGEN');
chk('E115 : PX_REGEN réinitialise l\'aval (script effacé EXPLICITEMENT)', S.loadManifest(base, persona, pid).scripts.length === 0);

// FINALISATION VIDÉO -> PRÊT-À-POSTER (livrable final)
addScript(pid);
C.ui.flow = 'video'; C.ui.step = 'finaliser'; C.dispatch('QC_FORCE');
let rconf = C.dispatch('V');
chk('LOT1 : vidéo finaliser -> CONFIRMATION coût (pas de dépense directe)', C.ui.step === 'confirm' && cbs(rconf.render).indexOf('GEN_CONFIRM') >= 0 && S.loadManifest(base, persona, pid).statut_publication !== 'pret_a_poster');
C.dispatch('GEN_CONFIRM');
let mvf = S.loadManifest(base, persona, pid);
chk('(A) vidéo confirmée -> PRÊT-À-POSTER + livrable vidéo', mvf.statut_publication === 'pret_a_poster' && mvf.statut_qualite === 'production' && mvf.livrables.video === 'videos/final.mp4');

// RESTART : nouveau contrôleur, même store
const C2 = createController(deps); C2.dispatch('OPEN_' + pid);
chk('restart : média actif retrouvé', S.loadManifest(base, persona, pid).media_actif === 'images/cand0.jpg');
chk('restart : E122 pointeurs only', Object.keys(C2.ui).every(k => POINTER_KEYS.indexOf(k) >= 0));

// NOUVEAU archive l'ancien
S.archiveProject(base, persona, pid, now());
const C3 = createController(deps); C3.dispatch('go:photo');
chk('Nouveau : projet distinct ; ancien archivé conservé', C3.ui.projectId !== pid && S.loadManifest(base, persona, pid).statut_publication === 'archive');
chk('E122 final : toujours pointeurs only', uiPointers());

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

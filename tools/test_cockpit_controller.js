// [cockpit-v4] Test contrôleur : GARDE-FOU E122 (UI = pointeurs seulement), propagation média, QC, validation, biblios, reprise.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'ctrl_'));
const persona = 'imany';
let t = Date.parse('2026-06-10T09:00:00Z');
const now = () => (t += 1000);

// Génération simulée : crée un fichier candidat dans le dossier projet et renvoie son chemin relatif.
function fakeGenerate(flow, m) {
  const dir = path.join(S.projectDir(base, persona, m.projectId), 'images');
  fs.mkdirSync(dir, { recursive: true });
  const rels = [];
  for (let i = 0; i < (m.parametres.nb_images || 1); i++) { const f = 'cand' + i + '.jpg'; fs.writeFileSync(path.join(dir, f), 'IMG'); rels.push('images/' + f); }
  return rels;
}
const libData = { looks: [{ label: 'Robe noire', img: 'r.jpg' }, { label: 'Tailleur', img: 't.jpg' }] };
const deps = { base, persona, store: S, now, generate: fakeGenerate, libItems: (k) => libData[k] || [] };

const C = createController(deps);

// GARDE-FOU E122 : l'état d'UI ne contient QUE des pointeurs (aucune donnée métier)
const POINTER_KEYS = ['projectId', 'flow', 'step', 'candIdx', 'libKey', 'libPage', 'picker'];
function uiOnlyPointers() { return Object.keys(C.ui).every(k => POINTER_KEYS.indexOf(k) >= 0); }
chk('E122 : état UI = pointeurs uniquement (au départ)', uiOnlyPointers());

// 1. go:photo -> projet créé DANS le store ; pointeur projectId posé ; étape source
let r = C.dispatch('go:photo');
chk('1. go:photo -> projet créé dans le store', !!C.ui.projectId && !!S.loadManifest(base, persona, C.ui.projectId));
chk('1. étape = source (reconstruite)', C.ui.step === 'source');
chk('1. Valider VERROUILLÉ (pas de média réel)', cbs(r.render).indexOf('V_LOCK') >= 0);

// 2. NB_2 -> écrit dans le MANIFEST, pas dans l'UI
C.dispatch('NB_2');
chk('2. nb_images écrit dans le manifest (pas UI)', S.loadManifest(base, persona, C.ui.projectId).parametres.nb_images === 2);
chk('2. état UI toujours pointeurs only', uiOnlyPointers());

// 3. SRC_NEW (génération simulée) -> candidats DANS le manifest ; CAND_PICK -> média actif dans le dossier
C.dispatch('SRC_NEW');
chk('3. candidats écrits dans le manifest', (S.loadManifest(base, persona, C.ui.projectId).image_candidates || []).length === 2);
C.dispatch('CAND_NEXT'); r = C.dispatch('CAND_PICK');
let m3 = S.loadManifest(base, persona, C.ui.projectId);
chk('3. CAND_PICK -> média ACTIF persisté (propagation C.4/E37)', m3.media_actif === 'images/cand1.jpg');
chk('3. Valider DÉBLOQUÉ après média réel', cbs(C.dispatch('CAND_PICK').render).indexOf('V') >= 0 || cbs(C.render()).indexOf('V') >= 0);

// 4. Valider source -> parametres ; Paramètres = picker focalisé (P_TENUE) écrit via picker
r = C.dispatch('V'); chk('4. Valider(source) -> parametres', C.ui.step === 'parametres');
r = C.dispatch('P_TENUE'); chk('4. P_TENUE ouvre un picker focalisé (1 décision)', C.ui.step === 'picker' && C.ui.picker === 'tenue');
C.dispatch('BACK'); chk('4. retour picker -> parametres', C.ui.step === 'parametres');

// 5. Valider parametres -> finaliser ; FINALISER bloqué tant que QC absent
r = C.dispatch('V'); chk('5. Valider(parametres) -> finaliser', C.ui.step === 'finaliser');
chk('5. FINALISER : Valider verrouillé sans QC (C4/E92)', cbs(C.render()).indexOf('V_LOCK') >= 0);
r = C.dispatch('V'); chk('5. V verrouillé renvoie une notice (pas d\'avance)', !!r.notice && C.ui.step === 'finaliser');

// 6. QC_RUN -> enregistré dans le dossier + rapport QC ; puis Valider finalise (statut publication)
C.dispatch('QC_RUN');
let m6 = S.loadManifest(base, persona, C.ui.projectId);
chk('6. QC enregistré dans le dossier + rapport (E93)', m6.qc && m6.qc.verdict === 'ok' && m6.rapport_qc.length >= 1);
r = C.dispatch('V');
let m6b = S.loadManifest(base, persona, C.ui.projectId);
chk('6. Final HD -> statut publication=pret_a_poster (dans le store)', m6b.statut_publication === 'pret_a_poster' && m6b.statut_qualite === 'production');

// 7. Bibliothèque : consulter (LV_) n'écrit RIEN ; appliquer (LA_) écrit le look (verrou 6 / anti-A1)
const lookBefore = JSON.stringify(S.loadManifest(base, persona, C.ui.projectId).look);
C.dispatch('go:studio'); C.dispatch('LV_looks_0');
chk('7. consulter (LV_) = aucune mutation du projet', JSON.stringify(S.loadManifest(base, persona, C.ui.projectId).look) === lookBefore);
C.dispatch('LA_looks_0');
chk('7. appliquer (LA_) EXPLICITE écrit le look dans le manifest', S.loadManifest(base, persona, C.ui.projectId).look.tenue === 'Robe noire');

// 8. REPRISE simulée (restart) : nouveau contrôleur, même store -> média actif & QC retrouvés (UI ne détenait rien)
const C2 = createController(deps);
C2.dispatch('OPEN_' + C.ui.projectId);
let m8 = S.loadManifest(base, persona, C.ui.projectId);
chk('8. après "restart" : média actif retrouvé depuis le dossier', m8.media_actif === 'images/cand1.jpg');
chk('8. après "restart" : étape reconstruite = finaliser (QC ok)', C2.ui.step === 'finaliser');
chk('8. E122 : aucune donnée critique n\'était dans l\'UI', uiOnlyPointers() && Object.keys(C2.ui).every(k => POINTER_KEYS.indexOf(k) >= 0));

// 9. « Nouveau » archive l'ancien (jamais détruit)
S.archiveProject(base, persona, C.ui.projectId, now());
const C3 = createController(deps); C3.dispatch('go:photo');
chk('9. Nouveau projet distinct ; l\'ancien archivé conservé', C3.ui.projectId !== C.ui.projectId && S.loadManifest(base, persona, C.ui.projectId).statut_publication === 'archive');

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

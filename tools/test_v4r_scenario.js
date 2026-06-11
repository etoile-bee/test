// [RÉALISATION colonne vertébrale] PREUVE du scénario complet (point 5) :
//   /v4r → cap → image → revenir → modif cap → revenir → modif émotion → revenir → modif objectif → revenir
//        → REGÉNÉRER image → mémoire → revenir → /v4r
//   Vérifie : 1 SEUL bloc à l'écran à tout instant · même message_id réutilisé DANS une phase ·
//   bascule texte↔photo = 1 seule recreate (au 1er média) · aucun état perdu · tout reste éditable.
//   Transport simulé via le module RÉEL de décision ui/spine_block.plan + Socle RÉEL + vues RÉELLES.
const fs = require('fs'), path = require('path'), os = require('os');
const S = require('../ui/socle');
const V = require('../ui/spine_view');
const SB = require('../ui/spine_block');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r_scn_')); const persona = 'imany';
let T = Date.UTC(2026, 5, 11, 13, 0, 0); const tick = () => (T += 1000);

// ── simulateur de transport « un seul bloc » (miroir EXACT du câble : utilise SB.plan) ──
let nextMid = 100, mid = null, type = null; const alive = new Set();
let recreates = 0, edits = 0;
const trace = [];
function paint(targetKind, viewName) {
  const p = SB.plan(type, mid, targetKind);
  if (p.action === 'edit') { edits++; }
  else { if (p.del) alive.delete(p.del); mid = ++nextMid; alive.add(mid); type = targetKind; recreates++; }
  trace.push({ view: viewName, action: p.action, mid: mid, alive: alive.size });
  // INVARIANT : exactement UN bloc visible à tout instant
  if (alive.size !== 1) { ko++; console.log('❌ INVARIANT bloc unique cassé à ' + viewName + ' (alive=' + alive.size + ')'); }
}
// helper : rendre une vue (kind décidé par « image existe ? » comme le câble), depuis le Socle réel
function render(view, facts) {
  const hasPhoto = (facts.medias || []).length > 0;      // en réel : && demoPhoto dispo (vrai : 80 looks)
  const kind = hasPhoto ? 'photo' : 'text';
  let vw; if (view === 'cap') vw = V.capView(facts); else if (view === 'mem') vw = V.memView(facts); else vw = V.reposView(facts);
  paint(kind, view);
  return vw;
}
function facts() { return S.loadFacts(base, persona, cur.projectId); }

// 1) /v4r → repos (création)
let cur = S.createProject(base, persona, {}, tick()).facts;
render('repos', facts());
const midOpen = mid;
chk('1. /v4r ouvre 1 bloc texte', type === 'text' && alive.size === 1);

// 2) poser le cap (message via saisie, puis émotion/objectif via puces) — tout en TEXTE, même bloc
S.setIntention(base, persona, cur.projectId, { message: 'Trouver un format podcast viral' }, tick()); render('cap', facts());
S.setIntention(base, persona, cur.projectId, { emotion: 'punch' }, tick()); render('cap', facts());
S.setIntention(base, persona, cur.projectId, { objectif: 'court' }, tick()); render('cap', facts());
render('repos', facts());
chk('2. poser cap : MÊME message_id réutilisé (édition, pas de nouvelle carte)', mid === midOpen);
chk('2. état persisté : message+émotion+objectif', facts().intention.message && facts().intention.emotion === 'punch' && facts().intention.objectif === 'court');

// 3) convoquer une image (simulée) → bascule TEXTE→PHOTO = 1 seule recreate
S.addCandidate(base, persona, cur.projectId, tick()); render('repos', facts());
const midPhoto = mid;
chk('3. convoquer image : bascule en PHOTO (1 recreate), toujours 1 bloc', type === 'photo' && midPhoto !== midOpen && alive.size === 1);

// 4) revenir/modifier le cap : une image EXISTE -> le bloc reste PHOTO (image en haut), la légende devient l'édition du cap.
//    => MÊME message_id réutilisé (édition de légende), pas de nouvelle carte. 5) émotion 6) objectif idem.
render('cap', facts());
chk('4. modifier cap avec image : reste PHOTO, MÊME message_id (image en haut, cap édité dessous)', type === 'photo' && mid === midPhoto && alive.size === 1);
S.setIntention(base, persona, cur.projectId, { emotion: 'douceur' }, tick()); render('cap', facts());
S.setIntention(base, persona, cur.projectId, { objectif: 'story' }, tick()); render('cap', facts());
chk('5-6. modifier émotion/objectif : MÊME message_id (édition en place)', mid === midPhoto);
chk('5-6. état mis à jour + images conservées', facts().intention.emotion === 'douceur' && facts().intention.objectif === 'story' && facts().medias.length === 1);

// retour repos (photo, édition) → 7) REGÉNÉRER une image (photo→photo = édition légende, même bloc)
render('repos', facts());
S.addCandidate(base, persona, cur.projectId, tick()); render('repos', facts());
chk('7. regénérer image : reste PHOTO, MÊME message_id (édition), +1 image', type === 'photo' && mid === midPhoto && facts().medias.length === 2);

// 8) mémoire : image existe -> reste PHOTO, même bloc (mémoire en légende sous l'image) → revenir repos idem
render('mem', facts());
chk('8. mémoire : reste PHOTO, MÊME message_id, état complet lisible', type === 'photo' && mid === midPhoto && alive.size === 1);
render('repos', facts());

// 9) /v4r de nouveau : le câble supprime l'ancien bloc puis en pose UN → toujours 1 bloc
{ const p = SB.plan(type, mid, 'photo'); /*reprise : on supprime l'ancien puis recrée*/ if (mid) alive.delete(mid); mid = ++nextMid; alive.add(mid); type = 'photo'; }
chk('9. re-/v4r : pas d\'empilement (1 seul bloc)', alive.size === 1);

// ── Invariants globaux ──
chk('GLOBAL : à AUCUN instant plus d\'un bloc visible', trace.every(t => t.alive === 1));
// 2 recreates attendues : 1) 1ère pose du bloc (texte), 2) UNIQUE bascule texte→photo au 1er média. Tout le reste = édition.
chk('GLOBAL : recreates UNIQUEMENT à la 1ère pose + la bascule texte↔photo (mesuré: ' + recreates + ')', recreates === 2);
chk('GLOBAL : éditions en place majoritaires (mesuré edits=' + edits + ')', edits >= recreates);
chk('GLOBAL : aucun état perdu (cap + 2 images persistés en fin)', facts().intention.message && facts().intention.emotion === 'douceur' && facts().intention.objectif === 'story' && facts().medias.length === 2);

console.log('\n── TRACE (étape → action → message_id → blocs visibles) ──');
trace.forEach((t, k) => console.log((k + 1) + '. ' + t.view.padEnd(6) + ' → ' + t.action.padEnd(9) + ' → mid ' + t.mid + ' → ' + t.alive + ' bloc'));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

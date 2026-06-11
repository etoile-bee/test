// [RÉALISATION colonne vertébrale] PREUVE du flux OPTION A (création visible), point 5 :
//   /v4r → ✨ Créer une image (1 tap) → la VOIR (carte photo) → 🎬 Faire une vidéo → la VOIR (carte vidéo,
//   MÊME bloc via editMessageMedia) → ✍️ Cap / 🗂 Mémoire toujours là (compacts) → reprendre /v4r → tout persiste.
//   Vérifie : 1 SEUL bloc à tout instant · image puis vidéo au centre · le cap n'est JAMAIS un gate ·
//   bascule texte→média = 1 seule recreate (au 1er média) · image↔vidéo = édition EN PLACE (même message_id) ·
//   aucun état perdu · pas d'empilement. Transport via le module RÉEL ui/spine_block.plan + Socle + vues réels.
const fs = require('fs'), path = require('path'), os = require('os');
const S = require('../ui/socle');
const V = require('../ui/spine_view');
const C = require('../ui/conscience');
const SB = require('../ui/spine_block');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r_scn_')); const persona = 'imany';
let T = Date.UTC(2026, 5, 11, 13, 0, 0); const tick = () => (T += 1000);

// ── simulateur de transport « un seul bloc » (miroir EXACT du câble : utilise SB.plan) ──
let nextMid = 100, mid = null, type = null; const alive = new Set();
let recreates = 0, edits = 0, editMedias = 0;
const trace = [];
function paint(targetKind, viewName) {
  const p = SB.plan(type, mid, targetKind);
  if (p.action === 'edit') { edits++; }
  else if (p.action === 'editMedia') { editMedias++; type = targetKind; } // swap photo↔vidéo EN PLACE, même mid
  else { if (p.del) alive.delete(p.del); mid = ++nextMid; alive.add(mid); type = targetKind; recreates++; }
  trace.push({ view: viewName, action: p.action, kind: targetKind, mid: mid, alive: alive.size });
  if (alive.size !== 1) { ko++; console.log('❌ INVARIANT bloc unique cassé à ' + viewName + ' (alive=' + alive.size + ')'); }
}
// le KIND est décidé par la Conscience (vidéo > image > texte), comme le câble réel
function render(view, facts) { paint(C.mediaKind(facts), view); return view; }
function facts() { return S.loadFacts(base, persona, cur.projectId); }

// 1) /v4r → repos (création), AUCUN média -> bloc TEXTE mené par « Créer »
let cur = S.createProject(base, persona, {}, tick()).facts;
render('repos', facts());
const midOpen = mid;
chk('1. /v4r ouvre 1 bloc TEXTE mené par la création', type === 'text' && alive.size === 1);
chk('1. le cap n\'est PAS un passage obligé (geste primaire = Créer)', V.reposView(facts()).rows[0][0].cb === 'R0_IMG');

// 2) ✨ Créer une image (1 tap) -> bascule TEXTE→PHOTO = 1 seule recreate, image VISIBLE
S.addCandidate(base, persona, cur.projectId, tick(), 'image'); render('repos', facts());
const midPhoto = mid;
chk('2. créer image : on la VOIT (carte photo), 1 recreate, toujours 1 bloc', type === 'photo' && midPhoto !== midOpen && alive.size === 1);

// 3) 🎬 Faire une vidéo -> image DEVIENT vidéo dans le MÊME bloc (editMessageMedia), vidéo VISIBLE
S.addCandidate(base, persona, cur.projectId, tick(), 'video'); render('repos', facts());
chk('3. faire vidéo : on la VOIT (carte vidéo), MÊME message_id (swap en place)', type === 'video' && mid === midPhoto && alive.size === 1);
chk('3. la vidéo est bien une manifestation enregistrée (fait)', C.hasVideo(facts()) && C.hasImage(facts()));

// 4) ✍️ Cap toujours accessible (compact) — une vidéo existe -> reste bloc VIDÉO, légende éditée, même mid
S.setIntention(base, persona, cur.projectId, { message: 'Format punchy', emotion: 'punch' }, tick()); render('cap', facts());
chk('4. cap accessible APRÈS coup : reste VIDÉO, MÊME message_id (édition légende)', type === 'video' && mid === midPhoto);
chk('4. le cap ancre le sens sans rien casser (état persisté)', facts().intention.message === 'Format punchy' && facts().intention.emotion === 'punch');

// 5) 🗂 Mémoire toujours accessible (compact), même bloc
render('mem', facts());
chk('5. mémoire accessible : reste VIDÉO, MÊME message_id, état complet lisible', type === 'video' && mid === midPhoto && alive.size === 1);

// 6) 🔁 Regénérer l'image -> on revient à une carte PHOTO dans le MÊME bloc (swap vidéo→photo en place)
S.addCandidate(base, persona, cur.projectId, tick(), 'image'); render('repos', facts());
chk('6. regénérer image : repasse en PHOTO, MÊME message_id (swap en place)', type === 'photo' && mid === midPhoto && alive.size === 1);

// 7) /v4r de nouveau : le câble supprime l'ancien bloc puis en pose UN -> toujours 1 bloc, tout persiste
{ if (mid) alive.delete(mid); mid = ++nextMid; alive.add(mid); type = (C.mediaKind(facts()) === 'video' ? 'video' : 'photo'); }
chk('7. re-/v4r : pas d\'empilement (1 seul bloc) + état persistant', alive.size === 1 && C.hasVideo(facts()) && C.hasImage(facts()) && facts().intention.message === 'Format punchy');

// ── Invariants globaux ──
chk('GLOBAL : à AUCUN instant plus d\'un bloc visible', trace.every(t => t.alive === 1));
// 2 recreates : (1) la 1ère pose (repos texte mené par « Créer »), (2) l'UNIQUE bascule texte→média au 1er média.
// Ensuite image↔vidéo se font TOUJOURS en place (editMedia) : jamais de nouvelle carte.
chk('GLOBAL : 2 recreates (1ère pose texte + bascule texte→média) [mesuré: ' + recreates + ']', recreates === 2);
chk('GLOBAL : image↔vidéo = swaps EN PLACE (editMedia, même bloc) [mesuré: ' + editMedias + ']', editMedias >= 2);
chk('GLOBAL : éditions/ swaps en place majoritaires [edit=' + edits + ' editMedia=' + editMedias + ']', (edits + editMedias) >= recreates);
chk('GLOBAL : aucun état perdu (cap + image + vidéo persistés)', facts().intention.message === 'Format punchy' && C.hasImage(facts()) && C.hasVideo(facts()));

console.log('\n── TRACE (étape → action → nature → message_id → blocs visibles) ──');
trace.forEach((t, k) => console.log((k + 1) + '. ' + t.view.padEnd(6) + ' → ' + t.action.padEnd(10) + ' → ' + t.kind.padEnd(6) + ' → mid ' + t.mid + ' → ' + t.alive + ' bloc'));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

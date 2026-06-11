// [RÉALISATION — RÉFÉRENCE PRODUIT] PREUVE des 3 parcours (auto-test) :
//   1) photo seule · 2) vidéo depuis photo existante · 3) vidéo en générant d'abord une photo (retour auto Vidéo→Photo→Vidéo).
//   Pilote la VRAIE logique : ui/nav.reduce (décision) + ui/nav.applyOp (mutation Socle) + ui/nav.view (vue) +
//   ui/spine_block.plan (transport UN bloc). PROUVE : aucun état perdu · aucune carte empilée (1 bloc à tout instant) ·
//   bascule texte→média = recreate ; image↔vidéo = editMedia EN PLACE (même message_id) · projet unique · aperçu visible.
const fs = require('fs'), path = require('path'), os = require('os');
const S = require('../ui/socle');
const C = require('../ui/conscience');
const NAV = require('../ui/nav');
const SB = require('../ui/spine_block');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r_nav_')); const persona = 'imany';
let T = Date.UTC(2026, 5, 11, 13, 0, 0); const tick = () => (T += 1000);
const CTX = { looks: ['Look A', 'Look B'], decors: ['Décor X'], avatars: ['Imany'], sections: [], section: null, recents: { projets: [], brouillons: [], archives: [], legacy: 0 } };

// ── transport « un seul bloc » (miroir EXACT du câble : SB.plan, kind = vue) ──
let nextMid = 100, mid = null, type = null; const alive = new Set();
let recreates = 0, edits = 0, editMedias = 0; const trace = [];
function paint(kind, label) {
  const p = SB.plan(type, mid, kind);
  if (p.action === 'edit') edits++;
  else if (p.action === 'editMedia') { editMedias++; type = kind; }
  else { if (p.del) alive.delete(p.del); mid = ++nextMid; alive.add(mid); type = kind; recreates++; }
  trace.push({ label: label, action: p.action, kind: kind, mid: mid, alive: alive.size });
  if (alive.size !== 1) { ko++; console.log('❌ EMPILEMENT à ' + label + ' (alive=' + alive.size + ')'); }
}

let st = { screen: 'home', section: null, block: null, ret: null };
let curId = null;
function facts() { return S.loadFacts(base, persona, curId); }
function ctx() { CTX.recents = S.listProjects(base, persona).length ? { projets: S.listProjects(base, persona) } : CTX.recents; return CTX; }
// un « tap » : reduce -> applyOp -> maj état -> rendu (kind via la vue) -> transport
function tap(action) {
  const f = facts();
  const res = NAV.reduce(action, st, f, ctx());
  if (res.op) NAV.applyOp(res.op, S, base, persona, curId, f, ctx(), tick());
  st = res.st;
  const vw = NAV.view(st, facts(), ctx());
  paint(vw.kind || 'text', st.screen + (st.block ? ('/' + st.block.key) : ''));
  return res;
}
// saisie texte (ASK) : écrit puis revient au parent (comme le câble)
function typeText(ask, txt) {
  const map = NAV.ASKMAP[ask];
  if (map.target === 'pub') S.setPublication(base, persona, curId, { [map.field]: txt }, tick());
  else S.setDraft(base, persona, curId, map.kind, { [map.field]: txt }, tick());
  st.block = null; st.screen = NAV.parentOfAsk(ask);
  const vw = NAV.view(st, facts(), ctx()); paint(vw.kind || 'text', st.screen);
}

// ═══════════ SCÉNARIO 1 — PHOTO SEULE ═══════════
console.log('\n━━ Scénario 1 : photo seule ━━');
curId = S.createProject(base, persona, {}, tick()).facts.projectId;
st = { screen: 'home', section: null, block: null, ret: null };
paint('text', 'home'); const midOpen = mid;
tap('R0_PHOTO'); chk('1. Accueil→Photo : bloc texte (aucune photo), 1 bloc', type === 'text' && alive.size === 1);
tap('R0_PH_GEN'); // → photo_prompt
tap('R0_PHB_prompt'); // → bloc prompt
typeText('ph_prompt', 'portrait studio chaleureux'); chk('1. prompt saisi et intégré au brouillon', S.getDraft(facts(), 'photo').prompt === 'portrait studio chaleureux');
tap('R0_SET_phlook_0'); chk('1. look choisi via puce (depuis l\'existant)', S.getDraft(facts(), 'photo').look === 'Look A');
const rGen = tap('R0_PH_GENERATE'); chk('1. ✨ Générer -> CONFIRMATION de coût (AUCUNE dépense directe)', st.screen === 'confirm' && !rGen.op && !C.hasImage(facts()));
tap('R0_GO'); chk('1. ✅ Validé : on VOIT la photo (carte photo)', type === 'photo' && C.hasImage(facts()) && alive.size === 1);
chk('1. la photo porte le prompt + le look (matière reliée au dossier)', (C.lastImage(facts()).prompt === 'portrait studio chaleureux') && (C.lastImage(facts()).look === 'Look A'));
tap('R0_PH_KEEP'); chk('1. ✅ Garder : photo validée, même bloc', C.lastImage(facts()).etat === 'garde' && mid !== midOpen);

// ═══════════ SCÉNARIO 2 — VIDÉO DEPUIS PHOTO EXISTANTE (même projet) ═══════════
console.log('\n━━ Scénario 2 : vidéo depuis photo existante ━━');
const midPhoto2 = mid;
tap('R0_VIDEO'); chk('2. Photo→Vidéo : photo source visible (même bloc, édité)', type === 'photo' && mid === midPhoto2);
tap('R0_VI_PICK'); chk('2. 🔄 Remplacer -> choix source', st.screen === 'video_source');
tap('R0_VI_GAL'); chk('2. 🖼 Choisir -> galerie (choix réel de la photo, pas d\'impasse)', st.screen === 'gallery');
tap('R0_GITEM_0'); chk('2. sélection en galerie -> source POSÉE + RETOUR AUTO au flux (video_params)', st.screen === 'video_params' && /Photo #1/.test(S.getDraft(facts(), 'video').source || ''));
tap('R0_VIB_mouvement'); tap('R0_SET_vimouv_0'); chk('2. mouvement choisi', S.getDraft(facts(), 'video').mouvement === 'zoom lent');
const rVgen = tap('R0_VI_GENERATE'); chk('2. 🎬 Générer vidéo -> CONFIRMATION de coût (payant, gaté)', st.screen === 'confirm' && !rVgen.op && !C.hasVideo(facts()));
tap('R0_GO'); chk('2. ✅ Validé : on VOIT la vidéo, MÊME message_id (swap en place)', type === 'video' && mid === midPhoto2 && C.hasVideo(facts()));
tap('R0_VI_KEEP'); chk('2. vidéo gardée + image conservée (rien perdu)', C.lastVideo(facts()).etat === 'garde' && C.hasImage(facts()));
tap('R0_PUB'); chk('2. → Publication (même bloc vidéo)', st.screen === 'publication' && type === 'video');
const before = JSON.stringify(facts().publication);
tap('R0_PUB_DO'); chk('2. 📤 Publier -> Archives publiées (média marqué « publie », envoi réel gaté)', st.screen === 'publies' && (C.medias(facts()) || []).some(m => m.etat === 'publie') && !facts().publication.publie_le);

// ═══════════ SCÉNARIO 3 — VIDÉO EN GÉNÉRANT D'ABORD UNE PHOTO (retour auto) ═══════════
console.log('\n━━ Scénario 3 : vidéo en générant la photo (retour auto) ━━');
curId = S.createProject(base, persona, {}, tick()).facts.projectId; // nouveau projet
st = { screen: 'home', section: null, block: null, ret: null }; paint('text', 'home(P2)');
tap('R0_VIDEO'); chk('3. Vidéo sans média : bloc texte sobre (pas de placeholder)', type === 'text');
tap('R0_VI_GENPHOTO'); chk('3. ✨ Générer photo source : va en Photo/Prompt + retour armé', st.screen === 'photo_prompt' && st.ret === 'video');
tap('R0_PH_GENERATE'); chk('3. confirmation de coût avant la photo source', st.screen === 'confirm');
tap('R0_GO'); // produit la photo PUIS revient AUTO à Vidéo, source posée
chk('3. RETOUR AUTO à VIDÉO avec la photo comme source', st.screen === 'video' && st.ret == null && S.getDraft(facts(), 'video').source === 'photo générée');
chk('3. la photo source est VISIBLE (carte photo)', type === 'photo' && C.hasImage(facts()));
tap('R0_VI_CREATE'); tap('R0_VI_GENERATE'); tap('R0_GO'); chk('3. vidéo générée et VISIBLE (swap en place)', type === 'video' && C.hasVideo(facts()) && alive.size === 1);

// ═══════════ INVARIANTS GLOBAUX ═══════════
console.log('\n━━ Invariants globaux ━━');
chk('GLOBAL : à AUCUN instant plus d\'un bloc visible (aucune carte empilée)', trace.every(t => t.alive === 1));
chk('GLOBAL : image↔vidéo = swaps EN PLACE (editMedia) [mesuré: ' + editMedias + ']', editMedias >= 2);
chk('GLOBAL : recreates UNIQUEMENT à l\'ouverture + bascule texte→média [mesuré: ' + recreates + ']', recreates >= 3 && recreates <= 5);
chk('GLOBAL : projet unique par parcours (2 projets créés au total : S1+S2 puis S3)', S.listProjects(base, persona).length === 2);
chk('GLOBAL : aucun état perdu (P1: prompt+look+image+vidéo+pub gatée)', (() => { const p = S.listProjects(base, persona).find(x => (x.medias || []).some(m => m.type === 'video')); return p && C.hasImage(p) && C.hasVideo(p); })());

console.log('\n── TRACE (étape → action → nature → message_id → blocs visibles) ──');
trace.forEach((t, k) => console.log((k + 1) + '. ' + t.label.padEnd(20) + ' → ' + t.action.padEnd(10) + ' → ' + t.kind.padEnd(6) + ' → mid ' + t.mid + ' → ' + t.alive + ' bloc'));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

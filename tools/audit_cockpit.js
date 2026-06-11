// [PRÉ-VALIDATION] AUDIT EXHAUSTIF du cockpit /v4r — pilote le reducer RÉEL (nav.reduce/applyOp) + socle + vues + oracle transport.
//   Simulation pure (LIVE off, ZÉRO dépense). Produit : inventaire écran-par-écran, doublons de boutons,
//   présence Retour/Suivant, libellés longs, JSON brut, + STRESS transport (alive=1, aucun orphelin).
const fs = require('fs'), path = require('path'), os = require('os');
const S = require('../ui/socle');
const C = require('../ui/conscience');
const NAV = require('../ui/nav');
const SC = require('../ui/screens');
const SB = require('../ui/spine_block');

function flat(v) { return [].concat.apply([], v.rows || []); }
function cbsOf(v) { return flat(v).map(b => b.cb); }
function txtsOf(v) { return flat(v).map(b => b.text); }

// ── jeux de faits représentatifs ──
const now = Date.UTC(2026, 5, 11, 13, 0, 0);
const F = {
  vide: S.defaultFacts('imany', 'p0', now),
  img: (() => { const f = S.defaultFacts('imany', 'p1', now); f.intention.message = 'Format viral'; f.medias = [{ id: 'm1', etat: 'candidate', type: 'image', prompt: 'p', look: 'Soiree #1' }]; f.draft = { photo: { prompt: 'p', look: 'Soiree #1' }, video: {} }; return f; })(),
  vid: (() => { const f = S.defaultFacts('imany', 'p2', now); f.intention.message = 'Format viral'; f.medias = [{ id: 'm1', etat: 'candidate', type: 'image' }, { id: 'm2', etat: 'candidate', type: 'video', source: 'Photo #1', script: 's', duree: '30s' }]; f.draft = { video: { source: 'Photo #1', duree: '30s' } }; return f; })(),
};
const CTX = { looks: ['Soiree #1', 'Soiree #2', 'Soiree #3'], decors: ['Studio'], avatars: ['Imany'],
  sections: ['avatars', 'looks', 'decors', 'voix', 'prompts', 'templates', 'references', 'parametres'].map(k => ({ key: k, icon: '•', label: k, count: 2, items: ['a', 'b'], source: 'x', vide: false })),
  section: { icon: '👗', label: 'Looks', count: 3, items: ['Soiree #1', 'Soiree #2'], source: 'outfits' },
  recents: { projets: [F.img, F.vid], brouillons: [F.vide], archives: [], legacy: 1 },
  confirm: { mediaKind: 'photo', est: { moteur: 'Seedream', credits: 0.48, eur: 0.028, gratuit: false }, live: false, budget: { tests: 0, credits: 0, max: 10, next: 1, exhausted: false } } };

// écran -> (facts) à utiliser pour le rendre
const SCREENS = [
  ['home', F.img], ['photo', F.img], ['photo_source', F.img], ['photo_prompt', F.img], ['photo_result', F.img],
  ['video', F.vid], ['video_params', F.vid], ['video_edit', F.vid], ['video_result', F.vid], ['publication', F.vid],
  ['studio', F.img], ['studio_section', F.img], ['recents', F.img], ['gallery', F.img], ['confirm', F.img], ['quit', F.img],
];
const BLOCKS = [
  ['photo', 'prompt'], ['photo', 'avatar'], ['photo', 'look'], ['photo', 'decor'], ['photo', 'refs'], ['photo', 'params'],
  ['video', 'source'], ['video', 'mouvement'], ['video', 'script'], ['video', 'voix'], ['video', 'musique'], ['video', 'legendes'], ['video', 'duree'], ['video', 'params'], ['video', 'soustitres'], ['pub', 'legende'],
];

// écrans "racine/sortie" (Accueil légitime, pas de Retour requis) vs "flux" (Retour requis, pas d'Accueil)
const ROOT = { home: 1 };
const FLOW = { photo_prompt: 1, video_params: 1, video_edit: 1, confirm: 1, block: 1, quit: 1 };

const report = { screens: [], dupes: [], noBack: [], noForward: [], longLabels: [], jsonLeak: [], orphan: [] };

function audit(label, v, isFlow) {
  const cbs = cbsOf(v), txts = txtsOf(v);
  const seen = {}, dup = [];
  cbs.forEach(c => { if (!c) return; if (seen[c]) dup.push(c); seen[c] = (seen[c] || 0) + 1; });
  const hasBack = cbs.some(c => /R0_(HOME|PHOTO|VIDEO|VIDEO_PARAMS|VI_RESULT|VE|STUDIO|GEN_CANCEL|QUIT_CANCEL|PHOTO$)/.test(c) || /R0_PHOTO$|R0_VIDEO$/.test(c));
  const backExplicit = txts.some(t => /Retour|◀|Revenir|Annuler|Éditer|Vidéo$|Photo$|Édition/.test(t)) || cbs.includes('R0_HOME') || cbs.includes('R0_GEN_CANCEL');
  const forward = cbs.some(c => /R0_(PH_GEN|PH_GENERATE|PH_USE|PH_TOVIDEO|VI_CREATE|VI_GENERATE|GO|PUB|PUB_DO|VI_KEEPLOOK)/.test(c)) || txts.some(t => /Suivant|Générer|Créer|Utiliser|Publier/.test(t));
  const long = txts.filter(t => t.length > 18);
  const jsonLeak = (/\{"|":/.test(v.caption)) || txts.some(t => /\{"|":/.test(t));
  if (dup.length) report.dupes.push({ screen: label, dup: dup });
  if (!backExplicit && !ROOT[label.split(':')[0]]) report.noBack.push(label);
  if (long.length) report.longLabels.push({ screen: label, labels: long });
  if (jsonLeak) report.jsonLeak.push(label);
  report.screens.push({ screen: label, kind: v.kind, nbtn: cbs.length, hasBack: backExplicit, hasForward: forward });
  return { dup: dup, backExplicit: backExplicit, forward: forward, long: long, jsonLeak: jsonLeak };
}

console.log('━━━━━ A/B/F. INVENTAIRE ÉCRANS (boutons · doublons · Retour · Suivant · libellés · JSON) ━━━━━');
SCREENS.forEach(([scr, f]) => { const st = { screen: scr, section: 'looks', block: null, pending: { kind: 'image', mediaKind: 'photo' } };
  const ctx = Object.assign({}, CTX); const v = NAV.view(st, f, ctx);
  const r = audit(scr, v, FLOW[scr]);
  console.log((scr).padEnd(15) + ' kind=' + String(v.kind).padEnd(5) + ' btn=' + String(cbsOf(v).length).padEnd(3) + ' back=' + (r.backExplicit ? '✅' : '❌') + ' fwd=' + (r.forward ? '✅' : '·') + (r.dup.length ? ' 🔴DUP:' + r.dup.join(',') : '') + (r.long.length ? ' ⚠️long:' + r.long.length : '') + (r.jsonLeak ? ' 🔴JSON' : ''));
});
console.log('\n━━━━━ blocs (sous-vues) ━━━━━');
BLOCKS.forEach(([scr, key]) => { const f = scr === 'video' ? F.vid : F.img; const v = NAV.view({ screen: 'block', block: { screen: scr, key: key } }, f, CTX);
  const r = audit('block:' + scr + '/' + key, v, true);
  console.log(('block ' + scr + '/' + key).padEnd(20) + ' btn=' + String(cbsOf(v).length).padEnd(3) + ' back=' + (r.backExplicit ? '✅' : '❌') + (r.dup.length ? ' 🔴DUP:' + r.dup.join(',') : '') + (r.long.length ? ' ⚠️long' : '') + (r.jsonLeak ? ' 🔴JSON' : ''));
});

// ── G/J. STRESS TRANSPORT 200× (miroir EXACT de r0Paint : edit / editMedia / recreate post-puis-supprime) ──
console.log('\n━━━━━ G/J. STRESS TRANSPORT (200 transitions aléatoires déterministes) ━━━━━');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'audit_')); const persona = 'imany';
let T = now; const tick = () => (T += 1000);
let curId = S.createProject(base, persona, {}, tick()).facts.projectId;
let st = { screen: 'home' };
// transport: mid/type/mediaPath, alive set
let nextMid = 100, mid = null, type = null, mediaPath = null; const alive = new Set();
let recreates = 0, edits = 0, editMedias = 0, maxAlive = 0; let orphanHits = 0;
function facts() { return S.loadFacts(base, persona, curId); }
function kindOf(view, f) { // miroir du câble : kind de la vue, photo réelle/mosaïque/démo -> 'photo'/'video'/'text'
  let k = view.kind || 'text';
  if (st.screen === 'gallery' || st.screen === 'recents') { const has = C.hasImage(f) || C.hasVideo(f) || true; k = 'photo'; } // mosaïque = média
  return k;
}
function paint(k, mpath, label) {
  // miroir r0Paint : meme nature -> edit (texte/caption) ; media<->media diff -> editMedia ; texte<->media -> recreate post-puis-supprime
  const isMediaNow = type === 'photo' || type === 'video', isMediaNext = k === 'photo' || k === 'video';
  if (mid && isMediaNow === isMediaNext && type === k) { edits++; mediaPath = mpath; }
  else if (mid && isMediaNow && isMediaNext) { editMedias++; type = k; mediaPath = mpath; }
  else { const old = mid; mid = ++nextMid; alive.add(mid); type = k; mediaPath = mpath; recreates++; if (old) alive.delete(old); }
  if (alive.size !== 1) { orphanHits++; }
  maxAlive = Math.max(maxAlive, alive.size);
}
function render() { const f = facts(); const ctx = Object.assign({}, CTX, { section: CTX.section }); const v = NAV.view(st, f, ctx); paint(kindOf(v, f), 'media', st.screen); if (cbsOf(v).length === 0) report.orphan.push(st.screen + ' (0 bouton)'); return v; }
// pose un 1er bloc
render();
// séquence d'actions déterministe couvrant tous les flux (200 pas)
const ACTIONS = ['R0_PHOTO', 'R0_PH_GEN', 'R0_PHB_look', 'R0_SET_phlook_0', 'R0_PH_GENERATE', 'R0_GO', 'R0_PH_KEEP', 'R0_PH_TOVIDEO', 'R0_VIB_mouvement', 'R0_SET_vimouv_0', 'R0_VI_GENERATE', 'R0_GO', 'R0_VI_KEEP', 'R0_PUB', 'R0_HOME', 'R0_RECENTS', 'R0_RE_OPEN_0', 'R0_PHOTO', 'R0_PH_GAL', 'R0_GITEM_0', 'R0_VIDEO', 'R0_VI_PICK', 'R0_GITEM_0', 'R0_VE', 'R0_VE_SUBS', 'R0_SET_ston_on', 'R0_STUDIO', 'R0_ST_looks', 'R0_HOME', 'R0_PHOTO', 'R0_PH_GEN', 'R0_HOME'];
for (let i = 0; i < 200; i++) {
  const action = ACTIONS[i % ACTIONS.length];
  const ctx = Object.assign({}, CTX, { galleryKind: st.galleryKind, galleryAll: st.galleryAll });
  let res;
  try { res = NAV.reduce(action, st, facts(), ctx); } catch (e) { console.log('❌ reduce throw @' + action + ': ' + e.message); break; }
  if (res.op) { try { NAV.applyOp(res.op, S, base, persona, curId, facts(), ctx, tick()); } catch (e) { console.log('❌ applyOp throw @' + action + ': ' + e.message); } }
  st = res.st;
  render();
}
console.log('transitions=200 · recreate=' + recreates + ' · edit=' + edits + ' · editMedia=' + editMedias + ' · maxAlive=' + maxAlive + ' · orphanHits=' + orphanHits);
console.log((maxAlive === 1 && orphanHits === 0) ? '✅ INVARIANT bloc unique TENU (alive=1 à tout instant, aucun orphelin)' : '🔴 INVARIANT CASSÉ (maxAlive=' + maxAlive + ', orphanHits=' + orphanHits + ')');

// ── synthèse ──
console.log('\n━━━━━ SYNTHÈSE ANOMALIES ━━━━━');
console.log('Doublons de boutons (même callback sur un écran) : ' + (report.dupes.length ? JSON.stringify(report.dupes) : 'AUCUN'));
console.log('Écrans sans Retour : ' + (report.noBack.length ? report.noBack.join(', ') : 'AUCUN'));
console.log('Libellés > 18 car. : ' + (report.longLabels.length ? JSON.stringify(report.longLabels.map(x => x.screen)) : 'AUCUN'));
console.log('JSON brut affiché : ' + (report.jsonLeak.length ? report.jsonLeak.join(', ') : 'AUCUN'));
console.log('Écrans 0 bouton (orphelins) : ' + (report.orphan.length ? [...new Set(report.orphan)].join(', ') : 'AUCUN'));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
const anomalies = report.dupes.length + report.noBack.length + report.jsonLeak.length + report.orphan.length + (maxAlive !== 1 ? 1 : 0) + (orphanHits ? 1 : 0);
console.log('\nANOMALIES STRUCTURELLES: ' + anomalies);
process.exit(anomalies ? 1 : 0); // audit = test : échoue si une anomalie structurelle subsiste

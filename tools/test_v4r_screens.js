// [RÉALISATION — RÉFÉRENCE PRODUIT] Conformité des ÉCRANS : boutons EXACTS de l'architecture, commandes
//   globales à comportement CONSTANT, aucun écran orphelin (toujours un retour ◀/🏠), kind correct, reduce déterministe.
const S = require('../ui/socle');
const C = require('../ui/conscience');
const NAV = require('../ui/nav');
const SC = require('../ui/screens');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(v) { return [].concat.apply([], v.rows); }
function cbs(v) { return flat(v).map(b => b.cb); }
function has(v, cb) { return cbs(v).indexOf(cb) >= 0; }

const now = Date.UTC(2026, 5, 11, 13, 0, 0);
const f0 = S.defaultFacts('imany', 'a', now);
const fimg = JSON.parse(JSON.stringify(f0)); fimg.medias = [{ id: 'm1', etat: 'candidate', type: 'image', prompt: 'p', look: 'L' }];
const fvid = JSON.parse(JSON.stringify(fimg)); fvid.medias.push({ id: 'm2', etat: 'candidate', type: 'video', source: 'photo du projet', script: 's' });
const ctx = { looks: ['Look A', 'Look B'], decors: ['D'], avatars: ['Imany'], sections: [{ key: 'looks', icon: '👗', label: 'Looks', count: 274, items: ['a'], source: 'x', vide: false }], section: { icon: '👗', label: 'Looks', count: 274, items: ['a'], source: 'x' }, recents: { projets: [f0], brouillons: [f0], archives: [], legacy: 1 } };

// ── ÉCRAN 1 ACCUEIL : 4 portes exactes ──
const home = SC.homeView(f0);
chk('Accueil : 4 portes PHOTO/VIDÉO/STUDIO/RÉCENTS', ['R0_PHOTO', 'R0_VIDEO', 'R0_STUDIO', 'R0_RECENTS'].every(c => has(home, c)));
chk('Accueil : kind texte', home.kind === 'text');

// ── ÉCRAN 2 PHOTO : boutons exacts + kind ──
const ph0 = SC.photoView(f0), phi = SC.photoView(fimg);
chk('Photo : ✨Générer 📥Importer 🖼Galerie 🕘Historique 🏠', ['R0_PH_GEN', 'R0_PH_IMPORT', 'R0_PH_GAL', 'R0_PH_HIST', 'R0_HOME'].every(c => has(ph0, c)));
chk('Photo : sobre sans image (texte), photo dès qu\'une image existe', ph0.kind === 'text' && phi.kind === 'photo');

// ── ÉCRAN 2.1 PHOTO/PROMPT : 6 blocs + 6 commandes ──
const php = SC.photoPromptView(f0, ctx);
chk('Photo/Prompt : 6 blocs (Prompt/Avatar/Look/Décor/Références/Paramètres)', ['R0_PHB_prompt', 'R0_PHB_avatar', 'R0_PHB_look', 'R0_PHB_decor', 'R0_PHB_refs', 'R0_PHB_params'].every(c => has(php, c)));
chk('Photo/Prompt : ◀Retour ❌Annuler 👁Aperçu ✅Valider ✨Générer 🏠', ['R0_PHOTO', 'R0_PH_CANCEL', 'R0_PH_PREVIEW', 'R0_PH_VALID', 'R0_PH_GENERATE', 'R0_HOME'].every(c => has(php, c)));

// ── ÉCRAN 2.2 PHOTO/RÉSULTAT : 6 actions exactes ──
const phr = SC.photoResultView(fimg);
chk('Photo/Résultat : ✅Garder 🗑Supprimer ✏️Modifier 🔁Régénérer 🎬Vidéo 🏠', ['R0_PH_KEEP', 'R0_PH_DEL', 'R0_PH_EDIT', 'R0_PH_REGEN', 'R0_PH_TOVIDEO', 'R0_HOME'].every(c => has(phr, c)));
chk('Photo/Résultat : kind photo (on voit la photo)', phr.kind === 'photo');

// ── ÉCRAN 3 VIDÉO : boutons + RÈGLE génération photo source ──
const vi0 = SC.videoView(f0), vii = SC.videoView(fimg), viv = SC.videoView(fvid);
chk('Vidéo : 📥Source 🖼Choisir ✨GénérerPhoto 🎬Créer 🕘Historique 🏠', ['R0_VI_IMPORT', 'R0_VI_PICK', 'R0_VI_GENPHOTO', 'R0_VI_CREATE', 'R0_VI_HIST', 'R0_HOME'].every(c => has(vi0, c)));
chk('Vidéo : kind = vidéo si vidéo, sinon photo source, sinon texte', viv.kind === 'video' && vii.kind === 'photo' && vi0.kind === 'text');

// ── ÉCRAN 3.1 VIDÉO/PARAMÈTRES : 7 blocs + commandes ──
const vip = SC.videoParamsView(fimg);
chk('Vidéo/Paramètres : 7 blocs (source/mouvement/script/voix/musique/légendes/params)', ['R0_VIB_source', 'R0_VIB_mouvement', 'R0_VIB_script', 'R0_VIB_voix', 'R0_VIB_musique', 'R0_VIB_legendes', 'R0_VIB_params'].every(c => has(vip, c)));
chk('Vidéo/Paramètres : ◀ ❌ 👁 ✅ 🎬Générer 🏠', ['R0_VIDEO', 'R0_VI_CANCEL', 'R0_VI_PREVIEW', 'R0_VI_VALID', 'R0_VI_GENERATE', 'R0_HOME'].every(c => has(vip, c)));

// ── ÉCRAN 3.2 VIDÉO/RÉSULTAT ──
const vir = SC.videoResultView(fvid);
chk('Vidéo/Résultat : ✅ 🗑 ✏️ 🔁 📤Exporter 🏠', ['R0_VI_KEEP', 'R0_VI_DEL', 'R0_VI_EDIT', 'R0_VI_REGEN', 'R0_PUB', 'R0_HOME'].every(c => has(vir, c)));
chk('Vidéo/Résultat : kind vidéo (on voit la vidéo)', vir.kind === 'video');

// ── ÉCRAN 4 PUBLICATION ──
const pub = SC.publicationView(fvid);
chk('Publication : ◀ ✏️Légende 💾Brouillon 📤Publier 🏠', ['R0_VI_RESULT', 'R0_PUB_EDIT', 'R0_PUB_SAVE', 'R0_PUB_DO', 'R0_HOME'].every(c => has(pub, c)));

// ── ÉCRAN 5 STUDIO : 8 sections ──
const stCtx = { sections: ['avatars', 'looks', 'decors', 'voix', 'prompts', 'templates', 'references', 'parametres'].map(k => ({ key: k, icon: '•', label: k, count: 0, vide: true })) };
const studio = SC.studioView(f0, stCtx);
chk('Studio : 8 sections (avatars…paramètres)', stCtx.sections.every(s => has(studio, 'R0_ST_' + s.key)) && has(studio, 'R0_HOME'));
const sect = SC.studioSectionView(f0, ctx);
chk('Studio/Section : ➕✏️📋🗑✅ + ◀ 🏠', ['R0_STA_add', 'R0_STA_edit', 'R0_STA_dup', 'R0_STA_del', 'R0_STA_sel', 'R0_STUDIO', 'R0_HOME'].every(c => has(sect, c)));

// ── ÉCRAN 6 RÉCENTS ──
const rec = SC.recentsView(f0, ctx);
chk('Récents : ▶Ouvrir(0) 📋Dup 📦Arch 🗑Suppr 🏠', has(rec, 'R0_RE_OPEN_0') && ['R0_RE_DUP', 'R0_RE_ARCH', 'R0_RE_DEL', 'R0_HOME'].every(c => has(rec, c)));

// ── COMMANDES GLOBALES : 🏠 = R0_HOME PARTOUT (sauf l'Accueil lui-même), aucun écran orphelin ──
const nonHome = [ph0, php, phr, vi0, vip, vir, pub, studio, sect, rec]; // l'Accueil EST la maison (4 portes, pas de 🏠)
chk('Global : 🏠 Accueil présent et = R0_HOME sur tous les écrans non-Accueil', nonHome.every(v => has(v, 'R0_HOME')));
chk('Global : Accueil = racine (4 portes, pas de 🏠 vers soi-même)', !has(home, 'R0_HOME') && has(home, 'R0_PHOTO'));
chk('Global : AUCUN écran orphelin (toujours un retour ◀/🏠)', nonHome.every(v => has(v, 'R0_HOME') || cbs(v).some(c => /R0_(PHOTO|VIDEO|STUDIO|VI_RESULT)$/.test(c))));
// les libellés 🏠 portent tous le même texte
const homeBtns = flat(phr).concat(flat(vir)).filter(b => b.cb === 'R0_HOME');
chk('Global : libellé 🏠 constant', homeBtns.every(b => b.text === '🏠 Accueil'));

// ── REDUCER : navigation déterministe + retour auto Vidéo→Photo→Vidéo ──
let st = { screen: 'home' };
chk('reduce : R0_VIDEO -> video', NAV.reduce('R0_VIDEO', st, f0, ctx).st.screen === 'video');
let r = NAV.reduce('R0_VI_GENPHOTO', { screen: 'video' }, f0, ctx);
chk('reduce : R0_VI_GENPHOTO -> photo_prompt + ret=video (retour armé)', r.st.screen === 'photo_prompt' && r.st.ret === 'video');
chk('reduce : R0_VI_GENPHOTO -> confirmation puis R0_GO (ret=video) -> retour AUTO video + op crée image + source', (() => {
  const c = NAV.reduce('R0_PH_GENERATE', { screen: 'photo_prompt', ret: 'video' }, f0, ctx); // -> confirm, ret préservé
  const g = NAV.reduce('R0_GO', c.st, f0, ctx); // valide -> auto video + op image + then(source)
  return c.st.screen === 'confirm' && g.st.screen === 'video' && g.st.ret == null && g.op && g.op.then;
})());
chk('reduce : R0_PUB_DO -> publication + op decision (GATÉ, pas de publish)', (() => { const x = NAV.reduce('R0_PUB_DO', { screen: 'publication' }, fvid, ctx); return x.st.screen === 'publication' && x.op.type === 'decision'; })());
chk('reduce : suppression = op etat supprime (DOUX, pas de hard delete)', NAV.reduce('R0_PH_DEL', { screen: 'photo_result' }, fimg, ctx).op.etat === 'supprime');

// ── COST GATE : génération -> confirmation AVANT dépense (jamais d'op directe) ──
const COST = require('../ui/cockpit_cost'); const ENG = require('../ui/engines');
chk('gate : R0_PH_GENERATE -> écran confirm, AUCUNE op (aucune dépense directe)', (() => { const r = NAV.reduce('R0_PH_GENERATE', { screen: 'photo_prompt' }, fimg, ctx); return r.st.screen === 'confirm' && !r.op && r.st.pending; })());
chk('gate : R0_VI_GENERATE -> écran confirm, AUCUNE op', (() => { const r = NAV.reduce('R0_VI_GENERATE', { screen: 'video_params' }, fimg, ctx); return r.st.screen === 'confirm' && !r.op; })());
chk('gate : R0_GO -> op create (la seule porte de dépense, après confirmation)', (() => { const r = NAV.reduce('R0_GO', { screen: 'confirm', pending: { kind: 'image' } }, fimg, ctx); return r.op && r.op.type === 'create'; })());
chk('gate : R0_GEN_CANCEL -> retour params, AUCUNE op', (() => { const r = NAV.reduce('R0_GEN_CANCEL', { screen: 'confirm', pending: { kind: 'image' } }, fimg, ctx); return r.st.screen === 'photo_prompt' && !r.op; })());
const estP = COST.estimate('image', { nb_images: 1, mode: 'eco' }, { pricing: { ops: { eco: 0.48 }, eur_per_credit: 0.058 } });
const cv = SC.confirmView(fimg, { confirm: { mediaKind: 'photo', est: estP, credits: 500 } });
chk('confirm : affiche PAYANT + moteur + coût + 💲Valider / ✖️Annuler', /PAYANT/.test(cv.caption) && /Seedream/.test(cv.caption) && has(cv, 'R0_GO') && has(cv, 'R0_GEN_CANCEL'));
chk('confirm : éco bien marqué PAYANT (gratuit=false)', estP.gratuit === false);
// ── ENGINES : LIVE OFF par défaut (zéro dépense), gratuit/local distinct du payant ──
chk('engines : LIVE off par défaut -> payant simulé, local réel', ENG.live() === false && ENG.mode('photo').exec === 'sim' && ENG.mode('soustitres').exec === 'local' && ENG.mode('photo').paid === true && ENG.mode('soustitres').paid === false);
// ── GRILLE : galerie + section Studio en grille ; Vidéo>Édition regroupe la post-prod ──
const gal = SC.galleryView(fvid, { galleryKind: 'image' });
chk('galerie : grille (pas de cul-de-sac : ◀ + 🏠)', has(gal, 'R0_PHOTO') && has(gal, 'R0_HOME'));
const ve = SC.videoEditView(fvid);
chk('Vidéo>Édition : Script+Légendes+Sous-titres+Édition image regroupés', ['R0_VIB_script', 'R0_VIB_legendes', 'R0_VE_SUBS', 'R0_VE_IMGFX'].every(c => has(ve, c)) && has(ve, 'R0_VIDEO'));
chk('Vidéo : bouton ✂️ Édition mène à la post-prod (pas de cul-de-sac)', has(SC.videoView(fimg), 'R0_VE'));

// sobriété : aucun jargon dev visible
const allcap = [home].concat(nonHome).map(v => v.caption).join(' ').toLowerCase();
chk('sobriété : aucun jargon dev', !/(socle|dérivation|placeholder|message_id|reducer|ffmpeg|callback)/.test(allcap));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

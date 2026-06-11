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
chk('Photo/Prompt : VALIDATION→PRODUCTION→Retour (Aperçu/Valider/Générer/Retour, PAS d\'Accueil en flux)', ['R0_PHOTO', 'R0_PH_PREVIEW', 'R0_PH_VALID', 'R0_PH_GENERATE'].every(c => has(php, c)) && !has(php, 'R0_HOME'));

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
chk('Vidéo/Paramètres : VALIDATION→PRODUCTION→Retour (Aperçu/Valider/Générer/Retour, PAS d\'Accueil en flux)', ['R0_VIDEO', 'R0_VI_PREVIEW', 'R0_VI_VALID', 'R0_VI_GENERATE'].every(c => has(vip, c)) && !has(vip, 'R0_HOME'));

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

// ── COMMANDES GLOBALES (point 6) : Accueil RÉSERVÉ aux écrans non-flux ; les flux ont Retour, pas Accueil ──
const sortie = [phr, vir, pub, studio, sect, rec]; // écrans de SORTIE/non-flux : gardent 🏠 Accueil
const _estCv = { moteur: 'Seedream', credits: 1, eur: 0.058, gratuit: false };
const flux = [php, vip, SC.confirmView(fimg, { confirm: { mediaKind: 'photo', est: _estCv, live: false, budget: { tests: 0, credits: 0, max: 10, next: 1, exhausted: false } } }), SC.videoEditView(fvid)]; // EN COURS : Retour, pas d'Accueil
chk('Global : 🏠 Accueil présent sur les écrans de SORTIE/non-flux', sortie.every(v => has(v, 'R0_HOME')));
chk('point6 : écrans EN FLUX -> Retour, PAS d\'Accueil (sortie non accidentelle)', flux.every(v => !has(v, 'R0_HOME') && cbs(v).some(c => /R0_(PHOTO|VIDEO|GEN_CANCEL)$/.test(c))));
chk('Global : Accueil = racine (4 portes, pas de 🏠 vers soi-même)', !has(home, 'R0_HOME') && has(home, 'R0_PHOTO'));
chk('Global : AUCUN écran orphelin (toujours un retour ◀/🏠)', sortie.concat(flux).every(v => has(v, 'R0_HOME') || cbs(v).some(c => /R0_(PHOTO|VIDEO|STUDIO|VI_RESULT|GEN_CANCEL)$/.test(c))));
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
const cv = SC.confirmView(fimg, { confirm: { mediaKind: 'photo', est: estP, live: false, budget: { tests: 0, credits: 0, max: 10, next: 1, exhausted: false } } });
chk('confirm : Aperçu→Générer (terminologie) + moteur + coût + 🎨Générer / ◀Revenir', /Aperçu/.test(cv.caption) && /Seedream/.test(cv.caption) && /Coût/.test(cv.caption) && has(cv, 'R0_GO') && has(cv, 'R0_GEN_CANCEL'));
chk('confirm : plus de vocabulaire « Gratuit/Payant » (intention Aperçu/Générer)', !/PAYANT|GRATUIT/.test(cv.caption) && /🎨 Générer/.test([].concat.apply([], cv.rows).map(b => b.text).join(' ')));
chk('confirm : éco reste gatée (gratuit=false, donc passe par l\'écran de coût)', estP.gratuit === false);
// ── ENGINES : LIVE OFF par défaut (zéro dépense), gratuit/local distinct du payant ──
chk('engines : LIVE off par défaut -> payant simulé, local réel', ENG.live() === false && ENG.mode('photo').exec === 'sim' && ENG.mode('soustitres').exec === 'local' && ENG.mode('photo').paid === true && ENG.mode('soustitres').paid === false);
// ── GRILLE : galerie + section Studio en grille ; Vidéo>Édition regroupe la post-prod ──
const gal = SC.galleryView(fvid, { galleryKind: 'image' });
chk('galerie : grille (pas de cul-de-sac : ◀ + 🏠)', has(gal, 'R0_PHOTO') && has(gal, 'R0_HOME'));
const ve = SC.videoEditView(fvid);
chk('Vidéo>Édition : Script+Légendes+Sous-titres+Édition image regroupés', ['R0_VIB_script', 'R0_VIB_legendes', 'R0_VE_SUBS', 'R0_VE_IMGFX'].every(c => has(ve, c)) && has(ve, 'R0_VIDEO'));
chk('Vidéo : bouton ✂️ Édition mène à la post-prod (pas de cul-de-sac)', has(SC.videoView(fimg), 'R0_VE'));

// ── LOT STABILISATION : couverture des 10 points ──
// (1) home jamais vide : cover photo si image, sobre (texte, aucun placeholder) sinon
chk('point2 : Accueil = couverture photo si image, sobre (texte) sinon — jamais de placeholder', SC.homeView(fimg).kind === 'photo' && SC.homeView(f0).kind === 'text');
// (5) photo decision tree + look bug (libellés propres)
chk('point5 : Photo demande « Utiliser / Une autre » si une photo existe', has(SC.photoView(fimg), 'R0_PH_USE') && has(SC.photoView(fimg), 'R0_PH_OTHER'));
chk('point5 : « Une autre » -> sources Galerie/Archives/Récents/Importer', (() => { const v = SC.photoSourceView(fimg); return ['R0_PH_GAL', 'R0_PH_HIST', 'R0_RECENTS', 'R0_PH_IMPORT'].every(c => has(v, c)); })());
chk('point5 : sélecteur Look = libellés propres (pas de JSON brut)', (() => { const sp = NAV.blockSpec({ screen: 'photo', key: 'look' }, fimg, ctx); return sp.options.every(o => !/[{}\[\]]/.test(o.text)); })());
// point5 : AUTO-RÉPARATION d'une valeur héritée (JSON, même tronqué) -> libellé lisible, jamais de JSON affiché
chk('point5 : cleanLabel répare objet / JSON / JSON tronqué -> « Soiree #6 »', SC.cleanLabel({ id: 6, cat: 'soiree' }) === 'Soiree #6' && SC.cleanLabel('{"id":6,"cat":"soiree","prompt') === 'Soiree #6');
chk('point5 : un look hérité (JSON tronqué) s\'affiche propre dans « Actuel » + chip', (() => {
  const fstale = JSON.parse(JSON.stringify(fimg)); fstale.draft = { photo: { look: '{"id":6,"cat":"soiree","prompt' } };
  const ctx2 = { looks: ['Soiree #1', 'Soiree #2', 'Soiree #3', 'Soiree #4', 'Soiree #5', 'Soiree #6'], decors: [], avatars: [] };
  const v = NAV.view({ screen: 'block', block: { screen: 'photo', key: 'look' } }, fstale, ctx2);
  return /Actuel : Soiree #6/.test(v.caption) && !/[{}]/.test(v.caption) && flat(v).some(b => /🔵 Soiree #6/.test(b.text));
})());
// (6) video decision tree
chk('point6 : Vidéo demande « Conserver ce look ? » si source/look', has(SC.videoView(fimg), 'R0_VI_KEEPLOOK'));
// (7) save before quit : 🏠 depuis un flux en cours -> quit (jamais d'effacement)
chk('point7 : 🏠 depuis flux en cours -> « quitter ? » (pas de sortie brutale)', (() => { const r = NAV.reduce('R0_HOME', { screen: 'photo_prompt' }, fimg, ctx); return r.st.screen === 'quit' && r.st.quitFrom === 'photo_prompt'; })());
chk('point7 : Annuler -> revient au flux ; Quitter sans enreg. -> home + cleardraft ; Enregistrer -> home', (() => {
  const c = NAV.reduce('R0_QUIT_CANCEL', { screen: 'quit', quitFrom: 'video_params' }, fimg, ctx);
  const d2 = NAV.reduce('R0_QUIT_DISCARD', { screen: 'quit', quitFrom: 'photo_prompt' }, fimg, ctx);
  const s2 = NAV.reduce('R0_QUIT_SAVE', { screen: 'quit', quitFrom: 'photo_prompt' }, fimg, ctx);
  return c.st.screen === 'video_params' && d2.st.screen === 'home' && d2.op.type === 'cleardraft' && s2.st.screen === 'home' && !s2.op;
})());
chk('point7 : 🏠 depuis un écran NON en cours (photo) -> home direct (pas de friction)', NAV.reduce('R0_HOME', { screen: 'photo' }, fimg, ctx).st.screen === 'home');
// (4) générateur de texte transversal, GATÉ (Anthropic) -> confirm, mappe champ existant
chk('point4 : ✨ Générer (IA) dans un bloc texte -> confirm (gaté), aucune dépense directe', (() => { const r = NAV.reduce('R0_GENTXT_ph_prompt', { screen: 'block', block: { screen: 'photo', key: 'prompt' } }, fimg, ctx); return r.st.screen === 'confirm' && !r.op && r.st.pending.kind === 'text'; })());
chk('point4 : GO texte -> op gentext (remplit un champ EXISTANT), retour au bloc', (() => { const r = NAV.reduce('R0_GO', { screen: 'confirm', pending: { kind: 'text', ask: 'ph_prompt' } }, fimg, ctx); return r.op && r.op.type === 'gentext' && r.st.screen === 'photo_prompt'; })());
const cvT = SC.confirmView(f0, { confirm: { mediaKind: 'text', est: { moteur: 'Anthropic (claude-sonnet-4-6)', credits: null, eur: 0.01, gratuit: false }, live: false, budget: { tests: 0, credits: 0, max: 10, next: 1, exhausted: false } } });
chk('point4 : confirm texte affiche Anthropic + coût (payant, gaté)', /Anthropic/.test(cvT.caption) && /Coût/.test(cvT.caption));
// (9) grilles : récents jusqu'à 9 en grille
chk('point9 : Récents en grille (≥1 ligne de projets) + actions + home', (() => { const v = SC.recentsView(f0, { recents: { projets: [f0, fimg], brouillons: [], archives: [], legacy: 0 } }); return has(v, 'R0_RE_OPEN_0') && has(v, 'R0_RE_OPEN_1') && has(v, 'R0_HOME'); })());

// ── RACCORDEMENT SOURCE/IMPORT -> FLUX (point 1) : choisir en galerie pose la source + retour auto ──
chk('raccord : R0_VI_PICK -> galerie (choix réel), pas d\'impasse', NAV.reduce('R0_VI_PICK', { screen: 'video_params' }, fimg, ctx).st.screen === 'gallery');
chk('raccord : choix galerie (R0_GITEM) -> op picksrc + RETOUR AUTO au flux', (() => { const r = NAV.reduce('R0_GITEM_0', { screen: 'gallery', srcReturn: 'video_params' }, fimg, ctx); return r.op && r.op.type === 'picksrc' && r.st.screen === 'video_params'; })());
chk('raccord : galerie depuis Photo -> retour revue photo (photo_result)', NAV.reduce('R0_GITEM_0', { screen: 'gallery', srcReturn: 'photo_result' }, fimg, ctx).st.screen === 'photo_result');
chk('raccord : bloc « Image source » = Choisir/Importer (sélection réelle, pas saisie)', (() => { const sp = NAV.blockSpec({ screen: 'video', key: 'source' }, fimg, ctx); return sp.options.some(o => o.cb === 'R0_VI_PICK') && sp.options.some(o => o.cb === 'R0_VI_IMPORT'); })());
chk('raccord : « Modifier » recharge les params dans le flux (op loaddraft)', NAV.reduce('R0_PH_EDIT', { screen: 'photo_result' }, fimg, ctx).op.type === 'loaddraft' && NAV.reduce('R0_VI_EDIT', { screen: 'video_result' }, fvid, ctx).op.type === 'loaddraft');
// ── ÉDITION -> RETOUR PRÉPARATION avec valeur (point 2) ──
chk('point2 : SET d\'une puce -> retour préparation (video_params) avec valeur', (() => { const r = NAV.reduce('R0_SET_vimouv_0', { screen: 'block', block: { screen: 'video', key: 'mouvement' } }, fimg, ctx); return r.st.screen === 'video_params' && r.op.type === 'draft' && r.op.patch.mouvement === 'zoom lent'; })());
chk('point2 : un bloc n\'est jamais une impasse (back = préparation)', (() => { const sp = NAV.blockSpec({ screen: 'video', key: 'mouvement' }, fimg, ctx); return sp.back && /R0_VI_CREATE|R0_VIDEO/.test(sp.back.cb); })());
// ── LIBELLÉS COURTS (point 3) : aucun bouton tronqué (≤ ~16 chars hors emoji) ──
const allBtns = [home, ph0, SC.photoView(fimg), php, phr, vi0, SC.videoView(fimg), vip, vir, pub, studio, sect, rec, SC.photoSourceView(fimg), SC.videoEditView(fvid), SC.galleryView(fvid, { galleryKind: 'image' }), SC.quitView(fimg)]
  .flatMap(v => [].concat.apply([], v.rows)).map(b => b.text);
chk('point3 : libellés courts (aucun > 18 caractères)', allBtns.every(t => t.length <= 18));
chk('point3 : libellés cibles présents (Conserver/Changer/Choisir/Créer vidéo/Historique)', /Conserver/.test(allBtns.join(' ')) && /Changer/.test(allBtns.join(' ')) && /Choisir/.test(allBtns.join(' ')) && /Créer vidéo/.test(allBtns.join(' ')));
// ── AUDIT JSON BRUT (point 4) : aucune liste n'affiche de JSON/objet sérialisé ──
const listCaps = [SC.studioSectionView(f0, { section: { icon: '👗', label: 'Looks', count: 2, items: [{ id: 1, cat: 'soiree' }, { id: 2, cat: 'business' }], source: 'x' } }),
  SC.galleryView(fvid, { galleryKind: 'image' }), SC.recentsView(f0, ctx)];
chk('point4 : Studio/Galerie/Récents — aucun JSON brut affiché (objets -> libellés)', listCaps.every(v => !/\{"|":/.test(v.caption) && [].concat.apply([], v.rows).every(b => !/\{"|":/.test(b.text))));
chk('point4 : décor/avatars/prompts -> libellés propres (cleanLabel sur item objet)', SC.cleanLabel({ id: 2, cat: 'business' }) === 'Business #2');
// ── NO-ORPHAN sur les NOUVEAUX écrans ──
chk('no-orphan : gallery/photo_source/video_edit/quit ont tous un retour', (() => {
  const gs = [SC.galleryView(fvid, { galleryKind: 'image' }), SC.photoSourceView(fimg), SC.videoEditView(fvid), SC.quitView(fimg)];
  return gs.every(v => { const cb = cbs(v); return cb.some(c => /R0_(HOME|PHOTO|VIDEO|QUIT_CANCEL)/.test(c)); });
})());

// sobriété : aucun jargon dev visible
const allcap = [home].concat(sortie).concat(flux).map(v => v.caption).join(' ').toLowerCase();
chk('sobriété : aucun jargon dev', !/(socle|dérivation|placeholder|message_id|reducer|ffmpeg|callback)/.test(allcap));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

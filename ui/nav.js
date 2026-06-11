// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — RÉFÉRENCE PRODUIT] NAVIGATION : mapping écran→vue, specs de blocs, tables SET/ASK.
//   PUR (sauf lecture facts). Partagé par le câble Telegram ET la preuve de scénario -> une seule source de vérité
//   pour « quel écran, quel bloc, quel champ ». Aucune I/O, aucune mutation ici (le câble écrit dans le Socle).
// ─────────────────────────────────────────────────────────────────────────────
const SC = require('./screens');
const C = require('./conscience');

// Navigation pure : action -> écran (sans mutation). Les actions à effet (génération, etc.) sont gérées par le câble.
const NEXT = {
  R0_HOME: 'home', R0_PHOTO: 'photo', R0_VIDEO: 'video', R0_STUDIO: 'studio', R0_RECENTS: 'recents',
  R0_PH_GEN: 'photo_prompt', R0_PH_CANCEL: 'photo', R0_PHOTO_RESULT: 'photo_result',
  R0_VI_CREATE: 'video_params', R0_VI_CANCEL: 'video', R0_VI_RESULT: 'video_result',
  R0_PUB: 'publication',
};

// Champs à choix : blk -> { kind('photo'|'video'), field, src('list'|'preset'|'literal'), name }
const SETMAP = {
  phavatar: { kind: 'photo', field: 'avatar', src: 'list', name: 'avatars' },
  phlook: { kind: 'photo', field: 'look', src: 'list', name: 'looks' },
  phdecor: { kind: 'photo', field: 'decor', src: 'list', name: 'decors' },
  phparams: { kind: 'photo', field: 'format', src: 'preset', name: 'ph_params' },
  phrefs: { kind: 'photo', field: 'refs', src: 'literal' },
  vimouv: { kind: 'video', field: 'mouvement', src: 'preset', name: 'vi_mouvement' },
  vivoix: { kind: 'video', field: 'voix', src: 'preset', name: 'vi_voix' },
  vimus: { kind: 'video', field: 'musique', src: 'preset', name: 'vi_musique' },
  vileg: { kind: 'video', field: 'legendes', src: 'preset', name: 'vi_legendes' },
  viduree: { kind: 'video', field: 'duree', src: 'preset', name: 'vi_duree' },
  viparams: { kind: 'video', field: 'format', src: 'preset', name: 'vi_params' },
};

// Textes SIMULÉS (tant que le moteur réel Anthropic est OFF) — placeholders éditables, mappés sur les champs existants.
const SIMTEXT = {
  ph_prompt: 'portrait éditorial lumineux, ambiance studio podcast (texte généré — simulé, éditable)',
  vi_script: 'Accroche · point clé · chute. (script généré — simulé, éditable)',
  pub_courte: 'Légende courte accrocheuse (générée — simulée)',
  pub_longue: 'Légende longue qui développe le propos et invite à réagir. (générée — simulée)',
  pub_hashtags: '#podcast #viral #format (générés — simulés)',
};

// Saisies libres : askKey -> cible (draft photo/video, ou publication, ou intention)
const ASKMAP = {
  ph_prompt: { target: 'draft', kind: 'photo', field: 'prompt', prompt: '📝 Écris le prompt de l\'image (court).' },
  vi_script: { target: 'draft', kind: 'video', field: 'script', prompt: '📝 Écris le script de la vidéo (court).' },
  vi_source: { target: 'draft', kind: 'video', field: 'source', prompt: '🖼 Décris la source (ou choisis une photo existante).' },
  pub_courte: { target: 'pub', field: 'legende_courte', prompt: '✏️ Légende courte ?' },
  pub_longue: { target: 'pub', field: 'legende_longue', prompt: '📄 Légende longue ?' },
  pub_hashtags: { target: 'pub', field: 'hashtags', prompt: '#️⃣ Hashtags ?' },
};

function parentKind(screen, facts) {
  if (screen === 'photo' || screen === 'photo_prompt') return C.hasImage(facts) ? 'photo' : 'text';
  if (screen === 'video' || screen === 'video_params') return C.hasVideo(facts) ? 'video' : (C.hasImage(facts) ? 'photo' : 'text');
  if (screen === 'publication') return C.hasVideo(facts) ? 'video' : (C.hasImage(facts) ? 'photo' : 'text');
  return 'text';
}

// Construit la spec d'une sous-vue de bloc (édition en place). block = { screen:'photo'|'video'|'pub', key }
function blockSpec(block, facts, ctx) {
  const d = (facts && facts.draft && facts.draft[block.screen]) || {};
  const back = block.screen === 'photo' ? { text: '◀ Retour', cb: 'R0_PH_GEN' }
    : block.screen === 'video' ? { text: '◀ Retour', cb: 'R0_VI_CREATE' }
      : { text: '◀ Retour', cb: 'R0_PUB' };
  const pk = parentKind(block.screen === 'photo' ? 'photo_prompt' : block.screen === 'video' ? 'video_params' : 'publication', facts);

  // SOUS-TITRES (D) : activer/désactiver · position · taille — réglages PAR PROJET (draft.video), retour à Vidéo>Édition.
  //   Lit subtitle_style.js (legacy) pour les valeurs PAR DÉFAUT affichées, SANS jamais le modifier (verrou intact).
  if (block.key === 'soustitres') {
    const cur = d.soustitres || 'auto (défaut)';
    return {
      title: '🔤 Sous-titres', current: cur, parentKind: pk, back: { text: '◀ Retour', cb: 'R0_VI_CREATE' },
      hint: 'Réglages pour cette vidéo (l\'incrustation se fait au rendu).',
      options: [
        { text: (d.soustitres === 'on' ? '🔵 ' : '') + '✅ Activer', cb: 'R0_SET_ston_on' },
        { text: (d.soustitres === 'off' ? '🔵 ' : '') + '🚫 Désactiver', cb: 'R0_SET_ston_off' },
        { text: (d.st_pos === 'haut' ? '🔵 ' : '') + '⬆ Haut', cb: 'R0_SET_stpos_haut' },
        { text: (d.st_pos === 'bas' ? '🔵 ' : '') + '⬇ Bas', cb: 'R0_SET_stpos_bas' },
        { text: (d.st_size === 'S' ? '🔵 ' : '') + '🔡 Petit', cb: 'R0_SET_stsize_S' },
        { text: (d.st_size === 'L' ? '🔵 ' : '') + '🔠 Grand', cb: 'R0_SET_stsize_L' },
        { text: '💾 Défaut', cb: 'R0_DEFSAVE' }, // [#18] mémorise les réglages sous-titres courants
      ],
    };
  }
  // PUBLICATION : édition légendes/plateforme
  if (block.screen === 'pub') {
    const p = (facts && facts.publication) || {};
    const plat = SC.PRESETS.pub_plateforme.map((v, i) => ({ text: (p.plateforme === v ? '🔵 ' : '') + v, cb: 'R0_SET_pubplat_' + i }));
    return {
      title: '📤 Légendes & plateforme', current: p.legende_courte, parentKind: pk, back: back,
      // saisie manuelle OU génération IA (gatée) pour chaque champ texte ; puces plateforme.
      options: [{ text: '✍️ Courte', cb: 'R0_ASK_pub_courte' }, { text: '✍️ Longue', cb: 'R0_ASK_pub_longue' }, { text: '#️⃣ Hashtags', cb: 'R0_ASK_pub_hashtags' },
        { text: '✨ Courte (IA)', cb: 'R0_GENTXT_pub_courte' }, { text: '✨ Longue (IA)', cb: 'R0_GENTXT_pub_longue' }, { text: '✨ #tags (IA)', cb: 'R0_GENTXT_pub_hashtags' }].concat(plat),
    };
  }

  // blocs à SAISIE LIBRE : ✍️ Saisir + ✨ Générer (IA) — service de texte transversal, GATÉ (Anthropic, payant).
  //   La source vidéo n'est pas un texte génératif (pas de bouton IA).
  const FREE = { prompt: 'ph_prompt', script: 'vi_script', source: 'vi_source' };
  if (FREE[block.key]) {
    const ask = FREE[block.key];
    // « Image source » = sélection RÉELLE (Choisir une photo / Importer), pas une saisie libre.
    const opts = (block.key === 'source')
      ? [{ text: '🖼 Choisir', cb: 'R0_VI_PICK' }, { text: '📥 Importer', cb: 'R0_VI_IMPORT' }]
      : [{ text: '✨ Générer (IA)', cb: 'R0_GENTXT_' + ask }];
    // [#17] MODÈLES PRÉ-ENREGISTRÉS (scripts/prompts existants) : remontent ici, chargeables, aperçu éditable.
    // [#18] « 💾 Défaut » : enregistre la valeur courante pour la réutiliser aux prochaines générations/nouveaux projets.
    if (block.key === 'prompt' || block.key === 'script') {
      const list = ((ctx && ctx.presets && (block.key === 'script' ? ctx.presets.scripts : ctx.presets.prompts)) || []).slice(0, 3);
      list.forEach((p, i) => opts.push({ text: '📁 ' + String(p.title || p.name || ('Modèle ' + (i + 1))).replace(/[*_`\[\]]/g, '').slice(0, 16), cb: 'R0_LOADP_' + i }));
      opts.push({ text: '💾 Défaut', cb: 'R0_DEFSAVE' });
    }
    const hasDef = !!(ctx && ctx.defaults && ctx.defaults[block.screen + '.' + block.key]);
    return { title: titleOf(block), current: d[block.key], parentKind: pk, back: back, askCb: 'R0_ASK_' + ask, options: opts, hint: (block.key === 'source' ? 'Choisis une photo ou importe.' : ('Écris, charge un 📁 modèle, ou ✨ génère puis édite.' + (hasDef ? ' (défaut dispo)' : ''))) };
  }
  // blocs à CHOIX (list/preset/literal) — + [#18] « 💾 Défaut » pour mémoriser le choix courant (tenue/voix/format…).
  return { title: titleOf(block), current: d[fieldAlias(block)], parentKind: pk, back: back, options: optionsFor(block, ctx, d).concat([{ text: '💾 Défaut', cb: 'R0_DEFSAVE' }]) };
}

function titleOf(block) {
  const all = (block.screen === 'photo' ? SC.PH_BLOCKS : SC.VI_BLOCKS) || [];
  const b = all.find(x => x.key === block.key) || { icon: '•', label: block.key };
  return b.icon + ' ' + b.label;
}

// Options (puces) pour un bloc à choix. Renvoie [{text,cb}] avec cb = R0_SET_<blk>_<idx|token>.
function optionsFor(block, ctx, d) {
  // retrouver le blk (clé SETMAP) correspondant à ce bloc
  const blk = Object.keys(SETMAP).find(k => SETMAP[k].kind === block.screen && SETMAP[k].field === fieldAlias(block));
  if (!blk) return [];
  const spec = SETMAP[blk];
  const cur = SC.cleanLabel(d[spec.field]);   // valeur courante NETTOYÉE (auto-répare un ancien stockage JSON)
  if (spec.src === 'list') {
    const list = ((ctx && ctx[spec.name]) || []).slice(0, 6);
    return list.map((it, i) => ({ text: (String(cur) === String(it) ? '🔵 ' : '') + String(it).slice(0, 16), cb: 'R0_SET_' + blk + '_' + i }));
  }
  if (spec.src === 'preset') {
    return (SC.PRESETS[spec.name] || []).map((v, i) => ({ text: (String(cur) === String(v) ? '🔵 ' : '') + v, cb: 'R0_SET_' + blk + '_' + i }));
  }
  // literal (refs)
  return ['aucune', '1', '2'].map((v) => ({ text: (d[spec.field] === v ? '🔵 ' : '') + v, cb: 'R0_SET_' + blk + '_' + v }));
}

// le champ du draft porte parfois un nom différent de la clé d'affichage (params -> format)
function fieldAlias(block) { return block.key === 'params' ? 'format' : block.key; }

// Résout une valeur SET : (blk, token, ctx) -> { kind, field, value }
function resolveSet(blk, token, ctx) {
  if (blk === 'pubplat') { return { target: 'pub', field: 'plateforme', value: SC.PRESETS.pub_plateforme[+token] }; }
  if (blk === 'ston') { return { target: 'draft', kind: 'video', field: 'soustitres', value: token }; }   // on|off
  if (blk === 'stpos') { return { target: 'draft', kind: 'video', field: 'st_pos', value: token }; }       // haut|bas
  if (blk === 'stsize') { return { target: 'draft', kind: 'video', field: 'st_size', value: token }; }     // S|L
  const spec = SETMAP[blk]; if (!spec) return null;
  let value;
  if (spec.src === 'list') value = ((ctx && ctx[spec.name]) || [])[+token];
  else if (spec.src === 'preset') value = (SC.PRESETS[spec.name] || [])[+token];
  else value = token; // literal
  return { target: 'draft', kind: spec.kind, field: spec.field, value: value };
}

// Rendu d'un état de navigation -> vue pure. state = { screen, section?, block? }
function view(state, facts, ctx) {
  switch (state.screen) {
    case 'home': return SC.homeView(facts);
    case 'photo': return SC.photoView(facts);
    case 'photo_prompt': return SC.photoPromptView(facts, ctx);
    case 'photo_result': return SC.photoResultView(facts);
    case 'video': return SC.videoView(facts);
    case 'video_params': return SC.videoParamsView(facts);
    case 'video_result': return SC.videoResultView(facts);
    case 'publication': return SC.publicationView(facts);
    case 'studio': return SC.studioView(facts, ctx);
    case 'studio_section': return SC.studioSectionView(facts, ctx);
    case 'recents': return SC.recentsView(facts, ctx);
    case 'confirm': return SC.confirmView(facts, ctx);
    case 'confirm2': return SC.confirm2View(facts, ctx);
    case 'gallery': return SC.galleryView(facts, ctx);
    case 'video_edit': return SC.videoEditView(facts);
    case 'quit': return SC.quitView(facts);
    case 'photo_source': return SC.photoSourceView(facts);
    case 'block': return SC.blockView(blockSpec(state.block, facts, ctx));
    default: return SC.homeView(facts);
  }
}

function parentOf(blk) { return blk === 'pubplat' ? 'publication' : (blk.indexOf('st') === 0 ? 'video_params' : (blk.indexOf('ph') === 0 ? 'photo_prompt' : 'video_params')); }
function parentOfAsk(ask) { return ask.indexOf('ph_') === 0 ? 'photo_prompt' : (ask.indexOf('vi_') === 0 ? 'video_params' : 'publication'); }

// ═══ REDUCER PUR : (action, état, faits, ctx) -> { st, op?, banner?, toast?, await? } ═══
//   Décide l'écran suivant + l'OPÉRATION (mutation à appliquer par applyOp). AUCUNE I/O ici.
//   Partagé par le câble Telegram ET la preuve de scénario -> garantit que le test exécute la VRAIE logique.
//   op.type ∈ create|etat|draft|pub|loaddraft|statut|duplicate|openrecent|decision|none
// Écrans « flux en cours » : quitter vers l'Accueil demande d'abord « Enregistrer avant de quitter ? » (point 7).
const IN_PROGRESS = { photo_prompt: 1, video_params: 1, block: 1, confirm: 1, confirm2: 1, video_edit: 1 };

function reduce(action, st0, facts, ctx) {
  const st = { screen: st0.screen, section: st0.section || null, block: st0.block || null, ret: st0.ret || null, pending: st0.pending || null, quitFrom: st0.quitFrom || null, srcReturn: st0.srcReturn || null };
  const go = (screen, banner) => ({ st: Object.assign(st, { screen: screen, block: null }), banner: banner });
  const d = action;

  // « Enregistrer avant de quitter ? » : 🏠 depuis un flux EN COURS -> écran quit (jamais d'effacement silencieux).
  if (d === 'R0_HOME' && IN_PROGRESS[st.screen]) { st.quitFrom = st.screen; return { st: Object.assign(st, { screen: 'quit' }) }; }
  if (d === 'R0_QUIT_SAVE') { st.quitFrom = null; return Object.assign(go('home', '💾 <b>Brouillon conservé</b>'), {}); }
  if (d === 'R0_QUIT_DISCARD') { st.quitFrom = null; return Object.assign(go('home', '🚪 <b>Quitté</b> <i>(brouillon abandonné — la matière produite reste)</i>'), { op: { type: 'cleardraft' } }); }
  if (d === 'R0_QUIT_CANCEL') { const back = st.quitFrom || 'home'; st.quitFrom = null; return { st: Object.assign(st, { screen: back }) }; }

  if (d.indexOf('R0_SET_') === 0) {
    const rest = d.slice(7), us = rest.indexOf('_'), blk = rest.slice(0, us), token = rest.slice(us + 1);
    const r = resolveSet(blk, token, ctx);
    const op = r ? (r.target === 'pub' ? { type: 'pub', patch: { [r.field]: r.value } } : { type: 'draft', kind: r.kind, patch: { [r.field]: r.value } }) : { type: 'none' };
    return { st: Object.assign(st, { screen: parentOf(blk), block: null }), op: op };
  }
  if (d.indexOf('R0_ASK_') === 0) { const ak = d.slice(7); const m = ASKMAP[ak] || {};
    return { st: st, await: { ask: ak }, banner: '✍️ <b>' + SC.esc(m.prompt || 'Ta réponse ?') + '</b>\n<i>Envoie-la dans le prochain message — je l\'intègre au bloc.</i>' }; }
  // GÉNÉRATEUR DE TEXTE (Anthropic, PAYANT) -> passe par la CONFIRMATION de coût comme le reste.
  if (d.indexOf('R0_GENTXT_') === 0) { st.pending = { kind: 'text', mediaKind: 'text', ask: d.slice(10) }; return go('confirm'); }
  if (d === 'R0_PHB_edition') { return { st: st, toast: '🎨 Édition image (local, gratuit)', op: { type: 'draft', kind: 'photo', patch: { image_fx: 'réglée' } } }; } // (P2) Édition dans la prépa photo (local)
  if (d.indexOf('R0_PHB_') === 0) { return { st: Object.assign(st, { screen: 'block', block: { screen: 'photo', key: d.slice(7) } }) }; }
  if (d.indexOf('R0_VIB_') === 0) { return { st: Object.assign(st, { screen: 'block', block: { screen: 'video', key: d.slice(7) } }) }; }
  if (d.indexOf('R0_ST_') === 0 && d !== 'R0_STUDIO') { st.section = d.slice(6); return { st: Object.assign(st, { screen: 'studio_section', block: null }) }; }
  if (d.indexOf('R0_STA_') === 0) { return { st: st, toast: '🏛 Studio — édition à venir (lecture seule)' }; }
  if (d.indexOf('R0_STI_') === 0) { return { st: st, toast: '🏛 Élément (lecture seule)' }; }
  if (d.indexOf('R0_RE_OPEN_') === 0) { return { st: Object.assign(st, { screen: 'home', block: null }), op: { type: 'openrecent', index: +d.slice(11) }, banner: '📂 <b>Projet ouvert</b>' }; }
  // RACCORDEMENT (point 1) : choisir un média en galerie -> le POSE comme source + RETOUR AUTO au flux (jamais d'impasse).
  if (d.indexOf('R0_GITEM_') === 0) { const i = +d.slice(9); const back = st.srcReturn || 'video_params'; st.srcReturn = null; return { st: Object.assign(st, { screen: back, block: null }), op: { type: 'picksrc', index: i }, banner: '✅ <b>Source sélectionnée</b>' }; }

  switch (d) {
    case 'R0_HOME': return go('home');
    case 'R0_PHOTO': return go('photo');
    case 'R0_VIDEO': return go((C.hasImage(facts) || C.hasVideo(facts)) ? 'video_params' : 'video'); // (P3) source dispo -> menu Vidéo directement
    case 'R0_STUDIO': st.section = null; return go('studio');
    case 'R0_RECENTS': return go('recents');
    case 'R0_PH_GEN': return go('photo_prompt');
    case 'R0_PH_CANCEL': return go('photo');
    case 'R0_VI_CANCEL': return go('video');
    case 'R0_VI_RESULT': return go('video_result');
    case 'R0_PUB': return go('publication');
    case 'R0_RE_DUP': return Object.assign(go('recents', '📋 <b>Projet dupliqué</b>'), { op: { type: 'duplicate' } });
    case 'R0_RE_ARCH': return Object.assign(go('recents', '📦 <b>Projet archivé</b>'), { op: { type: 'statut', statut: 'archive' } });
    case 'R0_RE_DEL': return Object.assign(go('recents', '🗑 <b>Déplacé en archives</b> <i>(rien n\'est perdu)</i>'), { op: { type: 'statut', statut: 'archive' } });
    // PHOTO
    case 'R0_PH_IMPORT': return { st: st, await: { upload: 'photo' }, banner: '📥 <b>Envoie ton image dans le prochain message.</b>\n<i>Elle deviendra une photo du projet (aucune dépense).</i>' };
    case 'R0_PH_GAL': st.galleryKind = 'image'; st.galleryAll = false; st.srcReturn = 'photo_result'; return go('gallery');   // galerie : choisir -> revue photo
    case 'R0_PH_HIST': st.galleryKind = 'image'; st.galleryAll = true; st.srcReturn = 'photo_result'; return go('gallery');   // historique (versions comprises)
    case 'R0_PH_PREVIEW': return { st: st, toast: '👁 Aperçu (coût nul)' };
    case 'R0_PH_VALID': return { st: st, toast: '✅ Paramètres validés' };
    // GÉNÉRATION PHOTO -> passe par la CONFIRMATION DE COÛT (jamais de dépense directe)
    case 'R0_PH_GENERATE': st.pending = { kind: 'image', mediaKind: 'photo', regen: false }; return go('confirm');
    case 'R0_PH_REGEN': st.pending = { kind: 'image', mediaKind: 'photo', regen: true }; return go('confirm');
    case 'R0_PH_KEEP': return Object.assign(go('photo_result', '✅ <b>Photo gardée</b>'), { op: { type: 'etat', which: 'lastImage', etat: 'garde' } });
    case 'R0_PH_DEL': return Object.assign(go('photo', '🗑 <b>Photo retirée</b> <i>(historique conservé)</i>'), { op: { type: 'etat', which: 'lastImage', etat: 'supprime' } });
    case 'R0_PH_EDIT': return Object.assign(go('photo_prompt'), { op: { type: 'loaddraft', kind: 'photo', which: 'lastImage' } });
    case 'R0_PH_USE': return go('photo_prompt', '🛠 <b>Préparation photo</b>');     // (P2) « Utiliser » -> menu de PRÉPARATION (boîte à outils)
    case 'R0_PH_OTHER': return go('photo_source');                                 // « Une autre » -> sources (Galerie/Archives/Récents/Importer)
    case 'R0_PH_TOVIDEO': return Object.assign(go('video_params', '🎬 <b>Photo posée comme source</b>'), { op: { type: 'draft', kind: 'video', patch: { source: 'photo du projet' } } });
    // VIDÉO
    case 'R0_VI_IMPORT': return { st: st, await: { upload: 'source' }, banner: '📥 <b>Envoie ton image dans le prochain message.</b>\n<i>Elle sera la source de la vidéo (aucune dépense).</i>' };
    case 'R0_VI_PICK': st.galleryKind = 'image'; st.galleryAll = false; st.srcReturn = 'video_params'; return go('gallery'); // choisir QUELLE photo -> pose source -> retour prépa
    case 'R0_VI_GENPHOTO': st.ret = 'video'; return go('photo_prompt', '✨ <i>Génère la photo source — retour auto à la Vidéo</i>');
    case 'R0_VI_KEEPLOOK': return go('video_params', '✅ <b>Look conservé</b>');     // « Conserver ce look » -> paramètres -> aperçu -> générer
    case 'R0_VI_CREATE': return Object.assign(go('video_params'), { op: { type: 'draft', kind: 'video', patch: { source: 'photo du projet' }, onlyIfImageAndNoSource: true } });
    case 'R0_VI_HIST': st.galleryKind = 'video'; st.galleryAll = true; st.srcReturn = 'video'; return go('gallery');
    case 'R0_VI_PREVIEW': return { st: st, toast: '👁 Aperçu vidéo (coût nul)' };
    case 'R0_VI_VALID': return { st: st, toast: '✅ Paramètres vidéo validés' };
    // GÉNÉRATION VIDÉO -> CONFIRMATION DE COÛT (payant : Anthropic+ElevenLabs+Kling)
    case 'R0_VI_GENERATE': st.pending = { kind: 'video', mediaKind: 'video', regen: false }; return go('confirm');
    case 'R0_VI_REGEN': st.pending = { kind: 'video', mediaKind: 'video', regen: true }; return go('confirm');
    case 'R0_VI_KEEP': return Object.assign(go('video_result', '✅ <b>Vidéo gardée</b>'), { op: { type: 'etat', which: 'lastVideo', etat: 'garde' } });
    case 'R0_VI_DEL': return Object.assign(go('video', '🗑 <b>Vidéo retirée</b> <i>(historique conservé)</i>'), { op: { type: 'etat', which: 'lastVideo', etat: 'supprime' } });
    case 'R0_VI_EDIT': return Object.assign(go('video_params'), { op: { type: 'loaddraft', kind: 'video', which: 'lastVideo' } });
    // VIDÉO > ÉDITION (post-production regroupée, gratuit/local)
    case 'R0_VE': return go('video_edit');
    case 'R0_VE_SUBS': return { st: Object.assign(st, { screen: 'block', block: { screen: 'video', key: 'soustitres' } }) }; // (D) sous-titres dédiés
    case 'R0_VE_IMGFX': return Object.assign({ st: st, toast: '🎨 Édition image (local, gratuit)' }, { op: { type: 'draft', kind: 'video', patch: { image_fx: 'réglée' } } });
    // CONFIRMATION DE DÉPENSE
    case 'R0_GO': {
      const p = st.pending || { kind: 'image' }; st.pending = null;
      if (p.kind === 'text') { return Object.assign({ st: Object.assign(st, { screen: parentOfAsk(p.ask), block: null }), banner: '✨ <b>Texte généré</b> — éditable' }, { op: { type: 'gentext', ask: p.ask } }); }
      if (p.kind === 'video') return Object.assign(go('video_result', '🎬 <b>Vidéo générée</b>'), { op: { type: 'create', kind: 'video', useDraft: true } });
      if (st.ret === 'video') { st.ret = null; return Object.assign(go('video', '✨ <b>Photo créée</b> → source vidéo prête'), { op: { type: 'create', kind: 'image', useDraft: true, then: { type: 'draft', kind: 'video', patch: { source: 'photo générée' } } } }); }
      return Object.assign(go('photo_result', '✨ <b>Photo générée</b>'), { op: { type: 'create', kind: 'image', useDraft: true } });
    }
    case 'R0_GO2': return go('confirm2');                                          // (garde-fou) récap -> 2ᵉ confirmation explicite (ne dépense PAS)
    case 'R0_GO2_CANCEL': return go('confirm', '✖️ Annulé — aucune dépense');        // 2ᵉ confirmation annulée -> retour récap
    case 'R0_GEN_CANCEL': { const p = st.pending || {}; st.pending = null; return go(p.kind === 'video' ? 'video_params' : (p.kind === 'text' ? parentOfAsk(p.ask || 'ph_prompt') : 'photo_prompt'), '✖️ Annulé — aucune dépense'); }
    // PUBLICATION (gatée)
    case 'R0_PUB_EDIT': return { st: Object.assign(st, { screen: 'block', block: { screen: 'pub', key: 'legende' } }) };
    case 'R0_PUB_SAVE': return Object.assign({ st: st, toast: '💾 Brouillon sauvegardé au dossier' }, { op: { type: 'statut', statut: 'brouillon' } });
    case 'R0_PUB_DO': return Object.assign(go('publication', '📤 <b>Publication GATÉE</b> <i>(nécessite le GO d\'Etoile — aucun envoi réel)</i>'), { op: { type: 'decision', action: 'tentative publication', raison: 'GATÉE — GO requis' } });
    default: return { st: st };
  }
}

// Applique une OP du reducer contre le Socle. Retourne les faits à jour. (I/O concentré ici, partagé bot+test.)
function applyOp(op, S, base, persona, id, facts, ctx, ts) {
  const C = require('./conscience');
  if (!op || op.type === 'none') return facts;
  const draftKey = (mediaKind) => (mediaKind === 'video' ? 'video' : 'photo'); // média image|video -> tampon photo|video
  switch (op.type) {
    case 'create': S.addCandidate(base, persona, id, ts, op.kind, op.useDraft ? S.getDraft(facts, draftKey(op.kind)) : (op.attrs || {})); break;
    case 'etat': { const m = op.which === 'lastVideo' ? C.lastVideo(facts) : C.lastImage(facts); if (m) S.setMediaEtat(base, persona, id, m.id, op.etat, ts); break; }
    case 'draft': {
      if (op.onlyIfImage && !C.hasImage(facts)) break;
      if (op.onlyIfImageAndNoSource && (!C.hasImage(facts) || S.getDraft(facts, 'video').source)) break;
      S.setDraft(base, persona, id, op.kind, op.patch, ts); break;
    }
    case 'pub': S.setPublication(base, persona, id, op.patch, ts); break;
    case 'loaddraft': { const m = op.which === 'lastVideo' ? C.lastVideo(facts) : C.lastImage(facts); if (m) { const fields = op.kind === 'photo' ? ['prompt', 'avatar', 'look', 'decor', 'refs', 'format'] : ['source', 'mouvement', 'script', 'voix', 'musique', 'legendes', 'params']; const patch = {}; fields.forEach(k => { if (m[k] != null) patch[k] = m[k]; }); S.setDraft(base, persona, id, op.kind, patch, ts); } break; }
    case 'statut': S.setStatut(base, persona, id, op.statut, ts); break;
    case 'cleardraft': S.clearDraft(base, persona, id, ts); break;
    case 'picksrc': { // [P1.1] pose l'image choisie (galerie) DANS le projet (média réel) + comme source vidéo — raccordement au flux
      const real = (ctx && ctx.galleryFiles) || null;
      if (real && real[op.index]) { S.addCandidate(base, persona, id, ts, 'image', { file: real[op.index], simule: false, source: 'galerie' }); S.setDraft(base, persona, id, 'video', { source: 'Photo #' + (op.index + 1) }, ts); break; }
      const all = (ctx && ctx.galleryAll) ? C.medias(facts) : C.visibles(facts);
      const want = (ctx && ctx.galleryKind) === 'video' ? 'video' : 'image';
      const items = all.filter(m => want === 'video' ? m.type === 'video' : m.type !== 'video');
      const m = items[op.index]; if (m) S.setDraft(base, persona, id, 'video', { source: 'Photo #' + (op.index + 1) }, ts);
      break; }
    case 'gentext': { // texte généré (simulé tant que LIVE off) -> écrit dans le CHAMP EXISTANT (mappe ASKMAP). Aucun objet nouveau.
      const m = ASKMAP[op.ask]; if (m) { const txt = SIMTEXT[op.ask] || '✨ (texte généré — simulé, éditable)';
        if (m.target === 'pub') S.setPublication(base, persona, id, { [m.field]: txt }, ts);
        else S.setDraft(base, persona, id, m.kind, { [m.field]: txt }, ts); }
      break; }
    case 'duplicate': S.duplicateProject(base, persona, id, ts); break;
    case 'openrecent': { const p = ((ctx && ctx.recents && ctx.recents.projets) || [])[op.index];
      if (p && p.projectId) { const pf = S.loadFacts(base, persona, p.projectId); if (pf) S.saveFacts(base, persona, pf, ts); } break; } // garde-fou : projet introuvable -> ne crashe pas
    case 'decision': S.recordDecision(base, persona, id, op.action, op.raison, 'Etoile', ts); break;
  }
  if (op.then) return applyOp(op.then, S, base, persona, id, S.loadFacts(base, persona, id), ctx, ts);
  return S.loadFacts(base, persona, id);
}

module.exports = { NEXT, SETMAP, ASKMAP, view, blockSpec, resolveSet, parentKind, titleOf, reduce, applyOp, parentOf, parentOfAsk, fieldAlias };

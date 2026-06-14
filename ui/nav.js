// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — RÉFÉRENCE PRODUIT] NAVIGATION : mapping écran→vue, specs de blocs, tables SET/ASK.
//   PUR (sauf lecture facts). Partagé par le câble Telegram ET la preuve de scénario -> une seule source de vérité
//   pour « quel écran, quel bloc, quel champ ». Aucune I/O, aucune mutation ici (le câble écrit dans le Socle).
// ─────────────────────────────────────────────────────────────────────────────
const SC = require('./screens');
const C = require('./conscience');
// [#3 PAUSE INVISIBLE] garde-fou d'AFFICHAGE : le panneau Script ne montre JAMAIS « [pause] »/« pause » (la pause reste en coulisses pour le TTS).
let _stripPauseDisp; try { _stripPauseDisp = require('../tts_sanitize').stripPauseText; } catch (e) { _stripPauseDisp = (x) => String(x == null ? '' : x); }
// [#E libellés] tronque PROPREMENT un libellé de bouton (jamais coupé en plein mot) : nettoie le markdown, coupe à la limite de mot, ajoute « … ».
function _shortLbl(s, n) { s = String(s == null ? '' : s).replace(/[*_`\[\]"]/g, '').replace(/\s+/g, ' ').trim(); n = n || 15; return s.length > n ? (s.slice(0, n).replace(/\s+\S*$/, '').trim() || s.slice(0, n)) + '…' : s; }

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

  // [S — Etoile] Panneau « 🎛 Influences » SUPPRIMÉ (jugé inutile). La fonction utile (conserver tenue/décor) est portée par le réglage
  //   « 🔒 Conserver / 🔓 Ne pas conserver » directement dans les blocs Tenue/Décor (voir plus bas). L'identité du persona reste toujours active.

  // SOUS-TITRES (D) : activer/désactiver · position · taille — réglages PAR PROJET (draft.video), retour à Vidéo>Édition.
  //   Lit subtitle_style.js (legacy) pour les valeurs PAR DÉFAUT affichées, SANS jamais le modifier (verrou intact).
  if (block.key === 'soustitres') {
    // [SOUS-TITRES DÉFINITIF] AUTO-générés + incrustés : AUCUN on/off, AUCUN champ texte.
    //   ELLE règle UNIQUEMENT l'APPARENCE (boîte à outils legacy) : disposition · police · taille · position · couleur.
    //   Lecture des défauts subtitle_style (jamais d'écriture du verrou). Réglages PAR vidéo (draft.video), panneau qui RESTE ouvert.
    // [P4bis — Etoile] PANNEAU RÉDUIT À 3 RÉGLAGES : 🔤 Police · 📏 Taille · 📍 Hauteur. (Plus de disposition / couleur / presets de position.)
    const sty = (ctx && ctx.subStyle) || {};
    const font = d.st_font || sty.font || 'archivo';
    const size = d.st_size || sty.size || 'M';
    const oy = (d.st_oy != null && isFinite(+d.st_oy)) ? +d.st_oy : (sty.oy != null ? +sty.oy : 0.370); // [P4] défaut = LEGACY (0.370)
    const cap = 'auto · ' + font + ' · ' + size + ' · hauteur ' + oy.toFixed(2);
    return {
      title: '🔤 Sous-titres', current: cap, parentKind: pk, back: { text: '◀ Retour', cb: (ctx && ctx.subReturn) || 'R0_VE' },
      validateCb: (ctx && ctx.subReturn) || 'R0_VE', validateLabel: '✅ Valider',
      previewCb: 'R0_STPREV', // 👁 Aperçu : incruste un échantillon du script dans CE style (peint EN PLACE dans le cockpit)
      hint: 'Police · Taille · Hauteur. Aperçu/vidéo finale utilisent EXACTEMENT ces valeurs (défaut legacy 0.37).',
      optionRows: [
        [ { text: (font === 'archivo' ? '🔵 ' : '') + '🅰 Archivo', cb: 'R0_SET_stfont_archivo' },
          { text: (font === 'classique' ? '🔵 ' : '') + '🔤 Classique', cb: 'R0_SET_stfont_classique' } ], // 🔤 Police
        [ { text: (size === 'S' ? '🔵 ' : '') + '🔡 Petit', cb: 'R0_SET_stsize_S' },
          { text: (size === 'M' ? '🔵 ' : '') + '🔠 Moyen', cb: 'R0_SET_stsize_M' },
          { text: (size === 'L' ? '🔠 ' : '') + '🔠 Grand', cb: 'R0_SET_stsize_L' } ], // 📏 Taille
        [ { text: '⬇ Plus bas', cb: 'R0_STOY_dn' },
          { text: '📍 ' + oy.toFixed(2), cb: 'R0_STOY_NOP' },
          { text: '⬆ Plus haut', cb: 'R0_STOY_up' } ], // 📍 Hauteur (continu, ≈ Position y legacy)
        [ { text: '💾 Modèle défaut', cb: 'R0_DEFSAVE' } ], // [#5] un clic -> ces 3 réglages deviennent le défaut GLOBAL (réutilisé sur chaque nouvelle vidéo ; libellé court ≤18)
      ],
    };
  }
  // [#25/#7] RÉFÉRENCE PHOTO : image FIXE base des générations (≠ avatar). Consulter · Remplacer · Verrouiller · réutiliser.
  if (block.key === 'reference') {
    const locked = d.ref_locked ? '🔒 verrouillée' : '🔓 libre';
    return {
      title: '🖼 Référence', current: (d.reference || 'image par défaut') + ' · ' + locked, parentKind: pk, back: back,
      hint: 'Image de base réutilisée à chaque génération (différente de l\'avatar).',
      options: [
        { text: '👁 Consulter', cb: 'R0_REF_VIEW' }, { text: '🔄 Remplacer', cb: 'R0_REF_REPLACE' },
        { text: (d.ref_locked ? '🔓 Déverrouiller' : '🔒 Verrouiller'), cb: 'R0_REF_LOCK' },
        { text: '💾 Défaut', cb: 'R0_DEFSAVE' },
      ],
    };
  }
  // PUBLICATION : édition des LÉGENDES uniquement. [#2-plateforme — Etoile] PUCES PLATEFORME RETIRÉES du parcours (pas de connecteur réseau ;
  //   publier = marquer le statut Prêt à poster / Publié). On ne propose donc QUE l'édition courte/longue/hashtags (manuelle ou IA).
  if (block.screen === 'pub') {
    const p = (facts && facts.publication) || {};
    return {
      title: '📤 Légendes', current: p.legende_courte, parentKind: pk, back: back,
      options: [{ text: '✍️ Courte', cb: 'R0_ASK_pub_courte' }, { text: '✍️ Longue', cb: 'R0_ASK_pub_longue' }, { text: '#️⃣ Hashtags', cb: 'R0_ASK_pub_hashtags' },
        { text: '✨ Courte (IA)', cb: 'R0_GENTXT_pub_courte' }, { text: '✨ Longue (IA)', cb: 'R0_GENTXT_pub_longue' }, { text: '✨ #tags (IA)', cb: 'R0_GENTXT_pub_hashtags' }],
    };
  }

  // blocs à SAISIE LIBRE : ✍️ Saisir + ✨ Générer (IA) — service de texte transversal, GATÉ (Anthropic, payant).
  //   La source vidéo n'est pas un texte génératif (pas de bouton IA).
  const FREE = { prompt: 'ph_prompt', script: 'vi_script', source: 'vi_source' };
  if (FREE[block.key]) {
    const ask = FREE[block.key];
    const hasDef = !!(ctx && ctx.defaults && ctx.defaults[block.screen + '.' + block.key]);
    const pkFree = (block.key === 'prompt' || block.key === 'script') ? 'text' : pk; // texte (4096) pour prompt/script -> « Voir plus » déroule tout
    const curVal = (block.key === 'script') ? _stripPauseDisp(d[block.key]) : d[block.key]; // [#3] script affiché sans « pause »
    // ── IMAGE SOURCE : sélection réelle (pas une saisie) ──
    if (block.key === 'source') {
      return { title: titleOf(block), current: d[block.key], parentKind: pk, back: back, askCb: 'R0_ASK_' + ask,
        options: [{ text: '🖼 Choisir', cb: 'R0_VI_PICK' }, { text: '📥 Importer', cb: 'R0_VI_IMPORT' }], hint: 'Choisis une photo ou importe.' };
    }
    // ── SCRIPT : présentation LEGACY lisible — grille de CATÉGORIES claires (2/ligne, 🔵 = thème courant), ACTIONS séparées. Aucun modèle tronqué. ──
    //   Choisir/changer un thème GÉNÈRE le vrai script (câble) ; 🔄 Régénérer = autre version ; ✍️ Saisir (ajouté par blockView) = écrire le sien.
    if (block.key === 'script') {
      const cats = (ctx && ctx.scriptCats) || [];
      const optionRows = [[{ text: '🔄 Régénérer', cb: 'R0_REGEN_SCRIPT' }]]; // action principale, pleine largeur
      for (let i = 0; i < cats.length; i += 2) optionRows.push(cats.slice(i, i + 2).map((c, j) => ({ text: (d.theme === c.label ? '🔵 ' : '') + c.label, cb: 'R0_STHEME_' + (i + j) }))); // catégories legacy, 2/ligne, LISIBLES
      optionRows.push([{ text: '💾 Modèle défaut', cb: 'R0_DEFSAVE' }]);
      return { title: titleOf(block), current: curVal, parentKind: 'text', back: back, askCb: 'R0_ASK_' + ask, optionRows: optionRows, expanded: !!(ctx && ctx.blockExpanded),
        hint: 'Choisis un thème (génère le script) · 🔄 Régénérer pour une autre version · ✍️ Saisir pour écrire le tien.' };
    }
    // ── PROMPT (et autres saisies libres) : Générer IA + modèles 📁 (libellés PROPRES, jamais coupés en plein mot) + 💾 Défaut, en 2/ligne ──
    const optsP = [{ text: '✨ Générer (IA)', cb: 'R0_GENTXT_' + ask }];
    ((ctx && ctx.presets && ctx.presets.prompts) || []).slice(0, 3).forEach((p, i) => optsP.push({ text: '📁 ' + _shortLbl(p.title || p.name || ('Modèle ' + (i + 1)), 15), cb: 'R0_LOADP_' + i }));
    optsP.push({ text: '💾 Défaut', cb: 'R0_DEFSAVE' });
    const optionRowsP = []; for (let i = 0; i < optsP.length; i += 2) optionRowsP.push(optsP.slice(i, i + 2));
    return { title: titleOf(block), current: curVal, parentKind: pkFree, back: back, askCb: 'R0_ASK_' + ask, optionRows: optionRowsP, expanded: !!(ctx && ctx.blockExpanded),
      hint: 'Écris, charge un 📁 modèle, ou ✨ régénère puis édite.' + (hasDef ? ' (défaut dispo)' : '') };
  }
  // blocs à CHOIX (list/preset/literal) — + [#18] « 💾 Défaut » pour mémoriser le choix courant (voix/format…).
  // [S+T — Etoile] TENUE/DÉCOR : picker (2/ligne) + UN SEUL réglage « 🔒 Conserver / 🔓 Ne pas conserver » (conserver = réutilisé sur les prochaines générations).
  //   Plus de « Utiliser la tenue/décor » ni de panneau « Influences » (supprimés). DÉFAUT (D) : rien choisi -> image de base. « 🚫 Aucune » remet à l'image de base.
  if (block.key === 'look' || block.key === 'decor') {
    const lockFlag = block.key === 'look' ? 'lock_look' : 'lock_decor';
    const val = d[fieldAlias(block)]; const kept = d[lockFlag] === true;
    const cur = (val == null || String(val).trim() === '') ? '— image de base (rien choisi)' : (val + (kept ? ' · 🔒 conservé' : ''));
    const picker = optionsFor(block, ctx, d);                       // [X] tenues/décors (jusqu'à 12)
    const clear = { text: '🚫 Aucune (image de base)', cb: 'R0_LAYER_NONE_' + block.key };
    const lockToggle = kept ? { text: '🔓 Ne pas conserver', cb: 'R0_INFL_' + lockFlag }
                            : { text: '🔒 Conserver', cb: 'R0_INFL_' + lockFlag };
    const optionRows = []; for (let i = 0; i < picker.length; i += 2) optionRows.push(picker.slice(i, i + 2)); // 2/ligne
    optionRows.push([clear]); optionRows.push([lockToggle]);
    return { title: titleOf(block), current: cur, parentKind: pk, back: back, optionRows: optionRows };
  }
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
    const list = ((ctx && ctx[spec.name]) || []).slice(0, 12); // [X] jusqu'à 12 tenues/décors (picker complet)
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
  if (blk === 'stdisp') { return { target: 'draft', kind: 'video', field: 'st_display', value: token }; }  // mot|phrase [#27]
  if (blk === 'stfont') { return { target: 'draft', kind: 'video', field: 'st_font', value: token }; }     // archivo|classique [#27]
  if (blk === 'stcolor') { return { target: 'draft', kind: 'video', field: 'st_color', value: token }; }   // blanc|jaune|cyan [DÉFINITIF]
  const spec = SETMAP[blk]; if (!spec) return null;
  let value;
  if (spec.src === 'list') value = ((ctx && ctx[spec.name]) || [])[+token];
  else if (spec.src === 'preset') value = (SC.PRESETS[spec.name] || [])[+token];
  else value = token; // literal
  return { target: 'draft', kind: spec.kind, field: spec.field, value: value };
}

// ═══ [FIX STRUCTUREL DÉFINITIF — Etoile] EXIGENCES DE NAVIGATION PAR ÉCRAN ═══
//   Plus jamais d'ajout au cas par cas : le WRAPPER garantit, de façon centralisée, les boutons requis selon la CLASSE de l'écran.
//   cls 'gen'  = écran de préparation MENANT À UNE GÉNÉRATION  -> exige 👁 Aperçu (D3 : Aperçu -> Validation -> Générer, en aval) + ◀ Retour + 🏠 + 🛑
//   cls 'edit' = sous-vue d'édition / réglage                  -> exige ✅ Valider (cb DISTINCT R0_BLOCK_OK) + ◀ Retour + 🏠 + 🛑
//   prod = cb de l'entrée de production (Aperçu) ; back = cb retour parent.
//   [A1 — Etoile] SOURCE UNIQUE : le wrapper N'AJOUTE JAMAIS un cb déjà présent dans le corps (zéro doublon de callback_data).
//   La cartographie ÉCHOUE le déploiement si un écran requis n'a pas ses boutons (voir NAVREQ + test_v4r_carto).
const NAVREQ = {
  photo_prompt: { cls: 'gen', prod: 'R0_PH_PREVIEW', back: 'R0_PHOTO' },
  video_params: { cls: 'gen', prod: 'R0_VI_PREVIEW', back: 'R0_VI_BACK' },
  video_edit: { cls: 'gen', prod: 'R0_VI_PREVIEW', back: 'R0_VI_CREATE' }, // Montage : 👁 Aperçu (clip sous-titré) ; Validation/Générer en aval (D3)
  block: { cls: 'edit' }, // blockView pose ◀ Retour (+ 👁 Aperçu sous-titres) ; le wrapper pose le ✅ Valider unique (R0_BLOCK_OK)
};
function _btxt(rows) { return [].concat.apply([], rows).map(b => (b && b.text) || ''); }
function _bcb(rows) { return [].concat.apply([], rows).map(b => b && b.cb).filter(Boolean); }
// Rendu d'un état de navigation -> vue pure. state = { screen, section?, block? }
//   WRAPPER : garantit ◀ Retour + (👁 Aperçu sur 'gen' | ✅ Valider sur 'edit') + 🏠 Accueil + 🛑 Stop, SANS jamais dupliquer un cb existant.
function view(state, facts, ctx) {
  const v = _view(state, facts, ctx);
  if (state.screen === 'home' || !v || !Array.isArray(v.rows)) return v;
  const req = NAVREQ[state.screen] || null;
  const texts = _btxt(v.rows);
  const present = new Set(_bcb(v.rows));   // [A1] cbs DÉJÀ présents -> on n'en ré-ajoute aucun
  const hasTxt = re => texts.some(t => re.test(t));
  const RETOUR = /◀|Retour|Annuler|↩/;
  const APERCU = /👁|Aperçu/;
  const VALID = /✅\s*Valider/;
  const add = [];
  const pushU = b => { if (b && b.cb && !present.has(b.cb)) { add.push(b); present.add(b.cb); } }; // ajout UNIQUE (anti-doublon)
  if (req && req.cls === 'gen') {
    if (!hasTxt(APERCU)) pushU({ text: '👁 Aperçu', cb: req.prod }); // D3 : seule entrée de production sur l'écran de prépa
  } else if (req && req.cls === 'edit') {
    if (!hasTxt(VALID)) pushU({ text: '✅ Valider', cb: 'R0_BLOCK_OK' }); // cb DISTINCT du Retour -> 0 doublon
  }
  if (!hasTxt(RETOUR) && req && req.back) pushU({ text: '◀ Retour', cb: req.back });
  if (add.length) v.rows = v.rows.concat([add]);
  // 🏠 Accueil + 🛑 Stop garantis en dernier (sortie possible à TOUTE étape).
  const cb = _bcb(v.rows);
  const tail = [];
  if (cb.indexOf('R0_HOME') < 0) tail.push({ text: '🏠 Accueil', cb: 'R0_HOME' });
  if (cb.indexOf('R0_STOP') < 0) tail.push({ text: '🛑 Stop', cb: 'R0_STOP' });
  if (tail.length) v.rows = v.rows.concat([tail]);
  return v;
}
function _view(state, facts, ctx) {
  switch (state.screen) {
    case 'home': return SC.homeView(facts, ctx);
    case 'photo': return SC.photoView(facts, ctx);
    case 'photo_prompt': return SC.photoPromptView(facts, ctx);
    case 'photo_result': return SC.photoResultView(facts, ctx);
    case 'edition': return SC.editionView(facts, ctx); // [LOT 2 #7] boîte à outils couleur (🛠 Modifier)
    case 'video': return SC.videoView(facts, ctx);
    case 'video_params': return SC.videoParamsView(facts, ctx);
    case 'video_result': return SC.videoResultView(facts, ctx);
    case 'publication': return SC.publicationView(facts, ctx);
    case 'studio': return SC.studioView(facts, ctx);
    case 'studio_section': return SC.studioSectionView(facts, ctx);
    case 'recents': return SC.recentsView(facts, ctx);
    case 'confirm': return SC.confirmView(facts, ctx);
    case 'validation': return SC.validationView(facts, ctx); // [D3] écran chiffré distinct de l'Aperçu
    case 'confirm2': return SC.confirm2View(facts, ctx);
    case 'gallery': return SC.galleryView(facts, ctx);
    case 'video_edit': return SC.videoEditView(facts);
    case 'quit': return SC.quitView(facts);
    case 'photo_source': return SC.photoSourceView(facts);
    case 'video_source': return SC.videoSourceView(facts);
    case 'resources': return SC.resourcesView(facts, ctx);
    case 'pret': return SC.pretView(facts, ctx);
    case 'publies': return SC.publiesView(facts, ctx);
    case 'block': { const spec = blockSpec(state.block, facts, ctx); // [ANO-ARCH-VERSIONING] injecte l'historique du champ
      const vk = verKeysFor(state.block); spec.verKeys = vk;
      spec.hasVer = vk.some(k => ((facts && facts.versions && facts.versions[k]) || []).length > 0);
      return SC.blockView(spec); }
    case 'versions': return SC.versionsView(facts, ctx); // [ANO-ARCH-VERSIONING] 🕘 Historique versions (parcourir/restaurer)
    default: return SC.homeView(facts);
  }
}
// [ANO-ARCH-VERSIONING] champs versionnés exposés par chaque bloc d'édition (clés `scope.champ` / snapshot `video.st`).
function verKeysFor(block) {
  if (!block) return [];
  if (block.key === 'prompt') return ['photo.prompt'];
  if (block.key === 'script') return ['video.script'];
  if (block.key === 'soustitres') return ['video.st'];
  if (block.key === 'legende') return ['pub.legende_courte', 'pub.legende_longue', 'pub.hashtags'];
  return [];
}

function parentOf(blk) { return blk === 'pubplat' ? 'publication' : (blk.indexOf('st') === 0 ? 'video_params' : (blk.indexOf('ph') === 0 ? 'photo_prompt' : 'video_params')); }
function parentOfAsk(ask) { return ask.indexOf('ph_') === 0 ? 'photo_prompt' : (ask.indexOf('vi_') === 0 ? 'video_params' : 'publication'); }

// ═══ REDUCER PUR : (action, état, faits, ctx) -> { st, op?, banner?, toast?, await? } ═══
//   Décide l'écran suivant + l'OPÉRATION (mutation à appliquer par applyOp). AUCUNE I/O ici.
//   Partagé par le câble Telegram ET la preuve de scénario -> garantit que le test exécute la VRAIE logique.
//   op.type ∈ create|etat|draft|pub|loaddraft|statut|duplicate|openrecent|decision|none
// Écrans « flux en cours » : quitter vers l'Accueil demande d'abord « Enregistrer avant de quitter ? » (point 7).
const IN_PROGRESS = { photo_prompt: 1, video_params: 1, block: 1, confirm: 1, validation: 1, confirm2: 1, video_edit: 1 };

function reduce(action, st0, facts, ctx) {
  const st = { screen: st0.screen, section: st0.section || null, block: st0.block || null, ret: st0.ret || null, pending: st0.pending || null, quitFrom: st0.quitFrom || null, srcReturn: st0.srcReturn || null };
  const go = (screen, banner) => ({ st: Object.assign(st, { screen: screen, block: null }), banner: banner });
  const d = action;

  // « Enregistrer avant de quitter ? » : 🏠 depuis un flux EN COURS -> écran quit (jamais d'effacement silencieux).
  if (d === 'R0_HOME' && IN_PROGRESS[st.screen]) { st.quitFrom = st.screen; return { st: Object.assign(st, { screen: 'quit' }) }; }
  if (d === 'R0_QUIT_SAVE') { st.quitFrom = null; return go('home'); }                                  // [#2] Accueil sobre : pas de bandeau verbeux
  if (d === 'R0_QUIT_DISCARD') { st.quitFrom = null; return Object.assign(go('home'), { op: { type: 'cleardraft' } }); }
  if (d === 'R0_QUIT_CANCEL') { const back = st.quitFrom || 'home'; st.quitFrom = null; return { st: Object.assign(st, { screen: back }) }; }

  // [SCRIPTS — #script complet] R0_STHEME_*/R0_REGEN_SCRIPT sont INTERCEPTÉS par le câble (telegram_bot) qui génère le VRAI script complet (Anthropic ; dry -> déterministe).
  //   Ce reduce reste un repli pur (mémorise le thème) au cas où le câble ne traiterait pas ; il NE chaîne PLUS de gentext simulé.
  if (d.indexOf('R0_STHEME_') === 0) {
    const i = +d.slice(10); const c = (ctx && ctx.scriptCats && ctx.scriptCats[i]) || null;
    if (!c) return { st: st, toast: 'Thème indisponible' };
    return { st: Object.assign(st, { screen: 'block' }), op: { type: 'draft', kind: 'video', patch: { theme: c.label, theme_seed: c.seed } }, toast: '🎬 Thème : ' + c.label };
  }
  // [P4bis] HAUTEUR sous-titres (≈ « Position y » legacy) : stepper continu sur draft.video.st_oy, borné, reste sur le panneau. Défaut legacy 0.37.
  if (d === 'R0_STOY_NOP') { return { st: st }; }
  if (d === 'R0_STOY_up' || d === 'R0_STOY_dn') {
    const dv = (facts && facts.draft && facts.draft.video) || {};
    let v = (dv.st_oy != null && isFinite(+dv.st_oy)) ? +dv.st_oy : 0.370;
    v = +(v + (d === 'R0_STOY_up' ? 0.03 : -0.03)).toFixed(2);
    v = Math.max(0.12, Math.min(0.88, v));
    return Object.assign({ st: st }, { op: { type: 'draft', kind: 'video', patch: { st_oy: v } } });
  }
  // [LOT 2 #7] STEPPERS retouche couleur : R0_EDIT_<param>_<up|dn> -> incrémente/décrémente, borné, reste sur l'écran edition. (PREVIEW/VALID = côté bot, ffmpeg.)
  if (/^R0_EDIT_(bright|contrast|sat|sharp)_(up|dn)$/.test(d)) {
    const m = d.slice(8).split('_'); const p = m[0], dir = m[1];
    const STEP = { bright: 0.1, contrast: 0.1, sat: 0.2, sharp: 0.5 };
    const RANGE = { bright: [-0.3, 0.3], contrast: [0.7, 1.4], sat: [0, 2], sharp: [-1, 2] };
    const NEUT = { bright: 0, contrast: 1, sat: 1, sharp: 0 };
    const key = 'eq_' + p; const dp = (facts && facts.draft && facts.draft.photo) || {};
    let v = dp[key] != null ? +dp[key] : NEUT[p];
    v = +(v + (dir === 'up' ? STEP[p] : -STEP[p])).toFixed(2);
    v = Math.max(RANGE[p][0], Math.min(RANGE[p][1], v));
    return Object.assign(go('edition'), { op: { type: 'draft', kind: 'photo', patch: { [key]: v } } });
  }
  if (d.indexOf('R0_SET_') === 0) {
    const rest = d.slice(7), us = rest.indexOf('_'), blk = rest.slice(0, us), token = rest.slice(us + 1);
    const r = resolveSet(blk, token, ctx);
    // [#D] choisir une TENUE/DÉCOR RÉACTIVE la couche (use_look/use_decor=true) -> picker cohérent avec « Désactiver » (sinon un layer désactivé resterait ignoré malgré le choix).
    const patch = r ? { [r.field]: r.value } : {};
    if (r && r.target !== 'pub' && r.field === 'look') patch.use_look = true;
    if (r && r.target !== 'pub' && r.field === 'decor') patch.use_decor = true;
    const op = r ? (r.target === 'pub' ? { type: 'pub', patch: { [r.field]: r.value } } : { type: 'draft', kind: r.kind, patch: patch }) : { type: 'none' };
    // [SOUS-TITRES DÉFINITIF] le panneau d'apparence RESTE ouvert (réglages multiples enchaînés) ; ✅ Valider referme. Les autres blocs (choix unique) referment au choix.
    if (blk.indexOf('st') === 0) { return { st: Object.assign(st, { screen: 'block' }), op: op }; }
    return { st: Object.assign(st, { screen: parentOf(blk), block: null }), op: op };
  }
  if (d.indexOf('R0_ASK_') === 0) { const ak = d.slice(7); const m = ASKMAP[ak] || {};
    return { st: st, await: { ask: ak }, banner: '✍️ <b>' + SC.esc(m.prompt || 'Ta réponse ?') + '</b>\n<i>Envoie-la dans le prochain message — je l\'intègre au bloc.</i>' }; }
  // GÉNÉRATEUR DE TEXTE (Anthropic, PAYANT) -> passe par la CONFIRMATION de coût comme le reste.
  // [B — Etoile] RÉGÉNÉRER LE SCRIPT IN-SCREEN : reste sur le bloc Script (pas de détour confirm, pas de perte d'écran), nouvelle version DANS le même thème.
  if (d === 'R0_REGEN_SCRIPT') { return { st: Object.assign(st, { screen: 'block', block: { screen: 'video', key: 'script' } }), op: { type: 'gentext', ask: 'vi_script' }, toast: '🔄 Nouvelle version (même thème)' }; }
  if (d.indexOf('R0_GENTXT_') === 0) { st.pending = { kind: 'text', mediaKind: 'text', ask: d.slice(10) }; return go('confirm'); }
  // [#12] ACCUEIL : Stop / Restart (répondent toujours, jamais de tap mort).
  if (d === 'R0_STOP') { st.pending = null; st.block = null; st.quitFrom = null; return go('home', '🛑 <b>Interrompu</b> — retour à l\'accueil (rien de perdu)'); } // Stop = sortie propre depuis n'importe quelle étape
  if (d === 'R0_RESTART') { return go('home', '🔄 <b>Rafraîchi</b>'); }
  // [#22/#24] RESSOURCES / FICHIERS DU PROJET : hub de récupération de tous les assets.
  if (d === 'R0_RES') { return go('resources'); }
  // [PRÊT À POSTER] valide le média courant (état « garde ») et l'ajoute à la file prête à publier.
  if (d === 'R0_READY') { return Object.assign(go('pret', '📤 <b>Ajouté à « Prêt à poster »</b>'), { op: { type: 'etat', which: 'lastVideo', etat: 'garde' } }); }
  if (d === 'R0_PRET') { return go('pret'); } // [LOT1 accueil] OUVRE la file Prêt à poster (sans marquer de média — pas d'effet de bord)
  if (d.indexOf('R0_PRETITEM_') === 0) { return go('publication', '📤 <b>Sélection à publier</b>'); }
  if (d.indexOf('R0_PUBITEM_') === 0) { return { st: st, toast: '📤 Média publié (archive)' }; }
  // [#25/#7] RÉFÉRENCE PHOTO : consulter · remplacer (upload) · verrouiller. Reste sur le bloc référence.
  if (d === 'R0_STPREV') { return { st: st, toast: '👁 Aperçu sous-titres' }; } // [SOUS-TITRES] le bot intercepte et incruste l'échantillon ; reste sur le panneau
  if (d === 'R0_REF_VIEW') { return { st: st, toast: '👁 Référence courante affichée (image de base)' }; }
  if (d === 'R0_REF_REPLACE') { return { st: st, await: { upload: 'reference' }, banner: '🖼 <b>Envoie la nouvelle image de référence.</b>\n<i>Elle servira de base à tes prochaines générations (aucune dépense).</i>' }; }
  if (d === 'R0_REF_LOCK') { const lock = !((facts && facts.draft && facts.draft.photo) || {}).ref_locked; return { st: st, toast: lock ? '🔒 Référence verrouillée' : '🔓 Référence déverrouillée', op: { type: 'draft', kind: 'photo', patch: { ref_locked: lock } } }; }
  if (d === 'R0_PHB_edition') { return { st: st, toast: '🎨 Édition image (local, gratuit)', op: { type: 'draft', kind: 'photo', patch: { image_fx: 'réglée' } } }; } // (P2) Édition dans la prépa photo (local)
  if (d.indexOf('R0_PHB_') === 0) { return { st: Object.assign(st, { screen: 'block', block: { screen: 'photo', key: d.slice(7) } }) }; }
  // [#B sous-titres] toute entrée « sous-titres » (R0_VIB_subs hérité) ROUTE vers le VRAI panneau key='soustitres' (Police·Taille·Hauteur·Modèle), jamais un « • subs » cassé.
  if (d.indexOf('R0_VIB_') === 0) { let _k = d.slice(7); if (_k === 'subs' || _k === 'soustitres') return { st: Object.assign(st, { screen: 'block', block: { screen: 'video', key: 'soustitres' } }) }; return { st: Object.assign(st, { screen: 'block', block: { screen: 'video', key: _k } }) }; }
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
    // [G1] RÔLES DISTINCTS (plus de doublon strict) : GALERIE = grille de SÉLECTION pour le flux (✅ Choisir -> photo_prompt) ; HISTORIQUE = journal chronologique en LECTURE (revoir le passé, pas de Choisir).
    case 'R0_PH_GAL': st.galleryKind = 'image'; st.galleryAll = true; st.galleryRole = 'select'; st.srcReturn = 'photo_prompt'; return go('gallery');   // [D4] GALERIE = défaut GLOBAL + filtre 📁 Ce projet, rôle SÉLECTION
    case 'R0_PH_HIST': st.galleryKind = 'image'; st.galleryAll = true; st.galleryRole = 'history'; st.srcReturn = null; return go('gallery');   // [G1] HISTORIQUE = LECTURE seule (revoir), aucune sélection vers le flux
    // [R4] APERÇU = vrai écran récap (confirm) ; la production passe TOUJOURS par là. (plus de toast)
    case 'R0_PH_PREVIEW': st.pending = { kind: 'image', mediaKind: 'photo', regen: false }; return go('confirm');
    // [LOT 2] ✅ Valider la photo (Étape 1) : ÉPINGLE la source du projet (pinsource via ctx.coverFile) puis ouvre l'Étape 2 (Préparer).
    case 'R0_PH_VALID': return Object.assign(go('photo_prompt', '✅ <b>Photo validée</b> — c\'est la source du projet.'), { op: { type: 'pinsource' } });
    case 'R0_PH_TOOLS': return go('edition', '🛠 <b>Retouche couleur</b> <i>(non destructif)</i>'); // [LOT 2 #7] boîte à outils
    case 'R0_EDIT_NOP': return { st: st };
    case 'R0_EDIT_RESET': return Object.assign(go('edition', '↺ <b>Réglages réinitialisés</b>'), { op: { type: 'draft', kind: 'photo', patch: { eq_bright: 0, eq_contrast: 1, eq_sat: 1, eq_sharp: 0 } } });
    case 'R0_PH_MONTAGE': return go('photo_prompt');   // [G3] Montage RETIRÉ de Photo (concept vidéo) : l'écran orphelin n'existe plus, on renvoie vers la préparation
    case 'R0_BLOCK_OK': { // [A1] ✅ Valider d'un bloc (cb UNIQUE) -> revient au parent (brouillon déjà sauvegardé), sans dupliquer le cb du Retour
      const blk = st.block || {};
      if (blk.key === 'soustitres' && ctx && ctx.subReturn) return reduce(ctx.subReturn, Object.assign(st, { block: null }), facts, ctx); // sous-titres ouverts depuis l'aperçu -> y revient (re-rend le clip)
      const scr = blk.screen === 'photo' ? 'photo_prompt' : (blk.screen === 'video' ? (blk.key === 'soustitres' ? 'video_edit' : 'video_params') : 'publication');
      return go(scr, '✅ <b>Validé</b>'); }
    case 'R0_GEN_VALID': return go('validation'); // [D3] Aperçu -> ✅ Valider -> écran VALIDATION chiffré (garde-fou)
    case 'R0_VALID_BACK': return go('confirm', '↩️ <i>Retour à l\'aperçu</i>'); // [D3] Validation -> Retour -> Aperçu (média)
    // GÉNÉRATION PHOTO -> passe par la CONFIRMATION DE COÛT (jamais de dépense directe)
    case 'R0_PH_GENERATE': st.pending = { kind: 'image', mediaKind: 'photo', regen: false }; return go('confirm');
    case 'R0_PH_REGEN': st.pending = { kind: 'image', mediaKind: 'photo', regen: true }; return go('confirm');
    case 'R0_PH_KEEP': return Object.assign(go('photo_result', '✅ <b>Photo gardée</b>'), { op: { type: 'etat', which: 'lastImage', etat: 'garde' } });
    case 'R0_PH_DEL': return Object.assign(go('photo', '🗑 <b>Photo retirée</b> <i>(historique conservé)</i>'), { op: { type: 'etat', which: 'lastImage', etat: 'supprime' } });
    case 'R0_PH_EDIT': return Object.assign(go('photo_prompt'), { op: { type: 'loaddraft', kind: 'photo', which: 'lastImage' } });
    case 'R0_PH_USE': return go('photo_prompt', '🛠 <b>Préparation photo</b>');     // (P2) « Utiliser » -> menu de PRÉPARATION (boîte à outils)
    case 'R0_PH_OTHER': return go('photo_source');                                 // « Une autre » -> sources (Galerie/Archives/Récents/Importer)
    // [R2] PHOTO→VIDÉO : la MÊME photo devient la source (on PIN le fichier exact -> jamais remplacée silencieusement).
    // [P2] On épingle EXACTEMENT l'image AFFICHÉE (couverture réelle = ctx.coverFile), pas un « dernier média » qui peut différer.
    case 'R0_PH_TOVIDEO': { const mi = C.lastImage(facts) || {}; const cf = (ctx && (ctx.sourceFile || ctx.coverFile)) || mi.file || null; // [SOURCE UNIQUE] la MÊME image source part en vidéo
      return Object.assign(go('video_params', '🎬 <b>Photo posée comme source</b>'), { op: { type: 'draft', kind: 'video', patch: { source: 'photo du projet', source_id: mi.id || null, source_file: cf } } }); }
    // VIDÉO
    case 'R0_VI_IMPORT': return { st: st, await: { upload: 'source' }, banner: '📥 <b>Envoie ton image dans le prochain message.</b>\n<i>Elle sera la source de la vidéo (aucune dépense).</i>' };
    case 'R0_VI_PICK': return go('video_source');   // [Remplacer] -> choix : galerie · importer photo · importer vidéo
    case 'R0_VI_GAL': st.galleryKind = 'image'; st.galleryAll = true; st.galleryRole = 'select'; st.srcReturn = 'video_params'; return go('gallery'); // [D4 arbitrage] source vidéo : défaut GLOBAL + filtre 📁 Ce projet, rôle SÉLECTION
    case 'R0_GALSCOPE': { const ns = !((ctx && ctx.galleryAll)); st.galleryAll = ns; return { st: Object.assign(st, { screen: 'gallery' }), toast: ns ? '🌍 Tout le patrimoine' : '📁 Ce projet seulement' }; } // bascule projet/global (lit le scope courant via ctx)
    case 'R0_VI_IMPORTVID': return { st: st, await: { upload: 'sourcevid' }, banner: '🎬 <b>Envoie ta vidéo dans le prochain message.</b>\n<i>Elle deviendra la source (aucune dépense).</i>' };
    case 'R0_VI_GENPHOTO': st.ret = 'video'; return go('photo_prompt', '✨ <i>Génère la photo source — retour auto à la Vidéo</i>');
    case 'R0_VI_BACK': return go('video');                                            // [R3] Retour depuis Préparer -> VIDÉO·Choisir (jamais de self-loop)
    case 'R0_VI_KEEPLOOK': { const mi = C.lastImage(facts) || {}; const cf = (ctx && (ctx.sourceFile || ctx.coverFile)) || mi.file || null; // [ANO-SOURCE-EDIT-REVERT] « Garder » ÉPINGLE la photo courante comme source projet (sinon source vide -> dérive)
      return Object.assign(go('video_params', '✅ <b>Look conservé</b>'), { op: { type: 'draft', kind: 'video', patch: { source: 'photo du projet', source_id: mi.id || null, source_file: cf } } }); }
    case 'R0_VI_CREATE': { const mi = C.lastImage(facts) || {}; const cf = (ctx && (ctx.sourceFile || ctx.coverFile)) || mi.file || null; return Object.assign(go('video_params'), { op: { type: 'draft', kind: 'video', patch: { source: 'photo du projet', source_id: mi.id || null, source_file: cf }, onlyIfImageAndNoSource: true } }); }
    case 'R0_VI_HIST': st.galleryKind = 'video'; st.galleryAll = true; st.galleryRole = 'history'; st.srcReturn = null; return go('gallery'); // [G1] HISTORIQUE vidéo = LECTURE seule (revoir)
    // [R4] APERÇU VIDÉO = vrai écran récap (confirm). Production toujours via aperçu.
    case 'R0_VI_PREVIEW': st.pending = { kind: 'video', mediaKind: 'video', regen: false }; return go('confirm');
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
    case 'R0_GEN_EDIT': { const p = st.pending || {}; st.pending = null; return go(p.kind === 'video' ? 'video_params' : (p.kind === 'text' ? parentOfAsk(p.ask || 'ph_prompt') : 'photo_prompt'), '✏️ <b>Édition</b>'); } // [R4] Éditer depuis l'aperçu -> retour prépa (cb distinct, pas de doublon)
    // PUBLICATION (gatée)
    case 'R0_PUB_EDIT': return { st: Object.assign(st, { screen: 'block', block: { screen: 'pub', key: 'legende' } }) };
    case 'R0_PUB_SAVE': return Object.assign({ st: st, toast: '💾 Brouillon sauvegardé au dossier' }, { op: { type: 'statut', statut: 'brouillon' } });
    case 'R0_PUB_DO': return Object.assign(go('publies', '📤 <b>Marqué publié</b> → Archives publiées <i>(envoi réel gaté)</i>'), { op: { type: 'etat', which: 'lastMedia', etat: 'publie' } });
    case 'R0_PUBLISHED': return go('publies');   // Studio → Archives publiées
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
    // [LOT 2] ÉPINGLE la SOURCE du projet (✅ Valider la photo) : la couverture réelle (ctx.coverFile) devient source_file photo ET vidéo.
    case 'pinsource': { const src = ctx && ctx.coverFile; if (src) { S.setDraft(base, persona, id, 'photo', { source_file: src }, ts); S.setDraft(base, persona, id, 'video', { source_file: src }, ts); } break; }
    case 'etat': { const m = op.which === 'lastVideo' ? C.lastVideo(facts) : (op.which === 'lastMedia' ? C.lastMedia(facts) : C.lastImage(facts)); if (m) S.setMediaEtat(base, persona, id, m.id, op.etat, ts); break; }
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
      if (real && real[op.index]) { const file = real[op.index]; S.addCandidate(base, persona, id, ts, 'image', { file: file, simule: false, source: 'galerie' });
        // [SOURCE UNIQUE] épingle CETTE photo comme source du projet (photo + vidéo) -> lue partout, jamais remplacée par une référence.
        S.setDraft(base, persona, id, 'photo', { source_file: file }, ts);
        S.setDraft(base, persona, id, 'video', { source: 'Photo #' + (op.index + 1), source_file: file }, ts); break; }
      const all = (ctx && ctx.galleryAll) ? C.medias(facts) : C.visibles(facts);
      const want = (ctx && ctx.galleryKind) === 'video' ? 'video' : 'image';
      const items = all.filter(m => want === 'video' ? m.type === 'video' : m.type !== 'video');
      const m = items[op.index]; if (m) S.setDraft(base, persona, id, 'video', { source: 'Photo #' + (op.index + 1) }, ts);
      break; }
    case 'gentext': { // texte généré (légendes/hashtags). [#script complet] Le SCRIPT (vi_script) ne passe PLUS par ici : il est généré EN ENTIER par le câble (r0GenScriptReal) ;
      //   ce stub « simulé » est donc supprimé pour le script (plus jamais de brouillon court affiché). Reste pour les champs publication.
      const m = ASKMAP[op.ask]; if (m && op.ask !== 'vi_script') { const txt = SIMTEXT[op.ask] || '✨ (texte généré — éditable)';
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

module.exports = { NEXT, SETMAP, ASKMAP, NAVREQ, view, blockSpec, resolveSet, parentKind, titleOf, reduce, applyOp, parentOf, parentOfAsk, fieldAlias, verKeysFor };

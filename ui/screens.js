// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — RÉFÉRENCE PRODUIT] VUES PURES, écran par écran (docs/ARCHITECTURE_PRODUIT_REFERENCE).
//   Chaque vue renvoie { kind, caption, rows, await? } :
//     • kind ∈ text|photo|video  -> le câble met l'APERÇU média en haut (photo/vidéo) ou un bloc texte sobre.
//     • rows = [[{text, cb}]]     -> boutons EXACTS de l'architecture ; le câble mappe cb -> callback_data.
//     • await (optionnel)         -> saisie de texte courte attendue (le câble arme r0Await).
//   T1 retenu : sous-vues éditées EN PLACE dans le bloc unique (aperçu = le bloc). Aucun empilement, aucun placeholder.
//   PUR : aucune I/O. Les listes dynamiques (looks/décors/avatars/prompts) arrivent via `ctx` (fournies par l'inventaire).
// ─────────────────────────────────────────────────────────────────────────────
const C = require('./conscience');

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function _cap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
// NETTOIE une valeur affichée : si c'est un objet « tenue » ou un JSON (même TRONQUÉ) hérité d'un ancien stockage,
//   en extrait un LIBELLÉ LISIBLE (catégorie #id) au lieu d'afficher du JSON brut. (Auto-réparation, non destructif.)
function cleanLabel(v) {
  if (v == null || v === '') return v;
  if (typeof v === 'object') { if (v.label) return v.label; if (v.name) return v.name; if (v.cat) return _cap(v.cat) + (v.id != null ? ' #' + v.id : ''); return 'Look' + (v.id != null ? ' #' + v.id : ''); }
  const s = String(v);
  if (s.charAt(0) === '{') {                                  // JSON (objet sérialisé), éventuellement tronqué
    try { return cleanLabel(JSON.parse(s)); } catch (e) {
      const c = s.match(/"cat"\s*:\s*"([^"]+)"/); const id = s.match(/"id"\s*:\s*(\d+)/);
      if (c) return _cap(c[1]) + (id ? ' #' + id[1] : ''); return s.replace(/[{}"]/g, '').slice(0, 24);
    }
  }
  return s;
}
function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function val(v, d) { return (v == null || v === '') ? (d || '<i>à définir</i>') : esc(cleanLabel(v)); }
// (P6) nombre de photos sources nécessaires selon la durée (déterministe) : 15s→1 · 30s→1 · 45s→2 · 60s→3.
function nbPhotos(duree) { const s = parseInt(duree, 10) || 30; return s >= 60 ? 3 : (s >= 45 ? 2 : 1); }
function nom(facts) { return (facts && facts.intention && facts.intention.message) ? short(facts.intention.message, 48) : C.situation(facts).nom; }
function capLigne(facts) { const i = (facts && facts.intention) || {}; return i.message ? ('🎯 ' + esc(short(i.message, 60))) : '🎯 <i>cap à définir</i>'; }
const HOME = { text: '🏠 Accueil', cb: 'R0_HOME' };

// [TITRES VERROUILLÉS] format FIGÉ, identique quels que soient les réglages. Aucune feature ne doit le recomposer.
//   Source unique de vérité des titres d'écran photo/vidéo : « 📸 PHOTO · Préparer/Aperçu/Résultat » · « 🎬 VIDÉO · … ».
const TITLES = {
  photo_prepare: '📸 PHOTO · Préparer', photo_apercu: '📸 PHOTO · Aperçu', photo_resultat: '📸 PHOTO · Résultat',
  video_prepare: '🎬 VIDÉO · Préparer', video_apercu: '🎬 VIDÉO · Aperçu', video_resultat: '🎬 VIDÉO · Résultat',
  texte_apercu: '✨ TEXTE · Aperçu',
};
function titleFor(key) { return TITLES[key] || ''; }

// ── ÉCRAN 1 — ACCUEIL (jamais vide : COUVERTURE = dernière image du projet ; sinon sobre, sans placeholder) ──
function homeView(facts) {
  const hasImg = C.hasImage(facts);
  // (I) Accueil sobre : nom du projet + statut dérivé + 4 portes. (plus de « cap à définir » ni « couverture : … »)
  const cap = '<b>🎬 Studio</b> · ' + esc(nom(facts))
    + '\n📍 <b>' + esc(C.statutProjet(facts)) + '</b>'
    + '\n\n<i>Choisis où aller :</i> · <code>/menu</code> pour le menu principal';
  return {
    kind: hasImg ? 'photo' : 'text', caption: cap, rows: [   // couverture = image RÉELLE si elle existe ; sinon texte (aucun cadre vide)
      [{ text: '📸 PHOTO', cb: 'R0_PHOTO' }, { text: '🎬 VIDÉO', cb: 'R0_VIDEO' }],
      [{ text: '🏛 STUDIO', cb: 'R0_STUDIO' }, { text: '🕘 RÉCENTS', cb: 'R0_RECENTS' }],
      [{ text: '🛑 STOP', cb: 'R0_STOP' }, { text: '🔄 Restart', cb: 'R0_RESTART' }],  // [#12/#3] Stop/Restart sur l'Accueil
    ],
  };
}

// ── ÉCRAN 2 — PHOTO ──────────────────────────────────────────────────────────
function photoView(facts) {
  const has = C.hasImage(facts);
  const n = C.visibles(facts).filter(m => m.type !== 'video').length;
  const cap = '<b>📸 PHOTO · Choisir</b>'
    + (has ? ('\n🖼 ' + n + (n > 1 ? ' photos disponibles' : ' photo disponible') + ' dans le projet') : '\n<i>aucune photo — à créer</i>');
  // (P2/P1.1b) si une photo existe : « Utiliser » -> préparation (boîte à outils) ; « Modifier » -> galerie (choisir/éditer).
  const rows = (has
    ? [[{ text: '✅ Utiliser', cb: 'R0_PH_USE' }, { text: '✏️ Modifier', cb: 'R0_PH_GAL' }]]
    : []).concat([
      [{ text: '✨ Générer', cb: 'R0_PH_GEN' }, { text: '📥 Importer', cb: 'R0_PH_IMPORT' }],
      [{ text: '🕘 Historique', cb: 'R0_PH_HIST' }, { text: '◀ Retour', cb: 'R0_HOME' }],   // [R3] Retour -> Accueil (écran enfant direct ; pas de doublon)
    ]);
  return { kind: has ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── PHOTO / CHOISIR UNE AUTRE (sources : Galerie · Archives · Récents · Importer) — point 5 ──
function photoSourceView(facts) {
  const cap = '<b>📸 Choisir une autre photo</b>\n<i>D\'où vient la photo ?</i>';
  return {
    kind: C.hasImage(facts) ? 'photo' : 'text', caption: cap, rows: [
      [{ text: '🖼 Galerie', cb: 'R0_PH_GAL' }, { text: '📦 Archives', cb: 'R0_PH_HIST' }],
      [{ text: '🕘 Récents', cb: 'R0_RECENTS' }, { text: '📥 Importer', cb: 'R0_PH_IMPORT' }],
      [{ text: '◀ Photo', cb: 'R0_PHOTO' }, HOME],
    ],
  };
}

// ── ÉCRAN 2.1 — PHOTO / PRÉPARER (cœur métier : Prompt · Tenue · Décor · Référence, + un seul 🛠 Montage) ────────
//   [R1/R5] Avatar retiré ; UNE seule « Référence » (image base) ; « Réf. visuelles » + « Format » + édition image regroupés dans 🛠 Montage.
const PH_BLOCKS = [
  { key: 'prompt', icon: '📝', label: 'Prompt' }, { key: 'look', icon: '👗', label: 'Tenue' },
  { key: 'decor', icon: '🏛', label: 'Décor' }, { key: 'reference', icon: '🖼', label: 'Référence' },
];
// Outils regroupés sous 🛠 Montage (photo) — plus aucun outil dispersé sur la préparation.
const PH_MONTAGE = [
  { key: 'refs', icon: '📎', label: 'Réf. visuelles' }, { key: 'params', icon: '🔲', label: 'Format' },
];
function photoPromptView(facts, ctx) {
  const d = (facts && facts.draft && facts.draft.photo) || {};
  const has = C.hasImage(facts);
  // (J/R8) prépa = étape + action seulement (le récap complet vit dans l'Aperçu).
  let cap = '<b>' + titleFor('photo_prepare') + '</b>\nChoisissez l\'action suivante.';
  const blockRows = [];
  for (let i = 0; i < PH_BLOCKS.length; i += 2) {
    blockRows.push(PH_BLOCKS.slice(i, i + 2).map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_PHB_' + b.key })));
  }
  // [Etoile] PHOTO = Prompt · Tenue · Décor (+ Référence) seulement. « Montage » est un concept VIDÉO -> RETIRÉ du parcours photo.
  const rows = blockRows.concat([
    [{ text: '👁 Aperçu', cb: 'R0_PH_PREVIEW' }],                                                // PRODUCTION via aperçu obligatoire
    [{ text: '🎬 Faire une vidéo', cb: 'R0_PH_TOVIDEO' }],                                       // [R2] pont vidéo : MÊME photo en source (jamais remplacée)
    [{ text: '◀ Retour', cb: 'R0_PHOTO' }],                                                      // NAVIGATION : Retour
  ]);
  return { kind: has ? 'photo' : 'text', caption: cap, rows: rows };
}
// ── PHOTO / 🛠 MONTAGE (boîte à outils de la photo, regroupée) ──
function photoMontageView(facts, ctx) {
  const d = (facts && facts.draft && facts.draft.photo) || {};
  const cap = '<b>🛠 PHOTO · Montage</b>\n📎 Réf. visuelles : ' + val(d.refs) + '   🔲 Format : ' + val(d.format, '9:16')
    + '\n🎨 Édition image : ' + val(d.image_fx ? 'réglée' : null) + '\n<i>Outils de la photo — gratuit (local).</i>';
  const rows = [
    PH_MONTAGE.map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_PHB_' + b.key })),
    [{ text: '🎨 Édition image', cb: 'R0_PHB_edition' }],
    [{ text: '◀ Retour', cb: 'R0_PH_GEN' }],
  ];
  return { kind: C.hasImage(facts) ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 2.2 — PHOTO / RÉSULTAT = HUB DES ASSETS ─────────────────────────────
//   [#22] image finale + prompt/tenue/décor + Modifier·Régénérer·Créer vidéo·Historique·Publication·Ressources du projet.
function photoResultView(facts) {
  const m = C.lastImage(facts) || {};
  const dr = (facts && facts.draft && facts.draft.photo) || {};
  // [écran final métier] image + prompt utilisé + tenue + décor + référence. Pas de jargon « test/simulation » en évidence.
  const cap = '<b>' + titleFor('photo_resultat') + '</b>'
    + '\n📝 Prompt : ' + val(m.prompt || dr.prompt)
    + '\n👗 Tenue : ' + val(cleanLabel(m.look || dr.look))
    + '\n🏛 Décor : ' + val(m.decor || dr.decor)
    + '\n🖼 Référence : ' + val((dr.reference ? 'définie' + (dr.ref_locked ? ' 🔒' : '') : null));
  return {
    kind: 'photo', caption: cap, rows: [
      [{ text: '✏️ Modifier', cb: 'R0_PH_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_PH_REGEN' }],
      [{ text: '🎬 Créer vidéo', cb: 'R0_PH_TOVIDEO' }, { text: '🕘 Historique', cb: 'R0_PH_HIST' }],
      [{ text: '📤 Publication', cb: 'R0_PUB' }, { text: '🗂 Ressources', cb: 'R0_RES' }],
      [{ text: '✅ Garder', cb: 'R0_PH_KEEP' }, { text: '◀ Retour', cb: 'R0_PHOTO' }],
      [HOME],
    ],
  };
}

// ── ÉCRAN 3 — VIDÉO ──────────────────────────────────────────────────────────
function videoView(facts) {
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  const kind = hasI ? 'photo' : 'text';   // [P2] la prép vidéo montre la PHOTO SOURCE (pas une vidéo démo) -> image cohérente
  const cap = '<b>🎬 VIDÉO · Choisir</b>'
    + (hasV ? '\n🎬 vidéo dans le projet' : (hasI ? '\n🖼 <i>photo source dispo — conserver ?</i>' : '\n<i>aucune source — importe ou génère une photo</i>'));
  // Arbre de décision (point 6) : si un look/source existe -> « Conserver ce look ? » en tête.
  const hasSource = hasI || hasV;
  // Chaque callback n'apparaît qu'UNE fois. hasSource : Conserver / Changer(=choisir une autre). Sinon : Choisir / Importer.
  const rows = (hasSource
    ? [[{ text: '✅ Conserver', cb: 'R0_VI_KEEPLOOK' }, { text: '🔄 Changer', cb: 'R0_VI_PICK' }],
       [{ text: '📥 Importer', cb: 'R0_VI_IMPORT' }, { text: '✨ Générer photo', cb: 'R0_VI_GENPHOTO' }]]
    : [[{ text: '🖼 Choisir', cb: 'R0_VI_PICK' }, { text: '📥 Importer', cb: 'R0_VI_IMPORT' }],
       [{ text: '✨ Générer photo', cb: 'R0_VI_GENPHOTO' }]]).concat([
      [{ text: '🎬 Créer vidéo', cb: 'R0_VI_CREATE' }, { text: '🛠 Montage', cb: 'R0_VE' }],
      [{ text: '🕘 Historique', cb: 'R0_VI_HIST' }, { text: '◀ Retour', cb: 'R0_HOME' }],   // [R3] Retour -> Accueil (enfant direct)
    ]);
  return { kind: kind, caption: cap, rows: rows };
}

// ── ÉCRAN 3.1 — VIDÉO / PARAMÈTRES (blocs éditables en place) ─────────────────
const VI_BLOCKS = [
  { key: 'source', icon: '🖼', label: 'Source' }, { key: 'mouvement', icon: '🎞', label: 'Anim.' },
  { key: 'script', icon: '📝', label: 'Script' }, { key: 'voix', icon: '🎤', label: 'Voix' },
  { key: 'musique', icon: '🎵', label: 'Musique' }, { key: 'legendes', icon: '💬', label: 'Légendes' },
  { key: 'duree', icon: '⏱', label: 'Durée' }, { key: 'params', icon: '⚙️', label: 'Format' },
];
const DUREE_DEFAUT = '30s';
function videoParamsView(facts) {
  const d = (facts && facts.draft && facts.draft.video) || {};
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  // (J/R8) prépa = étape + action seulement (récap complet à l'Aperçu).
  let cap = '<b>' + titleFor('video_prepare') + '</b>\nChoisissez l\'action suivante.';
  // [R6] IMAGE SOURCE (Garder · Remplacer · Générer) PUIS un seul 🛠 Montage (Script·Voix·Musique·Sous-titres·Durée·Mouvement). Format retiré.
  const rows = [
    [{ text: '✅ Garder', cb: 'R0_VI_KEEPLOOK' }, { text: '🔄 Remplacer', cb: 'R0_VI_PICK' }, { text: '✨ Générer', cb: 'R0_VI_GENPHOTO' }], // IMAGE SOURCE
    [{ text: '🛠 Montage', cb: 'R0_VE' }],                                                         // tous les outils vidéo regroupés
    [{ text: '👁 Aperçu', cb: 'R0_VI_PREVIEW' }],                                                  // PRODUCTION via aperçu obligatoire
    [{ text: '◀ Retour', cb: 'R0_VI_BACK' }],                                                      // NAVIGATION : Retour vers VIDÉO·Choisir (pas de boucle)
  ];
  return { kind: hasI ? 'photo' : 'text', caption: cap, rows: rows };   // [P2] prép vidéo = aperçu de la PHOTO SOURCE (cohérence image)
}

// ── ÉCRAN 3.2 — VIDÉO / RÉSULTAT ─────────────────────────────────────────────
function videoResultView(facts) {
  const m = C.lastVideo(facts) || {};
  const p = (facts && facts.publication) || {};
  const dv = (facts && facts.draft && facts.draft.video) || {};
  // [#22/#5] RÉSULTAT FINAL = HUB : vidéo + script + légendes (courte/longue/hashtags) + sous-titres — tout visible/récupérable.
  const cap = '<b>' + titleFor('video_resultat') + '</b>'
    + '\n🖼 source : ' + val(m.source || dv.source, 'photo du projet') + '   ⏱ ' + val(m.duree || dv.duree, '30s')
    + '\n📝 Script : ' + val(dv.script ? short(dv.script, 50) : null)
    + '\n✏️ Courte : ' + val(p.legende_courte)
    + '\n📄 Longue : ' + val(p.legende_longue ? short(p.legende_longue, 50) : null)
    + '\n#️⃣ Hashtags : ' + val(p.hashtags)
    + '\n🔤 Sous-titres : ' + esc(String(dv.soustitres || 'auto'));
  return {
    kind: 'video', caption: cap, rows: [
      [{ text: '✏️ Modifier', cb: 'R0_VI_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_VI_REGEN' }],
      [{ text: '✏️ Légendes', cb: 'R0_PUB_EDIT' }, { text: '🗂 Fichiers projet', cb: 'R0_RES' }],
      [{ text: '📤 Prêt à poster', cb: 'R0_READY' }, { text: '📤 Publier', cb: 'R0_PUB' }],
      [{ text: '✅ Garder', cb: 'R0_VI_KEEP' }, { text: '◀ Retour', cb: 'R0_VIDEO' }],
      [HOME],
    ],
  };
}
// ── PRÊT À POSTER : file des médias validés (etat « garde ») prêts à publier — grille paginée ──
function pretView(facts, ctx) {
  const items = (ctx && ctx.pretFiles) || [];
  const pg = (ctx && ctx.page) || { idx: 0, pages: 1, base: 0 };
  const total = (ctx && ctx.pretTotal != null) ? ctx.pretTotal : items.length;
  let cap = '<b>📤 Prêt à poster</b> · ' + total + ' média(s) validé(s) · page ' + (pg.idx + 1) + '/' + pg.pages
    + (items.length ? '\n<i>touche un numéro pour le publier</i>' : '\n<i>aucun média validé — touche « Garder » sur un résultat</i>');
  const rows = gridRows(items, (m, i) => ({ text: '📤 ' + (pg.base + i + 1), cb: 'R0_PRETITEM_' + i }), 3);
  if (pg.pages > 1) rows.push([{ text: '◀ Précédent', cb: 'R0_GPREV' }, { text: 'Page ' + (pg.idx + 1) + '/' + pg.pages, cb: 'R0_GPREV' }, { text: 'Suivant ▶', cb: 'R0_GNEXT' }]);
  rows.push([{ text: '◀ Retour', cb: 'R0_VI_RESULT' }, HOME]);
  return { kind: items.length ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── ARCHIVES PUBLIÉES (Studio › Historique) : tout ce qui a été marqué « publié », grille paginée ──
function publiesView(facts, ctx) {
  const items = (ctx && ctx.publiesFiles) || [];
  const pg = (ctx && ctx.page) || { idx: 0, pages: 1, base: 0 };
  const total = (ctx && ctx.publiesTotal != null) ? ctx.publiesTotal : items.length;
  let cap = '<b>📤 Archives publiées</b> · ' + total + ' publié(s) · page ' + (pg.idx + 1) + '/' + pg.pages
    + (items.length ? '\n<i>tes médias publiés (retrouvables ici)</i>' : '\n<i>rien de publié pour l\'instant</i>');
  const rows = gridRows(items, (m, i) => ({ text: '📤 ' + (pg.base + i + 1), cb: 'R0_PUBITEM_' + i }), 3);
  if (pg.pages > 1) rows.push([{ text: '◀ Précédent', cb: 'R0_GPREV' }, { text: 'Page ' + (pg.idx + 1) + '/' + pg.pages, cb: 'R0_GPREV' }, { text: 'Suivant ▶', cb: 'R0_GNEXT' }]);
  rows.push([{ text: '◀ Retour', cb: 'R0_STUDIO' }, HOME]);
  return { kind: items.length ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 4 — PUBLICATION ────────────────────────────────────────────────────
function publicationView(facts) {
  const p = (facts && facts.publication) || {};
  const cap = '<b>📤 Publication</b> · ' + nom(facts)
    + '\n✏️ légende courte : ' + val(p.legende_courte)
    + '\n📄 légende longue : ' + val(p.legende_longue ? short(p.legende_longue, 60) : null)
    + '\n#️⃣ hashtags : ' + val(p.hashtags)
    + '\n🌐 plateforme : ' + val(p.plateforme)
    + (p.publie_le ? ('\n✅ publié le ' + esc(p.publie_le)) : '');
  return {
    kind: C.hasVideo(facts) ? 'video' : (C.hasImage(facts) ? 'photo' : 'text'), caption: cap, rows: [
      [{ text: '◀ Retour', cb: 'R0_VI_RESULT' }, { text: '✏️ Légende', cb: 'R0_PUB_EDIT' }],
      [{ text: '💾 Brouillon', cb: 'R0_PUB_SAVE' }, { text: '📤 Publier', cb: 'R0_PUB_DO' }],
      [HOME],
    ],
  };
}

// ── ÉCRAN 5 — STUDIO (sections raccrochées à l'existant) ─────────────────────
function studioView(facts, ctx) {
  const secs = (ctx && ctx.sections) || [];
  let cap = '<b>🏛 Studio</b> <i>(bibliothèques de l\'univers)</i>\n'
    + secs.map(s => s.icon + ' ' + s.label + ' : ' + s.count + (s.vide ? ' <i>(vide)</i>' : '')).join('\n');
  const rows = [];
  for (let i = 0; i < secs.length; i += 2) {
    rows.push(secs.slice(i, i + 2).map(s => ({ text: s.icon + ' ' + s.label, cb: 'R0_ST_' + s.key })));
  }
  rows.push([{ text: '🕘 Historique', cb: 'R0_PH_HIST' }, { text: '📤 Publiés', cb: 'R0_PUBLISHED' }]);   // [Etoile] Historique = TOUT (publiés ET non publiés) ; Publiés = uniquement les versions publiées
  rows.push([{ text: '🗂 Fichiers', cb: 'R0_RES' }]);   // [HUB] accès direct aux assets de la version courante (image/vidéo/script/légendes/audio/sous-titres/prompt/hashtags)
  rows.push([{ text: '◀ Retour', cb: 'R0_HOME' }]);
  return { kind: 'text', caption: cap, rows: rows };
}
function studioSectionView(facts, ctx) {
  const s = (ctx && ctx.section) || { icon: '🏛', label: 'Section', count: 0, items: [], source: '' };
  const items = (s.items || []).slice(0, 6);
  let cap = '<b>' + s.icon + ' ' + esc(s.label) + '</b> · ' + s.count + ' élément(s)'
    + (items.length ? '' : '\n<i>section présente — vide pour l\'instant</i>')
    + '\n<i>source : ' + esc(s.source || '—') + '</i>';
  // GRILLE des éléments (parcours facile), puis actions de section, puis retour.
  const rows = gridRows(items, (it, i) => ({ text: short(cleanLabel(it), 14), cb: 'R0_STI_' + i }), 3).concat([   // libellé lisible (jamais de JSON brut)
    [{ text: '➕ Ajouter', cb: 'R0_STA_add' }, { text: '✏️ Modifier', cb: 'R0_STA_edit' }, { text: '📋 Dupliquer', cb: 'R0_STA_dup' }],
    [{ text: '🗑 Supprimer', cb: 'R0_STA_del' }, { text: '✅ Choisir', cb: 'R0_STA_sel' }],
    [{ text: '◀ Retour', cb: 'R0_STUDIO' }, HOME],
  ]);
  return { kind: 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 6 — RÉCENTS / ARCHIVES ─────────────────────────────────────────────
function recentsView(facts, ctx) {
  const r = (ctx && ctx.recents) || { projets: [], brouillons: [], actifs: [], archives: [], legacy: 0 };
  const all = (r.projets || []);
  const pg = (ctx && ctx.page) || { idx: 0, pages: Math.max(1, Math.ceil(all.length / 6)), base: 0, size: 6 };
  const top = all.slice(pg.base, pg.base + pg.size);               // page courante
  let cap = '<b>🕘 Récents / Archives</b>\n'
    + '📂 ' + all.length + ' projet(s) · 📝 ' + (r.brouillons || []).length + ' brouillon(s) · 📦 ' + (r.archives || []).length + ' archivé(s)'
    + (r.legacy ? ('\n🗄 ' + r.legacy + ' hérité(s)') : '') + ' · page ' + (pg.idx + 1) + '/' + pg.pages
    + '\n' + (top.length ? '<i>touche un projet pour l\'ouvrir</i>' : '<i>aucun projet</i>');
  // NUMÉRO AFFICHÉ + index cb = ABSOLUS (base de page + j) -> ouverture correcte ; retrait = Archiver (soft).
  const rows = gridRows(top, (p, j) => ({ text: (pg.base + j + 1) + '. ' + short((p.intention && p.intention.message) || 'Projet', 18), cb: 'R0_RE_OPEN_' + (pg.base + j) }), 2);
  if (pg.pages > 1) rows.push([{ text: '◀ Précédent', cb: 'R0_REPREV' }, { text: 'Page ' + (pg.idx + 1) + '/' + pg.pages, cb: 'R0_REPREV' }, { text: 'Suivant ▶', cb: 'R0_RENEXT' }]);
  rows.push([{ text: '📋 Dupliquer', cb: 'R0_RE_DUP' }, { text: '📦 Archiver', cb: 'R0_RE_ARCH' }, { text: '🗂 Fichiers', cb: 'R0_RES' }]); // [HUB] accès assets du projet ouvert
  rows.push([{ text: '◀ Retour', cb: 'R0_HOME' }]);
  return { kind: 'text', caption: cap, rows: rows };
}

// ── « Enregistrer avant de quitter ? » (point 7) : ne JAMAIS effacer silencieusement un flux en cours ──
function quitView(facts) {
  const cap = '<b>Quitter ce flux ?</b>\n<i>Tu es au milieu d\'une préparation. Que faire ?</i>'
    + '\n\n• <b>Enregistrer</b> : garde ton brouillon dans le projet.'
    + '\n• <b>Quitter sans enregistrer</b> : abandonne ce brouillon (la matière déjà produite reste).'
    + '\n• <b>Annuler</b> : revenir où tu étais.';
  return {
    kind: C.mediaKind(facts), caption: cap, rows: [
      [{ text: '💾 Enregistrer', cb: 'R0_QUIT_SAVE' }, { text: '🚪 Quitter', cb: 'R0_QUIT_DISCARD' }],
      [{ text: '↩️ Annuler', cb: 'R0_QUIT_CANCEL' }],
    ],
  };
}

// ── GRILLE générique : éléments parcourables en lignes de `cols` (galeries/looks/réf/historiques) ──
function gridRows(items, mkBtn, cols) {
  cols = cols || 3; const rows = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols).map((it, j) => mkBtn(it, i + j)));
  return rows;
}

// ── CONFIRMATION DE DÉPENSE (Aperçu→Récap→Coût→Validation) : AVANT toute génération payante (photo ET vidéo) ──
//   ctx.confirm = { mediaKind, est:{moteur,credits,eur,gratuit,...}, credits, live:bool, budget:{tests,credits,max,next,remaining,exhausted} }
//   Affiche : (1) moteur · (2) coût · (3) crédits déjà consommés (cumul tests réels) + « test réel n°X/10 » · (4) validation.
//   En SIMULATION (live=false) : aucune dépense, le compteur n'avance pas. À 10/10 réel : BLOQUE.
function confirmView(facts, ctx) {
  const cf = (ctx && ctx.confirm) || {};
  const e = cf.est || {};
  const paid = !e.gratuit;
  const live = !!cf.live;          // moteur réel armé (GO d'Etoile) vs simulation
  const b = cf.budget || { tests: 0, credits: 0, max: 10, next: 1, remaining: 10, exhausted: false };
  const blocked = paid && live && b.exhausted;
  const titre = cf.mediaKind === 'video' ? titleFor('video_apercu') : (cf.mediaKind === 'text' ? titleFor('texte_apercu') : titleFor('photo_apercu'));
  const pr = cf.prep || {};
  // [R4] APERÇU = ÉCRAN RÉCAP MÉTIER (pas un toast). Infos UTILES à la création, prompt/script EN ENTIER, aucun jargon technique.
  let cap = '<b>' + titre + '</b>';
  if (cf.mediaKind === 'photo') {
    cap += '\n📝 Prompt : ' + (pr.promptFull ? esc(pr.promptFull) : '<i>(par défaut)</i>');
    cap += '\n👗 Tenue : ' + val(cleanLabel(pr.outfit));
    cap += '\n🏛 Décor : ' + val(pr.decor);
    cap += '\n🖼 Référence : ' + val(pr.reference ? 'définie' + (pr.refLocked ? ' 🔒' : '') : null);
    cap += '\n🔲 Format : ' + esc(pr.format || '9:16');
  } else if (cf.mediaKind === 'video') {
    cap += '\n🖼 Source : ' + val(pr.source, 'photo du projet');
    cap += '\n📝 Script : ' + (pr.scriptFull ? esc(pr.scriptFull) : '<i>(auto)</i>');
    cap += '\n🎤 Voix : ' + val(pr.voix) + '   🔤 Sous-titres : ' + esc(String(pr.soustitres || 'auto'));
    cap += '\n⏱ Durée : ' + (e.duree || pr.duree || '30s') + '   🖼 Photos prévues : ' + nbPhotos(e.duree || pr.duree);
  } else {
    cap += '\n📝 Texte (IA)';
  }
  if (paid) {
    cap += '\n💳 Coût : ' + (e.credits != null ? e.credits + ' cr ≈ ' : '') + (e.eur != null ? e.eur + ' €' : '?');
    if (blocked) cap += '\n⛔ <b>Budget épuisé (' + b.max + '/' + b.max + ')</b> — réautorisation requise.';
    else if (live) cap += '\n🧪 <b>Test réel n°' + b.next + '/' + b.max + '</b> — dépense au clic « Générer maintenant ».';
    else cap += '\n🧪 Tests : ' + b.tests + '/' + b.max + ' · 🟡 simulation — aucune dépense';
  } else cap += '\n🟢 Local — gratuit.';
  // [R4] Boutons DANS L'ORDRE EXIGÉ : ◀ Retour · ✏️ Éditer · ✅ Valider · ✨ Générer maintenant.
  //   (GARDE-FOU) « Générer maintenant » N'EFFECTUE PAS la dépense : il ouvre la 2ᵉ confirmation (R0_GO2). Seul « Oui, générer » dépense.
  const gen = '✨ Générer maintenant';
  // [texte entier] si prompt/script présent : bouton pour recevoir le TEXTE COMPLET en message séparé (hors limite média 1024).
  const fullBtn = (cf.mediaKind === 'photo' && pr.promptFull) ? [{ text: '📄 Texte complet', cb: 'R0_FULLTEXT_prompt' }]
    : (cf.mediaKind === 'video' && pr.scriptFull) ? [{ text: '📄 Script complet', cb: 'R0_FULLTEXT_script' }] : null;
  const rows = (blocked
    ? [[{ text: '◀ Retour', cb: 'R0_GEN_CANCEL' }, { text: '✏️ Éditer', cb: 'R0_GEN_EDIT' }]]
    : [[{ text: '◀ Retour', cb: 'R0_GEN_CANCEL' }, { text: '✏️ Éditer', cb: 'R0_GEN_EDIT' }],
       [{ text: '✅ Valider', cb: 'R0_GEN_VALID' }, { text: gen, cb: 'R0_GO2' }],
       [{ text: '💾 Modèle', cb: 'R0_SAVEMODEL' }]]);  // [P6] mémorise la config courante comme modèle réutilisable
  if (fullBtn) rows.splice(1, 0, fullBtn);
  return { kind: C.mediaKind(facts), caption: cap, rows: rows };
}

// ── 2ᵉ CONFIRMATION (garde-fou dépense) : SEUL « Oui, générer » déclenche l'appel réel. ──
function confirm2View(facts, ctx) {
  const cf = (ctx && ctx.confirm) || {};
  const e = cf.est || {}; const paid = !e.gratuit; const live = !!cf.live;
  const b = cf.budget || { tests: 0, max: 10, next: 1, exhausted: false };
  const blocked = paid && live && b.exhausted;
  const cout = (e.credits != null ? e.credits + ' cr ≈ ' : '') + (e.eur != null ? e.eur + ' €' : '?');
  let cap;
  if (blocked) cap = '<b>⛔ Budget de test épuisé (' + b.max + '/' + b.max + ')</b>\nRéautorisation nécessaire — aucune dépense.';
  else if (live) cap = '<b>⚠️ Dépense réelle</b>\n💳 ' + cout + '\n🧪 Test réel n°' + b.next + '/' + b.max + ' · ⚙️ ' + esc(e.moteur || '—') + '\n\n<b>Confirmer la génération ?</b>';
  else cap = '<b>🟡 Confirmation (simulation)</b>\n💳 ' + cout + ' <i>(aucune dépense)</i>\n🧪 Tests : ' + b.tests + '/' + b.max + ' · ⚙️ ' + esc(e.moteur || '—') + '\n\n<b>Confirmer ?</b>';
  const rows = blocked
    ? [[{ text: '◀ Retour', cb: 'R0_GEN_CANCEL' }]]
    : [[{ text: '✅ Oui, générer (n°' + b.next + ')', cb: 'R0_GO' }], [{ text: '◀ Annuler', cb: 'R0_GO2_CANCEL' }]];
  return { kind: C.mediaKind(facts), caption: cap, rows: rows };
}

// ── GALERIE / HISTORIQUE (grille) : parcourir les médias du projet sans cul-de-sac ──
function galleryView(facts, ctx) {
  const kindWanted = (ctx && ctx.galleryKind) || 'image';
  // [GALERIE] l'inventaire fournit la liste EXACTE (projet OU global) pour images ET vidéos. Le compteur = cette liste.
  const items = (ctx && ctx.galleryFiles) ? ctx.galleryFiles
    : ((ctx && ctx.galleryAll ? C.medias(facts) : C.visibles(facts)).filter(m => (kindWanted === 'video' ? m.type === 'video' : m.type !== 'video')));
  const scope = (ctx && ctx.galleryScope === 'global') ? ' globale' : ' du projet';
  const titre = (kindWanted === 'video' ? '🎬 Vidéos' : '🖼 Galerie') + scope;
  const total = (ctx && ctx.galleryTotal != null) ? ctx.galleryTotal : items.length;
  const ic = kindWanted === 'video' ? '🎬 ' : '🖼 ';
  const pg = (ctx && ctx.page) || { idx: 0, pages: 1, base: 0 };
  let cap = '<b>' + titre + '</b> · ' + total + (kindWanted === 'video' ? ' vidéo(s)' : ' photo(s)')
    + ' · page ' + (pg.idx + 1) + '/' + pg.pages
    + (items.length ? '\n<i>touche un numéro pour l\'utiliser</i>' : '\n<i>rien ici — génère ou importe</i>');
  const back = kindWanted === 'video' ? 'R0_VIDEO' : 'R0_PHOTO';
  // numéro AFFICHÉ = absolu (base de page + j) ; cb = index RELATIF dans la page (sélection correcte).
  const rows = gridRows(items, (m, i) => ({ text: ic + (pg.base + i + 1), cb: 'R0_GITEM_' + i }), 3);
  if (pg.pages > 1) rows.push([{ text: '◀ Précédent', cb: 'R0_GPREV' }, { text: 'Page ' + (pg.idx + 1) + '/' + pg.pages, cb: 'R0_GPREV' }, { text: 'Suivant ▶', cb: 'R0_GNEXT' }]);
  // [VISIBILITÉ] bascule scope : tout le patrimoine <-> ce projet seulement (la galerie remonte TOUT par défaut)
  rows.push([{ text: (ctx && ctx.galleryScope === 'global') ? '📁 Ce projet' : '🌍 Tout', cb: 'R0_GALSCOPE' }]);
  rows.push([{ text: '◀ Retour', cb: back }, HOME]);
  // image -> aperçu mosaïque (photo) ; vidéo -> liste texte (pas de planche d'images possible)
  return { kind: (items.length && kindWanted !== 'video') ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── VIDÉO / REMPLACER LA SOURCE : Choisir (galerie) · Importer photo · Importer vidéo ──
function videoSourceView(facts) {
  const cap = '<b>🔄 Remplacer la source</b>\n<i>D\'où vient la nouvelle source ?</i>';
  return {
    kind: C.mediaKind(facts), caption: cap, rows: [
      [{ text: '🖼 Choisir (galerie)', cb: 'R0_VI_GAL' }],
      [{ text: '📥 Importer photo', cb: 'R0_VI_IMPORT' }, { text: '🎬 Importer vidéo', cb: 'R0_VI_IMPORTVID' }],
      [{ text: '◀ Retour', cb: 'R0_VI_BACK' }],
    ],
  };
}

// ── RESSOURCES / FICHIERS DU PROJET (hub de récupération de TOUS les assets) ──────────────────
//   [#22/#24] tout au même endroit : photos · vidéos · prompt · tenue · décor · script · légendes · hashtags · sous-titres.
function resourcesView(facts, ctx) {
  const imgs = C.visibles(facts).filter(m => m.type !== 'video');
  const vids = C.visibles(facts).filter(m => m.type === 'video');
  const dp = (facts && facts.draft && facts.draft.photo) || {};
  const dv = (facts && facts.draft && facts.draft.video) || {};
  const p = (facts && facts.publication) || {};
  const cap = '<b>🗂 Ressources du projet</b> · ' + esc(nom(facts))
    + '\n🖼 Photos : ' + imgs.length + '   🎬 Vidéos : ' + vids.length
    + '\n📝 Prompt : ' + val(dp.prompt ? short(dp.prompt, 40) : null)
    + '\n👗 Tenue : ' + val(cleanLabel(dp.look)) + '   🏛 Décor : ' + val(dp.decor)
    + '\n🎬 Script : ' + val(dv.script ? short(dv.script, 40) : null)
    + '\n✏️ Légende courte : ' + val(p.legende_courte)
    + '\n📄 Légende longue : ' + val(p.legende_longue ? short(p.legende_longue, 40) : null)
    + '\n#️⃣ Hashtags : ' + val(p.hashtags)
    + '\n🔤 Sous-titres : ' + esc(String(dv.soustitres || 'auto'));
  // [HUB ASSETS — Etoile] récupération UN PAR UN de TOUS les fichiers de la version : un bouton dédié par type.
  //   Texte -> envoyé en message complet (R0_FULLTEXT_) ; fichiers -> envoyés tels quels (R0_GET*).
  const rows = [
    [{ text: '🖼 Image', cb: 'R0_GETIMG' }, { text: '🎬 Vidéo', cb: 'R0_GETVID' }, { text: '🎙 Voix/Audio', cb: 'R0_GETAUDIO' }],
    [{ text: '📝 Prompt', cb: 'R0_FULLTEXT_prompt' }, { text: '🎬 Script', cb: 'R0_FULLTEXT_script' }, { text: '🔤 Sous-titres', cb: 'R0_FULLTEXT_soustitres' }],
    [{ text: '✏️ Lég. courte', cb: 'R0_FULLTEXT_legc' }, { text: '📄 Lég. longue', cb: 'R0_FULLTEXT_legl' }, { text: '#️⃣ Hashtags', cb: 'R0_FULLTEXT_tags' }],
    [{ text: '🖼 Galerie photos', cb: 'R0_PH_HIST' }, { text: '🎬 Vidéos', cb: 'R0_VI_HIST' }],
    [{ text: '✏️ Éditer légendes', cb: 'R0_PUB_EDIT' }, { text: '📤 Publication', cb: 'R0_PUB' }],
    [{ text: '◀ Retour', cb: C.hasVideo(facts) ? 'R0_VI_RESULT' : 'R0_PHOTO' }, HOME],
  ];
  return { kind: C.mediaKind(facts), caption: cap, rows: rows };
}

// ── VIDÉO > ÉDITION (post-production regroupée) : Script · Légendes · Sous-titres · Édition image ──
function videoEditView(facts) {
  const d = (facts && facts.draft && facts.draft.video) || {};
  // [R6] 🛠 MONTAGE VIDÉO : Script · Musique · Sous-titres · Durée. (Voix ET Mouvement/Anim RETIRÉS : gérés par Kling, pas de contrôle séparé qui interfère.)
  let cap = '<b>🛠 VIDÉO · Montage</b>'
    + '\n📝 Script : ' + val(d.script ? short(d.script, 40) : null)
    + '\n🎵 Musique : ' + val(d.musique)
    + '\n🔤 Sous-titres : ' + esc(String(d.soustitres || 'auto'))
    + '\n⏱ Durée : ' + val(d.duree, '30s')
    + '\n<i>Voix & animation gérées par Kling. Reste = gratuit (local).</i>';
  return {
    kind: C.hasImage(facts) ? 'photo' : 'text', caption: cap, rows: [   // prep : on montre la source PHOTO, pas une vidéo
      [{ text: '📝 Script', cb: 'R0_VIB_script' }, { text: '🎵 Musique', cb: 'R0_VIB_musique' }],
      [{ text: '🔤 Sous-titres', cb: 'R0_VE_SUBS' }, { text: '⏱ Durée', cb: 'R0_VIB_duree' }],
      [{ text: '◀ Retour', cb: 'R0_VI_CREATE' }],
    ],
  };
}

// ── BLOC SUB-VIEW générique (T1, édité en place) : valeur courante + puces/saisie + ◀ retour parent ──
//   spec = { title, current, options:[{text,cb}], askCb?, back:{text,cb}, parentKind }
function blockView(spec) {
  let cap = '<b>' + spec.title + '</b>\nActuel : ' + val(spec.current)
    + (spec.hint ? ('\n<i>' + esc(spec.hint) + '</i>') : '');
  const rows = [];
  const opts = spec.options || [];
  for (let i = 0; i < opts.length; i += 3) rows.push(opts.slice(i, i + 3));
  if (spec.askCb) rows.push([{ text: '✍️ Saisir', cb: spec.askCb }]);
  if (spec.previewCb) rows.push([{ text: '👁 Aperçu', cb: spec.previewCb }]); // [SOUS-TITRES] incruste un échantillon dans le style courant
  // [VALIDER + RETOUR À CHAQUE ÉTAPE] tout bloc expose ✅ Valider ET ◀ Retour (le brouillon est déjà sauvegardé : les deux ramènent au parent).
  const backBtn = spec.back || { text: '◀ Retour', cb: 'R0_HOME' };
  const validBtn = { text: spec.validateLabel || '✅ Valider', cb: spec.validateCb || backBtn.cb };
  rows.push([validBtn, backBtn]);
  return { kind: spec.parentKind || 'text', caption: cap, rows: rows, await: spec.await || null };
}

// Presets fixes (aucune dépendance externe) pour les blocs à choix fermé.
const PRESETS = {
  ph_params: ['9:16', '1:1', '16:9'],
  vi_mouvement: ['zoom lent', 'panoramique', 'fixe', 'dynamique'],
  vi_voix: ['douce', 'énergique', 'posée', 'off'],
  vi_musique: ['off', 'automatique', 'personnalisée'],   // (E) permettre une vidéo SANS musique
  vi_legendes: ['oui', 'non'],
  vi_duree: ['15s', '30s', '60s'],                       // (K) durée explicite et éditable
  vi_params: ['9:16', '1:1'],                            // format
  pub_plateforme: ['TikTok', 'Instagram', 'YouTube'],
};

module.exports = {
  homeView, photoView, photoPromptView, photoResultView,
  videoView, videoParamsView, videoResultView, publicationView,
  studioView, studioSectionView, recentsView, blockView,
  confirmView, confirm2View, galleryView, videoEditView, quitView, photoSourceView, videoSourceView, photoMontageView, resourcesView, pretView, publiesView, gridRows,
  PH_BLOCKS, PH_MONTAGE, VI_BLOCKS, PRESETS, esc, cleanLabel, titleFor,
};

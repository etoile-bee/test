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
function nom(facts) { return (facts && facts.intention && facts.intention.message) ? short(facts.intention.message, 48) : C.situation(facts).nom; }
function capLigne(facts) { const i = (facts && facts.intention) || {}; return i.message ? ('🎯 ' + esc(short(i.message, 60))) : '🎯 <i>cap à définir</i>'; }
const HOME = { text: '🏠 Accueil', cb: 'R0_HOME' };

// ── ÉCRAN 1 — ACCUEIL (jamais vide : COUVERTURE = dernière image du projet ; sinon sobre, sans placeholder) ──
function homeView(facts) {
  const hasImg = C.hasImage(facts);
  const cap = '<b>🎬 Studio podcast</b>\n' + capLigne(facts)
    + (hasImg ? '\n🖼 <i>couverture : dernière image du projet</i>' : '\n<i>nouveau projet — commence par créer</i>')
    + '\n\n<i>Choisis où aller :</i>';
  return {
    kind: hasImg ? 'photo' : 'text', caption: cap, rows: [   // couverture = image RÉELLE si elle existe ; sinon texte (aucun cadre vide)
      [{ text: '📸 PHOTO', cb: 'R0_PHOTO' }, { text: '🎬 VIDÉO', cb: 'R0_VIDEO' }],
      [{ text: '🏛 STUDIO', cb: 'R0_STUDIO' }, { text: '🕘 RÉCENTS', cb: 'R0_RECENTS' }],
    ],
  };
}

// ── ÉCRAN 2 — PHOTO ──────────────────────────────────────────────────────────
function photoView(facts) {
  const has = C.hasImage(facts);
  const n = C.visibles(facts).filter(m => m.type !== 'video').length;
  const cap = '<b>📸 PHOTO · Choisir</b>'
    + (has ? ('\n🖼 ' + n + ' photo(s) — <i>utiliser l\'actuelle ?</i>') : '\n<i>aucune photo — à créer</i>');
  // Arbre de décision (point 5) : si une photo existe -> « Utiliser / Une autre » en tête.
  const rows = (has
    ? [[{ text: '✅ Utiliser', cb: 'R0_PH_USE' }, { text: '🔄 Changer', cb: 'R0_PH_OTHER' }]]
    : []).concat([
      [{ text: '✨ Générer', cb: 'R0_PH_GEN' }, { text: '📥 Importer', cb: 'R0_PH_IMPORT' }],
      [{ text: '🖼 Galerie', cb: 'R0_PH_GAL' }, { text: '🕘 Historique', cb: 'R0_PH_HIST' }],
      [HOME],
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

// ── ÉCRAN 2.1 — PHOTO / PROMPT (préparation, blocs éditables en place) ────────
const PH_BLOCKS = [
  { key: 'prompt', icon: '📝', label: 'Prompt' }, { key: 'avatar', icon: '👤', label: 'Avatar' },
  { key: 'look', icon: '👗', label: 'Look' }, { key: 'decor', icon: '🏛', label: 'Décor' },
  { key: 'refs', icon: '📎', label: 'Références' }, { key: 'params', icon: '⚙️', label: 'Paramètres' },
];
function photoPromptView(facts, ctx) {
  const d = (facts && facts.draft && facts.draft.photo) || {};
  const has = C.hasImage(facts);
  let cap = '<b>📸 PHOTO · Préparer</b>\n'
    + PH_BLOCKS.map(b => b.icon + ' ' + b.label + ' : ' + val(d[b.key])).join('\n');
  const blockRows = [];
  for (let i = 0; i < PH_BLOCKS.length; i += 2) {
    blockRows.push(PH_BLOCKS.slice(i, i + 2).map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_PHB_' + b.key })));
  }
  // Ordre par étape : PRÉPARATION (blocs) → VALIDATION → PRODUCTION → NAVIGATION (Retour ; pas d'Accueil en plein flux).
  const rows = blockRows.concat([
    [{ text: '👁 Aperçu', cb: 'R0_PH_PREVIEW' }, { text: '✅ Valider', cb: 'R0_PH_VALID' }],   // VALIDATION
    [{ text: '✨ Générer', cb: 'R0_PH_GENERATE' }],                                              // PRODUCTION (= Suivant)
    [{ text: '◀ Retour', cb: 'R0_PHOTO' }],                                                      // NAVIGATION (Accueil réservé aux sorties)
  ]);
  return { kind: has ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 2.2 — PHOTO / RÉSULTAT ─────────────────────────────────────────────
function photoResultView(facts) {
  const m = C.lastImage(facts) || {};
  const cap = '<b>📸 PHOTO · Résultat</b>'
    + '\n📝 ' + val(m.prompt, '<i>(prompt simulé)</i>')
    + '\n📌 ' + esc(m.etat || 'candidate') + (m.simule ? ' <i>(simulée)</i>' : ' <i>(réelle)</i>');
  return {
    kind: 'photo', caption: cap, rows: [
      [{ text: '✅ Garder', cb: 'R0_PH_KEEP' }, { text: '🗑 Supprimer', cb: 'R0_PH_DEL' }],
      [{ text: '✏️ Modifier', cb: 'R0_PH_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_PH_REGEN' }],
      [{ text: '🎬 Créer vidéo', cb: 'R0_PH_TOVIDEO' }],
      [HOME],
    ],
  };
}

// ── ÉCRAN 3 — VIDÉO ──────────────────────────────────────────────────────────
function videoView(facts) {
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  const kind = hasV ? 'video' : (hasI ? 'photo' : 'text');
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
      [{ text: '🎬 Créer vidéo', cb: 'R0_VI_CREATE' }, { text: '✂️ Édition', cb: 'R0_VE' }],
      [{ text: '🕘 Historique', cb: 'R0_VI_HIST' }, HOME],
    ]);
  return { kind: kind, caption: cap, rows: rows };
}

// ── ÉCRAN 3.1 — VIDÉO / PARAMÈTRES (blocs éditables en place) ─────────────────
const VI_BLOCKS = [
  { key: 'source', icon: '🖼', label: 'Image source' }, { key: 'mouvement', icon: '🎞', label: 'Mouvement' },
  { key: 'script', icon: '📝', label: 'Script' }, { key: 'voix', icon: '🎤', label: 'Voix' },
  { key: 'musique', icon: '🎵', label: 'Musique' }, { key: 'legendes', icon: '💬', label: 'Légendes' },
  { key: 'duree', icon: '⏱', label: 'Durée' }, { key: 'params', icon: '⚙️', label: 'Format' },
];
const DUREE_DEFAUT = '30s';
function videoParamsView(facts) {
  const d = (facts && facts.draft && facts.draft.video) || {};
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  const srcLabel = d.source || (hasI ? 'photo du projet' : null);
  // Durée TOUJOURS visible (défaut explicite) — répond à « ça génère quoi ? ».
  const shown = (b) => b.key === 'source' ? val(srcLabel)
    : b.key === 'duree' ? (d.duree ? esc(d.duree) : (DUREE_DEFAUT + ' <i>(défaut)</i>'))
    : b.key === 'params' ? (d.format ? esc(d.format) : '9:16 <i>(défaut)</i>')
    : val(d[b.key]);
  let cap = '<b>🎬 VIDÉO · Préparer</b>\n'
    + VI_BLOCKS.map(b => b.icon + ' ' + b.label + ' : ' + shown(b)).join('\n');
  const blockRows = [];
  for (let i = 0; i < VI_BLOCKS.length; i += 2) {
    blockRows.push(VI_BLOCKS.slice(i, i + 2).map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_VIB_' + b.key })));
  }
  // Ordre par étape : PRÉPARATION (blocs) → VALIDATION → PRODUCTION → NAVIGATION (Retour ; Accueil réservé aux sorties).
  const rows = blockRows.concat([
    [{ text: '👁 Aperçu', cb: 'R0_VI_PREVIEW' }, { text: '✅ Valider', cb: 'R0_VI_VALID' }],   // VALIDATION
    [{ text: '🎬 Générer', cb: 'R0_VI_GENERATE' }],                                              // PRODUCTION (= Suivant)
    [{ text: '◀ Retour', cb: 'R0_VIDEO' }],                                                      // NAVIGATION
  ]);
  return { kind: hasV ? 'video' : (hasI ? 'photo' : 'text'), caption: cap, rows: rows };
}

// ── ÉCRAN 3.2 — VIDÉO / RÉSULTAT ─────────────────────────────────────────────
function videoResultView(facts) {
  const m = C.lastVideo(facts) || {};
  const cap = '<b>🎬 VIDÉO · Résultat</b>'
    + '\n🖼 source : ' + val(m.source, 'photo du projet')
    + '\n⏱ ' + val(m.duree, '30s') + '   📝 ' + val(m.script, '<i>(simulé)</i>')
    + '\n📌 ' + esc(m.etat || 'candidate') + (m.simule ? ' <i>(maquette locale)</i>' : '');
  return {
    kind: 'video', caption: cap, rows: [
      [{ text: '✅ Garder', cb: 'R0_VI_KEEP' }, { text: '🗑 Supprimer', cb: 'R0_VI_DEL' }],
      [{ text: '✏️ Modifier', cb: 'R0_VI_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_VI_REGEN' }],
      [{ text: '📤 Publier', cb: 'R0_PUB' }],
      [HOME],
    ],
  };
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
  rows.push([HOME]);
  return { kind: 'text', caption: cap, rows: rows };
}
function studioSectionView(facts, ctx) {
  const s = (ctx && ctx.section) || { icon: '🏛', label: 'Section', count: 0, items: [], source: '' };
  const items = (s.items || []).slice(0, 9);
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
  const top = (r.projets || []).slice(0, 9);                       // grille jusqu'à 9 projets (retrouvabilité)
  let cap = '<b>🕘 Récents / Archives</b>\n'
    + '📂 ' + (r.projets || []).length + ' projet(s) · 📝 ' + (r.brouillons || []).length + ' brouillon(s) · 📦 ' + (r.archives || []).length + ' archivé(s)'
    + (r.legacy ? ('\n🗄 ' + r.legacy + ' projet(s) hérité(s) (lecture seule)') : '')
    + '\n' + (top.length ? '<i>touche un projet pour l\'ouvrir</i>' : '<i>aucun projet</i>');
  // GRILLE 2/ligne (libellés lisibles), puis actions sur le projet courant, puis Accueil.
  const rows = gridRows(top, (p, i) => ({ text: '▶ ' + short((p.intention && p.intention.message) || ('Projet ' + (i + 1)), 22), cb: 'R0_RE_OPEN_' + i }), 2);
  rows.push([{ text: '📋 Dupliquer', cb: 'R0_RE_DUP' }, { text: '📦 Archiver', cb: 'R0_RE_ARCH' }, { text: '🗑 Supprimer', cb: 'R0_RE_DEL' }]);
  rows.push([HOME]);
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
  const recap = (cf.mediaKind === 'video')
    ? ('🎬 Vidéo' + (e.duree ? ' · ' + e.duree : '') + ' · ' + (e.nb || 1) + ' plan(s)')
    : (cf.mediaKind === 'text')
      ? '📝 Texte (génération IA)'
      : ('📸 Photo' + ' · ' + (e.nb || 1) + ' img · ' + (e.format || '9:16'));
  // TERMINOLOGIE « Aperçu → Générer » : l'écran EST le récapitulatif avant de générer ; le coût reste visible.
  const gen = cf.mediaKind === 'video' ? '🎬 Générer' : (cf.mediaKind === 'text' ? '✨ Générer le texte' : '🎨 Générer');
  const titre = cf.mediaKind === 'video' ? '🎬 VIDÉO · Aperçu' : (cf.mediaKind === 'text' ? '✨ TEXTE · Aperçu' : '📸 PHOTO · Aperçu');
  let cap = '<b>' + titre + '</b>'
    + '\n' + recap
    + '\n⚙️ Moteur : ' + esc(e.moteur || '—');
  // (point 4) montre ce qui SERA envoyé au moteur (prompt/look/décor du projet) + ce qui n'est pas paramétrable.
  if (cf.prep) {
    cap += '\n📝 Prompt : ' + (cf.prep.prompt ? esc(short(cf.prep.prompt, 50)) : '<i>défaut</i>')
      + '\n👗 Look : ' + (cf.prep.outfit ? esc(cf.prep.outfit) : '<i>défaut</i>')
      + '\n🏛 Décor : ' + (cf.prep.decor ? esc(cf.prep.decor) : '<i>défaut</i>');
    if (cf.prep.unmapped && cf.prep.unmapped.length) cap += '\n<i>ℹ️ non paramétrable : ' + esc(cf.prep.unmapped.join(' ; ')) + '</i>';
  }
  if (paid) {
    cap += '\n💳 Coût : ' + (e.credits != null ? e.credits + ' cr ≈ ' : '') + (e.eur != null ? e.eur + ' €' : '?');
    cap += '\n🔋 Crédits déjà consommés (tests) : ' + b.credits;
    if (blocked) {
      cap += '\n\n⛔ <b>Budget de test épuisé (' + b.max + '/' + b.max + ')</b> — réautorisation nécessaire.';
    } else if (live) {
      cap += '\n🧪 <b>Test réel n°' + b.next + ' / ' + b.max + '</b> — dépense à ce clic.';
    } else {
      cap += '\n🟡 <b>Aperçu (simulation)</b> — aucune dépense · tests : ' + b.tests + '/' + b.max;
    }
  } else {
    cap += '\n🟢 Traitement local — aucune dépense.';
  }
  // En plein flux : PRODUCTION (Générer) + NAVIGATION (Retour). Pas d'Accueil ici (évite une sortie accidentelle).
  const rows = blocked
    ? [[{ text: '◀ Retour', cb: 'R0_GEN_CANCEL' }]]
    : [[{ text: (paid && live ? gen + ' (test n°' + b.next + ')' : gen), cb: 'R0_GO' }], [{ text: '◀ Retour', cb: 'R0_GEN_CANCEL' }]];
  return { kind: C.mediaKind(facts), caption: cap, rows: rows };
}

// ── GALERIE / HISTORIQUE (grille) : parcourir les médias du projet sans cul-de-sac ──
function galleryView(facts, ctx) {
  const kindWanted = (ctx && ctx.galleryKind) || 'image';
  const all = (ctx && ctx.galleryAll) ? C.medias(facts) : C.visibles(facts);
  const items = all.filter(m => (kindWanted === 'video' ? m.type === 'video' : m.type !== 'video'));
  const titre = (kindWanted === 'video' ? '🎬 Vidéos' : '🖼 Galerie') + (ctx && ctx.galleryAll ? ' (historique)' : '');
  let cap = '<b>' + titre + '</b> · ' + items.length + ' élément(s)'
    + (items.length ? '' : '\n<i>rien pour l\'instant — crée un média</i>');
  const back = kindWanted === 'video' ? 'R0_VIDEO' : 'R0_PHOTO';
  const rows = gridRows(items, (m, i) => ({ text: (m.etat === 'garde' ? '✅' : (m.etat === 'supprime' ? '🗑' : '•')) + ' ' + (i + 1), cb: 'R0_GITEM_' + i }), 4)
    .concat([[{ text: '◀ Retour', cb: back }, HOME]]);
  return { kind: C.hasImage(facts) || C.hasVideo(facts) ? (kindWanted === 'video' && C.hasVideo(facts) ? 'video' : 'photo') : 'text', caption: cap, rows: rows };
}

// ── VIDÉO > ÉDITION (post-production regroupée) : Script · Légendes · Sous-titres · Édition image ──
function videoEditView(facts) {
  const d = (facts && facts.draft && facts.draft.video) || {};
  const subs = d.legendes || 'auto';
  let cap = '<b>🎬 Vidéo · Édition</b> <i>(post-production)</i>'
    + '\n📝 Script : ' + val(d.script)
    + '\n💬 Légendes : ' + val(d.legendes)
    + '\n🔤 Sous-titres : ' + esc(String(subs))
    + '\n🎨 Édition image : ' + val(d.image_fx ? 'réglée' : null)
    + '\n<i>Tout au même endroit — gratuit (local).</i>';
  return {
    kind: C.hasVideo(facts) ? 'video' : (C.hasImage(facts) ? 'photo' : 'text'), caption: cap, rows: [
      [{ text: '📝 Script', cb: 'R0_VIB_script' }, { text: '🎤 Voix', cb: 'R0_VIB_voix' }],
      [{ text: '💬 Légendes', cb: 'R0_VIB_legendes' }, { text: '🔤 Sous-titres', cb: 'R0_VE_SUBS' }],
      [{ text: '🎨 Image', cb: 'R0_VE_IMGFX' }],
      [{ text: '◀ Vidéo', cb: 'R0_VIDEO' }],
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
  rows.push([spec.back || { text: '◀ Retour', cb: 'R0_HOME' }]);
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
  confirmView, galleryView, videoEditView, quitView, photoSourceView, gridRows,
  PH_BLOCKS, VI_BLOCKS, PRESETS, esc, cleanLabel,
};

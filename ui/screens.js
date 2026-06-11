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
function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function val(v, d) { return (v == null || v === '') ? (d || '<i>à définir</i>') : esc(v); }
function nom(facts) { return (facts && facts.intention && facts.intention.message) ? short(facts.intention.message, 48) : C.situation(facts).nom; }
function capLigne(facts) { const i = (facts && facts.intention) || {}; return i.message ? ('🎯 ' + esc(short(i.message, 60))) : '🎯 <i>cap à définir</i>'; }
const HOME = { text: '🏠 Accueil', cb: 'R0_HOME' };

// ── ÉCRAN 1 — ACCUEIL ───────────────────────────────────────────────────────
function homeView(facts) {
  const cap = '<b>🎬 Studio podcast</b>\n' + capLigne(facts) + '\n\n<i>Choisis où aller :</i>';
  return {
    kind: 'text', caption: cap, rows: [
      [{ text: '📸 PHOTO', cb: 'R0_PHOTO' }, { text: '🎬 VIDÉO', cb: 'R0_VIDEO' }],
      [{ text: '🏛 STUDIO', cb: 'R0_STUDIO' }, { text: '🕘 RÉCENTS', cb: 'R0_RECENTS' }],
    ],
  };
}

// ── ÉCRAN 2 — PHOTO ──────────────────────────────────────────────────────────
function photoView(facts) {
  const has = C.hasImage(facts);
  const n = C.visibles(facts).filter(m => m.type !== 'video').length;
  const cap = '<b>📸 Photo</b> · ' + nom(facts) + '\n' + capLigne(facts)
    + (has ? ('\n🖼 ' + n + ' photo(s) dans le projet') : '\n<i>aucune photo — à créer</i>');
  return {
    kind: has ? 'photo' : 'text', caption: cap, rows: [
      [{ text: '✨ Générer', cb: 'R0_PH_GEN' }, { text: '📥 Importer', cb: 'R0_PH_IMPORT' }],
      [{ text: '🖼 Galerie', cb: 'R0_PH_GAL' }, { text: '🕘 Historique', cb: 'R0_PH_HIST' }],
      [HOME],
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
  let cap = '<b>📸 Photo · préparation</b>\n'
    + PH_BLOCKS.map(b => b.icon + ' ' + b.label + ' : ' + val(d[b.key])).join('\n')
    + '\n<i>Touche un bloc pour l\'éditer (ici même).</i>';
  const blockRows = [];
  for (let i = 0; i < PH_BLOCKS.length; i += 2) {
    blockRows.push(PH_BLOCKS.slice(i, i + 2).map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_PHB_' + b.key })));
  }
  const rows = blockRows.concat([
    [{ text: '◀ Retour', cb: 'R0_PHOTO' }, { text: '❌ Annuler', cb: 'R0_PH_CANCEL' }],
    [{ text: '👁 Aperçu', cb: 'R0_PH_PREVIEW' }, { text: '✅ Valider', cb: 'R0_PH_VALID' }],
    [{ text: '✨ Générer', cb: 'R0_PH_GENERATE' }, HOME],
  ]);
  return { kind: has ? 'photo' : 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 2.2 — PHOTO / RÉSULTAT ─────────────────────────────────────────────
function photoResultView(facts) {
  const m = C.lastImage(facts) || {};
  const cap = '<b>📸 Photo — résultat</b> · ' + nom(facts)
    + '\n📝 ' + val(m.prompt, '<i>(prompt simulé)</i>')
    + '\n📌 statut : ' + esc(m.etat || 'candidate') + (m.simule ? ' <i>(simulée)</i>' : '');
  return {
    kind: 'photo', caption: cap, rows: [
      [{ text: '✅ Garder', cb: 'R0_PH_KEEP' }, { text: '🗑 Supprimer', cb: 'R0_PH_DEL' }],
      [{ text: '✏️ Modifier', cb: 'R0_PH_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_PH_REGEN' }],
      [{ text: '🎬 Faire une vidéo avec cette photo', cb: 'R0_PH_TOVIDEO' }],
      [HOME],
    ],
  };
}

// ── ÉCRAN 3 — VIDÉO ──────────────────────────────────────────────────────────
function videoView(facts) {
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  const kind = hasV ? 'video' : (hasI ? 'photo' : 'text');
  const cap = '<b>🎬 Vidéo</b> · ' + nom(facts) + '\n' + capLigne(facts)
    + (hasV ? '\n🎬 vidéo dans le projet' : (hasI ? '\n🖼 <i>photo source disponible</i>' : '\n<i>aucune source — importe ou génère une photo</i>'));
  return {
    kind: kind, caption: cap, rows: [
      [{ text: '📥 Importer source', cb: 'R0_VI_IMPORT' }, { text: '🖼 Choisir photo existante', cb: 'R0_VI_PICK' }],
      [{ text: '✨ Générer photo source', cb: 'R0_VI_GENPHOTO' }],
      [{ text: '🎬 Créer une vidéo', cb: 'R0_VI_CREATE' }, { text: '✂️ Édition', cb: 'R0_VE' }],
      [{ text: '🕘 Historique vidéo', cb: 'R0_VI_HIST' }, HOME],
    ],
  };
}

// ── ÉCRAN 3.1 — VIDÉO / PARAMÈTRES (blocs éditables en place) ─────────────────
const VI_BLOCKS = [
  { key: 'source', icon: '🖼', label: 'Image source' }, { key: 'mouvement', icon: '🎞', label: 'Mouvement' },
  { key: 'script', icon: '📝', label: 'Script' }, { key: 'voix', icon: '🎤', label: 'Voix' },
  { key: 'musique', icon: '🎵', label: 'Musique' }, { key: 'legendes', icon: '💬', label: 'Légendes' },
  { key: 'params', icon: '⚙️', label: 'Paramètres' },
];
function videoParamsView(facts) {
  const d = (facts && facts.draft && facts.draft.video) || {};
  const hasV = C.hasVideo(facts), hasI = C.hasImage(facts);
  const srcLabel = d.source || (hasI ? 'photo du projet' : null);
  let cap = '<b>🎬 Vidéo · préparation</b>\n'
    + VI_BLOCKS.map(b => b.icon + ' ' + b.label + ' : ' + (b.key === 'source' ? val(srcLabel) : val(d[b.key]))).join('\n')
    + '\n<i>Touche un bloc pour l\'éditer (ici même).</i>';
  const blockRows = [];
  for (let i = 0; i < VI_BLOCKS.length; i += 2) {
    blockRows.push(VI_BLOCKS.slice(i, i + 2).map(b => ({ text: b.icon + ' ' + b.label, cb: 'R0_VIB_' + b.key })));
  }
  const rows = blockRows.concat([
    [{ text: '◀ Retour', cb: 'R0_VIDEO' }, { text: '❌ Annuler', cb: 'R0_VI_CANCEL' }],
    [{ text: '👁 Aperçu', cb: 'R0_VI_PREVIEW' }, { text: '✅ Valider', cb: 'R0_VI_VALID' }],
    [{ text: '🎬 Générer vidéo', cb: 'R0_VI_GENERATE' }, HOME],
  ]);
  return { kind: hasV ? 'video' : (hasI ? 'photo' : 'text'), caption: cap, rows: rows };
}

// ── ÉCRAN 3.2 — VIDÉO / RÉSULTAT ─────────────────────────────────────────────
function videoResultView(facts) {
  const m = C.lastVideo(facts) || {};
  const cap = '<b>🎬 Vidéo — résultat</b> · ' + nom(facts)
    + '\n🖼 source : ' + val(m.source, 'photo du projet')
    + '\n📝 script : ' + val(m.script, '<i>(simulé)</i>')
    + '\n💬 légendes : ' + val(m.legendes, 'auto') + '\n📌 statut : ' + esc(m.etat || 'candidate') + (m.simule ? ' <i>(maquette locale)</i>' : '');
  return {
    kind: 'video', caption: cap, rows: [
      [{ text: '✅ Garder', cb: 'R0_VI_KEEP' }, { text: '🗑 Supprimer', cb: 'R0_VI_DEL' }],
      [{ text: '✏️ Modifier', cb: 'R0_VI_EDIT' }, { text: '🔁 Régénérer', cb: 'R0_VI_REGEN' }],
      [{ text: '📤 Exporter / Publier', cb: 'R0_PUB' }],
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
      [{ text: '◀ Retour', cb: 'R0_VI_RESULT' }, { text: '✏️ Modifier légende', cb: 'R0_PUB_EDIT' }],
      [{ text: '💾 Sauvegarder brouillon', cb: 'R0_PUB_SAVE' }, { text: '📤 Publier', cb: 'R0_PUB_DO' }],
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
  const rows = gridRows(items, (it, i) => ({ text: short(String(it), 14), cb: 'R0_STI_' + i }), 3).concat([
    [{ text: '➕ Ajouter', cb: 'R0_STA_add' }, { text: '✏️ Modifier', cb: 'R0_STA_edit' }, { text: '📋 Dupliquer', cb: 'R0_STA_dup' }],
    [{ text: '🗑 Supprimer', cb: 'R0_STA_del' }, { text: '✅ Sélectionner', cb: 'R0_STA_sel' }],
    [{ text: '◀ Retour', cb: 'R0_STUDIO' }, HOME],
  ]);
  return { kind: 'text', caption: cap, rows: rows };
}

// ── ÉCRAN 6 — RÉCENTS / ARCHIVES ─────────────────────────────────────────────
function recentsView(facts, ctx) {
  const r = (ctx && ctx.recents) || { projets: [], brouillons: [], actifs: [], archives: [], legacy: 0 };
  const top = (r.projets || []).slice(0, 5);
  let cap = '<b>🕘 Récents / Archives</b>\n'
    + '📂 ' + (r.projets || []).length + ' projet(s) · 📝 ' + (r.brouillons || []).length + ' brouillon(s) · 📦 ' + (r.archives || []).length + ' archivé(s)'
    + (r.legacy ? ('\n🗄 ' + r.legacy + ' projet(s) hérité(s) (lecture seule)') : '')
    + '\n' + (top.length ? top.map((p, i) => (i + 1) + '. ' + esc(short((p.intention && p.intention.message) || p.projectId, 40))).join('\n') : '<i>aucun projet</i>');
  const rows = top.map((p, i) => [{ text: '▶ ' + short((p.intention && p.intention.message) || ('Projet ' + (i + 1)), 28), cb: 'R0_RE_OPEN_' + i }]);
  rows.push([{ text: '📋 Dupliquer', cb: 'R0_RE_DUP' }, { text: '📦 Archiver', cb: 'R0_RE_ARCH' }, { text: '🗑 Supprimer', cb: 'R0_RE_DEL' }]);
  rows.push([HOME]);
  return { kind: 'text', caption: cap, rows: rows };
}

// ── GRILLE générique : éléments parcourables en lignes de `cols` (galeries/looks/réf/historiques) ──
function gridRows(items, mkBtn, cols) {
  cols = cols || 3; const rows = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols).map((it, j) => mkBtn(it, i + j)));
  return rows;
}

// ── CONFIRMATION DE DÉPENSE (Aperçu→Récap→Coût→Validation) : AVANT toute génération payante (photo ET vidéo) ──
//   ctx.confirm = { mediaKind:'photo'|'video', est:{moteur,credits,eur,gratuit,...}, credits, regen }
function confirmView(facts, ctx) {
  const cf = (ctx && ctx.confirm) || {};
  const e = cf.est || {};
  const paid = !e.gratuit;
  const recap = (cf.mediaKind === 'video')
    ? ('🎬 Vidéo' + (e.duree ? ' · ' + e.duree : '') + ' · ' + (e.nb || 1) + ' plan(s)')
    : ('📸 Photo' + ' · ' + (e.nb || 1) + ' img · ' + (e.format || '9:16'));
  let cap = '<b>' + (paid ? '💳 Confirmer la génération' : '✅ Confirmer') + '</b>'
    + '\n' + recap
    + '\n⚙️ Moteur : ' + esc(e.moteur || '—')
    + '\n' + (paid
      ? ('🔴 <b>PAYANT</b> — ' + (e.credits != null ? e.credits + ' cr ≈ ' : '') + (e.eur != null ? e.eur + ' €' : '?') + (ctx && ctx.credits != null ? ('\n🔋 Crédits restants : ' + ctx.credits) : ''))
      : '🟢 <b>GRATUIT</b> (traitement local)')
    + '\n\n<i>' + (paid ? 'Rien n\'est dépensé sans ton clic ci-dessous.' : 'Aucune dépense.') + '</i>';
  return {
    kind: C.mediaKind(facts), caption: cap, rows: [
      [{ text: (paid ? '💲 Valider et générer' : '✅ Générer'), cb: 'R0_GO' }, { text: '✖️ Annuler', cb: 'R0_GEN_CANCEL' }],
      [{ text: '🏠 Accueil', cb: 'R0_HOME' }],
    ],
  };
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
      [{ text: '📝 Script', cb: 'R0_VIB_script' }, { text: '💬 Légendes', cb: 'R0_VIB_legendes' }],
      [{ text: '🔤 Sous-titres', cb: 'R0_VE_SUBS' }, { text: '🎨 Édition image', cb: 'R0_VE_IMGFX' }],
      [{ text: '◀ Vidéo', cb: 'R0_VIDEO' }, HOME],
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
  vi_musique: ['aucune', 'douce', 'punchy', 'luxe'],
  vi_legendes: ['oui', 'non'],
  vi_params: ['9:16 · 15s', '9:16 · 30s', '1:1 · 30s'],
  pub_plateforme: ['TikTok', 'Instagram', 'YouTube'],
};

module.exports = {
  homeView, photoView, photoPromptView, photoResultView,
  videoView, videoParamsView, videoResultView, publicationView,
  studioView, studioSectionView, recentsView, blockView,
  confirmView, galleryView, videoEditView, gridRows,
  PH_BLOCKS, VI_BLOCKS, PRESETS, esc,
};

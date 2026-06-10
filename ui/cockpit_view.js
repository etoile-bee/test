// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] VUES DU COCKPIT (rendu PUR depuis manifest + flow).  view(...) -> { media, caption, rows }
//   Le câble Telegram fait : cockpitBlock.show(view(...))  → un seul bloc, édité en place.
//   Invariants couverts :
//     - Accueil = 4 entrées E104 (PHOTO·VIDÉO·STUDIO·RÉCENTS) ; RÉCENTS = vue filtrée (E121)
//     - Grammaire symétrique SOURCE→PARAMÈTRES→FINALISER (cockpit_flow)
//     - APERÇU PERMANENT : media = media_actif à CHAQUE étape (design C.9)
//     - ✅ VALIDER = action d'avance, DÉSACTIVÉE tant que le gate (média réel) n'est pas satisfait (C1/E108/E115)
//     - PARAMÈTRES = LISTE de lignes, chacune ouvrant un picker focalisé (1 décision à la fois) — pas de surcharge
//     - SOURCE photo = E35 (1/2/3) + E36 (planche contact) + sélection EXPLICITE avant de fixer le média
//     - FINALISER = gate QC (C4/E92 : identité·cohérence·réf·look) AVANT Final HD payant
//     - textes COURTS (verrou 8) ; image brute (verrou 9, raw=true côté transport)
//   PUR : aucune I/O, aucune dépendance Telegram. Pilotable par programme (compat Auto E7/C5).
// ─────────────────────────────────────────────────────────────────────────────
const FLOW = require('./cockpit_flow');

function short(s, n) { s = String(s == null ? '' : s); return s.length > (n || 22) ? s.slice(0, (n || 22) - 1) + '…' : s; }

// Nom de projet LISIBLE (V2) : nom donné, sinon « Projet · <date heure> » auto (jamais d'ID technique).
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
function projName(m) {
  if (m && m.name) return m.name;
  if (m && m.cree_le) { try { const d = new Date(m.cree_le); return 'Projet · ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); } catch (e) {} }
  return 'Projet';
}
// État GLOBAL du projet (lisible).
function etatLabel(m) {
  const sp = m && m.statut_publication, sq = m && m.statut_qualite;
  if (sp === 'publie') return '📣 publié'; if (sp === 'pret_a_poster') return '✅ prêt-à-poster'; if (sp === 'archive') return '🗄 archivé';
  if (sq === 'production') return '✅ finalisé'; if (m && m.media_actif) return '⏳ en cours'; return '📝 brouillon';
}
function zoneVal(m, key, fallback) {
  const z = m && m.zones && m.zones[key];
  const v = z ? (z.label || z.value) : null; const lock = (z && z.locked) ? '🔒' : '';
  return (v ? short(v, 12) + lock : (fallback ? short(fallback, 12) : '—'));
}
// ★ BANDEAU D'ÉTAT PROJET (tableau de bord) — affiché en tête de CHAQUE écran (la « sensation de piloter un projet »).
function hdr(m) {
  m = m || {};
  const l1 = '📁 <b>' + short(projName(m), 22) + '</b> · ' + etatLabel(m);
  const l2 = '🎯 ' + zoneVal(m, 'reference', m.reference && m.reference.label) + ' · 👗 ' + zoneVal(m, 'look', m.look && m.look.tenue) + ' · 🌆 ' + zoneVal(m, 'decor', m.look && m.look.decor) + ' · ✍️ ' + zoneVal(m, 'prompt', m.prompts && m.prompts[0] && m.prompts[0].name);
  const p = m.parametres || {};
  const l3 = '⚙️ ' + ((p.nb_images) || 1) + 'img·' + (p.duree || '23s') + '·' + (p.format || '9:16') + ' · ◫ ' + ((m.variantes || []).length) + ' var · 📦 ' + ((m.livrables_dossiers || []).length) + ' liv';
  return l1 + '\n' + l2 + '\n' + l3;
}

// Barre universelle (E108) : ⬅ Retour · ✅ Valider (gated) · 🏠 Accueil. Valider verrouillé -> cb dédié (toast).
function actionBar(flow, step, m) {
  const can = FLOW.canValidate(flow, step, m);
  const valider = FLOW.isLast(step)
    ? (can ? { text: '✅ Lancer Final HD', cb: 'V' } : { text: '🔒 Valider', cb: 'V_LOCK' })
    : (can ? { text: '✅ Valider', cb: 'V' } : { text: '🔒 Valider', cb: 'V_LOCK' });
  return [
    [{ text: '⬅ Retour', cb: 'BACK' }, valider, { text: '🏠 Accueil', cb: 'HOME' }],
    [{ text: '📊 Projet', cb: 'DASH' }, { text: '❓ Aide', cb: 'HELP' }], // V3 : Stop/Restart = commandes hors barre créative
  ];
}

// ★ ÉCRAN 📊 PROJET — tableau de bord complet : hiérarchie Projet → zones / candidates / média actif / versions / livrables.
function viewDashboard(m) {
  m = m || {};
  const p = m.parametres || {};
  const z = (k, fb) => zoneVal(m, k, fb);
  let cap = '📊 <b>' + short(projName(m), 28) + '</b> · ' + etatLabel(m) + '\n';
  cap += '\n<b>Zones</b>\n';
  cap += '🎯 Référence : ' + z('reference', m.reference && m.reference.label) + '\n';
  cap += '👗 Look : ' + z('look', m.look && m.look.tenue) + '\n';
  cap += '🌆 Décor : ' + z('decor', m.look && m.look.decor) + '\n';
  cap += '✍️ Prompt : ' + z('prompt', m.prompts && m.prompts[0] && m.prompts[0].name) + '\n';
  cap += '⚙️ Paramètres : ' + ((p.nb_images) || 1) + ' img · ' + (p.duree || '23s') + ' · ' + (p.format || '9:16') + '\n';
  cap += '\n<b>Objets</b>\n';
  cap += '🖼 Média actif : ' + (m.media_actif ? '✓' : '—') + ' · ◫ Variantes : ' + ((m.variantes || []).length) + '\n';
  cap += '🕘 Versions : ' + ((m.versions || []).length) + ' · 📦 Livrables : ' + ((m.livrables_dossiers || []).length) + '\n';
  const rows = [
    [{ text: '🎯 Réf', cb: 'P_REF' }, { text: '👗 Look', cb: 'P_TENUE' }, { text: '🌆 Décor', cb: 'P_DECOR' }],
    [{ text: '✍️ Prompt', cb: 'P_PROMPT' }, { text: '⚙️ Paramètres', cb: 'STEP_PARAMS' }],
    [{ text: '🖼 Étape en cours', cb: 'RESUME' }, { text: '📦 Livrables', cb: 'LIVRABLES' }, { text: '🕘 Versions', cb: 'VERSIONS' }],
    [{ text: '✏️ Renommer', cb: 'RENAME' }, { text: '🏠 Accueil', cb: 'HOME' }],
  ];
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: rows };
}

// ── ACCUEIL — 4 entrées E104. RÉCENTS = vue filtrée (E121), pas une entité. ──
function home() {
  return {
    media: null, raw: true,
    caption: '<b>Production</b> — choisis une entrée :',
    rows: [
      [{ text: '📸 PHOTO', go: 'photo' }, { text: '🎬 VIDÉO', go: 'video' }],
      [{ text: '🏛 STUDIO', go: 'studio' }, { text: '🕘 RÉCENTS', go: 'recents' }],
    ],
  };
}

// ── SOURCE ── (PHOTO porte E35 1/2/3 + E36 planche + sélection explicite ; VIDÉO = origine du média)
function viewSource(flow, m) {
  const nb = (m && m.parametres && m.parametres.nb_images) || 1;
  let rows, cap;
  if (flow === 'photo') {
    cap = hdr(m) + '\n<b>SOURCE</b> — d\'où vient l\'image ?';
    const nbRow = [1, 2, 3, 4, 6].map(n => ({ text: (n === nb ? '🔵' : '') + n, cb: 'NB_' + n })); // E35 (Lot3 : 1/2/3/4/6, images séparées)
    rows = [
      [{ text: '✨ Nouveau look', cb: 'SRC_NEW' }, { text: '🖼 Galerie', cb: 'SRC_GAL' }, { text: '📤 Upload', cb: 'SRC_UP' }],
      nbRow,
    ];
    if (nb > 1) rows.push([{ text: '▦ Planche contact', cb: 'PLANCHE' }]); // E36 (vue d'ensemble des N images)
    if (m && m.image_candidates && m.image_candidates.length) {
      // Écran candidat NON AMBIGU (critère 1) : 3 états visibles + 1 action principale + « Plus d'options ».
      const cands = m.image_candidates; const idx = Math.max(0, Math.min(m._candIdx || 0, cands.length - 1));
      const cur = cands[idx];
      const estActif = m.media_actif === cur;
      const estVariante = (m.variantes || []).indexOf(cur) >= 0;
      const estLivrable = (m.livrables && m.livrables.image) === cur;
      cap = hdr(m) + '\n<b>Image ' + (idx + 1) + '/' + cands.length + '</b> · '
        + (estActif ? '★ MÉDIA ACTIF' : (estLivrable ? '✅ LIVRABLE' : (estVariante ? '◫ variante' : '🆕 candidate')))
        + '\n<i>Candidate = générée, pas choisie · ★ Média actif = source des étapes · ✅ Livrable = part en Prêt-à-poster. Actions indépendantes.</i>';
      rows = [[{ text: '◀︎', cb: 'CAND_PREV' }, { text: (idx + 1) + '/' + cands.length, cb: 'NOOP' }, { text: '▶︎', cb: 'CAND_NEXT' }]];
      rows.push([{ text: (estActif ? '★ Média actif ✓' : '★ Définir comme média actif'), cb: 'CAND_KEEP' }]); // action principale
      rows.push([{ text: '⋯ Plus d\'options', cb: 'CAND_MORE' }]);
    }
  } else {
    cap = hdr(m) + '\n<b>SOURCE</b> — média de la vidéo ?';
    rows = [
      [{ text: '🖼 Image du projet', cb: 'VSRC_PROJ' }, { text: '🖼 Galerie', cb: 'VSRC_GAL' }],
      [{ text: '✨ Nouveau look', cb: 'VSRC_NEW' }, { text: '📤 Upload', cb: 'VSRC_UP' }],
    ];
  }
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: rows.concat(actionBar(flow, 'source', m)) };
}

// ── PARAMÈTRES ── LISTE de lignes : chaque ligne = état courant + ouvre un picker focalisé (1 décision/fois).
function viewParams(flow, m) {
  const p = (m && m.parametres) || {};
  let lignes, cap = hdr(m) + '\n<b>PARAMÈTRES</b>';
  if (flow === 'photo') {
    lignes = [
      [{ text: '🎯 Réf : ' + short((m && m.reference && m.reference.label) || '—', 16) + ' ▸', cb: 'P_REF' }],
      [{ text: '👗 Tenue : ' + short((m && m.look && m.look.tenue) || '—', 16) + ' ▸', cb: 'P_TENUE' }],
      [{ text: '🌆 Décor : ' + short((m && m.look && m.look.decor) || '—', 16) + ' ▸', cb: 'P_DECOR' }],
      [{ text: '✍️ Prompt : ' + short(((m && m.prompts && m.prompts[0] && m.prompts[0].name)) || 'défaut', 14) + ' ▸', cb: 'P_PROMPT' }],
      [{ text: '🔢 Images : ' + ((p.nb_images) || 1) + ' ▸', cb: 'P_NB' }],
    ];
  } else {
    const sc = (m && m.scripts && m.scripts[0]) || {};
    lignes = [
      [{ text: '✍️ Script : ' + short(sc.name || (sc.text ? 'texte' : '—'), 16) + ' ▸', cb: 'P_SCRIPT' }],
      [{ text: '⏱ Durée : ' + short(sc.duree || p.duree || '23s', 8) + ' ▸', cb: 'P_DUREE' }],
      [{ text: '💬 Sous-titres ▸', cb: 'P_SUBS' }, { text: '🎵 Musique ▸', cb: 'P_MUS' }],
    ];
  }
  // « 🎨 Ajuster » = sous-état inline (design C.9). + Versions (Q4) + Préréglages (Q5) accessibles.
  lignes.push([{ text: '🎨 Ajuster', cb: 'ADJUST' }, { text: '🕘 Versions', cb: 'VERSIONS' }, { text: '⭐ Préréglages', cb: 'PRESETS' }]);
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: lignes.concat(actionBar(flow, 'parametres', m)) };
}

// ── FINALISER ── récap + GATE QC (C4/E92) AVANT Final HD payant ; coût/crédits visibles (E11).
function viewFinaliser(flow, m) {
  const qc = m && m.qc;
  const cout = (m && m.couts) || {};
  let cap = hdr(m) + '\n<b>FINALISER</b>';
  cap += '\n💳 ' + (cout.credits || '?') + ' cr ≈ ' + (cout.eur_estime || '?') + ' €';
  const rows = [];
  // E123 — SÉLECTION DES LIVRABLES (Image/Vidéo cochés par défaut). Décocher Vidéo => image seule.
  const sel = (m && m.livrables_select) || { image: true, video: true };
  cap += '\n📦 Livrables : ' + (sel.image !== false ? '☑' : '☐') + ' Image · ' + (sel.video !== false ? '☑' : '☐') + ' Vidéo';
  rows.push([{ text: (sel.image !== false ? '☑' : '☐') + ' Image', cb: 'LIV_IMG' }, { text: (sel.video !== false ? '☑' : '☐') + ' Vidéo', cb: 'LIV_VID' }]);
  if (!FLOW.qcPasse(m)) {
    // GATE QC obligatoire avant paiement : checklist + 3 actions (C4/E92)
    cap += '\n\n🔍 <b>Contrôle qualité requis</b> (identité · cohérence · réf · look) avant Final HD.';
    rows.push([{ text: '🔍 Lancer le contrôle', cb: 'QC_RUN' }]);
    rows.push([{ text: '🔄 Régénérer', cb: 'QC_REGEN' }, { text: '🎨 Éditer', cb: 'QC_EDIT' }, { text: '✅ Valider malgré', cb: 'QC_FORCE' }]);
  } else {
    cap += '\n\n✅ QC ' + (qc.verdict === 'force' ? '(forcé)' : 'OK') + ' — prêt pour Final HD.';
  }
  // Lot 6 (A5) — quand le livrable est en Prêt-à-poster : bouton Publier (sort de la file, reste en Historique)
  if (m && m.statut_publication === 'pret_a_poster') { cap += '\n📤 Dans Prêt-à-poster.'; rows.push([{ text: '📣 Publier', cb: 'PUBLISH' }, { text: '📦 Livrables', cb: 'LIVRABLES' }]); }
  else if (m && (m.livrables_dossiers || []).length) { rows.push([{ text: '📦 Livrables', cb: 'LIVRABLES' }]); }
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: rows.concat(actionBar(flow, 'finaliser', m)) };
}

// Critères 5/6 — LIVRABLES : liste lisible (liv1/liv2/liv3) + versions (v1/v2/v3) ; ouverture = récupération instantanée.
function viewLivrables(m) {
  const ds = (m && m.livrables_dossiers) || []; const vs = (m && m.versions) || [];
  const rows = ds.map((d, i) => [{ text: '📦 ' + d.id + ' · ' + short((d.legende_courte || d.script || 'livrable'), 22), cb: 'LIVOPEN_' + i }]);
  if (!ds.length) rows.push([{ text: '(aucun livrable validé)', cb: 'NOOP' }]);
  rows.push([{ text: '◀ Retour', cb: 'BACK' }]);
  return { media: FLOW.previewMedia(m), raw: true, caption: hdr(m) + '\n📦 <b>Livrables</b> · ' + ds.length + ' · 🕘 versions : ' + vs.length + '\n<i>Chaque version validée = un dossier publiable.</i>', rows: rows };
}
// Ouverture d'un livrable : tout récupérable ; légendes/hashtags en blocs <code> (tap-pour-copier Telegram).
function viewLivrable(m, d) {
  d = d || {};
  let cap = '📦 <b>' + (d.id || 'Livrable') + '</b>\n';
  cap += '🎬 ' + (d.video ? '✓ vidéo' : '—') + ' · 🖼 ' + ((d.images && d.images.length) ? '✓ image' : '—') + '\n';
  cap += '\n📝 <b>Légende courte</b> :\n<code>' + escH(d.legende_courte || '—') + '</code>\n';
  cap += '\n📄 <b>Légende longue</b> :\n<code>' + escH(d.legende_longue || '—') + '</code>\n';
  cap += '\n#️⃣ <b>Hashtags</b> :\n<code>' + escH(d.hashtags || '—') + '</code>\n';
  cap += '\n<i>Touche un bloc pour le copier. Script/params/coûts/RAW dans le dossier.</i>';
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: [[{ text: '◀ Retour', cb: 'BACK' }]] };
}
function escH(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Critères 2/4 — PICKER DE ZONE (réf/look/décor/prompt) : valeur courante · verrou · CRUD · réutilisation · historique.
const ZONE_META = { reference: { emoji: '🎯', nom: 'Référence' }, look: { emoji: '👗', nom: 'Look' }, decor: { emoji: '🌆', nom: 'Décor' }, prompt: { emoji: '✍️', nom: 'Prompt' } };
function viewZonePicker(zoneKey, m, options) {
  const meta = ZONE_META[zoneKey] || { emoji: '•', nom: zoneKey };
  const z = (m && m.zones && m.zones[zoneKey]) || { value: null, locked: false, history: [] };
  options = options || [];
  const cap = hdr(m) + '\n' + meta.emoji + ' <b>' + meta.nom + '</b> : ' + short(z.label || z.value || '—', 24) + (z.locked ? ' 🔒' : '')
    + '\n<i>Choisis, crée, enregistre ou réutilise. Le verrou conserve cette zone quand tu régénères.</i>';
  const rows = [];
  rows.push([{ text: z.locked ? '🔓 Déverrouiller' : '🔒 Verrouiller', cb: 'ZLOCK_' + zoneKey }]);
  for (let i = 0; i < Math.min(6, options.length); i += 2) {
    rows.push(options.slice(i, i + 2).map((o, j) => ({ text: '↪ ' + short(o.label || o, 16), cb: 'ZPICK_' + zoneKey + '_' + (i + j) })));
  }
  rows.push([{ text: '➕ Créer', cb: 'ZCREATE_' + zoneKey }, { text: '💾 Enregistrer', cb: 'ZSAVE_' + zoneKey }]);
  if ((z.history || []).length) rows.push([{ text: '🕘 Historique (' + z.history.length + ')', cb: 'ZHIST_' + zoneKey }]);
  rows.push([{ text: '◀ Retour', cb: 'BACK' }]);
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: rows };
}
function viewZoneHistory(zoneKey, m) {
  const meta = ZONE_META[zoneKey] || { emoji: '•', nom: zoneKey };
  const z = (m && m.zones && m.zones[zoneKey]) || { history: [] };
  const rows = (z.history || []).slice(-6).map((h, i) => [{ text: '↩️ ' + short(h.label || h.value, 22), cb: 'ZREST_' + zoneKey + '_' + i }]);
  rows.push([{ text: '◀ Retour', cb: 'BACK' }]);
  return { media: FLOW.previewMedia(m), raw: true, caption: hdr(m) + '\n🕘 <b>Historique ' + meta.nom + '</b>\n<i>Restaurer une valeur précédente.</i>', rows: rows };
}

// Critère 1 — « Plus d'options » du candidat : actions secondaires DÉCOUPLÉES, avec impact explicite.
function viewCandMore(m) {
  return {
    media: FLOW.previewMedia(m), raw: true,
    caption: hdr(m) + '\n⋯ <b>Options de l\'image</b>\n<i>Chaque action est indépendante.</i>',
    rows: [
      [{ text: '◫ Conserver comme variante', cb: 'CAND_VAR' }],   // trace, PAS livrable
      [{ text: '✅ Valider comme livrable', cb: 'CAND_DELIVER' }], // → Prêt-à-poster
      [{ text: '🔁 Générer une variante', cb: 'CAND_VARY' }],      // img2img, source conservée
      [{ text: '🔄 Régénérer (remplace)', cb: 'CAND_REGEN' }, { text: '🎨 Éditer', cb: 'CAND_EDIT' }],
      [{ text: '🗑 Rejeter (hors livrables)', cb: 'CAND_REJECT' }],
      [{ text: '◀ Retour', cb: 'BACK' }],
    ],
  };
}

// Lot 3 — VUE PLANCHE-CONTACT (aperçu d'ensemble des N images séparées ; sélection explicite, A7).
// Le composite n'est qu'un APERÇU : chaque image reste un fichier séparé, sélectionnable/réutilisable.
function viewPlanche(m) {
  const cands = (m && m.image_candidates) || [];
  const rows = [];
  for (let i = 0; i < cands.length; i += 3) {
    rows.push(cands.slice(i, i + 3).map((c, j) => ({ text: '🖼 ' + (i + j + 1), cb: 'CAND_SEL_' + (i + j) })));
  }
  rows.push([{ text: '◀ Retour', cb: 'BACK' }]);
  return { media: FLOW.previewMedia(m), raw: true, caption: hdr(m) + '\n▦ <b>Planche contact</b> · ' + cands.length + ' images\n<i>Aperçu d\'ensemble — touche une image pour la traiter (séparée).</i>', rows: rows };
}

// Lot 4 — ÉDITION IMAGE (boîte à outils) PAR PROJET (E124 : écrit dans le manifest du projet, jamais global).
function viewImgEdit(m) {
  const fx = (m && m.parametres && m.parametres.image_fx) || {};
  const v = (k) => (fx[k] != null ? fx[k] : 0);
  const crop = (m && m.parametres && m.parametres.crop) ? '✂️ recadré' : '✂️ Recadrer';
  return {
    media: FLOW.previewMedia(m), raw: true,
    caption: hdr(m) + '\n🎨 <b>Édition image</b> <i>(ce projet uniquement)</i>',
    rows: [
      [{ text: '➖', cb: 'IMG_BR_DN' }, { text: '☀️ ' + v('brightness'), cb: 'NOOP' }, { text: '➕', cb: 'IMG_BR_UP' }],
      [{ text: '➖', cb: 'IMG_CT_DN' }, { text: '◐ ' + v('contrast'), cb: 'NOOP' }, { text: '➕', cb: 'IMG_CT_UP' }],
      [{ text: '➖', cb: 'IMG_SA_DN' }, { text: '🌈 ' + v('saturation'), cb: 'NOOP' }, { text: '➕', cb: 'IMG_SA_UP' }],
      [{ text: '➖', cb: 'IMG_TE_DN' }, { text: '🌡 ' + v('temperature'), cb: 'NOOP' }, { text: '➕', cb: 'IMG_TE_UP' }],
      [{ text: crop, cb: 'IMG_CROP' }, { text: '🔄 Réinit', cb: 'IMG_RESET' }],
      [{ text: '◀ Retour', cb: 'BACK' }],
    ],
  };
}

// Dispatcher d'étape.
function view(flow, step, m) {
  if (step === 'source') return viewSource(flow, m);
  if (step === 'parametres') return viewParams(flow, m);
  if (step === 'finaliser') return viewFinaliser(flow, m);
  return home();
}

module.exports = { home, view, viewSource, viewParams, viewFinaliser, viewPlanche, viewImgEdit, viewCandMore, viewZonePicker, viewZoneHistory, viewLivrables, viewLivrable, viewDashboard, projName, etatLabel, actionBar, hdr };

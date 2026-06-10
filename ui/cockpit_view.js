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

// En-tête 1 ligne (verrou 8) : projet · réf · look · média actif.
function hdr(m) {
  const bits = ['📁 ' + short((m && m.name) || 'Projet', 18)];
  if (m && m.reference && m.reference.label) bits.push('🎯 ' + short(m.reference.label, 14));
  if (m && m.look && m.look.tenue) bits.push('👗 ' + short(m.look.tenue, 14));
  bits.push('🖼 ' + (m && m.media_actif ? '✓' : '—'));
  return bits.join(' · ');
}

// Barre universelle (E108) : ⬅ Retour · ✅ Valider (gated) · 🏠 Accueil. Valider verrouillé -> cb dédié (toast).
function actionBar(flow, step, m) {
  const can = FLOW.canValidate(flow, step, m);
  const valider = FLOW.isLast(step)
    ? (can ? { text: '✅ Lancer Final HD', cb: 'V' } : { text: '🔒 Valider', cb: 'V_LOCK' })
    : (can ? { text: '✅ Valider', cb: 'V' } : { text: '🔒 Valider', cb: 'V_LOCK' });
  return [
    [{ text: '⬅ Retour', cb: 'BACK' }, valider, { text: '🏠 Accueil', cb: 'HOME' }],
    [{ text: '🛑 Stop', cb: 'STOP' }, { text: '🔄 Restart', cb: 'RESTART' }, { text: '❓ Aide', cb: 'HELP' }],
  ];
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
    const nbRow = [1, 2, 3].map(n => ({ text: (n === nb ? '🔵 ' : '') + n + (n > 1 ? ' imgs' : ' img'), cb: 'NB_' + n })); // E35
    rows = [
      [{ text: '✨ Nouveau look', cb: 'SRC_NEW' }, { text: '🖼 Galerie', cb: 'SRC_GAL' }, { text: '📤 Upload', cb: 'SRC_UP' }],
      nbRow,
    ];
    if (nb > 1) rows.push([{ text: '▦ Planche contact', cb: 'PLANCHE' }]); // E36 (vue d'ensemble des N images)
    if (m && m.image_candidates && m.image_candidates.length) {
      // E123 — VALIDATION D'IMAGE EXPLICITE : devenir de l'image courante (rien n'est livrable sans action explicite)
      rows.push([{ text: '◀︎', cb: 'CAND_PREV' }, { text: '🎬 Aperçu candidat', cb: 'NOOP' }, { text: '▶︎', cb: 'CAND_NEXT' }]);
      rows.push([{ text: '✅ Garder', cb: 'CAND_KEEP' }, { text: '⭐ Livrable', cb: 'CAND_DELIVER' }, { text: '◫ Variante', cb: 'CAND_VAR' }]);
      rows.push([{ text: '🔄 Régénérer', cb: 'CAND_REGEN' }, { text: '🎨 Éditer', cb: 'CAND_EDIT' }, { text: '🗑 Rejeter', cb: 'CAND_REJECT' }]);
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
  // « 🎨 Ajuster » = sous-état inline (design C.9), pas un écran. + barre (Valider gated).
  lignes.push([{ text: '🎨 Ajuster', cb: 'ADJUST' }]);
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
  return { media: FLOW.previewMedia(m), raw: true, caption: cap, rows: rows.concat(actionBar(flow, 'finaliser', m)) };
}

// Dispatcher d'étape.
function view(flow, step, m) {
  if (step === 'source') return viewSource(flow, m);
  if (step === 'parametres') return viewParams(flow, m);
  if (step === 'finaliser') return viewFinaliser(flow, m);
  return home();
}

module.exports = { home, view, viewSource, viewParams, viewFinaliser, actionBar, hdr };

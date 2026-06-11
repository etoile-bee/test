// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — colonne vertébrale] VUES PURES de /v4r.  { caption, rows } depuis les FAITS.
//   Arborescence EFFONDRÉE : le Cap s'édite EN LIGNE (puces émotion/objectif dans la vue cap, pas de sous-vue).
//   Projet VIVANT : dès que le message existe, il devient le TITRE ; vide = sobre mais cadré (« à définir »).
//   Mémoire = LECTURE en langage projet, MAPPÉE sur des champs EXISTANTS (cap/émotion/objectif/images/décisions).
//   Le KIND (texte vs photo) est décidé par le câble selon « une image existe-t-elle ? » — pas ici (jamais de placeholder).
//   rows = [[{text, cb}]] ; le câble mappe cb -> callback_data.
// ─────────────────────────────────────────────────────────────────────────────
const C = require('./conscience');

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// REPOS : MENÉ PAR LA CRÉATION (Option A). Tant qu'aucun média n'existe -> geste primaire = ✨ Créer,
//   le cap reste un ancrage LÉGER et optionnel (jamais un passage obligé). Dès qu'un média existe ->
//   carte média (le câble met l'image/vidéo en GRAND), identité/cap COMPACTS en légende, actions dessous.
function reposView(facts) {
  const i = (facts && facts.intention) || {};
  const s = C.situation(facts);
  const hasImg = C.hasImage(facts), hasVid = C.hasVideo(facts);
  const nimg = C.medias(facts).filter(function (m) { return !m || m.type !== 'video'; }).length;
  let cap, rows;
  if (!hasImg && !hasVid) {
    // VIDE : on mène par « Créer ». Le cap, s'il est posé, s'affiche en léger ; sinon invite à créer.
    if (i.message) {
      cap = '🎯 <b>' + esc(short(i.message, 70)) + '</b>\n' + s.etat
        + '\n<i>✨ Un tap : ton image apparaît.</i>';
    } else {
      cap = '✨ <b>Créer</b>\n<i>Un tap et ton image apparaît. Le cap (optionnel) viendra ancrer le sens.</i>';
    }
    rows = [
      [{ text: '✨ Créer une image', cb: 'R0_IMG' }],                 // geste PRIMAIRE, immédiat
      [{ text: '✍️ Cap', cb: 'R0_CAP' }, { text: '🗂 Mémoire', cb: 'R0_MEM' }], // ancrage léger
      [{ text: '🆕 Nouveau', cb: 'R0_NEW' }],
    ];
  } else {
    // MÉDIA EXISTE : le contenu domine (image/vidéo en grand via le câble) ; cap = légende compacte.
    const titre = i.message ? ('🎯 <b>' + esc(short(i.message, 70)) + '</b>') : ('<b>' + (hasVid ? 'Vidéo créée' : 'Image créée') + '</b>');
    cap = titre + '\n' + s.etat
      + ((i.emotion || i.objectif) ? ('\n😊 ' + (i.emotion || '—') + '   📍 ' + (i.objectif || '—')) : '')
      + '\n🖼 ' + nimg + (hasVid ? '   🎬 vidéo' : '');
    const actions = [{ text: '🔁 Regénérer', cb: 'R0_REGEN' },
                     { text: hasVid ? '🎬 Refaire la vidéo' : '🎬 Faire une vidéo', cb: 'R0_VID' }];
    rows = [
      actions,                                                        // 🔁 Regénérer · 🎬 vidéo (création visible)
      [{ text: '✍️ Cap', cb: 'R0_CAP' }, { text: '🗂 Mémoire', cb: 'R0_MEM' }],
      [{ text: '🆕 Nouveau', cb: 'R0_NEW' }],
    ];
  }
  return { caption: cap, rows: rows };
}

// CAP : UNE seule surface éditable en ligne. Message (saisie courte) + PUCES émotion/objectif (tap = sélection en place).
//   Un seul retour : ⬅ Repos. Pas de sous-vue, pas de [⬅ Cap].
function capView(facts) {
  const i = (facts && facts.intention) || {};
  let cap = '✍️ <b>Cap du projet</b>\n🎯 ' + (i.message ? esc(i.message) : '<i>message à définir</i>')
    + '\n\n<i>Touche une puce pour choisir (mise à jour ici même) :</i>';
  const emo = ['douceur', 'punch', 'luxe', 'fun'].map(v => ({ text: (i.emotion === v ? '🔵 ' : '') + v, cb: 'R0_EMO_' + v }));
  const obj = ['court', 'story', 'long'].map(v => ({ text: (i.objectif === v ? '🔵 ' : '') + v, cb: 'R0_OBJ_' + v }));
  const rows = [
    [{ text: (i.message ? '✍️ Modifier le message' : '✍️ Écrire le message'), cb: 'R0_MSG' }],
    emo,
    obj,
    [{ text: '⬅ Repos', cb: 'R0_REPOS' }],
  ];
  return { caption: cap, rows: rows };
}

// MÉMOIRE : lecture en langage projet, MAPPÉE sur l'existant (cap/émotion/objectif/images/décisions). Aucun champ inventé.
function memView(facts) {
  const i = (facts && facts.intention) || {};
  const ds = (facts && facts.decisions) || [];
  const ms = (facts && facts.medias) || [];
  const nimg = ms.filter(function (m) { return !m || m.type !== 'video'; }).length;
  const nvid = ms.filter(function (m) { return m && m.type === 'video'; }).length;
  let cap = '<b>Mémoire du projet</b>'
    + '\n🎯 Cap : ' + (i.message ? 'défini' : 'à définir')
    + '\n😊 Émotion : ' + (i.emotion || 'à définir') + '   📍 Objectif : ' + (i.objectif || 'à définir')
    + '\n🖼 Images : ' + (nimg ? (nimg + ' (simulées)') : 'aucune')
    + '\n🎬 Vidéos : ' + (nvid ? (nvid + ' (simulées)') : 'aucune')
    + '\n🗂 Décisions : ' + (ds.length ? ds.length : 'aucune');
  if (ds.length) cap += '\n' + ds.slice(-4).map(d => '• ' + esc(d.action) + (d.raison ? (' — ' + esc(d.raison)) : '')).join('\n');
  return { caption: cap, rows: [[{ text: '⬅ Repos', cb: 'R0_REPOS' }]] };
}

// Invite de saisie courte (message/public).
function askView(mode) {
  const cap = (mode === 'public')
    ? '👥 <b>Ton public ?</b>\nÀ qui t\'adresses-tu ? (réponse courte)'
    : '🎯 <b>Ton message ?</b>\nDis ton intention en une phrase. (réponse courte)';
  return { caption: cap, rows: [[{ text: '⬅ Repos', cb: 'R0_REPOS' }]] };
}

module.exports = { reposView, capView, memView, askView, esc };

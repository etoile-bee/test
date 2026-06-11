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

// REPOS : le projet VIVANT — titre = message (identité) ; sous-ligne émotion/objectif ; images si présentes.
function reposView(facts) {
  const i = (facts && facts.intention) || {};
  const s = C.situation(facts);
  const g = C.prochainGeste(facts);
  const nimg = ((facts && facts.medias) || []).length;
  let cap;
  if (i.message) {
    cap = '🎯 <b>' + esc(short(i.message, 70)) + '</b>\n' + s.etat
      + '\n😊 ' + (i.emotion || 'à définir') + '   📍 ' + (i.objectif || 'à définir')
      + (nimg ? ('\n🖼 ' + nimg + ' image(s)') : '');
  } else {
    cap = '<b>Nouveau projet</b>\n🕐 <i>cap à définir — commence par dire ton intention</i>';
  }
  const rows = [
    [{ text: g.label, cb: g.cb }],                                   // LE prochain geste (unique, proposition)
    [{ text: '✍️ Cap', cb: 'R0_CAP' }, { text: '🗂 Mémoire', cb: 'R0_MEM' }],
    [{ text: '🆕 Nouveau', cb: 'R0_NEW' }],
  ];
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
  let cap = '<b>Mémoire du projet</b>'
    + '\n🎯 Cap : ' + (i.message ? 'défini' : 'à définir')
    + '\n😊 Émotion : ' + (i.emotion || 'à définir') + '   📍 Objectif : ' + (i.objectif || 'à définir')
    + '\n🖼 Images : ' + (ms.length ? (ms.length + ' (simulées)') : 'aucune')
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

// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — colonne vertébrale] VUES PURES de /v4r.
//   Renvoie { kind:'text'|'photo', caption, rows } depuis les FAITS + (image affichable ?).
//   PUR (aucune I/O) -> testable hors Telegram (je ne vois pas le rendu : je teste la sortie exacte).
//   Principes : UN prochain geste (bouton unique, pas de doublon texte) · boutons RÉDUITS (≤ ~5/vue) ·
//   texte SOBRE et hiérarchisé · le média n'apparaît QUE s'il existe (jamais de placeholder).
//   rows = [[{text, cb}]] ; le câble Telegram mappe cb -> callback_data.
// ─────────────────────────────────────────────────────────────────────────────
const C = require('./conscience');

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// REPOS : où j'en suis (titre projet + état + cap) + UN prochain geste (proposition) + nav libre.
//   kind = 'photo' si une image est affichable (le projet s'ouvre dessus), sinon 'text' (sobre, sans placeholder).
function reposView(facts, hasPhoto) {
  const s = C.situation(facts);
  const g = C.prochainGeste(facts);
  let cap = '<b>' + esc(s.nom) + '</b>\n' + s.etat + (s.medias ? (' · 🖼 ' + s.medias) : '') + '\n🧭 ' + esc(short(s.cap, 80));
  const rows = [
    [{ text: g.label, cb: g.cb }],                                   // LE prochain geste (unique, pas de ligne texte en double)
    [{ text: '✍️ Cap', cb: 'R0_CAP' }, { text: '🗂 Mémoire', cb: 'R0_MEM' }],
    [{ text: '🆕 Nouveau projet', cb: 'R0_NEW' }],
  ];
  return { kind: hasPhoto ? 'photo' : 'text', caption: cap, rows: rows };
}

// CAP : vue compacte (message via saisie · émotion/objectif ouvrent un choix au tap) — peu de boutons.
function capView(facts) {
  const i = (facts && facts.intention) || {};
  const cap = '<b>Ton cap</b>\n🎯 ' + (i.message ? esc(i.message) : '<i>(message à poser)</i>')
    + '\n😊 ' + (i.emotion || '—') + '   📍 ' + (i.objectif || '—')
    + (i.public ? ('\n👥 ' + esc(i.public)) : '');
  const rows = [
    [{ text: '✍️ Message', cb: 'R0_MSG' }],
    [{ text: '😊 Émotion', cb: 'R0_CAPE' }, { text: '📍 Objectif', cb: 'R0_CAPO' }],
    [{ text: '⬅ Repos', cb: 'R0_REPOS' }],
  ];
  return { kind: 'text', caption: cap, rows: rows };
}

// Choix d'émotion (sous-vue, présélections au tap) — un seul niveau de détail à la fois.
function emoView(facts) {
  const i = (facts && facts.intention) || {};
  const opts = ['douceur', 'punch', 'luxe', 'fun'];
  const cap = '😊 <b>Émotion visée ?</b>';
  const rows = [opts.map(v => ({ text: (i.emotion === v ? '🔵 ' : '') + v, cb: 'R0_EMO_' + v })), [{ text: '⬅ Cap', cb: 'R0_CAP' }]];
  return { kind: 'text', caption: cap, rows: rows };
}

// Choix d'objectif (sous-vue, présélections au tap).
function objView(facts) {
  const i = (facts && facts.intention) || {};
  const opts = ['court', 'story', 'long'];
  const cap = '📍 <b>Objectif ?</b>';
  const rows = [opts.map(v => ({ text: (i.objectif === v ? '🔵 ' : '') + v, cb: 'R0_OBJ_' + v })), [{ text: '⬅ Cap', cb: 'R0_CAP' }]];
  return { kind: 'text', caption: cap, rows: rows };
}

// MÉMOIRE : décisions (action + raison) + images (faits) ; relisible, rien d'effacé.
function memView(facts) {
  const ds = (facts && facts.decisions) || [];
  const ms = (facts && facts.medias) || [];
  let cap = '<b>Mémoire</b> · ' + ds.length + ' décision(s)' + (ms.length ? (' · 🖼 ' + ms.length) : '');
  cap += ds.length ? ('\n' + ds.slice(-5).map(d => '• ' + esc(d.action) + (d.raison ? (' — ' + esc(d.raison)) : '')).join('\n')) : '\n<i>Aucune décision encore.</i>';
  return { kind: 'text', caption: cap, rows: [[{ text: '⬅ Repos', cb: 'R0_REPOS' }]] };
}

// Invite de saisie courte (message/public) — un seul retour.
function askView(mode) {
  const cap = (mode === 'public')
    ? '👥 <b>Ton public ?</b>\nÀ qui t\'adresses-tu ? (réponse courte)'
    : '🎯 <b>Ton message ?</b>\nDis-le en une phrase. (réponse courte)';
  return { kind: 'text', caption: cap, rows: [[{ text: '⬅ Repos', cb: 'R0_REPOS' }]] };
}

module.exports = { reposView, capView, emoView, objView, memView, askView, esc };

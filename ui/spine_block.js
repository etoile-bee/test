// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — colonne vertébrale] DÉCISION DE TRANSPORT du bloc UNIQUE (pur, testable).
//   Règle : tant que le KIND ne change pas (texte↔texte ou photo↔photo) -> ÉDITION en place (même message_id).
//           bascule TEXTE↔PHOTO -> RECREATE (supprimer l'ancien + poster un neuf) — UN seul bloc à l'écran.
//   Conséquence (assumée, contrainte Telegram) : on ne peut pas convertir un message texte en message photo ;
//   garder un unique message_id « tout du long » imposerait un bloc photo permanent = PLACEHOLDER -> INTERDIT (verrou).
//   Donc : message_id réutilisé DANS une phase (avant image = texte ; après image = photo) ; une seule bascule au 1er média.
// ─────────────────────────────────────────────────────────────────────────────
function plan(curType, curMid, targetKind) {
  if (curMid && curType === targetKind) return { action: 'edit', mid: curMid, del: null };
  return { action: 'recreate', mid: null, del: curMid || null };
}
module.exports = { plan };

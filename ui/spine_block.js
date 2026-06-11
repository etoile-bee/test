// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — colonne vertébrale] DÉCISION DE TRANSPORT du bloc UNIQUE (pur, testable).
//   3 natures de bloc : 'text' · 'photo' · 'video'.
//   Règle :
//     • pas de bloc courant            -> RECREATE (1ère pose).
//     • même nature exacte             -> EDIT en place (texte: editText ; média: editCaption). Même message_id.
//     • photo↔vidéo (média↔média)      -> EDIT_MEDIA en place (editMessageMedia). MÊME message_id : l'image
//                                          DEVIENT la vidéo dans le même bloc — pas de nouvelle carte.
//     • franchir la frontière texte↔média -> RECREATE (contrainte Telegram : on ne convertit pas un
//                                          message texte en message média). UNE seule bascule, au 1er média.
//   Conséquence : un SEUL bloc visible à tout instant ; un SEUL recreate sur toute la vie du projet
//   (1ère pose en texte -> 1er média). Ensuite image→vidéo→image se font en place.
//   Jamais de placeholder : tant qu'aucun média n'existe, le bloc reste texte (repos sobre mené par « Créer »).
// ─────────────────────────────────────────────────────────────────────────────
function isMedia(kind) { return kind === 'photo' || kind === 'video'; }

function plan(curType, curMid, targetKind) {
  if (!curMid) return { action: 'recreate', mid: null, del: null };
  const now = isMedia(curType), next = isMedia(targetKind);
  if (now === next) {
    if (curType === targetKind) return { action: 'edit', mid: curMid, del: null };      // texte→texte ou même média : édition légende/texte
    return { action: 'editMedia', mid: curMid, del: null };                              // photo↔vidéo : swap média EN PLACE
  }
  return { action: 'recreate', mid: null, del: curMid };                                 // texte↔média : la seule recreate
}
module.exports = { plan, isMedia };

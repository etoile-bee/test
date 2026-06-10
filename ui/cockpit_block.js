// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] IDENTITÉ DE BLOC UNIQUE (fin de F1) — garantie technique E.1/E.3 du design.
//   UN SEUL identifiant de message (`mid`) pour le cockpit. TOUTE action (navigation, édition image,
//   sous-titres, montage, script, légende, réf, prompt) passe par ce module et ÉDITE le MÊME message.
//   → jamais de second bloc, jamais de delete+resend (cause de F1 : 2 identités newlook.mediaId / cockpit.mid).
//   Transport injecté (tg) → module testable hors Telegram.
//
//   Frontière E109↔E111 :
//     - show(content)                → ÉDITE EN PLACE le bloc courant (intra-tâche, édition, navigation)
//     - show(content,{navigate:true})→ NOUVEAU bloc persistant (uniquement /menu + résultat validé/livré)
//       l'ancien message reste en place dans le chat (historique E111), on adopte le nouveau mid.
// ─────────────────────────────────────────────────────────────────────────────

function createCockpitBlock(tg) {
  // tg : { sendPhoto(media,cap,rows), editMedia(mid,media,cap,rows), editCaption(mid,cap,rows),
  //        sendVideo(media,cap,rows), editVideo(mid,media,cap,rows) }  — chacune async, rejette si échec.
  let mid = null;     // L'UNIQUE identité de bloc.
  let kind = null;    // 'photo' | 'video' (type du média courant dans le bloc)

  function id() { return mid; }
  function reset() { mid = null; kind = null; } // abandon explicite du bloc (rare)

  async function sendFresh(content) {
    let r;
    if (content.video) { r = await tg.sendVideo(content.video, content.caption, content.rows); kind = 'video'; }
    else { r = await tg.sendPhoto(content.media, content.caption, content.rows); kind = 'photo'; }
    mid = (r && (r.message_id != null ? r.message_id : (r.result && r.result.message_id))) || null;
    return mid;
  }

  // Rendu du cockpit. Par défaut : ÉDITION EN PLACE (même mid). navigate:true => nouveau bloc persistant.
  async function show(content, opts) {
    const navigate = !!(opts && opts.navigate);
    if (navigate || mid == null) { return await sendFresh(content); }

    // ── ÉDITION EN PLACE sur l'UNIQUE mid ──
    try {
      if (content.video) { await tg.editVideo(mid, content.video, content.caption, content.rows); kind = 'video'; return mid; }
      if (content.media) { await tg.editMedia(mid, content.media, content.caption, content.rows); kind = 'photo'; return mid; }
      // caption seule (réglages/boutons sans changer l'image)
      await tg.editCaption(mid, content.caption, content.rows); return mid;
    } catch (e) {
      // Stale-fix : le message a disparu / non éditable → on renvoie un bloc frais et on ADOPTE le nouveau mid
      // (toujours une seule identité ; pas d'empilement de blocs résiduels).
      return await sendFresh(content);
    }
  }

  // Toute édition avancée (image/sous-titres/montage/script/légende/réf/prompt) utilise CE point d'entrée
  // → garantit le rendu dans le bloc unique (jamais un nouvel écran). Alias sémantique de show() en place.
  async function edit(content) { return await show(content, { navigate: false }); }

  return { id, reset, show, edit, get kind() { return kind; } };
}

module.exports = { createCockpitBlock };

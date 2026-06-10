// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] ADAPTATEUR TRANSPORT — mappe l'interface de cockpit_block vers Telegram.
//   Fournit { sendPhoto, editMedia, editCaption, sendVideo, editVideo } (= contrat tg de cockpit_block),
//   construits AU-DESSUS de primitives bas-niveau INJECTÉES (les fonctions d'envoi réelles de telegram_bot.js).
//   Rôles :
//     - convertit les rows {text, cb|go} -> inline_keyboard {text, callback_data}  (go:'x' -> 'go:x')
//     - extrait le message_id de la réponse Telegram
//     - porte le flag IMAGE BRUTE (verrou 9 / E39) : envoi du fichier tel quel, AUCUN letterbox/cover/crop
//     - editMedia/editCaption/editVideo LÈVENT sur échec -> déclenche le stale-fix de cockpit_block
//   PUR vis-à-vis du réseau : primitives injectées -> testable sans Telegram. Aucune dépendance à go:photo/go:video.
// ─────────────────────────────────────────────────────────────────────────────

// rows : [[{text, cb}|{text, go}]]  ->  reply_markup Telegram. Convention : go:'x' => callback_data 'go:x'.
function toInlineKeyboard(rows) {
  if (!rows || !rows.length) return undefined;
  return {
    inline_keyboard: rows.map(row => row.map(btn => {
      const o = { text: btn.text };
      if (btn.cb != null) o.callback_data = String(btn.cb);
      else if (btn.go != null) o.callback_data = 'go:' + btn.go;
      else o.callback_data = 'NOOP';
      return o;
    })),
  };
}

function midOf(resp) {
  if (!resp) return null;
  if (resp.message_id != null) return resp.message_id;
  if (resp.result && resp.result.message_id != null) return resp.result.message_id;
  return null;
}
function okOf(resp) { return !!(resp && (resp.ok === true || resp.message_id != null || (resp.result && resp.result.message_id != null))); }

// p : primitives bas-niveau injectées (chacune async, renvoie la réponse Telegram brute) :
//   sendPhoto(media, caption, replyMarkup, raw)
//   editPhoto(mid, media, caption, replyMarkup, raw)
//   editCaption(mid, caption, replyMarkup)
//   sendVideo(media, caption, replyMarkup)
//   editVideo(mid, media, caption, replyMarkup)
function createTransport(p) {
  return {
    async sendPhoto(media, caption, rows) {
      return { message_id: midOf(await p.sendPhoto(media, caption, toInlineKeyboard(rows), /*raw*/ true)) };
    },
    async editMedia(mid, media, caption, rows) {
      const r = await p.editPhoto(mid, media, caption, toInlineKeyboard(rows), /*raw*/ true);
      if (!okOf(r)) throw new Error('editPhoto failed'); // -> stale-fix cockpit_block
      return r;
    },
    async editCaption(mid, caption, rows) {
      const r = await p.editCaption(mid, caption, toInlineKeyboard(rows));
      if (!okOf(r)) throw new Error('editCaption failed');
      return r;
    },
    async sendVideo(media, caption, rows) {
      return { message_id: midOf(await p.sendVideo(media, caption, toInlineKeyboard(rows))) };
    },
    async editVideo(mid, media, caption, rows) {
      const r = await p.editVideo(mid, media, caption, toInlineKeyboard(rows));
      if (!okOf(r)) throw new Error('editVideo failed');
      return r;
    },
  };
}

module.exports = { createTransport, toInlineKeyboard, midOf, okOf };

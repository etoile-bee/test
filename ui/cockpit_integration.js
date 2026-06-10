// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] INTÉGRATION (glue) — assemble transport + block + controller, prête à brancher dans telegram_bot.js.
//   STRANGLER-FIG (E107) : monté À CÔTÉ de l'ancien dispatch ; n'y touche pas. Activé derrière une commande/flag.
//   - resolveMedia : convertit le chemin RELATIF du manifest (media_actif) en chemin ABSOLU pour l'envoi.
//   - BLOC MÉDIA UNIQUE : si aucun média projet, on affiche un PLACEHOLDER (le bloc reste une photo -> editMessageMedia
//     fonctionne partout, identité de bloc unique préservée, jamais de bascule texte<->média = fin F1).
//   - /menu = navigate (nouveau bloc persistant E111) ; toute autre action = édition en place.
//   - notice = toast non-bloquant (answerCallbackQuery) — JAMAIS un nouveau message (zéro message technique).
//   PUR vis-à-vis du réseau : primitives injectées -> testable.
// ─────────────────────────────────────────────────────────────────────────────
const path = require('path');
const { createTransport } = require('./cockpit_transport');
const { createCockpitBlock } = require('./cockpit_block');
const { createController } = require('./cockpit_controller');
const PS = require('./project_store');

function createCockpitV4(opts) {
  // opts : { prims, base, persona, generate, libItems, placeholder, toast? }
  const base = opts.base, persona = opts.persona || 'default';
  const transport = createTransport(opts.prims);
  const block = createCockpitBlock(transport);
  const controller = createController({ base: base, persona: persona, store: PS, generate: opts.generate, generateVideo: opts.generateVideo, lookbook: opts.lookbook, libItems: opts.libItems, now: opts.now });
  const placeholder = opts.placeholder || null;

  function abs(rel) {
    const pid = controller.ui.projectId;
    if (!rel) return null;
    if (path.isAbsolute(rel)) return rel;
    return pid ? path.join(PS.projectDir(base, persona, pid), rel) : rel;
  }
  function resolveMedia(render) {
    if (render.video) return { video: abs(render.video) };
    if (render.media) return { media: abs(render.media) };
    return { media: placeholder }; // bloc média unique : placeholder si pas de média projet
  }
  async function paint(render, navigate) {
    const mv = resolveMedia(render);
    return block.show(Object.assign({ caption: render.caption, rows: render.rows }, mv), { navigate: !!navigate });
  }

  // /menu, /start, /v4 -> ACCUEIL en NOUVEAU bloc (E111 navigate).
  async function openHome() { const r = controller.dispatch('HOME'); return paint(r.render, true); }
  // Reprise (boot / après restart) -> rouvre le projet en cours s'il existe, sinon accueil. (C.1)
  async function resume() {
    const cur = PS.currentProject(base, persona);
    if (cur) { const r = controller.dispatch('OPEN_' + cur.projectId); return paint(r.render, true); }
    return openHome();
  }
  // Callback Telegram -> controller.dispatch -> rendu en place. Renvoie { notice } pour un toast éventuel.
  async function handle(data) {
    const r = controller.dispatch(data);
    await paint(r.render, false);
    if (r.notice && typeof opts.toast === 'function') { try { await opts.toast(r.notice); } catch (e) {} }
    return { notice: r.notice || null };
  }

  return { openHome, resume, handle, controller, block, _abs: abs };
}

module.exports = { createCockpitV4 };

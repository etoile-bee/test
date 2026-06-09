// [L0-1] ROUTEUR CENTRAL (E106/E107) — rend un bloc du registre, en place.
// route(id, ctx) : trouve le module, construit les boutons (go→navigation 'R_<id>',
// cb→callback existant), ajoute ◀️ Retour vers le parent, et délègue le rendu à ctx.show.
// ctx.show(caption, rows) = helper de rendu EN PLACE fourni par telegram_bot.js (cockpit).
// Cohabite avec l'ancien dispatch (strangler-fig) : ne touche que les blocs déclarés.

const { REGISTRY } = require('./registry');

function toButtons(rows) {
  return (rows || []).map(r => r.map(b =>
    b.go ? { text: b.text, callback_data: 'R_' + b.go }
         : { text: b.text, callback_data: b.cb }
  ));
}

// Vrai si l'id correspond à un bloc du registre (utilisé par telegram_bot pour router les 'R_*').
function has(id) { return !!REGISTRY[id]; }

async function route(id, ctx) {
  const mod = REGISTRY[id];
  if (!mod) return false;
  const out = mod.render(ctx) || {};
  const rows = toButtons(out.rows);
  if (mod.parent) rows.push([{ text: '◀️ Retour', callback_data: 'R_' + mod.parent }]);
  await ctx.show(out.caption || mod.title, rows);
  return true;
}

module.exports = { route, has, REGISTRY };

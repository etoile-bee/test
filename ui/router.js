// [L0-1c] ROUTEUR CENTRAL (E106/E107) + NAVIGATION UNIVERSELLE (E108) + EN PLACE (E109).
// route(id, ctx)     : rend le bloc EN PLACE (ctx.show), avec la barre de nav standard auto.
// routeHelp(id, ctx) : aide CONTEXTUELLE du bloc, affichée EN PLACE.
// Barre de nav standard (comportement identique partout) :
//   ⬅ Retour (si parent) · ➡ Suivant (si mod.next ET gate ok ; sinon grisé 🔒 ou absent)
//   🏠 Accueil (si pas la racine) · ❓ Aide · ⏹ Stop · 🔄 Restart
// Un module peut déclarer : next (id étape suivante) · requireChoice (bool) · gate(ctx)->bool · help (texte).
// Boutons de contenu : { text, go:'<id>' } (navigation registre) ou { text, cb:'<callback_existant>' } (ancien dispatch).

const { REGISTRY } = require('./registry');

function contentButtons(rows) {
  return (rows || []).map(r => r.map(b =>
    b.go ? { text: b.text, callback_data: 'R_' + b.go }
         : { text: b.text, callback_data: b.cb }
  ));
}

// E108 : barre de navigation universelle, identique sur tous les écrans.
function navRows(mod, ctx) {
  const rows = [];
  // Ligne navigation : ⬅ Retour · 🏠 Accueil · ➡ Suivant
  const nav = [];
  if (mod.parent) nav.push({ text: '⬅ Retour', callback_data: 'R_' + mod.parent });
  if (mod.parent) nav.push({ text: '🏠 Accueil', callback_data: 'R_home' });
  if (mod.next) {
    const active = mod.gate ? !!safe(mod.gate, ctx) : (mod.requireChoice ? false : true);
    if (active) nav.push({ text: '➡ Suivant', callback_data: 'R_' + mod.next });
    else nav.push({ text: '➡ Suivant 🔒', callback_data: 'RLOCK' }); // désactivé tant que le choix n'est pas fait
  }
  if (nav.length) rows.push(nav);
  // E112 : barre SYSTÈME figée — 🛑 Stop | 🔄 Restart | ❓ Aide (Aide TOUJOURS à droite)
  rows.push([
    { text: '🛑 Stop', callback_data: 'TECH_STOP' },
    { text: '🔄 Restart', callback_data: 'TECH_RESTART' },
    { text: '❓ Aide', callback_data: 'RH_' + mod.id },
  ]);
  return rows;
}

function safe(fn, ctx) { try { return fn(ctx); } catch (e) { return false; } }

function has(id) { return !!REGISTRY[id]; }

// mode : 'navigate' (nouveau bloc persistant — E111) | 'inplace' (édite le bloc courant — E109) | 'ephemeral'
async function route(id, ctx, mode) {
  const mod = REGISTRY[id];
  if (!mod) return false;
  const out = mod.render(ctx) || {};
  const rows = contentButtons(out.rows).concat(navRows(mod, ctx));
  await ctx.show(out.caption || mod.title, rows, mode || 'inplace'); // navigation intra-bloc = EN PLACE (E111 raffiné) ; /menu passe 'navigate'
  return true;
}

async function routeHelp(id, ctx, mode) {
  const mod = REGISTRY[id];
  if (!mod) return false;
  const help = mod.help || ('Écran « ' + (mod.title || id) + ' ». Utilise ⬅ Retour, 🏠 Accueil' + (mod.next ? ', ➡ Suivant' : '') + '.');
  await ctx.show('❓ <b>AIDE</b> · ' + (mod.title || id) + '\n\n' + help, [[{ text: '◀️ Retour', callback_data: 'R_' + id }]], mode || 'inplace'); // aide EN PLACE
  return true;
}

module.exports = { route, routeHelp, has, REGISTRY };

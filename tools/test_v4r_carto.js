// [CARTOGRAPHIE RUNTIME EXHAUSTIVE] écran × CHAQUE bouton — rejoue le VRAI chemin du bot (R0_DRYRUN), LIVE OFF, zéro dépense.
//   Pour CHAQUE écran atteignable, on tape CHAQUE bouton réellement rendu et on PROUVE :
//     (a) le tap RÉPOND (answerCallbackQuery) ,
//     (b) le COCKPIT reste exactement 1 bloc (jamais 0, jamais empilé) — les rendus persistants ne comptent pas,
//     (c) aucun tap MORT / aucune exception avalée (logs sans THROW),
//     (d) chaque écran hors Accueil possède une SORTIE qui change réellement d'écran (Retour/Accueil = anti-cul-de-sac).
//   Affiche un TABLEAU écran × résultat. La barre = ZÉRO KO. (Le freeze ffmpeg est éliminé : mosaïque en arrière-plan.)
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const bot = require('../telegram_bot.js');

let ok = 0, ko = 0; const rows = [];
function chk(l, c) { if (c) { ok++; } else { ko++; console.log('❌ ' + l); } return c; }

// Séquences pour ATTEINDRE chaque écran depuis une session neuve.
async function genPhoto() { await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }
const REACH = {
  home:           async () => {},
  photo:          async () => { await bot.tap('R0_PHOTO'); },
  photo_source:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_PH_OTHER'); },
  photo_prompt:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); },
  photo_result:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); },
  video:          async () => { await bot.typed('/v4r new'); await bot.tap('R0_VIDEO'); }, // projet VIDE -> écran Vidéo (sans source)
  video_params:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_VIDEO'); },
  video_result:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); },
  publication:    async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); await bot.tap('R0_PUB'); },
  studio:         async () => { await bot.tap('R0_STUDIO'); },
  studio_section: async () => { await bot.tap('R0_STUDIO'); await bot.tap('R0_ST_looks'); },
  recents:        async () => { await bot.tap('R0_RECENTS'); },
  gallery:        async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_PH_GAL'); },
  confirm:        async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); },
  confirm2:       async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); },
  video_edit:     async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VE'); },
  block:          async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_look'); },
  resources:      async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_RES'); },
  photo_montage:  async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_MONTAGE'); },
  video_source:   async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_PICK'); },
};
// [R3] « Retour partout » : un écran non-racine DOIT avoir un bouton Retour/Annuler (Accueil ≠ Retour pour Etoile).
function hasRetour(labels) { return labels.some(t => /◀|Retour|Annuler/.test(t)); }

async function reach(scr) { bot.reset(); await bot.open(); await REACH[scr](); }

async function main() {
  for (const scr of Object.keys(REACH)) {
    await reach(scr);
    const arrived = bot.state().screen;
    const reachedOK = chk('atteint ' + scr + ' (obtenu ' + arrived + ')', arrived === scr);
    const btns = bot.buttons();
    let answeredAll = true, cockpitAll = true, noThrow = true, hasExit = false;
    for (const b of btns) {
      await reach(scr);                       // ré-atteindre l'écran avant CHAQUE bouton
      const a0 = bot.state().answered; const before = bot.state().screen;
      await bot.tap(b);
      const s = bot.state();
      if (s.answered <= a0) answeredAll = false;          // (a) répond toujours
      if (s.cockpit !== 1) { cockpitAll = false; console.log('   ⚠ ' + scr + ' BTN ' + b + ' -> cockpit=' + s.cockpit + ' screen=' + s.screen + ' alive=' + s.alive + ' mid=' + s.mid); } // (b) 1 seul cockpit
      if (bot.logs().some(x => /^THROW/.test(x))) { noThrow = false; console.log('   ⚠ ' + scr + ' BTN ' + b + ' THROW ' + bot.logs().filter(x=>/THROW/.test(x))[0]); } // (c) aucune exception avalée
      if (s.screen !== before) hasExit = true;            // au moins un bouton change d'écran
    }
    // (d) anti-cul-de-sac : tout écran hors Accueil/résultats doit pouvoir CHANGER d'écran (Retour/Accueil/Suivant)
    const exitOK = scr === 'home' ? true : chk(scr + ' : possède une SORTIE (Retour/Accueil/Suivant) qui change d\'écran', hasExit);
    // (e) [R3] RETOUR EXPLICITE : tout écran non-racine doit avoir un bouton ◀ Retour / Annuler (Accueil ne suffit pas).
    await reach(scr); const retourOK = scr === 'home' ? true : chk(scr + ' : a un ◀ RETOUR/Annuler (≠ Accueil)', hasRetour(bot.labels()));
    chk(scr + ' : chaque bouton RÉPOND', answeredAll);
    chk(scr + ' : 1 seul COCKPIT après chaque bouton', cockpitAll);
    chk(scr + ' : aucun tap mort / exception', noThrow);
    rows.push({ scr, n: btns.length, reachedOK, answeredAll, cockpitAll, noThrow, exitOK, retourOK });
  }

  // ── TABLEAU écran × sortie ──
  console.log('\n┌─ CARTOGRAPHIE RUNTIME ' + '─'.repeat(40));
  console.log('│ écran           btns  atteint  répond  1-cockpit  no-throw  sortie  retour');
  for (const r of rows) {
    const m = b => b ? ' ✅ ' : ' ❌ ';
    console.log('│ ' + r.scr.padEnd(15) + ' ' + String(r.n).padStart(3) + '  ' + m(r.reachedOK) + '   ' + m(r.answeredAll) + '  ' + m(r.cockpitAll) + '   ' + m(r.noThrow) + '  ' + m(r.exitOK) + ' ' + m(r.retourOK));
  }
  console.log('└' + '─'.repeat(62));
  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e.message, e.stack); process.exit(1); });

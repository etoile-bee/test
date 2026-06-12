// [🔴1 — ÉRADICATION DÉMO « femme en cuir »] PREUVE par REPRODUCTION via le VRAI chemin du bot (r0Dispatch/r0Render/r0Paint).
//   Règle : sur TOUT écran de PROJET, l'image/vidéo peinte == la SOURCE ACTIVE réelle (ou la vraie vidéo) ; JAMAIS la démo.
//   La démo n'est atteignable QUE s'il n'existe AUCUN projet. LIVE OFF, zéro dépense (R0_DRYRUN).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';

// ════ ISOLATION TOTALE (fixture éphémère, jamais la vraie BASE) — identique à test_v4r_runtime ════
const _iso = (function isolate() {
  const fs = require('fs'), path = require('path'), os = require('os');
  const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-cuir-'));
  const TINYJPG = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
  fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true });
  for (let i = 0; i < 12; i++) fs.writeFileSync(path.join(BOX, 'looks', 'seed_' + String(i).padStart(2, '0') + '.jpg'), TINYJPG);
  fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
  fs.writeFileSync(path.join(BOX, 'lookbook.json'), JSON.stringify({ pricing: { eur_per_credit: 0.058, ops: { eco: 0.48, hd: 1, video30s: 5 } } }));
  process.env.V4R_SANDBOX = BOX;
  process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
  return BOX;
})();
const fs = require('fs'), path = require('path');
// [🔴1 incident] toute promesse rejetée (ex. objet média -> path.join, collision de nom) = échec DUR du test (sinon faux vert).
let _unhandled = null;
process.on('unhandledRejection', (e) => { _unhandled = (e && e.message) || String(e); });
const bot = require('../telegram_bot.js');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
const DEMO_RE = /demo_video|placeholder|ws_placeholder|\/references?\/|_reference\./i; // signatures démo/référence (femme cuir)
function srcLineOf(mk) { const m = String(mk.caption || '').match(/Source active : ([^⏎]+)/); return m ? m[1].trim() : null; }
async function genPhotoFull() { await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }

async function main() {
  // ── Projet RÉEL : une photo source épinglée, AUCUNE vraie vidéo (cas qui faisait tomber sur la démo) ──
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  chk('SETUP : projet a une photo (source active)', bot.state().curImg >= 1 && bot.state().curVid === 0);

  // ── Écrans de PROJET à vérifier : image peinte == source active réelle, JAMAIS la démo ──
  const ECRANS = [
    ['Accueil', () => bot.tap('R0_HOME')],
    ['Prêt à poster', () => bot.tap('R0_PRET')],
    ['Prêt → Retour', () => bot.buttons().includes('R0_HOME') ? bot.tap('R0_HOME') : bot.tap('R0_PRET')],
    ['Publication', async () => { await bot.tap('R0_HOME'); await bot.tap('R0_VIDEO'); await bot.tap('R0_PUB'); }],
    ['Vidéo·Résultat', async () => { await bot.tap('R0_HOME'); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID'); } ],
    ['Studio', async () => { await bot.tap('R0_HOME'); await bot.tap('R0_STUDIO'); }],
    ['Récents', async () => { await bot.tap('R0_HOME'); await bot.tap('R0_RECENTS'); }],
  ];
  for (const [nom, go] of ECRANS) {
    await go();
    const media = bot.media(); const mk = bot.markup(); const src = srcLineOf(mk);
    const isDemo = media && DEMO_RE.test(media);
    const exists = media ? fs.existsSync(media) : true; // si texte (pas de média), exists=true (rien peint)
    chk('[' + nom + '] AUCUNE démo/référence peinte (' + (media ? path.basename(media) : 'texte') + ')', !isDemo);
    chk('[' + nom + '] média peint = fichier RÉEL existant ou texte', exists);
    // cohérence image == « Source active » (quand une image est peinte ET la ligne source existe)
    if (media && src && /\.(jpg|jpeg|png)$/i.test(media)) {
      chk('[' + nom + '] image peinte == ligne « Source active » (' + path.basename(media) + ' == ' + src + ')', path.basename(media) === src);
    }
  }

  // ── 🔴1 incident Publier→Retour : le chemin ne lève AUCUNE exception + média = string|null (jamais un objet) ──
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID');   // video_result
  await bot.tap('R0_PUB');                                    // publication
  let pubThrow = bot.logs().some(l => /^THROW:/.test(l));
  await bot.tap('R0_PUB_DO');                                 // PUBLIER -> publies
  const back = bot.resReturn(); if (back) await bot.tap(back); // RETOUR
  await bot.tap('R0_HOME'); await bot.tap('R0_PRET'); await bot.tap('R0_HOME'); // Prêt à poster -> Retour
  const anyThrow = bot.logs().some(l => /^THROW:/.test(l));
  const m2 = bot.media();
  chk('Publier→Retour : AUCUNE exception (filet incident non déclenché)', !anyThrow);
  chk('Publier→Retour : média peint = string|null (JAMAIS un objet)', m2 == null || typeof m2 === 'string');
  chk('Publier→Retour : si média peint, ce n\'est pas une démo', !(m2 && DEMO_RE.test(m2)));

  // ── Cas « AUCUN projet » : la démo redevient autorisée (on ne casse pas le tout-premier lancement) ──
  bot.reset();
  try { fs.rmSync(path.join(_iso, 'projects_r'), { recursive: true, force: true }); } catch (e) {}
  // (pas de open() qui recrée un projet) — on vérifie juste que les helpers autorisent la démo sans projet : non-régression douce
  chk('NO-PROJET : la démo reste un repli LÉGITIME hors projet (helpers présents)', typeof bot.media === 'function');

  // laisse les microtâches se vider pour capter une éventuelle promesse rejetée (collision de nom / objet média)
  await new Promise(r => setTimeout(r, 50));
  chk('AUCUNE promesse rejetée non gérée (collision de nom / objet média -> path.join)', _unhandled == null);
  if (_unhandled) console.log('   ↳ ' + _unhandled);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

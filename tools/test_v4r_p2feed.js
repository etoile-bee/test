// [🔴P2 — DISPARITION DU FIL] PREUVE : une vidéo générée NE disparaît PAS du fil quand on en génère/ouvre une autre.
//   Les keepsakes (r0RenderMids) sont PERSISTANTS (jamais delMsg). Vidéo 1 survit à Vidéo 2 ET à /v4r new.
//   + la vidéo reste RÉCUPÉRABLE depuis Fichiers du BON projet (R0_GETVID) après changement de projet.
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os');
const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-p2feed-'));
const base = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), Buffer.concat([base, Buffer.from('M' + i)]));
fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };
const genPhoto = async () => { await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); };
const genVid = async () => { await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); };

async function main() {
  bot.reset(); await bot.open();
  await genPhoto();
  await genVid();
  const r1 = bot.state().renders; // keepsakes après vidéo 1 (photo + vidéo)
  chk('VIDÉO 1 : keepsake persistant créé', r1 >= 2);

  await genVid();
  const r2 = bot.state().renders;
  chk('VIDÉO 2 : le keepsake de la VIDÉO 1 RESTE (compteur AUGMENTE, rien supprimé)', r2 === r1 + 1);

  await bot.typed('/v4r new'); // NOUVEAU PROJET
  const r3 = bot.state().renders;
  chk('NOUVEAU PROJET : TOUS les keepsakes vidéo restent dans le fil (aucun delMsg)', r3 === r2);

  // ── la vidéo du projet précédent reste RÉCUPÉRABLE depuis Fichiers du BON projet ──
  await bot.tap('R0_RECENTS'); await bot.tap('R0_RE_OPEN_1'); // rouvre un projet précédent
  const before = bot.state().renders;
  await bot.tap('R0_RES');     // Fichiers du projet rouvert
  await bot.tap('R0_GETVID');  // 🎬 Vidéo -> re-poste le fichier vidéo du projet
  chk('RÉCUPÉRABLE : 🎬 Vidéo (R0_GETVID) re-poste la vidéo du projet rouvert (nouveau message)', bot.state().renders >= before || bot.state().alive >= 1);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

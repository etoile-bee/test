// [🔴P2] VERROU SOURCE ACTIVE + PERSISTANCE INTER-PROJETS (empreintes réelles, sandbox hermétique).
//   (a) photo choisie dans la galerie == source utilisée à la génération (page 1 ET page 2 — anti « mauvaise photo »).
//   (b) la vidéo d'un projet reste retrouvable dans le patrimoine GLOBAL après /v4r new (anti « vidéo disparue »).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-p2-'));
const base = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true });
for (let i = 0; i < 14; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + String(i).padStart(2, '0') + '.jpg'), Buffer.concat([base, Buffer.from('MARK_' + i)])); // 14 distinctes -> pagination
fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
const sha1 = p => { try { return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return null; } };
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };

async function main() {
  // ── (b1) PICK PAGE 1 : photo #3 choisie == source utilisée ──
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_PICK'); await bot.tap('R0_VI_GAL');
  const g1 = bot.galFiles();
  chk('galerie page 1 peuplée (fichiers réels)', g1.length >= 3 && g1.every(f => fs.existsSync(f)));
  await bot.tap('R0_GITEM_2');
  const s1 = bot.srcFile();
  chk('PAGE 1 : photo #3 choisie == source utilisée (chemin)', s1 === g1[2]);
  chk('PAGE 1 : empreinte sha1 photo choisie == sha1 source', sha1(g1[2]) && sha1(g1[2]) === sha1(s1));

  // ── (b2) PICK PAGE 2 : le reset de page ne fausse PAS l'index ──
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_PICK'); await bot.tap('R0_VI_GAL');
  await bot.tap('R0_GNEXT'); // page 2
  const g2 = bot.galFiles();
  chk('galerie page 2 peuplée', g2.length >= 1 && g2.every(f => fs.existsSync(f)));
  await bot.tap('R0_GITEM_0');
  const s2 = bot.srcFile();
  chk('PAGE 2 : photo choisie == source utilisée (index NON faussé par reset page)', s2 === g2[0] && sha1(s2) === sha1(g2[0]));

  // ── (a) PERSISTANCE : la vidéo d'un projet reste dans le patrimoine GLOBAL après /v4r new ──
  bot.reset(); await bot.open();
  const vdir = path.join(BOX, 'projects_r', 'imany', 'PROJ_A'); fs.mkdirSync(vdir, { recursive: true });
  fs.writeFileSync(path.join(vdir, 'A_FINAL.mp4'), Buffer.alloc(20000, 1)); // vidéo générée du projet A
  const before = bot.realVideos(99);
  chk('vidéo du projet A présente dans le patrimoine global', before.some(p => /A_FINAL\.mp4/.test(p)));
  await bot.typed('/v4r new'); // NOUVEAU PROJET
  const after = bot.realVideos(99);
  chk('PERSISTANCE : vidéo du projet A TOUJOURS retrouvable après /v4r new', after.some(p => /A_FINAL\.mp4/.test(p)));
  chk('PERSISTANCE : aucune vidéo perdue (compte stable)', after.length >= before.length);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

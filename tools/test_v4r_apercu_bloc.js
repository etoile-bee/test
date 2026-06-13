// [BUG APERÇU] PREUVE : l'aperçu sous-titres/clip reste DANS LE BLOC UNIQUE (aucun 2e bloc) ET incruste sur la SOURCE ACTIVE.
//   Scénario SANS génération (donc AUCUN keepsake) -> le cockpit est le SEUL bloc : R0DRY.alive.size doit rester == 1.
//   Source posée par sélection galerie (picksrc = données, aucun message Telegram). Couvre Montage→aperçu→Valider→retour + photo↔vidéo.
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os');
const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-apbloc-'));
const base = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), Buffer.concat([base, Buffer.from('M' + i)]));
fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };
const A = () => bot.state().alive;     // nb total de messages vivants (cockpit + éventuels rendus)
const C1 = () => bot.state().cockpit;  // bloc cockpit vivant == 1

async function main() {
  bot.reset(); await bot.open();
  chk('ouverture : exactement 1 bloc', A() === 1 && C1() === 1);

  // ── source posée SANS génération : sélection galerie (picksrc) -> aucun keepsake, toujours 1 bloc ──
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); // galerie sélection (global)
  await bot.tap('R0_GITEM_0');                            // pose la photo #1 comme source du projet
  const activeSrc = bot.realSrc();
  chk('source posée (galerie) : 1 bloc + source active réelle', A() === 1 && C1() === 1 && !!activeSrc && fs.existsSync(activeSrc));

  // ── Montage -> panneau Sous-titres : aperçu peint EN PLACE (aucun 2e bloc) ──
  await bot.tap('R0_VIDEO'); chk('Vidéo·Choisir : 1 bloc', A() === 1);
  await bot.tap('R0_VI_VALID'); chk('Vidéo·Préparer : 1 bloc', A() === 1);
  await bot.tap('R0_VE'); chk('Montage : 1 bloc', A() === 1);
  const before = A();
  await bot.tap('R0_VE_SUBS'); // panneau Sous-titres -> peint le clip d'aperçu
  chk('ENTRÉE aperçu sous-titres : AUCUN nouveau bloc (delta 0)', A() === before && C1() === 1);
  chk('aperçu sous-titres : source == SOURCE ACTIVE du projet', bot.realSrc() === activeSrc);

  // ── 👁 Aperçu (R0_STPREV) : plus de sendVideoKb séparé ──
  const b2 = A(); await bot.tap('R0_STPREV');
  chk('👁 Aperçu (R0_STPREV) : AUCUN nouveau bloc (delta 0)', A() === b2 && C1() === 1);

  // ── Valider sous-titres -> retour : 1 bloc ──
  await bot.tap('R0_BLOCK_OK');
  chk('Valider sous-titres -> retour : 1 bloc', A() === 1 && C1() === 1);

  // ── photo <-> vidéo : 1 bloc partout ──
  await bot.tap('R0_VI_BACK'); await bot.tap('R0_PHOTO'); chk('retour Photo : 1 bloc', A() === 1);
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID'); await bot.tap('R0_VI_PREVIEW'); // aperçu vidéo (confirm)
  chk('aperçu vidéo (confirm) : 1 bloc', A() === 1 && C1() === 1);
  chk('aperçu vidéo : source == source active', bot.realSrc() === activeSrc);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

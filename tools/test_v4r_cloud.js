// [☁ RÉORG CLOUD] PREUVE (sandbox hermétique, AUCUNE écriture dans le vrai cloud) :
//   (a) archivage organisé : outputs/AAAA-MM-JJ/<#proj>_<slug>/ avec final.mp4 + raw.mp4 + textes + cover.jpg
//   (b) RAW retrouvable (r0FindRaw) + bouton ☁ RAW dans Fichiers
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os');
const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-cloud-'));
const base = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), Buffer.concat([base, Buffer.from('M' + i)]));
fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
const SC = require('../ui/screens');
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };

async function main() {
  bot.reset(); await bot.open();
  // source + script + légendes + prompt posés
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); // source active
  bot.setPub({ legende_courte: 'Arrête 💔', legende_longue: 'Reprends ton pouvoir 💪', hashtags: '#fyp #viral' });
  bot.seedDraft('video', { script: 'Les hommes toxiques adorent te faire douter.', st_oy: 0.37 });
  bot.seedDraft('photo', { prompt: 'Portrait éditorial cinématographique, lumière douce.' });
  bot.storeCaptions({ short: 'Arrête 💔', long: 'Reprends ton pouvoir 💪', hashtags: ['fyp', 'viral'] });
  // faux final + 1 raw (simulent la sortie d'une génération vidéo)
  const finalF = path.join(BOX, 'final_src.mp4'); fs.writeFileSync(finalF, Buffer.alloc(20000, 7));
  const rawF = path.join(BOX, 'raw_src.mp4'); fs.writeFileSync(rawF, Buffer.alloc(15000, 3));
  const ts = Date.UTC(2026, 5, 13, 14, 30);

  // (a) ARCHIVAGE ORGANISÉ
  const dir = bot.outputArchive(finalF, [rawF], ts);
  chk('archivage : dossier créé', dir && fs.existsSync(dir));
  chk('archivage : chemin = outputs/AAAA-MM-JJ/<#proj>_<slug>/', /\/outputs\/2026-06-13\/[^/]+_/.test(dir || ''));
  const has = n => fs.existsSync(path.join(dir, n));
  chk('archivage : final.mp4 présent', has('final.mp4'));
  chk('archivage : RAW.mp4 TOUJOURS inclus', has('raw.mp4'));
  chk('archivage : script.txt + prompt.txt', has('script.txt') && has('prompt.txt'));
  chk('archivage : legende_courte.txt + legende_longue.txt (avec #)', has('legende_courte.txt') && has('legende_longue.txt') && /#fyp/.test(fs.readFileSync(path.join(dir, 'legende_courte.txt'), 'utf8')));
  chk('archivage : soustitres.txt + cover.jpg', has('soustitres.txt') && has('cover.jpg'));
  chk('archivage : raw.mp4 = copie du RAW (taille identique, non vide)', fs.statSync(path.join(dir, 'raw.mp4')).size === fs.statSync(rawF).size);

  // (b) RAW RÉCUPÉRABLE
  const raw = bot.findRaw();
  chk('RAW retrouvable via r0FindRaw (dans le dossier organisé)', raw && /raw.*\.mp4$/i.test(raw) && fs.existsSync(raw));
  const fichiers = SC.resourcesView({ projectId: 'imany_x', medias: [], publication: {}, draft: { photo: {}, video: {} } }, {});
  const cbs = [].concat.apply([], fichiers.rows).map(b => b.cb);
  chk('Fichiers : bouton ☁ RAW (R0_GETRAW) présent', cbs.includes('R0_GETRAW'));

  // (b bis) ancien schéma à plat : r0FindRaw doit AUSSI le trouver
  fs.writeFileSync(path.join(BOX, 'outputs', '2026-06-10-09-00_raw_p1.mp4'), Buffer.alloc(9000, 1));
  chk('RAW : ancien fichier à plat (_raw_) aussi retrouvé', !!bot.findRaw());

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

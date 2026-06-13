// [🔴P3 + P5] PREUVE : n° projet visible (Fichiers/Prêt/Publiés/Résultat) ; keepsake #11bis PROPRE (frais).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os');
const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-p3p5-'));
const base = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), Buffer.concat([base, Buffer.from('M' + i)]));
fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
const SC = require('../ui/screens');
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };

// ── P3 : n° projet visible sur les écrans patrimoine (vues pures) ──
const f = { projectId: 'imany_1781200000_ab12', intention: { message: 'Red flags' }, medias: [{ id: 'm1', type: 'image', etat: 'final', file: '/x.jpg' }], publication: {}, draft: { photo: {}, video: {} } };
chk('P3 : Fichiers affiche 📦 #id', /📦 #1781200000_ab12/.test(SC.resourcesView(f, {}).caption));
chk('P3 : Prêt à poster affiche 📦 #id', /📦 #1781200000_ab12/.test(SC.pretView(f, { pretFiles: [], pretTotal: 0 }).caption));
chk('P3 : Archives publiées affiche 📦 #id', /📦 #1781200000_ab12/.test(SC.publiesView(f, { publiesFiles: [], publiesTotal: 0 }).caption));
chk('P3 : Résultat vidéo affiche 📦 Projet #id', /📦 Projet #1781200000_ab12/.test(SC.videoResultView(f, {}).caption));

// ── P5 #11bis : keepsake FRAIS PROPRE (aucun « cap à poser / brouillon / décision(s) ») ──
async function main() {
  bot.reset(); await bot.open();
  const capV = bot.finalCap('video', false);
  const capP = bot.finalCap('photo', false);
  console.log('   keepsake vidéo:', capV.replace(/\n/g, ' ⏎ '));
  chk('P5 #11bis : keepsake vidéo SANS « cap à poser »', !/cap à poser/i.test(capV));
  chk('P5 #11bis : keepsake vidéo SANS « décision(s) »', !/décision/i.test(capV));
  chk('P5 #11bis : keepsake vidéo SANS « brouillon »', !/brouillon/i.test(capV));
  chk('P5 #11bis : keepsake = « Vidéo générée » + nom lisible', /Vidéo générée/.test(capV) && !/🧭|📊/.test(capV));
  chk('P5 #11bis : keepsake photo PROPRE aussi', !/cap à poser|décision|brouillon|🧭|📊/i.test(capP) && /Photo générée/.test(capP));

  // ── P1 : 2 BLOCS LÉGENDES COPIABLES PROPRES (UNIQUEMENT légende + hashtags, zéro texte système) ──
  bot.setPub({ legende_courte: 'Arrête de douter de toi 💔', legende_longue: 'Les hommes toxiques te font douter... reprends ton pouvoir 💪 abonne-toi', hashtags: '#fyp #viral #redflags' });
  const legc = bot.fullText('legc'), legl = bot.fullText('legl');
  console.log('   bloc 1 (courte):', JSON.stringify(legc));
  console.log('   bloc 2 (longue):', JSON.stringify(legl));
  chk('P1 : bloc 1 = légende courte + hashtags UNIQUEMENT', legc === 'Arrête de douter de toi 💔\n\n#fyp #viral #redflags');
  chk('P1 : bloc 2 = légende longue + hashtags UNIQUEMENT', legl === 'Les hommes toxiques te font douter... reprends ton pouvoir 💪 abonne-toi\n\n#fyp #viral #redflags');
  chk('P1 : ZÉRO texte système dans les blocs (pas de « cap/brouillon/décision/Légende »)', !/cap à poser|brouillon|décision|🧭|📊|Légende courte|Légende longue/i.test(legc + ' ' + legl));

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main();

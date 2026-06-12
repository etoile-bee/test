// [🔴2] PREUVE : APERÇU SOUS-TITRES == RENDU FINAL (vrai texte + même découpage + même position) + panneau ÉPURÉ.
//   - aperçu utilise le VRAI script découpé par render_local.buildChunks (le MÊME que le final) ; script vide -> EXEMPLE marqué.
//   - position cohérente : panneau (label) == r0SubOpts (oy) == final.
//   - panneau regroupé (Position en 1 ligne) -> moins de boutons.
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os');
const _iso = (function () {
  const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-subap-'));
  const T = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
  fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), T);
  fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
  fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
  process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
  return BOX;
})();
const RL = require('../render_local.js');
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };

const SCRIPT = 'Les hommes toxiques adorent te faire douter de toi sans cesse';

// 1) APERÇU == FINAL : même découpage (texte des chunks identique), MALGRÉ des timings différents (le final a des timings TTS réels).
const ap = bot.subChunks({ script: SCRIPT });
const words = SCRIPT.replace(/\s+/g, ' ').trim().split(' ').slice(0, 8);
const wtFinal = words.map((w, i) => ({ text: w, start: i * 0.37 + 0.13, end: i * 0.37 + 0.41 })); // timings IRRÉGULIERS ≠ aperçu
const finalChunks = RL.buildChunks(wtFinal);
chk('aperçu == final : MÊME découpage (textes des chunks identiques, timings différents)',
  JSON.stringify(ap.chunks.map(c => c.text)) === JSON.stringify(finalChunks.map(c => c.text)));

// 2) VRAI texte du script (plus de placeholder « SOUS-TITRES INCRUSTÉS ICI »)
const apTxt = ap.chunks.map(c => c.text).join(' ');
chk('aperçu : VRAI texte du script (contient « toxiques »)', !ap.exemple && /toxiques/i.test(apTxt));
chk('aperçu : AUCUN placeholder (« incrustés ici » / « aperçu de tes »)', !/incrust[eé]s ici|aper[cç]u de tes/i.test(apTxt));

// 3) Script VIDE -> EXEMPLE clairement marqué (jamais un faux texte présenté comme réel)
const apE = bot.subChunks({});
chk('aperçu : script vide -> EXEMPLE clairement marqué', apE.exemple === true && /EXEMPLE/i.test((apE.chunks[0] || {}).text || ''));

// 4) POSITION cohérente : défaut == « haut » côté r0SubOpts (== panneau == final)
const oyDef = bot.subOpts({}).oy, oyHaut = bot.subOpts({ st_pos: 'haut' }).oy, oyBas = bot.subOpts({ st_pos: 'bas' }).oy;
chk('position : défaut r0SubOpts == « haut » (panneau affiche haut -> cohérent)', oyDef === oyHaut && oyDef !== oyBas);

// 5) Cohérence panneau<->moteur : le label position par défaut du panneau == « haut »
const NAV = require('../ui/nav');
const spec = NAV.blockSpec({ screen: 'video', key: 'soustitres' }, { draft: { video: {} } }, { subStyle: { font: 'archivo', size: 'M', pos: 'haut', display: 'mot' } });
chk('panneau : « Actuel » par défaut montre la position « haut » (== r0SubOpts)', /\bhaut\b/.test(spec.current || ''));

// 6) ÉPURE : Position regroupée sur UNE seule ligne (4 crans) -> moins de lignes
const posRows = (spec.optionRows || []).filter(r => r.some(b => /stpos_/.test(b.cb || '')));
chk('panneau épuré : Position en 1 SEULE ligne (Validé/Bas/Milieu/Haut)', posRows.length === 1 && posRows[0].length === 4);
const totalOpt = (spec.optionRows || []).reduce((n, r) => n + r.length, 0);
chk('panneau épuré : boutons d\'option réduits (≤ 16)', totalOpt <= 16);

// 7) Dimensions conservées (Disposition/Police/Taille/Position/Couleur toutes présentes)
const allcb = (spec.optionRows || []).flat().map(b => b.cb).join(' ');
chk('panneau : 5 dimensions conservées (disp/font/size/pos/color)',
  /stdisp_/.test(allcb) && /stfont_/.test(allcb) && /stsize_/.test(allcb) && /stpos_/.test(allcb) && /stcolor_/.test(allcb));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

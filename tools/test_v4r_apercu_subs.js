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

// 4) [P4] POSITION = LEGACY : défaut oy == 0.370 (lu depuis subtitle_style.js), pas de preset
const oyDef = bot.subOpts({}).oy;
chk('position : défaut r0SubOpts == LEGACY 0.370 (== panneau == final)', Math.abs((oyDef || 0) - 0.370) < 0.001);
chk('position : Hauteur réglable (st_oy continu) — st_oy=0.50 -> 0.50', Math.abs((bot.subOpts({ st_oy: 0.50 }).oy || 0) - 0.50) < 0.001);

// 5) [P4bis] PANNEAU = 3 réglages EXACTS (Police · Taille · Hauteur), legacy 0.370 affiché
const NAV = require('../ui/nav');
const spec = NAV.blockSpec({ screen: 'video', key: 'soustitres' }, { draft: { video: {} } }, { subStyle: { font: 'archivo', size: 'M', oy: 0.370 } });
chk('panneau : « Actuel » affiche la hauteur legacy 0.37', /hauteur 0\.37/.test(spec.current || ''));
const allcb = (spec.optionRows || []).flat().map(b => b.cb).join(' ');
// [#5] le panneau garde EXACTEMENT 3 rangées de RÉGLAGES (Police/Taille/Hauteur) ; la rangée « 💾 Modèle par défaut » est une ACTION, pas un réglage.
const settingRows = (spec.optionRows || []).filter(r => r.some(b => /stfont_|stsize_|R0_STOY_/.test(b.cb)));
chk('panneau [P4bis] : EXACTEMENT 3 réglages (Police/Taille/Hauteur)', settingRows.length === 3 && /stfont_/.test(allcb) && /stsize_/.test(allcb) && /R0_STOY_/.test(allcb));
chk('panneau [#5] : bouton « Modèle par défaut » présent (action séparée)', /R0_DEFSAVE/.test(allcb));
chk('panneau [P4bis] : disposition/position-presets/couleur RETIRÉES', !/stdisp_|stpos_|stcolor_/.test(allcb));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

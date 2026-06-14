// [LOT 2 — PHOTO 2-ÉTAPES] PREUVE : flux Choisir→Valider(pin)→Préparer · Référence retirée · Influences 5 bascules ·
//   boîte à outils #7 couleur NON-DESTRUCTIVE · INVARIANT source active (sha1 stable gen→Valider→vidéo→/restart).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const _iso = (function () {
  const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-lot2-'));
  const T = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
  fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true }); for (let i = 0; i < 12; i++) fs.writeFileSync(path.join(BOX, 'looks', 's' + i + '.jpg'), T);
  fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });
  fs.writeFileSync(path.join(BOX, 'lookbook.json'), '{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
  process.env.V4R_SANDBOX = BOX; process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });
  return BOX;
})();
const NAV = require('../ui/nav');
const SC = require('../ui/screens');
const bot = require('../telegram_bot.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };
const cbs = v => [].concat.apply([], v.rows || []).map(b => b.cb);
const sha1 = p => { try { return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return null; } };

const fimg = { medias: [{ id: 'm1', etat: 'candidate', type: 'image', file: '/x.jpg' }] };

async function main() {
// ── ÉTAPE 1 (Choisir) : boutons exacts validés ──
const v1 = SC.photoView(fimg, { srcName: 'IMG.jpg' });
chk('Étape 1 : ✅ Valider la photo (R0_PH_VALID)', cbs(v1).includes('R0_PH_VALID'));
chk('Étape 1 : Garder/Changer/🛠 Modifier/Générer présents', ['R0_PH_KEEP', 'R0_PH_GAL', 'R0_PH_TOOLS', 'R0_PH_GEN'].every(c => cbs(v1).includes(c)));
chk('Étape 1 : « ✅ Utiliser » (ancien) RETIRÉ', !cbs(v1).includes('R0_PH_USE'));

// ── R0_PH_VALID = pin source + va en Préparer (Étape 2) ──
const rV = NAV.reduce('R0_PH_VALID', { screen: 'photo' }, fimg, { coverFile: '/x.jpg' });
chk('Valider la photo -> Étape 2 (photo_prompt)', rV.st.screen === 'photo_prompt');
chk('Valider la photo -> ÉPINGLE la source (op pinsource)', rV.op && rV.op.type === 'pinsource');

// ── ÉTAPE 2 (Préparer) : Référence retirée, pas de « Valider params ». [S] « Influences » SUPPRIMÉ. ──
const v2 = SC.photoPromptView(fimg, { srcName: 'IMG.jpg' });
chk('Étape 2 : Tenue/Décor/Prompt/Aperçu/Faire vidéo', ['R0_PHB_look', 'R0_PHB_decor', 'R0_PHB_prompt', 'R0_PH_PREVIEW', 'R0_PH_TOVIDEO'].every(c => cbs(v2).includes(c)));
chk('[S] Étape 2 : « 🎛 Influences » RETIRÉ', !cbs(v2).includes('R0_PHB_influences'));
chk('Étape 2 : RÉFÉRENCE retirée du parcours (R0_PHB_reference absent)', !cbs(v2).includes('R0_PHB_reference'));
chk('Étape 2 : PAS de « Valider les paramètres » séparé (flux D3 conservé)', !cbs(v2).includes('R0_PH_VALID'));

// ── [T] Tenue = picker + « 🚫 Aucune » + « 🔒 Conserver » (un seul réglage), plus de bascules « Utiliser » ──
const lk = NAV.blockSpec({ screen: 'photo', key: 'look' }, { draft: { photo: {} } }, {});
const lkcb = [].concat.apply([], lk.optionRows || []).map(b => b.cb);
chk('[T] Tenue : « 🔒 Conserver » présent', lkcb.includes('R0_INFL_lock_look'));
chk('[T] Tenue : « 🚫 Aucune » présent', lkcb.includes('R0_LAYER_NONE_look'));
chk('[T] Tenue : aucune bascule « Utiliser » (use_*)', !lkcb.includes('R0_INFL_use_look') && !lkcb.includes('R0_INFL_use_source'));

// ── BOÎTE À OUTILS #7 : steppers couleur, bornés, écran edition ──
const rTool = NAV.reduce('R0_PH_TOOLS', { screen: 'photo' }, fimg, {});
chk('🛠 Modifier -> écran edition', rTool.st.screen === 'edition');
const ed = SC.editionView({ draft: { photo: {} } }, { srcName: 'IMG.jpg' });
chk('edition : 4 réglages + Aperçu/Réinitialiser/Valider/Retour', ['R0_EDIT_bright_up', 'R0_EDIT_contrast_up', 'R0_EDIT_sat_up', 'R0_EDIT_sharp_up', 'R0_EDIT_PREVIEW', 'R0_EDIT_RESET', 'R0_EDIT_VALID'].every(c => cbs(ed).includes(c)));
const rUp = NAV.reduce('R0_EDIT_bright_up', { screen: 'edition' }, { draft: { photo: {} } }, {});
chk('edition : ➕ Luminosité -> patch eq_bright (draft)', rUp.op && rUp.op.type === 'draft' && rUp.op.patch.eq_bright === 0.1);
const rReset = NAV.reduce('R0_EDIT_RESET', { screen: 'edition' }, { draft: { photo: { eq_bright: 0.3 } } }, {});
chk('edition : ↺ Réinitialiser -> valeurs neutres', rReset.op.patch.eq_bright === 0 && rReset.op.patch.eq_contrast === 1 && rReset.op.patch.eq_sat === 1);
// borne basse luminosité (-0.3)
let st = { screen: 'edition' }, df = { draft: { photo: {} } };
for (let i = 0; i < 8; i++) { const r = NAV.reduce('R0_EDIT_bright_dn', st, df, {}); df.draft.photo.eq_bright = r.op.patch.eq_bright; }
chk('edition : borne basse respectée (eq_bright >= -0.3)', df.draft.photo.eq_bright === -0.3);

// ════ INVARIANT SOURCE ACTIVE — sha1 stable : gen -> Valider -> vidéo -> /restart -> reprise ════
bot.reset(); await bot.open();
await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); // génère (pin)
const h_gen = sha1(bot.srcFile());
await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_VALID'); // ✅ Valider la photo
const h_valid = sha1(bot.srcFile());
await bot.tap('R0_VIDEO'); // pont vidéo
const h_video = sha1(bot.srcFile());
await bot.restart(); // /restart
const h_restart = sha1(bot.srcFile());
chk('INVARIANT : source active présente (sha1 non nul)', !!h_gen);
chk('INVARIANT : MÊME source sha1 gen == Valider == vidéo == /restart', h_gen && h_gen === h_valid && h_valid === h_video && h_video === h_restart);

// ── TOOLBOX NON-DESTRUCTIVE : Valider une retouche AJOUTE une image, conserve l'originale ──
bot.reset(); await bot.open();
await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
const imgBefore = bot.state().curImg;
await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_TOOLS'); await bot.tap('R0_EDIT_bright_up'); await bot.tap('R0_EDIT_VALID');
chk('toolbox non-destructif : retouche AJOUTE une image (original conservé)', bot.state().curImg === imgBefore + 1);
chk('toolbox : retour Étape 1 (Choisir) après Valider', bot.state().screen === 'photo');

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);
}
main();

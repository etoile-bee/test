// ARBITRAGE SOUS-TITRES (lecture seule prod) — genere 2 stills GRATUITS en local.
// Meme raw, MEME frame, MEME texte. Seuls FONT_SIZE/OY changent. /*phase1 gel*/
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const RL = require('./render_local.js'); // buildAss + buildColorFilter de PROD (non modifie)

const OUTDIR = '/Users/fayrouzn/Library/Mobile Documents/com~apple~CloudDocs/podcast-outputs/test_local';
const W = 720, H = 1280;
const FONT = 'Archivo Black';
const SAMPLE = 'THE RED';            // 2 mots, style prod
const TS = 1.2;                      // instant de la frame (s)

// Raw : argument 1, sinon dernier raw de outputs/
let raw = process.argv[2];
if (!raw) {
  const dir = path.join(os.homedir(), 'podcast-workflow', 'outputs');
  const f = fs.readdirSync(dir).filter(x => /raw.*\.mp4$/i.test(x))
    .map(x => ({ x, t: fs.statSync(path.join(dir, x)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (!f) { console.error('Aucun raw dans outputs/'); process.exit(1); }
  raw = path.join(dir, f.x);
}
if (!fs.existsSync(raw)) { console.error('Introuvable: ' + raw); process.exit(1); }
console.log('Raw      :', path.basename(raw));

// Couleur = exactement la passe image par defaut de la prod (loadFx -> buildColorFilter)
const fx = RL.loadFx();
const color = RL.buildColorFilter(fx.image);

function render(fontSize, oy, outName) {
  const chunks = [{ text: SAMPLE, start: 0, length: 99 }];
  const ass = RL.buildAss(chunks, { font: FONT, fontSize, oy, letterSpacing: 2 });
  const assPath = '/tmp/arb_' + fontSize + '_' + Math.round(oy * 1000) + '.ass';
  fs.writeFileSync(assPath, ass);
  let vf = 'scale=' + W + ':' + H + ':force_original_aspect_ratio=increase,crop=' + W + ':' + H + ',setsar=1';
  if (color) vf += ',' + color;
  vf += ',ass=' + assPath;
  const out = path.join(OUTDIR, outName);
  execFileSync('ffmpeg', ['-y', '-ss', String(TS), '-i', raw, '-frames:v', '1', '-vf', vf, '-q:v', '2', out], { stdio: 'ignore' });
  console.log('OK       :', out, '(FONT_SIZE=' + fontSize + ' OY=' + oy + ')');
}

render(45, 0.25, 'arbitrage_45.png');      // (a) verrou documente
render(76, 0.33, 'arbitrage_76.png');      // (b) reglage demande
render(76, 0.370, 'arbitrage_76_0370.png');// (c) reglage REEL du fichier subtitle_style.js
console.log('\nDeux images dans', OUTDIR);

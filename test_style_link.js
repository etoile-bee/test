// test_style_link.js — Test GRATUIT : vérifie que render_local lit subtitle_style.js
// (FONT_SIZE/OY pilotés par les boutons Telegram). Rend 2 fois le clip de test :
// une fois avec la valeur courante de FONT_SIZE, une fois avec une valeur patchée,
// et confirme que render_local en tient compte. subtitle_style.js est restauré à la fin.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { renderLocal } = require('./render_local');

const HOME = os.homedir();
const OUT_DIR = path.join(HOME, 'podcast-workflow', 'outputs');
const FRAMES_DIR = path.join(OUT_DIR, 'test_local');
const STYLE = path.join(HOME, 'podcast-workflow', 'subtitle_style.js');
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

function latestRaw() {
  const files = fs.readdirSync(OUT_DIR).filter(f => /_raw_p\d+\.mp4$/i.test(f)).map(f => path.join(OUT_DIR, f));
  if (!files.length) throw new Error('Aucun *_raw_p*.mp4 dans ' + OUT_DIR);
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}
const curSize = () => +(fs.readFileSync(STYLE, 'utf8').match(/FONT_SIZE\s*=\s*([\d.]+)/) || [])[1];
const setSize = v => fs.writeFileSync(STYLE, fs.readFileSync(STYLE, 'utf8').replace(/FONT_SIZE\s*=\s*[\d.]+/, 'FONT_SIZE = ' + v));

const SCRIPT = 'HE IGNORES YOU THEN CALLS YOU CRAZY THAT IS MANIPULATION NOT LOVE WALK AWAY';
const WT = SCRIPT.split(/\s+/).map((w, i) => ({ text: w.toUpperCase(), start: +(i * 0.42).toFixed(3), end: +((i + 1) * 0.42).toFixed(3), duration: 0.42 }));
const KEYWORDS = ['CRAZY', 'MANIPULATION', 'AWAY'];
const REACTIONS = [{ after: 'THAT IS MANIPULATION NOT LOVE', type: 'mhm' }];

// proportion de blanc (0..255) dans la bande sous-titre : binarise le quasi-blanc puis réduit à 1x1.
// Plus la police est grande, plus il y a de blanc -> preuve mesurable. Sauve aussi le PNG pour l'oeil.
function whitePixels(video, t, png) {
  execFileSync(FFMPEG, ['-y', '-ss', t.toFixed(3), '-i', video, '-frames:v', '1', '-q:v', '2', png], { stdio: 'ignore' });
  const buf = execFileSync(FFMPEG, ['-y', '-ss', t.toFixed(3), '-i', video, '-frames:v', '1',
    '-vf', 'crop=720:320:0:740,format=gray,lut=y=if(gte(val\\,230)\\,255\\,0),scale=1:1',
    '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 20 });
  return buf && buf.length ? buf[0] : 0;
}

async function render(tag) {
  const out = path.join(os.tmpdir(), `test_style_${tag}.mp4`);
  const info = await renderLocal({ input: RAW, wordTimings: WT, keywords: KEYWORDS, reactions: REACTIONS, output: out, quiet: true });
  return { out, info };
}

let RAW, original;
(async () => {
  RAW = latestRaw();
  original = fs.readFileSync(STYLE, 'utf8'); // pour restauration
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const tLong = 9 * 0.42 + 0.15; // sur le mot MANIPULATION (sous-titre 1 mot)

  try {
    // --- 1) taille courante de subtitle_style.js ---
    const size1 = curSize();
    const r1 = await render('A');
    const w1 = whitePixels(r1.out, tLong, path.join(FRAMES_DIR, 'stylelink_A_taille' + size1 + '.png'));
    console.log(`A) subtitle_style FONT_SIZE=${size1}  -> render_local.style.fontSize=${r1.info.style.fontSize} (source=${r1.info.style.source}) | blanc=${w1.toFixed(2)}`);
    if (r1.info.style.fontSize !== size1) throw new Error(`render_local n'a PAS lu FONT_SIZE (${r1.info.style.fontSize} != ${size1})`);
    if (r1.info.style.source !== 'subtitle_style.js') throw new Error('source attendue subtitle_style.js, obtenu ' + r1.info.style.source);

    // --- 2) on patche FONT_SIZE (+30) et on re-rend ---
    const size2 = size1 + 30;
    setSize(size2);
    const r2 = await render('B');
    const w2 = whitePixels(r2.out, tLong, path.join(FRAMES_DIR, 'stylelink_B_taille' + size2 + '.png'));
    console.log(`B) subtitle_style FONT_SIZE=${size2}  -> render_local.style.fontSize=${r2.info.style.fontSize} (source=${r2.info.style.source}) | blanc=${w2.toFixed(2)}`);
    if (r2.info.style.fontSize !== size2) throw new Error(`changement de FONT_SIZE NON pris en compte (${r2.info.style.fontSize} != ${size2})`);
    if (!(w2 > w1)) throw new Error(`la police plus grande devrait produire plus de blanc (w2=${w2} <= w1=${w1})`);

    console.log('\n✅ render_local lit bien subtitle_style.js : FONT_SIZE pris en compte (taille +30 => sous-titres visiblement plus grands).');
    console.log('Frames de comparaison dans :', FRAMES_DIR, '(stylelink_A_*.png vs stylelink_B_*.png)');
  } finally {
    fs.writeFileSync(STYLE, original); // restauration garantie
    const back = curSize();
    console.log('subtitle_style.js restauré (FONT_SIZE=' + back + ').');
  }
})().catch(e => {
  try { if (original) fs.writeFileSync(STYLE, original); } catch (_) {}
  console.error('\n❌ test_style_link:', e.message); process.exit(1);
});

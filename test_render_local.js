// test_render_local.js — Test GRATUIT du rendu local (aucune API).
// Prend le *_raw_p*.mp4 le plus récent dans ~/podcast-workflow/outputs/,
// génère des wordTimings synthétiques (0.42s/mot), rend la vidéo test dans /tmp,
// puis extrait 3 frames PNG (plan large, zoom, mot long) dans outputs/test_local/,
// en 2 séries : police Arial Black vs Helvetica.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { renderLocal } = require('./render_local');

const HOME = os.homedir();
const OUT_DIR = path.join(HOME, 'podcast-workflow', 'outputs');
const FRAMES_DIR = path.join(OUT_DIR, 'test_local');
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

// --- 1) Source : *_raw_p*.mp4 le plus récent (résout les placeholders iCloud) ---
function pickRaw() {
  if (!fs.existsSync(OUT_DIR)) throw new Error('outputs/ introuvable: ' + OUT_DIR);
  let files = fs.readdirSync(OUT_DIR)
    .filter(f => /_raw_p\d+\.mp4$/i.test(f))
    .map(f => path.join(OUT_DIR, f));
  if (!files.length) throw new Error('Aucun *_raw_p*.mp4 dans ' + OUT_DIR);
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const raw = files[0];
  // iCloud : si fichier non téléchargé (taille ~0 ou .icloud), forcer le download
  let sz = 0; try { sz = fs.statSync(raw).size; } catch (e) {}
  if (sz < 100000) {
    console.log('  ⬇  Fichier iCloud non local, brctl download...');
    try { execFileSync('brctl', ['download', raw]); } catch (e) {
      console.log('  ⚠  brctl download a échoué — le fichier est peut-être un placeholder iCloud:', raw);
    }
  }
  return raw;
}

// --- 2) wordTimings synthétiques : 0.42s/mot ---
const SCRIPT = 'HE IGNORES YOU THEN CALLS YOU CRAZY THAT IS MANIPULATION NOT LOVE WALK AWAY';
function synthTimings(text, per = 0.42) {
  return text.split(/\s+/).filter(Boolean).map((w, i) => {
    const clean = w.replace(/[.,!?;:'"]/g, '').toUpperCase();
    return { text: clean, start: +(i * per).toFixed(3), end: +((i + 1) * per).toFixed(3), duration: per };
  });
}
const WT = synthTimings(SCRIPT);
// 2-3 keywords parmi des mots présents (dont un mot LONG seul : MANIPULATION)
const KEYWORDS = ['CRAZY', 'MANIPULATION', 'AWAY'];
// 1 réaction placée à la fin d'une phrase cible
const REACTIONS = [{ after: 'THAT IS MANIPULATION NOT LOVE', type: 'mhm' }];

// --- helpers frames ---
function frameAtKeyword(kw, per = 0.42) {
  const idx = SCRIPT.split(/\s+/).map(w => w.toUpperCase()).indexOf(kw);
  return idx < 0 ? 1.0 : idx * per + 0.15; // début du mot (sous-titre court ~0.4s, on vise dedans)
}
function grabFrame(video, t, png) {
  execFileSync(FFMPEG, ['-y', '-ss', t.toFixed(3), '-i', video, '-frames:v', '1', '-q:v', '2', png],
    { stdio: 'ignore' });
}

async function run() {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const raw = pickRaw();
  console.log('Source raw :', raw);

  const duration = WT[WT.length - 1].end + 0.35;
  // instants de capture : plan large (entre mots-clés), pendant un zoom, mot long seul
  const tWide = 0.6;                              // début : avant le 1er mot-clé -> plan large
  const tZoom = frameAtKeyword('CRAZY');          // pendant le zoom sur CRAZY
  const tLong = frameAtKeyword('MANIPULATION');   // mot long seul (sous-titre 1 mot) + zoom

  const variants = [
    { font: 'Arial Black', tagFont: 'arialblack' },
    { font: 'Helvetica', tagFont: 'helvetica' },
  ];

  const results = [];
  for (const v of variants) {
    const video = path.join(os.tmpdir(), `test_render_local_${v.tagFont}.mp4`);
    const t0 = Date.now();
    console.log(`\n=== Rendu police "${v.font}" -> ${video} ===`);
    const info = await renderLocal({
      input: raw, wordTimings: WT, keywords: KEYWORDS, reactions: REACTIONS,
      duration, output: video, font: v.font,
    });
    const ms = Date.now() - t0;
    console.log(`  ✅ rendu en ${(ms / 1000).toFixed(1)}s (${info.segments} seg, ${info.subtitles} sous-titres, ${info.reactions} réaction)`);

    const f1 = path.join(FRAMES_DIR, `${v.tagFont}_1_planlarge.png`);
    const f2 = path.join(FRAMES_DIR, `${v.tagFont}_2_zoom.png`);
    const f3 = path.join(FRAMES_DIR, `${v.tagFont}_3_motlong.png`);
    grabFrame(video, tWide, f1);
    grabFrame(video, tZoom, f2);
    grabFrame(video, tLong, f3);
    console.log('  frames :', f1, f2, f3);
    results.push({ font: v.font, video, ms, frames: [f1, f2, f3] });
  }

  console.log('\n──────── RÉCAP ────────');
  console.log('Frames PNG   :', FRAMES_DIR);
  results.forEach(r => {
    console.log(`  ${r.font.padEnd(12)} : ${(r.ms / 1000).toFixed(1)}s  ->  ${r.video}`);
    r.frames.forEach(f => console.log('      ' + f));
  });
}

run().catch(e => { console.error('\n❌ test_render_local:', e.message); process.exit(1); });

// test_render_local.js — Test GRATUIT du rendu local (aucune API).
// Prend le *_raw_p*.mp4 le plus récent (assez long) dans ~/podcast-workflow/outputs/,
// génère des wordTimings synthétiques (0.42s/mot), rend la vidéo test dans /tmp,
// puis extrait 3 frames PNG (plan large, zoom, mot long) dans outputs/test_local/,
// en 2 séries de polices à comparer (FONT_A vs FONT_B).
//
// NB : render_local.js est le moteur de PRODUCTION (utilisé par workflow.js/telegram_bot.js).
// Ce test ne le modifie pas : il passe le style en options explicites pour itérer librement
// SANS toucher subtitle_style.js (le style verrouillé de la prod).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { renderLocal } = require('./render_local');

const HOME = os.homedir();
const OUT_DIR = path.join(HOME, 'podcast-workflow', 'outputs');
const FRAMES_DIR = path.join(OUT_DIR, 'test_local');
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_BIN || 'ffprobe';

// ============================================================================
//  STYLE À ITÉRER — calqué sur le style VALIDÉ (Arial Black, blanc, gras,
//  uppercase, letter-spacing 2px, ombre douce, position basse y≈0.347).
//  >>> Ce sont les seuls réglages à toucher pour comparer/affiner le rendu. <<<
// ============================================================================
const FONT_A         = 'Arial Black'; // police principale (style validé d'origine Shotstack)
const FONT_B         = 'Helvetica';   // alternative à comparer (doute utilisateur sur "Arial")
const FONT_SIZE      = 76;            // taille libass @720x1280.
                                      //   ⚠ "52px" était la valeur CSS Shotstack ; l'équivalent
                                      //   VISUEL validé en libass ≈ 76 (cap ~42px). Baisser à 52
                                      //   donnerait un texte plus petit que le rendu validé.
const OY             = 0.347;         // position verticale (fraction depuis le bas) /*subpos5*/
const LETTER_SPACING = 2;             // letter-spacing en px
const MIN_RAW_DUR    = 8;             // s : durée mini du clip source pour des frames utiles
// ============================================================================

// --- 1) Source : *_raw_p*.mp4 le plus récent ASSEZ LONG (résout iCloud) ---
function ensureLocal(f) {
  let sz = 0; try { sz = fs.statSync(f).size; } catch (e) {}
  if (sz < 100000) {
    console.log('  ⬇  Fichier iCloud non local, brctl download...', path.basename(f));
    try { execFileSync('brctl', ['download', f]); } catch (e) {
      console.log('  ⚠  brctl download a échoué (placeholder iCloud ?):', f);
    }
  }
}
function probeDur(f) {
  try {
    return parseFloat(execFileSync(FFPROBE,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]).toString().trim()) || 0;
  } catch (e) { return 0; }
}
function pickRaw() {
  if (!fs.existsSync(OUT_DIR)) throw new Error('outputs/ introuvable: ' + OUT_DIR);
  const files = fs.readdirSync(OUT_DIR)
    .filter(f => /_raw_p\d+\.mp4$/i.test(f))
    .map(f => path.join(OUT_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) throw new Error('Aucun *_raw_p*.mp4 dans ' + OUT_DIR);
  // le plus récent assez long ; sinon repli sur le plus récent (avec avertissement)
  for (const f of files) {
    ensureLocal(f);
    const d = probeDur(f);
    if (d >= MIN_RAW_DUR) return { raw: f, dur: d };
  }
  ensureLocal(files[0]);
  const d0 = probeDur(files[0]);
  console.log(`  ⚠  Aucun raw ≥ ${MIN_RAW_DUR}s ; repli sur le plus récent (${d0.toFixed(1)}s) — frames zoom/mot-long possiblement hors champ.`);
  return { raw: files[0], dur: d0 };
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
// 2-3 keywords présents dans le script (dont un mot LONG seul : MANIPULATION)
const KEYWORDS = ['CRAZY', 'MANIPULATION', 'AWAY'];
// 1 réaction placée à la fin d'une phrase cible (nécessite reactionsMode != 'off')
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
  const { raw, dur } = pickRaw();
  console.log('Source raw :', raw, `(${dur.toFixed(1)}s)`);

  const duration = WT[WT.length - 1].end + 0.35;
  // instants de capture : plan large (avant 1er mot-clé), pendant un zoom, mot long seul
  const tWide = 0.6;
  const tZoom = frameAtKeyword('CRAZY');
  const tLong = frameAtKeyword('MANIPULATION');

  const variants = [
    { font: FONT_A, tagFont: 'arialblack' },
    { font: FONT_B, tagFont: 'helvetica' },
  ];

  const results = [];
  for (const v of variants) {
    const video = path.join(os.tmpdir(), `test_render_local_${v.tagFont}.mp4`);
    const t0 = Date.now();
    console.log(`\n=== Rendu police "${v.font}" (taille ${FONT_SIZE}, OY ${OY}) -> ${video} ===`);
    const info = await renderLocal({
      input: raw, wordTimings: WT, keywords: KEYWORDS, reactions: REACTIONS,
      duration, output: video,
      // style explicite (n'utilise PAS subtitle_style.js -> itération libre via les constantes ci-dessus)
      font: v.font, fontSize: FONT_SIZE, oy: OY, letterSpacing: LETTER_SPACING,
      reactionsMode: 'natural', // exerce la branche réactions (mp3 placés dans les pauses)
      quiet: true,
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
  console.log(`Style testé   : taille ${FONT_SIZE}, OY ${OY}, letter-spacing ${LETTER_SPACING}px`);
  console.log('Frames PNG    :', FRAMES_DIR);
  results.forEach(r => {
    console.log(`  ${r.font.padEnd(12)} : ${(r.ms / 1000).toFixed(1)}s  ->  ${r.video}`);
    r.frames.forEach(f => console.log('      ' + f));
  });
}

run().catch(e => { console.error('\n❌ test_render_local:', e.message); process.exit(1); });

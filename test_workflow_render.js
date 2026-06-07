// test_workflow_render.js — Test GRATUIT d'intégration : appelle la VRAIE renderVideo()
// de workflow.js (chemin local par défaut), avec le dernier raw local + timings synthétiques.
// Vérifie : la vidéo sort, durée cohérente, audio présent. Aucune API.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { renderVideo } = require('./workflow.js'); // require.main!==module -> main() ne se lance pas

const OUT_DIR = path.join(os.homedir(), 'podcast-workflow', 'outputs');
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

function latestRaw() {
  const files = fs.readdirSync(OUT_DIR).filter(f => /_raw_p\d+\.mp4$/i.test(f)).map(f => path.join(OUT_DIR, f));
  if (!files.length) throw new Error('Aucun *_raw_p*.mp4 dans ' + OUT_DIR);
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

const SCRIPT = 'HE IGNORES YOU THEN CALLS YOU CRAZY THAT IS MANIPULATION NOT LOVE WALK AWAY';
const wt = SCRIPT.split(/\s+/).map((w, i) => ({ text: w.toUpperCase(), start: +(i * 0.42).toFixed(3), end: +((i + 1) * 0.42).toFixed(3), duration: 0.42 }));
const keywords = ['CRAZY', 'MANIPULATION', 'AWAY'];
const reactions = [{ after: 'THAT IS MANIPULATION NOT LOVE', type: 'mhm' }];
const duration = wt[wt.length - 1].end + 0.35;

(async () => {
  if (process.env.USE_SHOTSTACK === '1') { console.error('USE_SHOTSTACK=1 -> ce test cible le rendu LOCAL, relance sans cette variable.'); process.exit(1); }
  const raw = latestRaw();
  console.log('Raw local  :', raw);
  console.log('USE_SHOTSTACK:', process.env.USE_SHOTSTACK || '(non défini -> rendu local)');

  const t0 = Date.now();
  // signature réelle : renderVideo(lipsyncUrl, wordTimings, keywords, duration, num, reactions, localInput)
  const out = await renderVideo('https://exemple/ignored.mp4', wt, keywords, duration, 99, reactions, raw);
  const ms = Date.now() - t0;

  if (!out || !fs.existsSync(out)) throw new Error('renderVideo n\'a pas produit de fichier: ' + out);

  // Vérifs : vidéo + audio + durée
  const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,channels',
    '-of', 'default=nw=1', out]).toString();
  const hasVideo = /codec_type=video/.test(probe);
  const hasAudio = /codec_type=audio/.test(probe);
  const dur = parseFloat((probe.match(/duration=([\d.]+)/) || [])[1] || '0');

  console.log('\n──────── RÉSULTAT ────────');
  console.log('Sortie       :', out);
  console.log('Taille       :', (fs.statSync(out).size / 1e6).toFixed(2), 'MB');
  console.log('Vidéo / Audio:', hasVideo ? 'OK' : 'MANQUE', '/', hasAudio ? 'OK' : 'MANQUE');
  console.log('Durée fichier:', dur.toFixed(2), 's (attendu ≈', duration.toFixed(2), 's)');
  console.log('Temps rendu  :', (ms / 1000).toFixed(2), 's');
  console.log(probe.trim().split('\n').map(l => '   ' + l).join('\n'));

  const okDur = Math.abs(dur - duration) < 1.0;
  if (hasVideo && hasAudio && okDur) { console.log('\n✅ Intégration OK : vidéo locale, audio présent, durée cohérente.'); }
  else { console.error('\n❌ Intégration : vérif échouée (video/audio/durée).'); process.exit(1); }
})().catch(e => { console.error('\n❌ test_workflow_render:', e.message); process.exit(1); });

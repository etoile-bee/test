// render_local_v2.js — Rendu vidéo 100% LOCAL (ffmpeg + libass), v2 DURCIE.
//
// OBJECTIF v2 : MÊME rendu visuel que la v1 validée (tag git `v1-validee`) —
// sous-titres, couleur V5 adaptative, zooms, réactions IDENTIQUES — mais durcie
// pour la production. Le rendu validé est garanti car ce module RÉUTILISE TELLES
// QUELLES les fonctions de render_local.js (buildChunks, buildSegments,
// buildReactions, buildAss, buildColorFilter, normTimings, loadFx). On ne
// réimplémente QUE l'orchestration, à laquelle on ajoute :
//
//   1. dryRun       : construit le plan ffmpeg complet (args + filter_complex +
//                     .ass) SANS lancer ffmpeg ni exiger de fichier média.
//                     -> testable hors-ligne / sandbox, et utile pour preview.
//   2. erreurs nettes: stderr ffmpeg capturée et remontée dans l'exception
//                     (au lieu d'un crash muet d'execFileSync).
//   3. onLog         : callback d'observabilité (se branche sur le moniteur live).
//
// ⚠️ VERROUS RESPECTÉS : sous-titres (Archivo, lock) et couleur (V5 adaptative)
//   ne sont PAS touchés — ils proviennent des fonctions v1 importées.
//
// Usage module (compatible v1) :
//   const { renderLocalV2 } = require('./render_local_v2');
//   await renderLocalV2({ input, wordTimings, keywords, reactions, output });
//   // plan sans rendu :
//   const plan = await renderLocalV2({ ...opts, dryRun: true });

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Fonctions VALIDÉES réutilisées de la v1 (source unique du rendu visuel) ---
const v1 = require('./render_local');
const {
  buildChunks, buildSegments, buildReactions, buildAss,
  normTimings, buildColorFilter, loadFx, MUSIC_DIR,
} = v1;

// ----------------------------------------------------------------------------
// Constantes d'orchestration — MIROIR des constantes v1 (mêmes valeurs validées).
// Les constantes qui pilotent le LOOK (taille/police/zoom/réactions) vivent dans
// les fonctions v1 importées ; ici on ne garde que le cadre et les fades audio.
// ----------------------------------------------------------------------------
const W = 720, H = 1280, FPS = 30;
const FONT = 'Archivo Black', FONT_SIZE = 78, OY = 0.27, LETTER_SPACING = 2;
const REACT_VOL = 0.5;
const FADE_IN = 0.12, FADE_OUT = 0.15;
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

const even = n => { n = Math.round(n); return n % 2 ? n + 1 : n; };

// loadStyle : identique à la v1 (lit subtitle_style.js, piloté par les boutons
// Telegram). Réimplémenté ici car non exporté par la v1.
function loadStyle() {
  try {
    const p = require.resolve('./subtitle_style.js');
    delete require.cache[p];
    const s = require(p);
    const out = {};
    if (s.FONT_SIZE != null && isFinite(+s.FONT_SIZE)) out.fontSize = +s.FONT_SIZE;
    if (s.OY != null && isFinite(+s.OY)) out.oy = +s.OY;
    if (s.LETTER != null) { const n = parseFloat(String(s.LETTER)); if (isFinite(n)) out.letterSpacing = n; }
    if (s.ZOOM != null && isFinite(+s.ZOOM)) out.zoom = +s.ZOOM;
    if (s.FONT != null && String(s.FONT).trim()) out.font = String(s.FONT).trim();
    if (s.SUBS != null) out.subs = (+s.SUBS) ? 1 : 0;
    return out;
  } catch (e) { return {}; }
}

// ----------------------------------------------------------------------------
// buildPlan : construit TOUT le plan ffmpeg (args, filter_complex, .ass, meta)
// sans rien exécuter. Coeur partagé par le rendu réel et le dryRun.
// Réplique fidèle de l'orchestration v1 (render_local.js l.297-428).
// ----------------------------------------------------------------------------
function buildPlan(opts) {
  const { input, wordTimings, keywords = [], reactions = [], output } = opts;

  // Résolution des réglages : opts > subtitle_style.js (boutons) > constantes
  const style = loadStyle();
  const font = opts.font || (style.font != null ? style.font : FONT);
  const fontSize = opts.fontSize != null ? opts.fontSize : (style.fontSize != null ? style.fontSize : FONT_SIZE);
  const oy = opts.oy != null ? opts.oy : (style.oy != null ? style.oy : OY);
  const letterSpacing = opts.letterSpacing != null ? opts.letterSpacing : (style.letterSpacing != null ? style.letterSpacing : LETTER_SPACING);
  const subsOn = opts.subs != null ? (+opts.subs ? 1 : 0) : (style.subs != null ? style.subs : 1);

  // Réglages fx (style.json) : Image (couleur), Zooms, Musique
  const fx = loadFx();
  const img = Object.assign({}, fx.image, opts.image || {});
  const music = Object.assign({}, fx.music, opts.music || {});
  const zoomCfg = Object.assign({}, fx.zoom, opts.zoomCfg || {});
  if (opts.zoom != null) zoomCfg.base = +opts.zoom;
  const colorFilter = buildColorFilter(img);

  const wt = normTimings(wordTimings);

  // Durée : couper la fin qui traîne (réplique v1). v2 : pas de cap artificiel
  // sur la durée — vidéos longues acceptées (voir note mémoire dans le README).
  let duration = +opts.duration || (wt.length ? wt[wt.length - 1].end + 1.5 : 23);
  const speechEnd = wt.reduce((m, w) => Math.max(m, w.end || 0), 0);
  if (speechEnd > 1 && speechEnd < duration) duration = speechEnd + 0.35;

  const chunks = buildChunks(wt);
  const segs = buildSegments(wt, keywords, duration, zoomCfg);
  const reactMode = opts.reactionsMode || (fx.reactions && fx.reactions.mode) || 'off';
  let reacts = (reactMode === 'off') ? [] : buildReactions(wt, reactions, duration, reactMode);
  if (reactMode === 'natural') reacts = reacts.slice(0, 1);

  const tag = path.basename(output || ('out_' + Date.now() + '.mp4')).replace(/[^a-z0-9]/gi, '_');
  const assPath = path.join(os.tmpdir(), 'render_localv2_' + tag + '.ass');
  const fcPath = path.join(os.tmpdir(), 'render_localv2_' + tag + '.fc');

  // --- filter_complex (réplique exacte v1) ---
  const fc = [];
  fc.push(`[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1[base]`);
  const labels = segs.map((_, i) => `[v${i}]`);
  fc.push(`[base]split=${segs.length}${labels.join('')}`);
  segs.forEach((s, i) => {
    const zw = even(W * s.scale), zh = even(H * s.scale);
    const cx = Math.round((zw - W) / 2), cy = Math.round((zh - H) / 2);
    fc.push(`[v${i}]trim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},setpts=PTS-STARTPTS,scale=${zw}:${zh},crop=${W}:${H}:${cx}:${cy},setsar=1[c${i}]`);
  });
  fc.push(`${segs.map((_, i) => `[c${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[vcc]`);
  if (colorFilter) fc.push(`[vcc]${colorFilter}[vc]`); else fc.push(`[vcc]null[vc]`);

  let assText = null;
  if (subsOn) {
    assText = buildAss(chunks, { font, fontSize, oy, letterSpacing });
    fc.push(`[vc]ass=${assPath}[vs]`);
    fc.push(`[vs]format=yuv420p[vout]`);
  } else {
    fc.push(`[vc]format=yuv420p[vout]`);
  }

  // --- Audio (réplique exacte v1) ---
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(String(input));
  const aBaseIdx = isImage ? 1 : 0;
  const firstReactIdx = isImage ? 2 : 1;
  const musRel = music.file && (path.isAbsolute(music.file) ? music.file : path.join(MUSIC_DIR, music.file));
  const musicOn = !!(+music.on && musRel && fs.existsSync(musRel));
  const fout = Math.max(duration - FADE_OUT, 0);
  const fadeChain = `afade=t=in:ss=0:d=${FADE_IN}` + (duration > 0.4 ? `,afade=t=out:st=${fout.toFixed(3)}:d=${FADE_OUT}` : '') + `,loudnorm=I=-14:TP=-1.5:LRA=11`;
  fc.push(`[${aBaseIdx}:a]atrim=0:${duration.toFixed(3)},asetpts=PTS-STARTPTS[a0]`);
  const aLabels = ['[a0]'];
  reacts.forEach((r, i) => {
    const ms = Math.round(r.st * 1000);
    const vol = (r.vol != null ? r.vol : REACT_VOL);
    const pitch = (r.pitch && Math.abs(r.pitch - 1) > 0.001) ? r.pitch : null;
    const rdur = r.dur || 0.5;
    const fo = Math.max(rdur - 0.08, 0.05).toFixed(3);
    let chain = '';
    if (pitch) chain += `asetrate=44100*${pitch},aresample=44100,atempo=${(1 / pitch).toFixed(4)},`;
    chain += `afade=t=in:ss=0:d=0.08,afade=t=out:st=${fo}:d=0.08,volume=${vol},adelay=${ms}:all=1`;
    fc.push(`[${firstReactIdx + i}:a]${chain}[r${i}]`);
    aLabels.push(`[r${i}]`);
  });
  if (musicOn) {
    const mi = firstReactIdx + reacts.length;
    const vol = (+music.volume || 0.12).toFixed(3);
    fc.push(`[${mi}:a]aloop=loop=-1:size=2147483647,atrim=0:${duration.toFixed(3)},asetpts=PTS-STARTPTS,volume=${vol}[mus]`);
    aLabels.push('[mus]');
  }
  if (aLabels.length > 1) {
    fc.push(`${aLabels.join('')}amix=inputs=${aLabels.length}:normalize=0:duration=first[amx]`);
    fc.push(`[amx]${fadeChain}[aout]`);
  } else {
    fc.push(`[a0]${fadeChain}[aout]`);
  }

  // --- Args ffmpeg (réplique exacte v1) ---
  const args = ['-y'];
  if (isImage) args.push('-loop', '1', '-t', duration.toFixed(3), '-i', String(input), '-f', 'lavfi', '-t', duration.toFixed(3), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
  else args.push('-i', String(input));
  for (const r of reacts) args.push('-i', r.mp3);
  if (musicOn) args.push('-i', musRel);
  args.push(
    '-filter_complex_script', fcPath,
    '-map', '[vout]', '-map', '[aout]',
    '-r', String(FPS),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-t', duration.toFixed(3),
    output || path.join(os.tmpdir(), tag + '.mp4')
  );

  const styleSrc = (style.fontSize != null || style.oy != null || style.letterSpacing != null || style.zoom != null || style.font != null || style.subs != null) ? 'subtitle_style.js' : 'défauts';

  return {
    args, filterComplex: fc.join(';\n'), assText, assPath, fcPath,
    duration, isImage, musicOn, musRel,
    meta: {
      segments: segs.length,
      subtitles: subsOn ? chunks.length : 0,
      reactions: reacts.length,
      style: { font, fontSize, oy, letterSpacing, baseZoom: zoomCfg.base, subs: subsOn, source: styleSrc },
      fx: { image: img, zoom: zoomCfg, music: { on: musicOn ? 1 : 0, file: musicOn ? path.basename(musRel) : '', volume: music.volume } },
      colorFilter: colorFilter || 'neutre',
    },
  };
}

// ----------------------------------------------------------------------------
// renderLocalV2 : API compatible v1 + dryRun + erreurs nettes + onLog.
// ----------------------------------------------------------------------------
async function renderLocalV2(opts) {
  const { output, quiet = false, dryRun = false } = opts;
  const log = typeof opts.onLog === 'function' ? opts.onLog : (m => { if (!quiet) console.log(m); });

  if (!output && !dryRun) throw new Error('render_local_v2: output requis');
  if (!dryRun) {
    if (!opts.input || !fs.existsSync(opts.input)) throw new Error('render_local_v2: input introuvable: ' + opts.input);
  }

  const plan = buildPlan(opts);
  const m = plan.meta;
  log(`render_local_v2: ${m.segments} segments, ${m.subtitles ? m.subtitles + ' sous-titres' : 'SANS sous-titres'}, ${m.reactions} réaction(s), durée ${plan.duration.toFixed(2)}s`);
  log(`  style (${m.style.source}) : police "${m.style.font}", ${m.style.fontSize}px, OY ${m.style.oy}, spacing ${m.style.letterSpacing}px, subs ${m.style.subs ? 'ON' : 'OFF'}`);
  log(`  zoom ${m.fx.zoom.on ? 'ON x' + m.fx.zoom.intensity + ' ' + m.fx.zoom.duration + 's 1/' + m.fx.zoom.everyN + ' base ' + m.fx.zoom.base : 'OFF'} | couleur ${m.colorFilter} | musique ${m.fx.music.on ? m.fx.music.file + ' @' + m.fx.music.volume : 'OFF'}`);

  if (dryRun) {
    log('  [dryRun] aucun ffmpeg lancé — plan retourné.');
    return { dryRun: true, output: output || null, ...plan, ...m, ffmpeg: FFMPEG };
  }

  // Écriture des fichiers temporaires (filter_complex + .ass)
  if (plan.assText != null) fs.writeFileSync(plan.assPath, plan.assText);
  fs.writeFileSync(plan.fcPath, plan.filterComplex);

  // Exécution avec capture stderr (v2 : erreur nette au lieu d'un crash muet)
  const res = spawnSync(FFMPEG, plan.args, {
    stdio: quiet ? ['ignore', 'ignore', 'pipe'] : ['ignore', 'inherit', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
  const stderr = (res.stderr || '').toString();
  if (res.error) throw new Error(`render_local_v2: ffmpeg introuvable/illançable (${FFMPEG}): ${res.error.message}`);
  if (res.status !== 0) {
    const tail = stderr.split('\n').slice(-25).join('\n');
    throw new Error(`render_local_v2: ffmpeg a échoué (code ${res.status}).\n--- ffmpeg stderr (fin) ---\n${tail}`);
  }

  return {
    output, duration: plan.duration, segments: m.segments,
    subtitles: m.subtitles, reactions: m.reactions,
    assPath: plan.assText != null ? plan.assPath : null,
    style: m.style, fx: m.fx,
  };
}

module.exports = { renderLocalV2, buildPlan, loadStyle };

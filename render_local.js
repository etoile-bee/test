// render_local.js — Rendu vidéo 100% LOCAL (ffmpeg + libass).
// Remplace renderVideo()/Shotstack de workflow.js : sous-titres .ass burn-in,
// zooms dynamiques sur mots-clés, lit/réactions mixées, fades anti-pop, 720x1280 30fps h264.
//
// Réplique fidèle de renderVideo(lipsyncUrl, wordTimings, keywords, duration, num, reactions)
// mais en local : pas d'upload, pas d'API. lipsyncUrl devient un chemin de fichier local.
//
// Usage module :
//   const { renderLocal } = require('./render_local');
//   await renderLocal({ input, wordTimings, keywords, duration, reactions, output });

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// CONSTANTES ÉDITABLES — style sous-titres validé (Arial Black ~52px @720x1280)
// ============================================================================
const FONT = 'Archivo Black'; // police de référence (confirmée utilisateur)
const FONT_SIZE = 78;         // taille à l'échelle 720x1280 (cap ~42px, calqué modèle)
const OY = 0.27;              // position verticale du sous-titre ≈ fraction depuis le bas (modèle ~0.28)
const LETTER_SPACING = 2;     // letter-spacing en px (champ Spacing de l'ASS)

// ----------------------------------------------------------------------------
// Constantes de rendu (alignées sur renderVideo / passe finale de workflow.js)
// ----------------------------------------------------------------------------
const W = 720, H = 1280, FPS = 30;
const GAP = 0.02;             // trou minimal entre 2 sous-titres
const LONG = 7;               // un mot > 7 lettres reste seul (pas de groupe de 2)
const ZOOMS = [1.10, 1.18, 1.12, 1.20, 1.14, 1.16]; // intensités de zoom alternées
const ZOOM_LEN = 2.5;         // durée d'un zoom sur mot-clé (s)
const REACT_VOL = 0.5;        // volume des réactions
const REACT_LEN = 1.2;        // longueur d'une réaction (s)
const FADE_IN = 0.12, FADE_OUT = 0.15; // fades audio anti-pop
const REACT_TYPES = ['mhm', 'yeah', 'right', 'hmm'];
const REACTIONS_DIR = path.join(os.homedir(), 'podcast-workflow', 'reactions');
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const even = n => { n = Math.round(n); return n % 2 ? n + 1 : n; };
const wtext = w => String(w.text || w.word || '').toUpperCase();
const normWord = s => String(s || '').toUpperCase().replace(/[.,!?;:'"—–-]/g, '').split(/\s+/).filter(Boolean);

// Lit subtitle_style.js (source unique pilotée par les boutons Telegram /settings) :
// FONT_SIZE (taille), OY (position), LETTER (espacement), ZOOM (optionnel).
// Renvoie {} si le fichier est absent/illisible -> les constantes en tête restent les défauts.
function loadStyle() {
  try {
    const p = require.resolve('./subtitle_style.js');
    delete require.cache[p]; // relit toujours le fichier courant (le bot le patche à chaud)
    const s = require(p);
    const out = {};
    if (s.FONT_SIZE != null && isFinite(+s.FONT_SIZE)) out.fontSize = +s.FONT_SIZE;
    if (s.OY != null && isFinite(+s.OY)) out.oy = +s.OY;
    if (s.LETTER != null) { const n = parseFloat(String(s.LETTER)); if (isFinite(n)) out.letterSpacing = n; }
    if (s.ZOOM != null && isFinite(+s.ZOOM)) out.zoom = +s.ZOOM; // zoom de base optionnel
    if (s.FONT != null && String(s.FONT).trim()) out.font = String(s.FONT).trim(); // police libass
    if (s.SUBS != null) out.subs = (+s.SUBS) ? 1 : 0; // 1 = burn-in, 0 = vidéo propre
    return out;
  } catch (e) { return {}; }
}

// ----------------------------------------------------------------------------
// style.json : réglages Image (couleur), Zooms, Musique — pilotés par /edit du bot
// ----------------------------------------------------------------------------
const MUSIC_DIR = path.join(__dirname, 'music');
const FX_DEFAULT = {
  // Signature : look validé, légèrement réchauffé (température basse=chaud), SANS toucher la saturation
  image: { brightness: 0.02, contrast: 1.04, saturation: 1.0, temperature: 5600, sharpness: 0, vignette: 1 },
  zoom:  { on: 1, intensity: 1.0, duration: 2.5, everyN: 1, base: 1.0 },
  music: { on: 0, file: '', volume: 0.12 },
  reactions: { mode: 'natural' }, // off | natural (1 max, dans une pause, fondu+pitch) | on (toutes)
};
function loadFx() {
  try {
    const p = path.join(__dirname, 'style.json');
    if (!fs.existsSync(p)) return JSON.parse(JSON.stringify(FX_DEFAULT));
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return {
      image: Object.assign({}, FX_DEFAULT.image, j.image || {}),
      zoom:  Object.assign({}, FX_DEFAULT.zoom,  j.zoom  || {}),
      music: Object.assign({}, FX_DEFAULT.music, j.music || {}),
      reactions: Object.assign({}, FX_DEFAULT.reactions, j.reactions || {}),
    };
  } catch (e) { return JSON.parse(JSON.stringify(FX_DEFAULT)); }
}
// Chaîne de filtres couleur ffmpeg (vide si tout neutre)
function buildColorFilter(img) {
  img = img || {};
  const f = [];
  const b = +img.brightness || 0, c = img.contrast != null ? +img.contrast : 1, s = img.saturation != null ? +img.saturation : 1;
  if (b !== 0 || c !== 1 || s !== 1) f.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
  const t = img.temperature != null ? +img.temperature : 6500;
  if (t !== 6500) f.push(`colortemperature=temperature=${Math.round(t)}:mix=1:pl=0`);
  const sh = +img.sharpness || 0;
  if (sh !== 0) f.push(`unsharp=5:5:${sh.toFixed(2)}:5:5:0`); // sh<0 = flou doux (effet Glow/peau douce)
  const vg = +img.vignette || 0;
  if (vg > 0) f.push(`vignette=angle=${(Math.PI / 5 * (1 + vg * 0.4)).toFixed(4)}`);
  return f.join(',');
}

// Normalise les wordTimings : { text, start, end, duration } (gère .text ou .word)
function normTimings(wordTimings) {
  return (wordTimings || [])
    .filter(w => !/^\[pause\]$/i.test(String(w.text || w.word || '')))
    .map(w => {
      const text = wtext(w);
      const start = +w.start || 0;
      const end = (w.end != null) ? +w.end : start + (+w.duration || 0);
      return { text, start, end, duration: end - start };
    });
}

// secondes -> H:MM:SS.cs (format temps ASS)
function secToAss(t) {
  if (t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const cs = Math.round((t - Math.floor(t)) * 100);
  const cs2 = cs >= 100 ? 99 : cs;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs2).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// 1) Découpage des sous-titres en chunks 1-2 mots (réplique renderVideo l.116-136)
// ----------------------------------------------------------------------------
function buildChunks(wt) {
  const chunks = [];
  let i = 0;
  while (i < wt.length) {
    const w = wt[i], w2 = wt[i + 1];
    let group;
    if (w2 && w.text.length <= LONG && w2.text.length <= LONG) { group = [w, w2]; i += 2; }
    else { group = [w]; i += 1; }
    const after = wt[i]; // mot qui suit le groupe
    const start = group[0].start;
    let end = group[group.length - 1].end;
    if (after) end = after.start - GAP;   // le sous-titre tient jusqu'au mot suivant
    if (end <= start) end = start + 0.12;
    chunks.push({ text: group.map(g => g.text).join(' '), start, length: Math.max(end - start, 0.12) });
  }
  return chunks;
}

// ----------------------------------------------------------------------------
// 2) Segments de zoom (réplique renderVideo l.147-162), rendus contigus [0,duration]
// ----------------------------------------------------------------------------
function buildSegments(wt, keywords, duration, z) {
  z = z || {};
  const on = z.on != null ? +z.on : 1;
  const base = (z.base && isFinite(+z.base) && +z.base > 1) ? +z.base : 1.0; // zoom plancher
  const intensity = z.intensity != null ? +z.intensity : 1.0;                 // multiplie l'amplitude des zooms
  const zlen = z.duration != null ? +z.duration : ZOOM_LEN;                    // durée d'un zoom (s)
  const everyN = Math.max(1, Math.round(z.everyN || 1));                       // 1 = tous les mots-clés, 2 = 1 sur 2
  // Zooms désactivés : un seul plan plein au zoom de base
  if (!on) return [{ start: 0, end: duration, scale: base }];
  const kws = new Set((keywords || []).map(k => String(k).toUpperCase()));
  let sorted = wt.filter(w => kws.has(w.text)).sort((a, b) => a.start - b.start);
  if (everyN > 1) sorted = sorted.filter((_, i) => i % everyN === 0);
  const segs = [];
  let cur = 0, ki = 0;
  for (const kw of sorted) {
    let zs = Math.max(kw.start - 0.05, cur);
    if (zs > cur + 0.05) segs.push({ start: cur, end: zs, scale: base }); // plan "large" = zoom de base
    else zs = cur; // snap : pas de trou noir dans le concat local
    const zRaw = ZOOMS[ki % ZOOMS.length];
    const z2 = Math.max(1 + (zRaw - 1) * intensity, base); ki++; // intensité ajustable
    const ze = Math.min(zs + zlen, duration);
    if (ze <= zs) continue;
    segs.push({ start: zs, end: ze, scale: z2 });
    cur = ze;
  }
  if (cur < duration - 0.1) segs.push({ start: cur, end: duration, scale: base });
  else if (segs.length && segs[segs.length - 1].end < duration) segs[segs.length - 1].end = duration;
  if (!segs.length) segs.push({ start: 0, end: duration, scale: base });
  return segs;
}

// ----------------------------------------------------------------------------
// 3) Réactions : place chaque mp3 à la fin de la phrase cible (réplique l.164-185)
// ----------------------------------------------------------------------------
// Pauses du discours (creux entre mots) : { at, gap, mid }
function speechGaps(wt) {
  const g = [];
  for (let i = 0; i < wt.length - 1; i++) { const d = wt[i + 1].start - wt[i].end; if (d >= 0.18) g.push({ at: wt[i].end, gap: d, mid: (wt[i].end + wt[i + 1].start) / 2 }); }
  return g;
}
function probeDur(file) { try { return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).toString().trim()) || 0.5; } catch (e) { return 0.5; } }
function pickVariant(type) { // variante aléatoire si reactions/<type>2.mp3… existe, sinon <type>.mp3
  try { const all = fs.readdirSync(REACTIONS_DIR).filter(f => new RegExp('^' + type + '\\d*\\.(mp3|m4a)$', 'i').test(f)); if (all.length) return path.join(REACTIONS_DIR, all[Math.floor(Math.random() * all.length)]); } catch (e) {}
  const def = path.join(REACTIONS_DIR, type + '.mp3'); return fs.existsSync(def) ? def : null;
}
function buildReactions(wt, reactions, duration, mode) {
  const out = [];
  if (!reactions || !reactions.length) return out;
  const gaps = speechGaps(wt);
  for (const rx of reactions.slice(0, 2)) {
    const type = String(rx.type || '').toLowerCase();
    if (REACT_TYPES.indexOf(type) < 0) continue;
    const key = normWord(rx.after);
    if (!key.length) continue;
    let endT = null;
    for (let n = Math.min(3, key.length); n >= 1 && endT === null; n--) {
      const tail = key.slice(key.length - n);
      for (let i = 0; i + n <= wt.length; i++) {
        let ok = true;
        for (let j = 0; j < n; j++) { if (wt[i + j].text !== tail[j]) { ok = false; break; } }
        if (ok) endT = wt[i + n - 1].end;
      }
    }
    if (endT === null) continue;
    const mp3 = pickVariant(type);
    if (!mp3) continue;
    let st = endT + 0.05, vol = REACT_VOL, pitch = 1.0;
    if (mode === 'natural') {
      // UNIQUEMENT dans un vrai creux : pause la plus proche après endT, sinon la plus grande
      const after = gaps.filter(g => g.at >= endT - 0.1).sort((a, b) => a.at - b.at)[0];
      const big = gaps.slice().sort((a, b) => b.gap - a.gap)[0];
      const pause = after || big;
      if (!pause) continue; // pas de vrai creux -> on ne colle PAS la réaction sur la voix
      st = pause.mid - 0.1;
      vol = +(0.25 + Math.random() * 0.10).toFixed(3); // 0.25–0.35 (~-12 à -9 dB sous la voix)
      pitch = +(1 + (Math.random() * 0.06 - 0.03)).toFixed(3); // ±3 % pour éviter la répétition
    }
    st = Math.min(Math.max(st, 0), Math.max(duration - 0.4, 0));
    out.push({ type, st, mp3, vol, pitch, dur: probeDur(mp3) });
  }
  return out;
}

// ----------------------------------------------------------------------------
// 4) Génération du fichier .ass (libass) — style validé, burn-in
// ----------------------------------------------------------------------------
function buildAss(chunks, opts = {}) {
  const font = opts.font || FONT;
  const size = opts.fontSize || FONT_SIZE;
  const spacing = opts.letterSpacing != null ? opts.letterSpacing : LETTER_SPACING;
  const oy = opts.oy != null ? opts.oy : OY;
  const marginV = Math.round(oy * H);

  // Couleurs ASS = &HAABBGGRR (AA: 00=opaque, FF=transparent)
  const white = '&H00FFFFFF';
  const shadow = '&H73000000'; // noir ~55% opaque -> ombre douce (pas de gros contour noir)
  // Bold=-1, BorderStyle=1, Outline=1 BLANC (épaissit, façon text-stroke), Shadow=2 (ombre douce)
  const styleLine =
    `Style: Main,${font},${size},${white},${white},${white},${shadow},-1,0,0,0,100,100,${spacing},0,1,1,2,2,40,40,${marginV},1`;

  const header =
`[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const esc = t => String(t).toUpperCase()
    .replace(/\\/g, '')        // pas de backslash (éviterait un override ASS)
    .replace(/[{}]/g, '')      // pas d'override accidentel
    .replace(/\r?\n/g, '\\N');
  const events = chunks.map(c =>
    `Dialogue: 0,${secToAss(c.start)},${secToAss(c.start + c.length)},Main,,0,0,0,,${esc(c.text)}`
  ).join('\n');

  return header + events + '\n';
}

// ----------------------------------------------------------------------------
// 5) Rendu principal : compose le filter_complex et lance ffmpeg
// ----------------------------------------------------------------------------
async function renderLocal(opts) {
  const {
    input,                 // chemin du mp4 lipsync (ex-lipsyncUrl)
    wordTimings,
    keywords = [],
    reactions = [],
    output,                // chemin de sortie .mp4
    quiet = false,
  } = opts;

  if (!input || !fs.existsSync(input)) throw new Error('render_local: input introuvable: ' + input);
  if (!output) throw new Error('render_local: output requis');

  // Résolution des réglages : opts explicites > subtitle_style.js (boutons Telegram) > constantes en tête
  const style = loadStyle();
  const font = opts.font || (style.font != null ? style.font : FONT); // police : opts > subtitle_style.js (bouton 🔤) > défaut
  const fontSize = opts.fontSize != null ? opts.fontSize : (style.fontSize != null ? style.fontSize : FONT_SIZE);
  const oy = opts.oy != null ? opts.oy : (style.oy != null ? style.oy : OY);
  const letterSpacing = opts.letterSpacing != null ? opts.letterSpacing : (style.letterSpacing != null ? style.letterSpacing : LETTER_SPACING);
  const subsOn = opts.subs != null ? (+opts.subs ? 1 : 0) : (style.subs != null ? style.subs : 1); // sous-titres ON par défaut

  // Réglages fx (style.json) : Image (couleur), Zooms, Musique — surchargeables par opts
  const fx = loadFx();
  const img = Object.assign({}, fx.image, opts.image || {});
  const music = Object.assign({}, fx.music, opts.music || {});
  const zoomCfg = Object.assign({}, fx.zoom, opts.zoomCfg || {});
  if (opts.zoom != null) zoomCfg.base = +opts.zoom; // surcharge directe (la base vit dans style.json zoom.base)
  const colorFilter = buildColorFilter(img);

  const wt = normTimings(wordTimings);

  // Durée : couper la fin qui traîne (réplique l.113-115)
  let duration = +opts.duration || (wt.length ? wt[wt.length - 1].end + 1.5 : 23);
  const speechEnd = wt.reduce((m, w) => Math.max(m, w.end || 0), 0);
  if (speechEnd > 1 && speechEnd < duration) duration = speechEnd + 0.35;

  const chunks = buildChunks(wt);
  const segs = buildSegments(wt, keywords, duration, zoomCfg);
  // Réactions : off (aucune) | natural (1 max, dans une pause, fondu+pitch+jitter) | on (toutes)
  const reactMode = opts.reactionsMode || (fx.reactions && fx.reactions.mode) || 'off';
  let reacts = (reactMode === 'off') ? [] : buildReactions(wt, reactions, duration, reactMode);
  if (reactMode === 'natural') reacts = reacts.slice(0, 1);

  // Fichier .ass (écrit seulement si les sous-titres sont activés)
  const tag = path.basename(output).replace(/[^a-z0-9]/gi, '_');
  const assPath = path.join(os.tmpdir(), 'render_local_' + tag + '.ass');

  // --- Construction du filter_complex ---
  const fc = [];
  // base normalisée 720x1280 30fps
  fc.push(`[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1[base]`);
  // split en autant de segments
  const labels = segs.map((_, i) => `[v${i}]`);
  fc.push(`[base]split=${segs.length}${labels.join('')}`);
  // trim + zoom (scale up + crop centré) par segment
  segs.forEach((s, i) => {
    const zw = even(W * s.scale), zh = even(H * s.scale);
    const cx = Math.round((zw - W) / 2), cy = Math.round((zh - H) / 2);
    fc.push(`[v${i}]trim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},setpts=PTS-STARTPTS,scale=${zw}:${zh},crop=${W}:${H}:${cx}:${cy},setsar=1[c${i}]`);
  });
  // concat des segments
  fc.push(`${segs.map((_, i) => `[c${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[vcc]`);
  // étalonnage couleur AVANT les sous-titres (le texte blanc n'est pas désaturé/teinté)
  if (colorFilter) fc.push(`[vcc]${colorFilter}[vc]`); else fc.push(`[vcc]null[vc]`);
  // sous-titres : burn-in libass si SUBS=1, sinon vidéo propre (pour ajouter les captions dans TikTok)
  if (subsOn) {
    fs.writeFileSync(assPath, buildAss(chunks, { font, fontSize, oy, letterSpacing }));
    fc.push(`[vc]ass=${assPath}[vs]`);
    fc.push(`[vs]format=yuv420p[vout]`);
  } else {
    fc.push(`[vc]format=yuv420p[vout]`);
  }

  // --- Audio : voix + réactions (+ musique de fond) mixées + fades anti-pop ---
  // Si l'input est une IMAGE (look) : pas de piste audio -> on ajoute un silence (anullsrc) comme base.
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(String(input));
  const aBaseIdx = isImage ? 1 : 0;       // index input de la piste audio de base
  const firstReactIdx = isImage ? 2 : 1;  // 1er input réaction
  const musRel = music.file && (path.isAbsolute(music.file) ? music.file : path.join(MUSIC_DIR, music.file));
  const musicOn = !!(+music.on && musRel && fs.existsSync(musRel));
  const fout = Math.max(duration - FADE_OUT, 0);
  // fades anti-pop + normalisation loudness -14 LUFS (standard TikTok)
  const fadeChain = `afade=t=in:ss=0:d=${FADE_IN}` + (duration > 0.4 ? `,afade=t=out:st=${fout.toFixed(3)}:d=${FADE_OUT}` : '') + `,loudnorm=I=-14:TP=-1.5:LRA=11`;
  fc.push(`[${aBaseIdx}:a]atrim=0:${duration.toFixed(3)},asetpts=PTS-STARTPTS[a0]`);
  const aLabels = ['[a0]'];
  reacts.forEach((r, i) => {
    const ms = Math.round(r.st * 1000);
    const vol = (r.vol != null ? r.vol : REACT_VOL);
    const pitch = (r.pitch && Math.abs(r.pitch - 1) > 0.001) ? r.pitch : null;
    const rdur = r.dur || 0.5;
    const fo = Math.max(rdur - 0.08, 0.05).toFixed(3);
    // pitch ±3% sans changer la durée (asetrate puis atempo inverse) + fondu doux 80ms (anti-artefact)
    let chain = '';
    if (pitch) chain += `asetrate=44100*${pitch},aresample=44100,atempo=${(1 / pitch).toFixed(4)},`;
    chain += `afade=t=in:ss=0:d=0.08,afade=t=out:st=${fo}:d=0.08,volume=${vol},adelay=${ms}:all=1`;
    fc.push(`[${firstReactIdx + i}:a]${chain}[r${i}]`);
    aLabels.push(`[r${i}]`);
  });
  if (musicOn) {
    const mi = firstReactIdx + reacts.length; // index de l'input musique
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

  // filter_complex via fichier (évite l'échappement shell)
  const fcPath = path.join(os.tmpdir(), 'render_local_' + tag + '.fc');
  fs.writeFileSync(fcPath, fc.join(';\n'));

  // --- Inputs ffmpeg --- (image -> loop + piste silencieuse)
  const args = ['-y'];
  if (isImage) args.push('-loop', '1', '-t', duration.toFixed(3), '-i', input, '-f', 'lavfi', '-t', duration.toFixed(3), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
  else args.push('-i', input);
  for (const r of reacts) args.push('-i', r.mp3);
  if (musicOn) args.push('-i', musRel);
  args.push(
    '-filter_complex_script', fcPath,
    '-map', '[vout]', '-map', '[aout]',
    '-r', String(FPS),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-t', duration.toFixed(3),
    output
  );

  const styleSrc = (style.fontSize != null || style.oy != null || style.letterSpacing != null || style.zoom != null || style.font != null || style.subs != null) ? 'subtitle_style.js' : 'défauts';
  if (!quiet) {
    console.log(`  render_local: ${segs.length} segments, ${subsOn ? chunks.length + ' sous-titres' : 'SANS sous-titres'}, ${reacts.length} réaction(s), durée ${duration.toFixed(2)}s`);
    console.log(`  style (${styleSrc}) : police "${font}", taille ${fontSize}px, OY ${oy}, spacing ${letterSpacing}px, subs ${subsOn ? 'ON' : 'OFF'}`);
    console.log(`  zoom ${zoomCfg.on ? 'ON x' + (zoomCfg.intensity) + ' ' + zoomCfg.duration + 's 1/' + zoomCfg.everyN + ' base ' + zoomCfg.base : 'OFF'} | couleur ${colorFilter || 'neutre'} | musique ${musicOn ? path.basename(musRel) + ' @' + music.volume : 'OFF'}`);
    reacts.forEach(r => console.log(`  reaction ${r.type} @${r.st.toFixed(2)}s`));
  }

  execFileSync(FFMPEG, args, { stdio: quiet ? 'ignore' : ['ignore', 'inherit', 'inherit'] });
  return { output, duration, segments: segs.length, subtitles: subsOn ? chunks.length : 0, reactions: reacts.length, assPath: subsOn ? assPath : null,
    style: { font, fontSize, oy, letterSpacing, baseZoom: zoomCfg.base, subs: subsOn, source: styleSrc },
    fx: { image: img, zoom: zoomCfg, music: { on: musicOn ? 1 : 0, file: musicOn ? path.basename(musRel) : '', volume: music.volume } } };
}

module.exports = { renderLocal, buildChunks, buildSegments, buildReactions, buildAss, normTimings, secToAss, loadFx, buildColorFilter, FX_DEFAULT, MUSIC_DIR };

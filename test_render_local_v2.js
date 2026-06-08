// test_render_local_v2.js — vérifie le moteur de rendu v2 SANS ffmpeg ni média.
//
//   node test_render_local_v2.js
//
// Utilise renderLocalV2({ dryRun:true }) : construit le plan ffmpeg complet
// (args + filter_complex + .ass) et contrôle des invariants du rendu validé
// (cadre 720x1280, concat des segments, étalonnage couleur AVANT les sous-titres,
// loudnorm -14 LUFS, bt709, aucune sortie écrite). Le vrai rendu tourne sur le Mac.

const assert = require('assert');
const fs = require('fs');
const { renderLocalV2 } = require('./render_local_v2');

const wt = [
  { text: 'today', start: 0.0, end: 0.4 },
  { text: 'i', start: 0.4, end: 0.5 },
  { text: 'learned', start: 0.5, end: 1.0 },
  { text: 'something', start: 1.1, end: 1.7 },
  { text: 'incredible', start: 1.8, end: 2.6 },
  { text: 'about', start: 2.7, end: 3.0 },
  { text: 'space', start: 3.1, end: 3.6 },
];

(async () => {
  const out = '/tmp/__rlv2_test_out.mp4';
  try { fs.existsSync(out) && fs.unlinkSync(out); } catch (e) {}

  const plan = await renderLocalV2({
    input: '/tmp/__inexistant__.mp4',   // ignoré en dryRun
    wordTimings: wt,
    keywords: ['INCREDIBLE', 'SPACE'],
    output: out,
    dryRun: true,
    quiet: true,
  });

  const fc = plan.filterComplex;
  const args = plan.args.join(' ');

  assert.strictEqual(plan.dryRun, true, 'dryRun doit être true');
  assert.ok(!fs.existsSync(out), 'dryRun ne doit RIEN écrire');
  assert.ok(/scale=720:1280:.*crop=720:1280,fps=30/.test(fc), 'cadre 720x1280 @30fps manquant');
  assert.ok(/concat=n=\d+:v=1:a=0\[vcc\]/.test(fc), 'concat des segments manquant');
  // couleur AVANT sous-titres : [vcc]...[vc] puis [vc]ass=...[vs]
  assert.ok(fc.indexOf('[vcc]') < fc.indexOf('ass='), 'la couleur doit précéder les sous-titres');
  assert.ok(/loudnorm=I=-14:TP=-1\.5:LRA=11/.test(fc), 'loudnorm -14 LUFS manquant');
  assert.ok(/-colorspace bt709 -color_primaries bt709 -color_trc bt709/.test(args), 'étiquette bt709 manquante');
  assert.ok(/-c:v libx264/.test(args) && /-c:a aac/.test(args), 'codecs h264/aac manquants');
  assert.ok(plan.assText && /Style: Main,Archivo Black/.test(plan.assText), 'style ASS Archivo Black manquant');
  assert.ok(plan.segments >= 1 && plan.subtitles >= 1, 'segments/sous-titres attendus');

  // SANS sous-titres : pas d'ass dans le graphe
  const plan2 = await renderLocalV2({ input: 'x.mp4', wordTimings: wt, output: out, subs: 0, dryRun: true, quiet: true });
  assert.ok(!/ass=/.test(plan2.filterComplex), 'subs=0 ne doit pas burn-in les sous-titres');

  // Image en entrée -> input lavfi silencieux ajouté
  const planImg = await renderLocalV2({ input: 'look.png', wordTimings: wt, output: out, dryRun: true, quiet: true });
  assert.ok(/anullsrc/.test(planImg.args.join(' ')), 'entrée image -> piste silence anullsrc attendue');

  console.log('✅ test_render_local_v2 : tous les invariants OK (dryRun, sans ffmpeg)');
  console.log(`   segments=${plan.segments} sous-titres=${plan.subtitles} durée=${plan.duration.toFixed(2)}s`);
})().catch(e => { console.error('❌ ÉCHEC:', e.message); process.exit(1); });

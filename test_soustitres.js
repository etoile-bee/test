// ============================================================
//  TEST SOUS-TITRES — rendu Shotstack GRATUIT (sandbox)
//  Objectif : reproduire EXACTEMENT le style de 12h37 p1
//  Police Archivo Black (≈ Arial Black) CHARGEE PAR URL => identique partout.
//
//  >>> REGLAGES : tout est dans subtitle_style.js (source unique prod+test) <<< /*substyle v1*/
const { FONT_SIZE, OY, styleHtml, FONTS, WIDTH, HEIGHT } = require('./subtitle_style.js');
//  Mots d'exemple — respectent la regle prod : 2 mots MAX, mot seul si 8 lettres ou plus
const SAMPLE    = ['YOU IGNORED', 'THE RED', 'FLAGS BUT', 'SCREAMING', 'DEEP DOWN', 'YOU KNEW'];
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const MODE = (process.argv[3] === 'prod') ? 'v1' : 'stage';
const KEY  = process.env.SHOTSTACK_SANDBOX_KEY || process.env.SHOTSTACK_API_KEY;
if (!KEY) { console.error('Pas de cle Shotstack dans .env'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

// styleHtml vient de subtitle_style.js — strictement identique a la prod /*substyle v1*/

(async () => {
  let raw = process.argv[2];
  if (!raw) {
    const outDir = path.join(os.homedir(), 'podcast-workflow', 'outputs');
    const files = fs.readdirSync(outDir)
      .filter(f => /raw.*\.mp4$/i.test(f))
      .map(f => ({ f, t: fs.statSync(path.join(outDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    if (!files.length) { console.error('Aucun raw lipsync dans outputs/'); process.exit(1); }
    raw = path.join(outDir, files[0].f);
  }
  if (!fs.existsSync(raw)) { console.error('Fichier introuvable: ' + raw); process.exit(1); }
  console.log('Raw utilise :', path.basename(raw));
  console.log('Mode        :', MODE === 'stage' ? 'SANDBOX (gratuit, filigrane)' : 'PRODUCTION (payant)');
  console.log('Police      : Arial Black (style prod subref v2) | FONT_SIZE=' + FONT_SIZE + ' | OY=' + OY);

  let dur = 12;
  try { dur = parseFloat(execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "' + raw + '"').toString().trim()) || 12; } catch(e){}

  console.log('Upload du raw...');
  const rawUp = execSync('curl -s -F "file=@' + raw + '" https://tmpfiles.org/api/v1/upload').toString().trim();
  let url;
  try { url = JSON.parse(rawUp).data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/'); }
  catch(e){ console.error('Upload echoue:', rawUp.slice(0,270)); process.exit(1); } /*fix: 0.270 → 0,270*/
  console.log('OK ->', url);

  const seg = Math.max(dur / SAMPLE.length, 1.5);
  const subClips = SAMPLE.map((txt, i) => ({
    asset: { type: 'html', html: styleHtml(txt), width: WIDTH, height: HEIGHT, background: 'transparent' },
    start: +(i * seg).toFixed(2),
    length: +seg.toFixed(2),
    position: 'bottom',
    offset: { x: 0, y: OY }
  }));

  const edit = {
    timeline: { // /*substyle v4*/ police embarquee, comme la prod
      fonts: FONTS,
      background: '#000000',
      tracks: [
        { clips: subClips },
        { clips: [{ asset: { type: 'video', src: url }, start: 0, length: +dur.toFixed(2) }] }
      ]
    },
    output: { format: 'mp4', resolution: 'hd', aspectRatio: '9:16', fps: 30 }
  };

  const base = 'https://api.shotstack.io/edit/' + MODE;
  console.log('Envoi du rendu (' + MODE + ')...');
  const r = await fetch(base + '/render', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify(edit) });
  const d = await r.json();
  if (!d.success) {
    console.error('Shotstack a refuse:', JSON.stringify(d).slice(0, 300));
    process.exit(1);
  }
  const id = d.response.id;
  let out = null;
  for (let i = 0; i < 60; i++) {
    await sleep(4000);
    const p = await fetch(base + '/render/' + id, { headers: { 'x-api-key': KEY } });
    const s = await p.json();
    process.stdout.write('  [' + s.response.status + ' ' + (i * 4) + 's]\r');
    if (s.response.status === 'done') { out = s.response.url; break; }
    if (s.response.status === 'failed') { console.error('\nRendu echoue'); process.exit(1); }
  }
  if (!out) { console.error('\nTimeout'); process.exit(1); }
  console.log('\nRendu OK:', out);

  const dest = path.join(os.homedir(), 'podcast-workflow', 'outputs', 'TEST_soustitres.mp4');
  execSync('curl -s -o "' + dest + '" "' + out + '"');
  /*coloradapt v2 : meme passe couleur que la prod (source unique color_style.js) → le test montre la VRAIE teinte finale*/
  try{
    const COLOR=require('./color_style.js');
    const vf=COLOR.buildVf(dest);
    const tmp=dest.replace(/\.mp4$/,'_c.mp4');
    execSync('ffmpeg -y -i "'+dest+'" -vf "'+vf+'"'+COLOR.ENCODE+'-c:a aac -b:a 192k "'+tmp+'" 2>/dev/null');
    if(fs.existsSync(tmp)&&fs.statSync(tmp).size>10000){fs.renameSync(tmp,dest);console.log('Passe couleur V5 appliquee (comme la prod).');}
  }catch(e){console.log('(passe couleur ignoree: '+e.message+')');}
  console.log('Sauve :', dest);
  try { execSync('open "' + dest + '"'); } catch(e){}
  console.log('\nPour ajuster : change FONT_SIZE / OY en haut du fichier, relance. GRATUIT.');
})();

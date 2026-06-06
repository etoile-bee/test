// ============================================================
//  TEST SOUS-TITRES — rendu Shotstack GRATUIT (sandbox)
//  Objectif : reproduire EXACTEMENT le style de 12h37 p1
//  Police Archivo Black (≈ Arial Black) CHARGEE PAR URL => identique partout.
//
//  >>> LES 2 SEULS CHIFFRES A REGLER <<<
const FONT_SIZE = 52;     // taille du texte (plus grand = plus gros)   /*sync subref v2*/
const OY        = 0.347;  // hauteur (plus grand = plus haut)           /*sync subpos5*/
//  (optionnels)
const LETTER    = '2px';  // espacement entre lettres                   /*sync subref v2*/
//  Mots d'exemple affiches successivement :
const SAMPLE    = ['YOU IGNORED', 'THE RED FLAGS', 'BUT DEEP DOWN', 'YOU KNEW'];
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

// /*sync subref v2*/ : HTML strictement identique a workflow.js (renderVideo), seuls FONT_SIZE/OY/LETTER varient
function styleHtml(text){
  return '<p style="font-family:Arial Black,Arial,sans-serif;font-size:' + FONT_SIZE +
    'px;font-weight:900;letter-spacing:' + LETTER +
    ';color:#FFFFFF;-webkit-text-stroke:1.3px #FFFFFF;text-shadow:0 2px 7px rgba(0,0,0,0.55),0 0 3px rgba(0,0,0,0.45);margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;">' + text + '</p>';
}

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
    asset: { type: 'html', html: styleHtml(txt), width: 720, height: 175, background: 'transparent' },
    start: +(i * seg).toFixed(2),
    length: +seg.toFixed(2),
    position: 'bottom',
    offset: { x: 0, y: OY }
  }));

  const edit = {
    timeline: { // /*sync subref v2*/ plus de fonts[] : la prod n'en charge pas, le test doit faire pareil
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
  console.log('Sauve :', dest);
  try { execSync('open "' + dest + '"'); } catch(e){}
  console.log('\nPour ajuster : change FONT_SIZE / OY en haut du fichier, relance. GRATUIT.');
})();

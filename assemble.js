// ============================================================
//  ASSEMBLAGE 3 PARTS → 1 VIDEO LONGUE /*assemble v1*/
//  Usage : node assemble.js [horodatage]   (sans argument = dernier trio complet)
//  Concatene outputs/<ts>_p1.mp4 + _p2 + _p3 (ou p1+p2 si pas de p3) → <ts>_FULL.mp4
//  Reencode propre (qualite et etiquette couleur identiques a la prod).
// ============================================================
require('dotenv').config();
const fs=require('fs'),path=require('path'),os=require('os');
const {execSync}=require('child_process');
const BASE=__dirname;
function outputsDir(){try{return fs.realpathSync(path.join(BASE,'outputs'));}catch(e){return path.join(BASE,'outputs');}}

function findTrio(ts){
  const dir=outputsDir();
  let all;try{all=fs.readdirSync(dir);}catch(e){return null;}
  if(!ts){
    // dernier prefixe ayant au moins p1 et p2
    const pref=[...new Set(all.filter(f=>/_p1\.mp4$/.test(f)).map(f=>f.replace(/_p1\.mp4$/,'')))]
      .filter(p=>all.includes(p+'_p2.mp4'))
      .map(p=>({p,t:fs.statSync(path.join(dir,p+'_p1.mp4')).mtimeMs}))
      .sort((a,b)=>b.t-a.t);
    if(!pref.length)return null;
    ts=pref[0].p;
  }
  const parts=['_p1.mp4','_p2.mp4','_p3.mp4'].map(s=>path.join(dir,ts+s)).filter(f=>fs.existsSync(f));
  return parts.length>=2?{ts:ts,parts:parts}:null;
}

function assemble(ts){
  const trio=findTrio(ts);
  if(!trio)throw new Error('aucun trio/duo de parts trouve'+(ts?' pour '+ts:''));
  const dir=outputsDir();
  const out=path.join(dir,trio.ts+'_FULL.mp4');
  const list='/tmp/assemble_'+Date.now()+'.txt';
  fs.writeFileSync(list,trio.parts.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n'));
  console.log('Assemblage de '+trio.parts.length+' parts ('+trio.ts+')...');
  execSync('ffmpeg -y -f concat -safe 0 -i "'+list+'" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k "'+out+'" 2>/dev/null');
  try{fs.unlinkSync(list);}catch(e){}
  if(!fs.existsSync(out)||fs.statSync(out).size<100000)throw new Error('assemblage echoue');
  const dur=parseFloat(execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "'+out+'"').toString().trim());
  console.log('OK: '+out+' ('+dur.toFixed(1)+'s)');
  return{file:out,duration:dur,parts:trio.parts.length};
}

if(require.main===module){
  try{assemble(process.argv[2]||null);}catch(e){console.error('❌ '+e.message);process.exit(1);}
}
module.exports={assemble,findTrio};

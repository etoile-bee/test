// [PREUVE RÉELLE sous-titres] produit de VRAIS clips ffmpeg (local, gratuit) :
//   #1 inversion corrigée : clip POSITION HAUT vs BAS (même source) -> le texte est PLUS HAUT en « Haut ».
//   #2 préréglage Etoile : Archivo Black 76, OY 0.370, chunking 1-2 mots (mot>7 seul) sur une vraie source projet.
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const RL=require('../render_local'); // buildAss + buildChunks RÉELS (mêmes que le bot)
const OUT=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-subproof-'));
const SRC=path.resolve(__dirname,'..','looks','gen_2026-06-07-20-16_p1.jpg');
function clip(assText, out){ const ass=path.join(OUT,'s.ass'); fs.writeFileSync(ass,assText);
  cp.execFileSync('ffmpeg',['-y','-loop','1','-i',SRC,'-t','3.4',
    '-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,ass='+ass+',format=yuv420p',
    '-r','25','-c:v','libx264','-preset','veryfast','-movflags','+faststart',out],{stdio:'ignore'});
  // extrait une frame représentative
  const png=out.replace(/\.mp4$/,'.png'); cp.execFileSync('ffmpeg',['-y','-i',out,'-vf','select=eq(n\\,40)','-vframes','1',png],{stdio:'ignore'});
  return {out,png};
}
const opt=(oy)=>({font:'Archivo Black',fontSize:76,oy:oy,alignment:2,color:'&H00FFFFFF',letterSpacing:2}); // alignement BAS constant (#1)
// #1 — HAUT (oy 0.78) vs BAS (oy 0.27), même phrase
const r1h=clip(RL.buildAss([{text:'POSITION HAUT',start:0,length:99}],opt(0.78)),path.join(OUT,'pos_HAUT.mp4'));
const r1b=clip(RL.buildAss([{text:'POSITION BAS',start:0,length:99}],opt(0.27)),path.join(OUT,'pos_BAS.mp4'));
// #2 — préréglage Etoile + chunking réel sur une phrase
const phrase='Ne cours jamais après quelqu un qui doute de toi'.split(' ');
let t=0; const wt=phrase.map(w=>{ const s=t; t+=0.42; return {text:w,start:s,end:t-0.04}; });
const chunks=RL.buildChunks(wt);
const r2=clip(RL.buildAss(chunks,opt(0.370)),path.join(OUT,'preset_Etoile.mp4'));
console.log('SRC='+SRC+' existe='+fs.existsSync(SRC));
console.log('CHUNKS='+JSON.stringify(chunks.map(c=>c.text)));
console.log('OUT_DIR='+OUT);
['pos_HAUT.mp4','pos_BAS.mp4','preset_Etoile.mp4'].forEach(f=>{ const p=path.join(OUT,f); console.log(f+' '+(fs.existsSync(p)?(Math.round(fs.statSync(p).size/1024)+'KB'):'MANQUANT')); });

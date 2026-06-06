const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*aspect v1*/')){console.error('Deja patche.');process.exit(1);}
const A="  execSync('ffmpeg -y -i \"'+i+'\" -vf scale=720:1280,unsharp=5:5:1.5:5:5:0.0 -q:v 2 \"'+o+'\" 2>/dev/null');";
const B="  execSync('ffmpeg -y -i \"'+i+'\" -vf scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,unsharp=5:5:1.5:5:5:0.0 -q:v 2 \"'+o+'\" 2>/dev/null'); /*aspect v1*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preaspect');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch anti-etirement applique (photo en ratio preserve + recadrage, plus de visage elargi).');

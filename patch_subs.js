const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('font-size:44px')){console.error('Deja patche.');process.exit(1);}
const A='font-family:Arial Black,sans-serif;font-size:34px;font-weight:900;color:#FFFFFF;text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 12px rgba(255,255,255,0.7);margin:0;padding:5px 20px;text-align:center;text-transform:uppercase;';
const B='font-family:Arial Black,sans-serif;font-size:44px;font-weight:900;color:#FFFFFF;-webkit-text-stroke:3px #000;text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 3px 6px rgba(0,0,0,0.9);margin:0;padding:5px 20px;text-align:center;text-transform:uppercase;';
// la hauteur du bloc doit suivre la taille plus grosse
const A2="background:'transparent'},\n    start:c.start,length:c.length,position:'bottom',offset:{x:0,y:0.30}";
const B2="background:'transparent'},\n    start:c.start,length:c.length,position:'bottom',offset:{x:0,y:0.30}";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
// agrandir la height du cadre pour le texte plus gros (80 -> 110)
const H="width:1080,height:80,background:'transparent'";
const Hn="width:1080,height:110,background:'transparent'";
const ch=src.split(H).length-1;
if(ch===1)src=src.split(H).join(Hn);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubs');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch sous-titres applique.');

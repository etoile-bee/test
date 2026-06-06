const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*sticker v4*/')){console.error('Deja patche.');process.exit(1);}
// nouveau style : plus gros (52px), contour epais arrondi facon sticker (paint-order stroke + 8px), ombre nette
const A="'<p style=\"font-family:Arial Black,sans-serif;font-size:40px;font-weight:900;color:#FFFFFF;-webkit-text-stroke:3px #000;text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 3px 6px rgba(0,0,0,0.9);margin:0;padding:5px 20px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'";
const B="'<p style=\"font-family:Arial Black,sans-serif;font-size:52px;font-weight:900;color:#FFFFFF;-webkit-text-stroke:8px #000;paint-order:stroke fill;text-shadow:0 4px 8px rgba(0,0,0,0.95),0 0 3px rgba(0,0,0,0.9);margin:0;padding:8px 24px;text-align:center;text-transform:uppercase;letter-spacing:1px;\">'+c.text+'</p>'/*sticker v4*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+'. Annule.');process.exit(1);}
src=src.split(A).join(B);
// hauteur cadre 110 -> 140 pour le texte plus gros
const H="width:1080,height:110,background:'transparent'";
const Hn="width:1080,height:140,background:'transparent'";
const ch=src.split(H).length-1;
if(ch===1)src=src.split(H).join(Hn);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prestick');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch sticker v4 applique.');

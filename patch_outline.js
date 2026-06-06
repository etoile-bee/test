const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*outline v5*/')){console.error('Deja patche.');process.exit(1);}
// Shotstack ignore -webkit-text-stroke et paint-order. On revient a un contour fiable
// via text-shadow multi-directions (8 dirs a 3px = contour epais net) + ombre douce. Sans letter-spacing.
const A="'<p style=\"font-family:Arial Black,sans-serif;font-size:52px;font-weight:900;color:#FFFFFF;-webkit-text-stroke:8px #000;paint-order:stroke fill;text-shadow:0 4px 8px rgba(0,0,0,0.95),0 0 3px rgba(0,0,0,0.9);margin:0;padding:8px 24px;text-align:center;text-transform:uppercase;letter-spacing:1px;\">'+c.text+'</p>'/*sticker v4*/";
const B="'<p style=\"font-family:Arial Black,sans-serif;font-size:46px;font-weight:900;color:#FFFFFF;text-shadow:-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000,3px 3px 0 #000,0 -3px 0 #000,0 3px 0 #000,-3px 0 0 #000,3px 0 0 #000,0 4px 7px rgba(0,0,0,0.85);margin:0;padding:6px 22px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*outline v5*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preoutline');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch outline v5 applique.');

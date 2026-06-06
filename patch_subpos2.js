const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*subpos2*/')){console.error('Deja patche.');process.exit(1);}
const A="    var _oy=Math.max(0.20-(_sc-1)*0.22,0.06); // plus le zoom est fort, plus le texte descend (reste sous le menton)";
const B="    var _oy=Math.max(0.40-(_sc-1)*0.16,0.24); /*subpos2*/ // bande menton-haut du micro, centre ; descend un peu si zoom";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubpos2');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch position v2 (sous-titres remontes dans la bande menton-micro) applique.');

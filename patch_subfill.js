const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*subfill v1*/')){console.error('Deja patche.');process.exit(1);}
const A="    if(after&&end>after.start-GAP)end=after.start-GAP; // coupe net avant le groupe suivant";
const B="    if(after)end=after.start-GAP; /*subfill v1*/ // chaque sous-titre reste jusqu'au suivant : plus de trous pendant les pauses";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubfill');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch sous-titres continus (plus de trous pendant les pauses) applique.');

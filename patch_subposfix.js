const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*subposfix*/')){console.error('Deja patche.');process.exit(1);}
const A1="    var _oy=Math.max(0.40-(_sc-1)*0.16,0.24); /*subpos2*/ // bande menton-haut du micro, centre ; descend un peu si zoom";
const A2="    var _oy=Math.max(0.20-(_sc-1)*0.22,0.06); // plus le zoom est fort, plus le texte descend (reste sous le menton)";
const B="    var _oy=0.40; /*subposfix*/ // position 100% FIXE, identique tout le temps (bande menton-micro, centre)";
const c1=src.split(A1).length-1, c2=src.split(A2).length-1;
if(c1+c2!==1){console.error('Ancre introuvable ou ambigue (c1='+c1+', c2='+c2+'). Annule, rien ecrit.');process.exit(1);}
src=c1===1?src.split(A1).join(B):src.split(A2).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubposfix');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch position 100% fixe applique (sous-titres au meme endroit tout le temps).');

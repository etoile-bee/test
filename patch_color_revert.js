const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*color revert*/')){console.error('Deja patche.');process.exit(1);}
const A="    const _vf='eq=brightness=-0.05:saturation=0.90,colorbalance=rm=-0.07:gm=-0.02:bm=0.12';";
const B="    const _vf='eq=brightness=0:saturation=1'; /*color revert*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre couleur = '+c+' (attendu 1). Rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}catch(e){console.error('Syntaxe KO');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.precolrev');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch couleur annulee (retour couleur origine, anti-pop garde) applique.');

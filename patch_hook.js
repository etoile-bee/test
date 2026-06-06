const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('THE HOOK (max 8 words)')){console.error('Deja patche.');process.exit(1);}
// On renforce uniquement la regle du hook (1re phrase). Pas d'apostrophe ni de guillemet dans le remplacement.
const A="First sentence = shocking question or brutal truth (max 8 words, stops the scroll)";
const B="First sentence = THE HOOK (max 8 words). It MUST stop the scroll in under 1 second. Pick whatever is most viral for THIS topic: a shocking question, a brutal accusation, a forbidden secret, a bold contrarian claim, or a callout that makes her feel seen. Create an instant curiosity gap or emotional punch. No greeting, no warmup, no setup. Make it impossible to scroll past";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prehook');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch hook viral applique.');

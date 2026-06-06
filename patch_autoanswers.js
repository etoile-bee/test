const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// autoAnswers déjà défini')){console.error('❌ Déjà patché. Annulé.');process.exit(1);}
const A="  autoAnswers=['NO','NO']; // Change photo? NO, Change duration? NO";
const B="  if(!autoAnswers||autoAnswers.length===0){ autoAnswers=['NO','NO']; } // autoAnswers déjà défini par l'appelant ? on le garde";
const c=src.split(A).length-1;
if(c!==1){console.error('❌ Ancre = '+c+' (attendu 1). Annulé.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preanswers');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch autoAnswers appliqué. Sauvegarde : '+FILE+'.preanswers');

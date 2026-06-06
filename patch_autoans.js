const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*parts demandees a la main*/')){console.error('Deja patche.');process.exit(1);}
const A="autoAnswers=['NO','NO','YES','YES','YES','YES'];";
const B="autoAnswers=['NO','NO','YES','YES'];/*parts demandees a la main*/";
const c=src.split(A).length-1;
if(c<1){console.error('Ancre autoAnswers = '+c+' (attendu >=1). Annule.');process.exit(1);}
// remplace TOUTES les occurrences
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preautoans');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch autoAnswers reduit applique ('+c+' occurrence(s)).');

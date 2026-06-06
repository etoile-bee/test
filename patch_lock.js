const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*lock v1*/')){console.error('Deja patche.');process.exit(1);}
const A="function launch(){\n  if(setup.photo)setAvatar(setup.photo);";
const B="function launch(){\n  if(proc){try{send('⏳ Une génération est déjà en cours — je ne relance pas (anti-doublon). Attends la fin, ou /stop.').catch(()=>{});}catch(e){} return;} /*lock v1*/\n  try{require('child_process').execSync('pkill -f \"node.*workflow.js\" 2>/dev/null');}catch(e){}\n  if(setup.photo)setAvatar(setup.photo);";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prelock');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch verrou anti-boucle applique.');

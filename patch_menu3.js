const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*menu v4*/')){console.error('Deja patche.');process.exit(1);}
const A="  if(txt==='/go'||txt==='go'){await send('Comment générer cette vidéo ?',[[{text:'▶️ START',callback_data:'MANUAL_GO'},{text:'🤖 AUTO',callback_data:'AUTO_ALL'}]]);return;} /*menu v3*/";
const B="  if(txt==='/go'||txt==='go'){await send('Comment générer cette vidéo ?',[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}]]);return;} /*menu v4*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.premenu3');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch menu v4 (Sur-mesure a gauche, Aleatoire a droite) applique.');

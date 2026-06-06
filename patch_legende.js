const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*legende v2*/')){console.error('Deja patche.');process.exit(1);}
const A="if(sh)await send('📋 <b>Legende courte + hashtags :</b>\\n\\n'+sh+'\\n\\n'+tg2).catch(()=>{});if(lo)await send('📋 <b>Legende longue + hashtags :</b>\\n\\n'+lo+'\\n\\n'+tg2).catch(()=>{});";
const B="/*legende v2*/if(sh){await send('📋 Legende COURTE — copie le message juste en dessous 👇').catch(()=>{});await send(sh+'\\n\\n'+tg2).catch(()=>{});}if(lo){await send('📋 Legende LONGUE — copie le message juste en dessous 👇').catch(()=>{});await send(lo+'\\n\\n'+tg2).catch(()=>{});}";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prelegende');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch legendes (titre separe, texte copiable seul) applique.');

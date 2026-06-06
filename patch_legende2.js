const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*legende v3*/')){console.error('Deja patche.');process.exit(1);}
const A="                try{const c=fs.readFileSync(txtPath,'utf8');const gm=(re)=>{const m=c.match(re);return m?m[1].trim():'';};const sh=gm(/SHORT:\\s*([\\s\\S]*?)\\n\\nLONG:/);const lo=gm(/LONG:\\s*([\\s\\S]*?)\\n\\nHASHTAGS:/);const tg2=gm(/HASHTAGS:\\s*([\\s\\S]*)$/);/*legende v2*/if(sh){await send('📋 Legende COURTE — copie le message juste en dessous 👇').catch(()=>{});await send(sh+'\\n\\n'+tg2).catch(()=>{});}if(lo){await send('📋 Legende LONGUE — copie le message juste en dessous 👇').catch(()=>{});await send(lo+'\\n\\n'+tg2).catch(()=>{});}}catch(e){}";
const B="                try{const c=fs.readFileSync(txtPath,'utf8');const _nd=function(s){return (s||'').replace(/[\\u2014\\u2013]/g,' ').replace(/(^|\\s)-+(?=\\s|$)/g,'$1').replace(/\\s{2,}/g,' ').trim();};const gm=(re)=>{const m=c.match(re);return m?m[1].trim():'';};const sh=_nd(gm(/SHORT:\\s*([\\s\\S]*?)\\n\\nLONG:/));const lo=_nd(gm(/LONG:\\s*([\\s\\S]*?)\\n\\nHASHTAGS:/));const tg2=gm(/HASHTAGS:\\s*([\\s\\S]*)$/);/*legende v3*/if(sh){await send('📋 Legende COURTE — copie le message juste en dessous 👇').catch(()=>{});await send(sh+'\\n\\n'+tg2).catch(()=>{});}if(lo){await send('📋 Legende LONGUE — copie le message juste en dessous 👇').catch(()=>{});await send(lo+'\\n\\n'+tg2).catch(()=>{});}}catch(e){}";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prelegv3');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch legendes v3 (tirets enleves dans les legendes a copier) applique.');

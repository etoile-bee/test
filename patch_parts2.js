const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// parties manuelles (buffer')){console.error('Deja patche.');process.exit(1);}
// Bloc 2 (buffer non termine) : surface les boutons de partie MEME en auto.
// Ancre = le bloc unterminated qui utilise send() SANS await (≠ Bloc 1 qui a 'await send').
const A="      }else if(!isAuto){\n        state='question';\n        send('❓ '+line,getQButtons(line)).catch(()=>{});\n      }";
const B="      }else if(!isAuto||/make 2 more|make part 2|continue to part 3|make part 3/i.test(line)){\n        // parties manuelles (buffer non termine) : boutons meme en auto\n        state='question';\n        send('❓ '+line,getQButtons(line)).catch(()=>{});\n      }";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preparts2');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch parties-buffer applique.');

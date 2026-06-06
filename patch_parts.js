const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// parties manuelles')){console.error('Deja patche.');process.exit(1);}
// Dans le bloc de reponse aux questions : si autoAnswers vide ET question de partie,
// afficher les boutons MEME en isAuto (sinon l'utilisateur ne voit jamais le choix)
const A="        }else if(!isAuto){\n          state='question';\n          await send('❓ '+line,getQButtons(line)).catch(()=>{});\n        }";
const B="        }else if(!isAuto||/make 2 more|make part 2|continue to part 3|make part 3/i.test(line)){\n          // parties manuelles : on demande a l'utilisateur (boutons), meme en auto\n          state='question';\n          await send('❓ '+line,getQButtons(line)).catch(()=>{});\n        }";
const c=src.split(A).length-1;
if(c<1){console.error('Ancre = '+c+'. Annule.');process.exit(1);}
src=src.replace(A,B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preparts');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch parties-manuelles applique.');

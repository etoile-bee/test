const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// repond aux questions meme en auto')){console.error('Deja patche.');process.exit(1);}
// Bloc 1 : questions sur ligne complete
const A1="      // Questions\n      if(!isAuto&&TRIG.some(t=>line.includes(t))){\n        if(autoAnswers.length>0){\n          const ans=autoAnswers.shift();\n          setTimeout(()=>wfInput(ans),400);\n        }else{\n          state='question';\n          if(!autoAnswers.length)await send('❓ '+line,getQButtons(line)).catch(()=>{});\n        }\n      }";
const B1="      // Questions // repond aux questions meme en auto\n      if(TRIG.some(t=>line.includes(t))){\n        if(autoAnswers.length>0){\n          const ans=autoAnswers.shift();\n          setTimeout(()=>wfInput(ans),400);\n        }else if(!isAuto){\n          state='question';\n          await send('❓ '+line,getQButtons(line)).catch(()=>{});\n        }\n      }";
// Bloc 2 : buffer non termine
const A2="    if(!isAuto&&buf.trim()&&TRIG.some(t=>buf.includes(t))){\n      const line=buf.trim();buf='';\n      if(autoAnswers.length>0){\n        const ans=autoAnswers.shift();\n        setTimeout(()=>wfInput(ans),400);\n      }else{\n        state='question';\n        send('❓ '+line,getQButtons(line)).catch(()=>{});\n      }\n    }";
const B2="    if(buf.trim()&&TRIG.some(t=>buf.includes(t))){\n      const line=buf.trim();buf='';\n      if(autoAnswers.length>0){\n        const ans=autoAnswers.shift();\n        setTimeout(()=>wfInput(ans),400);\n      }else if(!isAuto){\n        state='question';\n        send('❓ '+line,getQButtons(line)).catch(()=>{});\n      }\n    }";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1');rep(A2,B2,'2');
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preanswer');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch answer applique.');

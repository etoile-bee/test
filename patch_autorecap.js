const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*auto recap v1*/')){console.error('Deja patche.');process.exit(1);}
const A="        setup.approvedScript=script;\n        await send('Topic: '+setup.topic+'\\n\\nScript:\\n\\n'+script,[\n          [{text:'Generate Video',callback_data:'SCRIPT_OK'},{text:'Regenerate',callback_data:'AUTO_ALL'},{text:'Cancel',callback_data:'CANCEL'}]\n        ]);\n      }catch(e){await send('Error: '+e.message);state='idle';}\n      return;";
const B="        setup.script=script; /*auto recap v1*/\n        await mRecap();\n      }catch(e){await send('Error: '+e.message);state='idle';}\n      return;";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preautorecap');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch AUTO -> recap complet (Valider/Refaire/EDIT) applique.');

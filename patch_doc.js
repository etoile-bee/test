const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// envoi legende txt')){console.error('Deja patche.');process.exit(1);}
// On insere l'envoi du .txt juste apres sendVid(vp).catch(...)
const A="            await sendVid(vp).catch(async()=>{\n              await send('⚠️ Vidéo trop lourde pour Telegram — voir iCloud → podcast-outputs').catch(()=>{});\n            });";
const B="            await sendVid(vp).catch(async()=>{\n              await send('⚠️ Vidéo trop lourde pour Telegram — voir iCloud → podcast-outputs').catch(()=>{});\n            });\n            // envoi legende txt : le fichier .txt a le meme chemin que le .mp4\n            try{\n              const txtPath=vp.replace(/\\.mp4$/,'.txt');\n              if(fs.existsSync(txtPath)){\n                const FormData=require('form-data');\n                const fd=new FormData();\n                fd.append('chat_id',CHAT_ID);\n                fd.append('document',fs.createReadStream(txtPath));\n                fd.append('caption','📝 Légende + script (à copier pour TikTok)');\n                await tg('sendDocument',null,fd).catch(()=>{});\n                // aussi le contenu directement dans le chat pour copie rapide\n                try{const c=fs.readFileSync(txtPath,'utf8');if(c.trim())await send('📋 <b>À copier :</b>\\n\\n'+c).catch(()=>{});}catch(e){}\n              }\n            }catch(e){}";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre doc = '+c+'. Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.predoc');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch envoi-txt applique.');

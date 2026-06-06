const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// === aussi la video en FICHIER')){console.error('Deja patche.');process.exit(1);}
// EDIT 1 : apres sendVid, envoyer aussi la video en fichier + generer la miniature (qlmanage macOS)
const A1="            });\n            // envoi legende txt : le fichier .txt a le meme chemin que le .mp4";
const B1="            });\n            // === aussi la video en FICHIER (Enregistrer dans Fichiers)\n            try{const FormData=require('form-data');const fdv=new FormData();fdv.append('chat_id',CHAT_ID);fdv.append('document',fs.createReadStream(vp));fdv.append('caption','🎬 Vidéo en fichier');await tg('sendDocument',null,fdv).catch(()=>{});}catch(e){}\n            // === miniature : extraire une frame de la video via qlmanage (macOS)\n            let thumbPath=null;\n            try{const cp=require('child_process');const pth=require('path');cp.execSync('qlmanage -t -s 320 -o \"/tmp\" \"'+vp+'\" 2>/dev/null',{stdio:'ignore'});const png='/tmp/'+pth.basename(vp)+'.png';const jpg='/tmp/thumb'+Date.now()+'.jpg';if(fs.existsSync(png)){cp.execSync('sips -Z 320 -s format jpeg \"'+png+'\" --out \"'+jpg+'\" 2>/dev/null');if(fs.existsSync(jpg))thumbPath=jpg;}}catch(e){}\n            // envoi legende txt : le fichier .txt a le meme chemin que le .mp4";
// EDIT 2 : attacher la miniature au document .txt
const A2="                fd.append('caption','📝 Légende + script (à copier pour TikTok)');\n                await tg('sendDocument',null,fd).catch(()=>{});";
const B2="                fd.append('caption','📝 Légende + script (à copier pour TikTok)');\n                if(thumbPath&&fs.existsSync(thumbPath)){try{fd.append('thumbnail',fs.createReadStream(thumbPath));}catch(e){}}\n                await tg('sendDocument',null,fd).catch(()=>{});";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+' (attendu 1). Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-video-fichier+miniature');rep(A2,B2,'2-thumbnail-txt');
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presave');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch save+miniature applique.');

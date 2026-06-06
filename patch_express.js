// patch_express.js — ajoute le mode "🚀 Express" au bot (zero validation jusqu'a la video,
// parties 2/3 proposees a la fin). Ne touche PAS a workflow.js (rendu verrouille intact).
// Auto-verifiant : backup .preExpress, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','telegram_bot.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('telegram_bot.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');

if(src.indexOf("EXPRESS_GO")>=0){console.log('✅ Deja applique (Express present) — rien a faire.');process.exit(0);}

// ancres
const MENU="[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}]]";
const HANDLER_ANCHOR="if(d==='SAVE_VID'){/*botfixes v1*/";
if(src.split(MENU).length-1!==1)die("ancre MENU (/go) absente ou multiple — abort.");
if(src.split(HANDLER_ANCHOR).length-1!==1)die("ancre SAVE_VID absente ou multiple — abort.");

// backup
const bak=FILE+'.preExpress';
if(!fs.existsSync(bak))fs.writeFileSync(bak,src);
console.log('💾 backup :',bak);

// 1) bouton dans le menu /go
const MENU_NEW="[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}],[{text:'🚀 Express',callback_data:'EXPRESS_GO'}]]";
src=src.replace(MENU,MENU_NEW);

// 2) handler EXPRESS_GO insere avant SAVE_VID
const HANDLER=[
"if(d==='EXPRESS_GO'){ /*express v1*/",
"      isAuto=true;",
"      setup={topic:null,photo:null,duration:'40s'};",
"      const idx=Math.floor(Math.random()*TOPIC_IDEAS.length);",
"      setup.topic=TOPIC_IDEAS[idx][1];",
"      const lDir=require('path').join(require('os').homedir(),'podcast-workflow','looks');",
"      try{",
"        const files=require('fs').readdirSync(lDir).filter(f=>/\\.(jpg|jpeg|png|webp)$/i.test(f));",
"        if(files.length>0){",
"          const pick=files[Math.floor(Math.random()*files.length)];",
"          setup.photo=require('path').join(lDir,pick);",
"          setAvatar(setup.photo);",
"          const tmp='/tmp/exp'+Date.now()+'.jpg';",
"          try{require('child_process').execSync('sips -Z 800 -s format jpeg \"'+setup.photo+'\" --out \"'+tmp+'\" 2>/dev/null');await sendImg(tmp,'📸 Look').catch(()=>{});}catch{}",
"        }",
"      }catch(e){}",
"      autoAnswers=['NO','NO','YES','YES'];",
"      await send('🚀 Express — aucune validation. Les étapes vont défiler jusqu’à la vidéo. (parties 2 et 3 proposées à la fin)').catch(()=>{});",
"      launch();return;",
"    }",
"    "
].join('\n    ');
src=src.replace(HANDLER_ANCHOR,HANDLER+HANDLER_ANCHOR);

fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO apres patch — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Mode 🚀 Express ajoute.');
console.log('   • bouton 🚀 Express dans /go (les 2 autres modes intacts)');
console.log('   • zero validation jusqua la video ; parties 2/3 proposees a la fin');
console.log('   • workflow.js NON touche (rendu verrouille intact)');
console.log('   ⚠️ telegram_bot.js => pm2 restart podcast-bot REQUIS (si aucune video ne tourne).');

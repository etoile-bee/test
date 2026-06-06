// patch_restart.js — bouton "🔄 Nouvelle vidéo" qui ouvre le menu /go (3 modes)
// a TOUS les points de fin (Done, Stop, Annulé, Cancelled). Ne touche pas a workflow.js.
// Auto-verifiant : backup .preRestart, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','telegram_bot.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('telegram_bot.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('restart v1')>=0){console.log('✅ Deja applique (restart v1) — rien a faire.');process.exit(0);}

const MENU="[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}],[{text:'🚀 Express',callback_data:'EXPRESS_GO'}]]";
const BTN="[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]";

const reps=[
  // 1) NEW_GO ouvre le menu 3 modes (au lieu de l'ancien step1_topic)
  ["if(d==='NEW_GO'){await step1_topic();return;}",
   "if(d==='NEW_GO'){if(proc){try{proc.kill();}catch(e){}proc=null;}state='idle';await send('Comment générer cette vidéo ?',"+MENU+");return;} /*restart v1*/"],
  // 2) apres Annulé
  ["if(d==='MM_CANCEL'){state='idle';setup.editing=null;await send('❌ Annulé.');return;}",
   "if(d==='MM_CANCEL'){state='idle';setup.editing=null;await send('❌ Annulé.',"+BTN+");return;}"],
  // 3) apres Cancelled
  ["if(d==='CANCEL'){state='idle';await send('❌ Cancelled.');return;}",
   "if(d==='CANCEL'){state='idle';await send('❌ Cancelled.',"+BTN+");return;}"],
  // 4) apres Stopped (/stop)
  ["await send('⏹ Stopped.');",
   "await send('⏹ Stopped.',"+BTN+");"],
  // 5) joli libelle a la fin de generation
  ["{text:'🎬 Make another',callback_data:'NEW_GO'}",
   "{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}"],
];
for(const [oldS,newS] of reps){
  const n=src.split(oldS).length-1;
  if(n!==1)die("ancre absente ou multiple ("+n+") : "+oldS.slice(0,40));
  src=src.replace(oldS,newS);
}

const bak=FILE+'.preRestart';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Bouton 🔄 Nouvelle vidéo ajoute a tous les points de fin :');
console.log('   • fin de generation, Stop, Annulé, Cancelled');
console.log('   • il ouvre le menu /go (Sur-mesure / Aléatoire / 🚀 Express)');
console.log('   ⚠️ telegram_bot.js => pm2 restart podcast-bot REQUIS (si aucune video ne tourne).');

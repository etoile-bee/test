// patch_partsbtn.js — ajoute "🔄 Nouvelle vidéo" a cote de Make Part 2/3 + Stop
// (visible aussi en Express). Ne touche pas a workflow.js.
// Auto-verifiant : backup .prePartsBtn, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','telegram_bot.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('telegram_bot.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('partsbtn v1')>=0){console.log('✅ Deja applique (partsbtn v1) — rien a faire.');process.exit(0);}

const reps=[
  ["return[[{text:'✅ Make Part 2',callback_data:'A_YES'},{text:'⏹ Stop here',callback_data:'A_NO'}]];",
   "return[[{text:'✅ Make Part 2',callback_data:'A_YES'},{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}],[{text:'⏹ Stop',callback_data:'A_NO'}]];/*partsbtn v1*/"],
  ["return[[{text:'✅ Make Part 3',callback_data:'A_YES'},{text:'⏹ Stop at 2',callback_data:'A_NO'}]];",
   "return[[{text:'✅ Make Part 3',callback_data:'A_YES'},{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}],[{text:'⏹ Stop',callback_data:'A_NO'}]];"],
];
for(const [oldS,newS] of reps){
  const n=src.split(oldS).length-1;
  if(n!==1)die("ancre absente ou multiple ("+n+") : "+oldS.slice(0,45));
  src=src.replace(oldS,newS);
}

const bak=FILE+'.prePartsBtn';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Bouton 🔄 Nouvelle vidéo ajoute aux propositions Partie 2/3 :');
console.log('   • ✅ Make Part 2/3 + 🔄 Nouvelle vidéo + ⏹ Stop (en dernier)');
console.log('   ⚠️ telegram_bot.js => pm2 restart podcast-bot REQUIS (si aucune video ne tourne).');

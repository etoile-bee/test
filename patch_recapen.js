// patch_recapen.js — traduit le flux RECAP (et ses sous-menus) en anglais.
// Auto-verifiant : backup .preRecapEn, anti-double, abort si une ancre manque, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','telegram_bot.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('telegram_bot.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('recap-en v1')>=0){console.log('✅ Deja applique (recap-en v1) — rien a faire.');process.exit(0);}

const reps=[
  ['4/4 — RÉCAP','4/4 — RECAP /*recap-en v1*/',1],
  ['⏱️ Durée','⏱️ Duration',1],
  ['📝 Écriture du script...','📝 Writing the script...',1],
  ['⚠️ Script non généré. Régénère via ⚙️ EDIT → Script.','⚠️ Script not generated. Regenerate via ⚙️ EDIT → Script.',1],
  ['(aucun)','(none)',1],
  ['⚙️ <b>EDIT — que modifier ?</b>','⚙️ <b>EDIT — what to change?</b>',1],
  ['⬅️ Retour','⬅️ Back',1],
  ['📝 <b>Script actuel :</b>','📝 <b>Current script:</b>',1],
  ['✍️ Réécrire','✍️ Rewrite',1],
  ['🔄 Régénérer','🔄 Regenerate',1],
  ['⚠️ Aucun look trouvé. Envoie une photo :','⚠️ No look found. Send a photo:',1],
  ['Garder ce look ?','Keep this look?',1],
  ['❌ Annulé.','❌ Cancelled.',1],
  ['⏱️ 2/4 — DURÉE','⏱️ 2/4 — DURATION',1],
  ['💭 Génération du sujet...','💭 Generating topic...',1],
  ['📂 <b>Choisis une catégorie :</b>','📂 <b>Choose a category:</b>',1],
  ['🎲 Random (sujet libre)','🎲 Random (free topic)',1],
  ['✍️ Écris ton sujet en un message :','✍️ Write your topic in one message:',1],
  ['📝 Écris le nouveau script en un message :','📝 Write the new script in one message:',1],
  ['📷 Envoie une photo maintenant (en message photo) :','📷 Send a photo now (as a photo message):',1],
];
let changed=0;
for(const [oldS,newS,minN] of reps){
  const n=src.split(oldS).length-1;
  if(n<minN)die("ancre absente : "+oldS.slice(0,30));
  src=src.split(oldS).join(newS); changed+=n;
}

const bak=FILE+'.preRecapEn';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Recap traduit en anglais ('+changed+' remplacements) :');
console.log('   • titre RECAP, Duration, menus EDIT/Script/Look, messages');
console.log('   ⚠️ telegram_bot.js => pm2 restart podcast-bot REQUIS (si aucune video ne tourne).');

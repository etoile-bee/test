// patch_recapfix.js — retire le marqueur "/*recap-en v1*/" qui s'affichait dans le titre RECAP.
// Auto-verifiant : backup .preRecapFix, abort si rien a corriger, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','telegram_bot.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('telegram_bot.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');

const OLD='4/4 — RECAP /*recap-en v1*/</b>';
const NEW='4/4 — RECAP</b>';
if(src.indexOf(OLD)<0){console.log('✅ Rien a corriger (deja propre).');process.exit(0);}
src=src.split(OLD).join(NEW);

const bak=FILE+'.preRecapFix';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Marqueur retire — le titre affiche maintenant juste "4/4 — RECAP".');
console.log('   ⚠️ telegram_bot.js => pm2 restart podcast-bot REQUIS (si aucune video ne tourne).');

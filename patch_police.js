// patch_police.js — pose le sous-titre VALIDE (Archivo Black chargee par URL,
// taille 48, blanc, boite 720x175, position 0.30) dans workflow.js.
// => police identique sur TOUTES les parties (plus jamais de serif), position basse.
// Auto-verifiant : backup .prePolice, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','workflow.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('workflow.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');

if(src.indexOf('archivo v1')>=0){console.log('✅ Deja applique (archivo v1) — rien a faire.');process.exit(0);}

const FONT_URL='https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf';

// 1) ancre sous-titre : on remplace tout le <p style="..."> + dimensions de la boite
const reAsset=/html:'<p style="[^"]*">'\+c\.text\+'<\/p>'\/\*outline v6\*\/,width:1080,height:140/;
if(!reAsset.test(src))die("ancre sous-titre (outline v6) absente — abort.");
const newStyle="font-family:\\'Archivo Black\\';font-size:48px;color:#FFFFFF;letter-spacing:0px;margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;";
src=src.replace(reAsset,"html:'<p style=\""+newStyle+"\">'+c.text+'</p>'/*archivo v1*/,width:720,height:175");

// 2) ajouter la police dans la timeline envoyee a Shotstack
const anchorTL="const edit={timeline:{background:'#000000',tracks:_tracks}";
if(src.split(anchorTL).length-1!==1)die("ancre timeline absente ou multiple — abort.");
src=src.replace(anchorTL,"const edit={timeline:{fonts:[{src:'"+FONT_URL+"'}],background:'#000000',tracks:_tracks}");

// 3) position 0.29 -> 0.30
if(src.indexOf('offset:{x:0,y:0.29}')<0)die("ancre offset 0.29 absente — abort.");
src=src.replace('offset:{x:0,y:0.29}','offset:{x:0,y:0.30}');

// backup + ecriture + verif
const bak=FILE+'.prePolice';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Sous-titre VALIDE pose dans workflow.js :');
console.log('   • police Archivo Black chargee par URL (identique parties 1/2/3, jamais de serif)');
console.log('   • taille 48, blanc, MAJUSCULES, boite 720x175');
console.log('   • position basse offset 0.30 (~63%)');
console.log('   • reactions + reste inchanges');

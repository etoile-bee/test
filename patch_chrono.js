// patch_chrono.js — ajoute un "mouchard" en haut de workflow_v2.js :
//   - chronometre chaque etape, compte lipsync (payant) et montages,
//   - affiche un BILAN a la fin.
// Ne modifie AUCUNE ligne existante (les sorties passent telles quelles -> rien ne casse).
// Auto-verifiant : backup .preChrono, anti-double, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','workflow_v2.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('fichier introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('chrono v2')>=0){console.log('✅ Deja applique (chrono v2) — rien a faire.');process.exit(0);}

const BLOCK="/*chrono v2*/(function(){var __t0=Date.now(),__steps=[],__lip=0,__mont=0,__o=console.log.bind(console);console.log=function(){var s=Array.prototype.join.call(arguments,' ');if(/lipsync/i.test(s))__lip++;if(/montage|shotstack|6\\/6/i.test(s))__mont++;if(/etape\\s*\\d\\/\\d|\\u00e9tape\\s*\\d\\/\\d|lipsync|montage|lanc/i.test(s)){__steps.push(((Date.now()-__t0)/1000).toFixed(1)+'s  '+s.replace(/\\s+/g,' ').slice(0,55));}return __o.apply(null,arguments);};process.on('exit',function(){var el=((Date.now()-__t0)/1000).toFixed(1);__o('\\n\\u2500\\u2500\\u2500\\u2500\\u2500 BILAN v2 \\u2500\\u2500\\u2500\\u2500\\u2500');__steps.forEach(function(x){__o('   '+x);});__o('\\ud83d\\udcb3 Lipsync (payant) x'+__lip+'   |   Montage x'+__mont);__o('\\u23f1\\ufe0f  Duree totale: '+el+'s');});})();\n";

// inserer apres un shebang eventuel, sinon tout en haut
let out;
if(src.startsWith('#!')){const i=src.indexOf('\n');out=src.slice(0,i+1)+BLOCK+src.slice(i+1);}
else out=BLOCK+src;

const bak=FILE+'.preChrono';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,out);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Mouchard chrono+credits ajoute a la v2 (sortie inchangee).');
console.log("   A la fin d'une execution v2, un BILAN s'affiche : etapes chronometrees,");
console.log('   nombre de lipsync (payant) et de montages, duree totale.');

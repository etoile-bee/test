// patch_pause.js — supprime toute forme du mot "pause" dans la VOIX et les SOUS-TITRES.
// Garde la respiration (les [pause] deviennent toujours un <break>), mais enleve tout "pause" residuel.
// Auto-verifiant : backup .prePause, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','workflow.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('workflow.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('pause-fix v1')>=0){console.log('✅ Deja applique (pause-fix v1) — rien a faire.');process.exit(0);}

// 1) VOIX : apres [pause]->break, enlever tout "pause" nu (2 occurrences attendues)
const ttsOld=".replace(/\\[pause\\]/gi,'<break time=\"0.8s\"/>')";
const ttsNew=".replace(/\\[pause\\]/gi,'<break time=\"0.8s\"/>').replace(/\\bpause\\b/gi,'')";
const nTts=src.split(ttsOld).length-1;
if(nTts<1)die("ancre VOIX (break) absente — abort.");
src=src.split(ttsOld).join(ttsNew);

// 2) SOUS-TITRES : retirer tout mot contenant "pause" + marqueur anti-double
const subOld="!/^\\[pause\\]$/i.test(w.word));";
const subNew="!/pause/i.test(w.word));/*pause-fix v1*/";
if(src.split(subOld).length-1!==1)die("ancre SOUS-TITRES (filter) absente ou multiple — abort.");
src=src.replace(subOld,subNew);

const bak=FILE+'.prePause';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Mot "pause" elimine :');
console.log('   • VOIX : '+nTts+' endroit(s) nettoye(s) (respiration conservee via <break>)');
console.log('   • SOUS-TITRES : tout token "pause" retire');
console.log('   • sous-titres Archivo + reste inchanges');

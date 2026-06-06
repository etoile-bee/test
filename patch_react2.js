// patch_react2.js — 1 reaction de plus (2 a 3 par video) + reglages "tres naturel".
// Auto-verifiant : backup .preReact2, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','workflow.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('workflow.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('react2 v1')>=0){console.log('✅ Deja applique (react2 v1) — rien a faire.');process.exit(0);}

const reps=[
  // 1) prompt : 2 a 3 reactions, espacees, naturelles
  ['choose EXACTLY 1 to 2 reactions max, placed right after the most impactful sentences (ideally near a [pause]), so it feels like an interviewer reacting',
   'choose EXACTLY 2 to 3 reactions, each right after a DIFFERENT impactful sentence (ideally near a [pause]); spread them across the script (one early or mid, NOT all at the end) and never back-to-back; VARY the type every time, NEVER repeat the same one; pick the type that fits the moment: mhm or yeah = agreement after a bold claim, right = strong validation, hmm = pensive after an intriguing or painful point; short soft natural backchannels so it feels like a real interviewer reacting'],
  // 2) cap 2 -> 3
  ['for(const _rx of reactions.slice(0,2)){',
   'for(const _rx of reactions.slice(0,3)){/*react2 v1*/'],
  // 3) volume un peu plus bas (plus naturel)
  ["{asset:{type:'audio',src:_url,volume:0.32},start:_st,length:1.2}",
   "{asset:{type:'audio',src:_url,volume:0.28},start:_st,length:1.2}"],
];
for(const [oldS,newS] of reps){
  const n=src.split(oldS).length-1;
  if(n!==1)die("ancre absente ou multiple ("+n+") : "+oldS.slice(0,45));
  src=src.replace(oldS,newS);
}

const bak=FILE+'.preReact2';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Reactions mises a jour :');
console.log('   • 2 a 3 reactions par video (une de plus)');
console.log('   • espaceee, jamais deux a la suite, sons doux');
console.log('   • volume 0.28 (plus naturel, en fond)');
console.log('   • sous-titres Archivo + reste inchanges');

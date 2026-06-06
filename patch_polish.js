const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
const EDITS=[{"name":"Sous-titres plus bas (y~830, haut du micro)","done":"/*subpos3*/","find":"    var _oy=0.40; /*subposfix*/ // position 100% FIXE, identique tout le temps (bande menton-micro, centre)","repl":"    var _oy=0.29; /*subpos3*/ // descendu au haut du micro / devant les epaules, centre"},{"name":"Couleur moins jaune (renforce)","done":"colorbalance=rm=-0.07:gm=-0.02:bm=0.12","find":"eq=brightness=-0.03:saturation=0.94,colorbalance=rm=-0.04:bm=0.04","repl":"eq=brightness=-0.05:saturation=0.90,colorbalance=rm=-0.07:gm=-0.02:bm=0.12"},{"name":"Plus de zooms (6 mots-cles au lieu de 4)","done":"\"WORD5\",\"WORD6\"","find":"\"keywords\":[\"WORD1\",\"WORD2\",\"WORD3\",\"WORD4\"] — pick the 4 most emotionally charged shocking words only","repl":"\"keywords\":[\"WORD1\",\"WORD2\",\"WORD3\",\"WORD4\",\"WORD5\",\"WORD6\"] — pick the 6 most emotionally charged shocking words only"},{"name":"Zoom plus frequent (segments 2.5s)","done":"/*zoom2*/","find":"const ze=Math.min(zs+3.0,duration); // zoom lent 3s","repl":"const ze=Math.min(zs+2.5,duration); /*zoom2*/ // zoom plus frequent"},{"name":"Reactions : 2 a 3 au lieu de 1-2","done":"choose EXACTLY 2 to 3 reactions","find":"choose EXACTLY 1 to 2 reactions max","repl":"choose EXACTLY 2 to 3 reactions"},{"name":"Reactions plus presentes (volume 0.32 -> 0.5)","done":"/*react vol v3*/","find":"_reactClips.push({asset:{type:'audio',src:_url,volume:0.32},start:_st,length:1.2});","repl":"_reactClips.push({asset:{type:'audio',src:_url,volume:0.5},start:_st,length:1.2}); /*react vol v3*/"}];
let applied=0, msgs=[];
for(const e of EDITS){
  if(src.includes(e.done)){msgs.push('  deja: '+e.name);continue;}
  const c=src.split(e.find).length-1;
  if(c===1){src=src.split(e.find).join(e.repl);applied++;msgs.push('  OK  : '+e.name);}
  else{msgs.push('  SKIP ('+c+' ancre): '+e.name);}
}
if(applied===0){console.log(msgs.join('\n'));console.error('Rien applique (aucune ancre). Rien ecrit.');process.exit(1);}
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(err){console.error('Syntaxe KO, rien ecrit.');console.error(err.stderr?err.stderr.toString():err.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepolish');fs.renameSync('workflow.patched.js',FILE);
console.log(msgs.join('\n'));
console.log('--- '+applied+'/'+EDITS.length+' reglages appliques. ---');

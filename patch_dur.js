const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// couper la fin qui traine')){console.error('Deja patche.');process.exit(1);}
// EDIT 1 : couper la fin qui traine (video plus longue que la parole)
const A1="  const wt=wordTimings.filter(w=>w.text&&w.duration>0);";
const B1="  const wt=wordTimings.filter(w=>w.text&&w.duration>0);\n  // couper la fin qui traine : limiter a la fin reelle de la parole (+petite marge)\n  const _speechEnd=wordTimings.reduce((m,w)=>Math.max(m,(w.end||0)),0);\n  if(_speechEnd>1&&_speechEnd<duration)duration=_speechEnd+0.35;";
// EDIT 2 : hashtags viraux generiques
const A2="\"hashtags\":[\"t1\",\"t2\",\"t3\",\"t4\",\"t5\"]";
const B2="\"hashtags\":[\"t1\",\"t2\",\"t3\",\"t4\",\"t5\"] where the 5 tags are the MOST VIRAL generic TikTok hashtags (fyp, foryou, foryoupage, viral, trending, relatable) plus 1 topical one max, no hash symbol, lowercase, no spaces";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+' (attendu 1). Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-trim');rep(A2,B2,'2-hashtags');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.predur');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch trim+hashtags applique.');

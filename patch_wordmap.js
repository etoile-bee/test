const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes("words='95-110'")){console.error('Deja patche.');process.exit(1);}
const A1="if(d==='15')words='15-18';else if(d==='30')words='75-80';";
const B1="if(d==='15')words='45-55';else if(d==='30')words='95-110';";
const A2="const dl=words==='15-18'?'15s':words==='75-80'?'30s':'23s';";
const B2="const dl=words==='45-55'?'15s':words==='95-110'?'30s':'23s';";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+' (attendu 1). Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-mapping');rep(A2,B2,'2-label');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prewordmap');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch word-count par duree applique.');

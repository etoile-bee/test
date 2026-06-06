const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// pos+zoom v3')){console.error('Deja patche.');process.exit(1);}
// 1) remonter les sous-titres : offset y 0.30 -> 0.42 (mi-hauteur menton/micro)
const A1="start:c.start,length:c.length,position:'bottom',offset:{x:0,y:0.30}";
const B1="start:c.start,length:c.length,position:'bottom',offset:{x:0,y:0.42} // pos+zoom v3 : sous-titres remontes mi-hauteur";
// 2) zoom lent ~3s (au lieu de 0.45)
const A2="    const ze=Math.min(zs+0.45,duration);";
const B2="    const ze=Math.min(zs+3.0,duration); // zoom lent 3s";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-position');rep(A2,B2,'2-zoom3s');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepos');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch position+zoom3s applique.');

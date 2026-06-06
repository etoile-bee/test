const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*subref v2*/')){console.error('Deja patche.');process.exit(1);}
const A="    var _oy=0.535; /*subpos4*/ // haut de poitrine, comme la ref\n    return {asset:{type:'html',html:'<p style=\"font-family:Arial Black,Arial,sans-serif;font-size:62px;font-weight:900;letter-spacing:3px;color:#FFFFFF;text-shadow:0 2px 7px rgba(0,0,0,0.55),0 0 3px rgba(0,0,0,0.45);margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*subref v1*/,width:720,height:170,background:'transparent'},start:c.start,length:c.length,position:'bottom',offset:{x:0,y:_oy}};";
const B="    var _oy=0.347; /*subpos5*/ // haut de la mousse du micro\n    return {asset:{type:'html',html:'<p style=\"font-family:Arial Black,Arial,sans-serif;font-size:52px;font-weight:900;letter-spacing:2px;color:#FFFFFF;-webkit-text-stroke:1.3px #FFFFFF;text-shadow:0 2px 7px rgba(0,0,0,0.55),0 0 3px rgba(0,0,0,0.45);margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*subref v2*/,width:720,height:175,background:'transparent'},start:c.start,length:c.length,position:'bottom',offset:{x:0,y:_oy}};";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}catch(e){console.error('Syntaxe KO');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubpos5');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch sous-titres v2 (haut mousse micro, plus gros, plus epais) applique.');

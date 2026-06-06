const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*subref v1*/')){console.error('Deja patche.');process.exit(1);}
const A="    var _oy=0.29; /*subpos3*/ // descendu au haut du micro / devant les epaules, centre\n    return {asset:{type:'html',html:'<p style=\"font-family:Arial Black,sans-serif;font-size:58px;font-weight:900;color:#FFFFFF;text-shadow:-1px -1px 0 #000,0px -1px 0 #000,1px -1px 0 #000,-1px 0px 0 #000,1px 0px 0 #000,-1px 1px 0 #000,0px 1px 0 #000,1px 1px 0 #000,-2px -2px 0 #000,0px -2px 0 #000,2px -2px 0 #000,-2px 0px 0 #000,2px 0px 0 #000,-2px 2px 0 #000,0px 2px 0 #000,2px 2px 0 #000,-3px -3px 0 #000,0px -3px 0 #000,3px -3px 0 #000,-3px 0px 0 #000,3px 0px 0 #000,-3px 3px 0 #000,0px 3px 0 #000,3px 3px 0 #000,-4px -4px 0 #000,0px -4px 0 #000,4px -4px 0 #000,-4px 0px 0 #000,4px 0px 0 #000,-4px 4px 0 #000,0px 4px 0 #000,4px 4px 0 #000,-5px -5px 0 #000,0px -5px 0 #000,5px -5px 0 #000,-5px 0px 0 #000,5px 0px 0 #000,-5px 5px 0 #000,0px 5px 0 #000,5px 5px 0 #000,0 5px 8px rgba(0,0,0,0.85);margin:0;padding:8px 24px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*outline v7*/,width:1080,height:160,background:'transparent'},start:c.start,length:c.length,position:'bottom',offset:{x:0,y:_oy}};";
const B="    var _oy=0.535; /*subpos4*/ // haut de poitrine, comme la ref\n    return {asset:{type:'html',html:'<p style=\"font-family:Arial Black,Arial,sans-serif;font-size:62px;font-weight:900;letter-spacing:3px;color:#FFFFFF;text-shadow:0 2px 7px rgba(0,0,0,0.55),0 0 3px rgba(0,0,0,0.45);margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*subref v1*/,width:720,height:170,background:'transparent'},start:c.start,length:c.length,position:'bottom',offset:{x:0,y:_oy}};";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre sous-titres = '+c+' (attendu 1). Rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}catch(e){console.error('Syntaxe KO');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubref');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch sous-titres (Arial blanc, espace, ombre douce, plus gros, haut poitrine) applique.');

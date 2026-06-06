const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*outline v6*/')){console.error('Deja patche.');process.exit(1);}
const SHADOW="-1px -1px 0 #000,0px -1px 0 #000,1px -1px 0 #000,-1px 0px 0 #000,1px 0px 0 #000,-1px 1px 0 #000,0px 1px 0 #000,1px 1px 0 #000,-2px -2px 0 #000,0px -2px 0 #000,2px -2px 0 #000,-2px 0px 0 #000,2px 0px 0 #000,-2px 2px 0 #000,0px 2px 0 #000,2px 2px 0 #000,-3px -3px 0 #000,0px -3px 0 #000,3px -3px 0 #000,-3px 0px 0 #000,3px 0px 0 #000,-3px 3px 0 #000,0px 3px 0 #000,3px 3px 0 #000,-4px -4px 0 #000,0px -4px 0 #000,4px -4px 0 #000,-4px 0px 0 #000,4px 0px 0 #000,-4px 4px 0 #000,0px 4px 0 #000,4px 4px 0 #000,-5px -5px 0 #000,0px -5px 0 #000,5px -5px 0 #000,-5px 0px 0 #000,5px 0px 0 #000,-5px 5px 0 #000,0px 5px 0 #000,5px 5px 0 #000,-6px -6px 0 #000,0px -6px 0 #000,6px -6px 0 #000,-6px 0px 0 #000,6px 0px 0 #000,-6px 6px 0 #000,0px 6px 0 #000,6px 6px 0 #000,0 5px 8px rgba(0,0,0,0.85)";
const A="font-size:46px;font-weight:900;color:#FFFFFF;text-shadow:-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000,3px 3px 0 #000,0 -3px 0 #000,0 3px 0 #000,-3px 0 0 #000,3px 0 0 #000,0 4px 7px rgba(0,0,0,0.85);margin:0;padding:6px 22px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*outline v5*/";
const B="font-size:48px;font-weight:900;color:#FFFFFF;text-shadow:"+SHADOW+";margin:0;padding:8px 24px;text-align:center;text-transform:uppercase;\">'+c.text+'</p>'/*outline v6*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prebold');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch contour epais v6 applique.');

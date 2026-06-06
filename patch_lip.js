const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
const A="},60000);";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre lipsync = '+c+'. Annule.');process.exit(1);}
src=src.split(A).join("},180000);");
fs.writeFileSync(FILE,src);
console.log('Patch lipsync 3min applique.');

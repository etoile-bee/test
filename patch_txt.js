const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('SCRIPT:')){console.error('Deja patche.');process.exit(1);}
const A="const txt='SHORT:\\n'+(content.caption_short||content.caption||'')+'\\n\\nLONG:\\n'+(content.caption_long||'')+'\\n\\nHASHTAGS:\\n'+tags;";
const B="const txt='SCRIPT:\\n'+(content.script||'')+'\\n\\nSHORT:\\n'+(content.caption_short||content.caption||'')+'\\n\\nLONG:\\n'+(content.caption_long||'')+'\\n\\nHASHTAGS:\\n'+tags;";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre txt = '+c+'. Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.pretxt');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch script-dans-txt applique.');

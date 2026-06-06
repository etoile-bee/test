const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
const EDITS=[{"name":"Zoom doux (plan large garde, ne coupe plus le visage)","done":"1.10,1.18,1.12,1.20,1.14,1.16","find":"const ZOOMS=[1.22,1.40,1.30,1.50,1.35,1.45];","repl":"const ZOOMS=[1.10,1.18,1.12,1.20,1.14,1.16];"},{"name":"Sous-titres plus gros/gras (48 -> 58px)","done":"font-size:58px","find":"font-size:48px","repl":"font-size:58px"}];
let applied=0, msgs=[];
for(const e of EDITS){
  if(src.includes(e.done)){msgs.push('  deja: '+e.name);continue;}
  const c=src.split(e.find).length-1;
  if(c===1){src=src.split(e.find).join(e.repl);applied++;msgs.push('  OK  : '+e.name);}
  else{msgs.push('  SKIP ('+c+' ancre): '+e.name);}
}
if(applied===0){console.log(msgs.join('\n'));console.error('Rien applique. Rien ecrit.');process.exit(1);}
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(err){console.error('Syntaxe KO, rien ecrit.');console.error(err.stderr?err.stderr.toString():err.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepolish2');fs.renameSync('workflow.patched.js',FILE);
console.log(msgs.join('\n'));
console.log('--- '+applied+'/'+EDITS.length+' reglages appliques. ---');

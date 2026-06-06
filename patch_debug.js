const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('=== DEBUG')){console.error('Deja patche.');process.exit(1);}
// marqueur 1 : au debut de MM_START
const A1="if(d==='MM_START'){setup.approvedScript=setup.script;";
const B1="if(d==='MM_START'){console.error('=== DEBUG MM_START clique, photo='+setup.photo);setup.approvedScript=setup.script;";
// marqueur 2 : juste apres le spawn dans launch
const A2="  proc=spawn('node',args,{cwd:BASE,env:{...process.env}});";
const B2="  proc=spawn('node',args,{cwd:BASE,env:{...process.env}});\n  console.error('=== DEBUG spawn lance, pid='+(proc&&proc.pid)+' args='+JSON.stringify(args));\n  if(proc)proc.on('error',e=>console.error('=== DEBUG spawn ERROR: '+e.message));";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1');rep(A2,B2,'2');
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.predebug');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch debug applique.');

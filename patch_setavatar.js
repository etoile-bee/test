const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// setAvatar robuste')){console.error('❌ Déjà patché. Annulé.');process.exit(1);}
const A=`function setAvatar(fp){
  let e=fs.readFileSync(ENV_PATH,'utf8');
  e=e.replace(/HIGGS_AVATAR_URL=.*/,'HIGGS_AVATAR_URL='+fp);
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_AVATAR_URL=fp;
}`;
const B=`function setAvatar(fp){ // setAvatar robuste : crée la ligne si absente
  let e=fs.readFileSync(ENV_PATH,'utf8');
  if(/^HIGGS_AVATAR_URL=.*/m.test(e)){
    e=e.replace(/^HIGGS_AVATAR_URL=.*/m,'HIGGS_AVATAR_URL='+fp);
  }else{
    if(e.length&&!e.endsWith('\\n'))e+='\\n';
    e+='HIGGS_AVATAR_URL='+fp+'\\n';
  }
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_AVATAR_URL=fp;
}`;
const c=src.split(A).length-1;
if(c!==1){console.error('❌ Ancre = '+c+' (attendu 1). Annulé.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presetavatar');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch setAvatar appliqué. Sauvegarde : '+FILE+'.presetavatar');

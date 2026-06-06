const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// sendImg auto-compress')){console.error('Deja patche.');process.exit(1);}
const A="  try{\n    const FormData=require('form-data');\n    const form=new FormData();\n    form.append('chat_id',CHAT_ID);\n    // Read as buffer to avoid iCloud stream issues\n    const buf=fs.readFileSync(fp);";
const B="  try{\n    // sendImg auto-compress : reduit toute image locale > 9 Mo avant envoi\n    try{\n      const st=fs.statSync(fp);\n      if(st.size>9000000){\n        const small='/tmp/prev'+Date.now()+'.jpg';\n        require('child_process').execSync('sips -Z 1280 -s format jpeg \"'+fp+'\" --out \"'+small+'\" 2>/dev/null');\n        if(fs.existsSync(small)&&fs.statSync(small).size<10485760)fp=small;\n      }\n    }catch(e){}\n    const FormData=require('form-data');\n    const form=new FormData();\n    form.append('chat_id',CHAT_ID);\n    // Read as buffer to avoid iCloud stream issues\n    const buf=fs.readFileSync(fp);";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presendimg');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('Patch sendImg applique. Sauvegarde : '+FILE+'.presendimg');

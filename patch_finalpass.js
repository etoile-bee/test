const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*finalpass v1*/')){console.error('Deja patche.');process.exit(1);}
const A="  execSync('curl -s -o \"'+p+'\" \"'+url+'\"');\n  console.log('\\n✅ Part '+num+':',p);";
const B="  execSync('curl -s -o \"'+p+'\" \"'+url+'\"');\n  // === passe finale : fondu audio (anti-pop) + couleur de-jaunie pour coller au brut Kling /*finalpass v1*/\n  try{\n    const _cp=require('child_process');const _fs=require('fs');\n    let _dur=0;try{_dur=parseFloat(_cp.execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 \"'+p+'\"').toString().trim())||0;}catch(_e){_dur=0;}\n    let _af='afade=t=in:ss=0:d=0.12';\n    if(_dur>0.4){_af+=',afade=t=out:st='+Math.max(_dur-0.15,0).toFixed(2)+':d=0.15';}\n    const _vf='eq=brightness=-0.03:saturation=0.94,colorbalance=rm=-0.04:bm=0.04';\n    const _tmp=p.replace(/\\.mp4$/,'_fix.mp4');\n    _cp.execSync('ffmpeg -y -i \"'+p+'\" -vf \"'+_vf+'\" -af \"'+_af+'\" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k \"'+_tmp+'\" 2>/dev/null');\n    if(_fs.existsSync(_tmp)&&_fs.statSync(_tmp).size>10000){_fs.renameSync(_tmp,p);console.log('  Passe finale OK (anti-pop + couleur).');}\n    else{try{if(_fs.existsSync(_tmp))_fs.unlinkSync(_tmp);}catch(_e2){}console.log('  (passe finale ignoree, video brute conservee)');}\n  }catch(_e){console.log('  (passe finale ignoree: '+_e.message+')');}\n  console.log('\\n✅ Part '+num+':',p);";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prefinalpass');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch passe finale (anti-pop + couleur) applique.');

const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*audiobed v1*/')){console.error('Deja patche.');process.exit(1);}
const A="const edit={timeline:{background:'#000000',tracks:[{clips:subClips},{clips:vc}]},output:{format:'mp4',resolution:'hd',aspectRatio:'9:16',fps:30}};";
const B="vc.forEach(function(_c){if(_c.asset&&_c.asset.type==='video')_c.asset.volume=0;}); const _audioBed=[{asset:{type:'video',src:lipsyncUrl,volume:1},start:0,length:duration,scale:1.0}]; const edit={timeline:{background:'#000000',tracks:[{clips:subClips},{clips:vc},{clips:_audioBed}]},output:{format:'mp4',resolution:'hd',aspectRatio:'9:16',fps:30}}; /*audiobed v1*/";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+' (attendu 1). Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preaudiobed');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch audiobed v1 applique.');

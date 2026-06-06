const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// zoom dynamique')){console.error('Deja patche.');process.exit(1);}
const A="  let vc=[],cur=0;\n  for(const kw of sorted){\n    const zs=Math.max(kw.start-0.03,cur);\n    if(zs>cur+0.05)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:zs-cur,scale:1.32});\n    const ze=Math.min(zs+0.35,duration);\n    vc.push({asset:{type:'video',src:lipsyncUrl,trim:zs},start:zs,length:ze-zs,scale:1.32});\n    cur=ze;\n  }";
const B="  // zoom dynamique : plan large entre les mots-cles, zoom alterne (in/out) sur chaque mot-cle\n  const ZOOMS=[1.25,1.45,1.30,1.50]; // intensites qui alternent pour faire respirer\n  let vc=[],cur=0,ki=0;\n  for(const kw of sorted){\n    const zs=Math.max(kw.start-0.05,cur);\n    // segment plan large avant le mot-cle\n    if(zs>cur+0.05)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:zs-cur,scale:1.0});\n    // segment zoom sur le mot-cle, intensite alternee\n    const z=ZOOMS[ki%ZOOMS.length];ki++;\n    const ze=Math.min(zs+0.45,duration);\n    vc.push({asset:{type:'video',src:lipsyncUrl,trim:zs},start:zs,length:ze-zs,scale:z});\n    cur=ze;\n  }";
const A2="  if(cur<duration-0.1)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:duration-cur,scale:1.32});";
const B2="  if(cur<duration-0.1)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:duration-cur,scale:1.0});";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A,B,'1');rep(A2,B2,'2');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prezoom');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch zoom applique.');

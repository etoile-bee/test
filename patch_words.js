const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// sous-titres mot par mot')){console.error('Deja patche.');process.exit(1);}
const A="  const chunks=[];\n  for(let i=0;i<wt.length;i+=2){\n    const g=wt.slice(i,i+2);\n    chunks.push({text:g.map(w=>w.text).join(' '),start:g[0].start,length:Math.max(g[g.length-1].end-g[0].start+0.1,0.4)});\n  }";
const B="  // sous-titres mot par mot (style TikTok), sans chevauchement\n  const chunks=[];\n  for(let i=0;i<wt.length;i++){\n    const w=wt[i];\n    const next=wt[i+1];\n    // fin = juste avant le mot suivant (pas de chevauchement), sinon fin du mot\n    let end=next?next.start:w.end;\n    let len=end-w.start;\n    if(len<0.12)len=0.12; // mini lisible pour les mots tres rapides\n    chunks.push({text:w.text,start:w.start,length:len});\n  }";
const c=src.split(A).length-1;
if(c!==1){console.error('Ancre = '+c+'. Annule.');process.exit(1);}
src=src.split(A).join(B);
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prewords');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch mot-par-mot applique.');

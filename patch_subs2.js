const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// mot par mot v2')){console.error('Deja patche.');process.exit(1);}

// 1) Anti-chevauchement strict : recalcul du decoupage
const A1="  // sous-titres mot par mot (style TikTok), sans chevauchement\n  const chunks=[];\n  for(let i=0;i<wt.length;i++){\n    const w=wt[i];\n    const next=wt[i+1];\n    // fin = juste avant le mot suivant (pas de chevauchement), sinon fin du mot\n    let end=next?next.start:w.end;\n    let len=end-w.start;\n    if(len<0.12)len=0.12; // mini lisible pour les mots tres rapides\n    chunks.push({text:w.text,start:w.start,length:len});\n  }";
const B1="  // mot par mot v2 : 1 mot affiche, fin clampee avant le mot suivant (zero chevauchement)\n  const GAP=0.02; // petit espace pour garantir aucune superposition\n  const chunks=[];\n  for(let i=0;i<wt.length;i++){\n    const w=wt[i];\n    const next=wt[i+1];\n    let start=w.start;\n    let end=next?Math.min(w.end,next.start-GAP):w.end;\n    if(end<=start)end=start+0.12; // securite mots tres rapides/colles\n    // si le mot suivant commence avant la fin calculee, on coupe net\n    if(next&&end>next.start-GAP)end=next.start-GAP;\n    if(end<=start)end=start+0.10;\n    chunks.push({text:w.text,start:start,length:Math.max(end-start,0.10)});\n  }";

// 2) Taille 44 -> 38
const A2="font-size:44px;font-weight:900";
const B2="font-size:38px;font-weight:900";

// 3) Plus de zooms (variete)
const A3="const ZOOMS=[1.25,1.45,1.30,1.50];";
const B3="const ZOOMS=[1.22,1.40,1.30,1.50,1.35,1.45];";

function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-decoupage');rep(A2,B2,'2-taille');rep(A3,B3,'3-zooms');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.presubs2');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch subs2 applique.');

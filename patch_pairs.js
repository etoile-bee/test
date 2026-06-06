const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('// groupes 1-2 mots')){console.error('Deja patche.');process.exit(1);}

// 1) Remplacer le decoupage mot-par-mot par un regroupement 2 mots (sauf mot long > 7 lettres)
const A1="  // mot par mot v2 : 1 mot affiche, fin clampee avant le mot suivant (zero chevauchement)\n  const GAP=0.02; // petit espace pour garantir aucune superposition\n  const chunks=[];\n  for(let i=0;i<wt.length;i++){\n    const w=wt[i];\n    const next=wt[i+1];\n    let start=w.start;\n    let end=next?Math.min(w.end,next.start-GAP):w.end;\n    if(end<=start)end=start+0.12; // securite mots tres rapides/colles\n    // si le mot suivant commence avant la fin calculee, on coupe net\n    if(next&&end>next.start-GAP)end=next.start-GAP;\n    if(end<=start)end=start+0.10;\n    chunks.push({text:w.text,start:start,length:Math.max(end-start,0.10)});\n  }";
const B1="  // groupes 1-2 mots : 2 mots ensemble, mais mot seul si l'un fait > 7 lettres. Zero chevauchement.\n  const GAP=0.02;const LONG=7;\n  const chunks=[];\n  let i=0;\n  while(i<wt.length){\n    const w=wt[i];\n    const w2=wt[i+1];\n    // on groupe 2 mots seulement si les deux existent ET aucun n'est trop long\n    let group;\n    if(w2&&w.text.length<=LONG&&w2.text.length<=LONG){\n      group=[w,w2];i+=2;\n    }else{\n      group=[w];i+=1;\n    }\n    const after=wt[i]; // mot qui suit le groupe\n    const start=group[0].start;\n    let end=group[group.length-1].end;\n    if(after&&end>after.start-GAP)end=after.start-GAP; // coupe net avant le groupe suivant\n    if(end<=start)end=start+0.12;\n    chunks.push({text:group.map(g=>g.text).join(' '),start:start,length:Math.max(end-start,0.12)});\n  }";

// 2) Taille 38 -> 40
const A2="font-size:38px;font-weight:900";
const B2="font-size:40px;font-weight:900";

function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+'. Annule.');process.exit(1);}src=src.split(a).join(b);}
rep(A1,B1,'1-groupes');rep(A2,B2,'2-taille');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepairs');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch groupes 1-2 mots applique.');

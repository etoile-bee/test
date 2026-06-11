// [PREUVE DE LECTURE] sur la VRAIE base (pas de fixture, pas de R0_DRYRUN) : ce que les LECTEURS du cockpit voient
//   doit correspondre à ce qui est sur le DISQUE. Read-only, aucune écriture.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BASE=path.join(os.homedir(),'podcast-workflow'); const persona='imany';
const INV=require('../ui/inventory'), S=require('../ui/socle'), C=require('../ui/conscience');
function sh(c){try{return +cp.execSync(c).toString().trim();}catch(e){return -1;}}

// --- réplique EXACTE des globs de r0RealImages ---
function realImages(){const out={},add=p=>{try{if(p&&fs.existsSync(p)&&fs.statSync(p).size>1000)out[path.basename(p)]=1;}catch(e){}};
  try{for(const d of fs.readdirSync(path.join(BASE,'projects_r',persona))){const pd=path.join(BASE,'projects_r',persona,d);try{for(const x of fs.readdirSync(pd))if(/^photo_.*\.(jpg|jpeg|png)$/i.test(x))add(path.join(pd,x));}catch(e){}}}catch(e){}
  try{const g=path.join(BASE,'outputs','generations');for(const x of fs.readdirSync(g))if(/\.(jpg|jpeg|png|webp)$/i.test(x))add(path.join(g,x));}catch(e){}
  try{const ld=fs.realpathSync(path.join(BASE,'looks'));for(const x of fs.readdirSync(ld))if(/^gen_.*\.(jpg|jpeg|png|webp)$/i.test(x))add(path.join(ld,x));}catch(e){}
  return Object.keys(out).length;}
// --- réplique EXACTE de r0RealVideos ---
function realVideos(){const out={},add=p=>{try{if(p&&fs.existsSync(p)&&fs.statSync(p).size>5000)out[path.basename(p)]=1;}catch(e){}};
  const isV=x=>/\.(mp4|mov|m4v|webm)$/i.test(x)&&!/_raw_|_raw\./i.test(x);
  try{const o=path.join(BASE,'outputs');for(const x of fs.readdirSync(o))if(isV(x))add(path.join(o,x));}catch(e){}
  try{const g=path.join(BASE,'outputs','generations');for(const x of fs.readdirSync(g)){const fp=path.join(g,x);try{if(fs.statSync(fp).isDirectory()){for(const y of fs.readdirSync(fp))if(isV(y))add(path.join(fp,y));}else if(isV(x))add(fp);}catch(e){}}}catch(e){}
  try{for(const d of fs.readdirSync(path.join(BASE,'projects_r',persona))){const pd=path.join(BASE,'projects_r',persona,d);try{for(const x of fs.readdirSync(pd))if(isV(x))add(path.join(pd,x));}catch(e){}}}catch(e){}
  return Object.keys(out).length;}

const recents=INV.recents(BASE,persona);
const secs=INV.studioSections(BASE,persona);
const looks=(secs.find(s=>s.key==='looks')||{}).count;
console.log('PREUVE DE LECTURE (cockpit) vs DISQUE :');
console.log('  Galerie globale (images lues):', realImages());
console.log('  Vidéos globales (lues):', realVideos(), ' | .mp4 sur disque outputs (hors raw):', sh("ls outputs/*.mp4 2>/dev/null | grep -v _raw_ | wc -l"));
console.log('  Récents (projets lus):', (recents.projets||[]).length, ' | dossiers projet sur disque:', sh("ls -d projects_r/imany/*/ 2>/dev/null | wc -l"));
console.log('  Studio looks (lus):', looks, ' | fichiers looks sur disque:', sh("ls looks/ 2>/dev/null | grep -iE '\\.(jpg|jpeg|png|webp)$' | wc -l"));

// [PREUVE LECTURE FINALE] read-only. 4 niveaux par lecteur (trouvé physique / lisible / affichable / affiché),
//   AVANT et APRÈS migration (globs mis à jour). Aucune écriture.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BASE=path.join(os.homedir(),'podcast-workflow'),persona='imany';
let LOOKS;try{LOOKS=fs.realpathSync(path.join(BASE,'looks'));}catch(e){LOOKS=path.join(BASE,'looks');}
const GEN=path.join(BASE,'outputs','generations'),OUT=path.join(BASE,'outputs'),PR=path.join(BASE,'projects_r',persona),PROJETS=path.join(LOOKS,'projets',persona);
const ls=d=>{try{return fs.readdirSync(d);}catch(e){return [];}};
const isImg=x=>/\.(jpg|jpeg|png|webp)$/i.test(x), isVid=x=>/\.(mp4|mov|m4v|webm)$/i.test(x);
const big=(p,n)=>{try{return fs.statSync(p).size>n;}catch(e){return false;}};

// ---------- GALERIE IMAGES ----------
function galImg(after){ let phys=0,lis=0; const seen={};
  // projects_r photos
  for(const d of ls(PR))for(const x of ls(path.join(PR,d))){ if(/^photo_/.test(x)){phys++; if(isImg(x)){lis++; const k=x; if(big(path.join(PR,d,x),1000)&&!seen[k])seen[k]=1;}}}
  // generations
  for(const x of ls(GEN)){ phys++; if(isImg(x)){lis++; if(big(path.join(GEN,x),1000)&&!seen[x])seen[x]=1;}}
  // looks : AVANT = gen_* seulement ; APRÈS = TOUTES les images
  for(const x of ls(LOOKS)){ if(isImg(x)){ phys++; const ok=after? true : /^gen_/.test(x); if(ok){lis++; if(big(path.join(LOOKS,x),1000)&&!seen[x])seen[x]=1;}}}
  // APRÈS : archive par projet
  if(after) for(const d of ls(PROJETS))for(const x of ls(path.join(PROJETS,d,'Photos'))){ phys++; if(isImg(x)){lis++; if(!seen[x])seen[x]=1;}}
  const aff=Object.keys(seen).length; return {phys,lis,aff,shown:aff}; }

// ---------- HISTORIQUE VIDÉO ----------
function vid(after){ let phys=0,lis=0,raw=0; const seen={};
  const scan=(dir,recurse)=>{ for(const x of ls(dir)){ const fp=path.join(dir,x); let st; try{st=fs.statSync(fp);}catch(e){continue;}
    if(st.isDirectory()){ if(recurse) scan(fp,false); continue; } phys++;
    if(isVid(x)){ lis++; if(/_raw_|_raw\./i.test(x)){raw++;continue;} if(st.size>5000&&!seen[x])seen[x]=1; } } };
  scan(OUT,false); scan(GEN,true);
  for(const d of ls(PR))scan(path.join(PR,d),false);
  if(after) for(const d of ls(PROJETS))scan(path.join(PROJETS,d,'Vidéos'),false);
  const aff=Object.keys(seen).length; return {phys,lis,aff,shown:aff,raw}; }

// ---------- RÉCENTS / ARCHIVES / RECHERCHE (base) ----------
const INV=require('../ui/inventory'); const r=INV.recents(BASE,persona);
const projets=(r.projets||[]).length, archs=(r.archives||[]).length;

// ---------- 318 INTER-PROJETS + total copies ----------
let own=0,cross=0,ext=0,copies=0; const facts=cp.execSync("find projects_r -name facts.json").toString().trim().split('\n').filter(Boolean);
for(const f of facts){ const proj=path.basename(path.dirname(f)); let j;try{j=JSON.parse(fs.readFileSync(f));}catch(e){continue;}
  const per={}; for(const m of (j.medias||[])){ if(m.simule||!m.file||!fs.existsSync(m.file))continue;
    const mm=m.file.match(/projects_r\/[^/]+\/([^/]+)\//); if(mm){mm[1]===proj?own++:cross++;} else ext++;
    per[path.basename(m.file)]=1; }
  copies+=Object.keys(per).length; }

const A=galImg(false),B=galImg(true),V0=vid(false),V1=vid(true);
console.log('=== GALERIE IMAGES ===');
console.log('AVANT  trouvé:',A.phys,'lisible:',A.lis,'affichable/affiché:',A.aff);
console.log('APRÈS  trouvé:',B.phys,'lisible:',B.lis,'affichable/affiché:',B.aff,'(+'+(B.aff-A.aff)+' patrimoine)');
console.log('=== HISTORIQUE VIDÉO ===');
console.log('AVANT  trouvé:',V0.phys,'lisible:',V0.lis,'raw filtrés:',V0.raw,'affiché:',V0.aff);
console.log('APRÈS  trouvé:',V1.phys,'lisible:',V1.lis,'raw filtrés:',V1.raw,'affiché:',V1.aff);
console.log('=== RÉCENTS/ARCHIVES/RECHERCHE (base) ===');
console.log('projets:',projets,'| archives:',archs,'(avant = après, base inchangée)');
console.log('=== INTER-PROJETS / COPIE PHYSIQUE ===');
console.log('refs réelles -> own:',own,'cross:',cross,'externe:',ext,'| TOTAL copies physiques (dédup/projet):',copies);

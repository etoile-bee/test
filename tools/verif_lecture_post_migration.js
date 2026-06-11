// [PREUVE DE LECTURE APRÈS MIGRATION] read-only, AUCUNE écriture. Compte ce que CHAQUE lecteur verrait
//   une fois les globs mis à jour (podcast-looks/projets/** ajouté + podcast-looks racine élargi), SANS rien retirer.
const fs=require('fs'),path=require('path'),os=require('os');
const BASE=path.join(os.homedir(),'podcast-workflow'),persona='imany';
let LOOKS;try{LOOKS=fs.realpathSync(path.join(BASE,'looks'));}catch(e){LOOKS=path.join(BASE,'looks');}
const PROJETS=path.join(LOOKS,'projets',persona),OUT=path.join(BASE,'outputs'),GEN=path.join(OUT,'generations'),PR=path.join(BASE,'projects_r',persona);
const isImg=x=>/\.(jpg|jpeg|png|webp)$/i.test(x),isVid=x=>/\.(mp4|mov|m4v|webm)$/i.test(x)&&!/_raw_|_raw\./i.test(x);
const ls=d=>{try{return fs.readdirSync(d);}catch(e){return [];}};
const img={},vid={}; const aI=p=>{try{if(fs.existsSync(p)&&fs.statSync(p).size>1000)img[path.basename(p)]=1;}catch(e){}};
const aV=p=>{try{if(fs.existsSync(p)&&fs.statSync(p).size>5000)vid[path.basename(p)]=1;}catch(e){}};
for(const d of ls(PR))for(const x of ls(path.join(PR,d)))if(/^photo_/.test(x)&&isImg(x))aI(path.join(PR,d,x));
for(const x of ls(GEN))if(isImg(x))aI(path.join(GEN,x));
for(const x of ls(LOOKS))if(isImg(x))aI(path.join(LOOKS,x));
for(const d of ls(PROJETS)){for(const x of ls(path.join(PROJETS,d,'Photos')))if(isImg(x))aI(path.join(PROJETS,d,'Photos',x));}
for(const x of ls(OUT))if(isVid(x))aV(path.join(OUT,x));
for(const x of ls(GEN)){const fp=path.join(GEN,x);try{if(fs.statSync(fp).isDirectory())for(const y of ls(fp)){if(isVid(y))aV(path.join(fp,y));}else if(isVid(x))aV(fp);}catch(e){}}
for(const d of ls(PR))for(const x of ls(path.join(PR,d)))if(isVid(x))aV(path.join(PR,d,x));
for(const d of ls(PROJETS))for(const x of ls(path.join(PROJETS,d,'Vidéos')))if(isVid(x))aV(path.join(PROJETS,d,'Vidéos',x));
const INV=require('../ui/inventory'),r=INV.recents(BASE,persona);
console.log('Galerie images (distinct):',Object.keys(img).length);
console.log('Historique vidéo (distinct):',Object.keys(vid).length);
console.log('Récents projets:',(r.projets||[]).length,'| archives:',(r.archives||[]).length);

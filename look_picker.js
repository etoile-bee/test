// ============================================================
//  SOURCE UNIQUE DU CHOIX DE LOOK /*lookpick v1 — demande Etoile 07/06*/
//  Regle : proposer D'ABORD les looks les plus RECENTS jamais proposes,
//  puis aleatoire (en evitant le dernier) quand tout a ete vu.
//  Memoire : looks_history.json (supprimer ce fichier = tout redevient "nouveau").
//  Utilise par telegram_bot.js (RANDOM, AUTO, EXPRESS, MM) et workflow.js.
// ============================================================
const fs=require('fs'),path=require('path'),os=require('os');
const BASE=__dirname; // robuste : la ou vit le script
const HIST=path.join(BASE,'looks_history.json');

function pickLook(looksDir){
  let dir=looksDir||path.join(BASE,'looks');
  try{dir=fs.realpathSync(dir);}catch(e){}
  let files=[];
  try{files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));}catch(e){return null;}
  if(!files.length)return null;
  let hist=[];try{hist=JSON.parse(fs.readFileSync(HIST,'utf8'));if(!Array.isArray(hist))hist=[];}catch(e){}
  // tri par date d'ajout, du plus recent au plus ancien
  const sorted=files.map(f=>({f,t:(()=>{try{return fs.statSync(path.join(dir,f)).mtimeMs;}catch(e){return 0;}})()}))
    .sort((a,b)=>b.t-a.t).map(x=>x.f);
  // 1) priorite : le plus recent jamais propose
  let pick=sorted.find(f=>!hist.includes(f));
  // 2) sinon : aleatoire en evitant le dernier propose
  if(!pick){
    const last=hist[hist.length-1];
    const pool=sorted.length>1?sorted.filter(f=>f!==last):sorted;
    pick=pool[Math.floor(Math.random()*pool.length)];
  }
  hist.push(pick);if(hist.length>300)hist=hist.slice(-300);
  try{fs.writeFileSync(HIST,JSON.stringify(hist,null,1));}catch(e){}
  return path.join(dir,pick);
}

module.exports={ pickLook };

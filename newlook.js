// ============================================================
//  GENERATION DE LOOKS MEME VISAGE /*newlook v1*/
//  Higgsfield Soul + SoulID (reference de personnage creee depuis looks/references/)
//  Utilise par telegram_bot.js (/newlook). Le prompt par defaut vit dans newlook_prompt.txt.
// ============================================================
require('dotenv').config();
const fs=require('fs'),path=require('path');
const BASE=__dirname;
const PROMPT_FILE=path.join(BASE,'newlook_prompt.txt');
const ENV_PATH=path.join(BASE,'.env');

function looksDir(){try{return fs.realpathSync(path.join(BASE,'looks'));}catch(e){return path.join(BASE,'looks');}}
function refsDir(){ /*newlook v4 : priorite au dossier references/imany (LA reference officielle), sinon references/*/
  const im=path.join(looksDir(),'references','imany');
  try{if(fs.readdirSync(im).some(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)))return im;}catch(e){}
  return path.join(looksDir(),'references');
}
function pickRefFile(){ /*[p2] BLINDAGE : priorite ABSOLUE a un fichier nomme imany_reference.* (dans imany/ ou parent), le PLUS RECENT ; sinon la photo la plus recente*/
  const roots=[path.join(looksDir(),'references','imany'),path.join(looksDir(),'references')];
  const cands=[];
  for(const r of roots){try{for(const x of fs.readdirSync(r)){if(/\.(jpg|jpeg|png|webp)$/i.test(x)){const fp=path.join(r,x);let m=0;try{m=fs.statSync(fp).mtimeMs;}catch(e){}cands.push({fp,x,m});}}}catch(e){}}
  if(!cands.length)return null;
  const named=cands.filter(c=>/^imany_reference\.(jpe?g|png|webp)$/i.test(c.x)).sort((a,b)=>b.m-a.m); /*nom EXACT (un backup imany_reference_xxx ne capte pas la priorité)*/
  return (named[0]||cands.sort((a,b)=>b.m-a.m)[0]).fp;
}

function getClient(){
  const {HiggsfieldClient}=require('@higgsfield/client');
  /*newlook v2 : polling 20 min (la creation de SoulID depasse les 5 min par defaut)*/
  return new HiggsfieldClient({apiKey:process.env.HIGGSFIELD_KEY_ID,apiSecret:process.env.HIGGSFIELD_KEY_SECRET,maxPollTime:20*60*1000,pollInterval:5000});
}

function defaultPrompt(){
  try{const t=fs.readFileSync(PROMPT_FILE,'utf8').trim();if(t)return t;}catch(e){}
  return 'Stunning confident woman podcast host, elegant new outfit, luxury podcast studio, warm candlelight, bookshelf background, professional microphone, gold jewelry, photorealistic, cinematic lighting, 9:16 portrait';
}

const SOUL_NAME='imany-v2'; /*v2 : recree depuis LA photo de reference imany uniquement — l'ancienne ref (6 vieilles photos IMG du 31/05, mauvais visage) est abandonnee*/

function saveSoulId(id){
  let e=fs.readFileSync(ENV_PATH,'utf8');
  if(/^HIGGS_SOUL_ID=.*/m.test(e))e=e.replace(/^HIGGS_SOUL_ID=.*/m,'HIGGS_SOUL_ID='+id);
  else e+='\nHIGGS_SOUL_ID='+id+'\n';
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_SOUL_ID=id;
}

async function ensureSoulId(client,log){
  if(process.env.HIGGS_SOUL_ID)return process.env.HIGGS_SOUL_ID;
  /*newlook v2 : chercher un SoulID existant AVANT d'en recreer un (cas du timeout precedent — ne pas payer deux fois)*/
  try{
    const list=await client.listSoulIds(1,50);
    const items=(list&&list.soulIds)||(Array.isArray(list)?list:[]);
    const found=items.find(s=>s.name===SOUL_NAME&&s.isCompleted);
    const pending=items.find(s=>s.name===SOUL_NAME&&!s.isFailed);
    if(found){saveSoulId(found.id);log('Référence visage existante retrouvée ('+found.id+') — réutilisée.');return found.id;}
    if(pending){log('Référence visage en cours de création côté Higgsfield, attente...');await pending.poll(client.client||client,{maxPollTime:20*60*1000,pollInterval:5000});if(pending.isCompleted){saveSoulId(pending.id);return pending.id;}}
  }catch(e){log('(liste SoulID indisponible : '+e.message+' — création directe)');}
  log('Première fois : création de la référence visage depuis looks/references/ — jusqu\'à ~10 min');
  const dir=refsDir();
  const files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0,6);
  if(!files.length)throw new Error('aucune photo dans looks/references/');
  const urls=[];
  for(const f of files){
    /*newlook v2 : reduction a 1024px en jpeg avant upload (vos PNG de 15-19 Mo ralentissaient tout)*/
    let buf;const src=path.join(dir,f);const tmp='/tmp/nlref_'+Date.now()+'.jpg';
    try{
      require('child_process').execSync('sips -Z 1024 -s format jpeg "'+src+'" --out "'+tmp+'" 2>/dev/null || ffmpeg -y -i "'+src+'" -vf scale=1024:-2 -q:v 3 "'+tmp+'" 2>/dev/null');
      buf=fs.readFileSync(tmp);fs.unlinkSync(tmp);
    }catch(e){buf=fs.readFileSync(src);}
    urls.push(await client.uploadImage(buf,'jpeg'));
  }
  log(urls.length+' photos de référence envoyées (réduites), création du personnage...');
  const soul=await client.createSoulId({name:SOUL_NAME,input_images:urls.map(u=>({type:'image_url',image_url:u}))},true);
  if(!soul||!soul.id)throw new Error('création SoulID échouée');
  if(soul.isFailed)throw new Error('création SoulID en échec côté Higgsfield');
  saveSoulId(soul.id);
  log('Référence visage créée et mémorisée ('+soul.id+') — plus jamais à refaire.');
  return soul.id;
}

/*newlook v4 : lookbook.json = ADN visuel (categories generatives, decors, regles, recettes sauvegardees)*/
const LOOKBOOK=path.join(BASE,'lookbook.json');
function readLookbook(){return JSON.parse(fs.readFileSync(LOOKBOOK,'utf8'));}
function writeLookbook(lb){fs.writeFileSync(LOOKBOOK,JSON.stringify(lb,null,2));}

function buildPrompt(lb,opts){
  const cat=lb.categories[opts.category];
  const env=lb.envs[opts.env]||lb.envs.bougies;
  /*v6 : mode planche = UNE image contenant 3 poses du MEME look (sinon : un portrait par image)*/
  const pose=opts.mode==='planche'
    ?'One single image laid out as an editorial podcast contact sheet (mixed grid): several frames of the SAME woman in the SAME outfit, same accessories, same makeup, same hairstyle — MIX wide seated shots at the microphone (podcast ambiance, set visible) AND tighter chest-up close-ups, varied natural poses and head angles. Real podcast studio atmosphere in every frame. No text, no typography, thin frame separations only.'
    :lb.pose_rules;
  return defaultPrompt()
    +'\n\nOutfit: '+(opts.extra?opts.extra:(cat?cat.prompt:'Invent an elegant outfit.'))
    +'\n'+lb.style_rules
    +'\n'+(lb.texture_rules||'')
    +'\n'+(lb.realism_rules||'')
    +'\n'+env.prompt
    +'\n'+pose;
}

/*v8 : moteur SEEDREAM v4 (celui qu'Etoile utilise a la main, rendu valide) + reference photo directe — Soul abandonne*/
let _refUrl=null;
async function getRefUrl(client,log){
  if(_refUrl)return _refUrl;
  const refAbs=pickRefFile(); /*[p2] priorite imany_reference.* trie par date*/
  if(!refAbs)throw new Error('aucune photo dans looks/references/ (ni imany/)');
  const dir=path.dirname(refAbs);const f=path.basename(refAbs);
  log('reference : '+f);
  const tmp='/tmp/sdref_'+Date.now()+'.jpg';
  try{require('child_process').execSync('sips -Z 1536 -s format jpeg "'+path.join(dir,f)+'" --out "'+tmp+'" 2>/dev/null || ffmpeg -y -i "'+path.join(dir,f)+'" -vf scale=1536:-2 -q:v 2 "'+tmp+'" 2>/dev/null');}catch(e){}
  const buf=fs.readFileSync(fs.existsSync(tmp)?tmp:path.join(dir,f));
  try{fs.unlinkSync(tmp);}catch(e){}
  _refUrl=await client.uploadImage(buf,'jpeg');
  log('Photo de référence envoyée.');
  return _refUrl;
}
function archiveAll(urls,recipe){ /*TOUTES les generations sont gardees localement, selectionnees ou non*/
  try{
    const dir=path.join(BASE,'outputs','generations');
    fs.mkdirSync(dir,{recursive:true});
    const stamp=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    urls.forEach((u,i)=>{try{require('child_process').execSync('curl -s -o "'+path.join(dir,stamp+'_'+(recipe.category||'libre')+'_'+(i+1)+'.jpg')+'" "'+u+'"');}catch(e){}});
  }catch(e){}
}

// Genere selon le mode. opts={category, env, extra, mode:'eco'|'planche'|'hd'}. Retourne {urls, prompt, recipe}
async function generateLook(opts,log){
  log=log||console.log;
  opts=opts||{};
  const lb=readLookbook();
  const client=getClient();
  if(!lb.categories[opts.category]&&!opts.extra&&opts.category!=='random')opts.category=Object.keys(lb.categories)[0];
  const prompt=buildPrompt(lb,opts);
  const mode=opts.mode||'planche';
  const refUrl=await getRefUrl(client,log);
  /*v9 FINAL : /v1/text2image/seedream (schema revele par sonde : params.prompt + params.input_images) — meme client v1 que Kling/Soul*/
  log('moteur : seedream (/v1, reference imany)');
  const sdParams={
    prompt:prompt,
    input_images:[{type:'image_url',image_url:refUrl}],
    aspect_ratio:'9:16',
    batch_size:mode==='hd'?4:1
  };
  let jobSet=null,lastErr=null;
  try{
    jobSet=await client.generate('/v1/text2image/seedream',sdParams,{withPolling:true});
  }catch(e){lastErr=e;log('(seedream : '+(e.message||e)+')');}
  if(!jobSet)throw new Error('Seedream inaccessible — '+(lastErr&&lastErr.message||'erreur inconnue'));
  const jobs=(jobSet&&jobSet.jobs)||[];
  if(!jobs.length)throw new Error('réponse vide de Higgsfield');
  if(jobs.every(j=>j.status==='nsfw'))throw new Error('images refusées par la modération (crédits remboursés) — reformule');
  const urls=jobs.filter(j=>j.status==='completed'&&j.results).map(j=>(j.results.raw&&j.results.raw.url)||(j.results.min&&j.results.min.url)).filter(Boolean);
  if(!urls.length)throw new Error('génération échouée (statuts: '+jobs.map(j=>j.status).join(',')+')');
  const recipe={category:opts.category||null,env:opts.env||'bougies',extra:opts.extra||null,mode:mode,engine:'seedream-v4'};
  archiveAll(urls,recipe);
  return{urls:urls,prompt:prompt,recipe:recipe};
}

/*newlook v4 : catalogue 204 tenues + rotation anti-repetition (pas de doublon avant cycle complet ; conseil applique : jamais le meme look a moins de 12 videos)*/
const CATALOG=path.join(BASE,'outfits_catalog.json');
const OUT_HIST=path.join(BASE,'outfits_history.json');
function pickOutfit(category){
  const cat=JSON.parse(fs.readFileSync(CATALOG,'utf8')).outfits;
  let hist=[];try{hist=JSON.parse(fs.readFileSync(OUT_HIST,'utf8'));}catch(e){}
  let pool=cat.filter(o=>(!category||o.cat===category)&&!hist.includes(o.id));
  if(!pool.length){ // cycle complet → on repart, en evitant les 12 derniers
    const recent=hist.slice(-12);
    pool=cat.filter(o=>(!category||o.cat===category)&&!recent.includes(o.id));
  }
  const pick=pool[Math.floor(Math.random()*pool.length)];
  hist.push(pick.id);if(hist.length>400)hist=hist.slice(-400);
  try{fs.writeFileSync(OUT_HIST,JSON.stringify(hist));}catch(e){}
  return pick;
}

// Sauvegarde la recette d'un look garde → recreable via /look <numero>
function saveRecipe(recipe,file){
  const lb=readLookbook();
  const id=(lb.saved.length?Math.max(...lb.saved.map(s=>s.id)):0)+1;
  lb.saved.push({id:id,date:new Date().toISOString().slice(0,10),file:file,category:recipe.category,env:recipe.env,extra:recipe.extra});
  if(lb.saved.length>100)lb.saved=lb.saved.slice(-100);
  writeLookbook(lb);
  return id;
}
function getRecipe(id){const lb=readLookbook();return lb.saved.find(s=>s.id===+id);}
function listRecipes(){const lb=readLookbook();return lb.saved.slice(-15).reverse();}

/*probe v1 : decouverte GRATUITE des endpoints (body vide → 404 = inexistant, 4xx validation = existe, rien n'est genere)*/
async function probeEndpoints(){
  const fetch=require('node-fetch');
  const eps=['/v1/text2image/seedream','/v1/text2image/nano-banana'
  ];
  const out=[];
  for(const ep of eps){
    try{
      const r=await fetch('https://platform.higgsfield.ai'+(ep.startsWith('/')?ep:'/'+ep),{method:'POST',headers:{'Authorization':'Key '+process.env.HIGGSFIELD_KEY_ID+':'+process.env.HIGGSFIELD_KEY_SECRET,'Content-Type':'application/json'},body:'{"params":{}}'});
      let body='';try{body=(await r.text()).substring(0,1200);}catch(e){}
      out.push((r.status===404?'❌ ':'✅ ')+ep+' (HTTP '+r.status+')\n'+body+'\n');
    }catch(e){out.push('⚠️ '+ep+' ('+e.message+')');}
  }
  try{fs.writeFileSync(path.join(BASE,'probe_result.txt'),new Date().toISOString()+'\n'+out.join('\n'));}catch(e){} /*resultat lisible par Claude*/
  return out;
}

/*split v1 : decoupe une planche (3 cases verticales) en 3 images separees PRETES POUR LE LIPSYNC — gratuit, pixels identiques*/
async function splitPlanche(url){
  const cp=require('child_process');
  const src='/tmp/planche'+Date.now()+'.jpg';
  cp.execSync('curl -sL -o "'+src+'" "'+url+'"');
  if(!fs.existsSync(src)||fs.statSync(src).size<5000)throw new Error('telechargement planche echoue');
  const files=[];
  for(let i=0;i<3;i++){
    const out='/tmp/pose'+Date.now()+'_'+(i+1)+'.jpg';
    /*[B 9:16] chaque case recadrée en 9:16 NATIF (colonne centrale de la bande) puis normalisée 720x1280 — fini les bandes paysage*/
    cp.execSync('ffmpeg -y -i "'+src+'" -vf "crop=ih*3/16:ih/3:(iw-ih*3/16)/2:'+(i===0?'0':'ih*'+i+'/3')+',scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1" -q:v 2 "'+out+'" 2>/dev/null');
    if(fs.existsSync(out)&&fs.statSync(out).size>3000)files.push(out);
  }
  if(files.length<3)throw new Error('decoupage incomplet ('+files.length+'/3)');
  return files;
}

/*recreate v1 : recree UNE case de la planche en portrait 9:16 natif (pret lipsync) — la case decoupee sert de reference (fidelite max)*/
async function recreatePose(plancheUrl,frameIdx,log){
  log=log||console.log;
  const cp=require('child_process');
  const src='/tmp/pl_'+Date.now()+'.jpg';
  cp.execSync('curl -sL -o "'+src+'" "'+plancheUrl+'"');
  const crop='/tmp/crop_'+Date.now()+'.jpg';
  cp.execSync('ffmpeg -y -i "'+src+'" -vf "crop=iw:ih/3:0:'+(frameIdx===0?'0':'ih*'+frameIdx+'/3')+'" -q:v 2 "'+crop+'" 2>/dev/null');
  if(!fs.existsSync(crop)||fs.statSync(crop).size<3000)throw new Error('extraction de la case '+(frameIdx+1)+' echouee');
  const client=getClient();
  const cropUrl=await client.uploadImage(fs.readFileSync(crop),'jpeg');
  log('Recréation de la pose '+(frameIdx+1)+' en 9:16…');
  const jobSet=await client.generate('/v1/text2image/seedream',{
    prompt:'Recreate this exact image as ONE single full-bleed 9:16 vertical portrait: same woman, same face, same outfit, same accessories, same makeup, same hairstyle, same pose, same studio and lighting. '+defaultPrompt(),
    input_images:[{type:'image_url',image_url:cropUrl}],
    aspect_ratio:'9:16',
    batch_size:1
  },{withPolling:true});
  const job=jobSet&&jobSet.jobs&&jobSet.jobs[0];
  if(!job||job.status!=='completed'||!job.results)throw new Error('recréation échouée ('+(job&&job.status)+')');
  const url=(job.results.raw&&job.results.raw.url)||(job.results.min&&job.results.min.url);
  if(!url)throw new Error('pas d URL');
  archiveAll([url],{category:'recreate-9x16'});
  return url;
}

module.exports={ recreatePose, splitPlanche, generateLook, defaultPrompt, looksDir, readLookbook, saveRecipe, getRecipe, listRecipes, pickOutfit, probeEndpoints };

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
    ?'One single image laid out as a clean 3-frame vertical contact sheet: THREE different natural poses of the SAME woman in the SAME outfit, same accessories, same makeup, same hairstyle — facing camera, three-quarter view, slight profile. No text, no typography, thin black frame separations only. Hands out of frame. Chest-up framing, engaged eye contact.'
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
  const dir=refsDir();
  const f=fs.readdirSync(dir).filter(x=>/\.(jpg|jpeg|png|webp)$/i.test(x))[0];
  if(!f)throw new Error('aucune photo dans looks/references/imany/');
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
  const {higgsfield,config}=require('@higgsfield/client/v2');
  config({credentials:process.env.HIGGSFIELD_KEY_ID+':'+process.env.HIGGSFIELD_KEY_SECRET});
  /*seedream v4 edit : prompt + photo de reference = le process manuel exact d'Etoile*/
  /*format officiel (client Python Higgsfield) : arguments prompt/resolution/aspect_ratio ; edit = avec image de base*/
  const endpoints=['bytedance/seedream/v4/edit','bytedance/seedream/v4/image-to-image','bytedance/seedream/v4/text-to-image'];
  let lastErr=null,jobSet=null;
  for(const ep of endpoints){
    try{
      const input={
        prompt:prompt,
        aspect_ratio:'9:16',
        resolution:mode==='hd'?'2K':'1K',
        batch_size:mode==='hd'?4:1
      };
      if(ep!=='bytedance/seedream/v4/text-to-image')input.input_images=[{type:'image_url',image_url:refUrl}];
      else input.prompt='Use this exact woman as reference: '+refUrl+'\n'+prompt; /*dernier recours si pas d'endpoint edit*/
      jobSet=await higgsfield.subscribe(ep,{input:input,withPolling:true});
      if(jobSet){log('moteur : seedream v4 ('+ep.split('/').pop()+')');break;}
    }catch(e){lastErr=e;log('('+ep.split('/').pop()+' : '+(e.message||e)+')');}
  }
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
      const r=await fetch('https://platform.higgsfield.ai'+(ep.startsWith('/')?ep:'/'+ep),{method:'POST',headers:{'Authorization':'Key '+process.env.HIGGSFIELD_KEY_ID+':'+process.env.HIGGSFIELD_KEY_SECRET,'Content-Type':'application/json'},body:'{}'});
      let body='';try{body=(await r.text()).substring(0,1200);}catch(e){}
      out.push((r.status===404?'❌ ':'✅ ')+ep+' (HTTP '+r.status+')\n'+body+'\n');
    }catch(e){out.push('⚠️ '+ep+' ('+e.message+')');}
  }
  try{fs.writeFileSync(path.join(BASE,'probe_result.txt'),new Date().toISOString()+'\n'+out.join('\n'));}catch(e){} /*resultat lisible par Claude*/
  return out;
}

module.exports={ generateLook, defaultPrompt, looksDir, readLookbook, saveRecipe, getRecipe, listRecipes, pickOutfit, probeEndpoints };

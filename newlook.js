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
function refsDir(){return path.join(looksDir(),'references');}

function getClient(){
  const {HiggsfieldClient}=require('@higgsfield/client');
  /*newlook v2 : polling 20 min (la creation de SoulID depasse les 5 min par defaut)*/
  return new HiggsfieldClient({apiKey:process.env.HIGGSFIELD_KEY_ID,apiSecret:process.env.HIGGSFIELD_KEY_SECRET,maxPollTime:20*60*1000,pollInterval:5000});
}

function defaultPrompt(){
  try{const t=fs.readFileSync(PROMPT_FILE,'utf8').trim();if(t)return t;}catch(e){}
  return 'Stunning confident woman podcast host, elegant new outfit, luxury podcast studio, warm candlelight, bookshelf background, professional microphone, gold jewelry, photorealistic, cinematic lighting, 9:16 portrait';
}

const SOUL_NAME='influenceuse-podcast';

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

/*newlook v3 : 3 environnements (recherches formats viraux 2026 : quiet luxury / studio realiste) + 4 poses par generation*/
const ENVS={
  bougies:{label:'🕯 Bougies (actuel)',text:'Environment: same luxury podcast studio as the reference image — dark moody library, bookshelves, warm candlelight glow, professional microphone in front of her.'},
  jour:{label:'☀️ Lumière du jour',text:'Environment: bright airy creator studio in soft natural daylight — large windows, sheer curtains, neutral cream and beige tones, minimalist elevated interior, a few green plants, professional podcast microphone on a boom arm in front of her. Quiet luxury aesthetic, clean and aspirational.'},
  studio:{label:'🎙 Studio podcast réaliste',text:'Environment: realistic professional podcast studio — warm wooden slat wall, subtle acoustic panels, soft warm LED accent lighting, professional boom-arm microphone and studio headphones on the table, shallow depth of field with cozy plants and soft string lights blurred in the background.'}
};

// Genere 4 poses. Retourne {urls:[...], prompt}. opts={env:'bougies'|'jour'|'studio', extra:texte libre optionnel}
async function generateLook(opts,log){
  log=log||console.log;
  opts=opts||{};
  const client=getClient();
  const soulId=await ensureSoulId(client,log);
  const env=ENVS[opts.env]?opts.env:'bougies';
  const prompt=defaultPrompt()+'\n'+ENVS[env].text+(opts.extra?'\n'+opts.extra:'')+'\nGenerate a different natural pose and head angle for each image.';
  const jobSet=await client.generate('/v1/text2image/soul',{
    prompt:prompt,
    custom_reference_id:soulId,
    custom_reference_strength:1,
    width_and_height:'1536x2048',
    quality:'1080p',
    batch_size:4
  },{withPolling:true});
  const jobs=(jobSet&&jobSet.jobs)||[];
  if(!jobs.length)throw new Error('réponse vide de Higgsfield');
  if(jobs.every(j=>j.status==='nsfw'))throw new Error('images refusées par la modération (crédits remboursés) — reformule');
  const urls=jobs.filter(j=>j.status==='completed'&&j.results).map(j=>(j.results.raw&&j.results.raw.url)||(j.results.min&&j.results.min.url)).filter(Boolean);
  if(!urls.length)throw new Error('génération échouée (statuts: '+jobs.map(j=>j.status).join(',')+')');
  return{urls:urls,prompt:prompt,env:env};
}

module.exports={ generateLook, defaultPrompt, looksDir, ENVS };

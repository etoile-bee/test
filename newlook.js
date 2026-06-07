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
  return new HiggsfieldClient({apiKey:process.env.HIGGSFIELD_KEY_ID,apiSecret:process.env.HIGGSFIELD_KEY_SECRET});
}

function defaultPrompt(){
  try{const t=fs.readFileSync(PROMPT_FILE,'utf8').trim();if(t)return t;}catch(e){}
  return 'Stunning confident woman podcast host, elegant new outfit, luxury podcast studio, warm candlelight, bookshelf background, professional microphone, gold jewelry, photorealistic, cinematic lighting, 9:16 portrait';
}

async function ensureSoulId(client,log){
  if(process.env.HIGGS_SOUL_ID)return process.env.HIGGS_SOUL_ID;
  log('Première fois : création de la référence visage (SoulID) depuis looks/references/ — ~1-2 min');
  const dir=refsDir();
  const files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0,6);
  if(!files.length)throw new Error('aucune photo dans looks/references/');
  const urls=[];
  for(const f of files){
    const buf=fs.readFileSync(path.join(dir,f));
    const fmt=/png$/i.test(f)?'png':/webp$/i.test(f)?'webp':'jpeg';
    urls.push(await client.uploadImage(buf,fmt));
  }
  log(urls.length+' photos de référence envoyées, création du personnage...');
  const soul=await client.createSoulId({name:'influenceuse-podcast',input_images:urls.map(u=>({type:'image_url',image_url:u}))},true);
  if(!soul||!soul.id)throw new Error('création SoulID échouée');
  let e=fs.readFileSync(ENV_PATH,'utf8');
  if(/^HIGGS_SOUL_ID=.*/m.test(e))e=e.replace(/^HIGGS_SOUL_ID=.*/m,'HIGGS_SOUL_ID='+soul.id);
  else e+='\nHIGGS_SOUL_ID='+soul.id+'\n';
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_SOUL_ID=soul.id;
  log('Référence visage créée et mémorisée ('+soul.id+') — plus jamais à refaire.');
  return soul.id;
}

// Genere UN look. Retourne {url, prompt}. log(msg) = retours de progression.
async function generateLook(promptText,log){
  log=log||console.log;
  const client=getClient();
  const soulId=await ensureSoulId(client,log);
  const prompt=promptText||defaultPrompt();
  const jobSet=await client.generate('/v1/text2image/soul',{
    prompt:prompt,
    custom_reference_id:soulId,
    custom_reference_strength:1,
    width_and_height:'1536x2048',
    quality:'1080p',
    batch_size:1
  },{withPolling:true});
  const job=jobSet&&jobSet.jobs&&jobSet.jobs[0];
  if(!job)throw new Error('réponse vide de Higgsfield');
  if(job.status==='nsfw')throw new Error('image refusée par la modération (crédits remboursés) — reformule le prompt');
  if(job.status!=='completed'||!job.results)throw new Error('génération échouée (status: '+job.status+')');
  const url=(job.results.raw&&job.results.raw.url)||(job.results.min&&job.results.min.url);
  if(!url)throw new Error('pas d\'URL dans le résultat');
  return{url:url,prompt:prompt};
}

module.exports={ generateLook, defaultPrompt, looksDir };

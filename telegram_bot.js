require('dotenv').config();
const {spawn}=require('child_process');
const fetch=require('node-fetch');
const fs=require('fs');
const path=require('path');
const os=require('os');

const TOKEN=process.env.TELEGRAM_TOKEN;
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID);
const BASE=path.join(os.homedir(),'podcast-workflow');
const LOOKS=path.join(BASE,'looks');
const ENV_PATH=path.join(BASE,'.env');
const LIBRARY=path.join(BASE,'library.json');

let proc=null,offset=0;let testProc=null; /*cmdtest v1*/
let lastMenuDay=''; // menu principal auto à la 1ère interaction du jour
let state='idle';
let setup={topic:null,photo:null,duration:'25s'};
let autoAnswers=[];let isAuto=false;
let scriptBuf='',collectScript=false;

// ── Telegram helpers ──────────────────────────────────────────────────────────
async function tg(method,body,isForm){
  if(isForm){
    const r=await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`,{method:'POST',body:isForm});
    return r.json();
  }
  const r=await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:CHAT_ID,...body})
  });
  return r.json();
}
function kb(rows){return {reply_markup:{inline_keyboard:rows}};}
async function send(text,rows){return tg('sendMessage',{text,parse_mode:'HTML',...(rows?kb(rows):{})} );}
async function sendImg(fp,caption){
  if(fp&&fp.startsWith('http')){
    return tg('sendPhoto',{photo:fp,caption:caption||''});
  }
  try{
    // sendImg auto-compress : reduit toute image locale > 9 Mo avant envoi
    try{
      const st=fs.statSync(fp);
      if(st.size>9000000){
        const small='/tmp/prev'+Date.now()+'.jpg';
        require('child_process').execSync('sips -Z 1280 -s format jpeg "'+fp+'" --out "'+small+'" 2>/dev/null');
        if(fs.existsSync(small)&&fs.statSync(small).size<10485760)fp=small;
      }
    }catch(e){}
    const FormData=require('form-data');
    const form=new FormData();
    form.append('chat_id',CHAT_ID);
    // Read as buffer to avoid iCloud stream issues
    const buf=fs.readFileSync(fp);
    form.append('photo',buf,{filename:'look.jpg',contentType:'image/jpeg'});
    if(caption)form.append('caption',caption);
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendPhoto',{method:'POST',body:form});
    const d=await r.json();
    if(!d.ok){console.error('sendImg fail:',d.description);}
    return d;
  }catch(e){
    console.error('sendImg error:',e.message,fp);
    return tg('sendMessage',{text:(caption||'📸')+' (preview unavailable)'});
  }
}
async function sendVid(fp){
  const FormData=require('form-data');
  const f=new FormData();
  f.append('chat_id',CHAT_ID);
  f.append('video',fs.createReadStream(fp));
  f.append('supports_streaming','true');
  f.append('caption','🎬 Video ready!');
  f.append('reply_markup',JSON.stringify({inline_keyboard:[[{text:'💾 Enregistrer (fichier)',callback_data:'SAVE_VID'}]]}));
  const r=await tg('sendVideo',null,f);
  if(!r.ok){
    const f2=new FormData();
    f2.append('chat_id',CHAT_ID);
    f2.append('document',fs.createReadStream(fp));
    f2.append('caption','🎬 Video ready!');
    return tg('sendDocument',null,f2);
  }
  return r;
}
async function answerCB(id){return tg('answerCallbackQuery',{callback_query_id:id});}

// ── Look helpers ──────────────────────────────────────────────────────────────
function resolveImg(p){
  if(!p)return null;
  try{
    if(fs.existsSync(p))return p;
    return fs.realpathSync(p);
  }catch{return null;}
}
function getLooksDir(){
  try{return fs.realpathSync(LOOKS);}catch{return LOOKS;}
}
function pickRandom(){ /*lookpick v1 : nouveautes d'abord, via source unique look_picker.js*/
  try{return require('./look_picker.js').pickLook(getLooksDir());}catch{return null;}
}
function setAvatar(fp){ // setAvatar robuste : crée la ligne si absente
  let e=fs.readFileSync(ENV_PATH,'utf8');
  if(/^HIGGS_AVATAR_URL=.*/m.test(e)){
    e=e.replace(/^HIGGS_AVATAR_URL=.*/m,'HIGGS_AVATAR_URL='+fp);
  }else{
    if(e.length&&!e.endsWith('\n'))e+='\n';
    e+='HIGGS_AVATAR_URL='+fp+'\n';
  }
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_AVATAR_URL=fp;
}
async function dlPhoto(fileId){
  const r=await tg('getFile',{file_id:fileId});
  const url=`https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
  const img=await fetch(url);
  const buf=await img.buffer();
  const fname='tg_'+Date.now()+'.jpg';
  const fp=path.join(getLooksDir(),fname);
  fs.writeFileSync(fp,buf);
  return fp;
}
// ── Galerie de looks ────────────────────────────────────────────────────────────
function trashDir(){const t=path.join(getLooksDir(),'_trash');try{fs.mkdirSync(t,{recursive:true});}catch(e){}return t;}
function looksList(){try{return fs.readdirSync(getLooksDir()).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&!f.startsWith('.')&&!f.startsWith('_')).sort();}catch(e){return[];}}
function tsName(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes());}
async function dlPhotoNamed(fileId,name){
  const r=await tg('getFile',{file_id:fileId});
  const url=`https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
  const buf=await (await fetch(url)).buffer();
  const fp=path.join(getLooksDir(),name);
  fs.writeFileSync(fp,buf);return fp;
}
// envoie une photo locale AVEC boutons inline
async function sendPhotoKb(fp,caption,rows){
  try{
    let f=fp;
    try{const st=fs.statSync(fp);if(st.size>9000000){const small='/tmp/prev'+Date.now()+'.jpg';require('child_process').execSync('sips -Z 1280 -s format jpeg "'+fp+'" --out "'+small+'" 2>/dev/null');if(fs.existsSync(small))f=small;}}catch(e){}
    const FormData=require('form-data');const form=new FormData();
    form.append('chat_id',CHAT_ID);
    form.append('photo',fs.readFileSync(f),{filename:'look.jpg',contentType:'image/jpeg'});
    if(caption){form.append('caption',caption);form.append('parse_mode','HTML');}
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendPhoto',{method:'POST',body:form});
    return r.json();
  }catch(e){console.error('sendPhotoKb',e.message);return send((caption||'📸')+' (image indisponible)',rows);}
}
let gal={files:[],idx:0};
let galForRecap=false; // galerie ouverte depuis la carte récap -> bouton « Choisir pour la vidéo »
let pendingPhotoId=null; // dernière photo reçue hors flux (pour « ajouter aux looks »)
async function showLook(){
  gal.files=looksList();
  if(!gal.files.length){await send('📭 Aucun look dans <code>looks/</code>. Envoie-moi une photo pour en ajouter un.',[[{text:'◀️ Menu',callback_data:'MAIN_MENU'}]]);return;}
  if(gal.idx<0)gal.idx=gal.files.length-1; if(gal.idx>=gal.files.length)gal.idx=0;
  const name=gal.files[gal.idx];const fp=path.join(getLooksDir(),name);
  // iCloud : télécharge si placeholder/manquant (sync) + petite attente
  let sz=0;try{sz=fs.existsSync(fp)?fs.statSync(fp).size:0;}catch(e){}
  if(sz<30000){try{require('child_process').execSync('brctl download "'+fp+'" 2>/dev/null');}catch(e){}try{sz=fs.existsSync(fp)?fs.statSync(fp).size:0;}catch(e){}}
  const rows=[
    [{text:'◀️',callback_data:'GAL_PREV'},{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🗑',callback_data:'GAL_DEL'},{text:'▶️',callback_data:'GAL_NEXT'}],
  ];
  if(galForRecap){rows.push([{text:'✅ Choisir pour la vidéo',callback_data:'GAL_PICK'}]);rows.push([{text:'◀️ Récap',callback_data:'RC_BACK'}]);}
  else {rows.push([{text:'🎨 Éditer ce look',callback_data:'GAL_EDIT'},{text:'🎬 Générer avec',callback_data:'GAL_GEN'}]);rows.push([{text:'◀️ Menu',callback_data:'MAIN_MENU'}]);}
  if(sz<1000){ // toujours indisponible (placeholder iCloud non téléchargé)
    await send(`⚠️ Look ${gal.idx+1}/${gal.files.length} : <b>${name}</b>\nImage pas encore téléchargée depuis iCloud. Ouvre-la une fois dans l'app Fichiers, ou ◀️ ▶️ pour la suivante.`,rows);return;
  }
  const r=await sendPhotoKb(fp,`🖼 Look ${gal.idx+1}/${gal.files.length}\n${name}`,rows);
  if(!(r&&r.ok)){ // sendPhoto a échoué (format/poids) -> fallback texte clair
    await send(`⚠️ Look ${gal.idx+1}/${gal.files.length} : <b>${name}</b>\nAperçu indisponible (${fmtSize(sz)}). Utilise les boutons ci-dessous.`,rows);
  }
}

// ── Setup flow ────────────────────────────────────────────────────────────────
const TOPIC_IDEAS=[
  ['💔 Red flags','Why you keep attracting toxic men'],
  ['🔗 Attachment','Anxious attachment is ruining your love life'],
  ['✨ Self-worth','Stop shrinking yourself for men who don\'t deserve you'],
  ['💪 Healing','How to stop missing someone who hurt you'],
  ['🎯 Dating','The dating mistake every woman makes'],
  ['🌙 Situationship','You\'re not his girlfriend. You\'re his option.'],
  ['💎 Soft life','Feminine energy and why men chase you less when you chase them'],
];

async function step1_topic(){
  state='setup_topic';
  setup={topic:null,photo:null,duration:'25s'};
  await send('🎬 <b>New Video — Step 1/3: Topic</b>\n\nType your own or choose a theme:',[
    [{text:'🎲 Auto-pick',callback_data:'T_AUTO'}],
    [{text:TOPIC_IDEAS[0][0],callback_data:'T_0'},{text:TOPIC_IDEAS[1][0],callback_data:'T_1'},{text:TOPIC_IDEAS[2][0],callback_data:'T_2'}],
    [{text:TOPIC_IDEAS[3][0],callback_data:'T_3'},{text:TOPIC_IDEAS[4][0],callback_data:'T_4'},{text:TOPIC_IDEAS[5][0],callback_data:'T_5'}],
    [{text:TOPIC_IDEAS[6][0],callback_data:'T_6'}],
  ]);
}
async function step2_look(){
  const lDir=require('path').join(require('os').homedir(),'podcast-workflow','looks');try{const _pp=require('./look_picker.js').pickLook(lDir);if(_pp){setup.photo=_pp;setAvatar(setup.photo);/*lookpick v1*/const tmp='/tmp/lk'+Date.now()+'.jpg';try{require('child_process').execSync('sips -Z 800 -s format jpeg "'+setup.photo+'" --out "'+tmp+'" 2>/dev/null');await sendImg(tmp,'\U0001f4f8 Step 1/3 — Look').catch(()=>{});}catch{}}}catch(e){}
  state='setup_look';
  //  const cur=process.env.HIGGS_AVATAR_URL||null;
  //  if(cur){try{if(cur.startsWith('http')){await sendImg(cur,'Current look').catch(()=>{});}else{const tc='/tmp/cur'+Date.now()+'.jpg';require('child_process').execSync('sips -Z 800 -s format jpeg "'+cur+'" --out "'+tc+'" 2>/dev/null');await sendImg(tc,'Current look').catch(()=>{});}}catch{}}
  await send('📸 <b>Step 2/3: Look</b>\n\nKeep current or pick a new one:',[
    [{text:'✅ Keep current',callback_data:'L_KEEP'},{text:'🎲 Random',callback_data:'L_RANDOM'}],
    [{text:'📷 Upload a photo',callback_data:'L_UPLOAD'}],
  ]);
}
async function pickAndShow(){
  state='setup_look';
  const p=pickRandom();
  if(!p){await send('No looks found');await step3_duration();return;}
  setup.photo=p;
  const tmp='/tmp/lk'+Date.now()+'.jpg';
  try{
    require('child_process').execSync('sips -Z 800 -s format jpeg "'+p+'" --out "'+tmp+'" 2>/dev/null');
    await sendImg(tmp,'Like this look?');
  }catch(e){
    console.error('preview fail:',e.message);
    await send('Look: '+require('path').basename(p));
  }
  await send('Keep or pick another?',[
    [{text:'Use this look',callback_data:'L_KEEP'},{text:'Pick another',callback_data:'L_RANDOM'}],
  ]);
}
async function step3_duration(){
  state='setup_dur';
  await send('⏱ <b>Step 3/3: Duration</b>',[
    [{text:'Short 0-25s',callback_data:'D_25'},{text:'Medium 25-40s',callback_data:'D_40'},{text:'Long 40-65s',callback_data:'D_65'}],
  ]);
}
async function showSummary(){
  state='setup_confirm';
  const t=setup.topic||'🎲 Auto-pick';
  const p=setup.photo?path.basename(setup.photo).substring(0,30):'(current)';
  const d=setup.duration;
  // Show look preview
  const previewPath=setup.photo||(process.env.HIGGS_AVATAR_URL||null);
  if(previewPath){
    const rp=resolveImg(previewPath);
    if(rp)await sendImg(rp,'📸 Look for this video').catch(()=>{});
  }
  await send(`✅ <b>Ready to generate!</b>\n\n📌 Topic: ${t}\n📸 Look: ${p}\n⏱ Duration: ${d}`,[
    [{text:'▶️ Start now',callback_data:'GO'},{text:'🔀 Change topic',callback_data:'CHG_TOPIC'}],
    [{text:'📸 Change look',callback_data:'CHG_LOOK'},{text:'❌ Cancel',callback_data:'CANCEL'}],
  ]);
}

// ── Manual mode (nouveau) ───────────────────────────────────────────────────
async function mDur(){
  state='m_dur';
  await send('⏱️ 2/4 — DURÉE',[
    [{text:'10s',callback_data:'MM_DUR_10'},{text:'20s',callback_data:'MM_DUR_20'},{text:'30s',callback_data:'MM_DUR_30'}],
    [{text:'40s',callback_data:'MM_DUR_40'},{text:'60s',callback_data:'MM_DUR_60'}],
    [{text:'⌨️ Autre durée (taper en sec)',callback_data:'MM_DUR_FREE'}],
  ]);
}
async function mTopicStub(){
  await send('✅ Durée: '+setup.duration+'. (TOPIC à la prochaine étape)');
}
const MCATS={
  redflags:'💔 Red flags & schémas toxiques',
  attach:'🔗 Attachement & anxiété',
  worth:'✨ Estime de soi & confiance',
  healing:'💪 Rupture & guérison',
  situ:'🌙 Situationships & jeux de dating',
  feminine:'💎 Énergie féminine & soft life',
};
const ANGLES=[
  'un red flag déguisé en geste romantique',
  'une phrase typique que dit un homme toxique',
  'une opinion clivante que peu osent dire',
  'un mythe romantique répandu à démonter',
  'une vérité dure que personne ne dit',
  'un déclic empowerment qui change tout',
  'une bascule vers la soft life et le calme',
  'un standard non négociable à poser sans culpabiliser',
  'une punchline drôle et cash sur le dating',
  'une observation absurde et comique sur les hommes',
  'un storytime à la première personne',
  'un POV vécu très spécifique',
  'une comparaison inattendue',
  'un chiffre ou une statistique choc',
  'un scénario ultra-spécifique du quotidien',
  'un callout direct et bienveillant à la spectatrice',
  'un avant après transformation personnelle',
  'une question rhétorique qui dérange',
  'un conseil à contre-courant des clichés',
  'une scène de texto que tout le monde reconnaît',
];
const TOPIC_HIST_FILE=require('path').join(require('os').homedir(),'podcast-workflow','topic_history.json');
let RECENT_TOPICS=[];
try{ RECENT_TOPICS=JSON.parse(require('fs').readFileSync(TOPIC_HIST_FILE,'utf8'))||[]; }catch(e){ RECENT_TOPICS=[]; }
function saveTopicHist(){ try{ require('fs').writeFileSync(TOPIC_HIST_FILE, JSON.stringify(RECENT_TOPICS.slice(-200))); }catch(e){} }
function overusedWords(){
  const freq={};
  RECENT_TOPICS.forEach(function(t){ String(t).toLowerCase().split(/[^a-zàâäéèêëîïôöùûüçœ]+/).forEach(function(w){ if(w.length>4){ freq[w]=(freq[w]||0)+1; } }); });
  return Object.keys(freq).filter(function(w){ return freq[w]>=2; }).sort(function(a,b){ return freq[b]-freq[a]; }).slice(0,15);
}
let TOPIC_QUEUE=[];
let QUEUE_KEY=null;
function normTopic(s){ return String(s).toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüçœ ]+/g,'').replace(/\s+/g,' ').trim(); }
async function genTopicBatch(catLabel){
  try{
    const Anthropic=require('@anthropic-ai/sdk');
    const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const cat=catLabel?(' Catégorie imposée: "'+catLabel+'".'):'';
    const recent=RECENT_TOPICS.slice(-60);
    const avoid=recent.length?(' Sujets DÉJÀ utilisés, à éviter (thèmes ET mots): '+recent.join(' | ')+'.'):'';
    const ban=overusedWords();
    const banTxt=ban.length?(' Mots déjà trop utilisés, INTERDITS: '+ban.join(', ')+'.'):'';
    const angs=ANGLES.slice().sort(function(){return Math.random()-0.5;}).slice(0,8).join(' ; ');
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:500,temperature:1,
      messages:[{role:'user',content:'Tu es scénariste TikTok pour une coach en relations (femmes 20-40).'+cat+' Donne EXACTEMENT 8 sujets viraux, courts et ultra-percutants, max 12 mots chacun. Chaque sujet DOIT être radicalement différent des autres (thème ET vocabulaire ET premier mot). Varie les angles, par ex: '+angs+'. Hooks qui stoppent le scroll, ton cash et spécifique. Évite les formulations génériques et les débuts en Pourquoi ou Comment. UN sujet par ligne, sans numéro, sans tiret, sans guillemets.'+avoid+banTxt}]});
    return r.content[0].text.trim().split(/\n+/).map(function(s){return s.replace(/^[\s\-\d\.\)]+/,'').replace(/^["']|["']$/g,'').trim();}).filter(function(s){return s.length>0;});
  }catch(e){return [];}
}
async function genTopic(catLabel){
  const key=catLabel||'__free__';
  if(QUEUE_KEY!==key){ TOPIC_QUEUE=[]; QUEUE_KEY=key; }
  if(TOPIC_QUEUE.length===0){
    const batch=await genTopicBatch(catLabel);
    const seen={};
    RECENT_TOPICS.forEach(function(t){ seen[normTopic(t)]=true; });
    batch.forEach(function(t){ const n=normTopic(t); if(n && !seen[n]){ seen[n]=true; TOPIC_QUEUE.push(t); } });
  }
  if(TOPIC_QUEUE.length===0) return null;
  const t=TOPIC_QUEUE.shift();
  RECENT_TOPICS.push(t); if(RECENT_TOPICS.length>200)RECENT_TOPICS.shift(); saveTopicHist();
  return t;
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function mTopicShow(){
  state='m_topic';
  const head=setup.topicCat?('📂 '+escHtml(MCATS[setup.topicCat])+'\n\n'):'';
  await send('💬 <b>3/4 — TOPIC</b>\n\n'+head+(setup.topic?('« '+escHtml(setup.topic)+' »'):'(none)'),[
    [{text:'✅ Keep',callback_data:'MM_TOPIC_KEEP'},{text:'🔄 New',callback_data:'MM_TOPIC_NEW'}],
    [{text:'✍️ Send',callback_data:'MM_TOPIC_SEND'},{text:'📂 Categories',callback_data:'MM_TOPIC_CATS'}],
  ]);
}
async function mTopic(catId){
  if(catId!==undefined)setup.topicCat=catId;
  await send('💭 Generating topic...');
  const t=await genTopic(setup.topicCat?MCATS[setup.topicCat]:null);
  if(t)setup.topic=t;
  await mTopicShow();
}
async function mCats(){
  await send('📂 <b>Choose a category:</b>',[
    [{text:MCATS.redflags,callback_data:'MM_CAT_redflags'}],
    [{text:MCATS.attach,callback_data:'MM_CAT_attach'}],
    [{text:MCATS.worth,callback_data:'MM_CAT_worth'}],
    [{text:MCATS.healing,callback_data:'MM_CAT_healing'}],
    [{text:MCATS.situ,callback_data:'MM_CAT_situ'}],
    [{text:MCATS.feminine,callback_data:'MM_CAT_feminine'}],
    [{text:'🎲 Random (free topic)',callback_data:'MM_CAT_random'}],
  ]);
}
async function mRecapStub(){
  await send('✅ Topic gardé. (RÉCAP à la prochaine étape)');
}
async function genScript(){
  try{
    const Anthropic=require('@anthropic-ai/sdk');
    const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const dur=parseInt(setup.duration)||30;
    const words=dur<=10?'25-30':dur<=20?'50-60':dur<=30?'75-90':dur<=40?'100-120':'150-180';
    const t=setup.topic||'relationship red flags women should know';
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:400,
      messages:[{role:'user',content:'TikTok script for relationship coach women 20-40. Topic: "'+t+'". EXACTLY '+words+' words. Shocking hook first. Max 8 words per sentence. Add [pause] after hook. No em dashes. Return ONLY the script, nothing else.'}]});
    return r.content[0].text.trim();
  }catch(e){return null;}
}
async function mRecap(){
  state='m_recap';
  if(!setup.script){
    await send('📝 Writing the script...');
    const s=await genScript();
    if(s){ setup.script=s.replace(/\[pause\]/gi,'').trim(); }
    else { await send('⚠️ Script not generated. Regenerate via ⚙️ EDIT → Script.'); }
  }
  const lookLabel=setup.photo?require('path').basename(setup.photo):'(none)';
  const catLabel=setup.topicCat?(' ('+MCATS[setup.topicCat]+')'):'';
  if(setup.photo){ const rp=(typeof resolveImg==='function')?resolveImg(setup.photo):setup.photo; if(rp)await sendImg(rp,'🖼️ Look').catch(()=>{}); }
  const scr=setup.script?escHtml(setup.script):'(none)';
  await send('📋 <b>4/4 — RECAP /*recap-en v1*/</b>\n\n🖼️ Look: '+escHtml(lookLabel)+'\n⏱️ Duration: '+escHtml(setup.duration||'?')+'\n💬 Topic: '+escHtml(setup.topic||'?')+escHtml(catLabel)+'\n\n📝 <b>Script:</b>\n'+scr,[
    [{text:'✅ START',callback_data:'MM_START'},{text:'🔄 NEW',callback_data:'MM_NEW'}],
    [{text:'⚙️ EDIT',callback_data:'MM_EDIT'},{text:'❌ CANCEL',callback_data:'MM_CANCEL'}],
  ]);
}
async function mEditMenu(){
  await send('⚙️ <b>EDIT — what to change?</b>',[
    [{text:'🖼️ Look',callback_data:'MM_EDIT_LOOK'},{text:'⏱️ Duration',callback_data:'MM_EDIT_DUR'}],
    [{text:'💬 Topic',callback_data:'MM_EDIT_TOPIC'},{text:'📝 Script',callback_data:'MM_EDIT_SCRIPT'}],
    [{text:'⬅️ Back',callback_data:'MM_EDIT_BACK'}],
  ]);
}
async function mScriptMenu(){
  await send('📝 <b>Current script:</b>\n\n'+(setup.script?escHtml(setup.script):'(none)'),[
    [{text:'✍️ Rewrite',callback_data:'MM_SCRIPT_WRITE'},{text:'🔄 Regenerate',callback_data:'MM_SCRIPT_REGEN'}],
    [{text:'⬅️ Back',callback_data:'MM_EDIT_BACK'}],
  ]);
}
async function mLook(reset){
  if(reset===undefined)reset=true;
  if(reset){ setup={topic:null,photo:null,duration:null,editing:false}; }
  state='m_look';
  const p=pickRandom();
  if(!p){ await send('⚠️ No look found. Send a photo:'); state='m_upload_wait'; return; }
  setup.photo=p; setAvatar(p);
  const tmp='/tmp/mlk'+Date.now()+'.jpg';
  try{
    require('child_process').execSync('sips -Z 800 -s format jpeg "'+p+'" --out "'+tmp+'" 2>/dev/null');
    await sendImg(tmp,'🖼️ 1/4 — LOOK').catch(()=>{});
  }catch{ await send('🖼️ 1/4 — LOOK: '+require('path').basename(p)); }
  await send('Keep this look?',[
    [{text:'✅ Keep',callback_data:'MM_LOOK_KEEP'},{text:'🔀 Pick another',callback_data:'MM_LOOK_ANOTHER'}],
    [{text:'📷 Upload',callback_data:'MM_LOOK_UPLOAD'}],
  ]);
}

// ── Workflow ──────────────────────────────────────────────────────────────────
const TRIG=['Change photo','Approve?','YES / NEW','YES / TOPIC','Start?','Make 2 more','Make Part','Continue to Part','Change?','duration'];
function getQButtons(q){
  const m=q.toLowerCase();
  if(m.includes('approve')||m.includes('yes / new'))
    if(!isAuto)return[[{text:'✅ Approve',callback_data:'A_YES'},{text:'🔄 Regenerate',callback_data:'A_NEW'},{text:'❌ Cancel',callback_data:'A_NO'}]];
  if(m.includes('make part 2')||m.includes('make 2 more'))
    return[[{text:'✅ Make Part 2',callback_data:'A_YES'},{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}],[{text:'⏹ Stop',callback_data:'A_NO'}]];/*partsbtn v1*/
  if(m.includes('continue to part 3')||m.includes('make part 3'))
    return[[{text:'✅ Make Part 3',callback_data:'A_YES'},{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}],[{text:'⏹ Stop',callback_data:'A_NO'}]];
  if(m.includes('start?')||m.includes('yes / topic'))
    if(!isAuto)return[[{text:'▶️ Start',callback_data:'A_YES'},{text:'🔀 New topic',callback_data:'A_TOPIC'},{text:'❌ Cancel',callback_data:'A_NO'}]];
  if(isAuto)return null;
  return[[{text:'✅ YES',callback_data:'A_YES'},{text:'❌ NO',callback_data:'A_NO'}]];
}
function wfInput(ans){if(proc)proc.stdin.write(ans+'\n');}

function launch(){
  if(proc){try{send('⏳ Une génération est déjà en cours — je ne relance pas (anti-doublon). Attends la fin, ou /stop.').catch(()=>{});}catch(e){} return;} /*lock v1*/
  try{require('child_process').execSync('pkill -f "node.*workflow.js" 2>/dev/null');}catch(e){}
  if(setup.photo)setAvatar(setup.photo);
  if(!autoAnswers||autoAnswers.length===0){ autoAnswers=['NO','NO']; } // autoAnswers déjà défini par l'appelant ? on le garde
  state='running';
  scriptBuf='';collectScript=false;
  let mmPing=null; // suivi MM
  const args=[path.join(BASE,'workflow.js')];
  args.push(setup.topic||''); /*durfix v1 : position argv[2]=topic gardee meme sans topic*/
  args.push(setup.duration||'25s'); /*durfix v1 : la duree choisie est ENFIN transmise au moteur (argv[3])*/
  proc=spawn('node',args,{cwd:BASE,env:{...process.env}});
  console.error('=== DEBUG spawn lance, pid='+(proc&&proc.pid)+' args='+JSON.stringify(args));
  if(proc)proc.on('error',e=>console.error('=== DEBUG spawn ERROR: '+e.message));

  let buf='';
  proc.stdout.on('data',async d=>{
    buf+=d.toString();
    const lines=buf.split('\n');
    buf=lines.pop()||'';
    for(const l of lines.filter(l=>l.trim())){
      const line=l.trim();

      // Progress
      // hidden:       if(line.match(/Auto-picking|Picking topic/i))await send('🔍 Picking topic...').catch(()=>{});
      //hidden:       if(line.match(/Topic:/i)&&!line.match(/YES.*TOPIC/))await send('📌 '+line).catch(()=>{});
      if(line.match(/Script [(]\d+-\d+ words[)]/i)){collectScript=false;scriptBuf='';}
      if(line.match(/^OK [(]\d+w[)]:/)){ collectScript=true;scriptBuf='';}
      if(collectScript&&line.length>3&&!line.match(/^OK [(]|^Approve/)){scriptBuf+=(scriptBuf?' ':'')+line.trim();}
      if(line.match(/Approve[?]/i)){collectScript=false;if(scriptBuf.trim())if(!isAuto)send('Script preview:\n\n'+scriptBuf.trim()).catch(()=>{});}
      if(line.match(/📝 Script/i))await send('📝 Étape 2/6 — Écriture du script...').catch(()=>{});
      if(line.match(/Audio Part|ElevenLabs/i))await send('🎙 Étape 3/6 — Génération de la voix...').catch(()=>{});
      if(line.match(/🎲 Random look:/i))await send(line).catch(()=>{});
      if(line.match(/Preparing avatar/i))await send('🖼 Étape 4/6 — Préparation de l’avatar...').catch(()=>{});
      if(line.match(/Lipsync Part/i)){
        await send('🎬 Étape 5/6 — Lipsync en cours...\n⏳ Ça prend 2 à 5 minutes, patiente.').catch(()=>{});
        if(mmPing)clearInterval(mmPing);
        mmPing=setInterval(()=>{ send('⏳ Lipsync toujours en cours...').catch(()=>{}); },180000);
      }
      if(line.match(/Rendering Part/i)){
        if(mmPing){clearInterval(mmPing);mmPing=null;}
        await send('✨ Étape 6/6 — Montage final...').catch(()=>{});
      }

      // Questions // repond aux questions meme en auto
      if(TRIG.some(t=>line.includes(t))){
        if(/make 2 more|make part 2|continue to part 3|make part 3/i.test(line)){
          // parties : TOUJOURS demander, jamais d'enchainement auto
          state='question';
          await send('❓ '+line,getQButtons(line)).catch(()=>{});
        }else if(autoAnswers.length>0){
          const ans=autoAnswers.shift();
          setTimeout(()=>wfInput(ans),400);
        }else if(!isAuto){
          state='question';
          await send('❓ '+line,getQButtons(line)).catch(()=>{});
        }
      }
      // Video saved : workflow imprime "Part N: chemin.mp4"
      {
        const m=line.match(/✅ Part \d+:\s*(.+\.mp4)/)||line.match(/Saved:\s*(.+\.mp4)/);
        if(m&&fs.existsSync(m[1].trim())){
          if(mmPing){clearInterval(mmPing);mmPing=null;}
          const vp=m[1].trim();
          await send('✅ Vidéo prête ! Envoi en cours...').catch(()=>{});
          setTimeout(async()=>{
            setup.lastVideo=vp; await sendVid(vp).catch(async()=>{
              await send('⚠️ Vidéo trop lourde pour Telegram — voir iCloud → podcast-outputs').catch(()=>{});
            });
            await offerReadyToPost(vp).catch(()=>{});
            // (video unique : envoyee une seule fois via sendVid, bouton Save dessous)
            // === miniature : extraire une frame de la video via qlmanage (macOS)
            let thumbPath=null;
            try{const cp=require('child_process');const pth=require('path');cp.execSync('qlmanage -t -s 320 -o "/tmp" "'+vp+'" 2>/dev/null',{stdio:'ignore'});const png='/tmp/'+pth.basename(vp)+'.png';const jpg='/tmp/thumb'+Date.now()+'.jpg';if(fs.existsSync(png)){cp.execSync('sips -Z 320 -s format jpeg "'+png+'" --out "'+jpg+'" 2>/dev/null');if(fs.existsSync(jpg))thumbPath=jpg;}}catch(e){}
            // envoi legende txt : le fichier .txt a le meme chemin que le .mp4
            try{
              const txtPath=vp.replace(/\.mp4$/,'.txt');
              if(fs.existsSync(txtPath)){
                const FormData=require('form-data');
                const fd=new FormData();
                fd.append('chat_id',CHAT_ID);
                fd.append('document',fs.createReadStream(txtPath));
                fd.append('caption','📝 Légende + script (à copier pour TikTok)');
                if(thumbPath&&fs.existsSync(thumbPath)){try{fd.append('thumbnail',fs.createReadStream(thumbPath));}catch(e){}}
                await tg('sendDocument',null,fd).catch(()=>{});
                // aussi le contenu directement dans le chat pour copie rapide
                try{const c=fs.readFileSync(txtPath,'utf8');const _nd=function(s){return (s||'').replace(/[\u2014\u2013]/g,' ').replace(/(^|\s)-+(?=\s|$)/g,'$1').replace(/\s{2,}/g,' ').trim();};const gm=(re)=>{const m=c.match(re);return m?m[1].trim():'';};const sh=_nd(gm(/SHORT:\s*([\s\S]*?)\n\nLONG:/));const lo=_nd(gm(/LONG:\s*([\s\S]*?)\n\nHASHTAGS:/));const tg2=gm(/HASHTAGS:\s*([\s\S]*)$/);/*legende v3*/if(sh){await send('📋 Legende COURTE — copie le message juste en dessous 👇').catch(()=>{});await send(sh+'\n\n'+tg2).catch(()=>{});}if(lo){await send('📋 Legende LONGUE — copie le message juste en dessous 👇').catch(()=>{});await send(lo+'\n\n'+tg2).catch(()=>{});}}catch(e){}
              }
            }catch(e){}
          },2000);
        }
      }
    }
    // Check unterminated buffer line
    if(buf.trim()&&TRIG.some(t=>buf.includes(t))){
      const line=buf.trim();buf='';
      if(/make 2 more|make part 2|continue to part 3|make part 3/i.test(line)){
        // parties : TOUJOURS demander, jamais d'enchainement auto
        state='question';
        send('❓ '+line,getQButtons(line)).catch(()=>{});
      }else if(autoAnswers.length>0){
        const ans=autoAnswers.shift();
        setTimeout(()=>wfInput(ans),400);
      }else if(!isAuto){
        state='question';
        send('❓ '+line,getQButtons(line)).catch(()=>{});
      }
    }
  });
  proc.stderr.on('data',d=>{
    const m=d.toString().trim();
    if(m&&!m.includes('dotenv')&&!m.includes('tip:'))
      send('⚠️ '+m.substring(0,200)).catch(()=>{});
  });
  proc.on('close',()=>{
    if(mmPing){clearInterval(mmPing);mmPing=null;}
    proc=null;state='idle';
    send('✅ <b>Done!</b>\n\nSend /go for another video.',[
      [{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}],
    ]).catch(()=>{});
  });
}

// ── Polices dispo (libass/coretext) ─────────────────────────────────────────────
// Familles candidates : on ne propose que celles réellement installées (fc-match résout vers elles-mêmes).
const FONT_CANDIDATES=[
  {label:'Helvetica Bold',family:'Helvetica'},        // gras via le flag Bold de l'.ass
  {label:'Helvetica Neue Bold',family:'Helvetica Neue'},
  {label:'Archivo Black',family:'Archivo Black'},
  {label:'Arial Black',family:'Arial Black'},
  {label:'Montserrat',family:'Montserrat'},            // ExtraBold approx via flag Bold (police variable)
];
function fontInstalled(fam){
  try{
    const o=require('child_process').execSync('fc-match "'+String(fam).replace(/"/g,'')+'"',{stdio:['ignore','pipe','ignore']}).toString();
    return new RegExp('"'+fam.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"','i').test(o);
  }catch(e){return false;}
}
function availFonts(){const a=FONT_CANDIDATES.filter(f=>fontInstalled(f.family));return a.length?a:[FONT_CANDIDATES[0]];}
function fontLabel(family){const f=FONT_CANDIDATES.find(x=>x.family===family);return f?f.label:family;}

// ── Settings ──────────────────────────────────────────────────────────────────
async function showSettings(){
  /*substyle v1 : taille+position+police+subs dans subtitle_style.js (source unique), zoom dans workflow.js*/
  const s=fs.readFileSync(path.join(BASE,'subtitle_style.js'),'utf8');
  const c=fs.readFileSync(path.join(BASE,'workflow.js'),'utf8');
  const size=s.match(/FONT_SIZE\s*=\s*([\d.]+)/)?.[1]||'?';
  const y=s.match(/OY\s*=\s*([\d.]+)/)?.[1]||'?';
  const zoom=c.match(/scale:([\d.]+)\}/)?.[1]||'?';
  const font=s.match(/const\s+FONT\s*=\s*['"]([^'"]+)['"]/)?.[1]||'Arial Black';
  const letter=s.match(/const\s+LETTER\s*=\s*['"]([^'"]*)['"]/)?.[1]||'0px';
  const subs=(s.match(/const\s+SUBS\s*=\s*([01])/)?.[1]||'1')==='1';
  await send(`💬 <b>SOUS-TITRES</b>\n\n🔤 Police: <b>${fontLabel(font)}</b>\n📝 Taille: ${size}px\n📍 Position y: ${y}\n🔡 Espacement: ${letter}\n💬 Incrustés: <b>${subs?'ON':'OFF (vidéo propre pour TikTok)'}</b>`,[
    [{text:'🔤 Police suivante',callback_data:'S_FONT'}],
    [{text:'A+ Plus gros',callback_data:'S_SIZE_UP'},{text:'A- Plus petit',callback_data:'S_SIZE_DN'}],
    [{text:'⬆️ Monter',callback_data:'S_Y_UP'},{text:'⬇️ Descendre',callback_data:'S_Y_DN'}],
    [{text:'🔡+ Espacement',callback_data:'S_SP_UP'},{text:'🔡- Espacement',callback_data:'S_SP_DN'}],
    [{text:subs?'💬 Sous-titres: OFF':'💬 Sous-titres: ON',callback_data:'S_SUBS'}],
    [{text:'↩️ Annuler',callback_data:'UNDO_EDIT'},{text:'✔️ Valider',callback_data:'VALIDATE_STYLE'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
  ]);
}
// ── Helpers /edit (Image, Zooms, Musique) — stockés dans style.json ─────────────
const RL=require('./render_local');
const WF=require('./workflow.js'); // briques de génération (require.main!==module -> main() ne se lance pas)
// ── Mémoire persistante (mise à jour SEULEMENT par les vraies générations) ──────
const STATE_PATH=path.join(BASE,'state.json');
const DEFAULT_STATE={look:null,duration:'23s',styleName:null,subjectMode:'auto',lastLooks:[]};
let genState=Object.assign({},DEFAULT_STATE);
function loadState(){try{genState=Object.assign({},DEFAULT_STATE,JSON.parse(fs.readFileSync(STATE_PATH,'utf8')));}catch(e){genState=Object.assign({},DEFAULT_STATE);}try{if(genState.look&&fs.existsSync(genState.look))workingSource=genState.look;}catch(e){}}
function saveState(){try{fs.writeFileSync(STATE_PATH,JSON.stringify(genState,null,2));}catch(e){}}
function pushLastLook(p){if(!p)return;genState.lastLooks=[p,...(genState.lastLooks||[]).filter(x=>x!==p)].slice(0,3);}
// ── Coûts estimés (CONFIGURABLES — valeurs raisonnables documentées, à ajuster) ──
const COST={
  EL_EUR_PER_1K_CHARS:0.20, // ElevenLabs multilingual v2 ~0.18–0.30€/1k caractères selon le plan
  KLING_EUR_PER_PART:0.40,  // Higgsfield/Kling lipsync ~par part générée
  CHARS_PER_WORD:6,         // ~5 lettres + 1 espace
  CURRENCY:'€',
};
function estimateCost(durationStr){
  const sec=parseInt(durationStr,10)||23;
  const plan=WF.planParts(sec);
  const wm=plan.words.split('-').map(Number);const wpp=(wm[0]+wm[1])/2;
  const totalWords=Math.round(wpp*plan.n);const chars=totalWords*COST.CHARS_PER_WORD;
  const el=(chars/1000)*COST.EL_EUR_PER_1K_CHARS, kling=plan.n*COST.KLING_EUR_PER_PART;
  return {parts:plan.n,words:totalWords,el,kling,total:el+kling};
}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,Math.round(v*1000)/1000));
function readFx(){return RL.loadFx();}
function writeFx(fx){fs.writeFileSync(path.join(BASE,'style.json'),JSON.stringify(fx,null,2));}
// ── Styles sauvegardés (sous-titres + fx) dans ~/podcast-workflow/styles/ ───────
function stylesDir(){const d=path.join(BASE,'styles');try{fs.mkdirSync(d,{recursive:true});}catch(e){}return d;}
function readSubs(){
  const s=fs.readFileSync(path.join(BASE,'subtitle_style.js'),'utf8');
  return {
    font:s.match(/const\s+FONT\s*=\s*['"]([^'"]+)['"]/)?.[1]||'Archivo Black',
    size:+(s.match(/FONT_SIZE\s*=\s*([\d.]+)/)?.[1]||78),
    oy:+(s.match(/OY\s*=\s*([\d.]+)/)?.[1]||0.27),
    letter:s.match(/const\s+LETTER\s*=\s*['"]([^'"]*)['"]/)?.[1]||'2px',
    subs:+(s.match(/const\s+SUBS\s*=\s*([01])/)?.[1]||1),
  };
}
function writeSubs(v){
  let s=fs.readFileSync(path.join(BASE,'subtitle_style.js'),'utf8');
  if(v.font!=null)s=s.replace(/const(\s+)FONT(\s*)=\s*['"][^'"]*['"]/,"const$1FONT$2= '"+v.font+"'");
  if(v.size!=null)s=s.replace(/FONT_SIZE\s*=\s*[\d.]+/,'FONT_SIZE = '+v.size);
  if(v.oy!=null)s=s.replace(/OY\s*=\s*[\d.]+/,'OY        = '+v.oy);
  if(v.letter!=null)s=s.replace(/const(\s+)LETTER(\s*)=\s*['"][^'"]*['"]/,"const$1LETTER$2= '"+v.letter+"'");
  if(v.subs!=null)s=s.replace(/const(\s+)SUBS(\s*)=\s*[01]/,'const$1SUBS$2= '+(v.subs?1:0));
  fs.writeFileSync(path.join(BASE,'subtitle_style.js'),s);
}
function snapshotStyle(){return {savedAt:new Date().toISOString(),subs:readSubs(),fx:readFx()};}
function applySnapshot(snap){if(snap&&snap.subs)writeSubs(snap.subs);if(snap&&snap.fx)writeFx(snap.fx);}
// ── Historique d'édition (pile JSON) : undo pas à pas jusqu'à validation ────────
function histPath(){return path.join(BASE,'edit_history.json');}
function histRead(){try{return JSON.parse(fs.readFileSync(histPath(),'utf8'));}catch(e){return [];}}
function histWrite(a){try{fs.writeFileSync(histPath(),JSON.stringify(a));}catch(e){}}
function pushHistory(){const a=histRead();a.push(snapshotStyle());while(a.length>50)a.shift();histWrite(a);}
function undoEdit(){const a=histRead();const prev=a.pop();histWrite(a);if(prev)applySnapshot(prev);return !!prev;}
function clearHistory(){histWrite([]);}
let editSectionCur=null;
async function refreshSection(){
  // après un undo : ré-affiche le panneau de la section courante (état restauré)
  await refreshPanel();
}
function listStyles(){try{return fs.readdirSync(stylesDir()).filter(f=>f.endsWith('.json')).sort();}catch(e){return[];}}
function saveStyleAuto(){
  const dir=stylesDir();const existing=listStyles();let n=existing.length+1;
  while(fs.existsSync(path.join(dir,'style_'+n+'.json')))n++;
  const name='style_'+n;const snap=snapshotStyle();snap.name=name;
  fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(snap,null,2));return name;
}
let styleList=[];
async function showStyles(){
  styleList=listStyles();
  if(!styleList.length){await send('📂 Aucun style sauvegardé.\nDans /edit, appuie sur « 💾 Sauvegarder ce style ».');return;}
  const rows=styleList.map((f,i)=>[{text:'📂 '+f.replace(/\.json$/,''),callback_data:'LOADSTYLE_'+i},{text:'🎬',callback_data:'LOADGEN_'+i},{text:'🗑',callback_data:'DELSTYLE_'+i}]);
  rows.push([{text:'◀️ Menu',callback_data:'EDIT_HOME'}]);
  await send('📂 <b>MES STYLES</b>\n\n📂 charger · 🎬 générer avec · 🗑 supprimer',rows);
}
// ── Prêt à poster : copie vidéo + légendes + snapshot style dans outputs/ready_to_post/ ──
function readyDir(){const d=path.join(BASE,'outputs','ready_to_post');try{fs.mkdirSync(d,{recursive:true});}catch(e){}return d;}
let sentVideos=[]; // vidéos envoyées dans le chat (pour le bouton « Prêt à poster »)
async function offerReadyToPost(vp){
  if(!vp)return;const idx=sentVideos.push(vp)-1;
  await send('Garder cette vidéo ?',[[{text:'✅ Prêt à poster',callback_data:'READY_'+idx}]]).catch(()=>{});
}
function doReadyToPost(vp){
  if(!vp||!fs.existsSync(vp))throw new Error('vidéo introuvable');
  const dir=readyDir();const base=path.basename(vp,'.mp4');
  const dst=path.join(dir,path.basename(vp));
  fs.copyFileSync(vp,dst);
  const txt=vp.replace(/\.mp4$/,'.txt');
  if(fs.existsSync(txt))fs.copyFileSync(txt,path.join(dir,base+'.txt'));
  fs.writeFileSync(path.join(dir,base+'.style.json'),JSON.stringify(snapshotStyle(),null,2));
  return dst;
}
let readyList=[];
async function showReady(){
  try{readyList=fs.readdirSync(readyDir()).filter(f=>/\.mp4$/i.test(f)).sort().reverse();}catch(e){readyList=[];}
  if(!readyList.length){await send('📤 <b>PRÊT À POSTER</b>\n\nVide pour l\'instant.\nSur une vidéo livrée, appuie sur « ✅ Prêt à poster » → elle est copiée dans <code>outputs/ready_to_post/</code> (visible dans Fichiers iCloud sur iPhone).',[[{text:'◀️ Menu',callback_data:'MAIN_MENU'}]]);return;}
  const rows=readyList.slice(0,20).map((f,i)=>[{text:'♻️ '+f.replace(/\.mp4$/,'').slice(0,32),callback_data:'REUSE_'+i}]);
  rows.push([{text:'◀️ Menu',callback_data:'MAIN_MENU'}]);
  await send('📤 <b>PRÊT À POSTER</b> ('+readyList.length+')\n\n📱 Dossier <code>outputs/ready_to_post/</code> (iCloud).\n♻️ Reprendre le style d\'une vidéo :',rows);
}
// ── Test local gratuit (réutilisable depuis /test et le menu) ───────────────────
async function runLocalTest(){
  if(proc){await send('⛔ Une vidéo est en cours — /test refusé (anti-conflit).');return;}
  try{
    const {renderLocal}=require('./render_local');
    const src=workSrc(); // PHOTO DE TRAVAIL COURANTE (look choisi ou dernier raw)
    if(!src){await send('⚠️ Aucune photo de travail. Choisis un look 👤 ou lance un /go.');return;}
    await send('🧪 Rendu LOCAL gratuit (ffmpeg, style courant, photo de travail : '+path.basename(src)+')... ~2s');
    const S='HE IGNORES YOU THEN CALLS YOU CRAZY THAT IS MANIPULATION NOT LOVE WALK AWAY';
    const wt=S.split(' ').map((w,i)=>({text:w.toUpperCase(),start:+(i*0.42).toFixed(3),end:+((i+1)*0.42).toFixed(3),duration:0.42}));
    const out='/tmp/localtest_'+Date.now()+'.mp4';
    const r=await renderLocal({input:src,wordTimings:wt,keywords:['CRAZY','MANIPULATION','AWAY'],reactions:[{after:'THAT IS MANIPULATION NOT LOVE',type:'mhm'}],output:out,quiet:true,duration:wt[wt.length-1].end+0.35});
    const st=r.style;
    await send(`✅ Rendu local : 🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy} • 💬 ${st.subs?'ON':'OFF'}`).catch(()=>{});
    await sendVid(out).catch(async()=>{await send('⚠️ Vidéo trop lourde pour Telegram.').catch(()=>{});});
    await offerReadyToPost(out).catch(()=>{});
    await send('Ajuste via /edit puis 👁 Preview ou 🧪 Test.').catch(()=>{});
  }catch(e){await send('❌ Test local : '+e.message);}
}
const HELP_TXT='🎬 <b>Commandes</b>\n\n/menu — menu principal\n/go — générer une vidéo\n/edit — éditer le look (sous-titres, image, zooms, musique)\n/looks — galerie de looks\n/posted — vidéos prêtes à poster\n/styles — mes styles enregistrés\n/preview — aperçu du look\n/test — rendu local gratuit\n/stop — tout arrêter\n/status — état\n/restart — redémarrer le bot\n/mark [titre] viral|good|ok — noter une vidéo';
async function showGenerateMenu(){ await showRecap(); } // l'ancien menu redirige vers la carte récap
// ── CARTE RÉCAP de génération (pré-remplie depuis state.json) ────────────────────
let gw={look:null,styleName:null,subjectMode:'auto',topic:null,duration:'23s',mid:null};
function gwReset(){gw={look:genState.look||null,styleName:genState.styleName||null,subjectMode:genState.subjectMode||'auto',topic:null,duration:genState.duration||'23s',mid:null};}
function gwLook(){return (gw.look&&fs.existsSync(gw.look))?gw.look:null;}
function recapCaption(){
  const dur=gw.duration||'23s';const c=estimateCost(dur);
  const subj=gw.subjectMode==='mine'?('⌨️ '+(gw.topic||'(à taper)')):'🎲 auto';
  return `🎬 <b>NOUVELLE VIDÉO</b>\n\n👤 Look : <b>${gwLook()?path.basename(gwLook()):'(avatar actuel)'}</b>\n🎨 Style : <b>${gw.styleName||'actuel'}</b>\n💬 Sujet : <b>${subj}</b>\n⏱ Durée : <b>${dur}</b>${c.parts>1?` (${c.parts} parties)`:''}\n\n💰 Coût estimé : <b>~${c.total.toFixed(2)}${COST.CURRENCY}</b>  (voix ${c.el.toFixed(2)} + lipsync ${c.kling.toFixed(2)})`;
}
function recapKb(){
  return [
    [{text:'👤 Changer le look',callback_data:'RC_LOOK'}],
    [{text:'🎨 Style',callback_data:'RC_STYLE'},{text:'💬 Sujet',callback_data:'RC_SUBJ'}],
    [{text:'⏱ 15s',callback_data:'RC_DUR_15'},{text:'23s',callback_data:'RC_DUR_23'},{text:'30s',callback_data:'RC_DUR_30'},{text:'⌨️ Libre',callback_data:'RC_DUR_FREE'}],
    [{text:'🚀 GO',callback_data:'RC_GO'},{text:'❌ Annuler',callback_data:'RC_CANCEL'}],
  ];
}
async function showRecap(){
  const lk=gwLook();
  if(lk){const r=await sendPhotoKb(lk,recapCaption(),recapKb());gw.mid=(r&&r.result&&r.result.message_id)||null;}
  else {await send(recapCaption(),recapKb());gw.mid=null;}
}
async function refreshRecap(){
  const lk=gwLook();
  if(gw.mid&&lk){const ok=await editPhotoKb(gw.mid,lk,recapCaption(),recapKb());if(ok)return;}
  await showRecap();
}
// ── Orchestration de génération pilotée par le bot (script preview + maquette + GO) ──
let genJob=null; // job de génération courant
function genBusy(){return !!(proc||genJob&&genJob.running);}
async function autoPickTopic(){
  const Anthropic=require('@anthropic-ai/sdk');const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
  let used='';try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));used=(lib.scripts||[]).map(s=>s.title).join(', ');}catch(e){}
  const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:100,messages:[{role:'user',content:'TikTok relationship coach women 20-40. ONLY romantic relationship topics: red flags, toxic men, attachment styles, self-worth, breakups, why men pull away, dating mistakes, narcissists. Pick ONE viral topic not yet covered. Already covered: '+used+'. Return ONLY the title in English, no quotes, no bold.'}]});
  return r.content[0].text.trim().replace(/^["'*]+|["'*]+$/g,'');
}
// Démarre depuis la carte récap : écrit le 1er script et l'affiche pour validation
async function recapGo(){
  if(genBusy()){await send('⏳ Une génération est déjà en cours — /stop d\'abord.');return;}
  const dur=gw.duration||'23s';const plan=WF.planParts(parseInt(dur,10)||23);
  genJob={duration:dur,parts:plan.n,words:plan.words,subjectMode:gw.subjectMode,topic:gw.subjectMode==='mine'?(gw.topic||null):null,styleName:gw.styleName,look:gwLook(),audio:null,running:false};
  if(gwLook())setAvatar(gwLook());
  await send('📝 Écriture du script... (gratuit, ~10s)');
  await genScriptStep();
}
async function genScriptStep(){
  try{
    if(!genJob.topic)genJob.topic=await autoPickTopic();
    const prompt=genJob.parts>1?WF.partPrompt(genJob.topic,1,genJob.parts,[]):genJob.topic;
    const c=await WF.generateScript(prompt,genJob.words);
    genJob.c1=c;genJob.script=c.script;genJob.keywords=c.keywords;genJob.reactions=c.reactions;genJob.audio=null;
    await send('📝 <b>SCRIPT</b> ('+c.script.split(/\s+/).length+' mots) — sujet : '+escHtml(genJob.topic)+'\n\n'+escHtml(c.script),[
      [{text:'✅ Valider',callback_data:'GJ_OK'},{text:'🔄 Nouveau',callback_data:'GJ_NEW'}],
      [{text:'✏️ Modifier le texte',callback_data:'GJ_EDIT'}],
      [{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
    ]);
  }catch(e){await send('❌ Script: '+e.message);genJob=null;}
}
async function genAfterScript(){
  const c=estimateCost(genJob.duration);
  await send('✅ Script validé.\n💰 GO ≈ '+c.total.toFixed(2)+COST.CURRENCY+' ('+c.parts+' partie(s)).',[
    [{text:'👁 Maquette (~centimes)',callback_data:'GJ_MOCK'}],
    [{text:'🚀 GO direct',callback_data:'GJ_GO'}],
    [{text:'✏️ Modifier',callback_data:'GJ_EDIT'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
  ]);
}
async function genMockup(){
  const raw=latestRaw();
  if(!raw){await send('⚠️ Pas d\'ancien footage pour la maquette. Utilise 🚀 GO direct.');return;}
  await send('🎙 Voix ElevenLabs (~centimes)...');
  try{
    genJob.audio=await WF.generateAudio(genJob.script,1);
    await send('✨ Rendu local de la maquette (ancien footage, lèvres NON synchro — c\'est normal)...');
    const out='/tmp/mockup_'+Date.now()+'.mp4';
    await RL.renderLocal({input:raw,wordTimings:genJob.audio.wordTimings,keywords:genJob.keywords,reactions:genJob.reactions,output:out,quiet:true,duration:genJob.audio.duration});
    await sendVid(out).catch(async()=>{await send('⚠️ Maquette trop lourde.');});
    await send('👁 Maquette ci-dessus (lèvres pas synchro, footage ancien). Si le rythme/texte te plaît :',[
      [{text:'🚀 GO définitif (réutilise cette voix)',callback_data:'GJ_GO'}],
      [{text:'✏️ Modifier',callback_data:'GJ_EDIT'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
    ]);
  }catch(e){await send('❌ Maquette: '+e.message);}
}
async function genFinal(){
  if(!genJob){await send('⚠️ Aucun script en attente.');return;}
  if(proc||genJob.running){await send('⏳ Déjà en cours.');return;}
  genJob.running=true;state='running';
  const job=genJob;
  const prog=await send('📊 <b>GÉNÉRATION</b>\n📝 Script ✓\n🎙 Voix…');
  const progMid=prog&&prog.result&&prog.result.message_id;
  const setProg=async t=>{try{if(progMid)await tg('editMessageText',{message_id:progMid,text:'📊 <b>GÉNÉRATION</b>\n'+t,parse_mode:'HTML'});}catch(e){}};
  try{
    const ts=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    const outDir=path.join(BASE,'outputs');
    await setProg('📝 Script ✓\n🎙 Voix…');
    if(!job.audio)job.audio=await WF.generateAudio(job.script,1);
    await setProg('📝 ✓ · 🎙 Voix ✓\n🖼 Préparation avatar…');
    const imageUrl=await WF.prepareImage();
    const clips=[];const prevScripts=[job.script];
    for(let i=1;i<=job.parts;i++){
      let c,audio;
      if(i===1){c=job.c1;audio=job.audio;}
      else{await setProg('🎬 Partie '+i+'/'+job.parts+' · script+voix…');c=await WF.generateScript(WF.partPrompt(job.topic,i,job.parts,prevScripts),job.words);audio=await WF.generateAudio(c.script,i);prevScripts.push(c.script);}
      await setProg('📝 ✓ · 🎙 ✓ · 🖼 ✓\n🎬 Lipsync partie '+i+'/'+job.parts+'… (~3-5 min, patiente)');
      const lip=await WF.generateLipsync(imageUrl,audio.audioUrl,i);
      const rawi=await WF.saveLipsyncRaw(lip,i,ts,outDir);
      await setProg('🎬 Lipsync '+i+'/'+job.parts+' ✓\n✨ Rendu local…');
      const vid=await WF.renderVideo(lip,audio.wordTimings,c.keywords,audio.duration,i,c.reactions,rawi);
      const p=await WF.saveOpen(vid,c,ts,i,outDir);
      clips.push(p);
    }
    let finalP=clips.filter(Boolean)[0];
    if(clips.filter(Boolean).length>1){finalP=path.join(outDir,ts+'_FINAL.mp4');WF.concatClips(clips.filter(Boolean),finalP);}
    await setProg('✅ Terminé !');
    try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));lib.scripts.push({id:Date.now().toString(),title:job.topic,date:ts.slice(0,10),script:job.script,performance:null});fs.writeFileSync(LIBRARY,JSON.stringify(lib,null,2));}catch(e){}
    if(job.look)genState.look=job.look;genState.duration=job.duration;genState.styleName=job.styleName;genState.subjectMode=job.subjectMode;pushLastLook(job.look);saveState();
    await sendVid(finalP).catch(async()=>{await send('⚠️ Vidéo trop lourde — voir /files.');});
    const idx=sentVideos.push(finalP)-1;
    await send('✅ <b>Vidéo prête !</b>',[[{text:'✅ Prêt à poster',callback_data:'READY_'+idx}],[{text:'🎨 Rééditer',callback_data:'EDIT_HOME'},{text:'♻️ Régénérer',callback_data:'MENU_GEN'}]]);
  }catch(e){await setProg('❌ Échec : '+e.message);await send('❌ Génération : '+e.message);}
  state='idle';genJob=null;
}
async function showMainMenu(){
  await send('🏠 <b>MENU</b>\n\nQue veux-tu faire ?',[
    [{text:'🎬 Générer une vidéo',callback_data:'MENU_GEN'},{text:'⚡ Express',callback_data:'EXPRESS_NEW'}],
    [{text:'🎨 Éditer le look',callback_data:'EDIT_HOME'},{text:'👤 Looks',callback_data:'MENU_LOOKS'}],
    [{text:'💾 Mes styles',callback_data:'SHOWSTYLES'},{text:'📤 Prêt à poster',callback_data:'SHOWREADY'}],
    [{text:'📁 Fichiers',callback_data:'FILES_HOME'},{text:'👁 Preview',callback_data:'EDIT_PREVIEW'},{text:'🧪 Test',callback_data:'MENU_TEST'}],
    [{text:'🛑 Stop',callback_data:'TECH_STOP'},{text:'⚙️ Technique',callback_data:'MENU_TECH'},{text:'❓ Aide',callback_data:'MENU_HELP'}],
  ]);
}
// ── 📁 FICHIERS : parcourir et recevoir les fichiers (vidéos/images/légendes/ready/looks) ──
function listDir(dir,filter){try{return fs.readdirSync(dir).filter(f=>!f.startsWith('.')&&filter(f)).map(f=>{const p=path.join(dir,f);let st;try{st=fs.statSync(p);}catch(e){return null;}return st.isFile()?{path:p,name:f,mtime:st.mtimeMs,size:st.size}:null;}).filter(Boolean);}catch(e){return [];}}
function fileCat(cat){
  const OUT=path.join(BASE,'outputs');
  if(cat==='vid')return listDir(OUT,f=>/\.mp4$/i.test(f)).sort((a,b)=>b.mtime-a.mtime);
  if(cat==='img')return listDir(OUT,f=>/\.(png|jpe?g|webp)$/i.test(f)).concat(listDir(path.join(OUT,'test_local'),f=>/\.(png|jpe?g|webp)$/i.test(f))).sort((a,b)=>b.mtime-a.mtime);
  if(cat==='txt')return listDir(OUT,f=>/\.txt$/i.test(f)).sort((a,b)=>b.mtime-a.mtime);
  if(cat==='ready')return listDir(path.join(OUT,'ready_to_post'),f=>/\.(mp4|txt|json)$/i.test(f)).sort((a,b)=>b.mtime-a.mtime);
  if(cat==='looks')return listDir(getLooksDir(),f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&!f.startsWith('_')).sort((a,b)=>b.mtime-a.mtime);
  return [];
}
const FCAT_LABEL={vid:'🎬 Vidéos',img:'🖼 Images',txt:'📄 Légendes',ready:'📤 Prêt à poster',looks:'👤 Looks'};
function fmtSize(b){return b>1e6?(b/1e6).toFixed(1)+' Mo':Math.max(1,b/1e3|0)+' Ko';}
function fmtDate(ms){const d=new Date(ms);const p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes());}
let fileList=[];
async function showFilesMenu(){
  await send('📁 <b>FICHIERS</b>\n\n📱 Tout le dossier <code>outputs</code> est aussi visible dans l\'app <b>Fichiers</b> de l\'iPhone (iCloud → podcast-outputs).\n\nChoisis une catégorie :',[
    [{text:'🎬 Vidéos',callback_data:'FCAT_vid'},{text:'🖼 Images',callback_data:'FCAT_img'}],
    [{text:'📄 Légendes',callback_data:'FCAT_txt'},{text:'📤 Prêt à poster',callback_data:'FCAT_ready'}],
    [{text:'👤 Looks',callback_data:'FCAT_looks'},{text:'◀️ Menu',callback_data:'MAIN_MENU'}],
  ]);
}
async function showFileList(cat,page){
  fileList=fileCat(cat);
  if(!fileList.length){await send(FCAT_LABEL[cat]+' — vide.',[[{text:'◀️ Catégories',callback_data:'FILES_HOME'}]]);return;}
  const PER=8;const pages=Math.max(1,Math.ceil(fileList.length/PER));page=Math.max(0,Math.min(page,pages-1));
  const rows=fileList.slice(page*PER,page*PER+PER).map(it=>{const gi=fileList.indexOf(it);return [{text:it.name.slice(0,26)+' · '+fmtSize(it.size)+' · '+fmtDate(it.mtime),callback_data:'FGET_'+gi}];});
  const nav=[];if(page>0)nav.push({text:'◀️',callback_data:'FPAGE_'+cat+'_'+(page-1)});nav.push({text:(page+1)+'/'+pages,callback_data:'NOOP'});if(page<pages-1)nav.push({text:'▶️',callback_data:'FPAGE_'+cat+'_'+(page+1)});
  rows.push(nav);rows.push([{text:'◀️ Catégories',callback_data:'FILES_HOME'}]);
  await send(FCAT_LABEL[cat]+' ('+fileList.length+') — tape pour recevoir le fichier :',rows);
}
async function sendFile(fp){
  if(!fp||!fs.existsSync(fp)){await send('⚠️ Fichier introuvable.');return;}
  const sz=fs.statSync(fp).size,ext=path.extname(fp).toLowerCase();
  if(sz>50*1024*1024){await send('📦 <b>'+path.basename(fp)+'</b> ('+(sz/1e6).toFixed(0)+' Mo) dépasse la limite Telegram (50 Mo).\n📱 Ouvre-le dans <b>Fichiers</b> (iCloud) :\n<code>'+fp+'</code>');return;}
  try{
    if(ext==='.mp4')await sendVid(fp);
    else if(/\.(png|jpe?g|webp)$/.test(ext))await sendImg(fp,path.basename(fp));
    else{const FormData=require('form-data');const fd=new FormData();fd.append('chat_id',CHAT_ID);fd.append('document',fs.createReadStream(fp));fd.append('caption',path.basename(fp));await tg('sendDocument',null,fd);}
  }catch(e){await send('⚠️ Envoi échoué ('+e.message+').\n📱 Chemin iCloud :\n<code>'+fp+'</code>');}
}
const IMG_PRESETS={
  'Naturel':{brightness:0,contrast:1,saturation:1,temperature:6500,sharpness:0,vignette:0},
  'Chaud':{brightness:0.03,contrast:1.05,saturation:1.18,temperature:4800,sharpness:0.3,vignette:1},
  'Cinéma':{brightness:-0.02,contrast:1.22,saturation:0.92,temperature:5500,sharpness:0.6,vignette:3},
  'Luxe':{brightness:0.02,contrast:1.12,saturation:1.28,temperature:5200,sharpness:0.7,vignette:2},
  'Soft':{brightness:0.05,contrast:0.96,saturation:1.05,temperature:6000,sharpness:0,vignette:1},
  'N&B':{brightness:0,contrast:1.12,saturation:0,temperature:6500,sharpness:0.2,vignette:1},
  'Vintage':{brightness:0.02,contrast:0.92,saturation:0.8,temperature:4500,sharpness:0,vignette:3},
  'Golden':{brightness:0.05,contrast:1.05,saturation:1.2,temperature:4200,sharpness:0.2,vignette:2},
  'Studio':{brightness:0.03,contrast:1.08,saturation:1.05,temperature:6500,sharpness:0.5,vignette:0},
  'Glow':{brightness:0.06,contrast:0.98,saturation:1.05,temperature:5800,sharpness:-0.6,vignette:1},
  'Punch':{brightness:0,contrast:1.3,saturation:1.4,temperature:6500,sharpness:0.6,vignette:2},
};
function musicFiles(){try{return fs.readdirSync(RL.MUSIC_DIR).filter(f=>/\.(mp3|m4a)$/i.test(f)&&!f.startsWith('.')&&!f.startsWith('_'));}catch(e){return[];}}
function latestRaw(){const OUT=path.join(BASE,'outputs');try{const r=fs.readdirSync(OUT).filter(f=>/_raw_p\d+\.mp4$/i.test(f)).map(f=>path.join(OUT,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);return r[0]||null;}catch(e){return null;}}
// Source de la frame de travail : un look (image) choisi, sinon le dernier raw vidéo
let workingSource=null; // PHOTO DE TRAVAIL COURANTE unifiée (look choisi) ; fallback = dernier raw
function workSrc(){return (workingSource&&fs.existsSync(workingSource))?workingSource:latestRaw();}
function setWorkPhoto(p){if(p&&fs.existsSync(p))workingSource=p;}
function workSrcLabel(){const s=workSrc();return s?path.basename(s):'(aucune)';}
// Rend un court clip (WRONG YOURE) avec le STYLE COURANT sur une VIDÉO, renvoie {frame,style}
async function renderStyleFrame(input){
  const raw=input||latestRaw(); if(!raw)return null;
  const {renderLocal}=require('./render_local');
  const wt='WRONG YOURE'.split(' ').map((w,i)=>({text:w,start:+(i*0.5).toFixed(3),end:+((i+1)*0.5).toFixed(3),duration:0.5}));
  const out='/tmp/sf_'+Date.now()+'.mp4';
  let r;try{r=await renderLocal({input:raw,wordTimings:wt,keywords:['WRONG'],reactions:[],output:out,quiet:true,duration:1.4});}catch(e){return null;}
  const frame='/tmp/sf_'+Date.now()+'_'+Math.floor(r.duration*100)+'.png';
  try{require('child_process').execFileSync('ffmpeg',['-y','-ss','0.6','-i',out,'-frames:v','1','-q:v','2',frame],{stdio:'ignore'});}catch(e){return null;}
  return {frame,style:r.style};
}
// Aperçu STILL sur une IMAGE (look) : couleur + sous-titres incrustés, via les helpers de render_local
async function renderStillPreview(imgPath){
  const sub=readSubs(),fx=readFx(),W=720,H=1280;
  const assPath='/tmp/still_'+Date.now()+'.ass';
  const subsOn=sub.subs!==0;
  if(subsOn)fs.writeFileSync(assPath,RL.buildAss([{text:'WRONG YOURE',start:0,length:99}],{font:sub.font,fontSize:sub.size,oy:sub.oy,letterSpacing:parseFloat(sub.letter)||0}));
  const color=RL.buildColorFilter(fx.image);
  let vf='scale='+W+':'+H+':force_original_aspect_ratio=increase,crop='+W+':'+H+',setsar=1';
  if(color)vf+=','+color;
  if(subsOn)vf+=',ass='+assPath;
  const out='/tmp/still_'+Date.now()+'.png';
  try{require('child_process').execFileSync('ffmpeg',['-y','-i',imgPath,'-vf',vf,'-frames:v','1','-q:v','2',out],{stdio:'ignore'});}catch(e){return null;}
  return {frame:out,style:{font:sub.font,fontSize:sub.size,oy:sub.oy}};
}
// Frame de travail courante (image look -> still ; sinon vidéo raw -> render)
async function renderWorkingFrame(){
  const src=workSrc(); if(!src)return null;
  if(/\.(jpg|jpeg|png|webp)$/i.test(src))return await renderStillPreview(src);
  return await renderStyleFrame(src);
}
function hstackLabeled(leftPng,rightPng,leftLabel,rightLabel,outPng){
  const FF='/System/Library/Fonts/Helvetica.ttc';
  require('child_process').execFileSync('ffmpeg',['-y','-i',leftPng,'-i',rightPng,'-filter_complex',
    `[0:v]scale=-1:1000,drawtext=fontfile=${FF}:text=${leftLabel}:x=12:y=12:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.6[a];[1:v]scale=-1:1000,drawtext=fontfile=${FF}:text=${rightLabel}:x=12:y=12:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.6[b];[a][b]hstack`,outPng],{stdio:'ignore'});
}
let editPrevFrame=null; // frame "AVANT" pour le before/after
async function captureBaseline(){ const f=await renderWorkingFrame(); editPrevFrame=f?f.frame:null; }
// Après un réglage : envoie AVANT|APRÈS puis re-affiche les contrôles
async function sendBeforeAfter(){
  const after=await renderWorkingFrame();
  if(!after){await send('⚠️ Aperçu indispo : aucun _raw_p*.mp4 dans outputs/ (lance un /go).');return;}
  const comp='/tmp/ba_'+Date.now()+'.png';
  if(editPrevFrame&&fs.existsSync(editPrevFrame)){
    try{hstackLabeled(editPrevFrame,after.frame,'AVANT','APRES',comp);}catch(e){fs.copyFileSync(after.frame,comp);}
  }else fs.copyFileSync(after.frame,comp);
  editPrevFrame=after.frame; // l'après devient l'avant du prochain réglage
  const st=after.style;
  await sendImg(comp,`↔️ AVANT | APRÈS — 🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy}`).catch(()=>{});
}
async function sendVsReference(){
  const after=await renderWorkingFrame();
  if(!after){await send('⚠️ Aperçu indispo (aucun raw).');return;}
  const ref=path.join(BASE,'reference_model.png');const comp='/tmp/vr_'+Date.now()+'.png';
  if(fs.existsSync(ref)){try{hstackLabeled(ref,after.frame,'REFERENCE','RENDU',comp);}catch(e){fs.copyFileSync(after.frame,comp);}}
  else fs.copyFileSync(after.frame,comp);
  await sendImg(comp,'🎯 RÉFÉRENCE | RENDU actuel').catch(()=>{});
}
async function afterEdit(section){
  await sendBeforeAfter();
  if(section==='subs')await showSettings();
  else if(section==='zoom')await showEditZoom();
  else if(section==='mus')await showEditMusic();
}
// ── Panneau d'édition EN PLACE (un seul message PHOTO, editMessageMedia) ─────────
let editPanel={mid:null,section:'img'};
async function editPhotoKb(mid,fp,caption,rows){
  try{
    const FormData=require('form-data');const form=new FormData();
    form.append('chat_id',CHAT_ID);form.append('message_id',String(mid));
    form.append('media',JSON.stringify({type:'photo',media:'attach://photo',caption:caption,parse_mode:'HTML'}));
    form.append('photo',fs.readFileSync(fp),{filename:'p.jpg',contentType:'image/jpeg'});
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/editMessageMedia',{method:'POST',body:form});
    const d=await r.json();return !!(d&&d.ok);
  }catch(e){return false;}
}
function navRow(){return [
  [{text:'👤 Looks (changer la photo)',callback_data:'EDIT_LOOKS'}],
  [{text:'↩️ Annuler',callback_data:'UNDO_EDIT'},{text:'✔️ Valider',callback_data:'VALIDATE_STYLE'}],
  [{text:'↔️ Avant/Après',callback_data:'BEFORE_AFTER'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
];}
function sectionKb(section){
  if(section==='subs')return subsKb();
  if(section==='zoom')return zoomKb();
  if(section==='mus')return musicKb();
  return imageKb();
}
function sectionCaption(section){
  const src='📸 '+workSrcLabel();
  if(section==='subs'){const s=readSubs();return `💬 <b>SOUS-TITRES</b> · ${src}\n🔤 ${fontLabel(s.font)} · ${s.size}px · y=${s.oy} · ${s.subs?'incrustés':'OFF'}`;}
  if(section==='zoom'){const z=readFx().zoom;return `🎬 <b>ZOOMS</b> · ${src}\n${z.on?'ON ×'+z.intensity+' · '+z.duration+'s · 1/'+z.everyN:'OFF'}`;}
  if(section==='mus'){const m=readFx().music;return `🎵 <b>MUSIQUE</b> · ${src}\n${m.on?(m.file||'(aucun)')+' @'+m.volume:'OFF'}`;}
  const i=readFx().image;return `🎨 <b>IMAGE</b> · ${src}\n☀️${i.brightness} ◐${i.contrast} 🌈${i.saturation} 🌡${i.temperature}K 🔪${i.sharpness} ⬛${i.vignette}`;
}
async function openPanel(section){
  editPanel.section=section;editPanel.mid=null;editPrevFrame=null;
  const f=await renderWorkingFrame();
  if(!f){await send(sectionCaption(section)+'\n\n⚠️ Aucune frame de travail. Choisis un look 👤 ou lance un /go.',sectionKb(section));return;}
  editPrevFrame=f.frame;
  const r=await sendPhotoKb(f.frame,sectionCaption(section),sectionKb(section));
  editPanel.mid=(r&&r.result&&r.result.message_id)||null;
}
async function refreshPanel(){
  const section=editPanel.section||'img';
  const f=await renderWorkingFrame();
  if(!f){await send('⚠️ Frame de travail indispo.');return;}
  editPrevFrame=f.frame;
  let ok=false;
  if(editPanel.mid)ok=await editPhotoKb(editPanel.mid,f.frame,sectionCaption(section),sectionKb(section));
  if(!ok){const r=await sendPhotoKb(f.frame,sectionCaption(section),sectionKb(section));editPanel.mid=(r&&r.result&&r.result.message_id)||null;}
}
async function showEditHome(){
  await send('🎛 <b>ÉDITION DU LOOK</b>\n\n📸 Photo de travail : <b>'+workSrcLabel()+'</b>\nChoisis une section :',[
    [{text:'👤 Looks (changer la photo)',callback_data:'EDIT_LOOKS'}],
    [{text:'💬 Sous-titres',callback_data:'EDIT_SUBS'},{text:'🎨 Image',callback_data:'EDIT_IMG'}],
    [{text:'🎬 Zooms',callback_data:'EDIT_ZOOM'},{text:'🎵 Musique',callback_data:'EDIT_MUS'}],
    [{text:'💾 Sauvegarder',callback_data:'SAVESTYLE'},{text:'📂 Mes styles',callback_data:'SHOWSTYLES'}],
    [{text:'👁 Aperçu complet',callback_data:'EDIT_PREVIEW'}],
  ]);
}
function imageKb(){
  const i=readFx().image;const sg=v=>(v>0?'+':'')+v;
  const td=i.temperature<6500?'chaud':i.temperature>6500?'froid':'neutre';
  const keys=Object.keys(IMG_PRESETS);const preRows=[];
  for(let k=0;k<keys.length;k+=3)preRows.push(keys.slice(k,k+3).map(n=>({text:'🎨 '+n,callback_data:'IMG_PRE_'+n})));
  return [
    [{text:'➖',callback_data:'IMG_BR_DN'},{text:'☀️ Lumière: '+sg(i.brightness),callback_data:'NOOP'},{text:'➕',callback_data:'IMG_BR_UP'}],
    [{text:'➖',callback_data:'IMG_CT_DN'},{text:'◐ Contraste: '+i.contrast,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_CT_UP'}],
    [{text:'➖',callback_data:'IMG_SA_DN'},{text:'🌈 Saturation: '+i.saturation,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_SA_UP'}],
    [{text:'🔥',callback_data:'IMG_TE_DN'},{text:'🌡 '+i.temperature+'K ('+td+')',callback_data:'NOOP'},{text:'❄️',callback_data:'IMG_TE_UP'}],
    [{text:'➖',callback_data:'IMG_SH_DN'},{text:'🔪 Netteté: '+i.sharpness,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_SH_UP'}],
    [{text:'➖',callback_data:'IMG_VI_DN'},{text:'⬛ Vignette: '+i.vignette,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_VI_UP'}],
    ...preRows,
    ...navRow(),
  ];
}
function subsKb(){
  const s=readSubs();
  return [
    [{text:'🔤 Police: '+fontLabel(s.font),callback_data:'S_FONT'}],
    [{text:'A+ Taille',callback_data:'S_SIZE_UP'},{text:s.size+'px',callback_data:'NOOP'},{text:'A-',callback_data:'S_SIZE_DN'}],
    [{text:'⬆️ Monter',callback_data:'S_Y_UP'},{text:'y='+s.oy,callback_data:'NOOP'},{text:'⬇️ Descendre',callback_data:'S_Y_DN'}],
    [{text:'🔡+ Espace',callback_data:'S_SP_UP'},{text:s.letter,callback_data:'NOOP'},{text:'🔡- Espace',callback_data:'S_SP_DN'}],
    [{text:s.subs?'💬 Sous-titres: ON':'💬 Sous-titres: OFF',callback_data:'S_SUBS'}],
    ...navRow(),
  ];
}
function zoomKb(){
  const z=readFx().zoom;
  return [
    [{text:z.on?'🎬 Zooms: ON':'🎬 Zooms: OFF',callback_data:'ZM_TOGGLE'}],
    [{text:'💪- ',callback_data:'ZM_IN_DN'},{text:'Intensité '+z.intensity+'×',callback_data:'NOOP'},{text:'💪+',callback_data:'ZM_IN_UP'}],
    [{text:'⏱- ',callback_data:'ZM_DU_DN'},{text:'Durée '+z.duration+'s',callback_data:'NOOP'},{text:'⏱+',callback_data:'ZM_DU_UP'}],
    [{text:'🔁 Fréquence: '+(z.everyN===1?'tous':'1 sur '+z.everyN),callback_data:'ZM_FREQ'}],
    ...navRow(),
  ];
}
function musicKb(){
  const m=readFx().music;const n=musicFiles().length;
  return [
    [{text:m.on?'🎵 Musique: ON':'🎵 Musique: OFF',callback_data:'MU_TOGGLE'}],
    [{text:'⏭ Fichier: '+(m.file||'(aucun)')+(n?'':' — dossier vide'),callback_data:'MU_FILE'}],
    [{text:'🔊- ',callback_data:'MU_VOL_DN'},{text:'Volume '+m.volume,callback_data:'NOOP'},{text:'🔊+',callback_data:'MU_VOL_UP'}],
    ...navRow(),
  ];
}
async function showEditZoom(){
  const z=readFx().zoom;
  await send(`🎬 <b>ZOOMS</b>\n\n🎬 État: <b>${z.on?'ON':'OFF'}</b>\n💪 Intensité: ${z.intensity}x\n⏱ Durée/zoom: ${z.duration}s\n🔁 Fréquence: ${z.everyN===1?'tous les mots-clés':'1 sur '+z.everyN}`,[
    [{text:z.on?'🎬 Zooms: OFF':'🎬 Zooms: ON',callback_data:'ZM_TOGGLE'}],
    [{text:'💪+ Intensité',callback_data:'ZM_IN_UP'},{text:'💪- Intensité',callback_data:'ZM_IN_DN'}],
    [{text:'⏱+ Durée',callback_data:'ZM_DU_UP'},{text:'⏱- Durée',callback_data:'ZM_DU_DN'}],
    [{text:'🔁 Fréquence (tous / 1 sur 2)',callback_data:'ZM_FREQ'}],
    [{text:'↩️ Annuler',callback_data:'UNDO_EDIT'},{text:'✔️ Valider',callback_data:'VALIDATE_STYLE'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
  ]);
}
async function showEditMusic(){
  const m=readFx().music;const files=musicFiles();
  const cur=m.file||'(aucun)';
  const warn=files.length?`${files.length} fichier(s) dans music/`:'⚠️ Aucun mp3/m4a dans ~/podcast-workflow/music/ — déposes-en (iCloud) puis reviens.';
  await send(`🎵 <b>MUSIQUE</b>\n\n🎵 État: <b>${m.on?'ON':'OFF'}</b>\n📁 Fichier: ${cur}\n🔊 Volume: ${m.volume}\n\n${warn}`,[
    [{text:m.on?'🎵 Musique: OFF':'🎵 Musique: ON',callback_data:'MU_TOGGLE'}],
    [{text:'⏭ Fichier suivant',callback_data:'MU_FILE'}],
    [{text:'🔊+ Volume',callback_data:'MU_VOL_UP'},{text:'🔊- Volume',callback_data:'MU_VOL_DN'}],
    [{text:'↩️ Annuler',callback_data:'UNDO_EDIT'},{text:'✔️ Valider',callback_data:'VALIDATE_STYLE'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
  ]);
}
function patchWF(fn){
  const wfp=path.join(BASE,'workflow.js');
  let c=fs.readFileSync(wfp,'utf8');
  c=fn(c);
  fs.writeFileSync(wfp,c);
}
// ── /preview : rend ~3s du dernier raw de test avec le STYLE COURANT et envoie 2 frames (gratuit) ──
async function runPreview(){
  try{
    const src=workSrc(); // PHOTO DE TRAVAIL COURANTE
    if(!src){await send('⚠️ Aucune photo de travail. Choisis un look 👤 ou lance un /go.');return;}
    await send('👁 Aperçu du style courant (photo de travail : '+path.basename(src)+')... ~2s');
    const f=await renderWorkingFrame();
    if(!f){await send('❌ Aperçu indispo.');return;}
    const st=f.style, fx=readFx();
    const img=fx.image, colored=(img.brightness||img.contrast!==1||img.saturation!==1||img.temperature!==6500||img.sharpness||img.vignette)?'oui':'neutre';
    const cap=`🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy}\n🎬 zoom ${fx.zoom.on?'ON ×'+fx.zoom.intensity:'OFF'} • 🎨 couleur ${colored} • 🎵 ${fx.music.on?(fx.music.file||'on'):'OFF'}`;
    await sendImg(f.frame,cap).catch(()=>{});
  }catch(e){await send('❌ Aperçu: '+e.message);}
}

// ── Update handler ────────────────────────────────────────────────────────────
async function handle(upd){
  // Callback
  if(upd.callback_query){
    const cb=upd.callback_query;
    await answerCB(cb.id);
    if(String(cb.message.chat.id)!==CHAT_ID)return;
    const d=cb.data;
    // Menu principal
    if(d==='MAIN_MENU'){await showMainMenu();return;}
    if(d==='MENU_GEN'){gwReset();await showRecap();return;}
    if(d==='EXPRESS_NEW'){gwReset();await recapGo();return;} /*express 1-tap : défauts state.json -> GO direct*/
    // ── Carte récap : lignes modifiables ──
    if(d==='RC_CANCEL'){state='idle';await send('❌ Annulé.');await showMainMenu();return;}
    if(d==='RC_LOOK'){
      const ll=(genState.lastLooks||[]).filter(p=>fs.existsSync(p));
      const rows=ll.map((p,i)=>[{text:'🖼 '+path.basename(p),callback_data:'RC_LL_'+i}]);
      rows.push([{text:'👤 Galerie complète',callback_data:'RC_GALLERY'}]);
      rows.push([{text:'◀️ Récap',callback_data:'RC_BACK'}]);
      await send('👤 <b>LOOK</b> — 3 derniers utilisés ou galerie :',rows);return;
    }
    if(d.startsWith('RC_LL_')){const ll=(genState.lastLooks||[]).filter(p=>fs.existsSync(p));const p=ll[+d.slice(6)];if(p){gw.look=p;setWorkPhoto(p);}await showRecap();return;}
    if(d==='RC_GALLERY'){galForRecap=true;gal.idx=0;await showLook();return;}
    if(d==='RC_BACK'){await showRecap();return;}
    if(d==='RC_STYLE'){
      const list=listStyles();
      const rows=list.map((f,i)=>[{text:'📂 '+f.replace(/\.json$/,''),callback_data:'RC_ST_'+i}]);
      rows.unshift([{text:'🎨 Style actuel (ne pas changer)',callback_data:'RC_ST_CUR'}]);
      rows.push([{text:'◀️ Récap',callback_data:'RC_BACK'}]);
      await send('🎨 <b>STYLE</b> — applique un style enregistré :',rows);return;
    }
    if(d==='RC_ST_CUR'){gw.styleName=null;await showRecap();return;}
    if(d.startsWith('RC_ST_')){const list=listStyles();const f=list[+d.slice(6)];if(f){try{applySnapshot(JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8')));gw.styleName=f.replace(/\.json$/,'');}catch(e){}}await showRecap();return;}
    if(d==='RC_SUBJ'){await send('💬 <b>SUJET</b>',[[{text:'🎲 Auto',callback_data:'RC_SUBJ_AUTO'},{text:'⌨️ Le mien',callback_data:'RC_SUBJ_MINE'}],[{text:'◀️ Récap',callback_data:'RC_BACK'}]]);return;}
    if(d==='RC_SUBJ_AUTO'){gw.subjectMode='auto';gw.topic=null;await showRecap();return;}
    if(d==='RC_SUBJ_MINE'){state='rc_topic_wait';await send('⌨️ Tape ton sujet (ex: « pourquoi il revient quand tu l\'ignores ») :');return;}
    if(d==='RC_DUR_15'){gw.duration='15s';await showRecap();return;}
    if(d==='RC_DUR_23'){gw.duration='23s';await showRecap();return;}
    if(d==='RC_DUR_30'){gw.duration='30s';await showRecap();return;}
    if(d==='RC_DUR_FREE'){state='rc_dur_wait';await send('⌨️ Durée en secondes (5–180). Au-delà de ~30s = plusieurs parties assemblées.');return;}
    if(d==='RC_GO'){await recapGo();return;}
    // ── Étape script / maquette / GO ──
    if(d==='GJ_OK'){if(genJob)await genAfterScript();else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_NEW'){if(genJob)await genScriptStep();else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_EDIT'){if(!genJob){await send('⚠️ Aucun script.');return;}state='gj_edit_wait';await send('✏️ Renvoie-moi le texte complet du script (il remplacera l\'actuel) :');return;}
    if(d==='GJ_MOCK'){await genMockup();return;}
    if(d==='GJ_GO'){await genFinal();return;}
    if(d==='GJ_CANCEL'){genJob=null;state='idle';await send('❌ Annulé.');return;}
    if(d==='MENU_LOOKS'){gal.idx=0;await showLook();return;}
    if(d==='FILES_HOME'){await showFilesMenu();return;}
    if(d.startsWith('FCAT_')){await showFileList(d.slice(5),0);return;}
    if(d.startsWith('FPAGE_')){const m=d.slice(6).match(/^(\w+)_(\d+)$/);if(m)await showFileList(m[1],+m[2]);return;}
    if(d.startsWith('FGET_')){const it=fileList[+d.slice(5)];await sendFile(it&&it.path);return;}
    if(d==='MENU_TEST'){await runLocalTest();return;}
    if(d==='MENU_HELP'){await send(HELP_TXT);return;}
    if(d==='MENU_TECH'){await send('⚙️ <b>Réglages techniques</b>',[
      [{text:'ℹ️ Statut',callback_data:'TECH_STATUS'}],
      [{text:'🔄 Redémarrer le bot',callback_data:'TECH_RESTART'}],
      [{text:'⏹ Tout arrêter',callback_data:'TECH_STOP'}],
      [{text:'◀️ Menu',callback_data:'MAIN_MENU'}],
    ]);return;}
    if(d==='TECH_STATUS'){await send(proc?'🟢 Running ('+state+')':'⚪ Idle');return;}
    if(d==='TECH_RESTART'){
      if(proc||testProc){await send('⛔ Génération ou test en cours — utilise ⏹ d\'abord.');return;}
      await send('🔄 Redémarrage... (retour dans ~5s)');
      try{await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=0`);}catch(e){}
      try{releaseLock();}catch(e){}process.exit(0);return;
    }
    if(d==='TECH_STOP'){
      let stopped=false;
      if(proc){try{proc.kill('SIGKILL');}catch(e){}proc=null;stopped=true;}
      if(testProc){try{testProc.kill('SIGKILL');}catch(e){}testProc=null;stopped=true;} genJob=null;
      try{require('child_process').execSync('pkill -9 -f "node.*workflow.js" 2>/dev/null');stopped=true;}catch(e){}
      state='idle';await send(stopped?'⏹ Stoppé.':'Rien en cours.');return;
    }
    // Topic selection
    if(d==='T_AUTO'){const idx=Math.floor(Math.random()*TOPIC_IDEAS.length);setup.topic=TOPIC_IDEAS[idx][1];await showSummary();return;}
    if(d.match(/^T_\d+$/)){const i=+d.slice(2);setup.topic=TOPIC_IDEAS[i][1];await send('✅ Topic: '+TOPIC_IDEAS[i][1]);await step2_look();return;}
    // Look
    if(d==='L_KEEP'){await step3_duration();return;}
    if(d==='L_RANDOM'){await pickAndShow();return;}
    if(d==='L_UPLOAD'){state='upload_wait';await send('📷 Send me a photo now (as a photo message):');return;}
    // Duration
    if(d==='D_25'){setup.duration='25s';await step1_topic();return;}
    if(d==='D_40'){setup.duration='40s';await step1_topic();return;}
    if(d==='D_65'){setup.duration='65s';await step1_topic();return;}
    // Summary actions
    if(d==='GO'){
      await send('Writing script...');
      try{
        const Anthropic=require('@anthropic-ai/sdk');
        const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
        const words=setup.duration==='65s'?'160-180':setup.duration==='40s'?'90-110':'55-60';
        const t=setup.topic||'relationship red flags women should know';
        const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:300,
          messages:[{role:'user',content:'TikTok script for relationship coach women 20-40. Topic: "'+t+'". EXACTLY '+words+' words. Shocking hook first. Max 8 words per sentence. Add [pause] after hook. No em dashes. Return ONLY the script, nothing else.'}]
        });
        const script=r.content[0].text.trim();
        setup.approvedScript=script.replace(/\[pause\]/gi,'');
        await send('Topic: '+t+'\n\nScript:\n\n'+script.replace(/\[pause\]/gi,'[...]'));
await send('Ready to generate video?',[
          [{text:'Generate Video',callback_data:'SCRIPT_OK'},{text:'Regenerate',callback_data:'AUTO_ALL'},{text:'Cancel',callback_data:'CANCEL'}]
        ]);
      }catch(e){
        launch();await send('Script preview failed, launching...');
      }
      return;
    }
      if(d==='SCRIPT_OK'){isAuto=true;autoAnswers=['NO','NO','YES','YES'];/*parts demandees a la main*/launch();return;}
    if(d==='AUTO_ALL'){
      isAuto=false;
      setup={topic:null,photo:null,duration:'40s'};
      const idx=Math.floor(Math.random()*TOPIC_IDEAS.length);
      setup.topic=TOPIC_IDEAS[idx][1];
      const lDir=require('path').join(require('os').homedir(),'podcast-workflow','looks');
      try{
        const _pp=require('./look_picker.js').pickLook(lDir); /*lookpick v1*/
        if(_pp){
          setup.photo=_pp;
          setAvatar(setup.photo);
          const tmp='/tmp/auto'+Date.now()+'.jpg';
          try{require('child_process').execSync('sips -Z 800 -s format jpeg "'+setup.photo+'" --out "'+tmp+'" 2>/dev/null');await sendImg(tmp,'Look selected').catch(()=>{});}catch{}
        }
      }catch(e){}
      await send('Writing script...');
      try{
        const Anthropic=require('@anthropic-ai/sdk');
        const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
        const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:300,
          messages:[{role:'user',content:'TikTok script relationship coach women 20-40. Topic: "'+setup.topic+'". 90-110 words. Shocking hook first. Max 8 words per sentence. Add [pause] after hook. No em dashes. Return ONLY the script.'}]
        });
        const script=r.content[0].text.trim().replace(/\[pause\]/gi,'');
        setup.script=script; /*auto recap v1*/
        await mRecap();
      }catch(e){await send('Error: '+e.message);state='idle';}
      return;
    }
    if(d==='EXPRESS_GO'){ /*express v1*/
          isAuto=true;
          setup={topic:null,photo:null,duration:'40s'};
          const idx=Math.floor(Math.random()*TOPIC_IDEAS.length);
          setup.topic=TOPIC_IDEAS[idx][1];
          const lDir=require('path').join(require('os').homedir(),'podcast-workflow','looks');
          try{
            const _pp=require('./look_picker.js').pickLook(lDir); /*lookpick v1*/
            if(_pp){
              setup.photo=_pp;
              setAvatar(setup.photo);
              const tmp='/tmp/exp'+Date.now()+'.jpg';
              try{require('child_process').execSync('sips -Z 800 -s format jpeg "'+setup.photo+'" --out "'+tmp+'" 2>/dev/null');await sendImg(tmp,'📸 Look').catch(()=>{});}catch{}
            }
          }catch(e){}
          autoAnswers=['NO','NO','YES','YES'];
          await send('🚀 Express — aucune validation. Les étapes vont défiler jusqu’à la vidéo. (parties 2 et 3 proposées à la fin)').catch(()=>{});
          launch();return;
        }
        if(d==='SAVE_VID'){/*botfixes v1*/ if(setup.lastVideo&&fs.existsSync(setup.lastVideo)){try{const FormData=require('form-data');const fdv=new FormData();fdv.append('chat_id',CHAT_ID);fdv.append('document',fs.createReadStream(setup.lastVideo));fdv.append('caption','🎬 Fichier video');await tg('sendDocument',null,fdv).catch(()=>{});}catch(e){}}else{await send('Fichier introuvable.').catch(()=>{});}return;}
    if(d==='MANUAL_GO'){await mLook(true);return;}
    if(d==='MM_LOOK_KEEP'){if(setup.editing){setup.editing=null;await mRecap();}else{await mDur();}return;}
    if(d==='MM_DUR_10'){setup.duration='10s';if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}return;}
    if(d==='MM_DUR_20'){setup.duration='20s';if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}return;}
    if(d==='MM_DUR_30'){setup.duration='30s';if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}return;}
    if(d==='MM_DUR_40'){setup.duration='40s';if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}return;}
    if(d==='MM_DUR_60'){setup.duration='60s';if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}return;}
    if(d==='MM_DUR_FREE'){state='dur_free_wait';await send('⌨️ Tape la durée en <b>secondes</b> (ex: 25, 60, 90). Au-delà de ~30s, le bot découpe en plusieurs parties enchaînées et les assemble automatiquement.');return;}
    if(d==='MM_TOPIC_KEEP'){if(setup.editing==='topic'){setup.editing=null;setup.script=null;}await mRecap();return;}
    if(d==='MM_TOPIC_NEW'){await mTopic();return;}
    if(d==='MM_TOPIC_SEND'){state='m_topic_wait';await send('✍️ Write your topic in one message:');return;}
    if(d==='MM_TOPIC_CATS'){await mCats();return;}
    if(d==='MM_CAT_random'){setup.topicCat=null;await mTopic('');return;}
    if(d.match(/^MM_CAT_/)){await mTopic(d.slice(7));return;}
    if(d==='MM_START'){console.error('=== DEBUG MM_START clique, photo='+setup.photo);setup.approvedScript=setup.script;isAuto=true;autoAnswers=['NO','NO','YES','YES'];/*parts demandees a la main*/await send('🚀 Génération lancée...');launch();return;}
    if(d==='MM_NEW'){await mLook(true);return;}
    if(d==='MM_CANCEL'){state='idle';setup.editing=null;await send('❌ Cancelled.',[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]);return;}
    if(d==='MM_EDIT'){await mEditMenu();return;}
    if(d==='MM_EDIT_LOOK'){setup.editing='look';await mLook(false);return;}
    if(d==='MM_EDIT_DUR'){setup.editing='dur';await mDur();return;}
    if(d==='MM_EDIT_TOPIC'){setup.editing='topic';await mTopicShow();return;}
    if(d==='MM_EDIT_SCRIPT'){await mScriptMenu();return;}
    if(d==='MM_EDIT_BACK'){await mRecap();return;}
    if(d==='MM_SCRIPT_REGEN'){setup.script=null;await mRecap();return;}
    if(d==='MM_SCRIPT_WRITE'){state='m_script_wait';await send('📝 Write the new script in one message:');return;}
    if(d==='MM_LOOK_ANOTHER'){await mLook(false);return;}
    if(d==='MM_LOOK_UPLOAD'){state='m_upload_wait';await send('📷 Send a photo now (as a photo message):');return;}
    if(d==='NEW_GO'){if(proc){try{proc.kill();}catch(e){}proc=null;}state='idle';await send('Comment générer cette vidéo ?',[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}],[{text:'🚀 Express',callback_data:'EXPRESS_GO'}]]);return;} /*restart v1*/
    if(d==='CHG_TOPIC'){await step1_topic();return;}
    if(d==='CHG_LOOK'){galForRecap=false;gal.idx=0;await showLook();return;}
    if(d==='CANCEL'){state='idle';await send('❌ Cancelled.',[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]);return;}
    // Workflow answers
    if(d.startsWith('A_')&&proc){
      const ans=d.replace('A_','');
      wfInput(ans);state='running';
      //hidden:       if(!autoAnswers.length)await send('Sent: '+ans);return;
    }
    // Galerie de looks
    if(d==='GAL_PREV'){gal.idx--;await showLook();return;}
    if(d==='GAL_NEXT'){gal.idx++;await showLook();return;}
    if(d==='GAL_AVATAR'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Look introuvable.');return;}
      const fp=path.join(getLooksDir(),f);setAvatar(fp);setup.photo=fp;setWorkPhoto(fp);
      await send('✅ Avatar + photo de travail : <b>'+f+'</b>\n(/edit, /preview et /test l\'utilisent.)');return;
    }
    if(d==='GAL_GEN'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Look introuvable.');return;}
      gwReset();gw.look=path.join(getLooksDir(),f);setWorkPhoto(gw.look);
      await showRecap();return;
    }
    if(d==='GAL_PICK'){
      const list=looksList();const f=list[gal.idx];
      if(f){gw.look=path.join(getLooksDir(),f);setWorkPhoto(gw.look);}
      galForRecap=false;await send('✅ Look choisi : <b>'+(f||'?')+'</b>');await showRecap();return;
    }
    if(d==='GAL_EDIT'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Look introuvable.');return;}
      workingSource=path.join(getLooksDir(),f);
      await send('🎨 Édition sur le look <b>'+f+'</b> (il devient la photo de travail).');
      editSectionCur='img';await openPanel('img');return;
    }
    if(d==='GAL_DEL'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Rien à supprimer.');return;}
      const src=path.join(getLooksDir(),f);const dst=path.join(trashDir(),f);
      try{fs.renameSync(src,dst);}catch(e){try{fs.copyFileSync(src,dst);fs.unlinkSync(src);}catch(e2){await send('❌ Échec suppression : '+e2.message);return;}}
      await send('🗑 <b>'+f+'</b> déplacé dans <code>looks/_trash/</code> (réversible — rien n\'est perdu).');
      const after=looksList();if(gal.idx>=after.length)gal.idx=after.length-1;
      await showLook();return;
    }
    if(d==='ADD_LOOK'||d==='ADD_LOOK_AVATAR'){
      if(!pendingPhotoId){await send('⚠️ Aucune photo en attente — renvoie une photo.');return;}
      try{
        const fp=await dlPhotoNamed(pendingPhotoId,'look_'+tsName()+'.jpg');pendingPhotoId=null;
        if(d==='ADD_LOOK_AVATAR'){setAvatar(fp);setup.photo=fp;await send('✅ Ajouté aux looks + défini comme avatar : <b>'+path.basename(fp)+'</b>');}
        else await send('✅ Ajouté aux looks : <b>'+path.basename(fp)+'</b>');
      }catch(e){await send('❌ '+e.message);}
      return;
    }
    if(d==='REF_SET'){
      if(!pendingPhotoId){await send('⚠️ Aucune photo en attente — renvoie une photo.');return;}
      try{
        const r=await tg('getFile',{file_id:pendingPhotoId});
        const buf=await (await fetch(`https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`)).buffer();
        fs.writeFileSync(path.join(BASE,'reference_model.png'),buf);pendingPhotoId=null;
        await send('🎯 Référence mise à jour. Le côte-à-côte de /edit l\'utilisera.');
      }catch(e){await send('❌ '+e.message);}
      return;
    }
    if(d==='ADD_IGNORE'){pendingPhotoId=null;await send('Ok, photo ignorée.');return;}
    // Prêt à poster
    if(d.startsWith('READY_')){
      const i=+d.slice(6);const vp=sentVideos[i];
      if(!vp){await send('⚠️ Vidéo introuvable (relance-la).');return;}
      try{const dst=doReadyToPost(vp);await send('✅ Copié dans <code>outputs/ready_to_post/</code> :\n<b>'+path.basename(dst)+'</b>\n📱 Visible dans Fichiers (iCloud) sur iPhone. Légendes + style enregistrés avec.');}catch(e){await send('❌ '+e.message);}
      return;
    }
    if(d==='SHOWREADY'){await showReady();return;}
    if(d.startsWith('REUSE_')){
      const i=+d.slice(6);const f=readyList[i];
      if(!f){await send('⚠️ Entrée introuvable (rouvre 📤).');return;}
      const sj=path.join(readyDir(),f.replace(/\.mp4$/,'.style.json'));
      if(!fs.existsSync(sj)){await send('⚠️ Pas de snapshot de style pour cette vidéo.');return;}
      try{editPrevFrame=null;applySnapshot(JSON.parse(fs.readFileSync(sj,'utf8')));await send('✅ Style repris depuis <b>'+f.replace(/\.mp4$/,'')+'</b>.');await sendBeforeAfter();}catch(e){await send('❌ '+e.message);}
      return;
    }
    // Styles sauvegardés
    if(d==='SAVESTYLE'){const n=saveStyleAuto();await send('💾 Style sauvegardé : <b>'+n+'</b>\nRecharge-le via 📂 Mes styles.');return;}
    if(d==='SHOWSTYLES'){await showStyles();return;}
    if(d.startsWith('LOADSTYLE_')){
      const i=+d.slice(10);const f=styleList[i];
      if(!f){await send('⚠️ Style introuvable (rouvre 📂 Mes styles).');return;}
      try{const snap=JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8'));editPrevFrame=null;applySnapshot(snap);await send('✅ Style chargé : <b>'+f.replace(/\.json$/,'')+'</b>');await sendBeforeAfter();}catch(e){await send('❌ '+e.message);}
      return;
    }
    if(d.startsWith('LOADGEN_')){
      const i=+d.slice(8);const f=styleList[i];
      if(!f){await send('⚠️ Style introuvable (rouvre 📂 Mes styles).');return;}
      try{applySnapshot(JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8')));gwReset();gw.styleName=f.replace(/\.json$/,'');await showRecap();}catch(e){await send('❌ '+e.message);}
      return;
    }
    if(d.startsWith('DELSTYLE_')){
      const i=+d.slice(9);const f=styleList[i];
      if(!f){await send('⚠️ Style introuvable.');return;}
      const tdir=path.join(stylesDir(),'_trash');try{fs.mkdirSync(tdir,{recursive:true});}catch(e){}
      try{fs.renameSync(path.join(stylesDir(),f),path.join(tdir,f));await send('🗑 <b>'+f.replace(/\.json$/,'')+'</b> déplacé dans styles/_trash/ (réversible).');}catch(e){await send('❌ '+e.message);}
      await showStyles();return;
    }
    // Menu /edit unifié
    if(d==='EDIT_HOME'){editPrevFrame=null;await showEditHome();return;}
    if(d==='EDIT_SUBS'){editSectionCur='subs';await openPanel('subs');return;}
    if(d==='EDIT_IMG'){editSectionCur='img';await openPanel('img');return;}
    if(d==='EDIT_ZOOM'){editSectionCur='zoom';await openPanel('zoom');return;}
    if(d==='EDIT_MUS'){editSectionCur='mus';await openPanel('mus');return;}
    if(d==='EDIT_LOOKS'){gal.idx=0;await showLook();return;}
    if(d==='EDIT_PREVIEW'||d==='S_PREVIEW'){await runPreview();return;}
    if(d==='CMP_REF'){await sendVsReference();return;}
    if(d==='BEFORE_AFTER'){await sendBeforeAfter();return;}
    if(d==='NOOP')return;
    if(d==='UNDO_EDIT'){if(!undoEdit()){await send('↩️ Rien à annuler.');return;}await send('↩️ Annulé.');await refreshSection();return;}
    if(d==='VALIDATE_STYLE'){clearHistory();await send('✔️ Style validé et figé. (Historique remis à zéro — repars de cet état.)');return;}
    if(d.startsWith('IMG_')){
      pushHistory();
      const fx=readFx(),i=fx.image;
      if(d==='IMG_BR_UP')i.brightness=clampN(i.brightness+0.02,-0.3,0.3);
      if(d==='IMG_BR_DN')i.brightness=clampN(i.brightness-0.02,-0.3,0.3);
      if(d==='IMG_CT_UP')i.contrast=clampN(i.contrast+0.05,0.7,1.5);
      if(d==='IMG_CT_DN')i.contrast=clampN(i.contrast-0.05,0.7,1.5);
      if(d==='IMG_SA_UP')i.saturation=clampN(i.saturation+0.05,0,2);
      if(d==='IMG_SA_DN')i.saturation=clampN(i.saturation-0.05,0,2);
      if(d==='IMG_TE_UP')i.temperature=clampN(i.temperature+200,3500,8500); // froid
      if(d==='IMG_TE_DN')i.temperature=clampN(i.temperature-200,3500,8500); // chaud
      if(d==='IMG_SH_UP')i.sharpness=clampN(i.sharpness+0.15,-1,1.5);
      if(d==='IMG_SH_DN')i.sharpness=clampN(i.sharpness-0.15,-1,1.5);
      if(d==='IMG_VI_UP')i.vignette=clampN(i.vignette+0.5,0,4);
      if(d==='IMG_VI_DN')i.vignette=clampN(i.vignette-0.5,0,4);
      if(d.startsWith('IMG_PRE_')){const n=d.slice(8);if(IMG_PRESETS[n])fx.image=Object.assign({},IMG_PRESETS[n]);}
      writeFx(fx);await refreshPanel();return;
    }
    if(d.startsWith('ZM_')){
      pushHistory();
      const fx=readFx(),z=fx.zoom;
      if(d==='ZM_TOGGLE')z.on=z.on?0:1;
      if(d==='ZM_IN_UP')z.intensity=clampN(z.intensity+0.25,0,3);
      if(d==='ZM_IN_DN')z.intensity=clampN(z.intensity-0.25,0,3);
      if(d==='ZM_DU_UP')z.duration=clampN(z.duration+0.5,0.5,6);
      if(d==='ZM_DU_DN')z.duration=clampN(z.duration-0.5,0.5,6);
      if(d==='ZM_FREQ')z.everyN=z.everyN>=2?1:2;
      writeFx(fx);await refreshPanel();return;
    }
    if(d.startsWith('MU_')){
      pushHistory();
      const fx=readFx(),m=fx.music,files=musicFiles();
      if(d==='MU_TOGGLE')m.on=m.on?0:1;
      if(d==='MU_FILE'){if(files.length){let idx=files.indexOf(m.file);m.file=files[(idx+1)%files.length];}}
      if(d==='MU_VOL_UP')m.volume=clampN(m.volume+0.03,0,1);
      if(d==='MU_VOL_DN')m.volume=clampN(m.volume-0.03,0,1);
      writeFx(fx);await refreshPanel();return;
    }
    // Settings sous-titres /*substyle : taille/position/police/espacement/subs dans subtitle_style.js*/
    if(d.startsWith('S_')){
      pushHistory();
      const sp=path.join(BASE,'subtitle_style.js');
      if(d==='S_SIZE_UP'||d==='S_SIZE_DN'||d==='S_Y_UP'||d==='S_Y_DN'){
        let s=fs.readFileSync(sp,'utf8');
        if(d==='S_SIZE_UP'){const v=+(s.match(/FONT_SIZE\s*=\s*([\d.]+)/)?.[1]||45)+2;s=s.replace(/FONT_SIZE\s*=\s*[\d.]+/,'FONT_SIZE = '+v);}
        if(d==='S_SIZE_DN'){const v=+(s.match(/FONT_SIZE\s*=\s*([\d.]+)/)?.[1]||45)-2;s=s.replace(/FONT_SIZE\s*=\s*[\d.]+/,'FONT_SIZE = '+v);}
        if(d==='S_Y_UP'){const v=(+(s.match(/OY\s*=\s*([\d.]+)/)?.[1]||0.347)+0.02).toFixed(3);s=s.replace(/OY\s*=\s*[\d.]+/,'OY        = '+v);}
        if(d==='S_Y_DN'){const v=(+(s.match(/OY\s*=\s*([\d.]+)/)?.[1]||0.347)-0.02).toFixed(3);s=s.replace(/OY\s*=\s*[\d.]+/,'OY        = '+v);}
        fs.writeFileSync(sp,s);
      }else if(d==='S_FONT'){
        // cycle de police (écrit FONT dans subtitle_style.js, lu par render_local)
        let s=fs.readFileSync(sp,'utf8');
        const cur=s.match(/const\s+FONT\s*=\s*['"]([^'"]+)['"]/)?.[1]||'Arial Black';
        const av=availFonts();
        let idx=av.findIndex(f=>f.family===cur);
        const next=av[(idx+1)%av.length];
        s=s.replace(/const(\s+)FONT(\s*)=\s*['"][^'"]*['"]/,"const$1FONT$2= '"+next.family+"'");
        fs.writeFileSync(sp,s);
      }else if(d==='S_SUBS'){
        let s=fs.readFileSync(sp,'utf8');
        const cur=+(s.match(/const\s+SUBS\s*=\s*([01])/)?.[1]||1);
        s=s.replace(/const(\s+)SUBS(\s*)=\s*[01]/,'const$1SUBS$2= '+(cur?0:1));
        fs.writeFileSync(sp,s);
      }else if(d==='S_SP_UP'||d==='S_SP_DN'){
        // espacement des lettres (LETTER, ex '2px')
        let s=fs.readFileSync(sp,'utf8');
        let v=parseFloat(s.match(/const\s+LETTER\s*=\s*['"]([\d.]+)/)?.[1]||'2');
        v=Math.max(0,Math.min(12,v+(d==='S_SP_UP'?1:-1)));
        s=s.replace(/const(\s+)LETTER(\s*)=\s*['"][^'"]*['"]/,"const$1LETTER$2= '"+v+"px'");
        fs.writeFileSync(sp,s);
      }else if(d==='S_Z_UP'||d==='S_Z_DN'){
        // bouton zoom : patche workflow.js (fallback Shotstack) ET ZOOM dans subtitle_style.js (rendu local)
        const wfp=path.join(BASE,'workflow.js');
        let v=+(fs.readFileSync(wfp,'utf8').match(/scale:([\d.]+)\}/)?.[1]||1.0);
        if(d==='S_Z_UP')v=+(v+0.04).toFixed(2);
        if(d==='S_Z_DN')v=+(v-0.04).toFixed(2);
        if(v<1)v=1; // garde-fou : pas de de-zoom sous 1.0
        const vs=v.toFixed(2);
        patchWF(c=>c.replace(/scale:[\d.]+\}/g,'scale:'+vs+'}'));
        let s=fs.readFileSync(sp,'utf8');
        if(/const\s+ZOOM\s*=/.test(s)){s=s.replace(/const(\s+)ZOOM(\s*)=\s*[\d.]+/,'const$1ZOOM$2= '+vs);fs.writeFileSync(sp,s);}
      }
      await refreshPanel();return;
    }
    return;
  }

  const msg=upd.message;
  if(!msg)return;
  if(String(msg.chat.id)!==CHAT_ID)return;

  // Photo upload
  if(state==='m_upload_wait'&&msg.photo){
    await send('⏳ Enregistrement...');
    try{
      const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);
      setup.photo=fp; _lastPick=fp; setAvatar(fp);
      const tmp='/tmp/mup'+Date.now()+'.jpg';
      try{require('child_process').execSync('sips -Z 800 -s format jpeg "'+fp+'" --out "'+tmp+'" 2>/dev/null');await sendImg(tmp,'🖼️ LOOK (uploadé)').catch(()=>{});}catch{}
      state='m_look';
      await send('Keep this look?',[
        [{text:'✅ Keep',callback_data:'MM_LOOK_KEEP'},{text:'🔀 Pick another',callback_data:'MM_LOOK_ANOTHER'}],
        [{text:'📷 Upload',callback_data:'MM_LOOK_UPLOAD'}],
      ]);
    }catch(e){await send('❌ Erreur: '+e.message);await mLook(false);}
    return;
  }
  if(state==='upload_wait'&&msg.photo){
    await send('⏳ Saving photo...');
    try{
      const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);
      setup.photo=fp;
      _lastPick=fp;
      await sendImg(fp,'✅ Saved! This look will be used.').catch(()=>{});
      await send('👇 Continue?',[
        [{text:'✅ Use this photo',callback_data:'L_KEEP'},{text:'📷 Send another',callback_data:'L_UPLOAD'}],
      ]);
    }catch(e){await send('❌ Error saving: '+e.message);await step2_look();}
    return;
  }

  if(state==='dur_free_wait'&&msg.text){
    let n=parseInt((msg.text.match(/\d+/)||[])[0]||'',10);
    if(!n||n<5){await send('⚠️ Donne un nombre de secondes valide (ex: 25, 60, 90).');return;}
    if(n>180)n=180;
    const parts=Math.max(1,Math.ceil(n/28));
    setup.duration=n+'s';
    await send('✅ Durée: '+n+'s'+(parts>1?` → ${parts} parties enchaînées + assemblage auto.`:' (une partie).'));
    if(setup.editing){setup.editing=null;setup.script=null;await mRecap();}else{await mTopic();}
    return;
  }
  if(state==='gj_edit_wait'&&msg.text){
    if(genJob){genJob.script=msg.text.trim();genJob.c1=Object.assign({},genJob.c1,{script:genJob.script});genJob.audio=null;}
    state='idle';
    await send('✅ Script remplacé.',[[{text:'👁 Maquette',callback_data:'GJ_MOCK'},{text:'🚀 GO direct',callback_data:'GJ_GO'}],[{text:'❌ Annuler',callback_data:'GJ_CANCEL'}]]);
    return;
  }
  if(state==='rc_topic_wait'&&msg.text){
    gw.topic=msg.text.trim();gw.subjectMode='mine';state='idle';
    await send('✅ Sujet : '+gw.topic);await showRecap();return;
  }
  if(state==='rc_dur_wait'&&msg.text){
    let n=parseInt((msg.text.match(/\d+/)||[])[0]||'',10);
    if(!n||n<5){await send('⚠️ Donne un nombre de secondes (5–180).');return;}
    if(n>180)n=180;
    gw.duration=n+'s';state='idle';await showRecap();return;
  }
  if(state==='m_topic_wait'&&msg.text){
    setup.topic=msg.text.trim(); setup.topicCat=null;
    await mTopicShow();
    return;
  }
  if(state==='m_script_wait'&&msg.text){
    setup.script=msg.text.trim();
    await mRecap();
    return;
  }
  // Photo reçue hors des flux de génération -> proposer de l'ajouter aux looks
  if(msg.photo){
    pendingPhotoId=msg.photo[msg.photo.length-1].file_id;
    await send('📸 Photo reçue. Que veux-tu en faire ?',[
      [{text:'➕ Ajouter aux looks',callback_data:'ADD_LOOK'}],
      [{text:'🖼 Ajouter + utiliser comme avatar',callback_data:'ADD_LOOK_AVATAR'}],
      [{text:'🎯 Définir comme référence (côte-à-côte)',callback_data:'REF_SET'}],
      [{text:'❌ Ignorer',callback_data:'ADD_IGNORE'}],
    ]);
    return;
  }
  const txt=(msg.text||'').trim();
  if(!txt)return;
  // menu principal automatique à la 1ère interaction de la journée
  {const _t=new Date().toISOString().slice(0,10);if(_t!==lastMenuDay){lastMenuDay=_t;if(txt!=='/start'&&txt!=='/menu')await showMainMenu().catch(()=>{});}}

  if(txt==='/start'||txt==='/menu'){await showMainMenu();return;}
  if(txt==='/help'){await send(HELP_TXT);return;}
  if(txt==='/go'||txt==='go'){await showMainMenu();return;} /*menu v5 : /go = menu principal*/
  if(txt==='/stop'){ /*stopall v1 : tue TOUT, partout — workflow, test, et leurs enfants curl/ffmpeg*/
    let stopped=false;
    if(proc){try{proc.kill('SIGKILL');}catch(e){} proc=null;stopped=true;}
    if(testProc){try{testProc.kill('SIGKILL');}catch(e){} testProc=null;stopped=true;} genJob=null;
    const _k=require('child_process');
    try{_k.execSync('pkill -9 -f "node.*workflow.js" 2>/dev/null');stopped=true;}catch(e){}
    try{_k.execSync('pkill -9 -f "node.*test_soustitres.js" 2>/dev/null');stopped=true;}catch(e){}
    try{_k.execSync('pkill -9 -f "curl.*tmpfiles" 2>/dev/null');}catch(e){}
    try{_k.execSync('pkill -9 -f "ffmpeg.*/tmp/wf_" 2>/dev/null');}catch(e){}
    state='idle';
    if(stopped)await send('⏹ Stopped — generation et test arretes partout.',[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]);
    else await send('Nothing running.');
    return;
  }
  if(txt==='/status'){await send(proc?'🟢 Running ('+state+')':'⚪ Idle');return;}
  if(txt==='/restart'){ /*restartcmd v1 : redemarrage depuis le chat — pm2 relance automatiquement a l'exit*/
    if(proc||testProc){await send('⛔ Génération ou test en cours — redémarrage refusé. Utilise /stop d\'abord si besoin.');return;}
    await send('🔄 Redémarrage du bot... (retour dans ~5s avec le code à jour)');
    /*restartcmd v2 : ACK de l'update aupres de Telegram AVANT de mourir — sinon /restart est relivre en boucle*/
    try{await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=0`);}catch(e){}
    releaseLock();process.exit(0);
    return;
  }
  if(txt==='/test'){await runLocalTest();return;}
  if(txt==='/edit'){await showEditHome();return;}
  if(txt==='/styles'){await showStyles();return;}
  if(txt==='/posted'){await showReady();return;}
  if(txt==='/files'){await showFilesMenu();return;}
  if(txt==='/settings'){await showSettings();return;}
  if(txt==='/preview'){await runPreview();return;}
  if(txt==='/library'){
    try{
      const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));
      const sc=(lib.scripts||[]).slice(-8).reverse();
      if(!sc.length){await send('No scripts yet.');return;}
      await send('📚 <b>Recent scripts:</b>\n\n'+sc.map((s,i)=>`${i+1}. ${s.title} [${s.performance||'—'}]`).join('\n'));
    }catch{await send('No library yet.');}return;
  }
  if(txt==='/looks'){gal.idx=0;await showLook();return;}
  if(txt==='/ideas'){
    await send('⏳ Generating ideas...');
    try{
      const Anthropic=require('@anthropic-ai/sdk');
      const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
      let used='';
      try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));used=(lib.scripts||[]).map(s=>s.title).join(', ');}catch{}
      const r=await ant.messages.create({
        model:'claude-sonnet-4-6',max_tokens:400,
        messages:[{role:'user',content:'TikTok relationship coach for women 20-40. Already covered: '+used+'. Give 7 NEW viral topic ideas. Short, punchy, numbered list only.'}]
      });
      await send('💡 <b>Ideas:</b>\n\n'+r.content[0].text);
    }catch(e){await send('Error: '+e.message);}return;
  }
  if(txt.startsWith('/mark ')){
    const parts=txt.split(' ');
    const perf=parts[parts.length-1];
    const title=parts.slice(1,-1).join(' ');
    try{
      const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));
      const s=lib.scripts.find(x=>x.title.toLowerCase().includes(title.toLowerCase()));
      if(s){s.performance=perf;fs.writeFileSync(LIBRARY,JSON.stringify(lib,null,2));await send('✅ Marked: '+s.title+' → ['+perf+']');}
      else await send('Not found: '+title);
    }catch{await send('Error.');}return;
  }
  // Topic typed
  if(state==='setup_topic'){setup.topic=txt;await send('✅ Topic: '+txt);await step2_look();return;}
  // Workflow free answer
  if(state==='question'&&proc){wfInput(txt);state='running';await send('Sent: '+txt);return;}

  await send('Send /go to start! Or /help for commands.');
}

// ── Poll ──────────────────────────────────────────────────────────────────────
async function poll(){
  try{
    const r=await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=10`);
    if(r.ok){const d=await r.json();if(d.ok)for(const u of d.result){offset=u.update_id+1;await handle(u).catch(e=>console.error('err:',e.message));}}
  }catch{}
  setTimeout(poll,1000);
}

// ── Single-instance lock + capture d'erreurs ────────────────────────────────
const LOCK_FILE='/tmp/telegram_bot.lock';
try{
  if(fs.existsSync(LOCK_FILE)){
    const oldPid=parseInt(fs.readFileSync(LOCK_FILE,'utf8'),10);
    let alive=false;
    try{ process.kill(oldPid,0); alive=true; }catch(e){ alive=false; }
    if(alive && oldPid!==process.pid){
      console.error('❌ Une autre instance tourne déjà (PID '+oldPid+'). Arrêt.');
      process.exit(1);
    }
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid));
}catch(e){ console.error('lock warn:', e.message); }
function releaseLock(){ try{ if(fs.existsSync(LOCK_FILE) && parseInt(fs.readFileSync(LOCK_FILE,'utf8'),10)===process.pid){ fs.unlinkSync(LOCK_FILE); } }catch(e){} }
process.on('exit', releaseLock);
process.on('SIGINT', ()=>{ releaseLock(); process.exit(0); });
process.on('SIGTERM', ()=>{ releaseLock(); process.exit(0); });
process.on('uncaughtException', (e)=>{ console.error('uncaughtException:', e && e.stack ? e.stack : e); });
process.on('unhandledRejection', (e)=>{ console.error('unhandledRejection:', e && e.stack ? e.stack : e); });

setInterval(()=>{},1<<30);
tg('setMyCommands',{commands:[ /*cmdmenu v2 : les commandes apparaissent dans le menu "/" de Telegram*/
  {command:'go',description:'🏠 Menu principal'},
  {command:'menu',description:'🏠 Menu principal'},
  {command:'edit',description:'🎛 Éditer le look (sous-titres, image, zooms, musique)'},
  {command:'looks',description:'👤 Galerie de looks'},
  {command:'posted',description:'📤 Vidéos prêtes à poster'},
  {command:'files',description:'📁 Fichiers (vidéos, images, légendes, looks)'},
  {command:'styles',description:'💾 Mes styles enregistrés'},
  {command:'preview',description:'👁 Aperçu gratuit du look'},
  {command:'test',description:'🧪 Rendu local gratuit'},
  {command:'settings',description:'⚙️ Réglages sous-titres'},
  {command:'ideas',description:'💡 Idées de sujets'},
  {command:'library',description:'📚 Derniers scripts'},
  {command:'stop',description:'⏹ Tout arrêter'},
  {command:'status',description:'ℹ️ État du bot'},
  {command:'restart',description:'🔄 Redémarrer le bot'},
  {command:'help',description:'❓ Aide'},
]}).catch(()=>{});
/*restartcmd v2 : purge du backlog au demarrage — on ignore tout message recu pendant qu'on etait mort (anti-boucle, anti-rafale)*/
(async()=>{try{const r=await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1&timeout=0`);const d=await r.json();if(d&&d.ok&&d.result&&d.result.length)offset=d.result[d.result.length-1].update_id+1;}catch(e){}})().then(()=>
send('🤖 <b>Bot prêt !</b>\n\nTape /menu pour le menu principal.')).then(()=>{
  loadState();console.log('Bot running...');poll();
}).catch(e=>{console.error(e.message);process.exit(1);});

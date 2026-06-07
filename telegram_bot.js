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
    if(caption)form.append('caption',caption);
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendPhoto',{method:'POST',body:form});
    return r.json();
  }catch(e){console.error('sendPhotoKb',e.message);return send((caption||'📸')+' (image indisponible)',rows);}
}
let gal={files:[],idx:0};
let pendingPhotoId=null; // dernière photo reçue hors flux (pour « ajouter aux looks »)
async function showLook(){
  gal.files=looksList();
  if(!gal.files.length){await send('📭 Aucun look dans <code>looks/</code>. Envoie-moi une photo pour en ajouter un.');return;}
  if(gal.idx<0)gal.idx=gal.files.length-1; if(gal.idx>=gal.files.length)gal.idx=0;
  const name=gal.files[gal.idx];const fp=path.join(getLooksDir(),name);
  // iCloud : tente le téléchargement si le fichier semble être un placeholder
  try{if(!fs.existsSync(fp)||fs.statSync(fp).size<30000){try{require('child_process').execSync('brctl download "'+fp+'" 2>/dev/null');}catch(e){}}}catch(e){}
  await sendPhotoKb(fp,`🖼 Look ${gal.idx+1}/${gal.files.length}\n${name}`,[
    [{text:'◀️',callback_data:'GAL_PREV'},{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🗑',callback_data:'GAL_DEL'},{text:'▶️',callback_data:'GAL_NEXT'}],
  ]);
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
  await send('⏱️ 2/4 — DURATION',[
    [{text:'10s',callback_data:'MM_DUR_10'},{text:'20s',callback_data:'MM_DUR_20'},{text:'30s',callback_data:'MM_DUR_30'}],
    [{text:'40s',callback_data:'MM_DUR_40'},{text:'60s',callback_data:'MM_DUR_60'}],
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
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
  ]);
}
// ── Helpers /edit (Image, Zooms, Musique) — stockés dans style.json ─────────────
const RL=require('./render_local');
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
  const rows=styleList.map((f,i)=>[{text:'📂 '+f.replace(/\.json$/,''),callback_data:'LOADSTYLE_'+i},{text:'🗑',callback_data:'DELSTYLE_'+i}]);
  rows.push([{text:'◀️ Menu',callback_data:'EDIT_HOME'}]);
  await send('📂 <b>MES STYLES</b>\n\nCharge ou supprime un style :',rows);
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
  if(!readyList.length){await send('📤 <b>PRÊT À POSTER</b>\n\nVide pour l\'instant.\nSur une vidéo livrée, appuie sur « ✅ Prêt à poster » → elle est copiée dans <code>outputs/ready_to_post/</code> (visible dans Fichiers iCloud sur iPhone).');return;}
  const rows=readyList.slice(0,20).map((f,i)=>[{text:'♻️ '+f.replace(/\.mp4$/,'').slice(0,32),callback_data:'REUSE_'+i}]);
  await send('📤 <b>PRÊT À POSTER</b> ('+readyList.length+')\n\n📱 Dossier <code>outputs/ready_to_post/</code> (iCloud).\n♻️ Reprendre le style d\'une vidéo :',rows);
}
const IMG_PRESETS={
  'Naturel':{brightness:0,contrast:1,saturation:1,temperature:6500,sharpness:0,vignette:0},
  'Chaud':{brightness:0.03,contrast:1.05,saturation:1.18,temperature:4800,sharpness:0.3,vignette:1},
  'Cinéma':{brightness:-0.02,contrast:1.22,saturation:0.92,temperature:5500,sharpness:0.6,vignette:3},
  'Luxe':{brightness:0.02,contrast:1.12,saturation:1.28,temperature:5200,sharpness:0.7,vignette:2},
  'Soft':{brightness:0.05,contrast:0.96,saturation:1.05,temperature:6000,sharpness:0,vignette:1},
};
function musicFiles(){try{return fs.readdirSync(RL.MUSIC_DIR).filter(f=>/\.(mp3|m4a)$/i.test(f)&&!f.startsWith('.')&&!f.startsWith('_'));}catch(e){return[];}}
function latestRaw(){const OUT=path.join(BASE,'outputs');try{const r=fs.readdirSync(OUT).filter(f=>/_raw_p\d+\.mp4$/i.test(f)).map(f=>path.join(OUT,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);return r[0]||null;}catch(e){return null;}}
// Rend un court clip avec le STYLE COURANT et envoie l'image composite [RÉFÉRENCE | RENDU]
async function sendCompareNow(){
  const raw=latestRaw();
  if(!raw){await send('⚠️ Côte-à-côte indispo : aucun _raw_p*.mp4 dans outputs/ (lance un /go).');return;}
  const {renderLocal}=require('./render_local');
  const words='WRONG YOURE';
  const wt=words.split(' ').map((w,i)=>({text:w.toUpperCase(),start:+(i*0.5).toFixed(3),end:+((i+1)*0.5).toFixed(3),duration:0.5}));
  const out='/tmp/cmp_'+Date.now()+'.mp4';
  let r;try{r=await renderLocal({input:raw,wordTimings:wt,keywords:['WRONG'],reactions:[],output:out,quiet:true,duration:1.4});}catch(e){await send('❌ Aperçu: '+e.message);return;}
  const cp=require('child_process');const frame='/tmp/cmpframe.png';
  try{cp.execFileSync('ffmpeg',['-y','-ss','0.6','-i',out,'-frames:v','1','-q:v','2',frame],{stdio:'ignore'});}catch(e){return;}
  const ref=path.join(BASE,'reference_model.png');const comp='/tmp/compare_'+Date.now()+'.png';
  if(fs.existsSync(ref)){
    try{
      const FF='/System/Library/Fonts/Helvetica.ttc';
      cp.execFileSync('ffmpeg',['-y','-i',ref,'-i',frame,'-filter_complex',
        "[0:v]scale=-1:1000,drawtext=fontfile="+FF+":text=REFERENCE:x=12:y=12:fontsize=36:fontcolor=yellow:box=1:boxcolor=black@0.6[a];[1:v]scale=-1:1000,drawtext=fontfile="+FF+":text=RENDU:x=12:y=12:fontsize=36:fontcolor=yellow:box=1:boxcolor=black@0.6[b];[a][b]hstack",comp],{stdio:'ignore'});
    }catch(e){fs.copyFileSync(frame,comp);}
  }else{fs.copyFileSync(frame,comp);}
  const st=r.style;
  await sendImg(comp,`↔️ RÉFÉRENCE | RENDU — 🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy}`).catch(()=>{});
}
// Après un réglage : envoie le côte-à-côte PUIS re-affiche les contrôles de la section
async function afterEdit(section){
  await sendCompareNow();
  if(section==='subs')await showSettings();
  else if(section==='img')await showEditImage();
  else if(section==='zoom')await showEditZoom();
  else if(section==='mus')await showEditMusic();
}
async function showEditHome(){
  await send('🎛 <b>ÉDITION DU LOOK</b>\n\nChoisis une section à régler :',[
    [{text:'💬 Sous-titres',callback_data:'EDIT_SUBS'},{text:'🎨 Image',callback_data:'EDIT_IMG'}],
    [{text:'🎬 Zooms',callback_data:'EDIT_ZOOM'},{text:'🎵 Musique',callback_data:'EDIT_MUS'}],
    [{text:'💾 Sauvegarder ce style',callback_data:'SAVESTYLE'},{text:'📂 Mes styles',callback_data:'SHOWSTYLES'}],
    [{text:'👁 Aperçu du look complet',callback_data:'EDIT_PREVIEW'}],
  ]);
}
async function showEditImage(){
  const i=readFx().image;
  const td=i.temperature<6500?'chaud 🔥':i.temperature>6500?'froid ❄️':'neutre';
  await send(`🎨 <b>IMAGE</b>\n\n☀️ Luminosité: ${i.brightness}\n◐ Contraste: ${i.contrast}\n🌈 Saturation: ${i.saturation}\n🌡 Température: ${i.temperature}K (${td})\n🔪 Netteté: ${i.sharpness}\n⬛ Vignette: ${i.vignette}`,[
    [{text:'☀️+',callback_data:'IMG_BR_UP'},{text:'☀️-',callback_data:'IMG_BR_DN'},{text:'◐+',callback_data:'IMG_CT_UP'},{text:'◐-',callback_data:'IMG_CT_DN'}],
    [{text:'🌈+',callback_data:'IMG_SA_UP'},{text:'🌈-',callback_data:'IMG_SA_DN'},{text:'🔥 chaud',callback_data:'IMG_TE_DN'},{text:'❄️ froid',callback_data:'IMG_TE_UP'}],
    [{text:'🔪+',callback_data:'IMG_SH_UP'},{text:'🔪-',callback_data:'IMG_SH_DN'},{text:'⬛+',callback_data:'IMG_VI_UP'},{text:'⬛-',callback_data:'IMG_VI_DN'}],
    [{text:'Naturel',callback_data:'IMG_PRE_Naturel'},{text:'Chaud',callback_data:'IMG_PRE_Chaud'},{text:'Cinéma',callback_data:'IMG_PRE_Cinéma'}],
    [{text:'Luxe',callback_data:'IMG_PRE_Luxe'},{text:'Soft',callback_data:'IMG_PRE_Soft'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
  ]);
}
async function showEditZoom(){
  const z=readFx().zoom;
  await send(`🎬 <b>ZOOMS</b>\n\n🎬 État: <b>${z.on?'ON':'OFF'}</b>\n💪 Intensité: ${z.intensity}x\n⏱ Durée/zoom: ${z.duration}s\n🔁 Fréquence: ${z.everyN===1?'tous les mots-clés':'1 sur '+z.everyN}`,[
    [{text:z.on?'🎬 Zooms: OFF':'🎬 Zooms: ON',callback_data:'ZM_TOGGLE'}],
    [{text:'💪+ Intensité',callback_data:'ZM_IN_UP'},{text:'💪- Intensité',callback_data:'ZM_IN_DN'}],
    [{text:'⏱+ Durée',callback_data:'ZM_DU_UP'},{text:'⏱- Durée',callback_data:'ZM_DU_DN'}],
    [{text:'🔁 Fréquence (tous / 1 sur 2)',callback_data:'ZM_FREQ'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
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
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'◀️ Menu',callback_data:'EDIT_HOME'}],
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
    const {renderLocal}=require('./render_local');
    const OUT=path.join(BASE,'outputs');
    const raws=fs.readdirSync(OUT).filter(f=>/_raw_p\d+\.mp4$/i.test(f)).map(f=>path.join(OUT,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
    if(!raws.length){await send('⚠️ Aucun raw de test dans outputs/ — lance d\'abord un /go pour en générer un.');return;}
    await send('👁 Aperçu du style courant... (~2s, gratuit)');
    const S='SHE SAYS YOU CHANGED BUT CHEMISTRY FADES WHEN RESPECT DIES';
    const wt=S.split(' ').map((w,i)=>({text:w.toUpperCase(),start:+(i*0.42).toFixed(3),end:+((i+1)*0.42).toFixed(3),duration:0.42}));
    const out='/tmp/preview_'+Date.now()+'.mp4';
    const r=await renderLocal({input:raws[0],wordTimings:wt,keywords:['CHANGED','CHEMISTRY','RESPECT'],reactions:[],output:out,quiet:true,duration:wt[wt.length-1].end+0.35});
    const cp=require('child_process');
    const f1='/tmp/preview_a.png',f2='/tmp/preview_b.png';
    cp.execFileSync('ffmpeg',['-y','-ss','1.20','-i',out,'-frames:v','1','-q:v','2',f1],{stdio:'ignore'});
    cp.execFileSync('ffmpeg',['-y','-ss','3.60','-i',out,'-frames:v','1','-q:v','2',f2],{stdio:'ignore'});
    const st=r.style, fx=r.fx;
    const img=fx.image, colored=(img.brightness||img.contrast!==1||img.saturation!==1||img.temperature!==6500||img.sharpness||img.vignette)?'oui':'neutre';
    const cap=`🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy} • 💬 ${st.subs?'ON':'OFF'}\n🎬 zoom ${fx.zoom.on?'ON x'+fx.zoom.intensity:'OFF'} • 🎨 couleur ${colored} • 🎵 ${fx.music.on?fx.music.file:'OFF'}`;
    await sendImg(f1,cap).catch(()=>{});
    await sendImg(f2,'👁 Aperçu (pendant zoom) — ajuste via /edit').catch(()=>{});
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
      const fp=path.join(getLooksDir(),f);setAvatar(fp);setup.photo=fp;
      await send('✅ Avatar défini : <b>'+f+'</b>\nIl sera utilisé pour la prochaine vidéo.');return;
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
      try{applySnapshot(JSON.parse(fs.readFileSync(sj,'utf8')));await send('✅ Style repris depuis <b>'+f.replace(/\.mp4$/,'')+'</b>.');await sendCompareNow();}catch(e){await send('❌ '+e.message);}
      return;
    }
    // Styles sauvegardés
    if(d==='SAVESTYLE'){const n=saveStyleAuto();await send('💾 Style sauvegardé : <b>'+n+'</b>\nRecharge-le via 📂 Mes styles.');return;}
    if(d==='SHOWSTYLES'){await showStyles();return;}
    if(d.startsWith('LOADSTYLE_')){
      const i=+d.slice(10);const f=styleList[i];
      if(!f){await send('⚠️ Style introuvable (rouvre 📂 Mes styles).');return;}
      try{const snap=JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8'));applySnapshot(snap);await send('✅ Style chargé : <b>'+f.replace(/\.json$/,'')+'</b>');await sendCompareNow();}catch(e){await send('❌ '+e.message);}
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
    if(d==='EDIT_HOME'){await showEditHome();return;}
    if(d==='EDIT_SUBS'){await showSettings();return;}
    if(d==='EDIT_IMG'){await showEditImage();return;}
    if(d==='EDIT_ZOOM'){await showEditZoom();return;}
    if(d==='EDIT_MUS'){await showEditMusic();return;}
    if(d==='EDIT_PREVIEW'||d==='S_PREVIEW'){await runPreview();return;}
    if(d.startsWith('IMG_')){
      const fx=readFx(),i=fx.image;
      if(d==='IMG_BR_UP')i.brightness=clampN(i.brightness+0.03,-0.5,0.5);
      if(d==='IMG_BR_DN')i.brightness=clampN(i.brightness-0.03,-0.5,0.5);
      if(d==='IMG_CT_UP')i.contrast=clampN(i.contrast+0.05,0.5,2);
      if(d==='IMG_CT_DN')i.contrast=clampN(i.contrast-0.05,0.5,2);
      if(d==='IMG_SA_UP')i.saturation=clampN(i.saturation+0.1,0,3);
      if(d==='IMG_SA_DN')i.saturation=clampN(i.saturation-0.1,0,3);
      if(d==='IMG_TE_UP')i.temperature=clampN(i.temperature+400,2000,12000); // froid
      if(d==='IMG_TE_DN')i.temperature=clampN(i.temperature-400,2000,12000); // chaud
      if(d==='IMG_SH_UP')i.sharpness=clampN(i.sharpness+0.2,0,3);
      if(d==='IMG_SH_DN')i.sharpness=clampN(i.sharpness-0.2,0,3);
      if(d==='IMG_VI_UP')i.vignette=clampN(i.vignette+1,0,5);
      if(d==='IMG_VI_DN')i.vignette=clampN(i.vignette-1,0,5);
      if(d.startsWith('IMG_PRE_')){const n=d.slice(8);if(IMG_PRESETS[n])fx.image=Object.assign({},IMG_PRESETS[n]);}
      writeFx(fx);await afterEdit('img');return;
    }
    if(d.startsWith('ZM_')){
      const fx=readFx(),z=fx.zoom;
      if(d==='ZM_TOGGLE')z.on=z.on?0:1;
      if(d==='ZM_IN_UP')z.intensity=clampN(z.intensity+0.25,0,3);
      if(d==='ZM_IN_DN')z.intensity=clampN(z.intensity-0.25,0,3);
      if(d==='ZM_DU_UP')z.duration=clampN(z.duration+0.5,0.5,6);
      if(d==='ZM_DU_DN')z.duration=clampN(z.duration-0.5,0.5,6);
      if(d==='ZM_FREQ')z.everyN=z.everyN>=2?1:2;
      writeFx(fx);await afterEdit('zoom');return;
    }
    if(d.startsWith('MU_')){
      const fx=readFx(),m=fx.music,files=musicFiles();
      if(d==='MU_TOGGLE')m.on=m.on?0:1;
      if(d==='MU_FILE'){if(files.length){let idx=files.indexOf(m.file);m.file=files[(idx+1)%files.length];}}
      if(d==='MU_VOL_UP')m.volume=clampN(m.volume+0.03,0,1);
      if(d==='MU_VOL_DN')m.volume=clampN(m.volume-0.03,0,1);
      writeFx(fx);await afterEdit('mus');return;
    }
    // Settings sous-titres /*substyle : taille/position/police/espacement/subs dans subtitle_style.js*/
    if(d.startsWith('S_')){
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
      await afterEdit('subs');return;
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

  if(txt==='/start'||txt==='/help'){
    await send('🎬 <b>Podcast Bot Commands</b>\n\n/go — create new video\n/stop — stop workflow\n/status — check status\n/edit — 🎛 éditer le look (sous-titres, image, zooms, musique)\n/settings — réglages sous-titres\n/preview — aperçu gratuit du look courant (frames)\n/library — recent scripts\n/looks — available looks\n/ideas — new topic ideas\n/test — rendu local gratuit (vidéo, style courant)\n/restart — redémarrer le bot (code à jour)\n/mark [title] viral|good|ok — rate a video');return;
  }
  if(txt==='/go'||txt==='go'){await send('Comment générer cette vidéo ?',[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}],[{text:'🚀 Express',callback_data:'EXPRESS_GO'}]]);return;} /*menu v4*/
  if(txt==='/stop'){ /*stopall v1 : tue TOUT, partout — workflow, test, et leurs enfants curl/ffmpeg*/
    let stopped=false;
    if(proc){try{proc.kill('SIGKILL');}catch(e){} proc=null;stopped=true;}
    if(testProc){try{testProc.kill('SIGKILL');}catch(e){} testProc=null;stopped=true;}
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
  if(txt==='/test'){ /*cmdtest v2 : rendu LOCAL gratuit (ffmpeg) — plus de Shotstack sandbox. test_soustitres.js conservé sur disque mais plus appelé.*/
    if(proc){await send('⛔ Une vidéo est en cours — /test refusé (anti-conflit). Réessaie quand c\'est fini.');return;}
    try{
      const {renderLocal}=require('./render_local');
      const OUT=path.join(BASE,'outputs');
      const raws=fs.readdirSync(OUT).filter(f=>/_raw_p\d+\.mp4$/i.test(f)).map(f=>path.join(OUT,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
      if(!raws.length){await send('⚠️ Aucun raw de test dans outputs/ — lance d\'abord un /go pour en générer un.');return;}
      await send('🧪 Rendu LOCAL gratuit (ffmpeg, style courant)... ~2s');
      const S='HE IGNORES YOU THEN CALLS YOU CRAZY THAT IS MANIPULATION NOT LOVE WALK AWAY';
      const wt=S.split(' ').map((w,i)=>({text:w.toUpperCase(),start:+(i*0.42).toFixed(3),end:+((i+1)*0.42).toFixed(3),duration:0.42}));
      const out='/tmp/localtest_'+Date.now()+'.mp4';
      const r=await renderLocal({input:raws[0],wordTimings:wt,keywords:['CRAZY','MANIPULATION','AWAY'],reactions:[{after:'THAT IS MANIPULATION NOT LOVE',type:'mhm'}],output:out,quiet:true,duration:wt[wt.length-1].end+0.35});
      const st=r.style;
      await send(`✅ Rendu local : 🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy} • zoom ${st.baseZoom||1} • 💬 ${st.subs?'ON':'OFF'}`).catch(()=>{});
      await sendVid(out).catch(async()=>{await send('⚠️ Vidéo trop lourde pour Telegram.').catch(()=>{});});
      await offerReadyToPost(out).catch(()=>{});
      await send('Ajuste via /edit puis /preview ou /test.').catch(()=>{});
    }catch(e){await send('❌ Test local : '+e.message);}
    return;
  }
  if(txt==='/edit'){await showEditHome();return;}
  if(txt==='/styles'){await showStyles();return;}
  if(txt==='/posted'){await showReady();return;}
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
tg('setMyCommands',{commands:[ /*cmdmenu v1 : les commandes apparaissent dans le menu "/" de Telegram*/
  {command:'go',description:'🎬 Créer une vidéo'},
  {command:'stop',description:'⏹ Tout arrêter (génération + test)'},
  {command:'test',description:'🧪 Test sous-titres gratuit (sandbox)'},
  {command:'restart',description:'🔄 Redémarrer le bot (code à jour)'},
  {command:'status',description:'ℹ️ État du bot'},
  {command:'edit',description:'🎛 Éditer le look (sous-titres, image, zooms, musique)'},
  {command:'settings',description:'⚙️ Réglages sous-titres'},
  {command:'preview',description:'👁 Aperçu gratuit du look courant'},
  {command:'library',description:'📚 Derniers scripts'},
  {command:'looks',description:'📸 Looks disponibles'},
  {command:'ideas',description:'💡 Idées de sujets'},
]}).catch(()=>{});
/*restartcmd v2 : purge du backlog au demarrage — on ignore tout message recu pendant qu'on etait mort (anti-boucle, anti-rafale)*/
(async()=>{try{const r=await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1&timeout=0`);const d=await r.json();if(d&&d.ok&&d.result&&d.result.length)offset=d.result[d.result.length-1].update_id+1;}catch(e){}})().then(()=>
send('🤖 <b>Bot ready!</b>\n\nSend /go to create a video.')).then(()=>{
  console.log('Bot running...');poll();
}).catch(e=>{console.error(e.message);process.exit(1);});

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
let _lastPick=null;
function pickRandom(){
  try{
    const dir=getLooksDir();
    const files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));
    if(!files.length)return null;
    // Exclude last picked to always show a different one
    const pool=files.length>1?files.filter(f=>path.join(dir,f)!==_lastPick):files;
    const pick=pool[Math.floor(Math.random()*pool.length)];
    _lastPick=path.join(dir,pick);
    return _lastPick;
  }catch{return null;}
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
  const lDir=require('path').join(require('os').homedir(),'podcast-workflow','looks');try{const files=require('fs').readdirSync(lDir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));if(files.length>0){const pick=files[Math.floor(Math.random()*files.length)];setup.photo=require('path').join(lDir,pick);setAvatar(setup.photo);const tmp='/tmp/lk'+Date.now()+'.jpg';try{require('child_process').execSync('sips -Z 800 -s format jpeg "'+setup.photo+'" --out "'+tmp+'" 2>/dev/null');await sendImg(tmp,'\U0001f4f8 Step 1/3 — Look').catch(()=>{});}catch{}}}catch(e){}
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
  if(setup.topic)args.push(setup.topic);
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

// ── Settings ──────────────────────────────────────────────────────────────────
async function showSettings(){
  /*substyle v1 : taille+position lues dans subtitle_style.js (source unique), zoom dans workflow.js*/
  const s=fs.readFileSync(path.join(BASE,'subtitle_style.js'),'utf8');
  const c=fs.readFileSync(path.join(BASE,'workflow.js'),'utf8');
  const size=s.match(/FONT_SIZE\s*=\s*(\d+)/)?.[1]||'?';
  const y=s.match(/OY\s*=\s*([\d.]+)/)?.[1]||'?';
  const zoom=c.match(/scale:([\d.]+)\}/)?.[1]||'?';
  await send(`⚙️ <b>Current Settings</b>\n\n📝 Subtitle size: ${size}px\n📍 Position y: ${y}\n🔍 Zoom: ${zoom}x`,[
    [{text:'A+ Bigger',callback_data:'S_SIZE_UP'},{text:'A- Smaller',callback_data:'S_SIZE_DN'}],
    [{text:'⬆️ Move up',callback_data:'S_Y_UP'},{text:'⬇️ Move down',callback_data:'S_Y_DN'}],
    [{text:'🔍+ More zoom',callback_data:'S_Z_UP'},{text:'🔍- Less zoom',callback_data:'S_Z_DN'}],
  ]);
}
function patchWF(fn){
  const wfp=path.join(BASE,'workflow.js');
  let c=fs.readFileSync(wfp,'utf8');
  c=fn(c);
  fs.writeFileSync(wfp,c);
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
        const files=require('fs').readdirSync(lDir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));
        if(files.length>0){
          const pick=files[Math.floor(Math.random()*files.length)];
          setup.photo=require('path').join(lDir,pick);
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
            const files=require('fs').readdirSync(lDir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));
            if(files.length>0){
              const pick=files[Math.floor(Math.random()*files.length)];
              setup.photo=require('path').join(lDir,pick);
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
    // Settings /*substyle v1 : taille+position patchees dans subtitle_style.js, zoom dans workflow.js*/
    if(d.startsWith('S_')){
      if(d==='S_SIZE_UP'||d==='S_SIZE_DN'||d==='S_Y_UP'||d==='S_Y_DN'){
        const sp=path.join(BASE,'subtitle_style.js');
        let s=fs.readFileSync(sp,'utf8');
        if(d==='S_SIZE_UP'){const v=+(s.match(/FONT_SIZE\s*=\s*(\d+)/)?.[1]||52)+2;s=s.replace(/FONT_SIZE\s*=\s*\d+/,'FONT_SIZE = '+v);}
        if(d==='S_SIZE_DN'){const v=+(s.match(/FONT_SIZE\s*=\s*(\d+)/)?.[1]||52)-2;s=s.replace(/FONT_SIZE\s*=\s*\d+/,'FONT_SIZE = '+v);}
        if(d==='S_Y_UP'){const v=(+(s.match(/OY\s*=\s*([\d.]+)/)?.[1]||0.347)+0.02).toFixed(3);s=s.replace(/OY\s*=\s*[\d.]+/,'OY        = '+v);}
        if(d==='S_Y_DN'){const v=(+(s.match(/OY\s*=\s*([\d.]+)/)?.[1]||0.347)-0.02).toFixed(3);s=s.replace(/OY\s*=\s*[\d.]+/,'OY        = '+v);}
        fs.writeFileSync(sp,s);
      }else{
        patchWF(c=>{
          if(d==='S_Z_UP'){const v=(+(c.match(/scale:([\d.]+)\}/)?.[1]||1.32)+0.04).toFixed(2);return c.replace(/scale:[\d.]+\}/g,'scale:'+v+'}');}
          if(d==='S_Z_DN'){const v=(+(c.match(/scale:([\d.]+)\}/)?.[1]||1.32)-0.04).toFixed(2);return c.replace(/scale:[\d.]+\}/g,'scale:'+v+'}');}
          return c;
        });
      }
      await showSettings();return;
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
  const txt=(msg.text||'').trim();
  if(!txt)return;

  if(txt==='/start'||txt==='/help'){
    await send('🎬 <b>Podcast Bot Commands</b>\n\n/go — create new video\n/stop — stop workflow\n/status — check status\n/settings — subtitles & zoom\n/library — recent scripts\n/looks — available looks\n/ideas — new topic ideas\n/test — test sous-titres sandbox (gratuit)\n/mark [title] viral|good|ok — rate a video');return;
  }
  if(txt==='/go'||txt==='go'){await send('Comment générer cette vidéo ?',[[{text:'⚡ Sur-mesure',callback_data:'MANUAL_GO'},{text:'🎲 Aléatoire',callback_data:'AUTO_ALL'}],[{text:'🚀 Express',callback_data:'EXPRESS_GO'}]]);return;} /*menu v4*/
  if(txt==='/stop'){
    if(proc){proc.kill();proc=null;state='idle';await send('⏹ Stopped.',[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]);}
    else await send('Nothing running.');return;
  }
  if(txt==='/status'){await send(proc?'🟢 Running ('+state+')':'⚪ Idle');return;}
  if(txt==='/test'){ /*cmdtest v1 : test sous-titres sandbox depuis Telegram*/
    if(proc){await send('⛔ Une vidéo est en cours — /test refusé (anti-conflit). Réessaie quand c\'est fini.');return;}
    if(testProc){await send('⏳ Un test tourne déjà, patiente...');return;}
    if(!process.env.SHOTSTACK_SANDBOX_KEY){await send('⚠️ SHOTSTACK_SANDBOX_KEY absente du .env — le test partirait en PRODUCTION (payant). Annulé.');return;}
    await send('🧪 Test sous-titres SANDBOX lancé (gratuit, filigrané)...\n⏳ ~1 à 3 min.');
    let tbuf='';
    testProc=spawn('node',[path.join(BASE,'test_soustitres.js')],{cwd:BASE,env:{...process.env}});
    testProc.stdout.on('data',d=>{tbuf+=d.toString();});
    testProc.stderr.on('data',d=>{tbuf+=d.toString();});
    testProc.on('close',async code=>{
      testProc=null;
      const fp=path.join(BASE,'outputs','TEST_soustitres.mp4');
      if(code===0&&fs.existsSync(fp)){
        await send('✅ Test fini ! Envoi de la vidéo...').catch(()=>{});
        await sendVid(fp).catch(async()=>{await send('⚠️ Vidéo trop lourde pour Telegram — voir iCloud → podcast-outputs/TEST_soustitres.mp4').catch(()=>{});});
        await send('Pour ajuster : dis-le à Claude (plus haut/bas/gros/petit), il modifie FONT_SIZE/OY, puis relance /test.').catch(()=>{});
      }else{
        await send('❌ Test échoué :\n<code>'+tbuf.slice(-350).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))+'</code>').catch(()=>{});
      }
    });
    return;
  }
  if(txt==='/settings'){await showSettings();return;}
  if(txt==='/library'){
    try{
      const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));
      const sc=(lib.scripts||[]).slice(-8).reverse();
      if(!sc.length){await send('No scripts yet.');return;}
      await send('📚 <b>Recent scripts:</b>\n\n'+sc.map((s,i)=>`${i+1}. ${s.title} [${s.performance||'—'}]`).join('\n'));
    }catch{await send('No library yet.');}return;
  }
  if(txt==='/looks'){
    try{
      const files=fs.readdirSync(getLooksDir()).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f));
      await send('📸 <b>'+files.length+' looks</b> available.\n\nUse /go → Random to browse them.');
    }catch{await send('No looks found.');}return;
  }
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
send('🤖 <b>Bot ready!</b>\n\nSend /go to create a video.').then(()=>{
  console.log('Bot running...');poll();
}).catch(e=>{console.error(e.message);process.exit(1);});

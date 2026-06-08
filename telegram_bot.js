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

// ── Journal UI (pont d'observation : chaque échange logué en JSONL, rotation 2 Mo) ──
const LOGDIR=path.join(BASE,'logs');const UIJOURNAL=path.join(LOGDIR,'ui_journal.jsonl');
function uiLog(e){try{
  fs.mkdirSync(LOGDIR,{recursive:true});
  try{const st=fs.statSync(UIJOURNAL);if(st.size>2*1024*1024){const d=fs.readFileSync(UIJOURNAL,'utf8').split('\n');fs.writeFileSync(UIJOURNAL,d.slice(Math.floor(d.length/2)).join('\n'));}}catch(_){}
  fs.appendFileSync(UIJOURNAL,JSON.stringify(Object.assign({ts:new Date().toISOString()},e))+'\n');
}catch(_){}}
function btnLabels(rows){try{return (rows||[]).flat().map(b=>b&&b.text).filter(Boolean);}catch(e){return [];}}
function screenOf(t){if(!t)return '';const b=String(t).match(/<b>(.*?)<\/b>/);if(b)return b[1].replace(/<[^>]+>/g,'').slice(0,40);return String(t).replace(/<[^>]+>/g,'').split('\n')[0].slice(0,40);}
// ── Telegram helpers ──────────────────────────────────────────────────────────
const JOURNAL=path.join(BASE,'bot_journal.log'); /*miroir permanent lisible par Claude*/
function jlog(line){
  try{
    const L='['+new Date().toISOString().slice(11,19)+'] '+String(line).replace(/\n/g,' | ').substring(0,500)+'\n';
    try{if(fs.existsSync(JOURNAL)&&fs.statSync(JOURNAL).size>1000000)fs.renameSync(JOURNAL,JOURNAL+'.old');}catch(e){}
    fs.appendFileSync(JOURNAL,L);
  }catch(e){}
}
async function tg(method,body,isForm){
  try{if(body&&(body.text||body.caption))jlog('BOT→ '+method+' : '+(body.text||body.caption));else if(method!=='getUpdates')jlog('BOT→ '+method);}catch(e){}
  if(isForm){
    const r=await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`,{method:'POST',body:isForm});
    const j=await r.json();
    try{if(j&&j.ok===false)jlog('⚠️ TG(form) '+method+' REFUS: '+(j.description||'').substring(0,250));}catch(e){}
    return j;
  }
  const r=await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:CHAT_ID,...body})
  });
  const j=await r.json();
  try{if(j&&j.ok===false)jlog('⚠️ TG '+method+' REFUS: '+(j.description||'').substring(0,200));}catch(e){}
  return j;
}
function kb(rows){return {reply_markup:{inline_keyboard:rows}};}
async function send(text,rows){uiLog({dir:'out',type:'msg',screen:screenOf(text),user_action:'',caption_len:(text||'').length,buttons:btnLabels(rows),edited_in_place:false});return tg('sendMessage',{text,parse_mode:'HTML',...(rows?kb(rows):{})} );}
async function sendImg(fp,caption){
  uiLog({dir:'out',type:'photo',screen:screenOf(caption),user_action:'',caption_len:(caption||'').length,buttons:[],edited_in_place:false});
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
  uiLog({dir:'out',type:'video',screen:'video finale',user_action:'',caption_len:14,buttons:['💾 Enregistrer (fichier)'],edited_in_place:false});
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
// Vidéo + caption + boutons en UN seul message (livraison consolidée). Renvoie le message_id.
async function sendVideoKb(fp,caption,rows){
  uiLog({dir:'out',type:'video',screen:'video prête',user_action:'',caption_len:(caption||'').length,buttons:btnLabels(rows),edited_in_place:false});
  try{
    const FormData=require('form-data');const f=new FormData();
    f.append('chat_id',CHAT_ID);f.append('video',fs.createReadStream(fp));f.append('supports_streaming','true');
    if(caption){f.append('caption',caption.slice(0,1020));f.append('parse_mode','HTML');}
    if(rows)f.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await tg('sendVideo',null,f);
    if(r&&r.ok){cacheFileId(fp,r.result);return r.result&&r.result.message_id;} /*file_id en cache -> éditions sans re-upload*/
    const f2=new FormData();f2.append('chat_id',CHAT_ID);f2.append('document',fs.createReadStream(fp));if(caption){f2.append('caption',caption.slice(0,1020));f2.append('parse_mode','HTML');}if(rows)f2.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r2=await tg('sendDocument',null,f2);return r2&&r2.result&&r2.result.message_id;
  }catch(e){return null;}
}
// Légendes : lit le .txt à côté du .mp4 (SHORT/LONG/HASHTAGS)
function readCapTxt(vp){try{return fs.readFileSync(String(vp).replace(/\.mp4$/,'.txt'),'utf8');}catch(e){return '';}}
function parseCaps(txt){const nd=s=>(s||'').replace(/[—–]/g,' ').replace(/\s{2,}/g,' ').trim();const gm=re=>{const m=txt.match(re);return m?m[1].trim():'';};return {short:nd(gm(/SHORT:\s*([\s\S]*?)\n\nLONG:/)),long:nd(gm(/LONG:\s*([\s\S]*?)\n\nHASHTAGS:/)),tags:gm(/HASHTAGS:\s*([\s\S]*)$/)};}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function buildVideoCaption(vp){const c=parseCaps(readCapTxt(vp));let cap='✅ <b>Vidéo prête</b>';if(c.short)cap+='\n\n<code>'+escH(c.short)+'</code>';if(c.tags)cap+='\n\n<code>'+escH(c.tags)+'</code>';return cap.slice(0,1020);}
function videoReadyKb(gfIdx){return [
  [{text:'✅ Postable',callback_data:'GF_POST_'+gfIdx},{text:'🔧 À retravailler',callback_data:'GF_REWORK_'+gfIdx}],
  [{text:'🎨 Restyler',callback_data:'GF_RESTYLE_'+gfIdx},{text:'🖼 Cover',callback_data:'COVER_OPEN_'+gfIdx}],
  [{text:'📋 Légende',callback_data:'GF_LONG_'+gfIdx},{text:'📁 Dossier',callback_data:'GF_FILES_'+gfIdx}],
  [{text:'➕ Partie suivante',callback_data:'GF_ADDPART_'+gfIdx}],
];} /*regle Etoile : Make Part 2 = TOUTE FIN*/
async function answerCB(id){return tg('answerCallbackQuery',{callback_query_id:id});}

// ── ANTI-DOUBLON édition en place (chantier1) ──────────────────────────────────
// Règle Etoile « zéro spam » : on n'édite un message QUE si son contenu change
// réellement (signature d'état) ; on ne RECRÉE (sendPhoto/Video = empilement) que
// si le message cible n'existe vraiment plus ; et on ne ré-uploade pas un média
// déjà connu de Telegram (cache file_id).
const _msgSig=Object.create(null);   // mid -> dernière signature poussée
const _fileId=Object.create(null);   // "path|mtime" -> {photo, video} (évite le re-upload)
function _fileTag(fp){try{if(!fp)return '';if(/^https?:/i.test(fp))return String(fp);return fp+'|'+fs.statSync(fp).mtimeMs;}catch(e){return String(fp||'');}}
function _sig(kind,fp,caption,rows){return kind+'|'+_fileTag(fp)+'|'+(caption||'')+'|'+JSON.stringify(rows||[]);}
function sigSame(mid,sig){return mid!=null&&_msgSig[mid]===sig;}
function sigSet(mid,sig){if(mid!=null)_msgSig[mid]=sig;}
function sigDrop(mid){if(mid!=null)delete _msgSig[mid];}
function isGone(desc){return /not found|message to edit not found|message can'?t be edited|MESSAGE_ID_INVALID|message identifier is not specified|chat not found/i.test(desc||'');}
function isNotMod(desc){return /not modified/i.test(desc||'');}
function cacheFileId(fp,result){try{if(!result)return;const tag=_fileTag(fp);if(!tag)return;_fileId[tag]=_fileId[tag]||{};if(result.photo&&result.photo.length)_fileId[tag].photo=result.photo[result.photo.length-1].file_id;if(result.video&&result.video.file_id)_fileId[tag].video=result.video.file_id;}catch(e){}}
function cachedFileId(fp,kind){try{const c=_fileId[_fileTag(fp)];return c&&c[kind];}catch(e){return null;}}

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
// ── PERSONA (préparation multi-influenceur : 1 carte/dossiers par influenceur) ──
const PERSONAS_PATH=path.join(BASE,'personas.json');
function loadPersonas(){try{return JSON.parse(fs.readFileSync(PERSONAS_PATH,'utf8'));}catch(e){return {active:'imany',profiles:{imany:{name:'Imany',looksDir:'looks',outputsDir:'outputs',stylesDir:'styles'}}};}}
function activePersona(){const p=loadPersonas();return p.profiles[p.active]||{name:'Imany',looksDir:'looks',outputsDir:'outputs'};}
function setActivePersona(key){const p=loadPersonas();if(p.profiles[key]){p.active=key;try{fs.writeFileSync(PERSONAS_PATH,JSON.stringify(p,null,2));}catch(e){}return true;}return false;}
function personaOutDir(){return path.join(BASE,(activePersona().outputsDir||'outputs'));}
function pickRandom(){ /*lookpick v1 : nouveautes d'abord, via source unique look_picker.js*/
  try{return require('./look_picker.js').pickLook(getLooksDir());}catch{return null;}
}
let newlook={urls:[],files:[],idx:0,recipe:null,category:null,env:'bougies',extra:null,mode:'eco',count:3,busy:false,mediaId:null,catLabel:'',envLabel:''}; /*[défaut] nouveau look = 3 poses séparées (éco 9:16)*/ /*v10 : MESSAGE-MEDIA UNIQUE (regle Etoile : un bloc image + commandes, AUCUN autre message sauf anomalie/resultat final)*/
function nlMod(){ /*hot-reload : newlook.js recharge a chaque appel*/
  try{delete require.cache[require.resolve('./newlook.js')];}catch(e){}
  return require('./newlook.js');
}
let _nlCover=null;
function nlRefFile(){ /*[p2] BLINDAGE : priorite imany_reference.* (imany/ ou parent), le plus recent ; sinon photo la plus recente*/
  const P=require('path');const roots=[P.join(getLooksDir(),'references','imany'),P.join(getLooksDir(),'references')];
  const cands=[];
  for(const r of roots){try{for(const x of fs.readdirSync(r)){if(/\.(jpg|jpeg|png|webp)$/i.test(x)){const fp=P.join(r,x);let m=0;try{m=fs.statSync(fp).mtimeMs;}catch(e){}cands.push({fp,x,m});}}}catch(e){}}
  if(!cands.length)return null;
  const named=cands.filter(c=>/^imany_reference\.(jpe?g|png|webp)$/i.test(c.x)).sort((a,b)=>b.m-a.m); /*nom EXACT (un backup imany_reference_xxx ne capte pas la priorité)*/
  return (named[0]||cands.sort((a,b)=>b.m-a.m)[0]).fp;
}
function nlCover(){ /*image d'accueil du panneau = la reference imany*/
  if(_nlCover&&fs.existsSync(_nlCover))return _nlCover;
  try{
    const pick=nlRefFile();
    if(pick){
      const out='/tmp/nlcover.jpg';
      require('child_process').execSync('sips -Z 900 -s format jpeg "'+pick+'" --out "'+out+'" 2>/dev/null || ffmpeg -y -i "'+pick+'" -vf scale=900:-2 -q:v 3 "'+out+'" 2>/dev/null');
      if(fs.existsSync(out)&&fs.statSync(out).size>3000){_nlCover=out;return out;}
    }
  }catch(e){}
  /*blindage : JAMAIS sans image — fond neutre (NON cache -> reessaie au prochain appel si la vraie photo revient)*/
  try{
    const out='/tmp/nlcover_default.jpg';
    if(!fs.existsSync(out))require('child_process').execSync('ffmpeg -y -f lavfi -i color=c=0x1c1c28:s=720x900:d=0.1 -frames:v 1 "'+out+'" 2>/dev/null');
    if(fs.existsSync(out)&&fs.statSync(out).size>500)return out;
  }catch(e){}
  return null;
}
function nlLocal(i){ /*fichier local de l'image i (telecharge au besoin, mis en cache)*/
  if(newlook.files[i]&&fs.existsSync(newlook.files[i]))return newlook.files[i];
  const u=newlook.urls[i];
  if(String(u).startsWith('/')){newlook.files[i]=u;return u;}
  const tmp='/tmp/nlview_'+i+'_'+Date.now()+'.jpg';
  try{require('child_process').execSync('curl -sL -o "'+tmp+'" "'+u+'"');}catch(e){}
  if(fs.existsSync(tmp)&&fs.statSync(tmp).size>5000){newlook.files[i]=tmp;return tmp;}
  return null;
}
function nlDisp(file){ /*affichage panneau SANS DEFILEMENT : version 4:5 ancree en haut (visage) — les fichiers gardes restent 9:16*/
  if(!file)return file;
  try{
    const out='/tmp/disp_'+require('path').basename(file).replace(/[^a-z0-9.]/gi,'')+'.jpg';
    if(fs.existsSync(out)&&fs.statSync(out).mtimeMs>fs.statSync(file).mtimeMs)return out;
    require('child_process').execSync('ffmpeg -y -i "'+file+'" -vf "crop=iw:min(ih\\,iw*5/4):0:0,scale=720:-2" -q:v 3 "'+out+'" 2>/dev/null');
    if(fs.existsSync(out)&&fs.statSync(out).size>3000)return out;
  }catch(e){}
  return file;
}
async function nlMedia(file,caption,rows,raw){ /*LE message unique : photo + caption + boutons, cree ou edite sur place*/
  /*[apercu-reel] raw=true -> image BRUTE telle que generee (plein 9:16, aucun crop/scale) ; sinon cover config en 4:5 sans defilement*/
  /*[affichage-entier] Etoile : AUCUN recadrage à l'affichage — l'image (look/planche/cover) est montrée ENTIÈRE en 9:16, jamais coupée. (nlDisp 4:5 retiré)*/
  const FormData=require('form-data');
  const markup=JSON.stringify({inline_keyboard:rows||[]});
  const sig=_sig('nl',file||'',caption,rows);
  if(newlook.mediaId&&sigSame(newlook.mediaId,sig))return true; /*panneau déjà exactement dans cet état -> ON NE FAIT RIEN*/
  if(newlook.mediaId&&file){
    let r=null;const fid=cachedFileId(file,'photo');
    if(fid){ /*image déjà connue de Telegram -> édition JSON sans re-upload*/
      r=await tg('editMessageMedia',{message_id:newlook.mediaId,media:{type:'photo',media:fid,caption:caption,parse_mode:'HTML'},reply_markup:{inline_keyboard:rows||[]}}).catch(()=>null);
    }
    if(!(r&&(r.ok||isNotMod(r.description)||isGone(r.description)))){ /*pas de file_id ou échec transitoire -> upload*/
      const fd=new FormData();
      fd.append('chat_id',CHAT_ID);fd.append('message_id',String(newlook.mediaId));
      fd.append('media',JSON.stringify({type:'photo',media:'attach://ph',caption:caption,parse_mode:'HTML'}));
      fd.append('ph',fs.createReadStream(file));
      fd.append('reply_markup',markup);
      r=await tg('editMessageMedia',null,fd).catch(()=>null);
      if(r&&r.ok)cacheFileId(file,r.result);
    }
    if(r&&r.ok){sigSet(newlook.mediaId,sig);return true;}
    if(r&&isNotMod(r.description)){sigSet(newlook.mediaId,sig);return true;} /*contenu identique = etat deja bon*/
    if(!(r&&isGone(r.description))){ /*erreur transitoire : tente la caption seule, sinon s'arrête SANS empiler*/
      const r1b=await tg('editMessageCaption',{message_id:newlook.mediaId,caption:caption,parse_mode:'HTML',reply_markup:{inline_keyboard:rows||[]}}).catch(()=>null);
      if(r1b&&(r1b.ok||isNotMod(r1b.description))){sigSet(newlook.mediaId,sig);return true;}
      if(!(r1b&&isGone(r1b.description))){jlog('⚠️ nlMedia REFUS (sans recréation)');return true;}
    }
    sigDrop(newlook.mediaId);newlook.mediaId=null;jlog('⚠️ panneau disparu — recreation unique'); /*SEUL cas de recréation*/
  }
  if(newlook.mediaId&&!file){
    const r=await tg('editMessageCaption',{message_id:newlook.mediaId,caption:caption,parse_mode:'HTML',reply_markup:{inline_keyboard:rows||[]}}).catch(()=>null);
    if(r&&(r.ok||isNotMod(r.description))){sigSet(newlook.mediaId,sig);return true;}
    if(!(r&&isGone(r.description))){jlog('⚠️ nlText REFUS (sans recréation)');return true;}
    sigDrop(newlook.mediaId);newlook.mediaId=null;
  }
  const f2=file||nlCover();
  if(!f2){await send(caption,rows);return false;} /*secours extreme*/
  const fd2=new FormData();
  fd2.append('chat_id',CHAT_ID);
  fd2.append('photo',fs.createReadStream(f2));
  fd2.append('caption',caption);fd2.append('parse_mode','HTML');
  fd2.append('reply_markup',markup);
  const r2=await tg('sendPhoto',null,fd2);
  if(r2&&r2.ok&&r2.result){newlook.mediaId=r2.result.message_id;cacheFileId(f2,r2.result);sigSet(newlook.mediaId,sig);}
  return true;
}
function nlText(caption,rows){return nlMedia(null,caption,rows);} /*caption/boutons seulement, image inchangee*/
function nlMark(t,on){return on?'✅ '+t.replace(/^[^ ]+ /,''):t;}
async function nlConfig(){ /*ACCUEIL compact (architecture validee Etoile) : etat visible, sous-menus par section*/
  const {readLookbook}=nlMod();
  const lb=readLookbook();
  if(!newlook.category||(!lb.categories[newlook.category]&&newlook.category!=='random'))newlook.category=Object.keys(lb.categories)[0];
  if(!lb.envs[newlook.env])newlook.env='bougies';
  newlook.catLabel=newlook.extra&&newlook.category!=='random'?('✍️ '+newlook.extra.substring(0,18)):(newlook.category==='random'?'🎲 Surprise':lb.categories[newlook.category].label);
  newlook.envLabel=lb.envs[newlook.env].label;
  const cost={eco:'💰·',planche:'💰·',hd:'💰💰💰'}[newlook.mode]||'';
  const rows=[
    [{text:'👗 '+newlook.catLabel.replace(/^[^ ]+ /,''),callback_data:'NL_MENU_CAT'},{text:'🌆 '+newlook.envLabel.replace(/^[^ ]+ /,''),callback_data:'NL_MENU_ENV'}],
    [{text:'🎛 '+newlook.mode+' '+cost,callback_data:'NL_MENU_MODE'},{text:'🎲 Surprise',callback_data:'NL_SET_CAT_random'}],
  ];
  // [C] sélecteur NOMBRE DE PHOTOS (mode éco -> N images séparées 9:16) ; planche=1 multi-angles, hd=4 (fixe)
  if(newlook.mode==='eco'){const c=newlook.count||1;rows.push([1,2,3,4,6].map(n=>({text:(n===c?'✅ ':'')+'📸'+n,callback_data:'NL_CNT_'+n})));}
  rows.push([{text:'→ ▶️ Générer',callback_data:'NL_GO'},{text:'❌',callback_data:'NL_CANCEL'}]);
  const cur=(newlook.urls.length&&nlLocal(newlook.idx))||null;
  await nlMedia(cur||nlCover(),'🎨 <b>NOUVEAU LOOK</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+newlook.mode,rows);
}
async function nlMenuCat(){
  const lb=nlMod().readLookbook();
  const keys=Object.keys(lb.categories);
  const rows=[];
  for(let i=0;i<keys.length;i+=3)rows.push(keys.slice(i,i+3).map(k=>({text:nlMark(lb.categories[k].label,newlook.category===k&&!newlook.extra),callback_data:'NL_SET_CAT_'+k})));
  rows.push([{text:'◀️ Retour',callback_data:'NL_CONFIG'}]);
  await nlText('👗 <b>TENUE</b> · actuelle : '+escH(newlook.catLabel),rows);
}
async function nlMenuEnv(){
  const lb=nlMod().readLookbook();
  const rows=[Object.keys(lb.envs).map(k=>({text:nlMark(lb.envs[k].label,newlook.env===k),callback_data:'NL_SET_ENV_'+k}))];
  rows.push([{text:'◀️ Retour',callback_data:'NL_CONFIG'}]);
  await nlText('🌆 <b>DÉCOR</b> · actuel : '+escH(newlook.envLabel),rows);
}
async function nlMenuMode(){
  const rows=[[
    {text:nlMark('🧪 Éco 💰·',newlook.mode==='eco'),callback_data:'NL_SET_MODE_eco'},
    {text:nlMark('🖼 Planche 💰·',newlook.mode==='planche'),callback_data:'NL_SET_MODE_planche'},
    {text:nlMark('💎 HD 💰💰💰',newlook.mode==='hd'),callback_data:'NL_SET_MODE_hd'}
  ],[{text:'◀️ Retour',callback_data:'NL_CONFIG'}]];
  await nlText('🎛 <b>FORMAT</b> · actuel : '+newlook.mode,rows);
}
function nlResultRows(){
  const n=newlook.urls.length;
  const rows=[];
  if(n>1)rows.push([{text:'‹',callback_data:'NL_NAV_P'},{text:(newlook.idx+1)+' / '+n,callback_data:'NL_NOOP'},{text:'›',callback_data:'NL_NAV_N'}]);
  rows.push([{text:'✅ Avatar',callback_data:'NL_AVATAR'},{text:'🎨 Éditer',callback_data:'NL_EDIT'}]); /*[pose] actions par pose : Avatar / Éditer (+ Enregistrer + Générer ci-dessous)*/
  rows.push([{text:'💾 Enregistrer',callback_data:'NL_KEEP_CUR'},...(n>1?[{text:'💾 Tout enregistrer',callback_data:'NL_KEEP_ALL'}]:[])]);
  if(newlook.mode==='planche')rows.push([{text:'🪄 9:16 →',callback_data:'NL_NOOP'},{text:'1 💰',callback_data:'NL_RE_0'},{text:'2 💰',callback_data:'NL_RE_1'},{text:'3 💰',callback_data:'NL_RE_2'},{text:'×3 💰💰',callback_data:'NL_RE_ALL'}]);
  rows.push([{text:'🎬 Vidéo',callback_data:'NL_VIDEO'},...(newlook.mode!=='hd'&&newlook.mode!=='split'?[{text:'💎 HD',callback_data:'NL_HD'}]:[])]);
  rows.push([{text:'🔁 Refaire pareil',callback_data:'NL_RETRY'},{text:'🆕 Autre look',callback_data:'NL_OTHER'}]);
  rows.push([{text:'⚙️ Réglages',callback_data:'NL_CONFIG'},{text:'❌ Fini',callback_data:'NL_CANCEL'}]);
  return rows;
}
async function nlShowResult(){
  const f=nlLocal(newlook.idx);
  await nlMedia(f,'🎞 <b>RÉSULTATS</b> ·\n'+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+(newlook.urls.length>1?' · '+(newlook.idx+1)+'/'+newlook.urls.length:''),nlResultRows(),true); /*[apercu-reel] image BRUTE 9:16, zéro re-traitement*/
}
async function nlPayRecap(mode,label,okCb,backCb){ /*règle d'or : QUOI + COMBIEN avant chaque action payante*/
  const lb2=nlMod().readLookbook();const ops=(lb2.pricing&&lb2.pricing.ops)||{};const epc=(lb2.pricing&&lb2.pricing.eur_per_credit)||0.058;
  const cr=ops[mode];const prix=cr?(cr+' cr ≈ '+(cr*epc).toFixed(2).replace('.',',')+' €'):'prix à calibrer';
  await nlText('🧾 <b>RÉCAP</b> · '+label+' · 💰 '+prix,[[{text:'→ ✅ GÉNÉRER MAINTENANT',callback_data:okCb}],[{text:'◀️ Retour',callback_data:backCb||'NL_CONFIG'}]]);
}
async function runNewLook(){
  if(newlook.busy){return;}
  newlook.busy=true;
  let _sec=0;
  const _lab={eco:'🧪 Éco (1 pose 720p)',planche:'🖼 Planche (3 poses en 1 image)',hd:'💎 HD (4 portraits 1080p)'}[newlook.mode]||newlook.mode;
  const _hb=setInterval(()=>{_sec+=30;nlText('⏳ <b>GÉNÉRATION</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+_lab+' · '+_sec+'s').catch(()=>{});},30000);
  try{
    await nlText('⏳ <b>GÉNÉRATION</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+_lab);
    const {generateLook}=nlMod();
    const r=await generateLook({category:newlook.category,env:newlook.env,extra:newlook.extra,mode:newlook.mode,count:newlook.count},m=>{nlText('⏳ <b>GÉNÉRATION</b> · '+escH(m)).catch(()=>{});});
    newlook.urls=r.urls;newlook.files=[];newlook.idx=0;newlook.recipe=r.recipe;
    clearInterval(_hb);
    await nlShowResult();
  }catch(e){clearInterval(_hb);await nlText('❌ <b>ERREUR</b> · '+escH(e.message),[[{text:'🔄 Réessayer',callback_data:'NL_RETRY'},{text:'⚙️ Réglages',callback_data:'NL_CONFIG'},{text:'❌ Fermer',callback_data:'NL_CANCEL'}]]).catch(()=>{});}
  newlook.busy=false;
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
// Compresse une image > ~9 Mo (limite Telegram photo = 10 Mo) -> renvoie un chemin envoyable
function shrinkIfBig(fp){
  try{const st=fs.statSync(fp);if(st.size>9000000){const small='/tmp/shrink'+Date.now()+'.jpg';require('child_process').execSync('sips -Z 1280 -s format jpeg "'+fp+'" --out "'+small+'" 2>/dev/null');if(fs.existsSync(small)&&fs.statSync(small).size<10485760)return small;}}catch(e){}
  return fp;
}
// ── Galerie de looks ────────────────────────────────────────────────────────────
function trashDir(){const t=path.join(getLooksDir(),'_trash');try{fs.mkdirSync(t,{recursive:true});}catch(e){}return t;}
function looksList(){try{const d=getLooksDir();return fs.readdirSync(d).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&!f.startsWith('.')&&!f.startsWith('_')).map(f=>{let m=0;try{m=fs.statSync(path.join(d,f)).mtimeMs;}catch(e){}return {f,m};}).sort((a,b)=>b.m-a.m).map(x=>x.f);}catch(e){return[];}}
function tsName(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes());}
// ── Noms conviviaux (cache les hf_2026..._844c..png) ──
const MONTHS_FR=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function dateFromName(s){const m=String(s||'').match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/);return m?(parseInt(m[3],10)+' '+(MONTHS_FR[parseInt(m[2],10)-1]||'')):'';}
function lookName(p){if(!p)return '(photo actuelle)';const base=path.basename(p);let i=-1;try{i=looksList().indexOf(base);}catch(e){}const d=dateFromName(base);return 'Look '+(i>=0?i+1:'•')+(d?' · '+d:'');}
function friendlyName(name,idx){const d=dateFromName(name);return 'Vidéo '+((idx||0)+1)+(d?' · '+d:'');}
async function dlPhotoNamed(fileId,name){
  const r=await tg('getFile',{file_id:fileId});
  const url=`https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
  const buf=await (await fetch(url)).buffer();
  const fp=path.join(getLooksDir(),name);
  fs.writeFileSync(fp,buf);return fp;
}
// envoie une photo locale AVEC boutons inline
async function sendPhotoKb(fp,caption,rows){
  uiLog({dir:'out',type:'photo',screen:screenOf(caption),user_action:'',caption_len:(caption||'').length,buttons:btnLabels(rows),edited_in_place:false});
  try{
    let f=fp;
    try{const st=fs.statSync(fp);if(st.size>9000000){const small='/tmp/prev'+Date.now()+'.jpg';require('child_process').execSync('sips -Z 1280 -s format jpeg "'+fp+'" --out "'+small+'" 2>/dev/null');if(fs.existsSync(small))f=small;}}catch(e){}
    const FormData=require('form-data');const form=new FormData();
    form.append('chat_id',CHAT_ID);
    form.append('photo',fs.readFileSync(f),{filename:'look.jpg',contentType:'image/jpeg'});
    if(caption){form.append('caption',caption);form.append('parse_mode','HTML');}
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendPhoto',{method:'POST',body:form});
    const d=await r.json();
    if(!(d&&d.ok))jlog('⚠️ sendPhotoKb REFUS: '+((d&&d.description)||'?'));
    else cacheFileId(fp,d.result); /*file_id en cache -> éditions suivantes sans re-upload*/
    return d;
  }catch(e){jlog('⚠️ sendPhotoKb ERR: '+e.message);return send((caption||'📸')+' (image indisponible)',rows);}
}
let gal={files:[],idx:0,page:0};
let galForRecap=false; // galerie ouverte depuis la carte récap -> bouton « Choisir pour la vidéo »
let pendingPhotoId=null; // dernière photo reçue hors flux (pour « ajouter aux looks »)
let galMid=null; // message de la galerie -> navigation EN PLACE (jamais d'empilement)
let galFrom='card'; // d'où la galerie a été ouverte ('edit'|'card') -> le RETOUR ramène AU BON ENDROIT
async function showLook(){
  gal.files=looksList();
  if(!gal.files.length){galMid=null;await send('📭 Aucun look dans <code>looks/</code>. Envoie-moi une photo pour en ajouter un.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}
  if(gal.idx<0)gal.idx=gal.files.length-1; if(gal.idx>=gal.files.length)gal.idx=0;
  const name=gal.files[gal.idx];const fp=path.join(getLooksDir(),name);
  let sz=0;try{sz=fs.existsSync(fp)?fs.statSync(fp).size:0;}catch(e){}
  if(sz<30000){try{require('child_process').execSync('brctl download "'+fp+'" 2>/dev/null');}catch(e){}try{sz=fs.existsSync(fp)?fs.statSync(fp).size:0;}catch(e){}}
  const rows=[
    [{text:'◀️',callback_data:'GAL_PREV'},{text:'🎨 Éditer',callback_data:'GAL_EDIT'},{text:'▶️',callback_data:'GAL_NEXT'}],
  ];
  if(galForRecap){rows.push([{text:'✅ Choisir pour la vidéo',callback_data:'GAL_PICK'}]);rows.push([{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🗑',callback_data:'GAL_DEL'}]);rows.push([{text:'▦ Grille',callback_data:'GGRID'},{text:'◀️ Récap',callback_data:'RC_BACK'}]);}
  else {rows.push([{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🎬 Générer avec',callback_data:'GAL_GEN'},{text:'🗑',callback_data:'GAL_DEL'}]);rows.push([{text:'▦ Grille',callback_data:'GGRID'},galFrom==='edit'?{text:'◀️ Édition',callback_data:'EDIT_HOME'}:{text:'◀️ Retour',callback_data:'MAIN_MENU'}]);}
  const _d=dateFromName(name);const cap=`🖼 <b>Look ${gal.idx+1}/${gal.files.length}</b>${_d?' · ajouté le '+_d:''}`;
  if(sz<1000){ // placeholder iCloud non téléchargé -> texte (édition en place quand même si possible)
    if(galMid&&await tgEditText(galMid,`⚠️ Look ${gal.idx+1}/${gal.files.length} : <b>${name}</b>\nImage pas encore téléchargée d'iCloud. ◀️ ▶️ pour la suivante.`,rows))return;
    const r0=await send(`⚠️ Look ${gal.idx+1}/${gal.files.length} : <b>${name}</b>\nImage pas encore téléchargée d'iCloud. ◀️ ▶️ pour la suivante.`,rows);
    galMid=(r0&&r0.result&&r0.result.message_id)||null;return; /*on GARDE le mid -> ◀️▶️ éditent en place, zéro empilement*/
  }
  // navigation EN PLACE (editMessageMedia) si un message galerie existe déjà
  if(galMid&&await editPhotoKb(galMid,fp,cap,rows))return;
  const r=await sendPhotoKb(fp,cap,rows);
  galMid=(r&&r.result&&r.result.message_id)||null;
  if(!(r&&r.ok)){galMid=null;await send(`⚠️ <b>${name}</b> — aperçu indisponible (${fmtSize(sz)}).`,rows);}
}
// ── [chantier4] GALERIE EN GRILLE : planche 3x3 de vignettes numérotées (choix en 2-3 taps) ──
const GAL_PAGE=9; // 3x3
function buildGallerySheet(pageFiles){ // -> chemin jpg d'une planche 3x3, ou null
  try{
    const FF='/System/Library/Fonts/Helvetica.ttc';const dir=getLooksDir();const cp=require('child_process');
    for(let k=0;k<9;k++){
      const cell='/tmp/glcell_'+String(k).padStart(2,'0')+'.jpg';
      if(k<pageFiles.length){
        const fp=path.join(dir,pageFiles[k]);
        try{if(fs.statSync(fp).size<30000)cp.execSync('brctl download "'+fp+'" 2>/dev/null');}catch(e){}
        const num=String(k+1);
        const nm=String(lookName(fp)||'').replace(/[:'"\\%\n]/g,' ').slice(0,22);
        // cellule 360x450 FIXE -> coordonnées absolues (ih/iw après crop = « Error reinitializing filters »)
        const vf="scale=360:450:force_original_aspect_ratio=increase,crop=360:450,"
          +"drawbox=x=0:y=0:w=74:h=62:color=black@0.55:t=fill,"
          +"drawtext=fontfile="+FF+":text='"+num+"':x=20:y=4:fontsize=46:fontcolor=white,"
          +"drawbox=x=0:y=410:w=360:h=40:color=black@0.5:t=fill,"
          +"drawtext=fontfile="+FF+":text='"+nm+"':x=8:y=416:fontsize=22:fontcolor=white";
        try{cp.execFileSync('ffmpeg',['-y','-i',fp,'-vf',vf,'-frames:v','1','-q:v','3',cell],{stdio:'ignore'});}
        catch(e){cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=0x33333f:s=360x450:d=0.1','-frames:v','1',cell],{stdio:'ignore'});}
      }else{
        cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=0x1c1c28:s=360x450:d=0.1','-frames:v','1',cell],{stdio:'ignore'});
      }
    }
    const out='/tmp/glsheet_'+Date.now()+'.jpg';
    cp.execFileSync('ffmpeg',['-y','-framerate','1','-i','/tmp/glcell_%02d.jpg','-frames:v','1','-vf','tile=3x3:padding=8:margin=8:color=0x1c1c28',out],{stdio:'ignore'});
    if(fs.existsSync(out)&&fs.statSync(out).size>2000)return out;
  }catch(e){jlog('⚠️ buildGallerySheet: '+e.message);}
  return null;
}
async function showGallery(){ // vue PLANCHE paginée (édition en place)
  gal.files=looksList();
  if(!gal.files.length){galMid=null;await send('📭 Aucun look dans <code>looks/</code>. Envoie-moi une photo pour en ajouter un.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}
  const pages=Math.max(1,Math.ceil(gal.files.length/GAL_PAGE));
  if(gal.page==null)gal.page=0; if(gal.page<0)gal.page=pages-1; if(gal.page>=pages)gal.page=0;
  const start=gal.page*GAL_PAGE;const pageFiles=gal.files.slice(start,start+GAL_PAGE);
  const rows=[];
  for(let r=0;r<3;r++){const row=[];for(let c=0;c<3;c++){const k=r*3+c;if(k<pageFiles.length)row.push({text:String(k+1),callback_data:'GPICK_'+(start+k)});}if(row.length)rows.push(row);}
  if(pages>1)rows.push([{text:'◀️ Page',callback_data:'GLP_PREV'},{text:'Page '+(gal.page+1)+'/'+pages,callback_data:'NOOP'},{text:'Page ▶️',callback_data:'GLP_NEXT'}]);
  if(galForRecap)rows.push([{text:'◀️ Récap',callback_data:'RC_BACK'}]);
  else rows.push([galFrom==='edit'?{text:'◀️ Édition',callback_data:'EDIT_HOME'}:{text:'◀️ Retour',callback_data:'MAIN_MENU'}]);
  const cap='🖼 <b>GALERIE</b> · '+gal.files.length+' looks (récents d\'abord) · Page '+(gal.page+1)+'/'+pages+'\nAppuie sur un <b>numéro</b> pour ouvrir le look en grand.';
  const sheet=buildGallerySheet(pageFiles);
  if(!sheet){ // secours : planche indispo -> liste texte cliquable
    const txt=cap+'\n\n'+pageFiles.map((f,k)=>(k+1)+'. '+lookName(path.join(getLooksDir(),f))).join('\n');
    if(galMid&&await tgEditText(galMid,txt,rows))return;
    const r0=await send(txt,rows);galMid=(r0&&r0.result&&r0.result.message_id)||null;return;
  }
  if(galMid&&await editPhotoKb(galMid,sheet,cap,rows))return;
  const r=await sendPhotoKb(sheet,cap,rows);galMid=(r&&r.result&&r.result.message_id)||null;
}
async function tgEditText(mid,text,rows){
  const sig=_sig('text',null,text,rows);
  if(sigSame(mid,sig))return true; // texte+boutons inchangés -> rien à envoyer
  try{const d=await tg('editMessageText',{message_id:mid,text,parse_mode:'HTML',...(rows?{reply_markup:{inline_keyboard:rows}}:{})});
    if(d&&d.ok){sigSet(mid,sig);return true;}
    if(isNotMod(d&&d.description)){sigSet(mid,sig);return true;}
    if(isGone(d&&d.description))return false; // disparu -> recréation par le caller
    return true; // transitoire : pas de doublon
  }catch(e){return true;}
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

// [chantier2] Wizard anglais legacy (step1/2/3 + showSummary) SUPPRIMÉ — flux unifié sur la carte.
// Toutes les entrées de génération mènent désormais à openCard (voie carte conforme).

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
          setTimeout(async()=>{
            setup.lastVideo=vp;const _i=sentVideos.push(vp)-1;
            await resAdd({type:'video',path:vp,readyIdx:_i,label:''}).catch(async()=>{ /*3 blocs : livraison legacy → BLOC RÉSULTATS*/
              await send('⚠️ Vidéo trop lourde — voir iCloud → podcast-outputs').catch(()=>{});
            });
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
    // stderr (ffmpeg/libass/coretext/frame=…) -> FICHIER uniquement, JAMAIS dans le chat
    try{fs.mkdirSync(LOGDIR,{recursive:true});fs.appendFileSync(path.join(LOGDIR,'workflow_stderr.log'),d.toString());}catch(e){}
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
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Retour',callback_data:'EDIT_HOME'}],
  ]);
}
// ── Helpers /edit (Image, Zooms, Musique) — stockés dans style.json ─────────────
let RL=require('./render_local');
// CAUSE RACINE des sous-titres « qui bougent » / style obsolète : le process bot fige render_local
// au démarrage. On purge le cache require et on recharge AVANT chaque rendu -> toujours le code à jour.
function freshRL(){try{delete require.cache[require.resolve('./render_local')];}catch(e){}RL=require('./render_local');return RL;}
const WF=require('./workflow.js'); // briques de génération (require.main!==module -> main() ne se lance pas)
const {sanitizeTTS:_sanTTS}=require('./tts_sanitize'); // ceinture : nettoyage pause côté bot aussi
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
  const el=(chars/1000)*COST.EL_EUR_PER_1K_CHARS;
  let cr=null,kling=plan.n*COST.KLING_EUR_PER_PART; /*fallback ancien si pricing absent*/
  try{ /*VRAIS coûts = mesures Etoile dans lookbook.pricing (source unique)*/
    const lb=nlMod().readLookbook();const p=lb.pricing||{};
    if(p.ops&&p.ops.video30s){cr=plan.n*p.ops.video30s;kling=cr*(p.eur_per_credit||0.058);}
  }catch(e){}
  return {parts:plan.n,words:totalWords,el,kling,cr,total:el+kling};
}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,Math.round(v*1000)/1000));
function readFx(){return RL.loadFx();}
function hasActiveEdits(){try{const i=readFx().image,s=IMG_PRESETS['Signature'];return Object.keys(s).some(k=>Math.abs((+i[k]||0)-(+s[k]||0))>0.001);}catch(e){return false;}}
function writeFx(fx){fs.writeFileSync(path.join(BASE,'style.json'),JSON.stringify(fx,null,2));}
// ── Réglages mémorisés PAR LOOK (look basename -> image fx) ──
const LOOKSTYLES_PATH=path.join(BASE,'styles_par_look.json');
function loadLookStyles(){try{return JSON.parse(fs.readFileSync(LOOKSTYLES_PATH,'utf8'));}catch(e){return {};}}
function getLookStyle(name){const m=loadLookStyles();return name&&m[name]?m[name]:null;}
function saveLookStyle(name,img){if(!name)return;const m=loadLookStyles();m[name]=img;try{fs.writeFileSync(LOOKSTYLES_PATH,JSON.stringify(m,null,2));}catch(e){}}
function fxDiffers(a,b){if(!a||!b)return true;return Object.keys(a).some(k=>Math.abs((+a[k]||0)-(+b[k]||0))>0.001);}
// Propose le choix 3 voies si le look a des réglages enregistrés ≠ actuels. Retourne true si a posé la question.
let lookStylePending=null;
async function maybeAskLookStyle(lookPath,ret){
  setWorkPhoto(lookPath);
  const saved=getLookStyle(path.basename(lookPath));
  if(saved&&fxDiffers(saved,readFx().image)){
    lookStylePending={fx:saved,ret};
    await cardMenu('🎨 Ce look a des réglages enregistrés. Réutiliser ?',[
      [{text:'✅ Oui (du look)',callback_data:'LS_REUSE'}],
      [{text:'🔄 Base',callback_data:'LS_BASE'},{text:'🎨 Réglages actuels',callback_data:'LS_KEEP'}],
    ]);
    return true;
  }
  return false;
}
async function routeAfterLook(ret){
  if(ret==='avatar')await send('✅ Look = avatar + photo de travail.',[[{text:'🎨 Édition',callback_data:'EDIT_HOME'}],[{text:'🎬 Générer',callback_data:'GAL_GEN'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);
  else if(ret==='edit')await showEditHome();
  else {await ensureTopic();await showRecap();} // 'recap'
}
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
function applySnapshot(snap){/*[BUG-4] charger un style N'ÉCRASE JAMAIS les sous-titres verrouillés (76/0.370) : on ignore snap.subs ; seuls les fx image/zoom/musique sont appliqués*/ if(snap&&snap.fx)writeFx(snap.fx);}
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
  const rows=styleList.map((f,i)=>[{text:'📦 '+f.replace(/\.json$/,''),callback_data:'LOADSTYLE_'+i},{text:'🎬',callback_data:'LOADGEN_'+i},{text:'🗑',callback_data:'DELSTYLE_'+i}]);
  rows.push([{text:'◀️ Retour',callback_data:'MAIN_MENU'},{text:'🎨 Édition',callback_data:'EDIT_HOME'}]);
  await cardMenu('📦 <b>MODÈLES</b> — 📂 charger · 🎬 générer · 🗑 :',rows); // EN PLACE
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
let readyList=[]; // chaque entrée = {label, mp4} (mp4 plat OU dossier/final.mp4)
async function showReady(){
  readyList=[];
  try{
    const dir=readyDir();
    for(const e of fs.readdirSync(dir).sort().reverse()){
      const p=path.join(dir,e);let st;try{st=fs.statSync(p);}catch(_){continue;}
      if(st.isDirectory()){const fm=path.join(p,'final.mp4');if(fs.existsSync(fm))readyList.push({label:e,mp4:fm});}
      else if(/\.mp4$/i.test(e))readyList.push({label:e.replace(/\.mp4$/,''),mp4:p});
    }
  }catch(e){}
  if(!readyList.length){await send('📤 <b>PRÊT À POSTER</b>\n\nVide. Sur une vidéo livrée, appuie sur ✅ Postable.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}
  const rows=readyList.slice(0,20).map((x,i)=>[{text:'📤 '+friendlyName(x.label,i),callback_data:'POSTSEND_'+i},{text:'♻️',callback_data:'REUSE_'+i}]);
  rows.push([{text:'◀️ Retour',callback_data:'MAIN_MENU'}]);
  await send('📤 <b>PRÊT À POSTER</b> ('+readyList.length+')\nTape 📤 = reçois la vidéo + légende prête à poster. ♻️ = reprendre le style.',rows);
}
// ── Test local gratuit (réutilisable depuis /test et le menu) ───────────────────
async function runLocalTest(){
  if(proc){await send('⛔ Une vidéo est en cours — /test refusé (anti-conflit).');return;}
  try{
    const {renderLocal}=freshRL();
    if(gwLook())setWorkPhoto(gwLook()); // [p1] /test reflète l'ÉTAT COURANT : look choisi/édité d'abord
    const src=workSrc(); // look de travail courant (workingSource) ; raw seulement si AUCUN look choisi
    if(!src){await send('⚠️ Aucune photo de travail. Choisis un look 👤 ou lance un /go.');return;}
    if(lastCbId)await toast('🧪 Rendu local gratuit… ~5s, le résultat arrive en bas');else await send('🧪 Rendu LOCAL gratuit ('+path.basename(src)+')… ~5s'); /*toast au lieu d'un message qui s'empile*/
    const S=previewScript();
    const wt=S.replace(/[\n\r]+/g,' ').split(/\s+/).filter(Boolean).map((w,i)=>({text:w.toUpperCase().replace(/[^A-Z]/g,''),start:+(i*0.42).toFixed(3),end:+((i+1)*0.42).toFixed(3),duration:0.42})).filter(x=>x.text);
    const tdir=path.join(BASE,'outputs','tests');try{fs.mkdirSync(tdir,{recursive:true});}catch(e){}
    const out=path.join(tdir,'test_'+tsName()+'.mp4'); /*hors /tmp : le bloc RÉSULTATS garde les tests après reboot*/
    const kw=wt.filter((_,i)=>i%4===2).map(x=>x.text).slice(0,3); // quelques mots-clés pour les zooms
    const r=await renderLocal({input:src,wordTimings:wt,keywords:kw,reactions:[],output:out,quiet:true,duration:wt[wt.length-1].end+0.35});
    const st=r.style;
    await resAdd({type:'video',path:out,label:`🧪 <b>Test</b> (gratuit) · 🔤 ${fontLabel(st.font)} ${st.fontSize}px`}).catch(async()=>{await send('⚠️ Vidéo trop lourde.').catch(()=>{});}); /*3 blocs : le test va au BLOC RÉSULTATS*/
  }catch(e){await send('❌ Test local : '+e.message);}
}
const HELP_TXT='🎬 <b>Commandes</b>\n\n/studio — les 3 blocs (photo · vidéo · résultats)\n/menu — menu principal\n/go — générer une vidéo\n/edit — éditer le look (sous-titres, image, zooms, musique)\n/looks — galerie de looks\n/posted — vidéos prêtes à poster\n/styles — mes styles enregistrés\n/preview — aperçu du look\n/test — rendu local gratuit\n/stop — tout arrêter\n/status — état\n/restart — redémarrer le bot\n/mark [titre] viral|good|ok — noter une vidéo';
async function showGenerateMenu(){ await showRecap(); } // l'ancien menu redirige vers la carte récap
// ── CARTE RÉCAP de génération (pré-remplie depuis state.json) ────────────────────
let gw={look:null,styleName:null,subjectMode:'auto',topic:null,duration:'23s',mid:null};
function gwReset(){genJob=null;cockpitReset();/* nouveau wizard : nouveau cockpit, aucun script obsolète */ /*[BUG-3] « Nouvelle vidéo » part de la PHOTO DE TRAVAIL COURANTE (look choisi/avatar) si dispo, sinon le dernier état*/ gw={look:(workingSource&&fs.existsSync(workingSource))?workingSource:(genState.look||null),styleName:genState.styleName||null,subjectMode:genState.subjectMode||'auto',topicCat:genState.topicCat||null,topic:null,duration:genState.duration||'23s',mid:null};}
function gwLook(){return (gw.look&&fs.existsSync(gw.look))?gw.look:null;}
// Fil d'Ariane du parcours (étape active en gras) — affiché sur chaque écran
function journey(active){
  const s=[['recap','🎬 Récap'],['script','📝 Script'],['maquette','👁 Maquette'],['go','🚀 GO']];
  const ci=s.findIndex(x=>x[0]===active);
  return '🧭 '+s.map((x,i)=>i<ci?(x[1]+' ✓'):(i===ci?('<b>'+x[1]+'</b>'):x[1])).join(' → ');
}
// ── CARTE V2 (écran d'accueil unique, photo éditée en place) ──
function recapCaption(){ // = carte (allégée : budget/durée création déplacés à la maquette)
  const dur=gw.duration||'23s';
  const subj=gw.subjectMode==='mine'?('⌨️ '+(gw.topic||'(à taper)')):(gw.topic?('« '+gw.topic+' »'+(gw.topicLocal?' ⚠️ local (API down)':'')):(gw.topicCat&&MCATS[gw.topicCat]?MCATS[gw.topicCat]:'🎲 auto…'));
  return `🎬 <b>NOUVELLE VIDÉO</b>\n👤 ${escH(lookName(gwLook()))}\n💬 ${escH(subj)}\n⏱ ${dur} · 🎨 ${escH(gw.styleName||'Signature')}`;
}
function recapKb(){
  return [
    [{text:'🚀 Express',callback_data:'EXPRESS_NEW'},{text:'▶️ GO',callback_data:'RC_GO'}],
    [{text:'👤 Avatar',callback_data:'RC_LOOK'},{text:'💬 Sujet',callback_data:'RC_SUBJ'}],
    [{text:'⏱ Durée',callback_data:'CARD_DUR'},{text:'🎨 Modèle',callback_data:'RC_STYLE'}],
    [{text:'☰ Plus',callback_data:'CARD_MORE'}],
  ];
}
// Édite la carte EN PLACE : garde la photo, change caption + boutons (sous-menus)
async function cardMenu(text,rows){ if(!await cockpitCaption(text,rows)){const r=await send(text,rows);cockpit.mid=(r&&r.result&&r.result.message_id)||null;gw.mid=cockpit.mid;} }
// Toast (petite bulle, zéro message) — utilise le dernier callback_query
let lastCbId=null,cbAnswered=false;
async function toast(text){try{if(lastCbId){cbAnswered=true;await tg('answerCallbackQuery',{callback_query_id:lastCbId,text:text});}}catch(e){}}
// Édite l'écran d'édition EN PLACE (photo de travail + boutons), comme la carte
async function editScreen(caption,rows){
  let frame=null;try{const f=await renderWorkingFrame(null,true);frame=f&&f.frame;if(f)editPrevFrame=f.frame;}catch(e){} /*éditeur : grading visible*/
  if(frame){await cockpitPhoto(frame,caption,rows);editPanel.mid=cockpit.mid;}
  else if(!await cockpitCaption(caption,rows)){const r=await send(caption,rows);cockpit.mid=(r&&r.result&&r.result.message_id)||null;editPanel.mid=cockpit.mid;}
}
async function recapFrame(){ // aperçu = LOOK courant AVEC le style appliqué (item 1)
  if(gwLook())setWorkPhoto(gwLook());
  try{const f=await renderWorkingFrame();return f&&f.frame;}catch(e){return null;}
}
let lastCardSig=''; // signature visuelle de la carte (anti-dissolution : pas de re-upload si l'image n'a pas changé)
function cardSig(){try{return (gwLook()||'raw')+'|'+JSON.stringify(readFx())+'|'+JSON.stringify(readSubs())+'|'+previewPhrase();}catch(e){return Math.random()+'';}}
async function showRecap(){
  const sig=cardSig();
  if(cockpit.mid&&sig===lastCardSig){ // même image -> légende seule (zéro re-upload, zéro dissolution)
    if(await cockpitCaption(recapCaption(),recapKb())){gw.mid=cockpit.mid;return;}
  }
  const frame=await recapFrame();
  if(frame){await cockpitPhoto(frame,recapCaption(),recapKb());gw.mid=cockpit.mid;lastCardSig=sig;}
  else {const r=await send(recapCaption(),recapKb());cockpit.mid=(r&&r.result&&r.result.message_id)||null;gw.mid=cockpit.mid;lastCardSig='';}
}
async function refreshRecap(){ await showRecap(); } // cockpitPhoto édite en place
// /go = ouvre la CARTE (écran d'accueil V2) : supprime l'ancienne, repart propre, sujet résolu
async function openCard(){ await delMsg(cockpit.mid); gwReset(); await ensureTopic(); await showRecap(); }
// ── Orchestration de génération pilotée par le bot (script preview + maquette + GO) ──
let genJob=null; // job de génération courant
let genAbort=false; // flag d'annulation (❌ / /stop) vérifié entre étapes + pendant le polling lipsync
let genStep=''; // étape courante (pour le message « annulé à l'étape X »)
let modifyFlow=false; // vrai pendant [✏️ Modifier] à l'étape maquette -> les pickers reviennent à la maquette
function abortNow(){return genAbort;}
function genBusy(){return !!(proc||genJob&&genJob.running);}
const CAT_FOCUS={redflags:'red flags, toxic men, manipulation, control, disrespect',attach:'attachment styles, anxious attachment, avoidant men, fear of intimacy',worth:'self-worth, self-respect, knowing your value, stop settling',healing:'breakups, no contact, healing, moving on, grief',situ:'situationships, dating games, mixed signals, breadcrumbing, why men pull away',feminine:'feminine energy, soft life, high-value mindset, letting him chase'};
let sessionTopics=[]; // sujets déjà tirés/refusés cette session -> exclusion anti-répétition
async function autoPickTopic(cat,extra){
  const Anthropic=require('@anthropic-ai/sdk');const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
  let used=[];try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));used=(lib.scripts||[]).map(s=>s.title);}catch(e){}
  const excl=[...used,...sessionTopics,...(extra||[])].filter(Boolean);
  const focus=cat&&CAT_FOCUS[cat]?('STRICTLY within this theme: '+CAT_FOCUS[cat]+'.'):'romantic relationship topics (red flags, attachment, self-worth, breakups, situationships, feminine energy).';
  const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:120,messages:[{role:'user',content:'TikTok relationship coach for women 20-40. Pick ONE fresh, viral topic — '+focus+'\nIMPORTANT anti-repetition: it MUST be clearly DIFFERENT (different angle AND different wording) from every title in the EXCLUDE list. Never return anything similar to them.\nEXCLUDE ('+excl.length+'): '+excl.slice(-120).join(' | ')+'\nReturn ONLY the new title in English, no quotes, no bold.'}]});
  return r.content[0].text.trim().replace(/^["'*]+|["'*]+$/g,'');
}
// Résout le sujet AU MOMENT du récap (auto -> autoPickTopic), pour l'afficher avant GO
function apiNice(e){const m=String((e&&e.message)||e||'');
  if(/credit balance/i.test(m))return '⚠️ Crédits API Anthropic épuisés — recharge sur console.anthropic.com → Plans & Billing.';
  if(/overloaded|529|rate limit/i.test(m))return '⚠️ API Anthropic surchargée — réessaie dans une minute.';
  if(/ENOTFOUND|ECONN|fetch failed|network|connection error/i.test(m))return '⚠️ Pas de connexion à l\'API Anthropic — vérifie le réseau (ou crédits/clé).';
  return m.slice(0,200);}

// ── [chantier3] FEEDBACK : temps honnête + ticker + erreurs actionnables ──────────
const PROD_TIME={MIN:3,MAX:10,NOTE:'parfois plus selon Kling'}; // (A) durée réaliste affichée au récap/maquette
function prodTimeLabel(){return '~'+PROD_TIME.MIN+'-'+PROD_TIME.MAX+' min ('+PROD_TIME.NOTE+')';}
function fmtElapsed(ms){const s=Math.max(0,Math.round(ms/1000));const m=Math.floor(s/60);return m>0?(m+' min '+String(s%60).padStart(2,'0')+'s'):(s+'s');}
// (B) ticker VIVANT : met à jour le message de progression toutes ~12s pendant une étape longue (lipsync).
// Le compteur change le contenu -> l'anti-doublon du ① laisse passer l'édition (pas figé).
function startTicker(baseLabel,setProgFn){
  const t0=Date.now();let alive=true;
  const tick=()=>{if(alive)setProgFn(baseLabel+' · ⏱ '+fmtElapsed(Date.now()-t0)).catch(()=>{});};
  const id=setInterval(tick,12000);
  return ()=>{alive=false;clearInterval(id);};
}
// (D) erreurs API -> message HUMAIN actionnable (jamais de boucle ; bouton ↻ Réessayer côté appelant).
function humanError(e,step){
  const m=String((e&&e.message)||e||'');
  const prov=/eleven/i.test(m)?'ElevenLabs (voix)':(/lipsync|kling|higgs/i.test(m)?'Kling (lipsync)':((/anthropic|claude/i.test(m)||/script/i.test(step||''))?'Anthropic (script)':'le fournisseur'));
  if(/credit|quota|insufficient|payment required|balance too low|\b402\b/i.test(m))
    return '💳 <b>Crédits insuffisants chez '+prov+'</b> — recharge nécessaire, puis ↻ Réessayer.\n<i>(étape '+(step||'?')+' · aucune relance automatique)</i>';
  if(/\b401\b|unauthor|api key|invalid.*key|forbidden|\b403\b/i.test(m))
    return '🔑 <b>Clé API '+prov+' refusée</b> (ou crédits épuisés) — vérifie .env / recharge, puis ↻ Réessayer.\n<i>(étape '+(step||'?')+')</i>';
  if(/ENOTFOUND|ECONN|fetch failed|network|timeout|ETIMEDOUT|socket|EAI_AGAIN|\b50[234]\b|\b529\b|overloaded|rate limit|\b429\b/i.test(m))
    return '🌐 <b>Souci réseau/API ('+prov+')</b> — réessaie dans un instant. ↻ Réessayer.\n<i>(étape '+(step||'?')+')</i>';
  return '⚠️ <b>Échec à l\'étape '+(step||'?')+'</b> : '+m.slice(0,120)+'\nTu peux ↻ Réessayer.';
}
const RETRY_KB=[[{text:'↻ Réessayer',callback_data:'GJ_GO'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}]];
async function ensureTopic(){
  if(gw.subjectMode==='mine')return;
  if(gw.topic)return;
  gw.topicLocal=false;
  try{gw.topic=await autoPickTopic(gw.topicCat);if(gw.topic)sessionTopics.push(gw.topic);}
  catch(e){ /*secours : sujet LOCAL (gratuit, hors API) pour ne jamais bloquer la carte*/
    const t=TOPIC_IDEAS[Math.floor(Math.random()*TOPIC_IDEAS.length)][1];
    gw.topic=t;gw.topicLocal=true;jlog('⚠️ sujet auto API KO ('+apiNice(e)+') — fallback local');
  }
}
async function recapGo(){
  if(genBusy()){await send('⏳ Une génération est déjà en cours — /stop d\'abord.');return;}
  await ensureTopic();
  const dur=gw.duration||'23s';const plan=WF.planParts(parseInt(dur,10)||23);
  genJob={duration:dur,parts:plan.n,words:plan.words,subjectMode:gw.subjectMode,topicCat:gw.topicCat||null,topic:gw.topic||null,styleName:gw.styleName,look:gwLook(),audio:null,running:false};
  if(gwLook())setAvatar(gwLook());
  await cockpitCaption('📝 Écriture du script… (~10s)',[[{text:'⛔ Annuler',callback_data:'GJ_CANCEL'}]]); // morphe la carte, pas de nouveau message
  await genScriptStep();
}
async function showScriptCard(){
  const wc=genJob.script.split(/\s+/).filter(Boolean).length;
  const head=journey('script')+'\n\n📝 <b>SCRIPT</b> ('+wc+' mots)\n\n';
  let body=escHtml(genJob.script);const room=990-head.length;let trunc=false;
  if(body.length>room){body=body.slice(0,room)+'…';trunc=true;}
  const kb=[
    [{text:'✅ Valider',callback_data:'GJ_OK'},{text:'🔄 Nouveau',callback_data:'GJ_NEW'}],
    [{text:'🎣 Hooks A/B',callback_data:'GJ_HOOKS'},{text:'📂 Catégorie',callback_data:'GJ_CAT'}],
    [{text:'✏️ Texte',callback_data:'GJ_EDIT'},{text:'💾 Garder',callback_data:'GJ_SAVESCRIPT'}],
    ...(trunc?[[{text:'📄 Script complet',callback_data:'GJ_FULL'}]]:[]),
    [{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
  ];
  const cap=head+body;
  if(await cockpitCaption(cap,kb))return; // écrit dans le cockpit (sur la photo du récap)
  const r=await send(cap,kb);cockpit.mid=(r&&r.result&&r.result.message_id)||null;
}
async function genScriptStep(){
  try{
    if(!genJob.topic)genJob.topic=await autoPickTopic(genJob.topicCat);
    const prompt=genJob.parts>1?WF.partPrompt(genJob.topic,1,genJob.parts,[]):genJob.topic;
    const c=await WF.generateScript(prompt,genJob.words);
    genJob.c1=c;genJob.script=c.script;genJob.keywords=c.keywords;genJob.reactions=c.reactions;genJob.audio=null;
    await showScriptCard();
  }catch(e){await cardMenu('❌ <b>Script impossible</b>\n'+escHtml(apiNice(e)),[[{text:'🔄 Réessayer',callback_data:'RC_GO'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);genJob=null;}
}
async function genHooks(){
  if(!genJob||!genJob.script){await send('⚠️ Aucun script.');return;}
  await cardMenu('🎣 Génération de 2 hooks…',[[{text:'⛔ Annuler',callback_data:'GJ_SHOWSCRIPT'}]]).catch(()=>{});
  try{
    const ant=new (require('@anthropic-ai/sdk'))({apiKey:process.env.ANTHROPIC_API_KEY});
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:120,messages:[{role:'user',content:'Write 2 DIFFERENT punchy 1-line opening hooks (max 12 words each, English, no quotes) for this TikTok relationship-coach script. Return EXACTLY two lines, prefixed "A:" and "B:".\nScript: '+genJob.script}]});
    const t=r.content[0].text;const a=((t.match(/A:\s*(.+)/)||[])[1]||'').trim();const b=((t.match(/B:\s*(.+)/)||[])[1]||'').trim();
    if(!a||!b){await toast('⚠️ Hooks indispo, on garde le script');await showScriptCard();return;}
    genJob.hooks=[a,b];
    await cardMenu('🎣 <b>HOOK D\'OUVERTURE</b> — choisis :\n\n🅰 '+escHtml(a)+'\n\n🅱 '+escHtml(b),[
      [{text:'🅰 Hook A',callback_data:'GJ_HOOK_0'},{text:'🅱 Hook B',callback_data:'GJ_HOOK_1'}],
      [{text:'◀️ Garder le script actuel',callback_data:'GJ_SHOWSCRIPT'}],
    ]);
  }catch(e){await cardMenu('❌ Hooks : '+escHtml(apiNice(e)),[[{text:'◀️ Script',callback_data:'GJ_SHOWSCRIPT'}]]);}
}
function applyHook(h){ // remplace la 1re phrase du script par le hook choisi
  const rest=genJob.script.replace(/^[^.!?]*[.!?]\s*/,'');
  genJob.script=(h.replace(/[.!?]*$/,'.')+' '+rest).trim();
  if(genJob.c1)genJob.c1=Object.assign({},genJob.c1,{script:genJob.script});
  genJob.audio=null;
}
async function genAfterScript(){
  const c=estimateCost(genJob.duration);const s=readSubs();
  const cap=journey('maquette')+`\n\n✅ Script validé · 🎨 ${fontLabel(s.font)} ${s.size}px\n💰 ${c.cr?c.cr+' cr Higgsfield + voix ≈ ':'~'}${c.total.toFixed(2)}${COST.CURRENCY}${c.cr?' (vidéo HD à reconfirmer)':''} · ⏳ ${prodTimeLabel()}${c.parts>1?' · '+c.parts+' parties':''}`;
  const kb=[
    [{text:'👁 Maquette (~centimes)',callback_data:'GJ_MOCK'},{text:'🚀 GO',callback_data:'GJ_GO'}],
    [{text:'✏️ Modifier',callback_data:'GJ_MODIFY'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
  ];
  if(!await cockpitCaption(cap,kb))await send(cap,kb);
}
async function genMockup(){
  if(!genJob||!genJob.script||genJob.script===DEMO_SCRIPT){await send('⚠️ Aucun script validé.');return;}
  if(genJob.mocking)return; // (E) anti double-tap : aperçu déjà en cours
  const raw=latestRaw();
  if(!raw){await send('⚠️ Pas d\'ancien footage. Utilise 🚀 GO direct.');return;}
  genJob.mocking=true;
  await cockpitCaption('⏳ Génération aperçu voix… (~centimes)',[[{text:'⛔ Annuler',callback_data:'GJ_CANCEL'}]]);
  try{
    ttsCheck('maquette',genJob.script);
    genJob.audio=await WF.generateAudio(_sanTTS(genJob.script),1);
    const out='/tmp/mockup_'+Date.now()+'.mp4';
    await freshRL().renderLocal({input:raw,wordTimings:genJob.audio.wordTimings,keywords:genJob.keywords,reactions:genJob.reactions,output:out,quiet:true,duration:genJob.audio.duration});
    const cap=journey('maquette')+`\n\n▶️ <b>Aperçu prêt</b> (script + modèle courants · lèvres non synchro).`;
    await cockpitVideo(out,cap,[
      [{text:'🚀 GO définitif',callback_data:'GJ_GO'}],
      [{text:'✏️ Modifier',callback_data:'GJ_MODIFY'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}],
    ]);
  }catch(e){
    const h=humanError(e,'aperçu');
    if(!await cockpitCaption(h,[[{text:'↻ Réessayer aperçu',callback_data:'GJ_MOCK'}],[{text:'🚀 GO définitif',callback_data:'GJ_GO'},{text:'❌ Annuler',callback_data:'GJ_CANCEL'}]]))await send(h);
  }finally{ genJob.mocking=false; }
}
async function genFinal(){
  if(!genJob){await send('⚠️ Aucun script en attente.');return;}
  if(proc||genJob.running){await send('⏳ Déjà en cours.');return;}
  genJob.running=true;state='running';genAbort=false;freshRL(); // render_local à jour (cache partagé WF.renderVideo)
  const job=genJob;
  if(!job||!job.script||job.script===DEMO_SCRIPT){await send('⚠️ Aucun script validé — repasse par 🚀 GO.');state='idle';genJob=null;return;}
  let progMid=null;const aKb=[[{text:'⛔ Annuler',callback_data:'GEN_ABORT'}]];
  const setProg=async t=>{ // met à jour le COCKPIT (sur la maquette/photo), sinon un message dédié
    if(await cockpitCaption('📊 '+t,aKb))return;
    if(!progMid){const r=await send('📊 '+t,aKb);progMid=r&&r.result&&r.result.message_id;}
    else{try{await tg('editMessageText',{message_id:progMid,text:'📊 '+t,parse_mode:'HTML',reply_markup:{inline_keyboard:aKb}});}catch(e){}}
  };
  await setProg('📝 ✓ · 🎙 Voix…');
  const abrt=()=>{if(genAbort)throw new Error('ABORT');};
  try{
    const ts=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    const outDir=personaOutDir();try{fs.mkdirSync(outDir,{recursive:true});}catch(e){} // dossier de la persona active
    genStep='voix';abrt();
    if(!job.audio){ttsCheck('gen p1',job.script);job.audio=await WF.generateAudio(_sanTTS(job.script),1);}
    genStep='avatar';abrt();await setProg('📝 ✓ · 🎙 ✓ · 🖼 avatar…');
    const imageUrl=await WF.prepareImage();
    const clips=[];const prevScripts=[job.script];const partsMeta=[];
    for(let i=1;i<=job.parts;i++){
      let c,audio;
      if(i===1){c=job.c1;audio=job.audio;}
      else{genStep='script '+i;abrt();await setProg('🎬 Partie '+i+'/'+job.parts+' · script+voix…');c=await WF.generateScript(WF.partPrompt(job.topic,i,job.parts,prevScripts),job.words);ttsCheck('gen p'+i,c.script);audio=await WF.generateAudio(_sanTTS(c.script),i);prevScripts.push(c.script);}
      genStep='lipsync '+i+'/'+job.parts;abrt();
      const lipLabel='🎬 Lipsync '+i+'/'+job.parts+'… (Kling, '+prodTimeLabel()+')';
      await setProg(lipLabel+' · ⏱ 0s');
      const stopTick=startTicker(lipLabel,setProg); // (B) compteur vivant pendant le poll Kling (async -> le ticker tourne)
      let lip;try{lip=await WF.generateLipsync(imageUrl,audio.audioUrl,i,abortNow);}finally{stopTick();}
      const rawi=await WF.saveLipsyncRaw(lip,i,ts,outDir);
      genStep='rendu '+i;abrt();await setProg('🎬 Lipsync '+i+' ✓ · ✨ rendu…');
      const vid=await WF.renderVideo(lip,audio.wordTimings,c.keywords,audio.duration,i,c.reactions,rawi);
      const p=await WF.saveOpen(vid,c,ts,i,outDir);
      clips.push(p);partsMeta.push({raw:rawi,wordTimings:audio.wordTimings,keywords:c.keywords,reactions:c.reactions});
    }
    let finalP=clips.filter(Boolean)[0];
    if(clips.filter(Boolean).length>1){finalP=path.join(outDir,ts+'_FINAL.mp4');WF.concatClips(clips.filter(Boolean),finalP);}
    await setProg('📦 Archivage du dossier…');
    const genDir=makeGenFolder(ts,job.topic,finalP,partsMeta,clips);
    try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));lib.scripts.push({id:Date.now().toString(),title:job.topic,date:ts.slice(0,10),script:job.script,performance:null});fs.writeFileSync(LIBRARY,JSON.stringify(lib,null,2));}catch(e){}
    if(job.look)genState.look=job.look;genState.duration=job.duration;genState.styleName=job.styleName;genState.subjectMode=job.subjectMode;pushLastLook(job.look);saveState();
    const gfIdx=genFolders.push({dir:genDir,finalP,topic:job.topic,covers:[],ts,words:job.words,imageUrl,prevScripts:prevScripts.slice(),partN:job.parts})-1;
    // 3 BLOCS : la vidéo finale atterrit dans le BLOC RÉSULTATS (édité en place), le cockpit redevient la carte
    let vidMid=null;
    try{vidMid=await resAdd({type:'video',path:finalP,gfIdx,label:escHtml(job.topic||'')});}catch(e){await send('⚠️ Vidéo trop lourde — voir /files.');}
    genFolders[gfIdx].vidMid=vidMid||results.mid;genFolders[gfIdx].caption=buildVideoCaption(finalP);
    try{genFolders[gfIdx].covers=makeCovers(finalP,gfIdx);}catch(e){}
  }catch(e){
    if(e.message==='ABORT'){ // (C) annulation propre : message clair + état nettoyé + retour carte
      const st=genStep||'?';
      genAbort=false;genStep='';state='idle';genJob=null;
      await setProg('⛔ <b>Annulé</b> à l\'étape <b>'+st+'</b>. Rien n\'a été livré.');
      const _cm=cockpit.mid;gwReset();cockpit.mid=_cm;lastCardSig='';
      await ensureTopic().catch(()=>{});await showRecap().catch(()=>{});
      return;
    }
    // (D) erreur réelle : message HUMAIN actionnable + ↻ Réessayer, SANS boucler. genJob CONSERVÉ pour le retry.
    const h=humanError(e,genStep);
    genJob.running=false;genStep='';state='idle';genAbort=false;
    jlog('⚠️ genFinal erreur ('+String(e.message||'').slice(0,80)+')');
    if(!await cockpitCaption(h,RETRY_KB))await send(h,RETRY_KB);
    return;
  }
  genAbort=false;genStep='';state='idle';genJob=null; // succès
  const _cm=cockpit.mid;gwReset();cockpit.mid=_cm;lastCardSig=''; /*3 blocs : on GARDE le message cockpit et on le remorphe en carte*/
  await ensureTopic().catch(()=>{});await showRecap().catch(()=>{});
}
// ── Dossier par génération + restyle gratuit ────────────────────────────────────
function gslug(s){return String(s||'video').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'video';}
let genFolders=[];
function genFoldersLoad(){ /*les vidéos livrées SURVIVENT au restart : re-scan d'outputs/generations (Postable/Restyler/Cover/Légende restent actifs)*/
  try{
    const root=path.join(BASE,'outputs','generations');
    for(const e of fs.readdirSync(root).sort()){
      const dir=path.join(root,e);const fm=path.join(dir,'final.mp4');
      let st;try{st=fs.statSync(dir);}catch(_){continue;}
      if(!st.isDirectory()||!fs.existsSync(fm))continue;
      let meta={};try{meta=JSON.parse(fs.readFileSync(path.join(dir,'meta.json'),'utf8'));}catch(_){}
      genFolders.push({dir,finalP:fm,topic:meta.topic||e,covers:[],ts:meta.ts||'',words:'',imageUrl:null,prevScripts:null,partN:(meta.parts||[]).length||1,restored:true});
    }
    if(genFolders.length)jlog('🗂 genFolders restaurés : '+genFolders.length);
  }catch(e){}
}
function makeGenFolder(ts,topic,finalP,partsMeta,clips){
  const dir=path.join(BASE,'outputs','generations',ts+'_'+gslug(topic));
  try{fs.mkdirSync(dir,{recursive:true});}catch(e){}
  try{fs.copyFileSync(finalP,path.join(dir,'final.mp4'));}catch(e){}
  (partsMeta||[]).forEach((m,i)=>{try{if(m.raw&&fs.existsSync(m.raw))fs.copyFileSync(m.raw,path.join(dir,'raw_p'+(i+1)+'.mp4'));}catch(e){}});
  try{const txt=clips&&clips[0]&&clips[0].replace(/\.mp4$/,'.txt');if(txt&&fs.existsSync(txt))fs.copyFileSync(txt,path.join(dir,'caption.txt'));}catch(e){}
  try{fs.writeFileSync(path.join(dir,'style.json'),JSON.stringify(snapshotStyle(),null,2));}catch(e){}
  try{fs.writeFileSync(path.join(dir,'meta.json'),JSON.stringify({topic,ts,parts:(partsMeta||[]).map((m,i)=>({raw:'raw_p'+(i+1)+'.mp4',wordTimings:m.wordTimings,keywords:m.keywords,reactions:m.reactions}))},null,2));}catch(e){}
  const thumb=path.join(dir,'thumbnail.jpg');
  try{require('child_process').execFileSync('ffmpeg',['-y','-ss','1.0','-i',finalP,'-frames:v','1','-vf','scale=360:-1','-q:v','3',thumb],{stdio:'ignore'});}catch(e){}
  try{require('child_process').execSync('command -v fileicon >/dev/null 2>&1 && fileicon set "'+dir+'" "'+thumb+'" 2>/dev/null||true',{stdio:'ignore'});}catch(e){} // icône dossier = thumbnail (best effort)
  return dir;
}
function copyDirFlat(src,dst){fs.mkdirSync(dst,{recursive:true});for(const f of fs.readdirSync(src)){const s=path.join(src,f);try{if(fs.statSync(s).isFile())fs.copyFileSync(s,path.join(dst,f));}catch(e){}}}
// 3 propositions de cover extraites de la vidéo finale
function makeCovers(finalP,gfIdx){
  let dur=10;try{dur=parseFloat(require('child_process').execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "'+finalP+'"').toString().trim())||10;}catch(e){}
  const times=[Math.min(0.8,dur*0.1),dur*0.45,Math.max(0.6,dur*0.8)];const out=[];
  times.forEach((t,i)=>{const c='/tmp/cover_'+gfIdx+'_'+i+'.jpg';try{require('child_process').execFileSync('ffmpeg',['-y','-ss',t.toFixed(2),'-i',finalP,'-frames:v','1','-q:v','2',c],{stdio:'ignore'});if(fs.existsSync(c))out.push(c);}catch(e){}});
  return out;
}
let covState={gfIdx:-1,idx:0,mid:null};
async function showCover(){
  const gf=genFolders[covState.gfIdx];
  if(gf&&(!gf.covers||!gf.covers.length)){try{gf.covers=makeCovers(gf.finalP,covState.gfIdx);}catch(e){}} /*covers régénérées à la demande (sessions restaurées)*/
  if(!gf||!gf.covers||!gf.covers.length){await toast('⚠️ Covers indisponibles');return;}
  if(covState.idx<0)covState.idx=gf.covers.length-1;if(covState.idx>=gf.covers.length)covState.idx=0;
  const fp=gf.covers[covState.idx];
  const rows=[[{text:'◀️',callback_data:'COVER_PREV'},{text:'✅ Choisir cette cover',callback_data:'COVER_PICK'},{text:'▶️',callback_data:'COVER_NEXT'}],[{text:'◀️ Résultats',callback_data:'RES_BACK'}]]; /*retour AU bloc résultats, pas à la carte*/
  const cap='🖼 <b>COVER</b> '+(covState.idx+1)+'/'+gf.covers.length+' — deviendra la miniature du dossier.';
  if(covState.mid&&await editPhotoKb(covState.mid,fp,cap,rows))return;
  const r=await sendPhotoKb(fp,cap,rows);covState.mid=(r&&r.result&&r.result.message_id)||null;
}
async function restyleFolder(dir){
  const meta=JSON.parse(fs.readFileSync(path.join(dir,'meta.json'),'utf8'));
  const clips=[];
  for(let i=0;i<meta.parts.length;i++){
    const m=meta.parts[i];const raw=path.join(dir,m.raw);
    if(!fs.existsSync(raw))continue;
    const dur=(m.wordTimings&&m.wordTimings.length)?m.wordTimings[m.wordTimings.length-1].end+0.35:23;
    const out='/tmp/restyle_'+Date.now()+'_'+i+'.mp4';
    await freshRL().renderLocal({input:raw,wordTimings:m.wordTimings,keywords:m.keywords,reactions:m.reactions,output:out,quiet:true,duration:dur});
    clips.push(out);
  }
  if(!clips.length)throw new Error('aucun raw exploitable');
  let finalP=clips[0];
  if(clips.length>1){finalP='/tmp/restyle_final_'+Date.now()+'.mp4';WF.concatClips(clips,finalP);}
  try{fs.copyFileSync(finalP,path.join(dir,'final.mp4'));fs.writeFileSync(path.join(dir,'style.json'),JSON.stringify(snapshotStyle(),null,2));}catch(e){}
  return finalP;
}
let mainMenuMid=null;
async function delMsg(mid){try{if(mid)await tg('deleteMessage',{message_id:mid});}catch(e){}}
async function showMainMenu(){
  const r=await send('🏠 <b>MENU</b>\n\nQue veux-tu faire ?',[
    [{text:'🎬 Générer une vidéo',callback_data:'MENU_GEN'},{text:'⚡ Express',callback_data:'EXPRESS_NEW'}],
    [{text:'🎨 Éditer le look',callback_data:'EDIT_HOME'},{text:'👤 Looks',callback_data:'MENU_LOOKS'}],
    [{text:'💾 Modèles',callback_data:'SHOWSTYLES'},{text:'📤 Prêt à poster',callback_data:'SHOWREADY'}],
    [{text:'📁 Fichiers',callback_data:'FILES_HOME'},{text:'👁 Preview',callback_data:'EDIT_PREVIEW'},{text:'🧪 Test',callback_data:'MENU_TEST'}],
    [{text:'🛑 Stop',callback_data:'TECH_STOP'},{text:'⚙️ Technique',callback_data:'MENU_TECH'},{text:'❓ Aide',callback_data:'MENU_HELP'}],
  ]);
  mainMenuMid=(r&&r.result&&r.result.message_id)||null;
}
// [C1] MENU UNIFIÉ /go = /menu : écran épuré (photo avatar + 4 entrées + profil), EN PLACE (cockpit, aucune nouvelle fenêtre)
function homeAvatar(){ try{ if(workingSource&&fs.existsSync(workingSource)&&/\.(jpg|jpeg|png|webp)$/i.test(workingSource))return workingSource; const l=gwLook(); if(l)return l; }catch(e){} return nlCover(); }
async function showHome(){
  const cap='🏠 <b>STUDIO</b> · 👤 Imany';
  const rows=[
    [{text:'🚀 Créer',callback_data:'HOME_CREER'}],
    [{text:'🎬 Studio',callback_data:'HOME_STUDIO'},{text:'🎨 Éditer',callback_data:'EDIT_HOME'}],
    [{text:'❓ Aide',callback_data:'MENU_HELP'},{text:'👤 Profil : Imany ▾',callback_data:'HOME_PROFIL'}],
  ];
  const av=homeAvatar();
  if(av&&fs.existsSync(av))await cockpitPhoto(av,cap,rows);
  else await cardMenu(cap,rows);
}
// [C2] Section STUDIO : sous-menu (en place) -> accès directs branchés sur l'existant
async function showStudio(){
  await cardMenu('🎬 <b>STUDIO</b> — bibliothèque',[
    [{text:'👗 Looks',callback_data:'MENU_LOOKS'},{text:'👤 Avatars',callback_data:'MENU_LOOKS'}],
    [{text:'🖼 Photos',callback_data:'FCAT_img'},{text:'🎬 Vidéos',callback_data:'FCAT_vid'}],
    [{text:'🏛 Décors',callback_data:'STUDIO_DECORS'},{text:'🕘 Historique',callback_data:'STUDIO_HIST'}],
    [{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
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
  await send('📁 <b>FICHIERS</b>\n\n📱 <b>Sur iPhone</b> : app <b>Fichiers</b> → <b>iCloud Drive</b> → <b>podcast-outputs</b>\n(générations, ready_to_post, a_retravailler, raws, légendes — tout y est en synchro auto).\n\nOu tape une catégorie pour recevoir un fichier ici :',[
    [{text:'🎬 Vidéos',callback_data:'FCAT_vid'},{text:'🖼 Images',callback_data:'FCAT_img'}],
    [{text:'📄 Légendes',callback_data:'FCAT_txt'},{text:'📤 Prêt à poster',callback_data:'FCAT_ready'}],
    [{text:'👤 Looks',callback_data:'FCAT_looks'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
  ]);
  await send('🔗 Lien direct (peut s\'ouvrir dans Fichiers selon iOS) :\nshareddocuments://com~apple~CloudDocs/podcast-outputs').catch(()=>{});
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
  'Signature':{brightness:0.02,contrast:1.04,saturation:1.0,temperature:5600,sharpness:0,vignette:1},
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
function setWorkPhoto(p){ /*regle Etoile 08/06 : une NOUVELLE photo demarre TOUJOURS sur l'image de base (zero filtre herite) — les styles ne s'appliquent que sur action explicite (LS_REUSE / preset / modele)*/
  if(p&&fs.existsSync(p)){
    if(workingSource&&workingSource!==p){try{const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Naturel']);writeFx(fx);}catch(e){}} /*[BUG-4] nouvelle photo -> fx NEUTRES (image brute), aucun filtre hérité*/
    workingSource=p;
  }
}
function workSrcLabel(){const s=workSrc();return s?path.basename(s):'(aucune)';}
// Texte d'aperçu : script courant de la session s'il existe, sinon démo
const DEMO_SCRIPT='SHE SAYS YOU CHANGED BUT CHEMISTRY FADES';
// 🔒 Garde-fou TTS : refuse tout texte suspect (statut/commande/mot unique/trop court) avant ElevenLabs
const TTS_BAD=/^[\/]?(status|running|idle|lipsync|rendu|voix|avatar|script|maquette|done|ok|pending|completed|failed|queued|processing|undefined|null|stop|menu|go|restart|test|preview|edit|looks)$/i;
function validTTS(t){t=String(t||'').trim();if(t.length<15)return false;if(!/\s/.test(t))return false;if(TTS_BAD.test(t))return false;return true;}
// Loggue le texte exact envoyé au TTS (preuve dans ui_journal) + bloque si suspect
function ttsCheck(where,text){
  uiLog({dir:'out',type:'tts',screen:where,user_action:String(text||'').slice(0,80),caption_len:(text||'').length,buttons:[],edited_in_place:false});
  if(!validTTS(text))throw new Error('Texte TTS suspect en '+where+' : « '+String(text||'').slice(0,40)+' » — génération bloquée (le script n\'a pas été validé correctement).');
}
// L'aperçu/preview LIT le script validé s'il existe (lecture seule, ne l'écrase JAMAIS), sinon démo.
function previewScript(){return (genJob&&genJob.script)?genJob.script:DEMO_SCRIPT;}
function previewPhrase(){return previewScript().replace(/[\n\r]+/g,' ').split(/\s+/).filter(Boolean).slice(0,2).join(' ').toUpperCase().replace(/[^A-Z ]/g,'')||'WRONG YOURE';}
// Rend un court clip (texte courant) avec le STYLE COURANT sur une VIDÉO, renvoie {frame,style}
async function renderStyleFrame(input){
  const raw=input||latestRaw(); if(!raw)return null;
  const {renderLocal}=freshRL();
  const words=previewScript().replace(/[\n\r]+/g,' ').split(/\s+/).filter(Boolean).slice(0,8);
  const wt=words.map((w,i)=>({text:w.toUpperCase().replace(/[^A-Z]/g,''),start:+(i*0.45).toFixed(3),end:+((i+1)*0.45).toFixed(3),duration:0.45})).filter(x=>x.text);
  const out='/tmp/sf_'+Date.now()+'.mp4';const dur=wt.length?wt[wt.length-1].end+0.3:1.4;
  let r;try{r=await renderLocal({input:raw,wordTimings:wt,keywords:[wt[1]?wt[1].text:''],reactions:[],output:out,quiet:true,duration:dur});}catch(e){return null;}
  if(!r||r.duration==null)return null; // 🔒 jamais d'exception 'duration of null' -> pas d'échec silencieux de la carte
  const frame='/tmp/sf_'+Date.now()+'_'+Math.floor(r.duration*100)+'.png';
  try{require('child_process').execFileSync('ffmpeg',['-y','-ss',Math.min(0.6,dur/2).toFixed(2),'-i',out,'-frames:v','1','-q:v','2',frame],{stdio:'ignore'});}catch(e){return null;}
  return {frame,style:r.style};
}
// Aperçu STILL sur une IMAGE (look) : couleur + sous-titres incrustés, via les helpers de render_local
async function renderStillPreview(imgPath,grade){
  const rl=freshRL();
  const sub=readSubs(),fx=readFx(),W=720,H=1280;
  const assPath='/tmp/still_'+Date.now()+'.ass';
  const subsOn=sub.subs!==0;
  if(subsOn)fs.writeFileSync(assPath,rl.buildAss([{text:previewPhrase(),start:0,length:99}],{font:sub.font,fontSize:sub.size,oy:sub.oy,letterSpacing:parseFloat(sub.letter)||0}));
  // [B image-intacte] AUCUN grading couleur sur un still par défaut (image telle quelle) — grade=true seulement dans l'éditeur d'image
  const color=grade?rl.buildColorFilter(fx.image):'';
  let vf='scale='+W+':'+H+':force_original_aspect_ratio=increase,crop='+W+':'+H+',setsar=1';
  if(color)vf+=','+color;
  if(subsOn)vf+=',ass='+assPath;
  const out='/tmp/still_'+Date.now()+'.png';
  try{require('child_process').execFileSync('ffmpeg',['-y','-i',imgPath,'-vf',vf,'-frames:v','1','-q:v','2',out],{stdio:'ignore'});}catch(e){return null;}
  return {frame:out,style:{font:sub.font,fontSize:sub.size,oy:sub.oy}};
}
// Frame de travail courante (image look -> still ; sinon vidéo raw -> render)
// dernier footage en MOUVEMENT (raw) si dispo, sinon le look de travail (item 5)
function liveSrc(){const lr=latestRaw();return (lr&&fs.existsSync(lr))?lr:workSrc();}
async function renderWorkingFrame(srcOverride,grade){
  const src=srcOverride||workSrc(); if(!src)return null;
  // iCloud : télécharge le fichier si c'est un placeholder (sinon le rendu échoue)
  try{if(fs.statSync(src).size<30000)require('child_process').execSync('brctl download "'+src+'" 2>/dev/null');}catch(e){}
  if(/\.(jpg|jpeg|png|webp)$/i.test(src))return await renderStillPreview(src,grade); // grade=true uniquement depuis l'éditeur d'image
  return await renderStyleFrame(src);
}
function hstackLabeled(leftPng,rightPng,leftLabel,rightLabel,outPng){
  const FF='/System/Library/Fonts/Helvetica.ttc';
  require('child_process').execFileSync('ffmpeg',['-y','-i',leftPng,'-i',rightPng,'-filter_complex',
    `[0:v]scale=-1:1000,drawtext=fontfile=${FF}:text=${leftLabel}:x=12:y=12:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.6[a];[1:v]scale=-1:1000,drawtext=fontfile=${FF}:text=${rightLabel}:x=12:y=12:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.6[b];[a][b]hstack`,outPng],{stdio:'ignore'});
}
let editPrevFrame=null; // frame "AVANT" pour le before/after
async function captureBaseline(){ const f=await renderWorkingFrame(null,true); editPrevFrame=f?f.frame:null; }
// Après un réglage : envoie AVANT|APRÈS puis re-affiche les contrôles
async function sendBeforeAfter(){
  const after=await renderWorkingFrame(null,true); /*éditeur image : grading visible*/
  if(!after){await send('⚠️ Aperçu indispo : aucun _raw_p*.mp4 dans outputs/ (lance un /go).');return;}
  const comp='/tmp/ba_'+Date.now()+'.png';
  if(editPrevFrame&&fs.existsSync(editPrevFrame)){
    try{hstackLabeled(editPrevFrame,after.frame,'AVANT','APRES',comp);}catch(e){fs.copyFileSync(after.frame,comp);}
  }else fs.copyFileSync(after.frame,comp);
  editPrevFrame=after.frame; // l'après devient l'avant du prochain réglage
  const st=after.style;
  const cap=`↔️ AVANT | APRÈS — 🔤 ${fontLabel(st.font)} • ${st.fontSize}px • y=${st.oy}`;
  // [BUG-5] EN PLACE dans le bloc édition (plus de message image séparé)
  if(cockpit.mid){await cockpitPhoto(comp,cap,sectionKb(editPanel.section||'img'));editPanel.mid=cockpit.mid;}
  else await sendImg(comp,cap).catch(()=>{});
}
async function sendVsReference(){
  const after=await renderWorkingFrame(null,true); /*éditeur image : grading visible*/
  if(!after){await send('⚠️ Aperçu indispo (aucun raw).');return;}
  const ref=path.join(BASE,'reference_model.png');const comp='/tmp/vr_'+Date.now()+'.png';
  if(fs.existsSync(ref)){try{hstackLabeled(ref,after.frame,'REFERENCE','RENDU',comp);}catch(e){fs.copyFileSync(after.frame,comp);}}
  else fs.copyFileSync(after.frame,comp);
  // [BUG-5] EN PLACE dans le bloc édition (plus de message image séparé)
  if(cockpit.mid){await cockpitPhoto(comp,'🎯 RÉFÉRENCE | RENDU actuel',sectionKb(editPanel.section||'img'));editPanel.mid=cockpit.mid;}
  else await sendImg(comp,'🎯 RÉFÉRENCE | RENDU actuel').catch(()=>{});
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
  const sig=_sig('photo',fp,caption,rows);
  if(sigSame(mid,sig))return true; // contenu identique -> on ne touche pas Telegram (zéro doublon)
  uiLog({dir:'out',type:'edit',screen:screenOf(caption),user_action:'',caption_len:(caption||'').length,buttons:btnLabels(rows),edited_in_place:true});
  try{
    let d=null;
    const fid=cachedFileId(fp,'photo');
    if(fid){ // image déjà connue de Telegram -> édition JSON, ZÉRO re-upload
      d=await tg('editMessageMedia',{message_id:mid,media:{type:'photo',media:fid,caption:caption,parse_mode:'HTML'},...(rows?{reply_markup:{inline_keyboard:rows}}:{})});
      if(d&&d.ok){sigSet(mid,sig);return true;}
      if(isNotMod(d&&d.description)){sigSet(mid,sig);return true;}
      if(isGone(d&&d.description)){jlog('⚠️ editPhotoKb message disparu mid='+mid);return false;}
    }
    fp=shrinkIfBig(fp); // 🔑 sinon editMessageMedia rejette les fichiers > 10 Mo -> empilement
    const FormData=require('form-data');const form=new FormData();
    form.append('chat_id',CHAT_ID);form.append('message_id',String(mid));
    form.append('media',JSON.stringify({type:'photo',media:'attach://photo',caption:caption,parse_mode:'HTML'}));
    form.append('photo',fs.readFileSync(fp),{filename:'p.jpg',contentType:'image/jpeg'});
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/editMessageMedia',{method:'POST',body:form});
    d=await r.json();
    if(d&&d.ok){sigSet(mid,sig);cacheFileId(fp,d.result);return true;}
    if(isNotMod(d&&d.description)){sigSet(mid,sig);return true;}
    if(isGone(d&&d.description)){jlog('⚠️ editPhotoKb message disparu mid='+mid);return false;} // SEUL cas de recréation
    jlog('⚠️ editPhotoKb REFUS (sans recréation) mid='+mid+': '+((d&&d.description)||'?'));
    return true; // erreur transitoire : on n'empile PAS un nouveau message
  }catch(e){jlog('⚠️ editPhotoKb ERR: '+e.message);return true;}
}
// ── COCKPIT : UN seul message de contrôle pour tout le wizard (photo↔vidéo via editMessageMedia) ──
let cockpit={mid:null};
function cockpitReset(){cockpit.mid=null;}
function cap1024(s){s=String(s||'');return s.length>1024?s.slice(0,1000)+'…':s;}
async function editVideoKb(mid,fp,caption,rows){
  const sig=_sig('video',fp,cap1024(caption),rows);
  if(sigSame(mid,sig))return true; // contenu identique -> rien à faire
  uiLog({dir:'out',type:'edit',screen:screenOf(caption)||'maquette',user_action:'',caption_len:(caption||'').length,buttons:btnLabels(rows),edited_in_place:true});
  try{
    let d=null;
    const fid=cachedFileId(fp,'video');
    if(fid){ // vidéo déjà connue de Telegram -> édition JSON, ZÉRO re-upload
      d=await tg('editMessageMedia',{message_id:mid,media:{type:'video',media:fid,caption:cap1024(caption),parse_mode:'HTML',supports_streaming:true},...(rows?{reply_markup:{inline_keyboard:rows}}:{})});
      if(d&&d.ok){sigSet(mid,sig);return true;}
      if(isNotMod(d&&d.description)){sigSet(mid,sig);return true;}
      if(isGone(d&&d.description)){jlog('⚠️ editVideoKb message disparu mid='+mid);return false;}
    }
    const FormData=require('form-data');const form=new FormData();
    form.append('chat_id',CHAT_ID);form.append('message_id',String(mid));
    form.append('media',JSON.stringify({type:'video',media:'attach://vid',caption:cap1024(caption),parse_mode:'HTML',supports_streaming:true}));
    form.append('vid',fs.readFileSync(fp),{filename:'v.mp4',contentType:'video/mp4'});
    if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
    const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/editMessageMedia',{method:'POST',body:form});
    d=await r.json();
    if(d&&d.ok){sigSet(mid,sig);cacheFileId(fp,d.result);return true;}
    if(isNotMod(d&&d.description)){sigSet(mid,sig);return true;}
    if(isGone(d&&d.description)){jlog('⚠️ editVideoKb message disparu mid='+mid);return false;} // SEUL cas de recréation
    jlog('⚠️ editVideoKb REFUS (sans recréation) mid='+mid+': '+((d&&d.description)||'?'));
    return true; // erreur transitoire : pas de nouveau message
  }catch(e){jlog('⚠️ editVideoKb ERR: '+e.message);return true;}
}
// remplace le média du cockpit par une PHOTO (édite en place, sinon nouveau message)
async function cockpitPhoto(fp,caption,rows){
  caption=cap1024(caption);
  if(cockpit.mid&&await editPhotoKb(cockpit.mid,fp,caption,rows))return cockpit.mid;
  const r=await sendPhotoKb(fp,caption,rows);cockpit.mid=(r&&r.result&&r.result.message_id)||null;return cockpit.mid;
}
// remplace le média du cockpit par une VIDÉO (maquette) dans le MÊME message
async function cockpitVideo(fp,caption,rows){
  if(cockpit.mid&&await editVideoKb(cockpit.mid,fp,caption,rows))return cockpit.mid;
  const FormData=require('form-data');const form=new FormData();
  form.append('chat_id',CHAT_ID);form.append('video',fs.readFileSync(fp),{filename:'v.mp4',contentType:'video/mp4'});
  form.append('caption',cap1024(caption));form.append('parse_mode','HTML');form.append('supports_streaming','true');
  if(rows)form.append('reply_markup',JSON.stringify({inline_keyboard:rows}));
  try{const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendVideo',{method:'POST',body:form});const d=await r.json();cockpit.mid=(d&&d.result&&d.result.message_id)||null;if(d&&d.ok)cacheFileId(fp,d.result);}catch(e){cockpit.mid=null;}
  return cockpit.mid;
}
// met à jour SEULEMENT le texte/boutons du cockpit (sans toucher le média)
async function cockpitCaption(caption,rows){
  caption=cap1024(caption);
  const sig=_sig('cap',null,caption,rows);
  if(sigSame(cockpit.mid,sig))return true; // déjà affiché à l'identique
  uiLog({dir:'out',type:'edit',screen:screenOf(caption),user_action:'',caption_len:(caption||'').length,buttons:btnLabels(rows),edited_in_place:true});
  try{if(cockpit.mid){const r=await tg('editMessageCaption',{message_id:cockpit.mid,caption:caption,parse_mode:'HTML',...(rows?{reply_markup:{inline_keyboard:rows}}:{})});
    if(r&&r.ok){sigSet(cockpit.mid,sig);return true;}
    if(isNotMod(r&&r.description)){sigSet(cockpit.mid,sig);return true;} // identique côté Telegram = OK
    if(isGone(r&&r.description))return false; // message disparu -> le caller recrée
    return true; // erreur transitoire : pas de message empilé
  }}catch(e){}
  return false; // pas de cockpit -> création par le caller
}
// ── BLOC 3 — RÉSULTATS (architecture 3 blocs statiques validée Etoile 08/06) ──
// UN message unique : photos gardées + vidéos livrées, nav ‹›, ré-édition, menu Étapes.
let results={mid:null,items:[],idx:0};
const RESULTS_PATH=path.join(BASE,'results_bloc.json');
function resLoad(){try{const j=JSON.parse(fs.readFileSync(RESULTS_PATH,'utf8'));results.items=(j.items||[]).filter(it=>it&&it.path&&fs.existsSync(it.path));results.idx=Math.max(0,results.items.length-1);
  if(j.mids){results.mid=j.mids.results||null;if(j.mids.video)cockpit.mid=j.mids.video;if(j.mids.photo)newlook.mediaId=j.mids.photo;} /*les 3 blocs SURVIVENT au restart (sinon empilement)*/
}catch(e){}}
function resSave(){try{fs.writeFileSync(RESULTS_PATH,JSON.stringify({items:results.items.slice(-30),mids:{photo:newlook.mediaId,video:cockpit.mid,results:results.mid}}));}catch(e){}}
function resKb(it){
  const n=results.items.length;const rows=[];
  if(n>1)rows.push([{text:'‹',callback_data:'RES_PREV'},{text:(results.idx+1)+' / '+n,callback_data:'NOOP'},{text:'›',callback_data:'RES_NEXT'}]);
  if(it&&it.type==='video'&&it.gfIdx!=null){
    rows.push([{text:'✅ Postable',callback_data:'GF_POST_'+it.gfIdx},{text:'🎨 Restyler',callback_data:'GF_RESTYLE_'+it.gfIdx}]);
    rows.push([{text:'🖼 Cover',callback_data:'COVER_OPEN_'+it.gfIdx},{text:'📋 Légende',callback_data:'GF_LONG_'+it.gfIdx},{text:'📁 Dossier',callback_data:'GF_FILES_'+it.gfIdx}]);
    rows.push([{text:'➕ Partie suivante',callback_data:'GF_ADDPART_'+it.gfIdx}]);
  }else if(it&&it.type==='photo'){
    rows.push([{text:'🎨 Ré-éditer',callback_data:'RES_EDIT'},{text:'🎬 Vidéo avec',callback_data:'RES_GEN'}]);
    rows.push([{text:'🔁 Refaire pareil',callback_data:'NL_RETRY'},{text:'🆕 Autre look',callback_data:'NL_OTHER'}]); /*conformité maquette validée (passe par le récap 💰)*/
  }else if(it&&it.type==='video'){
    if(it.readyIdx!=null)rows.push([{text:'✅ Prêt à poster',callback_data:'READY_'+it.readyIdx},{text:'📋 Légende longue',callback_data:'LCAP_LEGACY'}]);
    else rows.push([{text:'🚀 Générer pour de vrai',callback_data:'TEST_GEN'},{text:'🎨 Éditer',callback_data:'EDIT_HOME'}]);
  }
  rows.push([{text:'🧭 Étapes',callback_data:'RES_STEPS'},{text:'📤 Prêt à poster',callback_data:'SHOWREADY'}]);
  return rows;
}
function resCaptionOf(it){
  const n=results.items.length;const pos=n>1?' · '+(results.idx+1)+'/'+n:'';
  if(it.type==='video'&&it.gfIdx!=null)return cap1024(buildVideoCaption(it.path)+pos);
  return cap1024((it.type==='video'?'🎬':'📸')+' <b>RÉSULTATS</b>'+pos+(it.label?'\n'+it.label:''));
}
async function showResults(){
  if(!results.items.length){
    const cap='🗂 <b>RÉSULTATS</b>\n\nEncore vide — les photos gardées 💾 et les vidéos livrées s\'affichent ici.';
    const rows=[[{text:'🧭 Étapes',callback_data:'RES_STEPS'}]];
    if(results.mid&&await tgEditText(results.mid,cap,rows))return;
    const r=await send(cap,rows);results.mid=(r&&r.result&&r.result.message_id)||null;return;
  }
  if(results.idx<0)results.idx=results.items.length-1;
  if(results.idx>=results.items.length)results.idx=0;
  const it=results.items[results.idx];
  if(it.type==='video'){ /*anti-décalage : gfIdx re-résolu par CHEMIN (les index changent au restart)*/
    const gi=genFolders.findIndex(g=>g&&(g.finalP===it.path||path.join(g.dir,'final.mp4')===it.path||(it.path.includes('_FINAL')&&path.basename(g.dir).startsWith(path.basename(it.path).slice(0,16)))));
    if(gi>=0)it.gfIdx=gi;else if(it.gfIdx!=null&&!(genFolders[it.gfIdx]&&genFolders[it.gfIdx].finalP===it.path))it.gfIdx=null;
  }
  const cap=resCaptionOf(it),rows=resKb(it);
  if(results.mid){
    const ok=it.type==='video'?await editVideoKb(results.mid,it.path,cap,rows):await editPhotoKb(results.mid,it.path,cap,rows);
    if(ok)return;
    results.mid=null;jlog('⚠️ bloc résultats perdu — recréation unique');
  }
  if(it.type==='video'){results.mid=await sendVideoKb(it.path,cap,rows)||null;}
  else{const r=await sendPhotoKb(it.path,cap,rows);results.mid=(r&&r.result&&r.result.message_id)||null;}
}
async function resAdd(it){ /*toute livraison atterrit dans le bloc 3 (anti-doublon par chemin)*/
  results.items=results.items.filter(x=>x.path!==it.path);
  results.items.push(Object.assign({ts:Date.now()},it));
  while(results.items.length>30)results.items.shift();
  results.idx=results.items.length-1;
  await delMsg(results.mid);results.mid=null; /*NOUVEAU résultat -> le bloc redescend EN BAS du chat (sinon livraison invisible)*/
  resSave();
  await showResults().catch(()=>{});
  return results.mid;
}
async function resSteps(){ /*menu Étapes : remonter n'importe quelle catégorie, par bloc*/
  const rows=[
    [{text:'📸 Bloc photo',callback_data:'NL_CONFIG'},{text:'🎬 Bloc vidéo (carte)',callback_data:'MAIN_MENU'}],
    [{text:'👤 Avatar',callback_data:'RC_LOOK'},{text:'💬 Sujet',callback_data:'RC_SUBJ'},{text:'⏱ Durée',callback_data:'CARD_DUR'}],
    [{text:'📝 Script',callback_data:'GJ_SHOWSCRIPT'},{text:'🎨 Édition',callback_data:'EDIT_HOME'}],
    [{text:'🧪 Test gratuit',callback_data:'MENU_TEST'},{text:'📤 Export',callback_data:'SHOWREADY'}],
    [{text:'◀️ Résultats',callback_data:'RES_BACK'}],
  ];
  if(results.mid){
    const r=await tg('editMessageCaption',{message_id:results.mid,caption:'🧭 <b>ÉTAPES</b> — remonter une catégorie :',parse_mode:'HTML',reply_markup:{inline_keyboard:rows}}).catch(()=>null);
    if(r&&r.ok)return;
    if(await tgEditText(results.mid,'🧭 <b>ÉTAPES</b> — remonter une catégorie :',rows))return;
  }
  const r2=await send('🧭 <b>ÉTAPES</b> — remonter une catégorie :',rows);results.mid=(r2&&r2.result&&r2.result.message_id)||null;
}
function navRow(){return [
  [{text:'👤 Looks (changer la photo)',callback_data:'EDIT_LOOKS'}],
  [{text:'🗑 Tout effacer',callback_data:'IMG_CLEAR'},{text:'↩️ Annuler',callback_data:'UNDO_EDIT'},{text:'✔️ Valider',callback_data:'VALIDATE_STYLE'}],
  [{text:'↔️ Avant/Après',callback_data:'BEFORE_AFTER'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Édition',callback_data:'EDIT_HOME'}],
];}
function reactionsKb(){
  const m=(readFx().reactions||{}).mode||'off';
  const b=(k,l)=>({text:(m===k?'✅ ':'')+l,callback_data:'RE_'+k.toUpperCase()});
  return [[b('off','🔇 OFF'),b('natural','🍃 Naturel'),b('on','🔊 ON')],...navRow()];
}
function sectionKb(section){
  if(section==='subs')return subsKb();
  if(section==='zoom')return zoomKb();
  if(section==='mus')return musicKb();
  if(section==='react')return reactionsKb();
  if(section==='imgadj')return imageAdjKb();
  if(section==='imgfx')return imageFxKb();
  return imageKb();
}
function sectionCaption(section){
  const src='📸 '+workSrcLabel();
  if(section==='subs'){const s=readSubs();return `💬 <b>SOUS-TITRES</b> · ${src}\n🔤 ${fontLabel(s.font)} · ${s.size}px · y=${s.oy} · ${s.subs?'incrustés':'OFF'}`;}
  if(section==='zoom'){const z=readFx().zoom;return `🎬 <b>ZOOMS</b> · ${src}\n${z.on?'ON ×'+z.intensity+' · '+z.duration+'s · 1/'+z.everyN:'OFF'}`;}
  if(section==='mus'){const m=readFx().music;return `🎵 <b>MUSIQUE</b> · ${src}\n${m.on?(m.file||'(aucun)')+' @'+m.volume:'OFF'}`;}
  if(section==='react'){const m=(readFx().reactions||{}).mode||'off';return `🎙 <b>RÉACTIONS</b> · ${src}\nMode : <b>${m==='off'?'OFF':m==='natural'?'Naturel (1 max, douce, sur une pause)':'ON (toutes)'}</b>`;}
  if(section==='imgadj'){const i=readFx().image;return `🎛 <b>AJUSTER</b> · ${src}\n☀️${i.brightness} ◐${i.contrast} 🌈${i.saturation} 🌡${i.temperature}K`;}
  if(section==='imgfx'){const i=readFx().image;return `✨ <b>EFFETS</b> · ${src}\n🔪 Netteté ${i.sharpness} · ⬛ Vignette ${i.vignette}`;}
  const i=readFx().image;return `🎨 <b>IMAGE</b> · ${src}\n☀️${i.brightness} ◐${i.contrast} 🌈${i.saturation} 🌡${i.temperature}K 🔪${i.sharpness} ⬛${i.vignette}\nChoisis : 🎛 Ajuster · 🎨 Filtres · ✨ Effets`;
}
async function openPanel(section){
  editPanel.section=section;
  await editScreen(sectionCaption(section),sectionKb(section)); // EN PLACE (morphe la carte)
}
async function refreshPanel(){
  const section=editPanel.section||'img';
  await editScreen(sectionCaption(section),sectionKb(section)); // EN PLACE
}
// [c4-1] Rafraîchit le panneau en montrant AVANT|APRÈS automatiquement (état précédent vs nouveau), EN PLACE.
async function refreshPanelBA(){
  const section=editPanel.section||'img';
  const prev=editPrevFrame; // frame affichée AVANT ce réglage (posée par le refresh précédent)
  const after=await renderWorkingFrame(null,true); /*éditeur image : grading visible*/
  if(!after){await refreshPanel();return;}
  let media=after.frame,cap=sectionCaption(section);
  if(prev&&fs.existsSync(prev)&&prev!==after.frame){
    const comp='/tmp/bap_'+Date.now()+'.png';
    try{hstackLabeled(prev,after.frame,'AVANT','APRÈS',comp);media=comp;cap+=' · ↔️ AVANT | APRÈS (auto)';}catch(e){}
  }
  editPrevFrame=after.frame; // l'après devient l'avant du prochain réglage
  await cockpitPhoto(media,cap,sectionKb(section));editPanel.mid=cockpit.mid;
}
async function showEditHome(){
  editPanel.section='img';
  await editScreen('🎛 <b>ÉDITION</b> · '+workSrcLabel(),[
    [{text:'👤 Looks',callback_data:'EDIT_LOOKS'},{text:'💬 Sous-titres',callback_data:'EDIT_SUBS'}],
    [{text:'🎨 Image',callback_data:'EDIT_IMG'},{text:'🎨 Presets',callback_data:'SHOW_PRESETS'}],
    [{text:'🎬 Zooms',callback_data:'EDIT_ZOOM'},{text:'🎵 Musique',callback_data:'EDIT_MUS'},{text:'🎙 Réactions',callback_data:'EDIT_REACT'}],
    [{text:'💾 Sauvegarder',callback_data:'SAVESTYLE'},{text:'📂 Modèles',callback_data:'SHOWSTYLES'}],
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
  ]);
}
async function showPresets(){
  const keys=Object.keys(IMG_PRESETS);const rows=[];
  for(let k=0;k<keys.length;k+=3)rows.push(keys.slice(k,k+3).map(n=>({text:'🎨 '+n,callback_data:'IMG_PRE_'+n})));
  rows.push([{text:'🎨 Image',callback_data:'EDIT_IMG'},{text:'◀️ Édition',callback_data:'EDIT_HOME'}]);
  await cardMenu('🎨 <b>PRESETS COULEUR</b> — 1 tap :',rows); // EN PLACE
}
function imageKb(){ // accueil Image épuré : 3 sous-sections + reset
  return [
    [{text:'🎛 Ajuster',callback_data:'EDIT_IMGADJ'},{text:'🎨 Filtres',callback_data:'SHOW_PRESETS'},{text:'✨ Effets',callback_data:'EDIT_IMGFX'}],
    [{text:'🔄 Revenir à l\'image de base',callback_data:'IMG_RESET'}],
    ...navRow(),
  ];
}
function imageAdjKb(){
  const i=readFx().image;const sg=v=>(v>0?'+':'')+v;
  const td=i.temperature<6500?'chaud':i.temperature>6500?'froid':'neutre';
  return [
    [{text:'➖',callback_data:'IMG_BR_DN'},{text:'☀️ Lumière: '+sg(i.brightness),callback_data:'NOOP'},{text:'➕',callback_data:'IMG_BR_UP'}],
    [{text:'➖',callback_data:'IMG_CT_DN'},{text:'◐ Contraste: '+i.contrast,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_CT_UP'}],
    [{text:'➖',callback_data:'IMG_SA_DN'},{text:'🌈 Saturation: '+i.saturation,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_SA_UP'}],
    [{text:'🔥',callback_data:'IMG_TE_DN'},{text:'🌡 '+i.temperature+'K ('+td+')',callback_data:'NOOP'},{text:'❄️',callback_data:'IMG_TE_UP'}],
    [{text:'🔄 Base',callback_data:'IMG_RESET'},{text:'◀️ Image',callback_data:'EDIT_IMG'}],
    ...navRow(),
  ];
}
function imageFxKb(){
  const i=readFx().image;
  return [
    [{text:'➖',callback_data:'IMG_SH_DN'},{text:'🔪 Netteté: '+i.sharpness,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_SH_UP'}],
    [{text:'➖',callback_data:'IMG_VI_DN'},{text:'⬛ Vignette: '+i.vignette,callback_data:'NOOP'},{text:'➕',callback_data:'IMG_VI_UP'}],
    [{text:'✨ Glow (peau douce)',callback_data:'IMG_PRE_Glow'}],
    [{text:'🔄 Base',callback_data:'IMG_RESET'},{text:'◀️ Image',callback_data:'EDIT_IMG'}],
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
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Retour',callback_data:'EDIT_HOME'}],
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
    [{text:'👁 Aperçu',callback_data:'EDIT_PREVIEW'},{text:'🎯 vs Réf',callback_data:'CMP_REF'},{text:'◀️ Retour',callback_data:'EDIT_HOME'}],
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
    if(gwLook())setWorkPhoto(gwLook()); // [p1] /preview reflète l'ÉTAT COURANT (look choisi/édité, pas un vieux raw)
    const src=workSrc(); // look de travail courant ; raw seulement si aucun look
    if(!src){await toast('⚠️ Choisis un look 👤');return;}
    const f=await renderWorkingFrame(src);
    if(!f){await toast('❌ Aperçu indispo');return;}
    const st=f.style, fx=readFx();
    const img=fx.image, colored=(img.brightness||img.contrast!==1||img.saturation!==1||img.temperature!==6500||img.sharpness||img.vignette)?'oui':'neutre';
    const cap=`👁 <b>APERÇU</b> — 🔤 ${fontLabel(st.font)} ${st.fontSize}px · 🎬 zoom ${fx.zoom.on?'ON':'OFF'} · 🎨 ${colored} · 🎵 ${fx.music.on?'on':'OFF'}`;
    if(cockpit.mid)await cockpitPhoto(f.frame,cap,[[{text:'🎨 Éditer',callback_data:'EDIT_HOME'},{text:'🧪 Test',callback_data:'MENU_TEST'}],[{text:'▶️ GO',callback_data:'MENU_GEN'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);
    else {await sendImg(f.frame,cap).catch(()=>{});}
  }catch(e){await toast('❌ '+e.message);}
}

// ── Update handler ────────────────────────────────────────────────────────────
// ── Séparation MOTEUR / UI / ÉTAT-UTILISATEUR (préparation multi-utilisateur, vente) ──
// MOTEUR : workflow.js + render_local.js (sans état). UI : fonctions show*/card*/cockpit*.
// ÉTAT par chat_id : ci-dessous. Dormant tant qu'un seul chat est autorisé (no-op), prêt pour le multi-user.
const SESSION_VARS=['gw','genJob','cockpit','sessionTopics','workingSource','state','editPrevFrame','editSectionCur','galMid','lookStylePending','modifyFlow','genAbort','genStep','gal'];
const sessions={};let activeChat=CHAT_ID;
function _ssave(id){const s=sessions[id]||(sessions[id]={});for(const k of SESSION_VARS){try{s[k]=eval(k);}catch(e){}}}
function _sload(id){const s=sessions[id];if(!s)return;for(const k of SESSION_VARS){try{if(k in s)eval(k+'=s[k]');}catch(e){}}}
function switchChat(id){ if(id===activeChat)return; _ssave(activeChat); activeChat=id; if(sessions[id])_sload(id); else { gwReset(); state='idle'; } }
async function handle(upd){
  // Callback
  if(upd.callback_query){
    const cb=upd.callback_query;
    if(String(cb.message.chat.id)!==CHAT_ID){await answerCB(cb.id);return;}
    switchChat(String(cb.message.chat.id)); // no-op en mono-chat ; bascule l'état si multi-user activé
    const d=cb.data;
    jlog('ETOILE→ [bouton] '+d);lastCbId=cb.id;
    /*RÈGLE INTER-BLOCS (Etoile 08/06) : un tap depuis le bloc RÉSULTATS qui vise le bloc PHOTO ou VIDÉO fait REDESCENDRE ce bloc en bas — sinon l'action se joue hors écran et semble morte*/
    try{
      if(cb.message&&results&&cb.message.message_id===results.mid){
        if(d==='NL_CONFIG'||d==='NL_RETRY'||d==='NL_OTHER'){await delMsg(newlook.mediaId);newlook.mediaId=null;}
        else if(['MAIN_MENU','RC_LOOK','RC_SUBJ','CARD_DUR','GJ_SHOWSCRIPT','EDIT_HOME','RES_EDIT','RES_GEN'].includes(d)){await delMsg(cockpit.mid);cockpitReset();lastCardSig='';}
      }
    }catch(e){}
    /*fix toasts : on n'« avale » plus le tap d'office — les handlers ont 2.5s pour répondre par un toast, sinon accusé vide (sinon AUCUN toast ne s'affichait jamais : un tap = une seule réponse possible)*/
    cbAnswered=false;{const _id=cb.id;setTimeout(()=>{if(!cbAnswered&&lastCbId===_id)answerCB(_id).catch(()=>{});},2500);}
    uiLog({dir:'in',type:'callback',screen:'',user_action:d,caption_len:0,buttons:[],edited_in_place:false});
    // Menu principal
    if(d==='MAIN_MENU'){await showHome();return;} /*[C1] retour = MENU UNIFIÉ (home)*/
    if(d==='HOME_CREER'){await openCard();return;} /*[C1] Créer -> carte génération (C3 ajoutera le choix de mode)*/
    if(d==='HOME_STUDIO'){await showStudio();return;} /*[C2] Studio -> sous-menu épuré*/
    if(d==='STUDIO_DECORS'){const lb=nlMod().readLookbook();const lignes=Object.keys(lb.envs||{}).map(k=>'• '+lb.envs[k].label).join('\n');await cardMenu('🏛 <b>DÉCORS disponibles</b>\n'+lignes+'\n\n<i>(choix du décor à la génération via /newlook)</i>',[[{text:'◀️ Retour',callback_data:'HOME_STUDIO'}]]);return;}
    if(d==='STUDIO_HIST'){ /*[C2] historique = dernières générations (réutilise la logique /gens, message unique)*/
      try{const real=fs.realpathSync(path.join(BASE,'outputs','generations'));const files=fs.readdirSync(real).filter(f=>/\.jpg$/i.test(f)).map(f=>({f,t:fs.statSync(path.join(real,f)).mtimeMs})).sort((a,b)=>b.t-a.t).slice(0,12);
        const lignes=files.length?files.map((x,i)=>(i+1)+'. '+x.f.replace(/\.jpg$/,'')).join('\n'):'(vide)';
        await cardMenu('🕘 <b>HISTORIQUE</b> · '+files.length+' récentes\n'+lignes+'\n\n📱 Fichiers → iCloud → podcast-outputs/generations',[[{text:'◀️ Retour',callback_data:'HOME_STUDIO'}]]);
      }catch(e){await cardMenu('🕘 Historique vide.',[[{text:'◀️ Retour',callback_data:'HOME_STUDIO'}]]);}
      return;}
    if(d==='HOME_PROFIL'){await cardMenu('👤 <b>PROFIL</b>\n\nActif : <b>Imany</b>\n(un seul profil pour l\'instant — extensible via personas.json)',[[{text:'✅ Imany (actif)',callback_data:'NOOP'}],[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}
    if(d==='MENU_GEN'){
      await delMsg(mainMenuMid);mainMenuMid=null; // l'écran Générer REMPLACE le menu (pas d'empilement)
      if(hasActiveEdits()){await send('🎬 Tu as des réglages d\'image actifs. Pour cette nouvelle vidéo :',[[{text:'✅ Garder les réglages',callback_data:'GEN_KEEP'}],[{text:'🔄 Repartir de la base',callback_data:'GEN_RESET'}]]);return;}
      gwReset();await send('🎬 Préparation de la carte (sujet auto)...').catch(()=>{});await ensureTopic();await showRecap();return;
    }
    if(d==='GEN_KEEP'){gwReset();await ensureTopic();await showRecap();return;}
    if(d==='GEN_RESET'){const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Signature']);writeFx(fx);gwReset();await ensureTopic();await showRecap();return;}
    if(d==='RC_NEWTOPIC'){if(gw.topic&&!sessionTopics.includes(gw.topic))sessionTopics.push(gw.topic);gw.topic=null;await send('🔄 Nouveau sujet...').catch(()=>{});await ensureTopic();await refreshRecap();return;}
    if(d==='TEST_GEN'){gwReset();const w=workSrc();if(w&&/\.(jpg|jpeg|png|webp)$/i.test(w))gw.look=w;await send('🚀 Carte de génération (paramètres du test)...').catch(()=>{});await ensureTopic();await showRecap();return;}
    if(d==='EXPRESS_NEW'){await recapGo();return;} /*V2 Express : derniers réglages + sujet auto -> script (carte morphée)*/
    // ── Carte récap : lignes modifiables ──
    if(d==='RC_CANCEL'){state='idle';await openCard();return;}
    if(d==='RC_LOOK'){
      // défile l'avatar DANS LA CARTE elle-même (galMid = la carte), démarre sur le look courant
      galForRecap=true;galMid=cockpit.mid;
      const cur=gwLook();const li=cur?looksList().indexOf(path.basename(cur)):-1;gal.idx=li>=0?li:0;
      gal.page=Math.floor((gal.idx||0)/GAL_PAGE); /*[chantier4] planche sur la page de l'avatar courant*/
      await showGallery();return;
    }
    if(d.startsWith('RC_LL_')){const ll=(genState.lastLooks||[]).filter(p=>fs.existsSync(p));const p=ll[+d.slice(6)];if(p){gw.look=p;setWorkPhoto(p);}await refreshRecap();return;}
    if(d==='RC_GALLERY'){galForRecap=true;galMid=null;gal.idx=0;await showLook();return;}
    if(d==='RC_BACK'){await showRecap();return;}
    if(d==='RC_STYLE'){ // sous-menu EN PLACE
      const rows=listStyles().map((f,i)=>[{text:'📦 '+f.replace(/\.json$/,''),callback_data:'RC_ST_'+i}]);
      rows.unshift([{text:'🎨 Modèle actuel',callback_data:'RC_ST_CUR'}]);
      rows.push([{text:'◀️ Retour',callback_data:'RC_BACK'}]);
      await cardMenu('🎨 <b>MODÈLE</b> :',rows);return;
    }
    if(d==='RC_ST_CUR'){gw.styleName=null;await showRecap();return;}
    if(d.startsWith('RC_ST_')){const list=listStyles();const f=list[+d.slice(6)];if(f){try{applySnapshot(JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8')));gw.styleName=f.replace(/\.json$/,'');}catch(e){}}await showRecap();return;}
    if(d==='RC_SUBJ'){ // sous-menu EN PLACE
      const rows=Object.keys(MCATS).map(k=>[{text:MCATS[k],callback_data:'RC_CAT_'+k}]);
      rows.unshift([{text:'🎲 Auto',callback_data:'RC_SUBJ_AUTO'},{text:'⌨️ Le mien',callback_data:'RC_SUBJ_MINE'},{text:'🔄 Autre',callback_data:'RC_NEWTOPIC'}]);
      rows.push([{text:'◀️ Retour',callback_data:'RC_BACK'}]);
      await cardMenu('💬 <b>SUJET</b> :',rows);return;
    }
    if(d==='CARD_DUR'){await cardMenu('⏱ <b>DURÉE</b> :',[[{text:'15s',callback_data:'RC_DUR_15'},{text:'23s',callback_data:'RC_DUR_23'},{text:'30s',callback_data:'RC_DUR_30'},{text:'⌨️',callback_data:'RC_DUR_FREE'}],[{text:'◀️ Retour',callback_data:'RC_BACK'}]]);return;}
    if(d==='CARD_MORE'){await cardMenu('☰ <b>PLUS</b> :',[
      [{text:'👤 Looks',callback_data:'MENU_LOOKS'},{text:'📦 Modèles',callback_data:'SHOWSTYLES'}],
      [{text:'📤 Prêt à poster',callback_data:'SHOWREADY'},{text:'📁 Fichiers',callback_data:'FILES_HOME'}],
      [{text:'🧪 Test',callback_data:'MENU_TEST'},{text:'👁 Preview',callback_data:'EDIT_PREVIEW'},{text:'🎨 Éditer',callback_data:'EDIT_HOME'}],
      [{text:'👥 Persona : '+activePersona().name,callback_data:'PERSONA'},{text:'⚙️ Technique',callback_data:'MENU_TECH'},{text:'❓ Aide',callback_data:'MENU_HELP'}],
      [{text:'◀️ Retour',callback_data:'RC_BACK'}],
    ]);return;}
    if(d==='PERSONA'){const p=loadPersonas();const rows=Object.keys(p.profiles).map(k=>[{text:(k===p.active?'✅ ':'')+p.profiles[k].name,callback_data:'PERSONA_'+k}]);rows.push([{text:'◀️ Plus',callback_data:'CARD_MORE'}]);await cardMenu('👥 <b>PERSONA</b> (influenceur) — 1 carte/dossiers chacun :',rows);return;}
    if(d.startsWith('PERSONA_')){const k=d.slice(8);if(setActivePersona(k)){await toast('👥 Persona : '+activePersona().name);}else await toast('⚠️ Profil inconnu');await showRecap();return;}
    if(d.startsWith('RC_CAT_')){const k=d.slice(7);gw.subjectMode='auto';gw.topicCat=k;gw.topic=null;genState.topicCat=k;saveState();await ensureTopic();await refreshRecap();return;}
    if(d==='RC_SUBJ_AUTO'){gw.subjectMode='auto';gw.topicCat=null;gw.topic=null;genState.topicCat=null;saveState();await ensureTopic();await refreshRecap();return;}
    if(d==='RC_SUBJ_MINE'){state='rc_topic_wait';await send('⌨️ Tape ton sujet (ex: « pourquoi il revient quand tu l\'ignores ») :');return;}
    if(d==='RC_DUR_15'){gw.duration='15s';genState.duration='15s';saveState();await refreshRecap();return;}
    if(d==='RC_DUR_23'){gw.duration='23s';genState.duration='23s';saveState();await refreshRecap();return;}
    if(d==='RC_DUR_30'){gw.duration='30s';genState.duration='30s';saveState();await refreshRecap();return;}
    if(d==='RC_DUR_FREE'){state='rc_dur_wait';await send('⌨️ Durée en secondes (5–180). Au-delà de ~30s = plusieurs parties assemblées.');return;}
    if(d==='RC_GO'){await recapGo();return;}
    // ── Étape script / maquette / GO ──
    if(d==='GJ_OK'){if(genJob)await genAfterScript();else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_NEW'){if(genJob){if(genJob.topic&&!sessionTopics.includes(genJob.topic))sessionTopics.push(genJob.topic);if(genJob.subjectMode!=='mine')genJob.topic=null;await genScriptStep();}else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_FULL'){if(genJob&&genJob.script)await send('📄 <b>Script complet</b> :\n\n'+escHtml(genJob.script));else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_MODIFY'){
      const kb=[[{text:'✏️ Texte',callback_data:'GJ_EDIT'},{text:'🎨 Modèle',callback_data:'GJM_STYLE'}],[{text:'👤 Look',callback_data:'GJM_LOOK'},{text:'⏱ Durée',callback_data:'GJM_DUR'}],[{text:'◀️ Retour',callback_data:'GJ_SHOWSCRIPT'}]];
      if(!await cockpitCaption('✏️ <b>MODIFIER</b> — quoi ?',kb))await send('✏️ <b>MODIFIER</b> — quoi ?',kb);return;
    }
    if(d==='GJM_STYLE'){const list=listStyles();const rows=list.map((f,i)=>[{text:'📦 '+f.replace(/\.json$/,''),callback_data:'GJM_ST_'+i}]);rows.unshift([{text:'🎨 Garder l\'actuel',callback_data:'GJ_SHOWSCRIPT'}]);await send('🎨 <b>MODÈLE</b> :',rows);return;}
    if(d.startsWith('GJM_ST_')){const list=listStyles();const f=list[+d.slice(7)];if(f){try{applySnapshot(JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8')));if(genJob)genJob.styleName=f.replace(/\.json$/,'');await send('🎨 Modèle appliqué.').catch(()=>{});}catch(e){}}await genAfterScript();return;}
    if(d==='GJM_LOOK'){modifyFlow=true;galForRecap=true;galMid=null;gal.idx=0;await showLook();return;}
    if(d==='GJM_DUR'){state='gjm_dur_wait';await send('⏱ Durée en secondes (5–180) :');return;}
    if(d==='GJ_HOOKS'){await genHooks();return;}
    if(d==='GJ_HOOK_0'||d==='GJ_HOOK_1'){if(genJob&&genJob.hooks){applyHook(genJob.hooks[+d.slice(-1)]);await send('🎣 Hook appliqué.').catch(()=>{});await showScriptCard();}else await send('⚠️ Aucun hook.');return;}
    if(d==='GJ_SHOWSCRIPT'){if(genJob)await showScriptCard();else await send('⚠️ Aucun script.');return;}
    if(d==='GJ_CAT'){if(!genJob){await toast('⚠️ Aucun script');return;}const rows=Object.keys(MCATS).map(k=>[{text:MCATS[k],callback_data:'GJ_CATSET_'+k}]);rows.push([{text:'◀️ Retour au script',callback_data:'GJ_SHOWSCRIPT'}]);await cardMenu('📂 <b>CATÉGORIE</b> du script — régénère dans ce thème :',rows);return;}
    if(d.startsWith('GJ_CATSET_')){if(!genJob){await send('⚠️ Aucun script.');return;}const k=d.slice(10);genJob.topicCat=k;genJob.subjectMode='auto';if(genJob.topic&&!sessionTopics.includes(genJob.topic))sessionTopics.push(genJob.topic);genJob.topic=null;genState.topicCat=k;saveState();await send('📂 '+MCATS[k]+' — nouveau script...').catch(()=>{});await genScriptStep();return;}
    if(d==='GJ_EDIT'){if(!genJob){await send('⚠️ Aucun script.');return;}state='gj_edit_wait';await send('✏️ Renvoie-moi le texte complet du script (il remplacera l\'actuel) :');return;}
    if(d==='GJ_MOCK'){await genMockup();return;}
    if(d==='GJ_GO'){await genFinal();return;}
    if(d==='GJ_CANCEL'||d==='GEN_ABORT'){if(genJob&&genJob.running){genAbort=true;await send('⛔ Annulation en cours… (arrêt à la prochaine étape)');}else{genJob=null;state='idle';await showRecap();}return;}
    // ── Dossier de génération : Postable / À retravailler / Restyler ──
    if(d.startsWith('GF_POST_')){const gf=genFolders[+d.slice(8)];if(!gf){await send('⚠️ Entrée introuvable.');return;}const dst=path.join(BASE,'outputs','ready_to_post',path.basename(gf.dir));try{copyDirFlat(gf.dir,dst);await send('✅ <b>Postable</b> : dossier complet (RAW INCLUS) copié dans\n<code>outputs/ready_to_post/'+path.basename(gf.dir)+'/</code>\n📱 Visible dans Fichiers iCloud.');}catch(e){await send('❌ '+e.message);}return;}
    if(d.startsWith('GF_REWORK_')){const gf=genFolders[+d.slice(10)];if(!gf){await send('⚠️ Entrée introuvable.');return;}const dst=path.join(BASE,'outputs','a_retravailler',path.basename(gf.dir));try{copyDirFlat(gf.dir,dst);await send('🔧 <b>À retravailler</b> : copié dans\n<code>outputs/a_retravailler/'+path.basename(gf.dir)+'/</code>');}catch(e){await send('❌ '+e.message);}return;}
    if(d.startsWith('GF_FILES_')){const gf=genFolders[+d.slice(9)];if(!gf){await send('⚠️ Entrée introuvable.');return;}try{const files=fs.readdirSync(gf.dir).filter(f=>/\.(mp4|txt|jpg|jpeg|png)$/i.test(f));/*[c4-5] 1 seul message : liste + chemin iCloud (au lieu d'empiler N fichiers)*/const lignes=files.map(f=>'• '+f).join('\n');await send('📁 <b>Dossier de cette génération</b> ('+files.length+' fichiers)\n'+lignes+'\n\n📱 Ouvre-les dans l\'app <b>Fichiers</b> → iCloud Drive → <b>podcast-outputs/generations/'+path.basename(gf.dir)+'</b>');}catch(e){await send('❌ '+e.message);}return;}
    if(d.startsWith('GF_ADDPART_')){
      const gf=genFolders[+d.slice(11)];if(!gf||!gf.imageUrl||!gf.prevScripts){await send('⚠️ Contexte indisponible (relance une génération).');return;}
      if(genJob&&genJob.running){await send('⏳ Une génération est déjà en cours.');return;}
      const i=gf.prevScripts.length+1;const prog=await send('➕ <b>Partie '+i+'</b> · script…');const pm=prog&&prog.result&&prog.result.message_id;
      const sp=async t=>{try{if(pm)await tg('editMessageText',{message_id:pm,text:t,parse_mode:'HTML'});}catch(e){}};
      try{
        freshRL();const c=await WF.generateScript(WF.partPrompt(gf.topic,i,i,gf.prevScripts),gf.words);
        ttsCheck('addpart',c.script);await sp('➕ Partie '+i+' · voix + lipsync… (~3-5 min)');
        const audio=await WF.generateAudio(_sanTTS(c.script),i);
        const lip=await WF.generateLipsync(gf.imageUrl,audio.audioUrl,i);
        const rawi=await WF.saveLipsyncRaw(lip,i,gf.ts,path.join(BASE,'outputs'));
        await sp('➕ Partie '+i+' · rendu…');
        const vid=await WF.renderVideo(lip,audio.wordTimings,c.keywords,audio.duration,i,c.reactions,rawi);
        const p=await WF.saveOpen(vid,c,gf.ts,i,path.join(BASE,'outputs'));
        const newFinal=path.join(BASE,'outputs',gf.ts+'_FINAL.mp4');WF.concatClips([gf.finalP,p].filter(Boolean),newFinal);
        gf.finalP=newFinal;gf.prevScripts.push(c.script);gf.partN=i;
        try{fs.copyFileSync(newFinal,path.join(gf.dir,'final.mp4'));fs.copyFileSync(rawi,path.join(gf.dir,'raw_p'+i+'.mp4'));}catch(e){}
        await delMsg(pm);
        const idx=+d.slice(11);gf.vidMid=await sendVideoKb(newFinal,buildVideoCaption(newFinal),videoReadyKb(idx));
      }catch(e){await sp('⛔ Partie '+i+' a planté : '+e.message);}
      return;
    }
    if(d.startsWith('GF_BACK_')){const ix=+d.slice(8);const gf=genFolders[ix];if(gf&&gf.vidMid){try{await tg('editMessageCaption',{message_id:gf.vidMid,caption:buildVideoCaption(gf.finalP),parse_mode:'HTML',reply_markup:{inline_keyboard:videoReadyKb(ix)}});}catch(e){}}return;}
    if(d.startsWith('GF_LONG_')){const ix=+d.slice(8);const gf=genFolders[ix];if(!gf){await send('⚠️ Introuvable.');return;}const c=parseCaps(readCapTxt(gf.finalP));const lg='<code>'+escH(c.long||c.short||'(vide)')+'</code>'+(c.tags?'\n\n<code>'+escH(c.tags)+'</code>':'');const kb=[[{text:'↩️ Légende courte',callback_data:'GF_SHORT_'+ix}],[{text:'◀️ Retour',callback_data:'GF_BACK_'+ix}]];if(gf.vidMid){try{await tg('editMessageCaption',{message_id:gf.vidMid,caption:lg.slice(0,1020),parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});return;}catch(e){}}await send(lg,kb);return;}
    if(d.startsWith('GF_SHORT_')){const ix=+d.slice(9);const gf=genFolders[ix];if(!gf){await send('⚠️ Introuvable.');return;}if(gf.vidMid){try{await tg('editMessageCaption',{message_id:gf.vidMid,caption:(gf.caption||buildVideoCaption(gf.finalP)).slice(0,1020),parse_mode:'HTML',reply_markup:{inline_keyboard:videoReadyKb(ix)}});return;}catch(e){}}return;}
    if(d==='LCAP_LEGACY'){if(setup.lastVideo){const c=parseCaps(readCapTxt(setup.lastVideo));await send('📋 <b>Légende longue</b>\n\n<code>'+escH(c.long||c.short||'(vide)')+'</code>'+(c.tags?'\n\n<code>'+escH(c.tags)+'</code>':''));}else await send('⚠️ Aucune vidéo récente.');return;}
    if(d.startsWith('COVER_OPEN_')){covState={gfIdx:+d.slice(11),idx:0,mid:null};await showCover();return;}
    if(d==='COVER_PREV'){covState.idx--;await showCover();return;}
    if(d==='COVER_NEXT'){covState.idx++;await showCover();return;}
    if(d==='COVER_PICK'){const gf=genFolders[covState.gfIdx];if(gf&&gf.covers&&gf.covers[covState.idx]){try{fs.copyFileSync(gf.covers[covState.idx],path.join(gf.dir,'thumbnail.jpg'));require('child_process').execSync('command -v fileicon >/dev/null 2>&1 && fileicon set "'+gf.dir+'" "'+path.join(gf.dir,'thumbnail.jpg')+'" 2>/dev/null||true',{stdio:'ignore'});await send('✅ Cover '+(covState.idx+1)+' = miniature du dossier <code>'+path.basename(gf.dir)+'</code>.');}catch(e){await send('❌ '+e.message);}}else await send('⚠️ Cover indispo.');return;}
    if(d==='GJ_SAVESCRIPT'){if(genJob&&genJob.script){try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));lib.scripts.push({id:Date.now().toString(),title:genJob.topic||'script',date:new Date().toISOString().slice(0,10),script:genJob.script,performance:null});fs.writeFileSync(LIBRARY,JSON.stringify(lib,null,2));await send('💾 Script gardé dans la bibliothèque (/library).');}catch(e){await send('❌ '+e.message);}}else await send('⚠️ Aucun script.');return;}
    if(d.startsWith('GF_RESTYLE_')){
      const ix=+d.slice(11);const gf=genFolders[ix];if(!gf){await send('⚠️ Entrée introuvable.');return;}
      await send('🎨 Re-rendu LOCAL gratuit avec le style courant (réutilise raw + audio, aucun Kling)... ~2-4s');
      try{
        const fp=await restyleFolder(gf.dir);
        try{const m=JSON.parse(fs.readFileSync(path.join(gf.dir,'meta.json'),'utf8'));if(m.parts&&m.parts[0])setWorkPhoto(path.join(gf.dir,m.parts[0].raw));}catch(e){}
        await sendVid(fp).catch(async()=>{await send('⚠️ Vidéo trop lourde — voir /files.');});
        await send('✅ Re-stylée (gratuit) !',[
          [{text:'✅ Postable',callback_data:'GF_POST_'+ix},{text:'🔧 À retravailler',callback_data:'GF_REWORK_'+ix}],
          [{text:'🎨 Éditer encore',callback_data:'EDIT_HOME'},{text:'🎨 Restyler à nouveau',callback_data:'GF_RESTYLE_'+ix}],
        ]);
      }catch(e){await send('❌ Restyle : '+e.message);}
      return;
    }
    if(d==='MENU_LOOKS'){galMid=null;gal.idx=0;gal.page=0;galFrom='card';await showGallery();return;}
    if(d==='FILES_HOME'){await showFilesMenu();return;}
    if(d.startsWith('FCAT_')){await showFileList(d.slice(5),0);return;}
    if(d.startsWith('FPAGE_')){const m=d.slice(6).match(/^(\w+)_(\d+)$/);if(m)await showFileList(m[1],+m[2]);return;}
    if(d.startsWith('FGET_')){const it=fileList[+d.slice(5)];await sendFile(it&&it.path);return;}
    if(d==='MENU_TEST'){await runLocalTest();return;}
    if(d==='MENU_HELP'){await cardMenu(HELP_TXT,[[{text:'◀️ Plus',callback_data:'CARD_MORE'}]]);return;}
    if(d==='MENU_TECH'){await cardMenu('⚙️ <b>Réglages techniques</b>',[
      [{text:'ℹ️ Statut',callback_data:'TECH_STATUS'}],
      [{text:'🔄 Redémarrer le bot',callback_data:'TECH_RESTART'}],
      [{text:'⏹ Tout arrêter',callback_data:'TECH_STOP'}],
      [{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
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
      if(genJob&&genJob.running){genAbort=true;stopped=true;}
      if(proc){try{proc.kill('SIGKILL');}catch(e){}proc=null;stopped=true;}
      if(testProc){try{testProc.kill('SIGKILL');}catch(e){}testProc=null;stopped=true;} if(!(genJob&&genJob.running))genJob=null;
      try{require('child_process').execSync('pkill -9 -f "node.*workflow.js" 2>/dev/null');stopped=true;}catch(e){}
      state='idle';await send(stopped?'⏹ Stoppé.':'Rien en cours.');return;
    }
    // [chantier2] FLUX UNIFIÉ : toutes les entrées de génération legacy (wizard anglais T_/L_/D_,
    // GO/SCRIPT_OK/AUTO_ALL/EXPRESS_GO) redirigent vers LA CARTE (openCard) — anti-bypass, zéro anglais.
    if(d==='T_AUTO'||/^T_\d+$/.test(d)||d==='L_KEEP'||d==='L_RANDOM'||d==='L_UPLOAD'||d==='D_25'||d==='D_40'||d==='D_65'||d==='GO'||d==='SCRIPT_OK'||d==='AUTO_ALL'||d==='EXPRESS_GO'){await openCard();return;}
        if(d==='SAVE_VID'){/*botfixes v1*/ if(setup.lastVideo&&fs.existsSync(setup.lastVideo)){try{const FormData=require('form-data');const fdv=new FormData();fdv.append('chat_id',CHAT_ID);fdv.append('document',fs.createReadStream(setup.lastVideo));fdv.append('caption','🎬 Fichier video');await tg('sendDocument',null,fdv).catch(()=>{});}catch(e){}}else{await send('Fichier introuvable.').catch(()=>{});}return;}
    if(d==='MANUAL_GO'){await openCard();return;} /*[chantier2] legacy -> carte*/
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
    if(d==='MM_START'){await openCard();return;} /*[chantier2] legacy gen -> carte (anti-bypass)*/
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
    if(d==='NEW_GO'){if(proc){try{proc.kill();}catch(e){}proc=null;}state='idle';await openCard();return;} /*3 blocs : Nouvelle vidéo = LA CARTE (l'ancien chooser Sur-mesure/Aléatoire empilait et contournait récap+maquette)*/
    if(d==='CHG_TOPIC'){await openCard();return;} /*[chantier2] legacy -> carte*/
    if(d==='CHG_LOOK'){galForRecap=false;galMid=null;gal.idx=0;gal.page=0;await showGallery();return;}
    if(d==='CANCEL'){state='idle';await send('❌ Cancelled.',[[{text:'🔄 Nouvelle vidéo',callback_data:'NEW_GO'}]]);return;}
    // Workflow answers
    if(d.startsWith('A_')&&proc){
      const ans=d.replace('A_','');
      wfInput(ans);state='running';
      //hidden:       if(!autoAnswers.length)await send('Sent: '+ans);return;
    }
    // Galerie de looks
    if(d.startsWith('GPICK_')){gal.idx=+d.slice(6);await showLook();return;} /*[chantier4] planche -> look en grand*/
    if(d==='GGRID'){gal.page=Math.floor((gal.idx||0)/GAL_PAGE);await showGallery();return;} /*[chantier4] retour planche (sur la page du look courant)*/
    if(d==='GLP_PREV'){await toast('⏳');gal.page--;await showGallery();return;}
    if(d==='GLP_NEXT'){await toast('⏳');gal.page++;await showGallery();return;}
    if(d==='GAL_PREV'){await toast('⏳');gal.idx--;await showLook();return;}
    if(d==='GAL_NEXT'){await toast('⏳');gal.idx++;await showLook();return;}
    if(d==='GAL_AVATAR'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Look introuvable.');return;}
      const fp=path.join(getLooksDir(),f);setAvatar(fp);setup.photo=fp;setWorkPhoto(fp);
      if(await maybeAskLookStyle(fp,'avatar'))return; // réglages mémorisés pour ce look ?
      await send('✅ Look <b>'+f+'</b> = avatar + photo de travail.',[
        [{text:'🎨 Édition',callback_data:'EDIT_HOME'}],
        [{text:'🎬 Générer avec',callback_data:'GAL_GEN'},{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
      ]);return;
    }
    if(d==='GAL_GEN'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await send('⚠️ Look introuvable.');return;}
      gwReset();gw.look=path.join(getLooksDir(),f);
      if(await maybeAskLookStyle(gw.look,'recap'))return; // réglages mémorisés pour ce look ?
      await ensureTopic();await showRecap();return;
    }
    if(d==='GAL_PICK'){
      const list=looksList();const f=list[gal.idx];
      if(f){gw.look=path.join(getLooksDir(),f);setWorkPhoto(gw.look);if(genJob)genJob.look=gw.look;}
      galForRecap=false;if(galMid)cockpit.mid=galMid; // la galerie ÉTAIT la carte -> on resynchronise
      if(modifyFlow){modifyFlow=false;cockpitReset();await genAfterScript();return;}
      if(f&&await maybeAskLookStyle(gw.look,'recap'))return; // réglages mémorisés pour ce look ?
      await showRecap();return;
    }
    if(d==='GAL_EDIT'){
      const list=looksList();const f=list[gal.idx];
      if(!f){await toast('⚠️ Look introuvable');return;}
      setWorkPhoto(path.join(getLooksDir(),f)); /*passe par setWorkPhoto = reset des filtres hérités (règle Etoile)*/
      await toast('🎨 '+f+' = photo de travail');
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
    if(d.startsWith('POSTSEND_')){
      const x=readyList[+d.slice(9)];if(!x){await send('⚠️ Rouvre 📤.');return;}
      // tap = reçois la vidéo + légende+hashtags copiables, prête à forward/poster
      await sendVideoKb(x.mp4,buildVideoCaption(x.mp4),[[{text:'📋 Légende longue',callback_data:'POSTLONG_'+(+d.slice(9))}]]).catch(async()=>{await send('⚠️ Vidéo trop lourde — voir Fichiers iCloud.');});
      return;
    }
    if(d.startsWith('POSTLONG_')){const x=readyList[+d.slice(9)];if(!x){await send('⚠️ Rouvre 📤.');return;}const c=parseCaps(readCapTxt(x.mp4));await send('📋 <b>Légende longue</b>\n\n<code>'+escH(c.long||c.short||'(vide)')+'</code>'+(c.tags?'\n\n<code>'+escH(c.tags)+'</code>':''));return;}
    if(d.startsWith('REUSE_')){
      const x=readyList[+d.slice(6)];
      if(!x){await send('⚠️ Entrée introuvable (rouvre 📤).');return;}
      // cherche un style.json (plat: <base>.style.json ; dossier: style.json)
      let sj=x.mp4.replace(/\.mp4$/,'.style.json');if(!fs.existsSync(sj))sj=path.join(path.dirname(x.mp4),'style.json');
      if(!fs.existsSync(sj)){await send('⚠️ Pas de snapshot de style pour cette vidéo.');return;}
      try{editPrevFrame=null;applySnapshot(JSON.parse(fs.readFileSync(sj,'utf8')));await send('✅ Style repris depuis <b>'+escH(x.label)+'</b>.');await sendBeforeAfter();}catch(e){await send('❌ '+e.message);}
      return;
    }
    // Styles sauvegardés
    if(d==='SAVESTYLE'){const n=saveStyleAuto();await toast('💾 Modèle sauvegardé : '+n);await refreshPanel();return;}
    if(d==='SHOWSTYLES'){await showStyles();return;}
    if(d.startsWith('LOADSTYLE_')){
      const i=+d.slice(10);const f=styleList[i];
      if(!f){await toast('⚠️ Rouvre 📦 Modèles');return;}
      try{const snap=JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8'));editPrevFrame=null;applySnapshot(snap);await toast('✅ Modèle chargé : '+f.replace(/\.json$/,''));editPanel.section='img';await refreshPanel();}catch(e){await toast('❌ '+e.message);}
      return;
    }
    if(d.startsWith('LOADGEN_')){
      const i=+d.slice(8);const f=styleList[i];
      if(!f){await send('⚠️ Style introuvable (rouvre 📂 Modèles).');return;}
      try{applySnapshot(JSON.parse(fs.readFileSync(path.join(stylesDir(),f),'utf8')));gwReset();gw.styleName=f.replace(/\.json$/,'');await ensureTopic();await showRecap();}catch(e){await send('❌ '+e.message);}
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
    if(d==='EDIT_REACT'){editSectionCur='react';await openPanel('react');return;}
    if(d==='SHOW_PRESETS'){editSectionCur='img';editPanel.section='img';await showPresets();return;}
    if(d==='EDIT_IMGADJ'){editSectionCur='img';await openPanel('imgadj');return;}
    if(d==='EDIT_IMGFX'){editSectionCur='img';await openPanel('imgfx');return;}
    if(d==='IMG_RESET'){pushHistory();const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Signature']);writeFx(fx);await toast('🔄 Image revenue à la base');await refreshPanelBA();return;}
    if(d==='IMG_CLEAR'){pushHistory();const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Naturel']);writeFx(fx);await toast('🗑 Tout effacé — image brute (aucun filtre)');await refreshPanelBA();return;} /*[3] reset STRICT vers l'original (ΔRGB=0)*/
    if(d.startsWith('RE_')){pushHistory();const fx=readFx();fx.reactions=fx.reactions||{mode:'off'};if(d==='RE_OFF')fx.reactions.mode='off';if(d==='RE_NATURAL')fx.reactions.mode='natural';if(d==='RE_ON')fx.reactions.mode='on';writeFx(fx);await refreshPanel();return;}
    if(d==='EDIT_LOOKS'){galMid=null;gal.idx=0;gal.page=0;galFrom='edit';await showGallery();return;}
    if(d==='EDIT_PREVIEW'||d==='S_PREVIEW'){await runPreview();return;}
    if(d==='CMP_REF'){await sendVsReference();return;}
    if(d==='BEFORE_AFTER'){await sendBeforeAfter();return;}
    if(d==='NOOP')return;
    if(d==='UNDO_EDIT'){if(!undoEdit()){await toast('↩️ Rien à annuler');return;}await toast('↩️ Annulé');await refreshSection();return;}
    if(d==='VALIDATE_STYLE'){clearHistory();const w=workSrc();if(w&&/\.(jpg|jpeg|png|webp)$/i.test(w)){saveLookStyle(path.basename(w),readFx().image);await toast('✔️ Réglages mémorisés pour ce look');}else await toast('✔️ Réglages validés');await refreshPanel();return;}
    if(d==='LS_REUSE'){if(lookStylePending){const fx=readFx();fx.image=Object.assign({},lookStylePending.fx);writeFx(fx);const r=lookStylePending.ret;lookStylePending=null;await send('✅ Réglages du look réappliqués.').catch(()=>{});await routeAfterLook(r);}return;}
    if(d==='LS_BASE'){const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Signature']);writeFx(fx);const r=lookStylePending?lookStylePending.ret:'recap';lookStylePending=null;await send('🔄 Réglages remis à la base.').catch(()=>{});await routeAfterLook(r);return;}
    if(d==='LS_KEEP'){const r=lookStylePending?lookStylePending.ret:'recap';lookStylePending=null;await send('🎨 Réglages actuels conservés.').catch(()=>{});await routeAfterLook(r);return;}
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
      writeFx(fx);await refreshPanelBA();return; // [c4-1] avant/après auto sur chaque réglage d'image
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
    // Nouveau look /*v10 : message-media unique — tout se passe dans LE bloc, aucun message envoye*/
    if(d==='NL_NOOP'){return;}
    if(d.startsWith('NL_SET_CAT_')){
      const c=d.replace('NL_SET_CAT_','');
      newlook.extra=null;
      if(c==='random'){const o=nlMod().pickOutfit(null);newlook.category='random';newlook.extra=o.prompt;newlook.catLabel='🎲 Surprise';}
      else newlook.category=c;
      nlConfig();return;
    }
    if(d==='NL_MENU_CAT'){nlMenuCat();return;}
    if(d==='NL_MENU_ENV'){nlMenuEnv();return;}
    if(d==='NL_MENU_MODE'){nlMenuMode();return;}
    if(d.startsWith('NL_SET_ENV_')){newlook.env=d.replace('NL_SET_ENV_','');nlConfig();return;}
    if(d.startsWith('NL_SET_MODE_')){newlook.mode=d.replace('NL_SET_MODE_','');nlConfig();return;}
    if(d.startsWith('NL_CNT_')){newlook.count=Math.max(1,Math.min(6,+d.slice(7)||1));nlConfig();return;} /*[C] nombre de photos (éco)*/
    if(d==='NL_GO'){ /*step RECAP : on sait QUOI et COMBIEN avant de payer*/
      const lb2=nlMod().readLookbook();
      const ops=(lb2.pricing&&lb2.pricing.ops)||{};
      const epc=(lb2.pricing&&lb2.pricing.eur_per_credit)||0.058;
      const N=newlook.mode==='eco'?(newlook.count||1):1; /*[C] éco : N images séparées*/
      const crUnit=ops[newlook.mode];const cr=crUnit?+(crUnit*N).toFixed(2):null;
      const prix=cr?('≈'+(cr*epc).toFixed(2).replace('.',',')+' € ('+String(cr).replace('.',',')+' cr)'):'prix à calibrer';
      const nimg=newlook.mode==='hd'?'4 images':newlook.mode==='planche'?'1 planche (plusieurs poses)':(N+' image'+(N>1?'s 9:16 séparées':' 9:16'));
      await nlText('🧾 <b>RÉCAP</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+newlook.mode+' · '+nimg+' · '+prix,[
        [{text:'→ ✅ GÉNÉRER MAINTENANT',callback_data:'NL_GO2'}],
        [{text:'◀️ Précédent',callback_data:'NL_CONFIG'}]
      ]);
      return;
    }
    if(d==='NL_GO2'){newlook.urls=[];newlook.files=[];newlook.idx=0;runNewLook();return;}
    if(d==='NL_OTHER'){await nlPayRecap(newlook.mode==='split'?'planche':newlook.mode,'🆕 Autre look (tenue re-tirée)','NL_OTHER_OK','NL_BACKRES');return;}
    if(d==='NL_OTHER_OK'){const o=nlMod().pickOutfit(newlook.category!=='random'?newlook.category:null);newlook.extra=o.prompt;newlook.urls=[];newlook.files=[];newlook.idx=0;if(newlook.mode==='split')newlook.mode='planche';runNewLook();return;}
    if(d==='NL_CONFIG'){nlConfig();return;}
    if(d==='NL_NAV_P'){if(newlook.urls.length>1){newlook.idx=(newlook.idx-1+newlook.urls.length)%newlook.urls.length;nlShowResult();}return;}
    if(d==='NL_NAV_N'){if(newlook.urls.length>1){newlook.idx=(newlook.idx+1)%newlook.urls.length;nlShowResult();}return;}
    function nlSave(i){
      const stamp=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
      const dest=require('path').join(getLooksDir(),'gen_'+stamp+'_p'+(i+1)+'.jpg');
      const src=nlLocal(i);
      if(src)fs.copyFileSync(src,dest);
      else require('child_process').execSync('curl -s -o "'+dest+'" "'+newlook.urls[i]+'"');
      try{nlMod().saveRecipe(newlook.recipe||{},require('path').basename(dest));}catch(e){}
      return dest;
    }
    if(d==='NL_KEEP_CUR'){
      try{const dest=nlSave(newlook.idx);await nlMedia(nlLocal(newlook.idx),'✅ <b>GARDÉE</b> · pose '+(newlook.idx+1)+' · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel),nlResultRows(),true);if(dest)await resAdd({type:'photo',path:dest,label:'💾 '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)});}catch(e){await nlText('❌ Garde : '+escH(e.message),nlResultRows());}
      return;
    }
    if(d==='NL_AVATAR'){ /*[pose] définir CETTE pose comme avatar*/
      try{const dest=nlSave(newlook.idx);setAvatar(dest);setWorkPhoto(dest);gw.look=dest;genState.look=dest;saveState(); /*[BUG-3] avatar = photo de travail -> « Nouvelle vidéo » repart de CETTE image*/ await nlMedia(nlLocal(newlook.idx),'✅ <b>AVATAR</b> · pose '+(newlook.idx+1)+' — « Nouvelle vidéo » partira de cette photo',nlResultRows(),true);}catch(e){await nlText('❌ '+escH(e.message),nlResultRows());}
      return;
    }
    if(d==='NL_EDIT'){ /*[pose] ouvrir l'éditeur sur CETTE pose*/
      try{const dest=nlSave(newlook.idx);setWorkPhoto(dest);await toast('🎨 Éditeur · pose '+(newlook.idx+1));await showEditHome();}catch(e){await nlText('❌ '+escH(e.message),nlResultRows());}
      return;
    }
    if(d==='NL_KEEP_ALL'){
      try{let n=0;for(let i=0;i<newlook.urls.length;i++){const dest=nlSave(i);if(dest){results.items=results.items.filter(x=>x.path!==dest);results.items.push({type:'photo',path:dest,label:'💾 '+escH(newlook.catLabel)+' · pose '+(i+1),ts:Date.now()});}n++;}while(results.items.length>30)results.items.shift();results.idx=results.items.length-1;resSave();await showResults().catch(()=>{});await nlText('✅ <b>GARDÉES</b> · '+n+' poses · /look pour recréer',nlResultRows());}catch(e){await nlText('❌ Garde : '+escH(e.message),nlResultRows());}
      return;
    }
    if(d==='RES_PREV'){await toast('⏳ Chargement…');results.idx--;await showResults();return;}
    if(d==='RES_NEXT'){await toast('⏳ Chargement…');results.idx++;await showResults();return;}
    if(d==='RES_BACK'){await showResults();return;}
    if(d==='RES_STEPS'){await resSteps();return;}
    if(d==='RES_EDIT'){
      const it=results.items[results.idx];
      if(it&&it.type==='photo'){await toast('🎨 Ouverture de l\'éditeur… (~5s)');try{setWorkPhoto(it.path);}catch(e){}await showEditHome();}
      else await toast('Sélectionne une photo d\'abord (‹ ›)');
      return;
    }
    if(d==='RES_GEN'){
      const it=results.items[results.idx];
      if(it&&it.type==='photo'){gw.look=it.path;genState.look=it.path;saveState();try{setAvatar(it.path);}catch(e){}await ensureTopic();await showRecap();await toast('Photo envoyée au bloc vidéo');}
      return;
    }
    if(d.startsWith('NL_RE_')){ /*recreate v1 : choix LIBRE de la/des pose(s) a recreer en 9:16 natif (payant, 1 credit/pose)*/
      (async()=>{
        try{
          const which=d==='NL_RE_ALL'?[0,1,2]:[+d.replace('NL_RE_','')];
          const planche=newlook.urls[0];
          const out=[];
          for(const i of which){
            await nlText('🪄 <b>9:16</b> · pose '+(i+1)+' · '+(out.length+1)+'/'+which.length+' 💰');
            out.push(await nlMod().recreatePose(planche,i,m=>{nlText('🪄 '+escH(m)).catch(()=>{});}));
          }
          newlook.urls=out;newlook.files=[];newlook.idx=0;newlook.mode='hd';
          await nlShowResult();
        }catch(e){await nlText('❌ Recréation : '+escH(e.message),nlResultRows());}
      })();
      return;
    }
    if(d==='NL_SPLIT'){
      (async()=>{
        try{
          await nlText('✂️ <b>DÉCOUPE</b> · 3 poses · gratuit');
          const files=await nlMod().splitPlanche(newlook.urls[0]);
          newlook.urls=files;newlook.files=files.slice();newlook.idx=0;newlook.mode='split';
          await nlShowResult();
        }catch(e){await nlText('❌ Découpage : '+escH(e.message),[[{text:'🔄 Réessayer',callback_data:'NL_SPLIT'},{text:'⚙️ Réglages',callback_data:'NL_CONFIG'}]]);}
      })();
      return;
    }
    if(d==='NL_VIDEO'){
      if(!newlook.urls.length){await nlText('⚠️ Génère et valide des images d\'abord.',nlResultRows());return;}
      try{
        const dest=nlSave(newlook.idx);
        setAvatar(dest);setWorkPhoto(dest);gw.look=dest;genState.look=dest;saveState(); /*[BUG-3] « Nouvelle vidéo » repart de cette image*/
        await nlMedia(nlLocal(newlook.idx),'🎬 <b>AVATAR APPLIQUÉ</b> · lance la vidéo',[[{text:'▶️ Ouvrir le menu vidéo',callback_data:'NEW_GO'}],[{text:'◀️ Retour aux résultats',callback_data:'NL_BACKRES'}]]);
      }catch(e){await nlText('❌ '+escH(e.message),nlResultRows());}
      return;
    }
    if(d==='NL_BACKRES'){if(newlook.urls.length)nlShowResult();else nlConfig();return;} /*pas de résultats en mémoire -> retour réglages, pas un écran fantôme*/
    if(d==='NL_HD'){newlook.mode='hd';await nlPayRecap('hd','💎 HD · 4 portraits 1080p','NL_HD_OK','NL_BACKRES');return;}
    if(d==='NL_HD_OK'){newlook.urls=[];newlook.files=[];newlook.idx=0;newlook.mode='hd';runNewLook();return;}
    if(d==='NL_RETRY'){if(newlook.mode==='split')newlook.mode='planche';await nlPayRecap(newlook.mode,'🔁 Refaire pareil · '+escH(newlook.catLabel),'NL_RETRY_OK','NL_BACKRES');return;}
    if(d==='NL_RETRY_OK'){newlook.urls=[];newlook.files=[];newlook.idx=0;if(newlook.mode==='split')newlook.mode='planche';runNewLook();return;}
    if(d==='NL_CANCEL'){await nlText('🎨 <b>TERMINÉ</b> · galerie à jour · /newlook pour relancer');return;}
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
  switchChat(String(msg.chat.id)); // no-op en mono-chat
  uiLog({dir:'in',type:msg.photo?'photo':'msg',screen:'',user_action:(msg.text||(msg.photo?'[photo]':'[media]')).slice(0,80),caption_len:(msg.text||'').length,buttons:[],edited_in_place:false});

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
    }catch(e){await send('❌ Error saving: '+e.message);await openCard();}
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
  // 🔒 Une COMMANDE (/...) ne doit JAMAIS être capturée comme script/sujet/durée -> on libère l'attente
  if(msg.text&&/^\//.test(msg.text.trim())&&['gj_edit_wait','gjm_dur_wait','rc_topic_wait','rc_dur_wait'].includes(state)){state='idle';}
  if(state==='gj_edit_wait'&&msg.text){
    const nt=msg.text.trim();
    if(!validTTS(nt)){await send('⚠️ Texte trop court ou suspect (« '+nt.slice(0,30)+' »). Renvoie le script complet (≥ 15 caractères).');return;}
    if(genJob){genJob.script=nt;genJob.c1=Object.assign({},genJob.c1,{script:genJob.script});genJob.audio=null;}
    state='idle';
    if(genJob)await showScriptCard();else await send('✅ Script remplacé.');
    return;
  }
  if(state==='gjm_dur_wait'&&msg.text){
    let n=parseInt((msg.text.match(/\d+/)||[])[0]||'',10);
    if(!n||n<5){await send('⚠️ Nombre de secondes (5–180).');return;}
    if(n>180)n=180;state='idle';
    if(genJob){const plan=WF.planParts(n);genJob.duration=n+'s';genJob.parts=plan.n;genJob.words=plan.words;genState.duration=genJob.duration;saveState();}
    await genAfterScript();return;
  }
  if(state==='rc_topic_wait'&&msg.text){
    gw.topic=msg.text.trim();gw.subjectMode='mine';state='idle';
    gw.subjectMode='mine';await send('✅ Sujet : '+gw.topic);await refreshRecap();return;
  }
  if(state==='rc_dur_wait'&&msg.text){
    let n=parseInt((msg.text.match(/\d+/)||[])[0]||'',10);
    if(!n||n<5){await send('⚠️ Donne un nombre de secondes (5–180).');return;}
    if(n>180)n=180;
    gw.duration=n+'s';genState.duration=gw.duration;saveState();state='idle';await refreshRecap();return;
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
  if(txt)jlog('ETOILE→ '+txt);
  if(!txt)return;
  // menu principal automatique à la 1ère interaction de la journée
  {const _t=new Date().toISOString().slice(0,10);if(_t!==lastMenuDay){lastMenuDay=_t;if(!txt.startsWith('/'))await openCard().catch(()=>{});}} /*fix : le menu auto ne s'invite plus par-dessus les commandes (/newlook etc.)*/

  if(txt==='/studio'){ /*3 BLOCS STATIQUES (validé Etoile 08/06) : repose proprement photo + vidéo + résultats en bas du chat*/
    await delMsg(newlook.mediaId);newlook.mediaId=null;
    await delMsg(cockpit.mid);cockpitReset();lastCardSig='';
    await delMsg(results.mid);results.mid=null;
    await nlConfig();            // BLOC 1 — PHOTO
    gwReset();await showRecap(); // BLOC 2 — VIDÉO (posée tout de suite, sujet résolu juste après)
    await showResults();         // BLOC 3 — RÉSULTATS
    ensureTopic().then(()=>showRecap()).catch(()=>{}); /*le sujet auto ne doit JAMAIS retarder la pose des 3 blocs*/
    return;
  }
  if(txt==='/start'||txt==='/menu'){await showHome();return;} /*[C1] menu unifié*/
  if(txt==='/help'){await send(HELP_TXT);return;}
  if(txt==='/go'||txt==='go'){await showHome();return;} /*[C1] /go = /menu = menu unifié*/
  if(txt==='/stop'){ /*stopall v2 : abort génération orchestrée + tue workflow/test + enfants*/
    let stopped=false;
    if(genJob&&genJob.running){genAbort=true;stopped=true;} // annulation propre de la génération bot
    if(proc){try{proc.kill('SIGKILL');}catch(e){} proc=null;stopped=true;}
    if(testProc){try{testProc.kill('SIGKILL');}catch(e){} testProc=null;stopped=true;} if(!(genJob&&genJob.running))genJob=null;
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
  if(txt==='/edit'){try{const fx=readFx();fx.image=Object.assign({},IMG_PRESETS['Naturel']);writeFx(fx);clearHistory();}catch(e){} /*[BUG-4] ouverture /edit = brouillon NEUTRE (le filtre précédent ne se réactive plus)*/ await showEditHome();return;}
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
  if(txt==='/newlook'||txt.startsWith('/newlook ')){ /*newlook v7 : variante B — panneau tout-en-un (maquette validee Etoile)*/
    newlook.extra=txt.replace(/^\/newlook\s*/,'').trim()||null;
    newlook.panelId=null;newlook.urls=[];newlook.mode='eco'; /*regle : on repart toujours en test eco*/
    await delMsg(newlook.mediaId);newlook.mediaId=null; /*la COMMANDE repose le panneau EN BAS (sinon il edite un vieux message hors ecran = "rien ne se passe")*/
    nlConfig();
    return;
  }
  if(txt==='/assemble'||txt.startsWith('/assemble ')){ /*assemble v1 : concatene les parts du dernier trio (ou horodatage donne) en 1 video longue*/
    const arg=txt.replace(/^\/assemble\s*/,'').trim()||null;
    (async()=>{
      try{
        await send('🧩 Assemblage des parts en cours...');
        const {assemble}=require('./assemble.js');
        const r=assemble(arg);
        await send('✅ Vidéo longue prête : '+require('path').basename(r.file)+' ('+r.duration.toFixed(0)+'s, '+r.parts+' parts)');
        await sendVid(r.file).catch(async()=>{await send('⚠️ Trop lourde pour Telegram — voir iCloud → podcast-outputs');});
      }catch(e){await send('❌ Assemblage : '+e.message);}
    })();
    return;
  }
  if(txt==='/prompt'||txt.startsWith('/prompt ')){ /*prompt v1 : le prompt de base est consultable et modifiable depuis le chat*/
    const np=txt.replace(/^\/prompt\s*/,'').trim();
    const pf=path.join(BASE,'newlook_prompt.txt');
    if(!np){
      let cur='';try{cur=fs.readFileSync(pf,'utf8').trim();}catch(e){}
      await send('📝 <b>Prompt de base actuel</b> (fichier newlook_prompt.txt) :\n\n<code>'+escH(cur.substring(0,3500))+'</code>\n\nPour le remplacer : <code>/prompt nouveau texte complet</code>');
      return;
    }
    try{
      fs.copyFileSync(pf,pf+'.bak');
      fs.writeFileSync(pf,np+'\n');
      await send('✅ Prompt de base remplacé ('+np.split(/\s+/).length+' mots). Ancien sauvegardé dans newlook_prompt.txt.bak — actif dès la prochaine génération, sans redémarrage.');
    }catch(e){await send('Erreur : '+e.message);}
    return;
  }
  if(txt==='/gens'||txt.startsWith('/gens ')){ /*gens v1 : retrouver les generations recentes (archivees automatiquement, gardees ou non)*/
    (async()=>{
      try{
        const n=Math.min(+(txt.replace(/^\/gens\s*/,'').trim()||5)||5,10);
        const dir=require('path').join(getLooksDir(),'..','podcast-outputs','generations');
        let real;try{real=fs.realpathSync(require('path').join(BASE,'outputs','generations'));}catch(e){real=null;}
        if(!real||!fs.existsSync(real)){await send('Aucune génération archivée pour l\'instant.');return;}
        const files=fs.readdirSync(real).filter(f=>/\.jpg$/i.test(f)).map(f=>({f,t:fs.statSync(require('path').join(real,f)).mtimeMs})).sort((a,b)=>b.t-a.t).slice(0,n);
        if(!files.length){await send('Aucune génération archivée pour l\'instant.');return;}
        /*[c4-5] 1 seul message : liste + chemin iCloud (au lieu de N images empilées)*/
        const lignes=files.map((x,i)=>(i+1)+'. '+x.f.replace(/\.jpg$/,'')).join('\n');
        await send('🗂 <b>'+files.length+' générations récentes</b>\n'+lignes+'\n\n📱 Toutes les vignettes + vidéos : app <b>Fichiers</b> → iCloud Drive → <b>podcast-outputs/generations</b>');
      }catch(e){await send('Erreur /gens : '+e.message);}
    })();
    return;
  }
  if(txt==='/probe'){ /*probe v1 : quels endpoints Seedream existent (gratuit, rien n'est genere)*/
    (async()=>{ /*[c4-5] un seul message : placeholder edite en place avec le resultat*/
      const r0=await send('🔬 Sonde des endpoints Seedream (gratuit)…');const mid=r0&&r0.result&&r0.result.message_id;
      try{
        const list=await nlMod().probeEndpoints();
        const out='🔬 <b>Endpoints Higgsfield</b>\n'+list.join('\n')+'\n\n✅ = existe (je branche le meilleur) · ❌ = n\'existe pas';
        if(!(mid&&await tgEditText(mid,out)))await send(out);
      }catch(e){if(!(mid&&await tgEditText(mid,'❌ Erreur sonde : '+e.message)))await send('❌ Erreur sonde : '+e.message);}
    })();
    return;
  }
  if(txt==='/look'||txt.startsWith('/look ')){ /*newlook v4 : recreer un look garde depuis sa recette*/
    const arg=txt.replace(/^\/look\s*/,'').trim();
    const {listRecipes,getRecipe}=nlMod();
    if(!arg){
      const list=listRecipes();
      if(!list.length){await send('Aucun look mémorisé — garde des poses via /newlook d\'abord.');return;}
      await send('📒 <b>Looks mémorisés</b> (recréer : /look numéro)\n\n'+list.map(s=>'#'+s.id+' — '+(s.category||'libre')+' / '+s.env+(s.extra?' / '+s.extra:'')+' ('+s.date+')').join('\n'));
      return;
    }
    const rec=getRecipe(arg.replace('#',''));
    if(!rec){await send('Look #'+arg+' introuvable. /look pour la liste.');return;}
    newlook.category=rec.category;newlook.env=rec.env;newlook.extra=rec.extra;
    runNewLook();
    return;
  }
  if(txt==='/looks'){galMid=null;gal.idx=0;gal.page=0;galFrom='card';await showGallery();return;}
  if(txt==='/ideas'){
    const r0=await send('⏳ Recherche d\'idées…');const mid=r0&&r0.result&&r0.result.message_id; /*[c4-5] 1 seul message edite en place*/
    try{
      const Anthropic=require('@anthropic-ai/sdk');
      const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
      let used='';
      try{const lib=JSON.parse(fs.readFileSync(LIBRARY,'utf8'));used=(lib.scripts||[]).map(s=>s.title).join(', ');}catch{}
      const r=await ant.messages.create({
        model:'claude-sonnet-4-6',max_tokens:400,
        messages:[{role:'user',content:'TikTok relationship coach for women 20-40. Already covered: '+used+'. Give 7 NEW viral topic ideas. Short, punchy, numbered list only.'}]
      });
      const out='💡 <b>Idées :</b>\n\n'+r.content[0].text;
      if(!(mid&&await tgEditText(mid,out)))await send(out);
    }catch(e){const m='⚠️ '+apiNice(e);if(!(mid&&await tgEditText(mid,m)))await send(m);}return;
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
  if(state==='setup_topic'){state='idle';await openCard();return;} /*[chantier2] legacy state -> carte*/
  // Workflow free answer
  if(state==='question'&&proc){wfInput(txt);state='running';await send('Sent: '+txt);return;}

  await send('Send /go to start! Or /help for commands.');
}

// ── Poll ──────────────────────────────────────────────────────────────────────
async function poll(){
  try{
    /*anti-surdité : si getUpdates reste suspendu (réseau/veille), on coupe à 30s au lieu de geler la boucle POUR TOUJOURS*/
    const r=await Promise.race([
      fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=10`),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('poll timeout 30s')),30000))
    ]);
    if(r.ok){const d=await r.json();if(d.ok)for(const u of d.result){offset=u.update_id+1;await handle(u).catch(e=>console.error('err:',e.message));}}
  }catch(e){try{if(/poll timeout/.test(e.message))jlog('⚠️ getUpdates suspendu >30s — boucle relancée');}catch(_){}}
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
tg('setMyCommands',{commands:[ /*cmdmenu v3 : /stop en TÊTE (accès d'urgence)*/
  {command:'stop',description:'⏹ Tout arrêter'},
  {command:'restart',description:'🔄 Redémarrer le bot'},
  {command:'go',description:'🏠 Menu principal'},
  {command:'menu',description:'🏠 Menu principal'},
  {command:'edit',description:'🎛 Éditer le look (sous-titres, image, zooms, musique)'},
  {command:'looks',description:'👤 Galerie de looks'},
  {command:'newlook',description:'🎨 Générer un nouveau look (même visage)'},
  {command:'posted',description:'📤 Vidéos prêtes à poster'},
  {command:'files',description:'📁 Fichiers (vidéos, images, légendes, looks)'},
  {command:'styles',description:'📦 Modèles enregistrés'},
  {command:'preview',description:'👁 Aperçu gratuit du look'},
  {command:'test',description:'🧪 Rendu local gratuit'},
  {command:'settings',description:'⚙️ Réglages sous-titres'},
  {command:'ideas',description:'💡 Idées de sujets'},
  {command:'library',description:'📚 Derniers scripts'},
  {command:'status',description:'ℹ️ État du bot'},
  {command:'help',description:'❓ Aide'},
]}).catch(()=>{});
/*restartcmd v2 : purge du backlog au demarrage — on ignore tout message recu pendant qu'on etait mort (anti-boucle, anti-rafale)*/
(async()=>{try{const r=await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1&timeout=0`);const d=await r.json();if(d&&d.ok&&d.result&&d.result.length)offset=d.result[d.result.length-1].update_id+1;}catch(e){}})().then(()=>
send('🤖 <b>Bot prêt !</b>\n\nTape /menu pour le menu principal.')).then(()=>{
  loadState();resLoad();genFoldersLoad();setInterval(()=>{try{resSave();}catch(e){}},20000); /*mids des 3 blocs sauvegardés en continu*/
  console.log('Bot running...');poll();
}).catch(e=>{console.error(e.message);process.exit(1);});

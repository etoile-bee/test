require('dotenv').config();
const {spawn}=require('child_process');
const fetch=require('node-fetch');
const fs=require('fs');
const path=require('path');
const os=require('os');

const TOKEN=process.env.TELEGRAM_TOKEN;
const CHAT_ID=String(process.env.TELEGRAM_CHAT_ID);
const REOPEN_FLAG='/tmp/ws_reopen_cockpit'; // [fix/restart-feedback] drapeau : ré-ouvrir le cockpit après un /restart demandé
// [DATA-INTÉGRITÉ] Le banc d'essai (R0_DRYRUN) écrit dans une base SANDBOX isolée — JAMAIS dans les vrais projects_r.
//   Cause racine corrigée : « la base n'est pas la même en test qu'en réel » + plus aucune pollution des données réelles.
// Sandbox de test : dossier DÉDIÉ, isolé de la prod. V4R_SANDBOX permet de le pointer vers un dossier Drive (local + cloud).
const BASE=process.env.R0_DRYRUN?(process.env.V4R_SANDBOX||path.join(os.homedir(),'podcast-workflow','.v4r_sandbox')):path.join(os.homedir(),'podcast-workflow');
// [DATA-INTÉGRITÉ] sandbox de test : on ISOLE l'écriture des projets (projects_r) mais on PARTAGE EN LECTURE les catalogues
//   réels (looks/outputs/prompts) via symlink -> les tests voient les mêmes ressources qu'en réel, sans polluer les vrais projets.
if(process.env.R0_DRYRUN){ try{ fs.mkdirSync(BASE,{recursive:true}); const REAL=path.join(os.homedir(),'podcast-workflow');
  for(const d of ['looks','outputs','prompts']){ const link=path.join(BASE,d); try{ if(!fs.existsSync(link)) fs.symlinkSync(path.join(REAL,d),link); }catch(e){} }
  for(const f of ['library.json','lookbook.json','outfits_catalog.json']){ const link=path.join(BASE,f); try{ if(!fs.existsSync(link)) fs.symlinkSync(path.join(REAL,f),link); }catch(e){} }
}catch(e){} }
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
// ── [DRY-RUN] banc d'essai du VRAI chemin Telegram (R0_DRYRUN=1) : simule messages/edit/delete + « not modified ».
//   AUCUN appel réseau, AUCUNE dépense. Sert à rejouer les séquences réelles (B1-B4) en test.
const R0DRY = process.env.R0_DRYRUN ? { msgs:{}, alive:new Set(), nextMid:1000, log:[], answered:0 } : null;
function _drySig(body){ return String((body&&(body.text!=null?body.text:body.caption))||'') + '|' + JSON.stringify((body&&body.reply_markup)||''); }
function _dryTg(method,body){
  R0DRY.log.push(method+(body&&body.message_id?(' #'+body.message_id):''));
  if(method==='sendMessage'){ const id=++R0DRY.nextMid; R0DRY.msgs[id]={kind:'text',sig:_drySig(body)}; R0DRY.alive.add(id); return {ok:true,result:{message_id:id}}; }
  if(method==='sendPhoto'||method==='sendVideo'){ const id=++R0DRY.nextMid; R0DRY.msgs[id]={kind:'media',sig:_drySig(body)}; R0DRY.alive.add(id); return {ok:true,result:{message_id:id}}; }
  if(method==='editMessageText'||method==='editMessageCaption'){ const id=body.message_id; const cur=R0DRY.msgs[id]; if(!cur) return {ok:false,description:'message to edit not found'}; const sig=_drySig(body); if(cur.sig===sig) return {ok:false,description:'Bad Request: message is not modified'}; cur.sig=sig; if(method==='editMessageCaption')cur.kind='media'; return {ok:true,result:{message_id:id}}; }
  if(method==='editMessageMedia'){ const id=body.message_id; const cur=R0DRY.msgs[id]; if(!cur) return {ok:false,description:'message to edit not found'}; cur.sig='media:'+(R0DRY.nextMid++); cur.kind='media'; return {ok:true,result:{message_id:id}}; }
  if(method==='deleteMessage'){ const id=body.message_id; if(!R0DRY.msgs[id]) return {ok:false,description:'Bad Request: message to delete not found'}; delete R0DRY.msgs[id]; R0DRY.alive.delete(id); return {ok:true}; }
  if(method==='answerCallbackQuery'){ R0DRY.answered++; return {ok:true}; }
  return {ok:true,result:{message_id:++R0DRY.nextMid}};
}
async function tg(method,body,isForm){
  if(R0DRY) return _dryTg(method,body);
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
  if(typeof R0DRY!=='undefined'&&R0DRY){ const r=_dryTg('sendVideo',{caption:caption}); return r.result.message_id; }
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
// [C5] CHANGER LA RÉFÉRENCE Imany : copie une image choisie -> looks/references/imany/imany_reference.<ext> (le durcissement nlRefFile la prendra)
function setImanyRef(src){
  try{
    if(!src||!fs.existsSync(src))return null;
    const dir=path.join(getLooksDir(),'references','imany');try{fs.mkdirSync(dir,{recursive:true});}catch(e){}
    const ext=((src.match(/\.(jpe?g|png|webp)$/i)||[,'png'])[1]||'png').toLowerCase();
    // retire les autres imany_reference.* (évite l'ambiguïté ; le nom exact = la référence officielle)
    try{for(const f of fs.readdirSync(dir))if(/^imany_reference\.(jpe?g|png|webp)$/i.test(f))fs.unlinkSync(path.join(dir,f));}catch(e){}
    const dest=path.join(dir,'imany_reference.'+ext);
    fs.copyFileSync(src,dest);
    _nlCover=null; // invalide l'aperçu d'accueil
    return dest;
  }catch(e){jlog('⚠️ setImanyRef: '+e.message);return null;}
}
// [L0-2a-bis] Vignette de la référence active, à un CHEMIN qui change avec le contenu (mtime) :
// indispensable pour que l'anti-doublon de nlMedia laisse passer la mise à jour quand la réf change (même basename imany_reference.*).
function refThumb(){
  try{
    const src=nlRefFile();
    if(src&&fs.existsSync(src)){
      const m=Math.round(fs.statSync(src).mtimeMs);
      const out='/tmp/refthumb_'+m+'.jpg';
      if(fs.existsSync(out)&&fs.statSync(out).size>3000)return out;
      require('child_process').execSync('sips -Z 900 -s format jpeg "'+src+'" --out "'+out+'" 2>/dev/null || ffmpeg -y -i "'+src+'" -vf scale=900:-2 -q:v 3 "'+out+'" 2>/dev/null');
      if(fs.existsSync(out)&&fs.statSync(out).size>3000)return out;
    }
  }catch(e){}
  return nlCover();
}
async function refPreview(dest){
  if(!dest){await cardMenu('❌ Référence non définie.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}
  _nlCover=null;const cv=nlCover();
  const cap='✅ <b>Nouvelle référence Imany</b> définie · '+escH(path.basename(dest))+'\nElle sera utilisée pour les prochaines générations.';
  if(cv&&fs.existsSync(cv))await cockpitPhoto(cv,cap,[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);
  else await cardMenu(cap,[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);
}
async function showRefMenu(){
  await cardMenu('🎯 <b>CHANGER LA RÉFÉRENCE Imany</b>\nSource de la nouvelle photo de référence :',[
    [{text:'🖼 Pose générée actuelle',callback_data:'REF_FROM_GEN'}],
    [{text:'👗 Look de la galerie',callback_data:'REF_FROM_GAL'}],
    [{text:'📤 Envoyer une photo',callback_data:'REF_UPLOAD'}],
    [{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
  ]);
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
  await freshBloc('photo',()=>newlook.mediaId,()=>newlook.mediaId=null); /*[stale-fix]*/
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
  wizardActive=true; /*[L0-1e] wizard photo/look démarré -> /menu sauvera un brouillon*/
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
  if(createFlow)rows.push([{text:'✅ Valider ce look → vidéo',callback_data:'CL_OK'}]); /*[flux-look] en création : valider le look généré et continuer vers le script*/
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
  const _lab={eco:'🧪 Éco · 9:16 ~1440×2560',planche:'🖼 Planche (3 poses en 1 image)',hd:'💎 HD · 4 variantes 9:16 ~1440×2560'}[newlook.mode]||newlook.mode; /*[qualité] éco et HD = MÊME résolution native Seedream (2,5K) ; HD = juste 4 variantes. Plus de "720p"/"1080p" trompeur.*/
  const _hb=setInterval(()=>{_sec+=30;nlText('⏳ <b>GÉNÉRATION</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+_lab+' · '+_sec+'s').catch(()=>{});},30000);
  try{
    await nlText('⏳ <b>GÉNÉRATION</b> · '+escH(newlook.catLabel)+' · '+escH(newlook.envLabel)+' · '+_lab);
    const {generateLook}=nlMod();
    const r=await generateLook({category:newlook.category,env:newlook.env,extra:newlook.extra,mode:newlook.mode,count:newlook.count,basePrompt:newlook.basePrompt||null},m=>{nlText('⏳ <b>GÉNÉRATION</b> · '+escH(m)).catch(()=>{});}); /*[L0-2a-ter] basePrompt = prompt utilisateur du brouillon (sinon défaut)*/
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
  if(typeof R0DRY!=='undefined'&&R0DRY){ return _dryTg('sendPhoto',{caption:caption}); }
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
let createFlow=null; // [flux-look] {mode:'auto'|'express'} : on est dans l'ÉTAPE LOOK d'une création (avant script). null = pas en création.
let createUploadPath=null; // [flux-look] photo uploadée en attente de validation comme look
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
  if(galForRecap){rows.push([{text:'✅ Choisir pour la vidéo',callback_data:'GAL_PICK'}]);rows.push([{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🗑',callback_data:'GAL_DEL'}]);rows.push([{text:'▦ Grille',callback_data:'GGRID'},createFlow?{text:'◀️ Sources',callback_data:'CL_BACK'}:{text:'◀️ Récap',callback_data:'RC_BACK'}]);} /*[flux-look] en création, le retour pointe l'écran Sources*/
  else {rows.push([{text:'✅ Avatar',callback_data:'GAL_AVATAR'},{text:'🎬 Générer avec',callback_data:'GAL_GEN'},{text:'🗑',callback_data:'GAL_DEL'}]);rows.push([{text:'▦ Grille',callback_data:'GGRID'},{text:'🎯 Réf',callback_data:'REF_FROM_GAL'},galFrom==='edit'?{text:'◀️ Édition',callback_data:'EDIT_HOME'}:{text:'◀️ Retour',callback_data:'MAIN_MENU'}]);}
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
  if(createFlow)rows.push([{text:'🎲 Au hasard',callback_data:'CL_GAL_RAND'},{text:'◀️ Sources',callback_data:'CL_BACK'}]); /*[flux-look] galerie en création*/
  else if(galForRecap)rows.push([{text:'◀️ Récap',callback_data:'RC_BACK'}]);
  else rows.push([{text:'✨ Nouveau look',callback_data:'NL_NEW'},galFrom==='edit'?{text:'◀️ Édition',callback_data:'EDIT_HOME'}:{text:'◀️ Retour',callback_data:'MAIN_MENU'}]); /*[Studio→Look] accès direct à la génération de look (/newlook)*/
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
    send('✅ <b>Done!</b>\n\nTape /menu pour une autre vidéo.',[
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
const uiRouter=require('./ui/router'); // [L0-1] routeur modulaire (strangler-fig : cohabite avec l'ancien dispatch)
const {sanitizeTTS:_sanTTS}=require('./tts_sanitize'); // ceinture : nettoyage pause côté bot aussi
// ── Mémoire persistante (mise à jour SEULEMENT par les vraies générations) ──────
const STATE_PATH=path.join(BASE,'state.json');
const DEFAULT_STATE={look:null,duration:'23s',styleName:null,subjectMode:'auto',lastLooks:[],activeDraftId:null};
let genState=Object.assign({},DEFAULT_STATE);
function loadState(){try{genState=Object.assign({},DEFAULT_STATE,JSON.parse(fs.readFileSync(STATE_PATH,'utf8')));}catch(e){genState=Object.assign({},DEFAULT_STATE);}try{if(genState.look&&fs.existsSync(genState.look))workingSource=genState.look;}catch(e){}}
function saveState(){try{fs.writeFileSync(STATE_PATH,JSON.stringify(genState,null,2));}catch(e){}}

// [L0-1e] BROUILLONS (E110/E113) — auto-save NON destructif, draftId STABLE (1 session ↔ 1 draftId), survit au restart.
let wizardActive=false; // un wizard (look/photo/vidéo) a été démarré et n'est pas encore validé
const DRAFTS_DIR=path.join(BASE,'drafts');
function _persona(){try{return (activePersona().name||'imany').toLowerCase().replace(/[^a-z0-9]+/g,'_');}catch(e){return 'imany';}}
function draftsDir(){const d=path.join(DRAFTS_DIR,_persona());try{fs.mkdirSync(d,{recursive:true});}catch(e){}return d;}
function draftPath(id){return path.join(draftsDir(),id+'.json');}
function listDrafts(){try{return fs.readdirSync(draftsDir()).filter(f=>/\.json$/.test(f)).map(f=>{try{return JSON.parse(fs.readFileSync(path.join(draftsDir(),f),'utf8'));}catch(e){return null;}}).filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0));}catch(e){return[];}}
function workInProgress(){try{ if(wizardActive)return true; if(newlook&&newlook.urls&&newlook.urls.length)return true; if(genJob&&genJob.script&&genJob.script!==DEMO_SCRIPT)return true; return false; }catch(e){return false;}}
function captureDraft(id){let fx=null;try{fx=readFx();}catch(e){} const _projStep=(typeof proj!=='undefined'&&proj)?proj.step:null; return {draftId:id,ts:Date.now(),persona:_persona(),step:(genJob&&genJob.script&&genJob.script!==DEMO_SCRIPT)?'video':(_projStep||((newlook.urls&&newlook.urls.length)?'image':'look')),look:((typeof gwLook==='function'&&gwLook())||workingSource||null),images:(newlook.urls||[]).slice(),idx:newlook.idx||0,nl:{category:newlook.category,env:newlook.env,extra:newlook.extra,mode:newlook.mode,count:newlook.count},proj:((typeof proj!=='undefined'&&proj)?{name:proj.name||null,look:Object.assign({},proj.look),image:{urls:(proj.image.urls||[]).slice(),idx:proj.image.idx||0,validated:proj.image.validated},prompt:(proj.prompt?{text:proj.prompt.text,name:proj.prompt.name}:undefined),video:(proj.video?{source:proj.video.source,media:proj.video.media,duration:proj.video.duration,script:{text:(proj.video.script||{}).text||'',name:(proj.video.script||{}).name||'—'},montage:{touched:!!(proj.video.montage&&proj.video.montage.touched)},legende:Object.assign({},proj.video.legende),step:proj.video.step}:undefined)}:undefined),name:((typeof proj!=='undefined'&&proj&&proj.name)||undefined),script:(genJob&&genJob.script)||null,duration:((typeof gw!=='undefined'&&gw&&gw.duration))||genState.duration||null,fx:fx};} /*[L0-2a/ter,L0-2b] slices proj (look/image/prompt/video/name) persistés = source de vérité*/
function autosaveDraft(){try{ if(!workInProgress())return null; if(!genState.activeDraftId)genState.activeDraftId='draft_'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); const id=genState.activeDraftId; fs.writeFileSync(draftPath(id),JSON.stringify(captureDraft(id),null,2)); saveState(); return id; }catch(e){return null;}}
function clearActiveDraft(){try{ const id=genState.activeDraftId; wizardActive=false; try{proj=null;}catch(e){} if(id){try{fs.unlinkSync(draftPath(id));}catch(e){} genState.activeDraftId=null; saveState();} }catch(e){}} /*[L0-2a] le projet actif est aussi vidé*/
async function resumeDraft(id){ // reprend LE MÊME brouillon (réactive le draftId, pas de doublon — E113)
  const d=listDrafts().find(x=>x.draftId===id); if(!d){await toast('⚠️ Brouillon introuvable');return;}
  genState.activeDraftId=id; wizardActive=true;
  try{proj=projFromDraft(d);}catch(e){} /*[L0-2a] restaure le slice proj (look/image) à la reprise*/
  try{
    if(d.nl){newlook.category=d.nl.category;newlook.env=d.nl.env;newlook.extra=d.nl.extra;newlook.mode=d.nl.mode||'eco';newlook.count=d.nl.count||1;}
    if(d.look&&fs.existsSync(d.look))setWorkPhoto(d.look);
    newlook.urls=(d.images||[]).filter(Boolean);newlook.files=[];newlook.idx=Math.min(d.idx||0,Math.max(0,newlook.urls.length-1));
    if(d.duration){genState.duration=d.duration;}
  }catch(e){}
  saveState();
  newlook.mediaId=null; wsOpen=false; // le workspace repart dans un bloc frais
  try{ projToNewlook(); }catch(e){}
  // [L0-2b] reprise dans le WORKSPACE à la bonne étape (projet récupérable, pas de bloc legacy)
  if(proj&&proj.step==='video'){ const vstep=(proj.video&&proj.video.step)||'source'; const mod={source:'video.source',script:'video.script',montage:'video.montage',legende:'video.legende',export:'video.export'}[vstep]||'video.source'; await routeBlock(mod,'inplace'); return; }
  await routeBlock((proj&&proj.step==='image')?'photo.image':'photo.look','inplace');
}
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
    if(!src){await send('⚠️ Aucune photo de travail. Choisis un look 👤 ou tape /menu.');return;}
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
const HELP_TXT='🎬 <b>Commandes</b>\n\n/studio — les 3 blocs (photo · vidéo · résultats)\n/menu — accueil (Photo · Vidéo · Studio · Récents)\n/edit — éditer le look (sous-titres, image, zooms, musique)\n/looks — galerie de looks\n/posted — vidéos prêtes à poster\n/styles — mes styles enregistrés\n/preview — aperçu du look\n/test — rendu local gratuit\n/stop — tout arrêter\n/status — état\n/restart — redémarrer le bot\n/mark [titre] viral|good|ok — noter une vidéo';
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
// [L0-1d-fix] ROUTEUR 3 MODES (E111 raffiné) :
//  - inplace (DÉFAUT) : la navigation INTRA-bloc édite LE bloc racine actif (un seul message qui se transforme A→Z).
//  - navigate : NOUVEAU bloc racine — UNIQUEMENT /menu et un résultat validé/livré.
//  - ephemeral : message système auto-delete.
let activeRootMid=null; // message_id du bloc racine ACCUEIL actuellement navigué (édité en place)
let _ephemeral=[];
async function uiShow(id,caption,rows,mode){
  mode=mode||'inplace';
  if(mode==='ephemeral')return system(caption,rows);
  if(mode==='inplace'&&activeRootMid){ const ok=await tgEditText(activeRootMid,caption,rows); if(ok)return activeRootMid; } // édite LE bloc racine actif (anti-doublon ① + isGone gérés)
  const r=await send(caption,rows); const nm=r&&r.result&&r.result.message_id; if(nm)activeRootMid=nm; return nm; // navigate (ou bloc actif disparu) : NOUVEAU bloc racine
}
async function system(text,rows){ const r=await send(text,rows||[]); const mid=r&&r.result&&r.result.message_id; if(mid){_ephemeral.push(mid); setTimeout(()=>{delMsg(mid).catch(()=>{});_ephemeral=_ephemeral.filter(x=>x!==mid);},8000);} return mid; } // message technique éphémère
function uiCtx(id){ return {show:(cap,rows,mode)=>uiShow(id,cap,rows,mode),showMedia:(file,cap,rows,mode,raw)=>uiShowMedia(file,cap,rows,raw),placeholder:()=>wsPlaceholder(),busy:!!(proc||(genJob&&genJob.running)||newlook.busy)}; } // [MC2] placeholder ; [#5] busy -> bouton Stop visible seulement en génération
// [L0-2a-bis] WORKSPACE MÉDIA (canvas du projet PHOTO) : bloc photo unique édité EN PLACE (vignette + contexte), distinct du menu texte.
let wsOpen=false; // un workspace média (newlook.mediaId) est ouvert
let refGalIdx=0;  // pointeur galerie pour le choix de référence/look
let spRenameSlug=null; // slug du prompt en cours de renommage (Studio)
let editReturn=null;   // [L0-2b] si l'éditeur avancé est entré depuis le workspace : module workspace où revenir (bloc unique)
const MEDIA_MODULES={'photo.look':1,'photo.lookgal':1,'photo.image':1,'photo.ref':1,'photo.refgal':1,'photo.prompt':1,'photo.promptlib':1,
  'video.source':1,'video.srcgal':1,'video.script':1,'video.scriptlib':1,'video.montage':1,'video.legende':1,'video.export':1}; // modules rendus en bloc MÉDIA (workspace PHOTO+VIDÉO)
async function uiShowMedia(file,caption,rows,raw){ const _was=newlook.mediaId; wsOpen=true; await nlMedia(file,caption,rows,raw); try{jlog('🖼 ws '+(_was?'edit':'create')+' mid='+(newlook.mediaId||'?'));}catch(e){} return newlook.mediaId; } // edite/cree le bloc média unique (anti-doublon ① + stalefix via nlMedia)
async function routeBlock(id,mode){
  try{autosaveDraft();}catch(e){}
  editReturn=null; // toute navigation router = on n'est plus dans l'éditeur avancé
  if(wsOpen&&!MEDIA_MODULES[id]){ try{await delMsg(newlook.mediaId);}catch(e){} try{sigDrop(newlook.mediaId);}catch(e){} try{jlog('🖼 ws close mid='+(newlook.mediaId||'?'));}catch(e){} newlook.mediaId=null; wsOpen=false; } // on QUITTE le workspace -> fermeture propre (zéro empilement)
  return uiRouter.route(id,uiCtx(id),mode||'inplace'); // navigation intra-bloc = EN PLACE par défaut ; /menu passe 'navigate'
}

// ─────────────────────────────────────────────────────────────────────────────
// [L0-2a] WORKFLOW PHOTO MIGRÉ DANS LE BLOC ACTIF (E114/E115) — modules photo.look / photo.image.
// proj = projet actif = SOURCE DE VÉRITÉ unique (slices look/image), backé par le brouillon (autosave).
// Pas de reset implicite : ré-entrer Photo recharge le slice ; Retour conserve l'état ; Suivant conserve l'aval.
// ─────────────────────────────────────────────────────────────────────────────
let proj=null;
function defaultPromptText(){ try{ const t=fs.readFileSync(path.join(BASE,'newlook_prompt.txt'),'utf8').trim(); if(t)return t; }catch(e){} return ''; }
function projDefaults(){
  let lb={categories:{},envs:{}};try{lb=nlMod().readLookbook();}catch(e){}
  const cat=newlook.category||Object.keys(lb.categories||{})[0]||null;
  const env=(lb.envs&&lb.envs[newlook.env])?newlook.env:(newlook.env||'bougies');
  return { draftId:genState.activeDraftId||null, persona:_persona(), step:'look', name:null,
    look:{ source:null, file:null, category:cat, env:env, mode:newlook.mode||'eco', count:newlook.count||1, extra:newlook.extra||null },
    image:{ urls:[], idx:0, validated:null, confirming:false },
    prompt:{ text:defaultPromptText(), name:'défaut' },
    video:{ source:null, media:null, duration:'23s', script:{ text:'', name:'—' }, montage:{ touched:false }, legende:{ courte:'', longue:'', tags:'' }, step:'source', confirming:false } };
}
function projFromDraft(d){
  const p=projDefaults();
  try{ if(d){ p.draftId=d.draftId||p.draftId; if(d.name)p.name=d.name;
    if(d.nl){ if(d.nl.category)p.look.category=d.nl.category; if(d.nl.env)p.look.env=d.nl.env; if(d.nl.mode)p.look.mode=d.nl.mode; if(d.nl.count)p.look.count=d.nl.count; p.look.extra=d.nl.extra||p.look.extra; }
    if(d.proj&&d.proj.look)Object.assign(p.look,d.proj.look);
    if(d.proj&&d.proj.image)Object.assign(p.image,d.proj.image);
    else { p.image.urls=(d.images||[]).slice(); p.image.idx=d.idx||0; }
    if(d.proj&&d.proj.prompt&&d.proj.prompt.text)p.prompt=Object.assign({},p.prompt,d.proj.prompt);
    if(d.proj&&d.proj.video){ p.video=Object.assign(p.video,d.proj.video); if(p.video.script&&typeof p.video.script==='object'){} else p.video.script={text:'',name:'—'}; p.video.confirming=false; }
    if(d.proj&&d.proj.name)p.name=d.proj.name;
    p.image.confirming=false; // jamais reprendre en état « confirmation »
    if(p.video&&(p.video.step&&p.video.step!=='source'))p.step='video';
    else if(p.image.urls.length)p.step='image';
  } }catch(e){}
  return p;
}
function projToNewlook(){ if(!proj)return; newlook.category=proj.look.category; newlook.env=proj.look.env; newlook.mode=proj.look.mode; newlook.count=proj.look.count; newlook.extra=proj.look.extra; } // miroir vers le moteur existant (génération réelle)
function ensureProj(){ if(proj)return proj; let d=null; try{ if(genState.activeDraftId)d=listDrafts().find(x=>x.draftId===genState.activeDraftId)||null; }catch(e){} proj=d?projFromDraft(d):projDefaults(); projToNewlook(); return proj; }
// [v8 · point 7] « revenir EXACTEMENT où on était » : module workspace de l'étape courante du projet (bibliothèque = non destructive).
function currentStepModule(p){ try{ if(!genState.activeDraftId)return 'home'; if(p&&p.step==='video'){ const vs=(p.video&&p.video.step)||'source'; return {source:'video.source',script:'video.script',montage:'video.montage',legende:'video.legende',export:'video.export'}[vs]||'video.source'; } if(p&&p.step==='image')return 'photo.image'; if(p&&p.step==='look')return 'photo.look'; }catch(e){} return 'home'; }
// [fix/root-causes-v1 · C7] MODÈLE DE DÉPENDANCES ENTRE ÉTAPES (re-éditabilité permanente, piloté par proj).
// Quelle étape AMONT impacte quelles étapes AVAL. Utilisé pour proposer « Conserver / Mettre à jour / Régénérer »
// quand on modifie une étape dont l'aval existe déjà (sans jamais perdre le travail).
const PROJ_DEPS={ ref:['image','video'], look:['image','video'], decor:['image','video'], prompt:['image','video'], nb:['image'], image:['video'], script:['video'], montage:['video'], params:['video'] };
function projDownstream(slice){ return PROJ_DEPS[slice]||[]; }
function projDownstreamExists(p,slice){ // un aval dépendant a-t-il déjà du travail ?
  try{ return projDownstream(slice).some(s=>{
    if(s==='image')return !!(p&&p.image&&p.image.urls&&p.image.urls.length);
    if(s==='video')return !!(p&&p.video&&((p.video.script&&p.video.script.text)||p.video.media));
    return false;
  }); }catch(e){ return false; }
}
// Marque l'aval « à revoir » sans rien supprimer (le prompt UX décidera Conserver/MàJ/Régénérer).
function projMarkDirty(p,slice){ try{ p._dirty=p._dirty||{}; projDownstream(slice).forEach(s=>{p._dirty[s]=true;}); }catch(e){} return p; }
// [C7 CÂBLÉ] après modif d'une étape amont : si un aval dépendant EXISTE déjà -> prompt Conserver/MàJ/Régénérer.
// Sinon (cas normal early : pas d'aval) -> re-render direct (comportement INCHANGÉ). Sûr : ne se déclenche que s'il y a du travail aval.
let projPending=null; // { slice, ret }
async function afterCoreChange(p,slice,ret){
  try{ projMarkDirty(p,slice);
    if(projDownstreamExists(p,slice)){ projPending={slice:slice,ret:ret}; await routeBlock('photo.propagate','inplace'); return; }
  }catch(e){}
  await routeBlock(ret,'inplace');
}

function draftTag(){ try{ return genState.activeDraftId?genState.activeDraftId.replace('draft_','').replace(/-/g,'/').slice(0,16):'(nouveau)'; }catch(e){ return '(nouveau)'; } }
// [v6] LIBELLÉS MÉTIER (plus de noms de fichiers / ids techniques dans l'UI)
const _MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function draftLabel(){ try{ const id=genState.activeDraftId; if(!id)return 'nouveau projet'; const m=id.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/); if(m)return parseInt(m[3],10)+' '+(_MOIS[parseInt(m[2],10)-1]||'')+' · '+m[4]+':'+m[5]; return 'projet'; }catch(e){ return 'projet'; } }
function modeLabel(m){ return ({eco:'Aperçu',planche:'Planche',hd:'Final HD'})[m]||m||'Aperçu'; } // [v6] Aperçu / Final HD (plus de « eco »)
function refLabel(){ try{ return (activePersona().name)||'Imany'; }catch(e){ return 'Imany'; } }
function lookLabelOf(p){ try{ let lb={categories:{}};try{lb=nlMod().readLookbook();}catch(e){} const c=p&&p.look; if(!c)return '—'; if(c.extra)return c.extra.slice(0,24); const cat=(lb.categories[c.category]||{}).label; if(cat)return cat; return c.file?'Look perso':'—'; }catch(e){ return '—'; } }
function decorLabelOf(p){ try{ let lb={envs:{}};try{lb=nlMod().readLookbook();}catch(e){} const c=p&&p.look; return (c&&(lb.envs[c.env]||{}).label)||(c&&c.env)||'—'; }catch(e){ return '—'; } }
function mediaLabelOf(p){ try{ if(p&&p.image&&p.image.urls&&p.image.urls.length){ const i=(p.image.validated!=null?p.image.validated:(p.image.idx||0)); return 'Image '+(i+1)+'/'+p.image.urls.length; } if(lookFile(p))return 'Look choisi'; return 'Aperçu référence'; }catch(e){ return '—'; } }
function projName(p){ return (p&&p.name)||draftLabel(); }
function lookFile(p){ // image du look actif (chemin réel, unique) ou null
  try{ if(p.look.file&&fs.existsSync(p.look.file))return p.look.file; }catch(e){}
  try{ if(workingSource&&fs.existsSync(workingSource))return workingSource; }catch(e){}
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────
// [fix/root-causes-v1 · MC2] RÉSOLVEUR MÉDIA GARANTI — une vue média NE DOIT JAMAIS
// renvoyer null (sinon le routeur retombe en texte / nouveau bloc = B1/B1.1/B1.2).
// Ordre : image générée RÉSOLUE LOCALEMENT → look → référence → placeholder sûr.
// ─────────────────────────────────────────────────────────────────────────────
let _wsPlaceholder=null;
function wsPlaceholder(){ // image de repli garantie (jamais null sauf catastrophe disque)
  try{ const c=nlCover(); if(c&&fs.existsSync(c))return c; }catch(e){}
  try{ if(_wsPlaceholder&&fs.existsSync(_wsPlaceholder))return _wsPlaceholder;
    const out='/tmp/ws_placeholder.jpg';
    require('child_process').execSync('ffmpeg -y -f lavfi -i color=c=0x1c1c28:s=720x900:d=0.1 -frames:v 1 "'+out+'" 2>/dev/null');
    if(fs.existsSync(out)&&fs.statSync(out).size>300){_wsPlaceholder=out;return out;}
  }catch(e){}
  return null;
}
function wsLocalImage(p){ // image générée résolue LOCALEMENT uniquement (jamais une URL distante qui échoue)
  try{ const im=p&&p.image; if(im&&im.urls&&im.urls.length){ const i=(im.validated!=null?im.validated:(im.idx||0));
    const u=im.urls[i]; if(u&&String(u).startsWith('/')&&fs.existsSync(u))return u; // chemin local durable
    const f=nlLocal(i); if(f&&fs.existsSync(f))return f; // cache local (téléchargé)
  } }catch(e){}
  return null;
}
function wsMedia(p,prefer){ // GARANTIT un chemin image non-null pour toute vue média
  try{ if(prefer&&fs.existsSync(prefer))return prefer; }catch(e){}
  const li=wsLocalImage(p); if(li)return li;
  const lf=lookFile(p); if(lf)return lf;
  try{ const r=refThumb(); if(r&&fs.existsSync(r))return r; }catch(e){}
  return wsPlaceholder();
}
// [fix/root-causes-v1 · #2 PERSISTANCE DURABLE] copie chaque média généré (URL distante OU /tmp) vers un
// chemin LOCAL DURABLE (outputs/proj_media/<draftId>/) et renvoie les chemins locaux. La reprise/retour
// ne tombent plus jamais sur une URL temporaire expirée (cause prouvée de B1 à la reprise ; lien E59/E94).
function persistProjMedia(urls,draftId){
  const out=[]; const dir=path.join(BASE,'outputs','proj_media',(draftId||'sans_id').replace(/[^a-z0-9_-]/gi,'_'));
  try{fs.mkdirSync(dir,{recursive:true});}catch(e){}
  (urls||[]).forEach((u,i)=>{
    try{
      if(u&&String(u).startsWith('/')&&fs.existsSync(u)){ const dst=path.join(dir,i+'.jpg'); try{fs.copyFileSync(u,dst);}catch(e){} out.push(fs.existsSync(dst)?dst:u); return; }
      const dst=path.join(dir,i+'.jpg');
      try{require('child_process').execSync('curl -sL -o "'+dst+'" "'+u+'"');}catch(e){}
      if(fs.existsSync(dst)&&fs.statSync(dst).size>5000)out.push(dst); else if(u)out.push(u); // garde l'URL en dernier recours
    }catch(e){ if(u)out.push(u); }
  });
  return out.length?out:(urls||[]);
}
// [L0-2a-ter · point 6] EN-TÊTE DE CONTEXTE — toujours visible, identique à chaque étape du workspace.
function wsHeader(p,stepLabel){ // [v6] libellés métier (plus de noms de fichiers)
  return '📁 <b>'+escH(projName(p))+'</b> · '+escH(stepLabel)+'\n'
    +'👗 Look : '+escH(lookLabelOf(p))+' · 🌆 '+escH(decorLabelOf(p))+'\n'
    +'🎯 Réf : '+escH(refLabel())+' · ✍️ '+escH((p.prompt&&p.prompt.name)||'défaut')+'\n';
}
// [fix/root-causes-v1 · C4] EN-TÊTE DE CONTEXTE PERMANENT — affiché sur TOUT écran (menus inclus).
// réf active · look · décor · prompt · nb images · média actif.
function cockpitHeader(p){
  try{
    let lb={categories:{},envs:{}};try{lb=nlMod().readLookbook();}catch(e){}
    let src=null;try{src=nlRefFile();}catch(e){}
    const lf=lookFile(p);
    const nb=(p&&p.look&&p.look.mode==='eco')?(p.look.count||1):1;
    // [v6] libellés MÉTIER : plus aucun nom de fichier / id
    return '📁 <b>'+escH(projName(p))+'</b>\n'
      +'🎯 '+escH(refLabel())+' · 👗 '+escH(lookLabelOf(p))+' · 🌆 '+escH(decorLabelOf(p))+'\n'
      +'✍️ '+escH((p&&p.prompt&&p.prompt.name)||'défaut')+' · 📸 '+nb+' · 🖼 '+escH(mediaLabelOf(p))+'\n──────────\n';
  }catch(e){ return ''; }
}
function photoLookView(){ // étape LOOK — bloc MÉDIA (workspace) : vignette look actif (ou réf active) + contexte
  wizardActive=true; // un wizard photo est en cours -> /menu et chaque navigation auto-sauvent le brouillon
  const p=ensureProj();
  if(!genState.activeDraftId){try{autosaveDraft();p.draftId=genState.activeDraftId;}catch(e){}} // [L0-2a-ter] crée l'identité du projet dès l'entrée -> 📁 stable dès le 1er écran
  let lb={categories:{},envs:{}};try{lb=nlMod().readLookbook();}catch(e){}
  const catLabel = p.look.extra ? ('✍️ '+p.look.extra.slice(0,18))
                 : (p.look.category==='random' ? '🎲 Surprise'
                 : ((lb.categories[p.look.category]&&lb.categories[p.look.category].label)||p.look.category||'(à choisir)'));
  const envLabel = (lb.envs[p.look.env]&&lb.envs[p.look.env].label)||p.look.env;
  const srcLabel = {new:'✨ Nouveau (généré)',gallery:'🖼 Galerie',upload:'📤 Upload'}[p.look.source]||'— (à choisir)';
  const lf=lookFile(p); const img=wsMedia(p,lf);
  const cap = wsHeader(p,'Look')
    +'──────────\n'
    +(p.look.source?'✅ Look prêt — ➡ Suivant pour l\'image.':'Choisis ta tenue/décor, puis ➡ Suivant.');
  const rows=[
    [{text:'👗 Tenue',cb:'PL_TENUE'},{text:'🌆 Décor',cb:'PL_ENV'}],
    [{text:'🎯 Référence',go:'photo.ref'},{text:'✍️ Prompt',go:'photo.prompt'}],
    [{text:'🖼 Galerie',go:'photo.lookgal'},{text:'📤 Upload',cb:'PL_SRC_up'}],
    (p.look.mode==='eco'?[{text:'🔢 '+(p.look.count||1)+' image(s)',cb:'PL_NB'}]:[]),
  ];
  return {image:img,raw:false,caption:cap,rows};
}
function photoLookGalView(){ // SOURCE LOOK = galerie, dans le workspace (média, navigation en place)
  const p=ensureProj(); const list=looksList();
  if(!list.length)return {image:wsMedia(p),raw:false,caption:wsHeader(p,'LOOK · Galerie')+'──────────\n🖼 <b>Galerie vide</b> — aucun look enregistré.',rows:[]};
  if(refGalIdx>=list.length||refGalIdx<0)refGalIdx=0;
  const f=path.join(getLooksDir(),list[refGalIdx]);
  const cap=wsHeader(p,'LOOK · Galerie')+'──────────\n🖼 <b>'+(refGalIdx+1)+'/'+list.length+'</b> · <i>'+escH(list[refGalIdx])+'</i>\n\nNavigue ‹ › puis ✅ choisis ce look.';
  const rows=[[{text:'‹',cb:'PL_GPREV'},{text:(refGalIdx+1)+'/'+list.length,cb:'PL_NOOP'},{text:'›',cb:'PL_GNEXT'}],[{text:'✅ Choisir ce look',cb:'PL_GSET'}]];
  return {image:wsMedia(p,f),raw:false,caption:cap,rows};
}
function photoImageCost(){
  let lb={};try{lb=nlMod().readLookbook();}catch(e){}
  const p=ensureProj();const ops=(lb.pricing&&lb.pricing.ops)||{};const epc=(lb.pricing&&lb.pricing.eur_per_credit)||0.058;
  const unit=ops[p.look.mode];const n=p.look.mode==='eco'?(p.look.count||1):1;const cr=unit?unit*n:null;
  return {cr:cr,prix:cr?(cr+' cr ≈ '+(cr*epc).toFixed(2).replace('.',',')+' €'):'prix à calibrer',n:n,lb:lb};
}
function photoImageView(){ // étape IMAGE — bloc MÉDIA : aperçu de l'image en cours/sélectionnée + récap coût + 💲 (derrière confirmation)
  const p=ensureProj();const c=photoImageCost();
  const has=p.image.urls.length;
  const img=wsMedia(p); /* [MC2] B1/B1.1/B1.2 : résolveur garanti, jamais null */
  let cap=wsHeader(p,'Image')+'──────────\n'
    +(has?'🖼 <i>Image '+(p.image.idx+1)+'/'+has+'</i>\n':'👁 <i>Aperçu gratuit (référence/look) — la version Final HD est payante.</i>\n');
  const rows=[];
  if(p.image.confirming){ // confirmation Final HD DANS le workspace (pas de nouveau bloc)
    cap+='\n✨ <b>Lancer la version Final HD ?</b>\nGénération payante'+(c.cr?(' (~'+c.cr+' cr)'):'')+'.';
    rows.push([{text:'✅ Lancer Final HD',cb:'PL_GEN_DO'},{text:'◀️ Annuler',cb:'PL_GEN_NO'}]);
    return {image:img,raw:!!has,caption:cap,rows};
  }
  if(!has){
    cap+='\nQuand l\'aperçu te convient, lance la version Final HD (confirmation demandée).';
    rows.push([{text:'✨ Lancer Final HD',cb:'PL_GEN'}]);
  } else {
    cap+='\n'+(p.image.validated!=null?('✅ Image '+(p.image.validated+1)+'/'+has+' validée.'):('Choisis l\'image à garder.'));
    if(has>1)rows.push([{text:'‹',cb:'PL_PREV'},{text:(p.image.idx+1)+'/'+has,cb:'PL_NOOP'},{text:'›',cb:'PL_NEXT'}]);
    rows.push([{text:(p.image.validated===p.image.idx?'✅ Validée':'✅ Valider'),cb:'PL_PICK'},{text:'🎨 Éditer',cb:'PL_EDIT'}]);
    rows.push([{text:'🎬 Faire une vidéo',go:'video.source'}]); // [L0-2b] enchaînement naturel IMAGE → VIDÉO
  }
  return {image:img,raw:!!has,caption:cap,rows};
}
function photoRefView(){ // gestion RÉFÉRENCE dans le workspace — bloc MÉDIA : vignette de la réf active + remplacement
  const p=ensureProj(); const img=wsMedia(p,refThumb()); let src=null;try{src=nlRefFile();}catch(e){}
  const waiting=(state==='ws_ref_upload_wait');
  const cap=wsHeader(p,'RÉFÉRENCE')+'──────────\n'
    +'🎯 <b>Référence active</b> : <i>'+escH(src?path.basename(src):'(aucune)')+'</i>\n'
    +(waiting?'\n⏳ <b>En attente de ta photo…</b> envoie-la maintenant.':'\nRemplace-la : 🖼 galerie ou 📤 upload. Aperçu immédiat ici ; appliquée aux prochaines générations.');
  const rows=[[{text:'🖼 Galerie',go:'photo.refgal'},{text:'📤 Upload',cb:'PR_UP'}]];
  return {image:img,raw:false,caption:cap,rows};
}
function photoRefGalView(){ // choix de référence depuis la galerie — bloc MÉDIA, navigation en place
  const p=ensureProj(); const list=looksList();
  if(!list.length)return {image:wsMedia(p),raw:false,caption:wsHeader(p,'RÉFÉRENCE · Galerie')+'──────────\n🖼 <b>Galerie vide</b>.',rows:[]};
  if(refGalIdx>=list.length||refGalIdx<0)refGalIdx=0;
  const f=path.join(getLooksDir(),list[refGalIdx]);
  const cap=wsHeader(p,'RÉFÉRENCE · Galerie')+'──────────\n🖼 <b>'+(refGalIdx+1)+'/'+list.length+'</b> · <i>'+escH(list[refGalIdx])+'</i>\n\nNavigue ‹ › puis ✅ définis comme référence active.';
  const rows=[[{text:'‹',cb:'PR_GPREV'},{text:(refGalIdx+1)+'/'+list.length,cb:'PL_NOOP'},{text:'›',cb:'PR_GNEXT'}],[{text:'✅ Définir comme référence',cb:'PR_GSET'}]];
  return {image:wsMedia(p,f),raw:false,caption:cap,rows};
}
function photoPromptView(){ // PROMPT UTILISATEUR dans le workspace — bloc MÉDIA : prompt pré-rempli, visible, modifiable
  const p=ensureProj(); const img=wsMedia(p,lookFile(p));
  const editing=(state==='ws_prompt_edit_wait'); const naming=(state==='ws_prompt_save_wait');
  const txt=(p.prompt&&p.prompt.text)||''; const preview=txt.length>320?(txt.slice(0,320)+'…'):txt;
  const cap=wsHeader(p,'PROMPT')+'──────────\n'
    +'✍️ <b>Prompt actif</b> : '+escH((p.prompt&&p.prompt.name)||'défaut')+'\n'
    +(editing?'\n⏳ <b>Envoie le nouveau texte du prompt…</b>':(naming?'\n⏳ <b>Envoie le nom à donner à ce prompt…</b>':'\n<code>'+escH(preview||'(vide)')+'</code>\n\nÉdite-le, charge-en un de la bibliothèque, ou enregistre-le.'));
  const rows=[
    [{text:'✍️ Éditer',cb:'PP_EDIT'},{text:'↩️ Défaut',cb:'PP_DEFAULT'}],
    [{text:'📚 Charger',go:'photo.promptlib'},{text:'💾 Enregistrer',cb:'PP_SAVE'}],
  ];
  return {image:img,raw:false,caption:cap,rows};
}
function photoPromptLibView(){ // BIBLIOTHÈQUE de prompts, accessible dans le workspace (média) — sélection -> slice
  const p=ensureProj(); const img=wsMedia(p,lookFile(p)); const list=listPromptLib();
  let cap=wsHeader(p,'PROMPT · Bibliothèque')+'──────────\n📚 <b>Mes prompts</b> ('+list.length+')\n';
  const rows=[];
  if(!list.length)cap+='\n(aucun prompt enregistré — 💾 Enregistre le prompt courant pour le réutiliser)';
  else list.slice(0,8).forEach(x=>{ cap+='\n• '+escH(x.name); rows.push([{text:'📝 '+x.name,cb:'PP_USE_'+x.slug}]); });
  return {image:img,raw:false,caption:cap,rows};
}
// ── Bibliothèque de prompts : prompts/<persona>/*.json (point 4) ───────────────
function promptsDir(){ const d=path.join(BASE,'prompts',_persona()); try{fs.mkdirSync(d,{recursive:true});}catch(e){} return d; }
function promptSlug(name){ return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)||('p'+Date.now()); }
function listPromptLib(){ try{ return fs.readdirSync(promptsDir()).filter(f=>/\.json$/.test(f)).map(f=>{ try{ const o=JSON.parse(fs.readFileSync(path.join(promptsDir(),f),'utf8')); return {slug:f.replace(/\.json$/,''),name:o.name||f.replace(/\.json$/,''),text:o.text||'',ts:o.ts||0}; }catch(e){ return null; } }).filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0)); }catch(e){ return []; } }
function getPromptLib(slug){ try{ const o=JSON.parse(fs.readFileSync(path.join(promptsDir(),slug+'.json'),'utf8')); return {slug:slug,name:o.name||slug,text:o.text||''}; }catch(e){ return null; } }
function savePromptLib(name,text){ const slug=promptSlug(name); try{ fs.writeFileSync(path.join(promptsDir(),slug+'.json'),JSON.stringify({name:name,text:text,ts:Date.now()},null,2)); }catch(e){} return slug; }
function renamePromptLib(slug,name){ const cur=getPromptLib(slug); if(!cur)return null; const ns=savePromptLib(name,cur.text); if(ns!==slug){try{fs.unlinkSync(path.join(promptsDir(),slug+'.json'));}catch(e){}} return ns; }
function deletePromptLib(slug){ try{ fs.unlinkSync(path.join(promptsDir(),slug+'.json')); }catch(e){} }
// Enregistrement des modules dans le registre du routeur (strangler-fig : cohabite avec l'ancien dispatch)
uiRouter.REGISTRY['photo.look']={ id:'photo.look', parent:'photo', title:'📸 PHOTO · Look', owner:'PHOTO', next:'photo.image',
  gate:()=>{ try{ return !!ensureProj().look.source; }catch(e){ return false; } }, // ➡ Suivant actif seulement si un look est choisi
  help:'Étape LOOK : la vignette montre le look actif (ou la référence active si pas de look). Choisis une source (✨ Nouveau / 🖼 Galerie / 📤 Upload), configure tenue/décor/format/nombre, 🎯 change la référence ou ✍️ édite le prompt. Tout est conservé dans le brouillon. ➡ Suivant mène à l\'image.',
  render:()=>photoLookView() };
uiRouter.REGISTRY['photo.lookgal']={ id:'photo.lookgal', parent:'photo.look', title:'🖼 Galerie → Look', owner:'PHOTO',
  help:'Choisis un look existant de la galerie comme base. Navigue ‹ › puis ✅.',
  render:()=>photoLookGalView() };
uiRouter.REGISTRY['photo.image']={ id:'photo.image', parent:'photo.look', title:'📸 Image', owner:'PRODUCTION', next:'video.source',
  gate:()=>{ try{ return ensureProj().image.validated!=null; }catch(e){ return false; } }, // [UN MOTEUR] ➡ Suivant CONTINUE le MÊME pipeline vers la vidéo (pas une section séparée)
  help:'Étape IMAGE : la vignette montre l\'image en cours/sélectionnée. Vérifie le coût, 💲 pour générer (confirmation requise — rien n\'est dépensé sans ton accord). Navigue, valide celle à garder (slice image), puis ➡ Suivant vers la Vidéo.',
  render:()=>photoImageView() };
uiRouter.REGISTRY['photo.ref']={ id:'photo.ref', parent:'photo.look', title:'🎯 Référence', owner:'PHOTO',
  help:'Référence Imany active (vignette). Remplace-la depuis la galerie ou par upload : l\'aperçu se met à jour immédiatement et elle s\'applique aux prochaines générations.',
  render:()=>photoRefView() };
uiRouter.REGISTRY['photo.refgal']={ id:'photo.refgal', parent:'photo.ref', title:'🖼 Galerie → Référence', owner:'PHOTO',
  help:'Navigue dans la galerie et choisis le look à définir comme référence active.',
  render:()=>photoRefGalView() };
uiRouter.REGISTRY['photo.prompt']={ id:'photo.prompt', parent:'photo.look', title:'✍️ Prompt', owner:'PHOTO',
  help:'Prompt utilisé à la génération. Pré-rempli avec le prompt par défaut ; édite-le (il est enregistré dans le brouillon), charge-en un de ta bibliothèque, ou enregistre-le pour le réutiliser.',
  render:()=>photoPromptView() };
uiRouter.REGISTRY['photo.promptlib']={ id:'photo.promptlib', parent:'photo.prompt', title:'📚 Bibliothèque prompts', owner:'PHOTO',
  help:'Tes prompts enregistrés. Touche-en un pour l\'utiliser dans ce projet.',
  render:()=>photoPromptLibView() };
// [C7] vue prompt de propagation (re-éditabilité) — bloc média
function photoPropagateView(){
  const p=ensureProj(); const m=wsMedia(p); const sl=(projPending&&projPending.slice)||'?';
  const labels={ref:'la référence',look:'le look',decor:'le décor',prompt:'le prompt',nb:'le nombre d\'images',image:'l\'image'};
  const downs=projDownstream(sl).filter(s=>(s==='image'&&p.image.urls.length)||(s==='video'&&((p.video.script&&p.video.script.text)||p.video.media)));
  const dl=downs.map(s=>({image:'l\'image générée',video:'la vidéo'}[s]||s)).join(' et ');
  const cap=cockpitHeader(p)+'──────────\n⚠️ <b>Tu as modifié '+escH(labels[sl]||sl)+'.</b>\n'
    +(dl?('Étapes en aval déjà présentes : <b>'+escH(dl)+'</b>.\n\nQue faire ?'):'Que faire ?');
  return {image:m,raw:false,caption:cap,rows:[
    [{text:'✅ Conserver l\'aval',cb:'PX_KEEP'}],
    [{text:'🔄 Mettre à jour',cb:'PX_UPDATE'}],
    [{text:'♻️ Régénérer l\'aval',cb:'PX_REGEN'}],
  ]};
}
uiRouter.REGISTRY['photo.propagate']={ id:'photo.propagate', parent:'photo.look', title:'⚠️ Impact', owner:'PRODUCTION', media:true,
  help:'Tu as modifié une étape dont dépend l\'aval (image/vidéo déjà là). Conserver = garder tel quel · Mettre à jour = resynchroniser sans régénérer · Régénérer = refaire l\'aval (coût reconfirmé).',
  render:()=>photoPropagateView() };
try{ MEDIA_MODULES['photo.propagate']=1; }catch(e){}
// STUDIO · Bibliothèque de prompts (texte) — gestion CRUD (renommer/supprimer) ; création depuis le workflow
function studioPromptsView(){
  const list=listPromptLib();
  let cap='📝 <b>STUDIO · Bibliothèque de prompts</b> ('+list.length+')\n';
  const rows=[];
  if(!list.length)cap+='\n(aucun prompt — depuis 📸 Photo › ✍️ Prompt › 💾 Enregistrer)';
  else { cap+='\nGère tes prompts réutilisables :'; list.slice(0,10).forEach(x=>{ rows.push([{text:'📝 '+x.name,cb:'SP_VIEW_'+x.slug},{text:'✏️',cb:'SP_REN_'+x.slug},{text:'🗑',cb:'SP_DEL_'+x.slug}]); }); }
  return {caption:cap,rows};
}
uiRouter.REGISTRY['studio.prompts']={ id:'studio.prompts', parent:'studio', title:'📝 Prompts', owner:'STUDIO',
  help:'Bibliothèque de prompts personnalisés : renommer (✏️), supprimer (🗑), réutiliser. On en crée un depuis le workflow Photo (✍️ Prompt › 💾 Enregistrer).',
  render:()=>studioPromptsView() };
// ─────────────────────────────────────────────────────────────────────────────
// [v5] BIBLIOTHÈQUE EN BLOC MÉDIA (non destructive) — LOOKS & HISTORIQUE rendus DANS le cockpit
// (plus de bloc legacy qui casse la continuité). Vue annexe : on consulte/réutilise sans perdre le projet.
// ─────────────────────────────────────────────────────────────────────────────
let _slLooksIdx=0;
function studioLooksView(){ // parcourir la galerie de looks DANS le bloc média ; « Utiliser » = source du projet (non destructif)
  const p=ensureProj(); const list=looksList();
  if(!list.length)return {image:wsMedia(p),raw:false,caption:cockpitHeader(p)+'👗 <b>LOOKS</b> — bibliothèque vide.\n\nCrée un look via 📸 PHOTO.',rows:[[{text:'◀️ Retour',cb:'WS_RESUME'}]]};
  if(_slLooksIdx>=list.length||_slLooksIdx<0)_slLooksIdx=0;
  const f=path.join(getLooksDir(),list[_slLooksIdx]);
  const cap=cockpitHeader(p)+'👗 <b>LOOKS</b> · '+(_slLooksIdx+1)+'/'+list.length+'\n🖼 <i>'+escH(list[_slLooksIdx])+'</i>\n\nVue bibliothèque (consultation). « Utiliser » applique ce look au projet en cours, sans rien perdre.';
  return {image:f,raw:false,caption:cap,rows:[
    [{text:'‹',cb:'SL_PREV'},{text:(_slLooksIdx+1)+'/'+list.length,cb:'PL_NOOP'},{text:'›',cb:'SL_NEXT'}],
    [{text:'👗 Utiliser ce look',cb:'SL_USE'}],
    [{text:'◀️ Retour',cb:'WS_RESUME'}],
  ]};
}
function studioHistoriqueView(){ // historique des productions DANS le bloc média (lecture)
  const p=ensureProj(); let files=[];
  try{ const real=fs.realpathSync(path.join(BASE,'outputs','generations')); files=fs.readdirSync(real).filter(f=>/\.jpg$/i.test(f)).map(f=>({f,t:fs.statSync(path.join(real,f)).mtimeMs})).sort((a,b)=>b.t-a.t).slice(0,12).map(x=>x.f); }catch(e){}
  const lignes=files.length?files.map((x,i)=>(i+1)+'. '+x.replace(/\.jpg$/,'')).join('\n'):'(vide)';
  const cap=cockpitHeader(p)+'🕘 <b>HISTORIQUE</b> · '+files.length+' récentes\n'+escH(lignes.slice(0,700))+'\n\n📱 Fichiers : iCloud › podcast-outputs/generations';
  return {image:wsMedia(p),raw:false,caption:cap,rows:[[{text:'◀️ Retour',cb:'WS_RESUME'}]]};
}
uiRouter.REGISTRY['studio.looks']={ id:'studio.looks', parent:'studio', title:'👗 Looks', owner:'STUDIO', media:true,
  help:'Bibliothèque de looks (consultation, non destructive). Navigue ‹ › ; « Utiliser » applique le look au projet en cours sans perdre le travail.',
  render:()=>studioLooksView() };
uiRouter.REGISTRY['studio.historique']={ id:'studio.historique', parent:'studio', title:'🕘 Historique', owner:'STUDIO', media:true,
  help:'Historique des productions récentes (lecture). Vue annexe : ne casse pas le projet en cours.',
  render:()=>studioHistoriqueView() };
try{ MEDIA_MODULES['studio.looks']=1; MEDIA_MODULES['studio.historique']=1; }catch(e){}
// [v7] Bibliothèques restantes en VUE MÉDIA (lecture, non destructive) — entrer ne casse plus la continuité.
function studioLibView(title,lines,extraRows){ const p=ensureProj();
  const body=(lines&&lines.length)?lines.slice(0,14).map(s=>'• '+s).join('\n'):'(vide)';
  return {image:wsMedia(p),raw:false,caption:cockpitHeader(p)+title+'\n'+escH(body.slice(0,800)),rows:(extraRows||[]).concat([[{text:'◀️ Retour',cb:'WS_RESUME'}]])};
}
function studioReferencesView(){ let r='—';try{r=refLabel();}catch(e){} return studioLibView('🎯 <b>RÉFÉRENCES</b>\nRéférence active : <b>'+escH(r)+'</b>',[ 'La référence se change dans un projet (🎯 dans le workspace).' ]); }
function studioDecorsView(){ let lb={envs:{}};try{lb=nlMod().readLookbook();}catch(e){} const l=Object.keys(lb.envs||{}).map(k=>(lb.envs[k].label||k)); return studioLibView('🌆 <b>DÉCORS</b> · '+l.length,l); }
function studioModelesView(){ const l=listStyles().map(f=>f.replace(/\.json$/,'')); return studioLibView('📂 <b>MODÈLES</b> · '+l.length,l); }
function studioPersonasView(){ let pr={profiles:{}};try{pr=loadPersonas();}catch(e){} const l=Object.keys(pr.profiles||{}).map(k=>pr.profiles[k].name+(k===pr.active?' (actif)':'')); return studioLibView('👤 <b>PERSONAS</b> · '+l.length,l); }
['references','decors','modeles','personas'].forEach(s=>{ uiRouter.REGISTRY['studio.'+s]={ id:'studio.'+s, parent:'studio', owner:'STUDIO', media:true, title:'🏛 '+s,
  render:()=>({references:studioReferencesView,decors:studioDecorsView,modeles:studioModelesView,personas:studioPersonasView}[s]()) }; MEDIA_MODULES['studio.'+s]=1; });

// ═════════════════════════════════════════════════════════════════════════════
// [L0-2b] WORKFLOW VIDÉO migré dans le WORKSPACE MÉDIA (même contrat bloc unique).
// PHOTO → Look/Image → VIDÉO(source) → Script → Montage → Légende → Export. Adossé au draft/proj (E114/E115).
// Strangler-fig : la génération réelle (script Anthropic, lipsync Kling) est BRANCHÉE derrière confirmation (non lancée en test).
// ═════════════════════════════════════════════════════════════════════════════
function videoMedia(p){ // média actif pour la vidéo : explicite, sinon image validée, sinon look, sinon réf
  try{ if(p.video.media&&fs.existsSync(p.video.media))return p.video.media; }catch(e){}
  try{ if(p.image&&p.image.urls.length){ const i=(p.image.validated!=null?p.image.validated:p.image.idx); const u=p.image.urls[i]; if(u){ const lf=nlLocal(i); if(lf&&fs.existsSync(lf))return lf; if(String(u).startsWith('/')&&fs.existsSync(u))return u; } } }catch(e){}
  const lf=lookFile(p); if(lf)return lf;
  try{ return refThumb(); }catch(e){} return null;
}
function videoMediaLabel(p){ return mediaLabelOf(p); } // [v6] libellé métier (plus de nom de fichier)
// En-tête de contexte VIDÉO (point 3) : 📁 Projet · 🖼 Média actif · 🎯 Réf · ✍️ Script · étape.
function wsHeaderV(p,stepLabel){
  return '📁 <b>'+escH(projName(p))+'</b> · '+escH(stepLabel)+'\n'
    +'🖼 Média : '+escH(mediaLabelOf(p))+' · 🎯 '+escH(refLabel())+'\n'
    +'✍️ Script : '+escH((p.video.script&&p.video.script.name)||'—')+'\n──────────\n';
}
function videoCost(p){ try{ const c=estimateCost((p.video&&p.video.duration)||'23s'); return c; }catch(e){ return {parts:1,total:0,cr:null}; } }
// Bibliothèque de SCRIPTS : scripts/<persona>/*.json (même mécanique que les prompts)
function scriptsDir(){ const d=path.join(BASE,'scripts_lib',_persona()); try{fs.mkdirSync(d,{recursive:true});}catch(e){} return d; }
function listScriptLib(){ try{ return fs.readdirSync(scriptsDir()).filter(f=>/\.json$/.test(f)).map(f=>{ try{ const o=JSON.parse(fs.readFileSync(path.join(scriptsDir(),f),'utf8')); return {slug:f.replace(/\.json$/,''),name:o.name||f.replace(/\.json$/,''),text:o.text||'',ts:o.ts||0}; }catch(e){ return null; } }).filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0)); }catch(e){ return []; } }
function getScriptLib(slug){ try{ const o=JSON.parse(fs.readFileSync(path.join(scriptsDir(),slug+'.json'),'utf8')); return {slug:slug,name:o.name||slug,text:o.text||''}; }catch(e){ return null; } }
function saveScriptLib(name,text){ const slug=promptSlug(name); try{ fs.writeFileSync(path.join(scriptsDir(),slug+'.json'),JSON.stringify({name:name,text:text,ts:Date.now()},null,2)); }catch(e){} return slug; }

function videoSourceView(){ // POINT D'ENTRÉE VIDÉO — 5 sources ; sait d'où vient le média actif
  wizardActive=true; const p=ensureProj(); p.step='video'; p.video.step='source';
  if(!genState.activeDraftId){try{autosaveDraft();p.draftId=genState.activeDraftId;}catch(e){}} // 📁 projet stable dès l'entrée VIDÉO
  const m=videoMedia(p); const lab={projlook:'look du projet',gallook:'look galerie',newlook:'nouveau look',genimage:'image générée',upload:'image uploadée'}[p.video.source]||'(auto : image/look actif)';
  const cap=wsHeaderV(p,'VIDÉO · Source')
    +'🎬 <b>D\'où part la vidéo ?</b>\nSource : <b>'+escH(lab)+'</b>\n'
    +(m?'Média actif détecté — ➡ Suivant pour le script.':'Choisis une source (aucun média actif).');
  const rows=[
    [{text:(p.video.source==='projlook'?'✅ ':'')+'👗 Look du projet',cb:'VS_PROJLOOK'},{text:(p.video.source==='genimage'?'✅ ':'')+'🖼 Image générée',cb:'VS_GENIMAGE'}],
    [{text:'🖼 Look galerie',go:'video.srcgal'},{text:(p.video.source==='newlook'?'✅ ':'')+'✨ Nouveau look',cb:'VS_NEWLOOK'}],
    [{text:'📤 Uploader une image',cb:'VS_UPLOAD'}],
  ];
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
function videoSrcGalView(){ // source = look existant de la galerie (média, en place)
  const p=ensureProj(); const list=looksList();
  if(!list.length)return {image:wsMedia(p),raw:false,caption:wsHeaderV(p,'VIDÉO · Galerie')+'🖼 <b>Galerie vide</b>.',rows:[]};
  if(refGalIdx>=list.length||refGalIdx<0)refGalIdx=0;
  const f=path.join(getLooksDir(),list[refGalIdx]);
  const cap=wsHeaderV(p,'VIDÉO · Galerie')+'🖼 <b>'+(refGalIdx+1)+'/'+list.length+'</b> · <i>'+escH(list[refGalIdx])+'</i>\n\nNavigue ‹ › puis ✅ utilise ce look.';
  const rows=[[{text:'‹',cb:'VS_GPREV'},{text:(refGalIdx+1)+'/'+list.length,cb:'PL_NOOP'},{text:'›',cb:'VS_GNEXT'}],[{text:'✅ Utiliser ce look',cb:'VS_GSET'}]];
  return {image:wsMedia(p,f),raw:false,caption:cap,rows};
}
function videoScriptView(){ // SCRIPT : visible, éditable, sauvegardable (slice + biblio)
  const p=ensureProj(); p.step='video'; p.video.step='script'; const m=videoMedia(p); const txt=(p.video.script&&p.video.script.text)||'';
  const editing=(state==='ws_vscript_edit_wait'); const naming=(state==='ws_vscript_save_wait');
  const preview=txt.length>320?(txt.slice(0,320)+'…'):txt;
  const cap=wsHeaderV(p,'SCRIPT')
    +'✍️ <b>Script vidéo</b> : '+escH((p.video.script&&p.video.script.name)||'—')+'\n'
    +(editing?'⏳ <b>Envoie le texte du script…</b>':(naming?'⏳ <b>Envoie le nom à donner…</b>':'<code>'+escH(preview||'(vide — écris-le, charge-en un, ou 🤖 génère)')+'</code>'));
  const rows=[
    [{text:'✍️ Éditer',cb:'VP_EDIT'},{text:'🤖 Générer 💲',cb:'VP_GEN'}],
    [{text:'📚 Charger',go:'video.scriptlib'},{text:'💾 Enregistrer',cb:'VP_SAVE'}],
  ];
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
function videoScriptLibView(){
  const p=ensureProj(); const m=videoMedia(p); const list=listScriptLib();
  let cap=wsHeaderV(p,'SCRIPT · Bibliothèque')+'📚 <b>Mes scripts</b> ('+list.length+')\n';
  const rows=[];
  if(!list.length)cap+='\n(aucun script enregistré — 💾 enregistre le script courant)';
  else list.slice(0,8).forEach(x=>{ cap+='\n• '+escH(x.name); rows.push([{text:'📝 '+x.name,cb:'VP_USE_'+x.slug}]); });
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
function videoMontageView(){ // MONTAGE : résumé + bridge éditeur avancé (sous-titres/zoom/musique)
  const p=ensureProj(); p.step='video'; p.video.step='montage'; const m=videoMedia(p); let s={};try{s=readSubs();}catch(e){}
  const cap=wsHeaderV(p,'MONTAGE')
    +'🎬 <b>Montage</b>\n'
    +'💬 Sous-titres : '+(s.subs?('ON · '+escH(s.font||'')+' '+(s.size||'')+'px'):'OFF')+'\n'
    +'🎨 Réglages image/zoom/musique : éditeur avancé.\n'
    +(p.video.montage&&p.video.montage.touched?'✏️ Montage personnalisé.':'Réglages par défaut — ➡ Suivant ou 🎨 Éditer.');
  const rows=[[{text:'🎨 Éditer (avancé)',cb:'VM_EDIT'}]];
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
function videoLegendeView(){ // LÉGENDE : éditable (slice)
  const p=ensureProj(); p.step='video'; p.video.step='legende'; const m=videoMedia(p); const l=p.video.legende||{};
  const editing=(state==='ws_vleg_edit_wait');
  const cap=wsHeaderV(p,'LÉGENDE')
    +'🏷 <b>Légende</b>\n'
    +(editing?'⏳ <b>Envoie le texte de la légende…</b>':('Courte : <i>'+escH(l.courte||'—')+'</i>\nTags : <i>'+escH(l.tags||'—')+'</i>\n\nÉdite la légende, ou ➡ Suivant vers l\'export.'));
  const rows=[[{text:'✍️ Éditer la légende',cb:'VL_EDIT'}]];
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
function videoExportView(){ // EXPORT : récap coût + confirmation OBLIGATOIRE (génération hors test)
  const p=ensureProj(); p.step='video'; p.video.step='export'; const m=videoMedia(p); const c=videoCost(p);
  let cap=wsHeaderV(p,'Finalisation')
    +'🚀 <b>Vidéo Final HD</b>\n'
    +'👁 Aperçu prêt. Lance la version finale quand tu es prête.\n';
  const rows=[];
  if(p.video.confirming){
    cap+='\n✨ <b>Lancer la vidéo Final HD ?</b>\nGénération payante'+(c.cr?(' (~'+c.cr+' cr)'):'')+' · ⏳ '+prodTimeLabel();
    rows.push([{text:'✅ Lancer Final HD',cb:'VX_GO'},{text:'◀️ Annuler',cb:'VX_NO'}]);
  } else {
    rows.push([{text:'✨ Lancer la vidéo Final HD',cb:'VX_GEN'}]);
  }
  return {image:wsMedia(p,m),raw:false,caption:cap,rows};
}
// Enregistrement des modules VIDÉO (workspace média)
uiRouter.REGISTRY['video.source']={ id:'video.source', parent:'photo.image', title:'🎬 VIDÉO · Source', owner:'VIDÉO', next:'video.script',
  gate:()=>{ try{ return !!videoMedia(ensureProj()); }catch(e){ return false; } },
  help:'Point d\'entrée vidéo : choisis la source du média (look du projet, look galerie, nouveau look, image générée, image uploadée). Le média actif est affiché. ➡ Suivant mène au script.',
  render:()=>videoSourceView() };
uiRouter.REGISTRY['video.srcgal']={ id:'video.srcgal', parent:'video.source', title:'🖼 Galerie → Vidéo', owner:'VIDÉO', render:()=>videoSrcGalView() };
uiRouter.REGISTRY['video.script']={ id:'video.script', parent:'video.source', title:'✍️ Script', owner:'VIDÉO', next:'video.montage',
  gate:()=>{ try{ return !!((ensureProj().video.script||{}).text||'').trim(); }catch(e){ return false; } },
  help:'Script de la vidéo : visible, éditable (✍️), générable (🤖, payant — confirmation), sauvegardable (💾) et rechargeable (📚). ➡ Suivant mène au montage.',
  render:()=>videoScriptView() };
uiRouter.REGISTRY['video.scriptlib']={ id:'video.scriptlib', parent:'video.script', title:'📚 Bibliothèque scripts', owner:'VIDÉO', render:()=>videoScriptLibView() };
uiRouter.REGISTRY['video.montage']={ id:'video.montage', parent:'video.script', title:'🎬 Montage', owner:'VIDÉO', next:'video.legende',
  help:'Montage : sous-titres / image / zoom / musique. 🎨 Éditer ouvre l\'éditeur avancé dans le même bloc. ➡ Suivant mène à la légende.',
  render:()=>videoMontageView() };
uiRouter.REGISTRY['video.legende']={ id:'video.legende', parent:'video.montage', title:'🏷 Légende', owner:'VIDÉO', next:'video.export',
  help:'Légende de publication : courte, longue, tags. Éditable. ➡ Suivant mène à l\'export.',
  render:()=>videoLegendeView() };
uiRouter.REGISTRY['video.export']={ id:'video.export', parent:'video.legende', title:'🚀 Export', owner:'VIDÉO',
  help:'Export final : récap coût + confirmation OBLIGATOIRE avant toute dépense. Rien n\'est généré sans ton accord explicite.',
  render:()=>videoExportView() };
// [MC2] marque tous les modules workspace comme MÉDIA -> la ceinture routeur leur interdit le repli texte
try{ Object.keys(MEDIA_MODULES).forEach(k=>{ if(uiRouter.REGISTRY[k]) uiRouter.REGISTRY[k].media=true; }); }catch(e){}
// ─────────────────────────────────────────────────────────────────────────────
// [fix/root-causes-v1 · C1+C4] COCKPIT MÉDIA UNIQUE — les MENUS (accueil + sections) deviennent
// eux aussi des blocs MÉDIA rendus sur l'UNIQUE bloc cockpit (newlook.mediaId) : zéro nouveau bloc
// à l'entrée PHOTO/VIDÉO et au retour accueil ; en-tête de contexte permanent ; projet conservé.
// On enveloppe le render existant (boutons inchangés) : + image (wsMedia) + en-tête + media:true.
[ 'home','photo','video','studio','recents' ].forEach(id=>{
  const mod=uiRouter.REGISTRY[id]; if(!mod||mod._wrapped)return;
  const orig=mod.render; mod._wrapped=true; mod.media=true; MEDIA_MODULES[id]=1;
  mod.render=(ctx)=>{
    try{ const out=orig?orig(ctx)||{}:{}; let p=null; try{p=ensureProj();}catch(e){}
      return { image: wsMedia(p), raw:false, caption: cockpitHeader(p)+(out.caption||mod.title||''), rows: out.rows||[] };
    }catch(e){ return { image: wsPlaceholder(), raw:false, caption:(mod.title||id), rows:[] }; }
  };
});
// Toast (petite bulle, zéro message) — utilise le dernier callback_query
let lastCbId=null,cbAnswered=false;
async function toast(text){try{if(lastCbId){cbAnswered=true;await tg('answerCallbackQuery',{callback_query_id:lastCbId,text:text});}}catch(e){}}
// [fix/restart-feedback] accusé UNIVERSEL : toast si clic bouton (callback dispo), sinon (commande TAPÉE = pas de callback)
// un message bref éphémère. Corrige /restart /stop /status qui ne renvoyaient AUCUN retour quand tapés.
async function ack(text){ try{ if(lastCbId){ await toast(text); } else { await system(text); } }catch(e){} }
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
async function recapGo(auto){
  wizardActive=true; /*[L0-1e] wizard vidéo démarré*/
  if(genBusy()){await send('⏳ Une génération est déjà en cours — /stop d\'abord.');return;}
  await ensureTopic();
  const dur=gw.duration||'23s';const plan=WF.planParts(parseInt(dur,10)||23);
  genJob={duration:dur,parts:plan.n,words:plan.words,subjectMode:gw.subjectMode,topicCat:gw.topicCat||null,topic:gw.topic||null,styleName:gw.styleName,look:gwLook(),audio:null,running:false,auto:!!auto}; /*[C3] auto = aller direct au récap coût*/
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
    if(genJob.auto)await genAfterScript(); /*[C3] Auto : direct au récap coût (script auto-validé)*/ else await showScriptCard();
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
  genAbort=false;genStep='';state='idle';genJob=null;clearActiveDraft(); // succès -> le brouillon devient « Terminé » (E113)
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
// [flux-look] ÉTAPE LOOK (Auto + Express) : AVANT le script, choisir la SOURCE du look — tout dans le cockpit, en place.
async function showLookSource(mode){
  if(mode)createFlow={mode:mode};
  const cur=gwLook();const av=cur&&fs.existsSync(cur)?cur:null;
  const cap='🎨 <b>LOOK</b> — d\'où vient ta star ?'+(av?'\n<i>look courant prêt — ou choisis-en un autre</i>':'');
  const rows=[
    [{text:'✨ Nouveau look',callback_data:'CL_NEW'}],
    [{text:'🖼 Galerie',callback_data:'CL_GAL'},{text:'📤 Upload',callback_data:'CL_UP'}],
    ...(av?[[{text:'✅ Garder le look courant',callback_data:'CL_KEEP'}]]:[]),
    [{text:'⛔ Stop',callback_data:'CL_STOP'}],
  ];
  if(av)await cockpitPhoto(av,cap,rows); else await cardMenu(cap,rows);
}
async function resumeCreate(){ /*[flux-look] look validé -> suite normale du mode (script -> récap/maquette -> GO)*/
  const m=createFlow&&createFlow.mode;createFlow=null;createUploadPath=null;galForRecap=false;
  await recapGo(m==='auto');
}
// [C3] CRÉER = point d'entrée unique génération -> choix du mode (en place)
async function showCreer(){
  await cardMenu('🚀 <b>CRÉER</b> — choisis le mode :',[
    [{text:'⚡ Express',callback_data:'CREER_EXPRESS'}],
    [{text:'✏️ Sur-mesure',callback_data:'CREER_SURMESURE'}],
    [{text:'🤖 Auto',callback_data:'CREER_AUTO'}],
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
  if(!after){await send('⚠️ Aperçu indispo : aucun _raw_p*.mp4 dans outputs/ (tape /menu).');return;}
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
  if(typeof R0DRY!=='undefined'&&R0DRY){ const r=_dryTg('editMessageMedia',{message_id:mid,caption:caption}); return !!(r&&r.ok); }
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
/*[stale-fix] Au redemarrage, resLoad() restaure des message_id de la session precedente. Les editer en place vise un message ENTERRE dans l'historique (Etoile ne voit RIEN). On marque ces ids "perimes" : au 1er affichage de chaque bloc, on supprime l'ancien et on en recree un FRAIS, visible en bas. Ensuite, edition en place normale.*/
let staleBloc={cockpit:false,photo:false,results:false};
async function freshBloc(which,getMid,clearMid){ if(staleBloc[which]){staleBloc[which]=false;const m=getMid();if(m){await delMsg(m);clearMid();}} }
function cap1024(s){s=String(s||'');return s.length>1024?s.slice(0,1000)+'…':s;}
async function editVideoKb(mid,fp,caption,rows){
  if(typeof R0DRY!=='undefined'&&R0DRY){ const r=_dryTg('editMessageMedia',{message_id:mid,caption:caption}); return !!(r&&r.ok); }
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
  await freshBloc('cockpit',()=>cockpit.mid,()=>cockpit.mid=null); /*[stale-fix]*/
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
  await freshBloc('cockpit',()=>cockpit.mid,()=>cockpit.mid=null); /*[stale-fix] cockpit.mid=null -> renvoie false -> le caller (cardMenu) cree un message frais*/
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
  if(j.mids){results.mid=j.mids.results||null;if(results.mid)staleBloc.results=true;if(j.mids.video){cockpit.mid=j.mids.video;staleBloc.cockpit=true;}if(j.mids.photo){newlook.mediaId=j.mids.photo;staleBloc.photo=true;}} /*[stale-fix] les ids survivent au restart mais sont marques perimes : recree frais au 1er affichage (sinon edition invisible dans l'historique)*/
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
  await freshBloc('results',()=>results.mid,()=>results.mid=null); /*[stale-fix]*/
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
// ═════════════════════════════════════════════════════════════════════════════
// [cockpit-v4] MONTAGE STRANGLER-FIG (E107) — nouveau cockpit À CÔTÉ de l'ancien, derrière /v4.
//   N'altère PAS le flux par défaut : activé seulement après /v4 (v4active), quitté par /menu.
//   Réutilise les primitives d'envoi existantes (sendPhotoKb/editPhotoKb/editVideoKb/tg) ; image BRUTE.
//   Génération STUB GRATUITE (copie de looks existants) — AUCUNE dépense ; la vraie génération payante
//   sera branchée derrière le gate QC au moment de la bascule. Tout requis en LAZY (n'impacte pas le boot).
// ═════════════════════════════════════════════════════════════════════════════
let v4active=false, _v4=null;
let r0Mid=null, r0Type=null, r0Await=null; /*[RÉALISATION] pointeurs transitoires reconstructibles (E122) : bloc /v4r courant (id+type texte|photo|vidéo) + saisie texte en attente*/
let r0Screen='home', r0Section=null, r0Block=null, r0Ret=null; /*[RÉALISATION] état de navigation TRANSITOIRE (reconstructible, non critique) : écran courant + section Studio + bloc édité + retour-auto (flux Vidéo→Photo→Vidéo)*/
let r0Pending=null, r0GalKind='image', r0GalAll=false, r0QuitFrom=null, r0SrcReturn=null, r0SubReturn=null, r0GalDel=false, r0ResFrom=null, r0GalRole='select', r0VerKeys=null, r0VerReturn=null; /*[ANO-ARCH-VERSIONING] clés du champ en cours d'historique + bloc de retour*/ /*[RÉALISATION] génération en attente (coût) + filtres galerie + rôle galerie (select|history, G1) + retour « quitter » + retour après choix de source. Transitoires.*/
let r0Page=0; /*[PAGINATION] page courante des grilles (galerie/historique/récents/archives/prêt-à-poster). Transitoire, remise à 0 hors pagination.*/
const R0_PAGE=6; /*[Etoile] taille de page = 6 vignettes/projets par écran (au lieu de 9), sur TOUTES les grilles*/
let r0MediaPath=null, r0Busy=false; /*[RÉALISATION] fichier média actuellement AFFICHÉ (pour remplacer l'image quand elle change) + verrou anti double-génération.*/
let r0Generating=false, r0GenStep=''; /*[🔴3/4 — H13] état « génération en cours » : confirm2 masque Oui/Annuler + montre l'avancement (aucun re-clic).*/
// [VERROU GÉNÉRATION — Etoile] flag FICHIER posé au DÉBUT de toute génération réelle, levé à la FIN. Tant qu'il existe -> AUCUN deploy/restart autorisé.
//   (la procédure de déploiement vérifie ce fichier ; au boot, un flag orphelin = génération tuée par un redémarrage -> message d'incident, jamais de retour silencieux.)
const R0_GENLOCK=path.join(BASE,'.v4r_generating');
function r0GenLock(on,kind){ try{ if(on){ fs.writeFileSync(R0_GENLOCK, JSON.stringify({kind:kind||'?', at:Date.now(), pid:process.pid})); } else { try{ fs.unlinkSync(R0_GENLOCK); }catch(e){} } }catch(e){} }
// [RENDUS PERSISTANTS] mids des RENDUS FINAUX (photo/vidéo générée) postés comme messages DÉDIÉS : ils RESTENT dans le fil,
//   JAMAIS supprimés ni édités. Distincts du COCKPIT (r0Mid, éphémère/édité en place). /v4r·restart·changement de projet ne les touchent pas.
let r0RenderMids=[];
function v4Placeholder(){ try{ const l=looksList(); if(l.length) return path.join(getLooksDir(), l[0]); }catch(e){} try{ return nlRefFile(); }catch(e){} return null; }
function v4Generate(flow, m){ // (legacy stub gratuit — conservé en secours, non utilisé quand imageBackend est branché)
  try{ const PS=require('./ui/project_store'); const looks=looksList().slice(0, (m.parametres&&m.parametres.nb_images)||1);
    return looks.map((f,i)=> PS.importFile(BASE, _persona(), m.projectId, 'images', path.join(getLooksDir(), f), 'cand'+i+'.jpg')); }
  catch(e){ jlog('v4Generate err '+e.message); return []; }
}
// [run réel — IMAGE] backend Seedream RÉEL, ASYNC, GATÉ : appelé UNIQUEMENT via GEN_CONFIRM (clic « 💲 Lancer » d'Etoile).
// Télécharge les images dans le DOSSIER PROJET (persistance, A6). Aucune dépense au boot/déploiement.
async function v4ImageBackend(m){
  if(!m||!m.projectId) return [];
  const PS=require('./ui/project_store');
  const {generateLook}=nlMod();
  const env=(m.look&&m.look.decor)||newlook.env||'bougies';
  const cat=(m.look&&m.look.category)||null;
  const count=Math.max(1,Math.min(6,(m.parametres&&m.parametres.nb_images)||1));
  jlog('🎨 v4 IMAGE RÉELLE (eco x'+count+') — déclenchée par confirmation Etoile');
  const r=await generateLook({category:cat,env:env,extra:(m.look&&m.look.tenue)||null,mode:'eco',count:count},mm=>{try{jlog('v4 gen: '+mm);}catch(e){}});
  const dir=path.join(PS.projectDir(BASE,_persona(),m.projectId),'images'); try{fs.mkdirSync(dir,{recursive:true});}catch(e){}
  const rels=[]; const cp=require('child_process');
  (r&&r.urls||[]).forEach((u,i)=>{ const f='gen_'+Date.now()+'_'+(i+1)+'.jpg'; try{ cp.execSync('curl -s -o "'+path.join(dir,f)+'" "'+u+'"'); if(fs.existsSync(path.join(dir,f)))rels.push('images/'+f);}catch(e){jlog('v4 dl err '+e.message);} });
  jlog('🎨 v4 IMAGE : '+rels.length+' image(s) dans le dossier projet');
  return rels;
}
function cockpitV4(){
  if(_v4) return _v4;
  const V4=require('./ui/cockpit_integration');
  const rk=(rm)=>rm?rm.inline_keyboard:null;
  const prims={
    sendPhoto:(media,caption,rm,raw)=>sendPhotoKb(media,cap1024(caption),rk(rm)),
    editPhoto:async(mid,media,caption,rm,raw)=>{const r=await editPhotoKb(mid,media,cap1024(caption),rk(rm));return r===false?{ok:false}:{ok:true};},
    editCaption:(mid,caption,rm)=>tg('editMessageCaption',{message_id:mid,caption:cap1024(caption),parse_mode:'HTML',...(rm?{reply_markup:rm}:{})}),
    sendVideo:async(media,caption,rm)=>{ try{ const FormData=require('form-data');const form=new FormData();form.append('chat_id',CHAT_ID);form.append('video',fs.readFileSync(media),{filename:'v.mp4',contentType:'video/mp4'});if(caption){form.append('caption',cap1024(caption));form.append('parse_mode','HTML');}if(rm)form.append('reply_markup',JSON.stringify(rm));const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendVideo',{method:'POST',body:form});return await r.json(); }catch(e){ return {ok:false}; } },
    editVideo:async(mid,media,caption,rm)=>{const r=await editVideoKb(mid,media,cap1024(caption),rk(rm));return r===false?{ok:false}:{ok:true};},
  };
  let v4lookbook={}; try{ v4lookbook=nlMod().readLookbook()||{}; }catch(e){}
  let v4libstore=null; try{ v4libstore=require('./ui/cockpit_libstore'); }catch(e){}
  // PHASE VALIDATION UX (Etoile) : génération = STUB GRATUIT (v4Generate) -> ZÉRO dépense même si « 💲 Lancer » est cliqué.
  // Le backend RÉEL Seedream (v4ImageBackend) est prêt ; ré-activé (imageBackend:v4ImageBackend) UNIQUEMENT au run réel, sur go d'Etoile.
  void v4ImageBackend; // prêt pour le run réel
  _v4=V4.createCockpitV4({ prims, base:BASE, persona:_persona(), generate:v4Generate, lookbook:v4lookbook, libstore:v4libstore, libItems:()=>[], placeholder:v4Placeholder(), toast:(t)=>toast(t) });
  return _v4;
}

// ═══ [RÉALISATION — colonne vertébrale /v4r] UN SEUL bloc vivant : édité en place ; recréé (delete+post) seulement
//     sur bascule TEXTE↔PHOTO. Vues PURES = ui/spine_view (testées hors Telegram) ; transport ici.
//     Image affichée UNIQUEMENT si elle existe (jamais de placeholder) ; génération SIMULÉE (zéro dépense). Isolé du legacy/v4. ═══
function _r0(){ return { S:require('./ui/socle'), C:require('./ui/conscience'), SB:require('./ui/spine_block'), NAV:require('./ui/nav'), SC:require('./ui/screens'), INV:require('./ui/inventory'), COST:require('./ui/cockpit_cost'), ENG:require('./ui/engines'), BUD:require('./ui/budget'), PO:require('./ui/photo_opts'), DEF:require('./ui/defaults') }; }
// [#17] MODÈLES PRÉ-ENREGISTRÉS : scripts (library.json) + prompts (prompts/<persona>/*.json) déjà existants — lecture seule.
function _r0Library(){ try{ delete require.cache[require.resolve('./library.json')]; return require('./library.json')||{}; }catch(e){ return {scripts:[]}; } }
function _r0Prompts(persona){ const out=[]; try{ const dir=path.join(BASE,'prompts',persona);
  for(const fn of fs.readdirSync(dir)){ if(!/\.json$/.test(fn)) continue; try{ const j=JSON.parse(fs.readFileSync(path.join(dir,fn),'utf8')); if(j&&j.text) out.push({name:j.name||fn.replace(/\.json$/,''), text:j.text}); }catch(e){} } }catch(e){}
  return out; }
function _r0Outfits(){ try{ delete require.cache[require.resolve('./outfits_catalog.json')]; return require('./outfits_catalog.json'); }catch(e){ return null; } }
// [#26/Etoile] TENUE : expose les catégories du catalogue en LIBELLÉS PROPRES (accentués, sans « #id »). Le mapping moteur (photo_opts) résout le nom de catégorie.
const _R0_TENUE_LABELS={ soiree:'Soirée', business:'Business', casual:'Casual', cosy:'Cosy', ete:'Été', fete:'Fête' };
function _r0LookCats(){ try{ const list=(_r0Outfits()||{}).outfits||[]; const seen={}, out=[];
  for(const o of list){ const c=String(o.cat||'').toLowerCase(); if(c&&!seen[c]){ seen[c]=1; out.push(_R0_TENUE_LABELS[c]||(c.charAt(0).toUpperCase()+c.slice(1))); } }
  return out; }catch(e){ return []; } }
// [SCRIPTS] CATÉGORIES/THÈMES RÉELS issus de la source legacy (workflow.js : niches coach relationnel femmes 20-40).
//   Exposés comme les Tenues : une puce par thème ; le choix oriente la génération de script (draft.video.theme).
const _R0_SCRIPT_CATS = [
  { label: '🚩 Red flags', seed: 'relationship red flags to never ignore' },
  { label: '☠️ Hommes toxiques', seed: 'toxic men patterns and how to spot them' },
  { label: '🔗 Attachement', seed: 'attachment styles anxious avoidant in dating' },
  { label: '💎 Estime de soi', seed: 'self-worth and knowing your value in relationships' },
  { label: '💔 Ruptures', seed: 'healing after a breakup and moving on' },
  { label: '🚪 Il s\'éloigne', seed: 'why men pull away and what it really means' },
  { label: '⚠️ Erreurs dating', seed: 'common dating mistakes women make' },
  { label: '🎭 Narcissiques', seed: 'narcissists in relationships, recognize and leave' },
  { label: '💬 Conseils dating', seed: 'dating coach tips for modern women' },
  { label: '🌊 Situationships', seed: 'situationships and why they keep you stuck' },
  { label: '🌿 Soft life', seed: 'soft life and feminine energy mindset' },
  { label: '👑 Sa valeur', seed: 'knowing your worth and raising your standards' },
];
function _r0ScriptCats(){ return _R0_SCRIPT_CATS; }
// [#27] SOUS-TITRES : valeurs PAR DÉFAUT du style legacy (lecture seule de subtitle_style — JAMAIS d'écriture, verrou intact).
function _r0SubStyle(){ try{ delete require.cache[require.resolve('./subtitle_style')]; require('./subtitle_style');
  // [#2] DÉFAUT affiché = préréglage VERROUILLÉ Etoile, en CLÉS cockpit : Archivo Black (archivo) · 76 (M) · OY 0.370 (valide) · majuscules (mot).
  return { font:'archivo', size:'M', pos:'haut', display:'mot' }; }catch(e){ return { font:'archivo', size:'M', pos:'haut', display:'mot' }; } }
// Estimation du coût d'une génération en attente (pour l'écran de confirmation ET l'enregistrement d'un test réel).
function r0EstFor(persona, pending){ const {COST,S}=_r0(); const f=r0Cur(persona,true); const lb=_r0Lookbook();
  if(pending.kind==='text') return { kind:'text', nb:1, moteur:'Anthropic (claude-sonnet-4-6)', credits:null, eur:0.01, gratuit:false }; // texte = Anthropic, payant
  const params = pending.kind==='video' ? Object.assign({duree:'30s'}, S.getDraft(f,'video')) : Object.assign({nb_images:1, mode:'eco'}, S.getDraft(f,'photo'));
  return COST.estimate(pending.kind==='video'?'video':'image', params, lb); }
function _r0Lookbook(){ try{ delete require.cache[require.resolve('./lookbook.json')]; return require('./lookbook.json'); }catch(e){ return null; } }
function _r0esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function r0Cur(persona, create){ const {S}=_r0(); let cur=S.currentProject(BASE,persona);
  if(!cur&&create){ cur=S.createProject(BASE,persona,{},Date.now()).facts; jlog('[v4r] projet cree '+cur.projectId); }
  return cur?S.loadFacts(BASE,persona,cur.projectId):null; }
// [B] À la reprise : « projet courant » = le plus récent QUI A des médias (sa vraie dernière prod), pas un projet vide.
//   On le « touche » pour qu'il redevienne le projet courant -> l'Accueil affiche sa couverture.
function r0PickCurrent(persona){ const {S,C}=_r0(); const list=S.listProjects(BASE,persona)||[];
  const withMedia=list.find(p=>(C.visibles(p)||[]).length>0); const pick=withMedia||list[0];
  if(pick){ try{ S.saveFacts(BASE,persona,S.loadFacts(BASE,persona,pick.projectId),Date.now()); }catch(e){} jlog('[v4r] reprise projet '+(withMedia?'avec médias ':'')+pick.projectId); }
  return pick; }
function r0DemoPhoto(){ try{ return v4Placeholder(); }catch(e){ return null; } } /*image de démo LOCALE (look) — zéro dépense*/
// [G5 / D7] fusion légende+hashtags pour la COPIE (un geste = texte prêt à coller). Champ hashtags conservé séparément ailleurs.
function r0FuseTags(leg, tags){ return [leg, tags].map(x=>String(x==null?'':x).trim()).filter(Boolean).join('\n\n'); }
// [FIX réel] COUVERTURE du projet = la DERNIÈRE image visible dont le FICHIER EXISTE vraiment (on remonte la liste).
//   Évite « projet vide/démo » quand la toute dernière entrée n'a pas de fichier mais qu'une vraie photo existe plus haut.
// [ANO-SOURCE-EDIT-REVERT] garde-fou ABSOLU : la couverture/source NE DOIT JAMAIS être la référence persona (cuir, sous references/).
const _r0IsRef=p=>/\/references?\//i.test(String(p||''))||/imany_reference\./i.test(String(p||''));
function r0CoverFile(f){ try{ const {C}=_r0(); const imgs=(C.visibles(f)||[]).filter(m=>m&&m.type!=='video');
  for(let i=imgs.length-1;i>=0;i--){ const fp=imgs[i].file; if(fp&&!_r0IsRef(fp)&&fs.existsSync(fp)) return fp; } }catch(e){}
  // [COUVERTURE RÉELLE] projet sans image -> reprend la photo réelle la PLUS récente de tout le patrimoine (jamais une démo, JAMAIS la référence persona).
  try{ const pers=(f&&f.persona)|| (typeof _persona==='function'?_persona():'imany'); const g=r0RealImages(pers,1); if(g&&g[0]&&!_r0IsRef(g[0])&&fs.existsSync(g[0])) return g[0]; }catch(e){}
  return r0DemoPhoto(); }
// [SOURCE UNIQUE DE VÉRITÉ — Etoile] UNE seule image source, lue PARTOUT (Préparer · Aperçu · génération · vidéo · final).
//   Priorité : source ÉPINGLÉE (draft.video.source_file puis draft.photo.source_file) -> sinon le cover (dernière image visible).
//   Dès qu'une photo est sélectionnée/générée/posée, on épingle CETTE image dans les deux drafts -> aucun retour à une référence de base.
function r0SourceFile(f){ try{ const {S}=_r0(); const dv=S.getDraft(f,'video')||{}, dp=S.getDraft(f,'photo')||{};
  for(const fp of [dv.source_file, dp.source_file]){ if(fp&&!_r0IsRef(fp)&&fs.existsSync(fp)) return fp; } }catch(e){} // [ANO-SOURCE-EDIT-REVERT] jamais la référence persona
  return r0CoverFile(f); }
// [ANO-CTX-BLOCK-DEMO-GENERAL] SOURCE RÉELLE STRICTE du projet (drafts épinglés -> images visibles du projet -> patrimoine réel),
//   SANS aucun repli démo/placeholder : renvoie null si AUCUNE image réelle. Utilisée par les écrans d'ÉDITION (block) :
//   un panneau d'édition montre le CONTEXTE PROJET ou RIEN (texte) — JAMAIS une démo étrangère (manteau cuir).
function r0RealSource(f){ try{ const {S,C}=_r0(); const dv=S.getDraft(f,'video')||{}, dp=S.getDraft(f,'photo')||{};
  for(const fp of [dv.source_file, dp.source_file]){ if(fp&&!_r0IsRef(fp)&&fs.existsSync(fp)) return fp; }
  const imgs=(C.visibles(f)||[]).filter(m=>m&&m.type!=='video');
  for(let i=imgs.length-1;i>=0;i--){ const fp=imgs[i].file; if(fp&&!_r0IsRef(fp)&&fs.existsSync(fp)) return fp; }
  const pers=(f&&f.persona)||(typeof _persona==='function'?_persona():'imany');
  const g=r0RealImages(pers,1); if(g&&g[0]&&!_r0IsRef(g[0])&&fs.existsSync(g[0])) return g[0];
}catch(e){} return null; }
// [🔴1 — ÉRADICATION DÉMO] FICHIER de la VRAIE vidéo GÉNÉRÉE du projet (réel, non simulé), SANS aucun repli démo : null si aucune.
//   NB nom = r0RealVideoFile (et NON r0RealVideo) : `async function r0RealVideo(persona,id)` (générateur Kling, ligne ~3399) existe déjà -> collision évitée.
function r0RealVideoFile(f){ try{ const {C}=_r0(); const vids=(C.visibles(f)||[]).filter(m=>m&&m.type==='video');
  for(let i=vids.length-1;i>=0;i--){ const m=vids[i]; if(m&&m.file&&!m.simule&&fs.existsSync(m.file)) return m.file; } }catch(e){} return null; }
// [🔴1] LE PROJET EXISTE-T-IL VRAIMENT ? (au moins une source réelle, une vraie vidéo, ou un média visible). Si NON -> la démo redevient autorisée.
function r0HasProject(f){ try{ if(r0RealSource(f)) return true; if(r0RealVideoFile(f)) return true; const {C}=_r0(); return (C.visibles(f)||[]).length>0; }catch(e){} return false; }
// [🔴1 incident Publier→Retour] COERCION FRONTIÈRE : un CHEMIN de fichier doit être une STRING. Si un OBJET média ({file}/{path}/{media}) arrive
//   par erreur jusqu'à fs/path (createReadStream/basename…), on extrait la string ; sinon null. Empêche « path must be of type string. Received Object ».
function r0FilePath(x){ if(x==null) return null; if(typeof x==='string') return x; if(typeof x==='object'){ const s=x.file||x.path||x.media||x.src||null; return (typeof s==='string')?s:null; } return null; }
// Épingle l'image X comme SOURCE unique du projet (photo + vidéo) — appelée à la sélection, à la génération et au pont photo→vidéo.
function r0PinSource(persona, id, file){ try{ if(!file) return; const {S}=_r0(); const ts=Date.now();
  S.setDraft(BASE,persona,id,'photo',{source_file:file},ts); S.setDraft(BASE,persona,id,'video',{source_file:file},ts);
}catch(e){} }
// [CORBEILLE — Etoile] SOFT-DELETE STRICT : JAMAIS de suppression réelle. On DÉPLACE le fichier vers <dossier>/.corbeille/ (récupérable).
//   r0Walk ignore .corbeille -> le fichier disparaît des galeries mais reste sur le disque (iCloud Fichiers). Restaurable.
function r0Corbeille(file){ try{ if(!file||!fs.existsSync(file)) return null; const dir=path.dirname(file); const tr=path.join(dir,'.corbeille'); fs.mkdirSync(tr,{recursive:true});
  let dest=path.join(tr, path.basename(file)); if(fs.existsSync(dest)) dest=path.join(tr, Date.now()+'_'+path.basename(file));
  fs.renameSync(file,dest); jlog('[corbeille] '+file+' -> '+dest+' (récupérable, AUCUNE suppression)'); return dest; }catch(e){ try{ jlog('[corbeille] err '+e.message); }catch(_){} return null; } }
// Restaure un fichier de .corbeille vers son dossier parent.
function r0Restore(file){ try{ if(!file||!fs.existsSync(file)) return null; const parent=path.dirname(path.dirname(file)); const dest=path.join(parent, path.basename(file).replace(/^\d{13}_/,'')); fs.renameSync(file,dest); return dest; }catch(e){ return null; } }
// [HUB ASSETS] envoie un FICHIER en document (audio/voix…), garde-fou dry-run (sandbox ne poste rien de réel).
async function r0SendDoc(fp, caption){ try{
  if(typeof R0DRY!=='undefined'&&R0DRY){ return _dryTg('sendDocument',{caption:caption}); }
  const FormData=require('form-data'); const form=new FormData();
  form.append('chat_id',CHAT_ID); form.append('document',fs.readFileSync(fp),{filename:path.basename(fp)});
  if(caption){ form.append('caption',caption); form.append('parse_mode','HTML'); }
  const r=await fetch('https://api.telegram.org/bot'+TOKEN+'/sendDocument',{method:'POST',body:form}); return r.json();
}catch(e){ try{ jlog('[v4r] sendDoc err '+e.message); }catch(_){} return null; } }
// [HUB ASSETS] retrouve le fichier AUDIO/voix de la version courante (ElevenLabs) : projet projects_r + archive podcast-looks/Audio. Lecture seule.
function r0FindAudio(persona){ try{ const cur=r0Cur(persona,false); if(!cur) return null; const id=cur.projectId; const A=/\.(mp3|wav|m4a|aac|ogg)$/i; const found=[];
  const scan=(dir)=>{ try{ for(const x of fs.readdirSync(dir)){ if(A.test(x)){ const fp=path.join(dir,x); try{ found.push({p:fp,m:fs.statSync(fp).mtimeMs}); }catch(e){} } } }catch(e){} };
  scan(path.join(BASE,'projects_r',persona,id));
  let ld; try{ ld=getLooksDir(); }catch(e){ ld=path.join(BASE,'looks'); }
  scan(path.join(ld,'projets',persona,id,'Audio'));
  found.sort((a,b)=>b.m-a.m); return found[0]?found[0].p:null;
}catch(e){ return null; } }
// [CLOUD] Reconnexion au mécanisme iCloud EXISTANT : dossier historique = « podcast-looks » (= la cible du symlink `looks/`).
//   Chaque PROJET a son sous-dossier podcast-looks/<projet>/ avec tous ses fichiers (photo/vidéo/…) -> resync auto iCloud + app Fichiers.
//   AUCUN nouveau connecteur. Pas en dry-run (sandbox ne touche jamais le vrai iCloud).
function r0CloudCopy(file, projId){ try{ file=r0FilePath(file); if(!file || (typeof R0DRY!=='undefined'&&R0DRY)) return null; // [🔴1b] garde-fou : si un OBJET média se glisse ici, on prend .file/.path (jamais path.basename(objet))
  let lookRoot; try{ lookRoot=getLooksDir(); }catch(e){ lookRoot=path.join(BASE,'looks'); } // realpath de looks/ -> .../podcast-looks
  const dir=path.join(lookRoot, projId||'v4r'); fs.mkdirSync(dir,{recursive:true});
  const dest=path.join(dir, path.basename(file)); if(!fs.existsSync(dest)) fs.copyFileSync(file,dest);
  jlog('[v4r] rendu déposé dans podcast-looks/'+(projId||'v4r')+': '+dest); return dest; }catch(e){ try{ jlog('[v4r] cloud copy err '+e.message); }catch(_){} return null; } }
const _execFileP=require('util').promisify(require('child_process').execFile); // [B4] exec ASYNC : ne BLOQUE PAS la boucle d'événements
// [ARCHIVE] Écrit l'ARCHIVE DE RÉFÉRENCE d'un projet dans podcast-looks/projets/<persona>/<id>/ (copie physique + manifeste).
//   MÊME mécanisme pour le rétroactif ET le futur. Lecture seule de la base ; écriture UNIQUEMENT dans podcast-looks. Jamais en dry-run.
function r0ArchiveProjet(persona, id){
  try{ if(typeof R0DRY!=='undefined'&&R0DRY) return null; const {S,C}=_r0(); const f=S.loadFacts(BASE,persona,id); if(!f) return null;
    let root; try{ root=getLooksDir(); }catch(e){ root=path.join(BASE,'looks'); }
    const dir=path.join(root,'projets',persona,id);
    const sub=n=>{ const d=path.join(dir,n); try{ fs.mkdirSync(d,{recursive:true}); }catch(e){} return d; };
    ['Photos','Vidéos','Références','Looks','Scripts','Légendes','Prompts','Audio','Sous-titres','Exports finaux'].forEach(sub);
    let nImg=0,nVid=0; const vis=C.visibles(f)||[];
    for(const m of vis){ if(!m.file||m.simule||!fs.existsSync(m.file)) continue; // [318 inter-projets] on suit le fichier RÉEL et on le copie DANS ce projet -> autonome
      const isV=m.type==='video'; const dest=path.join(dir,isV?'Vidéos':'Photos',path.basename(m.file));
      try{ if(!fs.existsSync(dest)) fs.copyFileSync(m.file,dest); isV?nVid++:nImg++; }catch(e){} }
    const dp=(f.draft&&f.draft.photo)||{}, dv=(f.draft&&f.draft.video)||{}, pub=f.publication||{};
    const W=(folder,name,txt)=>{ if(txt!=null&&String(txt).trim()) try{ fs.writeFileSync(path.join(dir,folder,name),String(txt)); }catch(e){} };
    W('Prompts','prompt.txt',dp.prompt); W('Scripts','script.txt',dv.script);
    W('Légendes','legendes.txt',[pub.legende_courte&&('COURTE:\n'+pub.legende_courte),pub.legende_longue&&('LONGUE:\n'+pub.legende_longue),pub.hashtags&&('HASHTAGS:\n'+pub.hashtags)].filter(Boolean).join('\n\n'));
    W('Sous-titres','soustitres.txt',['actif: auto (incrustés)','affichage: '+(dv.st_display||'-'),'police: '+(dv.st_font||'-'),'taille: '+(dv.st_size||'-'),'position: '+(dv.st_pos||'-'),'couleur: '+(dv.st_color||'-')].join('\n'));
    if(dp.reference&&fs.existsSync(dp.reference)){ try{ fs.copyFileSync(dp.reference,path.join(dir,'Références',path.basename(dp.reference))); }catch(e){} }
    if(dp.look){ W('Looks','look.txt',String(dp.look)); }
    const manifest={ projectId:id, persona:persona, titre:(f.intention&&f.intention.message)||id, cree_le:f.cree_le, modifie_le:f.modifie_le, statut:f.statut,
      intention:f.intention||{}, regeneration:{ prompt:dp.prompt||null, tenue:dp.look||null, decor:dp.decor||null, reference:dp.reference||null, format:dp.format||'9:16', duree:dv.duree||null, voix:dv.voix||null, sous_titres:{actif:dv.soustitres||'auto',police:dv.st_font||null,taille:dv.st_size||null,position:dv.st_pos||null}, moteurs:{photo:'seedream-v4',video:'kling+elevenlabs'} },
      decisions:f.decisions||[], publication:pub, fichiers:{photos:nImg,videos:nVid}, archive:{version_schema:1} };
    try{ fs.writeFileSync(path.join(dir,'projet.json'),JSON.stringify(manifest,null,2)); }catch(e){}
    try{ fs.writeFileSync(path.join(dir,'facts.snapshot.json'),JSON.stringify(f,null,2)); }catch(e){}
    try{ fs.writeFileSync(path.join(dir,'RECAP.txt'),'PROJET '+id+'\nstatut: '+(f.statut||'-')+'\nprompt: '+(dp.prompt||'-')+'\ntenue: '+(dp.look||'-')+'\ndécor: '+(dp.decor||'-')+'\ndurée: '+(dv.duree||'-')+'\nphotos: '+nImg+' · vidéos: '+nVid+'\n'); }catch(e){}
    return { id:id, photos:nImg, videos:nVid }; }catch(e){ try{ jlog('[archive] err '+id+' '+e.message); }catch(_){} return null; }
}
// [MIGRATION] rétroactif = MÊME mécanisme : pour chaque projet AVEC média, on écrit l'archive. Aucune suppression.
function r0MigrateAll(persona){ const {S,C}=_r0(); const list=S.listProjects(BASE,persona)||[]; let projets=0,photos=0,videos=0;
  for(const p of list){ if((C.visibles(p)||[]).filter(m=>m.file&&!m.simule).length===0) continue; const r=r0ArchiveProjet(persona,p.projectId); if(r){ projets++; photos+=r.photos; videos+=r.videos; } }
  return { projets, photos, videos }; }
// Vidéo de démo LOCALE : générée UNE fois depuis l'image-look via ffmpeg (zoom lent 3s, 9:16). ZÉRO dépense (CPU local, aucune API).
let _r0Vid=null;
async function r0DemoVideo(){
  try{
    if(_r0Vid && fs.existsSync(_r0Vid)) return _r0Vid;
    const out=path.join(BASE,'assets_r','demo_video.mp4');
    if(fs.existsSync(out)){ _r0Vid=out; return out; }
    if(R0DRY) return out; // dry : pas de ffmpeg
    const img=r0DemoPhoto(); if(!img) return null;
    fs.mkdirSync(path.join(BASE,'assets_r'),{recursive:true});
    await _execFileP('ffmpeg',['-y','-loop','1','-i',img,'-t','3',
      '-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z=\'min(zoom+0.0015,1.15)\':d=75:s=720x1280:fps=25,format=yuv420p',
      '-r','25','-c:v','libx264','-preset','veryfast','-movflags','+faststart',out],{timeout:60000});
    if(fs.existsSync(out)){ _r0Vid=out; return out; }
  }catch(e){ jlog('[v4r] demo video ffmpeg err '+e.message); }
  return null;
}
function r0Kb(rows){ return (rows||[]).map(r=>r.map(b=>({text:b.text, callback_data:b.cb}))); } /*{cb} -> {callback_data}*/
// [VISIBILITÉ — Etoile] walk RÉCURSIF d'un dossier : collecte par EXTENSION, sans filtre de taille (les placeholders iCloud
//   reportent leur taille logique), en sautant la corbeille. Dédup par basename. Garde-fou profondeur + nb de fichiers.
function r0Walk(root, re, add, depth){ depth=depth==null?6:depth; if(depth<0) return;
  let ents; try{ ents=fs.readdirSync(root,{withFileTypes:true}); }catch(e){ return; }
  for(const e of ents){ const name=e.name; if(name==='.corbeille'||name==='_trash'||name==='_corbeille'||name==='references'||name.charAt(0)==='.') continue;
    const fp=path.join(root,name);
    try{ if(e.isDirectory()){ r0Walk(fp, re, add, depth-1); } else if(re.test(name)){ add(fp); } }catch(_){}
  }
}
// [P1.1] IMAGES RÉELLES — agrège PHYSIQUEMENT tout le patrimoine : podcast-looks (tout l'arbre) + podcast-outputs + projects_r.
//   Récent d'abord, dédup par basename. Lecture seule. (Corrige : avant on ratait podcast-outputs et les sous-dossiers de looks.)
function r0RealImages(persona, max){
  max=max||9; const {C}=_r0(); const out=[]; const seen={}; const RE=/\.(jpg|jpeg|png|webp)$/i;
  const add=(p)=>{ try{ if(!p) return; const st=fs.statSync(p); if(st.size<=0) return; const k=path.basename(p)+"|"+st.size; if(seen[k]) return; seen[k]=1; out.push({p:p,m:st.mtimeMs}); }catch(e){} };
  // 1) projet courant d'abord (médias déposés)
  try{ const cur=r0Cur(persona,false); if(cur){ (C.visibles(cur)||[]).forEach(md=>{ if(md.type!=='video'&&md.file&&fs.existsSync(md.file)) add(md.file); }); } }catch(e){}
  // 2) tout le patrimoine physique
  let ld; try{ ld=fs.realpathSync(path.join(BASE,'looks')); }catch(e){ ld=path.join(BASE,'looks'); }       // podcast-looks (iCloud)
  let od; try{ od=fs.realpathSync(path.join(BASE,'outputs')); }catch(e){ od=path.join(BASE,'outputs'); }   // podcast-outputs (iCloud)
  r0Walk(ld, RE, add);
  r0Walk(od, RE, add);
  r0Walk(path.join(BASE,'projects_r',persona), RE, add);
  out.sort((a,b)=>b.m-a.m);
  return out.slice(0,max).map(o=>o.p);
}
// [VIDÉOS — lecture de l'EXISTANT] agrège PHYSIQUEMENT toutes les vidéos : podcast-outputs + podcast-looks + projects_r. Récent d'abord.
//   On garde les raws (footage lipsync réutilisable) — « ne perds pas de fichiers » (Etoile). Dédup par basename.
function r0RealVideos(persona, max){
  max=max||9; const out=[]; const seen={}; const RE=/\.(mp4|mov|m4v|webm)$/i;
  const add=(p)=>{ try{ if(!p) return; const st=fs.statSync(p); if(st.size<=0) return; const k=path.basename(p)+"|"+st.size; if(seen[k]) return; seen[k]=1; out.push({p:p,m:st.mtimeMs}); }catch(e){} };
  let od; try{ od=fs.realpathSync(path.join(BASE,'outputs')); }catch(e){ od=path.join(BASE,'outputs'); }   // podcast-outputs (iCloud) — finals + raws
  let ld; try{ ld=fs.realpathSync(path.join(BASE,'looks')); }catch(e){ ld=path.join(BASE,'looks'); }       // podcast-looks/projets/*/Vidéos
  r0Walk(od, RE, add);
  r0Walk(ld, RE, add);
  r0Walk(path.join(BASE,'projects_r',persona), RE, add);
  out.sort((a,b)=>b.m-a.m);
  return out.slice(0,max).map(o=>o.p);
}
// [F] PLANCHE-CONTACT (mosaïque) : assemble jusqu'à 9 vignettes en grille via ffmpeg xstack (LOCAL, zéro dépense).
//   Affichée comme média du bloc UNIQUE ; les boutons numérotés 1..N dessous servent à sélectionner. Pas d'empilement.
async function r0Mosaic(files, startNum){
  try{
    files=(files||[]).filter(Boolean).slice(0,6); // [Etoile] 6 vignettes max par mosaïque (numérotées 1-6)
    if(!files.length) return null;
    if(R0DRY) return files[0]; // dry : pas de ffmpeg (ne bloque pas les tests)
    startNum=startNum||1;
    if(files.length===1){ // une seule vignette : on incruste quand même son numéro (cohérence avec le bouton)
      const out1=path.join(BASE,'assets_r','_mosaic_'+(startNum)+'_'+path.basename(files[0])+'.jpg');
      try{ fs.mkdirSync(path.join(BASE,'assets_r'),{recursive:true}); }catch(e){}
      if(fs.existsSync(out1)) return out1;
      try{ await _execFileP('ffmpeg',['-y','-i',files[0],'-vf','scale=600:600:force_original_aspect_ratio=increase,crop=600:600,drawtext=text=\''+startNum+'\':x=14:y=14:fontsize=72:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10','-frames:v','1',out1],{timeout:30000}); if(fs.existsSync(out1)) return out1; }catch(e){}
      return files[0];
    }
    const n=files.length, cols=(n<=2?2:(n<=4?2:3)), cell=300;
    const args=['-y']; files.forEach(f=>args.push('-i',f));
    let fc=''; const labels=[];
    // [P4] NUMÉRO INCRUSTÉ sur chaque vignette (drawtext) = numéro du bouton -> on sait quel numéro = quelle photo.
    files.forEach((f,i)=>{ fc+='['+i+':v]scale='+cell+':'+cell+':force_original_aspect_ratio=increase,crop='+cell+':'+cell+',setsar=1,drawtext=text=\''+(startNum+i)+'\':x=10:y=10:fontsize=64:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8[v'+i+'];'; labels.push('[v'+i+']'); });
    const layout=files.map((f,i)=>((i%cols)*cell)+'_'+(Math.floor(i/cols)*cell)).join('|');
    fc+=labels.join('')+'xstack=inputs='+n+':layout='+layout+':fill=black[out]';
    // [FIX grille] nom de planche UNIQUE par CONTENU (hash des fichiers) -> chaque page a SA planche, pas de cache Telegram périmé
    //   (avant : _mosaic.jpg fixe -> page 2 réaffichait la planche de page 1).
    let key=startNum; for(const f of files){ const b=path.basename(f); for(let i=0;i<b.length;i++) key=(key*31 + b.charCodeAt(i))>>>0; }
    const out=path.join(BASE,'assets_r','_mosaic_'+key.toString(36)+'.jpg');
    try{ fs.mkdirSync(path.join(BASE,'assets_r'),{recursive:true}); }catch(e){}
    if(fs.existsSync(out)) return out; // déjà construite pour ce contenu
    args.push('-filter_complex',fc,'-map','[out]','-frames:v','1',out);
    await _execFileP('ffmpeg',args,{timeout:30000}); // [B4] ASYNC : ne bloque pas la boucle
    if(fs.existsSync(out)) return out;
  }catch(e){ jlog('[v4r] mosaic err '+e.message); }
  return null;
}
function r0MidOf(r){ return (r&&r.result&&r.result.message_id)||(typeof r==='number'?r:null); }
// PEINTRE du bloc UNIQUE : décide edit / editMedia (swap photo↔vidéo EN PLACE) / recreate via l'oracle SB.plan.
//   targetKind ∈ {text,photo,video} ; mediaPath = fichier local (image/vidéo) ou null pour texte.
async function r0Paint(targetKind, mediaPath, caption, rows, editMid){
  mediaPath=r0FilePath(mediaPath); // [🔴1] frontière : jamais d'OBJET média vers fs/path (sinon incident « path must be string »). Si null -> dégradé texte plus bas.
  if(targetKind!=='text' && !mediaPath) targetKind='text'; // pas de fichier réel -> on peint du TEXTE (jamais un objet, jamais un crash)
  const {SB}=_r0(); const kb=r0Kb(rows); const cur=editMid||r0Mid;
  const p=SB.plan(r0Type, cur, targetKind);
  if(p.action==='edit'){
    if(targetKind==='text'){ const ok=await tgEditText(cur, caption, kb); if(ok!==false){ r0Mid=cur; r0Type='text'; return; } }
    else if(mediaPath && mediaPath!==r0MediaPath){ // le FICHIER média a CHANGÉ -> remplacer l'image/vidéo en place (editMessageMedia), pas juste la légende
      const ok=(targetKind==='video') ? await editVideoKb(cur, mediaPath, cap1024(caption), kb)
                                       : await editPhotoKb(cur, mediaPath, cap1024(caption), kb);
      if(ok){ r0Mid=cur; r0Type=targetKind; r0MediaPath=mediaPath; return; }
    } else { try{ const r=await tg('editMessageCaption',{message_id:cur, caption:cap1024(caption), parse_mode:'HTML', reply_markup:{inline_keyboard:kb}});
      if(r&&(r.ok||isNotMod(r.description))){ r0Mid=cur; r0Type=targetKind; return; } }catch(e){} }
  } else if(p.action==='editMedia'){ // image DEVIENT vidéo (ou l'inverse) dans le MÊME message
    const ok = (targetKind==='video') ? await editVideoKb(cur, mediaPath, cap1024(caption), kb)
                                       : await editPhotoKb(cur, mediaPath, cap1024(caption), kb);
    if(ok){ r0Mid=cur; r0Type=targetKind; r0MediaPath=mediaPath; return; }
  }
  // recreate : POSTE D'ABORD le neuf, PUIS supprime l'ancien (point 7 : JAMAIS de bloc qui disparaît).
  //   Si le neuf échoue -> on garde l'ancien (aucune perte). Recouvrement momentané (sous-seconde) toléré pour ne RIEN perdre.
  const old=r0Mid; let newMid=null, newType=targetKind;
  if(targetKind==='text'){ const r=await send(caption, kb); newMid=r0MidOf(r); }
  else if(targetKind==='video'){ newMid=await sendVideoKb(mediaPath, cap1024(caption), kb)||null;
    if(!newMid){ const d=await sendPhotoKb(mediaPath, cap1024(caption), kb); newMid=r0MidOf(d); newType='photo'; } } // dégradé : jamais de trou
  else { const d=await sendPhotoKb(mediaPath, cap1024(caption), kb); newMid=r0MidOf(d); }
  r0MediaPath=(targetKind==='text')?null:mediaPath; // mémorise le média affiché
  if(newMid){ r0Mid=newMid; r0Type=newType; if(old&&old!==newMid){ try{ await delMsg(old); }catch(e){} } } // l'ancien part seulement si le neuf est là
  else { jlog('[v4r] recreate: échec du nouveau bloc — ancien conservé (aucune perte)'); /* r0Mid/r0Type inchangés */ }
}
// Contexte de rendu (listes dynamiques) construit depuis l'INVENTAIRE (repositionnement de l'existant).
function r0Ctx(persona){
  const {INV,COST}=_r0();
  const secs=INV.studioSections(BASE,persona);
  const find=k=>secs.find(s=>s.key===k)||{items:[]};
  const ctx={
    looks:(find('looks').items||[]), decors:(find('decors').items||[]), avatars:(find('avatars').items||[]),
    sections:secs,
    section:(r0Section?secs.find(s=>s.key===r0Section):null),
    recents:INV.recents(BASE,persona),
    galleryKind:r0GalKind, galleryAll:r0GalAll, galleryRole:r0GalRole, verKeys:r0VerKeys, // [ANO-ARCH-VERSIONING] clés exposées à l'écran versions
  };
  ctx.coverFile=r0CoverFile(r0Cur(persona,false)||{}); // [P2] image AFFICHÉE (couverture réelle) -> sert à ÉPINGLER la source vidéo = la photo vue
  ctx.sourceFile=r0SourceFile(r0Cur(persona,false)||{}); // [SOURCE UNIQUE] image source épinglée du projet, lue partout (photo+vidéo)
  try{ ctx.srcName=ctx.sourceFile?path.basename(ctx.sourceFile):null; }catch(e){ ctx.srcName=null; } // [LOT1 A3] « 📸 Source active : X » visible partout (X = basename(r0SourceFile))
  ctx.generating=r0Generating; ctx.genStep=r0GenStep; // [🔴3/4 — H13] état « génération en cours » : confirm2 masque Oui/Annuler
  ctx.resReturn=r0ResFrom; // [RETOUR CONTEXTUEL] origine d'ouverture de Fichiers/Ressources (Studio/Récents/Résultat)
  // [GALERIE — comportement unique + compteur EXACT + PAGINATION] projet = médias du projet ; global (historique) = TOUT.
  if(r0Screen==='gallery'){ const {C}=_r0(); const f=r0Cur(persona,false)||{}; let list;
    if(r0GalKind==='video'){ const projV=(C.visibles(f)||[]).filter(m=>m.type==='video'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
      list=r0GalAll? r0RealVideos(persona,9999) : projV; }
    else { const projI=(C.visibles(f)||[]).filter(m=>m.type!=='video'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
      list=r0GalAll? r0RealImages(persona,9999) : projI; }
    const pages=Math.max(1,Math.ceil(list.length/R0_PAGE)); if(r0Page>pages-1)r0Page=pages-1; if(r0Page<0)r0Page=0;
    ctx.galleryFiles=list.slice(r0Page*R0_PAGE, r0Page*R0_PAGE+R0_PAGE);
    ctx.galleryTotal=list.length; ctx.galleryScope=r0GalAll?'global':'projet'; ctx.galDel=r0GalDel;
    ctx.page={ idx:r0Page, pages:pages, size:R0_PAGE, base:r0Page*R0_PAGE }; }
  // [PAGINATION] Récents/Archives : page courante pour la grille de projets.
  if(r0Screen==='recents'){ const tot=((ctx.recents&&ctx.recents.projets)||[]).length; const pages=Math.max(1,Math.ceil(tot/R0_PAGE)); if(r0Page>pages-1)r0Page=pages-1; if(r0Page<0)r0Page=0; ctx.page={ idx:r0Page, pages:pages, size:R0_PAGE, base:r0Page*R0_PAGE }; }
  // [PRÊT À POSTER] file des médias VALIDÉS (etat « garde ») du projet, avec fichier réel, paginée.
  if(r0Screen==='pret'){ const {C}=_r0(); const f=r0Cur(persona,false)||{};
    const list=(C.medias(f)||[]).filter(m=>m.etat==='garde'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
    const pages=Math.max(1,Math.ceil(list.length/R0_PAGE)); if(r0Page>pages-1)r0Page=pages-1; if(r0Page<0)r0Page=0;
    ctx.pretFiles=list.slice(r0Page*R0_PAGE, r0Page*R0_PAGE+R0_PAGE); ctx.pretTotal=list.length;
    ctx.page={ idx:r0Page, pages:pages, size:R0_PAGE, base:r0Page*R0_PAGE }; }
  // [ARCHIVES PUBLIÉES] médias marqués « publie », paginés.
  if(r0Screen==='publies'){ const {C}=_r0(); const f=r0Cur(persona,false)||{};
    const list=(C.medias(f)||[]).filter(m=>m.etat==='publie'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
    const pages=Math.max(1,Math.ceil(list.length/R0_PAGE)); if(r0Page>pages-1)r0Page=pages-1; if(r0Page<0)r0Page=0;
    ctx.publiesFiles=list.slice(r0Page*R0_PAGE, r0Page*R0_PAGE+R0_PAGE); ctx.publiesTotal=list.length;
    ctx.page={ idx:r0Page, pages:pages, size:R0_PAGE, base:r0Page*R0_PAGE }; }
  // [#17/#18] sur un bloc d'édition (prompt/script/choix) : remonter les MODÈLES pré-enregistrés + les DÉFAUTS du persona.
  if(r0Screen==='block' && r0Block){ const {DEF}=_r0();
    ctx.presets={ scripts:(_r0Library().scripts||[]).slice(-12).reverse(), prompts:_r0Prompts(persona) };
    ctx.defaults=DEF.load(BASE,persona);
    ctx.looks=_r0LookCats();      // [#26] TENUE : toutes les catégories du catalogue (soiree/business/casual/cosy/ete/fete), pas juste la 1ʳᵉ
    ctx.scriptCats=_r0ScriptCats(); // [SCRIPTS] thèmes RÉELS legacy (red flags, hommes toxiques, attachement…) — comme les Tenues
    ctx.subStyle=_r0SubStyle();   // [#27] valeurs PAR DÉFAUT des sous-titres (lecture seule du legacy, verrou intact)
    ctx.subReturn=r0SubReturn;    // [APERÇU] si le panneau sous-titres a été ouvert depuis l'aperçu vidéo -> Valider/Retour y reviennent
  }
  // ÉCRAN CONFIRMATION : calcule le COÛT réel AVANT toute dépense (cockpit_cost + lookbook), affiche gratuit/payant,
  //   + crédits déjà consommés (tests réels cumulés) + compteur « test réel n°X/10 » + moteur réel ON/OFF.
  if((r0Screen==='confirm'||r0Screen==='validation'||r0Screen==='confirm2') && r0Pending){ // [D3] validation = écran chiffré (mêmes données ctx.confirm)
    const {ENG,BUD}=_r0();
    const est=r0EstFor(persona, r0Pending);
    ctx.confirm={ mediaKind:r0Pending.mediaKind, est:est, live:ENG.liveFor(r0Pending.mediaKind), budget:BUD.state(BASE) };
    const {S:Sx}=_r0(); const f2=r0Cur(persona,true);
    if(r0Pending.kind==='image'){ const dr=Sx.getDraft(f2,'photo')||{};
      // [R4] APERÇU PHOTO : champs MÉTIER complets (prompt EN ENTIER, tenue, décor, référence, format).
      ctx.confirm.prep={ promptFull:(dr.prompt||null), outfit:(dr.look||null), decor:(dr.decor||null), reference:(dr.reference||null), refLocked:!!dr.ref_locked, format:(dr.format||'9:16') }; }
    else if(r0Pending.kind==='video'){ const dv=Sx.getDraft(f2,'video')||{};
      // [R4] APERÇU VIDÉO : source, script EN ENTIER, voix, sous-titres, durée.
      ctx.confirm.prep={ source:(dv.source||null), scriptFull:(dv.script||null), voix:(dv.voix||null), soustitres:(dv.soustitres||null), duree:(dv.duree||'30s') }; }
  }
  return ctx;
}
// RENDRE l'ÉCRAN COURANT (r0Screen/r0Section/r0Block) dans le bloc UNIQUE. banner = bandeau optionnel.
//   Le KIND vient de la VUE (screens décide text/photo/video selon les médias) — jamais de placeholder.
async function r0Render(persona, editMid, banner){
  const {NAV,C}=_r0(); const f=r0Cur(persona,true);
  const ctx=r0Ctx(persona);
  const vw=NAV.view({ screen:r0Screen, section:r0Section, block:r0Block }, f, ctx);
  if(vw.await) r0Await=vw.await; // certaines sous-vues arment une saisie
  const caption=(banner?(banner+'\n\n'):'')+vw.caption;
  let kind=vw.kind||'text', media=null;
  // [APERÇU VIDÉO RÉEL] sur l'aperçu vidéo (confirm + pending vidéo), on peint un VRAI CLIP échantillon avec sous-titres incrustés
  //   dans le style courant -> elle VOIT la forme (hauteur/taille/police/couleur) AVANT de générer, et peut l'ajuster (🔤 Sous-titres).
  // [ANO-CTX-SOUSTITRES-DEMO] APERÇU VIDÉO (confirm) **ET** panneau SOUS-TITRES (block soustitres) peignent le CLIP de LA SOURCE PROJET
  //   (r0SubClip = r0SourceFile + sous-titres incrustés), repli PNG sous-titré (r0SubSample). JAMAIS une démo générique (manteau cuir).
  const _isEditPanel = (r0Screen==='block');                                                     // TOUT écran d'édition (prompt/look/decor/ref/script/musique/duree/soustitres/source/legendes…)
  const _strictSrc = _isEditPanel || (r0Screen==='quit'||r0Screen==='confirm'||r0Screen==='confirm2'||r0Screen==='validation') // [P1-a] source projet stricte (jamais démo) sur édition + écrans intermédiaires
    || (r0Screen==='publication'||r0Screen==='pret'||r0Screen==='publies'); // [🔴1] écrans de SORTIE : source réelle ou TEXTE, JAMAIS de démo (même sans projet)
  const _isSubPanel = (_isEditPanel && r0Block && r0Block.key==='soustitres');
  const _isVideoApercu = (r0Screen==='confirm' && r0Pending && r0Pending.mediaKind==='video');
  // [🔴1 — ÉRADICATION DÉMO] hors « aucun projet », un écran ne peint JAMAIS r0DemoVideo/r0DemoPhoto.
  //   Règle unique : VRAIE vidéo générée -> sinon SOURCE ACTIVE réelle (== ligne « Source active ») -> sinon TEXTE. Démo seulement si AUCUN projet.
  const _hasProj = r0HasProject(f);
  if(_isVideoApercu || _isSubPanel){
    const clip=await r0SubClip(persona);                       // CLIP sous-titré (matérialise la source iCloud avant ffmpeg)
    if(clip){ media=clip; kind='video'; }
    else { const png=await r0SubSample(persona);               // repli : PNG AVEC sous-titres incrustés (jamais l'image nue silencieuse)
      if(png){ media=png; kind='photo'; } else { media=r0RealSource(f); kind=media?'photo':'text'; } }
  }
  // [ANO-CTX-BLOCK-DEMO-GENERAL] AUCUN écran d'ÉDITION (block) ne peint une démo : contexte projet réel (r0RealSource) ou TEXTE.
  else if(_isEditPanel){ media=r0RealSource(f); kind=media?'photo':'text'; }
  // [P1-a] ÉCRANS INTERMÉDIAIRES (quit · confirm · confirm2 · validation) : source projet réelle, jamais une démo (femme cuir).
  else if(kind==='video' && (r0Screen==='quit'||r0Screen==='confirm'||r0Screen==='confirm2'||r0Screen==='validation')){ media=r0RealSource(f); kind=media?'photo':'text'; }
  // [🔴1] ÉCRAN DE PROJET en kind VIDÉO (résultat · publication · prêt · publiés · studio · …) :
  //   VRAIE vidéo générée -> sinon SOURCE ACTIVE réelle (photo) -> sinon TEXTE. La démo n'est atteignable QUE s'il n'existe AUCUN projet.
  else if(kind==='video'){
    const rv=r0RealVideoFile(f);
    if(rv){ media=rv; }
    else { const rs=r0RealSource(f);
      if(rs){ media=rs; kind='photo'; }
      else if(!_hasProj && !_strictSrc){ media=await r0DemoVideo(); if(!media) kind=C.hasImage(f)?'photo':'text'; } // [🔴1] démo : jamais sur un écran de sortie (_strictSrc)
      else { kind='text'; } }
  }
  if(kind==='photo'){
    // [SOURCE UNIQUE] l'image peinte == la ligne « Source active ». photo_result peint la couverture générée (= nouvelle source épinglée).
    if(_strictSrc){ if(!media){ media=r0RealSource(f); } if(!media) kind='text'; } // [P1-a] édition + intermédiaires : source réelle ou texte, JAMAIS démo
    else if(r0Screen==='photo_result'){ if(!media){ media=r0CoverFile(f); } if(!media) kind='text'; } // résultat = dernière image générée
    // [🔴1] tout autre écran de projet (photo · préparer · vidéo · prêt · publiés · …) : SOURCE ACTIVE réelle ; démo SEULEMENT si AUCUN projet ; sinon texte.
    else { if(!media){ media=r0RealSource(f); } if(!media && !_hasProj){ media=r0DemoPhoto(); } if(!media) kind='text'; }
  }
  // [F] GALERIE/HISTORIQUE/RÉCENTS : planche-contact comme média du bloc.
  // [NO-FREEZE] L'aperçu est peint IMMÉDIATEMENT (1ère image, zéro ffmpeg) ; la mosaïque se construit en ARRIÈRE-PLAN
  //   et se substitue dans le bloc seulement si on y est encore. -> r0Render NE bloque JAMAIS la boucle d'updates.
  let _galFiles=null;
  // La planche-contact ne vaut que pour des IMAGES : la galerie VIDÉO reste une liste texte (numéros sélectionnables), pas de mosaïque de .mp4.
  if((r0Screen==='gallery' && r0GalKind!=='video') || r0Screen==='recents'){
    let files=[];
    if(r0Screen==='gallery'){
      if(ctx.galleryFiles && ctx.galleryFiles.length){ files=ctx.galleryFiles.slice(0,R0_PAGE); } // VRAIES images (projet ou global selon le scope)
      else { const all=r0GalAll?C.medias(f):C.visibles(f);
        files=all.filter(m=>m.type!=='video' && m.file && fs.existsSync(m.file)).slice(0,R0_PAGE).map(m=>m.file); } // [🔴1] vignette RÉELLE uniquement (jamais la démo cuir pour un fichier manquant)
    }
    else { const r=ctx.recents||{projets:[]}; const base=(ctx.page&&ctx.page.base)||0; files=(r.projets||[]).slice(base,base+R0_PAGE).map(p=>r0CoverFile(p)); } // page courante + couverture réelle par projet (6/page)
    files=files.filter(Boolean);
    if(files.length){ kind='photo'; media=files[0]; _galFiles=files; } // aperçu immédiat = 1ère image (la planche arrive en fond)
  }
  await r0Paint(kind, media, caption, vw.rows, editMid);
  r0SaveNav(persona); // [A] persiste le contexte (dernier écran/état) -> restauré après /restart et /v4r
  // [NO-FREEZE] planche-contact EN FOND (fire-and-forget) — ne bloque pas le handler, donc Retour/Accueil restent répondants.
  if(_galFiles && _galFiles.length && !R0DRY){ const base=(ctx.page&&ctx.page.base)||0; r0KickMosaic(_galFiles, r0Mid, r0Screen, caption, vw.rows, base+1); } // numéros incrustés = numéros des boutons (absolus)
}
// [NO-FREEZE] Construit la planche-contact HORS du chemin de réponse aux taps, puis la pose dans le bloc SI on y est toujours
//   (même message, même écran, toujours une photo). Toute erreur/délai reste silencieux : la 1ère image affichée suffit.
function r0KickMosaic(files, mid, scr, caption, rows, startNum){
  Promise.resolve().then(async()=>{
    try{
      const mo=await r0Mosaic(files, startNum);
      if(mo && r0Mid===mid && r0Screen===scr && r0Type==='photo'){ const ok=await editPhotoKb(mid, mo, cap1024(caption), r0Kb(rows)); if(ok) r0MediaPath=mo; }
    }catch(e){ try{ jlog('[v4r] mosaïque fond : '+e.message); }catch(_){} }
  });
}
// [RENDUS PERSISTANTS] Poste un RENDU FINAL (photo/vidéo) comme MESSAGE DÉDIÉ qui RESTE dans le chat (jamais r0Mid, jamais supprimé/édité).
//   C'est le « keepsake » : la grammaire post-puis-supprime / édit-en-place du COCKPIT ne s'y applique JAMAIS. Sans boutons (intouchable).
// [ÉCRAN FINAL FIGÉ — Etoile] 5 boutons rangés, AUCUN destructif (le bloc reste, toujours) :
//   💾 Enregistrer (choix) · ➕ Nouvelle vidéo · ➕ Nouvelle photo · 📤 Poster · 🗂 Mes fichiers (assets copiables).
const R0_FINAL_KB=[
  [{text:'💾 Enregistrer',cb:'R0_FIN_SAVE'}],
  [{text:'➕ Nouvelle vidéo',cb:'R0_VIDEO'},{text:'➕ Nouvelle photo',cb:'R0_PHOTO'}],
  [{text:'📤 Poster',cb:'R0_PUB'},{text:'🗂 Mes fichiers',cb:'R0_RES'}],
];
async function r0PostFinal(kind, file, caption){
  try{
    file=r0FilePath(file); // [🔴1] frontière : keepsake persistant ne reçoit qu'une STRING de chemin (jamais un objet média)
    if(!file) return null;
    let mid=null; const kb=r0Kb(R0_FINAL_KB);
    if(kind==='video'){ mid=await sendVideoKb(file, cap1024(caption), kb); if(!mid){ const d=await sendPhotoKb(file, cap1024(caption), kb); mid=r0MidOf(d); } }
    else { const d=await sendPhotoKb(file, cap1024(caption), kb); mid=r0MidOf(d); }
    if(mid){ r0RenderMids.push(mid); jlog('[v4r] bloc final figé posté mid='+mid+' ('+kind+') — 5 boutons, jamais supprimé'); }
    return mid;
  }catch(e){ try{ jlog('[v4r] post bloc final err '+e.message); }catch(_){} return null; }
}
// Légende d'un rendu persistant : nom du projet + nature + (réel/simulation). Reste affichée à vie dans le fil.
function r0FinalCap(persona, kind, sim, extra){
  let nom=''; try{ const {C}=_r0(); const f=r0Cur(persona,false); nom=(C.titre?C.titre(f):'')||(f&&f.nom)||''; }catch(e){}
  const tete=(kind==='video'?'🎬 <b>Vidéo générée</b>':'✨ <b>Photo générée</b>');
  return tete+(nom?(' · '+_r0esc(nom)):'')+(extra?(' · '+extra):'')+(sim?'\n🟡 <i>simulation — aucune dépense</i>':'\n<i>conservée dans le fil</i>');
}

// [B3] /v4r typé : RESTAURE le contexte + poste un bloc FRAIS, en POST-PUIS-SUPPRIME (le bloc ne disparaît jamais).
async function r0TypedV4r(txt){
  const persona=_persona(); r0Await=null; const old=r0Mid;
  if(txt==='/v4r new'){ const {S,DEF}=_r0(); const np=S.createProject(BASE,persona,{},Date.now());
    // [#18] nouveau projet : pré-remplir les brouillons avec les DÉFAUTS du persona (sans rien écraser).
    try{ const nid=np&&np.facts&&np.facts.projectId; if(nid){ ['photo','video'].forEach(k=>{ const dd=DEF.applyTo(BASE,persona,k,{}); if(Object.keys(dd).length) S.setDraft(BASE,persona,nid,k,dd,Date.now()); }); } }catch(e){}
    r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0SrcReturn=null; r0Mid=null; r0Type=null; r0MediaPath=null;
    await r0Render(persona,null,'✨ <b>Nouveau projet</b>'); if(old&&old!==r0Mid){ try{ await delMsg(old); }catch(e){} } return; }
  if(txt==='/v4r'){ r0PickCurrent(persona); /*[B] reprend le projet courant (le plus récent)*/
    // [FIX réel] /v4r REPREND LE PROJET COURANT et montre SON ACCUEIL (couverture) — JAMAIS un écran profond (ex. video_params)
    //   restauré depuis v4r_nav. Sinon Etoile « ne voit plus son projet » alors qu'il est là.
    r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0QuitFrom=null; r0SrcReturn=null;
    r0Mid=null; r0Type=null; r0MediaPath=null; /*poste un bloc neuf ; l'ancien n'est supprimé qu'APRÈS (jamais de trou)*/
    await r0Render(persona,null,null); if(old&&old!==r0Mid){ try{ await delMsg(old); }catch(e){} } return; }
  r0Screen='home'; r0Mid=null; r0Type=null; r0MediaPath=null;
  await r0Render(persona,null,'⚠️ « '+_r0esc(txt)+' » non reconnue — touche un bouton.'); if(old&&old!==r0Mid){ try{ await delMsg(old); }catch(e){} }
}

function r0ParentOfAsk(ask){ return ask.indexOf('ph_')===0?'photo_prompt':(ask.indexOf('vi_')===0?'video_params':'publication'); }
// [A] CONSERVATION D'ÉTAT : persiste/restaure le contexte de navigation du projet courant (hint, hors Socle).
const R0_NAV_FILE=()=>path.join(BASE,'v4r_nav.json');
function r0SaveNav(persona){ try{ const cur=_r0().S.currentProject(BASE,persona);
  fs.writeFileSync(R0_NAV_FILE(), JSON.stringify({ persona:persona, projectId:cur&&cur.projectId, screen:r0Screen, section:r0Section, block:r0Block, ret:r0Ret, pending:r0Pending, quitFrom:r0QuitFrom, srcReturn:r0SrcReturn, galKind:r0GalKind, galAll:r0GalAll })); }catch(e){} }
function r0RestoreNav(persona){ try{ const s=JSON.parse(fs.readFileSync(R0_NAV_FILE(),'utf8')); const cur=_r0().S.currentProject(BASE,persona);
  if(!s || s.persona!==persona || !cur || s.projectId!==cur.projectId) return false; // ne restaure que le contexte DU projet courant
  r0Screen=s.screen||'home'; r0Section=s.section||null; r0Block=s.block||null; r0Ret=s.ret||null; r0Pending=s.pending||null;
  r0QuitFrom=s.quitFrom||null; r0SrcReturn=s.srcReturn||null; r0GalKind=s.galKind||'image'; r0GalAll=!!s.galAll; return true; }catch(e){ return false; } }

// ═══ DISPATCHER : délègue la DÉCISION au reducer PUR (ui/nav.reduce) puis applique l'OP au Socle (nav.applyOp). ═══
//   Une seule source de vérité (partagée avec la preuve de scénario). Génération SIMULÉE (zéro dépense),
//   publication GATÉE (GO requis), suppression DOUCE, un seul bloc vivant.
async function r0Dispatch(persona, d, editMid){
  const {S,NAV}=_r0(); const now=Date.now();
  const cur=r0Cur(persona,true); const id=cur.projectId; r0Await=null;
  const ctx=r0Ctx(persona);
  const {ENG,BUD,C}=_r0();
  // [PAGINATION] toute action HORS pagination remet la page à 0 (on rouvre une grille au début) ; les flèches changent la page.
  if(!/^R0_(GNEXT|GPREV|RENEXT|REPREV)$/.test(d)) r0Page=0;
  // [APERÇU sous-titres] entrée NORMALE par le Montage -> le panneau revient au Montage (pas à l'aperçu) ; on efface le marqueur d'aperçu.
  if(d==='R0_VE_SUBS') r0SubReturn=null;
  if(/^R0_(GNEXT|RENEXT)$/.test(d)){ r0Page++; await r0Render(persona, editMid); return; }       // Suivant ▶
  if(/^R0_(GPREV|REPREV)$/.test(d)){ r0Page=Math.max(0,r0Page-1); await r0Render(persona, editMid); return; } // ◀ Précédent
  // GARDE-FOU BUDGET : un GO sur une génération PAYANTE avec moteur RÉEL armé (LIVE) et budget épuisé -> BLOQUE (aucune dépense).
  if(d==='R0_GO' && r0Pending && ENG.live() && BUD.state(BASE).exhausted){
    const b=BUD.state(BASE); jlog('[v4r] GO bloqué : budget tests réels épuisé '+b.max+'/'+b.max);
    await r0Render(persona, editMid, '⛔ <b>Budget de test épuisé ('+b.max+'/'+b.max+')</b> — réautorisation d\'Etoile nécessaire.');
    return;
  }
  // [texte entier] Envoie le TEXTE COMPLET (prompt/script/légendes) en message(s) SÉPARÉ(S) — copiable/éditable, hors limite média 1024.
  // [AJOUT 1] 🏷 Légendes (écran final vidéo) : poste DIRECTEMENT 2 blocs COPIABLES prêts à coller — courte+# et longue+# (hashtags fusionnés via r0FuseTags).
  //   Règle figée : le bloc copié = TEXTE BRUT SEUL (zéro titre/système) ; l'étiquette part dans un message SÉPARÉ. Reste dans le fil (cockpit re-rendu après).
  // [AJOUT 2] 🎛 Influences : bascule un flag (use_*/lock_*) dans draft.photo. use_* défaut true ; lock_* défaut false. Verrou -> persiste la valeur via DEF (#18).
  if(d.indexOf('R0_INFL_')===0){ const flag=d.slice(8); const f3=r0Cur(persona,true); const dp=S.getDraft(f3,'photo')||{};
    const isLock=flag.indexOf('lock_')===0; const cur=dp[flag];
    const nv = isLock ? !(cur===true) : !(cur!==false);   // use_*: true->false->true ; lock_*: false->true->false
    S.setDraft(BASE,persona,f3.projectId,'photo',{[flag]:nv},Date.now());
    if(isLock && nv){ const {DEF}=_r0(); const field=(flag==='lock_look')?'look':'decor'; const v=(S.getDraft(r0Cur(persona),'photo')||{})[field];
      if(v!=null&&v!=='') DEF.setField(BASE,persona,'photo',field,v); } // conserve la valeur -> nouveaux projets l'héritent
    await r0Render(persona, editMid); return; }
  if(d==='R0_LEGENDS'){ const f3=r0Cur(persona,true); const pub=(f3&&f3.publication)||{};
    const courte=r0FuseTags(pub.legende_courte,pub.hashtags), longue=r0FuseTags(pub.legende_longue,pub.hashtags);
    if(!courte && !longue){ try{ await toast('Aucune légende à copier (édite-les d\'abord)'); }catch(e){} await r0Render(persona, editMid); return; }
    try{ await toast('🏷 Légendes copiables ci-dessous'); }catch(e){}
    if(courte){ try{ await send('<b>✏️ Légende courte + hashtags</b> — <i>copie le bloc (texte seul)</i>'); await send('<code>'+_r0esc(courte)+'</code>'); }catch(e){} }
    if(longue){ try{ await send('<b>📄 Légende longue + hashtags</b> — <i>copie le bloc (texte seul)</i>'); await send('<code>'+_r0esc(longue)+'</code>'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  if(d.indexOf('R0_FULLTEXT_')===0){ const field=d.slice(12); const f3=r0Cur(persona,true);
    const dp=S.getDraft(f3,'photo')||{}, dv=S.getDraft(f3,'video')||{}, pub=(f3&&f3.publication)||{};
    // [HUB] sous-titres = AUTO-générés ; on restitue le RÉGLAGE D'APPARENCE (la matière texte vient du script à l'incrustation).
    const subTxt='Sous-titres : auto-générés depuis le script, incrustés au rendu.\nApparence — affichage: '+(dv.st_display||'mot')+' · police: '+(dv.st_font||'archivo')+' · taille: '+(dv.st_size||'M')+' · position: '+(dv.st_pos||'bas')+' · couleur: '+(dv.st_color||'blanc');
    // [G5 / D7] à la COPIE, la LÉGENDE intègre les hashtags (prête à coller d'un geste) ; le champ #️⃣ Hashtags reste séparé/récupérable dans Fichiers.
    const txt={ prompt:dp.prompt, script:dv.script, legc:r0FuseTags(pub.legende_courte,pub.hashtags), legl:r0FuseTags(pub.legende_longue,pub.hashtags), tags:pub.hashtags, soustitres:subTxt }[field] || '';
    const label={ prompt:'📝 Prompt complet', script:'🎬 Script complet', legc:'✏️ Légende courte', legl:'📄 Légende longue', tags:'#️⃣ Hashtags', soustitres:'🔤 Sous-titres' }[field]||'Texte';
    if(!String(txt).trim()){ try{ await toast('Rien à envoyer (vide)'); }catch(e){} return; }
    const full=String(txt); try{ await toast('📄 Envoyé ci-dessous'); }catch(e){}
    // [TEXTE COPIABLE — Etoile] le bloc destiné à la COPIE = TEXTE BRUT SEUL (zéro en-tête/pied/instruction).
    //   L'étiquette part dans un message SÉPARÉ ; le contenu est envoyé dans un bloc <code> (copie d'un geste = exactement le texte).
    try{ await send('<b>'+_r0esc(label)+'</b> — <i>copie le bloc ci-dessous (texte seul)</i>'); }catch(e){}
    for(let p=0;p<full.length;p+=3500){ const part=full.slice(p,p+3500); await send('<code>'+_r0esc(part)+'</code>').catch(()=>{}); } // contenu BRUT SEUL, copiable d'un geste
    return; }
  // [HUB ASSETS] récupération de FICHIERS un par un : image · vidéo · voix/audio (envoyés tels quels). Lecture seule.
  if(d==='R0_GETIMG'){ const fp=r0CoverFile(r0Cur(persona,false)||{});
    if(fp&&fs.existsSync(fp)){ try{ await sendPhotoKb(fp,'🖼 <i>Image de la version</i>',null); }catch(e){} } else { try{ await toast('Aucune image'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  if(d==='R0_GETVID'){ const mv=C.lastVideo(r0Cur(persona,false)); const fp=mv&&mv.file;
    if(fp&&fs.existsSync(fp)){ try{ await sendVideoKb(fp,'🎬 <i>Vidéo de la version</i>',null); }catch(e){ try{ await send('🎬 Vidéo : '+_r0esc(path.basename(fp))); }catch(_){} } } else { try{ await toast('Aucune vidéo'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  if(d==='R0_GETAUDIO'){ const a=r0FindAudio(persona);
    if(a){ try{ await r0SendDoc(a,'🎙 <i>Voix/Audio (ElevenLabs)</i>'); }catch(e){ try{ await send('🎙 Audio : '+_r0esc(path.basename(a))); }catch(_){} } } else { try{ await toast('Aucun audio trouvé pour cette version'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  // [#17] CHARGER UN MODÈLE pré-enregistré (script/prompt) dans le brouillon — besoin du disque -> hors reducer pur. Aperçu = re-render.
  if(d.indexOf('R0_LOADP_')===0 && r0Block){ const idx=+d.slice(9); const kind=r0Block.screen; const field=NAV.fieldAlias(r0Block);
    let text=null; try{ if(field==='script'){ const sc=(_r0Library().scripts||[]).slice(-12).reverse(); text=sc[idx]&&sc[idx].script; }
      else if(field==='prompt'){ const pl=_r0Prompts(persona); text=pl[idx]&&pl[idx].text; } }catch(e){}
    if(text){ S.setDraft(BASE,persona,id,kind,{[field]:text},now); try{ await toast('📁 Modèle chargé — édite si besoin'); }catch(e){} }
    else { try{ await toast('Modèle indisponible'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  // [P6] ENREGISTRER MODÈLE : mémorise TOUTE la config courante (photo: prompt/look/decor/format ; vidéo: script/voix/musique/soustitres/duree) comme défauts réutilisables.
  // [G4 / D5 — arbitrage Etoile] « 💾 Modèle » = PROJET COMPLET RÉUTILISABLE (pas des préréglages). On DUPLIQUE le projet courant
  //   -> un vrai projet réouvrable apparaît dans 📂 Récents, l'ORIGINAL reste intact. (Les défauts/préréglages restent sur « 💾 Défaut », #18.)
  if(d==='R0_SAVEMODEL'){ const f3=r0Cur(persona,true); const id=f3&&f3.projectId; let dup=null;
    try{ dup=S.duplicateProject(BASE,persona,id,Date.now()); }catch(e){}
    try{ await toast(dup?'💾 Modèle créé — projet réutilisable (rouvrable dans 📂 Récents, original intact)':'Modèle impossible'); }catch(e){}
    await r0Render(persona, editMid); return; }
  // [#18] ENREGISTRER PAR DÉFAUT la valeur courante de l'outil — réutilisée aux prochaines générations/nouveaux projets.
  if(d==='R0_DEFSAVE' && r0Block){ const {DEF}=_r0(); const kind=r0Block.screen;
    const dr=S.getDraft(r0Cur(persona),kind)||{};
    // [SOUS-TITRES DÉFINITIF] le panneau d'apparence porte PLUSIEURS champs (st_*) -> on les mémorise TOUS comme défauts.
    const fields=(r0Block.key==='soustitres')?['st_display','st_font','st_size','st_pos','st_color']:[NAV.fieldAlias(r0Block)];
    let n=0; fields.forEach(ff=>{ const v=dr[ff]; if(v!=null&&v!==''){ DEF.setField(BASE,persona,kind,ff,v); n++; } });
    try{ await toast(n?'💾 Enregistré par défaut — réutilisé ensuite':'Rien à enregistrer (vide)'); }catch(e){}
    await r0Render(persona, editMid); return; }
  // [A — REPRISE DE CONTEXTE] ▶️ Reprendre : restaure l'écran/projet/pending EXACTS d'avant le redémarrage. 🏠 Accueil : repart propre.
  if(d==='R0_RESUME'){ r0PickCurrent(persona); if(!r0RestoreNav(persona)){ r0Screen='home'; r0Section=null; r0Block=null; r0Pending=null; }
    r0Mid=editMid; r0Type='text'; await r0Render(persona, editMid, r0Screen==='home'?null:'↩️ <i>Contexte restauré</i>'); return; }
  if(d==='R0_RESUME_HOME'){ r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0QuitFrom=null; r0SrcReturn=null; r0Mid=editMid; r0Type='text'; await r0Render(persona, editMid); return; }
  // [LAYOUT GRILLE] « Choisir » au milieu des flèches : guide (la sélection se fait en touchant un NUMÉRO). Commande exacte à figer avec Etoile.
  if(d==='R0_GCHOOSE'){ try{ await toast('👇 Touche le NUMÉRO de la photo voulue'); }catch(e){} return; }
  // [CORBEILLE] bascule mode retrait dans la galerie (récupérable).
  if(d==='R0_GALDEL'){ r0GalDel=!r0GalDel; await r0Render(persona, editMid); return; }
  // [CORBEILLE] SOFT-DELETE : déplace la photo choisie vers .corbeille (JAMAIS de suppression réelle). Récupérable.
  if(d.indexOf('R0_GDEL_')===0){ const i=+d.slice(8); const ctx2=r0Ctx(persona); const file=(ctx2.galleryFiles||[])[i];
    if(file){ const dest=r0Corbeille(file); try{ await toast(dest?'🗑 Mis à la corbeille (récupérable dans .corbeille)':'Retrait impossible'); }catch(e){} }
    else { try{ await toast('Élément introuvable'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  // [G1] HISTORIQUE — revoir (LECTURE) : renvoie l'asset choisi tel quel, AUCUNE sélection dans le flux (pas de picksrc). Journal consultable.
  if(d.indexOf('R0_GVIEW_')===0){ const i=+d.slice(9); const ctx2=r0Ctx(persona); const file=(ctx2.galleryFiles||[])[i];
    if(file&&fs.existsSync(file)){ try{ if(r0GalKind==='video') await sendVideoKb(file,'🕘 <i>Historique — revoir</i>',null); else await sendPhotoKb(file,'🕘 <i>Historique — revoir</i>',null); }catch(e){} }
    else { try{ await toast('Fichier indisponible'); }catch(e){} }
    await r0Render(persona, editMid); return; }
  // [ANO-ARCH-VERSIONING] ⏪ Version précédente : restaure la dernière version du champ du bloc courant (jamais de perte — la version est ré-appliquée).
  if(d==='R0_PREVVER' && r0Block){ const f3=r0Cur(persona,true); const keys=NAV.verKeysFor(r0Block);
    const key=keys.find(k=>((f3.versions&&f3.versions[k])||[]).length>0);
    if(key){ const v=S.restoreVersion(BASE,persona,f3.projectId,key,null,Date.now()); await r0Render(persona, editMid, v!=null?'⏪ <b>Version précédente restaurée</b>':'Rien à restaurer'); }
    else { try{ await toast('Aucune version antérieure'); }catch(e){} await r0Render(persona, editMid); }
    return; }
  // [ANO-ARCH-VERSIONING] 🕘 Historique versions : ouvre l'écran de parcours/restauration ; Retour revient au bloc.
  if(d==='R0_VERHIST' && r0Block){ r0VerKeys=NAV.verKeysFor(r0Block); r0VerReturn=r0Block; r0Screen='versions'; await r0Render(persona, editMid); return; }
  if(d==='R0_VERBACK'){ if(r0VerReturn){ r0Screen='block'; r0Block=r0VerReturn; } else { r0Screen='home'; } await r0Render(persona, editMid); return; }
  if(d.indexOf('R0_VERSEL_')===0){ const m=d.slice(10).split('_'); const ki=+m[0], vi=+m[1]; const f3=r0Cur(persona,true);
    const key=(r0VerKeys||[])[ki]; let v=null; if(key) v=S.restoreVersion(BASE,persona,f3.projectId,key,vi,Date.now());
    if(r0VerReturn){ r0Screen='block'; r0Block=r0VerReturn; } await r0Render(persona, editMid, v!=null?'⏪ <b>Version restaurée</b>':'Restauration impossible'); return; }
  // [ÉCRAN FINAL] 💾 Enregistrer (CHOIX) : écrit l'archive organisée de la version dans podcast-looks/projets (image/vidéo/script/légendes/sous-titres/prompt). Récupérable.
  if(d==='R0_FIN_SAVE'){ const cur=r0Cur(persona,true); const id=cur&&cur.projectId; let r=null; try{ r=r0ArchiveProjet(persona, id); }catch(e){}
    try{ await toast(r?('💾 Version enregistrée — récupérable dans 🗂 Mes fichiers ('+r.photos+' photo(s)·'+r.videos+' vidéo(s))'):'💾 Enregistré'); }catch(e){}
    return; }
  // [RETOUR CONTEXTUEL — résources/Fichiers] [G2] mémorise l'écran d'origine -> le Retour de Fichiers y revient (Studio/Récents/Résultat/Publication), pas un défaut fixe. Couvre studio_section, pret, publies.
  if(d==='R0_RES'){ r0ResFrom = (/^studio/.test(r0Screen)?'R0_STUDIO':(r0Screen==='recents'?'R0_RECENTS':(r0Screen==='video_result'?'R0_VI_RESULT':(r0Screen==='photo_result'?'R0_PHOTO':(r0Screen==='publication'?'R0_PUB':(r0Screen==='pret'?'R0_READY':(r0Screen==='publies'?'R0_PUBLISHED':null))))))); }
  // [APERÇU VIDÉO] 🔤 éditer les sous-titres DEPUIS l'aperçu : ouvre le panneau apparence, Valider/Retour reviennent à l'aperçu (re-rend le clip).
  if(d==='R0_STEDIT'){ r0SubReturn='R0_VI_PREVIEW'; r0Screen='block'; r0Section=null; r0Block={screen:'video',key:'soustitres'}; await r0Render(persona, editMid); return; }
  // [SOUS-TITRES DÉFINITIF] 👁 Aperçu : incruste un échantillon dans LE style courant (même moteur que le rendu), reste sur le panneau.
  if(d==='R0_STPREV'){ try{ await toast('🎬 Aperçu vidéo des sous-titres en préparation…'); }catch(e){}
    const clip=await r0SubClip(persona); // [APERÇU SOUS-TITRES] CLIP échantillon (burn local ffmpeg = GRATUIT), apparence courante
    if(clip){ try{ await sendVideoKb(clip, '👁 <i>Aperçu sous-titres (clip) — police · taille · position · couleur. Le rendu final utilisera EXACTEMENT ces réglages.</i>', null); }catch(e){ try{ const png=await r0SubSample(persona); if(png) await sendPhotoKb(png,'👁 <i>Aperçu sous-titres</i>',null); }catch(_){} } }
    else { const png=await r0SubSample(persona); if(png){ try{ await sendPhotoKb(png, '👁 <i>Aperçu sous-titres</i>', null); }catch(e){} } else { try{ await toast('Aperçu indisponible (pas d\'image source du projet)'); }catch(e){} } }
    await r0Render(persona, editMid); return; }
  const res=NAV.reduce(d, {screen:r0Screen,section:r0Section,block:r0Block,ret:r0Ret,pending:r0Pending,quitFrom:r0QuitFrom,srcReturn:r0SrcReturn}, cur, ctx);
  // DRY-RUN : trace des paramètres qui PARTIRAIENT au moteur (prompt/look/décor du projet) — sim ET réel, AUCUN appel ici.
  if(d==='R0_GO' && res.op && res.op.type==='create' && res.op.kind==='image'){
    try{ const {PO}=_r0(); jlog('[v4r] PHOTO '+(ENG.liveFor('photo')?'RÉEL':'SIMULÉ')+' — '+PO.trace(S.getDraft(cur,'photo'), _r0Lookbook(), _r0Outfits())); }catch(e){}
  }
  if(d==='R0_GO' && res.op && res.op.type==='create' && res.op.kind==='video'){
    try{ const dr=S.getDraft(cur,'video')||{}; const sp=(C.lastImage(cur)||{}).file||'(aucune)'; jlog('[v4r] VIDÉO '+(ENG.liveFor('video')?'RÉEL':'SIMULÉ')+' — source='+sp+' · durée='+(dr.duree||'30s')+' · script='+(dr.script?('"'+String(dr.script).slice(0,40)+'"'):'(auto Anthropic)')); }catch(e){}
  }
  // ── GÉNÉRATION PHOTO RÉELLE (Seedream éco) : SEULEMENT sur GO + LIVE + photo + PAS en dry-run. C'est la SEULE dépense, déclenchée par le clic d'Etoile. ──
  //   [SÉCURITÉ] !R0DRY OBLIGATOIRE : le banc d'essai ne doit JAMAIS appeler le moteur réel ni dépenser, même si LIVE est armé.
  const realPhoto = (d==='R0_GO' && res.op && res.op.type==='create' && res.op.kind==='image' && ENG.liveFor('photo') && !R0DRY);
  if(realPhoto){
    if(r0Busy){ try{ await toast('⏳ Génération déjà en cours — patiente (ne reclique pas)'); }catch(e){} return; } // VERROU anti double-dépense
    r0Busy=true; r0GenLock(true,'photo'); // [VERROU GÉNÉRATION] bloque tout deploy/restart pendant la génération
    r0Generating=true; r0GenStep='Seedream · ~30 s à 1 min'; // [🔴3/4 H13] confirm2 masque Oui/Annuler pendant la génération
    try{
      await r0Render(persona, editMid, '⏳ <b>Génération en cours…</b> <i>(Seedream, ~30 s à 1 min — ne reclique pas)</i>'); // état EN COURS (sans Oui/Annuler)
      const out=await r0RealPhoto(persona, id); // appelle generateLook (avec timeout), dépose la photo RÉELLE, enregistre le test
      r0Generating=false; r0GenStep=''; // [🔴3/4] terminé : on rétablit les écrans normaux
      r0Screen=res.st.screen; r0Section=res.st.section; r0Block=res.st.block; r0Ret=res.st.ret; r0Pending=res.st.pending; r0QuitFrom=res.st.quitFrom; r0SrcReturn=res.st.srcReturn;
      const okBanner='✨ <b>Photo générée</b> · ✅ terminé'+(out.credits!=null?(' · '+out.credits+' cr'):''); // [#11] plus de « test n°X/10 »
      // [MESSAGE TECHNIQUE COMPLET — Etoile] échec = cause EXACTE + porte de sortie, JAMAIS de retour silencieux.
      const koBanner='⚠️ <b>Génération photo NON aboutie</b>'+(out.err?('\n<i>Cause : '+_r0esc(out.err)+'</i>'):'')+'\nAucune photo déposée. Touche ◀ Retour pour réessayer, ou /accueil.';
      if(out.ok){ const mi=C.lastImage(r0Cur(persona)); if(mi&&mi.file) await r0PostFinal('photo', mi.file, r0FinalCap(persona,'photo',false,null)); } // [RENDU PERSISTANT] keepsake séparé [#11] sans « test n°X/10 »
      await r0Render(persona, editMid, out.ok ? okBanner : koBanner);
    } catch(e){ try{ await r0Render(persona, editMid, '⚠️ <b>Incident génération photo</b>\n<i>Cause : '+_r0esc(e.message||String(e))+'</i>\nRien n\'est perdu. ◀ Retour ou /accueil.'); }catch(_){} }
    finally { r0Busy=false; r0Generating=false; r0GenStep=''; r0GenLock(false); }
    return;
  }
  // ── GÉNÉRATION VIDÉO RÉELLE (script Anthropic + voix ElevenLabs + lipsync Kling) : SEULEMENT sur GO + LIVE + vidéo + 3 clés présentes. ──
  //    Même double-confirmation, même plafond budget. JAMAIS en dry-run (R0DRY). C'est la SEULE dépense vidéo, déclenchée par le clic d'Etoile.
  const realVideo = (d==='R0_GO' && res.op && res.op.type==='create' && res.op.kind==='video' && ENG.liveFor('video') && !R0DRY);
  if(realVideo){
    if(r0Busy){ try{ await toast('⏳ Génération déjà en cours — patiente (ne reclique pas)'); }catch(e){} return; } // VERROU anti double-dépense
    r0Busy=true; r0GenLock(true,'video'); // [VERROU GÉNÉRATION] bloque tout deploy/restart pendant la génération
    r0Generating=true; r0GenStep='préparation…'; // [🔴3/4 H13] confirm2 masque Oui/Annuler pendant la génération
    try{
      await r0Render(persona, editMid, '⏳ <b>Vidéo en cours…</b> <i>(ne reclique pas)</i>'); // état EN COURS (sans Oui/Annuler)
      // [AVANCEMENT UN SEUL BLOC — Etoile/Legacy] chaque étape MET À JOUR le MÊME bloc (editMid), pas de flood de messages.
      let _lastStep=0; const onStep=(msg)=>{ const now=Date.now(); if(now-_lastStep<1200) return; _lastStep=now; r0GenStep=String(msg||''); r0Render(persona, editMid, '⏳ <b>Vidéo en cours…</b>\n'+msg).catch(()=>{}); };
      const out=await r0RealVideo(persona, id, onStep); // pipeline réel (timeout), dépose la VIDÉO RÉELLE, enregistre le test
      r0Generating=false; r0GenStep=''; // [🔴3/4] terminé : on rétablit les écrans normaux
      r0Screen=res.st.screen; r0Section=res.st.section; r0Block=res.st.block; r0Ret=res.st.ret; r0Pending=res.st.pending; r0QuitFrom=res.st.quitFrom; r0SrcReturn=res.st.srcReturn;
      const okBanner='🎬 <b>Vidéo générée</b> · ✅ terminé'+(out.credits!=null?(' · '+out.credits+' cr'):''); // [#11] plus de « test n°X/10 »
      // [MESSAGE TECHNIQUE COMPLET — Etoile] échec = cause EXACTE + porte de sortie, JAMAIS de retour silencieux.
      const koBanner='⚠️ <b>Vidéo NON aboutie</b>'+(out.err?('\n<i>Cause : '+_r0esc(out.err)+'</i>'):'')+'\nAucune vidéo déposée. Touche ◀ Retour pour réessayer, ou /accueil.';
      if(out.ok){ const mv=C.lastVideo(r0Cur(persona)); if(mv&&mv.file){ r0CloudCopy(mv.file, id); await r0PostFinal('video', mv.file, r0FinalCap(persona,'video',false,null)); } } // [CLOUD]+[RENDU PERSISTANT] [#11] sans « test n°X/10 »
      await r0Render(persona, editMid, out.ok ? okBanner : koBanner);
    } catch(e){ try{ await r0Render(persona, editMid, '⚠️ <b>Incident génération vidéo</b>\n<i>Cause : '+_r0esc(e.message||String(e))+'</i>\nRien n\'est perdu. ◀ Retour ou /accueil.'); }catch(_){} }
    finally { r0Busy=false; r0Generating=false; r0GenStep=''; r0GenLock(false); }
    return;
  }
  if(d==='R0_GO' && r0Busy){ try{ await toast('⏳ Génération déjà en cours — patiente'); }catch(e){} return; } // verrou aussi hors photo
  if(res.op) NAV.applyOp(res.op, S, BASE, persona, id, cur, ctx, now); // simulé (tout le reste : vidéo/texte/etc. reste mock tant que non autorisé)
  // [RENDU PERSISTANT] création SIMULÉE d'une photo/vidéo (LIVE off) : on dépose AUSSI un message dédié qui RESTE dans le fil (maquette).
  if(res.op && res.op.type==='create' && (res.op.kind==='image' || res.op.kind==='video')){
    try{ const cur2=r0Cur(persona); const isVid=res.op.kind==='video';
      const mi=isVid?C.lastVideo(cur2):C.lastImage(cur2); let file=(mi&&mi.file&&fs.existsSync(mi.file))?mi.file:null;
      // [🔴1] keepsake SIMULÉ : à défaut de fichier réel généré, on montre la SOURCE ACTIVE réelle — JAMAIS la démo cuir. Démo seulement si AUCUN projet.
      if(!file){ const rv=isVid?r0RealVideoFile(cur2):null; file=rv||r0RealSource(cur2); }
      if(!file && !r0HasProject(cur2)){ file=isVid?await r0DemoVideo():r0DemoPhoto(); }
      if(file) await r0PostFinal(isVid?'video':'photo', file, r0FinalCap(persona, isVid?'video':'photo', true, null));
    }catch(e){ try{ jlog('[v4r] rendu sim persistant err '+e.message); }catch(_){} }
  }
  r0Screen=res.st.screen; r0Section=res.st.section; r0Block=res.st.block; r0Ret=res.st.ret; r0Pending=res.st.pending; r0QuitFrom=res.st.quitFrom; r0SrcReturn=res.st.srcReturn;
  if(res.st.galleryKind!=null) r0GalKind=res.st.galleryKind; if(res.st.galleryAll!=null) r0GalAll=res.st.galleryAll; if(res.st.galleryRole!=null) r0GalRole=res.st.galleryRole; /*[G1] rôle galerie (select|history)*/
  if(r0Screen!=='gallery'){ r0GalKind='image'; r0GalAll=false; r0GalDel=false; r0GalRole='select'; } /*réinit hors galerie (scope + mode retrait + rôle)*/
  if(r0Screen!=='resources'){ r0ResFrom=null; } /*[RETOUR CONTEXTUEL] oublie l'origine une fois Fichiers quitté*/
  if(res.await) r0Await=res.await;
  if(res.toast){ try{ await toast(res.toast); }catch(e){} }
  await r0Render(persona, editMid, res.banner);
}

// GÉNÉRATION PHOTO RÉELLE (Seedream éco via newlook.generateLook) — appelée UNIQUEMENT depuis le clic « Valider » d'Etoile (LIVE).
//   Défensive : toute erreur -> aucune photo déposée + message clair, JAMAIS de crash. Enregistre 1 test réel sur succès.
async function r0RealPhoto(persona, id){
  const {S,BUD}=_r0(); const ts=Date.now();
  const {PO}=_r0(); const cur0=r0Cur(persona); const draft=S.getDraft(cur0,'photo')||{};
  const mapped=PO.buildPhotoOpts(draft, _r0Lookbook(), _r0Outfits());      // PROMPT/LOOK/DÉCOR du projet -> opts moteur
  // [SOURCE UNIQUE] la génération RECRÉE à partir de la photo source ÉPINGLÉE (sélection/cover).
  // [ANO-SOURCE-PLACEHOLDER] si la source est un placeholder iCloud dataless, on la MATÉRIALISE d'abord ; sinon on ANNULE proprement
  //   (jamais de génération sur fichier vide, JAMAIS de bascule silencieuse sur la référence persona = bug manteau cuir).
  // [AJOUT 2] use_source : OFF -> on NE passe PAS la photo source (génération « base propre », identité persona seule, sans héritage d'image).
  const useSource = draft.use_source !== false;
  const srcRef=r0SourceFile(cur0);
  if(useSource && srcRef && fs.existsSync(srcRef)){
    const local=await r0EnsureLocal(srcRef);
    if(local){ mapped.opts.refOverride=srcRef; }
    else { jlog('[v4r réel] PHOTO annulée : source iCloud non matérialisée '+path.basename(srcRef));
      return {ok:false, err:'Photo source pas encore téléchargée depuis iCloud — réessaie dans quelques secondes. Génération annulée (aucune dépense, aucune bascule d\'image).'}; }
  }
  jlog('[v4r réel] '+PO.trace(draft, _r0Lookbook(), _r0Outfits())+' | refOverride='+(mapped.opts.refOverride?path.basename(mapped.opts.refOverride):'(référence persona)'));
  let localPath=null, err=null;
  try{
    const gen=await Promise.race([
      nlMod().generateLook(Object.assign({mode:'eco', count:1}, mapped.opts), (msg)=>{ try{ jlog('[v4r réel] '+msg); }catch(e){} }),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('délai dépassé (240 s) — réessaie')),240000)), // garde-fou : ne reste JAMAIS bloqué
    ]);
    const url=(gen&&gen.urls&&gen.urls[0])||null;
    if(!url) throw new Error('aucune image renvoyée');
    const dir=path.join(BASE,'projects_r',persona,id); try{ fs.mkdirSync(dir,{recursive:true}); }catch(e){}
    localPath=path.join(dir,'photo_'+ts+'.jpg');
    try{ await _execFileP('curl',['-s','-o',localPath,url],{timeout:60000}); }catch(e){ localPath=null; throw new Error('téléchargement échoué'); } // [B4] ASYNC
    if(!localPath || !fs.existsSync(localPath) || fs.statSync(localPath).size<2000){ localPath=null; throw new Error('fichier image vide'); }
  }catch(e){ err=(e&&e.message)||String(e); }
  if(localPath){
    S.addCandidate(BASE,persona,id,ts,'image', Object.assign({}, draft, {file:localPath, simule:false, moteur:'seedream-v4', prompt:(draft.prompt||'(éco)')}));
    r0PinSource(persona, id, localPath); // [SOURCE UNIQUE] la photo générée DEVIENT la source du projet (lue partout, y compris vidéo)
    r0CloudCopy(localPath, id); // [CLOUD] dépôt dans podcast-looks/<projet>/ (= iCloud) -> resync + app Fichiers + galerie
    const b=BUD.record(BASE, 0.48); // 1 photo éco = 0,48 cr (mesuré) — 1 test réel consommé
    jlog('[v4r] TEST RÉEL PHOTO n°'+b.tests+'/'+b.max+' — photo déposée '+localPath);
    return {ok:true, tests:b.tests, max:b.max, credits:b.credits};
  }
  jlog('[v4r] génération réelle échouée : '+err);
  return {ok:false, err:err};
}

// GÉNÉRATION VIDÉO RÉELLE (script Anthropic + voix ElevenLabs + lipsync Kling, rendu sous-titres LOCAL gratuit) —
//   appelée UNIQUEMENT depuis le clic « Oui, générer » d'Etoile (LIVE + clés présentes). La SOURCE = la dernière photo
//   validée du projet (devient l'avatar Higgsfield). Défensive : toute erreur -> aucune vidéo déposée + message clair,
//   JAMAIS de crash. Enregistre 1 test réel (au coût estimé) sur succès seulement. Timeout dur (anti-blocage).
// [SOUS-TITRES DÉFINITIF] mappe les réglages d'apparence PAR vidéo (draft.video.st_*) -> options render_local (incrustation finale).
//   Les MÊMES valeurs alimentent l'APERÇU (r0SubSample) ET le rendu réel -> ce qu'elle règle s'applique aux deux.
function r0SubOpts(dv){ dv=dv||{};
  // [#2] DÉFAUT = préréglage VERROUILLÉ Etoile (subtitle_style.js : Archivo Black, 76, OY 0.370, lettrage 2px, blanc majuscules).
  let sty={}; try{ const SS=require('./subtitle_style'); sty={font:SS.FONT,fontSize:SS.FONT_SIZE,oy:SS.OY,letter:parseFloat(SS.LETTER)}; }catch(e){}
  const FONTS={archivo:'Archivo Black',classique:'Arial'};
  const SIZE={S:58,M:76,L:98};                  // [#2] M = taille VALIDÉE Etoile (76), plus une approximation
  // [#1] POSITION : fraction depuis le BAS, alignement ASS CONSTANT = 2 (bas-centre). Plus oy grand = plus HAUT (intuitif, fin de l'inversion).
  const OYP={valide:0.370,bas:0.27,milieu:0.50,haut:0.78};   // [#2] cran « validé » = OY 0.370 (sweet spot Etoile, entre bas et milieu)
  const COLOR={blanc:'&H00FFFFFF',jaune:'&H0000FFFF',cyan:'&H00FFFF00'}; // ASS = &HAABBGGRR
  const o={ font:(sty.font||'Archivo Black'), fontSize:(sty.fontSize!=null?sty.fontSize:76), oy:0.78, // [ÉTAPE0] défaut position HAUT (confirmé Etoile) ; cran « ✅ Validé » (0.370) reste dispo
            letterSpacing:(sty.letter!=null&&isFinite(sty.letter)?sty.letter:2), alignment:2, color:'&H00FFFFFF' };
  // overrides explicites de l'utilisateur (n'écrasent QUE ce qu'elle change ; alignement reste 2 -> aucune inversion).
  if(dv.st_font&&FONTS[dv.st_font])o.font=FONTS[dv.st_font];
  if(dv.st_size&&SIZE[dv.st_size]!=null)o.fontSize=SIZE[dv.st_size];
  if(dv.st_pos&&OYP[dv.st_pos]!=null)o.oy=OYP[dv.st_pos];
  if(dv.st_color&&COLOR[dv.st_color])o.color=COLOR[dv.st_color];
  return o;
}
// [SOUS-TITRES DÉFINITIF] APERÇU : incruste un échantillon (1res lignes du script, sinon phrase type) dans LE style courant,
//   via le MÊME render_local.buildAss que le rendu final -> l'aperçu reflète fidèlement la vidéo générée. Local, gratuit.
// [iCloud DATALESS — Etoile] une photo source peut être un PLACEHOLDER non téléchargé (taille logique pleine mais 0 bloc) :
//   ffmpeg lirait 0 octet -> échec -> repli statique. On force le téléchargement (brctl) et on ATTEND la matérialisation.
async function r0EnsureLocal(file){ try{ if(!file||!fs.existsSync(file)) return false;
  let blocks='1'; try{ blocks=require('child_process').execSync('stat -f%b "'+file+'" 2>/dev/null').toString().trim(); }catch(e){}
  if(+blocks>0) return true;                                   // déjà matérialisé sur le disque
  try{ await _execFileP('brctl',['download',file],{timeout:20000}); }catch(e){}
  for(let i=0;i<12;i++){ try{ const b=require('child_process').execSync('stat -f%b "'+file+'" 2>/dev/null').toString().trim(); if(+b>0) return true; }catch(e){} await new Promise(r=>setTimeout(r,400)); }
  return false;
}catch(e){ return false; } }
// [🔴2] DÉCOUPAGE de l'aperçu = EXACTEMENT celui du rendu FINAL : on réutilise render_local.buildChunks sur le VRAI texte du script.
//   Le groupement (≈2 mots) ne dépend QUE des mots (leur longueur), PAS des timings -> identique au final quels que soient les timings TTS.
//   Script VIDE -> 1 chunk « EXEMPLE » clairement marqué (jamais un faux texte présenté comme réel). maxWords borne la durée de l'aperçu.
function r0SubChunks(dv, maxWords){ const rl=freshRL();
  const txt=(dv&&dv.script&&String(dv.script).trim())||'';
  if(!txt){ return { exemple:true, chunks:[{ text:'EXEMPLE — ajoute un script', start:0, length:99 }] }; }
  const words=txt.replace(/\s+/g,' ').trim().split(' ').slice(0, maxWords||8);
  const wt=words.map((w,i)=>({ text:w, start:i*0.5, end:i*0.5+0.5 })); // timings réguliers : buildChunks groupe par MOTS -> découpage = celui du final
  let chunks=[]; try{ chunks=rl.buildChunks(wt); }catch(e){ chunks=[{ text:words.join(' '), start:0, length:99 }]; }
  if(!chunks.length) chunks=[{ text:words.join(' '), start:0, length:99 }];
  return { exemple:false, chunks };
}
async function r0SubSample(persona){
  try{ const {S,C}=_r0(); const f=r0Cur(persona,true); const dv=S.getDraft(f,'video')||{};
    const img=r0CoverFile(f); if(!img||!fs.existsSync(img)) return null;
    await r0EnsureLocal(img); // iCloud : matérialise la source avant ffmpeg
    const o=r0SubOpts(dv); const rl=freshRL(); const W=720,H=1280;
    const sc=r0SubChunks(dv,8); const phrase=sc.chunks[0].text; // PNG = 1 frame -> 1er chunk RÉEL (même découpage que le final)
    const assPath='/tmp/v4rsub_'+Date.now()+'.ass';
    fs.writeFileSync(assPath, rl.buildAss([{text:phrase,start:0,length:99}], {font:o.font,fontSize:o.fontSize,oy:o.oy,alignment:o.alignment,color:o.color,letterSpacing:o.letterSpacing}));
    const out='/tmp/v4rsub_'+Date.now()+'.png';
    try{ await _execFileP('ffmpeg',['-y','-i',img,'-vf','scale='+W+':'+H+':force_original_aspect_ratio=increase,crop='+W+':'+H+',setsar=1,ass='+assPath,'-frames:v','1','-q:v','2',out],{timeout:30000}); }catch(e){ return null; }
    return fs.existsSync(out)?out:null;
  }catch(e){ return null; }
}
// [APERÇU VIDÉO RÉEL — Etoile/Legacy] court clip ÉCHANTILLON depuis la photo source (zoom lent) avec sous-titres INCRUSTÉS
//   dans LE style courant (mêmes r0SubOpts que le rendu final). Le texte est un échantillon ; ce qui compte = voir la FORME.
//   Cache par (source + réglages) -> on ne régénère pas un clip identique. Local, gratuit, async (ne bloque pas la boucle).
let _r0SubClipCache={};
async function r0SubClip(persona){
  try{ const {S}=_r0(); const f=r0Cur(persona,true); const dv=S.getDraft(f,'video')||{};
    const img=r0SourceFile(f); if(!img||!fs.existsSync(img)) return null;
    const o=r0SubOpts(dv);
    const sc=r0SubChunks(dv,8); const chunks=sc.chunks;                          // [🔴2] VRAI texte du script, découpé EXACTEMENT comme le rendu final (buildChunks)
    const keytext=chunks.map(c=>c.text).join('|');
    let key=img+'|'+JSON.stringify(o)+'|'+keytext; let h=0; for(let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0;
    const out=path.join(BASE,'assets_r','subclip_'+h.toString(36)+'.mp4');
    if(_r0SubClipCache[h] && fs.existsSync(out)) return out;
    if(R0DRY) return out; // dry : pas de ffmpeg
    try{ fs.mkdirSync(path.join(BASE,'assets_r'),{recursive:true}); }catch(e){}
    const rl=freshRL(); const assPath='/tmp/subclip_'+h.toString(36)+'.ass';
    fs.writeFileSync(assPath, rl.buildAss(chunks, {font:o.font,fontSize:o.fontSize,oy:o.oy,alignment:o.alignment,color:o.color,letterSpacing:o.letterSpacing}));
    const local=await r0EnsureLocal(img); if(!local){ try{ jlog('[v4r] subclip : source iCloud non matérialisée '+path.basename(img)); }catch(_){} return null; } // [iCloud] matérialise avant ffmpeg (placeholders dataless)
    await _execFileP('ffmpeg',['-y','-loop','1','-i',img,'-t','4',
      '-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z=\'min(zoom+0.0012,1.12)\':d=100:s=720x1280:fps=25,ass='+assPath+',format=yuv420p',
      '-r','25','-c:v','libx264','-preset','veryfast','-movflags','+faststart',out],{timeout:60000});
    if(fs.existsSync(out)){ _r0SubClipCache[h]=1; try{ jlog('[v4r] aperçu sous-titres CLIP produit '+out+' (src '+path.basename(img)+')'); }catch(_){} return out; }
  }catch(e){ try{ jlog('[v4r] subclip err '+e.message); }catch(_){} }
  try{ jlog('[v4r] subclip ÉCHEC -> repli'); }catch(_){}
  return null;
}
async function r0RealVideo(persona, id, onStep){
  const {S,C,BUD}=_r0(); const ts=Date.now();
  const facts=r0Cur(persona); const draft=S.getDraft(facts,'video')||{};
  // [SOURCE UNIQUE] la vidéo utilise EXACTEMENT la même image source que partout ailleurs (r0SourceFile : source épinglée -> cover).
  const srcPath=r0SourceFile(facts);
  const est=r0EstFor(persona, {kind:'video', mediaKind:'video'});                 // coût estimé (cr) AVANT — sert au compteur de test
  const secs=parseInt(String(draft.duree||'30'),10)||30;
  const parts=Math.max(1, Math.round(secs/30));                                    // 30s -> 1 part, 60s -> 2 (aligné Kling)
  const words=Math.max(20, Math.round(secs*2.4));                                  // densité de parole ~ legacy
  // [B+ — Etoile] LA CATÉGORIE DOIT GAGNER. Un script « simulé » (placeholder) NE DOIT PAS écraser le thème choisi.
  //   priorité : script RÉEL écrit par Etoile > thème legacy choisi (seed EN) > source > nom.
  const _isSim=s=>/simulé|généré — simul|\(simulé/i.test(String(s||''));
  const userScript=(draft.script&&String(draft.script).trim()&&!_isSim(draft.script))?String(draft.script).trim():null;
  const topic=userScript || (draft.theme_seed&&String(draft.theme_seed)) || (draft.source&&String(draft.source)) || (facts&&facts.nom) || 'Podcast';
  let finalP=null, err=null;
  try{
    if(!srcPath || !fs.existsSync(srcPath)) throw new Error('aucune photo source validée — valide d\'abord une photo');
    // [ANO-SOURCE-PLACEHOLDER] matérialise la source iCloud (dataless) avant de la passer à Kling ; jamais d'avatar vide / bascule silencieuse.
    const _local=await r0EnsureLocal(srcPath); if(!_local) throw new Error('photo source pas encore téléchargée depuis iCloud — réessaie dans quelques secondes (aucune dépense)');
    process.env.HIGGS_AVATAR_URL=srcPath;                                          // la source v4r devient l'avatar (prepareImage gère un chemin local)
    const tsStr=new Date(ts).toISOString().slice(0,16).replace(/[:T]/g,'-');
    const outDir=path.join(BASE,'projects_r',persona,id); try{ fs.mkdirSync(outDir,{recursive:true}); }catch(e){}
    const STEP=(typeof onStep==='function')?onStep:(()=>{});
    const run=(async()=>{
      STEP('🖼 Étape 1/5 — Préparation de l\'image…');
      const imageUrl=await WF.prepareImage();                                      // upload avatar (depuis la photo locale)
      const clips=[]; const prevScripts=[];
      for(let i=1;i<=parts;i++){
        const pp=parts>1?(' (partie '+i+'/'+parts+')'):'';
        STEP('📝 Étape 2/5 — Écriture du script'+pp+'…');
        const c=await WF.generateScript(i===1?topic:WF.partPrompt(topic,i,parts,prevScripts), words); // script Anthropic
        prevScripts.push(c.script);
        STEP('🎙 Étape 3/5 — Génération de la voix'+pp+'…');
        const audio=await WF.generateAudio((typeof _sanTTS==='function'?_sanTTS(c.script):c.script), i);  // voix ElevenLabs (garde-fou TTS si dispo)
        STEP('🎬 Étape 4/5 — Lipsync (Kling)'+pp+'… <i>2 à 5 min</i>');
        const lip=await WF.generateLipsync(imageUrl, audio.audioUrl, i);           // lipsync Kling
        const rawi=await WF.saveLipsyncRaw(lip, i, tsStr, outDir);
        STEP('✨ Étape 5/5 — Montage + sous-titres'+pp+'…');
        const vid=await WF.renderVideo(lip, audio.wordTimings, c.keywords, audio.duration, i, c.reactions, rawi, r0SubOpts(draft)); // sous-titres LOCAL (gratuit) — apparence PAR vidéo (draft.st_*)
        const p=await WF.saveOpen(vid, c, tsStr, i, outDir);
        clips.push(p);
      }
      const ok=clips.filter(Boolean);
      let fp=ok[0];
      if(ok.length>1){ fp=path.join(outDir, tsStr+'_v4r_FINAL.mp4'); WF.concatClips(ok, fp); }
      return fp;
    })();
    finalP=await Promise.race([ run,
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('délai dépassé (15 min) — réessaie')), 900000)), // garde-fou : ne reste JAMAIS bloqué
    ]);
    if(!finalP || !fs.existsSync(finalP) || fs.statSync(finalP).size<5000){ finalP=null; throw new Error('vidéo vide'); }
  }catch(e){ err=(e&&e.message)||String(e); finalP=null; }
  if(finalP){
    S.addCandidate(BASE,persona,id,ts,'video', Object.assign({}, draft, {file:finalP, simule:false, moteur:'kling+elevenlabs', script:(draft.script||topic)}));
    const cr=(est&&est.credits!=null)?est.credits:26; // coût réel estimé (cr) — 1 test réel consommé
    const b=BUD.record(BASE, cr);
    jlog('[v4r] TEST RÉEL VIDÉO n°'+b.tests+'/'+b.max+' — vidéo déposée '+finalP);
    return {ok:true, tests:b.tests, max:b.max, credits:b.credits};
  }
  jlog('[v4r] génération vidéo réelle échouée : '+err);
  return {ok:false, err:err};
}

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
    // [cockpit-v4] INTERCEPT : si le nouveau cockpit est actif (/v4), il prend la main sur TOUS les callbacks.
    if(d&&d.indexOf('R0_')===0){ /*[RÉALISATION — référence produit] navigation par ÉCRANS, UN bloc vivant, génération SIMULÉE (zéro dépense), publication GATÉE. Isolé du legacy et de /v4.*/
      try{
        const persona=_persona(); const tappedMid=cb.message.message_id;
        // [ÉCRAN FINAL FIGÉ — Etoile] un tap sur un BLOC RÉSULTAT persistant NE DOIT JAMAIS l'éditer (il reste, toujours).
        //   -> on agit sur le COCKPIT (bloc vivant séparé) : on l'édite s'il vit, sinon on en repose un neuf. Le bloc final est préservé.
        if(r0RenderMids.indexOf(tappedMid)>=0){ r0Type='text';
          await r0Dispatch(persona, d, (r0Mid && r0Mid!==tappedMid)?r0Mid:null);
        } else {
          r0Mid=tappedMid; r0Type=(cb.message&&cb.message.video)?'video':((cb.message&&cb.message.photo)?'photo':'text'); /*sync sur le bloc tapé*/
          await r0Dispatch(persona, d, tappedMid);
        }
      }catch(e){ jlog('R0 cb err '+e.message); /*FILET : un tap ne reste JAMAIS mort -> on re-rend l'écran courant + RAPPORT D'INCIDENT exploitable (jamais de blocage silencieux)*/
        try{ await r0Render(_persona(), cb.message.message_id, '⚠️ <b>Incident sur cette action</b> — <i>'+_r0esc(e.message||'erreur')+'</i>\nRien n\'est perdu. Réessaie, ou tape <b>/accueil</b> pour repartir proprement.'); }
        catch(_){ try{ await send('⚠️ <b>Incident</b> — tape <b>/accueil</b> pour reprendre (rien n\'est perdu).'); }catch(__){} } }
      cbAnswered=true; try{await answerCB(cb.id);}catch(e){} return;
    }
    if(v4active){ try{ await cockpitV4().handle(d); }catch(e){ jlog('v4 handle err '+e.message); } cbAnswered=true; try{await answerCB(cb.id);}catch(e){} return; }
    // [L0-1d-fix] ROUTEUR MODULAIRE (strangler-fig) : navigation INTRA-bloc = ÉDITION EN PLACE du bloc tapé.
    // On ancre le bloc racine actif sur LE message d'où vient le tap (chaque bloc ACCUEIL s'édite lui-même, même un ancien).
    if(d&&(d.indexOf('R_')===0||d.indexOf('RH_')===0||d.indexOf('RX_')===0||d.indexOf('PL_')===0||d.indexOf('PR_')===0||d.indexOf('PP_')===0||d.indexOf('SP_')===0||d.indexOf('VS_')===0||d.indexOf('VP_')===0||d.indexOf('VM_')===0||d.indexOf('VL_')===0||d.indexOf('VX_')===0||d.indexOf('PX_')===0||d.indexOf('SL_')===0||d.indexOf('WS_')===0)){try{if(cb.message&&cb.message.message_id&&cb.message.message_id!==newlook.mediaId)activeRootMid=cb.message.message_id;}catch(e){}} /*[L0-2a-bis/ter,L0-2b] ancre le bloc TEXTE actif ; JAMAIS le workspace média (newlook.mediaId) -> le menu texte reste éditable au retour*/
    if(d&&d.indexOf('R_')===0&&uiRouter.has(d.slice(2))){await routeBlock(d.slice(2),'inplace');return;}
    if(d&&d.indexOf('RH_')===0&&uiRouter.has(d.slice(3))){ const hid=d.slice(3);
      if(MEDIA_MODULES[hid]&&wsOpen){ const mod=uiRouter.REGISTRY[hid]; const help=(mod&&mod.help)||('Écran « '+hid+' ».'); await nlText('❓ <b>AIDE</b> · '+((mod&&mod.title)||hid)+'\n\n'+help,[[{text:'◀️ Retour',callback_data:'R_'+hid}]]); return; } /*[L0-2a-ter] aide d'un écran workspace = caption du bloc média (pas de bloc texte parasite)*/
      await uiRouter.routeHelp(hid,uiCtx(hid),'inplace');return;
    } /*[L0-1d] aide contextuelle EN PLACE (édite le bloc courant)*/
    if(d==='RLOCK'){await toast('🔒 Choisis d\'abord');return;} /*[L0-1c] ➡ Suivant désactivé tant que le choix n'est pas fait*/
    if(d==='RX_REFS'){await showRefMenu();return;} /*[L0-1] pont STUDIO→Références (fonction existante)*/
    if(d==='RX_DRAFTS'){ /*[C1] liste des projets rendue sur l'UNIQUE bloc média (plus de bloc texte séparé)*/
      const ds=listDrafts(); let p=null;try{p=ensureProj();}catch(e){}
      if(!ds.length){ await uiShowMedia(wsMedia(p),cockpitHeader(p)+'📂 <b>Aucun projet en cours.</b>\n\nLance « ✨ Générer un nouveau contenu ».',[[{text:'◀️ Accueil',callback_data:'R_home'}]]); return; }
      const rows=ds.slice(0,10).map(x=>[{text:'📂 '+({look:'Look',image:'Image',video:'Vidéo'}[x.step]||x.step)+' · '+(x.draftId||'').replace('draft_','').replace(/-/g,'/').slice(0,16),callback_data:'RX_DRAFT_'+x.draftId}]);
      rows.push([{text:'◀️ Accueil',callback_data:'R_home'}]);
      await uiShowMedia(wsMedia(p),cockpitHeader(p)+'📂 <b>Reprendre un projet</b> ('+ds.length+')',rows); return;
    }
    if(d==='HOME_UPLOAD'){ /*[C5] 3e choix accueil : importer une photo -> workspace look, attente d'upload (même bloc)*/
      const p=ensureProj(); p.look.source='upload'; state='ws_look_upload_wait'; await toast('📤 Envoie ta photo'); await routeBlock('photo.look','inplace'); return;
    }
    if(d&&d.indexOf('RX_DRAFT_')===0){await resumeDraft(d.slice(9));return;} /*[L0-1e] reprend le MÊME draftId (pas de doublon)*/
    // [L0-2a] WORKFLOW PHOTO — handlers PL_* (écrivent le slice du projet actif, re-rendent EN PLACE dans le bloc actif)
    if(d&&d.indexOf('PL_')===0){
      const p=ensureProj(); let lb={categories:{},envs:{}};try{lb=nlMod().readLookbook();}catch(e){}
      if(d==='PL_NOOP'){await toast('');return;}
      if(d==='PL_SRC_new'){p.look.source='new';p.look.extra=null;p.look.file=null;await afterCoreChange(p,'look','photo.look');return;}
      if(d==='PL_SRC_up'){ state='ws_look_upload_wait'; await toast('📤 Envoie la photo du look'); await routeBlock('photo.look','inplace'); return; } /*upload look -> aperçu immédiat dans le workspace*/
      if(d==='PL_GPREV'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx-1+list.length)%list.length;} await routeBlock('photo.lookgal','inplace'); return; }
      if(d==='PL_GNEXT'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx+1)%list.length;} await routeBlock('photo.lookgal','inplace'); return; }
      if(d==='PL_GSET'){ const list=looksList(); const f=list[refGalIdx]; if(f){ const fp=path.join(getLooksDir(),f); p.look.file=fp; p.look.source='gallery'; try{setWorkPhoto(fp);}catch(e){} await toast('✅ Look choisi'); } await afterCoreChange(p,'look','photo.look'); return; }
      if(d==='PL_TENUE'){const k=Object.keys(lb.categories||{});if(k.length){const i=k.indexOf(p.look.category);p.look.category=k[(i+1)%k.length];p.look.extra=null;}if(!p.look.source)p.look.source='new';await afterCoreChange(p,'look','photo.look');return;}
      if(d==='PL_ENV'){const k=Object.keys(lb.envs||{});if(k.length){const i=k.indexOf(p.look.env);p.look.env=k[(i+1)%k.length];}if(!p.look.source)p.look.source='new';await afterCoreChange(p,'decor','photo.look');return;}
      if(d==='PL_FMT'){const m=['eco','planche','hd'];const i=m.indexOf(p.look.mode);p.look.mode=m[(i+1)%m.length];if(!p.look.source)p.look.source='new';await afterCoreChange(p,'look','photo.look');return;}
      if(d==='PL_NB'){const s=[1,2,3,4,6];const i=s.indexOf(p.look.count||1);p.look.count=s[(i+1)%s.length];if(!p.look.source)p.look.source='new';await afterCoreChange(p,'nb','photo.look');return;}
      if(d==='PL_PREV'){if(p.image.urls.length){p.image.idx=(p.image.idx-1+p.image.urls.length)%p.image.urls.length;newlook.idx=p.image.idx;}await routeBlock('photo.image','inplace');return;}
      if(d==='PL_NEXT'){if(p.image.urls.length){p.image.idx=(p.image.idx+1)%p.image.urls.length;newlook.idx=p.image.idx;}await routeBlock('photo.image','inplace');return;}
      if(d==='PL_PICK'){if(p.image.urls.length){p.image.validated=p.image.idx;p.step='image';}await afterCoreChange(p,'image','photo.image');return;} /*écrit le slice image (validée)*/
      if(d==='PL_VIEW'){if(p.image.urls.length){newlook.idx=p.image.idx;await nlShowResult();}else{await toast('Aucune image');}return;}
      if(d==='PL_GEN'){ p.image.confirming=true; await routeBlock('photo.image','inplace'); return; } // confirmation DANS le workspace (pas de nouveau bloc) ; jamais de génération en test
      if(d==='PL_GEN_NO'){ p.image.confirming=false; await routeBlock('photo.image','inplace'); return; }
      if(d==='PL_GEN_DO'){ // génération RÉELLE — pont vers le moteur existant (hors test) ; utilise le prompt du slice
        p.image.confirming=false;
        try{ projToNewlook(); newlook.basePrompt=(p.prompt&&p.prompt.text)||null; newlook.urls=[];newlook.files=[];newlook.idx=0; await runNewLook(); const durable=persistProjMedia(newlook.urls||[],genState.activeDraftId); p.image.urls=durable.slice(); newlook.urls=durable.slice(); newlook.files=[]; p.image.idx=newlook.idx||0; p.image.validated=null; p.step='image'; }catch(e){ await toast('❌ '+(e&&e.message||'erreur')); } /* [#2] stocke des chemins LOCAUX durables dans proj (reprise fiable) */
        await routeBlock('photo.image','inplace'); return;
      }
      if(d==='PL_EDIT'){ /*[T7] éditeur depuis Photo : réutilise le bloc photo (pas de nouveau message)*/ try{ if(p.image.urls.length){const f=nlLocal(p.image.idx);if(f)setWorkPhoto(f);} cockpit.mid=newlook.mediaId||cockpit.mid; }catch(e){} await showEditHome(); return; }
      await routeBlock('photo.look','inplace');return;
    }
    // [L0-2a-bis] GESTION RÉFÉRENCE dans le workspace (rendu EN PLACE dans le bloc média)
    if(d&&d.indexOf('PR_')===0){
      if(d==='PR_UP'){ state='ws_ref_upload_wait'; await toast('📤 Envoie la photo de référence'); await routeBlock('photo.ref','inplace'); return; } /*passe en attente + affiche « en attente » dans le bloc*/
      if(d==='PR_GPREV'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx-1+list.length)%list.length;} await routeBlock('photo.refgal','inplace'); return; }
      if(d==='PR_GNEXT'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx+1)%list.length;} await routeBlock('photo.refgal','inplace'); return; }
      if(d==='PR_GSET'){ const list=looksList(); const f=list[refGalIdx]; if(f){ try{setImanyRef(path.join(getLooksDir(),f));}catch(e){} await toast('✅ Référence mise à jour'); } await afterCoreChange(p,'ref','photo.ref'); return; } /*aperçu immédiat de la nouvelle réf*/
      return;
    }
    // [L0-2a-ter] PROMPT UTILISATEUR dans le workspace (rendu EN PLACE dans le bloc média)
    if(d&&d.indexOf('PP_')===0){
      const p=ensureProj();
      if(d==='PP_EDIT'){ state='ws_prompt_edit_wait'; await toast('✍️ Envoie le nouveau prompt'); await routeBlock('photo.prompt','inplace'); return; }
      if(d==='PP_DEFAULT'){ p.prompt={text:defaultPromptText(),name:'défaut'}; await toast('↩️ Prompt par défaut'); await afterCoreChange(p,'prompt','photo.prompt'); return; }
      if(d==='PP_SAVE'){ state='ws_prompt_save_wait'; await toast('💾 Envoie le nom du prompt'); await routeBlock('photo.prompt','inplace'); return; }
      if(d&&d.indexOf('PP_USE_')===0){ const it=getPromptLib(d.slice(7)); if(it){ p.prompt={text:it.text,name:it.name}; await toast('✅ Prompt « '+it.name+' »'); } await afterCoreChange(p,'prompt','photo.prompt'); return; }
      return;
    }
    // [C7 CÂBLÉ] PROPAGATION re-éditabilité : Conserver / Mettre à jour / Régénérer l'aval
    if(d&&d.indexOf('PX_')===0){
      const p=ensureProj(); const ret=(projPending&&projPending.ret)||'photo.look'; const sl=(projPending&&projPending.slice)||null;
      const impacted=sl?projDownstream(sl):[];
      if(d==='PX_KEEP'){ projPending=null; try{p._dirty={};}catch(e){} await toast('✅ Aval conservé'); await routeBlock(ret,'inplace'); return; }
      if(d==='PX_UPDATE'){ projPending=null; try{p._dirty={};}catch(e){} await toast('🔄 Aval resynchronisé'); await routeBlock(ret,'inplace'); return; } /*garde le contenu, efface le flag (resync non destructif)*/
      if(d==='PX_REGEN'){ /*vide l'aval dépendant -> régénération (coût reconfirmé au moment de générer)*/
        try{ if(impacted.indexOf('image')>=0){ p.image.urls=[]; p.image.idx=0; p.image.validated=null; }
             if(impacted.indexOf('video')>=0){ p.video.script={text:'',name:'—'}; p.video.media=null; p.video.legende={courte:'',longue:'',tags:''}; } }catch(e){}
        projPending=null; try{p._dirty={};}catch(e){} await toast('♻️ Aval à régénérer'); await routeBlock(ret,'inplace'); return; }
      return;
    }
    // [v5] STUDIO · LOOKS dans le bloc média (consultation/réutilisation non destructive)
    if(d&&d.indexOf('SL_')===0){
      const list=looksList();
      if(d==='SL_PREV'){ if(list.length){_slLooksIdx=(_slLooksIdx-1+list.length)%list.length;} await routeBlock('studio.looks','inplace'); return; }
      if(d==='SL_NEXT'){ if(list.length){_slLooksIdx=(_slLooksIdx+1)%list.length;} await routeBlock('studio.looks','inplace'); return; }
      if(d==='SL_USE'){ const f=list[_slLooksIdx]; if(f){ const p=ensureProj(); const fp=path.join(getLooksDir(),f); p.look.file=fp; p.look.source='gallery'; try{setWorkPhoto(fp);}catch(e){} await toast('👗 Look appliqué au projet'); } await routeBlock('studio.looks','inplace'); return; }
      return;
    }
    // [v8 · point 7] retour bibliothèque -> EXACTEMENT l'étape du projet en cours (ou accueil si aucun projet)
    if(d==='WS_RESUME'){ await routeBlock(currentStepModule(ensureProj()),'inplace'); return; }
    // [L0-2a-ter] STUDIO · gestion bibliothèque de prompts (texte, EN PLACE)
    if(d&&d.indexOf('SP_')===0){
      if(d&&d.indexOf('SP_VIEW_')===0){ const it=getPromptLib(d.slice(8)); await toast(it?(it.name+' : '+it.text.slice(0,180)):'introuvable'); return; }
      if(d&&d.indexOf('SP_REN_')===0){ spRenameSlug=d.slice(7); state='sp_rename_wait'; await toast('✏️ Envoie le nouveau nom'); return; }
      if(d&&d.indexOf('SP_DEL_')===0){ deletePromptLib(d.slice(7)); await toast('🗑 Supprimé'); await routeBlock('studio.prompts','inplace'); return; }
      return;
    }
    // [L0-2b] VIDÉO · SOURCE (5 sources) — rendu EN PLACE dans le workspace média
    if(d&&d.indexOf('VS_')===0){
      const p=ensureProj();
      const ask=()=>{ /*E115 : si un script aval existe, changer la source peut le rendre incompatible -> on prévient (pas d'effacement)*/ };
      if(d==='VS_PROJLOOK'){ const f=lookFile(p); if(f){p.video.media=f;p.video.source='projlook';await toast('✅ Look du projet');}else{await toast('⚠️ Aucun look projet');} await routeBlock('video.source','inplace'); return; }
      if(d==='VS_GENIMAGE'){ if(p.image.urls.length){const i=(p.image.validated!=null?p.image.validated:p.image.idx);const lf=nlLocal(i);p.video.media=lf||p.video.media;p.video.source='genimage';await toast('✅ Image générée');}else{await toast('⚠️ Aucune image générée');} await routeBlock('video.source','inplace'); return; }
      if(d==='VS_NEWLOOK'){ p.video.source='newlook'; p.step='look'; await toast('✨ Génère le look d\'abord (étape Look)'); await routeBlock('photo.look','inplace'); return; } /*renvoie à l'étape Look pour générer*/
      if(d==='VS_UPLOAD'){ state='ws_video_upload_wait'; await toast('📤 Envoie l\'image de la vidéo'); await routeBlock('video.source','inplace'); return; }
      if(d==='VS_GPREV'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx-1+list.length)%list.length;} await routeBlock('video.srcgal','inplace'); return; }
      if(d==='VS_GNEXT'){ const list=looksList(); if(list.length){refGalIdx=(refGalIdx+1)%list.length;} await routeBlock('video.srcgal','inplace'); return; }
      if(d==='VS_GSET'){ const list=looksList(); const f=list[refGalIdx]; if(f){p.video.media=path.join(getLooksDir(),f);p.video.source='gallook';await toast('✅ Look galerie');} await routeBlock('video.source','inplace'); return; }
      return;
    }
    // [L0-2b] VIDÉO · SCRIPT (slice + biblio + génération derrière confirmation)
    if(d&&d.indexOf('VP_')===0){
      const p=ensureProj();
      if(d==='VP_EDIT'){ state='ws_vscript_edit_wait'; await toast('✍️ Envoie le script'); await routeBlock('video.script','inplace'); return; }
      if(d==='VP_SAVE'){ state='ws_vscript_save_wait'; await toast('💾 Envoie le nom du script'); await routeBlock('video.script','inplace'); return; }
      if(d&&d.indexOf('VP_USE_')===0){ const it=getScriptLib(d.slice(7)); if(it){p.video.script={text:it.text,name:it.name};await toast('✅ Script « '+it.name+' »');} await routeBlock('video.script','inplace'); return; }
      if(d==='VP_GEN'){ await toast('🤖 Génération de script = payante (Anthropic). Édite-le à la main pour tester à sec, ou confirme à l\'export.'); await routeBlock('video.script','inplace'); return; } /*génération script = hors test (Anthropic épuisé)*/
      return;
    }
    // [L0-2b] VIDÉO · MONTAGE (bridge éditeur avancé dans le bloc)
    if(d==='VM_EDIT'){ const p=ensureProj(); try{ const m=videoMedia(p); if(m)setWorkPhoto(m); cockpit.mid=newlook.mediaId||cockpit.mid; p.video.montage.touched=true; }catch(e){} editReturn='video.montage'; await showEditHome(); return; } /*éditeur avancé DANS le bloc workspace ; Retour revient au montage (bloc unique)*/
    // [L0-2b] VIDÉO · LÉGENDE (slice)
    if(d==='VL_EDIT'){ state='ws_vleg_edit_wait'; await toast('✍️ Envoie la légende'); await routeBlock('video.legende','inplace'); return; }
    // [L0-2b] VIDÉO · EXPORT (confirmation OBLIGATOIRE ; génération hors test)
    if(d&&d.indexOf('VX_')===0){
      const p=ensureProj();
      if(d==='VX_GEN'){ p.video.confirming=true; await routeBlock('video.export','inplace'); return; }
      if(d==='VX_NO'){ p.video.confirming=false; await routeBlock('video.export','inplace'); return; }
      if(d==='VX_GO'){ p.video.confirming=false; await toast('⚠️ Génération vidéo (bridge) — non déclenchée en test'); await routeBlock('video.export','inplace'); return; } /*BRIDGE : branchera recapGo/genFinal sur un run payant validé (L0-2b+)*/
      return;
    }
    // Menu principal
    if(d==='MAIN_MENU'&&editReturn){ const r=editReturn; editReturn=null; await routeBlock(r,'inplace'); return; } /*[L0-2b] sortie de l'éditeur ouvert depuis le workspace -> revient dans le bloc workspace (pas de nouveau bloc)*/
    if(d==='MAIN_MENU'){await routeBlock('home');return;} /*[F12] retour unifié = ACCUEIL du ROUTEUR (cohérent avec /menu), plus de showHome legacy*/
    if(d==='HOME_CREER'){await showCreer();return;} /*[C3] Créer -> choix du mode*/
    if(d==='CREER_EXPRESS'){await showLookSource('express');return;} /*[flux-look] Express : ÉTAPE LOOK puis script éditable*/
    if(d==='CREER_SURMESURE'){await openCard();return;} /*[C3] Sur-mesure : carte complète (look/sujet/durée/modèle) puis GO — full manuel*/
    if(d==='CREER_AUTO'){await showLookSource('auto');return;} /*[flux-look] Auto : ÉTAPE LOOK puis tout auto -> récap coût à valider*/
    // [flux-look] ÉTAPE LOOK — sources : Nouveau look / Galerie / Upload (+ garder le courant). Garde-fou : aucun look ni vidéo sans validation explicite.
    if(d==='CL_STOP'){createFlow=null;createUploadPath=null;galForRecap=false;clearActiveDraft();await showCreer();return;}
    if(d==='CL_KEEP'){if(gwLook()){await resumeCreate();}else{await showLookSource();}return;}
    if(d==='CL_GAL'){galForRecap=true;galMid=cockpit.mid;const cur=gwLook();const li=cur?looksList().indexOf(path.basename(cur)):-1;gal.idx=li>=0?li:0;gal.page=Math.floor((gal.idx||0)/GAL_PAGE);await showGallery();return;}
    if(d==='CL_GAL_RAND'){const list=looksList();if(!list.length){await toast('⚠️ Galerie vide');return;}gal.idx=Math.floor(list.length*((Date.now()%1000)/1000));galMid=cockpit.mid;galForRecap=true;await showLook();return;} /*[flux-look] pioche au hasard dans la galerie -> validation*/
    if(d==='CL_BACK'){await showLookSource();return;}
    if(d==='CL_UP'){state='create_look_upload_wait';await send('📤 Envoie maintenant la <b>photo</b> à utiliser comme look (elle sera ajoutée à ta galerie).');return;}
    if(d==='CL_UP_OK'){ /*[flux-look] photo uploadée validée -> look de la vidéo*/
      if(createUploadPath&&fs.existsSync(createUploadPath)){gw.look=createUploadPath;setWorkPhoto(createUploadPath);setAvatar(createUploadPath);}
      await resumeCreate();return;
    }
    if(d==='CL_NEW'){ /*[F3] « nouveau look surprise » REDIRIGÉ vers le workspace (convergence vers le cockpit unique)*/
      const p=ensureProj(); try{const o=nlMod().pickOutfit(null);p.look.category='random';p.look.extra=o.prompt;}catch(e){} p.look.source='new'; await routeBlock('photo.look','inplace'); return;
    }
    if(d==='CL_OK'){ /*[flux-look] valide le look généré affiché -> look de la vidéo*/
      if(!newlook.urls.length){await toast('⚠️ Génère un look d\'abord');return;}
      try{const dest=nlSave(newlook.idx);if(dest){gw.look=dest;setWorkPhoto(dest);setAvatar(dest);}}catch(e){}
      await resumeCreate();return;
    }
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
    if(d==='TECH_STATUS'){await ack(proc?'⏳ Occupé…':'✅ Prêt');return;} /*[C3] statut = toast métier, pas de message technique*/
    if(d==='TECH_RESTART'){
      if(proc||testProc){await ack('⏳ Une création est en cours — patiente.');return;}
      await ack('⏳ Un instant, je reviens…'); /*[C3] redémarrage silencieux (toast, pas de message technique)*/
      try{await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=0`);}catch(e){}
      try{fs.writeFileSync(REOPEN_FLAG,'1');}catch(e){} try{releaseLock();}catch(e){}process.exit(0);return;
    }
    if(d==='TECH_STOP'){
      let stopped=false;
      if(genJob&&genJob.running){genAbort=true;stopped=true;}
      if(proc){try{proc.kill('SIGKILL');}catch(e){}proc=null;stopped=true;}
      if(testProc){try{testProc.kill('SIGKILL');}catch(e){}testProc=null;stopped=true;} if(!(genJob&&genJob.running))genJob=null;
      try{require('child_process').execSync('pkill -9 -f "node.*workflow.js" 2>/dev/null');stopped=true;}catch(e){}
      state='idle';await ack(stopped?'⏹ Arrêté.':'✅ Rien en cours.');return; /*[C3] toast métier*/
    }
    // [chantier2] FLUX UNIFIÉ : toutes les entrées de génération legacy (wizard anglais T_/L_/D_,
    // GO/SCRIPT_OK/AUTO_ALL/EXPRESS_GO) redirigent vers LA CARTE (openCard) — anti-bypass, zéro anglais.
    if(d==='T_AUTO'||/^T_\d+$/.test(d)||d==='L_KEEP'||d==='L_RANDOM'||d==='L_UPLOAD'||d==='D_25'||d==='D_40'||d==='D_65'||d==='GO'||d==='SCRIPT_OK'||d==='AUTO_ALL'||d==='EXPRESS_GO'){await showCreer();return;} /*[C3] GO ambigu -> Créer*/
        if(d==='SAVE_VID'){/*botfixes v1*/ if(setup.lastVideo&&fs.existsSync(setup.lastVideo)){try{const FormData=require('form-data');const fdv=new FormData();fdv.append('chat_id',CHAT_ID);fdv.append('document',fs.createReadStream(setup.lastVideo));fdv.append('caption','🎬 Fichier video');await tg('sendDocument',null,fdv).catch(()=>{});}catch(e){}}else{await send('Fichier introuvable.').catch(()=>{});}return;}
    if(d==='MANUAL_GO'){await showCreer();return;} /*[C3] legacy -> Créer*/
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
    if(d==='MM_START'){await showCreer();return;} /*[C3] legacy gen -> Créer*/
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
      if(createFlow){await resumeCreate();return;} /*[flux-look] look choisi en galerie -> suite création (script)*/
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
    if(d==='REF_FROM_GEN'){const f=newlook.urls.length?nlLocal(newlook.idx):null;if(!f){await cardMenu('⚠️ Aucune pose générée en cours — fais /newlook d\'abord.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}await refPreview(setImanyRef(f));return;} /*[C5] réf depuis une image générée*/
    if(d==='REF_FROM_GAL'){const list=looksList();const f=list[gal.idx];if(!f){await cardMenu('⚠️ Galerie vide — ouvre 🎬 Studio › 👗 Looks.',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);return;}await refPreview(setImanyRef(path.join(getLooksDir(),f)));return;} /*[C5] réf depuis la galerie*/
    if(d==='REF_UPLOAD'){state='ref_upload_wait';await send('📤 Envoie maintenant la photo à utiliser comme <b>référence Imany</b>.');return;} /*[C5] réf par upload*/
    if(d==='PROMPT_EDIT'){state='prompt_edit_wait';await send('✏️ Envoie le <b>nouveau prompt complet</b> en un message. (Il remplacera l\'actuel ; l\'ancien sera sauvegardé en .bak.)');return;} /*[C6]*/
    if(d==='PROMPT_RESET'){try{const pf=path.join(BASE,'newlook_prompt.txt');const df=path.join(BASE,'newlook_prompt.default.txt');if(fs.existsSync(pf))fs.copyFileSync(pf,pf+'.bak');fs.copyFileSync(df,pf);const cur=fs.readFileSync(pf,'utf8').trim();await send('🔄 <b>Prompt réinitialisé au défaut.</b>\n\n<code>'+escH(cur.substring(0,1500))+'</code>',[[{text:'◀️ Retour',callback_data:'MAIN_MENU'}]]);}catch(e){await send('❌ '+e.message);}return;} /*[C6]*/
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
    if(d==='NL_GO'){ /*[recap-propre] UN SEUL récap texte avant paiement (en place, aucun visuel "référence", aucun texte parasite). La VRAIE image sort à 💲 Générer (NL_GO2).*/
      const lb2=nlMod().readLookbook();
      const ops=(lb2.pricing&&lb2.pricing.ops)||{};
      const epc=(lb2.pricing&&lb2.pricing.eur_per_credit)||0.058;
      const N=newlook.mode==='eco'?(newlook.count||1):1; /*[C] éco : N images séparées*/
      const crUnit=ops[newlook.mode];const cr=crUnit?+(crUnit*N).toFixed(2):null;
      const prix=cr?(String(cr).replace('.',',')+' cr ≈ '+(cr*epc).toFixed(2).replace('.',',')+' €'):'prix à calibrer';
      const nb=newlook.mode==='hd'?'4 (HD)':newlook.mode==='planche'?'1 planche':String(N);
      const cap='🧾 <b>RÉCAP</b>\n'
        +'👗 Tenue · '+escH(newlook.catLabel)+'\n'
        +'🌆 Décor · '+escH(newlook.envLabel)+'\n'
        +'🎛 Format · '+newlook.mode+'\n'
        +'🔢 Nombre · '+nb+'\n'
        +'💲 Coût · '+prix;
      await nlText(cap,[
        [{text:'💲 Générer',callback_data:'NL_GO2'}],
        [{text:'✏️ Modifier',callback_data:'NL_CONFIG'},{text:'⛔ Stop',callback_data:'NL_CANCEL'}]
      ]);
      return;
    }
    if(d==='NL_GO2'){newlook.urls=[];newlook.files=[];newlook.idx=0;runNewLook();return;}
    if(d==='NL_OTHER'){await nlPayRecap(newlook.mode==='split'?'planche':newlook.mode,'🆕 Autre look (tenue re-tirée)','NL_OTHER_OK','NL_BACKRES');return;}
    if(d==='NL_OTHER_OK'){const o=nlMod().pickOutfit(newlook.category!=='random'?newlook.category:null);newlook.extra=o.prompt;newlook.urls=[];newlook.files=[];newlook.idx=0;if(newlook.mode==='split')newlook.mode='planche';runNewLook();return;}
    if(d==='NL_CONFIG'){nlConfig();return;}
    if(d==='NL_NEW'){ /*[F3] « ✨ Nouveau look » REDIRIGÉ vers le workspace (plus de wizard legacy nlConfig) — parcours cœur reste dans le cockpit*/
      const p=ensureProj(); p.look.source='new'; p.look.extra=null; await routeBlock('photo.look','inplace'); return;
    }
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
      clearActiveDraft(); /*[L0-1e] pose gardée = validée -> le brouillon n'est plus « en cours »*/
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
    if(d==='RES_PREV'){results.idx--;await showResults();return;} /*[cockpit-v4.1] zéro message technique : « Chargement… » supprimé*/
    if(d==='RES_NEXT'){results.idx++;await showResults();return;}
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
    if(d==='NL_CANCEL'){createFlow=null;clearActiveDraft(); /*[L0-1e] abandon explicite -> on retire le brouillon*/ await nlText('🎨 <b>TERMINÉ</b> · galerie à jour · /newlook pour relancer');return;}
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

  // [J/B] IMPORT /v4r : capture la photo envoyée par l'utilisateur -> source RÉELLE du projet (zéro dépense), retour au flux.
  if(r0Await && r0Await.upload && msg.photo){
    try{ const persona=_persona(); const cur=r0Cur(persona,true); const id=cur.projectId; const mode=r0Await.upload; r0Await=null;
      const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id); // télécharge l'image de l'utilisateur (gratuit, local)
      const {S}=_r0();
      if(mode==='reference'){ // [#25] nouvelle image de RÉFÉRENCE (base des générations) — pas un candidat, un réglage du brouillon photo
        S.setDraft(BASE,persona,id,'photo',{reference:fp},Date.now()); r0Block={screen:'photo',key:'reference'}; r0Screen='block';
        await r0Render(persona, r0Mid, '🖼 <b>Référence mise à jour</b>'); return;
      }
      // [ANO-IMPORT-AUDIO/uniformisation] l'import PHOTO va dans le DOSSIER PROJET (comme l'import vidéo), pas dans looks/ global.
      //   Reste visible en galerie globale (r0RealImages walk projects_r) ET rattaché proprement au projet.
      try{ const pdir=path.join(BASE,'projects_r',persona,id); fs.mkdirSync(pdir,{recursive:true});
        const dest=path.join(pdir,'import_'+Date.now()+'.jpg'); fs.renameSync(fp,dest); fp=dest; }catch(e){ jlog('[v4r] import photo move err '+e.message); }
      S.addCandidate(BASE,persona,id,Date.now(),'image',{file:fp, simule:false, source:'import', prompt:'(importée)'});
      if(mode==='source'){ S.setDraft(BASE,persona,id,'video',{source:'photo importée',source_file:fp},Date.now()); r0Screen='video_params'; }
      else { r0Screen='photo_result'; }
      r0Block=null; r0Pending=null;
      await r0Render(persona, r0Mid, '📥 <b>Image importée</b>');
    }catch(e){ jlog('v4r import err '+e.message); r0Await=null; try{ await r0Render(_persona(), r0Mid, '⚠️ Import échoué — réessaie.'); }catch(_){} }
    return;
  }
  // [Remplacer source vidéo] IMPORT d'une VIDÉO comme source -> candidat vidéo réel du projet (zéro dépense).
  if(r0Await && r0Await.upload==='sourcevid' && (msg.video || msg.document)){
    try{ const persona=_persona(); const cur=r0Cur(persona,true); const id=cur.projectId; r0Await=null; const {S}=_r0();
      const fileId=(msg.video&&msg.video.file_id)||(msg.document&&msg.document.file_id);
      const r=await tg('getFile',{file_id:fileId}); const url=`https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
      const dir=path.join(BASE,'projects_r',persona,id); try{ fs.mkdirSync(dir,{recursive:true}); }catch(e){}
      const fp=path.join(dir,'import_'+Date.now()+'.mp4'); fs.writeFileSync(fp, await (await fetch(url)).buffer());
      const m=S.addCandidate(BASE,persona,id,Date.now(),'video',{file:fp, simule:false, source:'import vidéo'});
      S.setDraft(BASE,persona,id,'video',{source:'vidéo importée', source_id:(m&&m.mediaId)||null, source_file:fp},Date.now());
      r0Screen='video_params'; r0Block=null; r0Pending=null;
      await r0Render(persona, r0Mid, '🎬 <b>Vidéo importée comme source</b>');
    }catch(e){ jlog('v4r import vid err '+e.message); r0Await=null; try{ await r0Render(_persona(), r0Mid, '⚠️ Import vidéo échoué — réessaie.'); }catch(_){} }
    return;
  }
  // Photo upload
  if(state==='m_upload_wait'&&msg.photo){
    await system('⏳ Enregistrement...');
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
  if(state==='prompt_edit_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[C6] nouveau prompt reçu*/
    try{const pf=path.join(BASE,'newlook_prompt.txt');fs.copyFileSync(pf,pf+'.bak');fs.writeFileSync(pf,msg.text.trim()+'\n');state='idle';await send('✅ <b>Prompt enregistré</b> ('+msg.text.trim().split(/\s+/).length+' mots, ancien en .bak) — actif à la prochaine génération.\n\n<code>'+escH(msg.text.trim().substring(0,1500))+'</code>');}catch(e){state='idle';await send('❌ '+e.message);}
    return;
  }
  if(state==='ref_upload_wait'&&msg.photo){ /*[C5] photo uploadée -> référence Imany*/
    try{const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);state='idle';await refPreview(setImanyRef(fp));}catch(e){state='idle';await send('❌ '+e.message);}
    return;
  }
  if(state==='ws_ref_upload_wait'&&msg.photo){ /*[L0-2a-bis] réf uploadée DANS le workspace -> aperçu immédiat dans le bloc média*/
    try{const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);state='idle';setImanyRef(fp);try{await delMsg(msg.message_id);}catch(e){}await afterCoreChange(ensureProj(),'ref','photo.ref');}catch(e){state='idle';await toast('❌ '+e.message);}
    return;
  }
  if(state==='ws_look_upload_wait'&&msg.photo){ /*[L0-2a-ter] look uploadé DANS le workspace -> aperçu immédiat (slice look)*/
    try{const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);state='idle';const p=ensureProj();p.look.file=fp;p.look.source='upload';try{setWorkPhoto(fp);}catch(e){}try{await delMsg(msg.message_id);}catch(e){}await afterCoreChange(p,'look','photo.look');}catch(e){state='idle';await toast('❌ '+e.message);}
    return;
  }
  if(state==='ws_prompt_edit_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2a-ter] nouveau texte de prompt -> slice prompt*/
    const p=ensureProj();p.prompt={text:msg.text.trim(),name:(p.prompt&&p.prompt.name&&p.prompt.name!=='défaut')?p.prompt.name:'perso'};state='idle';try{await delMsg(msg.message_id);}catch(e){}await routeBlock('photo.prompt','inplace');return;
  }
  if(state==='ws_prompt_save_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2a-ter] nom -> enregistre dans la bibliothèque*/
    const p=ensureProj();const nm=msg.text.trim().slice(0,40);savePromptLib(nm,(p.prompt&&p.prompt.text)||'');p.prompt.name=nm;state='idle';try{await delMsg(msg.message_id);}catch(e){}await toast('💾 Prompt « '+nm+' » enregistré');await routeBlock('photo.prompt','inplace');return;
  }
  if(state==='sp_rename_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2a-ter] STUDIO : renommer un prompt*/
    const nm=msg.text.trim().slice(0,40);if(spRenameSlug){renamePromptLib(spRenameSlug,nm);spRenameSlug=null;}state='idle';try{await delMsg(msg.message_id);}catch(e){}await routeBlock('studio.prompts','inplace');return;
  }
  if(state==='ws_video_upload_wait'&&msg.photo){ /*[L0-2b] image source de la vidéo, uploadée DANS le workspace*/
    try{const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);state='idle';const p=ensureProj();p.video.media=fp;p.video.source='upload';try{await delMsg(msg.message_id);}catch(e){}await routeBlock('video.source','inplace');}catch(e){state='idle';await toast('❌ '+e.message);}
    return;
  }
  if(state==='ws_vscript_edit_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2b] texte du script vidéo -> slice video.script*/
    const p=ensureProj();p.video.script={text:msg.text.trim(),name:(p.video.script&&p.video.script.name&&p.video.script.name!=='—')?p.video.script.name:'perso'};state='idle';try{await delMsg(msg.message_id);}catch(e){}await routeBlock('video.script','inplace');return;
  }
  if(state==='ws_vscript_save_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2b] nom -> enregistre le script dans la bibliothèque*/
    const p=ensureProj();const nm=msg.text.trim().slice(0,40);saveScriptLib(nm,(p.video.script&&p.video.script.text)||'');p.video.script.name=nm;state='idle';try{await delMsg(msg.message_id);}catch(e){}await toast('💾 Script « '+nm+' » enregistré');await routeBlock('video.script','inplace');return;
  }
  if(state==='ws_vleg_edit_wait'&&msg.text&&!msg.text.startsWith('/')){ /*[L0-2b] légende -> slice video.legende*/
    const p=ensureProj();const t=msg.text.trim();p.video.legende=Object.assign({},p.video.legende,{courte:t.slice(0,120),longue:t});state='idle';try{await delMsg(msg.message_id);}catch(e){}await routeBlock('video.legende','inplace');return;
  }
  if(state==='create_look_upload_wait'&&msg.photo){ /*[flux-look] photo uploadée -> look de la vidéo (après aperçu + validation)*/
    try{
      const fp=await dlPhoto(msg.photo[msg.photo.length-1].file_id);
      const dest=path.join(getLooksDir(),'upload_'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.jpg'); /*ajout à la galerie = retrouvable*/
      try{fs.copyFileSync(fp,dest);}catch(e){}
      createUploadPath=fs.existsSync(dest)?dest:fp;state='idle';
      await cockpitPhoto(createUploadPath,'📤 <b>LOOK uploadé</b> — on l\'utilise pour la vidéo ?',[
        [{text:'✅ Valider → vidéo',callback_data:'CL_UP_OK'}],
        [{text:'🔄 Autre photo',callback_data:'CL_UP'},{text:'⛔ Stop',callback_data:'CL_STOP'}],
      ]);
    }catch(e){state='idle';await send('❌ '+e.message);}
    return;
  }
  if(state==='upload_wait'&&msg.photo){
    await system('⏳ Saving photo...');
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
  // [cockpit-v4] SAISIE TEXTE : si le cockpit attend une valeur (renommer projet, créer une zone), capter le texte (jamais un message technique).
  if(v4active && !txt.startsWith('/') && cockpitV4().awaiting()){ try{ await cockpitV4().handleText(txt); }catch(e){ jlog('v4 text err '+e.message); } return; }
  // [RÉALISATION /v4r] SAISIE TEXTE d'un bloc (prompt/script/source/légendes…) : réponse courte captée, réintégrée EN PLACE.
  if(r0Await && r0Await.ask && !txt.startsWith('/')){
    try{ const persona=_persona(); const {S,NAV}=_r0(); const cur=r0Cur(persona,true); const id=cur.projectId; const ask=r0Await.ask; r0Await=null;
      const map=NAV.ASKMAP[ask];
      if(map){ if(map.target==='pub') S.setPublication(BASE,persona,id,{[map.field]:txt},Date.now());
        else if(map.target==='draft') S.setDraft(BASE,persona,id,map.kind,{[map.field]:txt},Date.now()); }
      r0Block=null; r0Screen=r0ParentOfAsk(ask);
      await r0Render(persona, r0Mid, '✅ <b>Intégré au bloc</b>'); /*réintègre dans le bloc courant (édité en place)*/
    }catch(e){ jlog('v4r text err '+e.message); r0Await=null; }
    return;
  }
  // menu principal automatique à la 1ère interaction de la journée
  {const _t=new Date().toISOString().slice(0,10);if(_t!==lastMenuDay){lastMenuDay=_t;if(!txt.startsWith('/'))await openCard().catch(()=>{});}} /*fix : le menu auto ne s'invite plus par-dessus les commandes (/newlook etc.)*/

  if(txt==='/blocs'){ /*3 BLOCS STATIQUES : repose photo + vidéo + résultats en bas du chat (outil de récupération)*/
    await delMsg(newlook.mediaId);newlook.mediaId=null;
    await delMsg(cockpit.mid);cockpitReset();lastCardSig='';
    await delMsg(results.mid);results.mid=null;
    await nlConfig();            // BLOC 1 — PHOTO
    gwReset();await showRecap(); // BLOC 2 — VIDÉO (posée tout de suite, sujet résolu juste après)
    await showResults();         // BLOC 3 — RÉSULTATS
    ensureTopic().then(()=>showRecap()).catch(()=>{}); /*le sujet auto ne doit JAMAIS retarder la pose des 3 blocs*/
    return;
  }
  if(txt==='/v4'){ v4active=true; try{ await cockpitV4().resume(); }catch(e){ jlog('v4 open err '+e.message); await send('⚠️ v4 indispo'); } return; } /*[cockpit-v4] entrée du nouveau cockpit (strangler-fig, test bascule)*/
  if(txt==='/accueil'||txt.startsWith('/v4r')){ try{ await r0TypedV4r(txt==='/accueil'?'/v4r':txt); }catch(e){ jlog('v4r err '+e.message); try{ await send('⚠️ cockpit indisponible.'); }catch(_){} } return; } // [Etoile] /accueil = entrée principale du nouveau cockpit ; /v4r = alias ; /menu legacy inchangé
  if(txt==='/start'||txt==='/menu'){ v4active=false; await routeBlock('home');return;} /*[L0-1d-fix] /menu = NOUVEAU bloc ACCUEIL ; quitte v4 si actif*/
  if(txt==='/studio'){await showStudio();return;} /*[C4] Studio = bibliothèque*/
  if(txt==='/creer'){await showCreer();return;} /*[C4] Créer*/
  if(txt==='/apercu'){await runPreview();return;} /*[C4] aperçu gratuit*/
  if(txt==='/editer'){await showEditHome();return;} /*[C4] éditer*/
  if(txt==='/photos'){await showFileList('img',0);return;} /*[C4] bibliothèque photos*/
  if(txt==='/videos'){await showFileList('vid',0);return;} /*[C4] bibliothèque vidéos*/
  if(txt==='/historique'){await showStudio();return;} /*[C4] historique via Studio*/
  if(txt==='/reference'){await showRefMenu();return;} /*[C5] changer la référence Imany*/
  if(txt==='/help'){await send(HELP_TXT);return;}
  if(txt==='/go'||txt==='go'){await routeBlock('home');return;} /*[L0-1d-fix] /go = NOUVEAU bloc ACCUEIL (navigate)*/
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
    await ack(stopped?'⏹ Arrêté.':'✅ Rien en cours.'); /*[C3] toast métier, plus d'anglais technique*/
    return;
  }
  if(txt==='/status'){await ack(proc?'⏳ Occupé…':'✅ Prêt');return;} /*[C3]*/
  if(txt==='/restart'){ /*restartcmd v1 : redemarrage depuis le chat — pm2 relance automatiquement a l'exit*/
    if(proc||testProc){await ack('⏳ Une création est en cours — patiente.');return;}
    await ack('⏳ Un instant, je reviens…'); /*[C3] redémarrage silencieux*/
    /*restartcmd v2 : ACK de l'update aupres de Telegram AVANT de mourir — sinon /restart est relivre en boucle*/
    try{await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=0`);}catch(e){}
    try{fs.writeFileSync(REOPEN_FLAG,'1');}catch(e){} releaseLock();process.exit(0);
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
      await send('📝 <b>Prompt de base actuel</b> (newlook_prompt.txt) :\n\n<code>'+escH(cur.substring(0,3500))+'</code>',[
        [{text:'✏️ Modifier',callback_data:'PROMPT_EDIT'}],
        [{text:'🔄 Réinitialiser au défaut',callback_data:'PROMPT_RESET'}],
        [{text:'◀️ Retour',callback_data:'MAIN_MENU'}],
      ]); /*[C6] éditeur de prompt : voir + modifier + reset défaut*/
      return;
    }
    try{
      fs.copyFileSync(pf,pf+'.bak');
      fs.writeFileSync(pf,np+'\n');
      await send('✅ Prompt remplacé ('+np.split(/\s+/).length+' mots, ancien dans .bak) — actif dès la prochaine génération.\n\n<code>'+escH(np.substring(0,1500))+'</code>');
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
  if(state==='question'&&proc){wfInput(txt);state='running';return;} /*[C3] plus de « Sent: » technique*/

  await system('Tape /menu pour commencer ! Ou /help pour les commandes.');
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

// ── [MIGRATION] gate CLI : `node telegram_bot.js --migrate` — copie rétroactive (MÊME mécanisme que le futur),
//   ne démarre NI le lock NI le polling, n'écrit QUE dans podcast-looks/projets, NE SUPPRIME RIEN. Sûr à côté du bot live.
if(process.argv.includes('--migrate')){ (function(){
  try{
    const {S,C}=_r0(); const root=path.join(BASE,'projects_r');
    let personas=[]; try{ personas=fs.readdirSync(root).filter(x=>{try{return fs.statSync(path.join(root,x)).isDirectory();}catch(e){return false;}}); }catch(e){}
    let dest; try{ dest=path.join(getLooksDir(),'projets'); }catch(e){ dest=path.join(BASE,'looks','projets'); }
    console.log('=== MIGRATION RÉTROACTIVE ===');
    console.log('base   : '+BASE);
    console.log('cible  : '+dest);
    console.log('personas: '+(personas.join(', ')||'(aucun)'));
    let tot={projets:0,photos:0,videos:0};
    for(const pers of personas){
      const all=S.listProjects(BASE,pers)||[];
      const withMedia=all.filter(p=>(C.visibles(p)||[]).filter(m=>m.file&&!m.simule).length>0);
      const r=r0MigrateAll(pers);
      tot.projets+=r.projets; tot.photos+=r.photos; tot.videos+=r.videos;
      console.log('— '+pers+': '+all.length+' projet(s) au total, '+withMedia.length+' avec média réel → '+r.projets+' archivé(s), '+r.photos+' photo(s), '+r.videos+' vidéo(s)');
    }
    console.log('=== TOTAL : '+tot.projets+' projet(s) archivé(s) · '+tot.photos+' photo(s) · '+tot.videos+' vidéo(s) copiée(s) ===');
    process.exit(0);
  }catch(e){ console.error('MIGRATION ERR: '+(e&&e.stack||e)); process.exit(1); }
})(); }

// ── [VISIBILITÉ] gate CLI : `node telegram_bot.js --count` — compte RÉEL des galeries (preuve sur la vraie base), sans lock ni polling. ──
if(process.argv.includes('--count')){ (function(){
  try{ const persona=(process.argv[process.argv.indexOf('--count')+1]||'imany').replace(/[^a-z0-9_]/gi,'').toLowerCase()||'imany';
    const imgs=r0RealImages(persona,99999); const vids=r0RealVideos(persona,99999);
    console.log('=== COMPTE GALERIE (base réelle) ===');
    console.log('persona :', persona, '| BASE :', BASE);
    console.log('IMAGES agrégées :', imgs.length);
    console.log('VIDÉOS agrégées :', vids.length);
    console.log('— échantillon images (5 plus récentes) :'); imgs.slice(0,5).forEach(p=>console.log('   '+p.split('/').slice(-2).join('/')));
    console.log('— échantillon vidéos (5 plus récentes) :'); vids.slice(0,5).forEach(p=>console.log('   '+p.split('/').slice(-2).join('/')));
    process.exit(0);
  }catch(e){ console.error('COUNT ERR: '+(e&&e.stack||e)); process.exit(1); }
})(); }

// ── Single-instance lock + capture d'erreurs ────────────────────────────────
const LOCK_FILE='/tmp/telegram_bot.lock';
if(!R0DRY) try{
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
// [RAPPORTS D'INCIDENT — Etoile] filet GLOBAL : toute exception non gérée -> message exploitable à Etoile (jamais de blocage silencieux).
//   On NE quitte PAS le process (le bot reste vivant) ; on donne une porte de sortie (/accueil).
let _lastIncident=0;
function _incident(tag,e){ try{ console.error(tag+':', e&&e.stack?e.stack:e);
  const now=Date.now(); if(now-_lastIncident<8000) return; _lastIncident=now; // anti-spam
  if(typeof R0DRY!=='undefined'&&R0DRY) return;
  const msg='⚠️ <b>Incident technique</b> — <i>'+_r0esc((e&&e.message)||tag)+'</i>\nLe bot reste actif. Tape <b>/accueil</b> pour reprendre (rien n\'est perdu).';
  try{ fetch('https://api.telegram.org/bot'+TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CHAT_ID,text:msg,parse_mode:'HTML'})}).catch(()=>{}); }catch(_){}
}catch(_){} }
process.on('uncaughtException', (e)=>{ _incident('uncaughtException',e); });
process.on('unhandledRejection', (e)=>{ _incident('unhandledRejection',e); });

setInterval(()=>{},1<<30);
tg('setMyCommands',{commands:[ /*[stabilisation] MÉNAGE du menu déroulant : ne garder que les points d'entrée MÉTIER.*/
  {command:'accueil',description:'🎬 Cockpit — Accueil du projet'},  // [Etoile] entrée principale du nouveau cockpit
  {command:'v4r',description:'🎬 Cockpit (alias)'},
  {command:'menu',description:'🏠 Menu (legacy)'},
  {command:'creer',description:'🚀 Créer une vidéo'},
  {command:'newlook',description:'🎨 Nouveau look'},
  {command:'restart',description:'🔄 Redémarrer'},
  {command:'help',description:'❓ Aide'},
]}).catch(()=>{});
// [DRY-RUN] banc d'essai : on N'AMORCE PAS le bot ; on exporte une API pour rejouer le VRAI chemin (callbacks/typed).
if(R0DRY){
  module.exports = {
    R0DRY,
    reset:()=>{ r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0Await=null; r0Mid=null; r0Type=null; r0MediaPath=null; r0RenderMids=[]; r0GalKind='image'; r0GalAll=false; r0GalRole='select'; r0QuitFrom=null; r0SrcReturn=null; r0ResFrom=null; R0DRY.msgs={}; R0DRY.alive.clear(); R0DRY.answered=0; R0DRY.log=[];
      try{ fs.rmSync(path.join(BASE,'projects_r'),{recursive:true,force:true}); }catch(e){} // [DATA-INTÉGRITÉ] sandbox repart VIERGE à chaque test (jamais de cumul, jamais la vraie base)
      try{ fs.unlinkSync(path.join(BASE,'v4r_budget.json')); }catch(e){} try{ fs.unlinkSync(path.join(BASE,'v4r_nav.json')); }catch(e){} },
    open:async()=>{ await r0TypedV4r('/v4r'); },                  // simule un /v4r
    typed:async(t)=>{ await r0TypedV4r(t); },
    // [PERSISTANCE] rejoue le VRAI chemin /restart (mêmes actions r0 que le handler REOPEN_FLAG) — ne touche PAS aux rendus persistants.
    restart:async()=>{ const persona=_persona(); r0Mid=null; r0Type=null; r0MediaPath=null; r0Await=null; r0PickCurrent(persona);
      if(!r0RestoreNav(persona)){ r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0QuitFrom=null; r0SrcReturn=null; }
      await r0Render(persona, null, '↩️ <i>Contexte restauré</i>'); },
    // [PERSISTANCE] /menu : bascule legacy — n'efface NI les projets NI les messages de rendus (no-op côté r0).
    menu:async()=>{ /* aucun effet sur projects_r ni sur r0RenderMids (les rendus restent dans le fil) */ },
    // simule un TAP de bouton sur le bloc courant (= branche R0_ du vrai handler : sync mid/type + dispatch + answerCB TOUJOURS)
    tap:async(d)=>{ const mid=r0Mid||[...R0DRY.alive].slice(-1)[0]||null; const cur=mid&&R0DRY.msgs[mid];
      r0Mid=mid; r0Type=(cur&&cur.kind==='media')?'photo':'text';
      try{ await r0Dispatch(_persona(), d, mid); }catch(e){ R0DRY.log.push('THROW:'+e.message); try{ await r0Render(_persona(), mid, '⚠️ Action non aboutie — réessaie.'); }catch(_){} }
      try{ await tg('answerCallbackQuery',{}); }catch(_){}                  // le vrai handler répond TOUJOURS
    },
    state:()=>{ const {C}=_r0(); const f=r0Cur(_persona(),false)||{};
      const renders=r0RenderMids.filter(m=>R0DRY.alive.has(m)).length;       // rendus persistants encore dans le fil
      const cockpit=(r0Mid&&R0DRY.alive.has(r0Mid))?1:0;                      // bloc cockpit vivant (doit valoir 1)
      return { screen:r0Screen, section:r0Section, block:r0Block&&r0Block.key, mid:r0Mid, type:r0Type, pending:r0Pending&&r0Pending.kind, alive:R0DRY.alive.size, cockpit:cockpit, renders:renders, answered:R0DRY.answered, curImg:(C.visibles(f).filter(m=>m.type!=='video')).length, curVid:(C.visibles(f).filter(m=>m.type==='video')).length }; },
    // [CARTOGRAPHIE] boutons RÉELLEMENT rendus sur l'écran courant (cb à plat) — pour prouver Retour/Suivant + zéro tap mort.
    buttons:()=>{ try{ const {NAV}=_r0(); const f=r0Cur(_persona(),true); const ctx=r0Ctx(_persona());
      const vw=NAV.view({ screen:r0Screen, section:r0Section, block:r0Block }, f, ctx);
      return [].concat.apply([], (vw.rows||[])).map(b=>b&&b.cb).filter(Boolean); }catch(e){ return []; } },
    labels:()=>{ try{ const {NAV}=_r0(); const f=r0Cur(_persona(),true); const ctx=r0Ctx(_persona());
      const vw=NAV.view({ screen:r0Screen, section:r0Section, block:r0Block }, f, ctx);
      return [].concat.apply([], (vw.rows||[])).map(b=>b&&b.text).filter(Boolean); }catch(e){ return []; } }, // textes des boutons (preuve « Retour partout »)
    logs:()=>R0DRY.log.slice(),   // journal interne (THROW:* si une exception a été avalée) — la cartographie échoue si non vide
    // [PREUVE MARKUP RÉEL] rend l'écran courant via le MÊME NAV.view que le peintre live (r0 state réel + r0Ctx) : titre + lignes {text,cb}. Pas un grep — la sortie telle qu'elle s'affiche.
    markup:()=>{ try{ const {NAV}=_r0(); const f=r0Cur(_persona(),true); const ctx=r0Ctx(_persona());
      const vw=NAV.view({ screen:r0Screen, section:r0Section, block:r0Block }, f, ctx);
      const cap=String(vw.caption||'').replace(/<[^>]+>/g,'').replace(/\n/g,' ⏎ ').trim();
      const rows=(vw.rows||[]).map(r=>r.map(b=>({t:b&&b.text,cb:b&&b.cb})));
      return { screen:r0Screen, kind:vw.kind, caption:cap, rows:rows }; }catch(e){ return { error:e.message }; } },
    draft:(kind)=>{ try{ const {S}=_r0(); return S.getDraft(r0Cur(_persona(),false), kind)||{}; }catch(e){ return {}; } }, // brouillon courant (preuve #17/#18)
    cover:()=>{ try{ return r0CoverFile(r0Cur(_persona(),false)||{}); }catch(e){ return null; } }, // image AFFICHÉE (couverture réelle) — preuve conservation source
    media:()=>r0MediaPath, // fichier média actuellement peint dans le bloc (preuve « image cohérente »)
    defaults:()=>{ try{ return _r0().DEF.load(BASE,_persona()); }catch(e){ return {}; } },                                   // modèles par défaut du persona (#18)
    projects:()=>{ try{ return _r0().S.listProjects(BASE,_persona()).length; }catch(e){ return 0; } },                         // [G4] nb de projets (preuve « Modèle = projet réutilisable »)
    resReturn:()=>{ try{ const {NAV}=_r0(); const f=r0Cur(_persona(),true); const ctx=r0Ctx(_persona()); const vw=NAV.view({ screen:r0Screen, section:r0Section, block:r0Block }, f, ctx); const all=[].concat.apply([], (vw.rows||[])); const b=all.find(x=>/Retour/.test(x&&x.text||'')); return b&&b.cb||null; }catch(e){ return null; } }, // [G2] cb du ◀ Retour courant (preuve retour contextuel)
    setPub:(patch)=>{ try{ const f=r0Cur(_persona(),true); _r0().S.setPublication(BASE,_persona(),f.projectId,patch,Date.now()); }catch(e){} }, // [G5] seed légendes/hashtags
    fullText:(field)=>{ try{ const f=r0Cur(_persona(),true); const pub=(f&&f.publication)||{}; if(field==='legc') return r0FuseTags(pub.legende_courte,pub.hashtags); if(field==='legl') return r0FuseTags(pub.legende_longue,pub.hashtags); if(field==='tags') return String(pub.hashtags||''); return ''; }catch(e){ return ''; } }, // [G5] texte EXACT copié par R0_FULLTEXT_<field>
    versions:(key)=>{ try{ const f=r0Cur(_persona(),false)||{}; const v=f.versions||{}; return key?((v[key]||[]).slice()):v; }catch(e){ return key?[]:{}; } }, // [ANO-ARCH-VERSIONING] historique par champ
    subOpts:(dv)=>{ try{ return r0SubOpts(dv||{}); }catch(e){ return {}; } }, // [#1/#2 sous-titres] opts ASS effectives (police/taille/oy/alignement/couleur)
    subChunks:(dv)=>{ try{ return r0SubChunks(dv||{},8); }catch(e){ return {chunks:[],exemple:true}; } }, // [🔴2] découpage aperçu (== buildChunks du final sur le vrai script)
  };
} else
/*restartcmd v2 : purge du backlog au demarrage — on ignore tout message recu pendant qu'on etait mort (anti-boucle, anti-rafale)*/
(async()=>{try{const r=await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1&timeout=0`);const d=await r.json();if(d&&d.ok&&d.result&&d.result.length)offset=d.result[d.result.length-1].update_id+1;}catch(e){}})().then(()=>{ /*[C3] boot SILENCIEUX — aucun message technique dans le chat utilisateur*/
  loadState();resLoad();genFoldersLoad();setInterval(()=>{try{resSave();}catch(e){}},20000); /*mids des 3 blocs sauvegardés en continu*/
  console.log('Bot running...');poll();
  /*[A — Etoile] PERSISTANCE DE CONTEXTE : au boot (TOUT redémarrage : deploy/crash/restart), on RECHARGE en mémoire le dernier
    écran/projet/pending depuis le disque -> aucune perte de contexte. La reprise exacte se fait via /accueil ou ▶️ Reprendre.*/
  let _resumeScreen='home'; try{ const p=_persona(); r0PickCurrent(p); if(r0RestoreNav(p)) _resumeScreen=r0Screen; }catch(e){}
  /*[Etoile] REDÉMARRAGE : message « connecté » + ▶️ Reprendre (restaure l'écran EXACT) si un contexte non-accueil est conservé.*/
  if(!fs.existsSync(REOPEN_FLAG)){ const hasCtx=_resumeScreen&&_resumeScreen!=='home';
    setTimeout(()=>{ const body={chat_id:CHAT_ID, text:'✅ <b>Connecté</b> — '+(hasCtx?'ton écran et ton projet sont CONSERVÉS.':'tape /accueil pour reprendre.'), parse_mode:'HTML'};
      if(hasCtx) body.reply_markup=JSON.stringify({inline_keyboard:[[{text:'▶️ Reprendre où j\'en étais',callback_data:'R0_RESUME'}],[{text:'🏠 Accueil',callback_data:'R0_RESUME_HOME'}]]});
      try{ fetch('https://api.telegram.org/bot'+TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>{}); }catch(_){}
    },800); }
  /*[VERROU GÉNÉRATION] flag orphelin au boot = une génération a été TUÉE par un redémarrage -> MESSAGE D'INCIDENT COMPLET (jamais de retour silencieux).*/
  try{ if(fs.existsSync(R0_GENLOCK)){ let info={}; try{ info=JSON.parse(fs.readFileSync(R0_GENLOCK,'utf8')); }catch(e){}
    const kind=info.kind==='video'?'vidéo':'photo'; const when=info.at?new Date(info.at).toISOString().slice(11,16):'?';
    try{ fs.unlinkSync(R0_GENLOCK); }catch(e){}
    setTimeout(()=>{ send('⚠️ <b>Génération '+kind+' interrompue</b> par un redémarrage (démarrée ~'+when+' UTC).\nAucune création déposée pour cette tentative. Une petite dépense moteur a pu être engagée. Rien d\'autre n\'est perdu — reprends via <b>/accueil</b>.').catch(()=>{}); },1400);
    try{ jlog('[VERROU] flag génération orphelin au boot ('+kind+', '+when+') -> incident signalé + flag nettoyé'); }catch(e){}
  } }catch(e){}
  /*[fix/restart-feedback] après un /restart demandé par l'utilisateur, RÉAFFICHER le cockpit (accueil) — sans message technique.
    Seul un /restart pose le drapeau ; un reboot involontaire (crash/deploy) reste silencieux.*/
  setTimeout(async ()=>{ try{ if(fs.existsSync(REOPEN_FLAG)){ try{fs.unlinkSync(REOPEN_FLAG);}catch(e){}
    /*[A] /restart -> RESTAURE le contexte du projet en cours (dernier écran), pas un retour à blanc. Message système persistant.*/
    try{ const persona=_persona(); r0Mid=null; r0Type=null; r0MediaPath=null; r0Await=null; r0PickCurrent(persona); /*[B] reprend le projet AVEC médias*/
      if(!r0RestoreNav(persona)){ r0Screen='home'; r0Section=null; r0Block=null; r0Ret=null; r0Pending=null; r0QuitFrom=null; r0SrcReturn=null; }
      await r0Render(persona, null, r0Screen==='home'?null:'↩️ <i>Contexte restauré</i>'); }catch(e){ jlog('restart v4r err '+e.message); }
    await send('🔄 <b>Redémarré</b> — contexte restauré. /menu pour le menu, /v4r pour reprendre.').catch(()=>{});
  } }catch(e){} },1500);
}).catch(e=>{console.error(e.message);process.exit(1);});

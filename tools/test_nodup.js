// PREUVE anti-doublon (chantier1) — charge les VRAIES fonctions de telegram_bot.js
// (helpers signature + editPhotoKb + cockpitCaption + cockpitPhoto) avec un Telegram
// 100% mocké. Vérifie : identique -> 0 édition / 0 envoi ; changé -> 1 édition en
// place / 0 envoi ; "not modified" -> succès sans envoi ; "not found" -> recréation.
//
// LANCER :  node -e 'require("./tools/test_nodup.js")'
// (run via require : invocation canonique. `node tools/test_nodup.js` en direct peut
//  diverger sous Node 26 — quirk du module principal, sans rapport avec le code prod.)
const fs=require('fs');
const SRC=fs.readFileSync(require('path').join(__dirname,'..','telegram_bot.js'),'utf8');
function extractFn(n){const a=SRC.indexOf('async function '+n+'(');const b=SRC.indexOf('function '+n+'(');const i=a>=0?a:b;let j=SRC.indexOf('{',i),d=0;for(let k=j;k<SRC.length;k++){if(SRC[k]==='{')d++;else if(SRC[k]==='}'){d--;if(d===0)return SRC.slice(i,k+1);}}}
const cfi=extractFn('cachedFileId');
const hb=SRC.slice(SRC.indexOf('const _msgSig=Object.create(null);'),SRC.indexOf(cfi)+cfi.length);

const C={editMedia:0,editCap:0,sendPhoto:0};
let RESP={ok:true,result:{photo:[{file_id:'F'}]}};
const mockFetch=async(u)=>{ if(/editMessageMedia/.test(u))C.editMedia++; return {json:async()=>RESP}; }; // mock passé en param (ne touche pas global.fetch)
const tg=async(m)=>{ if(m==='editMessageMedia')C.editMedia++; if(m==='editMessageCaption')C.editCap++; return RESP; };
class FormData{append(){}}
const fsM={statSync:()=>({mtimeMs:111}),readFileSync:()=>Buffer.from('x')};
const cockpit={mid:null};
const sendPhotoKb=async()=>{ C.sendPhoto++; return {result:{message_id:999}}; };
const staleBloc={cockpit:false,photo:false,results:false}; // [stale-fix] ids non perimes ici -> freshBloc no-op
const freshBloc=async()=>{};
const F=new Function('tg','fetch','FormData','fs','shrinkIfBig','jlog','uiLog','screenOf','btnLabels','cap1024','TOKEN','CHAT_ID','cockpit','sendPhotoKb','staleBloc','freshBloc',
  hb+'\n'+extractFn('editPhotoKb')+'\n'+extractFn('cockpitCaption')+'\n'+extractFn('cockpitPhoto')+'\nreturn {editPhotoKb,cockpitCaption,cockpitPhoto,_sig,sigSame,peek:m=>_msgSig[m]};')
  (tg,mockFetch,FormData,fsM,x=>x,()=>{},()=>{},()=>'',()=>[],s=>String(s||''),'T','C',cockpit,sendPhotoKb,staleBloc,freshBloc);

let pass=0,fail=0;
function check(label,cond,got){ (cond?pass++:fail++); console.log((cond?'✅':'❌')+' '+label+(cond?'':'  (obtenu: '+JSON.stringify(got)+')')); }
const reset=()=>{C.editMedia=0;C.editCap=0;C.sendPhoto=0;};
const rows=[[{text:'A',callback_data:'X'}]];

(async()=>{
  // 1) NEUF (mid 100, image a) -> 1 édition média, 0 envoi
  reset(); RESP={ok:true,result:{photo:[{file_id:'F1'}]}};
  const r1=await F.editPhotoKb(100,'/img/a.jpg','CAP-1',rows);
  check('1. neuf -> editPhotoKb=true', r1===true, r1);
  check('1. neuf -> 1 édition média', C.editMedia===1, C.editMedia);
  check('1. neuf -> 0 envoi', C.sendPhoto===0, C.sendPhoto);

  // 2) IDENTIQUE -> skip total (signature)
  reset();
  const r2=await F.editPhotoKb(100,'/img/a.jpg','CAP-1',rows);
  check('2. identique -> true', r2===true, r2);
  check('2. identique -> 0 édition (skip signature)', C.editMedia===0, C.editMedia);
  check('2. identique -> 0 envoi (ZÉRO DOUBLON)', C.sendPhoto===0, C.sendPhoto);

  // 3) CHANGÉ (même msg) -> 1 édition en place, 0 envoi
  reset(); RESP={ok:true,result:{photo:[{file_id:'F2'}]}};
  const r3=await F.editPhotoKb(100,'/img/a.jpg','CAP-2-CHANGÉ',rows);
  check('3. changé -> true', r3===true, r3);
  check('3. changé -> 1 édition en place', (C.editMedia+C.editCap)===1, {m:C.editMedia,c:C.editCap});
  check('3. changé -> 0 envoi', C.sendPhoto===0, C.sendPhoto);

  // 4) NOT MODIFIED (mid 110 neuf) -> succès, 0 envoi
  reset(); RESP={ok:false,description:'Bad Request: message is not modified'};
  const r4=await F.editPhotoKb(110,'/img/b.jpg','CAP-NM',rows);
  check('4. not modified -> true', r4===true, r4);
  check('4. not modified -> 0 envoi', C.sendPhoto===0, C.sendPhoto);

  // 5) NOT FOUND (mid 120 neuf) -> false (le caller recrée)
  reset(); RESP={ok:false,description:'Bad Request: message to edit not found'};
  const r5=await F.editPhotoKb(120,'/img/c.jpg','CAP-GONE',rows);
  check('5. not found -> editPhotoKb=false', r5===false, r5);

  // 6) TRANSITOIRE (mid 130 neuf) -> true, pas de recréation
  reset(); RESP={ok:false,description:'Bad Request: some transient error'};
  const r6=await F.editPhotoKb(130,'/img/d.jpg','CAP-TR',rows);
  check('6. transitoire -> true (pas de recréation)', r6===true, r6);

  // 7) cockpitPhoto : identique -> 0 envoi ; gone -> 1 envoi
  cockpit.mid=200; reset(); RESP={ok:true,result:{photo:[{file_id:'G1'}]}};
  await F.cockpitPhoto('/img/e.jpg','COCK',rows); // édite
  await F.cockpitPhoto('/img/e.jpg','COCK',rows); // identique -> skip
  check('7. cockpitPhoto identique -> 0 envoi', C.sendPhoto===0, C.sendPhoto);
  reset(); RESP={ok:false,description:'Bad Request: message to edit not found'};
  await F.cockpitPhoto('/img/f.jpg','COCK2',rows); // gone -> recrée
  check('7. cockpitPhoto gone -> 1 envoi (recréation unique)', C.sendPhoto===1, C.sendPhoto);

  // 8) cockpitCaption identique -> 1 seule édition puis skip
  cockpit.mid=300; reset(); RESP={ok:true};
  await F.cockpitCaption('TXT',rows); await F.cockpitCaption('TXT',rows);
  check('8. cockpitCaption identique -> 1 édition (2e skip)', C.editCap===1, C.editCap);

  console.log('\nRÉSULTAT: '+pass+' OK, '+fail+' KO');
  process.exit(fail?1:0);
})();

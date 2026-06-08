// PREUVE stale-fix (URGENCE menu muet après restart) — charge les VRAIES fonctions
// freshBloc + cockpitPhoto + editPhotoKb de telegram_bot.js, Telegram 100% mocké.
// Bug réparé : au restart, resLoad() restaure un cockpit.mid PÉRIMÉ (session précédente) ;
// l'éditer en place vise un message enterré -> Etoile ne voit RIEN. Le fix : 1er affichage
// = on supprime l'ancien et on recrée un message FRAIS visible ; ensuite édition en place.
// LANCER : node -e 'require("./tools/test_stalefix.js")'
const fs=require('fs');
const SRC=fs.readFileSync(require('path').join(__dirname,'..','telegram_bot.js'),'utf8');
function extractFn(n){const a=SRC.indexOf('async function '+n+'(');const b=SRC.indexOf('function '+n+'(');const i=a>=0?a:b;let j=SRC.indexOf('{',i),d=0;for(let k=j;k<SRC.length;k++){if(SRC[k]==='{')d++;else if(SRC[k]==='}'){d--;if(d===0)return SRC.slice(i,k+1);}}}
const cfi=extractFn('cachedFileId');
const hb=SRC.slice(SRC.indexOf('const _msgSig=Object.create(null);'),SRC.indexOf(cfi)+cfi.length);

const C={editMedia:0,editCap:0,sendPhoto:0,del:0};
let RESP={ok:true,result:{photo:[{file_id:'F'}]}};
const mockFetch=async(u)=>{ if(/editMessageMedia/.test(u))C.editMedia++; return {json:async()=>RESP}; };
const tg=async(m)=>{ if(m==='editMessageMedia')C.editMedia++; if(m==='editMessageCaption')C.editCap++; if(m==='deleteMessage')C.del++; return RESP; };
class FormData{append(){}}
const fsM={statSync:()=>({mtimeMs:111}),readFileSync:()=>Buffer.from('x')};
const cockpit={mid:null};
const staleBloc={cockpit:false,photo:false,results:false};
const sendPhotoKb=async()=>{ C.sendPhoto++; return {result:{message_id:999}}; };
// VRAIS delMsg + freshBloc extraits du code prod
const F=new Function('tg','fetch','FormData','fs','shrinkIfBig','jlog','uiLog','screenOf','btnLabels','cap1024','TOKEN','CHAT_ID','cockpit','sendPhotoKb','staleBloc',
  hb+'\n'+extractFn('delMsg')+'\n'+extractFn('freshBloc')+'\n'+extractFn('editPhotoKb')+'\n'+extractFn('cockpitPhoto')
  +'\nreturn {cockpitPhoto,freshBloc,delMsg};')
  (tg,mockFetch,FormData,fsM,x=>x,()=>{},()=>{},()=>'',()=>[],s=>String(s||''),'T','C',cockpit,sendPhotoKb,staleBloc);

let pass=0,fail=0;
const check=(l,c,g)=>{(c?pass++:fail++);console.log((c?'✅':'❌')+' '+l+(c?'':'  (obtenu: '+JSON.stringify(g)+')'));};
const reset=()=>{C.editMedia=0;C.editCap=0;C.sendPhoto=0;C.del=0;};
const rows=[[{text:'A',callback_data:'X'}]];

(async()=>{
  // SCÉNARIO RESTART : cockpit.mid restauré PÉRIMÉ (id 777), staleBloc.cockpit=true
  cockpit.mid=777; staleBloc.cockpit=true; reset(); RESP={ok:true,result:{photo:[{file_id:'G1'}]}};
  await F.cockpitPhoto('/img/home.jpg','🏠 MENU',rows); // /menu après restart
  check('restart -> ancien message périmé SUPPRIMÉ', C.del===1, C.del);
  check('restart -> message FRAIS envoyé (Etoile le voit)', C.sendPhoto===1, C.sendPhoto);
  check('restart -> PAS d\'édition en place du message enterré', C.editMedia===0, {m:C.editMedia,c:C.editCap});
  check('restart -> flag stale consommé', staleBloc.cockpit===false, staleBloc.cockpit);
  check('restart -> cockpit.mid pointe le nouveau message', cockpit.mid===999, cockpit.mid);

  // 2e affichage (plus périmé) -> édition EN PLACE, aucun nouvel envoi (anti-doublon préservé)
  reset(); RESP={ok:true,result:{photo:[{file_id:'G2'}]}};
  await F.cockpitPhoto('/img/studio.jpg','🎬 STUDIO',rows);
  check('2e écran -> édition en place (0 suppression)', C.del===0, C.del);
  check('2e écran -> 0 nouvel envoi (anti-empilement)', C.sendPhoto===0, C.sendPhoto);
  check('2e écran -> 1 édition média en place', C.editMedia===1, C.editMedia);

  console.log('\nRÉSULTAT: '+pass+' OK, '+fail+' KO');
  process.exit(fail?1:0);
})();

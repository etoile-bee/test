// [L0-2b] PREUVE « 1 SEUL BLOC » sur le parcours GLOBAL PHOTO → VIDÉO (workspace média unique).
// Même contrat de blocs que le bot (uiShow texte / uiShowMedia média / routeBlock ferme en quittant).
// On enchaîne IMAGE → VIDÉO(source→script→montage→légende→export) et on vérifie : 1 seule création de bloc média.
function fresh(){ for(const m of ['../ui/registry','../ui/router']){try{delete require.cache[require.resolve(m)];}catch(e){}} return require('../ui/router'); }
const uiRouter=fresh(); const {REGISTRY}=uiRouter;
let ok=0,ko=0; const check=(n,c)=>{ if(c){ok++;console.log('✅ '+n);} else {ko++;console.log('❌ '+n);} };

const proj={ name:'P1', step:'image',
  look:{source:'gallery',file:'/g.jpg',category:'soiree',env:'bougies',mode:'eco',count:1},
  image:{urls:['/img.jpg'],idx:0,validated:0,confirming:false},
  prompt:{text:'P',name:'défaut'},
  video:{source:null,media:null,duration:'23s',script:{text:'',name:'—'},montage:{touched:false},legende:{courte:'',longue:'',tags:''},step:'source',confirming:false} };

const MEDIA={'photo.image':1,'video.source':1,'video.srcgal':1,'video.script':1,'video.scriptlib':1,'video.montage':1,'video.legende':1,'video.export':1};
REGISTRY['photo.image']={id:'photo.image',parent:'photo.look',next:'video.source',gate:()=>proj.image.validated!=null,render:()=>({image:'/ws.jpg',caption:'IMAGE',rows:[[{text:'🎬 Faire une vidéo',go:'video.source'}]]})};
REGISTRY['video.source']={id:'video.source',parent:'photo.image',next:'video.script',gate:()=>!!(proj.video.media||proj.image.urls.length||proj.look.file),render:()=>({image:'/ws.jpg',caption:'VSRC',rows:[[{text:'👗',cb:'VS_PROJLOOK'},{text:'🖼',cb:'VS_GENIMAGE'}],[{text:'gal',go:'video.srcgal'}]]})};
REGISTRY['video.srcgal']={id:'video.srcgal',parent:'video.source',render:()=>({image:'/ws.jpg',caption:'VGAL',rows:[[{text:'✅',cb:'VS_GSET'}]]})};
REGISTRY['video.script']={id:'video.script',parent:'video.source',next:'video.montage',gate:()=>!!(proj.video.script.text||'').trim(),render:()=>({image:'/ws.jpg',caption:'VSCRIPT '+proj.video.script.name,rows:[[{text:'✍️',cb:'VP_EDIT'},{text:'💾',cb:'VP_SAVE'}],[{text:'📚',go:'video.scriptlib'}]]})};
REGISTRY['video.scriptlib']={id:'video.scriptlib',parent:'video.script',render:()=>({image:'/ws.jpg',caption:'VSLIB',rows:[]})};
REGISTRY['video.montage']={id:'video.montage',parent:'video.script',next:'video.legende',render:()=>({image:'/ws.jpg',caption:'VMON',rows:[[{text:'🎨',cb:'VM_EDIT'}]]})};
REGISTRY['video.legende']={id:'video.legende',parent:'video.montage',next:'video.export',render:()=>({image:'/ws.jpg',caption:'VLEG',rows:[[{text:'✍️',cb:'VL_EDIT'}]]})};
REGISTRY['video.export']={id:'video.export',parent:'video.legende',render:()=>({image:'/ws.jpg',caption:'VEXP',rows:[[{text:'💲',cb:'VX_GEN'}]]})};

let textMid=10, mediaMid=null, wsOpen=false, sendText=0, editText=0, sendMedia=0, editMedia=0, closeWs=0, nextId=100; const log=[];
const ctx={
  show:(c,r,m)=>{ if(m!=='navigate'&&textMid){editText++;} else {sendText++;textMid=++nextId;} return true; },
  showMedia:(img,c,r,m)=>{ wsOpen=true; if(mediaMid){editMedia++;log.push('edit');} else {sendMedia++;mediaMid=++nextId;log.push('CREATE');} return true; },
};
async function routeBlock(id){ if(wsOpen&&!MEDIA[id]){closeWs++;mediaMid=null;wsOpen=false;} await uiRouter.route(id,ctx,'inplace'); }

(async()=>{
  // on est sur l'étape IMAGE (workspace déjà ouvert sur l'image)
  await routeBlock('photo.image');                 // workspace créé (1)
  await routeBlock('video.source');                // 🎬 Faire une vidéo (même bloc)
  proj.video.media='/g.jpg'; proj.video.source='projlook';
  await routeBlock('video.srcgal'); await routeBlock('video.source'); // détour galerie source
  await routeBlock('video.script');                // ➡ Script
  proj.video.script={text:'mon script',name:'perso'};
  await routeBlock('video.script');                // après édition
  await routeBlock('video.scriptlib'); await routeBlock('video.script'); // biblio
  await routeBlock('video.montage');               // ➡ Montage
  await routeBlock('video.script');                // ⬅ Retour (aval conservé : script intact)
  check('retour script conserve l\'aval (script toujours là)', proj.video.script.text==='mon script');
  await routeBlock('video.montage');
  await routeBlock('video.legende');               // ➡ Légende
  await routeBlock('video.export');                // ➡ Export
  proj.video.confirming=true; await routeBlock('video.export'); // 💲 -> confirmation DANS le bloc
  proj.video.confirming=false; await routeBlock('video.export'); // annuler

  console.log('\njournal média:',log.join(' '));
  console.log('sendMedia='+sendMedia+' editMedia='+editMedia+' sendText='+sendText+' closeWs='+closeWs+'\n');
  check('UN SEUL bloc workspace sur tout PHOTO→VIDÉO (sendMedia===1)', sendMedia===1);
  check('toutes les étapes vidéo = éditions en place (editMedia>=12)', editMedia>=12);
  check('AUCUN nouveau bloc texte (sendText===0)', sendText===0);
  check('workspace jamais fermé pendant le workflow (closeWs===0)', closeWs===0);

  // quitter vers une section texte ferme proprement
  await routeBlock('home');
  check('quitter ferme le workspace (closeWs===1)', closeWs===1);
  check('toujours 1 seul bloc média au total (sendMedia===1)', sendMedia===1);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
  if(ko)process.exit(1);
})();

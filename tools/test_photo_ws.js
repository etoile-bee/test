// [L0-2a-ter] PREUVE « 1 SEUL BLOC WORKSPACE » — simulation fidèle du contrat de blocs du bot.
// On reproduit uiShow (bloc TEXTE), uiShowMedia (bloc MÉDIA unique) et routeBlock (ferme le workspace
// en quittant) AU-DESSUS du routeur réel (ui/router.js) avec les modules photo.* enregistrés (stubs de rendu
// renvoyant { image } comme le bot). On rejoue un PARCOURS PHOTO complet et on compte les NOUVEAUX messages :
// le workspace média doit être créé UNE seule fois (0 empilement), les étapes suivantes = éditions en place.
function fresh(){ for(const m of ['../ui/registry','../ui/router']){try{delete require.cache[require.resolve(m)];}catch(e){}} return require('../ui/router'); }
const uiRouter=fresh(); const {REGISTRY}=uiRouter;
let ok=0,ko=0; const check=(n,c)=>{ if(c){ok++;console.log('✅ '+n);} else {ko++;console.log('❌ '+n);} };

// ── état projet simulé (slices) ──
const proj={ name:null, step:'look',
  look:{source:null,file:null,category:'casual',env:'bougies',mode:'eco',count:1,extra:null},
  image:{urls:[],idx:0,validated:null,confirming:false},
  prompt:{text:'PROMPT PAR DÉFAUT',name:'défaut'} };

// ── modules MÉDIA (renvoient { image }) ──
const MEDIA={'photo.look':1,'photo.lookgal':1,'photo.image':1,'photo.ref':1,'photo.refgal':1,'photo.prompt':1,'photo.promptlib':1};
REGISTRY['photo.look']  ={id:'photo.look',parent:'photo',next:'photo.image',gate:()=>!!proj.look.source,render:()=>({image:'/tmp/ws.jpg',caption:'LOOK '+proj.look.category,rows:[[{text:'🎯',go:'photo.ref'},{text:'✍️',go:'photo.prompt'}]]})};
REGISTRY['photo.lookgal']={id:'photo.lookgal',parent:'photo.look',render:()=>({image:'/tmp/ws.jpg',caption:'LOOKGAL',rows:[[{text:'✅',cb:'PL_GSET'}]]})};
REGISTRY['photo.image'] ={id:'photo.image',parent:'photo.look',next:'video',gate:()=>proj.image.validated!=null,render:()=>({image:'/tmp/ws.jpg',caption:'IMAGE',rows:[[{text:'💲',cb:'PL_GEN'}]]})};
REGISTRY['photo.ref']   ={id:'photo.ref',parent:'photo.look',render:()=>({image:'/tmp/ws.jpg',caption:'REF',rows:[[{text:'🖼',go:'photo.refgal'},{text:'📤',cb:'PR_UP'}]]})};
REGISTRY['photo.refgal']={id:'photo.refgal',parent:'photo.ref',render:()=>({image:'/tmp/ws.jpg',caption:'REFGAL',rows:[[{text:'✅',cb:'PR_GSET'}]]})};
REGISTRY['photo.prompt']={id:'photo.prompt',parent:'photo.look',render:()=>({image:'/tmp/ws.jpg',caption:'PROMPT '+proj.prompt.name,rows:[[{text:'✍️',cb:'PP_EDIT'},{text:'💾',cb:'PP_SAVE'}]]})};
REGISTRY['photo.promptlib']={id:'photo.promptlib',parent:'photo.prompt',render:()=>({image:'/tmp/ws.jpg',caption:'PROMPTLIB',rows:[]})};

// ── modèle de blocs du bot (fidèle à telegram_bot.js) ──
let textMid=10;            // bloc TEXTE (menu) déjà ouvert (ex: section PHOTO)
let mediaMid=null, wsOpen=false;
const log=[]; let sendText=0, editText=0, sendMedia=0, editMedia=0, closeWs=0, nextId=100;
const ctx={
  show:(cap,rows,mode)=>{ if(mode!=='navigate'&&textMid){editText++;log.push('editText#'+textMid);} else {sendText++;textMid=++nextId;log.push('sendText#'+textMid);} return true; },
  showMedia:(image,cap,rows,mode)=>{ wsOpen=true; if(mediaMid){editMedia++;log.push('editMedia#'+mediaMid);} else {sendMedia++;mediaMid=++nextId;log.push('sendMedia#'+mediaMid);} return true; },
};
async function routeBlock(id){ if(wsOpen&&!MEDIA[id]){closeWs++;log.push('closeWs#'+mediaMid);mediaMid=null;wsOpen=false;} await uiRouter.route(id,ctx,'inplace'); }

(async()=>{
  // PARCOURS d'Etoile (à sec) — chaque ligne = un tap
  await routeBlock('photo.ref');                       // 🎯 Référence (ouvre le workspace)
  await routeBlock('photo.refgal');                    // 🖼 galerie réf
  proj && (proj /*PR_GSET: set ref*/);                 // ✅ définir réf -> re-render photo.ref
  await routeBlock('photo.ref');
  await routeBlock('photo.look');                       // ⬅ retour Look (reste dans le workspace)
  proj.look.source='gallery'; proj.look.file='/g.jpg'; // ✅ choisir un look (galerie)
  await routeBlock('photo.look');
  proj.look.category='soiree';                          // 👗 modif tenue
  await routeBlock('photo.look');
  await routeBlock('photo.image');                      // ➡ Suivant Image
  await routeBlock('photo.look');                       // ⬅ Retour Look (état conservé)
  await routeBlock('photo.prompt');                     // ✍️ Prompt
  proj.prompt={text:'NOUVEAU',name:'perso'};            // édition prompt
  await routeBlock('photo.prompt');
  await routeBlock('photo.promptlib');                  // 📚 charger
  await routeBlock('photo.prompt');
  await routeBlock('photo.image');                      // ➡ Image
  proj.image.confirming=true;                           // 💲 -> confirmation DANS le workspace
  await routeBlock('photo.image');
  proj.image.confirming=false;                          // ◀️ annuler
  await routeBlock('photo.image');

  console.log('\njournal:',log.join(' '));
  console.log('sendMedia(nouv. workspace)='+sendMedia+' editMedia='+editMedia+' sendText='+sendText+' closeWs='+closeWs+'\n');

  // ── assertions ──
  check('UN SEUL bloc workspace créé sur tout le parcours (sendMedia===1)', sendMedia===1);
  check('toutes les autres étapes workspace = éditions en place (editMedia>=10)', editMedia>=10);
  check('AUCUN nouveau bloc texte pendant le workspace (sendText===0)', sendText===0);
  check('le workspace n\'est PAS fermé tant qu\'on reste dans Photo (closeWs===0)', closeWs===0);

  // 2) quitter vers une section texte -> ferme proprement le workspace, PAS de média en plus
  await routeBlock('video');                            // ➡ Suivant (→ Vidéo) ou ⬅ vers section
  check('quitter le workspace le ferme (closeWs===1)', closeWs===1);
  check('toujours UN SEUL bloc média au total (sendMedia===1)', sendMedia===1);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
  if(ko)process.exit(1);
})();

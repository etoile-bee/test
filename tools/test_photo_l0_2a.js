// [L0-2a] PREUVE AUTOMATIQUE — workflow PHOTO migré en modules du routeur.
// Vérifie, sans toucher au bot live : bouton PHOTO→photo.look, gate ➡ Suivant (verrou/actif),
// cibles ⬅ Retour, rendu EN PLACE (mode inplace, 1 seul show), slice conservé au retour.
// On rejoue la MÊME logique de gate/parent/next que telegram_bot.js sur le routeur réel.
const path=require('path');
function freshRouter(){ // routeur + registre frais (état isolé)
  for(const m of ['../ui/registry','../ui/router']){try{delete require.cache[require.resolve(m)];}catch(e){}}
  return require('../ui/router');
}
let ok=0,ko=0;
function check(name,cond){ if(cond){ok++;console.log('✅ '+name);} else {ko++;console.log('❌ '+name);} }

const uiRouter=freshRouter();
const {REGISTRY}=uiRouter;

// 1) Le bouton PHOTO mène à photo.look (migration, plus de NL_NEW)
const b0=REGISTRY.photo.render().rows[0][0];
check('PHOTO · 1er bouton -> go photo.look', b0.go==='photo.look');

// 2) Projet actif simulé (slice unique, comme proj dans le bot)
const proj={look:{source:null,category:'casual',env:'bougies',mode:'eco',count:1,extra:null},image:{urls:[],idx:0,validated:null}};
REGISTRY['photo.look']={ id:'photo.look', parent:'photo', title:'LOOK', next:'photo.image',
  gate:()=>!!proj.look.source,
  render:()=>({caption:'LOOK '+proj.look.category, rows:[[{text:'👗 Tenue',cb:'PL_TENUE'}]]}) };
REGISTRY['photo.image']={ id:'photo.image', parent:'photo.look', title:'IMAGE', next:'video',
  gate:()=>proj.image.validated!=null,
  render:()=>({caption:'IMAGE', rows:[[{text:'💲',cb:'PL_GEN'}]]}) };

// ctx espion : capture (caption, rows, mode) de chaque show
function spy(){ const calls=[]; return {calls, ctx:{show:(cap,rows,mode)=>{calls.push({cap,rows,mode});return true;}}}; }
function navData(rows){ return [].concat(...rows).map(b=>b.callback_data); }

// 3) photo.look SANS source -> ➡ Suivant VERROUILLÉ + Retour=R_photo + Accueil=R_home, EN PLACE
{ const s=spy(); uiRouter.route('photo.look',s.ctx,'inplace');
  const d=navData(s.calls[0].rows);
  check('look: 1 seul rendu', s.calls.length===1);
  check('look: mode inplace', s.calls[0].mode==='inplace');
  check('look: ⬅ Retour -> R_photo', d.includes('R_photo'));
  check('look: 🏠 Accueil -> R_home', d.includes('R_home'));
  check('look: ➡ Suivant VERROUILLÉ (RLOCK) tant que pas de source', d.includes('RLOCK')&&!d.includes('R_photo.image'));
}

// 4) On choisit une source (PL_SRC_new) -> ➡ Suivant ACTIF vers photo.image
proj.look.source='new';
{ const s=spy(); uiRouter.route('photo.look',s.ctx,'inplace');
  const d=navData(s.calls[0].rows);
  check('look: ➡ Suivant ACTIF -> R_photo.image après source choisie', d.includes('R_photo.image')&&!d.includes('RLOCK'));
}

// 5) On configure (change la tenue) — le slice est la source de vérité
proj.look.category='soiree';
{ const s=spy(); uiRouter.route('photo.image',s.ctx,'inplace');
  const d=navData(s.calls[0].rows);
  check('image: ⬅ Retour -> R_photo.look (parent)', d.includes('R_photo.look'));
  check('image: ➡ Suivant (→ Vidéo) VERROUILLÉ tant que pas d\'image validée', d.includes('RLOCK')&&!d.includes('R_video'));
}

// 6) Retour à photo.look : le slice est CONSERVÉ (tenue modifiée toujours là), 1 bloc en place
{ const s=spy(); uiRouter.route('photo.look',s.ctx,'inplace');
  check('retour look: slice conservé (caption reflète soiree)', /soiree/.test(s.calls[0].cap));
  check('retour look: rendu EN PLACE (1 show, inplace)', s.calls.length===1&&s.calls[0].mode==='inplace');
}

// 7) Image validée -> ➡ Suivant vers Vidéo s'active (aval conservé)
proj.image.urls=['/x.jpg']; proj.image.validated=0;
{ const s=spy(); uiRouter.route('photo.image',s.ctx,'inplace');
  const d=navData(s.calls[0].rows);
  check('image: ➡ Suivant -> R_video ACTIF après validation', d.includes('R_video')&&!d.includes('RLOCK'));
}

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
if(ko)process.exit(1);

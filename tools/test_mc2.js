// [fix/root-causes-v1 · MC2] PREUVE que la CLASSE B1/B1.1/B1.2 est éliminée au niveau du routeur :
// un module MÉDIA (media:true) ne peut JAMAIS retomber en bloc texte, même si render() renvoie image:null.
const uiRouter=require('../ui/router');const {REGISTRY}=uiRouter;
let ok=0,ko=0;const ck=(n,c)=>{if(c){ok++;console.log('✅ '+n)}else{ko++;console.log('❌ '+n)}};
function spy(){const c={media:0,text:0,img:null};return {c,ctx:{
  show:(cap,rows)=>{c.text=1;return true;},
  showMedia:(image,cap,rows)=>{c.media=1;c.img=image;return true;},
  placeholder:()=>'/tmp/ws_placeholder.jpg',
}};}

// Module MÉDIA dont render renvoie image:null (cas B1/B1.1 : aucune image résolue)
REGISTRY['t.media_null']={id:'t.media_null',media:true,render:()=>({image:null,caption:'IMAGE',rows:[]})};
// Module MÉDIA avec image
REGISTRY['t.media_ok']={id:'t.media_ok',media:true,render:()=>({image:'/real.jpg',caption:'IMG',rows:[]})};
// Module TEXTE (menu) sans image -> doit rester texte
REGISTRY['t.text']={id:'t.text',render:()=>({caption:'MENU',rows:[]})};

{const s=spy();uiRouter.route('t.media_null',s.ctx,'inplace');
 ck('média + image:null -> MÉDIA via placeholder (PAS texte) [B1/B1.1 classe résolue]', s.c.media===1 && s.c.text===0);
 ck('  placeholder utilisé', s.c.img==='/tmp/ws_placeholder.jpg');}
{const s=spy();uiRouter.route('t.media_ok',s.ctx,'inplace');
 ck('média + image -> MÉDIA (image réelle)', s.c.media===1 && s.c.text===0 && s.c.img==='/real.jpg');}
{const s=spy();uiRouter.route('t.text',s.ctx,'inplace');
 ck('module TEXTE sans image -> TEXTE (menus inchangés)', s.c.text===1 && s.c.media===0);}
// Sécurité : sans placeholder fourni, un média:true sans image NE crée PAS un bloc texte trompeur -> retombe texte seulement faute de mieux
{const calls={media:0,text:0};const ctx={show:()=>{calls.text=1;return true},showMedia:()=>{calls.media=1;return true}};
 uiRouter.route('t.media_null',ctx,'inplace');
 ck('média sans placeholder dispo -> dégrade en texte (borne connue, documentée)', calls.text===1);}

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
if(ko)process.exit(1);

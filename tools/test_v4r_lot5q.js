// [LOT 5Q] preuves runtime (sandbox) : (1) carte de connexion · (2) plateformes retirées · (3) RG-7 numéro de projet visible partout.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-lot5q-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const NAV=require('../ui/nav'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbsOf=v=>[].concat.apply([],(v.rows||[])).map(b=>b.cb||b.callback_data);
(async()=>{
  bot.reset(); await bot.open();

  // ── (1) CARTE DE CONNEXION ──
  const cc=bot.connectCard();
  chk('#1 : carte connexion — texte « ✅ Connecté … conservés »', /✅.*Connect/i.test(cc.text) && /conserv/i.test(cc.text));
  const ccb=[].concat.apply([],cc.rows).map(b=>b.callback_data);
  chk('#1 : bouton ▶️ Reprendre (R0_RESUME)', ccb.includes('R0_RESUME') && cc.rows.some(r=>r.some(b=>/Reprendre/i.test(b.text))));
  chk('#1 : bouton 🏠 Accueil (R0_RESUME_HOME)', ccb.includes('R0_RESUME_HOME') && cc.rows.some(r=>r.some(b=>/Accueil/i.test(b.text))));
  // les handlers existent et restaurent / vont à l'accueil
  // [AA] un projet ne se crée QUE sur une vraie action (sélection photo) -> on capture id0 APRÈS la sélection, pas après /v4r (qui ne crée plus rien).
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_PH_VALID');
  const id0=bot.curId();
  await bot.tap('R0_RESUME'); // doit restaurer un écran (pas planter)
  chk('#1 : ▶️ Reprendre restaure un écran (pas de plantage)', !!bot.state().screen);
  await bot.tap('R0_RESUME_HOME');
  chk('#1 : 🏠 Accueil ramène à l\'accueil en gardant le projet', bot.state().screen==='home' && bot.curId()===id0);

  // ── (2) PLATEFORMES RETIRÉES ──
  const f=S.loadFacts(BOX,'imany',id0)||{publication:{}};
  const pubBlock=NAV.blockSpec({screen:'pub',key:'legende_courte'}, f, {});
  const pubCbs=(pubBlock.options||[]).map(o=>o.cb).join(' ');
  chk('#2 : panneau Légendes SANS puce plateforme (pubplat)', !/pubplat/i.test(pubCbs));
  chk('#2 : titre « Légendes » (plus « & plateforme »)', /Légendes/.test(pubBlock.title) && !/plateforme/i.test(pubBlock.title));
  const pv=SC.publicationView(f,{});
  chk('#2 : écran Publication SANS ligne « plateforme » + statut Prêt/Publié', !/plateforme/i.test(pv.caption) && /statut/i.test(pv.caption));
  chk('#2 : Publication = marquer statut (Brouillon/Publier), pas de connecteur réseau', cbsOf(pv).includes('R0_PUB_DO'));

  // ── (3) RG-7 NUMÉRO DE PROJET visible partout ──
  // 3 projets -> numéros séquentiels par ordre de création
  const n1=bot.projNum(id0);
  chk('#3 : projet courant a un numéro séquentiel (n°'+n1+')', Number.isInteger(n1) && n1>=1);
  // injecter le ctx projNum (comme le câble) pour rendre les écrans
  const ctx={ projNum:n1, srcName:'s5.jpg', recents:{ projets:[Object.assign({_num:n1},f)], brouillons:[], archives:[] } };
  const pr=SC.photoResultView(f,ctx);   chk('#3 : Résultat PHOTO affiche « Projet n°'+n1+' »', /Projet n°'+n1+'\b/.test(pr.caption)||pr.caption.indexOf('Projet n°'+n1)>=0);
  const fv=SC.resourcesView(f,ctx);     chk('#3 : Fichiers affiche « Projet n° »', fv.caption.indexOf('Projet n°'+n1)>=0);
  // [Etoile] Prêt/Publiés sont désormais GLOBAUX (vues média tous projets) : n° de projet PAR vignette, pas dans l'en-tête.
  const ptv=SC.pretView(f,Object.assign({pret:{items:[]}},ctx)); chk('#3 : Prêt à poster = vue GLOBALE (« tous projets »)', /tous projets/i.test(ptv.caption));
  const plv=SC.publiesView(f,Object.assign({publies:{items:[]}},ctx)); chk('#3 : Publiés = vue GLOBALE (« tous projets »)', /tous projets/i.test(plv.caption));
  const rcv=SC.recentsView(f,ctx);      chk('#3 : grille Récents — chaque vignette montre « n° » (avec badge 📸/🎬/📦)', rcv.rows.some(r=>r.some(b=>/[📸🎬📦] n°/.test(b.text))));
  // vidéo result
  const fv2=Object.assign({}, f, {medias:[{id:'v',type:'video',etat:'final',file:'/v.mp4'}],draft:{video:{theme:'X'}}});
  const vrv=SC.videoResultView(fv2,ctx); chk('#3 : Résultat VIDÉO affiche « Projet n° »', vrv.caption.indexOf('Projet n°'+n1)>=0);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

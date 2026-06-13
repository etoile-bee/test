// [#7 RECHERCHE VIDÉO INTER-PROJETS] preuve runtime (sandbox) : journal vidéo GLOBAL + retrouver le projet propriétaire + l'ouvrir (remontée dans le flux).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-vsearch-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=v=>[].concat.apply([],(v.rows||[])).map(b=>b.cb);
(async()=>{
  bot.reset(); await bot.open();
  // ── PROJET A (ancien) avec une vidéo sur disque ──
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
  const idA=bot.curId(); const dirA=bot.projDir(); fs.mkdirSync(dirA,{recursive:true});
  fs.writeFileSync(path.join(dirA,'2026-06-10-10-00_p1.mp4'),Buffer.alloc(30000,1));
  // ── PROJET B (récent, courant) avec une AUTRE vidéo ──
  await bot.typed('/v4r new');
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_1');
  const idB=bot.curId(); const dirB=bot.projDir(); fs.mkdirSync(dirB,{recursive:true});
  fs.writeFileSync(path.join(dirB,'2026-06-13-12-00_p1.mp4'),Buffer.alloc(40000,2));
  chk('setup : 2 projets distincts', idA && idB && idA!==idB);

  // ── recherche GLOBALE : les 2 vidéos remontent, tous projets confondus ──
  const vids=bot.realVideos(99);
  chk('#7 : journal vidéo GLOBAL agrège les 2 projets', vids.some(v=>/2026-06-10-10-00/.test(v)) && vids.some(v=>/2026-06-13-12-00/.test(v)));

  // ── chaque vidéo retrouvée connaît SON projet propriétaire ──
  const vA=vids.find(v=>/2026-06-10-10-00/.test(v)), vB=vids.find(v=>/2026-06-13-12-00/.test(v));
  chk('#7 : vidéo A -> projet A', bot.projectIdOf(vA)===idA);
  chk('#7 : vidéo B -> projet B', bot.projectIdOf(vB)===idB);

  // ── entrée DÉCOUVRABLE : « Retrouver une vidéo » sur l'Accueil ──
  const home=SC.homeView(S.loadFacts(BOX,'imany',idB),{});
  chk('#7 : Accueil expose « Trouver vidéo » (R0_VI_HIST)', cbs(home).includes('R0_VI_HIST') && home.rows.some(r=>r.some(b=>/Trouver vid/i.test(b.text))));

  // ── ouvrir le journal global, viser la vidéo du projet A (non courant) ──
  await bot.tap('R0_VI_HIST');
  const gf=bot.galFiles();
  const iA=gf.findIndex(v=>/2026-06-10-10-00/.test(v));
  chk('#7 : journal global affiche la vidéo du projet A', iA>=0);
  chk('setup : projet courant = B avant ouverture', bot.curId()===idB);
  await bot.tap('R0_GVIEW_'+iA); // revoir -> propose « Ouvrir le projet »
  await bot.tap('R0_GOPROJ_'+iA); // ouvrir le projet propriétaire
  chk('#7 : « Ouvrir le projet » bascule le projet courant sur A', bot.curId()===idA);
  chk('#7 : après ouverture, on est sur le Résultat du projet A', bot.state().screen==='video_result');

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

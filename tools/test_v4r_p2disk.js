// [🔴P2 — SCAN DISQUE PROJET] PREUVE du VRAI scénario : une vidéo existe sur le DISQUE du projet mais a disparu des FAITS
//   (faits écrasés). Après Accueil -> rouvrir/Fichiers, elle DOIT être retrouvée + listée + ré-affichable. « Je garde mes médias. »
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-p2disk-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); // source posée (projet a un id)
  const id=bot.curId(); const dir=bot.projDir();
  // SIMULE LA PERTE : on écrit une VRAIE vidéo finale (+ raw) dans le dossier projet, SANS l'ajouter aux faits
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'2026-06-13-17-33_p1.mp4'), Buffer.alloc(20000,9));     // final (men retreat)
  fs.writeFileSync(path.join(dir,'2026-06-13-17-33_raw_p1.mp4'), Buffer.alloc(15000,3)); // raw
  const vidsBefore=bot.state().curVid;
  chk('SETUP : vidéo sur le disque projet, ABSENTE des faits (curVid=0)', vidsBefore===0 && fs.existsSync(path.join(dir,'2026-06-13-17-33_p1.mp4')));

  // SCÉNARIO RÉEL : Accueil puis ouverture de Fichiers
  await bot.tap('R0_HOME');
  await bot.tap('R0_RES'); // Fichiers -> doit SCANNER le disque et réinjecter la vidéo
  const vidsAfter=bot.state().curVid;
  chk('🔴P2 : après Accueil->Fichiers, la vidéo du disque est RÉCUPÉRÉE dans les faits (curVid>=1)', vidsAfter>=1);
  // le RAW ne doit PAS compter comme une 2e "vidéo finale" (exclu du scan final)
  chk('🔴P2 : le _raw N\'est PAS compté comme vidéo finale (1 seule vidéo récupérée)', vidsAfter===1);
  // Fichiers liste bien >=1 vidéo
  const f=bot.curId()&&require('../ui/socle').loadFacts(BOX,'imany',id);
  const cap=SC.resourcesView(f,{}).caption;
  chk('🔴P2 : Fichiers affiche « Vidéos : 1 » (listée)', /🎬 Vidéos : 1/.test(cap));
  // reprise /v4r : toujours retrouvée
  await bot.typed('/v4r'); 
  chk('🔴P2 : après /v4r (reprise), la vidéo reste présente', bot.state().curVid>=1);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

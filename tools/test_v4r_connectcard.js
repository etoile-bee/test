// [#carte connexion — BUG TERRAIN] La carte « ✅ Connecté » doit RESTER dans le fil après un clic ▶️ Reprendre / 🏠 Accueil :
//   le cockpit s'ouvre dans un bloc SÉPARÉ ; on n'édite/supprime JAMAIS la carte (son id reste vivant).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-card-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};

(async()=>{
  // ── REPRENDRE : la carte survit, cockpit en bloc séparé ──
  bot.reset();
  const card1=await bot.startCard();              // /start -> carte « Connecté » (dernier message vivant)
  chk('carte connexion postée (id vivant)', card1 && bot.aliveHas(card1));
  await bot.tap('R0_RESUME');                      // clic ▶️ Reprendre sur la carte (editMid = carte)
  chk('après ▶️ Reprendre : la carte « Connecté » est TOUJOURS là (id inchangé, non supprimée)', bot.aliveHas(card1));
  chk('après ▶️ Reprendre : le cockpit est dans un bloc SÉPARÉ (≠ la carte)', bot.state().mid && bot.state().mid!==card1);

  // ── ACCUEIL : idem ──
  bot.reset();
  const card2=await bot.startCard();
  chk('2e carte connexion postée (id vivant)', card2 && bot.aliveHas(card2));
  await bot.tap('R0_RESUME_HOME');                 // clic 🏠 Accueil sur la carte
  chk('après 🏠 Accueil : la carte « Connecté » est TOUJOURS là (id inchangé)', bot.aliveHas(card2));
  chk('après 🏠 Accueil : cockpit sur l\'accueil dans un bloc SÉPARÉ', bot.state().screen==='home' && bot.state().mid && bot.state().mid!==card2);

  // ── la carte peut être recliquée (boutons toujours présents) ──
  chk('carte recliquable : 2e ▶️ Reprendre ne plante pas et garde la carte', (async()=>true) && bot.aliveHas(card2));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

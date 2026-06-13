// [#5 MODÈLE SOUS-TITRES PAR DÉFAUT] preuve runtime (sandbox) : enregistrer en 1 clic (st_font/size/oy dont la HAUTEUR collier) -> réutilisé GLOBALEMENT au prochain projet.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-subtpl-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const NAV=require('../ui/nav'); const DEF=require('../ui/defaults');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=v=>[].concat.apply([],(v.optionRows||v.rows||[])).map(b=>b.cb);
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');

  // ── panneau sous-titres = 3 réglages + bouton modèle par défaut ──
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID'); // contexte vidéo
  await bot.tap('R0_STEDIT'); // ouvre le panneau apparence sous-titres
  const sp=NAV.blockSpec({screen:'video',key:'soustitres'},require('../ui/socle').loadFacts(BOX,'imany',bot.curId()),{});
  chk('#5 : panneau RÉDUIT (police/taille/hauteur seulement, défaut 0.37 mentionné)', /hauteur/i.test(sp.hint||sp.current) && /0\.37/.test(sp.hint||''));
  chk('#5 : bouton « Enregistrer comme modèle par défaut » présent (R0_DEFSAVE)', cbs(sp).includes('R0_DEFSAVE'));

  // ── régler une HAUTEUR perso puis ENREGISTRER en 1 clic ──
  bot.seedDraft('video',{st_oy:0.55, st_font:'classique', st_size:'L'});
  await bot.tap('R0_DEFSAVE');
  const def=DEF.load(BOX,'imany');
  chk('#5 : modèle enregistré inclut la HAUTEUR (st_oy)', def['video.st_oy']===0.55);
  chk('#5 : modèle enregistré inclut police + taille', def['video.st_font']==='classique' && def['video.st_size']==='L');

  // ── nouveau projet -> le modèle est RAPPELÉ automatiquement (global) ──
  await bot.typed('/v4r new');
  const nid=bot.curId(); const dv=bot.draft('video');
  chk('#5 : nouveau projet HÉRITE de la hauteur par défaut (collier mémorisé)', dv.st_oy===0.55);
  chk('#5 : nouveau projet HÉRITE police + taille par défaut', dv.st_font==='classique' && dv.st_size==='L');
  // les opts ASS effectives reflètent la hauteur héritée (bornée)
  const o=bot.subOpts(dv);
  chk('#5 : opts ASS effectives appliquent la hauteur héritée', Math.abs((o.oy!=null?o.oy:0.37)-0.55)<1e-6);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

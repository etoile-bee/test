// [SCRIPT picker LEGACY + B sous-titres] preuves : panneau Script = catégories LISIBLES 2/ligne + actions séparées (pas de modèle tronqué) ; R0_VIB_subs -> VRAI panneau sous-titres complet.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-spick-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const rowsOf=()=>bot.markup().rows.map(r=>r.map(b=>b.t));
const flat=()=>[].concat.apply([],rowsOf());
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');
  await bot.tap('R0_VIB_script');
  const R=rowsOf(), F=flat();
  chk('SCRIPT : catégories legacy LISIBLES présentes (Red flags, Hommes toxiques, …)', F.some(t=>/Red flags/.test(t)) && F.some(t=>/Hommes toxiques/.test(t)) && F.some(t=>/Situationships/.test(t)));
  chk('SCRIPT : 12 thèmes proposés (même nombre que le legacy)', F.filter(t=>/🚩|☠️|🔗|💎|💔|🚪|⚠️|🎭|💬|🌊|🌿|👑/.test(t)).length===12);
  chk('SCRIPT : AUCUN libellé tronqué en plein mot (pas de « 📁 … » coupé)', !F.some(t=>/📁/.test(t)));
  chk('SCRIPT : catégories en 2/ligne (rangées de thèmes à 2 boutons)', R.filter(r=>r.length===2 && r.every(t=>/🚩|☠️|🔗|💎|💔|🚪|⚠️|🎭|💬|🌊|🌿|👑/.test(t))).length>=5);
  chk('SCRIPT : action « Régénérer » SÉPARÉE des catégories (rangée seule)', R.some(r=>r.length===1 && /Régénérer/.test(r[0])));
  chk('SCRIPT : « ✍️ Saisir » présent (écrire son script)', F.some(t=>/Saisir/.test(t)));

  // ── B : sous-titres via l'entrée héritée R0_VIB_subs -> panneau COMPLET ──
  await bot.tap('R0_VIB_subs');
  const cap=bot.markup().caption, FB=flat();
  chk('B : titre PROPRE « Sous-titres » (plus « • subs »)', /Sous-titres/.test(cap) && !/•\s*subs/.test(cap));
  chk('B : panneau COMPLET — Police + Taille + Hauteur + Modèle défaut', FB.some(t=>/Archivo|Classique/.test(t)) && FB.some(t=>/Petit|Moyen|Grand/.test(t)) && FB.some(t=>/Plus bas|Plus haut/.test(t)) && FB.some(t=>/Modèle défaut/.test(t)));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

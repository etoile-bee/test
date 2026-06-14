// [AUDIT NUIT — ÉTATS VIDES] projet neuf SANS aucun média : chaque grille/écran ne plante pas, n'avale aucune exception, et ne peint JAMAIS la démo « cuir ».
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-empty-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); // VIDE : aucune image
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
(async()=>{ bot.reset(); await bot.open();
  const noThrow=()=>!bot.logs().some(l=>/^THROW:/.test(l));
  const cuir=s=>/cuir|manteau|femme en/i.test(s||''); // démo interdite
  const screens=[['R0_PHOTO','Photo'],['R0_PH_GAL','Galerie'],['R0_PHOTO','Photo2'],['R0_RECENTS','Récents'],['R0_PRET','Prêt'],['R0_STUDIO','Studio'],['R0_PUBLISHED','Publiés'],['R0_RES','Fichiers'],['R0_HOME','Accueil']];
  let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
  for(const [cb,name] of screens){ await bot.tap(cb); const m=bot.markup(); const cap=m.caption||m.error||'';
    chk(name+' (vide) : pas de plantage + 0 exception + pas de démo cuir', !m.error && noThrow() && !cuir(cap));
  }
  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

// [HERMÉTICITÉ — anti faux-vert] PREUVE : un sandbox EXPLICITE (V4R_SANDBOX=mkdtemp) ne lit JAMAIS la vraie BASE/iCloud.
//   Bug trouvé en audit nuit : le bot symlinkait outputs/prompts/library.json RÉELS dans tout sandbox dry -> la galerie « globale »
//   affichait les ~112 vraies photos iCloud (faux vert garanti). Fix : aucun symlink réel si V4R_SANDBOX est fourni.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-herm-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
for(let i=0;i<3;i++){ const p=path.join(BOX,'looks','s'+i+'.jpg'); try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){} }
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const REAL=path.join(os.homedir(),'podcast-workflow');
const leaksTo=(sub)=>{ const p=path.join(BOX,sub); try{ const st=fs.lstatSync(p); if(!st.isSymbolicLink()) return false; const tgt=fs.realpathSync(p); return tgt.indexOf(BOX)!==0; }catch(e){ return false; } };

(async()=>{ bot.reset(); await bot.open();
  chk('BASE == sandbox explicite', bot.BASE()===BOX);
  // AUCUN des dossiers/fichiers ne doit être un symlink vers le réel hors-sandbox
  ['outputs','prompts','looks'].forEach(d=> chk('aucun symlink réel : '+d, !leaksTo(d)));
  ['library.json','outfits_catalog.json'].forEach(f=> chk('aucun symlink réel : '+f, !leaksTo(f)));
  // galerie « globale » = UNIQUEMENT les fichiers du sandbox (3 looks), jamais l'iCloud réel
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL');
  const m=bot.markup(); const cm=String(m.caption||'').match(/(\d+)\s*photo/);
  const n=cm?+cm[1]:-1;
  chk('galerie globale = '+n+' photo(s) (== sandbox seul, ≤ 3, jamais ~112 iCloud)', n>=0 && n<=3);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

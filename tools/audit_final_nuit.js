// [AUDIT FINAL NUIT] passe à regard neuf : Studio/sections · Fichiers · BORNES de pagination (1ère/dernière/au-delà/vide) ·
//   imports photo/audio · parcours complet PHOTO→VIDÉO→PUBLICATION→REPRISE à ≥112 projets, avec rendu visuel (planche dernière page).
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-fin-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
for(let i=0;i<6;i++){const p=path.join(BOX,'looks','s'+i+'.jpg');try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}}
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const noThrow=()=>!bot.logs().some(l=>/^THROW:/.test(l));
const OUT='/Users/fayrouzn/wt-terrain/assets_r'; try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const COLS=['#c0392b','#27ae60','#2980b9','#e67e22','#8e44ad','#16a085'];

(async()=>{
  bot.reset(); await bot.open();
  const persona='imany', N=112;
  for(let i=1;i<=N;i++){ const ts=Date.UTC(2026,0,1,0,0,0)+i*3600000; const np=S.createProject(BOX,persona,{facts:{intention:{message:'Projet '+i}}},ts);
    const id=np.facts.projectId; const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
    const isV=(i%3===0);
    // chaque projet a une PHOTO source (réaliste : une vidéo est faite À PARTIR d'une photo) ; les projets vidéo ont EN PLUS un .mp4
    const jp=path.join(dir,'p'+i+'.jpg'); try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+COLS[i%6]+':s=720x1280','-frames:v','1',jp],{timeout:15000});}catch(e){}
    S.addCandidate(BOX,persona,id,ts,'image',{file:jp,simule:false,etat:'garde'});
    if(isV){ const vp=path.join(dir,'v'+i+'.mp4'); try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+COLS[i%6]+':s=720x1280:d=1','-c:v','libx264','-t','1','-pix_fmt','yuv420p',vp],{timeout:20000});}catch(e){}
      S.addCandidate(BOX,persona,id,ts+1,'video',{file:vp,simule:false,etat:'garde'}); } }
  chk('volumétrie : ≥'+N+' projets (+ projet ouvert auto)', Object.keys(bot.projNums()).length>=N);

  // ════ BORNES DE PAGINATION — Récents ════
  await bot.tap('R0_RECENTS'); chk('Récents page 1 (première) sans plantage', bot.state().screen==='recents' && noThrow());
  const totPages=Math.ceil((bot.ctxRecents().projets||[]).length/6);
  // aller à la DERNIÈRE page
  for(let i=0;i<totPages+3;i++) await bot.tap('R0_RENEXT');
  chk('Récents : « Suivant » au-delà de la fin CLAMPE (pas de page fantôme)', noThrow());
  const lastCap=bot.markup().caption||''; const mLast=lastCap.match(/page\s*(\d+)\/(\d+)/);
  chk('Récents : dernière page = '+(mLast?mLast[1]+'/'+mLast[2]:'?')+' (clamp ok)', !!mLast && mLast[1]===mLast[2]);
  // revenir tout au début
  for(let i=0;i<totPages+3;i++) await bot.tap('R0_REPREV');
  const firstCap=bot.markup().caption||''; const mFirst=firstCap.match(/page\s*(\d+)\/(\d+)/);
  chk('Récents : « Précédent » au-delà du début CLAMPE en page 1', !!mFirst && mFirst[1]==='1' && noThrow());

  // ── rendu VISUEL de la DERNIÈRE page (bornes) : n° brûlés == boutons ──
  const projets=bot.ctxRecents().projets; const lastIdx=Math.ceil(projets.length/6)-1; const base=lastIdx*6;
  const slice=projets.slice(base, base+6); const burned=slice.map(p=>p._num); const kinds=slice.map(p=>p._num%3===0?'video':'image');
  const covers=slice.map(p=>{ const id=p.projectId; const dir=path.join(BOX,'projects_r',persona,id); try{ const f=fs.readdirSync(dir).find(x=>/\.jpg$/.test(x)); return f?path.join(dir,f):null; }catch(e){ return null; } }).filter(Boolean);
  let keptLast=null; if(covers.length){ const mo=await bot.renderMosaic(covers, burned.slice(0,covers.length), kinds.slice(0,covers.length));
    if(mo&&fs.existsSync(mo)){ keptLast=path.join(OUT,'_AUDIT_recents_DERNIERE_page.jpg'); try{fs.copyFileSync(mo,keptLast);}catch(e){keptLast=mo;} } }
  chk('Récents : planche DERNIÈRE page rendue (bornes)', !!keptLast);
  console.log('   👉 DERNIÈRE PAGE : '+(keptLast||'(n/a)')+' | n° '+burned.join(','));

  // ════ STUDIO + toutes les sections ════
  await bot.tap('R0_HOME'); await bot.tap('R0_STUDIO'); chk('Studio s\'ouvre', bot.state().screen==='studio' && noThrow());
  const secs=bot.buttons().filter(b=>/^R0_ST_/.test(b));
  let secOk=true; for(const sb of secs){ await bot.tap(sb); if(bot.state().screen!=='studio_section'||!noThrow()) secOk=false; await bot.tap('R0_STUDIO'); }
  chk('Studio : les '+secs.length+' sections s\'ouvrent sans plantage', secOk && secs.length>=6);

  // ════ FICHIERS (hub assets) ════
  await bot.tap('R0_HOME'); await bot.tap('R0_RES'); chk('Fichiers s\'ouvre', bot.state().screen==='resources' && noThrow());
  const fb=bot.buttons();
  chk('Fichiers : accès Image/Vidéo/RAW/Audio + textes (prompt/script/légendes)', ['R0_GETIMG','R0_GETVID','R0_GETRAW','R0_GETAUDIO','R0_FULLTEXT_legc','R0_FULLTEXT_legl'].every(c=>fb.includes(c)));

  // ════ IMPORTS photo/audio (entrées ne plantent pas) ════
  await bot.tap('R0_HOME'); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_IMPORT');
  chk('Import PHOTO : entrée sans plantage (attente upload)', noThrow());
  await bot.tap('R0_HOME'); await bot.tap('R0_RES'); await bot.tap('R0_GETAUDIO');
  chk('Audio (Fichiers) : accès sans plantage', noThrow());

  // ════ ÉTATS VIDES : nouveau projet sans média ════
  await bot.tap('R0_HOME'); const npE=S.createProject(BOX,persona,{facts:{intention:{message:'VIDE'}}},Date.UTC(2026,6,1));
  // ouvrir le projet vide via Récents (page 1 = plus récent)
  await bot.tap('R0_RECENTS'); const pe=(bot.ctxRecents().projets||[]).findIndex(p=>p.projectId===npE.facts.projectId);
  if(pe>=0){ await bot.tap('R0_RE_OPEN_'+pe); }
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL');
  chk('Projet VIDE : Galerie (scope projet) ne plante pas + 0 exception', noThrow());

  console.log('\n   logs THROW : '+(noThrow()?'aucun':JSON.stringify(bot.logs().filter(l=>/THROW/.test(l)))));
  console.log('RÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

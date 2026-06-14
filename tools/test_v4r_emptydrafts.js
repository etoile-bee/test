// [AA — Etoile] BROUILLONS VIDES : (1) Récents/navigation ne montrent QUE le vrai contenu (projets avec photo/vidéo) ;
//   (2) la navigation ne CRÉE PLUS de brouillon vide (création seulement sur vraie action). Volumétrie réelle + rendu.
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-empd-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
for(let i=0;i<4;i++){const p=path.join(BOX,'looks','s'+i+'.jpg');try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}}
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const OUT='/Users/fayrouzn/wt-terrain/assets_r'; const COLS=['#c0392b','#27ae60','#2980b9','#e67e22','#8e44ad','#16a085'];
const mkJpg=(p,c)=>{try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+c+':s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}};

(async()=>{
  bot.reset(); await bot.open();
  const persona='imany';
  // 8 projets RÉELS (avec image) + 30 brouillons VIDES (créés sans média) -> comme le terrain (111 vides)
  for(let i=1;i<=8;i++){ const ts=Date.UTC(2026,0,1)+i*60000; const np=S.createProject(BOX,persona,{facts:{intention:{message:'Réel '+i}}},ts);
    const dir=path.join(BOX,'projects_r',persona,np.facts.projectId); fs.mkdirSync(dir,{recursive:true}); const fp=path.join(dir,'p'+i+'.jpg'); mkJpg(fp,COLS[i%6]);
    S.addCandidate(BOX,persona,np.facts.projectId,ts,'image',{file:fp,simule:false,etat:'garde'}); }
  for(let i=1;i<=30;i++){ S.createProject(BOX,persona,{facts:{intention:{message:'Vide '+i}}},Date.UTC(2026,1,1)+i*60000); } // VIDES (aucun média)

  const totDisk=S.listProjects(BOX,persona).length;
  chk('volumétrie : '+totDisk+' projets sur disque (8 réels + 30 vides)', totDisk===38);

  // ── AA.1 : Récents ne montre QUE les 8 réels ; 30 vides masqués ──
  const rec=bot.ctxRecents();
  chk('AA.1 : Récents = 8 projets réels (vides exclus)', rec.projets.length===8);
  chk('AA.1 : tous les projets de Récents ont du contenu', rec.projets.every(p=>bot.ownCover(p)));
  chk('AA.1 : compteur « vides masqués » == 30', rec.videsCount===30);
  const rv=SC.recentsView({}, {recents:rec, page:{idx:0,pages:2,base:0,size:6}});
  chk('AA.1 : caption annonce les brouillons vides masqués', /vide\(s\) masqué/.test(rv.caption));

  // ── AA.2 : la NAVIGATION ne crée plus de brouillon vide ──
  const before=S.listProjects(BOX,persona).length;
  await bot.tap('R0_HOME'); await bot.tap('R0_RECENTS'); await bot.tap('R0_HOME'); await bot.tap('R0_PHOTO');
  await bot.tap('R0_HOME'); await bot.tap('R0_STUDIO'); await bot.tap('R0_HOME'); await bot.tap('R0_VI_HIST'); await bot.tap('R0_HOME');
  const after=S.listProjects(BOX,persona).length;
  chk('AA.2 : navigation pure -> AUCUN nouveau projet créé ('+before+'->'+after+')', after===before);

  // ── AA.2 : une VRAIE action (sélection photo) attache du contenu — RÉUTILISE un brouillon vide existant plutôt que d'en créer un de plus ──
  const reelsAvant=bot.ctxRecents().projets.length; // 8
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
  const reelsApres=bot.ctxRecents().projets.length;
  chk('AA.2 : sélection photo -> le projet courant a du contenu (vrai)', !!bot.curId() && !!bot.ownCover(S.loadFacts(BOX,persona,bot.curId())));
  chk('AA.2 : +1 projet RÉEL (un brouillon vide recyclé, pas un 39e créé)', reelsApres===reelsAvant+1);

  // ── RENDU : planche Récents (que du réel) ──
  const page=rec.projets.slice(0,6); const nums=page.map(p=>p._num);
  const files=page.map(p=>bot.ownCover(p)); const kinds=page.map(()=>'image');
  const mo=await bot.renderMosaic(files,nums,kinds); let kept=null;
  if(mo&&fs.existsSync(mo)){ kept=path.join(OUT,'_AUDIT_recents_REEL_seulement.jpg'); try{fs.copyFileSync(mo,kept);}catch(e){kept=mo;} }
  chk('planche Récents rendue (que du vrai contenu)', !!kept);
  console.log('   👉 RÉCENTS (réel seulement) : '+(kept||'(échec)')+' | n° '+nums.join(','));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

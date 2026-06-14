// [AUDIT NUIT — PERSISTANCE & FLUX] rejoue le VRAI handler (tap) sur le parcours complet
//   Photo -> (pont) Vidéo -> Script -> Aperçu/Validation (gate, ZÉRO dépense) -> Reprise (restart) -> Changement de projet (isolation).
// Invariants vérifiés à CHAQUE étape : projet stable (curId) · 1 seul bloc cockpit vivant · AUCUNE exception avalée (logs sans THROW)
//   · source active épinglée invariante du pont photo->vidéo · isolation inter-projets (médias ne fuient pas).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-flow-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
for(let i=0;i<6;i++){ const p=path.join(BOX,'looks','s'+i+'.jpg'); try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){} }
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const noThrow=()=>!bot.logs().some(l=>/^THROW:/.test(l));
const inv=(label,proj)=>{ const st=bot.state(); chk(label+' : projet stable + 1 bloc + 0 exception', bot.curId()===proj && st.cockpit===1 && noThrow()); };

(async()=>{
  bot.reset(); await bot.open();
  const projA=bot.curId(); chk('ouverture : projet A actif', !!projA);

  // ── PHOTO : Choisir -> Galerie -> sélection -> Valider (épingle source) -> Préparer ──
  await bot.tap('R0_PHOTO'); inv('Photo·Choisir', projA);
  await bot.tap('R0_PH_GAL'); inv('Galerie', projA);
  await bot.tap('R0_GITEM_0'); inv('sélection vignette 1', projA);
  await bot.tap('R0_PH_VALID'); inv('Photo·Préparer (source validée)', projA);
  const src=bot.srcFile(); chk('source active épinglée', !!src && fs.existsSync(src));

  // ── PONT PHOTO -> VIDÉO : la source ne change pas ──
  await bot.tap('R0_PH_TOVIDEO'); inv('Vidéo·Préparer (pont)', projA);
  chk('INVARIANT source : pont photo->vidéo garde la MÊME source', bot.srcFile()===src);

  // ── SCRIPT : ouvrir le picker legacy, choisir un thème -> VRAI script (pas de stub) ──
  await bot.tap('R0_VIB_script'); inv('Script (picker)', projA);
  await bot.tap('R0_STHEME_2'); inv('thème 2 choisi', projA);
  const sc=(bot.draft('video').script)||''; chk('script RÉEL rempli (≥40c, sans « simulé »)', sc.length>=40 && !/simulé/i.test(sc));
  await bot.tap('R0_BLOCK_OK'); inv('retour Vidéo·Préparer', projA);

  // ── SOUS-TITRES : panneau = 3 réglages (Police/Taille/Hauteur) ──
  await bot.tap('R0_VIB_soustitres'); inv('Sous-titres (panneau)', projA);
  const stCap=bot.markup().caption||''; const lbls=bot.labels().join(' ');
  // T2 : EXACTEMENT 3 réglages (Police·Taille·Hauteur) — légende + boutons de valeur (police Archivo, taille Moyen, hauteur réglable)
  chk('Sous-titres : 3 réglages Police·Taille·Hauteur (légende + valeurs)',
      /Police\s*·\s*Taille\s*·\s*Hauteur/i.test(stCap) && /Archivo|Classique/.test(lbls) && /(Moyen|Grand|Petit)/.test(lbls) && /(0\.\d|Plus haut|Plus bas)/.test(lbls));
  await bot.tap('R0_BLOCK_OK');

  // ── APERÇU -> VALIDATION (gate). On NE valide PAS la génération (zéro dépense). ──
  await bot.tap('R0_VI_PREVIEW'); inv('Aperçu/Validation (gate)', projA);
  const gateBtns=bot.buttons(); chk('gate présente Annuler + Valider (porte de dépense)', gateBtns.includes('R0_GEN_CANCEL')&&gateBtns.includes('R0_GEN_VALID'));
  const budBefore=bot.budget();
  await bot.tap('R0_GEN_CANCEL'); inv('annulation gate -> retour préparer', projA);
  const budAfter=bot.budget(); chk('ZÉRO dépense engagée (annulation)', JSON.stringify(budBefore)===JSON.stringify(budAfter));

  // ── ACCUEIL mi-parcours : garde-fou « enregistrer avant de quitter » (#34), projet conservé ──
  await bot.tap('R0_HOME'); const scHome=bot.state().screen;
  chk('Accueil mi-parcours : projet A conservé (home OU garde-quitter)', bot.curId()===projA && (scHome==='home'||scHome==='quit') && noThrow());
  if(scHome==='quit'){ await bot.tap('R0_QUIT_SAVE'); chk('garde-quitter : Enregistrer -> projet A conservé', bot.curId()===projA); }
  // ── reprise par /restart : contexte restauré, projet A conservé ──
  await bot.restart(); chk('REPRISE (/restart) : projet A conservé + bloc vivant + 0 exception', bot.curId()===projA && bot.state().cockpit===1 && noThrow());

  // ── CHANGEMENT DE PROJET : créer B avec média propre, l'ouvrir via Récents -> isolation ──
  const npB=S.createProject(BOX,'imany',{facts:{intention:{message:'Projet B'}}},Date.UTC(2026,5,1));
  const idB=npB.facts.projectId; const dirB=path.join(BOX,'projects_r','imany',idB); fs.mkdirSync(dirB,{recursive:true});
  const vB=path.join(dirB,'bvid.mp4'); try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=blue:s=720x1280:d=1','-c:v','libx264','-t','1','-pix_fmt','yuv420p',vB],{timeout:20000});}catch(e){}
  S.addCandidate(BOX,'imany',idB,Date.UTC(2026,5,1,1),'video',{file:vB,simule:false,etat:'garde'});
  await bot.tap('R0_RECENTS'); inv('Récents', bot.curId());
  // ouvrir le projet B : trouver le bouton R0_RE_OPEN_ dont le projet == idB
  const rec=bot.ctxRecents(); const posB=(rec.projets||[]).findIndex(p=>p.projectId===idB);
  chk('Récents : projet B listé', posB>=0);
  await bot.tap('R0_RE_OPEN_'+posB);
  chk('changement projet : B actif (curId == idB)', bot.curId()===idB);
  chk('changement projet : 1 bloc vivant + 0 exception', bot.state().cockpit===1 && noThrow());
  // isolation : revenir sur A garde A, et A n'a pas hérité de la vidéo de B
  await bot.tap('R0_RECENTS'); const posA=(bot.ctxRecents().projets||[]).findIndex(p=>p.projectId===projA);
  await bot.tap('R0_RE_OPEN_'+posA); chk('retour projet A : A actif (isolation)', bot.curId()===projA);
  const realVids=bot.realVideos(99)||[]; chk('isolation : la vidéo de B n\'est PAS la source de A', bot.srcFile()!==vB);

  console.log('\n   logs finaux (doit être sans THROW) : '+(noThrow()?'OK':'⚠️ '+JSON.stringify(bot.logs().filter(l=>/THROW/.test(l)))));
  console.log('RÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

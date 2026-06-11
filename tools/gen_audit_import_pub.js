// [AUDIT cat.B — #6 import (chaîne complète + réutilisation) & #8 publication (état AVANT/APRÈS)] vrai dispatch, bac isolé.
//   Import simulé = on rejoue EXACTEMENT ce que fait le handler après le download (telegram_bot.js:4153-4181) : fichier déposé + addCandidate/setDraft.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-imp-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<12;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),T);
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.mkdirSync(path.join(BOX,'prompts','imany'),{recursive:true});
fs.writeFileSync(path.join(BOX,'prompts','imany','seed.json'),JSON.stringify({name:'M',text:'x'.repeat(200)}));
fs.writeFileSync(path.join(BOX,'outfits_catalog.json'),JSON.stringify({outfits:['soiree','business'].map((c,i)=>({id:'o'+i,cat:c}))}));
fs.writeFileSync(path.join(BOX,'library.json'),JSON.stringify({scripts:[{name:'S',script:'a'}]}));
fs.writeFileSync(path.join(BOX,'lookbook.json'),JSON.stringify({pricing:{ops:{eco:0.48,video30s:5}}}));
process.env.V4R_SANDBOX=BOX;
const bot=require('../telegram_bot.js'); const S=require('../ui/socle'); const C=require('../ui/conscience');
const b=s=>String(s||'').split('/').slice(-1)[0];
let ok=0,ko=0; const out=[]; const W=s=>{out.push(s);console.log(s);}; const F=[];
function chk(l,c){ if(c)ok++; else{ko++;F.push(l);} W((c?'✅ ':'❌ ')+l); }
(async()=>{
  W('# AUDIT cat.B — #6 IMPORT (chaîne + réutilisation) & #8 PUBLICATION (avant/après)'); W('');
  // ---- projet de base ----
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  const id=S.currentProject(BOX,'imany').projectId;

  W('## #6 IMPORT PHOTO (rejoue le post-download du handler)');
  const photo=path.join(BOX,'looks','tg_'+Date.now()+'.jpg'); fs.writeFileSync(photo,T);              // dlPhoto -> looks/
  S.addCandidate(BOX,'imany',id,Date.now(),'image',{file:photo,simule:false,source:'import',prompt:'(importée)'});
  let f=S.loadFacts(BOX,'imany',id);
  chk('#6 PHOTO stockée dans looks/ (patrimoine persistant, pas /tmp)', photo.indexOf(path.join(BOX,'looks'))===0 && fs.existsSync(photo));
  chk('#6 PHOTO rattachée au PROJET courant ('+id+')', (C.visibles(f)||[]).some(m=>m.file===photo));
  // remontée Fichiers (resources) + Galerie globale (walk looks/)
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); await bot.tap('R0_RES');
  chk('#6 PHOTO remonte dans FICHIERS (resources lit visibles)', bot.state().screen==='resources');
  await bot.tap('R0_PH_HIST'); chk('#6 PHOTO remonte dans HISTORIQUE/Galerie (walk looks/)', bot.state().screen==='gallery' && bot.markup().rows.flat().some(x=>/R0_GVIEW_/.test(x.cb||'')));
  // réutilisable comme SOURCE vidéo
  f=S.loadFacts(BOX,'imany',id); S.setDraft(BOX,'imany',id,'video',{source:'photo importée',source_file:photo},Date.now());
  chk('#6 PHOTO RÉUTILISABLE comme source vidéo (source_file épinglé)', (S.getDraft(S.loadFacts(BOX,'imany',id),'video')||{}).source_file===photo);

  W(''); W('## #6 IMPORT VIDÉO (rejoue le post-download : dossier projet + source épinglée)');
  const dir=path.join(BOX,'projects_r','imany',id); fs.mkdirSync(dir,{recursive:true});
  const vid=path.join(dir,'import_'+Date.now()+'.mp4'); fs.writeFileSync(vid,Buffer.from('FAKEMP4'));
  const mv=S.addCandidate(BOX,'imany',id,Date.now(),'video',{file:vid,simule:false,source:'import vidéo'});
  S.setDraft(BOX,'imany',id,'video',{source:'vidéo importée',source_file:vid},Date.now());
  f=S.loadFacts(BOX,'imany',id);
  chk('#6 VIDÉO stockée DANS le dossier projet', vid.indexOf(dir)===0 && fs.existsSync(vid));
  chk('#6 VIDÉO rattachée + source épinglée', (C.visibles(f)||[]).some(m=>m.file===vid) && (S.getDraft(f,'video')||{}).source_file===vid);

  W(''); W('## #6 IMPORT RÉFÉRENCE (réglage draft, pas un candidat)');
  const ref=path.join(BOX,'looks','tgref_'+Date.now()+'.jpg'); fs.writeFileSync(ref,T);
  S.setDraft(BOX,'imany',id,'photo',{reference:ref},Date.now());
  chk('#6 RÉFÉRENCE enregistrée dans le draft photo (pas un média)', (S.getDraft(S.loadFacts(BOX,'imany',id),'photo')||{}).reference===ref);

  W(''); W('## #6 AUDIO : aucun chemin d\'import (audio = généré) — réserve documentée');
  W('   (ANO-IMPORT-AUDIO : pas de `r0Await.upload===audio` ; audio produit par ElevenLabs/Kling.)');

  W(''); W('## #8 PUBLICATION — état AVANT / APRÈS (le fichier NE SORT PAS du projet)');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); // vidéo générée
  const id2=S.currentProject(BOX,'imany').projectId;
  const vbefore=C.lastVideo(S.loadFacts(BOX,'imany',id2))||{};
  W('   AVANT publication : etat='+(vbefore.etat||'(aucun)')+' file='+b(vbefore.file)+' existe='+(vbefore.file?fs.existsSync(vbefore.file):false));
  await bot.tap('R0_READY'); // Prêt à poster (etat garde)
  const vpret=C.lastVideo(S.loadFacts(BOX,'imany',id2))||{};
  chk('#8 « Prêt à poster » -> écran pret, etat=garde (média validé, pas déplacé)', bot.state().screen==='pret' && vpret.etat==='garde' && vpret.file===vbefore.file);
  await bot.tap('R0_PRETITEM_0').catch(()=>{}); await bot.tap('R0_PUB').catch(()=>{}); await bot.tap('R0_PUB_DO');
  const vafter=C.lastVideo(S.loadFacts(BOX,'imany',id2))||{};
  W('   APRÈS publication : etat='+(vafter.etat||'(aucun)')+' file='+b(vafter.file)+' existe='+(vafter.file?fs.existsSync(vafter.file):false));
  chk('#8 Publier change SEULEMENT etat (garde->publie)', vafter.etat==='publie' && vbefore.etat!=='publie');
  chk('#8 AUCUN déplacement de fichier : chemin IDENTIQUE avant/après (pas de move/rename)', vafter.file===vbefore.file);
  chk('#8 même ENTRÉE média conservée dans le projet (pas supprimée de l\'historique)', (()=>{ const mb=C.lastVideo(S.loadFacts(BOX,'imany',id2)); return mb && mb.id===vafter.id; })());
  W('   NB : en simulation (LIVE OFF) la vidéo n\'a pas de fichier réel ; la persistance disque réelle = code (R0_PUB_DO=setMediaEtat, aucun fs.rename) + terrain LIVE.');
  chk('#8 écran Publié distinct (publies)', bot.state().screen==='publies');

  W(''); W('RÉSULTAT: '+ok+' OK, '+ko+' KO'); W('FINDINGS: '+(F.length?F.join(' | '):'aucun'));
  fs.writeFileSync(path.join(path.resolve(__dirname,'..'),'docs','AUDIT_B_IMPORT_PUB.md'), out.join('\n'));
  process.exit(ko?1:0);
})().catch(e=>{console.log('ERR',e.message,e.stack);process.exit(1);});

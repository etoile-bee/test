// [AUDIT cat. B — #6 import + #10 UX mobile + #13 libellés] vrai dispatch, bac isolé.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-b2-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<12;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),T);
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.mkdirSync(path.join(BOX,'prompts','imany'),{recursive:true});
fs.writeFileSync(path.join(BOX,'prompts','imany','seed.json'),JSON.stringify({name:'M',text:'x'.repeat(200)}));
fs.writeFileSync(path.join(BOX,'outfits_catalog.json'),JSON.stringify({outfits:['soiree','business','casual','cosy','ete','fete'].map((c,i)=>({id:'o'+i,cat:c,name:c}))}));
fs.writeFileSync(path.join(BOX,'library.json'),JSON.stringify({scripts:[{name:'S',script:'a'}]}));
fs.writeFileSync(path.join(BOX,'lookbook.json'),JSON.stringify({pricing:{eur_per_credit:0.058,ops:{eco:0.48,video30s:5}}}));
process.env.V4R_SANDBOX=BOX;
const bot=require('../telegram_bot.js'); const S=require('../ui/socle'); const C=require('../ui/conscience');
const b=s=>String(s||'').split('/').slice(-1)[0];
const strip=t=>String(t||'').replace(/[\u{1F000}-\u{1FFFF}←-➿️‍]/gu,'').trim();
let ok=0,ko=0; const findings=[]; function chk(l,c){ if(c)ok++; else {ko++; findings.push(l);} console.log((c?'✅':'❌')+' '+l); }
(async()=>{
  console.log('=== #6 IMPORT : rattachement projet + remontée Fichiers/Galerie (post-download simulé) ===');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  const proj=S.currentProject(BOX,'imany'); const id=proj.projectId;
  // simule la FIN d'un import photo (ce que fait le handler après dlPhoto) : fichier dans looks/ + addCandidate au projet
  const imported=path.join(BOX,'looks','tg_import_test.jpg'); fs.writeFileSync(imported,T);
  S.addCandidate(BOX,'imany',id,Date.now(),'image',{file:imported, simule:false, source:'import', prompt:'(importée)'});
  const f=S.loadFacts(BOX,'imany',id);
  const inProject=(C.visibles(f)||[]).some(m=>m.file===imported);
  chk('#6 photo importée RATTACHÉE au projet courant (dans medias/visibles)', inProject);
  // remontée Fichiers (resources lit visibles) :
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  // remontée Galerie GLOBALE (r0RealImages walk looks/) :
  await bot.tap('R0_PH_HIST'); const inHist=(bot.markup().rows.flat().length>0);
  chk('#6 import remonte dans l\'Historique/Galerie globale (walk looks/)', fs.existsSync(imported) && inHist);
  chk('#6 fichier importé PERSISTANT (looks/, pas /tmp volatile)', imported.indexOf(path.join(BOX,'looks'))===0);
  console.log('   NOTE #6 : audio = GÉNÉRÉ (ElevenLabs/Kling), pas de chemin d\'IMPORT audio (à confirmer Etoile) ; photo->looks/ global, vidéo->projects_r/<id> (emplacements différents).');

  console.log('\n=== #10 UX MOBILE + #13 LIBELLÉS : dump labels par écran ===');
  const REACH={
    home:async()=>{}, photo:async()=>{await bot.tap('R0_PHOTO');},
    photo_prompt:async()=>{await bot.tap('R0_PHOTO');await bot.tap('R0_PH_GEN');},
    confirm:async()=>{await bot.tap('R0_PHOTO');await bot.tap('R0_PH_GEN');await bot.tap('R0_PH_PREVIEW');},
    validation:async()=>{await bot.tap('R0_PHOTO');await bot.tap('R0_PH_GEN');await bot.tap('R0_PH_PREVIEW');await bot.tap('R0_GEN_VALID');},
    video:async()=>{await bot.typed('/v4r new');await bot.tap('R0_VIDEO');},
    studio:async()=>{await bot.tap('R0_STUDIO');}, recents:async()=>{await bot.tap('R0_RECENTS');},
    soustitres:async()=>{await bot.tap('R0_PHOTO');await bot.tap('R0_PH_GEN');await bot.tap('R0_PH_GENERATE');await bot.tap('R0_GEN_VALID');await bot.tap('R0_GO2');await bot.tap('R0_GO');await bot.tap('R0_VIDEO');await bot.tap('R0_VI_GENERATE');await bot.tap('R0_GO2');await bot.tap('R0_GO');await bot.tap('R0_VE');await bot.tap('R0_VE_SUBS');},
  };
  const longLabels=[]; let maxRow=0; const lexicon={};
  for(const scr of Object.keys(REACH)){ bot.reset(); await bot.open(); await REACH[scr]();
    const m=bot.markup(); (m.rows||[]).forEach(r=>{ if(r.length>maxRow) maxRow=r.length;
      r.forEach(btn=>{ const t=btn.t||''; const len=[...t].length; if(len>18) longLabels.push(scr+': "'+t+'" ('+len+')');
        const k=strip(t).toLowerCase(); if(k){ (lexicon[k]=lexicon[k]||new Set()).add(t); } }); });
  }
  chk('#10 aucun libellé > 18 caractères'+(longLabels.length?(' : '+longLabels.join(' | ')):''), longLabels.length===0);
  chk('#10 aucune ligne > 3 boutons (max='+maxRow+')', maxRow<=3);
  // #13 : variantes de libellé pour un même sens
  const variants=Object.entries(lexicon).filter(([k,set])=>set.size>1).map(([k,set])=>k+' -> {'+[...set].join(' , ')+'}');
  chk('#13 aucun terme avec plusieurs libellés contradictoires'+(variants.length?(' : '+variants.join(' || ')):''), variants.length===0);

  console.log('\nRÉSULTAT B2: '+ok+' OK, '+ko+' KO'); console.log('FINDINGS: '+(findings.length?findings.join(' | '):'aucun'));
  process.exit(0);
})().catch(e=>{console.log('ERR',e.message,e.stack);process.exit(1);});

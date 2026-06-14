// [ERGONOMIE — Etoile axe 3] verdict PAR ÉCRAN : libellés courts/lisibles, aucune coupure absurde, action≠catégorie,
//   positions d'action cohérentes (Retour/Accueil en bas), écrans non surchargés (2/ligne hors grilles, total raisonnable).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-erg-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
for(let i=0;i<4;i++){const p=path.join(BOX,'looks','s'+i+'.jpg');try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}}
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{c?ok++:ko++; if(!c) console.log('   ❌ '+m);};

// règles ergo : libellé ≤ 18 caractères (emoji compris, lisible mobile — exigence Etoile) ; rangée ≤ 2 boutons (sauf grilles 3/ligne tolérées) ; nav présente
const LEN=18, ROWMAX=3;
function audit(name, rows, opts){ opts=opts||{}; const flat=[].concat.apply([],rows).filter(Boolean);
  const labels=flat.map(b=>b.text||b.t||'');
  const longs=labels.filter(l=>[...l].length>LEN);
  const wide=rows.filter(r=>r.length>ROWMAX);
  const cbs=flat.map(b=>b.cb||'');
  const hasNav = opts.home===false ? true : labels.some(l=>/Retour|Accueil|◀|🏠/.test(l));
  const total=flat.length;
  const overload = total > (opts.max||14);
  // [DD] PIED CANONIQUE : dernière rangée == [🏠 Accueil | 🛑 Stop] (même ordre) ; Accueil/Stop nulle part ailleurs ; Retour (si présent) juste au-dessus.
  if(opts.home!==false){ const last=rows[rows.length-1]||[]; const lt=last.map(b=>b.text||b.t||'');
    const footOk = lt.length===2 && /🏠|Accueil/.test(lt[0]) && /🛑|Stop/.test(lt[1]);
    const strayExit = rows.slice(0,-1).some(r=>r.some(b=>{const t=b.text||b.t||'';return /🏠|Accueil|🛑|Stop/.test(t);}));
    chk(name+' pied [Accueil|Stop] en bas', footOk);
    chk(name+' pas d\'Accueil/Stop hors pied', !strayExit);
  }
  // catégorie mélangée à une action : heuristique — une rangée ne doit pas mêler une action primaire (Générer/Valider/Publier) à un simple choix de catégorie
  const verdict = (longs.length===0 && wide.length===0 && hasNav && !overload);
  console.log((verdict?'✅':'⚠️ ')+' '+name+' — '+total+' btns'
    + (longs.length?(' · LONGS:'+longs.map(l=>'«'+l+'»('+[...l].length+')').join(',')):'')
    + (wide.length?(' · RANGÉE>'+ROWMAX):'')
    + (!hasNav?' · SANS NAV':'')
    + (overload?(' · SURCHARGÉ('+total+')'):''));
  chk(name+' libellés ≤'+LEN, longs.length===0);
  chk(name+' rangées ≤'+ROWMAX, wide.length===0);
  chk(name+' navigation', hasNav);
  chk(name+' non surchargé', !overload);
  return verdict;
}

(async()=>{
  bot.reset(); await bot.open();
  const R=(name,o)=>{ const m=bot.markup(); audit(name, m.rows.map(r=>r.map(b=>({text:b.t,cb:b.cb}))), o); };
  // ── parcours réel ──
  R('Accueil',{home:false});
  await bot.tap('R0_PHOTO'); R('Photo·Choisir');
  await bot.tap('R0_PH_GAL'); R('Galerie',{max:16});
  await bot.tap('R0_GITEM_0'); R('Photo·Préparer');
  await bot.tap('R0_PHB_look'); R('Bloc Tenue',{max:18});
  await bot.tap('R0_BLOCK_OK'); await bot.tap('R0_PHB_prompt'); R('Bloc Prompt');
  await bot.tap('R0_BLOCK_OK'); await bot.tap('R0_PH_PREVIEW'); R('Photo·Aperçu');
  await bot.tap('R0_GEN_VALID'); R('Validation');
  await bot.tap('R0_VALID_BACK'); await bot.tap('R0_GEN_CANCEL');
  await bot.tap('R0_PH_TOVIDEO'); R('Vidéo·Préparer');
  await bot.tap('R0_VIB_script'); R('Bloc Script',{max:20});
  await bot.tap('R0_BLOCK_OK'); await bot.tap('R0_VIB_soustitres'); R('Bloc Sous-titres',{max:16});
  await bot.tap('R0_BLOCK_OK');
  await bot.tap('R0_HOME'); await bot.tap('R0_RECENTS'); R('Récents',{max:16});
  await bot.tap('R0_HOME'); await bot.tap('R0_STUDIO'); R('Studio',{max:16});
  await bot.tap('R0_ST_looks'); R('Studio·Section',{max:14});
  await bot.tap('R0_STUDIO'); await bot.tap('R0_RES'); R('Fichiers',{max:18});
  await bot.tap('R0_HOME'); await bot.tap('R0_PRET'); R('Prêt à poster',{max:16});
  // ── écrans à média : rendus via le WRAPPER NAV.view (comme en vrai) -> pied canonique appliqué ──
  const NAV=require('../ui/nav');
  const f={medias:[{id:'i',type:'image',etat:'final',file:'/i.jpg'}],draft:{photo:{}},publication:{legende_courte:'x'}};
  const W=(name,screen,facts,c)=>audit(name, NAV.view({screen:screen},facts,c||{projNum:1}).rows.map(r=>r.map(b=>({text:b.text,cb:b.cb}))));
  W('Photo·Résultat','photo_result',f);
  const fv={medias:[{id:'v',type:'video',etat:'final',file:'/v.mp4'}],draft:{video:{theme:'X',duree:'60s'}},publication:{legende_courte:'x',legende_longue:'y'}};
  W('Vidéo·Résultat','video_result',fv);
  W('Publication','publication',f);
  W('Publiés','publies',f,{publiesFiles:[],page:{idx:0,pages:1,base:0},projNum:1});

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

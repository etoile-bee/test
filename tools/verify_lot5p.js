// [VÉRIF CONSOLIDÉE LOT 5P] Rejoue les écrans RÉELS (dry-run) et imprime, par rubrique, la PREUVE (markup/texte).
//   But : montrer écran par écran que chaque demande d'Etoile est fonctionnelle ENSEMBLE sur le build terrain-lot-5p.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1'; // [HERMÉTIQUE] aucune dépendance au flag LIVE réel
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-verify-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
fs.writeFileSync(path.join(BOX,'v4r_budget.json'),JSON.stringify({tests:999,credits:480})); // ancien « quota » -> doit n'avoir aucun effet
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const BUD=require('../ui/budget');
const L=s=>console.log(s);
const cbs=()=>{const m=bot.markup();return [].concat.apply([],m.rows).map(b=>b.cb);};
const labels=()=>{const m=bot.markup();return [].concat.apply([],m.rows).map(b=>b.text);};
const cap=()=>bot.markup().caption;
const head=t=>L('\n══════ '+t+' ══════');

(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');

  head('SCRIPT — thème pilote + Voir plus + pause invisible');
  await bot.tap('R0_VIB_script');
  await bot.tap('R0_STHEME_0'); const sA=bot.draft('video').script||'';
  L('• choisir thème A -> script: "'+sA.slice(0,70)+'…"');
  await bot.tap('R0_STHEME_1'); const sB=bot.draft('video').script||'';
  L('• changer thème B -> script: "'+sB.slice(0,70)+'…"  | DIFFÉRENT de A ? '+(sA!==sB));
  await bot.tap('R0_REGEN_SCRIPT'); L('• Régénérer -> script: "'+(bot.draft('video').script||'').slice(0,70)+'…"');
  // pause invisible
  bot.seedDraft('video',{script:'Il te voit. [pause] Mais il se tait. pause Et toi tu attends.'});
  await bot.tap('R0_VIB_script');
  L('• script avec [pause]/pause -> AFFICHÉ: "'+cap().replace(/⏎/g,' ').replace(/\s+/g,' ').slice(0,90)+'"  | « pause » visible ? '+/pause/i.test(cap()));
  // Voir plus
  const HUGE='DEBUT '+Array.from({length:400},(_,i)=>'w'+i).join(' ')+' FIN_SCRIPT';
  bot.seedDraft('video',{script:HUGE}); await bot.tap('R0_VIB_script');
  L('• AVANT Voir plus: type='+bot.state().type+' capLen='+cap().length+' | FIN visible ? '+(cap().indexOf('FIN_SCRIPT')>=0)+' | bouton: '+labels().filter(t=>/Voir plus|Réduire/.test(t)));
  await bot.tap('R0_SEEMORE');
  L('• APRÈS Voir plus: type='+bot.state().type+' capLen='+cap().length+' | FIN_SCRIPT visible ? '+(cap().indexOf('FIN_SCRIPT')>=0)+' | bouton: '+labels().filter(t=>/Voir plus|Réduire/.test(t)));

  head('PROMPT — complet + Voir plus');
  await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');
  bot.seedDraft('photo',{prompt:HUGE.replace('FIN_SCRIPT','FIN_PROMPT')}); await bot.tap('R0_PHB_prompt');
  L('• AVANT: type='+bot.state().type+' | FIN visible ? '+(cap().indexOf('FIN_PROMPT')>=0)+' | '+labels().filter(t=>/Voir plus|Réduire/.test(t)));
  await bot.tap('R0_SEEMORE');
  L('• APRÈS Voir plus: capLen='+cap().length+' | FIN_PROMPT visible ? '+(cap().indexOf('FIN_PROMPT')>=0)+' | '+labels().filter(t=>/Voir plus|Réduire/.test(t)));

  head('LÉGENDES — auto depuis script + 2 blocs +# + bouton Hashtags retiré');
  bot.seedDraft('video',{script:'Les hommes toxiques adorent te faire douter. Reprends ton pouvoir aujourd’hui.'});
  bot.ensureCaptions(); const pub=bot.pub();
  L('• légende courte (auto): "'+(pub.legende_courte||'(vide)')+'"');
  L('• légende longue (auto): "'+(pub.legende_longue||'(vide)').slice(0,80)+'…"');
  L('• hashtags: "'+(pub.hashtags||'(vide)')+'"');
  L('• COPIE courte (legc) avec # fusionnés: '+/\#/.test(bot.fullText('legc')));
  await bot.tap('R0_RES'); const rcb=cbs();
  L('• Fichiers — bouton Hashtags séparé présent ? '+rcb.includes('R0_FULLTEXT_tags')+' (doit être false) | Lég courte/longue: '+rcb.includes('R0_FULLTEXT_legc')+'/'+rcb.includes('R0_FULLTEXT_legl'));

  head('FICHIERS — RAW + Lég courte/longue + Refaire vidéo + 2/ligne');
  const rv=SC.resourcesView(require('../ui/socle').loadFacts(BOX,'imany',bot.curId()),{});
  rv.rows.forEach(r=>L('   ['+r.map(b=>b.text).join(' | ')+']'));
  L('• rangées >2 boutons ? '+rv.rows.filter(r=>r.length>2).length+' (doit être 0)');

  head('SOUS-TITRES — défaut collier 0.370 + modèle défaut 1 clic');
  await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');
  await bot.tap('R0_STEDIT');
  L('• panneau: "'+cap().replace(/⏎/g,' ').replace(/\s+/g,' ').slice(0,110)+'"');
  L('• bouton « Modèle défaut » présent ? '+cbs().includes('R0_DEFSAVE')+' | défaut 0.37 mentionné ? '+/0\.37/.test(cap()));

  head('GÉNÉRATION — Générer toujours dispo, quota supprimé, coût+double-confirm');
  L('• budget exhausted (doit être false même à 999) ? '+BUD.state(BOX).exhausted);
  await bot.tap('R0_VIB_script'); await bot.tap('R0_BLOCK_OK'); // retour prépa
  await bot.tap('R0_VI_PREVIEW'); await bot.tap('R0_GEN_VALID');
  L('• Validation: "'+cap().replace(/⏎/g,' ').replace(/\s+/g,' ').slice(0,120)+'"');
  L('• Générer dispo ? '+cbs().includes('R0_GO2')+' | « Réautoriser » présent ? '+cbs().includes('R0_BUDGET_REARM')+' (doit être false) | « épuisé » ? '+/épuisé/i.test(cap()));
  await bot.tap('R0_GO2');
  L('• Confirmation: "'+cap().replace(/⏎/g,' ').replace(/\s+/g,' ').slice(0,90)+'" | Oui générer ? '+cbs().includes('R0_GO'));

  head('ERGONOMIE — Accueil 2/ligne + recherche vidéo inter-projets');
  const home=SC.homeView(require('../ui/socle').loadFacts(BOX,'imany',bot.curId()),{});
  home.rows.forEach(r=>L('   ['+r.map(b=>b.text).join(' | ')+']'));
  L('• « Trouver vidéo » (inter-projets) présent ? '+[].concat.apply([],home.rows).some(b=>b.cb==='R0_VI_HIST'));

  head('GARDE-FOUS — verrous intacts');
  const cp=require('child_process');
  const lock=cp.execSync('cd /Users/fayrouzn/wt-terrain && git diff --stat 65aff6d -- ui/subtitle_style.js ui/color_style.js 2>/dev/null || true').toString().trim();
  L('• subtitle_style.js / color_style.js modifiés depuis 65aff6d ? '+(lock?('OUI:\n'+lock):'NON (intacts)'));

  L('\n✅ Vérification consolidée terminée.');
})();

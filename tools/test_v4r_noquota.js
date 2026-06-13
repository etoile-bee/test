// [#1' PREUVE] Parcours COMPLET rejoué PLUSIEURS FOIS d'affilée (dry-run) SANS jamais être bloqué par un quota,
//   et l'écran de COÛT/CONFIRMATION s'affiche TOUJOURS avant une génération payante (garde-fou financier conservé).
//   On pré-seede même un ancien compteur « 999/… » pour prouver qu'AUCUN plafond ne ressurgit.
// [HERMÉTIQUE] aucune dépendance au flag LIVE réel (~/podcast-workflow/v4r_live) : le garde-fou « dépense réelle » est prouvé par rendu DIRECT (live:true passé à la vue),
//   et le parcours dry-run prouve l'absence de quota (en simulation). -> sweep 27/27 identique en local et en worktree de contrôle isolé.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-noquota-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
// ancien compteur « épuisé » dans l'ancien monde (10/10) -> doit n'avoir AUCUN effet
fs.writeFileSync(path.join(BOX,'v4r_budget.json'),JSON.stringify({tests:999,credits:480}));
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const BUD=require('../ui/budget'); const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=()=>{const m=bot.markup();return [].concat.apply([],m.rows).map(b=>b.cb);};
const cap=()=>bot.markup().caption;
const cbsOf=v=>[].concat.apply([],(v.rows||[])).map(b=>b.cb);

(async()=>{
  bot.reset(); await bot.open();
  chk('budget : jamais épuisé même à 999 générations (plafond supprimé)', BUD.state(BOX).exhausted===false);
  // [HERMÉTIQUE] garde-fou « dépense réelle » prouvé par rendu DIRECT (live:true), sans dépendre du flag LIVE réel :
  const estP={moteur:'Seedream',credits:8,eur:0.48,gratuit:false};
  const vLive=SC.validationView({},{confirm:{mediaKind:'photo',est:estP,live:true,budget:BUD.state(BOX)}});
  chk('PAYANT : Validation (live) affiche le COÛT + « Dépense réelle », Générer dispo, AUCUN « Réautoriser »/« épuisé »',
     /Coût/.test(vLive.caption) && /Dépense réelle/i.test(vLive.caption) && cbsOf(vLive).includes('R0_GO2') && !cbsOf(vLive).includes('R0_BUDGET_REARM') && !/épuisé/i.test(vLive.caption));
  const c2Live=SC.confirm2View({},{confirm:{mediaKind:'photo',est:estP,live:true,budget:BUD.state(BOX)}});
  chk('PAYANT : 2e confirmation (live) = Oui générer + coût, sans blocage', cbsOf(c2Live).includes('R0_GO') && /Dépense réelle/i.test(c2Live.caption) && !cbsOf(c2Live).includes('R0_BUDGET_REARM'));

  const PASSES=3; let blocked=0, validShown=0, confirmShown=0;
  for(let p=1;p<=PASSES;p++){
    // ── PARCOURS PHOTO complet jusqu'au garde-fou de dépense ──
    await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
    await bot.tap('R0_PH_VALID'); await bot.tap('R0_PH_PREVIEW');
    await bot.tap('R0_GEN_VALID'); // -> Validation chiffrée
    const onValid = bot.state().screen==='validation';
    const cValid = cap();
    const hasCost = /Coût/.test(cValid) && /(Dépense réelle|Simulation)/i.test(cValid);
    const canGen = cbs().includes('R0_GO2');
    const noBlock = !/épuisé/i.test(cValid) && !cbs().includes('R0_BUDGET_REARM');
    if(onValid && hasCost) validShown++;
    if(!noBlock) blocked++;
    chk('passe '+p+' PHOTO : Validation affiche le COÛT + Générer dispo + AUCUN blocage', onValid && hasCost && canGen && noBlock);
    await bot.tap('R0_GO2'); // -> 2e confirmation
    const onC2 = bot.state().screen==='confirm2';
    const c2ok = cbs().includes('R0_GO') && !cbs().includes('R0_BUDGET_REARM') && /(Confirmer|Dépense)/i.test(cap());
    if(onC2 && c2ok) confirmShown++;
    chk('passe '+p+' PHOTO : 2e confirmation (Oui/Annuler) AVANT dépense, sans blocage', onC2 && c2ok);
    await bot.tap('R0_GO2_CANCEL'); // on annule (on ne dépense pas en test)

    // ── PARCOURS VIDÉO complet jusqu'au garde-fou de dépense ──
    await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
    await bot.tap('R0_VI_VALID'); await bot.tap('R0_VI_PREVIEW');
    await bot.tap('R0_GEN_VALID');
    const vValid = bot.state().screen==='validation';
    const vCost = /Coût/.test(cap());
    const vGen = cbs().includes('R0_GO2');
    const vNoBlock = !/épuisé/i.test(cap()) && !cbs().includes('R0_BUDGET_REARM');
    chk('passe '+p+' VIDÉO : Validation affiche le COÛT + Générer dispo + AUCUN blocage', vValid && vCost && vGen && vNoBlock);
    if(vValid && vCost) validShown++;
    if(!vNoBlock) blocked++;
    await bot.tap('R0_GO2'); await bot.tap('R0_GO2_CANCEL');

    // ── enchaînement libre Scripts/Sous-titres/Légendes/Fichiers/Reprise sans blocage ──
    await bot.tap('R0_RES');           // Fichiers
    await bot.tap('R0_LEGENDS');       // Légendes
    await bot.typed('/v4r');           // Reprise
    chk('passe '+p+' : enchaînement Fichiers/Légendes/Reprise sans aucun blocage de compteur', !/épuisé|réautoris/i.test(cap()));
  }

  chk('GLOBAL : '+PASSES+' passes × (photo+vidéo) -> ZÉRO blocage de quota', blocked===0);
  chk('GLOBAL : l\'écran de coût/Validation s\'est affiché à CHAQUE génération payante ('+validShown+'/'+(PASSES*2)+')', validShown===PASSES*2);
  chk('GLOBAL : la double-confirmation (garde-fou) s\'est affichée à chaque passe photo ('+confirmShown+'/'+PASSES+')', confirmShown===PASSES);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

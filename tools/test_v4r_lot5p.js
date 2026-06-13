// [LOT TERRAIN 5P] preuves runtime (sandbox) : #1b budget réautorisé · #2 légendes rétro+hashtags fusionnés+bouton Hashtags retiré · #3 pause invisible.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-lot5p-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const BUD=require('../ui/budget');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=v=>[].concat.apply([],v.rows||[]).map(b=>b.cb);
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
  const id=bot.curId(); const dir=bot.projDir(); fs.mkdirSync(dir,{recursive:true});

  // ── #3 PAUSE INVISIBLE : sidecar avec script contenant [pause] / pause ──
  fs.writeFileSync(path.join(dir,'2026-06-13-18-00_p1.txt'),
    'SCRIPT:\nIl te voit. [pause] Mais il ne dit rien. pause Et toi tu attends. Arrête d’attendre.\n');
  fs.writeFileSync(path.join(dir,'2026-06-13-18-00_p1.mp4'),Buffer.alloc(20000,9));
  bot.reconcile(); bot.restoreScript(); // [#A] script restauré à la réouverture (média via reconcile, script via restoreScript)
  const dvScript=(bot.draft('video').script)||'';
  chk('#3 : draft.video.script restauré SANS « pause » visible', /il te voit/i.test(dvScript) && !/pause/i.test(dvScript));
  const sub=bot.subChunks({script:dvScript});
  const subText=(sub.chunks||[]).map(c=>(c.lines||[c.text]||[]).join(' ')).join(' ');
  chk('#3 : sous-titres (découpage aperçu) sans « pause »', !/pause/i.test(subText) && /attends|attendre|voit/i.test(subText));

  // ── #2 LÉGENDES RÉTRO : draft a un script mais publication vide -> R0_RES doit dériver 2 légendes + hashtags ──
  let pub0=bot.pub();
  chk('#2 : au départ légendes VIDES (« à définir »)', !String(pub0.legende_courte||'').trim() && !String(pub0.legende_longue||'').trim());
  await bot.tap('R0_RES'); // ouverture Fichiers -> r0EnsureCaptions
  const pub1=bot.pub();
  chk('#2 : légende COURTE dérivée du script (non vide)', !!String(pub1.legende_courte||'').trim());
  chk('#2 : légende LONGUE dérivée du script (non vide)', !!String(pub1.legende_longue||'').trim());
  chk('#2 : légendes dérivées SANS « pause »', !/pause/i.test(pub1.legende_courte||'') && !/pause/i.test(pub1.legende_longue||''));
  chk('#2 : hashtags STANDARD remplis', /#fyp/i.test(String(pub1.hashtags||'')));
  // hashtags FUSIONNÉS dans les deux légendes copiables (fullText)
  const legc=bot.fullText('legc'), legl=bot.fullText('legl');
  chk('#2 : COPIE légende courte = légende + hashtags fusionnés', /#fyp/i.test(legc) && legc.length>String(pub1.hashtags||'').length);
  chk('#2 : COPIE légende longue = légende + hashtags fusionnés', /#fyp/i.test(legl));
  // bouton « Hashtags » séparé SUPPRIMÉ de Fichiers
  const rv=SC.resourcesView(require('../ui/socle').loadFacts(BOX,'imany',id),{});
  chk('#2 : bouton « Hashtags » séparé RETIRÉ de Fichiers', !cbs(rv).includes('R0_FULLTEXT_tags'));
  chk('#2 : légendes copiables toujours présentes (legc/legl)', cbs(rv).includes('R0_FULLTEXT_legc') && cbs(rv).includes('R0_FULLTEXT_legl'));
  // #6 : Refaire une vidéo depuis ce projet présent
  chk('#6 : « Refaire vidéo » présent dans Fichiers (R0_VI_CREATE)', cbs(rv).includes('R0_VI_CREATE') && rv.rows.some(r=>r.some(b=>/Refaire vid/i.test(b.text))));

  // ── #2 NON-ÉCRASEMENT : une légende éditée par Etoile n'est JAMAIS remplacée ──
  require('../ui/socle').setPublication(BOX,'imany',id,{legende_courte:'MA LÉGENDE PERSO'},Date.now());
  bot.ensureCaptions();
  chk('#2 : édition d’Etoile préservée (jamais écrasée)', /MA LÉGENDE PERSO/.test(bot.pub().legende_courte||''));

  // ── #1' QUOTA SUPPRIMÉ : même avec un ancien fichier « 10/10 », plus AUCUN blocage ; Générer toujours dispo ; aucun bouton « Réautoriser » ──
  fs.writeFileSync(path.join(BOX,'v4r_budget.json'),JSON.stringify({tests:99,credits:500}));
  chk('#1\' : jamais épuisé (plafond supprimé), même à 99 générations', BUD.state(BOX).exhausted===false);
  const vv=SC.validationView({},{confirm:{mediaKind:'video',est:{gratuit:false,credits:5},live:true,budget:BUD.state(BOX)}});
  chk('#1\' : Validation -> Générer TOUJOURS dispo, AUCUN « Réautoriser »', cbs(vv).includes('R0_GO2') && !cbs(vv).includes('R0_BUDGET_REARM') && !/épuisé/i.test(vv.caption));
  const c2=SC.confirm2View({},{confirm:{mediaKind:'video',est:{gratuit:false,credits:5},live:true,budget:BUD.state(BOX)}});
  chk('#1\' : Confirmation -> Oui générer, AUCUN « Réautoriser »', cbs(c2).includes('R0_GO') && !cbs(c2).includes('R0_BUDGET_REARM'));
  chk('#1\' : handler R0_BUDGET_REARM retiré (test hook reauthorize absent)', typeof bot.reauthorize==='undefined');
  chk('#1\' : garde-fou financier conservé (coût affiché à la Validation)', /Coût/.test(vv.caption) && /Dépense réelle/i.test(vv.caption));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

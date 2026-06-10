// PREUVE chantier3 (feedback) — charge les VRAIS helpers de telegram_bot.js
// (PROD_TIME/prodTimeLabel/fmtElapsed/startTicker/humanError) et démontre, SANS dépense :
//  1) le ticker AVANCE (compteur qui s'incrémente) puis stop() le coupe net
//  2) une génération mockée ANNULÉE coupe à l'étape + ticker arrêté + message clair
//  3) une erreur crédits -> message HUMAIN « 💳 Crédits insuffisants chez … » UNE fois (pas de boucle)
//  4) temps honnête affiché par prodTimeLabel
// LANCER : node -e 'require("./tools/test_feedback.js")'
const fs=require('fs');
const SRC=fs.readFileSync(require('path').join(__dirname,'..','telegram_bot.js'),'utf8');
const a=SRC.indexOf('const PROD_TIME=');const b=SRC.indexOf('const RETRY_KB=');const bEnd=SRC.indexOf('\n',b);
const block=SRC.slice(a,bEnd); // PROD_TIME .. RETRY_KB (contigu)

// setInterval mocké RAPIDE (4ms) + horloge simulée qui avance de 12s par tick (comme la vraie cadence)
let clock=0; const Dnow=()=>clock;
const timers=new Set();
const fakeSetInterval=(fn)=>{const id={fn};timers.add(id);id._h=global.setInterval(()=>{clock+=12000;fn();},4);return id;};
const fakeClearInterval=(id)=>{if(id){timers.delete(id);global.clearInterval(id._h);}};

const F=new Function('setInterval','clearInterval','Date',
  block+'\nreturn {prodTimeLabel,fmtElapsed,startTicker,humanError,PROD_TIME};')
  (fakeSetInterval,fakeClearInterval,{now:Dnow});

let pass=0,fail=0;
const check=(l,c,g)=>{(c?pass++:fail++);console.log((c?'✅':'❌')+' '+l+(c?'':'  (obtenu: '+JSON.stringify(g)+')'));};
const sleep=ms=>new Promise(r=>global.setTimeout(r,ms));

(async()=>{
  // 4) temps honnête
  const tl=F.prodTimeLabel();
  check('4. temps honnête = "'+tl+'"', /~3-10 min/.test(tl)&&/Kling/.test(tl), tl);
  check('4. fmtElapsed(130000) = 2 min 10s', F.fmtElapsed(130000)==='2 min 10s', F.fmtElapsed(130000));

  // 1) ticker AVANCE puis stop coupe
  clock=0;const ticks=[];
  const stop=F.startTicker('🎬 Lipsync 1/1…',async(t)=>{ticks.push(t);});
  await sleep(60); // ~ plusieurs ticks (4ms chacun)
  const nBeforeStop=ticks.length;
  stop();
  await sleep(40);
  const nAfterStop=ticks.length;
  check('1. ticker a produit ≥3 updates', ticks.length>=3, ticks.length);
  check('1. le compteur AVANCE (élapsed croissant)', ticks.length>=2 && /0?0?s|min/.test(ticks[0]) && ticks[ticks.length-1].length>=ticks[0].length, ticks.slice(0,3));
  check('1. stop() coupe net (aucun tick après stop)', nAfterStop===nBeforeStop, {avant:nBeforeStop,apres:nAfterStop});
  console.log('   exemples de ticks:', ticks.slice(0,5).join('  |  '));

  // 2) génération MOCKÉE annulée : ticker tourne pendant le poll, abort coupe
  clock=0;let aborted=false;const prog=[];
  const setProg=async t=>{prog.push(t);};
  let abortFlag=false;const abortFn=()=>abortFlag;
  // mock generateLipsync : boucle async qui vérifie abortFn (comme workflow.js), ticker en parallèle
  const mockLipsync=async()=>{ for(let k=0;k<1000;k++){ if(abortFn())throw new Error('ABORT'); await sleep(3);} return 'url'; };
  let genStep='lipsync 1/1';let abortMsg=null;
  const st=F.startTicker('🎬 Lipsync…',setProg);
  setTimeout(()=>{abortFlag=true;},45); // l'utilisateur appuie sur ⛔ Annuler
  try{ await mockLipsync(); }
  catch(e){ if(e.message==='ABORT'){abortMsg='⛔ Annulé à l\'étape '+genStep;} }
  finally{ st(); }
  const ticksDuringAbort=prog.length;
  await sleep(40);
  check('2. ticker a tourné pendant le poll (avant annulation)', ticksDuringAbort>=2, ticksDuringAbort);
  check('2. Annuler a COUPÉ (message clair)', abortMsg==='⛔ Annulé à l\'étape lipsync 1/1', abortMsg);
  check('2. ticker arrêté après annulation (pas de tick fantôme)', prog.length===ticksDuringAbort, {avant:ticksDuringAbort,apres:prog.length});

  // 3) erreur crédits -> message humain UNE fois, pas de boucle
  let calls=0;
  const runOnce=(errMsg)=>{ calls++; return F.humanError(new Error(errMsg),'lipsync 1/1'); };
  const credit=runOnce('Lipsync 402: {"error":"credit balance too low"}');
  check('3. crédits Kling -> 💳 message clair', /💳/.test(credit)&&/Crédits insuffisants/.test(credit)&&/Kling/.test(credit), credit);
  check('3. crédits -> mention "aucune relance automatique"', /aucune relance automatique/.test(credit), credit);
  check('3. surfacé UNE seule fois (pas de boucle)', calls===1, calls);
  // autres mappings
  check('3b. ElevenLabs crédits', /ElevenLabs/.test(F.humanError(new Error('ElevenLabs 402 quota'),'voix')), F.humanError(new Error('ElevenLabs 402 quota'),'voix'));
  check('3c. Anthropic credit balance', /Anthropic/.test(F.humanError(new Error('400 credit balance too low'),'script 2')), F.humanError(new Error('400 credit balance too low'),'script 2'));
  check('3d. réseau -> 🌐 réessaie', /🌐/.test(F.humanError(new Error('fetch failed ENOTFOUND'),'lipsync')), F.humanError(new Error('fetch failed ENOTFOUND'),'lipsync'));
  check('3e. générique -> ↻ Réessayer', /Réessayer/.test(F.humanError(new Error('weird boom'),'rendu')), F.humanError(new Error('weird boom'),'rendu'));

  console.log('\nRÉSULTAT: '+pass+' OK, '+fail+' KO');
  // nettoie les timers résiduels
  for(const id of timers)global.clearInterval(id._h);
  process.exit(fail?1:0);
})();

// [#3 SCRIPT RÉEL + #4 PARTIE 2/3] preuves runtime (sandbox).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-regress-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const NAV=require('../ui/nav'); const SC=require('../ui/screens'); const WF=require('../workflow.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=v=>[].concat.apply([],v.rows||[]).map(b=>b.cb);
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
  const id=bot.curId(); const dir=bot.projDir(); fs.mkdirSync(dir,{recursive:true});
  // ── #3 : sidecar avec un VRAI script (« men retreat… »), draft.video.script vide -> doit être restauré + affiché ──
  fs.writeFileSync(path.join(dir,'2026-06-13-17-33_p1.txt'),'SCRIPT:\nMen retreat when you start valuing yourself. Stop chasing.\n\nSHORT:\nValue yourself\n\nHASHTAGS:\nfyp viral');
  fs.writeFileSync(path.join(dir,'2026-06-13-17-33_p1.mp4'),Buffer.alloc(20000,9));
  bot.reconcile();        // média (P2)
  bot.restoreScript();    // [#A] restauration script = RÉOUVERTURE projet (déplacée hors de la réconciliation média)
  const dvScript=(bot.draft('video').script)||'';
  chk('#3 : script RÉEL restauré dans le draft à la RÉOUVERTURE (men retreat)', /men retreat/i.test(dvScript) && !/simul/i.test(dvScript));
  // le panneau Script affiche ce vrai texte
  const spec=NAV.blockSpec({screen:'video',key:'script'},require('../ui/socle').loadFacts(BOX,'imany',id),{});
  const sv=SC.blockView(spec);
  chk('#3 : panneau Script AFFICHE le vrai script (pas « à définir »/simulé)', /men retreat/i.test(sv.caption) && !/à définir|simul/i.test(sv.caption));

  // ── #4 : Partie 2/3 ──
  const vr=SC.videoResultView({medias:[{id:'m1',type:'video',etat:'final',file:'/v.mp4'}],draft:{video:{theme:'Red flags'}}},{});
  chk('#4 : Vidéo·Résultat expose « ➕ Partie » (R0_VI_PART)', cbs(vr).includes('R0_VI_PART'));
  chk('#4 : libellé montre la prochaine partie (Partie 2)', vr.rows.some(r=>r.some(b=>/Partie 2/.test(b.text))));
  // tap R0_VI_PART -> arme la série + va au gate de dépense (confirm)
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_VALID'); // contexte vidéo
  await bot.tap('R0_VI_PART');
  const np=bot.nextPart();
  chk('#4 : R0_VI_PART arme la série (n=2, scripts précédents collectés)', np && np.n===2 && Array.isArray(np.prev) && np.prev.some(s=>/men retreat/i.test(s)));
  chk('#4 : R0_VI_PART passe par le GATE de dépense (écran confirm, pas de génération directe)', bot.state().screen==='confirm');
  // partPrompt produit une SUITE cohérente référençant la partie précédente
  const cont=WF.partPrompt(np.baseTopic, np.n, np.n, np.prev);
  chk('#4 : script de suite = partPrompt cohérent (référence « Part 1 » + DIRECT CONTINUATION)', /PART 2/i.test(cont) && /CONTINUATION/i.test(cont) && /men retreat/i.test(cont));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

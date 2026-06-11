// [AUDIT TRANSVERSAL — catégorie B] contrôles vérifiables par le VRAI dispatch en bac ISOLÉ (LIVE OFF).
//   #1 identité projet stable · #2 source de vérité cohérente · #4 ZÉRO dépense sur nav/aperçu/retour/restart/régén · #5 isolation (rien écrit dans la vraie base).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const REALHOME=path.join(os.homedir(),'podcast-workflow');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-tx-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<12;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),T);
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.mkdirSync(path.join(BOX,'prompts','imany'),{recursive:true});
fs.writeFileSync(path.join(BOX,'prompts','imany','seed.json'),JSON.stringify({name:'M',text:'x'.repeat(200)}));
fs.writeFileSync(path.join(BOX,'outfits_catalog.json'),JSON.stringify({outfits:['soiree','business','casual','cosy','ete','fete'].map((c,i)=>({id:'o'+i,cat:c,name:c}))}));
fs.writeFileSync(path.join(BOX,'library.json'),JSON.stringify({scripts:[{name:'S',script:'a'}]}));
fs.writeFileSync(path.join(BOX,'lookbook.json'),JSON.stringify({pricing:{eur_per_credit:0.058,ops:{eco:0.48,video30s:5}}}));
process.env.V4R_SANDBOX=BOX;
const bot=require('../telegram_bot.js');
const ENG=require('../ui/engines'); const BUD=require('../ui/budget'); const S=require('../ui/socle');
const b=s=>String(s||'').split('/').slice(-1)[0];
let ok=0,ko=0; const findings=[];
function chk(l,c){ if(c){ok++;}else{ko++;findings.push(l);} console.log((c?'✅':'❌')+' '+l); }
const realProjBefore = (()=>{ try{ return S.listProjects(REALHOME,'imany').length; }catch(e){ return 'n/a'; } })();
(async()=>{
  console.log('=== #5 ISOLATION : BASE = bac temporaire, pas la vraie base ===');
  chk('#5 V4R_SANDBOX pointe le bac tmp (pas '+REALHOME+')', process.env.V4R_SANDBOX===BOX && BOX.indexOf(os.tmpdir())===0);
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  const proj=S.currentProject(BOX,'imany'); const id=proj&&proj.projectId;
  chk('#5 le projet créé vit DANS le bac ('+b(BOX)+'), facts.json présent', !!id && fs.existsSync(path.join(BOX,'projects_r','imany',id,'facts.json')));
  const realProjAfter=(()=>{ try{ return S.listProjects(REALHOME,'imany').length; }catch(e){ return 'n/a'; } })();
  chk('#5 la VRAIE base projects_r est INCHANGÉE par le test ('+realProjBefore+' -> '+realProjAfter+')', String(realProjBefore)===String(realProjAfter));

  console.log('\n=== #1 IDENTITÉ PROJET : id stable sur tout le parcours ===');
  const ids=[]; const snap=()=>{ const p=S.currentProject(BOX,'imany'); ids.push(p&&p.projectId); };
  snap(); await bot.tap('R0_VIDEO'); snap(); await bot.tap('R0_VI_PREVIEW'); snap(); await bot.tap('R0_VALID_BACK').catch(()=>{}); snap();
  await bot.open(); snap(); await bot.restart(); snap();
  chk('#1 projectId STABLE sur Vidéo/Aperçu/Retour/v4r/restart (jamais ambigu) : '+JSON.stringify([...new Set(ids)]), new Set(ids.filter(Boolean)).size===1);

  console.log('\n=== #2 SOURCE DE VÉRITÉ : cover/source cohérente entre écrans ===');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  const c1=bot.cover(); await bot.tap('R0_PH_TOVIDEO'); const c2=bot.cover(); await bot.tap('R0_VE'); const c3=bot.cover();
  chk('#2 cover identique Préparer→Vidéo→Montage ('+b(c1)+')', c1&&c1===c2&&c2===c3);

  console.log('\n=== #4 ZÉRO DÉPENSE : aucun moteur réel sur nav/aperçu/retour/restart/régén ===');
  chk('#4 LIVE OFF en test : liveFor(photo)=false ET liveFor(video)=false', ENG.liveFor('photo')===false && ENG.liveFor('video')===false);
  const budBefore=BUD.state(BOX).tests||0;
  bot.reset(); await bot.open();
  for(const d of ['R0_PHOTO','R0_PH_GEN','R0_PH_PREVIEW','R0_GEN_CANCEL','R0_PH_PREVIEW','R0_GEN_VALID','R0_VALID_BACK','R0_PHB_prompt','R0_LOADP_0','R0_BLOCK_OK','R0_HOME']) { await bot.tap(d).catch(()=>{}); }
  await bot.open(); await bot.restart();
  // régénération NON confirmée (script) : ne doit RIEN dépenser
  await bot.tap('R0_PHOTO').catch(()=>{}); await bot.tap('R0_PH_GEN').catch(()=>{}); await bot.tap('R0_VIDEO').catch(()=>{}); await bot.tap('R0_REGEN_SCRIPT').catch(()=>{});
  const budAfter=BUD.state(BOX).tests||0;
  chk('#4 compteur de tests réels INCHANGÉ après nav/aperçu/retour/restart/régén ('+budBefore+' -> '+budAfter+')', budBefore===budAfter);

  console.log('\nRÉSULTAT TRANSVERSAL: '+ok+' OK, '+ko+' KO');
  if(findings.length) console.log('RUPTURES: '+findings.join(' | ')); else console.log('RUPTURES: aucune');
  process.exit(ko?1:0);
})().catch(e=>{console.log('ERR',e.message,e.stack);process.exit(1);});

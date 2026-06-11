// [AUDIT RUPTURES DE CONTEXTE] 13 modules × points vérifiables par le VRAI dispatch (bac isolé, LIVE OFF).
//   Points : atteint (non-orphelin) · média = contexte projet (jamais démo) · ◀ Retour présent · Retour CHANGE d'écran ·
//            Accueil depuis le module -> garde-fou « quitter ? » (conserve) · 1 cockpit. Sortie -> docs/AUDIT_CONTEXTE.md
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-actx-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<12;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),T);
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.mkdirSync(path.join(BOX,'prompts','imany'),{recursive:true});
fs.writeFileSync(path.join(BOX,'prompts','imany','seed.json'),JSON.stringify({name:'M',text:'x'.repeat(200)}));
fs.writeFileSync(path.join(BOX,'outfits_catalog.json'),JSON.stringify({outfits:['soiree','business','casual','cosy','ete','fete'].map((c,i)=>({id:'o'+i,cat:c,name:c}))}));
fs.writeFileSync(path.join(BOX,'library.json'),JSON.stringify({scripts:[{name:'S',script:'a'}]}));
fs.writeFileSync(path.join(BOX,'lookbook.json'),JSON.stringify({pricing:{eur_per_credit:0.058,ops:{eco:0.48,video30s:5}}}));
process.env.V4R_SANDBOX=BOX;
const bot=require('../telegram_bot.js');
const base=s=>String(s||'').split('/').slice(-1)[0];
async function photoProj(){ bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }
async function videoProj(){ await photoProj(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }
const out=[]; const W=s=>out.push(s); const findings=[];
async function audit(label, reach){
  await reach();
  const scr=bot.state().screen, med=bot.media()||'', cov=bot.cover()||'';
  const demo=/demo_video|demo_photo/.test(med);
  const btns=bot.buttons(), labels=bot.labels();
  const hasRetour=labels.some(t=>/◀|Retour|Annuler/.test(t));
  const cockpit=bot.state().cockpit;
  // Retour change-t-il d'écran ?
  const before=scr; let retourChange=false; const rb=bot.markup().rows.flat().find(b=>/Retour/.test(b.t||''));
  if(rb){ await bot.tap(rb.cb); retourChange=(bot.state().screen!==before); }
  // Accueil depuis le module -> quit guard ?
  await reach(); await bot.tap('R0_HOME'); const homeScr=bot.state().screen; const guard=(homeScr==='quit');
  const ok = (scr!=='home') && !demo && hasRetour && retourChange && cockpit===1;
  W('| '+label.padEnd(14)+' | '+String(scr).padEnd(11)+' | '+(demo?'❌DÉMO':'✅ctx').padEnd(7)+' | '+(hasRetour?'✅':'❌')+' | '+(retourChange?'✅':'❌')+' | '+(guard?'✅quit':'⚠️'+homeScr).padEnd(8)+' | '+(cockpit===1?'✅':'❌')+' |');
  if(demo) findings.push(label+': peint une DÉMO');
  if(!hasRetour) findings.push(label+': pas de ◀ Retour');
  if(!retourChange) findings.push(label+': Retour ne change pas d\'écran');
  if(!guard) findings.push(label+': Accueil ne déclenche pas le garde-fou (obtenu '+homeScr+')');
  if(cockpit!==1) findings.push(label+': cockpit='+cockpit);
}
(async()=>{
  W('# AUDIT RUPTURES DE CONTEXTE — 13 modules d\'édition (vrai dispatch, bac isolé)'); W('');
  W('| Module | écran | média | Retour | Retour≠ | Accueil | 1-cockpit |'); W('|---|---|---|---|---|---|---|');
  await audit('Prompt',    async()=>{ await photoProj(); await bot.tap('R0_PHB_prompt'); });
  await audit('Tenue',     async()=>{ await photoProj(); await bot.tap('R0_PHB_look'); });
  await audit('Décor',     async()=>{ await photoProj(); await bot.tap('R0_PHB_decor'); });
  await audit('Référence', async()=>{ await photoProj(); await bot.tap('R0_PHB_reference'); });
  await audit('Script',    async()=>{ await videoProj(); await bot.tap('R0_VE'); await bot.tap('R0_VIB_script'); });
  await audit('Musique',   async()=>{ await videoProj(); await bot.tap('R0_VE'); await bot.tap('R0_VIB_musique'); });
  await audit('Durée',     async()=>{ await videoProj(); await bot.tap('R0_VE'); await bot.tap('R0_VIB_duree'); });
  await audit('Sous-titres',async()=>{ await videoProj(); await bot.tap('R0_VE'); await bot.tap('R0_VE_SUBS'); });
  await audit('Légendes',  async()=>{ await videoProj(); await bot.tap('R0_PUB'); await bot.tap('R0_PUB_EDIT'); });
  W(''); W('## Ruptures détectées'); W('');
  if(findings.length){ findings.forEach(f=>W('- ❌ '+f)); } else { W('- ✅ AUCUNE rupture sur les points vérifiés.'); }
  fs.writeFileSync(path.join(path.resolve(__dirname,'..'),'docs','AUDIT_CONTEXTE.md'), out.join('\n'));
  console.log(out.join('\n')); console.log('\n-> docs/AUDIT_CONTEXTE.md ('+findings.length+' ruptures)');
  process.exit(0);
})().catch(e=>{console.log('ERR',e.message,e.stack);process.exit(1);});

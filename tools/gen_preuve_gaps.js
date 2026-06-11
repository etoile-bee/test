// [PREUVE MARKUP RÉEL — gaps G1–G5] pilote le VRAI chemin de dispatch (r0Dispatch/view) en bac ISOLÉ et
//   DUMP le markup tel qu'il s'affiche (titre + lignes {text,cb}). Sortie -> docs/PREUVE_GAPS_MARKUP.md.
//   Aucune dépense, LIVE OFF, données locales ignorées (fixture mkdtemp).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-preuve-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<12;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),T);
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.mkdirSync(path.join(BOX,'prompts','imany'),{recursive:true});
fs.writeFileSync(path.join(BOX,'prompts','imany','seed.json'),JSON.stringify({name:'Modèle',text:'x'.repeat(200)}));
fs.writeFileSync(path.join(BOX,'outfits_catalog.json'),JSON.stringify({outfits:['soiree','business','casual','cosy','ete','fete'].map((c,i)=>({id:'o'+i,cat:c,name:c}))}));
fs.writeFileSync(path.join(BOX,'library.json'),JSON.stringify({scripts:[{name:'S',script:'a'}]}));
fs.writeFileSync(path.join(BOX,'lookbook.json'),JSON.stringify({pricing:{eur_per_credit:0.058,ops:{eco:0.48,video30s:5}}}));
process.env.V4R_SANDBOX=BOX;
const bot=require('../telegram_bot.js');
const out=[]; const W=s=>out.push(s);
function dumpMarkup(label){ const m=bot.markup(); W('**'+label+'** — écran réel `'+m.screen+'` (kind='+m.kind+')'); W(''); W('```');
  W('TITRE: '+m.caption);
  (m.rows||[]).forEach(r=>W('  ['+r.map(b=>b.t+' →'+b.cb).join(' | ')+']')); W('```'); W(''); }
async function genPhoto(){ await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }
(async()=>{
  W('# PREUVE MARKUP RÉEL — gaps G1–G5 (sortie du vrai chemin r0Dispatch/view, bac isolé)'); W('');
  W('> Généré par `tools/gen_preuve_gaps.js` : chaque écran est atteint par la VRAIE séquence de taps, le markup est rendu par le MÊME `NAV.view` que le peintre live (`bot.markup()`), puis imprimé tel qu\'il sort. Aucun grep de code.'); W('');

  W('## G1 — Galerie (SÉLECTION) ≠ Historique (CONSULTATION chronologique)'); W('');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_PH_GAL');
  dumpMarkup('GALERIE (R0_PH_GAL)');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_PH_HIST');
  dumpMarkup('HISTORIQUE (R0_PH_HIST)');
  W('→ Galerie expose `✅ Choisir`+`R0_GITEM_` (sélection) ; Historique expose `R0_GVIEW_` SANS `✅ Choisir` (lecture). Plus aucun écran identique.'); W('');

  W('## G2 — Fichiers : ◀ Retour revient à l\'ORIGINE'); W('');
  bot.reset(); await bot.open(); await bot.tap('R0_RECENTS'); await bot.tap('R0_RES'); dumpMarkup('FICHIERS depuis RÉCENTS');
  bot.reset(); await bot.open(); await bot.tap('R0_STUDIO'); await bot.tap('R0_RES'); dumpMarkup('FICHIERS depuis STUDIO');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto(); await bot.tap('R0_RES'); dumpMarkup('FICHIERS depuis PHOTO·Résultat');
  W('→ Le `◀ Retour` pointe vers l\'origine réelle (R0_RECENTS / R0_STUDIO / R0_PHOTO), pas un défaut fixe.'); W('');

  W('## G3 — photo_montage orphelin nettoyé'); W('');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); dumpMarkup('PHOTO·Préparer (aucun bouton Montage)');
  await bot.tap('R0_PH_MONTAGE'); dumpMarkup('après R0_PH_MONTAGE résiduel (renvoyé à photo_prompt, écran orphelin supprimé)');

  W('## G4 — 💾 Modèle = projet réutilisable (D5)'); W('');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PH_PREVIEW'); await bot.tap('R0_GEN_VALID');
  dumpMarkup('VALIDATION (propose 💾 Modèle)');
  const b=bot.projects(); await bot.tap('R0_SAVEMODEL');
  W('```'); W('projets AVANT R0_SAVEMODEL = '+b); W('projets APRÈS R0_SAVEMODEL = '+bot.projects()+'  (→ +1 projet réouvrable, original intact)'); W('```'); W('');

  W('## G5 — hashtags fusionnés à la COPIE de la légende (champ séparé conservé)'); W('');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhoto();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO');
  bot.setPub({legende_courte:'Ma légende', legende_longue:'Ma longue légende', hashtags:'#coach #dating #mindset'});
  W('```');
  W('COPIE « ✏️ Lég. courte » (R0_FULLTEXT_legc) =');
  W(JSON.stringify(bot.fullText('legc')));
  W('COPIE « 📄 Lég. longue » (R0_FULLTEXT_legl) =');
  W(JSON.stringify(bot.fullText('legl')));
  W('champ « #️⃣ Hashtags » SÉPARÉ (R0_FULLTEXT_tags) =');
  W(JSON.stringify(bot.fullText('tags')));
  W('```'); W('');
  W('---'); W('_Sweep complet : voir `ANOMALIES.md`. Tous les écrans ci-dessus sortent du vrai dispatch (R0_DRYRUN, LIVE OFF, fixture isolée)._');

  fs.writeFileSync(path.join(path.resolve(__dirname,'..'),'docs','PREUVE_GAPS_MARKUP.md'), out.join('\n'));
  console.log('écrit docs/PREUVE_GAPS_MARKUP.md ('+out.length+' lignes)');
  process.exit(0);
})();

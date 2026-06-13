// [AUDIT PARCOURS — 6 QUESTIONS UTILISATEUR] Rejoue le parcours COMPLET (dry-run) et évalue, écran par écran :
//  Q1 Je sais où je suis ?  Q2 Je sais quelle photo est active ?  Q3 Je comprends ce qui se passe si je clique ?
//  Q4 Je peux revenir sans perdre mon travail ?  Q5 Je retrouve facilement mes fichiers ?  Q6 Je peux publier le média généré ?
//  ✓ = conforme · n/a = non applicable à cet écran · ✗ = ÉCART (non conforme).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1'; // [HERMÉTIQUE] pas de dépendance au flag LIVE réel — l'audit vérifie la structure des écrans, pas l'état moteur
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-audit-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
const cap=()=>bot.markup().caption||''; const cbs=()=>bot.buttons()||[];
const labels=()=>bot.labels()||[];

let ecarts=0; const ROWS=[];
// applic : {q2,q5,q6} = 'req' (requis) | 'na' (non applicable). Q1/Q3/Q4 toujours requis.
function audit(name, applic){
  applic=applic||{};
  const c=cap(), B=cbs(), L=labels();
  const q1 = /[📸🎬🏠🗂📤🕘🛠🔤🖼✅✨🎨📦🔎]/.test(c) && c.replace(/<[^>]+>/g,'').trim().length>3; // titre/contexte lisible
  const q2req = applic.q2==='req';
  const q2 = q2req ? /Source active/.test(c) : 'na';
  const q3 = L.length>0 && L.every(t=>t && t.trim().length>0 && !/^R0_/.test(t)); // libellés lisibles (jamais un cb brut)
  const q4 = B.includes('R0_HOME') || B.some(x=>/BACK|RETOUR|RETURN|CANCEL|PHOTO$|VIDEO$|VI_CREATE|VI_RESULT|VALID_BACK|RESUME_HOME|STUDIO/.test(x)) || L.some(t=>/Retour|Accueil|Annuler/.test(t));
  const q5req = applic.q5!=='na';
  // Q5 : fichiers retrouvables — soit un bouton direct (Fichiers/Historique/Récents), soit l'Accueil (passerelle universelle ≤2 taps vers Récents/Fichiers).
  const q5 = q5req ? (B.includes('R0_RES')||B.includes('R0_RECENTS')||B.includes('R0_VI_HIST')||B.includes('R0_PH_HIST')||B.includes('R0_HOME')|| ['resources','recents','gallery','pret','publies','home'].includes(bot.state().screen)) : 'na';
  const q6req = applic.q6==='req';
  // Q6 : publier le média — bouton Publier/Publication/Prêt OU, sur la file Prêt, les tuiles numérotées qui mènent à la publication.
  const q6 = q6req ? (B.includes('R0_PUB')||B.includes('R0_PRET')||B.includes('R0_PUB_DO')||B.includes('R0_PUBLISHED')||B.some(x=>/^R0_PRETITEM_|^R0_PUBITEM_/.test(x))) : 'na';
  const cell=v=>v===true?'✓':(v==='na'?'n/a':'✗');
  [q1,q2,q3,q4,q5,q6].forEach(v=>{ if(v===false) ecarts++; });
  ROWS.push([name, bot.state().screen, cell(q1),cell(q2),cell(q3),cell(q4),cell(q5),cell(q6)]);
}

(async()=>{
  bot.reset();
  // CONNEXION
  await bot.open(); // /v4r => accueil
  audit('Accueil', {q5:'req'});
  // PHOTO choisir
  await bot.tap('R0_PHOTO'); audit('Photo · Choisir', {q2:'req',q5:'req'});
  await bot.tap('R0_PH_GAL'); audit('Galerie (sélection)', {q5:'na'});
  await bot.tap('R0_GITEM_0'); audit('Photo · Préparer', {q2:'req',q5:'req'});
  await bot.tap('R0_PH_VALID'); // reste préparer
  await bot.tap('R0_PH_PREVIEW'); audit('Photo · Aperçu', {q2:'req'});
  await bot.tap('R0_GEN_VALID'); audit('Photo · Validation (coût)', {q2:'req'});
  await bot.tap('R0_GO2'); audit('Photo · Confirmation', {});
  await bot.tap('R0_GO'); audit('Photo · Résultat', {q2:'req',q5:'req',q6:'req'});
  // VIDÉO
  await bot.tap('R0_VIDEO'); audit('Vidéo · Choisir/Source', {q2:'req',q5:'req'});
  await bot.tap('R0_VI_VALID');
  await bot.tap('R0_VIB_script'); audit('Vidéo · Script (bloc)', {});
  await bot.tap('R0_BLOCK_OK');
  await bot.tap('R0_VI_PREVIEW'); audit('Vidéo · Aperçu', {q2:'req'});
  await bot.tap('R0_GEN_VALID'); audit('Vidéo · Validation (coût)', {q2:'req'});
  await bot.tap('R0_GO2'); await bot.tap('R0_GO'); audit('Vidéo · Résultat', {q2:'req',q5:'req',q6:'req'});
  // alimente la file Prêt à poster avec un VRAI média « garde » (en dry-run, les médias simulés n'ont pas de fichier réel) -> Pret affiche sa tuile à publier
  try{ const S=require('../ui/socle'); const id=bot.curId(); const dir=bot.projDir(); fs.mkdirSync(dir,{recursive:true});
    const mp4=path.join(dir,'2026-06-14-10-00_p1.mp4'); fs.writeFileSync(mp4,Buffer.alloc(20000,5));
    S.addCandidate(BOX,'imany',id,Date.now(),'video',{file:mp4, simule:false, etat:'garde', source:'audit'}); }catch(e){}
  // FICHIERS
  await bot.tap('R0_RES'); audit('Fichiers du projet', {q5:'req'});
  // PUBLICATION
  await bot.tap('R0_PUB'); audit('Publication', {q6:'req'});
  // PRÊT À POSTER (file alimentée par « Garder »)
  await bot.tap('R0_PRET'); audit('Prêt à poster', {q6:'req'});
  // HISTORIQUE / RÉCENTS
  await bot.tap('R0_HOME'); await bot.tap('R0_RECENTS'); audit('Récents / Archives', {q5:'req'});
  // REPRISE
  await bot.typed('/v4r'); audit('Reprise (/v4r)', {q5:'req'});
  // NOUVEAU PROJET
  await bot.typed('/v4r new'); audit('Nouveau projet', {q5:'req'});

  // ── TABLE ──
  const H=['ÉCRAN','screen','Q1','Q2','Q3','Q4','Q5','Q6'];
  const W=H.map((h,i)=>Math.max(h.length, ...ROWS.map(r=>String(r[i]).length)));
  const fmt=r=>r.map((v,i)=>String(v).padEnd(W[i])).join(' | ');
  console.log('\n'+fmt(H)); console.log(W.map(w=>'-'.repeat(w)).join('-+-'));
  ROWS.forEach(r=>console.log(fmt(r)));
  console.log('\nQ1 où suis-je · Q2 photo active · Q3 clics clairs · Q4 revenir sans perdre · Q5 retrouver fichiers · Q6 publier le média');
  console.log(ecarts===0 ? '\n✅ AUCUN ÉCART — parcours conforme aux 6 questions.' : ('\n❌ '+ecarts+' ÉCART(S) à corriger.'));
  process.exit(ecarts?1:0);
})();

// [#A THÈME PILOTE LE SCRIPT + #C VOIR PLUS] preuves runtime (sandbox).
//   A : choisir thème -> script affiché ; changer thème -> script change ; régénérer -> change ; rouvrir projet -> script enregistré (sans régén auto, sans écraser une édition par thème).
//   C : « Voir plus » déroule le texte ENTIER (mode TEXTE, >1024) sur SCRIPT et PROMPT, « Réduire » replie.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-stheme-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=()=>{const m=bot.markup();return [].concat.apply([],m.rows).map(b=>b.cb);};
const themeBtns=()=>{const m=bot.markup();return [].concat.apply([],m.rows).filter(b=>/^R0_STHEME_/.test(b.cb));};

(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');
  await bot.tap('R0_VIB_script'); // panneau Script
  const themes=themeBtns();
  chk('setup : au moins 2 thèmes proposés dans le panneau Script', themes.length>=2);

  // [#script complet] un VRAI script = long (≥120 c.), PLUSIEURS phrases (≥3), et SANS le stub « (simulé… » / « version N : accroche · point clé · chute ».
  const isFull=s=>{ s=String(s||''); const phrases=(s.match(/[.!?…]/g)||[]).length; return s.trim().length>=120 && phrases>=3 && !/simul[ée]/i.test(s) && !/accroche.*point cl[eé].*chute/i.test(s); };

  // ── A1 : choisir un thème -> VRAI script COMPLET s'affiche (pas le stub simulé) ──
  await bot.tap('R0_STHEME_0');
  const sA=String(bot.draft('video').script||'');
  chk('#A1 : choisir thème A -> VRAI script COMPLET (≥120c, ≥3 phrases, PAS de stub « simulé »)', isFull(sA) && !/à définir/i.test(sA));

  // ── A2 : changer de thème -> le script CHANGE et reste COMPLET ──
  await bot.tap('R0_STHEME_1');
  const sB=String(bot.draft('video').script||'');
  chk('#A2 : changer vers thème B -> script COMPLET DIFFÉRENT (pas de stub)', isFull(sB) && sB!==sA);

  // ── A3 : régénérer -> NOUVEAU script COMPLET, DIFFÉRENT, jamais le stub ──
  await bot.tap('R0_REGEN_SCRIPT');
  const sR=String(bot.draft('video').script||'');
  chk('#A3 : Régénérer -> script COMPLET DIFFÉRENT (≥3 phrases, pas de stub « simulé »)', isFull(sR) && sR!==sB);
  // garde-fou : la génération de script n'a déclenché AUCUNE dépense vidéo (compteur crédits inchangé)
  chk('#A3 : génération script = ZÉRO dépense vidéo (crédits inchangés)', (require('../ui/budget').state(BOX).credits||0)===0);

  // ── A4 : un VRAI script existe sur disque (sidecar) MAIS changer de thème NE le restaure PAS (thème pilote) ──
  const dir=bot.projDir(); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'2026-06-13-20-00_p1.txt'),'SCRIPT:\nVRAI SCRIPT ENREGISTRE depuis une ancienne video.\n');
  await bot.tap('R0_STHEME_0'); // re-change de thème
  const sAfter=String(bot.draft('video').script||'');
  chk('#A4 : changer de thème N\'EST PAS écrasé par le sidecar (thème pilote, pas de reload)', !/VRAI SCRIPT ENREGISTRE/i.test(sAfter) && sAfter.trim().length>0);

  // ── A5 : ROUVRIR le projet -> le VRAI script enregistré est restauré (sans régénérer tout seul) ──
  bot.seedDraft('video',{script:'(simulé — placeholder)'}); // simule un draft non-réel avant réouverture
  await bot.typed('/v4r'); // reprise projet -> r0RestoreScriptOnReopen
  const sReopen=String(bot.draft('video').script||'');
  chk('#A5 : rouvrir projet -> script ENREGISTRÉ restauré (sidecar)', /VRAI SCRIPT ENREGISTRE/i.test(sReopen));

  // ── C : VOIR PLUS déroule le texte ENTIER (mode TEXTE, > 1024) sur SCRIPT et PROMPT ──
  const HUGE='DEBUT_TXT '+Array.from({length:400},(_,i)=>'w'+i).join(' ')+' FIN_TXT'; // > 1024 chars
  for(const [name,open] of [['SCRIPT','R0_VIB_script'],['PROMPT','R0_PHB_prompt']]){
    if(name==='SCRIPT') bot.seedDraft('video',{script:HUGE}); else bot.seedDraft('photo',{prompt:HUGE});
    await bot.tap(open);
    let m=bot.markup(), st=bot.state();
    const short=m.caption.length, hasMore=cbs().includes('R0_SEEMORE');
    chk('#C '+name+' : aperçu court + bouton « Voir plus » (mode TEXTE)', st.type==='text' && hasMore && m.caption.indexOf('FIN_TXT')<0);
    await bot.tap('R0_SEEMORE');
    m=bot.markup(); st=bot.state();
    chk('#C '+name+' : « Voir plus » DÉROULE le texte ENTIER (>1024) + « Réduire »', st.type==='text' && m.caption.length>1024 && m.caption.indexOf('FIN_TXT')>=0 && cbs().includes('R0_SEELESS'));
    await bot.tap('R0_SEELESS');
    chk('#C '+name+' : « Réduire » replie (re-aperçu court)', bot.markup().caption.indexOf('FIN_TXT')<0 && cbs().includes('R0_SEEMORE'));
    // revenir au contexte pour le bloc suivant
    await bot.tap('R0_VIDEO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0'); await bot.tap('R0_VI_VALID');
  }

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

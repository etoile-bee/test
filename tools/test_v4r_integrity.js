// [INTÉGRITÉ INTER-ÉCRANS — Etoile axe 1] à >100 projets, données distinctes par projet, on PROUVE :
//   • chaque projet UNE seule fois (pas de doublon) · aucun projet ne disparaît · numéro affiché == VRAI projet (bijection cree_le)
//   • le bouton n°X ouvre BIEN le projet n°X (sur plusieurs pages) · médias/script/légendes restent rattachés au BON projet
//   • cohérence inter-écrans : projet ouvert depuis Récents -> Fichiers/Prêt/Publiés montrent SES données (scope correct)
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-int-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const mkJpg=(p)=>{try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=gray:s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}};
const mkMp4=(p)=>{try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=blue:s=720x1280:d=1','-c:v','libx264','-t','1','-pix_fmt','yuv420p',p],{timeout:20000});}catch(e){}};

(async()=>{
  bot.reset(); await bot.open();
  const persona='imany', N=110; const idByNum={};
  // seed N projets en ORDRE de création -> projNum == i. Données DISTINCTES marquées par i.
  for(let i=1;i<=N;i++){ const ts=Date.UTC(2026,0,1,0,0,0)+i*60000; const np=S.createProject(BOX,persona,{facts:{intention:{message:'Projet '+i}}},ts);
    const id=np.facts.projectId; idByNum[i]=id; const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
    const jp=path.join(dir,'p'+i+'.jpg'); mkJpg(jp); S.addCandidate(BOX,persona,id,ts,'image',{file:jp,simule:false,etat:'garde'});
    if(i%3===0){ const vp=path.join(dir,'v'+i+'.mp4'); mkMp4(vp); S.addCandidate(BOX,persona,id,ts+1,'video',{file:vp,simule:false,etat:i%6===0?'publie':'garde'}); }
    S.setDraft(BOX,persona,id,'video',{script:'SCRIPT'+i+' contenu du projet '+i},ts);
    S.setPublication(BOX,persona,id,{legende_courte:'LEG'+i, hashtags:'#p'+i},ts); }

  // ── A) BIJECTION numéros (cree_le) : 1..TOT exactement une fois (TOT = N seedés + 1 projet auto d'ouverture) ──
  const nums=bot.projNums(); const TOT=Object.keys(nums).length; const vals=Object.values(nums).sort((a,b)=>a-b);
  chk('A : '+TOT+' projets numérotés ('+N+' seedés + 1 auto), AUCUN doublon', new Set(Object.values(nums)).size===TOT);
  chk('A : numéros = 1..'+TOT+' sans trou', vals[0]===1 && vals[vals.length-1]===TOT && vals.every((v,i)=>v===i+1));
  chk('A : numéro stable == ordre de création (projNum(idByNum[X])==X)', [1,2,50,109,110].every(x=>nums[idByNum[x]]===x));

  // ── B) RÉCENTS : chaque projet UNE fois, aucun disparu ──
  const rec=bot.ctxRecents(); const projets=rec.projets;
  chk('B : Récents liste TOUS les projets ('+projets.length+'=='+TOT+')', projets.length===TOT);
  chk('B : aucun doublon de projet dans Récents', new Set(projets.map(p=>p.projectId)).size===projets.length);
  chk('B : aucun projet seedé ne DISPARAÎT', Object.values(idByNum).every(id=>projets.some(p=>p.projectId===id)));

  // ── C) TOUTES LES PAGES : vignette/bouton n° == projets[pos]._num == projNum réel ──
  const pages=Math.ceil(projets.length/6); let allPagesOk=true, badPage=null;
  for(let pg=0; pg<pages; pg++){ const base=pg*6; const rv=SC.recentsView({},{recents:rec,page:{idx:pg,pages:pages,base:base,size:6}});
    const btns=[].concat.apply([],rv.rows).filter(b=>/^R0_RE_OPEN_/.test(b.cb));
    for(const b of btns){ const pos=+String(b.cb).slice('R0_RE_OPEN_'.length); const m=String(b.text).match(/n°(\d+)/); const shown=m?+m[1]:null;
      const p=projets[pos]; if(!p || shown!==p._num || shown!==nums[p.projectId]){ allPagesOk=false; badPage=badPage||{pg:pg+1,pos,shown,real:p&&p._num}; } } }
  chk('C : sur les '+pages+' pages, n° vignette==bouton==projet réel'+(badPage?(' (1ère faute p'+badPage.pg+' pos'+badPage.pos+' montre '+badPage.shown+'≠'+badPage.real+')'):''), allPagesOk);

  // ── D) OUVERTURE RÉELLE multi-pages : on ouvre par NUMÉRO de projet (robuste au ré-ordonnancement modifie_le) ──
  //   pour chaque n° cible : on retrouve sa position courante dans Récents, on tape SON bouton, et on vérifie projet+données.
  let openOk=true, attachOk=true; const bad=[];
  const targets=[1, 2, 55, 109, 110]; // projets répartis sur plusieurs pages (1ère, ~10e, dernière)
  for(const xnum of targets){ const cur0=bot.ctxRecents().projets; const pos=cur0.findIndex(p=>p.projectId===idByNum[xnum]);
    if(pos<0){ openOk=false; bad.push('n°'+xnum+' introuvable'); continue; }
    // le bouton à cette position doit afficher n°X (vignette==bouton) AVANT ouverture
    const rv=SC.recentsView({},{recents:{projets:cur0},page:{idx:Math.floor(pos/6),pages:Math.ceil(cur0.length/6),base:Math.floor(pos/6)*6,size:6}});
    const btn=[].concat.apply([],rv.rows).find(b=>b.cb==='R0_RE_OPEN_'+pos); const shown=btn&&String(btn.text).match(/n°(\d+)/);
    if(!shown||+shown[1]!==xnum){ openOk=false; bad.push('bouton pos'+pos+'≠n°'+xnum); }
    await bot.tap('R0_RE_OPEN_'+pos);
    const cur=bot.curId(); if(cur!==idByNum[xnum] || bot.projNum(cur)!==xnum){ openOk=false; bad.push('ouvert '+bot.projNum(cur)+'≠'+xnum); continue; }
    const f=S.loadFacts(BOX,persona,cur)||{};
    const medias=(f.medias||[]).map(m=>m.file||'').join('|');
    const scr=((f.draft&&f.draft.video&&f.draft.video.script)||'');
    const leg=((f.publication&&f.publication.legende_courte)||'');
    if(!new RegExp('[pv]'+xnum+'\\.(jpg|mp4)(\\||$)').test(medias+'|')) { attachOk=false; bad.push('média n°'+xnum); }
    if(scr!=='SCRIPT'+xnum+' contenu du projet '+xnum) { attachOk=false; bad.push('script n°'+xnum); }
    if(leg!=='LEG'+xnum) { attachOk=false; bad.push('légende n°'+xnum); }
  }
  chk('D : bouton n°X ouvre BIEN le projet n°X (1,2,55,109,110 sur plusieurs pages)', openOk);
  chk('D : médias/script/légendes rattachés au BON projet (zéro fuite)'+(bad.length?(' ['+bad.join(', ')+']'):''), attachOk);

  // ── E) COHÉRENCE INTER-ÉCRANS : projet ouvert -> Fichiers/Prêt/Publiés montrent SES données ──
  // ouvrir un projet vidéo publié connu (n° multiple de 6 -> a une vidéo 'publie')
  const wantNum=6; const recE=bot.ctxRecents().projets; const posE=recE.findIndex(p=>p.projectId===idByNum[wantNum]);
  await bot.tap('R0_RE_OPEN_'+posE); const curE=bot.curId();
  chk('E : ouverture projet n°'+wantNum+' OK', curE===idByNum[wantNum] && bot.projNum(curE)===wantNum);
  const fE=S.loadFacts(BOX,persona,curE)||{};
  // Fichiers (resources) : légende de CE projet
  const fv=SC.resourcesView(fE,{projNum:wantNum});
  chk('E : Fichiers montre le n°'+wantNum+' (scope projet ouvert)', fv.caption.indexOf('Projet n°'+wantNum)>=0);
  chk('E : la légende copiée = celle du projet ouvert (LEG'+wantNum+')', (bot.fullText('legc')||'').indexOf('LEG'+wantNum)>=0);
  // Prêt à poster (garde) + Publiés (publie) : médias du projet courant
  const garde=(fE.medias||[]).filter(m=>m.etat==='garde'&&m.file); const publie=(fE.medias||[]).filter(m=>m.etat==='publie'&&m.file);
  chk('E : Prêt à poster = médias « garde » du projet ouvert ('+garde.length+')', garde.length>=1 && garde.every(m=>/[pv]/.test(path.basename(m.file))));
  chk('E : Publiés = médias « publie » du projet ouvert ('+publie.length+')', publie.length>=1);

  // ── F) MÊME NUMÉRO de projet sur les 5 écrans (header == r0ProjNum), projet ouvert n°6, via le VRAI ctx (taps réels) ──
  //   On NE passe PAS projNum à la main : on lit le markup réel rendu par le peintre (r0Ctx calcule projNum depuis r0ProjNum).
  const tag='n°'+wantNum;
  const capOf=()=>String((bot.markup()||{}).caption||'');
  await bot.tap('R0_RES');       const cF=capOf();   chk('F : Fichiers — header « '+tag+' » (ctx réel)', cF.indexOf(tag)>=0);
  await bot.tap('R0_HOME'); await bot.tap('R0_PRET');     const cP=capOf(); chk('F : Prêt à poster — header « '+tag+' »', cP.indexOf(tag)>=0);
  await bot.tap('R0_HOME'); await bot.tap('R0_STUDIO'); await bot.tap('R0_PUBLISHED'); const cB=capOf(); chk('F : Publiés — header « '+tag+' »', cB.indexOf(tag)>=0);
  await bot.tap('R0_HOME'); await bot.tap('R0_PUB');      const cU=capOf(); chk('F : Publication — header « '+tag+' »', cU.indexOf(tag)>=0);
  // Résultat vidéo : le projet n°6 a une vidéo finale -> bouton/écran résultat ; on lit via la vue avec le projNum RÉEL du bot
  const vr=SC.videoResultView(S.loadFacts(BOX,persona,curE)||{}, {projNum:bot.projNum(curE)});
  chk('F : Vidéo·Résultat — header « '+tag+' » (== bot.projNum)', String(vr.caption).indexOf(tag)>=0 && bot.projNum(curE)===wantNum);

  // ── G) Prêt/Publiés : boutons positionnels mappent les médias du PROJET COURANT (pas d'un autre) ──
  bot.reset===undefined; // noop
  // ré-ouvrir n°6 (les taps précédents ont pu changer le courant)
  const recG=bot.ctxRecents().projets; const posG=recG.findIndex(p=>p.projectId===idByNum[wantNum]); await bot.tap('R0_RE_OPEN_'+posG);
  await bot.tap('R0_PRET'); const pretBtns=bot.buttons().filter(b=>/^R0_PRETITEM_/.test(b));
  chk('G : Prêt — '+pretBtns.length+' bouton(s) positionnel(s) == nb médias « garde » du projet courant', pretBtns.length===garde.length);

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

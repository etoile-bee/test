// [GRILLE anti-photo-empruntée — Etoile IMG_3717] un projet SANS image propre ne doit JAMAIS afficher la photo d'un autre projet.
//   -> couverture STRICTEMENT propre (r0OwnCover) sinon PLACEHOLDER DISTINCT (r0PlaceholderTile : fond ardoise + n° brûlé + libellé). On REND et on REGARDE.
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-gc-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const OUT='/Users/fayrouzn/wt-terrain/assets_r'; try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const COLS=['#c0392b','#27ae60','#2980b9','#e67e22','#8e44ad','#16a085'];
const mkJpg=(p,c)=>{try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+c+':s=720x1280','-frames:v','1',p],{timeout:15000});}catch(e){}};
const mkMp4=(p,c)=>{try{cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+c+':s=720x1280:d=1','-c:v','libx264','-t','1','-pix_fmt','yuv420p',p],{timeout:20000});}catch(e){}};

(async()=>{
  bot.reset(); await bot.open();
  const persona='imany';
  // 18 projets : type cyclique image / vidéo / VIDE (1/3 chacun) — comme le terrain (beaucoup de brouillons vides)
  const types=[];
  for(let i=1;i<=18;i++){ const ts=Date.UTC(2026,0,1,0,0,0)+i*3600000;
    const np=S.createProject(BOX,persona,{facts:{intention:{message:'Projet '+i}}},ts); const id=np.facts.projectId;
    const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
    const t=i%3; types.push(t);
    if(t===1){ const fp=path.join(dir,'p'+i+'.jpg'); mkJpg(fp,COLS[i%6]); S.addCandidate(BOX,persona,id,ts,'image',{file:fp,simule:false,etat:'garde'}); }
    else if(t===2){ const jp=path.join(dir,'p'+i+'.jpg'); mkJpg(jp,COLS[i%6]); S.addCandidate(BOX,persona,id,ts,'image',{file:jp,simule:false,etat:'garde'});
      const vp=path.join(dir,'v'+i+'.mp4'); mkMp4(vp,COLS[i%6]); S.addCandidate(BOX,persona,id,ts+1,'video',{file:vp,simule:false,etat:'garde'}); }
    // t===0 : VIDE (aucun média) -> doit donner un placeholder distinct
  }
  const rec=bot.ctxRecents(); const projets=rec.projets;
  chk('volumétrie : 18 projets (mix image/vidéo/vide)', projets.length>=18);

  // ── construit la grille EXACTEMENT comme r0Render : own cover sinon placeholder ──
  const page=projets.slice(0,6); // page 1 (mix)
  const nums=page.map(p=>p._num);
  const files=page.map((p,i)=>{ const own=bot.ownCover(p); if(own) return own; const lab=(p.intention&&p.intention.message)||'brouillon'; return bot.placeholderTile(nums[i],lab); });
  const kinds=page.map(p=> (require('../ui/conscience').hasVideo(p)) ? 'video':'image');

  chk('aucune tuile NULL (chaque projet a une vignette : cover OU placeholder)', files.every(Boolean));
  chk('AUCUNE photo empruntée : toutes les vignettes sont des chemins DISTINCTS', new Set(files).size===files.length);
  // les projets vides -> placeholder (chemin _ph_), les pleins -> leur propre fichier
  let emptyOk=true; page.forEach((p,i)=>{ const own=bot.ownCover(p); const isEmpty=!own; const isPh=/_ph_/.test(files[i]); if(isEmpty!==isPh) emptyOk=false; });
  chk('projets vides -> placeholder ; projets pleins -> cover propre', emptyOk);

  // ── RENDU RÉEL + REGARD ──
  const mo=await bot.renderMosaic(files,nums,kinds);
  let kept=null; if(mo&&fs.existsSync(mo)){ kept=path.join(OUT,'_AUDIT_grid_cover_mix.jpg'); try{fs.copyFileSync(mo,kept);}catch(e){kept=mo;} }
  chk('planche RÉELLE rendue (à regarder : chaque tuile distincte)', !!kept);
  console.log('   👉 MOSAÏQUE À REGARDER : '+(kept||'(échec)'));
  console.log('      n° : '+nums.join(',')+' | types(1=img,2=vid,0=vide) : '+page.map(p=>p._num+':'+(bot.ownCover(p)?(require('../ui/conscience').hasVideo(p)?'vid':'img'):'VIDE')).join(' '));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

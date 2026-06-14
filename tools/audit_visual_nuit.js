// [AUDIT NUIT — VISUEL] rend de VRAIS médias et fournit les chemins à regarder :
//   (1) planche Prêt à poster numérotée (n° vignette == bouton 📤) — mix photo/vidéo (badge VIDEO)
//   (2) planche Publiés numérotée (idem)
//   (3) aperçu sous-titres PNG (position « collier » = subtitle_style.OY) — RÉEL (r0SubSample)
//   (4) clip aperçu 9:16 RÉEL (r0SubClip) + ffprobe dimensions + miniature extraite
// Méthode renforcée : volumétrie réelle, fichiers réels (ffmpeg lavfi), on REND puis on REGARDE.
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.R0_SUBCLIP_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-vis-'));
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true});
fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const OUT='/Users/fayrouzn/wt-terrain/assets_r'; try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const COLS=['#c0392b','#27ae60','#2980b9','#e67e22','#8e44ad','#16a085','#d35400','#2c3e50'];
const mkJpg=(p,c)=>{ try{ cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+c+':s=720x1280','-frames:v','1',p],{timeout:15000}); }catch(e){} return fs.existsSync(p); };
const mkMp4=(p,c)=>{ try{ cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+c+':s=720x1280:d=2','-c:v','libx264','-t','2','-pix_fmt','yuv420p',p],{timeout:20000}); }catch(e){} return fs.existsSync(p); };

(async()=>{
  bot.reset(); await bot.open();
  const persona='imany'; const id=bot.curId(); const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
  const ts=Date.UTC(2026,0,1,0,0,0);

  // ── 8 médias VALIDÉS (garde) mixés photo/vidéo -> Prêt à poster (2 pages de 6) ──
  for(let i=0;i<8;i++){ const isV=(i%3===2); const fp=path.join(dir,(isV?'g':'g')+i+(isV?'.mp4':'.jpg'));
    if(isV) mkMp4(fp,COLS[i%COLS.length]); else mkJpg(fp,COLS[i%COLS.length]);
    S.addCandidate(BOX,persona,id,ts+i*1000,isV?'video':'image',{file:fp,simule:false,etat:'garde'}); }
  // ── 8 médias PUBLIÉS (publie) mixés ──
  for(let i=0;i<8;i++){ const isV=(i%4===3); const fp=path.join(dir,'pub'+i+(isV?'.mp4':'.jpg'));
    if(isV) mkMp4(fp,COLS[(i+2)%COLS.length]); else mkJpg(fp,COLS[(i+2)%COLS.length]);
    S.addCandidate(BOX,persona,id,ts+100000+i*1000,isV?'video':'image',{file:fp,simule:false,etat:'publie'}); }

  // ── (1) PRÊT À POSTER : page 1 (6 items), n° vignette == bouton 📤 ──
  await bot.tap('R0_READY'); // -> écran pret
  let st=bot.state(); chk('Prêt à poster atteint (screen=pret)', st.screen==='pret');
  const f=S.loadFacts(BOX,persona,id)||{};
  const C=require('../ui/socle'); // collection helpers via socle? use screens ctx instead
  // reconstruit la grille comme le câble (etat garde, fichier réel), page 0
  const gardeAll=(f.medias||[]).filter(m=>m.etat==='garde'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
  const pretFiles=gardeAll.slice(0,6);
  const pretNums=pretFiles.map((_,i)=>i+1);
  const pretKinds=pretFiles.map(fp=>/\.(mp4|mov|m4v|webm)$/i.test(fp)?'video':'image');
  const pv=SC.pretView(f,{pretFiles:pretFiles,pretTotal:gardeAll.length,page:{idx:0,pages:Math.ceil(gardeAll.length/6),base:0}});
  const pretBtnNums=[].concat.apply([],pv.rows).filter(b=>/^R0_PRETITEM_/.test(b.cb)).map(b=>{const m=String(b.text).match(/(\d+)/);return m?+m[1]:null;});
  chk('Prêt : boutons numérotés 1..'+pretFiles.length+' (📤 position)', JSON.stringify(pretBtnNums)===JSON.stringify(pretNums));
  const moPret=await bot.renderMosaic(pretFiles,pretNums,pretKinds);
  let keptPret=null; if(moPret&&fs.existsSync(moPret)){ keptPret=path.join(OUT,'_AUDIT_pret_page1.jpg'); try{fs.copyFileSync(moPret,keptPret);}catch(e){keptPret=moPret;} }
  chk('Prêt : planche RÉELLE rendue (n° == boutons, badge VIDEO sur items vidéo)', !!(moPret&&fs.existsSync(moPret)));
  console.log('   👉 PRÊT À POSTER : '+(keptPret||'(échec)')+'  | n° brûlés '+pretNums.join(',')+' | VIDEO sur '+pretNums.filter((n,i)=>pretKinds[i]==='video').join(','));

  // ── (2) PUBLIÉS : page 1 ──
  const pubAll=(f.medias||[]).filter(m=>m.etat==='publie'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
  const pubFiles=pubAll.slice(0,6);
  const pubNums=pubFiles.map((_,i)=>i+1);
  const pubKinds=pubFiles.map(fp=>/\.(mp4|mov|m4v|webm)$/i.test(fp)?'video':'image');
  const plv=SC.publiesView(f,{publiesFiles:pubFiles,publiesTotal:pubAll.length,page:{idx:0,pages:Math.ceil(pubAll.length/6),base:0}});
  const pubBtnNums=[].concat.apply([],plv.rows).filter(b=>/^R0_PUBITEM_/.test(b.cb)).map(b=>{const m=String(b.text).match(/(\d+)/);return m?+m[1]:null;});
  chk('Publiés : boutons numérotés 1..'+pubFiles.length+' (📤 position)', JSON.stringify(pubBtnNums)===JSON.stringify(pubNums));
  const moPub=await bot.renderMosaic(pubFiles,pubNums,pubKinds);
  let keptPub=null; if(moPub&&fs.existsSync(moPub)){ keptPub=path.join(OUT,'_AUDIT_publies_page1.jpg'); try{fs.copyFileSync(moPub,keptPub);}catch(e){keptPub=moPub;} }
  chk('Publiés : planche RÉELLE rendue', !!(moPub&&fs.existsSync(moPub)));
  console.log('   👉 PUBLIÉS : '+(keptPub||'(échec)')+'  | n° brûlés '+pubNums.join(',')+' | VIDEO sur '+pubNums.filter((n,i)=>pubKinds[i]==='video').join(','));

  // ── (3) APERÇU SOUS-TITRES (collier) : source réelle + script réel -> r0SubSample PNG ──
  const src=path.join(dir,'source.jpg'); mkJpg(src,'#34495e');
  S.addCandidate(BOX,persona,id,ts+200000,'image',{file:src,simule:false,etat:'garde'});
  bot.seedDraft('video',{script:'Bonjour à tous. Aujourd\'hui on parle de confiance en soi et de petites habitudes qui changent tout.'});
  const o=bot.subOpts(bot.draft('video')); chk('Sous-titres : oy collier = subtitle_style.OY ('+o.oy+', attendu ~0.370)', Math.abs(o.oy-0.370)<0.001);
  const png=await bot.subSample(); let keptPng=null; if(png&&fs.existsSync(png)){ keptPng=path.join(OUT,'_AUDIT_soustitres_collier.png'); try{fs.copyFileSync(png,keptPng);}catch(e){keptPng=png;} }
  chk('Sous-titres : PNG aperçu RÉEL rendu (position collier à regarder)', !!(png&&fs.existsSync(png)));
  console.log('   👉 SOUS-TITRES (collier) : '+(keptPng||'(échec)'));

  // ── (4) CLIP APERÇU 9:16 RÉEL -> ffprobe + miniature ──
  const clip=await bot.subClip(); let dims=null, keptClip=null, keptThumb=null;
  if(clip&&fs.existsSync(clip)){ keptClip=path.join(OUT,'_AUDIT_apercu_clip.mp4'); try{fs.copyFileSync(clip,keptClip);}catch(e){keptClip=clip;}
    try{ const d=cp.execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0:s=x',clip],{timeout:8000}).toString().trim(); dims=d; }catch(e){}
    keptThumb=path.join(OUT,'_AUDIT_apercu_thumb.jpg'); try{ cp.execFileSync('ffmpeg',['-y','-i',clip,'-frames:v','1','-q:v','2',keptThumb],{timeout:15000}); }catch(e){}
  }
  chk('Clip aperçu : RÉEL rendu (mp4)', !!(clip&&fs.existsSync(clip)));
  chk('Clip aperçu : 9:16 (720x1280)', dims==='720x1280');
  console.log('   👉 CLIP 9:16 : '+(keptClip||'(échec)')+' ('+dims+') | miniature '+(keptThumb&&fs.existsSync(keptThumb)?keptThumb:'(échec)'));

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

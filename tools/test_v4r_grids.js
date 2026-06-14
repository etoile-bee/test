// [#Q alignement vignette↔bouton↔média + #R badge photo/vidéo] VOLUMÉTRIE RÉELLE (30 projets, pagination) + RENDU RÉEL de mosaïque.
//   Méthode renforcée : on seede un volume représentatif, on REND une vraie planche (ffmpeg) et on vérifie que le numéro brûlé = le numéro du bouton = le projet ouvert.
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-grids-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};

(async()=>{
  bot.reset();
  // ── VOLUMÉTRIE RÉELLE : 112 projets (comme la capture IMG_3693), cree_le croissant -> n° projet 1..112. Médias alternés photo/vidéo. ──
  const persona='imany', N=112;
  for(let i=1;i<=N;i++){ const ts=Date.UTC(2026,0,1,0,0,0)+i*3600000; const np=S.createProject(BOX,persona,{facts:{intention:{message:'Projet '+i}}},ts);
    const id=np.facts.projectId; const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
    const isV=(i%3===0); const fp=path.join(dir,(isV?'v':'p')+i+(isV?'.mp4':'.jpg')); fs.writeFileSync(fp, Buffer.concat([T,Buffer.from('P'+i)]));
    S.addCandidate(BOX,persona,id,ts,isV?'video':'image',{file:fp,simule:false,etat:'garde'}); }
  const nums=bot.projNums(); // id -> n° projet (par cree_le)
  chk('volumétrie : '+N+' projets numérotés 1..'+N+' (multi-pages)', Object.keys(nums).length===N && Math.max(...Object.values(nums))===N);

  // ── ctx Récents (trié récent d'abord, _num attaché) ──
  const rec=bot.ctxRecents(); const projets=rec.projets;
  chk('Récents : liste paginée ('+projets.length+' projets, '+Math.ceil(projets.length/6)+' pages)', projets.length>=N);

  // ── PLUSIEURS PAGES : pour chaque page, aligner numéro brûlé == numéro bouton == projet ouvert ──
  let allAlign=true, burnedP5=null, kindsP5=null, sliceP5=null;
  for(let pageIdx=0; pageIdx<Math.ceil(projets.length/6); pageIdx++){
    const base=pageIdx*6, slice=projets.slice(base, base+6); if(!slice.length) continue;
    const burned=slice.map(p=>p._num);
    const pg={idx:pageIdx,pages:Math.ceil(projets.length/6),base:base,size:6};
    const rv=SC.recentsView({}, {recents:rec, page:pg});
    const reBtns=[].concat.apply([],rv.rows).filter(b=>/^R0_RE_OPEN_/.test(b.cb));
    const btnNums=reBtns.map(b=>{ const m=String(b.text).match(/n°(\d+)/); return m?+m[1]:null; });
    if(JSON.stringify(burned)!==JSON.stringify(btnNums)) allAlign=false;
    reBtns.forEach((b,i)=>{ const pos=+String(b.cb).slice('R0_RE_OPEN_'.length); if(projets[pos]._num!==btnNums[i]) allAlign=false; });
    if(pageIdx===4){ burnedP5=burned; sliceP5=slice; kindsP5=slice.map(p=>p._num%3===0?'video':'image'); } // page 5 (IMG_3693) -> on la rend
  }
  chk('#Q : sur TOUTES les pages (1.. '+Math.ceil(projets.length/6)+'), numéro brûlé == bouton == projet ouvert', allAlign);

  // ── #R : badge 📸/🎬 sur chaque bouton, sur une page mixte ──
  const rvm=SC.recentsView({}, {recents:rec, page:{idx:4,pages:1,base:24,size:6}});
  const mixBtns=[].concat.apply([],rvm.rows).filter(b=>/^R0_RE_OPEN_/.test(b.cb));
  chk('#R : chaque bouton Récents porte un badge 📸 ou 🎬', mixBtns.every(b=>/^[📸🎬]/.test(b.text)));
  chk('#R : badge cohérent avec le type réel du projet', mixBtns.every(b=>{ const pos=+String(b.cb).slice('R0_RE_OPEN_'.length); const isV=projets[pos]._num%3===0; return isV?/^🎬/.test(b.text):/^📸/.test(b.text); }));

  // ── RENDU RÉEL de la planche page 5 (ffmpeg) avec n° projet + marqueur ▶ vidéo -> chemin à regarder ──
  const cp=require('child_process'); const cols=['#c0392b','#27ae60','#2980b9','#e67e22','#8e44ad','#16a085'];
  const jpgs=[]; for(let i=0;i<6;i++){ const j=path.join(BOX,'g'+i+'.jpg'); try{ cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+cols[i]+':s=400x400','-frames:v','1',j],{timeout:15000}); }catch(e){} if(fs.existsSync(j)) jpgs.push(j); }
  const outDir='/Users/fayrouzn/wt-terrain/assets_r'; try{ fs.mkdirSync(outDir,{recursive:true}); }catch(e){}
  const mo=await bot.renderMosaic(jpgs, burnedP5, kindsP5);
  let kept=null; if(mo && fs.existsSync(mo)){ kept=path.join(outDir,'_TEST_mosaic_recents_page5.jpg'); try{ fs.copyFileSync(mo,kept); }catch(e){ kept=mo; } }
  chk('#Q : planche RÉELLE rendue (ffmpeg), n° projet '+burnedP5.join(','), !!(mo && fs.existsSync(mo)));
  console.log('   👉 MOSAÏQUE À REGARDER : '+(kept||mo||'(échec)'));
  console.log('      numéros attendus brûlés : '+burnedP5.join(' , ')+'  | badge VIDEO sur : '+burnedP5.filter((n,i)=>kindsP5[i]==='video').join(',') );

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

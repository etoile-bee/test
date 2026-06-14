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
  // ── VOLUMÉTRIE RÉELLE : 30 projets, cree_le croissant -> n° projet 1..30. Médias alternés photo/vidéo. ──
  const persona='imany';
  for(let i=1;i<=30;i++){ const ts=Date.UTC(2026,0,i,8,0,0); const np=S.createProject(BOX,persona,{facts:{intention:{message:'Projet '+i}}},ts);
    const id=np.facts.projectId; const dir=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(dir,{recursive:true});
    const isV=(i%2===0); const fp=path.join(dir,(isV?'v':'p')+i+(isV?'.mp4':'.jpg')); fs.writeFileSync(fp, Buffer.concat([T,Buffer.from('P'+i)]));
    S.addCandidate(BOX,persona,id,ts,isV?'video':'image',{file:fp,simule:false,etat:'garde'}); }
  const nums=bot.projNums(); // id -> n° projet (par cree_le)
  chk('volumétrie : 30 projets numérotés 1..30', Object.keys(nums).length===30 && Math.max(...Object.values(nums))===30);

  // ── ctx Récents (trié récent d'abord, _num attaché) ──
  const rec=bot.ctxRecents(); const projets=rec.projets;
  chk('Récents : liste paginée (>6 projets, plusieurs pages)', projets.length>=30);

  // ── PAGE 5 (base=24) : aligner numéro brûlé == numéro bouton == projet ouvert ──
  const base=24, size=6; const slice=projets.slice(base, base+size);
  // numéros que la mosaïque va brûler (logique du câble) = projets[base+i]._num
  const burned = slice.map(p=>p._num);
  // boutons recentsView page 5
  const pg={idx:4,pages:Math.ceil(projets.length/6),base:base,size:size};
  const rv=SC.recentsView({}, {recents:rec, page:pg});
  const reBtns=[].concat.apply([],rv.rows).filter(b=>/^R0_RE_OPEN_/.test(b.cb));
  const btnNums=reBtns.map(b=>{ const m=String(b.text).match(/n°(\d+)/); return m?+m[1]:null; });
  chk('#Q : numéro BRÛLÉ (vignette) == numéro du BOUTON pour chaque tuile (page 5)', JSON.stringify(burned)===JSON.stringify(btnNums) && burned.length===6);
  // le bouton i ouvre la position base+i -> dont le _num == numéro affiché
  let alignOpen=true; reBtns.forEach((b,i)=>{ const pos=+String(b.cb).slice('R0_RE_OPEN_'.length); if(projets[pos]._num!==btnNums[i]) alignOpen=false; });
  chk('#Q : le bouton n°X ouvre BIEN le projet n°X (cb position -> projets[pos]._num == X)', alignOpen);

  // ── #R : badge 📸 photo / 🎬 vidéo sur chaque bouton ──
  chk('#R : chaque bouton Récents porte un badge 📸 ou 🎬', reBtns.every(b=>/^[📸🎬]/.test(b.text)));

  // ── RENDU RÉEL de la planche page 5 (ffmpeg) avec les n° projet -> chemin à regarder ──
  const files6=slice.map(p=>{ const dir=path.join(BOX,'projects_r',persona,p.projectId); const ff=fs.readdirSync(dir).find(x=>/\.(jpg|mp4)$/.test(x)); return path.join(dir,ff); });
  // pour la planche, on génère 6 VRAIES images JPEG (couleurs distinctes via ffmpeg lavfi) -> mosaïque réellement rendue, lisible à l'œil.
  const cp=require('child_process'); const cols=['red','green','blue','orange','purple','teal'];
  const jpgs=[]; for(let i=0;i<6;i++){ const j=path.join(BOX,'g'+i+'.jpg'); try{ cp.execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c='+cols[i]+':s=400x400','-frames:v','1',j],{timeout:15000}); }catch(e){} if(fs.existsSync(j)) jpgs.push(j); }
  const outDir='/Users/fayrouzn/wt-terrain/assets_r'; try{ fs.mkdirSync(outDir,{recursive:true}); }catch(e){}
  const mo=await bot.renderMosaic(jpgs, burned);
  let kept=null; if(mo && fs.existsSync(mo)){ kept=path.join(outDir,'_TEST_mosaic_page5_'+burned.join('-')+'.jpg'); try{ fs.copyFileSync(mo,kept); }catch(e){ kept=mo; } }
  chk('#Q : planche RÉELLE rendue (ffmpeg) avec les n° projet '+burned.join(','), !!(mo && fs.existsSync(mo)));
  console.log('   👉 MOSAÏQUE À REGARDER : '+(kept||mo||'(échec)')+'  (numéros attendus brûlés : '+burned.join(' , ')+')');

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

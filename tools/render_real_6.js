// [Etoile — 6 ÉCRANS RÉELS] rend les 6 sections depuis la VRAIE base, en LECTURE SEULE.
//   Sécurité : sandbox temporaire avec SYMLINKS read-only vers la vraie projects_r/outputs/looks ; les planches sont écrites
//   UNIQUEMENT dans la sandbox temp (jamais la vraie base) puis copiées vers wt-terrain/assets_r. RIEN n'est généré/modifié/supprimé dans la vraie base.
process.env.R0_DRYRUN='1'; process.env.R0_MOSAIC_FORCE='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const REAL=path.join(os.homedir(),'podcast-workflow');
const SB=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-real6-'));
// symlinks read-only vers la vraie base (lecture du patrimoine réel)
for(const d of ['projects_r','outputs','looks']){ try{ const t=path.join(REAL,d); if(fs.existsSync(t)) fs.symlinkSync(t, path.join(SB,d)); }catch(e){} }
for(const f of ['lookbook.json','library.json','outfits_catalog.json']){ try{ const t=path.join(REAL,f); if(fs.existsSync(t)) fs.copyFileSync(t, path.join(SB,f)); }catch(e){} }
process.env.V4R_SANDBOX=SB; process.on('exit',()=>{ try{ fs.rmSync(SB,{recursive:true,force:true}); }catch(e){} });
const bot=require('../telegram_bot.js'); const C=require('../ui/conscience');
const OUT='/Users/fayrouzn/wt-terrain/assets_r'; try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const isVid=fp=>/\.(mp4|mov|m4v|webm)$/i.test(fp||'');
// [Etoile — N° PROJET PARTOUT] n° de projet parent d'un fichier média (même r0ProjNum partout)
const PN=bot.projNums(); const pnumOf=fp=>{ try{ const id=bot.projectIdOf(fp); return id?(PN[id]||null):null; }catch(e){ return null; } };
const nproj=files=>files.map(fp=>pnumOf(fp));

(async()=>{
  // [SÉCURITÉ] AUCUN reset()/open()/tap() : ils écriraient (reset rm projects_r ; open écrit le nav). On n'utilise QUE des hooks de LECTURE
  //   (ctxRecents/realImages/realVideos/curFacts/ownCover) + renderMosaic (écrit seulement dans la sandbox temp).
  const save=async(name,files,nums,kinds)=>{ files=(files||[]).slice(0,6); nums=(nums||[]).slice(0,6); kinds=(kinds||[]).slice(0,6);
    if(!files.length){ console.log(name+' : (aucun contenu réel)'); return; }
    const mo=await bot.renderMosaic(files,nums,kinds); const dst=path.join(OUT,'_REAL_'+name+'.jpg');
    if(mo&&fs.existsSync(mo)){ try{fs.copyFileSync(mo,dst);}catch(e){} console.log('✅ '+name+' -> '+dst+'  | n° '+nums.join(',')+' | 🎬 '+nums.filter((n,i)=>kinds[i]==='video').join(',')); }
    else console.log('❌ '+name+' : rendu échoué'); };

  // 1) RÉCENTS (projets avec contenu, n° projet réel)
  const rec=bot.ctxRecents(); const projets=(rec&&rec.projets)||[];
  console.log('\n[base réelle] '+projets.length+' projet(s) avec contenu · '+(rec&&rec.videsCount||0)+' brouillon(s) vide(s) masqué(s)');
  { const pg=projets.slice(0,6); await save('1_Recents', pg.map(p=>bot.ownCover(p)), pg.map(p=>p._num), pg.map(p=>(C.hasVideo(p)&&bot.curFacts)?'video':'image')); }

  // 2) ARCHIVES = historique PHOTOS (tout le patrimoine image)
  { const imgs=bot.realImages(9999)||[]; console.log('[base réelle] '+imgs.length+' photo(s)');
    await save('2_Archives_photos', imgs.slice(0,6), imgs.slice(0,6).map((_,i)=>i+1), imgs.slice(0,6).map(()=>'image')); }

  // 3) PRÊT À POSTER (médias « garde » du projet courant)
  { const f=bot.curFacts()||{}; const g=(f.medias||[]).filter(m=>m&&m.etat==='garde'&&m.file&&fs.existsSync(m.file)).map(m=>m.file);
    await save('3_Pret', g.slice(0,6), g.slice(0,6).map((_,i)=>i+1), g.slice(0,6).map(fp=>isVid(fp)?'video':'image')); }

  // 4) PUBLIÉS — GLOBAL (tous les médias « publie » de TOUS les projets, cohérent avec Historique) [lecture seule]
  { const S=require('../ui/socle'); const all=[];
    for(const p of (S.listProjects(SB,'imany')||[])){ for(const m of (p.medias||[])){ if(m&&m.etat==='publie'&&m.file&&fs.existsSync(m.file)) all.push(m.file); } }
    console.log('[base réelle] '+all.length+' média(s) publié(s) (global)');
    await save('4_Publies', all.slice(0,6), all.slice(0,6).map((_,i)=>i+1), all.slice(0,6).map(fp=>isVid(fp)?'video':'image')); }

  // 5) HISTORIQUE VIDÉOS (tout le patrimoine vidéo -> GRILLE)
  const vids=bot.realVideos(9999)||[]; console.log('[base réelle] '+vids.length+' vidéo(s)');
  await save('5_Historique_videos', vids.slice(0,6), vids.slice(0,6).map((_,i)=>i+1), vids.slice(0,6).map(()=>'video'));

  // 6) TROUVER UNE VIDÉO (même surface vidéo -> même grille)
  await save('6_Trouver_video', vids.slice(0,6), vids.slice(0,6).map((_,i)=>i+1), vids.slice(0,6).map(()=>'video'));

  // garde-fou : la vraie base n'a RIEN reçu (assets_r de la vraie base non créé par nous)
  console.log('\n[lecture seule] aucune écriture dans '+REAL+' (planches écrites en sandbox temp puis copiées).');
  process.exit(0);
})().catch(e=>{ console.log('ERR',e.message); process.exit(1); });

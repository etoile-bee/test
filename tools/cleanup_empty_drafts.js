// [AA.3 — Etoile] NETTOYAGE RÉVERSIBLE des brouillons VIDES (aucun média réel). NE SUPPRIME RIEN :
//   --apply DÉPLACE les dossiers projets vides vers projects_r/<persona>/_corbeille_vides/ (réversible) + journal JSON.
//   --undo RESTAURE depuis la corbeille. Par DÉFAUT : DRY-RUN (lecture seule, ne touche à rien) -> liste ce qui SERAIT déplacé.
// Garde-fous : ne déplace QUE les projets sans AUCUNE image/vidéo réelle sur disque ; jamais un projet avec média ; jamais le courant.
const fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.V4R_BASE||path.join(os.homedir(),'podcast-workflow');
const persona=process.env.V4R_PERSONA||'imany';
const MODE=process.argv.includes('--apply')?'apply':(process.argv.includes('--undo')?'undo':'dry');
const dir=path.join(BASE,'projects_r',persona);
const trash=path.join(dir,'_corbeille_vides');
const RE_MEDIA=/\.(jpg|jpeg|png|webp|mp4|mov|m4v|webm)$/i;
function walkHasMedia(d){ try{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const fp=path.join(d,e.name);
  if(e.isDirectory()){ if(walkHasMedia(fp)) return true; } else if(RE_MEDIA.test(e.name)){ try{ if(fs.statSync(fp).size>0) return true; }catch(_){} } } }catch(e){} return false; }
function loadFactsMedia(id){ try{ const f=JSON.parse(fs.readFileSync(path.join(dir,id,'facts.json'),'utf8')); return (f.medias||[]).some(m=>m&&m.file&&!m.simule&&fs.existsSync(m.file)); }catch(e){ return false; } }

if(MODE==='undo'){ let n=0; try{ for(const id of fs.readdirSync(trash)){ const src=path.join(trash,id),dst=path.join(dir,id); if(!fs.existsSync(dst)){ fs.renameSync(src,dst); n++; } } }catch(e){}
  console.log('UNDO : '+n+' projet(s) restauré(s) depuis '+trash); process.exit(0); }

let ids=[]; try{ ids=fs.readdirSync(dir).filter(x=>{ try{ return fs.statSync(path.join(dir,x)).isDirectory() && x!=='_corbeille_vides'; }catch(e){ return false; } }); }catch(e){}
const vides=ids.filter(id=> !loadFactsMedia(id) && !walkHasMedia(path.join(dir,id)) ); // AUCUN média (facts ET disque)
console.log('Base : '+dir);
console.log('Projets : '+ids.length+' · VIDES (aucun média) : '+vides.length+' · avec contenu : '+(ids.length-vides.length));
if(MODE==='dry'){ console.log('\n[DRY-RUN] aucun changement. Seraient déplacés vers _corbeille_vides/ ('+vides.length+') :');
  vides.slice(0,20).forEach(id=>console.log('  - '+id)); if(vides.length>20) console.log('  … +'+(vides.length-20)+' autres');
  console.log('\nPour appliquer (réversible) : node tools/cleanup_empty_drafts.js --apply   |   annuler : --undo'); process.exit(0); }
// apply
try{ fs.mkdirSync(trash,{recursive:true}); }catch(e){}
let moved=0; const journal=[];
for(const id of vides){ try{ fs.renameSync(path.join(dir,id),path.join(trash,id)); moved++; journal.push(id); }catch(e){ console.log('  ! échec '+id+' : '+e.message); } }
try{ fs.writeFileSync(path.join(trash,'_journal.json'), JSON.stringify({at:new Date().toISOString(),moved:journal},null,1)); }catch(e){}
console.log('APPLY : '+moved+' brouillon(s) vide(s) déplacé(s) vers '+trash+' (réversible : --undo). RIEN supprimé.');

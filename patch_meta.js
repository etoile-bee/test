// patch_meta.js — ETAPE A du re-montage : sauve une "fiche" ..._raw_pN.meta.json
// a cote de chaque raw (script, timings, keywords, duree, reactions). NE CHANGE RIEN au rendu.
// Auto-verifiant : backup .preMeta, anti-double, abort si ancre absente, node --check + restore.
const fs=require('fs'),{execSync}=require('child_process');
const FILE=process.argv[2]||require('path').join(require('os').homedir(),'podcast-workflow','workflow.js');
function die(m){console.error('⛔ '+m);process.exit(1);}
if(!fs.existsSync(FILE))die('workflow.js introuvable : '+FILE);
let src=fs.readFileSync(FILE,'utf8');
if(src.indexOf('meta v1')>=0){console.log('✅ Deja applique (meta v1) — rien a faire.');process.exit(0);}

// 1) injecter la fonction saveMeta juste avant renderVideo
const anchorFn='async function renderVideo(';
if(src.split(anchorFn).length-1!==1)die("ancre renderVideo absente/multiple — abort.");
const fn="async function saveMeta(num,ts,outDir,data){try{const p=require('path').join(outDir,ts+'_raw_p'+num+'.meta.json');require('fs').writeFileSync(p,JSON.stringify(data));console.log('  Meta saved:',p);}catch(e){console.log('  (meta save skipped)',e.message);}}/*meta v1*/\n";
src=src.replace(anchorFn,fn+anchorFn);

// 2) apres chaque saveLipsyncRaw(lipN,N,ts,outDir); ajouter la sauvegarde de la fiche
const parts=[
  ["await saveLipsyncRaw(lip1,1,ts,outDir);","c1","wt1","d1","lip1",1],
  ["await saveLipsyncRaw(lip2,2,ts,outDir);","c2","wt2","d2","lip2",2],
  ["await saveLipsyncRaw(lip3,3,ts,outDir);","c3","wt3","d3","lip3",3],
];
let done=0;
for(const [anchor,c,wt,d,lip,n] of parts){
  if(src.split(anchor).length-1!==1){console.log('  (partie '+n+' : ancre absente, ignoree)');continue;}
  const ins="await saveMeta("+n+",ts,outDir,{ts:ts,num:"+n+",script:"+c+".script,keywords:"+c+".keywords,duration:"+d+",reactions:"+c+".reactions,wordTimings:"+wt+"});";
  src=src.replace(anchor,anchor+ins); done++;
}
if(done===0)die("aucune ancre saveLipsyncRaw trouvee — abort.");

const bak=FILE+'.preMeta';
if(!fs.existsSync(bak))fs.writeFileSync(bak,fs.readFileSync(FILE));
fs.writeFileSync(FILE,src);
try{execSync('node --check "'+FILE+'"',{stdio:'pipe'});}
catch(e){fs.writeFileSync(FILE,fs.readFileSync(bak));die('node --check KO — fichier restaure.\n'+(e.stderr||e.message));}

console.log('✅ Fiche meta.json activee ('+done+' partie(s)) :');
console.log('   • chaque future video ecrit ..._raw_pN.meta.json a cote du raw');
console.log('   • contenu : script, timings, keywords, duree, reactions');
console.log('   • AUCUN changement de rendu (sous-titres/voix/montage identiques)');

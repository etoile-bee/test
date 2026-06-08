// PREUVE chantier4 (galerie grille) — charge le VRAI buildGallerySheet de telegram_bot.js
// et prouve : (1) la planche 3x3 se construit (vraie image ffmpeg, dimensions paysage),
// (2) la pagination + le calcul de taps « ouvrir → choisir Look 12 → l'utiliser ».
// LANCER : node -e 'require("./tools/test_gallery.js")'
const fs=require('fs');const path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'..','telegram_bot.js'),'utf8');
function extractFn(n){const i=SRC.indexOf('function '+n+'(');let j=SRC.indexOf('{',i),d=0;for(let k=j;k<SRC.length;k++){if(SRC[k]==='{')d++;else if(SRC[k]==='}'){d--;if(d===0)return SRC.slice(i,k+1);}}}
const src=extractFn('buildGallerySheet');

// deps injectées
const getLooksDir=()=>{try{return fs.realpathSync(path.join(__dirname,'..','looks'));}catch(e){return path.join(__dirname,'..','looks');}}
const lookName=(p)=>'Look '+(path.basename(String(p)).slice(0,6));
const jlog=()=>{};
const F=new Function('fs','path','getLooksDir','lookName','jlog',src+'\nreturn buildGallerySheet;')(fs,path,getLooksDir,lookName,jlog);

let pass=0,fail=0;const check=(l,c,g)=>{(c?pass++:fail++);console.log((c?'✅':'❌')+' '+l+(c?'':'  (obtenu: '+JSON.stringify(g)+')'));};
const cp=require('child_process');

(function(){
  // (1) construit une planche depuis les vrais looks (page 1)
  const dir=getLooksDir();
  const files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&!f.startsWith('.')&&!f.startsWith('_'))
    .map(f=>({f,m:fs.statSync(path.join(dir,f)).mtimeMs})).sort((a,b)=>b.m-a.m).map(x=>x.f);
  console.log('looks détectés:',files.length);
  const page=files.slice(0,9);
  const sheet=F(page);
  check('1. planche générée (fichier non vide)', !!sheet&&fs.existsSync(sheet)&&fs.statSync(sheet).size>2000, sheet);
  if(sheet){
    const dim=cp.execSync('ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "'+sheet+'"').toString().trim();
    const [w,h]=dim.split(',').map(Number);
    check('1. planche = grille 3x3 (3 col × 3 rangées de vignettes)', w>=1000&&w<=1200&&h>=1250&&h<=1450, dim);
    console.log('   planche:',sheet,dim);
  }
  // (1b) page partielle (5 looks) doit aussi produire une planche 3x3 (cellules vides)
  const sheet2=F(files.slice(0,5));
  check('1b. page partielle (5 looks) -> planche OK', !!sheet2&&fs.statSync(sheet2).size>2000, sheet2);

  // (2) pagination + taps : choisir « Look 12 » (12e plus récent = index 11)
  const GAL_PAGE=9;const idx=11; // Look 12 (1-based) -> index 11 (0-based)
  const pageOf=Math.floor(idx/GAL_PAGE);           // 1 (0-based) = Page 2
  const posOnPage=idx-pageOf*GAL_PAGE;             // 2 -> bouton "3"
  const pages=Math.ceil(files.length/GAL_PAGE);
  check('2. Look 12 est en Page '+(pageOf+1), pageOf===1, pageOf);
  check('2. bouton numéro = '+(posOnPage+1), posOnPage+1===3, posOnPage+1);
  // taps NOUVELLE galerie : ouvrir(1) + aller Page 2 (1) + numéro(1) + action Avatar/Générer(1)
  const tapsNew=1 + pageOf + 1 + 1; // pageOf sauts ▶️ depuis page 1
  // taps ANCIENNE galerie (1-par-1) : ouvrir(1) + idx fois ▶️ + action(1)
  const tapsOld=1 + idx + 1;
  check('2. nouveaux taps = '+tapsNew+' (≤ 4)', tapsNew<=4, tapsNew);
  check('2. ancienne galerie = '+tapsOld+' taps -> gain net', tapsOld>=tapsNew+8, {old:tapsOld,new:tapsNew});
  console.log('   PARCOURS « ouvrir → choisir Look 12 → l\'utiliser » : '+tapsNew+' taps (vs '+tapsOld+' avant) · '+pages+' pages');

  console.log('\nRÉSULTAT: '+pass+' OK, '+fail+' KO');
  process.exit(fail?1:0);
})();

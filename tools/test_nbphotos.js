// PREUVE BUG-1 (nb photos) — MOCK du client Higgsfield (zéro réseau, zéro paiement).
// Vérifie : éco count=N -> batch_size=N -> N URLs (9:16) ; planche -> 1 image.
// LANCER : node -e 'require("./tools/test_nbphotos.js")'
let captured=null;
require.cache[require.resolve('@higgsfield/client')]={exports:{HiggsfieldClient:class{
  async uploadImage(){return 'http://fake/ref.jpg';}
  async generate(ep,params){captured=params;const n=params.batch_size||1;return {jobs:Array.from({length:n},(_,i)=>({status:'completed',results:{raw:{url:'http://fake/pose'+(i+1)+'.jpg'}}}))};}
}}};
process.env.HIGGSFIELD_KEY_ID=process.env.HIGGSFIELD_KEY_ID||'x';
process.env.HIGGSFIELD_KEY_SECRET=process.env.HIGGSFIELD_KEY_SECRET||'y';
const NL=require('../newlook.js');
let pass=0,fail=0;const ck=(l,c,g)=>{(c?pass++:fail++);console.log((c?'✅':'❌')+' '+l+(c?'':' (obtenu '+JSON.stringify(g)+')'));};
(async()=>{
  for(const n of [1,2,3,4,6]){
    const r=await NL.generateLook({category:'random',env:'bougies',mode:'eco',count:n},()=>{});
    ck('éco count='+n+' -> batch_size='+captured.batch_size+', '+r.urls.length+' URLs 9:16', captured.batch_size===n&&r.urls.length===n&&captured.aspect_ratio==='9:16', {bs:captured.batch_size,urls:r.urls.length});
  }
  const rp=await NL.generateLook({category:'random',env:'bougies',mode:'planche',count:3},()=>{});
  ck('planche -> 1 image multi-angles (batch_size=1)', captured.batch_size===1&&rp.urls.length===1, {bs:captured.batch_size,urls:rp.urls.length});
  const rh=await NL.generateLook({category:'random',env:'bougies',mode:'hd',count:3},()=>{});
  ck('HD -> 4 images (batch_size=4)', captured.batch_size===4&&rh.urls.length===4, {bs:captured.batch_size,urls:rh.urls.length});
  console.log('\nRÉSULTAT: '+pass+' OK, '+fail+' KO');
  process.exit(fail?1:0);
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});

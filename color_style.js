// ============================================================
//  SOURCE UNIQUE DE LA CORRECTION COULEUR /*coloradapt v2 — partagee prod + test*/
//  Teinte cible = V5 VALIDEE par Etoile (07/06, DEMO_couleur_V5).
//  Correction ADAPTATIVE : dosee selon la saturation/dominante jaune de la video de base.
// ============================================================

const REF = { sat: 12.63, yellow: 8.06 }; // mesures de la video de reference (2026-06-07-00-03_p1)

function measureColor(p){
  try{
    const out=require('child_process').execSync('ffmpeg -t 3 -i "'+p+'" -vf "signalstats,metadata=mode=print" -f null - 2>&1 | grep -oE "(SATAVG|UAVG)=[0-9.]+"').toString();
    const sats=[...out.matchAll(/SATAVG=([\d.]+)/g)].map(m=>+m[1]);
    const us=[...out.matchAll(/UAVG=([\d.]+)/g)].map(m=>+m[1]);
    if(!sats.length||!us.length)return null;
    return{sat:sats.reduce((a,b)=>a+b,0)/sats.length,u:us.reduce((a,b)=>a+b,0)/us.length};
  }catch(e){return null;}
}

function buildVf(p){
  // V5 exacte = secours si la mesure echoue
  let vf='eq=contrast=1.03:saturation=0.88,colorbalance=rm=0.02:bm=0.03:bh=0.04,unsharp=5:5:0.35:3:3:0.0';
  const m=measureColor(p);
  if(m){
    const sf=Math.min(1.12,Math.max(0.80,0.88*REF.sat/m.sat)).toFixed(3);  // normalise VERS la cible : desature si trop sature, RAVIVE si terne /*coloradapt v3*/
    const yr=Math.min(2,Math.max(0,(128-m.u)/REF.yellow));                  // dominante jaune vs reference
    const bm=(0.03*yr).toFixed(3),bh=(0.04*yr).toFixed(3);
    vf='eq=contrast=1.03:saturation='+sf+',colorbalance=rm=0.02:bm='+bm+':bh='+bh+',unsharp=5:5:0.35:3:3:0.0';
    console.log('  couleur adaptative: sat='+sf+' bm='+bm+' bh='+bh);
  }
  return vf;
}

// Drapeaux d'encodage communs (qualite V5 + etiquette bt709 anti-jaune telephone)
const ENCODE=' -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 ';

module.exports = { REF, measureColor, buildVf, ENCODE };

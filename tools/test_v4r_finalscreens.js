// [V — Etoile] ÉCRANS FINAUX (vidéo ET photo) : lisibles, boutons utiles, 2/ligne, pas surchargés, légendes copiables (vidéo) + Partie/Refaire (L) ; photo invite à inspecter (W2).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const flat=v=>[].concat.apply([],v.rows);
const cbs=v=>flat(v).map(b=>b.cb);

const pub={legende_courte:'Court.',legende_longue:'Long développé.',hashtags:'#fyp'};
const fV={medias:[{id:'v',type:'video',etat:'final',file:'/v.mp4'}],draft:{video:{theme:'Confiance',duree:'60s'}},publication:pub};
const fP={medias:[{id:'i',type:'image',etat:'final',file:'/i.jpg'}],draft:{photo:{look:'Old Money'}},publication:pub};
const vV=SC.videoResultView(fV,{projNum:7});
const vP=SC.photoResultView(fP,{projNum:7});

// ── VIDÉO ──
chk('V/vidéo : légendes COPIABLES présentes (courte + longue)', cbs(vV).includes('R0_FULLTEXT_legc') && cbs(vV).includes('R0_FULLTEXT_legl'));
chk('V/vidéo : ➕ Partie (suite) + 🎬 Refaire (L)', cbs(vV).includes('R0_VI_PART') && cbs(vV).includes('R0_VI_CREATE'));
chk('V/vidéo : Retour + Accueil présents', cbs(vV).includes('R0_VIDEO') && flat(vV).some(b=>/Accueil/.test(b.text)));
chk('V/vidéo : 2 boutons/ligne max (mobile lisible)', vV.rows.every(r=>r.length<=2));
chk('V/vidéo : pas surchargé (≤ 12 boutons)', flat(vV).length<=12);
chk('V/vidéo : aucun cb en double', new Set(cbs(vV)).size===cbs(vV).length);
chk('V/vidéo : caption lisible (Projet n° + Type + Statut)', /Projet n°7/.test(vV.caption)&&/Type/.test(vV.caption)&&/Statut/.test(vV.caption));

// ── PHOTO ──
chk('V/photo : 2 boutons/ligne max', vP.rows.every(r=>r.length<=2));
chk('V/photo : pas surchargé (≤ 10 boutons)', flat(vP).length<=10);
chk('V/photo : aucun cb en double', new Set(cbs(vP)).size===cbs(vP).length);
chk('V/photo : 🎬 Créer vidéo + Modifier/Régénérer + Fichiers présents', ['R0_PH_TOVIDEO','R0_PH_EDIT','R0_PH_REGEN','R0_RES'].every(c=>cbs(vP).includes(c)));
chk('W2/photo : invite à inspecter la photo avant la vidéo', /v[ée]rifier|en grand|👀/i.test(vP.caption));
chk('V/photo : Retour + Accueil présents', cbs(vP).includes('R0_PHOTO') && flat(vP).some(b=>/Accueil/.test(b.text)));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

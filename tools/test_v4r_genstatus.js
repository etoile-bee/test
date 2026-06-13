// [#A statut génération UNIQUE] L'état « en cours » vient d'UNE SEULE source (confirm2View, ctx.generating) : un seul libellé + étape + « ne reclique pas », jamais deux blocs empilés.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs');
const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const f={medias:[{id:'v',type:'video',etat:'candidate',file:'/v.mp4'}]};
const count=(s,re)=>(String(s).match(re)||[]).length;

// VIDÉO en cours
const v=SC.confirm2View(f,{generating:true,genStep:'🎙 Étape 3/5 voix',confirm:{mediaKind:'video',est:{credits:13,moteur:'Kling'},live:true,budget:{tests:0,credits:0}}});
chk('VIDÉO : UN SEUL « en cours » dans la caption', count(v.caption,/en cours/gi)===1);
chk('VIDÉO : montre l\'étape (3/5 voix) + « ne reclique pas »', /3\/5/.test(v.caption) && /ne reclique pas/i.test(v.caption));
chk('VIDÉO : PAS de double bloc « Vidéo en cours » séparé', !/Vidéo en cours/i.test(v.caption));
chk('VIDÉO : aucun bouton pendant la génération (anti re-clic)', (v.rows||[]).length===0);

// PHOTO en cours
const p=SC.confirm2View({medias:[{id:'i',type:'image',etat:'candidate',file:'/i.jpg'}]},{generating:true,genStep:'Seedream · ~30 s',confirm:{mediaKind:'photo',est:{credits:8,moteur:'Seedream'},live:true,budget:{tests:0,credits:0}}});
chk('PHOTO : UN SEUL « en cours »', count(p.caption,/en cours/gi)===1);
chk('PHOTO : montre l\'étape (Seedream) + « ne reclique pas »', /Seedream/.test(p.caption) && /ne reclique pas/i.test(p.caption));

// le câble ne pose PLUS de bannière « en cours » concurrente (source unique)
const src=fs.readFileSync(require('path').join(__dirname,'..','telegram_bot.js'),'utf8');
chk('câble : plus de bannière « Vidéo en cours… » concurrente', !/Vidéo en cours…<\/b>/.test(src) && !/Génération en cours…<\/b>.*Seedream/.test(src));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

// [U — Etoile] VIDÉO LONGUE : AVERTIR du découpage en N parties + coût AVANT la génération (écran Validation), avec confirmation.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbs=v=>[].concat.apply([],v.rows).map(b=>b.cb);

const fimg={ medias:[{id:'i',type:'image',etat:'final',file:'/i.jpg'}], draft:{video:{}} };

// 60s -> 2 parties
const v60=SC.validationView(fimg,{confirm:{mediaKind:'video', est:{duree:'60s', nb:2, eur:0.6, credits:10, moteur:'Kling'}, budget:{credits:10}, live:false}});
chk('U : 60s -> AVERTISSEMENT « découpée en 2 parties » sur Validation', /découpée en\s*<b>?\s*2\s*parties/i.test(v60.caption));
chk('U : 60s -> précise « 2 vidéos générées »', /2 vidéos/i.test(v60.caption));
chk('U : 60s -> coût affiché (couvre les 2 parties)', /Co[ûu]t/i.test(v60.caption) && /parties/i.test(v60.caption));

// 90s -> 3 parties
const v90=SC.validationView(fimg,{confirm:{mediaKind:'video', est:{duree:'90s', nb:3, eur:0.9}, budget:{}, live:false}});
chk('U : 90s -> « 3 parties »', /3\s*parties/i.test(v90.caption));

// 30s -> PAS d'avertissement (1 partie)
const v30=SC.validationView(fimg,{confirm:{mediaKind:'video', est:{duree:'30s', nb:1, eur:0.3}, budget:{}, live:false}});
chk('U : 30s -> AUCUN avertissement de découpage (1 partie)', !/parties/i.test(v30.caption));

// confirmation AVANT dépense : Générer maintenant -> double confirm (R0_GO2)
chk('U : génération derrière confirmation (R0_GO2)', cbs(v60).includes('R0_GO2'));

// aperçu (confirmView) porte aussi la note de découpage
const ap=SC.confirmView(fimg,{confirm:{mediaKind:'video', est:{duree:'60s'}, prep:{}}});
chk('U : aperçu vidéo note déjà le découpage (2 parties)', /2 parties/i.test(ap.caption));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

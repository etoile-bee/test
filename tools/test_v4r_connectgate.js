// [#P CARTE CONNEXION fiable] La carte « ✅ Connecté » est due : au BOOT (1re interaction), après INACTIVITÉ (>~20 min), et sur les ENTRÉES (/accueil, /v4r).
//   Telegram n'émet rien à l'ouverture pure de l'app -> on s'en approche au mieux. La carte reste persistante (déjà couvert par test_v4r_connectcard).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs');
const bot=require('../telegram_bot.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const MS=bot.inactivityMs();

// BOOT : aucune action encore -> carte due
chk('#P : au BOOT (1re interaction) -> carte due', bot.connectGateDue(1000)===true);
// après une action -> plus due dans la foulée
bot.touchAction(1000);
chk('#P : juste après une action -> carte NON due (pas de spam)', bot.connectGateDue(1000+5000)===false);
chk('#P : avant le seuil d\'inactivité -> NON due', bot.connectGateDue(1000+MS-1)===false);
// après le seuil d'inactivité -> due
chk('#P : après '+Math.round(MS/60000)+' min d\'inactivité -> carte due', bot.connectGateDue(1000+MS+1)===true);
// re-touch -> reset
bot.touchAction(1000+MS+1);
chk('#P : nouvelle action -> compteur d\'inactivité réinitialisé', bot.connectGateDue(1000+MS+1+10)===false);

// le câble (handle) reposte sur entrées + boot/inactivité, jamais sur les boutons de la carte
const src=fs.readFileSync(require('path').join(__dirname,'..','telegram_bot.js'),'utf8');
chk('#P : câble — carte sur ENTRÉES (/accueil, /v4r) + boot/inactivité (r0ConnectGateDue)', /_isEntry[\s\S]*?r0ConnectGateDue\(\)/.test(src) && /r0ConnectCard\(_persona\(\)\)/.test(src));
chk('#P : câble — boutons carte (Reprendre/Accueil) NE redéclenchent PAS la carte', /_isCardBtn\s*=\s*\(_act==='R0_RESUME'\|\|_act==='R0_RESUME_HOME'\)/.test(src) && /!_isCardBtn/.test(src));
chk('#P : câble — /start garde sa propre carte (pas de double)', /_isStart\s*=\s*\(_act==='\/start'\)/.test(src) && /!_isStart/.test(src));
chk('#P : boot -> carte reposée (message de connexion au démarrage)', /Connect/.test(src) && /R0_RESUME/.test(src));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

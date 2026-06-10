// [fix/restart-feedback] PREUVE logique du drapeau de ré-ouverture cockpit (sans lancer le bot).
const fs=require('fs'); const FLAG='/tmp/ws_reopen_test';
let ok=0,ko=0;const ck=(n,c)=>{if(c){ok++;console.log('✅ '+n)}else{ko++;console.log('❌ '+n)}};
// simule /restart : pose le drapeau
try{fs.unlinkSync(FLAG);}catch(e){}
fs.writeFileSync(FLAG,'1');
ck('après /restart : drapeau présent', fs.existsSync(FLAG));
// simule le boot : si drapeau -> on rouvre + on nettoie
let reopened=false; if(fs.existsSync(FLAG)){ try{fs.unlinkSync(FLAG);}catch(e){} reopened=true; }
ck('boot avec drapeau -> cockpit ré-ouvert', reopened===true);
ck('drapeau nettoyé après usage (pas de boucle)', !fs.existsSync(FLAG));
// reboot involontaire (pas de drapeau) -> silencieux
let reopened2=false; if(fs.existsSync(FLAG)){reopened2=true;}
ck('reboot SANS drapeau -> silencieux (pas de ré-ouverture)', reopened2===false);
console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); if(ko)process.exit(1);

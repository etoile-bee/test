// [GARDE ANTI-DÉPENSE] PREUVE qu'un banc d'essai (R0_DRYRUN) ne peut JAMAIS appeler un moteur payant,
//   MÊME si LIVE est armé (v4r_live présent). Régression-guard de l'incident du 11/06 (11 photos réelles déclenchées par des tests).
process.env.R0_DRYRUN = '1';
const fs = require('fs'), path = require('path');
const FLAG = path.join(process.cwd(), 'v4r_live');
let ok = 0, ko = 0; const chk = (l, c) => { c ? ok++ : ko++; console.log((c ? '✅ ' : '❌ ') + l); };

// 1) sans flag
delete require.cache[require.resolve('../ui/engines')];
let E = require('../ui/engines');
chk('R0_DRYRUN, pas de flag -> live()=false', E.live() === false);

// 2) AVEC le flag armé : le dry-run doit QUAND MÊME forcer OFF
const had = fs.existsSync(FLAG);
try { fs.writeFileSync(FLAG, 'on'); } catch (e) {}
delete require.cache[require.resolve('../ui/engines')];
E = require('../ui/engines');
chk('R0_DRYRUN + v4r_live ARMÉ -> live()=false (anti-récidive)', E.live() === false);
chk('R0_DRYRUN + v4r_live ARMÉ -> liveFor(photo)=false', E.liveFor('photo') === false);
chk('R0_DRYRUN + v4r_live ARMÉ -> liveFor(video)=false', E.liveFor('video') === false);
if (!had) { try { fs.unlinkSync(FLAG); } catch (e) {} } // ne JAMAIS laisser le flag si on ne l'avait pas

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

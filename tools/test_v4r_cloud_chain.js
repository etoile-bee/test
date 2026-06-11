// [GARDE-FOU CHAÎNE CLOUD] Empêche une future correction de CASSER SILENCIEUSEMENT la chaîne
//   génération → stockage → cloud(podcast-looks) → galerie → historique → Telegram.
//   100% STATIQUE : lit le SOURCE et l'état du symlink. N'EXÉCUTE rien, n'écrit AUCUNE donnée. (LIVE non concerné.)
const fs = require('fs'), path = require('path'), os = require('os');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'telegram_bot.js'), 'utf8');
let ok = 0, ko = 0; const chk = (l, c) => { c ? ok++ : ko++; console.log((c ? '✅ ' : '❌ ') + l); };
function body(name) { const i = SRC.indexOf('function ' + name + '('); if (i < 0) return ''; let j = SRC.indexOf('{', i), d = 0; for (let k = j; k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}') { d--; if (d === 0) return SRC.slice(i, k + 1); } } return ''; }

// 1) La copie cloud cible podcast-looks (via getLooksDir), PAS outputs/generations.
const cc = body('r0CloudCopy');
chk('r0CloudCopy cible getLooksDir() (= podcast-looks)', /getLooksDir\(\)/.test(cc));
chk('r0CloudCopy n\'écrit PAS dans outputs/generations', !/outputs['"]\s*,\s*['"]generations/.test(cc));
chk('r0CloudCopy range PAR PROJET (projId)', /projId/.test(cc));

// 2) La copie cloud est branchée sur les DEUX rendus réels (photo + vidéo).
chk('r0CloudCopy appelé sur la PHOTO réelle', /r0CloudCopy\(localPath,\s*id\)/.test(SRC));
chk('r0CloudCopy appelé sur la VIDÉO réelle', /r0CloudCopy\(mv\.file,\s*id\)/.test(SRC));

// 3) La galerie IMAGES agrège bien les 4 sources (projet + projects_r + generations + looks).
const ri = body('r0RealImages');
chk('galerie images lit projects_r/*/photo_*', /projects_r/.test(ri) && /photo_/.test(ri));
chk('galerie images lit outputs/generations', /generations/.test(ri));
chk('galerie images lit looks/gen_*', /gen_/.test(ri) && /looks/.test(ri));

// 4) L'historique VIDÉO agrège outputs (racine iCloud) + generations + projects_r.
const rv = body('r0RealVideos');
chk('historique vidéo lit outputs/ (racine iCloud)', /'outputs'/.test(rv));
chk('historique vidéo lit outputs/generations', /generations/.test(rv));
chk('historique vidéo lit projects_r', /projects_r/.test(rv));
chk('historique vidéo exclut les raws intermédiaires', /_raw_/.test(rv));

// 5) Anti-récidive dépense : la copie cloud ne tourne jamais en banc d'essai.
chk('r0CloudCopy gardé !R0DRY (jamais en test)', /R0DRY/.test(cc));

// 6) Runtime (best-effort) : le symlink looks/ pointe vers podcast-looks (iCloud).
try { const real = fs.realpathSync(path.join(os.homedir(), 'podcast-workflow', 'looks')); chk('symlink looks/ -> …/podcast-looks (iCloud)', /podcast-looks$/.test(real)); }
catch (e) { console.log('… (symlink looks/ non résolu ici — contrôle ignoré hors machine de prod)'); }

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

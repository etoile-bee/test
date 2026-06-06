// patch_subpos6.js — sous-titres au niveau du COLLIER (mesuré) + rattrapage zoom léger.
// Auto-vérifiant : backup .preSubpos6, anti-double-apply, abort si ancre absente,
// node --check après coup avec restauration si erreur.
// Patch workflow.js => PAS de redémarrage du bot.
const fs = require('fs'), path = require('path'), os = require('os');
const { execSync } = require('child_process');

const TARGET = process.argv[2] || path.join(os.homedir(), 'podcast-workflow', 'workflow.js');

function die(msg){ console.error('⛔ ' + msg); process.exit(1); }
if (!fs.existsSync(TARGET)) die('workflow.js introuvable : ' + TARGET);
let src = fs.readFileSync(TARGET, 'utf8');

// ── anti-double-apply ──
if (src.indexOf('/*subknobs v1*/') >= 0 || src.indexOf('/*subpos6 auto*/') >= 0) {
  console.log('✅ Déjà appliqué (subpos6 présent) — rien à faire.'); process.exit(0);
}

// ── ancres requises ──
const A_REQUIRE = "require('dotenv').config();";
const A_OYLINE  = "    var _oy=0.347; /*subpos5*/ // haut de la mousse du micro";
const A_FONT    = "font-size:52px;";
if (src.indexOf(A_REQUIRE) < 0) die("ancre require('dotenv') absente — fichier inattendu, abort.");
if (src.indexOf(A_OYLINE)  < 0) die("ancre subpos5 (var _oy=0.347) absente — abort (le fichier n'a peut-être pas subpos5).");
if (src.split(A_FONT).length - 1 !== 1) die("ancre 'font-size:52px;' absente ou multiple — abort.");

// ── backup ──
const bak = TARGET + '.preSubpos6';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src);
console.log('💾 backup :', bak);

// ── 1) bloc de réglages en haut ──
const KNOBS =
  A_REQUIRE + '\n' +
  '// ── REGLAGES SOUS-TITRES — cale ici, une fois pour toutes /*subknobs v1*/ ──\n' +
  'const SUB_FONT_SIZE    = 52;    // taille px (style de réf "CHEMISTRY FADES")\n' +
  'const SUB_OY_BASE      = 0.46;  // hauteur plan large = niveau du collier (mesuré ~47%)\n' +
  'const SUB_OY_ZOOM_PUSH = 0.04;  // remonte un peu quand ça zoome (0 = position fixe)\n' +
  '// position effective : _oy = SUB_OY_BASE + SUB_OY_ZOOM_PUSH * (zoom - 1)\n';
src = src.replace(A_REQUIRE, KNOBS);

// ── 2) _oy dynamique (au lieu du 0.347 figé) ──
const OY_NEW = "    var _oy=SUB_OY_BASE+SUB_OY_ZOOM_PUSH*(_sc-1); /*subpos6 auto*/ // niveau du collier, remonte au zoom";
src = src.replace(A_OYLINE, OY_NEW);

// ── 3) taille pilotée par la constante ──
src = src.replace(A_FONT, "font-size:'+SUB_FONT_SIZE+'px;");

// ── écriture + vérif syntaxe ──
fs.writeFileSync(TARGET, src);
try {
  execSync('node --check "' + TARGET + '"', { stdio: 'pipe' });
} catch (e) {
  fs.writeFileSync(TARGET, fs.readFileSync(bak)); // restore
  die('node --check a échoué après patch — fichier restauré depuis le backup.\n' + (e.stderr || e.message));
}

console.log('✅ Patch appliqué.');
console.log('   • SUB_FONT_SIZE=52  SUB_OY_BASE=0.46  SUB_OY_ZOOM_PUSH=0.04  (modifiables en haut du fichier)');
console.log('   • Sous-titres montés au niveau du collier ; rattrapage léger au zoom.');
console.log('   • workflow.js => PAS de redémarrage du bot.');

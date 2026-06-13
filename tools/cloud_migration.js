#!/usr/bin/env node
// [☁ RÉORG CLOUD — Etoile] Range le dépôt À PLAT podcast-outputs en : AAAA-MM-JJ/<média>/ (1 dossier/jour · 1 média = 1 dossier).
//   Regroupe final + raw + txt d'un MÊME média via le préfixe horodaté « AAAA-MM-JJ-HH-MM_ ».
//   PAR DÉFAUT = DRY-RUN (liste « fichier -> dossier », AUCUN déplacement). Déplacement RÉEL uniquement avec --apply.
//   RÉVERSIBLE : --apply écrit un journal .v4r_migration_undo.json (chaque move) -> `node tools/cloud_migration.js --undo` annule.
//   Ne touche PAS les sous-dossiers de travail (generations, proj_media, tests, sandbox, .v4r_*). Lecture seule en dry-run.
const fs = require('fs'), path = require('path'), os = require('os');

const APPLY = process.argv.includes('--apply');
const UNDO  = process.argv.includes('--undo');
// cible : le vrai dossier de sorties (symlink outputs/ -> iCloud podcast-outputs), surchageable par --dir=<path> (tests)
const dirArg = (process.argv.find(a => a.startsWith('--dir=')) || '').slice(6);
const ROOT = dirArg ? path.resolve(dirArg)
  : (function(){ try { return fs.realpathSync(path.join(os.homedir(), 'podcast-workflow', 'outputs')); }
      catch(e){ return path.join(os.homedir(), 'podcast-workflow', 'outputs'); } })();
const UNDO_LOG = path.join(ROOT, '.v4r_migration_undo.json');

const SKIP_DIRS = new Set(['generations', 'proj_media', 'tests', 'test', 'sandbox', 'ready_to_post', 'a_retravailler']);
const TS = /^(\d{4}-\d{2}-\d{2})-\d{2}-\d{2}_/;            // préfixe AAAA-MM-JJ-HH-MM_
const GROUP = /^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2})_/;          // clé de regroupement (même média) = horodatage minute

function undo() {
  if (!fs.existsSync(UNDO_LOG)) { console.log('Aucun journal d\'annulation (' + UNDO_LOG + ').'); return; }
  const moves = JSON.parse(fs.readFileSync(UNDO_LOG, 'utf8'));
  let n = 0;
  for (const m of moves.reverse()) { try { if (fs.existsSync(m.to)) { fs.renameSync(m.to, m.from); n++; } } catch (e) { console.log('  ⚠️ ' + e.message); } }
  try { fs.unlinkSync(UNDO_LOG); } catch (e) {}
  console.log('↩️  ' + n + ' fichier(s) remis à leur place. Journal supprimé.');
}

function plan() {
  let entries = [];
  try { entries = fs.readdirSync(ROOT, { withFileTypes: true }); }
  catch (e) { console.log('Dossier introuvable : ' + ROOT); process.exit(1); }
  // fichiers À PLAT à la racine, horodatés (on ignore dossiers de travail + fichiers cachés)
  const flat = entries.filter(e => e.isFile() && !e.name.startsWith('.') && TS.test(e.name)).map(e => e.name);
  const ignoredDirs = entries.filter(e => e.isDirectory() && (SKIP_DIRS.has(e.name) || e.name.startsWith('.'))).map(e => e.name);
  const otherFlat = entries.filter(e => e.isFile() && !e.name.startsWith('.') && !TS.test(e.name)).map(e => e.name);

  // regroupe par horodatage-minute (final + raw + txt d'un même média finissent dans le MÊME dossier)
  const groups = {};
  for (const name of flat) {
    const g = (name.match(GROUP) || [])[1]; if (!g) continue;
    (groups[g] = groups[g] || []).push(name);
  }
  const moves = [];
  for (const g of Object.keys(groups).sort()) {
    const day = g.slice(0, 10);                       // AAAA-MM-JJ
    const folder = path.join(ROOT, day, g);           // 1 dossier par média (clé minute)
    for (const name of groups[g]) {
      // renommage lisible dans le dossier : final.mp4 / raw.mp4 / <reste>
      let dest = name.replace(GROUP, '');             // retire le préfixe horodaté redondant
      if (/_raw_p?\d*\.mp4$/i.test(name) || /_raw\.mp4$/i.test(name)) dest = 'raw' + (name.match(/_p?(\d+)\.mp4$/i) ? '_p' + name.match(/_p?(\d+)\.mp4$/i)[1] : '') + '.mp4';
      else if (/_p?\d*\.mp4$/i.test(name) && !/_raw/i.test(name)) dest = 'final' + (name.match(/_p(\d+)\.mp4$/i) ? '_p' + name.match(/_p(\d+)\.mp4$/i)[1] : '') + '.mp4';
      else if (/\.txt$/i.test(name)) dest = 'infos' + (name.match(/_p(\d+)\.txt$/i) ? '_p' + name.match(/_p(\d+)\.txt$/i)[1] : '') + '.txt';
      moves.push({ from: path.join(ROOT, name), to: path.join(folder, dest), folder: path.relative(ROOT, folder) });
    }
  }
  return { moves, ignoredDirs, otherFlat, nGroups: Object.keys(groups).length };
}

if (UNDO) { undo(); process.exit(0); }

const { moves, ignoredDirs, otherFlat, nGroups } = plan();
console.log('☁ RÉORG CLOUD — ' + (APPLY ? 'APPLICATION RÉELLE' : 'DRY-RUN (aucun déplacement)'));
console.log('Racine : ' + ROOT);
console.log('Dossiers de travail IGNORÉS : ' + (ignoredDirs.join(', ') || '(aucun)'));
console.log('Fichiers à plat non horodatés (laissés tels quels) : ' + otherFlat.length);
console.log('Médias regroupés : ' + nGroups + ' · fichiers à ranger : ' + moves.length + '\n');
for (const m of moves) console.log('  ' + path.basename(m.from) + '  →  ' + m.folder + '/' + path.basename(m.to));

if (APPLY) {
  const done = [];
  for (const m of moves) {
    try { fs.mkdirSync(path.dirname(m.to), { recursive: true });
      if (fs.existsSync(m.to)) { console.log('  ⚠️ existe déjà, ignoré : ' + m.to); continue; }
      fs.renameSync(m.from, m.to); done.push({ from: m.from, to: m.to });
    } catch (e) { console.log('  ❌ ' + path.basename(m.from) + ' : ' + e.message); }
  }
  try { fs.writeFileSync(UNDO_LOG, JSON.stringify(done, null, 2)); } catch (e) {}
  console.log('\n✅ ' + done.length + ' fichier(s) déplacé(s). Annulable : node tools/cloud_migration.js --undo' + (dirArg ? ' --dir=' + dirArg : ''));
} else {
  console.log('\n(DRY-RUN — rien déplacé. Pour appliquer : node tools/cloud_migration.js --apply ; pour annuler ensuite : --undo)');
}

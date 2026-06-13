#!/usr/bin/env node
// [☁ RÉORG CLOUD — Etoile #8] CONSOLIDE le cloud par CODE PROJET : UN parent (podcast-looks) · UN sous-dossier par projectId · TOUS ses fichiers AU MÊME endroit, RAW inclus.
//   Abandon de la structure par DATE (AAAA-MM-JJ). Pour chaque projet, on RASSEMBLE dans podcast-looks/<projectId>/ tout ce qui lui appartient et qui MANQUE encore là :
//     - depuis projects_r/<persona>/<id>/ (copie de travail : finals, RAW, sidecars .txt)
//     - depuis podcast-outputs (ancien dépôt par date / à plat) quand le chemin ou le nom référence ce projet
//   But concret : « podcast-looks/<proj>/ n'a souvent que le final, pas le raw » -> on y ramène le RAW (et le reste) pour que tout REMONTE dans le flux.
//   COPIE (jamais de déplacement destructif) -> aucun fichier perdu, le cockpit garde ses originaux. RAW marqué « _raw » -> exclu du remontage média, trouvable via ☁ RAW.
//   PAR DÉFAUT = DRY-RUN (liste « source -> podcast-looks/<id>/dest », AUCUNE écriture). Copie RÉELLE uniquement avec --apply.
//   RÉVERSIBLE : --apply écrit .v4r_cloud_consolidate_undo.json (fichiers CRÉÉS) -> `node tools/cloud_migration.js --undo` les supprime (n'efface QUE ce qu'il a copié).
//   Paramètres tests : --base=<dir> (racine, défaut ~/podcast-workflow) · --looks=<dir> (cible, défaut realpath de base/looks) · --persona=<nom> (défaut : tous).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');

const APPLY = process.argv.includes('--apply');
const UNDO  = process.argv.includes('--undo');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };

const BASE  = arg('base') ? path.resolve(arg('base')) : path.join(os.homedir(), 'podcast-workflow');
const LOOKS = arg('looks') ? path.resolve(arg('looks'))
  : (function(){ try { return fs.realpathSync(path.join(BASE, 'looks')); } catch (e) { return path.join(BASE, 'looks'); } })();
const OUTPUTS = (function(){ try { return fs.realpathSync(path.join(BASE, 'outputs')); } catch (e) { return path.join(BASE, 'outputs'); } })();
const PERSONA = arg('persona'); // si absent : tous les personas trouvés sous projects_r
const UNDO_LOG = path.join(LOOKS, '.v4r_cloud_consolidate_undo.json');

const MEDIA = /\.(mp4|mov|m4v|webm|jpe?g|png|webp)$/i;
const RAWRE = /(_raw|[-_]raw)/i;

function walk(dir, onFile) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, onFile);
    else if (e.isFile()) onFile(p, e.name);
  }
}

function personas() {
  if (PERSONA) return [PERSONA];
  try { return fs.readdirSync(path.join(BASE, 'projects_r'), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name); }
  catch (e) { return []; }
}
function projectIds(persona) {
  try { return fs.readdirSync(path.join(BASE, 'projects_r', persona), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name); }
  catch (e) { return []; }
}
const shortOf = id => String(id || '').replace(/^[^_]*_/, ''); // id sans préfixe persona (= nom des anciens dossiers par date)

function undo() {
  if (!fs.existsSync(UNDO_LOG)) { console.log('Aucun journal d\'annulation (' + UNDO_LOG + ').'); return; }
  const created = JSON.parse(fs.readFileSync(UNDO_LOG, 'utf8'));
  let n = 0;
  for (const f of created.reverse()) { try { if (fs.existsSync(f)) { fs.unlinkSync(f); n++; } } catch (e) { console.log('  ⚠️ ' + e.message); } }
  try { fs.unlinkSync(UNDO_LOG); } catch (e) {}
  console.log('↩️  ' + n + ' copie(s) supprimée(s) (originaux jamais touchés). Journal supprimé.');
}

// Nom de destination dans podcast-looks/<id>/ : on garde le basename réel ; un RAW reçoit le marqueur « _raw » s'il ne l'a pas (-> exclu du remontage média, trouvable ☁ RAW).
function destName(name, isRaw) {
  if (!isRaw || RAWRE.test(name)) return name;
  const ext = path.extname(name) || '.mp4', stem = name.slice(0, name.length - ext.length);
  return stem + '_raw' + ext;
}

function plan() {
  const moves = []; let projetsTouches = 0;
  for (const persona of personas()) {
    for (const id of projectIds(persona)) {
      const destDir = path.join(LOOKS, id);
      // ce qui est DÉJÀ dans podcast-looks/<id>/ (par basename) -> on ne recopie pas
      const present = new Set(); try { for (const x of fs.readdirSync(destDir)) present.add(x); } catch (e) {}
      const candidates = []; // {src, name, isRaw}
      // 1) copie de travail du projet
      walk(path.join(BASE, 'projects_r', persona, id), (p, name) => { if (MEDIA.test(name) || /\.txt$/i.test(name)) candidates.push({ src: p, name, isRaw: RAWRE.test(name) }); });
      // 2) ancien dépôt outputs : fichiers dont le CHEMIN ou le NOM référence ce projet (id complet OU short-id == nom d'ancien dossier par date)
      const sid = shortOf(id);
      walk(OUTPUTS, (p, name) => {
        if (!MEDIA.test(name) && !/\.txt$/i.test(name)) return;
        const rel = p.replace(/\\/g, '/');
        const hit = rel.indexOf('/' + id + '/') >= 0 || rel.indexOf('_' + sid + '/') >= 0 || rel.indexOf('/' + sid + '_') >= 0 || name.indexOf(sid) >= 0;
        if (hit) candidates.push({ src: p, name, isRaw: RAWRE.test(name) });
      });
      let added = 0;
      const seenDest = new Set(present);
      for (const c of candidates) {
        const dn = destName(c.name, c.isRaw);
        if (seenDest.has(dn)) continue;           // déjà présent (ou planifié) -> rien à faire
        seenDest.add(dn);
        moves.push({ from: c.src, to: path.join(destDir, dn), id, raw: c.isRaw });
        added++;
      }
      if (added) projetsTouches++;
    }
  }
  return { moves, projetsTouches };
}

if (UNDO) { undo(); process.exit(0); }

const { moves, projetsTouches } = plan();
const nRaw = moves.filter(m => m.raw).length;
console.log('☁ CONSOLIDATION CLOUD PAR CODE PROJET — ' + (APPLY ? 'APPLICATION RÉELLE (copie)' : 'DRY-RUN (aucune écriture)'));
console.log('Base   : ' + BASE);
console.log('Cible  : ' + LOOKS + '/<projectId>/');
console.log('Projets concernés : ' + projetsTouches + ' · fichiers à rapatrier : ' + moves.length + ' (dont RAW : ' + nRaw + ')\n');
for (const m of moves) console.log('  ' + m.from.replace(BASE + '/', '') + '  →  looks/' + m.id + '/' + path.basename(m.to) + (m.raw ? '   [RAW]' : ''));

if (APPLY) {
  const created = [];
  for (const m of moves) {
    try {
      fs.mkdirSync(path.dirname(m.to), { recursive: true });
      if (fs.existsSync(m.to)) { console.log('  ⚠️ existe déjà, ignoré : ' + m.to); continue; }
      fs.copyFileSync(m.from, m.to); created.push(m.to);
    } catch (e) { console.log('  ❌ ' + path.basename(m.from) + ' : ' + e.message); }
  }
  // journal CUMULATIF : un 2e --apply ne doit PAS écraser les copies du 1er (sinon --undo n'en retire qu'une partie). On fusionne + dédup.
  let prev = []; try { prev = JSON.parse(fs.readFileSync(UNDO_LOG, 'utf8')) || []; } catch (e) {}
  const merged = Array.from(new Set(prev.concat(created)));
  try { fs.writeFileSync(UNDO_LOG, JSON.stringify(merged, null, 2)); } catch (e) {}
  console.log('\n✅ ' + created.length + ' fichier(s) copié(s) (originaux intacts). Annulable : node tools/cloud_migration.js --undo' + (arg('looks') ? ' --looks=' + arg('looks') : '') + (arg('base') ? ' --base=' + arg('base') : ''));
} else {
  console.log('\n(DRY-RUN — rien écrit. Appliquer : --apply ; annuler ensuite : --undo. La copie ne supprime AUCUN original.)');
}

// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] DOSSIER PROJET = SOURCE DE VÉRITÉ (design C.2 / verrou 4).
// Un dossier autoporteur par projet : projects/<persona>/<projectId>/ + project.json (manifest).
// Objectif : rouvrir un projet des mois plus tard et comprendre EXACTEMENT comment il a été construit.
//   - le média ACTIF vit dans le manifest (media_actif), jamais dans l'écran (design C.4)
//   - « Nouveau » ARCHIVE (statut=archive), ne détruit jamais (remplace clearActiveDraft destructif)
//   - historique des versions : chaque génération/validation ajoute une entrée
// Module PUR (aucune dépendance Telegram) -> testable hors-ligne. `base` (racine podcast-workflow) injectable.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const SUBDIRS = ['reference', 'images', 'variants', 'videos', 'exports', 'raw', 'intermediaires', 'logs'];
const STATUTS = ['brouillon', 'en_cours', 'termine', 'pret_a_poster', 'publie', 'archive'];

function iso(ts) { return (ts != null ? new Date(ts) : new Date()).toISOString(); }
function projectsRoot(base) { return path.join(base, 'projects'); }
function personaDir(base, persona) { return path.join(projectsRoot(base), persona || 'default'); }
function projectDir(base, persona, projectId) { return path.join(personaDir(base, persona), projectId); }
function manifestPath(base, persona, projectId) { return path.join(projectDir(base, persona, projectId), 'project.json'); }
function rel(base, persona, projectId, abs) { return path.relative(projectDir(base, persona, projectId), abs).split(path.sep).join('/'); }

// Identité stable et lisible : <persona>_<YYYY-MM-DD_HH-mm-ss>
function genProjectId(persona, ts) {
  const stamp = iso(ts).slice(0, 19).replace(/[:T]/g, '-');
  return (persona || 'default') + '_' + stamp;
}

function defaultManifest(persona, projectId, ts) {
  const t = iso(ts);
  return {
    projectId, persona: persona || 'default', name: null, statut: 'brouillon',
    cree_le: t, modifie_le: t,
    reference: null,                 // { fichier, label, verrou }
    look: {},                        // { tenue, decor, source, fichier }
    prompts: [],                     // [{ role:'image', name, text }]
    scripts: [],                     // [{ name, text, duree }]
    legendes: { courte: '', longue: '', tags: '' },
    parametres: { nb_images: 1, mode: 'eco', format: '9:16' },
    media_actif: null,               // chemin RELATIF au dossier projet (design C.4)
    couts: { credits: 0, eur_estime: 0, detail: {} },
    moteur_ia: {},                   // { image, script, lipsync, versions }
    livrables: { video_final: null, exports: [] },
    historique_versions: [],         // [{ ts, etape, action, ref }]
  };
}

function ensureDirs(base, persona, projectId) {
  const d = projectDir(base, persona, projectId);
  fs.mkdirSync(d, { recursive: true });
  for (const s of SUBDIRS) { try { fs.mkdirSync(path.join(d, s), { recursive: true }); } catch (e) {} }
  return d;
}

function loadManifest(base, persona, projectId) {
  try { return JSON.parse(fs.readFileSync(manifestPath(base, persona, projectId), 'utf8')); }
  catch (e) { return null; }
}

function saveManifest(base, persona, projectId, manifest, ts) {
  manifest.modifie_le = iso(ts);
  ensureDirs(base, persona, projectId);
  fs.writeFileSync(manifestPath(base, persona, projectId), JSON.stringify(manifest, null, 2));
  return manifest;
}

function createProject(base, persona, init, ts) {
  const projectId = (init && init.projectId) || genProjectId(persona, ts);
  ensureDirs(base, persona, projectId);
  const m = Object.assign(defaultManifest(persona, projectId, ts), init && init.manifest ? init.manifest : {});
  m.projectId = projectId; m.persona = persona || 'default';
  saveManifest(base, persona, projectId, m, ts);
  return { projectId, manifest: m };
}

// Ajoute une entrée d'historique de versions (mutation + retour du manifest).
function addVersion(manifest, entry, ts) {
  manifest.historique_versions = manifest.historique_versions || [];
  manifest.historique_versions.push({ ts: iso(ts), etape: entry.etape || null, action: entry.action || null, ref: entry.ref || null });
  return manifest;
}

// Copie un fichier dans le dossier projet (sous-dossier) et renvoie son chemin RELATIF.
function importFile(base, persona, projectId, subdir, srcAbs, destName) {
  ensureDirs(base, persona, projectId);
  const dir = path.join(projectDir(base, persona, projectId), subdir);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, destName || path.basename(srcAbs));
  fs.copyFileSync(srcAbs, dest);
  return rel(base, persona, projectId, dest);
}

// Le média VALIDÉ devient le média ACTIF (persisté dans le manifest) + entrée d'historique. (design C.4)
function setActiveMedia(base, persona, projectId, relPath, etapeLabel, ts) {
  const m = loadManifest(base, persona, projectId);
  if (!m) return null;
  m.media_actif = relPath;
  addVersion(m, { etape: etapeLabel || 'media', action: 'validé', ref: relPath }, ts);
  return saveManifest(base, persona, projectId, m, ts);
}

// Chemin ABSOLU du média actif (ou null).
function activeMediaAbs(base, persona, projectId, manifest) {
  const m = manifest || loadManifest(base, persona, projectId);
  if (!m || !m.media_actif) return null;
  return path.join(projectDir(base, persona, projectId), m.media_actif);
}

function setStatut(base, persona, projectId, statut, ts) {
  const m = loadManifest(base, persona, projectId);
  if (!m) return null;
  m.statut = STATUTS.indexOf(statut) >= 0 ? statut : m.statut;
  return saveManifest(base, persona, projectId, m, ts);
}

// « Nouveau » : on ARCHIVE l'actuel (jamais de suppression). Remplace clearActiveDraft destructif.
function archiveProject(base, persona, projectId, ts) { return setStatut(base, persona, projectId, 'archive', ts); }

function listProjects(base, persona) {
  const dir = personaDir(base, persona);
  let ids = [];
  try { ids = fs.readdirSync(dir).filter(f => { try { return fs.statSync(path.join(dir, f)).isDirectory(); } catch (e) { return false; } }); } catch (e) { return []; }
  return ids.map(id => {
    const m = loadManifest(base, persona, id);
    if (!m) return null;
    return { projectId: id, name: m.name || id, statut: m.statut, modifie_le: m.modifie_le, cree_le: m.cree_le, media_actif: m.media_actif };
  }).filter(Boolean).sort((a, b) => String(b.modifie_le).localeCompare(String(a.modifie_le)));
}

// Le projet « en cours » le plus récent (pour reprise au boot/après restart). (design C.1)
function currentProject(base, persona) {
  return listProjects(base, persona).find(p => p.statut === 'brouillon' || p.statut === 'en_cours') || null;
}

module.exports = {
  SUBDIRS, STATUTS,
  projectsRoot, personaDir, projectDir, manifestPath,
  genProjectId, defaultManifest, ensureDirs,
  createProject, loadManifest, saveManifest,
  addVersion, importFile, setActiveMedia, activeMediaAbs,
  setStatut, archiveProject, listProjects, currentProject,
};

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
// C3 — DEUX axes de statut indépendants :
const STATUTS_QUALITE = ['brouillon', 'test', 'production'];        // axe validation qualité (E95/E96)
const STATUTS_PUBLICATION = ['aucun', 'pret_a_poster', 'publie', 'archive']; // axe publication (C.6)

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
    projectId, persona: persona || 'default', name: null,
    statut_qualite: 'brouillon',     // C3 — brouillon | test | production (E95/E96)
    statut_publication: 'aucun',     // C3 — aucun | pret_a_poster | publie | archive (C.6)
    cree_le: t, modifie_le: t,
    reference: null,                 // { fichier, label, verrou }  (E100/E70)
    look: {},                        // { tenue, decor, source, fichier }  (E15-E27)
    prompts: [],                     // E93.1 — [{ role:'image'|'video'|'lipsync', name, text }]
    scripts: [],                     // [{ name, text, duree }]  (E46)
    legendes: { courte: '', longue: '', tags: '' },  // E49/E50
    parametres: { nb_images: 1, mode: 'eco', format: '9:16' },  // E35/E39/E44
    media_actif: null,               // chemin RELATIF au dossier (design C.4 — média actif persistant)
    couts: { credits: 0, eur_estime: 0, detail: {} },  // E11/E93.2
    moteur_ia: {},                   // { image, script, lipsync, versions }  (E93.2)
    qc: null,                        // C4/E92 — { verdict:'ok'|'alerte'|'force', par, le, details:{identite,coherence,reference,look} }
    rapport_qc: [],                  // E93.2 — historique des contrôles qualité
    livrables: { video_final: null, exports: [] },
    raws: { image: null, lipsync: null, video: null, avant_soustitres: null, avant_zoom: null, avant_montage: null }, // E93.5 raws jamais écrasés
    historique_versions: [],         // E93.3 — [{ ts, etape, action, ref }]
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

// C3 — deux axes indépendants.
function setStatutQualite(base, persona, projectId, statut, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  if (STATUTS_QUALITE.indexOf(statut) >= 0) m.statut_qualite = statut;
  return saveManifest(base, persona, projectId, m, ts);
}
function setStatutPublication(base, persona, projectId, statut, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  if (STATUTS_PUBLICATION.indexOf(statut) >= 0) m.statut_publication = statut;
  return saveManifest(base, persona, projectId, m, ts);
}

// C4/E92 — enregistre le contrôle qualité (avant paiement) dans le dossier + rapport QC.
function recordQC(base, persona, projectId, verdict, details, par, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  const entry = { verdict: verdict, par: par || 'Etoile', le: iso(ts), details: details || {} };
  m.qc = entry;
  m.rapport_qc = m.rapport_qc || []; m.rapport_qc.push(entry);
  addVersion(m, { etape: 'qc', action: 'controle:' + verdict, ref: null }, ts);
  return saveManifest(base, persona, projectId, m, ts);
}

// E93.5 — enregistre un RAW sans jamais l'écraser (raws obligatoires conservés durablement).
function setRaw(base, persona, projectId, kind, relPath, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.raws = m.raws || {};
  if (m.raws[kind]) return m; // jamais d'écrasement d'un raw existant
  m.raws[kind] = relPath;
  return saveManifest(base, persona, projectId, m, ts);
}

// « Nouveau » : ARCHIVE l'actuel (jamais de suppression). Remplace clearActiveDraft destructif. (C.1)
function archiveProject(base, persona, projectId, ts) { return setStatutPublication(base, persona, projectId, 'archive', ts); }

// ── C2/E121 : SOURCE DE DONNÉES UNIQUE. listProjects = le magasin ; toutes les autres
// vues (récents / état / prêt-à-poster / historique) sont des FILTRES sur ce même résultat. ──
function listProjects(base, persona) {
  const dir = personaDir(base, persona);
  let ids = [];
  try { ids = fs.readdirSync(dir).filter(f => { try { return fs.statSync(path.join(dir, f)).isDirectory(); } catch (e) { return false; } }); } catch (e) { return []; }
  return ids.map(id => {
    const m = loadManifest(base, persona, id);
    if (!m) return null;
    return { projectId: id, name: m.name || id, statut_qualite: m.statut_qualite, statut_publication: m.statut_publication, modifie_le: m.modifie_le, cree_le: m.cree_le, media_actif: m.media_actif };
  }).filter(Boolean).sort((a, b) => String(b.modifie_le).localeCompare(String(a.modifie_le)));
}
// L'HISTORIQUE = le magasin complet (mémoire permanente). Les vues ci-dessous sont des FILTRES.
function viewHistorique(base, persona) { return listProjects(base, persona); }
function viewRecents(base, persona, n) { return listProjects(base, persona).slice(0, n || 10); }
function viewBrouillons(base, persona) { return listProjects(base, persona).filter(p => p.statut_qualite === 'brouillon'); }
function viewProduction(base, persona) { return listProjects(base, persona).filter(p => p.statut_qualite === 'production'); }
function viewPretAPoster(base, persona) { return listProjects(base, persona).filter(p => p.statut_publication === 'pret_a_poster'); }
function viewArchives(base, persona) { return listProjects(base, persona).filter(p => p.statut_publication === 'archive'); }

// Le projet « en cours » le plus récent (reprise au boot/après restart). (design C.1)
function currentProject(base, persona) {
  return listProjects(base, persona).find(p => p.statut_qualite === 'brouillon' && p.statut_publication !== 'archive') || null;
}

module.exports = {
  SUBDIRS, STATUTS_QUALITE, STATUTS_PUBLICATION,
  projectsRoot, personaDir, projectDir, manifestPath,
  genProjectId, defaultManifest, ensureDirs,
  createProject, loadManifest, saveManifest,
  addVersion, importFile, setActiveMedia, activeMediaAbs,
  setStatutQualite, setStatutPublication, recordQC, setRaw, archiveProject,
  listProjects, viewHistorique, viewRecents, viewBrouillons, viewProduction, viewPretAPoster, viewArchives,
  currentProject,
};

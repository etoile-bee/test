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
// Libellé LISIBLE par défaut (jamais d'ID technique) : « Projet · 10 juin 15h52 ».
const _MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
function friendlyName(creeLe) { try { const d = new Date(creeLe); return 'Projet · ' + d.getDate() + ' ' + _MOIS[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); } catch (e) { return 'Projet'; } }
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
    parametres: { nb_images: 1, mode: 'eco', format: '9:16', image_fx: {}, crop: null, rendu: {}, subs_override: null, duree: '23s' },  // E35/E39/E44 ; E124 : réglages PAR PROJET ; D1 : override sous-titres projet (jamais subtitle_style.js)
    media_actif: null,               // chemin RELATIF au dossier (design C.4 — média actif persistant)
    retenues: [],                    // Q9 — images RETENUES (gardées) qui deviennent les PLANS de la vidéo (jamais d'autres images)
    gen_status: 'idle',              // Lot 5 — idle | running | done | aborted (suivi/annulation génération)
    couts: { credits: 0, eur_estime: 0, detail: {} },  // E11/E93.2
    moteur_ia: {},                   // { image, script, lipsync, versions }  (E93.2)
    qc: null,                        // C4/E92 — { verdict:'ok'|'alerte'|'force', par, le, details:{identite,coherence,reference,look} }
    rapport_qc: [],                  // E93.2 — historique des contrôles qualité
    // E123 — TRACE TECHNIQUE (candidates/variantes/rejetées) ≠ LIVRABLES (validés explicitement)
    variantes: [],                   // images conservées comme variantes (trace, PAS livrable)
    rejetees: [],                    // images rejetées (trace, PAS livrable)
    livrables: { image: null, video: null },        // E123 — sous-ensemble VALIDÉ explicitement (seul ce qui est livrable)
    livrables_select: { image: true, video: true }, // E123 — FINALISER : Image+Vidéo cochés par défaut
    exports: [],
    raws: { image: null, lipsync: null, video: null, avant_soustitres: null, avant_zoom: null, avant_montage: null }, // E93.5 raws jamais écrasés
    historique_versions: [],         // E93.3 — JOURNAL d'actions [{ ts, etape, action, ref }]
    versions: [],                    // Q4 — SNAPSHOTS RESTAURABLES [{ id, ts, label, media_ref, params_snapshot }]
    livrables_dossiers: [],          // E125 — DOSSIERS LIVRABLES autonomes (tout le nécessaire à la publication)
    // Couche créative — 4 ZONES indépendantes : chacune {value,label,ref_image,prompt,locked,history} (critères 2/3/4)
    zones: {
      reference: { value: null, label: null, ref_image: null, prompt: null, locked: false, history: [] },
      look:      { value: null, label: null, ref_image: null, prompt: null, locked: false, history: [] },
      decor:     { value: null, label: null, ref_image: null, prompt: null, locked: false, history: [] },
      prompt:    { value: null, label: null, ref_image: null, prompt: null, locked: false, history: [] },
    },
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

// ── E123 — VALIDATION D'IMAGE EXPLICITE : devenir de chaque image. RIEN n'entre en livrable sans appel explicite. ──
//   outcome : 'garder' (→ image active = média actif/source) · 'rejeter' (trace, jamais livrable) ·
//             'variante' (trace, jamais livrable) · 'livrable' (→ livrables.image + image active).
function setImageOutcome(base, persona, projectId, rel, outcome, ts) {
  const m = loadManifest(base, persona, projectId); if (!m || !rel) return null;
  m.variantes = m.variantes || []; m.rejetees = m.rejetees || []; m.livrables = m.livrables || { image: null, video: null };
  const pull = (arr) => { const i = arr.indexOf(rel); if (i >= 0) arr.splice(i, 1); };
  if (outcome === 'garder') { pull(m.rejetees); m.media_actif = rel; addVersion(m, { etape: 'image', action: 'gardée', ref: rel }, ts); }
  else if (outcome === 'rejeter') { if (m.media_actif === rel) m.media_actif = null; if (m.livrables.image === rel) m.livrables.image = null; pull(m.variantes); if (m.rejetees.indexOf(rel) < 0) m.rejetees.push(rel); addVersion(m, { etape: 'image', action: 'rejetée', ref: rel }, ts); }
  else if (outcome === 'variante') { pull(m.rejetees); if (m.variantes.indexOf(rel) < 0) m.variantes.push(rel); addVersion(m, { etape: 'image', action: 'variante', ref: rel }, ts); }
  else if (outcome === 'livrable') { pull(m.rejetees); m.media_actif = rel; m.livrables.image = rel; addVersion(m, { etape: 'image', action: 'livrable', ref: rel }, ts); }
  return saveManifest(base, persona, projectId, m, ts);
}
// E123 — promotion explicite d'un livrable (image|video).
function setLivrable(base, persona, projectId, kind, rel, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.livrables = m.livrables || { image: null, video: null }; if (kind === 'image' || kind === 'video') m.livrables[kind] = rel;
  return saveManifest(base, persona, projectId, m, ts);
}
// ── ZONES créatives (critères 2/3/4) : réf/look/décor/prompt indépendantes, chacune avec verrou + historique ──
const ZONES = ['reference', 'look', 'decor', 'prompt'];
function ensureZones(m) { m.zones = m.zones || {}; ZONES.forEach(z => { m.zones[z] = m.zones[z] || { value: null, label: null, ref_image: null, prompt: null, locked: false, history: [] }; }); return m; }
// Modifie une zone (value/label/ref_image/prompt) ; pousse l'ancienne valeur dans SON historique (jamais perdue).
function setZone(base, persona, projectId, zoneKey, patch, ts) {
  const m = loadManifest(base, persona, projectId); if (!m || ZONES.indexOf(zoneKey) < 0) return null;
  ensureZones(m); const z = m.zones[zoneKey];
  if (patch && 'value' in patch && z.value != null && z.value !== patch.value) { z.history = z.history || []; z.history.push({ value: z.value, label: z.label, ref_image: z.ref_image, prompt: z.prompt, ts: iso(ts) }); }
  Object.keys(patch || {}).forEach(k => { if (k !== 'history') z[k] = patch[k]; });
  // miroir vers les champs « plats » utilisés ailleurs (rétro-compat hdr/params)
  if (zoneKey === 'look') { m.look = m.look || {}; m.look.tenue = z.label || z.value || m.look.tenue; }
  if (zoneKey === 'decor') { m.look = m.look || {}; m.look.decor = z.label || z.value || m.look.decor; }
  if (zoneKey === 'reference') { m.reference = Object.assign({}, m.reference, { label: z.label || z.value }); }
  if (zoneKey === 'prompt') { m.prompts = [{ role: 'image', name: z.label || 'perso', text: z.prompt || z.value || '' }]; }
  return saveManifest(base, persona, projectId, m, ts);
}
function lockZone(base, persona, projectId, zoneKey, on, ts) {
  const m = loadManifest(base, persona, projectId); if (!m || ZONES.indexOf(zoneKey) < 0) return null;
  ensureZones(m); m.zones[zoneKey].locked = !!on; return saveManifest(base, persona, projectId, m, ts);
}
function zoneHistory(base, persona, projectId, zoneKey) { const m = loadManifest(base, persona, projectId); return (m && m.zones && m.zones[zoneKey] && m.zones[zoneKey].history) || []; }
function lockedZones(m) { ensureZones(m); return ZONES.filter(z => m.zones[z].locked); }

// E124 — réglages image PAR PROJET (jamais globaux). fx fusionné dans parametres.image_fx du projet ; aucune fuite.
function setImageFx(base, persona, projectId, fx, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.parametres = m.parametres || {}; m.parametres.image_fx = Object.assign({}, m.parametres.image_fx, fx || {});
  return saveManifest(base, persona, projectId, m, ts);
}
function setCrop(base, persona, projectId, crop, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.parametres = m.parametres || {}; m.parametres.crop = crop || null;
  return saveManifest(base, persona, projectId, m, ts);
}
// E123 — FINALISER : (dé)cocher un livrable (image|video). Décocher vidéo ⇒ projet image seule.
function setLivrableSelect(base, persona, projectId, kind, on, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.livrables_select = m.livrables_select || { image: true, video: true }; if (kind === 'image' || kind === 'video') m.livrables_select[kind] = !!on;
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

// Q9 — RETENUES : images gardées qui deviennent les PLANS de la vidéo. On RÉUTILISE ces images, jamais d'autres.
function addRetenue(base, persona, projectId, rel, ts) {
  const m = loadManifest(base, persona, projectId); if (!m || !rel) return null;
  m.retenues = m.retenues || []; if (m.retenues.indexOf(rel) < 0) m.retenues.push(rel);
  return saveManifest(base, persona, projectId, m, ts);
}
function removeRetenue(base, persona, projectId, rel, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.retenues = (m.retenues || []).filter(x => x !== rel);
  return saveManifest(base, persona, projectId, m, ts);
}
// Nb de plans vidéo = nb d'images retenues (sinon 1 si un média actif existe).
function videoPlanCount(m) { const n = (m && m.retenues && m.retenues.length) || 0; return n > 0 ? n : ((m && m.media_actif) ? 1 : 0); }
function videoPlans(m) { const r = (m && m.retenues) || []; return r.length ? r.slice() : ((m && m.media_actif) ? [m.media_actif] : []); }

// Q4 — SNAPSHOT restaurable : capture l'état courant (média + params) ; ne supprime jamais les versions existantes.
function snapshotVersion(base, persona, projectId, label, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.versions = m.versions || [];
  const id = 'v' + (m.versions.length + 1);
  m.versions.push({
    id: id, ts: iso(ts), label: label || id,
    media_ref: m.media_actif,
    params_snapshot: JSON.parse(JSON.stringify({ image_fx: (m.parametres && m.parametres.image_fx) || {}, crop: (m.parametres && m.parametres.crop) || null, prompt: m.prompts || [], look: m.look || {} })),
  });
  saveManifest(base, persona, projectId, m, ts);
  return id;
}
function listVersions(base, persona, projectId) { const m = loadManifest(base, persona, projectId); return (m && m.versions) || []; }
// Q4 — RESTAURE une version : réactive média + params du snapshot. Les autres versions restent (jamais perdues).
function restoreVersion(base, persona, projectId, versionId, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  const v = (m.versions || []).find(x => x.id === versionId); if (!v) return null;
  m.media_actif = v.media_ref;
  m.parametres = m.parametres || {};
  m.parametres.image_fx = JSON.parse(JSON.stringify(v.params_snapshot.image_fx || {}));
  m.parametres.crop = v.params_snapshot.crop || null;
  if (v.params_snapshot.prompt) m.prompts = JSON.parse(JSON.stringify(v.params_snapshot.prompt));
  if (v.params_snapshot.look) m.look = JSON.parse(JSON.stringify(v.params_snapshot.look));
  addVersion(m, { etape: 'version', action: 'restauré:' + versionId, ref: v.media_ref }, ts);
  return saveManifest(base, persona, projectId, m, ts);
}

// Lot 5 — suivi/annulation : statut de génération (running/done/aborted).
function setGenStatus(base, persona, projectId, status, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.gen_status = status; return saveManifest(base, persona, projectId, m, ts);
}
// E125 — assemble un DOSSIER LIVRABLE autonome (tout le nécessaire à la publication) à partir du manifest.
function buildDeliverable(base, persona, projectId, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.livrables_dossiers = m.livrables_dossiers || [];
  const did = 'liv' + (m.livrables_dossiers.length + 1);
  const lg = m.legendes || {};
  const dossier = {
    id: did, ts: iso(ts),
    video: (m.livrables && m.livrables.video) || m.video_media || null,
    images: [(m.livrables && m.livrables.image) || m.media_actif].filter(Boolean),
    variantes: m.variantes || [],
    script: (m.scripts && m.scripts[0] && m.scripts[0].text) || '',
    legende_courte: lg.courte || '', legende_longue: lg.longue || '', hashtags: lg.tags || '',
    parametres: m.parametres || {}, infos: { projectId: m.projectId, persona: m.persona, name: m.name, cree_le: m.cree_le },
    couts: m.couts || {}, moteur_ia: m.moteur_ia || {}, raws: m.raws || {}, exports: m.exports || [],
  };
  m.livrables_dossiers.push(dossier);
  try { const dir = path.join(projectDir(base, persona, projectId), 'exports', did); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'deliverable.json'), JSON.stringify(dossier, null, 2)); } catch (e) {}
  saveManifest(base, persona, projectId, m, ts);
  return dossier;
}
// E125 — complétude d'un dossier livrable (tout présent pour publier).
function deliverableComplete(d) {
  if (!d) return false;
  const keys = ['video', 'images', 'script', 'legende_courte', 'legende_longue', 'hashtags', 'parametres', 'infos', 'exports', 'raws'];
  if (!keys.every(k => k in d)) return false;
  return (d.images && d.images.length > 0) || !!d.video; // au moins un média livrable
}

// D1 — override sous-titres PROJET (jamais subtitle_style.js verrouillé) ; appliqué au rendu via hook sanctionné.
function setSubsOverride(base, persona, projectId, subs, ts) {
  const m = loadManifest(base, persona, projectId); if (!m) return null;
  m.parametres = m.parametres || {}; m.parametres.subs_override = subs || null;
  return saveManifest(base, persona, projectId, m, ts);
}

// Lot 6 (A5) — publier : sort de la file Prêt-à-poster, RESTE dans l'Historique (statut métier, pas d'auto-post).
function publish(base, persona, projectId, ts) { return setStatutPublication(base, persona, projectId, 'publie', ts); }
// Lot 7 (A6) — un média est-il PERSISTANT (local au dossier projet) et non dépendant d'une URL temporaire ?
function isLocalMedia(rel) { return !!rel && !/^https?:\/\//i.test(rel); }
function projectSurvit(base, persona, projectId) { // le dossier projet survit à l'expiration des URLs temporaires
  const m = loadManifest(base, persona, projectId); if (!m) return false;
  const refs = [m.media_actif, m.livrables && m.livrables.image, m.livrables && m.livrables.video].filter(Boolean);
  return refs.every(isLocalMedia);
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
    return { projectId: id, name: m.name || friendlyName(m.cree_le), statut_qualite: m.statut_qualite, statut_publication: m.statut_publication, modifie_le: m.modifie_le, cree_le: m.cree_le, media_actif: m.media_actif };
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
  setImageOutcome, setLivrable, setLivrableSelect, setImageFx, setCrop,
  ZONES, setZone, lockZone, zoneHistory, lockedZones,
  setStatutQualite, setStatutPublication, recordQC, setRaw, archiveProject,
  setGenStatus, publish, isLocalMedia, projectSurvit,
  snapshotVersion, listVersions, restoreVersion,
  addRetenue, removeRetenue, videoPlanCount, videoPlans,
  buildDeliverable, deliverableComplete, setSubsOverride,
  listProjects, viewHistorique, viewRecents, viewBrouillons, viewProduction, viewPretAPoster, viewArchives,
  currentProject,
};

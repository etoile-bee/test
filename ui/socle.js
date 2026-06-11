// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — Lot 0] SOCLE minimal = SOURCE DE VÉRITÉ (faits d'un projet).
//   Stocke UNIQUEMENT des FAITS durables (cap/intention + mémoire). NE calcule rien,
//   NE stocke aucune dérivation (situation/titre/signaux sont dérivés par la Conscience — INV-9).
//   Source unique (INV-10) : le seul état durable vit ici (facts.json), jamais dans l'affichage (E122).
//   Isolé du store v4.1 : données sous projects_r/<persona>/<id>/ (aucune dépense, aucun média).
//   PUR : aucune dépendance Telegram. `base` (racine) injectable -> testable hors-ligne.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const _MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
function iso(ts) { return (ts != null ? new Date(ts) : new Date()).toISOString(); }

function rroot(base) { return path.join(base, 'projects_r'); }                       // racine réalisation (isolée)
function personaDir(base, persona) { return path.join(rroot(base), persona || 'default'); }
function pdir(base, persona, id) { return path.join(personaDir(base, persona), id); }
function fpath(base, persona, id) { return path.join(pdir(base, persona, id), 'facts.json'); }

// Identité STABLE (M18) : <persona>_<YYYY-MM-DD-HH-mm-ss>, préservée dans le temps.
function genId(persona, ts) {
  const stamp = iso(ts).slice(0, 19).replace(/[:T]/g, '-');
  return (persona || 'default') + '_' + stamp;
}

// FAITS DURABLES uniquement (aucune dérivation). L'intention = cap composite (esquissable).
//   `publication`, `statut`, `archive` = ATTRIBUTS du dossier (objet existant), conformes au modèle
//   (Légende courte/longue/Plateforme prévues par MODELE_METIER) — AUCUN nouvel objet.
function defaultFacts(persona, id, ts) {
  const t = iso(ts);
  return {
    projectId: id, persona: persona || 'default',
    cree_le: t, modifie_le: t,
    intention: { message: null, emotion: null, public: null, objectif: null, declencheur: null },
    decisions: [],   // mémoire (action + raison)
    medias: [],      // Média produit (faits déposés par l'Atelier : candidate + RAW) — simulés en V1
    publication: { legende_courte: null, legende_longue: null, hashtags: null, plateforme: null, publie_le: null },
    statut: 'brouillon', // brouillon | actif | archive (attribut du dossier)
  };
}

function ensureDir(base, persona, id) { fs.mkdirSync(pdir(base, persona, id), { recursive: true }); }

function loadFacts(base, persona, id) {
  try { return JSON.parse(fs.readFileSync(fpath(base, persona, id), 'utf8')); }
  catch (e) { return null; }
}

function saveFacts(base, persona, facts, ts) {
  facts.modifie_le = iso(ts);
  ensureDir(base, persona, facts.projectId);
  fs.writeFileSync(fpath(base, persona, facts.projectId), JSON.stringify(facts, null, 2));
  return facts;
}

function createProject(base, persona, init, ts) {
  let id = (init && init.projectId) || genId(persona, ts);
  // [DATA-INTÉGRITÉ] ne JAMAIS écraser un projet existant : si l'id (précision seconde) existe déjà, suffixe -2, -3…
  //   (sinon deux créations dans la même seconde -> collision d'id -> perte silencieuse du projet précédent).
  if (!(init && init.projectId)) { const baseId = id; let n = 2; while (fs.existsSync(fpath(base, persona, id))) { id = baseId + '-' + n; n++; } }
  const f = Object.assign(defaultFacts(persona, id, ts), (init && init.facts) ? init.facts : {});
  f.projectId = id; f.persona = persona || 'default';
  saveFacts(base, persona, f, ts);
  return { projectId: id, facts: f };
}

// Liste des projets (faits), du plus récemment modifié au plus ancien.
function listProjects(base, persona) {
  const d = personaDir(base, persona);
  let ids = [];
  try { ids = fs.readdirSync(d).filter(x => { try { return fs.statSync(path.join(d, x)).isDirectory(); } catch (e) { return false; } }); }
  catch (e) { return []; }
  return ids.map(id => loadFacts(base, persona, id)).filter(Boolean)
    .sort((a, b) => String(b.modifie_le).localeCompare(String(a.modifie_le)));
}

function currentProject(base, persona) { return listProjects(base, persona)[0] || null; }

// ── ÉCRITURES DE FAITS (le Pilotage écrit ; l'Atelier dépose) — toujours dans le Socle (INV-10) ──
// Cap : précise une/des composantes de l'intention (fait durable).
function setIntention(base, persona, id, patch, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.intention = Object.assign({}, f.intention, patch || {});
  return saveFacts(base, persona, f, ts);
}
// Mémoire : enregistre une Décision (action + raison) — jamais effacée.
function recordDecision(base, persona, id, action, raison, auteur, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.decisions = f.decisions || [];
  f.decisions.push({ ts: iso(ts), action: action, raison: raison || null, auteur: auteur || 'Etoile' });
  return saveFacts(base, persona, f, ts);
}
// Atelier : dépose un fait-média à l'état `candidate` (simulé en V1 — zéro dépense).
//   `type` = nature du média (image|video) — attribut d'un objet EXISTANT (le média = manifestation
//   du cap), conforme au modèle scellé (MODELE_METIER : prompt rôle image/vidéo ; projet = image/vidéo/les deux).
//   `attrs` = autres ATTRIBUTS de la même manifestation (prompt, params, source, script, voix, musique,
//   légendes…) — déjà prévus par le modèle (Prompt/Script/Légende/RAW). AUCUN objet ni règle nouveau.
//   Renvoie { facts, mediaId } pour permettre l'édition immédiate de la matière déposée.
function addCandidate(base, persona, id, ts, type, attrs) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.medias = f.medias || [];
  const mid = 'm' + (f.medias.length + 1);
  const m = Object.assign({ id: mid, etat: 'candidate', simule: true, type: (type === 'video' ? 'video' : 'image'), produit_le: iso(ts) }, attrs || {});
  f.medias.push(m);
  saveFacts(base, persona, f, ts);
  return { facts: f, mediaId: mid };
}
// Édite les ATTRIBUTS d'une manifestation existante (prompt/params/source/script/voix/musique/légendes…).
function patchMedia(base, persona, id, mediaId, patch, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  const m = (f.medias || []).find(x => x.id === mediaId); if (!m) return null;
  Object.assign(m, patch || {});
  return saveFacts(base, persona, f, ts);
}
// État d'une manifestation : 'garde' (validée) | 'supprime' (SOFT : sort de la vue, RESTE dans le dossier — rien ne se perd).
function setMediaEtat(base, persona, id, mediaId, etat, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  const m = (f.medias || []).find(x => x.id === mediaId); if (!m) return null;
  m.etat = etat;
  return saveFacts(base, persona, f, ts);
}
// Publication : ATTRIBUTS du dossier (légendes/hashtags/plateforme). N'exécute RIEN (publier = ailleurs, gaté).
function setPublication(base, persona, id, patch, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.publication = Object.assign({ legende_courte: null, legende_longue: null, hashtags: null, plateforme: null, publie_le: null }, f.publication, patch || {});
  return saveFacts(base, persona, f, ts);
}
// BROUILLON de préparation (paramètres d'un écran riche AVANT génération) : ATTRIBUT du dossier.
//   kind = 'photo' | 'video'. Tampon de travail durable (reconstruit l'écran à l'identique). Pas un nouvel objet.
function setDraft(base, persona, id, kind, patch, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.draft = f.draft || {};
  f.draft[kind] = Object.assign({}, f.draft[kind], patch || {});
  return saveFacts(base, persona, f, ts);
}
function getDraft(facts, kind) { return (facts && facts.draft && facts.draft[kind]) || {}; }
// Vide les BROUILLONS de préparation (quitter sans enregistrer) — n'efface QUE le travail en cours,
// jamais la matière produite / l'intention / la publication (suppression douce, rien de committé n'est perdu).
function clearDraft(base, persona, id, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.draft = {};
  return saveFacts(base, persona, f, ts);
}
// Statut du dossier (brouillon | actif | archive). Soft : archiver ne supprime jamais.
function setStatut(base, persona, id, statut, ts) {
  const f = loadFacts(base, persona, id); if (!f) return null;
  f.statut = statut;
  return saveFacts(base, persona, f, ts);
}
// Duplique un dossier (copie d'amorce) — nouvel id, mêmes faits, repart en brouillon.
function duplicateProject(base, persona, srcId, ts) {
  const src = loadFacts(base, persona, srcId); if (!src) return null;
  const id = genId(persona, ts);
  const f = JSON.parse(JSON.stringify(src));
  f.projectId = id; f.cree_le = iso(ts); f.statut = 'brouillon'; f.publication = Object.assign({}, f.publication, { publie_le: null });
  saveFacts(base, persona, f, ts);
  return { projectId: id, facts: f };
}

// Libellé lisible par défaut (jamais d'ID technique) — utilisé par la Conscience si pas de message.
function friendlyName(creeLe) {
  try { const d = new Date(creeLe); return 'Projet · ' + d.getDate() + ' ' + _MOIS[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); }
  catch (e) { return 'Projet'; }
}

module.exports = {
  rroot, personaDir, pdir, fpath, genId, defaultFacts,
  createProject, loadFacts, saveFacts, listProjects, currentProject, friendlyName,
  setIntention, recordDecision, addCandidate, patchMedia, setMediaEtat,
  setPublication, setStatut, setDraft, getDraft, clearDraft, duplicateProject,
};

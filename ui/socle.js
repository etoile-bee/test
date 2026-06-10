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
function defaultFacts(persona, id, ts) {
  const t = iso(ts);
  return {
    projectId: id, persona: persona || 'default',
    cree_le: t, modifie_le: t,
    intention: { message: null, emotion: null, public: null, objectif: null, declencheur: null },
    decisions: [],   // mémoire (action + raison) — vide en Lot 0
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
  const id = (init && init.projectId) || genId(persona, ts);
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

// Libellé lisible par défaut (jamais d'ID technique) — utilisé par la Conscience si pas de message.
function friendlyName(creeLe) {
  try { const d = new Date(creeLe); return 'Projet · ' + d.getDate() + ' ' + _MOIS[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); }
  catch (e) { return 'Projet'; }
}

module.exports = {
  rroot, personaDir, pdir, fpath, genId, defaultFacts,
  createProject, loadFacts, saveFacts, listProjects, currentProject, friendlyName,
};

// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION — référence produit] INVENTAIRE / REPOSITIONNEMENT (LECTURE SEULE).
//   Raccroche l'EXISTANT du repo aux sections de la nouvelle architecture (STUDIO + RÉCENTS).
//   NE crée AUCUN objet : il LIT les stores/configs/assets déjà présents et renvoie des comptes + échantillons.
//   Si une section n'a pas d'objet source (ex. Voix, Templates), elle est rendue VIDE-MAIS-PRÉSENTE (sobre),
//   en réutilisant l'existant le plus proche quand il y en a un (noté dans le rapport). Aucun placeholder média.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const S = require('./socle');

function _readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function _ls(dir, re) { try { return fs.readdirSync(dir).filter(f => !f.startsWith('.') && !f.startsWith('_') && (!re || re.test(f))); } catch (e) { return []; } }
function _looksDir(base) { try { return fs.realpathSync(path.join(base, 'looks')); } catch (e) { return path.join(base, 'looks'); } }

let _libstore = null;
function _lib() { if (_libstore === null) { try { _libstore = require('./cockpit_libstore'); } catch (e) { _libstore = false; } } return _libstore || null; }

// ── STUDIO : 8 sections, chacune raccrochée à sa source existante ──
function avatars(base) {
  const p = _readJSON(path.join(base, 'personas.json'));
  const profiles = (p && p.profiles) || {};
  const items = Object.keys(profiles).map(k => (profiles[k].name || k));
  return { key: 'avatars', icon: '👤', label: 'Avatars', count: items.length, items: items, source: 'personas.json', vide: !items.length };
}
function _cap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
// Libellé LISIBLE d'une tenue (corrige le bug « affichage texte/JSON » dans le sélecteur Look).
function _outfitLabel(o) {
  if (o == null) return 'Look';
  if (typeof o === 'string') return o;
  if (o.label) return o.label; if (o.name) return o.name;
  if (o.cat) return _cap(o.cat) + (o.id != null ? ' #' + o.id : '');     // ex. « Soiree #1 »
  return 'Look' + (o.id != null ? ' #' + o.id : '');
}
function looks(base) {
  const cat = _readJSON(path.join(base, 'outfits_catalog.json'));
  const outfits = (cat && cat.outfits) || [];
  const lb = _readJSON(path.join(base, 'lookbook.json'));
  const saved = (lb && lb.saved) || [];
  const items = outfits.slice(0, 9).map(_outfitLabel);                      // libellés propres (jamais de JSON brut)
  return { key: 'looks', icon: '👗', label: 'Looks', count: outfits.length + saved.length, items: items, source: 'outfits_catalog.json (' + outfits.length + ') + lookbook.saved (' + saved.length + ')', vide: !(outfits.length + saved.length) };
}
function decors(base) {
  let list = [];
  const lib = _lib();
  if (lib && lib.listDecors) { try { list = lib.listDecors(base) || []; } catch (e) { list = []; } }
  if (!list.length) { const lb = _readJSON(path.join(base, 'lookbook.json')); const e = (lb && lb.envs) || {}; list = Object.keys(e).map(k => ({ key: k, label: (e[k] && e[k].label) || k })); }
  return { key: 'decors', icon: '🏛', label: 'Décors', count: list.length, items: list.slice(0, 6).map(d => d.label || d.key), source: 'lookbook.envs', vide: !list.length };
}
function voix(base) {
  // Aucun OBJET « voix » durable n'existe (ElevenLabs est appelé au runtime). Section VIDE-MAIS-PRÉSENTE.
  return { key: 'voix', icon: '🎤', label: 'Voix', count: 0, items: [], source: '(aucun objet voix durable — runtime ElevenLabs)', vide: true };
}
function prompts(base, persona) {
  let names = [];
  const lib = _lib();
  if (lib && lib.listPrompts) { try { names = lib.listPrompts(base, persona) || []; } catch (e) { names = []; } }
  const libr = _readJSON(path.join(base, 'library.json'));
  const scripts = (libr && libr.scripts) || [];
  return { key: 'prompts', icon: '📝', label: 'Prompts', count: names.length + scripts.length, items: names.slice(0, 6), source: 'prompts/ (' + names.length + ') + library.scripts (' + scripts.length + ')', vide: !(names.length + scripts.length) };
}
function templates(base, persona) {
  // Pas d'objet « Template » dans le modèle scellé : on réutilise le plus proche = PRESETS (gabarits de rendu).
  let names = [];
  const lib = _lib();
  if (lib && lib.listPresets) { try { names = lib.listPresets(base, persona) || []; } catch (e) { names = []; } }
  return { key: 'templates', icon: '🎞', label: 'Templates', count: names.length, items: names.slice(0, 6), source: 'presets/ (gabarits de rendu — plus proche existant)', vide: !names.length, note: 'pas d_objet Template dédié' };
}
function references(base) {
  const roots = [path.join(_looksDir(base), 'references', 'imany'), path.join(_looksDir(base), 'references')];
  let n = 0; for (const r of roots) n += _ls(r, /\.(jpg|jpeg|png|webp)$/i).length;
  return { key: 'references', icon: '📎', label: 'Références', count: n, items: [], source: 'looks/references', vide: !n };
}
function parametres(base) {
  const spl = _readJSON(path.join(base, 'styles_par_look.json')) || {};
  const lb = _readJSON(path.join(base, 'lookbook.json'));
  const n = Object.keys(spl).length;
  return { key: 'parametres', icon: '⚙️', label: 'Paramètres', count: n, items: [], source: 'styles_par_look.json + lookbook (style/realism/texture rules, pricing)', vide: !n && !lb };
}

function studioSections(base, persona) {
  return [avatars(base), looks(base), decors(base), voix(base), prompts(base, persona), templates(base, persona), references(base), parametres(base)];
}

// ── RÉCENTS / ARCHIVES : dossiers vivants (Socle réalisation) + héritage legacy (compte, lecture seule) ──
function recents(base, persona) {
  const projets = S.listProjects(base, persona) || [];
  const brouillons = projets.filter(p => (p.statut || 'brouillon') === 'brouillon');
  const actifs = projets.filter(p => (p.statut || '') === 'actif');
  const archives = projets.filter(p => (p.statut || '') === 'archive');
  // Héritage : projets du store cockpit-v4 (lecture seule, repositionnés comme archives héritées)
  let legacy = 0;
  try { legacy = _ls(path.join(base, 'projects', persona || 'imany'), null).length; } catch (e) { legacy = 0; }
  return { projets: projets, brouillons: brouillons, actifs: actifs, archives: archives, legacy: legacy };
}

module.exports = {
  avatars, looks, decors, voix, prompts, templates, references, parametres,
  studioSections, recents,
};

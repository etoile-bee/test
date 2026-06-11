// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] MODÈLES PAR DÉFAUT — objet de stockage MINIMAL (autorisé explicitement par Etoile).
//   But : « Enregistrer par défaut » par outil (prompt · script · tenue · voix · paramètres · sous-titres).
//   Stocke la valeur courante et la RÉUTILISE automatiquement aux prochaines générations / nouveaux projets.
//   1 petit fichier JSON par persona : projects_r/<persona>/v4r_defaults.json. Clé = "<kind>.<field>" (ex: "photo.prompt").
//   Lecture seule de l'existant + écriture ciblée. Ne remplace JAMAIS une valeur déjà saisie (n'écrase pas le travail).
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

function file(base, persona) { return path.join(base, 'projects_r', persona, 'v4r_defaults.json'); }
function load(base, persona) { try { return JSON.parse(fs.readFileSync(file(base, persona), 'utf8')) || {}; } catch (e) { return {}; } }
function save(base, persona, obj) {
  try { fs.mkdirSync(path.dirname(file(base, persona)), { recursive: true }); fs.writeFileSync(file(base, persona), JSON.stringify(obj, null, 2)); } catch (e) {}
  return obj;
}
// Enregistre la valeur courante d'un outil comme DÉFAUT. key = "<kind>.<field>".
function setField(base, persona, kind, field, value) {
  if (value == null || value === '') return load(base, persona);
  const o = load(base, persona); o[kind + '.' + field] = value; return save(base, persona, o);
}
function getField(base, persona, kind, field) { const o = load(base, persona); return o[kind + '.' + field]; }
// Pré-remplit un brouillon avec les défauts du persona, SANS écraser ce qui est déjà renseigné.
function applyTo(base, persona, kind, draft) {
  const o = load(base, persona); const out = Object.assign({}, draft || {});
  Object.keys(o).forEach(k => { const dot = k.indexOf('.'); const kk = k.slice(0, dot), ff = k.slice(dot + 1); if (kk === kind && (out[ff] == null || out[ff] === '')) out[ff] = o[k]; });
  return out;
}
module.exports = { file, load, save, setField, getField, applyTo };

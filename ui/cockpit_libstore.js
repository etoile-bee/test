// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] LOT 2 — CRUD BIBLIOTHÈQUES (looks · décors · prompts · références). Stores existants (E121 : source unique).
//   A3 — DÉCORS : CRUD UNIQUEMENT sur la section `envs` de lookbook.json ; JAMAIS pricing / règles / config système.
//        Sécurité : sauvegarde avant écriture + vérif d'intégrité + ROLLBACK AUTOMATIQUE si corruption détectée.
//   PUR vis-à-vis du réseau ; `base` injectable -> testable.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

function lookbookPath(base) { return path.join(base, 'lookbook.json'); }
// Clés PROTÉGÉES (A3) : le CRUD décor ne doit JAMAIS les modifier.
const PROTECTED_KEYS = ['pricing', 'categories', 'style_rules', 'pose_rules', 'realism_rules', 'texture_rules', 'saved'];

function readLookbook(base) { try { return JSON.parse(fs.readFileSync(lookbookPath(base), 'utf8')); } catch (e) { return null; } }

// Écriture SÛRE de lookbook : applique `mutate` (sur une copie), vérifie l'intégrité (clés protégées inchangées,
// JSON valide), écrit ; en cas d'anomalie -> AUCUNE écriture (rollback) + restauration depuis backup si besoin.
function safeLookbookWrite(base, mutate) {
  const p = lookbookPath(base);
  const original = readLookbook(base);
  if (!original) return { ok: false, error: 'lookbook illisible', rolledback: true };
  const backupStr = JSON.stringify(original);
  // sauvegarde .bak AVANT toute opération
  try { fs.writeFileSync(p + '.bak', backupStr); } catch (e) {}
  // applique la mutation sur une COPIE
  let working;
  try { working = JSON.parse(backupStr); mutate(working); } catch (e) { return { ok: false, error: 'mutation invalide', rolledback: true }; }
  // VÉRIF D'INTÉGRITÉ : clés protégées strictement inchangées (A3)
  for (const k of PROTECTED_KEYS) {
    if (JSON.stringify(working[k]) !== JSON.stringify(original[k])) {
      return { ok: false, error: 'clé protégée modifiée (' + k + ') — refusé', rolledback: true };
    }
  }
  // VÉRIF : sérialisable + relisible
  let out;
  try { out = JSON.stringify(working, null, 2); JSON.parse(out); } catch (e) { return { ok: false, error: 'résultat non sérialisable', rolledback: true }; }
  // écriture atomique + re-lecture de contrôle ; si corruption -> restauration backup
  try {
    fs.writeFileSync(p + '.tmp', out);
    const check = JSON.parse(fs.readFileSync(p + '.tmp', 'utf8'));
    if (JSON.stringify(check.pricing) !== JSON.stringify(original.pricing)) throw new Error('intégrité pricing KO');
    fs.renameSync(p + '.tmp', p);
    return { ok: true };
  } catch (e) {
    try { fs.writeFileSync(p, backupStr); } catch (e2) {} // ROLLBACK
    try { fs.unlinkSync(p + '.tmp'); } catch (e2) {}
    return { ok: false, error: 'corruption détectée -> rollback (' + e.message + ')', rolledback: true };
  }
}

// ── DÉCORS (envs) — CRUD sécurisé A3 ──
function listDecors(base) { const lb = readLookbook(base); const e = (lb && lb.envs) || {}; return Object.keys(e).map(k => ({ key: k, label: e[k].label || k, locked: !!e[k].locked })); }
function addDecor(base, key, data) { return safeLookbookWrite(base, (lb) => { lb.envs = lb.envs || {}; lb.envs[key] = Object.assign({ label: key }, data || {}); }); }
function renameDecor(base, key, label) { return safeLookbookWrite(base, (lb) => { if (lb.envs && lb.envs[key]) lb.envs[key].label = label; }); }
function deleteDecor(base, key) { return safeLookbookWrite(base, (lb) => { if (lb.envs) delete lb.envs[key]; }); }
function lockDecor(base, key, on) { return safeLookbookWrite(base, (lb) => { if (lb.envs && lb.envs[key]) lb.envs[key].locked = !!on; }); }

// ── PROMPTS — CRUD (fichiers prompts/<persona>/*.json) ──
function promptsDir(base, persona) { const d = path.join(base, 'prompts', persona || 'default'); try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} return d; }
function listPrompts(base, persona) { try { return fs.readdirSync(promptsDir(base, persona)).filter(f => /\.json$/.test(f)).map(f => f.replace(/\.json$/, '')); } catch (e) { return []; } }
function savePrompt(base, persona, name, text) { try { fs.writeFileSync(path.join(promptsDir(base, persona), name + '.json'), JSON.stringify({ name: name, text: text || '' }, null, 2)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }
function deletePrompt(base, persona, name) { try { fs.unlinkSync(path.join(promptsDir(base, persona), name + '.json')); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }
function duplicatePrompt(base, persona, name, newName) { try { const src = JSON.parse(fs.readFileSync(path.join(promptsDir(base, persona), name + '.json'), 'utf8')); return savePrompt(base, persona, newName, src.text); } catch (e) { return { ok: false, error: e.message }; } }

// ── LOOKS — CRUD (fichiers looks/) : delete = corbeille (réversible, E18) ──
function looksDir(base) { const d = path.join(base, 'looks'); try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} return d; }
function listLooks(base) { try { return fs.readdirSync(looksDir(base)).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith('.') && !f.startsWith('_')); } catch (e) { return []; } }
function trashLook(base, file) { try { const d = looksDir(base); const t = path.join(d, '_trash'); fs.mkdirSync(t, { recursive: true }); fs.renameSync(path.join(d, file), path.join(t, file)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }
function restoreLook(base, file) { try { const d = looksDir(base); fs.renameSync(path.join(d, '_trash', file), path.join(d, file)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }

// ── Q5 — PRÉRÉGLAGES réutilisables (niveau PERSONA) : crop / zoom / image_fx nommés.
//   E124-safe : un préréglage ne s'applique JAMAIS automatiquement ; le contrôleur le COPIE explicitement dans un projet.
function presetsDir(base, persona) { const d = path.join(base, 'presets', persona || 'default'); try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} return d; }
function listPresets(base, persona) { try { return fs.readdirSync(presetsDir(base, persona)).filter(f => /\.json$/.test(f)).map(f => f.replace(/\.json$/, '')); } catch (e) { return []; } }
function savePreset(base, persona, name, data) { try { fs.writeFileSync(path.join(presetsDir(base, persona), name + '.json'), JSON.stringify({ name: name, image_fx: (data && data.image_fx) || {}, crop: (data && data.crop) || null, zoom: (data && data.zoom) || null }, null, 2)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }
function getPreset(base, persona, name) { try { return JSON.parse(fs.readFileSync(path.join(presetsDir(base, persona), name + '.json'), 'utf8')); } catch (e) { return null; } }
function deletePreset(base, persona, name) { try { fs.unlinkSync(path.join(presetsDir(base, persona), name + '.json')); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }

module.exports = {
  PROTECTED_KEYS, readLookbook, safeLookbookWrite,
  listPresets, savePreset, getPreset, deletePreset,
  listDecors, addDecor, renameDecor, deleteDecor, lockDecor,
  listPrompts, savePrompt, deletePrompt, duplicatePrompt,
  listLooks, trashLook, restoreLook,
};

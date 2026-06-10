// [cockpit-v4] Lot 2 — CRUD bibliothèques + A3 (décors : pricing/règles JAMAIS touchés, rollback auto).
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('../ui/cockpit_libstore');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lib_'));
// lookbook réaliste : décors + pricing + règles (les 2 derniers PROTÉGÉS)
const lb0 = { envs: { bougies: { label: 'Bougies' }, jour: { label: 'Jour' } }, categories: { c1: { label: 'C1' } }, pricing: { eur_per_credit: 0.058, ops: { video30s: 5, image_eco: 1 } }, style_rules: 'RULE', pose_rules: 'POSE' };
fs.writeFileSync(path.join(base, 'lookbook.json'), JSON.stringify(lb0, null, 2));

// DÉCORS CRUD (A3) — n'affecte QUE envs
chk('décors : liste initiale (2)', L.listDecors(base).length === 2);
chk('décors : ajout OK', L.addDecor(base, 'studio', { label: 'Studio', prompt: 'studio bg' }).ok === true);
chk('décors : studio présent', L.listDecors(base).some(d => d.key === 'studio'));
chk('décors : rename OK', L.renameDecor(base, 'studio', 'Studio Pro').ok && L.listDecors(base).find(d => d.key === 'studio').label === 'Studio Pro');
chk('décors : lock OK', L.lockDecor(base, 'studio', true).ok && L.listDecors(base).find(d => d.key === 'studio').locked === true);

// A3 — pricing/règles INCHANGÉS après tout ce CRUD
let lbNow = L.readLookbook(base);
chk('🔒 A3 : pricing INCHANGÉ après CRUD décors', JSON.stringify(lbNow.pricing) === JSON.stringify(lb0.pricing));
chk('🔒 A3 : règles (style/pose) INCHANGÉES', lbNow.style_rules === 'RULE' && lbNow.pose_rules === 'POSE');
chk('🔒 A3 : categories INCHANGÉES', JSON.stringify(lbNow.categories) === JSON.stringify(lb0.categories));

// A3 — une mutation qui TENTE de toucher le pricing est REFUSÉE + rollback (rien n'est écrit)
const before = JSON.stringify(L.readLookbook(base));
const res = L.safeLookbookWrite(base, (lb) => { lb.pricing.eur_per_credit = 999; lb.envs.x = { label: 'X' }; });
chk('🔒 A3 : mutation touchant pricing REFUSÉE (rolledback)', res.ok === false && res.rolledback === true);
chk('🔒 A3 : lookbook INCHANGÉ après tentative (aucune écriture)', JSON.stringify(L.readLookbook(base)) === before);
chk('🔒 A3 : backup .bak créé', fs.existsSync(path.join(base, 'lookbook.json.bak')));
chk('décors : delete OK', L.deleteDecor(base, 'studio').ok && !L.listDecors(base).some(d => d.key === 'studio'));

// PROMPTS CRUD
chk('prompts : save', L.savePrompt(base, 'imany', 'p1', 'texte').ok && L.listPrompts(base, 'imany').indexOf('p1') >= 0);
chk('prompts : duplicate', L.duplicatePrompt(base, 'imany', 'p1', 'p2').ok && L.listPrompts(base, 'imany').indexOf('p2') >= 0);
chk('prompts : delete', L.deletePrompt(base, 'imany', 'p1').ok && L.listPrompts(base, 'imany').indexOf('p1') < 0);

// LOOKS CRUD (corbeille réversible E18)
const ld = path.join(base, 'looks'); fs.mkdirSync(ld, { recursive: true }); fs.writeFileSync(path.join(ld, 'L1.jpg'), 'X');
chk('looks : liste', L.listLooks(base).indexOf('L1.jpg') >= 0);
chk('looks : corbeille (réversible)', L.trashLook(base, 'L1.jpg').ok && L.listLooks(base).indexOf('L1.jpg') < 0);
chk('looks : restauration', L.restoreLook(base, 'L1.jpg').ok && L.listLooks(base).indexOf('L1.jpg') >= 0);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

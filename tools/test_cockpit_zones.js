// [cockpit-v4] Couche créative — ZONES (critères 2/3/4) : 4 workflows, verrous indépendants, historique par zone, étanchéité.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'zones_'));
const persona = 'imany'; const T = s => Date.parse('2026-06-10T' + s + 'Z');
const pid = S.createProject(base, persona, {}, T('10:00:00')).projectId;

// Chaque zone a value/ref_image/prompt/locked/history
let m0 = S.loadManifest(base, persona, pid);
chk('4 zones présentes (réf/look/décor/prompt)', ['reference', 'look', 'decor', 'prompt'].every(z => m0.zones[z] && 'locked' in m0.zones[z] && 'history' in m0.zones[z]));

// Poser décor + look
S.setZone(base, persona, pid, 'decor', { value: 'studio', label: 'Studio', prompt: 'studio bg' }, T('10:01:00'));
S.setZone(base, persona, pid, 'look', { value: 'robe', label: 'Robe noire', prompt: 'black dress' }, T('10:02:00'));
let m = S.loadManifest(base, persona, pid);
chk('zone décor + zone look posées (indépendantes)', m.zones.decor.value === 'studio' && m.zones.look.value === 'robe');
chk('miroir rétro-compat (look.tenue / look.decor)', m.look.tenue === 'Robe noire' && m.look.decor === 'Studio');

// WORKFLOW 1 — même décor + NOUVEAU look (verrou décor) : décor inchangé, look change, historique look
S.lockZone(base, persona, pid, 'decor', true, T('10:03:00'));
S.setZone(base, persona, pid, 'look', { value: 'tailleur', label: 'Tailleur', prompt: 'suit' }, T('10:04:00'));
m = S.loadManifest(base, persona, pid);
chk('WF1 : décor verrouillé INCHANGÉ + look changé', m.zones.decor.value === 'studio' && m.zones.decor.locked === true && m.zones.look.value === 'tailleur');
chk('WF1 : historique look conserve l\'ancien (robe)', m.zones.look.history.some(h => h.value === 'robe'));

// WORKFLOW 2 — même look + NOUVEAU décor (verrou look) : look inchangé, décor change
S.lockZone(base, persona, pid, 'decor', false, T('10:05:00')); S.lockZone(base, persona, pid, 'look', true, T('10:05:30'));
S.setZone(base, persona, pid, 'decor', { value: 'jour', label: 'Jour' }, T('10:06:00'));
m = S.loadManifest(base, persona, pid);
chk('WF2 : look verrouillé INCHANGÉ + décor changé', m.zones.look.value === 'tailleur' && m.zones.decor.value === 'jour');

// WORKFLOW 3 — même image + NOUVEAU prompt (changer seulement le prompt)
S.setZone(base, persona, pid, 'prompt', { value: 'p1', label: 'Prompt A', prompt: 'texte A' }, T('10:07:00'));
S.setZone(base, persona, pid, 'prompt', { value: 'p2', label: 'Prompt B', prompt: 'texte B' }, T('10:08:00'));
m = S.loadManifest(base, persona, pid);
chk('WF3 : prompt changé + historique prompt (A conservé)', m.zones.prompt.value === 'p2' && m.zones.prompt.history.some(h => h.value === 'p1'));

// WORKFLOW 4 — même référence + NOUVEAU décor (verrou réf)
S.lockZone(base, persona, pid, 'reference', true, T('10:09:00'));
S.setZone(base, persona, pid, 'reference', { value: 'imany', label: 'Imany' }, T('10:09:30')); // tentative ; on vérifie surtout l'indépendance
S.setZone(base, persona, pid, 'decor', { value: 'bougies', label: 'Bougies' }, T('10:10:00'));
m = S.loadManifest(base, persona, pid);
chk('WF4 : verrou réf indépendant + décor change librement', m.zones.reference.locked === true && m.zones.decor.value === 'bougies');

// Verrous INDÉPENDANTS (chaque zone son verrou)
chk('verrous indépendants par zone', m.zones.reference.locked === true && m.zones.look.locked === true && m.zones.decor.locked === false);
chk('lockedZones() liste correcte', JSON.stringify(S.lockedZones(m).sort()) === JSON.stringify(['look', 'reference']));

// ÉTANCHÉITÉ — nouveau projet : zones NEUTRES (aucune fuite, E124)
const pid2 = S.createProject(base, persona, {}, T('10:11:00')).projectId;
let m2 = S.loadManifest(base, persona, pid2);
chk('🔒 E124 : nouveau projet — zones neutres (aucune fuite)', m2.zones.decor.value === null && m2.zones.look.locked === false && m2.zones.look.history.length === 0);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

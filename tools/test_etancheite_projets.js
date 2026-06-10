// [cockpit-v4] TEST CRITIQUE PERMANENT (E124 / A4) — ÉTANCHÉITÉ INTER-PROJETS.
// Démontre qu'AUCUN réglage image/filtre/colorimétrie/crop/amélioration/option de rendu ne FUIT d'un projet à un autre.
// C'est la correction structurelle de l'incident « filtre couleur ».
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'etanche_'));
const persona = 'imany';
const T = (s) => Date.parse('2026-06-10T' + s + 'Z');

// PROJET A : on applique des réglages image lourds (couleur/filtre/crop/rendu)
const A = S.createProject(base, persona, { manifest: { name: 'A' } }, T('10:00:00')).projectId;
S.setImageFx(base, persona, A, { brightness: 80, saturation: 60, temperature: 5500, colorgrade: 'V5_chaud' }, T('10:01:00'));
S.setCrop(base, persona, A, { x: 0, y: 0, w: 720, h: 900 }, T('10:02:00'));
let ma = S.loadManifest(base, persona, A);
chk('A : réglages image appliqués (brightness/saturation/colorgrade)', ma.parametres.image_fx.brightness === 80 && ma.parametres.image_fx.colorgrade === 'V5_chaud');
chk('A : crop appliqué', ma.parametres.crop && ma.parametres.crop.h === 900);

// PROJET B créé APRÈS : il doit être NEUTRE — aucune fuite des réglages de A
const B = S.createProject(base, persona, { manifest: { name: 'B' } }, T('10:10:00')).projectId;
let mb = S.loadManifest(base, persona, B);
chk('🔒 B : image_fx NEUTRE (aucune fuite de A)', JSON.stringify(mb.parametres.image_fx) === '{}');
chk('🔒 B : crop NEUTRE (aucune fuite de A)', mb.parametres.crop === null);
chk('🔒 B : colorimétrie NEUTRE (pas de V5_chaud hérité)', !mb.parametres.image_fx.colorgrade);
chk('🔒 B : rendu NEUTRE', JSON.stringify(mb.parametres.rendu || {}) === '{}');

// Modifier B ne doit PAS contaminer A (isolation bidirectionnelle)
S.setImageFx(base, persona, B, { brightness: 10 }, T('10:11:00'));
chk('🔒 A inchangé après modif de B (isolation bidirectionnelle)', S.loadManifest(base, persona, A).parametres.image_fx.brightness === 80);
chk('🔒 B a bien SA valeur (brightness=10)', S.loadManifest(base, persona, B).parametres.image_fx.brightness === 10);

// QC / variantes / livrables aussi hermétiques (chaque projet a les siens)
S.recordQC(base, persona, A, 'ok', { identite: true }, 'Etoile', T('10:12:00'));
chk('🔒 QC de A n\'apparaît pas dans B', !S.loadManifest(base, persona, B).qc && !!S.loadManifest(base, persona, A).qc);
S.setImageOutcome(base, persona, A, 'images/a.jpg', 'livrable', T('10:13:00'));
chk('🔒 livrable de A n\'apparaît pas dans B', S.loadManifest(base, persona, B).livrables.image === null && S.loadManifest(base, persona, A).livrables.image === 'images/a.jpg');

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

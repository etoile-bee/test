// [cockpit-v4] E125 (dossier livrable autonome) + D2 (durée→plans + alerte cohérence) + D1 (override sous-titres projet).
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const COST = require('../ui/cockpit_cost');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'e125_'));
const persona = 'imany'; const T = (s) => Date.parse('2026-06-10T' + s + 'Z');

// E125 — dossier livrable complet à la finalisation
const pid = S.createProject(base, persona, { manifest: { name: 'P' } }, T('10:00:00')).projectId;
S.setActiveMedia(base, persona, pid, 'images/c0.jpg', 'image', T('10:01:00'));
let m = S.loadManifest(base, persona, pid);
m.scripts = [{ name: 'S', text: 'Bonjour à tous' }]; m.legendes = { courte: 'Court', longue: 'Longue version', tags: '#a #b' };
m.livrables = { image: 'images/c0.jpg', video: 'videos/f.mp4' }; S.saveManifest(base, persona, pid, m, T('10:02:00'));
const d = S.buildDeliverable(base, persona, pid, T('10:03:00'));
chk('E125 : dossier livrable créé', !!d && d.id === 'liv1');
chk('E125 : contient vidéo + image + script + légendes courte/longue + hashtags', d.video === 'videos/f.mp4' && d.images.length === 1 && d.script && d.legende_courte === 'Court' && d.legende_longue === 'Longue version' && d.hashtags === '#a #b');
chk('E125 : contient params + infos + raws + exports', !!d.parametres && d.infos.projectId === pid && 'raws' in d && 'exports' in d);
chk('E125 : COMPLET (publiable sans reconstruire le contexte)', S.deliverableComplete(d) === true);
chk('E125 : fichier deliverable.json autonome écrit', fs.existsSync(path.join(S.projectDir(base, persona, pid), 'exports', 'liv1', 'deliverable.json')));
chk('E125 : projet = conteneur unique (dossier livrable DANS le projet)', S.loadManifest(base, persona, pid).livrables_dossiers.length === 1);

// D2 — durée finale -> nb plans, temps/plan ; cohérence script/durée
const a1 = COST.adaptMontage(23, 'un script de longueur raisonnable pour vingt-trois secondes ici environ', 1);
chk('D2 : durée->plans (1 plan, sec/plan)', a1.plans === 1 && a1.sec_per_plan === 23);
const a3 = COST.adaptMontage(30, 'court', 3);
chk('D2 : 3 plans retenus -> temps/plan = 10s', a3.plans === 3 && a3.sec_per_plan === 10);
chk('D2 : script INCOHÉRENT (trop court) -> ALERTE + proposition', a3.coherent === false && /incohérent/.test(a3.alerte) && !!a3.suggestion);
const longScript = Array.from({ length: 200 }, () => 'mot').join(' ');
const a4 = COST.adaptMontage(15, longScript, 1);
chk('D2 : script trop long pour 15s -> alerte', a4.coherent === false && /allonger|raccourcir/.test(a4.suggestion));
const a5 = COST.adaptMontage(23, Array.from({ length: 57 }, () => 'mot').join(' '), 1);
chk('D2 : script cohérent -> pas d\'alerte', a5.coherent === true && a5.alerte === null);

// D1 — override sous-titres PROJET (jamais subtitle_style.js)
S.setSubsOverride(base, persona, pid, { size: 80, color: 'jaune' }, T('10:05:00'));
chk('D1 : override sous-titres stocké DANS le projet', S.loadManifest(base, persona, pid).parametres.subs_override.size === 80);
const pid2 = S.createProject(base, persona, {}, T('10:06:00')).projectId;
chk('🔒 D1/E124 : nouveau projet sans override (pas de fuite)', S.loadManifest(base, persona, pid2).parametres.subs_override === null);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

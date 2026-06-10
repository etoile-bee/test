// [cockpit-v4] Test du module dossier projet (source de vérité). Hors-ligne, dossier temp.
const fs = require('fs');
const os = require('os');
const path = require('path');
const PS = require('../ui/project_store');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pstore_'));
const persona = 'imany';

// 1. Création projet -> dossier + manifest + sous-dossiers
const { projectId, manifest } = PS.createProject(base, persona, { manifest: { name: 'Projet A' } }, Date.parse('2026-06-10T10:00:00Z'));
chk('1. projectId généré', /^imany_2026-06-10/.test(projectId));
chk('1. dossier projet créé', fs.existsSync(PS.projectDir(base, persona, projectId)));
chk('1. manifest écrit', fs.existsSync(PS.manifestPath(base, persona, projectId)));
chk('1. sous-dossiers créés (images, exports, raw...)', PS.SUBDIRS.every(s => fs.existsSync(path.join(PS.projectDir(base, persona, projectId), s))));
chk('1. statut initial = brouillon', manifest.statut === 'brouillon');
chk('1. media_actif initial null', manifest.media_actif === null);

// 2. Import d'un fichier image + setActiveMedia (média validé = média actif persistant)
const tmpImg = path.join(base, 'src.jpg'); fs.writeFileSync(tmpImg, 'JPEGDATA');
const relImg = PS.importFile(base, persona, projectId, 'images', tmpImg, 'img1.jpg');
chk('2. fichier importé dans images/', relImg === 'images/img1.jpg' && fs.existsSync(path.join(PS.projectDir(base, persona, projectId), relImg)));
PS.setActiveMedia(base, persona, projectId, relImg, 'image', Date.parse('2026-06-10T10:05:00Z'));
let m2 = PS.loadManifest(base, persona, projectId);
chk('2. media_actif persisté dans le manifest', m2.media_actif === 'images/img1.jpg');
chk('2. activeMediaAbs résout le bon fichier', PS.activeMediaAbs(base, persona, projectId) === path.join(PS.projectDir(base, persona, projectId), 'images/img1.jpg'));
chk('2. historique des versions enregistre la validation', m2.historique_versions.length === 1 && m2.historique_versions[0].action === 'validé');

// 3. PERSISTANCE : recharger depuis le disque (simule restart/reprise des jours après) -> média actif retrouvé
const reloaded = PS.loadManifest(base, persona, projectId);
chk('3. après rechargement (restart/reprise), media_actif intact', reloaded.media_actif === 'images/img1.jpg');
chk('3. tous les champs autoporteurs présents', ['reference','look','prompts','scripts','legendes','parametres','couts','moteur_ia','livrables','historique_versions'].every(k => k in reloaded));

// 4. « Nouveau » = archive l'ancien (jamais détruit), crée un nouveau dossier
PS.archiveProject(base, persona, projectId, Date.parse('2026-06-10T11:00:00Z'));
const arch = PS.loadManifest(base, persona, projectId);
chk('4. ancien projet ARCHIVÉ (pas supprimé)', arch.statut === 'archive' && fs.existsSync(PS.manifestPath(base, persona, projectId)));
const p2 = PS.createProject(base, persona, { manifest: { name: 'Projet B' } }, Date.parse('2026-06-10T11:01:00Z'));
chk('4. nouveau projet distinct créé', p2.projectId !== projectId && fs.existsSync(PS.projectDir(base, persona, p2.projectId)));

// 5. listProjects (tri récent d'abord) + currentProject (reprise)
const list = PS.listProjects(base, persona);
chk('5. listProjects renvoie les 2 projets', list.length === 2);
chk('5. tri : le plus récent en tête', list[0].projectId === p2.projectId);
const cur = PS.currentProject(base, persona);
chk('5. currentProject = le brouillon en cours (pas l\'archivé)', cur && cur.projectId === p2.projectId);

// 6. Conservation des fichiers : l'archivé garde son dossier + média
chk('6. fichiers de l\'archivé conservés', fs.existsSync(path.join(PS.projectDir(base, persona, projectId), 'images/img1.jpg')));

// cleanup
try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

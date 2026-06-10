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
chk('1. statut_qualite initial = brouillon (C3)', manifest.statut_qualite === 'brouillon');
chk('1. statut_publication initial = aucun (C3)', manifest.statut_publication === 'aucun');
chk('1. media_actif initial null', manifest.media_actif === null);
chk('1. champs E93 présents (raws/rapport_qc/qc/prompts)', ['raws','rapport_qc','qc','prompts','scripts','moteur_ia','couts'].every(k => k in manifest));

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

// 4. C4/E92 — contrôle qualité enregistré (verdict dans dossier + rapport QC)
PS.recordQC(base, persona, projectId, 'ok', { identite: true, coherence: true, reference: true, look: true }, 'Etoile', Date.parse('2026-06-10T10:30:00Z'));
let mqc = PS.loadManifest(base, persona, projectId);
chk('4. QC verdict enregistré dans le manifest', mqc.qc && mqc.qc.verdict === 'ok' && mqc.qc.details.identite === true);
chk('4. QC ajouté au rapport_qc (E93)', mqc.rapport_qc.length === 1 && mqc.rapport_qc[0].par === 'Etoile');

// 4bis. E93.5 — raw jamais écrasé
PS.setRaw(base, persona, projectId, 'image', 'raw/src_raw.jpg', Date.parse('2026-06-10T10:31:00Z'));
PS.setRaw(base, persona, projectId, 'image', 'raw/AUTRE.jpg', Date.parse('2026-06-10T10:32:00Z'));
chk('4bis. raw image NON écrasé (E93.5)', PS.loadManifest(base, persona, projectId).raws.image === 'raw/src_raw.jpg');

// 5. C3 — deux axes de statut indépendants
PS.setStatutQualite(base, persona, projectId, 'production', Date.parse('2026-06-10T10:40:00Z'));
PS.setStatutPublication(base, persona, projectId, 'pret_a_poster', Date.parse('2026-06-10T10:41:00Z'));
let m5 = PS.loadManifest(base, persona, projectId);
chk('5. axes statut indépendants (qualite=production, publication=pret_a_poster)', m5.statut_qualite === 'production' && m5.statut_publication === 'pret_a_poster');

// 6. « Nouveau » = archive l'ancien (jamais détruit), crée un nouveau dossier
PS.archiveProject(base, persona, projectId, Date.parse('2026-06-10T11:00:00Z'));
const arch = PS.loadManifest(base, persona, projectId);
chk('6. ancien projet ARCHIVÉ via publication (pas supprimé)', arch.statut_publication === 'archive' && fs.existsSync(PS.manifestPath(base, persona, projectId)));
const p2 = PS.createProject(base, persona, { manifest: { name: 'Projet B' } }, Date.parse('2026-06-10T11:01:00Z'));
chk('6. nouveau projet distinct créé', p2.projectId !== projectId && fs.existsSync(PS.projectDir(base, persona, p2.projectId)));

// 7. C2/E121 — SOURCE UNIQUE : les vues sont des filtres du MÊME magasin
const hist = PS.viewHistorique(base, persona);
chk('7. Historique = magasin complet (2 projets)', hist.length === 2);
chk('7. tri récent d\'abord', hist[0].projectId === p2.projectId);
chk('7. viewArchives = filtre (l\'ancien)', PS.viewArchives(base, persona).length === 1 && PS.viewArchives(base, persona)[0].projectId === projectId);
chk('7. viewPretAPoster vide (l\'ancien est passé archive)', PS.viewPretAPoster(base, persona).length === 0);
chk('7. viewBrouillons = le nouveau (p2)', PS.viewBrouillons(base, persona).length === 1 && PS.viewBrouillons(base, persona)[0].projectId === p2.projectId);
const cur = PS.currentProject(base, persona);
chk('7. currentProject = brouillon en cours (pas l\'archivé)', cur && cur.projectId === p2.projectId);

// 8. Conservation des fichiers : l'archivé garde son dossier + média
chk('8. fichiers de l\'archivé conservés', fs.existsSync(path.join(PS.projectDir(base, persona, projectId), 'images/img1.jpg')));

// cleanup
try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

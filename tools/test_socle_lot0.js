// [RÉALISATION — Lot 0] Test SOCLE : source unique, faits durables, reconstruction identique, aucune dérivation stockée (INV-9/10).
const S = require('../ui/socle');
const fs = require('fs'); const path = require('path'); const os = require('os');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'socle_lot0_'));
const persona = 'imany';
const now = Date.UTC(2026, 5, 11, 13, 0, 0);

// Création
const { projectId, facts } = S.createProject(base, persona, {}, now);
chk('création : identifiant stable (M18) renvoyé', !!projectId && facts.projectId === projectId);
chk('création : facts.json écrit dans le Socle (source unique)', fs.existsSync(S.fpath(base, persona, projectId)));
chk('création : intention composite présente (esquissable, nulls)', facts.intention && ('message' in facts.intention) && ('objectif' in facts.intention));
chk('création : mémoire vide (decisions [])', Array.isArray(facts.decisions) && facts.decisions.length === 0);

// INV-9 : aucune dérivation stockée dans les faits
const raw = JSON.parse(fs.readFileSync(S.fpath(base, persona, projectId), 'utf8'));
const interdits = ['situation', 'titre', 'etat', 'signaux', 'focalisation', 'tensions', 'miroir'];
chk('INV-9 : AUCUNE dérivation stockée dans facts.json', interdits.every(k => !(k in raw)));

// Reconstruction identique : recharger redonne les mêmes faits durables
const a = S.loadFacts(base, persona, projectId);
const b = S.loadFacts(base, persona, projectId);
chk('reconstruction : deux relectures identiques', JSON.stringify(a) === JSON.stringify(b));
chk('reconstruction : identité stable préservée après relecture', a.projectId === projectId);

// currentProject = le plus récent ; identité stable conservée
chk('currentProject : retrouve le projet', (S.currentProject(base, persona) || {}).projectId === projectId);

// Source unique : un seul fichier de faits écrit (facts.json)
const dir = S.pdir(base, persona, projectId);
const files = fs.readdirSync(dir);
chk('source unique : seul facts.json dans le dossier projet', files.length === 1 && files[0] === 'facts.json');

// friendlyName lisible (pas d'ID technique)
chk('nom lisible par défaut (pas d\'ID technique)', /Projet · \d{1,2} \w+ \d{2}h\d{2}/.test(S.friendlyName(facts.cree_le)));

// ── Écritures de faits (colonne vertébrale) : intention, décision, candidate simulée ──
S.setIntention(base, persona, projectId, { message: 'réveille-toi puissante', emotion: 'douceur' }, now + 10);
const f2 = S.loadFacts(base, persona, projectId);
chk('setIntention : cap écrit dans le Socle (fait durable)', f2.intention.message === 'réveille-toi puissante' && f2.intention.emotion === 'douceur');
S.recordDecision(base, persona, projectId, 'cap posé', 'recentrage', 'Etoile', now + 20);
chk('recordDecision : mémoire +1 (action + raison)', S.loadFacts(base, persona, projectId).decisions.length === 1);
S.addCandidate(base, persona, projectId, now + 30);
const f3 = S.loadFacts(base, persona, projectId);
chk('addCandidate : fait-média candidate (simulé) déposé', f3.medias.length === 1 && f3.medias[0].etat === 'candidate' && f3.medias[0].simule === true);
chk('étanchéité : écritures restées dans le MÊME projet', f3.projectId === projectId);

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

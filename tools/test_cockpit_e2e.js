// [cockpit-v4] AUTO-AUDIT E118 — PARCOURS COMPLET PHOTO -> VIDÉO via l'intégration (transport mocké).
// Prouve le parcours de bout en bout au niveau logique (le réel Telegram = campagne de tests à la bascule).
const fs = require('fs'), os = require('os'), path = require('path');
const PS = require('../ui/project_store');
const { createCockpitV4 } = require('../ui/cockpit_integration');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e_'));
const persona = 'imany';
let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
const placeholder = path.join(base, 'ph.jpg'); fs.writeFileSync(placeholder, 'PH');
function gen(flow, m) { const dir = path.join(PS.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true }); const r = []; for (let i = 0; i < (m.parametres.nb_images || 1); i++) { const f = 'c' + i + '.jpg'; fs.writeFileSync(path.join(dir, f), 'I'); r.push('images/' + f); } return r; }

function prims() { const c = { sendPhoto: 0, editPhoto: 0, editCaption: 0 }; let s = 300; return { c, sendPhoto: async () => { c.sendPhoto++; return { ok: true, result: { message_id: ++s } }; }, editPhoto: async (mid) => { c.editPhoto++; return { ok: true, result: { message_id: mid } }; }, editCaption: async () => { c.editCaption++; return { ok: true }; }, sendVideo: async () => { return { ok: true, result: { message_id: ++s } }; }, editVideo: async () => { return { ok: true }; } }; }

(async () => {
  const p = prims();
  const V = createCockpitV4({ prims: p, base, persona, generate: gen, libItems: () => [], placeholder, now });

  await V.openHome();                              // bloc #1
  await V.handle('go:photo');
  const pid = V.controller.ui.projectId;
  chk('parcours: projet unique créé', !!pid);

  // PHOTO : générer 2 candidats, en rejeter 1, garder l'autre
  await V.handle('NB_2'); await V.handle('SRC_NEW');
  await V.handle('CAND_REJECT');                   // rejette c0
  await V.handle('CAND_NEXT'); await V.handle('CAND_KEEP'); // garde c1
  let m = PS.loadManifest(base, persona, pid);
  chk('PHOTO: image gardée = média actif', m.media_actif === 'images/c1.jpg');
  chk('E123: image rejetée JAMAIS en livrable/Prêt-à-poster', m.rejetees.indexOf('images/c0.jpg') >= 0 && m.livrables.image === null);

  await V.handle('V');                             // source -> parametres
  await V.handle('V');                             // parametres -> finaliser
  chk('PHOTO: arrivé en finaliser', V.controller.ui.step === 'finaliser');
  await V.handle('V');                             // finaliser sans QC -> bloqué
  chk('E92/C4: finaliser bloqué sans QC (pas de dépense)', V.controller.ui.step === 'finaliser' && PS.loadManifest(base, persona, pid).statut_publication !== 'pret_a_poster');
  await V.handle('QC_RUN');
  chk('QC enregistré dans le dossier', !!PS.loadManifest(base, persona, pid).qc);
  await V.handle('V');                             // finaliser photo -> phase VIDÉO (livrables video coché par défaut)
  chk('(A) image finalisée -> phase VIDÉO, MÊME projet', V.controller.ui.flow === 'video' && V.controller.ui.projectId === pid);
  chk('(A) projet pas encore prêt-à-poster (vidéo à venir)', PS.loadManifest(base, persona, pid).statut_publication !== 'pret_a_poster');

  // VIDÉO : source = image auto ; script (écrit par l'éditeur = manifest) ; finaliser -> prêt-à-poster
  chk('(A) VIDÉO source auto-satisfaite (image) -> parametres', V.controller.ui.step === 'parametres');
  let mv = PS.loadManifest(base, persona, pid); mv.scripts = [{ name: 'S', text: 'Coucou', duree: '23s' }]; PS.saveManifest(base, persona, pid, mv, now());
  await V.handle('RESUME');                        // recharge l'étape (script -> finaliser dispo)
  V.controller.ui.step = 'finaliser';
  await V.handle('QC_FORCE'); await V.handle('V'); // finaliser vidéo
  let mf = PS.loadManifest(base, persona, pid);
  chk('VIDÉO finalisée -> production + PRÊT-À-POSTER', mf.statut_qualite === 'production' && mf.statut_publication === 'pret_a_poster');
  chk('livrable vidéo enregistré', 'video' in mf.livrables);

  // INVARIANT bloc unique : un SEUL sendPhoto depuis l'accueil (tout le reste en place)
  chk('BLOC UNIQUE: 1 seul sendPhoto sur tout le parcours (fin F1)', p.c.sendPhoto === 1);
  chk('édition en place sur tout le parcours (editPhoto/editCaption > 0)', (p.c.editPhoto + p.c.editCaption) > 5);

  // SOURCE UNIQUE (E121) : le projet est dans l'Historique, et en Prêt-à-poster (vue filtrée)
  chk('E121: projet visible dans Historique (magasin unique)', PS.viewHistorique(base, persona).some(x => x.projectId === pid));
  chk('E121: projet visible dans la vue Prêt-à-poster (filtre)', PS.viewPretAPoster(base, persona).some(x => x.projectId === pid));

  // REPRISE après "restart" : nouveau cockpit, tout retrouvé
  const p2 = prims(); const V2 = createCockpitV4({ prims: p2, base, persona, generate: gen, libItems: () => [], placeholder, now });
  await V2.resume();
  chk('REPRISE: après restart, le projet est rouvert (1 bloc)', p2.c.sendPhoto === 1);

  try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
})();

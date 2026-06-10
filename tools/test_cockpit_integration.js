// [cockpit-v4] Test intégration (glue) : bloc média unique de bout en bout, placeholder, navigate, toast, résolution média.
const fs = require('fs'), os = require('os'), path = require('path');
const PS = require('../ui/project_store');
const { createCockpitV4 } = require('../ui/cockpit_integration');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'integ_'));
const persona = 'imany';
let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
const placeholder = path.join(base, 'placeholder.jpg'); fs.writeFileSync(placeholder, 'PH');

function fakeGenerate(flow, m) {
  const dir = path.join(PS.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'cand0.jpg'), 'IMG'); return ['images/cand0.jpg'];
}

// Primitives mockées : comptent + capturent le média envoyé
function mockPrims() {
  const c = { sendPhoto: 0, editPhoto: 0, editCaption: 0, lastMedia: null, lastMid: null }; let seq = 200;
  return {
    counts: c,
    sendPhoto: async (media) => { c.sendPhoto++; c.lastMedia = media; return { ok: true, result: { message_id: ++seq } }; },
    editPhoto: async (mid, media) => { c.editPhoto++; c.lastMid = mid; c.lastMedia = media; return { ok: true, result: { message_id: mid } }; },
    editCaption: async (mid) => { c.editCaption++; c.lastMid = mid; return { ok: true }; },
    sendVideo: async () => { return { ok: true, result: { message_id: ++seq } }; },
    editVideo: async (mid) => { return { ok: true }; },
  };
}

(async () => {
  let toasts = [];
  const prims = mockPrims();
  const V = createCockpitV4({ prims, base, persona, generate: fakeGenerate, libItems: () => [], placeholder, now, toast: async (x) => toasts.push(x) });

  // 1. openHome -> 1 sendPhoto avec PLACEHOLDER (bloc média unique même sans projet)
  await V.openHome();
  chk('1. openHome -> 1 sendPhoto (placeholder)', prims.counts.sendPhoto === 1 && prims.counts.lastMedia === placeholder);

  // 2. go:photo -> édition EN PLACE (même bloc), toujours placeholder (pas encore de média)
  await V.handle('go:photo');
  chk('2. go:photo -> editPhoto (pas de nouveau bloc)', prims.counts.sendPhoto === 1 && prims.counts.editPhoto >= 1);

  // 3. SRC_NEW + CAND_PICK -> média projet résolu en ABSOLU, édité dans le MÊME bloc
  await V.handle('SRC_NEW');
  await V.handle('CAND_PICK');
  const pid = V.controller.ui.projectId;
  const expectedAbs = path.join(PS.projectDir(base, persona, pid), 'images/cand0.jpg');
  chk('3. média projet résolu en absolu + édité en place', prims.counts.lastMedia === expectedAbs && prims.counts.sendPhoto === 1);
  chk('3. média actif persisté dans le manifest', PS.loadManifest(base, persona, pid).media_actif === 'images/cand0.jpg');

  // 4. notice -> toast (jamais un nouveau message)
  toasts = [];
  await V.handle('V'); // source -> parametres (pas de notice) ; testons un toast via V verrouillé plus bas
  await V.handle('V'); // parametres -> finaliser
  const res = await V.handle('V'); // finaliser sans QC -> notice (toast)
  chk('4. action verrouillée -> toast (notice), pas de message', toasts.length >= 1 && prims.counts.sendPhoto === 1);

  // 5. /menu (openHome) -> NOUVEAU bloc persistant (navigate, E111)
  await V.openHome();
  chk('5. openHome (navigate) -> nouveau sendPhoto', prims.counts.sendPhoto === 2);

  // 6. resume() après "restart" : rouvre le projet en cours -> bloc avec le média actif
  const prims2 = mockPrims();
  const V2 = createCockpitV4({ prims: prims2, base, persona, generate: fakeGenerate, libItems: () => [], placeholder, now });
  await V2.resume();
  chk('6. resume -> 1 bloc, média actif du projet retrouvé', prims2.counts.sendPhoto === 1 && prims2.counts.lastMedia === expectedAbs);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
})();

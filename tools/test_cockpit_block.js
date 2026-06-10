// [cockpit-v4] Test identité de bloc UNIQUE (fin de F1). Transport mocké : on COMPTE les envois/éditions.
const { createCockpitBlock } = require('../ui/cockpit_block');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

// Mock transport : compte sendPhoto/sendVideo/editMedia/editVideo/editCaption + simule des message_id croissants.
function mockTg(opts) {
  const c = { sendPhoto: 0, sendVideo: 0, editMedia: 0, editVideo: 0, editCaption: 0, lastEditMid: null };
  let seq = 100;
  const failEditOnce = opts && opts.failEditOnce;
  let failed = false;
  return {
    counts: c,
    sendPhoto: async () => { c.sendPhoto++; return { message_id: ++seq }; },
    sendVideo: async () => { c.sendVideo++; return { message_id: ++seq }; },
    editMedia: async (mid) => { if (failEditOnce && !failed) { failed = true; throw new Error('message to edit not found'); } c.editMedia++; c.lastEditMid = mid; },
    editVideo: async (mid) => { c.editVideo++; c.lastEditMid = mid; },
    editCaption: async (mid) => { c.editCaption++; c.lastEditMid = mid; },
  };
}

(async () => {
  // 1. Premier show -> 1 sendPhoto, mid fixé
  let tg = mockTg(); let B = createCockpitBlock(tg);
  const mid1 = await B.show({ media: 'img1.jpg', caption: 'A', rows: [] });
  chk('1. 1er show => 1 sendPhoto, mid défini', tg.counts.sendPhoto === 1 && mid1 != null);

  // 2. Navigations/éditions EN PLACE successives -> editMedia sur le MÊME mid, ZÉRO nouveau bloc (fin F1)
  await B.show({ media: 'img2.jpg', caption: 'B', rows: [] }); // ex : étape suivante / nouvelle image
  await B.edit({ media: 'img2_filtre.jpg', caption: 'B+filtre', rows: [] }); // édition image avancée
  await B.edit({ media: 'img2_subs.jpg', caption: 'B+subs', rows: [] }); // sous-titres
  chk('2. éditions en place => MÊME mid (pas de nouveau bloc)', B.id() === mid1);
  chk('2. ZÉRO sendPhoto supplémentaire (fin F1)', tg.counts.sendPhoto === 1);
  chk('2. 3 editMedia sur le bon mid', tg.counts.editMedia === 3 && tg.counts.lastEditMid === mid1);

  // 3. Caption seule (réglages/boutons) -> editCaption, même mid, pas de re-upload image
  await B.show({ caption: 'B (réglages)', rows: [['x']] });
  chk('3. caption seule => editCaption (pas editMedia)', tg.counts.editCaption === 1 && tg.counts.editMedia === 3);
  chk('3. toujours le même mid', B.id() === mid1);

  // 4. navigate:true (=/menu ou résultat livré) -> NOUVEAU bloc persistant, on adopte le nouveau mid
  const mid2 = await B.show({ media: 'home.jpg', caption: 'ACCUEIL', rows: [] }, { navigate: true });
  chk('4. navigate => nouveau sendPhoto', tg.counts.sendPhoto === 2);
  chk('4. nouveau mid adopté (≠ ancien)', mid2 !== mid1 && B.id() === mid2);

  // 5. Bascule média photo->vidéo EN PLACE (résultat vidéo) -> editVideo, même mid
  await B.edit({ video: 'final.mp4', caption: 'Vidéo', rows: [] });
  chk('5. édition vidéo en place => editVideo, même mid', tg.counts.editVideo === 1 && B.id() === mid2);

  // 6. Stale-fix : si l'édition échoue (message supprimé) -> 1 seul renvoi, on adopte le nouveau mid (1 seule identité)
  let tg2 = mockTg({ failEditOnce: true }); let B2 = createCockpitBlock(tg2);
  const m = await B2.show({ media: 'x.jpg', caption: 'X', rows: [] }); // sendPhoto #1
  const m2 = await B2.edit({ media: 'y.jpg', caption: 'Y', rows: [] }); // editMedia échoue -> sendFresh
  chk('6. stale-fix => fallback sendPhoto (pas de crash)', tg2.counts.sendPhoto === 2);
  chk('6. nouvelle identité unique adoptée', m2 !== m && B2.id() === m2);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
})();

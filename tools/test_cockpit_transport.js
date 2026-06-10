// [cockpit-v4] Test adaptateur transport : conversion rows->inline_keyboard, message_id, flag raw, throw-sur-échec, intégration block.
const T = require('../ui/cockpit_transport');
const { createCockpitBlock } = require('../ui/cockpit_block');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

// 1. toInlineKeyboard : cb -> callback_data ; go:'x' -> 'go:x' ; vide -> undefined
const kb = T.toInlineKeyboard([[{ text: 'A', cb: 'V' }, { text: 'P', go: 'photo' }], [{ text: 'x', }]]);
chk('1. cb -> callback_data', kb.inline_keyboard[0][0].callback_data === 'V');
chk('1. go:photo -> callback_data go:photo', kb.inline_keyboard[0][1].callback_data === 'go:photo');
chk('1. bouton sans cb/go -> NOOP', kb.inline_keyboard[1][0].callback_data === 'NOOP');
chk('1. rows vides -> undefined', T.toInlineKeyboard([]) === undefined);

// 2. midOf : extrait message_id des deux formes de réponse
chk('2. midOf {message_id}', T.midOf({ message_id: 7 }) === 7);
chk('2. midOf {result:{message_id}}', T.midOf({ result: { message_id: 9 } }) === 9);

// Mock primitives bas-niveau : enregistrent les appels + le flag raw
function mockPrims(opts) {
  const calls = [];
  let seq = 500;
  const failEdit = opts && opts.failEdit;
  return {
    calls,
    sendPhoto: async (media, cap, rm, raw) => { calls.push({ m: 'sendPhoto', media, raw, hasKb: !!rm }); return { ok: true, result: { message_id: ++seq } }; },
    editPhoto: async (mid, media, cap, rm, raw) => { calls.push({ m: 'editPhoto', mid, media, raw }); return failEdit ? { ok: false } : { ok: true, result: { message_id: mid } }; },
    editCaption: async (mid, cap, rm) => { calls.push({ m: 'editCaption', mid }); return { ok: true }; },
    sendVideo: async (media, cap, rm) => { calls.push({ m: 'sendVideo', media }); return { ok: true, result: { message_id: ++seq } }; },
    editVideo: async (mid, media, cap, rm) => { calls.push({ m: 'editVideo', mid }); return { ok: true }; },
  };
}

(async () => {
  // 3. sendPhoto -> message_id extrait + flag RAW (image brute, verrou 9)
  let p = mockPrims(); let tr = T.createTransport(p);
  const r = await tr.sendPhoto('img.jpg', 'cap', [[{ text: 'A', cb: 'V' }]]);
  chk('3. sendPhoto renvoie {message_id}', r.message_id === 501);
  chk('3. image envoyée en BRUT (raw=true)', p.calls[0].m === 'sendPhoto' && p.calls[0].raw === true);

  // 4. editMedia -> editPhoto avec raw ; editCaption ; sendVideo ; editVideo
  await tr.editMedia(501, 'img2.jpg', 'c2', [[{ text: 'B', cb: 'X' }]]);
  await tr.editCaption(501, 'c3', null);
  await tr.editVideo(501, 'v.mp4', 'c4', null);
  chk('4. editMedia -> editPhoto(raw)', p.calls.some(c => c.m === 'editPhoto' && c.raw === true));
  chk('4. editCaption mappé', p.calls.some(c => c.m === 'editCaption'));
  chk('4. editVideo mappé', p.calls.some(c => c.m === 'editVideo'));

  // 5. échec d'édition -> LÈVE (déclenche le stale-fix de cockpit_block)
  let pf = mockPrims({ failEdit: true }); let trf = T.createTransport(pf);
  let threw = false; try { await trf.editMedia(1, 'x', 'c', null); } catch (e) { threw = true; }
  chk('5. editMedia échec -> throw (pour stale-fix)', threw === true);

  // 6. INTÉGRATION : cockpit_block au-dessus du transport -> 1 seul bloc, éditions en place, stale-fix
  let p6 = mockPrims(); let B = createCockpitBlock(T.createTransport(p6));
  const mid = await B.show({ media: 'a.jpg', caption: 'A', rows: [[{ text: 'x', cb: 'V' }]] });
  await B.edit({ media: 'b.jpg', caption: 'B', rows: [] });
  await B.show({ caption: 'C (réglages)', rows: [] });
  chk('6. intégration : 1 seul sendPhoto (bloc unique)', p6.calls.filter(c => c.m === 'sendPhoto').length === 1);
  chk('6. intégration : éditions en place (editPhoto + editCaption sur le même mid)', p6.calls.some(c => c.m === 'editPhoto' && c.mid === mid) && p6.calls.some(c => c.m === 'editCaption' && c.mid === mid));

  // 7. INTÉGRATION stale-fix : si editPhoto échoue, le bloc renvoie un nouveau message (1 seule identité)
  let p7 = mockPrims({ failEdit: true }); let B7 = createCockpitBlock(T.createTransport(p7));
  await B7.show({ media: 'a.jpg', caption: 'A', rows: [] });   // sendPhoto #1
  await B7.edit({ media: 'b.jpg', caption: 'B', rows: [] });    // editPhoto échoue -> sendPhoto #2
  chk('7. stale-fix via transport : 2 sendPhoto, pas de crash', p7.calls.filter(c => c.m === 'sendPhoto').length === 2);

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
})();

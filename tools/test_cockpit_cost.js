// [cockpit-v4] Test coûts (Lot 8) : estimation image/vidéo, lookbook.pricing, panneau avant dépense.
const C = require('../ui/cockpit_cost');
let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }

const lb = { pricing: { eur_per_credit: 0.058, ops: { image_eco: 1, video30s: 5 } } };

// IMAGE
const i = C.estimate('image', { nb_images: 3, mode: 'eco', format: '9:16' }, lb);
chk('image: nb=3, moteur Seedream', i.nb === 3 && i.moteur === 'Seedream');
chk('image: crédits = 3×1, € = 3×0.058', i.credits === 3 && i.eur === 0.174);
chk('image: fallback 1cr/img sans pricing', C.estimate('image', { nb_images: 2 }, {}).credits === 2);

// VIDÉO
const v = C.estimate('video', { duree: '23s', format: '9:16' }, lb);
chk('vidéo: 1 part (23s), moteurs Anthropic+ElevenLabs+Kling', v.nb === 1 && /Kling/.test(v.moteur));
chk('vidéo: crédits lipsync = 5×1', v.credits === 5);
chk('vidéo: € = voix + lipsync', v.eur > 0 && v.detail.voix_eur > 0 && v.detail.lipsync_eur > 0);
const v2 = C.estimate('video', { duree: '45s' }, lb);
chk('vidéo: 45s -> 2 parts', v2.nb === 2 && v2.credits === 10);

// PANEL (E11) — durée·nb·format·moteur·coût·crédits
const p = C.panel(v, 120);
chk('panel: durée présente', /⏱ 23s/.test(p));
chk('panel: format + moteur', /🖼 9:16/.test(p) && /⚙️/.test(p));
chk('panel: coût cr ≈ €', /💳 5 cr ≈/.test(p));
chk('panel: crédits restants', /🔋 120 cr/.test(p));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

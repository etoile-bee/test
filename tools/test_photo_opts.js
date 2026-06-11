// [RÉALISATION /v4r] Mapping PROJET -> moteur photo (dry-run, AUCUN appel, zéro dépense).
const PO = require('../ui/photo_opts');
let ok = 0, ko = 0; function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }

const lb = { categories: { soiree: { prompt: 'robe' }, business: {}, casual: {} }, envs: { bougies: { label: '🕯 Bougies' }, jour: { label: '☀️ Jour' }, studio: { label: '🎙 Studio réaliste' } } };
const cat = { outfits: [{ id: 1, cat: 'soiree', prompt: 'black halter silk evening dress' }, { id: 2, cat: 'business', prompt: 'tailored blazer' }] };

let r = PO.buildPhotoOpts({ prompt: 'studio chaud', look: 'Soiree #1', decor: '🕯 Bougies' }, lb, cat);
chk('prompt -> basePrompt', r.opts.basePrompt === 'studio chaud');
chk('look « Soiree #1 » -> tenue EXACTE du catalogue (extra)', r.opts.extra === 'black halter silk evening dress' && r.opts.category === 'soiree');
chk('décor « 🕯 Bougies » -> clé env « bougies »', r.opts.env === 'bougies');
chk('mode éco + 1 image', r.opts.mode === 'eco' && r.opts.count === 1);
chk('aucun non-mappable ici', r.unmapped.length === 0);

r = PO.buildPhotoOpts({ look: 'Business #2', decor: '☀️ Jour' }, lb, cat);
chk('look « Business #2 » -> tenue catalogue', r.opts.extra === 'tailored blazer' && r.opts.env === 'jour');

r = PO.buildPhotoOpts({ look: 'Soiree #99' }, lb, cat); // id absent du catalogue -> repli catégorie
chk('look id absent -> repli catégorie (soiree)', r.opts.category === 'soiree' && !r.opts.extra);

r = PO.buildPhotoOpts({ prompt: 'x', refs: '2', format: '1:1', decor: 'inconnu' }, lb, cat);
chk('références NON mappables -> signalées (pas inventées)', r.unmapped.some(u => /références/.test(u)));
chk('format ≠ 9:16 NON mappable -> signalé', r.unmapped.some(u => /format/.test(u)));
chk('décor inconnu -> signalé (pas inventé)', r.unmapped.some(u => /décor/.test(u)));

r = PO.buildPhotoOpts({}, lb, cat);
chk('projet vide -> défauts moteur (aucun champ forcé)', !r.opts.basePrompt && !r.opts.extra && !r.opts.env && r.opts.mode === 'eco');

const t = PO.trace({ prompt: 'studio chaud', look: 'Soiree #1', decor: '🕯 Bougies' }, lb, cat);
chk('trace lisible (prompt+outfit+décor)', /prompt=/.test(t) && /outfit=/.test(t) && /décor=bougies/.test(t) && /enverrait au moteur/.test(t));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

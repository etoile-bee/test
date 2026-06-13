// [🔴3/4 — H13] PREUVE : génération en cours CLAIRE. 2 états distincts sur confirm2 :
//   (a) AVANT clic = « Confirmer la génération ? » avec ✅ Oui / ◀ Annuler, SANS « en cours ».
//   (b) PENDANT = « 📸/🎬 Génération en cours… » SANS Oui/Annuler (aucun re-clic). Photo ET vidéo.
//   Le verrou r0Busy empêche tout re-clic de R0_GO côté handler (déjà en place).
process.env.R0_DRYRUN = '1';
const fs = require('fs');
const SC = require('../ui/screens');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };
const flat = v => [].concat.apply([], v.rows || []);
const cbs = v => flat(v).map(b => b.cb);

const facts = { medias: [{ id: 'm1', etat: 'candidate', type: 'image', file: '/x.jpg' }] };
const estC = { est: { credits: 8, eur: 0.48, moteur: 'Seedream' }, budget: { tests: 3, max: 10, next: 4, exhausted: false } };

// (a) AVANT : état confirmation normal
const before = SC.confirm2View(facts, { confirm: Object.assign({ mediaKind: 'photo', live: true }, estC) });
chk('(a) AVANT clic : ✅ Oui, générer présent (R0_GO)', cbs(before).includes('R0_GO'));
chk('(a) AVANT clic : ◀ Annuler présent (R0_GO2_CANCEL)', cbs(before).includes('R0_GO2_CANCEL'));
chk('(a) AVANT clic : PAS de texte « en cours »', !/en cours/i.test(before.caption));

// (b) PENDANT — PHOTO
const genP = SC.confirm2View(facts, { generating: true, genStep: 'Seedream · ~30 s', confirm: Object.assign({ mediaKind: 'photo', live: true }, estC) });
chk('(b) PENDANT photo : « 📸 Génération en cours… »', /📸/.test(genP.caption) && /en cours/i.test(genP.caption));
chk('(b) PENDANT photo : AUCUN bouton de dépense (ni R0_GO ni R0_GO2)', !cbs(genP).includes('R0_GO') && !cbs(genP).includes('R0_GO2'));
chk('(b) PENDANT photo : AUCUN Annuler re-cliquable', !cbs(genP).includes('R0_GO2_CANCEL'));
chk('(b) PENDANT photo : aucun bouton du tout (0 re-clic possible)', flat(genP).length === 0);
chk('(b) PENDANT photo : étape affichée (genStep)', /Seedream/.test(genP.caption));

// (b) PENDANT — VIDÉO
const genV = SC.confirm2View({ medias: [{ id: 'v1', etat: 'candidate', type: 'video', file: '/v.mp4' }] }, { generating: true, genStep: 'lipsync 2/4', confirm: { mediaKind: 'video', live: true, est: { credits: 50, eur: 2.9, moteur: 'Kling' }, budget: { tests: 3, max: 10, next: 4, exhausted: false } } });
chk('(b) PENDANT vidéo : « 🎬 Génération en cours… »', /🎬/.test(genV.caption) && /en cours/i.test(genV.caption));
chk('(b) PENDANT vidéo : AUCUN bouton de dépense', !cbs(genV).includes('R0_GO') && !cbs(genV).includes('R0_GO2'));
chk('(b) PENDANT vidéo : étape (X/Y) affichée', /2\/4/.test(genV.caption));

// CÂBLAGE handler : le flag r0Generating est posé ET nettoyé (finally) dans les 2 branches réelles
const src = fs.readFileSync(require('path').join(__dirname, '..', 'telegram_bot.js'), 'utf8');
chk('câblage : r0Generating posé pendant la génération (photo+vidéo)', (src.match(/r0Generating=true/g) || []).length >= 2);
chk('câblage : r0Generating nettoyé en finally (anti-blocage)', (src.match(/finally\s*\{[\s\S]*?r0Generating=false[\s\S]*?r0GenLock\(false\)/g) || []).length >= 2);
chk('câblage : verrou r0Busy bloque tout re-clic de R0_GO', /d==='R0_GO' && r0Busy/.test(src));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

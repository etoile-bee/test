// [cockpit-v4] Test du moteur de parcours (grammaire symétrique, gates média réel, Valider→next, QC gate).
const F = require('../ui/cockpit_flow');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

// Symétrie PHOTO ≡ VIDÉO : mêmes étapes
chk('symétrie : mêmes étapes PHOTO/VIDÉO', JSON.stringify(F.steps()) === JSON.stringify(['source', 'parametres', 'finaliser']));
chk('grammaire : source = 1re étape', F.firstStep() === 'source');
chk('grammaire : finaliser = dernière', F.isLast('finaliser') && !F.isLast('source'));
chk('aperçu n\'est PAS une étape', F.steps().indexOf('apercu') === -1 && F.steps().indexOf('pret_a_poster') === -1);

// APERÇU permanent : média visible dès qu'il existe
chk('aperçu permanent : média actif visible', F.previewMedia({ media_actif: 'images/x.jpg' }) === 'images/x.jpg');
chk('aperçu : null si pas de média', F.previewMedia({}) === null);

// GATES basés sur le MÉDIA RÉEL (pas un drapeau)
const vide = {};
const avecMedia = { media_actif: 'images/x.jpg' };
chk('PHOTO source verrouillé sans média réel', F.canValidate('photo', 'source', vide) === false);
chk('PHOTO source débloqué dès média actif', F.canValidate('photo', 'source', avecMedia) === true);

// PHOTO : Valider source -> parametres ; parametres -> finaliser ; finaliser bloqué tant que QC absent
let r1 = F.validate('photo', 'source', avecMedia);
chk('PHOTO Valider(source) -> parametres', r1.ok && r1.next === 'parametres');
let r2 = F.validate('photo', 'parametres', avecMedia);
chk('PHOTO Valider(parametres) -> finaliser', r2.ok && r2.next === 'finaliser');
let r3 = F.validate('photo', 'finaliser', avecMedia);
chk('PHOTO finaliser BLOQUÉ sans QC (C4/E92)', r3.ok === false && /qualité/i.test(r3.reason));
let r3b = F.validate('photo', 'finaliser', { media_actif: 'images/x.jpg', qc: { verdict: 'ok' } });
chk('PHOTO finaliser OK après QC -> action finaliser + effet publication', r3b.ok && r3b.action === 'finaliser' && r3b.effect.statut_publication === 'pret_a_poster' && r3b.effect.statut_qualite === 'production');

// VIDÉO : parametres exige un script (gate différent mais grammaire identique)
chk('VIDÉO source débloqué par média', F.canValidate('video', 'source', avecMedia) === true);
chk('VIDÉO parametres bloqué sans script', F.canValidate('video', 'parametres', avecMedia) === false);
chk('VIDÉO parametres débloqué avec script', F.canValidate('video', 'parametres', { media_actif: 'x', scripts: [{ text: 'Bonjour' }] }) === true);
let rv = F.validate('video', 'parametres', { media_actif: 'x', scripts: [{ text: 'Bonjour' }] });
chk('VIDÉO Valider(parametres) -> finaliser', rv.ok && rv.next === 'finaliser');

// resumeStep : 1re étape non satisfaite (reprise après restart)
chk('resume : projet vide -> source', F.resumeStep('photo', vide) === 'source');
chk('resume : média mais pas QC -> finaliser', F.resumeStep('photo', avecMedia) === 'finaliser');
chk('resume : tout OK -> finaliser (dernière)', F.resumeStep('photo', { media_actif: 'x', qc: { verdict: 'ok' } }) === 'finaliser');

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

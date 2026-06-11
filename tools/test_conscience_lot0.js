// [RÉALISATION — Lot 0] Test CONSCIENCE : dérivations pures, déterministes, recalculables ; repos sans média ; Loi II (pas d'interprétation).
const S = require('../ui/socle');
const C = require('../ui/conscience');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }

const now = Date.UTC(2026, 5, 11, 13, 0, 0);

// Faits « vides » (cap non posé)
const vide = S.defaultFacts('imany', 'imany_x', now);
chk('état dérivé : brouillon quand le cap est vide', C.etat(vide) === '📝 brouillon');
chk('titre dérivé : « cap à poser » quand vide', /cap à poser/.test(C.titre(vide)));

// Faits avec cap amorcé (esquissé)
const pose = S.defaultFacts('imany', 'imany_y', now);
pose.intention.message = 'réveille-toi puissante';
pose.intention.emotion = 'douceur';
chk('état dérivé : en cours quand le cap est amorcé', C.etat(pose) === '⏳ en cours');
chk('cap dérivé : reflète message + émotion', /réveille-toi puissante/.test(C.capLine(pose)) && /douceur/.test(C.capLine(pose)));

// Déterminisme : mêmes faits -> même titre (reconstruction identique)
chk('déterminisme : titre stable pour mêmes faits', C.titre(pose) === C.titre(pose));

// Recalculable depuis une « relecture » (copie des faits) — pas d'état caché
const relu = JSON.parse(JSON.stringify(pose));
chk('recalcul : dérivation identique depuis les faits rechargés', C.titre(relu) === C.titre(pose) && JSON.stringify(C.situation(relu)) === JSON.stringify(C.situation(pose)));

// La situation est un OBJET DÉRIVÉ (pas une source) : la calculer ne modifie pas les faits
const avant = JSON.stringify(pose);
C.situation(pose); C.titre(pose);
chk('INV-9 : dériver ne modifie jamais les faits (non stocké)', JSON.stringify(pose) === avant);

// Repos SANS média : la lecture est purement textuelle (aucune notion de média ici)
chk('repos sans média : titre = texte, aucun champ média produit', typeof C.titre(pose) === 'string');

// Loi II (Lot 0) : la Conscience ne produit aucun jugement de sens (pas de « bon/fort/sert l'émotion »)
const t = C.titre(pose).toLowerCase();
chk('Loi II : aucune attribution de sens dans le titre', !/(bon|fort|faible|réussi|sert l'|cohérent au sens)/.test(t));

// ── Focalisation → prochain geste : OPTION A, MENÉ PAR LA CRÉATION (déterministe) ──
chk('geste : aucun média -> ✨ Créer une image (R0_IMG), même sans cap', C.prochainGeste(vide).cb === 'R0_IMG');
const avecCap = S.defaultFacts('imany', 'imany_z', now); avecCap.intention.message = 'x';
chk('geste : cap posé, aucun média -> ✨ Créer une image (création primaire)', C.prochainGeste(avecCap).cb === 'R0_IMG');
const avecImg = JSON.parse(JSON.stringify(avecCap)); avecImg.medias = [{ id: 'm1', etat: 'candidate', simule: true, type: 'image' }];
chk('geste : image présente, pas de vidéo -> 🎬 Faire une vidéo (R0_VID)', C.prochainGeste(avecImg).cb === 'R0_VID');
const avecVid = JSON.parse(JSON.stringify(avecImg)); avecVid.medias.push({ id: 'm2', etat: 'candidate', simule: true, type: 'video' });
chk('geste : vidéo présente -> 🔁 Regénérer l\'image (R0_REGEN)', C.prochainGeste(avecVid).cb === 'R0_REGEN');
chk('geste : déterministe (même faits -> même geste)', C.prochainGeste(avecCap).cb === C.prochainGeste(avecCap).cb);
// ── Lecture des manifestations par nature (image/vidéo) ──
chk('médias : hasImage vrai dès une image', C.hasImage(avecImg) && !C.hasVideo(avecImg));
chk('médias : hasVideo vrai dès une vidéo', C.hasVideo(avecVid) && C.hasImage(avecVid));
chk('médias : mediaKind = vidéo > image > texte', C.mediaKind(avecVid) === 'video' && C.mediaKind(avecImg) === 'photo' && C.mediaKind(vide) === 'text');
chk('situation : compte les médias (fait)', C.situation(avecImg).medias === 1);

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

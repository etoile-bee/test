// [RÉALISATION colonne vertébrale] Test des VUES pures : 1 prochain geste (pas de doublon), boutons réduits, sobre, photo seulement si image.
const S = require('../ui/socle');
const V = require('../ui/spine_view');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function nbtn(view) { return flat(view.rows).length; }

const now = Date.UTC(2026, 5, 11, 13, 0, 0);
const f0 = S.defaultFacts('imany', 'imany_a', now);                         // projet frais (vide)
const fcap = S.defaultFacts('imany', 'imany_b', now); fcap.intention.message = 'réveille-toi puissante'; fcap.intention.emotion = 'douceur'; fcap.intention.objectif = 'court';
const fimg = JSON.parse(JSON.stringify(fcap)); fimg.medias = [{ id: 'm1', etat: 'candidate', simule: true }];

// REPOS projet frais : TEXTE (pas de photo), sobre, 1 prochain geste, pas de doublon "Prochain geste"
const r0 = V.reposView(f0, false);
chk('repos frais : kind TEXTE (aucune image -> pas de placeholder)', r0.kind === 'text');
chk('repos : PAS de ligne texte « Prochain geste » (doublon supprimé)', !/Prochain geste/i.test(r0.caption));
chk('repos : 1er bouton = LE prochain geste (proposition unique)', r0.rows[0].length === 1 && r0.rows[0][0].cb === 'R0_CAP');
chk('repos : nav libre présente (Cap/Mémoire/Nouveau)', flat(r0.rows).some(b => b.cb === 'R0_CAP') && flat(r0.rows).some(b => b.cb === 'R0_MEM') && flat(r0.rows).some(b => b.cb === 'R0_NEW'));
chk('repos : boutons réduits (≤ 4)', nbtn(r0) <= 4);
chk('repos : caption compacte (< 220 car.)', r0.caption.length < 220);

// REPOS avec image affichable : PHOTO (le projet s'ouvre dessus)
const rImg = V.reposView(fimg, true);
chk('repos avec image : kind PHOTO (proéminence visuelle, pas centre conceptuel)', rImg.kind === 'photo');
chk('repos avec image : compte les images', /🖼 1/.test(rImg.caption));
// MAIS si pas de photo affichable, on NE force PAS une photo (pas de placeholder)
chk('repos image mais pas de photo dispo : reste TEXTE (jamais de placeholder)', V.reposView(fimg, false).kind === 'text');

// CAP : compact, peu de boutons (≤ 5), émotion/objectif ouvrent un sous-choix (pas 10 boutons d'un coup)
const cv = V.capView(fcap);
chk('cap : boutons réduits (≤ 5)', nbtn(cv) <= 5);
chk('cap : émotion/objectif = sous-vues (pas toutes les présélections d\'un coup)', flat(cv.rows).some(b => b.cb === 'R0_CAPE') && flat(cv.rows).some(b => b.cb === 'R0_CAPO') && !flat(cv.rows).some(b => /^R0_EMO_/.test(b.cb)));
chk('cap : retour repos présent', flat(cv.rows).some(b => b.cb === 'R0_REPOS'));

// Sous-vues émotion/objectif : présélections + retour, ≤ 6 boutons
const ev = V.emoView(fcap), ov = V.objView(fcap);
chk('émotion : présélections + retour (≤ 6)', nbtn(ev) <= 6 && flat(ev.rows).some(b => b.cb === 'R0_EMO_douceur'));
chk('objectif : présélections + retour (≤ 6)', nbtn(ov) <= 6 && flat(ov.rows).some(b => b.cb === 'R0_OBJ_court'));

// MÉMOIRE : lisible, retour unique
const mv = V.memView(fcap);
chk('mémoire : un seul bouton (retour repos)', nbtn(mv) === 1 && mv.rows[0][0].cb === 'R0_REPOS');

// Aucune vue n'affiche plus de 6 boutons simultanés (charge mobile)
chk('charge mobile : toutes les vues ≤ 6 boutons', [r0, rImg, cv, ev, ov, mv, V.askView('message')].every(v => nbtn(v) <= 6));

// Déterminisme (mêmes faits -> même rendu)
chk('déterminisme : repos stable', JSON.stringify(V.reposView(fcap, false)) === JSON.stringify(V.reposView(fcap, false)));

// Sobriété : aucun jargon dev dans les captions
const allcap = [r0, rImg, cv, ev, ov, mv].map(v => v.caption).join(' ').toLowerCase();
chk('sobriété : aucun jargon dev (lot/socle/dérivation/placeholder)', !/(lot 0|socle|dérivation|placeholder|dev\b)/.test(allcap));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

// [RÉALISATION colonne vertébrale] Test des VUES pures : projet vivant, cap en ligne (puces), mémoire mappée, 1 prochain geste.
const S = require('../ui/socle');
const V = require('../ui/spine_view');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function nbtn(view) { return flat(view.rows).length; }

const now = Date.UTC(2026, 5, 11, 13, 0, 0);
const f0 = S.defaultFacts('imany', 'imany_a', now);
const fcap = S.defaultFacts('imany', 'imany_b', now); fcap.intention.message = 'Trouver un format podcast viral'; fcap.intention.emotion = 'punch'; fcap.intention.objectif = 'court';
const fimg = JSON.parse(JSON.stringify(fcap)); fimg.medias = [{ id: 'm1', etat: 'candidate', simule: true }];

// REPOS vide : sobre mais CADRÉ (pas de « — » sec)
const r0 = V.reposView(f0);
chk('repos vide : « Nouveau projet » + cap à définir (cadré, pas sec)', /Nouveau projet/.test(r0.caption) && /à définir/.test(r0.caption));
chk('repos : PAS de doublon « Prochain geste » (ligne supprimée)', !/Prochain geste/i.test(r0.caption));
chk('repos : 1er bouton = LE prochain geste', r0.rows[0].length === 1 && r0.rows[0][0].cb === 'R0_CAP');
chk('repos : nav minimale (Cap/Mémoire/Nouveau)', ['R0_CAP', 'R0_MEM', 'R0_NEW'].every(c => flat(r0.rows).some(b => b.cb === c)));
chk('repos vide : boutons réduits (≤ 4)', nbtn(r0) <= 4);

// REPOS vivant : message = TITRE fort, émotion/objectif en sous-ligne
const rv = V.reposView(fcap);
chk('repos vivant : message = titre fort', /🎯 <b>Trouver un format podcast viral<\/b>/.test(rv.caption));
chk('repos vivant : émotion + objectif en sous-ligne', /punch/.test(rv.caption) && /court/.test(rv.caption));
chk('repos vivant : prochain geste = convoquer une image', rv.rows[0][0].cb === 'R0_IMG');
const ri = V.reposView(fimg);
chk('repos avec image : compte les images + geste = regénérer', /🖼 1/.test(ri.caption) && ri.rows[0][0].cb === 'R0_REGEN');

// CAP EN LIGNE : puces émotion/objectif DANS la vue cap (pas de sous-vue, pas de [⬅ Cap])
const cv = V.capView(fcap);
const cbs = flat(cv.rows).map(b => b.cb);
chk('cap : puces émotion inline (R0_EMO_*)', cbs.filter(c => /^R0_EMO_/.test(c)).length === 4);
chk('cap : puces objectif inline (R0_OBJ_*)', cbs.filter(c => /^R0_OBJ_/.test(c)).length === 3);
chk('cap : AUCUNE sous-vue (pas de R0_CAPE/R0_CAPO ni [⬅ Cap])', !cbs.includes('R0_CAPE') && !cbs.includes('R0_CAPO'));
chk('cap : un SEUL retour cohérent = Repos', cbs.filter(c => c === 'R0_REPOS').length === 1 && !cbs.some(c => c === 'R0_CAP'));
chk('cap : puce sélectionnée marquée (🔵)', flat(cv.rows).some(b => /🔵/.test(b.text)));
chk('cap : message éditable inline', cbs.includes('R0_MSG'));

// MÉMOIRE : langage projet, mappée sur l'existant, pas « 0 décision(s) » sec ; 1 retour
const mv = V.memView(fcap);
chk('mémoire : langage projet (Cap/Émotion/Objectif/Images/Décisions)', /Cap :/.test(mv.caption) && /Émotion :/.test(mv.caption) && /Images :/.test(mv.caption) && /Décisions :/.test(mv.caption));
chk('mémoire : mappée sur l\'existant (reflète émotion posée)', /punch/.test(mv.caption));
chk('mémoire : un seul retour (Repos)', nbtn(mv) === 1 && mv.rows[0][0].cb === 'R0_REPOS');

// Sobriété : aucun jargon dev
const allcap = [r0, rv, ri, cv, mv].map(v => v.caption).join(' ').toLowerCase();
chk('sobriété : aucun jargon dev', !/(lot 0|socle|dérivation|placeholder|message_id|dev\b)/.test(allcap));

// Déterminisme
chk('déterminisme : repos vivant stable', JSON.stringify(V.reposView(fcap)) === JSON.stringify(V.reposView(fcap)));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

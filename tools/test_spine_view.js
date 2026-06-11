// [RÉALISATION colonne vertébrale] Test des VUES pures — OPTION A : repos MENÉ PAR LA CRÉATION,
//   image/vidéo dominantes dès qu'elles existent, cap = ancrage léger (jamais un gate), mémoire mappée.
const S = require('../ui/socle');
const V = require('../ui/spine_view');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function nbtn(view) { return flat(view.rows).length; }

const now = Date.UTC(2026, 5, 11, 13, 0, 0);
const f0 = S.defaultFacts('imany', 'imany_a', now);
const fcap = S.defaultFacts('imany', 'imany_b', now); fcap.intention.message = 'Trouver un format podcast viral'; fcap.intention.emotion = 'punch'; fcap.intention.objectif = 'court';
const fimg = JSON.parse(JSON.stringify(fcap)); fimg.medias = [{ id: 'm1', etat: 'candidate', simule: true, type: 'image' }];
const fvid = JSON.parse(JSON.stringify(fimg)); fvid.medias.push({ id: 'm2', etat: 'candidate', simule: true, type: 'video' });

// REPOS VIDE : mené par « Créer », pas par le cap. Geste primaire = Créer une image.
const r0 = V.reposView(f0);
chk('repos vide : MENÉ PAR LA CRÉATION (✨ Créer)', /Créer/.test(r0.caption));
chk('repos vide : 1er bouton = ✨ Créer une image (R0_IMG)', r0.rows[0].length === 1 && r0.rows[0][0].cb === 'R0_IMG');
chk('repos vide : cap est un ancrage LÉGER (présent mais pas en tête)', flat(r0.rows).some(b => b.cb === 'R0_CAP') && r0.rows[0][0].cb !== 'R0_CAP');
chk('repos vide : nav minimale (Créer/Cap/Mémoire/Nouveau)', ['R0_IMG', 'R0_CAP', 'R0_MEM', 'R0_NEW'].every(c => flat(r0.rows).some(b => b.cb === c)));
chk('repos vide : PAS de doublon « Prochain geste »', !/Prochain geste/i.test(r0.caption));

// REPOS avec CAP mais SANS média : toujours mené par la création (le cap n'est pas un gate vers l'image).
const rv = V.reposView(fcap);
chk('repos cap-sans-image : message = titre fort', /🎯 <b>Trouver un format podcast viral<\/b>/.test(rv.caption));
chk('repos cap-sans-image : geste primaire reste ✨ Créer une image', rv.rows[0][0].cb === 'R0_IMG');

// REPOS avec IMAGE : carte média, actions de création visibles (Regénérer + Faire une vidéo).
const ri = V.reposView(fimg);
chk('repos image : compte les images', /🖼 1/.test(ri.caption));
chk('repos image : 1ère ligne = 🔁 Regénérer · 🎬 Faire une vidéo', ri.rows[0][0].cb === 'R0_REGEN' && ri.rows[0][1].cb === 'R0_VID' && /Faire une vidéo/.test(ri.rows[0][1].text));

// REPOS avec VIDÉO : la vidéo est mentionnée ; on peut la refaire.
const rvi = V.reposView(fvid);
chk('repos vidéo : la vidéo est signalée', /🎬 vidéo/.test(rvi.caption));
chk('repos vidéo : action = 🎬 Refaire la vidéo', rvi.rows[0].some(b => b.cb === 'R0_VID' && /Refaire/.test(b.text)));

// CAP EN LIGNE : puces émotion/objectif DANS la vue cap (pas de sous-vue, pas de [⬅ Cap])
const cv = V.capView(fcap);
const cbs = flat(cv.rows).map(b => b.cb);
chk('cap : puces émotion inline (R0_EMO_*)', cbs.filter(c => /^R0_EMO_/.test(c)).length === 4);
chk('cap : puces objectif inline (R0_OBJ_*)', cbs.filter(c => /^R0_OBJ_/.test(c)).length === 3);
chk('cap : AUCUNE sous-vue (pas de R0_CAPE/R0_CAPO)', !cbs.includes('R0_CAPE') && !cbs.includes('R0_CAPO'));
chk('cap : un SEUL retour cohérent = Repos', cbs.filter(c => c === 'R0_REPOS').length === 1);
chk('cap : puce sélectionnée marquée (🔵)', flat(cv.rows).some(b => /🔵/.test(b.text)));

// MÉMOIRE : langage projet, mappée sur l'existant (dont vidéos), 1 retour
const mv = V.memView(fvid);
chk('mémoire : langage projet (Cap/Émotion/Objectif/Images/Vidéos/Décisions)', /Cap :/.test(mv.caption) && /Images :/.test(mv.caption) && /Vidéos :/.test(mv.caption) && /Décisions :/.test(mv.caption));
chk('mémoire : reflète images ET vidéo', /🖼 Images : 1/.test(mv.caption) && /🎬 Vidéos : 1/.test(mv.caption));
chk('mémoire : un seul retour (Repos)', nbtn(mv) === 1 && mv.rows[0][0].cb === 'R0_REPOS');

// Sobriété : aucun jargon dev
const allcap = [r0, rv, ri, rvi, cv, mv].map(v => v.caption).join(' ').toLowerCase();
chk('sobriété : aucun jargon dev', !/(lot 0|socle|dérivation|placeholder|message_id|ffmpeg|dev\b)/.test(allcap));
chk('déterminisme : repos image stable', JSON.stringify(V.reposView(fimg)) === JSON.stringify(V.reposView(fimg)));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

// [cockpit-v4] Test bibliothèques/vues : consult≠modif (anti-A1), sélection explicite, retour exact, source unique (E121), grille 6/écran.
const L = require('../ui/cockpit_lib');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

// STUDIO = uniquement bibliothèques (C.7)
const s = L.studio();
chk('STUDIO : Looks/Références/Scripts/Prompts/Médias/Archives', ['lib.looks', 'lib.refs', 'lib.scripts', 'lib.prompts', 'lib.medias', 'lib.archives'].every(x => cbs(s).indexOf(x) >= 0));
chk('STUDIO : retour exact (RESUME)', cbs(s).indexOf('RESUME') >= 0);

// GRILLE : 6/écran, tap = CONSULTER (LV_), PAS appliquer (anti-A1)
const items = Array.from({ length: 14 }, (_, i) => ({ label: 'Look ' + i, img: 'l' + i + '.jpg' }));
const g0 = L.grid('looks', items, 0);
const g0cbs = cbs(g0);
chk('grille : 6 vignettes/écran (E22/E36/E53)', g0cbs.filter(x => /^LV_looks_/.test(x)).length === 6);
chk('grille : AUCUNE application au parcours (pas de LA_ dans la grille) — anti-A1', g0cbs.every(x => !/^LA_/.test(x)));
chk('grille : pagination présente (14 items > 6)', g0cbs.some(x => /^LP_looks_/.test(x)));
chk('grille : retour exact (RESUME)', g0cbs.indexOf('RESUME') >= 0);
const g1 = L.grid('looks', items, 1);
chk('grille : page 2 décale les index', cbs(g1).indexOf('LV_looks_6') >= 0);

// DÉTAIL : application EXPLICITE séparée (verrou 6)
const d = L.detail('looks', 3, items[3]);
const dcbs = cbs(d);
chk('détail : application EXPLICITE (LA_)', dcbs.indexOf('LA_looks_3') >= 0);
chk('détail : retour liste + retour projet (RESUME)', dcbs.indexOf('LB_looks') >= 0 && dcbs.indexOf('RESUME') >= 0);
chk('détail : image consultée affichée', d.media === 'l3.jpg');

// SOURCE UNIQUE (E121) : RÉCENTS/HISTORIQUE/PRÊT-À-POSTER = filtres du même magasin (mêmes données projets)
const projets = [
  { projectId: 'imany_A', name: 'A', statut_qualite: 'production', statut_publication: 'pret_a_poster', modifie_le: '2026-06-10T12:00:00Z' },
  { projectId: 'imany_B', name: 'B', statut_qualite: 'brouillon', statut_publication: 'aucun', modifie_le: '2026-06-10T11:00:00Z' },
];
const rc = L.recents(projets);
chk('RÉCENTS = vue (titre indique « vue de l\'Historique »)', /vue/i.test(rc.caption));
chk('RÉCENTS : ouvre un projet (OPEN_<id>)', cbs(rc).indexOf('OPEN_imany_A') >= 0);
chk('HISTORIQUE : mémoire complète (mêmes projets que la source)', cbs(L.historique(projets)).indexOf('OPEN_imany_B') >= 0);
chk('PRÊT-À-POSTER : rendu file (titre)', /PRÊT-À-POSTER/i.test(L.pretAPoster([projets[0]]).caption));
chk('vue projets vide gérée', /vide|·\s*0/.test(L.recents([]).caption) || cbs(L.recents([])).indexOf('NOOP') >= 0);

// ── V4 — NETTOYAGE TOTAL : libellés LISIBLES (zéro ID technique, zéro statut brut) ──
function texts(c) { return flat(c.rows).map(b => b.text).join(' | '); }
const rcTxt = texts(L.recents(projets));
chk('V4 : pas de statut technique brut (enum souligné / combiné) dans la liste', !/pret_a_poster|statut_|production\/|\/aucun/.test(rcTxt));
chk('V4 : état LISIBLE affiché (finalisé/prêt-à-poster/en cours/brouillon)', /finalisé|prêt-à-poster|en cours|brouillon/.test(rcTxt));
// projet SANS nom : aucun ID technique ne fuit (libellé générique « Projet »)
const noName = L.recents([{ projectId: 'imany_2026-06-10_15-52-00', statut_qualite: 'brouillon', statut_publication: 'aucun', cree_le: '2026-06-10T15:52:00Z' }]);
chk('V4 : aucun ID technique affiché (projet sans nom)', !/imany_2026/.test(texts(noName)));
chk('V4 : liste vide = message lisible (pas « (vide) »)', !/\(vide\)/.test(texts(L.recents([]))));
chk('V4 : grille biblio = titre lisible (Références, pas REFS)', /Références/.test(L.grid('refs', items, 0).caption) && !/REFS/.test(L.grid('refs', items, 0).caption));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

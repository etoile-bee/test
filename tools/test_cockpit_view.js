// [cockpit-v4] Test des vues du cockpit (accueil E104, grammaire, Valider gated, aperçu permanent, Paramètres lignes, QC gate, E35/E36).
const V = require('../ui/cockpit_view');

let ok = 0, ko = 0;
function chk(label, cond) { if (cond) { ok++; console.log('✅ ' + label); } else { ko++; console.log('❌ ' + label); } }
function flat(rows) { return [].concat.apply([], rows); }
function cbs(content) { return flat(content.rows).map(b => b.cb || b.go); }
function texts(content) { return flat(content.rows).map(b => b.text).join(' | '); }

// ── Accueil E104 (4 entrées, RÉCENTS inclus) ──
const h = V.home();
chk('accueil : 4 entrées E104 (photo/video/studio/recents)', ['photo', 'video', 'studio', 'recents'].every(x => cbs(h).indexOf(x) >= 0));

// ── Aperçu permanent : media = media_actif à chaque étape ──
const mMedia = { name: 'P', media_actif: 'images/x.jpg', parametres: { nb_images: 1 } };
chk('aperçu permanent SOURCE', V.view('photo', 'source', mMedia).media === 'images/x.jpg');
chk('aperçu permanent PARAMÈTRES', V.view('photo', 'parametres', mMedia).media === 'images/x.jpg');
chk('aperçu permanent FINALISER', V.view('photo', 'finaliser', mMedia).media === 'images/x.jpg');

// ── Valider gated (C1/E108) : verrouillé sans média, actif avec ──
const vide = { name: 'P', parametres: { nb_images: 1 } };
chk('Valider VERROUILLÉ sans média (source)', cbs(V.view('photo', 'source', vide)).indexOf('V_LOCK') >= 0 && cbs(V.view('photo', 'source', vide)).indexOf('V') < 0);
chk('Valider ACTIF avec média (source)', cbs(V.view('photo', 'source', mMedia)).indexOf('V') >= 0);

// ── SOURCE photo : E35 (1/2/3) + E36 planche quand nb>1 + sélection explicite ──
const src1 = V.view('photo', 'source', { name: 'P', parametres: { nb_images: 1 } });
chk('E35 : sélecteur 1/2/3 présent', ['NB_1', 'NB_2', 'NB_3'].every(x => cbs(src1).indexOf(x) >= 0));
chk('E36 : pas de planche si nb=1', cbs(src1).indexOf('PLANCHE') < 0);
const src3 = V.view('photo', 'source', { name: 'P', parametres: { nb_images: 3 } });
chk('E36 : planche contact si nb>1', cbs(src3).indexOf('PLANCHE') >= 0);
const srcCand = V.view('photo', 'source', { name: 'P', parametres: { nb_images: 3 }, image_candidates: ['a', 'b'], _candIdx: 0 });
// Critère 1 — écran candidat : action principale + « Plus d'options », terminologie claire, 3 états en légende
chk('crit1 : action principale = ★ Définir comme média actif', cbs(srcCand).indexOf('CAND_KEEP') >= 0 && /Définir comme média actif/.test(texts(srcCand)));
chk('crit1 : « ⋯ Plus d\'options » (1 action principale/écran)', cbs(srcCand).indexOf('CAND_MORE') >= 0);
chk('crit1 : 3 états expliqués en légende (candidate/média actif/livrable)', /candidate/i.test(srcCand.caption) && /Média actif/i.test(srcCand.caption) && /Livrable/i.test(srcCand.caption));
chk('crit1 : pas de pick auto (aucun CAND_PICK)', cbs(srcCand).indexOf('CAND_PICK') < 0);
// viewCandMore : actions secondaires DÉCOUPLÉES avec terminologie claire
const more = V.viewCandMore({ name: 'P', image_candidates: ['a'], _candIdx: 0 });
chk('crit1 : Plus d\'options = Variante/Livrable/Varier/Régénérer/Éditer/Rejeter', ['CAND_VAR', 'CAND_DELIVER', 'CAND_VARY', 'CAND_REGEN', 'CAND_EDIT', 'CAND_REJECT'].every(x => cbs(more).indexOf(x) >= 0));
chk('crit1 : terminologie claire (Conserver comme variante / Valider comme livrable / Générer une variante)', /Conserver comme variante/.test(texts(more)) && /Valider comme livrable/.test(texts(more)) && /Générer une variante/.test(texts(more)));

// ── PARAMÈTRES = liste de lignes (1 picker focalisé / décision) ──
const par = V.view('photo', 'parametres', mMedia);
chk('Paramètres PHOTO : lignes réf/tenue/décor/prompt/nb', ['P_REF', 'P_TENUE', 'P_DECOR', 'P_PROMPT', 'P_NB'].every(x => cbs(par).indexOf(x) >= 0));
chk('Paramètres : Ajuster inline présent', cbs(par).indexOf('ADJUST') >= 0);
const parV = V.view('video', 'parametres', { name: 'P', media_actif: 'x', scripts: [{ text: 'hi', name: 'S1' }] });
chk('Paramètres VIDÉO : script/durée/sous-titres/musique', ['P_SCRIPT', 'P_DUREE', 'P_SUBS', 'P_MUS'].every(x => cbs(parV).indexOf(x) >= 0));

// ── FINALISER : gate QC (C4/E92) avant Final HD ──
const fin = V.view('photo', 'finaliser', mMedia); // pas de qc
chk('FINALISER sans QC : actions contrôle (run/regen/edit/force)', ['QC_RUN', 'QC_REGEN', 'QC_EDIT', 'QC_FORCE'].every(x => cbs(fin).indexOf(x) >= 0));
chk('FINALISER sans QC : Valider VERROUILLÉ', cbs(fin).indexOf('V_LOCK') >= 0);
const finOK = V.view('photo', 'finaliser', { name: 'P', media_actif: 'x', qc: { verdict: 'ok' }, couts: { credits: 12, eur_estime: 0.7 } });
chk('FINALISER avec QC OK : Lancer Final HD actif', cbs(finOK).indexOf('V') >= 0 && /Final HD/.test(texts(finOK)));
chk('FINALISER : coût/crédits affichés (E11)', /cr ≈/.test(finOK.caption));
// E123 — sélection des livrables (Image/Vidéo) en FINALISER
chk('E123 : cases livrables Image/Vidéo', cbs(fin).indexOf('LIV_IMG') >= 0 && cbs(fin).indexOf('LIV_VID') >= 0);
chk('E123 : Image+Vidéo cochés par défaut', /☑ Image · ☑ Vidéo/.test(fin.caption));
const finImgOnly = V.view('photo', 'finaliser', { name: 'P', media_actif: 'x', livrables_select: { image: true, video: false } });
chk('E123 : Vidéo décochée -> ☐ Vidéo', /☐ Vidéo/.test(finImgOnly.caption));

// ── Barre universelle E108 partout : Retour · Valider · Accueil ──
chk('barre E108 (BACK/HOME) partout', cbs(par).indexOf('BACK') >= 0 && cbs(par).indexOf('HOME') >= 0);

// ── textes courts (verrou 8) : en-tête 1 ligne ──
chk('en-tête 1 ligne (pas de saut interne)', V.hdr(mMedia).indexOf('\n') < 0);

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

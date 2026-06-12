// [🔴5 — #8/#9] PREUVE : script/prompt VISIBLES (vrai texte + Voir plus/Réduire in-bloc + Texte complet séparé) ;
//   Régénérer = nouvelle version du MÊME thème ; keepsake/bandeau simplifié (#11bis, plus de « cap à poser / décision »).
process.env.R0_DRYRUN = '1';
const NAV = require('../ui/nav');
const SC = require('../ui/screens');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };
const flatcb = v => [].concat.apply([], v.rows || []).map(b => b.cb);

const LONG = 'Les hommes toxiques adorent te faire douter de toi, te répéter que tu exagères, que tu es trop sensible, jusqu\'à ce que tu ne saches plus distinguer ton ressenti de leurs manipulations — et c\'est exactement là que commence l\'emprise, lentement, méthodiquement.';
const factsLong = { draft: { video: { script: LONG, theme: 'Red flags' } }, medias: [{ id: 'm', type: 'image', etat: 'candidate', file: '/x.jpg' }] };
const ctxBase = { scriptCats: [{ label: 'Red flags', seed: 'redflags' }, { label: 'Attachement', seed: 'attach' }], presets: { scripts: [] } };

// 1) APERÇU COURT par défaut : vrai texte tronqué + « 👁 Voir plus », PAS le texte complet
const specC = NAV.blockSpec({ screen: 'video', key: 'script' }, factsLong, Object.assign({ blockExpanded: false }, ctxBase));
const vC = SC.blockView(specC);
chk('script : VRAI texte affiché (pas « (auto) »)', /toxiques/i.test(vC.caption) && !/\(auto\)/.test(vC.caption));
chk('script : aperçu COURT par défaut (texte tronqué …)', /…/.test(vC.caption) && vC.caption.length < LONG.length + 200);
chk('script : bouton « 👁 Voir plus » présent (R0_SEEMORE)', flatcb(vC).includes('R0_SEEMORE'));
chk('script : PAS de « Réduire » quand replié', !flatcb(vC).includes('R0_SEELESS'));

// 2) DÉROULÉ : texte complet DANS le bloc + « 🔼 Réduire »
const specE = NAV.blockSpec({ screen: 'video', key: 'script' }, factsLong, Object.assign({ blockExpanded: true }, ctxBase));
const vE = SC.blockView(specE);
chk('script : « Voir plus » déroule le TEXTE COMPLET dans le bloc', vE.caption.indexOf('emprise') > -1 && vE.caption.indexOf('méthodiquement') > -1);
chk('script : bouton « 🔼 Réduire » présent (R0_SEELESS)', flatcb(vE).includes('R0_SEELESS') && !flatcb(vE).includes('R0_SEEMORE'));

// 3) Texte COURT -> aucun Voir plus (pas de surcharge)
const specS = NAV.blockSpec({ screen: 'video', key: 'script' }, { draft: { video: { script: 'Court script.' } } }, ctxBase);
chk('script court : aucun « Voir plus » (inutile)', !flatcb(SC.blockView(specS)).includes('R0_SEEMORE'));

// 4) #9 RÉGÉNÉRER = nouvelle version, MÊME thème, reste sur le bloc script
const rRegen = NAV.reduce('R0_REGEN_SCRIPT', { screen: 'block', block: { screen: 'video', key: 'script' } }, factsLong, ctxBase);
chk('#9 : Régénérer reste sur le bloc Script', rRegen.st.screen === 'block' && rRegen.st.block.key === 'script');
chk('#9 : Régénérer relance une génération de texte (op gentext)', rRegen.op && rRegen.op.type === 'gentext' && rRegen.op.ask === 'vi_script');
chk('#9 : Régénérer = « même thème » (le thème n\'est PAS écrasé)', /même thème/i.test(rRegen.toast || ''));
const rTheme = NAV.reduce('R0_STHEME_1', { screen: 'block', block: { screen: 'video', key: 'script' } }, factsLong, ctxBase);
chk('#9 : choisir un thème mémorise theme + theme_seed (oriente la régénération)', rTheme.op && rTheme.op.patch && rTheme.op.patch.theme === 'Attachement' && rTheme.op.patch.theme_seed === 'attach');

// 5) Bloc Script expose aussi « 👁 Aperçu »/Saisir + Régénérer (texte éditable/visible)
chk('script : Régénérer exposé dans le bloc', flatcb(vC).includes('R0_REGEN_SCRIPT'));

// 6) #11bis : bandeau RÉSULTAT simplifié (plus de « cap à poser » / « décision » / « brouillon »)
const fres = { medias: [{ id: 'm2', type: 'video', etat: 'final', file: '/v.mp4' }] , cree_le: Date.UTC(2026,5,12) };
const vr = SC.videoResultView(fres, { srcName: 'IMG.jpg' });
chk('#11bis : bandeau vidéo SANS « cap à poser / décision / brouillon »', !/cap à poser|décision|brouillon/i.test(vr.caption));
const vp = SC.photoResultView({ medias: [{ id: 'm3', type: 'image', etat: 'final', file: '/p.jpg' }], cree_le: Date.UTC(2026,5,12) }, { srcName: 'IMG.jpg' });
chk('#11bis : bandeau photo SANS « cap à poser / décision / brouillon »', !/cap à poser|décision|brouillon/i.test(vp.caption));

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

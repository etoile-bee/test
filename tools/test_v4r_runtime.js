// [PRÉ-VALIDATION] RUNTIME — rejoue les SÉQUENCES RÉELLES via le VRAI chemin du bot (r0Dispatch/r0Render/r0Paint
//   + transport Telegram simulé : edit/sendMessage/delete + « message is not modified »). PAS le reducer seul.
//   Couvre B1 (vidéo bloqué à Valider), B2 (Retour mort), B3 (/v4r efface bloc), B4 (réponse toujours).
//   LIVE OFF, zéro dépense (R0_DRYRUN, aucun réseau, aucun ffmpeg).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';

// ════ [ISOLATION TOTALE — anti-FAUX-VERT] fixture ÉPHÉMÈRE, ZÉRO lecture de la vraie BASE / des symlinks iCloud. ════
//   CAUSE RACINE du « 73 OK / 10 KO » de l'opérateur (code IDENTIQUE) : la suite lisait la VRAIE BASE
//   (`~/podcast-workflow` ou son sandbox symlinké). Or `looks/`, `prompts/`, `outputs/` ne sont PAS versionnés
//   et le symlink `outputs`→iCloud ne se résout pas pareil selon l'environnement (VM : `find outputs/` = 0 ;
//   machine réelle : 239 vidéos). Donc le MÊME commit donnait 83/0 ici et 73/10 là-bas. C'était un test
//   NON déterministe (« marche en test, pas en réel »), pas une perte de comportement.
//   CORRECTIF : on crée une BASE temporaire UNIQUE (`fs.mkdtempSync`), on y sème un état projet CONTRÔLÉ, on
//   FORCE le module dessus (V4R_SANDBOX, lu à l'init de BASE), on ne touche JAMAIS la vraie BASE, on NETTOIE à la fin.
//   Doit s'exécuter AVANT require(telegram_bot) — BASE est figée au chargement.
const _iso = (function isolateRuntimeFixture() {
  const fs = require('fs'), path = require('path'), os = require('os');
  const BOX = fs.mkdtempSync(path.join(os.tmpdir(), 'v4r-runtime-'));   // BASE UNIQUE par run -> aucune collision, aucun état hérité
  // 1) ≥12 VRAIS jpeg NON VIDES (r0RealImages rejette size<=0) -> couverture + rendus persistants + P2 + pagination.
  const TINYJPG = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=', 'base64');
  fs.mkdirSync(path.join(BOX, 'looks'), { recursive: true });
  for (let i = 0; i < 12; i++) fs.writeFileSync(path.join(BOX, 'looks', 'seed_' + String(i).padStart(2, '0') + '.jpg'), TINYJPG);
  fs.mkdirSync(path.join(BOX, 'outputs'), { recursive: true });        // patrimoine vidéo CONTRÔLÉ (vide) — pas de symlink iCloud
  // 2) un MODÈLE de prompt pré-enregistré, texte LONG -> R0_LOADP_0 (#17/#18) + « 📄 Texte complet » + P6.
  fs.mkdirSync(path.join(BOX, 'prompts', 'imany'), { recursive: true });
  fs.writeFileSync(path.join(BOX, 'prompts', 'imany', 'seed.json'),
    JSON.stringify({ name: 'Modèle test', text: ('Portrait éditorial cinématographique, lumière douce de fenêtre, peau nette, regard caméra, profondeur de champ, rendu mode magazine — ').repeat(3) }));
  // 3) catalogues CONTRÔLÉS écrits DANS le bac (jamais lus depuis le repo/réel) -> déterministes partout.
  fs.writeFileSync(path.join(BOX, 'outfits_catalog.json'), JSON.stringify({   // #26 : ≥5 catégories distinctes
    outfits: ['soiree', 'business', 'casual', 'cosy', 'ete', 'fete'].map((c, i) => ({ id: 'o' + i, cat: c, name: c })) }));
  fs.writeFileSync(path.join(BOX, 'library.json'), JSON.stringify({           // scripts pré-enregistrés (déterministes)
    scripts: [0, 1, 2].map(i => ({ name: 'Script ' + (i + 1), script: 'Script de test ' + (i + 1) + ' — accroche · point clé · chute.' })) }));
  fs.writeFileSync(path.join(BOX, 'lookbook.json'), JSON.stringify({          // pricing minimal -> coûts stables sur la Validation
    pricing: { eur_per_credit: 0.058, ops: { eco: 0.48, hd: 1, video30s: 5 } } }));
  process.env.V4R_SANDBOX = BOX;                                       // FORCE BASE du module sur le bac (lu à l'init)
  process.on('exit', () => { try { fs.rmSync(BOX, { recursive: true, force: true }); } catch (e) {} });  // NETTOYAGE garanti
  return BOX;
})();

const bot = require('../telegram_bot.js');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
// flux RÉEL de génération photo = récap -> Générer(R0_GO2) -> 2e confirmation -> Oui(R0_GO)
async function genPhotoFull() { await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GEN_VALID'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }

async function main() {
  // ════ A : DOUBLE-CONFIRMATION (aucune dépense sans 2 clics explicites) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN');
  await bot.tap('R0_PH_GENERATE'); const sR = bot.state();
  chk('A : « Générer » (prépa) -> écran RÉCAP (confirm), pas de dépense', sR.screen === 'confirm');
  const imgBefore = bot.state().curImg;
  await bot.tap('R0_GO2'); const sC2 = bot.state();
  chk('A : clic Générer du récap -> 2ᵉ CONFIRMATION (confirm2), TOUJOURS pas de média créé', sC2.screen === 'confirm2' && bot.state().curImg === imgBefore);
  await bot.tap('R0_GO2_CANCEL'); chk('A : « Annuler » -> retour récap, aucun média créé', bot.state().screen === 'confirm' && bot.state().curImg === imgBefore);
  await bot.tap('R0_GO2'); await bot.tap('R0_GO'); chk('A : SEUL « Oui, générer » crée le média (1 dépense après 2 confirmations)', bot.state().curImg === imgBefore + 1);

  // ════ B4 (transversal) : CHAQUE tap répond TOUJOURS + 1 SEUL bloc à tout instant ════
  bot.reset(); await bot.open();
  chk('ouverture /v4r : exactement 1 bloc visible', bot.state().cockpit === 1);
  const seq = ['R0_PHOTO', 'R0_PH_GEN', 'R0_PHB_look', 'R0_VI_KEEPLOOK', 'R0_PH_USE', 'R0_VIDEO', 'R0_VI_VALID', 'R0_VI_PREVIEW', 'R0_VE_SUBS', 'R0_HOME', 'R0_RECENTS', 'R0_STUDIO', 'R0_PHOTO', 'R0_PH_GAL'];
  let alwaysOne = true, alwaysAnswered = true;
  for (const d of seq) { const a0 = bot.state().answered; await bot.tap(d); const s = bot.state(); if (s.cockpit !== 1) alwaysOne = false; if (s.answered <= a0) alwaysAnswered = false; }
  chk('B4 : chaque tap RÉPOND (answerCallbackQuery à chaque fois)', alwaysAnswered);
  chk('B1/B3 : 1 SEUL bloc visible à tout instant (aucune disparition, aucun empilement)', alwaysOne && bot.state().cockpit === 1);

  // ════ B1 : Accueil → Vidéo → Valider → on peut CONTINUER / SORTIR (pas de flux mort) ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // une photo existe (source)
  await bot.tap('R0_VIDEO'); const sV = bot.state();
  chk('B1 : Vidéo (source dispo) -> menu video_params, 1 bloc', sV.screen === 'video_params' && sV.cockpit === 1);
  await bot.tap('R0_VI_VALID'); const sVal = bot.state();
  chk('B1 : après Valider, on reste sur le menu (pas d\'écran mort), 1 bloc + réponse', sVal.screen === 'video_params' && sVal.cockpit === 1);
  await bot.tap('R0_HOME'); const sQ = bot.state();        // Accueil depuis un flux -> « Enregistrer avant de quitter ? »
  chk('B1 : ACCUEIL depuis le menu vidéo -> écran « quitter ? » (changement réel, pas mort)', sQ.screen === 'quit' && sQ.cockpit === 1);
  await bot.tap('R0_QUIT_DISCARD'); const sH = bot.state();  // sortie effective
  chk('B1 : « Quitter » -> Accueil (sortie réelle possible)', sH.screen === 'home' && sH.cockpit === 1);
  await bot.tap('R0_QUIT_CANCEL'); // (depuis home : sans effet, mais doit répondre)
  chk('B1 : aucune impasse — on peut toujours continuer', bot.state().cockpit === 1);

  // ════ B2 : « Retour » produit un changement réel (pas de boucle, pas « not modified » figé) ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_VIDEO'); // -> video_params (menu)
  const scrBeforeBack = bot.state().screen;
  await bot.tap('R0_HOME'); // sortie du menu vidéo
  const scrAfterBack = bot.state().screen;
  chk('B2 : la sortie du menu vidéo CHANGE d\'écran (video_params -> quit), PAS de boucle/figé', scrBeforeBack === 'video_params' && scrAfterBack === 'quit' && scrAfterBack !== scrBeforeBack);
  // Retour depuis la préparation photo
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN');
  const sp = bot.state().screen; await bot.tap('R0_PHOTO'); /* ◀ Retour de photo_prompt */ const sp2 = bot.state().screen;
  chk('B2 : Retour depuis Photo·Préparer change d\'écran (photo_prompt -> photo)', sp === 'photo_prompt' && sp2 === 'photo');

  // ════ B3 : /v4r ne fait JAMAIS disparaître le bloc (même avec un résultat affiché) ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // bloc RÉSULTAT photo
  chk('B3 : résultat photo affiché, 1 bloc', bot.state().cockpit === 1);
  await bot.open(); // /v4r de nouveau
  chk('B3 : après /v4r, le bloc EXISTE toujours (jamais 0 bloc)', bot.state().cockpit === 1);
  await bot.typed('/v4r new'); chk('B3 : /v4r new -> 1 bloc (pas de disparition)', bot.state().cockpit === 1);

  // ════ B (projet courant) : au retour /v4r on retombe sur le projet AVEC médias (couverture), pas un vide ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // projet courant a une photo
  chk('B : projet de travail a une image', bot.state().curImg >= 1);
  await bot.typed('/v4r new'); // crée un projet VIDE (plus récent)
  chk('B : /v4r new -> projet vide (0 image)', bot.state().curImg === 0);
  await bot.open(); // /v4r -> doit RESTAURER le projet avec médias
  const sB = bot.state();
  chk('B : /v4r reprise -> projet courant AVEC médias (pas le vide)', sB.curImg >= 1);
  chk('B : Accueil affiche la COUVERTURE (bloc photo, pas texte)', sB.screen === 'home' && sB.type === 'photo');

  // ════ RENDUS PERSISTANTS : le cockpit est éphémère (1 bloc édité), les RENDUS restent dans le fil (jamais supprimés) ════
  bot.reset(); await bot.open();
  chk('RP : ouverture -> 1 cockpit, 0 rendu', bot.state().cockpit === 1 && bot.state().renders === 0);
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // 1 photo générée (simulée)
  const rp1 = bot.state();
  chk('RP : après génération photo -> 1 cockpit + 1 rendu persistant (message dédié)', rp1.cockpit === 1 && rp1.renders === 1);
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); // 1 vidéo générée (simulée)
  chk('RP : après génération vidéo -> 1 cockpit + 2 rendus persistants', bot.state().cockpit === 1 && bot.state().renders === 2);
  const rpBefore = bot.state().renders;
  await bot.open();        // /v4r reprise -> NE DOIT PAS supprimer les rendus déjà postés
  chk('RP : /v4r reprise -> rendus CONSERVÉS (rien supprimé), cockpit toujours 1', bot.state().renders === rpBefore && bot.state().cockpit === 1);
  await bot.typed('/v4r new'); // nouveau projet -> les rendus de l'ancien RESTENT dans le fil
  chk('RP : /v4r new (changement de projet) -> anciens rendus TOUJOURS dans le fil', bot.state().renders === rpBefore && bot.state().cockpit === 1);

  // ════ K : VIDÉO branchée derrière la MÊME double-confirmation (ici SIMULÉE — LIVE OFF, zéro dépense, aucun appel Kling) ════
  const ENG = require('../ui/engines');
  chk('K : LIVE OFF -> liveFor(video)=false ET liveFor(photo)=false (rien n\'est armé)', ENG.liveFor('video') === false && ENG.liveFor('photo') === false);
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // une photo source existe
  await bot.tap('R0_VIDEO'); chk('K : Vidéo (source dispo) -> menu video_params', bot.state().screen === 'video_params');
  await bot.tap('R0_VI_GENERATE'); chk('K : « Générer » (vidéo) -> RÉCAP (confirm), pas de dépense', bot.state().screen === 'confirm');
  const vidBefore = bot.state().curVid;
  await bot.tap('R0_GO2'); chk('K : récap vidéo -> 2ᵉ CONFIRMATION (confirm2), toujours 0 vidéo créée', bot.state().screen === 'confirm2' && bot.state().curVid === vidBefore);
  await bot.tap('R0_GO2_CANCEL'); chk('K : Annuler -> retour récap, aucune vidéo créée', bot.state().screen === 'confirm' && bot.state().curVid === vidBefore);
  await bot.tap('R0_GO2'); await bot.tap('R0_GO'); chk('K : seul « Oui » crée la vidéo (simulée ici) après 2 confirmations', bot.state().curVid === vidBefore + 1);

  // ════ #17 MODÈLES PRÉ-ENREGISTRÉS (script/prompt remontent + chargeables) & #18 ENREGISTRER PAR DÉFAUT ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_prompt'); // bloc PROMPT photo
  chk('#17 : bloc prompt propose des MODÈLES pré-enregistrés (📁) + 💾 Défaut', bot.buttons().some(b => /^R0_LOADP_/.test(b)) && bot.buttons().includes('R0_DEFSAVE'));
  await bot.tap('R0_LOADP_0'); // charge un prompt pré-enregistré
  chk('#17 : charger un modèle remplit le brouillon (aperçu éditable)', !!(bot.draft('photo').prompt && bot.draft('photo').prompt.length > 0));
  await bot.tap('R0_DEFSAVE'); // enregistre ce prompt comme défaut
  chk('#18 : « Défaut » mémorise la valeur courante (photo.prompt)', !!bot.defaults()['photo.prompt']);
  await bot.typed('/v4r new'); // nouveau projet -> doit pré-remplir depuis le défaut
  chk('#18 : nouveau projet pré-rempli depuis le défaut (réutilisé sans rien écraser)', bot.draft('photo').prompt === bot.defaults()['photo.prompt']);

  // ════ #23 PONT PHOTO→VIDÉO : depuis Préparer ET depuis Résultat, « Génère/Créer vidéo » mène au menu VIDÉO, photo en source ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN');
  chk('#23 : PHOTO·Préparer expose 🎬 Génère vidéo (pont direct)', bot.buttons().includes('R0_PH_TOVIDEO'));
  await bot.tap('R0_PH_TOVIDEO'); chk('#23 : Préparer → 🎬 Génère vidéo -> menu VIDÉO (video_params), pas d\'Accueil', bot.state().screen === 'video_params');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  chk('#23 : PHOTO·Résultat = hub (Créer vidéo + Ressources)', bot.buttons().includes('R0_PH_TOVIDEO') && bot.buttons().includes('R0_RES'));
  await bot.tap('R0_PH_TOVIDEO'); chk('#23 : Résultat → Créer vidéo -> video_params (source conservée)', bot.state().screen === 'video_params' && !!(bot.draft('video').source));

  // ════ #22 RESSOURCES / FICHIERS DU PROJET : hub de récupération accessible, sans cul-de-sac ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_RES'); chk('#22 : écran Ressources atteint', bot.state().screen === 'resources');
  await bot.tap('R0_HOME'); chk('#22 : Ressources -> sortie Accueil OK (pas d\'impasse)', bot.state().screen === 'home');

  // ════ #25 RÉFÉRENCE (≠ avatar) : consulter/remplacer/verrouiller ; verrou mémorisé dans le brouillon ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_reference');
  chk('#25 : bloc Référence expose Consulter/Remplacer/Verrouiller', ['R0_REF_VIEW', 'R0_REF_REPLACE', 'R0_REF_LOCK'].every(c => bot.buttons().includes(c)));
  await bot.tap('R0_REF_LOCK'); chk('#25 : Verrouiller mémorise l\'état (draft.photo.ref_locked)', bot.draft('photo').ref_locked === true);

  // ════ #26 TENUE : toutes les catégories du catalogue remontent (pas juste Soirée) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_look');
  const lookBtns = bot.buttons().filter(b => /^R0_SET_phlook_/.test(b));
  chk('#26 : la Tenue propose plusieurs catégories (≥5), pas une seule', lookBtns.length >= 5);

  // ════ R4 APERÇU RÉEL (écran récap, pas un toast) : Préparer → Aperçu → (Valider) → Générer maintenant ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN');
  await bot.tap('R0_PH_PREVIEW');
  chk('R4/D3 : « Aperçu » ouvre l\'écran média (confirm), pas un toast', bot.state().screen === 'confirm');
  chk('R4/D3 : l\'Aperçu propose ✅ Valider + Retour + Modifier (PAS de Générer ni dépense ici)', ['R0_GEN_VALID', 'R0_GEN_CANCEL', 'R0_GEN_EDIT'].every(c => bot.buttons().includes(c)) && !bot.buttons().includes('R0_GO2'));
  await bot.tap('R0_GEN_VALID'); chk('R4/D3 : ✅ Valider -> écran VALIDATION (chiffré), rien ne dépense', bot.state().screen === 'validation' && bot.buttons().includes('R0_GO2'));
  await bot.tap('R0_GO2'); chk('R4/D3 : « Générer maintenant » -> 2ᵉ confirmation (confirm2)', bot.state().screen === 'confirm2');
  // vidéo : Aperçu réel aussi
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_PREVIEW');
  chk('R4 : Aperçu VIDÉO ouvre aussi l\'écran récap', bot.state().screen === 'confirm');

  // ════ R2 CONSERVATION photo→vidéo : la MÊME photo reste la source (fichier épinglé, pas remplacé) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  const photoId = (bot.draft('photo') && 0) || null; // (sim : pas de fichier réel, on pin l'IDENTITÉ source_id)
  await bot.tap('R0_PH_TOVIDEO');
  const srcId = bot.draft('video').source_id;
  chk('R2 : passage à la vidéo PIN l\'identité de la photo source (source_id défini)', srcId != null);
  await bot.tap('R0_VE'); await bot.tap('R0_VIB_voix'); await bot.tap('R0_SET_vivoix_0'); // on modifie un AUTRE champ
  chk('R2 : après édition d\'un autre champ, la source vidéo n\'a PAS changé (pas de remplacement silencieux)', bot.draft('video').source_id === srcId);

  // ════ VIDÉO « Remplacer » : Choisir (galerie) · Importer photo · Importer vidéo ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); await bot.tap('R0_VIDEO');
  await bot.tap('R0_VI_PICK'); chk('Remplacer : ouvre le choix de source', bot.state().screen === 'video_source');
  chk('Remplacer : propose Choisir galerie + Importer photo + Importer vidéo', ['R0_VI_GAL', 'R0_VI_IMPORT', 'R0_VI_IMPORTVID'].every(c => bot.buttons().includes(c)));

  // ════ TEXTE ENTIER : l'aperçu propose « 📄 Texte complet » quand un prompt long existe ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_prompt'); await bot.tap('R0_LOADP_0'); // charge un prompt
  await bot.tap('R0_GEN_CANCEL'); // (au cas où) revenir prépa
  await bot.tap('R0_PH_PREVIEW');
  chk('texte entier : l\'aperçu propose 📄 Texte complet', bot.buttons().includes('R0_FULLTEXT_prompt'));

  // ════ PERSISTANCE RÉELLE : générer → /menu → /restart → la génération/le projet/le média sont TOUJOURS là ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  const before = { curImg: bot.state().curImg, renders: bot.state().renders, mid: bot.state().mid };
  chk('PERSIST : après génération -> média + rendu présents', before.curImg >= 1 && before.renders >= 1);
  await bot.menu();    // /menu (legacy) ne doit RIEN effacer
  chk('PERSIST : après /menu -> média + rendus TOUJOURS là', bot.state().curImg >= 1 && bot.state().renders === before.renders);
  await bot.restart(); // /restart rejoue le vrai chemin -> reprend le projet AVEC médias, rendus conservés
  const after = bot.state();
  chk('PERSIST : après /restart -> projet restauré AVEC média (curImg ≥ 1)', after.curImg >= 1);
  chk('PERSIST : après /restart -> rendus persistants TOUJOURS dans le fil (jamais supprimés)', after.renders === before.renders);
  chk('PERSIST : après /restart -> 1 seul cockpit (pas d\'empilement)', after.cockpit === 1);

  // ════ PAGINATION : la galerie globale (>9 médias) propose Précédent/Suivant et change de page ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_HIST'); // historique global (lit looks/outputs réels via symlink)
  const gBtns = bot.buttons();
  chk('PAGINATION : galerie globale propose Suivant ▶ et ◀ Précédent', gBtns.includes('R0_GNEXT') && gBtns.includes('R0_GPREV'));
  await bot.tap('R0_GNEXT'); chk('PAGINATION : Suivant -> on reste sur la galerie (page changée), 1 cockpit', bot.state().screen === 'gallery' && bot.state().cockpit === 1);
  await bot.tap('R0_GPREV'); chk('PAGINATION : Précédent répond, 1 cockpit', bot.state().screen === 'gallery' && bot.state().cockpit === 1);

  // ════ STUDIO : entrée « 🕘 Historique » ════
  bot.reset(); await bot.open(); await bot.tap('R0_STUDIO');
  chk('STUDIO : entrée Historique présente', bot.buttons().includes('R0_PH_HIST'));

  // ════ PRÊT À POSTER : bouton sur VIDÉO·Résultat -> écran pret (média validé) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); // video_result
  chk('PRÊT À POSTER : bouton présent sur VIDÉO·Résultat', bot.buttons().includes('R0_READY'));
  await bot.tap('R0_READY'); chk('PRÊT À POSTER : ouvre l\'écran pret, 1 cockpit', bot.state().screen === 'pret' && bot.state().cockpit === 1);

  // ════ RÉGRESSION /v4r : depuis un écran PROFOND, /v4r revient à l'ACCUEIL du projet courant (couverture), projet jamais « disparu » ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // projet courant a une photo (cover)
  const projRenders = bot.state().renders;
  await bot.tap('R0_VIDEO'); // on s'enfonce (video_params/video)
  const deep = bot.state().screen; chk('/v4r-fix : on est sur un écran profond avant', deep !== 'home');
  await bot.open(); // /v4r
  const s = bot.state();
  chk('/v4r-fix : /v4r revient à l\'ACCUEIL (pas l\'écran profond restauré)', s.screen === 'home');
  chk('/v4r-fix : projet courant TOUJOURS là (média conservé), 1 cockpit', s.curImg >= 1 && s.cockpit === 1);
  chk('/v4r-fix : rendus précédents TOUJOURS dans le fil (jamais supprimés)', s.renders >= projRenders);

  // ════ P1 CHAÎNE PHOTO : sélection galerie -> PRÉPARER (Aperçu/Valider/Générer accessibles, pas de cul-de-sac) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // une image existe
  await bot.tap('R0_PH_GAL'); chk('P1 : Modifier/Galerie -> écran galerie', bot.state().screen === 'gallery');
  await bot.tap('R0_GITEM_0'); chk('P1 : sélection -> PRÉPARER (pas photo_result cul-de-sac)', bot.state().screen === 'photo_prompt');
  chk('P1 : depuis Préparer, Aperçu accessible', bot.buttons().includes('R0_PH_PREVIEW'));
  await bot.tap('R0_PH_PREVIEW'); chk('P1 : Aperçu (récap) atteint', bot.state().screen === 'confirm');
  await bot.tap('R0_GO2'); chk('P1 : -> garde-fou (confirm2)', bot.state().screen === 'confirm2');
  await bot.tap('R0_GO'); chk('P1 : Générer -> écran final (photo_result)', bot.state().screen === 'photo_result');

  // ════ P2 CONSERVATION SOURCE : la photo AFFICHÉE = la source vidéo épinglée = ce qui est peint (même fichier) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  const coverA = bot.cover();
  await bot.tap('R0_PH_TOVIDEO');
  chk('P2 : source vidéo épinglée = l\'image AFFICHÉE (même fichier)', bot.draft('video').source_file === coverA && !!coverA);
  chk('P2 : la prép vidéo PEINT cette même image (cohérence)', bot.media() === coverA);
  await bot.tap('R0_VE'); chk('P2 : montage vidéo -> source toujours la même (peinte)', bot.media() === coverA);

  // ════ P3 ACCUEIL + STOP partout : chaque écran propose 🏠 Accueil + 🛑 Stop ; Stop interrompt proprement -> accueil ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); // écran profond (préparer)
  const b = bot.buttons();
  chk('P3 : écran profond propose 🏠 Accueil + 🛑 Stop', b.includes('R0_HOME') && b.includes('R0_STOP'));
  await bot.tap('R0_STOP'); chk('P3 : Stop -> retour ACCUEIL propre, 1 cockpit', bot.state().screen === 'home' && bot.state().cockpit === 1);

  // ════ P6/D5 ENREGISTRER MODÈLE = PROJET RÉUTILISABLE (arbitrage Etoile) : depuis la Validation, duplique le projet (réouvrable, original intact) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await bot.tap('R0_PHB_prompt'); await bot.tap('R0_LOADP_0'); await bot.tap('R0_GEN_CANCEL'); await bot.tap('R0_PH_PREVIEW'); await bot.tap('R0_GEN_VALID');
  chk('P6/D3 : la VALIDATION propose 💾 Modèle', bot.buttons().includes('R0_SAVEMODEL'));
  const projBefore = bot.projects();
  await bot.tap('R0_SAVEMODEL'); chk('P6/D5 : « Modèle » crée un PROJET réutilisable (réouvrable, original intact)', bot.projects() === projBefore + 1);

  // ════ [G1] GALERIE (sélection) ≠ HISTORIQUE (lecture) — plus de doublon strict (D4) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_PH_GAL'); const gSel = bot.buttons();
  chk('G1 : GALERIE = grille de SÉLECTION (✅ Choisir + items R0_GITEM_)', gSel.includes('R0_GCHOOSE') && gSel.some(b => /^R0_GITEM_/.test(b)));
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_PH_HIST'); const gHist = bot.buttons();
  chk('G1 : HISTORIQUE = LECTURE (PAS de ✅ Choisir, items R0_GVIEW_)', !gHist.includes('R0_GCHOOSE') && gHist.some(b => /^R0_GVIEW_/.test(b)));
  chk('G1 : Galerie et Historique ne sont PLUS identiques (rôles distincts)', JSON.stringify(gSel) !== JSON.stringify(gHist));
  await bot.tap('R0_GVIEW_0'); chk('G1 : « revoir » (R0_GVIEW_) répond, reste sur l\'historique, 1 cockpit', bot.state().screen === 'gallery' && bot.state().cockpit === 1);

  // ════ [G2] RESSOURCES/Fichiers : ◀ Retour revient à l'ORIGINE (Récents/Studio/Résultat), pas un défaut fixe ════
  bot.reset(); await bot.open(); await bot.tap('R0_RECENTS'); await bot.tap('R0_RES');
  chk('G2 : Fichiers ouvert depuis RÉCENTS -> ◀ Retour = Récents', bot.state().screen === 'resources' && bot.resReturn() === 'R0_RECENTS');
  bot.reset(); await bot.open(); await bot.tap('R0_STUDIO'); await bot.tap('R0_RES');
  chk('G2 : Fichiers ouvert depuis STUDIO -> ◀ Retour = Studio', bot.resReturn() === 'R0_STUDIO');
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); await bot.tap('R0_RES');
  chk('G2 : Fichiers ouvert depuis PHOTO·Résultat -> ◀ Retour = Photo', bot.resReturn() === 'R0_PHOTO');

  // ════ [G3] photo_montage NETTOYÉ : l'écran orphelin n'existe plus ; R0_PH_MONTAGE renvoie à la préparation (pas de cul-de-sac) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN');
  chk('G3 : Photo·Préparer n\'expose PAS de bouton Montage (retiré)', !bot.buttons().includes('R0_PH_MONTAGE'));
  await bot.tap('R0_PH_MONTAGE'); chk('G3 : un R0_PH_MONTAGE résiduel renvoie à photo_prompt (écran orphelin supprimé), 1 cockpit', bot.state().screen === 'photo_prompt' && bot.state().cockpit === 1);

  // ════ [G5/D7] HASHTAGS fusionnés à la COPIE de la légende (champ #️⃣ Hashtags conservé séparément dans Fichiers) ════
  bot.reset(); await bot.open(); await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull();
  await bot.tap('R0_VIDEO'); await bot.tap('R0_VI_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); // une vidéo -> publication dispo
  bot.setPub({ legende_courte: 'Légende test', legende_longue: 'Longue légende test', hashtags: '#a #b #c' });
  chk('G5 : la COPIE de la légende courte INCLUT les hashtags', /#a #b #c/.test(bot.fullText('legc')) && /Légende test/.test(bot.fullText('legc')));
  chk('G5 : la COPIE de la légende longue INCLUT les hashtags', /#a #b #c/.test(bot.fullText('legl')));
  chk('G5 : le champ #️⃣ Hashtags reste SÉPARÉ (récupérable seul)', bot.fullText('tags').trim() === '#a #b #c');

  // ════ [ANO-GENID-CREATE] DATA-SAFETY : 2+ créations de projet dans la MÊME seconde -> ids DISTINCTS (jamais d'écrasement silencieux) ════
  //   genId a une résolution à la seconde ; createProject DOIT suffixer (-2,-3…) si l'id existe déjà. Cause historique de perte de projet.
  {
    const _fs = require('fs'), _os = require('os'), _path = require('path');
    const S2 = require('../ui/socle');
    const tb = _fs.mkdtempSync(_path.join(_os.tmpdir(), 'genid-create-'));
    const ts = 1718000000000; // ts FIGÉ -> force la même seconde
    const a = S2.createProject(tb, 'imany', {}, ts).projectId;
    const b = S2.createProject(tb, 'imany', {}, ts).projectId;
    const c = S2.createProject(tb, 'imany', {}, ts).projectId;
    chk('ANO-GENID-CREATE : 3 créations même seconde -> 3 ids DISTINCTS (aucun écrasement)', new Set([a, b, c]).size === 3);
    chk('ANO-GENID-CREATE : 3 projets RÉELLEMENT sur disque (aucune perte silencieuse)', S2.listProjects(tb, 'imany').length === 3);
    try { _fs.rmSync(tb, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e.message, e.stack); process.exit(1); });

// [PRÉ-VALIDATION] RUNTIME — rejoue les SÉQUENCES RÉELLES via le VRAI chemin du bot (r0Dispatch/r0Render/r0Paint
//   + transport Telegram simulé : edit/sendMessage/delete + « message is not modified »). PAS le reducer seul.
//   Couvre B1 (vidéo bloqué à Valider), B2 (Retour mort), B3 (/v4r efface bloc), B4 (réponse toujours).
//   LIVE OFF, zéro dépense (R0_DRYRUN, aucun réseau, aucun ffmpeg).
process.env.R0_DRYRUN = '1';
process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'dry';
process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1';
const bot = require('../telegram_bot.js');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
// flux RÉEL de génération photo = récap -> Générer(R0_GO2) -> 2e confirmation -> Oui(R0_GO)
async function genPhotoFull() { await bot.tap('R0_PH_GENERATE'); await bot.tap('R0_GO2'); await bot.tap('R0_GO'); }

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
  chk('ouverture /v4r : exactement 1 bloc visible', bot.state().alive === 1);
  const seq = ['R0_PHOTO', 'R0_PH_GEN', 'R0_PHB_look', 'R0_VI_KEEPLOOK', 'R0_PH_USE', 'R0_VIDEO', 'R0_VI_VALID', 'R0_VI_PREVIEW', 'R0_VE_SUBS', 'R0_HOME', 'R0_RECENTS', 'R0_STUDIO', 'R0_PHOTO', 'R0_PH_GAL'];
  let alwaysOne = true, alwaysAnswered = true;
  for (const d of seq) { const a0 = bot.state().answered; await bot.tap(d); const s = bot.state(); if (s.alive !== 1) alwaysOne = false; if (s.answered <= a0) alwaysAnswered = false; }
  chk('B4 : chaque tap RÉPOND (answerCallbackQuery à chaque fois)', alwaysAnswered);
  chk('B1/B3 : 1 SEUL bloc visible à tout instant (aucune disparition, aucun empilement)', alwaysOne && bot.state().alive === 1);

  // ════ B1 : Accueil → Vidéo → Valider → on peut CONTINUER / SORTIR (pas de flux mort) ════
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GEN'); await genPhotoFull(); // une photo existe (source)
  await bot.tap('R0_VIDEO'); const sV = bot.state();
  chk('B1 : Vidéo (source dispo) -> menu video_params, 1 bloc', sV.screen === 'video_params' && sV.alive === 1);
  await bot.tap('R0_VI_VALID'); const sVal = bot.state();
  chk('B1 : après Valider, on reste sur le menu (pas d\'écran mort), 1 bloc + réponse', sVal.screen === 'video_params' && sVal.alive === 1);
  await bot.tap('R0_HOME'); const sQ = bot.state();        // Accueil depuis un flux -> « Enregistrer avant de quitter ? »
  chk('B1 : ACCUEIL depuis le menu vidéo -> écran « quitter ? » (changement réel, pas mort)', sQ.screen === 'quit' && sQ.alive === 1);
  await bot.tap('R0_QUIT_DISCARD'); const sH = bot.state();  // sortie effective
  chk('B1 : « Quitter » -> Accueil (sortie réelle possible)', sH.screen === 'home' && sH.alive === 1);
  await bot.tap('R0_QUIT_CANCEL'); // (depuis home : sans effet, mais doit répondre)
  chk('B1 : aucune impasse — on peut toujours continuer', bot.state().alive === 1);

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
  chk('B3 : résultat photo affiché, 1 bloc', bot.state().alive === 1);
  await bot.open(); // /v4r de nouveau
  chk('B3 : après /v4r, le bloc EXISTE toujours (jamais 0 bloc)', bot.state().alive === 1);
  await bot.typed('/v4r new'); chk('B3 : /v4r new -> 1 bloc (pas de disparition)', bot.state().alive === 1);

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

  console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
  process.exit(ko ? 1 : 0);
}
main().catch(e => { console.log('FATAL', e.message, e.stack); process.exit(1); });

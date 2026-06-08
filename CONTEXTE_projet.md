# CONTEXTE PROJET — Podcast Workflow (à coller en début de nouvelle conversation)

> ⚠️ DOCUMENT VIVANT : Claude le met à jour à CHAQUE session (état, reste à faire, historique en bas).
> Ne jamais supprimer l'historique — c'est la mémoire du projet.

## RÉSULTAT ATTENDU (vision)
- Chaîne de production TikTok 100% automatisée et FIDÈLE : ce qui est validé en test = ce qui sort en prod, à l'identique.
- Une influenceuse IA d'abord (coach relationnelle, femmes 20-40), puis généralisation multi-personas (config par influenceuse, moteur unique).
- Ensuite : monétisation (à définir — plugins Marketing et Small Business installés dans Cowork pour ça).

## RÔLE DE CLAUDE
- Ingénieur d'exploitation du pipeline : patchs vérifiés, git, garde-fous anti-dépense, fidélité test→prod.
- Gardien de la RÈGLE D'OR : ne JAMAIS déclencher de génération payante sans accord explicite.
- Tient CE fichier à jour en fin de session : état actuel, reste à faire, + une ligne d'historique datée.
- Etoile garde les décisions créatives et financières. Claude propose, Etoile tranche.

## Qui je suis / setup
- MacBook, dossier `~/podcast-workflow/`. Tout en FRANÇAIS.
- Bot Telegram qui génère des vidéos TikTok lipsync (coach relationnelle, femmes 20-40).
- Fichiers (arborescence nettoyée 07/06, tag `avant-menage` pour l'ancienne) : `telegram_bot.js` (bot, pm2 `podcast-bot`), `workflow.js` (moteur vidéo), `subtitle_style.js` (SOURCE UNIQUE sous-titres), `color_style.js` (SOURCE UNIQUE couleur), `test_soustitres.js` (test sandbox), `library.json` + `topic_history.json` (données), `server.js`/`server_latest.js` (dashboard web port 3333 — en sommeil, à ressusciter ou supprimer), `make_reactions_v3.js` + `reactions/` (réactions, désactivées).
- Clés TikTok dans `.env` mais AUCUN code TikTok : la publication auto reste à construire (chaînon manquant du 100% auto).
- Pipeline : ElevenLabs (voix) + Kling/Higgsfield (lipsync) + Shotstack (montage/sous-titres/couleur).
- Looks : iCloud `podcast-looks/` (symlink `looks/`). Sorties : iCloud `podcast-outputs/` (symlink `outputs/`).

## RÈGLE D'OR — ARGENT
- CHAQUE vraie vidéo COÛTE de l'argent (ElevenLabs + Kling + Shotstack). On groupe les changements, on teste UNE fois.
- Test sous-titres GRATUIT : `node test_soustitres.js` (sandbox Shotstack, filigrané, raw déjà payé) ou commande `/test` du bot Telegram.
- `SHOTSTACK_SANDBOX_KEY` est dans `.env` (≠ clé prod `SHOTSTACK_API_KEY`).

## RÈGLE — REDÉMARRAGE BOT
- Patchs `workflow.js` / `subtitle_style.js` / `test_soustitres.js` → PAS de redémarrage.
- Patchs `telegram_bot.js` → `pm2 restart podcast-bot` OBLIGATOIRE, mais SEULEMENT si aucune vidéo ne tourne. Vérif :
  `pgrep -f "workflow.js" >/dev/null && echo "⛔ video en cours, NE PAS redemarrer" || pm2 restart podcast-bot`

## MÉTHODE DE TRAVAIL (à respecter)
- ⭐ RÈGLE SUIVI (07/06) : Claude rapporte l'avancement DANS LE CHAT toutes les 5 actions (✅ fait / 🔄 en cours / ⏭ suivant) et signale chaque tâche terminée.
- ⭐ RÈGLE ÉTOILE (07/06, "garde-le bien en mémoire") : toute proposition d'interface ou de modification de flux est d'abord présentée en MAQUETTE VISUELLE (widget) → Etoile choisit → on implémente. On avance comme ça jusqu'à instruction contraire.
- ⭐ RÈGLE STYLE MENU (07/06, définitive) : TOUS les écrans du début à la fin = style "ÉDITION" (capture vidéo d'Etoile) — message-média unique (image en tête), légende UNE ligne (TITRE gras · infos séparées par ·), boutons un-mot+emoji 2-3 par rangée, coûts 💰 sur les boutons payants, zéro paragraphe.
- ⭐ RÈGLE D'OR UI (07/06) : UN SEUL ÉCRAN DE DÉFILEMENT POUR TOUT — un panneau unique qui s'auto-édite (jamais de spam de messages), résultats en album. Variante B validée : tenue/décor/format sélectionnables sur le même écran (●), Générer en 1 appui.
- ⭐ RÈGLE COÛT IMAGES (07/06) : toujours des images TEST (éco 720p) d'abord — la HD et la vidéo ne se débloquent qu'APRÈS validation visuelle des images, jamais directement.
- ⭐ RÈGLE SESSIONS PARALLÈLES (08/06) : plusieurs sessions Cowork travaillent en // sur le même repo. TOUJOURS repartir de `main` (état validé Etoile, tags v1-validee/looks-v1-valide), faire un INVENTAIRE des correctifs présents/absents avant tout patch, et REGREFFER seulement ce qui manque par petits commits « regreffe: <fix> ». En cas de conflit sur une même fonction : la version MAIN gagne sur l'UI, les garde-fous de sécurité (TTS, abort, anti-dépense) gagnent. Vérifié 08/06 : main contenait déjà 100% des garde-fous → rien à regreffer.
- Via Cowork : Claude a accès direct à `~/podcast-workflow/`, `podcast-looks/` et `podcast-outputs/` → il édite les fichiers lui-même, commit git avant/après chaque patch. Plus de téléchargement de patchs.
- Rollback : `git log --oneline` puis `git checkout <hash> -- <fichier>`.
- Limites de l'environnement Claude : pas d'accès réseau Shotstack/tmpfiles (les tests s'exécutent sur le Mac ou via `/test`), pas de pm2 (redémarrages = Etoile).
- Toujours demander "on fait le point ?" avant toute génération de vraie vidéo.

## ÉTAT ACTUEL (2026-06-07)
- Sous-titres : ✅ VERROUILLÉS DÉFINITIFS par Etoile (dernier test 2h49 du 07/06) = **Archivo Black 45px EMBARQUÉE par URL, OY=0.25** (centre texte à 68% hauteur : pendentif/clavicule), sans contour ni ombre, règle 2 mots max / mot seul si 8+ lettres. Tag git : `soustitres-valides-v2-archivo`. NE PLUS TOUCHER sans demande explicite.
- Leçon : sans police embarquée, le serveur Shotstack rend tantôt fin tantôt épais selon les polices dispo → toujours embarquer via FONTS de `subtitle_style.js`.
- `workflow.js` : revue1 appliquée (fix filtre [pause], captions, retry JSON ×3, approbation scripts Parts 2/3 avant dépense, code mort supprimé).
- `telegram_bot.js` : commande `/test` ajoutée (sandbox, garde-fous) + réglages /settings retargés sur `subtitle_style.js` → ⚠️ REDÉMARRAGE PM2 EN ATTENTE (quand bot libre).
- Avatar `.env` : la bonne influenceuse (hf_20260531_191302...). Purge faite : tous les fichiers de la "mauvaise personne" (session 21h10-21h28 du 06/06) + selfie terrasse supprimés.
- Son : trimstart v1 VALIDÉ par Etoile (démo écoutée) — 0.10s coupées en début de chaque vidéo dans la passe finale (pop audio réglé). Réglage : const TRIM dans saveOpen.
- Couleur : ✅ teinte V5 VALIDÉE par Etoile (07/06, DEMO_couleur_V5) = désat -12%, bleu tons moyens/clairs, +contraste, netteté douce, étiquette bt709 (fin du jaune téléphone). Correction ADAPTATIVE (coloradapt v1) : dosée via signalstats selon la saturation/jaune de la vidéo de base, référence _REF dans saveOpen. Encodage crf17/medium.

## ✅ V1 VALIDÉE (tag git `v1-validee`, 07/06 ~4h30) — base figée
Vidéo de référence : 2026-06-07-01-52_p1.mp4. Sous-titres Archivo 45px/OY 0.25, couleur V5 adaptative (desat only), trim 0.10s, bt709, sans réactions, lookpick nouveautés d'abord. Toute évolution = nouvelle branche de travail, la v1 reste récupérable.

## 🏗️ CHANTIER EN COURS (08/06 soir, validé Etoile) — REFONTE 3 BLOCS STATIQUES
- Architecture validée sur maquette : **3 messages statiques permanents qui s'auto-éditent** = Bloc 1 PHOTO (panneau newlook existant) · Bloc 2 VIDÉO (cockpit existant) · Bloc 3 RÉSULTATS (NOUVEAU). Jamais plus de 3 messages ; sous-écrans dans leur bloc ; confirmations en toast (plan V2_EDIT_PLAN.md).
- ✅ IMPLÉMENTÉ (session Cowork 08/06, node --check OK, **PAS ENCORE TESTÉ NI RESTART**) :
  · BLOC 3 dans telegram_bot.js : `results{mid,items,idx}` persistant (results_bloc.json, max 30), `showResults()` édite EN PLACE (photo↔vidéo via editPhotoKb/editVideoKb), `resAdd()` = toute livraison y atterrit (anti-doublon), `resSteps()` = menu 🧭 Étapes (renvoie vers chaque catégorie des blocs 1/2).
  · Livraisons routées vers bloc 3 : photos gardées 💾 (NL_KEEP_CUR/ALL), vidéo finale genFinal (gfIdx → boutons Postable/Restyler/Cover/Légende/Dossier/Partie suivante), test local 🧪 (TEST_GEN/Éditer), livraison legacy launch() (readyIdx → Prêt à poster).
  · genFinal ne supprime plus le cockpit : il le remorphe en carte (bloc 2 reste).
  · Nouveaux callbacks : RES_PREV/NEXT/BACK/STEPS/EDIT (photo→setWorkPhoto+EDIT_HOME)/GEN (photo→gw.look+carte).
  · Commande **/studio** : supprime les 3 anciens blocs et repose Bloc1+Bloc2+Bloc3 en bas du chat. resLoad() au boot.
- PROCHAINE ÉTAPE : `pgrep -f "workflow.js" >/dev/null && echo "⛔" || pm2 restart podcast-bot` puis tester /studio (parcours complet test→garde photo→vidéo). Ensuite : réorganisation fine step by step des commandes dans chaque bloc.
- Tarifs mesurés 08/06 : 1 photo HD = 1 photo éco = 0.48cr ; 500cr=31.25USD (0.0625USD/cr, crédits API dédiés, pas abonnement) ; vidéo HD : test à 0? À CONFIRMER. → lookbook.pricing à jour.
- +30 looks `pdf60` (outfit+makeup+hairstyle du PDF "60 prompts lipsync avatar") dans outfits_catalog.json (ids 205-234), racine newlook_prompt.txt intacte. Regards A/B + negative prompt du PDF notés, NON intégrés (pas demandé).
- ⚠️ Crédits API Anthropic du bot ÉPUISÉS (erreur 400 "credit balance too low" → coupure vidéo express). Recharge = Etoile, console.anthropic.com.
- ⚠️ Commit git bloqué par .git/index.lock non supprimable depuis Cowork → sur le Mac : `rm -f ~/podcast-workflow/.git/index.lock && git add -A && git commit -m "tarifs 08/06 + pdf60 + contexte 3 blocs"`.

## CE QU'IL RESTE À FAIRE (backlog précis, validé par Etoile le 08/06)
0. ⚠️ /restart à faire pour activer les derniers livrés : RÉCAP avant paiement, Enregistrer/Refaire pareil/Autre look, planche entière, légende copiable sans titre, Partie suivante en fin, bt709 rendu local.
1. Points validés PAS ENCORE codés : ⑦ "garder ces réglages par défaut ?" après résultat · previews à CHAQUE step (même édition) · menu durée 15s→2min · 📅 calendrier "à poster le"+/calendar+📤 posté avec refaire/rééditer · bouton 📝 Légendes sur résultat vidéo · option "animer la planche" 5-6s intro/outro (= réactions lipsync réutilisables).
2. Maquette à proposer (règle maquette) : BANQUE DE RÉACTIONS (clips lipsync 3-6s réutilisables par look) + INDEX MÉDIA media_index.json (catalogue auto de chaque fichier : type, chemin, recette, usages).
3. Prix : vidéo HD 30s = 10 ou 13 cr À RECONFIRMER par Etoile (13 retenu). Tout le reste calibré (voir lookbook.pricing).
4. Revue ENSEMBLE de tous les réglages par défaut (style.json/fx) — rappel demandé.
5. Publication TikTok auto (clés .env, code à écrire) + stockage privé (remplacer tmpfiles) + multi-personas + boucle /mark + sort du dashboard server.js.
6. Planches "outfit blanc" : prompt planche mixte déjà calqué sur les captures validées ; Etoile peut renvoyer les originales si le rendu dévie.

## PRÉFÉRENCE SOUS-TITRES (modèle visé)
- Style référence : photo "CHEMISTRY FADES" = grotesque type Arial/Helvetica, TOUT BLANC, lettres espacées, ombre douce (PAS de gros contour noir), au HAUT DE LA MOUSSE DU MICRO (pas au cou).

## NOTES TECHNIQUES UTILES
- Sous-titres Shotstack : asset html, `width:720` (bug 1080→720 corrigé), `position:'bottom'`, `offset.y` (plus grand = plus haut). Shotstack peut décaler de ±20-40px vs aperçu → d'où le test sandbox.
- Couleur : passe finale ffmpeg dans `saveOpen` ; filtre neutre `eq=brightness=0:saturation=1`.
- L'influenceuse officielle : femme métisse, taches de rousseur, yeux dorés, bijoux or, décor bougies+bibliothèque. Toute autre personne dans looks/ = à signaler.

## SYSTÈME DE LOOKS (07/06 soir — validé Etoile)
- `/newlook` : catégorie (6, génératives) ou 🎲 → décor (3 : bougies/jour/studio réaliste) → 4 poses même visage (SoulID depuis `references/imany/` — ⚠️ PHOTO À DÉPOSER) → garde multiple, chaque garde = recette mémorisée dans `lookbook.json`, recréable via `/look <n>`.
- `outfits_catalog.json` : 204 tenues quiet-luxury/old-money (6 catégories × 34), rotation anti-répétition (`outfits_history.json`), pas de doublon avant cycle complet ni dans les 12 dernières.
- Règles verrouillées : pas de pendentif signature (accessoires/makeup/coiffure VARIENT par look, CONSTANTS dans un set de 4) ; mains hors cadre ; 3 angles (face/trois-quarts/profil léger) ; marques de luxe discrètes sans logos ; prompt de base = texte exact d'Etoile dans `newlook_prompt.txt`.
- En attente : photo référence imany dans `references/imany/`, arbitrage "mouth closed vs natural smile" dans la base, disclosure IA (chantier ③).

## ✅ SYSTÈME LOOKS VALIDÉ (tag git `looks-v1-valide`, 07/06 22h)
- Moteur : **/v1/text2image/seedream** (découvert par sonde /probe — params.prompt + params.input_images + 9:16), photo de référence `references/imany/imany_reference.png`, prompt de base `newlook_prompt.txt` (modifiable via /prompt). Rendu validé "parfait" par Etoile.
- Panneau unique tout-en-un (variante B) : fil d'ariane ①②③④, sélections ✅, coûts 💰, photos à la suite, recettes /look, archive totale `podcast-outputs/generations/` (/gens).
- Infra de travail : `bot_journal.log` = conversation bot↔Etoile lisible par Claude en direct ; hot-reload de newlook.js (correctifs sans restart) ; /restart depuis le chat.
- Modèles dispo aussi : nano-banana (édition par référence) — candidat /benchlook.

- **2026-06-07/08 nuit (Cowork, session 2 — passation)** : Système looks FINAL certifié banc d'essai (tests/sim_panel.js = preuve : 1 panneau, 0 parasite). Moteur seedream /v1 + réf imany, panneau média unique style ÉDITION, accueil compact + sous-menus, RÉCAP avant paiement, planche mixte podcast, recréation 9:16 au choix, Enregistrer/Refaire pareil/Autre look, archive totale + /gens + /look + /prompt + /probe + /assemble + /restart + journal bot_journal.log (lisible par Claude en direct) + hot-reload newlook.js. Réactions OFF défaut. Prix calibrés (0.5cr photo, 7.36cr HDx4, 4cr vidéo test, 10-13cr vidéo 30s ; 500cr=31USD). Règles gravées : maquette d'abord, style ÉDITION partout, un seul écran, images test d'abord, suivi/5 actions. Bot très enrichi en parallèle par session Dispatch (éditeur /edit, rendu local, /posted, cover...). REPRENDRE PAR : backlog section RESTE À FAIRE.
## HISTORIQUE DES SESSIONS (ne pas supprimer — ajouter en haut)
- **2026-06-08 (Cowork, session Dispatch — réconciliation)** : Arbitrage Etoile = GARDER main comme base. Inventaire systématique des correctifs Dispatch (V2) vs main → **tous déjà fusionnés sur main** (sanitizeTTS+isPauseToken pause, validTTS/ttsCheck/garde generateAudio « status », commande-libère-l'attente, genAbort+abortFn annulation réelle, guard renderStyleFrame null, shrinkIfBig looks>10Mo, cardSig anti-dissolution, delMsg progression). **Rien à regreffer.** node --check 5 fichiers OK, 0 callback orphelin (234), CHANTIER 0 restart fait + stable. Leçon gravée (règle sessions //). Flag à arbitrer : `subtitle_style.js` = 76px/OY0.33 (rendu local) vs lock documenté 45px/OY0.25 (embarquée Shotstack) — non touché.
- **2026-06-07 (suite nuit)** : Calibrage final validé par tests successifs mesurés. Sous-titres verrouillés : Archivo Black 45px embarquée, OY=0.25 (68%, pendentif), tag `soustitres-valides-v2-archivo`. Couleur verrouillée : teinte V5 adaptative (`color_style.js`, source unique prod+test, coloradapt v2 `aa606ff`), étiquette bt709 (fix jaune téléphone). Trim 0.10s + réactions OFF + `/stop` "partout" (stopall v1) + `/test` Telegram. TEST FINAL OK (couleur+sous-titres fidèles). Reste : vidéo de validation complète → tag v1-validee.
- **2026-06-06/07 (Cowork, 1ère session)** : Setup Cowork (plugins Marketing/Adobe/Small Business). Accès direct aux 3 dossiers. Commits : `76a30d9` (état avant), `a26b161` revue1 (5 fix workflow.js), `3e5800c`+`a7f5aef` test sync subref v2, `7af9202` cmdtest v1 (/test Telegram), `8fb8c55` substyle v1 (source unique `subtitle_style.js`, fix /settings position). Purge "mauvaise personne" : 8 fichiers supprimés (3 tg_*.jpg looks, raw+p1+txt 21-21, TEST_soustitres.mp4, selfie terrasse). `999f229` trimstart v1 (coupe 0.10s debut, pop audio — VALIDÉ sur démo DEMO_trim_0.1s.mp4). `04078ba` réactions audio OFF (demande Etoile). `6888f34` + tag `soustitres-valides-v1` : SOUS-TITRES VALIDÉS ET VERROUILLÉS par Etoile sur DEMO_trim_0.1s (style prod Arial Black 52px/OY 0.347) — fausse piste Archivo annulée, le sandbox rend mal la police, référence = prod. Résultat attendu de la session suivante : redémarrage bot fait, puis UNE vraie vidéo de validation complète → tag v1-validee.

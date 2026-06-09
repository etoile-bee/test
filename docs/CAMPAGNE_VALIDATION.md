# CAMPAGNE DE VALIDATION EXHAUSTIVE — 38 scénarios (enrichie)  ·  2026-06-10

> Exécutée **avant toute migration / hotfix** (VERROU STRICT : rien n'est migré/retiré ; roadmap **PROVISOIRE**).
> Chaque fiche : **Verdict** (PASS · FAIL · BLOQUÉ · N/A) · **Fxx** · **Preuve** (journal live / harnais) · **Règle Exxx** · **Impact utilisateur** · **Recommandation**.
> Watcher live actif · chasse **F19+** maintenue (génération vidéo réelle, export, prêt-à-poster, nav croisée, reprise).

## Catégories d'exécutabilité (bien distinctes)
- **A — IMMÉDIAT (simulable / déterministe) — FAIT** : 26 scénarios (1-4, 7-14 hors payants, 18-31). Verdict établi par harnais + journal live + code.
- **B — NÉCESSITE GÉNÉRATION PAYANTE ou ACTION MANUELLE D'ETOILE — À EXÉCUTER LIVE** : **#5, #6, #15, #17** (et **#16** une fois F2 branché). → protocole : `docs/PROTOCOLE_LIVE.md`.
- **C — MODE AUTO NON IMPLÉMENTÉ (projection)** : **#16, #32–#38**. Non exécutables sans le moteur (F2) / l'orchestrateur auto.

## Base de preuves déterministes (rejouées — vertes)
`test_photo_ws 6/6` · `test_video_ws 7/7` · `test_photo_l0_2a 20/20` · régressions `nodup 16 · feedback 15 · gallery 7 · nbphotos 7 · stalefix 8`.
Live (workspace mids 9390→9432) : `R_*/PL_*/PR_*/VS_*/VP_*/PP_*` = `editMedia/editText` **en place** ; sorties `R_home` = `delete + ws close + editText`. Récurrents observés : **B1** (`R_photo.image → editText`, ~10×), **F13** (`TECH_STOP → sendMessage`, ×3), **F1/F3** (éditeur legacy `EDIT_LOOKS/GLP_*/NL_NEW → sendPhoto`).

---

## PHOTO

**#1 — Créer un projet (✨ Nouveau look) → 1 bloc + en-tête** · **PASS** · — · *live `R_photo.look → 🖼 ws create 9416`* · E105/E114
- Impact : entrée en création fluide, un seul bloc. · Reco : RAS — garder comme référence de non-régression.

**#2 — Changer le look (Tenue/Décor) → même bloc** · **PASS** · — · *live `PL_TENUE/PL_ENV → editMedia`* · E109
- Impact : réglages sans nouveau message. · Reco : RAS.

**#3 — Conserver le décor en changeant la tenue** · **PASS** · — · *`test_photo_l0_2a` slice* · E114
- Impact : pas de perte de réglage. · Reco : RAS.

**#4 — Conserver la référence (en-tête)** · **PASS** · — · *live `R_photo.ref → editMedia` ; `refThumb` mtime* · E114
- Impact : Etoile voit toujours quelle réf est active. · Reco : RAS.

**#5 — Générer 1 image 💲 → confirmation in-bloc + résultat dans le bloc** · **BLOQUÉ (cat. B)** · B1/— · *run payant requis* · dépense
- Impact : c'est le cœur de la création image — **non vérifié à sec** ; risque B1 quand l'image arrive. · Reco : **exécuter en live** (protocole #5), surveiller que le résultat reste dans le bloc.

**#6 — Générer 2/3 images 💲 → navigation ‹ › + sélection in-bloc** · **BLOQUÉ (cat. B)** · B1/— · *run payant* · E114
- Impact : planche multi-poses, sélection de l'image gardée. · Reco : **live** (protocole #6).

**#7 — Éditer une image (🎨) → éditeur dans le bloc + retour workspace** · **FAIL** · **F1** · *live `PL_EDIT → delete` puis `EDIT_LOOKS/GLP_*/NL_NEW → sendPhoto`* · E105/E114
- Impact : **irritant majeur** — « Éditer » éjecte du cockpit, ouvre galeries/cockpits séparés, **perd le contexte**. · Reco : **Phase 1 (F1)** ; ne pas tester l'édition fine avant.

**#8 — Retour arrière IMAGE→LOOK→réf/prompt → slice exact** · **FAIL** · **B1** · *données conservées (proj) MAIS `R_photo.image → editText` (texte au lieu de média), vu ~10×* · E105/E114
- Impact : revenir sur l'image affiche un écran **texte incohérent** (la vignette disparaît). · Reco : **Phase 0 (B1)**.

**#9 — Reprise de session (RÉCENTS›Reprendre) → état exact** · **FAIL** · **B1** · *live `RX_DRAFT_…21-29-36 → editText` (step image) ; step look = OK* · E113/E114
- Impact : rouvrir un projet en étape image = écran texte, **confusion sur l'état réel**. · Reco : **Phase 0 (B1)**.

## VIDÉO

**#10 — Image→Vidéo (🎬) → même bloc, média actif affiché** · **PASS** · — · *`test_video_ws` (sendMedia=1) ; live `R_video.source → editMedia`* · E105
- Impact : enchaînement Photo→Vidéo naturel, sans nouveau bloc. · Reco : RAS.

**#11 — Plusieurs images → vidéo (sélection source)** · **PASS** · — · *live `VS_GENIMAGE → editMedia 9419`* · slice
- Impact : choix clair de l'image qui devient la vidéo. · Reco : RAS (re-vérifier avec de vraies images, protocole).

**#12 — Changer le look pendant la vidéo → script aval conservé** · **PASS** · — · *`test_video_ws` (aval conservé)* · E115
- Impact : on peut ajuster sans perdre le script écrit. · Reco : RAS.

**#13 — Conservation contexte Vidéo↔Photo (aller-retour)** · **PASS** · — · *`proj` persistant ; live nav même bloc* · E114
- Impact : pas de perte look/réf/prompt/script en naviguant. · Reco : RAS (re-vérifier post-génération, protocole).

**#14 — Script : éditer / charger biblio / enregistrer (in-bloc)** · **PASS** · — · *live `VP_GEN/PP_SAVE → editMedia` ; handlers routeBlock/toast* · E105/E114
- Impact : script visible, modifiable, réutilisable. · Reco : RAS — *la GÉNÉRATION de script (🤖) reste payante (Anthropic), non testée à sec*.

**#15 — Génération vidéo 💲 → coût + confirmation obligatoire in-bloc** · **BLOQUÉ (cat. B)** · — · *confirmation in-bloc OK (code) ; génération = run payant* · dépense
- Impact : livrable clé ; la confirmation protège la dépense. · Reco : **exécuter en live** (protocole #15), surveiller bloc unique + suite (résultats/export).

**#16 — Export / livrables (fichier + légende/tags)** · **N/A (cat. C)** · **F2** · *`VX_GO` = bridge non câblé (toast)* · E105
- Impact : **pas d'export tant que le moteur (F2) n'est pas branché**. · Reco : **Phase 4 (F2)** puis tester en live.

**#17 — Prêt à poster (retrouver + livrer)** · **BLOQUÉ (cat. B)** · **F11** · *nécessite une vidéo livrée + écran legacy `showReady`* · E105
- Impact : étape de publication finale. · Reco : **live** après une vidéo (protocole #17).

## STUDIO (mémoire métier — fonctionne mais HORS cockpit ⇒ FAIL cible)

**#18 — Looks : ouvrir / naviguer / choisir** · **FAIL** · **F4** · *`MENU_LOOKS → showGallery` (messages séparés)* · E105
- Impact : la bibliothèque de looks s'ouvre **hors cockpit** (nouveaux blocs), perte de repère. · Reco : **Phase 2 (F4)**.

**#19 — Références : une SEULE source active** · **FAIL** · **F5** · *2 portes : `photo.ref` vs `RX_REFS→showRefMenu`* · E105/E116
- Impact : ambiguïté « où est LA référence ? ». · Reco : **Phase 2 (F5)** — source unique.

**#20 — Décors cohérents (sans doublon)** · **FAIL** · **F7** · *`STUDIO_DECORS` cardMenu = doublon de `PL_ENV`* · E105
- Impact : deux endroits pour le décor → confusion. · Reco : **Phase 5 (F7)**.

**#21 — Personas : voir / sélectionner** · **FAIL** · **F8** · *`PERSONA` cardMenu hors workspace* · E105/E106
- Impact : changer de persona sort du cockpit. · Reco : **Phase 5 (F8)** (P1 si multi-persona).

**#22 — Médias : consulter** · **FAIL** · **F9** · *`FILES_HOME → showFilesMenu`* · E105
- Impact : navigation fichiers hors cockpit. · Reco : **Phase 5 (F9)**.

**#23 — Modèles : sauver / charger un style** · **FAIL** · **F6** · *`SHOWSTYLES → showStyles`* · E105
- Impact : styles gérés hors cockpit, hors `proj`. · Reco : **Phase 5 (F6)** (dépend F1).

**#24 — Historique : retrouver / rouvrir** · **FAIL** · **F10** · *`STUDIO_HIST` = liste texte, pas de réouverture→proj* · E105 (+E51/53)
- Impact : on ne peut pas vraiment rouvrir une production passée. · Reco : **Phase 2 (F10)** — grille + réouverture.

## NAVIGATION

**#25 — `/menu` → 1 bloc accueil (navigate)** · **PASS** · — · *live `/menu → sendMessage ACCUEIL` (1)* · E111
- Impact : point d'entrée propre. · Reco : RAS.

**#26 — Accueil → sections en place** · **PASS** · — · *live `R_photo/R_video → editText`* · E109
- Impact : sections sans empilement. · Reco : RAS.

**#27 — Retour ⬅ sans créer de bloc** · **FAIL** · **F12** · *workspace OK ; retours legacy `MAIN_MENU/HOME_*` recréent l'accueil* · E105/E108/E109
- Impact : selon l'écran, ◀️ ré-empile un accueil → désorientation. · Reco : **Phase 1 (F12)**.

**#28 — Changer de section en cours de projet → pas de reset** · **PASS** · — · *`proj` conservé ; live Vidéo↔Photo* · E114
- Impact : on ne perd pas le projet en explorant. · Reco : RAS.

**#29 — Reprise après /restart, /stop → état exact** · **PASS (caveat B1)** · B1 · *workspace recréé proprement (stalefix `freshBloc`) ; step image → B1 (#9)* · E113
- Impact : reprise fiable sauf l'écran image (B1). · Reco : RAS nav ; B1 en Phase 0.

**#30 — Aide (❓) sur écran workspace → dans le bloc** · **PASS** · — · *corrigé L0-2a-ter (`RH_` média → `nlText`)* · E112
- Impact : l'aide ne casse plus le bloc. · Reco : RAS.

**#31 — Envoyer une photo spontanément → proposée dans le contexte** · **FAIL** · **F15** · *`msg.photo` hors wait-state → menu legacy « Photo reçue ? » (`send`)* · E105
- Impact : geste naturel (« utilise cette photo ») = menu externe hors cockpit. · Reco : **Phase 2 (F15)**.

## MODE AUTOMATIQUE (PROJECTION — cat. C, non implémenté)

**#32 — Génération complète sans intervention** · **N/A** · F2 · — · Impact : pas de one-shot aujourd'hui. · Reco : orchestrateur au-dessus de `proj` après F2 (Phase 4).
**#33 — Conservation des sources de vérité pendant l'auto** · **N/A** · — · Impact : — · Reco : `proj` unique piloté.
**#34 — Reprise après échec en cours d'auto** · **N/A** · F2/F10 · Impact : — · Reco : machine à états + checkpoints.
**#35 — Auditabilité (entrées/coûts/sorties)** · **N/A** · — · Impact : — · Reco : `project.json` (E93–E96).
**#36 — Logs de bout en bout** · **N/A (partiel)** · — · Impact : `bot_journal.log` existe. · Reco : étendre aux étapes auto.
**#37 — Coûts cumulés + confirmations** · **N/A (partiel)** · — · Impact : `estimateCost/videoCost` existent. · Reco : cumul auto.
**#38 — Historique de la prod auto, rouvrable** · **N/A** · F10/F2 · Impact : — · Reco : dépend F10.

---

## SYNTHÈSE
- **PASS 14** · **FAIL 12** · **BLOQUÉ 4** (#5,6,15,17) · **N/A 8** (#16,32-38).
- **Catégorie A (faits) : 26** · **B (live/payant à faire) : 4** (+#16 après F2) · **C (auto non implémenté) : 8**.
- Frontières confirmées : **B1, F1, F4–F10, F12, F13, F15, F2/F11**. **Nouvelles : aucune au-delà de F1–F18** (chasse F19+ poursuivie en live).

_Aucune correction appliquée. Roadmap PROVISOIRE. Suite = exécution live des cat. B selon `docs/PROTOCOLE_LIVE.md`. — 2026-06-10_

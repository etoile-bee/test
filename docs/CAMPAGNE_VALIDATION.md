# CAMPAGNE DE VALIDATION EXHAUSTIVE — 38 scénarios (AVANT migrations)  ·  2026-06-10

> Exécutée **avant toute migration / hotfix**. Verdict par scénario : **PASS · FAIL · BLOQUÉ** (run payant ou action live d'Etoile requise) · **N/A** (non implémenté = mode auto).
> Preuves : harnais déterministes (`tools/test_*.js`), **journal live** `bot_journal.log` (marqueurs `🖼 ws create/edit/close`), inspection code.
> **Aucune correction appliquée.** Watcher live actif. Réf. : `docs/PRIORISATION_PRODUIT.md`, `docs/FRONTIERES_LEGACY.md`.

## Base de preuves déterministes (rejouées ce jour — toutes vertes)
`test_photo_ws 6/6` (1 seul bloc workspace sur parcours PHOTO) · `test_video_ws 7/7` (1 seul bloc PHOTO→VIDÉO + aval conservé) · `test_photo_l0_2a 20/20` (gates, parents, slice conservé) · régressions `nodup 16 · feedback 15 · gallery 7 · nbphotos 7 · stalefix 8`.
Live observé (workspace mids 9390/9391/9397/9407–9426) : navigation `R_*/PL_*/PR_*/VS_*/VP_*` = `editMedia/editText` **en place**, sorties `R_home` = `delete + ws close + editText` (propres).

---

## PHOTO

| # | Scénario (action → attendu) | Verdict | Fxx | Preuve / logs | Règle |
|---|---|---|---|---|---|
| 1 | Créer projet (✨ Nouveau look) → 1 bloc workspace + en-tête contexte | **PASS** | — | live `R_photo.look → 🖼 ws create mid=9416` ; `test_photo_ws` | E105/E114 |
| 2 | Changer look (Tenue/Décor) → maj **même bloc** | **PASS** | — | live `PL_TENUE/PL_ENV → ✅ editMedia ws edit 9409` | E109 |
| 3 | Conserver le décor en changeant la tenue | **PASS** | — | `test_photo_l0_2a` (slice conservé) | E114 |
| 4 | Conserver la référence (en-tête la montre partout) | **PASS** | — | live `R_photo.ref → ✅ editMedia` ; `refThumb` mtime | E114 |
| 5 | Générer **1 image** 💲 → confirmation in-bloc → résultat dans le bloc | **BLOQUÉ** | B1/— | run payant requis | dépense |
| 6 | Générer **2/3 images** 💲 → navigation ‹ › + sélection in-bloc | **BLOQUÉ** | B1/— | run payant requis | E114 |
| 7 | **Éditer une image (🎨)** → éditeur dans le bloc + retour workspace | **FAIL** | **F1** | live `PL_EDIT → 🗑 delete`, puis `EDIT_LOOKS/GLP_*/NL_NEW → sendPhoto` (éditeur legacy, nouveaux blocs) | E105/E114 |
| 8 | Retour arrière IMAGE→LOOK→réf/prompt → slice exact | **FAIL** | **B1** | données conservées (proj) MAIS `R_photo.image → ✅ editText` (rendu en bloc texte, pas média) — vu 6× | E105/E114 |
| 9 | Reprise de session (RÉCENTS›Reprendre) → état exact | **FAIL** | **B1** | live `RX_DRAFT_…2026-06-09-21-29-36 → editText` (draft en step image rendu en texte) ; reprise step *look* = OK | E113/E114 |

## VIDÉO

| # | Scénario | Verdict | Fxx | Preuve / logs | Règle |
|---|---|---|---|---|---|
| 10 | Image→Vidéo (🎬 Faire une vidéo) → même bloc, média actif affiché | **PASS** | — | live `R_video.source → editMedia` ; `test_video_ws` (sendMedia=1) | E105 |
| 11 | Plusieurs images → vidéo (sélection source) | **PASS** | — | live `VS_GENIMAGE → ✅ editMedia ws 9419` | slice |
| 12 | Changer le look pendant la vidéo → script aval conservé | **PASS** | — | `test_video_ws` (retour script conserve l'aval) | E115 |
| 13 | Conservation contexte Vidéo↔Photo (aller-retour) | **PASS** | — | `proj` persistant ; live `R_video.source↔R_photo.*` editMedia même bloc | E114 |
| 14 | Script : éditer / charger biblio / enregistrer (in-bloc) | **PASS** | — | live `VP_GEN → ws edit 9410` (anti-doublon) ; handlers = routeBlock/toast | E105/E114 |
| 15 | Génération vidéo 💲 → coût + **confirmation obligatoire** in-bloc | **BLOQUÉ** | — | écran de confirmation in-bloc = OK (code `video.export confirming`) ; **génération = run payant** | dépense |
| 16 | Export / livrables (fichier + légende/tags) | **N/A** | **F2** | `VX_GO` = **bridge non câblé** (toast) ; moteur non branché sur `proj` | E105 |
| 17 | Prêt à poster (retrouver + livrer) | **BLOQUÉ** | **F11** | nécessite une vidéo livrée (run payant) + écran legacy `showReady` | E105 |

## STUDIO (mémoire métier — fonctionne mais HORS cockpit = FAIL cible)

| # | Scénario | Verdict | Fxx | Preuve | Règle |
|---|---|---|---|---|---|
| 18 | Looks : ouvrir / naviguer / choisir | **FAIL** | **F4** | `MENU_LOOKS → showGallery` (messages séparés) ; live `GLP_*` legacy | E105 |
| 19 | Références : une **seule** source active | **FAIL** | **F5** | 2 portes : workspace `photo.ref` vs Studio `showRefMenu` (`RX_REFS`) | E105/E116 |
| 20 | Décors cohérents (sans doublon) | **FAIL** | **F7** | `STUDIO_DECORS` cardMenu = doublon de `PL_ENV` | E105 |
| 21 | Personas : voir/sélectionner | **FAIL** | **F8** | `PERSONA` cardMenu hors workspace | E105/E106 |
| 22 | Médias : consulter | **FAIL** | **F9** | `FILES_HOME → showFilesMenu` (messages) | E105 |
| 23 | Modèles : sauver/charger un style | **FAIL** | **F6** | `SHOWSTYLES → showStyles` hors workspace | E105 |
| 24 | Historique : retrouver / rouvrir | **FAIL** | **F10** | `STUDIO_HIST` = liste texte, pas de réouverture→proj | E105 (+E51/53) |

## NAVIGATION

| # | Scénario | Verdict | Fxx | Preuve | Règle |
|---|---|---|---|---|---|
| 25 | `/menu` → 1 bloc accueil (navigate), pas d'empilement | **PASS** | — | live `/menu → sendMessage ACCUEIL` (1) | E111 |
| 26 | Accueil → sections en place | **PASS** | — | live `R_photo/R_video → ✅ editText` | E109 |
| 27 | Retour ⬅ sans créer de bloc | **FAIL** | **F12** | workspace `R_home → close+editText` (OK) MAIS retours legacy `MAIN_MENU/HOME_*` recréent l'accueil | E105/E108/E109 |
| 28 | Changement de section en cours de projet → pas de reset | **PASS** | — | `proj` conservé (mémoire) ; live Vidéo↔Photo | E114 |
| 29 | Reprise après /restart, /stop → état exact | **PASS** (caveat B1) | B1 | workspace recréé proprement (stalefix `freshBloc`) ; caveat : step image → B1 (#9) | E113 |
| 30 | Aide (❓) sur écran workspace → dans le bloc | **PASS** | — | corrigé L0-2a-ter (`RH_` média → `nlText`) | E112 |
| 31 | Envoyer une photo spontanément → proposée dans le contexte | **FAIL** | **F15** | `msg.photo` hors wait-state → menu legacy « Photo reçue ? » (`send`) | E105 |

## MODE AUTOMATIQUE (PROJECTION — moteur non bâti)

| # | Scénario | Verdict | Manque |
|---|---|---|---|
| 32 | Génération complète sans intervention (look→image→vidéo→export) | **N/A** | orchestrateur auto au-dessus de `proj` ; dépend F2 |
| 33 | Conservation des sources de vérité pendant l'auto | **N/A** | `proj` unique piloté par l'orchestrateur |
| 34 | Reprise après échec en cours d'auto | **N/A** | machine à états + checkpoints (F2/F10) |
| 35 | Auditabilité (entrées/coûts/sorties tracées) | **N/A** | `project.json` complet (E93–E96) |
| 36 | Logs de bout en bout | **N/A (partiel)** | `bot_journal.log` existe ; à étendre aux étapes auto |
| 37 | Coûts cumulés + confirmations | **N/A (partiel)** | `estimateCost/videoCost` existent ; cumul auto à ajouter |
| 38 | Historique de la production auto, rouvrable | **N/A** | dépend F10 + F2 |

---

## SYNTHÈSE

- **PASS : 14** (1,2,3,4,10,11,12,13,14,25,26,28,29,30)
- **FAIL : 12** (7,8,9,18,19,20,21,22,23,24,27,31)
- **BLOQUÉ : 4** (5,6,15,17) — *run payant / action live*
- **N/A : 8** (16,32–38) — *mode auto / export non implémentés*

### Frontières CONFIRMÉES par la campagne
- **B1** (bug module cible `photo.image` → bloc texte) : scénarios **8, 9** (+ risque 5/6) — **le défaut le plus visible sur le parcours central**.
- **F1** (éditeur) : scénario **7** — nouveaux blocs/cockpits/galeries dès « Éditer ».
- **F4–F10** (Studio) : scénarios **18–24** — toute la mémoire métier hors cockpit.
- **F12** (retours legacy) : scénario **27**.
- **F15** (intake photo) : scénario **31**.
- **F2/F11** (moteur/export) : scénarios **16, 17** — bloquent la chaîne livrable et le mode auto.

### Frontières NOUVELLES trouvées pendant la campagne
**Aucune au-delà de F1–F18.** La chasse ciblée (Studio, reprise de session, export, génération vidéo réelle, prêt-à-poster, navigation croisée PHOTO↔VIDÉO) **n'a révélé aucune frontière inédite** :
- reprise/stalefix (`resLoad`/`freshBloc`/`genFoldersLoad`) = **comportement attendu** (recréation d'un bloc frais visible après restart), pas une fuite ;
- ready-to-post / export = déjà **F11/F2** ;
- navigation croisée = **0 `send()`** dans les handlers workspace (audit confirmé) ;
- intake photo, ancien flux anglais, pop-up réglages, menus annexes = déjà ajoutés **F15/F16/F17/F18** au tour précédent.
→ `FRONTIERES_LEGACY.md` et `PRIORISATION_PRODUIT.md` restent à jour (F1–F18) ; **pas de F19**.

### À EXÉCUTER AVEC ETOILE (run payant / live) — liste regroupée
- **#5** Générer 1 image (éco) → vérifier confirmation in-bloc + résultat dans le bloc + sélection.
- **#6** Générer 2/3 images → planche/navigation ‹ › + validation, dans le bloc.
- **#15** Générer la vidéo (après script) → confirmation coût + dépense réelle.
- **#16** Export/livrable → **nécessite F2 branché d'abord** (sinon reste N/A).
- **#17** Prêt à poster → après une vidéo livrée.
*(Tous derrière confirmation ; à ne lancer que sur décision explicite d'Etoile, crédits Anthropic/Kling requis.)*

---

_Campagne exécutée sans aucune correction. L'ordre de la roadmap est figé seulement après revue de cette campagne par Etoile. — 2026-06-10_

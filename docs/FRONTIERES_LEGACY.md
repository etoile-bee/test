# FRONTIÈRES LEGACY — cartographie exhaustive (audit, 2026-06-10)

> **But** : photographier l'existant. Le bot fait coexister **DEUX architectures** :
> - **CIBLE (workspace)** : routeur + bloc média unique + draft/`proj` source de vérité. Callbacks `R_ · RH_ · PL_ · PR_ · PP_ · VS_ · VP_ · VM_ · VL_ · VX_ · SP_` → `routeBlock` / `uiShow` / `uiShowMedia`.
> - **LEGACY** : ~**199** `send()`, **29** `cardMenu()`, **11** `cockpitPhoto()`, **~40** fonctions `show*/gen*/nl*/res*` qui rendent **hors workspace** (nouveaux messages, cockpit séparé, galerie séparée).
>
> **Aucune correction ici** — inventaire + plan. Migration seulement après priorisation d'Etoile.
> Fichiers **VERROUILLÉS / fidélité — NE PAS TOUCHER** pendant toute migration : `subtitle_style.js`, `color_style.js`, sous-titres de `render_local.js`, logique de fidélité de `workflow.js`/`render_local.js`.

## Légende
- **Comportements contournés** : 🧱 bloc unique · 🧭 en-tête contexte · 💾 draft/proj (vérité) · ♻️ anti-doublon · 🔁 persistance/reprise.
- **Effort** : S (≤½ session) · M (1–2 sessions) · L (plusieurs sessions).
- **Priorité** : 🔴 haute (atteignable depuis le workflow, casse le test live) · 🟠 moyenne (section, atteignable) · 🟡 basse (utilitaire / commande).

---

## F1 — ÉDITEUR D'IMAGE / MONTAGE (le plus gros nœud) 🔴
**1. Emplacement** : `telegram_bot.js` — `showEditHome()`, `editScreen()` (rendu via `cockpitPhoto`→`cockpit.mid`), `refreshPanel()`, `showPresets()`, `showEditZoom()`, `showEditMusic()`, `sectionKb()`. Callbacks : `EDIT_HOME · EDIT_LOOKS · EDIT_SUBS · EDIT_IMG · EDIT_IMGADJ · EDIT_IMGFX · EDIT_ZOOM · EDIT_MUS · EDIT_REACT · EDIT_PREVIEW · SHOW_PRESETS · IMG_PRE_* · IMG_BR/CT/SA/TE/SH/VI_UP|DN · IMG_RESET · IMG_CLEAR · S_FONT · S_SIZE_UP|DN · S_SP_UP|DN · S_Y_UP|DN · S_SUBS · S_PREVIEW · ZM_TOGGLE · ZM_IN_UP|DN · ZM_DU_UP|DN · ZM_FREQ · RE_ON|OFF|NATURAL · MUS_* · GLP_PREV|NEXT (sélecteur de look interne) · SAVESTYLE · SHOWSTYLES · VALIDATE_STYLE · UNDO_EDIT · BEFORE_AFTER · CMP_REF`.
**2. Quand** : bouton **🎨 Éditer** de l'étape IMAGE (`PL_EDIT`), bouton **🎨 Éditer (avancé)** du Montage (`VM_EDIT`), bouton **🎨 Éditer / Montage** de la section VIDÉO (`EDIT_HOME`).
**3. Contournés** : 🧱 (rend dans `cockpit.mid`, pas le bloc workspace ; `GLP_*`/`NL_NEW` internes créent de nouveaux blocs) · 🧭 (aucun en-tête projet/réf/prompt) · 💾 (écrit `style.json`/`styles_par_look.json` hors `proj`) · 🔁 (réglages non rattachés au draft).
**4. Règles cassées** : E105 (bloc fonctionnel unique), E106 (modularité), E108/E109 (nav en place), E114 (retour sans perte — l'éditeur vit hors slice), E116, E117.
**5. Migration** : créer des modules workspace `video.montage.subs / .image / .zoom / .musique / .reactions` rendus en bloc média (réutiliser `renderWorkingFrame` pour la vignette, mais via `ctx.showMedia`) ; lire/écrire un **slice `proj.video.montage`** (puis appliquer à `style.json` au moment du rendu). Confiner `GLP_*` dans un picker workspace (réutiliser `photo.lookgal`). **Effort L · Risque élevé** (cœur édition, beaucoup d'état partagé `cockpit`/`editPanel`/`style.json`) · **Dépendances** : NE PAS toucher `subtitle_style.js`/`color_style.js` (les sous-titres passent par branchement, pas par le fichier verrouillé).

## F2 — FLUX VIDÉO LEGACY « Créer » (carte → script → maquette → résultats) 🔴
**1. Emplacement** : `openCard()`, `showRecap()`/`recapCaption()`/`recapKb()`, `recapGo()`, `genScriptStep()`, `showScriptCard()`, `genHooks()`, `genAfterScript()` (maquette), `genFinal()`, `showResults()`, `resSteps()`, `genFolders` (affichage). Callbacks : `NEW_GO · RC_LOOK · RC_SUBJ(_AUTO|_MINE) · RC_STYLE · RC_ST_* · RC_DUR_* · RC_BACK · RC_GO · RC_NEWTOPIC · RC_CAT_* · GJ_OK · GJ_NEW · GJ_HOOKS · GJ_HOOK_* · GJ_CAT · GJ_CATSET_* · GJ_EDIT · GJ_FULL · GJ_SHOWSCRIPT · GJ_SAVESCRIPT · GJ_CANCEL · GJ_MODIFY · GJM_STYLE/DUR/LOOK/ST_* · GJ_MOCK · GJ_GO · MENU_GEN · MENU_TEST · TEST_GEN · T_AUTO · SCRIPT_OK · SAVE_VID · RES_PREV|NEXT|BACK|STEPS|EDIT|GEN · GF_ADDPART_/BACK_/FILES_/LONG_/SHORT_/POST_/REWORK_/RESTYLE_ · COVER_PREV|NEXT|PICK`.
**2. Quand** : bouton legacy **🎬 Nouvelle vidéo** (`NEW_GO`, encore présent hors registre, p.ex. messages de fin de génération `[{🔄 Nouvelle vidéo, NEW_GO}]`), et toute la chaîne de production réelle.
**3. Contournés** : 🧱 (cartes/maquettes/résultats = messages séparés `cockpit.mid`/`results.mid`) · 🧭 · 💾 (état dans `gw`/`genJob`/`results`, **pas** `proj.video`) · 🔁 (reprise via `resumeDraft` legacy pour step='video').
**4. Règles cassées** : E105, E106, E114/E115 (étapes vidéo non backées par le slice), E116, E117 ; doublonne la cible `video.script/montage/legende/export`.
**5. Migration** : c'est la **contrepartie « moteur » de L0-2b** — brancher `video.export`→`VX_GO` sur `recapGo`/`genScriptStep`/`genFinal` **en mappant `proj.video`→`gw`/`genJob`**, puis migrer la maquette + les résultats + `genFolders` en modules workspace. **Effort L · Risque élevé** (génération payante, multi-parties, assemblage) · **Dépendances** : `workflow.js` (fidélité — appels seulement, pas de modif), crédits Anthropic/Kling.

## F3 — WIZARD PHOTO LEGACY `nl*` (ancien /newlook) 🔴
**1. Emplacement** : `nlConfig()`, `nlMenuCat/Env/Mode()`, `nlShowResult()`/`nlResultRows()`, `nlPayRecap()`, `runNewLook()`, `nlMedia()`. Callbacks : `NL_NEW · NL_CONFIG · NL_GO · NL_MENU_CAT|ENV|MODE · NL_SET_CAT_*|ENV_* · NL_CNT_* · NL_NAV_P|N · NL_AVATAR · NL_EDIT · NL_KEEP_CUR|ALL · NL_RE_* · NL_RE_ALL · NL_VIDEO · NL_HD · NL_SPLIT · NL_RETRY · NL_OTHER · NL_CANCEL · NL_BACKRES · NL_NOOP`.
**2. Quand** : `NL_NEW` est encore **atteignable depuis la galerie legacy** (bouton « ✨ Nouveau look » dans `showGallery`/look picker) et depuis l'éditeur (F1) → **observé en live**. La commande `/newlook` y mène aussi.
**3. Contournés** : 🧱 (`nlMedia` gère son propre `newlook.mediaId` = le bloc workspace, MAIS `NL_NEW` recrée/duplique hors du flux `proj`) · 🧭 · 💾 (écrit `newlook.*`, pas `proj` — doublonne `photo.look/image`).
**4. Règles cassées** : E105, E114, E116, E117 ; **doublon fonctionnel** du workflow PHOTO migré.
**5. Migration** : **rediriger** `NL_NEW` → `routeBlock('photo.look')` (déjà la cible) ; retirer les boutons `NL_NEW` des écrans legacy ; à terme **retirer** `nlConfig`/`nlMenu*` (garder `runNewLook`/`generateLook` comme moteur appelé par `PL_GEN_DO`). **Effort M · Risque moyen** (beaucoup de points d'appel) · pas de fichier verrouillé.

## F4 — GALERIE DE LOOKS LEGACY 🟠
**1. Emplacement** : `showGallery()`, `showLook()`, `showCover()`, `GGRID`. Callbacks : `MENU_LOOKS · GAL_PREV|NEXT · GAL_PICK · GAL_AVATAR · GAL_GEN · GAL_DEL · GAL_EDIT · GGRID`.
**2. Quand** : **STUDIO › 👗 Looks** (`MENU_LOOKS`), et en interne depuis l'éditeur/`createFlow`. (Plus depuis la section PHOTO — retiré en L0-2a-ter.)
**3. Contournés** : 🧱 (galerie = messages séparés / grille multi-messages) · 🧭 · 💾 (sélection écrit `gw.look`/`workingSource`, pas `proj`).
**4. Règles cassées** : E105 (propriété STUDIO), E108/E109, E116. La cible existe déjà partiellement (`photo.lookgal`, `video.srcgal`).
**5. Migration** : module workspace `studio.looks` (grille→vignette média en place, CRUD looks dup/archive/lock = L5) ; réutiliser le picker `*.lookgal`. **Effort M · Risque moyen**.

## F5 — RÉFÉRENCE LEGACY 🟠
**1. Emplacement** : `showRefMenu()`, `refPreview()`. Callbacks : `RX_REFS · REF_FROM_GEN · REF_FROM_GAL · REF_UPLOAD · REF_SET`.
**2. Quand** : **STUDIO › 🎯 Références** (`RX_REFS`→`showRefMenu`, `cardMenu`). (Dans le workflow, la référence est déjà migrée : `photo.ref`/`photo.refgal`/`PR_*`.)
**3. Contournés** : 🧱 (`cardMenu` = bloc séparé) · 🧭. La logique réf (`setImanyRef`/`nlRefFile`) est **commune** et OK.
**4. Règles cassées** : E105, E116 (deux portes pour la même fonction : workspace `photo.ref` vs STUDIO `showRefMenu`).
**5. Migration** : faire pointer `RX_REFS` vers un module `studio.ref` (ou réutiliser `photo.ref` hors projet). **Effort S · Risque faible**.

## F6 — MODÈLES / STYLES SAUVEGARDÉS 🟠
**1. Emplacement** : `showStyles()`, `saveStyleAuto()`. Callbacks : `SHOWSTYLES · SAVESTYLE · RC_ST_* · GJM_ST_* · VALIDATE_STYLE`.
**2. Quand** : **STUDIO › 📂 Modèles**, et depuis l'éditeur (sauvegarder/charger un style) et le flux vidéo (choisir un modèle).
**3. Contournés** : 🧱 · 💾 (styles dans `styles/*.json` hors `proj`).
**4. Règles cassées** : E105, E116.
**5. Migration** : module `studio.modeles` + intégrer « charger un modèle » dans `video.montage`. **Effort M · Risque moyen** (interagit avec F1).

## F7 — DÉCORS LEGACY 🟡
**1. Emplacement** : handler `STUDIO_DECORS` (`cardMenu` liste). **2. Quand** : **STUDIO › 🏛 Décors**. (Le décor est déjà éditable dans le workspace via `PL_ENV`.)
**3. Contournés** : 🧱 · doublon avec `PL_ENV`. **4.** E105, E116. **5.** module `studio.decors` (CRUD L5) ou simple renvoi vers la config look. **Effort S · Risque faible**.

## F8 — PERSONAS 🟡
**1. Emplacement** : handlers `PERSONA`, `PERSONA_*` (`cardMenu`). **2. Quand** : **STUDIO › 👤 Personas**.
**3. Contournés** : 🧱 · 🧭 (le persona conditionne `proj.persona`, draftsDir, refs). **4.** E105, E106, E116. **5.** module `studio.personas` (sélection en place) ; vérifier propagation `proj`. **Effort S–M · Risque moyen** (multi-persona = L6).

## F9 — MÉDIAS / FICHIERS 🟡
**1. Emplacement** : `showFilesMenu()`, `showFileList()`. Callbacks : `FILES_HOME · FILE_*`. **2. Quand** : **STUDIO › 📁 Médias**.
**3. Contournés** : 🧱 (listes = messages). **4.** E105, E116. **5.** module `studio.fichiers` (lecture seule). **Effort S · Risque faible**.

## F10 — HISTORIQUE 🟡
**1. Emplacement** : handler `STUDIO_HIST` (`cardMenu` liste texte). **2. Quand** : **RÉCENTS › 🕘 Historique**.
**3. Contournés** : 🧱 · 🧭 (E51/E53 veulent grille+vignettes+réouverture — voir L4). **4.** E105, E116. **5.** module `recents.historique` (grille média, réouverture→`proj`). **Effort M · Risque moyen** (lié à `genFolders`/F2).

## F11 — PRÊT À POSTER 🟡
**1. Emplacement** : `showReady()`, `doReadyToPost()`. Callbacks : `SHOWREADY · READY_* · POSTLONG_ · POSTSEND_ · SAVE_VID`. **2. Quand** : **RÉCENTS › 📤 Prêt à poster**.
**3. Contournés** : 🧱 (envois vidéo séparés — partiellement inévitable, média lourd). **4.** E105, E116. **5.** module `recents.poster` (liste en place + livraison fichier). **Effort S–M · Risque faible**.

## F12 — MENU PRINCIPAL / NAV LEGACY 🟠
**1. Emplacement** : `showHome()` (`MAIN_MENU`), `showStudio()` (`HOME_STUDIO`), `showCreer()` (`HOME_CREER`), `showMainMenu()`, `HOME_PROFIL`. **2. Quand** : tous les **◀️ Retour** legacy pointant `MAIN_MENU`/`HOME_*` (très nombreux dans F1–F11) → **recrée un bloc accueil** (`send`) au lieu d'éditer le bloc actif.
**3. Contournés** : 🧱 (chaque `MAIN_MENU` = nouveau bloc home), doublon avec `R_home`/`R_studio`. **4.** E105, E108, E109, E111, E116.
**5. Migration** : à mesure que F1–F11 migrent, remplacer les `callback_data:'MAIN_MENU'`/`HOME_*` par `R_home`/`R_studio` (ou interception comme `editReturn`). **Effort M (diffus) · Risque moyen**.

## F13 — BARRE TECHNIQUE / SYSTÈME 🟡
**1. Emplacement** : handlers `TECH_STOP` (`send 'Rien en cours.'`), `TECH_STATUS` (`send`), `TECH_RESTART` (`send` — légitime). **2. Quand** : barre système 🛑/🔄 (présente sur **chaque** écran workspace via `navRows`).
**3. Contournés** : 🧱 (`TECH_STOP`/`TECH_STATUS` = message plein au lieu d'un toast — **observé en live**).
**4.** E112 (barre système), E116. **5.** convertir `TECH_STOP`/`TECH_STATUS` en `toast` (ou message éphémère `system()`). **Effort S · Risque faible**.

## F14 — COMMANDES TEXTE LEGACY 🟡
**1. Emplacement** : handlers `/newlook` (→F3), `/prompt` (`PROMPT_EDIT`/`PROMPT_RESET`, édite `newlook_prompt.txt`), `/gens`, `/look`, `/library`, `/edit`, `/assemble`, `/probe`, etc. **2. Quand** : saisie de commande.
**3. Contournés** : 🧱 · doublon (`/prompt` legacy vs `photo.prompt`/biblio ; `/newlook` vs workspace). **4.** E105, E116, E117.
**5. Migration** : rediriger les commandes vers les entrées workspace (`/newlook`→`photo.look`, `/prompt`→`photo.prompt`) ; garder les commandes diagnostic. **Effort S–M · Risque faible**.

---

## TABLEAU DE SYNTHÈSE

| # | Frontière | Callbacks clés | Atteignable depuis | Règles cassées | Effort | Risque | Prio |
|---|---|---|---|---|---|---|---|
| F1 | Éditeur image/montage | EDIT_*/IMG_*/S_*/ZM_*/RE_*/GLP_*/SAVESTYLE | PL_EDIT, VM_EDIT, EDIT_HOME | E105,106,108,109,114,116,117 | L | Élevé | 🔴 |
| F2 | Flux vidéo legacy (gén réelle) | NEW_GO,RC_*,GJ_*,RES_*,GF_*,MENU_GEN | section VIDÉO, fin de gén, VX_GO (à brancher) | E105,106,114,115,116,117 | L | Élevé | 🔴 |
| F3 | Wizard photo `nl*` | NL_NEW,NL_CONFIG,NL_GO,NL_* | galerie legacy, éditeur, /newlook | E105,114,116,117 | M | Moyen | 🔴 |
| F4 | Galerie looks | MENU_LOOKS,GAL_*,GGRID | STUDIO›Looks, createFlow | E105,108,109,116 | M | Moyen | 🟠 |
| F5 | Référence (STUDIO) | RX_REFS,REF_FROM_*,REF_UPLOAD | STUDIO›Références | E105,116 | S | Faible | 🟠 |
| F6 | Modèles/styles | SHOWSTYLES,SAVESTYLE,GJM_ST_* | STUDIO›Modèles, éditeur, vidéo | E105,116 | M | Moyen | 🟠 |
| F7 | Décors | STUDIO_DECORS | STUDIO›Décors | E105,116 | S | Faible | 🟡 |
| F8 | Personas | PERSONA,PERSONA_* | STUDIO›Personas | E105,106,116 | S–M | Moyen | 🟡 |
| F9 | Médias/fichiers | FILES_HOME,FILE_* | STUDIO›Médias | E105,116 | S | Faible | 🟡 |
| F10 | Historique | STUDIO_HIST | RÉCENTS›Historique | E105,116 (+E51/53) | M | Moyen | 🟡 |
| F11 | Prêt à poster | SHOWREADY,READY_*,POST* | RÉCENTS›Prêt à poster | E105,116 | S–M | Faible | 🟡 |
| F12 | Menu/nav legacy | MAIN_MENU,HOME_* | tous les Retour legacy | E105,108,109,111,116 | M (diffus) | Moyen | 🟠 |
| F13 | Barre technique | TECH_STOP,TECH_STATUS | barre système (partout) | E112,116 | S | Faible | 🟡 |
| F14 | Commandes texte | /newlook,/prompt,/gens,… | saisie commande | E105,116,117 | S–M | Faible | 🟡 |

---

## FEUILLE DE ROUTE DE MIGRATION (convergence vers UN cockpit / UNE logique / UNE source de vérité)

**Principe** : retirer d'abord les frontières **atteignables depuis le workflow** (celles qui cassent le test live), puis les sections, puis les utilitaires. À chaque pas : grille E116 + garde-fou E117 + régressions + restart sûr.

1. **F3 — neutraliser le doublon photo `nl*`** (🔴, M) : rediriger `NL_NEW`→`photo.look`, retirer les boutons `NL_NEW` des écrans legacy. *Supprime la fuite « NL_NEW → sendPhoto » observée en live.* Quick win structurant.
2. **F13 — barre technique** (🟡, S) : `TECH_STOP`/`TECH_STATUS`→toast. *Quick win, présent partout.*
3. **F12 — Retours legacy** (🟠, M, progressif) : remplacer `MAIN_MENU`/`HOME_*`→`R_home`/`R_studio` au fil des migrations.
4. **F1 — Éditeur image/montage** (🔴, L) : modules `video.montage.*` en bloc média, slice `proj.video.montage`, picker confiné. *Débloque PL_EDIT/VM_EDIT en bloc unique.*
5. **F2 — Moteur vidéo** (🔴, L) : brancher `VX_GO`→génération en mappant `proj.video`→`gw/genJob` ; migrer maquette/résultats/`genFolders`. *Rend la génération réelle conforme.*
6. **F5 + F7 — Référence & Décors STUDIO** (🟠/🟡, S) : pointer vers modules workspace (réutilise l'existant).
7. **F4 + F6 — Galerie & Modèles** (🟠, M) : modules `studio.looks`/`studio.modeles` + CRUD (L5).
8. **F8/F9/F10/F11 — Personas, Médias, Historique, Prêt à poster** (🟡, S–M) : modules de section, dont historique grille+vignettes (L4).
9. **F14 — Commandes** (🟡, S) : rediriger vers les entrées workspace ; garder le diagnostic.

**Cible finale** : un seul cockpit (workspace média + menus texte de section), une seule logique de navigation (routeur), un seul contexte (en-tête permanent), un seul workflow (PHOTO→…→Export), une seule source de vérité (`proj`/draft).

---

## PROJECTION PRODUIT FINAL × legacy résiduel

| Domaine (vision finale) | Touche encore du legacy ? | Lequel |
|---|---|---|
| **Mode Manuel** (pas-à-pas) | ⚠️ partiel | F1 (montage), F2 (gén/résultats) |
| **Mode Automatique** (one-shot jusqu'à la vidéo) | ❌ pas encore branché | F2 (`genAfterScript auto`, `T_AUTO`) + orchestrateur à créer au-dessus de `proj` |
| **Studio** (bibliothèque/gestion) | ✅ presque tout legacy | F4,F5,F6,F7,F8,F9 |
| **Bibliothèque de looks** | ⚠️ | F4 (galerie), F6 (modèles) |
| **Références** | ✅ migré dans le workflow / ⚠️ STUDIO | F5 |
| **Prompts** | ✅ migré (workspace + Studio + biblio) | — (legacy `/prompt` F14 à retirer) |
| **Scripts** | ✅ migré (slice + biblio) ; génération réelle ⚠️ | F2 (`genScriptStep`) |
| **Légendes** | ⚠️ | slice migré ; versions/édition fine = F2 (`GF_LONG/SHORT`) + L4 |
| **Génération images** | ⚠️ moteur legacy appelé | F3 (`runNewLook`/`generateLook`) — moteur OK, UI à confiner |
| **Génération vidéos** | ❌ pas branché | F2 (`recapGo/genFinal`) |
| **Export / livrables** | ⚠️ | F2 (`genFolders`), F11 (prêt à poster) |
| **Historique** | ✅ legacy | F10 |
| **Reprise de session** | ✅ migré (drafts→workspace) ; vidéo partiel | `resumeDraft` (OK photo, vidéo branché sur slice) |
| **Coûts** | ✅ unifié (`estimateCost`/`videoCost`) ; affiché workspace | — (legacy maquette F2 a son propre récap) |
| **Logs / journal** | ✅ commun (`bot_journal.log`/`jlog`/`uiLog`) | — |
| **Auditabilité** | ⚠️ | `project.json` complet (E93–E96) = L6, au-dessus de `proj` |

**Lecture** : le cœur **navigation/contexte/prompts/scripts/références** est migré ; les gros restes sont **F1 (édition/montage)**, **F2 (moteur vidéo + résultats + export)** et **le mode Automatique** (à bâtir au-dessus de `proj`). Le **Studio** est encore très legacy mais à risque faible (sections isolées).

---

_Audit seulement. Aucune migration tant qu'Etoile n'a pas priorisé. — 2026-06-10_

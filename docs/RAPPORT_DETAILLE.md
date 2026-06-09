# RAPPORT DÉTAILLÉ — Conformité aux 73 exigences

> Diagnostic à valider **avant tout développement**. Lecture seule (2026-06-09), aucun code modifié,
> aucun restart. Référentiel : `docs/EXIGENCES.md`. Détail technique : `docs/AUDIT_COMPLET.md`.
> Priorité = **urgence de correction** (les exigences « Conforme » n'ont pas de priorité : `—`).

## Récap chiffré

**Statuts (sur 107 exigences)** : ✅ **Conforme : 38** · 🟡 **Partiellement conforme : 24** · 🟠 **Non conforme : 33** · ◻️ **Non vérifié : 11** · ⛔ **Supersedé : 1** (E68 → E97).
- **Cœur produit / UX (E1–E73)** : 36 Conforme · 21 Partiel · 15 Non conforme · 1 supersedé (E68).
- **Qualité visuelle & identité (E74–E92, 🔴 critique)** : 1 Conforme · 7 Non conforme · 11 Non vérifié.
- **Projet · Stockage · Test/Prod · Validation (E93–E96, 🔴 critique)** : 1 Partiel · 3 Non conforme.
- **Retours 1ᵉʳ test réel (E97–E103, à intégrer en premier)** : 1 Conforme (E103) · 2 Partiel (E100, E102) · 4 Non conforme (E97, E98, E99, E101).

→ **Score sur exigences auditables ≈ 55 %** (50,5/92, hors 11 « Non vérifié »).

**Par priorité** : 🔴 **Critique : 19** · 🟠 **Élevée : 20** · 🟡 **Moyenne : 24** · 🟢 **Faible : 6**.

> Notes : « Non conforme » regroupe Manquant / Régressé / Cassé (précisé en colonne Impact). « Non vérifié » =
> contrôle d'identité non testable maintenant (génération payante requise). La catégorie **Identité (E74–E91)
> est CRITIQUE** ; le QC d'identité passe en **lot critique** du plan d'action.

---

## A. Architecture & principes

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E1 | Cockpit unique, zéro spam | Partiellement conforme | tous | `cockpitPhoto/Caption`:1663/1680 vs `send()` (85×) | Le cœur s'édite en place, mais livraisons/légendes/erreurs empilent des messages | Moyenne |
| E2 | Cockpit 2 sections PHOTO/VIDÉO | Partiellement conforme | nlConfig / cockpit / results | `newlook.mediaId`,`cockpit.mid`,`results.mid` | 3 blocs séparés (connectés) plutôt qu'un cockpit 2-sections unifié | Moyenne |
| E3 | Style ÉDITION partout | Partiellement conforme | tous | divers | Cœur conforme ; reliquats anglais / paragraphes ponctuels | Faible |
| E7 | Manuel vs Auto séparés, Auto fiable | Partiellement conforme | showCreer | `recapGo(auto)`:1159 | Modes séparés ✅ ; fiabilité Auto non prouvée (crédits Anthropic épuisés) | Élevée |
| E8 | Prévisualisation avant CHAQUE validation | Partiellement conforme | maquette / récap | `genMockup`:1223 | Look/vidéo/coût prévisualisés ; décor/prompt/légende sans aperçu | Moyenne |
| E9 | Multi-persona | Partiellement conforme | Profil / Persona | `activePersona`:166 | Scaffold présent ; looks/sorties pas filtrés par persona | Faible |

## B. Coûts & argent

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E10 | Aucune génération payante sans accord | Conforme | récap | `NL_GO2`:2417 / `GJ_GO`:2081 | Jamais de dépense sans confirmation explicite | — |
| E11 | Récap coût+crédits+temps + bouton 💲 | Conforme | récap | `nlPayRecap`:359 / `genAfterScript`:1215 | Sait quoi/combien avant de payer | — |
| E12 | Images éco d'abord | Conforme | nlConfig | mode `eco`:172 | Teste pas cher avant HD/vidéo | — |
| E13 | Maquette avant Kling | Conforme | maquette | `genMockup`:1223 | Aperçu ~centimes avant la grosse dépense | — |
| E14 | Coûts/temps honnêtes | Partiellement conforme | récap coût | `prodTimeLabel`:1126 | Temps annoncé « ~3-10 min » vs 45 min réel → anxiété ; label HD « 1080p » faux | Moyenne |

## C. Looks

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E15 | Créer un look | Conforme | /newlook (nlConfig) | `generateLook` newlook.js:129 | Peut générer un look depuis la réf Imany | — |
| E16 | Modifier un look | Partiellement conforme | showGallery / éditeur | `NL_EDIT`:2445 | Édite l'image (filtres) mais pas tenue/décor/nom | Moyenne |
| E17 | Dupliquer un look | Non conforme (Manquant) | showGallery | — | Impossible de copier un look pour le décliner | Élevée |
| E18 | Supprimer un look | Partiellement conforme | showGallery | `GAL_DEL`:2241 | Supprime (corbeille) mais aucune restauration depuis l'UI | Moyenne |
| E19 | Archiver un look | Non conforme (Manquant) | showGallery | — | Pas de rangement « archives » distinct de la corbeille | Moyenne |
| E20 | Réutiliser un look | Conforme | showGallery | `GAL_PICK`:2225 / `/look` | Re-sélectionne un look existant pour une nouvelle vidéo | — |
| E21 | LOCK / déverrouiller un look | Non conforme (Manquant) | showGallery | — | Impossible de figer un look favori | Élevée |
| E22 | Galerie en grille paginée | Conforme | showGallery | `showGallery`:501 | Parcourt les looks en grille 3×3 paginée | — |
| E23 | Noms de looks lisibles | Partiellement conforme | showLook | `lookName`:413 | Noms auto « Look N · date », non renommables | Faible |

## D. Décors

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E24 | New Look intègre le décor (même écran) | Conforme | nlConfig | `NL_MENU_ENV`:2392 | Choisit tenue + décor sans changer d'écran | — |
| E25 | Décors = CRUD comme les looks | Non conforme | STUDIO_DECORS / nlMenuEnv | `NL_SET_ENV_`:2394 | Ne peut que choisir ; pas créer/modifier/supprimer/dupliquer/archiver | Élevée |
| E26 | Lock Background | Non conforme (Manquant) | décors | — | Impossible de verrouiller un fond | Moyenne |
| E27 | 3 décors de base extensibles | Conforme | nlMenuEnv | `lookbook.envs` | Bougies/Jour/Studio disponibles | — |

## E. Prompts

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E28 | Tous les prompts visibles | Partiellement conforme | /prompt | `defaultPrompt` newlook.js:33 | Voit le prompt de base ; pas ceux par tenue/décor | Moyenne |
| E29 | Prompts éditables | Conforme | /prompt | `PROMPT_EDIT`:2273 | Édite le prompt de base | — |
| E30 | Prompts sauvegardables | Conforme | /prompt | `writeFileSync`:2582 | Sauve (1 emplacement + .bak) | — |
| E31 | Dupliquer un prompt | Non conforme (Manquant) | /prompt | — | Pas de copie de prompt | Moyenne |
| E32 | Supprimer un prompt | Non conforme | /prompt | `PROMPT_RESET`:2274 | Réinitialise seulement, pas de suppression | Faible |
| E33 | Réutiliser un prompt | Partiellement conforme | /prompt | `defaultPrompt`:94 | Un seul prompt réutilisé ; pas de bibliothèque | Moyenne |
| E34 | Prompts gérés SANS changer d'écran | Non conforme (Régressé) | /prompt | handler:2768 | L'édition ouvre un message séparé hors cockpit | Élevée |

## F. Images

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E35 | Générer 1 / 2 / 3 (→6) images | Conforme | nlConfig | `NL_CNT_`:315 | Choisit le nombre d'images | — |
| E36 | Planche contact automatique | Non conforme | nlShowResult | `nlShowResult`:355 | Doit défiler 1-par-1, pas de vue d'ensemble du lot | Élevée |
| E37 | Sélectionner une image pour la vidéo | Conforme | nlShowResult | `NL_VIDEO`:2495 | Choisit l'image qui sert de base vidéo | — |
| E38 | Éditer une image avant la vidéo | Conforme | nlShowResult | `NL_EDIT`:2445 | Retouche avant de lancer la vidéo | — |
| E39 | Affichage entier 9:16 jamais coupé | Conforme | nlShowResult | `raw=true`:357 | Image montrée entière, jamais rognée | — |

## G. Vidéo & Script

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E40 | Vidéo : toutes redirections vérifiées | Partiellement conforme | tous | callbacks (251) | 0 bouton cassé ✅ ; quelques boutons morts trompeurs (« Make Part 2 ») | Moyenne |
| E41 | PHOTO ↔ VIDÉO connectés | Conforme | nlShowResult / récap | `NL_VIDEO`:2495 | Passe image→vidéo sans perte de contexte | — |
| E42 | Chaîne vidéo complète câblée | Conforme | genFinal | `genFinal`:1245 | La vidéo se produit de bout en bout | — |
| E43 | Workflows transverses fluides | Partiellement conforme | divers | — | La plupart fluides ; Archives→Réédition absente | Moyenne |
| E44 | Durée libre 15 s → 2 min | Conforme | CARD_DUR | `RC_DUR_FREE`:2060 | Choisit librement la durée | — |
| E45 | Partie suivante | Partiellement conforme | videoReadyKb | `GF_ADDPART_`:2087 | Marche en session ; **plante** sur vidéos restaurées (après restart) ; bouton « Make Part 2 » mort | Critique |
| E46 | Script affiché & modifiable avant dépense | Conforme | showScriptCard | `showScriptCard`:1168 | Lit/édite le script avant toute dépense | — |
| E47 | Catégories de sujets + anti-répétition | Conforme | showScriptCard | `autoPickTopic`:1109 | Pas 2× le même sujet rapproché | — |
| E48 | Hooks A/B | Conforme | showScriptCard | `genHooks`:1193 | Choisit l'accroche | — |

## H. Historique / Archivage / Réédition / Export / Projet

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E52 | Tout généré sauvegardé & retrouvable | Conforme | — | `makeGenFolder`:1330 | Chaque génération archivée (survit au restart) | — |
| E53 | Historique en grille avec aperçus | Non conforme | STUDIO_HIST / /gens | handler:2001 / :2779 | **Liste texte au mauvais contenu** (photos de looks, pas les vignettes vidéo) ; pas de grille | Critique |
| E54 | Réouverture / réédition / relance d'un projet | Partiellement conforme | videoReadyKb / STUDIO_HIST | `GF_RESTYLE_`:2118 | Réédition seulement sur le résultat courant ; pas depuis l'Historique | Élevée |
| E55 | Modèle sur-mesure complet (look+décor+caméra+style+script) | Non conforme | SHOWSTYLES | `snapshotStyle`:964 | Un « modèle » ne garde que fx+sous-titres ; ni look, ni décor, ni caméra, ni script | Critique |
| E56 | Projet réouvrable à l'identique | Non conforme (Manquant) | — | pas de `project.json` | Impossible de rouvrir un projet complet pour le retoucher | Critique |
| E57 | Prêt à poster / à retravailler | Conforme | showReady | `GF_POST_`:2084 | Range les vidéos prêtes / à retravailler | — |
| E58 | Restyle gratuit local | Conforme | videoReadyKb | `GF_RESTYLE_`:2118 | Re-rend une vidéo gratuitement (ffmpeg) | — |
| E59 | Publication TikTok auto + stockage privé | Non conforme | — | `grep tiktok`=0 ; tmpfiles.org | Aucune publi TikTok ; médias intermédiaires sur hébergeur public | Moyenne |

## I. Légendes

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E49 | Légendes en grille, reliées, versions | Partiellement conforme | videoReadyKb | `resCaptionOf`:1719 | Légende reliée à chaque vidéo ✅ ; pas de grille ni de versions | Élevée |
| E50 | Courte + longue + hashtags copiables | Conforme | videoReadyKb | `parseCaps`:124 / `GF_LONG_`:2110 | Copie la légende d'un tap, sans le titre | — |
| E51 | Éditer / régénérer une légende | Non conforme (Manquant) | videoReadyKb | — | Impossible de modifier/régénérer une légende dans le bot | Élevée |

## J. Navigation

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E4 | OK/Annuler/Précédent/Suivant cohérents + fil d'Ariane | Partiellement conforme | tous | `journey()`:1052 | Retours présents mais nommés ~10 façons ; 3 icônes « Annuler » ; fil d'Ariane sur 2 écrans → désorientation | Moyenne |
| E62 | /stop + /restart en tête | Non conforme | showHome | handler:2701/2717 | Commandes existent mais absentes de l'accueil (enfouies) | Élevée |
| E104 | Accueil = 4 entrées directes (📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS) | Non conforme | showHome | `showHome`:1389 (Créer/Studio/Éditer/Aide/Profil) | Pas de bouton direct Photo/Vidéo/Récents ; fonctions principales à ≥2 clics ou en commande | Élevée |
| E105 | [RÈGLE DIRECTRICE] Blocs fonctionnels uniques & frontières claires (1 fonction = 1 propriétaire) | Non conforme | architecture | doublons : galerie/éditeur/légendes/aperçu accessibles de N endroits ; `CARD_MORE`/`showStudio` mélangent les responsabilités | Chevauchements → confusion ; arbitre tous les doublons (voir matrice de propriété) | Critique |
| E106 | [RÈGLE DE CONCEPTION] Architecture modulaire & évolutive (registre de blocs + routeur) | Non conforme | tout `telegram_bot.js` | monolithe ~2916 l., handlers `if(d===...)` en dur, blocs non isolés, doublons | Impossible d'ajouter/retirer un sous-menu sans risque de casse ; refonte = poser le squelette modulaire | Critique |
| E107 | [DETTE] Refactorisation progressive contrôlée (strangler-fig, suppression après validation) | Non conforme (à faire) | tout `telegram_bot.js` | 273 handlers callback + 32 cmds + 22 `show*` en monolithe | Sortir du monolithe sans réécriture brutale ; plan 8 étapes | Critique |

### Audit UX accueil (E104) — actuel vs cible
**Accueil actuel** (`showHome`:1389) : 🚀 Créer · 🎬 Studio · 🎨 Éditer · ❓ Aide · 👤 Profil. → **ne correspond pas** aux 4 sections d'Etoile.

**Usage réel (bot_journal — fréquences)** : commandes — `/newlook` **71×** (génération PHOTO, sans bouton d'accueil !), `/menu` 68×, `/go` 16×, `/studio` 13×, `/looks` 11×, `/edit` 6× ; pilotage `/restart` **75×** + `/stop` 12× (→ E62). Boutons — `GAL_NEXT` 46× (galerie looks), `NL_GO` 44× (photo), `CARD_MORE` **33×** (☰ menu « Plus » = on creuse dans le déroulant), `MAIN_MENU` 34× (retour accueil), `RES_NEXT/PREV` 49× (résultats), `MENU_TEST` 25×, `HOME_STUDIO` 19×, `MENU_LOOKS` 13×. → **PHOTO, looks, résultats/récents et pilotage sont les usages quotidiens** ; plusieurs sont enfouis (CARD_MORE très cliqué).

**Clics depuis l'accueil — actuel vs cible (1 clic)** :
| Section | Aujourd'hui | Cible |
|---|---|---|
| 📸 PHOTO (génération) | **commande `/newlook`** ou Créer→mode→… (**≥2**) ; aucun bouton direct | 1 |
| 🎬 VIDÉO | Créer→mode→look (**≥2**) | 1 |
| 🏛 STUDIO | 🎬 Studio (**1**) ✅ mais contenu ≠ bibliothèque centralisée | 1 |
| 🕘 RÉCENTS | Studio→🕘 Historique (**2**) — et écran cassé (E53) | 1 |

**Clics supprimables** : PHOTO (−1 à −2, passe en bouton direct), RÉCENTS (−1), VIDÉO (−1) ; vider `CARD_MORE` (☰ Plus, 33×) en remontant les fonctions principales en boutons directs ; Stop/Restart visibles (E62) supprime des `/restart` tapés (75×).

## K. État & Session

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E5 | Conservation d'état | Conforme | tous | `genState`/`saveState`:889 | Look/décor/réglages conservés en naviguant | — |
| E6 | Reprise après crash/restart | Conforme | boot | `resLoad`/stale-fix:1631 | Retrouve les blocs et l'état après redémarrage | — |

## L. Suivi / Logs / Robustesse

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E60 | Suivi génération (progression/statut/temps/relance) | Conforme | genFinal | `setProg`:1252 / `startTicker`:1130 | Voit l'avancement et peut relancer | — |
| E61 | Annulation réelle et fiable | Conforme | genFinal | `genAbort`/`abortNow`:1102 | Stop effectif (même pendant le lipsync) | — |
| E63 | Journal user + logs système | Conforme | — | `jlog`:33 / `uiLog`:24 | Tout est tracé (clics, erreurs API) ; crédits consommés non loggés | — |
| E64 | Erreurs claires et actionnables | Conforme | tous | `humanError`:1137 | Erreur crédits = message FR clair, pas d'auto-relance | — |
| E65 | Clic tracé / action vérifiée / rapport session | Partiellement conforme | — | `jlog`:1960 | Clics tracés ✅ ; pas de rapport agrégé par session | Faible |
| E66 | Robustesse / code mort | Partiellement conforme | — | `launch()`:738 / Shotstack / `MM_*` | Robuste, mais dette de code mort à retirer | Moyenne |

## M. Style / Rendu (verrouillés)

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E67 | Sous-titres 76px / OY 0.370 | Conforme | rendu | `subtitle_style.js` + hook | Sous-titres figés validés | — |
| E68 | ~~Couleur V5 sur la vraie vidéo~~ ⛔ **SUPERSEDÉ par E97** | Obsolète | rendu | `color_style.js` V5 | Etoile ne veut **plus** V5 par défaut → fidélité source (voir E97) | — |
| E69 | Son -14 LUFS / bt709 / pause / réactions | Conforme | rendu | `render_local.js`:366 | Son normalisé, couleur étiquetée, pas de « pause » dit | — |
| E70 | Référence Imany officielle | Conforme | /newlook | `imany_reference.png` | La bonne influenceuse sert de référence | — |

## N. Méthode / Gouvernance

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E71 | Maquette d'abord | Conforme | (process) | — | Toute UI proposée en maquette avant code | — |
| E72 | Mono-session + filet | Conforme | (process) | backups/tests | Sécurité des modifications | — |
| E73 | Fidélité test → prod | Partiellement conforme | (process) | — | Principe tenu ; quelques libellés divergents | Faible |

---

## Vue condensée — les 73 exigences (E# · statut)

**Conforme (36)** : E5, E6, E10, E11, E12, E13, E15, E20, E22, E24, E27, E29, E30, E35, E37, E38, E39, E41, E42, E44, E46, E47, E48, E50, E52, E57, E58, E60, E61, E63, E64, E67, E69, E70, E71, E72.

**Partiellement conforme (21)** : E1, E2, E3, E4, E7, E8, E9, E14, E16, E18, E23, E28, E33, E40, E43, E45, E49, E54, E65, E66, E73. _(E68 ⛔ supersedé par E97.)_

**Non conforme (15 + 6 identité)** : E17, E19, E21, E25, E26, E31, E32, E34, E36, E51, E53, E55, E56, E59, E62 · **+ E76, E81, E82, E83, E84, E91 (identité, critiques)**.

**Identité E74–E92 (🔴 critique)** : Conforme E90 · Non conforme E76, E81, E82, E83, E84, E91, **E92 (GATE source-avant-vidéo, n°1)** · Non vérifié E74, E75, E77, E78, E79, E80, E85, E86, E87, E88, E89.

**Projet/Stockage E93–E96 (🔴 critique)** : Partiel E94 (iCloud base) · Non conforme **E93 (projet unique complet)**, E95 (TEST/PROD), E96 (workflow validation).

**Retours 1ᵉʳ test E97–E103 (à intégrer EN PREMIER)** : Conforme E103 · Partiel E100 (réf cockpit), E102 (état propre) · Non conforme E97 (colorimétrie auto), E98 (« pause » script), E99 (réactions défaut), E101 (biblio références).

**Accueil/UX E104 (🟠 élevée)** : Non conforme — accueil = Créer/Studio/Éditer/Aide/Profil au lieu de 📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS (4 entrées directes).

---

## Plan d'action priorisé

**🔴 Critique** : **(n°1 ABSOLUE) GATE QC SOURCE-AVANT-VIDÉO (E92)** — bloque le lipsync payant tant que l'image source n'est pas QC-validée (3 actions : régénérer/éditer/valider). Puis **(LOT IDENTITÉ)** QC d'identité obligatoire + GATE final bloquant (E82/E91) ; négatif anti-artefacts à valider (E83) ; QC post-génération local à construire (E84) ; corriger texture/poil parasite (E76/E81) — règle E90 (preuve d'étape avant correctif) déjà adoptée. Puis : **(E93) PROJET UNIQUE COMPLET par génération** (raws + versions intermédiaires + prompts + métadonnées coût/crédits/durée + logs + rapport QC ; historique par projet ; actions ouvrir/rééditer/réutiliser/dupliquer/relancer/télécharger/exporter/archiver/restaurer ; remplace E55/E56) ; **(E96) workflow TEST→QC→validation Etoile→PROD** + **(E95) espaces TEST/PRODUCTION** ; **(E94) stockage cloud persistant** (remplacer tmpfiles, redondance) ; (E53) Historique → grille + vignettes + réouverture ; (E45) « Partie suivante » sur vidéos restaurées.

**🟠 Élevée** : **(E104) accueil 4 entrées directes (📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS)** ; (E62) /stop+/restart en tête ; (E17/E21) looks dupliquer+lock ; (E25) décors CRUD ; (E34) prompts gérés dans le cockpit ; (E36) planche-contact auto ; (E49/E51) légendes éditer/régénérer+grille ; (E54) réédition depuis l'Historique ; (E7) fiabiliser le mode Auto.

**🟡 Moyenne** : (E1/E2) cockpit unique/2 sections ; (E4) navigation unifiée ; (E14) temps/labels honnêtes ; (E16/E18/E19) looks modifier/restaurer/archiver ; (E26) Lock Background ; (E28/E31/E33) prompts bibliothèque ; (E40/E43) redirections/workflows ; (E59) TikTok+stockage privé ; (E66) code mort ; ~~(E68) couleur V5~~ (supersedé par E97) ; (E8) aperçus manquants.

**🟢 Faible** : (E3) reliquats style ; (E9) persona ; (E23) renommer looks ; (E32) supprimer prompt ; (E65) rapport de session ; (E73) libellés.

**Séquence recommandée (1 lot testé à la fois)** : **LOT PRÉ-CRITIQUE (E97–E102, à faire EN PREMIER — E103)** : colorimétrie neutre par défaut (E97) · retirer « pause » du script (E98) · réactions défaut OFF (E99) · état propre complet zoom/réactions/durée/réf (E102) · réf cockpit verrouiller+défaut (E100) · biblio références taguée (E101). Ensuite **LOT 0 = GATE QC SOURCE-AVANT-VIDÉO (E92, n°1 absolue)** = stop bloquant + checklist + 3 boutons avant le lipsync payant ; puis négatif anti-artefacts (E83, GO Etoile) + QC local auto en bonus (E84/E82) + GATE final (E91) → **LOT ACCUEIL/NAV (structure, faible risque, fort gain)** : accueil 4 entrées directes 📸/🎬/🏛/🕘 (E104) + Stop/Restart visibles (E62) + vocabulaire retour unifié (E4) → Quick wins (label HD, E36, débounce) → Historique (E53/E54) → Partie suivante (E45) → Looks CRUD → Décors CRUD → Prompts cockpit → Légendes → project.json → Nettoyage/navigation → TikTok/persona/V5.

---

## AUDIT IDENTITÉ & ARTEFACTS (ajout 2026-06-09)

### Cas analysé — artefact « poil au torse »
Vidéo fournie par Etoile = **rendu final de la génération `2026-06-09-15-13`** (« Feminine energy… »).
Confrontation des 3 étapes (frames dans `docs/artefacts/`) :

| Étape | Fichier | Artefact présent ? | Preuve |
|---|---|---|---|
| (a) **Image source Seedream** | `looks/gen_2026-06-09-11-07_p1.jpg` | **OUI** (déjà là) | `docs/artefacts/02_source_seedream_torse_ARTEFACT.jpg` |
| (b) **Raw lipsync Kling** | `outputs/2026-06-09-15-13_raw_p1.mp4` | OUI (hérité) | `docs/artefacts/03_raw_lipsync_kling_torse.jpg` |
| (c) **Rendu final local** | `outputs/2026-06-09-15-13_p1.mp4` | OUI (hérité) | `docs/artefacts/04_rendu_final_torse.jpg` |

**Conclusion : l'artefact naît à l'étape (a) — l'image source Seedream est déjà fautive**, **favorisée par (d) le prompt**.
Kling **n'a rien inventé** (propagation fidèle) ; le **rendu local n'y est pour rien**. Cause racine = `buildPrompt` /
`newlook_prompt.txt` impose *« MAXIMUM skin texture — heavily visible pores… chest neck slight skin unevenness,
raw unfiltered skin quality »* **sans aucun négatif anti-poil/anatomie** → Seedream interprète la consigne « texture
maximale du torse » en pilosité sur le sternum. (Vérifié : `grep` body/chest hair = 0 dans les prompts.)

### Contrôle qualité d'identité OBLIGATOIRE (E74–E91) — 🔴 catégorie critique
> Catégorie **QUALITÉ VISUELLE & IDENTITÉ** = priorité critique. Contrôle obligatoire **avant validation
> finale** de toute génération image/vidéo, sur l'**image source ET la vidéo finale**.
> Statut général = **Non vérifié** (vérif systématique = générations payantes ; **crédits Anthropic épuisés**),
> SAUF E76/E81 déjà **prouvés Non conformes** (cas « poil au torse »), et E82/E83/E84/E91 **Manquants**.

| E# | Exigence | Statut | Écran / Étape | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E74 | Visage identique (source ↔ vidéo finale) | Non vérifié (échantillon OK) | image source + vidéo | `buildPrompt` newlook.js:87 | Visage pourrait dériver de la réf Imany | Élevée |
| E75 | Couleur de peau identique | Non vérifié (échantillon OK) | image source + vidéo | prompt | Carnation pourrait dériver | Élevée |
| E76 | Texture de peau identique (sans parasite) | **Non conforme (prouvé)** | image source Seedream | prompt « MAXIMUM skin texture » | **Poil/texture parasite sur le torse** | Critique |
| E77 | Cheveux identiques | Non vérifié (échantillon OK) | image source + vidéo | prompt anti hair-clip | Mèche/accessoire fantôme possible | Moyenne |
| E78 | Regard identique | Non vérifié (échantillon OK) | image source + vidéo | prompt | Regard/yeux pourraient dériver | Moyenne |
| E79 | Vêtements cohérents | Non vérifié (échantillon OK) | image source + vidéo | prompt outfit | Tissu déformé/fusionné possible | Moyenne |
| E80 | Bijoux cohérents | Non vérifié (échantillon OK) | image source + vidéo | prompt | Bijou doublé/fantôme possible | Moyenne |
| E81 | AUCUN élément parasite (poils · doigts en + · mains déformées · membres en + · accessoires fantômes) | **Non conforme (prouvé)** | image source → vidéo | prompt (pas de négatif) | **Artefacts anatomiques livrés à l'écran** | Critique |
| E82 | QC identité+anatomie systématique (toutes étapes) | Non conforme (Manquant) | toutes étapes | — | Aucun garde-fou ne détecte l'artefact avant publication | Critique |
| E83 | Négatif anti-artefacts dans le prompt (parade i) | Non conforme (Manquant) | newlook.js buildPrompt | `buildPrompt`:87 / `newlook_prompt.txt` | Sans négatif, l'artefact se reproduira | Critique |
| E84 | QC post-génération automatisé (parade ii) | Non conforme (à construire) | image source avant vidéo | — | Pas de détection d'anomalie avant de payer la vidéo | Critique |
| E85 | Anatomie cohérente (proportions, mains, membres) | Non vérifié (échantillon OK) | image source + vidéo | prompt | Mains/doigts/membres pourraient être faux | Élevée |
| E86 | Aucune déformation du visage | Non vérifié (échantillon OK) | image source + vidéo (lipsync) | prompt / Kling | Visage tordu/fondu possible (surtout lipsync) | Élevée |
| E87 | Aucun changement d'âge | Non vérifié (échantillon OK) | image source + vidéo | prompt | Personne rajeunie/vieillie | Élevée |
| E88 | Aucun changement d'ethnie | Non vérifié (échantillon OK) | image source + vidéo | prompt | Origine/carnation/traits modifiés | Élevée |
| E89 | Aucun changement de morphologie | Non vérifié (échantillon OK) | image source + vidéo | prompt | Silhouette/corpulence modifiée | Moyenne |
| E90 | [PROCESS] Étape responsable + PREUVE VISUELLE avant correctif | Conforme (règle adoptée + appliquée) | toutes étapes | montage `docs/artefacts/` | Démontré sur « poil au torse » (montage source/raw/final) | — |
| E91 | [GATE] Validation finale bloquante (QC validé par Etoile) | Non conforme (Manquant) | validation finale | — | Une génération peut être livrée sans QC d'identité | Critique |
| E92 | [GATE] QC identité sur image SOURCE **avant lipsync payant** (n°1) | Non conforme (Manquant) | écran QC pré-vidéo (à créer) | entre image source et `genFinal`→`generateLipsync` | Empêche de **payer une vidéo** sur une image source défectueuse (cas poil-au-torse) | Critique |

### Sources de bug à vérifier (par étape)
1. **Image source (Seedream)** — ✅ identifiée comme l'origine ici.
2. **Génération vidéo (lipsync Kling)** — propage fidèlement (pas la cause ici, mais à surveiller pour les mouvements/déformations).
3. **Prompt** — ✅ cause favorisante (texture torse maximale, zéro négatif).
4. **Upscale** — non utilisé actuellement (Seedream sort en 1440×2560 natif) ; à surveiller si ajouté.
5. **Cohérence d'identité** — pas de comparaison automatique à la référence (E82/E84).

### Règle de process — attribution d'étape + preuve visuelle avant correctif (E90)
Pour **chaque défaut détecté**, on **attribue l'étape responsable** parmi
**{image source · génération vidéo · lipsync · upscale · rendu final}** et on **fournit une preuve visuelle**
(frames/montage de l'étape) **AVANT tout correctif**. Démontré ici sur « poil au torse » :
montage `docs/artefacts/MONTAGE_artefact_comparaison.png` → responsable = **image source (Seedream)**,
upscale **écarté** (absent du pipeline). Cette règle est désormais un **process obligatoire**.

### GATE de validation finale (E91) — BLOQUANT
Aucune génération n'est **« conforme »** tant que :
1. les contrôles d'identité **E74–E89** ont été **effectués** (image source ET vidéo finale), **et**
2. le résultat est **validé par Etoile**.
Aujourd'hui ce gate **n'existe pas** dans la chaîne (une vidéo peut être livrée sans QC) → **Non conforme (Manquant)**, priorité **Critique**.

### 🔴 GATE QC SOURCE-AVANT-VIDÉO (E92) — PRIORITÉ CRITIQUE n°1 (à coder)
**Le contrôle clé** : un gate **bloquant** placé **après l'image source (éco) et AVANT le lipsync payant**.
- **Écran QC** (cockpit) : image source + checklist (poils parasites · doigts/mains/membres · accessoires fantômes · déformation visage · âge · ethnie · morphologie · cohérence visage/peau/cheveux/regard).
- **Anomalie → vidéo bloquée** ; 3 actions : **🔄 Régénérer l'image** · **🎨 Éditer l'image** · **✅ Valider manuellement malgré l'alerte** (choix d'Etoile tracé).
- **Niveau (a) GATE humain minimal = bloquant** (stop + checklist + 3 boutons, validation explicite avant paiement) — simple, fiable, **faisable sans coût**.
- **Niveau (b) détection auto (vision) = bonus** : Claude vision (précis, **coûte des crédits Anthropic**) ou local (Apple Vision/embedding, gratuit mais moins fiable sur poils/accessoires). Complète (a), ne la remplace pas.
- **Bénéfice** : empêche de **payer un lipsync** (≈ 13 cr/partie) sur une image déjà fautive — exactement le cas « poil au torse ». Position : entre l'image source et `genFinal`→`generateLipsync`.

### Parades proposées (à valider — rien appliqué)
- **(i) Négatif anti-artefacts dans le prompt** *(domaine créatif d'Etoile → attente de son GO)* : ajouter
  `no body hair, no chest hair, smooth hairless décolleté, no extra fingers, no deformed hands, no extra limbs,
  no ghost/duplicated accessories, no mutated anatomy` **et adoucir** « MAXIMUM skin texture / chest neck unevenness »
  (probable déclencheur). Fichier concerné : `newlook_prompt.txt` (non verrouillé) / `buildPrompt` newlook.js:87.
- **(ii) Contrôle qualité post-génération** *(à étudier)* : sur l'**image source**, avant de dépenser la vidéo —
  détection de visage/anomalies en **local et gratuit** (Apple Vision `VNDetectFaceLandmarks`, ou comparaison
  d'embedding visage à `imany_reference.png`) ; alerte « anomalie possible — vérifie avant de générer la vidéo ».
  Aucune dépense, exécutable sur le Mac.

> Statut global identité/anatomie : **non vérifiable exhaustivement maintenant** (générations payantes + crédits épuisés) ;
> le cas « poil au torse » est **diagnostiqué et reproductible** (cause prompt/source), parades prêtes à valider.

---

---

## AUDIT PROJET UNIQUE · STOCKAGE · TEST/PROD · VALIDATION (E93–E96) — 🔴 critique

| E# | Exigence | Statut | Écran / Zone | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E93 | Dossier/projet UNIQUE complet par génération (raws + versions + prompts + métadonnées + logs + rapport QC) | Non conforme (partiel) | `outputs/generations/<ts>/` | `makeGenFolder`:1330, `meta.json`:1337 | Impossible de tout retrouver/rééditer/relancer un projet entier | Critique |
| E94 | Stockage cloud & archivage permanent (zéro perte, redondance) | Partiellement conforme | iCloud `podcast-outputs` | `personaOutDir`, `tmpfiles.org` workflow.js:102+ | Base iCloud ✅ mais médias intermédiaires sur hébergeur public éphémère | Critique |
| E95 | Séparation TEST / PRODUCTION (+ promotion sans perte) | Non conforme | `ready_to_post/` `a_retravailler/` | `showReady`:1011, `GF_POST_`:2084 | Pas d'espaces TEST/PROD distincts ; risque de mélange | Critique |
| E96 | Workflow validation qualité (TEST→QC→validation Etoile→PROD + historique) | Non conforme (Manquant) | — | — | Une vidéo peut filer en « prod » sans QC ni validation tracée | Critique |

### Écart vs l'existant
Aujourd'hui `outputs/generations/<ts>/` contient **final + raw_pN + caption + style.json + meta.json + thumbnail** (partiel). **Il MANQUE** :
- le **chemin du look** utilisé, les **prompts** (image / vidéo / lipsync), l'**image source liée**, les **variantes** générées ;
- les **versions intermédiaires** (avant montage / avant zoom / avant sous-titres) — seuls raw lipsync (`raw_pN`) et final sont gardés ;
- les **métadonnées** coût / crédits consommés / durée / moteur / état de validation / historique des modifications ;
- **logs** de génération et **rapport qualité** par projet ;
- l'historique reste **orienté fichiers** (STUDIO_HIST liste des `.jpg`), pas **orienté projet**.
- Stockage : `tmpfiles.org` (public/éphémère) pour les médias intermédiaires → à remplacer (E94/E59).
→ **Chantier critique** : faire de `makeGenFolder` un vrai **conteneur de projet** (project.json complet) + écran Historique par projet + TEST/PROD + workflow de validation.

### Objectif global
Retrouver **instantanément, même des années plus tard**, l'**intégralité** d'une génération (raws, versions intermédiaires, prompts, paramètres, coûts, logs, métadonnées), en distinguant **TEST** et **PRODUCTION**.

---

## AUDIT RETOURS 1ᵉʳ TEST RÉEL (E97–E103) — à intégrer EN PREMIER

| E# | Exigence | Statut | Écran / Zone | Preuve (file:line) | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E97 | Colorimétrie fidèle à la source par défaut (pas de grade auto) | Non conforme | rendu vidéo | `render_local.js:73` `FX_DEFAULT.image` (contrast 1.04, **temperature 5600**=chaud, vignette 1, bright 0.02) appliqué à la vraie vidéo `:315-318`, filtres `colortemperature`/`vignette` `:97-102` | Vidéo plus chaude/contrastée que la source (constaté au QC) | Critique |
| E98 | Aucun « pause » dans le script généré | Non conforme | script | `workflow.js:50` le prompt **impose** d'écrire `[pause]` dans le script ; `stripPauseTokens`/`isPauseToken` ne nettoient que sous-titres+voix (`render_local.js:109,178`), **pas le script affiché/édité** | Le marqueur `[pause]` apparaît dans le script | Élevée |
| E99 | Réactions : défaut OFF, rien d'auto | Non conforme | rendu | `render_local.js:76` `FX_DEFAULT.reactions = { mode: 'natural' }` → **défaut natural**, pas off (toggle OFF/natural/on existe `RE_OFF/RE_NATURAL/RE_ON`) | Des réactions sont ajoutées par défaut | Élevée |
| E100 | Référence personnage depuis cockpit (voir/upload/choisir/changer/**verrouiller**/**défaut**) | Partiellement conforme | /reference, showRefMenu | `showRefMenu`:225 (REF_FROM_GEN/GAL/UPLOAD) ✅ ; **`REF_LOCK`/`REF_DEFAULT` absents** (grep=0) | Peut changer la réf mais pas la verrouiller ni la définir par défaut | Moyenne |
| E101 | Bibliothèque de références (aperçu/nom/**tags/recherche/filtres**/historique) | Non conforme (Manquant) | — | une seule `imany_reference.*` + showRefMenu ; pas de bibliothèque taguée/cherchable (la galerie = looks, pas références) | Pas de gestion de plusieurs références | Moyenne |
| E102 | État PROPRE par défaut (aucun param réappliqué auto) | Partiellement conforme | /edit, setWorkPhoto | `setWorkPhoto`:1501 reset **image→Naturel** sur nouvelle photo (BUG-4) ✅ ; **MAIS** zoom (`FX_DEFAULT.zoom.on=1`), musique, réactions persistent via `style.json` ; durée/modèle via `genState` (`gwReset`:1049) ; référence via `HIGGS_AVATAR_URL` | Couleur image OK, mais zoom/réactions/durée/réf hérités | Élevée |
| E103 | [PROCESS] Priorité : ces 7 d'abord, puis critiques | Conforme (règle adoptée) | plan d'action | présent §plan | — | — |

**Règle de priorité (E103)** : intégrer **E97–E102 en premier**, puis **E92** (gate QC source-avant-vidéo), puis **E93–E96** (projet/stockage/test-prod/validation), puis le reste du plan.

---

---

## BUGS — Retours tests Etoile T7 / T10 / T12 (croisés code + journaux)

| Test | Attendu | Réel confirmé (preuve) | Cause | file:line | Priorité |
|---|---|---|---|---|---|
| **T7a** Éditer depuis le menu | ouvrir l'éditeur sur le look | **Ne fonctionne pas** depuis 🎨 Éditer (menu), **OK** depuis l'aperçu | `EDIT_HOME` n'appelle **pas** `setWorkPhoto` → `editScreen` rend `workSrc()`=`latestRaw()` (un raw vidéo) ou rien ; l'aperçu (`NL_EDIT`) fait `setWorkPhoto(pose)` avant → look valide | `EDIT_HOME` 2322 vs `NL_EDIT` 2446 ; `editScreen` 1077, `workSrc` 1500 | Élevée |
| **T7b** rester dans le bloc | édition en place | **Nouveau message en bas** ; retour à la base OK | `editScreen` rend dans `cockpit.mid` (bloc vidéo) ≠ bloc photo (`newlook.mediaId`) où était l'aperçu → autre message ; si `cockpit.mid` null/stale → `send()` crée un message | `editScreen` 1079 (`cockpitPhoto`) | Moyenne |
| **T10** Étape Look (Nouveau/Galerie/Upload) | s'affiche en création | **S'affiche en Express/Auto** (preuve : 15:01:54 `CREER_EXPRESS` → 15:01:57 `CL_KEEP`) ; **absente en Sur-mesure** (mode le plus utilisé, 3×) | `CREER_SURMESURE`→`openCard` **contourne** `showLookSource` ; Express/Auto l'appellent bien | `CREER_SURMESURE` 1975→`openCard` 1099 ; vs `showLookSource` 1415 | Élevée |
| **T12a** Légende sur vidéo | afficher courte/longue | bouton **présent** (`📋 Légende`) + toggle court/long branchés | OK sur **vidéo fraîche** (même session) | `resKb` 1707, `GF_LONG_` 2110, `GF_SHORT_` 2111 | — |
| **T12b** versions | versions de légende | **aucune version** (un seul `caption.txt`) | pas de versionnage (E49) | `makeGenFolder` 1335 (1 seul write) | Élevée |
| **T12c** après restart | légende accessible | **« ⚠️ Introuvable »** ou nouveau message / branche legacy | `gfIdx` restauré ≠ genFolders re-scannés, ou `gf.vidMid`=null après restart → handler échoue ; item restauré sans `gfIdx` → branche `LCAP_LEGACY` (`setup.lastVideo` null) | `genFoldersLoad` 1317, `GF_LONG_` 2110, `resKb` 1713 | Élevée |

**Rejoignent** : T7→E16/E102 (éditeur), T10→E7/E104 (modes/parcours), T12→E49 (versions)/E54 (réédition après restart). **Tous déjà au plan** (LOT ACCUEIL/NAV + Historique/projet).

### Faut-il une capture d'Etoile ?
- **T7** : ❌ pas nécessaire — cause établie par le code (deux chemins, setWorkPhoto manquant + cockpit.mid).
- **T10** : ⚠️ **utile** pour confirmer le **mode testé** (le journal indique Sur-mesure = sans étape look ; à verrouiller). L'écran lui-même fonctionne (preuve CL_KEEP).
- **T12** : ⚠️ **utile** pour savoir si la vidéo testée était **fraîche** (alors OK, manque juste les versions) **ou restaurée après /restart** (alors bug « Introuvable »). Le code couvre les deux cas ; la capture tranche lequel elle a vécu.

---

_Aucune correction appliquée — diagnostic en attente de validation d'Etoile._

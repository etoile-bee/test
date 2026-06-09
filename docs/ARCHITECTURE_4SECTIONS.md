# ARCHITECTURE — Accueil à 4 sections (PHOTO · VIDÉO · STUDIO · RÉCENTS)

> Recommandation **data-driven** du contenu des 4 entrées (E104), basée sur : l'inventaire d'écrans
> (`SCREENS.md`, 61 écrans), les **fréquences d'usage réelles** (`bot_journal.log` / `logs/ui_journal.jsonl`),
> et les doublons/écrans morts repérés à l'audit (`docs/AUDIT_COMPLET.md`). Doc seulement — aucun code.
> Objectif : **1 clic** pour chaque fonction principale, **zéro menu déroulant**, zéro doublon.

## Fréquences d'usage réelles (top)
**Commandes** : `/restart` 75 · `/newlook` **71** · `/menu` 68 · `/go` 16 · `/studio` 13 · `/stop` 12 · `/looks` 11 · `/edit` 6 · `/creer` 4 · `/test` 3 · `/styles` 2 · `/settings` 2 · `/preview` 2 · `/apercu` 2.
**Boutons** : `GAL_NEXT` 46 · `NL_GO` 44 · `MAIN_MENU` 34 · `NL_SET_CAT_random` 33 · **`CARD_MORE` 33** · `EDIT_HOME` 29 · `RES_NEXT` 26 · `MENU_TEST` 25 · `NL_GO2` 24 · `EDIT_PREVIEW` 24 · `RES_PREV` 23 · `NL_SET_MODE_planche` 22 · `NL_KEEP_CUR` 20 · `RC_GO` 19 · `NL_MENU_CAT` 19 · `HOME_STUDIO` 19 · `NL_MENU_MODE` 18 · `NL_CONFIG` 18 · `NL_VIDEO` 17 · `NL_MENU_ENV` 17 · `RC_LOOK` 15 · `MENU_LOOKS` 13 · `VALIDATE_STYLE` 12 · `GAL_PREV` 12.

**Lecture** : la **génération photo** (`/newlook` 71 + `NL_*`) et la **navigation résultats** (`RES_NEXT/PREV` 49) dominent ; `CARD_MORE` (déroulant « ☰ Plus ») est cliqué **33×** = les gens **fouillent** le menu → à vider. `/restart` 75 = pilotage à exposer (E62).

---

## 📸 PHOTO — créer/gérer l'image
**Rôle** : looks · décors · prompts · images · génération photo. (= le cockpit `/newlook` enrichi.)

| Fonction retenue | Source écran | Justification (usage) |
|---|---|---|
| Générer un look (tenue/décor/format/nombre) | `nlConfig` | `/newlook` **71×**, `NL_GO` 44×, `NL_SET_CAT_random` 33× — **#1 usage** |
| Choisir tenue / décor / format en place | `NL_MENU_CAT/ENV/MODE` | 19 / 17 / 18× |
| Récap coût + 💲 Générer | `NL_GO`/`NL_GO2` | 44 / 24× (garde-fou E10/E11) |
| Résultats image (‹ ›, Garder, Avatar, Éditer, Vidéo) | `nlShowResult` | `NL_KEEP_CUR` 20×, `NL_VIDEO` 17× |
| Galerie looks (grille) + réutiliser | `showGallery` | `GAL_NEXT` 46×, `MENU_LOOKS` 13× |
| Prompts (voir/éditer) | `/prompt` | à intégrer **dans** l'écran (E34) |
| Décors (gérer) | `STUDIO_DECORS`→CRUD | E25 (futur) |

## 🎬 VIDÉO — créer/monter la vidéo
**Rôle** : vidéos · scripts · légendes · montage · génération vidéo. (= la carte vidéo + l'éditeur, fusionnés.)

| Fonction retenue | Source écran | Justification |
|---|---|---|
| Carte vidéo (look/sujet/durée) → GO | `showRecap`/`recapKb` | `RC_GO` 19×, `RC_LOOK` 15× |
| Script (afficher/éditer/hooks) | `showScriptCard` | étape obligatoire avant dépense (E46) |
| Maquette gratuite + GO payant | `genMockup`/`genAfterScript` | `MENU_TEST` **25×** (aperçu local très utilisé) |
| **Montage** : sous-titres / image / zooms / musique / réactions | `showEditHome` (`/edit`) | `EDIT_HOME` 29×, `EDIT_PREVIEW` 24× — **à fusionner ici** (plus une entrée d'accueil) |
| Légendes (courte/longue/hashtags) | `GF_LONG/SHORT` | reliées à la vidéo (E49/E50) |
| Résultats vidéo (livrée, postable, restyle) | `videoReadyKb` | `RES_NEXT/PREV` 49× |

## 🏛 STUDIO — bibliothèque de travail centralisée
**Rôle** : looks · décors · références · médias · projets · ressources réutilisables. (= **consulter/gérer**, ≠ générer.)

| Fonction retenue | Source écran | Justification |
|---|---|---|
| Looks (bibliothèque) | `showGallery` | partagé avec PHOTO (vue gestion) |
| Décors (bibliothèque + CRUD) | `STUDIO_DECORS` | E25/E26 |
| **Références** (voir/upload/choisir/verrouiller/défaut) | `showRefMenu` | E100 (`/reference` **0×** → enfoui/inconnu → à exposer) |
| Bibliothèque de références (tags/recherche) | _(à créer)_ | E101 |
| Médias (photos/vidéos/prêt-à-poster) | `showFileList` (FCAT) | `/files` |
| Modèles/styles réutilisables | `SHOWSTYLES` | `/styles` 2× (peu connu → à exposer) |
| Projets (futur project.json) | _(à créer)_ | E93 |

## 🕘 RÉCENTS — fil des dernières productions
**Rôle** : derniers projets · générations · looks · vidéos · actions.

| Fonction retenue | Source écran | Justification |
|---|---|---|
| Bloc Résultats (dernières livraisons, ‹ ›) | `showResults` | `RES_NEXT/PREV` **49×** — très utilisé |
| Historique des générations (grille + vignettes) | `STUDIO_HIST`/`/gens` (à réparer) | E53/E54 — actuellement cassé (liste texte) |
| Prêt à poster / à retravailler | `showReady` | E57 |
| Réouvrir / rééditer / relancer un projet | _(à créer)_ | E54/E93 |

---

## ❌ À SUPPRIMER / FUSIONNER (doublons, écrans morts, menus inutiles)

| Élément | Décision | Raison |
|---|---|---|
| **`CARD_MORE` (☰ Plus)** | **Vider** | cliqué 33× = fonctions principales enfouies → les remonter dans les 4 sections |
| **`showMainMenu`** (ancien menu liste) | **Supprimer** | doublon de `showHome` ; un seul accueil = 4 sections |
| Entrée d'accueil **🎨 Éditer** | **Fusionner dans VIDÉO** (Montage) + accès depuis une image (PHOTO→Éditer) | pas une section de 1er niveau |
| **`/gens`** vs **`STUDIO_HIST`** | **Fusionner → RÉCENTS** | même contenu, deux portes |
| **`/preview`** + **`/test`** | **Fusionner → « 👁 Aperçu (gratuit) »** | doublon (déjà noté DOLEANCES) |
| Flux **legacy** : `launch()`, `MM_*`, `A_*` (Make Part 2), `getQButtons`, `step1/2/3`, Shotstack | **Supprimer** | code mort, jamais atteignables (audit §4/§7) |
| Boutons **anglais** résiduels (`❌ CANCEL`, `⬅️ Back`) | **Supprimer/traduire** | incohérence FR |
| **Aide** / **Profil** | **Rétrograder** (pied de page / Studio), pas en entrée principale | usage faible vs les 4 cœurs |
| **`/settings`** (2×), **PERSONA** (rare) | **Ranger dans STUDIO/Paramètres** | peu utilisés, pas en 1er niveau |
| 5 conventions de pagination (`GAL_/RES_/NL_NAV/COVER_/GLP_`) | **Unifier** (‹ ›/Préc/Suiv standard) | E4 |

---

# MATRICE DE PROPRIÉTÉ STRICTE (E105 — blocs uniques, zéro chevauchement)

> Règle d'arbitrage : **une fonction = un emplacement · un contenu = un propriétaire · une action = un
> point d'entrée principal**. Propriétaires : **📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS · ⚙️ Système · 🗑 Supprimer**.

## 1. Inventaire → propriétaire UNIQUE

| Fonction / écran (callbacks) | Propriétaire | Justification |
|---|---|---|
| `nlConfig`, `nlMenuCat/Mode`, `runNewLook`, résultats image `nlResultRows` (`NL_*`) | 📸 PHOTO | workflow photo (génération + résultat image) |
| Prompts image (`/prompt`, `PROMPT_*`) | 📸 PHOTO | le prompt sert la génération photo |
| Carte vidéo `showRecap`/`recapKb` (`RC_*`) | 🎬 VIDÉO | point d'entrée unique du workflow vidéo |
| Script `showScriptCard`/`genScriptStep`/`genHooks` (`GJ_*`,`GJM_*`) | 🎬 VIDÉO | étape du workflow vidéo |
| Coût/maquette/GO `genAfterScript`/`genMockup`/`genFinal` (`NEW_*`,`GEN_*`) | 🎬 VIDÉO | production vidéo |
| Éditeur/Montage `showEditHome`,`subsKb`,`imageKb`,`zoomKb`,`musicKb` (`EDIT_*`,`IMG_*`,`S_*`,`ZM_*`,`MU_*`,`VALIDATE_*`,`UNDO_*`,`CMP_*`,`LS_*`) | 🎬 VIDÉO | montage = responsabilité vidéo |
| Aperçu/Cover `runPreview`,`showCover` (`COVER_*`) | 🎬 VIDÉO | aperçu du rendu vidéo |
| Légendes `GF_LONG/GF_SHORT` | 🎬 VIDÉO | la légende appartient à la vidéo |
| Galerie looks `showGallery`/`showLook` (`GAL_*`,`MENU_LOOKS`,`GPICK_*`) | 🏛 STUDIO | **bibliothèque** (PHOTO/VIDÉO y accèdent en *pick*, sans copie) |
| Références `showRefMenu`/`refPreview` (`REF_*`) | 🏛 STUDIO | ressource réutilisable |
| Médias `showFilesMenu`/`showFileList` (`FCAT_*`,`FILES_*`,`FGET_*`) | 🏛 STUDIO | bibliothèque de fichiers |
| Modèles/styles `showStyles` (`SHOWSTYLES`,`LOADSTYLE_*`,`maybeAskLookStyle`) | 🏛 STUDIO | ressources réutilisables |
| Décors `STUDIO_DECORS` + CRUD | 🏛 STUDIO | bibliothèque de décors (PHOTO = picker) |
| Personas (`PERSONA_*`) | 🏛 STUDIO | profils/ressources |
| Résultats récents `showResults`/`resKb` (`RES_*`) | 🕘 RÉCENTS | reprise du travail récent |
| Prêt-à-poster/export `showReady` (`SHOWREADY`,`READY_*`,`POSTSEND_/POSTLONG_`,`GF_POST/GF_REWORK`) | 🕘 RÉCENTS | publication/reprise |
| Historique `STUDIO_HIST`,`/gens`,`genFolders` | 🕘 RÉCENTS | dernières générations |
| `GF_RESTYLE`/`GF_ADDPART` | 🕘→🎬 | listés dans RÉCENTS, **ouvrent** le montage VIDÉO (action, pas copie) |
| Accueil `showHome` + pilotage `/menu /go /stop /restart /status` (`HOME_*`,`MAIN_MENU`,`TECH_*`,`MENU_HELP`) | ⚙️ Système | hôte des 4 blocs + pilotage |
| Paramètres `showSettings` (`/settings`) | ⚙️ Système | réglages techniques |
| `showMainMenu`, `CARD_MORE`, `MM_*` (35), `getQButtons`, `launch`, `A_*` (12), `mDur/mTopicShow/mCats/mRecap/mEditMenu/mScriptMenu/mLook`, Shotstack | 🗑 Supprimer | doublon d'accueil / menu fourre-tout / flux legacy morts |

## 2. Doublons → décision d'arbitrage (qui possède, quoi devient un lien)

| Doublon (présent à N endroits) | Propriétaire unique | Les autres deviennent |
|---|---|---|
| **Galerie looks** (`MENU_LOOKS`, `GAL_*`, `CL_GAL`, `RC_LOOK`, `GAL_EDIT`) | 🏛 STUDIO | **liens « choisir »** depuis PHOTO (look) et VIDÉO (avatar) — aucune copie |
| **Éditeur** (`/edit`, `NL_EDIT`, `GAL_EDIT`, `EDIT_HOME` accueil) | 🎬 VIDÉO | liens depuis PHOTO (résultat→Éditer) ; **retirer 🎨 Éditer de l'accueil** |
| **Légendes** (`GF_LONG/SHORT`, `LCAP_LEGACY`) | 🎬 VIDÉO | affichées sur l'item RÉCENTS via lien ; supprimer `LCAP_LEGACY` |
| **Aperçu** (`/preview`, `/test`, `EDIT_PREVIEW`, `MENU_TEST`) | bloc concerné | **un seul** « 👁 Aperçu (gratuit) » dans PHOTO (image) et VIDÉO (rendu) |
| **Décor** (`NL_MENU_ENV` + `STUDIO_DECORS`) | 🏛 STUDIO | PHOTO = **picker** (lien) |
| **Référence** (`REF_*` + usage gén.) | 🏛 STUDIO | PHOTO/VIDÉO lisent la réf active (lien) |
| **Historique** (`/gens` + `STUDIO_HIST`) | 🕘 RÉCENTS | une seule porte ; supprimer `/gens` doublon |
| **Retour accueil** (`MAIN_MENU`, `showMainMenu`, `showHome`) | ⚙️ `showHome` | supprimer `showMainMenu` |

## 3. Sous-menus qui MÉLANGENT des responsabilités → scission

| Sous-menu actuel | Problème | Scission (responsabilité unique) |
|---|---|---|
| **☰ `CARD_MORE`** (« Plus ») | fourre-tout (persona, technique, aide, aperçu…) | **Supprimer** : persona→🏛 STUDIO · stop/restart/status→⚙️ Système (visibles) · aide→⚙️ Système · aperçu→bloc concerné |
| **`showStudio`** (Looks/Avatars/Photos/Vidéos/Décors/Historique) | mélange bibliothèque **et** récents | 🏛 STUDIO = Looks(+Avatars fusionnés)/Décors/Références/Médias/Modèles ; 🕘 RÉCENTS = Vidéos livrées/Historique |
| **`showEditHome`** (Looks + Sous-titres/Image/Zooms/Musique/Réactions + Modèles + Aperçu) | mélange montage + bibliothèque | 🎬 VIDÉO = sous-titres/image/zoom/musique/réactions/aperçu ; « Looks »→lien 🏛 STUDIO ; « Modèles/Sauvegarder »→🏛 STUDIO |
| **`resSteps`** (🧭 Étapes → photo/vidéo/avatar/sujet/script/édition/test/export) | hub transverse = anti-E105 | remplacer par **retour au bloc propriétaire** de chaque étape |

## 4. Éléments mal placés → destination unique

| Élément | Aujourd'hui | Destination |
|---|---|---|
| 🎨 Éditer | entrée d'accueil | 🎬 VIDÉO (montage) |
| Génération photo `/newlook` | commande seule (71× tapée) | 📸 PHOTO (bouton accueil) |
| Avatars | sous Studio (doublon de Looks) | 🏛 STUDIO (fusion avec Looks) |
| Historique / `/gens` | sous Studio / commande | 🕘 RÉCENTS |
| Persona / `/settings` | dans `CARD_MORE` | 🏛 STUDIO (persona) / ⚙️ Système (settings) |
| Stop / Restart | sous « Technique » | ⚙️ Système (visibles en pilotage, E62) |

## 5. Carte d'architecture figée (sans chevauchement)
```
⚙️ ACCUEIL (showHome) : 📸 PHOTO   🎬 VIDÉO   🏛 STUDIO   🕘 RÉCENTS   (+ pilotage Stop/Restart visible)
📸 PHOTO   → générer look (tenue·décor[pick]·format·nombre) → résultats image → [Éditer↗VIDÉO] [Vidéo↗VIDÉO] · prompts image · aperçu image gratuit
🎬 VIDÉO   → carte (look[pick]·sujet·durée) → script → maquette/aperçu → GO → montage (sous-titres·image·zoom·musique·réactions) · légendes
🏛 STUDIO  → looks · décors · références · médias · modèles · personas · projets   (bibliothèques, lecture/gestion)
🕘 RÉCENTS → dernières générations (grille+vignettes) · prêt-à-poster · réouvrir/relancer (↗ ouvre VIDÉO/PHOTO)
🗑 SUPPRIMÉ : showMainMenu · CARD_MORE · MM_* · A_*/launch/getQButtons · Shotstack · resSteps(hub) · doublons /gens //preview-test
```

## Gains attendus
- **PHOTO, VIDÉO, RÉCENTS à 1 clic** depuis l'accueil (vs ≥2 aujourd'hui, ou commande `/newlook`).
- `CARD_MORE` vidé → fin du « fouille-menu » (33 clics évités).
- `/restart`/`/stop` visibles (E62) → moins de commandes tapées (75×).
- Suppression du code mort + doublons → moins de bugs/confusion (audit).

_Doc seulement. À valider par Etoile avant le LOT ACCUEIL/NAV._

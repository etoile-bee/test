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

## Gains attendus
- **PHOTO, VIDÉO, RÉCENTS à 1 clic** depuis l'accueil (vs ≥2 aujourd'hui, ou commande `/newlook`).
- `CARD_MORE` vidé → fin du « fouille-menu » (33 clics évités).
- `/restart`/`/stop` visibles (E62) → moins de commandes tapées (75×).
- Suppression du code mort + doublons → moins de bugs/confusion (audit).

_Doc seulement. À valider par Etoile avant le LOT ACCUEIL/NAV._

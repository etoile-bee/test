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

**Brouillons / travaux en cours (E110)** — pas de 5ᵉ section : RÉCENTS = **2 vues d'un même magasin de projets** : « ✅ Terminés » + « 📝 Brouillons / En cours » (état `brouillon→validé→archivé`). Brouillon : reprendre · renommer · archiver · supprimer. **`/menu` non destructif** : auto-save du travail en cours comme brouillon (snapshot look/image/script/réglages/persona) → reprise ici, zéro contexte perdu. _Constat actuel : `/menu` (`routeBlock('home')`→`cardMenu`, telegram_bot.js:1073) ne détruit rien en RAM, mais `NEW_GO`→`gwReset`:1050 et `NL_NEW` réinitialisent, et `/restart` perd l'état → l'auto-save brouillon est requis._ Propriétaire unique = RÉCENTS (E105).

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

---

# SQUELETTE MODULAIRE (E106 — séparé + relié + évolutif)

> But : garder des blocs **uniques et fixes** (E105) tout en pouvant **ajouter/retirer/modifier un
> sous-menu plus tard sans casser le reste**. Pattern de conception (à implémenter au LOT ACCUEIL/NAV —
> **non codé ici**).

## Principe : registre de blocs + routeur central
Chaque écran/sous-menu devient un **module déclaré** (une entrée de registre), au lieu d'être codé en
dur dans une chaîne de `if(d===...)`. Un **routeur** unique lit le registre et affiche le bon bloc.

**Forme cible d'un module (déclaratif) :**
```
{
  id:        'photo.look',         // identifiant unique
  parent:    'photo',             // bloc parent (null = entrée d'accueil)
  title:     '📸 Look',            // titre affiché
  owner:     'PHOTO',             // propriétaire unique (E105)
  render:    ctx => ({ caption, rows }),  // construit l'écran (média+légende+boutons)
  actions:   { 'GEN': fn, 'PICK': fn },   // handlers locaux au bloc
  links:     ['studio.gallery'],          // renvois explicites vers d'AUTRES blocs (pas de copie)
}
```

**Routeur central (idée)** : `route(id, ctx)` → trouve le module dans le registre → appelle `render` →
pose le fil d'Ariane via `parent` → câble `actions`/`links`. **Retour** = remonter au `parent`.

## Ce que ça permet
- **Ajouter** un sous-menu (ex. « Décors » dans STUDIO) = **ajouter une entrée** au registre (id+parent+render). Zéro modif ailleurs.
- **Retirer** un bloc = retirer son entrée (le routeur ne le propose plus). Aucune référence morte (les `links` cassés sont détectables).
- **Modifier** un bloc = éditer **son** module isolé, sans toucher aux voisins.
- **Frontières E105 garanties** : `owner` unique par module ; les accès croisés passent par `links` (renvois), **jamais** par duplication de code.
- **Fil d'Ariane / retour automatiques** via `parent` (résout E4 : vocabulaire de retour unifié).
- **Tests** : chaque module testable isolément (un `render` pur + des `actions`).

## Écart avec l'existant
- `telegram_bot.js` = **monolithe ~2916 lignes** ; les écrans sont des fonctions `show*` + une **longue chaîne `if(d===...)`** (≈260 handlers en dur) → ajouter/retirer un menu oblige à toucher plusieurs endroits.
- **Doublons codés** (galerie/éditeur/aperçu appelés de N endroits) au lieu de `links` vers un propriétaire unique.
- **Pas de registre ni de routeur** ; le fil d'Ariane est ad hoc (`journey()` sur 2 écrans).
- **Legacy entremêlé** (`MM_*`, `A_*`, `launch`) augmente le couplage.

## Implications (à respecter pendant la refonte)
1. **LOT ACCUEIL/NAV** : poser le **registre + routeur** d'abord ; migrer les 4 blocs (PHOTO/VIDÉO/STUDIO/RÉCENTS) + Système comme modules. C'est le **socle** des lots suivants.
2. **CRUD looks / décors / références (E15–E26, E100–E101)** : les implémenter **comme modules** (`studio.looks`, `studio.decors`, `studio.refs`) avec actions CRUD locales → ajoutables/retirables proprement.
3. **Projet unique (E93)** : un module `recents.project` réutilisable (ouvrir/rééditer/relancer) branché par `links` vers VIDÉO/PHOTO.
4. **Migration progressive** : un bloc à la fois (le routeur peut cohabiter avec l'ancien code le temps de la bascule), en supprimant les doublons/legacy au passage.
5. **Garde-fou E105** : revue à chaque ajout — un nouveau module doit avoir **un `owner` unique** et n'introduire **aucune duplication** (sinon = `link`).

---

# PLAN DE REFACTORISATION PROGRESSIF — sortie du monolithe (E107)

> Dette technique **prioritaire mais contrôlée**. **PAS** de réécriture brutale : **strangler-fig** —
> on pose le routeur+registre à côté de l'ancien dispatch, on migre **un bloc à la fois**, on teste,
> et on **supprime l'ancien code seulement après validation d'Etoile**. (Plan = doc ; aucun code ici.)

## Étape 1 — Recensement des handlers actuels (mesuré)
**Total : 273 handlers callback** (234 `if(d===…)` + 38 `d.startsWith` + 1 `d.match`) · **32 commandes** `onText` (`/…`) · **22 fonctions `show*`**.

Classement par bloc cible (approx. par préfixe de callback) :
| Bloc cible | Familles de handlers | ≈ nb |
|---|---|---|
| 📸 PHOTO | `NL_*` (33), `PROMPT_*` (2) | ~35 |
| 🎬 VIDÉO | flux `RC_*`(18) `GJ_*`(15) `GJM_*`(4) `GEN_*`(3) `EXPRESS_*`(2) `SCRIPT_OK` ; éditeur `EDIT_*`(10) `IMG_*`(16) `S_*`(19 sous-titres) `ZM_*`(7) `MU_*`(5) `RE_*`(4) `COVER_*`(4) `VALIDATE/UNDO/CMP/LS/SAVE*` | **~115** |
| 🏛 STUDIO | `GAL_*`(7) `CL_*`(9) `GLP_*`(2) `REF_*`(4) `MENU_LOOKS` `STUDIO_*`(2) `PERSONA_*`(2) `SHOWSTYLES/REUSE` `FCAT_/FILES_` | ~30 |
| 🕘 RÉCENTS | `RES_*`(6) `GF_*`(8) `SHOWREADY/READY_*` `ADD_*`(4) | ~20 |
| ⚙️ Système | `HOME_*`(3) `CARD_*`(2) `TECH_*`(3) `MAIN_MENU` `MENU_HELP` `NOOP`(16) + cmds `/menu //go //stop //restart //status` | ~30 |
| 🗑 Supprimer (legacy mort) | `MM_*`(25) `A_*` `L_*`(3) `D_*`(3) `T_*` `CHG_*`(2) `SHOW`(showMainMenu) `getQButtons` `launch` | ~40 |

## Étape 2 — Responsabilités (une ligne par groupe)
- `NL_*` : configurer + générer + parcourir les **images** (workflow photo).
- `RC_*`/`GJ_*`/`GEN_*` : **carte vidéo → script → maquette → génération**.
- `EDIT_*`/`IMG_*`/`S_*`/`ZM_*`/`MU_*`/`RE_*`/`COVER_*` : **montage** (image, sous-titres, zoom, musique, réactions, cover).
- `GAL_*`/`CL_*`/`MENU_LOOKS` : **bibliothèque looks** (parcourir/choisir).
- `REF_*` : **références** ; `FCAT_/FILES_` : **médias** ; `SHOWSTYLES/REUSE` : **modèles** ; `PERSONA_*` : **profils**.
- `RES_*` : **résultats récents** ; `GF_*` : actions sur **vidéo livrée** ; `SHOWREADY/READY_*` : **prêt-à-poster**.
- `HOME_*`/`CARD_*`/`TECH_*`/cmds pilotage : **système/accueil**.
- `MM_*`/`A_*`/`launch`/`getQButtons` : **anciens flux morts** (à supprimer).

## Étape 3 — Doublons + dépendances dangereuses (état partagé / globals)
**Doublons** (cf. matrice §2) : galerie, éditeur, légendes, aperçu, décor, référence → 1 propriétaire + `links`.

**Globals à risque pour l'extraction** (rendent une fonction non-isolable) :
| Global / état | Utilisé par | Risque | Isolation proposée |
|---|---|---|---|
| `cockpit.mid`, `newlook.mediaId`, `results.mid` | rendu en place partout | un module qui édite le mauvais message | passer par `ctx.panel` (gestionnaire de message par bloc) |
| `newlook` (objet) | PHOTO + vidéo (look) | couplage photo↔vidéo | `ctx.state.photo` ; la vidéo lit via `links`/getter |
| `genJob`, `genState`, `gw` | VIDÉO + reprise | état de génération éparpillé | `ctx.state.video` |
| `results` | RÉCENTS + livraisons | écrit depuis genFinal | `ctx.state.recents` + API `addResult()` |
| `workingSource`, `HIGGS_AVATAR_URL` (.env) | PHOTO/VIDÉO/réf | la « photo de travail » globale | `ctx.state.workingSource` + setter unique |
| `freshBloc/staleBloc` (stale-fix) | tous les blocs | recréation après restart | service partagé `panel.fresh()` |
| `style.json` (fx) / `loadFx/writeFx` | éditeur + rendu | params hérités (E102) | service `fx` + reset par défaut |
| `escHtml/escH`, `_sig/_msgSig`, `_fileId` | partout | utilitaires dispersés | module `utils` importé |
| `setup.lastVideo`, `galMid`, `lastCardSig`, `sessions/SESSION_VARS` | legacy + session | état legacy entremêlé | migrer/retirer avec le legacy |
**Principe** : aucun module ne touche un global en direct → tout passe par un **`ctx`** (état + services) injecté par le routeur.

## Étape 4 — Registre de blocs
Nouveau fichier **`ui/registry.js`** : un tableau/map de modules. Forme d'un module :
```
{ id, parent, title, owner, render(ctx)->{caption,rows}, actions:{CB:fn(ctx)}, links:[ids] }
```
Le registre **ne contient pas d'état** (il décrit la structure) ; l'état vit dans `ctx.state`.

## Étape 5 — Routeur central (cohabite avec l'ancien — strangler-fig)
Nouveau fichier **`ui/router.js`** : `route(id, ctx)` → cherche le module → `render` → pose le **fil d'Ariane** via `parent` → câble `actions`/`links`. Le **dispatch existant** (`if(d===…)`) reste en place ; au début du handler, on tente `router.handle(d, ctx)` ; **si le bloc n'est pas encore migré**, on retombe sur l'ancien code. → bascule **sans big-bang**.

## Étape 6 — Ordre de migration (du plus sûr au plus couplé)
1. **⚙️ Système + accueil** (poser routeur+registre, 4 entrées E104, Stop/Restart visibles) — socle, peu d'état.
2. **🗑 Legacy mort** (`MM_*`/`A_*`/`launch`/`getQButtons`/`showMainMenu`) — **suppression à froid** (déjà injoignable, prouvé audit) : réduit le bruit avant de migrer le vivant.
3. **🏛 STUDIO** (galerie/références/médias/modèles) — surtout **lecture/affichage**, le moins risqué.
4. **🕘 RÉCENTS** (résultats/historique/prêt-à-poster) — lecture + actions simples.
5. **📸 PHOTO** (`NL_*`) — workflow autonome, état `newlook` bien identifié.
6. **🎬 VIDÉO** (carte+script+montage) — **le plus gros et le plus couplé → en dernier**, une fois `ctx` rodé.
_Justification : on stabilise le socle et on supprime le mort avant de toucher au cœur payant (vidéo)._

## Étape 7 — Tester après CHAQUE déplacement
Régressions **`nodup 16 / feedback 15 / gallery 7 / nbphotos 7 / stalefix 8`** + **smoke `/go` `/menu`** + **test fonctionnel du bloc migré** (tous ses écrans/boutons). **Rien n'avance si rouge.**

## Étape 8 — Supprimer l'ancien code APRÈS validation
L'ancien handler d'un bloc n'est retiré **qu'après** : tests verts **ET** **validation visuelle d'Etoile** du bloc migré. Jamais avant. (Le strangler-fig garantit qu'on peut revenir en arrière tant que l'ancien code est là.)

## Filet & critères
- **Filet** : backups `.preXXX`, **mono-session**, `node --check`, **petits commits** (« refacto: migre bloc X »), preuve (régressions+smoke), journal.
- **Critère « bloc migré OK »** : écrans via routeur · callbacks via registre · **zéro global en direct** (via `ctx`) · régressions vertes · smoke vert · **validé par Etoile**.
- **Où ça se pose** : le **registre + routeur** sont créés au **LOT ACCUEIL/NAV** (étape 1-2) ; les **CRUD** (looks/décors/références) et le **projet unique** (E93) sont écrits **directement comme modules**.

## NAVIGATION UNIVERSELLE & EN PLACE (E108 / E109) — posée au routeur (L0-1c)
**E108 — barre de nav universelle** ajoutée AUTOMATIQUEMENT par le routeur à chaque bloc, comportement identique partout :
**⬅ Retour** (parent) · **➡ Suivant** (si `next` ET `gate` ok ; sinon **➡ Suivant 🔒** grisé → toast « choisis d'abord ») · **🏠 Accueil** (si pas racine) · **❓ Aide** (contextuelle, EN PLACE) · **⏹ Stop** · **🔄 Restart**. Handlers centralisés (`R_*`, `RH_*`, `RLOCK`, `TECH_STOP/RESTART`).
**E109 — en place / bloc fixe** : tout rendu passe par `ctx.show` (édition du bloc courant, anti-doublon ①) ; jamais de `send()` pour un résultat d'étape. Pattern : Action → résultat dans le bloc → validation → ➡ Suivant.
**Mécanisme module** (prêt pour L0-2+) : `next` (id étape suivante) · `requireChoice` (bool) · `gate(ctx)->bool` · `help` (texte). Vérifié : gate OFF→🔒, gate ON→Suivant actif.

## RÉCONCILIATION E109 ↔ E111 + IMPACT ROUTEUR (à valider AVANT de continuer L0)

**Le problème** : aujourd'hui le routeur **édite le cockpit EN PLACE** (`ctx.show`=`cardMenu`→`cockpitCaption`, telegram_bot.js:1073) — il **remplace** l'écran. E111 demande que la **navigation** crée un **nouveau message persistant** (sans effacer l'ancien), tandis que l'**édition intra-tâche** reste en place, et que les **messages système** s'auto-suppriment.

**Frontière (qui édite-en-place vs qui crée un bloc) :**
| Cas | Comportement cible | Exemples |
|---|---|---|
| **Édition intra-tâche** (E109) | **éditer le message du bloc courant** (anti-doublon ①) | toggles tenue/décor/format · sliders /edit · ‹ › dans le même lot · rafraîchir aperçu · ➡ Suivant qui s'active |
| **Navigation** (E111) | **nouveau message persistant** (les précédents restent) | `/menu` · ouvrir PHOTO/VIDÉO/STUDIO/RÉCENTS · ➡ **Suivant** (étape suivante) · **résultat validé/livré** |
| **Système** | **éphémère, auto-delete** | « Bot prêt » · « Redémarrage… » · « ⏳/📊 génération… » · toasts · erreurs transitoires |

**Changement de comportement du routeur (cible, NON codé) :**
1. `ctx.show(caption, rows, mode)` avec **3 modes** : `inplace` (édite le message du bloc courant), `navigate` (envoie un **nouveau** message persistant + mémorise son id), `ephemeral` (envoie + planifie l'auto-suppression).
2. **Registre d'ids par bloc** (id de bloc → dernier message id), au lieu d'un unique `cockpit.mid` : une édition intra-tâche vise le message du bloc actif ; une navigation en crée un nouveau **sans toucher** aux précédents.
3. `route(id)` par défaut = **`navigate`** (ouvrir un bloc/section/étape = nouveau bloc persistant) ; les rendus internes d'un module (réglages, ‹ ›, aperçu) = **`inplace`**.
4. **Service éphémère** `system(msg)` : envoie un message technique et le **supprime** au prochain événement utilisateur (ou après délai). Réutilise/retire l'actuel « Bot prêt »/tickers.
5. **Anti-doublon ①** conservé **dans le mode `inplace`** (signature avant édition) ; le `stale-fix` s'applique aux blocs persistants (un bloc périmé après restart est recréé, pas édité dans le vide).
6. **Callbacks depuis d'anciens blocs** : restent fonctionnels (les boutons d'un ancien écran métier rouvrent/relancent via le routeur) — cohérent avec « reconsulter l'historique ».

**Impact / risque** : c'est un **glissement** du modèle « cockpit unique auto-édité » (E1 strict) vers « **historique de blocs métier persistants + système éphémère** ». Plus de messages, mais navigables ; mitigé par : intra-tâche en place (zéro spam pendant le travail) + auto-delete du système. **À VALIDER par Etoile avant de poursuivre L0** (change le contrat de rendu du routeur, interagit avec anti-doublon ① et stale-fix).

## BARRE SYSTÈME (E112) + RÉCENTS 4 ÉTATS (E110 raffiné)
- **Ordre barre** : `🛑 Stop | 🔄 Restart | ❓ Aide` — **❓ Aide toujours à l'extrême droite**. (Routeur L0-1c actuel : à réordonner ainsi ; `🏠 Accueil`/`⬅ Retour`/`➡ Suivant` restent sur la ligne workflow.)
- **Aide enrichie** : (a) commandes disponibles · (b) liste des « / » · (c) aide contextuelle de l'écran courant.
- **RÉCENTS = 4 vues/états** : 📝 Brouillons · ⏳ En cours · ✅ Terminés · 🗄 Archivés (E110).

## PERSISTANCE D'ÉTAT BOUT-EN-BOUT (E114) — conception (critère d'acceptation L0-2)

**Principe** : le **brouillon actif** (`draftId` stable, E110/E113) est la **SOURCE DE VÉRITÉ UNIQUE** du projet en cours. Tout module d'étape lit/écrit **son slice** dans ce brouillon → navigation libre, retour éditable, avancée sans perte.

**Modèle de données (brouillon) :**
```
draft = {
  draftId, persona, step,           // identité + étape courante
  look:   { source, params },       // slice LOOK
  image:  { variants:[], validée },  // slice IMAGE
  script: { texte, sujet, hooks },   // slice SCRIPT
  montage:{ subs, image, zoom, musique, reactions }, // slice MONTAGE
  legendes:{ courte, longue, tags }, // slice LÉGENDES
  params: { durée, format, ... },
  ts
}
```

**Liaison étape ↔ brouillon (contrat de chaque module) :**
- `render(ctx)` : **LIT** `draft[slice]` (pré-remplit l'écran avec l'état exact). Aucun champ ⇒ valeurs par défaut.
- `actions` (toute modif) : **ÉCRIT** dans `draft[slice]` puis re-`render` en place (E109).
- ⬅ **Retour** vers une étape → `render` recharge **son** slice (état exact, éditable).
- ➡ **Suivant** → ne touche pas l'aval déjà saisi ; passe `step` à l'étape suivante.
- `/menu` / section / `/restart` → le brouillon persiste (E110/E113) → reprise à l'identique.

**Impact / changement vs existant (à appliquer en L0-2) :**
| Aujourd'hui (efface) | E114 (recharge) |
|---|---|
| `gwReset()` (1050) remet `gw`/`genJob` à zéro à la ré-entrée vidéo | charger le slice `script`/`montage`/`params` du brouillon |
| `NL_NEW` / `openCard` réinitialisent look/images | charger le slice `look`/`image` du brouillon |
| état en RAM perdu au `/restart` | brouillon relu depuis `drafts/<persona>/<draftId>.json` |
→ **Remplacer les resets par des recharges de slice.** Chaque entrée d'étape : *« si brouillon actif a ce slice → le charger ; sinon défaut »*.

**Conservation de l'aval (E115)** : Retour→modifier→➡ Suivant **reprend la suite déjà existante** (Script/Montage ne disparaissent pas en revenant sur Look). Si une modif rend l'aval **incompatible** → invite **« Conserver / Mettre à jour / Régénérer ? »** (jamais d'effacement silencieux). ⬅ Retour · ➡ Suivant · 🏠 Accueil partout, état sauvé à chaque étape.

**Critère d'acceptation L0-2** : pour chaque étape migrée — back/forward/`/menu`/restart **sans perte** ; modifier une étape antérieure puis avancer **conserve l'aval**. Finalisation → « Terminé » ; suppression explicite → retiré ; sinon **toujours éditable**.

## WORKSPACE MÉDIA vs MENU TEXTE (L0-2a-bis) — contrainte Telegram & modèle des blocs

**Contrainte Telegram** : un message est SOIT texte SOIT média. On **ne peut pas** éditer un message texte EN message photo (ni l'inverse) ; `editMessageText` échoue sur un message média. Donc « rendu en place » a deux familles de blocs distinctes :

| Bloc | Rendu | Primitive | Édité via | Usage |
|---|---|---|---|---|
| **MENU TEXTE** (ACCUEIL/sections) | texte | `ctx.show` → `uiShow`/`tgEditText` | `editMessageText` | `home`, `photo`, `video`, `studio`, `recents`, aide |
| **WORKSPACE MÉDIA** (canvas du projet) | photo + caption + boutons | `ctx.showMedia` → `nlMedia` | `editMessageMedia` (vignette) / `editMessageCaption` (contexte) | `photo.look`, `photo.image`, `photo.ref`, `photo.refgal` |

**Modèle** : entrer dans « ✨ Nouveau look » **OUVRE le workspace** = un **bloc média unique** (`newlook.mediaId`), **distinct** du menu texte. À l'intérieur, `Look ↔ Image ↔ Référence` naviguent **EN PLACE** via `editMessageMedia`/`editMessageCaption` (anti-doublon ① + stalefix de `nlMedia`). Chaque étape **AFFICHE** son visuel (lu depuis le slice) — pas seulement le conserve : vignette du look actif (ou réf active si pas de look), aperçu de l'image en cours/validée, vignette de la référence active.

**Règles d'ancrage** (sinon retour cassé) :
- `activeRootMid` (le bloc texte courant) n'est **JAMAIS** ancré sur le workspace média → le menu texte reste éditable au retour.
- Quitter le workspace (Retour vers une section texte, 🏠 Accueil, `/menu`) **ferme proprement** le bloc média (suppression) → **zéro empilement**.
- `refThumb()` produit la vignette de réf à un **chemin keyé par mtime** : une réf remplacée (même nom `imany_reference.*`) passe l'anti-doublon et la vignette se met à jour.

**Checklist d'aperçus (validation L0-2a-bis)** : vignette look actif (LOOK) · vignette référence active · aperçu image en cours (IMAGE) · indicateur d'étape (« LOOK 1/2 » / « IMAGE 2/2 ») · brouillon/projet actif visible (📝 id court).

## Gains attendus
- **PHOTO, VIDÉO, RÉCENTS à 1 clic** depuis l'accueil (vs ≥2 aujourd'hui, ou commande `/newlook`).
- `CARD_MORE` vidé → fin du « fouille-menu » (33 clics évités).
- `/restart`/`/stop` visibles (E62) → moins de commandes tapées (75×).
- Suppression du code mort + doublons → moins de bugs/confusion (audit).

_Doc seulement. À valider par Etoile avant le LOT ACCUEIL/NAV._

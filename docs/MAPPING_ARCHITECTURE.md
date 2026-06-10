# MAPPING existant → ARCHITECTURE FINALE

> Cible : `docs/ARCHITECTURE_FINALE.md`. Ici : pour **chaque** nœud/action de la cible, ce qui
> **EXISTE déjà** (fonction/écran dans `telegram_bot.js` sauf mention) et ce qui **MANQUE**, avec
> une **éval d'effort** (faible / moyen / élevé). But : préparer une **migration par étapes**
> (un onglet à la fois, testé), **sans big-bang**.
>
> _Rapport seulement — aucun code modifié. 2026-06-08._

---

## A. STRUCTURE DE NAVIGATION

### Accueil → Photo / Vidéo / Studio

| Cible | Existe ? | Détail | Manque | Effort |
|---|---|---|---|---|
| Accueil | ✅ partiel | `showHome()` (cockpit photo + boutons) | Entrées actuelles = **Créer / Studio / Éditer / Aide / Profil**, pas **Photo / Vidéo / Studio**. Renommer/réorganiser les 3 entrées. | **faible** |
| → Photo | ✅ | `nlConfig()` (config look/photo), `runNewLook()` | Pas branché comme entrée directe « Photo » de l'accueil. | faible |
| → Vidéo | ✅ | flux vidéo `startGen()`→`workflow.js` (spawn), `showRecap()`, `NEW_GO` | Idem, à exposer comme entrée directe « Vidéo ». | faible |
| → Studio | ✅ | `showStudio()` | Contenu actuel (Looks/Avatars/Photos/Vidéos/Décors/Historique) ≠ cible (Look/Décor/Caméra). | moyen |

### Studio → Look {Upload/Pick/Random} / Décor / Caméra

| Cible | Existe ? | Détail | Manque | Effort |
|---|---|---|---|---|
| Look | ✅ | catégorie de tenue via `nlMenuCat()` / galerie | « Look » comme section à 3 sources unifiée. | faible |
| Look · **Upload** | ✅ | `REF_UPLOAD` / `showRefMenu()` / état `ref_upload_wait` / `setImanyRef()` | Rattacher à « Look ». | faible |
| Look · **Pick** | ✅ | `MENU_LOOKS` → `showGallery()` (planche 3×3 paginée) | Rattacher à « Look ». | faible |
| Look · **Random** | ✅ | `🎲 Surprise` (`NL_SET_CAT_random`) ; `pickRandom()` / `look_picker.js` | Rattacher à « Look ». | faible |
| **Décor** | ✅ | `nlMenuEnv()` (`NL_SET_ENV_*`) + `STUDIO_DECORS` (liste lecture seule) ; décors dans `lookbook.json` | Décor = section Studio à part entière (aujourd'hui sous la config photo). | faible |
| **Caméra** | ❌ **manque** | Pas de contrôle caméra dédié. Existe seulement : **zoom vidéo** (`EDIT_ZOOM`, `fx.zoom`) côté éditeur ; l'angle caméra n'est qu'**un bout de texte du prompt** (planche). | Onglet/section **Caméra** : angle, cadrage, focale, mouvement — comme réglage 1ʳᵉ classe (photo ET vidéo), persistant et sauvegardé. | **élevé** |

### Génération → Prévisualisation / Résultat / Légende courte / Légende longue / Script / Modifier / Enregistrer

| Cible | Existe ? | Détail | Manque | Effort |
|---|---|---|---|---|
| **Prévisualisation** | ✅ | `runPreview()` (`/apercu`), `MENU_TEST` (rendu local gratuit `/test`) | Unifier sous l'écran Génération. | faible |
| **Résultat** | ✅ | `nlShowResult()` (photo brute 9:16), `showResults()` (bloc résultats), livraison vidéo | OK. | faible |
| **Légende courte** | ✅ lecture | `parseCaps()` lit `SHORT:` du `.txt` généré par `workflow.js` | **Édition** in-cockpit + bouton dédié dans Génération. | moyen |
| **Légende longue** | ✅ lecture | `parseCaps()` lit `LONG:`/`HASHTAGS:` ; affichage `GF_LONG_*` | **Édition** in-cockpit ; longue > 1024 (cf. contraintes). | moyen |
| **Script** | ✅ | `showScriptCard()` (affiche + édite), `genScriptStep()`, `autoPickTopic()` | Exposer comme entrée de l'écran Génération (existe surtout dans le flux vidéo). | faible |
| **Modifier** | ✅ partiel | `showEditHome()` (éditeur) | Tabs actuels ≠ cible (cf. section B). | moyen |
| **Enregistrer** | ⚠️ partiel | `saveStyleAuto()` / `snapshotStyle()` / `ready_to_post` snapshot | Sauvegarde **projet complet réouvrable** (cf. section C). | **élevé** |

---

## B. ONGLETS « MODIFIER » (cible : Média/Photo/Vidéo/Script/Légendes/Paramètres)

Éditeur actuel `showEditHome()` : **Looks · Sous-titres · Image · Presets · Zooms · Musique ·
Réactions · Sauvegarder · Modèles · Aperçu**. À remapper vers les 6 onglets cibles :

| Onglet cible | Existe ? | Pièces réutilisables | Manque | Effort |
|---|---|---|---|---|
| **Média** | ✅ partiel | `cockpitPhoto()` / `cockpitVideo()` / `nlMedia()` (afficher/échanger le média), upload réf | Onglet « Média » explicite (voir/remplacer le média courant du projet). | faible |
| **Photo** | ✅ partiel | `nlConfig()` (tenue/décor/format), `EDIT_IMG` (`fx.image`), `SHOW_PRESETS` | Regrouper **prompts + décor + caméra** dans un onglet Photo. (Caméra manque, cf. A.) | moyen |
| **Vidéo** | ✅ partiel | `EDIT_ZOOM` (`fx.zoom`), `EDIT_MUS` (musique), `EDIT_REACT` (réactions), durée (`gw.duration`) | Onglet « Vidéo » unifié (zoom/caméra/musique/durée/réactions). | moyen |
| **Script** | ✅ | `showScriptCard()` + édition | Rattacher comme onglet de Modifier. | faible |
| **Légendes** | ✅ lecture | `parseCaps()` | **Édition** courte+longue in-cockpit. | moyen |
| **Paramètres** | ⚠️ épars | `MENU_TECH`, `PERSONA`, format (`NL_MENU_MODE`), `fx` | Onglet « Paramètres » unifié (aujourd'hui dispersé). | moyen |
| _(Sous-titres — `EDIT_SUBS`)_ | 🔒 | `subtitle_style.js` **verrouillé** (76/OY0.370) | À ranger dans Vidéo ou Paramètres **sans toucher au fichier verrouillé**. | faible |

---

## C. SAUVEGARDE — projet réouvrable à l'identique

| Élément à sauver | Existe ? | Détail | Manque | Effort |
|---|---|---|---|---|
| média | ⚠️ | chemins en mémoire (`workingSource`, `newlook.urls`, `gw.look`) + `results_bloc.json` | Persistance liée au **projet** (pas juste à la session). | moyen |
| prompts | ❌ | prompt construit à la volée (`buildPrompt`) ; `newlook.extra` éphémère | Stocker le(s) prompt(s) du projet. | moyen |
| décor | ⚠️ | `newlook.env` en mémoire | Persister par projet. | faible |
| caméra | ❌ | n'existe pas (cf. A) | Tout. | élevé |
| script | ⚠️ | `genJob.script` en mémoire ; `.txt` à côté du `.mp4` après génération | Persister par projet avant génération. | moyen |
| légendes | ⚠️ | dans le `.txt` post-génération | Persister + éditer par projet. | moyen |
| paramètres | ⚠️ | `style.json` (fx), `snapshotStyle()` (subs+fx) | État complet par projet. | moyen |
| **« Projet » comme entité** | ❌ **manque** | Aujourd'hui : `styles` (fx) + `ready_to_post` (snapshot post-prod). Pas de notion de **projet** unique regroupant tout et **réouvrable à l'identique**. | Modèle de données `project.json` (média+prompts+décor+caméra+script+légendes+paramètres) + ouvrir/enregistrer. | **élevé** |

---

## D. RÈGLES GLOBALES — déjà tenues ou à compléter

| Règle | État actuel |
|---|---|
| Aucun onglet/fenêtre/popup hors cockpit | ✅ déjà le principe (cockpit auto-édité ; `stale-fix` garantit la visibilité après restart). |
| Chaque clic tracé | ✅ `jlog('ETOILE→ [bouton] …')` + `bot_journal.log` ; ⚠️ certaines éditions média via `fetch` brut **non journalisées** (à compléter). |
| Chaque action vérifiée | ⚠️ partiel (anti-doublon par signature, `isGone`/`isNotMod`) ; pas systématique. |
| Chaque erreur journalisée | ✅ `console.error('err:…')` + `⚠️ … REFUS` ; ⚠️ à homogénéiser. |
| Auto-correction si possible | ⚠️ partiel (recréation message si `isGone`, `stale-fix`, anti-gel poll) ; à étendre. |
| Rapport détaillé par session | ⚠️ `dev_journal.txt` (côté dev) ; pas de rapport **utilisateur** par session. |

---

## E. CONTRAINTES TELEGRAM (à intégrer dans le plan)

1. **1 message = média OU texte.** Un message « photo/vidéo » porte une **caption**, pas un grand
   corps de texte. Pour afficher un **long texte** (script complet, légende longue), il faut un
   message **texte** (sans média) → dans un éditeur unique, cela impose soit de **basculer** le
   cockpit média↔texte (supprimer/recréer), soit d'accepter une caption tronquée. Le `stale-fix`
   gère déjà la recréation propre ; à généraliser pour les onglets « texte ».
2. **Caption ≤ 1024 caractères** (`cap1024()` tronque déjà). Script et légende longue dépassent
   souvent → onglet texte dédié ou pagination.
3. **Albums (`sendMediaGroup`) = AUCUN bouton inline.** Donc la galerie/aperçu multi-images reste
   une **planche-image unique** (3×3 actuelle), pas un vrai album cliquable. Toute idée d'« album »
   perd les boutons → incompatible avec « tout dans le cockpit ».
4. **`editMessageMedia`** permet de changer photo↔vidéo **dans le même message** (bon pour l'éditeur
   unique), mais re-upload si pas de `file_id` en cache (latence/poids ; cache `_fileId` déjà en place).
5. **Édition de message** : seuls média **ou** caption/markup sont éditables ; un changement de type
   (texte↔média) = nouvelle création. À anticiper pour les bascules d'onglets.

---

## F. SYNTHÈSE EFFORT (pour un plan par étapes)

| Lot | Contenu | Effort | Re-casse risque |
|---|---|---|---|
| **1. Renommer l'Accueil** | 3 entrées Photo/Vidéo/Studio | faible | faible (texte/routing) |
| **2. Studio = Look/Décor/Caméra** | regrouper Upload/Pick/Random + Décor (Caméra = stub) | faible→moyen | faible |
| **3. Écran Génération unifié** | Prévis/Résultat/Script/Légendes/Modifier/Enregistrer | moyen | moyen (flux central) |
| **4. Modifier = 6 onglets** | remap éditeur actuel (sans toucher `subtitle_style.js`) | moyen | moyen |
| **5. Édition Légendes in-cockpit** | courte+longue, gérer >1024 | moyen | faible |
| **6. Caméra (1ʳᵉ classe)** | nouveau réglage photo+vidéo | **élevé** | moyen |
| **7. Projet réouvrable** | modèle `project.json` + ouvrir/enregistrer | **élevé** | élevé (état global) |

**Recommandation de séquence** : 1 → 2 → 3 → 4 → 5 (gains visibles, faible risque), puis 6, puis 7
(les deux gros morceaux). Chaque lot : maquette → 1 onglet → test (régressions 16/15/7/7 + stalefix
+ smoke `/menu` `/go`) → commit. Jamais deux lots en même temps.

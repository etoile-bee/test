# AUDIT FINAL v4r — honnête (❌ écart · 🟡 partiel · ✅ conforme · ⚠️ non vérifiable)

> Règle Etoile : « 20 rouges honnêtes plutôt qu'un faux vert ». Preuves : harness no-spend (`R0_DRYRUN`), lecture code réel, mesures disque. État live : `0d9dda5` (FREEZE, non déployé : ce qui est marqué « offline » n'est PAS encore live).

---

## ZONE 1 — Historique / Fichiers / Studio / Prêt à poster (doublons)

| Espace | Rôle | Contient | NE contient PAS | Source réelle |
|---|---|---|---|---|
| **Galerie** (`R0_PH_GAL`) | choisir une photo pour le flux | toutes les images du patrimoine | vidéos, textes | `r0RealImages` → podcast-looks + podcast-outputs + projects_r |
| **Historique** (`R0_PH_HIST` / `R0_VI_HIST`) | revoir tout le passé | images (PH) **ou** vidéos (VI), scope global | — | idem `r0RealImages`/`r0RealVideos` |
| **Fichiers / Ressources** (`R0_RES`) | hub assets DU projet courant | image·vidéo·script·légendes·hashtags·audio·sous-titres·prompt | médias des AUTRES projets | facts du projet courant (`C.visibles` + drafts/publication) |
| **Studio** (`R0_STUDIO`) | bibliothèques de l'univers | avatars·looks·décors·voix·prompts·templates·références·paramètres + entrées Historique/Publiés/Fichiers | médias finaux d'un projet | `INV.studioSections` → outfits_catalog, lookbook, prompts lib… |
| **Prêt à poster** (`pret`) | file d'attente à publier | médias marqués `garde` | médias non retenus | facts media `etat='garde'` |
| **Publiés** (`publies`) | archives publiées | médias `etat='publie'` | non publiés | facts media `etat='publie'` |

**DOUBLONS FONCTIONNELS détectés :**
- ❌ **Galerie (`R0_PH_GAL`) ≡ Historique photo (`R0_PH_HIST`)** : depuis le fix visibilité, les DEUX font `galleryKind=image, galleryAll=true, srcReturn=photo_prompt, go('gallery')` → **strictement identiques**. Avant : Galerie=projet / Historique=global. Maintenant : doublon. → **À trancher** : soit Galerie repasse en scope « projet » par défaut (bascule vers global), soit on fusionne les deux entrées.
- 🟡 **Studio>Historique / Studio>Publiés / Studio>Fichiers** : `Fichiers`=`R0_RES` (même hub que Résultat>Ressources : OK, même entrée) ; `Historique`⊃`Publiés` (Publiés = sous-ensemble) → pas un doublon strict mais **chevauchement** à clarifier dans la future archi.
- ✅ **Prêt à poster ≠ Publiés** : cycles distincts (file d'attente vs archivé). Pas de doublon.

---

## ZONE 2 — Matrice navigation (◀ Retour / 🏠 Accueil / 🛑 Stop)

**Règles globales (wrapper `nav.view` + reducer) :**
- 🏠 **Accueil** (`R0_HOME`) : sur écran de flux EN COURS (`photo_prompt, video_params, video_edit, block, confirm, confirm2`) → **écran `quit`** (« Enregistrer avant de quitter ? ») ; sinon → `home`.
- 🛑 **Stop** (`R0_STOP`) : → `home`, **efface** `pending`/`block`/`quitFrom` (interrompt l'action en cours) ; **conserve** le projet + ses médias + brouillons sauvegardés.
- 💾 **Auto-save** : `r0SaveNav` écrit `v4r_nav.json` (screen/section/block/pending/projet) à **chaque** rendu → restauré au boot (fix A, offline).

| Écran | ◀ Retour → | Cohérent ? |
|---|---|---|
| photo | home | ✅ |
| photo_prompt | photo | ✅ |
| photo_montage | photo_prompt (R0_PH_GEN) | ✅ (écran orphelin depuis retrait Montage — 🟡) |
| photo_result | photo | ✅ |
| confirm/confirm2 | R0_GEN_CANCEL → prépa (photo_prompt/video_params) | ✅ |
| video | home | ✅ |
| video_params | video (R0_VI_BACK) | ✅ |
| video_edit | video_params (R0_VI_CREATE) | ✅ |
| gallery | photo **ou** video | ✅ |
| resources | video_result **ou** photo | 🟡 incohérent : depuis Studio/Récents, retour part vers video_result/photo (pas vers Studio) |
| studio / studio_section | home / studio | ✅ |
| recents | home | ✅ |
| block (sous-vues) | parent (R0_PH_GEN/R0_VI_CREATE/R0_VE) | ✅ |

**Écarts nav :**
- 🟡 `resources` (Fichiers) : `Retour` part vers `video_result`/`photo` même quand on y arrive via Studio ou Récents → devrait revenir à l'origine. **Incohérence de retour contextuel.**
- 🟡 `photo_montage` : écran encore atteignable par cb direct mais plus de bouton (Montage retiré de Photo) — orphelin inoffensif, à nettoyer.
- ✅ Reste : Retour/Accueil/Stop cohérents et présents partout (carto 156/0).

---

## ZONE 3 — Conservation des données (preuve hash/état avant-après)

Tests harness (réels, 0 THROW) :
| Transition | Résultat |
|---|---|
| Photo→Vidéo conserve la source | ✅ (même fichier) |
| Régén script conserve thème + source | ✅ |
| Vidéo→Photo conserve l'image | ✅ |
| re-Photo→Vidéo : script+thème+source intacts | ✅ |
| /v4r conserve le projet (médias) | ✅ |
| /restart conserve image + script + thème | ✅ |
| Redémarrage bot (deploy/crash) | 🟡 **offline** : fix A (boot recharge `v4r_nav.json` + ▶️ Reprendre) prêt mais **non déployé** → aujourd'hui en live, un restart hors `/restart` revient à l'accueil |
| Changement de référence (R0_REF_REPLACE) | ⚠️ non testé ici (upload requis) |
| Régén légende (R0_GENTXT_pub_*) | ✅ écrit le champ, conserve le reste (SIM) |

**Verdict Zone 3** : ✅ conservation solide sur le parcours ; 🟡 le cas « redémarrage involontaire » n'est corrigé qu'en offline (A).

---

## ZONE 4 — Définition « Modèle » (à clarifier AVANT réactivation)

État réel du code :
- **💾 Défaut** (`R0_DEFSAVE`) : enregistre **UN champ** courant (tenue, format, st_*, …) comme **défaut du persona** (`ui/defaults`), réappliqué aux prochaines générations.
- **💾 Modèle** (`R0_SAVEMODEL`) : enregistre **TOUTE la config** courante (photo : prompt/look/decor/format/reference ; vidéo : script/voix/musique/duree/st_*) comme **défauts du persona**.
- **Studio>Templates** : simple **bibliothèque en lecture** (gabarits de rendu `presets/`), `note: 'pas d_objet Template dédié'`.

**Clarification (proposée) :** ❌ ambiguïté actuelle — « Modèle » N'EST PAS un projet complet réouvrable ; c'est un **jeu de valeurs par défaut réutilisées** à la prochaine création. Il **ne** sauvegarde **ni** les médias **ni** un projet rouvrable. → Décision Etoile requise : garder « Modèle = préréglages » (et le renommer « 💾 Préréglages » pour lever l'ambiguïté) **ou** créer un vrai objet « Modèle de projet » réouvrable. **Ne pas réactiver tant que non tranché.**

---

## ZONE 5 — Conformité écran par écran à la référence

| Écran | Conformité règles Etoile |
|---|---|
| Accueil | ✅ 4 portes + Stop/Restart |
| Photo·Préparer | ✅ Prompt/Tenue/Décor/Référence + Aperçu/Valider/Générer (Montage retiré) |
| Photo·Aperçu | ✅ action principale en bas (Valider→Générer) ; texte court (offline C) |
| Photo·Résultat | ✅ hub assets |
| Vidéo·Préparer | ✅ source + Montage + Outils photo + Aperçu/Valider/Générer |
| Vidéo·Montage | ✅ Script/Musique/Sous-titres/Durée + Aperçu(clip)/Valider/Générer |
| Vidéo·Aperçu | ✅ clip sous-titré (offline : robustesse placeholder) + Sous-titres éditables |
| Galerie/grille | ✅ flèches haut/Choisir/numéros · 6/page · 🗑 corbeille soft ; ❌ doublon Historique (Zone 1) |
| Fichiers (hub) | ✅ un bouton par asset ; 🟡 retour contextuel (Zone 2) |
| Studio | 🟡 chevauchement Historique/Publiés/Fichiers ; Templates = lecture seule |
| Sous-titres | ✅ apparence connectée aperçu+rendu (offline : matérialisation iCloud) |
| Textes copiables | ✅ `<code>` brut + message séparé |

**Risques de régression croisée détectés :** aucun bloquant ; la principale incohérence introduite par les correctifs récents = **doublon Galerie/Historique** (effet de bord du fix visibilité global). À corriger dans le déploiement groupé.

---

## SYNTHÈSE — écarts à traiter (déploiement groupé)
1. ❌ **Doublon Galerie ≡ Historique** (effet de bord visibilité globale) — décider fusion ou scope projet par défaut.
2. 🟡 **Retour contextuel `resources`** (revient toujours vers video_result/photo).
3. 🟡 **`photo_montage` orphelin** (nettoyer).
4. ❌→🟢 **Restart involontaire perd le contexte** — fix A prêt (offline).
5. ❌ **« Modèle » ambigu** — clarifier (préréglages vs projet réouvrable) avant réactivation.
6. 🟢 **Offline prêts** : A, B, B+, C, ANO-SOURCE-PLACEHOLDER, aperçu sous-titré robuste, verrou.
7. ⏸ **D** (disposition) — attente choix Etoile.

> Tout ⚠️/🟡 listé est honnête. Rien de déployé. Re-vérification Dispatch attendue avant présentation à Etoile.

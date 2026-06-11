# AUDIT FINAL v4r — honnête (❌ écart · 🟡 partiel · ✅ conforme · ⚠️ non vérifiable)

## TABLEAU DE CONFORMITÉ V2 — build déployé `79eac5f` (markup réel)
> Bot online · LIVE ON · budget 3/10 · lecteurs **241 img / 239 vid** · sweep **418 OK / 0 KO**.

| Écran | Markup réel (déployé) | Conformité V2 |
|---|---|---|
| Accueil | 📸 Photo·🎬 Vidéo·🏛 Studio·🕘 Récents·Stop·Restart | ✅ |
| Photo·Préparer | Prompt·Tenue·Décor·Référence·👁 Aperçu·🎬 Faire une vidéo·Retour·✅ Valider·✨ Générer·🏠·🛑 | ✅ (D1 sans Montage) |
| **Photo·Aperçu** | média + Retour·✏️ Modifier·✅ Valider·🏠·🛑 (**aucun coût**) | ✅ **D3** (média seul) |
| **Validation** | Moteur·Coût·Crédits·budget n/10·durée + Retour·💾 Modèle·✨ Générer maintenant | ✅ **D3** (chiffré distinct) |
| Vidéo·Montage | Script·Musique·Sous-titres·Durée·👁 Aperçu·✅ Valider·✨ Générer | ✅ |
| Sous-titres | Mot/**Phrase**/**Paragraphe**·Archivo/Classique·S/M/L·Haut/Milieu/Bas·Blanc/Jaune/Cyan·Défaut·👁 Aperçu·Valider·Retour | ✅ **D2** (paragraphe) |
| Galerie | ◀ Précédent·✅ Choisir·Suivant ▶·🖼1-6·📁 Ce projet·🗑 Retirer·Retour·🏠 | ✅ **D4** (global+filtre) flèches haut |
| Fichiers (hub) | Image·Vidéo·Audio·Prompt·Script·Sous-titres·Légendes·Hashtags + Retour contextuel | ✅ |
| Historique / Publiés / Prêt | journal global / publiés / file | ✅ (D4 rôles) |
| Sortie 2-confirm | « Oui, générer (n°X) » → seule dépense | ✅ garde-fou |

**Écarts V2 RESTANTS (honnêtes, non bloquants) :**
- 🟡 **D5** « Modèle » = encore préréglages (pas duplication projet) — `S.duplicateProject` non câblé au bouton. À faire (renommer/recâbler).
- 🟡 **D7** hashtags : champ séparé encore présent dans le bloc pub ; fusion légende+#tags à la copie pas encore appliquée.
- 🟡 **« Accueil » vs « Hub »** : libellés UI déjà « Accueil/Mes fichiers » (pas de « Hub » visible) — ✅ de fait ; à reconfirmer terrain.
- ⚠️ **Génération photo/vidéo réelle** : chemin conservé + améliorations (refOverride/placeholder) ; **à confirmer au test terrain** (clic d'Etoile, dépense).



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
- 💾 **Auto-save** : `r0SaveNav` écrit `v4r_nav.json` (screen/section/block/pending/projet) à **chaque** rendu → restauré au boot (fix A, **DÉPLOYÉ** — voir Zone 3).

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
| Redémarrage bot (deploy/crash) | ✅ **DÉPLOYÉ** : au boot (`telegram_bot.js:4623` PERSISTANCE DE CONTEXTE) le bot recharge `v4r_nav.json` + propose ▶️ Reprendre (`R0_RESUME:3101`, bouton boot `:4629`) → restaure écran/projet/pending. *(correction note stale : c'était marqué « offline non déployé » à tort — vérifié présent dans `cfc869c`.)* |
| Changement de référence (R0_REF_REPLACE) | ⚠️ non testé ici (upload requis) |
| Régén légende (R0_GENTXT_pub_*) | ✅ écrit le champ, conserve le reste (SIM) |

**Verdict Zone 3** : ✅ conservation solide sur le parcours ; ✅ le cas « redémarrage involontaire » est **corrigé ET DÉPLOYÉ** (fix A présent dans `cfc869c` : boot recharge `v4r_nav.json` + ▶️ Reprendre).

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

## SYNTHÈSE — écarts (lot GAPS G1–G5, offline)
1. ✅ **G1 — Doublon Galerie ≡ Historique** : rôles distincts (Galerie=sélection ✅ Choisir / Historique=lecture R0_GVIEW_). Voir `ANOMALIES.md#ANO-G1-GAL-HIST`.
2. ✅ **G2 — Retour contextuel `resources`** : Retour revient à l'origine (Récents/Studio/Résultat/Publication). `ANO-G2-RES-RETURN`.
3. ✅ **G3 — `photo_montage` orphelin** : écran supprimé, cb résiduel renvoyé à photo_prompt. `ANO-G3-MONTAGE-ORPHELIN`.
4. ✅ **Restart involontaire** : fix A **DÉPLOYÉ** (présent dans `cfc869c`) — note stale corrigée.
5. ✅ **G4 — « Modèle » = projet réutilisable** (D5) : `R0_SAVEMODEL`→`duplicateProject` (+ correctif unicité genId). `ANO-G4-MODELE-D5`.
6. ✅ **G5 — hashtags fusionnés à la copie** (D7) : `r0FuseTags`, champ hashtags conservé séparé. `ANO-G5-HASHTAGS-D7`.
7. 🟢 **Offline prêts (antérieurs)** : A, B, B+, C, ANO-SOURCE-PLACEHOLDER, aperçu sous-titré robuste, verrou.
8. ⏸ **D** (disposition) — déjà tranché/déployé (D2/D3/D4) ; reliquats G4/G5 ci-dessus traités.

> Sweep après lot G : **431/0**, audit 0. Rien de déployé (offline). Re-vérification Etoile attendue (sweep+audit+markup) avant certification. Reste hors lot : ⚠️ terrain (génération réelle photo/vidéo, reboot réel, dépense d'une gén tuée).

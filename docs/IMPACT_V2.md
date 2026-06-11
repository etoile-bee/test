# IMPACT V2 → EXISTANT — contrôle AVANT déploiement (convergence, pas remplacement)

> Règle : les changements V2 se limitent à **disposition / libellés / flux**. La couche **données / lecteurs / cloud / persistance** reste **INTACTE** — sauf les correctifs de fond déjà validés qui **AMÉLIORENT** ces zones (preuve de non-régression fournie). Tout changement V2 touchant une zone sensible est **signalé** (arbitrage Dispatch).
> État live = `0d9dda5`. LIVE = OFF (désarmé, sécurité conformité). Lot offline committé, NON déployé.

Légende impact : 🟦 disposition/UI seulement · 🟩 fond améliorant (prouvé) · 🟥 toucherait la donnée → signalé.

---

### 1. PERSISTANCE (état/contexte)
1. **Existe** : `r0SaveNav`→`v4r_nav.json` (screen/section/block/pending/projet) à chaque rendu ; `r0RestoreNav` au `/restart`.
2. **V2 modifie** : 🟩 boot recharge TOUJOURS l'état + ▶️ Reprendre (fix A) — restaure écran exact sur tout redémarrage.
3. **Conserver** : le format `v4r_nav.json`, l'écriture à chaque rendu.
4. **Intouchable** : `socle.js` (facts.json), structure projects_r.
- **Preuve non-régression** : conservation testée à travers /menu·/v4r·/restart (image+thème+script+source intacts, 0 THROW). A **ajoute** la reprise au boot, ne retire rien.

### 2. MÉDIAS (dépôt)
1. **Existe** : `S.addCandidate` (facts), `r0CloudCopy`, `r0RealPhoto`/`r0RealVideo` déposent fichiers + facts.
2. **V2 modifie** : 🟦 rien sur le dépôt ; D5 « Modèle » = `S.duplicateProject` (duplique facts, **n'altère pas** l'original).
3. **Conserver** : addCandidate, chemins de dépôt, cloud copy.
4. **Intouchable** : facts.json existants, fichiers disque.
- **Preuve** : `duplicateProject` crée un NOUVEAU projet (id distinct), source inchangée ; aucun reader modifié.

### 3. GALERIE (sélection)
1. **Existe** : `galleryView` + `ctx.galleryFiles` (paginé 6) ; sélection `R0_GITEM`→`picksrc`.
2. **V2 modifie** : 🟦 D4 — `R0_PH_GAL`/`R0_VI_GAL` repassent **scope projet par défaut** (bascule 🌍 Tout) ; flèches en haut/Choisir/numéros (disposition).
3. **Conserver** : `picksrc` (sélection qui prend), pagination 6, mosaïque numérotée.
4. **Intouchable** : `r0RealImages`/`r0RealVideos` (les LECTEURS) — non modifiés par D4.
- **Preuve** : seul le **scope par défaut** + l'**ordre des boutons** changent ; le LECTEUR reste identique → **comptes 239/239 inchangés** (Historique global les expose toujours).

### 4. LECTEURS (r0RealImages / r0RealVideos)
1. **Existe** : walk récursif podcast-looks + podcast-outputs + projects_r, dédup nom+taille → **239 img / 239 vid**.
2. **V2 modifie** : 🟦 **RIEN**. La V2 ne touche pas les lecteurs.
3. **Conserver** : tout (walk, dédup, sources).
4. **Intouchable** : `r0RealImages`, `r0RealVideos`, `r0Walk`, `r0EnsureLocal`.
- **Preuve** : `node telegram_bot.js --count` reste **239/239** après application V2 (à reconfirmer post-déploiement). Aucun diff sur ces fonctions dans le lot V2.

### 5. CLOUD (iCloud / podcast-looks)
1. **Existe** : symlinks `looks`→podcast-looks, `outputs`→podcast-outputs ; `r0CloudCopy`, `r0ArchiveProjet`, `r0EnsureLocal` (matérialise dataless).
2. **V2 modifie** : 🟦 **RIEN** (aucune écriture cloud changée par la disposition).
3. **Conserver** : symlinks, cloud copy, archive, matérialisation.
4. **Intouchable** : structure podcast-looks/projets, migration faite.
- **Preuve** : aucun chemin cloud modifié dans le lot V2 ; r0EnsureLocal **améliore** (génération réelle ne part plus sur fichier vide).

### 6. FICHIERS PROJET (hub)
1. **Existe** : `resourcesView` = hub assets (image/vidéo/audio/prompt/script/sous-titres/légendes/hashtags).
2. **V2 modifie** : 🟦 D4 rôle (Fichiers=projet actif) ; retour contextuel (origine) ; D7 hashtags listés ici ; « Accueil » au lieu de « Hub ».
3. **Conserver** : les boutons d'asset (R0_GET*/R0_FULLTEXT), texte brut copiable.
4. **Intouchable** : `R0_FULLTEXT_` (contenu brut), `r0FindAudio`.
- **Preuve** : changements = libellés + cb de retour ; aucun accès fichier modifié.

### 7. PHOTO→VIDÉO (source unique)
1. **Existe** : `r0SourceFile`/`r0PinSource`/`r0CoverFile` + garde-fou `_r0IsRef` ; pins sur sélection/génération/Garder/TOVIDEO.
2. **V2 modifie** : 🟦 disposition (boutons), 🟩 ANO-SOURCE-EDIT-REVERT (Garder épingle + anti-référence) déjà validé.
3. **Conserver** : source unique lue partout, hash identique de bout en bout.
4. **Intouchable** : la chaîne `r0SourceFile`/pins.
- **Preuve** : hash stable Sélection→Aperçu→Vidéo→Montage ; « Garder » épingle (source==sélection) ; garde-fou anti-cuir. **Amélioration, pas régression.**

### 8. RÉSULTATS (bloc final figé)
1. **Existe** : `r0PostFinal` (bloc persistant 5 boutons), protection « tap n'édite pas le bloc final ».
2. **V2 modifie** : 🟦 libellés (Accueil) ; D5 « Modèle » = duplication (bouton).
3. **Conserver** : bloc figé non-perdable, r0RenderMids.
4. **Intouchable** : la persistance des rendus, la protection anti-écrasement.
- **Preuve** : `renders=1` conservé après taps (déjà prouvé) ; D5 ajoute une action, n'altère pas le bloc.

### 9. SOUS-TITRES
1. **Existe** : `r0SubOpts` (mappe st_*→opts), `r0SubClip`/`r0SubSample` (aperçu), `render_local.buildAss` (rendu) ; mêmes opts aperçu+rendu.
2. **V2 modifie** : 🟦 D2 ajoute disposition **« paragraphe »** (mot/phrase/paragraphe) ; aperçu auto sur l'écran Aperçu vidéo.
3. **Conserver** : `r0SubOpts` cohérence aperçu/rendu, `subtitle_style.js` (verrou intact), buildAss.
4. **Intouchable** : `subtitle_style.js` (fichier verrouillé), buildAss couleur/alignement.
- **Preuve** : « paragraphe » = un token de plus dans le mapping ; aperçu/rendu partagent toujours `r0SubOpts` (burn ffmpeg prouvé).
- 🟥 **À SIGNALER** : « paragraphe » nécessite une règle de découpe (combien de mots/lignes par paragraphe ?) NON précisée par V2 → **arbitrage** avant implémentation fine du rendu (l'UI peut exposer l'option ; le découpage exact = à définir).

### 10. SCRIPTS
1. **Existe** : catégories legacy (12), `R0_REGEN_SCRIPT` in-screen, topic = script réel > theme_seed (B+), `WF.generateScript`.
2. **V2 modifie** : 🟩 B/B+ déjà validés (régén in-screen, catégorie pilote).
3. **Conserver** : 12 catégories, régén in-screen, priorité topic.
4. **Intouchable** : `WF.generateScript`, le seed de catégorie.
- **Preuve** : régén reste sur le bloc, varie, même thème (prouvé harness). Amélioration.

### 11. LÉGENDES
1. **Existe** : `publication` (courte/longue/hashtags), `R0_FULLTEXT_legc/legl/tags`, édition pub block.
2. **V2 modifie** : 🟦 D7 — hashtags **fusionnés dans la légende copiable** + listés à part dans Fichiers ; plus de bloc hashtags-seul dans l'UI principale.
3. **Conserver** : champs publication, copie brute.
4. **Intouchable** : `setPublication`, structure facts.publication.
- **Preuve** : fusion = concaténation à la COPIE (légende + \n + #tags) ; les champs facts restent séparés (donnée intacte) ; seul l'affichage/copie change.

---

## ÉCARTS V2 touchant une zone sensible → À SIGNALER (arbitrage)
- 🟥 **D2 « paragraphe »** : règle de découpe non précisée (mots/paragraphe) → l'UI peut l'exposer, le rendu fin attend ta règle.
- 🟥 **D3 Aperçu vs Validation distincts** : aujourd'hui fusionnés dans `confirm` (média + garde-fou chiffré) + `confirm2` (double confirm). Séparer = **changement de flux** (nouvel écran). Le contenu garde-fou existe déjà — je n'invente pas la séparation exacte : confirme « Aperçu = média seul (sans coût) → Valider → Validation = chiffré → Générer → double confirm » et je l'implémente.
- 🟦 **D4 scope Galerie** : décision déjà prise (projet par défaut + toggle) — confirme que c'est l'attendu (sinon Galerie reste global).

## CE QUI NE BOUGE PAS (intouchable, garanti)
`socle.js` (facts) · `r0RealImages`/`r0RealVideos`/`r0Walk` (lecteurs **239/239**) · symlinks cloud + `r0CloudCopy`/`r0ArchiveProjet` · `subtitle_style.js` (verrou) · `WF.*` (moteurs) · garde-fous coût/budget/crédits/verrou-restart/incident.

## CONCLUSION
Le lot V2 = **disposition/libellés/flux + correctifs de fond améliorants**. **Aucune couche donnée/lecteur/cloud/persistance n'est réécrite.** Les 3 points 🟥 (D2 découpe, D3 split, D4 scope) attendent ton arbitrage avant d'être figés. Sur ton go, déploiement atomique unique, puis re-preuve `--count 239/239` + tableau de conformité.

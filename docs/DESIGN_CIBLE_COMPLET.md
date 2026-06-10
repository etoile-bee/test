# DESIGN CIBLE COMPLET — Podcast Workflow (à valider AVANT toute implémentation)

> **STATUT : GEL.** Aucune implémentation structurelle, aucun patch déployé, aucun restart sans le go d'Etoile.
> Ce document finalise le **diagnostic des régressions**, la **liste complète des messages techniques à éliminer**, et le **design cible complet** (9 axes). Référence code : déployé `1fb4ca3`, baseline antérieure `7e24dac`.

---

## A) DIAGNOSTIC DES RÉGRESSIONS (cause racine)

### Méthode
Diff **exact** `7e24dac → 1fb4ca3` (le seul écart de code entre « avant » et « déployé ») : il ne contient **que** (1) en-tête 1 ligne `hdr1`, (2) grilles Looks/Historique, (3) entrée `G_` dans la ceinture d'ancrage, (4) retrait de 2 toasts « Chargement… », (5) 3 redirections slash. **Toutes** les fonctions de persistance et de propagation média sont **byte-identiques** entre les deux : `ensureProj`, `autosaveDraft`, `currentStepModule`, `wsMedia`, `videoMedia`, `lookFile`, `persistProjMedia`, `clearActiveDraft`, `projFromDraft`, `resumeDraft`.

### Conclusion par symptôme

**1. « Le projet précédent disparaît » (Nouveau / au retour)**
- **Cause racine (pré-existante, identique en 7e24dac)** : `clearActiveDraft()` **supprime le fichier brouillon ET met `proj=null`** après : une pose gardée (`NL_NEW`→garde, l. 3158), un abandon (`NL_CANCEL`, l. 3230), ou une génération réussie (l. 1893). Il n'existe **aucun archivage** vers un dossier projet permanent. Donc « garder/terminer/Nouveau » = l'ancien projet est **détruit**, pas rangé.
- **Aggravateur INTRODUIT par le déploiement** : la **grille Looks applique le look en UN seul tap** sur la vignette (`G_looks_idx` → `p.look.source='gallery'` + `setWorkPhoto`). Avant (`7e24dac`), il fallait parcourir avec ‹ › **puis** appuyer sur le bouton explicite « 👗 Utiliser ce look ». Conséquence : en **consultant** la bibliothèque, un tap involontaire **écrase le look du projet en cours** → perçu comme « le projet change/disparaît ».
- **Aggravateur secondaire (perception)** : `hdr1` a **retiré décor / prompt / nb images** de l'en-tête. On ne voit plus ces champs persister → sentiment que le contexte est perdu (les données, elles, restent dans `proj`).

**2. « Suivant ne reprend plus le média actif »**
- **Cause racine (pré-existante)** : les **gates** de « Suivant » dépendent de **drapeaux explicites**, pas de la présence réelle d'un média :
  - `photo.look` : `gate = !!proj.look.source` (l. 1396)
  - `photo.image` : `gate = proj.image.validated != null` (l. 1403)
  - `video.source` : `gate = !!videoMedia(proj)` (l. 1618)
- Si un média actif existe mais que le **drapeau** correspondant n'est pas posé (retour à une étape, média venu d'un autre chemin), « Suivant » est **verrouillé** (toast `RLOCK` « Choisis d'abord ») → « ne reprend plus le média ».

**3. « L'image sélectionnée n'est plus propagée »**
- **Cause racine (pré-existante)** : **sélection ≠ validation**. Naviguer entre images change `image.idx` ; seul `PL_PICK` pose `image.validated`. L'aval (`video`) lit `validated != null ? validated : idx` et la propagation effective passe par un tap explicite (`VS_GENIMAGE`, l. 2666). Une image **simplement affichée** n'est donc pas portée en avant comme « l'image du projet ».

### Verdict global (A)
> Les **bugs de fond** (1-fond, 2, 3) **NE viennent PAS** de hdr1/grilles/slash : ils existent à l'identique en `7e24dac`. Le déploiement a en revanche **aggravé** le symptôme 1 (grille = mutation en 1 tap) et **réduit la lisibilité** du contexte (en-tête appauvri). ⇒ La cause profonde est le **modèle `proj` + gates par drapeaux + absence de dossier projet**, à corriger par le redesign (pas par un patch écran).

---

## B) MESSAGES TECHNIQUES À ÉLIMINER (sources complètes)

### « Un instant, je reviens… »
- **2 sources, toutes deux sur /restart** : `ack('⏳ Un instant, je reviens…')` aux lignes **2870** (redémarrage via bouton) et **3469** (commande `/restart`).
- Mécanique : `ack()` (l. 1657) = `toast()` si dernier event = callback, sinon `system()` (message chat). Au test, l'`answerCallbackQuery` a échoué (« query is too old ») → le toast peut même ne pas s'afficher, mais le **message système** reste possible.
- **Élimination cible** : **redémarrage 100 % silencieux** — supprimer le texte d'ack au restart (aucun message). Si un signe est souhaité, le limiter au **re-post du cockpit** (déjà fait au boot via `REOPEN_FLAG`), sans phrase technique.

### « Chargement… »
- **0 source restante dans le code déployé `1fb4ca3`** : les 2 seuls toasts (`RES_PREV`/`RES_NEXT`) ont été retirés ; un grep complet (`telegram_bot.js`, `newlook.js`, `render_local.js`, `ui/`) ne trouve plus la chaîne (hors commentaire).
- Donc s'il **apparaît encore**, ce n'est **pas** notre toast. Causes résiduelles possibles :
  1. **Indicateur natif Telegram** (petite horloge sur un bouton) tant que `answerCallbackQuery` n'a pas répondu : visible quand un handler est **lent** (ex. `PL_EDIT` a pris **7 s** au test : 12:19:04→12:19:11) ou échoue (« query too old »).
  2. **Toasts sablier génériques** : `toast('⏳')` (`GLP_PREV`/`GLP_NEXT`, l. 2926-2927), `toast('')` (`PL_NOOP`), `'⏳ Saving photo...'` (l. 3354, **anglais**), `'⏳ Enregistrement...'` (l. 3288), `'⏳ Une création est en cours…'` (l. 2869/3468), `'🧪 Rendu local… ~5s'` (l. 1081).
  3. **Capture d'écran d'avant le restart** (état mis en cache côté Telegram).
- **Élimination cible** :
  - **Répondre au callback IMMÉDIATEMENT** (`answerCallbackQuery` en tout début de handler) puis faire le travail → supprime l'horloge native.
  - **Accélérer/supprimer** les handlers lents (notamment l'éditeur qui delete+resend).
  - **Purger** tous les toasts sablier/anglais ci-dessus (politique : aucun message technique, jamais d'anglais).

---

## C) DESIGN CIBLE COMPLET (9 axes)

### Axe 1 — GESTION DU PROJET ACTIF
- **Où il vit** : un objet `proj` (source de vérité), adossé à un **dossier projet** sur disque (voir axe 2), identifié par un `projectId` stable.
- **Sauvegarde** : autosave à chaque action (déjà le cas) **dans le dossier projet**.
- **Reprise** : à l'ouverture / au boot, si un projet « en cours » existe → **proposer en 1 ligne** « ↩️ Reprendre *<nom>* · 🏠 Accueil » (1 tap, repositionne à l'étape exacte). Aujourd'hui la reprise est *paresseuse* et non re-présentée au boot.
- **Survie aux retours menu** : invariant — **toute navigation conserve le projet** ; aucune vue annexe ne le mute.
- **« Nouveau » ne détruit JAMAIS l'ancien** : `Nouveau` = **archiver le projet courant** (dossier complet, voir axe 2) **puis** créer un nouveau `projectId`. ⇒ **Remplacer** l'actuel `clearActiveDraft()` (qui supprime) par un **archivage non destructif**.

### Axe 2 — DOSSIER PROJET (chaque création = un vrai dossier)
- **Cible** : `projects/<persona>/<projectId>/` contenant :
  `project.json` (réf · look · décor · prompt · nb · script · légende · paramètres · coûts · statut), `images/`, `variants/`, `video_final.mp4`, `raw/` (si dispo), `exports/`, `intermediaires/`.
- À chaque génération : **écrire dans le dossier du projet** (au lieu des dumps globaux `looks/`, `outputs/generations/`, `outputs/proj_media/`).
- **Existant** : éparpillé sur 5-6 emplacements reliés seulement par `draftId` + horodatage → corrélation fragile, pas de dossier unique.

### Axe 3 — HISTORIQUE vs PRÊT-À-POSTER
- **Prêt-à-poster = FILE D'ATTENTE** : uniquement les contenus en attente de publication/validation. **Publier ⇒ le contenu QUITTE la file.**
- **Historique = MÉMOIRE COMPLÈTE & PERMANENTE** : **tous** les projets (dossier de l'axe 2), retrouvables des semaines après avec vidéo · images · prompt · script · paramètres · exports · RAW. **Publier ne retire jamais de l'Historique.**
- **Invariant** : *publié = retiré de Prêt-à-poster, conservé pour toujours dans Historique.*
- **Existant** : `ready_to_post/` = simple dossier d'export (rien n'en « sort ») ; `generations/` = liste **plate** de jpg/mp4 par date, **sans** métadonnées projet.

### Axe 4 — NAVIGATION : « VALIDER → étape suivante » (remplace « Suivant »)
- **Cible** : plus de bouton « Suivant » conditionné à un drapeau. Chaque étape a **un bouton « ✅ Valider »** ; valider **fait apparaître l'étape suivante**, **conserve le contexte** et **reprend automatiquement le média actif**.
- **Effet** : corrige le symptôme A2 (le verrouillage par drapeau disparaît) — la progression est pilotée par l'**action de validation**, pas par un état caché.

### Axe 5 — PROPAGATION DU MÉDIA
- **Cible** : le **média actif** (image sélectionnée / look / source) se **propage automatiquement** à toutes les étapes suivantes et est **repris à chaque étape**, sans tap supplémentaire.
- **Règle** : « sélectionner = valider » au niveau de l'étape image (l'image affichée/choisie **est** l'image du projet) ; l'aval lit toujours **le média actif du projet**, jamais un index orphelin. Corrige A3.

### Axe 6 — AFFICHAGE IMAGE BRUTE
- **Cible** : image **au ratio réel** (9:16 natif), **aucun traitement d'affichage artificiel** : pas de bordures floues, pas de letterbox, pas de coins arrondis, pas de recadrage auto.
- Le **recadrage = un OUTIL dans la boîte d'édition**, jamais appliqué automatiquement à l'affichage.
- **Existant** : le crop 4:5 d'affichage (`nlDisp`) a **déjà été retiré** (« AUCUN recadrage à l'affichage ») ; les résultats sont en **brut 9:16**. **À vérifier/garantir** qu'aucun chemin `raw:false` du cockpit ne ré-introduit un letterbox.

### Axe 7 — DÉSENCOMBREMENT LOOK / IMAGE
- **Supprimer** : lignes de séparation inutiles, libellés redondants (« Image 1/1 » répété, « Look prêt — ➡ Suivant pour l'image »), texte explicatif superflu.
- **Étape Look = simplement configurer le look** (tenue · décor · réf · prompt · nb en lignes compactes), rien d'autre.
- Réduire le texte au strict utile ; une étape = une intention claire.

### Axe 8 — BIBLIOTHÈQUES (Looks / Historique / etc.) SANS RUPTURE
- **Cible** : les bibliothèques **ne sont PAS des écrans indépendants** qui « sortent » du cockpit. On les **consulte dans le bloc** et on **revient EXACTEMENT au projet** (même étape, même média), sans rupture de contexte.
- **Consultation ≠ mutation** : parcourir n'altère jamais le projet ; appliquer un élément exige une **action explicite et confirmée** (corrige l'aggravateur A1 : supprimer l'application en 1 tap involontaire de la grille).

### Axe 9 — SYMÉTRIE PHOTO ≡ VIDÉO (parcours cible + verdict par écran)
**Même logique de bout en bout** : `SOURCE → PARAMÈTRES → APERÇU → (AJUSTER) → FINALISER`.

| Écran | PHOTO | VIDÉO | Verdict |
|---|---|---|---|
| **① SOURCE** | origine de l'image (nouveau / galerie / upload) | origine de la vidéo (look projet / image générée / galerie / upload) | **INDISPENSABLE** |
| **② PARAMÈTRES** | réf · tenue · décor · prompt · nb — **en lignes** (1 picker focalisé à la fois) | script · durée · sous-titres · musique — **en lignes** | **INDISPENSABLE** |
| **③ APERÇU** | 2 frames gratuites + panneau coût/crédits/format/moteur | extrait gratuit + même panneau | **INDISPENSABLE** |
| **④ AJUSTER** | retouche image (inline) | montage / sous-titres / musique (inline) | **FUSIONNABLE** dans ③ (sous-état, pas un écran) |
| **⑤ FINALISER** | récap + **Lancer Final HD** | récap + **légende** + **Lancer Final HD** | **INDISPENSABLE** |
| Réf / Galeries / Biblio prompt / Biblio script / Montage / Légende **séparés** | — | — | **SUPPRIMABLES** (absorbés en lignes/pickers de ② ou → Studio) |

**Arbitrage « moins d'écrans » VS « une décision par étape »** :
- **Paramètres = une LISTE de lignes**, pas un formulaire éclaté. Chaque ligne montre l'**état courant** et **ouvre un picker focalisé in-bloc** (UNE décision à la fois) :
  ```
  ② PARAMÈTRES (PHOTO)
  🎯 Référence : Imany ▸
  👗 Tenue : robe noire ▸
  🌆 Décor : studio ▸
  ✍️ Prompt : défaut ▸
  🔢 Images : 1 ▸
  ────────
  👁 Aperçu gratuit     ✅ Valider
  ```
  ⇒ jamais 5 décisions ouvertes ; 5 **résumés** d'1 ligne, un seul picker ouvert à la fois (in-bloc, sans sous-menu, sans nouveau message).
- **Garder APERÇU (③) et AJUSTER (④) distincts** : « voir » et « retoucher » sont 2 intentions. ③ = voir + coût ; ④ n'apparaît **que sur demande** (« 🎨 Ajuster »), en sous-état inline.
- **Bilan : socle 3 écrans (SOURCE · PARAMÈTRES · FINALISER) + APERÇU recommandé (3-4 écrans)**, AJUSTER = sous-état (0 écran permanent). Symétrie stricte PHOTO ≡ VIDÉO. **Minimum d'écrans SANS cacher de fonction ni empiler les décisions.**

### Contrainte transversale — UN SEUL BLOC, UNE SEULE IDENTITÉ
- Aujourd'hui **2 identités de bloc** coexistent : `newlook.mediaId` (workspace routeur) et `cockpit.mid` (carte/éditeur legacy). L'éditeur via `EDIT_HOME` n'est **pas** réconcilié → recrée un bloc (F1, observé live : `PL_EDIT`→`deleteMessage`). **Cible : une seule identité de bloc**, toute édition = sous-état du bloc unique (jamais de delete+resend).

---

## D) ROLLBACK PENDANT LE REDESIGN ?

**Avis : OUI, rollback recommandé vers `7e24dac` pendant le redesign — mais en sachant ce que ça fait et ne fait pas.**
- **Ce que le rollback CORRIGE** : les **2 aggravateurs introduits par le déploiement** — (i) la grille Looks qui applique un look en 1 tap involontaire (retour au « Utiliser ce look » explicite), (ii) l'en-tête appauvri (retour aux champs décor/prompt/nb visibles). Il rend à Etoile la baseline qu'elle **juge meilleure**, à coût quasi nul.
- **Ce que le rollback NE corrige PAS** : les **bugs de fond** A1-fond (projet détruit par `clearActiveDraft`), A2 (Suivant par drapeau), A3 (sélection≠validation) — **identiques** en `7e24dac`. Ils relèvent du redesign.
- **Conditions** : aucune génération en cours, `git checkout fix/root-causes-v1 && git reset --hard 7e24dac` (ou ré-checkout `7e24dac`) + `pm2 restart`, **uniquement sur ton go**. Les commits `1fb4ca3`/audit restent dans l'historique git (rien de perdu).
- **Alternative minimale si tu préfères ne pas tout annuler** : garder `1fb4ca3` mais **neutraliser les 2 aggravateurs** (grille → application explicite ; en-tête → ré-afficher décor/prompt/nb). Coût faible, mais c'est un patch → contraire au gel. ⇒ **Je recommande le rollback propre à `7e24dac`** le temps du redesign.

---

## CE QUI RESTE À VALIDER PAR ETOILE (avant toute implémentation)
1. **Rollback** live vers `7e24dac` oui/non.
2. **Parcours cible** : 3 écrans + Aperçu (vs 3 stricts).
3. **Paramètres** = lignes + picker focalisé in-bloc (modèle ci-dessus).
4. **Aperçu et Ajuster distincts** (vs fusionnés).
5. **Dossier projet** (axe 2) + **archivage non destructif** sur « Nouveau » (axe 1).
6. **Historique permanent vs Prêt-à-poster file** (axe 3).
7. **Navigation Valider→suivant** + **propagation média auto** (axes 4-5).
8. **Une seule identité de bloc** (contrainte transversale, fin de F1).

_Rien n'est implémenté ni déployé avant validation explicite d'Etoile._

# DESIGN CIBLE COMPLET — Podcast Workflow (à valider AVANT toute implémentation)

> **STATUT : GEL.** Aucune implémentation structurelle, aucun patch déployé, aucun restart sans le go d'Etoile.
> **Live actuel : `7e24dac`** (rollback effectué). Baseline de comparaison du diagnostic : `7e24dac` vs `1fb4ca3`.

---

## ★ PRINCIPE DIRECTEUR (Etoile)

> **LE PROJET est un vrai DOSSIER DE PRODUCTION** — look, référence, prompts, scripts, images, vidéos, légendes, exports, RAW (si dispo) — **qui PILOTE le cockpit, pas l'inverse.**
> Il est **retrouvable à tout moment depuis l'Historique**, et **depuis Prêt-à-poster tant qu'il n'est pas publié**.

Conséquences de conception (toutes les sections en découlent) :
- L'UI n'est qu'une **vue** sur le dossier projet ; ouvrir un projet = charger son dossier ; chaque écran lit/écrit ce dossier.
- Rien n'existe « hors projet » : toute image/vidéo/script/param appartient à un dossier projet.
- « Nouveau » = ouvrir un **nouveau dossier** ; l'ancien est **archivé**, jamais détruit.

---

## A) DIAGNOSTIC DES RÉGRESSIONS (cause racine)

Diff **exact** `7e24dac → 1fb4ca3` = uniquement : en-tête 1 ligne `hdr1`, grilles Looks/Historique, entrée `G_` dans la ceinture, retrait de 2 toasts « Chargement… », 3 redirections slash. **Toutes** les fonctions de persistance + propagation média sont **byte-identiques** (`ensureProj`, `autosaveDraft`, `currentStepModule`, `wsMedia`, `videoMedia`, `lookFile`, `persistProjMedia`, `clearActiveDraft`, `projFromDraft`, `resumeDraft`).

| Symptôme | Cause racine (pré-existante en 7e24dac) | Aggravée par le déploiement ? |
|---|---|---|
| **Projet précédent disparaît** | `clearActiveDraft()` **supprime** le brouillon + `proj=null` après garder/abandon/succès (l. 3158, 3230, 1893). Aucun archivage. | **OUI** : la grille Looks applique le look en **1 tap** (avant : bouton explicite « Utiliser ») → écrase le look du projet en consultant. + `hdr1` a retiré décor/prompt/nb de l'en-tête (contexte moins visible). |
| **Suivant ne reprend pas le média** | Les *gates* dépendent de **drapeaux** (`look.source` l.1396, `image.validated` l.1403, `videoMedia` l.1618), pas du média réel présent → verrou. | Non |
| **Image non propagée** | **Sélection (`idx`) ≠ validation (`validated`)** ; l'aval lit `validated`/tap explicite (`VS_GENIMAGE`). | Non |

**Verdict :** les bugs de fond viennent du **modèle `proj` + gates par drapeaux + absence de dossier projet**, pas de hdr1/grilles. Le rollback `7e24dac` (fait) corrige les 2 **aggravateurs**, pas les bugs de fond → **redesign**.

---

## B) MESSAGES TECHNIQUES À ÉLIMINER (sources complètes)

- **« Un instant, je reviens… »** : 2 sources, toutes deux `/restart` — `ack(...)` l. **2870** et **3469**. → **cible : restart 100 % silencieux** (aucun texte ; seul le re-post du cockpit au boot fait foi).
- **« Chargement… »** : **0 source restante** dans `1fb4ca3` (grep complet `telegram_bot.js`/`newlook.js`/`render_local.js`/`ui/`). Résiduel = **horloge native Telegram** sur handler lent (ex. `PL_EDIT` = 7 s observé) ou `answerCallbackQuery` « too old », ou **capture pré-restart**. → **cible** : répondre au callback **immédiatement**, accélérer/supprimer les handlers lents, purger les toasts sablier/anglais (`'⏳ Saving photo...'` l.3354, `'⏳ Enregistrement...'` l.3288, `toast('⏳')` GLP l.2926-2927, etc.).
- **Politique** : aucun message technique, jamais d'anglais ; seuls des retours métier brefs.

---

## C) DESIGN CIBLE — sections nommées

### C.1 — GESTION DU PROJET ACTIF
- Le projet vit comme **dossier de production** (voir C.2), chargé en mémoire (`proj` = vue), identifié par `projectId` stable.
- **Autosave** à chaque action, **dans le dossier projet**.
- **« Nouveau » n'efface JAMAIS** : il **archive** le projet courant (statut → archivé, reste dans Historique) puis ouvre un nouveau dossier. ⇒ remplacer `clearActiveDraft()` (destructif) par un **archivage non destructif**.
- **Reprise** : à l'ouverture/au boot, si un projet est « en cours », proposer en 1 ligne « ↩️ Reprendre *<nom>* · 🏠 Accueil » (repositionne à l'étape exacte).

### C.2 — DOSSIER PROJET (dossier de production)
- **Cible** : `projects/<persona>/<projectId>/` = `project.json` (réf · look · décor · prompts · scripts · légendes · paramètres · coûts · statut) + `images/` + `variants/` + `videos/` + `video_final.mp4` + `exports/` + `raw/` (si dispo) + `intermediaires/`.
- Chaque génération **écrit dans le dossier du projet** (fin des dumps globaux `looks/`, `outputs/generations/`, `outputs/proj_media/`).
- Le dossier **pilote** le cockpit : l'UI affiche ce que contient le dossier.

### C.3 — CONSERVATION DU CONTEXTE
- **Invariant** : toute navigation (menu, retour, bibliothèque, édition) **conserve** le projet, l'étape et le média actif.
- Aucune vue annexe ne mute le projet ; revenir d'une bibliothèque/édition replace **exactement** à l'étape d'où l'on vient, média actif intact.
- Le **bloc média unique** sert de fil continu (voir GARANTIE TECHNIQUE).

### C.4 — PROPAGATION DU MÉDIA
- **Règle clé** : **le média validé devient AUTOMATIQUEMENT le média actif**, propagé à **toutes** les étapes suivantes et repris à chaque étape — **sans tap supplémentaire**.
- « Sélectionner = valider » : l'image affichée/choisie **est** l'image du projet ; l'aval lit toujours **le média actif du projet**, jamais un index orphelin. (Corrige A2 + A3.)

### C.5 — HISTORIQUE
- **Mémoire COMPLÈTE et PERMANENTE** de **tous** les projets (dossier C.2), retrouvable des semaines après avec vidéo · images · prompts · scripts · paramètres · exports · RAW.
- **Publier ne retire jamais de l'Historique.** C'est l'archive de référence.

### C.6 — PRÊT-À-POSTER
- **FILE D'ATTENTE** : uniquement les contenus **en attente de publication/validation**.
- **Publier ⇒ le contenu QUITTE la file** (mais reste dans l'Historique).
- Invariant : *publié = retiré de Prêt-à-poster, conservé pour toujours dans Historique.*

### C.7 — BIBLIOTHÈQUES (STUDIO)
- **STUDIO = UNIQUEMENT des bibliothèques** : **Looks · Références · Scripts · Prompts · Médias · Projets archivés**. Aucune production ne s'y fait.
- **Consultées DANS le bloc** (in-bloc), jamais un écran qui « sort » du cockpit ; **retour = exactement** à l'étape/projet d'origine, média actif intact.
- **Consultation ≠ mutation** : parcourir n'altère jamais le projet ; appliquer un élément exige une **action explicite et confirmée** (fin du 1-tap involontaire).

### C.8 — RÈGLES DE NAVIGATION : « VALIDER → étape suivante »
- Plus de « Suivant » conditionné à un drapeau caché. Chaque étape a **« ✅ Valider »** ; valider **fait apparaître l'étape suivante**, conserve le contexte et **reprend automatiquement le média actif**.
- La progression est pilotée par l'**action de validation**, pas par un état interne. (Corrige A2.)

### C.9 — APERÇU = ÉTAT PERMANENT (pas une étape)
- **L'APERÇU n'est PAS un écran.** Le **média actif est visible en permanence** dans le bloc, à **chaque** étape (SOURCE, PARAMÈTRES, FINALISER).
- Le cockpit = toujours *média + contexte + actions de l'étape*. On « voit avant de payer » à tout instant, sans étape dédiée.
- **AJUSTER** = sous-état inline, ouvert seulement sur demande (« 🎨 Ajuster »), jamais un écran permanent.

### C.10 — AFFICHAGE IMAGE BRUTE
- Image **au ratio réel** (9:16 natif), **aucun traitement d'affichage** : pas de bordures floues, pas de faux fonds, pas de remplissage/letterbox, pas de coins arrondis, pas de recadrage auto.
- Le **recadrage = un OUTIL dans la boîte d'édition**, jamais appliqué à l'affichage. (Le crop 4:5 d'affichage `nlDisp` est déjà retiré ; à garantir qu'aucun chemin ne le ré-introduit.)

### C.11 — DÉSENCOMBREMENT LOOK / IMAGE
- Supprimer : lignes de séparation inutiles, libellés redondants (« Image 1/1 » répété, « Look prêt — Suivant pour l'image »), texte superflu.
- Étape Look = **simplement configurer le look** (tenue · décor · réf · prompt · nb en lignes compactes). Texte au strict utile.

---

## D) SYMÉTRIE PHOTO ↔ VIDÉO + LISTE DES ÉCRANS (verdict)

### Grammaire cible (identique PHOTO et VIDÉO)
> **SOURCE → PARAMÈTRES → FINALISER → PRÊT-À-POSTER**
> (l'APERÇU n'est pas un maillon : le média actif est visible en permanence dans chacun ; AJUSTER = sous-état inline.)

### Liste des écrans — verdict indispensable / fusionnable / supprimable
| Écran | PHOTO | VIDÉO | Verdict |
|---|---|---|---|
| **① SOURCE** | origine de l'image (nouveau look / galerie / upload) | origine de la vidéo (look projet / image validée / galerie / upload) | **INDISPENSABLE** |
| **② PARAMÈTRES** | réf · tenue · décor · prompt · nb — **en lignes**, 1 picker focalisé à la fois | script · durée · sous-titres · musique — **en lignes** | **INDISPENSABLE** |
| **③ FINALISER** | récap (média actif visible) + **Lancer Final HD** | récap + **légende** + **Lancer Final HD** | **INDISPENSABLE** |
| **→ PRÊT-À-POSTER** | le rendu rejoint la file (sort à la publication) | idem | **INDISPENSABLE** (état, pas écran de saisie) |
| APERÇU | média actif **toujours visible** dans ①②③ | idem | **FUSIONNÉ** (état permanent, pas un écran) |
| AJUSTER | retouche image (inline) | montage / sous-titres / musique (inline) | **FUSIONNABLE** (sous-état, 0 écran) |
| Réf / Galeries / Biblio prompt / Biblio script / Montage / Légende **séparés** | — | — | **SUPPRIMABLES** (lignes/pickers de ② ou → STUDIO) |

### Arbitrage « moins d'écrans » VS « une décision par étape »
- **PARAMÈTRES = une LISTE de lignes** (un picker focalisé in-bloc à la fois) :
  ```
  ② PARAMÈTRES (PHOTO)        [média actif visible au-dessus]
  🎯 Référence : Imany ▸
  👗 Tenue : robe noire ▸
  🌆 Décor : studio ▸
  ✍️ Prompt : défaut ▸
  🔢 Images : 1 ▸
  ────────
  🎨 Ajuster        ✅ Valider
  ```
  ⇒ jamais 5 décisions ouvertes ; 5 résumés d'1 ligne ; un seul picker ouvert à la fois, in-bloc, sans sous-menu ni nouveau message.
- **Bilan : 3 écrans** (SOURCE · PARAMÈTRES · FINALISER) → PRÊT-À-POSTER. Aperçu = permanent. Ajuster = inline. Symétrie stricte PHOTO ≡ VIDÉO. **Minimum d'écrans sans cacher de fonction ni empiler les décisions.**

---

## E) GARANTIE TECHNIQUE — « rien ne sort du cockpit, le contexte n'est jamais perdu »

Mécanismes exacts qui rendent l'invariant **structurel** (pas une discipline d'écran) :

1. **Bloc média unique** — un seul message Telegram (le cockpit) porte image + légende + boutons. Tous les écrans sont des **éditions en place** (`editMessageMedia`/`editMessageCaption`) de ce message, jamais de nouveaux `send`.
2. **Ceinture routeur** — le routeur garantit qu'un module « média » rend toujours dans le bloc média (jamais de repli texte qui créerait un autre message). Tout `go:<module>` passe par cette ceinture.
3. **UNE SEULE IDENTITÉ DE BLOC** — fusionner `newlook.mediaId` (workspace) et `cockpit.mid` (éditeur legacy) en **un seul identifiant**. C'est la cause de F1 : l'éditeur via `EDIT_HOME` n'est pas réconcilié → `delete`+`resend` (observé live : `PL_EDIT`→`deleteMessage`). Cible : **toute édition = sous-état du bloc unique**, jamais delete/resend.
4. **Bibliothèques rendues IN-BLOC** — Looks/Références/Scripts/… s'affichent dans le bloc (consultation) et **`WS_RESUME` ramène EXACTEMENT** à l'étape du projet (`currentStepModule`), média actif intact. Consultation ne mute pas ; appliquer = action explicite confirmée.
5. **Propagation média automatique** — le média validé est écrit dans le dossier projet et **réinjecté** à chaque étape via une résolution unique du « média actif du projet » (plus de dépendance à un `idx`/drapeau orphelin).
6. **Persistance pilotée par le dossier** — autosave à chaque action **dans le dossier projet** ; reprise = recharger le dossier ; « Nouveau » = archiver (jamais supprimer). Le dossier survit aux retours menu, fermeture et restart.

Avec ces 6 mécanismes : **aucune action n'ouvre un second message**, **aucune navigation ne perd le projet/l'étape/le média**, et le **dossier de production reste la source de vérité** qui pilote l'affichage.

---

## F) ROLLBACK — FAIT

`7e24dac` est **live** (bot up, cockpit re-posté, watcher ré-armé). Corrige les 2 aggravateurs (grille 1-tap, en-tête appauvri) ; **ne corrige pas** les bugs de fond (redesign requis). Commits `1fb4ca3`/audit/design conservés dans git (`fix/root-causes-v1`).

---

## CE QUI RESTE À VALIDER PAR ETOILE (avant toute implémentation)
1. **Principe directeur** « le dossier projet pilote le cockpit ».
2. **Grammaire** SOURCE → PARAMÈTRES → FINALISER → PRÊT-À-POSTER (Aperçu = permanent, Ajuster = inline).
3. **Dossier projet** (C.2) + **archivage non destructif** sur « Nouveau » (C.1).
4. **Historique permanent** vs **Prêt-à-poster file** (C.5/C.6).
5. **Valider→suivant** + **propagation média auto** (C.8/C.4).
6. **STUDIO = bibliothèques uniquement** (C.7).
7. **Une seule identité de bloc** + garantie technique (E) — fin de F1.
8. **Image brute** + crop seulement en édition (C.10).

_Rien n'est implémenté ni déployé avant validation explicite d'Etoile._

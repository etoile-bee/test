# DESIGN CIBLE COMPLET v3 — Podcast Workflow (à FIGER par Etoile avant toute implémentation)

> **STATUT : GEL.** Aucune implémentation structurelle, aucun patch déployé, aucun restart sans le go d'Etoile.
> **Live actuel : `7e24dac`** (version stable, rollback effectué). Baseline de comparaison du diagnostic : `7e24dac` vs `1fb4ca3`.
> **v3** = principe directeur validé par Etoile + 5 raffinements intégrés + règles permanentes gravées **[[E118]]** (protocole qualité avant livraison) et **[[E119]]** (méthode de livraison unique cohérente) dans `docs/EXIGENCES.md`. **Implémentation interdite tant que cette cible n'est pas figée par Etoile.**

---

## ★ PRINCIPE DIRECTEUR (Etoile)

> **LE PROJET est un vrai DOSSIER DE PRODUCTION** — look, référence, prompts, scripts, images, vidéos, légendes, exports, RAW (si dispo) — **qui PILOTE le cockpit, pas l'inverse.**
> Il est **retrouvable à tout moment depuis l'Historique**, et **depuis Prêt-à-poster tant qu'il n'est pas publié**.

Conséquences de conception (toutes les sections en découlent) :
- L'UI n'est qu'une **vue** sur le dossier projet ; ouvrir un projet = charger son dossier ; chaque écran lit/écrit ce dossier.
- Rien n'existe « hors projet » : toute image/vidéo/script/param appartient à un dossier projet.
- « Nouveau » = ouvrir un **nouveau dossier** ; l'ancien est **archivé**, jamais détruit.

---

## ★ ARBITRAGES ETOILE C1–C5 (2026-06-10) — intégrés à la cible
- **C1** — l'action d'avance = **✅ Valider** (remplace « ➡ Suivant ») ; barre = **⬅ Retour · ✅ Valider · 🏠 Accueil** ; Valider débloque l'étape suivante, **désactivé tant que le choix obligatoire n'est pas fait**, **conservation de l'aval** inchangée ([[E108]]/[[E115]] mis à jour).
- **C2** — **SOURCE DE DONNÉES UNIQUE** ([[E121]]) : un seul magasin de projets (= l'**Historique**). **RÉCENTS, Prêt-à-poster, et les états (Brouillons/En cours/Terminés/Archivés) sont des VUES FILTRÉES** du même magasin — **jamais** de stockage séparé (sinon désynchro = frontières legacy). Voir C.5/C.7.
- **C3** — **deux axes de statut** dans le manifest : **statut_qualite** (`brouillon | test | production`, [[E95]]/[[E96]]) **ET** **statut_publication** (`aucun | pret_a_poster | publie | archive`, C.6).
- **C4** — **GATE QC avant TOUTE génération payante** ([[E92]] renforcé) : identité · cohérence générale · conformité à la référence · conformité au look attendu → 🔄 Régénérer / 🎨 Éditer / ✅ Valider malgré l'alerte ; **verdict enregistré dans le dossier projet + rapport qualité** ([[E93]]). Placé dans **FINALISER** avant Final HD.
- **C5** — cette livraison = **cockpit MANUEL complet et robuste** ; le **mode Auto** ([[E7]]) viendra **ensuite sur ce socle**. Le design reste **compatible Auto** : le moteur (dossier projet + étapes + gates) est pilotable par programme (un orchestrateur Auto pourra enchaîner SOURCE→PARAMÈTRES→FINALISER sans UI), aucune décision ne verrouille cette extension.

---

## ★★ VERROUS FINAUX (10) — validés Etoile, intégrés à la cible (2026-06-10)

1. **Livraison = version COMPLÈTE testée de A à Z**, jamais de micro-livraison. → [[E119]]
2. **Avant livraison, je cherche MOI-MÊME** anomalies/régressions/incohérences (rigueur « filtre couleur »). → [[E118]]
3. **Auto-test couvrant OBLIGATOIREMENT** : PHOTO complet · VIDÉO complet · reprise projet · redémarrage · retour arrière · Studio · Looks · Historique · Prêt-à-poster · édition · génération · preview gratuit · Final HD · propagation média · dossier projet · conservation des fichiers.
4. **Projet final conserve TOUS les fichiers** : image · vidéo finale · RAW si dispo · prompt · script · légende · paramètres · moteur utilisé · coûts · date/heure · versions. → C.2
5. **Prêt-à-poster** : prêt → entre ; publié/sorti → disparaît de la file **MAIS reste intégralement dans Historique** avec tout son dossier. → C.5/C.6
6. **Bibliothèques** consultables sans casser le projet actif ; **consulter ne modifie rien** ; **sélectionner = explicite**. → C.7
7. **Édition avancée OBLIGATOIREMENT in-cockpit** : aucun nouvel écran/fenêtre/bloc (= fin de F1, identité unique de bloc). → C.12 / E.3
8. **Textes TRÈS COURTS** : cockpit lisible immédiatement — média visible, contexte minimal, action claire. → C.11
9. **Image en format réel, sans bordures floues** ; recadrage = outil d'édition, jamais affichage auto. → C.10
10. **CONDITION DE GEL** (ci-dessous) : la cible ne se fige que si elle respecte un seul moteur · plusieurs entrées · un seul projet · un seul bloc · aucun contexte perdu.

### ✅ CONDITION DE GEL — VÉRIFIÉE explicitement
| Exigence du verrou 10 | Couverte par | Statut |
|---|---|---|
| **Un seul moteur** | un pipeline `proj`/dossier unique ; PHOTO et VIDÉO = mêmes étapes SOURCE→PARAMÈTRES→FINALISER (D, grammaire symétrique) | ✅ |
| **Plusieurs entrées** | PHOTO, VIDÉO (et reprise projet) entrent dans le **même** moteur à des points différents | ✅ |
| **Un seul projet** | dossier projet autoporteur = **source de vérité unique** (C.2) ; `media_actif` dans le manifest (C.4) | ✅ |
| **Un seul bloc** | bloc média unique + **identité de bloc unique** (E.1/E.3, fin de F1) ; toute édition = sous-état (C.12) | ✅ |
| **Aucun contexte perdu** | persistance pilotée par le dossier (C.1/C.4) : survit étape/retour/biblio/menu/restart/reprise ; bibliothèques in-bloc + retour exact (C.7) | ✅ |

**⇒ Condition de gel REMPLIE.** La cible v3+verrous est **figeable** : elle décrit un moteur unique à entrées multiples, un projet unique (dossier), un bloc unique, sans perte de contexte. Sous réserve que l'**implémentation** respecte ces invariants (vérifié par [[E118]] avant livraison).

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

### C.2 — DOSSIER PROJET AUTOPORTEUR ★ (raffinement 1)
**Objectif explicite** : pouvoir **rouvrir un projet des mois plus tard** et **comprendre exactement comment il a été construit** (tout est dans le dossier, rien d'implicite, rien d'externe).

**Structure de fichiers cible**
```
projects/<persona>/<projectId>/
├── project.json            ← MANIFEST (source de vérité, voir schéma)
├── reference/              ← image(s) de référence personnage utilisée(s)
├── images/                 ← images générées (validées + candidates)
├── variants/               ← variantes/poses d'une même génération
├── videos/                 ← rendus vidéo (tests + intermédiaires)
├── video_final.mp4         ← livrable final
├── exports/                ← exports prêts (mp4 + légende + style snapshot)
├── raw/                    ← RAW si disponible (image/lipsync/vidéo bruts)
├── intermediaires/         ← fichiers de travail (frames, covers, planches)
└── logs/                   ← logs génération + rapport QC
```

**Schéma du MANIFEST `project.json`** (complet et autoporteur)
```json
{
  "projectId": "imany_2026-06-10_14-22-03",
  "persona": "imany",
  "name": "<nom lisible>",
  "statut_qualite": "brouillon | test | production",                 // C3 — axe validation qualité (E95/E96)
  "statut_publication": "aucun | pret_a_poster | publie | archive",  // C3 — axe publication (C.6)
  "qc": { "verdict": "ok|alerte|force", "par": "Etoile", "le": "...", "details": { "identite": true, "coherence": true, "reference": true, "look": true } }, // C4 — gate avant paiement, enregistré (E92/E93)
  "cree_le": "2026-06-10T14:22:03Z",
  "modifie_le": "2026-06-10T15:01:10Z",
  "reference": { "fichier": "reference/imany_ref.jpg", "label": "Imany", "verrou": true },
  "look":   { "tenue": "...", "decor": "...", "source": "nouveau|galerie|upload", "fichier": "images/look.jpg" },
  "prompts":  [ { "role": "image", "name": "défaut", "text": "..." } ],
  "scripts":  [ { "name": "...", "text": "...", "duree": "23s" } ],
  "legendes": { "courte": "...", "longue": "...", "tags": "..." },
  "parametres": { "nb_images": 1, "mode": "eco", "format": "9:16", "sous_titres": {...}, "image_fx": {...}, "zoom": {...}, "musique": {...} },
  "media_actif": "images/look.jpg",      // ← LE média actif vit ICI (voir C.4)
  "couts":  { "credits": 12, "eur_estime": 0.70, "detail": { "tts": "...", "lipsync": "..." } },
  "moteur_ia": { "image": "Seedream", "script": "Anthropic", "lipsync": "Kling", "versions": {...} },
  "livrables": { "video_final": "video_final.mp4", "exports": ["exports/v1.mp4"] },
  "historique_versions": [
    { "ts": "...", "etape": "look",  "action": "généré",  "ref": "images/look.jpg" },
    { "ts": "...", "etape": "image", "action": "validé",  "ref": "images/img2.jpg" },
    { "ts": "...", "etape": "video", "action": "exporté", "ref": "exports/v1.mp4" }
  ]
}
```

- Le manifest contient **référence · look · décor · prompts · scripts · légendes · paramètres complets · coûts · moteur IA utilisé · date/heure · pointeurs images/variantes/vidéos/exports/RAW · HISTORIQUE DES VERSIONS**.
- Chaque génération **écrit dans le dossier du projet** + **ajoute une entrée** à `historique_versions` (fin des dumps globaux `looks/`, `outputs/generations/`, `outputs/proj_media/`).
- Le dossier **pilote** le cockpit : l'UI n'affiche que ce que contient le dossier (le manifest est la source de vérité).

### C.3 — CONSERVATION DU CONTEXTE
- **Invariant** : toute navigation (menu, retour, bibliothèque, édition) **conserve** le projet, l'étape et le média actif.
- Aucune vue annexe ne mute le projet ; revenir d'une bibliothèque/édition replace **exactement** à l'étape d'où l'on vient, média actif intact.
- Le **bloc média unique** sert de fil continu (voir GARANTIE TECHNIQUE).

### C.4 — PERSISTANCE ABSOLUE DU MÉDIA ACTIF ★ (raffinement 2)
**Règle** : **« le média VALIDÉ devient le média actif du projet »**, et il est **retrouvé** :
- à l'**étape suivante** · après un **retour arrière** · après un **passage en bibliothèque** · après un **retour menu** · après un **redémarrage** · après une **reprise plusieurs jours après**.

**Mécanisme** : le média actif **vit DANS LE DOSSIER PROJET** (`project.json → media_actif`, pointant un fichier du dossier), **jamais dans l'écran ni dans une variable d'UI**.
- Valider une image ⇒ écrire `media_actif` dans le manifest (+ entrée `historique_versions`).
- **Chaque étape lit `media_actif` depuis le manifest** au rendu (résolution unique « média actif du projet ») → plus aucune dépendance à un `idx`/drapeau volatile (cause des régressions A2/A3).
- Au boot/reprise : `media_actif` est rechargé depuis le dossier → l'utilisateur retrouve **exactement** son média, même des jours plus tard.
- « Sélectionner = valider » : l'image affichée/choisie **est** le média actif du projet.

### C.5 — HISTORIQUE ★ (raffinement 4)
- **Mémoire COMPLÈTE, PERMANENTE, JAMAIS SUPPRIMÉE** de **tous** les projets — **tous les fichiers du projet** (dossier C.2) : vidéo · images · variantes · prompts · scripts · légendes · paramètres · coûts · moteur IA · exports · RAW · historique des versions.
- Retrouvable des **semaines/mois** après, à l'identique.
- **Publier ne retire jamais de l'Historique.** C'est l'archive de référence.

### C.6 — PRÊT-À-POSTER ★ (raffinement 4)
- **FILE D'ATTENTE** stricte : **uniquement** les contenus **en attente** de publication/validation.
- **Publié/validé ⇒ le contenu QUITTE Prêt-à-poster** mais **reste INTÉGRALEMENT dans l'Historique**.
- Invariant : *Prêt-à-poster = transitoire ; Historique = permanent. Aucun contenu n'est jamais perdu.*

### C.12 — ÉDITION (règle absolue) ★ (raffinement 5)
- **Règle ABSOLUE** : **aucune fonction d'édition** (image, sous-titres, montage, script, légende, référence, prompt, zoom, musique) **n'ouvre une nouvelle fenêtre / un nouveau cockpit / un nouveau parcours.**
- **Toute modification se fait DANS le projet courant, in-cockpit** (sous-état du bloc unique), puis revient à l'étape exacte. C'est garanti structurellement par l'**identité unique de bloc** (voir GARANTIE TECHNIQUE E.3) — fin de F1.

### C.7 — BIBLIOTHÈQUES (STUDIO) ★ (raffinement 3)
- **STUDIO = UNIQUEMENT des bibliothèques** : **Looks · Références · Scripts · Prompts · Médias · Projets archivés**. Aucune production ne s'y fait.
- **3 règles permanentes** :
  1. **« Consulter ne modifie JAMAIS »** — parcourir une bibliothèque n'altère ni le projet en cours, ni son look, ni son média actif.
  2. **« Sélectionner est TOUJOURS une action explicite »** — appliquer un élément = un geste dédié et confirmé (jamais sur simple tap de vignette ; c'est l'aggravateur A1 à supprimer).
  3. **Aucune bibliothèque n'ouvre un second cockpit / second projet / second flux** — on consulte **in-bloc**, puis on revient **EXACTEMENT au même endroit** (même étape, même média actif).

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

## G) RÈGLES PERMANENTES GRAVÉES (docs/EXIGENCES.md + docs/PLAN_CORRECTIONS.md)
- **[[E118]] — PROTOCOLE QUALITÉ AVANT CHAQUE LIVRAISON** (rigueur « découverte du filtre couleur ») : 12 étapes documentées (audit · parcours PHOTO · parcours VIDÉO · test bibliothèques · test Historique · test Prêt-à-poster · test reprise projet · test propagation média · recherche de régressions · rapport · corrections · re-validation). **Objectif : zéro régression évidente découverte par Etoile après livraison.**
- **[[E119]] — MÉTHODE DE LIVRAISON UNIQUE COHÉRENTE** : design cible **FINAL validé** → implémentation **COMPLÈTE** → audit complet → auto-tests complets → **LIVRAISON UNIQUE** → **PUIS** campagne de tests utilisateurs. **Fin des micro-livraisons / ajustements écran-par-écran.**
- **[[E120]] — CONFORMITÉ AUX EXIGENCES VALIDÉES** : relecture **systématique** de E1→E120 + invariants avant chaque dev/checkpoint/audit/livraison ; une exigence validée **reste valide** jusqu'à décision explicite d'Etoile ; **tableau de conformité exhaustif à 100 %** dans l'auto-audit E118 ; **tout conflit remonté AVANT implémentation**. `EXIGENCES.md` = référence vivante.

---

## À FIGER PAR ETOILE (avant toute implémentation — déclenche E119)
1. **Principe directeur** « le dossier projet pilote le cockpit ».
2. **Dossier projet AUTOPORTEUR** (C.2 : manifest + historique des versions, rouvrable des mois après).
3. **Persistance absolue du média actif** dans le dossier (C.4).
4. **Bibliothèques** : consulter ≠ modifier · sélection explicite · aucun second cockpit (C.7).
5. **Historique permanent** vs **Prêt-à-poster file** (C.5/C.6).
6. **Édition** : aucune nouvelle fenêtre, tout in-cockpit (C.12).
7. **Grammaire** SOURCE → PARAMÈTRES → FINALISER → PRÊT-À-POSTER (Aperçu = permanent, Ajuster = inline) (D).
8. **Valider→suivant** (C.8) · **STUDIO = bibliothèques uniquement** (C.7) · **une seule identité de bloc** + garantie technique (E) · **image brute** (C.10) · **désencombrement** (C.11).

_Une fois cette cible **figée** par Etoile, [[E119]] s'applique : implémentation complète unique, puis [[E118]] (auto-tests), puis livraison unique. **Rien n'est implémenté ni déployé avant ce gel.**_

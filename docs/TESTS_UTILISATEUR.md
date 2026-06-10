# TESTS UTILISATEUR — à faire par Etoile (Telegram), AVANT les corrections

> But : lever les **incertitudes réelles** que l'audit statique du code n'a pas pu trancher
> (comportements **« Non vérifié »** + **« Partiel »** ambigus en usage réel). On ne reteste **pas** ce qui
> est déjà prouvé conforme par le code. Réf : `docs/EXIGENCES.md`, `docs/RAPPORT_DETAILLE.md`.
>
> ⚠️ **Crédits Anthropic épuisés** → tout test qui génère un **script** (Express / Sur-mesure / Auto au-delà
> de l'étape look, et donc toute vidéo) est **bloqué** tant qu'Anthropic n'est pas rechargé. Les tests
> 🆓 ci-dessous **n'en ont pas besoin**.
>
> Après chaque test, je confirme/infirme **objectivement** via `logs/ui_journal.jsonl` + `bot_journal.log`.

---

# 🆓 PARTIE 1 — PARCOURS GRATUIT (à faire maintenant, zéro dépense)

> Enchaînement logique pour tout couvrir vite. Aucun de ces tests ne déclenche de génération payante
> (image/vidéo). On s'arrête **toujours avant** le bouton « 💲 Générer ».

### Pré-analyse via journaux (ui_journal / bot_journal) — état de chaque test
> ✅ Confirmé (déjà prouvé, pas besoin de le refaire) · ❌ Infirmé (défaut prouvé) · 🔲 À tester en live (non observable dans l'historique → **reste à faire par Etoile**).

| Test | État journal | Preuve (journaux / code) |
|---|---|---|
| T1 Stop/Restart en tête | ✅ Confirmé (Non conforme) | `/restart` **75×** + `/stop` 12× **tapés** (aucun bouton d'accueil) ; `showHome` sans Stop/Restart |
| T2 Navigation en place / anti-spam | ❌ Infirmé | `edited_in_place:false` **2532** vs true 916 (**73 % de messages empilés**, pas en place) |
| T3 Galerie grille | ✅ Confirmé (OK) | `GAL_NEXT` 46× + `MENU_LOOKS` 13× ; `showGallery` 3×3 |
| T4 Historique = vraies vidéos ? | ❌ Infirmé | `STUDIO_HIST` scanne les `.jpg` racine (photos), pas les vidéos ; ouvert 2× seulement |
| T5 Référence cockpit (lock/défaut) | ✅ Confirmé (Partiel) | menu `showRefMenu` = pose/galerie/upload ; **`REF_LOCK`/`REF_DEFAULT` absents** |
| T6 Bibliothèque de références | ✅ Confirmé (Manquant) | aucune biblio taguée/cherchable dans le code |
| T7 /edit reset image à l'ouverture | 🔲 À tester | état `fx.image` non lisible dans les journaux (BUG-4 censé corrigé) |
| T8 Défauts Zoom/Réactions | ✅ Confirmé (Non conforme) | `FX_DEFAULT` : zoom `on:1`, réactions `natural` (render_local.js:73-76) |
| T9 Récap coût sans payer | ✅ Confirmé (OK) | `NL_GO` **44×** vs `NL_GO2` 24× → ~20 récaps **sans** dépense |
| T10 Étape Look (Auto/Express) | 🔲 À tester | `CL_GAL/CL_NEW/CL_UP` = **0×** dans le journal (flux jamais exercé en réel) |
| T11 Aperçu local gratuit | ✅ Confirmé (OK) | `MENU_TEST` 25× + `/test` 3× + `/preview` 2× |
| T12 Légendes (copie/toggle) | 🔲 À tester | `GF_LONG/GF_SHORT` = **0×** (jamais ouvert) |
| T13 Reprise après /restart | ✅ Confirmé (OK) | restart→/menu→`deleteMessage` **38×** (stale-fix recrée frais) |
| T14 Persistance params 2 looks | 🔲 À tester | non déductible des journaux |

**Bilan : 8 ✅ · 2 ❌ · 4 🔲.** → **Il ne reste à Etoile que 4 tests live** : **T7** (reset /edit image), **T10** (étape Look des modes Auto/Express), **T12** (légendes copie/toggle), **T14** (params non hérités entre 2 looks). Les autres sont déjà tranchés par les journaux + le code (détail en colonne ci-dessus).

### T1 — Accueil : Stop/Restart en tête ? `(E62)`
- **Objectif** : vérifier si l'arrêt/redémarrage est accessible en tête de l'accueil.
- **Étapes** : taper `/menu`.
- **Attendu (hypothèse audit)** : l'accueil montre 🚀 Créer / 🎬 Studio / 🎨 Éditer / Aide / Profil — **PAS** de Stop ni Restart en tête (ils sont enfouis). → à corriger.
- **Vérifie** : E62.
- **Impact** : confirme le quick-win « Stop/Restart en tête ».
- **Je vérifierai** : le rendu de `showHome` + tes taps dans ui_journal.

### T2 — Navigation aller-retour cohérente `(E4, E1)`
- **Objectif** : retours/labels cohérents, pas d'empilement.
- **Étapes** : `/menu` → 🎬 Studio → 👗 Looks → ouvrir un look (tap un numéro) → ◀️ Retour → ◀️ Retour.
- **Attendu** : chaque écran s'édite **en place** (un seul panneau), retours clairs, aucun message dupliqué.
- **Vérifie** : E4 (cohérence retours), E1 (cockpit unique).
- **Impact** : priorise l'unification du vocabulaire de retour / anti-empilement.
- **Je vérifierai** : ratio `edited_in_place:true/false`, occurrences « message is not modified », nb de messages créés.

### T3 — Galerie en grille `(E22)`
- **Objectif** : confirmer la planche 3×3 paginée.
- **Étapes** : `/menu` → Studio → 👗 Looks (ou `/looks`).
- **Attendu** : grille de vignettes 3×3 + pagination ◀️/▶️ Page.
- **Vérifie** : E22 (déjà supposé conforme — test rapide de non-régression).
- **Je vérifierai** : appel `showGallery` + page.

### T4 — Historique : montre-t-il les vraies vidéos ? `(E53, E54)` ⭐ incertitude
- **Objectif** : voir ce qu'affiche réellement l'historique.
- **Étapes** : `/menu` → Studio → 🕘 Historique.
- **Attendu (hypothèse audit = bug)** : une **liste de texte** au **mauvais contenu** (noms de photos de looks, pas les vidéos générées), **sans vignettes** ni bouton de réouverture.
- **Vérifie** : E53 (grille+aperçus manquants), E54 (réouverture).
- **Impact** : confirme le chantier « Historique par projet ».
- **Je vérifierai** : contenu listé par `STUDIO_HIST` vs dossiers réels `outputs/generations/`.

### T5 — Référence personnage depuis le cockpit `(E100)` ⭐
- **Objectif** : quelles actions réf sont disponibles.
- **Étapes** : taper `/reference`.
- **Attendu** : voir réf active + 🖼 pose / 👗 galerie / 📤 upload (changer) ; **MANQUENT** « 🔒 Verrouiller » et « ⭐ Définir par défaut ».
- **Vérifie** : E100 (partiel → ce qui manque).
- **Impact** : périmètre exact de la feature référence.
- **Je vérifierai** : boutons de `showRefMenu`.

### T6 — Bibliothèque de références (tags/recherche) `(E101)`
- **Objectif** : existe-t-il une vraie bibliothèque de références ?
- **Étapes** : depuis `/reference`, chercher une liste de références nommées/taguées/cherchables.
- **Attendu** : **non** — une seule référence active, aucune biblio taguée/filtrable.
- **Vérifie** : E101 (manquant).
- **Impact** : dimensionne le chantier bibliothèque.

### T7 — /edit : reset au neutre à l'ouverture `(E102 image)` ⭐
- **Objectif** : un réglage image appliqué ne « colle » pas à la génération suivante.
- **Étapes** : `/edit` → 🎨 Image → pousser un réglage (ex. contraste/filtre) → ◀️ revenir → fermer → re-taper `/edit`.
- **Attendu** : à la **réouverture**, l'image est revenue au **neutre** (pas de filtre hérité).
- **Vérifie** : E102 (volet image — BUG-4 censé corrigé).
- **Je vérifierai** : `style.json` (fx.image) remis à « Naturel » à l'ouverture.

### T8 — /edit : état par défaut de Zooms & Réactions `(E99, E102)` ⭐ incertitude
- **Objectif** : voir les **défauts** réels.
- **Étapes** : `/edit` → 🎬 Zooms (noter ON/OFF) ; puis 🎙 Réactions (noter le mode coché).
- **Attendu (hypothèse audit)** : **Zoom = ON par défaut**, **Réactions = « Naturel » par défaut** (≠ OFF voulu).
- **Vérifie** : E99 (réactions doivent être OFF par défaut), E102 (état non « propre »).
- **Impact** : confirme 2 défauts à remettre à neutre/OFF.
- **Je vérifierai** : `FX_DEFAULT` (render_local.js:73-76) vs ce que l'écran affiche.

### T9 — Récap coût AFFICHÉ sans payer `(E11, E10)`
- **Objectif** : le récap coût/nombre apparaît avant toute dépense.
- **Étapes** : `/newlook` → régler tenue/décor/nombre → **▶️ Générer** → **s'ARRÊTER** sur l'écran récap (NE PAS presser « 💲 Générer »).
- **Attendu** : récap clair (tenue · décor · format · nombre · coût en crédits) + bouton 💲 distinct ; rien n'est dépensé.
- **Vérifie** : E11 (récap), E10 (aucune dépense sans 💲).
- **Je vérifierai** : event `NL_GO` (récap affiché) **sans** `NL_GO2` qui suit.

### T10 — Étape LOOK des modes (sans lancer) `(flux-look E7)`
- **Objectif** : confirmer que Auto/Express demandent le look **avant** le script.
- **Étapes** : `/menu` → 🚀 Créer → 🤖 Auto → **écran Look** (✨ Nouveau / 🖼 Galerie / 📤 Upload) → ◀️ Sources / ⛔ Stop (NE PAS choisir, pour ne pas lancer le script Anthropic).
- **Attendu** : l'écran « LOOK — d'où vient ta star ? » s'affiche avant tout script.
- **Vérifie** : E7 (modes séparés), flux-look.
- **Je vérifierai** : `CREER_AUTO`→`showLookSource` dans ui_journal.

### T11 — Aperçu local gratuit `(E8 partiel)`
- **Objectif** : l'aperçu local (rendu ffmpeg) fonctionne sans coût.
- **Étapes** : `/test` (rendu local gratuit) et/ou `/preview`.
- **Attendu** : un aperçu se génère localement (gratuit), reflète l'état courant.
- **Vérifie** : E8 (prévisualisation).
- **Je vérifierai** : `MENU_TEST`/`runPreview` + rendu local (pas d'appel API).

### T12 — Légendes sur une vidéo déjà livrée `(E49, E50)`
- **Objectif** : forme et copie des légendes.
- **Étapes** : sur la dernière vidéo du bloc Résultats → 📋 Légende (basculer courte/longue).
- **Attendu** : légende courte/longue + hashtags copiables d'un tap ; **mais pas** de grille de légendes ni de versions.
- **Vérifie** : E50 (copiable ✅), E49 (grille/versions manquantes).
- **Je vérifierai** : `GF_LONG_`/`GF_SHORT_`.

### T13 — Reprise après /restart `(E6)` ⭐
- **Objectif** : l'état revient proprement après redémarrage (pas d'empilement, pas d'écran muet).
- **Étapes** : noter les blocs affichés → `/restart` → attendre « Bot prêt » → taper `/menu`.
- **Attendu** : le menu réapparaît **frais en bas** (stale-fix), accessible ; pas de panneau « mort » en haut.
- **Vérifie** : E6 + stale-fix.
- **Je vérifierai** : `deleteMessage`+recréation au 1er affichage post-restart.

### T14 — Persistance des params entre 2 nouveaux looks `(E102)` ⭐
- **Objectif** : un nouveau look ne réutilise pas auto les params du précédent.
- **Étapes** : `/newlook` (noter décor/nombre/mode) → ⛔ / Retour → `/newlook` de nouveau.
- **Attendu** : repart d'un état propre (à confirmer : durée/modèle/réf peuvent persister par design → à clarifier).
- **Vérifie** : E102 (couverture réelle).
- **Je vérifierai** : valeurs `newlook`/`genState`/`gw` réutilisées ou non.

---

# 💲 PARTIE 2 — TESTS PAYANTS (seulement si Etoile juge l'info nécessaire)

> Coûts indicatifs : 1 image éco ≈ **0,48 cr** ; 1 vidéo 23 s ≈ **~13 cr** (+ voix + script). **Le script
> nécessite des crédits Anthropic (actuellement épuisés).**

### P1 — Image éco : identité sur l'IMAGE SOURCE `(E74–E89)` ⭐⭐ incertitude majeure · ~0,48 cr
- **Objectif** : vérifier l'identité/anatomie sur une image fraîchement générée (cœur des 11 « Non vérifié »).
- **Étapes** : `/newlook` → 1 image → ▶️ Générer → **💲 Générer** → regarder le résultat.
- **Attendu** : visage/peau/cheveux/yeux dorés/freckles fidèles à Imany ; **aucun** poil parasite, doigt/membre en trop, déformation, changement d'âge/ethnie/morphologie.
- **Vérifie** : E74–E89 (+ valide l'utilité du futur gate E92).
- **Impact** : confirme la fréquence réelle des artefacts → calibrage du négatif prompt (E83) et du gate (E92).
- **Je vérifierai** : j'analyse l'image générée (frames/zoom) comme pour le « poil au torse ».

### P2 — Look à décolleté ouvert : l'artefact « poil au torse » revient-il ? `(E76, E81)` · ~0,48 cr
- **Objectif** : reproduire le cas connu (col ouvert = sternum exposé).
- **Étapes** : `/newlook` → tenue à décolleté ouvert (ou 🎲 jusqu'à en obtenir une) → 1 image → 💲 Générer.
- **Attendu (hypothèse)** : l'artefact **réapparaît** sur le sternum (prompt « MAXIMUM skin texture » sans négatif).
- **Vérifie** : E76/E81 → justifie E83 (négatif) + E92 (gate).
- **Je vérifierai** : zoom torse de l'image générée.

### P3 — 2-3 images : planche contact auto ? `(E36)` · ~0,96–1,44 cr
- **Objectif** : voir s'il y a une vue d'ensemble auto du lot.
- **Étapes** : `/newlook` → 📸 3 → ▶️ Générer → 💲 Générer.
- **Attendu (hypothèse audit)** : les images **défilent 1-par-1** (‹ ›), **pas** de planche-contact automatique.
- **Vérifie** : E36 (manquant).
- **Je vérifierai** : `nlShowResult` (mode défilement) dans ui_journal.

### P4 — Script seul : le mot « pause » apparaît-il ? `(E98)` ⭐ · Anthropic ~cents (crédits requis)
- **Objectif** : voir le script généré sans payer la vidéo.
- **Étapes** : `/menu` → Créer → ✏️ Sur-mesure → ▶️ GO → **carte Script** → lire le texte (et 📄 Script complet). **S'ARRÊTER** là (ne pas lancer maquette/vidéo).
- **Attendu (hypothèse audit)** : le marqueur **`[pause]` est visible** dans le script.
- **Vérifie** : E98 (à corriger : retirer [pause] du script).
- **Impact** : confirme la correction du prompt script.
- **Je vérifierai** : `genJob.script` (présence de `[pause]`), sans `GJ_GO`.

### P5 — Vidéo complète : colorimétrie + déformation lipsync `(E97, E86)` ⭐ · ~13 cr (+ Anthropic)
- **Objectif** : confirmer la dérive couleur et l'absence de déformation au lipsync.
- **Étapes** : parcours vidéo complet jusqu'à livraison (à ne faire qu'avec crédits Anthropic + Higgsfield OK).
- **Attendu** : vidéo **plus chaude/contrastée que la source** (E97 → à corriger) ; visage non déformé pendant le lipsync (E86).
- **Vérifie** : E97 (fidélité couleur), E86 (déformation).
- **Je vérifierai** : QC source→final (montage) comme déjà fait.

---

## Synthèse — ce qu'on lève

- **🆓 14 tests gratuits** (T1–T14) : navigation, accueil, galerie, historique, référence, /edit reset & défauts, récap coût, étape look, aperçu local, légendes, reprise restart, persistance params.
- **💲 5 tests payants** (P1–P5) : identité image (×2 dont décolleté), planche-contact, script « pause » (Anthropic), vidéo couleur/déformation.

_Doc only — aucune correction. À l'issue des tests d'Etoile, je confirme/infirme chaque point via `ui_journal`._

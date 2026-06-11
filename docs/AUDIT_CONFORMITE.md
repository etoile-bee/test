# AUDIT DE CONFORMITÉ /v4r — état RÉEL (11/06/2026, soir)

> Règle : **factuel uniquement**. ✅ Conforme · 🟡 Partiel · ❌ Non conforme · ⚠️ Non vérifiable en simulation.
> Preuve = test runtime/carto rejoué sur le VRAI chemin, ou fichier. « non terminé » = marqué non terminé.

## 0. RAPPORT D'INCIDENT DÉPENSE (chiffre exact)

- **11 générations photo réelles** déclenchées par MES tests (LIVE laissé armé + porte `realPhoto` sans garde `!R0DRY`).
- Fichiers : `projects_r/imany/imany_2026-06-11-14-49-52/photo_*.jpg`, **mtime 17:09→17:13** (11 fichiers).
- Coût : **11 × 0,48 = 5,28 cr ≈ 0,31 €** (le compteur n'en avait plafonné que 10 ; le 11ᵉ a dépensé sans être compté).
- Les « 435 photos » de la galerie = agrégat legacy (anciens projets/générations/looks), **distinct** de ces 11.
- **Correctifs en place et PROUVÉS** (`tools/test_v4r_nospend.js`, 4/4) : `realPhoto`/`realVideo` gardés par `!R0DRY` ; `engines.live()` force **OFF** sous `R0_DRYRUN` même si `v4r_live` existe. **Un banc d'essai ne peut plus jamais dépenser.**
- **Budget remis à 0/10** (mes 11 tests ne grignotent pas les 10 d'Etoile). **LIVE désarmé** (`v4r_live` absent).

## 1. LES 5 POINTS BLOQUANTS

| # | Point | État | Attendu / Réel aujourd'hui / Manque / Preuve |
|---|-------|------|----------------------------------------------|
| 1 | **Aperçu réel** | 🟡 | Attendu : Préparer→Aperçu(écran récap)→Valider→Générer maintenant. **Réel : FAIT** — « 👁 Aperçu » ouvre un vrai écran récap (prompt·tenue·décor·référence·format·coût·tests) avec [◀ Retour][✏️ Éditer][✅ Valider][✨ Générer maintenant] ; plus de toast. **Manque** : sur média photo, le prompt TRÈS long peut être coupé par la limite Telegram 1024 (le prompt entier reste lisible/éditable dans le bloc Prompt). Preuve : `test_v4r_runtime` R4 (6 assertions). |
| 2 | **Conservation données** | 🟡 | Attendu : aucun champ remplacé silencieusement. **Réel** : photo→vidéo épingle la source (`source_id`/`source_file`) — ne change plus ; un autre réglage n'écrase pas la source. Preuve : `test_v4r_runtime` R2. **Manque** : preuve exhaustive par CHAQUE champ avec de VRAIS fichiers = ⚠️ (sim ne pose pas de fichier réel). Voir §2. |
| 3 | **Galerie** | 🟡 | **Réel** : agrège projet courant + `projects_r/*/photo_*` + `outputs/generations/*` + `looks/gen_*` (435 visibles), sélection par numéro OK. **Manque** : « Suivant »/pagination explicite (**D, ❌**) ; Vidéo›Historique = projet courant seulement, pas global (**G, ❌**). Preuve : `r0RealImages` + carto gallery. |
| 4 | **Retour partout** | ✅ | Chaque écran non-racine a un **◀ Retour** (≠ Accueil). Carto renforcée : colonne « retour » exigée. Preuve : `test_v4r_carto` 112/0, 19 écrans, colonne retour ✅ partout (corrige PHOTO·Choisir qui n'en avait pas). |
| 5 | **Persistance /v4r·/menu·/restart** | 🟡 | **Réel** : rendus = messages dédiés jamais supprimés ; `/v4r` et `/v4r new` conservent les rendus (preuve `test_v4r_runtime` RP). **Manque** : `/menu` et `/restart` non rejoués en dry-run — par conception les mids de rendus ne sont jamais dans la file de suppression du cockpit, donc préservés, mais **non prouvé par test** = à valider on-device. |

## 2. CONTRÔLE PERSISTANCE PAR CHAMP

Stockage : `projects_r/<persona>/<id>/facts.json` → `facts.draft.photo` / `facts.draft.video` / `facts.publication`. Relu à chaque rendu de vue. Écrasable uniquement par un SET/saisie explicite du champ.

| Média | Champ | Stocké | Relu | Écrasable | Statut |
|-------|-------|--------|------|-----------|--------|
| PHOTO | prompt | draft.photo.prompt | aperçu, résultat, bloc | saisie/✨/📁 modèle | ✅ prouvé (sim) |
| PHOTO | tenue (look) | draft.photo.look | aperçu, résultat, bloc | SET tenue | ✅ prouvé (sim) |
| PHOTO | décor | draft.photo.decor | aperçu, résultat, bloc | SET décor | ✅ prouvé (sim) |
| PHOTO | référence | draft.photo.reference(+ref_locked) | bloc Référence, aperçu | upload/verrou | 🟡 (verrou prouvé ; persistance fichier réel ⚠️) |
| PHOTO | format | draft.photo.format | aperçu, montage | SET format | ✅ prouvé (sim) |
| PHOTO | source (fichier) | média candidat (facts.medias) | partout | nouvelle génération/import | ⚠️ réel (sim sans fichier) |
| VIDÉO | source | draft.video.source/source_id/source_file | aperçu, montage | photo→vidéo (épinglé) | ✅ identité prouvée ; fichier ⚠️ |
| VIDÉO | script | draft.video.script | aperçu, montage, résultat | saisie/✨/📁 | ✅ prouvé (sim) |
| VIDÉO | voix | draft.video.voix | montage, aperçu | SET voix | ✅ prouvé (sim) |
| VIDÉO | musique | draft.video.musique | montage | SET musique | ✅ prouvé (sim) |
| VIDÉO | sous-titres (+style) | draft.video.soustitres/st_* | montage, aperçu, résultat | SET sous-titres | ✅ prouvé (sim) |
| VIDÉO | durée | draft.video.duree | montage, aperçu | SET durée | ✅ prouvé (sim) |
| VIDÉO | légendes (courte/longue/hashtags) | facts.publication | résultat, ressources, publication | saisie/✨ | ✅ prouvé (sim) |

**Remplacement silencieux détecté ? NON** dans les parcours rejoués (photo→vidéo, édition d'un autre champ). ⚠️ La persistance avec de VRAIS fichiers (référence/source réelles) n'est pas couverte par la simulation — à valider on-device.

## 3. CONTRÔLE ÉCRAN FINAL

**PHOTO · Résultat** : image ✅ · prompt ✅ · tenue ✅ · décor ✅ · référence ❌ (visible à l'Aperçu/Montage, pas sur le résultat) · Modifier ✅ · Régénérer ✅ · Créer vidéo ✅ · Historique ✅ · Publication ✅ · Ressources ✅ · Garder ✅ · Retour ✅.
**VIDÉO · Résultat** : vidéo ✅ · script ✅ · légende courte ✅ · longue ✅ · hashtags ✅ · sous-titres ✅ · Fichiers projet ✅ · Modifier ✅ · Régénérer ✅ · Publier ✅ · Garder ✅ · Retour ✅.

## 4. CARTE DES SOURCES GALERIE

`r0RealImages()` agrège, dédupliqué par nom, le plus récent d'abord :
1. **Projet courant** — médias avec fichier réel.
2. **`projects_r/<persona>/*/photo_*.jpg`** — photos réelles v4r de tous les projets.
3. **`outputs/generations/*`** (jpg/png/webp) — générations legacy.
4. **`looks/gen_*`** — looks générés.

**Ignoré / non remonté** : vidéos (la galerie image ne liste que les images) ; Vidéo›Historique ne lit que le projet courant (**G ❌ : agrégation vidéo globale à faire**) ; imports hors `projects_r` non balayés. **Anciens + générés remontent ✅ ; importés dans le projet ✅ ; vidéos globales ❌.**

## 5. SIM vs RÉEL

| Comportement | Validable en simulation | Test réel requis | Jamais validable sans réel |
|---|---|---|---|
| Navigation, Retour, aperçu, titres, persistance des blocs | ✅ | | |
| Conservation des champs (identité) | ✅ | | |
| Conservation avec VRAIS fichiers (référence/source) | | ✅ | |
| Photo réelle (Seedream éco) | | ✅ (déjà observé : les 11 de l'incident) | |
| Vidéo réelle (Kling+ElevenLabs+script) | | | ⚠️ **jamais validée en réel** (câblée, dry-run only) |

**Ce qui bloque le test PHOTO réel** : rien techniquement (double-confirm OK, anti-spend OK, budget 0/10) — il manque seulement TON go pour réarmer LIVE photo.
**Ce qui bloque le test VIDÉO réel** : le pipeline `r0RealVideo` n'a jamais tourné en vrai (coût ~13–26 cr) ; 1er run = ton clic, non pré-testable sans dépense.

## 6. MES PROPRES ÉCARTS (constats)

- **Aperçu** : prompt long coupé à 1024 sur média photo (limite Telegram) — acceptable mais signalé.
- **G (Vidéo›Historique global)** : ❌ pas fait.
- **D (galerie pagination « Suivant »)** : ❌ pas fait (sélection par numéro OK).
- **H (plan réorg fichiers)** : ❌ pas rédigé.
- **Persistance fichiers réels** : non couverte par la simulation (⚠️).
- **/menu·/restart** : préservation des rendus par conception, **non prouvée par test**.
- **Incident dépense** : 0,31 € réels dépensés par mes tests (corrigé, non récidivable).

## Conclusion honnête

Le système **n'est pas « prêt » au sens fort** : Aperçu réel ✅ et Retour partout ✅ et incident verrouillé ✅, mais Conservation/Galerie/Persistance-/menu sont 🟡 et la **vidéo réelle reste non validée (⚠️)**, G/D/H ❌. **LIVE reste désarmé** — à toi de décider des tests réels ciblés.

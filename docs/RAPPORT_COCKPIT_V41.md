# RAPPORT DE LIVRAISON — COCKPIT v4.1 (lot unique E119)

> Construit en autonomie selon la directive d'Etoile (10/06) : **stop aux arbitrages**, décisions UX
> de premier niveau tranchées seule (V1–V5), cockpit **complet et cohérent de bout en bout** dans un
> **lot unique**, branche dédiée, derrière `/v4`, **live actuel intact**, **AUCUNE dépense**, fichiers
> verrouillés intacts. Escalade réservée aux vrais conflits (E120). Branche : `cockpit-v41`.
>
> **LA question d'Etoile** : « est-ce enfin le cockpit qu'on a défini depuis le début ? »
> Ce rapport démontre, concept par concept, que **le projet, ses composants, la hiérarchie des objets
> et la sensation de piloter un projet complet sont désormais VISIBLES et EXPLOITABLES** — pas seulement
> présents dans le moteur.

---

## 0. Résumé exécutif

- **Le manque central est comblé** : un **TABLEAU DE BORD PROJET** (bandeau d'état permanent en tête de
  chaque écran + écran **📊 Projet** complet) rend visibles en permanence le **projet**, son **état
  global**, ses **zones créatives** (réf/look/décor/prompt + verrous), ses **paramètres**, ses
  **variantes** et ses **livrables**. On *voit* le projet, on *voit* ses composants, on *sent* qu'on
  pilote un objet unique — plus une succession d'écrans fonctionnels.
- **Nettoyage total** : zéro ID technique à l'écran, zéro statut brut (`production/pret_a_poster`),
  RÉCENTS en libellés lisibles + état lisible, biblios en noms lisibles, message « Chargement… »
  supprimé, Stop/Restart sortis de la barre créative (commandes `/stop` `/restart`), saisies
  fonctionnelles (renommer / créer une zone) à la place des ex-messages « branché au câblage ».
- **Cohérence bout en bout** PHOTO→IMAGE→VIDÉO→Livrables→Prêt-à-poster sur **un seul projet, un seul
  bloc**, étanchéité inter-projets (E124), livrables explicites (E123), dossier projet source de vérité
  (E122), dossier livrable autonome (E125).
- **Preuves** : **313 tests / 21 suites / 0 KO** (cockpit-v4) + **régressions legacy vertes**
  (nodup 16, feedback 15, gallery 7, nbphotos 7, stalefix 8) + `node --check` OK.
- **Sécurité du run** : génération = **STUB GRATUIT** (zéro dépense même en cliquant « 💲 Lancer ») ;
  backend réel Seedream prêt mais **débranché**, ré-activable uniquement au run réel sur go d'Etoile.
  **Live `/v4` (cockpit-v4) intact** : rien n'est déployé, le bot tourne encore l'ancien code chargé.

---

## 1. Décisions UX de premier niveau (V1–V5) — tranchées en autonomie

| # | Décision | Choix retenu (défaut recommandé) | Implémentation |
|---|----------|----------------------------------|----------------|
| **V1** | Visibilité de l'état projet | **Bandeau d'état permanent + écran 📊 Projet** | `hdr()` 3 lignes sur chaque écran projet + `viewDashboard()` |
| **V2** | Nom de projet | **Nom auto « Projet · 10 juin 15h52 », renommable** | `projName()`/`friendlyName()` + RENAME (saisie réelle) |
| **V3** | Stop/Restart | **Commandes hors écrans** (`/stop` `/restart`), retirés de la barre créative | `actionBar()` ligne 2 = `📊 Projet · ❓ Aide` |
| **V4** | Messages techniques | **Suppression TOTALE** | libellés lisibles partout, « Chargement… » retiré, notices métier |
| **V5** | Écran 📊 Projet | **Lecture d'abord**, actions ensuite | caption = hiérarchie lisible ; rangées d'actions en dessous |

Aucun conflit E120 rencontré : ces décisions **complètent** les exigences sans en contredire aucune
(le bandeau renforce E1/E104/E105, le nom lisible sert E23/E110, etc.).

---

## 2. MATRICE DE COUVERTURE « capacité moteur → surface UI »

> Critère : chaque concept doit être **VISIBLE** (affiché) **ET EXPLOITABLE** (action possible) dans
> l'UI — pas seulement présent dans le moteur (manifest/store).

| Concept (moteur) | Champ manifest / store | VISIBLE où | EXPLOITABLE comment | Statut |
|---|---|---|---|---|
| **Référence** | `zones.reference` / `reference` | bandeau `🎯`, 📊 Projet, Paramètres | picker zone : verrou · biblio · créer · enregistrer · historique-restaurer | ✅ |
| **Look** | `zones.look` / `look.tenue` | bandeau `👗`, 📊 Projet, Paramètres | picker zone (idem) + STUDIO Looks (consulter→appliquer) | ✅ |
| **Décor** | `zones.decor` / `look.decor` | bandeau `🌆`, 📊 Projet, Paramètres | picker zone (idem) + biblio décors | ✅ |
| **Prompt** | `zones.prompt` / `prompts[]` | bandeau `✍️`, 📊 Projet, Paramètres | picker zone : éditer/créer/enregistrer/réutiliser/historique | ✅ |
| **Paramètres** | `parametres` (nb/durée/format/fx/crop) | bandeau `⚙️`, 📊 Projet, écran Paramètres | nb d'images, durée, Ajuster (Édition image), crop, presets | ✅ |
| **Variantes** | `variantes[]` | bandeau `◫ N var`, 📊 Projet, écran candidat | « Conserver comme variante » (Plus d'options) ; badge `◫ variante` | ✅ |
| **Média actif** | `media_actif` | **aperçu en tête de CHAQUE écran**, 📊 Projet `🖼 ✓`, écran candidat `★` | « ★ Définir comme média actif » | ✅ |
| **Livrables** | `livrables` + `livrables_dossiers[]` | bandeau `📦 N liv`, 📊 Projet, FINALISER (☑ Image ☑ Vidéo) | écran Livrables (liste) → ouverture (légendes/hashtags copiables) | ✅ |
| **Versions** | `versions[]` | 📊 Projet `🕘 N`, écran Paramètres | snapshot « Enregistrer version » + restaurer (sans perte) | ✅ |
| **Prêt-à-poster** | `statut_publication` | bandeau état, FINALISER `📤`, vue Prêt-à-poster | bouton **📣 Publier** (sort de la file, reste en Historique) | ✅ |
| **Historique** | `listProjects` (magasin unique) | accueil **🕘 RÉCENTS**, vues Récents/Historique | ouvrir un projet (`OPEN_`) → reprise à l'étape exacte | ✅ |
| **Dossier projet** (source de vérité) | `project.json` (manifest) | implicite (tout l'écran le lit) + 📊 Projet + ✏️ Renommer | reprise après restart, renommage, navigation sans perte | ✅ |
| **Dossier livrable** (autonome) | `livrables_dossiers[i]` (E125) | écran Livrable | ouvrir = vidéo/image/script/**légende courte+longue+hashtags**/params/coûts/RAW | ✅ |
| **Verrous (zones)** | `zones[k].locked` | `🔒` dans le bandeau + dans chaque picker | Verrouiller / Déverrouiller (conserve la zone en régénération) | ✅ |
| **États** (qualité+publication) | `statut_qualite` / `statut_publication` | bandeau (📝/⏳/✅/📣), 📊 Projet, chips RÉCENTS | dérivés automatiquement ; pilotés par les actions (valider/publier) | ✅ |

**Conclusion couverture : 15/15 concepts visibles ET exploitables.** Aucun concept moteur n'est
« enfermé » sans surface UI.

---

## 3. AUTO-AUDIT E118 — protocole complet (12 étapes)

| # | Étape E118 | Résultat | Preuve |
|---|------------|----------|--------|
| 1 | Audit du code touché + périmètre | ✅ | `cockpit_view`, `cockpit_controller`, `cockpit_lib`, `cockpit_integration`, `project_store`, `telegram_bot` (glue) ; `node --check` OK |
| 2 | Parcours **PHOTO** bout en bout | ✅ | `test_cockpit_e2e` (16), `test_cockpit_flow` (21) : SOURCE→PARAMÈTRES→FINALISER, gates média réel |
| 3 | Parcours **VIDÉO** bout en bout | ✅ | `test_cockpit_e2e`, `test_cockpit_q9` (plans = images retenues), `test_cockpit_e125_d2` (durée/montage) |
| 4 | Test **bibliothèques** (consulter ≠ modifier, retour exact, pas de 2ᵉ cockpit) | ✅ | `test_cockpit_lib` (20) : LV_ consulte, LA_ applique (explicite), RESUME |
| 5 | Test **Historique** (mémoire complète permanente) | ✅ | `test_project_store` (32), `test_cockpit_lib` : magasin unique, filtres |
| 6 | Test **Prêt-à-poster** (publié sort de la file, reste en Historique) | ✅ | `test_cockpit_lot567` (9) : PUBLISH → `publie`, conservé |
| 7 | Test **reprise projet** (menu, restart, jours après) | ✅ | `test_cockpit_controller` (32) : nouveau contrôleur, `OPEN_`, média actif retrouvé |
| 8 | Test **propagation média actif** | ✅ | `test_cockpit_view` (35) : `media = media_actif` à chaque étape |
| 9 | **Recherche de régressions** (zones non touchées) | ✅ | legacy : nodup 16 / feedback 15 / gallery 7 / nbphotos 7 / stalefix 8 (tous verts) |
| 10 | **RAPPORT écrit** | ✅ | ce document |
| 11 | **Corrections** | ✅ | E122 (clé `await` ajoutée aux pointeurs), libellés lisibles, saisies réelles |
| 12 | **Nouvelle validation** de la passe | ✅ | sweep complet **313/313** re-exécuté après corrections |

**8 tests fonctionnels obligatoires : tous au vert.** Objectif E118 (zéro régression évidente
découverte après livraison) : tenu au mieux de la couverture automatisée.

---

## 4. MATRICE DE CONFORMITÉ E1 → E126

> Légende statut : **✅** conforme (couvert + prouvé) · **◑** partiel (couvert côté cockpit-v4,
> complément hors-lot ou côté legacy) · **⏳** hors-lot (prêt mais volontairement débranché : run réel /
> stockage / auto-post) · **▣** assuré par le legacy live (préservé, hors périmètre v4.1).

### A. Architecture & principes (E1–E9)
- **E1** ✅ cockpit = bloc unique édité en place (`cockpit_block`, identité de bloc, `test_cockpit_block` 11).
- **E2** ✅ 2 phases PHOTO/VIDÉO connectées dans un seul projet (modèle A ; `test_cockpit_e2e`).
- **E3** ✅ style ÉDITION : 1 média en tête, légende courte, boutons emoji, 💲 sur payant.
- **E4** ✅ navigation homogène : ⬅ Retour · ✅ Valider · 🏠 Accueil partout (`actionBar`).
- **E5** ✅ état conservé (manifest source de vérité ; navigation = pointeurs reconstructibles).
- **E6** ✅ reprise après restart (`resume()` rouvre le projet en cours).
- **E7** ◑ Manuel couvert ; Auto = chaîne legacy `▣` (hors lot v4.1).
- **E8** ✅ aperçu permanent = média actif à chaque étape.
- **E9** ✅ multi-persona (store par persona ; `_persona()`).

### B. Coûts (E10–E14)
- **E10** ✅ aucune génération payante sans confirmation ; en v4.1 **stub gratuit** (zéro dépense).
- **E11** ✅ panneau coût+crédits+temps avant dépense (`confirmView`, `cockpit_cost`, `test_cockpit_cost` 11).
- **E12** ✅ éco d'abord (mode éco par défaut) ; HD/vidéo après validation/QC.
- **E13** ✅ maquette/QC avant lipsync (gate QC en FINALISER avant Final HD).
- **E14** ✅ coûts/temps honnêtes (estimation explicite ; pas de durée masquée).

### C/D/E. Looks · Décors · Prompts CRUD (E15–E34)
- **E15–E23 (Looks)** ◑ zone **Look** : créer/enregistrer/réutiliser/verrouiller/historique (`test_cockpit_zones`) + STUDIO Looks (galerie 6/écran, consulter→appliquer). Dupliquer/corbeille/archiver looks = `▣` legacy (libstore prêt).
- **E24–E27 (Décors)** ◑ zone **Décor** indépendante + biblio décors (libstore : add/lock/delete, `test_cockpit_libstore` 18) ; 3 décors de base `▣`.
- **E28–E34 (Prompts)** ✅ zone **Prompt** : visibles, éditables, enregistrables, réutilisables, historique — **sans changer d'écran** (picker focalisé). Supprimer/dupliquer prompt via biblio `◑`.

### F. Images (E35–E39)
- **E35** ✅ sélecteur nombre (1/2/3/4/6) — `test_cockpit_view`.
- **E36** ✅ planche contact quand nb>1 (`viewPlanche`, `test_cockpit_lot34` 11).
- **E37** ✅ sélection image pour la vidéo (retenues = plans, Q9).
- **E38** ✅ éditer une image avant la vidéo (`viewImgEdit`, par projet).
- **E39** ✅ image brute/entière (raw=true côté transport ; jamais de sur-zoom).

### G. Vidéo & connexions (E40–E45)
- **E40** ✅ redirections vérifiées (dispatch testé `test_cockpit_controller`).
- **E41** ✅ PHOTO↔VIDÉO connectés sans perte (réversible ; ⬅ depuis VIDÉO revient à PHOTO).
- **E42** ◑ chaîne vidéo : structure complète côté cockpit ; rendu réel ElevenLabs/Kling/ffmpeg = `▣`/`⏳` (gated).
- **E43** ✅ workflows transverses (4 workflows zones prouvés ; HISTORIQUE→réutilisation).
- **E44** ✅ durée libre/adaptée (`cockpit_cost.adaptMontage`, `test_cockpit_e125_d2`).
- **E45** ◑ « partie suivante » = montage multi-plans (retenues) ; enchaînement parts `▣`.

### H/I. Script · Légendes (E46–E51)
- **E46** ✅ script affiché/éditable avant dépense (Paramètres VIDÉO P_SCRIPT).
- **E47** ◑ anti-répétition sujets = `▣` legacy (TTS_BAD/garde-fou).
- **E48** ◑ hooks A/B = `▣` (hors lot v4.1).
- **E49** ✅ légendes reliées aux livrables + versions (dossier livrable).
- **E50** ✅ légende courte+longue+hashtags **copiables sans le titre** (blocs `<code>`, `viewLivrable`).
- **E51** ◑ éditer/régénérer légendes = `▣` (génération réelle).

### J. Historique/Archivage/Export (E52–E59)
- **E52** ✅ tout généré sauvegardé/retrouvable (dossier projet, magasin unique).
- **E53** ✅ Historique en grille avec aperçus (vues filtrées, `test_cockpit_lib`).
- **E54** ✅ réouverture/réédition d'un projet (`OPEN_` → resume).
- **E55–E56** ✅ projet réouvrable à l'identique (manifest complet = config + médias + prompts + params).
- **E57** ✅ prêt-à-poster / brouillons (états dérivés).
- **E58** ◑ restyle gratuit (rendu local ffmpeg) = `▣` (verrou render_local intact).
- **E59** ⏳ publication TikTok auto + stockage privé : **hors lot** (PUBLISH = statut métier, pas d'auto-post — décision A5).

### K. Suivi/État/Robustesse (E60–E66)
- **E60** ✅ suivi de génération (`gen_status` idle/running/done/aborted).
- **E61** ✅ annulation réelle (GEN_ABORT + statut ; SIGTERM au câblage réel).
- **E62** ✅ `/stop` + `/restart` accessibles (commandes, hors barre créative — V3).
- **E63** ◑ journal user + logs système = `▣` (jlog/uiLog live).
- **E64** ✅ erreurs claires/actionnables (notices métier ; pas d'erreur opaque).
- **E65** ◑ traçabilité par session = `▣` + `historique_versions` par projet.
- **E66** ✅ un seul flux de génération dans le cockpit-v4 (pas de flux concurrents).

### L. Style/Rendu verrouillés (E67–E70)
- **E67** ✅ sous-titres 76px/OY 0.370 — **fichier verrouillé intact** (`subtitle_style.js` non touché).
- **E68** ✅ supersédé par E97 (V5 non appliqué par défaut).
- **E69** ◑ son −14 LUFS / bt709 = `▣` (rendu legacy verrouillé).
- **E70** ✅ référence Imany en place (`▣`).

### M. Méthode/gouvernance (E71–E73)
- **E71** ✅ maquette/design d'abord (VISION_COCKPIT_FINAL validée avant ce build).
- **E72** ✅ filet : `node --check` OK, régressions vertes, petits commits (2 checkpoints).
- **E73** ✅ fidélité test→prod (le rendu pur `view()` est identique en test et au câblage).

### O. Identité & QC (E74–E92)
- **E74–E89** ◑ critères d'identité/anatomie = **checklist QC** affichée (gate humain) ; détection auto (vision) = `⏳` bonus non bloquant.
- **E90** ◑ attribution étape responsable = process documenté (raws conservés par étape, E93.5).
- **E91** ✅ gate validation finale bloquante (FINALISER : Valider verrouillé tant que QC non passé).
- **E92** ✅ **gate QC AVANT dépense** : `🔍 Contrôle qualité requis` + 3 actions (Régénérer/Éditer/Valider malgré) ; verdict **enregistré** (`recordQC` → `rapport_qc`). Placement FINALISER avant Final HD. (`test_cockpit_view`, `test_cockpit_flow`).

### P. Projet unique/Stockage/Test-Prod/Validation (E93–E96)
- **E93** ✅ dossier/projet unique complet (manifest = look/décor/prompts/script/images/variantes/raws/coûts/QC/versions/livrables) ; `test_project_store` 32.
- **E94** ⏳ stockage cloud persistant : **hors lot** (dossier local source de vérité ; iCloud/S3 = cible future).
- **E95** ◑ TEST vs PRODUCTION = axe `statut_qualite` (brouillon/test/production).
- **E96** ✅ workflow validation TEST→QC→validation→PRODUCTION (promotion via Valider + QC ; historique de validation conservé).

### Q. Retours 1ᵉʳ test réel (E97–E103)
- **E97** ✅ colorimétrie fidèle à la source par défaut (réglages par projet, jamais de grade global ; `color_style.js` verrouillé non câblé).
- **E98** ◑ script sans « pause » = `▣` legacy.
- **E99** ◑ réactions défaut OFF = `▣`.
- **E100** ◑ référence depuis le cockpit (zone Référence : voir/choisir/changer/**verrouiller**) ; upload/définir-par-défaut `◑`.
- **E101** ◑ biblio références (consulter/réutiliser) ; tags/recherche/filtres `⏳`.
- **E102** ✅ **non-réutilisation auto des paramètres** : état propre par projet (E124 prouvé) ; presets = copie explicite.
- **E103** ✅ règle de priorité respectée (E97/E102 intégrés ; étanchéité structurelle).

### S. Accueil/Cockpit UX + règles directrices (E104–E126)
- **E104** ✅ 4 entrées permanentes (PHOTO·VIDÉO·STUDIO·RÉCENTS) — `home()`, `test_cockpit_view`.
- **E105** ✅ blocs fonctionnels uniques, frontières claires (STUDIO = biblios seules ; RÉCENTS = reprise).
- **E106** ✅ architecture modulaire (modules `ui/*` isolés, contrôleur central).
- **E107** ✅ strangler-fig : cockpit-v4 monté derrière `/v4`, legacy intact.
- **E108** ✅ navigation universelle (Retour/Valider/Accueil ; Valider désactivé tant que gate non satisfait).
- **E109** ✅ navigation en place / bloc fixe (édition in-place, résultat dans le bloc courant).
- **E110** ✅ états (brouillon/en cours/finalisé/archivé) = vues du magasin ; reprendre/renommer/archiver.
- **E111** ✅ messages techniques éphémères ; navigation intra-bloc en place ; `/menu`/résultats = nouveau bloc.
- **E112** ◑ aide à droite ; barre système (Stop/Restart en commandes — V3) ; aide enrichie `◑`.
- **E113** ◑ unicité du brouillon (`draftId` stable) = `▣` + projet courant unique côté v4.
- **E114** ✅ persistance d'état bout en bout (manifest ; retour→modif→continuer sans perte).
- **E115** ✅ avance par Valider + **conservation de l'aval** (vue d'impact Conserver/Mettre à jour/Régénérer ; jamais d'effacement silencieux). `test_cockpit_controller`.
- **E116** ✅ grille de cohérence parcours (9 questions) — couverte par `test_cockpit_e2e`.
- **E117** ✅ garde-fou architecture en amont (relecture E1→E126 **avant** ce build — cette matrice en est la preuve).
- **E118** ✅ protocole qualité (ce rapport, §3) — 12 étapes + 8 tests verts.
- **E119** ✅ **livraison unique cohérente** : design figé (VISION) → implémentation complète → audit → auto-tests → 1 livraison.
- **E120** ✅ conformité aux exigences validées : cette **matrice exhaustive E1→E126** (statut + justification + preuve) ; aucun conflit détecté.
- **E121** ✅ source de données unique (RÉCENTS/Historique/Prêt-à-poster = filtres du même `listProjects`) ; `test_project_store`/`test_cockpit_lib`.
- **E122** ✅ l'UI ne détient jamais l'état : seul état UI = **pointeurs** (`projectId/flow/step/…/await`) reconstructibles ; tout le métier dans le manifest. `test_cockpit_controller` (E122 pointeurs only).
- **E123** ✅ livrables explicites : validation d'image explicite (garder/variante/livrable/rejeter) ; **aucune image non validée en livrables/Prêt-à-poster** ; FINALISER ☑ Image ☑ Vidéo. `test_cockpit_view`/`controller`.
- **E124** ✅ **étanchéité inter-projets** (réglages/filtres/colorimétrie/crop ne fuient jamais) — `test_etancheite_projets` 10 (critique/permanent).
- **E125** ✅ dossier livrable autonome (vidéo/images/script/légendes/hashtags/params/coûts/RAW) + 3 états distincts. `test_cockpit_e125_d2`, `test_cockpit_livrables_ui`.
- **E126** ✅ arbitrage proactif par module (zones grises tenues ; décisions V1–V5 documentées ici en amont).

**Synthèse conformité** : sur 126 exigences — **✅ conforme : ~92** · **◑ partiel/legacy-préservé : ~26** ·
**⏳ hors-lot (run réel / cloud / auto-post / détection auto)** : **8** (E59, E94, E101 tags, E92.b
détection vision, et les chaînes de génération réelles E42/E51 — toutes **volontairement débranchées**,
prêtes, zéro dépense). **Aucune exigence cassée, déplacée, ni réinterprétée. Aucun conflit E120.**

---

## 5. RECHERCHE DE RÉGRESSIONS

- **Suite cockpit-v4** : `313 tests / 21 suites / 0 KO` (détail §6).
- **Régressions legacy** (zones non touchées, invocation canonique `require`) :
  `nodup 16/16 · feedback 15/15 · gallery 7/7 · nbphotos 7/7 · stalefix 8/8` — **tous verts**.
- `node --check telegram_bot.js` + tous les modules `ui/*` : **OK**.
- **Diff `telegram_bot.js`** depuis la base de branche = **2 changements seulement** : suppression des
  toasts « Chargement… » (RES_PREV/NEXT) + 1 ligne de capture de saisie texte v4 (renommer/créer zone).
  Aucune fonction legacy modifiée → pas de surface de régression sur le live.

---

## 6. PREUVES — suites de tests (cockpit-v4)

```
test_cockpit_block        11   test_cockpit_lib          20   test_cockpit_q9            9
test_cockpit_controller   32   test_cockpit_libstore     18   test_cockpit_transport    15
test_cockpit_cost         11   test_cockpit_livrables_ui  7   test_cockpit_view         35
test_cockpit_e125_d2      13   test_cockpit_lot34        11   test_cockpit_zones        11
test_cockpit_e2e          16   test_cockpit_lot567        9   test_cockpit_zones_ui      8
test_cockpit_flow         21   test_cockpit_q2            7   test_etancheite_projets   10
test_cockpit_integration   7   test_cockpit_q45         10   test_project_store        32
                                                              ───────────────────────────
                                                              TOTAL : 313 OK / 0 KO
```

---

## 7. INVARIANTS & CONTRAINTES — respectés

- ✅ **Live `/v4` intact** : aucun déploiement, aucun restart du bot ; l'ancien code reste chargé.
- ✅ **AUCUNE dépense** : génération = stub gratuit ; backend réel débranché (`void v4ImageBackend`).
- ✅ **Fichiers verrouillés intacts** : `subtitle_style.js`, `color_style.js`, sous-titres `render_local`,
  fidélité `workflow.js` — **non touchés** (réglages appliqués par projet, transitoirement).
- ✅ **Aucune génération déclenchée par Claude** : seul le clic « 💲 Lancer » (GEN_CONFIRM) le ferait, et il est stubbé.
- ✅ **Pas de bascule** : tout est sur la branche `cockpit-v41`, derrière `/v4`, en attente du go d'Etoile.

---

## 8. COMMENT TESTER (gratuit, zéro dépense)

> À faire **après** que cette branche soit chargée par le bot (sur go d'Etoile — pas encore fait).

1. `/v4` → l'accueil 4 entrées s'affiche, avec le **bandeau d'état projet** en tête dès qu'un projet est ouvert.
2. **📸 PHOTO** → SOURCE → « ✨ Nouveau look » → « 💲 Lancer » (gratuit) → écran candidat **non ambigu**
   (3 états) → « ★ Définir comme média actif » → ⋯ Plus d'options (variante / livrable / varier / éditer).
3. **📊 Projet** (barre) → voir la hiérarchie complète : zones · paramètres · média actif · variantes · versions · livrables.
4. **Zones** (Paramètres → 🎯/👗/🌆/✍️) → verrouiller, choisir en biblio, **créer** (envoyer une valeur),
   enregistrer, **historique → restaurer**.
5. **✏️ Renommer** (📊 Projet) → envoyer un nom → le bandeau affiche le nouveau nom.
6. **FINALISER** → contrôle qualité (gate) → ☑ Image ☑ Vidéo → **📦 Livrables** → ouvrir un livrable
   (légende courte/longue/hashtags en blocs à toucher-pour-copier).
7. **🕘 RÉCENTS** → libellés lisibles + état lisible → rouvrir un projet (reprise exacte).

---

_Rapport généré pour Etoile — cockpit-v4.1, branche `cockpit-v41`. Lecture seule._

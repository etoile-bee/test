# PLAN DE CORRECTIONS — consolidé (avant figer)

> Doc seulement (2026-06-09), aucun code, aucun restart. Sources : `docs/EXIGENCES.md` (E1–E107),
> `docs/AUDIT_COMPLET.md`, `docs/RAPPORT_DETAILLE.md`, `docs/ARCHITECTURE_4SECTIONS.md`, journaux réels.
> Filet à chaque pas : backups `.preXXX`, mono-session, `node --check`, régressions
> `nodup 16 / feedback 15 / gallery 7 / nbphotos 7 / stalefix 8`, smoke `/go` `/menu`, petits commits, preuve.

---

## 1. Constat final T7 / T10 / T12 (confirmé code + journaux)

| Test | Attendu | Réel confirmé (preuve) | Cause | file:line | Prio |
|---|---|---|---|---|---|
| **T7a** Éditer depuis le menu | éditeur sur le look | ❌ menu KO · ✅ aperçu OK | `EDIT_HOME` n'appelle pas `setWorkPhoto` → `workSrc()` = raw/null ; l'aperçu `NL_EDIT` fait `setWorkPhoto(pose)` | `EDIT_HOME` 2322 · `NL_EDIT` 2446 · `editScreen` 1077 · `workSrc` 1500 | Élevée |
| **T7b** rester dans le bloc | édition en place | ❌ nouveau message · retour base ✅ | `editScreen` rend dans `cockpit.mid` (bloc vidéo) ≠ bloc photo `newlook.mediaId` | `editScreen` 1079 | Moyenne |
| **T10** Étape Look | s'affiche en création | ✅ Express/Auto (preuve 15:01:54 `CREER_EXPRESS`→15:01:57 `CL_KEEP`) · ❌ absente en Sur-mesure | `CREER_SURMESURE`→`openCard` contourne `showLookSource` | `CREER_SURMESURE` 1975→`openCard` 1099 · `showLookSource` 1415 | Élevée |
| **T12a** légende courte/longue | s'affiche | ✅ bouton + toggle (vidéo fraîche) | OK | `resKb` 1707 · `GF_LONG_` 2110 | — |
| **T12b** versions | versions | ❌ aucune (1 `caption.txt`) | pas de versionnage (E49) | `makeGenFolder` 1335 | Élevée |
| **T12c** après restart | accessible | ❌ « Introuvable » / legacy | `gfIdx` remappé / `gf.vidMid` null après restart | `genFoldersLoad` 1317 · `GF_LONG_` 2110 · `resKb` 1713 | Élevée |

_Note : T2 (anti-spam, 73 % messages non en place) et T4 (historique = liste texte au mauvais contenu) déjà **infirmés** au tour précédent._

---

## 2. Liste finale des corrections, par LOTS

| Lot | Exigences couvertes | Ce qu'il corrige concrètement | Risque |
|---|---|---|---|
| **L0 — Socle modulaire + Accueil/Nav** | E104, E105, E106, E107(amorce), E108, E109, **E111, E112**, E1, E2, E4, E62, **T7** | Registre de blocs + routeur central (strangler-fig) ; accueil 4 entrées 📸🎬🏛🕘 ; Stop/Restart visibles ; vocabulaire retour unifié ; **éditeur = module VIDÉO rendu dans le bon bloc** (règle T7a `setWorkPhoto` + T7b bon `mid`) ; début anti-spam en place (T2) | Moyen→Élevé (touche le cœur dispatch ; mitigé par cohabitation) |
| **L1 — Fidélité (pré-critique)** | E97, E98, E99, E102, E73 | Colorimétrie **neutre par défaut** (FX_DEFAULT, sans toucher `color_style.js` verrouillé) ; **retirer `[pause]`** du prompt script ; **réactions OFF** par défaut ; **état propre complet** (zoom/réactions/musique/durée/réf non hérités) | Faible→Moyen (réglages/prompt ; pas de fichier verrouillé) |
| **L2 — Gate QC anti-dépense** | E92, E82, E83, E84, E91 | **Gate QC identité sur l'image source AVANT le lipsync payant** (checklist + 🔄/🎨/✅) ; négatif anti-artefacts (GO Etoile) ; QC local en bonus | Moyen (insertion avant dépense ; testable à sec) |
| **L3 — Sur-mesure : étape Look** | T10, E7 | Brancher `showLookSource` dans Sur-mesure (ou choix explicite) ; modes Manuel/Auto cohérents | Faible |
| **L4 — Historique/projet + légendes** | T12, E49, E51, E53, E54, E45 | Historique en **grille + vignettes** (bon répertoire) ; réouverture/réédition ; **gfIdx stable après restart** (corrige T12c) ; légendes **éditables + versions** ; « Partie suivante » sur gens restaurées | Moyen |
| **L5 — CRUD looks / décors / références** | E16–E21, E23, E25, E26, E100, E101, E28–E34, E36 | Looks dupliquer/archiver/lock/restaurer/renommer ; décors CRUD + Lock Background ; références verrouiller/défaut + **bibliothèque taguée** ; prompts **dans le cockpit** (dup/suppr) ; planche-contact auto | Moyen (modules isolés grâce à L0) |
| **L6 — Projet unique / stockage / test-prod** | E93, E94, E95, E96, E55, E56, E59, E9 | `project.json` complet (raws+versions+prompts+métadonnées+logs+QC) ; stockage cloud persistant (remplacer tmpfiles) ; espaces TEST/PRODUCTION ; workflow de validation ; multi-persona branché | Élevé (état global, données) |
| **L7 — Nettoyage final** | E66, E3, E40, E14, E65 | Supprimer legacy (`MM_*`/`A_*`/`launch`/Shotstack/`showMainMenu`/`CARD_MORE`/`resSteps`) ; anglais résiduel ; label HD ; temps honnête ; rapport de session | Faible (mais **après** migration des blocs) |

---

>> **🎯 L0-2 = WORKFLOW À ÉTAT PERSISTANT (E114, critère d'acceptation)** : chaque étape migrée (look/image/script/montage/légende) est **backée par le brouillon actif** (slice par étape) ; back/forward/`/menu`/restart **sans perte** ; modifier une étape antérieure puis avancer **conserve l'aval** ; **remplacer les resets** (`gwReset`/`NL_NEW`) **par des recharges de slice**. Détail : `docs/ARCHITECTURE_4SECTIONS.md` §Persistance d'état bout-en-bout.

>> **🚦 E116 — GATE DE COHÉRENCE PARCOURS UTILISATEUR (obligatoire AVANT « prêt à tester », chaque incrément)** : ne pas empiler des correctifs locaux ; valider **contre l'architecture cible + le parcours global**, à la place de l'utilisateur. Dérouler chaque écran et répondre **OUI/NON + preuve** à la **grille des 9 questions** (① bloc unique · ② logique PHOTO→LOOK→IMAGE→(VIDÉO) · ③ étape visible · ④ projet visible · ⑤ réf active visible+persistante · ⑥ prompt actif visible+éditable · ⑦ retour sans perte · ⑧ reprise sans confusion · ⑨ pas de régression ailleurs). **Tout NON corrigé avant livraison ; 100% OUI requis.** Grilles : `docs/COHERENCE_PHOTO.md`, `docs/COHERENCE_VIDEO.md`. (réf. `docs/EXIGENCES.md` E116)

>> **🛡 E117 — GARDE-FOU ARCHITECTURE AVANT TOUT DÉVELOPPEMENT (gouvernance, EN AMONT)** : avant CHAQUE dev/refacto/correctif (pas après coup), valider la cohérence contre 1) l'architecture cible complète (4 sections, bloc unique, modularité E105/E106), 2) les audits (`AUDIT_COMPLET`, `RAPPORT_DETAILLE`), 3) les règles permanentes (E105–E116, fichiers verrouillés), 4) les retours utilisateurs réels accumulés, 5) le parcours complet PHOTO→LOOK→IMAGE→VIDÉO→Script→Montage→Légende→Export + le **mode automatique final** + l'**objectif TikTok et ses livrables**. **Questions pré-dev** : cohérent avec l'architecture / les audits / les décisions prises / le mode auto final / l'objectif TikTok ? **Conflit avec une règle existante ⇒ signaler la règle AVANT de développer, ne pas exécuter avant arbitrage.** E116 est un garde-fou EN AMONT, pas une checklist a posteriori. **Rôle : garant de l'architecture produit, pas exécutant du dernier ticket.** (réf. `docs/EXIGENCES.md` E117)

>> **⚠️ Décision de conception à valider avant de poursuivre L0 (E111)** : le routeur passe d'« édition en place du cockpit » à **3 modes** (`inplace` intra-tâche · `navigate` = nouveau bloc persistant · `ephemeral` = système auto-delete) + **registre d'ids par bloc**. Détail : `docs/ARCHITECTURE_4SECTIONS.md` §Réconciliation E109↔E111. Auto-save brouillon `/menu` (E110) à intégrer dès L0 ; vues 4 états + CRUD brouillon en L4/L6.

## 3. Ordre de priorité (séquence) + dépendances

1. **L0 — Socle modulaire + Accueil/Nav** 🆓 — *à faire en premier* : pose le registre+routeur (E107) dont **dépendent tous les lots suivants** ; règle T7, E104, E62, E1/E2/E4. Sans ce socle, les CRUD/projet ré-empileraient de la dette.
2. **L1 — Fidélité** 🆓 (vérif visuelle finale = 💲1 image éco) : colorimétrie/pause/réactions/état propre. Indépendant du socle → peut démarrer tôt ; **prioritaire** car affecte **chaque** rendu.
3. **L2 — Gate QC anti-dépense** 🆓 (test à sec ; protège les 💲 futurs) : avant tout test vidéo payant sérieux.
4. **L3 — Sur-mesure étape Look** 🆓 : petit, dépend de L0 (module look).
5. **L4 — Historique/projet + légendes** 🆓 (affichage) : dépend de L0 ; pré-requis partiel de L6.
6. **L5 — CRUD looks/décors/références** 🆓 (sauf génération de test) : dépend de L0 (modules).
7. **L6 — Projet/stockage/test-prod** 🆓 (conception) puis 💲 (validation bout-en-bout) : le plus lourd ; dépend de L4.
8. **L7 — Nettoyage final** 🆓 : **en dernier**, une fois les blocs migrés et validés (E107 étape 8).

**Gratuit vs payant** : L0, L3, L4, L7 = **100 % gratuits** (UI/refacto). L1, L2, L5 = gratuits à coder, **vérif finale = 1 image éco (~0,48 cr)**. L6 = conception gratuite, **validation = parcours vidéo complet (~13 cr + crédits Anthropic, actuellement épuisés)**. ⚠️ **Anthropic épuisé** → tout test impliquant script/vidéo est bloqué jusqu'à recharge.

---

## 4. Risques & impacts de la refacto E107 (strangler-fig)

### Risques concrets
- **Régressions pendant la cohabitation** routeur ↔ ancien `if(d===…)` : un callback capté par les deux, ou par aucun (trou) pendant la bascule.
- **État partagé mal isolé** : `cockpit.mid`, `newlook`, `genJob`, `genState`, `results`, `workingSource`, `HIGGS_AVATAR_URL`, `style.json`, `freshBloc/staleBloc` — un module qui lit/écrit un global en direct → effets de bord (mauvais message édité, params hérités).
- **Double rendu / message empilé** : deux chemins qui rendent le même bloc → spam (déjà 73 % hors-place, T2).
- **Ordre de migration** : migrer VIDÉO (le plus couplé, ~115 handlers) trop tôt = risque max.
- **Fichiers VERROUILLÉS** : `subtitle_style.js` (76/0.370) et `color_style.js` (V5) — **ne pas toucher** sans jeton `[UNLOCK-ETOILE]` ; la correction couleur (E97) passe par le **branchement** (`FX_DEFAULT`), pas le fichier verrouillé.
- **Restart pendant génération** : ne jamais redémarrer si une génération tourne (règle absolue).

### Mitigations
- **Cohabitation contrôlée** : `router.handle(d)` tenté en premier ; **fallback** sur l'ancien code tant qu'un bloc n'est pas migré (jamais les deux actifs pour un même bloc).
- **Un seul bloc à la fois** + **`ctx`** injecté (état+services) → aucun accès global direct ; critère « bloc migré OK » strict.
- **Régressions + smoke à CHAQUE pas** ; rien n'avance si rouge.
- **Suppression de l'ancien code seulement après validation visuelle d'Etoile** (rollback possible tant qu'il est là).
- **Backups `.preXXX`, mono-session, petits commits, journal** ; ordre sûr (Système→legacy mort→STUDIO→RÉCENTS→PHOTO→VIDÉO).

### Effort & durée (honnête)
- **L0** (socle) = le plus structurant : **plusieurs sessions** (poser registre/routeur + migrer Système/accueil + éditeur). C'est l'investissement qui rend tout le reste sûr et rapide.
- **L1/L2/L3** = courts (réglages, gate, 1 branchement) : ~1 session chacun.
- **L4/L5** = moyens : 1–2 sessions par domaine (modules isolés).
- **L6** = le plus lourd (`project.json` + stockage + test/prod + workflow validation) : **plusieurs sessions**, à étaler.
- **L7** = court mais à la fin.
- **Réalité** : ce n'est pas un sprint unique — c'est une **migration progressive sur plusieurs sessions**, un bloc validé à la fois. Le bénéfice : zéro réécriture brutale, le bot reste utilisable à chaque étape.

---

_Doc seulement — en attente du GO d'Etoile pour démarrer par L0 (maquette d'abord)._

---

## GOUVERNANCE DES LIVRAISONS — RÈGLES PERMANENTES (gravées 2026-06-10)

> Mise à jour majeure : **fin des micro-livraisons et des ajustements écran-par-écran.** Détail dans `docs/EXIGENCES.md` → **[[E118]]**, **[[E119]]**. État courant : **live = `7e24dac`** (rollback) ; **cible = `docs/DESIGN_CIBLE_COMPLET.md` v3**, en attente de **gel par Etoile**.

### E119 — Méthode de livraison UNIQUE cohérente (séquence imposée)
1. **Design cible FINAL validé (figé)** par Etoile →
2. **Implémentation COMPLÈTE** (pas de partiel) →
3. **Audit complet** →
4. **Auto-tests complets** ([[E118]]) →
5. **LIVRAISON UNIQUE** cohérente →
6. **PUIS** campagne de tests utilisateurs.

### E118 — Protocole qualité AVANT chaque livraison (12 étapes, rigueur « filtre couleur »)
audit complet · parcours **PHOTO** complet · parcours **VIDÉO** complet · test **bibliothèques** · test **Historique** · test **Prêt-à-poster** · test **reprise projet** · test **propagation média** · **recherche de régressions** · **rapport** des anomalies · **corrections** · **nouvelle validation**. **Objectif : zéro régression évidente découverte par Etoile après livraison.**

### Gate de livraison (à cocher)
- ☐ Cible v3 **figée** par Etoile (préalable E119).
- ☐ Implémentation complète (aucun TODO structurel).
- ☐ 8 tests fonctionnels E118 au vert (PHOTO · VIDÉO · bibliothèques · Historique · Prêt-à-poster · reprise · propagation média · régressions).
- ☐ Rapport des 12 étapes joint.
- ☐ `node --check` OK · suites de régression au vert · smoke `/menu` `/go`.
- ☐ Livraison unique, **puis** tests utilisateurs.

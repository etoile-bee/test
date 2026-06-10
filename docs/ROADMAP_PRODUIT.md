# ROADMAP PRODUIT — par vision (4 piliers)  ·  **PROVISOIRE — à figer après la campagne de validation**

> Réorganisée par **vision produit** (validée par Etoile, 2026-06-10). **Statut : PROVISOIRE.** L'ordre n'est **figé qu'après** `docs/CAMPAGNE_VALIDATION.md`.
> **Aucune migration / aucun hotfix tant que la campagne n'est pas close et l'ordre figé** — y compris B1 et F13 (ils sont en **Phase 0**, qui ne s'exécute qu'APRÈS validation).
> Garde-fou **E117** appliqué : on valide contre l'architecture cible complète + la projection produit (Cockpit, Mémoire métier/Studio, Moteur de production, Mode automatique). Inventaire : `docs/FRONTIERES_LEGACY.md` · priorisation : `docs/PRIORISATION_PRODUIT.md`.

## Principe directeur (inscrit)
**Un cockpit cohérent, stable et testable AVANT le moteur automatique.** Ordre guidé, dans l'ordre, par :
1) **cohérence du cockpit** (zéro clic qui sort, zéro perte de contexte) →
2) **mémoire métier** (source de vérité unique looks/références/historique/médias) →
3) **moteur de production / mode auto** (PHOTO→VIDÉO→EXPORT→LIVRABLE) →
4) **dette résiduelle**.
*Cet ordre DIFFÈRE de l'ordre techniquement le plus simple : **F3 est rétrogradé en Phase 3**, **F2 en Phase 4** — parce que la priorité produit est la stabilité ressentie du cockpit avant la fondation moteur.*

## Les 4 piliers
- **Pilier A — COCKPIT UNIQUE** : tout se passe dans un seul bloc, navigation cohérente, contexte permanent.
- **Pilier B — MÉMOIRE MÉTIER (Studio)** : looks, références, décors, personas, médias, historique, modèles = source de vérité unique.
- **Pilier C — MOTEUR DE PRODUCTION / MODE AUTO** : génération réelle PHOTO→VIDÉO→EXPORT→LIVRABLE, reprise, auditabilité.
- **Pilier D — DETTE** : suppression du code mort / doublons / commandes.

## Phases (ordre validé par Etoile — PROVISOIRE)

| Phase | Intitulé | Frontières | Pilier | Objectif produit |
|---|---|---|---|---|
| **0** | Correctifs immédiats | **B1, F13** | A | Supprimer les irritants visibles (image en bloc texte ; messages techniques pleins → toast). |
| **1** | Cockpit unique | **F1, F12** | A | **AUCUN clic ne sort du cockpit principal.** Tant que non résolu, les tests sont biaisés. |
| **2** | Mémoire métier | **F4, F5, F10, F15** | B | Source de vérité unique : looks / références / historique / médias entrants. |
| **3** | Suppression des chemins alternatifs | **F3, F17** | A/B | Éliminer doublons & parcours concurrents (NL_NEW, pop-up réglages). |
| **4** | Fondations mode auto | **F2, F11** | C | PHOTO→VIDÉO→EXPORT→LIVRABLE branché sur `proj` ; base du mode automatique. |
| **5** | Studio avancé | **F6, F7, F8, F9** | B | Modèles, décors, personas, médias (CRUD, multi-persona). |
| **6** | Dette résiduelle | **F14, F16, F18** | D | Commandes doublons, ancien flux anglais `MM_*` (suppression), menus annexes. |

## Pourquoi cet ordre (rappel produit)
- **Phase 0–1 d'abord** : l'éditeur (F1) et les retours legacy (F12) sont ce qui casse le plus le contexte ; sans cockpit stable, **toute campagne de test est biaisée**.
- **Phase 2 ensuite** : le cockpit a besoin d'une **mémoire métier fiable** (d'où viennent looks/réf/historique) avant d'industrialiser.
- **Phase 3** : une fois le cockpit + la mémoire en place, on **coupe les parcours concurrents** (F3/F17) sans casser l'usage.
- **Phase 4** : seulement alors on bâtit le **moteur/auto** (F2/F11) sur une base saine.
- **Phase 5–6** : finitions Studio puis nettoyage de dette.

## Critères de passage de phase (E116/E117)
Chaque phase n'est « faite » que si : grille des 9 questions **100% OUI** sur les écrans touchés · régressions vertes (16/15/7/7/8 + ws 6/6 + vidéo 7/7 + router 20/20) · campagne de validation re-passée sur le périmètre · restart sûr.

---

_Roadmap PROVISOIRE — figée seulement après `docs/CAMPAGNE_VALIDATION.md`. Aucune exécution avant arbitrage final d'Etoile. — 2026-06-10_

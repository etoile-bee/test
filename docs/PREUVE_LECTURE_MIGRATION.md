# Preuve de lecture migration — 4 niveaux par lecteur (avant/après) + convergence globale

> **Read-only. Aucune écriture/copie/suppression.** Chiffres simulés sur la VRAIE base (`tools/preuve_lecture_finale.js`).
> 4 niveaux : **Trouvé physique** (fichiers disque) ≥ **Lisible** (le lecteur sait le lire) ≥ **Affichable** (passe filtres : dédup/raw/sim/taille) = **Affiché** (avec pagination : plus de plafond à 9).
> Décisions Etoile (provisoires) appliquées : projectId brut · `podcast-looks/projets/<persona>/<projet>` · vidéos legacy laissées dans podcast-outputs · **copie physique**.

## Tableau par lecteur

| Lecteur | Sources lues | Trouvé physique | Lisible | Affichable | Affiché (paginé) | Raison des écarts | Statut |
|---|---|---|---|---|---|---|---|
| **Galerie AVANT** | projects_r/*/photo_* · outputs/generations · looks **gen_*** | 168 | 100 | 100 | **100** | trouvé→lisible : `looks` limité à `gen_*` (patrimoine `IMG_*` NON lu = invisible) ; lisible→affichable : dédup basename + taille>1 Ko ; affichable=affiché (pagination) | 🟡 patrimoine invisible |
| **Galerie APRÈS** | + **looks (TOUTES images)** + **podcast-looks/projets/**/Photos** | 168 | **162** | **162** | **162** | `looks` élargi → +62 images patrimoine deviennent lisibles ; dédup ; pagination atteint tout | ✅ |
| **Historique vidéo AVANT** | outputs/*.mp4 · outputs/generations/** · projects_r/*/*.mp4 | 514 | 211 | 117 | **117** | lisible = extension vidéo ; **86 raws** (`_raw_`) filtrés (intermédiaires) + ~8 doublons → 117 | ✅ |
| **Historique vidéo APRÈS** | + **podcast-looks/projets/**/Vidéos** | 514 | 211 | 117 | **117** | identique (0 vidéo v4r aujourd'hui ; legacy 117 intactes) | ✅ 117=117 |
| **Récents** | projects_r/<persona>/* (base vivante) | 112 | 112 | 112 | **112** (paginé) | base = source de vérité ; pagination 13 pages | ✅ |
| **Archives** | projects_r (statut archivé) | 1 | 1 | 1 | **1** | — | ✅ |
| **Recherche projet** | projects_r (id/nom) + dossier podcast-looks/projets/<id> | 112 | 112 | 112 | **112** | — | ✅ |
| **Fichiers du projet** | médias du projet courant + (après) podcast-looks/projets/<id>/** | par projet | = | = | = | per-projet : tous ses fichiers copiés physiquement (autonome) | ✅ après copie |

**Avant ≤ après pour CHAQUE lecteur** : Galerie 100 → **162** (+62) ; Vidéo 117 = **117** ; Récents/Archives/Recherche inchangés (base). → **aucun média perdu, aucun rendu invisible** ; gain net de visibilité (+62 patrimoine).

## Pagination : « Affiché » = « Affichable » (plus de plafond 9)
La pagination (◀ Précédent / Suivant ▶) rend **tout** atteignable : les **162** images, les **117** vidéos, les **112** projets sont accessibles page par page (≈ 18 pages images, 13 pages vidéos, 13 pages projets). Aucun élément bloqué au-delà de la 9ᵉ vignette.

## Les 318 médias inter-projets → copie physique par projet
Sur 619 références réelles : **own 14 · cross 318 · externe 287**. Beaucoup pointent un fichier hébergé dans un AUTRE projet (réutilisation galerie). **Règle** : on suit `media.file` jusqu'au fichier réel et on le **copie physiquement** dans `podcast-looks/projets/<persona>/<projet-utilisateur>/Photos|Vidéos`. → chaque projet est **autonome** (aucune dépendance à un autre).
**Total de copies physiques (dédup par projet) : 279.** Une source réutilisée par N projets est dupliquée N fois (duplication assumée pour la durabilité). 0 fichier manquant.

## Résultat global + CONVERGENCE (écarts expliqués)

| Indicateur | Valeur | Note |
|---|---|---|
| Projets (base vivante) | **112** (23 avec média) | source de vérité |
| Photos — références (base) | **618** | beaucoup réfèrent le même fichier (choix galerie) |
| Photos — distinct visible (galerie) | **162** | dédup par nom → écart 618 vs 162 = doublons de référence (expliqué) |
| Photos — copies physiques (archive) | **279** | dédup PAR projet, duplication inter-projets (expliqué) |
| Vidéos visibles (historique) | **117** | legacy iCloud (86 raws exclus) |
| Scripts (projets) | **2** | `draft.video.script` |
| Références | **1** | `imany_reference` |
| Fichiers VISIBLES cockpit | **162 img + 117 vid + 112 projets** | tout atteignable par pagination |

**Chaîne de convergence** : base vivante (112 projets / 618 refs) → podcast-looks (279 copies physiques, par projet) → galerie (162 distinct) → historique (117 vidéos) → Telegram (rendus persistants par génération). Les écarts 618↔162↔279 sont **uniquement** des effets de **déduplication** (galerie : par nom ; archive : par projet) et de **références partagées** — **aucun fichier perdu** (0 manquant à tous les niveaux).

## VERDICT (par ligne ci-dessus + global)
- Aucun média perdu : ✅ (trouvé après ≥ avant partout)
- Aucun média invisible : ✅ (+62 patrimoine rendu visible ; pagination atteint tout)
- Vidéos legacy intactes : ✅ (**117 = 117**)
- Pagination complète : ✅ (affiché = affichable)
- Regroupement par projet : ✅ (copie physique par projet, autonome)
- 318 inter-projets rattachés : ✅ (**279 copies physiques**, chaque projet utilisateur a la sienne)
- **GLOBAL : ✅ migration sécurisée** — chiffres convergents, écarts expliqués (dédup/refs partagées/raws), zéro perte.

> ⚠️ Le seul point qui exige la migration pour passer à ✅ : **Galerie « patrimoine `IMG_*` »** (aujourd'hui 🟡 invisible car `looks` lit `gen_*`). L'élargissement du glob (partie de la migration, même mécanisme) le résout → +62 visibles. Tout le reste est déjà ✅ aujourd'hui.

**Rien n'est copié/écrit. En attente du GO d'Etoile sur ce tableau.**

# Document de conformité — Lot fiabilisation (nuit) — branche `terrain-lot-5p`

Référence unique. Statut par point : ✅ conforme · 🔧 en cours · ⚠️ anomalie · □ non commencé.
Base prod : `5ce809e`. HEAD pile : voir `git log`. Sweep courant : voir `tools/test_v4r_*.js`. Audit parcours : `tools/audit_parcours.js`.

## Demandes Etoile (A → P)
| # | Point | Statut | Preuve |
|---|---|---|---|
| A | Génération : UN seul statut « en cours » (photo+vidéo) | ✅ | test_v4r_genstatus 7/0 |
| B | Panneau Sous-titres toujours complet (Police/Taille/Hauteur/Modèle) ; entrées unifiées | ✅ | test_v4r_scriptpick 8/0 |
| C | Découvrabilité Tenue/Décor/Influences dans le parcours photo | ✅ | test_v4r_photolayers |
| D | Tenue/Décor défaut = image de base + « Désactiver » explicite | ✅ | test_v4r_photolayers 9/0 |
| E | Libellés non tronqués en plein mot (helper _shortLbl) | ✅ | test_v4r_scriptpick |
| F | Actions séparées des catégories (script) | ✅ | test_v4r_scriptpick |
| G | Photo·Choisir : pas « aucune photo » si source active | ✅ | test_v4r_photolayers |
| H | Aperçu : indicateur Influences = réalité (✓ si valeur+activée) | ✅ | test_v4r_photolayers |
| I | Ergonomie 2/ligne + action primaire pleine largeur partout | ✅ | audit_parcours / screens |
| J | Génération « en cours » update ~3 min (legacy) + timeout | ✅ | test_v4r_lot5r 18/0 |
| K | Vidéo 9:16 : width/height (ffprobe, repli 720×1280) + thumb sur TOUS les sendVideo | ✅ | test_v4r_lot5r |
| L | Écran final vidéo : Lég. courte/longue copiables + Partie 2/3 + Refaire vidéo | ✅ | test_v4r_lot5r + runtime + screens |
| M | Retrait « Éditer légendes » + ligne « # Hashtags » séparée | ✅ | test_v4r_lot5r |
| N | Boutons inutiles retirés + positions (2/ligne) | ✅ | audit_parcours |
| O | Légendes legacy : courte ≈2 phrases ≠ longue développée, +# fusionnés | ✅ | test_v4r_lot5r |
| P | Carte connexion reposée (boot + inactivité ~20 min + entrées) ; persistante | ✅ | test_v4r_connectgate 9/0 + test_v4r_connectcard 7/0 |

## Demandes antérieures (rappels, toujours conformes)
| # | Point | Statut |
|---|---|---|
| 1' | Quota de tests ENTIÈREMENT supprimé ; garde-fou coût + double-confirm conservé | ✅ |
| #2 | Légendes auto rétro + hashtags fusionnés + bouton Hashtags retiré | ✅ |
| #3 | « pause »/« [pause] » invisible (script affiché, sous-titres, légendes) | ✅ |
| #5 | Modèle sous-titres défaut (inclut hauteur collier 0.370) | ✅ |
| #6 | Fichiers : RAW + lég courte/longue + Refaire vidéo | ✅ |
| #7 | Recherche vidéo inter-projets + ouvrir projet | ✅ |
| #8 | Cloud par CODE PROJET (RAW inclus, remontée workflow) | ✅ |
| script complet | Régénérer/changement de thème = VRAI script (plus de stub simulé) | ✅ |
| carte persistante | R0_RESUME/R0_RESUME_HOME laissent la carte intacte | ✅ |
| RG-7 | Numéro de projet « Projet n°N » partout | ✅ |
| plateformes | TikTok/IG/YT retirés (panneau « Légendes ») | ✅ |

## Parcours × 6 questions utilisateur — `node tools/audit_parcours.js`
19 écrans, **AUCUN ÉCART** (Q1 où suis-je · Q2 photo active · Q3 clics clairs · Q4 revenir sans perdre · Q5 retrouver fichiers · Q6 publier).

## Garde-fous (invariants)
- subtitle_style.js / color_style.js : JAMAIS modifiés (verrous) ✅
- Source active unique · zéro démo cuir · reprise après restart · médias jamais perdus (réconciliation disque) ✅
- Déploiement délibéré uniquement (checkout + restart contrôlé) · migration cloud `--apply` séparée ✅

## Méthode d'audit nuit
Boucle : sweep complet (`tools/test_v4r_*.js`) + `audit_parcours.js` + balayage anomalies (libellés tronqués, rangées >2, grilles, états vides) ; à chaque anomalie trouvée -> corrigée + test ajouté ; re-passe à regard neuf jusqu'à zéro écart. Aucun déploiement sans GO.

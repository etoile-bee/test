# AUTO-AUDIT E118 COMPLET — cockpit-v4 (parité Option B) — avant bascule unique

> **Périmètre.** cockpit-v4 = nouveau cockpit complet (moteur projet + parcours + génération protégée + bibliothèques + livrables), monté **derrière `/v4`** (strangler-fig E107), **flux par défaut intact**. Branche `cockpit-v4`, base `7e24dac`. **Aucun déploiement, aucune dépense.**
> **Méthode.** Audit logique exhaustif : **18 suites de tests automatisés, 0 KO** (dont parcours E2E PHOTO→VIDÉO + test d'étanchéité inter-projets E124). Le réel-Telegram bout-en-bout = **campagne de tests à la bascule** (impossible sans déployer).

## 1. Les 12 étapes E118
| # | Étape | Résultat |
|---|---|---|
| 1 | Audit du code | ✅ 14 modules `ui/*` + montage `/v4` ; `node --check` tout OK |
| 2 | Parcours PHOTO complet | ✅ e2e + q9 (source→garder→params→QC→finaliser) |
| 3 | Parcours VIDÉO complet | ✅ e2e + q9 (image→plans→script→QC→confirm coût→prêt-à-poster) |
| 4 | Bibliothèques | ✅ lib + libstore (consult≠modif, CRUD, A3 rollback) |
| 5 | Historique | ✅ vues filtrées source-unique E121 |
| 6 | Prêt-à-poster | ✅ file ; publié sort, reste en Historique (lot567) |
| 7 | Reprise projet | ✅ controller/integration/e2e (restart → tout retrouvé) |
| 8 | Propagation média | ✅ média gardé = actif propagé (controller/e2e) |
| 9 | Recherche régressions | ✅ 18 suites 0 KO ; flux défaut intact (v4active=false) |
| 10 | Rapport anomalies | ✅ §3 |
| 11 | Corrections | ✅ §3 |
| 12 | Nouvelle validation | ✅ sweep final 18/18 |

## 2. Couverture fonctionnelle (lots + 9 comportements + arbitrages)
| Domaine | Statut | Preuve |
|---|---|---|
| Lot 1 — génération **protégée** (confirmation coût avant toute dépense) | ✅ | controller, q9, q2 |
| Lot 2 — CRUD biblios + **A3 rollback** (pricing/règles jamais touchés) | ✅ | libstore 18, q45 |
| Lot 3 — planche **1/2/3/4/6 séparées** + vue contact | ✅ | lot34 |
| Lot 4 — édition image **per-projet** (E124) | ✅ | lot34, étanchéité |
| Lot 5 — suivi/abort | ✅ | lot567 |
| Lot 6 — publication (A5 : statut, sort de file, reste Historique) | ✅ | lot567 |
| Lot 7 — cloud (A6 : médias locaux, projet survit aux URLs temp) | ✅ | lot567 |
| Lot 8 — coûts réels (panneau avant dépense) | ✅ | cost 11 |
| Q1 décor figé/look variable · Q2 varier prompt · Q4 versions/restore · Q5 préréglages · Q7 durée/coût · Q9 planche→vidéo | ✅ | q2, q45, q9, e125_d2 |
| D1 sous-titres (override projet, hors fichier verrouillé) · D2 durée→plans+alerte · D3 maquette (modèle) | ✅ store/logique | e125_d2, q9 |
| E125 dossier livrable autonome · E124 étanchéité · E123 3 états | ✅ | e125_d2, étanchéité, q9 |

## 3. Anomalies trouvées par l'auto-audit + corrections (rigueur « filtre couleur »)
| Anomalie | Correction | Re-test |
|---|---|---|
| Photo finaliser sortait le projet de « en cours » (cassait A) | photo finaliser ne change plus le statut projet | ✅ |
| Sélection d'image sautait des étapes (resumeStep en navigation) | `returnStep` explicite | ✅ |
| `deps.now` (fonction) passé comme timestamp | `nowv()` | ✅ |
| Tests post-confirmation (SRC_NEW→GEN_CONFIRM) | suites mises à jour | ✅ |
| `cbs(pl)` au lieu de `cbs(pl.render)` (test) | corrigé | ✅ |

## 4. Conformité E1→E126 (réelle, honnête)
**Légende** : ✅ conforme cockpit-v4 (testé) · 🟦 préservé (legacy/verrouillé intact) · 🟧 **à brancher au RUN de bascule** (dépense réelle) · ⬜ N/A.

| Exigences | Statut | Note |
|---|---|---|
| E1 cockpit unique · E2 photo↔vidéo · E5 état · E6 reprise · E41 connexions | ✅ | bloc unique, modèle (A), restart-test |
| E3 style court · E4/E108 nav · E62 stop/restart/aide | ✅ | en-tête 1 ligne, barre Valider/Retour/Accueil |
| E7 Manuel / **Auto** | ✅ manuel · 🟧 Auto | shell compatible Auto (C5), Auto = chantier ultérieur |
| E8 aperçu=réalité · E13/E58 maquette/restyle gratuit · D3 | ✅ modèle · 🟧 binding render | maquette locale €0 (render_local au run) |
| E9 multi-persona | ✅ | persona partout |
| E10-E14 coûts avant dépense | ✅ | panneau + confirmation (Lot 8) |
| E15-E23 looks · E24-E27 décors · E28-E34 prompts · E100-E101 réf (CRUD) | ✅ | libstore (A3 décors), corbeille réversible |
| E35 nb · E36 planche · E37 sélection · E38 éditer · E39 image brute | ✅ | view + transport raw |
| E42 chaîne voix/lipsync/rendu | 🟦/🟧 | moteur préservé ; **binding réel au run** (gated QC) |
| E44/E45 durée/plans · E46 script · E47/E48 | ✅ durée/plans/script · 🟧 anti-rép/hooks | adaptMontage (D2), génération script au run |
| E49-E51 légendes | ✅ structure (courte/longue/tags dans livrable) · 🟧 génération | E125 |
| E52-E57 sauvegarde/historique/réouverture/projet réouvrable/brouillons | ✅ | dossier projet autoporteur + statuts + versions |
| E58 restyle gratuit · E59 publication TikTok · E94 cloud | 🟧/🟦 | restyle local ; **TikTok auto hors lot (A5)** ; iCloud + survie médias locaux (A6) |
| E60 suivi · E61 abort | ✅ | gen_status + GEN_ABORT (binding proc au run) |
| E63 journal · E64 erreurs · E65 traçabilité · E66 un flux | ✅ | historique_versions + jlog ; shell unique |
| E67/E69/E70/E97 render/son/réf/colorimétrie | 🟦 | **fichiers verrouillés intacts** |
| E71-E73 méthode/filet/fidélité | ✅ | design d'abord, tests, commits |
| E74-E91 identité/anatomie (critères) · E90 preuve | 🟦 critères · 🟧 détection auto | gate humain E92 câblé |
| E92 GATE QC avant dépense | ✅ | recordQC + actions ; bloque finaliser sans QC (testé) |
| E93 dossier complet · E125 dossier livrable | ✅ | manifest autoporteur + buildDeliverable (complet) |
| E95/E96 test/prod + validation | ✅ | statut_qualite + gate QC |
| E98 sans pause · E99 réactions OFF · E102 état propre | ✅ E102 · 🟧 E98/E99 (génération) | nouveau projet neutre (étanchéité) |
| E103-E107 priorité/accueil/modulaire/strangler | ✅ | 4 entrées E104, modules, montage strangler |
| E108-E117 nav/brouillons/cohérence/gouvernance | ✅ | Valider, en-place, garde-fous, grilles 9Q/garde-fou |
| E118 protocole · E119 livraison unique · E120/E126 conformité/arbitrage | ✅ | ce process + registre ZONES_GRISES |
| E121 source unique · E122 garde-fou UI · E123 livrables · **E124 étanchéité** | ✅ | tests dédiés (controller/lib/store + **étanchéité 10/10**) |

## 5. VERDICT
- **Parité construite et testée au niveau logique/UX/données** : 18 suites, 0 KO ; tous les lots + 9 comportements + D1/D2/D3 + E121–E126 couverts ; **garde-fous tenus** (dossier=vérité, bloc unique, étanchéité inter-projets, livrables explicites, fichiers verrouillés intacts, zéro dépense).
- **Seul restant = le BINDING DES BACKENDS RÉELS payants** (image Seedream / vidéo Kling/voix / maquette render / injection sous-titres au rendu) — **gated par confirmation+QC**, **première exécution = le RUN DE BASCULE avec Etoile** (ne peut être exécuté ici sans dépenser/déployer). C'est le point que la campagne de tests validera.
- **Recommandation** : procéder à la **bascule de test** (`/v4`) avec Etoile pour exécuter un **premier run réel encadré** (1 image éco d'abord, E12), valider la chaîne de bout en bout, puis basculer cockpit-v4 en défaut + retrait progressif du legacy (strangler-fig).

## 6. PROCÉDURE DE BASCULE (au go d'Etoile)
1. **Brancher les backends réels** dans le factory `/v4` (generateLook image · workflow.js vidéo · render_local maquette · hook sous-titres) — derrière la confirmation+QC déjà en place. (Étape de code dédiée, courte, à faire juste avant le run.)
2. `git checkout fix/root-causes-v1 && git merge --ff-only cockpit-v4` + `pm2 restart`.
3. Test encadré via **`/v4`** : 1 image **éco** (dépense minimale, E12) → valider → vidéo 1 plan → valider. Vérifier : bloc unique, étanchéité, dossier livrable, prêt-à-poster.
4. Rollback trivial : `/menu` (sortie immédiate) ou redéploiement `7e24dac`.
5. Si validé par Etoile : cockpit-v4 par défaut + dépréciation legacy par blocs (E107), nouvel auto-audit E118 à chaque bloc retiré.

_Rien n'est déployé. Live `7e24dac` intact. Fichiers verrouillés intacts. Aucune génération payante._

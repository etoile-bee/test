# AUTO-AUDIT E118 — cockpit-v4 (avant bascule)

> **Périmètre.** cockpit-v4 = **nouveau cockpit (SHELL)** : moteur projet (dossier/manifest), grammaire (A), bloc unique, gates, vues, bibliothèques, livrables — monté **derrière `/v4`** (strangler-fig E107), **flux par défaut intact**. Branche `cockpit-v4`, base `7e24dac`. **Aucun déploiement, aucune génération payante.**
> **Méthode.** Le réel-Telegram bout-en-bout = **campagne de tests à la bascule** (impossible sans déployer). Ici : audit au niveau **logique** via 166 tests automatisés (dont un parcours E2E PHOTO→VIDÉO simulé) + revue de conformité E1→E123 + chasse aux régressions.

---

## 1. Les 12 étapes E118

| # | Étape | Résultat |
|---|---|---|
| 1 | Audit du code touché | ✅ 10 modules `ui/*` + montage `telegram_bot.js` (3 éditions contenues), `node --check` OK |
| 2 | Parcours PHOTO complet | ✅ `test_cockpit_e2e` (source→garder→paramètres→finaliser→QC) |
| 3 | Parcours VIDÉO complet | ✅ `test_cockpit_e2e` (phase vidéo : source auto→script→finaliser→prêt-à-poster) |
| 4 | Test bibliothèques | ✅ `test_cockpit_lib` (consult≠modif, sélection explicite, retour exact) |
| 5 | Test Historique | ✅ `test_project_store`/`lib` (mémoire complète, vue filtrée E121) |
| 6 | Test Prêt-à-poster | ✅ file ; publié reste dans Historique (`project_store`/`e2e`) |
| 7 | Test reprise projet | ✅ `controller`/`integration`/`e2e` (restart → média actif + étape retrouvés) |
| 8 | Test propagation média | ✅ média gardé = média actif propagé (`controller`/`e2e`) |
| 9 | Recherche de régressions | ✅ 166 tests 0 KO ; flux par défaut intact (diff additif, `v4active=false`) |
| 10 | Rapport d'anomalies | ✅ §3 ci-dessous |
| 11 | Corrections | ✅ §3 (toutes corrigées + re-testées) |
| 12 | Nouvelle validation | ✅ sweep final 166/166 |

**Suites (166 tests, 0 KO)** : project_store 32 · flow 21 · block 11 · view 23 · lib 15 · controller 26 · transport 15 · integration 7 · e2e 16.

## 2. Anomalies trouvées pendant l'auto-audit + corrections (rigueur « filtre couleur »)
| Anomalie | Cause | Correction | Re-test |
|---|---|---|---|
| Photo finaliser sortait le projet de « en cours » | `statut_qualite='production'` posé en phase photo → `currentProject` ne le trouvait plus → (A) cassé | photo finaliser ne change plus le statut projet (seule la vidéo finalise) | ✅ controller/e2e |
| Sélection d'image sautait des étapes | `applyUpstream` repositionnait via `resumeStep` pendant la navigation active | `returnStep` explicite (reste sur l'étape) | ✅ controller |
| `deps.now` (fonction) passé comme timestamp | confusion valeur/fonction | `nowv()` résout la valeur | ✅ controller |
| Image rejetée pouvait suivre | — (prévenu by design) | `setImageOutcome` : rejetée/variante → trace, jamais livrable | ✅ store/e2e (E123) |

## 3. Conformité E1→E123 (honnête)
**Légende** : ✅ **conforme** (cockpit-v4, prouvé par test) · 🟦 **préservé** (moteur/legacy intact, hors périmètre du shell, fichiers verrouillés inclus) · 🟧 **à brancher** (fonctionnalité à connecter dans le shell avant parité complète) · ⬜ N/A.

| Exigences | Statut | Justification / preuve |
|---|---|---|
| E1 cockpit unique · E2 photo↔vidéo · E4 nav · E5 état · E6 reprise | ✅ | block/integration/e2e ; modèle (A) ; restart-test |
| E3 style court | ✅ partiel | en-tête 1 ligne, boutons courts (`view`) ; fignolage libellés à la bascule |
| E7 Manuel / Auto | ✅ manuel · 🟧 Auto | C5 : shell **compatible Auto** (moteur pilotable), Auto construit ensuite |
| E8 aperçu=réalité | ✅ aperçu permanent · 🟦 fidélité rendu | preview permanent ; rendu réel = moteur existant |
| E9 multi-persona | ✅ | `persona` dans tout le store |
| E10-E14 coûts avant dépense | ✅ panneau coût · 🟧 estimation réelle/maquette | `view` finaliser (cr≈€) + **gate QC avant dépense** ; chiffrage exact à brancher |
| E15-E23 looks CRUD | 🟧 | consultation + application explicite ✅ ; modif/dupliquer/supprimer/archiver/lock **à brancher** |
| E24-E27 décors · E28-E34 prompts (CRUD) | 🟧 | entrées STUDIO présentes ; CRUD complet à brancher |
| E35 1/2/3 · E37 sélection · E39 image brute | ✅ | `view` NB / E123 garder-livrable / transport raw |
| E36 planche · E38 éditer image | 🟧 | boutons présents ; rendu planche + éditeur image à brancher |
| E40 redirections · E41 connexions · E43 transverses | ✅ | routage controller ; (A) |
| E42 chaîne voix/lipsync/rendu | 🟦/🟧 | **moteur existant préservé** ; branchement derrière gate QC à la bascule (stub gratuit en v4) |
| E44/E45 durée/parties · E46 script · E47/E48 · E49-E51 légendes | 🟧 | lignes présentes (durée/script) ; édition/génération/légendes-grille à brancher |
| E52 retrouvable · E53 historique grille · E54 réouverture · E55/E56 projet réouvrable | ✅ | dossier projet autoporteur ; `lib`/`OPEN_` |
| E57 prêt-à-poster/brouillons | ✅ | statuts + vues filtrées |
| E58 restyle gratuit · E59 publication TikTok · E94 cloud | 🟧 | à brancher (legacy/infra) |
| E60 suivi · E61 abort | 🟧 | à brancher |
| E62 stop/restart tête | ✅ | `actionBar` (Stop/Restart/Aide) ; restart silencieux (cible) |
| E63 journal · E65 traçabilité | ✅/🟦 | `historique_versions` + jlog/uiLog legacy intacts |
| E64 erreurs claires | ✅ partiel | notice→toast ; messages métier |
| E66 un seul flux | ✅ (cible) | shell unique destiné à remplacer les 3 flux legacy |
| E67/E69/E70/E97 render/son/réf/colorimétrie | 🟦 | **fichiers verrouillés intacts** (non touchés) |
| E68 | ⬜ | supersédé par E97 |
| E71 maquette · E72 filet · E73 fidélité | ✅ | process (design d'abord, tests, commits) |
| E74-E89 identité/anatomie (critères) | 🟦 critères · ✅ gate | critères = QC ; **gate E92 câblé** (QC avant dépense) |
| E90 preuve visuelle · E91 gate final · E92 gate QC source | ✅ E92/E91 · 🟧 E90 auto | `recordQC` + actions Régénérer/Éditer/Valider ; détection auto/preuve = à brancher |
| E93 dossier complet | ✅ quasi-complet | manifest autoporteur (réf/look/prompts/scripts/légendes/params/coûts/moteur/raws/rapport QC/versions) ; raws remplis à la génération réelle 🟧 |
| E95/E96 test/prod + validation | ✅ | `statut_qualite` test/production + gate QC + validation |
| E98 script sans pause · E99 réactions OFF · E100/E101 référence+biblio | 🟧 | à brancher (génération/biblio réf) |
| E102 état propre | ✅ | nouveau projet = manifest neuf, zéro réapplication auto |
| E103 priorité · E104 4 entrées · E105/E106/E107 modulaire/strangler | ✅ | `view.home` (4 entrées) ; modules + montage strangler |
| E108-E117 nav/brouillons/gouvernance | ✅ | Valider (C1), en-place, garde-fous ; brouillons→statuts projet |
| E118 protocole · E119 livraison unique · E120 conformité | ✅ | ce document |
| E121 source unique · E122 garde-fou UI · E123 livrables | ✅ | tests dédiés (controller/lib/store/e2e) |

## 4. VERDICT HONNÊTE (E118/E120)
- **Le SHELL cockpit-v4 est sain et prouvé** : architecture (A), bloc unique (fin F1), dossier projet source de vérité, gates média réel, garde-fous E121/E122, livrables explicites E123, parcours PHOTO→VIDÉO E2E — **166 tests, 0 KO**. Invariants d'Etoile respectés.
- **Ce n'est PAS encore la parité fonctionnelle à 100 %** : plusieurs exigences **fonctionnelles** sont **préservées en legacy** (render/son/réf verrouillés, voix/lipsync) ou **à brancher** dans le shell (CRUD looks/décors/prompts complet, légendes-grille, planche, édition image, suivi/abort, publication TikTok, stockage cloud, estimation coût exacte, génération réelle derrière le gate QC). **La conformité « 100 % » au sens FONCTIONNEL ne peut donc pas être déclarée maintenant** — je le remonte (E120) plutôt que de cocher faussement.

## 5. ARBITRAGE à trancher (E120) — choix de bascule
- **Option A — Bascule du SHELL pour validation UX** : activer `/v4` (génération **stub gratuite**) pour qu'Etoile **valide le parcours/cockpit** sans dépense ; brancher les fonctionnalités ensuite, une par une, dans le shell validé.
- **Option B — Brancher d'abord la parité** (génération réelle derrière QC, CRUD, légendes, publication…) puis **une seule** bascule complète (E119 strict).
→ **Recommandation** : **Option A** (valider le squelette/parcours à coût nul d'abord — c'est le risque #1 d'Etoile), puis livraisons fonctionnelles dans le shell. À ton arbitrage.

## 6. Procédure de bascule (quand go d'Etoile)
1. (test UX, option A) `git merge --ff-only cockpit-v4` sur la branche déployée + `pm2 restart` → tester via **`/v4`** (flux par défaut intact, `/menu` quitte). **Stub gratuit, zéro dépense.**
2. Rollback trivial : `/menu` (sortie immédiate) ou redéploiement `7e24dac`.
3. Bascule complète (option B / après parité) : faire de cockpit-v4 le défaut + retrait progressif du legacy (strangler-fig E107), après nouvel auto-audit E118.

_Rien n'est déployé. Live `7e24dac` intact. Fichiers verrouillés intacts. Aucune génération payante._

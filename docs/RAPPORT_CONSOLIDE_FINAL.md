# RAPPORT CONSOLIDÉ FINAL — analyse nocturne (2026-06-10)

> **VERROU ABSOLU** : analyse / corrélation / diagnostic / priorisation uniquement. **Aucune modification produit, aucune correction, aucun refactoring, aucune migration, aucun retrait de frontière, aucun arbitrage définitif.** Seuls des fichiers `docs/` de rapport sont écrits.
> Sources croisées : conversation Etoile (retours réels), `CAMPAGNE_VALIDATION` (38 scénarios + **#5 live**), `FRONTIERES_LEGACY` (F1–F18), `bot_journal.log`, `AUDIT_COMPLET`, `RAPPORT_DETAILLE`, `PRIORISATION_PRODUIT`, `ROADMAP_PRODUIT`.

## RÉSUMÉ EXÉCUTIF
- Le test live **#5** a révélé le fait central : **Etoile a dû produire via le pipeline LEGACY entier** (`CL_NEW→NL_GO→NL_GO2→nlShowResult→RES_GEN→RC_GO/GJ_*`), **parce que le module cible `photo.image` était cassé (B1)**. Les deux architectures ne coexistent pas : **le bug B1 rejette l'utilisateur vers le legacy.**
- **B1** (l'étape IMAGE migrée se rend en **texte** au lieu du bloc média) est le **point de bascule** : confirmé sur **image réelle** (journal 23:03 `editMessageText … Aperçu image 1/1 validée`) et ~10× en nav.
- Les frontières **F1–F18 ne sont pas 18 problèmes indépendants** : ce sont en majorité les manifestations d'**UNE méta-cause** — *« tout rendu qui ne passe pas par le routeur/workspace »* (MC1). B1 = une 2ᵉ méta-cause (MC2 : le module cible n'assure pas un rendu média robuste). MC3 : deux moteurs d'état concurrents (`gw/genJob/newlook` vs `proj`).
- La cartographie F1–F18 est jugée **complète à un niveau de confiance ÉLEVÉ pour le périmètre gratuit** ; **zones encore peu observées** = scénarios payants non rejoués dans le workspace (#6 multi-images, #15 vidéo, #16 export, #17 prêt-à-poster) → confiance MOYENNE/FAIBLE, hypothèses F19 listées (non acquises).

---

## 1. CORRÉLATION COMPLÈTE DES SOURCES

| Problème observé | Retours Etoile | Campagne (scénario) | Frontière | Journal `bot_journal.log` | Audits (AUDIT/RAPPORT) |
|---|---|---|---|---|---|
| Étape IMAGE en bloc **texte** (vignette perdue) | « ça sort du bloc / rien ne se passe » | #8, #9 FAIL + **#5** | **B1** | `23:03:45 editMessageText … Aperçu image 1/1` ; ~10× `R_photo.image→editText` | n/a (régression du module migré) |
| « Éditer » ouvre cockpit/galerie séparés | « nouveaux blocs/cockpits dès Éditer » | #7 FAIL | **F1** | `PL_EDIT→delete` puis `EDIT_LOOKS/GLP_*/NL_NEW→sendPhoto` | T7 (éditeur mauvais bloc) |
| Production réelle passe par le legacy | #5 fait en legacy | #5, #15, #16 | **F2/F3** | `CL_NEW→sendPhoto`, `NL_GO2`, `RC_GO`, `GJ_EDIT` | flux Shotstack/cockpit historique |
| Galerie/looks hors cockpit | « bibliothèque externe » | #18 FAIL | **F4** | `MENU_LOOKS→showGallery`, `GLP_*` | E16–E21 (CRUD looks) |
| Référence : 2 portes | « où est LA réf ? » | #19 FAIL | **F5** | `RX_REFS→showRefMenu` vs `photo.ref` | E26 (réf défaut/verrou) |
| Historique liste texte non rouvrable | « retrouver mes prods » | #24 FAIL | **F10** | `STUDIO_HIST` cardMenu | T4/E49–E54 |
| Retours legacy ré-empilent l'accueil | « ça empile » | #27 FAIL | **F12** | `MAIN_MENU/HOME_*→sendMessage ACCUEIL` | T2 (anti-spam) |
| Envoi spontané de photo = menu externe | — | #31 FAIL | **F15** | `msg.photo→« Photo reçue ? »` | E5 (intake) |
| TECH_STOP message plein | irritant visible | #13 (barre) | **F13** | `TECH_STOP→sendMessage « Rien en cours »` ×3 | E112 |
| `[pause]` dans le script généré | qualité script | (#15 amont) | hors F (fidélité) | `21:11:51 … required proof. [pause]` | **E98** |
| Colorimétrie/réactions par défaut | fidélité | (L1) | hors F (fidélité) | — | E97/E99 |

## 2. IDENTIFICATION DES CONVERGENCES (tests auto ∩ audits ∩ tests réels)

**Convergence A — « le rendu sort du bloc unique »**
- SYMPTÔMES : nouveaux messages, cockpit/galerie séparés, accueil ré-empilé, image en texte.
- CAUSES RACINES : (MC1) rendu direct `send/cardMenu/cockpitPhoto` hors routeur ; (MC2) module migré qui retombe en texte (B1).
- FRONTIÈRES : F1, F3, F4, F12, F15, (+B1) — **confirmées par les 3 sources simultanément.**

**Convergence B — « deux pipelines de production »**
- SYMPTÔMES : #5 fait en legacy ; impossible de générer depuis le workspace ; état dispersé.
- CAUSES RACINES : (MC3) `gw/genJob/newlook` vs `proj` ; (MC2/B1) qui force le repli legacy.
- FRONTIÈRES : F2, F3, F11 — confirmées (#5 + journal + audit).

**Convergence C — « Studio = mémoire métier hors cockpit »**
- SYMPTÔMES : looks/réf/historique/décors/personas/médias/modèles s'ouvrent dehors.
- CAUSE RACINE : MC1.
- FRONTIÈRES : F4–F10 — confirmées (campagne + nav réelle + audit CRUD).

## 3. RAPPORT CONSOLIDÉ (par problème)

| Problème | Fréq. | Impact utilisateur | Frontière | Phase roadmap | Difficulté | Priorité | Recommandation |
|---|---|---|---|---|---|---|---|
| Étape IMAGE en texte | **Très haute** (chaque entrée IMAGE avec image héritée) | Bloque la création/validation ; force le legacy | **B1** | 0 | **S (1 ligne)** | **Critique** | Corriger en 1ᵉʳ (déverrouillage déjà demandé). |
| Éditeur hors bloc | Haute | Perte de contexte massive | F1 | 1 | L | Critique | Modules montage workspace. |
| Production via legacy | Haute (toute vraie prod) | Incohérence totale du parcours | F2/F3 | 3/4 | L | Critique | Neutraliser doublon `nl*` (F3) tôt ; brancher moteur (F2) en Phase 4. |
| Retours ré-empilent | Très haute | Désorientation permanente | F12 | 1 | M | Important | `MAIN_MENU/HOME_*→R_home/R_studio`. |
| Studio hors cockpit | Moyenne-haute | Mémoire métier dispersée | F4–F10 | 2/5 | M (par module) | Important | Modules `studio.*` ; F4/F5/F10 d'abord. |
| Intake photo externe | Moyenne | Geste naturel cassé | F15 | 2 | S–M | Important | Intégrer au workspace. |
| Pop-up réglages look | Moyenne | Interruption hors bloc | F17 | 3 | S | Confort | Choix in-bloc / règle auto. |
| TECH_STOP/STATUS message | Faible-moyenne | Irritant visible partout | F13 | 0 | S | Confort | Toast. |
| `[pause]` script | Chaque script | Qualité voix | E98 (fidélité) | L1 | S | Important | Retirer du prompt (lot fidélité, pas une frontière). |
| Décors/personas/médias/modèles | Faible | Confort Studio | F6/F7/F8/F9 | 5 | M | Peut attendre | Après cockpit + mémoire. |
| Commandes / ancien flux anglais | Faible | Dette | F14/F16/F18 | 6 | S | Peut attendre | Redirection / suppression. |

## 4. REVUE CIBLÉE DES RÉCURRENTS

- **Ouverture de nouvelles fenêtres** : confirmée — `PL_EDIT→sendPhoto` (F1), `CL_NEW→sendPhoto` (F3), B1 spawn `sendMessage IMAGE`. Racine MC1/MC2.
- **Perte du bloc unique** : confirmée sur IMAGE (B1) et tous les écrans Studio/legacy (MC1).
- **Navigation / retours arrière** : workspace OK (`R_home→close+editText`) ; legacy `MAIN_MENU` ré-empile (F12).
- **Reprise de session** : OK pour step look ; **FAIL pour step image** (B1 sur `RX_DRAFT_…` → editText) — #9 confirmé.
- **Édition après génération** : c'est exactement #5/#7 — on retombe en legacy/éditeur ; B1 empêche d'éditer depuis le module IMAGE.
- **Navigation PHOTO↔VIDÉO** : workspace→workspace OK en nav (test 7/7) **mais** la vraie vidéo bascule en legacy (F2) — observé #5 (`RES_GEN→RC_GO`).
- **Studio / Looks / Références / Historique** : tous hors cockpit (F4/F5/F10) ; réf a 2 portes (F5).
- **Prêt-à-poster / génération vidéo / export** : non rejoués dans le workspace (payant) ; #16 export = bridge non câblé (N/A, F2). Confiance MOYENNE/FAIBLE.

## 5. LISTE FINALE DES CORRECTIONS (ordre recommandé + justification)

1. **B1** (Phase 0) — *maintenant* : 1 ligne, débloque la création/validation et **la campagne payante** ; sans lui tout test workspace est faussé. Dépend de rien.
2. **F13** (Phase 0) — *maintenant* : quick win, irritant transverse.
3. **F1** (Phase 1) — *tôt* : plus gros irritant contextuel ; prérequis pour tester l'édition réelle. Dépend du contrat workspace (stable).
4. **F12** (Phase 1) — *tôt* : transverse ; se résout en partie en migrant F1/F4.
5. **F4, F5, F10, F15** (Phase 2) — *ensuite* : mémoire métier qui nourrit le cockpit ; F5 = source réf unique (clé pour auto).
6. **F3, F17** (Phase 3) — *après cockpit+mémoire* : couper les parcours concurrents sans casser l'usage (F3 = retirer le doublon `nl*` une fois le workspace fiable).
7. **F2, F11** (Phase 4) — *fondation* : brancher le moteur sur `proj` (mode auto/export) sur base saine.
8. **F6, F7, F8, F9** (Phase 5) puis **F14, F16, F18** (Phase 6) — Studio avancé puis dette.
- *Hors frontières (lot fidélité L1)* : **E98** `[pause]`, E97 colorimétrie, E99 réactions — indépendant, peut se faire en parallèle (1 image éco de vérif).

## 6. CLASSIFICATION EN 4 CATÉGORIES

- **CRITIQUES** (bloquent l'usage / faussent les tests) : **B1**, **F1**, **F2/F3** (production réelle), **F12**.
- **IMPORTANTES** (mémoire métier / cohérence) : **F4**, **F5**, **F10**, **F15**, **E98** (qualité script).
- **CONFORT** (amélioration ressentie) : **F13**, **F17**, **F6**, **F11** (tant que F2 non fait).
- **PEUVENT ATTENDRE** (dette / secondaire) : **F7**, **F8**, **F9**, **F14**, **F16**, **F18**.

## 7. RECHERCHE DE CAUSES RACINES SUPPLÉMENTAIRES + MÉTA-CAUSES

**Regroupement proposé (les 18 frontières ↦ 3 méta-causes) :**
- **MC1 — Pas d'autorité de rendu unique** : tout rendu direct (`send`/`cardMenu`/`cockpitPhoto`) qui ne passe pas par `routeBlock/uiShow/uiShowMedia`. ⇒ **F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F14, F15, F16, F17, F18.** *Quasi toutes les frontières en sont des instances.* **Implication stratégique** : une bonne partie se résout par un même patron de migration (envelopper chaque écran dans un module routeur média/texte) — pas 18 chantiers indépendants.
- **MC2 — Le module cible n'assure pas un rendu média robuste (B1)** : `route()` retombe sur `ctx.show` (texte) si `out.image` est falsy ; `photoImageView` peut renvoyer `null` (résolution `nlLocal` échoue). ⇒ **B1** (et risque latent sur tout futur module média qui ne garantit pas une image). **Cause racine nouvelle formalisée** : *absence de garantie d'image non-nulle + absence de fallback média au niveau du routeur*.
- **MC3 — Deux moteurs d'état concurrents** : `gw/genJob/newlook` (legacy) vs `proj` (cible). ⇒ alimente F2/F3 et **force le repli legacy quand la cible casse** (observé #5). **Cause racine nouvelle** : *le moteur de génération n'est pas encore piloté par `proj` → la cible n'a pas d'issue de production, donc l'utilisateur reprend le legacy.*

**Causes racines supplémentaires déduites des tests réels :**
- **CR-a** : la reprise d'un brouillon en step image hérite d'`image.urls` distantes non résolues → déclenche systématiquement B1 (≠ « pas de look »). 
- **CR-b** : `activeRootMid` périmé + fallback B1 ⇒ création d'un **nouveau** bloc texte (pas seulement mauvais bloc). Aggrave MC2.
- **CR-c** : le bouton de génération workspace (`PL_GEN`) n'a jamais été atteint en conditions réelles (B1 en amont) ⇒ le chemin `PL_GEN_DO→runNewLook` **n'est pas validé en réel** (seul le legacy l'est).

## 8. VÉRIFICATION FINALE DE LA CARTOGRAPHIE

**La carte F1–F18 est-elle complète ?**
- **OUI à confiance ÉLEVÉE** pour le périmètre **gratuit / navigation / Studio / édition** : aucune frontière inédite trouvée en 2 balayages de code + une longue session live. Les 4 ajouts (F15–F18) du tour précédent tiennent.
- **Confiance MOYENNE** sur **F2/F11** (moteur vidéo / export) : observés *en entrée* (#5 `RES_GEN→RC_GO`, #16 bridge non câblé) mais **la chaîne complète vidéo→export→livrable n'a pas été rejouée dans le workspace** (payant).

**Hypothèses ouvertes / zones peu observées (à confirmer, NON acquises) :**
- **HYP-F19 (à confirmer)** — *Pont « image→vidéo » legacy* : `RES_GEN` (« Photo envoyée au bloc vidéo ») relie le résultat image legacy au bloc vidéo legacy ; possible frontière distincte de F2 lors d'une vraie génération depuis le workspace. *Confiance : faible — déduction, pas test.*
- **HYP-F20 (à confirmer)** — *Blocs résultat/maquette multiples* (`results.mid`/`cockpit.mid`/`genFolders`) lors d'une vidéo réelle multi-parties : empilement possible non quantifié. *Confiance : faible.*
- **Zones non testées (car payantes)** : #6 (2/3 images dans le workspace), #15 (vidéo réelle depuis `video.export`), #16 (export branché), #17 (prêt-à-poster après vidéo). → **confiance FAIBLE** sur leur conformité bloc-unique ; à exécuter via `PROTOCOLE_LIVE.md` **après B1**.

**Niveaux de confiance des conclusions :**
| Conclusion | Confiance |
|---|---|
| B1 = cause critique, sur image réelle | **ÉLEVÉE** |
| F1/F3/F4/F5/F10/F12/F13/F15 confirmées | **ÉLEVÉE** |
| MC1/MC2/MC3 (méta-causes) | **ÉLEVÉE** |
| #5 exécuté en legacy à cause de B1 | **ÉLEVÉE** (journal) |
| F2/F11 (chaîne complète) | **MOYENNE** |
| HYP-F19/F20 | **FAIBLE** (déduction) |
| Conformité workspace de #6/#15/#16/#17 | **FAIBLE** (non testé) |

---

_Analyse nocturne — aucune exécution, aucune dépense, aucune modif produit. Roadmap reste PROVISOIRE ; arbitrage et exécution à la main d'Etoile. — 2026-06-10_

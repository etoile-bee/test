# RAPPORT DÉTAILLÉ — Conformité aux 73 exigences

> Diagnostic à valider **avant tout développement**. Lecture seule (2026-06-09), aucun code modifié,
> aucun restart. Référentiel : `docs/EXIGENCES.md`. Détail technique : `docs/AUDIT_COMPLET.md`.
> Priorité = **urgence de correction** (les exigences « Conforme » n'ont pas de priorité : `—`).

## Récap chiffré

**Statuts (sur 73)** : ✅ **Conforme : 36** · 🟡 **Partiellement conforme : 22** · 🟠 **Non conforme : 15**
→ **Score de conformité ≈ 64 %** (Conforme=1, Partiel=0,5).

**Par priorité (sur les 37 écarts)** : 🔴 **Critique : 4** · 🟠 **Élevée : 10** · 🟡 **Moyenne : 17** · 🟢 **Faible : 6**.

> Note : « Non conforme » regroupe Manquant / Régressé / Cassé (précisé dans la colonne Impact).

---

## A. Architecture & principes

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E1 | Cockpit unique, zéro spam | Partiellement conforme | tous | `cockpitPhoto/Caption`:1663/1680 vs `send()` (85×) | Le cœur s'édite en place, mais livraisons/légendes/erreurs empilent des messages | Moyenne |
| E2 | Cockpit 2 sections PHOTO/VIDÉO | Partiellement conforme | nlConfig / cockpit / results | `newlook.mediaId`,`cockpit.mid`,`results.mid` | 3 blocs séparés (connectés) plutôt qu'un cockpit 2-sections unifié | Moyenne |
| E3 | Style ÉDITION partout | Partiellement conforme | tous | divers | Cœur conforme ; reliquats anglais / paragraphes ponctuels | Faible |
| E7 | Manuel vs Auto séparés, Auto fiable | Partiellement conforme | showCreer | `recapGo(auto)`:1159 | Modes séparés ✅ ; fiabilité Auto non prouvée (crédits Anthropic épuisés) | Élevée |
| E8 | Prévisualisation avant CHAQUE validation | Partiellement conforme | maquette / récap | `genMockup`:1223 | Look/vidéo/coût prévisualisés ; décor/prompt/légende sans aperçu | Moyenne |
| E9 | Multi-persona | Partiellement conforme | Profil / Persona | `activePersona`:166 | Scaffold présent ; looks/sorties pas filtrés par persona | Faible |

## B. Coûts & argent

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E10 | Aucune génération payante sans accord | Conforme | récap | `NL_GO2`:2417 / `GJ_GO`:2081 | Jamais de dépense sans confirmation explicite | — |
| E11 | Récap coût+crédits+temps + bouton 💲 | Conforme | récap | `nlPayRecap`:359 / `genAfterScript`:1215 | Sait quoi/combien avant de payer | — |
| E12 | Images éco d'abord | Conforme | nlConfig | mode `eco`:172 | Teste pas cher avant HD/vidéo | — |
| E13 | Maquette avant Kling | Conforme | maquette | `genMockup`:1223 | Aperçu ~centimes avant la grosse dépense | — |
| E14 | Coûts/temps honnêtes | Partiellement conforme | récap coût | `prodTimeLabel`:1126 | Temps annoncé « ~3-10 min » vs 45 min réel → anxiété ; label HD « 1080p » faux | Moyenne |

## C. Looks

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E15 | Créer un look | Conforme | /newlook (nlConfig) | `generateLook` newlook.js:129 | Peut générer un look depuis la réf Imany | — |
| E16 | Modifier un look | Partiellement conforme | showGallery / éditeur | `NL_EDIT`:2445 | Édite l'image (filtres) mais pas tenue/décor/nom | Moyenne |
| E17 | Dupliquer un look | Non conforme (Manquant) | showGallery | — | Impossible de copier un look pour le décliner | Élevée |
| E18 | Supprimer un look | Partiellement conforme | showGallery | `GAL_DEL`:2241 | Supprime (corbeille) mais aucune restauration depuis l'UI | Moyenne |
| E19 | Archiver un look | Non conforme (Manquant) | showGallery | — | Pas de rangement « archives » distinct de la corbeille | Moyenne |
| E20 | Réutiliser un look | Conforme | showGallery | `GAL_PICK`:2225 / `/look` | Re-sélectionne un look existant pour une nouvelle vidéo | — |
| E21 | LOCK / déverrouiller un look | Non conforme (Manquant) | showGallery | — | Impossible de figer un look favori | Élevée |
| E22 | Galerie en grille paginée | Conforme | showGallery | `showGallery`:501 | Parcourt les looks en grille 3×3 paginée | — |
| E23 | Noms de looks lisibles | Partiellement conforme | showLook | `lookName`:413 | Noms auto « Look N · date », non renommables | Faible |

## D. Décors

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E24 | New Look intègre le décor (même écran) | Conforme | nlConfig | `NL_MENU_ENV`:2392 | Choisit tenue + décor sans changer d'écran | — |
| E25 | Décors = CRUD comme les looks | Non conforme | STUDIO_DECORS / nlMenuEnv | `NL_SET_ENV_`:2394 | Ne peut que choisir ; pas créer/modifier/supprimer/dupliquer/archiver | Élevée |
| E26 | Lock Background | Non conforme (Manquant) | décors | — | Impossible de verrouiller un fond | Moyenne |
| E27 | 3 décors de base extensibles | Conforme | nlMenuEnv | `lookbook.envs` | Bougies/Jour/Studio disponibles | — |

## E. Prompts

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E28 | Tous les prompts visibles | Partiellement conforme | /prompt | `defaultPrompt` newlook.js:33 | Voit le prompt de base ; pas ceux par tenue/décor | Moyenne |
| E29 | Prompts éditables | Conforme | /prompt | `PROMPT_EDIT`:2273 | Édite le prompt de base | — |
| E30 | Prompts sauvegardables | Conforme | /prompt | `writeFileSync`:2582 | Sauve (1 emplacement + .bak) | — |
| E31 | Dupliquer un prompt | Non conforme (Manquant) | /prompt | — | Pas de copie de prompt | Moyenne |
| E32 | Supprimer un prompt | Non conforme | /prompt | `PROMPT_RESET`:2274 | Réinitialise seulement, pas de suppression | Faible |
| E33 | Réutiliser un prompt | Partiellement conforme | /prompt | `defaultPrompt`:94 | Un seul prompt réutilisé ; pas de bibliothèque | Moyenne |
| E34 | Prompts gérés SANS changer d'écran | Non conforme (Régressé) | /prompt | handler:2768 | L'édition ouvre un message séparé hors cockpit | Élevée |

## F. Images

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E35 | Générer 1 / 2 / 3 (→6) images | Conforme | nlConfig | `NL_CNT_`:315 | Choisit le nombre d'images | — |
| E36 | Planche contact automatique | Non conforme | nlShowResult | `nlShowResult`:355 | Doit défiler 1-par-1, pas de vue d'ensemble du lot | Élevée |
| E37 | Sélectionner une image pour la vidéo | Conforme | nlShowResult | `NL_VIDEO`:2495 | Choisit l'image qui sert de base vidéo | — |
| E38 | Éditer une image avant la vidéo | Conforme | nlShowResult | `NL_EDIT`:2445 | Retouche avant de lancer la vidéo | — |
| E39 | Affichage entier 9:16 jamais coupé | Conforme | nlShowResult | `raw=true`:357 | Image montrée entière, jamais rognée | — |

## G. Vidéo & Script

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E40 | Vidéo : toutes redirections vérifiées | Partiellement conforme | tous | callbacks (251) | 0 bouton cassé ✅ ; quelques boutons morts trompeurs (« Make Part 2 ») | Moyenne |
| E41 | PHOTO ↔ VIDÉO connectés | Conforme | nlShowResult / récap | `NL_VIDEO`:2495 | Passe image→vidéo sans perte de contexte | — |
| E42 | Chaîne vidéo complète câblée | Conforme | genFinal | `genFinal`:1245 | La vidéo se produit de bout en bout | — |
| E43 | Workflows transverses fluides | Partiellement conforme | divers | — | La plupart fluides ; Archives→Réédition absente | Moyenne |
| E44 | Durée libre 15 s → 2 min | Conforme | CARD_DUR | `RC_DUR_FREE`:2060 | Choisit librement la durée | — |
| E45 | Partie suivante | Partiellement conforme | videoReadyKb | `GF_ADDPART_`:2087 | Marche en session ; **plante** sur vidéos restaurées (après restart) ; bouton « Make Part 2 » mort | Critique |
| E46 | Script affiché & modifiable avant dépense | Conforme | showScriptCard | `showScriptCard`:1168 | Lit/édite le script avant toute dépense | — |
| E47 | Catégories de sujets + anti-répétition | Conforme | showScriptCard | `autoPickTopic`:1109 | Pas 2× le même sujet rapproché | — |
| E48 | Hooks A/B | Conforme | showScriptCard | `genHooks`:1193 | Choisit l'accroche | — |

## H. Historique / Archivage / Réédition / Export / Projet

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E52 | Tout généré sauvegardé & retrouvable | Conforme | — | `makeGenFolder`:1330 | Chaque génération archivée (survit au restart) | — |
| E53 | Historique en grille avec aperçus | Non conforme | STUDIO_HIST / /gens | handler:2001 / :2779 | **Liste texte au mauvais contenu** (photos de looks, pas les vignettes vidéo) ; pas de grille | Critique |
| E54 | Réouverture / réédition / relance d'un projet | Partiellement conforme | videoReadyKb / STUDIO_HIST | `GF_RESTYLE_`:2118 | Réédition seulement sur le résultat courant ; pas depuis l'Historique | Élevée |
| E55 | Modèle sur-mesure complet (look+décor+caméra+style+script) | Non conforme | SHOWSTYLES | `snapshotStyle`:964 | Un « modèle » ne garde que fx+sous-titres ; ni look, ni décor, ni caméra, ni script | Critique |
| E56 | Projet réouvrable à l'identique | Non conforme (Manquant) | — | pas de `project.json` | Impossible de rouvrir un projet complet pour le retoucher | Critique |
| E57 | Prêt à poster / à retravailler | Conforme | showReady | `GF_POST_`:2084 | Range les vidéos prêtes / à retravailler | — |
| E58 | Restyle gratuit local | Conforme | videoReadyKb | `GF_RESTYLE_`:2118 | Re-rend une vidéo gratuitement (ffmpeg) | — |
| E59 | Publication TikTok auto + stockage privé | Non conforme | — | `grep tiktok`=0 ; tmpfiles.org | Aucune publi TikTok ; médias intermédiaires sur hébergeur public | Moyenne |

## I. Légendes

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E49 | Légendes en grille, reliées, versions | Partiellement conforme | videoReadyKb | `resCaptionOf`:1719 | Légende reliée à chaque vidéo ✅ ; pas de grille ni de versions | Élevée |
| E50 | Courte + longue + hashtags copiables | Conforme | videoReadyKb | `parseCaps`:124 / `GF_LONG_`:2110 | Copie la légende d'un tap, sans le titre | — |
| E51 | Éditer / régénérer une légende | Non conforme (Manquant) | videoReadyKb | — | Impossible de modifier/régénérer une légende dans le bot | Élevée |

## J. Navigation

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E4 | OK/Annuler/Précédent/Suivant cohérents + fil d'Ariane | Partiellement conforme | tous | `journey()`:1052 | Retours présents mais nommés ~10 façons ; 3 icônes « Annuler » ; fil d'Ariane sur 2 écrans → désorientation | Moyenne |
| E62 | /stop + /restart en tête | Non conforme | showHome | handler:2701/2717 | Commandes existent mais absentes de l'accueil (enfouies) | Élevée |

## K. État & Session

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E5 | Conservation d'état | Conforme | tous | `genState`/`saveState`:889 | Look/décor/réglages conservés en naviguant | — |
| E6 | Reprise après crash/restart | Conforme | boot | `resLoad`/stale-fix:1631 | Retrouve les blocs et l'état après redémarrage | — |

## L. Suivi / Logs / Robustesse

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E60 | Suivi génération (progression/statut/temps/relance) | Conforme | genFinal | `setProg`:1252 / `startTicker`:1130 | Voit l'avancement et peut relancer | — |
| E61 | Annulation réelle et fiable | Conforme | genFinal | `genAbort`/`abortNow`:1102 | Stop effectif (même pendant le lipsync) | — |
| E63 | Journal user + logs système | Conforme | — | `jlog`:33 / `uiLog`:24 | Tout est tracé (clics, erreurs API) ; crédits consommés non loggés | — |
| E64 | Erreurs claires et actionnables | Conforme | tous | `humanError`:1137 | Erreur crédits = message FR clair, pas d'auto-relance | — |
| E65 | Clic tracé / action vérifiée / rapport session | Partiellement conforme | — | `jlog`:1960 | Clics tracés ✅ ; pas de rapport agrégé par session | Faible |
| E66 | Robustesse / code mort | Partiellement conforme | — | `launch()`:738 / Shotstack / `MM_*` | Robuste, mais dette de code mort à retirer | Moyenne |

## M. Style / Rendu (verrouillés)

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E67 | Sous-titres 76px / OY 0.370 | Conforme | rendu | `subtitle_style.js` + hook | Sous-titres figés validés | — |
| E68 | Couleur V5 sur la vraie vidéo | Partiellement conforme | rendu | `color_style.js` V5 | À garantir que la prod applique bien V5 (non câblé lipsync) | Moyenne |
| E69 | Son -14 LUFS / bt709 / pause / réactions | Conforme | rendu | `render_local.js`:366 | Son normalisé, couleur étiquetée, pas de « pause » dit | — |
| E70 | Référence Imany officielle | Conforme | /newlook | `imany_reference.png` | La bonne influenceuse sert de référence | — |

## N. Méthode / Gouvernance

| E# | Exigence | Statut | Écran concerné | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E71 | Maquette d'abord | Conforme | (process) | — | Toute UI proposée en maquette avant code | — |
| E72 | Mono-session + filet | Conforme | (process) | backups/tests | Sécurité des modifications | — |
| E73 | Fidélité test → prod | Partiellement conforme | (process) | — | Principe tenu ; quelques libellés divergents | Faible |

---

## Vue condensée — les 73 exigences (E# · statut)

**Conforme (36)** : E5, E6, E10, E11, E12, E13, E15, E20, E22, E24, E27, E29, E30, E35, E37, E38, E39, E41, E42, E44, E46, E47, E48, E50, E52, E57, E58, E60, E61, E63, E64, E67, E69, E70, E71, E72.

**Partiellement conforme (22)** : E1, E2, E3, E4, E7, E8, E9, E14, E16, E18, E23, E28, E33, E40, E43, E45, E49, E54, E65, E66, E68, E73.

**Non conforme (15)** : E17, E19, E21, E25, E26, E31, E32, E34, E36, E51, E53, E55, E56, E59, E62.

---

## Plan d'action priorisé

**🔴 Critique** : (E53) réparer l'Historique → grille + vignettes + réouverture ; (E55/E56) chantier `project.json` (modèle/projet réouvrable complet) ; (E45) réparer « Partie suivante » sur vidéos restaurées.

**🟠 Élevée** : (E62) /stop+/restart en tête ; (E17/E21) looks dupliquer+lock ; (E25) décors CRUD ; (E34) prompts gérés dans le cockpit ; (E36) planche-contact auto ; (E49/E51) légendes éditer/régénérer+grille ; (E54) réédition depuis l'Historique ; (E7) fiabiliser le mode Auto.

**🟡 Moyenne** : (E1/E2) cockpit unique/2 sections ; (E4) navigation unifiée ; (E14) temps/labels honnêtes ; (E16/E18/E19) looks modifier/restaurer/archiver ; (E26) Lock Background ; (E28/E31/E33) prompts bibliothèque ; (E40/E43) redirections/workflows ; (E59) TikTok+stockage privé ; (E66) code mort ; (E68) couleur V5 ; (E8) aperçus manquants.

**🟢 Faible** : (E3) reliquats style ; (E9) persona ; (E23) renommer looks ; (E32) supprimer prompt ; (E65) rapport de session ; (E73) libellés.

**Séquence recommandée (1 lot testé à la fois)** : Quick wins (E62, label HD, E36) → Historique (E53/E54) → Partie suivante (E45) → Looks CRUD → Décors CRUD → Prompts cockpit → Légendes → project.json → Nettoyage/navigation → TikTok/persona/V5.

---

## AUDIT IDENTITÉ & ARTEFACTS (ajout 2026-06-09)

### Cas analysé — artefact « poil au torse »
Vidéo fournie par Etoile = **rendu final de la génération `2026-06-09-15-13`** (« Feminine energy… »).
Confrontation des 3 étapes (frames dans `docs/artefacts/`) :

| Étape | Fichier | Artefact présent ? | Preuve |
|---|---|---|---|
| (a) **Image source Seedream** | `looks/gen_2026-06-09-11-07_p1.jpg` | **OUI** (déjà là) | `docs/artefacts/02_source_seedream_torse_ARTEFACT.jpg` |
| (b) **Raw lipsync Kling** | `outputs/2026-06-09-15-13_raw_p1.mp4` | OUI (hérité) | `docs/artefacts/03_raw_lipsync_kling_torse.jpg` |
| (c) **Rendu final local** | `outputs/2026-06-09-15-13_p1.mp4` | OUI (hérité) | `docs/artefacts/04_rendu_final_torse.jpg` |

**Conclusion : l'artefact naît à l'étape (a) — l'image source Seedream est déjà fautive**, **favorisée par (d) le prompt**.
Kling **n'a rien inventé** (propagation fidèle) ; le **rendu local n'y est pour rien**. Cause racine = `buildPrompt` /
`newlook_prompt.txt` impose *« MAXIMUM skin texture — heavily visible pores… chest neck slight skin unevenness,
raw unfiltered skin quality »* **sans aucun négatif anti-poil/anatomie** → Seedream interprète la consigne « texture
maximale du torse » en pilosité sur le sternum. (Vérifié : `grep` body/chest hair = 0 dans les prompts.)

### Checklist identité/anatomie (E74–E84)
> Statut général = **Non vérifié** (vérification systématique nécessite des générations payantes ; **crédits Anthropic épuisés**),
> SAUF E76/E81 déjà **prouvés Non conformes** par le cas ci-dessus.

| E# | Exigence | Statut | Écran / Étape | Fonction concernée | Impact utilisateur | Priorité |
|---|---|---|---|---|---|---|
| E74 | Visage conservé | Non vérifié (échantillon OK) | image source / vidéo | `buildPrompt` newlook.js:87 | Risque de visage qui dérive de la réf | Élevée |
| E75 | Couleur de peau conservée | Non vérifié (échantillon OK) | image source | prompt | Carnation pourrait dériver | Élevée |
| E76 | Texture de peau plausible (sans parasite) | **Non conforme (prouvé)** | image source Seedream | prompt « MAXIMUM skin texture » | **Poil/texture parasite sur le torse** | Critique |
| E77 | Cheveux conservés | Non vérifié (échantillon OK) | image source | prompt anti hair-clip | Mèche/accessoire fantôme possible | Moyenne |
| E78 | Regard / yeux conservés | Non vérifié (échantillon OK) | image source | prompt | Regard/yeux pourraient dériver | Moyenne |
| E79 | Vêtements conservés | Non vérifié (échantillon OK) | image source | prompt outfit | Tissu déformé/fusionné possible | Moyenne |
| E80 | Bijoux conservés | Non vérifié (échantillon OK) | image source | prompt | Bijou doublé/fantôme possible | Moyenne |
| E81 | AUCUN élément parasite (poils/doigts/déform./fantômes) | **Non conforme (prouvé)** | image source → vidéo | prompt (pas de négatif) | **Artefacts anatomiques livrés à l'écran** | Critique |
| E82 | Contrôle identité+anatomie systématique | Non conforme (Manquant) | toutes étapes | — | Aucun garde-fou ne détecte l'artefact avant publication | Élevée |
| E83 | Négatif anti-artefacts dans le prompt (parade i) | Non conforme (Manquant) | newlook.js buildPrompt | `buildPrompt`:87 / `newlook_prompt.txt` | Sans négatif, l'artefact se reproduira | Critique |
| E84 | QC post-génération automatisé (parade ii) | Non conforme (à étudier) | image source avant vidéo | — | Pas de détection d'anomalie avant de payer la vidéo | Moyenne |

### Sources de bug à vérifier (par étape)
1. **Image source (Seedream)** — ✅ identifiée comme l'origine ici.
2. **Génération vidéo (lipsync Kling)** — propage fidèlement (pas la cause ici, mais à surveiller pour les mouvements/déformations).
3. **Prompt** — ✅ cause favorisante (texture torse maximale, zéro négatif).
4. **Upscale** — non utilisé actuellement (Seedream sort en 1440×2560 natif) ; à surveiller si ajouté.
5. **Cohérence d'identité** — pas de comparaison automatique à la référence (E82/E84).

### Parades proposées (à valider — rien appliqué)
- **(i) Négatif anti-artefacts dans le prompt** *(domaine créatif d'Etoile → attente de son GO)* : ajouter
  `no body hair, no chest hair, smooth hairless décolleté, no extra fingers, no deformed hands, no extra limbs,
  no ghost/duplicated accessories, no mutated anatomy` **et adoucir** « MAXIMUM skin texture / chest neck unevenness »
  (probable déclencheur). Fichier concerné : `newlook_prompt.txt` (non verrouillé) / `buildPrompt` newlook.js:87.
- **(ii) Contrôle qualité post-génération** *(à étudier)* : sur l'**image source**, avant de dépenser la vidéo —
  détection de visage/anomalies en **local et gratuit** (Apple Vision `VNDetectFaceLandmarks`, ou comparaison
  d'embedding visage à `imany_reference.png`) ; alerte « anomalie possible — vérifie avant de générer la vidéo ».
  Aucune dépense, exécutable sur le Mac.

> Statut global identité/anatomie : **non vérifiable exhaustivement maintenant** (générations payantes + crédits épuisés) ;
> le cas « poil au torse » est **diagnostiqué et reproductible** (cause prompt/source), parades prêtes à valider.

---

_Aucune correction appliquée — diagnostic en attente de validation d'Etoile._

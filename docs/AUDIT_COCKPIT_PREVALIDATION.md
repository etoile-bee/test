# AUDIT DE PRÉ-VALIDATION DU COCKPIT /v4r

> **EN-TÊTE DE GOUVERNANCE (E131)**
> - **Statut** : **B — Audit + fiabilisation cause-racine** (3 correctifs ciblés ; **aucune refonte**, aucun nouvel objet).
> - **LIVE** : **OFF (simulation)** sur tout l'audit — **ZÉRO dépense**, y compris l'audit moteurs/dépenses (logique seule).
> - **Méthode** : pilotage du **reducer RÉEL** `ui/nav.reduce`/`applyOp` + Socle réel + vues réelles + oracle de
>   transport `ui/spine_block`. Preuves **programmatiques reproductibles** : `tools/audit_cockpit.js` (inventaire +
>   stress transport), `tools/test_v4r_*` (78+28+10), `tools/test_cockpit_cost` (11). Mosaïque réelle :
>   `docs/PREUVE_mosaique_galerie.jpg`.
> - **Modifie un élément verrouillé** : **NON** (subtitle_style/color_style intacts).

---

## 0. SYNTHÈSE EXÉCUTIVE

**3 régressions de base — cause racine trouvée et corrigée (sans contournement)** :

| # | Régression | Cause RACINE (prouvée) | Correctif (cause, pas symptôme) |
|---|---|---|---|
| 1 | Le **bloc disparaît / tap mort** | (a) `/v4r` éditait un bloc identique/scrollé → Telegram « not modified » → invisible. (b) **`applyOp` levait une exception** sur `R0_RE_OPEN` quand un projet récent est introuvable (`saveFacts(null)`), la `catch` du câble avalait l'erreur → **aucun rendu → tap mort**. | (a) `/v4r` **poste un bloc FRAIS** (déjà livré). (b) **`openrecent` rendu null-safe** ; **filet** : toute exception de dispatch **re-rend** l'écran courant → un tap n'est JAMAIS mort. |
| 2 | **Doublons de boutons** | Écran **Vidéo** : `✏️ Changer` ET `✨ Générer photo` pointaient sur le **même callback** `R0_VI_GENPHOTO`. | « Changer » → **sélecteur** (`R0_VI_PICK`), « Générer photo » → `R0_VI_GENPHOTO`. **Audit : 0 doublon** sur tous les écrans. |
| 3 | **Retour / Suivant absents** | Masqué par le `/v4r` cassé (écrans jamais atteints). | **Audit prouve** : **Retour présent sur 100 % des écrans non-racine** ; **Suivant (action forward) présent sur chaque étape de flux**. |

**Stress transport 200 transitions** : `recreate=14 · edit=122 · editMedia=65 · maxAlive=1 · orphanHits=0` →
**bloc unique TENU, aucun écran orphelin, aucun bloc fantôme.** **Anomalies structurelles : 0.**

**Garanties** : tests verts (`screens 78 · nav 28 · budget 10 · cost 11 · conscience 18 · socle 14 · spine 21 · scenario 15`),
**32 régressions legacy vertes**, live + `/v4` intacts, invariants préservés, **LIVE OFF / zéro dépense**.

---

## A. AUDIT COMPLET DES PARCOURS

> Source : `tools/audit_cockpit.js` (rendu réel de chaque écran). Légende : ✅ marche · 🟡 simulé (zéro dépense) ·
> 🔴 réel gaté (LIVE off) · ⚪ lecture seule.

### PHOTO
| Étape | État | Détail |
|---|---|---|
| Choisir (Utiliser/Changer) | ✅ | écran `photo`, décision Utiliser/Changer si une photo existe |
| Importer | ✅ 🟡→🔴 | demande l'envoi d'un fichier ; **import réel** (upload téléchargé, **zéro dépense**) |
| Galerie | ✅ | **mosaïque** + sélection numérotée → revient en revue |
| Historique | ✅ | mosaïque (versions comprises, suppression douce) |
| Look / Décor / Avatar | ✅ | puces depuis l'inventaire réel (274 looks / 3 décors / 1 avatar) ; libellés propres |
| Références / Paramètres | ✅ | puces ; format |
| Prompt | ✅ 🟡 | saisie libre **ou** ✨ Générer (IA) **gaté** (Anthropic, simulé) |
| Aperçu → Validation | ✅ | écran récap (moteur · coût · n°X/10) |
| Génération | 🔴 gaté | **Seedream éco** (LIVE off → simulé ; réel sur GO) |
| Résultat / Réédition / Régénération | ✅ | Garder / Supprimer (doux) / Modifier (recharge params) / Régénérer |
| Passage → Vidéo | ✅ | « Créer vidéo » → flux Vidéo, **source posée** (sans Accueil) |

### VIDÉO
| Étape | État | Détail |
|---|---|---|
| Choisir source / Conserver / Changer / Importer | ✅ | Conserver (look) · Changer=**sélecteur** · Importer (upload réel) · Choisir |
| Mouvement / Voix / Musique / Légendes / Durée / Format | ✅ | puces ; **Musique off/auto/perso** ; **Durée visible+éditable (défaut 30s)** |
| Script | ✅ 🟡 | saisie **ou** ✨ IA gaté |
| Sous-titres | ✅ | **Vidéo>Édition>Sous-titres** : activer/désactiver · position · taille (par projet ; lit `subtitle_style` sans le modifier) |
| Aperçu → Validation | ✅ | récap coût (Anthropic+ElevenLabs+Kling) |
| Génération | 🟡 (réel non autorisé) | **simulé** (mp4 local ffmpeg) ; réel vidéo = **GO dédié requis** |
| Résultat / Réédition | ✅ | Garder / Supprimer / Modifier / Régénérer / Publier |

### STUDIO (⚪ lecture seule)
Looks (274) · Décors (3) · Voix (vide-présent) · Prompts (75) · Templates (vide-présent) · Références (62) · Avatars (1) · Paramètres (9).
Boutons ➕✏️📋🗑✅ présents → **toast « édition à venir »** (pas de mutation des configs partagées). Archives = via Récents.

### HISTORIQUE / RÉCENTS
Récents (projets) · brouillons · archivés · hérités (legacy, lecture seule) · « À poster » = brouillons de publication. **Ouvrir** restaure le projet (null-safe désormais).

---

## B. MATRICE DE RACCORDEMENT (extrait — une ligne par callback clé)

| Bouton (cb) | Source → Destination | Action réelle | État conservé | Branché | Exéc | Bug |
|---|---|---|---|---|---|---|
| R0_PHOTO / R0_VIDEO / R0_STUDIO / R0_RECENTS | home → écran | navigation | tout | ✅ | — | — |
| R0_PH_GEN → R0_PH_GENERATE → **R0_GO** | photo → prompt → **confirm** → résultat | dépôt média | draft (prompt/look/…) | ✅ | 🔴 gaté | — |
| R0_PH_TOVIDEO | photo_result → video_params | source = photo | source posée | ✅ | — | — |
| R0_VI_PICK → R0_GITEM_n | video → gallery → video_params | pose source | source | ✅ | — | — |
| R0_VI_GENPHOTO → R0_GO | video → photo_prompt → (retour auto) video | génère photo source | source « photo générée » | ✅ | 🔴 gaté | — |
| R0_VIB_* / R0_SET_* | bloc → préparation | écrit le champ draft | champ + retour avec valeur | ✅ | — | — |
| R0_ASK_* / R0_GENTXT_* | bloc → saisie/IA → préparation | écrit champ texte | champ | ✅ | 🟡/🔴 | — |
| R0_VE_SUBS → R0_SET_ston/stpos/stsize | video_edit → sous-titres → video_edit | règle sous-titres | st_* | ✅ | — | — |
| R0_PUB → R0_PUB_DO | video_result → publication | **GATÉ** (aucun envoi) | publication | ✅ | 🔴 gaté | — |
| R0_RE_OPEN_n / DUP / ARCH / DEL | recents | ouvrir/dupliquer/archiver(doux) | projet | ✅ | — | **corrigé** (null-safe) |
| R0_HOME (en flux) | flux → quit | « Enregistrer avant de quitter ? » | rien perdu | ✅ | — | — |

**Audit automatique** : aucun callback en doublon sur un écran ; aucun écran à 0 bouton ; aucun écran sans Retour (hors Accueil-racine).

---

## C. AUDIT DES ÉTATS (commandes globales)

| Commande | Écran | État conservé | Note |
|---|---|---|---|
| **Retour (◀)** | tous les flux | ✅ média/look/décor/params/projet | recule d'un cran, draft persistant |
| **Suivant (action forward)** | chaque étape | ✅ | Générer/Créer/Utiliser/Publier selon l'étape |
| **Accueil (🏠)** | écrans de sortie uniquement | ✅ | retiré des écrans en flux (anti-sortie accidentelle) |
| **/v4r** | partout | ✅ **contexte restauré** + bloc frais | `v4r_nav.json` (hint hors-Socle) |
| **/restart** | boot | ✅ **contexte restauré** | bloc frais + message persistant |
| **/menu** | legacy | n/a (cockpit legacy) | n'efface pas le bloc /v4r |
| **Annuler / Quitter / Enregistrer** | flux/quit | ✅ rien d'effacé en silence | Quitter = abandonne le **brouillon** seulement (matière conservée) |

**Invariant « projet vivant jusqu'à clôture »** : la matière produite (médias), l'intention et la publication
ne sont **jamais** supprimées par une navigation ; seul un brouillon de préparation peut être abandonné (choix explicite).

---

## D. AUDIT PHOTO ↔ VIDÉO (critique)

| Scénario | Transmis | Perdu | Recréé/Rechargé |
|---|---|---|---|
| **PHOTO → VIDÉO** (photo existante) | la photo devient **source vidéo** (`R0_PH_TOVIDEO` → `draft.video.source`) | rien | — (pas d'Accueil) |
| PHOTO → VIDÉO (photo générée) | idem, après dépôt média | rien | source = « photo du projet » |
| PHOTO → VIDÉO (importée) | source = « photo importée » | rien | — |
| **VIDÉO → PHOTO** (changer le look) | `R0_VI_GENPHOTO` → photo_prompt, **`ret='video'`** → **retour AUTO à Vidéo**, source = « photo générée » | rien | photo régénérée |
| VIDÉO → choisir une autre photo | `R0_VI_PICK` → galerie → `R0_GITEM` → retour video_params, source posée | rien | — |
| Projet vide | flux mène à « Créer » ; pas de placeholder | — | — |
| Projet existant | source/look/durée/params conservés dans le draft | rien | — |

**Conclusion** : Photo et Vidéo sont **deux parcours d'un même projet** qui communiquent **directement** (sans Accueil),
état conservé. Prouvé par `test_v4r_screens` (H) + `test_v4r_nav_scenario` (parcours 1→2→3).

---

## E. AUDIT GRILLES

| Vue | Rendu | Éléments | Preuve |
|---|---|---|---|
| Galerie / Historique | **MOSAÏQUE** (planche-contact ffmpeg `xstack`, média du bloc) + boutons numérotés | jusqu'à 9 | **`docs/PREUVE_mosaique_galerie.jpg`** (6 vraies vignettes, 3 colonnes) |
| Récents / Archives | **MOSAÏQUE des couvertures** projet + ▶ Ouvrir 1..9 | jusqu'à 9 | idem moteur |
| Studio (sections) | **grille** de boutons (3/ligne) | jusqu'à 9 | inventaire réel |
| À poster | liste des brouillons de publication | — | — |

> **Contrainte Telegram** respectée : les boutons inline restent texte ; la **visualité** vient de l'**image mosaïque**
> assemblée localement (zéro dépense), affichée comme média du **bloc unique** (pas d'album, pas d'empilement).
> ⚠️ **Captures device réelles iPhone** = à faire par Etoile (je ne peux pas capturer l'écran) ; la mosaïque jointe
> prouve le **rendu d'assemblage**.

---

## F. AUDIT DES LIBELLÉS — nomenclature unique

**Audit automatique** : aucun libellé > 18 caractères, aucun texte tronqué, aucun JSON brut, aucun doublon.

**Nomenclature retenue (à conserver)** :
- **Écrans** : `📸 PHOTO · {Choisir|Préparer|Aperçu|Résultat}` · `🎬 VIDÉO · {Choisir|Préparer|Aperçu|Résultat}` · `📤 Publication` · `🏛 Studio` · `🕘 Récents`.
- **Boutons** : `Conserver · Changer · Choisir · Importer · Générer photo · Créer vidéo · Édition · Historique · Publier · Aperçu · Valider · Générer · Régénérer · Garder · Supprimer · Modifier · Retour · Accueil`.

---

## G. AUDIT DES BLOCS VIVANTS (stress programmatique)

`tools/audit_cockpit.js` — **200 transitions** déterministes couvrant tous les flux (photo, vidéo, galerie, studio,
récents, sous-titres, retours, accueils) via l'oracle de transport (miroir exact de `r0Paint` : edit / editMedia /
recreate **post-puis-supprime**) :

```
transitions=200 · recreate=14 · edit=122 · editMedia=65 · maxAlive=1 · orphanHits=0
✅ INVARIANT bloc unique TENU (alive=1 à tout instant, aucun orphelin)
```
→ **aucun empilement · aucun écran orphelin · aucun écran perdu · aucun bloc fantôme.** `recreate` n'arrive qu'aux
bascules texte↔média ; tout le reste est édition/swap en place.

---

## H. AUDIT DES MOTEURS (sans dépenser)

| Capacité | Moteur | Branché /v4r | Exéc actuelle | Coût | Garde-fou |
|---|---|---|---|---|---|
| Photo (éco/HD) | **Seedream / Higgsfield** | ✅ (`generateLook`) | **réel sur GO** (LIVE off → simulé) | éco 0,48 cr | gate + budget 10 + verrou anti-reclic + timeout 240 s |
| Nouveau look | Seedream | ✅ (même chemin) | simulé | 0,48 cr | idem |
| Vidéo (lipsync) | **Kling / Higgsfield** | ⚪ câblé legacy, **non branché /v4r réel** | simulé (mp4 local) | 13 cr/30s | GO dédié requis |
| Voix | **ElevenLabs** | ⚪ legacy | simulé | ~0,20 €/1k car. | GO dédié |
| Scripts/Légendes | **Anthropic claude-sonnet-4-6** | ✅ (gate texte) | simulé | usage API | gate |
| Sous-titres / édition | **ffmpeg+libass / local** | ✅ | réel local | **gratuit** | — |
| Publication | métadonnée (aucun connecteur) | ✅ | **gatée** (aucun envoi) | — | confirmation |

Clés présentes : `HIGGSFIELD_KEY_ID/SECRET`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`. **LIVE OFF** → aucun appel payant.

---

## I. AUDIT DES DÉPENSES (scénarios d'échec simulés)

`tools/test_v4r_budget.js` (10/10) prouve, **sans dépenser** :
- **Aucune dépense sans Valider** : `Générer` → écran récap (no-op) ; seul `R0_GO` dépense.
- **Coût affiché = coût réel** : réconcilié à **0,48 cr** (bug `ops['image_eco']` → fallback `ops.eco` corrigé).
- **Anti-double-génération** : verrou `r0Busy` → un 2ᵉ clic pendant génération = toast, **aucune 2ᵉ facturation**.
- **Timeout 240 s** : la génération ne reste jamais bloquée « en cours » (échec → message + Retour).
- **Compteur** : +1 **uniquement** sur succès réel ; **blocage dur à 10/10** (« budget épuisé »), 11ᵉ refusée.
- **Affichage de la vraie photo** : `editMessageMedia` quand le fichier change (corrige le test #1 où la photo n'apparaissait pas).

> *Retour test réel #1 (historique)* : 3 photos réellement générées (≈1,44 cr) mais non affichées (bug `editMessageCaption`) → corrigé ; compteur remis à 0.

---

## J. TESTS DE RÉSISTANCE (perte d'état)

Inclus dans le stress 200× (G) : changements look/décor, imports, retours, passages Accueil, passages photo↔vidéo,
éditions, sauvegardes. **Résultat** : aucune perte d'état détectée — en fin de parcours, médias + intention + draft
persistent (vérifié aussi par `test_v4r_nav_scenario` : « aucun état perdu » sur les 3 parcours).

---

## K. DETTE TECHNIQUE

| Item | Gravité | Estim. |
|---|---|---|
| Mosaïque : nom de fichier fixe `_mosaic.jpg` → cache file_id Telegram peut montrer une planche périmée | mineur | 15 min |
| Studio en lecture seule (➕✏️🗑 = toast) | amélioration | 1/2 j (si édition réelle voulue) |
| Prompt/Look /v4r non transmis au moteur réel (éco utilise défaut) | majeur (avant prod photo fine) | 1 h |
| Vidéo/voix/scripts réels non branchés dans /v4r | majeur (avant prod vidéo) | 1/2 j |
| Publication = métadonnée (aucun connecteur plateforme) | majeur (avant publication réelle) | plusieurs jours |
| Nettoyage des mosaïques temporaires | quick win | 5 min |
| « Modèles par défaut » (M) = **nouvel objet/couche → catégorie D** | à arbitrer | — |

---

## L. PLAN D'ACTION FINAL (par impact réel)

**(1) Terminé & prouvé** : navigation par écrans · bloc unique (stress 200× OK) · contexte restauré (/v4r,/restart) ·
Photo↔Vidéo direct · grilles/mosaïque · sous-titres · durée · musique off · libellés propres · gate coût + budget +
anti-reclic + timeout · import réel · 3 régressions corrigées (cause racine).

**(2) Bloque encore** : rien de **structurel** (audit = 0 anomalie). Limites fonctionnelles = points (4)/(5).

**(3) AVANT le prochain test PHOTO réel** :
- ✅ déjà fait : affichage de la vraie photo (editMessageMedia), verrou anti-reclic, timeout, coût réconcilié, compteur.
- 🔶 recommandé : **transmettre Prompt/Look** du projet au moteur réel (sinon la photo réelle ignore les réglages) — **1 h**.

**(4) AVANT le premier test VIDÉO réel** :
- brancher **Kling + ElevenLabs + (script Anthropic)** dans le chemin /v4r vidéo, derrière le **même gate** (actuellement simulé) — **1/2 j** ; GO dédié d'Etoile (1ʳᵉ dépense vidéo).

**(5) Après validation métier** : édition Studio réelle · publication réelle (connecteur plateforme) · modèles par défaut (M, catégorie D).

---

*Fin de l'audit. Anomalies structurelles : 0. LIVE OFF, zéro dépense. Reproductible : `node tools/audit_cockpit.js`.*

# ANOMALIES — Stabilisation v4r (boucle : détectée → reproduite → comprise → corrigée → retestée → validée → clôturée)

> Pilotage : Dispatch vérifie le repo réel ; l'assistant corrige + prouve. Pas de « corrigé » sans **artefact réel**.
> Bot déployé courant : voir dernier commit en bas. Tests : harness no-spend `R0_DRYRUN=1` ; burn ffmpeg local = gratuit (réel).

---

# CATÉGORIE A — RUPTURES DE CONTEXTE / SOUS-ÉCRANS / MODULES ISOLÉS
> Un module d'édition ne doit JAMAIS devenir une sous-app isolée : même projet, même source (photo/vidéo), retour à l'écran d'où il vient, aperçu au bon endroit, aucun média étranger. Audit en cours (≥15 points/module). Lot B = offline, déploiement sur go explicite.

## ANO-CTX-SOUSTITRES-DEMO — le panneau Sous-titres affiche une AUTRE photo (démo) que le projet
- **Écran** : `block` `soustitres` (ouvert via 🔤 `R0_STEDIT` depuis l'aperçu, ou `R0_VE_SUBS` depuis Vidéo·Édition)
- **Gravité** : 🔴 RUPTURE DE CONTEXTE (capture Etoile 00:37 : aperçu = robe blanche du projet ; panneau S/T = fille au manteau cuir = média ÉTRANGER)
- **Constaté** : le panneau peint un clip DÉMO générique au lieu de la source projet.
- **Cause RACINE (diagnostic Dispatch, confirmé)** : dans `r0Render`, la branche qui peint le clip sous-titré depuis la source projet (`r0SubClip`/`r0SourceFile`) était gardée par `r0Screen==='confirm'` UNIQUEMENT. Pour un `block` (parentKind=`video` quand le projet a déjà une vidéo), on tombait dans `else if(kind==='video') → r0DemoVideo()` = clip démo (manteau cuir). Ce n'est pas la source qui dérive — c'est le PANNEAU qui peignait une démo.
- **Correctif** : la branche clip-sous-titré couvre AUSSI `r0Screen==='block' && r0Block.key==='soustitres'` → peint `r0SubClip(persona)` (source projet `r0SourceFile` + sous-titres incrustés), repli PNG `r0SubSample`, JAMAIS `r0DemoVideo`. + boutons regroupés par dimension (`optionRows` : Disposition·Police·Taille·Position·Couleur), plus de « mur ». + reste dans le contexte (Retour/Valider → aperçu via `subReturn`). `telegram_bot.js:r0Render` · `ui/nav.js` (soustitres) · `ui/screens.js:blockView`.
- **Statut** : ✅ CORRIGÉE (offline, non déployé)
- **PREUVE RÉELLE (dump dispatch)** : aperçu vidéo media = `subclip_uhoilb.mp4` (source `s11.jpg`) ; panneau S/T media = **`subclip_uhoilb.mp4`** (MÊME fichier, `subclip_`, pas `demo_video`) ; markup groupé `[Mot|Phrase|Paragraphe] [Archivo|Classique] [Petit|Moyen|Grand] [Haut|Milieu|Bas] [Blanc|Jaune|Cyan] [Défaut] [Aperçu] [Retour] [Valider]…`. Assertions runtime CTX-S/T ×6 ✅.

## ANO-CTX-BLOCK-DEMO-GENERAL — RÈGLE SYSTÉMIQUE : aucun écran d'édition ne peint une démo
- **Écran** : TOUS les `block` (photo : prompt·tenue·décor·référence ; vidéo : script·voix·musique·durée·source·soustitres ; pub : légendes)
- **Gravité** : 🔴 (même racine que ci-dessus, généralisée — relevée par Dispatch : le 1ᵉʳ correctif ne special-casait que `soustitres`, Script/Musique/Durée tombaient encore sur `r0DemoVideo` ligne 2952)
- **Cause** : `blockView` renvoie `kind=parentKind` ; `parentKind('video')='video'` dès qu'une vidéo existe → la branche `else if(kind==='video')` peignait `r0DemoVideo()` pour tout panneau vidéo non-soustitres.
- **Correctif (systémique, pas de special-case)** : nouvelle règle dans `r0Render` — `const _isEditPanel = (r0Screen==='block')`. Soustitres → `r0SubClip` (source + S/T). **Tout autre panneau d'édition** → `r0RealSource(f)` (drafts épinglés → images projet → patrimoine réel, **SANS repli démo** : null → texte). `r0DemoVideo`/`r0DemoPhoto` désormais RÉSERVÉS aux écrans NON-édition. Nouveau helper `r0RealSource` (telegram_bot.js) garantit « source réelle ou rien, jamais une démo ». Le bloc `if(kind==='photo')` aval ne ré-introduit pas de démo pour les panneaux d'édition.
- **Statut** : ✅ CORRIGÉE (offline) — règle générale couvrant les 13 modules d'édition (photo ET vidéo).
- **PREUVE RÉELLE (dump dispatch)** : panneaux Script/Musique/Durée (projet AVEC vidéo) media = source projet (cover, ex. `s11.jpg`), `demo_video` absent ; Tenue/Décor (projet photo) media = cover projet ; Sous-titres = subclip source. Assertions runtime : CTX-BLOCK-GENERAL ×8 + CTX-S/T ×6 ✅. Sweep 447/0.
- **Réserve honnête (hors écran d'édition)** : le keepsake « rendu persistant SIMULÉ » (`telegram_bot.js:~3195`, LIVE OFF uniquement) pose encore une démo si le fichier créé n'existe pas ; en LIVE ON la vraie génération dépose le vrai média (l.3148/3169). Noté, hors périmètre édition.

### Audit modules d'édition — RÉSULTAT (vrai dispatch, `docs/AUDIT_CONTEXTE.md`)
Après le fix systémique [[ANO-CTX-BLOCK-DEMO-GENERAL]], les 9 panneaux d'édition (Prompt·Tenue·Décor·Référence·Script·Musique·Durée·Sous-titres·Légendes) passent **tous** les points vérifiables : atteint un écran non-orphelin (`block`) · média = CONTEXTE projet (jamais démo) · ◀ Retour présent · Retour CHANGE d'écran · 🏠 Accueil → garde-fou « quitter ? » (conserve) · 1 cockpit. **0 rupture restante** (54 vérifs vertes). Les 4 autres « modules » de la liste ne sont pas des panneaux : Hashtags = champ de Légendes/Publication ; Modèle = action (duplication, [[ANO-G4-MODELE-D5]]) ; Texte complet = message séparé copiable ([[ANO-G5-HASHTAGS-D7]], ne pollue pas l'écran) ; Fichiers = hub (audité G2).
> **Honnêteté** : l'audit a révélé **UNE racine** (peinture démo sur les panneaux d'édition) à fort rayon (tous les modules vidéo), corrigée à la racine ; le reste était déjà conforme. Je ne « gonfle » pas le compte à ≥20 ruptures distinctes qui n'existent pas.

# CATÉGORIE B — CONTRÔLES TRANSVERSAUX D'ARCHITECTURE (16)
État honnête (✅ prouvé · 🟡 à approfondir/auditer · ⚠️ terrain LIVE) :

| # | Contrôle | État | Preuve / réserve |
|---|---|---|---|
| 1 | Identité projet | ✅ | `projectId` stable (socle) ; id unique garanti [[ANO-GENID-CREATE]] |
| 2 | Source de vérité par type | ✅ | image=`r0SourceFile`/`r0RealSource` ; draft par type (photo/video/pub) |
| 3 | Versioning / anti-écrasement | 🟡 | anti-écrasement PROJET ✅ (genId) ; **historique des MODIFS de champ ABSENT** (le draft est écrasé à chaque édition — auto-save mais pas de versions) → `ANO-ARCH-VERSIONING` (planifié) |
| 4 | Coût : 0 moteur réel sur retour/aperçu/nav/restart/test | ✅ | `test_v4r_nospend` 4/0 ; `engines.live()` OFF en dry ; seul `R0_GO`+LIVE dépense |
| 5 | Réel vs test isolés | ✅ | BASE sandbox `mkdtemp`/`.v4r_sandbox` ; `R0DRY` ; [[tests-v4r-isolation-mkdtemp]] |
| 6 | Import / upload (stockage+rattachement+remontée) | 🟡 | `R0_PH_IMPORT` arme `await upload` ; **chaîne complète à auditer** (terrain) |
| 7 | Corbeille / restore | ✅ | `r0Corbeille`→`.corbeille/` (soft-delete), `r0Restore` (SECURITES #11) |
| 8 | Publication = statut seul (pas de déplacement hors projet) | 🟡 | `setPublication` change le statut ; **à vérifier qu'aucun fichier ne sort du projet** |
| 9 | Chaîne cloud/local/Telegram (aller-retour) | ⚠️ | `r0CloudCopy`/`r0ArchiveProjet` ; preuve = terrain LIVE |
| 10 | UX mobile (boutons non coupés/cachés) | 🟡 | boutons sous-titres regroupés ✅ ; revue visuelle clavier/coupures = terrain |
| 11 | États d'erreur (message+cause+action, 0 perte) | ✅ | filet `uncaught*` + `koBanner` cause exacte (SECURITES #6) |
| 12 | Concurrence (double-clic, retour/stop/restart pendant gén) | ✅ | verrou `.v4r_generating`, `r0Busy`, deploy-guard (SECURITES #5) |
| 13 | Cohérence des libellés | 🟡 | relabel Historique (G1) ✅ ; passe complète des libellés à faire |
| 14 | Accessibilité fichiers (≥1 endroit clair, sans doublon) | ✅ | Fichiers hub + Historique (lecture) + Galerie (sélection), rôles distincts G1/G2 |
| 15 | Reconstruction projet depuis le dossier cloud | ⚠️ | `r0ArchiveProjet` écrit l'archive ; reconstruction = test terrain |
| 16 | Test réel final (chaîne complète) | ⚠️ | terrain Etoile, LIVE ON |

**Acquis ✅ (8/16)** : 1,2,4,5,7,11,12,14. **🟡 à approfondir (5/16)** : 3,6,8,10,13. **⚠️ terrain (3/16)** : 9,15,16. Audit approfondi des 🟡 = prochain bloc (offline, sur go).

## ANO-ARCH-VERSIONING — pas d'historique des modifications de champ (écrasement du draft)
- **Couche** : `socle.setDraft` (le brouillon est remplacé à chaque édition d'un champ)
- **Gravité** : 🟡 (pas de perte de PROJET ni de médias — auto-save + rendus persistants + corbeille ; mais pas de « versions » d'une valeur éditée : revenir à un script/prompt précédent n'est pas possible)
- **Statut** : 🟡 PLANIFIÉ (non requis par un arbitrage Etoile à ce stade — signalé honnêtement, à arbitrer)
- **Constaté** : éditer puis ré-éditer un champ remplace l'ancienne valeur sans la conserver.
- **Piste** : journaliser les versions de champ (ring buffer par champ) si Etoile le souhaite ; sinon laisser tel quel (les MÉDIAS générés, eux, sont tous conservés dans l'historique).

---

## ANO-GENID-CREATE — collision d'id à la création (résolution seconde) = perte silencieuse de projet
- **Couche** : `ui/socle.js` `createProject` (et `duplicateProject`, cf [ANO-G4-MODELE-D5])
- **Gravité** : 🔴 DATA-SAFETY (cause historique du « la vidéo revient sur une ancienne photo » : deux projets écrits sur le même id à la même seconde)
- **Attendu** : créer 2+ projets dans la MÊME seconde ne doit JAMAIS écraser le précédent ; chaque projet a un id unique persistant.
- **Constaté/risque** : `genId = persona_AAAA-MM-JJ-HH-mm-ss` (précision SECONDE). Sans garde, deux `createProject` dans la même seconde → même id → `saveFacts` écrase → perte silencieuse.
- **Correctif** : garde d'unicité dans `createProject` — si `fpath(id)` existe déjà, suffixe incrémental `-2,-3…` (présent depuis `6a71755`). Tous les appelants (`telegram_bot.js:2651`, `:3011` /v4r new, `cockpit_controller.js:34`) passent par le chemin auto-genId GARDÉ (aucun id explicite). Symétrique au correctif `duplicateProject` (G4).
- **Statut** : ✅ CONFORME (déjà gardé + désormais VERROUILLÉ par assertion anti-régression)
- **PREUVE RÉELLE** : `createProject ×3` au même `ts` figé → ids `imany_2024-06-10-06-13-20`, `…-2`, `…-3` (3 distincts) ; `listProjects = 3` (0 perte). Assertion runtime `ANO-GENID-CREATE ×2` ✅.

---

## LOT GAPS G1–G5 (offline, non déployé) — fermeture des écarts d'audit Etoile

### ANO-G1-GAL-HIST — Galerie ≡ Historique (doublon strict, viole D4)
- **Écran** : Photo → 🖼 Galerie (`R0_PH_GAL`) vs 🕘 Historique (`R0_PH_HIST`)
- **Gravité** : 🔴 (deux entrées strictement identiques)
- **Constaté** : `R0_PH_GAL` et `R0_PH_HIST` produisaient le MÊME écran (galleryKind=image, galleryAll=true, srcReturn=photo_prompt, go('gallery')).
- **Cause** : aucun RÔLE distinct ; les deux pointaient sur la même vue de sélection.
- **Correctif** : rôle `galleryRole` (`select`|`history`). GALERIE = grille de SÉLECTION (✅ Choisir + `R0_GITEM_`) ; HISTORIQUE = journal en LECTURE (PAS de ✅ Choisir, items `R0_GVIEW_` = revoir l'asset, aucun retour au flux). Idem vidéo (`R0_VI_GAL`/`R0_VI_HIST`). `nav.js` + `screens.js:galleryView` + `R0_GVIEW_` (telegram_bot).
- **Statut** : ✅ CORRIGÉE (offline)
- **PREUVE RÉELLE (markup)** : GALERIE labels `["◀ Précédent","✅ Choisir","Suivant ▶","🖼 1"…]` cb `[…,"R0_GITEM_0"]` ; HISTORIQUE labels `["◀ Précédent","Suivant ▶","🖼 1"…]` (PAS de ✅ Choisir) cb `[…,"R0_GVIEW_0","R0_GVIEW_1"]`. Assertions runtime G1 ×4 ✅.

### ANO-G2-RES-RETURN — Fichiers : retour non contextuel
- **Écran** : 🗂 Ressources/Fichiers (`resources`)
- **Gravité** : 🟡
- **Constaté** : `◀ Retour` repartait vers `video_result`/`photo` même si on arrivait via Studio/Récents.
- **Cause** : capture d'origine incomplète (`studio_section`/`publication`/`pret`/`publies` non couverts ; `studio` seul).
- **Correctif** : `R0_RES` mémorise l'origine élargie (`/^studio/`, recents, video_result, photo_result, publication, pret, publies) → `ctx.resReturn`. `telegram_bot.js`.
- **Statut** : ✅ CORRIGÉE (offline)
- **PREUVE RÉELLE (markup)** : origine RÉCENTS → Retour cb `R0_RECENTS` ; STUDIO → `R0_STUDIO` ; PHOTO·Résultat → `R0_PHOTO`. Assertions runtime G2 ×3 ✅.

### ANO-G3-MONTAGE-ORPHELIN — écran `photo_montage` atteignable par cb direct
- **Écran** : `photo_montage` (Montage retiré de Photo mais cb `R0_PH_MONTAGE` encore vivant)
- **Gravité** : 🟡
- **Correctif** : écran SUPPRIMÉ (vue `photoMontageView` + const `PH_MONTAGE` + route + NAVREQ retirés) ; `R0_PH_MONTAGE` résiduel renvoie à `photo_prompt` (pas de cul-de-sac) ; retiré de la carto. `nav.js` + `screens.js` + `tools/test_v4r_carto.js`.
- **Statut** : ✅ CORRIGÉE (offline)
- **PREUVE RÉELLE** : Photo·Préparer cb = `[R0_PHB_prompt,R0_PHB_look,R0_PHB_decor,R0_PHB_reference,R0_PH_PREVIEW,R0_PH_TOVIDEO,R0_PHOTO,R0_HOME,R0_STOP]` (aucun Montage) ; `R0_PH_MONTAGE` résiduel → screen `photo_prompt`. Carto 146/0 (plus de route orpheline). Assertions runtime G3 ×2 ✅.

### ANO-G4-MODELE-D5 — « Modèle » = préréglages au lieu d'un projet réouvrable
- **Écran** : Validation → 💾 Modèle (`R0_SAVEMODEL`)
- **Gravité** : 🟡 (ambiguïté tranchée par Etoile : Modèle = PROJET complet réutilisable)
- **Correctif** : `R0_SAVEMODEL` câblé sur `S.duplicateProject` → crée un VRAI projet réouvrable (📂 Récents), original intact. (« 💾 Défaut » reste les préréglages, #18, inchangé.) **Bug racine corrigé en passant** : `genId` à résolution SECONDE → dupliquer dans la même seconde écrasait ; `duplicateProject` garantit désormais un id UNIQUE (suffixe). `telegram_bot.js` + `ui/socle.js`.
- **Statut** : ✅ CORRIGÉE (offline) — comportement central D5 livré. (Une bibliothèque de modèles/templates parcourable resterait une amélioration future, non requise par l'arbitrage.)
- **PREUVE RÉELLE** : projets avant=1 → après `R0_SAVEMODEL`=2 (original intact). Assertion runtime P6/D5 ✅.

### ANO-G5-HASHTAGS-D7 — hashtags non fusionnés à la copie de la légende
- **Écran** : Fichiers → ✏️ Lég. courte/longue (`R0_FULLTEXT_legc`/`legl`)
- **Gravité** : 🟡
- **Correctif** : à la COPIE, la légende intègre les hashtags (`r0FuseTags`, un geste = texte prêt à coller) ; le champ #️⃣ Hashtags (`R0_FULLTEXT_tags`) reste SÉPARÉ/récupérable. `telegram_bot.js`.
- **Statut** : ✅ CORRIGÉE (offline)
- **PREUVE RÉELLE** : copie lég. courte = `"Ma légende\n\n#coach #dating #mindset"` ; champ hashtags seul = `"#coach #dating #mindset"`. Assertions runtime G5 ×3 ✅.

### Note doc — AUDIT_FINAL Zone 3 (correction de note STALE)
- L'audit indiquait « fix A (reprise contexte au boot) offline non déployé » — **FAUX** : présent dans `cfc869c` (`telegram_bot.js:4623` PERSISTANCE DE CONTEXTE + ▶️ Reprendre `R0_RESUME:3101`, bouton boot `:4629`). Note corrigée (lignes 54/90/94/134).

> **Sweep après lot G** : `431 OK / 0 KO` (screens 106 · carto 146 · runtime 95 · nav_scenario 28 · scenario 15 · budget 10 · nospend 4 · cloud_chain 15 · soustitres 12) · audit_cockpit `ANOMALIES STRUCTURELLES 0`.

---

## ANO-FAUX-VERT-RUNTIME — runtime « 83/0 » chez l'assistant mais « 73/10 » chez l'opérateur (MÊME commit cfc869c)
- **Écran** : suite `tools/test_v4r_runtime.js` (banc R0_DRYRUN), pas un écran produit.
- **Gravité** : 🔴 BLOQUANTE (faux vert = certification impossible)
- **Attendu** : sur le HEAD COMMITÉ, la suite donne le MÊME résultat partout (déterministe). 0 KO réel quand l'opérateur la relance.
- **Constaté (Etoile, vérifié soi-même sur cfc869c)** : `73 OK / 10 KO`. Les 10 KO = Accueil **couverture**, **RP** (×2 rendus persistants), **#17/#18** (Modèles/Défaut), **Texte complet**, **PERSIST**, **P2** source vidéo, **P6** défaut. Comportements VÉRIFIÉS présents dans le code (pas de perte).
- **Cause RACINE (reproduite, artefact)** : la suite ne fixait AUCUNE BASE → en invocation canonique `node tools/test_v4r_runtime.js` elle lisait la **VRAIE BASE** (`~/podcast-workflow` ou son sandbox symlinké). Or `looks/`/`prompts/`/`outputs/` **ne sont pas versionnés** et le symlink `outputs`→iCloud **ne se résout pas pareil selon l'environnement** (VM workspace : `find outputs/`=0 ; machine réelle : 239 vidéos). Même commit ⇒ assistant 83/0, opérateur 73/10. Détail : `_r0Prompts()=[]` (pas de `R0_LOADP_0` ⇒ #17/#18/Texte/P6) **et** `r0RealImages` rejette `size<=0` / `looks` vide (pas de couverture réelle ⇒ Accueil/RP/PERSIST/P2). **Repro exacte** : `V4R_SANDBOX=<box vide> R0_DRYRUN=1 node tools/test_v4r_runtime.js` → **73 OK / 10 KO**, les 10 EXACTES. C'est le piège « marche en test, pas en réel » — un test non déterministe, pas une perte de comportement (les 10 sont câblés : voir `docs/PREUVE_10_COMPORTEMENTS.md`).
- **Correctif (ISOLATION, pas de trucage d'assertions)** : la suite crée une BASE temporaire UNIQUE via `fs.mkdtempSync(os.tmpdir()+'/v4r-runtime-')`, y SÈME un état contrôlé (≥12 vrais JPEG non vides + 1 modèle de prompt long + catalogues `outfits_catalog`/`library`/`lookbook` écrits DANS le bac), FORCE la BASE du module dessus (`V4R_SANDBOX`, lu à l'init), **ne lit JAMAIS la vraie BASE ni les symlinks iCloud**, et NETTOIE le tmp en fin de run (`process.on('exit')`). **Aucune modification du code produit** (`telegram_bot.js`/`ui/*` octet-pour-octet identiques à `cfc869c`).
- **Statut** : ✅ CORRIGÉE — re-vérif Etoile en attente (relance `node tools/test_v4r_runtime.js` depuis sa VM → doit donner 0 KO)
- **Artefact réel** : AVANT (BASE réelle/box vide) `73 OK / 10 KO` (10 EXACTES) ; APRÈS, invocation CANONIQUE `node tools/test_v4r_runtime.js` **83 OK / 0 KO** ; idem `looks/`+`prompts/` retirés du repo **83/0** ; idem `HOME` factice vide **83/0** ; **0 bac résiduel** (nettoyage prouvé) ; sweep complet `429 OK / 0 KO` ; audit_cockpit `ANOMALIES STRUCTURELLES: 0`.

---

## ANO-SUBTITLE-APERCU — Aperçu sous-titres avant génération vidéo
- **Écran** : Vidéo → (Montage) → Aperçu (confirmView, mediaKind=video)
- **Gravité** : 🔴 BLOQUANTE
- **Attendu** : à l'arrivée sur l'aperçu vidéo, un **clip échantillon avec sous-titres incrustés** (position/taille/police/couleur) s'affiche AUTOMATIQUEMENT, sans fouiller ; bouton 🔤 Sous-titres pour ajuster ; le clip se re-rend à chaque changement.
- **Constaté (Etoile)** : « je n'ai toujours pas l'aperçu des sous-titres avant génération ». L'aperçu montre une image fixe (recap), pas le clip.
- **Cause RACINE (confirmée, artefact)** : le code peint bien le clip (`r0Render` confirm+video → `r0SubClip`), MAIS `r0SubClip` échoue à l'exécution quand la photo source est un **placeholder iCloud non téléchargé** (`blocks=0`). Le déclencheur de téléchargement `fs.statSync(img).size<30000` ne se déclenche pas (un dataless rapporte sa taille LOGIQUE complète, ex. 3,4 Mo). ffmpeg lit 0 octet → échec → **repli sur image statique**. Mesure réelle : **140/471 images podcast-looks sont dataless**.
- **Correctif** : helper `r0EnsureLocal(file)` qui détecte un dataless (`stat -f%b` = 0 blocs) et force `brctl download` (await + polling jusqu'à matérialisation), utilisé par `r0SubClip` ET `r0SubSample` avant ffmpeg ; repli aperçu = **PNG sous-titré** (`r0SubSample`), jamais l'image statique silencieuse ; log `[v4r]` succès/échec.
- **Statut** : ✅ CORRIGÉE & VALIDÉE (re-vérif Dispatch en attente)
- **Note** : l'aperçu vidéo (r0Render, telegram_bot.js:2934) peint DÉJÀ le clip auto (le « 2 taps » était une lecture de confirmView seul, sans l'override du peintre) — le vrai blocage était l'échec ffmpeg sur source dataless → repli statique.
- **Artefact réel** : placeholder `IMG_2047.PNG` blocs=0 → `brctl download` → blocs=37144 → **clip sous-titré 315 KB produit** ; harness aperçu = `type bloc=video` + bouton 🔤 Sous-titres ; commit `0d9dda5`.

---

## ANO-VERROU-GEN — Verrou génération bloque tout restart
- **Gravité** : 🔴 BLOQUANTE — **CLÔTURÉE ✅**
- **Attendu** : pendant une génération, aucun deploy/restart possible ; flag orphelin au boot → message d'incident.
- **Correctif** : flag fichier `.v4r_generating` posé/levé (2/2), garde-fou de déploiement, détection orphelin au boot.
- **Artefact** : test deploy-guard `flag présent → ⛔ RESTART REFUSÉ` / `absent → ✅ autorisé` ; 2 poses + 2 levées dans le code ; commit `af68fe9`.

---

## ANO-FLUX-VALIDER — Valider ne doit jamais reculer
- **Gravité** : 🔴 BLOQUANTE — **CLÔTURÉE ✅**
- **Attendu** : le parcours AVANCE ; `✅ Valider` ne ramène pas en arrière.
- **Artefact (trace réelle des transitions)** : PHOTO `Accueil→Photo→Préparer→Aperçu(confirm) ; Valider→confirm (reste) ; Éditer→photo_prompt (voulu) ; Générer→confirm→GO2→confirm2→Oui→photo_result (curImg=1)`. VIDÉO `Résultat→video_params→Montage→Aperçu→Valider(reste)→GO2→confirm2→Oui→video_result (curVid=1)`. **0 anomalie, 0 THROW.** Seul `✏️ Éditer` revient en prépa (intentionnel).

---

## LOT OFFLINE (préparé, testé harness, NON déployé — attente feu vert pour déploiement groupé)

### ANO-SOURCE-EDIT-REVERT — éditer sous-titres/script fait revenir l'image sur la référence persona (cuir)
- **Gravité** : 🔴 BLOQUANTE — 🟢 PRÊTE (offline)
- **Constaté (Etoile, capture 22:59)** : édition sous-titres/script → l'image source repasse de la sélection (blanc) à la référence persona (cuir).
- **Reproduction** : harness (sandbox) = STABLE (source tient sur block script/sous-titres). Donc bug **réel-base**.
- **Cause RACINE** : (a) **« Garder » (`R0_VI_KEEPLOOK`) n'épinglait PAS** `source_file` → sur ce chemin la source restait vide → `r0SourceFile` → `r0CoverFile` → **fallback global pouvant renvoyer une autre image**. (Hyp. (b) placeholder : écartée — `r0SourceFile` utilise `fs.existsSync` qui est vrai pour un dataless, donc il ne « rejette » pas vers la persona.)
- **Correctif** : (1) `R0_VI_KEEPLOOK` épingle `source_file = cover courant` ; (2) **garde-fou ABSOLU** `_r0IsRef` : `r0SourceFile`/`r0CoverFile` ne retournent **JAMAIS** un fichier sous `references/` ni `imany_reference.*` → **plus aucune bascule cuir silencieuse**.
- **Statut** : ✅ corrigée — preuve harness : « Garder » → `source_file=photo_…jpg` ; éditer sous-titres → `source==sélection: true` ; sweep 411 OK.
- 🟡 *preuve réelle-base* : à confirmer au prochain test d'Etoile (la cause + le garde-fou couvrent le cas).

### ANO-SOURCE-PLACEHOLDER — source de génération réelle non matérialisée (trou trouvé par Dispatch)
- **Gravité** : 🔴 BLOQUANTE — 🟢 PRÊTE (offline)
- **Constaté** : `r0RealPhoto` faisait `refOverride = r0SourceFile()` SANS `r0EnsureLocal`. Si la source est un placeholder iCloud dataless (0 octet), le moteur reçoit un fichier vide → échec OU `getRefUrl` retombe sur la référence persona = **bug manteau cuir** pour toute source placeholder. Idem `r0RealVideo` (avatar source).
- **Cause** : `r0EnsureLocal` était câblé dans l'aperçu (r0SubClip/r0SubSample) mais PAS dans la génération réelle.
- **Correctif** : `r0RealPhoto` → `await r0EnsureLocal(srcRef)` avant `refOverride` ; si échec → **annule proprement** (`{ok:false, err:...}` message clair, aucune dépense, **aucune bascule silencieuse** sur la référence persona). `r0RealVideo` → `await r0EnsureLocal(srcPath)` avant Kling ; si échec → throw message clair (capté → koBanner).
- **Statut** : 🟢 PRÊTE (offline) — preuve LIVE à la prochaine génération réelle d'Etoile (son clic, pas le mien).
- **Artefact** : matérialisation prouvée (placeholder `IMG_2047.PNG` 0 blocs → download → 37144 blocs) ; mêmes 140/471 dataless mesurés.



### A — Persistance de contexte à travers un restart
- **Gravité** : 🔴 BLOQUANTE — 🟢 PRÊTE (offline)
- **Constaté** : un restart (deploy/crash) renvoyait à un accueil vide (perte d'écran/projet/script). Ex. : restart pendant TEXTE·Aperçu → contexte perdu.
- **Cause** : l'état r0 est persisté (`r0SaveNav` → `v4r_nav.json`) mais n'était rechargé au boot QUE sur `/restart` (REOPEN_FLAG), pas sur deploy/crash.
- **Correctif** : au boot, **toujours** recharger l'état (`r0PickCurrent`+`r0RestoreNav`) en mémoire ; message « ✅ Connecté » avec bouton **▶️ Reprendre où j'en étais** (restaure l'écran EXACT) + 🏠 Accueil. Handlers `R0_RESUME`/`R0_RESUME_HOME`.
- **Artefact harness** : à travers **/menu→/v4r** + **/restart** → image source, thème catégorie (🔗 Attachement), script et source vidéo épinglée **tous conservés** ; `v4r_nav.json` écrit ; 0 THROW. Restauration écran-exact au reboot = via ▶️ Reprendre (à valider en réel après déploiement).

### B — Régénération script IN-SCREEN
- **Gravité** : 🔴 — 🟢 PRÊTE (offline)
- **Constaté** : « Régénérer le script » faisait DISPARAÎTRE l'écran (renvoyait à video_params via confirm).
- **Cause** : le bouton appelait `R0_GENTXT_vi_script` → confirm → `parentOfAsk` = video_params (sortie du bloc).
- **Correctif** : nouveau `R0_REGEN_SCRIPT` → reste sur le bloc Script, régénère en place, même thème.
- **Artefact harness** : régénérer ×2 → `screen=block/script` conservé, script varie (v3→v1), 0 THROW.

### B+ — Le script suit la CATÉGORIE
- **Gravité** : 🔴 — 🟢 PRÊTE (offline)
- **Constaté** : « le script ne change pas selon la catégorie ».
- **Cause RACINE** : (1) le script simulé était un placeholder fixe ignorant le thème ; (2) `r0RealVideo` prenait `draft.script` (le placeholder) en PRIORITÉ sur `theme_seed` → la catégorie était écrasée même en vidéo réelle.
- **Correctif** : (1) script simulé = **labellisé thème + varie** ; (2) topic vidéo = `script RÉEL d'Etoile > theme_seed > source` (un placeholder « simulé » n'écrase plus le thème) → `WF.generateScript(theme_seed)` produit un script du bon thème.
- **Artefact harness** : catégorie « Hommes toxiques » → script « ☠️ Hommes toxiques … », régénère → variante même thème.
- 🟡 *enhancement futur* : génération IA réelle du script DANS le cockpit (coût Anthropic/tap) — aujourd'hui la vraie version IA se fait au moment de la génération vidéo (depuis le thème).

### C — Réduire le texte inline
- **Gravité** : 🟠 mineure — 🟢 PRÊTE (offline)
- **Correctif** : blocs texte (prompt/script) = **aperçu court ≤180 car** dans `<code>` + « (aperçu — texte complet via 📄) » ; le texte complet reste en message séparé copiable (brut).

### D — Menus Photo/Vidéo intuitifs (disposition)
- **Statut** : ⏸ EN ATTENTE — Etoile choisit parmi 3 propositions d'architecture (via Dispatch). **NE PAS FIGER.** Carte de disposition à fournir quand l'architecture cible est tranchée. Voir `docs/DISPOSITION_PROPOSITIONS.md` (analyse).

---

## ÉCARTS D'AUDIT préparés offline (lot groupé)

### D4 — Doublon Galerie ≡ Historique
- 🔴 → 🟢 PRÊTE (offline) : `R0_PH_GAL`/`R0_VI_GAL` repassent en **scope PROJET** (sélection, bascule 🌍 Tout dispo) ; `R0_PH_HIST`/`R0_VI_HIST` restent **GLOBAL** (journal). Plus de doublon. Le patrimoine complet reste accessible via Historique + le toggle (readers déjà fixés 239/239). Preuve : `R0_PH_GAL galleryAll=false`, `R0_PH_HIST galleryAll=true`.

### Retour contextuel `resources` (Fichiers)
- 🟡 → 🟢 PRÊTE (offline) : `r0ResFrom` mémorise l'écran d'origine (Studio/Récents/Résultat) ; le ◀ Retour de Fichiers y revient. Preuve : Fichiers ouvert depuis Studio → Retour = Studio (true). Reset en quittant.

### Changement de référence par upload (`R0_REF_REPLACE`)
- ⚠️ **NON VÉRIFIABLE EN HARNESS** (nécessite un upload Telegram réel). Le code arme l'attente d'upload + copie vers `references/imany/imany_reference.*`. À tester EN TERRAIN après déploiement (envoyer une image → vérifier qu'elle devient la référence). Marqué ⚠️.

## Checklist 16 points (à dérouler)
1) Parcours Photo bout en bout — ✅ tracé (ANO-FLUX-VALIDER), 0 anomalie
2) Parcours Vidéo bout en bout — ✅ tracé (ANO-FLUX-VALIDER), 0 anomalie
3) Conservation des données — ✅ (migration, .prepurge, source unique)
4) Galeries — ✅ (239/239, walk récursif) — re-auditer affichage
5) Historique — 🟡
6) Stockage local — ✅ (projects_r)
7) Sync cloud — ✅ (podcast-looks symlink iCloud)
8) Telegram — 🟡
9) Sous-titres — 🔴 ANO-SUBTITLE-APERCU
10) Textes copiables — ✅ (`<code>` brut) — re-prouver le presse-papiers
11) Écrans finaux — ✅ (bloc figé 5 boutons)
12) Boutons de nav — ✅ (carto 156/0)
13) Retours arrière — 🟡
14) Cas d'erreur — ✅ (messages incident, filet global)
15) Redémarrages — ✅ (verrou + messages)
16) Générations réelles — 🟡 (à relancer après 1-5 validés)

## QA BOUCLE (sondage Dispatch sur 79eac5f) — A1-A4
- **A1 🔴→✅** boutons d'action dupliqués (~13 écrans, 19 DUP audit) : CAUSE = wrapper Valider réutilisait `req.prod`(=Aperçu) et blockView Valider réutilisait le cb du Retour. FIX = source unique : wrapper dédup par cb (`pushU`), 'gen' n'ajoute que 👁 Aperçu (D3), 'edit' ajoute ✅ Valider en cb DISTINCT `R0_BLOCK_OK` ; blockView ne pose plus que ◀ Retour. PREUVE : `audit_cockpit` ANOMALIES STRUCTURELLES **0** (0 DUP).
- **A2 🔴→✅** suite runtime : assertions D3 mises à jour (Aperçu média/Validation chiffré, Modèle/Texte sur les bons écrans, P2/P6). PREUVE : runtime **83 OK / 0 KO** ; sweep global **0 KO** (8 suites) ; carto NAVREQ adapté D3 (gen→Aperçu, edit→Valider).
- **A3 🟡→✅** « 💾 Défaut » : TOUJOURS présent sur les blocs (preuve dump : `💾 Défaut` sur block look + tous blocs choix/sous-titres) — non perdu.
- **A4 🟡→✅** label long block/script : « 🔄 Régénérer le script » → « 🔄 Régénérer » (≤18) ; audit ⚠️long disparu.

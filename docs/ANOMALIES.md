# ANOMALIES — Stabilisation v4r (boucle : détectée → reproduite → comprise → corrigée → retestée → validée → clôturée)

> Pilotage : Dispatch vérifie le repo réel ; l'assistant corrige + prouve. Pas de « corrigé » sans **artefact réel**.
> Bot déployé courant : voir dernier commit en bas. Tests : harness no-spend `R0_DRYRUN=1` ; burn ffmpeg local = gratuit (réel).

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

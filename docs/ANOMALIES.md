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

### A — Persistance de contexte à travers un restart
- **Gravité** : 🔴 BLOQUANTE — 🟢 PRÊTE (offline)
- **Constaté** : un restart (deploy/crash) renvoyait à un accueil vide (perte d'écran/projet/script). Ex. : restart pendant TEXTE·Aperçu → contexte perdu.
- **Cause** : l'état r0 est persisté (`r0SaveNav` → `v4r_nav.json`) mais n'était rechargé au boot QUE sur `/restart` (REOPEN_FLAG), pas sur deploy/crash.
- **Correctif** : au boot, **toujours** recharger l'état (`r0PickCurrent`+`r0RestoreNav`) en mémoire ; message « ✅ Connecté » avec bouton **▶️ Reprendre où j'en étais** (restaure l'écran EXACT) + 🏠 Accueil. Handlers `R0_RESUME`/`R0_RESUME_HOME`.
- **Artefact** : à valider en réel après déploiement (boot → Reprendre → écran exact).

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

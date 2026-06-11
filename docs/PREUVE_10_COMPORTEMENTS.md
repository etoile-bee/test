# PREUVE — les 10 comportements du « 73/10 » existent dans le PARCOURS RÉEL

> Contexte : l'opérateur a vu `73 OK / 10 KO` en invocation canonique `node tools/test_v4r_runtime.js`.
> Cause = **test non isolé** (lisait la vraie BASE / symlinks iCloud), PAS une perte de comportement.
> Ce document prouve, pour chacun des 10, (a) le **câblage réel** dans le code produit (inchangé), et
> (b) l'**assertion runtime** qui le vérifie désormais sur une **fixture contrôlée** (déterministe partout).
>
> Code produit `telegram_bot.js` / `ui/*` = **octet-pour-octet identique** à `cfc869c` (aucune assertion truquée,
> aucun comportement modifié). Seul `tools/test_v4r_runtime.js` a été rendu **isolé** (fixture `fs.mkdtempSync`).

| # | Comportement | Câblage RÉEL (fichier:ligne) | Assertion runtime (déterministe) |
|---|---|---|---|
| 1 | **Accueil = couverture photo** (pas un texte) | `telegram_bot.js:2664` `r0CoverFile()` remonte la dernière image dont le fichier EXISTE (jamais la référence persona, jamais une démo si patrimoine réel) | `B : Accueil affiche la COUVERTURE (bloc photo)` — `sB.type==='photo'` après reprise `/v4r` |
| 2 | **Rendu persistant photo** (keepsake hors cockpit) | `telegram_bot.js:3148` (réel) + `:3181` (simulé LIVE off) → `r0PostFinal()` `:2989` poste un message DÉDIÉ conservé dans le fil | `RP : 1 cockpit + 1 rendu persistant` — `renders===1` après génération photo |
| 3 | **Rendu persistant vidéo** | `telegram_bot.js:3169` (réel) + `:3181` (simulé) → `r0PostFinal('video',…)` | `RP : 1 cockpit + 2 rendus persistants` — `renders===2` après génération vidéo |
| 4 | **Modèles pré-enregistrés (📁) chargeables** | `ui/nav.js:147` liste `R0_LOADP_i` depuis `ctx.presets.prompts` ; `telegram_bot.js:3079` charge le modèle dans le brouillon | `#17 : modèles (📁) + 💾 Défaut` + `#17 : charger remplit le brouillon` |
| 5 | **Enregistrer par défaut (💾 Défaut)** | `ui/nav.js:96/109/148` bouton `R0_DEFSAVE` sur chaque bloc ; mémorise la valeur courante | `#18 : « Défaut » mémorise la valeur (photo.prompt)` — `defaults()['photo.prompt']` défini |
| 6 | **Texte complet (prompt/script entier)** | `ui/screens.js:351-352` bouton `📄 Texte complet`/`Script complet` quand un texte long existe ; envoyé en message complet (`:461`) | `texte entier : l'aperçu propose 📄 Texte complet` — bouton `R0_FULLTEXT_prompt` présent |
| 7 | **Persistance média après /restart** | `telegram_bot.js:2650-2657` `r0Cur()` / reprise du projet courant avec médias (`loadFacts`/`currentProject`/`saveFacts`) | `PERSIST : média + rendu présents` puis `après /restart : curImg≥1 + renders conservés + 1 cockpit` |
| 8 | **Source vidéo = la photo AFFICHÉE (épinglée)** | `telegram_bot.js:2676` `r0PinSource()` épingle `source_file` (photo+vidéo) ; `:2672` `r0SourceFile()` la relit partout ; garde `_r0IsRef` anti-référence | `P2 : source vidéo épinglée = l'image AFFICHÉE` — `draft.video.source_file === cover()` |
| 9 | **Enregistrer comme MODÈLE depuis la Validation** | `ui/screens.js:380` bouton `💾 Modèle` (`R0_SAVEMODEL`) sur l'écran Validation ; `telegram_bot.js:3086` enregistre la config | `P6/D3 : la VALIDATION propose 💾 Modèle` + `P6 : enregistre la config` |
| 10 | **Pré-remplissage d'un nouveau projet depuis le défaut** | `R0_DEFSAVE` écrit le défaut ; `S.getDraft` d'un nouveau projet hérite du défaut (sans rien écraser) | `#18 : nouveau projet pré-rempli depuis le défaut` — `draft.prompt === defaults()['photo.prompt']` |

## Conclusion
- **Aucun des 10 comportements n'était perdu.** Tous sont câblés dans le parcours réel (références ci-dessus).
- Le `73/10` venait **exclusivement** d'un test qui lisait un patrimoine variable selon l'environnement.
- Désormais : `node tools/test_v4r_runtime.js` (racine, sans var d'env) = **MÊME résultat partout**.

## Preuves d'exécution (relançables)
- Canonique `node tools/test_v4r_runtime.js` : **83 OK / 0 KO**
- `looks/` + `prompts/` retirés du repo : **83 OK / 0 KO** (le test ne les lit plus)
- `HOME` factice vide (simule VM workspace) : **83 OK / 0 KO**
- Fixture éphémère nettoyée en fin de run : **0 bac résiduel** (`mkdtemp` + `process.on('exit')`)
- Sweep complet : **429 OK / 0 KO** · audit_cockpit : **ANOMALIES STRUCTURELLES 0**

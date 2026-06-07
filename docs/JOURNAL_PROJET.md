# Journal de projet — Podcast Workflow (matière première formation)

> Trace complète du projet, structurée pour servir de support de formation.
> Mis à jour à chaque livraison (voir **CHANGELOG** en bas).

---

## 1. Histoire du projet & architecture finale

### Le besoin
Produire en série des vidéos TikTok « relationship coach » (avatar qui parle, sous-titres
incrustés, zooms, réactions, musique), pilotées **depuis Telegram**, à coût maîtrisé.

### Évolution
1. **V0** : rendu vidéo payant via **Shotstack** (cloud) + script (Anthropic) + voix (ElevenLabs) + lipsync (Kling/Higgsfield).
2. **Bascule moteur** : remplacement de Shotstack par un **rendu 100 % local ffmpeg** (`render_local.js`) → coût de rendu nul, contrôle total (sous-titres libass, zooms, réactions, couleur, loudnorm).
3. **UI bot** : d'un flux question/réponse linéaire vers une **carte unique V2** (écran d'accueil qui se transforme en place).
4. **Préparation vente** : séparation 3 couches + scaffolds multi-utilisateur et multi-persona.

### Architecture finale (3 couches)
```
┌─────────────────────────────────────────────────────────────┐
│  UI (Telegram)            telegram_bot.js                    │
│  • CARTE V2 unique (photo éditée en place : editMessageMedia │
│    photo↔vidéo, editMessageCaption, toasts)                  │
│  • Cockpit : 1 message du récap → script → maquette → progr. │
│  • Journal d'observation logs/ui_journal.jsonl + SCREENS.md  │
├─────────────────────────────────────────────────────────────┤
│  ÉTAT UTILISATEUR (par chat_id)   sessions{} + switchChat()  │
│  • Dormant en mono-chat, prêt multi-user (vente)             │
│  • PERSONA (personas.json) : 1 carte/dossiers par influenceur│
│  • styles_par_look.json, state.json, library.json            │
├─────────────────────────────────────────────────────────────┤
│  MOTEUR (sans état)                                          │
│  • workflow.js   : script(Anthropic) · voix(ElevenLabs) ·   │
│                    lipsync(Kling) · multi-parts · concat     │
│  • render_local.js : ffmpeg local (libass, zoom, réactions, │
│                    couleur, loudnorm -14 LUFS)               │
│  • tts_sanitize.js : nettoyage unique des marqueurs de pause │
└─────────────────────────────────────────────────────────────┘
```
Principe : le **moteur ne connaît ni Telegram ni l'utilisateur** (entrées→sorties, testable seul).
La cohérence entre couches passe par des fichiers d'état explicites, jamais de variables cachées.

---

## 2. Grandes décisions & POURQUOI

| Décision | Pourquoi |
|---|---|
| **Shotstack → ffmpeg local** | Coût de rendu nul, contrôle total des sous-titres/zooms/couleur, pas de quota cloud, itération instantanée et gratuite. |
| **subtitle_style.js = source unique du style** | Un seul endroit règle police/taille/position ; lu par le rendu ET le bot → cohérence garantie. |
| **Maquette AVANT toute dépense** | La voix coûte des centimes, le lipsync Kling coûte cher. La maquette (voix + rendu local sur ancien footage) montre le rythme/texte/style pour ~centimes avant d'engager le lipsync. |
| **Règle absolue : jamais de génération payante sans script visible/validé** | Évite de payer pour un mauvais script. Même Express passe par l'écran script. |
| **Tests/preview GRATUITS (rendu local)** | On itère le look à l'infini sans rien dépenser ; le payant n'arrive qu'au GO. |
| **Carte unique V2 (édition en place)** | Zéro empilement de messages, parcours « cockpit » lisible, ~4 taps en Express. |
| **Réactions « Naturel » par défaut** | Placement dans les vraies pauses (wordTimings), fondu, pitch jitter, -12 dB → crédible, pas artificiel. |
| **loudnorm -14 LUFS** | Standard TikTok : son homogène, perçu pro partout. |
| **Réglages mémorisés PAR LOOK** | Chaque photo garde sa « recette » couleur (look chaud, N&B, punchy…). |
| **Scaffold sessions/persona** | Le produit a vocation à être vendu (plusieurs influenceurs/abonnés) : séparer l'état dès maintenant évite une réécriture. |
| **Pont d'observation (ui_journal + SCREENS.md)** | Analyser la fluidité réelle sans captures : mesurer messages empilés, textes longs, anomalies. |

---

## 3. Bugs marquants & leçons (cas pédagogiques)

### 🔴 `require.cache` fige le code dans un process long
- **Symptôme** : la maquette gardait des sous-titres qui bougent / un style obsolète, alors que le code était corrigé.
- **Cause** : le bot `require('./render_local')` **une fois au démarrage** ; toute modif ultérieure du fichier n'était pas prise en compte tant que le process tournait.
- **Fix** : `freshRL()` purge `require.cache` et recharge render_local **avant chaque rendu**.
- **Leçon** : dans un service long-running, le code requis est mis en cache ; pour du hot-reload, busting explicite du cache (ou redémarrage).

### 🔴 Photos 19 Mo → `editMessageMedia` rejeté → empilement
- **Symptôme** : le défilement des looks créait de nouveaux messages au lieu d'éditer en place.
- **Cause PROUVÉE par appel API réel** : `editMessageMedia` refuse les photos > 10 Mo (les looks pesaient 19 Mo) → le code retombait sur un nouvel envoi.
- **Fix** : `shrinkIfBig()` (sips) compresse **avant** l'upload (19 Mo → 0,2 Mo). Re-test API : `ok:true`.
- **Leçon** : reproduire le bug au **niveau API réel** plutôt que relire le code ; connaître les limites de la plateforme (10 Mo photo, 1024 car. caption).

### 🔴 Contamination d'état (génération ≠ script validé)
- **Symptôme** : une génération a utilisé le texte d'une preview.
- **Cause** : `gwReset` ne purgeait pas `genJob` → un script obsolète pouvait fuiter.
- **Fix** : purge de `genJob`, garde-fou anti-démo, **test de séparation** preview↔génération.
- **Leçon** : un état partagé doit être **explicitement réinitialisé** ; verrouiller par un test.

### 🔴 « La voix dit *status* »
- **Cause racine** : les états d'attente de texte (mode « ✏️ Modifier ») étaient évalués **avant** les commandes ; taper `/status` était capturé comme **script** → `genJob.script="status"`.
- **Fix** : une commande **libère** l'état d'attente (jamais capturée) + `validTTS` refuse tout texte suspect (< 15 car., mot unique, mots de statut) **avant** le TTS, avec message clair.
- **Leçon** : ordonner le routage (commandes d'abord) ; valider toute entrée avant un appel coûteux.

### 🔴 « La voix dit *pause* »
- **Cause** : seul `[pause]` exact était converti ; toute variante (`(pause)`, `pause` isolé, casse/espaces) ou un tag SSML mal géré pouvait passer.
- **Fix** : **fonction unique `sanitizeTTS`** (toutes variantes → `<break time="0.8s" />`, mot réel préservé, testée 7/7) utilisée par **tous** les chemins TTS ; parsing d'alignement qui ignore les spans `<…>` (pas de fragment en sous-titre) ; `isPauseToken` filtre les sous-titres côté workflow ET render_local.
- **Leçon** : un nettoyage critique doit être **centralisé** (DRY) et couvrir les variantes ; tester les cas limites.

### Autres
- **SAR mismatch** au concat → `setsar=1` par segment.
- **Spam ffmpeg dans le chat** : un handler `stderr → send()` de l'ancien flux forwardait les logs ffmpeg → redirigé vers fichier uniquement.
- **Sous-titres « qui sautent »** : burn-in `ass` placé **après** le concat des segments de zoom → texte statique (prouvé par méthode diff).

---

## 4. Méthodologie

- **Sauvegardes** `.pre*` avant edits sensibles ; rollback noté par étape (`git revert <hash>`).
- **`node --check`** systématique avant livraison ; **audit des callbacks** (zéro orphelin, zéro écran muet).
- **`pgrep`** pour vérifier qu'**aucune génération ne tourne** avant de toucher/redémarrer le bot (ne jamais interrompre une génération payante).
- **Tests GRATUITS avant le payant** : rendu local, mocks des appels payants, preuves par appels API réels.
- **Garde-fous** : `validTTS`, `sanitizeTTS`, anti-démo, abort réel (flag vérifié à chaque polling/étape).
- **Commits petits et datés**, messages en français décrivant cause→fix.
- **Observation** : `logs/ui_journal.jsonl` (chaque échange) + `SCREENS.md` (carte des écrans) pour analyser la fluidité réelle.

---

## 5. Coûts & pipeline par étape

**Pipeline d'une vidéo (GO)** :
1. **Script** — Anthropic (claude-sonnet) → ~quelques centimes/$0.01.
2. **Voix** — ElevenLabs (par caractère) → ~0,08 € / vidéo (≈400 car.).
3. **Avatar** — préparation image.
4. **Lipsync** — Kling/Higgsfield (par partie) → **poste le plus cher**, ~0,40 €/partie, ~3-5 min.
5. **Rendu local** — ffmpeg (sous-titres, zoom, réactions, couleur, loudnorm) → **gratuit**, ~secondes.
6. **Multi-parts** : `planParts(sec)` découpe en parties ≤ ~28 s ; chaque partie = script(continuité)+voix+lipsync+rendu ; `concatClips` assemble. Ex. **90 s → 4 parties** (hook → 3 continuations → CTA) → concat ~92 s.

**Coût moyen/vidéo ≈ 0,62 €** (voix 0,08 + Kling 0,52 + Anthropic 0,01). À ~79 vidéos/mois ≈ **49 €/mois**.
**Maquette** : voix uniquement (~centimes) + rendu local gratuit → valider AVANT le lipsync.

---

## 6. Git log annoté (du plus récent au plus ancien)

> Chaque commit = une livraison. Détail complet via `git show <hash>`.

- **0ca8961** /test consolidé en 1 message.
- **d6c8d16** Scaffold PERSONA (multi-influenceur) + sélecteur ☰ Plus.
- **0503f04** Format long prouvé (90s→4 parties) + bouton [➕ Partie suivante].
- **a953a8f** Carte allégée (budget→maquette), progression supprimée à la fin, anti-dissolution, /test&/preview footage en mouvement.
- **56de697** Éditeur V2 en message unique (fin de l'empilement) + toasts.
- **522e04a** 🔴 Fix « voix dit pause » : `sanitizeTTS` unique + filtres sous-titres.
- **05d35f1** Scaffold multi-utilisateur (sessions/chat_id) + ARCHITECTURE.md.
- **9be53bd** V2 CARTE UNIQUE (/go = la carte, tout en place).
- **a0c3261** 🔴 Fix défilement looks (cause API : >10 Mo) : `shrinkIfBig`.
- **6e4aad7** 🔴 Fix « voix dit status » : commandes libèrent l'attente + `validTTS`.
- **207477d** 6 fixes capture-driven (spam ffmpeg, video ready 1 msg, /posted, noms looks, menu remplacé, /restart).
- **4ec6f5f** Pont d'observation (ui_journal.jsonl + SCREENS.md).
- **f7ff8a7** Réglages PAR LOOK (styles_par_look.json).
- **8e501c0** Cockpit message unique (récap→script→maquette→progression).
- **9bc0597** Vraie annulation (flag abort à chaque étape/polling).
- **21ba5b1** 5 bonus (Hooks A/B, 3 covers, variation voix, auto-push GitHub, loudnorm).
- **f972715** Fix contamination d'état + anti-répétition + test séparation.
- **d8915d6** Sauvegarder partout (script→library, fichiers).
- **b4ad915** Image en sous-sections + revenir à la base + garder/repartir.
- **bd3366e** 🔴 Cause racine maquette : `freshRL()` (require.cache) + sujet résolu avant GO.
- **a35d56a** Gros lot wizard (durée persistante, catégories, réactions naturelles, loudnorm, presets…).
- **9f82769** /go menu unique + galerie en place + zéro cul-de-sac.
- **da02d18** Dossier par génération + Restyler gratuit.
- **0caa5c5** Réactions OFF/Naturel/ON + preset Signature + sous-titres statiques.
- **77c4937 / 71c7411** Flux Générer C1/C2 (carte récap + script preview + maquette + orchestration).
- **ece61f9** Moteur multi-parts / durée libre.
- **7fc111f → e208516** Bascule Shotstack → rendu local ffmpeg.
- _(historique antérieur : calibrage style, galerie looks, /edit unifié, presets, /files, restart, setMyCommands…)_

---

## CHANGELOG (à maintenir à chaque livraison)

- **2026-06-07** — Création du journal. Lot « retours V2 » : carte allégée + budget à la maquette ;
  progression qui disparaît à la fin ; anti-dissolution (pas de re-upload si image inchangée) ;
  /test & /preview sur footage en mouvement ; [➕ Partie suivante] + preuve format long 90s ;
  scaffold PERSONA ; /test consolidé. Correctifs : `sanitizeTTS` (pause), éditeur V2 message unique.

# JOURNAL PROJET — Podcast Workflow (changelog)

Ordre anti-chronologique (le plus récent en haut). Source de vérité de l'état = `CONTEXTE_projet.md`.

---

## 2026-06-08 — PHASE 1 : GEL & STABILISATION ✅ (tag `STABLE-1`)

Session dédiée « suivi à distance » (Etoile suit/valide depuis son iPhone).

**1. État des lieux — garde-fous (aucun regreffe nécessaire)**
Tous les garde-fous de sécurité présents sur HEAD, vérifiés un par un :
- `sanitizeTTS` + ceinture côté bot (`tts_sanitize.js`, `workflow.js`, `telegram_bot.js:806`)
- `validTTS` / `TTS_BAD` anti-« status » (`telegram_bot.js:1337-1342`)
- `genAbort` (vraie annulation entre étapes + pendant polling lipsync)
- garde `renderStyleFrame` null (`telegram_bot.js:1356`)
- anti-dépense : récap avant paiement + script obligatoire avant GO + `ttsCheck` aux étapes payantes

**2. Arbitrage sous-titres → choix Etoile : 76px / OY 0.370**
- 3 images test locales gratuites générées sur la même frame (`podcast-outputs/test_local/arbitrage_45.png` 45/0.25, `arbitrage_76.png` 76/0.33, `arbitrage_76_0370.png` 76/0.370).
- Choix : **Archivo Black 76px / OY 0.370** (= `arbitrage_76_0370.png`, réglage réel du fichier).
- `subtitle_style.js` commité : `1304db2` « Sous-titres verrouillés par Etoile: 76px/OY 0.370 (arbitrage 08/06) ».
- Couleur **V5 inchangée** (`color_style.js`) ; ré-arbitrage couleur **reporté** (Etoile verra plus tard).

**3. Verrou physique des fichiers de style**
- Hook git `.git/hooks/commit-msg` + `LOCKED_FILES.txt` (`subtitle_style.js`, `color_style.js`).
- Tout commit touchant ces fichiers est REFUSÉ sauf message contenant `[UNLOCK-ETOILE]`. Testé (refus / déblocage / commits libres).

**4. Règle MONO-SESSION gravée** (`CONTEXTE_projet.md`)
Une seule session Claude modifie le code à la fois ; les autres en lecture seule. Leçon de la divergence du 07-08/06.

**5. Infra de suivi à distance**
- Journal iCloud `podcast-outputs/dev_journal.txt` (lisible app Fichiers iPhone).
- **Miroir Telegram live** : pm2 `dev-feed` (`dev_feed.js`) → chaque nouvelle ligne du journal arrive dans le chat (préfixe 🛠, silencieux, regroupe les rafales <5s). Process séparé, `telegram_bot.js` intact.
- **Keep-awake** : pm2 `caffeinate -dims` (`keep-awake`) → Mac ne dort/verrouille plus en idle. Capot ouvert requis si laptop.

**Clôture** : aucune génération en cours → `pm2 restart podcast-bot` → smoke test OK (online pid 71121, polling `pending_update_count:0`, getMe ok, `/go` câblé) → **tag `STABLE-1`**.

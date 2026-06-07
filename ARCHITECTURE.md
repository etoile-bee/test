# Architecture (préparation multi-utilisateur / vente)

Séparation en 3 couches, pour pouvoir vendre presets / formation / abonnements plus tard
sans réécrire le cœur.

## 1. MOTEUR (sans état) — réutilisable, testable seul
- `workflow.js` : génération (script Anthropic, voix ElevenLabs, lipsync Kling) + assemblage.
- `render_local.js` : rendu vidéo ffmpeg 100 % local (sous-titres, zooms, réactions, couleur, loudnorm).
- Aucune dépendance à Telegram ni à un utilisateur. Entrées → sorties. Garde-fou TTS inclus.

## 2. UI (présentation) — Telegram
- `telegram_bot.js`, fonctions `showRecap`/`cardMenu`/`cockpit*`/`showLook`/… = **la CARTE V2** et ses sous-écrans.
- Tout s'édite EN PLACE (un seul message « cockpit » : `editMessageMedia` photo↔vidéo, `editMessageCaption`).
- Journal d'observation : `logs/ui_journal.jsonl` (chaque échange), carte des écrans : `SCREENS.md`.

## 3. ÉTAT UTILISATEUR — séparé par `chat_id`
- Registre `sessions[chatId]` + `switchChat(chatId)` (haut de `handle()`).
- Variables d'état par utilisateur : `SESSION_VARS` (carte/gw, job, cockpit, sujets de session, état du wizard…).
- **Dormant en mono-chat** : `switchChat` est un no-op tant qu'un seul `chat_id` est autorisé
  (restriction `CHAT_ID` conservée pour la sécurité). Dès qu'on autorise plusieurs chats,
  l'état bascule automatiquement par utilisateur (snapshot/restore testé).
- Données déjà par-entité : `styles_par_look.json` (réglages mémorisés par look),
  `state.json` (derniers réglages), `library.json` (scripts).

## Migration vers le vrai multi-user (plus tard)
1. Lever la restriction `CHAT_ID` (autoriser une liste / tous les chats).
2. Persister `sessions` sur disque (par `chat_id`) si on veut survivre aux redémarrages.
3. Ajouter une couche « compte » (plan, quota, presets payants) indexée par `chat_id` — le point d'accroche existe déjà.

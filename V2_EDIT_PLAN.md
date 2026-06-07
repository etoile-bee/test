# V2 — à brancher au signal (NE PAS intégrer pendant le test)

## Observation (journal ui_journal.jsonl, session de test en cours)
- ✅ Carte V2 : éditée en place (OK).
- ✅ Aucune anomalie critique : pas de TTS « status », pas de ffmpeg dans le chat, pas d'erreur pm2.
- 🔴 Section ÉDITION du look = empilement massif (jusqu'à 12 nouveaux messages).
  Parcours observé : `GAL_EDIT → EDIT_IMGADJ → IMG_RESET → EDIT_IMG → SHOW_PRESETS →
  IMG_PRE_* → EDIT_IMGFX → UNDO_EDIT → EDIT_HOME → SHOWSTYLES → LOADSTYLE → EDIT_PREVIEW → MENU_TEST`.

## Cause
La section édition (héritée) n'a jamais été convertie au « message unique / cockpit ».
Chaque écran s'envoie en NOUVEAU message :
- `showEditHome` (EDIT_HOME) → nouveau texte.
- `openPanel` (Image/Ajuster/Effets/Subs/Zoom/Musique/Réactions) → nouvelle photo (editPanel.mid remis à null à chaque ouverture).
- `showPresets` (SHOW_PRESETS) → nouveau message.
- `runPreview` (EDIT_PREVIEW) → frame + « Suite : ».
- `sendBeforeAfter` / `CMP_REF` → nouvelles images.
- `IMG_RESET` / `UNDO_EDIT` / `LOADSTYLE` / `SAVESTYLE` → messages de confirmation.

## Plan de conversion (à appliquer au signal, dans telegram_bot.js puis restart)
1. **Un seul message d'édition** `editMid` (réutiliser `cockpit.mid` quand l'édition est ouverte
   depuis la carte, sinon un mid dédié). Toutes les fonctions ci-dessous l'éditent en place
   (editMessageMedia pour la photo d'aperçu + editMessageCaption pour les sous-réglages).
2. `showEditHome` → `cardMenu`-like sur `editMid` (garder une PHOTO d'aperçu, boutons = sections).
3. `openPanel` → ne PAS remettre `editPanel.mid=null` ; éditer `editMid` (la frame change via editMessageMedia, déjà compressée par shrinkIfBig).
4. `showPresets`, sous-réglages Ajuster/Effets → editMessageCaption sur `editMid` (garde la photo).
5. `IMG_RESET`/`UNDO_EDIT`/`LOADSTYLE`/`SAVESTYLE` → pas de message de confirmation séparé :
   rafraîchir `editMid` + answerCallbackQuery (toast) au lieu d'un `send`.
6. `runPreview` / Avant-Après / vs Réf → afficher dans `editMid` (swap de la photo), bouton retour.
7. `MENU_TEST` (vidéo de test) : reste un nouveau message (livraison vidéo) — OK.
8. Retour : `◀️` depuis n'importe quel sous-écran d'édition → la carte (`showRecap`) ou l'accueil édition, en place.

## Vérif après intégration (appels API réels, comme la carte)
- editMessageCaption sur la photo d'édition ✅ (déjà prouvé pour la carte).
- editMessageMedia photo→photo pour l'aperçu stylé ✅ (déjà prouvé).
- Re-scanner ui_journal : 0 « EMPILEMENT » dans la fenêtre édition.

## Toasts
Utiliser `answerCallbackQuery(id, text)` (petit toast) pour les confirmations
(IMG_RESET, UNDO, style chargé…) au lieu d'un message — zéro empilement.

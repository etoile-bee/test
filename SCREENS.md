# Carte des écrans du bot

_Généré par `gen_screens.js` depuis `telegram_bot.js` — texte exact + boutons par ligne._

## sendVid

**Boutons :**
- L1: [💾 Enregistrer (fichier)](SAVE_VID)

## showLook

**Texte :** `📭 Aucun look dans <code>looks/</code>. Envoie-moi une photo pour en ajouter un.`

**Boutons :**
- L1: [◀️ Menu](MAIN_MENU)
- L2: [◀️](GAL_PREV) · [✅ Avatar](GAL_AVATAR) · [🗑](GAL_DEL) · [▶️](GAL_NEXT)
- L3: [✅ Choisir pour la vidéo](GAL_PICK) · [◀️ Récap](RC_BACK)
- L4: [🎨 Éditer ce look](GAL_EDIT) · [🎬 Générer avec](GAL_GEN) · [◀️ Menu](MAIN_MENU)

## step1_topic

**Texte :** `🎬 <b>New Video — Step 1/3: Topic</b>\n\nType your own or choose a theme:`

**Boutons :**
- L1: [🎲 Auto-pick](T_AUTO)

## step2_look

**Texte :** `\U0001f4f8 Step 1/3 — Look`

**Boutons :**
- L1: [✅ Keep current](L_KEEP) · [🎲 Random](L_RANDOM)
- L2: [📷 Upload a photo](L_UPLOAD)

## pickAndShow

**Texte :** `No looks found`

**Boutons :**
- L1: [Use this look](L_KEEP) · [Pick another](L_RANDOM)

## step3_duration

**Texte :** `⏱ <b>Step 3/3: Duration</b>`

**Boutons :**
- L1: [Short 0-25s](D_25) · [Medium 25-40s](D_40) · [Long 40-65s](D_65)

## showSummary

**Texte :** `📸 Look for this video`

**Boutons :**
- L1: [▶️ Start now](GO) · [🔀 Change topic](CHG_TOPIC)
- L2: [📸 Change look](CHG_LOOK) · [❌ Cancel](CANCEL)

## mDur

**Texte :** `⏱️ 2/4 — DURÉE`

**Boutons :**
- L1: [10s](MM_DUR_10) · [20s](MM_DUR_20) · [30s](MM_DUR_30)
- L2: [40s](MM_DUR_40) · [60s](MM_DUR_60)
- L3: [⌨️ Autre durée (taper en sec)](MM_DUR_FREE)

## mTopicShow

**Texte :** `💬 <b>3/4 — TOPIC</b>\n\n`

**Boutons :**
- L1: [✅ Keep](MM_TOPIC_KEEP) · [🔄 New](MM_TOPIC_NEW)
- L2: [✍️ Send](MM_TOPIC_SEND) · [📂 Categories](MM_TOPIC_CATS)

## mCats

**Texte :** `📂 <b>Choose a category:</b>`

**Boutons :**
- L1: [🎲 Random (free topic)](MM_CAT_random)

## mRecap

**Texte :** `📝 Writing the script...`

**Boutons :**
- L1: [✅ START](MM_START) · [🔄 NEW](MM_NEW)
- L2: [⚙️ EDIT](MM_EDIT) · [❌ CANCEL](MM_CANCEL)

## mEditMenu

**Texte :** `⚙️ <b>EDIT — what to change?</b>`

**Boutons :**
- L1: [🖼️ Look](MM_EDIT_LOOK) · [⏱️ Duration](MM_EDIT_DUR)
- L2: [💬 Topic](MM_EDIT_TOPIC) · [📝 Script](MM_EDIT_SCRIPT)
- L3: [⬅️ Back](MM_EDIT_BACK)

## mScriptMenu

**Texte :** `📝 <b>Current script:</b>\n\n`

**Boutons :**
- L1: [✍️ Rewrite](MM_SCRIPT_WRITE) · [🔄 Regenerate](MM_SCRIPT_REGEN)
- L2: [⬅️ Back](MM_EDIT_BACK)

## mLook

**Texte :** `⚠️ No look found. Send a photo:`

**Boutons :**
- L1: [✅ Keep](MM_LOOK_KEEP) · [🔀 Pick another](MM_LOOK_ANOTHER)
- L2: [📷 Upload](MM_LOOK_UPLOAD)

## getQButtons

**Boutons :**
- L1: [✅ Approve](A_YES) · [🔄 Regenerate](A_NEW) · [❌ Cancel](A_NO)
- L2: [✅ Make Part 2](A_YES) · [🔄 Nouvelle vidéo](NEW_GO) · [⏹ Stop](A_NO)
- L3: [✅ Make Part 3](A_YES) · [🔄 Nouvelle vidéo](NEW_GO) · [⏹ Stop](A_NO)
- L4: [▶️ Start](A_YES) · [🔀 New topic](A_TOPIC) · [❌ Cancel](A_NO)
- L5: [✅ YES](A_YES) · [❌ NO](A_NO)

## launch

**Texte :** `⏳ Une génération est déjà en cours — je ne relance pas (anti-doublon). Attends la fin, ou /stop.`

**Boutons :**
- L1: [🔄 Nouvelle vidéo](NEW_GO)

## showSettings

**Texte :** `💬 <b>SOUS-TITRES</b>\n\n🔤 Police: <b>${fontLabel(font)}</b>\n📝 Taille: ${size}px\n📍 Position y: ${y}\n🔡 Espacement: ${letter}\n💬 Incrustés: <b>${subs?`

**Boutons :**
- L1: [🔤 Police suivante](S_FONT)
- L2: [A+ Plus gros](S_SIZE_UP) · [A- Plus petit](S_SIZE_DN)
- L3: [⬆️ Monter](S_Y_UP) · [⬇️ Descendre](S_Y_DN)
- L4: [🔡+ Espacement](S_SP_UP) · [🔡- Espacement](S_SP_DN)
- L5: [↩️ Annuler](UNDO_EDIT) · [✔️ Valider](VALIDATE_STYLE)
- L6: [👁 Aperçu](EDIT_PREVIEW) · [🎯 vs Réf](CMP_REF) · [◀️ Menu](EDIT_HOME)

## maybeAskLookStyle

**Texte :** `🎨 Ce look a des réglages enregistrés. Réutiliser ?`

**Boutons :**
- L1: [✅ Oui (du look)](LS_REUSE)
- L2: [🔄 Base](LS_BASE) · [🎨 Réglages actuels](LS_KEEP)

## routeAfterLook

**Texte :** `✅ Look = avatar + photo de travail.`

**Boutons :**
- L1: [🎨 Édition](EDIT_HOME) · [🎬 Générer](GAL_GEN) · [◀️ Menu](MAIN_MENU)

## showStyles

**Texte :** `📂 Aucun style sauvegardé.\nDans /edit, appuie sur « 💾 Sauvegarder ce style ».`

**Boutons :**
- L1: [🎬](LOADGEN_) · [🗑](DELSTYLE_)
- L2: [◀️ Menu](EDIT_HOME)

## offerReadyToPost

**Texte :** `Garder cette vidéo ?`

**Boutons :**
- L1: [✅ Prêt à poster](READY_)

## showReady

**Texte :** `📤 <b>PRÊT À POSTER</b>\n\nVide pour l\`

**Boutons :**
- L1: [◀️ Menu](MAIN_MENU)
- L2: [◀️ Menu](MAIN_MENU)

## runLocalTest

**Texte :** `⛔ Une vidéo est en cours — /test refusé (anti-conflit).`

**Boutons :**
- L1: [🚀 Générer pour de vrai](TEST_GEN) · [🎨 Éditer](EDIT_HOME) · [👁 Aperçu](EDIT_PREVIEW) · [◀️ Menu](MAIN_MENU)

## recapKb

**Boutons :**
- L1: [👤 Changer le look](RC_LOOK)
- L2: [🎨 Modèle](RC_STYLE) · [💬 Sujet](RC_SUBJ) · [🔄 Autre sujet](RC_NEWTOPIC)
- L3: [⏱ 15s](RC_DUR_15) · [23s](RC_DUR_23) · [30s](RC_DUR_30) · [⌨️ Libre](RC_DUR_FREE)
- L4: [🚀 GO](RC_GO) · [❌ Annuler](RC_CANCEL)

## showRecap

_(pas de boutons inline)_

## recapGo

**Texte :** `⏳ Une génération est déjà en cours — /stop d\`

_(pas de boutons inline)_

## showScriptCard

**Texte :** `\n\n📝 <b>SCRIPT</b> (`

**Boutons :**
- L1: [✅ Valider](GJ_OK) · [🔄 Nouveau](GJ_NEW)
- L2: [🎣 Hooks A/B](GJ_HOOKS) · [📂 Catégorie](GJ_CAT)
- L3: [✏️ Texte](GJ_EDIT) · [💾 Garder](GJ_SAVESCRIPT)
- L4: [📄 Script complet](GJ_FULL)
- L5: [❌ Annuler](GJ_CANCEL)

## genScriptStep

**Texte :** `❌ Script: `

_(pas de boutons inline)_

## genHooks

**Texte :** `⚠️ Aucun script.`

**Boutons :**
- L1: [🅰 Hook A](GJ_HOOK_0) · [🅱 Hook B](GJ_HOOK_1)
- L2: [◀️ Garder le script actuel](GJ_SHOWSCRIPT)

## genAfterScript

**Boutons :**
- L1: [👁 Maquette (~centimes)](GJ_MOCK) · [🚀 GO](GJ_GO)
- L2: [✏️ Modifier](GJ_MODIFY) · [❌ Annuler](GJ_CANCEL)

## genMockup

**Texte :** `⚠️ Aucun script validé.`

**Boutons :**
- L1: [⛔ Annuler](GJ_CANCEL)
- L2: [🚀 GO définitif](GJ_GO)
- L3: [✏️ Modifier](GJ_MODIFY) · [❌ Annuler](GJ_CANCEL)

## genFinal

**Texte :** `⚠️ Aucun script en attente.`

**Boutons :**
- L1: [⛔ Annuler](GEN_ABORT)
- L2: [✅ Postable](GF_POST_) · [🔧 À retravailler](GF_REWORK_)
- L3: [🎨 Restyler](GF_RESTYLE_) · [🖼 Cover](COVER_OPEN_)
- L4: [📁 Fichiers](GF_FILES_) · [♻️ Régénérer](MENU_GEN) · [◀️ Menu](MAIN_MENU)

## showCover

**Texte :** `⚠️ Covers indisponibles.`

**Boutons :**
- L1: [◀️](COVER_PREV) · [✅ Choisir cette cover](COVER_PICK) · [▶️](COVER_NEXT) · [◀️ Retour](MAIN_MENU)

## showMainMenu

**Texte :** `🏠 <b>MENU</b>\n\nQue veux-tu faire ?`

**Boutons :**
- L1: [🎬 Générer une vidéo](MENU_GEN) · [⚡ Express](EXPRESS_NEW)
- L2: [🎨 Éditer le look](EDIT_HOME) · [👤 Looks](MENU_LOOKS)
- L3: [💾 Modèles](SHOWSTYLES) · [📤 Prêt à poster](SHOWREADY)
- L4: [📁 Fichiers](FILES_HOME) · [👁 Preview](EDIT_PREVIEW) · [🧪 Test](MENU_TEST)
- L5: [🛑 Stop](TECH_STOP) · [⚙️ Technique](MENU_TECH) · [❓ Aide](MENU_HELP)

## showFilesMenu

**Texte :** `📁 <b>FICHIERS</b>\n\n📱 <b>Sur iPhone</b> : app <b>Fichiers</b> → <b>iCloud Drive</b> → <b>podcast-outputs</b>\n(générations, ready_to_post, a_retravailler, raws, légendes — tout y est en synchro auto).\n\nOu tape une catégorie pour recevoir un fichier ici :`

**Boutons :**
- L1: [🎬 Vidéos](FCAT_vid) · [🖼 Images](FCAT_img)
- L2: [📄 Légendes](FCAT_txt) · [📤 Prêt à poster](FCAT_ready)
- L3: [👤 Looks](FCAT_looks) · [◀️ Menu](MAIN_MENU)

## showFileList

**Boutons :**
- L1: [◀️ Catégories](FILES_HOME)
- L2: [◀️](FPAGE_) · [▶️](FPAGE_)
- L3: [◀️ Catégories](FILES_HOME)

## navRow

**Boutons :**
- L1: [👤 Looks (changer la photo)](EDIT_LOOKS)
- L2: [↩️ Annuler](UNDO_EDIT) · [✔️ Valider](VALIDATE_STYLE)
- L3: [↔️ Avant/Après](BEFORE_AFTER) · [🎯 vs Réf](CMP_REF) · [◀️ Menu](EDIT_HOME)

## openPanel

_(pas de boutons inline)_

## showEditHome

**Texte :** `🎛 <b>ÉDITION DU LOOK</b>\n\n📸 Photo de travail : <b>`

**Boutons :**
- L1: [👤 Looks (changer la photo)](EDIT_LOOKS)
- L2: [💬 Sous-titres](EDIT_SUBS) · [🎨 Image](EDIT_IMG)
- L3: [🎨 Presets](SHOW_PRESETS) · [🎬 Zooms](EDIT_ZOOM)
- L4: [🎵 Musique](EDIT_MUS) · [🎙 Réactions](EDIT_REACT)
- L5: [💾 Sauvegarder](SAVESTYLE) · [📂 Modèles](SHOWSTYLES)
- L6: [👁 Aperçu complet](EDIT_PREVIEW)

## showPresets

**Texte :** `🎨 <b>PRESETS COULEUR</b> — applique en 1 tap (puis 👁 Aperçu) :`

**Boutons :**
- L1: [🎨 Section Image](EDIT_IMG) · [◀️ Édition](EDIT_HOME)

## imageKb

**Boutons :**
- L1: [🎛 Ajuster](EDIT_IMGADJ) · [🎨 Filtres](SHOW_PRESETS) · [✨ Effets](EDIT_IMGFX)

## imageAdjKb

**Boutons :**
- L1: [➖](IMG_BR_DN) · [➕](IMG_BR_UP)
- L2: [➖](IMG_CT_DN) · [➕](IMG_CT_UP)
- L3: [➖](IMG_SA_DN) · [➕](IMG_SA_UP)
- L4: [🔥](IMG_TE_DN) · [❄️](IMG_TE_UP)
- L5: [🔄 Base](IMG_RESET) · [◀️ Image](EDIT_IMG)

## imageFxKb

**Boutons :**
- L1: [➖](IMG_SH_DN) · [➕](IMG_SH_UP)
- L2: [➖](IMG_VI_DN) · [➕](IMG_VI_UP)
- L3: [✨ Glow (peau douce)](IMG_PRE_Glow)
- L4: [🔄 Base](IMG_RESET) · [◀️ Image](EDIT_IMG)

## subsKb

**Boutons :**
- L1: [A+ Taille](S_SIZE_UP) · [A-](S_SIZE_DN)
- L2: [⬆️ Monter](S_Y_UP) · [⬇️ Descendre](S_Y_DN)
- L3: [🔡+ Espace](S_SP_UP) · [🔡- Espace](S_SP_DN)

## zoomKb

**Boutons :**
- L1: [💪- ](ZM_IN_DN) · [💪+](ZM_IN_UP)
- L2: [⏱- ](ZM_DU_DN) · [⏱+](ZM_DU_UP)

## musicKb

**Boutons :**
- L1: [🔊- ](MU_VOL_DN) · [🔊+](MU_VOL_UP)

## showEditZoom

**Texte :** `🎬 <b>ZOOMS</b>\n\n🎬 État: <b>${z.on?`

**Boutons :**
- L1: [💪+ Intensité](ZM_IN_UP) · [💪- Intensité](ZM_IN_DN)
- L2: [⏱+ Durée](ZM_DU_UP) · [⏱- Durée](ZM_DU_DN)
- L3: [🔁 Fréquence (tous / 1 sur 2)](ZM_FREQ)
- L4: [↩️ Annuler](UNDO_EDIT) · [✔️ Valider](VALIDATE_STYLE)
- L5: [👁 Aperçu](EDIT_PREVIEW) · [🎯 vs Réf](CMP_REF) · [◀️ Menu](EDIT_HOME)

## showEditMusic

**Texte :** `🎵 <b>MUSIQUE</b>\n\n🎵 État: <b>${m.on?`

**Boutons :**
- L1: [⏭ Fichier suivant](MU_FILE)
- L2: [🔊+ Volume](MU_VOL_UP) · [🔊- Volume](MU_VOL_DN)
- L3: [↩️ Annuler](UNDO_EDIT) · [✔️ Valider](VALIDATE_STYLE)
- L4: [👁 Aperçu](EDIT_PREVIEW) · [🎯 vs Réf](CMP_REF) · [◀️ Menu](EDIT_HOME)

## runPreview

**Texte :** `⚠️ Aucune photo de travail. Choisis un look 👤 ou lance un /go.`

**Boutons :**
- L1: [🎨 Éditer](EDIT_HOME) · [🧪 Test vidéo](MENU_TEST) · [🎬 Générer](MENU_GEN) · [◀️ Menu](MAIN_MENU)

## handle

**Texte :** `🎬 Tu as des réglages d\`

**Boutons :**
- L1: [✅ Garder les réglages](GEN_KEEP) · [🔄 Repartir de la base](GEN_RESET)
- L2: [🎨 Modèle actuel (ne pas changer)](RC_ST_CUR)
- L3: [◀️ Récap](RC_BACK)
- L4: [🎲 Auto (tous sujets)](RC_SUBJ_AUTO) · [⌨️ Le mien](RC_SUBJ_MINE)
- L5: [◀️ Récap](RC_BACK)
- L6: [✏️ Texte](GJ_EDIT) · [🎨 Modèle](GJM_STYLE) · [👤 Look](GJM_LOOK) · [⏱ Durée](GJM_DUR) · [◀️ Retour](GJ_SHOWSCRIPT)
- L7: [◀️ Retour au script](GJ_SHOWSCRIPT)
- L8: [✅ Postable](GF_POST_) · [🔧 À retravailler](GF_REWORK_)
- L9: [🎨 Éditer encore](EDIT_HOME) · [🎨 Restyler à nouveau](GF_RESTYLE_)
- L10: [ℹ️ Statut](TECH_STATUS)
- L11: [🔄 Redémarrer le bot](TECH_RESTART)
- L12: [⏹ Tout arrêter](TECH_STOP)
- L13: [◀️ Menu](MAIN_MENU)
- L14: [Generate Video](SCRIPT_OK) · [Regenerate](AUTO_ALL) · [Cancel](CANCEL)
- L15: [🔄 Nouvelle vidéo](NEW_GO)
- L16: [⚡ Sur-mesure](MANUAL_GO) · [🎲 Aléatoire](AUTO_ALL) · [🚀 Express](EXPRESS_GO)
- L17: [🔄 Nouvelle vidéo](NEW_GO)
- L18: [🎨 Édition](EDIT_HOME)
- L19: [🎬 Générer avec](GAL_GEN) · [◀️ Menu](MAIN_MENU)
- L20: [✅ Keep](MM_LOOK_KEEP) · [🔀 Pick another](MM_LOOK_ANOTHER)
- L21: [📷 Upload](MM_LOOK_UPLOAD)
- L22: [✅ Use this photo](L_KEEP) · [📷 Send another](L_UPLOAD)
- L23: [➕ Ajouter aux looks](ADD_LOOK)
- L24: [🖼 Ajouter + utiliser comme avatar](ADD_LOOK_AVATAR)
- L25: [🎯 Définir comme référence (côte-à-côte)](REF_SET)
- L26: [❌ Ignorer](ADD_IGNORE)
- L27: [🔄 Nouvelle vidéo](NEW_GO)


---
_50 écrans extraits._

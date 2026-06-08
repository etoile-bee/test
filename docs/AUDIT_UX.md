# AUDIT UX EXHAUSTIF — Bot Podcast Workflow

_Audit lecture seule, état `STABLE-1` (08/06/2026). Aucune modification de code._
_Sources : `telegram_bot.js` (2654 l.), `workflow.js`, `render_local.js`, `newlook.js`, `SCREENS.md` (régénéré 08/06, 58 écrans), `logs/ui_journal.jsonl` (1868 événements réels d'Etoile, 07→08/06, ~13 h)._

---

## A. VUE D'ENSEMBLE DU PARCOURS

### Schéma texte — parcours réels

```
ENTRÉES (plusieurs portes, incohérentes) :
  /go, /start, /menu, /studio ─┐
  showMainMenu (MENU_GEN)      ├─► CARTE RÉCAP (cockpit)  ◄── voie CIBLE (conforme)
  Express (EXPRESS_NEW)        ─┘
        │
        ▼
  CARTE RÉCAP  (recapKb : 👤 look · 🎨 modèle · 💬 sujet · ⏱ durée · 🚀 GO)
        │ RC_GO → recapGo()
        ▼
  SCRIPT CARD  (showScriptCard : ✅ Valider · 🔄 Nouveau · 🎣 Hooks · 📂 Catégorie · ✏️ Texte · 📄 Complet)
        │ GJ_OK → genAfterScript()
        ▼
  RÉCAP COÛT   (genAfterScript : 💰 cr + voix ≈ €  ·  ⏳ ~min  ·  [👁 Maquette ~centimes] [🚀 GO])
        │                                   │
        │ GJ_MOCK → genMockup()             │ GJ_GO → genFinal()
        ▼  (preview ~centimes, raw caché)   ▼
  MAQUETTE  ──[🚀 GO définitif]────────►  GÉNÉRATION (voix→avatar→lipsync Kling→rendu ffmpeg)
                                            │  ⛔ Annuler (genAbort)
                                            ▼
                                       VIDÉO LIVRÉE (bloc RÉSULTATS)
                                       videoReadyKb : ✅ Postable · 🔧 Retravailler · 🎨 Restyler ·
                                                      🖼 Cover · 📋 Légende · 📁 Dossier · ➕ Partie suivante

VOIE LEGACY PARALLÈLE (à retirer — contourne récap/maquette) :
  showSummary(▶️ GO=GO) · mRecap(MM_START) · MANUAL_GO · EXPRESS_GO · AUTO_ALL · SCRIPT_OK
        └────────────────────────► launch()  (telegram_bot.js:659) → spawn workflow.js
                                    (approbations getQButtons A_YES/A_NO ; PAS de maquette)

PHOTO (parallèle) :
  /newlook → panneau config (catégorie/décor/mode) → 💰 RÉCAP → NL_GO
        → résultats (eco 720p par défaut) → NL_NAV ‹ › · NL_KEEP · 💎 HD · 🎬 Vidéo avec

ÉDITION (transverse) :
  /edit → ÉDITION DU LOOK → Sous-titres / Image (Ajuster/Filtres/Effets) / Zooms / Musique / Réactions
        → ↩️ Annuler · ✔️ Valider · ↔️ Avant/Après · 🎯 vs Réf · 👁 Aperçu
```

### Les 3 blocs statiques (architecture cible, validée Etoile)
- **BLOC 1 — PHOTO** (`newlook.mediaId`) : panneau `/newlook`, auto-édité via `nlMedia()` (telegram_bot.js:197).
- **BLOC 2 — VIDÉO** (`cockpit.mid`) : carte récap → script → maquette → progression, via `cockpitPhoto/Video/Caption` (1454-1470).
- **BLOC 3 — RÉSULTATS** (`results.mid`) : toutes les livraisons, navigables `‹ ›` via `editPhotoKb/editVideoKb` (1420-1439).

**Constat structurant** : l'architecture est saine *sur le papier*, mais **3 générations de flux cohabitent** (carte `RC_*/GJ_*` récente + assistant anglais `step1/2/3` + mode manuel `MM_*` + auto `AUTO_ALL/EXPRESS_GO/MANUAL_GO`). Plusieurs portes mènent à des chemins différents, dont un (legacy `launch()`) qui **saute la maquette et le récap coût**.

---

## B. TABLEAU ÉCRAN PAR ÉCRAN

| Écran (fn) | Rôle | Taps pour avancer | Frictions | Conformité consignes |
|---|---|---|---|---|
| `showMainMenu` (268) | Hub | 1 | `/stop` & technique en **dernière** ligne (L5), pas en tête | ⚠️ stop pas prioritaire |
| `recapKb`/`showRecap` (978-1017) | Carte récap vidéo | 1 (🚀 GO) | bon ; pas de fil d'Ariane explicite | ✅ 1 média + 💰 |
| `showScriptCard` (1064) | Script affiché + éditable | 1 (✅ Valider) | 5 rangées de boutons = dense | ✅ script avant dépense |
| `genAfterScript` (239 SCREENS) | Récap coût + durée | 1 (🚀 GO / 👁 Maquette) | durée annoncée « ~min » sous-estimée | ✅ 💰+⏳ / ⚠️ durée |
| `genMockup` (1117) | Maquette ~centimes | 1 (🚀 GO définitif) | aperçu voix sans retour audible/visuel | ✅ maquette avant Kling |
| `genFinal` (1134) | Génération réelle | — (⛔ Annuler) | progression peu détaillée ; longue attente | ⚠️ feedback temps |
| `videoReadyKb` (127) | Vidéo livrée | actions 1 tap | riche et clair | ✅ postable/rework/restyle |
| `/newlook` panneau (234) | Config photo | 2-3 (cat/mode/GO) | **cascades de doublons** (cf. ui_journal) | ✅ éco→HD / ⚠️ spam réel |
| galerie looks (`showLook` 17) | Choix look | 1 par photo | `GAL_NEXT` × **126** : défilement 1-par-1 sur 59 looks | ✅ newest-first, Éditer / ⚠️ pas de grille |
| `showEditHome` (306) | Édition look | 1 par section | vocabulaire de retour hétérogène | ✅ tout éditable |
| sous-panneaux Image/Subs/Zoom/Musique | Réglages ± | 2 taps/réglage | Avant/Après manuel (pas auto) | ✅ avant/après dispo |
| `showFilesMenu` (279) | Fichiers | 1 | renvoie bien vers iCloud | ✅ clair |
| `showReady` (180) | Prêt à poster | 1 | OK | ✅ |
| **legacy** `step1/2/3`, `getQButtons`, `mRecap`, `launch` | Anciens flux | variable | **en anglais**, doublons, **sautent maquette/récap** | ❌ incohérent / anti-dépense partiel |

---

## C. CONFORMITÉ AUX CONSIGNES D'ETOILE (✅/⚠️/❌ + preuve)

| # | Consigne | Verdict | Preuve (fichier:ligne / ui_journal) |
|---|---|---|---|
| 1 | Un seul écran auto-édité, **zéro spam** | ⚠️ | Architecture in-place existe (`nlMedia` 197, `cockpit*` 1454-70, `cardSig` 1011). **Mais en réel : 12× « message is not modified » + 6× « editMessageMedia refus » → fallback `sendPhoto` = doublons** (ui_journal 20:13:28→20:37:07) ; ~79% des sorties `edited_in_place:false`. Règle visée, **pas tenue en pratique**. |
| 2 | Style ÉDITION partout (1 média, légende 1 ligne, boutons courts, 💰 payants) | ✅⚠️ | Respecté sur carte/scriptcard/récap ; 💰 sur `NL_GO`, `👁 Maquette (~centimes)`, GO. ⚠️ écrans **legacy en anglais** (`step1_topic`, `getQButtons`, `Generate Video`) + multi-messages `/gens` `/ideas` `/probe` `GF_FILES_*`. |
| 3 | Script **toujours affiché & modifiable avant toute dépense** | ✅⚠️ | Voie carte : `showScriptCard` (✏️ Texte/📄 Complet) + `ttsCheck` (1340) avant tout TTS. ⚠️ Voie legacy `GO`(1901)→`SCRIPT_OK`(1922)→`launch()` génère puis lance avec `autoAnswers` sans maquette. |
| 4 | Maquette avant Kling | ✅⚠️ | `genMockup` (1117) utilise le **raw caché** (~centimes) puis `🚀 GO définitif`. ⚠️ `launch()` (659) ne passe pas par la maquette. |
| 5 | Images test éco avant HD/vidéo | ✅ | éco = défaut (telegram_bot.js:266) ; HD conditionnel (278) ; HD = `batch_size=4` (newlook.js:135). |
| 6 | Avant/après à chaque réglage | ✅⚠️ | `BEFORE_AFTER`, `CMP_REF` dans `navRow` (295-300). ⚠️ **manuel**, pas automatique après chaque slider. |
| 7 | Tout éditable/réversible jusqu'au bout | ✅ | `pushHistory`/`UNDO_EDIT` (2135), restyle d'une vidéo livrée `GF_RESTYLE_*` (1813+). |
| 8 | Retour possible partout + **fil d'Ariane** | ⚠️ | Fil d'Ariane dans `/newlook` (①②③④) et anciens `step 1/3`. Carte récap **sans breadcrumb**. Retours présents mais vocabulaire hétérogène (◀️ Menu / ◀️ Récap / ◀️ Retour). |
| 9 | Photo look/avatar **toujours visible** (jamais l'image par défaut) | ✅⚠️ | `recapFrame` rend le look stylé (1002) ; `nlCover` fallback **seulement si vide** (161-174). ⚠️ placeholder générique si dossier `references/` manquant (edge). |
| 10 | Galerie défile **en place** + Éditer sur chaque + derniers uploadés en premier | ✅⚠️ | Tri **newest-first** (telegram_bot.js:336) ; `GAL_EDIT` présent ; nav in-place. ⚠️ une photo à la fois → `GAL_NEXT` pressé **126×** (friction réelle). |
| 11 | Sous-titres **76px / OY 0.370** verrouillés | ✅ | `subtitle_style.js:8-9` (76 / 0.370) + hook commit-msg. `render_local` lit ce fichier d'abord (300-301). |
| 12 | Couleur **V5** | ⚠️ | `color_style.js` définit V5 (sat 0.88, bt709). **Mais** `render_local` applique `style.json`/`FX_DEFAULT` (différent : sat 1.0) sauf si configuré (71-90, 311). À clarifier : la prod applique-t-elle réellement V5 ? |
| 13 | Réactions naturelles / off | ✅ | défaut `natural` (render_local.js:76) ; `OFF` dispo (`RE_OFF`). |
| 14 | Son **-14 LUFS** | ✅ | `loudnorm=I=-14:TP=-1.5:LRA=11` (render_local.js:366). |
| 15 | Récap avec **coût + durée de création** | ✅⚠️ | `genAfterScript` : `💰 … ≈ €` + `⏳ ~${mins} min`. ⚠️ durée affichée « 2 à 5 min » alors que polling jusqu'à **45 min** (workflow.js:133). |
| 16 | Catégories de sujets + anti-répétition | ✅ | `RC_CAT_*`/`GJ_CAT` ; `topic_history.json`. |
| 17 | Durée libre 15 s–2 min | ✅ | `RC_DUR_FREE` / `MM_DUR_FREE`. |
| 18 | Partie suivante | ✅ | `GF_ADDPART_*` (videoReadyKb L4). |
| 19 | Prêt à poster / à retravailler | ✅ | `GF_POST_*` / `GF_REWORK_*` (1813+). |
| 20 | Restyle gratuit | ✅ | `GF_RESTYLE_*` → édition + rendu **local** (ffmpeg, €0). |
| 21 | Légendes copiables | ✅ | `GF_LONG_*` / légende dédiée. |
| 22 | Noms de looks lisibles | ⚠️ | `lookbook.json` recettes nommées ; lisibilité réelle des libellés à confirmer côté galerie. |
| 23 | Pas de « pause » prononcé | ✅ | `tts_sanitize.js` → SSML `<break>` + `stripPauseTokens` (render_local.js:109). |
| 24 | Pas de bug « status » | ✅ | `validTTS`/`TTS_BAD` (1337-1342) bloque ; **0 TTS suspect** dans ui_journal. |
| 25 | Annulation qui marche | ✅⚠️ | `genAbort` + `abortFn` polling (workflow.js:122). ⚠️ **perçue peu fiable** : 22× `/restart`, 9× `/stop`, 8× « Nothing running », spirale 19:32→19:42 (ui_journal). |
| 26 | `/stop` + `/restart` **en tête de menu** | ❌⚠️ | Commandes existent, mais dans `showMainMenu` `🛑 Stop` est en **L5** (dernière) et `/restart` sous `⚙️ Technique`. Pas en tête. |
| 27 | Persona multi (scaffold) | ✅ | `PERSONA_*` (1781) + `personas.json`. |

**Score de conformité global : ~72 %** — 16 ✅, 9 ⚠️, 2 ❌ (sur 27).
Le socle « anti-dépense + style verrouillé » est **solide** ; les manques sont surtout **l'exécution de la règle « zéro spam »** et la **dette des flux multiples**.

---

## D. TOP FRICTIONS CLASSÉES PAR IMPACT

1. **🔴 CRITIQUE — Doublons de messages (la règle n°1 cassée en réel).** `editMessageText/Media` rejeté « message is not modified » quand l'état n'a pas changé → fallback `sendPhoto`/`sendMessage` → panneaux empilés. **9 échecs en 24 min** (ui_journal 20:13→20:37), Etoile finit par abandonner et `/newlook` à nouveau. Cause : pas de détection « no-op » avant l'edit (sauf `cardSig` sur la carte).

2. **🔴 CRITIQUE — Erreurs API opaques (crédits épuisés).** « ❌ Script: 400 credit balance too low » non actionnable → **7 échecs sur 1 h 04**, Etoile relance 5× sans comprendre (ui_journal 23:28→00:33). Pas de message clair « recharge » ni d'arrêt des relances.

3. **🟠 ÉLEVÉ — Trois flux de génération concurrents.** Carte `RC_*/GJ_*` (conforme) vs legacy `launch()` (`GO`/`SCRIPT_OK`/`MM_START`/`AUTO_ALL`/`EXPRESS_GO`, l. 659/1901/1922/1951/1985) vs assistant anglais `step1/2/3`. La voie legacy **saute maquette + récap coût** (risque dépense) et laisse de l'**anglais** à l'écran. Le dev l'a déjà constaté (commentaire l.1998).

4. **🟠 ÉLEVÉ — Annulation/attente perçues peu fiables.** 22 `/restart` + 9 `/stop` + 8 « Nothing running » + spirale stop/restart (19:32→19:42). La génération longue sans feedback pousse Etoile à utiliser `/stop`+`/restart` comme bouton reset.

5. **🟡 MOYEN — Galerie 1-par-1.** `GAL_NEXT` pressé **126×** pour 59 looks : pas de grille ni pagination, navigation lente et fatigante.

6. **🟡 MOYEN — Temps de prod sous-estimé.** « 2 à 5 min » affiché vs polling jusqu'à 45 min (workflow.js:133) → anxiété, déclenche les `/stop`.

7. **🟡 MOYEN — Aperçu voix sans feedback.** `GJ_MOCK` cliqué **3× en 90 s** (ui_journal 16:24-16:26) : rien n'indique que l'audio joue.

8. **🟢 FAIBLE — `/stop`/`/restart` non prioritaires** dans le menu (consigne 26).

---

## E. CE QUI MARCHE BIEN (À GARDER ABSOLUMENT)

- **Architecture 3 blocs auto-édités** (cockpit / newlook / results) : la bonne idée structurelle — à fiabiliser, pas à jeter.
- **Garde-fous anti-dépense de la voie carte** : script affiché+éditable, `ttsCheck` (1340), **maquette ~centimes** avant Kling, **récap coût** `💰+⏳`, `genAbort` réel. Excellent socle.
- **Source unique de style** : `subtitle_style.js` (76/0.370) + `color_style.js` (V5) + **verrou git** → reproductibilité.
- **Éco → HD** (jamais HD direct) et **restyle 100 % local gratuit** (ffmpeg).
- **Galerie newest-first**, recettes de looks mémorisées (`lookbook.json`), archive `/gens`.
- **Qualité technique** : -14 LUFS, sanitize « pause », réactions naturelles par défaut, étiquette bt709.
- **Transparence coût** : 💰 sur chaque bouton payant.
- **videoReadyKb** : sorties claires (postable / retravailler / restyle / cover / légende / partie suivante).

---

## F. RECOMMANDATIONS PRIORISÉES — « reprendre de A à Z » sans jeter ce qui marche

### ⚡ Quick wins (faible effort, fort impact — s'appuient sur l'existant)
1. **Tuer les doublons** : généraliser la signature d'état `cardSig` (déjà sur la carte, ~1011) à `nlMedia` et aux panneaux ; **ne jamais appeler `editMessage*` si la signature est inchangée** (no-op silencieux). Supprime les cascades « not modified ». *(Friction 1)*
2. **Erreurs actionnables** : détecter `400 credit balance` / quotas → **un seul** message clair (« Crédits épuisés — recharge, je n'insiste pas ») + **stop des relances auto**. Étendre `errExplain` (~1041) déjà présent pour le réseau. *(Friction 2)*
3. **Temps honnête + progression** : afficher « ~2–10 min (parfois plus) » + ticker d'étape vivant, `⛔ Annuler` toujours visible. *(Frictions 4, 6)*
4. **`/stop` & `/restart` en tête** du `showMainMenu` (déplacer L5→L1). *(Consigne 26)*
5. **Feedback aperçu voix** : libellé « 🔊 Lecture… écoute sur ton téléphone » + anti-double-tap. *(Friction 7)*

### 🛠 Refontes ciblées (plus de travail, mais réutilisent le socle)
6. **Un seul flux de génération** : garder la voie **carte `RC_*/GJ_*`** ; **retirer/désactiver** `launch()` legacy + `GO`/`SCRIPT_OK`/`MM_*`/`AUTO_ALL`/`EXPRESS_GO`/`MANUAL_GO` et les écrans anglais `step1/2/3`/`getQButtons`. Finir ce que `NEW_GO` (l.1998) a commencé. → supprime l'anti-dépense contournable + l'anglais + la confusion. *(Friction 3, consignes 1-4)*
7. **Galerie en grille / pagination** (planche de vignettes, sauts de page) au lieu du 1-par-1. *(Friction 5)*
8. **Framework de panneau in-place unique** : un helper garantissant « 1 message par bloc » avec diff de signature + fallback média/légende sûr, utilisé par les 3 blocs (factorise `nlMedia`/`cockpit*`/`editPhotoKb`). *(Friction 1)*
9. **Clarifier la couleur V5** : garantir que la prod applique bien `color_style.js` V5 (et non `FX_DEFAULT` de `style.json`). *(Consigne 12)*
10. **Fil d'Ariane homogène** sur la carte vidéo (Look ▸ Sujet ▸ Durée ▸ Script ▸ Maquette ▸ GO) + vocabulaire de retour unifié. *(Consigne 8)*

---

_Fin de l'audit. Données issues du code à l'état `STABLE-1` et des sessions réelles `logs/ui_journal.jsonl`._

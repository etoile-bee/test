# AUDIT COMPLET — Podcast Workflow

> **Audit lecture seule, 2026-06-09.** Aucune modification de code, aucun restart.
> Référentiel : `docs/EXIGENCES.md` (E1–E73). Sources de preuve : `telegram_bot.js` (2916 l.),
> `newlook.js`, `workflow.js`, `render_local.js`, `SCREENS.md` (régénéré, 61 écrans),
> `logs/ui_journal.jsonl` (3146 événements réels), `bot_journal.log`, dossiers `outputs/`.
> Méthode : lecture du code (file:line), intégrité des callbacks (251 boutons / 261 handlers),
> fouille des journaux réels, vérification disque. **Score de conformité global : ~64 %**
> (36 Conforme, 22 Partiel, 15 Non conforme/Manquant sur 73).

---

## 1. TABLEAU DE TRAÇABILITÉ (E1–E73)

Statuts : ✅ Conforme · 🟡 Partiel · 🟠 Non conforme · ⬜ Manquant · 🔁 Régressé · 🔴 Cassé.

### A. Architecture & principes globaux
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E1 cockpit unique | 🟡 | `cardMenu`:1072 (29), `cockpitPhoto`:1663 (11), `cockpitCaption`:1680 (12) = 52 in-place ; **85 `send()`** dans les handlers (1960-2600) | Cœur du parcours morphe en place ; flux secondaires (livraisons GF_*, légendes, upload, erreurs) empilent des messages. |
| E2 cockpit 2 sections PHOTO/VIDÉO | 🟡 | newlook.mediaId (photo), cockpit.mid (vidéo), results.mid (résultats) = 3 blocs | Sections existent et se connectent (NL_VIDEO:2495) mais ce sont 3 messages séparés, pas un cockpit 2-sections unifié. |
| E3 style ÉDITION | 🟡 | carte/script/récap conformes ; reliquats anglais `❌ CANCEL`:687, `⬅️ Back` | Respecté sur le cœur ; legacy anglais + multi-messages secondaires. |
| E4 nav OK/Annuler/Préc/Suiv + fil d'Ariane unifié | 🟡 | `journey()`:1052 rendu seulement Script:1170 & Maquette:1216 ; 5 conventions pagination ; vocabulaire retour non unifié | cf. §3. |
| E5 conservation d'état | ✅ | genState/save/load:889-891, workingSource:1499, gwReset:1049, SESSION_VARS:1948 | Look/décor/params persistés + multi-chat. |
| E6 reprise crash/restart | ✅ | boot loadState+resLoad+genFoldersLoad:2914 ; stale-fix staleBloc/freshBloc:1631 | Correct (mids périmés recréés frais). |
| E7 Manuel vs Auto séparés, Auto fiable | 🟡 | showCreer:1432 (Express/Sur-mesure/Auto), recapGo(auto):1159 | Modes séparés ✅. Fiabilité Auto non prouvée (bloquée par crédits Anthropic épuisés) ; Auto exige quand même GJ_GO. |
| E8 prévisualisation avant chaque validation | 🟡 | look=image, maquette:1223, récap coût:1214 | Look/vidéo/coût OK ; décor/prompt/légende sans aperçu dédié. |
| E9 multi-persona | 🟡 | personas.json, activePersona:166, personaOutDir:168 | Scaffold ; getLooksDir/fileCat **pas** branchés persona (cf. MAPPING §persona). |

### B. Coûts & argent
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E10 aucune gén. payante sans accord | ✅ | runNewLook accessible via NL_GO2:2417 (après récap) ; genFinal via GJ_GO:2081 (après récap) | Chaque appel payant précédé d'un récap+confirm. |
| E11 récap coût+crédits+temps + 💲 | ✅ | NL_GO récap:2405, nlPayRecap:359, genAfterScript:1215, estimateCost:900 | Look et vidéo chiffrés (cr+€) avant dépense. |
| E12 éco d'abord | ✅ | défaut mode 'eco':172, HD conditionnel:350 | |
| E13 maquette avant Kling | ✅ | genMockup:1223 (audio+rendu local, pas Kling) | Anti double-tap:1225. |
| E14 coûts/temps honnêtes | 🟡 | prodTimeLabel "~3-10 min":1126 vs poll Kling **45 min** workflow.js:133,150 ; label HD "1080p":2505 contredit la dé-trompe:368 | Temps optimiste ; libellé HD trompeur résiduel. |

### C. Looks
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E15 créer | ✅ | newlook.js generateLook:129, NL_GO/NL_GO2 | Depuis réf Imany, seedream 9:16. |
| E16 modifier | 🟡 | NL_EDIT:2445, GAL_EDIT:2234 → éditeur image | Édite l'image (filtres) ; pas les attributs (tenue/décor/nom). |
| E17 dupliquer | ⬜ | aucun callback DUP | Inexistant. |
| E18 supprimer | 🟡 | GAL_DEL:2241 → looks/_trash | Réversible, mais aucune restauration UI. |
| E19 archiver | ⬜ | — | Pas d'archivage distinct. |
| E20 réutiliser | ✅ | GAL_PICK:2225, CL_GAL:1980, /look:2806 | Re-sélection + recettes recréables. |
| E21 lock/déverrouiller | ⬜ | — | Aucun verrou par look. |
| E22 galerie grille | ✅ | showGallery 3×3:501, pagination GLP_:509, tri récents:408 | Conforme. |
| E23 noms lisibles | 🟡 | lookName:413 ("Look N · date") | Dérivé du fichier ; pas renommable. |

### D. Décors
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E24 décor même écran que tenue | ✅ | nlConfig:311 ([👗][🌆]), NL_MENU_ENV:2392 | In-place. |
| E25 décors = CRUD comme looks | 🟠 | sélection seule NL_SET_ENV_:2394, STUDIO_DECORS lecture seule:2000 | Aucun create/edit/dup/del/archive/lock ; éditable seulement dans lookbook.json. |
| E26 Lock Background | ⬜ | — | Inexistant. |
| E27 3 décors base | ✅ | lookbook.envs bougies/jour/studio | Extensibles via JSON (pas via UI). |

### E. Prompts
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E28 visibles | 🟡 | /prompt:2764, defaultPrompt newlook.js:33 | UN seul prompt de base ; prompts par-tenue (outfits_catalog 234) / décor non exposés. |
| E29 éditables | ✅ | PROMPT_EDIT:2273, /prompt <texte>:2772 | Prompt de base. |
| E30 sauvegardables | ✅ | writeFileSync+.bak:2582 | Un seul slot. |
| E31 dupliquables | 🟠 | — | Aucune duplication. |
| E32 supprimables | 🟠 | PROMPT_RESET:2274 (reset only) | Pas de suppression. |
| E33 réutilisables | 🟡 | defaultPrompt réinjecté:94 | Mono-prompt, pas de bibliothèque. |
| E34 sans changer d'écran | 🔁 | /prompt ouvre un message séparé:2768, hors nlMedia | Viole le cockpit unique (E1). |

### F. Images
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E35 1/2/3 images | ✅ | sélecteur [1,2,3,4,6]:315, batch_size newlook.js:144 | Jusqu'à 6. |
| E36 planche contact AUTO | 🟠 | nlShowResult défile 1-par-1:355 ; buildGallerySheet:473 = galerie avatars sauvés, séparée | Pas de planche-contact auto du batch fraîchement généré. |
| E37 sélection pour vidéo | ✅ | NL_NAV:2426, NL_VIDEO:2495 | |
| E38 éditer image avant vidéo | ✅ | NL_EDIT:2445 → showEditHome | |
| E39 affichage entier 9:16 | ✅ | raw=true:357, results.raw.url newlook.js:154 | Brut non coupé, pas de sur-zoom. |

### G. Vidéo & connexions
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E40 redirections vérifiées | 🟡 | **0 bouton orphelin** (251 callbacks tous résolus) ; 9 handlers morts + 10 legacy anti-bypass | Aucun bouton cassé ✅ ; reliquats morts inoffensifs. |
| E41 photo↔vidéo connectés | ✅ | NL_VIDEO:2495, NEW_GO:2191, GAL_GEN:2218, gwReset:1049 | Aller-retour sans perte. |
| E42 chaîne vidéo câblée | ✅ | genFinal:1245 → generateAudio:1263 → prepareImage:1265 → generateLipsync:1275 → renderVideo:1278 → saveOpen:1279 → resAdd:1291 | Tous maillons reliés. |
| E43 workflows transverses | 🟡 | LOOK→IMAGE→VIDÉO→EXPORT ✅ ; **ARCHIVES→RÉÉDITION ❌** (STUDIO_HIST/gens listent seulement) | cf. §4. |
| E44 durée libre 15s→2min | ✅ | RC_DUR_FREE:2060, planParts workflow.js:16, plafond 180s | |
| E45 partie suivante | 🟡 | GF_ADDPART_:2087 ; **cassé sur gens restaurées** (imageUrl/prevScripts null:1325) ; "Make Part 2" A_YES:728 = mort | cf. BUG-B, BUG-C. |

### H. Script
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E46 script éditable avant dépense | ✅ | showScriptCard:1168, GJ_EDIT:2079, ttsCheck:1263 | |
| E47 catégories + anti-répétition | ✅ | GJ_CAT:2077, autoPickTopic:1109, topic_history.json | Double dedup (historique + session). |
| E48 hooks A/B | ✅ | GJ_HOOKS:2074 → genHooks:1193 | |

### I. Légendes
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E49 grille reliées + versions | 🟡 | resCaptionOf:1719, gfIdx par chemin:1736 | Reliée à chaque vidéo ✅ ; pas de grille ni de versions (1 caption.txt écrasable). |
| E50 courte/longue/hashtags copiables | ✅ | parseCaps:124, GF_LONG_:2110, GF_SHORT_:2111 (`<code>`) | Sans titre, 1 tap. |
| E51 éditer/régénérer légende | ⬜ | aucun handler d'édition de caption.txt | Édition à la main du .txt seulement. |

### J. Historique / Archivage / Réédition / Export / Projet
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E52 tout sauvegardé/retrouvable | ✅ | makeGenFolder:1330 (final+raw+caption+style+meta+thumbnail), genFoldersLoad:1317 | Survit au restart. |
| E53 historique grille + aperçus | 🟠 | STUDIO_HIST:2001 + /gens:2779 = **liste TEXTE** scannant les `.jpg` RACINE (photos de looks), **pas** les thumbnails des dossiers | Mauvais contenu + pas de grille visuelle dans Telegram. cf. BUG-A. |
| E54 réouverture/réédition/relance | 🟡 | GF_RESTYLE_:2118, GF_REWORK_:2085 (session) ; STUDIO_HIST sans bouton de réouverture | Réédition seulement sur le bloc Résultats courant, pas depuis l'Historique. |
| E55 modèle sur-mesure complet | 🟠 | snapshotStyle:964 = {subs, fx} uniquement (subs ignoré au load:965) | Un "modèle" = preset rendu (fx+sous-titres). Ni look, ni décor, ni caméra, ni script. cf. §6. |
| E56 projet réouvrable à l'identique | ⬜ | aucun project.json ; meta.json:1337 = topic+ts+timings | Réouverture identique impossible. |
| E57 prêt à poster / retravailler | ✅ | showReady:1011, GF_POST_:2084, GF_REWORK_:2085 | ready_to_post vérifié disque. |
| E58 restyle gratuit local | ✅ | GF_RESTYLE_:2118 → restyleFolder:1363 → renderLocal | 100% ffmpeg, €0. |
| E59 TikTok auto + stockage privé ≠ tmpfiles | 🟠 | `grep tiktok`=0 ; tmpfiles.org workflow.js:102,116,246,317 | Aucune publication TikTok ; médias intermédiaires via hébergeur public éphémère. |

### K. Suivi / État / Journalisation / Robustesse
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E60 suivi génération | ✅ | setProg:1252, startTicker:1130, RETRY_KB:1148, humanError:1137 | Progression/statut/temps/succès/échec/relance. |
| E61 annulation fiable | ✅ | genAbort:1102, abortNow→generateLipsync:1275, chk() avant/après sleep workflow.js:122 | Abort dans le poll Kling. 16 /stop, 0 échec d'abort journalisé. |
| E62 stop/restart en tête | 🟠 | showHome:1394 = **ni Stop ni Restart** ; showMainMenu Stop en L5:1388 ; Restart sous Technique:2141 | Existent (slash + sous-menu) mais pas en tête de l'accueil servi. |
| E104 accueil 4 entrées directes | 🟠 | showHome:1389 = Créer/Studio/Éditer/Aide/Profil | Cible Etoile = 📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS, 1 clic. Usage réel : /newlook 71× sans bouton, CARD_MORE 33× (déroulant trop cliqué). |
| E63 journal user + logs système | ✅ | jlog→bot_journal:33, uiLog→ui_journal:24, erreurs API:45/1306 | Crédits affichés mais **pas** journalisés après dépense. |
| E64 erreurs actionnables | ✅ | apiNice:1118, humanError:1137 (crédits→FR + ↻, pas d'auto-relance:1141) | |
| E65 clic tracé / rapport session | 🟡 | tout callback loggé:1960 ; pas de rapport agrégé par session ; auto-correction partielle | |
| E66 robustesse / code mort | 🟡 | dead: launch():738 (0 caller), flux MM_*:549-716, Shotstack workflow.js:261 (12 réfs) | Robuste (try/catch+fallbacks) mais dette de code mort. |

### L. Style / rendu (verrouillés)
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E67 sous-titres 76/0.370 | ✅ | subtitle_style.js + hook commit-msg | Verrouillé. |
| E68 couleur V5 vraie vidéo | ⛔ supersedé | color_style.js V5 | **SUPERSEDÉ par E97** (Etoile 09/06) : plus de V5 par défaut, fidélité source. |
| E69 son -14 LUFS / bt709 / pause / réactions | ✅ | loudnorm render_local.js:366, sanitize, réactions natural | |
| E70 référence Imany | ✅ | imany_reference.png présent (looks/references/imany/) | |

### M. Méthode (gouvernance)
| Ex | Statut | Preuve | Commentaire |
|---|---|---|---|
| E71 maquette d'abord | ✅ | process suivi (cf. historique) | |
| E72 mono-session + filet | ✅ | backups .preXXX, node --check, régressions 16/15/7/7+stalefix8 | |
| E73 fidélité test→prod | 🟡 | principe tenu ; libellés divergents (HD 1080p) | |

---

## 2. AUDIT FONCTIONNEL (existe / manque)

- **Looks** — Existe : créer (réf Imany), galerie grille paginée+aperçus+tri récents, ouvrir+éditer image, réutiliser+recettes, supprimer (corbeille). **Manque : dupliquer, archiver, lock/déverrouiller, restaurer (UI), renommer/modifier attributs.**
- **Décors** — Existe : 3 décors, choix sur le même écran que la tenue, liste lecture seule. **Manque : tout le CRUD (créer/modifier/dupliquer/supprimer/archiver) + Lock Background.**
- **Prompts** — Existe : 1 prompt de base visible/éditable/sauvegardable (+.bak)/reset. **Manque : bibliothèque multi-prompts, duplication, suppression, édition dans le cockpit.**
- **Images** — Existe : 1-6 images, sélection pour vidéo, éditer avant vidéo, affichage entier 9:16. **Manque : planche-contact automatique du batch (défilement 1-par-1).**
- **Vidéos** — Existe : chaîne complète câblée, photo↔vidéo, durée libre, partie suivante (session). **Manque/Cassé : partie suivante sur gens restaurées ; réédition depuis l'Historique.**
- **Légendes** — Existe : courte/longue/hashtags copiables, reliées à chaque vidéo. **Manque : éditer/régénérer, grille, versions.**
- **Historique/Archivage** — Existe : 1 dossier/génération (final+raw+caption+style+meta+thumbnail), survit au restart, prêt-à-poster, restyle local gratuit. **Manque/Cassé : écran Historique = liste texte au mauvais contenu (pas de grille/vignettes) ; pas de réouverture-projet.**
- **Réédition/Réutilisation** — Existe : restyle/rework/partie-suivante (session), recettes looks, presets styles. **Manque : réouvrir un projet complet pour ajuster+régénérer.**
- **Export** — Existe : ready_to_post + légendes + snapshot style. **Manque : publication TikTok auto, stockage privé (≠ tmpfiles).**
- **Modèle/Projet réutilisable** — **Manque quasi tout** : un "modèle" = fx+sous-titres seulement ; pas de project.json reliant look+décor+caméra+script+légendes+paramètres. (cf. §6)

---

## 3. AUDIT NAVIGATION

**Intégrité callbacks (251 boutons / 261 handlers) :**
- **Boutons sans handler (redirections cassées) : 0.** Tous les callbacks résolvent (exact ou via préfixe/concaténation). ✅
- **Handlers morts (sans bouton) : 9** — `CHG_TOPIC`:2192, `CHG_LOOK`:2193, `CANCEL`:2194, `RC_CANCEL`:2019, `RC_GALLERY`:2028, `S_Z_UP/S_Z_DN`:2542 — + **10 gardes legacy anti-bypass** (`GO/SCRIPT_OK/AUTO_ALL/EXPRESS_GO/MANUAL_GO/T_AUTO/L_RANDOM/D_*`:2162-2164) qui redirigent vers showCreer (filet voulu).

**Parcours principaux (clics jusqu'à la vidéo) :**
- Express : Home→Créer→Express→**écran Look**(CL_*)→recapGo→Script→Maquette→GO ≈ **6-7 clics**.
- Sur-mesure : Home→Créer→Sur-mesure→openCard (édition in-place)→GO ≈ **4 clics + N édits**. Le plus direct.
- Auto : idem Express avec script auto-validé ≈ **6 clics**.

**Constats E4 :**
- Retour présent sur quasi tous les écrans ; `MAIN_MENU`→showHome (cohérent, vérifié:1972).
- **Fil d'Ariane** (`journey()`) rendu sur **2 écrans seulement** (Script, Maquette) ; absent de la Carte/Récap/Express/Auto/Look.
- **Vocabulaire de retour NON unifié** : `◀️ Retour` ×41, mais aussi `◀️ Récap`, `◀️ Sources`, `◀️ Résultats`, `◀️ Catégories`, `◀️ Image`, `◀️ Édition`, `◀️ Plus`, `◀️ Page` (~10 cibles) ; **3 icônes "Annuler"** (❌/↩️/⛔, 13×) ; reliquats anglais (`⬅️ Back`×2, `❌ CANCEL`:687).
- **5 conventions de pagination** distinctes : `GAL_NEXT/PREV`, `COVER_NEXT/PREV`, `NL_NAV_N/P`, `GLP_NEXT/PREV`, `RES_NEXT/PREV`. Pas de "Suivant/Précédent" générique hors galeries.
- **E1 cockpit unique** : 52 appels in-place vs **85 `send()`** dans les handlers (livraisons, légendes, upload, erreurs) → empilement dans les flux secondaires.

---

## 4. AUDIT WORKFLOWS

| Workflow | Faisable | Clics | Contexte conservé | Constat |
|---|---|---|---|---|
| LOOK→IMAGE→VIDÉO→LÉGENDE→EXPORT | ✅ | ~6-7 | ✅ | Légende auto, export ready_to_post. |
| LOOK→DÉCOR | ✅ | in-place | ✅ | Décor choisi dans /newlook (pas d'écran décor dédié). |
| DÉCOR→IMAGE | ✅ | 1-2 | ✅ | NL_SET_ENV_→nlConfig→NL_GO. |
| IMAGE→VIDÉO | ✅ | 1-2 | ✅ | NL_VIDEO/GAL_GEN/RES_GEN→showRecap. |
| VIDÉO→LOOK | ✅ | 1 | ✅ | NL_RETRY/NL_OTHER (repassent par récap payant). |
| HISTORIQUE→RÉUTILISATION | 🟡 | — | partiel | /look (recette) ✅, presets ✅ ; mais Historique-écran sans réouverture. |
| ARCHIVES→RÉÉDITION | 🟠 | — | — | STUDIO_HIST/gens = lecture seule (texte). Réédition seulement sur le bloc Résultats courant. |

Flux de génération : **un seul vivant et canonique** (openCard/CREER_*→recapGo→genScriptStep→genAfterScript→genFinal). Legacy **morts** : `launch()`+child-process workflow.js (0 caller), flux `MM_*` (auto-bouclé orphelin), wizard anglais `A_*` (proc toujours null). Legacy **neutralisé** (redirigé vers showCreer).

---

## 5. CONSERVATION D'ÉTAT + REPRISE SESSION

✅ **Conforme.** `genState`/`state.json` (look/décor/durée/style), `workingSource`, `SESSION_VARS` multi-chat. Reprise au boot : `loadState`+`resLoad`+`genFoldersLoad`. **Stale-fix vérifié présent et correct** (staleBloc:1631 / freshBloc appelé en 256/1665/1725 → 1er affichage supprime l'ancien message périmé et recrée frais). resSave périodique. **Limite** : après restart, `gf.imageUrl`/`gf.prevScripts` = null (:1325) → "Partie suivante" cassée sur gens restaurées (BUG-B).

---

## 6. AUDIT COÛTS / CRÉDITS

✅ Récap chiffré (crédits + €) avant **chaque** dépense (look : NL_GO ; vidéo : genAfterScript) ; éco par défaut ; maquette ~centimes avant Kling ; bouton 💲/🚀 GO distinct. 🟡 **Temps sous-estimé** ("~3-10 min" vs timeout 45 min). 🟡 Crédits **affichés** mais **non journalisés** après dépense (pas de ligne "X cr consommés"). 🟡 Label HD "1080p" trompeur (:2505). Preuve journaux : 8× "credit balance too low" **toutes** à l'étape script (gratuite), **sans auto-relance** (E64 tenu).

---

## 7. AUDIT TECHNIQUE

- **Gestion d'erreurs** : try/catch généralisés, `apiNice`/`humanError` (FR, actionnable, pas d'auto-relance), retry sans boucle (genJob conservé). ✅
- **Logs** : `bot_journal.log` (jlog) + `logs/ui_journal.jsonl` (uiLog, 3146 events). Couvre clics/messages/REFUS/erreurs. Manque : crédits consommés, rapport agrégé par session. 🟡
- **Anti-doublon** : signatures `_sig`/`sigSame`, `isNotMod`/`isGone` ; 29 "not modified" absorbés sans recréation parasite. ✅
- **Archivage** : 1 dossier/génération auto + re-scan boot. ✅ (mais STUDIO_HIST lit le mauvais répertoire).
- **Code mort / dette** : `launch()`+workflow-child, flux `MM_*` (≈549-716), **Shotstack** workflow.js (12 réfs, remplacé par render_local), 9 handlers morts. 🟡
- **Robustesse** : fallbacks locaux (sujet de secours, rendu local), stale-fix, abort réel. ✅

---

## 8. REVUE ÉCRAN PAR ÉCRAN (extraits SCREENS.md, 61 écrans)

- **showHome** (accueil cockpit) — clair (Créer/Studio/Éditer/Aide/Profil) **mais ni Stop ni Restart** (E62). Intuitif ✅.
- **showCreer** (Express/Sur-mesure/Auto) — clair ; manque une phrase distinguant Manuel vs Auto.
- **showLookSource** (flux look) — 3 sources + Garder courant + Stop ; cohérent, validations OK ✅.
- **nlConfig** (photo) — tenue/décor/format/nombre sur 1 écran ✅ ; dense mais lisible.
- **nlShowResult** — image entière + actions ; **manque planche-contact** (défile 1-par-1).
- **showGallery** — grille 3×3 paginée ✅ ; manque actions CRUD (dupliquer/lock/archiver).
- **showScriptCard** — 5 rangées = dense (constat AUDIT_UX) ; éditable ✅.
- **genAfterScript** (récap coût) — coût+temps ✅ ; temps optimiste.
- **STUDIO_HIST / /gens** — 🔴 liste texte au mauvais contenu, pas d'aperçus, pas de réouverture.
- **showReady** — clair ✅.
- **showEditHome** — riche ; vocabulaire de retour hétérogène.

---

## 9. RAPPORT FINAL CLASSÉ

### ✅ Conforme (socle solide — à préserver)
Anti-dépense (récap+confirm partout), éco→HD, maquette avant Kling, chaîne vidéo câblée, photo↔vidéo, conservation d'état + reprise (stale-fix), galerie grille, durée libre, script éditable + anti-répétition + hooks, légendes copiables, restyle gratuit, suivi+abort, erreurs actionnables, styles verrouillés (76/0.370, -14 LUFS, bt709), 0 bouton cassé.

### 🟡 Partiel
Cockpit unique (flux secondaires empilent), 2 sections, fil d'Ariane + vocabulaire retour, Auto-fiabilité, prévisualisation systématique, multi-persona, coûts/temps honnêtes, modifier/supprimer/noms looks, prompts visibles/réutilisables, redirections (morts), workflows transverses, partie suivante, légendes (grille/versions), réouverture historique, rapport session, code mort, couleur V5.

### 🟠 Non conforme · ⬜ Manquant
Décors CRUD (E25) + Lock Background (E26) ; Looks dupliquer/archiver/lock (E17/E19/E21) ; Prompts dupliquer/supprimer (E31/E32) + édition dans cockpit (E34 🔁) ; planche-contact auto (E36) ; éditer/régénérer légende (E51) ; **historique grille/aperçus (E53)** ; **modèle sur-mesure complet (E55)** + **projet réouvrable (E56)** ; TikTok auto + stockage privé (E59) ; stop/restart en tête (E62).

### 🔴 Bugs / Régressions
- **BUG-A (Critique)** — `STUDIO_HIST`:2002 / `/gens`:2785 scannent les `.jpg` à la **racine** d'outputs/generations (photos de looks) au lieu des `thumbnail.jpg` des dossiers → l'historique vidéo n'apparaît pas, en texte seul. (E53)
- **BUG-B (Élevée)** — `GF_ADDPART_`:2087 inutilisable sur génération restaurée (`imageUrl`/`prevScripts`=null:1325) → "Partie suivante" plante. (E45/E54)
- **BUG-C (Moyenne)** — boutons "Make Part 2/3" (`A_YES`:728) morts (proc null) → clic sans effet, confusion. (E45/E66)
- **BUG-D (Faible/cosmétique)** — récap HD "1080p":2505 contredit la dé-trompe:368. (E14)
- **BUG-E (Faible)** — double-tap `RC_GO` non débouncé (étape script, gratuite).
- **RÉGRESSION (Moyenne)** — `/prompt` ouvre un message séparé (E34) → viole le cockpit unique (E1).
- **BUG-T7 (Élevée, retour Etoile)** — 🎨 Éditer depuis le menu ne montre pas le look (`EDIT_HOME`:2322 sans `setWorkPhoto` → `workSrc`=raw/null), alors que l'aperçu marche (`NL_EDIT`:2446 fait `setWorkPhoto`) ; et l'éditeur ouvre un **nouveau message** (`editScreen`:1079 utilise `cockpit.mid` ≠ bloc photo).
- **BUG-T10 (Élevée, retour Etoile)** — l'étape Look s'affiche en Express/Auto (preuve journal `CL_KEEP` 15:01:57) mais **absente en Sur-mesure** (`CREER_SURMESURE`:1975→`openCard` contourne `showLookSource`).
- **BUG-T12 (Élevée, retour Etoile)** — légende : OK sur vidéo fraîche, mais **aucune version** (1 seul `caption.txt`, E49) et **« Introuvable »/legacy après restart** (`gfIdx` remappé / `gf.vidMid` null, `genFoldersLoad`:1317 vs `GF_LONG_`:2110).

### Recommandations priorisées
**Critique — n°1 ABSOLUE (E92, décision Etoile 09/06)** : **GATE QC IDENTITÉ SUR L'IMAGE SOURCE, AVANT le lipsync payant.** Après l'image source (éco) et avant `genFinal`→`generateLipsync` : écran QC (image + checklist poils/doigts/mains/membres/accessoires fantômes/déformation visage/âge/ethnie/morphologie/cohérence visage-peau-cheveux-regard). Anomalie → vidéo bloquée + 3 actions (🔄 Régénérer · 🎨 Éditer · ✅ Valider malgré l'alerte). Niveau (a) gate humain = bloquant et faisable sans coût ; niveau (b) détection vision = bonus (Claude vision coûte des crédits ; local Apple Vision/embedding à étudier). Empêche de payer un lipsync sur une image fautive (cas « poil au torse »).
**Critique — PROJET & TRAÇABILITÉ (E93–E96, décision Etoile 09/06)** : **(E93)** faire de chaque génération un **PROJET UNIQUE complet** (look/décor/prompts image+vidéo+lipsync/script/audio/image source/variantes/raws lipsync+vidéo/versions avant montage-zoom-sous-titres/finale/légendes + métadonnées coût/crédits/durée/moteur/validation/historique + **logs + rapport QC**), raws **jamais écrasés**, historique **par projet**, actions ouvrir/rééditer/réutiliser/dupliquer/relancer/télécharger/exporter/archiver/restaurer, **modèle réutilisable** (choix de ce qu'on conserve) — remplace E55/E56. **(E94)** stockage cloud persistant (iCloud formalisé + cloud indépendant pour redondance ; remplacer `tmpfiles.org`). **(E95)** espaces **TEST / PRODUCTION** séparés (promotion sans perte). **(E96)** workflow **TEST→QC(E91/E92)→validation Etoile→PROD** + historique de validation. But : retrouver une génération entière des années plus tard, TEST vs PROD distincts.
**Critique** : (1) Réparer l'écran Historique → vraie grille + vignettes des dossiers de génération (BUG-A, E53). (2) Chantier **projet.json** (modèle/projet réouvrable complet : look+décor+caméra+script+légendes+params) (E55/E56). (3) Persister imageUrl/prevScripts dans meta.json → réparer Partie suivante restaurée (BUG-B).
**Élevée** : (4) Looks CRUD complet (dupliquer/archiver/lock/restaurer/renommer). (5) Décors CRUD + Lock Background. (6) Prompts : bibliothèque (dup/suppr) éditable **dans le cockpit** (corrige E34). (7) `/stop`+`/restart` en tête de showHome (quick). (8) Planche-contact auto après N images. (9) Légendes : éditer/régénérer + grille + versions.
**Moyenne** : (10) Retirer le code mort (launch/MM_/Shotstack) + boutons "Make Part 2" trompeurs + label HD. (11) Unifier fil d'Ariane + vocabulaire retour + pagination. (12) Aperçu avant chaque validation (décor/prompt/légende). (13) Brancher multi-persona (getLooksDir/fileCat). (14) Garantir couleur V5 sur la vraie vidéo.
**Faible** : (15) Journaliser crédits consommés + rapport par session. (16) Temps honnête (≈ jusqu'à 45 min). (17) Débounce RC_GO.

---

## 10. TESTS RÉALISÉS & RÉSULTATS

| Test | Méthode | Résultat |
|---|---|---|
| Intégrité callbacks | extraction 251 boutons vs 261 handlers (exact+préfixe+concat) | 0 bouton cassé ; 9 handlers morts + 10 gardes legacy |
| Régénération SCREENS.md | `node gen_screens.js` (lecture seule) | 61 écrans |
| Vérif routing MAIN_MENU | grep:1972 | →showHome (cohérent) |
| Vérif contenu Historique | lecture STUDIO_HIST:2001 + /gens:2779 | scanne .jpg racine (mauvais contenu) — BUG-A confirmé |
| Vérif label HD | grep 1080p/720p | reliquat trompeur :2505 (vs :368) |
| Fouille journaux réels | grep ui_journal/bot_journal | /restart×95, /stop×16, "credit balance"×8 (toutes script, 0 auto-relance), "not modified"×29 (absorbés), GEN_ABORT×0 |
| Stale-fix présent | lecture staleBloc/freshBloc:1631 | présent et correct |
| Chaîne vidéo câblée | lecture genFinal:1245 | tous maillons reliés |
| Code mort | grep launch/MM_/Shotstack | confirmés dormants |

_(Aucun code exécuté hormis le générateur de doc en lecture seule ; aucun appel API ; aucune dépense ; aucun restart.)_

---

## 11. PLAN D'ACTION PRIORISÉ (séquence sans big-bang, 1 lot testé à la fois)

-1. **🔴 LOT PRÉ-CRITIQUE — retours 1ᵉʳ test (E97–E103, EN PREMIER)** : colorimétrie neutre par défaut (E97, branchement `FX_DEFAULT.image` `render_local.js:73`, sans toucher `color_style.js` verrouillé) ; retirer `[pause]` du prompt script (E98, `workflow.js:50`) ; réactions défaut OFF (E99, `render_local.js:76`) ; état propre complet — zoom/réactions/musique/durée/réf non hérités (E102) ; réf cockpit verrouiller + définir par défaut (E100) ; bibliothèque de références taguée/cherchable (E101).
0. **🔴 GATE QC SOURCE-AVANT-VIDÉO (E92) — n°1 absolue** : stop bloquant + checklist + 3 boutons (régénérer/éditer/valider) entre l'image source et le lipsync payant. (À coder en premier, après la génération en cours.)
0-bis. **🔴 PROJET UNIQUE + TEST/PROD + VALIDATION (E93–E96)** : conteneur de projet complet (project.json : raws/versions/prompts/métadonnées/logs/QC), historique par projet, stockage cloud persistant (remplacer tmpfiles), espaces TEST/PRODUCTION, workflow TEST→QC→validation→PROD.
1. **LOT ACCUEIL/NAV** (faible risque, fort gain) : **accueil 4 entrées directes 📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS (E104)** + `/stop`+`/restart` visibles (E62) + vocabulaire retour unifié (E4). Puis **Quick wins** : label HD (BUG-D) ; planche-contact auto (E36) ; débounce RC_GO.
2. **Historique utilisable** : grille + vignettes + boutons réouvrir/réutiliser/relancer (BUG-A, E53/E54).
3. **Partie suivante fiable** : persister imageUrl/prevScripts (BUG-B).
4. **Looks CRUD** (dupliquer/archiver/lock/restaurer/renommer) — E16-E21.
5. **Décors CRUD + Lock Background** — E25/E26.
6. **Prompts** : bibliothèque dans le cockpit (dup/suppr/réutil) — E28-E34.
7. **Légendes** : éditer/régénérer + grille + versions — E49/E51.
8. **project.json** : modèle/projet réouvrable complet — E55/E56 (gros lot).
9. **Nettoyage** : code mort + unification navigation — E66/E4.
10. **Plus tard** : TikTok auto + stockage privé (E59), multi-persona (E9). _(E68 couleur V5 supersedé par E97 — voir lot pré-critique.)_

Chaque lot : maquette → 1 onglet/écran → test (régressions 16/15/7/7 + stalefix 8 + smoke /go /menu) → commit. Jamais deux lots simultanés.

---
_Fin de l'audit. Détail des exigences : `docs/EXIGENCES.md`. Architecture cible : `docs/ARCHITECTURE_FINALE.md`. Mapping : `docs/MAPPING_ARCHITECTURE.md`._

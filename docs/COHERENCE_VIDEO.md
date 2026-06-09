# COHÉRENCE PARCOURS VIDÉO + GLOBAL PHOTO→VIDÉO — grille E116 (gate d'acceptation L0-2b)

> Validation **contre l'architecture cible + le parcours utilisateur global**. Grille des **9 questions** par écran (OUI/NON + preuve).
> Strangler-fig : la VIDÉO est **branchée** sur router + workspace média + draft/proj (pas réécrite). À sec (aucune génération payante).

## Les 9 questions
1. BLOC UNIQUE (0 nouveau message) · 2. LOGIQUE PHOTO→LOOK→IMAGE→VIDÉO(Source→Script→Montage→Légende→Export) · 3. ÉTAPE visible · 4. PROJET visible · 5. RÉFÉRENCE visible+persistante · 6. SCRIPT/PROMPT visible+éditable · 7. RETOUR sans perte · 8. REPRISE sans confusion · 9. NON-RÉGRESSION.

**En-tête de contexte VIDÉO** (`wsHeaderV`) sur chaque écran : `📁 Projet · <étape>` / `🖼 Média actif` / `🎯 Réf` / `✍️ Script` / `📝 Brouillon`. → couvre Q3/Q4/Q5/Q6.

Preuves transverses : `tools/test_video_ws.js` (**7/7** — 1 seul bloc workspace sur PHOTO→VIDÉO complet + aval conservé), `tools/test_photo_ws.js` (**6/6**), `tools/test_photo_l0_2a.js` (**20/20**), régressions `16/15/7/7/8`. Audit statique : handlers `VS_/VP_/VM_/VL_/VX_` = `routeBlock`+`toast` uniquement (seule exception : `VM_EDIT` → éditeur avancé, **qui revient dans le bloc** via `editReturn`). Journal live : `🖼 ws create/edit/close`.

---

## 0. 🎬 VIDÉO (menu texte — entrée)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI* | Menu texte ; 🎬 Nouvelle vidéo (`go:video.source`) **ouvre/réutilise LE workspace**. *Le seul « nouveau bloc » = le workspace lui-même (ou réutilise celui de Photo si déjà ouvert). |
| 2 | OUI | Entrée vers `video.source` (début de la branche VIDÉO). 🎨 Éditer/Montage = éditeur avancé. |
| 3 | OUI | Titre « 🎬 VIDÉO — source · script · montage · export ». |
| 4/5/6 | N/A | menu d'entrée (visibles dès le workspace). |
| 7 | OUI | barre nav (⬅/🏠). |
| 8 | OUI | reprise via 🕘 RÉCENTS. |
| 9 | OUI | `NEW_GO` legacy conservé ailleurs ; pas de double rendu. |

## 1. `video.source` (5 sources)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média ; `VS_*` = `routeBlock`+`toast`. `test_video_ws` : 1 create + edits. |
| 2 | OUI | parent `photo.image` (enchaînement IMAGE→VIDÉO) ; `next:video.script` gaté sur média actif. |
| 3 | OUI | `wsHeaderV(p,'VIDÉO · Source')`. |
| 4 | OUI | 📁 projet (id créé dès l'entrée). |
| 5 | OUI | 🎯 Réf dans l'en-tête. |
| 6 | OUI | ✍️ Script dans l'en-tête (édité à l'étape suivante). |
| 7 | OUI | proj en mémoire ; ⬅ Retour=R_photo.image (slice intact). |
| 8 | OUI | `resumeDraft` route ici si `video.step=source`. |
| 9 | OUI | **5 sources** : 👗 look projet (`VS_PROJLOOK`), 🖼 image générée (`VS_GENIMAGE`), 🖼 look galerie (`video.srcgal`/`VS_GSET`), ✨ nouveau look (`VS_NEWLOOK`→étape Look), 📤 upload (`VS_UPLOAD`). `videoMedia()` sait d'où vient le média. |

## 2. `video.srcgal` (source = galerie)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média ; `VS_GPREV/GNEXT/GSET`. |
| 2 | OUI | parent `video.source` ; ✅ → média + retour source. |
| 3 | OUI | `wsHeaderV('VIDÉO · Galerie')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | ⬅ Retour=R_video.source. |
| 8 | OUI | transitoire. |
| 9 | OUI | `refGalIdx` borné à chaque rendu. |

## 3. Upload image source (`ws_video_upload_wait`)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | toast + `delMsg(msg)` puis `routeBlock('video.source')`. Aucun bloc bot créé. |
| 2 | OUI | reste à l'étape Source ; écrit `video.media/source='upload'`. |
| 3 | OUI | en-tête VIDÉO. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | annulable ; `video.media` persisté. |
| 8 | OUI | slice persisté. |
| 9 | OUI | état distinct de `ws_ref/look_upload_wait`. |

## 4. `video.script` (slice + biblio + génération confirmée)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média ; `VP_*` = `routeBlock`+`toast` ; édition texte → `delMsg(msg)` + re-render. |
| 2 | OUI | parent `video.source` ; `next:video.montage` gaté sur script non vide. |
| 3 | OUI | `wsHeaderV(p,'SCRIPT')`. |
| 4/5 | OUI | en-tête présent. |
| 6 | OUI | **script visible (aperçu) + éditable (✍️) + sauvegardable (💾) + rechargeable (📚)** ; slice `video.script`. 🤖 Générer = payant (Anthropic) → toast d'avertissement, **non lancé en test**. |
| 7 | OUI | ⬅ Retour=R_video.source ; slice conservé (test : aval conservé). |
| 8 | OUI | `projFromDraft` recharge `video.script`. |
| 9 | OUI | bibliothèque `scripts_lib/<persona>/*.json` (même mécanique que prompts). |

## 5. `video.scriptlib` (bibliothèque scripts)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média ; `VP_USE_<slug>` → charge → `routeBlock('video.script')`. |
| 2 | OUI | parent `video.script`. |
| 3 | OUI | `wsHeaderV('SCRIPT · Bibliothèque')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | ⬅ Retour=R_video.script. |
| 8 | OUI | fichiers persistants. |
| 9 | OUI | stockage dédié, pas de collision avec prompts. |

## 6. `video.montage` (+ éditeur avancé bridge)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média (résumé montage in-block). `VM_EDIT` ouvre l'éditeur avancé **dans le bloc** (`cockpit.mid=newlook.mediaId`) et le **Retour revient au montage** (`editReturn`→intercept `MAIN_MENU`→`routeBlock('video.montage')`) — pas de nouveau bloc home. |
| 2 | OUI | parent `video.script` ; `next:video.legende`. |
| 3 | OUI | `wsHeaderV(p,'MONTAGE')` + état sous-titres. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | ⬅ Retour=R_video.script. |
| 8 | OUI | `video.montage.touched` persisté. |
| 9 | OUI | l'éditeur reste un sous-système legacy **branché** (réglages fins) ; entrée/sortie dans le bloc. Fichiers verrouillés (subtitle_style/color_style) non touchés. |

## 7. `video.legende` (slice)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | module média ; `VL_EDIT` → texte → `delMsg(msg)` + re-render. |
| 2 | OUI | parent `video.montage` ; `next:video.export`. |
| 3 | OUI | `wsHeaderV(p,'LÉGENDE')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | ⬅ Retour=R_video.montage ; slice conservé. |
| 8 | OUI | `video.legende` persisté. |
| 9 | OUI | cohérent avec la légende legacy (mêmes données). |

## 8. `video.export` (+ confirmation)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | confirmation rendue DANS le bloc (`video.confirming`) ; `VX_*` = `routeBlock`+`toast`. |
| 2 | OUI | parent `video.legende` ; fin de chaîne. |
| 3 | OUI | `wsHeaderV(p,'EXPORT')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 | OUI | ◀️ Annuler restaure l'écran export. |
| 8 | OUI | `projFromDraft` force `video.confirming=false`. |
| 9 | OUI | **COÛT + CONFIRMATION OBLIGATOIRE** (`VX_GEN`→confirm→`VX_GO`) ; génération réelle = **bridge non déclenché en test** (toast). |

## 9. Reprise de brouillon VIDÉO (`resumeDraft`)
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | `newlook.mediaId=null;wsOpen=false` puis `routeBlock(video.<step>)` → 1 workspace frais (pas de bloc legacy). |
| 2 | OUI | route vers l'étape vidéo exacte (source/script/montage/legende/export). |
| 3 | OUI | en-tête à la bonne étape. |
| 4 | OUI | même `draftId` réactivé (E113). |
| 5/6 | OUI | réf (fichier) + script (slice) restaurés. |
| 7 | OUI | `projFromDraft` recharge le slice video complet. |
| 8 | OUI | **état exact**, même brouillon. |
| 9 | OUI | drafts vidéo legacy (`step:'video'` sans `proj.video`) tombent sur le flux source ; pas d'effet de bord. |

## 10. PARCOURS GLOBAL PHOTO → VIDÉO
| Q | Rép | Preuve |
|---|---|---|
| 1 | OUI | `photo.image` (média) → 🎬 Faire une vidéo (`go:video.source`, média) → **même bloc** (deux modules média, `routeBlock` ne ferme pas). `test_video_ws` : `sendMedia===1` sur tout PHOTO→VIDÉO. |
| 2 | OUI | enchaînement IMAGE→VIDÉO respecté (bouton sur l'étape IMAGE + entrée section). |
| 3 | OUI | l'en-tête passe de `wsHeader` (LOOK/IMAGE) à `wsHeaderV` (VIDÉO) avec étape claire. |
| 4 | OUI | **même `proj`/`draftId`** (aucun reset) traversant Photo↔Vidéo. |
| 5 | OUI | 🎯 Réf conservée et affichée des deux côtés. |
| 6 | OUI | prompt (photo) et script (vidéo) chacun visible+éditable, persistés. |
| 7 | OUI | Vidéo→Photo et retour arrière rechargent le slice exact (E114) ; `test_video_ws` : retour script conserve l'aval. |
| 8 | OUI | un seul projet récupérable de bout en bout. |
| 9 | OUI | régressions vertes ; aucun chemin photo cassé (ws 6/6, router 20/20). |

---

## Résidus bloc-unique trouvés sur PHOTO (point a — L0-2a NON clos)
- **Éditeur d'image (`PL_EDIT`)** : entré depuis Photo, il rendait via le cockpit ; corrigé pour réutiliser le bloc workspace (`cockpit.mid=newlook.mediaId`). Sa **sortie** (Retour) suivait le legacy `MAIN_MENU` → bloc home. **Corrigé** par le mécanisme `editReturn` (commun à `VM_EDIT`) : la sortie revient dans le bloc. *Validation fine de l'éditeur (sous-panneaux) = sur image réelle, hors test à sec.*
- Aucune autre fuite `send()` détectée sur les chemins workspace (audit `PL_/PR_/PP_/VS_/VP_/VM_/VL_/VX_` = `routeBlock`+`toast`).

## Verdict
**Aucun NON résiduel.** Incohérence détectée et corrigée avant livraison : sortie de l'éditeur avancé (`MAIN_MENU`) créait un bloc home → interception `editReturn` (retour dans le workspace). Grille **100% OUI** (N/A = écran d'entrée/gestion, justifié).

# COHÉRENCE PARCOURS PHOTO — grille E116 (gate d'acceptation L0-2a-ter)

> Validation **contre l'architecture cible + le parcours utilisateur global**, pas seulement le dernier bug.
> Pour CHAQUE écran du workflow Photo : 9 questions, réponse **OUI/NON + preuve**. Tout NON est corrigé avant livraison.
> Méthode : trace de bout en bout en se mettant à la place de l'utilisateur final. À sec (aucune génération payante).

## Les 9 questions
1. **BLOC UNIQUE** — depuis cet écran, la navigation édite le workspace média (0 nouveau message bot) ?
2. **LOGIQUE** — respecte PHOTO → LOOK → IMAGE → (VIDÉO) ?
3. **ÉTAPE** — l'utilisateur voit immédiatement où il est (indicateur d'étape) ?
4. **PROJET** — sait sur quel projet il travaille (visible) ?
5. **RÉFÉRENCE** — sait quelle référence est active (visible + persistante) ?
6. **PROMPT** — sait quel prompt est actif (visible + éditable) ?
7. **RETOUR** — peut revenir en arrière sans perdre le contexte (slice rechargé) ?
8. **REPRISE** — peut reprendre un brouillon sans confusion (même brouillon, état exact) ?
9. **NON-RÉGRESSION** — pas de comportement incohérent ailleurs (régressions + cohérence des autres écrans) ?

**En-tête de contexte permanent** (`wsHeader`, `telegram_bot.js`) affiché sur CHAQUE écran workspace :
`📁 Projet · <étape>` / `👗 Look` / `🎯 Réf` / `✍️ Prompt` / `📝 Brouillon`. → couvre Q3/Q4/Q5/Q6 partout.

Preuves transverses : `tools/test_photo_ws.js` (1 seul bloc workspace sur parcours complet = **6/6**), `tools/test_photo_l0_2a.js` (gates/parents/slice = **20/20**), régressions `nodup 16 / feedback 15 / gallery 7 / nbphotos 7 / stalefix 8`. Journal live : `🖼 ws create/edit/close`.

---

## 0. 📸 PHOTO (menu texte — entrée du workflow)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI* | Menu texte de section. ✨ Nouveau look (`go:photo.look`) **ouvre LE workspace** (1 bloc média = le canvas, attendu). 📂 Reprendre (`RX_DRAFTS`) édite en place. *Le seul « nouveau bloc » du parcours = la création du workspace lui-même. |
| 2 LOGIQUE | OUI | Entrée unique vers LOOK ; la bibliothèque (galerie/décors) est déplacée dans STUDIO (propriété unique). `ui/registry.js` photo = [✨ Nouveau look][📂 Reprendre]. |
| 3 ÉTAPE | OUI | Titre « 📸 PHOTO — créer une image / un look ». |
| 4 PROJET | N/A | Écran d'entrée (pas encore dans un projet) ; 📂 Reprendre liste les projets. |
| 5 RÉFÉRENCE | N/A | (visible dès l'entrée workspace). |
| 6 PROMPT | N/A | (visible dès l'entrée workspace). |
| 7 RETOUR | OUI | ⬅/🏠 via barre de nav (routeur). |
| 8 REPRISE | OUI | 📂 Reprendre → `RX_DRAFTS` → `RX_DRAFT_<id>` → `resumeDraft` (même draftId). |
| 9 NON-RÉG | OUI | Galerie/Décors retirés d'ici = fin de la duplication avec STUDIO (cohérence propriété). Régressions vertes. |

## 1. Workspace LOOK (`photo.look` — LOOK 1/2)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | `render` renvoie `{image}` → `ctx.showMedia` → `nlMedia` (editMessageMedia/Caption). Handlers `PL_*` = `routeBlock`+`toast` uniquement (audit : 0 send/sendPhoto/cardMenu). `test_photo_ws` : 1 create + N edits. |
| 2 LOGIQUE | OUI | `next:'photo.image'` ; ➡ Suivant gaté sur `look.source`. |
| 3 ÉTAPE | OUI | `wsHeader(p,'LOOK 1/2')`. |
| 4 PROJET | OUI | `📁 <projName>` ; **id créé dès l'entrée** (`autosaveDraft` au 1er render) → stable dès l'écran 1. |
| 5 RÉFÉRENCE | OUI | `🎯 Réf : <basename>` (via `nlRefFile`, persistant). |
| 6 PROMPT | OUI | `✍️ Prompt : <nom>` + bouton ✍️ Prompt → `photo.prompt`. |
| 7 RETOUR | OUI | proj en mémoire ; ⬅ Retour=R_photo (ferme workspace proprement). `test_photo_l0_2a` slice conservé. |
| 8 REPRISE | OUI | `resumeDraft` route ici si step=look ; `projFromDraft` recharge le slice. |
| 9 NON-RÉG | OUI | Sources : Nouveau (cb), Galerie (`go:photo.lookgal`), Upload (état workspace) — toutes cohérentes, in-place. |

## 2. Galerie → Look (`photo.lookgal`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PL_GPREV/GNEXT/GSET` = `routeBlock`+`toast`. |
| 2 LOGIQUE | OUI | parent `photo.look` ; ✅ Choisir → écrit `look.file/source` → retour LOOK. |
| 3 ÉTAPE | OUI | `wsHeader(p,'LOOK · Galerie')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.look (parent), slice intact. |
| 8 REPRISE | OUI | sous-écran transitoire ; pas d'état propre à perdre. |
| 9 NON-RÉG | OUI | `refGalIdx` partagé avec la galerie réf mais réinitialisé/borné à chaque rendu (`if(refGalIdx>=list.length)`). |

## 3. Upload look (état `ws_look_upload_wait`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | toast d'invite + caption « ⏳ » ; à réception, `delMsg(msg)` (photo utilisateur) puis `routeBlock('photo.look')` (edit). Aucun bloc bot créé. |
| 2 LOGIQUE | OUI | écrit `look.file/source='upload'` → reste à l'étape LOOK. |
| 3 ÉTAPE | OUI | wsHeader LOOK 1/2 conservé. |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | annulable (retour LOOK) ; slice intact. |
| 8 REPRISE | OUI | `look.file` persisté dans le slice. |
| 9 NON-RÉG | OUI | distinct de `ref_upload_wait`/`create_look_upload_wait` legacy (pas de collision d'état). |

## 4. Workspace IMAGE (`photo.image` — IMAGE 2/2)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PL_PREV/NEXT/PICK/GEN/GEN_NO` = `routeBlock`+`toast`. |
| 2 LOGIQUE | OUI | parent `photo.look` ; `next:'video'` gaté sur `image.validated`. |
| 3 ÉTAPE | OUI | `wsHeader(p,'IMAGE 2/2')` + aperçu image en cours. |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.look ; slice look intact (test). Aller-retour conserve l'aval (image). |
| 8 REPRISE | OUI | `resumeDraft` route ici si step=image ; urls/idx/validated rechargés. |
| 9 NON-RÉG | OUI | 💲 derrière confirmation ; **génération jamais déclenchée en test**. |

## 5. Confirmation génération (`photo.image`, `image.confirming=true`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | rendu DANS le bloc image (flag `confirming`), pas de nouveau message. `PL_GEN` set flag → `routeBlock('photo.image')`. |
| 2 LOGIQUE | OUI | reste à l'étape IMAGE ; ✅ Confirmer (`PL_GEN_DO`) / ◀️ Annuler (`PL_GEN_NO`). |
| 3 ÉTAPE | OUI | wsHeader IMAGE 2/2 + « ⚠️ Confirmer la génération ». |
| 4/5/6 | OUI | en-tête présent + prompt actif rappelé. |
| 7 RETOUR | OUI | ◀️ Annuler restaure l'écran image (flag remis à false). |
| 8 REPRISE | OUI | `projFromDraft` force `confirming=false` (jamais repris en état « confirmation »). |
| 9 NON-RÉG | OUI | `PL_GEN_DO` passe `basePrompt` (slice) au moteur ; hors test. |

## 6. 🎯 Référence (`photo.ref`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PR_*` = `routeBlock`+`toast`. |
| 2 LOGIQUE | OUI | détour depuis LOOK (parent `photo.look`), pas de ➡ Suivant trompeur (pas de `next`). |
| 3 ÉTAPE | OUI | `wsHeader(p,'RÉFÉRENCE')`. |
| 4/6 | OUI | en-tête présent. |
| 5 RÉFÉRENCE | OUI | vignette réf active (`refThumb`) + libellé ; persistante (`nlRefFile`, survit /menu + /restart). |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.look ; aucun état perdu. |
| 8 REPRISE | OUI | la réf vit hors brouillon (fichier `imany_reference.*`) — toujours là à la reprise. |
| 9 NON-RÉG | OUI | remplacement immédiat (vignette mtime-keyée) ; appliquée aux générations. |

## 7. Galerie → Référence (`photo.refgal`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PR_GPREV/GNEXT/GSET`. |
| 2 LOGIQUE | OUI | parent `photo.ref` ; ✅ Définir → réf active → retour `photo.ref`. |
| 3 ÉTAPE | OUI | `wsHeader(p,'RÉFÉRENCE · Galerie')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.ref. |
| 8 REPRISE | OUI | transitoire. |
| 9 NON-RÉG | OUI | `setImanyRef` + aperçu immédiat ; cohérent avec upload réf. |

## 8. Upload référence (état `ws_ref_upload_wait`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | toast + caption « ⏳ » ; réception → `delMsg(msg)` + `routeBlock('photo.ref')`. |
| 2 LOGIQUE | OUI | reste sur l'écran RÉFÉRENCE. |
| 3 ÉTAPE | OUI | wsHeader RÉFÉRENCE + « ⏳ En attente de ta photo… ». |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | annulable. |
| 8 REPRISE | OUI | réf = fichier persistant. |
| 9 NON-RÉG | OUI | distinct de `ref_upload_wait` legacy. |

## 9. ✍️ Prompt (`photo.prompt`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PP_*` = `routeBlock`+`toast` ; édition texte → `delMsg(msg)` + re-render. |
| 2 LOGIQUE | OUI | détour depuis LOOK (parent `photo.look`). |
| 3 ÉTAPE | OUI | `wsHeader(p,'PROMPT')`. |
| 4/5 | OUI | en-tête présent. |
| 6 PROMPT | OUI | **prompt par défaut pré-rempli** (`newlook_prompt.txt`), affiché (aperçu) + ✍️ Éditer / ↩️ Défaut / 📚 Charger / 💾 Enregistrer. Écrit le slice `prompt`. |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.look ; slice prompt conservé. |
| 8 REPRISE | OUI | `projFromDraft` recharge `proj.prompt`. |
| 9 NON-RÉG | OUI | `newlook.js buildPrompt` accepte `opts.basePrompt` (sinon défaut) ; `/prompt` legacy intact. |

## 10. Bibliothèque prompts — workspace (`photo.promptlib`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | module média ; `PP_USE_<slug>` charge le prompt → `routeBlock('photo.prompt')`. |
| 2 LOGIQUE | OUI | parent `photo.prompt`. |
| 3 ÉTAPE | OUI | `wsHeader(p,'PROMPT · Bibliothèque')`. |
| 4/5/6 | OUI | en-tête présent. |
| 7 RETOUR | OUI | ⬅ Retour=R_photo.prompt. |
| 8 REPRISE | OUI | bibliothèque = fichiers `prompts/<persona>/*.json` persistants. |
| 9 NON-RÉG | OUI | même stockage que Studio (source unique). |

## 11. Reprise de brouillon (`resumeDraft`)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | `newlook.mediaId=null; wsOpen=false` puis `routeBlock(photo.look|photo.image)` → 1 workspace frais (plus de bloc legacy `nlConfig`/`nlShowResult` pour les drafts photo). |
| 2 LOGIQUE | OUI | route vers l'étape exacte (look/image). |
| 3 ÉTAPE | OUI | wsHeader à la bonne étape. |
| 4 PROJET | OUI | même `draftId` réactivé (pas de doublon — E113) ; 📁 = id. |
| 5/6 | OUI | réf (fichier) + prompt (slice) restaurés. |
| 7 RETOUR | OUI | slice complet rechargé (`projFromDraft`). |
| 8 REPRISE | OUI | **état exact**, même brouillon. |
| 9 NON-RÉG | OUI | drafts vidéo gardent le flux legacy (L0-2b) ; pas d'effet de bord. |

## 12. STUDIO → 📝 Prompts (`studio.prompts`, texte)
| Q | Rép | Preuve |
|---|---|---|
| 1 BLOC UNIQUE | OUI | écran texte de section (hors workspace) ; `SP_*` édite en place (`routeBlock`/`toast`). |
| 2 LOGIQUE | OUI | domaine STUDIO (gestion bibliothèque) — propriété unique. |
| 3 ÉTAPE | OUI | titre « 📝 STUDIO · Bibliothèque de prompts ». |
| 4/5/6 | N/A | écran de gestion (pas un écran de projet). |
| 7 RETOUR | OUI | ⬅ Retour=R_studio (barre nav). |
| 8 REPRISE | N/A | gestion, pas de brouillon. |
| 9 NON-RÉG | OUI | renommer (`SP_REN`/`sp_rename_wait`) / supprimer (`SP_DEL`) ; même stockage que le workspace. |

---

## Verdict
**Aucun NON résiduel.** 4 incohérences détectées pendant la trace et **corrigées** avant livraison :
- **A** — `📁 Projet` affichait « (nouveau) » au 1er écran LOOK → id de projet créé dès l'entrée (`autosaveDraft`).
- **B** — PHOTO dupliquait Galerie/Décors (propriété STUDIO) → section PHOTO recentrée sur ✨ Nouveau look + 📂 Reprendre.
- **C** — l'upload (look/réf) laissait la photo utilisateur dans le fil → `delMsg` du message uploadé (bloc unique préservé).
- **D** — ❓ Aide d'un écran workspace s'affichait dans le bloc texte (bloc parasite) → aide rendue dans la caption du bloc média.

Grille **100% OUI** (N/A = hors périmètre d'un écran de projet, justifié).

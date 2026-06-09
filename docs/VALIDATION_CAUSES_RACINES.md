# VALIDATION DES CAUSES RACINES — preuve sur banc d'essai isolé (2026-06-10)

> **VERROU PRODUIT ABSOLU respecté** : le bot en production n'a **jamais** été modifié ni redémarré avec un changement. La démonstration a été faite dans un **git worktree jetable** `/tmp/proof_b1` (branche `proof/b1`), supprimé après mesure ; **prod restée sur `claude/remote-control-V3blj @ 4db50c0`**, aucun fichier produit modifié, bot (PID inchangé) intact. **C'est une démonstration isolée, pas un déploiement.** Roadmap PROVISOIRE, aucune priorisation figée.

## RÉSUMÉ EXÉCUTIF
- **B1 est PROUVÉ** : à l'étape IMAGE migrée, `photoImageView` renvoie `img=null` quand `has>0` mais `nlLocal()` échoue (URL distante expirée à la reprise) → le routeur (`out.image` falsy) bascule sur `ctx.show` = **texte** (ou crée un nouveau bloc si `activeRootMid` périmé). Démontré AVANT/APRÈS sur le vrai routeur (banc isolé) : AVANT=`TEXTE`, APRÈS=`MÉDIA`.
- **Le correctif « 1 ligne » fonctionne mais NE suffit PAS** : il corrige le cas observé, **mais B1.1 subsiste** — si toutes les sources sont nulles (pas de réf + thumbnail KO), le même repli texte se reproduit. Et le **même patron** existe dans **toutes** les vues média. ⇒ **B1 est un SYMPTÔME de la méta-cause MC2** (le routeur n'a pas de garantie/fallback média), pas un bug isolé.
- **Non-régression prouvée** : suites auto-portées vertes sur la branche (`photo_ws 6/6`, `video_ws 7/7`, `router 20/20`) ; baseline prod intacte (`16/15/7/7/8`) ; les KO vus dans le worktree sont **environnementaux** (checkout neuf sans JSON runtime) — prouvé par contrôle SANS le fix (KO identiques).
- **Les 18 frontières se regroupent autour de 3 méta-causes** (MC1/MC2/MC3) avec **confiance ÉLEVÉE** → traiter les causes architecturales, pas frontière par frontière.

---

## 1. PREUVE TECHNIQUE COMPLÈTE DE B1

**Code concerné (3 maillons) :**
1. `ui/router.js:53-54` — l'aiguillage média/texte :
   ```js
   if (out.image && ctx.showMedia) await ctx.showMedia(out.image, ...);  // BLOC MÉDIA
   else await ctx.show(out.caption || mod.title, rows, ...);             // BLOC TEXTE
   ```
2. `telegram_bot.js:1243` — `photoImageView()` :
   ```js
   const img = has ? nlLocal(p.image.idx) : (lookFile(p) || refThumb());
   ```
3. `telegram_bot.js:248-255` — `nlLocal(i)` :
   ```js
   if (newlook.files[i] && fs.existsSync(...)) return newlook.files[i];   // cache local
   const u = newlook.urls[i];
   if (String(u).startsWith('/')) { ...; return u; }                      // chemin local
   ... curl -sL u ...                                                      // URL distante
   if (fs.existsSync(tmp) && size>5000) return tmp;
   return null;                                                           // ÉCHEC -> null
   ```

**CONDITION précise du repli texte :** `has = p.image.urls.length > 0` **ET** `nlLocal(idx)` renvoie `null`. `nlLocal` renvoie `null` quand : pas de fichier en cache (`newlook.files` vide, p.ex. après /restart ou reprise) **ET** l'URL est **distante** (tmpfiles) **ET** le `curl` échoue ou rend < 5000 octets (**URL expirée** — tmpfiles est éphémère, cf. dette E59/E94).

**CHEMIN D'EXÉCUTION complet :**
`R_photo.image` → `routeBlock('photo.image')` → `uiRouter.route()` → `photoImageView()` → `img = has?nlLocal(idx):…` = **null** → `route()` teste `out.image` (falsy) → `ctx.show()` → `uiShow(...,'inplace')` → `tgEditText(activeRootMid)` = **`editMessageText`** (ou `send` si `activeRootMid` périmé → **nouveau bloc**).

**Valeurs réelles (reproduites au banc, cf. `tools/_proof_b1.js`) :**
| Variable | Valeur (cas reprise) | Conséquence |
|---|---|---|
| `has` (`image.urls.length`) | `1` (brouillon repris `2026/06/09/21/29`) | branche `nlLocal(idx)` |
| `newlook.files[idx]` | absent (cache vide post-restart) | pas de raccourci |
| `newlook.urls[idx]` | `https://tmpfiles.org/…` (distante, **expirée**) | curl échoue |
| `nlLocal(idx)` | **`null`** | `img=null` |
| `lookFile(p)` / `refThumb()` | dispo MAIS **non utilisés** (branche ternaire) | fallback ignoré |
| `out.image` | `null` | `route()` → `ctx.show` = **TEXTE** |

**Preuve journal (image RÉELLE)** : `23:03:45 BOT→ editMessageText : 📁 2026/06/09/21/29 · IMAGE 2/2 … 🖼 Aperçu : image 1/1 … ✅ Image 1/1 validée` → l'aperçu d'une **vraie image validée** rendu en **texte**.

**RAISON du repli legacy** : l'étape IMAGE devenant inutilisable, l'utilisateur reprend l'ancien chemin (`CL_NEW/NL_GO/…`) pour produire — observé #5 (cf. `RAPPORT_CONSOLIDE_FINAL`).

## 2. ANALYSE D'IMPACT

- **Frontières qui DISPARAISSENT si B1 corrigé** : **aucune** des F1–F18 (B1 n'est pas une frontière legacy mais un défaut du module cible). B1 corrigé **supprime le blocage**, pas une frontière.
- **Frontières qui RESTENT** : **toutes** (F1–F18). B1 ne touche ni l'éditeur (F1), ni le moteur (F2), ni Studio (F4–F10), etc.
- **Frontières actuellement MASQUÉES par B1** (non observables tant que B1 force le repli legacy) :
  - **F2/F3** (moteur/wizard) : tant que le workspace IMAGE est cassé, on ne peut pas atteindre `PL_GEN` → le chemin de génération **workspace** (`PL_GEN_DO→runNewLook`) n'a **jamais** été exercé (seul le legacy l'est). B1 corrigé → ce chemin devient enfin observable (et donc F2 qualifiable depuis la cible).
  - **#5/#6** (génération image dans le workspace), **#8/#9** (retour/reprise IMAGE) : masqués → deviennent testables.

## 3. VALIDATION DES MÉTA-CAUSES

### MC1 — Pas d'autorité de rendu unique  ·  confiance **ÉLEVÉE**
- Frontières : F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F14, F15, F16, F17, F18.
- Preuves : `grep` prod = **199 `send(`**, **29 `cardMenu(`**, **11 `cockpitPhoto(`** hors contrat routeur ; live `MENU_LOOKS→showGallery`, `PL_EDIT→sendPhoto`, `MAIN_MENU→sendMessage`.
- Mécanisme de propagation : chaque écran non enveloppé dans un module routeur rend via `send/cardMenu/cockpitPhoto` → nouveau message/cockpit → bloc unique cassé. **Factuel.**

### MC2 — Le module cible n'assure pas un rendu média robuste  ·  confiance **ÉLEVÉE**
- Frontière/instance : **B1** (+ **B1.1** démontré, + latent dans toutes les vues média).
- Preuves : démonstration `_proof_b1.js` (Cas1 TEXTE→MÉDIA ; Cas4 tout-null reste TEXTE) ; `route()` n'a **aucun fallback média** quand `out.image` est falsy.
- Mécanisme : une vue média peut renvoyer `image:null` → le routeur **bascule silencieusement en texte** au lieu d'un placeholder média → bloc unique cassé. **Factuel.**

### MC3 — Deux moteurs d'état concurrents  ·  confiance **ÉLEVÉE (existence) / MOYENNE (causalité « force le repli »)**
- Frontières : F2, F3 (et alimente le repli legacy).
- Preuves : code = `gw/genJob/newlook` (legacy) vs `proj` (cible) coexistent ; journal #5 = production faite en legacy.
- Mécanisme : la cible `proj` n'a pas (encore) d'issue de génération éprouvée → quand elle casse (B1), l'utilisateur reprend le moteur legacy. **Honnêteté** : que ce soit *systématiquement* B1 qui « force » le legacy est étayé par #5 mais repose sur un seul run réel → causalité **MOYENNE**.

## 4. CARTOGRAPHIE DES DÉPENDANCES F1→F18

| F | Cause racine | Dépendances | Correction associée | Impact attendu | Risque régression |
|---|---|---|---|---|---|
| F1 Éditeur | MC1 | bloque #7 ; utilise cockpit/style.json | modules `video.montage.*` | contexte préservé à l'édition | Élevé (état partagé) |
| F2 Moteur vidéo | MC1+MC3 | dépend `proj` mappé ; masquée par B1 | brancher `VX_GO`→moteur sur `proj` | mode auto/export possibles | Élevé (payant) |
| F3 Wizard `nl*` | MC1+MC3 | doublonne `photo.look/image` | rediriger `NL_NEW`→`photo.look` | fin du doublon/fuite | Moyen |
| F4 Galerie | MC1 | nourrit Photo/Vidéo | module `studio.looks` | looks en cockpit | Moyen |
| F5 Réf (Studio) | MC1 | 2ᵉ porte de `photo.ref` | `RX_REFS`→module | source réf unique | Faible |
| F6 Modèles | MC1 | lié F1 | module `studio.modeles` | styles en cockpit | Moyen |
| F7 Décors | MC1 | doublon `PL_ENV` | module/renvoi | cohérence | Faible |
| F8 Personas | MC1 | conditionne `proj.persona` | module `studio.personas` | multi-persona | Moyen |
| F9 Médias | MC1 | — | module lecture seule | consultation en cockpit | Faible |
| F10 Historique | MC1 | lié F2/genFolders | module grille+réouverture | reprise/auditabilité | Moyen |
| F11 Prêt-à-poster | MC1 | dépend F2 | module `recents.poster` | livraison en cockpit | Faible |
| F12 Retours | MC1 | transverse (tous Retour legacy) | `MAIN_MENU/HOME_*`→`R_*` | fin de l'empilement | Moyen |
| F13 Barre tech | MC1 | partout | `TECH_STOP/STATUS`→toast | irritant retiré | Faible |
| F14 Commandes | MC1 | doublons | redirection | cohérence | Faible |
| F15 Intake photo | MC1 | — | intégrer au workspace | geste naturel | Faible |
| F16 Flux anglais `MM_*` | MC1 | mort/résiduel | suppression | dette | Faible |
| F17 Pop-up `LS_*` | MC1+MC2 | au choix d'un look | choix in-bloc | pas d'interruption | Faible |
| F18 Menus annexes | MC1 | — | rattachement | dette | Faible |
| **B1** | **MC2** | masque F2/F3 ; bloque #5/#6/#8/#9 | fallback média garanti | **débloque la cible** | **Faible** (démontré) |

## 5. VALIDATION DU PARCOURS APRÈS B1 (banc d'essai isolé)

**Méthode** : worktree `/tmp/proof_b1`, correctif candidat ligne 1243 = `const img=(has&&nlLocal(idx))||lookFile(p)||refThumb();`, `node --check` OK, démonstration `tools/_proof_b1.js` sur le **vrai** `ui/router.js`, puis suppression du worktree.

**Résultats `_proof_b1.js` (6/6) :**
| Cas | Entrées | AVANT | APRÈS |
|---|---|---|---|
| 1 (reprise, URL expirée) | has=1, nlLocal=null, look=/look | **TEXTE** (B1) | **MÉDIA** ✅ |
| 2 (image résout) | has=1, nlLocal=/real | MÉDIA | MÉDIA (identique) |
| 3 (pas d'image) | has=0 | MÉDIA (look/réf) | identique |
| 4 (**B1.1**, tout null) | has=1, tout null | TEXTE | **TEXTE (non couvert)** |

**Ce que le correctif B1 (seul) garantit** : à l'étape IMAGE, **plus de repli texte ni de nouveau bloc** dès qu'un look OU une réf existe (cas réel courant) → l'image/édition/retour/reprise/nav restent **dans le bloc média**. *Nuance honnête* : si l'URL générée a expiré, la vignette montrée sera le **look/réf de repli**, pas l'image réelle (problème de **stockage persistant**, E59/E94, distinct de B1).

**B1.1 / B1.2 / B1.3 — autres manifestations du MÊME défaut (recherche active) :**
- **B1.1** (démontré, Cas 4) : `has>0` + `lookFile=null` + `refThumb=null` (aucune réf + thumbnail KO) → toujours TEXTE. Le fix ligne 1243 ne le couvre pas.
- **B1.2** (déduit du code) : **toutes** les vues média font `image: X || refThumb()` ; `refThumb()→nlCover()` peut renvoyer `null` (pas de réf + `ffmpeg`/`sips` échoue) → même repli texte dans `photoLookView`, `photoRefView`, `videoSourceView`, etc. *Confiance MOYENNE (non observé en live).* 
- **B1.3** (déduit) : `route()` n'offre **aucun fallback média** → c'est le point unique où la garantie devrait vivre. ⇒ **fix robuste = au niveau du routeur** (placeholder média si `out.image` falsy sur un module média) **+ un résolveur d'image garanti non-null**, plutôt que de patcher chaque vue.

**Non-régression :**
- Suites auto-portées (sans JSON runtime) sur la branche : `photo_ws 6/6`, `video_ws 7/7`, `photo_l0_2a 20/20` — **vertes avec le fix**.
- `nodup/stalefix/gallery/nbphotos` ont KO/aucune sortie **dans le worktree** → **contrôle SANS le fix = KO identiques** ⇒ **environnemental** (checkout neuf sans `lookbook.json`/`results_bloc.json`/`state.json`), **pas causé par B1**.
- **Baseline prod (avec données runtime) : `nodup 16 · feedback 15 · gallery 7 · nbphotos 7 · stalefix 8` — toutes vertes**, prod jamais modifiée.

## 6. ESTIMATION DU GAIN RÉEL (B1 corrigé SEUL)

- **Frontières qui disparaissent** : **0 / 18** (B1 n'est pas une frontière).
- **Frontières qui restent** : **18 / 18**.
- **Frontières qui deviennent enfin TESTABLES (démasquées)** : **F2, F3** (chemin génération workspace `PL_GEN→runNewLook` enfin atteignable) — soit **2**.
- **Scénarios de validation débloqués (sur 38)** : **#5, #6** (génération image **dans le workspace** au lieu du legacy), **#8, #9** (retour/reprise sur IMAGE rendus en média) → **4 scénarios** passent de FAIL/forced-legacy à testables/PASS. Indirectement, **#7** (édition après génération) devient atteignable proprement → jusqu'à **5**.
- **Reste bloqué** : tout F1–F18 (cockpit, Studio, moteur, export) ; **B1.1/B1.2** (cas tout-null) ; l'**image réelle expirée** (stockage E59/E94).

### CONCLUSION EXPLICITE
- **B1 est-il cause racine ou symptôme ?** → **SYMPTÔME** de **MC2** (le routeur/les vues média n'assurent pas un rendu média garanti) — et secondairement de la dette de **stockage** (URLs distantes expirées, E59/E94). Le « 1 ligne » **arrête l'hémorragie** sur le cas observé (bloc unique restauré pour #5/#8/#9) **mais ne traite pas la classe** (B1.1/B1.2). *Confiance : ÉLEVÉE.*
- **Les frontières sont-elles regroupables ?** → **OUI**, autour de **MC1** (rendu hors routeur — quasi toutes les F), **MC2** (rendu média non garanti — B1 & cie), **MC3** (deux moteurs). ⇒ **Traiter les causes architecturales** (autorité de rendu unique + résolveur média garanti + moteur piloté par `proj`) est plus efficace que 18 correctifs séparés. *Confiance : ÉLEVÉE.*
- **Recommandation de méthode (non figée)** : (a) corriger B1 **au niveau du routeur + résolveur garanti** (couvre B1/B1.1/B1.2 d'un coup, MC2) plutôt qu'une ligne locale ; (b) puis attaquer MC1 par le patron « un module routeur par écran » ; (c) MC3 (moteur sur `proj`) en Phase 4. *Aucune exécution ici.*

| Conclusion | Confiance |
|---|---|
| B1 reproduit + corrigé en isolation (TEXTE→MÉDIA) | **ÉLEVÉE** |
| B1 = symptôme de MC2 (pas cause racine ultime) | **ÉLEVÉE** |
| B1.1 résiduel (cas tout-null) | **ÉLEVÉE** (démontré) |
| B1.2 latent (autres vues média) | **MOYENNE** (déduit) |
| Regroupement F1–F18 ↦ MC1/MC2/MC3 | **ÉLEVÉE** |
| MC3 « force » le repli legacy | **MOYENNE** (1 run réel) |
| Gain chiffré (≈4–5 scénarios débloqués, 0 frontière supprimée) | **ÉLEVÉE** |

---

## INTÉGRITÉ DU BANC D'ESSAI (confirmation finale)
- **main/prod intacte** : branche `claude/remote-control-V3blj @ 4db50c0`, **aucun fichier produit modifié** (`git status` : seuls des backups `.pre*` préexistants non suivis).
- **Branche de preuve `proof/b1` : SUPPRIMÉE, non mergée.** Worktree `/tmp/proof_b1` : **retiré.**
- **Bot non redémarré avec le changement** (PID en cours inchangé par cette analyse).
- **Aucune dépense, aucune génération.**

_Analyse + démonstration isolée — 2026-06-10. Roadmap PROVISOIRE ; arbitrage à Etoile._

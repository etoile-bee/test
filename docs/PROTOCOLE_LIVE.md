# PROTOCOLE D'EXÉCUTION LIVE — scénarios non simulables (campagne exhaustive)  ·  2026-06-10

> Pour les scénarios **catégorie B** (génération payante / action manuelle) qui ne peuvent PAS être simulés à sec.
> **À exécuter AVEC Etoile, sur son accord explicite** (dépense réelle). Je surveille le journal en direct (`🖼 ws create/edit/close`, `BOT→ send*/edit*`).
> **VERROU STRICT** maintenu : aucune migration/hotfix pendant ces tests — **on observe et on note** (y compris B1/F13 qui resteront visibles).
> Coûts : crédits Higgsfield/Seedream (images), Kling + ElevenLabs (vidéo), Anthropic (script). **⚠️ Anthropic possiblement épuisé** → la génération de script (#15a) peut échouer ; prévoir un script saisi à la main.

## Convention de surveillance (pour chaque étape)
Je vérifie 4 choses dans le journal :
1. **Bloc unique** : `editMessageMedia/Caption` sur le mid du workspace, **PAS** `sendPhoto/sendMessage` parasite. ✅/🔴
2. **Contexte conservé** : en-tête (📁/🖼/🎯/✍️/📝) cohérent après l'action.
3. **Frontière franchie** : tout passage vers un handler legacy (`NL_*`, `GAL_*`, `GF_*`, `RES_*`, `MAIN_MENU`…) = note + Fxx.
4. **B1** : l'étape IMAGE reste-t-elle en bloc média une fois de vraies images présentes ?

---

## #5 — Générer 1 image (éco)
- **Pré-requis** : un projet PHOTO avec un look choisi (galerie ou config). En-tête visible.
- **Étapes** : 📸 PHOTO → ✨ Nouveau look → (choisir Tenue/Décor, ou 🖼 Galerie → ✅) → **➡ Suivant** (IMAGE) → **💲 Générer** → **✅ Confirmer 💲**.
- **Résultat attendu** : pendant la génération, le bloc workspace affiche un état « ⏳ » **en place** ; à la fin, **l'image générée s'affiche DANS le même bloc** (vignette réelle), boutons sélection/valider.
- **Je surveille** : `🖼 ws edit` (pas de `sendPhoto` nouveau) pendant et après ; **test crucial de B1** — si l'image arrive et que le bloc bascule en texte ou se duplique → 🔴 B1/nouvelle zone.
- **Coût estimé** : 1 image éco ≈ **~0,5 crédit** (le récap in-bloc affiche le montant exact avant confirmation).
- **Risque** : faible (éco, 1 image). Risque produit = révéler B1 sur image réelle.

## #6 — Générer 2 puis 3 images (planche / multi)
- **Étapes** : même entrée → à l'étape LOOK, régler **📸 Nombre = 2** (puis refaire avec **3**) → ➡ Suivant → 💲 Générer → ✅ Confirmer.
- **Résultat attendu** : planche/poses multiples **dans le bloc** ; navigation **‹ n/N ›** et **✅ Valider cette image** en place ; l'image validée devient la source vidéo.
- **Je surveille** : navigation `PL_PREV/NEXT` = `editMedia` (pas de nouveaux messages) ; sélection écrit `proj.image.validated` ; **B1** au retour sur IMAGE.
- **Coût** : 2 puis 3 images éco ≈ **~1 puis ~1,5 crédit** (récap in-bloc).
- **Risque** : faible-moyen (multi-images).

## #15 — Générer la vidéo (script → montage → export)
- **Pré-requis** : une image validée (#5/#6) OU un look ; idéalement enchaîner via **🎬 Faire une vidéo**.
- **Étapes** :
  - **15a Script** : VIDÉO·Script → **✍️ Éditer** (coller un script à la main pour éviter Anthropic) OU **🤖 Générer 💲** (si crédits Anthropic).
  - **15b Montage** : ➡ Suivant → (option **🎨 Éditer** = éditeur avancé — **attention F1**, je note tout nouveau bloc).
  - **15c Légende** : ➡ Suivant → ✍️ Éditer la légende.
  - **15d Export** : ➡ Suivant → **💲 Générer la vidéo** → **✅ Confirmer 💲**.
- **Résultat attendu** : génération réelle (parts Kling + voix), puis **livrable vidéo**. ⚠️ Aujourd'hui `VX_GO` est un **bridge non câblé** (#16/F2) → **probable point d'arrêt** : la confirmation marche mais la génération réelle n'est pas encore branchée sur `proj`.
- **Je surveille** : confirmation in-bloc ✅ ; au-delà, **bascule vers le moteur legacy** (`recapGo/genFinal/RES_*/GF_*`) = **frontière F2** → note précise (c'est le test qui qualifie F2).
- **Coût** : vidéo ~23 s ≈ **~13 crédits** (Kling+voix) + éventuel Anthropic (script). Récap in-bloc avant confirmation.
- **Risque** : **élevé** (dépense importante ; F2 non branché ⇒ le livrable peut ne pas sortir du workspace). **À ne lancer que si Etoile accepte de qualifier F2 en réel.**

## #16 — Export / livrable final
- **Statut** : **catégorie C tant que F2 (Phase 4) n'est pas fait.** `VX_GO` n'appelle pas encore le moteur.
- **À exécuter** : seulement **après** branchement F2. Étapes prévues : Export → ✅ Confirmer → fichier vidéo + légende/tags livrés **dans/depuis le bloc**.
- **Je surveillerai** : le livrable arrive-t-il sans quitter le cockpit ? sinon F2/F11.
- **Coût** : inclus dans #15. **Risque** : N/A pour l'instant.

## #17 — Prêt à poster
- **Pré-requis** : une vidéo réellement générée (#15) et archivée.
- **Étapes** : `/menu` → 🕘 RÉCENTS → 📤 Prêt à poster → choisir la vidéo → (livraison fichier + 📋 légende longue).
- **Résultat attendu** : la vidéo et ses livrables sont retrouvés et envoyés.
- **Je surveille** : `showReady`/`READY_*`/`POSTLONG_` = **écran legacy F11** (messages séparés, inévitable pour un média lourd ?) → note Fxx + impact.
- **Coût** : nul (ré-envoi d'un fichier existant). **Risque** : faible.

---

## RE-VÉRIFICATIONS LIVE (catégorie A, mais à refaire AVEC de vraies données — chasse F19+)
À faire pendant/après les générations ci-dessus, **sans coût supplémentaire** :
- **#8/#9 (B1 réel)** : revenir sur l'étape IMAGE et **reprendre le brouillon** une fois de vraies `image.urls` présentes → confirmer si B1 se déclenche systématiquement.
- **#11/#13 (nav croisée réelle)** : avec une image générée, faire IMAGE → 🎬 Faire une vidéo → ⬅ retour PHOTO → revenir VIDÉO : vérifier média actif + script conservés (pas de perte, pas de nouveau bloc).
- **Reprise après génération** : `/restart` juste après une génération → RÉCENTS›Reprendre → l'image/vidéo générée est-elle bien rattachée au projet ? (zone reprise+export = chasse F19+).
- **Export depuis l'historique** : ouvrir une génération passée (F10) → tenter de la rouvrir dans le cockpit → note tout écran externe.

## CHASSE F19+ — zones sous surveillance renforcée pendant le live
Génération vidéo réelle · export/livrable · prêt-à-poster · navigation croisée PHOTO↔VIDÉO · reprise après génération.
**Toute zone qui ouvre un nouveau bloc/cockpit/écran non catalogué → fiche F19+ (emplacement / quand / contournements / règles cassées / migration) ajoutée à `FRONTIERES_LEGACY.md` + `PRIORISATION_PRODUIT.md` + `CAMPAGNE_VALIDATION.md`.**

## Récapitulatif coûts (à valider par Etoile avant lancement)
| Scénario | Dépense | Crédits approx. |
|---|---|---|
| #5 (1 image éco) | images | ~0,5 cr |
| #6 (2 + 3 images) | images | ~1 + ~1,5 cr |
| #15 (vidéo ~23s) | Kling+voix (+Anthropic) | ~13 cr (+ script) |
| #16 (export) | inclus #15 | — (après F2) |
| #17 (prêt à poster) | aucune | 0 |
| **Total minimal #5+#6+#15** | | **~16 cr** + crédits Anthropic |

> Aucune de ces exécutions n'est lancée sans **« GO » explicite d'Etoile**. Le récap de coût in-bloc reste la dernière barrière avant chaque dépense.

_Protocole prêt. Exécution = sur décision d'Etoile. Aucune migration entre-temps. — 2026-06-10_

# P1-c — BLOC UNIQUE : cartographie des recréations (INVESTIGATION, aucun code)

## Mécanisme (source de vérité : `ui/spine_block.js` `plan()`)
Le bloc cockpit est édité EN PLACE sauf à UNE frontière : **texte ↔ média**.
- pas de bloc → `recreate` (1ʳᵉ pose) — normal.
- même nature (texte→texte, photo→photo, vidéo→vidéo) → `edit` en place (même message_id).
- photo ↔ vidéo → `editMedia` en place (même message_id) — pas de nouvelle carte.
- **texte ↔ média → `recreate`** = **limite STRUCTURELLE Telegram** (on ne convertit pas un message texte en message média, ni l'inverse). C'est le SEUL point de recréation.

## Cartographie réelle (dump `bot.markup().kind` sur le vrai parcours)
```
home(vide)              text
photo_prompt(vide)      text
photo_result            photo   <- 1er média (recreate ATTENDU, 1x)
photo_prompt(avec photo) photo
block prompt            text    <- ⚠️ media->TEXTE->media = 2 recreate juste pour éditer le prompt
confirm (aperçu)        photo
validation              text    <- ⚠️ photo->TEXTE->photo en plein flux génération = 2 recreate
confirm2                photo
video_edit              photo
block script (projet vidéo) text <- ⚠️ media->TEXTE->media = 2 recreate
resources               video
```
→ Les « nouveaux blocs » qu'Etoile voit = ces écrans **TEXTE insérés dans un flux MÉDIA** : surtout **validation** (cœur du flux génération) et les **blocs texte prompt/script**.

## Proposition CIBLÉE (à valider AVANT que je code)
**FIX-1 (recommandé, ciblé, fort impact) — `validation` en MÉDIA+légende.**
Rendre `validationView` comme l'IMAGE SOURCE projet + le récap chiffré en légende (mêmes infos, mêmes boutons). Effet :
- le flux `confirm(média) → validation(média) → confirm2(média)` devient **100% média → édition EN PLACE, 0 recréation** dans le cœur de la génération ;
- bonus : la source projet s'affiche sur validation (cohérent avec P1-a), plus de bascule visuelle.
- Impact : **1 seule vue** changée (kind texte→média+caption), 0 déplacement de bouton, 0 refonte. Risque faible. Réversible.
- Limite : légende média = 1024 car (le récap chiffré tient largement). 

**FIX-2 (optionnel, à ARBITRER — touche une feature existante) — blocs prompt/script en média+légende.**
Aujourd'hui forcés en TEXTE (`pkFree`) pour offrir le bloc `<code>` COPIABLE (feature C voulue par Etoile). Les passer en média supprimerait 2 recreate par édition MAIS dégraderait la copie du texte long (limite 1024). → **Ne PAS faire sans arbitrage** : le « 📄 Texte complet » (message séparé) couvre déjà la copie ; à trancher avec Etoile (P3 #8 traite justement l'affichage du script). Je le laisse en l'état pour l'instant.

## Ce qui reste STRUCTUREL (CHANTIER — documenté, NON fait)
Éliminer TOUTE recréation = rendre TOUS les écrans texte (home vide, studio, recents, resources, quit) en média → **refonte transverse** contre une limite Telegram. **Non rentable / hors discipline.** Les recréations résiduelles (entrer dans Studio/Fichiers depuis un média) sont rares, hors flux de création, et sans perte (recreate poste-puis-supprime, jamais de trou). On les garde.

## Recommandation
Faire **FIX-1 (validation → média+légende)** comme lot ciblé P1-c (sur ton go) — il supprime les recréations du cœur génération + montre la source. Laisser FIX-2 à l'arbitrage Etoile (lié à P3 #8). Ne pas toucher au reste (structurel).

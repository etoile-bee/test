# LOT 2 — PHOTO 2-ÉTAPES · RENDU AVANT/APRÈS (scope, AUCUN code écran — à valider AVANT de figer)

> Objet : restructurer le parcours photo en **2 étapes claires** (Choisir = SOURCE · Préparer = PARAMÈTRES), épingler la source à « ✅ Valider la photo », retirer Référence du parcours, placer 🎛 Influences (5 bascules, réf masquée) en Étape 2, brancher la boîte à outils #7 via 🛠 Modifier en Étape 1. **Impact minimal : on réutilise les 2 écrans existants, aucun nouvel écran de flux (sauf 1 bloc toolbox MVP).**
> Statut : **PROPOSITION** — Etoile revérifie l'avant/après avant tout code.

---

## ÉCRAN 1 — PHOTO · Choisir  (`photoView`)

### AVANT (réel, capté @ 9ffff8b)
```
<b>📸 PHOTO · Choisir</b>
🖼 1 photo disponible dans le projet
📸 Source active : IMG_source.jpg

[ ✅ Utiliser ]   [ ✏️ Modifier ]      ← Utiliser→Préparer · Modifier→galerie
[ ✨ Générer ]    [ 📥 Importer ]
[ 🕘 Historique ] [ ◀ Retour ]
```
Problèmes : « Utiliser » ambigu (ça prépare, ça ne valide rien) · pas de geste explicite « cette photo EST la source du projet » · vocab « Utiliser » hors charte LOT 1.

### APRÈS (proposé)
```
<b>📸 PHOTO · Choisir</b>
🖼 1 photo disponible dans le projet
📸 Source active : IMG_source.jpg

[ ✅ Valider la photo ]                 ← ÉPINGLE la source (r0PinSource) puis → Préparer
[ ✅ Garder ]   [ 🔄 Changer ]          ← Garder = source en l'état · Changer = galerie/import
[ 🛠 Modifier ] [ ✨ Générer ]          ← Modifier = boîte à outils #7 (recadrer/retoucher local) · Générer = IA
[ 📥 Importer ] [ 🕘 Historique ]
[ ◀ Retour ]
```
- **« ✅ Valider la photo »** = LA charnière : `R0_PH_VALID` → `r0PinSource(persona,id,file)` → source épinglée du projet → `go('photo_prompt')`. (cb existant `R0_PH_VALID` réaffecté de « toast paramètres validés » vers « pin + Préparer ».)
- Vocab LOT 1 respecté : **Garder / Changer** (plus de « Utiliser »).
- **🛠 Modifier** → boîte à outils #7 (MVP local, zéro dépense — cf `docs/P2-7_BOITE_OUTILS_SCOPE.md`).

---

## ÉCRAN 2 — PHOTO · Préparer  (`photoPromptView`)

### AVANT (réel, capté @ 9ffff8b)
```
<b>📸 PHOTO · Préparer</b>
Choisissez l'action suivante.
📸 Source active : IMG_source.jpg

[ 📝 Prompt ]  [ 👗 Tenue ]
[ 🏛 Décor ]   [ 🖼 Référence ]         ← Référence DANS le parcours
[ 🎛 Influences ]
[ 👁 Aperçu ]
[ 🎬 Faire une vidéo ]
[ ◀ Retour ]
```
Problèmes : « Référence » encombre le cœur métier (consultable ailleurs, pas un paramètre de génération courant) · pas de « ✅ Valider » explicite avant Aperçu/Générer.

### APRÈS (proposé — VALIDÉ Etoile)
```
<b>📸 PHOTO · Préparer</b>
Choisissez l'action suivante.
📸 Source active : IMG_source.jpg

[ 👗 Tenue ]   [ 🏛 Décor ]
[ 🎛 Influences ] [ 📝 Prompt ]          ← Référence RETIRÉE du parcours (code conservé, réactivable)
[ 👁 Aperçu ]
[ 🎬 Faire une vidéo ]
[ ◀ Retour ]
```
- **🖼 Référence retirée** du parcours (B4). Le bloc Référence (`R0_PHB_reference`) et le handler restent dans le code — réactivables — mais ne sont plus exposés en Préparer ni mentionnés dans Aperçu/Résultat.
- **🎛 Influences** reste en Étape 2 (déjà sa place), passe à **5 bascules** (réf masquée — voir ci-dessous).
- **[DÉCISION Etoile] PAS de « ✅ Valider les paramètres » séparé** : il doublonnerait. On garde le flux D3 déployé et stable — Préparer → **👁 Aperçu** (seule action de production) → l'écran Aperçu a déjà **✅ Valider** → **Validation chiffrée** (coût) → **✨ Générer**. Valider/Générer vivent en aval (cohérent « même bouton = même comportement »).
- Ordre : Tenue/Décor (les plus utilisés) en tête, puis Influences/Prompt, puis Aperçu.

---

## 🎛 INFLUENCES — 5 bascules (réf masquée)

### AVANT (réel, `blockSpec` key=influences)
```
🎛 Influences actives
[ ☑ Utiliser la source principale ]
[ ☑ Utiliser la tenue ]
[ 🔓 Conserver la tenue ]
[ ☑ Utiliser le décor ]
[ 🔓 Conserver le décor ]
[ ☑ Utiliser les références visuelles ]   ← 6e bascule (réf)
```

### APRÈS (proposé — OPTION 2 : masque la bascule réf)
```
🎛 Influences actives
[ ☑ Utiliser la source principale ]
[ ☑ Utiliser la tenue ]
[ 🔓 Conserver la tenue ]
[ ☑ Utiliser le décor ]
[ 🔓 Conserver le décor ]
```
- **5 bascules** : `use_source · use_look · lock_look · use_decor · lock_decor`.
- **`use_refs` MASQUÉ** de la surface (la ligne « Utiliser les références visuelles » est retirée des `optionRows`). Le drapeau `use_refs` reste dans le draft (défaut true) et continue d'alimenter `buildPhotoOpts` ; côté résumé Aperçu, le segment « ✗/✓ Réf » est retiré aussi. **refs→moteur = 🟡 PLANIFIÉ** (non recâblé ici).

---

## INVARIANT SOURCE ACTIVE + TEST HASH (transverse LOT 2)

- **Pin** : « ✅ Valider la photo » (Étape 1) **et** toute génération réelle (`r0PinSource` en fin de `R0_GO`) → source unique du projet.
- **Reprise** : `r0SourceFile` / `_r0IsRef` / `r0RealSource` relisent la même source après `/restart`.
- **Assertion runtime à ajouter** (`test_v4r_runtime.js`) — *« source active invariante »* :
  `gen → ✅ Valider la photo → 🎬 Faire une vidéo → /restart → reprise` ⇒ **même sha1** de la source aux 4 points.

---

## BOÎTE À OUTILS #7 (🛠 Modifier, Étape 1) — MVP COULEUR (VALIDÉ Etoile)

- 1 bloc neuf `edition` (non-destructif, ffmpeg local, **zéro dépense**).
- **MVP EXACT validé** : **Luminosité · Contraste · Saturation · Netteté** (réglages couleur) + **👁 Aperçu · ↺ Réinitialiser · ✅ Valider**.
- **NON-DESTRUCTIF** : l'original est conservé ; les réglages ne s'appliquent qu'à **✅ Valider** (validation obligatoire). ↺ Réinitialiser remet les valeurs neutres.
- **HORS MVP (🟡 PLANIFIÉ)** : recadrage / pivot / rotation — **pas** dans ce lot.
- Entrée unique : **🛠 Modifier** en Étape 1. Sortie : retour Étape 1 avec la photo ajustée comme source candidate (puis « ✅ Valider la photo » l'épingle).
- Repli : si même ce MVP couleur dépasse le lot ciblé, livrer Modifier→galerie d'abord + #7 🟡 — mais **viser le MVP couleur** (validé Etoile).

---

## CARTE DES CHANGEMENTS (pour estimer le risque)

| Zone | Avant | Après | Type |
|---|---|---|---|
| `photoView` rows | Utiliser/Modifier·Générer/Importer·Hist/Retour | + ✅ Valider la photo · Garder/Changer · 🛠 Modifier | label+flux |
| `R0_PH_VALID` (nav) | toast « paramètres validés » | pin source + go('photo_prompt') | sémantique cb |
| `photoPromptView` rows | …Référence… | Référence retirée + ✅ Valider params | retrait+ajout |
| `blockSpec` influences | 6 bascules | 5 (use_refs masqué) | retrait 1 ligne |
| Aperçu résumé influences | « …✓ Réf » | sans « Réf » | label |
| `test_v4r_runtime` | — | + assertion sha1 invariant | test |
| bloc `edition` (#7) | absent | MVP local (ou 🟡 planifié) | nouveau bloc |

**Risque global : MODÉRÉ** (touche le flux d'entrée photo). Aucune refonte d'architecture, aucun écran de flux supplémentaire (hors bloc toolbox MVP). cb réutilisés au maximum.

---

## CE QUE JE NE TOUCHE PAS (discipline)
- VIDÉO Choisir/Préparer (« ✨ Autre photo » etc.) = **LOT 3**.
- subtitle_style.js / color_style.js = **verrouillés**.
- Le code Référence n'est pas supprimé, seulement **désexposé** (réactivable).
- LIVE / budget : inchangés.

> Prochaine étape : Etoile valide cet avant/après → je code LOT 2 offline (preuve dump + sweep/audit + test hash), tu revérifies commit-par-commit, puis go déploiement. **Rien n'est codé ni déployé tant que l'avant/après n'est pas validé.**

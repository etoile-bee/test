# P2 #7 — BOÎTE À OUTILS PHOTO (scope, AUCUN code — go requis)

## Faisabilité (briques DÉJÀ là)
- `render_local.buildColorFilter(img)` génère **déjà** `eq=brightness:contrast:saturation` + `unsharp=...:sharpness` → **luminosité / contraste / saturation / netteté = trivial** (mêmes filtres que le pipeline vidéo).
- ffmpeg local présent : `eq`, `unsharp`, `crop`, `curves`, `colorbalance` → recadrage + filtres légers possibles.
- **Édition = LOCALE, GRATUITE** (ffmpeg sur une image existante) — AUCUNE génération, AUCUNE dépense moteur. À ne pas confondre avec `r0RealPhoto` (Seedream, payant).
- `FX_DEFAULT.image = {brightness, contrast, saturation, temperature, sharpness, vignette}` = schéma de réglages prêt.

## Principe NON-DESTRUCTIF (exigence Etoile)
- Les réglages vivent dans `draft.photo.fx` (valeurs), **PAS appliqués** tant que pas Validé.
- **Aperçu** : rend une preview (ffmpeg `eq`/`unsharp` sur la source) — local, gratuit, ré-rendu à chaque réglage.
- **Valider** : applique la chaîne sur l'ORIGINAL → **nouveau candidat image** (`addCandidate`), l'original reste intact (historique).
- **Réinitialiser** : `draft.photo.fx` ← défauts. **Annuler/Retour** : abandonne les réglages non validés.

## Version MINIMALE VIABLE (MVP) — recommandée
Bloc « 🎨 Édition image » (le stub `R0_PHB_edition` existe déjà), atteignable depuis Photo·Préparer / Résultat :
- **Luminosité · Contraste · Saturation · Netteté** : 3 crans chacun (− / 0 / +) via `R0_SET_fx*` (pas de slider continu sur Telegram).
- **👁 Aperçu** (re-render preview) · **↺ Réinitialiser** · **✅ Valider** (→ nouveau candidat) · **◀ Retour**.
- Stockage `draft.photo.fx` ; helper `r0ApplyPhotoFx(src, fx)` (ffmpeg local) ; non-destructif.
- **Effort : M** · risque faible (local, gratuit, original jamais écrasé) · testable offline (valeurs fx + nouveau candidat au Valider, 0 dépense).

## 🟡 PLANIFIÉ (hors MVP — plus lourd / UX Telegram limitée)
- **Recadrage** : `crop` OK côté ffmpeg, mais pas de drag sur Telegram → proposer des **ratios/zoom préréglés** (1:1 / 4:5 / 9:16 / zoom +) plutôt qu'un crop libre. **M**.
- **Filtres nommés** (chaud / froid / N&B / doux) via `curves`/`colorbalance` presets. **S-M**.
- **Mémoire par look** (réglages mémorisés par tenue) — existe en legacy (`lookStylePending`), à recâbler v4r. **M**.

## Réserve / garde-fous
- Source iCloud dataless → matérialiser (`r0EnsureLocal`) avant ffmpeg (même garde que les sous-titres).
- L'édition image ne touche JAMAIS le verrou sous-titres ni la génération payante (chemins séparés).

## Recommandation
Faire le **MVP** (luminosité/contraste/saturation/netteté + aperçu/valider/réinitialiser, non-destructif) en 1 lot offline sur ton go ; recadrage + filtres + mémoire-par-look = 🟡 lot suivant. Preuve : aperçu réel (clip/png) avant/après + assertion « Valider crée un nouveau candidat, original conservé, 0 dépense ».

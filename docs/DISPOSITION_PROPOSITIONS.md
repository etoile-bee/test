# DISPOSITION Photo/Vidéo — 3 propositions (Etoile tranche, NE PAS FIGER)

> Principes communs (modèle déjà validé) : contrôles en haut, média/bloc figé dessous ; ordre = navigation → utilitaires → **action principale en bas** (Valider puis Générer maintenant) ; grilles = flèches en haut, Choisir au milieu, numéros dessous.

## État ACTUEL (markup réel)
- **PHOTO·Préparer** : `📝 Prompt · 👗 Tenue · 🏛 Décor · 🖼 Référence · 👁 Aperçu · 🎬 Faire une vidéo · ◀ Retour · ✅ Valider · ✨ Générer`
- **VIDÉO·Préparer** : `✅ Garder · 🔄 Remplacer · ✨ Autre photo · 🛠 Montage · 📸 Outils photo · 👁 Aperçu · ◀ Retour · ✅ Valider · ✨ Générer`
- **VIDÉO·Montage** : `📝 Script · 🎵 Musique · 🔤 Sous-titres · ⏱ Durée · 👁 Aperçu · ✅ Valider · ✨ Générer`
- Reproche Etoile : « rien n'est intuitif » (trop de boutons mêlés, action principale pas évidente).

## PROPOSITION 1 — « Étapes numérotées » (linéaire, guidée)
PHOTO : `① Prompt · ② Tenue · ③ Décor` / `🖼 Référence` / `——` / `👁 Aperçu` / `✅ Valider → ✨ Générer` / `◀ 🏠 🛑`
VIDÉO : `① Photo source (Garder/Changer)` / `② 🛠 Montage` / `——` / `👁 Aperçu` / `✅ Valider → ✨ Générer` / `◀ 🏠 🛑`
→ Avantage : ordre d'exécution évident. Inconvénient : un peu rigide.

## PROPOSITION 2 — « 2 zones : Réglages / Action » (groupée)
PHOTO : ligne Réglages `📝 Prompt · 👗 Tenue · 🏛 Décor · 🖼 Réf` / ligne Action `👁 Aperçu · ✅ Valider · ✨ Générer` / pont `🎬 Faire une vidéo` / `◀ 🏠 🛑`
VIDÉO : Réglages `🖼 Source · 🛠 Montage` / Action `👁 Aperçu · ✅ Valider · ✨ Générer` / pont `📸 Outils photo` / `◀ 🏠 🛑`
→ Avantage : séparation claire réglages vs action. Recommandée par défaut.

## PROPOSITION 3 — « Minimaliste » (1 réglage à la fois)
PHOTO : `🎛 Réglages ▸` (ouvre Prompt/Tenue/Décor/Réf) / `👁 Aperçu` / `✨ Générer` / `◀ 🏠`
VIDÉO : `🎛 Montage ▸` / `👁 Aperçu` / `✨ Générer` / `◀ 🏠`
→ Avantage : écran épuré. Inconvénient : réglages à 1 tap de plus.

## À décider avec Etoile
- Quelle base (1/2/3 ou mélange) ?
- « Valider » et « Générer » : 2 boutons distincts (actuel) ou fusionnés en « ✨ Générer » (Aperçu = la validation) ?
- « Faire une vidéo » / « Outils photo » : libellés et place du pont photo↔vidéo.
- Grille : libellé du bouton central (« ✅ Choisir » vs « Page X/Y »).

> Une fois la base choisie → carte écran-par-écran exacte → implémentation dans le déploiement groupé.

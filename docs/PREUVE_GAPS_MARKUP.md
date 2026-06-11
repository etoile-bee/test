# PREUVE MARKUP RÉEL — gaps G1–G5 (sortie du vrai chemin r0Dispatch/view, bac isolé)

> Généré par `tools/gen_preuve_gaps.js` : chaque écran est atteint par la VRAIE séquence de taps, le markup est rendu par le MÊME `NAV.view` que le peintre live (`bot.markup()`), puis imprimé tel qu'il sort. Aucun grep de code.

## G1 — Galerie (SÉLECTION) ≠ Historique (CONSULTATION chronologique)

**GALERIE (R0_PH_GAL)** — écran réel `gallery` (kind=photo)

```
TITRE: 🖼 Galerie globale · 12 photo(s) · page 1/2 ⏎ touche un numéro pour l'utiliser
  [◀ Précédent →R0_GPREV | ✅ Choisir →R0_GCHOOSE | Suivant ▶ →R0_GNEXT]
  [🖼 1 →R0_GITEM_0 | 🖼 2 →R0_GITEM_1 | 🖼 3 →R0_GITEM_2]
  [🖼 4 →R0_GITEM_3 | 🖼 5 →R0_GITEM_4 | 🖼 6 →R0_GITEM_5]
  [📁 Ce projet →R0_GALSCOPE | 🗑 Retirer →R0_GALDEL]
  [◀ Retour →R0_PHOTO | 🏠 Accueil →R0_HOME]
  [🛑 Stop →R0_STOP]
```

**HISTORIQUE (R0_PH_HIST)** — écran réel `gallery` (kind=photo)

```
TITRE: 🕘 Historique photos · 12 photo(s) · page 1/2 ⏎ journal en lecture — touche un numéro pour le revoir
  [◀ Précédent →R0_GPREV | Suivant ▶ →R0_GNEXT]
  [🖼 1 →R0_GVIEW_0 | 🖼 2 →R0_GVIEW_1 | 🖼 3 →R0_GVIEW_2]
  [🖼 4 →R0_GVIEW_3 | 🖼 5 →R0_GVIEW_4 | 🖼 6 →R0_GVIEW_5]
  [📁 Ce projet →R0_GALSCOPE | 🗑 Retirer →R0_GALDEL]
  [◀ Retour →R0_PHOTO | 🏠 Accueil →R0_HOME]
  [🛑 Stop →R0_STOP]
```

→ Galerie expose `✅ Choisir`+`R0_GITEM_` (sélection) ; Historique expose `R0_GVIEW_` SANS `✅ Choisir` (lecture). Plus aucun écran identique.

## G2 — Fichiers : ◀ Retour revient à l'ORIGINE

**FICHIERS depuis RÉCENTS** — écran réel `resources` (kind=text)

```
TITRE: 🗂 Ressources du projet · Projet · 12 juin 00h39 ⏎ 🖼 Photos : 0   🎬 Vidéos : 0 ⏎ 📝 Prompt : à définir ⏎ 👗 Tenue : à définir   🏛 Décor : à définir ⏎ 🎬 Script : à définir ⏎ ✏️ Légende courte : à définir ⏎ 📄 Légende longue : à définir ⏎ #️⃣ Hashtags : à définir ⏎ 🔤 Sous-titres : auto
  [🖼 Image →R0_GETIMG | 🎬 Vidéo →R0_GETVID | 🎙 Voix/Audio →R0_GETAUDIO]
  [📝 Prompt →R0_FULLTEXT_prompt | 🎬 Script →R0_FULLTEXT_script | 🔤 Sous-titres →R0_FULLTEXT_soustitres]
  [✏️ Lég. courte →R0_FULLTEXT_legc | 📄 Lég. longue →R0_FULLTEXT_legl | #️⃣ Hashtags →R0_FULLTEXT_tags]
  [🕘 Historique photos →R0_PH_HIST | 🕘 Historique vidéos →R0_VI_HIST]
  [✏️ Éditer légendes →R0_PUB_EDIT | 📤 Publication →R0_PUB]
  [◀ Retour →R0_RECENTS | 🏠 Accueil →R0_HOME]
  [🛑 Stop →R0_STOP]
```

**FICHIERS depuis STUDIO** — écran réel `resources` (kind=text)

```
TITRE: 🗂 Ressources du projet · Projet · 12 juin 00h39 ⏎ 🖼 Photos : 0   🎬 Vidéos : 0 ⏎ 📝 Prompt : à définir ⏎ 👗 Tenue : à définir   🏛 Décor : à définir ⏎ 🎬 Script : à définir ⏎ ✏️ Légende courte : à définir ⏎ 📄 Légende longue : à définir ⏎ #️⃣ Hashtags : à définir ⏎ 🔤 Sous-titres : auto
  [🖼 Image →R0_GETIMG | 🎬 Vidéo →R0_GETVID | 🎙 Voix/Audio →R0_GETAUDIO]
  [📝 Prompt →R0_FULLTEXT_prompt | 🎬 Script →R0_FULLTEXT_script | 🔤 Sous-titres →R0_FULLTEXT_soustitres]
  [✏️ Lég. courte →R0_FULLTEXT_legc | 📄 Lég. longue →R0_FULLTEXT_legl | #️⃣ Hashtags →R0_FULLTEXT_tags]
  [🕘 Historique photos →R0_PH_HIST | 🕘 Historique vidéos →R0_VI_HIST]
  [✏️ Éditer légendes →R0_PUB_EDIT | 📤 Publication →R0_PUB]
  [◀ Retour →R0_STUDIO | 🏠 Accueil →R0_HOME]
  [🛑 Stop →R0_STOP]
```

**FICHIERS depuis PHOTO·Résultat** — écran réel `resources` (kind=photo)

```
TITRE: 🗂 Ressources du projet · Projet · 12 juin 00h39 ⏎ 🖼 Photos : 1   🎬 Vidéos : 0 ⏎ 📝 Prompt : à définir ⏎ 👗 Tenue : à définir   🏛 Décor : à définir ⏎ 🎬 Script : à définir ⏎ ✏️ Légende courte : à définir ⏎ 📄 Légende longue : à définir ⏎ #️⃣ Hashtags : à définir ⏎ 🔤 Sous-titres : auto
  [🖼 Image →R0_GETIMG | 🎬 Vidéo →R0_GETVID | 🎙 Voix/Audio →R0_GETAUDIO]
  [📝 Prompt →R0_FULLTEXT_prompt | 🎬 Script →R0_FULLTEXT_script | 🔤 Sous-titres →R0_FULLTEXT_soustitres]
  [✏️ Lég. courte →R0_FULLTEXT_legc | 📄 Lég. longue →R0_FULLTEXT_legl | #️⃣ Hashtags →R0_FULLTEXT_tags]
  [🕘 Historique photos →R0_PH_HIST | 🕘 Historique vidéos →R0_VI_HIST]
  [✏️ Éditer légendes →R0_PUB_EDIT | 📤 Publication →R0_PUB]
  [◀ Retour →R0_PHOTO | 🏠 Accueil →R0_HOME]
  [🛑 Stop →R0_STOP]
```

→ Le `◀ Retour` pointe vers l'origine réelle (R0_RECENTS / R0_STUDIO / R0_PHOTO), pas un défaut fixe.

## G3 — photo_montage orphelin nettoyé

**PHOTO·Préparer (aucun bouton Montage)** — écran réel `photo_prompt` (kind=text)

```
TITRE: 📸 PHOTO · Préparer ⏎ Choisissez l'action suivante.
  [📝 Prompt →R0_PHB_prompt | 👗 Tenue →R0_PHB_look]
  [🏛 Décor →R0_PHB_decor | 🖼 Référence →R0_PHB_reference]
  [👁 Aperçu →R0_PH_PREVIEW]
  [🎬 Faire une vidéo →R0_PH_TOVIDEO]
  [◀ Retour →R0_PHOTO]
  [🏠 Accueil →R0_HOME | 🛑 Stop →R0_STOP]
```

**après R0_PH_MONTAGE résiduel (renvoyé à photo_prompt, écran orphelin supprimé)** — écran réel `photo_prompt` (kind=text)

```
TITRE: 📸 PHOTO · Préparer ⏎ Choisissez l'action suivante.
  [📝 Prompt →R0_PHB_prompt | 👗 Tenue →R0_PHB_look]
  [🏛 Décor →R0_PHB_decor | 🖼 Référence →R0_PHB_reference]
  [👁 Aperçu →R0_PH_PREVIEW]
  [🎬 Faire une vidéo →R0_PH_TOVIDEO]
  [◀ Retour →R0_PHOTO]
  [🏠 Accueil →R0_HOME | 🛑 Stop →R0_STOP]
```

## G4 — 💾 Modèle = projet réutilisable (D5)

**VALIDATION (propose 💾 Modèle)** — écran réel `validation` (kind=text)

```
TITRE: ✅ Validation — 📸 Photo ⏎ ⚙️ Moteur : Seedream ⏎ 💳 Coût : 0.48 cr ≈ 0.028 € ⏎ 💰 Crédits cumulés : 0 cr ⏎ 🧪 Tests : 0/10 · 🟡 simulation — aucune dépense
  [◀ Retour →R0_VALID_BACK | 💾 Modèle →R0_SAVEMODEL]
  [✨ Générer maintenant →R0_GO2]
  [🏠 Accueil →R0_HOME | 🛑 Stop →R0_STOP]
```

```
projets AVANT R0_SAVEMODEL = 1
projets APRÈS R0_SAVEMODEL = 2  (→ +1 projet réouvrable, original intact)
```

## G5 — hashtags fusionnés à la COPIE de la légende (champ séparé conservé)

```
COPIE « ✏️ Lég. courte » (R0_FULLTEXT_legc) =
"Ma légende\n\n#coach #dating #mindset"
COPIE « 📄 Lég. longue » (R0_FULLTEXT_legl) =
"Ma longue légende\n\n#coach #dating #mindset"
champ « #️⃣ Hashtags » SÉPARÉ (R0_FULLTEXT_tags) =
"#coach #dating #mindset"
```

---
_Sweep complet : voir `ANOMALIES.md`. Tous les écrans ci-dessus sortent du vrai dispatch (R0_DRYRUN, LIVE OFF, fixture isolée)._
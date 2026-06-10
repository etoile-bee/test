# Registre ZONES GRISES / ARBITRAGES PAR MODULE (E126)

> Discipline d'arbitrage proactif : pour chaque module important, lister AVANT implémentation les décisions non prises · options · recommandation · impact UX. Tenu à jour, remonté en amont à Etoile.

| # | Module | Décision non prise / zone grise | Options | Recommandation | Impact UX | Statut |
|---|---|---|---|---|---|---|
| Z1 | Sous-titres (D1) | Point d'injection de l'override hors `subtitle_style.js` verrouillé | (a) param override passé au rendu via hook sanctionné · (b) wrapper non-verrouillé | (a) | défaut persona + override projet, sans toucher le verrou | ✅ **tranché** (D1 validé : override au rendu, fichier intact) |
| Z2 | Durée → plans (D2) | Durée vs nb plans | (a) durée demandée répartie · (b) N×durée-de-plan | (a) | l'utilisateur choisit toujours la durée finale | ✅ **tranché** (a) |
| Z2b | Cohérence script↔durée | Seuil d'incohérence | ratio mots/durée hors plage → alerte | alerte + proposition d'ajustement AVANT validation | pas de montage incohérent silencieux | ✅ **tranché** (alerte) |
| Z3 | Aperçu montage (D3) | Richesse de la maquette | (a) statique · (b) riche (images+transitions+sous-titres+zoom+mouvements+musique+rythme) | (b) | aperçu ≈ final (diff = HD+voix+lipsync) | ✅ **tranché** (b), local €0 |
| Z4 | Dossier livrable (E125) | Quand le construire | à l'entrée en Prêt-à-poster | build auto à pret_a_poster | tout prêt sans reconstruire | ✅ reco appliquée |
| Z5 | Préréglages (Q5/D1) | Projet → preset persona | action explicite « enregistrer comme preset » | explicite (jamais auto) | standardisation maîtrisée, E124 respecté | ✅ appliqué |
| Z6 | Variante prompt (Q2) | img2img : source d'init | régénérer depuis l'image choisie | source conservée en `variantes` | « varier cette image » | 🟡 à construire (backend bascule) |
| Z7 | Édition simplifiée (Q6) | Boîte unique vs sous-pickers | 1 décision/écran | sous-pickers focalisés | lisibilité | 🟡 à affiner |
| Z8 | Planche → vidéo (Q9) | Mapping images retenues → plans | 1 image retenue = 1 plan, concat, durée=f(N) | réutiliser multi-part workflow.js | jamais d'autres images | 🟡 à construire |
| Z9 | Auto-post TikTok (A5) | Publication réelle | hors lot (chantier séparé) | statut « publié » seulement | publication manuelle facilitée par dossier livrable | ⏸ reporté (A5) |
| Z10 | Cloud privé (A6) | tmpfiles vs S3/B2 | iCloud + tmpfiles transitoire | dossier projet survit (médias locaux) | zéro perte | ✅ (transit ≠ archivage) |

_Mis à jour à chaque module. Tout 🟡/🔴 nouveau est remonté AVANT implémentation (E126)._

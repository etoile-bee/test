# Cartographie « OÙ EST CHAQUE ÉLÉMENT » — /v4r (11/06/2026)

Objectif : prouver que **rien ne disparaît** et que **tout est récupérable**. Légende des lieux :
**Chat** = message persistant dans le fil · **Hist.** = Historique (galerie « historique ») · **Gal.** = Galerie · **Projet** = dossier `projects_r/<persona>/<id>/` · **Final** = écran Résultat (hub) · **Ress.** = écran Ressources / Fichiers du projet.

## 📸 PHOTO

| Élément | Chat | Hist. | Gal. | Projet | Final (PHOTO·Résultat) | Ress. | Avant | Après |
|---|---|---|---|---|---|---|---|---|
| Image finale | ✅ rendu persistant | ✅ R0_PH_HIST | ✅ R0_PH_GAL | ✅ `photo_*.jpg` | ✅ couverture | ✅ compteur | partiel | **complet** |
| Prompt utilisé | — | — | — | ✅ (attrs média/draft) | ✅ ligne 📝 | ✅ | NON sur Final | **OUI** |
| Tenue | — | — | — | ✅ draft | ✅ ligne 👗 | ✅ | NON sur Final | **OUI** |
| Décor | — | — | — | ✅ draft | ✅ ligne 🏛 | ✅ | NON sur Final | **OUI** |
| Référence (base) | — | — | — | ✅ draft.reference (verrou) | via bloc Référence | ✅ | NON | **OUI** (consulter/remplacer/verrouiller) |
| Ressources associées | — | — | — | ✅ | bouton 🗂 Ressources | ✅ écran dédié | NON | **OUI** |

## 🎬 VIDÉO

| Élément | Chat | Hist. | Projet | Final (VIDÉO·Résultat) | Ress. | Avant | Après |
|---|---|---|---|---|---|---|---|
| Vidéo finale | ✅ rendu persistant | ✅ R0_VI_HIST | ✅ `*.mp4` | ✅ aperçu | ✅ | partiel | **complet** |
| Script | — | — | ✅ draft.video.script | ✅ ligne 📝 | ✅ | NON sur Final | **OUI** (+ VIDÉO→Édition→Script, catégories legacy) |
| Légende courte | — | — | ✅ publication | ✅ ligne ✏️ | ✅ | partiel | **OUI** (Final + Publication + Ressources) |
| Légende longue | — | — | ✅ publication | ✅ ligne 📄 | ✅ | partiel | **OUI** |
| Hashtags | — | — | ✅ publication | ✅ ligne #️⃣ | ✅ | partiel | **OUI** |
| Sous-titres | — | — | ✅ draft.video (style) | ✅ ligne 🔤 | ✅ | NON sur Final | **OUI** (+ style legacy police/taille/position/affichage) |
| Fichiers associés | — | — | ✅ dossier | bouton 🗂 Fichiers projet | ✅ écran dédié | NON | **OUI** |

## Garanties transverses (prouvées par banc d'essai)

- **Rendus persistants** : chaque photo/vidéo générée = message DÉDIÉ qui RESTE dans le chat ; `/v4r`, `/v4r new`, changement de projet ne les suppriment jamais (cockpit éphémère ≠ rendu persistant). *(test_v4r_runtime : RP 1 cockpit + N rendus conservés)*
- **Aucun cul-de-sac / aucun freeze** : 18 écrans × chaque bouton = 89/89 (répond · 1 cockpit · zéro tap mort · sortie présente). *(test_v4r_carto)*
- **Pont Photo→Vidéo** : depuis PHOTO·Préparer (🎬 Génère vidéo) ET PHOTO·Résultat (🎬 Créer vidéo) → menu VIDÉO, photo en source conservée. *(test_v4r_runtime #23)*
- **Aperçu obligatoire** : toute génération payante passe par Aperçu → Valider → 2ᵉ confirmation → Générer. Aucune dépense sans 2 clics. *(test_v4r_runtime A)*

## Reste à faire (signalé, hors build du jour)
- **D** : galerie « Suivant »/pagination explicite (la sélection par numéro fonctionne déjà).
- **G** : Vidéo › Historique = agrégation GLOBALE des vidéos (aujourd'hui : vidéos du projet courant).
- **H** : plan de réorganisation des fichiers (proposition écrite, **zéro déplacement** sans accord).

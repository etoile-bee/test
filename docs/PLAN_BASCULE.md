# PLAN DE BASCULE DÉTAILLÉ ET CHIFFRÉ — cockpit-v4 (document, AUCUNE dépense)

> Document de décision. **Rien n'est déployé, rien n'est dépensé, aucune bascule.** Live `7e24dac` intact, fichiers verrouillés intacts.
> Chiffres = valeurs réelles de `lookbook.pricing` (relevés Etoile 08/06) : **1 crédit = 0,058 €** (0,0625 USD).

---

## 1. Moteurs branchés (nom · rôle · appel réel)
| Moteur | Rôle | Appel réel (legacy réutilisé) | Coût |
|---|---|---|---|
| **Seedream** (Higgsfield) | génération **image/look** | `newlook.js generateLook()` → `/v1/text2image/seedream` | payant (crédits) |
| **Anthropic** `claude-sonnet-4-6` | **script** vidéo | `workflow.js generateScript()` | ~quelques centimes |
| **ElevenLabs** `eleven_multilingual_v2` | **voix « Imany »** (`ELEVENLABS_VOICE_ID`) | `workflow.js generateAudio()` → `/v1/text-to-speech` | ~0,03 €/10 s |
| **Kling** (Higgsfield) | **lipsync vidéo** | `workflow.js generateLipsync()` → `/v1/speak/kling` | payant (crédits) — poste principal |
| **render_local** (ffmpeg+libass) | **rendu/montage LOCAL** (sous-titres, zoom, musique, maquette) | `render_local.js renderLocal()` | **€0 (local)** |

Chaque appel payant est **derrière la confirmation de coût + le gate QC** (voir §6). Le rendu local et la **maquette d'aperçu** (D3) sont **gratuits**.

## 2. Coût minimal — 1ᵉʳ test IMAGE (mode le moins cher)
- Mode **éco, 1 image** : `ops.eco = 0,48 cr`.
- **0,48 cr × 0,058 = ~0,028 € → ≈ 0,03 €.** (éco = HD à l'unité, même prix mesuré ; on génère **1 seule** image.)

## 3. Coût minimal — 1ᵉʳ test VIDÉO (1 plan, durée mini)
1 plan = 1 lipsync. Postes :
- **Lipsync Kling** : tarif modèle `video30s = 13 cr` / part → **13 cr × 0,058 = ~0,75 €** (hypothèse haute, 1 part ≤ 30 s). ⚠️ un tarif **`video_test = 4 cr (~0,23 €)`** existe dans le lookbook mais est noté « À CONFIRMER » → le **panneau de coût affichera le chiffre réel AVANT validation**.
- **Voix ElevenLabs** (~10 s ≈ 25 mots ≈ 150 caractères) : `150/1000 × 0,20 € ≈ 0,03 €`.
- **Script Anthropic** : ~0,02–0,05 €.
- **Total estimé : ~0,30 € (si video_test) à ~0,85 € (si video30s).** Chiffre exact = affiché à l'écran avant le clic.

## 4. Durée vidéo minimale utilisable
- **10 secondes** (plus petit bouton de durée ; `planParts` = **1 plan** jusqu'à 30 s). Le 1ᵉʳ test vidéo se fait à **10 s, 1 plan**.

## 5. Scénario exact testé (boutons précis)
### A. IMAGE (d'abord, seule)
1. `/v4` → **ACCUEIL** (bloc média unique).
2. **📸 PHOTO** → projet créé, étape **SOURCE**.
3. **🔵1** (sélecteur nb = **1 image**, mode éco).
4. **✨ Nouveau look** → écran **« 💲 Avant de lancer »** : `🎞 1 img · 🖼 9:16 · ⚙️ Seedream · 💳 0,48 cr ≈ 0,03 €`.
5. **💲 Lancer** → **(SEULE DÉPENSE IMAGE)** 1× Seedream éco → 1 candidate.
6. **✅ Garder** → l'image devient **média actif**.
7. **✅ Valider** (SOURCE→PARAMÈTRES) → **✅ Valider** (PARAMÈTRES→FINALISER).
8. À FINALISER : **☐ décocher Vidéo** (livrable image seule) → **🔍 Lancer le contrôle** (QC) → **✅ Valider** → **📦 Image livrée → Prêt-à-poster**.
9. **STOP.** Vérifs §8/§9/§10 **avant toute vidéo**.

### B. VIDÉO (seulement si l'image + dossier + média actif + livrable image sont validés)
10. Rouvrir le projet, à FINALISER **☑ garder Vidéo** → **✅ Valider** (l'image validée = **source vidéo auto**).
11. Phase **VIDÉO** : **✍️ Script** (éditer le texte), **⏱ Durée = 10s**.
12. **✅ Valider** → FINALISER → **🔍 QC** → **✅ Valider** → écran **« 💲 Avant de lancer »** : `🎞 1 plan · ⏱ 10s/plan · ⚙️ Anthropic+ElevenLabs+Kling · 💳 <coût réel> cr ≈ <€>` (+ alerte si script incohérent).
13. **💲 Lancer** → **(SEULE DÉPENSE VIDÉO)** script + voix + lipsync + rendu local → **Prêt-à-poster** + dossier livrable.

## 6. Bouton qui déclenche la dépense (et preuve qu'aucun autre ne dépense)
- **UN SEUL bouton : « 💲 Lancer »** (callback `GEN_CONFIRM`), sur l'**écran de confirmation de coût** — atteint **uniquement** après **✨ Nouveau look** (image) ou après **QC validé** à FINALISER (vidéo).
- **Garantie code** : seul `GEN_CONFIRM` appelle `generate()` (image) / `generateVideo()` (vidéo). **✖️ Annuler** (`GEN_CANCEL`) = zéro dépense. **Tous** les autres boutons (navigation, Valider d'étape, édition, CRUD, versions, préréglages, publier) **n'appellent aucun moteur payant**. Le gate **QC bloque** FINALISER vidéo sans contrôle.

## 7. Procédure de rollback (commandes + délai)
- **Le flux `7e24dac` reste le DÉFAUT** pendant tout le test : `/v4` est **opt-in**, `v4active=false` par défaut.
- **Sortie immédiate** : taper **`/menu`** → quitte cockpit-v4, retour au flux actuel. **~1–3 s.**
- **Revert complet** (si cockpit-v4 avait été mergé pour le test) :
  ```
  cd /Users/fayrouzn/podcast-workflow
  git checkout fix/restart-feedback        # = 7e24dac (flux actuel)
  pm2 restart podcast-bot
  ```
  **~5–10 s.** Le code `7e24dac` est inchangé ; aucun fichier verrouillé touché ; les dossiers projets restent sur disque.

## 8. Vérifier Historique / Prêt-à-poster (quoi regarder, où)
- **Disque** : `projects/imany/<projectId>/project.json` → `statut_publication: "pret_a_poster"`, `statut_qualite: "production"`.
- **Dans `/v4`** : **🕘 RÉCENTS** (= vue filtrée de l'Historique) montre le projet ; la vue **Prêt-à-poster** le liste.
- **Après « 📣 Publier »** : `statut_publication: "publie"` → **disparaît de Prêt-à-poster**, **reste dans Historique** (vérifier les deux vues + le manifest).

## 9. Vérifier le dossier livrable (chemin + checklist)
- **Chemin exact** : `projects/imany/<projectId>/exports/liv1/deliverable.json` (créé automatiquement à l'entrée en Prêt-à-poster).
- **Checklist de complétude** (E125) :
  - ☐ `video` (chemin vidéo finale) · ☐ `images[]` (image source) · ☐ `script`
  - ☐ `legende_courte` · ☐ `legende_longue` · ☐ `hashtags`
  - ☐ `parametres` · ☐ `infos` (projectId/persona/nom/date) · ☐ `couts` · ☐ `moteur_ia` · ☐ `raws` · ☐ `exports`
- Tout est **dans le dossier projet** (conteneur unique) — rien d'éparpillé.

## 10. Vérifier l'étanchéité inter-projets (conditions réelles)
1. Projet **A** : éditer l'image (**☀️ Lumière +**, **🌡 Temp**) → vérifier `projects/imany/<A>/project.json` → `parametres.image_fx` rempli (ex. `{brightness:10}`), `parametres.crop` si recadré.
2. **Nouveau projet B** (`📸 PHOTO`) → vérifier `projects/imany/<B>/project.json` → `parametres.image_fx = {}` et `crop = null` (**aucune fuite**).
3. Filet automatisé permanent : `node tools/test_etancheite_projets.js` (**10/10**) + `test_cockpit_lot34.js` — exécutés à chaque livraison (E124/E118).

---

## CONTRAINTE DU 1ᵉʳ RUN RÉEL (inscrite)
> **STRICTEMENT 1 image, mode le moins coûteux (éco, 0,48 cr ≈ 0,03 €). AUCUNE vidéo** tant que **image + dossier projet + média actif + livrable image** ne sont pas validés.
> **Puis seulement, si conforme** : **1 vidéo de 10 s, 1 plan**, **coût affiché AVANT validation**, **confirmation explicite (💲 Lancer)**, puis vérification **dossier livrable + Prêt-à-poster**.

## ÉTAPE DE CODE « binding backends réels » (juste avant le run)
À faire dans le **factory `/v4`** de `telegram_bot.js` (≈ 30–50 lignes, **gated par confirmation + QC déjà en place**, **aucun fichier verrouillé touché**, **flux par défaut inchangé**) :
- **Image** : remplacer le stub gratuit `v4Generate` par un appel réel `nlMod().generateLook({category, env, mode:'eco', count:nb})` → télécharger les URLs → **copier dans `projects/<id>/images/`** → renvoyer les chemins relatifs.
- **Vidéo** : ajouter `v4GenerateVideo(manifest)` qui pose `HIGGS_AVATAR_URL = média actif`, lance `workflow.js` (topic/durée/script), récupère le `.mp4` final → **copie dans `projects/<id>/videos/`** → renvoie le chemin.
- **Sous-titres (D1)** : passer l'override projet/persona au rendu via le **hook sanctionné** (sans modifier `subtitle_style.js`).
- Ces fonctions ne sont **appelées QUE par `GEN_CONFIRM`** (après le panneau de coût + QC). En test (avant ce binding), tout reste **stub gratuit**.

_Document seulement. Aucune dépense, aucune bascule, aucun déploiement. Live `7e24dac` intact, fichiers verrouillés intacts._

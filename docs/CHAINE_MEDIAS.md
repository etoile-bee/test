# Chaîne complète des médias /v4r — tracée sur le code & les données réels (11/06/2026)

> UI gelée · aucune suppression · aucun nouveau connecteur. Document de **lecture/vérification** uniquement.
> Ordre de priorité : **Données → Stockage → Galerie → Historique → Cloud**.

## A. PHOTO générée (chemin RÉEL, pas à pas)

| Étape | Quoi | Code / chemin exact |
|---|---|---|
| 1. Arrive | Seedream/Higgsfield renvoie une URL d'image | `newlook.generateLook()` (appelé par `r0RealPhoto`) |
| 2. Récupère | téléchargement local du fichier | `r0RealPhoto(persona,id)` → `curl -o <localPath>` |
| 3. Stocké | **fichier final** | `projects_r/<persona>/<id>/photo_<ts>.jpg` — **LOCAL** (`~/podcast-workflow/projects_r`) |
| 4. Enregistré projet | entrée média dans le socle | `S.addCandidate(…, 'image', {file:localPath, simule:false, moteur:'seedream-v4', …})` → `facts.medias[]` |
| 5. Galerie | agrégation lecture | `r0RealImages()` : projet courant + `projects_r/*/photo_*` + `outputs/generations/*` + `looks/gen_*` |
| 6. Telegram | bloc cockpit + keepsake | `r0Paint` (editMessageMedia/sendPhoto) **+** `r0PostFinal` (sendPhotoKb = message persistant) |

## B. VIDÉO générée (chemin RÉEL, pas à pas)

| Étape | Quoi | Code / chemin exact |
|---|---|---|
| 1. Arrive | script (Anthropic) → voix (ElevenLabs) → lipsync (Kling) → rendu (ffmpeg local) | `workflow.js` (WF) via `r0RealVideo` |
| 2. Récupère | assemble/écrit le mp4 final | `r0RealVideo(persona,id)` → `WF.saveOpen` / `WF.concatClips` |
| 3. Stocké | **fichier final + raws** | `projects_r/<persona>/<id>/*.mp4` (+ `*_raw_*.mp4`) — **LOCAL** |
| 4. Enregistré projet | entrée média | `S.addCandidate(…, 'video', {file:finalP, simule:false, moteur:'kling+elevenlabs'})` |
| 5. Galerie/Historique | Vidéo›Historique | lit **les médias du projet courant** (PAS l'agrégat global → écart **G**) |
| 6. Telegram | bloc + keepsake | `r0Paint` (editVideo/sendVideo) **+** `r0PostFinal` (sendVideoKb persistant) |

## C. LES 7 RÉPONSES (noir sur blanc)

**1. Qui livre le fichier final Higgsfield aujourd'hui ?**
Photo : `r0RealPhoto` via `newlook.generateLook` (download `curl`). Vidéo : `r0RealVideo` via `workflow.js` (Kling lipsync + rendu `render_local.js`).

**2. Dossier exact de stockage ?**
`/Users/fayrouzn/podcast-workflow/projects_r/<persona>/<id>/` — **LOCAL**. (Le legacy, lui, écrit dans `outputs/` = symlink iCloud.)

**3. Qui alimente la galerie ?**
`r0RealImages()` lit, dédupliqué, le plus récent d'abord : (a) projet courant, (b) `projects_r/*/photo_*.jpg`, (c) `outputs/generations/*`, (d) `looks/gen_*`. Vidéo›Historique = projet courant uniquement (écart G).

**4. Qui alimente Telegram ?**
`r0Paint` (le bloc cockpit, édité en place) **et** `r0PostFinal` (le rendu persistant), via `sendPhotoKb`/`sendVideoKb`/`editMessageMedia`.

**5. Où sont stockés les 618 médias réels ?**
`projects_r/imany/<id>/photo_*.jpg` (local), référencés par `media.file` dans chaque `facts.json`. (Tous vérifiés présents sur disque.)

**6. INVENTAIRE détaillé (vrais, hors sim) :**
| Élément | Compte | Emplacement |
|---|---|---|
| Projets | 112 (23 avec média) | `projects_r/imany/` (local) |
| Photos réelles | **618** | `projects_r/imany/<id>/photo_*.jpg` (local) |
| Vidéos générées (v4r) | **0** | (aucune réelle produite en v4r) |
| Vidéos finales (legacy) | **199** mp4 | `outputs/` → **iCloud** |
| Générations (legacy) | **63** | `outputs/generations/` → **iCloud** |
| Looks | **90** (dont 28 `gen_`) | `looks/` (local) |
| Référence | **1** (`imany_reference`) | `looks/` (local) |
| Scripts (bibliothèque) | **73** | `library.json` |
| Tenues (catalogue) | **234** (6 catégories) | `outfits_catalog.json` |

**7. Preuve : mémoire unique du projet, aucune génération ne disparaît**
- Le fichier est **sur disque** (`projects_r/<id>/…`) → survit au process, à `/menu`, `/restart`, à une mise à jour (c'est un fichier).
- L'entrée est dans `facts.json` du projet (`media.file`) → relue à chaque rendu. *(preuve : après génération en sandbox, `facts.json` sur disque contient le média — vérifié.)*
- Le rendu Telegram est posté en **message dédié non suivi** (`r0PostFinal`) → la grammaire post-puis-supprime du cockpit ne le touche JAMAIS.
- `/v4r` et `/v4r new` **conservent** les rendus (preuve : `test_v4r_runtime` RP — 1 cockpit + N rendus conservés).
- `/menu` et `/restart` : **ne suppriment ni `projects_r` ni les mids de rendus** (revue de code) ; `/restart` ré-affiche via `r0PickCurrent` (reprend le projet AVEC médias). Statut : ✅ fichier/disque · ✅ rendus persistants · ✅ /v4r prouvé · 🟡 /menu·/restart vérifiés par revue de code (pas encore rejoués automatiquement).

## D. VERDICT DRIVE — existant vs nouveau connecteur

**Le « cloud » qui marchait = iCloud Drive.** `outputs` est un **symlink** vers `~/Library/Mobile Documents/com~apple~CloudDocs/podcast-outputs/` → tout ce qui y est écrit se synchronise tout seul et apparaît dans l'app Fichiers (iPhone). Le legacy y écrit (`personaOutDir()` = `outputs`), d'où « génération → cloud → Telegram → galerie ».

**Ce qui a changé** : `/v4r` écrit ses générations dans `projects_r/` qui est **LOCAL** (pas de symlink iCloud). → les médias /v4r ne montent pas dans le cloud / l'app Fichiers.

**Verdict** : ❌ **PAS besoin d'un nouveau connecteur Drive.** Le mécanisme cloud existe déjà (symlink iCloud sur `outputs`). Il suffit de **reconnecter l'existant** — 2 options (à valider, non faites ici car UI/données gelées) :
- (a) faire de `projects_r` un dossier **dans** l'arbre iCloud (déplacement + symlink, avec sauvegarde) ; ou
- (b) **copier** chaque rendu final v4r dans `outputs/generations/` (déjà iCloud) au moment du dépôt — 1 ligne, sans toucher le reste.
Aucun connecteur tiers (Google Drive/rclone) n'est requis. `tmpfiles.org` dans le code n'est PAS du stockage : c'est un upload **transitoire** pour donner une URL publique de l'avatar/audio à Higgsfield/Kling.

## E. Synthèse priorités (Données → Stockage → Galerie → Historique → Cloud)
| Maillon | État réel | Note |
|---|---|---|
| Données (intégrité) | ✅ | 618 réels, 0 perdu, pollution sim nettoyée + backup, collision d'id corrigée |
| Stockage | 🟡 | local `projects_r` OK et persistant ; **pas encore** dans l'arbre iCloud |
| Galerie | 🟡 | agrège photos (projet+global) ; **vidéos pas agrégées globalement** (G) |
| Historique | 🟡 | photos OK ; vidéos = projet courant seulement |
| Cloud | ❌ | /v4r local, non synchro iCloud — **reconnexion** de l'existant à prévoir (pas de nouveau connecteur) |

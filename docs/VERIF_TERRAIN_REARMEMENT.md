# Vérif terrain + sous-titres + plan de réarmement (11/06/2026)

> Read-only sur les données · archive gelée · LIVE OFF. UI/correctifs déployés au fil de l'eau.

## A. Bug grille (mosaïque par page) — CORRIGÉ ✅
Cause : la planche-contact était écrite dans un fichier FIXE `_mosaic.jpg` → cache Telegram périmé → page 2 réaffichait la planche de page 1 (« retombe sur une image unique »). **Fix** : nom de planche **unique par contenu** (hash des fichiers de la page) → chaque page a SA planche, swap correct en place. Récents aussi paginés, couverture réelle par projet. Déployé.

## B. Vérification terrain (vraie base, read-only) — ✅
| Contrôle | Résultat |
|---|---|
| Fichiers galerie ouvrables (distinct) | **162**, **0 cassé/manquant** |
| Médias réels (facts.json) avec fichier existant | **622 / 622** (0 manquant) |
| id dupliqué / type invalide | **0 / 0** |
| Source vidéo épinglée (`source_file`) | 1, fichier présent (0 manquant) |
| Vidéo qui « revient sur une ancienne photo » en navigant | **non** (source épinglée `source_id`/`source_file`, prouvé runtime R2 + /v4r-fix) |
| Chaque projet pointe ses fichiers | cohérent ; les 318 inter-projets seront rendus autonomes par la copie physique (archive, à ton GO) |
**Verdict : aucun fichier cassé/manquant, aucune incohérence id↔fichier↔média, source vidéo saine.**

## B2. Régression « /v4r fait disparaître le projet » — CAUSE RÉELLE TROUVÉE + CORRIGÉE ✅
Le projet ne disparaissait PAS (logs : `/v4r` reprend toujours le projet courant). Mais :
1. `v4r_nav.json` gardait `screen=video_params` → `/v4r` rouvrait un **écran profond**, pas l'accueil/couverture. **Fix** : `/v4r` force l'**accueil du projet courant** (couverture) ; `r0RestoreNav` réservé à `/restart`.
2. La couverture retombait sur une **démo** quand la dernière entrée n'avait pas de fichier. **Fix** : `r0CoverFile()` prend la dernière image AVEC fichier existant.
Régression couverte par test (`/v4r-fix` : écran profond → /v4r → accueil + média conservé + rendus intacts). Déployé.

## C. Sous-titres — DIAGNOSTIC (pas un bug) + rendu complet
**Pourquoi ils n'apparaissent pas sur l'image/aperçu** : les sous-titres sont **incrustés AU RENDU VIDÉO** (`render_local.js`, ffmpeg + libass `.ass`), à partir des *wordTimings* de la **voix**. Ils n'existent donc que sur la **vidéo générée réelle** — pas sur une photo ni sur l'aperçu (image fixe, aucune parole, aucun timing). En **simulation** (maquette locale), il n'y a pas de voix réelle → pas d'incrustation.
**Ce qui EST garanti** : le **réglage** sous-titres (actif · police · taille · position · affichage) est visible et récupérable partout (Montage › Sous-titres, Aperçu vidéo, Vidéo·Résultat, Ressources). → ce n'est pas une perte ; c'est une feature de rendu. Les sous-titres incrustés apparaîtront sur la 1ʳᵉ vidéo réelle.

### Rendu complet — chaque élément s'affiche / est récupérable
| Élément | Où il s'affiche / se récupère | État |
|---|---|---|
| Image | Galerie, Accueil (couverture), PHOTO·Résultat, Ressources | ✅ |
| Texte/Prompt (entier) | Bloc Prompt, Aperçu, « 📄 Texte complet » | ✅ |
| Script (entier) | Bloc Script, VIDÉO·Résultat, « 📄 Script complet » | ✅ |
| Légende courte/longue | Publication, VIDÉO·Résultat, Ressources, « 📄 Texte complet » | ✅ |
| Hashtags | idem légendes | ✅ |
| Sous-titres (réglage) | Montage › Sous-titres, Aperçu, Résultat | ✅ réglage |
| Sous-titres (incrustés) | sur la VIDÉO réelle uniquement (rendu) | ⚠️ nécessite rendu vidéo réel |
| Audio (voix) | fichier produit au rendu vidéo réel ; réglage voix dans Montage | ⚠️ réel |
| Vidéo | VIDÉO·Résultat, Historique vidéo, Fichiers projet | ✅ |

## D. PLAN DE RÉARMEMENT SÉCURISÉ (préparé — NON exécuté)
> À exécuter UNIQUEMENT après : (3) GO migration d'Etoile, (4) son GO réarmement. Aujourd'hui : **rien armé**.

| Maillon | Activation propre | Garde-fou |
|---|---|---|
| Moteurs réels | `engines.setLive(true)` (crée `v4r_live`) ; clés `.env` présentes → `liveFor(photo/video)=true` | `live()` forcé OFF sous R0_DRYRUN (tests ne dépensent jamais) |
| Génération PHOTO réelle | `R0_GO` depuis confirm2 → `r0RealPhoto` (Seedream éco ~0,48 cr) | **double-confirmation** + budget ≤10 + coût affiché + verrou anti double-clic |
| Génération VIDÉO réelle | `R0_GO` vidéo → `r0RealVideo` (script Anthropic + voix ElevenLabs + lipsync Kling, ~13–26 cr) | idem + 1ᵉʳ run = clic d'Etoile (jamais l'assistant) |
| Stockage local | dépôt `projects_r/<persona>/<id>/` | facts.json = source de vérité |
| Sync iCloud | `r0CloudCopy(file,id)` → `podcast-looks/<projet>/` (symlink iCloud) | garde-fou `test_v4r_cloud_chain` (échoue si cible dévie) |
| Galerie / Historique | `r0RealImages` / `r0RealVideos` agrègent automatiquement | compteurs étiquetés + pagination complète |
| Telegram | bloc cockpit (`r0Paint`) + rendu persistant (`r0PostFinal`) | rendus jamais supprimés |
| Publication | `R0_PUB_DO` → marque « publié » → Archives publiées | envoi réel GATÉ (aucun post auto) |

**Ordre recommandé** : (1) tu valides la preuve de lecture + cette vérif terrain → (2) GO migration (copie rétroactive, même mécanisme) → (3) GO réarmement → (4) tests réels e2e ciblés (photo d'abord, 30 s vidéo ensuite). **Je n'arme rien sans ton GO explicite.**

## Statut
Bug grille ✅ · /v4r régression ✅ · vérif terrain ✅ · sous-titres diagnostiqués (réglage récupérable ; incrustation = rendu réel) · plan réarmement prêt (non exécuté). Tests : runtime 70, carto 130, screens 79, nav 28, cloud-guard 14, audit 0. **LIVE OFF, archive gelée.**

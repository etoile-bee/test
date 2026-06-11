# Proposition — Archive de référence par projet (podcast-looks)

> **PROPOSITION SEULEMENT. Aucune écriture/copie/suppression** tant qu'Etoile n'a pas validé l'arborescence.
> Objectif : `podcast-looks/<projet>/` devient l'**archive de référence** durable — si la base (`facts.json`) est perdue, le seul dossier projet permet de **comprendre et reconstruire** le projet.
> Base existante, pas de nouveau connecteur : `podcast-looks` = `~/Library/Mobile Documents/com~apple~CloudDocs/podcast-looks` (cible du symlink `looks/`, iCloud auto-sync).

## 1. Nom du dossier racine + convention de nommage

- **Racine confirmée** : `podcast-looks/` (iCloud). On range les projets sous une sous-racine persona pour rester propre en multi-persona : **`podcast-looks/projets/<persona>/<dossier-projet>/`**.
- **Nom du dossier projet** (proposé) : `<projectId>` tel quel, car il est **déjà daté et lisible** et **stable/unique** : ex. `imany_2026-06-11-16-19-32`.
  - Constat réel : `intention.message` est **null** sur tous les projets → pas de titre humain fiable aujourd'hui. Donc on garde le `projectId` daté comme nom.
  - **Option (si tu préfères du plus lisible)** : `2026-06-11_16h19__<slug>` où `<slug>` vient du titre quand il existera ; le `projectId` reste écrit dans le manifeste pour la stabilité. → **à choisir : (A) projectId brut [recommandé, zéro ambiguïté] ou (B) date + slug.**
- Sous-dossiers : **noms exacts** comme demandé (Photos, Vidéos, Références, Looks, Scripts, Légendes, Prompts, Audio, Sous-titres, Exports finaux).

## 2. Arborescence complète proposée

```
podcast-looks/
└── projets/
    └── imany/
        └── imany_2026-06-11-16-19-32/        ← un dossier par projet
            ├── projet.json                   ← MANIFESTE (paramètres de régénération) — lisible + structuré
            ├── RECAP.txt                      ← récap humain (cap, prompt, tenue, décor, durée, décisions)
            ├── facts.snapshot.json            ← copie brute de l'état (source de vérité ultime, pour reconstruire)
            ├── Photos/                        ← *.jpg / *.png / *.webp (images générées + importées du projet)
            ├── Vidéos/                        ← *.mp4 (vidéos finales du projet)
            ├── Références/                    ← image(s) de référence (base des générations) + *_reference.*
            ├── Looks/                         ← look/tenue : image(s) de look + look.txt (catégorie tenue retenue)
            ├── Scripts/                       ← script.txt (script complet, éditable)
            ├── Légendes/                      ← legendes.txt (courte / longue / hashtags)
            ├── Prompts/                       ← prompt.txt (prompt photo complet)
            ├── Audio/                         ← *.mp3 / *.wav (voix ElevenLabs)
            ├── Sous-titres/                   ← soustitres.txt (réglages) + *.srt si généré
            └── Exports finaux/               ← médias VALIDÉS (état « garde ») = livrables prêts
```

### Manifeste `projet.json` (schéma proposé)
```json
{
  "projectId": "imany_2026-06-11-16-19-32",
  "persona": "imany",
  "titre": "(daté — pas de titre humain saisi)",
  "cree_le": "2026-06-11T…", "modifie_le": "2026-06-11T…",
  "statut": "Photo validée",
  "intention": { "cap": null, "objectif": null, "public": null },
  "regeneration": {
    "prompt": "<PROMPT PHOTO COMPLET, non tronqué>",
    "tenue": "soiree #1",
    "decor": "<décor>",
    "reference": "Références/<fichier>",
    "format": "9:16",
    "duree": "30s",
    "voix": "<voix>",
    "sous_titres": { "actif": true, "police": "archivo", "taille": "L", "position": "bas" },
    "moteurs": { "photo": "seedream-v4", "video": "kling+elevenlabs" }
  },
  "decisions": [ "… journal des décisions du projet …" ],
  "publication": { "legende_courte": null, "legende_longue": null, "hashtags": null, "plateforme": null },
  "fichiers": { "photos": ["Photos/…"], "videos": [], "scripts": ["Scripts/script.txt"] }
}
```
> Le manifeste contient **tout le nécessaire à la régénération** (prompt complet, tenue, décor, références, durée, format, décisions). `facts.snapshot.json` = filet de sécurité brut.

## 3. Ce qui sera copié rétroactivement (réel vs vide) — mapping par type

| Sous-dossier | Source réelle | Volume réel aujourd'hui |
|---|---|---|
| Photos/ | `media.file` (type image, `simule:false`) — **suivre le chemin réel** (un média peut pointer vers le dossier d'un autre projet via choix galerie) | **618 photos** réparties sur 23 projets |
| Vidéos/ | `media.file` (type video) du projet | **0 vidéo v4r** par projet (les 117 vidéos legacy sont dans `podcast-outputs/`, non rattachées à un projet v4r — voir §4) |
| Références/ | `draft.photo.reference` + `looks/*reference*` | **1** référence partagée (`imany_reference`) ; `draft.reference` quasi vide |
| Looks/ | `draft.photo.look` (libellé tenue) → `look.txt` ; image de look = la photo | libellé tenue présent quand renseigné ; **pas de fichier dédié** |
| Scripts/ | `draft.video.script` → `script.txt` | **2 projets** avec script |
| Légendes/ | `publication.legende_courte/longue/hashtags` → `legendes.txt` | **0** aujourd'hui (toutes nulles) |
| Prompts/ | `draft.photo.prompt` → `prompt.txt` | présent sur quelques projets |
| Audio/ | voix ElevenLabs (fichier) | **0** en v4r (l'audio legacy est dans `podcast-outputs/`) |
| Sous-titres/ | `draft.video.st_*` → `soustitres.txt` | réglages seulement, pas de `.srt` |
| Exports finaux/ | médias `etat:"garde"` | selon validations (peu aujourd'hui) |
| projet.json / RECAP.txt / facts.snapshot.json | dérivés de `facts.json` | **1 par projet** (23 projets avec média) |

**Honnêteté** : la copie rétroactive remplira surtout **Photos/** (618) + les manifestes ; **Vidéos/Audio/Légendes/Sous-titres seront souvent vides** côté v4r (l'historique vidéo/audio vit dans `podcast-outputs/`, déjà iCloud). À décider : **rattacher ou non les vidéos legacy** à des projets (difficile car aucune association projet↔vidéo n'existe) ; proposition : les laisser dans `podcast-outputs/` (déjà cloud) et ne PAS les déplacer.

## 4. Ce qui reste UNIQUEMENT en base (non archivé en fichier)

- **État vivant / opérationnel** : `media.etat` (candidate/garde/supprimé), pointeur de navigation (`v4r_nav.json`), compteur budget (`v4r_budget.json`), défauts (`v4r_defaults.json`), drapeau LIVE. → **non archivé** car ce sont des états de session, pas des livrables ; ils n'aident pas à reconstruire le rendu.
- **Entrées simulées** (`simule:true`) : **jamais archivées** (placeholders sans fichier).
- Tout le **reste utile** (prompt, script, légendes, params, décisions) **EST** archivé via `projet.json` + `facts.snapshot.json` → la base devient reconstructible depuis le dossier.

## 5. Comment les FUTURES générations alimenteront automatiquement la structure

À chaque génération réelle (sur le clic d'Etoile, LIVE armé) :
1. `r0CloudCopy(file, id, kind)` (déjà en place, à étendre) dépose le rendu dans le **bon sous-dossier** : image → `Photos/`, vidéo → `Vidéos/`, et le média **validé** → aussi `Exports finaux/`.
2. Écriture/MAJ des textes : `Prompts/prompt.txt`, `Scripts/script.txt`, `Légendes/legendes.txt`, `Sous-titres/soustitres.txt` (depuis le brouillon/publication du projet).
3. **MAJ du manifeste** `projet.json` + `RECAP.txt` + `facts.snapshot.json` à chaque génération (paramètres de régénération à jour).
4. Tout reste **sur l'existant** (symlink `looks/`→podcast-looks, iCloud auto-sync) — **aucun nouveau connecteur**. Jamais en dry-run (sandbox isolée).

> Extension de code nécessaire (à faire APRÈS validation) : passer un `kind` à `r0CloudCopy` + une fonction `r0ArchiveProjet(id)` qui écrit manifeste + textes. ~30 lignes, sur la base existante. **Signalé, non codé tant que l'arborescence n'est pas validée.**

## 6. UN SEUL MÉCANISME (rétroactif = futur)

La copie rétroactive des médias EXISTANTS utilisera **exactement le même code** que les futures générations : la même fonction `r0CloudCopy(file, projId, kind)` + le même `r0ArchiveProjet(id)` (manifeste/sous-dossiers). Le « rétroactif » = **rejouer ce mécanisme** sur chaque projet existant (une boucle sur les projets qui appelle les MÊMES fonctions). **Aucun script one-off divergent** : le patrimoine est traité comme un nouveau rendu. → garantit qu'il n'y a jamais « deux systèmes selon la date ».

## 7. RÉCAP COMPLET (A — noir sur blanc)

1. **Ce qui SERA COPIÉ** (par type → sous-dossier) : Photos (618) → `Photos/` ; vidéos du projet → `Vidéos/` (0 en v4r) ; `draft.photo.prompt` → `Prompts/prompt.txt` ; `draft.video.script` → `Scripts/script.txt` ; `publication.*` → `Légendes/legendes.txt` ; référence → `Références/` ; tenue → `Looks/look.txt` ; réglages sous-titres → `Sous-titres/soustitres.txt` ; médias validés (`garde`) → `Exports finaux/`. + `projet.json` + `RECAP.txt` + `facts.snapshot.json`.
2. **Ce qui RESTERA UNIQUEMENT EN BASE** (non déplacé/non archivé) : états vivants (`media.etat`, `v4r_nav.json`, `v4r_budget.json`, `v4r_defaults.json`, drapeau LIVE) + entrées `simule:true`. (état de session, pas livrables).
3. **SOURCE DE VÉRITÉ** : la **base vivante `facts.json` reste la source de vérité opérationnelle** du cockpit. `podcast-looks/<projet>/` est l'**archive miroir durable** (lecture/restauration), tenue à jour à chaque génération via le même mécanisme. `facts.snapshot.json` dans le dossier = copie de secours pour reconstruire si la base est perdue. **Confirmé : base = vérité vivante ; podcast-looks = miroir d'archive.**
4. **CHEMIN FINAL EXACT** : `~/Library/Mobile Documents/com~apple~CloudDocs/podcast-looks/projets/<persona>/<projectId>/<SousDossier>/…` (ex. `…/podcast-looks/projets/imany/imany_2026-06-11-16-19-32/Photos/photo_…jpg`).
5. **ARBORESCENCE** : celle du §2 (10 sous-dossiers + manifeste + RECAP + snapshot).

## 8. COMPORTEMENT FUTUR (B) — « génération → local → podcast-looks → galerie → historique → Telegram »

| Type | Atterrit dans | Galerie/Historique | Telegram | État du câblage |
|---|---|---|---|---|
| Photo | `Photos/` (+ `Exports finaux/` si validée) | galerie images (projet + global) | bloc + rendu persistant | ✅ câblé (r0CloudCopy photo) |
| Vidéo | `Vidéos/` | historique vidéo (r0RealVideos) | bloc + rendu persistant | ✅ câblé (r0CloudCopy vidéo) |
| Script | `Scripts/script.txt` | (ressources projet) | « 📄 Script complet » | 🟡 à câbler dans r0ArchiveProjet |
| Légendes | `Légendes/legendes.txt` | ressources + publication | « 📄 Texte complet » | 🟡 à câbler |
| Prompts | `Prompts/prompt.txt` | ressources | aperçu/bloc prompt | 🟡 à câbler |
| Références | `Références/` | bloc Référence | — | 🟡 à câbler |
| Exports finaux | `Exports finaux/` | écran final | rendu persistant | 🟡 à câbler (sur « garde ») |
| Manifeste | `projet.json` + `RECAP.txt` + `facts.snapshot.json` | — | — | 🟡 à câbler (r0ArchiveProjet) |

**Honnête** : aujourd'hui SEULE la **copie média (photo/vidéo) est câblée** (`r0CloudCopy`). L'écriture des **textes + manifeste** (`r0ArchiveProjet`) est **🟡 à coder** (≈30 lignes) — fait **après** validation de l'arbo. Photo/vidéo : ✅ ; script/légendes/prompts/références/exports/manifeste : 🟡.

## 9. COHÉRENCE PROJET (C) — pas qu'une archive de fichiers

- Ouvrir un projet des mois plus tard = retrouver TOUT au même endroit (`podcast-looks/projets/<persona>/<projectId>/`) + le **manifeste de régénération** (`projet.json`) qui suffit à comprendre/reconstruire (cap, prompt complet, tenue, décor, références, durée, format, décisions, moteurs). Pas besoin de la base vivante pour comprendre le projet.
- **Cas média inter-projets** (constat réel : un média peut pointer le `file` d'un AUTRE projet, ex. choix galerie) : l'archive fait une **COPIE PHYSIQUE réelle** du fichier dans le `Photos/` du projet courant (on suit `media.file` jusqu'au fichier réel et on le duplique). → **aucun fichier manquant**, chaque dossier projet est **autonome** même si le projet source disparaît. (C'est la décision #4 recommandée.)

## 10. GARDE-FOU CONFORMITÉ CLOUD (permanent) — `tools/test_v4r_cloud_chain.js`

Test **statique** (n'écrit rien) ajouté à la batterie : il ÉCHOUE si la chaîne se casse silencieusement. Il vérifie : `r0CloudCopy` cible `getLooksDir()` (= podcast-looks) et **pas** `outputs/generations` ; range par projet ; est branché sur photo **et** vidéo ; gardé `!R0DRY` ; la galerie images agrège (projets_r + generations + looks) ; l'historique vidéo agrège (outputs + generations + projects_r, raws exclus) ; le symlink `looks/` pointe `…/podcast-looks`. **Résultat actuel : 14/14 ✅.** → une future correction qui dévie la cible cloud ou casse un lecteur **fera échouer ce test** (donc bloquée avant déploiement). À intégrer aussi à la cartographie de pré-déploiement.

## Décisions attendues d'Etoile avant toute écriture
1. Nom de dossier : **(A) projectId brut** [recommandé] ou (B) `date_slug` ?
2. Sous-racine `podcast-looks/projets/<persona>/` OK, ou `podcast-looks/<projet>/` à plat ?
3. Vidéos legacy : **laisser dans podcast-outputs** [recommandé] ou tenter un rattachement ?
4. Copier la photo **physiquement** dans `Photos/` (duplication, ~Mo) ou y mettre un **raccourci/relevé de chemin** ? (recommandé : copie physique = archive autonome, durable même si projects_r disparaît).

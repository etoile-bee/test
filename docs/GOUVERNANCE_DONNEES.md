# Gouvernance des données /v4r — 11/06/2026

> Contexte : mes tests (banc d'essai avec `BASE = dossier réel`) ont injecté **5446 candidats `simule:true`** dans les vrais `facts.json`. Le strip a **déjà été exécuté** (tour précédent) avec sauvegarde `.prepurge` par projet. Ce document régularise : backup complet, inventaire, preuve, plan, isolation.

## ⚠️ Statut
- **Backup complet horodaté** : `backups/projects_r_2026-06-11-16-45-48/` (24 Mo · 112 `facts.json` + 28 `.prepurge` = état AVANT strip).
- **Strip déjà effectué** : 5446 `simule:true` retirés ; **0 incohérence** (entrées réelles byte‑identiques avant/après, mêmes id + fichier).
- **Aucune donnée réelle supprimée** (prouvé ci‑dessous).

## Les 7 réponses

**1. Repars‑tu d'une base SOURCE des anciennes versions ?**
NON — pas de base « ancienne version » séparée comme référence. La vérité = `projects_r/` actuel (projets) + catalogues partagés : `outputs/generations/`, `looks/`, `library.json`, `outfits_catalog.json`, `lookbook.json`, `subtitle_style.js`.

**2. Sauvegarde complète avant les injections ?**
Il n'existait PAS de snapshot pré‑injection (les injections se sont faites incrémentalement au fil des tests). **Compensation** : (a) backup complet fait maintenant (`backups/projects_r_2026-06-11-16-45-48`) ; (b) `.prepurge` par projet = état juste avant strip (avec tous les sim) ; (c) preuve que les injections n'ont **jamais modifié** les entrées réelles — elles n'ont fait qu'**ajouter** des entrées `simule:true` (diff = 0 incohérence).

**3. Comment distinguer vrai vs test/sim ?**
Critère unique et sûr : `media.simule === true` = sim (créé par génération simulée). Tout le reste = réel. **Preuve que le critère ne capture aucun réel** : après strip, les **618 entrées conservées ont TOUTES un fichier existant sur disque** (0 sans fichier) ; et le diff `.prepurge` vs actuel montre que les 618 réelles sont identiques (id + chemin fichier inchangés).

**4. Plan de nettoyage exact (déjà exécuté) :**
Pour chaque `facts.json` : `medias = medias.filter(m => !m.simule)` ; écrire `facts.json.prepurge` (état complet avant) puis ré‑écrire `facts.json`. Rien d'autre touché (drafts, publication, projectId, fichiers disque : inchangés).

**5. Garantie zéro perte de données réelles :**
backup complet + critère restrictif (`simule:true` uniquement) + vérification post : 618 réels conservés, tous avec fichier, byte‑identiques → **0 média/script/légende/référence réel supprimé**.

**6. INVENTAIRE chiffré (hors sim, vrais comptes) :**
| Élément | Compte réel |
|---|---|
| Projets | 112 (dont **23 avec média réel**) |
| Photos (fichier présent) | **618** (0 sans fichier) |
| Vidéos | **0** |
| Projets avec script | 2 |
| Projets avec légendes | 0 |
| Projets avec référence | 0 |
| Entrées sim retirées | 5446 |

**7. Fonctionnalités reposant sur code/données LEGACY :**
- `newlook.js` → génération PHOTO réelle (Seedream).
- `workflow.js` (WF) → génération VIDÉO réelle (script Anthropic + voix ElevenLabs + lipsync Kling) + `render_local.js` (sous‑titres).
- `library.json` (73 scripts) → modèles scripts pré‑enregistrés.
- `outfits_catalog.json` (234 tenues / 6 catégories) → Tenue.
- `lookbook.json` → décors + estimation coût.
- `subtitle_style.js` → style sous‑titres (lecture seule, verrou).
- `looks/` + `outputs/generations/` → agrégat Galerie + image de démo locale.
- `prompts/<persona>/` → prompts par défaut.

## Isolation des tests (local + cloud)
- **Sandbox dédiée** : sous `R0_DRYRUN`, `BASE = $V4R_SANDBOX` (défaut `~/podcast-workflow/.v4r_sandbox`) — **jamais** les vrais `projects_r`. Catalogues réels partagés en lecture via symlink (pas de copie, pas d'écriture).
- **Local + cloud** : pointer `V4R_SANDBOX` vers un dossier synchronisé Drive donne local **et** cloud sans changer le code. *(Le dossier de test reste séparé de la prod ; aucun mélange.)*
- **Garantie** : la suite complète tourne sur la sandbox ; la vraie base reste **inchangée** (vérifié : comptes réels identiques après sweep). Garde‑fou permanent : `engines.live()` force OFF sous `R0_DRYRUN` (aucune dépense possible en test).

## Restauration
Pour revenir à l'état AVANT strip d'un projet : `cp facts.json.prepurge facts.json`. Pour tout restaurer : copier depuis `backups/projects_r_2026-06-11-16-45-48/`.

# ESTIMATIONS OFFLINE — 2 arbitrages Etoile (prêtes à l'emploi, RIEN déployé)

> Préparé pendant le HOLD. Aucune ligne de code produit modifiée. À déclencher seulement sur décision d'Etoile, dans le déploiement consolidé final.

---

## ARBITRAGE 1 — `ANO-ARCH-VERSIONING` : historique « ⏪ version précédente » par champ

**Question Etoile** : pouvoir revenir à la version n-1 d'un **prompt / script / légende courte / légende longue / hashtags / réglages sous-titres** après régénération/édition ?

**Conception (ring buffer borné, additif)**
- **Point d'insertion unique** : `socle.setDraft` (`ui/socle.js`) — avant d'écraser, pour chaque champ TEXTE du `patch`, empiler l'ancienne valeur dans `f.draft._versions[kind+'.'+field]` (FIFO, **cap 5**). ~8 lignes.
- **Restauration** : `socle.restorePrevVersion(base,persona,id,kind,field)` — dépile et ré-applique. ~6 lignes.
- **UI** : `screens.js:blockView` — sur les blocs texte, bouton `⏪ Version précédente` SI `_versions[champ]` non vide. `nav.js` — `R0_PREVVER_<champ>` → reduce → op restore. ~10 lignes.
- **Champs ciblés** : `photo.prompt`, `video.script`, `pub.legende_courte/longue/hashtags`, `video.st_*`. (Pas les choix list/preset — déjà réversibles.)

**Fichiers touchés** : `ui/socle.js`, `ui/nav.js`, `ui/screens.js`, `tools/test_v4r_runtime.js` (assertions). **Aucun** moteur réel touché.
**Stockage** : `facts.json` grandit de ≤5 valeurs texte/champ — borné, négligeable.
**Effort** : **M (moyen)** — 1 lot focalisé. **Risque** : **faible** (purement additif, ring buffer borné, 0 impact dépense).
**Preuve prévue** : assertion runtime « éditer×2 → ⏪ restaure la valeur n-1 » + dump dispatch.
**Recommandation** : faisable proprement si Etoile le veut ; sinon statu quo est sûr (médias/corbeille/défauts déjà conservés ; seule la valeur texte n-1 est perdue).

---

## ARBITRAGE 2 — `ANO-IMPORT-AUDIO` : import audio + uniformisation emplacement photo

**Question Etoile (2 sous-points)** :

### 2a. Import d'un audio personnalisé (au lieu de la voix générée)
- **État actuel** : l'audio est 100% **généré** (ElevenLabs voix → Kling lipsync). Aucun `r0Await.upload==='audio'`.
- **Volet STOCKAGE+UI (petit)** : handler `if(r0Await.upload==='audio' && (msg.audio||msg.voice))` → écrire dans `projects_r/<id>/audio_*.m4a` + `addCandidate('audio')` ; bouton `📥 Importer audio` sur le bloc Voix (`R0_VIB_voix`). ~15 lignes. Effort **S**.
- **Volet PIPELINE (plus lourd, ⚠️ terrain)** : pour que l'audio importé soit RÉELLEMENT utilisé, le lipsync Kling doit accepter une piste audio fournie au lieu de la voix ElevenLabs → modif du pipeline réel `r0RealVideo`/WF + test LIVE (dépense). Effort **M-L** + terrain.
- **Recommandation** : si Etoile veut « juste pouvoir joindre un audio » → volet 2a-stockage seul (S, offline-testable). Si elle veut « générer la vidéo AVEC son audio » → volet pipeline (terrain, à chiffrer séparément). **À clarifier avec elle.**

### 2b. Uniformiser l'emplacement : photo importée → dossier projet (comme la vidéo)
- **État actuel** : photo importée → `looks/` (patrimoine GLOBAL, visible galerie globale) ; vidéo importée → `projects_r/<id>/` (dossier projet).
- **Option A (uniformiser)** : photo aussi dans `projects_r/<id>/` → cohérent, mais elle ne remonte plus dans la galerie GLOBALE looks (seulement projet). ~5 lignes (`dlPhoto`/handler).
- **Option B (statu quo)** : garder photo dans `looks/` (avantage : patrimoine partagé/réutilisable entre projets — ce qu'Etoile a demandé en D4 « galerie globale »).
- **Recommandation** : **Option B (statu quo)** semble cohérente avec l'exigence D4 (patrimoine global) ; n'uniformiser que si Etoile préfère l'isolation stricte par projet. **Trade-off à arbitrer.**

**Fichiers (si 2a-stockage + 2b-A)** : `telegram_bot.js` (handlers upload), `ui/nav.js` (bouton). **Risque** : faible pour le stockage ; le pipeline audio réel = ⚠️ terrain.

---

## Synthèse pour le déploiement consolidé final
| Décision Etoile | Effort | Risque | Testable offline |
|---|---|---|---|
| Versioning par champ (ring buffer) | M | faible | ✅ oui |
| Import audio — stockage+UI seul | S | faible | ✅ oui |
| Import audio — usage pipeline (lipsync) | M-L | ⚠️ terrain (dépense) | ❌ LIVE |
| Photo → dossier projet (uniformisation) | S | faible (change galerie globale) | ✅ oui |
| (Toujours inclus) fix STOP libellé `6535244` | — | nul | ✅ déjà prouvé |

> Sur go d'Etoile : j'implémente les volets retenus en offline, preuve dispatch + sweep, puis **UN SEUL** déploiement consolidé (fix STOP + choix retenus). Prod live actuelle `87c5863` reste valable pour son test terrain (#9/#15/#16).

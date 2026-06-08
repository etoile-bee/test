# CAHIER DE DOLÉANCES — Phase 2 (utilisation pure)

But : pendant 5-7 jours, Etoile **utilise** le bot tel quel (état `STABLE-1`) et note tout ce qui la gêne, l'étonne ou manque. **On ne code RIEN** pendant cette phase (sauf bug bloquant de prod ou demande explicite). On corrigera/améliorera ENSUITE, par priorités, à partir de ce cahier.

Comment ajouter : une ligne par constat, le plus récent en haut. Rester factuel (« ce que j'ai fait → ce qui s'est passé → ce que j'attendais »).

Statuts : `🆕 nouveau` · `🔁 récurrent` · `🔎 en analyse` · `🛠 à corriger` · `✅ réglé` · `💤 plus tard` · `❌ rejeté/non reproductible`

---

| Date | Constat d'Etoile | Contexte (quand / quel écran / quelle action) | Statut |
|------|------------------|-----------------------------------------------|--------|
| 2026-06-08 | **②-bis — nettoyage code mort** (tech, invisible pour Etoile) : après le chantier 2 conservateur, du legacy reste DORMANT (`launch()`/spawn, mode manuel `MM_*`, `getQButtons`, helpers de sujets legacy). Tous injoignables (entrées redirigées vers la carte). À retirer dans une passe dédiée à froid : supprimer ces fonctions, relocaliser `escHtml`, migrer/retirer `SAVE_VID`/`LCAP_LEGACY`. | post-chantier2 (commit `5cf9e51`). Backup de réf : `telegram_bot.js.preUnify`. Filet : node --check + audit callbacks + test anti-doublon. | 💤 plus tard |
| 2026-06-08 | *(exemple — à remplacer)* le texte des sous-titres me paraît trop haut | après validation du verrou 76px/OY0.370, sur une vidéo 40s | 🆕 nouveau |

<!-- Ajouter les nouvelles lignes JUSTE SOUS l'en-tête du tableau, au-dessus des plus anciennes. -->

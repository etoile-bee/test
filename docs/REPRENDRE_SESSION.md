# Reprendre CETTE session (podcast-bot) et suivre le code en direct

## Repères de la session
- **Projet** : `~/podcast-workflow`
- **ID session Claude Code** : `1ab8aacd-2271-46a7-a322-60110fde5463`
- **Transcript complet** (plaintext, tout l'historique code) :
  `~/.claude/projects/-Users-fayrouzn-podcast-workflow/1ab8aacd-2271-46a7-a322-60110fde5463.jsonl`
- **Wrapper Cowork (local-agent-mode)** : `35b0ae54-…/d6226c0d-…`
- **État du code figé** : tag git `etat-2026-06-08-v2stable` → commit `0326749`

> Cowork (onglet Cowork) = cloud Anthropic. Onglet **Code** = Claude Code **local** (`~/.claude/projects/`).
> Notre session vit en local → elle se reprend comme une session Claude Code normale.

## ① À FAIRE UNE FOIS — la NOMMER (pour la retrouver d'un coup d'œil)
Dans cette session, tape simplement :
```
/rename podcast-bot-v2
```
→ elle apparaîtra sous « podcast-bot-v2 » dans la sidebar et le picker. (Choisis le nom que tu veux.)

## ② LA ROUVRIR plus tard

### A. Dans l'app Mac, onglet « Code »
1. Ouvre la **sidebar de gauche** (liste des sessions du projet).
2. Repère **podcast-bot-v2** (ou son résumé auto + l'heure d'inactivité).
3. **Clic** = la rouvre dans l'onglet courant (historique complet, tu peux continuer + suivre les actions en direct).
4. **Cmd+clic** = l'ouvre en **split view** (deux panneaux côte à côte) — c'est l'équivalent le plus proche d'un « nouvel onglet » (l'app n'a pas de bouton direct « ouvrir dans un nouvel onglet »).

### B. Au terminal (le plus fiable, indépendant de l'UI)
```bash
cd ~/podcast-workflow
claude --resume podcast-bot-v2          # par le nom (après l'avoir nommée)
# ou par l'ID :
claude --resume 1ab8aacd-2271-46a7-a322-60110fde5463
```
Sans argument, `claude --resume` ouvre un **sélecteur** : flèches pour choisir, `/` pour chercher, `Space` pour aperçu, `Ctrl+R` pour renommer, `Entrée` pour reprendre.
→ Reprend **exactement** la même session avec tout l'historique (identique à l'app, juste en terminal).

## ③ Suivre les transcriptions du code EN DIRECT (comme au début)
- **Dans l'app (onglet Code)** : une fois la session rouverte, tu vois en temps réel chaque action de l'agent (édits de fichiers, commandes, etc.) au fil de l'eau — c'est la vue « live » que tu avais.
- **En plus / en parallèle (terminal)** : tu peux suivre le transcript brut qui s'écrit en continu :
  ```bash
  tail -f ~/.claude/projects/-Users-fayrouzn-podcast-workflow/1ab8aacd-2271-46a7-a322-60110fde5463.jsonl
  ```

## ④ Revenir à l'ÉTAT DU CODE (pas la conversation)
```bash
cd ~/podcast-workflow
git checkout -b retour-v2 etat-2026-06-08-v2stable   # branche propre depuis l'état figé
# (le tag ne bouge pas, même si une autre session Cowork commite en parallèle)
```

## Notes
- **Rétention** : les sessions Claude Code sont gardées **30 jours** par défaut (`cleanupPeriodDays` dans `settings.json` pour changer). Le **transcript .jsonl** est ta sauvegarde durable.
- **Exporter** la session en texte : commande `/export` (ou `/export /tmp/session.txt`).
- Repo « volatile » : une autre session Cowork commite toute seule → si un commit échoue avec un *lock*, voir `.git/index.lock` / `.git/HEAD.lock` (les retirer seulement si aucun `git` ne tourne).

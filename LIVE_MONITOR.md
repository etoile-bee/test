# Moniteur live fusionné (CLOUD + MAC)

Voir défiler, **ici dans la session Claude distante**, l'activité en temps réel :
**CLOUD** = ce que Claude demande au système + la discussion ; **MAC** = le bot
podcast qui tourne sur votre Mac.

## Pourquoi ce montage (et pas ntfy)

La session cloud tourne sur un réseau en **liste blanche** : `ntfy.sh` est bloqué
(`403 Host not in allowlist`), **seul GitHub est joignable**. Le pont entre votre
Mac et cette session est donc **GitHub** : le Mac pousse l'activité du bot sur une
branche `live-feed`, et le lecteur la récupère par `git fetch`.

```
  Mac (bot) ──logs──> live_publish_mac.py ──git push──> GitHub (branche live-feed)
                                                              │
  Session cloud Claude ──hook──> live/cloud.jsonl            │ git fetch
                                      └──────► live_recap.py ◄┘  (fusion + affichage)
```

## 1. Côté CLOUD (automatique, déjà en place)

Le hook `.claude/settings.json` lance `live/hook_log.py` à chaque :
- **appel d'outil** (`PreToolUse`) → « ce que Claude demande au système » ;
- **message utilisateur** (`UserPromptSubmit`) → « la discussion ».

Chaque évènement est ajouté à `live/cloud.jsonl` (local au conteneur, lecture
seule à l'affichage). Le hook s'applique aux **sessions cloud à venir** ; la
session courante peut nécessiter un redémarrage pour le charger.

## 2. Côté MAC (à lancer une fois, sur votre Mac)

```bash
python3 -u live_publish_mac.py --base ~/podcast-workflow --repo ~/podcast-workflow
```

- `--base` : où sont les logs du bot (`logs/ui_journal.jsonl`, `bot_journal.log`).
- `--repo` : un checkout git de `etoile-bee/test` d'où partira le `push`.
- Crée un **worktree dédié** (`../<repo>-livefeed`, branche `live-feed`) : ne touche
  jamais votre branche de travail ni le code du bot. Push toutes les 5 s, fenêtre
  glissante de 2000 lignes.

## 3. Voir le récap fusionné (à la demande, ici)

Demandez-moi simplement « montre les dernières activités », ou lancez :

```bash
python3 live_recap.py            # 40 derniers évènements, fusionnés par horodatage
python3 live_recap.py --n 80     # plus d'historique
python3 live_recap.py --src MAC  # seulement le bot
python3 live_recap.py --grep kling   # filtre texte
```

Couleurs : **CLOUD** cyan, **MAC** vert, messages utilisateur en gras.
Lecture seule de bout en bout — aucun de ces scripts n'écrit dans les logs du bot.

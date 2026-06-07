# Sauvegarde auto sur GitHub privé

Le hook `.git/hooks/post-commit` est **déjà installé** : dès qu'un remote `origin` existe,
**chaque commit est poussé automatiquement** sur GitHub (push en arrière-plan, silencieux).
Tant qu'aucun remote n'est configuré, il ne fait rien.

## Ce qu'il te reste à faire (UNE fois)

Je ne crée pas de compte à ta place. Crée le dépôt **privé** puis donne-moi (ou colle) l'URL.

### Option A — avec l'app GitHub / le site (sans terminal)
1. Va sur https://github.com/new
2. Repository name : `podcast-workflow`
3. Coche **Private** 🔒
4. **Ne coche PAS** « Add a README » (le dossier a déjà des fichiers)
5. Clique **Create repository**
6. Copie l'URL affichée, ex : `https://github.com/TON_PSEUDO/podcast-workflow.git`
7. Donne-moi cette URL — je lance la commande de liaison + le 1er push.

### Option B — tout en terminal (si tu installes `gh`)
```bash
brew install gh          # une fois
gh auth login            # suis les étapes (navigateur)
cd ~/podcast-workflow
gh repo create podcast-workflow --private --source=. --remote=origin --push
```
→ crée le repo privé, le lie comme `origin`, et pousse tout. Terminé.

### Liaison manuelle (si tu as déjà l'URL)
```bash
cd ~/podcast-workflow
git remote add origin https://github.com/TON_PSEUDO/podcast-workflow.git
git push -u origin main
```
À partir de là, **chaque commit suivant se pousse tout seul** (hook post-commit).

## Notes
- `.env` n'est PAS poussé (présent dans `.gitignore`) — tes clés API restent locales. ✅
- Pour vérifier que l'auto-push marche : fais un commit, puis `git log origin/main -1` doit montrer ton dernier commit.
- Authentification : si le push demande un mot de passe, utilise un **Personal Access Token** GitHub (Settings → Developer settings → Tokens) comme mot de passe, ou `gh auth login`.

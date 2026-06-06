# CONTEXTE PROJET — Podcast Workflow (à coller en début de nouvelle conversation)

> ⚠️ DOCUMENT VIVANT : Claude le met à jour à CHAQUE session (état, reste à faire, historique en bas).
> Ne jamais supprimer l'historique — c'est la mémoire du projet.

## RÉSULTAT ATTENDU (vision)
- Chaîne de production TikTok 100% automatisée et FIDÈLE : ce qui est validé en test = ce qui sort en prod, à l'identique.
- Une influenceuse IA d'abord (coach relationnelle, femmes 20-40), puis généralisation multi-personas (config par influenceuse, moteur unique).
- Ensuite : monétisation (à définir — plugins Marketing et Small Business installés dans Cowork pour ça).

## RÔLE DE CLAUDE
- Ingénieur d'exploitation du pipeline : patchs vérifiés, git, garde-fous anti-dépense, fidélité test→prod.
- Gardien de la RÈGLE D'OR : ne JAMAIS déclencher de génération payante sans accord explicite.
- Tient CE fichier à jour en fin de session : état actuel, reste à faire, + une ligne d'historique datée.
- Etoile garde les décisions créatives et financières. Claude propose, Etoile tranche.

## Qui je suis / setup
- MacBook, dossier `~/podcast-workflow/`. Tout en FRANÇAIS.
- Bot Telegram qui génère des vidéos TikTok lipsync (coach relationnelle, femmes 20-40).
- Fichiers : `telegram_bot.js` (bot, pm2 `podcast-bot`), `workflow.js` (moteur vidéo), `subtitle_style.js` (style sous-titres — SOURCE UNIQUE prod+test+bot), `test_soustitres.js` (test sandbox gratuit).
- Pipeline : ElevenLabs (voix) + Kling/Higgsfield (lipsync) + Shotstack (montage/sous-titres/couleur).
- Looks : iCloud `podcast-looks/` (symlink `looks/`). Sorties : iCloud `podcast-outputs/` (symlink `outputs/`).

## RÈGLE D'OR — ARGENT
- CHAQUE vraie vidéo COÛTE de l'argent (ElevenLabs + Kling + Shotstack). On groupe les changements, on teste UNE fois.
- Test sous-titres GRATUIT : `node test_soustitres.js` (sandbox Shotstack, filigrané, raw déjà payé) ou commande `/test` du bot Telegram.
- `SHOTSTACK_SANDBOX_KEY` est dans `.env` (≠ clé prod `SHOTSTACK_API_KEY`).

## RÈGLE — REDÉMARRAGE BOT
- Patchs `workflow.js` / `subtitle_style.js` / `test_soustitres.js` → PAS de redémarrage.
- Patchs `telegram_bot.js` → `pm2 restart podcast-bot` OBLIGATOIRE, mais SEULEMENT si aucune vidéo ne tourne. Vérif :
  `pgrep -f "workflow.js" >/dev/null && echo "⛔ video en cours, NE PAS redemarrer" || pm2 restart podcast-bot`

## MÉTHODE DE TRAVAIL (à respecter)
- Via Cowork : Claude a accès direct à `~/podcast-workflow/`, `podcast-looks/` et `podcast-outputs/` → il édite les fichiers lui-même, commit git avant/après chaque patch. Plus de téléchargement de patchs.
- Rollback : `git log --oneline` puis `git checkout <hash> -- <fichier>`.
- Limites de l'environnement Claude : pas d'accès réseau Shotstack/tmpfiles (les tests s'exécutent sur le Mac ou via `/test`), pas de pm2 (redémarrages = Etoile).
- Toujours demander "on fait le point ?" avant toute génération de vraie vidéo.

## ÉTAT ACTUEL (2026-06-07)
- Sous-titres : style subref v2 (Arial Black 52px, stroke blanc 1.3px, ombre douce, OY=0.347) centralisé dans `subtitle_style.js`. NON ENCORE VALIDÉ visuellement (le test du 06/06 a dû être supprimé — mauvaise personne).
- `workflow.js` : revue1 appliquée (fix filtre [pause], captions, retry JSON ×3, approbation scripts Parts 2/3 avant dépense, code mort supprimé).
- `telegram_bot.js` : commande `/test` ajoutée (sandbox, garde-fous) + réglages /settings retargés sur `subtitle_style.js` → ⚠️ REDÉMARRAGE PM2 EN ATTENTE (quand bot libre).
- Avatar `.env` : la bonne influenceuse (hf_20260531_191302...). Purge faite : tous les fichiers de la "mauvaise personne" (session 21h10-21h28 du 06/06) + selfie terrasse supprimés.

## CE QU'IL RESTE À FAIRE
1. Redémarrer le bot (commande sécurisée ci-dessus) → active `/test` et les nouveaux réglages.
2. Lancer le test sous-titres (Terminal ou `/test`) sur le raw 20h54 (bonne influenceuse) → caler FONT_SIZE/OY dans `subtitle_style.js` jusqu'à validation.
3. UNE vraie vidéo de validation (couleur + sous-titres), puis git tag "v1-validee".
4. 🆕 Galerie de looks dans le bot.
5. Ensuite seulement : multi-personas (config par influenceuse) puis monétisation.

## PRÉFÉRENCE SOUS-TITRES (modèle visé)
- Style référence : photo "CHEMISTRY FADES" = grotesque type Arial/Helvetica, TOUT BLANC, lettres espacées, ombre douce (PAS de gros contour noir), au HAUT DE LA MOUSSE DU MICRO (pas au cou).

## NOTES TECHNIQUES UTILES
- Sous-titres Shotstack : asset html, `width:720` (bug 1080→720 corrigé), `position:'bottom'`, `offset.y` (plus grand = plus haut). Shotstack peut décaler de ±20-40px vs aperçu → d'où le test sandbox.
- Couleur : passe finale ffmpeg dans `saveOpen` ; filtre neutre `eq=brightness=0:saturation=1`.
- L'influenceuse officielle : femme métisse, taches de rousseur, yeux dorés, bijoux or, décor bougies+bibliothèque. Toute autre personne dans looks/ = à signaler.

## HISTORIQUE DES SESSIONS (ne pas supprimer — ajouter en haut)
- **2026-06-06/07 (Cowork, 1ère session)** : Setup Cowork (plugins Marketing/Adobe/Small Business). Accès direct aux 3 dossiers. Commits : `76a30d9` (état avant), `a26b161` revue1 (5 fix workflow.js), `3e5800c`+`a7f5aef` test sync subref v2, `7af9202` cmdtest v1 (/test Telegram), `8fb8c55` substyle v1 (source unique `subtitle_style.js`, fix /settings position). Purge "mauvaise personne" : 8 fichiers supprimés (3 tg_*.jpg looks, raw+p1+txt 21-21, TEST_soustitres.mp4, selfie terrasse). Résultat attendu de la session suivante : test sous-titres validé sur la bonne influenceuse, puis vraie vidéo de validation.

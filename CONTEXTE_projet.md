# CONTEXTE PROJET — Podcast Workflow (à coller en début de nouvelle conversation)

## Qui je suis / setup
- MacBook, dossier `~/podcast-workflow/`. Tout en FRANÇAIS.
- Bot Telegram qui génère des vidéos TikTok lipsync (coach relationnelle, femmes 20-40).
- 2 fichiers : `telegram_bot.js` (le bot, tourne sous pm2 `podcast-bot`) et `workflow.js` (le moteur vidéo).
- Pipeline : ElevenLabs (voix) + Kling/Higgsfield (lipsync) + Shotstack (montage/sous-titres/couleur).

## RÈGLE D'OR — ARGENT
- CHAQUE vraie vidéo COÛTE de l'argent (ElevenLabs + Kling + Shotstack). On groupe les changements, on teste UNE fois.
- Pour tester les SOUS-TITRES gratuitement : script `test_soustitres.js` → rendu Shotstack en SANDBOX (gratuit, filigrané) sur un raw déjà payé. Nécessite `SHOTSTACK_SANDBOX_KEY` dans `.env` (clé sandbox, différente de la production `SHOTSTACK_API_KEY`).

## RÈGLE — REDÉMARRAGE BOT
- Patchs `workflow.js` (couleur, sous-titres, zoom, réactions) → PAS de redémarrage.
- Patchs `telegram_bot.js` (menus, légendes) → `pm2 restart podcast-bot` OBLIGATOIRE, mais SEULEMENT si aucune vidéo ne tourne. Vérif :
  `pgrep -f "workflow.js" >/dev/null && echo "⛔ video en cours, NE PAS redemarrer" || pm2 restart podcast-bot`

## MÉTHODE DE TRAVAIL (à respecter)
- Claude livre des "patchs" = scripts .js auto-vérifiants (testés sur maquette avant livraison, anti-double-apply, sauvegarde .preXXX, abort si ancre absente).
- Application : télécharger le fichier depuis le chat (ATTENDRE la fin du download), puis
  `find ~ -maxdepth 5 -iname "patch_NOM.js" -exec mv {} ~/podcast-workflow/ \; 2>/dev/null` puis `node patch_NOM.js`
- Pour itérer sur le look des sous-titres SANS payer : aperçus PIL gratuits OU le script test sandbox.
- Toujours demander "on fait le point ?" avant toute génération de vraie vidéo.

## ÉTAT ACTUEL (déjà fait et appliqué)
- workflow.js : couleur remise à l'origine (filtre annulé, anti-pop gardé) ; sous-titres refaits = Arial blanc, espacé, ombre douce, plus gros/épais ; position en cours de calage.
- Dernier patch posé : `patch_subpos5` (sous-titres `subref v2`) → `_oy=0.347` (haut de la mousse du micro), `font-size:52px`, `-webkit-text-stroke:1.3px`, `letter-spacing:2px`. NON ENCORE VALIDÉ EN VIDÉO.
- telegram_bot.js : menu "⚡ Sur-mesure / 🎲 Aléatoire" (menu v4), légendes v3, auto-recap — tous appliqués, bot redémarré.

## CE QU'IL RESTE À FAIRE
1. Récupérer la clé SANDBOX Shotstack → l'ajouter dans `.env` (`SHOTSTACK_SANDBOX_KEY=...`).
2. Lancer `node test_soustitres.js` (gratuit) pour voir la VRAIE position Shotstack des sous-titres, et caler les 2 chiffres en haut du fichier : `FONT_SIZE` (taille) et `OY` (hauteur).
3. Quand les sous-titres sont validés sur le test → c'est déjà dans workflow.js, donc OK.
4. Faire UNE vraie vidéo de validation (couleur + sous-titres) et vérifier.
5. Ensuite : 🆕 galerie de looks dans le bot, puis 🆕 figer le code validé avec Git :
   `cd ~/podcast-workflow; git init 2>/dev/null; git add -A; git commit -m "Version validee"`

## PRÉFÉRENCE SOUS-TITRES (modèle visé)
- Style de référence : photo "CHEMISTRY FADES" = grotesque type Arial/Helvetica, TOUT BLANC, lettres espacées, ombre douce (PAS de gros contour noir), au HAUT DE LA MOUSSE DU MICRO (pas au cou).
- Réglages voulus en dernier : un peu plus gros + plus épais/gras, police Arial (gardée), position haut du micro.

## NOTES TECHNIQUES UTILES
- Sous-titres Shotstack : asset html, `width:720` (corrige un vieux bug 1080→720 qui mangeait la taille), `position:'bottom'`, `offset.y=_oy` (plus grand = plus haut).
- Shotstack peut décaler la position de ±20-40px vs un aperçu → c'est pour ça qu'on teste en sandbox.
- Couleur : passe finale ffmpeg dans `saveOpen` ; filtre actuellement neutre `eq=brightness=0:saturation=1`.

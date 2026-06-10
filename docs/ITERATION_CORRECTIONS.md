
---

# ITÉRATION v6 — punch-list captures live (#1→#6)

> Branche `fix/root-causes-v1` (commit `5839bc5`). Tirée des 3 captures du test live d'Etoile. Bot live **non redémarré** (édité + commité sur la branche ; re-bascule sur go).

| # | Sujet | Cause/Frontière | Correction | Gain | Risque |
|---|---|---|---|---|---|
| 1 | Message technique « code à jour » | UX/F13 | restart/boot/status **déjà en toast** (vérifié) ; capture = ancien prod pendant la bascule | plus aucun message technique au chat | nul |
| 2 | Noms de fichiers/ids affichés | UX | en-têtes en **libellés métier** (Réf=Imany, Look=label tenue, Décor, Média=« Image n/N ») | l'utilisateur ne voit plus de `.jpg`/id | faible |
| 3 | Brouillon/titre illisibles | UX | `draftLabel()` → « 9 juin · 21:29 » ; titres courts (« Look », « Image », « Finalisation ») | dates lisibles | faible |
| 4 | « eco » / cr / € | UX/produit | `modeLabel(eco→Aperçu)` ; Image = **Aperçu gratuit** puis **✨ Lancer Final HD** (coût à la confirmation) ; idem vidéo | logique Aperçu→Final HD | faible (relabel ; voir design ci-dessous) |
| 5 | Surcharge boutons / troncature | UX | barre système = **❓ Aide** seule (Stop visible seulement en génération via `ctx.busy`) ; écran Look simplifié ; libellés courts | une action claire/écran | moyen (à valider live) |
| 6 | Entrée VIDÉO sans sources | MC1 | home **VIDÉO → `video.source`** (Look projet/Image générée/Galerie/Nouveau look/Upload) | demande la source directement | faible |

## Design #4 — APERÇU GRATUIT → FINAL HD payant (proposition)
**Objectif** : montrer un visuel **réellement gratuit** avant toute dépense, puis « Lancer Final HD » (payant, confirmation).
- **Aperçu gratuit (0 crédit)** — options techniques proposées :
  1. **Composite local** (retenu, le plus simple) : afficher la **référence/look courant** (déjà en cache local) comme vignette d'aperçu + en-tête des paramètres (tenue/décor/prompt). Aucune API. *C'est l'état actuel du bloc média à l'étape Image* → on l'**étiquette** « 👁 Aperçu gratuit ».
  2. **Aperçu basse résolution** (ultérieur) : un appel image **low-res/rapide** si l'API le permet à coût ~nul, sinon s'abstenir.
  3. **Mock stylé** (ultérieur) : overlay local (ffmpeg) du look + texte des params pour une vignette représentative.
- **Final HD (payant)** : bouton **✨ Lancer Final HD** → confirmation in-bloc avec coût → génération Seedream/Kling réelle (inchangée, derrière confirmation, **non câblée en test**).
- **État** : la **terminologie** et le **parcours Aperçu→Final HD** sont en place (relabel + bouton). L'aperçu « composite local » = le visuel actuel (option 1). Les options 2/3 (aperçu généré low-cost) sont **conçues, différées**.

## Reste (#7 bibliothèques non destructives)
LOOKS/HISTORIQUE déjà en bloc média (v5). Restent legacy : Références (`RX_REFS`), Modèles (`SHOWSTYLES`), Décors, Personas, Médias, Prêt-à-poster → à migrer ensuite (n'ouvrir aucun bloc legacy qui rompt la continuité).

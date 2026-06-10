# RETOUR UX CONSOLIDÉ d'Etoile — spécification du gros round (2026-06-10)

> Source unique de suivi. Statut par point : ⬜ à faire · 🟡 en cours / simu · ✅ fait+testé simu · 🚢 déployé+live · 🔵 conçu/différé.
> Branche de travail : `fix/root-causes-v1` (live `7e24dac`) ; développement des lots en worktree isolé, ff-merge au déploiement sur go d'Etoile.

## Les 10 PRIORITÉS (ordre d'exécution) — intègrent les 18 points
| P | Intitulé | Points # | Effort | Risque | Statut |
|---|---|---|---|---|---|
| P1 | En-tête 1 ligne, moins de texte, brouillon lisible | #1 | S | faible | ⬜ |
| P2 | Aperçu média permanent à CHAQUE étape | #2 | S | faible | ⬜ |
| P3 | Bibliothèques en GRILLE (6 max, nav, cartes lisibles, zéro nom de fichier) | #3,#18 | M | moyen | ⬜ |
| P4 | Menu principal = 4 entrées (PHOTO·VIDÉO·STUDIO·RÉCENTS) ; Looks/Historique → STUDIO | #4 | S | moyen | ⬜ |
| P5 | PHOTO & VIDÉO = 2 entrées du même moteur (PHOTO: Générer/Reprendre/Upload→config ; VIDÉO: source directe→script…) | #5,#6 | M | moyen | ⬜ |
| P6 | Durée vidéo (30/45/60→nb plans) + Planche (1/2/3/4/6, aperçu gratuit, images exploitables) | #7,#8 | L | élevé | ⬜ |
| P7 | Aperçu gratuit → Final HD + écran de confirmation/finalisation riche | #9,#10 | M | moyen | ⬜ |
| P8 | Tout ré-éditable avant finalisation, libellés contextuels (Conserver/MàJ/Régénérer) | #11 | M | moyen | 🟡 (cœur fait) |
| P9 | Zéro message technique + commandes slash alignées/retirées | #15,#14 | S–M | faible | 🟡 (msgs OK ; cmds F14 à faire) |
| P10 | Éditeur confiné dans LE bloc (Éditer/Montage/Script/Légende/Vidéo) — F1 | #13 | L | élevé | ⬜ |

## À INTÉGRER dans l'ordre
- **#12 MONTAGE plus riche** : fusionner Script/Montage/Légende en bloc Vidéo compact OU détailler (zoom, sous-titres, musique, rythme, plans, transitions, voix, style). → avec P6/P7.
- **#16 BOUTONS simplifiés** : une action principale/écran, libellés non tronqués, Stop/Restart/Status hors expérience métier (→ Aide/système). → avec P1.
- **#17 PRÊT-À-POSTER complet** : vidéo finale, légende courte, légende longue, hashtags, script, statut, reprendre le style. → avec P3/P7.

## Les 18 POINTS (détail + statut)
1. En-tête trop long / noms techniques → 1 ligne lisible · brouillon date+heure. **(P1)** ⬜
2. Aperçu média doit rester visible partout. **(P2)** ⬜
3. Bibliothèques en grille (6/écran), cartes (aperçu+date+type+statut), pas de listes ni noms de fichiers. **(P3)** ⬜
4. Sortir bibliothèques du menu principal → Studio ; 4 entrées. **(P4)** ⬜
5. PHOTO = entrée moteur (Générer/Reprendre/Upload→réf/tenue/décor/prompt/nb/format/aperçu). **(P5)** ⬜
6. VIDÉO = demander la source directement → script/durée/montage/légende/aperçu/Final HD. **(P5)** ⬜
7. Durée vidéo 30/45/60 avant génération ; durée→nb plans (montage auto). **(P6)** ⬜
8. Planche 1/2/3/4/6 ; aperçu gratuit ; planche validée = images exploitables séparément. **(P6)** ⬜
9. Aperçu gratuit obligatoire avant toute dépense ; « eco »→Aperçu/Final HD. **(P7)** 🟡 (terminologie faite)
10. Finalisation = récap riche (source·réf·look·décor·script·durée·sous-titres·musique·format·coût·crédits·mode). **(P7)** ⬜
11. Tout ré-éditable avant l'étape finale + libellés contextuels. **(P8)** 🟡 (cœur câblé, libellés à contextualiser)
12. Montage plus riche (fusion ou détail). **(#12)** ⬜
13. Aucun nouveau bloc/écran externe (éditeur confiné). **(P10)** ⬜
14. Affichages legacy à retirer/aligner. **(P9)** 🟡 (F14)
15. Zéro message technique. **(P9)** ✅ (déployé ; à re-vérifier exhaustif)
16. Boutons simplifiés, libellés non tronqués, contrôles techniques hors métier. **(#16)** 🟡 (barre système réduite)
17. Prêt-à-poster complet. **(#17)** ⬜
18. Listes → grilles lisibles (avec #3). **(P3)** ⬜

## Architecture (mise à jour)
Menu principal **4 entrées** : 📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS. **Looks/Historique rejoignent STUDIO.** Studio = bibliothèque/archives/reprise (non destructif) ; cockpit production = parcours de création. (MAJ `COCKPIT_CIBLE_UX`.)

_Suivi vivant — mis à jour à chaque lot._

---
## PRÉCISIONS des 10 captures live (2026-06-10)
**Déjà bon (ne pas casser)** : aperçu média persistant sur TOUTES les étapes (#2 ✅) ; entrée VIDÉO = picker source « D'où part la vidéo ? » (#6 ✅) ; terminologie Aperçu/Final HD appliquée (✅).
**À corriger (preuves)** :
- 🔴 **#15** message technique « Chargement… » visible en haut sur Script/Montage/Finalisation → supprimer/neutraliser (audit tout « Chargement… »/transitoire). **Quick win P1.**
- **#1** en-tête encore 2-3 lignes (« 9 juin · 21:29 · MONTAGE » / « Média : Image 1/1 · Imany » / « Script : perso ») → 1 ligne. **Quick win P1.** *(corrigé sur ux-round2 via hdr1 — à vérifier en live).*
- **#12** Montage : retirer jargon « Archivo Black 52px » ; Montage trop pauvre → détailler (zoom, sous-titres, musique, rythme, plans, transitions, voix, style) OU bloc Vidéo compact ; **#13** confiner l'éditeur.
- **#10** Finalisation trop pauvre → récap complet (média source · réf · look · décor · script · durée · sous-titres · musique · format · coût · crédits · mode).
- **#16** trop de boutons ; **#7** durée vidéo non visible ; **#8** Look montre « 3 image(s) » mais pas le mode planche 1/2/3/4/6.

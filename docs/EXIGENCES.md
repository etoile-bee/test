# RÉFÉRENTIEL D'EXIGENCES — Podcast Workflow (Etoile)

> Consolidation de **toutes** les exigences d'Etoile : historique projet (`CONTEXTE_projet.md`,
> `PLAN_STUDIO.md`, `docs/ARCHITECTURE_FINALE.md`, `docs/DOLEANCES.md`, `docs/AUDIT_UX.md`,
> `docs/MAPPING_ARCHITECTURE.md`) **+** les 2 grands messages récents (cockpit 2 sections, CRUD
> looks/décors/prompts, etc.). Chaque exigence est **numérotée (Ex)** pour la traçabilité de l'audit
> (`docs/AUDIT_COMPLET.md`). Rédigé 2026-06-09, lecture seule.
>
> Légende source : `[ARCH]`=ARCHITECTURE_FINALE · `[MSG]`=messages récents · `[CTX]`=CONTEXTE ·
> `[UX]`=AUDIT_UX · `[PLAN]`=PLAN_STUDIO · `[MAP]`=MAPPING.

---

## A. ARCHITECTURE & PRINCIPES GLOBAUX

- **E1** — **Éditeur/cockpit unique** : tout le pilotage dans un seul message auto-édité en place ; **aucune nouvelle fenêtre/onglet/popup**, jamais de spam de messages. `[ARCH][CTX][UX-1]`
- **E2** — **Cockpit à 2 sections : PHOTO et VIDÉO**, totalement connectées entre elles (une photo/look produite alimente directement la vidéo, et inversement). `[MSG]`
- **E3** — **Style « ÉDITION » partout** : 1 média en tête, légende 1 ligne (TITRE gras · infos `·`), boutons courts emoji 2-3/rangée, 💰 sur les boutons payants, zéro paragraphe. `[CTX][UX-2]`
- **E4** — **Navigation cohérente partout** : OK / Annuler / Précédent / Suivant présents et homogènes sur chaque écran ; retour possible de partout ; fil d'Ariane lisible ; vocabulaire de retour unifié. `[MSG][UX-8]`
- **E5** — **Conservation d'état systématique** : look/décor/prompt/script/projet/paramètres actifs survivent à la navigation, aux retours, aux sous-menus. `[MSG][ARCH]`
- **E6** — **Reprise de session après crash/reload/restart** : on retrouve l'état (les blocs, le projet en cours) sans repartir de zéro ni empiler. `[MSG]`
- **E7** — **Mode Manuel (sur-mesure) vs Auto SÉPARÉS** ; le mode **Auto doit être extrêmement fiable** de bout en bout. `[MSG][CTX]`
- **E8** — **Prévisualisation AVANT CHAQUE validation** (look, décor, prompt, image, vidéo, légende, export) — « tous les aperçus = la réalité » (fidélité aperçu→résultat, test=prod). `[MSG][CTX]`
- **E9** — **Multi-persona** : moteur unique, config par influenceuse (looks/sorties/styles par persona). `[CTX][MAP]`

## B. RÈGLE D'OR — COÛTS & ARGENT

- **E10** — **Aucune génération payante sans accord explicite** d'Etoile (règle d'or absolue). `[CTX]`
- **E11** — **Récap coût + crédits + temps AVANT toute dépense**, avec bouton de confirmation 💲 distinct. `[MSG][CTX][UX-15]`
- **E12** — **Images test ÉCO d'abord** ; HD et vidéo ne se débloquent qu'après validation visuelle. `[CTX][UX-5]`
- **E13** — **Maquette (~centimes) avant le lipsync Kling** (vrai rendu approché avant la dépense lourde). `[CTX][UX-4]`
- **E14** — **Coûts/temps exacts et honnêtes** (pas de durée sous-estimée). `[UX-6,15]`

## C. LOOKS (CRUD complet)

- **E15** — **Créer un look** (génération depuis référence Imany, seedream 9:16). `[MSG][CTX]`
- **E16** — **Modifier un look**. `[MSG]`
- **E17** — **Dupliquer un look**. `[MSG]`
- **E18** — **Supprimer un look** (réversible/corbeille). `[MSG]`
- **E19** — **Archiver un look**. `[MSG]`
- **E20** — **Réutiliser un look** (le re-sélectionner pour une nouvelle création). `[MSG][CTX]`
- **E21** — **LOCK / déverrouiller un look** (figer un look). `[MSG]`
- **E22** — **Galerie looks en GRILLE** (planche/vignettes paginée), aperçus, derniers d'abord, Éditer sur chaque. `[MSG][UX-10][PLAN]`
- **E23** — **Noms de looks lisibles**. `[UX-22]`

## D. NEW LOOK + DÉCORS (sur le même écran)

- **E24** — **New Look intègre les décors sur le MÊME écran** (choix tenue + décor sans changer d'écran). `[MSG]`
- **E25** — **Décors = mêmes capacités que les looks** : créer/modifier/dupliquer/supprimer/archiver/réutiliser/lock. `[MSG]`
- **E26** — **Lock Background** (verrouiller un décor/arrière-plan). `[MSG]`
- **E27** — **3 décors de base** minimum (bougies/jour/studio réaliste), extensibles. `[CTX]`

## E. PROMPTS (gestion complète, sans changer d'écran)

- **E28** — **Tous les prompts VISIBLES**. `[MSG]`
- **E29** — **Éditables**. `[MSG][CTX]`
- **E30** — **Sauvegardables**. `[MSG]`
- **E31** — **Dupliquables**. `[MSG]`
- **E32** — **Supprimables**. `[MSG]`
- **E33** — **Réutilisables**. `[MSG]`
- **E34** — **Le tout SANS changer d'écran** (dans le cockpit). `[MSG]`

## F. IMAGES

- **E35** — **Générer 1 / 2 / 3 images** (sélecteur du nombre). `[MSG]`
- **E36** — **Planche contact automatique** (vue d'ensemble des images générées). `[MSG]`
- **E37** — **Sélection d'une image pour la vidéo**. `[MSG]`
- **E38** — **Éditer une image avant la vidéo** (retouche/restyle). `[MSG]`
- **E39** — **Affichage entier 9:16, jamais coupé** ; pas de sur-zoom/grading non voulu sur image fixe. `[PLAN]`

## G. VIDÉO & CONNEXIONS

- **E40** — **Vidéo : toutes les redirections vérifiées** (chaque bouton mène au bon écran). `[MSG]`
- **E41** — **PHOTO ↔ VIDÉO totalement connectés** (passer de l'une à l'autre sans perte de contexte). `[MSG]`
- **E42** — **Chaîne vidéo complète & fiable** : look → script → voix (ElevenLabs) → lipsync (Kling) → rendu local → livraison. `[CTX]`
- **E43** — **Workflows transverses fluides** : LOOK→IMAGE→VIDÉO→LÉGENDE→EXPORT, LOOK→DÉCOR, DÉCOR→IMAGE, IMAGE→VIDÉO, VIDÉO→LOOK, HISTORIQUE→RÉUTILISATION, ARCHIVES→RÉÉDITION — rapides, cohérents, contexte conservé. `[MSG]`
- **E44** — **Durée libre 15 s → 2 min** (multi-parties assemblées au-delà de ~30 s). `[CTX][UX-17]`
- **E45** — **« Partie suivante »** (enchaîner les parts). `[UX-18]`

## H. SCRIPT

- **E46** — **Script toujours affiché & modifiable avant toute dépense**. `[CTX][UX-3]`
- **E47** — **Catégories de sujets + anti-répétition** (pas 2× le même sujet/look rapproché). `[CTX][UX-16]`
- **E48** — **Hooks A/B** (variantes d'accroche). `[UX]`

## I. LÉGENDES

- **E49** — **Légendes en GRILLE, reliées aux vidéos**, avec versions. `[MSG]`
- **E50** — **Légende courte + longue + hashtags**, copiables sans le titre. `[CTX][UX-21]`
- **E51** — **Éditer/régénérer les légendes**. `[MAP]`

## J. HISTORIQUE / ARCHIVAGE / RÉÉDITION / EXPORT

- **E52** — **Tout ce qui est généré est SAUVEGARDÉ et RETROUVABLE** (looks, photos, vidéos, scripts, légendes). `[MSG][CTX]`
- **E53** — **Historique en GRILLE avec aperçus**. `[MSG]`
- **E54** — **Réouverture / réédition / relance d'un projet** depuis l'historique. `[MSG]`
- **E55** — **« Modèle/projet sur-mesure » sauvegardable & réouvrable** = config complète (look + décor + caméra + style + réglages + script). `[MSG][ARCH]`
- **E56** — **Projet réouvrable à l'identique** (média + prompts + décor + caméra + script + légendes + paramètres) → futur `project.json`. `[ARCH][MAP-C]`
- **E57** — **Prêt à poster / à retravailler** (brouillons), export propre. `[UX-19]`
- **E58** — **Restyle gratuit** (rendu local ffmpeg, €0). `[UX-20]`
- **E59** — **Publication TikTok auto + stockage privé** (≠ tmpfiles) + boucle /mark (backlog). `[CTX]`

## K. SUIVI, ÉTAT, JOURNALISATION, ROBUSTESSE

- **E60** — **Suivi de génération** : progression, statut, temps écoulé, succès/échec, relance. `[MSG][UX-4]`
- **E61** — **Annulation réelle et fiable** (stop/abort qui marche, perçu fiable). `[CTX][UX-25]`
- **E62** — **`/stop` + `/restart` accessibles en tête** (pilotage prioritaire). `[UX-26]`
- **E63** — **Journal utilisateur** (ce qu'a fait Etoile) **+ logs système** (appels API, erreurs, temps, crédits). `[MSG]`
- **E64** — **Erreurs claires et actionnables** (ex. crédits épuisés → message net + stop des relances), pas d'erreur opaque. `[UX-2]`
- **E65** — **Chaque clic tracé, chaque action vérifiée, chaque erreur journalisée, auto-correction si possible, rapport détaillé par session**. `[ARCH]`
- **E66** — **Robustesse / gestion des doublons de code mort** (3 flux concurrents legacy à retirer ; un seul flux de génération). `[UX-3,F6]`

## L. STYLE / RENDU (verrouillés — à préserver, pas à régresser)

- **E67** — **Sous-titres 76px / OY 0.370** (Archivo Black) — fichier verrouillé. `[CTX][UX-11]`
- **E68** — **Couleur V5** appliquée fidèlement à la vraie vidéo. `[CTX][UX-12]`
- **E69** — **Son -14 LUFS**, sanitize « pause », réactions naturelles/off, bt709. `[UX-13,14,23]`
- **E70** — **Référence Imany officielle en place** (femme métisse, taches de rousseur, yeux dorés). `[CTX]`

## M. MÉTHODE (gouvernance — pour Claude)

- **E71** — **Maquette d'abord** : toute modif d'UI/flux présentée en maquette → Etoile choisit → on implémente. `[CTX]`
- **E72** — **Mono-session d'écriture** ; filet (backups, node --check, régressions, smoke) ; petits commits. `[CTX]`
- **E73** — **Fidélité test → prod** : ce qui est validé en test sort à l'identique. `[CTX]`

## O. QUALITÉ VISUELLE & IDENTITÉ DES PERSONNAGES — 🔴 PRIORITÉ CRITIQUE (ajout 2026-06-09)

> Déclenché par l'artefact « poil au torse » (analyse : `docs/RAPPORT_DETAILLE.md` §Audit identité & artefacts).
> **Catégorie CRITIQUE.** Un **contrôle qualité d'identité est OBLIGATOIRE avant la validation finale**
> de toute génération image/vidéo. Chaque test ci-dessous = une exigence tracée, à passer sur l'**image
> source (Seedream) ET la vidéo finale**. Tant que ces contrôles ne sont pas effectués **et validés par
> Etoile**, aucune génération n'est « conforme » (cf. E91 — GATE bloquant).

- **E74** — **Visage conservé** : identité fidèle à la référence Imany (traits, forme du visage). `[Etoile 09/06]`
- **E75** — **Couleur de peau conservée** (carnation métisse, pas de dérive). `[Etoile 09/06]`
- **E76** — **Texture de peau conservée et plausible** : pores/taches de rousseur OK, **mais aucune texture parasite** (ni poil, ni rugosité anormale). `[Etoile 09/06]`
- **E77** — **Cheveux conservés** (couleur, longueur, implantation ; pas de mèche/accessoire fantôme). `[Etoile 09/06]`
- **E78** — **Regard / yeux conservés** (yeux dorés, direction du regard cohérente). `[Etoile 09/06]`
- **E79** — **Vêtements conservés** (tenue cohérente, pas de déformation/fusion du tissu). `[Etoile 09/06]`
- **E80** — **Bijoux conservés** (pas de doublon, pas de bijou fantôme/déformé). `[Etoile 09/06]`
- **E81** — **AUCUN élément parasite** : pas de **poils** (body/chest hair), pas de **doigts/membres supplémentaires**, pas de **mains déformées**, pas d'**accessoires fantômes**, aucune déformation anatomique. `[Etoile 09/06]`
- **E82** — **Contrôle qualité identité+anatomie systématique** sur chaque génération, aux étapes : **image source (Seedream)** · **génération vidéo (lipsync Kling)** · **prompt** · **upscale** · **cohérence d'identité** (vs référence). `[Etoile 09/06]`
- **E83** — **Négatif anti-artefacts dans le prompt** (parade i, à valider Etoile) : `body hair, chest hair, hairy chest, extra fingers, deformed hands, extra limbs, ghost accessories, duplicated jewelry, mutated anatomy` + adoucir « MAXIMUM skin texture / chest neck unevenness » qui favorise l'artefact. `[Etoile 09/06]`
- **E84** — **Contrôle qualité post-génération automatisable** (parade ii, à étudier) : détection visage/anomalies sur l'image source avant de dépenser la vidéo (ex. Apple Vision en local, ou comparaison d'embedding à la référence). `[Etoile 09/06]`
- **E85** — **Anatomie cohérente** : proportions correctes, mains/doigts/membres corrects, pas de fusion ni de membre en trop. `[Etoile 09/06]`
- **E86** — **Aucune déformation du visage** (traits non tordus/fondus, symétrie plausible). `[Etoile 09/06]`
- **E87** — **Aucun changement d'âge** (la personne ne paraît ni rajeunie ni vieillie). `[Etoile 09/06]`
- **E88** — **Aucun changement d'ethnie** (origine/carnation/traits ethniques conservés — métisse). `[Etoile 09/06]`
- **E89** — **Aucun changement de morphologie** (silhouette, corpulence, taille de poitrine/épaules conservées). `[Etoile 09/06]`

### Process & gate (bloquants)
- **E90** — **[PROCESS] Attribution de l'étape responsable + preuve visuelle AVANT correctif** : pour CHAQUE défaut détecté, déterminer l'étape responsable parmi **{image source · génération vidéo · lipsync · upscale · rendu final}** et **fournir une preuve visuelle (frames/montage) de cette étape** avant toute correction. (Règle de process, démontrée sur « poil au torse ».) `[Etoile 09/06]`
- **E91** — **[GATE] Validation finale bloquante** : aucune génération n'est marquée « conforme » tant que les contrôles d'identité (E74–E89) ne sont **pas effectués ET validés par Etoile**. Exigence bloquante de la chaîne. `[Etoile 09/06]`

---

_Total : 91 exigences (E1–E91). Section O (E74–E91) = QUALITÉ VISUELLE & IDENTITÉ, priorité critique._
_Sert de colonne de traçabilité à `docs/AUDIT_COMPLET.md` et `docs/RAPPORT_DETAILLE.md`._

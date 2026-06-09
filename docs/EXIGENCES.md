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
- **E68** — ~~**Couleur V5** appliquée fidèlement à la vraie vidéo.~~ **⛔ SUPERSEDÉ par [[E97]] (Etoile 09/06)** : après le 1ᵉʳ test réel, Etoile **ne veut plus** d'étalonnage V5 (chaud/contrasté) **par défaut** ; la vidéo doit rester **fidèle à la source**, étalonnage uniquement via preset volontaire. `[CTX][UX-12 → remplacé par E97]`
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
- **E92** — **[GATE BLOQUANT — PRIORITÉ CRITIQUE n°1] QC identité/anatomie sur l'IMAGE SOURCE, AVANT toute génération vidéo payante.** `[Etoile 09/06]`
  - **Placement** : après génération de l'**image source** (mode éco, peu coûteux) et **AVANT** le lipsync payant (Kling). Le lipsync **ne peut pas démarrer** sans passage du gate.
  - **Écran QC** (dans le cockpit) : affiche l'**image source** + **checklist** : poils parasites · doigts/mains/membres (supplémentaires/déformés) · accessoires fantômes · déformation du visage · changement d'âge · changement d'ethnie · changement de morphologie · cohérence visage / peau / cheveux / regard (vs référence Imany).
  - **Si anomalie** → la vidéo est **bloquée** ; 3 actions proposées : **🔄 Régénérer l'image** · **🎨 Éditer l'image** · **✅ Valider manuellement malgré l'alerte** (décision explicite d'Etoile tracée).
  - **Niveau (a) — GATE humain minimal = EXIGENCE BLOQUANTE** : stop obligatoire + checklist + 3 boutons ; validation explicite **avant tout paiement**. Simple, fiable, faisable sans coût.
  - **Niveau (b) — détection AUTOMATIQUE (vision) = BONUS** (non bloquant) : pré-coche/alerte les anomalies. Options & limites : **Claude vision** = précis mais **coûte des crédits Anthropic** à chaque image ; **alternative locale à étudier** (Apple Vision `VNDetectFaceLandmarks`/`VNDetectHumanRectangles`, comparaison d'embedding visage vs `imany_reference.png`) = gratuit local mais détecte surtout visage/landmarks, **moins fiable** pour poils/accessoires fantômes. (b) **complète** (a), ne la remplace pas.
  - Relations : précise/renforce E82 (QC systématique), E84 (QC auto), E91 (gate final) en imposant le **gate au point économiquement critique** (avant la dépense lipsync).

## P. PROJET UNIQUE · STOCKAGE · TEST/PROD · VALIDATION — 🔴 PRIORITÉ CRITIQUE (ajout 2026-06-09)

> Objectif global : retrouver **instantanément, même des mois/années plus tard**, l'intégralité d'une
> génération (raws, versions intermédiaires, prompts, paramètres, coûts, logs, métadonnées), en
> distinguant **TEST** et **PRODUCTION**. Remplace/complète E55–E56 (projet réouvrable) qui deviennent
> cette spec complète.

- **E93** — **DOSSIER/PROJET UNIQUE COMPLET PAR GÉNÉRATION.** À chaque génération, créer **automatiquement** un projet unique regroupant TOUT. `[Etoile 09/06]`
  - **E93.1 Contenu** : look utilisé · décor utilisé · **prompt image · prompt vidéo · prompt lipsync** · script · audio · **image source** · variantes générées · image validée · **raw lipsync** · **raw vidéo (avant montage)** · version montée · version sous-titrée · version zoomée · version exportée · version finale · légendes.
  - **E93.2 Métadonnées + logs + rapport qualité** : date, heure, **coût, crédits consommés**, durée de génération, moteur utilisé, paramètres, **état de validation**, historique des modifications, **LOGS** de génération, **RAPPORT QUALITÉ** (résultat du QC identité).
  - **E93.3 Historique PAR PROJET** (plus par fichiers isolés) : un clic sur une génération montre toute la chaîne **Look→Décor→Prompts→Images→Audio→Raw Lipsync→Raw Vidéo→Montage→Sous-titres→Finale→Légendes**. Aucun fichier intermédiaire perdu/caché.
  - **E93.4 Actions** : ouvrir · rééditer · réutiliser · dupliquer · relancer · **télécharger tous les fichiers** · exporter le projet · archiver · restaurer.
  - **E93.5 RAWS OBLIGATOIRES conservés durablement, JAMAIS écrasés** : raw image · raw lipsync · raw vidéo · version **avant sous-titres** · **avant zoom** · **avant montage**.
  - **E93.6 But audit/debug** : retrouver **Image source → Raw Lipsync → Raw Vidéo → Finale** pour identifier l'étape d'un artefact (exactement la démonstration « poil au torse »).
  - **E93.7 Modèle réutilisable** : un projet peut servir de **modèle** ; à la réutilisation, **choisir quoi conserver** (look / décor / prompts / script / paramètres vidéo) ou seulement certains.
  - **E93.8 GATE** : une génération n'est **« terminée »** que si **tout est regroupé** dans ce projet unique, **réutilisable, rééditable, traçable**.
- **E94** — **STOCKAGE CLOUD & ARCHIVAGE PERMANENT.** Chaque projet auto-sauvegardé dans un stockage cloud persistant (pas seulement la base locale) : zéro perte, archivage long terme, sauvegarde auto, récupération facile, réédition, audit, réutilisation. `[Etoile 09/06]`
  - **État réel** : sorties déjà sur **iCloud Drive** (`podcast-outputs`) = persistance cloud de base ✅ ; **MAIS** `tmpfiles.org` (uploads temporaires **publics/éphémères** pour Kling) = risque (cf. E59) → à **remplacer par un stockage privé persistant**.
  - **Options (à étudier, sans coder)** : (a) **formaliser iCloud** comme store officiel + dossiers structurés (simple, déjà en place, mais pas de redondance ni d'API d'audit) ; (b) **cloud indépendant** (S3 / Backblaze B2 / Google Drive API) pour **redondance + URLs privées signées** remplaçant tmpfiles (robuste/auditable, mais coût + intégration). (a) immédiat, (b) cible long terme.
- **E95** — **SÉPARATION TEST / PRODUCTION.** Deux espaces distincts. `[Etoile 09/06]`
  - **TEST** = essais techniques / prompts / QC / expérimentations — identifiables immédiatement, comparables, supprimables/archivables.
  - **PRODUCTION** = vidéos finales **validées**, prêtes à publier.
  - **Promotion TEST → PRODUCTION sans perte de données.**
  - **État** : `ready_to_post/` + `a_retravailler/` existent **partiellement** → à structurer en `TEST/` et `PRODUCTION/`.
- **E96** — **WORKFLOW DE VALIDATION QUALITÉ.** Une génération **ne passe PAS automatiquement** en PRODUCTION. Flux obligatoire : **TEST → CONTRÔLE QUALITÉ (gate identité E91/E92) → VALIDATION humaine (Etoile) → PRODUCTION**. Conserver l'**historique complet de validation** (qui / quand / verdict). `[Etoile 09/06]`

## Q. RETOURS 1ᵉʳ TEST RÉEL (Etoile 09/06) — à intégrer AVANT les corrections critiques

- **E97** — **COLORIMÉTRIE : fidélité à la source par défaut.** Par défaut la vidéo finale doit rester **fidèle à l'image source** (la source = référence absolue) ; **supprimer l'étalonnage chaud/contrasté par défaut**. Un étalonnage ne s'applique **que** s'il est choisi volontairement via un **preset enregistré**. `[Etoile 09/06]`
  - _Note technique_ : `color_style.js` (V5) est **verrouillé** mais **n'est PAS câblé** au rendu local ; le grade par défaut vient de `render_local.js` `FX_DEFAULT.image` (`:73`) → la correction porte sur le **branchement** (défaut neutre), **sans toucher** au fichier verrouillé.
  - **Remplace [[E68]]** (« couleur V5 par défaut ») qui est désormais **supersedé** : V5 ne doit plus être appliqué automatiquement.
- **E98** — **SCRIPT sans « pause ».** Le mot/marqueur « pause » (ni `[pause]`, ni `(pause)`, ni `PAUSE`, ni le mot nu) ne doit **jamais apparaître dans le script généré** ni être prononcé. Les pauses = créées **naturellement** dans l'audio (ponctuation / SSML), invisibles dans le texte. `[Etoile 09/06]`
- **E99** — **RÉACTIONS : paramètre explicite, défaut OFF.** Toggle OFF/ON, **défaut OFF**, rien d'ajouté automatiquement. `[Etoile 09/06]`
- **E100** — **RÉFÉRENCE PERSONNAGE depuis le cockpit** : voir la référence active · uploader · choisir dans la bibliothèque · changer · **VERROUILLER** · **définir par défaut**. `[Etoile 09/06]`
- **E101** — **BIBLIOTHÈQUE DE RÉFÉRENCES** : aperçu · nom · **tags** · **recherche** · **filtres** · historique · réutilisation. `[Etoile 09/06]`
- **E102** — **NON-RÉUTILISATION AUTO DES PARAMÈTRES.** Chaque génération repart d'un **état PROPRE** ; aucun paramètre d'une génération précédente réappliqué automatiquement (**couleur, effets, zoom, réactions, paramètres vidéo, paramètres audio, référence personnage, durée, modèle**) **SAUF** s'il est enregistré comme **preset/défaut** explicite. `[Etoile 09/06]`
- **E103** — **[PROCESS] RÈGLE DE PRIORITÉ** : intégrer ces 7 retours (E97–E102) **d'abord**, puis les corrections critiques dans l'ordre du plan (E92 gate → E93–E96 projet/stockage/test-prod/validation → reste). `[Etoile 09/06]`

## S. ACCUEIL / COCKPIT — UX (ajout 2026-06-09)

- **E104** — **COCKPIT À 4 POINTS D'ENTRÉE VISIBLES EN PERMANENCE** (pas dans un menu déroulant). L'accueil affiche **4 boutons d'accès direct** : **📸 PHOTO · 🎬 VIDÉO · 🏛 STUDIO · 🕘 RÉCENTS**. `[Etoile 09/06]`
  - **📸 PHOTO** → looks · décors · prompts · images · génération photo.
  - **🎬 VIDÉO** → vidéos · scripts · légendes · montage · génération vidéo.
  - **🏛 STUDIO** → bibliothèque de travail centralisée (looks · décors · références · médias · projets · ressources réutilisables).
  - **🕘 RÉCENTS** → derniers projets · générations · looks · vidéos · actions.
  - **Objectif** : réduire les clics, **zéro menu déroulant pour les fonctions principales** (1 clic depuis l'accueil). Renforce [[E1]]/[[E2]] (cockpit 2 sections) et [[E62]] (pilotage visible).
- **E105** — **[RÈGLE DIRECTRICE — NON NÉGOCIABLE] BLOCS FONCTIONNELS UNIQUES & FRONTIÈRES CLAIRES.** Chaque bouton principal d'accueil = **UN bloc fonctionnel unique, complet, stable, délimité** — **PAS** un raccourci vers des menus dispersés. Même logique à l'intérieur : **aucun sous-menu qui renvoie vers plusieurs zones** ; chaque sous-menu = **une responsabilité unique**. `[Etoile 09/06]`
  - **Règle d'or** : « **une fonction = un emplacement · un contenu = un propriétaire · une action = un point d'entrée principal** ».
  - **Arbitrage** : ce principe **tranche tous les conflits/doublons** (cf. matrice de propriété `docs/ARCHITECTURE_4SECTIONS.md`). Préférence : **rigueur + frontières nettes** plutôt que flexibilité confuse.
  - **Périmètres** : **📸 PHOTO** = bloc unique workflow photo · **🎬 VIDÉO** = bloc unique workflow vidéo · **🏛 STUDIO** = bloc unique ressources/références/bibliothèques/réutilisables · **🕘 RÉCENTS** = bloc unique reprise du travail récent.
  - Gouverne [[E104]] (4 entrées), [[E1]]/[[E2]] (cockpit), et le nettoyage des doublons/legacy.
- **E106** — **[RÈGLE DIRECTRICE DE CONCEPTION] ARCHITECTURE MODULAIRE & ÉVOLUTIVE.** Même avec des blocs uniques et fixes ([[E105]]), la structure reste **modulaire** : on doit pouvoir **ajouter / retirer / modifier un sous-menu plus tard SANS casser l'architecture globale**. `[Etoile 09/06]`
  - **Squelette cible** : un bloc principal = une responsabilité claire ; un sous-menu = un bloc unique **rattaché à son parent** ; chaque bloc **ajoutable / retirable / modifiable proprement (isolé)** ; **aucune fonction dupliquée inutilement**, chaque contenu a un propriétaire clair.
  - **Objectif** : **séparé + relié + évolutif**.
  - **Pattern d'implémentation visé** (cf. `docs/ARCHITECTURE_4SECTIONS.md` §Squelette modulaire) : **registre de blocs** (chaque bloc déclaré : `id`, `parent`, `titre`, `handler`, `boutons`) + **routeur central** → ajouter/retirer un sous-menu = ajouter/retirer **une entrée du registre**, sans toucher au reste.
  - **À respecter pendant** le LOT ACCUEIL/NAV ([[E104]]) **et** les CRUD looks/décors/références ([[E15]]–[[E26]], [[E100]]–[[E101]]) pour qu'ils soient des **modules propres**.
- **E107** — **[DETTE TECHNIQUE PRIORITAIRE MAIS CONTRÔLÉE] REFACTORISATION PROGRESSIVE (strangler-fig).** Sortir du monolithe `telegram_bot.js` **sans réécriture brutale** : registre+routeur posés à côté de l'ancien dispatch, **migration d'un bloc à la fois**, tests après chaque déplacement, **suppression de l'ancien code UNIQUEMENT après validation d'Etoile** du bloc migré. `[Etoile 09/06]`
  - **Méthode** : strangler-fig (l'ancien `if(d===…)` reste tant qu'un bloc n'est pas migré et validé) ; un seul bloc en cours à la fois ; filet habituel (backups, mono-session, `node --check`, régressions, smoke, petits commits, preuve).
  - **Critère « bloc migré OK »** : tous ses écrans rendus par le routeur, tous ses callbacks via le registre, **aucun global atteint en direct** (via `ctx`), régressions vertes, smoke `/go`/`/menu` vert, **validation visuelle d'Etoile**.
  - **Plan détaillé** (8 étapes, recensement, dépendances dangereuses, ordre de migration) : `docs/ARCHITECTURE_4SECTIONS.md` §Plan de refactorisation progressif.

---

_Total : 107 exigences (E1–E107). Sections O (E74–E92) + P (E93–E96) + Q (E97–E103) + S (E104–E107) = QUALITÉ, PROJET, TRAÇABILITÉ, FIDÉLITÉ, UX, ARCHITECTURE, DETTE — priorité critique/élevée._
_Sert de colonne de traçabilité à `docs/AUDIT_COMPLET.md` et `docs/RAPPORT_DETAILLE.md`._

---

## R. CHECKLIST DE TESTS DE VALIDATION (à passer à chaque génération / chaque correctif)

> ☐ = test à exécuter ; chaque ligne renvoie à son exigence. Une génération n'est « conforme » que si tous les ☐ critiques passent (cf. E91/E92 gate, E96 workflow).

**Fidélité visuelle & rendu**
- ☐ **Colorimétrie** : la vidéo finale est **fidèle à la source** (pas de virage chaud/contrasté par défaut) ; un grade n'apparaît que si un preset est appliqué volontairement. `(E97 ; remplace E68)`
- ☐ **Stills** : image fixe montrée entière 9:16, sans sur-zoom ni grading. `(E39)`
- ☐ **Sous-titres** 76px / OY 0.370, son −14 LUFS, bt709. `(E67, E69)`

**Script & audio**
- ☐ **Aucun « pause »** (ni `[pause]`, `(pause)`, `PAUSE`, mot nu) dans le script affiché/exporté ; pauses naturelles dans l'audio. `(E98)`
- ☐ **Réactions** : défaut **OFF**, rien ajouté automatiquement (toggle explicite). `(E99)`
- ☐ Script affiché & éditable avant toute dépense ; anti-répétition des sujets. `(E46, E47)`

**Identité & anatomie (QC source ET vidéo)**
- ☐ Visage / couleur peau / texture / cheveux / regard / vêtements / bijoux **conservés** vs référence. `(E74–E80)`
- ☐ **Aucun élément parasite** : poils, doigts/mains/membres en trop ou déformés, accessoires fantômes. `(E81, E85)`
- ☐ Aucune déformation du visage / changement d'âge / d'ethnie / de morphologie. `(E86–E89)`
- ☐ **GATE QC sur l'image SOURCE avant le lipsync payant** (régénérer / éditer / valider). `(E92)`
- ☐ **GATE de validation finale** par Etoile avant « conforme ». `(E91, E96)`

**Référence personnage**
- ☐ Depuis le cockpit : voir l'active · uploader · choisir · changer · **verrouiller** · **définir par défaut**. `(E100)`
- ☐ Bibliothèque de références : aperçu · nom · **tags · recherche · filtres** · historique · réutilisation. `(E101)`

**État propre & traçabilité**
- ☐ **État PROPRE** : aucune génération ne réapplique automatiquement couleur/effets/zoom/réactions/params vidéo/params audio/référence/durée/modèle (sauf preset/défaut explicite). `(E102)`
- ☐ **Projet unique complet** créé : raws (image/lipsync/vidéo) + versions intermédiaires + prompts + métadonnées (coût/crédits/durée/moteur) + logs + rapport QC, retrouvable et réutilisable. `(E93)`
- ☐ Espace **TEST vs PRODUCTION** correct ; promotion uniquement après validation. `(E95, E96)`
- ☐ Sauvegarde **cloud persistante** (pas de média laissé sur tmpfiles). `(E94, E59)`

**Coûts**
- ☐ Récap coût + crédits + temps + bouton 💲 **avant** toute dépense ; éco d'abord ; maquette avant Kling. `(E10–E13)`

**Régressions techniques (à chaque correctif de code)**
- ☐ `node --check` OK · régressions `nodup 16 / feedback 15 / gallery 7 / nbphotos 7 / stalefix 8` · smoke `/go` `/menu`. `(E72)`

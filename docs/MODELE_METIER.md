# MODÈLE MÉTIER — modèle de domaine pur

> **Statut : ANALYSE / MODÉLISATION (aucune implémentation, aucune représentation).** Ce document définit
> les **objets du domaine** *avant* toute forme. Il décrit **ce qui existe et pourquoi**, **pas comment on
> le manipule**. Aucune notion de support, de présentation ou de manipulation n'y figure : uniquement des
> **objets**, leurs **attributs**, leurs **relations**, leurs **cycles de vie**, les **actions métier**
> et les **règles**. Live intact · fichiers verrouillés intacts · aucune dépense.
>
> **Ancrage (référence absolue, `E127`) — les 6 piliers** : ① Intention · ② Cohérence · ③ Mémoire ·
> ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.
>
> **Phrase centrale** : « Je pilote la transformation d'une **intention** en contenu **publiable**, par une
> suite de décisions **cohérentes, réversibles et mémorisées**, dans un système en qui j'ai **confiance** —
> jusqu'au seul acte définitif : **publier**. »
>
> **Précision structurante** : le système pose en permanence la question « **ce qui est produit sert-il
> encore l'intention ?** » ; quand quelque chose s'écarte, il **localise la pièce qui dérive** et **rend
> l'écart visible** — il **ne décide jamais** à la place de la personne.
>
> Convention : *(à confirmer)* signale une vraie décision de modélisation laissée ouverte (E120), avec un
> défaut proposé et sa raison. Le manifest technique existant sert de **base factuelle** (ce qui est déjà
> capté) ; ce document en exprime un **modèle de domaine propre**, pas le code.

---

## VUE D'ENSEMBLE — les 4 familles d'objets

1. **Famille INTENTION (le pourquoi)** — Intention, Message, Émotion, Public, Objectif de publication.
2. **Famille IDENTITÉ & MATIÈRE CRÉATIVE (le quoi/qui/où/comment)** — Personnage, Référence, Look, Décor,
   Ambiance, Consigne de génération, Script, Voix, Paramètres.
3. **Famille PRODUCTION & ÉTATS DU MÉDIA (ce qui est fabriqué)** — Candidate, Variante, Média actif,
   Média intermédiaire/RAW, Montage, Légende, Hashtags, Contrôle qualité, Coût, Livrable, Version,
   Publication.
4. **Famille MÉMOIRE & CAPITALISATION (la traçabilité et la réutilisation)** — Projet, Série, Décision,
   Évaluation de cohérence, Historique, Bibliothèque, Brique réutilisable.

---

# PHASE 1 — INVENTAIRE EXHAUSTIF DES OBJETS

> Pour chaque objet : **Rôle · Pourquoi il existe · Contient (attributs) · Ce qui le différencie.**

## Famille INTENTION

### 1. Intention — *la boussole*
- **Rôle** : exprime la finalité d'un projet de contenu : *quoi dire, pour quoi ressentir, à qui, pour
  quelle destination*.
- **Pourquoi** : pilier ① ; c'est la **référence à laquelle tout le reste doit se comparer**. Sans elle,
  la question centrale est impossible à poser.
- **Contient** : `message` (idée portée), `émotion` (effet recherché), `personnage_visé` (lien vers
  Personnage), `public`, `objectif_publication` (lien vers Objectif), `créée_le`, `modifiée_le`.
- **Différenciation** : l'Intention est le **pourquoi** ; le Personnage est le **qui** ; la Référence/Look/
  Décor sont des **moyens visuels**. L'Intention est **propre à un projet** (elle peut se répéter dans une
  Série mais reste rattachée à chaque projet).

### 2. Message (ou Idée) — *le contenu de sens*
- **Rôle** : la chose précise à transmettre (l'angle, le propos).
- **Pourquoi** : pilier ① ; c'est l'une des 10 pièces surveillées pour la dérive.
- **Contient** : `texte_court`, `angle`, `mots_clés`.
- **Différenciation** : le Message est le **fond** ; le Script en est la **mise en mots déroulée** ; la
  Légende en est la **formulation de publication**.
- *(à confirmer)* **Défaut proposé : Message = attribut riche de l'Intention** (pas un objet autonome),
  car il n'a de sens que porté par une intention. *Raison* : éviter un objet flottant. *À confirmer* car on
  pourrait vouloir réutiliser un Message d'un projet à l'autre (alors il deviendrait une Brique).

### 3. Émotion — *l'effet visé*
- **Rôle** : la tonalité affective recherchée (douceur, puissance, humour, luxe…).
- **Pourquoi** : pilier ① + ② ; sert de critère de cohérence (le ton du script/voix/montage doit la servir).
- **Contient** : `valeur` (libellé), éventuellement `intensité`.
- **Différenciation** : l'Émotion est **ce qu'on veut faire ressentir** ; l'Ambiance est **le moyen
  visuel/sonore** d'y parvenir. Elles peuvent diverger (et alors la cohérence le signale).
- *(à confirmer)* **Défaut : Émotion = attribut de l'Intention** (surveillé par la cohérence).

### 4. Public — *le destinataire*
- **Rôle** : à qui s'adresse le contenu.
- **Pourquoi** : pilier ① ; oriente message, ton, format.
- **Contient** : `description`, éventuellement `plateforme_habituelle`.
- **Différenciation** : le Public est **le destinataire** ; l'Objectif est **la destination technique**.
- *(à confirmer)* **Défaut : Public = attribut de l'Intention.**

### 5. Objectif de publication (Destination) — *où et sous quelle contrainte*
- **Rôle** : la cible de diffusion et ses contraintes : plateforme, format, durée visée.
- **Pourquoi** : pilier ① ; fixe des **contraintes mesurables** (donc des dérives détectables : durée >
  format, ratio non conforme).
- **Contient** : `plateforme`, `format` (ratio), `durée_cible`, `intention_finale` (publier / éprouver).
- **Différenciation** : l'Objectif porte les **contraintes de diffusion** ; les Paramètres portent les
  **réglages de fabrication**. L'un est *le but*, l'autre *le moyen technique*.
- *(à confirmer)* **Défaut : Plateforme/Format/Durée = attributs de l'Objectif**, lui-même attribut
  composé de l'Intention. *Raison* : ils ne vivent jamais seuls. *À confirmer* : la **Plateforme** pourrait
  mériter le statut d'objet de Bibliothèque (profils de contraintes réutilisables : « Reel 9:16 ≤ 30 s »).

## Famille IDENTITÉ & MATIÈRE CRÉATIVE

### 6. Personnage — *l'identité durable*
- **Rôle** : l'entité incarnée qui porte les contenus (p. ex. l'influenceuse).
- **Pourquoi** : piliers ① + ④ ; le Personnage est **transverse** aux projets et **capitalisable**.
- **Contient** : `nom`, `traits_identitaires` (description stable), `références` (collection d'images de
  référence), `garde-robe` (collection de Looks réutilisables), `voix_signature` *(à confirmer)*.
- **Différenciation** : le Personnage est **qui** ; l'Intention est **pourquoi** ; la Référence est **une
  preuve visuelle** de l'identité du Personnage à un instant.
- *(à confirmer)* **Défaut : le Personnage POSSÈDE ses Références et une garde-robe de Looks** (réutilisables
  par tout projet qui l'emploie). *Raison* : un Look « robe rouge sur Imany » a du sens rattaché au
  Personnage. *À confirmer* : certains Looks pourraient être génériques (non liés à un Personnage) et vivre
  seulement en Bibliothèque.

### 7. Référence — *la preuve d'identité visuelle*
- **Rôle** : image(s) faisant foi de l'identité du Personnage (visage, carnation, regard…).
- **Pourquoi** : piliers ② + ⑤ ; sert d'**étalon** au contrôle d'identité (la production doit y rester
  fidèle).
- **Contient** : `image`, `libellé`, `verrou`, `historique`, `personnage` (lien).
- **Différenciation** : la Référence répond à « **est-ce bien la même personne ?** ». Le Look répond à
  « **comment est-elle présentée ?** ». La Référence est **stable** ; le Look est **variable**.

### 8. Look — *l'apparence choisie*
- **Rôle** : la tenue / coiffure / style d'apparence pour une production.
- **Pourquoi** : piliers ② + ④ ; capitalisable, surveillé pour cohérence avec l'intention/émotion.
- **Contient** : `libellé`, `description`, `image_de_référence`, `verrou`, `historique`, `personnage`
  *(via garde-robe, à confirmer)*.
- **Différenciation** : Look = **vêtir/styliser le Personnage** ; Décor = **le lieu** ; Ambiance =
  **l'atmosphère** ; Référence = **l'identité**. Le Look n'est PAS le Personnage (on change de look sans
  changer d'identité).

### 9. Décor — *le lieu / l'arrière-plan*
- **Rôle** : l'environnement où se situe la scène (studio, extérieur jour, bougies…).
- **Pourquoi** : piliers ② + ④ ; capitalisable, surveillé pour cohérence.
- **Contient** : `libellé`, `description`, `image_de_référence`, `verrou`, `historique`.
- **Différenciation** : Décor = **où** (lieu concret) ; Ambiance = **quelle tonalité** (lumière, humeur).
  Un même Décor peut porter plusieurs Ambiances (studio « froid clinique » vs studio « chaud intime »).

### 10. Ambiance — *la tonalité visuelle/sonore*
- **Rôle** : l'atmosphère recherchée (lumière, couleur, mood) — le **moyen** de produire l'Émotion.
- **Pourquoi** : pilier ② ; pièce de cohérence (l'ambiance doit servir l'émotion visée).
- **Contient** : `libellé`, `lumière`, `palette`, `tonalité`.
- **Différenciation** : Émotion = **but ressenti** ; Ambiance = **moyen visuel/sonore**.
- *(à confirmer)* **Défaut proposé : Ambiance = OBJET léger distinct** (du Décor et des Paramètres).
  *Raison* : Etoile la liste explicitement comme distincte de Référence/Look/Décor/Paramètres, et une même
  ambiance se réutilise sur des décors différents. *À confirmer* : si elle est toujours indissociable du
  Décor en pratique, elle pourrait redevenir un **attribut du Décor**.

### 11. Consigne de génération (Prompt) — *l'instruction de fabrication*
- **Rôle** : le texte d'instruction qui guide la production d'un média (image / animation / synchronisation).
- **Pourquoi** : piliers ④ + ⑤ ; réutilisable, et son effet doit être explicite (contrat).
- **Contient** : `rôle` (image / vidéo / synchro labiale), `nom`, `texte`, `négatif` (anti-artefacts),
  `verrou`, `historique`.
- **Différenciation** : la Consigne est **comment on demande la fabrication** ; le Script est **le contenu
  parlé** ; le Message est **le sens**. Une consigne sert un Look/Décor/Ambiance, pas l'inverse.

### 12. Script — *le déroulé parlé*
- **Rôle** : le texte qui sera dit (dialogue / voix off).
- **Pourquoi** : piliers ① + ② ; porte le Message, surveillé pour cohérence d'émotion et de durée.
- **Contient** : `texte`, `durée_estimée`, `hooks` (variantes d'accroche) *(à confirmer)*, `version`.
- **Différenciation** : Script = **mots prononcés** ; Légende = **texte d'accompagnement de publication**
  (non prononcé) ; Message = **idée** sous-jacente.
- **Règle de domaine** : le Script ne contient **aucune marque technique** (p. ex. mot « pause ») ; les
  silences relèvent de la Voix.

### 13. Voix — *l'incarnation sonore du script*
- **Rôle** : la synthèse/interprétation vocale du Script.
- **Pourquoi** : pilier ② ; pièce de cohérence (le grain/ton de voix doit servir l'émotion).
- **Contient** : `script_source` (lien), `paramètres_voix` (timbre, rythme, silences), `média_audio`,
  `réactions` (défaut : aucune).
- **Différenciation** : la Voix **interprète** le Script ; elle n'en modifie pas le texte.

### 14. Paramètres — *les réglages de fabrication (le « comment » technique)*
- **Rôle** : réglages de production propres au projet (nombre d'images à produire, format, durée,
  retouches d'image, recadrage, options de rendu).
- **Pourquoi** : pilier ⑤ + ⑥ ; explicites, réversibles, **étanches** (propres au projet).
- **Contient** : `nombre_images`, `mode` (éco/haute qualité), `format`, `durée`, `retouches_image`,
  `recadrage`, `options_rendu`, `surcharge_sous-titres` (propre au projet).
- **Différenciation** : Paramètres = **le COMMENT technique** ; Objectif = **le but de diffusion** ;
  Ambiance/Look/Décor = **le QUOI créatif**. Les Paramètres ne portent **aucune intention de sens**.
- **Règle de domaine (étanchéité)** : les Paramètres d'un projet **ne se propagent jamais** à un autre
  projet (pilier ⑤). La réutilisation se fait **uniquement** par Brique explicite.

## Famille PRODUCTION & ÉTATS DU MÉDIA

> **Distinction centrale (les 5 états d'un média visuel)** : *Candidate → Variante → Média actif → Livrable*,
> et, sur un autre axe, *Version* (instantané du projet). Ce sont des **états/rôles différents**, pas des
> copies.

### 15. Candidate (Image produite) — *le brut non jugé*
- **Rôle** : un média fraîchement produit, **pas encore évalué**.
- **Pourquoi** : pilier ⑥ ; rien n'est retenu sans décision.
- **Contient** : `média`, `consigne_source`, `produite_le`, `coût_associé`.
- **Différenciation** : Candidate = **produite, pas choisie**. Tant qu'aucune décision n'est prise, elle
  n'est ni active, ni variante, ni livrable.

### 16. Variante — *l'alternative conservée volontairement*
- **Rôle** : une candidate **gardée comme option** sans être l'option principale.
- **Pourquoi** : piliers ⑥ + ③ ; permet de comparer, revenir, réactiver.
- **Contient** : `média`, `origine` (candidate / dérivée d'une autre), `raison_conservation` *(mémoire)*.
- **Différenciation** : Variante = **trace volontaire**, jamais automatiquement promue. Une Variante n'est
  **pas** un Livrable et n'est **pas** le Média actif tant qu'on ne l'a pas décidé.

### 17. Média actif — *le rôle de « source courante »*
- **Rôle** : **désignation** d'un unique média comme **source des étapes suivantes** du projet.
- **Pourquoi** : piliers ⑤ + ⑥ ; il faut une et une seule source courante, explicite.
- **Contient** : ce n'est **pas une copie** mais un **rôle** porté par une Candidate/Variante :
  `média_désigné` (lien), `désigné_le`.
- **Différenciation** : « Média actif » est un **rôle exclusif** (un seul à la fois), réassignable. Une
  Variante peut **devenir** média actif ; un média actif **reste** une candidate/variante par nature.

### 18. Média intermédiaire / RAW — *les états bruts conservés*
- **Rôle** : les productions brutes de chaque étape (image brute, synchro brute, vidéo avant montage,
  avant sous-titres, avant recadrage…).
- **Pourquoi** : piliers ③ + ⑥ ; **jamais écrasés**, ils permettent l'audit (« où est née une anomalie »)
  et le retour en arrière.
- **Contient** : `type_d'étape`, `média`, `produit_le`.
- **Différenciation** : le RAW est **la matière d'origine** ; le Montage/Livrable sont des **états aboutis**.
  Un RAW ne se remplace pas (règle de mémoire).

### 19. Montage — *l'assemblage temporel*
- **Rôle** : l'assemblage des plans / médias en une séquence rythmée (avec sous-titres, musique…).
- **Pourquoi** : piliers ② + ⑥ ; le **rythme** et l'enchaînement servent l'émotion/le message.
- **Contient** : `plans` (médias retenus dans l'ordre), `rythme` (cadence, durées par plan), `sous-titres`,
  `musique`, `version`.
- **Différenciation** : le Montage **organise** des médias existants ; il n'en crée pas. Le **Rythme** est
  un **attribut du Montage** *(à confirmer ; défaut : attribut)* — c'est néanmoins l'une des 10 pièces
  surveillées par la cohérence.

### 20. Légende — *le texte d'accompagnement de publication*
- **Rôle** : le texte publié à côté du média (forme courte + forme longue).
- **Pourquoi** : piliers ① + ② ; doit servir le message et le public ; pièce de cohérence.
- **Contient** : `forme_courte`, `forme_longue`, `version`.
- **Différenciation** : Légende ≠ Script (l'une est lue par le public, l'autre est prononcée). La Légende
  est **copiable sans le titre** (règle de forme métier).

### 21. Hashtags — *les marqueurs de diffusion*
- **Rôle** : mots-clés de diffusion rattachés à la publication.
- **Pourquoi** : pilier ① (sert l'objectif de diffusion).
- **Contient** : `liste`, `version`.
- **Différenciation** : objet **distinct de la Légende** *(à confirmer ; défaut : objet distinct mais
  toujours associé à un Livrable)* — *raison* : ils se gèrent/renouvellent séparément du texte.

### 22. Contrôle qualité (QC) — *le verdict d'aptitude*
- **Rôle** : l'évaluation d'identité/anatomie/cohérence d'un média **avant** une étape coûteuse, et la
  validation finale.
- **Pourquoi** : piliers ⑤ + ② ; garantit qu'on n'engage pas une dépense sur un média non conforme.
- **Contient** : `verdict` (conforme / alerte / forcé), `auteur`, `date`, `détails` (identité, cohérence,
  référence, look), `rapport` (historique des contrôles).
- **Différenciation** : le QC est un **jugement d'aptitude technique**, distinct de l'Évaluation de
  cohérence (qui mesure l'alignement à l'**intention**, pas la conformité anatomique). *(à confirmer : QC
  et Cohérence restent deux objets séparés — défaut : oui, axes différents.)*

### 23. Coût — *la mesure de dépense*
- **Rôle** : l'estimation et le relevé réel de ce que coûte une production (crédits, montant, temps).
- **Pourquoi** : piliers ⑤ + ① ; l'effet (dépense) doit être explicite avant l'action, et tracé après.
- **Contient** : `estimé` (avant), `réel` (après), `crédits`, `temps`, `détail`, `action_liée`.
- **Différenciation** : le Coût est une **mesure rattachée à une action de production**, pas un média.

### 24. Livrable — *le contenu validé pour diffusion*
- **Rôle** : un ensemble **explicitement validé** et **autonome**, prêt à être diffusé (média final +
  script + légendes + hashtags + paramètres + infos + RAW).
- **Pourquoi** : piliers ⑥ + ③ ; seul ce qui est validé entre ici ; tout y est pour diffuser sans
  reconstruire le contexte.
- **Contient** : `média_final`, `image(s)_source`, `script`, `légende_courte`, `légende_longue`,
  `hashtags`, `paramètres`, `infos_projet`, `coûts`, `RAW`, `version_source` (lien).
- **Différenciation** : un Livrable n'est **ni** une candidate **ni** une variante **ni** une version : c'est
  un **paquet validé et complet**. Aucun média non validé n'y figure jamais.

### 25. Version — *l'instantané restaurable du projet*
- **Rôle** : un **état figé du projet à un instant** (média + réglages + créatifs), restaurable.
- **Pourquoi** : piliers ⑥ + ③ ; permet de revenir exactement à un état antérieur sans perdre les autres.
- **Contient** : `identifiant`, `date`, `libellé`, `média_référencé`, `instantané_paramètres`,
  `instantané_créatif`, `raison_retenue` *(mémoire : pourquoi cette version)*.
- **Différenciation** : la Version est un **point de sauvegarde dans le temps** ; le Livrable est un
  **paquet de diffusion**. Restaurer une Version **ne supprime jamais** les autres.

### 26. Publication — *l'acte de diffusion (le seul définitif)*
- **Rôle** : l'événement par lequel un Livrable est diffusé sur une plateforme.
- **Pourquoi** : pilier ⑥ ; **seul acte irréversible** du domaine.
- **Contient** : `livrable_source` (lien), `plateforme`, `date`, `statut` (prêt-à-poster → publié),
  `identité_de_diffusion` *(à confirmer)*.
- **Différenciation** : la Publication est un **événement**, pas un média. **Prêt-à-poster** est un
  **état antérieur** (le Livrable est complet, en file d'attente), **distinct** de **Publié** (acte
  consommé). *(à confirmer : Prêt-à-poster = état du Livrable, pas objet séparé — défaut : état.)*

## Famille MÉMOIRE & CAPITALISATION

### 27. Projet — *l'unité de production*
- **Rôle** : le conteneur d'une transformation « une Intention → un ou des Livrables ».
- **Pourquoi** : piliers ① → ⑥ ; c'est **l'objet pivot** qui regroupe tout et garde la cohérence.
- **Contient** : `intention`, `personnage_employé`, créatifs liés (référence/look/décor/ambiance/consigne/
  script/voix), `paramètres`, médias (candidates/variantes/média actif/RAW/montage), `livrables`,
  `versions`, `décisions`, `coûts`, `QC`, `états` (avancement, diffusion), `créé_le`, `modifié_le`.
- **Différenciation** : le Projet **contient** ; la Série **regroupe des projets** ; l'Historique **relate**.
  Un Projet produit **image seule / vidéo seule / les deux** — jamais « projet image » vs « projet vidéo ».

### 28. Série — *le regroupement éditorial de projets*
- **Rôle** : relie plusieurs Projets partageant une ligne (même personnage, même format récurrent, même
  intention de fond).
- **Pourquoi** : piliers ④ + ③ ; capitalisation d'une ligne éditoriale, mémoire d'ensemble, cohérence
  inter-projets (anti-répétition de sujets).
- **Contient** : `nom`, `ligne_éditoriale`, `projets_membres`, `personnage` *(souvent commun)*,
  `règles_de_cohérence` (p. ex. ne pas répéter un sujet/look rapproché).
- **Différenciation** : Série = **conteneur de Projets**, pas un type de projet. *(à confirmer — défaut :
  conteneur. Raison : un projet garde son autonomie complète et peut exister hors série ; la série est une
  vue/regroupement par-dessus. À confirmer car on pourrait vouloir une série « moule » imposant des
  réglages — ce serait alors une Brique de configuration, pas un simple conteneur.)*

### 29. Décision — *le choix tracé avec sa raison*
- **Rôle** : enregistre un choix structurant **et son pourquoi** (garder un média, retenir une variante,
  assumer un écart de cohérence, changer un look, publier).
- **Pourquoi** : pilier ③ (cœur) ; rend le projet **relisible des mois après**.
- **Contient** : `date`, `objet_concerné`, `action`, `raison` (courte, optionnelle mais proposée),
  `auteur`.
- **Différenciation** : la Décision capte **le pourquoi** ; l'Historique capte **la chronologie** ; la
  Version capte **l'état**. La Décision est ce qui manque le plus aujourd'hui (le moteur trace l'action,
  pas la raison).

### 30. Évaluation de cohérence — *la lecture d'alignement à l'intention*
- **Rôle** : un **état dérivé** (non saisi) qui, pour chaque **pièce** du projet, indique si elle **sert
  encore l'intention** ou **signale une dérive**, avec le **pourquoi** du signal.
- **Pourquoi** : pilier ② (cœur) ; matérialise la question centrale.
- **Contient** : par pièce surveillée — `pièce` (parmi : **message · image · look · décor · voix · script ·
  montage · rythme · légende · publication**), `état` (alignée / à vérifier / non définie / **écart
  assumé**), `raison_du_signal`.
- **Différenciation** : l'Évaluation de cohérence **ne juge pas le goût** et **ne décide rien** : elle
  **signale et localise**. Elle se distingue du QC (aptitude technique). Un **écart assumé** est une
  Décision (mémoire) qui éteint le signal.

### 31. Historique — *la mémoire chronologique*
- **Rôle** : la trace ordonnée de tout ce qui s'est passé (projets, décisions, versions, productions).
- **Pourquoi** : piliers ③ + ⑥ ; mémoire permanente, base du retour en arrière et de l'audit.
- **Contient** : `entrées` chronologiques `{ date, objet, événement, raison? }`.
- **Différenciation** : l'Historique **relate** (consultation) ; la Bibliothèque **outille** (réutilisation).
  L'Historique **n'est pas** un stock séparé : c'est la mémoire **dérivée** du même ensemble de Projets.

### 32. Bibliothèque — *le catalogue de briques réutilisables*
- **Rôle** : rassemble les **Briques réutilisables** (Looks, Décors, Ambiances, Presets, Consignes, Styles
  de sous-titres, Enchaînements) disponibles pour tout Projet.
- **Pourquoi** : pilier ④ ; capitalisation transverse.
- **Contient** : collections de Briques, chacune avec sa **provenance**.
- **Différenciation** : la Bibliothèque est un **outil de réemploi transverse** ; l'Historique est une
  **mémoire chronologique**. Consulter la Bibliothèque ne modifie aucun projet ; en tirer une brique = une
  **copie explicite** (étanchéité).

### 33. Brique réutilisable (Preset / acquis promu) — *l'unité de capitalisation*
- **Rôle** : un acquis (Look, Décor, Ambiance, réglages = Preset, Consigne, Style de sous-titres,
  Enchaînement de montage) **promu** pour être réemployé.
- **Pourquoi** : pilier ④ ; transforme un succès ponctuel en actif réutilisable.
- **Contient** : `type`, `nom`, `contenu`, `provenance` (projet d'origine), `créée_le`.
- **Différenciation** : une Brique est **détachée d'un projet** et **réutilisable** ; un créatif « normal »
  est **rattaché** à son projet. La réutilisation **copie** la brique dans le projet cible (jamais
  d'héritage silencieux).

---

# PHASE 2 — RELATIONS (dépendances & structure)

## 2.1 Réponses explicites
- **Un Projet contient** : 1 Intention · 1 Personnage employé · les créatifs liés (Référence, Look, Décor,
  Ambiance, Consigne, Script, Voix) · 1 jeu de Paramètres · des médias (Candidates, Variantes, 1 Média
  actif, RAW, Montage) · des Légendes/Hashtags · des QC · des Coûts · des Livrables · des Versions · des
  Décisions · une Évaluation de cohérence (dérivée) · des états.
- **Une Intention appartient à** : exactement **un Projet** (et, par héritage, à la Série du projet). Elle
  **référence** un Personnage et porte un Objectif de publication.
- **Un Livrable provient de** : une **Version validée** d'un Projet (média final + tous les éléments de
  diffusion). Il **appartient** au Projet et **alimente** une Publication.
- **Une Variante est liée à** : le **Projet** ; son **origine** (la Candidate ou la Variante dont elle
  dérive) ; potentiellement au **Média actif** (si elle est promue) ; comparable à d'autres Variantes.
- **Une Publication est liée à** : **un Livrable** (sa source) · une **Plateforme** (Objectif) · le
  **Projet** · l'**Historique** (trace définitive).
- **Une Série relie** : plusieurs **Projets** (membres) partageant un **Personnage** et/ou une ligne
  éditoriale ; elle porte des **règles de cohérence** inter-projets.
- **Un Personnage possède** *(à confirmer)* : ses **Références** et une **garde-robe de Looks** ; il est
  **employé** par des Projets et des Séries.

## 2.2 Diagramme de structure (texte)
```
Série
└── regroupe ▸ Projet (1..n)
                 │
                 ├── Intention (1)
                 │     ├── Message / Émotion / Public (attributs)
                 │     ├── Objectif de publication ▸ Plateforme · Format · Durée
                 │     └── vise ▸ Personnage
                 │
                 ├── emploie ▸ Personnage (1)
                 │                 ├── possède ▸ Référence (1..n)        (à confirmer)
                 │                 └── possède ▸ garde-robe de Looks      (à confirmer)
                 │
                 ├── Créatifs liés
                 │     ├── Référence (issue du Personnage, verrouillable)
                 │     ├── Look (verrouillable, historisé)
                 │     ├── Décor (verrouillable, historisé)
                 │     ├── Ambiance (à confirmer : objet)  → sert l'Émotion
                 │     ├── Consigne de génération (verrouillable, historisée)
                 │     ├── Script → interprété par ▸ Voix
                 │     └── Paramètres (étanches au projet)
                 │
                 ├── Production (médias)
                 │     ├── Candidate (1..n)  ──décision──▸ Variante | Média actif | rejet
                 │     ├── Variante (0..n)   ──promotion─▸ Média actif | Livrable
                 │     ├── Média actif (0..1, rôle exclusif)
                 │     ├── Média intermédiaire / RAW (jamais écrasé)
                 │     └── Montage (plans = Variantes/Médias retenus ; Rythme attribut)
                 │
                 ├── Éléments de diffusion
                 │     ├── Légende (courte/longue)
                 │     ├── Hashtags (à confirmer : objet associé)
                 │     ├── Contrôle qualité (QC)
                 │     └── Coût (estimé/réel, lié aux actions de production)
                 │
                 ├── Version (0..n, instantanés restaurables) ──validée──▸ Livrable
                 │
                 ├── Livrable (0..n, paquet autonome) ──alimente──▸ Publication
                 │
                 ├── Publication (0..n) — ÉVÉNEMENT DÉFINITIF ▸ Plateforme
                 │
                 └── Mémoire du projet
                       ├── Décision (action + raison)
                       ├── Évaluation de cohérence (dérivée ; 10 pièces)
                       └── contribue à ▸ Historique (global, chronologique)

Transverse (hors projet, réutilisable) :
   Bibliothèque ── contient ▸ Brique réutilisable (Look · Décor · Ambiance · Preset · Consigne ·
                                Style de sous-titres · Enchaînement) ── provenance ▸ Projet d'origine
   Historique ── relate ▸ tous les Projets / Décisions / Versions / Publications
```

## 2.3 Nature des liens (résumé)
- **Composition (contient, meurt avec le parent)** : Projet ▸ Intention, Paramètres, Candidates, RAW,
  Décisions, Versions ; Livrable ▸ ses éléments de diffusion copiés.
- **Référence/Association (lien, vit indépendamment)** : Projet ▸ Personnage ; Projet ▸ Briques copiées ;
  Publication ▸ Livrable ; Série ▸ Projets.
- **Dérivation (produit/calculé à partir de)** : Variante ◂ Candidate ; Média actif ◂ Candidate/Variante ;
  Montage ◂ Variantes retenues ; Livrable ◂ Version validée ; Évaluation de cohérence ◂ Intention + pièces ;
  Historique ◂ ensemble des Projets.
- **Rôle exclusif (désignation)** : Média actif (un seul par projet).

---

# PHASE 3 — CYCLE DE VIE (naître · évoluer · valider · archiver · réutiliser)

| Objet | Naît | Évolue | Validé | Archivé | Réutilisé |
|---|---|---|---|---|---|
| **Intention** | à l'ouverture du projet (capture) | modifiable à tout moment | implicite (sert de référence) | avec le projet | sa trame peut inspirer une Série |
| **Projet** | création (porté par une Intention) | par décisions successives | quand un Livrable existe | jamais détruit : passe en archivé | rouvert, dupliqué, sert de modèle |
| **Personnage** | défini une fois | enrichi (réf/looks) | par usage | rarement archivé | employé par tout projet/série |
| **Référence** | importée/choisie | versionnée, verrouillable | par verrou + QC | conservée | réutilisée entre projets |
| **Look / Décor / Ambiance** | créé ou tiré de Bibliothèque | modifié, verrouillé, historisé | par verrou | en Bibliothèque (archivable) | copié dans d'autres projets |
| **Consigne de génération** | rédigée | éditée, historisée | par usage/verrou | en Bibliothèque | réemployée |
| **Script** | rédigé/généré | édité, versionné | avant production (sans dépense) | avec le projet | base d'autres scripts |
| **Voix** | produite depuis un Script | re-réglée | par écoute | RAW conservé | — (re-générée) |
| **Paramètres** | défaut neutre à la création | ajustés | implicite | avec le projet | **uniquement** via Preset (copie) |
| **Candidate** | produite (action payante confirmée) | — | par décision (devient variante/active/livrable) | non retenue = écartée (réversible) | réactivable |
| **Variante** | candidate conservée | comparée | promue (active/livrable) | écartée (réactivable) | réactivée |
| **Média actif** | désignation d'une candidate/variante | réassigné | sert de source | remplacé (l'ancien reste variante) | — |
| **RAW** | produit à chaque étape | **jamais modifié** | — | conservé durablement | sert d'audit/retour |
| **Montage** | assemblage des retenus | ré-assemblé, versionné | par QC final | RAW conservés | enchaînement promu en Brique |
| **Légende / Hashtags** | rédigés | régénérés, versionnés | à la validation du Livrable | avec le projet | gabarits possibles (Brique) |
| **QC** | exécuté avant dépense / en final | re-exécuté | verdict (conforme/forcé) | tracé au rapport | historique d'audit |
| **Coût** | estimé avant action | relevé réel après | — | tracé | comparaison/budget |
| **Version** | instantané pris volontairement | — (figée) | peut être « retenue » avec raison | conservée (jamais supprimée par une restauration) | restaurée |
| **Livrable** | à partir d'une Version validée | complété | validé explicitement | archivé après publication | dupliqué comme base |
| **Publication** | acte de diffusion | — (événement) | **définitif** | trace permanente en Historique | sert de référence de performance |
| **Décision** | à chaque choix structurant | — (immuable) | — | conservée | relue (mémoire) |
| **Évaluation de cohérence** | dérivée en continu | recalculée à chaque changement | « écart assumé » via Décision | — | guide les arbitrages |
| **Série** | créée pour regrouper | gagne/perd des projets | — | archivable | ligne éditoriale réappliquée |
| **Bibliothèque / Brique** | promotion d'un acquis | enrichie | par usage | brique archivable | copiée dans les projets |
| **Historique** | continu | s'enrichit | — | **permanent (jamais purgé)** | consultation/audit |

---

# PHASE 4 — DÉCISIONS / ACTIONS (verbes métier par objet)

> Verbes **métier** (ce que la personne veut accomplir), indépendants de toute manipulation concrète.

- **Intention** : définir · préciser · reformuler · (re)cibler le public · fixer l'objectif de publication.
- **Projet** : ouvrir · poursuivre · mettre de côté · rouvrir · dupliquer · prendre comme modèle · archiver.
- **Personnage** : définir · enrichir (références/looks) · choisir pour un projet · définir par défaut.
- **Référence** : importer · choisir · changer · **verrouiller** · définir par défaut · réutiliser.
- **Look / Décor / Ambiance** : créer · modifier · **verrouiller** · enregistrer (en Brique) · réutiliser ·
  comparer (avant/après) · archiver.
- **Consigne de génération** : rédiger · éditer · verrouiller · enregistrer · réutiliser.
- **Script** : rédiger · générer · éditer · raccourcir/allonger · versionner.
- **Voix** : produire · régler (ton/silences) · réécouter · refaire.
- **Paramètres** : ajuster · réinitialiser (neutre) · enregistrer en Preset · appliquer un Preset (copie).
- **Candidate** : produire (après confirmation de coût) · examiner · **désigner média actif** · conserver
  comme variante · valider comme livrable · éditer · régénérer (remplace) · décliner une variante · rejeter.
- **Variante** : **comparer** · **promouvoir** (active/livrable) · **archiver** · **restaurer** ·
  **réactiver** (depuis l'écarté).
- **Média actif** : désigner · remplacer.
- **RAW** : conserver (implicite) · consulter pour audit · revenir à un état antérieur.
- **Montage** : assembler · régler le rythme · ajouter/retirer un plan · versionner · promouvoir
  l'enchaînement (Brique).
- **Légende / Hashtags** : rédiger · régénérer · raccourcir · copier · versionner.
- **QC** : lancer le contrôle · régénérer · éditer · valider malgré l'alerte (décision tracée).
- **Coût** : estimer (avant) · constater (après) · comparer.
- **Version** : enregistrer un instantané · **comparer** · **restaurer** · noter la raison de la retenue.
- **Livrable** : valider · compléter · **dupliquer** · **archiver** · marquer prêt-à-poster.
- **Publication** : publier (**définitif**) · constater le statut · relier une performance.
- **Décision** : consigner (action + raison) · relire · amender la raison.
- **Évaluation de cohérence** : interroger (« sert l'intention ? ») · localiser la pièce qui dérive ·
  **assumer** un écart (jamais corrigé d'office).
- **Série** : créer · rattacher/détacher un projet · définir des règles de cohérence.
- **Bibliothèque / Brique** : promouvoir · nommer · réutiliser (copie) · archiver · tracer la provenance.
- **Historique** : consulter · rouvrir un élément · auditer.

---

# PHASE 5 — RÈGLES MÉTIER FONDAMENTALES (ancrées sur les piliers)

### 5.1 Ce qui peut être supprimé / écarté (réversible)
- Une **Candidate** non retenue, une **Variante** : **écartées, jamais détruites** tant que le projet n'est
  pas publié → **réactivables**. *(pilier ⑥ Contrôle)*
- Des **Paramètres** : **réinitialisables** à l'état neutre. *(⑥)*
- Un **Look/Décor/Ambiance/Consigne** : modifiables ; l'ancienne valeur part dans **leur historique**. *(③ + ⑥)*

### 5.2 Ce qui ne peut JAMAIS être supprimé
- Les **RAW / médias intermédiaires** (image brute, synchro brute, vidéo avant montage/sous-titres/recadrage)
  : **jamais écrasés ni perdus**. *(③ Mémoire — audit d'origine d'un défaut)*
- Les **Versions** : une restauration **n'en supprime aucune autre**. *(⑥ + ③)*
- Les **Décisions** et leur **raison**, et l'**Historique** : **mémoire permanente**, jamais purgée. *(③)*
- Un **Projet** : jamais détruit — il **s'archive** (conservé, rouvrable). *(③ + ⑥)*
- L'**Intention** d'un projet et la trace des **écarts assumés**. *(① + ③)*

### 5.3 Ce qui est réversible (jusqu'à la publication)
- **Tout** l'est : revenir à une étape, **comparer**, **restaurer** une version, **réactiver** une variante
  écartée, choisir **garder / mettre à jour / régénérer** — **au choix de la personne, jamais en automatique**.
  *(⑥ Contrôle + ⑤ Confiance)*
- Aucune étape aval n'est effacée **en silence** : une modification amont incompatible **demande**
  explicitement quoi faire de l'aval. *(⑤)*

### 5.4 Ce qui devient définitif
- **La Publication, et elle seule.** Une fois un Livrable publié, l'acte est **irréversible** ; la version
  publiée est **figée** et **conservée** en mémoire. *(⑥ — « le seul acte définitif : publier »)*

### 5.5 Ce qui doit être conservé en mémoire (le pourquoi)
- L'**Intention** (la boussole), les **Variantes testées**, les **Décisions + leur raison**, la **Version
  retenue + pourquoi**, les **écarts assumés**, la **provenance** des Briques. → un projet doit être
  **relisible des mois après** : *qu'est-ce qui était visé, qu'a-t-on essayé, qu'a-t-on choisi et pourquoi.*
  *(③ Mémoire — cœur)*

### 5.6 Règles de cohérence & de non-décision (transverses)
- Le système **mesure l'alignement à l'intention**, **localise** la pièce qui dérive (parmi les 10) et
  **rend l'écart visible** — il **ne tranche jamais** : la décision (corriger / assumer / ignorer) revient
  à la personne. *(② Cohérence + ⑥ Contrôle — précision structurante d'Etoile)*
- Le système **ne juge pas le goût** : aucune notion de « beau/laid », seulement de **cohérence
  explicable**. *(②)*

### 5.7 Règles d'étanchéité & de réutilisation
- Les **Paramètres/réglages d'un projet ne fuient jamais** vers un autre projet. *(⑤ — étanchéité)*
- La réutilisation se fait **uniquement** par **Brique** explicitement promue puis **copiée** (jamais
  d'héritage silencieux), avec **provenance** conservée. *(④ + ⑤ + ③)*

### 5.8 Règle de contrat (prévisibilité)
- Toute action conséquente **annonce son effet avant** de l'exécuter ; **valider produit exactement
  l'annoncé** ; un **verrou tient** ; une **reprise restaure l'état exact**. *(⑤ Confiance)*

---

# ANNEXE — DÉCISIONS DE MODÉLISATION OUVERTES (à confirmer, E120)

| # | Question de modélisation | Défaut proposé | Raison | Statut |
|---|---|---|---|---|
| M1 | **Ambiance** = objet ou attribut ? | **Objet léger distinct** | listée à part par Etoile ; réutilisable sur plusieurs décors | à confirmer |
| M2 | **Série** = conteneur de projets ou type de projet ? | **Conteneur** (regroupement par-dessus) | le projet reste autonome, peut exister hors série | à confirmer |
| M3 | **Personnage** possède-t-il Références/Looks ? | **Oui** (références + garde-robe de looks) | un look n'a de sens que porté par un personnage | à confirmer |
| M4 | **Message / Émotion / Public** = objets ou attributs de l'Intention ? | **Attributs riches de l'Intention** | n'existent pas sans intention | à confirmer |
| M5 | **Plateforme/Format/Durée** = attributs de l'Objectif ou objets de Bibliothèque ? | **Attributs de l'Objectif** | toujours liés ; *option* : profils réutilisables | à confirmer |
| M6 | **Hashtags** = objet distinct ou partie de la Légende ? | **Objet distinct associé au Livrable** | se renouvellent séparément du texte | à confirmer |
| M7 | **Rythme** = objet ou attribut du Montage ? | **Attribut du Montage** (mais pièce de cohérence) | n'existe pas hors d'un montage | à confirmer |
| M8 | **Prêt-à-poster** = état ou objet ? | **État du Livrable** (file = vue) | évite un stock séparé (cohérent avec la source unique) | à confirmer |
| M9 | **QC** vs **Évaluation de cohérence** = un ou deux objets ? | **Deux objets** (axes différents : aptitude technique vs alignement intention) | mesures de natures distinctes | à confirmer |
| M10 | **Voix signature** = attribut du Personnage ? | **Oui** (réutilisable, capitalisable) | cohérence d'identité sonore | à confirmer |

---

_Modèle de domaine pur — dérivé de E127 (6 piliers) et de la phrase centrale. Base factuelle : manifest
existant (`ui/project_store.js`). Aucune implémentation, aucune représentation. Réf. : `docs/EXIGENCES.md`
(E127). Approche de forme antérieure rangée dans `docs/artefacts/`. Lecture seule._

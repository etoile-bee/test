# MODÈLE MÉTIER — PHASE 1 : INVENTAIRE EXHAUSTIF DES OBJETS

> **Statut : ANALYSE / MODÉLISATION — PHASE 1 seule (livrable autonome).** On définit **les objets du
> domaine** : ce qui existe et pourquoi. Aucune notion de support, de présentation ou de manipulation —
> **zéro vocabulaire d'interface**. Les phases 2 à 5 (relations · cycle de vie · actions · règles) viendront
> **après validation de cette Phase 1**. Live intact · fichiers verrouillés intacts · aucune dépense.
>
> **Ancrage (référence absolue, `E127`) — les 6 piliers** : ① Intention · ② Cohérence · ③ Mémoire ·
> ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.
>
> **Phrase centrale** : « Je pilote la transformation d'une **intention** en contenu **publiable**, par une
> suite de décisions **cohérentes, réversibles et mémorisées**, dans un système en qui j'ai **confiance** —
> jusqu'au seul acte définitif : **publier**. »
>
> **Précision structurante** : le système pose en permanence « **ce qui est produit sert-il encore
> l'intention ?** » ; quand quelque chose s'écarte, il **localise la pièce qui dérive** et **rend l'écart
> visible** — il **ne décide jamais** à la place de la personne.
>
> **Méthode de lecture** — pour chaque objet : **RÔLE · POURQUOI il existe · CONTIENT (attributs) · CE QUI
> LE DIFFÉRENCIE**. La mention *(à confirmer)* signale une vraie question de modélisation laissée ouverte
> (E120), avec un défaut proposé et sa raison — **non tranchée en douce**. Base factuelle : le manifest
> existant (`ui/project_store.js`) ; ce document en exprime un **modèle de domaine propre**, pas du code.

---

## CARTE DES OBJETS — 4 familles (33 objets)

1. **INTENTION (le pourquoi)** — Intention · Message/Idée · Émotion · Public · Objectif de publication.
2. **IDENTITÉ & MATIÈRE CRÉATIVE (qui/quoi/où/comment)** — Personnage · Référence · Look · Décor · Ambiance ·
   Consigne de génération · Script · Voix · Paramètres.
3. **PRODUCTION & ÉTATS DU MÉDIA (ce qui est fabriqué)** — Candidate · Variante · Média actif · RAW/média
   intermédiaire · Montage · Légende · Hashtags · Contrôle qualité · Coût · Livrable · Version · Publication.
4. **MÉMOIRE & CAPITALISATION (traçabilité & réutilisation)** — Projet · Série · Décision · Évaluation de
   cohérence · Historique · Bibliothèque · Brique réutilisable.

---

# FAMILLE 1 — INTENTION (le pourquoi)

## 1. Intention — *la boussole*
- **Rôle** : exprimer la finalité d'un projet : *quoi dire, pour quoi faire ressentir, à qui, pour quelle
  destination*.
- **Pourquoi** : pilier ① — c'est la **référence absolue** à laquelle tout le reste se compare. Sans elle,
  la question centrale (« ça sert encore l'intention ? ») est impossible à poser.
- **Contient** : `message`, `émotion`, `personnage_visé` (lien), `public`, `objectif_publication` (lien),
  `créée_le`, `modifiée_le`.
- **Différenciation** : l'Intention est le **pourquoi** ; le Personnage est le **qui** ; Référence/Look/
  Décor sont des **moyens visuels**. L'Intention est **propre à un projet** (elle peut se répéter dans une
  Série mais reste rattachée à chaque projet).

## 2. Message (ou Idée) — *le contenu de sens*
- **Rôle** : la chose précise à transmettre (l'angle, le propos).
- **Pourquoi** : pilier ① — l'une des 10 pièces surveillées pour la dérive.
- **Contient** : `texte_court`, `angle`, `mots_clés`.
- **Différenciation** : le Message est le **fond** ; le Script en est la **mise en mots déroulée** ; la
  Légende en est la **formulation de publication**.
- *(à confirmer)* **Défaut : Message = attribut riche de l'Intention** (pas un objet autonome) — *raison* :
  il n'a de sens que porté par une intention. *À confirmer* si l'on veut réutiliser un Message d'un projet
  à l'autre (il deviendrait alors une Brique).

## 3. Émotion — *l'effet visé*
- **Rôle** : la tonalité affective recherchée (douceur, puissance, humour, luxe…).
- **Pourquoi** : piliers ① + ② — critère de cohérence (le ton du script/voix/montage doit la servir).
- **Contient** : `valeur` (libellé), `intensité` *(optionnel)*.
- **Différenciation** : l'Émotion est **ce qu'on veut faire ressentir** ; l'Ambiance est **le moyen
  visuel/sonore** d'y parvenir. Elles peuvent diverger (la cohérence le signale alors).
- *(à confirmer)* **Défaut : Émotion = attribut de l'Intention** (surveillé par la cohérence).

## 4. Public — *le destinataire*
- **Rôle** : à qui s'adresse le contenu.
- **Pourquoi** : pilier ① — oriente message, ton, format.
- **Contient** : `description`, `plateforme_habituelle` *(optionnel)*.
- **Différenciation** : le Public est **le destinataire (humain)** ; l'Objectif est **la destination
  technique de diffusion**.
- *(à confirmer)* **Défaut : Public = attribut de l'Intention.**

## 5. Objectif de publication (Destination) — *où, sous quelle contrainte*
- **Rôle** : la cible de diffusion et ses contraintes : plateforme, format, durée visée.
- **Pourquoi** : pilier ① — fixe des **contraintes mesurables**, donc des dérives détectables (durée >
  format, ratio non conforme).
- **Contient** : `plateforme`, `format` (ratio), `durée_cible`, `finalité` (publier / éprouver).
- **Différenciation** : l'Objectif porte les **contraintes de diffusion** ; les Paramètres portent les
  **réglages de fabrication**. L'un est *le but*, l'autre *le moyen technique*.
- *(à confirmer)* **Défaut : Plateforme/Format/Durée = attributs de l'Objectif** (lui-même composante de
  l'Intention) — *raison* : ils ne vivent jamais seuls. *À confirmer* : la **Plateforme** pourrait devenir
  un objet réutilisable (profils de contraintes : « format court 9:16 ≤ 30 s »).

---

# FAMILLE 2 — IDENTITÉ & MATIÈRE CRÉATIVE

## 6. Personnage — *l'identité durable*
- **Rôle** : l'entité incarnée qui porte les contenus.
- **Pourquoi** : piliers ① + ④ — **transverse** aux projets et **capitalisable**.
- **Contient** : `nom`, `traits_identitaires` (description stable), `références` (collection),
  `garde-robe` (collection de Looks), `voix_signature` *(validé 10/06 — M10)*.
- **Différenciation** : le Personnage est **qui** ; l'Intention est **pourquoi** ; la Référence est **une
  preuve visuelle** de l'identité du Personnage à un instant.
- ✅ *(validé 10/06 — M3)* **Le Personnage POSSÈDE ses Références ET sa garde-robe de Looks** (et sa
  voix-signature, M10). *Raison* : « robe rouge sur Imany » a du sens rattaché au personnage. *(Des Looks
  génériques sans personnage restent possibles via la Bibliothèque, sans contredire cette possession.)*

## 7. Référence — *la preuve d'identité visuelle*
- **Rôle** : image(s) faisant foi de l'identité du Personnage (visage, carnation, regard…).
- **Pourquoi** : piliers ② + ⑤ — **étalon** du contrôle d'identité (la production doit y rester fidèle).
- **Contient** : `image`, `libellé`, `verrou`, `historique`, `personnage` (lien).
- **Différenciation** : la Référence répond à « **est-ce bien la même personne ?** » ; le Look à « **comment
  est-elle présentée ?** ». La Référence est **stable** ; le Look est **variable**.

## 8. Look — *l'apparence choisie*
- **Rôle** : tenue / coiffure / style d'apparence pour une production.
- **Pourquoi** : piliers ② + ④ — capitalisable, surveillé pour cohérence avec l'intention/émotion.
- **Contient** : `libellé`, `description`, `image_de_référence`, `verrou`, `historique`,
  `personnage` *(via garde-robe — validé 10/06, M3)*.
- **Différenciation** : Look = **vêtir/styliser le Personnage** ; Décor = **le lieu** ; Ambiance =
  **l'atmosphère** ; Référence = **l'identité**. Le Look n'est PAS le Personnage (on change de look sans
  changer d'identité).

## 9. Décor — *le lieu / l'arrière-plan*
- **Rôle** : l'environnement de la scène (studio, extérieur jour, bougies…).
- **Pourquoi** : piliers ② + ④ — capitalisable, surveillé pour cohérence.
- **Contient** : `libellé`, `description`, `image_de_référence`, `verrou`, `historique`.
- **Différenciation** : Décor = **où** (lieu concret) ; Ambiance = **quelle tonalité** (lumière, humeur).
  Un même Décor peut porter plusieurs Ambiances (studio « froid clinique » vs « chaud intime »).

## 10. Ambiance — *la tonalité visuelle/sonore*
- **Rôle** : l'atmosphère recherchée (lumière, couleur, mood) — le **moyen** de produire l'Émotion.
- **Pourquoi** : pilier ② — pièce de cohérence (l'ambiance doit servir l'émotion visée).
- **Contient** : `libellé`, `lumière`, `palette`, `tonalité`.
- **Différenciation** : Émotion = **but ressenti** ; Ambiance = **moyen visuel/sonore**.
- ✅ *(validé 10/06 — M1)* **Ambiance = OBJET distinct** (du Décor et des Paramètres). *Raison* : une même
  ambiance se réutilise sur des décors différents ; elle est capitalisable indépendamment.

## 11. Consigne de génération (Prompt) — *l'instruction de fabrication*
- **Rôle** : le texte d'instruction qui guide la production d'un média (image / animation / synchro labiale).
- **Pourquoi** : piliers ④ + ⑤ — réutilisable, et son effet doit être explicite.
- **Contient** : `rôle` (image / vidéo / synchro), `nom`, `texte`, `négatif` (anti-artefacts), `verrou`,
  `historique`.
- **Différenciation** : la Consigne est **comment on demande la fabrication** ; le Script est **le contenu
  parlé** ; le Message est **le sens**. Une consigne sert un Look/Décor/Ambiance, pas l'inverse.

## 12. Script — *le déroulé parlé*
- **Rôle** : le texte qui sera dit (dialogue / voix off).
- **Pourquoi** : piliers ① + ② — porte le Message, surveillé pour cohérence d'émotion et de durée.
- **Contient** : `texte`, `durée_estimée`, `hooks` (variantes d'accroche) *(à confirmer)*, `version`.
- **Différenciation** : Script = **mots prononcés** ; Légende = **texte d'accompagnement de publication**
  (non prononcé) ; Message = **idée** sous-jacente.
- **Règle de domaine** : le Script ne contient **aucune marque technique** (p. ex. mot « pause ») ; les
  silences relèvent de la Voix.

## 13. Voix — *l'incarnation sonore du script*
- **Rôle** : la synthèse/interprétation vocale du Script.
- **Pourquoi** : pilier ② — pièce de cohérence (le grain/ton de voix doit servir l'émotion).
- **Contient** : `script_source` (lien), `paramètres_voix` (timbre, rythme, silences), `média_audio`,
  `réactions` (défaut : aucune).
- **Différenciation** : la Voix **interprète** le Script sans en modifier le texte.

## 14. Paramètres — *les réglages de fabrication (le « comment » technique)*
- **Rôle** : réglages de production propres au projet (nombre d'images, format, durée, retouches d'image,
  recadrage, options de rendu).
- **Pourquoi** : piliers ⑤ + ⑥ — explicites, réversibles, **étanches** (propres au projet).
- **Contient** : `nombre_images`, `mode` (éco/haute qualité), `format`, `durée`, `retouches_image`,
  `recadrage`, `options_rendu`, `surcharge_sous-titres` (propre au projet).
- **Différenciation** : Paramètres = **le COMMENT technique** ; Objectif = **le but de diffusion** ;
  Ambiance/Look/Décor = **le QUOI créatif**. Les Paramètres ne portent **aucune intention de sens**.
- **Règle de domaine (étanchéité)** : les Paramètres d'un projet **ne se propagent jamais** à un autre ;
  la réutilisation passe **uniquement** par une Brique explicite.

---

# FAMILLE 3 — PRODUCTION & ÉTATS DU MÉDIA

> **Distinction centrale (cinq états d'un média visuel)** : *Candidate → Variante → Média actif → Livrable*
> sur l'axe « devenir » ; et, sur un autre axe, *Version* (instantané du projet dans le temps). Ce sont des
> **états/rôles différents**, pas des copies.

## 15. Candidate (image produite) — *le brut non jugé*
- **Rôle** : un média fraîchement produit, **pas encore évalué**.
- **Pourquoi** : pilier ⑥ — rien n'est retenu sans décision.
- **Contient** : `média`, `consigne_source`, `produite_le`, `coût_associé`.
- **Différenciation** : Candidate = **produite, pas choisie**. Tant qu'aucune décision n'est prise, elle
  n'est ni active, ni variante, ni livrable.

## 16. Variante — *l'alternative conservée volontairement*
- **Rôle** : une candidate **gardée comme option** sans être l'option principale.
- **Pourquoi** : piliers ⑥ + ③ — permet de comparer, revenir, réactiver.
- **Contient** : `média`, `origine` (candidate / dérivée d'une autre), `raison_conservation` *(mémoire)*.
- **Différenciation** : Variante = **trace volontaire**, jamais promue automatiquement. Une Variante n'est
  **pas** un Livrable et n'est **pas** le Média actif tant qu'on ne l'a pas décidé.

## 17. Média actif — *le rôle de « source courante »*
- **Rôle** : **désignation** d'un unique média comme **source des étapes suivantes** du projet.
- **Pourquoi** : piliers ⑤ + ⑥ — il faut une et une seule source courante, explicite.
- **Contient** : ce n'est **pas une copie** mais un **rôle** porté par une Candidate/Variante :
  `média_désigné` (lien), `désigné_le`.
- **Différenciation** : « Média actif » est un **rôle exclusif** (un seul à la fois), réassignable. Une
  Variante peut **devenir** média actif ; un média actif **reste** une candidate/variante par nature.

## 18. RAW / média intermédiaire — *les états bruts conservés*
- **Rôle** : les productions brutes de chaque étape (image brute, synchro brute, vidéo avant montage,
  avant sous-titres, avant recadrage…).
- **Pourquoi** : piliers ③ + ⑥ — **jamais écrasés** ; permettent l'audit (« où est née une anomalie ») et
  le retour en arrière.
- **Contient** : `type_d_etape`, `média`, `produit_le`.
- **Différenciation** : le RAW est **la matière d'origine** ; le Montage/Livrable sont des **états aboutis**.
  Un RAW ne se remplace pas.

## 19. Montage — *l'assemblage temporel*
- **Rôle** : l'assemblage des plans / médias en une séquence rythmée (avec sous-titres, musique…).
- **Pourquoi** : piliers ② + ⑥ — le **rythme** et l'enchaînement servent l'émotion/le message.
- **Contient** : `plans` (médias retenus, dans l'ordre), `rythme` (cadence, durées par plan),
  `sous-titres`, `musique`, `version`.
- **Différenciation** : le Montage **organise** des médias existants ; il n'en crée pas. Le **Rythme** est
  un *(à confirmer ; défaut : attribut du Montage)* — c'est néanmoins l'une des 10 pièces surveillées par
  la cohérence.

## 20. Légende — *le texte d'accompagnement de publication*
- **Rôle** : le texte publié à côté du média (forme courte + forme longue).
- **Pourquoi** : piliers ① + ② — doit servir le message et le public ; pièce de cohérence.
- **Contient** : `forme_courte`, `forme_longue`, `version`.
- **Différenciation** : Légende ≠ Script (l'une est lue par le public, l'autre prononcée). Copiable **sans
  le titre** (règle de forme métier).

## 21. Hashtags — *les marqueurs de diffusion*
- **Rôle** : mots-clés de diffusion rattachés à la publication.
- **Pourquoi** : pilier ① — sert l'objectif de diffusion.
- **Contient** : `liste`, `version`.
- **Différenciation** : ✅ *(validé 10/06 — M6)* **objet distinct** (toujours associé à un Livrable) —
  *raison* : ils se gèrent/renouvellent séparément du texte de la Légende.

## 22. Contrôle qualité (QC) — *le verdict d'aptitude*
- **Rôle** : l'évaluation d'identité/anatomie/cohérence d'un média **avant** une étape coûteuse, et la
  validation finale.
- **Pourquoi** : piliers ⑤ + ② — on n'engage pas une dépense sur un média non conforme.
- **Contient** : `verdict` (conforme / alerte / forcé), `auteur`, `date`, `détails` (identité, cohérence,
  référence, look), `rapport` (historique des contrôles).
- **Différenciation** : le QC est un **jugement d'aptitude technique** (le média est-il sain ?), distinct de
  l'**Évaluation de cohérence** (le média sert-il l'**intention** ?). ✅ *(validé 10/06 — M9 : deux objets
  distincts, axes différents.)*

## 23. Coût — *la mesure de dépense*
- **Rôle** : l'estimation et le relevé réel de ce que coûte une production (crédits, montant, temps).
- **Pourquoi** : piliers ⑤ + ① — l'effet (dépense) doit être explicite avant l'action, et tracé après.
- **Contient** : `estimé` (avant), `réel` (après), `crédits`, `temps`, `détail`, `action_liée`.
- **Différenciation** : le Coût est une **mesure rattachée à une action de production**, pas un média.

## 24. Livrable — *le contenu validé pour diffusion*
- **Rôle** : un ensemble **explicitement validé** et **autonome**, prêt à diffuser (média final + script +
  légendes + hashtags + paramètres + infos + RAW).
- **Pourquoi** : piliers ⑥ + ③ — seul ce qui est validé entre ici ; tout y est pour diffuser sans
  reconstruire le contexte.
- **Contient** : `média_final`, `image(s)_source`, `script`, `légende_courte`, `légende_longue`,
  `hashtags`, `paramètres`, `infos_projet`, `coûts`, `RAW`, `version_source` (lien).
- **Différenciation** : un Livrable n'est **ni** candidate **ni** variante **ni** version : c'est un
  **paquet validé et complet**. Aucun média non validé n'y figure jamais.

## 25. Version — *l'instantané restaurable du projet*
- **Rôle** : un **état figé du projet à un instant** (média + réglages + créatifs), restaurable.
- **Pourquoi** : piliers ⑥ + ③ — revenir exactement à un état antérieur sans perdre les autres.
- **Contient** : `identifiant`, `date`, `libellé`, `média_référencé`, `instantané_paramètres`,
  `instantané_créatif`, `raison_retenue` *(mémoire : pourquoi cette version)*.
- **Différenciation** : la Version est un **point de sauvegarde dans le temps** ; le Livrable est un
  **paquet de diffusion**. Restaurer une Version **ne supprime jamais** les autres.

## 26. Publication — *l'acte de diffusion (le seul définitif)*
- **Rôle** : l'événement par lequel un Livrable est diffusé sur une plateforme.
- **Pourquoi** : pilier ⑥ — **seul acte irréversible** du domaine.
- **Contient** : `livrable_source` (lien), `plateforme`, `date`, `statut` (prêt-à-poster → publié),
  `identité_de_diffusion` *(à confirmer)*.
- **Différenciation** : la Publication est un **événement**, pas un média. **Prêt-à-poster** est un **état
  antérieur** (Livrable complet, en attente), distinct de **Publié** (acte consommé). ✅ *(validé 10/06 —
  M8 : Prêt-à-poster = ÉTAT du Livrable, pas un objet séparé.)*

---

# FAMILLE 4 — MÉMOIRE & CAPITALISATION

## 27. Projet — *l'unité de production*
- **Rôle** : le conteneur d'une transformation « une Intention → un ou des Livrables ».
- **Pourquoi** : piliers ① → ⑥ — **objet pivot** qui regroupe tout et garde la cohérence.
- **Contient** : `intention`, `personnage_employé`, créatifs (référence/look/décor/ambiance/consigne/script/
  voix), `paramètres`, médias (candidates/variantes/média actif/RAW/montage), `livrables`, `versions`,
  `décisions`, `coûts`, `QC`, `états` (avancement, diffusion), `créé_le`, `modifié_le`.
- **Différenciation** : le Projet **contient** ; la Série **regroupe des projets** ; l'Historique **relate**.
  Un Projet produit **image seule / vidéo seule / les deux** — jamais « projet image » vs « projet vidéo ».

## 28. Série — *le regroupement éditorial de projets*
- **Rôle** : relier plusieurs Projets partageant une ligne (même personnage, format récurrent, intention de
  fond).
- **Pourquoi** : piliers ④ + ③ — capitalisation d'une ligne éditoriale, mémoire d'ensemble, cohérence
  inter-projets (anti-répétition de sujets).
- **Contient** : `nom`, `ligne_éditoriale`, `projets_membres`, `personnage` *(souvent commun)*,
  `règles_de_cohérence`.
- **Différenciation** : ✅ *(validé 10/06 — M2)* Série = **CONTENEUR de Projets**, pas un type de projet.
  *Raison* : le projet reste autonome et peut exister hors série ; la série est un regroupement par-dessus.

## 29. Décision — *le choix tracé avec sa raison*
- **Rôle** : enregistrer un choix structurant **et son pourquoi** (garder un média, retenir une variante,
  assumer un écart, changer un look, publier).
- **Pourquoi** : pilier ③ (cœur) — rend le projet **relisible des mois après**.
- **Contient** : `date`, `objet_concerné`, `action`, `raison` (courte, optionnelle mais proposée), `auteur`.
- **Différenciation** : la Décision capte **le pourquoi** ; l'Historique capte **la chronologie** ; la
  Version capte **l'état**. C'est ce qui manque le plus aujourd'hui (le moteur trace l'action, pas la
  raison).

## 30. Évaluation de cohérence — *la lecture d'alignement à l'intention*
- **Rôle** : un **état dérivé** (non saisi) qui, pour chaque **pièce**, indique si elle **sert encore
  l'intention** ou **signale une dérive**, avec le **pourquoi** du signal.
- **Pourquoi** : pilier ② (cœur) — matérialise la question centrale.
- **Contient** : par pièce — `pièce` (parmi : **message · image · look · décor · voix · script · montage ·
  rythme · légende · publication**), `état` (alignée / à vérifier / non définie / **écart assumé**),
  `raison_du_signal`.
- **Différenciation** : l'Évaluation **ne juge pas le goût** et **ne décide rien** : elle **signale et
  localise**. Distincte du QC (aptitude technique). Un **écart assumé** est une Décision qui éteint le signal.

## 31. Historique — *la mémoire chronologique*
- **Rôle** : la trace ordonnée de tout ce qui s'est passé (projets, décisions, versions, productions,
  publications).
- **Pourquoi** : piliers ③ + ⑥ — mémoire permanente, base du retour en arrière et de l'audit.
- **Contient** : `entrées` chronologiques `{ date, objet, événement, raison? }`.
- **Différenciation** : l'Historique **relate** (mémoire) ; la Bibliothèque **outille** (réutilisation).
  L'Historique **n'est pas** un stock séparé : c'est la mémoire **dérivée** du même ensemble de Projets.

## 32. Bibliothèque — *le catalogue de briques réutilisables*
- **Rôle** : rassembler les **Briques réutilisables** (Looks, Décors, Ambiances, Presets, Consignes, Styles
  de sous-titres, Enchaînements) disponibles pour tout Projet.
- **Pourquoi** : pilier ④ — capitalisation transverse.
- **Contient** : collections de Briques, chacune avec sa **provenance**.
- **Différenciation** : la Bibliothèque est un **outil de réemploi transverse** ; l'Historique est une
  **mémoire chronologique**. En tirer une brique = **copie explicite** (étanchéité).

## 33. Brique réutilisable (Preset / acquis promu) — *l'unité de capitalisation*
- **Rôle** : un acquis (Look, Décor, Ambiance, réglages = Preset, Consigne, Style de sous-titres,
  Enchaînement de montage) **promu** pour être réemployé.
- **Pourquoi** : pilier ④ — transforme un succès ponctuel en actif réutilisable.
- **Contient** : `type`, `nom`, `contenu`, `provenance` (projet d'origine), `créée_le`.
- **Différenciation** : une Brique est **détachée d'un projet** et **réutilisable** ; un créatif « normal »
  est **rattaché** à son projet. La réutilisation **copie** la brique dans le projet cible (jamais d'héritage
  silencieux).

---

# RÉCAPITULATIF — LES DISTINCTIONS PIÉGEUSES

| Distinction | La bonne question | Verdict |
|---|---|---|
| **Référence vs Look vs Décor vs Ambiance vs Paramètres** | Référence = **qui** (identité stable) · Look = **comment vêtu/stylisé** · Décor = **où** (lieu) · Ambiance = **quelle atmosphère** (moyen de l'émotion) · Paramètres = **réglages techniques** (sans sens créatif) | 5 objets distincts (Ambiance *à confirmer*) |
| **Candidate vs Variante vs Média actif vs Livrable vs Version** | Candidate = **produite, pas jugée** · Variante = **alternative gardée** · Média actif = **rôle exclusif de source courante** · Livrable = **paquet validé pour diffusion** · Version = **instantané du projet dans le temps** | 4 états « devenir » + 1 axe temporel |
| **Bibliothèque vs Historique** | Bibliothèque = **réemploi transverse** (briques) · Historique = **mémoire chronologique** (ce qui s'est passé) | 2 rôles opposés |
| **Série vs Projet** | Projet = **unité de production** (1 intention → livrables) · Série = **conteneur de projets** (ligne éditoriale) | Série = conteneur *(à confirmer)* |
| **Personnage vs Intention** | Personnage = **qui** (identité durable, transverse) · Intention = **pourquoi** (propre au projet) | 2 objets distincts |

---

# DÉCISIONS DE MODÉLISATION (Phase 1 — statut après arbitrage Etoile 10/06)

> **Phase 1 VALIDÉE par Etoile (10/06).** Arbitrages tranchés ci-dessous ; M4/M5/M7 restent des **défauts
> à confirmer**.

| # | Question | Décision | Statut |
|---|---|---|---|
| M1 | **Ambiance** = objet ou attribut ? | **OBJET distinct** | ✅ **validé 10/06** |
| M2 | **Série** = conteneur ou type de projet ? | **CONTENEUR de projets** | ✅ **validé 10/06** |
| M3 | **Personnage** possède Références/Looks ? | **OUI : possède ses Références + sa garde-robe de Looks** | ✅ **validé 10/06** |
| M4 | **Message / Émotion / Public** = objets ou attributs ? | Attributs riches de l'Intention | ⏳ **défaut, à confirmer** |
| M5 | **Plateforme/Format/Durée** = attributs ou objets ? | Attributs de l'Objectif (option : profils réutilisables) | ⏳ **défaut, à confirmer** |
| M6 | **Hashtags** = objet distinct ou partie de Légende ? | **OBJET distinct** (associé au Livrable) | ✅ **validé 10/06** |
| M7 | **Rythme** = objet ou attribut du Montage ? | Attribut du Montage (pièce de cohérence) | ⏳ **défaut, à confirmer** |
| M8 | **Prêt-à-poster** = état ou objet ? | **ÉTAT du Livrable** (pas un objet) | ✅ **validé 10/06** |
| M9 | **QC** vs **Évaluation de cohérence** | **DEUX objets distincts** (axes différents) | ✅ **validé 10/06** |
| M10 | **Voix-signature** = attribut du Personnage ? | **APPARTIENT au Personnage** | ✅ **validé 10/06** |

---

**Constat fondateur (rappel)** : l'**Intention** est ici posée comme **objet de premier niveau** — c'est
précisément ce qui **manque** au moteur aujourd'hui (`grep intention ui/*.js` = 0). Le reste
(référence/look/décor/prompt) existe déjà comme **moyens** ; il leur manquait la **fin**.

---

⏸️ **FIN DE LA PHASE 1.** Les phases 2 (Relations) · 3 (Cycle de vie) · 4 (Actions) · 5 (Règles) **ne sont
pas traitées ici** : elles attendent la **validation de cet inventaire** par Etoile.

_Phase 1 — inventaire des objets. Dérivé de E127 (6 piliers) et de la phrase centrale. Base factuelle :
manifest existant. Aucune implémentation, aucune représentation. Lecture seule._

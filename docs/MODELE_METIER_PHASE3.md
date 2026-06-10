# MODÈLE MÉTIER — PHASE 3 : CYCLE DE VIE DES OBJETS

> **Statut : ANALYSE / MODÉLISATION — PHASE 3 seule (livrable autonome).** Pour chaque objet : comment il
> **NAÎT · ÉVOLUE · est VALIDÉ · est ARCHIVÉ · est RÉUTILISÉ**. **Zéro vocabulaire d'interface.** Les phases
> 4 (actions) et 5 (règles) viendront **après validation**. Live intact · fichiers verrouillés intacts ·
> aucune dépense.
>
> **Phases 1 & 2 validées (10/06) — M1→M12 toutes tranchées.** Intégré ici : **Univers** = objet de 1er
> niveau (UNIVERS → PERSONNAGE → PROJET → LIVRABLES) ; **Intention** = objet **composite** (Message +
> Émotion + Public + Objectif) ; **étanchéité M12** = les valeurs d'Univers/Personnage/Bibliothèque entrent
> dans un projet **par copie explicite**, **jamais par héritage vivant**, **jamais de modification
> rétroactive**.
>
> **Ancrage `E127`** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.

---

## A. CONVENTIONS DE CYCLE DE VIE

Cinq moments décrivent chaque objet :
- **NAÎT** — l'événement qui le fait exister.
- **ÉVOLUE** — comment il change au fil du projet.
- **VALIDÉ** — ce qui le fait passer à un état « retenu / conforme / définitif » (quand applicable).
- **ARCHIVÉ** — comment il quitte le flux actif sans être détruit.
- **RÉUTILISÉ** — comment il resservira ailleurs.

### A.1 Principe transverse d'étanchéité (M12) — « copie au point d'entrée »
Quand un **Projet naît**, il **copie** dans son propre périmètre les valeurs utiles venues de l'**Univers**
(règles éditoriales/visuelles, lignes de publication), du **Personnage** (références, looks, voix) et de la
**Bibliothèque** (briques choisies). **À partir de cette copie, le Projet est autonome.** Conséquences
permanentes :
- modifier un Univers / un Personnage / une brique de Bibliothèque **ne change AUCUN projet déjà né** ;
- les **nouveaux** projets copieront les **nouvelles** valeurs ;
- aucune valeur « vivante » ne traverse la frontière du projet après sa naissance.

> Le « réutilisé » des objets-sources (Univers/Personnage/Bibliothèque) est donc toujours une **copie**,
> jamais un **lien vivant**. *(piliers ⑤ Confiance + ⑥ Contrôle + E124 étanchéité)*

---

## B. FOCUS — LE CYCLE DE VIE DE LA DÉCISION *(point critique, demandé par Etoile)*

> Un projet **est** une succession de décisions créatives. Le système doit conserver non seulement les
> **résultats** mais les **raisons**. La Décision est l'objet qui porte le **pourquoi**.

### B.1 Comment une Décision NAÎT et se trace
- **Naît** : à **chaque choix structurant** qui oriente le projet — pas à chaque micro-réglage, mais à
  chaque acte qui **change une direction** ou **fixe un devenir**.
- **Trace (ce qu'elle capture)** : `date` · `auteur` · `objet_concerné` (lien) · `action` (le quoi) ·
  **`raison` (le POURQUOI)** · `option_retenue` · `options_écartées` (ce qui a été comparé/laissé) ·
  `lien_intention` (à quelle composante de l'intention ce choix répond) · éventuellement
  `signal_de_cohérence_associé` (si la décision répond à une dérive repérée).
- La **raison** est **courte**, formulée en langage humain, **proposée systématiquement** au moment du
  choix. *(voir M13 — caractère obligatoire ou non, à confirmer)*

### B.2 Le POURQUOI capturé pour chaque cas (les 5 cas d'Etoile)
| Cas | Objet concerné | Exemple de POURQUOI capturé |
|---|---|---|
| **Une variante est conservée** | Variante | « plus douce que les autres — colle à l'émotion visée » |
| **Une variante est rejetée** | Variante (écartée) | « mains déformées » / « ne sert pas le message » |
| **Un look en remplace un autre** | Look (du projet) | « le tailleur faisait trop corporate pour ce public » |
| **Un livrable est validé** | Livrable | « meilleur compromis fidélité d'identité / impact » |
| **Une direction créative est abandonnée** | Intention / orientation | « l'angle humour ne parlait pas au public visé » |

> Dans tous les cas, la Décision **n'efface pas** ce qu'elle écarte : la variante rejetée reste réactivable,
> l'ancien look reste dans l'historique du Look, la direction abandonnée reste lisible. La Décision
> **explique le tri**, elle ne le rend pas destructeur. *(pilier ⑥)*

### B.3 Comment la Décision TRAVERSE tout le modèle
- Elle **se rattache à l'objet concerné** (Variante, Look, Livrable, Intention…) **et au Projet** (toute
  décision appartient à un projet).
- Elle peut **référencer un signal de l'Évaluation de cohérence** : un **« écart assumé »** *est* une
  Décision (« je sais que le script s'écarte de l'émotion, c'est voulu, parce que… »).
- Elle **alimente l'Historique** : chaque Décision devient une entrée chronologique permanente.
- Elle **incarne le pilier ③ Mémoire** : sans elle, l'Historique ne saurait dire que **le QUOI** ; avec
  elle, il dit **le POURQUOI**.

### B.4 Cycle de vie propre de la Décision
- **NAÎT** : à l'acte de choix (création immédiate, horodatée).
- **ÉVOLUE** : une Décision est **immuable dans son fait** (on ne réécrit pas l'histoire) ; on peut
  **enrichir sa raison** *(à confirmer M13)* ou la **superséder** par une **nouvelle** Décision (ex.
  « finalement, je réactive la variante B » = nouvelle décision qui **n'efface pas** l'ancienne). La chaîne
  reste lisible.
- **VALIDÉE** : une Décision est « prise » par l'acte même — pas de validation séparée. **Exception** : la
  **Publication** est la Décision **irréversible** ultime.
- **ARCHIVÉE** : **jamais supprimée** — mémoire permanente *(pilier ③)*.
- **RÉUTILISÉE** : **relue** pour comprendre/auditer un projet des mois après ; un motif récurrent de
  décisions peut **inspirer une règle** (éditoriale/visuelle) au niveau de l'Univers *(pilier ④)*.

### B.5 Pourquoi un projet reste compréhensible des mois plus tard
Relire la **suite ordonnée des Décisions** reconstitue le raisonnement complet :
**Intention visée → essais (variantes) → ce qui a été choisi et POURQUOI → écarts assumés → version
retenue → publication.** On ne retrouve pas seulement *ce qui a été produit*, mais *pourquoi ces choix* —
exactement l'objet du pilier ③ Mémoire.

---

## C. CYCLE DE VIE — OBJET PAR OBJET

### Famille 0 — UNIVERS
| Objet | NAÎT | ÉVOLUE | VALIDÉ | ARCHIVÉ | RÉUTILISÉ |
|---|---|---|---|---|---|
| **Univers** | créé une fois (le monde/la marque) | enrichi (règles, chartes, lignes de publication, ajout de personnages/séries) | par l'usage (pas de validation formelle) | archivable (conservé, jamais détruit) | **par copie** de ses valeurs au démarrage des projets (M12 — jamais d'héritage vivant) |

### Famille 1 — INTENTION (composite)
| Objet | NAÎT | ÉVOLUE | VALIDÉ | ARCHIVÉ | RÉUTILISÉ |
|---|---|---|---|---|---|
| **Intention** | à l'ouverture du projet (capture des 4 composantes : message·émotion·public·objectif) | modifiable à tout moment ; chaque changement de direction = une **Décision** | sert de **référence** (implicite) ; toute production se compare à elle | avec le projet | sa trame peut **inspirer** une Série/Univers (copie, pas lien) |
| **Message** *(composante)* | avec l'Intention | reformulable (Décision) | — | avec l'Intention | base possible d'autres intentions (copie) |
| **Émotion** *(composante)* | avec l'Intention | ajustable | sert de critère de cohérence | avec l'Intention | réutilisable comme repère |
| **Public** *(composante)* | avec l'Intention | reciblable | — | avec l'Intention | réutilisable |
| **Objectif (Plateforme/Format/Durée, M5)** | **dès la naissance du projet** | ajustable (impacte les contraintes mesurables) | conforme/non conforme aux contraintes | avec le projet | profils possibles au niveau Univers (copie) |

### Famille 2 — IDENTITÉ & MATIÈRE CRÉATIVE
| Objet | NAÎT | ÉVOLUE | VALIDÉ | ARCHIVÉ | RÉUTILISÉ |
|---|---|---|---|---|---|
| **Personnage** | défini une fois, **dans un Univers** | enrichi (références/looks/voix) | par usage | rarement archivé (conservé) | **employé** par des projets (copie de l'identité utile au démarrage) |
| **Référence** | importée/choisie (possédée par le Personnage) | versionnée, **verrouillable**, historisée | par verrou + contrôle qualité | conservée | **copiée** dans un projet comme étalon |
| **Look** | créé, ou tiré de la garde-robe/Bibliothèque | modifié, **verrouillé**, historisé ; un remplacement = une **Décision** | par verrou | en garde-robe/Bibliothèque (archivable) | **copié** dans un projet (jamais lien vivant) |
| **Décor** | créé, ou tiré de la Bibliothèque (Univers) | modifié, verrouillé, historisé | par verrou | en Bibliothèque | **copié** dans un projet |
| **Ambiance (M1, objet)** | créée, ou tirée de la Bibliothèque | modifiée | par usage | en Bibliothèque | **copiée** ; réutilisable sur plusieurs décors |
| **Consigne de génération** | rédigée | éditée, verrouillée, historisée | par usage/verrou | en Bibliothèque | **copiée** dans un projet |
| **Script** | rédigé/généré | édité, **versionné** ; tout changement majeur = **Décision** | avant production (sans dépense) | avec le projet | base d'autres scripts (copie) |
| **Voix** | produite depuis un Script | re-réglée | par écoute | RAW conservé | re-générée (paramètres réutilisables) |
| **Paramètres** | **défaut neutre** à la création du projet | ajustés | implicite | avec le projet | **uniquement via Preset** (copie explicite, étanche E124) |

> **Étanchéité (M12) rappel** : Référence/Look/Décor/Ambiance/Consigne entrent dans le projet **par copie
> au moment de leur emploi** ; modifier l'original en Bibliothèque/garde-robe **ne touche pas** les projets
> où ils ont déjà été copiés.

### Famille 3 — PRODUCTION & ÉTATS DU MÉDIA
| Objet | NAÎT | ÉVOLUE | VALIDÉ | ARCHIVÉ | RÉUTILISÉ |
|---|---|---|---|---|---|
| **Candidate** | produite (après confirmation de coût) | — (figée comme média) | par **Décision** (devient variante/active/livrable) | écartée = **réversible** | réactivable |
| **Variante** | une Candidate conservée (**Décision** + raison) | comparée à d'autres | promue (média actif/livrable) via **Décision** | écartée (**Décision** + raison) — réactivable | **réactivée** (nouvelle Décision) |
| **Média actif** | **désignation** d'une candidate/variante (rôle exclusif) | réassigné (ancien redevient variante) | sert de source des étapes | remplacé (jamais perdu) | — (rôle, pas média) |
| **RAW / média intermédiaire** | produit à chaque étape | **jamais modifié** | — | **conservé durablement** (jamais écrasé) | sert d'**audit** et de retour en arrière |
| **Montage** | assemblage des médias retenus | ré-assemblé, **versionné** ; rythme = attribut (M7) | par contrôle qualité final | RAW conservés | **enchaînement** promu en Brique (copie) |
| **Légende (courte/longue)** | rédigée | régénérée, versionnée | à la validation du Livrable | avec le projet | gabarits possibles (Brique, copie) |
| **Hashtags (M6, objet)** | rédigés | renouvelés, versionnés | à la validation du Livrable | avec le projet | jeux réutilisables (copie) |
| **Contrôle qualité (QC)** | exécuté **avant dépense** et/ou en final | re-exécuté après changement | **verdict** (conforme / forcé via **Décision**) | tracé au rapport | historique d'audit |
| **Coût** | **estimé avant** l'action | **relevé réel** après | — | tracé | comparaison/budget |
| **Version** | **instantané** pris volontairement | figée (immuable) | peut être **« retenue »** avec sa **raison** (Décision) | conservée (une restauration n'en supprime aucune) | **restaurée** |
| **Livrable** | construit à partir d'une **Version validée** | complété | **validé explicitement** (**Décision** + raison) | **archivé** après publication | **dupliqué** comme base d'un nouveau projet (copie) |
| **Publication** | acte de diffusion (**Décision irréversible**) | — (événement) | **définitif** | trace permanente en Historique | sert de **référence de performance** |

> **État « Prêt-à-poster » (M8)** : ce n'est pas un objet mais un **état du Livrable** (complet, en
> attente). Il **naît** quand le Livrable est validé, **disparaît** quand la Publication a lieu.

### Famille 4 — MÉMOIRE & CAPITALISATION
| Objet | NAÎT | ÉVOLUE | VALIDÉ | ARCHIVÉ | RÉUTILISÉ |
|---|---|---|---|---|---|
| **Projet** | création (porté par une **Intention**) ; **copie** des valeurs Univers/Personnage/Bibliothèque utiles (M12) | par **Décisions** successives | quand un **Livrable** existe | jamais détruit : passe en **archivé** (rouvrable) | **rouvert**, **dupliqué**, sert de **modèle** (copie) |
| **Série (M2, conteneur)** | créée dans un Univers | gagne/perd des projets membres | — | archivable | ligne éditoriale réappliquée (copie) |
| **Décision** | à chaque choix structurant (+ **raison**) | immuable ; enrichie *(M13)* ou supersédée par une nouvelle | « prise » par l'acte | **jamais supprimée** | **relue** (mémoire) ; peut inspirer une règle |
| **Évaluation de cohérence** | **dérivée en continu** (lecture des 10 pièces vs Intention) | recalculée à chaque changement | un **« écart assumé »** = une **Décision** | — (état dérivé) | guide les arbitrages |
| **Historique** | continu (alimenté par Décisions/Versions/Publications) | s'enrichit | — | **permanent (jamais purgé)** | consultation / audit |
| **Bibliothèque** | possédée par l'Univers | enrichie de Briques | par usage | brique archivable | **copiée** dans les projets |
| **Brique réutilisable (Preset)** | **promotion** d'un acquis (+ provenance) | enrichie | par usage | archivable | **copiée** dans un projet (jamais lien vivant) |

---

## D. ANCRAGE SUR LES PILIERS (pourquoi ces cycles de vie)

- **Naissance par copie (Univers/Personnage/Bibliothèque → Projet)** → ⑤ Confiance + ⑥ Contrôle + E124 :
  un projet né est **stable et autonome**, à l'abri des modifications ultérieures de ses sources.
- **RAW/Versions/Décisions jamais supprimés** → ③ Mémoire + ⑥ Contrôle : on peut toujours revenir, comparer,
  auditer.
- **Décision = acte + raison, immuable, relisible** → ③ Mémoire (cœur) : le projet reste **compréhensible
  des mois après**.
- **Candidate/Variante réversibles, Média actif réassignable** → ⑥ Contrôle : rien n'est figé avant la
  Publication.
- **Publication = seul cycle à terminaison définitive** → ⑥ : « le seul acte définitif : publier ».
- **Évaluation de cohérence dérivée en continu** → ② Cohérence : la dérive est lue en permanence, mais
  **seule une Décision** (écart assumé) la « referme » — l'outil ne décide jamais seul.

---

## E. QUESTIONS DE MODÉLISATION OUVERTES (Phase 3)

| # | Question | Défaut proposé | Raison | Statut |
|---|---|---|---|---|
| **M13** | La **raison** d'une Décision est-elle **obligatoire** ou proposée ? | **Proposée systématiquement, obligatoire pour les choix structurants** (rejet, abandon de direction, validation de livrable) ; optionnelle pour les choix mineurs | équilibre mémoire (③) et fluidité/confiance (⑤ : ne pas bloquer en silence, mais ne pas perdre le pourquoi des grands choix) | 🆕 à confirmer |
| **M14** | Peut-on **enrichir** la raison d'une Décision après coup ? | **Oui** (ajout daté), sans réécrire le fait initial (immuable) | la compréhension peut se préciser plus tard sans falsifier l'historique | 🆕 à confirmer |
| **M15** | Granularité : **qu'est-ce qui est « structurant »** (donc tracé comme Décision) vs un simple ajustement ? | Structurant = ce qui **change une direction ou fixe un devenir** (conserver/rejeter/remplacer/valider/abandonner) ; le réglage fin (ex. retouche d'image) n'est pas une Décision tracée | éviter de noyer la mémoire sous le bruit | 🆕 à confirmer |

> Rappel : M1→M12 sont **tranchées et intégrées**. M13–M15 concernent la **finesse du modèle de Décision**,
> cœur du pilier Mémoire.

---

⏸️ **FIN DE LA PHASE 3.** Les phases 4 (Actions / verbes métier par objet) et 5 (Règles métier
fondamentales) **ne sont pas traitées ici** : elles attendent le signal. La Décision a été traitée comme
**point critique** (section B).

_Phase 3 — cycle de vie. Dérivé de E127 (6 piliers). Phases précédentes : `docs/MODELE_METIER_PHASE1.md`,
`docs/MODELE_METIER_PHASE2.md`. Aucune implémentation, aucune représentation. Lecture seule._

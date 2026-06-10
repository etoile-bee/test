# PLAN DE RÉALISATION — V1

> **EN-TÊTE DE GOUVERNANCE (E131)**
> - **Statut** : **B — Formalisation** (ordonnance des capacités **déjà validées**, sans rien rouvrir).
> - **Acquis-source(s)** : `V1_FONCTIONNELLE` + **fondation close** (5 espaces, Lois I/II, invariants
>   INV-1→15, **E128–E131**, `AUDIT_REALISATION` dont les **10 critères**).
> - **Modifie un élément déjà verrouillé** : **NON.**
>
> **Principe directeur** : **vitesse d'apprentissage** et **tests réels** > exhaustivité. **Plus petit
> incrément testable d'abord.** **Simulation de génération** (matière mockée) **tant que possible** pour
> apprendre **sans dépenser**.
> **Contraintes** : tout sous **E118** (qualité avant livraison) / **E119** (livraison cohérente), derrière
> **`/v4`**, **zéro dépense par défaut**. La **génération réelle = bascule séparée décidée par Etoile**,
> jamais automatique. **Aucun paradigme média-au-centre** (repos sans média, matière convoquée). **Aucune
> implémentation dans ce document** (c'est le plan).

---

## 1. LES 7 FONCTIONS — fiches de réalisation
> Chaque fiche : **Ordre · Dépendances · Critères de recette (observables) · Testable immédiatement ·
> Simulable · Nécessite génération réelle.**

### F1 — CRÉER un projet  *(Ordre : 2)*
- **Dépendances** : Socle (écrire un projet), Univers (copie d'amorce), Pilotage (écrit), Conscience
  (première lecture) — donc **après** le socle technique de lecture/écriture (Lot 0).
- **Recette** : créer un projet en **≤ ~4 actions** (esquissable) ; **identité stable** ; **entrée immédiate
  en mémoire** ; **copie d'amorce** depuis l'Univers (pas de lien vivant) ; le repos s'affiche aussitôt.
- **Testable immédiatement** : oui (création + retour au repos), **sans aucune génération**.
- **Simulable** : N/A (pas de matière) — fonction **100 % non-dépensière**.
- **Génération réelle** : **non**.

### F2 — REPRENDRE un projet  *(Ordre : 3)*
- **Dépendances** : F1 (des projets existent), Socle (faits), Conscience (recalcul situation/titre).
- **Recette** : **repos instantané, sans média** ; rouvrir redonne **exactement** cap+situation+mémoire ;
  **lecture recalculée** (jeter le cache → même lecture).
- **Testable immédiatement** : oui (créer puis rouvrir), **sans génération**.
- **Simulable** : N/A.
- **Génération réelle** : **non**.

### F3 — PRODUIRE une image  *(Ordre : 4)*
- **Dépendances** : F1/F2, Pilotage (commande+contrat, écrit le verdict), Atelier (dépose le fait-média),
  Conscience (coût estimé, inventaire-faits), Socle (dépôt + décision).
- **Recette** : **contrat affiché avant** (coût) ; **aucune production sans confirmation** ; l'Atelier
  dépose une **candidate + RAW** (état `candidate` **seulement**) ; l'auteur **décide** le devenir **+
  raison** ; **décision relisible** ; **dépense annoncée = dépense réelle** (quand réelle).
- **Testable immédiatement** : oui **en simulation** (parcours complet sans dépense).
- **Simulable** : **OUI** — **candidate mockée** (faux média) déposée comme fait `candidate`+RAW factice ; le
  **parcours décisionnel est identique**, **zéro dépense**.
- **Génération réelle** : **oui** (bascule séparée) — déclenchée **uniquement** par confirmation **+ GO
  Etoile** (INV-12).

### F4 — PRODUIRE une vidéo  *(Ordre : 6)*
- **Dépendances** : **F3** (image retenue = source), Pilotage, Atelier, Conscience, Socle ; même projet.
- **Recette** : depuis une **image retenue**, **script** minimal + **voix** + **montage simple** ;
  **contrat + gate QC avant** ; **lecture** du résultat + **décision** de retenue ; **un seul projet**
  (image→vidéo sans changer d'outil).
- **Testable immédiatement** : oui **en simulation** (vidéo mockée).
- **Simulable** : **OUI** — **rendu mocké** (faux clip) ; parcours identique, zéro dépense.
- **Génération réelle** : **oui** (image réelle + voix + lipsync/rendu) — **gatée** (confirmation + GO Etoile).

### F5 — DÉCISIONS + MÉMOIRE  *(Ordre : 1 — transversal, posé tôt)*
- **Dépendances** : Socle (écrire décisions/états), Conscience (**impact aval = dérivation**, historique-vue),
  Pilotage (écrit) — **prérequis de toutes les autres** (toute décision passe par ici).
- **Recette** : chaque choix structurant **persisté** comme **Décision + raison** (sur le structurant) ;
  **impact aval présenté** (garder/MAJ/régénérer) **au choix, jamais en silence** ; **historique relisible**
  (actions + raisons) ; **rien d'effacé** ; impact aval **calculé par la Conscience**, consommé par le
  Pilotage (AUD-G1).
- **Testable immédiatement** : oui (dès qu'on peut poser une décision simple, ex. au repos / sur F1).
- **Simulable** : N/A (la mémoire ne dépense pas).
- **Génération réelle** : **non**.

### F6 — CONSTITUER un livrable  *(Ordre : 5)*
- **Dépendances** : F3 (et/ou F4) — matière retenue ; Versions ; Socle ; Pilotage.
- **Recette** : **retenir une version** → **livrable autoporteur** (média final + script + légende courte +
  hashtags + paramètres + RAW) ; **choix image/vidéo/les deux** ; passage à l'état **`prêt-à-poster`** ;
  paquet **complet sans reconstruire le contexte**.
- **Testable immédiatement** : oui **en simulation** (livrable à partir de matière mockée).
- **Simulable** : **OUI** (matière mockée → livrable « fictif » complet).
- **Génération réelle** : **non** par elle-même (elle **emballe** ce qui existe ; le coût est en amont F3/F4).

### F7 — PUBLIER  *(Ordre : 7)*
- **Dépendances** : F6 (livrable prêt), Pilotage, Socle.
- **Recette** : **dernier regard** (lecture + faits/invitations) ; **publier = irréversible, annoncé et
  confirmé avant** ; version **figée** ; **reste en mémoire** ; sort de la file `prêt-à-poster`.
- **Testable immédiatement** : oui (sur livrable simulé) — **publier = statut**, **sans** auto-diffusion.
- **Simulable** : **OUI** (publication = changement de statut ; pas de mise en ligne réelle en V1).
- **Génération réelle** : **non** (l'auto-diffusion est **hors V1**, déjà acté).

---

## 2. DÉCOUPAGE EN LOTS (ordonnés)
> Chaque lot : **Contenu · Prérequis · Critère de fin/recette · Testable sur iPhone ?**

- **Lot 0 — Socle de lecture/écriture + repos** : pouvoir **écrire des faits** au Socle et **dériver une
  lecture** (situation/titre minimaux) ; le **repos** s'affiche, **sans média**.
  *Prérequis* : néant. *Recette* : un projet « vide » s'ouvre et **affiche un repos instantané**.
  *iPhone* : **oui**.
- **Lot 1 — Décisions + mémoire (F5)** : poser une **Décision + raison**, la **relire** ; **impact aval**
  (dérivation Conscience) présenté/consommé.
  *Prérequis* : Lot 0. *Recette* : une décision posée est **relisible** ; impact aval **au choix**.
  *iPhone* : **oui**.
- **Lot 2 — Créer + Reprendre (F1, F2)** : création **≤~4 actions** + **copie d'amorce** ; **reprise**
  instantanée, état exact.
  *Prérequis* : Lots 0-1. *Recette* : créer puis rouvrir = **même cap+situation+mémoire**, sans média.
  *iPhone* : **oui**.
- **Lot 3 — Produire image en SIMULATION (F3 mock)** : convocation **sous contrat** (coût **affiché**) →
  **candidate mockée** + RAW factice → **décision + raison** ; **zéro dépense**.
  *Prérequis* : Lots 0-2. *Recette* : parcours image **complet sans dépense** ; **rien ne part sans
  confirmation**. *iPhone* : **oui**.
- **Lot 4 — Livrable + Publier en SIMULATION (F6, F7 mock)** : retenue de version → **livrable autoporteur**
  (fictif) → **prêt-à-poster** → **publier (statut, irréversible, confirmé)**.
  *Prérequis* : Lot 3. *Recette* : boucle **idée→publié simulée de bout en bout**, **zéro dépense**.
  *iPhone* : **oui**.
- **Lot 5 — Produire vidéo en SIMULATION (F4 mock)** : image retenue → script+voix+montage simple → **rendu
  mocké** → décision.
  *Prérequis* : Lot 3. *Recette* : parcours vidéo simulé complet, zéro dépense. *iPhone* : **oui**.
- **Lot 6 — Bascule GÉNÉRATION RÉELLE (gate)** : remplacer la simulation par la **vraie matière**, **derrière
  confirmation (INV-12) + GO Etoile**. Image d'abord, vidéo ensuite.
  *Prérequis* : Lots 3-5 verts en simulation. *Recette* : **dépense annoncée = dépense réelle** ; **aucune
  dépense sans confirmation** ; **désactivable** (retour simulation). *iPhone* : **oui** *(après GO,
  dépense réelle)*.
- **Lot 7 — Durcissement V1 (E118)** : passe qualité (10 critères de l'audit), recherche de régressions,
  vérification d'étanchéité inter-projets, instantanéité du repos.
  *Prérequis* : tous. *Recette* : **10/10 critères** observés au vert. *iPhone* : **oui**.

> **Tout est testable sur iPhone dès le Lot 0**, et **toute la boucle est éprouvable en SIMULATION (Lots
> 0-5) sans dépenser un centime** avant la bascule réelle (Lot 6).

---

## 3. LE PLUS PETIT INCRÉMENT TESTABLE SUR IPHONE
> **Lot 0** : ouvrir un projet (même « vide ») et **voir un repos instantané, sans média** (cap+situation
> minimaux). C'est le **tout premier truc éprouvable en main réelle** — il valide d'emblée le
> non-négociable n°1 (repos instantané) **sans aucune génération ni dépense**.

---

## 4. LES 4 JALONS EXACTS (réel vs simulé · dépense gatée)

| Jalon | À partir de quel lot | Réel vs simulé | Dépense |
|---|---|---|---|
| **CRÉER un projet réel** | **Lot 2** | **RÉEL** (vrai projet en mémoire, copie d'amorce) | **aucune** |
| **GÉNÉRER une image** | **simulée dès Lot 3** ; **réelle au Lot 6** | simulée (candidate mockée) → puis **réelle** | simulée = **0** ; réelle = **gatée** (confirmation INV-12 **+ GO Etoile**) |
| **GÉNÉRER une vidéo** | **simulée dès Lot 5** ; **réelle au Lot 6** (après l'image réelle) | simulée (rendu mocké) → puis **réelle** | simulée = **0** ; réelle = **gatée** (confirmation **+ GO Etoile**) |
| **PUBLIER** | **Lot 4** | **RÉEL en tant que statut** (le livrable passe « publié », figé, conservé) ; **auto-diffusion = hors V1** | **aucune** |

> Précisions : « créer » et « publier » sont **réels dès le départ** (ils ne dépensent pas). « Générer »
> est **réel au sens du parcours dès la simulation**, et **réel au sens de la matière** seulement au **Lot
> 6**, **toujours sous confirmation + GO Etoile**. La bascule réelle est **réversible** (retour simulation).

---

## VÉRIFICATION E131
Ce plan **n'introduit aucun objet/invariant/règle/gouvernance nouveau** : il **ordonne** des capacités V1
**déjà validées** et **respecte** E118/E119 + tous les invariants. **→ Reste catégorie B.** Aucun arrêt D.

## VERDICT
> **🟢 PLAN V1 PRÊT.** 7 fonctions ordonnancées · **8 lots** (0→7) testables sur iPhone · **plus petit
> incrément** = repos instantané (Lot 0) · **4 jalons** clairs (créer Lot 2 · image simulée Lot 3/réelle Lot
> 6 · vidéo simulée Lot 5/réelle Lot 6 · publier Lot 4). **Toute la boucle est apprenable en SIMULATION sans
> dépense** ; la **génération réelle est une bascule séparée, gatée par confirmation (INV-12) + GO Etoile**.
> Aucun non-négociable sacrifié, aucun paradigme média-au-centre. **Prêt pour le go d'Etoile vers la
> construction du Lot 0** (sous E118/E119, derrière `/v4`, zéro dépense).

_Plan de réalisation V1 — formalisation (B). Dérivé de `V1_FONCTIONNELLE` + fondation close. Aucune
implémentation, aucun nouvel objet/invariant/règle. Live intact. Lecture seule._

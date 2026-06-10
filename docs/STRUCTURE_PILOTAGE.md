# STRUCTURE LOGIQUE DU PILOTAGE — l'orchestrateur des décisions de l'auteur

> **Statut : ANALYSE — le plus délicat (seul espace qui ÉCRIT décisions/états au Socle).** **Structure pure,
> aucun écran, aucune technologie, aucune implémentation.** Live intact · fichiers verrouillés intacts ·
> zéro dépense.
>
> **Contrainte absolue** : aucun nouvel objet · aucun nouvel invariant · aucune nouvelle règle métier ·
> aucune **interprétation sémantique**. **Discipline d'arrêt** : si une responsabilité exigeait de franchir
> la **Loi I** (décider) ou la **Loi II** (interpréter) → **ARRÊT IMMÉDIAT + signalement**. *(Résultat :
> aucun franchissement — voir verdict.)*
>
> **Canon** : modèle v2 · `ARCHITECTURE_SYSTEME` · `CARTOGRAPHIE_RESPONSABILITES` · `AUDIT_DE_SEPARATION…`
> (E128) · `STRUCTURE_SOCLE/CONSCIENCE/UNIVERS/ATELIER` · E129 · E130. **Lois I/II.**
>
> **Principe directeur** : le Pilotage est un **exécutant + relayeur + routeur**. Il **met en œuvre** ce que
> **l'auteur décide**, **relaie** ce que la **Conscience calcule**, **persiste** les **faits** dans le
> **Socle**. Il **n'origine** aucune décision (Loi I), **n'interprète** aucun sens (Loi II), **ne calcule**
> aucune lecture.

---

## 1. RESPONSABILITÉS EXACTES
- **Qualifier l'action** de l'auteur (structurant vs local) via **M15 canonique** (E128-1, jamais redéfini).
- **Persister la décision exprimée par l'auteur** : écrire au Socle la **Décision** (action + objet visé +
  **raison verbatim de l'auteur**) et le **changement d'état/verdict** correspondant.
- **Présenter et exécuter l'impact aval CHOISI** : exposer les 3 options (garder / mettre à jour /
  régénérer) et appliquer **le choix de l'auteur** — jamais en silence.
- **Relayer le carrefour calculé par la Conscience** (focalisation) — sans le recalculer.
- **Proposer le prochain geste** : **mapping strict** de la focalisation (E128-2) — proposé, jamais imposé.
- **Router entre espaces** : convoquer l'Atelier (commande + contrat), demander une lecture à la Conscience,
  copier depuis / promouvoir vers l'Univers — de façon **déterministe**.

---

## 2. DONNÉES POSSÉDÉES
- **AUCUNE donnée durable.** Seulement des **pointeurs de session transitoires** (posture repos/travail,
  projet actif, contexte de convocation) — **reconstructibles** depuis le Socle (E122).

---

## 3. CE QU'IL LIT / ÉCRIT / CALCULE
- **Lit** : **la lecture produite par la Conscience** (situation/titre/focalisation/carrefour/signaux) +
  **les faits du Socle** (pour agir en connaissance et router).
- **Écrit** (au Socle, **seul espace à le faire pour décisions/états**) : **Décisions + raisons**,
  **changements d'état / verdicts** (devenir d'un média), **marqueurs de polarité protégée** (sur ordre de
  l'auteur), **copies d'amorce** (Univers→Socle), **promotions** (Socle→Univers).
- **Calcule** : **AUCUNE lecture.** Il **consomme** la focalisation (E128-2) ; il calcule au plus la
  **qualification** (M15) et le **routage** — qui sont des **applications de règles canoniques**, pas des
  lectures.

---

## 4. INTERDITS EXPLICITES
Le Pilotage **ne peut JAMAIS** :
- **originer une décision** (la décision vient de **l'auteur** — Loi I) ;
- **recalculer une lecture / une focalisation / un carrefour** (réservé à la Conscience — E128-2) ;
- **fabriquer une raison** (au plus marquer la décision **« incomplète »** — M17) ;
- **interpréter le sens** (Loi II / E129) ;
- **détenir du durable** (E122) ;
- **devenir le centre** (il orchestre, il n'est pas le sujet) ;
- **arbitrer un conflit de valeur** (tout conflit de valeur → **remonté à l'auteur**).

---

## 5. INVARIANTS PROTÉGÉS
- **Loi I** — exécute/propose, **ne décide pas** ;
- **E128** — (1) M15 canonique unique ; (2) prochain geste = mapping de la focalisation ; (3) il **attache**
  le verdict (l'Atelier ne le fait jamais) ;
- **INV-4** — décision = **pourquoi** (raison de l'auteur) ;
- **INV-6** — réversibilité : impact aval **au choix**, jamais d'effacement silencieux ;
- **INV-12** — contrat d'effet : annonce avant d'agir ;
- **M16/M17** — 1 action structurante = 1 décision ; sans raison = **incomplète** (jamais inventée) ;
- **E130** — il écrit la vérité du **projet** (Socle), jamais celle du monde ni la lecture.

---

## 6. DÉPENDANCES
- **Entrée** : les **actions de l'auteur** ; la **lecture** de la Conscience ; les **faits** du Socle.
- **Sortie** : **écrit** au Socle (décisions/états/verdicts/marqueurs/copies) ; **convoque** l'Atelier
  (commande + contrat) ; **demande un recalcul** à la Conscience après écriture ; **copie/promeut** vers/
  depuis l'Univers.
- **Sens des flux** : `Auteur → Pilotage` · `Conscience → (lecture) → Pilotage` · `Socle ↔ Pilotage
  (lit/écrit)` · `Pilotage → Atelier (convocation)` · `Pilotage ↔ Univers (copie/promotion)`. **Jamais**
  `Pilotage → (calcul de lecture)`, **jamais** `Pilotage → (décision originée)`.

---

## 7. PREUVES D'ÉTANCHÉITÉ
- **(a) Aucun durable** : seuls des **pointeurs reconstructibles** ; les supprimer et rouvrir le projet
  redonne le même état (reconstruit depuis le Socle). **🟢** *(E122 · INV-9)*
- **(b) N'écrit que des faits décidés par l'auteur** : Décisions (raison **verbatim**), états/verdicts,
  marqueurs (sur ordre), copies/promotions — **jamais** une lecture, **jamais** une raison inventée. **🟢**
- **(c) Ne calcule aucune lecture** : il **consomme** la focalisation (E128-2) ; il n'a **ni** situation,
  **ni** titre, **ni** carrefour propres. **🟢**
- **(d) Écrit dans la seule source** : tout va au **Socle** (vérité du projet) ; aucune source parallèle.
  **🟢** *(INV-10 · E130)*

---

## 8. VÉRIFICATION EXPLICITE — les 4 « ne devient JAMAIS »
- **Un décideur ?** → **NON.** Il **persiste** la décision **de l'auteur** ; il **propose** (geste,
  options) ; il **n'origine** rien. *(Loi I)*
- **Une seconde conscience ?** → **NON.** Il **ne calcule aucune lecture** ; il **relaie** la focalisation,
  ne la recalcule pas. *(E128-2)*
- **Une seconde source de vérité ?** → **NON.** **Aucun durable** ; il **écrit dans le Socle**, n'en double
  rien. *(E122 · INV-10)*
- **Un interprète du sens ?** → **NON.** Il **n'attribue aucun sens** ; il **transcrit** la raison de
  l'auteur (ou marque « incomplète »). *(Loi II · E129 · M17)*

---

## PREUVE ADVERSARIALE — les 6 ZONES DANGEREUSES
> Pour chacune : **(a)** ce qui est **déterministe** · **(b)** ce qui provient d'une **décision déjà
> exprimée par l'auteur** · **(c)** ce que le Pilotage **n'a PAS le droit d'inventer**.

### Z1 — QUALIFICATION structurant / local
- **(a) Déterministe** : application de **M15 canonique** (E128-1) à l'action posée.
- **(b) De l'auteur** : l'**action** elle-même (le geste posé).
- **(c) Interdit d'inventer** : **aucun critère** propre ; M15 n'est **jamais redéfini** localement.

### Z2 — ÉCRITURE DES DÉCISIONS
- **(a) Déterministe** : la **structure** de la décision (action · objet visé · horodatage · état).
- **(b) De l'auteur** : le **CHOIX** et la **RAISON** (verbatim).
- **(c) Interdit d'inventer** : **fabriquer une raison**. Sans raison → décision **« incomplète »** (M17),
  jamais une raison reconstituée par le Pilotage.

### Z3 — IMPACT AVAL
- **(a) Déterministe** : la **détection** des dépendances aval (faits du Socle) + la **présentation** des 3
  options (garder / mettre à jour / régénérer).
- **(b) De l'auteur** : le **CHOIX** parmi les 3.
- **(c) Interdit d'inventer** : **auto-appliquer** un choix **en silence** (INV-6/12) ; **décider** à la
  place de l'auteur.

### Z4 — PROPOSITION DE CARREFOUR
- **(a) Déterministe** : le **relais** du carrefour **tel que calculé par la Conscience** (focalisation).
- **(b) De l'auteur** : —  *(le carrefour est une lecture, pas une décision ; l'auteur tranchera dessus.)*
- **(c) Interdit d'inventer** : **calculer son propre carrefour** ou **choisir une branche** à la place de
  l'auteur. *(E128-2)*

### Z5 — EXÉCUTION DU PROCHAIN GESTE
- **(a) Déterministe** : **mapping strict** de la focalisation (E128-2).
- **(b) De l'auteur** : la **décision de l'exécuter** (le geste est **proposé**).
- **(c) Interdit d'inventer** : **recalculer** la focalisation ou **choisir un autre geste** que le mapping.

### Z6 — GESTION DES CONFLITS ENTRE ESPACES
- **(a) Déterministe** : **routage** (qui écrit où, dans quel ordre) selon les responsabilités gravées +
  **escalade** systématique des conflits de valeur **à l'auteur**.
- **(b) De l'auteur** : la **résolution** de tout **conflit de valeur** (que garder, que privilégier).
- **(c) Interdit d'inventer** : **arbitrer un conflit de valeur** lui-même. Conflit **technique/de routage**
  = résolu par règle déterministe ; conflit **de valeur** = **toujours remonté à l'auteur**, jamais tranché
  par le Pilotage.

> **Synthèse adversariale** : dans **chaque** zone, le Pilotage se réduit à **(déterministe) + (décision/
> raison de l'auteur)** ; **rien** ne tombe dans « inventé par le Pilotage ». **Aucune zone n'exige de
> franchir la Loi I ou la Loi II.**

---

## VERDICT
> **🟢 VERT — Pilotage conforme.** Responsabilités, données (aucun durable), lit/écrit/calcule (écrit des
> faits, ne calcule aucune lecture), interdits, invariants, dépendances, **preuves d'étanchéité** (a/b/c/d),
> **4 « ne devient jamais »** et **preuve adversariale des 6 zones** **tiennent SANS aucun ajout** : **aucun
> nouvel objet/invariant/règle, aucune interprétation, aucune décision originée**. Le Pilotage **exécute**
> (la décision de l'auteur), **relaie** (la lecture de la Conscience), **persiste** (les faits au Socle) —
> et **escalade** tout conflit de valeur à l'auteur. **Aucun franchissement Loi I/II ; aucun point d'arrêt
> déclenché.**

---

## SUITE (à la main d'Etoile)
**Les 5 espaces sont désormais formalisés** (Socle · Univers · Conscience · Atelier · Pilotage), tous
**verts**, sous E128/E129/E130. L'étape suivante — **l'audit global des 5 espaces** (cohérence d'ensemble,
re-vérification de l'étanchéité de bout en bout) — ne sera menée **qu'au feu vert d'Etoile**. Aucune
implémentation sans feu vert ; réalisation future sous E118/E119, derrière `/v4`, zéro dépense.

_Structure logique du Pilotage — dérivée du canon verrouillé. Aucune implémentation, aucune technologie,
aucun écran, aucun nouvel objet. Live intact. Lecture seule._

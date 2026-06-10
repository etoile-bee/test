# CONTRE-VÉRIFICATION CIBLÉE — AUD-G1 (impact aval reclassé)

> **Statut : AUDIT ADVERSARIAL ciblé.** Vérifie que la correction **AUD-G1** (détection de l'impact aval =
> **dérivation de la Conscience**, **consommée** par le Pilotage) **résout** le point **sans en créer
> d'autre**. **Aucune implémentation.** Live intact · zéro dépense.
>
> **Correction actée** *(clarification d'attribution — comportement « impact aval » déjà validé [[E115]],
> aucun nouvel objet/invariant/règle)* :
> - **Conscience** : « impact aval » **ajouté** à ses dérivations (recalculable, non stockée — INV-9/E130) ;
> - **Pilotage** : **détection retirée** → il ne fait plus que **consommer + présenter (garder/MAJ/
>   régénérer) + exécuter** le choix de l'auteur.
> Inscrit dans `STRUCTURE_CONSCIENCE` (§1 + table des calculs) et `STRUCTURE_PILOTAGE` (§1, §3, Z3).

---

## 1. AUD-G1 DISPARAÎT-IL ?
- **Le Pilotage ne détecte plus de dépendances ?** → **🟢 OUI.** §1/§3/Z3 de `STRUCTURE_PILOTAGE`
  réécrits : « **consomme** … **ne la calcule plus** » ; Z3(c) interdit explicitement au Pilotage de
  **détecter lui-même** les dépendances.
- **La Conscience la dérive ?** → **🟢 OUI.** `STRUCTURE_CONSCIENCE` §1 liste « impact aval » (14ᵉ
  dérivation) + ligne dédiée dans la table des calculs (recalculable depuis le graphe de dépendances du
  Socle).
- **Le Pilotage la consomme ?** → **🟢 OUI.** §3 « Lit … + **impact aval** (AUD-G1) » ; §1 « consommer,
  présenter, exécuter ».
> **AUD-G1 est résolu** : la **détection** (lecture) est à la **Conscience** ; la **présentation/exécution**
> (action) est au **Pilotage**.

---

## 2. AUCUNE NOUVELLE AMBIGUÏTÉ DU FAIT DU RECLASSEMENT ?
- **La Conscience devient-elle une seconde source ?** → **🟢 NON.** L'impact aval est une **dérivation
  recalculable** depuis les **faits du Socle** (graphe de dépendances), **non stockée** ; la Conscience ne
  détient toujours **aucun durable** (INV-10).
- **INV-9 tenu ?** → **🟢 OUI.** L'impact aval se **recalcule** intégralement depuis le Socle ; le supprimer
  et le régénérer redonne le même résultat (cohérent `TEST_RECONSTRUCTION_SOCLE`).
- **INV-10 tenu ?** → **🟢 OUI.** Aucune source nouvelle ; la dépendance est **lue**, pas **détenue**.
- **Le Pilotage reste-t-il pur exécutant/relayeur ?** → **🟢 OUI.** Il **consomme** une lecture de plus
  (l'impact aval), **présente**, **exécute** — il ne **calcule** toujours **aucune** lecture (E128-2).
- **Doublon de calcul ?** → **🟢 NON.** L'impact aval est calculé **une seule fois**, par la **Conscience**
  (un calcul = un espace) ; le Pilotage ne le recalcule pas.
- **Dépendance circulaire Conscience↔Pilotage ?** → **🟢 NON.** La Conscience **ne dépend que du Socle**
  (elle ne lit pas le Pilotage). Le Pilotage **consomme** la sortie de la Conscience puis **écrit au
  Socle** ; la Conscience **recalcule** ensuite depuis le Socle. C'est une **séquence temporelle**
  (lecture → choix → écriture → recalcul), **pas** une dépendance circulaire de définition.

---

## 3. RE-PASSAGE DES 9 AXES DE L'AUDIT GLOBAL
| # | Axe | Résultat après AUD-G1 |
|---|---|---|
| 1 | Responsabilités dupliquées | **🟢** — détection (Conscience) ≠ présentation/exécution (Pilotage), disjointes |
| 2 | Responsabilités orphelines | **🟢** — l'impact aval a désormais **un propriétaire clair** (Conscience pour le calcul) ; **AUD-G1 (l'orpheline/ambiguë) est résorbée** |
| 3 | Calculs dupliqués | **🟢** — impact aval calculé **une seule fois** (Conscience) ; coût estimé≠réel ; M15 unique ; geste = mapping |
| 4 | Données durables hors Socle/Univers | **🟢** — aucune (impact aval = dérivation non stockée) |
| 5 | Lois I/II | **🟢** — détection = **factuelle** (graphe de dépendances, aucun sens) ; le Pilotage ne décide pas (choix = auteur) |
| 6 | INV-9 / INV-10 | **🟢** — impact aval recalculable, non stocké ; source unique préservée |
| 7 | Dépendances circulaires | **🟢** — aucune (Conscience ne dépend que du Socle ; feedback temporel, pas cyclique) |
| 8 | Captations discrètes de pouvoir | **🟢** — la captation (Pilotage calculant une lecture) est **supprimée** ; aucune nouvelle |
| 9 | Anti-patterns production/média | **🟢** — inchangé (rien de média réintroduit) |

---

## 4. VERDICT
> **🟢 VERT — aucun point résiduel.** La correction **AUD-G1** est **inscrite** dans les deux docs ; le point
> **disparaît** (détection = Conscience, consommation/présentation/exécution = Pilotage) ; **aucune nouvelle
> ambiguïté** n'apparaît ; les **9 axes** repassent **tous au vert**. **Aucun ORANGE, aucun ROUGE.**
>
> **Conséquence** : l'architecture des **5 espaces** est désormais **entièrement verte** — cohérente,
> étanche, sans contradiction, sans captation, sans doublon, sans dépendance circulaire. **La fondation peut
> être close** (à la décision d'Etoile).
>
> *(Rappel — hors périmètre de cette contre-vérification : la **calibration des signaux** A/B reste un
> **point ouvert** explicitement signalé, **non gravé** ; il n'affecte pas l'étanchéité des espaces.)*

---

_Contre-vérification ciblée AUD-G1 — dérivée du canon verrouillé. Aucune implémentation, aucun nouvel objet/
invariant/règle. Live intact. Lecture seule._

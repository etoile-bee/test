# MODÈLE MÉTIER — PHASE 5 : RÈGLES FONDAMENTALES + INVARIANTS

> **Statut : ANALYSE / MODÉLISATION — PHASE 5 (DERNIÈRE phase).** Règles métier fondamentales + invariants
> indépendants du médium. **Zéro vocabulaire d'interface.** Live intact · fichiers verrouillés intacts ·
> aucune dépense.
>
> **Phases 1→4 validées (10/06) — M1→M17 toutes tranchées.** Le modèle d'objets (34 objets / 5 familles),
> leurs relations, leurs cycles de vie et leurs actions (squelette OBJET/ÉTAT/ACTION/DÉCISION) sont figés.
>
> **Ancrage `E127`** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.
> **Phrase centrale** : « Je pilote la transformation d'une intention en contenu publiable, par une suite de
> décisions cohérentes, réversibles et mémorisées, dans un système en qui j'ai confiance — jusqu'au seul
> acte définitif : publier. »

---

## RÈGLES FONDAMENTALES — les 7 catégories

> Pour chaque règle : **énoncé · objets concernés · pilier(s)**. Les piliers dominants sont **⑤ Confiance**,
> **⑥ Contrôle** et **③ Mémoire**.

### 1. Ce qui est IMPOSSIBLE À PERDRE
**Énoncé** : ces éléments doivent **toujours être retrouvables**, quelles que soient les manipulations,
fermetures ou pannes. Aucun n'est laissé dans un emplacement volatile.

| Objet concerné | Pourquoi impossible à perdre |
|---|---|
| **Intention** (composite) | la boussole — sans elle, plus rien n'a de sens |
| **Décisions** (+ raisons / annotations) | le **pourquoi** du projet (③) |
| **RAW / médias intermédiaires** | matière d'origine, audit d'un défaut (③/⑥) |
| **Versions** | points de retour (⑥) |
| **Variantes** (même écartées) | réactivables jusqu'à la publication (⑥) |
| **Livrables** validés | le résultat publiable |
| **Historique** | mémoire chronologique complète (③) |
| **Coûts** réels | traçabilité de la dépense (⑤) |

**Piliers** : ③ Mémoire · ⑤ Confiance · ⑥ Contrôle.

### 2. Ce qui est IMPOSSIBLE À MODIFIER
**Énoncé** : certains objets sont **immuables dans leur fait** ; on peut **ajouter** (annoter, versionner)
mais **jamais réécrire le passé**.

| Objet concerné | Règle d'immuabilité |
|---|---|
| **Décision** (fait posé) | immuable ; on **annote** (daté, M14), on **supersède**, on ne réécrit pas (③) |
| **RAW / médias intermédiaires** | jamais écrasés ni retouchés |
| **Version** (instantané) | figée une fois prise ; une restauration n'en altère aucune |
| **Publication** (événement passé) | un acte publié est un fait définitif |
| **Entrée d'Historique** | jamais réécrite |
| **Provenance** d'une Brique | trace d'origine non falsifiable (③/④) |

**Piliers** : ③ Mémoire · ⑤ Confiance.

### 3. Ce qui est IMPOSSIBLE À SUPPRIMER
**Énoncé** : ces objets ne disparaissent **jamais** ; au pire ils sont **archivés** (conservés, hors flux
actif), jamais détruits.

| Objet concerné | Sort autorisé |
|---|---|
| **Projet** | archivé (jamais détruit, rouvrable) |
| **Décisions** + **Historique** | jamais supprimés (mémoire permanente, ③) |
| **RAW** + **Versions** | conservés durablement |
| **Livrables publiés** | conservés (trace de ce qui est sorti) |
| **Variantes / Candidates écartées** | écartées ≠ supprimées (réactivables jusqu'à publication, ⑥) |
| **Univers / Personnage / Brique** | archivables, jamais détruits |

**Piliers** : ③ Mémoire · ⑥ Contrôle. *(Distinction clé : **écarter/archiver ≠ supprimer**.)*

### 4. Ce qui est TOUJOURS RÉVERSIBLE (jusqu'à la publication)
**Énoncé** : tant qu'un contenu n'est pas publié, **toute décision peut être défaite** : revenir,
comparer, restaurer, réactiver, choisir **garder / mettre à jour / régénérer** — **au choix, jamais en
automatique**.

| Objet / action concernés | Réversibilité |
|---|---|
| **Média actif** (état) | réassignable à tout moment ; l'ancien redevient variante |
| **Variante écartée** | **réactivable** (nouvelle décision, sans effacer l'ancienne) |
| **Version** | **restaurable** (sans supprimer les autres) |
| **Look/Décor/Ambiance/Référence/Consigne** employés | remplaçables ; l'ancien reste dans l'historique de l'objet |
| **Intention / direction** | une direction abandonnée reste relisible et peut être reprise |
| **Aval impacté** (modif amont) | choix explicite **garder / mettre à jour / régénérer** — jamais d'effacement silencieux |

**Piliers** : ⑥ Contrôle (cœur) · ⑤ Confiance.

### 5. Ce qui devient IRRÉVERSIBLE
**Énoncé** : un **seul** acte est définitif. Tout le reste lui reste réversible **jusqu'à** lui.

| Objet concerné | Règle |
|---|---|
| **Publication** | **seul acte irréversible** ; la version publiée est figée et conservée. Avant publication : tout réversible. Après : la **trace** est permanente |

**Piliers** : ⑥ Contrôle (« le seul acte définitif : publier ») · ⑤ Confiance (l'irréversibilité est
**annoncée** clairement avant l'acte).

### 6. Ce qui doit SURVIVRE (fermeture · redémarrage · migration · changement d'interface)
**Énoncé** : l'**état complet** du travail doit survivre à toute interruption et à tout changement
technique. À la reprise, on retrouve **exactement** où on en était — **rien en silence**.

| Objet concerné | Doit survivre car… |
|---|---|
| **Projet** entier (intention, créatifs, médias, paramètres, états) | reprise exacte (⑤) |
| **Média actif** (état) + **Variantes** + **Versions** | continuité du travail (⑥) |
| **Décisions** + **Historique** + **Coûts** | mémoire et traçabilité (③) |
| **Univers / Personnage / Bibliothèque** + leurs **Briques** | capital réutilisable (④) |
| **Verrous** (référence/look/décor/consigne) | un verrou posé **tient** après reprise (⑤) |

**Piliers** : ⑤ Confiance (reprise exacte) · ③ Mémoire · ⑥ Contrôle · ④ Capitalisation.

### 7. Ce qui constitue la SOURCE DE VÉRITÉ
**Énoncé** : il existe **une seule source de vérité** ; toute lecture en découle, aucune représentation ne
la détient ni ne la double.

| Élément | Statut |
|---|---|
| **Dossier de PROJET** (intention, créatifs employés, médias, paramètres, médias actifs, versions, livrables, décisions, coûts, états) | **SOURCE DE VÉRITÉ du projet** |
| **UNIVERS** (bibliothèques, règles, lignes de publication, personnages, séries) | **SOURCE DE VÉRITÉ du monde** (copiée, jamais héritée vivante — M12) |
| **Historique** | **vue dérivée** de l'ensemble des projets/décisions/versions/publications |
| **Évaluation de cohérence** | **état dérivé** (jamais une source) |
| Toute liste (récents, prêt-à-poster, états) | **vues filtrées** d'une source unique, jamais un stockage parallèle |

**Piliers** : ⑤ Confiance · ③ Mémoire · ⑥ Contrôle. *(Principe : **les vues ne deviennent jamais la
vérité** ; la vérité vit dans le projet et l'univers.)*

---

## INVARIANTS DU MODÈLE — garanties indépendantes du médium

> **« Si ces règles sont respectées, peu importe que le rendu se fasse par messagerie, par le web, en
> application de bureau ou autrement, le système reste fidèle à sa philosophie. »** Ce sont les invariants
> que **toute future représentation devra respecter** — ils appartiennent au **domaine**, pas à la forme.

1. **INV-1 — Primauté de l'intention.** Tout projet possède une **Intention** (objet composite :
   message·émotion·public·objectif), présente et consultable en permanence ; toute production peut être
   confrontée à elle. *(①)*
2. **INV-2 — Question centrale permanente, sans décision automatique.** Le système sait, à tout moment,
   exprimer « **ce qui est produit sert-il encore l'intention ?** », **localiser** la pièce qui dérive
   parmi les **10** (message·image·look·décor·voix·script·montage·rythme·légende·publication) et **rendre
   l'écart visible** — il **ne décide jamais** à la place de la personne. *(②/⑥)*
3. **INV-3 — Séparation OBJET / ÉTAT / ACTION / DÉCISION.** Ces quatre notions restent distinctes ; un
   **état** n'est jamais confondu avec l'**objet** qui le porte, ni une **action** (geste) avec la
   **décision** (choix + raison) qu'elle matérialise. *(transverse)*
4. **INV-4 — Toute décision structurante porte son pourquoi.** Une décision structurante **majeure** exige
   une **raison** ; les autres la **proposent** ; une décision sans raison est **tracée mais marquée
   incomplète** (M13/M17). **1 action structurante = 1 décision** ; les conséquences automatiques ne sont
   pas des décisions (M16). *(③)*
5. **INV-5 — Immuabilité du passé.** Décisions, RAW, versions, entrées d'historique, publications **ne se
   réécrivent jamais** ; on **annote** ou on **supersède** (M14). *(③/⑤)*
6. **INV-6 — Réversibilité totale jusqu'à la publication.** Revenir, comparer, restaurer, **réactiver une
   variante écartée**, choisir **garder/mettre à jour/régénérer** — toujours possible, **jamais en
   automatique**, **jamais d'effacement silencieux**. *(⑥/⑤)*
7. **INV-7 — Un seul acte irréversible : publier.** Tout le reste lui reste réversible ; l'irréversibilité
   est **annoncée** avant l'acte. *(⑥/⑤)*
8. **INV-8 — Rien ne se perd, rien ne se supprime en silence.** Écarter/archiver ≠ supprimer ; les objets de
   mémoire sont permanents. *(③/⑥)*
9. **INV-9 — Survie de l'état complet.** Le travail survit à la fermeture, au redémarrage, à une migration
   et à un changement de représentation ; la reprise restaure l'état **exact**, **verrous compris**. *(⑤)*
10. **INV-10 — Source de vérité unique.** Le **dossier de projet** (et l'**Univers** pour le monde) est la
    source ; toute liste/lecture en **dérive** ; aucune représentation ne détient ni ne double l'état. *(⑤/③)*
11. **INV-11 — Étanchéité stricte par copie explicite.** Les valeurs d'Univers/Personnage/Bibliothèque
    entrent dans un projet **par copie** ; **aucun héritage vivant**, **aucune modification rétroactive**
    d'un projet né (M12 / E124). *(⑤)*
12. **INV-12 — Le contrat d'effet.** Toute action conséquente **annonce son effet avant** ; **valider
    produit exactement l'annoncé** ; **le verrou tient**. *(⑤)*
13. **INV-13 — Capitalisation tracée.** Un acquis se **promeut** en brique réutilisable **avec sa
    provenance** ; la réutilisation est une **copie**. *(④/③)*
14. **INV-14 — Hiérarchie du monde.** **UNIVERS → PERSONNAGE → PROJET → LIVRABLES** : l'Univers porte le
    monde (bibliothèques, règles, lignes de publication, personnages, séries), le Personnage porte
    **seulement** son identité (références, garde-robe, voix). *(④)*
15. **INV-15 — Séparation stricte modèle métier / représentation.** Le modèle **ne dépend JAMAIS** d'une
    technologie particulière (messagerie, web, application de bureau, moteur de génération…). Toute
    représentation est **remplaçable** sans remettre en cause objets, relations, cycles de vie, décisions,
    règles ni invariants. **Si demain le canal actuel disparaît ou est entièrement remplacé, le modèle
    métier reste identique.** *(transverse — garantit la pérennité de tous les autres invariants)*

> **Test de fidélité d'une future représentation** : si une représentation viole **un seul** de ces 15
> invariants, elle trahit le modèle — quelle que soit sa technologie.

---

## DÉCISION DE MODÉLISATION (Phase 5)

| # | Question | Décision (validé 10/06) | Statut |
|---|---|---|---|
| **M18** | Préserver les identifiants des objets de mémoire à travers les migrations ? | **OUI (obligatoire).** Les identifiants des **objets de mémoire** (décisions, versions, livrables, publications, variantes, objets historiques) sont **STABLES dans le temps** et **PRÉSERVÉS** à travers toute migration / changement de stockage / technologie / interface / moteur. Identité stable = condition de la **traçabilité**, des **références croisées** et de la **continuité de la mémoire**. | ✅ validé 10/06 |

> **M1→M18 toutes tranchées.** Aucune question de modélisation ne reste ouverte. M18 renforce INV-9
> (survie) et appuie le nouvel **INV-15** (séparation modèle/représentation).

---

## ✅ MODÈLE MÉTIER COMPLET — prêt pour validation d'ensemble

Les **cinq phases** sont désormais constituées :

| Phase | Objet | Fichier |
|---|---|---|
| **1** | Inventaire des objets (34 objets / 5 familles) | `docs/MODELE_METIER_PHASE1.md` |
| **2** | Relations (composition/appartenance/dérivation/association/rôle exclusif) + Univers | `docs/MODELE_METIER_PHASE2.md` |
| **3** | Cycle de vie + focus Décision (le pourquoi) | `docs/MODELE_METIER_PHASE3.md` |
| **4** | Actions (squelette OBJET/ÉTAT/ACTION/DÉCISION) | `docs/MODELE_METIER_PHASE4.md` |
| **5** | Règles fondamentales (7 catégories) + **15 invariants** indépendants du médium | `docs/MODELE_METIER_PHASE5.md` |

**Décisions de modélisation** : **M1→M18 toutes tranchées**. Le modèle est **complet, cohérent et
indépendant de toute forme**, et **validé dans son ensemble** par Etoile (10/06). La question de la
**forme** (toute représentation) pourra être reprise ensuite, en dérivant rigoureusement des **15
invariants**.

_Phase 5 — règles + invariants. Dérivé de E127 (6 piliers) et de la phrase centrale. Modèle complet :
Phases 1→5. Aucune implémentation, aucune représentation. Live intact. Lecture seule._

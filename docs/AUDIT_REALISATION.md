# AUDIT DE PASSAGE — fondation → réalisation

> **EN-TÊTE DE GOUVERNANCE (E131)**
> - **Statut** : **B — Formalisation**.
> - **Acquis-source(s)** : **fondation close** (5 espaces verrouillés + Conscience + Lois I/II + invariants
>   INV-1→15 + **E128/E129/E130/E131**) + `PARCOURS_UTILISATEUR_CANONIQUE` + `EXPERIENCE_UTILISATEUR_REELLE`.
> - **Modifie un élément déjà verrouillé** : **NON.**
>
> **Objet** : identifier ce qui, dans le modèle validé, est **CRITIQUE pour la réussite du produit réel sur
> mobile** — **audit de préparation**. **Aucune technologie précise, aucune UI, aucune implémentation.**
> Live intact · zéro dépense.

---

## 1. LES 10 NON NÉGOCIABLES À PRÉSERVER EN RÉALISATION
1. **Repos sans média, instantané** : ouvrir/reprendre = lecture immédiate (cap+situation+mémoire), **jamais** un média au repos. *(INV-9/10)*
2. **Loi I** : le système **signale/propose**, **l'auteur décide** — aucune décision originée par le système.
3. **Loi II** : la Conscience **décrit** (faits/proxys/invitations), **n'attribue jamais le sens**.
4. **Source de vérité unique** : tout durable au **Socle** (projet) / **Univers** (monde). *(INV-10 · E130)*
5. **Dérivations recalculables, jamais stockées** : situation/titre/signaux/focalisation/tensions/miroir/
   **impact aval**. *(INV-9)*
6. **Impact aval = dérivation de la Conscience**, **consommée** par le Pilotage (présente/exécute). *(AUD-G1)*
7. **Étanchéité par copie** : Univers/Personnage/briques entrent **par copie**, **jamais de lien vivant**,
   **aucune modif rétroactive**. *(INV-11 · M12)*
8. **Contrat d'effet** : toute action conséquente **annoncée avant** ; valider = exactement l'annoncé. *(INV-12)*
9. **Un seul acte irréversible : publier** (annoncé, confirmé). Tout le reste réversible. *(INV-7 · INV-6)*
10. **Atelier dépose des faits-médias seulement** (`candidate` + RAW) ; **le verdict est au Pilotage** ; **RAW
    jamais écrasé** ; identités de mémoire **stables** (M18). *(E128-3 · INV-5/8 · M18)*

---

## 2. LES 10 ENDROITS DE RECHUTE « PRODUCTION/MÉDIA » (réflexe → invariant violé)
1. **Remettre un média au centre** de l'écran/du projet → viole « cap = centre » + anti-patterns. *(INV-1)*
2. **Placeholder d'image** (média de remplissage au repos) → viole repos sans média. *(INV-9/10)*
3. **Statut de devenir écrit par l'Atelier** (marquer « retenu/actif/validé ») → viole **E128-3**.
4. **Recalculer une lecture côté Pilotage** (focalisation/carrefour/impact aval) → viole **E128-2 / AUD-G1**.
5. **Stocker une dérivation** (mémoriser la situation/le titre/les signaux comme source) → viole **INV-9**.
6. **Tenir un état critique côté présentation** (la vue devient la vérité) → viole **E122 / INV-10**.
7. **Pipeline de production comme épine dorsale** (source→param→finaliser = la structure) → anti-pattern.
8. **Lien vivant vers l'Univers** (brique branchée au lieu d'être copiée) → viole **INV-11 / M12**.
9. **Auto-appliquer l'impact aval en silence** (mettre à jour l'aval sans choix) → viole **INV-6 / INV-12**.
10. **Fabriquer une raison** de décision (ou conclure un sens) à la place de l'auteur → viole **Loi I/II /
    M17 / E129**.

---

## 3. LES 10 RISQUES UX MAJEURS (consolidés de F1–F7 + parcours)
1. **Charge de décision** (trop de « décide+justifie » rapprochés) — vidéo, jugements. *(F1)*
2. **Vécu de l'attente** de génération en 5G. *(F2)*
3. **Obligation de raison sur le structurant** ressentie comme un frein. *(F3)*
4. **Surcharge de lecture** (trop de signaux/tensions d'un coup) sur projet riche. *(F4)*
5. **Perte de contexte au retour** si le repos n'est pas instantané/complet. *(F5 — vigilance forte)*
6. **Multiplication des attentes** (régénérations en chaîne). *(F6)*
7. **Impact aval répétitif** (re-choisir garder/MAJ/régénérer souvent). *(F7)*
8. **Trop d'actions pour créer** (si la création n'est pas gardée légère/esquissable).
9. **Publication anxiogène** si l'irréversibilité n'est pas clairement annoncée avant.
10. **Navigation confuse** si les lectures ne reviennent pas **à l'identique** d'un retour à l'autre.

---

## 4. LES 10 RISQUES « TECHNIQUES » MENAÇANT UN INVARIANT (sans nommer de techno)
1. **Une dérivation stockée par erreur** → casse **INV-9** (la lecture devient une source figée).
2. **Une donnée durable hors Socle/Univers** → casse **INV-10** (seconde source de vérité).
3. **Une copie devenue lien vivant** (Univers→projet) → casse **étanchéité INV-11 / M12**.
4. **Un état critique tenu côté présentation** → casse **E122**.
5. **Perte/écrasement d'un RAW** → casse **INV-5/8** (audit/retour impossibles).
6. **Identifiant de mémoire non stable** (perdu en migration) → casse **M18** (traçabilité brisée).
7. **Impact aval calculé hors Conscience** (par le Pilotage) → casse **AUD-G1 / E128-2**.
8. **Une dépense déclenchée sans confirmation** → casse **INV-12 / la règle d'or des coûts**.
9. **Une décision originée/raison fabriquée par le système** → casse **Loi I / M17**.
10. **Un effet aval appliqué en silence** (sans le choix de l'auteur) → casse **INV-6**.

---

## 5. LES 10 CRITÈRES DE « PREMIÈRE VERSION RÉELLEMENT UTILISABLE » (mesurables/observables)
1. **Repos instantané** : ouvrir un projet affiche cap+situation **sans attente** et **sans média**.
2. **Reprise sans média** : rouvrir après des semaines redonne **exactement** cap+situation+mémoire.
3. **Zéro dépense sans confirmation** : aucune génération ne part sans contrat accepté.
4. **Chaque dépense annoncée** : coût/effet affichés **avant** ; résultat = l'annoncé. *(INV-12)*
5. **Publication = seul acte irréversible**, **annoncé et confirmé** ; tout le reste défaisable.
6. **Étanchéité inter-projets vérifiable** : modifier une brique/un projet **n'altère aucun autre**.
7. **Toute lecture recalculable** : supprimer les dérivations et régénérer redonne la même lecture.
8. **Verdict de média toujours explicite** : aucun média ne devient « retenu/actif » sans décision tracée.
9. **Décisions relisibles** : l'historique restitue actions **+ raisons** des mois après.
10. **Création légère** : un projet existe en **≤ ~4 actions** (esquissable), et la navigation reste fluide.

---

## 6. VÉRIFICATION FINALE

### 6.1 Ce qui peut ENCORE casser le projet MALGRÉ une fondation verte
> **Les vrais dangers résiduels sont d'EXÉCUTION / RÉALISATION, pas du modèle :**
- une réalisation qui **trahit un non-négociable** (§1) ou **rechute** dans le média (§2) ;
- une **erreur technique** menaçant un invariant (§4) — dérivation stockée, durable hors Socle, lien vivant,
  RAW perdu, état en présentation… ;
- une **UX qui alourdit** (§3) au point de rendre l'usage pénible (charge, attente, surcharge) ;
- la **calibration des signaux** (A/B, **point ouvert non gravé**) traitée **sans arbitrage** (ce serait une
  **D** : interdit sans autorisation — E131) ou **non factuelle** (violerait Loi II).
> Aucun de ces dangers n'est une **contradiction du modèle** : ce sont des **conditions de réussite** à
> tenir pendant la réalisation.

### 6.2 Ce qui est DÉFINITIVEMENT ACQUIS (verrouillé)
- **Les 5 espaces** : Socle · Univers · Conscience · Atelier · Pilotage.
- **La cartographie des responsabilités** + **l'étanchéité** (E128) + **l'audit global** (vert, AUD-G1
  résolu).
- **Les Lois I/II** (E129) + **la règle de lecture** (E130, 3 vérités).
- **Les 15 invariants** + **les preuves** (reconstruction du Socle, non-seconde-source de la Conscience).
- **Le modèle d'objets v2** (M1→M24) + **la gouvernance des évolutions** (E131, en-tête A/B/C/D).
- **Le parcours canonique** + **l'expérience utilisateur réelle** (utilisable, OUI avec réserves de
  réalisation).

---

## VERDICT
> **🟢 AUCUNE CONTRADICTION RÉVÉLÉE.** Cet audit de passage **ne fait apparaître aucun manque exigeant une
> règle/objet nouveau** : tout se rattache à des **acquis verrouillés**. Il **reste strictement de catégorie
> B (Formalisation)** — il **prépare** la réalisation, il n'ajoute rien.
>
> **→ La phase conceptuelle peut être ARRÊTÉE DÉFINITIVEMENT.** La fondation est **close, verte, prouvée et
> protégée** (E131). On peut passer à la **conception du produit réel** — sous E118/E119, derrière `/v4`,
> **zéro dépense**, en **préservant les 10 non-négociables**, en **évitant les 10 rechutes**, et en visant
> les **10 critères de première version utilisable**.
>
> *(Seul élément à arbitrer le moment venu, séparément : la **calibration des signaux A/B** — catégorie D,
> contrainte factuelle Loi II.)*

_Audit de passage fondation→réalisation — formalisation (B). Dérivé de la fondation close. Aucune
architecture, aucune technologie, aucune implémentation, aucun nouvel objet/invariant/règle. Live intact.
Lecture seule._

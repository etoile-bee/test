# MODÈLE MÉTIER — PHASE 2 : RELATIONS ENTRE OBJETS

> **Statut : ANALYSE / MODÉLISATION — PHASE 2 seule (livrable autonome).** On cartographie **les liens**
> entre les objets définis en Phase 1 : qui contient quoi, qui appartient à quoi, qui dérive de quoi, qui
> est associé à quoi, qui désigne quoi. **Zéro vocabulaire d'interface.** Les phases 3 à 5 (cycle de vie ·
> actions · règles) viendront **après validation de cette Phase 2**. Live intact · fichiers verrouillés
> intacts · aucune dépense.
>
> **Phases 1 & 2 validées par Etoile (10/06).** Arbitrages intégrés : **M1** Ambiance = objet · **M2** Série
> = conteneur · **M3** Personnage possède Références + garde-robe · **M6** Hashtags = objet · **M8**
> Prêt-à-poster = état du Livrable · **M9** QC ≠ Évaluation de cohérence · **M10** Voix-signature au
> Personnage · **M4** Intention = OBJET COMPOSITE · **M5** Plateforme/Format/Durée ∈ Objectif · **M7**
> Rythme = attribut du Montage · **M11** **Univers = objet de 1er niveau, systématique** (UNIVERS →
> PERSONNAGE → PROJET → LIVRABLES) · **M12** règles de l'Univers appliquées **par copie explicite
> uniquement** (jamais d'héritage vivant, jamais de modif rétroactive). **Toutes les questions M1–M12 sont
> tranchées.**
>
> **Ancrage `E127`** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.

---

## A. ANALYSE — l'objet UNIVERS au-dessus du Personnage ✅ *(VALIDÉ 10/06 — M11/M12 ; intégré)*

> **Mise à jour** : Etoile a **validé** l'objet **Univers** (M11 = oui, systématique) et son mode
> d'application **par copie explicite** (M12). L'analyse ci-dessous a conduit à cette décision ; elle est
> conservée pour la traçabilité. **L'Univers n'est plus une hypothèse** : il est **objet de 1er niveau**,
> au sommet de la hiérarchie **UNIVERS → PERSONNAGE → PROJET → LIVRABLES**.

### A.1 La question
Etoile pressent un objet de **niveau supérieur au Personnage** : l'**Univers** (ex. « Imany »,
« Victoria Castelli ») qui regrouperait **plusieurs personnages, des bibliothèques, des règles
éditoriales, des règles visuelles, des lignes de publication**.

### A.2 Cet objet existe-t-il DÉJÀ implicitement ? — oui, par surcharge
Examen du modèle actuel : aujourd'hui le **Personnage joue déjà, en plus de son rôle d'identité, un rôle
de “monde”**. Trois indices convergents :
1. **Les bibliothèques sont déjà rattachées à un “monde”, pas globales.** Décors, consignes, presets,
   styles sont, dans les faits, propres à un univers de production (un même catalogue de décors n'a pas
   vocation à mélanger deux marques distinctes). Or la Phase 1 a posé la Bibliothèque comme « transverse aux
   projets » sans dire **transverse à quoi exactement** — la réponse naturelle est : *transverse à un
   univers*.
2. **Le Personnage porte deux natures hétérogènes.** D'un côté **l'incarnation** (visage, carnation,
   regard, garde-robe, voix) ; de l'autre, dès qu'on parle de « la marque Imany », on lui prête des
   **règles éditoriales** (ligne, sujets, anti-répétition), des **règles visuelles** (charte : cadrage,
   colorimétrie par défaut, style de sous-titres) et des **lignes de publication** (plateformes, comptes,
   rythme). Ces éléments ne sont **pas** de l'identité physique : ils sont du **monde**.
3. **Le besoin multi-personnages.** Une marque/univers peut accueillir **plusieurs personnages** (une
   égérie principale + des secondaires, ou des déclinaisons). Le modèle actuel ne permet pas de regrouper
   plusieurs personnages sous un même monde partageant règles et bibliothèques.

→ **Conclusion** : le rôle d'Univers **existe bel et bien**, mais il est aujourd'hui **dissous dans le
Personnage (surchargé)**. Ce n'est pas un manque « invisible » : c'est une **confusion de deux objets en
un**. Le symptôme le plus net est la Bibliothèque « transverse » qui n'a pas de propriétaire clair.

### A.3 Recommandation
**Oui, introduire un objet UNIVERS au-dessus du Personnage** — *en analyse ; à valider avant intégration*.
Répartition proposée :

| Porté par **UNIVERS** (le monde / la marque) | Conservé par **PERSONNAGE** (l'incarnation) |
|---|---|
| nom du monde (Imany, Victoria Castelli…) | nom de la personne |
| **Bibliothèques** (Décors, Ambiances, Presets, Consignes, Styles de sous-titres, Enchaînements) | **Références** (preuves d'identité) |
| **règles éditoriales** (ligne, sujets, anti-répétition) | **garde-robe de Looks** propres |
| **règles visuelles** (charte : cadrage, colorimétrie par défaut, style de sous-titres) | **voix-signature** |
| **lignes de publication** (plateformes, comptes, calendrier) | traits identitaires (visage, carnation, regard) |
| l'ensemble des **Personnages** + des **Séries** | — |

**Distinction à trois niveaux** : **Univers** = le *monde* (cadre durable, multi-personnages, règles,
canaux) ▸ **Personnage** = *qui* incarne ▸ **Intention** = *pourquoi* de ce projet précis.

### A.4 Question de modélisation ouverte (nouvelle)
- **M11 *(à confirmer)*** : un créateur a-t-il toujours **1 Univers** (alors l'Univers peut être implicite
  et léger quand il n'y a qu'un personnage) **ou** plusieurs ? **Défaut proposé** : l'Univers existe
  **toujours** comme conteneur (même réduit à un seul Personnage), car c'est lui qui possède proprement les
  bibliothèques et les règles. *Raison* : donne enfin un propriétaire clair à la Bibliothèque et aux
  chartes. *À valider.*
- **M12 *(à confirmer)*** : les **règles visuelles** de l'Univers (charte) s'**appliquent-elles par
  défaut** aux projets (en restant **surchargeables** et **étanches** par projet, E124) ? **Défaut** : oui,
  comme **valeurs par défaut copiées** (jamais héritées en silence). *À valider.*

> ⚠️ **Non intégré** : ci-dessous, l'Univers apparaît **en pointillé** dans le diagramme, comme
> **hypothèse à valider**. Le reste du modèle Phase 2 tient **avec ou sans** Univers (sans lui, son rôle
> reste — par défaut — porté par le Personnage, comme aujourd'hui).

---

## B. TYPOLOGIE DES LIENS (vocabulaire de relation employé)

| Lien | Symbole | Sens | Le composant survit-il seul ? |
|---|---|---|---|
| **Composition** | ◆ contient | le tout **possède fortement** ; le composant **n'existe pas sans le tout** et meurt avec lui | non |
| **Appartenance** | ○ possède | le tout **possède** ; le composant peut **préexister / survivre** au-delà | oui |
| **Dérivation** | → dérive de | l'objet est **produit / calculé** à partir d'un autre | — |
| **Association** | — lié à | **référence** sans possession | oui (indépendant) |
| **Rôle exclusif** | ★ désigne | **désignation unique** d'un objet existant dans un rôle | — |

---

## C. RÉPONSES EXPLICITES (les questions posées)

### C.1 Un **Projet** contient quoi ?
**Composition (◆)** — meurent avec le projet :
- **1 Intention** (◆) — la boussole du projet.
- **les créatifs employés** : Référence retenue, Look retenu, Décor retenu, **Ambiance** retenue (M1),
  Consigne de génération, Script, Voix. *(Ce sont des **emplois** : voir C.7 pour l'origine.)*
- **1 jeu de Paramètres** (◆, étanche au projet).
- **les médias** : Candidates (◆), Variantes (◆), **1 Média actif** (★ rôle exclusif), RAW/médias
  intermédiaires (◆, jamais écrasés), Montage (◆).
- **les éléments de diffusion** : Légende (◆), **Hashtags** (◆, M6), Contrôle qualité (◆), Coûts (◆).
- **les Livrables** (◆) et **les Versions** (◆).
- **la mémoire du projet** : Décisions (◆), **Évaluation de cohérence** (→ dérivée), contribution à
  l'Historique.
- **les Publications** issues du projet (◆ côté projet ; événement défini en C.5).

**Association (—)** — référencés, vivent ailleurs :
- **1 Personnage employé** (— lié à) ; **des Briques copiées** depuis la Bibliothèque (—).

### C.2 Une **Intention** appartient à quoi ?
- **Composition** : l'Intention **appartient à exactement un Projet** (◆) — elle naît et meurt avec lui.
- **Association** : elle **vise un Personnage** (—) et **porte un Objectif de publication** (qui **référence
  une Plateforme** — M5 par défaut : attribut).
- *(Note Univers, hypothèse)* : une Intention **hérite par défaut** des règles éditoriales de l'Univers du
  Personnage *(à valider, M12 — copie non silencieuse)*.

### C.3 Un **Livrable** provient de quoi ?
- **Dérivation (→)** : un Livrable **provient d'une Version validée** d'un Projet.
- **Composition (◆)** : il **contient** (copies autonomes) média final + image(s) source + Script +
  Légende (courte/longue) + **Hashtags** (M6) + Paramètres + infos projet + Coûts + RAW.
- **Appartenance** : il **appartient au Projet** (◆ côté projet).
- **État** : un Livrable porte l'**état “Prêt-à-poster”** (M8 — c'est un **état**, pas un objet) tant qu'il
  n'est pas publié.
- **Association** : il **alimente** une Publication (—).

### C.4 Une **Variante** est liée à quoi ?
- **Composition** : elle **appartient au Projet** (◆).
- **Dérivation (→)** : elle **dérive d'une Candidate** (ou d'une autre Variante dont elle est déclinée).
- **Rôle exclusif (★)** : elle peut **être désignée Média actif** (sans cesser d'être une variante).
- **Association** : elle est **comparable** à d'autres Variantes ; sa promotion peut produire un **Livrable**.

### C.5 Une **Publication** est liée à quoi ?
- **Dérivation (→)** : elle **provient d'un Livrable** (sa source).
- **Association** : elle **vise une Plateforme** (— ; relève des lignes de publication de l'Univers,
  hypothèse) ; elle **appartient au Projet** (◆ côté projet) et **inscrit une trace définitive** dans
  l'Historique.
- **Nature** : c'est un **événement** (pas un média), et le **seul acte irréversible**.

### C.6 Une **Série** relie quoi ? (M2 — conteneur)
- **Composition / Regroupement (◆ faible)** : une Série **regroupe plusieurs Projets** (ses membres) — mais
  un Projet **reste autonome** et peut exister **hors série**.
- **Association** : elle **partage souvent un Personnage** (—) et **porte des règles de cohérence
  inter-projets** (anti-répétition de sujets/looks rapprochés).
- *(Note Univers, hypothèse)* : une Série **appartient à un Univers** (○).

### C.7 Un **Personnage** possède quoi ? (M3 + M10)
- **Appartenance (○)** — possédés par le Personnage, réutilisables par tout projet qui l'emploie :
  - **ses Références** (preuves d'identité visuelle),
  - **sa garde-robe de Looks** (M3),
  - **sa Voix-signature** (M10).
- **Association** : il **est employé par** des Projets (—) et **rassemblé par** des Séries (—).
- *(Note Univers, hypothèse)* : le Personnage **appartient à un Univers** (○), qui possède de son côté les
  **Bibliothèques** transverses et les **règles**.

---

## D. DIAGRAMME DE STRUCTURE COMPLET (texte)

> Légende : ◆ composition (meurt avec le tout) · ○ appartenance (survit) · → dérivation · — association ·
> ★ rôle exclusif. Le bloc **UNIVERS** est désormais **validé** (M11/M12, sommet de la hiérarchie).

```
═════════════════════ UNIVERS ✅ (validé 10/06 — M11/M12) ═════════════════════
║ UNIVERS  (le monde / la marque — ex. Imany, Victoria Castelli)          ║
║   ○ possède ▸ Bibliothèque(s)                                           ║
║   ○ possède ▸ règles éditoriales · règles visuelles (charte) · lignes   ║
║                de publication                                           ║
║   ○ possède ▸ Personnage (1..n)                                         ║
║   ○ possède ▸ Série (0..n)                                              ║
║   ⇒ vers un Projet : COPIE EXPLICITE des règles (M12) — jamais d'héritage ║
║      vivant, jamais de modif rétroactive (étanchéité stricte)           ║
═══════════════════════════════════════════════════════════════════════════════
            │                                   │
            ▼ (○, hypothèse)                    ▼ (○, hypothèse)
   PERSONNAGE  (qui incarne)            SÉRIE  (conteneur éditorial, M2)
     ○ possède ▸ Référence (1..n)         ◆ regroupe ▸ Projet (1..n)   [membres, autonomes]
     ○ possède ▸ Look (garde-robe)        — partage  ▸ Personnage
     ○ possède ▸ Voix-signature (M10)     — porte    ▸ règles de cohérence inter-projets
            │
            │ — employé par
            ▼
╔══════════════════════════ PROJET (unité de production) ══════════════════════════╗
║  ◆ INTENTION (1)                                                                  ║
║      • message · émotion · public        (attributs — M4, défaut à confirmer)     ║
║      • — vise ▸ Personnage                                                        ║
║      • ◆ Objectif de publication ▸ plateforme · format · durée (M5, défaut)       ║
║                                                                                   ║
║  — emploie ▸ Personnage (1)        — copie ▸ Brique(s) depuis Bibliothèque        ║
║                                                                                   ║
║  CRÉATIFS EMPLOYÉS (retenus dans le projet)                                       ║
║      Référence · Look · Décor · ◆ Ambiance (M1) · Consigne · Script              ║
║      Script —interprété par▸ Voix                                                 ║
║      ◆ Paramètres (étanches au projet, E124)                                      ║
║                                                                                   ║
║  PRODUCTION (médias)                                                              ║
║      ◆ Candidate (1..n)  →donne→  Variante | (★) Média actif | (écartée)          ║
║      ◆ Variante (0..n)   →dérive de→ Candidate ;  ★peut devenir Média actif       ║
║      ★ Média actif (0..1, rôle EXCLUSIF) ▸ désigne une Candidate/Variante         ║
║      ◆ RAW / média intermédiaire (jamais écrasé)                                  ║
║      ◆ Montage  ▸ plans = Variantes/Médias retenus ; rythme (M7, attribut défaut) ║
║                                                                                   ║
║  ÉLÉMENTS DE DIFFUSION                                                            ║
║      ◆ Légende (courte/longue) · ◆ Hashtags (M6, objet) · ◆ Contrôle qualité     ║
║      ◆ Coût (estimé/réel, — lié à une action de production)                       ║
║                                                                                   ║
║  ◆ Version (0..n, instantanés restaurables)  ──validée──→  LIVRABLE               ║
║                                                                                   ║
║  ◆ LIVRABLE (0..n)  →provient de→ Version validée                                 ║
║      contient (copies) : média final · image(s) source · Script · Légende ·      ║
║                          Hashtags · Paramètres · infos · Coûts · RAW              ║
║      état : « Prêt-à-poster » (M8, ÉTAT du Livrable, pas un objet)                ║
║                         │ — alimente                                              ║
║                         ▼                                                         ║
║  ◆ PUBLICATION (événement, IRRÉVERSIBLE)  →provient de→ Livrable                  ║
║      — vise ▸ Plateforme   ·   inscrit ▸ trace définitive dans l'Historique       ║
║                                                                                   ║
║  MÉMOIRE DU PROJET                                                                ║
║      ◆ Décision (action + raison)                                                 ║
║      → Évaluation de cohérence (DÉRIVÉE ; 10 pièces : message·image·look·décor·   ║
║         voix·script·montage·rythme·légende·publication)  [≠ Contrôle qualité, M9] ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
            │ contribue à
            ▼
   HISTORIQUE  (→ dérivé de l'ensemble des Projets/Décisions/Versions/Publications ;
                mémoire chronologique permanente)

   BIBLIOTHÈQUE  (○ possédée par l'Univers — hypothèse ; sinon par le Personnage)
       ◆ contient ▸ Brique réutilisable (Look · Décor · Ambiance · Preset ·
                     Consigne · Style de sous-titres · Enchaînement)
       chaque Brique : — provenance ▸ Projet d'origine
       Projet — copie ▸ Brique   (copie EXPLICITE, jamais héritage silencieux, E124)
```

---

## E. TABLE DES LIENS (nature de chaque relation)

| Depuis | Relation | Vers | Cardinalité | Notes |
|---|---|---|---|---|
| Univers *(hyp.)* | ○ possède | Bibliothèque, règles, Personnage, Série | 1 → n | A.3 ; à valider (M11/M12) |
| Personnage | ○ possède | Référence | 1 → n | M3 |
| Personnage | ○ possède | Look (garde-robe) | 1 → n | M3 |
| Personnage | ○ possède | Voix-signature | 1 → 1 | M10 |
| Projet | ◆ contient | Intention | 1 → 1 | la boussole |
| Intention | ◆ appartient à | Projet | 1 → 1 | naît/meurt avec lui |
| Intention | — vise | Personnage | 1 → 1 | qui porte le message |
| Intention | ◆ contient | Objectif de publication | 1 → 1 | M5 (attribut composé, défaut) |
| Objectif | — vise | Plateforme | 1 → 1 | lignes de publication (Univers, hyp.) |
| Projet | — emploie | Personnage | 1 → 1 | association (Personnage survit) |
| Projet | ◆ contient | Référence/Look/Décor/Ambiance/Consigne/Script/Voix employés | 1 → n | emplois (origine : Personnage/Bibliothèque) |
| Projet | ◆ contient | Ambiance | 0 → n | M1 (objet) |
| Projet | ◆ contient | Paramètres | 1 → 1 | étanches (E124) |
| Script | — interprété par | Voix | 1 → 1 | la voix ne change pas le texte |
| Projet | ◆ contient | Candidate | 0 → n | brut non jugé |
| Variante | → dérive de | Candidate / Variante | 1 → 1 | trace volontaire |
| Média actif | ★ désigne | Candidate / Variante | 0 → 1 | **rôle exclusif** |
| Projet | ◆ contient | RAW / média intermédiaire | 0 → n | jamais écrasé |
| Montage | ◆ assemble | Variantes/Médias retenus | 1 → n | rythme = attribut (M7, défaut) |
| Projet | ◆ contient | Légende | 0 → n | ≠ Script |
| Projet | ◆ contient | Hashtags | 0 → n | M6 (objet) |
| Projet | ◆ contient | Contrôle qualité | 0 → n | M9 (aptitude technique) |
| Évaluation de cohérence | → dérive de | Intention + 10 pièces | 1 → 1 | M9 (alignement intention) ; **signale, ne décide pas** |
| Coût | — lié à | action de production | n → 1 | estimé/réel |
| Version | ◆ appartient à | Projet | 0 → n | instantané restaurable |
| Livrable | → provient de | Version validée | 1 → 1 | paquet autonome |
| Livrable | (état) | « Prêt-à-poster » | — | M8 (état, pas objet) |
| Publication | → provient de | Livrable | 1 → 1 | événement |
| Publication | — vise | Plateforme | 1 → 1 | irréversible |
| Série | ◆ regroupe | Projet | 1 → n | M2 (conteneur ; membres autonomes) |
| Série | — partage | Personnage | 1 → 1 | souvent commun |
| Décision | ◆ appartient à | Projet | 0 → n | action + raison (mémoire) |
| Historique | → dérive de | Projets/Décisions/Versions/Publications | 1 → n | mémoire chronologique |
| Bibliothèque | ◆ contient | Brique réutilisable | 1 → n | catalogue de réemploi |
| Brique | — provenance | Projet d'origine | 1 → 1 | traçabilité (③) |
| Projet | — copie | Brique | n → n | copie explicite (④ + E124) |

---

## F. POINTS D'ANCRAGE SUR LES PILIERS (pourquoi ces liens)

- **Composition forte des médias/décisions/versions dans le Projet** → pilier ③ (mémoire) + ⑥ (contrôle) :
  tout reste regroupé et réversible dans le conteneur unique.
- **Appartenance des Références/Looks/Voix au Personnage** (et des Bibliothèques/règles à l'Univers, hyp.)
  → pilier ④ (capitalisation) : on réutilise l'identité et les acquis sans les recréer.
- **Copie explicite des Briques (jamais d'héritage silencieux)** → piliers ⑤ (confiance) + ④, et
  **étanchéité** des Paramètres → E124.
- **Média actif = rôle exclusif** et **Variante dérivée** → pilier ⑥ : comparer/réactiver/promouvoir sans
  perte.
- **Livrable → Version validée**, **Publication → Livrable (irréversible)** → pilier ⑥ : tout réversible
  jusqu'au seul acte définitif.
- **Évaluation de cohérence dérivée, distincte du QC** → pilier ② : signaler la dérive parmi les 10 pièces,
  sans décider.

---

## G. QUESTIONS DE MODÉLISATION OUVERTES (Phase 2)

| # | Question | Décision | Statut |
|---|---|---|---|
| **M11** | L'**Univers** existe-t-il (conteneur, même à 1 personnage) ? | **OUI, systématique** (UNIVERS → PERSONNAGE → PROJET → LIVRABLES) | ✅ validé 10/06 |
| **M12** | Les règles de l'Univers s'appliquent-elles aux projets ? | **OUI mais par COPIE EXPLICITE** — jamais d'héritage vivant ni de modif rétroactive | ✅ validé 10/06 |
| M4 | Intention = champ ou objet ? | **OBJET COMPOSITE** (Message+Émotion+Public+Objectif) | ✅ validé 10/06 |
| M5 | Plateforme/Format/Durée ∈ Objectif ? | **OUI** (dès la naissance du projet) | ✅ validé 10/06 |
| M7 | Rythme = attribut du Montage ? | **Attribut** | ✅ validé 10/06 |

> **Toutes les questions M1–M12 sont tranchées.** Le modèle d'objets (Phase 1) et de relations (Phase 2)
> est **figé**. Aucune question de modélisation ouverte ne subsiste à ce stade.

---

⏸️ **FIN DE LA PHASE 2** (validée 10/06). Les phases 3 (Cycle de vie) · 4 (Actions) · 5 (Règles) **ne sont
pas traitées ici** : elles attendent le signal. L'objet **Univers** est désormais **validé et intégré**
(sommet de la hiérarchie), avec étanchéité stricte par **copie explicite** (M12).

_Phase 2 — relations. Dérivé de E127 (6 piliers). Base factuelle : manifest existant. Aucune
implémentation, aucune représentation. Phase 1 : `docs/MODELE_METIER_PHASE1.md`. Lecture seule._

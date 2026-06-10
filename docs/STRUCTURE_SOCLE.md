# STRUCTURE LOGIQUE DU SOCLE (dossier-projet) — la source de vérité

> **Statut : ANALYSE — structure LOGIQUE uniquement.** Description exhaustive de **ce que contient le
> Socle** : informations détenues, organisation, relations internes, et **classification** (durable /
> versionné / dérivé / référencé / copié / immutable / supersédable). **Aucun écran, aucune technologie,
> aucun format de fichier, aucun schéma technique, aucune implémentation** — seulement la **logique**. Live
> intact · fichiers verrouillés intacts · zéro dépense.
>
> **Canon de référence** : modèle v2, `CONSCIENCE_DU_PROJET`, `EXTRACTION_OPERATIONNELLE` (déf.),
> `ARCHITECTURE_SYSTEME`, `CARTOGRAPHIE_RESPONSABILITES`, `AUDIT_DE_SEPARATION_DES_RESPONSABILITES`, **E128**
> (3 règles d'étanchéité gravées). **Rappel fondateur** : le Socle détient les **FAITS BRUTS** (décisions,
> états, RAW) ; la **Conscience** en **dérive la lecture** — **rien de dérivé n'est stocké ici** (INV-9/10).

---

## 0. CE QU'EST LE SOCLE (et ce qu'il n'est pas)
Le Socle est le **seul lieu de vérité durable** d'**un** projet. Il **stocke**, il **ne calcule jamais**,
**ne décide jamais**, **n'interprète jamais**. Il est **écrit** par le Pilotage (décisions/états) et
l'Atelier (faits-médias) ; il est **lu** par la Conscience. *(INV-10 · fiche ① cartographie)*

---

## 1. INVENTAIRE EXHAUSTIF — quelles informations sont détenues

### 1.1 LE NOYAU / CAP
- **Intention composite** (objet unique) : **message · émotion · public · objectif** (l'objectif portant
  **plateforme · format · durée**).
- **Identité-essence** : ce qui fait que ce projet est *ce* projet (son essence créative).
- **Origine / déclencheur** : l'étincelle d'où il est né (idée/phrase/sujet/émotion/lien).
- *(les **versions** de l'intention au fil de sa maturation sont conservées — cf. §Mémoire/Versions.)*

### 1.2 L'IDENTITÉ TECHNIQUE STABLE
- **Identifiant stable (M18)** : l'identité **invariable dans le temps**, condition de la traçabilité et des
  références croisées.

### 1.3 L'APPARTENANCE
- **Référence à l'Univers** d'origine (le monde auquel le projet appartient).
- **Référence au Personnage employé**.

### 1.4 LA MÉMOIRE
- **Décisions** (chacune : l'action structurante, l'objet concerné, l'auteur, la date) **+ Raison** (le
  pourquoi), avec leur état (`prise` / `incomplète` / `annotée` / `supersédée`).
- **Annotations datées** (compléments d'une décision, sans réécriture).
- **Journal de versions** (la trace chronologique des instantanés et des grands faits).

### 1.5 LA CONFIGURATION
- **Instances appliquées** (copies dans le projet) : **référence, look, décor, ambiance, consigne,
  paramètres** — chacune **étanche** (propre au projet).
- **Verrous** (sur réf/look/décor/consigne…).
- **Marqueurs de polarité protégée** (niveau 3) : les tensions constitutives **revendiquées** à préserver.

### 1.6 LA MATIÈRE
- **Média produit** (objet unique) avec ses **états** : `candidate` · `variante` · `écartée` ·
  `retenue-pour-livrable` ; et le **rôle** « média actif » (désignation exclusive).
- **RAW / médias intermédiaires** (bruts de chaque étape, **jamais écrasés**).

### 1.7 LES VERSIONS
- **Versions** (instantanés restaurables du projet : média référencé + configuration au moment T) ;
  l'une peut être marquée **retenue** (avec sa raison de retenue).

### 1.8 LES LIVRABLES
- **Livrables** (paquets autonomes : média final + script + légende courte/longue + hashtags + paramètres +
  coûts + RAW + infos), avec leur **état**.

### 1.9 LES DEUX AXES DE STATUT
- **Axe qualité** : `test` / `production`.
- **Axe publication** : `prêt-à-poster` / `publié` / `archivé` (+ état initial neutre).

> *(Coûts : présents **comme attribut** d'une production/d'un livrable — pas un objet ; le **réel** est un
> fait déposé, l'**estimé** n'est pas stocké comme vérité — cf. §dérivé.)*

---

## 2. ORGANISATION LOGIQUE (regroupement)
Le Socle s'organise en **7 regroupements** cohérents :

| Regroupement | Contenu |
|---|---|
| **A. CAP** | intention composite · identité-essence · origine/déclencheur |
| **B. IDENTITÉ & APPARTENANCE** | identifiant stable (M18) · réf. Univers · réf. Personnage |
| **C. MÉMOIRE** | décisions + raisons + annotations · journal de versions |
| **D. CONFIGURATION** | instances appliquées (réf/look/décor/ambiance/consigne/paramètres) · verrous · polarités protégées |
| **E. MATIÈRE** | médias produits + états + rôle « actif » · RAW |
| **F. VERSIONS** | instantanés restaurables · version retenue |
| **G. LIVRABLES & STATUTS** | livrables (paquets) · axe qualité · axe publication · publications (faits) |

---

## 3. RELATIONS INTERNES (diagramme de structure du Socle)

```
SOCLE (dossier-projet) — source de vérité d'UN projet
│
├─ A. CAP
│   ├─ Intention composite { message · émotion · public · objectif[plateforme·format·durée] }
│   ├─ Identité-essence
│   └─ Origine / déclencheur
│            ▲ (les raffinements du cap sont des Décisions ─┐ et des Versions de l'intention)
│
├─ B. IDENTITÉ & APPARTENANCE
│   ├─ Identifiant stable (M18)                 ── immutable
│   ├─ ⟶ référence Univers   (copie d'amorce, pas de lien vivant)
│   └─ ⟶ référence Personnage (copie d'amorce)
│
├─ C. MÉMOIRE
│   ├─ Décision { action · objet visé · auteur · date · RAISON · état } ── le FAIT est immutable
│   │     └─ peut être ANNOTÉE (datée) ou SUPERSÉDÉE par une nouvelle Décision (sans effacement)
│   └─ Journal de versions (chronologie)
│
├─ D. CONFIGURATION
│   ├─ Instances appliquées (réf/look/décor/ambiance/consigne/paramètres) ── COPIÉES (M12), étanches
│   ├─ Verrous
│   └─ Marqueurs de polarité protégée (niv. 3)  ── attachés au CAP
│
├─ E. MATIÈRE
│   ├─ Média produit { …états: candidate→variante→écartée→retenue } ── l'objet persiste, l'ÉTAT est SUPERSÉDABLE
│   │     └─ rôle « média actif » = désignation exclusive (un seul) ── SUPERSÉDABLE
│   └─ RAW / intermédiaires ── IMMUTABLES (jamais écrasés)
│
├─ F. VERSIONS
│   └─ Version { ⟶ média référencé · instantané de configuration · raison de retenue? } ── figée = IMMUTABLE
│         └─ « version retenue » = désignation ── SUPERSÉDABLE (restaurer n'efface aucune version)
│
└─ G. LIVRABLES & STATUTS
    ├─ Livrable { média final · script · légendes · hashtags · paramètres · coûts · RAW · infos } ⟶ provient d'une Version
    │     └─ contenu copié = autoporteur ; une fois publié = IMMUTABLE
    ├─ Axe qualité (test/production)         ── SUPERSÉDABLE (promotion)
    ├─ Axe publication (prêt-à-poster/publié/archivé) ── SUPERSÉDABLE, sauf « publié » = fait IMMUTABLE
    └─ Publication (événement) ── IMMUTABLE (trace définitive)
```

**Relations clés** : la **Décision** peut viser **n'importe quel** regroupement (cap, configuration,
matière, version, livrable) — c'est le **liant** de la mémoire. La **Version** *référence* un média et
*capture* la configuration. Le **Livrable** *provient d'*une Version. Les instances de configuration
*référencent* (par copie) des briques de l'Univers/Personnage.

---

## 4. CLASSIFICATION DE CHAQUE FAMILLE
> Une famille peut cumuler plusieurs natures (ex. une instance appliquée est **copiée** *et* **durable** *et*
> **supersédable**). Légende : **DUR** durable · **VER** versionné · **DÉR** dérivé (⇒ **PAS** dans le
> Socle) · **RÉF** référencé · **COP** copié (M12) · **IMM** immutable · **SUP** supersédable.

| Famille | DUR | VER | DÉR | RÉF | COP | IMM | SUP | Notes |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Intention composite (cap) | ✔ | ✔ | | | | | ✔ | raffinée = Décision ; versions conservées ; **le fait de chaque version** est immutable |
| Identité-essence | ✔ | | | | | | ✔ | peut évoluer (décision), sans effacer le passé |
| Origine / déclencheur | ✔ | | | | | ✔ | | l'étincelle d'origine **ne se réécrit pas** |
| Identifiant stable (M18) | ✔ | | | | | ✔ | | **jamais modifié**, préservé en migration |
| Réf. Univers / Personnage | ✔ | | | ✔ | ✔ | | | **copie d'amorce** + lien de provenance ; **pas de lien vivant** |
| Décision (le fait) | ✔ | | | ✔ | | ✔ | | vise un objet (RÉF) ; **fait immutable** |
| Raison / annotation | ✔ | | | | | | ✔ | annotable (ajout daté), **jamais réécrite** |
| Journal de versions | ✔ | ✔ | | | | ✔ | | chronologie : entrées **immutables** |
| Instances appliquées (config) | ✔ | | | | ✔ | | ✔ | **copiées** (étanches), modifiables dans le projet |
| Verrous | ✔ | | | | | | ✔ | posés/levés (supersédable) |
| Polarité protégée (niv.3) | ✔ | | | ✔ | | | ✔ | revendiquée/abandonnée par décision ; attachée au cap |
| Média produit (objet) | ✔ | | | | | ✔ | | l'**objet-média** ne se réécrit pas… |
| …ses **états** / rôle actif | ✔ | | | | | | ✔ | …mais l'**état** (candidate→…→retenue) et le **rôle actif** sont **supersédables** |
| RAW / intermédiaires | ✔ | | | | | ✔ | | **jamais écrasés** |
| Versions (instantanés) | ✔ | ✔ | | ✔ | | ✔ | | figées (IMM) ; « retenue » = désignation SUP |
| Livrables (paquets) | ✔ | | | ✔ | | (✔) | ✔ | autoporteurs ; **immutables une fois publiés** |
| Coût **réel** | ✔ | | | ✔ | | ✔ | | fait déposé (attribut d'une production) |
| Coût **estimé** | | | ✔ | | | | | **dérivé** (contrat avant dépense) ⇒ **PAS** stocké comme vérité |
| Axe qualité (test/prod) | ✔ | | | | | | ✔ | promotion = supersédable |
| Axe publication | ✔ | | | | | (✔) | ✔ | supersédable, **sauf « publié »** = fait IMM |
| Publication (événement) | ✔ | | | ✔ | | ✔ | | trace **définitive** |

---

## 5. COMMENT MÉMOIRE · CAP · CONFIGURATION · MATIÈRE · VERSIONS · LIVRABLES COHABITENT
- **Le CAP est le centre** : tout le reste **sert** ou **se compare** à lui ; il est durable et versionné
  (sa maturation est tracée), son **origine** est immutable.
- **La MÉMOIRE est le liant** : chaque évolution du cap, de la configuration, de la matière, des versions ou
  des livrables **passe par une Décision** (fait immutable + raison). La mémoire **relie** toutes les
  familles sans en posséder le contenu (elle pointe vers l'objet visé).
- **La CONFIGURATION** est l'**amont créatif copié** (étanche) ; elle **alimente** la production de matière.
- **La MATIÈRE** est l'**aval produit** : objets-médias (immutables) dont les **états** changent
  (supersédables) ; les **RAW** sont conservés pour l'audit.
- **Les VERSIONS** **figent** des instantanés (cap+config+média) ; restaurer **n'efface jamais**.
- **Les LIVRABLES** **condensent** une version retenue en paquet autoporteur ; une fois **publiés**, ils
  deviennent immutables ; les **statuts** (qualité/publication) qualifient leur situation.

> Cohabitation = **un centre (cap)**, **un liant (mémoire)**, **un amont (config)**, **un aval (matière)**,
> **des points de sauvegarde (versions)**, **des sorties (livrables)** — tous **durables**, reliés par des
> **décisions immutables**.

---

## 6. CE QUI N'EST **PAS** DANS LE SOCLE (dérivé, recalculable par la Conscience — INV-9)
Le Socle **ne stocke jamais** ces éléments : ils sont **calculés à la demande** par la **Conscience** à
partir des faits bruts, et **recalculables à l'identique** :
- **La SITUATION** (synthèse au présent).
- **Le TITRE** (compression cap·situation·tension·geste, 4 filtres).
- **Les SIGNAUX** (calme/maturité/tension/priorité).
- **La FOCALISATION** (le carrefour).
- **La HIÉRARCHIE DES TENSIONS** (stratification lexicographique).
- **LE MIROIR** de cohérence (fracture vs polarité, effondrement, **cap déclaré vs cap agi**).
- **L'HISTORIQUE-comme-vue** et **l'INVENTAIRE-comme-vue** (réorganisations de la mémoire/des faits).
- **Le COÛT estimé** (avant dépense), **le « prochain geste »** (mapping de la focalisation, E128-2).

> **Principe** : le Socle détient les **FAITS BRUTS** (décisions, états, RAW, statuts) ; **toute lecture**
> en est **dérivée** par la Conscience. Supprimer toutes ces dérivations et les régénérer **redonne
> exactement** la même lecture. *(INV-9/10 · Lois I & II)*

---

## 7. VÉRIFICATION DE COHÉRENCE (rien masqué)
- **Aucun dérivé stocké dans le Socle ?** → **🟢 OUI.** Situation/titre/signaux/focalisation/tensions/
  miroir/historique-vue/inventaire-vue/coût estimé/prochain geste sont **listés §6 comme NON détenus**.
  *(INV-9/10)*
- **RAW et faits immutables ?** → **🟢 OUI.** RAW = IMM ; le **fait** d'une Décision = IMM (annoté/supersédé,
  jamais réécrit) ; Version figée = IMM ; Publication = IMM ; « publié » = IMM. *(INV-5/8)*
- **M18 immutable ?** → **🟢 OUI.** Identifiant stable = IMM, préservé en migration. *(M18)*
- **Copie M12 sans lien vivant ?** → **🟢 OUI.** Réf. Univers/Personnage et instances appliquées = **COP**
  (copie d'amorce, étanches) ; aucune dépendance vivante. *(INV-11)*
- **Le Socle ne calcule/ne décide pas ?** → **🟢 OUI.** Il **stocke** ; écrit par Pilotage (décisions/états)
  et Atelier (faits-médias, jamais un statut de devenir — **E128-3**). *(INV-10 · E128)*

> **Incohérence détectée : aucune.** Un seul **point de vigilance** (déjà gravé E128-3) : à la réalisation,
> veiller à ce que l'Atelier **ne dépose jamais** un état de devenir dans la famille E — seul le Pilotage
> écrit l'état/rôle d'un média.

---

## SUITE (à la main d'Etoile)
La structure logique du Socle est **posée**. On ne descend dans les **autres espaces** (Univers,
Conscience, Atelier, Pilotage) **qu'au feu vert d'Etoile** — toujours sans implémentation. Puis, sur
décision, la réalisation (E118/E119, derrière `/v4`, zéro dépense) **intégrera** cette structure et les
règles d'étanchéité E128.

_Structure logique du Socle — dérivée du canon (modèle v2 + Conscience + Architecture + Cartographie +
Audit + E128). Aucune implémentation, aucune technologie, aucun écran, aucun nouvel objet. Live intact.
Lecture seule._

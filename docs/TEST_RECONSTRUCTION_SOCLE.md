# TEST DE RECONSTRUCTION TOTALE DU SOCLE

> **Statut : AUDIT ADVERSARIAL (preuve d'INV-9/10).** Hypothèse : on **supprime intégralement** toutes les
> dérivations de la Conscience. Objectif : **prouver** qu'**aucune information nécessaire à la lecture du
> projet n'existe uniquement dans une dérivation** — tout se **reconstruit** depuis les **faits du Socle**.
> **Aucun écran, aucune technologie, aucune implémentation.** Ancré sur `STRUCTURE_SOCLE`,
> `CONSCIENCE_DU_PROJET`, `CARTOGRAPHIE_RESPONSABILITES`, `AUDIT_DE_SEPARATION_DES_RESPONSABILITES`, modèle
> v2, E128. Live intact · fichiers verrouillés intacts · zéro dépense.
>
> **Faits du Socle disponibles** (rappel) : **cap** (intention composite message·émotion·public·objectif +
> identité-essence + origine/déclencheur) · **versions de l'intention** · **M18** · **appartenance** ·
> **mémoire** (Décisions + Raisons + annotations + journal) · **configuration** (instances appliquées +
> verrous + **marqueurs de polarité protégée** niv.3) · **matière** (média produit + **états** + rôle
> actif + RAW) · **versions** · **livrables** · **2 axes de statut** · **coût réel**.
> **Règles canoniques** (non stockées dans le projet, niveau système) : **M15** (structurant), **4 filtres**
> de compression, **stratification** des tensions, **seuils de signaux**, **grille des 10 pièces**,
> **tarification** (coût). *(E128 : règles uniques, jamais redéfinies localement.)*

---

## 1. TABLEAU DE RECONSTRUCTION (dérivation → sources → règles → reconstructible)

| Dérivation | Données SOURCES du Socle (précises) | Règles de calcul | Reconstruction complète ? |
|---|---|---|---|
| **Miroir de cohérence** | cap **courant** (intention composite) ; pièces présentes (matière+états, instances config : réf/look/décor/ambiance/consigne, script/voix/montage/légende/hashtags si présents) ; **marqueurs de polarité protégée** (niv.3) ; **Décisions+Raisons** (écarts assumés, recentrages) ; **versions de l'intention** | grille des **10 pièces** vs cap ; détection **fracture** (cap divisé) vs **polarité** (revendiquée) ; **effondrement** (perte d'un pôle protégé) ; **cap déclaré vs cap agi** | **OUI** — toutes les entrées sont des **faits du Socle** |
| **Hiérarchie des tensions** | (recompute le **miroir** depuis le Socle) | **stratification lexicographique** (cap-âme[identité>émotion/message] > cap-cadre > manifestations > production) puis **gravité** | **OUI** — via miroir → Socle |
| **Focalisation (carrefour)** | (recompute la **hiérarchie** depuis le Socle) | sommet de la hiérarchie = carrefour | **OUI** — via hiérarchie → miroir → Socle |
| **Prochain geste** | (recompute la **focalisation** depuis le Socle) | **strict mapping** de la focalisation (E128-2) — **aucun** recalcul propre | **OUI** — mapping pur |
| **Signal « tension »** | tensions du miroir | présence d'au moins une tension active | **OUI** |
| **Signal « priorité »** | hiérarchie/focalisation | tension de plus haute strate / carrefour | **OUI** |
| **Signal « calme »** | miroir (absence de tension) ; statuts | aucune tension active + cohérence alignée | **OUI** |
| **Signal « maturité »** | **Décisions+Raisons** (variantes retenues/rejetées, recentrages) ; **versions de l'intention** ; cap déclaré | écart **stable** déclaré vs agi (régularité) | **OUI** |
| **Situation** | cap ; matière+états ; rôle actif ; versions ; livrables ; statuts ; (tensions via miroir recomputé) | synthèse au présent du noyau | **OUI** |
| **Titre** | (recompute **situation** + **focalisation/tension** + **prochain geste**) | **compression 4 filtres** (pertinence au cap · rôle/statut · structurant vs local **M15** · pertinence à l'écart présent) | **OUI** — via composantes → Socle |
| **Historique-comme-vue** | **mémoire** (Décisions+Raisons+annotations+journal) | tri/regroupement chronologique | **OUI** |
| **Inventaire-comme-vue** | matière+états, variantes, versions, livrables, décisions | listage factuel | **OUI** |
| **Coût estimé** | paramètres de la production envisagée | **tarification** (règle/référence) | **OUI** — recomposable avant dépense |

> **Toutes les lignes = OUI.** Aucune dérivation n'apporte une donnée **source** : chacune n'apporte qu'un
> **calcul** sur des faits du Socle (ou sur une autre dérivation **elle-même recomposée** depuis le Socle).

---

## 2. VÉRIFICATION 1 — CHAÎNE DE DÉPENDANCES (acyclique + aboutit toujours aux faits)

### 2.1 Le graphe de composition
```
titre ──► situation ─────────────────────────────► [FAITS DU SOCLE]
  │  └──► focalisation ──► hiérarchie ──► miroir ──► [FAITS DU SOCLE]
  └──► prochain geste ──► focalisation ──► hiérarchie ──► miroir ──► [FAITS DU SOCLE]
signaux ──► (miroir / hiérarchie) ──► [FAITS DU SOCLE]   ; maturité ──► [FAITS: décisions + versions intention]
historique-vue ──► [FAITS: mémoire]      inventaire-vue ──► [FAITS: matière/versions/livrables/décisions]
coût estimé ──► [FAITS: paramètres] + règle tarification
```
- **Acyclique ?** → **🟢 OUI.** Aucune dérivation n'est, directement ou indirectement, sa propre ascendante.
  (Le miroir dépend du cap+pièces — **pas** de la situation ; la situation peut citer une tension mais la
  **recompute** depuis le miroir ; aucune boucle.)
- **Aboutit toujours aux faits ?** → **🟢 OUI.** Chaque branche **se termine** sur des **faits du Socle**.
- **Aucune dérivation ne dépend de l'ÉTAT STOCKÉ d'une autre ?** → **🟢 OUI.** Les dérivations **ne sont pas
  stockées** : une dérivation qui « utilise » une autre la **recompose** depuis le Socle (dépendance
  **compositionnelle**, jamais **stateful**). Supprimer **toutes** les dérivations puis tout régénérer
  redonne **exactement** la même lecture.

> **Condition de déterminisme (honnête)** : la reconstruction est **identique** tant que les **règles
> canoniques** (M15, 4 filtres, stratification, seuils, grille des 10 pièces, tarification) sont
> **inchangées**. Ces règles sont **au niveau système** (E128), **pas** des données de projet — donc elles
> ne sont **pas** « perdues » par la suppression des dérivations. *(ce n'est pas une fuite : c'est la nature
> d'un calcul déterministe.)*

---

## 3. VÉRIFICATION 2 — ENTRÉES AUTEUR toutes stockées comme FAITS

| Entrée auteur nécessaire (au miroir/tensions) | Stockée comme FAIT du Socle ? | Forme |
|---|---|---|
| **Écart assumé** (« c'est voulu ») | **🟢 OUI** | une **Décision** (+ raison) |
| **Polarité revendiquée** (à protéger) | **🟢 OUI** | **marqueur de polarité protégée** (niv.3) |
| **Cap déclaré** | **🟢 OUI** | l'**intention composite** + ses **versions** |
| **Recentrage** (maturation du cap) | **🟢 OUI** | une **Décision** + une **version de l'intention** |
| **Verdict d'une variante** (retenue/écartée/active) | **🟢 OUI** | **état** du Média produit + **Décision** |

- **Statut : 🟢 OUI.** Toutes les entrées auteur dont le miroir a besoin sont des **faits durables du Socle**
  — donc **présentes pour le recalcul**.
- **Recherche adversariale de fuite** : un **signal non assumé** (l'auteur n'a ni corrigé ni revendiqué)
  n'est **volontairement pas** stocké → il **se recompute** à l'identique depuis les mêmes faits (le signal
  réapparaît). **Ce n'est pas une fuite** : aucune information n'est perdue, car le **fait sous-jacent** (la
  pièce qui dérive) est dans le Socle. Un « j'ignore pour l'instant » **non décidé** n'a **rien** à
  conserver — et n'en conserve rien. **🟢 Aucune fuite.**

---

## 4. VÉRIFICATION 3 — CAP AGI / TENSIONS ÉMERGENTES recalculables

- **L'observation des régularités** (variantes systématiquement retenues/rejetées + raisons, recentrages
  successifs, polarités constamment préservées) se **recompute** depuis les **Décisions+Raisons**, les
  **marqueurs de polarité** et les **versions de l'intention** — **tous faits du Socle**. **🟢 OUI.**
- **La reconnaissance par l'auteur** (quand il acte un motif émergent) est elle-même un **fait stocké** : une
  **Décision** (ex. recentrage) ou une **polarité revendiquée**. **🟢 OUI.**
- **Recherche adversariale** : existe-t-il une **mémoire de motif émergent** qui ne vivrait **que** dans une
  dérivation (ex. « tendance détectée » stockée nulle part) ? → **NON.** Le motif est **recalculé** à chaque
  fois depuis les décisions (c'est une dérivation, par nature non stockée) ; le **fait** qu'il a été
  surfacé une fois **n'a pas besoin** d'être conservé (même entrée → même surfaçage). **🟢 Aucune mémoire de
  motif n'existe uniquement dans une dérivation.**

---

## 5. SYNTHÈSE ADVERSARIALE (recherche active de fuite)
| Risque sondé | Résultat |
|---|---|
| Une dérivation détient une **donnée source** introuvable ailleurs | **non** (tableau §1 : toutes = OUI) |
| **Cycle** dans la chaîne de dérivations | **non** (§2 : DAG) |
| Dérivation dépendant de l'**état stocké** d'une autre | **non** (§2 : recomposition, pas stockage) |
| Entrée **auteur** vivant uniquement dans une dérivation | **non** (§3 : toutes = faits) |
| **Signal non assumé** perdu | **non** (recomputé ; rien à conserver) |
| **Motif émergent** mémorisé hors Socle | **non** (§4 : recalculé) |
| Reconstruction divergente | **non**, **sous condition** que les **règles canoniques** soient inchangées (niveau système, E128) |

---

## VERDICT
> **🟢 VERT — Reconstruction totale prouvée.** Les **13 dérivations** (situation, titre, signaux ×4,
> focalisation, hiérarchie des tensions, miroir, historique-vue, inventaire-vue, prochain geste, coût
> estimé) sont **100 % reconstructibles** depuis les **faits du Socle**. La **chaîne est acyclique** et
> **aboutit toujours aux faits** ; **toutes les entrées auteur** sont des **faits durables** ; les **motifs
> émergents** se **recalculent**. **Aucune fuite (aucun 🔴).**
>
> **Le Socle est donc la source de vérité suffisante** : on peut **jeter** l'intégralité de la Conscience et
> **tout régénérer à l'identique** — INV-9 et INV-10 sont **prouvés**.
>
> **Unique condition (par nature, pas une fuite)** : les **règles canoniques** (M15, 4 filtres,
> stratification, seuils, grille des 10 pièces, tarification) doivent rester **inchangées** ; elles vivent
> au **niveau système** (E128), **hors** données de projet, donc **non concernées** par la suppression des
> dérivations.

---

## SUITE (à la main d'Etoile)
Le Socle ayant **réussi** le test de reconstruction totale, on ne descend dans **l'espace suivant**
(Conscience, ou Univers/Atelier/Pilotage) **qu'au feu vert d'Etoile** — toujours sans implémentation. Puis,
sur décision, la réalisation (E118/E119, derrière `/v4`, zéro dépense).

_Test de reconstruction du Socle — preuve d'INV-9/10. Dérivé du canon (STRUCTURE_SOCLE + Conscience +
cartographie + audit + v2 + E128). Aucune implémentation, aucune technologie, aucun écran, aucun nouvel
objet. Live intact. Lecture seule._

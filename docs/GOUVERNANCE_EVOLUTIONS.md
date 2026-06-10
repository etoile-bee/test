# GOUVERNANCE DES ÉVOLUTIONS — cadre A/B/C/D (E131)

> **EN-TÊTE DE GOUVERNANCE (modèle E131, appliqué à ce document même)**
> - **Statut** : **D — Nouvelle règle**.
> - **Acquis-source(s)** : [[E119]] (livraison unique), [[E120]] (conformité), [[E126]] (arbitrage proactif),
>   clôture de la fondation (11/06).
> - **Modifie un élément déjà verrouillé** : **NON** (méta-règle de processus ; ne touche aucun objet/
>   invariant/comportement du modèle métier).
>
> **⚠️ SIGNALEMENT HONNÊTE (exigé) :** **E131 est lui-même une NOUVELLE RÈGLE (catégorie D dans ses propres
> termes)**, **explicitement arbitrée et autorisée par l'auteur (Etoile, 11/06)**. C'est **précisément
> l'arbitrage explicite que la règle impose** : une règle de catégorie D ne s'intègre qu'après autorisation
> de l'auteur — ce qui est le cas ici. E131 **ne touche aucun objet/invariant/comportement** du modèle
> métier ; c'est une **méta-règle de processus** destinée à protéger la fondation close.
>
> **Statut de la fondation** : **CLOSE** (Etoile 11/06). Verrouillés, non rouvrables sauf **contradiction
> démontrable** : **Socle · Univers · Conscience · Atelier · Pilotage · Cartographie · Étanchéité · Audit
> global**. Contre-vérification **VERTE**.

---

## 1. POURQUOI CETTE RÈGLE
**Objectif déclaré** : **empêcher toute dérive conceptuelle progressive** après la clôture de la fondation.
Sans cadre, des « petites clarifications » successives pourraient, cumulées, **étendre le système en
douce**. E131 force chaque évolution à **déclarer sa nature** et **arrête** toute nouveauté avant arbitrage.

---

## 2. LES QUATRE CATÉGORIES
Toute évolution proposée à partir de maintenant **DOIT** être classée dans **exactement une** catégorie :

| Cat. | Nom | Définition | Traitement |
|---|---|---|---|
| **A** | **Clarification** d'un acquis existant | précise/explicite un acquis déjà validé, **sans rien changer** | **travail normal autorisé** |
| **B** | **Formalisation** d'un acquis existant | met en forme/structure un acquis déjà validé | **travail normal autorisé** |
| **C** | **Correction d'une contradiction démontrée** | corrige une incohérence **prouvée** dans le canon | **travail normal autorisé** (avec la preuve de contradiction) |
| **D** | **Nouvelle règle** | introduit un objet/invariant/responsabilité/règle métier/comportement **non déjà validé** | **🛑 ARRÊT OBLIGATOIRE + arbitrage explicite de l'auteur AVANT intégration** |

> **Règle dure** : **A / B / C** → on avance. **D** → **on s'arrête, on signale, on attend l'autorisation
> de l'auteur.** Aucune catégorie D n'entre dans le canon sans arbitrage explicite (comme E131 lui-même).

---

## 3. EN-TÊTE OBLIGATOIRE DE TOUT NOUVEAU DOCUMENT (modèle)
À partir de maintenant, **tout** nouveau document du canon commence par :

```
> EN-TÊTE DE GOUVERNANCE (E131)
> - Statut : A / B / C / D
> - Acquis-source(s) : <les éléments verrouillés/validés auxquels il se rattache>
> - Modifie un élément déjà verrouillé : OUI / NON
>     (si OUI → relève forcément de C [contradiction démontrée] ou de D [arbitrage de l'auteur])
```

- **Statut** : la catégorie A/B/C/D de l'évolution.
- **Acquis-source(s)** : à quoi elle se **rattache** (E###, invariants, M##, lois, espaces verrouillés).
- **Modifie un élément déjà verrouillé : OUI/NON** — si **OUI**, le document **ne peut être que C** (avec
  contradiction démontrée) **ou D** (avec arbitrage). Un **NON** + statut **A/B** = évolution sûre.

---

## 4. ARTICULATION AVEC LA FONDATION CLOSE
- Les **8 éléments verrouillés** (Socle · Univers · Conscience · Atelier · Pilotage · Cartographie ·
  Étanchéité · Audit global) ne se **rouvrent** que par une évolution **C** (contradiction démontrée) ou
  **D** (arbitrage de l'auteur). Une simple « clarification » (A) **ne peut pas** modifier un élément
  verrouillé — si elle le « doit », c'est qu'elle est en réalité **C** ou **D**.
- **Point ouvert connu** (hors fondation, non gravé) : la **calibration des signaux A/B** ; son éventuelle
  spécification relèvera de **D** (nouvelle règle) → **arbitrage requis** + contrainte **factuelle** (Loi
  II / `FRONTIERE_DU_MIROIR`).

---

## 5. CE QUE CE CADRE NE FAIT PAS
- Il **ne modifie aucun** objet/invariant/comportement du modèle métier (méta-règle de processus).
- Il **n'autorise pas** d'évolution **D** par lui-même : il **impose** l'arrêt et l'arbitrage.
- Il **n'est pas** une porte d'entrée à l'implémentation : la réalisation reste soumise à E118/E119, derrière
  `/v4`, zéro dépense, sur décision séparée.

---

_Gouvernance des évolutions (E131) — méta-règle de processus, catégorie D explicitement autorisée par
l'auteur (11/06). Protège la fondation close. Aucune implémentation, aucune modification du modèle métier.
Live intact. Lecture seule._

# MODÈLE MÉTIER v2 — CONSOLIDÉ (Phase 5.1 : nettoyage + audit final)

> **Statut : MODÉLISATION CONSOLIDÉE (analyse).** Application de **M19→M24** à tout le modèle (Phases 1→5
> refondues), **nouveau décompte**, **taxonomie à 4 niveaux**, **vérification des 15 invariants** et des
> **responsabilités**, puis **audit final de cohérence**. **Zéro vocabulaire d'interface.** Live intact ·
> fichiers verrouillés intacts · aucune dépense.
>
> **Ancrage `E127`** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.

---

## 0. ARBITRAGES APPLIQUÉS (M19→M24)

| # | Décision | Effet sur le modèle |
|---|---|---|
| **M19** | « Média actif » **n'est pas un objet** | → **rôle/état** porté par un média ; sort du niveau 1 |
| **M20** | **UN seul objet « Média produit »** à états (candidate · variante · active · écartée · retenue-pour-livrable) | Candidate & Variante **fusionnés** en états ; **Livrable reste distinct** |
| **M21** | Message · Émotion · Public · Objectif = **composantes de l'Intention** | sortent du niveau 1 → composantes |
| **M22** | **Coût = attribut** d'une production | sort du niveau 1 → attribut |
| **M23** | **Brique-modèle vs instance appliquée** (Look/Décor/Ambiance/Consigne/Preset…) | distinction **explicite et obligatoire** ; confusion rendue **impossible** |
| **M24** | **Taxonomie à 4 niveaux** ; « objet » réservé au **niveau 1** | reclassement de tout le modèle |

---

## 1. NOUVEAU DÉCOMPTE RÉEL

**Avant** : « 34 objets » (mélange de niveaux). **Après consolidation** : **24 objets de 1er niveau** + un
jeu clair d'**états / composantes-attributs / rôles dérivés**.

### Reclassements (ce qui quitte le niveau « objet »)
| Élément (ancien « objet ») | Devient | Réf. |
|---|---|---|
| **Candidate**, **Variante** | **états** d'un seul objet **Média produit** | M20 |
| **Média actif** | **rôle dérivé** (désignation exclusive) | M19 |
| **Message · Émotion · Public · Objectif** | **composantes** de l'Intention | M21 |
| **Coût** | **attribut** d'une production | M22 |
| **Paramètres** | **composante** du Projet (étanche) | M24 *(classement, à confirmer M27)* |
| **Évaluation de cohérence** | **vue dérivée** | M24 / AUD-9 |
| **Historique** | **vue dérivée** | M24 |
| **Brique réutilisable** (générique) | **catégorie** (famille) — les briques concrètes restent objets | M23 |

### Ce qui ENTRE / reste au niveau 1
- **Nouveau** : **Média produit** (unifié, M20).
- **Conservés** : Univers, Intention (composite), Personnage, Référence, Look, Décor, Ambiance, Consigne,
  Script, Voix, RAW, Montage, Légende, Hashtags, Contrôle qualité, Livrable, Version, Publication, Projet,
  Série, Décision, Bibliothèque, Preset.

> **Bilan : 24 objets de 1er niveau** (contre 34 « objets » mélangés auparavant) — **sans aucune perte de
> sens** : ce qui sort devient un état, une composante/attribut ou un rôle dérivé, **rien n'est supprimé**.

---

## 2. TAXONOMIE COMPLÈTE À 4 NIVEAUX (M24)

> **« Objet » est désormais réservé au NIVEAU 1.** Les trois autres niveaux ne sont jamais appelés
> « objets ».

### NIVEAU 1 — OBJETS DE 1er NIVEAU (identité stable · cycle de vie · persistants) — **24**
| # | Objet | Famille |
|---|---|---|
| 1 | **Univers** | monde |
| 2 | **Personnage** | identité |
| 3 | **Référence** | identité |
| 4 | **Intention** *(composite)* | pourquoi |
| 5 | **Projet** | production |
| 6 | **Série** | mémoire/organisation |
| 7 | **Média produit** *(unifié, M20)* | production |
| 8 | **RAW / média intermédiaire** *(AUD-5 ouvert → M26)* | production |
| 9 | **Montage** | production |
| 10 | **Légende** | diffusion |
| 11 | **Hashtags** | diffusion |
| 12 | **Contrôle qualité (QC)** | qualité |
| 13 | **Livrable** | diffusion |
| 14 | **Version** | mémoire |
| 15 | **Publication** | diffusion |
| 16 | **Script** | matière créative |
| 17 | **Voix** | matière créative |
| 18 | **Décision** | mémoire |
| 19 | **Bibliothèque** | capitalisation |
| 20 | **Look** *(brique-modèle)* | capitalisation |
| 21 | **Décor** *(brique-modèle)* | capitalisation |
| 22 | **Ambiance** *(brique-modèle)* | capitalisation |
| 23 | **Consigne de génération** *(brique-modèle)* | capitalisation |
| 24 | **Preset** *(brique-modèle de réglages)* | capitalisation |

> *Sous-types de brique non comptés à part (formes de capitalisation) : **Enchaînement** (montage
> réutilisable), **Style de sous-titres**. Voir M25 (à confirmer) sur le regroupement éventuel des briques
> créatives sous un seul objet « Brique ».*

### NIVEAU 2 — ÉTATS (conditions d'un objet, n'existent pas seules)
- **Média produit** : `candidate` · `variante` · `écartée` · `retenue-pour-livrable` *(et le rôle « active » au niveau 4)*.
- **Projet** : `brouillon` · `en cours` · `finalisé` · `archivé`.
- **Livrable** : `en construction` · `validé` · `prêt-à-poster` (M8) · `archivé`.
- **Publication** : `prêt-à-poster` → `publié` (définitif).
- **Contrôle qualité** : `non exécuté` · `conforme` · `alerte` · `forcé`.
- **Décision** : `prise` · `incomplète` (M17) · `annotée` · `supersédée`.
- **Script** : `brouillon` · `validé pour production` · `versionné`.
- **Voix** : `non produite` · `produite` · `re-réglée`.
- **Référence / Look / Décor / Consigne** : `libre` · `verrouillé`.
- **Univers / Personnage / Série / Brique** : `actif` · `archivé`.
- **Version** : `enregistrée` · `retenue` · `restaurée`.
- **Par pièce de cohérence** : `alignée` · `à vérifier` · `non définie` · `écart assumé`.

### NIVEAU 3 — COMPOSANTES / ATTRIBUTS (parties d'un objet, sans identité autonome)
- **Composantes de l'Intention** (M21) : `Message` · `Émotion` · `Public` · `Objectif`.
- **Attributs de l'Objectif** (M5) : `plateforme` · `format` · `durée`.
- **Composante du Projet** : `Paramètres` (réglages techniques, étanches) *(classement à confirmer M27)*.
- **Attribut du Montage** (M7) : `rythme`.
- **Attribut d'une production** (M22) : `Coût` (estimé / réel).
- **Attribut de la Décision** : `raison` (+ `annotations` datées).
- **Attributs de verrouillage / provenance** : `verrou` · `provenance` (d'une brique).
- **Instances appliquées (M23)** : `look appliqué` · `décor appliqué` · `ambiance appliquée` ·
  `consigne appliquée` · `preset appliqué` — **copies** d'une brique-modèle **dans un projet** (étanches).

### NIVEAU 4 — RÔLES DÉRIVÉS / VUES (désignations ou lectures calculées, jamais des sources)
- **Média actif** (M19) : **rôle exclusif** — la désignation d'un Média produit comme source courante.
- **Évaluation de cohérence** : **vue dérivée** (les 10 pièces vs Intention).
- **Historique** : **vue dérivée** chronologique (de l'ensemble Projets/Décisions/Versions/Publications).
- **Listes** (récents · file prêt-à-poster · états) : **vues filtrées** d'une source unique.

---

## 3. ZOOM — « MÉDIA PRODUIT » (M20) : un objet, des états

- **Objet** : `Média produit` — un média généré, à identité stable (porte aussi son **RAW** d'origine).
- **États successifs** (niveau 2) : `candidate` (non jugé) → `variante` (alternative conservée) →
  `écartée` (réversible) → `retenue-pour-livrable`.
- **Rôle** (niveau 4) : `média actif` — **un seul** Média produit est « actif » (source courante) à la fois.
- **Transitions = Décisions** (niveau structurant) ; le passage d'un état à l'autre **ne duplique pas** le
  média : **un seul fichier, plusieurs états**. *(supprime la duplication artificielle — objectif M20)*
- **Le Livrable reste un objet distinct** : c'est un **paquet** (média retenu + légende + hashtags +
  paramètres + RAW…), pas un état du média.

---

## 4. ZOOM — BRIQUE-MODÈLE vs INSTANCE APPLIQUÉE (M23)

> **Confusion rendue impossible** : un nom distinct pour la ressource réutilisable et pour sa copie projet.

| Notion | Niveau | Vit où | Mutabilité |
|---|---|---|---|
| **Brique-modèle** (Look/Décor/Ambiance/Consigne/Preset…) | **1 (objet)** | Bibliothèque (Univers) / garde-robe (Personnage) | éditable comme ressource ; **n'affecte aucun projet déjà servi** (M12) |
| **Instance appliquée** (`look appliqué`…) | **3 (composante du Projet)** | dans le Projet (copie) | éditable **dans le projet seulement**, étanche (E124) |

**Règle** : on **n'emploie jamais** une brique-modèle « en direct » dans un projet ; on en **copie une
instance** (M12). Modifier la brique-modèle ne touche pas les instances déjà copiées ; modifier une
instance ne touche pas la brique-modèle.

---

## 5. VÉRIFICATION DES 15 INVARIANTS (un par un)

| Invariant | Impacté par la simplification ? | Vérification |
|---|---|---|
| **INV-1** Primauté de l'intention | **Non** | l'Intention reste objet de 1er niveau (composite) ; ses composantes (L3) la renforcent |
| **INV-2** Question centrale, sans décision auto | **Non** | l'Évaluation de cohérence (vue dérivée L4) signale les 10 pièces, ne décide pas |
| **INV-3** Séparation OBJET/ÉTAT/ACTION/DÉCISION | **RENFORCÉ** | la taxonomie 4 niveaux **clarifie** la séparation (média actif n'est plus « objet ») |
| **INV-4** Décision structurante porte son pourquoi | **Non** | inchangé (raison obligatoire/​proposée ; états de Décision préservés) |
| **INV-5** Immuabilité du passé | **Non** | Décisions/RAW/Versions/Publications inchangés |
| **INV-6** Réversibilité jusqu'à publier | **Non** | les états du Média produit (écartée→réactivable) **expriment mieux** la réversibilité |
| **INV-7** Un seul acte irréversible : publier | **Non** | Publication inchangée |
| **INV-8** Rien ne se perd/supprime en silence | **Non** | fusionner Candidate/Variante en états ne supprime rien (mémoire intacte) |
| **INV-9** Survie de l'état complet | **Non** | états/rôles font partie du Projet (source de vérité), donc survivent |
| **INV-10** Source de vérité unique | **RENFORCÉ** | Historique/Évaluation/listes classés **vues dérivées** (L4) — jamais sources |
| **INV-11** Étanchéité par copie explicite | **RENFORCÉ** | brique-modèle vs instance appliquée (M23) rend l'étanchéité **explicite** |
| **INV-12** Contrat d'effet | **Non** | inchangé |
| **INV-13** Capitalisation tracée | **Non** | provenance reste attribut de la brique ; briques restent objets de 1er niveau |
| **INV-14** Hiérarchie du monde | **Non** | UNIVERS→PERSONNAGE→PROJET→LIVRABLES intacte (Média produit est interne au Projet) |
| **INV-15** Séparation modèle/représentation | **Non** | la consolidation est 100 % au niveau domaine, indépendante de toute forme |

> **Conclusion** : **aucun invariant affaibli** ; **trois sont renforcés** (INV-3, INV-10, INV-11). La
> simplification **sert** la philosophie au lieu de la diluer.

---

## 6. VÉRIFICATION DES RESPONSABILITÉS (après simplification)

| Zone | Responsabilité nette ? | Vérification |
|---|---|---|
| **Média produit / états** | ✅ | un seul objet porte tout le cycle ; « actif » = rôle exclusif ; plus de duplication |
| **Brique vs instance** | ✅ | noms distincts (M23) ; possession et étanchéité explicites |
| **Intention composite** | ✅ | Message/Émotion/Public/Objectif = composantes ; un seul propriétaire (l'Intention) |
| **Univers / Série / Personnage / Projet** | ✅ | Univers = monde+règles globales ; Série = contraintes de son sous-ensemble (AUD-8) ; Personnage = identité ; Projet = production (emploie un Personnage, appartient à l'Univers) |
| **Coût** | ✅ | attribut d'une production (estimé/réel), plus d'objet flottant |
| **Vues dérivées** (Historique, Évaluation de cohérence) | ✅ | clairement non-sources ; pas de cycle de vie d'objet |
| **RAW** | ⚠️ *(AUD-5 / M26 ouvert)* | conservé comme objet de 1er niveau pour l'instant ; reste à trancher : objet **ou** rôle d'immuabilité du Média produit |

---

## 7. AUDIT FINAL DE COHÉRENCE (modèle consolidé)

- **Contradictions résiduelles ?** **Aucune.** La contradiction majeure (média actif objet vs état,
  AUD-1) est levée ; INV-3 est respecté partout.
- **Doublons restants ?** **Aucun structurel.** Candidate/Variante/Média actif fusionnés ;
  Message/Émotion/Public/Objectif rattachés à l'Intention ; Coût = attribut. *Résiduel mineur* : **RAW vs
  Média produit** (M26, à confirmer).
- **Responsabilités nettes ?** **Oui** (cf. §6), sauf le point RAW à confirmer.
- **Complexité maîtrisée ?** **Oui** : **24 objets** lisibles + 3 niveaux secondaires explicites, au lieu
  d'un sac de « 34 objets ».
- **Ambiguïtés levées ?** **Oui** pour modèle/instance (M23), objet/état (M19/M20), niveaux (M24). *Restent
  à clarifier (mineur)* : nommage de la pièce de cohérence « publication » (AUD-15), frontière
  retouche/remplacement (AUD-16), terme Message/Idée (AUD-17) — **non bloquants**.

### VERDICT
> **Le modèle consolidé est SAIN et PRÊT à servir de fondation.** Il est **plus simple** (24 objets de 1er
> niveau), **plus rigoureux** (taxonomie 4 niveaux, séparation OBJET/ÉTAT/ACTION/DÉCISION respectée
> partout), **sans perte de sens** et **sans invariant affaibli** (3 renforcés). Les points restants
> (RAW, nommages) sont **mineurs et non bloquants**.

---

## 8. QUESTIONS RÉSIDUELLES (à confirmer — non tranchées)

| # | Question | Défaut proposé | Raison |
|---|---|---|---|
| **M25** | Regrouper les **briques créatives** (Look/Décor/Ambiance/Consigne/Preset) sous un seul objet « Brique » à sous-types ? | **Non** — les garder distinctes (vocabulaire d'Etoile), « Brique » reste la **catégorie** | clarté métier ; éviter une abstraction prématurée |
| **M26** | **RAW** = objet de 1er niveau **ou** rôle d'immuabilité du Média produit ? | **Rôle d'immuabilité** (le RAW est la version brute, jamais écrasée, d'un Média produit) | évite un doublon avec Média produit (AUD-5) |
| **M27** | **Paramètres** = composante du Projet (niveau 3) **ou** objet de 1er niveau ? | **Composante du Projet** (étanche, sans identité hors projet) ; le **Preset** est sa forme réutilisable (objet) | cohérence avec M24 (pas d'identité autonome) |

> M25–M27 sont des **finitions** ; elles n'affectent pas le verdict (modèle sain). À trancher avant la
> reprise de la forme, ou en passe de nettoyage.

---

_Modèle consolidé v2 — dérivé de E127 (6 piliers). Refond les Phases 1→5 (M1→M24 intégrées). 24 objets de
1er niveau · taxonomie 4 niveaux · 15 invariants vérifiés. Aucune implémentation, aucune représentation.
Live intact. Lecture seule._

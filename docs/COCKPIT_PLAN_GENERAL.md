# COCKPIT — PLAN GÉNÉRAL (la structure d'ensemble)

> **Statut : architecture concrète, niveau PLAN GÉNÉRAL (convergence).** Répond **uniquement** aux 10
> questions de structure : **où vit quoi, comment c'est organisé d'ensemble**. **Pas** d'écrans détaillés,
> **pas** de catalogue de commandes, **pas** d'implémentation. Dérivé du **modèle consolidé v2**, des **15
> invariants** et de la réalité du cockpit consolidé. Live intact · fichiers verrouillés intacts · aucune
> dépense.
>
> **Traçabilité (`E127`)** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance ·
> ⑥ Contrôle · INV-1…15.
>
> **Deux principes de structure qui gouvernent toutes les réponses :**
> - **Un seul espace vivant** qui **se transforme en place** — jamais un empilement d'écrans. *(INV-9/10)*
> - **Le dossier-projet = la source de vérité.** Tout ce qui est montré **en dérive** ; rien dans
>   l'affichage ne « détient » l'état. *(INV-10)*

---

## 1. L'ESPACE PRINCIPAL dans lequel l'utilisateur vit et pilote
**Un espace unique : le projet lui-même.** C'est **un seul lieu vivant** qui **se met à jour en place** au
fil du travail — on ne « passe pas d'un écran à un autre », **le même espace se reconfigure** selon ce qu'on
fait. Derrière lui, **le dossier-projet** (la source de vérité) contient tout ; l'espace n'en est que la
**présentation vivante**.

> Structure : 1 espace ↔ 1 projet ↔ 1 dossier. *(⑤⑥ · INV-9 survie · INV-10 source unique)*

## 2. Ce qui est VISIBLE EN PERMANENCE
Le **socle constant**, toujours présent en tête de l'espace, quel que soit le travail en cours :
- **la boussole** — l'intention en bref (message · émotion · public · destination) ;
- **le nom et l'état** du projet (en chantier / abouti / publié) ;
- **les pièces actives** — personnage employé, look/décor/ambiance en cours, **avec leurs verrous** ;
- **le média actif** (la source courante) ;
- **les variantes** (leur présence et leur accès) ;
- **le livrable en préparation** ;
- **le repère de cohérence** (sert-on encore l'intention ?).

> Structure : c'est le **cadre permanent** — il ne disparaît jamais sous une fonction. *(① boussole · ⑤
> lisibilité · ⑥ contrôle · INV-1/3/9)*

## 3. Ce qui apparaît SEULEMENT QUAND C'EST UTILE
Le **socle reste** ; **par-dessus**, des éléments **surgissent à la demande puis se retirent**, rendant
l'espace à son état permanent :
- les **bibliothèques / le capital** (quand on veut réutiliser une brique) ;
- les **éditeurs** (retouche d'image, réglages) ;
- l'**historique détaillé** (décisions + raisons, versions) ;
- la **comparaison de variantes** ;
- la **confirmation de coût** (avant toute dépense) ;
- le **récap / contrôle final** (au moment d'aboutir).

> Structure : **permanent = le pilotage ; à la demande = les outils**. Rien d'éphémère ne s'incruste.
> *(⑤ contrat/lisibilité · ⑥ · INV-12 effet annoncé)*

## 4. Où vit l'INTENTION
**À deux endroits cohérents, une seule vérité :**
- **dans le dossier-projet**, comme **objet composite** (message·émotion·public·objectif + le **déclencheur**
  d'origine) — c'est **là qu'elle existe vraiment** ;
- **en tête de l'espace**, comme **boussole permanente** — c'est sa **présence** constante.

La boussole affichée **n'est qu'un reflet** de l'intention du dossier (jamais une copie qui dériverait).

> Structure : intention = **composante-racine** du projet, **toujours visible**. *(① · INV-1/10)*

## 5. Où vit la MÉMOIRE
**Dans le dossier-projet d'abord** : décisions **+ raisons**, versions successives de l'intention, variantes
essayées, versions du projet, livrables — **tout y est conservé, rien n'est effacé**. **Au-dessus**,
**l'Historique** est une **vue dérivée** : la lecture chronologique transverse de cette mémoire (et de tous
les projets).

> Structure : **mémoire = dans le dossier (vérité)** ; **Historique = vue** (pas un stock séparé). *(③ ·
> INV-5/8/10)*

## 6. Où vit le CAPITAL (bibliothèques, briques réutilisables)
**Dans l'UNIVERS**, **à part de la production** d'un projet. Les bibliothèques (looks, décors, ambiances,
consignes, presets…) sont des **briques-modèles** du monde, **séparées** de ce qui se fabrique dans un
projet. On les **réutilise par copie** : employer une brique dépose une **instance appliquée** (étanche)
dans le projet — l'original n'est jamais touché, et le projet n'est jamais modifié rétroactivement.

> Structure : **capital = niveau Univers** ; **production = niveau Projet** ; **pont = la copie**. *(④ ·
> INV-11/13/14)*

## 7. Où vivent les VARIANTES
**Dans le projet, attachées au média produit** — **jamais** dans une bibliothèque (ce ne sont pas des
briques réutilisables : ce sont des **états/alternatives** du média de **ce** projet). Leur **présence et
leur accès** font partie du socle permanent (Q2) ; leur **comparaison** apparaît à la demande (Q3).

> Structure : variante = **interne au projet**, rattachée au **Média produit** (objet à états). *(⑥ ·
> INV-3/8)*

## 8. Comment on passe d'une IMAGE à une VIDÉO sans changer d'outil
**On ne change pas d'outil : on reste dans le MÊME projet, dans le MÊME espace.** L'image validée (le média
retenu) **devient la source de la vidéo** — la continuité est **naturelle**, pas une bascule. « Photo » et
« Vidéo » ne sont **pas deux outils** ni deux projets : ce sont **deux points d'entrée / deux livrables d'un
seul moteur**, sur **un seul dossier-projet**. L'intention, le personnage, les pièces actives **restent les
mêmes** ; seule la matière produite s'enrichit.

> Structure : **un moteur, un projet, plusieurs livrables** (image / vidéo / les deux). *(① · INV-14 ·
> modèle A — un seul projet)*

## 9. Comment on retrouve un PROJET TROIS MOIS PLUS TARD
**Par les Récents** — une **vue filtrée de l'Historique** (pas un stock à part). Grâce à l'**identité stable**
du projet (préservée dans le temps et à travers toute migration), on **rouvre le dossier-projet** et on
**retombe exactement où on en était** : le média actif, les variantes, l'état — **plus** l'**intention** (et
comment elle a mûri) **et** les **décisions avec leur pourquoi**. Le projet **se réexplique tout seul**.

> Structure : **Récents/Historique = vues** d'un magasin unique ; **reprise = réouverture du dossier**.
> *(③ · M18 identité stable · INV-9 reprise exacte · INV-5/10)*

## 10. Le PARCOURS GLOBAL, VU D'EN HAUT
Un seul **circuit**, qui **boucle** :

```
        ┌──────────────────────── UNIVERS (le monde : capital, règles, personnages) ───────────────────────┐
        │                                                                                                   │
        │   ENTRÉE                ESPACE VIVANT DU PROJET                 FINALISATION         PUBLICATION   │
        │  (Photo / Vidéo  ─▶  [ boussole · état · pièces · média actif ·  ─▶  version retenue  ─▶  publier  │
        │   = points d'entrée     variantes · cohérence ] (se transforme       → livrable           (seul    │
        │   d'UN SEUL moteur)      en place : produire/juger/décider/            autonome →          acte     │
        │                          revenir/mûrir l'intention)                   prêt-à-poster)      définitif)│
        │                                                                                              │      │
        └──────────────  RETOUR : Récents / Historique (vues) ◀── la mémoire reste, le capital grandit ◀─────┘
                                          │
                                          └─▶ (un publié peut devenir un nouveau déclencheur → la boucle repart)
```

- **Univers** = le sol persistant (capital, règles, personnages) d'où **part** chaque projet et où il
  **revient enrichi**.
- **Entrée** = Photo/Vidéo, **points d'entrée d'un seul moteur** (jamais deux outils).
- **Espace vivant** = le cœur (Q1-Q3), où tout se vit en place.
- **Finalisation → Publication** = version retenue → livrable autonome → prêt-à-poster → **publier** (seul
  acte irréversible, annoncé).
- **Retour** = Récents/Historique (vues), mémoire conservée, capital grandi ; **un publié peut relancer la
  boucle**.

> Structure d'ensemble : **Univers → entrée → espace-projet → finalisation → publication → retour → (boucle)**.
> *(tous piliers · INV-7 acte unique · INV-10 vues · INV-11/13/14 capital & monde · INV-1 cap permanent)*

---

## SYNTHÈSE DE STRUCTURE (où vit quoi, en une vue)
| Élément | Où il vit | Permanent / à la demande | Pilier·INV |
|---|---|---|---|
| **Intention** (boussole) | dossier-projet + en tête de l'espace | permanent | ① · INV-1 |
| **Nom / état / pièces actives + verrous / média actif** | dossier-projet, socle de l'espace | permanent | ⑤⑥ · INV-3/9 |
| **Variantes** | dans le projet, attachées au média produit | accès permanent ; comparaison à la demande | ⑥ · INV-3/8 |
| **Livrable** | dans le projet | présence permanente ; récap à la demande | ⑥③ · INV-9 |
| **Repère de cohérence** | dérivé, en tête | permanent | ② · INV-2 |
| **Mémoire (décisions+raisons, versions)** | dossier-projet (vérité) ; Historique = vue | détail à la demande | ③ · INV-5/8/10 |
| **Capital (bibliothèques, briques)** | Univers, à part de la production | à la demande, réutilisé par copie | ④ · INV-11/13/14 |
| **Éditeurs / confirmation de coût / récap** | par-dessus l'espace | à la demande | ⑤ · INV-12 |
| **Récents / Historique** | vues filtrées d'un magasin unique | à la demande | ③ · INV-10 |

---

## CE QUE CE PLAN EST / N'EST PAS
- **C'est** la **structure d'ensemble** : où vivent les choses, ce qui est permanent vs à la demande, le
  circuit vu d'en haut.
- Ce **n'est pas** : des écrans détaillés, un catalogue de commandes, ni de l'implémentation.
- Il **n'ajoute aucun objet ni couche** (modèle v2 clos) ; il **organise** concrètement ce qui existe déjà.

---

_Plan général du cockpit — structure d'ensemble dérivée du modèle consolidé v2 et des 15 invariants (E127).
Aucune implémentation, aucun écran détaillé, aucun nouvel objet. Live intact. Lecture seule._

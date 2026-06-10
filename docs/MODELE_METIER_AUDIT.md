# MODÈLE MÉTIER — AUDIT CRITIQUE (Phases 1→5)

> **Statut : AUDIT ADVERSARIAL (analyse).** Objectif : **chercher les faiblesses**, pas tamponner. Même
> exigence d'honnêteté que pour le constat « l'Intention manquait » et « l'Univers manquait ». **Zéro
> vocabulaire d'interface.** Live intact · fichiers verrouillés intacts · aucune dépense.
>
> Périmètre : modèle complet validé (34 objets / 5 familles), M1→M18 tranchées, 15 invariants. Pour chaque
> faiblesse : **gravité (🔴/🟠/🟡) · explication · recommandation (défaut + raison, « à confirmer »)** —
> **rien n'est tranché en douce.** Les recommandations sont numérotées **AUD-n** (deviendraient M19+ si
> Etoile décide de les retenir).
>
> **Ancrage `E127`** : ① Intention · ② Cohérence · ③ Mémoire · ④ Capitalisation · ⑤ Confiance · ⑥ Contrôle.

---

## SYNTHÈSE EN UNE LIGNE
Le modèle est **fondamentalement sain et cohérent** (l'ossature pilier→objet→relation→cycle→règle tient),
**mais il confond encore par endroits OBJET / ÉTAT / ATTRIBUT** — ce qui **gonfle artificiellement le
compte d'objets** et crée 2-3 ambiguïtés à lever **avant** de reprendre la forme. Aucune faiblesse n'est
rédhibitoire ; trois corrections sont prioritaires (AUD-1, AUD-2, AUD-7).

---

## AXE 1 — CONTRADICTIONS

### 🔴 AUD-1 — « Média actif » est compté comme OBJET mais défini comme ÉTAT
- **Explication** : la Phase 1 liste **Média actif comme objet n°17** (sur 34), or la Phase 4 (et l'exemple
  canonique d'Etoile) le définit explicitement comme un **ÉTAT / rôle exclusif** (« Média actif = un
  ÉTAT »). C'est une **contradiction directe avec INV-3** (séparation OBJET/ÉTAT) au cœur du modèle.
- **Recommandation *(défaut, à confirmer)*** : **retirer « Média actif » de la liste des objets** ; le
  traiter comme un **état/rôle** porté par un média produit. *Raison* : cohérence avec l'exemple canonique
  et INV-3 ; conséquence : le compte d'objets baisse.

### 🟠 AUD-2 — Candidate / Variante / Média actif : objets distincts ou ÉTATS d'un même média ?
- **Explication** : si « média actif » est un **état** (AUD-1), alors par **symétrie**, *candidate*,
  *variante*, *écartée*, *livrable-source* ressemblent fortement à des **états successifs d'un même OBJET
  “Média produit”**, pas à des objets distincts. Les modéliser en objets séparés **multiplie les entités**
  pour une seule réalité (le même fichier qui change de statut).
- **Recommandation *(défaut, à confirmer)*** : **un seul OBJET « Média produit »** doté d'un **cycle
  d'états** {candidate → variante → actif → écarté ; et “retenu pour livrable”}. **Le Livrable reste un
  objet distinct** (c'est un *paquet* : média + légende + hashtags + params…), pas un simple média.
  *Raison* : aligne le modèle sur sa propre règle OBJET/ÉTAT (INV-3), simplifie sans rien perdre du sens
  (les transitions restent des Décisions).

### 🟡 AUD-3 — INV-14 (hiérarchie) vs liens réels de Phase 2
- **Explication** : INV-14 pose **UNIVERS → PERSONNAGE → PROJET → LIVRABLES** (lecture « le Personnage est
  au-dessus du Projet »), alors que la Phase 2 dit **Projet — *emploie* → Personnage** (association ; le
  Personnage *survit* au projet, n'en est pas le parent). Léger télescopage : le Projet est-il **possédé
  par** le Personnage, ou **par l'Univers** (et *emploie* un Personnage) ?
- **Recommandation *(défaut, à confirmer)*** : le **Projet appartient à l'Univers** (conteneur) et
  **emploie** un Personnage (association + copie). La hiérarchie INV-14 est **conceptuelle** (« un projet
  est fait pour un personnage, dans un univers »), pas une chaîne de possession stricte. *Raison* : évite
  de faire du Personnage un propriétaire de projets, ce qui recréerait la surcharge qu'on vient de retirer.

---

## AXE 2 — DOUBLONS

### 🟠 AUD-4 — Message / Émotion / Public / Objectif : objets **ou** composantes de l'Intention ?
- **Explication** : M4 a tranché **Intention = objet composite** (Message+Émotion+Public+Objectif). Mais la
  Phase 1 **compte encore ces 4 comme des objets** (n°2,3,4,5). C'est un **doublon de niveau** : ils sont
  à la fois « objets » et « composantes de l'Intention ».
- **Recommandation *(défaut, à confirmer)*** : les traiter comme **composantes structurées de l'Intention**
  (attributs riches), **pas comme objets de 1er niveau**. *Raison* : cohérence avec M4 ; un Message/Émotion
  n'a pas d'identité ni de cycle de vie propres hors de l'Intention.

### 🟠 AUD-5 — Candidate vs RAW (média brut)
- **Explication** : une **Candidate** = média produit non jugé ; le **RAW image** = brut de l'étape image,
  jamais écrasé. Au point de génération, **c'est souvent le même fichier dans deux rôles** (« le brut » et
  « le candidat à juger »). Risque de doublon conceptuel.
- **Recommandation *(défaut, à confirmer)*** : faire du **RAW un rôle d'immuabilité/conservation** porté par
  un média (« cette version brute ne sera jamais écrasée ») plutôt qu'un **objet** parallèle. *Raison* :
  évite de dupliquer la matière ; conserve la garantie (jamais écrasé) comme **propriété**, pas comme entité.

### 🟠 AUD-6 — Coût : objet ou attribut ?
- **Explication** : le **Coût** est modélisé en objet, mais il n'a ni cycle de vie propre ni identité
  autonome : il **mesure** une action de production (estimé/réel). C'est un candidat naturel à l'**attribut**.
- **Recommandation *(défaut, à confirmer)*** : **Coût = attribut structuré** rattaché à l'action/au média
  produit (estimé avant, réel après). *Raison* : un coût n'existe pas « seul » ; il qualifie une production.

### 🟡 AUD-12 — Public vs personnage_visé (référence en double du Personnage)
- **Explication** : l'Intention porte `public` (l'audience) **et** `personnage_visé` (lien Personnage),
  alors que le **Projet emploie déjà un Personnage**. Le Personnage est donc référencé **deux fois**
  (Intention + Projet). *Public* et *personnage_visé* ne sont pas doublons entre eux (audience ≠ incarnation),
  mais `personnage_visé` **double** le lien du Projet.
- **Recommandation *(défaut, à confirmer)*** : **un seul lien Personnage**, porté par le **Projet**
  (emploie) ; l'Intention n'a pas besoin de re-référencer le Personnage. *Raison* : source unique du lien,
  évite l'incohérence si l'un change.

### 🟡 AUD-13 — Doublons examinés et jugés **sains** (à conserver)
- **Ambiance vs Décor** : distincts (atmosphère vs lieu) — **OK** (M1), risque résiduel seulement si en
  pratique l'ambiance est toujours liée à un décor (à surveiller à l'usage).
- **Consigne/Prompt vs Script** : distincts (instruction de fabrication vs texte prononcé) — **OK**.
- **Évaluation de cohérence vs Contrôle qualité** : distincts (alignement intention vs aptitude technique) —
  **OK** (M9) ; veiller au nommage pour éviter la confusion à l'usage.
- **Série vs Univers** : distincts (regroupement éditorial de projets vs le monde entier) — **OK** (un
  univers peut contenir plusieurs séries).

---

## AXE 3 — OBJETS REDONDANTS (attribut/état plutôt qu'objet, ou fusion)
Synthèse des candidats issus des axes 1-2 (tous *à confirmer*) :

| Objet listé | Statut proposé | Réf. |
|---|---|---|
| **Média actif** | → **ÉTAT/rôle** (pas objet) | AUD-1 |
| **Candidate · Variante** | → **états** d'un OBJET « Média produit » unique | AUD-2 |
| **Message · Émotion · Public · Objectif** | → **composantes** de l'Intention | AUD-4 |
| **RAW** | → **rôle d'immuabilité** d'un média | AUD-5 |
| **Coût** | → **attribut** d'une production | AUD-6 |
| **Hashtags** | objet validé (M6), mais réexaminable comme **attribut du Livrable** | 🟡 AUD-14 |

> **Si ces regroupements sont retenus**, le modèle passerait d'environ **34 « objets »** à **~24-26 objets
> de 1er niveau** + un jeu clair d'**états / composantes / attributs / rôles** — **sans rien perdre du
> sens**.

---

## AXE 4 — RESPONSABILITÉS MAL RÉPARTIES

### 🟠 AUD-7 — « Look » vit à trois endroits : garde-robe, Bibliothèque, et copie projet
- **Explication** : un Look existe comme **brique réutilisable** (garde-robe du Personnage **et/ou**
  Bibliothèque de l'Univers) **et** comme **copie employée dans le Projet**. Sous **un seul nom “Look”**,
  on a en réalité **deux notions** : le **modèle** (réutilisable) et l'**instance appliquée** (dans un
  projet). Frontière floue → confusion sur « quel Look est le vrai ».
- **Recommandation *(défaut, à confirmer)*** : distinguer nommément **« Look-modèle »** (brique,
  réutilisable, en Bibliothèque/garde-robe) et **« Look appliqué »** (instance copiée dans le projet,
  étanche M12). Idem pour **Décor / Ambiance / Consigne / Preset**. *Raison* : clarifie la possession et
  l'étanchéité ; supprime l'ambiguïté « modèle vs instance ».

### 🟠 AUD-8 — Règles éditoriales : Univers **et** Série
- **Explication** : l'**Univers** porte des *règles éditoriales/visuelles* ; la **Série** porte des *règles
  de cohérence inter-projets*. Recouvrement possible des responsabilités (où vit l'anti-répétition ?).
- **Recommandation *(défaut, à confirmer)*** : **Univers = règles globales** (charte, ligne, lignes de
  publication) ; **Série = contraintes spécifiques à un sous-ensemble** (ex. anti-répétition entre **ses**
  projets). *Raison* : deux portées distinctes, pas de chevauchement.

### 🟡 AUD-9 — Évaluation de cohérence : objet **dérivé** au milieu d'objets persistants
- **Explication** : c'est le seul « objet » qui est en réalité une **lecture dérivée** (recalculée), pas un
  objet stocké à identité stable. Le ranger parmi les objets peut tromper.
- **Recommandation *(défaut, à confirmer)*** : le qualifier explicitement de **vue/évaluation dérivée**
  (comme l'Historique), distincte des objets persistants. *Raison* : éviter de lui prêter un cycle de vie
  d'objet (il n'a ni création ni archivage propres ; seuls les **écarts assumés** qu'il produit sont des
  Décisions persistantes).

---

## AXE 5 — RISQUES DE COMPLEXITÉ INUTILE

### 🟠 AUD-10 — Le compte « 34 objets » mélange quatre niveaux
- **Explication** : « 34 objets » additionne des **objets de 1er niveau** (Projet, Univers, Personnage,
  Livrable, Décision…), des **états** (Média actif), des **composantes** (Message/Émotion/Public/Objectif),
  des **attributs** (Coût) et des **rôles** (RAW). Mélanger ces niveaux **donne une fausse impression de
  complexité** et fragilise la rigueur OBJET/ÉTAT/ACTION/DÉCISION qu'Etoile demande.
- **Recommandation *(défaut, à confirmer)*** : produire une **taxonomie à 4 niveaux** — *objets de 1er
  niveau* · *états* · *composantes/attributs* · *rôles dérivés* — et **n'appeler “objets” que le 1er
  niveau** (~24-26). *Raison* : c'est la simplification la plus rentable ; elle clarifie sans rien retirer.

### 🟡 AUD-11 — Objets « rares » : Série, Ambiance, Hashtags
- **Explication** : certains objets seront peu manipulés au quotidien (Série, Ambiance distincte, Hashtags
  comme objet). Ils sont **justifiés** mais ajoutent de la surface.
- **Recommandation *(défaut, à confirmer)*** : **les garder** (ils servent un pilier) mais les marquer
  **“optionnels/avancés”** dans le modèle, pour ne pas alourdir le tronc commun. *Raison* : présence
  justifiée, poids maîtrisé.

---

## AXE 6 — ÉLÉMENTS ENCORE AMBIGUS

### 🟡 AUD-15 — La pièce de cohérence « publication » vs l'objet **Publication**
- **Explication** : parmi les 10 pièces surveillées figure **« publication »**, alors que **Publication**
  est aussi l'**événement irréversible**. Or on ne peut pas « vérifier la dérive » d'un acte non encore
  posé. La pièce désigne en fait l'**adéquation de l'objectif/destination** (plateforme/format) à
  l'intention.
- **Recommandation *(défaut, à confirmer)*** : renommer la pièce surveillée **« destination/objectif »**
  (et réserver « Publication » à l'événement). *Raison* : lève la confusion nom-événement vs nom-critère.

### 🟡 AUD-16 — « Média produit » : où s'arrête le mineur, où commence le structurant ?
- **Explication** : « éditer (retouche locale) » d'une candidate est *mineur* (pas de Décision), mais une
  retouche peut devenir *un remplacement de fait*. Frontière fine entre **retouche** et **remplacement**.
- **Recommandation *(défaut, à confirmer)*** : règle simple — **tant que le média garde son identité**
  (mêmes pixels d'origine ajustés) = mineur ; **dès qu'un nouveau média est généré** (régénération) =
  structurant (remplacement). *Raison* : critère objectif aligné sur M15.

### 🟡 AUD-17 — « Idée » vs « Message » : deux noms, un concept
- **Explication** : la Phase 1 nomme l'objet « Message (ou Idée) ». Deux étiquettes pour une chose.
- **Recommandation *(défaut, à confirmer)*** : **un seul terme** (« Message »), « Idée » comme synonyme
  informel. *Raison* : vocabulaire unique = moins d'ambiguïté.

---

## SYNTHÈSE — le modèle est-il sain ? quelles corrections d'abord ?

**Le modèle est sain dans l'ensemble.** Sa philosophie (6 piliers), ses relations, ses cycles de vie, son
focus Décision et ses 15 invariants sont **solides et cohérents**. Les faiblesses trouvées **ne remettent
pas en cause l'architecture** : ce sont surtout des **questions de niveau** (objet vs état vs
composante/attribut/rôle) et **deux frontières à préciser**.

**Corrections PRIORITAIRES avant de reprendre la forme :**
1. **🔴 AUD-1 + 🟠 AUD-2** — trancher OBJET vs ÉTAT pour les médias produits (Média actif = état ; et
   Candidate/Variante = états d'un « Média produit » unique ?). *C'est la correction la plus structurante :
   elle découle de la propre règle OBJET/ÉTAT du modèle.*
2. **🟠 AUD-10 + AUD-4 + AUD-6** — assainir le **compte d'objets** via une taxonomie à 4 niveaux
   (objets / états / composantes-attributs / rôles) : Message/Émotion/Public/Objectif → composantes ;
   Coût → attribut.
3. **🟠 AUD-7** — distinguer **modèle (brique) vs instance appliquée** pour Look/Décor/Ambiance/Consigne.

**Secondaires** : AUD-3 (hiérarchie vs association), AUD-5 (RAW = rôle), AUD-8 (règles Univers/Série),
AUD-12 (lien Personnage unique), AUD-9/15/16/17 (clarifications de nommage/frontières).

> **Recommandation de méthode** : appliquer AUD-1/2/10 **avant** de reprendre la forme — car une forme
> dérivée d'un modèle qui confond objet et état hériterait de la confusion. Les autres points peuvent être
> traités en passe de nettoyage. **Aucune de ces recommandations n'est tranchée** : elles attendent
> l'arbitrage d'Etoile (deviendront M19+ si retenues).

_Audit critique — Phases 1→5. Dérivé de E127. Aucune implémentation, aucune représentation. Live intact.
Lecture seule._

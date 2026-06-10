# COCKPIT PAR LES PILIERS — la forme dérivée du modèle métier

> **Statut : CONCEPTION (aucune implémentation).** Le modèle métier validé par Etoile (10/06) est la
> **référence absolue** (`E127`). Ce document descend vers la **forme concrète** du cockpit — sur le
> médium réel (Telegram, bloc unique édité en place) — mais **chaque choix part du besoin** : il dérive
> d'au moins un des 6 piliers. Rien n'est dessiné « parce que c'est joli » ou « parce que le moteur sait
> le faire ». Live intact · fichiers verrouillés intacts · aucune dépense.
>
> **Phrase centrale (boussole de tout le document)** :
> « Je pilote la transformation d'une **intention** en contenu **publiable**, par une suite de décisions
> **cohérentes, réversibles et mémorisées**, dans un système en qui j'ai **confiance** — jusqu'au seul
> acte définitif : **publier**. »

---

## 0. CONSTAT FONDATEUR (E120) — l'intention-boussole MANQUE

Vérification factuelle du moteur (`ui/project_store.js`, objet `manifest`) :

| Objet de 1er niveau présent | Objet de 1er niveau ABSENT |
|---|---|
| référence · look · décor · prompt (zones) · paramètres · média actif · variantes · livrables · versions · QC · coûts · statuts | **INTENTION** (message · émotion · personnage · public · objectif de publication) |

> `grep -rni "intention" ui/*.js` = **0 résultat**. Le projet sait dire **COMMENT** il fabrique (réf,
> look, décor, prompt) mais **pas POURQUOI** ni **POUR QUI** ni **POUR QUELLE DESTINATION**.

**Conclusion** : le soupçon d'Etoile est confirmé. Le **pilier 1 n'a aucun support moteur**. Tout le
reste (réf/look/décor/prompt) sont des **moyens** orphelins d'une **fin**. C'est le **déficit
structurel** : sans intention de premier niveau, la question centrale « est-ce que ça sert encore
l'intention ? » est **littéralement impossible à poser** par l'outil. → **L'intention est la fondation à
poser en premier ; tous les autres piliers s'y accrochent.**

---

## 1. PILIER 1 — INTENTION (la boussole) → *à construire, fondation*

**Besoin** : une boussole **présente en permanence**, courte, modifiable, qui gouverne tout le projet.

### 1.1 L'objet INTENTION (premier niveau du manifest)
```
intention: {
  message:    "ce que je veux dire (1 phrase)",
  emotion:    "ce que je veux faire ressentir",
  personnage: "qui porte le message (réf liée)",
  public:     "à qui je parle",
  objectif:   { plateforme: "TikTok|Reels|Shorts", format: "9:16", duree_cible: "23s", destination: "publier|tester" },
  cree_le, modifie_le
}
```
Au même rang que `reference`/`look`/`zones`. C'est **la première chose** qu'on définit, **la dernière**
qu'on perd.

### 1.2 Capture — au démarrage, douce et brève (1 écran, 5 décisions courtes)
> 📸 PHOTO / 🎬 VIDÉO ouvre d'abord une **mini-capture d'intention** (skippable, mais proposée) :
```
🧭 Ton intention (30 s) — tu pourras tout changer après
┌──────────────────────────────────────────┐
│ ✍️ Message   : ____________________  ▸     │
│ 😊 Émotion   : [douceur][punch][luxe][fun]▸│
│ 👤 Personnage: 🎯 Imany ▾                   │
│ 👥 Public    : ____________________  ▸     │
│ 📍 Objectif  : [TikTok ·9:16· 23s] ▸       │
├──────────────────────────────────────────┤
│ ✅ Définir l'intention   ⏭ Plus tard       │
└──────────────────────────────────────────┘
```
*Pilier servi : ① Intention.* « Plus tard » est permis (confiance/contrôle) mais l'outil rappellera
gentiment que la boussole est vide.

### 1.3 Présence permanente — ligne 0 du bandeau, sur CHAQUE écran projet
> Le bandeau d'état actuel (3 lignes) gagne une **ligne 0** au-dessus du nom :
```
🧭 « réveille-toi puissante » · 😊 douceur · 👥 femmes 25-40 · 📍 TikTok·9:16·23s   ✎
📁 Projet · 10 juin 15h52 · ⏳ en cours
🎯 Imany🔒 · 👗 Robe rouge · 🌆 Studio · ✍️ P1
⚙️ 2img·23s·9:16 · ◫ 1 var · 📦 1 liv
```
Tap sur la ligne 🧭 (ou ✎) = éditer l'intention. *Courte, toujours là, modifiable.* *Pilier ①.*

---

## 2. PILIER 2 — COHÉRENCE (rendre la dérive lisible, sans décider) → *à construire (mécanisme)*

**Besoin** : l'outil **ne juge pas le goût**. Il pose en permanence la question centrale et, si quelque
chose dérive, il **localise la pièce** et **laisse choisir**.

### 2.1 La question centrale, récurrente et non culpabilisante
Un point d'accès permanent (bandeau + 📊 Projet + à chaque grande validation) :
> `🧭 Sert l'intention ?` → ouvre la **Lecture de cohérence**.

### 2.2 Lecture de cohérence — les 10 pièces face à l'intention
```
🧭 Est-ce que ça sert encore : « réveille-toi puissante » ?

Pièce         état        signal (le POURQUOI du doute)
✍️ Message     ✓ aligné    —
🖼 Image       ✓ aligné    —
👗 Look        ⚠ à vérifier  changé après l'intention (était « tailleur »)
🌆 Décor       ✓ aligné    —
🎙 Voix        — non défini —
📝 Script      ⚠ à vérifier  ton « fun » vs émotion visée « douceur »
🎬 Montage     ✓ aligné    —
🥁 Rythme      ✓ aligné    —
🏷 Légende     ⚠ vide       objectif = publier, légende absente
📤 Publication ✓ TikTok 9:16 —

→ par pièce :  [👁 Voir]   [🛠 Ajuster]   [✓ C'est voulu]
```
- L'outil **signale** (heuristiques **explicables**, jamais un score de goût) : durée > format,
  zone modifiée après l'intention, émotion du script ≠ émotion visée, légende vide alors qu'objectif =
  publier, personnage ≠ référence verrouillée…
- Chaque signal est **accompagné de son pourquoi** (1 ligne).
- **Décision = Etoile.** `✓ C'est voulu` **assume** la pièce (marque « écart assumé », trace dans la
  mémoire) — l'outil **n'y revient plus** sans raison. **Aucune correction automatique. Aucun blocage.**

*Piliers servis : ② Cohérence (cœur), ③ Mémoire (l'écart assumé est tracé), ⑥ Contrôle (laisse choisir).*

---

## 3. PILIER 3 — MÉMOIRE (le POURQUOI, relisible des mois après) → *partiel → à compléter*

**Besoin** : conserver **intention + variantes testées + choix faits AVEC leur raison + version retenue**.

**Aujourd'hui** : `versions[]` (snapshots) et `historique_versions[]` (journal d'actions) existent, mais
ils enregistrent le **QUOI**, pas le **POURQUOI**. Il manque la **raison** attachée aux décisions.

### 3.1 La décision tracée = action + raison (à ajouter)
À chaque choix structurant (garder une image, retenir une variante, assumer un écart, publier) :
```
🗂 Journal des décisions
10 juin 15:58 — Variante B retenue comme média actif
               « plus douce que A, colle à l'émotion visée »   ✎
10 juin 16:04 — Look changé (tailleur → robe rouge)
               « le tailleur faisait trop corporate »          ✎
10 juin 16:10 — Écart script assumé (ton fun)
               « clin d'œil voulu, public le connaît »         ✎
```
Raison **courte, optionnelle mais proposée** (jamais bloquante = confiance). Relisible tel quel des mois
après.

### 3.2 « Pourquoi cette version ? » sur la version retenue
Chaque version validée porte une **note de retenue** (`raison_retenue`) : *pourquoi celle-ci et pas une
autre*. Visible dans l'historique des versions.

*Piliers servis : ③ Mémoire (cœur), ② Cohérence (les écarts assumés sont mémorisés).*

---

## 4. PILIER 4 — CAPITALISATION (promouvoir/réutiliser des briques) → *partiel → à étendre*

**Besoin** : transformer un acquis en **brique réutilisable** : look, décor, **preset**, **style
sous-titres**, **enchaînement** (séquence de montage).

**Aujourd'hui** : presets (réglages image) + enregistrement de zones en bibliothèque existent. Manque :
le **style sous-titres** comme brique nommée, et **l'enchaînement/montage** comme brique réutilisable,
avec **provenance** (« vient du projet X »).

### 4.1 « Promouvoir en brique » — geste uniforme
Depuis n'importe quel composant abouti :
```
⭐ Promouvoir cette brique
[👗 Look] [🌆 Décor] [🎨 Preset image] [💬 Style sous-titres] [🎬 Enchaînement]
→ nom : ____   · visible ensuite dans STUDIO, réutilisable dans tout projet
```
- Réutilisation = **copie explicite dans le projet** (jamais d'héritage silencieux — respecte
  l'étanchéité E124 et la confiance).
- Chaque brique garde sa **provenance** (mémoire).

*Piliers servis : ④ Capitalisation (cœur), ③ Mémoire (provenance), ⑤ Confiance (copie explicite).*

---

## 5. PILIER 5 — CONFIANCE (prévisibilité par contrat) → *en place → à durcir*

**Besoin** : **contrat** tenu — effet explicite **avant** l'action ; valider = exactement l'annoncé ;
le verrou tient ; la reprise restaure l'état **exact** ; **rien en silence**.

**Aujourd'hui** : panneau de coût avant dépense, vue d'impact (garder/MAJ/régénérer), verrous de zones,
reprise après restart — tout cela existe et est prouvé. **À durcir** : l'**annonce d'effet avant
chaque action conséquente** n'est pas encore systématique.

### 5.1 Le contrat d'action (à généraliser)
Tout bouton qui **modifie** ou **dépense** annonce d'abord, en une ligne, **ce qui va se passer** :
```
🔁 Régénérer l'image
   → remplace l'image actuelle · conserve look+décor verrouillés · ~0 € (test)
   [✅ Faire exactement ça]   [✖️ Annuler]
```
Règle : **ce qui est annoncé = ce qui se produit**, ni plus ni moins. Le verrou affiché **tient**
toujours. Reprise = état **exact** (déjà garanti par le manifest source de vérité).

*Piliers servis : ⑤ Confiance (cœur), ② Cohérence (ce que touche/préserve l'action est explicite).*

---

## 6. PILIER 6 — CONTRÔLE (tout réversible jusqu'à publier) → *partiel → à compléter*

**Besoin** : revenir · **comparer** · restaurer · **réactiver une variante écartée** ·
**garder / mettre à jour / régénérer AU CHOIX** (jamais auto). **Publier = seul acte irréversible.**

**Aujourd'hui** : retour partout, versions restaurables, vue d'impact (garder/MAJ/régénérer),
variantes conservées. **Manque** : **comparer** deux variantes côte à côte, et **réactiver** une image
**rejetée/écartée** (le rejet n'est pas une corbeille définitive).

### 6.1 Comparer (à ajouter)
```
⚖️ Comparer   A ◀ ▶ B
[A] média actif     [B] variante #2
👁 voir A · 👁 voir B · ★ retenir A · ★ retenir B · ◫ garder les deux
```
### 6.2 Réactiver une variante écartée (à ajouter)
La pièce « rejeté » devient **réactivable** : `↩️ Réactiver` la repasse en variante/candidate (rien
n'est détruit avant publication).

### 6.3 Garder / Mettre à jour / Régénérer — au choix, jamais auto (en place)
La vue d'impact existante est l'incarnation exacte du pilier : aucune étape aval n'est effacée en silence.

### 6.4 Publier = la seule porte sans retour
```
📤 Publier — action DÉFINITIVE
   après publication, cette version est figée (l'historique la conserve)
   [✅ Publier]   [⬅ pas encore]
```
*Piliers servis : ⑥ Contrôle (cœur), ⑤ Confiance (publier est clairement marqué irréversible).*

---

## 7. LIRE LE PROJET D'UN COUP D'ŒIL — l'écran 📊 Projet refondu

Le 📊 actuel montre zones/objets. Refondu par les piliers, il devient **la carte du projet** :
```
📊 « réveille-toi puissante »                        🧭 Sert l'intention ? ⚠ 3 signaux
─────────────────────────────────────────────
🧭 INTENTION   message · 😊 douceur · 👥 25-40 · 📍 TikTok 9:16 23s          ✎
🧱 COMPOSANTS  🎯 Imany🔒 · 👗 Robe · 🌆 Studio · ✍️ P1 · ⚙️ 2img 23s
◫ VARIANTES   3 testées  ·  ⚖️ Comparer
🗂 DÉCISIONS   « variante B retenue : plus douce »  (+4)
📦 LIVRABLES   1 prêt  ·  🕘 versions : 2
📌 ÉTAT        ⏳ en cours  →  prochaine étape : script
─────────────────────────────────────────────
[🧭 Intention] [🧱 Composants] [◫ Variantes] [🗂 Décisions] [📦 Livrables] [📤 Publier]
```
On y voit, en un écran : **l'intention, l'état, les composants, les variantes, les livrables, et la
question centrale** avec le nombre de signaux. *Tous les piliers convergent ici.*

---

## 8. MATRICE DE JUSTIFICATION — chaque élément → le(s) pilier(s) qu'il sert

> Légende : ① Intention ② Cohérence ③ Mémoire ④ Capitalisation ⑤ Confiance ⑥ Contrôle.
> Verdict : **RESTE** (justifié) · **COUPÉ/À REQUALIFIER** (non/mal justifié) · **MANQUE** (pilier non servi).

### 8.1 Ce qui existe dans /v4 (audit)
| Élément /v4 actuel | Pilier(s) | Verdict |
|---|---|---|
| Bandeau d'état projet | ② ⑤ | **RESTE** (gagne la ligne 🧭 — ①) |
| Écran 📊 Projet | ② ③ ⑥ | **RESTE** (refondu §7) |
| Zones réf/look/décor/prompt + verrou | ② ⑤ | **RESTE** |
| Historique de zone + restaurer | ③ ⑥ | **RESTE** |
| Écran candidat (3 états) | ⑥ | **RESTE** |
| Variantes (conserver) | ⑥ ③ | **RESTE** (gagne ⚖️ comparer + ↩️ réactiver — ⑥) |
| Livrables + dossier livrable autonome | — vers ⑤/④ | **RESTE** (sert la destination = ①/⑥) |
| Versions (snapshot/restore) | ③ ⑥ | **RESTE** (gagne « raison retenue » — ③) |
| Préréglages (presets) | ④ | **RESTE** (étendu : style sous-titres, enchaînement) |
| Gate QC avant dépense | ⑤ ② | **RESTE** |
| Panneau coût avant génération | ⑤ ① | **RESTE** (l'objectif/destination = ①) |
| Vue d'impact garder/MAJ/régénérer | ⑥ ⑤ | **RESTE** |
| Récents/Historique (vues, source unique) | ③ ⑥ | **RESTE** |
| Planche contact | ⑥ | **RESTE** |
| Édition image (sliders FX) | ② ⑥ | **RESTE — À SURVEILLER** : risque « réglage de goût » ; à cadrer comme *ajuster pour servir l'intention*, sinon dérive vers le tripotage |
| Publier (statut) | ⑥ | **RESTE** (marqué seul irréversible §6.4) |
| Aide ❓ | ⑤ | **RESTE** |

→ **Constat d'audit** : le cockpit-v4 a été construit lean (E105 : une fonction = une place), donc
**peu de choses sont à COUPER**. Le seul point « à requalifier » est l'édition image (cadrer son sens).
Le vrai problème n'est **pas** le superflu — c'est le **manque**.

### 8.2 Ce qui MANQUE (un pilier non servi)
| Manque | Pilier non servi | Gravité |
|---|---|---|
| **Objet INTENTION + capture + ligne permanente** | ① (entier) | 🔴 **FONDATION** |
| **Mécanisme cohérence/dérive** (question + 10 pièces + localisation) | ② (mécanisme) | 🔴 critique |
| **Raison attachée aux décisions** + « pourquoi cette version » | ③ | 🟠 élevé |
| **Comparer variantes** + **réactiver une variante écartée** | ⑥ | 🟠 élevé |
| **Brique « style sous-titres » / « enchaînement »** + provenance | ④ | 🟡 moyen |
| **Annonce d'effet systématique avant action** (contrat) | ⑤ | 🟡 moyen |

---

## 9. MAPPING MOTEUR — déjà supporté vs à construire

| Capacité | Moteur actuel | À construire |
|---|---|---|
| Dossier projet = source de vérité | ✅ `project_store` | — |
| Réf/look/décor/prompt + verrous + historique | ✅ `zones` | — |
| Variantes / candidates / rejetées | ✅ | **réactivation** depuis rejeté ; **comparaison** |
| Livrables + dossier livrable autonome | ✅ E125 | lier à la **destination** (objectif intention) |
| Versions snapshot/restore | ✅ Q4 | champ **`raison_retenue`** |
| Journal d'actions | ✅ `historique_versions` | champ **`raison`** par décision (le POURQUOI) |
| Coûts / QC / étanchéité | ✅ | — |
| **INTENTION (objet 1er niveau)** | ❌ **absent** | **`manifest.intention` + capture + rendu permanent** |
| **Évaluateur de cohérence/dérive** | ❌ absent | module **lecture seule**, heuristiques explicables, **non décisionnel** |
| **Briques capitalisées** (style sous-titres, enchaînement) | ◑ presets/zones | extension + **provenance** |
| **Contrat d'action** (effet avant action) | ◑ partiel | généralisation à tout bouton conséquent |

---

## 10. DÉCISIONS DE PREMIER NIVEAU PRISES (E120/E126) — sans escalade

- **V6** — Intention = **objet de 1er niveau** dans le manifest (pas un simple champ de prompt).
- **V7** — Présence permanente = **ligne 🧭 en tête du bandeau**, tappable pour éditer.
- **V8** — Capture au démarrage **proposée mais skippable** (« Plus tard ») — confiance/contrôle.
- **V9** — La cohérence est **un signal explicable, jamais un score de goût** ; `✓ C'est voulu` assume
  et tracé ; **aucune correction/blocage auto**.
- **V10** — Les 10 pièces surveillées = **message · image · look · décor · voix · script · montage ·
  rythme · légende · publication** (exactement la liste d'Etoile).
- **V11** — La **raison** d'une décision est **courte et optionnelle** (proposée, jamais bloquante).
- **V12** — Réutiliser une brique = **copie explicite dans le projet** (jamais d'héritage silencieux).
- **V13** — **Publier** = seul écran à confirmation « action définitive » ; tout le reste est réversible.

**Aucun conflit E120 détecté** avec les exigences existantes : l'intention **renforce** E1/E104/E105
(elle donne la raison d'être du cockpit), E116/E117 (cohérence de parcours), E124 (étanchéité : briques
copiées, pas héritées). Le mécanisme de cohérence **n'enfreint pas** « l'outil ne juge pas » — il
**signale et laisse choisir** (E127).

---

## 11. CE QUI NE CHANGE PAS (garanties)

- **Live `/v4` intact** : ce document est de la **conception** ; aucune implémentation tant qu'Etoile n'a
  pas validé la forme.
- **Fichiers verrouillés intacts** · **aucune dépense** · **modèle A** (un projet, image+vidéo = livrables).
- L'existant justifié (§8.1 RESTE) est **conservé** ; on **ajoute la fondation manquante**, on ne
  reconstruit pas ce qui sert déjà un pilier.

---

## 12. PROCHAINE PORTE (à ta main, Etoile)

Si tu **valides cette forme**, l'ordre d'implémentation dérivé des piliers serait :
1. **Fondation ① Intention** (objet + capture + ligne permanente) — sans elle, rien ne tient.
2. **② Cohérence/dérive** (lecture des 10 pièces, signal explicable, non décisionnel).
3. **③ Mémoire du pourquoi** (raison par décision + raison de la version retenue).
4. **⑥ Contrôle+** (comparer / réactiver) puis **④ briques** et **⑤ contrat d'action**.

Chaque lot livré sous le protocole E118/E119, auto-testé, zéro dépense, derrière `/v4`.

_Document de conception — dérivé de E127 (6 piliers). Réf. : `docs/EXIGENCES.md` (E127), `docs/VISION_COCKPIT_FINAL.md`, `docs/RAPPORT_COCKPIT_V41.md`. Lecture seule._

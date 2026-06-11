# ARCHITECTURE PRODUIT — RÉFÉRENCE UNIQUE (navigation écran par écran)

> **EN-TÊTE DE GOUVERNANCE (E131)**
> - **Statut** : **B — Formalisation** pour l'acte de ce document (il **restitue fidèlement** une architecture
>   fournie par Etoile et la fige comme **référence unique** ; il **n'écrit AUCUN code**).
> - **MAIS** : le **contenu** décrit introduit des points de catégorie **C (évolution d'une UX non verrouillée)**
>   et **D (touche un élément verrouillé)**. Ces points sont **listés en §3** et **NE sont PAS intégrés** tant
>   qu'Etoile ne les a pas tranchés. Rien n'est intégré « en douce ».
> - **Acquis-source(s)** : fondation close (5 espaces · Conscience · Lois I/II · INV-1→15 · E128–E131) +
>   modèle 6 piliers (E127) + **Option A déjà tranchée** (projet = dossier vivant ; cap = ancrage compact ;
>   média = manifestation visible) + modules réalisation existants `ui/socle.js`, `ui/conscience.js`.
> - **Modifie un élément déjà verrouillé** : **OUI, potentiellement** — voir §2(b) et §3. À **valider avant tout code**.
>
> **Objet** : fixer **LA référence de navigation produit** (écrans, sous-sections, boutons exacts, comportement
> de chaque bouton), puis lister **écarts** et **décisions**. **Aucune intégration avant validation d'Etoile.**
> **Live intact · /v4 intact · zéro dépense · génération réelle et publication GATÉES.**

---

## ⚠️ CE QUE CE DOCUMENT SUPERSÈDE ET CE QU'IL CONSERVE

**SUPERSÈDE** (remplace, dès validation) :
- L'UX **« repos + conscience + prochain geste unique »** construite dans `/v4r` (bloc repos mené par un
  geste proposé). → Remplacée par une **navigation par ÉCRANS** : `ACCUEIL → PHOTO / VIDÉO / STUDIO / RÉCENTS`.
- Le **bloc unique vivant unique-pour-tout** comme seul paradigme d'affichage. → Conservé comme **technique
  d'affichage par écran** (un message-bloc édité en place **par écran actif**), mais la **structure mentale**
  devient « écrans », plus « repos↔travail ».
- La **focalisation/prochain-geste** comme moteur de l'expérience (la Conscience **proposait** le geste
  suivant). → La **navigation explicite** devient le moteur. *(La Conscience reste utilisable en lecture
  dérivée — situation/titre/mémoire — mais ne pilote plus l'entrée.)* **C'est un point C/D — voir §3.**

**CONSERVE** (Option A déjà tranchée + fondation) :
- **Projet = dossier vivant unique** contenant TOUT : photos, vidéos, prompts, scripts, légendes, looks,
  décors, avatars, références, **historique**, **versions**, **éléments validés**. Un seul projet du début à la fin.
- **Cap = ancrage compact** (identité/intention), affiché en légende, **jamais un passage obligé**.
- **Mémoire / continuité** : décisions + raisons + tout l'historique, **rien ne se perd**.
- **Média = manifestation visible** du projet (esprit Option A : « je vois ce que je crée »).
- **Socle = source unique de vérité** ; **Conscience = dérivations recalculables, non stockées** ;
  **Univers = capital amorcé par copie** ; **pas de placeholder** ; **publier = seul irréversible, confirmé**.

---

# SECTION 1 — SCHÉMA FINAL ÉCRAN PAR ÉCRAN

> Restitution **fidèle, à la lettre**, de l'architecture fournie. Les libellés de boutons sont **exacts**.
> Chaque écran : **contenu affiché** · **boutons** · **comportement de chaque bouton**.

## ÉCRAN 1 — 🏠 ACCUEIL

**Contenu affiché**
- Point d'entrée global. Présente les 4 grandes portes du produit + accès rapide à ce qui est en cours.

**Boutons**
- `📸 PHOTO` · `🎬 VIDÉO` · `🏛 STUDIO` · `🕘 RÉCENTS / ARCHIVES`

**Comportement**
- `📸 PHOTO` → ouvre **Écran 2 PHOTO** (sur le projet courant, ou crée/ouvre un dossier projet).
- `🎬 VIDÉO` → ouvre **Écran 3 VIDÉO** (même projet courant).
- `🏛 STUDIO` → ouvre **Écran 5 STUDIO** (bibliothèques de l'Univers : avatars, looks, décors, voix, prompts, templates, références, paramètres).
- `🕘 RÉCENTS / ARCHIVES` → ouvre **Écran 6 RÉCENTS** (projets récents, brouillons, archivés, générations en cours/terminées).

---

## ÉCRAN 2 — 📸 PHOTO

**Contenu affiché**
- **Aperçu photo en haut** si une photo existe dans le projet ; sinon **état sobre** (« aucune photo — à créer », **sans cadre média vide / sans placeholder**).
- **Nom du projet** (lisible).
- **Cap compact** (intention/identité en une ligne ou deux).
- Zone d'actions.

**Boutons**
- `✨ Générer` · `📥 Importer` · `🖼 Galerie` · `🕘 Historique` · `🏠 Accueil`

**Comportement**
- `✨ Générer` → ouvre **Écran 2.1 PHOTO/PROMPT** (préparation des paramètres avant génération).
- `📥 Importer` → importe une photo (depuis l'appareil/Telegram) **dans le dossier projet** comme matière photo. *(Voir §3 : import arbitraire vs persona.)*
- `🖼 Galerie` → affiche les **photos existantes du projet** (matière déjà produite/importée), sélection possible.
- `🕘 Historique` → affiche l'**historique des photos** du projet (versions, validées, supprimées-soft).
- `🏠 Accueil` → retour **Écran 1 ACCUEIL** (le dossier projet reste intact).

---

## ÉCRAN 2.1 — 📸 PHOTO / PROMPT (préparation)

**Contenu affiché**
- **Aperçu en haut** (dernière photo du projet si elle existe, sinon état sobre).
- **Blocs de paramètres éditables** :
  - **Prompt** (texte d'instruction image)
  - **Avatar** (personnage)
  - **Look** (tenue/style)
  - **Décor** (environnement)
  - **Références** (images de référence)
  - **Paramètres image** (format, qualité, options avancées)

**Boutons**
- `◀ Retour` · `❌ Annuler` · `👁 Aperçu` · `✅ Valider` · `✨ Générer` · `🏠 Accueil`

**Comportement**
- `◀ Retour` → revient à **Écran 2 PHOTO** (paramètres conservés en brouillon dans le dossier).
- `❌ Annuler` → abandonne la préparation en cours (revient à Écran 2 PHOTO ; aucun fait écrit hors brouillon).
- `👁 Aperçu` → montre un **aperçu** de ce qui serait produit/du rendu des paramètres (sans dépense réelle).
- `✅ Valider` → fige les paramètres (prompt/avatar/look/décor/références/params) **dans le dossier projet** (mémoire), sans générer.
- `✨ Générer` → **lance la génération réelle** → **GATE COÛT/CONFIRMATION obligatoire** (jamais auto) → produit la photo → **Écran 2.2 PHOTO/RÉSULTAT**.
- `🏠 Accueil` → retour Écran 1 (brouillon conservé).

---

## ÉCRAN 2.2 — 📸 PHOTO / RÉSULTAT

**Contenu affiché**
- **Photo en grand**.
- **Nom** du projet.
- **Prompt** ayant produit la photo.
- **Statut** (candidate / validée / etc.).

**Boutons**
- `✅ Garder` · `🗑 Supprimer` · `✏️ Modifier` · `🔁 Régénérer` · `🎬 Faire une vidéo avec cette photo` · `🏠 Accueil`

**Comportement**
- `✅ Garder` → marque la photo **validée/gardée** dans le dossier (devient matière retenue + entre en historique/versions).
- `🗑 Supprimer` → retire la photo. *(Voir §3 : soft = versions/historique conservés, ou hard.)*
- `✏️ Modifier` → revient à **Écran 2.1 PHOTO/PROMPT** avec les paramètres de cette photo préremplis.
- `🔁 Régénérer` → relance une génération **avec les mêmes paramètres** → **GATE COÛT** → nouvelle photo (nouvelle version, l'ancienne reste en historique).
- `🎬 Faire une vidéo avec cette photo` → ouvre **Écran 3.1 VIDÉO/PARAMÈTRES** avec **cette photo comme image source**.
- `🏠 Accueil` → retour Écran 1.

---

## ÉCRAN 3 — 🎬 VIDÉO

**Contenu affiché**
- **Aperçu vidéo** si une vidéo existe dans le projet ; **sinon l'image source** (photo retenue) ; sinon état sobre (pas de placeholder).
- Nom du projet · cap compact.

**Boutons**
- `📥 Importer source` · `🖼 Choisir photo existante` · `✨ Générer photo source` · `🎬 Créer une vidéo` · `🕘 Historique vidéo` · `🏠 Accueil`

**Comportement**
- `📥 Importer source` → importe une image **dans le dossier** comme **source vidéo**.
- `🖼 Choisir photo existante` → sélectionne une **photo déjà dans le projet** comme **source vidéo**.
- `✨ Générer photo source` → **RÈGLE DE NAVIGATION (à la lettre)** : renvoie vers **Écran 2.1 PHOTO/PROMPT**, et **APRÈS validation de la photo, REVIENT AUTOMATIQUEMENT à l'Écran 3 VIDÉO** avec **la photo validée posée comme source**. *(Boucle aller-retour automatique, sans perdre le contexte vidéo.)*
- `🎬 Créer une vidéo` → ouvre **Écran 3.1 VIDÉO/PARAMÈTRES** (nécessite une image source ; si aucune, propose d'abord d'en poser une via les boutons ci-dessus).
- `🕘 Historique vidéo` → historique des vidéos du projet (versions, validées, supprimées-soft).
- `🏠 Accueil` → retour Écran 1.

---

## ÉCRAN 3.1 — 🎬 VIDÉO / PARAMÈTRES

**Contenu affiché**
- **Image source en haut** (ou la **vidéo** si une vidéo existe déjà).
- **Blocs de paramètres éditables** :
  - **Image source**
  - **Mouvement** (type d'animation/caméra)
  - **Script** (texte parlé / déroulé)
  - **Voix** (synthèse/choix de voix)
  - **Musique**
  - **Légendes** (sous-titres)
  - **Paramètres vidéo** (format, durée, options)

**Boutons**
- `◀ Retour` · `❌ Annuler` · `👁 Aperçu` · `✅ Valider` · `🎬 Générer vidéo` · `🏠 Accueil`

**Comportement**
- `◀ Retour` → revient à **Écran 3 VIDÉO** (paramètres conservés en brouillon).
- `❌ Annuler` → abandonne la préparation vidéo (revient Écran 3 ; aucun fait écrit hors brouillon).
- `👁 Aperçu` → aperçu du rendu des paramètres (sans dépense réelle).
- `✅ Valider` → fige les paramètres vidéo **dans le dossier projet** (mémoire), sans générer.
- `🎬 Générer vidéo` → **génération réelle** → **GATE COÛT/CONFIRMATION** → produit la vidéo → **Écran 3.2 VIDÉO/RÉSULTAT**.
- `🏠 Accueil` → retour Écran 1 (brouillon conservé).

---

## ÉCRAN 3.2 — 🎬 VIDÉO / RÉSULTAT

**Contenu affiché**
- **Vidéo en grand**.
- **Image source** · **Script** · **Légendes** · **Paramètres**.

**Boutons**
- `✅ Garder` · `🗑 Supprimer` · `✏️ Modifier` · `🔁 Régénérer` · `📤 Exporter / Publier` · `🏠 Accueil`

**Comportement**
- `✅ Garder` → marque la vidéo **validée/gardée** (matière retenue + historique/versions).
- `🗑 Supprimer` → retire la vidéo. *(Voir §3 : soft/hard.)*
- `✏️ Modifier` → revient à **Écran 3.1 VIDÉO/PARAMÈTRES** avec les paramètres préremplis.
- `🔁 Régénérer` → relance la génération vidéo (mêmes paramètres) → **GATE COÛT** → nouvelle version (ancienne conservée).
- `📤 Exporter / Publier` → ouvre **Écran 4 PUBLICATION**.
- `🏠 Accueil` → retour Écran 1.

---

## ÉCRAN 4 — 📤 PUBLICATION

**Contenu affiché**
- **Vidéo finale**.
- **Légende courte** · **Légende longue** · **Hashtags** · **Script** · **Plateforme** (cible).
- *Note : les légendes **arrivent en fin de parcours** mais sont **enregistrées dans le dossier projet** dès leur saisie.*

**Boutons**
- `◀ Retour` · `✏️ Modifier légende` · `💾 Sauvegarder brouillon` · `📤 Publier` · `🏠 Accueil`

**Comportement**
- `◀ Retour` → revient à **Écran 3.2 VIDÉO/RÉSULTAT**.
- `✏️ Modifier légende` → édite légende courte/longue/hashtags (enregistré au dossier).
- `💾 Sauvegarder brouillon` → enregistre l'ensemble (vidéo + légendes + plateforme) comme **brouillon** dans le dossier (apparaît dans RÉCENTS).
- `📤 Publier` → **ACTION RÉELLE IRRÉVERSIBLE** → **CONFIRMATION explicite obligatoire** + **connecteur plateforme** → publie. *(Seul acte irréversible du système ; jamais automatique.)*
- `🏠 Accueil` → retour Écran 1.

---

## ÉCRAN 5 — 🏛 STUDIO (bibliothèques de l'Univers)

**Sections**
- `👤 Avatars` · `👗 Looks` · `🏛 Décors` · `🎤 Voix` · `📝 Prompts` · `🎞 Templates` · `📎 Références` · `⚙️ Paramètres`

**Boutons par section**
- `➕ Ajouter` · `✏️ Modifier` · `📋 Dupliquer` · `🗑 Supprimer` · `✅ Valider/Sélectionner` · `◀ Retour` · `🏠 Accueil`

**Comportement (générique à chaque section)**
- `➕ Ajouter` → crée une nouvelle brique-modèle dans la bibliothèque de l'Univers (avatar/look/décor/voix/prompt/template/référence/paramètre).
- `✏️ Modifier` → édite une brique existante.
- `📋 Dupliquer` → copie une brique (capital réutilisable).
- `🗑 Supprimer` → retire une brique. *(Voir §3 : soft/hard ; impact sur projets qui l'ont copiée = aucun, car amorçage **par copie** — INV-12/M12.)*
- `✅ Valider/Sélectionner` → marque/sélectionne la brique (pour usage ou comme défaut).
- `◀ Retour` → section précédente / liste des sections.
- `🏠 Accueil` → retour Écran 1.
- **Principe d'étanchéité** : le Studio édite le **capital Univers** ; un projet n'en reçoit que des **copies** (jamais de lien vivant). *(Voir §3 : Prompts/Templates comme objets de bibliothèque — mapping vs nouveau.)*

---

## ÉCRAN 6 — 🕘 RÉCENTS / ARCHIVES

**Contenu affiché**
- **Projets récents** · **Brouillons** · **Archivés** · **Générations en cours** · **Générations terminées**.

**Boutons**
- `▶ Ouvrir` · `📋 Dupliquer` · `📦 Archiver` · `🗑 Supprimer` · `🏠 Accueil`

**Comportement**
- `▶ Ouvrir` → ouvre le dossier projet sélectionné (reprend exactement où il en était).
- `📋 Dupliquer` → crée un nouveau projet à partir d'un existant (copie d'amorce).
- `📦 Archiver` → déplace le projet en archivé (conservé, sorti de la liste active).
- `🗑 Supprimer` → retire le projet. *(Voir §3 : soft/hard ; règle « rien ne se perd ».)*
- `🏠 Accueil` → retour Écran 1.

---

## COMMANDES GLOBALES (comportement CONSTANT partout)

| Commande | Comportement constant |
|---|---|
| `🏠 Accueil` | Retour Écran 1, sans rien perdre (dossier projet intact). |
| `◀ Retour` | Remonte d'un niveau dans l'écran courant ; brouillon conservé. |
| `❌ Annuler` | Abandonne l'action/préparation en cours ; aucun fait écrit hors brouillon. |
| `✅ Valider` | Fige l'état courant dans le dossier projet (mémoire), sans générer ni publier. |
| `👁 Aperçu` | Montre un aperçu/rendu **sans dépense réelle**. |
| `✨` (photo) | Génère une **photo** → **GATE COÛT/CONFIRMATION**. |
| `🎬` (vidéo) | Génère une **vidéo** → **GATE COÛT/CONFIRMATION**. |
| `🛑 Stop` | Interrompt une génération en cours. |
| `💾` | Sauvegarde un brouillon dans le dossier. |
| `📤` | Exporter/Publier → **CONFIRMATION explicite** (Publier = irréversible). |

---

## LES 3 PARCOURS TYPE

**Parcours A — Photo seule**
`ACCUEIL → 📸 PHOTO → ✨ Générer → 2.1 PROMPT (paramètres) → ✨ Générer [GATE] → 2.2 RÉSULTAT → ✅ Garder`
→ photo gardée dans le dossier (fin, ou continuer).

**Parcours B — Vidéo avec photo existante**
`ACCUEIL → 🎬 VIDÉO → 🖼 Choisir photo existante → 🎬 Créer une vidéo → 3.1 PARAMÈTRES → 🎬 Générer vidéo [GATE] → 3.2 RÉSULTAT → ✅ Garder → 📤 Exporter/Publier → 4 PUBLICATION → 📤 Publier [CONFIRMATION]`

**Parcours C — Vidéo sans photo existante**
`ACCUEIL → 🎬 VIDÉO → ✨ Générer photo source → 2.1 PROMPT → ✨ Générer [GATE] → (photo validée) → RETOUR AUTOMATIQUE à 🎬 VIDÉO (photo posée comme source) → 🎬 Créer une vidéo → 3.1 PARAMÈTRES → 🎬 Générer vidéo [GATE] → 3.2 RÉSULTAT → 📤 Publier`

---

## MAPPING — chaque écran/élément → fait Socle ou référence Univers

> Le **dossier vivant** (Socle, `projects_r/<persona>/<id>/facts.json` aujourd'hui) contient : photos, vidéos,
> prompts, scripts, légendes, looks, décors, avatars, références, historique, versions, éléments validés.

| Écran / élément | Mappe sur (Socle = fait durable · Univers = capital copié · Conscience = dérivé) |
|---|---|
| Nom du projet | **Conscience** (dérivé du cap/message ou `friendlyName`) — *non stocké* |
| Cap compact | **Socle** : `intention` (message/émotion/public/objectif/déclencheur) |
| Photo (aperçu/résultat) | **Socle** : `medias[]` `type:image` (état candidate/gardée, versions) |
| Vidéo (aperçu/résultat) | **Socle** : `medias[]` `type:video` (état, versions, image source liée) |
| Prompt (image) | **Socle** : paramètre de la matière (prompt) — *aujourd'hui à AJOUTER au fait, voir §3* |
| Avatar / Look / Décor | **Univers** (brique-modèle) **copiée** dans le dossier au moment de l'usage |
| Références | **Socle** (copies des images de référence) ou **Univers** (bibliothèque) |
| Paramètres image/vidéo | **Socle** : paramètres de la matière — *à AJOUTER au fait, voir §3* |
| Script / Voix / Musique / Légendes | **Socle** : champs du dossier — *à AJOUTER au fait, voir §3* |
| Plateforme / hashtags | **Socle** : champs publication du dossier |
| Statut (candidate/validée) | **Socle** : `medias[].etat` (déjà présent) |
| Historique / versions | **Socle** : `decisions[]` + historisation des `medias[]` |
| Validés (gardés) | **Socle** : marqueur d'état sur la matière |
| Générations en cours/terminées | **Conscience/Pilotage** (état transitoire) — *non critique, recalculable* |
| STUDIO (Avatars/Looks/Décors/Voix/Prompts/Templates/Références/Paramètres) | **Univers** : bibliothèques de briques-modèles |
| RÉCENTS / brouillons / archivés | **Socle** : `listProjects` + marqueurs brouillon/archivé |

> **Constat de mapping** : la **navigation** se pose sans casser le Socle ; en revanche **plusieurs champs
> de matière** (prompt, script, voix, musique, légendes, paramètres, image-source liée) **n'existent pas
> encore** comme attributs du fait-média/du dossier. Les **ajouter** = attributs sur objets **existants**
> (média = manifestation ; dossier = Socle), conformes au modèle (`MODELE_METIER` prévoit Prompt/Script/
> Légende/RAW). **À confirmer en §3** pour éviter toute introduction silencieuse.

---

# SECTION 2 — ÉCARTS IDENTIFIÉS

## 2(a) — ÉCARTS TECHNIQUES TELEGRAM

**Le nœud** : l'architecture demande, simultanément :
1. **aperçu média visible en haut tout au long**,
2. **aucun empilement de cartes** (un seul bloc vivant),
3. des **écrans riches multi-blocs éditables** :
   - PHOTO/PROMPT : Prompt + Avatar + Look + Décor + Références + Paramètres image,
   - VIDÉO/PARAMÈTRES : Image source + Mouvement + Script + Voix + Musique + Légendes + Paramètres vidéo.

**La contrainte dure** : un message Telegram **photo/vidéo** porte une **légende ≤ ~1024 caractères** et
**ne peut pas** contenir un **long formulaire éditable** sous l'image. On ne « tape » pas du texte multi-champs
**dans** une légende ; on n'a que : la **légende** (courte) + un **clavier de boutons** (`inline_keyboard`).
Donc « aperçu TOUJOURS en haut » **et** « édition profonde de 6–7 blocs » **dans le même message** sont en
**tension directe**.

**Options pour tenir « un seul bloc + aperçu en haut + édition des blocs »** (à trancher — §3) :

- **Option T1 — Sous-vues éditées EN PLACE (recommandée).** Le bloc média reste affiché (aperçu en haut) ;
  les blocs (Prompt/Avatar/Look/…) sont des **sous-vues** atteintes par boutons, chacune **éditée en place**
  dans le **même message** (légende = résumé compact du bloc courant + clavier d'options). L'aperçu reste
  visible **sur l'écran média** ; pendant l'édition fine d'un bloc, la légende montre **ce bloc** (l'aperçu
  image peut rester en haut tant qu'on édite via boutons/puces, **pas** quand il faut **saisir du texte libre long**).
  - *Limite assumée* : la **saisie de texte libre long** (prompt détaillé, script) ne peut pas se faire « dans »
    la légende. Deux sous-options :
    - **T1a** : saisie par **court message** de l'utilisateur (il tape, on capte, on réinjecte dans le bloc, on
      réédite la carte en place). C'est le mécanisme déjà utilisé en `/v4r` (`r0Await`).
    - **T1b** : **options prédéfinies** (puces/presets de prompt, scripts gabarits) tant que possible, saisie
      libre réservée aux cas nécessaires.

- **Option T2 — Caption compacte + édition par courts messages.** La carte média garde une **légende compacte**
  (cap + bloc courant) ; toute édition fine passe par de **brefs échanges texte** réinjectés. Aperçu toujours
  en haut. *Coût* : plus de va-et-vient de saisie.

- **Option T3 — Options avancées en sous-bloc séparé temporaire.** Pour les écrans très riches, ouvrir un
  **sous-bloc dédié** (un second message **temporaire**) le temps de l'édition avancée, **refermé** (supprimé)
  au retour → on **retrouve le bloc unique**. *Coût* : viole transitoirement « un seul bloc » (1 bloc d'édition
  éphémère), à assumer ou refuser. **C'est un point D** (touche « aucun empilement »).

**Tension résiduelle à arbitrer** : « **aperçu TOUJOURS en haut** » est tenable pour la **navigation** et
l'**édition par boutons/puces** ; il **ne l'est pas** pendant une **saisie de texte libre long** (le clavier
natif occupe l'écran, et l'aperçu image n'est pas re-affichable au-dessus du champ de saisie). → **À trancher** :
accepte-t-on que, **pendant la frappe d'un texte long**, l'aperçu ne soit pas à l'écran (il revient juste après) ?

**Autres écarts techniques mineurs** :
- **Aperçu vidéo** : Telegram joue une vidéo dans un message ; le **swap photo↔vidéo en place** (même
  `message_id`) est **déjà prouvé** (editMessageMedia). OK.
- **Texte→média** : passer d'un écran **texte** à un écran **média** impose **une** recréation de bloc (nuance
  Telegram déjà connue). Acceptable (1 fois).
- **`👁 Aperçu` sans dépense** : faisable pour un **rendu de paramètres** ou un **échantillon local** ; un
  « aperçu » fidèle d'une génération réelle **sans la lancer** n'existe pas → l'aperçu sera une **maquette/
  résumé**, pas le rendu final. **À clarifier** (§3).

## 2(b) — ÉCARTS FONDATION / E131

**Confirmation : les NON-NÉGOCIABLES tiennent sous cette navigation.**
- **Source unique de vérité** : OUI — tout reste dans le dossier Socle ; la navigation ne stocke rien de critique.
- **Dérivations recalculables non stockées** : OUI — nom/situation/titre restent dérivés (Conscience).
- **Étanchéité par copie (Univers→projet)** : OUI — le Studio édite le capital, le projet reçoit des **copies**.
- **PAS de placeholder** : OUI — états sobres quand aucun média (pas de cadre média vide).
- **Publier = seul irréversible + confirmé** : OUI — `📤 Publier` exige confirmation explicite + connecteur.
- **Génération réelle = coût SOUS confirmation/GO** : OUI — `✨`/`🎬` derrière GATE COÛT ; **zéro dépense** par défaut (simulé) jusqu'au GO d'Etoile.
- **L'UI ne tient aucun état critique** : OUI — l'écran courant/brouillon est reconstructible depuis le Socle.

**Signalements (à trancher — détaillés en §3)** :
1. **La navigation supersède-t-elle l'UX repos/conscience/prochain-geste ?** → OUI selon ce document. C'est un
   changement de **paradigme d'entrée** (de « prochain geste proposé » à « écrans choisis »). La Conscience
   **reste** en lecture (situation/mémoire) mais **ne pilote plus** l'entrée. **= Décision (C/D).**
2. **`🗑 Supprimer` = soft ou hard ?** Le verrou « rien ne se perd / historique conservé » (INV mémoire)
   impose **soft** (la matière sort de la vue active mais **versions/historique restent**). Un hard delete qui
   perd l'historique **violerait** la fondation. **= Décision D** (par défaut : **soft**).
3. **`📤 Publier` réel** = action réelle + **connecteur plateforme** + **confirmation** (jamais auto). Le
   connecteur réel n'existe pas encore → **gaté**, simulé jusqu'au GO. **= Décision** (quand/quelle plateforme).
4. **`Templates` et `Prompts` comme objets de bibliothèque** : le modèle prévoit **Prompt** (objet) et des
   **briques-modèles** ; **Template** n'est **pas** un objet nommé du modèle scellé. → **Prompts = mapping**
   sur l'existant (OK) ; **Templates = potentiellement NOUVEL objet (D)** s'il ne se réduit pas à une
   brique-modèle/gabarit existant. **À trancher.**
5. **Import de photo arbitraire vs persona** : importer une image quelconque comme matière/source peut entrer
   en tension avec la **cohérence persona/identité** (INV cohérence, polarité protégée). **= Décision D**
   (autorisé librement ? cadré au persona ? toléré mais signalé par la Conscience ?).
6. **Champs de matière manquants** (prompt, script, voix, musique, légendes, paramètres, image-source liée,
   plateforme/hashtags) : à **ajouter comme attributs d'objets existants** (média/dossier). Conforme au modèle
   (Prompt/Script/Légende/RAW prévus), **mais** à **valider explicitement** pour ne rien introduire en douce.
   **= Décision** (lot d'attributs, statut C).
7. **Générations « en cours »** (Écran 6) : un **état transitoire** observable ; doit rester **dérivé/non
   critique** (si perdu au redémarrage, reconstructible). **= À confirmer** (pas de nouvel état durable).

---

# SECTION 3 — POINTS QUI NÉCESSITENT UNE DÉCISION D'ETOILE

> Chaque point = une **question nette**. Rien n'est intégré tant qu'Etoile n'a pas répondu.

1. **Supersession du paradigme** — Valides-tu que la **navigation par écrans** (Accueil→Photo/Vidéo/Studio/
   Récents) **remplace** l'UX « repos + conscience + prochain geste » dans `/v4r` ? *(La Conscience reste en
   lecture mémoire/situation, mais ne pilote plus l'entrée.)* **[C/D]**

2. **Suppression (`🗑`)** — Confirmes-tu **soft delete partout** (matière/projet/brique sortent de la vue active
   mais **versions + historique conservés**, rien ne se perd) ? Un **hard delete** est-il interdit (recommandé :
   oui, interdit) ? **[D]**

3. **Templates** — `🎞 Templates` est-il **un gabarit = brique-modèle existante** (mapping, pas de nouvel objet)
   ou un **objet nouveau** à part entière ? Si nouveau → **D**, on **n'intègre pas** sans ta validation. **[D]**

4. **Prompts en bibliothèque** — OK pour mapper `📝 Prompts` (Studio) sur l'objet **Prompt** déjà prévu par le
   modèle (bibliothèque de prompts réutilisables, copiés au projet) ? **[C]**

5. **Import de photo arbitraire** — `📥 Importer` autorise-t-il **n'importe quelle image** comme matière/source,
   ou doit-il être **cadré au persona** (et/ou la Conscience **signale** une incohérence sans bloquer) ? **[D]**

6. **Champs de matière à ajouter** — Autorises-tu l'ajout, **comme attributs d'objets existants** (média/dossier),
   de : **prompt, paramètres image, image-source liée, mouvement, script, voix, musique, légendes, paramètres
   vidéo, plateforme, légende courte/longue, hashtags** ? *(Conforme au modèle ; statut C ; aucun nouvel objet.)* **[C]**

7. **Aperçu pendant saisie de texte long** — Acceptes-tu que, **pendant la frappe d'un texte libre long**
   (prompt détaillé, script), l'**aperçu média ne soit pas affiché** (il revient juste après la saisie) ?
   Sinon, on **limite la saisie libre** au profit de **presets/puces** (option T1b). **[Décision UX]**

8. **Édition riche multi-blocs** — Quelle option de rendu retiens-tu pour les écrans riches : **T1 sous-vues en
   place** (recommandée), **T2 caption compacte + courts messages**, ou **T3 sous-bloc temporaire** (qui viole
   transitoirement « un seul bloc ») ? **[Décision UX ; T3 = D]**

9. **`👁 Aperçu`** — L'aperçu est une **maquette/résumé sans dépense** (pas le rendu réel d'une génération non
   lancée). OK ? Ou attends-tu un aperçu d'un autre type ? **[Décision]**

10. **Publication réelle** — `📤 Publier` : quelle(s) **plateforme(s)** cible(s) et **quel connecteur** ? Reste
    **gaté/simulé** jusqu'à ton GO explicite (zéro dépense, jamais auto). **[Décision + GO]**

11. **Génération réelle (coût)** — `✨`/`🎬` restent **simulés (zéro dépense)** par défaut ; le backend réel
    (image/vidéo/lip-sync) est **débranché** jusqu'à ton **GO explicite par écran**. Confirmes-tu ce gating ? **[Décision + GO]**

---

# SECTION 4 — PLAN D'INTÉGRATION (sans coder — exécuté APRÈS validation)

> **Aucune ligne de code avant ta validation du schéma et des décisions §3.** Tout derrière `/v4r`, **live +
> /v4 intacts**, **zéro dépense**, génération réelle + publication **gatées**.

**Étape 0 — Validation** : tu valides §1 (schéma), tranches §3 (décisions), et fixes les options T (2a). Ce
document devient **la référence unique** ; je classe chaque point retenu (C/D) avant tout code.

**Étape 1 — Socle (attributs, si §3.6 validé)** : étendre le **fait dossier/média** avec les champs de matière
validés (prompt, params, source liée, script, voix, musique, légendes, plateforme, hashtags) — **attributs sur
objets existants**, historisés (versions). Aucune dérivation stockée. Tests Socle verts + reconstruction.

**Étape 2 — Conscience (lecture)** : réutiliser `ui/conscience.js` pour situation/nom/mémoire/compteurs ;
**retirer** le pilotage par « prochain geste » comme moteur d'entrée (si §3.1 validé), le conserver comme
lecture facultative. Tests verts.

**Étape 3 — Navigation & vues (pur, testable hors Telegram)** : un module de **vues par écran** (Accueil, Photo,
Photo/Prompt, Photo/Résultat, Vidéo, Vidéo/Paramètres, Vidéo/Résultat, Publication, Studio, Récents) renvoyant
`{kind, caption, rows}` — **boutons exacts** de §1, **comportements** de §1. Un **routeur d'écrans** + l'**oracle
de transport** (bloc unique, swap média en place, recréation seulement texte↔média) déjà éprouvé. Tests de vues
+ tests de navigation (chaque bouton → bon écran/comportement) **avant** câblage.

**Étape 4 — Câblage Telegram** derrière `/v4r` : brancher le routeur sur le bloc vivant, selon l'option T
retenue. **Gates** : `✨`/`🎬` simulés (zéro dépense) ; `📤 Publier` confirmé + gaté. `🗑` soft.

**Étape 5 — TEST BOUT-EN-BOUT réalisé PAR MOI (auto-preuve)** des **3 scénarios** :
- **A** : photo seule.
- **B** : vidéo depuis photo existante.
- **C** : vidéo en générant d'abord une photo (avec **retour automatique** à VIDÉO, source posée).

Je fournirai, comme pour les livraisons précédentes, une **trace imprimée** (étape → écran → action →
`message_id` → blocs visibles) prouvant **mécaniquement** :
- **aucun état perdu** (cap + matière + paramètres persistent, re-ouverture identique) ;
- **aucun écran orphelin** (tout écran a un retour ◀/🏠 cohérent) ;
- **aucun bouton qui change de comportement** (comportement constant des commandes globales) ;
- **aucun doublon** ;
- **aucune carte empilée** (1 bloc visible à tout instant ; média swap en place ; 1 seule recréation texte→média) ;
- **aperçu visible tout du long** (selon l'option T tranchée, hors saisie de texte long si §3.7 l'accepte) ;
- **projet unique du début à la fin** (un seul dossier vivant).

**Garanties permanentes** : tests verts, aucune régression legacy, **live + /v4 intacts**, **zéro dépense**,
génération réelle + publication **sous confirmation/GO**, fichiers verrouillés (`subtitle_style.js`,
`color_style.js`) intacts.

---

*Fin du document. Référence unique de navigation produit. En attente de validation §1 + décisions §3 avant tout code.*

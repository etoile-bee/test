# ARCHITECTURE FINALE — Référence directrice du projet

> **Statut : décision d'Etoile. Document directeur.** Toute évolution future DOIT respecter cette
> architecture. En cas de conflit entre ce document et l'existant, c'est ce document qui fait foi
> (l'existant sera migré vers cette cible, par étapes testées — jamais en big-bang).
>
> _Rédigé le 2026-06-08 d'après la décision d'architecture d'Etoile._

---

## 1. Principe fondateur — ÉDITEUR UNIQUE

Tout le pilotage se fait dans **un seul éditeur** (le « cockpit ») : **un seul message Telegram
auto-édité en place**. On n'ouvre **jamais** une nouvelle fenêtre, un nouvel onglet hors-cockpit,
ni un popup. Naviguer = ré-éditer le même message (média + légende + boutons).

L'éditeur unique est organisé en **ONGLETS**. On passe d'un onglet à l'autre dans le même message.

---

## 2. ONGLETS de l'éditeur (contenus exacts)

L'éditeur comporte exactement **6 onglets** :

| Onglet | Contenu |
|---|---|
| **Média** | Le média courant du projet (photo générée / vidéo). Voir, remplacer (upload), choisir la source. |
| **Photo** | Tout ce qui définit l'image : **prompts**, **décor**, **caméra** (angle/cadrage). Réglages de génération photo. |
| **Vidéo** | Tout ce qui définit la vidéo : **caméra/zoom**, mouvement, musique, durée, réactions. Réglages de génération vidéo. |
| **Script** | Le texte du script, **éditable** (sujet → script → validation avant dépense). |
| **Légendes** | **Légende courte** + **légende longue** (+ hashtags). Éditables. |
| **Paramètres** | Paramètres généraux du projet (format, options techniques, persona, etc.). |

Ces 6 onglets sont aussi les 6 entrées du menu **Modifier** (cf. §4).

---

## 3. SAUVEGARDE — projet réouvrable à l'identique

Enregistrer un projet sauvegarde **tout l'état**, de sorte qu'à la réouverture le projet revienne
**exactement** dans le même état :

- le **média** (photo/vidéo) ;
- les **prompts** ;
- le **décor** ;
- la **caméra** ;
- le **script** ;
- les **légendes** (courte + longue) ;
- les **paramètres**.

Un projet rouvert = même média, mêmes prompts, même décor, même caméra, même script, mêmes
légendes, mêmes paramètres. Aucune perte, aucune dérive.

---

## 4. STRUCTURE FINALE (arborescence de navigation)

```
ACCUEIL
 ├─ Photo
 ├─ Vidéo
 └─ Studio
       ├─ Look ── { Upload · Pick · Random }
       ├─ Décor
       └─ Caméra

GÉNÉRATION
 ├─ Prévisualisation
 ├─ Résultat
 ├─ Légende courte
 ├─ Légende longue
 ├─ Script
 ├─ Modifier
 └─ Enregistrer

MODIFIER
 ├─ Média
 ├─ Photo
 ├─ Vidéo
 ├─ Script
 ├─ Légendes
 └─ Paramètres
```

### Détail

- **Accueil** → 3 entrées : **Photo**, **Vidéo**, **Studio**.
- **Studio** → 3 sections :
  - **Look** → 3 sources : **Upload** (envoyer une photo), **Pick** (choisir dans la galerie), **Random** (tirage aléatoire).
  - **Décor**.
  - **Caméra**.
- **Génération** → écran qui propose : **Prévisualisation**, **Résultat**, **Légende courte**, **Légende longue**, **Script**, **Modifier**, **Enregistrer**.
- **Modifier** → les 6 onglets : **Média**, **Photo**, **Vidéo**, **Script**, **Légendes**, **Paramètres**.

---

## 5. RÈGLES GLOBALES (non négociables)

1. **Aucun nouvel onglet / fenêtre / popup** hors de l'éditeur unique. **Tout dans le cockpit.**
2. **Chaque clic est tracé** (journalisé).
3. **Chaque action est vérifiée** (on confirme qu'elle a bien eu l'effet attendu).
4. **Chaque erreur est journalisée.**
5. **Auto-correction si possible** (le système se rattrape tout seul quand il le peut).
6. **Rapport détaillé par session** (compte-rendu de ce qui s'est passé).

---

_Document de référence — à respecter pour tout développement futur. Mapping de l'existant vers
cette cible : `docs/MAPPING_ARCHITECTURE.md`._

# DESIGN — COUCHE CRÉATIVE (UI au-dessus du socle cockpit-v4)

> **État** : le SOCLE (moteur + données) est complet et testé ; la COUCHE CRÉATIVE = **surface UI** à construire au-dessus (pickers réels, zones, CRUD, terminologie, UX des 3 états). **Design seulement — aucune implémentation avant validation d'Etoile.** Le 1er run image reste possible séparément. Live `/v4` en place, aucune dépense, fichiers verrouillés intacts.
> **Principe** : on n'ajoute **aucune donnée nouvelle** — on **expose** ce que le moteur sait déjà faire (E121/E122 : l'UI lit/écrit le dossier projet).

## 1. ZONES SÉPARÉES — Référence · Look · Décor · Prompt · Paramètres
**Écran PARAMÈTRES = liste de lignes** (déjà conçu) ; chaque ligne = une **zone autonome** avec **son aperçu** + **son prompt associé** + un **picker focalisé in-bloc** (remplace le stub actuel).

```
② PARAMÈTRES                       [média actif visible au-dessus]
🎯 Référence : Imany            🔒 ▸     (picker réf : voir/changer/uploader/verrouiller)
👗 Look : robe noire            🔒 ▸     (picker look : choisir/créer/réutiliser + prompt look)
🌆 Décor : studio               🔒 ▸     (picker décor : choisir/créer/réutiliser + prompt décor)
✍️ Prompt : défaut                 ▸     (picker prompt : voir/éditer/charger/enregistrer)
🔢 Images : 1                      ▸     (1/2/3/4/6)
────────
👁 Aperçu      🎨 Ajuster      ✅ Valider
```
- **Chaque zone a son image de réf éventuelle + son prompt** : le picker Look montre la vignette du look + son prompt ; le picker Décor idem.
- **Cadenas 🔒 par zone** (Q1) : verrouiller Décor (ou Look, ou Réf) → en régénérant, la zone verrouillée est **conservée**, seules les zones non verrouillées changent. ⇒ « garder décor + changer look », « garder look + changer décor », « changer seulement le prompt », « changer seulement la réf » = naturellement obtenus (lignes indépendantes + 🔒).
- **Données** : déjà dans `manifest` (`reference`, `look.tenue`, `look.decor`, `prompts[]`, `parametres.nb_images`) + préréglages/locks à exposer.

## 2. UX DES 3 ÉTATS — évidente et DÉCOUPLÉE
Trois états **visibles et distincts**, **actions non liées automatiquement** :

| État | Ce que c'est | Où c'est visible | Action pour y entrer (explicite) |
|---|---|---|---|
| **① Candidate / Variante** | image générée, **pas encore choisie** | galerie de candidats (◀︎ ▶︎) + badge « candidate » | « Conserver comme variante » |
| **② Média actif** | l'image **du projet** (source des étapes suivantes) | **badge ★ ACTIF** sur le média + en-tête | « Définir comme média actif » |
| **③ Livrable validé** | contenu **publiable** (entre en Prêt-à-poster) | section Prêt-à-poster + badge « livrable » | « Valider comme livrable » |

- **Impact affiché à chaque action** : ex. « Définir comme média actif → cette image alimentera la vidéo » · « Conserver comme variante → gardée dans le projet, **pas** livrable » · « Valider comme livrable → part en Prêt-à-poster ».
- **Découplage** : conserver une candidate **n'en fait pas** le média actif ; définir le média actif **ne le valide pas** comme livrable. (Moteur : `setImageOutcome('variante'|'garder'|'livrable')` déjà distincts.)
- **Règle visible** : « rien n'est livrable sans validation explicite » (E123) rappelée à l'écran candidats.

## 3. TERMINOLOGIE — libellés clairs (proposition)
| Actuel (ambigu) | Proposé (clair) | Callback (inchangé) |
|---|---|---|
| ✅ Garder | **★ Définir comme média actif** | CAND_KEEP |
| ◫ Variante | **◫ Conserver comme variante** | CAND_VAR |
| ⭐ Livrable | **✅ Valider comme livrable** | CAND_DELIVER |
| 🔁 Varier | **🔁 Générer une variante** | CAND_VARY |
| 🔄 Régénérer | **🔄 Régénérer (remplace)** | CAND_REGEN |
| ✨ Nouveau look | **✨ Créer un look** | SRC_NEW |
| (Nouveau, ambigu) | **🆕 Nouveau projet** vs **✨ Créer un look** (distingués) | go:photo / SRC_NEW |
| 💲 Lancer | **💲 Générer (payant) — N cr ≈ X €** | GEN_CONFIRM |
| 📣 Publier | **📣 Publier (sort de la file)** | PUBLISH |

## 4. CRÉATION DE CONTENU — looks & décors (usage central)
- **Dans le cockpit (au fil de la création)** :
  - **SOURCE** : « ✨ Créer un look » (génère) · « 📚 Réutiliser un look » (galerie) · « 📤 Importer ».
  - **PARAMÈTRES › Décor** : « 🌆 Choisir un décor » · « ➕ Créer un décor » · « 💾 Enregistrer ce décor ».
  - **Enregistrer** : « 💾 Enregistrer ce look / ce décor » → bibliothèque persona (réutilisable).
- **Dans STUDIO (gestion centrale)** : bibliothèques **Looks · Décors · Références · Prompts · Préréglages · Projets archivés**, chacune avec **CRUD complet** : créer · renommer · dupliquer · supprimer (corbeille) · archiver · **verrouiller**. (Moteur : `libstore` — décors en mode **A3 sécurisé**.)
- **Réutilisation** = appliquer un élément au projet = **action explicite** (copie), jamais auto (E124).

## 5. PUBLICATION — hiérarchie exposée (E125)
**Projet → Versions → Version validée → Dossier livrable.** Exposition :
- **Section « 📦 Livrables » du projet** : liste `liv1, liv2, …` (chaque version validée = un dossier autonome).
- **Ouvrir un livrable** → affiche, **en blocs copiables (tap-pour-copier Telegram `<code>`)** :
  - 🎬 vidéo · 🖼 image(s) · ✍️ script · **📝 légende courte** · **📄 légende longue** · **#️⃣ hashtags** · ⚙️ params · 💳 coûts · 📁 exports · RAW.
- **Récupération rapide** : tout est dans `projects/<persona>/<id>/exports/livN/deliverable.json` — rien à reconstruire. Bouton « 📤 Copier la légende » / « #️⃣ Copier les hashtags » pour coller directement dans TikTok.
- **Prêt-à-poster** = file des livrables non publiés ; **Publier** → sort de la file, reste en Historique (A5).

## 6. UX — sous-étapes simples, UNE action principale par écran
Re-découpe des écrans chargés actuels :
- **SOURCE** (aujourd'hui : 8+ boutons) → **choisir l'origine d'abord** (Créer look / Galerie / Import), **puis** nb d'images, **puis** revue candidats. *(1 décision par écran)*
- **Revue candidat** → **action principale = « ★ Définir comme média actif »** ; le reste (Variante / Livrable / Régénérer / Varier / Éditer / Rejeter) sous **« ⋯ Plus d'options »**. *(réduit les boutons simultanés)*
- **PARAMÈTRES** → liste de lignes ; **un seul picker ouvert à la fois** (focalisé). *(déjà conçu)*
- **Éditeur image** → **sous-pickers focalisés** (Lumière, puis Contraste, … un réglage à la fois) au lieu de la boîte compacte (Q6).
- **FINALISER** → récap + **1 action : « 💲 Générer (payant) »** (après QC) ; livrables/publication sur l'écran suivant.
- **Barre constante** : ⬅ Retour · ✅ Valider · 🏠 Accueil (+ 🛑/🔄/❓). Textes courts (verrou 8).

---

## Registre zones grises (E126) — sous-modules couche créative
| # | Sous-module | Zone grise | Options | Reco | Impact UX |
|---|---|---|---|---|---|
| C1 | Pickers Paramètres | profondeur (liste simple vs recherche/filtres) | (a) liste paginée · (b) +recherche/tags | (a) d'abord, (b) si >12 items | simplicité |
| C2 | Cadenas par zone | persistance du lock (projet vs préréglage) | projet (E124) + preset persona | projet par défaut | « garder X, changer Y » |
| C3 | « ⋯ Plus d'options » | combien d'actions au 1er niveau | 1 principale + repli | 1 principale (média actif) | moins de boutons |
| C4 | Décors CRUD | écriture lookbook (A3) | envs only + rollback | déjà tranché (A3) | sécurité |
| C5 | Copie légende/hashtags | `<code>` tap-copy vs fichier | `<code>` in-cockpit | `<code>` | publication rapide |
| C6 | Terminologie | libellés définitifs | tableau §3 | valider §3 | clarté |

## À VALIDER par Etoile (avant toute implémentation UI)
1. Le modèle **zones + pickers focalisés + cadenas par zone** (§1).
2. L'**UX des 3 états découplée** + impacts affichés (§2).
3. La **terminologie** §3 (libellés définitifs).
4. La **surface création/réutilisation** cockpit + STUDIO (§4).
5. L'**exposition des livrables** + copie rapide légende/hashtags (§5).
6. La **re-découpe des écrans** (1 action principale/écran) (§6).

_Aucune ligne de code couche créative avant ce go. Le socle/données est prêt à la recevoir. Live `/v4` en place, aucune dépense, fichiers verrouillés intacts._

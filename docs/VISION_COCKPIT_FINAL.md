# VISION COCKPIT FINAL — synthèse consolidée + écarts + convergence

> **Tâche d'analyse/synthèse. Aucune implémentation avant validation de cette vision par Etoile.** Live `/v4` intact, aucune dépense, fichiers verrouillés intacts.
> Sources : exigences E1→E126, arbitrages A1-A7 / C1-C5 / D1-D3, décisions du jour, code cockpit-v4 réel.
> **Écart n°1 (ressenti d'Etoile)** : « je pilote un PROJET, pas une collection de boutons ». ⇒ le concept central manquant = un **TABLEAU DE BORD PROJET** persistant.

---

## ★ CONCEPT CLÉ MANQUANT — TABLEAU DE BORD / ÉTAT DU PROJET (persistant, lisible)
Aujourd'hui l'en-tête ne montre que `nom · réf · look · média` (souvent « 📁 Projet · 🖼 — » = vide ressenti). **Cible : l'état GLOBAL du projet est visible EN PERMANENCE.**

**(a) Bandeau d'état — en tête de CHAQUE écran du cockpit** (le bloc média unique commence toujours par) :
```
📁 <Nom lisible>            <état global : 📝 brouillon / ⏳ en cours / ✅ prêt / 📣 publié>
🎯 Imany🔒 · 👗 Robe noire · 🌆 Studio🔒 · ✍️ Prompt B
⚙️ 3 img · 23s · 9:16   ·   ◫ 2 variantes   ·   📦 1 livrable
```
- Chaque zone affiche sa **valeur active** + **🔒 si verrouillée**. Compact (3 lignes, textes courts, verrou 8).
- **(b) Écran dédié « 📊 Projet »** (accessible de partout) : tableau de bord complet —
  réf/look/décor/prompt/paramètres actifs (+ verrous) · média actif (aperçu) · liste variantes · liste livrables · versions · statuts qualité/publication · **actions rapides** (ouvrir une zone, voir variantes, voir livrables, reprendre).
- **Données déjà présentes** dans le manifest (`zones`, `media_actif`, `variantes`, `livrables_dossiers`, `versions`, `statut_*`) → **il ne manque que la SURFACE** (le rendu du bandeau + l'écran 📊).

---

## 1. Architecture complète du système
- **Un seul moteur de production** ; **plusieurs points d'entrée** (PHOTO, VIDÉO) sur **le même projet** (modèle A).
- **Dossier projet = source de vérité unique** (E121/E122) ; l'UI ne fait que lire/écrire ce dossier (jamais d'état caché).
- **Couches** : `project_store` (données/manifest) · `cockpit_flow` (grammaire/gates) · `cockpit_block` (bloc média unique, fin F1) · `cockpit_view` (rendu) · `cockpit_lib`/`cockpit_libstore` (bibliothèques+CRUD) · `cockpit_cost` (coûts) · `cockpit_controller` (orchestration, pointeurs only) · `cockpit_integration` (Telegram). Moteurs réels (Seedream/Kling/ElevenLabs/Anthropic/render_local) **branchés derrière confirmation+QC**.

## 2. Parcours utilisateur complet (un seul projet)
**ACCUEIL → PHOTO** : SOURCE (origine + nb) → génération (confirmation coût) → revue candidats (3 états) → **média actif** → PARAMÈTRES (réf/look/décor/prompt via zones) → APERÇU (permanent) → FINALISER (QC) → image finalisée.
**→ VIDÉO (même projet, sans rupture)** : SOURCE = images **retenues** (plans) → PARAMÈTRES (script/durée/sous-titres/musique) → FINALISER (QC + coût) → vidéo → **PRÊT-À-POSTER** → **dossier livrable** → Publier.
**Réversible** à toute étape jusqu'à finalisation (E114/E115, Conserver/MàJ/Régénérer).

## 3. Structure exacte d'un projet (manifest `project.json`)
`projectId · persona · name · statut_qualite (brouillon/test/production) · statut_publication (aucun/pret_a_poster/publie/archive) · gen_status` ·
**zones** {reference, look, decor, prompt} chacune `{value,label,ref_image,prompt,locked,history[]}` ·
`media_actif` · `retenues[]` (plans) · `image_candidates[]` · `variantes[]` · `rejetees[]` ·
`parametres {nb_images,mode,format,duree,image_fx,crop,subs_override}` ·
`prompts[] · scripts[] · legendes{courte,longue,tags}` · `couts · moteur_ia · qc · rapport_qc[]` ·
`versions[]` (snapshots restaurables) · `livrables{image,video}` · `livrables_dossiers[]` · `raws{…}` · `historique_versions[]`.

## 4. Projet PHOTO / projet VIDÉO / relation
- **Phase PHOTO** : zones (réf/look/décor/prompt) → images → média actif/retenues.
- **Phase VIDÉO** : source = images **retenues** (1 image retenue = 1 plan, Q9) → script/durée → vidéo (durée adapte les plans, alerte si script incohérent, D2).
- **Relation** : **un seul projet, deux phases** ; l'image validée devient **automatiquement** la source vidéo (E41). FINALISER = **sélection des livrables** (☑ Image ☑ Vidéo, E123) : décocher Vidéo = image seule ; garder les deux = enchaînement.

## 5. Gestion des éléments
| Élément | Règle |
|---|---|
| **Références / Looks / Décors / Prompts** | zones du projet (valeur+prompt+réf+verrou+historique) ; **bibliothèques persona** (CRUD complet, décors en mode A3 sécurisé) ; réutilisation = **copie explicite** (E124, jamais d'auto) |
| **Paramètres** | per-projet (nb/durée/format/image_fx/crop/subs) ; **jamais globaux** (E124, étanchéité) |
| **Variantes** | trace technique (conservées, **pas livrables**) |
| **Média actif** | l'image **gardée** = source des étapes (propagée, persistée dans le dossier) |
| **Livrables** | **validés explicitement** ; chaque version validée = un **dossier livrable autonome** (E125) |
| **Prêt-à-poster** | file des livrables non publiés ; publier → sort de la file |
| **Historique** | mémoire **complète et permanente** de tous les projets (vues filtrées, E121) |
| **Publication** | statut « publié » (A5) ; auto-post TikTok = chantier ultérieur |

## 6. Dossier projet & dossier livrable
- **Dossier projet** : `projects/<persona>/<id>/` = `project.json` + `images/ variants/ videos/ exports/ raw/ intermediaires/ logs/`. **Conteneur unique**, médias locaux (survivent aux URLs temporaires, A6).
- **Dossier livrable** : `exports/livN/deliverable.json` = vidéo · image(s) · script · **légende courte+longue** · **hashtags** · params · infos · coûts · moteur · raws · exports. **Publiable sans reconstruire le contexte.**

## 7. Navigation complète
ACCUEIL ⇄ {PHOTO, VIDÉO, STUDIO, RÉCENTS}. Dans un projet : **📊 Projet (dashboard)** ⇄ SOURCE ⇄ PARAMÈTRES (→ pickers de zone : verrou/choisir/créer/enregistrer/historique) ⇄ FINALISER ⇄ 📦 Livrables (→ ouvrir livrable, copier légende/hashtags). Bibliothèques **in-bloc**, retour exact au projet (WS_RESUME). **Un seul bloc média**, tout édité en place ; barre **⬅ Retour · ✅ Valider · 🏠 Accueil**.

---

## ANALYSE DES ÉCARTS (par écran observé en /v4)
| Écran actuel | Verdict | Détail |
|---|---|---|
| **Accueil** (PHOTO/VIDÉO/STUDIO/RÉCENTS) | ✅ conforme | + ♻️ surfacer « ↩️ Reprendre le projet en cours » |
| **SOURCE photo** (en-tête + Nouveau/Galerie/Upload + nb) | ♻️ à repenser | **en-tête projet pauvre (pas de tableau de bord)** ; zones (réf/look/décor/prompt) **non visibles ici** ; **Stop/Restart dans la barre** (à retirer de l'expérience). nb 1/2/3/4/6 ✅ |
| **SOURCE vidéo** | ✅ conforme | origines correctes |
| **Avant de lancer** (coût) | ✅ conforme | 1 img · 9:16 · Seedream · cr≈€ · confirmation |
| **Candidat amélioré** (3 états) | ✅ conforme | ancien écran 7-boutons **supprimé** (vérifié, non atteignable) |
| **STUDIO bibliothèques** | 🕓 partiel | entrées présentes ; **boutons CRUD (renommer/supprimer/dupliquer/lock) à surfacer** dans les vues |
| **RÉCENTS** | ⛔ non conforme | **ID technique** affiché (`imany_2026-06-10-15-52…`) → exige un **libellé lisible** (ex. « Projet · 10 juin 15:52 ») |
| **Édition image** (per-projet) | ✅ conforme | étanchéité A4/E124 affichée |
| **« Chargement… »** | ⛔ non conforme | **message technique résiduel** (legacy `RES_PREV/NEXT`, telegram_bot.js:3194-3195) → **élimination définitive** |
| **Barre Stop/Restart** | ♻️ à repenser | techniques **dans l'expérience créative** → déplacer (commandes `/stop` `/restart` + ❓ Aide › Système) |
| **Tableau de bord projet** | ❌ manquant | **l'état global du projet n'est nulle part** (écart n°1) |

## PLAN DE CONVERGENCE — UNE seule livraison cohérente (E119)
**Pas de micro-livraisons.** Un lot unique « cockpit-v4.1 créatif » couvrant :
1. **Tableau de bord projet** (écart n°1) : bandeau d'état en tête de chaque écran + écran **📊 Projet** complet (zones/verrous/variantes/livrables/statuts/actions).
2. **Lisibilité & propreté** : noms de projet lisibles (RÉCENTS + en-tête, « Projet · <date heure> » par défaut, renommable) ; **élimination définitive de « Chargement… »** et de tout message technique (restart silencieux) ; **retrait de Stop/Restart de la barre créative**.
3. **Zones partout** : accès aux zones (réf/look/décor/prompt) depuis le dashboard et SOURCE, pas seulement Paramètres ; **CRUD STUDIO** surfacé (boutons).
4. **Cohérence finale** : symétrie PHOTO/VIDÉO, 1 action principale/écran, image brute, garde-fous (E122/E124) — puis **auto-audit E118 complet** (12 étapes + étanchéité + conformité E1→E126) **avant** la livraison unique.
> Ordre interne libre, mais **une seule bascule** présentée à Etoile (version complète, testée), pas d'allers-retours bouton par bouton.

## 🔎 DÉCISIONS À REMONTER (E120/E126) — avant d'implémenter
| # | Décision | Options | Reco | Impact UX |
|---|---|---|---|---|
| V1 | Forme du tableau de bord | (a) bandeau 3 lignes partout · (b) + écran 📊 dédié | **(a)+(b)** | « je pilote un projet » |
| V2 | Nom de projet par défaut | (a) « Projet · 10 juin 15:52 » auto, renommable · (b) demander un nom à la création | **(a)** | lisibilité immédiate, zéro friction |
| V3 | Stop/Restart | (a) commandes `/stop` `/restart` + ❓ Aide › Système · (b) petite barre système séparée | **(a)** | expérience créative épurée |
| V4 | « Chargement… » & messages techniques | suppression totale + réponses instantanées au tap | **suppression** | zéro jargon (E3) |
| V5 | Profondeur écran 📊 | (a) lecture + accès zones · (b) + édition inline | **(a)** d'abord | simplicité, 1 action/écran |

## À VALIDER PAR ETOILE
La **vision** (architecture + tableau de bord projet + parcours + structures), l'**analyse des écarts**, et le **plan de convergence en une livraison**. **Rien n'est implémenté avant ce go.** Ensuite : un seul lot complet, auto-audité (E118), puis Etoile teste la **version complète** en `/v4`.

_Live `/v4` intact, aucune dépense, fichiers verrouillés intacts._

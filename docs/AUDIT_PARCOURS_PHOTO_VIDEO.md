# AUDIT DE PARCOURS — PHOTO & VIDÉO (bout en bout)  ·  2026-06-10

> **Analyse seulement. Aucune correction, aucune dépense, pas de restart.** État audité : branche **`fix/ux-round2 @ 324c8c4`** (le plus avancé : en-tête 1 ligne, grilles, menu 4 entrées). Live déployé = `7e24dac` (un cran derrière).
> Objectif d'Etoile : cockpit **extrêmement simple, rapide, cohérent** — « on ne se demande JAMAIS quoi faire ensuite ». Règle directrice : **UNE ÉTAPE = UNE DÉCISION PRINCIPALE**.

## RÉSUMÉ EXÉCUTIF
- **PHOTO** : 2 étapes principales (Look → Image) **+ 5 sous-écrans** (Référence, Galerie-réf, Galerie-look, Prompt, Biblio-prompt, Propagation) → profondeur réelle élevée.
- **VIDÉO** : 5 étapes principales (Source → Script → Montage → Légende → Export) **+ 2 sous-écrans** (Galerie-source, Biblio-script).
- **Pipeline complet** PHOTO→VIDÉO = **7 écrans principaux** en ligne + sous-écrans.
- **Redondances/frictions majeures** : (a) **`photo.look` mélange 3 décisions** (source + paramétrage + navigation réf/prompt) ; (b) **asymétrie PHOTO↔VIDÉO** (PHOTO n'a pas d'écran « Source » dédié comme VIDÉO ; la source est noyée dans Look) ; (c) **Retour incohérent** (`photo.look`→section `photo` quasi vide ; `video.source`→`photo.image` même en entrée VIDÉO directe) ; (d) **Montage pauvre + jargon**, **Finalisation pauvre** ; (e) **durée vidéo absente**, **mode planche non choisi**.
- **Parcours cible proposé** : **grammaire unique en 5 temps** identique pour PHOTO et VIDÉO — *Source → Paramètres → Aperçu (gratuit) → Ajuster → Finaliser* → Prêt-à-poster. PHOTO passe de « 2+5 » à **4 écrans clairs** ; VIDÉO de « 5+2 » à **4-5 écrans symétriques**.

---

## 1. PARCOURS RÉEL ACTUEL — PHOTO

### Écran P-A · `photo.look` (« Look »)
- **Point d'entrée** : Accueil → 📸 PHOTO (`go:photo.look`).
- **Navigation** : vient de `photo` (section) ; va vers `photo.image` (➡ Suivant, actif si source choisie). Sous-écrans : `photo.ref`, `photo.lookgal`, `photo.prompt`.
- **Étape n°** : 1/2 (mais ouvre 4 sous-branches).
- **Infos affichées** : en-tête 1 ligne (projet·étape·réf·look·média·mode) + « choisis tenue/décor » ou « Look prêt ».
- **Boutons** : `👗 Tenue` · `🌆 Décor` · `🎯 Référence` · `✍️ Prompt` · `🖼 Galerie` · `📤 Upload` · `🔢 N image(s)` + nav (⬅/🏠/➡) + ❓.
- **Retour** : ⬅ → `photo` (section à 2 boutons, quasi vide) — **friction**.
- **Édition** : tenue/décor/nb/réf/prompt modifiables ici.
- **Validation** : implicite (choisir une source/config déverrouille ➡ Suivant).
- **Génération** : non (l'image se génère à l'étape suivante).
- **Reprise** : `RX_DRAFTS` → rouvre à l'étape exacte (slice).

### Écran P-B · `photo.image` (« Image »)
- **Entrée** : `photo.look` ➡ Suivant.
- **Navigation** : ⟵ `photo.look` ; ➡ `video.source`. Sous : `photo.propagate` (sur modif amont).
- **Étape n°** : 2/2.
- **Infos** : en-tête + « 👁 Aperçu gratuit » (avant génération) ou « Image n/N ».
- **Boutons** : sans image → `✨ Lancer Final HD` ; avec images → `‹ n/N ›` · `✅ Valider` · `🎨 Éditer` · `🎬 Faire une vidéo` ; confirmation → `✅ Lancer Final HD` · `◀ Annuler`.
- **Retour** : ⟵ `photo.look` (slice conservé).
- **Édition** : `🎨 Éditer` (→ éditeur **legacy F1**, recrée un bloc — 🔴).
- **Validation** : `✅ Valider` (écrit l'image validée).
- **Génération** : `✨ Lancer Final HD` → confirmation → génération réelle (derrière confirmation).
- **Reprise** : oui (slice image).

### Sous-écrans PHOTO
- `photo.ref` (réf active + 🖼 Galerie/📤 Upload) → `photo.refgal` (‹ › + ✅ Définir).
- `photo.lookgal` (‹ › + ✅ Choisir un look).
- `photo.prompt` (texte + ✍️ Éditer/↩️ Défaut/📚 Charger/💾 Enregistrer) → `photo.promptlib`.
- `photo.propagate` (Conserver / Mettre à jour / Régénérer).

**Total PHOTO** : 2 principaux + 6 sous-écrans.

---

## 2. PARCOURS RÉEL ACTUEL — VIDÉO

### Écran V-A · `video.source` (« Source »)
- **Entrée** : Accueil → 🎬 VIDÉO (`go:video.source`) **ou** `photo.image` → 🎬 Faire une vidéo.
- **Navigation** : ⟵ `photo.image` (parent) ; ➡ `video.script`. Sous : `video.srcgal`.
- **Étape n°** : 1/5 (vidéo).
- **Infos** : en-tête + « D'où part la vidéo ? » + source actuelle.
- **Boutons** : `👗 Look du projet` · `🖼 Image générée` · `🖼 Look galerie` · `✨ Nouveau look` · `📤 Uploader`.
- **Retour** : ⟵ `photo.image` — **incohérent en entrée VIDÉO directe** (ramène à une étape Image vide).
- **Édition/Validation** : choix de source = validation ; ➡ Suivant (gate média).
- **Génération** : non. **Reprise** : oui (slice video).

### Écran V-B · `video.script` (« Script »)
- **Entrée** : `video.source` ➡. **Nav** : ⟵ source ; ➡ `video.montage`. Sous : `video.scriptlib`.
- **Infos** : en-tête + aperçu du script.
- **Boutons** : `✍️ Éditer` · `🤖 Générer 💲` · `📚 Charger` · `💾 Enregistrer`.
- **Retour** : ⟵ source. **Édition** : oui. **Génération** : script (🤖, Anthropic, payant). **Reprise** : oui.

### Écran V-C · `video.montage` (« Montage »)
- **Entrée** : `video.script` ➡. **Nav** : ⟵ script ; ➡ `video.legende`.
- **Infos** : « Sous-titres : ON · *Archivo Black 52px* · réglages image/zoom/musique : éditeur avancé » — **jargon (🔴 #3) + pauvre (#12)**.
- **Boutons** : `🎨 Éditer (avancé)` (→ éditeur **legacy F1**, recrée un bloc — 🔴).
- **Retour** : ⟵ script. **Édition** : via éditeur legacy. **Reprise** : oui.

### Écran V-D · `video.legende` (« Légende »)
- **Entrée** : `video.montage` ➡. **Nav** : ⟵ montage ; ➡ `video.export`.
- **Boutons** : `✍️ Éditer la légende`. **Édition** : oui.

### Écran V-E · `video.export` (« Finalisation »)
- **Entrée** : `video.legende` ➡. **Nav** : ⟵ legende (fin).
- **Infos** : « Vidéo Final HD · Aperçu prêt… » — **trop pauvre (🔴 #10)**.
- **Boutons** : `✨ Lancer la vidéo Final HD` ; confirmation → `✅ Confirmer` · `◀ Annuler`.
- **Génération** : vidéo réelle (derrière confirmation). **Reprise** : oui.

**Total VIDÉO** : 5 principaux + 2 sous-écrans.

---

## 3. RÔLE DE CHAQUE ÉCRAN (objectif · décision · action principale · actions secondaires)

| Écran | Objectif | Décision | Action principale | Actions secondaires | Verdict « 1 décision » |
|---|---|---|---|---|---|
| P-A Look | définir l'apparence | quelle tenue/décor/source ? | (ambigu) | réf, prompt, galerie, upload, nb | 🔴 **MÉLANGE** source+paramétrage+navigation |
| P-B Image | obtenir/valider l'image | valider ou régénérer ? | ✅ Valider | éditer, refaire, vidéo | 🟡 ok (mais éditer = legacy) |
| V-A Source | choisir le média de départ | quelle source ? | choisir une source | — | ✅ propre (1 décision) |
| V-B Script | définir le texte | écrire/garder le script | valider le script | éditer, générer, biblio | 🟡 ok |
| V-C Montage | régler le rendu | (flou) | 🎨 Éditer (legacy) | — | 🔴 **pauvre + jargon + bloc externe** |
| V-D Légende | texte de publication | écrire la légende | éditer | — | ✅ ok |
| V-E Finalisation | lancer le rendu payant | lancer Final HD ? | ✅ Lancer Final HD | — | 🔴 **récap absent** |

**Écrans qui mélangent les genres → à éclater/simplifier** : **P-A Look** (source + config + navigation réf/prompt), **V-C Montage** (pauvre + jargon technique), **V-E Finalisation** (devrait être un récap, pas un bouton seul).

---

## 4. SYMÉTRIE PHOTO ≡ VIDÉO (correspondance)

| Temps logique | PHOTO (actuel) | VIDÉO (actuel) | Symétrique ? |
|---|---|---|---|
| 1. Source | ❌ noyée dans `photo.look` | ✅ `video.source` (écran dédié) | 🔴 **NON** |
| 2. Paramètres | `photo.look` (tenue/décor/réf/prompt/nb) | `video.script` (+ durée absente) | 🟡 partiel |
| 3. Aperçu gratuit | `photo.image` (aperçu) | (pas d'écran aperçu dédié) | 🔴 NON |
| 4. Ajuster/Éditer | `photo.image` 🎨 (legacy) | `video.montage` 🎨 (legacy) | 🟡 (legacy des 2 côtés) |
| 5. Finaliser | `photo.image` Lancer Final HD | `video.export` | 🟡 |
| Légende | (PHOTO n'a pas de légende) | `video.legende` | 🔴 asymétrie |

**Divergences à corriger** : PHOTO sans écran Source dédié ; grammaire d'action différente (PHOTO config-puis-aperçu mélangés ; VIDÉO étapes séparées) ; emplacements de boutons non alignés. **L'utilisateur doit apprendre DEUX fonctionnements → objectif = UN seul.**

---

## 5. ANALYSE CRITIQUE (vers « on ne se demande jamais quoi faire »)
- **Étapes superflues / mélangées** : `photo.look` fait trop (3 décisions) ; les sous-écrans réf/prompt/galeries ajoutent de la profondeur (jusqu'à 3 niveaux) au lieu d'un paramétrage à plat.
- **Étapes ajoutées sans repenser la nav** : `video.source` greffé en parent de `photo.image` → Retour incohérent ; pipeline allongé (montage/légende/export séparés) sans regroupement.
- **Friction « quoi faire ensuite »** : sur `photo.look` (par quoi commencer ? source ou tenue ?) ; sur `video.montage` (que régler ?) ; sur `video.export` (qu'est-ce que je valide exactement ? récap absent).
- **Incohérences PHOTO/VIDÉO** : cf. §4.
- **Trop d'infos/boutons** : `photo.look` (7 boutons), montage jargon, en-tête multi-ligne (corrigé sur ux-round2, à confirmer live).
- **Ruptures de continuité restantes** : éditeur avancé (F1) recrée un bloc (🔴 #13) ; message « Chargement… » (🔴 #15) ; commandes slash legacy (F14).

---

## 6. PARCOURS CIBLE PROPOSÉ (symétrique, minimal)

**Grammaire UNIQUE en 4-5 temps, identique PHOTO et VIDÉO :**
```
SOURCE → PARAMÈTRES → APERÇU (gratuit) → [AJUSTER] → FINALISER → Prêt-à-poster
```
- **1. SOURCE** (écran dédié, identique aux deux) : PHOTO = Nouveau / Galerie / Upload · VIDÉO = Image du projet / Galerie / Upload / Nouveau look. *(1 décision : d'où on part.)*
- **2. PARAMÈTRES** (1 écran à plat, pas de sous-écrans en cascade) : PHOTO = tenue · décor · référence · prompt · nb/planche · format · VIDÉO = script · durée · voix · style. *(1 décision : régler ; réf/prompt en lignes, pas en sous-navigation.)*
- **3. APERÇU GRATUIT** (média plein écran + « ✨ Lancer Final HD »). *(1 décision : ça me va ?)*
- **4. AJUSTER** (optionnel, **dans le bloc** : PHOTO retouche · VIDÉO montage détaillé zoom/sous-titres/musique/rythme). *(secondaire.)*
- **5. FINALISER** (récap riche : source · réf · look · décor · script · durée · sous-titres · musique · format · coût · crédits · mode → « Lancer Final HD »). → **Prêt-à-poster**.
- Boutons : **UNE action principale par écran** (grande), réglages en lignes secondaires ; barre système discrète (❓ + Stop si génération).

### AVANT / APRÈS
| | Avant (actuel) | Après (cible) |
|---|---|---|
| PHOTO | 2 principaux + 6 sous-écrans (profondeur 3) | **4 écrans à plat** (Source · Paramètres · Aperçu · [Ajuster]) |
| VIDÉO | 5 principaux + 2 sous-écrans | **4-5 écrans symétriques** (Source · Paramètres[script+durée] · Aperçu · [Montage] · Finaliser) |
| Sous-écrans réf/prompt/galeries | navigation en cascade | **fusionnés** en lignes du Paramètres / pickers in-bloc |
| Symétrie | 🔴 divergente | ✅ même grammaire |
| Retours | incohérents | ⬅ toujours l'étape précédente ; 🏠 accueil |
| Finalisation | bouton seul | **récap complet** |
**On retire/fusionne** : sous-écrans réf/prompt/galeries → lignes de Paramètres ; on **ajoute** un écran Source PHOTO (symétrie) + Aperçu dédié + Finalisation récap + choix Durée/Planche. **Net : moins de profondeur, plus de clarté.**

---

## 7. PROTOCOLE DE TESTS UTILISATEURS COMPLETS (avant de figer)

### Déjà vérifié en simulation déterministe (harnais/replay, ce jour)
- Bloc unique sur tout PHOTO→VIDÉO (`test_video_ws`, journaux live 9550/9553/9580) ✅
- Ré-éditabilité Conserver/MàJ/Régénérer (live PX_*) ✅ · Bibliothèques non destructives (live R_studio.*) ✅
- `/restart` feedback + cockpit réaffiché ✅ (déployé)

### À EXÉCUTER en conditions réelles (avec Etoile / dépense) — checklist
Chaque item : **action → résultat attendu → critère « sait-on quoi faire ensuite ? »**
1. **PHOTO création complète** : Accueil→PHOTO→(source)→paramètres→Aperçu→Lancer Final HD 💲→Valider. *Attendu : 1 bloc, action évidente à chaque écran.* 💲
2. **VIDÉO par CHAQUE source** (×5 : image projet / image générée / galerie / upload / nouveau look) : entrer→source→script→…→Finaliser. *Attendu : symétrie, média actif juste.* (script 💲 / vidéo 💲)
3. **Retour arrière** à chaque étape (PHOTO et VIDÉO) : ⬅ ramène à l'étape précédente, slice conservé, aucun nouveau bloc.
4. **Édition** (PHOTO retouche / VIDÉO montage) : reste **dans le bloc** (à valider une fois F1 migré).
5. **Reprise projet existant** : RÉCENTS→Reprendre→rouvre à l'étape exacte avec contexte.
6. **Ré-éditabilité aval** : changer réf/look/prompt après image/vidéo → prompt Conserver/MàJ/Régénérer, libellés clairs.
7. **Durée vidéo** (30/45/60) → nb plans cohérent (après P6). 💲
8. **Planche** 1/2/3/4/6 → aperçu gratuit → images exploitables. 💲
9. **Finalisation** : récap complet exact (coût/crédits/mode) avant dépense.
10. **Prêt-à-poster** : vidéo + légendes courte/longue + hashtags + reprendre le style.
> Items 1,2,7,8 = **dépense** (à lancer sur accord d'Etoile). Le reste = gratuit/live.

---

_Audit livré. Aucune correction tant qu'Etoile n'a pas validé le PARCOURS CIBLE (§6). — 2026-06-10_

---

# ENRICHISSEMENT — verdict de fusion + à supprimer/déplacer + cible resserrée (2026-06-10)

> Critère central d'Etoile : **« Cette étape est-elle indispensable, ou fusionnable SANS perte de contrôle utilisateur ? »** Objectif assumé = **LE MOINS D'ÉCRANS POSSIBLE** (6 écrans évidents > 12 parfaits qui ralentissent). Beaucoup d'écrans existent par **accumulation historique**, pas par nécessité.
> Verdict par écran : **INDISPENSABLE** · **ABSORBABLE← (écran précédent)** · **ABSORBABLE→ (écran suivant)** · **CONTEXTUEL (pas une étape)**.

## PHOTO — verdict de fusion / à supprimer / à déplacer
| Écran | Objectif | Verdict fusion | À SUPPRIMER | À DÉPLACER |
|---|---|---|---|---|
| `photo.look` (Look) | régler l'apparence | **INDISPENSABLE** (= Paramètres) mais **éclater** : la *source* sort, le reste reste | jargon, redondances | sortir la **source** dans son écran (symétrie VIDÉO) |
| `photo.ref` (Référence) | voir/changer réf | **ABSORBABLE←** dans Paramètres (ligne « Référence » + picker inline) | écran dédié | → ligne de Paramètres |
| `photo.refgal` (Galerie réf) | choisir une réf | **ABSORBABLE←** (picker inline) | écran dédié | → picker dans Référence |
| `photo.lookgal` (Galerie look) | choisir un look | **ABSORBABLE←** (picker inline) ou = écran Source | écran dédié | → Source / picker |
| `photo.prompt` (Prompt) | éditer le prompt | **ABSORBABLE←** dans Paramètres (ligne « Prompt ») | écran dédié | → ligne de Paramètres |
| `photo.promptlib` (Biblio prompt) | réutiliser un prompt | **ABSORBABLE←** (sous-action du Prompt) ou Studio | écran dédié | → Studio (bibliothèque) |
| `photo.image` (Image) | aperçu + validation | **INDISPENSABLE** (= Aperçu/Validation) | coût en double | — |
| `photo.propagate` | impact d'une modif | **CONTEXTUEL** (popup à la demande, pas une étape) | — | — |

## VIDÉO — verdict de fusion / à supprimer / à déplacer
| Écran | Objectif | Verdict fusion | À SUPPRIMER | À DÉPLACER |
|---|---|---|---|---|
| `video.source` (Source) | choisir le média | **INDISPENSABLE** | — | — |
| `video.srcgal` (Galerie source) | choisir un look | **ABSORBABLE←** (picker inline dans Source) | écran dédié | → picker Source |
| `video.script` (Script) | définir le texte | **INDISPENSABLE** (= Paramètres vidéo) ; **fusionner la DURÉE ici** | — | durée + voix/style → ici |
| `video.scriptlib` (Biblio script) | réutiliser un script | **ABSORBABLE←** (sous-action) ou Studio | écran dédié | → Studio |
| `video.montage` (Montage) | régler le rendu | **ABSORBABLE→** dans Aperçu/Finalisation (optionnel, pas obligatoire) ; jargon à retirer ; à enrichir si gardé | « Archivo Black 52px » | réglages → Ajuster (inline) |
| `video.legende` (Légende) | texte de publication | **ABSORBABLE→** dans Finalisation (la légende fait partie du livrable) | écran dédié | → Finalisation / Prêt-à-poster |
| `video.export` (Finalisation) | lancer Final HD | **INDISPENSABLE** (mais doit devenir un **récap complet**) | — | absorber Légende |

## CIBLE RESSERRÉE §6bis — MINIMUM d'écrans, PHOTO ≡ VIDÉO
**L'aperçu média étant TOUJOURS visible (vignette permanente), « Aperçu » n'est PAS un écran — c'est l'état du bloc.** D'où une grammaire à **3 écrans principaux**, identique aux deux entrées :
```
① SOURCE  →  ② PARAMÈTRES (média visible + tous réglages + Ajuster inline)  →  ③ FINALISER (récap + Lancer Final HD)  →  Prêt-à-poster
```
| Temps | PHOTO | VIDÉO | Décision unique |
|---|---|---|---|
| ① SOURCE | Nouveau / Galerie / Upload | Image du projet / Galerie / Upload / Nouveau look | d'où on part |
| ② PARAMÈTRES (média visible) | référence · tenue · décor · prompt · nb/planche · format — **en lignes, pickers inline** | script · durée · voix · style · montage(Ajuster inline) | régler (+ aperçu permanent) |
| ③ FINALISER | récap (réf·look·décor·prompt·nb·format·coût·crédits·mode) → **Lancer Final HD** | récap (source·réf·script·durée·sous-titres·musique·format·coût·crédits·mode) + **légende** → **Lancer Final HD** | lancer la dépense |
- **Ré-éditabilité** : tout reste modifiable jusqu'à ③ (Conserver/MàJ/Régénérer, libellés contextuels).
- **Validation image** (PHOTO) : se fait dans ② (sélection de l'image gardée), pas un écran séparé.
- **Ajuster** (retouche image / montage vidéo) : sous-action **inline** de ②, jamais un nouveau bloc (F1).

### AVANT / APRÈS (resserré)
| | Avant | Après (cible resserrée) |
|---|---|---|
| PHOTO | 2 principaux + 6 sous-écrans | **3 écrans** (Source · Paramètres · Finaliser), pickers/réf/prompt **inline** |
| VIDÉO | 5 principaux + 2 sous-écrans | **3 écrans** symétriques (Source · Paramètres[script+durée] · Finaliser[+légende]) |
| Sous-écrans (ref/prompt/galeries/scriptlib/montage/légende) | écrans séparés | **absorbés** (lignes/inline) ou → Studio |
| Symétrie | divergente | **identique** (l'utilisateur apprend UN seul fonctionnement) |
**On retire comme étapes** : Référence, Galerie-réf, Galerie-look, Prompt, Biblio-prompt, Galerie-source, Biblio-script, Montage(obligatoire), Légende(séparée). **On garde le contrôle** via lignes/pickers inline dans Paramètres + Ajuster inline. **Net : ~7-9 écrans → 3.**

_Enrichissement audit. Cible resserrée à valider AVANT toute modification structurelle (cat.2)._

---

# APPROFONDISSEMENT — 6 POINTS À VÉRIFIER AVANT DE VALIDER LA CIBLE

> Analyse du comportement **réel** (code déployé `1fb4ca3`) + **cible** proposée. Aucune implémentation structurelle : à valider d'abord.

## POINT 1 — GESTION DU PROJET ACTIF (le plus critique)

### Réel aujourd'hui
- **Où vit le projet** : un objet unique `proj` en mémoire (slices `look` / `image` / `prompt` / `video`), miroir vers le moteur de génération (`newlook`). Identité stable = `genState.activeDraftId`.
- **Sauvegarde** : `autosaveDraft()` écrit `drafts/<persona>/<draftId>.json` à **chaque navigation** (entrée d'écran, /menu, Retour). Le draft capture look, images, prompt, vidéo (script/montage/légende), nb, fx. Les médias générés sont **stabilisés** dans `outputs/proj_media/<draftId>/<n>.jpg` (copie locale → survit à l'expiration des URLs temporaires).
- **Reprise** : `ensureProj()` recharge `proj` depuis le draft via `listDrafts()` si la mémoire est vide ; `resumeDraft(id)` (bouton « 📂 Reprendre un projet ») restaure l'état **et repositionne à l'écran exact** (`currentStepModule` → photo.look / photo.image / video.*).
- **Survie aux retours menu** : non destructif. Entrer dans **Studio / Historique / Looks** = vue média annexe (lecture) ; le retour `◀️ Retour` (`WS_RESUME`) renvoie **exactement à l'étape du projet en cours** (`currentStepModule`). Le projet n'est jamais réinitialisé implicitement (`ensureProj` ne reset pas).
- **Après /restart ou reboot pm2** : `genState.activeDraftId` est persistant ; le draft reste sur disque. Le projet **n'est PAS reconstruit au boot** — il est rechargé **paresseusement** à la 1ʳᵉ interaction (`ensureProj`). Le boot ne ré-affiche le cockpit que si `REOPEN_FLAG` est posé (cas `/restart` ou déploiement piloté), sinon boot **silencieux**.

### Écarts / risques
- **Pas de « reprise » proactive au boot** : après reboot, l'utilisateur revoit l'ACCUEIL, pas son projet en cours — il doit re-rentrer (ou « Reprendre »). Le contexte n'est pas *perdu* mais pas *re-présenté*.
- **Un seul projet actif à la fois** : ouvrir un nouveau projet bascule `activeDraftId` ; les anciens drafts coexistent mais ne sont listés que via « Reprendre ».

### Cible
- **Au boot/restart** : si un draft « en cours » existe, le cockpit propose en 1 ligne « ↩️ Reprendre *<nom projet>* · 🏠 Accueil » (reprise 1 tap, sans perte).
- **Indicateur permanent** dans l'en-tête (déjà en place : `📁 <nom>`), + état « brouillon / terminé ».
- **Règle invariante** : toute navigation = autosave ; aucune action ne détruit un projet sans confirmation explicite.

## POINT 2 — ÉDITION : TOUT DANS LE COCKPIT (état réel par action)

> Garantie visée : **aucune** action Éditer/Modifier/Montage/Script/Légende/Référence/Prompt ne crée un nouveau bloc.

| Action | Entrée | Reste dans le bloc ? | Détail vérifié |
|---|---|---|---|
| **Référence** | `photo.ref` (PR_*) | ✅ in-bloc | rendu routeur `editMessageMedia`, média unique |
| **Prompt** | `photo.prompt` (PP_*) | ✅ in-bloc | idem ; biblio prompts `photo.promptlib` in-bloc |
| **Script vidéo** | `video.script` (VP_*) | ✅ in-bloc | édition via saisie texte, re-render in-place |
| **Légende** | `video.legende` (VL_*) | ✅ in-bloc | idem |
| **Montage / Éditeur avancé via Image** | `PL_EDIT` | ✅ in-bloc | **bridge** `cockpit.mid = newlook.mediaId` avant `showEditHome()` |
| **Montage / Éditeur avancé via Montage** | `VM_EDIT` | ✅ in-bloc | **bridge** identique + `editReturn='video.montage'` (Retour = même bloc) |
| **Éditeur avancé via menu VIDÉO** | `EDIT_HOME` (bouton « 🎨 Éditer / Montage », `registry.js`) | ⚠️ **PEUT créer un 2ᵉ bloc** | **PAS de bridge** : `showEditHome()` rend dans `cockpit.mid` ; si ≠ `newlook.mediaId`, `editScreen`→`cockpitPhoto` retombe sur `send()` = nouveau message |
| **Sous-titres** | `EDIT_SUBS` (S_*) | ⚠️ écrit un fichier verrouillé | modifie `subtitle_style.js` (fichier sous verrou) ; rendu in-bloc mais effet global |
| **Filtres image** | `IMG_*` | ✅ in-bloc | `editScreen` sur `cockpit.mid` (bridgé si venu de PL_EDIT) |

### Cause racine (F1)
Il existe **DEUX identités de bloc** : `newlook.mediaId` (workspace routeur) et `cockpit.mid` (carte/éditeur legacy). Les chemins `PL_EDIT`/`VM_EDIT` les **réconcilient** ; le chemin `EDIT_HOME` (et tout point d'entrée éditeur non bridgé) **ne les réconcilie pas** → c'est là que F1 recrée encore un bloc.

### Cible
- **Une seule identité de bloc** (fusionner `cockpit.mid` et `newlook.mediaId`, ou bridge systématique à **chaque** entrée éditeur).
- **Édition = sous-état de l'écran courant**, jamais un module séparé : « Ajuster » s'ouvre *dans* Paramètres/Aperçu.
- Sous-titres/musique/zooms = pickers focalisés in-bloc (et ne pas écrire les fichiers verrouillés sans jeton).

## POINT 3 — PROJET TERMINÉ = DOSSIER PROJET

### Réel aujourd'hui — stockage **éparpillé**
| Élément | Emplacement |
|---|---|
| Métadonnées projet (draft) | `drafts/<persona>/<draftId>.json` |
| Médias stabilisés du projet | `outputs/proj_media/<draftId>/<n>.jpg` |
| Looks gardés | `looks/gen_<horodatage>_pN.jpg` |
| Images/vidéos générées | `outputs/generations/*.jpg` · `*.mp4` (à plat) |
| Tests locaux | `outputs/tests/test_*.mp4` |
| Export « prêt » | `outputs/ready_to_post/<nom>/` (mp4 + .txt + .style.json) |
| Sous-titres / filtres | `subtitle_style.js` · `style.json` (**globaux**, pas par projet) |

- **« Nouveau »** ne perd pas l'ancien : `clearActiveDraft()` (après génération finale ou `NL_CANCEL`) supprime **le draft**, mais les médias gardés (`nlSave`) restent dans `looks/` et `outputs/generations/`.
- **MAIS** : il n'existe **aucun dossier unique par projet** regroupant {vidéo finale, images, variantes, prompt, script, légende, paramètres, médias intermédiaires, RAW}. Les pièces sont dispersées sur 5–6 emplacements, reliées seulement par `draftId` (métadonnées) et l'horodatage (médias) — corrélation fragile.

### Cible
- **Un dossier par projet** : `projects/<persona>/<projectId>/` contenant `project.json` (réf·look·décor·prompt·nb·script·légende·params·coûts), `images/`, `variants/`, `video_final.mp4`, `raw/` (si dispo), `exports/`.
- À chaque génération : on **écrit dans le dossier du projet** (au lieu des dumps globaux), et l'Historique liste ces dossiers.
- « Nouveau » = nouveau dossier ; l'ancien reste complet et ré-ouvrable.

## POINT 4 — HISTORIQUE vs PRÊT-À-POSTER

### Réel aujourd'hui
- **Prêt-à-poster** = `outputs/ready_to_post/` : on y **copie** un export (`mp4` + `.txt` légende + `.style.json`). C'est un **dossier d'export**, pas une file de validation : rien ne « sort » quand on publie.
- **Historique** = `outputs/generations/` : **liste plate** de `.jpg`/`.mp4` triés par date (12 récents en vue). **Aucune** métadonnée par projet (prompt/script/params/exports/RAW absents), pas de regroupement, pas de permanence garantie (dump technique).

### Écart vs intention d'Etoile
- Aucune distinction « en attente de publication » vs « archive permanente ».
- Un contenu publié **reste** dans `ready_to_post` (pas de sortie) **et** n'a pas d'archive projet complète dans Historique.

### Cible
- **Prêt-à-poster** = file d'attente **uniquement** des contenus à publier/valider ; publier ⇒ le contenu **quitte** la file.
- **Historique** = archive **complète et permanente** de **tous** les projets (dossier projet du point 3), retrouvable des semaines après (vidéo, images, prompt, script, params, exports, RAW). Publier ne retire jamais de l'Historique.
- Invariant : *publié = retiré de Prêt-à-poster, conservé dans Historique*.

## POINT 5 — APERÇU GRATUIT → VALIDATION → FINAL HD

### Réel aujourd'hui
- **Aperçu gratuit** : `/apercu` (et `EDIT_PREVIEW`) → rend ~2 frames du look courant **avec le style appliqué** (zéro dépense). Rendu local gratuit aussi via `/test`.
- **Coût affiché AVANT génération** : oui, à la confirmation —
  - PHOTO (`photo.image`, `confirming=true`) : « ✨ Lancer Final HD ? Génération payante (~N cr) » (`photoImageCost` : crédits + ≈ €).
  - VIDÉO (`video.export`, `confirming=true`) : « Lancer la vidéo Final HD ? Génération payante (~N cr) · ⏳ <temps> » (`videoCost`/`estimateCost` : parts, mots, TTS, lipsync, crédits, €).
- **Confirmation obligatoire** (PL_GEN → confirm → lancement ; VX_GO).

### Manques
- Affichage **partiel** : crédits + € sont là, mais **pas un panneau pré-génération unifié** montrant clairement **durée · coût · crédits · nb images/plans · format · moteur** côte à côte.
- **Solde de crédits** non affiché. **Format** (9:16…) et **moteur** (Anthropic script + Kling lipsync) **implicites**. Décomposition TTS/lipsync non montrée. Temps estimé générique.

### Cible
- **Panneau « Avant de lancer »** unique et identique PHOTO/VIDÉO : `⏱ Durée · 🎞 Nb plans/images · 🖼 Format · ⚙️ Moteur · 💳 Coût (cr ≈ €) · 🔋 Crédits restants`, puis **Aperçu gratuit** → **Ajuster** → **Lancer Final HD**.

## POINT 6 — PARCOURS CIBLE SYMÉTRIQUE (verdict par écran)

### Symétrie réelle aujourd'hui (asymétrique)
- **PHOTO** : `photo.look` (hub : 👗 Tenue · 🌆 Décor · 🎯 Réf · ✍️ Prompt · 🖼 Galerie · 📤 Upload · 🔢 Nb) → `photo.image` (navigation + ✅ Valider + 🎨 Éditer + 🎬 Vidéo).
- **VIDÉO** : `video.source` → `video.script` → `video.montage` → `video.legende` → `video.export` (séquentiel, étapes atomiques, pas de hub).
- ⇒ Deux logiques différentes à apprendre. PHOTO concentre les décisions dans un hub ; VIDÉO les étale en 5 étapes.

### Cible symétrique : `SOURCE → PARAMÈTRES → APERÇU → AJUSTER → FINALISER`
| Écran | PHOTO | VIDÉO | Verdict |
|---|---|---|---|
| **① SOURCE** | d'où vient l'image (nouveau look / galerie / upload) | d'où vient la vidéo (look projet / image générée / galerie / upload) | **INDISPENSABLE** (1 décision : l'origine) |
| **② PARAMÈTRES** | réf · tenue · décor · prompt · nb — **en lignes** | script · durée · sous-titres · musique — **en lignes** | **INDISPENSABLE** (voir arbitrage ci-dessous) |
| **③ APERÇU** | 2 frames gratuites + panneau coût/crédits/format/moteur | 1 extrait gratuit + même panneau | **INDISPENSABLE** (moment « je vois avant de payer ») |
| **④ AJUSTER** | retouche image / sélection / nb (inline) | montage / sous-titres / musique (inline) | **FUSIONNABLE** dans ③ (sous-action de l'aperçu) — *à arbitrer* |
| **⑤ FINALISER** | récap + **Lancer Final HD** | récap + **légende** + **Lancer Final HD** | **INDISPENSABLE** (1 décision : dépenser) |
| Réf / Galeries / Biblio prompt / Biblio script / Montage / Légende séparés | — | — | **SUPPRIMABLES** comme écrans : absorbés en lignes/pickers de ②, ou déplacés dans Studio |

### ARBITRAGE CRITIQUE : « moins d'écrans » VS « une étape = une décision »
La crainte = un écran **Paramètres surchargé** mélangeant réf/tenue/décor/prompt/nb. Réponse de conception :

- **Paramètres = une LISTE de lignes**, pas un formulaire éclaté. Chaque ligne montre l'**état courant** et **ouvre un picker focalisé in-bloc** (une décision à la fois) :
  ```
  ② PARAMÈTRES (PHOTO)
  🎯 Référence : Imany ▸           (tap → picker réf in-bloc, puis retour à la liste)
  👗 Tenue : robe noire ▸
  🌆 Décor : studio ▸
  ✍️ Prompt : défaut ▸
  🔢 Images : 1 ▸
  ────────
  👁 Aperçu gratuit   ✨ Finaliser
  ```
  ⇒ L'écran **ne montre jamais 5 décisions ouvertes** : il montre 5 **résumés** d'1 ligne ; on n'ouvre qu'**un** picker à la fois (« une décision principale active à la fois »), in-bloc, sans sous-menu complexe ni nouveau message.

- **Garder APERÇU (③) et AJUSTER (④) DISTINCTS** plutôt que tout comprimer : « voir » et « retoucher » sont deux intentions différentes ; les fusionner surcharge. Recommandation : **③ Aperçu** reste un moment propre (voir + coût) ; **④ Ajuster** n'apparaît **que si** l'utilisateur le demande (« 🎨 Ajuster » depuis l'aperçu), en sous-état inline — pas un écran permanent.

- **Bilan écrans** : **socle = 3 écrans obligatoires** (SOURCE · PARAMÈTRES · FINALISER) + **APERÇU** comme 3ᵉ moment fort recommandé (donc **3 à 4 écrans**), **AJUSTER** = sous-état inline (0 écran permanent). Symétrie stricte PHOTO ≡ VIDÉO. **Objectif tenu : minimum d'écrans SANS cacher de fonction ni empiler les décisions.**

### Recommandation de validation
Valider : (a) **3 écrans + Aperçu** (vs 3 stricts) ; (b) le modèle **Paramètres = lignes + picker focalisé in-bloc** ; (c) **Aperçu et Ajuster distincts**. Une fois ces 3 arbitrages tranchés, la CAT.2 pourra être spécifiée écran par écran.

---

_Approfondissement des 6 points — comportement réel (code `1fb4ca3`) + cible. À valider AVANT toute implémentation structurelle (cat.2)._

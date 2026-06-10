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

# SCOPE — Restructuration PHOTO en 2 étapes + SOURCE ACTIVE UNIQUE (investigation, AUCUN code, go requis)

## 1. Parcours PHOTO actuel (cartographie réelle)
- Entrée `R0_PHOTO` → **`photoView` = « 📸 PHOTO · Choisir »** (écran de SÉLECTION) :
  - si photo : `[✅ Utiliser (R0_PH_USE) · ✏️ Modifier (R0_PH_GAL)]`
  - `[✨ Générer (R0_PH_GEN) · 📥 Importer (R0_PH_IMPORT)]` · `[🕘 Historique · ◀ Retour]`
- `R0_PH_USE` → `photo_prompt` · `R0_PH_GEN` → `photo_prompt` · `R0_PH_GAL` → `gallery` (sélection).
- **`photo_prompt` = « 📸 PHOTO · Préparer »** (PARAMÈTRES) : Prompt · Tenue · Décor · Référence · 🎛 Influences (LOT A) · 👁 Aperçu · 🎬 Faire une vidéo.
- **Constat** : sélection d'image et paramètres sont DÉJÀ sur 2 écrans distincts (`photo` vs `photo_prompt`). MAIS : `Utiliser` ET `Générer` mènent tous deux à Préparer (redondant), et il n'y a pas de charnière explicite « Valider la photo » qui ÉPINGLE la source.

## 2. Plan À IMPACT MINIMAL (recommandé) — réutilise les 2 écrans existants, ajoute 1 charnière
**ÉTAPE 1 = `photoView` (Choisir/figer)** — relabel #6 + charnière, **aucun nouvel écran** :
- `✅ Utiliser` → **✅ Valider la photo** (`R0_PH_USE`, cb inchangé) = **épingle** (`r0PinSource`) + → Préparer. ← la CHARNIÈRE.
- `✏️ Modifier` → **🔄 Changer** (`R0_PH_GAL`) = choisir/remplacer (galerie ; générer/importer accessibles).
- `✨ Générer` → **🛠 Modifier** (`R0_PHB_edition` → toolbox #7) = ouvre la BOÎTE À OUTILS, **PAS** générer.
- + **🟢 Garder** (nouveau, léger) = conserve cette image (`etat garde`) sans quitter (« je garde celle-ci »).
**ÉTAPE 2 = `photo_prompt` (Préparer)** — INCHANGÉ sauf : on y arrive UNIQUEMENT via « ✅ Valider la photo » ; contient déjà Prompt/Tenue/Décor/Référence/🎛 Influences/Aperçu/Générer. (Influences UI = ICI, conforme.)

**⚠️ Génération NON perdue (vérifié)** : la génération d'une photo vit en ÉTAPE 2 (Préparer→Aperçu→Générer), atteinte par « ✅ Valider la photo » ; et une AUTRE photo (générer/importer/galerie) via « 🔄 Changer ». Le bouton « ✨ Générer » de l'écran Choisir devient « 🛠 Modifier » MAIS la génération reste atteignable par ces 2 chemins → **rien perdu**. (À confirmer dans la preuve : depuis Choisir, je peux toujours générer une nouvelle photo.)

**Impact chiffré** : **2 vues** touchées (`photoView` relabel+charnière ; `photo_prompt` quasi inchangé) + **1 handler** (`R0_PH_USE` : ajouter `r0PinSource`) + **1 bloc neuf** (toolbox #7, déjà prévu LOT B) + tests. **0 refonte, 0 nouvel écran plein.**

**🟡 Option plus lourde (NON recommandée)** : créer un écran « Valider » dédié distinct de `photoView` → +1 écran, +navigation, contre « aucun écran inutile ». À éviter.

**Ambiguïté à trancher (Etoile)** : 🟢 **Garder** vs ✅ **Valider** — proposition : Garder = marque l'image gardée (reste sur Choisir, pour comparer) ; Valider = épingle + avance. Si Etoile veut UN seul bouton « garder+continuer », fusionner Garder dans Valider (encore plus léger). À confirmer.

## 3. RÈGLE FONDAMENTALE — « PHOTO VALIDÉE = SOURCE ACTIVE UNIQUE » (invariant à renforcer + prouver)
Briques déjà là : `r0PinSource` · `r0SourceFile` · garde-fou `_r0IsRef` · `r0RealSource`.
Renforcements (impact minimal) :
- **✅ Valider la photo** → `r0PinSource(image choisie)` (AJOUT au handler `R0_PH_USE`).
- **Après génération** → la photo générée devient la source : `r0RealPhoto` appelle DÉJÀ `r0PinSource(localPath)` (vérifié l.~3281) → OK, à re-prouver.
- **Reprise partout** : `r0SourceFile` lu sur Photo/Vidéo/Aperçus/Validation/Génération/Résultats/Fichiers + `/v4r`·`/restart` (déjà) → jamais d'ancienne/générique (`_r0IsRef` + `r0RealSource`).
- Cas Etoile : 🎬 Faire une vidéo depuis la photo générée → CETTE photo ; quitter→rouvrir Vidéo → déjà sélectionnée ; revenir plus tard → toujours active.

## 4. TEST HASH ULTIME (assertion runtime dédiée « source active invariante »)
Séquence : générer photo → ✅ Valider → 🎬 Faire une vidéo → quitter → `/restart` → rouvrir menu Vidéo → reprise projet.
Assertion : `sha1(r0SourceFile)` **IDENTIQUE à chaque étape**, jamais de bascule (ni ancienne, ni `_r0IsRef`, ni démo/défaut). (En dry, le fichier source est réel — hash stable mesurable.)

## 5. Compatibilité 6 priorités cohérence
1. **bloc unique** : Choisir(média) ↔ Préparer(média) = édition en place, 0 recréation (cohérent FIX-1). ✅
2. **source partout** : renforcée par l'invariant + test hash. ✅
3. **aperçu = résultat final** : inchangé (r0SubOpts partagé, déjà prouvé). ✅
4. **même bouton = même comportement** : relabel garde l'intention ; 3 divergences (Publier/Vidéo/Prompt) traitées en AJOUT 3. ✅
5. **aucune perte contexte** : Valider épingle, draft persistant. ✅
6. **aucun écran inutile** : 0 nouvel écran plein (réutilise les 2 + 1 bloc toolbox). ✅

## 6. PHOTO · RÉSULTAT (bloc unique conservé) — à vérifier dans le lot
`photoResultView` doit rester la référence projet : photo visible · infos · fichiers · historique · légendes si dispo · actions (🎬 créer vidéo · 🛠 modifier la photo · 🔁 variante · 🗂 fichiers · revenir). À auditer/compléter dans le lot (impact texte/markup).

## Recommandation
Faire le plan **§2 (impact minimal : 2 vues + 1 handler + bloc toolbox)** couplé #6/#7 + charnière Valider + invariant source §3 + test hash §4. Trancher l'ambiguïté Garder/Valider. **Go-avant-code requis.**

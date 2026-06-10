# Réponses aux 9 questions produit (cockpit-v4) — statut + reco

> Évaluées contre le design cockpit-v4 + le manifest projet. **✅ prévu/couvert · 🟡 à concevoir (où/comment) · 🔴 conflit/décision à trancher (E120)**. Les 🔴 ne sont pas tranchés ici.

## Q1 — Décor figé / look variable (et inverse) — ✅ prévu (modèle des lignes indépendantes)
Le manifest sépare `look.tenue`, `look.decor`, `prompt`, `nb`, et **`parametres.image_fx` / `parametres.crop` par projet**. Chaque ligne de PARAMÈTRES est indépendante (design C.9) + ré-éditabilité E114/E115. Donc :
- **Même décor + même cadrage + params, changer le look** = modifier `look.tenue`, **laisser** `look.decor` + `crop` + `image_fx`, puis régénérer (E115 : l'aval est préservé/Conserver-MàJ-Régénérer). Le crop/params étant **au niveau projet**, ils s'appliquent à la nouvelle image. ✅
- **Inverse** (même look + nouveau décor) : symétrique. ✅
- 🟡 **Ergonomie** : ajouter des **verrous explicites** « 🔒 Décor » / « 🔒 Cadrage » (E21/E26) pour signifier « régénère en gardant ça » — confort, pas une nouvelle capacité. *(à concevoir dans Lot 2/4)*

## Q2 — Modifier une image existante (changer le prompt, générer une variante, source conservée) — 🟡 à concevoir
Le manifest garde déjà `image_candidates` + `variantes` + `rejetees` (E123, trace). La validation d'image explicite existe (Garder/Variante/Rejeter/Livrable). Ce qui manque : une action **« 🔁 Varier cette image »** depuis une image existante = **image-to-image** (régénérer en partant de CETTE image + nouveau prompt) → nouvelle candidate ; **l'image source est conservée** en `variantes`.
- **Où** : revue de candidat (étape SOURCE) + Historique. **Comment** : `CAND_VARY` → ouvre le picker prompt → régénère via backend en **img2img** (source = l'image choisie) → nouvelle candidate ; source poussée en `variantes`. Backend = `generateLook` avec image d'init (à brancher Lot 1). *(direction confirmée, à construire)*

## Q3 — Sous-titres récurrents (style défaut + override ponctuel) SANS toucher le fichier verrouillé — 🔴 décision à trancher
`subtitle_style.js` est **VERROUILLÉ** (fidélité). Le style par défaut **et** l'override ponctuel doivent vivre **hors** de ce fichier : dans une **config persona** (défaut) + **override projet** (manifest), **appliqués au rendu par branchement**, jamais en éditant le fichier verrouillé.
- 🔴 **Conflit à arbitrer** : `render_local` lit aujourd'hui `subtitle_style.js` (`loadStyle`) — zone verrouillée (« sous-titres render_local »). Pour appliquer un override **sans** modifier le verrou, il faut **un point d'injection sanctionné** : soit `render_local` accepte un **paramètre d'override sous-titres** (= modifier la zone sous-titres de render_local → touche le verrou ?), soit un **wrapper non-verrouillé** applique l'override avant d'appeler render. **Quelle voie autorises-tu ?** *(je recommande : config `subs_style` dans persona + manifest.parametres.subs_override ; injection via un hook sanctionné — à valider par toi, car ça frôle le verrou).* **Je ne code rien là-dessus avant ton arbitrage.**

## Q4 — Historique complet des éditions (versions, restauration, jamais perdre une version validée) — 🟡 à concevoir (extension du manifest)
Aujourd'hui `historique_versions` est un **journal** d'actions (ts/étape/action/ref), + `raws` jamais écrasés (E93.5) + `variantes`. Il manque des **snapshots restaurables**.
- **Où/comment** : ajouter `manifest.versions[]` = snapshots **restaurables** `{ id, ts, label (ex. « Image A », « A éditée », « V2 »), media_ref, params_snapshot (image_fx/crop/prompt/look), livrable? }`. Un snapshot est créé à **chaque validation importante** (génération gardée, édition validée, vidéo finalisée). **`restore(versionId)`** réactive un snapshot (media_actif + params) **sans** supprimer les autres (versions validées **jamais perdues**). Les fichiers médias vivent déjà dans le dossier (E93.5, non écrasés). *(direction confirmée, à construire — Lot 4+)*

## Q5 — Crop/zoom comme préréglage réutilisable + verrouillage, SANS casser l'étanchéité E124 — 🟡 à concevoir (préréglages explicites)
Réconciliation avec E124 (per-projet, zéro fuite) : les réglages restent **par projet par défaut** ; un **préréglage NOMMÉ** (niveau **persona**, biblio « Préréglages ») peut être **appliqué EXPLICITEMENT** à un projet = **copie** dans le projet (jamais héritage auto, conforme E102/E124).
- **Où** : biblio persona « Préréglages crop/zoom/image » ; action **« appliquer le préréglage »** (explicite) dans l'éditeur. **Verrouillage** = marquer un préréglage « par défaut proposé » (proposé, pas auto-appliqué). *(direction confirmée ; ne casse pas E124 car application = explicite)*

## Q6 — Édition simplifiée (UNE décision par écran) — ✅ principe / 🟡 affiner l'éditeur image
Le principe est dans le design (C.9 : **Paramètres = lignes, 1 picker focalisé à la fois**). L'éditeur image actuel (`viewImgEdit`) est une **boîte compacte** (lumière/contraste/saturation/temp/crop sur un écran).
- 🟡 **À affiner** : passer l'éditeur en **sous-pickers focalisés** (une dimension à la fois) pour coller strictement à « une décision principale par écran ». *(ajustement Lot 4)*

## Q7 — Durée / nb plans / nb images + panneau coût avant dépense — ✅ couvert (Lot 8), complété par Q9
Le panneau coût (Lot 8) affiche **⏱ durée · 🎞 nb plans · 🖼 format · ⚙️ moteur · 💳 crédits ≈ €** **avant** toute dépense (E10/E11). La règle **durée→plans** = `planParts` (≈ 1 plan / 30 s). Le **nb d'images utilisées** est le **set d'images retenues** (lien détaillé en Q9). ✅ pour la compréhension + l'affichage ; la liaison fine images→plans est l'objet de Q9.

## Q8 — Aperçu vs montage : jusqu'où ? — 🟡 design à confirmer (maquette gratuite locale)
- **Aperçu image** = déjà permanent et **gratuit** (média visible partout).
- **Aperçu montage** = **faisable GRATUITEMENT en local** via `render_local` (ffmpeg, €0, comme `/test`) **MAIS** un vrai montage avec voix/lipsync exige Kling (payant). Donc cible : une **MAQUETTE de montage gratuite** (image(s) + sous-titres + zoom + musique, **sans la voix/lipsync payante**) **avant** la dépense Kling (E13 « maquette avant Kling »).
- 🟡 **À confirmer** : richesse de la maquette (statique vs image animée + sous-titres + musique). *(je recommande : maquette = image(s) retenue(s) + sous-titres + zoom + musique, locale gratuite ; lipsync seulement au Final HD)*

## Q9 — Planche → vidéo (images retenues → plans → durée → script) — 🔴/🟡 comportement cible à valider
**Exigence** : si planche de N images, les **N images retenues** deviennent les **plans de la vidéo** ; la **durée s'adapte** au nb de plans ; le **script reste cohérent** avec le nb de plans retenus. **Interdit** : générer N images puis repartir sur d'AUTRES images pour la vidéo.
- **Cible précise** : `video.source` = **l'ensemble des images RETENUES** (livrables/gardées), **pas une seule**. Chaque image retenue = **1 plan** (1 lipsync) ; la vidéo = **concaténation** des N plans (réutilise le multi-part de `workflow.js`, qui fait déjà 1 part = 1 image). **Durée** = f(N plans). **Script** = découpé en **N segments** (1 par plan), généré en sachant N. ⇒ aucune nouvelle image générée pour la vidéo : on **réutilise** les images retenues.
- 🟡 **À construire** : la phase VIDÉO doit accepter **un set d'images** (pas un seul media_actif) → `video.plans = [rel,…]` (les retenues) ; script conditionné sur N ; durée dérivée de N.
- 🔴 **Décision** : si l'utilisateur veut **23 s** mais retient **3 plans**, on **(a)** répartit 23 s sur 3 plans (durée demandée prioritaire), ou **(b)** la durée = N × durée-de-plan (nb de plans prioritaire) ? **Ton choix ?** *(je recommande (a) : durée demandée répartie sur les plans retenus.)*

---

## Synthèse statuts
| Q | Sujet | Statut |
|---|---|---|
| 1 | Décor figé / look variable | ✅ (+🟡 verrous confort) |
| 2 | Modifier image existante (variante) | 🟡 à construire (img2img, source conservée) |
| 3 | Sous-titres récurrents vs fichier verrouillé | **🔴 arbitrage** (point d'injection override) |
| 4 | Historique des versions + restauration | 🟡 à construire (`versions[]` restaurables) |
| 5 | Crop/zoom préréglage réutilisable | 🟡 à construire (préréglages persona, application explicite) |
| 6 | Édition simplifiée 1 décision/écran | ✅ principe (+🟡 affiner éditeur) |
| 7 | Durée/plans/images + panneau coût | ✅ (Lot 8) |
| 8 | Aperçu montage | 🟡 maquette gratuite locale (à confirmer richesse) |
| 9 | Planche → vidéo (retenues→plans→durée→script) | 🟡 à construire + **🔴 règle durée vs nb plans** |

## 🔴 À TRANCHER par Etoile (avant d'implémenter ces points)
- **Q3** : voie d'injection de l'override sous-titres **sans toucher** le fichier verrouillé (config persona+projet via hook sanctionné ?).
- **Q9** : durée **(a)** demandée répartie sur N plans **vs (b)** N × durée-de-plan.
- **Q8** (mineur) : richesse de la maquette de montage.

_Les ✅ sont actés dans le design. Les 🟡 sont planifiés (lots à venir). Les 🔴 attendent ton arbitrage — rien codé dessus avant. Live 7e24dac intact, aucune dépense, fichiers verrouillés intacts._

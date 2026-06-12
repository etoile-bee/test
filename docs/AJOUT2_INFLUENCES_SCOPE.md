# AJOUT 2 — CONTRÔLE DES COUCHES D'INFLUENCE (scope, AUCUN code — go requis)

## Comment la génération utilise AUJOURD'HUI les couches (investigation code)
Chemin réel : `r0RealPhoto` → `PO.buildPhotoOpts(draft, lookbook, outfits)` → `nlMod().generateLook(opts)`.
| Couche | Champ draft | Aujourd'hui | Héritage |
|---|---|---|---|
| **Prompt** | `draft.photo.prompt` | → `opts.basePrompt` | implicite si défini |
| **Tenue (look)** | `draft.photo.look` | → `opts.extra`/`opts.category` (tenue du catalogue) | **IMPLICITE** : toujours passée si `look` non vide |
| **Décor** | `draft.photo.decor` | → `opts.env` (clé environnement lookbook) | **IMPLICITE** : toujours passé si `decor` non vide |
| **Source photo** | source épinglée (`r0SourceFile`) | → `opts.refOverride` (image de base) | **IMPLICITE** : toujours utilisée |
| **Références** | `draft.photo.refs` | **non mappé** (ignoré) ; le VISAGE = SoulID persona `imany-v2` (références/imany), **toujours actif** | identité figée |

→ **Problème confirmé** : tenue/décor/source sont **hérités implicitement** du draft (dernière valeur posée) ; AUCUN moyen aujourd'hui de dire « cette génération : ignore la tenue / base propre ». D'où des générations incohérentes.

⚠️ **Ambiguïté à lever avec Etoile** : « Utiliser les références » = (a) les **images de référence visuelles** (`draft.refs`, actuellement ignorées) OU (b) le **VISAGE persona (SoulID)** ? Le SoulID est l'IDENTITÉ (même visage) — le désactiver changerait le visage (sans doute NON voulu). Hypothèse : la bascule « références » = (a) refs visuelles, pas le visage. À confirmer.

## Design proposé (le plus propre)
**État** : 6 flags persistés dans `draft.photo` (et lus aussi pour la vidéo via la source) :
- `use_source` · `use_look` · `use_decor` · `use_refs` (défaut **true** = comportement actuel, zéro régression)
- `lock_look` · `lock_decor` (défaut **false**)

**Application (gating)** — un seul point, `buildPhotoOpts` + `r0RealPhoto` :
- `use_look=false` → ne PAS passer `look` (pas d'`extra`/`category`) → tenue sans influence.
- `use_decor=false` → ne PAS passer `env`.
- `use_source=false` → ne PAS passer `refOverride` → génération « base propre » (persona seul, sans hériter de l'image précédente).
- `use_refs=false` → ne PAS passer les refs visuelles.
- **Verrou** : `lock_look`/`lock_decor=true` → la valeur (et `use_*`) **persiste sur les générations/projets suivants** jusqu'à changement (via les DÉFAUTS persona `DEF.setField`, mécanisme #18 déjà en place).

**UI (où)** : un bloc **🎛 Influences** atteignable depuis **Préparer** (avant l'Aperçu), 6 bascules (☑/☐ + 🔒). Résumé d'une ligne repris sur l'**Aperçu** (« 🎛 Influences : tenue ✓ · décor ✗ · source ✓ · réf ✓ · 🔒tenue »). Respecte la grammaire (Retour/Accueil/Stop via wrapper), pas de refonte d'écran.

**Cas couverts** : variantes même tenue+décor (tout ✓) · tenue seule (décor ✗, source ✗) · décor seul · source seule (look ✗, décor ✗) · base propre (tout ✗ sauf persona) · série verrouillée (🔒).

## Estimation
- Flags draft + gating buildPhotoOpts/r0RealPhoto : **S-M**.
- Bloc UI 6 bascules + résumé Aperçu : **M**.
- Persistance verrou (réutiliser `DEF` #18) : **S**.
- Vidéo : la vidéo part de la source photo → `use_source` s'applique ; look/décor concernent surtout la PHOTO (la vidéo réutilise l'image générée). À cadrer.
- **Total : M** (1 lot focalisé), risque faible (défauts = comportement actuel, donc zéro régression tant qu'Etoile ne touche rien). Testable offline (assertions : flag OFF → champ absent des opts moteur, via `PO.buildPhotoOpts`).

## Recommandation
Design ci-dessus = propre, additif, sans régression. **Lever l'ambiguïté « références »** avec Etoile, valider l'emplacement (bloc Influences sur Préparer + résumé Aperçu), puis je construis en 1 lot offline avec preuve (dump opts moteur : flag OFF ⇒ couche absente). **Ne pas coder avant ton go.**

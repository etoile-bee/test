# CARTOGRAPHIE DES OUTILS — quel moteur, gratuit/payant, simulé/réel (état exact)

> **EN-TÊTE DE GOUVERNANCE (E131)**
> - **Statut** : **B — Constat** (lecture seule du code réel ; **aucun code**, **aucune dépense**).
> - **Acquis-source(s)** : code legacy (`telegram_bot.js`, `newlook.js`, `workflow_base0458.js`, `render_local.js`),
>   cockpit-v4 (`ui/cockpit_cost.js`, `ui/cockpit_controller.js`, `ui/project_store.js`), `lookbook.json` (pricing).
> - **Modifie un élément verrouillé** : **NON.**
>
> **Objet** : pour CHAQUE action du cockpit, dire **exactement** : moteur réel · gratuit/payant · aperçu/final ·
> simulé/réel · état (branché / partiel / mock). Noms vérifiés dans le code (pas de supposition).

---

## ⚠️ FAIT DÉCISIF — « éco » N'EST PAS gratuit

`lookbook.json` (relevés Etoile 08/06) **mesure** : **1 photo éco = 0,48 crédit**, **1 photo HD = 0,48 crédit**
(identique à l'unité ; HD = batch ×4 = 7,36 cr). `ui/cockpit_cost.js:estimateImage` renvoie **`gratuit: false`**.
**→ Conclusion : il n'existe AUCUN tier de génération photo réellement gratuit.** Conformément à la règle d'Etoile
(« s'il consomme quand même des crédits, NE l'assume PAS gratuit → garde-le gaté comme payant »), **toute génération
photo (éco ou HD) doit être traitée comme PAYANTE et gatée** (Aperçu→Récap→Coût→Validation).

**Réellement gratuit** (local, aucune API) : sous-titres (ffmpeg+libass), édition image (color/crop local),
édition vidéo (ffmpeg), aperçu (récap sans appel), publication (métadonnée — aucun envoi réel).

---

## TABLEAU DE CORRESPONDANCE COMPLET

| Action | Outil / Moteur (réel) | Fournisseur | Gratuit / Payant | Aperçu / Final | Simulé / Réel | État | Source (fichier:ligne) |
|---|---|---|---|---|---|---|---|
| **Générer photo (éco)** | **Seedream v4** (`/v1/text2image/seedream`) | **Higgsfield** | **PAYANT — 0,48 cr (~0,03 €)** | Final | **Réel** (legacy) ; **SIMULÉ** en /v4r | legacy **branché** ; /v4r **mock** | `newlook.js:138-149` · `ui/cockpit_cost.js:14-21` · `lookbook.json` ops.eco |
| **Aperçu photo (👁)** | Récap paramètres (pas de génération) | — (local) | **Gratuit** | Aperçu | Réel (affichage) | branché (cockpit) / à généraliser /v4r | `ui/cockpit_cost.js:panel` · `ui/cockpit_controller.js:confirmView` |
| **Photo HD** | **Seedream v4** batch ×4 | **Higgsfield** | **PAYANT — 7,36 cr (~0,43 €)** | Final | Réel (legacy) ; SIMULÉ /v4r | legacy **branché** ; /v4r **mock** | `newlook.js:144` · `lookbook.json` ops.hd |
| **Nouveau Look** | **Seedream v4** `recreatePose` (`input_images`) | **Higgsfield** | **PAYANT — 0,48 cr/pose** | Final | Réel (legacy) ; **cassé/à rebrancher** /v4r | legacy branché ; /v4r **mock** | `newlook.js:224-248` · `lookbook.json` ops.recreate |
| **Générer vidéo (lipsync)** | **Kling** (`/v1/speak/kling`) | **Higgsfield** | **PAYANT — 13 cr/30s (~0,75 €)** | Final | Réel (legacy) ; SIMULÉ (mp4 local) /v4r | legacy **branché** ; /v4r **mock local** | `workflow_base0458.js:121-151` · `telegram_bot.js:953-958` · `lookbook.json` ops.video30s |
| **Voix (TTS)** | **`eleven_multilingual_v2`** (`/v1/text-to-speech/{id}/with-timestamps`) | **ElevenLabs** | **PAYANT — ~0,20 €/1000 car.** | Final | Réel (legacy) ; absent /v4r | legacy **branché** ; /v4r **mock** | `workflow_base0458.js:61-108` · `ui/cockpit_cost.js:6` |
| **Scripts** | **`claude-sonnet-4-6`** (`/v1/messages`) | **Anthropic** | **PAYANT** (usage API) | Final | Réel (legacy) ; absent /v4r | legacy **branché** ; /v4r **mock** | `workflow_base0458.js:45-57` · `telegram_bot.js:1676,1761` |
| **Légendes (courte/longue/hashtags)** | **`claude-sonnet-4-6`** (sortie du script) | **Anthropic** | **PAYANT** (usage API) | Final | Réel (legacy) ; saisie manuelle /v4r | legacy **branché** ; /v4r **mock (saisie)** | `workflow_base0458.js:52` · `telegram_bot.js:629,685` |
| **Sous-titres** | **ffmpeg + libass** (`.ass` burn-in, timings ElevenLabs) | **LOCAL** | **GRATUIT** | Final | **Réel local** | **branché (local)** ; à exposer /v4r | `render_local.js:48-65,237-280` · `subtitle_style.js` |
| **Publication** | **Métadonnée** `statut_publication='publie'` | **LOCAL** (aucun connecteur) | **Gratuit (aucun envoi)** | — | **Simulé (aucune API plateforme)** | **mock** (pas de TikTok/IG/YT) | `ui/cockpit_controller.js:214-215` · `ui/project_store.js:180-181` |
| **Édition image** | Paramètres `image_fx` (brightness/contrast/saturation/temp) + crop → ffmpeg EQ | **LOCAL** | **GRATUIT** | Final | Réel local | **branché (local)** ; à exposer /v4r | `ui/cockpit_controller.js:271-277` · `render_local.js:91-104` · `ui/project_store.js:165-167` |
| **Édition vidéo** | **ffmpeg** (zoom keyframes, réactions, mixage, color, burn-in) | **LOCAL** | **GRATUIT** | Final | Réel local | **branché (local)** ; à regrouper /v4r | `render_local.js:156-173,282-433` |

> *Note moteur image* : un endpoint **`/v1/text2image/nano`** existe aussi (`newlook.js:193`) — variante Higgsfield
> « nano » (à confirmer comme alternative moins chère ; non retenue par défaut). À ne pas activer sans mesure de coût.

---

## FLUX DE GATING DÉJÀ PRÉSENT (à réutiliser, à généraliser dans /v4r)

cockpit-v4 possède **déjà** le flux **Aperçu → Récap → Coût → Validation** :
- `ui/cockpit_cost.js` — `estimate(kind, params, lookbook)` → `{credits, eur, moteur, gratuit:false}` ;
  `panel(est, creditsRestants)` → `⏱ durée · 🎞 nb · 🖼 format · ⚙️ moteur · 💳 coût (cr ≈ €) · 🔋 crédits`.
- `ui/cockpit_controller.js` — `confirmView()` affiche le panneau **avant** toute dépense ;
  l'action **`GEN_CONFIRM`** (clic explicite `💲 Lancer`) est la **seule** porte qui déclenche la génération réelle ;
  `GEN_CANCEL` (`✖️ Annuler`) annule. **Aucune dépense silencieuse.**
- C'est ce flux qu'il faut **brancher dans /v4r** avant chaque `✨ Générer` / `🎬 Générer vidéo`.

---

## CLÉS API CONFIGURÉES (noms seulement — aucune valeur lue)

`ANTHROPIC_API_KEY` · `HIGGSFIELD_KEY_ID` + `HIGGSFIELD_KEY_SECRET` · `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`
· `SHOTSTACK_API_KEY` (fallback vidéo, **non** utilisé dans le chemin principal — rendu = ffmpeg local).

---

## SYNTHÈSE « gratuit vs payant » (pour le gating /v4r)

- **PAYANT (gate obligatoire Aperçu→Récap→Coût→Validation + GO d'Etoile)** : photo éco, photo HD, Nouveau Look,
  vidéo/lipsync, voix, scripts, légendes (les 4 derniers via API).
- **GRATUIT (local, exécutable sans GO)** : sous-titres, édition image, édition vidéo, aperçu (récap), publication
  (métadonnée — mais **publication réelle** = à garder gatée derrière GO si un connecteur est ajouté un jour).
- **MOCK aujourd'hui dans /v4r** : toute génération (photo/vidéo) est **simulée** (image-look + mp4 ffmpeg local) ;
  scripts/voix/légendes **absents** ; publication **métadonnée**. → Livrables 2/3 : stabiliser + brancher le réel **gaté**.

---

*Fin — constat exact. Décision : en /v4r, traiter TOUTE génération comme payante et gatée (l'« éco » n'est pas gratuit).*

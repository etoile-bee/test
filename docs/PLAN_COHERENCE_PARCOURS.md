# PLAN CONSOLIDÉ « COHÉRENCE PARCOURS » (impact minimal — investigation, AUCUN code, go-avant-code)

> Intègre : restructuration photo 2-étapes · source active visible · retrait Référence · vocabulaire unifié · écran final photo harmonisé · retrait « test n°X/10 » · clarif VIDÉO Choisir/Préparer · Accueil. Chaque item : vues touchées · risque · option la plus légère. Aucune refonte. Compat 6 priorités + invariant source active + test hash.

## Sous-lots proposés (du plus sûr au plus sensible)

### LOT 1 — Cohérence TEXTE/CAPTIONS (risque FAIBLE, label/markup seulement)
| # | Item | Vues touchées | Option la plus légère | Risque |
|---|---|---|---|---|
| 1 | **📸 Source active visible** (A3) | 1 helper `srcLine` + ~9 captions + `ctx.srcName` | helper partagé injecté ligne unique ; X = `r0SourceFile` | faible |
| 2 | **Écran final PHOTO harmonisé** (#11) | `photoResultView` (1) | réutiliser le helper `finalCaption` (déjà créé pour vidéo) | faible (détails via boutons) |
| 3 | **Retrait « 🧪 test n°X/10 »** sur Validation/Confirmation | `validationView`, `confirm2View` (2) | garder 💳 coût/crédits, retirer le cadrage « test n°X/10 » | faible |
| 4 | **Accueil clarifié** | `homeView` (1) | titre « 🏠 Accueil », retirer mention `/menu`, harmoniser icône Studio, ajouter « 📤 Prêt à poster » | faible |
| 5 | **Vocabulaire unifié** (table partagée) | label map + ~4 vues (photo/vidéo/resources) | 1 mot/geste : **Garder** (≠Conserver) · **Changer** (≠Remplacer/Autre photo en surface) · **Fichiers** (≠Ressources) ; **Récents=projets** / **Historique=médias** (clarifier, pas fusionner). cb INCHANGÉS, libellés seuls | faible (mais touche plusieurs vues + assertions) |

### LOT 2 — Restructuration PHOTO 2-étapes + Référence (risque MODÉRÉ, flux)
| # | Item | Vues touchées | Option la plus légère | Risque |
|---|---|---|---|---|
| 6 | **Photo 2-étapes + ✅ Valider la photo (pin)** (B) + **#6 relabel** (Garder/Changer/🛠 Modifier) | `photoView`, `photo_prompt` (2) + 1 handler (`R0_PH_USE`+`r0PinSource`) | réutiliser les 2 écrans, ajouter charnière Valider ; PAS de nouvel écran | modéré (flux d'entrée) |
| 7 | **Retrait Référence du parcours photo** (B4) | `photoPromptView` (retire bouton Référence) + `confirmView`/`photoResultView` (retire mention Réf) (≈3) | retirer le bouton+mentions ; le code Référence reste (réactivable) | faible |
| 8 | **🎛 Influences en étape 2 (Préparer) + 5 bascules** (réf masquée) | bloc influences (retrait 1 bascule) + placement (déjà en Préparer) | retrait 1 ligne `optionRows` + « Réf » du résumé | faible |
| 9 | **Boîte à outils #7 via 🛠 Modifier** (MVP) | 1 bloc neuf `edition` + handler ffmpeg local | MVP non-destructif (cf `P2-7_BOITE_OUTILS_SCOPE`) | modéré (nouveau bloc, local gratuit) |

### LOT 3 — VIDÉO Choisir/Préparer + RÉSULTAT (risque MODÉRÉ — à arbitrer)
| # | Item | Vues touchées | Option la plus légère | Risque |
|---|---|---|---|---|
| 10 | **Clarifier VIDÉO·Choisir vs Préparer** (doublon constaté : Conserver/Garder, Changer/Remplacer, Montage, Outils photo sur les DEUX) | `videoView`, `videoParamsView` (2) | **léger** : rôles nets — Choisir = SOURCE (Garder/Changer/Autre photo) ; Préparer = PARAMÈTRES (Montage/Aperçu/Générer). Retirer Montage+Outils de Choisir, retirer trio-source de Préparer. cb inchangés, on déplace/retire des boutons | modéré ; 🟡 si fusion souhaitée (plus lourd) → proposé séparément |
| 11 | **H6 — « Nouveau projet » non-réponse (#14)** : répond TOUJOURS après projet terminé | localiser le handler « Nouveau projet » (probable `/v4r new`/`R0_RE_*`) (1-2) | reproduire la non-réponse → cause → fix ciblé (ré-armer la réponse après état « terminé ») | faible-modéré (bug à reproduire d'abord) |
| 12 | **H9 — aperçu sous-titres == rendu final** : PROUVER | aucun code si déjà conforme (mêmes `r0SubOpts`) | générer 2 clips (aperçu `r0SubClip` vs rendu `renderLocal`) sur la MÊME source/style → comparer (police/taille/oy/chunking) ; corriger uniquement si écart | faible (preuve d'abord) |

### LOT 4 — TRANSVERSES (à câbler où simple, sinon 🟡 planifié)
| # | Item | Vues touchées | Option la plus légère | Risque |
|---|---|---|---|---|
| 13 | **H7 — Corbeille récupérable depuis TOUS les espaces** (Fichiers/Biblio/Studio/Historique/Archives) | resources + galeries/studio (3-5) | soft-delete `r0Corbeille` existe déjà (galerie) → exposer un « 🗑 Retirer » + « ♻️ Restaurer » là où c'est trivial ; 🟡 PLANIFIÉ si ça touche trop d'écrans | faible par écran ; 🟡 si large |
| 14 | **H8 — Voir plus/Réduire in-bloc + texte complet permanent (#8)** | blocs texte prompt/script (2) | aperçu court + « 👁 Voir plus » (déroule in-bloc) + « Réduire » + « 📄 Texte complet » (déjà là). Lié à FIX-2 (arbitrage) — ne PAS casser la copie `<code>` | modéré (lié arbitrage P3 #8) |

## Invariant SOURCE ACTIVE + TEST HASH (transverse, dans LOT 2)
- ✅ Valider la photo → `r0PinSource` ; génération → pin (déjà). Reprise via `r0SourceFile`/`_r0IsRef`/`r0RealSource`.
- Assertion runtime « source active invariante » : gen→Valider→🎬 vidéo→/restart→reprise = **même sha1** partout.

## Compat 6 priorités (vérifiée par item)
1 bloc unique (média↔média, 0 recréation) ✅ · 2 source partout (renforcée A3+invariant) ✅ · 3 aperçu=résultat (inchangé) ✅ · 4 même bouton=même comportement (vocab LOT1#5 + contrat AJOUT 3) ✅ · 5 aucune perte contexte (pin+draft persistants) ✅ · 6 aucun écran inutile (réutilise, 1 seul bloc neuf=toolbox) ✅.

## Recommandation d'ORDRE (un lot à la fois, ton go entre chaque)
1. **LOT 1** (captions/vocab — faible risque, gros gain lisibilité, peu de régression). 
2. **LOT 2** (photo 2-étapes + Référence + influences placement + toolbox + invariant/hash).
3. **LOT 3** (VIDÉO Choisir/Préparer — option légère ; 🟡 fusion si tu préfères · + H6 #14 nouveau projet · + H9 preuve aperçu==final).
4. **LOT 4** (transverses : H7 corbeille partout · H8 Voir plus/Réduire — où simple, sinon 🟡 planifié).
5. **AJOUT 3** (disposition 2/row + contrat boutons + 3 relibellés Publier/Vidéo/Prompt) = EN DERNIER.

> H1–H5/H10–H12 (Section H réf) : H1 officialiser « écran de référence » + H4/H5 (n° projet photo + source active Fichiers/Studio) sont couverts par LOT 1/2 ; H10 (cloud↔Telegram) + H12 (test terrain) = ⚠️ terrain/process, hors code.

> Chaque lot : preuve (dump caption/boutons + assertions + sweep/audit), commit offline, ta revérif, puis go déploiement. Aucune refonte, rien déployé sans go.

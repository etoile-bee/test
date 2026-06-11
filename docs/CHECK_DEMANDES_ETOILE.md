# CHECK — Demandes d'Etoile · État honnête + preuve observable

> **Méthode** : chaque ligne est vérifiée par **preuve observable** (cartographie écran×bouton, runtime via le vrai chemin du bot, trace de migration, sortie ffmpeg réelle) — **pas** par relecture de code.
> Légende : ✅ fait & prouvé · 🟡 partiel / dépend d'un clic d'Etoile · ❌ non fait.
>
> **Build déployé** : commit `502658f` · pm2 `podcast-bot` relancé le 11/06 21:24:32 (boot propre, aucune erreur).
> **Tests** : `screens 103 · carto 154 · runtime 83 · nav 28 · budget 10 · nospend 4 · cloud_chain 14 · soustitres 12` = **408 OK / 0 KO**.
> **Sécurité dépense** : `LIVE ARMÉ` (photo=true, video=true, autorisé par Etoile) · budget `0/10` · garde-fous actifs (double-confirm, plafond 10, !R0DRY) · 1ʳᵉ dépense = clic d'Etoile.

---

## 1. Chaîne photo complète (sélection → modifier → valider → aperçu → garde → générer → final)

| Demande | État | Preuve observable |
|---|---|---|
| Chaîne photo sans cul-de-sac (galerie → préparation) | ✅ | carto 130/130 : tout bouton répond, 1 cockpit, Retour présent partout ; runtime A (double-confirm) vert |
| Aperçu obligatoire AVANT génération | ✅ | runtime A : « Générer » → écran RÉCAP (confirm) puis 2ᵉ confirmation, aucun média avant les 2 clics |
| Valider possible avant l'aperçu | ✅ | runtime : `R0_PH_GENERATE` → confirm (Aperçu/Éditer/Valider/Générer) |

## 2. Migration rétroactive (copie physique podcast-looks/projets)

| Demande | État | Preuve observable |
|---|---|---|
| UN seul mécanisme (rétroactif = futur) via `r0ArchiveProjet` | ✅ | `node telegram_bot.js --migrate` appelle exactement la fonction utilisée pour les futures générations |
| Copie PHYSIQUE (autonomie inter-projets) | ✅ | trace migration : **23 projets archivés · 623 copies · 279 fichiers uniques** sur disque (`find …/projets -path */Photos/* → 279`) |
| Arborescence `podcast-looks/projets/<persona>/<projet>` + manifeste | ✅ | `…/podcast-looks/projets/imany/imany_*` avec `projet.json`, `facts.snapshot.json`, `RECAP.txt`, sous-dossiers Photos/Vidéos/Références/… |
| Lecteurs lisent podcast-looks/projets (sinon stocké mais invisible) | ✅ | `preuve_lecture_finale.js` : galerie **trouvé 168 → 447**, affiché **100 → 162** (les photos migrées remontent) |
| Vidéos legacy laissées dans podcast-outputs | ✅ | migration : **0 vidéo copiée** (décision respectée) ; historique vidéo inchangé (514/117) |
| NE RIEN SUPPRIMER d'autre | ✅ | la migration n'écrit QUE dans podcast-looks/projets (copyFileSync `if(!exists)`), aucune suppression ; base `112 projets` inchangée avant/après |

## 3. Armer le réel (photo + vidéo) avec garde-fous

| Demande | État | Preuve observable |
|---|---|---|
| Double-confirmation avant dépense | ✅ | runtime A : `R0_GO2` → confirm2 → seul `R0_GO` crée ; budget bloque si épuisé |
| Plafond budget ≤ 10 tests | ✅ | budget 10/10 : `confirm RÉEL ÉPUISÉ` masque les boutons de dépense (test budget 10/10) |
| `!R0DRY` : le banc d'essai ne dépense JAMAIS | ✅ | test nospend 4/4 : LIVE armé + R0_DRYRUN → `liveFor(photo/video)=false` |
| « Tu ne dépenses rien toi-même : 1ʳᵉ dépense = son clic » | 🟡 | LIVE est **OFF** ; l'armement est la dernière étape (voir § Armement ci-dessous). Aucune dépense déclenchée par l'assistant |

## 4. Valider + Retour à CHAQUE étape (+ Accueil + Stop)

| Demande | État | Preuve observable |
|---|---|---|
| Retour partout | ✅ | carto : `hasRetour` vrai sur 22 écrans |
| Accueil + Stop partout | ✅ | wrapper `view()` ajoute 🏠/🛑 sur tout écran non-racine ; runtime boutons : `… 🏠 Accueil | 🛑 Stop` |
| ✅ Valider sur chaque bloc-outil | ✅ | `blockView` ajoute `✅ Valider | ◀ Retour` ; runtime : panneau finit par `✅ Valider | ◀ Retour | 🏠 Accueil | 🛑 Stop` |

## 5. Régression « Enregistrer avant de quitter ? »

| Demande | État | Preuve observable |
|---|---|---|
| Restaurée + stabilisée | ✅ | écran `quit` (Enregistrer/Quitter/Annuler) atteint par 🏠 depuis tout flux en cours |
| Ne peut plus disparaître entre déploiements | ✅ | **garde-fou cartographie** : 15 assertions (`QUIT : 🏠 depuis photo_prompt/video_params/video_edit/confirm/confirm2/block → quit` + Annuler revient + Save/Discard) — un futur build qui casse ça échoue aux tests |

## 6. /accueil = entrée principale du nouveau cockpit

| Demande | État | Preuve observable |
|---|---|---|
| `/accueil` ouvre le cockpit (PAS de bascule /menu) | ✅ | routage `if(txt==='/accueil'||txt.startsWith('/v4r')) r0TypedV4r('/v4r')` |
| `/v4r` = alias · `/menu` legacy inchangé | ✅ | même handler pour /accueil et /v4r ; /menu non touché |
| `/accueil` dans setMyCommands (entrée principale) | ✅ | setMyCommands : `accueil` 🎬 + `v4r` (alias) + `menu` (legacy) |

## 7. Catégories de scripts réelles (depuis la source legacy)

| Demande | État | Preuve observable |
|---|---|---|
| Vraies catégories/thèmes (comme Tenues) | ✅ | bloc Script expose les niches legacy (workflow.js) : Red flags · Hommes toxiques · Attachement · Estime de soi · Ruptures · Il s'éloigne · Erreurs dating · Narcissiques · Conseils dating · Situationships · Soft life · Sa valeur |
| Choix reflété + oriente la génération | ✅ | screens : choisir un thème → `draft.theme/theme_seed`, reste sur le panneau ; `r0RealVideo` topic = script > thème > source |

## 8. Sous-titres — version DÉFINITIVE

| Demande | État | Preuve observable |
|---|---|---|
| AUTO-générés + incrustés, PAS de champ texte, PAS d'on/off | ✅ | screens : aucun `R0_SET_ston_*`, aucun `R0_ASK_vi_soustitres` ; runtime boutons = apparence uniquement |
| Boîte apparence legacy : disposition · police · taille · position · **couleur** | ✅ | runtime panneau : `Mot-à-mot/Phrase · Archivo/Classique · Petit/Moyen/Grand · Haut/Milieu/Bas · Blanc/Jaune/Cyan` |
| RÉELLEMENT connecté : visible sur APERÇU **et** vidéo finale, mêmes réglages | ✅ | `test_v4r_soustitres` 12/12 : `r0SubOpts` mappe st_* → opts ; `buildAss` injecte couleur+alignement+taille+police ; **ffmpeg burn réel → PNG produit**. Aperçu (`r0SubSample`) et rendu (`renderVideo(styleOpts)→renderLocal→buildAss`) partagent le MÊME `r0SubOpts` |
| Réglages mémorisés (Défaut) | ✅ | runtime : st_color=jaune, st_pos=haut persistés dans le brouillon ; 💾 Défaut sauve les 5 champs st_* |
| `subtitle_style.js` (verrou) intact | ✅ | fichier non modifié ; lecture seule pour les défauts |

## 9. Autres intégrations du lot

| Demande | État | Preuve observable |
|---|---|---|
| Conservation image au passage photo→vidéo | ✅ | source épinglée `draft.video.source_file = ctx.coverFile` ; runtime cover cohérent |
| Voix retirée du montage vidéo (Kling gère) | ✅ | screens : montage = Script/Musique/Sous-titres/Durée (pas de Voix) |
| Grilles : numéros incrustés + régénérées par page | ✅ | mosaïque : nom unique par hash de contenu + `drawtext` numéros absolus |
| Rendus finaux persistants vs cockpit éphémère | ✅ | `r0PostFinal`/`r0RenderMids` séparés du cockpit (r0Mid) |

## 10. Déblocage génération PHOTO + wrapper structurel (fix définitif)

| Demande | État | Preuve observable |
|---|---|---|
| PHOTO·Préparer a 👁 Aperçu + ✅ Valider + ✨ Générer (symétrie vidéo) | ✅ | rendu réel harness : `📝 Prompt · 👗 Tenue · 🏛 Décor · 🖼 Référence · 🛠 Montage · 👁 Aperçu · 🎬 Faire une vidéo · ◀ Retour · ✅ Valider · ✨ Générer · 🏠 · 🛑` ; ✨ Générer → confirm (récap) |
| Wrapper GARANTIT Retour+Valider+Aperçu+Générer+Accueil+Stop (centralisé) | ✅ | `nav.view()` class-driven `NAVREQ` ; ajoute les boutons manquants selon la classe d'écran |
| Carto ÉCHOUE le déploiement si un bouton requis manque | ✅ | `test_v4r_carto` lit `NAVREQ` exporté : 24 assertions (gen→Aperçu/Valider/Générer/Retour ; edit→Valider/Retour) ; KO bloquant |

## 11. Grilles par 6 partout

| Demande | État | Preuve observable |
|---|---|---|
| 6 vignettes/projets par page, pagination Préc/Suiv, partout | ✅ | `R0_PAGE=6` (galerie/historique/récents/prêt/publiés), mosaïque `slice(0,6)`, studio/section/récents alignés 6 ; harness galerie « Page 1/28 » à 6/page |

## 12. Visibilité : tout le patrimoine au même endroit (urgence data)

| Demande | État | Preuve observable |
|---|---|---|
| Fichiers physiques intacts (pas de perte) | ✅ | comptage disque : photos **90 (podcast-looks) + 59 (generations) + 14 (projects_r) + 279 (projets/Photos)** ; vidéos **199 (outputs) + 113 (podcast-outputs)** ; backups `.prepurge` présents |
| Galerie/Historique agrègent TOUT (legacy + migré + nouveau) | ✅ | readers `r0RealImages`/`r0RealVideos` scannent looks + generations + projects_r + podcast-looks/projets ; galerie défaut **GLOBAL** (`R0_PH_GAL`/`R0_VI_GAL` → galleryAll=true) + bascule scope |
| Couverture d'accueil = vraie image | ✅ | `r0CoverFile` → image globale réelle la plus récente avant toute démo |

## 13. Sélection / remplacement photo qui PREND

| Demande | État | Preuve observable |
|---|---|---|
| Choisir un numéro / Remplacer applique réellement la photo | ✅ | runtime : 🖼 2 → curImg 3→4, cover = fichier choisi, `draft.video.source = "Photo #2"`, 0 THROW ; unitaire `picksrc` (média non-simulé + source) |

## 14. Écran final + Historique = hub de récupération par asset

| Demande | État | Preuve observable |
|---|---|---|
| Un bouton par fichier de la version | ✅ | hub `resources` : `🖼 Image · 🎬 Vidéo · 🎙 Voix/Audio · 📝 Prompt · 🎬 Script · 🔤 Sous-titres · ✏️ Lég. courte · 📄 Lég. longue · #️⃣ Hashtags` (runtime, 0 THROW) |
| Accessible depuis écran final + Studio + Récents | ✅ | `R0_RES` depuis photo/vidéo résultat + `🗂 Fichiers` sur Studio et Récents |
| Texte en entier (copiable) + fichiers envoyés | ✅ | textes via `R0_FULLTEXT_*` (découpe >limite) ; image/vidéo/audio via `R0_GETIMG/VID/AUDIO` (`sendPhotoKb`/`sendVideoKb`/`r0SendDoc`) |
| Publier → Studio>Publiés | ✅ | runtime : `R0_PUB` → publication, `R0_PUB_DO` → `publies` (état publié) |
| Historique = TOUT (publiés + non publiés) | ✅ | Studio : 🕘 Historique (galerie globale = tout) + 📤 Publiés (publiés seuls) |
| Voix/Audio réellement récupérable | 🟡 | bouton + recherche `r0FindAudio` (projets_r + archive Audio) prêts ; le fichier audio n'est persisté qu'aux **vraies** générations (LIVE) — sinon message honnête « aucun audio » |

---

## Armement du réel

- État actuel : **LIVE ARMÉ** (`v4r_live` présent ; photo=true, video=true — autorisé explicitement par Etoile), budget **0/10**.
- Garde-fous prouvés actifs : double-confirmation, plafond 10, `!R0DRY` (dry-run forcé OFF : nospend 4/4), blocage budget épuisé, cloud-copy gardé `!R0DRY`.
- **L'assistant ne déclenche aucune dépense.** La **première dépense reste le clic « Oui, générer » d'Etoile** sur l'écran de 2ᵉ confirmation.

## Réserves honnêtes (🟡 / limites)

- **Vidéo réelle bout-en-bout** : la chaîne Kling+ElevenLabs+Anthropic est câblée et l'incrustation sous-titres est prouvée localement (ffmpeg), mais un rendu vidéo réel complet n'a **jamais** été exécuté — il ne le sera qu'au 1ᵉʳ clic d'Etoile. Prouvé en dry-run/local uniquement.
- **Disposition mot-à-mot vs phrase** : exposée et mémorisée ; l'effet sur le découpage du rendu suit le timing de mots existant (non re-vérifié image par image).
- **Voix/Audio dans le hub** : le bouton existe ; le fichier audio n'est récupérable qu'après une vraie génération (LIVE) qui le dépose dans le projet. Avant, message honnête.
- **Backup « chaîne simple plus tard »** : noté, non fait (différé à ta demande).

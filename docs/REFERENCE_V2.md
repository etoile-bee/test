# RÉFÉRENCE V2 — cible officielle (Etoile) + ÉCARTS vs état actuel

> Gouvernance : R1 ne pas modifier une règle figée · R2 chaque correction confrontée à la référence · R3 tableau conformité tous écrans · R4 tests basés sur la réf · R5 zéro faux vert · R6 V2 remplaçable que par V3.
> État live = `2b19795` (déployé, LIVE ON). Lots de finition offline en attente de go (influences, photo 2-étapes, toolbox, cohérence parcours). Voir RÈGLES VALIDÉES V2 (A–G) ci-dessous.

## RÈGLES SYSTÈME FIGÉES (ne varient jamais)
- Titres : `📸 PHOTO · Préparer/Aperçu/Résultat`, `🎬 VIDÉO · …` (centralisés `titleFor`). ✅ en place.
- **« Accueil » remplace « Hub » partout** (UI). 🟡 écart : libellés/commentaires « hub » à renommer (UI : « 🗂 Mes fichiers » OK ; vérifier aucun libellé « Hub » visible).
- Boutons universels : ◀ Retour · 🏠 Accueil · 🛑 Stop garantis par le wrapper. ✅.
- Blocs copiables = texte brut seul (`<code>`). ✅.
- Statuts projet (brouillon/actif/archive) : ✅ socle.

## DÉCISIONS D1–D7 → cible + écart

| Déc. | Cible V2 | État actuel | Écart |
|---|---|---|---|
| **D1** | Photo·Préparer = Prompt·Tenue·Décor·Référence (PAS de Montage) | Montage retiré (offline) | ✅ (offline prêt) |
| **D2** | Sous-titres : texte AUTO non éditable ; apparence Position·Police·Taille·Couleur·**Disposition(mot/phrase/paragraphe)** ; aperçu avant gén = même rendu | auto ✅, apparence ✅ (position/police/taille/couleur + mot/phrase), aperçu clip ✅ (offline robuste) | 🟡 **ajouter disposition « paragraphe »** (actuel : mot/phrase seulement) |
| **D3** | **Aperçu** (voir le média) ET **Validation** (garde-fou final : moteur·coût·crédits·budget n/10·nb médias·durée + double confirm) = 2 ÉCRANS DISTINCTS | `confirm` fusionne récap+coût+validation ; `confirm2` = 2ᵉ confirm | ❌ **séparer** : Aperçu (média) → Validation (garde-fou chiffré) → double confirm |
| **D4** | Rôles sans doublon : Fichiers=projet actif · Studio=bibliothèque transverse · Historique=journal global · Prêt/Publié=publié | Galerie≡Historique (doublon, effet visibilité) | ❌ **dédoublonner** : Galerie (sélection, scope projet par défaut) ≠ Historique (journal global) |
| **D5** | **Modèle = PROJET COMPLET réutilisable** (prompt·tenue·décor·réf·catégorie·style·sous-titres·params) ; duplication sans toucher l'original | « Modèle »/« Défaut » = préréglages persona (champs) ; `S.duplicateProject` existe mais non câblé au bouton | ❌ **redéfinir** : « Modèle » → duplique le projet complet (via `duplicateProject`) ; renommer l'actuel en « 💾 Préréglages » |
| **D6** | Garder TOUS les garde-fous : coût·budget·crédits·avancement 1 bloc·verrou anti-restart·incident systématique·corbeille récupérable·bascule Photo↔Vidéo·métadonnées publication | tous présents | ✅ (verrou/incident/avancement/corbeille/bascule = offline ; budget/coût = live) |
| **D7** | Hashtags FUSIONNÉS dans les légendes (copie) + listés à part dans **Fichiers** ; jamais de bloc hashtags seul dans l'UI principale | bloc Légendes a courte/longue/hashtags séparés ; Fichiers a bouton #Hashtags | 🟡 **fusionner** hashtags dans la légende copiable ; garder le listing dans Fichiers ; retirer le hashtags-seul de l'UI principale |

## CARTE ÉCRAN-PAR-ÉCRAN CIBLE (V2)

- **Accueil** : 📸 Photo · 🎬 Vidéo · 🏛 Studio · 🕘 Historique · (Stop/Restart). ✅
- **Photo·Préparer** : 📝 Prompt · 👗 Tenue · 🏛 Décor · 🖼 Référence → 👁 Aperçu → ✅ Valider → ✨ Générer · (🎬 Faire une vidéo) · Retour/Accueil/Stop. ✅(D1)
- **Photo·Aperçu** : média photo + récap court → bouton **Valider** (mène à l'écran Validation). ❌ séparer de Validation (D3).
- **Validation (NOUVEAU)** : moteur · coût cr · crédits cumulés · budget n/10 · nb médias · durée → ✨ Générer maintenant → 2ᵉ confirmation. ❌ à créer (D3).
- **Photo·Résultat** : média + Modifier·Régénérer·Créer vidéo·Historique·Publication·🗂 Fichiers·Garder. ✅ (Modèle=projet à revoir D5).
- **Vidéo·Préparer** : Source(Garder/Remplacer/Autre photo) · 🛠 Montage · 📸 Outils photo · 👁 Aperçu · Valider · Générer. ✅.
- **Vidéo·Montage** : 📝 Script(catégorie+régén in-screen) · 🎵 Musique · 🔤 Sous-titres(apparence) · ⏱ Durée · 👁 Aperçu(clip sous-titré). 🟡 disposition « paragraphe » (D2).
- **Vidéo·Aperçu** : CLIP sous-titré (même rendu) → Validation → Générer. ❌ séparer Validation (D3).
- **Galerie** : sélection d'une photo (scope **projet** par défaut + 🌍 Tout) ; flèches haut/Choisir/numéros ; 6/page ; 🗑 corbeille. ❌ dédoublonner d'Historique (D4).
- **Historique** : journal GLOBAL (toutes photos+vidéos du patrimoine), lecture/récupération, pas la sélection de flux. ❌ distinct de Galerie (D4).
- **Fichiers (projet actif)** : 🖼 Image·🎬 Vidéo·🎙 Audio·📝 Prompt·🎬 Script·🔤 Sous-titres·✏️ Légendes(+#tags fusionnés)·#️⃣ Hashtags(liste). 🟡 fusion hashtags (D7).
- **Studio** : bibliothèques transverses (avatars/looks/décors/voix/prompts/templates/références/paramètres) + accès Historique/Publiés. 🟡 clarifier (pas de médias projet).
- **Prêt à poster / Publiés** : file à publier / archivés publiés. ✅.

## ÉCARTS PRIORISÉS (pour le déploiement groupé, après go)
1. ❌ **D3** Écran Validation distinct de Aperçu (garde-fou chiffré + double confirm).
2. ❌ **D4** Dédoublonner Galerie (sélection, scope projet) vs Historique (journal global).
3. ❌ **D5** « Modèle » = duplication de projet complet (`duplicateProject`) ; renommer préréglages.
4. 🟡 **D2** Disposition sous-titres « paragraphe ».
5. 🟡 **D7** Fusion hashtags dans légende copiable + listing Fichiers.
6. 🟡 **« Accueil » partout** (retirer tout « Hub » visible).
7. 🟢 **Fond (offline prêts)** : ANO-SOURCE-EDIT-REVERT · persistance contexte+Reprendre · script par catégorie+régén in-screen · ANO-SOURCE-PLACEHOLDER · aperçu sous-titré robuste · verrou anti-restart.

## CONFORMITÉ (R3) — synthèse
- ✅ conformes : Accueil, Photo·Préparer, Vidéo·Préparer, Photo·Résultat, Fichiers(hub), Prêt/Publiés, règles boutons universels, copiables.
- 🟡 partiels : Sous-titres(paragraphe), Hashtags(fusion), Studio(clarif), « Accueil/Hub ».
- ❌ écarts structurels : Aperçu vs Validation (D3), Galerie vs Historique (D4), Modèle=projet (D5).

> Cette carte est la cible. Implémentation UNIQUEMENT au déploiement groupé, sur go d'Etoile. Aucun écran figé tant que non validé.

---

# RÈGLES VALIDÉES V2 (mirror contractuel — statuts ✅ déployé · 🟡 scopé/planifié · ⚠️ terrain · ❌ à faire)

## A — SOURCE ACTIVE
- A1 **UNE seule source active par projet** = dernière photo validée/générée, reprise automatiquement partout, jamais d'ancienne ni de générique/défaut. ✅ (déployé : `r0PinSource`/`r0SourceFile`/`_r0IsRef`/`r0RealSource`).
- A2 **Photo validée = source vidéo** (Faire une vidéo / menu Vidéo / reprise reprennent CETTE photo). ✅ (à re-prouver par test hash).
- A3 **« 📸 Source active : <fichier> » VISIBLE sur chaque écran** (Photo/Vidéo/Aperçu/Validation/Résultat/Fichiers/reprise). 🟡 scopé (helper `srcLine`, ~9 captions).
- A4 **Remplacement explicite** à valider/générer ; l'ancienne reste en historique/fichiers. ✅ socle (à rendre visible via A3).

## B — PARCOURS PHOTO 2-ÉTAPES
- B1 **Séparer Choisir (image de base) / Préparer (paramètres)**. ✅ partiel (2 écrans existent : `photo`/`photo_prompt`) ; 🟡 charnière à ajouter.
- B2 **Validation photo OBLIGATOIRE** (« ✅ Valider la photo » épingle la source) avant Préparer. 🟡 scopé.
- B3 **Menu Choisir = Garder · Changer · 🛠 Modifier (+ Valider la photo)**. 🟡 scopé (#6 relabel/remap).
- B4 **Référence RETIRÉE du parcours principal** (photo). 🟡 scopé (retrait bloc Référence de Préparer + « Réf » du résumé).

## C — BOÎTE À OUTILS PHOTO (#7)
- C1 **Non-destructive** : Luminosité/Contraste/Saturation/Netteté (crans) + 👁 Aperçu + ↺ Réinitialiser + ✅ Valider → NOUVEAU candidat, ORIGINAL conservé. 🟡 scopé MVP (briques `buildColorFilter` prêtes).
- C2 Ouverte via « 🛠 Modifier » du menu Photo. 🟡 scopé.
- C3 Recadrage / filtres nommés / mémoire-par-look = 🟡 PLANIFIÉ (hors MVP).

## D — RÉSULTAT / VIDÉO
- D1 **Bloc RÉSULTAT conservé** (ne disparaît jamais ; référence projet : photo · infos · fichiers · historique · légendes · actions). ✅ (à harmoniser, cf F).
- D2 **🏷 Légendes** sur Résultat vidéo : courte+# / longue+# en blocs COPIABLES bruts (`r0FuseTags`). ✅ déployé (`2b19795`).
- D3 **Bandeau final simplifié (#11)** : Projet # · Date · Type · Catégorie · Durée · Statut. ✅ vidéo déployé · 🟡 photo à harmoniser.

## E — COUCHES D'INFLUENCE (neutres, avatar-agnostiques)
- E1 **5 bascules** : ☑ Source · ☑ Tenue · ☑ Décor · 🔒 Conserver tenue · 🔒 Conserver décor. ✅ backend (`3ea5aa0`) · 🟡 UI en Préparer (étape 2).
- E2 **Référence MASQUÉE** (no-op tant que `draft.refs` non consommé). 🟡 (retrait bouton + « Réf » résumé) · refs→moteur = 🟡 PLANIFIÉ.
- E3 **Gating 1 point** (flag OFF ⇒ couche absente des opts moteur) ; défaut true = zéro régression ; verrou via DEF. ✅ backend prouvé.
- E4 **Identité/visage persona TOUJOURS active** (jamais désactivable ici). ✅.

## F — ERGONOMIE / CONTRAT BOUTONS
- F1 **Vocabulaire unifié** (1 mot par geste) : Garder≠Conserver, Changer/Remplacer/Autre photo, Ressources/Fichiers, Récents/Historique. ❌ à unifier (table partagée).
- F2 **Même bouton = même comportement** (table cb→rôle). 🟡 audit fait (`AUDIT_CONTRAT_BOUTONS.md`) : 3 divergences (Publier/Vidéo/Prompt) → relibellé AJOUT 3.
- F3 **Disposition 2/row par catégorie** (helper partagé, paires canoniques, CTA pleine largeur). 🟡 = AJOUT 3 (en dernier).

## G — BLOC UNIQUE / PROCESS
- G1 **1 bloc unique partout**, édité en place ; recréation SEULEMENT à la frontière texte↔média (limite Telegram). ✅ (`spine_block`).
- G2 **Aperçu = résultat final** (sous-titres : mêmes `r0SubOpts` aperçu/rendu). ✅ déployé.
- G3 **Validation→média** (cœur génération 0 recréation). ✅ déployé (`2b19795`).
- G4 **Aucune perte de contexte / aucun écran inutile**. ✅ (priorités cohérence Etoile).

## H — ÉCRANS DE RÉFÉRENCE & INVARIANTS PROJET
- H1 **PHOTO·Résultat & VIDÉO·Résultat = écrans de RÉFÉRENCE du projet** (point de départ officiel des workflows suivants) ; ne disparaissent JAMAIS, jamais remplacés silencieusement. ✅ rendu persistant (`r0PostFinal`, bloc unique) · 🟡 à OFFICIALISER (statut « référence » explicite).
- H2 **Validation explicite PHOTO avant Préparer** (✅ Valider la photo = pin source). 🟡 scopé (LOT 2).
- H3 **Validation explicite VIDÉO avant génération** (Aperçu→Validation→Générer). ✅ déployé.
- H4 **N° projet sur écrans finaux** Photo + Vidéo. ✅ vidéo (`finalCaption`) · 🟡 photo (à harmoniser, #11).
- H5 **Source active visible AUSSI dans Fichiers/Studio/reprise**. 🟡 (helper `srcLine` étendu — LOT 1).
- H6 **« Nouveau projet » toujours dispo/fonctionnel après projet terminé**. 🟡 #14 (non-réponse = bug à traiter).
- H7 **Suppression/corbeille récupérable depuis TOUS les espaces** (Fichiers/Biblio/Studio/Historique/Archives). 🟡 (soft-delete `r0Corbeille` existe ; exposition partout à câbler).
- H8 **Textes longs : Voir plus/Réduire in-bloc + texte complet permanent**. 🟡 #8.
- H9 **Aperçus sous-titres = rendu final EXACT** (mêmes `r0SubOpts`). 🟡 à PROUVER (2 clips identiques aperçu vs final).
- H10 **Cohérence Cloud ↔ Telegram ↔ Fichiers** (aller-retour). ⚠️ terrain (LIVE).
- H11 **Historique des versions accessible depuis le projet** (⏪/🕘). ✅ déployé.
- H12 **Test terrain réel obligatoire avant clôture d'un lot**. ✅ process.
- H13 **Génération en cours VISIBLE** : bouton inactif/disparaît + statut « Génération en cours » + étapes + aucun double-clic. 🟡 #12 (verrou `r0Busy`/`.v4r_generating` existe ; rendre l'UI explicite).
- H14 **Conservation tenue/décor VISIBLE avant génération** (résumé 🎛 sur l'Aperçu). 🟡 (influences — résumé en place, à finaliser au build).
- H15 **Tenues/décors PERSO depuis Studio**. 🔵 PLANIFIÉ (roadmap).
- H16 **« Nouveau projet / Nouvelle photo / Nouvelle vidéo » toujours accessibles depuis un résultat** (aucun écran qui enferme). 🟡 #14.

## R — CHECKPOINT TERRAIN ETOILE (5 rouges, captures à l'appui)
- R1 **ÉRADICATION DÉMO « femme en cuir »** : aucun écran de projet ne doit peindre `r0DemoVideo`/`r0DemoPhoto` ; il peint la VRAIE vidéo générée ou la SOURCE ACTIVE réelle (image == ligne « Source active »), sinon TEXTE. Démo atteignable UNIQUEMENT si AUCUN projet. 🟢 **CORRIGÉ (offline)** : peintre durci (vidéo+photo), galerie filtrée, keepsake simulé sur source réelle ; helpers `r0RealVideoFile`/`r0HasProject` ; preuve `test_v4r_cuir` 23/0 + grep (tous appels démo gardés `!hasProject`). À déployer sur ton go.
- R1b **Incident « path must be of type string. Received an instance of Object » (Publier→Retour)** : 🟢 **CORRIGÉ** — cause racine = COLLISION DE NOM introduite en R1 : mon helper `function r0RealVideo(f)` écrasait le générateur Kling `async function r0RealVideo(persona,id)` (hoisting), donc le peintre/keepsake invoquaient le générateur avec un objet `facts` en `persona` → `path.join(BASE,{objet})`. Fix : helper renommé `r0RealVideoFile` + coercion frontière `r0FilePath` (jamais d'objet vers fs/path) ; garde-fou test `unhandledRejection`. Le filet d'incident (H13) reste intact.
- R2 **APERÇU SOUS-TITRES = FINAL EXACT** : 🟢 **CORRIGÉ (offline)** — aperçu (`r0SubClip`/`r0SubSample`) découpe le VRAI script via `render_local.buildChunks` (le MÊME que le final ; le groupement dépend des MOTS, pas des timings → texte identique) ; script vide → 1 chunk « EXEMPLE » marqué (jamais un faux texte). Position déjà cohérente sur le build actuel (panneau « haut » == `r0SubOpts` oy 0.78 == final) ; défaut fallback durci `'bas'`→`'haut'`. Panneau ÉPURÉ : Position regroupée en 1 ligne (Validé/Bas/Milieu/Haut), 5 dimensions conservées. Preuve `test_v4r_apercu_subs` 9/0 (textes chunks aperçu==final + style identique) + sweep 512/0.
- R3 **GÉNÉRATION EN COURS CLAIRE (H13)** : 🟢 **CORRIGÉ (offline)** — flag `r0Generating` → `ctx.generating` ; `confirm2View` bascule en état « 📸/🎬 Génération en cours… » **sans aucun bouton** (Oui/Annuler disparaissent → 0 re-clic), avancement (genStep/étape) affiché. Posé dans les 2 branches réelles (photo+vidéo), nettoyé en `finally` (anti-blocage). Verrou `r0Busy` bloque en plus tout re-clic de `R0_GO`. Preuve `test_v4r_h13` 14/0 (avant=Oui/Annuler sans « en cours » · pendant=0 bouton).
- R4 **(idem R3 côté vidéo)** — 🟢 couvert par R3 (photo ET vidéo, mêmes assertions).
- R5 **SCRIPT/PROMPT VISIBLES (#8/#9)** : 🟢 **CORRIGÉ (offline)** — le bloc texte montre le VRAI texte (aperçu `<code>` ~180c) + **« 👁 Voir plus » déroule le texte complet DANS le bloc** + « 🔼 Réduire » (flag `r0BlockExpanded`, réinit à chaque navigation) ; « 📄 Texte complet » (message séparé copiable) reste via le HUB Fichiers. #9 : Régénérer reste sur le bloc + relance `gentext` **même thème** (theme/theme_seed conservés). Preuve `test_v4r_textes` 14/0.
- R6 **#11bis keepsake / bandeau** (`r0FinalCap`/`finalCaption`) : 🟢 **DÉJÀ SIMPLIFIÉ** (LOT 1 #11 a retiré « cap à poser / brouillon / décision(s) ») — vérifié sur le build courant ; les anciens messages persistants d'Etoile sont historiques (immuables), les NOUVEAUX rendus sont propres.

> LOT 2 (photo 2-étapes) 🟢 **LIVRÉ (offline)** — cf `LOT2_RENDU_AVANT_APRES.md`. Étape 1 Choisir : ✅ Valider la photo (pin source `pinsource`/ctx.coverFile) · Garder · 🔄 Changer · 🛠 Modifier (boîte à outils #7 couleur non-destructive : Lum/Contraste/Saturation/Netteté + Aperçu/Réinitialiser/Valider) · Générer. Étape 2 Préparer : Tenue/Décor · 🎛 Influences (5 bascules, réf masquée) /Prompt · Aperçu · Faire une vidéo (Référence retirée du parcours, code conservé ; PAS de « Valider params » — flux D3). INVARIANT source active prouvé (sha1 stable gen→Valider→vidéo→/restart). Preuve `test_v4r_lot2` 19/0 + sweep 559/0 + audit 0.

> Maintenu en parallèle : `ANOMALIES.md` (boucle détecté→corrigé→preuve) · `AUDIT_FINAL.md` · `AUDIT_CONTRAT_BOUTONS.md` · scopes (`SCOPE_PHOTO_2ETAPES`, `P2-7_BOITE_OUTILS_SCOPE`, `AJOUT2_INFLUENCES_SCOPE`, `LOT2_RENDU_AVANT_APRES`) · `PLAN_COHERENCE_PARCOURS`.

## T — RÈGLES VALIDÉES (LOT TERRAIN 5P — validé Etoile, FIGÉ)
- **T1 SOUS-TITRES — POSITION** : défaut = preset LEGACY VERROUILLÉ `subtitle_style.OY = 0.370` (« collier », entre le menton et le micro), **VALIDÉ Etoile**. Rendu vidéo final == aperçu == legacy (même `r0SubOpts.oy`, même pipeline `renderLocal` : zoom/crop/scale identiques ; seul l'oy variait). `subtitle_style.js` reste **VERROUILLÉ (lecture seule)**. Hauteur réglable par vidéo via 📍 Hauteur (`draft.video.st_oy`, bornée [0.12,0.88]).
- **T2 PANNEAU SOUS-TITRES = EXACTEMENT 3 RÉGLAGES** : 🔤 Police · 📏 Taille · 📍 Hauteur. Rien d'autre (disposition / couleur / presets de position RETIRÉS).
- **T3 LÉGENDES AUTO** : générées APRÈS la vidéo par le MÊME appel script (Anthropic), **sans surcoût** ; stockées avec le projet. 2 blocs copiables PROPRES : (1) légende courte + #hashtags, (2) légende longue + #hashtags — **zéro texte système** (`r0FuseTags`). Ne remplit que les champs vides (n'écrase jamais une édition).
- **T4 MÉDIAS — JAMAIS DE PERTE** : tout média généré RESTE dans le chat (keepsake persistant, jamais supprimé) ET reste retrouvable dans 🗂 Fichiers via **scan du dossier projet réel** (`r0ReconcileProjectMedia` : `projects_r/<id>/` + `podcast-looks/<id>/` → ré-injecté dans facts.medias). Une vidéo sur disque est TOUJOURS relistée après Accueil/reprise. Perte perçue = inacceptable.
- **T5 APERÇU** : bloc UNIQUE (jamais de nouvelle fenêtre — édité en place via `editMessageMedia`), incrusté sur la SOURCE ACTIVE du projet, distinct des vraies vidéos finales, et **JAMAIS muet** (repli image sous-titrée `r0SubSample`, sinon message clair).
- **T6 DOSSIER PROJET COMPLET** : chaque vidéo finalisée porte vidéo + RAW + script + légende courte+# + légende longue+# + prompt + n° projet, récupérables ensemble (Fichiers : 🎬 Vidéo · ☁ RAW · 🎬 Script · 🏷 Légendes · 📝 Prompt).
- **T7 CLOUD** : `outputs/AAAA-MM-JJ/<#proj>_<slug>/` — 1 dossier par jour, 1 média finalisé = 1 dossier avec TOUS ses fichiers (RAW INCLUS) ; bouton ☁ RAW dans Fichiers. Migration des anciens fichiers à plat = `tools/cloud_migration.js` en **dry-run réversible** (`--apply` journalisé → `--undo`), **sans suppression**, lancée seulement sur GO d'Etoile.
- **T8 PARTIE 2/3** : sur l'écran final vidéo, bouton « ➕ Partie N » — MÊME thème & réglages (look/décor/voix/sous-titres/durée/catégorie), SEUL le script change = SUITE cohérente (legacy `WF.partPrompt`, référence les parties précédentes), dans le MÊME projet.
- **T9 DÉPLOIEMENT** : acte **DÉLIBÉRÉ** uniquement — checkout explicite du commit validé dans `/Users/fayrouzn/podcast-workflow` + UN restart contrôlé. Dev **isolé en worktree** (`wt-terrain`) ; la prod ne suit jamais les commits de dev. **Plus JAMAIS de déploiement par effet de bord** (cause de l'incident du 13/06 : restart pm2 rechargeant le working copy laissé sur une branche non validée).

## U — LOT FIABILISATION NUIT (A→R) — phase STRICTE (zéro nouvelle fonctionnalité)
Base prod de départ : `5ce809e`. Statut : ✅ conforme · 🔧 en cours · ⚠️ anomalie · □ non commencé. Preuves = `tools/test_v4r_*.js` + `tools/audit_parcours.js` + planches rendues réelles.

| # | Point | Statut | Preuve |
|---|---|---|---|
| A | Génération : UN seul statut « en cours » (photo+vidéo) | ✅ | test_v4r_genstatus 7/0 |
| B | Panneau Sous-titres toujours complet (Police/Taille/Hauteur/Modèle) ; entrées unifiées | ✅ | test_v4r_scriptpick 8/0 |
| C | Découvrabilité Tenue/Décor/Influences dans le parcours photo | ✅ | test_v4r_photolayers |
| D | Tenue/Décor défaut = image de base + « Désactiver » explicite | ✅ | test_v4r_photolayers 9/0 |
| E | Libellés non tronqués en plein mot (helper `_shortLbl`) | ✅ | test_v4r_scriptpick |
| F | Actions séparées des catégories (script) | ✅ | test_v4r_scriptpick |
| G | Photo·Choisir : pas « aucune photo » si source active | ✅ | test_v4r_photolayers |
| H | Aperçu : indicateur Influences = réalité (✓ si valeur+activée) | ✅ | test_v4r_photolayers |
| I | Ergonomie 2/ligne + action primaire pleine largeur partout | ✅ | audit_parcours / screens |
| J | Génération « en cours » update ~3 min (legacy) + timeout | ✅ | test_v4r_lot5r 18/0 |
| K | Vidéo 9:16 : width/height (ffprobe, repli 720×1280) + thumb sur TOUS les sendVideo | ✅ | test_v4r_lot5r |
| L | Écran final vidéo : Lég. courte/longue copiables + Partie 2/3 + Refaire vidéo | ✅ | test_v4r_lot5r + runtime + screens |
| M | Retrait « Éditer légendes » + ligne « # Hashtags » séparée | ✅ | test_v4r_lot5r |
| N | Boutons inutiles retirés + positions (2/ligne) | ✅ | audit_parcours |
| O | Légendes legacy : courte ≈2 phrases ≠ longue développée, +# fusionnés | ✅ | test_v4r_lot5r |
| P | Carte connexion reposée (boot + inactivité ~20 min + entrées) ; persistante | ✅ | test_v4r_connectgate 9/0 + test_v4r_connectcard 7/0 |
| Q | Alignement numéro vignette ↔ bouton ↔ média (mosaïques, toutes grilles, AVEC pagination & volume réel) | ✅ | test_v4r_grids 6/0 (**112 projets, 19 pages**) + mosaïque rendue `assets_r/_TEST_mosaic_recents_page5.jpg` (88,87,86,85,84,83 brûlés == boutons) |
| R | Récents/Archives : badge 📸 photo / 🎬 vidéo (libellé bouton) + badge rouge **VIDEO** brûlé sur la vignette vidéo | ✅ | test_v4r_grids (badge libellé + badge brûlé vérifiés à l'œil sur la planche p.5 : VIDEO sur 87 & 84) |
| S | Supprimer entièrement le panneau « 🎛 Influences » (bouton + écran) | ✅ | bouton retiré de Préparer + bloc `influences` supprimé ; test_v4r_lot2/runtime/screens MAJ |
| T | Tenue/Décor = UN seul réglage « 🔒 Conserver / 🔓 Ne pas conserver » (plus de « Utiliser » ni 5 cases) ; défaut image de base ; « 🚫 Aucune » remet à l'image de base | ✅ | test_v4r_photolayers 13/0 + test_v4r_lot2 |
| U | Vidéo longue : AVERTIR avant génération du découpage en N parties + coût, et confirmer | ✅ | Validation : « ✂️ Vidéo longue : 60s → découpée en 2 parties (2 vidéos) · coût couvre les 2 » ; aperçu note aussi ; confirmation R0_GO2. test_v4r_longvideo 7/0 |
| V | Écrans finaux vidéo ET photo : audit visuel (lisibilité, boutons utiles, légendes copiables, pas surchargé) | ✅ | rendus inspectés : vidéo 12 btns 2/ligne (légendes copiables + Partie/Refaire), photo 9 btns + hint inspection ; test_v4r_finalscreens 13/0 |
| W2 | Identité : photo générée a fait apparaître des poils sur le torse (persona féminine) → renforcer NEGATIVE PROMPT + inspection photo avant vidéo | ✅ | `newlook.buildPrompt` + recreate portent `IDENTITY_RULES` (WOMAN/feminine + exclusion body/chest/torso hair, beard, masculine) ; résultat photo invite à zoomer avant vidéo. test_v4r_identity 5/0. **Limite : IA probabiliste — réduit fortement, sans garantie 100%.** |
| X | +6 tenues au picker (Old Money, Luxe, Naturel, Sport chic, Bohème chic, Minimaliste) avec vrais prompts | ✅ | catalogue 246 tenues / 12 cat. + test_v4r_photolayers #X |
| C2 | « 👁 Voir plus » sur le panneau Prompt (comme Script) | ✅ | vérifié au RUNTIME : R0_SEEMORE déroule le texte complet + R0_SEELESS (Réduire) |

### Q — diagnostic & fix (FIGÉ)
**Cause** : la mosaïque brûlait un index SÉQUENTIEL de page (`startNum+i`) tandis que les boutons Récents portaient le n° de PROJET réel (`p._num`). À 1-6 éléments (sandbox) ils coïncidaient → invisible ; à 112 projets ils divergeaient (vignette « 25 » sous bouton « n°97 »). **Fix** : `r0Mosaic(files, nums[], kinds[])` brûle le numéro EXACT du bouton de chaque tuile (`nums[i]`) — positions pour les galeries de choix, n° de projet pour Récents/Archives. Prouvé à **112 projets**, page 5 : n° brûlés `[88,87,86,85,84,83]` == boutons == projets ouverts (cb position → `projets[pos]._num`), vérifié à l'œil sur la planche rendue.
### R — fix marqueur vidéo (FIGÉ)
Badge type sur la vignette : `kinds[i]==='video'` → badge rouge **VIDEO** brûlé en haut-droite (drawtext `text='VIDEO'`, glyphes latins fiables). Le marqueur ▶ (`▶`) a été abandonné : ffmpeg drawtext n'interprète pas l'échappement `\u…` et la police par défaut n'a pas le glyphe → rendait « u2 » (tofu). Le libellé du bouton garde l'emoji 🎬/📸 (`kindIco`).

### Procédure de validation OBLIGATOIRE (FI3a/FI3b) — appliquée à tout l'audit nuit
Un point n'est validé que contrôlé aux 4 niveaux **technique + fonctionnel + VISUEL + UTILISATEUR**, couvrant :
1. texte affiché (markup) ; 2. **IMAGE réellement rendue** (mosaïque/vignette GÉNÉRÉE puis REGARDÉE — pas le markup) ; 3. **VIDÉO réelle** (9:16/miniature) ; 4. rendu Telegram mobile ; 5. cohérence VISUEL↔EXÉCUTÉ (numéro vignette == bouton == média sélectionné) ; 6. **VOLUMÉTRIE RÉELLE** (pagination, ≈30-120 éléments, pas 1-6).
Outils : `tools/test_v4r_grids.js` (seed 112 projets + rend mosaïque réelle), `R0_MOSAIC_FORCE=1` pour forcer le rendu ffmpeg en test. Chemins des planches rendues fournis pour contrôle à l'œil.

### Rappels antérieurs (toujours conformes)
1' Quota de tests ENTIÈREMENT supprimé ; garde-fou coût + double-confirm conservé ✅ · #2 Légendes auto rétro + # fusionnés + bouton Hashtags retiré ✅ · #3 « pause »/« [pause] » invisible ✅ · #5 Modèle sous-titres défaut (hauteur collier 0.370) ✅ · #6 Fichiers RAW + lég courte/longue + Refaire vidéo ✅ · #7 Recherche vidéo inter-projets ✅ · #8 Cloud par CODE PROJET ✅ · script complet (VRAI script Anthropic, plus de stub) ✅ · carte persistante (R0_RESUME/R0_RESUME_HOME laissent la carte) ✅ · RG-7 « Projet n°N » partout ✅ · plateformes TikTok/IG/YT retirées ✅.

### États vides (regard neuf)
`tools/test_v4r_emptystates.js` 9/0 : projet neuf SANS média — Photo · Galerie · Récents · Prêt · Studio · Publiés · Fichiers · Accueil ne plantent pas, n'avalent aucune exception, et ne peignent JAMAIS la démo « cuir » (R1).

### Méthode d'audit nuit
Boucle : sweep complet (`tools/test_v4r_*.js`, 37 suites) + `audit_parcours.js` + audits RÉELS (`audit_visual_nuit.js` planches+sous-titres+clip 9:16, `audit_flow_nuit.js` persistance/flux/isolation) + balayage anomalies (libellés tronqués, rangées >2, grilles, états vides) ; à chaque anomalie trouvée → corrigée + test ajouté + recontrôle à l'œil ; re-passe à regard neuf jusqu'à zéro écart. **Aucun déploiement sans GO.**

### État de la boucle (passe consolidée)
Sweep **37/0** · audit_visual **9/0** · audit_flow **27/0** · audit_parcours **0 écart** · états vides **9/0** · verrous intacts. Anomalies nuit trouvées+corrigées+recontrôlées : **AN1** (planches Prêt/Publiés), **AN2** (herméticité faux-vert). Dernière passe à regard neuf (légendes O, écran final L, états vides, flux) : **aucun nouvel écart**.

## AN — ANOMALIES TROUVÉES EN AUDIT NUIT (boucle contrôle→cause→correction→recontrôle)
| # | Anomalie | Cause | Correction | Validation (vue à l'œil) |
|---|---|---|---|---|
| AN1 | **Prêt à poster / Publiés : pas de planche numérotée** — boutons 📤 1..N posés sur UNE seule photo sans rapport ⇒ impossible de savoir quel n° = quel média (même classe que #Q, sur 2 grilles citées par Etoile) | la planche-contact n'était construite QUE pour `gallery`+`recents` ; `pret`/`publies` peignaient `r0RealSource` (1 image) sous des boutons positionnels | bloc planche étendu à `pret`/`publies` : n° brûlé = POSITION (base+i+1) == bouton 📤 ; `kinds` par extension → badge VIDEO sur item vidéo. `r0Mosaic` résout une entrée vidéo en poster-frame (`_videoThumb`) pour la planche. | planches rendues `assets_r/_AUDIT_pret_page1.jpg` (1-6, VIDEO sur 3·6) + `_AUDIT_publies_page1.jpg` (1-6, VIDEO sur 4) — n° == boutons vérifié |
| AN2 | **FAUX-VERT actif (herméticité)** — un sandbox de test EXPLICITE lisait quand même la vraie iCloud : la galerie « globale » affichait ~112 vraies photos au lieu des fichiers du sandbox | au boot dry-run, le bot symlinkait `outputs`/`prompts`/`library.json`/`outfits_catalog.json` RÉELS dans tout BASE dès qu'ils manquaient — y compris un `V4R_SANDBOX` isolé mkdtemp | symlink réel **conditionné à l'absence de `V4R_SANDBOX`** : un sandbox explicite est 100 % autonome (aucun symlink hors-sandbox). N'affecte pas la prod (bloc dry-run only). | `tools/test_v4r_hermetic.js` 7/0 : 0 symlink réel + galerie globale = 3 (sandbox seul, plus jamais ~112) ; sweep complet inchangé 36/0 |

### Preuves visuelles audit nuit (`tools/audit_visual_nuit.js`, R0_MOSAIC_FORCE + R0_SUBCLIP_FORCE)
Rendus RÉELS regardés à l'œil (chemins fournis à Etoile) :
- Prêt à poster numéroté : `assets_r/_AUDIT_pret_page1.jpg` ✅
- Publiés numéroté : `assets_r/_AUDIT_publies_page1.jpg` ✅
- Aperçu sous-titres position **collier** (oy=0.370, Archivo Black, 2-mots == final) : `assets_r/_AUDIT_soustitres_collier.png` ✅
- Clip aperçu **9:16 RÉEL** (720×1280 ffprobe) + miniature : `assets_r/_AUDIT_apercu_clip.mp4` / `_AUDIT_apercu_thumb.jpg` ✅
Hooks de test ajoutés : `subSample`, `subClip` (rendent les VRAIES fonctions aperçu) ; flag `R0_SUBCLIP_FORCE` (rendu réel en test, comme `R0_MOSAIC_FORCE`).

### Preuve PERSISTANCE & FLUX (`tools/audit_flow_nuit.js`, 27/0)
Rejoue le VRAI handler sur Photo → (pont) Vidéo → Script (thème) → Aperçu/Validation (gate, **zéro dépense** : budget inchangé après annulation) → Accueil mi-parcours (garde-fou « enregistrer avant de quitter » #34) → **Reprise /restart** → **Changement de projet** (A↔B). Invariants tenus à CHAQUE écran : projet stable (curId) · 1 seul bloc cockpit vivant · **aucune exception avalée** (`logs()` sans `THROW`) · **source active invariante** au pont photo→vidéo · **isolation inter-projets** (la vidéo de B n'est jamais la source de A).

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

> Maintenu en parallèle : `ANOMALIES.md` (boucle détecté→corrigé→preuve) · `AUDIT_FINAL.md` · `AUDIT_CONTRAT_BOUTONS.md` · scopes (`SCOPE_PHOTO_2ETAPES`, `P2-7_BOITE_OUTILS_SCOPE`, `AJOUT2_INFLUENCES_SCOPE`).

# SÉCURITÉS CRITIQUES — contrôle dédié (AU-DESSUS de la V2/écrans/parcours)

> Condition OBLIGATOIRE avant feu vert. Chaque règle : ✅ conforme / 🟡 partiel / ❌ non conforme + **preuve réelle** (fonction/assertion/test). Ce qui n'est pas prouvable sans dépense = 🟡/⚠️ « à confirmer terrain » + mécanisme code en place (pas de faux ✅).
> Build évalué = `79eac5f` (déployé). Aucune correction de disposition n'a le droit de casser ces 13 règles → assertions carto/tests qui les protègent.

| # | Règle | Statut | Preuve réelle |
|---|---|---|---|
| 1 | **Quitter sans enregistrer** (confirmation existe + se déclenche) | ✅ | `R0_HOME` depuis `IN_PROGRESS` (photo_prompt·video_params·video_edit·block·confirm·**validation**·confirm2) → écran `quit` (preuve harness : 7/7 → quit) ; `quitView` = 💾 Enregistrer · 🚪 Quitter · ↩️ Annuler. Garde-fou test : `test_v4r_screens` INPROG (inclut validation). `nav.js:258` |
| 2 | **Retour arrière sans perte** | ✅ | wrapper garantit ◀ Retour partout (carto 162/0 `hasRetour`) ; contexte conservé (hash stable Préparer→Aperçu→Vidéo) ; `R0_VALID_BACK` Validation→Aperçu |
| 3 | **Accueil sans perte de contexte** | ✅ | `R0_HOME` en flux → quit (pas d'effacement) ; hors flux → home ; état persisté à chaque rendu (`r0SaveNav`→`v4r_nav.json`) |
| 4 | **Reprise exacte après redémarrage** | ✅ (code) · ⚠️ terrain | boot recharge `v4r_nav.json` + ▶️ Reprendre (`R0_RESUME`) restaure écran/projet/pending ; preuve harness conservation /menu·/v4r·/restart (image+thème+script+source). À confirmer sur un vrai reboot terrain. `telegram_bot.js` boot + `R0_RESUME` |
| 5 | **Verrou anti-redémarrage pendant génération** | ✅ | flag `.v4r_generating` posé (2 `r0GenLock(true)`) / levé en `finally` ; deploy-guard `flag présent → ⛔ RESTART REFUSÉ` (testé) |
| 6 | **Message technique complet en cas d'erreur** | ✅ | filet global `uncaughtException`/`unhandledRejection` → message + porte /accueil ; catch par tap → incident clair ; koBanner génération avec cause exacte |
| 7 | **Sauvegarde automatique des brouillons** | ✅ | chaque réglage = `S.setDraft` (facts.json) ; nav persistée à chaque rendu (`r0SaveNav`) |
| 8 | **Récupération d'une génération interrompue** | 🟡 ⚠️ terrain | flag orphelin au boot → **message d'incident** (« génération interrompue… reprends via /accueil ») ; le VERROU empêche désormais la coupure. Pas de reprise AUTO du média (à confirmer/améliorer terrain). `telegram_bot.js` boot orphan-check |
| 9 | **Aucune perte silencieuse de travail** | ✅ | quit-guard (#1) + persistance (#3/#7) + bloc final figé non-perdable (`r0PostFinal`, preuve renders=1 conservé) |
| 10 | **Aucune perte silencieuse de crédits** | 🟡 ⚠️ terrain | budget enregistré au succès (`BUD.record`) ; double-confirm + plafond 10 + `!R0DRY` ; **réserve honnête** : une génération tuée AVANT dépôt peut coûter côté moteur sans incrément local → message d'incident le signale. À confirmer terrain |
| 11 | **Corbeille récupérable** | ✅ | soft-delete `r0Corbeille` → `.corbeille/` (jamais de suppression) ; `r0Restore` ; preuve FS : déplacé→contenu intact→restauré |
| 12 | **Historique récupérable** | ✅ | `r0RealImages`/`r0RealVideos` walk global → **241 img / 239 vid** ; hub Fichiers récupère chaque asset (R0_GET*/R0_FULLTEXT) |
| 13 | **Projet toujours retrouvable après fermeture** | ✅ | `S.listProjects` (facts.json persistants) ; Récents (`R0_RE_OPEN`) ; `currentProject` au boot ; 112 projets listables |

## Synthèse
- **✅ conformes (10/13)** : 1,2,3,5,6,7,9,11,12,13 — prouvés (assertion/fonction/test).
- **🟡 / ⚠️ à confirmer terrain (3/13)** : 4 (reboot réel), 8 (reprise auto média), 10 (dépense d'une gén tuée) — **mécanisme code en place**, preuve finale = test terrain (pas de faux ✅).
- **Aucun ❌.**

## Protection (contractuel)
- Assertions carto/tests qui gardent ces règles : `test_v4r_screens` (QUIT 15 assertions, INPROG inclut `validation`) · `test_v4r_carto` (Retour/Accueil/Stop partout, NAVREQ) · `test_v4r_nospend` (dry-run jamais de dépense) · `test_v4r_budget` (plafond/épuisé). Toute régression de disposition cassant l'une → sweep KO → déploiement bloqué.

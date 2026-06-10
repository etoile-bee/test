# PLAN STUDIO — Feuille de route (Etoile)

_Statuts : ✅ fait · 🔧 en cours · 💤 à faire · ⏸ en attente (maquette/validation Etoile) · ❌ annulé._
_Source de vérité de l'état figé = tag `STABLE-1`. Règles : fichiers de style verrouillés (`subtitle_style.js` 76/0.370, `color_style.js` V5) ; pas de génération payante sans récap+confirmation ; un seul écran auto-édité._

---

## BLOC A — BUGS / FIDÉLITÉ

| Item | Statut | Notes |
|---|---|---|
| Sur-zoom sur image fixe (gros plan) | ✅ | `render_local` : zoom OFF sur input image (commit `31b9702`) |
| Couleur modifiée sur stills (grading par défaut) | ✅ | stills sans grading, image intacte ΔRGB=0 (`17677f9`) ; grading réservé à la vraie vidéo |
| Affichage qui COUPE l'image (crop 4:5 `nlDisp`) | ✅ | affichage entier 9:16 partout (`5b9944b`) |
| 9:16 forcé sur tous les modes de génération | ✅ | eco/hd/planche/recreate/split (`d6ff808`) |
| Photo de référence Imany (panneau noir + mauvaise réf) | ✅ | photo officielle d'Etoile + durcissement (`127c3d7`) |
| `/preview` & `/test` figés (vieux raw au lieu du look courant) | ✅ | partent de l'état courant (`3e25d61`) |
| Anti-doublon édition en place (« message not modified ») | ✅ | signature d'état + cache file_id (chantier ①) |
| Attente + erreurs lisibles (ticker, annuler, crédits) | ✅ | chantier ③ |
| **BUG-1 — planche/3 poses → 1 seule image** | 🔧 | défaut eco count=3 doit produire 3 fichiers séparés |
| **BUG-2 — pince à cheveux réapparue** | 🔧 | vérifier que `newlook_prompt.txt` actif = version sans pince (`6dbf7e2`) |
| **BUG-3 — Avatar → Nouvelle vidéo ne reprend pas l'image générée** | 🔧 | aligner sur le chemin menu Vidéo (workingSource) |
| **BUG-4 — réglages /edit réinitialisés au défaut (filtre se réactive)** | 🔧 | fx = brouillon par projet, reset neutre par défaut, persistance via style only |
| **BUG-5 — anti-spam résiduel (messages séparés)** | 🔧 | tout dans le bloc, en place |
| Couleur V5 appliquée à la VRAIE vidéo lipsync | ⏸ | maquette ACTUEL/V5 envoyée ; en attente go d'Etoile pour câbler |

## BLOC B — FLUX GÉNÉRATION

| Item | Statut | Notes |
|---|---|---|
| Script affiché + éditable avant toute dépense | ✅ | garde-fou en place |
| Maquette (~centimes) avant Kling | ✅ | |
| Récap coût + durée avant paiement | ✅ | durée honnête ~3-10 min |
| Annulation réelle (genAbort) toujours visible | ✅ | |
| Images test éco avant HD/vidéo | ✅ | |
| Défaut « nouveau look » = 3 poses séparées (éco 9:16) | ✅ | carousel chaque pose entière + actions (`5b9944b`) |
| Sélecteur nombre de photos 1/2/3/4/6 (batch_size, récap N×0,48 cr) | ✅ | `5cbc9f9` |
| Planche 1-image-multi-angles = option distincte | ✅ | |
| Vrai album (3 d'un coup) — limite Telegram (pas de boutons par image) | ⏸ | option « 📚 voir en album » possible si Etoile veut |
| Niveau de zoom vidéo (0 / léger / actuel) | ⏸ | proposition 3 niveaux, choix Etoile |
| Fusion `/preview` + `/test` en « 👁 Aperçu (gratuit) » + bouton Générer | 💤 | après vrai test payant |

## BLOC C — STRUCTURE UI (⏸ NE PAS TOUCHER — maquettes d'abord)

| Item | Statut | Notes |
|---|---|---|
| `/stop` + `/restart` en tête du menu **inline** (déjà OK dans le menu déroulant) | ⏸ | maquette |
| Fil d'Ariane homogène sur la carte + vocabulaire de retour unifié (Menu/Carte/Récap/Retour) | ⏸ | maquette |
| Libellés ambigus : « 🎨 Modèle » (=styles enregistrés), « 👁 Maquette » (=aperçu voix), « ▦ Grille » vs « Galerie » | ⏸ | maquette renommage |
| Menu de validation génération (photo ET vidéo) clarifié | 💤 | après test payant |
| Refonte « 3 blocs statiques » (photo/vidéo/résultats) | ✅ | en place, à fiabiliser |

## BLOC D — FEATURES

| Item | Statut | Notes |
|---|---|---|
| Persona multi-influenceur (scaffold) | ✅ | `personas.json` + `PERSONA_*` ; activation = feature |
| Restyle gratuit (rendu local) | ✅ | |
| Galerie en grille / pagination | ✅ | chantier ④ |
| Cadrage cible (plan poitrine centré) | ❌ | annulé : l'image était correcte, c'était l'affichage qui coupait (résolu A) |
| ②-bis nettoyage code mort (launch/MM_* dormants) | 💤 | passe à froid (cf. DOLEANCES) |
| Publication TikTok auto + stockage privé (≠ tmpfiles) + boucle /mark | 💤 | backlog CONTEXTE |
| Refaire un parcours utilisateur complet + lister frictions | 💤 | après test payant (cf. DOLEANCES) |

---
_Mise à jour au fil des chantiers. Détail des commits dans `JOURNAL_PROJET.md`._

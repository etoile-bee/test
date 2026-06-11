# CHECKLIST DE STABILISATION — suivi (mise à jour automatique)

Légende : ✅ corrigé côté code (testé) · 🟡 corrigé côté code, **à valider par toi sur l'appareil** · ⏳ pas encore fait

Mode réel **désarmé** (simulation, zéro dépense) · architecture validée intacte · aucun nouvel objet.

---

## BLOQUANTS
- ✅ Accueil > Photo : « Galerie » renommé en « Modifier »
- ✅ Dans « Modifier » : boîte à outils regroupée sous « Utiliser » (aucune fonctionnalité retirée — renommer ≠ supprimer)
- 🟡 Les photos remontent dans **Galerie** — cause racine corrigée (agrégation des vraies images projet **+ global**), **à valider visuellement**
- 🟡 Les photos remontent dans **Historique** — idem, **à valider visuellement**
- ✅ Zéro action silencieuse (filet re-render sur erreur/timeout/bug → toujours une réponse)
- ✅ Bloc résultat jamais supprimé après /v4r · /menu · /restart
- ✅ Résultat toujours récupérable

## PARCOURS PHOTO
- ✅ PHOTO > Utiliser ouvre directement **PHOTO · Préparer**
- ✅ Préparer contient : Prompt · Look · Décor · Références · Paramètres · Édition
- ✅ Retour partout
- ✅ Suivant partout (Générer = Suivant)
- ✅ Éditer avant génération
- ✅ Flux : Utiliser → Préparer → Éditer → Aperçu → Valider → Générer → Résultat

## PARCOURS VIDÉO
- ✅ Réorganisé (logique du menu) en 2 groupes :
  - IMAGE SOURCE : Garder · Remplacer · Générer
  - ÉDITION : Script · Voix · Musique · Sous-titres · Paramètres (+ Durée · Format · Mouvement)
- ✅ Chaque modification revient automatiquement au menu Vidéo
- ✅ Aucune impasse
- ✅ Flux : Préparer → Éditer → Aperçu → Valider → Générer → Résultat

## ÉDITION
- ✅ Bouton Éditer sur Aperçu photo / Validation photo / Aperçu vidéo / Validation vidéo
- ✅ Retour sans perte d'état
- ✅ Retour automatique à l'écran précédent après modification

## SCRIPT IA
- ✅ Brouillon · Aperçu · Édition · Validation (même logique, gaté)

## LÉGENDES
- ✅ Regroupées dans le RÉSULTAT : Légende courte · Légende longue · Hashtags
- ✅ Copier · Modifier · Réutiliser (champs existants)

## DURÉE / PHOTOS
- ✅ Calcul automatique du nombre de photos (15s→1 · 30s→1 · 45s→2 · 60s→3)
- ✅ Affiché dans l'écran de validation avant génération

## NAVIGATION
- ✅ Retour sur tous les écrans (audit : 0 écran sans retour)
- ✅ Suivant sur les écrans intermédiaires
- ✅ Accueil secondaire
- ✅ Aucun écran sans sortie

## TITRES
- ✅ Uniformisés (« 📸 PHOTO · Étape » / « 🎬 VIDÉO · Étape »)
- ✅ Texte réduit, informations techniques inutiles supprimées
- ✅ Uniquement les infos utiles à la décision

## ÉTAT DU PROJET
- ✅ Statut visible (Préparation photo → Photo validée → Préparation vidéo → Vidéo générée → Terminé)
- ✅ Mise à jour automatique — **dérivé** des faits (aucun nouvel objet)

## VALIDATION AVANT TEST PHOTO RÉEL
- 🟡 Galerie validée — code OK, **ta validation visuelle requise**
- ✅ Retour partout
- ✅ Édition partout
- ✅ Bloc résultat conservé
- ✅ Réponses système fiables
- → Porte **ouverte** (sous réserve de ta validation galerie)

## VALIDATION AVANT TEST VIDÉO RÉEL
- ✅ Calcul durée → nombre de photos
- 🟡 Résultat final complet — à valider
- ✅ Légendes regroupées
- 🟡 Tous les assets récupérables — code OK, à valider
- ⏳ Brancher Kling + ElevenLabs + script dans /v4r (actuellement simulé — **GO vidéo dédié requis, ~½ journée**)

---

## 4 POINTS QUE TU GARDES OUVERTS (validation utilisateur)
1. 🟡 **Galerie / Historique / Récents / Archives** — images réellement visibles → ouvert jusqu'à ta validation visuelle
2. 🟡 **Transmission réelle des réglages au moteur** — câblage fait + trace, mais ouvert jusqu'à ton test réel (Prompt/Look/Décor personnalisés)
3. 🟡 **Photo ↔ Vidéo** — câblé direct (sans Accueil, sans recréation), ouvert jusqu'à ta vérification en conditions réelles
4. ✅ **Renommer ≠ supprimer** — consigne appliquée : fonctionnalités, médias et outils conservés

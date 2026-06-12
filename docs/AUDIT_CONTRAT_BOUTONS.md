# AUDIT CONTRAT DE BOUTONS (#3) — même libellé = même comportement ? (investigation, AUCUN code)

Scan réel : tous les écrans, `label → {cb}`. Source : dump dispatch (`bot.markup()`).

## ✅ CONFORMES (même intention, cible contextuelle — PAS une divergence)
Ces libellés mappent plusieurs cb MAIS le comportement est identique ; le cb diffère seulement par le contexte (photo/vidéo, ou écran précédent). À garder tel quel :
- **◀ Retour** → toujours « écran précédent » (cible variable = nature même du Retour) : R0_HOME / R0_PHOTO / R0_GEN_CANCEL / R0_VALID_BACK / R0_VI_CREATE / R0_VIDEO / R0_PH_GEN / R0_VI_RESULT.
- **👁 Aperçu** (R0_PH_PREVIEW / R0_VI_PREVIEW) · **✏️ Modifier** (R0_PH_EDIT / R0_GEN_EDIT / R0_VI_EDIT) · **🔁 Régénérer** (R0_PH_REGEN / R0_VI_REGEN) · **✅ Garder** (R0_PH_KEEP / R0_VI_KEEP) · **📥 Importer** (R0_PH_IMPORT / R0_VI_IMPORT) · **🕘 Historique** (R0_PH_HIST / R0_VI_HIST) · **✅ Valider** (R0_GEN_VALID / R0_BLOCK_OK) · **🎬 Créer vidéo** (R0_PH_TOVIDEO / R0_VI_CREATE).
→ même verbe = même effet, variante photo/vidéo. Conforme à « même bouton = même comportement ».

## ⚠️ DIVERGENCES RÉELLES (même libellé, action de NATURE différente) — à traiter avec la table AJOUT 3
1. **« Publier »** : sur `video_result` = `R0_PUB` (**ouvre** l'écran publication) ; sur `publication` = `R0_PUB_DO` (**exécute** la publication). → navigation vs action. *Proposition : garder « 📤 Publier » pour ouvrir ; renommer l'exécution en « ✅ Confirmer la publication ».*
2. **« 🎬 Vidéo »** : sur `home` = `R0_VIDEO` (**naviguer** vers l'écran Vidéo) ; sur `resources` = `R0_GETVID` (**télécharger** le fichier vidéo). → nav vs get-fichier. *Proposition : dans Fichiers, « 📥 Vidéo » (télécharger) pour distinguer de « 🎬 Vidéo » (aller).*
3. **« 📝 Prompt » / « 🎬 Script » / « 🔤 Sous-titres »** : dans les blocs = **éditer** (R0_PHB_prompt / R0_VIB_script / R0_VE_SUBS) ; dans `resources` = **envoyer le texte** (R0_FULLTEXT_*). → éditer vs récupérer. *Proposition : dans Fichiers, préfixer « 📄 » ou « 📥 » (récupérer) pour distinguer de l'édition.*

## Recommandation
- Les ✅ conformes : NE PAS toucher.
- Les 3 ⚠️ : relibellés MINEURS (distinguer **naviguer/éditer** de **exécuter/télécharger**) à intégrer dans la **table cb→{layout, comportement}** d'AJOUT 3 (1 source de vérité), PAS maintenant. Aucun changement de cb, juste le libellé côté `resources`/exécution.
- Aucune divergence de SÉCURITÉ (Retour/Accueil/Stop/Valider sont cohérents partout).

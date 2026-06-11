# AUDIT cat.B — #6 IMPORT (chaîne + réutilisation) & #8 PUBLICATION (avant/après)

## #6 IMPORT PHOTO (rejoue le post-download du handler)
✅ #6 PHOTO stockée dans looks/ (patrimoine persistant, pas /tmp)
✅ #6 PHOTO rattachée au PROJET courant (imany_2026-06-11-23-25-46)
✅ #6 PHOTO remonte dans FICHIERS (resources lit visibles)
✅ #6 PHOTO remonte dans HISTORIQUE/Galerie (walk looks/)
✅ #6 PHOTO RÉUTILISABLE comme source vidéo (source_file épinglé)

## #6 IMPORT VIDÉO (rejoue le post-download : dossier projet + source épinglée)
✅ #6 VIDÉO stockée DANS le dossier projet
✅ #6 VIDÉO rattachée + source épinglée

## #6 IMPORT RÉFÉRENCE (réglage draft, pas un candidat)
✅ #6 RÉFÉRENCE enregistrée dans le draft photo (pas un média)

## #6 AUDIO : aucun chemin d'import (audio = généré) — réserve documentée
   (ANO-IMPORT-AUDIO : pas de `r0Await.upload===audio` ; audio produit par ElevenLabs/Kling.)

## #8 PUBLICATION — état AVANT / APRÈS (le fichier NE SORT PAS du projet)
   AVANT publication : etat=candidate file= existe=false
✅ #8 « Prêt à poster » -> écran pret, etat=garde (média validé, pas déplacé)
   APRÈS publication : etat=publie file= existe=false
✅ #8 Publier change SEULEMENT etat (garde->publie)
✅ #8 AUCUN déplacement de fichier : chemin IDENTIQUE avant/après (pas de move/rename)
✅ #8 même ENTRÉE média conservée dans le projet (pas supprimée de l'historique)
   NB : en simulation (LIVE OFF) la vidéo n'a pas de fichier réel ; la persistance disque réelle = code (R0_PUB_DO=setMediaEtat, aucun fs.rename) + terrain LIVE.
✅ #8 écran Publié distinct (publies)

RÉSULTAT: 13 OK, 0 KO
FINDINGS: aucun
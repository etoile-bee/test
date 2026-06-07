# Favoris Finder — dossiers du projet

## ⚠️ Limitation macOS 15 (Sequoia)
L'ajout **programmatique** aux favoris de la barre latérale du Finder est **bloqué** sur macOS 15.6 :
- l'API `LSSharedFileList` (celle qu'utilise `mysides`) est neutralisée (liste vide, insertion refusée) ;
- le fichier des favoris `~/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteItems.sfl3` est **protégé par TCC** (« Operation not permitted » même en lecture).

→ `mysides` (cask, nécessite sudo + Rosetta pour son binaire x86) **échouerait de toute façon** sur cette version.
Ce n'est pas un problème d'outil mais une restriction système.

## ✅ Méthode fiable (30 s) — barre latérale
Une commande ouvre les 6 dossiers, il ne reste qu'à les glisser dans la barre latérale :
```bash
~/bin/podcast-favoris
```
Puis, pour chaque fenêtre Finder, **glisse le dossier dans la section « Favoris »** de la barre latérale.
(Autre méthode : sélectionne le dossier dans Finder et **Cmd-Ctrl-T** pour l'ajouter à la barre latérale.)

### Les 6 dossiers
| Favori | Chemin réel |
|---|---|
| podcast-workflow | `~/podcast-workflow` |
| podcast-outputs (iCloud) | `~/Library/Mobile Documents/com~apple~CloudDocs/podcast-outputs` |
| ready_to_post | `…/podcast-outputs/ready_to_post` |
| generations | `…/podcast-outputs/generations` |
| podcast-looks (iCloud) | `~/Library/Mobile Documents/com~apple~CloudDocs/podcast-looks` |
| docs | `~/podcast-workflow/docs` |

## Option automatisable — le DOCK (sans sudo, si tu préfères)
Le **Dock** accepte les modifications programmatiques (contrairement à la barre latérale).
Pour ajouter les 6 dossiers au Dock (section de droite), dis-le moi et je lance la commande
(`defaults write com.apple.dock persistent-others …` + `killall Dock`). Je ne l'ai pas fait
d'office pour ne pas modifier ton Dock sans accord.

## Si tu veux vraiment l'API (avancé)
Accorder « Accès complet au disque » au Terminal (Réglages Système → Confidentialité) **ne suffit pas** :
l'API `LSSharedFileList` reste neutralisée sur Sequoia. La seule voie restante est la manipulation
du `.sfl3` avec injection de bookmarks — fragile et risquée (perte des favoris existants). Non recommandé.

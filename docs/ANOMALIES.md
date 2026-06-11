# ANOMALIES — Stabilisation v4r (boucle : détectée → reproduite → comprise → corrigée → retestée → validée → clôturée)

> Pilotage : Dispatch vérifie le repo réel ; l'assistant corrige + prouve. Pas de « corrigé » sans **artefact réel**.
> Bot déployé courant : voir dernier commit en bas. Tests : harness no-spend `R0_DRYRUN=1` ; burn ffmpeg local = gratuit (réel).

---

## ANO-SUBTITLE-APERCU — Aperçu sous-titres avant génération vidéo
- **Écran** : Vidéo → (Montage) → Aperçu (confirmView, mediaKind=video)
- **Gravité** : 🔴 BLOQUANTE
- **Attendu** : à l'arrivée sur l'aperçu vidéo, un **clip échantillon avec sous-titres incrustés** (position/taille/police/couleur) s'affiche AUTOMATIQUEMENT, sans fouiller ; bouton 🔤 Sous-titres pour ajuster ; le clip se re-rend à chaque changement.
- **Constaté (Etoile)** : « je n'ai toujours pas l'aperçu des sous-titres avant génération ». L'aperçu montre une image fixe (recap), pas le clip.
- **Cause RACINE (confirmée, artefact)** : le code peint bien le clip (`r0Render` confirm+video → `r0SubClip`), MAIS `r0SubClip` échoue à l'exécution quand la photo source est un **placeholder iCloud non téléchargé** (`blocks=0`). Le déclencheur de téléchargement `fs.statSync(img).size<30000` ne se déclenche pas (un dataless rapporte sa taille LOGIQUE complète, ex. 3,4 Mo). ffmpeg lit 0 octet → échec → **repli sur image statique**. Mesure réelle : **140/471 images podcast-looks sont dataless**.
- **Correctif** : helper `r0EnsureLocal(file)` qui détecte un dataless (`stat -f%b` = 0 blocs) et force `brctl download` (await + polling jusqu'à matérialisation), utilisé par `r0SubClip` ET `r0SubSample` avant ffmpeg ; repli aperçu = **PNG sous-titré** (`r0SubSample`), jamais l'image statique silencieuse ; log `[v4r]` succès/échec.
- **Statut** : 🟡 EN COURS
- **Artefact** : (à compléter après fix) subclip*.mp4 avant/après + markup aperçu.

---

## ANO-VERROU-GEN — Verrou génération bloque tout restart
- **Gravité** : 🔴 BLOQUANTE — **CLÔTURÉE ✅**
- **Attendu** : pendant une génération, aucun deploy/restart possible ; flag orphelin au boot → message d'incident.
- **Correctif** : flag fichier `.v4r_generating` posé/levé (2/2), garde-fou de déploiement, détection orphelin au boot.
- **Artefact** : test deploy-guard `flag présent → ⛔ RESTART REFUSÉ` / `absent → ✅ autorisé` ; 2 poses + 2 levées dans le code ; commit `af68fe9`.

---

## Checklist 16 points (à dérouler)
1) Parcours Photo bout en bout — 🟡 à auditer
2) Parcours Vidéo bout en bout — 🟡 à auditer
3) Conservation des données — ✅ (migration, .prepurge, source unique)
4) Galeries — ✅ (239/239, walk récursif) — re-auditer affichage
5) Historique — 🟡
6) Stockage local — ✅ (projects_r)
7) Sync cloud — ✅ (podcast-looks symlink iCloud)
8) Telegram — 🟡
9) Sous-titres — 🔴 ANO-SUBTITLE-APERCU
10) Textes copiables — ✅ (`<code>` brut) — re-prouver le presse-papiers
11) Écrans finaux — ✅ (bloc figé 5 boutons)
12) Boutons de nav — ✅ (carto 156/0)
13) Retours arrière — 🟡
14) Cas d'erreur — ✅ (messages incident, filet global)
15) Redémarrages — ✅ (verrou + messages)
16) Générations réelles — 🟡 (à relancer après 1-5 validés)

# PRIORISATION PRODUIT — migrations legacy par IMPACT UTILISATEUR (analyse, 2026-06-10)

> **Lentille E117** : on classe par **impact produit / expérience utilisateur** et **projection produit final** (modes Manuel/Automatique, Studio = mémoire métier, export, reprise, auditabilité), **PAS** par dette technique / facilité.
> **Objectif d'Etoile** : le plus vite possible → **cockpit unique**, **zéro nouveau bloc**, **zéro écran externe**, **zéro perte de contexte** (look/réf/image/prompt/projet), **navigation cohérente PHOTO→VIDÉO**, **base solide pour le mode automatique**.
> **Analyse seulement — aucune migration.** Watcher live actif. Inventaire technique de référence : `docs/FRONTIERES_LEGACY.md` (F1–F14, complété ici en F15–F18).

## ⛔ Préalable : B1 — BUG du module CIBLE (pas une frontière legacy)
`photo.image` se rend parfois en **bloc texte** au lieu du bloc média workspace → **observé 4× en live** (R_photo.image → editText). Cause : `img = has ? nlLocal(idx) : (lookFile||refThumb)` renvoie `null` si le fichier image ne se résout pas → le routeur bascule sur `ctx.show` (texte). **Sur le parcours CENTRAL PHOTO→IMAGE.** → **P0 hotfix** (1 ligne : `img = (has && nlLocal(idx)) || lookFile(p) || refThumb()`), à faire avant/avec la 1ʳᵉ vague.

---

## (1) RECLASSEMENT PAR IMPACT PRODUIT — fiches F1→F18

Échelle : impact UX **aujourd'hui** (●○○→●●●) · **fréquence** en usage normal · impact **tests réels** · impact **mode AUTO** · impact **cockpit unique** · **priorité produit P0–P3**.

### F1 — Éditeur image / montage 🟥 **P0**
- UX aujourd'hui : **●●●** — cliquer **🎨 Éditer** ouvre un cockpit/galerie séparés, **perd le contexte** (projet/réf/prompt), empile des blocs. **Le problème utilisateur n°1.**
- Fréquence : **élevée** (éditer/ajuster est au cœur de la création).
- Tests réels : casse direct (nouveaux blocs, GLP_*, NL_NEW interne observés).
- Mode auto : **moyen-élevé** — l'auto doit **appliquer** des réglages montage de façon programmatique ; tant que c'est un sous-système manuel hors `proj`, l'auto ne peut pas les piloter.
- Cockpit unique : **bloquant**.
- **Justification P0** : c'est l'endroit où l'utilisateur perd le plus de contexte, le plus souvent, sur le chemin de production. Priorité produit n°1 (confirme l'intuition d'Etoile).

### F2 — Moteur vidéo legacy (carte→script→maquette→résultats→export) 🟥 **P0 (mode auto) / P1 (cockpit immédiat)**
- UX aujourd'hui : **●●○** — la génération réelle vit hors workspace (maquette/résultats/dossiers = messages séparés), mais c'est surtout **invisible tant qu'on ne génère pas** (payant, donc rare en test à sec).
- Fréquence : moyenne (à chaque production réelle).
- Tests réels : à sec, peu vu ; en réel, rupture du bloc unique sur tout l'aval.
- Mode auto : **●●● clé de voûte** — l'auto, la reprise après échec, l'export et l'auditabilité passent TOUS par ce moteur. Sans le rebrancher sur `proj`, **pas de mode automatique**.
- Cockpit unique : bloquant pour la moitié VIDÉO finale.
- **Justification** : P0 pour la **cible produit** (mode auto/export/reprise) ; P1 pour le « cockpit unique tout de suite » car peu visible à sec. C'est la **fondation**, pas le bobo quotidien.

### F3 — Wizard photo legacy `nl*` (NL_NEW…) 🟧 **P1**
- UX aujourd'hui : **●●○** — `NL_NEW` (atteignable via galerie/éditeur) **crée un nouveau bloc photo** (observé live) et **doublonne** le workflow migré → confusion « deux façons de faire un look ».
- Fréquence : moyenne (dès qu'on passe par la galerie/éditeur legacy).
- Tests réels : fuite `sendPhoto` observée.
- Mode auto : faible (le moteur `generateLook` reste utile, c'est l'UI qui doublonne).
- Cockpit unique : moyen.
- **Justification P1** : quick win structurant — **rediriger `NL_NEW`→`photo.look`** supprime un doublon et une fuite live, peu risqué.

### F4 — Galerie de looks 🟧 **P1** (Studio = mémoire métier, réévalué ⬆️)
- UX aujourd'hui : **●●○** — la galerie est un **écran externe** (messages/grille séparés) ; or **choisir un look** est une action fréquente et **alimente le workflow**.
- Fréquence : **élevée** (source de tout projet).
- Tests réels : moyen (déjà partiellement migré via `photo.lookgal`/`video.srcgal`).
- Mode auto : **moyen** — l'auto doit piocher un look existant de façon fiable.
- Cockpit unique : moyen-élevé.
- **Justification P1** : c'est la **mémoire métier** des looks ; sous-évaluée en vue purement technique. À traiter tôt car elle nourrit Photo ET Vidéo.

### F5 — Références (STUDIO) 🟧 **P1**
- UX aujourd'hui : **●●○** — la réf est **déjà migrée dans le workflow** (`photo.ref`), mais STUDIO garde une **2ᵉ porte** (`showRefMenu`) → incohérence « où est LA référence ? ».
- Fréquence : moyenne-élevée (identité Imany = critique).
- Tests réels : faible (workflow OK).
- Mode auto : **élevé** — l'auto DOIT connaître la réf active sans ambiguïté.
- Cockpit unique : moyen (éliminer la 2ᵉ porte).
- **Justification P1** : la référence est le **socle d'identité** ; une seule source/écran obligatoire pour l'auto.

### F6 — Modèles / styles sauvegardés 🟨 **P2**
- UX aujourd'hui : **●○○** — écran externe, utile mais pas quotidien.
- Fréquence : faible-moyenne.
- Mode auto : **moyen** — l'auto peut appliquer un modèle de style par défaut.
- Cockpit unique : moyen. **Justification P2** : dépend de F1 (édition), à enchaîner après.

### F7 — Décors 🟨 **P2**
- UX : **●○○** — **doublon** : le décor est déjà choisi dans le workflow (`PL_ENV`). L'écran STUDIO Décors fait surtout doublon.
- Fréquence : faible. Mode auto : faible (déjà dans le slice). **Justification P2** : surtout du nettoyage de doublon.

### F8 — Personas 🟨 **P2 (P1 pour multi-persona futur)**
- UX : **●○○** aujourd'hui (1 persona). Mais **structurellement important** : le persona conditionne refs/looks/drafts.
- Fréquence : faible aujourd'hui. Mode auto : **moyen-élevé** (l'auto doit savoir POUR QUI il génère). **Justification P2 maintenant, P1 si multi-persona entre dans la cible.**

### F9 — Médias / fichiers 🟨 **P2**
- UX : **●○○** — navigateur de fichiers, consultation. Fréquence faible. Mode auto : faible. **Justification P2.**

### F10 — Historique 🟧 **P1** (mémoire métier ⬆️)
- UX aujourd'hui : **●●○** — liste texte au mauvais format ; or **retrouver/rouvrir une production** est central.
- Fréquence : moyenne-élevée.
- Mode auto : **élevé** — auditabilité, reprise, « qu'a-t-on déjà produit ». 
- Cockpit unique : moyen. **Justification P1** : c'est la mémoire des productions ; pilier de l'auditabilité (cible E93–E96).

### F11 — Prêt à poster / export livrables 🟨 **P2**
- UX : **●●○** — c'est la **sortie finale** (livrables TikTok). Fréquence : à chaque post. Mode auto : **élevé** (l'auto doit livrer). **Justification P2** : dépend de F2 (résultats) ; à faire avec/après F2.

### F12 — Menu / nav legacy (MAIN_MENU / HOME_*) 🟧 **P1**
- UX aujourd'hui : **●●○** — chaque **◀️ Retour legacy** recrée un **bloc accueil** → empilement et perte de repère, **partout**.
- Fréquence : **très élevée** (tous les Retour des écrans legacy).
- Mode auto : faible. Cockpit unique : **élevé** (transverse). **Justification P1** : transverse et pénible ; se résout en grande partie en migrant F1/F4/etc. + en remplaçant `MAIN_MENU`→`R_home`.

### F13 — Barre technique (TECH_STOP/STATUS) 🟨 **P2** (quick win)
- UX : **●○○** — message plein au lieu d'un toast (observé). Présent sur **chaque** écran. Fréquence faible mais visible. **Justification P2 quick win** (S, sans risque).

### F14 — Commandes texte legacy (/newlook, /prompt…) 🟦 **P3**
- UX : **●○○** — power-user ; doublonnent le workspace. Fréquence faible. **Justification P3** : redirection simple en fin de parcours.

### F15 — INTAKE PHOTO GLOBAL (ajout complétude) 🟨 **P2**
- Emplacement : `pendingPhotoId`, handler `msg.photo` hors wait-state → « Photo reçue. Que veux-tu en faire ? » + `ADD_LOOK · ADD_LOOK_AVATAR · ADD_IGNORE · REF_SET`.
- UX : **●●○** — envoyer une photo **n'importe quand** ouvre un mini-menu legacy (`send`) hors workspace → perte de contexte si on est dans un projet.
- Fréquence : moyenne (geste naturel : « tiens, utilise cette photo »). Mode auto : faible. **Justification P2** : doit s'intégrer au workspace (upload look/réf déjà migré ; unifier l'intake spontané).

### F16 — ANCIEN FLUX « maquette » ANGLAIS `MM_*` / `m_*_wait` (ajout complétude) 🟦 **P3**
- Emplacement : `MM_START/NEW/EDIT*/TOPIC*/SCRIPT*/LOOK*`, états `m_topic_wait/m_script_wait/m_upload_wait`, `showSettings`.
- UX : **●○○** — sous-système **antérieur** (anglais), largement supplanté par F2 ; risque = confusion s'il reste atteignable.
- Fréquence : très faible (probablement résiduel/mort). **Justification P3** : à **auditer puis supprimer** (E66 dette), pas à migrer.

### F17 — PROMPT « réglages du look » `LS_*` (ajout complétude) 🟨 **P2**
- Emplacement : `maybeAskLookStyle()` → `LS_REUSE · LS_BASE · LS_KEEP` (cardMenu : « ce look a des réglages enregistrés, réutiliser ? »).
- UX : **●●○** — interruption **cardMenu hors workspace** au moment de choisir un look avec réglages → casse le bloc unique pile sur une action fréquente.
- Fréquence : moyenne. Mode auto : moyen (l'auto doit décider sans pop-up). **Justification P2** : à intégrer comme choix in-bloc (ou règle auto).

### F18 — MENUS ANNEXES (settings / profil / aide / CARD_MORE) (ajout complétude) 🟦 **P3**
- Emplacement : `showSettings`, `HOME_PROFIL`, `MENU_HELP`, `MENU_TECH`, `CARD_MORE`, `showCover` (cardMenu/send).
- UX : **●○○** — écrans secondaires. Fréquence faible. **Justification P3** : nettoyage/rattachement tardif (l'aide workspace existe déjà via `RH_`).

---

## (2) VUE SYNTHÉTIQUE — l'ORDRE RÉEL des migrations (orienté produit)

> « Pour obtenir le plus vite possible un cockpit unique, cohérent, sans perte de contexte, évolutif vers le mode auto : dans quel ordre ? »

**Phase 0 — Hotfix & quick wins (≤1 session, supprime les fuites vues en live)**
`B1` (photo.image bloc média) · `F3` (rediriger NL_NEW→photo.look) · `F13` (toasts) · `F17` (choix réglages in-bloc).
→ *Effet : plus aucun nouveau bloc sur le parcours PHOTO de base.*

**Phase 1 — F1 Éditeur (LE problème UX n°1)**
Migrer l'édition/montage en modules workspace (slice `proj.video.montage`).
→ *Effet : « Éditer » ne casse plus le contexte ; gros saut de cohérence ressentie.*

**Phase 2 — Sources de vérité qui nourrissent le workflow : F4 (looks) + F5 (réf) + F15 (intake) + F12 (retours)**
→ *Effet : choisir un look / une réf / envoyer une photo reste dans le cockpit ; les Retour ne ré-empilent plus d'accueil.*

**Phase 3 — F2 Moteur vidéo (fondation mode auto + export) + F11 (livrables) + F10 (historique/auditabilité)**
→ *Effet : la génération réelle, l'export et la reprise vivent dans `proj` ; base du mode automatique.*

**Phase 4 — Reste Studio (mémoire métier) : F6 modèles · F7 décors · F8 personas · F9 médias**
→ *Effet : tout le Studio en cockpit unique ; multi-persona prêt.*

**Phase 5 — Nettoyage dette : F14 commandes · F16 ancien flux anglais (suppression) · F18 menus annexes.**

**Pourquoi cet ordre (et pas l'ordre technique)** : on attaque d'abord **ce que l'utilisateur touche le plus et qui casse le contexte** (F1, puis sources F4/F5/F15, puis retours F12), ensuite la **fondation existentielle** (F2 pour l'auto/export), puis la **mémoire métier** (reste Studio), enfin la **dette pure**. F2 est P0 *produit final* mais arrive en Phase 3 car peu visible à sec et très risqué (payant) : on stabilise d'abord le cockpit ressenti, on bâtit la fondation ensuite sur une base saine.

---

## (3) TROIS SEAUX

### (a) CASSE l'EXPÉRIENCE UTILISATEUR AUJOURD'HUI
`B1` (photo.image texte) · **F1** (éditeur : nouveaux blocs/cockpits/galeries + perte contexte) · **F3** (NL_NEW nouveau bloc) · **F12** (Retour → accueil empilé) · **F17** (pop-up réglages hors bloc) · **F15** (intake photo hors workspace) · **F13** (message plein au lieu de toast) · partiellement **F4/F5** (écrans externes galerie/réf).

### (b) BLOQUE le futur MODE AUTOMATIQUE
**F2** (moteur : génération/maquette/résultats/export — indispensable pour générer sans intervention) · **F1** (réglages montage doivent être programmables, pas manuels) · **F5** (réf active non ambiguë) · **F8** (pour QUI on génère) · **F6** (modèle de style auto) · **F10** (auditabilité/reprise après échec) · projection **`project.json`** (E93–E96) au-dessus de `proj`.

### (c) DETTE TECHNIQUE INTERNE (peu visible utilisateur)
**F16** (ancien flux anglais `MM_*` → à supprimer) · **F14** (commandes doublons) · **F18** (menus annexes) · **F9** (navigateur fichiers) · **F7** (décors doublon) · **F6** (côté stockage) · **F11** (mécanique d'export, hors livrable visible).

*(Une frontière peut apparaître dans plusieurs seaux : F1 est en (a) ET (b) ; F2 surtout (b) ; F5 en (a) ET (b).)*

---

## (4) CHECKLIST DE VALIDATION EN CONDITIONS RÉELLES (AVANT migrations)

> Format : **action → résultat attendu → règle/contexte vérifié**. À exécuter à sec (aucune dépense) sauf items marqués 💲.

### PHOTO
1. Créer un projet (Nouveau look) → 1 bloc workspace s'ouvre, en-tête `📁/👗/🎯/✍️/📝` visible → bloc unique + contexte (E105/E114).
2. Changer le look (Tenue/Décor cyclage) → vignette+caption se mettent à jour **dans le même bloc** → E109.
3. Conserver le décor : changer Tenue puis revenir → le décor choisi est conservé → slice look (E114).
4. Conserver la référence : définir une réf (galerie/upload) → l'en-tête `🎯 Réf` la montre partout et après navigation → E114 + persistance.
5. Générer 1 image 💲 → confirmation in-bloc → résultat **dans le bloc** (pas de nouveau message) → E105.
6. Générer 2/3 images 💲 → navigation ‹ › + sélection **dans le bloc** → E105/E114.
7. Éditer une image (🎨) → l'éditeur s'ouvre **dans le bloc** et **revient** au workspace, contexte intact → **F1 (aujourd'hui : ÉCHEC attendu)**.
8. Retour arrière IMAGE→LOOK→(réf/prompt) → chaque slice rechargé exact → E114.
9. Reprise de session : `/restart` puis RÉCENTS›Reprendre → rouvre à la bonne étape, look/réf/prompt intacts → E113/E114.

### VIDÉO
10. Image→Vidéo (🎬 Faire une vidéo) → même bloc devient VIDÉO·Source, média actif affiché → E105/contexte.
11. Plusieurs images → vidéo : sélectionner l'image validée comme source → cohérent → slice.
12. Changer le look pendant la vidéo → média actif mis à jour, script aval conservé → E115.
13. Conservation du contexte Vidéo↔Photo (aller-retour) → réf/look/prompt/script intacts → E114.
14. Script : éditer / charger biblio / enregistrer → slice `video.script` à jour, in-bloc → E105/E114.
15. Génération vidéo 💲 → coût + **confirmation obligatoire** in-bloc ; rien sans accord → règle dépense.
16. Export / livrables → fichier livré, légende/тags présents → **F2/F11 (à valider)**.
17. Prêt à poster → retrouver et livrer la vidéo → **F11**.

### STUDIO (mémoire métier)
18. Looks : ouvrir, naviguer, choisir, (dup/archive/lock) → reste en cockpit → **F4**.
19. Références : voir/définir LA réf active (une seule source) → **F5**.
20. Décors : liste/choix cohérents avec `PL_ENV` (pas de doublon contradictoire) → **F7**.
21. Personas : voir/sélectionner ; le projet suit le bon persona → **F8**.
22. Médias : consulter les fichiers produits → **F9**.
23. Modèles : sauver/charger un style appliqué au montage → **F6**.
24. Historique : retrouver une production, la rouvrir → **F10**.

### NAVIGATION
25. `/menu` → 1 bloc accueil (navigate), pas d'empilement → E111.
26. Accueil → sections (PHOTO/VIDÉO/STUDIO/RÉCENTS) en place → E109.
27. Retour : ⬅ depuis tout écran → revient sans créer de bloc → **F12 (legacy : ÉCHEC attendu)**.
28. Changement de section en cours de projet → projet conservé, pas de reset → E114.
29. Reprise après interruption (/restart, /stop) → état exact, même brouillon → E113.
30. Aide (❓) sur un écran workspace → rendue dans le bloc, pas d'écran parasite → E112.
31. Envoyer une photo spontanément → proposée comme look/réf **dans le contexte** → **F15 (aujourd'hui : menu externe)**.

### MODE AUTOMATIQUE (projection — à valider quand bâti)
32. Lancer « tout auto » depuis un look → génère image→vidéo→export **sans intervention** → fondation F2.
33. Conservation des sources de vérité pendant l'auto (réf/look/prompt/script/persona) → `proj` unique.
34. Reprise après échec en cours d'auto → reprend à l'étape échouée, sans repartir de zéro → F2/F10.
35. Auditabilité : chaque étape tracée (entrées, coûts, sorties) → logs + `project.json` (E93–E96).
36. Logs : `bot_journal.log` reflète create/edit/close + opérations → présent.
37. Coûts : récap + confirmation avant chaque dépense, total cumulé visible → règle dépense.
38. Historique : la production auto apparaît, rouvrable → F10.

---

## (5) CONTRÔLE DE COMPLÉTUDE — frontières au-delà de F1–F14

Re-parcours du dispatch + des `send()/cardMenu()/cockpit*`. **4 frontières non listées initialement, ajoutées** :
- **F15** — Intake photo global (`pendingPhotoId`, `ADD_LOOK/ADD_LOOK_AVATAR/ADD_IGNORE/REF_SET`, `msg.photo` → « Photo reçue »).
- **F16** — Ancien flux maquette anglais `MM_*` + états `m_topic/script/upload_wait` + `showSettings` (probablement résiduel → supprimer).
- **F17** — Pop-up « réglages du look » `LS_REUSE/LS_BASE/LS_KEEP` (`maybeAskLookStyle`, cardMenu).
- **F18** — Menus annexes `showSettings/HOME_PROFIL/MENU_HELP/MENU_TECH/CARD_MORE/showCover`.

Également relevé (défaut du module **cible**, pas une frontière legacy) : **B1** `photo.image` fallback texte (P0 hotfix).
Confirmé **couvert** par F1–F14 : tout `EDIT_*/IMG_*/S_*/ZM_*/RE_*/GLP_*` (F1), `RC_*/GJ_*/GF_*/RES_*/MENU_GEN/TEST/COVER_*/SCRIPT_OK/SAVE_VID/GEN_KEEP/GEN_RESET/T_AUTO` (F2), `NL_*/CL_*` (F3), `GAL_*/GGRID/MENU_LOOKS` (F4), `REF_*` (F5), commandes (F14). **Aucune autre frontière critique trouvée.**

---

_Analyse produit + checklist. Aucune migration tant qu'Etoile n'a pas tranché l'ordre. — 2026-06-10_

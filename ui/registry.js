// [L0-1] REGISTRE DE BLOCS (E105/E106/E107) — squelette modulaire.
// Chaque module : { id, parent, title, owner, render(ctx)->{caption,rows} }.
// rows = tableaux de boutons ; un bouton a SOIT { text, go:'<idBloc>' } (naviguer vers un autre bloc
// du registre, via le routeur) SOIT { text, cb:'<callback_existant>' } (déléguer à l'ancien dispatch
// = strangler-fig : on ne casse rien tant qu'un sous-écran n'est pas migré).
// AUCUN état ici : tout passe par ctx (injecté par le routeur).

const REGISTRY = {
  // ── Accueil : 4 entrées directes + pilotage visible (E104) ─────────────────
  home: {
    id: 'home', parent: null, title: '🏠 ACCUEIL', owner: 'Système',
    render: () => ({
      caption: '🏠 <b>ACCUEIL</b> — choisis une section :',
      rows: [
        [{ text: '📸 PHOTO', go: 'photo' }, { text: '🎬 VIDÉO', go: 'video' }],
        [{ text: '🏛 STUDIO', go: 'studio' }, { text: '🕘 RÉCENTS', go: 'recents' }],
        [{ text: '🛑 Stop', cb: 'TECH_STOP' }, { text: '🔄 Restart', cb: 'TECH_RESTART' }, { text: '❓ Aide', cb: 'MENU_HELP' }],
      ],
    }),
  },

  // ── 📸 PHOTO : création image / look ───────────────────────────────────────
  photo: {
    id: 'photo', parent: 'home', title: '📸 PHOTO', owner: 'PHOTO',
    render: () => ({
      caption: '📸 <b>PHOTO</b> — créer une image / un look',
      rows: [
        [{ text: '✨ Nouveau look', cb: 'NL_NEW' }],
        [{ text: '🖼 Galerie looks', cb: 'MENU_LOOKS' }],
        [{ text: '🏛 Décors', cb: 'STUDIO_DECORS' }],
      ],
    }),
  },

  // ── 🎬 VIDÉO : création vidéo ──────────────────────────────────────────────
  video: {
    id: 'video', parent: 'home', title: '🎬 VIDÉO', owner: 'VIDÉO',
    render: () => ({
      caption: '🎬 <b>VIDÉO</b> — créer une vidéo (script · montage)',
      rows: [
        [{ text: '🎬 Nouvelle vidéo', cb: 'NEW_GO' }],
        [{ text: '🎨 Éditer / Montage', cb: 'EDIT_HOME' }],
      ],
    }),
  },

  // ── 🏛 STUDIO : bibliothèque / ressources / gestion ───────────────────────
  studio: {
    id: 'studio', parent: 'home', title: '🏛 STUDIO', owner: 'STUDIO',
    render: () => ({
      caption: '🏛 <b>STUDIO</b> — bibliothèque, ressources & gestion',
      rows: [
        [{ text: '👗 Looks', cb: 'MENU_LOOKS' }, { text: '🏛 Décors', cb: 'STUDIO_DECORS' }],
        [{ text: '🎯 Références', cb: 'RX_REFS' }, { text: '📂 Modèles', cb: 'SHOWSTYLES' }],
        [{ text: '👤 Personas', cb: 'PERSONA' }, { text: '📁 Médias', cb: 'FILES_HOME' }],
      ],
    }),
  },

  // ── 🕘 RÉCENTS : historique / projets ─────────────────────────────────────
  recents: {
    id: 'recents', parent: 'home', title: '🕘 RÉCENTS', owner: 'RÉCENTS',
    render: () => ({
      caption: '🕘 <b>RÉCENTS</b> — historique & projets',
      rows: [
        [{ text: '🕘 Historique', cb: 'STUDIO_HIST' }],
        [{ text: '📤 Prêt à poster', cb: 'SHOWREADY' }],
      ],
    }),
  },
};

module.exports = { REGISTRY };

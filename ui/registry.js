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
    help: 'Trois choix : ✨ Générer un nouveau contenu · 📂 Reprendre un projet · 📤 Importer une photo. La bibliothèque (looks, décors, références, historique) est dans 🏛 Studio (accessible plus bas).',
    render: () => ({
      // [C5] Premier niveau = EXACTEMENT 3 choix ; une action attendue claire.
      caption: '<b>Que veut-on faire ?</b>',
      rows: [
        [{ text: '✨ Générer un nouveau contenu', go: 'photo.look' }],
        [{ text: '📂 Reprendre un projet', cb: 'RX_DRAFTS' }],
        [{ text: '📤 Importer une photo', cb: 'HOME_UPLOAD' }],
        [{ text: '🏛 Studio', go: 'studio' }],
      ],
    }),
  },

  // ── 📸 PHOTO : création image / look ───────────────────────────────────────
  photo: {
    id: 'photo', parent: 'home', title: '📸 PHOTO', owner: 'PHOTO',
    help: 'Crée une image / un look : ✨ Nouveau look ouvre le workspace (Look → Image), 📂 Reprendre un projet rouvre un brouillon. La bibliothèque (galerie de looks, décors) est dans 🏛 STUDIO.',
    render: () => ({
      caption: '📸 <b>PHOTO</b> — créer une image / un look',
      rows: [
        [{ text: '✨ Nouveau look', go: 'photo.look' }],   // [L0-2a] workspace média (slice brouillon), pas de reset implicite
        [{ text: '📂 Reprendre un projet', cb: 'RX_DRAFTS' }], // [L0-2a-ter] projet actif récupérable depuis PHOTO
      ],
    }),
  },

  // ── 🎬 VIDÉO : création vidéo ──────────────────────────────────────────────
  video: {
    id: 'video', parent: 'home', title: '🎬 VIDÉO', owner: 'VIDÉO',
    help: 'Crée une vidéo : 🎬 Nouvelle vidéo ouvre le workspace (Source → Script → Montage → Légende → Export) à partir du média actif. 🎨 Éditer / Montage = éditeur avancé.',
    render: () => ({
      caption: '🎬 <b>VIDÉO</b> — créer une vidéo (source · script · montage · export)',
      rows: [
        [{ text: '🎬 Nouvelle vidéo', go: 'video.source' }], // [L0-2b] workspace média adossé au draft/proj
        [{ text: '🎨 Éditer / Montage', cb: 'EDIT_HOME' }],
      ],
    }),
  },

  // ── 🏛 STUDIO : bibliothèque / ressources / gestion ───────────────────────
  studio: {
    id: 'studio', parent: 'home', title: '🏛 STUDIO', owner: 'STUDIO',
    help: 'Bibliothèque & gestion : 👗 Looks, 🏛 Décors, 🎯 Références, 📂 Modèles, 👤 Personas, 📁 Médias. C\'est ici qu\'on range et réutilise les ressources.',
    render: () => ({
      caption: '🏛 <b>STUDIO</b> — bibliothèque, ressources & gestion',
      rows: [
        [{ text: '👗 Looks', cb: 'MENU_LOOKS' }, { text: '🏛 Décors', cb: 'STUDIO_DECORS' }],
        [{ text: '🎯 Références', cb: 'RX_REFS' }, { text: '📂 Modèles', cb: 'SHOWSTYLES' }],
        [{ text: '📝 Prompts', go: 'studio.prompts' }, { text: '👤 Personas', cb: 'PERSONA' }],
        [{ text: '📁 Médias', cb: 'FILES_HOME' }],
      ],
    }),
  },

  // ── 🕘 RÉCENTS : historique / projets ─────────────────────────────────────
  recents: {
    id: 'recents', parent: 'home', title: '🕘 RÉCENTS', owner: 'RÉCENTS',
    help: 'Reprends le travail récent : 🕘 Historique des générations, 📤 Prêt à poster.',
    render: () => ({
      caption: '🕘 <b>RÉCENTS</b> — historique & projets',
      rows: [
        [{ text: '📝 Reprendre (brouillons)', cb: 'RX_DRAFTS' }],
        [{ text: '🕘 Historique', cb: 'STUDIO_HIST' }],
        [{ text: '📤 Prêt à poster', cb: 'SHOWREADY' }],
      ],
    }),
  },
};

module.exports = { REGISTRY };

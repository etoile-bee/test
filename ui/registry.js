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
    help: 'UN SEUL moteur de production, deux entrées : 📸 PHOTO démarre au début (Référence/Look) et s\'enchaîne jusqu\'au Prêt-à-poster ; 🎬 VIDÉO rejoint le MÊME parcours au stade vidéo (choisis juste la source). 🏛 STUDIO = bibliothèque (consulter/organiser, sans casser le projet en cours). 🕘 HISTORIQUE = projets/exports passés. 👗 LOOKS = raccourci vers la bibliothèque de looks.',
    render: () => ({
      // [P4] MENU PRINCIPAL = 4 entrées. Production (PHOTO/VIDÉO, même moteur) + STUDIO (bibliothèques) + RÉCENTS (reprendre).
      caption: '<b>Que veut-on faire ?</b>',
      rows: [
        [{ text: '📸 PHOTO', go: 'photo.look' }, { text: '🎬 VIDÉO', go: 'video.source' }],
        [{ text: '🏛 STUDIO', go: 'studio' }, { text: '🕘 RÉCENTS', go: 'recents' }],
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
    help: 'Bibliothèque & archives (non destructif) : Looks, Historique, Photos, Vidéos, Prêt-à-poster, Références, Décors, Modèles, Prompts, Personas. On consulte/réutilise sans casser le projet en cours.',
    render: () => ({
      caption: '🏛 <b>STUDIO</b> — bibliothèque & archives',
      rows: [
        [{ text: '👗 Looks', go: 'studio.looks' }, { text: '🕘 Historique', go: 'studio.historique' }],
        [{ text: '🖼 Photos', go: 'studio.photos' }, { text: '🎬 Vidéos', go: 'studio.videos' }],
        [{ text: '📤 Prêt à poster', go: 'studio.posted' }, { text: '🎯 Références', go: 'studio.references' }],
        [{ text: '🌆 Décors', go: 'studio.decors' }, { text: '📂 Modèles', go: 'studio.modeles' }],
        [{ text: '📝 Prompts', go: 'studio.prompts' }, { text: '👤 Personas', go: 'studio.personas' }],
      ],
    }),
  },

  // ── 🕘 RÉCENTS : historique / projets ─────────────────────────────────────
  recents: {
    id: 'recents', parent: 'home', title: '🕘 RÉCENTS', owner: 'RÉCENTS',
    help: 'Reprends un projet en cours (brouillon) exactement où tu l\'avais laissé. Les archives (historique, photos, vidéos, prêt-à-poster) sont dans 🏛 STUDIO.',
    render: () => ({
      caption: '🕘 <b>RÉCENTS</b> — reprendre un projet',
      rows: [
        [{ text: '📂 Reprendre un projet', cb: 'RX_DRAFTS' }],
        [{ text: '🏛 Voir les archives (Studio)', go: 'studio' }],
      ],
    }),
  },
};

module.exports = { REGISTRY };

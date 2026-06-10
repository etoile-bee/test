// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] BIBLIOTHÈQUES & VUES (STUDIO + RÉCENTS/HISTORIQUE/PRÊT-À-POSTER) — rendu PUR in-bloc.
//   Invariants :
//     - STUDIO = UNIQUEMENT bibliothèques (Looks·Références·Scripts·Prompts·Médias·Projets archivés) — design C.7
//     - CONSULTER ne modifie JAMAIS le projet actif (verrou 6) : un tap sur une vignette OUVRE un détail (LV_),
//       il n'applique RIEN ; appliquer exige une action EXPLICITE séparée (LA_) — corrige l'aggravateur A1 (1-tap)
//     - SOURCE DE DONNÉES UNIQUE (E121) : RÉCENTS/HISTORIQUE/PRÊT-À-POSTER = FILTRES du même magasin projets
//     - retour = RESUME (revient EXACTEMENT à l'étape du projet en cours) — design C.3
//     - grilles 6/écran (E22/E36/E53) ; textes courts (verrou 8)
//   PUR : reçoit les données (listes), ne fait pas d'I/O.
// ─────────────────────────────────────────────────────────────────────────────

const GRID_PAGE = 6;
function short(s, n) { s = String(s == null ? '' : s); return s.length > (n || 22) ? s.slice(0, (n || 22) - 1) + '…' : s; }
function resumeRow() { return [{ text: '◀ Retour au projet', cb: 'RESUME' }]; }

// STUDIO — menu des bibliothèques (CRUD complet géré dans chaque biblio : E15-E34, E100-E101).
function studio() {
  return {
    media: null, raw: true, caption: '🏛 <b>STUDIO</b> — bibliothèques',
    rows: [
      [{ text: '👗 Looks', go: 'lib.looks' }, { text: '🎯 Références', go: 'lib.refs' }],
      [{ text: '✍️ Scripts', go: 'lib.scripts' }, { text: '✍️ Prompts', go: 'lib.prompts' }],
      [{ text: '📁 Médias', go: 'lib.medias' }, { text: '🗄 Projets archivés', go: 'lib.archives' }],
      resumeRow(),
    ],
  };
}

// GRILLE bibliothèque 6/écran (E22/E36/E53). items = [{label, img}]. Tap = CONSULTER (ouvre détail LV_), pas appliquer.
function grid(key, items, page) {
  items = items || [];
  const pages = Math.max(1, Math.ceil(items.length / GRID_PAGE));
  let pg = page || 0; if (pg >= pages) pg = pages - 1; if (pg < 0) pg = 0;
  const slice = items.slice(pg * GRID_PAGE, pg * GRID_PAGE + GRID_PAGE);
  const cap = '<b>' + key.toUpperCase() + '</b> · ' + items.length + (pages > 1 ? (' · p' + (pg + 1) + '/' + pages) : '') + '\n<i>Consultation — touche pour voir.</i>';
  const rows = [];
  for (let i = 0; i < slice.length; i += 2) {
    rows.push(slice.slice(i, i + 2).map((it, j) => ({ text: short(it.label, 20), cb: 'LV_' + key + '_' + (pg * GRID_PAGE + i + j) })));
  }
  if (pages > 1) rows.push([{ text: '‹', cb: 'LP_' + key + '_' + (pg - 1) }, { text: 'p' + (pg + 1) + '/' + pages, cb: 'NOOP' }, { text: '›', cb: 'LP_' + key + '_' + (pg + 1) }]);
  rows.push(resumeRow());
  const firstImg = slice.map(it => it.img).find(Boolean);
  return { media: firstImg || null, raw: true, caption: cap, rows: rows };
}

// DÉTAIL d'un élément : consultation + APPLICATION EXPLICITE (verrou 6). Jamais d'application au simple parcours.
function detail(key, idx, item) {
  return {
    media: (item && item.img) || null, raw: true,
    caption: '<b>' + short((item && item.label) || key, 28) + '</b>\n<i>Consultation. « Appliquer » l\'ajoute au projet.</i>',
    rows: [
      [{ text: '✅ Appliquer au projet', cb: 'LA_' + key + '_' + idx }],   // action EXPLICITE
      [{ text: '◀ Liste', cb: 'LB_' + key }, { text: '◀ Retour au projet', cb: 'RESUME' }],
    ],
  };
}

// VUE PROJETS (RÉCENTS/HISTORIQUE/PRÊT-À-POSTER) — FILTRES du magasin unique (E121). projects = sortie project_store.
function projectsView(title, projects, openPrefix) {
  projects = projects || [];
  const rows = projects.slice(0, 12).map(p => [{
    text: short((p.name || p.projectId), 24) + ' · ' + (p.statut_qualite || '') + (p.statut_publication && p.statut_publication !== 'aucun' ? ('/' + p.statut_publication) : ''),
    cb: (openPrefix || 'OPEN') + '_' + p.projectId,
  }]);
  if (!projects.length) rows.push([{ text: '(vide)', cb: 'NOOP' }]);
  rows.push([{ text: '🏠 Accueil', cb: 'HOME' }]);
  return { media: null, raw: true, caption: '<b>' + title + '</b> · ' + projects.length, rows: rows };
}

// RÉCENTS = vue filtrée (E121) — sous-titre explicite que c'est une VUE, pas une entité.
function recents(projects) { return projectsView('🕘 RÉCENTS (vue de l\'Historique)', projects, 'OPEN'); }
function historique(projects) { return projectsView('🕘 HISTORIQUE (mémoire complète)', projects, 'OPEN'); }
function pretAPoster(projects) { return projectsView('📤 PRÊT-À-POSTER (file)', projects, 'OPEN'); }

module.exports = { GRID_PAGE, studio, grid, detail, projectsView, recents, historique, pretAPoster };

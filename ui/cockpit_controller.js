// ─────────────────────────────────────────────────────────────────────────────
// [cockpit-v4] CONTRÔLEUR D'ÉTAT — orchestre store + flow + view + lib + block.
//   GARDE-FOU E122 : l'UI ne détient QUE des POINTEURS reconstructibles {projectId, flow, step, candIdx, libKey, libPage, picker}.
//   TOUT l'état critique (média actif, paramètres, statuts, candidats, QC) vit dans le MANIFEST (store) — jamais ici.
//   dispatch(action) lit/écrit le store, met à jour les pointeurs, renvoie { render, notice? }.
//   PUR vis-à-vis de Telegram : aucune I/O réseau ; le store (filesystem) est la source de vérité.
//   Hooks injectés : generate(flow,manifest)->[relPaths] (génération réelle, branchée au câblage),
//                    libItems(key)->[{label,img,apply}] (données bibliothèque).
// ─────────────────────────────────────────────────────────────────────────────
const FLOW = require('./cockpit_flow');
const VIEW = require('./cockpit_view');
const LIB = require('./cockpit_lib');

function createController(deps) {
  const base = deps.base, persona = deps.persona || 'default';
  const S = deps.store;                       // = ui/project_store
  const generate = deps.generate || (() => []); // défaut : pas de génération (branchée au câblage réel)
  const libItems = deps.libItems || (() => []);
  const nowv = () => (typeof deps.now === 'function' ? deps.now() : deps.now); // horodatage (valeur), injectable pour tests

  // === SEUL ÉTAT D'UI : des pointeurs (E122). Aucune donnée métier ici. ===
  const ui = { projectId: null, flow: null, step: 'home', candIdx: 0, libKey: null, libPage: 0, picker: null };

  function manifest() { return ui.projectId ? S.loadManifest(base, persona, ui.projectId) : null; }

  // Ouvre/crée le projet actif d'un flux ; l'étape est RECONSTRUITE depuis le manifest (E122 : pointeur dérivable).
  function ensureProject(flow) {
    let cur = S.currentProject(base, persona);
    if (!cur) { cur = { projectId: S.createProject(base, persona, {}, nowv()).projectId }; }
    ui.projectId = cur.projectId; ui.flow = flow; ui.candIdx = 0; ui.picker = null;
    ui.step = FLOW.resumeStep(flow, manifest());
  }

  function renderStep() {
    const m = manifest() || {};
    if (ui.step === 'source' && m.image_candidates && m.image_candidates.length) {
      // affiche le candidat courant (pointeur candIdx) — la LISTE est dans le manifest, pas dans l'UI
      const idx = Math.max(0, Math.min(ui.candIdx, m.image_candidates.length - 1));
      const view = VIEW.view(ui.flow, 'source', Object.assign({}, m, { media_actif: m.media_actif || m.image_candidates[idx] }));
      return view;
    }
    return VIEW.view(ui.flow, ui.step, m);
  }

  function render() {
    if (ui.step === 'home') return VIEW.home();
    if (ui.step === 'studio') return LIB.studio();
    if (ui.step === 'recents') return LIB.recents(S.viewRecents(base, persona));
    if (ui.step === 'historique') return LIB.historique(S.viewHistorique(base, persona));
    if (ui.step === 'pretaposter') return LIB.pretAPoster(S.viewPretAPoster(base, persona));
    if (ui.step === 'lib') return LIB.grid(ui.libKey, libItems(ui.libKey), ui.libPage);
    if (ui.step === 'libdetail') { const it = libItems(ui.libKey)[ui.candIdx] || {}; return LIB.detail(ui.libKey, ui.candIdx, it); }
    if (ui.step === 'picker') return pickerView(ui.picker, manifest());
    return renderStep();
  }

  function pickerView(field, m) {
    // picker focalisé in-bloc (1 décision) ; les options réelles viendront du câblage (lookbook/biblio).
    return { media: FLOW.previewMedia(m), raw: true, caption: '✏️ <b>' + field + '</b> — choisis :', rows: [[{ text: '◀ Retour', cb: 'BACK' }]] };
  }

  // ── DISPATCH ──
  function dispatch(action) {
    const a = String(action || '');
    let notice = null;

    // Navigation racine
    if (a === 'go:photo') { ensureProject('photo'); return { render: render() }; }
    if (a === 'go:video') { ensureProject('video'); return { render: render() }; }
    if (a === 'go:studio' || a === 'studio') { ui.step = 'studio'; return { render: render() }; }
    if (a === 'go:recents' || a === 'recents') { ui.step = 'recents'; return { render: render() }; }
    if (a === 'go:historique') { ui.step = 'historique'; return { render: render() }; }
    if (a === 'go:pretaposter') { ui.step = 'pretaposter'; return { render: render() }; }
    if (a === 'HOME') { ui.flow = null; ui.step = 'home'; ui.picker = null; return { render: render() }; }
    if (a === 'RESUME') { ui.picker = null; ui.step = ui.flow ? FLOW.resumeStep(ui.flow, manifest()) : 'home'; return { render: render() }; }
    if (a === 'BACK') {
      if (ui.picker) { ui.picker = null; ui.step = 'parametres'; return { render: render() }; }
      if (ui.step === 'libdetail') { ui.step = 'lib'; return { render: render() }; }
      const p = FLOW.prevStep(ui.step); ui.step = p || 'home'; if (!p) ui.flow = null; return { render: render() };
    }

    // Ouvrir un projet existant (depuis RÉCENTS/HISTORIQUE) — pointeur projectId, étape reconstruite
    if (a.indexOf('OPEN_') === 0) {
      ui.projectId = a.slice(5); const m = manifest();
      ui.flow = (m && m.scripts && m.scripts.length) ? 'video' : 'photo';
      ui.step = FLOW.resumeStep(ui.flow, m); return { render: render() };
    }

    // Nombre d'images (E35) — ÉCRIT dans le manifest (jamais dans l'UI)
    if (a.indexOf('NB_') === 0) {
      const n = parseInt(a.slice(3), 10) || 1; const m = manifest(); if (m) { m.parametres.nb_images = n; S.saveManifest(base, persona, ui.projectId, m, nowv()); }
      return { render: render() };
    }

    // Génération source (réelle au câblage) -> écrit les candidats DANS le manifest
    if (a === 'SRC_NEW' || a === 'VSRC_NEW') {
      const m = manifest(); const cands = generate(ui.flow, m) || [];
      if (cands.length) { m.image_candidates = cands; ui.candIdx = 0; S.saveManifest(base, persona, ui.projectId, m, nowv()); }
      else notice = 'Génération branchée au câblage.';
      return { render: render(), notice };
    }
    if (a === 'CAND_PREV') { ui.candIdx = Math.max(0, ui.candIdx - 1); return { render: render() }; }
    if (a === 'CAND_NEXT') { const m = manifest(); const n = (m.image_candidates || []).length; ui.candIdx = Math.min(n - 1, ui.candIdx + 1); return { render: render() }; }
    if (a === 'CAND_PICK') {
      // SÉLECTION EXPLICITE -> média validé devient média ACTIF dans le dossier (propagation C.4/E37)
      const m = manifest(); const rel = (m.image_candidates || [])[ui.candIdx];
      if (rel) S.setActiveMedia(base, persona, ui.projectId, rel, 'image', nowv());
      return { render: render(), notice: '✅ Image active' };
    }

    // Paramètres : ouvrir un picker focalisé (1 décision) — pas de surcharge
    if (a.indexOf('P_') === 0) { ui.picker = a.slice(2).toLowerCase(); ui.step = 'picker'; return { render: render() }; }

    // QC (C4/E92) — ENREGISTRÉ dans le dossier + rapport QC (jamais en UI)
    if (a === 'QC_RUN') { S.recordQC(base, persona, ui.projectId, 'ok', { identite: true, coherence: true, reference: true, look: true }, 'auto', nowv()); return { render: render() }; }
    if (a === 'QC_FORCE') { S.recordQC(base, persona, ui.projectId, 'force', { force: true }, 'Etoile', nowv()); return { render: render() }; }
    if (a === 'QC_REGEN') { ui.step = 'source'; return { render: render(), notice: 'Régénérer la source' }; }
    if (a === 'QC_EDIT') { ui.step = 'parametres'; return { render: render(), notice: 'Édition' }; }

    // VALIDER (C1) — gate basé sur le MÉDIA RÉEL ; avance ou finalise
    if (a === 'V') {
      const r = FLOW.validate(ui.flow, ui.step, manifest());
      if (!r.ok) return { render: render(), notice: r.reason };
      if (r.action === 'finaliser') {
        const m = manifest(); m.statut_qualite = r.effect.statut_qualite; m.statut_publication = r.effect.statut_publication;
        S.saveManifest(base, persona, ui.projectId, m, nowv());
        return { render: render(), notice: '🚀 Final HD (branché au câblage)' };
      }
      ui.step = r.next; return { render: render() };
    }
    if (a === 'V_LOCK') { return { render: render(), notice: 'Choisis d\'abord.' }; }

    // Bibliothèques : consulter (LV_) ≠ appliquer (LA_) — verrou 6 / anti-A1
    if (a.indexOf('LP_') === 0) { const parts = a.split('_'); ui.libKey = parts[1]; ui.libPage = parseInt(parts[2], 10) || 0; ui.step = 'lib'; return { render: render() }; }
    if (a.indexOf('LV_') === 0) { const parts = a.split('_'); ui.libKey = parts[1]; ui.candIdx = parseInt(parts[2], 10) || 0; ui.step = 'libdetail'; return { render: render() }; }
    if (a.indexOf('LB_') === 0) { ui.libKey = a.slice(3); ui.step = 'lib'; return { render: render() }; }
    if (a.indexOf('LA_') === 0) {
      // APPLICATION EXPLICITE -> écrit dans le manifest (look), retour exact au projet
      const parts = a.split('_'); const key = parts[1]; const idx = parseInt(parts[2], 10) || 0;
      const it = libItems(key)[idx]; const m = manifest();
      if (it && m) { if (typeof it.apply === 'function') it.apply(m); else { m.look = m.look || {}; m.look.tenue = it.label; } S.saveManifest(base, persona, ui.projectId, m, nowv()); }
      ui.step = ui.flow ? FLOW.resumeStep(ui.flow, manifest()) : 'home'; return { render: render(), notice: '✅ Appliqué' };
    }

    return { render: render(), notice: null };
  }

  return { ui, dispatch, render, _ensureProject: ensureProject };
}

module.exports = { createController };

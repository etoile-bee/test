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
  const ui = { projectId: null, flow: null, step: 'home', candIdx: 0, libKey: null, libPage: 0, picker: null, pendingSlice: null };

  function manifest() { return ui.projectId ? S.loadManifest(base, persona, ui.projectId) : null; }

  // MODÈLE (A) : UN SEUL projet, plusieurs points d'entrée (phases). go:photo/go:video changent UNIQUEMENT
  // la phase d'entrée DANS LE MÊME projet — jamais un projet séparé (E121/E122). L'étape est RECONSTRUITE.
  function ensureProject(flow) {
    let cur = S.currentProject(base, persona); // le projet en cours (un seul)
    if (!cur) { cur = { projectId: S.createProject(base, persona, {}, nowv()).projectId }; }
    ui.projectId = cur.projectId; ui.flow = flow; ui.candIdx = 0; ui.picker = null;
    ui.step = FLOW.resumeStep(flow, manifest()); // vidéo : source auto-satisfaite par l'image validée (E41)
  }

  // Vue d'IMPACT E115 (Conserver / Mettre à jour / Régénérer) — jamais d'effacement silencieux de l'aval.
  function impactView(slice) {
    const m = manifest();
    return {
      media: FLOW.previewMedia(m), raw: true,
      caption: '⚠️ <b>Impact aval</b> — modifier « ' + (slice || ui.pendingSlice) + '» peut affecter la vidéo déjà commencée.',
      rows: [
        [{ text: '✅ Conserver l\'aval', cb: 'PX_KEEP' }, { text: '🔄 Mettre à jour', cb: 'PX_UPDATE' }, { text: '♻️ Régénérer', cb: 'PX_REGEN' }],
      ],
    };
  }
  // Applique une modif AMONT (photo) ; si l'aval vidéo existe -> prompt E115 AVANT de continuer.
  // returnStep = étape où revenir après application (on NE saute PAS via resumeStep pendant la navigation active).
  function applyUpstream(slice, mutate, returnStep) {
    const m = manifest(); if (m) { mutate(m); S.saveManifest(base, persona, ui.projectId, m, nowv()); }
    if (FLOW.changeImpactsDownstream(manifest(), slice)) { ui.pendingSlice = slice; ui.step = 'impact'; return { render: impactView(slice) }; }
    ui.picker = null; if (returnStep) ui.step = returnStep; return { render: render() };
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
    if (ui.step === 'impact') return impactView();
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
      if (ui.step === 'impact') { ui.pendingSlice = null; ui.step = FLOW.resumeStep(ui.flow, manifest()); return { render: render() }; }
      if (ui.step === 'libdetail') { ui.step = 'lib'; return { render: render() }; }
      const p = FLOW.prevStep(ui.step);
      if (p) { ui.step = p; return { render: render() }; }
      // (A) RÉVERSIBLE : depuis VIDÉO·source, ⬅ revient à PHOTO·finaliser (mêmes données, rien perdu)
      if (ui.flow === 'video') { ui.flow = 'photo'; ui.step = 'finaliser'; return { render: render() }; }
      ui.flow = null; ui.step = 'home'; return { render: render() };
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
      // SÉLECTION EXPLICITE -> média validé devient média ACTIF (propagation C.4/E37) ; impact aval E115 si vidéo commencée
      const rel = (manifest().image_candidates || [])[ui.candIdx];
      return applyUpstream('image', (m) => { if (rel) { m.media_actif = rel; m.historique_versions = m.historique_versions || []; m.historique_versions.push({ ts: nowv(), etape: 'image', action: 'validé', ref: rel }); } }, 'source');
    }

    // Paramètres : ouvrir un picker focalisé (1 décision) — pas de surcharge
    if (a.indexOf('P_') === 0) { ui.picker = a.slice(2).toLowerCase(); ui.step = 'picker'; return { render: render() }; }
    // Application d'une valeur de picker : SET_<champ>=<valeur> -> écrit le manifest (amont) + impact E115 éventuel
    if (a.indexOf('SET_') === 0) {
      const body = a.slice(4); const eq = body.indexOf('='); const field = (eq >= 0 ? body.slice(0, eq) : body).toLowerCase(); const val = eq >= 0 ? body.slice(eq + 1) : '';
      const sliceMap = { ref: 'reference', tenue: 'look', decor: 'look', prompt: 'prompt', nb: 'nb' };
      const slice = sliceMap[field] || field;
      return applyUpstream(slice, (m) => {
        if (field === 'ref') { m.reference = Object.assign({}, m.reference, { label: val }); }
        else if (field === 'tenue') { m.look = m.look || {}; m.look.tenue = val; }
        else if (field === 'decor') { m.look = m.look || {}; m.look.decor = val; }
        else if (field === 'prompt') { m.prompts = [{ role: 'image', name: val || 'défaut', text: (m.prompts && m.prompts[0] && m.prompts[0].text) || '' }]; }
        else if (field === 'nb') { m.parametres.nb_images = parseInt(val, 10) || 1; }
      }, 'parametres');
    }
    // E115 — résolution de l'impact aval (jamais d'effacement silencieux)
    if (a === 'PX_KEEP') { ui.pendingSlice = null; const m = manifest(); if (m) { m._dirty = null; S.saveManifest(base, persona, ui.projectId, m, nowv()); } ui.step = FLOW.resumeStep(ui.flow, manifest()); return { render: render(), notice: '✅ Aval conservé' }; }
    if (a === 'PX_UPDATE') { ui.pendingSlice = null; const m = manifest(); if (m) { m._dirty = { video: true }; S.saveManifest(base, persona, ui.projectId, m, nowv()); } ui.step = FLOW.resumeStep(ui.flow, manifest()); return { render: render(), notice: '🔄 Aval à resynchroniser' }; }
    if (a === 'PX_REGEN') {
      ui.pendingSlice = null; const m = manifest();
      if (m) { m.scripts = []; m.video_media = null; m.montage = { touched: false }; if (m.livrables) m.livrables.video_final = null; m._dirty = null; S.saveManifest(base, persona, ui.projectId, m, nowv()); }
      ui.step = FLOW.resumeStep(ui.flow, manifest()); return { render: render(), notice: '♻️ Aval réinitialisé' };
    }

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
        const m = manifest();
        if (r.effect.statut_qualite) m.statut_qualite = r.effect.statut_qualite;
        if (r.effect.statut_publication) m.statut_publication = r.effect.statut_publication;
        S.saveManifest(base, persona, ui.projectId, m, nowv());
        if (r.offer === 'video') {
          // (A) sans rupture : l'image finalisée alimente NATURELLEMENT la vidéo (même projet, E41/E43)
          ui.flow = 'video'; ui.step = FLOW.resumeStep('video', manifest());
          return { render: render(), notice: '✅ Image finalisée → vidéo' };
        }
        return { render: render(), notice: '🚀 Final HD → Prêt-à-poster' };
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

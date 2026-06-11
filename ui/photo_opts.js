// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] MAPPING des champs PROJET (draft.photo) -> opts de newlook.generateLook (Seedream/Higgsfield).
//   PUR : lookbook + catalogue tenues INJECTÉS (aucune I/O, aucun appel moteur) -> testable en dry-run sans dépense.
//   Réutilise des champs EXISTANTS (prompt/look/decor/refs/format) ; AUCUN nouvel objet.
//   Champs du moteur réellement paramétrables (constatés dans newlook.buildPrompt) :
//     • prompt  -> opts.basePrompt   • look (tenue) -> opts.extra (texte outfit) / opts.category
//     • décor   -> opts.env (clé)    • mode/count   -> éco, 1 image
//   NON paramétrables (signalés, pas inventés) :
//     • références -> le moteur utilise la référence PERSONA FIXE (imany_reference), pas d'option
//     • format/aspect -> 9:16 FIXE dans generateLook
// ─────────────────────────────────────────────────────────────────────────────
function buildPhotoOpts(draft, lookbook, outfits) {
  draft = draft || {};
  const opts = { mode: 'eco', count: 1 };
  const unmapped = [];

  // PROMPT du projet -> prompt moteur
  if (draft.prompt && String(draft.prompt).trim()) opts.basePrompt = String(draft.prompt).trim();

  // LOOK « Catégorie #id » -> tenue exacte du catalogue (opts.extra) ; sinon catégorie nommée ; sinon libellé brut
  if (draft.look) {
    const m = String(draft.look).match(/^(.+?)\s*#\s*(\d+)$/);
    if (m) {
      const cat = m[1].trim().toLowerCase(), id = +m[2];
      const list = (outfits && outfits.outfits) || [];
      const o = list.find(x => String(x.cat).toLowerCase() === cat && +x.id === id);
      if (o && o.prompt) { opts.extra = o.prompt; opts.category = String(o.cat).toLowerCase(); }
      else if (lookbook && lookbook.categories && lookbook.categories[cat]) { opts.category = cat; }
      else { opts.extra = String(draft.look); }
    } else if (lookbook && lookbook.categories && lookbook.categories[String(draft.look).toLowerCase()]) {
      opts.category = String(draft.look).toLowerCase();
    } else { opts.extra = String(draft.look); }
  }

  // DÉCOR (libellé) -> clé d'environnement du lookbook
  if (draft.decor) {
    const envs = (lookbook && lookbook.envs) || {};
    let key = null;
    for (const k in envs) { if ((envs[k] && envs[k].label === draft.decor) || k === String(draft.decor).toLowerCase()) key = k; }
    if (key) opts.env = key; else unmapped.push('décor «' + draft.decor + '» (clé d\'environnement inconnue)');
  }

  // RÉFÉRENCES -> non paramétrable (référence persona fixe)
  if (draft.refs && draft.refs !== 'aucune') unmapped.push('références=' + draft.refs + ' (moteur : référence persona FIXE, non paramétrable)');
  // FORMAT -> non paramétrable (9:16 fixe)
  if (draft.format && draft.format !== '9:16') unmapped.push('format=' + draft.format + ' (moteur : 9:16 FIXE)');

  return { opts: opts, unmapped: unmapped };
}

// Trace lisible « ce qui serait envoyé au moteur » (dry-run, AUCUN appel).
function trace(draft, lookbook, outfits) {
  const r = buildPhotoOpts(draft, lookbook, outfits), o = r.opts;
  return 'enverrait au moteur → prompt=' + (o.basePrompt ? ('« ' + o.basePrompt.slice(0, 50) + '… »') : '(défaut)')
    + ' · outfit=' + (o.extra ? ('« ' + String(o.extra).slice(0, 40) + '… »') : (o.category ? ('catégorie ' + o.category) : '(défaut)'))
    + ' · décor=' + (o.env || '(défaut)')
    + ' · mode=' + o.mode + ' · count=' + o.count
    + (r.unmapped.length ? (' · NON mappé : ' + r.unmapped.join(' ; ')) : '');
}

module.exports = { buildPhotoOpts, trace };

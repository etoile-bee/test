// [cockpit-v4] Q9 — planche→vidéo : images RETENUES = plans de la vidéo ; durée s'adapte ; JAMAIS d'autres images.
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('../ui/project_store');
const { createController } = require('../ui/cockpit_controller');

let ok = 0, ko = 0;
function chk(l, c) { if (c) { ok++; console.log('✅ ' + l); } else { ko++; console.log('❌ ' + l); } }
function flat(r) { return [].concat.apply([], r); } function cbs(c) { return flat(c.rows).map(b => b.cb || b.go); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'q9_'));
const persona = 'imany'; let t = Date.parse('2026-06-10T09:00:00Z'); const now = () => (t += 1000);
function gen(flow, m) { const dir = path.join(S.projectDir(base, persona, m.projectId), 'images'); fs.mkdirSync(dir, { recursive: true }); const r = []; for (let i = 0; i < (m.parametres.nb_images || 1); i++) { const f = 'c' + i + '.jpg'; fs.writeFileSync(path.join(dir, f), 'I'); r.push('images/' + f); } return r; }
const deps = { base, persona, store: S, now, generate: gen, generateVideo: () => 'videos/final.mp4', lookbook: { pricing: { ops: { image_eco: 1, video30s: 5 }, eur_per_credit: 0.058 } }, libItems: () => [] };
const C = createController(deps);

// Planche de 3 ; on garde c0 et c2, on rejette c1
C.dispatch('go:photo'); const pid = C.ui.projectId;
C.dispatch('NB_3'); C.dispatch('SRC_NEW'); C.dispatch('GEN_CONFIRM');
C.dispatch('CAND_SEL_0'); C.dispatch('CAND_KEEP');
C.dispatch('CAND_SEL_1'); C.dispatch('CAND_REJECT');
C.dispatch('CAND_SEL_2'); C.dispatch('CAND_KEEP');
let m = S.loadManifest(base, persona, pid);
chk('Q9 : 2 images RETENUES (c0, c2)', JSON.stringify(m.retenues) === JSON.stringify(['images/c0.jpg', 'images/c2.jpg']));
chk('Q9 : c1 rejetée n\'est PAS retenue', m.retenues.indexOf('images/c1.jpg') < 0);
chk('Q9 : nb plans = nb retenues (2)', S.videoPlanCount(m) === 2);

// Durée choisie -> temps/plan adapté (videoPlans = les retenues, JAMAIS d'autres images)
m.parametres.duree = '30s'; m.scripts = [{ name: 'S', text: Array.from({ length: 75 }, () => 'mot').join(' ') }]; S.saveManifest(base, persona, pid, m, now());
const plans = S.videoPlans(m);
chk('Q9 : video utilise EXACTEMENT les images retenues', JSON.stringify(plans) === JSON.stringify(['images/c0.jpg', 'images/c2.jpg']));
chk('Q9 : aucune image hors planche dans les plans', plans.every(p => ['images/c0.jpg', 'images/c2.jpg'].indexOf(p) >= 0));

// Aller au finaliser vidéo -> confirmation montre nb plans + temps/plan
C.dispatch('V'); // source->parametres (photo)
C.dispatch('V'); // parametres->finaliser (photo)
C.dispatch('QC_RUN'); C.dispatch('V'); // photo finaliser -> phase video
C.ui.step = 'finaliser'; C.dispatch('QC_FORCE');
const conf = C.dispatch('V'); // -> confirmation coût (video)
chk('Q9 : écran confirmation = nb plans + temps/plan', /2 plan\(s\)/.test(conf.render.caption) && /s\/plan/.test(conf.render.caption));
C.dispatch('GEN_CONFIRM');
let mf = S.loadManifest(base, persona, pid);
chk('Q9 : video_plans persisté = les 2 retenues', JSON.stringify(mf.video_plans) === JSON.stringify(['images/c0.jpg', 'images/c2.jpg']));
chk('Q9 : vidéo finalisée -> prêt-à-poster', mf.statut_publication === 'pret_a_poster');

// D2 — script incohérent avec durée -> alerte dans la confirmation
const C2 = createController(deps); C2.dispatch('go:photo'); const pid2 = C2.ui.projectId;
C2.dispatch('SRC_NEW'); C2.dispatch('GEN_CONFIRM'); C2.dispatch('CAND_KEEP');
let m2 = S.loadManifest(base, persona, pid2); m2.parametres.duree = '60s'; m2.scripts = [{ text: 'trois mots seulement' }]; S.saveManifest(base, persona, pid2, m2, now());
C2.dispatch('V'); C2.dispatch('V'); C2.dispatch('QC_RUN'); C2.dispatch('V'); C2.ui.step = 'finaliser'; C2.dispatch('QC_FORCE');
const conf2 = C2.dispatch('V');
chk('D2 : confirmation montre ALERTE script incohérent + proposition', /incohérent/.test(conf2.render.caption) && /💡/.test(conf2.render.caption));

try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {}
console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

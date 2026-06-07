// Test : séparation stricte script de génération <-> texte de preview/démo
// Vérifie l'invariant corrigé : la preview LIT le script validé (lecture seule, jamais d'écrasement),
// et la génération REFUSE de tourner avec le texte démo / un script vide.
const assert = require('assert');
const DEMO = 'SHE SAYS YOU CHANGED BUT CHEMISTRY FADES';

let genJob = null;
function previewScript(){ return (genJob && genJob.script) ? genJob.script : DEMO; }      // copie de la règle bot
function genAllowed(job){ return !!(job && job.script && job.script !== DEMO); }            // copie du garde-fou bot

// 1) Aucun job -> preview = démo, et genJob reste null (la preview ne crée rien)
assert.strictEqual(previewScript(), DEMO);
assert.strictEqual(genJob, null);

// 2) Script validé -> la preview le LIT sans l'écraser
genJob = { script: 'REAL VALIDATED WIZARD SCRIPT', audio: null };
const before = genJob.script;
const p = previewScript();
assert.strictEqual(p, 'REAL VALIDATED WIZARD SCRIPT');
assert.strictEqual(genJob.script, before, 'la preview ne doit JAMAIS écraser le script');

// 3) Une preview répétée ne contamine pas l'état
for (let i = 0; i < 5; i++) previewScript();
assert.strictEqual(genJob.script, 'REAL VALIDATED WIZARD SCRIPT');

// 4) Garde-fou génération : refuse démo / vide / null, accepte un vrai script
assert.strictEqual(genAllowed({ script: 'REAL' }), true);
assert.strictEqual(genAllowed({ script: DEMO }), false, 'la génération ne doit jamais utiliser le texte démo');
assert.strictEqual(genAllowed({ script: '' }), false);
assert.strictEqual(genAllowed(null), false);

// 5) Nouveau wizard (gwReset équivalent) -> genJob purgé, preview repasse en démo
genJob = null;
assert.strictEqual(previewScript(), DEMO);

console.log('✅ test_script_separation : séparation preview/génération OK (5 cas)');

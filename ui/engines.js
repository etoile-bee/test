// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] ADAPTATEUR MOTEURS RÉELS — gating strict, ZÉRO dépense par défaut.
//   But : connecter /v4r aux MÊMES moteurs que le legacy (Seedream/Higgsfield · Kling · ElevenLabs · Anthropic),
//   MAIS derrière un drapeau runtime LIVE **OFF par défaut**. Tant que LIVE est OFF -> SIMULATION (aucun appel payant).
//   Le coût est TOUJOURS calculé et affiché AVANT (voir ui/cockpit_cost). La bascule LIVE = GO explicite d'Etoile
//   (le 1er appel réel = la 1ʳᵉ dépense ; le dev ne le déclenche jamais).
//   available() = simple présence des clés (AUCUN appel réseau). Rien ici ne dépense.
// ─────────────────────────────────────────────────────────────────────────────
let LIVE = false; // ⚠️ OFF par défaut : aucune dépense. Bascule UNIQUEMENT sur GO d'Etoile.
function setLive(on) { LIVE = !!on; return LIVE; }
function live() { return LIVE; }

// Présence des clés API (noms d'env), sans jamais lire/exposer la valeur ni appeler quoi que ce soit.
function available() {
  return {
    higgsfield: !!(process.env.HIGGSFIELD_KEY_ID && process.env.HIGGSFIELD_KEY_SECRET), // Seedream (photo/look) + Kling (vidéo)
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,   // voix
    anthropic: !!process.env.ANTHROPIC_API_KEY,     // scripts + légendes
  };
}

// Tout ce qui est local/gratuit est « réel » sans GO ; tout ce qui est payant exige LIVE (GO).
//   Renvoie comment une action sera exécutée, SANS l'exécuter -> permet d'afficher gratuit/payant + simulé/réel.
function mode(kind) {
  // kind: 'photo'|'video'|'voix'|'script'|'legende' = PAYANT ; 'soustitres'|'edition'|'apercu'|'publication' = GRATUIT/local
  const paid = ['photo', 'video', 'voix', 'script', 'legende'].indexOf(kind) >= 0;
  if (!paid) return { paid: false, exec: 'local' };           // gratuit, local, réel
  return { paid: true, exec: LIVE ? 'real' : 'sim' };          // payant : réel si GO, sinon simulé
}

module.exports = { setLive, live, available, mode };

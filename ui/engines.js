// ─────────────────────────────────────────────────────────────────────────────
// [RÉALISATION /v4r] ADAPTATEUR MOTEURS RÉELS — gating strict.
//   But : connecter /v4r aux MÊMES moteurs que le legacy (Seedream/Higgsfield · Kling · ElevenLabs · Anthropic),
//   derrière un drapeau LIVE PERSISTANT (fichier v4r_live). LIVE OFF -> SIMULATION (zéro dépense).
//   PERSISTANT (fichier) : survit aux redémarrages ; armé/désarmé explicitement (GO d'Etoile).
//   PORTÉE : RÉEL PHOTO (Seedream éco) ET RÉEL VIDÉO (Kling lipsync + ElevenLabs + script Anthropic) quand LIVE armé.
//   La VIDÉO réelle exige EN PLUS la présence des 3 clés moteur (sinon -> simulée, même armée : aucune dépense aveugle).
//   Le coût est TOUJOURS affiché AVANT ; la double-confirmation d'Etoile (« Oui, générer ») = seule dépense.
//   available() = présence des clés (AUCUN appel réseau). Rien ici ne dépense.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const os = require('os');
const FLAG = path.join(os.homedir(), 'podcast-workflow', 'v4r_live'); // présence du fichier = mode réel armé

function live() { try { return fs.existsSync(FLAG); } catch (e) { return false; } }
function setLive(on) { try { if (on) fs.writeFileSync(FLAG, 'on'); else { try { fs.unlinkSync(FLAG); } catch (e) {} } } catch (e) {} return live(); }
// RÉEL autorisé quand LIVE armé. PHOTO : Seedream éco. VIDÉO : seulement si les 3 clés moteur sont présentes
//   (Higgsfield/Kling + ElevenLabs + Anthropic) — garde-fou : armé sans clé -> reste simulé, zéro dépense aveugle.
function liveFor(kind) {
  if (!live()) return false;
  if (kind === 'photo' || kind === 'image') return true;
  if (kind === 'video') { const a = available(); return !!(a.higgsfield && a.elevenlabs && a.anthropic); }
  return false;
}

function available() {
  return {
    higgsfield: !!(process.env.HIGGSFIELD_KEY_ID && process.env.HIGGSFIELD_KEY_SECRET), // Seedream (photo) + Kling (vidéo)
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,   // voix
    anthropic: !!process.env.ANTHROPIC_API_KEY,     // scripts + légendes
  };
}

// Mode d'exécution d'une action SANS l'exécuter (pour afficher gratuit/payant + simulé/réel).
function mode(kind) {
  const paid = ['photo', 'video', 'voix', 'script', 'legende'].indexOf(kind) >= 0;
  if (!paid) return { paid: false, exec: 'local' };               // gratuit, local, réel
  return { paid: true, exec: liveFor(kind) ? 'real' : 'sim' };    // payant : réel SI autorisé (photo + armé), sinon simulé
}

module.exports = { setLive, live, liveFor, available, mode, FLAG };

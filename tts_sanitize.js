// Fonction UNIQUE de nettoyage TTS — à brancher (au signal) dans :
//   - workflow.js generateAudio (remplace les .replace inline, 2 endroits)
//   - telegram_bot.js (avant tout appel TTS, dans ttsCheck/genMockup/genFinal)
// + stripPauseTokens() pour les SOUS-TITRES (render_local wordTimings).
'use strict';

const BREAK = '<break time="0.8s" />'; // format SSML ElevenLabs (avec l'espace avant />, le plus fiable)

// Convertit TOUTES les variantes de pause en un break propre, supprime tout marqueur résiduel.
function sanitizeTTS(text) {
  let s = String(text == null ? '' : text);
  // 1) Encadré : [pause] (pause) {pause} <pause> — casse + espaces internes quelconques
  s = s.replace(/[\[\(\{<]\s*pause\s*[\]\)\}>]/gi, ' ' + BREAK + ' ');
  // 2) "pause" isolé entre deux phrases : précédé d'une ponctuation de fin, suivi d'espace/ponctuation/fin
  s = s.replace(/([.!?,;:])\s*pause\b\s*(?=[.!?,;:]|\s|$)/gi, '$1 ' + BREAK + ' ');
  // 3) "pause" seul sur sa ligne / en tête
  s = s.replace(/(^|\n)\s*pause\s*(?=\n|$)/gi, '$1 ' + BREAK + ' ');
  // 4) marqueur de scène résiduel "*pause*" ou "...pause..." collé à de la ponctuation seule
  s = s.replace(/[*_~]+\s*pause\s*[*_~]+/gi, ' ' + BREAK + ' ');
  // em / en dashes -> espace (ElevenLabs les lit mal)
  s = s.replace(/[—–]/g, ' ');
  // Nettoyage : breaks consécutifs -> un seul, espaces multiples
  s = s.replace(new RegExp('(' + BREAK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*){2,}', 'g'), BREAK + ' ');
  s = s.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.!?,;:])/g, '$1').trim();
  return s;
}

// Pour les SOUS-TITRES : un wordTiming dont le mot est un marqueur de pause ne doit jamais s'afficher.
function isPauseToken(word) {
  return /^[\[\(\{<]?\s*pause\s*[\]\)\}>]?\.?$/i.test(String(word || '').trim());
}
// Filtre une liste de wordTimings (objets {word|text,...}) en retirant les marqueurs de pause.
function stripPauseTokens(wordTimings) {
  return (wordTimings || []).filter(w => !isPauseToken(w && (w.word != null ? w.word : w.text)));
}

module.exports = { sanitizeTTS, stripPauseTokens, isPauseToken, BREAK };

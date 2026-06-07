// ============================================================
//  SOURCE UNIQUE DU STYLE SOUS-TITRES /*substyle v4 — VERROUILLE par Etoile le 07/06 : version EPAISSE Archivo Black*/
//  Lu par : workflow.js (prod) + test_soustitres.js (sandbox) + telegram_bot.js (/settings)
//  La police est EMBARQUEE par URL (FONTS) => rendu identique a 100% partout, sandbox ET prod.
//  C'est le style des tests valides de 16h-17h50 le 06/06 (epais, net, sans contour).
//
//  >>> LES 2 CHIFFRES A REGLER <<<
const FONT_SIZE = 42;     // taille du texte — reduit 48→45→42 (demande Etoile 07/06)
const OY        = 0.26;   // hauteur — descendu vers pendentif/clavicule (cible ~70% hauteur, demande Etoile 07/06)
//  (optionnel)
const LETTER    = '0px';  // espacement entre lettres
// ============================================================

const FONT_URL  = 'https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf';
const FONT_NAME = 'Archivo Black';

// HTML identique aux tests valides (police noire native, pas de stroke ni d'ombre)
function styleHtml(text){
  return '<p style="font-family:\'' + FONT_NAME + '\';font-size:' + FONT_SIZE +
    'px;color:#FFFFFF;letter-spacing:' + LETTER +
    ';margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;">' + text + '</p>';
}

// Embarquee dans timeline.fonts de CHAQUE edit Shotstack (prod ET test) — garantie d'uniformite
const FONTS = [ { src: FONT_URL } ];

module.exports = { FONT_SIZE, OY, LETTER, styleHtml, FONTS, WIDTH: 720, HEIGHT: 175 };

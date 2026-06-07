// ============================================================
//  SOURCE UNIQUE DU STYLE SOUS-TITRES /*substyle v4 — VERROUILLE par Etoile le 07/06 : version EPAISSE Archivo Black*/
//  Lu par : workflow.js (prod) + test_soustitres.js (sandbox) + telegram_bot.js (/settings)
//  La police est EMBARQUEE par URL (FONTS) => rendu identique a 100% partout, sandbox ET prod.
//  C'est le style des tests valides de 16h-17h50 le 06/06 (epais, net, sans contour).
//
//  >>> LES 2 CHIFFRES A REGLER <<<
const FONT_SIZE = 54;     // ✅ aligné look validé Arial Black (frames test_local validées par Etoile)
const OY        = 0.347;  // ✅ aligné look validé Arial Black (position subref v2)
//  (optionnel)
const LETTER    = '2px';  // espacement entre lettres (subref v2 : letter-spacing 2px)
const ZOOM      = 1.04;    // zoom de base du rendu local (piloté par le bouton 🔍 Telegram ; 1.0 = look validé)
const FONT      = 'Arial Black'; // police du rendu local libass (bouton 🔤 Telegram) — ex: Archivo Black, Helvetica
const SUBS      = 1;      // 1 = sous-titres incrustés ; 0 = vidéo propre (captions ajoutées dans TikTok)
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

module.exports = { FONT_SIZE, OY, LETTER, ZOOM, FONT, SUBS, styleHtml, FONTS, WIDTH: 720, HEIGHT: 175 };

// ============================================================
//  SOURCE UNIQUE DU STYLE SOUS-TITRES /*substyle v1*/
//  Lu par : workflow.js (prod) + test_soustitres.js (sandbox) + telegram_bot.js (/settings)
//  => ce que montre le test EST ce que rendra la prod, par construction.
//
//  >>> LES 2 CHIFFRES A REGLER <<<
const FONT_SIZE = 52;     // taille du texte (plus grand = plus gros)
const OY        = 0.347;  // hauteur (plus grand = plus haut) — haut de la mousse du micro
//  (optionnel)
const LETTER    = '2px';  // espacement entre lettres
// ============================================================

// HTML strictement identique partout (style subref v2 : Arial Black, stroke blanc, ombre douce)
function styleHtml(text){
  return '<p style="font-family:Arial Black,Arial,sans-serif;font-size:'+FONT_SIZE+
    'px;font-weight:900;letter-spacing:'+LETTER+
    ';color:#FFFFFF;-webkit-text-stroke:1.3px #FFFFFF;text-shadow:0 2px 7px rgba(0,0,0,0.55),0 0 3px rgba(0,0,0,0.45);margin:0;padding:6px 20px;text-align:center;text-transform:uppercase;">'+text+'</p>';
}

module.exports = { FONT_SIZE, OY, LETTER, styleHtml, WIDTH: 720, HEIGHT: 175 };

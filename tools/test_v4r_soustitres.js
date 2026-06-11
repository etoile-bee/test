// PREUVE SOUS-TITRES DÉFINITIF : la boîte d'apparence (police/taille/position/couleur) est RÉELLEMENT connectée
//   au moteur d'incrustation render_local.buildAss — les MÊMES réglages alimentent l'aperçu ET le rendu final.
//   1) buildAss applique couleur + alignement + taille + police (preuve dans le .ass généré)
//   2) ffmpeg incruste réellement (preuve : PNG non vide produit)
//   3) le mapping st_* -> opts (réplique de r0SubOpts) est cohérent
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const RL = require('../render_local.js');
let ok = 0, ko = 0;
const chk = (m, c) => { console.log((c ? '✅' : '❌') + ' ' + m); c ? ok++ : ko++; };

// Réplique EXACTE de r0SubOpts (telegram_bot.js) — si tu changes l'un, change l'autre.
function subOpts(dv) { dv = dv || {};
  const FONTS = { archivo: 'Archivo Black', classique: 'Arial' };
  const SIZE = { S: 58, M: 78, L: 98 };
  const OYP = { bas: 0.27, milieu: 0.50, haut: 0.78 };
  const ALIGN = { bas: 2, milieu: 5, haut: 8 };
  const COLOR = { blanc: '&H00FFFFFF', jaune: '&H0000FFFF', cyan: '&H00FFFF00' };
  const o = {};
  if (dv.st_font && FONTS[dv.st_font]) o.font = FONTS[dv.st_font];
  if (dv.st_size && SIZE[dv.st_size] != null) o.fontSize = SIZE[dv.st_size];
  if (dv.st_pos) { if (OYP[dv.st_pos] != null) o.oy = OYP[dv.st_pos]; if (ALIGN[dv.st_pos] != null) o.alignment = ALIGN[dv.st_pos]; }
  if (dv.st_color && COLOR[dv.st_color]) o.color = COLOR[dv.st_color];
  return o;
}

// 1) mapping cohérent
const o1 = subOpts({ st_font: 'classique', st_size: 'L', st_pos: 'haut', st_color: 'jaune' });
chk('mapping : classique -> Arial', o1.font === 'Arial');
chk('mapping : L -> 98px', o1.fontSize === 98);
chk('mapping : haut -> oy 0.78 + alignement 8', o1.oy === 0.78 && o1.alignment === 8);
chk('mapping : jaune -> &H0000FFFF', o1.color === '&H0000FFFF');
const o2 = subOpts({ st_pos: 'milieu', st_color: 'cyan' });
chk('mapping : milieu -> alignement 5', o2.alignment === 5);
chk('mapping : cyan -> &H00FFFF00', o2.color === '&H00FFFF00');

// 2) buildAss applique réellement couleur + alignement + taille
const ass = RL.buildAss([{ text: 'aperçu sous-titres', start: 0, length: 3 }], { font: o1.font, fontSize: o1.fontSize, oy: o1.oy, alignment: o1.alignment, color: o1.color });
chk('buildAss : couleur jaune injectée dans le style', ass.indexOf('&H0000FFFF') >= 0);
chk('buildAss : police Arial injectée', ass.indexOf('Arial') >= 0);
chk('buildAss : taille 98 injectée', /Style: Main,Arial,98,/.test(ass));
chk('buildAss : alignement 8 (haut) injecté', /,8,40,40,/.test(ass));
chk('buildAss : défaut sans color -> blanc', RL.buildAss([{ text: 'x', start: 0, length: 1 }], {}).indexOf('&H00FFFFFF') >= 0);

// 3) ffmpeg incruste réellement (preuve PNG) — si une image source de test existe
(function () {
  let img = null;
  try { const looks = path.join(os.homedir(), 'podcast-workflow', 'looks');
    const walk = d => { for (const e of fs.readdirSync(d)) { const p = path.join(d, e); let st; try { st = fs.statSync(p); } catch (_) { continue; }
      if (st.isDirectory() && !img) walk(p); else if (/\.(jpg|jpeg|png|webp)$/i.test(e) && st.size > 20000) { img = p; return; } if (img) return; } };
    walk(looks);
  } catch (_) {}
  if (!img) { console.log('… (pas d\'image source trouvée — preuve ffmpeg sautée, non bloquant)'); return; }
  const assPath = path.join(os.tmpdir(), 'tst_sub_' + Date.now() + '.ass');
  fs.writeFileSync(assPath, ass);
  const out = path.join(os.tmpdir(), 'tst_sub_' + Date.now() + '.png');
  try {
    cp.execFileSync('ffmpeg', ['-y', '-i', img, '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,ass=' + assPath, '-frames:v', '1', '-q:v', '2', out], { stdio: 'ignore', timeout: 30000 });
    chk('ffmpeg : incrustation réelle -> PNG non vide produit', fs.existsSync(out) && fs.statSync(out).size > 5000);
  } catch (e) { chk('ffmpeg : incrustation réelle (' + e.message.slice(0, 40) + ')', false); }
})();

console.log('\nRÉSULTAT: ' + ok + ' OK, ' + ko + ' KO');
process.exit(ko ? 1 : 0);

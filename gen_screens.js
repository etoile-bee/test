// Génère SCREENS.md : carte des écrans du bot (nom de fonction, 1er texte/caption, boutons par ligne source).
// Extraction statique best-effort depuis telegram_bot.js.
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/telegram_bot.js','utf8');
const lines=src.split('\n');

// 1) Repère les fonctions « écran » (def) et leur plage de lignes
const funcs=[];
const reDef=/^(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/;
for(let i=0;i<lines.length;i++){const m=lines[i].match(reDef);if(m)funcs.push({name:m[1],start:i});}
for(let k=0;k<funcs.length;k++)funcs[k].end=(k+1<funcs.length?funcs[k+1].start:lines.length);

function firstText(body){
  // premier littéral passé à send/cockpitCaption/sendPhotoKb/sendImg
  const m=body.match(/(?:send|cockpitCaption|sendPhotoKb|sendImg|tgEditText)\(\s*(?:[A-Za-z0-9_.]+\s*,\s*)?[`'"]([^`'"]{0,300})/);
  if(m)return m[1];
  const t=body.match(/[`'"]([^`'"]*<b>[^`'"]{0,200})/);return t?t[1]:'';
}
function buttonsByRow(body){
  // groupe les boutons par LIGNE source (les rows sont souvent une ligne = un tableau)
  const rows=[];
  for(const ln of body.split('\n')){
    const btns=[];const re=/text:\s*[`'"]([^`'"]+)[`'"]\s*,\s*callback_data:\s*[`'"]([^`'"]+)[`'"]/g;let m;
    while(m=re.exec(ln))btns.push({t:m[1],cb:m[2]});
    // url buttons
    const re2=/text:\s*[`'"]([^`'"]+)[`'"]\s*,\s*url:/g;while(m=re2.exec(ln))btns.push({t:m[1],cb:'(url)'});
    if(btns.length)rows.push(btns);
  }
  return rows;
}

const SCREEN_HINT=/^(show|recap|genAfterScript|genScript|genHooks|showScriptCard|openPanel|section|image\w*Kb|subsKb|zoomKb|musicKb|reactionsKb|navRow|showCover|showPresets|showFiles|showLook|showReady|showStyles|showMainMenu|showEditHome|showRecap)/i;

let out='# Carte des écrans du bot\n\n_Généré par `gen_screens.js` depuis `telegram_bot.js` — texte exact + boutons par ligne._\n\n';
let n=0;
for(const f of funcs){
  const body=lines.slice(f.start,f.end).join('\n');
  const rows=buttonsByRow(body);
  const txt=firstText(body);
  if(!rows.length && !/send\(|cockpitCaption\(|sendPhotoKb\(/.test(body))continue; // pas un écran
  if(!SCREEN_HINT.test(f.name) && !rows.length)continue;
  n++;
  out+=`## ${f.name}\n\n`;
  if(txt)out+='**Texte :** `'+txt.replace(/`/g,"'").slice(0,260)+'`\n\n';
  if(rows.length){
    out+='**Boutons :**\n';
    rows.forEach((r,ri)=>{out+=`- L${ri+1}: `+r.map(b=>`[${b.t}](${b.cb})`).join(' · ')+'\n';});
  }else out+='_(pas de boutons inline)_\n';
  out+='\n';
}
out+=`\n---\n_${n} écrans extraits._\n`;
fs.writeFileSync(__dirname+'/SCREENS.md',out);
console.log('SCREENS.md généré :',n,'écrans');

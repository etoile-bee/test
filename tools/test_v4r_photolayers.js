// [C/D/G/H] Tenue/Décor : défaut = image de base (aucun forçage) · « Désactiver » explicite · indicateur aperçu = réalité · cohérence Photo·Choisir.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-layers-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}},"categories":{"soiree":{"label":"Soirée"}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens'); const NAV=require('../ui/nav'); const PO=require('../ui/photo_opts'); const S=require('../ui/socle');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const flat=v=>[].concat.apply([],(v.rows||[])).map(b=>b.text);
const lb=JSON.parse(fs.readFileSync(path.join(BOX,'lookbook.json'),'utf8'));
(async()=>{
  bot.reset(); await bot.open();
  await bot.tap('R0_PHOTO'); await bot.tap('R0_PH_GAL'); await bot.tap('R0_GITEM_0');
  const id=bot.curId();

  // ── G : Photo·Choisir cohérent (source active -> pas « aucune photo ») ──
  const pv=SC.photoView(S.loadFacts(BOX,'imany',id),{srcName:'s0.jpg'});
  chk('#G : source active -> PAS « aucune photo »', !/aucune photo/i.test(pv.caption) && /Source active|disponible/i.test(pv.caption));
  chk('#C : Photo·Choisir expose un accès « Tenue & décor »', flat(pv).some(t=>/Tenue & décor/i.test(t)));

  // ── D : par DÉFAUT aucune tenue/décor -> image de base (génération ne force rien) ──
  const draft0=S.getDraft(S.loadFacts(BOX,'imany',id),'photo')||{};
  const opts0=PO.buildPhotoOpts(draft0, lb, {});
  chk('#D : défaut SANS tenue -> aucune catégorie/extra forcée (image de base)', !opts0.opts.category && !opts0.opts.extra);

  // ── D+T : bloc Tenue = picker + « 🚫 Aucune (image de base) » + « 🔒 Conserver » (plus de « Désactiver »/« Influences ») ──
  const lookSpec=NAV.blockSpec({screen:'photo',key:'look'}, S.loadFacts(BOX,'imany',id), {});
  const specBtns=s=>[].concat.apply([], (s.optionRows||[]).concat(s.options?[s.options]:[])).map(b=>b.text);
  chk('#D : bloc Tenue montre « image de base » (non choisi)', /image de base/i.test(String(lookSpec.current)));
  chk('#T : bloc Tenue propose « 🚫 Aucune (image de base) »', specBtns(lookSpec).some(t=>/Aucune/i.test(t)));
  chk('#T : bloc Tenue propose « 🔒 Conserver » (pas « Désactiver » ni « Utiliser »)',
      specBtns(lookSpec).some(t=>/Conserver/i.test(t)) && !specBtns(lookSpec).some(t=>/Désactiver|Utiliser/i.test(t)));

  // ── T : « 🚫 Aucune » remet la couche à vide -> image de base (non passée au moteur) ──
  await bot.tap('R0_PH_VALID'); // -> Préparer
  bot.seedDraft('photo',{look:'soiree'});
  await bot.tap('R0_LAYER_NONE_look');
  const draftA=S.getDraft(S.loadFacts(BOX,'imany',id),'photo')||{};
  chk('#T : « Aucune » -> look vidé', !draftA.look);
  const optsA=PO.buildPhotoOpts(draftA, lb, {});
  chk('#T : tenue vidée -> non passée au moteur (image de base)', !optsA.opts.category && !optsA.opts.extra);

  // ── H : indicateur aperçu reflète la réalité (présence de valeur, plus de toggle use_*) ──
  bot.seedDraft('photo',{look:'', decor:''});
  const cvBase=SC.confirmView(S.loadFacts(BOX,'imany',id), {confirm:{mediaKind:'photo'}});
  chk('#H : aucun look/décor -> ✗ Tenue · ✗ Décor · « image de base »', /✗ Tenue/.test(cvBase.caption) && /✗ Décor/.test(cvBase.caption) && /image de base/i.test(cvBase.caption));
  bot.seedDraft('photo',{look:'soiree'});
  const cvLook=SC.confirmView(S.loadFacts(BOX,'imany',id), {confirm:{mediaKind:'photo'}});
  chk('#H : look défini -> ✓ Tenue', /✓ Tenue/.test(cvLook.caption));
  // valeur effacée (Aucune) -> ✗ Tenue (pas de faux ✓)
  bot.seedDraft('photo',{look:''});
  const cvOff=SC.confirmView(S.loadFacts(BOX,'imany',id), {confirm:{mediaKind:'photo'}});
  chk('#H : look vidé -> ✗ Tenue (pas de faux ✓)', /✗ Tenue/.test(cvOff.caption));

  // ── X : picker Tenue (réel, via le handler) expose 12 tenues dont Old Money / Luxe / Naturel / Sport chic / Bohème chic / Minimaliste ──
  await bot.tap('R0_PHB_look');
  const tlabels=bot.labels().join(' | ');
  const wanted=['Old Money','Luxe','Naturel','Sport chic','Bohème chic','Minimaliste'];
  chk('#X : 6 nouvelles tenues présentes dans le picker', wanted.every(w=>tlabels.indexOf(w)>=0));
  chk('#X : tenues legacy conservées (Soirée/Business/Casual)', /Soirée/.test(tlabels)&&/Business/.test(tlabels)&&/Casual/.test(tlabels));
  await bot.tap('R0_BLOCK_OK');

  console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);
})();

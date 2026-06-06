const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('une bascule vers la soft life')){console.error('❌ Déjà patché. Annulé.');process.exit(1);}
const ANCHOR=`const ANGLES=[
  'un angle contre-intuitif qui choque',
  'un scénario ultra-spécifique du quotidien',
  'une opinion clivante que peu osent dire',
  'un mythe répandu à démonter',
  'une erreur précise que la plupart des femmes font',
  'une vérité dure que personne ne dit',
  'une comparaison inattendue',
  'un red flag déguisé en geste romantique',
  'une phrase typique que dit un homme toxique',
  'un déclic qui change tout',
  'un chiffre ou une statistique choc',
  'un callout direct à la spectatrice',
];`;
const BLOC=`const ANGLES=[
  'un red flag déguisé en geste romantique',
  'une phrase typique que dit un homme toxique',
  'une opinion clivante que peu osent dire',
  'un mythe romantique répandu à démonter',
  'une vérité dure que personne ne dit',
  'un déclic empowerment qui change tout',
  'une bascule vers la soft life et le calme',
  'un standard non négociable à poser sans culpabiliser',
  'une punchline drôle et cash sur le dating',
  'une observation absurde et comique sur les hommes',
  'un storytime à la première personne',
  'un POV vécu très spécifique',
  'une comparaison inattendue',
  'un chiffre ou une statistique choc',
  'un scénario ultra-spécifique du quotidien',
  'un callout direct et bienveillant à la spectatrice',
  'un avant après transformation personnelle',
  'une question rhétorique qui dérange',
  'un conseil à contre-courant des clichés',
  'une scène de texto que tout le monde reconnaît',
];`;
const c=src.split(ANCHOR).length-1;
if(c!==1){console.error('❌ Ancre ANGLES = '+c+' (attendu 1). Annulé.');process.exit(1);}
src=src.split(ANCHOR).join(BLOC);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepatch8');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch étape 8 (angles élargis) appliqué. Sauvegarde : '+FILE+'.prepatch8');

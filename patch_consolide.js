const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('TOPIC_QUEUE')||src.includes('RECENT_TOPICS')){console.error('❌ Features variété déjà présentes. Annulé.');process.exit(1);}

const ANCHOR=`async function genTopic(catLabel){
  try{
    const Anthropic=require('@anthropic-ai/sdk');
    const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const cat=catLabel?(' Catégorie imposée: "'+catLabel+'".'):'';
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:60,
      messages:[{role:'user',content:'TikTok relationship coach for women 20-40.'+cat+' Donne UN seul sujet viral, court et percutant. Une ligne, max 12 mots, sans guillemets ni numéro. Réponds UNIQUEMENT le sujet.'}]});
    return r.content[0].text.trim().replace(/^["']|["']$/g,'');
  }catch(e){return null;}
}`;

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
];
const TOPIC_HIST_FILE=require('path').join(require('os').homedir(),'podcast-workflow','topic_history.json');
let RECENT_TOPICS=[];
try{ RECENT_TOPICS=JSON.parse(require('fs').readFileSync(TOPIC_HIST_FILE,'utf8'))||[]; }catch(e){ RECENT_TOPICS=[]; }
function saveTopicHist(){ try{ require('fs').writeFileSync(TOPIC_HIST_FILE, JSON.stringify(RECENT_TOPICS.slice(-200))); }catch(e){} }
function overusedWords(){
  const freq={};
  RECENT_TOPICS.forEach(function(t){ String(t).toLowerCase().split(/[^a-zàâäéèêëîïôöùûüçœ]+/).forEach(function(w){ if(w.length>4){ freq[w]=(freq[w]||0)+1; } }); });
  return Object.keys(freq).filter(function(w){ return freq[w]>=2; }).sort(function(a,b){ return freq[b]-freq[a]; }).slice(0,15);
}
let TOPIC_QUEUE=[];
let QUEUE_KEY=null;
function normTopic(s){ return String(s).toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüçœ ]+/g,'').replace(/\\s+/g,' ').trim(); }
async function genTopicBatch(catLabel){
  try{
    const Anthropic=require('@anthropic-ai/sdk');
    const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const cat=catLabel?(' Catégorie imposée: "'+catLabel+'".'):'';
    const recent=RECENT_TOPICS.slice(-60);
    const avoid=recent.length?(' Sujets DÉJÀ utilisés, à éviter (thèmes ET mots): '+recent.join(' | ')+'.'):'';
    const ban=overusedWords();
    const banTxt=ban.length?(' Mots déjà trop utilisés, INTERDITS: '+ban.join(', ')+'.'):'';
    const angs=ANGLES.slice().sort(function(){return Math.random()-0.5;}).slice(0,8).join(' ; ');
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:500,temperature:1,
      messages:[{role:'user',content:'Tu es scénariste TikTok pour une coach en relations (femmes 20-40).'+cat+' Donne EXACTEMENT 8 sujets viraux, courts et ultra-percutants, max 12 mots chacun. Chaque sujet DOIT être radicalement différent des autres (thème ET vocabulaire ET premier mot). Varie les angles, par ex: '+angs+'. Hooks qui stoppent le scroll, ton cash et spécifique. Évite les formulations génériques et les débuts en Pourquoi ou Comment. UN sujet par ligne, sans numéro, sans tiret, sans guillemets.'+avoid+banTxt}]});
    return r.content[0].text.trim().split(/\\n+/).map(function(s){return s.replace(/^[\\s\\-\\d\\.\\)]+/,'').replace(/^["']|["']$/g,'').trim();}).filter(function(s){return s.length>0;});
  }catch(e){return [];}
}
async function genTopic(catLabel){
  const key=catLabel||'__free__';
  if(QUEUE_KEY!==key){ TOPIC_QUEUE=[]; QUEUE_KEY=key; }
  if(TOPIC_QUEUE.length===0){
    const batch=await genTopicBatch(catLabel);
    const seen={};
    RECENT_TOPICS.forEach(function(t){ seen[normTopic(t)]=true; });
    batch.forEach(function(t){ const n=normTopic(t); if(n && !seen[n]){ seen[n]=true; TOPIC_QUEUE.push(t); } });
  }
  if(TOPIC_QUEUE.length===0) return null;
  const t=TOPIC_QUEUE.shift();
  RECENT_TOPICS.push(t); if(RECENT_TOPICS.length>200)RECENT_TOPICS.shift(); saveTopicHist();
  return t;
}`;

const c=src.split(ANCHOR).length-1;
if(c!==1){console.error('❌ Ancre genTopic = '+c+' (attendu 1). Annulé. Colle-moi ton genTopic actuel.');process.exit(1);}
src=src.split(ANCHOR).join(BLOC);
fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO. Original intact.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.preconsolide');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch consolidé appliqué. Sauvegarde : '+FILE+'.preconsolide');

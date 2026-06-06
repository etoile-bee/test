const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('TOPIC_QUEUE')){console.error('❌ Déjà patché. Annulé.');process.exit(1);}

const ANCHOR=`async function genTopic(catLabel){
  try{
    const Anthropic=require('@anthropic-ai/sdk');
    const ant=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const cat=catLabel?(' Catégorie imposée: "'+catLabel+'".'):'';
    const angle=ANGLES[Math.floor(Math.random()*ANGLES.length)];
    const recent=RECENT_TOPICS.slice(-60);
    const avoid=recent.length?(' Sujets DÉJÀ utilisés, à éviter (thèmes ET mots): '+recent.join(' | ')+'.'):'';
    const ban=overusedWords();
    const banTxt=ban.length?(' Mots déjà trop utilisés, INTERDITS: '+ban.join(', ')+'.'):'';
    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:80,temperature:1,
      messages:[{role:'user',content:'Tu es scénariste TikTok pour une coach en relations (femmes 20-40).'+cat+' Donne UN seul sujet viral, court et ultra-percutant, max 12 mots. Adopte cet angle: '+angle+'. Varie RADICALEMENT le vocabulaire et le premier mot par rapport aux sujets déjà utilisés. Hook qui stoppe le scroll, ton cash et spécifique. Évite les formulations génériques et les débuts en Pourquoi ou Comment. Pas de guillemets, pas de numéro.'+avoid+banTxt+' Réponds UNIQUEMENT le sujet.'}]});
    let t=r.content[0].text.trim().replace(/^["']|["']$/g,'');
    RECENT_TOPICS.push(t); if(RECENT_TOPICS.length>200)RECENT_TOPICS.shift(); saveTopicHist();
    return t;
  }catch(e){return null;}
}`;

const BLOC=`let TOPIC_QUEUE=[];
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
if(c!==1){console.error('❌ Ancre genTopic = '+c+' (attendu 1). Annulé.');process.exit(1);}
src=src.split(ANCHOR).join(BLOC);

fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepatch7');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch étape 7 (génération par lot) appliqué. Sauvegarde : '+FILE+'.prepatch7');

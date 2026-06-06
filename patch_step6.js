const fs=require('fs');const {execSync}=require('child_process');
const FILE='telegram_bot.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('TOPIC_HIST_FILE')){console.error('❌ Déjà patché. Annulé.');process.exit(1);}
function once(h,n,l){const c=h.split(n).length-1;if(c!==1){console.error('❌ Ancre '+l+' = '+c+'. Annulé.');process.exit(1);}}
function rep(n,r,l){once(src,n,l);src=src.split(n).join(r);}

rep('let RECENT_TOPICS=[];',
`const TOPIC_HIST_FILE=require('path').join(require('os').homedir(),'podcast-workflow','topic_history.json');
let RECENT_TOPICS=[];
try{ RECENT_TOPICS=JSON.parse(require('fs').readFileSync(TOPIC_HIST_FILE,'utf8'))||[]; }catch(e){ RECENT_TOPICS=[]; }
function saveTopicHist(){ try{ require('fs').writeFileSync(TOPIC_HIST_FILE, JSON.stringify(RECENT_TOPICS.slice(-200))); }catch(e){} }
function overusedWords(){
  const freq={};
  RECENT_TOPICS.forEach(function(t){ String(t).toLowerCase().split(/[^a-zàâäéèêëîïôöùûüçœ]+/).forEach(function(w){ if(w.length>4){ freq[w]=(freq[w]||0)+1; } }); });
  return Object.keys(freq).filter(function(w){ return freq[w]>=2; }).sort(function(a,b){ return freq[b]-freq[a]; }).slice(0,15);
}`,'HIST');

rep("    const avoid=RECENT_TOPICS.length?(' Sujets DÉJÀ utilisés, à éviter (thèmes ET mots): '+RECENT_TOPICS.join(' | ')+'.'):'';",
`    const recent=RECENT_TOPICS.slice(-60);
    const avoid=recent.length?(' Sujets DÉJÀ utilisés, à éviter (thèmes ET mots): '+recent.join(' | ')+'.'):'';
    const ban=overusedWords();
    const banTxt=ban.length?(' Mots déjà trop utilisés, INTERDITS: '+ban.join(', ')+'.'):'';`,'AVOID');

rep(`    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:80,temperature:1,
      messages:[{role:'user',content:'Tu es scénariste TikTok pour une coach en relations (femmes 20-40).'+cat+' Donne UN seul sujet viral, court et ultra-percutant, max 12 mots. Adopte cet angle: '+angle+'. Hook qui stoppe le scroll, ton cash et spécifique. Évite les formulations génériques et les débuts en Pourquoi ou Comment. Pas de guillemets, pas de numéro.'+avoid+' Réponds UNIQUEMENT le sujet.'}]});`,
`    const r=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:80,temperature:1,
      messages:[{role:'user',content:'Tu es scénariste TikTok pour une coach en relations (femmes 20-40).'+cat+' Donne UN seul sujet viral, court et ultra-percutant, max 12 mots. Adopte cet angle: '+angle+'. Varie RADICALEMENT le vocabulaire et le premier mot par rapport aux sujets déjà utilisés. Hook qui stoppe le scroll, ton cash et spécifique. Évite les formulations génériques et les débuts en Pourquoi ou Comment. Pas de guillemets, pas de numéro.'+avoid+banTxt+' Réponds UNIQUEMENT le sujet.'}]});`,'CALL');

rep("    RECENT_TOPICS.push(t); if(RECENT_TOPICS.length>25)RECENT_TOPICS.shift();",
`    RECENT_TOPICS.push(t); if(RECENT_TOPICS.length>200)RECENT_TOPICS.shift(); saveTopicHist();`,'SAVE');

fs.writeFileSync('telegram_bot.patched.js',src);
try{execSync('node --check telegram_bot.patched.js',{stdio:'pipe'});}
catch(e){console.error('❌ Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prepatch6');fs.renameSync('telegram_bot.patched.js',FILE);
console.log('✅ Patch étape 6 (persistance + mots interdits) appliqué. Sauvegarde : '+FILE+'.prepatch6');

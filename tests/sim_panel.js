// BANC D'ESSAI PANNEAU UNIQUE — simule Telegram + Higgsfield, pilote le bot comme Etoile, compte chaque message
const Module=require('module');
const path=require('path');
const fs=require('fs');
const origLoad=Module._load;
let msgId=100;
const calls=[];           // tout ce que le bot envoie
const updatesQueue=[];    // ce qu'"Etoile" fait
const lastContent={};     // pour simuler "message is not modified"
function fakeJpg(p){try{require('child_process').execSync('ffmpeg -y -f lavfi -i color=c=gray:s=720x1280:d=0.1 -frames:v 1 "'+p+'" 2>/dev/null');}catch(e){}return p;}
const F1=fakeJpg('/tmp/fake1.jpg'),F2=fakeJpg('/tmp/fake2.jpg');

Module._load=function(req,parent,isMain){
  if(req==='node-fetch'){
    return async function(url,opts){
      const m=String(url).match(/\/bot[^/]+\/(\w+)/);
      const method=m?m[1]:String(url);
      let body=null;const isForm=opts&&opts.body&&typeof opts.body!=='string';
      if(!isForm&&opts&&opts.body){try{body=JSON.parse(opts.body);}catch(e){}}
      if(method!=='getUpdates')calls.push({method,body:body||(isForm?'FORM':null)});
      const J=o=>({ok:true,json:async()=>o});
      if(method==='getUpdates'){
        const batch=updatesQueue.length?[updatesQueue.shift()]:[];
        return J({ok:true,result:batch});
      }
      if(method==='sendMessage'||method==='sendPhoto'||method==='sendVideo'||method==='sendDocument'){
        return J({ok:true,result:{message_id:++msgId}});
      }
      if(/^editMessage/.test(method)){
        const key=method+(body?body.message_id:'F');
        const sig=JSON.stringify(body)||'FORM'+Date.now();
        if(lastContent[key]===sig)return J({ok:false,description:'Bad Request: message is not modified: blabla'});
        lastContent[key]=sig;
        return J({ok:true,result:{}});
      }
      return J({ok:true,result:{}});
    };
  }
  if(/newlook\.js$/.test(req)){
    const real=origLoad.apply(this,arguments);
    return Object.assign({},real,{
      generateLook:async(o,log)=>{log&&log('moteur : seedream (simulé)');return{urls:[F1,F2],prompt:'x',recipe:{category:o.category,env:o.env,extra:null,mode:o.mode}};},
      recreatePose:async()=>F1,
      splitPlanche:async()=>[F1,F2,F1]
    });
  }
  return origLoad.apply(this,arguments);
};
process.env.TELEGRAM_TOKEN='TEST';process.env.TELEGRAM_CHAT_ID='1';
const U=(()=>{let i=0;return{
  msg:t=>({update_id:++i,message:{chat:{id:1},text:t}}),
  cb:d=>({update_id:++i,callback_query:{id:'q'+i,data:d,message:{chat:{id:1},message_id:101}}})
};})();

require(path.join(__dirname,'..','telegram_bot.js'));

(async()=>{
  await new Promise(r=>setTimeout(r,1500)); // demarrage
  const startupCount=calls.filter(c=>c.method==='sendMessage'||c.method==='sendPhoto').length;
  // SCENARIO ETOILE
  const steps=['/newlook','NL_MENU_CAT','NL_SET_CAT_soiree','NL_MENU_ENV','NL_SET_ENV_jour','NL_MENU_MODE','NL_SET_MODE_planche','NL_SET_MODE_planche','NL_GO','NL_NAV_N','NL_NAV_N','NL_KEEP_CUR','NL_RE_0','NL_KEEP_CUR','NL_CANCEL'];
  for(const st of steps){
    updatesQueue.push(st.startsWith('/')?U.msg(st):U.cb(st));
    await new Promise(r=>setTimeout(r,1400));
  }
  await new Promise(r=>setTimeout(r,1500));
  const after=calls.slice();
  const news=after.filter((c,ix)=>ix>=0&&(c.method==='sendMessage'||c.method==='sendPhoto'));
  const newsAfterStartup=news.slice(startupCount);
  const edits=after.filter(c=>/^editMessage/.test(c.method)).length;
  console.log('=== RESULTAT BANC D\'ESSAI ===');
  console.log('messages crees PENDANT le parcours (doit etre 1, le panneau):',newsAfterStartup.length);
  newsAfterStartup.forEach(c=>console.log('  -',c.method,(c.body&&c.body.text||'').substring(0,60)));
  console.log('editions sur place:',edits);
  console.log(newsAfterStartup.length===1?'✅ CERTIFIE : panneau unique, zero parasite':'❌ ECHEC : '+newsAfterStartup.length+' messages crees');
  process.exit(newsAfterStartup.length===1?0:1);
})();

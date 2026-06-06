require('dotenv').config();
const fs=require('fs'),path=require('path'),os=require('os'),A=require('@anthropic-ai/sdk');
const LF=path.join(os.homedir(),'podcast-workflow','library.json');
function load(){try{return JSON.parse(fs.readFileSync(LF,'utf8'));}catch{return{scripts:[]};}}
function save(l){fs.writeFileSync(LF,JSON.stringify(l,null,2));}
const cmd=process.argv[2],a1=process.argv[3],a2=process.argv[4];
if(cmd==='list'){
  const lib=load();let s=lib.scripts||[];
  if(a1)s=s.filter(x=>x.performance===a1);
  if(!s.length){console.log('Library empty');process.exit(0);}
  console.log('\nLIBRARY — '+s.length+' scripts\n');
  s.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach((x,i)=>{
    console.log((i+1)+'. '+x.date+' ['+(x.performance||'unrated')+'] '+x.title);
    if(x.tags&&x.tags.length)console.log('   tags: '+x.tags.join(', '));
  });
}else if(cmd==='mark'){
  const lib=load();
  const s=lib.scripts.find(x=>x.title.toLowerCase().includes(a1.toLowerCase()));
  if(!s){console.log('Not found: '+a1);process.exit(1);}
  s.performance=a2;save(lib);
  console.log('OK — "'+s.title+'" marked ['+a2+']');
}else if(cmd==='stats'){
  const lib=load();const c={viral:0,good:0,ok:0,skip:0,unrated:0};
  (lib.scripts||[]).forEach(s=>{c[s.performance||'unrated']=(c[s.performance||'unrated']||0)+1;});
  console.log('\nSTATS: viral='+c.viral+' good='+c.good+' ok='+c.ok+' skip='+c.skip+' unrated='+c.unrated);
}else if(cmd==='looks'){
  const lib=load();const looks=lib.looks||[];
  if(!looks.length){console.log('No looks yet');process.exit(0);}
  console.log('\nLOOKS — '+looks.length+' generated\n');
  looks.slice().reverse().slice(0,20).forEach((l,i)=>
    console.log((i+1)+'. Look'+l.lookNumber+'/20 '+l.date+' — '+l.prompt.substring(0,60))
  );
  const d=path.join(os.homedir(),'podcast-workflow','looks');
  console.log('\nFolder: '+d);
  if(a1==='open'){require('child_process').execSync('open "'+d+'"');}
}else if(cmd==='recreate'){
  const lib=load();const f=a1||'viral';
  const top=(lib.scripts||[]).filter(s=>s.performance===f);
  if(!top.length){console.log('No '+f+' scripts yet.\nMark one: node library.js mark "title" viral');process.exit(1);}
  const ex=top.slice(0,3).map(s=>'- '+s.title).join('\n');
  const all=(lib.scripts||[]).map(s=>s.title).join(', ');
  const ant=new A({apiKey:process.env.ANTHROPIC_API_KEY});
  (async()=>{
    const m=await ant.messages.create({model:'claude-sonnet-4-6',max_tokens:400,
      messages:[{role:'user',content:'TikTok feminine relationship niche.\nTop '+f+':\n'+ex+'\nAvoid: '+all+'\n5 new viral topics. Numbered list only.'}]
    });
    console.log('\nNEW IDEAS:\n'+m.content[0].text+'\n\nTo use: node workflow.js "topic"');
  })();
}else{
  console.log('\nnode library.js list\nnode library.js list viral\nnode library.js stats\nnode library.js mark "title" viral|good|ok|skip\nnode library.js recreate viral\nnode library.js looks\nnode library.js looks open\n');
}

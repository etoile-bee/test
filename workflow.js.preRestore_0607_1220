require('dotenv').config();

const SUBSTYLE=require('./subtitle_style.js'); /*substyle v1 : source unique du style sous-titres (partagee avec test_soustitres.js)*/
const {execSync}=require('child_process'),fetch=require('node-fetch'),fs=require('fs'),path=require('path'),os=require('os'),Anthropic=require('@anthropic-ai/sdk');
const anthropic=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
const HIGGS_AUTH='Key '+process.env.HIGGSFIELD_KEY_ID+':'+process.env.HIGGSFIELD_KEY_SECRET;
const HIGGS_BASE='https://platform.higgsfield.ai';
const SHOTSTACK=process.env.SHOTSTACK_API_KEY,EL_KEY=process.env.ELEVENLABS_API_KEY,EL_VOICE=process.env.ELEVENLABS_VOICE_ID,AVATAR_URL=process.env.HIGGS_AVATAR_URL;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ask=q=>new Promise(resolve=>{const rl=require('readline').createInterface({input:process.stdin,output:process.stdout});rl.question(q,a=>{rl.close();resolve(a.trim().toUpperCase());});});
async function generateScript(topic,words){
  words=words||'55-60';
  console.log('\n📝 Script ('+words+' words)...');
  const __cont=/THIS IS PART [23]/i.test(topic); const __p3=/THIS IS PART 3/i.test(topic); /*continuity v2*/
  const __rule1=__cont?('1. This is a DIRECT CONTINUATION of the SAME video, same person still talking. Do NOT use any hook. Do NOT greet, introduce, recap, summarize, or repeat ANY idea, sentence or phrasing from the earlier parts. Begin mid-thought with a NEW angle that deepens the SAME subject.'+(__p3?' End with ONE short call to action.':' No call to action.')):'1. First sentence = THE HOOK (max 8 words). It MUST stop the scroll in under 1 second. Pick whatever is most viral for THIS topic: a shocking question, a brutal accusation, a forbidden secret, a bold contrarian claim, or a callout that makes her feel seen. Create an instant curiosity gap or emotional punch. No greeting, no warmup, no setup. Make it impossible to scroll past';
  const __rule3=__cont?'Add [pause] before the final punchline':'Add [pause] after the hook and before the final punchline';
  let c=null; /*revue1: retry anti-JSON-tronque*/
  for(let __t=1;__t<=3;__t++){
    try{
      const msg=await anthropic.messages.create({model:'claude-sonnet-4-6',max_tokens:900,/*durfix v1 : 500 tronquait les scripts 160-180 mots*/
        messages:[{role:'user',content:'TikTok relationship coach women 20-40. Topic: "'+topic+'". Return ONLY valid JSON: {"script":"Exactly '+words+' words. VIRAL TikTok script. STRICT RULES:\n'+__rule1+'\n2. Every sentence MAX 8 words. Cut ruthlessly.\n3. '+__rule3+'\n4. Emotional, direct, no fluff. Each word earns its place.\n5. No em dashes. English only.","keywords":["WORD1","WORD2","WORD3","WORD4","WORD5","WORD6"] — pick the 6 most emotionally charged shocking words only,"caption_short":"Max 80 chars + emojis, punchy hook","caption_long":"200-250 chars, develop the idea + call to action + emojis","hashtags":["t1","t2","t3","t4","t5"] where the 5 tags are the MOST VIRAL generic TikTok hashtags (fyp, foryou, foryoupage, viral, trending, relatable) plus 1 topical one max, no hash symbol, lowercase, no spaces,"reactions":[{"after":"exact sentence copied from the script","type":"mhm|yeah|right|hmm"}] choose EXACTLY 2 to 3 reactions, placed right after the most impactful sentences (ideally near a [pause]), so it feels like an interviewer reacting; the "after" value MUST be copied verbatim from the script}'}]
      });
      const __m=msg.content[0].text.match(/\{[\s\S]*\}/);
      if(!__m)throw new Error('pas de JSON dans la reponse');
      c=JSON.parse(__m[0]);
      break;
    }catch(__e){
      console.log('  ⚠ script JSON invalide (essai '+__t+'/3): '+__e.message);
      if(__t===3)throw new Error('Script: echec apres 3 essais — '+__e.message);
    }
  }
  console.log('OK ('+c.script.split(' ').length+'w):',c.script.substring(0,70)+'...');
  return c;
}
async function generateAudio(script,num){
  console.log('\n🎙  Audio Part '+num+' (ElevenLabs Imany)...');
  const mp3='/tmp/wf_'+num+'.mp3',wav='/tmp/wf_'+num+'.wav';
  const res=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+EL_VOICE+'/with-timestamps',{
    method:'POST',headers:{'xi-api-key':EL_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({text:script.replace(/\[pause\]/gi,'<break time="0.8s"/>').replace(/—/g,' ').replace(/–/g,' '),model_id:'eleven_multilingual_v2',voice_settings:{stability:0.45,similarity_boost:0.82,style:0.3,use_speaker_boost:true}})
  });
  let wt=[];
  if(res.ok){
    const d=await res.json();
    fs.writeFileSync(mp3,Buffer.from(d.audio_base64,'base64'));
    const {characters:ch,character_start_times_seconds:st,character_end_times_seconds:en}=d.alignment;
    let word='',ws=0,we=0;
    for(let i=0;i<ch.length;i++){
      const c=ch[i];
      if(c===' '||i===ch.length-1){
        if(i===ch.length-1&&c!==' '){word+=c;we=en[i];}
        const clean=word.trim().replace(/[.,!?;:'"—–-]/g,'').toUpperCase();
        if(clean)wt.push({text:clean,start:ws,end:we,duration:we-ws});
        word='';if(i+1<ch.length)ws=st[i+1];
      }else{if(!word)ws=st[i];word+=c;we=en[i];}
    }
    console.log('  OK '+wt.length+' words timed');
  }else{
    const r2=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+EL_VOICE,{
      method:'POST',headers:{'xi-api-key':EL_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
      body:JSON.stringify({text:script.replace(/\[pause\]/gi,'<break time="0.8s"/>').replace(/—/g,' ').replace(/–/g,' '),model_id:'eleven_multilingual_v2',voice_settings:{stability:0.45,similarity_boost:0.82}})
    });
    if(!r2.ok)throw new Error('ElevenLabs '+r2.status);
    fs.writeFileSync(mp3,await r2.buffer());
    wt=script.split(/\s+/).map((w,i)=>({text:w.replace(/[.,!?;:'"]/g,'').toUpperCase(),start:i*0.42,end:(i+1)*0.42,duration:0.42})).filter(w=>w.text);
  }
  execSync('ffmpeg -y -i "'+mp3+'" -ar 44100 -ac 1 -c:a pcm_s16le "'+wav+'" 2>/dev/null');
  let raw1=execSync('curl -s -F "file=@'+wav+'" https://tmpfiles.org/api/v1/upload').toString().trim();
  let audioUrl=JSON.parse(raw1).data.url.replace("tmpfiles.org/","tmpfiles.org/dl/");
  if(!audioUrl.startsWith('http'))throw new Error('Audio upload failed: '+audioUrl);
  console.log('  OK:',audioUrl);
  const duration=wt.length>0?wt[wt.length-1].end+1.5:23;
  return{audioUrl,wordTimings:wt,duration};
}
async function prepareImage(){
  console.log('\n🖼  Preparing avatar...');
  const i='/tmp/wf_src.jpg',o='/tmp/wf_ready.jpg';
  let url=process.env.HIGGS_AVATAR_URL;
  if(!url)throw new Error('HIGGS_AVATAR_URL not set');
  if(url.startsWith('/')){execSync('cp "'+url+'" "'+i+'"');}else{execSync('curl -s -o "'+i+'" "'+url+'"');}
  execSync('ffmpeg -y -i "'+i+'" -vf scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,unsharp=5:5:1.5:5:5:0.0 -q:v 2 "'+o+'" 2>/dev/null'); /*aspect v1*/
  let raw2=execSync('curl -s -F "file=@'+o+'" https://tmpfiles.org/api/v1/upload').toString().trim();
  let u=JSON.parse(raw2).data.url.replace("tmpfiles.org/","tmpfiles.org/dl/");
  if(!u.startsWith('http'))throw new Error('Image upload failed');
  console.log('  OK:',u);return u;
}
async function generateLipsync(imageUrl,audioUrl,num){
  console.log('\n🎬 Lipsync Part '+num+' (Kling)...');
  const res=await fetch(HIGGS_BASE+'/v1/speak/kling',{
    method:'POST',headers:{'Authorization':HIGGS_AUTH,'Content-Type':'application/json'},
    body:JSON.stringify({params:{input_image:{type:'image_url',image_url:imageUrl},input_audio:{type:'audio_url',audio_url:audioUrl},prompt:'Confident elegant woman speaking naturally to camera, realistic, broadcast quality'}})
  });
  if(!res.ok)throw new Error('Lipsync '+res.status+': '+(await res.text()).substring(0,150));
  const data=await res.json();
  const jobId=data.id||data.job_id||data.request_id;
  console.log('  Job:',jobId);
  for(let i=0;i<540;i++){
    await sleep(5000);
    const p=await fetch(HIGGS_BASE+'/requests/'+jobId+'/status',{headers:{'Authorization':HIGGS_AUTH}});
    if(!p.ok)continue;
    const d=await p.json();
    if(i%3===0)process.stdout.write('  ['+(d.status||'...')+' '+(i*5)+'s]\r');
    const s=(d.status||'').toLowerCase();
    if(s==='completed'||s==='done'||s==='succeeded'){
      console.log('');
      const url=(d.video&&d.video.url)||(d.results&&d.results[0]&&d.results[0].url)||d.url;
      if(!url)throw new Error('No URL: '+JSON.stringify(d).substring(0,200));
      console.log('  OK:',url);return url;
    }
    if(s==='failed')throw new Error('Failed: '+JSON.stringify(d).substring(0,200));
  }
  throw new Error('Timeout 45min');
}
async function saveLipsyncRaw(url,num,ts,outDir){
  try{const p=require('path').join(outDir,ts+'_raw_p'+num+'.mp4');require('child_process').execSync('curl -s -o "'+p+'" "'+url+'"');console.log('  Raw saved:',p);}catch(e){console.log('  (raw save skipped)');}
}
async function renderVideo(lipsyncUrl,wordTimings,keywords,duration,num,reactions){
  console.log('\n✨ Rendering Part '+num+' (Shotstack)...');
  const kws=new Set(keywords.map(k=>k.toUpperCase()));
  // Strip [pause] tokens from word timings
  wordTimings=wordTimings.filter(w=>!/^\[pause\]$/i.test(w.text)); /*revue1: w.word n'existait pas → [PAUSE] s'affichait en fallback*/
  const wt=wordTimings.filter(w=>w.text&&w.duration>0);
  // couper la fin qui traine : limiter a la fin reelle de la parole (+petite marge)
  const _speechEnd=wordTimings.reduce((m,w)=>Math.max(m,(w.end||0)),0);
  if(_speechEnd>1&&_speechEnd<duration)duration=_speechEnd+0.35;
  // groupes 1-2 mots : 2 mots ensemble, mais mot seul si l'un fait > 7 lettres. Zero chevauchement.
  const GAP=0.02;const LONG=7;
  const chunks=[];
  let i=0;
  while(i<wt.length){
    const w=wt[i];
    const w2=wt[i+1];
    // on groupe 2 mots seulement si les deux existent ET aucun n'est trop long
    let group;
    if(w2&&w.text.length<=LONG&&w2.text.length<=LONG){
      group=[w,w2];i+=2;
    }else{
      group=[w];i+=1;
    }
    const after=wt[i]; // mot qui suit le groupe
    const start=group[0].start;
    let end=group[group.length-1].end;
    if(after)end=after.start-GAP; /*subfill v1*/ // chaque sous-titre reste jusqu'au suivant : plus de trous pendant les pauses
    if(end<=start)end=start+0.12;
    chunks.push({text:group.map(g=>g.text).join(' '),start:start,length:Math.max(end-start,0.12)});
  }
  // === sous-titres : style unique via subtitle_style.js /*substyle v1 — bloc _zr/_scaleAt supprime (code mort, _sc jamais utilise)*/
  const subClips=chunks.map(function(c){
    /*substyle v1 : style + position lus depuis subtitle_style.js — identique au test sandbox*/
    return {asset:{type:'html',html:SUBSTYLE.styleHtml(c.text),width:SUBSTYLE.WIDTH,height:SUBSTYLE.HEIGHT,background:'transparent'},start:c.start,length:c.length,position:'bottom',offset:{x:0,y:SUBSTYLE.OY}};
  });
  const sorted=wordTimings.filter(w=>kws.has(w.text)).sort((a,b)=>a.start-b.start);
  // zoom dynamique : plan large entre les mots-cles, zoom alterne (in/out) sur chaque mot-cle
  const ZOOMS=[1.10,1.18,1.12,1.20,1.14,1.16]; // intensites qui alternent pour faire respirer
  let vc=[],cur=0,ki=0;
  for(const kw of sorted){
    const zs=Math.max(kw.start-0.05,cur);
    // segment plan large avant le mot-cle
    if(zs>cur+0.05)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:zs-cur,scale:1.0});
    // segment zoom sur le mot-cle, intensite alternee
    const z=ZOOMS[ki%ZOOMS.length];ki++;
    const ze=Math.min(zs+2.5,duration); /*zoom2*/ // zoom plus frequent
    vc.push({asset:{type:'video',src:lipsyncUrl,trim:zs},start:zs,length:ze-zs,scale:z});
    cur=ze;
  }
  if(cur<duration-0.1)vc.push({asset:{type:'video',src:lipsyncUrl,trim:cur},start:cur,length:duration-cur,scale:1.0});
  if(vc.length===0)vc=[{asset:{type:'video',src:lipsyncUrl},start:0,length:duration}];
  vc.forEach(function(_c){if(_c.asset&&_c.asset.type==='video')_c.asset.volume=0;}); const _audioBed=[{asset:{type:'video',src:lipsyncUrl,volume:1},start:0,length:duration,scale:1.0}]; const _reactClips=[]; /*reactions v1*/
  try{
    if(false&&reactions&&reactions.length){ /*reactions OFF (demande Etoile 07/06) — remettre true pour reactiver*/
      const _norm=s=>String(s||'').toUpperCase().replace(/[.,!?;:'"—–-]/g,'').split(/\s+/).filter(Boolean);
      const _cache={};
      for(const _rx of reactions.slice(0,2)){
        const _type=(_rx.type||'').toLowerCase();
        if(['mhm','yeah','right','hmm'].indexOf(_type)<0)continue;
        const _key=_norm(_rx.after);if(!_key.length)continue;
        let _endT=null;
        for(let n=Math.min(3,_key.length);n>=1&&_endT===null;n--){
          const _tail=_key.slice(_key.length-n);
          for(let i=0;i+n<=wt.length;i++){let ok=true;for(let j=0;j<n;j++){if(wt[i+j].text!==_tail[j]){ok=false;break;}}if(ok)_endT=wt[i+n-1].end;}
        }
        if(_endT===null)continue;
        let _url=_cache[_type];
        if(!_url){const _mp3=require('path').join(require('os').homedir(),'podcast-workflow','reactions',_type+'.mp3');if(!require('fs').existsSync(_mp3))continue;const _raw=execSync('curl -s -F "file=@'+_mp3+'" https://tmpfiles.org/api/v1/upload').toString().trim();_url=JSON.parse(_raw).data.url.replace('tmpfiles.org/','tmpfiles.org/dl/');_cache[_type]=_url;}
        const _st=Math.min(Math.max(_endT+0.05,0),Math.max(duration-0.4,0));
        _reactClips.push({asset:{type:'audio',src:_url,volume:0.5},start:_st,length:1.2}); /*react vol v3*/
        console.log('  reaction '+_type+' @'+_st.toFixed(2)+'s');
      }
    }
  }catch(e){console.log('  reactions skip:',e.message);}
  const _tracks=[{clips:subClips},{clips:vc},{clips:_audioBed}];
  if(_reactClips.length)_tracks.push({clips:_reactClips});
  const edit={timeline:{fonts:SUBSTYLE.FONTS,background:'#000000',tracks:_tracks},output:{format:'mp4',resolution:'hd',aspectRatio:'9:16',fps:30}}; /*substyle v4 : police embarquee aussi en prod*/
  const r=await fetch('https://api.shotstack.io/edit/v1/render',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':SHOTSTACK},body:JSON.stringify(edit)});
  const d=await r.json();
  if(!d.success)throw new Error('Shotstack: '+JSON.stringify(d).substring(0,200));
  const id=d.response.id;
  for(let i=0;i<72;i++){
    await sleep(5000);
    const p=await fetch('https://api.shotstack.io/edit/v1/render/'+id,{headers:{'x-api-key':SHOTSTACK}});
    const s=await p.json();
    process.stdout.write('  ['+s.response.status+' '+(i*5)+'s]\r');
    if(s.response.status==='done'){console.log('\n  OK:',s.response.url);return s.response.url;}
    if(s.response.status==='failed')throw new Error('Shotstack failed');
  }
  throw new Error('Shotstack timeout');
}
const COLOR=require('./color_style.js'); /*coloradapt v2 : source unique partagee avec test_soustitres.js*/
async function saveOpen(url,content,ts,num,outDir){
  const p=path.join(outDir,ts+'_p'+num+'.mp4');
  try{const cf=p.replace('.mp4','.txt');const tags=(content.hashtags||[]).map(h=>'#'+h).join(' ');const txt='SCRIPT:\n'+(content.script||'')+'\n\nSHORT:\n'+(content.caption_short||content.caption||'')+'\n\nLONG:\n'+(content.caption_long||'')+'\n\nHASHTAGS:\n'+tags;require('fs').writeFileSync(cf,txt);console.log('Caption saved:',cf);}catch(e){}
  execSync('curl -s -o "'+p+'" "'+url+'"');
  // === passe finale : fondu audio (anti-pop) + couleur de-jaunie pour coller au brut Kling /*finalpass v1*/
  try{
    const _cp=require('child_process');const _fs=require('fs');
    let _dur=0;try{_dur=parseFloat(_cp.execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "'+p+'"').toString().trim())||0;}catch(_e){_dur=0;}
    const TRIM=0.10; /*trimstart v1 : coupe le debut (pop audio incurable) — video+audio ensemble, synchro intacte*/
    let _af='afade=t=in:ss=0:d=0.12';
    if(_dur>0.5){_af+=',afade=t=out:st='+Math.max(_dur-TRIM-0.15,0).toFixed(2)+':d=0.15';}
    const _vf=COLOR.buildVf(p); /*coloradapt v2 : teinte V5 validee, adaptative, source unique color_style.js*/
    const _tmp=p.replace(/\.mp4$/,'_fix.mp4');
    _cp.execSync('ffmpeg -y -ss '+TRIM+' -i "'+p+'" -vf "'+_vf+'" -af "'+_af+'"'+COLOR.ENCODE+'-c:a aac -b:a 192k "'+_tmp+'" 2>/dev/null'); /*coloradapt v2 : encodage commun (crf17/medium + bt709)*/
    if(_fs.existsSync(_tmp)&&_fs.statSync(_tmp).size>10000){_fs.renameSync(_tmp,p);console.log('  Passe finale OK (anti-pop + couleur).');}
    else{try{if(_fs.existsSync(_tmp))_fs.unlinkSync(_tmp);}catch(_e2){}console.log('  (passe finale ignoree, video brute conservee)');}
  }catch(_e){console.log('  (passe finale ignoree: '+_e.message+')');}
  console.log('\n✅ Part '+num+':',p);
  execSync('open "'+p+'"');
  try{require('child_process').execSync('curl -s -d \"Video Part '+num+' prete !\" -H \"Title: Podcast Workflow\" -H \"Tags: clapper\" https://ntfy.sh/fayrouz-podcast');}catch(e){}
  console.log('📝',content.caption_short||content.caption||''); /*revue1*/
  console.log('🏷 ',content.hashtags.map(h=>'#'+h).join(' '));
  return p;
}
async function main(){
  const outDir=path.join(os.homedir(),'podcast-workflow','outputs');
  if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});

  // SETUP
  console.log('\n'+'━'.repeat(50)+'\n⚙️  SETUP\n'+'━'.repeat(50));
  const avatarShort=(process.env.HIGGS_AVATAR_URL||'not set').split('/').pop();
  console.log('\n🖼  Photo: ...'+avatarShort);
  console.log('   (type RANDOM to pick from looks/ folder)');
  const chPhoto=await ask('   Change photo? (YES/NO) > ');
  if(chPhoto==='YES'){
    const newUrl=await ask('   Paste URL / RANDOM / PICK (open file dialog) > ');
    if(newUrl.trim().toUpperCase()==='PICK'){
      try {
        const result=require('child_process').execSync(
          'osascript -e \'choose file with prompt "Select a look:" of type {"public.image"}\''
        ).toString().trim();
        const posix=require('child_process').execSync('osascript -e \'POSIX path of "'+result+'"\'').toString().trim();
        if(posix && require('fs').existsSync(posix)){
          let rawUp=require('child_process').execSync('curl -s -F "file=@'+posix+'" https://tmpfiles.org/api/v1/upload').toString().trim();
          let uploadUrl=JSON.parse(rawUp).data.url.replace("tmpfiles.org/","tmpfiles.org/dl/");
          if(uploadUrl.startsWith('http')){
            const ep=path.join(os.homedir(),'podcast-workflow','.env');
            let env=fs.readFileSync(ep,'utf8');
            env=env.replace(/HIGGS_AVATAR_URL=.*/,'HIGGS_AVATAR_URL='+uploadUrl);
            fs.writeFileSync(ep,env);
            process.env.HIGGS_AVATAR_URL=uploadUrl;
            console.log('   OK Photo selected:', posix.split('/').pop());
          }
        }
      } catch(e){ console.log('   File picker cancelled'); }
    } else if(newUrl.trim().toUpperCase()==='RANDOM'){
      const looksDir=path.join(os.homedir(),'podcast-workflow','looks');
      if(fs.existsSync(looksDir)){
        const pickedPath=require('./look_picker.js').pickLook(looksDir); /*lookpick v1 : nouveautes d'abord*/
        if(pickedPath){
          const pick=path.basename(pickedPath);
          let rawUp=require('child_process').execSync('curl -s -F "file=@'+pickedPath+'" https://tmpfiles.org/api/v1/upload').toString().trim();
          let uploadUrl=JSON.parse(rawUp).data.url.replace("tmpfiles.org/","tmpfiles.org/dl/");
          if(uploadUrl.startsWith('http')){
            const ep=path.join(os.homedir(),'podcast-workflow','.env');
            let env=fs.readFileSync(ep,'utf8');
            env=env.replace(/HIGGS_AVATAR_URL=.*/,'HIGGS_AVATAR_URL='+uploadUrl);
            fs.writeFileSync(ep,env);
            process.env.HIGGS_AVATAR_URL=uploadUrl;
            console.log('   ✅ Random look picked: '+pick);
          }
        } else { console.log('   No looks in ~/podcast-workflow/looks/ yet'); }
      }
    } else if(newUrl.trim().startsWith('http')){
      const ep=path.join(os.homedir(),'podcast-workflow','.env');
      let env=fs.readFileSync(ep,'utf8');
      env=env.replace(/HIGGS_AVATAR_URL=.*/,'HIGGS_AVATAR_URL='+newUrl.trim());
      fs.writeFileSync(ep,env);
      process.env.HIGGS_AVATAR_URL=newUrl.trim();
      console.log('   ✅ Photo updated');
    }
  }
  /*durfix v1 : la duree peut arriver du bot en argv[3] ('25s'/'40s'/'65s' ou '15'/'23'/'30')*/
  let words='55-60';
  const _argDur=(process.argv[3]||'').toLowerCase().replace('s','');
  if(_argDur==='40')words='90-110';
  else if(_argDur==='65')words='160-180';
  else if(_argDur==='15')words='45-55';
  const _dl0=words==='45-55'?'15s':words==='90-110'?'40s':words==='160-180'?'65s':'23s';
  console.log('\n⏱  Duration: '+_dl0+' ('+words+' words)');
  const chDur=await ask('   Change? (YES/NO) > ');
  if(chDur==='YES'){
    const d=await ask('   Seconds (15/23/30) > ');
    if(d==='15')words='45-55';else if(d==='30')words='95-110';
    console.log('   ✅ Set to '+d+'s');
  }
  let topic=process.argv[2];
  if(!topic){
    console.log('\n🔍 Auto-picking topic...');
    const lp=path.join(os.homedir(),'podcast-workflow','library.json');
    const lib=fs.existsSync(lp)?JSON.parse(fs.readFileSync(lp,'utf8')):{scripts:[]};
    const used=(lib.scripts||[]).map(s=>s.title).join(', ')||'none';
    const pick=await anthropic.messages.create({model:'claude-sonnet-4-6',max_tokens:100,
      messages:[{role:'user',content:'TikTok relationship coach women 20-40. ONLY romantic relationship topics: red flags, toxic men, attachment styles, self-worth, breakups, why men pull away, dating mistakes, narcissists, dating coach tips, healing after heartbreak, anxious/avoidant attachment, situationships, soft life, feminine energy, knowing your worth. Pick ONE viral topic not yet covered. Already covered: '+used+'. Return ONLY the title in English, no quotes, no bold.'}]
    });
    topic=pick.content[0].text.trim().replace(/^["'*]+|["'*]+$/g,'');
    console.log('  Topic:',topic);
  }
  const as=(process.env.HIGGS_AVATAR_URL||'').split('/').pop();
  const dl=words==='45-55'?'15s':words==='95-110'?'30s':words==='90-110'?'40s':words==='160-180'?'65s':'23s'; /*durfix v1*/
  console.log('\n'+'━'.repeat(50)+'\n📋 SUMMARY\n'+'━'.repeat(50));
  console.log('📌 Topic:   ',topic);
  console.log('🖼  Photo:    ...'+as.substring(0,40));
  console.log('⏱  Duration:',dl,'('+words+' words)');
  console.log('━'.repeat(50));
  const go=await ask('\n▶  Start? (YES / TOPIC / NO) > ');
  if(go==='TOPIC'){
    console.log('\n🔍 Picking new topic...');
    const lp2=require('path').join(require('os').homedir(),'podcast-workflow','library.json');
    const lib2=require('fs').existsSync(lp2)?JSON.parse(require('fs').readFileSync(lp2,'utf8')):{scripts:[]};
    const used2=(lib2.scripts||[]).map(s=>s.title).join(', ')||'none';
    const pick2=await anthropic.messages.create({model:'claude-sonnet-4-6',max_tokens:100,
      messages:[{role:'user',content:'TikTok relationship coach women 20-40. ONLY romantic relationship topics: red flags, toxic men, attachment styles, self-worth, breakups, why men pull away, dating mistakes, narcissists. Pick ONE viral topic not yet covered. Already covered: '+used2+'. Return ONLY the title in English, no quotes, no bold.'}]
    });
    topic=pick2.content[0].text.trim().replace(/^["'*]+|["'*]+$/g,'');
    console.log('  New topic:',topic);
    const as2=(process.env.HIGGS_AVATAR_URL||'').split('/').pop();
    console.log('\n'+'━'.repeat(50));
    console.log('📌 Topic:   ',topic);
    console.log('🖼  Photo:    ...'+as2.substring(0,40));
    console.log('⏱  Duration:',dl,'('+words+' words)');
    console.log('━'.repeat(50));
    const go2=await ask('\n▶  Start? (YES / TOPIC / NO) > ');
    if(go2!=='YES'){console.log('\nCancelled.');process.exit(0);}
  } else if(go!=='YES'){console.log('\nCancelled.');process.exit(0);}

  const ts=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  try{
    let c1=await generateScript(topic,words);
    let approved=false;
    while(!approved){
      console.log('\n--- SCRIPT ---');
      console.log(c1.script);
      console.log('Caption: '+(c1.caption_short||'')); /*revue1*/
      console.log('Tags: '+c1.hashtags.map(h=>'#'+h).join(' '));
      console.log('--------------');
      const check=await ask('Approve? YES / NEW / NO > ');
      if(check==='YES')approved=true;
      else if(check==='NEW')c1=await generateScript(topic,words);
      else{console.log('Cancelled.');process.exit(0);}
    }
    const {audioUrl:a1,wordTimings:wt1,duration:d1}=await generateAudio(c1.script,1);
    const imageUrl=await prepareImage();
    const lip1=await generateLipsync(imageUrl,a1,1);
    await saveLipsyncRaw(lip1,1,ts,outDir);
    const vid1=await renderVideo(lip1,wt1,c1.keywords,d1,1,c1.reactions);
    await saveOpen(vid1,c1,ts,1,outDir);
    try{const lp=path.join(os.homedir(),'podcast-workflow','library.json');const lib=fs.existsSync(lp)?JSON.parse(fs.readFileSync(lp,'utf8')):{scripts:[]};lib.scripts.push({id:Date.now().toString(),title:topic,date:ts.slice(0,10),script:c1.script,performance:null});fs.writeFileSync(lp,JSON.stringify(lib,null,2));console.log('📚 Saved to library');}catch(e){}
    const more=await ask('\nMake 2 more parts with same outfit? (YES/NO) > ');
    if(more!=='YES'){console.log('\nDone! ✅');process.exit(0);}
    const t2=topic+'. THIS IS PART 2, a DIRECT CONTINUATION of the SAME video. Part 1 already said: <<'+c1.script+'>>. Rules: do NOT repeat any idea, sentence, hook, or phrasing from Part 1. Open mid-thought with a NEW angle that deepens it. No greeting, no re-introduction, no recap, no call to action.';
    let c2=await generateScript(t2,words); /*revue1: approbation script Part 2 AVANT depense ElevenLabs+Kling*/
    let ok2=false;
    while(!ok2){
      console.log('\n--- SCRIPT Part 2 ---');
      console.log(c2.script);
      console.log('Caption: '+(c2.caption_short||''));
      console.log('Tags: '+c2.hashtags.map(h=>'#'+h).join(' '));
      console.log('--------------');
      const ck2=await ask('Approve? YES / NEW / NO > ');
      if(ck2==='YES')ok2=true;
      else if(ck2==='NEW')c2=await generateScript(t2,words);
      else{console.log('\nStopped after Part 1. ✅');process.exit(0);}
    }
    const {audioUrl:a2,wordTimings:wt2,duration:d2}=await generateAudio(c2.script,2);
    const lip2=await generateLipsync(imageUrl,a2,2);
    await saveLipsyncRaw(lip2,2,ts,outDir);
    const vid2=await renderVideo(lip2,wt2,c2.keywords,d2,2,c2.reactions);
    await saveOpen(vid2,c2,ts,2,outDir);
    const next=await ask('\nContinue to Part 3? (YES/NO) > ');
    if(next!=='YES'){console.log('\nStopped at Part 2. ✅');process.exit(0);}
    const t3=topic+'. THIS IS PART 3, the FINAL part of the SAME video. Part 1 said: <<'+c1.script+'>>. Part 2 said: <<'+c2.script+'>>. Rules: do NOT repeat anything already said in Part 1 or Part 2. Deliver the NEW culminating insight, then end with ONE short call to action. No greeting, no recap, no hook.';
    let c3=await generateScript(t3,words); /*revue1: approbation script Part 3 AVANT depense*/
    let ok3=false;
    while(!ok3){
      console.log('\n--- SCRIPT Part 3 ---');
      console.log(c3.script);
      console.log('Caption: '+(c3.caption_short||''));
      console.log('Tags: '+c3.hashtags.map(h=>'#'+h).join(' '));
      console.log('--------------');
      const ck3=await ask('Approve? YES / NEW / NO > ');
      if(ck3==='YES')ok3=true;
      else if(ck3==='NEW')c3=await generateScript(t3,words);
      else{console.log('\nStopped at Part 2. ✅');process.exit(0);}
    }
    const {audioUrl:a3,wordTimings:wt3,duration:d3}=await generateAudio(c3.script,3);
    const lip3=await generateLipsync(imageUrl,a3,3);
    await saveLipsyncRaw(lip3,3,ts,outDir);
    const vid3=await renderVideo(lip3,wt3,c3.keywords,d3,3,c3.reactions);
    await saveOpen(vid3,c3,ts,3,outDir);
    console.log('\n🎉 All 3 done! Saved in:',outDir);
  }catch(err){console.error('\n❌',err.message);process.exit(1);}
}
main();

const fs=require('fs');const {execSync}=require('child_process');
const FILE='workflow.js';let src=fs.readFileSync(FILE,'utf8');
if(src.includes('/*reactions v1*/')){console.error('Deja patche.');process.exit(1);}
const aA="no spaces}'";
const aB="no spaces,\"reactions\":[{\"after\":\"exact sentence copied from the script\",\"type\":\"mhm|yeah|right|hmm\"}] choose EXACTLY 1 to 2 reactions max, placed right after the most impactful sentences (ideally near a [pause]), so it feels like an interviewer reacting; the \"after\" value MUST be copied verbatim from the script}'";
const bA="async function renderVideo(lipsyncUrl,wordTimings,keywords,duration,num){";
const bB="async function renderVideo(lipsyncUrl,wordTimings,keywords,duration,num,reactions){";
const cA="const edit={timeline:{background:'#000000',tracks:[{clips:subClips},{clips:vc},{clips:_audioBed}]},output:{format:'mp4',resolution:'hd',aspectRatio:'9:16',fps:30}}; /*audiobed v1*/";
const cB="const _reactClips=[]; /*reactions v1*/\n  try{\n    if(reactions&&reactions.length){\n      const _norm=s=>String(s||'').toUpperCase().replace(/[.,!?;:'\"\\u2014\\u2013-]/g,'').split(/\\s+/).filter(Boolean);\n      const _cache={};\n      for(const _rx of reactions.slice(0,2)){\n        const _type=(_rx.type||'').toLowerCase();\n        if(['mhm','yeah','right','hmm'].indexOf(_type)<0)continue;\n        const _key=_norm(_rx.after);if(!_key.length)continue;\n        let _endT=null;\n        for(let n=Math.min(3,_key.length);n>=1&&_endT===null;n--){\n          const _tail=_key.slice(_key.length-n);\n          for(let i=0;i+n<=wt.length;i++){let ok=true;for(let j=0;j<n;j++){if(wt[i+j].text!==_tail[j]){ok=false;break;}}if(ok)_endT=wt[i+n-1].end;}\n        }\n        if(_endT===null)continue;\n        let _url=_cache[_type];\n        if(!_url){const _mp3=require('path').join(require('os').homedir(),'podcast-workflow','reactions',_type+'.mp3');if(!require('fs').existsSync(_mp3))continue;const _raw=execSync('curl -s -F \"file=@'+_mp3+'\" https://tmpfiles.org/api/v1/upload').toString().trim();_url=JSON.parse(_raw).data.url.replace('tmpfiles.org/','tmpfiles.org/dl/');_cache[_type]=_url;}\n        const _st=Math.min(Math.max(_endT+0.05,0),Math.max(duration-0.4,0));\n        _reactClips.push({asset:{type:'audio',src:_url,volume:0.32},start:_st,length:1.2});\n        console.log('  reaction '+_type+' @'+_st.toFixed(2)+'s');\n      }\n    }\n  }catch(e){console.log('  reactions skip:',e.message);}\n  const _tracks=[{clips:subClips},{clips:vc},{clips:_audioBed}];\n  if(_reactClips.length)_tracks.push({clips:_reactClips});\n  const edit={timeline:{background:'#000000',tracks:_tracks},output:{format:'mp4',resolution:'hd',aspectRatio:'9:16',fps:30}};";
const d1A="const vid1=await renderVideo(lip1,wt1,c1.keywords,d1,1);";
const d1B="const vid1=await renderVideo(lip1,wt1,c1.keywords,d1,1,c1.reactions);";
const d2A="const vid2=await renderVideo(lip2,wt2,c2.keywords,d2,2);";
const d2B="const vid2=await renderVideo(lip2,wt2,c2.keywords,d2,2,c2.reactions);";
const d3A="const vid3=await renderVideo(lip3,wt3,c3.keywords,d3,3);";
const d3B="const vid3=await renderVideo(lip3,wt3,c3.keywords,d3,3,c3.reactions);";
function rep(a,b,l){const c=src.split(a).length-1;if(c!==1){console.error('Ancre '+l+' = '+c+' (attendu 1). Annule, rien ecrit.');process.exit(1);}src=src.split(a).join(b);}
rep(aA,aB,'A-prompt');rep(bA,bB,'B-signature');rep(cA,cB,'C-reactions-track');rep(d1A,d1B,'D-call1');rep(d2A,d2B,'E-call2');rep(d3A,d3B,'F-call3');
fs.writeFileSync('workflow.patched.js',src);
try{execSync('node --check workflow.patched.js',{stdio:'pipe'});}
catch(e){console.error('Syntaxe KO.');console.error(e.stderr?e.stderr.toString():e.message);process.exit(1);}
fs.copyFileSync(FILE,FILE+'.prereactions');fs.renameSync('workflow.patched.js',FILE);
console.log('Patch reactions v1 applique.');

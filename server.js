require('dotenv').config();
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {spawn}=require('child_process');
const PORT=3333;
const BASE=path.join(os.homedir(),'podcast-workflow');
const OUTPUTS=path.join(BASE,'outputs');
const LOOKS=path.join(BASE,'looks');
const LIBRARY=path.join(BASE,'library.json');
const ENV_PATH=path.join(BASE,'.env');

let proc=null,clients=[],hist=[],replayQ=[],replaying=false,curQ='';
let job={active:false,topic:'',parts:{},cur:1,log:[]};
let completed=[];

function sse(d){const s='data:'+JSON.stringify(d)+'\n\n';clients=clients.filter(r=>{try{r.write(s);return true;}catch{return false;}});}
function rdir(p,exts){try{const r=fs.realpathSync(p);return fs.readdirSync(r).filter(f=>exts.some(e=>f.toLowerCase().endsWith(e))).sort();}catch{return[];}}
function getVideos(){return rdir(OUTPUTS,['.mp4']).filter(f=>!f.includes('_raw_')).reverse().map(f=>({name:f}));}
function getLooks(){return rdir(LOOKS,['.jpg','.jpeg','.png','.webp']);}
function getLib(){try{return JSON.parse(fs.readFileSync(LIBRARY,'utf8'));}catch{return{scripts:[]};}}
function setAvatar(p){
  let e=fs.readFileSync(ENV_PATH,'utf8');
  e=e.replace(/HIGGS_AVATAR_URL=.*/,'HIGGS_AVATAR_URL='+p);
  fs.writeFileSync(ENV_PATH,e);
  process.env.HIGGS_AVATAR_URL=p;
  console.log('Avatar updated:',p);
}

const TRIG=['Change photo','Approve?','YES / NEW','YES / TOPIC','Start?','Make 2 more','Continue to Part','Paste URL','Change?','duration'];

function handleLine(line){
  sse({type:'log',msg:line});
  // update job progress
  const m=line.match(/Part\s+(\d)/);const p=m?+m[1]:(job.cur||1);
  if(!job.parts[p])job.parts[p]={step:'Waiting...',pct:0};
  if(/Generating script/i.test(line)){job.parts[p].step='Script...';job.parts[p].pct=10;}
  if(/OK \(\d+w\)/.test(line)){job.parts[p].step='Script done';job.parts[p].pct=25;}
  if(/Audio Part|ElevenLabs/i.test(line)){job.parts[p].step='Audio...';job.parts[p].pct=35;job.cur=p;}
  if(/Lipsync Part/i.test(line)){job.parts[p].step='Lipsync...';job.parts[p].pct=60;job.cur=p;}
  if(/Rendering Part|Shotstack/i.test(line)){job.parts[p].step='Rendering...';job.parts[p].pct=85;}
  if(/Saved:|Done!/i.test(line)){job.parts[p].step='Done!';job.parts[p].pct=100;}
  if(/Topic:/i.test(line)){const t=line.match(/Topic:\s*(.+)/i);if(t)job.topic=t[1].trim();}
  if(line.includes('LOOK_PREVIEW:')){const u=line.split('LOOK_PREVIEW:')[1].trim();sse({type:'look_preview',url:u});}
  job.log.push(line.trim());if(job.log.length>80)job.log.shift();
  if(TRIG.some(t=>line.includes(t))){
    curQ=line.trim();
    if(replaying&&replayQ.length>0){
      const a=replayQ.shift();if(replayQ.length===0)replaying=false;
      sse({type:'log',msg:'[auto] '+a});
      setTimeout(()=>{if(proc)proc.stdin.write(a+'\n');},300);
    }else{replaying=false;sse({type:'prompt',msg:line.trim()});sse({type:'hist',h:hist});}
  }
  sse({type:'job',j:job,done:completed});
}

function startProc(topic){
  if(proc)return false;
  job={active:true,topic:topic||'',parts:{},cur:1,log:['Starting...']};
  hist=[];replayQ=[];replaying=false;curQ='';
  const args=[path.join(BASE,'workflow.js')];if(topic)args.push(topic);
  proc=spawn('node',args,{cwd:BASE,env:{...process.env}});
  sse({type:'status',s:'run'});
  proc.stdout.on('data',d=>d.toString().split('\n').filter(l=>l.trim()).forEach(handleLine));
  proc.stderr.on('data',d=>{const m=d.toString().trim();if(m)sse({type:'log',msg:m});});
  proc.on('close',()=>{
    proc=null;
    if(job.topic){completed.unshift({topic:job.topic,time:new Date().toLocaleTimeString(),parts:Object.keys(job.parts).length});if(completed.length>10)completed.pop();}
    job.active=false;sse({type:'done'});sse({type:'status',s:'idle'});sse({type:'job',j:job,done:completed});
  });
  return true;
}

let knownV=new Set(getVideos().map(v=>v.name));
setInterval(()=>{const c=new Set(getVideos().map(v=>v.name));c.forEach(n=>{if(!knownV.has(n))sse({type:'video_ready',name:n});});knownV=c;},3000);

const HTML=`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="Cache-Control" content="no-cache,no-store">
<title>Podcast Workflow</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif}
body{touch-action:manipulation;-webkit-text-size-adjust:100%;padding-bottom:60px;cursor:pointer}
.hdr{background:#12122e;padding:14px 16px;text-align:center;border-bottom:1px solid #1e1e3a}
.hdr h1{font-size:17px;font-weight:700}
.hdr .sub{font-size:11px;color:#666;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%;background:#333;display:inline-block;flex-shrink:0}
.dot.run{background:#3fb950;animation:blink 1.2s infinite}
.dot.err{background:#f85149}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.tabs{display:flex;background:#0d0d0d;border-bottom:1px solid #1a1a1a;position:sticky;top:0;z-index:100}
.tab{flex:1;padding:13px 6px;text-align:center;font-size:12px;font-weight:500;color:#555;border-bottom:2px solid transparent;border-top:none;border-left:none;border-right:none;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.tab.on{color:#7b8ef7;border-bottom-color:#7b8ef7;font-weight:600}
section{display:none;padding:16px}
section.on{display:block}
.label{font-size:10px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:1.5px;margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid #161616}
.label:first-child{margin-top:0}
.btn{display:block;width:100%;padding:15px;border-radius:13px;border:none;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:9px;-webkit-tap-highlight-color:transparent;text-align:center}
.btn:active{opacity:.75}
.primary{background:linear-gradient(135deg,#5c6bc0,#7e57c2);color:#fff}
.ghost{background:#161616;color:#aaa;border:1px solid #222}
.inp{width:100%;padding:13px;border-radius:12px;border:1px solid #222;background:#141414;color:#fff;font-size:15px;margin-bottom:11px;outline:none;-webkit-appearance:none}
.term{background:#0c1015;border-radius:12px;padding:12px;font-family:'Menlo','Monaco',monospace;font-size:11px;height:200px;overflow-y:auto;white-space:pre-wrap;color:#57e389;line-height:1.55;border:1px solid #161616;word-break:break-all}
.card{background:#111;border:1px solid #1c1c1c;border-radius:13px;padding:14px;margin-bottom:10px}
.pblock{background:#0c1220;border:1px solid #1a2840;border-radius:13px;padding:14px;margin-top:12px;display:none}
.pblock.on{display:block}
.pq{font-size:13px;color:#90b8ff;font-weight:600;margin-bottom:12px;line-height:1.45}
.pbts{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.pbts .b{flex:1;min-width:75px;padding:12px 8px;border-radius:10px;border:none;font-weight:700;font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.pbts .b:active{opacity:.7}
.g{background:#2ea043;color:#fff}.gr{background:#2a2a2a;color:#bbb}.bl{background:#1f6feb;color:#fff}.og{background:#d68910;color:#fff}.re{background:#b91c1c;color:#fff}
.frow{display:flex;gap:8px}
.frow input{flex:1;padding:12px;border-radius:10px;border:1px solid #222;background:#0a0a0a;color:#fff;font-size:14px;outline:none;-webkit-appearance:none}
.frow button{padding:12px 18px;border-radius:10px;border:none;background:#1f6feb;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.hblock{background:#090e18;border-radius:10px;padding:11px;margin-bottom:12px;border:1px solid #141e30;display:none}
.hlbl{font-size:10px;color:#334;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.hlist{max-height:80px;overflow-y:auto;margin-bottom:9px}
.hitem{font-size:11px;color:#556;padding:3px 7px;background:#0c0c14;border-radius:5px;margin-bottom:3px}
.hitem strong{color:#3fb950}
.backbtn{display:block;width:100%;padding:10px;border-radius:9px;border:1px solid #2a1515;background:#160c0c;color:#e05555;font-weight:700;cursor:pointer;font-size:13px;text-align:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.jbox{background:#0c1015;border:1px solid #161616;border-radius:13px;padding:14px;margin-bottom:12px;display:none}
.jbox.on{display:block}
.jtopic{font-size:14px;font-weight:600;color:#ddd;margin-bottom:12px;word-break:break-word}
.jpart{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.jlbl{font-size:11px;color:#444;width:50px;flex-shrink:0}
.jbar{flex:1;background:#161616;border-radius:5px;height:8px;overflow:hidden}
.jfill{height:100%;border-radius:5px;transition:width .6s ease}
.jstep{font-size:10px;width:120px;text-align:right;flex-shrink:0}
.citem{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#0d1a0d;border:1px solid #1a2e1a;border-radius:9px;margin-bottom:7px}
.ctopic{font-size:12px;color:#7ee787;font-weight:500}
.ctime{font-size:10px;color:#3a5e3a}
.notif{background:#0a1e0a;border:1px solid #2a6e2a;border-radius:11px;padding:11px 14px;margin-bottom:13px;font-size:13px;color:#7ee787;display:none;align-items:center;gap:9px}
.notif.on{display:flex}
.upzone{border:2px dashed #252525;border-radius:13px;padding:24px 16px;text-align:center;cursor:pointer;margin-bottom:14px;background:#0d0d0d;-webkit-tap-highlight-color:transparent;user-select:none;display:block;width:100%;border-top:2px dashed #252525;border-left:2px dashed #252525;border-right:2px dashed #252525}
.upzone:active{border-color:#5c6bc0;background:#0d0d1a}
.upzone .zi{font-size:38px;display:block;margin-bottom:9px}
.upzone .zt{font-size:15px;color:#777;font-weight:500}
.upzone .zs{font-size:11px;color:#3a3a3a;margin-top:5px}
.lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
.litem{border-radius:11px;overflow:hidden;border:2px solid #1a1a1a;cursor:pointer;position:relative;background:#111;-webkit-tap-highlight-color:transparent;user-select:none;touch-action:manipulation}
.litem:active{opacity:.8}
.litem.sel{border-color:#7b8ef7}
.litem img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block}
.lname{font-size:9px;color:#444;padding:4px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lck{position:absolute;top:5px;right:5px;background:#7b8ef7;border-radius:50%;width:18px;height:18px;font-size:11px;display:none;align-items:center;justify-content:center}
.litem.sel .lck{display:flex}
.sitem{background:#111;border:1px solid #1c1c1c;border-radius:11px;padding:13px;margin-bottom:8px}
.stitle{font-size:14px;font-weight:600;margin-bottom:5px}
.smeta{font-size:11px;color:#555;line-height:1.4}
.sp{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:6px;vertical-align:middle}
.sp.viral{background:#f7971e;color:#000}.sp.good{background:#3fb950;color:#000}.sp.unrated{background:#1e1e1e;color:#555}
.vcard{background:#111;border:1px solid #1c1c1c;border-radius:12px;margin-bottom:9px;overflow:hidden}
.vrow{display:flex;align-items:center;padding:12px;gap:10px}
.vname{flex:1;font-size:12px;color:#bbb;word-break:break-all;line-height:1.4}
.vbtns{display:flex;gap:7px;flex-shrink:0}
.vbtns button,.vbtns a{padding:8px 13px;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.vbtns button:active,.vbtns a:active{opacity:.7}
.vplay{background:#1f6feb;color:#fff}.vsave{background:#2ea043;color:#fff}
.vplayer{display:none;background:#000;border-top:1px solid #1a1a1a}
.vplayer video{width:100%;max-height:56vh;display:block}
.vctrl{display:flex;gap:7px;padding:9px;background:#0c1015}
.vctrl button,.vctrl a{flex:1;padding:11px;border-radius:9px;border:none;font-size:13px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;display:block;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.vctrl button:active,.vctrl a:active{opacity:.7}
.vpa{background:#d68910;color:#fff}.vcl{background:#222;color:#aaa}.vdl{background:#2ea043;color:#fff}
.preview-img{width:100%;border-radius:10px;margin-bottom:10px;max-height:220px;object-fit:cover;display:block}
</style>
</head>
<body>
<div class="hdr">
  <h1>&#127925; Podcast Workflow</h1>
  <div class="sub"><span class="dot" id="dot"></span><span id="stxt">Ready</span></div>
</div>
<div class="tabs">
  <button class="tab on" id="t0" onclick="goTab(0)">Generate</button>
  <button class="tab" id="t1" onclick="goTab(1)">Library</button>
  <button class="tab" id="t2" onclick="goTab(2)">Videos</button>
</div>

<!-- GENERATE -->
<section class="on" id="s0">
  <div class="notif" id="notif">&#127909; <span id="ntxt">Video ready!</span></div>
  <div class="jbox" id="jbox">
    <div class="jtopic" id="jtopic">&mdash;</div>
    <div id="jparts"></div>
  </div>
  <div id="cdone" style="display:none">
    <div class="label">Completed</div>
    <div id="clist"></div>
  </div>
  <div class="label">New Video</div>
  <input class="inp" type="text" id="tin" placeholder="Topic (empty = auto-pick)">
  <button class="btn primary" onclick="startWF()">&#9881; Generate</button>
  <button class="btn ghost" style="font-size:13px;padding:11px" onclick="stopWF()">&#9632; Stop</button>
  <div class="label">Output</div>
  <div class="term" id="term">Ready...</div>
  <div class="pblock" id="pblock">
    <div class="hblock" id="hblock" style="display:none">
      <div class="hlbl">Answers given</div>
      <div class="hlist" id="hlist"></div>
      <button class="backbtn" onclick="goBack()">&#8592; Undo last answer &amp; go back</button>
    </div>
    <div class="pq" id="pq">&mdash;</div>
    <div class="pbts" id="pbtns"></div>
    <div class="frow">
      <input type="text" id="fi" placeholder="Type custom answer..." onkeydown="if(event.key==='Enter'){sendFree();return false;}">
      <button onclick="sendFree()">Send</button>
    </div>
  </div>
</section>

<!-- LIBRARY -->
<section id="s1">
  <div class="label" id="hlooks">Looks</div>
  <input type="file" id="upi" accept="image/*" multiple style="display:none" onchange="uploadLooks(this.files)">
  <button class="upzone" onclick="document.getElementById('upi').click()">
    <span class="zi">&#128247;</span>
    <div class="zt">Add photos to Looks library</div>
    <div class="zs">Tap to choose from Camera Roll or Files</div>
  </button>
  <div class="lgrid" id="lgrid"></div>
  <div class="label" id="hscripts">Scripts</div>
  <div id="slist"></div>
</section>

<!-- VIDEOS -->
<section id="s2">
  <div class="label">Generated Videos</div>
  <div id="vlist"></div>
</section>

<script>
if('Notification'in window&&Notification.permission==='default')Notification.requestPermission();

function pushNotif(n){
  if(Notification.permission==='granted')new Notification('Video ready!',{body:n});
  document.getElementById('ntxt').textContent=n+' is ready!';
  var b=document.getElementById('notif');
  b.classList.add('on');
  setTimeout(function(){b.classList.remove('on');},10000);
}

function goTab(i){
  for(var j=0;j<3;j++){
    document.getElementById('t'+j).classList.toggle('on',j===i);
    document.getElementById('s'+j).classList.toggle('on',j===i);
  }
  if(i===1)loadLib();
  if(i===2)loadVid();
}

var term=document.getElementById('term');
function log(m){term.textContent+=m+'\n';term.scrollTop=term.scrollHeight;}
function setStatus(s){
  document.getElementById('dot').className='dot'+(s==='run'?' run':s==='err'?' err':'');
  document.getElementById('stxt').textContent=s==='run'?'Generating...':s==='err'?'Error':'Ready';
}

var es;try{es=new EventSource('/events');}catch(e){console.log('SSE error',e);}if(es){
es.onmessage=function(e){
  var d=JSON.parse(e.data);
  if(d.type==='log')log(d.msg);
  if(d.type==='status')setStatus(d.s);
  if(d.type==='prompt')showPrompt(d.msg);
  if(d.type==='hist')renderHist(d.h);
  if(d.type==='done'){closePrompt();setStatus('idle');}
  if(d.type==='job')renderJob(d.j,d.done);
  if(d.type==='video_ready'){pushNotif(d.name);loadVid();}
  if(d.type==='look_preview')showLookPreview(d.url);}
};

function showPrompt(msg){
  document.getElementById('pq').textContent=msg;
  document.getElementById('pblock').classList.add('on');
  makeBtns(msg.toLowerCase());
  setTimeout(function(){var el=document.getElementById('fi');if(el)el.focus();},200);
}
function closePrompt(){document.getElementById('pblock').classList.remove('on');}

function showLookPreview(url){
  var src=url.startsWith('/')?'/serve-look?f='+encodeURIComponent(url):url;
  var html='<img class="preview-img" src="'+src+'"><br>Use this look?';
  document.getElementById('pq').innerHTML=html;
  document.getElementById('pbtns').innerHTML=
    mkB('Use this look','g','si("YES")')+
    mkB('Pick another','og','si("RANDOM")');
  document.getElementById('pblock').classList.add('on');
}

function makeBtns(m){
  var btns=[];
  if(m.indexOf('change photo')>=0){
    btns=[mkB('Keep photo','gr','si("NO")'),mkB('Random','bl','si("RANDOM")'),mkB('Pick look','og','openPicker()')];
  }else if(m.indexOf('approve')>=0||m.indexOf('yes / new')>=0){
    btns=[mkB('Approve','g','si("YES")'),mkB('Regenerate','bl','si("NEW")'),mkB('Cancel','re','si("NO")')];
  }else if(m.indexOf('start')>=0||m.indexOf('yes / topic')>=0){
    btns=[mkB('Start','g','si("YES")'),mkB('New topic','bl','si("TOPIC")'),mkB('Cancel','re','si("NO")')];
  }else if(m.indexOf('make 2 more')>=0||m.indexOf('same outfit')>=0){
    btns=[mkB('Yes 3 parts','g','si("YES")'),mkB('Stop here','gr','si("NO")')];
  }else if(m.indexOf('continue to part 3')>=0){
    btns=[mkB('Yes Part 3','g','si("YES")'),mkB('Stop at 2','gr','si("NO")')];
  }else if(m.indexOf('change?')>=0||m.indexOf('duration')>=0){
    btns=[mkB('Keep 23s','gr','si("NO")'),mkB('Change','bl','si("YES")')];
  }else{
    btns=[mkB('YES','g','si("YES")'),mkB('NO','gr','si("NO")')];
  }
  document.getElementById('pbtns').innerHTML=btns.join('');
}
function mkB(l,c,f){return '<button class="b '+c+'" onclick="'+f+'">'+l+'</button>';}
function si(v){closePrompt();doPost('/input',{input:v});}
function sendFree(){var el=document.getElementById('fi');if(el&&el.value.trim()){si(el.value.trim());el.value='';}}

function openPicker(){
  doGet('/looks-list',function(files){
    var h='<input type="file" id="ppf" accept="image/*" style="display:none" onchange="uploadAndPick(this)">'
      +'<button class="b og" style="width:100%;margin-bottom:10px;padding:13px;border-radius:10px;border:none;font-weight:700;cursor:pointer;font-size:14px;-webkit-tap-highlight-color:transparent" onclick="document.getElementById(\'ppf\').click()">&#128247; Upload new photo</button>';
    if(files.length){
      h+='<div class="pkgrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;max-height:310px;overflow-y:auto;margin-top:9px">';
      for(var i=0;i<files.length;i++){
        h+='<div style="border-radius:9px;overflow:hidden;border:2px solid #222;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation" onclick="pickLook(\''+files[i]+'\')" ontouchend="pickLook(\''+files[i]+'\');event.preventDefault()"><img src="/li/'+encodeURIComponent(files[i])+'" loading="lazy" style="width:100%;aspect-ratio:9/16;object-fit:cover;display:block"></div>';
      }
      h+='</div>';
    }else{h+='<p style="color:#555;font-size:12px;text-align:center;padding:12px">No looks yet</p>';}
    document.getElementById('pq').innerHTML='Choose a look:';
    document.getElementById('pbtns').innerHTML=h;
  });
}
function pickLook(f){
  doPost('/set-look',{file:f},function(d){
    if(d.ok){closePrompt();doPost('/input',{input:'YES'});log('Look: '+f);}
  });
}
function uploadAndPick(inp){
  var f=inp.files[0];if(!f)return;
  var fd=new FormData();fd.append('photo',f);
  fetch('/upload-look',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(d){if(d.ok)pickLook(d.file);});
}

function renderHist(h){
  var hb=document.getElementById('hblock'),hl=document.getElementById('hlist');
  if(!h||!h.length){hb.style.display='none';return;}
  hb.style.display='block';
  hl.innerHTML=h.map(function(x,i){return '<div class="hitem">Q'+(i+1)+': '+x.q.substring(0,40)+'... <strong>&#8594; '+x.a+'</strong></div>';}).join('');
  hl.scrollTop=hl.scrollHeight;
}
function goBack(){
  fetch('/go-back',{method:'POST'}).then(function(){
    document.getElementById('hblock').style.display='none';
    log('Going back...');
  });
}

function renderJob(j,done){
  var box=document.getElementById('jbox');
  if(!j||(!j.active&&!Object.keys(j.parts||{}).length)){box.classList.remove('on');}
  else{
    box.classList.add('on');
    document.getElementById('jtopic').textContent=j.topic||'Auto-picking topic...';
    var ps=j.parts||{},html='';
    Object.keys(ps).forEach(function(p){
      var st=ps[p],pc=st.pct||0,c=pc>=100?'#3fb950':pc>=60?'#7b8ef7':'#f7971e';
      html+='<div class="jpart"><span class="jlbl">Part '+p+'</span><div class="jbar"><div class="jfill" style="width:'+pc+'%;background:'+c+'"></div></div><span class="jstep" style="color:'+c+'">'+st.step+'</span></div>';
    });
    document.getElementById('jparts').innerHTML=html;
  }
  if(done&&done.length){
    document.getElementById('cdone').style.display='block';
    document.getElementById('clist').innerHTML=done.map(function(c){
      return '<div class="citem"><span class="ctopic">&#10003; '+c.topic+'</span><span class="ctime">'+c.time+'</span></div>';
    }).join('');
  }
}

doGet('/job-state',function(s){
  if(s&&s.active){setStatus('run');if(s.log&&s.log.length){term.textContent=s.log.join('\n')+'\n';term.scrollTop=term.scrollHeight;}}
  if(s)renderJob(s,s.completed||[]);
});

function startWF(){
  var t=document.getElementById('tin').value.trim();
  term.textContent='';closePrompt();
  doPost('/start',{topic:t},function(d){log(d.msg||'');});
}
function stopWF(){doPost('/stop',{},function(d){log(d.msg||'');});}

function loadLib(){
  doGet('/looks-list',function(files){
    document.getElementById('hlooks').textContent='Looks ('+files.length+')';
    var g=document.getElementById('lgrid');
    if(!files.length){g.innerHTML='<p style="color:#555;font-size:12px;grid-column:1/-1;padding:8px 0">No looks yet</p>';return;}
    g.innerHTML=files.map(function(f){
      return '<div class="litem" onclick="setLook(this,\''+f+'\')" ontouchend="setLook(this,\''+f+'\');event.preventDefault()"><div class="lck">&#10003;</div><img src="/li/'+encodeURIComponent(f)+'" loading="lazy"><div class="lname">'+f+'</div></div>';
    }).join('');
  });
  doGet('/library',function(lb){
    var sc=(lb.scripts||[]).slice().reverse();
    document.getElementById('hscripts').textContent='Scripts ('+sc.length+')';
    var el=document.getElementById('slist');
    if(!sc.length){el.innerHTML='<p style="color:#555;font-size:12px">No scripts yet</p>';return;}
    el.innerHTML=sc.map(function(s){
      var p=s.performance||'unrated';
      return '<div class="sitem"><div class="stitle">'+s.title+'<span class="sp '+p+'">'+p+'</span></div><div class="smeta">'+s.date+' &mdash; '+(s.script||'').substring(0,100)+'...</div></div>';
    }).join('');
  });
}
function uploadLooks(files){
  for(var i=0;i<files.length;i++){
    (function(f){
      var fd=new FormData();fd.append('photo',f);
      fetch('/upload-look',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(d){if(d.ok){log('Added: '+d.file);loadLib();}});
    })(files[i]);
  }
}
function setLook(el,f){
  doPost('/set-look',{file:f},function(d){
    if(d.ok){document.querySelectorAll('.litem').forEach(function(i){i.classList.remove('sel');});el.classList.add('sel');log('Avatar: '+f);}
  });
}

function loadVid(){
  doGet('/videos',function(vs){
    var el=document.getElementById('vlist');
    if(!vs.length){el.innerHTML='<p style="color:#555;font-size:12px">No videos yet</p>';return;}
    el.innerHTML=vs.map(function(v,i){
      return '<div class="vcard">'
        +'<div class="vrow"><span class="vname">'+v.name+'</span>'
        +'<div class="vbtns">'
        +'<button class="vplay" id="vpbtn'+i+'" onclick="tPlay('+i+')">&#9654; Play</button>'
        +'<a class="vsave" href="/dl/'+encodeURIComponent(v.name)+'">&#128190;</a>'
        +'</div></div>'
        +'<div class="vplayer" id="vpl'+i+'">'
        +'<video id="vv'+i+'" playsinline preload="none" src="/vid/'+encodeURIComponent(v.name)+'"></video>'
        +'<div class="vctrl">'
        +'<button class="vpa" id="vpause'+i+'" onclick="tPause('+i+')">&#9208; Pause</button>'
        +'<button class="vcl" onclick="closeVid('+i+')">&#10005; Close</button>'
        +'<a class="vdl" href="/dl/'+encodeURIComponent(v.name)+'">&#128190; Save</a>'
        +'</div></div></div>';
    }).join('');
  });
}
function tPlay(i){
  var pl=document.getElementById('vpl'+i),vv=document.getElementById('vv'+i),btn=document.getElementById('vpbtn'+i);
  if(pl.style.display==='block'){closeVid(i);btn.textContent='&#9654; Play';return;}
  document.querySelectorAll('.vplayer').forEach(function(p){p.style.display='none';});
  document.querySelectorAll('video').forEach(function(v){v.pause();});
  document.querySelectorAll('[id^=vpbtn]').forEach(function(b){b.innerHTML='&#9654; Play';});
  pl.style.display='block';vv.play();
  document.getElementById('vpause'+i).innerHTML='&#9208; Pause';
  btn.innerHTML='&#9726; Close';
}
function tPause(i){var v=document.getElementById('vv'+i),b=document.getElementById('vpause'+i);if(v.paused){v.play();b.innerHTML='&#9208; Pause';}else{v.pause();b.innerHTML='&#9654; Play';}}
function closeVid(i){var v=document.getElementById('vv'+i);v.pause();document.getElementById('vpl'+i).style.display='none';document.getElementById('vpbtn'+i).innerHTML='&#9654; Play';}

function doGet(url,cb){fetch(url).then(function(r){return r.json();}).then(cb).catch(function(){});}
function doPost(url,body,cb){fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(d){if(cb)cb(d);}).catch(function(){});}

</script>
</body>
</html>`;

const app=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-cache,no-store');
  res.setHeader('Pragma','no-cache');

  if(u.pathname==='/events'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    clients.push(res);req.on('close',()=>{clients=clients.filter(c=>c!==res);});return;
  }
  if(u.pathname==='/start'&&req.method==='POST'){
    let b='';req.on('data',d=>b+=d);req.on('end',()=>{
      const {topic}=JSON.parse(b||'{}');
      const ok=startProc(topic);
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({msg:ok?'Started':'Already running'}));
    });return;
  }
  if(u.pathname==='/stop'&&req.method==='POST'){
    if(proc){proc.kill();proc=null;job.active=false;}
    sse({type:'status',s:'idle'});sse({type:'done'});
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({msg:'Stopped'}));return;
  }
  if(u.pathname==='/input'&&req.method==='POST'){
    let b='';req.on('data',d=>b+=d);req.on('end',()=>{
      const {input}=JSON.parse(b||'{}');
      if(proc){
        proc.stdin.write(input+'\n');
        if(curQ&&!replaying){hist.push({q:curQ,a:input});curQ='';sse({type:'hist',h:hist});}
      }
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true}));
    });return;
  }
  if(u.pathname==='/go-back'&&req.method==='POST'){
    if(hist.length>0){
      hist.pop();const h=[...hist];
      if(proc){proc.kill();proc=null;}
      setTimeout(()=>{
        job={active:true,topic:job.topic,parts:{},cur:1,log:['Going back...']};
        hist=[...h];replayQ=h.map(x=>x.a);replaying=replayQ.length>0;curQ='';
        const args=[path.join(BASE,'workflow.js')];if(job.topic)args.push(job.topic);
        proc=spawn('node',args,{cwd:BASE,env:{...process.env}});
        sse({type:'status',s:'run'});
        proc.stdout.on('data',d=>d.toString().split('\n').filter(l=>l.trim()).forEach(handleLine));
        proc.stderr.on('data',d=>{const m=d.toString().trim();if(m)sse({type:'log',msg:m});});
        proc.on('close',()=>{proc=null;job.active=false;sse({type:'done'});sse({type:'status',s:'idle'});sse({type:'job',j:job,done:completed});});
      },600);
    }
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true}));return;
  }
  if(u.pathname==='/job-state'){
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({...job,completed}));return;
  }
  if(u.pathname==='/looks-list'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(getLooks()));return;}
  if(u.pathname==='/library'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(getLib()));return;}
  if(u.pathname==='/videos'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(getVideos()));return;}
  if(u.pathname.startsWith('/li/')){
    const fn=decodeURIComponent(u.pathname.replace('/li/',''));
    try{const r=fs.realpathSync(LOOKS);const fp=path.join(r,fn);if(!fs.existsSync(fp)){res.writeHead(404);res.end();return;}const ext=fn.split('.').pop().toLowerCase();const mime={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'}[ext]||'image/jpeg';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'max-age=3600'});fs.createReadStream(fp).pipe(res);}catch{res.writeHead(404);res.end();}return;
  }
  if(u.pathname==='/serve-look'){
    const fp=decodeURIComponent(u.searchParams.get('f')||'');
    try{const ext=fp.split('.').pop().toLowerCase();const mime={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'}[ext]||'image/jpeg';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});fs.createReadStream(fp).pipe(res);}catch{res.writeHead(404);res.end();}return;
  }
  if(u.pathname==='/set-look'&&req.method==='POST'){
    let b='';req.on('data',d=>b+=d);req.on('end',()=>{
      const {file}=JSON.parse(b||'{}');
      try{const r=fs.realpathSync(LOOKS);const fp=path.join(r,file);setAvatar(fp);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,path:fp}));}
      catch(e){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:e.message}));}
    });return;
  }
  if(u.pathname==='/upload-look'&&req.method==='POST'){
    if(!fs.existsSync(LOOKS))fs.mkdirSync(LOOKS,{recursive:true});
    let ch=[];req.on('data',d=>ch.push(d));req.on('end',()=>{
      try{
        const buf=Buffer.concat(ch),ct=req.headers['content-type']||'',bm=ct.match(/boundary=(.+)/);
        if(!bm){res.end(JSON.stringify({ok:false}));return;}
        const nm=buf.toString('binary').match(/filename="([^"]+)"/);
        const fn=(nm?nm[1]:'look_'+Date.now()+'.jpg').replace(/[^a-zA-Z0-9._-]/g,'_');
        const sp='\r\n\r\n',st=buf.indexOf(sp)+sp.length,en=buf.lastIndexOf('--'+bm[1])-2;
        const real=fs.lstatSync(LOOKS).isSymbolicLink()?fs.realpathSync(LOOKS):LOOKS;
        fs.writeFileSync(path.join(real,fn),buf.slice(st,en));
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,file:fn}));
      }catch(e){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:e.message}));}
    });return;
  }
  if(u.pathname.startsWith('/vid/')||u.pathname.startsWith('/dl/')){
    const fn=decodeURIComponent(u.pathname.split('/').pop());
    try{const real=fs.lstatSync(OUTPUTS).isSymbolicLink()?fs.realpathSync(OUTPUTS):OUTPUTS;const fp=path.join(real,fn);if(!fs.existsSync(fp)){res.writeHead(404);res.end();return;}const st=fs.statSync(fp);const dl=u.pathname.startsWith('/dl/');res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':st.size,'Content-Disposition':(dl?'attachment':'inline')+'; filename="'+fn+'"','Accept-Ranges':'bytes'});fs.createReadStream(fp).pipe(res);}catch{res.writeHead(404);res.end();}return;
  }
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-cache,no-store','Pragma':'no-cache'});
  res.end(HTML);
});
app.on('error',e=>{if(e.code==='EADDRINUSE'){console.error('Port busy: lsof -ti :'+PORT+' | xargs kill -9');process.exit(1);}});
app.listen(PORT,'0.0.0.0',()=>{const ifaces=require('os').networkInterfaces();let ip='localhost';Object.values(ifaces).flat().forEach(i=>{if(i.family==='IPv4'&&!i.internal)ip=i.address;});console.log('\nWeb interface ready!\nMac:    http://localhost:'+PORT+'\nPhone: http://'+ip+':'+PORT+'\n');});

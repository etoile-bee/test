require('dotenv').config();
const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { spawn } = require('child_process');

const PORT    = 3333;
const BASE    = path.join(os.homedir(), 'podcast-workflow');
const OUTPUTS = path.join(BASE, 'outputs');
const LOOKS   = path.join(BASE, 'looks');
const LIBRARY = path.join(BASE, 'library.json');
const ENV_PATH= path.join(BASE, '.env');

let activeProcess = null;
let sseClients    = [];
let jobState      = { active:false, topic:'', parts:{}, currentPart:1, log:[] };

// ── HELPERS ──────────────────────────────────────────────────────────────────
function sendSSE(d) {
  const s = 'data:' + JSON.stringify(d) + '\n\n';
  sseClients = sseClients.filter(r => { try { r.write(s); return true; } catch { return false; } });
}
function readDir(dir, exts) {
  try {
    const real = fs.realpathSync(dir);
    return fs.readdirSync(real).filter(f => exts.some(e => f.toLowerCase().endsWith(e))).sort();
  } catch { return []; }
}
function getVideos() { return readDir(OUTPUTS, ['.mp4']).filter(f => !f.includes('_raw_')).reverse().map(f=>({name:f})); }
function getLooks()  { return readDir(LOOKS,   ['.jpg','.jpeg','.png','.webp']); }
function loadLib()   { try { return JSON.parse(fs.readFileSync(LIBRARY,'utf8')); } catch { return {scripts:[]}; } }
function setAvatar(p) {
  let env = fs.readFileSync(ENV_PATH,'utf8');
  env = env.replace(/HIGGS_AVATAR_URL=.*(\r?\n|$)/, 'HIGGS_AVATAR_URL=' + p + '\n');
  fs.writeFileSync(ENV_PATH, env);
}
function updateJob(msg) {
  const m = msg.match(/Part\s+(\d)/); const p = m ? parseInt(m[1]) : (jobState.currentPart||1);
  if (!jobState.parts[p]) jobState.parts[p] = {step:'Waiting',elapsed:0};
  if (/Topic:/i.test(msg))          { const t=msg.match(/Topic:\s*(.+)/i); if(t) jobState.topic=t[1].trim(); }
  if (/script|generating/i.test(msg))                  jobState.parts[p].step='📝 Script...';
  if (/OK \(\d+w\)/.test(msg))                          jobState.parts[p].step='✅ Script done';
  if (/Audio Part|ElevenLabs/i.test(msg))               { jobState.parts[p].step='🎙 Audio...'; jobState.currentPart=p; }
  if (/catbox.*wav|OK:.*catbox/i.test(msg))             jobState.parts[p].step='✅ Audio done';
  if (/Preparing avatar|avatar/i.test(msg))             jobState.parts[p].step='🖼 Image...';
  if (/Lipsync Part|kling/i.test(msg))                  { jobState.parts[p].step='🎬 Lipsync...'; jobState.currentPart=p; }
  if (/Job:\s*\w/i.test(msg))                           jobState.parts[p].step='🎬 Lipsync running...';
  if (/in_progress|processing/i.test(msg)) { const t=msg.match(/(\d+)s/); if(t) jobState.parts[p].step='🎬 Lipsync '+t[1]+'s...'; }
  if (/Rendering Part|Shotstack/i.test(msg))            { jobState.parts[p].step='✨ Rendering...'; }
  if (/done\s+\d+s/i.test(msg))                        jobState.parts[p].step='✨ Render done';
  if (/Saved:|✅ Part/i.test(msg))                      jobState.parts[p].step='✅ Done!';
  jobState.log.push(msg.trim());
  if (jobState.log.length > 60) jobState.log.shift();
}

// ── PROMPT HISTORY (for back/forward navigation) ─────────────────────────────
let promptHistory = []; // [{q, a}, ...]
let replayQueue   = []; // answers to auto-replay after a "Back"
let replayMode    = false;
let currentPromptQ = '';

function startReplay(history) {
  replayQueue = history.map(h => h.a);
  replayMode  = replayQueue.length > 0;
}
function nextReplay() {
  if (!replayMode || replayQueue.length === 0) { replayMode = false; return null; }
  const a = replayQueue.shift();
  if (replayQueue.length === 0) replayMode = false;
  return a;
}

// ── VIDEO READY WATCHER ───────────────────────────────────────────────────────
let knownVids = new Set(getVideos().map(v=>v.name));
setInterval(() => {
  const cur = new Set(getVideos().map(v=>v.name));
  cur.forEach(n => { if (!knownVids.has(n)) { sendSSE({type:'video_ready',name:n}); } });
  knownVids = cur;
}, 3000);

// ── HTML ──────────────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Podcast Workflow</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,sans-serif;background:#0a0a0a;color:#fff;padding-bottom:30px}
.hdr{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:14px 16px;display:flex;align-items:center;justify-content:space-between}
.hdr h1{font-size:17px;font-weight:700}.hdr p{font-size:11px;color:#888;display:flex;align-items:center;gap:5px}
.dot{width:8px;height:8px;border-radius:50%;background:#555}
.dot.run{background:#3fb950;animation:pulse 1s infinite}.dot.err{background:#f85149}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.tabs{display:flex;background:#111;border-bottom:1px solid #222;position:sticky;top:0;z-index:10}
.tab{flex:1;padding:11px 4px;text-align:center;font-size:11px;color:#666;cursor:pointer;border-bottom:2px solid transparent;transition:.2s}
.tab.on{color:#667eea;border-bottom-color:#667eea}
.pane{display:none;padding:14px}.pane.on{display:block}
h2{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px}
h2:first-child{margin-top:0}
/* cards */
.card{background:#161616;border:1px solid #222;border-radius:12px;padding:12px;margin-bottom:9px}
/* buttons */
.btn{display:block;width:100%;padding:13px;border-radius:12px;border:none;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px;transition:.15s}
.btn:active{opacity:.8}
.bp{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
.bs{background:#1e1e1e;color:#ccc;border:1px solid #333}
.bg{background:linear-gradient(135deg,#11998e,#38ef7d);color:#000}
.sm{padding:9px;font-size:13px}
/* input */
input[type=text]{width:100%;padding:11px;border-radius:10px;border:1px solid #333;background:#1e1e1e;color:#fff;font-size:15px;margin-bottom:9px}
/* terminal */
.term{background:#0d1117;border-radius:10px;padding:11px;font-family:monospace;font-size:11px;height:190px;overflow-y:auto;border:1px solid #1e1e1e;white-space:pre-wrap;color:#7ee787;line-height:1.5;word-break:break-all}
/* prompt */
.pbar{background:#1a1a2e;padding:12px;border-radius:10px;margin-top:8px;display:none;border:1px solid #2a2a4a}
.pbar.on{display:block}
.ptxt{font-size:12px;color:#aac4ff;font-weight:600;margin-bottom:8px}
.pbts{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px}
.pbts button{flex:1;min-width:60px;padding:10px 6px;border-radius:8px;border:none;font-weight:700;cursor:pointer;font-size:13px}
.pyes{background:#3fb950;color:#fff}.pno{background:#555;color:#fff}.pblue{background:#388bfd;color:#fff}.porg{background:#f7971e;color:#000}.pred{background:#f85149;color:#fff}
.free-row{display:flex;gap:6px}
.free-row input{flex:1;padding:9px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;font-size:14px}
.free-row button{padding:9px 14px;border-radius:8px;border:none;background:#388bfd;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap}
/* job progress */
.jprog{background:#0d1117;border-radius:10px;padding:12px;margin-bottom:10px;border:1px solid #222;display:none}
.jprog.on{display:block}
.jtopic{font-size:14px;font-weight:600;color:#eee;margin-bottom:10px}
.jpart{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.jlabel{font-size:11px;color:#888;width:48px;flex-shrink:0}
.jbar{flex:1;background:#1e1e1e;border-radius:4px;height:6px;overflow:hidden}
.jfill{height:100%;border-radius:4px;transition:width .4s}
.jstep{font-size:10px;width:130px;text-align:right;flex-shrink:0}
/* notification */
.notif{background:#1a3a1a;border:1px solid #3fb950;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;color:#7ee787;display:none;align-items:center;gap:8px}
.notif.on{display:flex}
/* video player */
.vitem{background:#161616;border:1px solid #222;border-radius:10px;margin-bottom:8px;overflow:hidden}
.vrow{display:flex;align-items:center;padding:10px 12px;gap:10px}
.vname{flex:1;font-size:12px;color:#ccc;word-break:break-all}
.vbtns{display:flex;gap:6px;flex-shrink:0}
.vbtns button,.vbtns a{padding:6px 11px;border-radius:7px;border:none;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
.vplay{background:#388bfd;color:#fff}.vsave{background:#3fb950;color:#fff}
.vplayer{display:none;background:#000;border-top:1px solid #222}
.vplayer video{width:100%;max-height:60vh;display:block}
.vcontrols{display:flex;gap:6px;padding:8px;background:#0d1117}
.vcontrols button{flex:1;padding:9px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer}
.vpause{background:#f7971e;color:#000}.vstop{background:#555;color:#fff}.vdl{background:#3fb950;color:#000}
/* looks */
.lgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px}
.litem{border-radius:9px;overflow:hidden;border:2px solid #222;cursor:pointer;position:relative;background:#1e1e1e}
.litem.sel{border-color:#667eea}
.litem img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block}
.lname{font-size:9px;color:#888;padding:3px 4px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lcheck{position:absolute;top:4px;right:4px;background:#667eea;border-radius:50%;width:16px;height:16px;font-size:10px;display:none;align-items:center;justify-content:center}
.litem.sel .lcheck{display:flex}
/* upload zone */
.upzone{border:2px dashed #444;border-radius:12px;padding:18px;text-align:center;cursor:pointer;margin-bottom:12px;color:#777;font-size:14px;background:#111;transition:.2s}
.upzone:active,.upzone:hover{border-color:#667eea;color:#667eea;background:#1a1a2e}
.upzone span{font-size:26px;display:block;margin-bottom:6px}
/* scripts */
.sitem{background:#161616;border:1px solid #222;border-radius:10px;padding:11px;margin-bottom:7px}
.stitle{font-size:13px;font-weight:600;margin-bottom:4px}
.smeta{font-size:11px;color:#888}
.perf{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10px;margin-left:6px}
.pviral{background:#f7971e;color:#000}.pgood{background:#3fb950;color:#000}.punrated{background:#333;color:#888}
/* inline looks picker */
.lpicker{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;max-height:280px;overflow-y:auto;margin-top:8px}
.lpitem{border-radius:8px;overflow:hidden;border:2px solid #333;cursor:pointer}
.lpitem img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block}
.lpitem:active{border-color:#667eea}
</style>
</head>
<body>

<div class="hdr">
  <h1>Podcast Workflow</h1>
  <p><div class="dot" id="dot"></div><span id="stxt">Ready</span></p>
</div>

<div class="tabs">
  <div class="tab on" onclick="goTab('gen')">Generate</div>
  <div class="tab" onclick="goTab('lib')">Library</div>
  <div class="tab" onclick="goTab('vid')">Videos</div>
</div>

<!-- ── GENERATE ─────────────────────────────────────────────── -->
<div class="pane on" id="pane-gen">

  <div class="notif" id="notif">🎉 <span id="notiftxt">Video ready!</span></div>

  <!-- in-progress block -->
  <div class="jprog" id="jprog">
    <div class="jtopic" id="jtopic"></div>
    <div id="jparts"></div>
  </div>

  <h2>New Video</h2>
  <input type="text" id="topicIn" placeholder="Topic (empty = auto-pick)">
  <button class="btn bp" onclick="startWF()">🚀 Launch</button>
  <button class="btn bs sm" onclick="stopWF()">■ Stop</button>

  <div class="term" id="term">Ready...</div>

  <div class="pbar" id="pbar">
    <!-- navigation bar -->
    <div id="pnav" style="display:none;margin-bottom:10px;background:#111;border-radius:8px;padding:8px 10px">
      <div style="font-size:11px;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">History</div>
      <div id="pnavItems" style="font-size:11px;color:#aaa;margin-bottom:8px;max-height:120px;overflow-y:auto"></div>
      <button class="pred" style="width:100%;padding:9px;border-radius:8px;border:none;font-weight:700;cursor:pointer;font-size:13px" onclick="goBack()">← Undo last answer & go back</button>
    </div>
    <div class="ptxt" id="ptxt"></div>
    <div class="pbts" id="pbts"></div>
    <div class="free-row">
      <input type="text" id="freein" placeholder="Type custom answer..." onkeydown="if(event.key==='Enter')sendFree()">
      <button onclick="sendFree()">Send</button>
    </div>
  </div>
</div>

<!-- ── LIBRARY ───────────────────────────────────────────────── -->
<div class="pane" id="pane-lib">

  <h2 id="hLooks">Looks</h2>

  <input type="file" id="upInput" accept="image/*" multiple style="display:none" onchange="uploadLooks(this.files)">
  <div class="upzone" onclick="document.getElementById('upInput').click()">
    <span>📷</span>
    Tap to add photos from Camera Roll or Files
  </div>

  <div id="looksGrid" class="lgrid"></div>

  <h2 id="hScripts">Scripts</h2>
  <div id="scriptsList"></div>
</div>

<!-- ── VIDEOS ────────────────────────────────────────────────── -->
<div class="pane" id="pane-vid">
  <h2>Videos</h2>
  <div id="videoList"></div>
</div>

<script>
// ── NOTIFICATIONS ────────────────────────────────────────────────────────────
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

function pushNotif(name) {
  if (Notification.permission === 'granted') new Notification('Video ready! 🎉', {body: name});
  const bar = document.getElementById('notif');
  document.getElementById('notiftxt').textContent = '🎉 ' + name + ' is ready!';
  bar.classList.add('on');
  setTimeout(() => bar.classList.remove('on'), 10000);
}

// ── TABS ─────────────────────────────────────────────────────────────────────
function goTab(id) {
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('on',['gen','lib','vid'][i]===id));
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  document.getElementById('pane-'+id).classList.add('on');
  if (id==='lib') loadLib();
  if (id==='vid') loadVids();
}

// ── TERMINAL ─────────────────────────────────────────────────────────────────
const term = document.getElementById('term');
function log(m) { term.textContent += m + '\n'; term.scrollTop = term.scrollHeight; }
function setStatus(s) {
  document.getElementById('dot').className = 'dot' + (s==='run'?' run':s==='err'?' err':'');
  document.getElementById('stxt').textContent = s==='run'?'Generating...':s==='err'?'Error':'Ready';
}

// ── SSE ──────────────────────────────────────────────────────────────────────
const es = new EventSource('/events');
es.onmessage = e => {
  const d = JSON.parse(e.data);
  if (d.type==='log')         log(d.msg);
  if (d.type==='status')      setStatus(d.s);
  if (d.type==='prompt')      showPrompt(d.msg);
  if (d.type==='done')        { closePbar(); setStatus('idle'); renderJob(null); }
  if (d.type==='job_state')   renderJob(d.state);
  if (d.type==='video_ready') { pushNotif(d.name); loadVids(); }
};

// ── PROMPT ───────────────────────────────────────────────────────────────────
const pbar = document.getElementById('pbar');
const ptxt = document.getElementById('ptxt');
const pbts = document.getElementById('pbts');

function showPrompt(msg) { ptxt.textContent = msg; pbar.classList.add('on'); makeButtons(msg.toLowerCase()); }
function closePbar()     { pbar.classList.remove('on'); }

function makeButtons(m) {
  let h = '';
  if (m.includes('change photo')) {
    h = btn('Keep','pno','si("NO")')
      + btn('Random','pblue','sendRandom()')
      + btn('Pick look','porg','openPicker()');
  } else if (m.includes('approve') || m.includes('yes / new')) {
    h = btn('Approve','pyes','si("YES")')
      + btn('Regenerate','pblue','si("NEW")')
      + btn('Cancel','pred','si("NO")');
  } else if (m.includes('start') || m.includes('yes / topic')) {
    h = btn('Start','pyes','si("YES")')
      + btn('New topic','pblue','si("TOPIC")')
      + btn('Cancel','pred','si("NO")');
  } else if (m.includes('make 2 more') || m.includes('same outfit')) {
    h = btn('Yes, 3 parts','pyes','si("YES")')
      + btn('Stop here','pno','si("NO")');
  } else if (m.includes('continue to part 3')) {
    h = btn('Yes, Part 3','pyes','si("YES")')
      + btn('Stop at 2','pno','si("NO")');
  } else if (m.includes('duration') || m.includes('change?')) {
    h = btn('Keep 23s','pno','si("NO")')
      + btn('Change','pblue','si("YES")');
  } else {
    h = btn('YES','pyes','si("YES")') + btn('NO','pno','si("NO")');
  }
  pbts.innerHTML = h;
  setTimeout(()=>{ const el=document.getElementById('freein'); if(el) el.focus(); },150);
}

function btn(lbl,cls,fn) { return '<button class="'+cls+'" onclick="'+fn+'">'+lbl+'</button>'; }

function si(v)       { closePbar(); send('/input',{input:v}); }
function sendFree()  { const el=document.getElementById('freein'); if(el&&el.value.trim()){si(el.value.trim());el.value='';} }
function sendRandom(){ closePbar(); send('/input',{input:'YES'}); setTimeout(()=>send('/input',{input:'RANDOM'}),400); }

// ── LOOK PICKER (in prompt) ───────────────────────────────────────────────────
function openPicker() {
  fetch('/looks-list').then(r=>r.json()).then(files=>{
    let h = '<input type="file" id="pp" accept="image/*" style="display:none" onchange="uploadAndPick(this)">'
          + '<button class="porg" style="width:100%;margin-bottom:8px;padding:10px" onclick="document.getElementById(\'pp\').click()">📷 Upload new photo</button>';
    if (files.length) {
      h += '<div class="lpicker">' + files.map(f =>
        '<div class="lpitem" onclick="pickLook(\''+f+'\')">'
        +'<img src="/look-img/'+encodeURIComponent(f)+'" loading="lazy">'
        +'</div>'
      ).join('') + '</div>';
    }
    ptxt.textContent = 'Choose a look:';
    pbts.innerHTML = h;
  });
}

function pickLook(f) {
  fetch('/set-look',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:f})})
    .then(r=>r.json()).then(d=>{ if(d.ok){ closePbar(); send('/input',{input:'YES'}); setTimeout(()=>send('/input',{input:d.path}),400); log('Look: '+f); }});
}

function uploadAndPick(input) {
  const file=input.files[0]; if(!file) return;
  const fd=new FormData(); fd.append('photo',file);
  fetch('/upload-look',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{ if(d.ok) pickLook(d.file); });
}

// ── WORKFLOW ─────────────────────────────────────────────────────────────────
function startWF() {
  const topic=document.getElementById('topicIn').value.trim();
  term.textContent='';
  closePbar();
  send('/start',{topic}, d=>log(d.msg||''));
}
function stopWF() { send('/stop',{}, d=>log(d.msg||'')); }
function send(url,body,cb) {
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(r=>r.json()).then(d=>{ if(cb) cb(d); }).catch(()=>{});
}

// ── HISTORY NAVIGATION ───────────────────────────────────────────────────────
function renderHistory(history) {
  const nav = document.getElementById('pnav');
  const items = document.getElementById('pnavItems');
  if (!history || history.length === 0) { nav.style.display='none'; return; }
  nav.style.display = 'block';
  items.innerHTML = history.map((h,i)=>
    '<div style="margin-bottom:4px;padding:4px 6px;background:#1a1a2e;border-radius:5px">'
    +'<span style="color:#667eea">Q'+( i+1)+':</span> '
    +h.q.substring(0,50)+'... '
    +'<span style="color:#3fb950;font-weight:600">→ '+h.a+'</span>'
    +'</div>'
  ).join('');
  items.scrollTop = items.scrollHeight;
}
function goBack() {
  fetch('/go-back',{method:'POST'}).then(()=>{
    document.getElementById('pnav').style.display='none';
    log('↩ Going back...');
  });
}

// ── JOB PROGRESS ─────────────────────────────────────────────────────────────
function renderJob(state) {
  const box = document.getElementById('jprog');
  if (!state || (!state.active && !Object.keys(state.parts||{}).length)) { box.classList.remove('on'); return; }
  box.classList.add('on');
  document.getElementById('jtopic').textContent = state.topic||'';
  const parts = state.parts||{};
  document.getElementById('jparts').innerHTML = Object.keys(parts).map(p=>{
    const s=parts[p]; const done=s.step.includes('Done')||s.step.includes('✅');
    const pct=s.step.includes('Script')&&!s.step.includes('done')?15:s.step.includes('Script done')?25:s.step.includes('Audio')&&!s.step.includes('done')?35:s.step.includes('Audio done')?45:s.step.includes('Image')?50:s.step.includes('Lipsync')&&!s.step.includes('Done')?70:s.step.includes('Render')&&!s.step.includes('done')?85:done?100:10;
    const col=done?'#3fb950':pct>60?'#667eea':'#f7971e';
    return '<div class="jpart"><span class="jlabel">Part '+p+'</span>'
      +'<div class="jbar"><div class="jfill" style="width:'+pct+'%;background:'+col+'"></div></div>'
      +'<span class="jstep" style="color:'+col+'">'+s.step+'</span></div>';
  }).join('');
}

// Load job state on open (survive tab close)
fetch('/job-state').then(r=>r.json()).then(state=>{
  if (state.active) {
    setStatus('run');
    if (state.log&&state.log.length) { term.textContent=state.log.join('\n')+'\n'; term.scrollTop=term.scrollHeight; }
  }
  renderJob(state);
}).catch(()=>{});

// ── LIBRARY ───────────────────────────────────────────────────────────────────
function loadLib() {
  // Looks
  fetch('/looks-list').then(r=>r.json()).then(files=>{
    document.getElementById('hLooks').textContent='Looks ('+files.length+')';
    const grid=document.getElementById('looksGrid');
    if (!files.length){ grid.innerHTML='<p style="color:#888;font-size:12px;grid-column:1/-1">No looks yet</p>'; return; }
    grid.innerHTML=files.map(f=>
      '<div class="litem" onclick="setActiveLook(this,\''+f+'\')">'
      +'<div class="lcheck">✓</div>'
      +'<img src="/look-img/'+encodeURIComponent(f)+'" loading="lazy">'
      +'<div class="lname">'+f+'</div>'
      +'</div>'
    ).join('');
  });
  // Scripts
  fetch('/library').then(r=>r.json()).then(lib=>{
    const scripts=(lib.scripts||[]).slice().reverse();
    document.getElementById('hScripts').textContent='Scripts ('+scripts.length+')';
    const el=document.getElementById('scriptsList');
    if(!scripts.length){ el.innerHTML='<p style="color:#888;font-size:12px">No scripts yet</p>'; return; }
    el.innerHTML=scripts.map(s=>{
      const p=s.performance||'unrated', cls=p==='viral'?'pviral':p==='good'?'pgood':'punrated';
      return '<div class="sitem"><div class="stitle">'+s.title+'<span class="perf '+cls+'">'+p+'</span></div>'
        +'<div class="smeta">'+s.date+' &nbsp; '+(s.script||'').substring(0,90)+'...</div></div>';
    }).join('');
  });
}

function uploadLooks(files) {
  Array.from(files).forEach(file=>{
    const fd=new FormData(); fd.append('photo',file);
    fetch('/upload-look',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{ if(d.ok){ log('Look added: '+d.file); loadLib(); }});
  });
}

function setActiveLook(el,f) {
  fetch('/set-look',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:f})})
    .then(r=>r.json()).then(d=>{
      if(d.ok){
        document.querySelectorAll('.litem').forEach(i=>i.classList.remove('sel'));
        el.classList.add('sel');
        log('Avatar → '+f);
      }
    });
}

// ── VIDEOS ────────────────────────────────────────────────────────────────────
function loadVids() {
  fetch('/videos').then(r=>r.json()).then(videos=>{
    const el=document.getElementById('videoList');
    if(!videos.length){ el.innerHTML='<p style="color:#888;font-size:12px">No videos yet</p>'; return; }
    el.innerHTML=videos.map((v,i)=>
      '<div class="vitem">'
      +'<div class="vrow">'
      +'<span class="vname">'+v.name+'</span>'
      +'<div class="vbtns">'
      +'<button class="vplay" onclick="togglePlayer('+i+',this)">▶ Play</button>'
      +'<a class="vsave" href="/download/'+encodeURIComponent(v.name)+'">💾</a>'
      +'</div></div>'
      +'<div class="vplayer" id="vp'+i+'">'
      +'<video id="vv'+i+'" playsinline preload="none" src="/video/'+encodeURIComponent(v.name)+'"></video>'
      +'<div class="vcontrols">'
      +'<button class="vpause" id="vpb'+i+'" onclick="togglePlay('+i+')">⏸ Pause</button>'
      +'<button class="vstop" onclick="closePlayer('+i+')">✕ Close</button>'
      +'<a class="vdl" href="/download/'+encodeURIComponent(v.name)+'">💾 Save</a>'
      +'</div></div>'
      +'</div>'
    ).join('');
  });
}

function togglePlayer(i,btn) {
  const pl=document.getElementById('vp'+i), vv=document.getElementById('vv'+i);
  if (pl.style.display==='block') { closePlayer(i); return; }
  document.querySelectorAll('.vplayer').forEach(p=>{p.style.display='none';});
  document.querySelectorAll('.vv').forEach(v=>{v.pause();});
  pl.style.display='block'; vv.play();
  document.getElementById('vpb'+i).textContent='⏸ Pause';
  btn.textContent='■ Close';
}
function togglePlay(i) {
  const vv=document.getElementById('vv'+i), btn=document.getElementById('vpb'+i);
  if(vv.paused){ vv.play(); btn.textContent='⏸ Pause'; } else { vv.pause(); btn.textContent='▶ Play'; }
}
function closePlayer(i) {
  const vv=document.getElementById('vv'+i);
  vv.pause(); document.getElementById('vp'+i).style.display='none';
  document.querySelectorAll('.vplay').forEach(b=>b.textContent='▶ Play');
}
</script>
</body>
</html>`;

// ── SERVER ────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Access-Control-Allow-Origin','*');

  if (url.pathname==='/events') {
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    sseClients.push(res); req.on('close',()=>{ sseClients=sseClients.filter(c=>c!==res); }); return;
  }

  if (url.pathname==='/start' && req.method==='POST') {
    let b=''; req.on('data',d=>b+=d); req.on('end',()=>{
      const {topic}=JSON.parse(b||'{}');
      if (activeProcess) { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({msg:'Already running'})); return; }
      jobState={active:true,topic:topic||'',parts:{},currentPart:1,log:[]};
      promptHistory=[]; replayQueue=[]; replayMode=false; currentPromptQ='';
      const args=[path.join(BASE,'workflow.js')]; if(topic) args.push(topic);
      activeProcess=spawn('node',args,{cwd:BASE,env:{...process.env}});
      sendSSE({type:'status',s:'run'});
      activeProcess.stdout.on('data',d=>{
        const msg=d.toString();
        msg.split('\n').filter(l=>l.trim()).forEach(line=>{
          sendSSE({type:'log',msg:line});
          updateJob(line);
          const triggers=['Change photo','Approve?','YES / NEW','YES / TOPIC','Start?','Make 2 more','Continue to Part','Paste URL','Change?','duration','seconds'];
          if (triggers.some(t=>line.includes(t))) {
            currentPromptQ = line.trim();
            if (replayMode) {
              // Auto-replay: send stored answer without showing prompt to user
              const autoAnswer = nextReplay();
              if (autoAnswer !== null) {
                sendSSE({type:'log', msg:'[replay] ' + autoAnswer});
                setTimeout(() => { if(activeProcess) activeProcess.stdin.write(autoAnswer+'\n'); }, 300);
              } else {
                sendSSE({type:'prompt', msg:line.trim()});
                sendSSE({type:'history', history: promptHistory});
              }
            } else {
              sendSSE({type:'prompt', msg:line.trim()});
              sendSSE({type:'history', history: promptHistory});
            }
          }
        });
        sendSSE({type:'job_state',state:jobState});
      });
      activeProcess.stderr.on('data',d=>{ const m=d.toString().trim(); if(m) sendSSE({type:'log',msg:m}); });
      activeProcess.on('close',()=>{ activeProcess=null; jobState.active=false; sendSSE({type:'done'}); sendSSE({type:'status',s:'idle'}); sendSSE({type:'job_state',state:jobState}); });
      res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({msg:'Started'}));
    }); return;
  }

  if (url.pathname==='/stop' && req.method==='POST') {
    if(activeProcess){activeProcess.kill();activeProcess=null;jobState.active=false;}
    sendSSE({type:'status',s:'idle'}); sendSSE({type:'done'});
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({msg:'Stopped'})); return;
  }

  if (url.pathname==='/input' && req.method==='POST') {
    let b=''; req.on('data',d=>b+=d); req.on('end',()=>{
      const {input}=JSON.parse(b||'{}');
      if(activeProcess) {
        activeProcess.stdin.write(input+'\n');
        if (currentPromptQ && !replayMode) {
          promptHistory.push({q:currentPromptQ, a:input});
          currentPromptQ='';
          sendSSE({type:'history', history:promptHistory});
        }
      }
      res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true}));
    }); return;
  }

  if (url.pathname==='/job-state') {
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(jobState)); return;
  }

  if (url.pathname==='/looks-list') {
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(getLooks())); return;
  }

  if (url.pathname.startsWith('/look-img/')) {
    const fname=decodeURIComponent(url.pathname.replace('/look-img/',''));
    try {
      const real=fs.realpathSync(LOOKS);
      const fpath=path.join(real,fname);
      if(!fs.existsSync(fpath)){res.writeHead(404);res.end();return;}
      const ext=fname.split('.').pop().toLowerCase();
      const mime={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'}[ext]||'image/jpeg';
      res.writeHead(200,{'Content-Type':mime,'Cache-Control':'max-age=86400'});
      fs.createReadStream(fpath).pipe(res);
    } catch(e){res.writeHead(404);res.end();}
    return;
  }

  if (url.pathname==='/set-look' && req.method==='POST') {
    let b=''; req.on('data',d=>b+=d); req.on('end',()=>{
      const {file}=JSON.parse(b||'{}');
      try {
        const real=fs.realpathSync(LOOKS);
        const fpath=path.join(real,file);
        setAvatar(fpath);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true,path:fpath}));
      } catch(e){res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false,error:e.message}));}
    }); return;
  }

  if (url.pathname==='/upload-look' && req.method==='POST') {
    if(!fs.existsSync(LOOKS)) fs.mkdirSync(LOOKS,{recursive:true});
    let chunks=[]; req.on('data',d=>chunks.push(d)); req.on('end',()=>{
      try {
        const buf=Buffer.concat(chunks);
        const ct=req.headers['content-type']||'';
        const bm=ct.match(/boundary=(.+)/); if(!bm){res.end(JSON.stringify({ok:false}));return;}
        const nameMatch=buf.toString('binary').match(/filename="([^"]+)"/);
        const fname=(nameMatch?nameMatch[1]:'look_'+Date.now()+'.jpg').replace(/[^a-zA-Z0-9._-]/g,'_');
        const sep='\r\n\r\n';
        const start=buf.indexOf(sep)+sep.length;
        const end=buf.lastIndexOf('--'+bm[1])-2;
        const real=fs.existsSync(LOOKS)&&fs.lstatSync(LOOKS).isSymbolicLink()?fs.realpathSync(LOOKS):LOOKS;
        fs.writeFileSync(path.join(real,fname),buf.slice(start,end));
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true,file:fname}));
      } catch(e){res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false,error:e.message}));}
    }); return;
  }

  if (url.pathname==='/go-back' && req.method==='POST') {
    if (promptHistory.length > 0) {
      const removed = promptHistory.pop(); // remove last Q&A
      const historyToReplay = [...promptHistory]; // replay all previous
      // Kill and restart
      if (activeProcess) { activeProcess.kill(); activeProcess=null; }
      setTimeout(() => {
        jobState={active:true,topic:jobState.topic,parts:{},currentPart:1,log:['↩ Going back — replaying...']};
        replayMode=false; replayQueue=[];
        const topic = jobState.topic;
        const args=[path.join(BASE,'workflow.js')]; if(topic) args.push(topic);
        activeProcess=spawn('node',args,{cwd:BASE,env:{...process.env}});
        sendSSE({type:'status',s:'run'});
        sendSSE({type:'log',msg:'↩ Restarting from: '+removed.q});
        promptHistory = historyToReplay;
        startReplay(historyToReplay);
        activeProcess.stdout.on('data',d=>{
          const msg=d.toString();
          msg.split('\n').filter(l=>l.trim()).forEach(line=>{
            sendSSE({type:'log',msg:line});
            updateJob(line);
            const triggers=['Change photo','Approve?','YES / NEW','YES / TOPIC','Start?','Make 2 more','Continue to Part','Paste URL','Change?','duration','seconds'];
            if (triggers.some(t=>line.includes(t))) {
              currentPromptQ = line.trim();
              if (replayMode) {
                const autoAnswer = nextReplay();
                if (autoAnswer !== null) {
                  sendSSE({type:'log',msg:'[replay] '+autoAnswer});
                  setTimeout(()=>{ if(activeProcess) activeProcess.stdin.write(autoAnswer+'\n'); },300);
                } else {
                  sendSSE({type:'prompt',msg:line.trim()});
                  sendSSE({type:'history',history:promptHistory});
                }
              } else {
                sendSSE({type:'prompt',msg:line.trim()});
                sendSSE({type:'history',history:promptHistory});
              }
            }
          });
          sendSSE({type:'job_state',state:jobState});
        });
        activeProcess.stderr.on('data',d=>{const m=d.toString().trim();if(m)sendSSE({type:'log',msg:m});});
        activeProcess.on('close',()=>{activeProcess=null;jobState.active=false;sendSSE({type:'done'});sendSSE({type:'status',s:'idle'});sendSSE({type:'job_state',state:jobState});});
      }, 500);
    }
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true})); return;
  }

  if (url.pathname==='/videos') {
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(getVideos())); return;
  }
  if (url.pathname==='/library') {
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(loadLib())); return;
  }

  if (url.pathname.startsWith('/video/')||url.pathname.startsWith('/download/')) {
    const fname=decodeURIComponent(url.pathname.split('/').pop());
    try {
      const real=fs.existsSync(OUTPUTS)&&fs.lstatSync(OUTPUTS).isSymbolicLink()?fs.realpathSync(OUTPUTS):OUTPUTS;
      const fpath=path.join(real,fname);
      if(!fs.existsSync(fpath)){res.writeHead(404);res.end('Not found');return;}
      const stat=fs.statSync(fpath);
      const dl=url.pathname.startsWith('/download/');
      res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':stat.size,'Content-Disposition':(dl?'attachment':'inline')+'; filename="'+fname+'"','Accept-Ranges':'bytes'});
      fs.createReadStream(fpath).pipe(res);
    } catch(e){res.writeHead(404);res.end();}
    return;
  }

  res.writeHead(200,{'Content-Type':'text/html'}); res.end(HTML);
});

server.on('error',e=>{ if(e.code==='EADDRINUSE'){console.error('Port '+PORT+' busy — run: lsof -ti :'+PORT+' | xargs kill -9');process.exit(1);} });
server.listen(PORT,'0.0.0.0',()=>{
  const ifaces=require('os').networkInterfaces();
  let ip='localhost';
  Object.values(ifaces).flat().forEach(i=>{ if(i.family==='IPv4'&&!i.internal) ip=i.address; });
  console.log('\n🌐 Web interface running!');
  console.log('Mac:    http://localhost:'+PORT);
  console.log('iPhone: http://'+ip+':'+PORT+'\n');
});

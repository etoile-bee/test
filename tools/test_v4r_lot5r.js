// [LOT 5R] J heartbeat Kling · K affichage 9:16 (width/height/thumb) · L écran final vidéo · M nettoyage légendes · O format légendes legacy.
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-5r-'));
const T=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwB//9k=','base64');
fs.mkdirSync(path.join(BOX,'looks'),{recursive:true}); for(let i=0;i<6;i++) fs.writeFileSync(path.join(BOX,'looks','s'+i+'.jpg'),Buffer.concat([T,Buffer.from('M'+i)]));
fs.mkdirSync(path.join(BOX,'outputs'),{recursive:true}); fs.writeFileSync(path.join(BOX,'lookbook.json'),'{"pricing":{"eur_per_credit":0.058,"ops":{"eco":0.48,"hd":1,"video30s":5}}}');
process.env.V4R_SANDBOX=BOX; process.on('exit',()=>{try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const SC=require('../ui/screens');
const src=fs.readFileSync(path.join(__dirname,'..','telegram_bot.js'),'utf8');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const cbsV=v=>[].concat.apply([],(v.rows||[])).map(b=>b.cb);

// ── O : format légendes legacy (courte ≈2 phrases, longue plus développée, DIFFÉRENTES) ──
const script='Il te voit clairement. Mais il choisit de se taire. Et toi tu attends un signe. Arrête d\'attendre une miette. Tu mérites une présence entière. Pose ta limite aujourd\'hui.';
const der=bot.deriveCaptions(script);
const nPh=s=>(String(s).match(/[.!?…]/g)||[]).length;
chk('#O : COURTE ≈ 2 phrases', der && nPh(der.short)>=1 && nPh(der.short)<=2);
chk('#O : LONGUE plus développée (≥3 phrases) et PLUS LONGUE que la courte', der && nPh(der.long)>=3 && der.long.length>der.short.length);
chk('#O : courte ≠ longue (jamais identiques)', der && der.short!==der.long);
chk('#O : hashtags fournis (fusionnés ailleurs via r0FuseTags)', der && /#/.test(der.tags));

// ── L : écran final vidéo = légendes copiables + Partie + Refaire ──
const vr=SC.videoResultView({medias:[{id:'v',type:'video',etat:'final',file:'/v.mp4'}],draft:{video:{theme:'X'}},publication:{legende_courte:'A',legende_longue:'B',hashtags:'#x'}},{});
const C=cbsV(vr);
chk('#L : 🏷 Lég. courte + longue copiables sur l\'écran final', C.includes('R0_FULLTEXT_legc') && C.includes('R0_FULLTEXT_legl'));
chk('#L : ➕ Partie 2/3 + 🎬 Refaire vidéo sur l\'écran final', C.includes('R0_VI_PART') && C.includes('R0_VI_CREATE'));
chk('#L : écran final reste 2/ligne (pas de rangée >2)', !(vr.rows||[]).some(r=>r.length>2));

// ── M : Fichiers — plus de ligne « Hashtags : » ni bouton « Éditer légendes » ──
const rv=SC.resourcesView({projectId:'imany_x',medias:[],publication:{hashtags:'#a #b'},draft:{photo:{},video:{}}},{});
chk('#M : Fichiers — AUCUNE ligne « Hashtags : » séparée', !/Hashtags\s*:/.test(rv.caption));
chk('#M : Fichiers — bouton « Éditer légendes » RETIRÉ (R0_PUB_EDIT absent)', !cbsV(rv).includes('R0_PUB_EDIT'));
chk('#M : Fichiers — légendes copiables (courte/longue) conservées', cbsV(rv).includes('R0_FULLTEXT_legc') && cbsV(rv).includes('R0_FULLTEXT_legl'));

// ── J : battement de cœur (~3 min legacy) branché sur la génération vidéo + timeout ──
chk('#J : constante R0_HEARTBEAT_MS = 180000 (≈3 min, legacy)', /R0_HEARTBEAT_MS\s*=.*180000/.test(src));
chk('#J : heartbeat setInterval branché dans la génération vidéo (génération en cours + ⏱)', /setInterval\([^]*?génération en cours[^]*?R0_HEARTBEAT_MS\)/.test(src) || (/_hb=setInterval\(/.test(src) && /génération en cours/.test(src)));
chk('#J : heartbeat nettoyé (clearInterval) en fin/erreur (anti-fuite)', (src.match(/clearInterval\(_hb\)/g)||[]).length>=2);
chk('#J : timeout vidéo -> incident (jamais figé indéfiniment)', /délai dépassé|15 min|900000/.test(src));

// ── K : width/height/thumb sur TOUS les chemins sendVideo (affichage 9:16) ──
chk('#K : helper _attachVideoMeta (width/height/thumbnail)', /_attachVideoMeta/.test(src) && /append\('width'/.test(src) && /append\('height'/.test(src) && /thumbnail/.test(src));
chk('#K : _videoDims via ffprobe + repli 720×1280', /_videoDims/.test(src) && /720[^]*?1280|w:720, ?h:1280|\{w:720/.test(src));
chk('#K : sendVideoKb + sendVid + cockpitVideo + ENG.sendVideo passent les métadonnées', (src.match(/_attachVideoMeta\(/g)||[]).length>=4);
chk('#K : editVideoKb (édition en place) envoie width/height dans le média', /media:\{type:'video'[^}]*width:_dim\.w,height:_dim\.h/.test(src));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

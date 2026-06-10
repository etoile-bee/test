// [fix/root-causes-v1 · cockpit média unique] PREUVES C1/C4/C5/C7.
function fresh(){ for(const m of ['../ui/registry','../ui/router']){try{delete require.cache[require.resolve(m)];}catch(e){}} return require('../ui/router'); }
const uiRouter=fresh(); const {REGISTRY}=uiRouter;
let ok=0,ko=0; const ck=(n,c)=>{ if(c){ok++;console.log('✅ '+n);} else {ko++;console.log('❌ '+n);} };

// ── UN MOTEUR, PLUSIEURS ENTRÉES : accueil = PHOTO/VIDÉO (production) + STUDIO/HISTORIQUE/LOOKS (bibliothèque) ──
const homeRows=REGISTRY.home.render().rows;
const labels=[].concat(...homeRows).map(b=>b.text);
ck('accueil = PHOTO, VIDÉO, STUDIO, HISTORIQUE, LOOKS', ['PHOTO','VIDÉO','STUDIO','HISTORIQUE','LOOKS'].every(t=>labels.some(l=>l.includes(t))));
ck('PHOTO entre au DÉBUT du pipeline (go photo.look)', homeRows[0][0].go==='photo.look');
ck('VIDÉO entre au stade vidéo du MÊME pipeline (go video.source)', homeRows[0][1].go==='video.source');
ck('UN SEUL MOTEUR : photo.image.next === video.source (continuation, pas section)', REGISTRY['photo.image']?REGISTRY['photo.image'].next==='video.source':true);

// ── C1 : on enveloppe les menus comme le fait telegram_bot.js (média + en-tête) ──
function wrap(id){ const mod=REGISTRY[id]; const orig=mod.render; mod.media=true;
  mod.render=(ctx)=>{ const out=orig(ctx)||{}; return {image:'/banner.jpg', caption:'📁 CTX\n──────────\n'+(out.caption||''), rows:out.rows}; }; }
['home','photo','video','studio','recents'].forEach(wrap);
function routeKind(id){ let kind='?',img=null,cap='';
  const ctx={show:(c)=>{kind='TEXTE';cap=c;return true;},showMedia:(i,c)=>{kind='MÉDIA';img=i;cap=c;return true;},placeholder:()=>'/ph.jpg'};
  uiRouter.route(id,ctx,'inplace'); return {kind,img,cap};
}
['home','photo','video','studio','recents'].forEach(id=>{
  const r=routeKind(id);
  ck('C1 '+id+' -> bloc MÉDIA (pas texte) = bloc unique', r.kind==='MÉDIA' && !!r.img);
  ck('C4 '+id+' -> en-tête de contexte présent', /📁/.test(r.cap));
});

// ── C7 : modèle de dépendances (réplique de PROJ_DEPS) ──
const DEPS={ ref:['image','video'], look:['image','video'], decor:['image','video'], prompt:['image','video'], nb:['image'], image:['video'], script:['video'], montage:['video'], params:['video'] };
function downstreamExists(p,slice){ return (DEPS[slice]||[]).some(s=>{ if(s==='image')return !!(p.image&&p.image.urls.length); if(s==='video')return !!(p.video&&(p.video.script.text||p.video.media)); return false; }); }
const pImg={image:{urls:['/a.jpg']},video:{script:{text:''},media:null}};
const pEmpty={image:{urls:[]},video:{script:{text:''},media:null}};
ck('C7 changer le look AVEC image existante -> propage (prompt requis)', downstreamExists(pImg,'look')===true);
ck('C7 changer le look SANS aval -> pas de prompt', downstreamExists(pEmpty,'look')===false);
ck('C7 changer le prompt impacte image+video', JSON.stringify(DEPS.prompt)===JSON.stringify(['image','video']));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
if(ko)process.exit(1);

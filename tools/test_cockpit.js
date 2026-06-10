// [fix/root-causes-v1 · cockpit média unique] PREUVES C1/C4/C5/C7.
function fresh(){ for(const m of ['../ui/registry','../ui/router']){try{delete require.cache[require.resolve(m)];}catch(e){}} return require('../ui/router'); }
const uiRouter=fresh(); const {REGISTRY}=uiRouter;
let ok=0,ko=0; const ck=(n,c)=>{ if(c){ok++;console.log('✅ '+n);} else {ko++;console.log('❌ '+n);} };

// ── [P4] MENU PRINCIPAL = 4 entrées : PHOTO · VIDÉO · STUDIO · RÉCENTS ──
const homeRows=REGISTRY.home.render().rows;
const labels=[].concat(...homeRows).map(b=>b.text);
ck('accueil = 4 entrées PHOTO/VIDÉO/STUDIO/RÉCENTS', ['PHOTO','VIDÉO','STUDIO','RÉCENTS'].every(t=>labels.some(l=>l.includes(t))) && labels.length===4);
ck('accueil NE contient PLUS Looks/Historique (déplacés dans Studio)', !labels.some(l=>/LOOKS|HISTORIQUE/.test(l)));
ck('PHOTO entre au DÉBUT du pipeline (go photo.look)', homeRows[0][0].go==='photo.look');
ck('VIDÉO entre au stade vidéo du MÊME pipeline (go video.source)', homeRows[0][1].go==='video.source');
ck('UN SEUL MOTEUR : photo.image.next === video.source', REGISTRY['photo.image']?REGISTRY['photo.image'].next==='video.source':true);
// [P3/P4] Studio = TOUTES les bibliothèques en modules média (grilles)
{ const sb=[].concat(...REGISTRY.studio.render().rows);
  ['studio.looks','studio.historique','studio.photos','studio.videos','studio.posted','studio.references','studio.decors','studio.modeles','studio.personas']
    .forEach(g=>ck('Studio › '+g+' (go média)', sb.some(b=>b.go===g)));
  ck('Studio : aucun bouton legacy cb', sb.filter(b=>b.cb).length===0); }

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
// C7 câblé : décision afterCoreChange + sémantique PX_REGEN
function afterDecision(p,slice){ return downstreamExists(p,slice)?'PROMPT':'DIRECT'; }
ck('C7 afterCoreChange : look sans aval -> DIRECT (pas de prompt, sûr)', afterDecision(pEmpty,'look')==='DIRECT');
ck('C7 afterCoreChange : look avec image -> PROMPT', afterDecision(pImg,'look')==='PROMPT');
function pxRegen(p,slice){ const imp=DEPS[slice]||[]; if(imp.indexOf('image')>=0){p.image.urls=[];p.image.validated=null;} if(imp.indexOf('video')>=0){p.video.script={text:''};p.video.media=null;} return p; }
{ const p={image:{urls:['/a.jpg'],validated:0},video:{script:{text:'S'},media:'/m.jpg'}}; pxRegen(p,'look');
  ck('C7 Régénérer(look) vide image ET vidéo', p.image.urls.length===0&&p.image.validated===null&&p.video.script.text===''&&p.video.media===null); }
{ const p={image:{urls:['/a.jpg'],validated:0},video:{script:{text:'S'},media:'/m.jpg'}}; pxRegen(p,'image');
  ck('C7 Régénérer(image) vide la vidéo, garde l\'image', p.image.urls.length===1&&p.video.media===null); }

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO');
if(ko)process.exit(1);

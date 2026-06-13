// [#8 CLOUD PAR CODE PROJET] preuve : consolidation podcast-looks/<projectId>/ (RAW rapatrié) ; DRY-RUN n'écrit rien ; --apply copie (originaux intacts) ; --undo réversible.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const BOX=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-cloudproj-'));
const SCRIPT=path.join(__dirname,'cloud_migration.js');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};
const run=(args)=>cp.execFileSync('node',[SCRIPT].concat(args),{encoding:'utf8'});

// ── arborescence simulée ──
const persona='imany', id='imany_2026-06-11-16-19-32', sid='2026-06-11-16-19-32';
const proj=path.join(BOX,'projects_r',persona,id); fs.mkdirSync(proj,{recursive:true});
const looks=path.join(BOX,'looks'); const looksId=path.join(looks,id); fs.mkdirSync(looksId,{recursive:true});
const outDay=path.join(BOX,'outputs','2026-06-11',sid+'_red-flags'); fs.mkdirSync(outDay,{recursive:true});

// podcast-looks/<id>/ n'a QUE le final (cas décrit par Etoile) ; le RAW est ailleurs
fs.writeFileSync(path.join(looksId,sid+'_final.mp4'),Buffer.alloc(20000,7));
// RAW dans le dossier de travail du projet
fs.writeFileSync(path.join(proj,sid+'_raw_p1.mp4'),Buffer.alloc(15000,3));
// script + une vidéo finale aussi présents côté outputs (ancien dépôt par date)
fs.writeFileSync(path.join(outDay,'final.mp4'),Buffer.alloc(21000,9));
fs.writeFileSync(path.join(outDay,'infos.txt'),'SCRIPT:\nRed flags à ne pas ignorer.');

const argsBase=['--base='+BOX,'--looks='+looks];

// ── (1) DRY-RUN : plan correct, AUCUNE écriture ──
const before=fs.readdirSync(looksId).sort().join(',');
const dry=run(argsBase);
chk('#8 : DRY-RUN cible podcast-looks/<projectId>/ (par code, pas par date)', dry.indexOf('looks/'+id+'/')>=0);
chk('#8 : DRY-RUN repère le RAW à rapatrier', /\[RAW\]/.test(dry));
chk('#8 : DRY-RUN n\'écrit RIEN (dossier looks inchangé)', fs.readdirSync(looksId).sort().join(',')===before);
chk('#8 : DRY-RUN ne crée pas de journal d\'undo', !fs.existsSync(path.join(looks,'.v4r_cloud_consolidate_undo.json')));

// ── (2) APPLY : copie réelle dans podcast-looks/<id>/, originaux INTACTS ──
run(argsBase.concat(['--apply']));
const after=fs.readdirSync(looksId);
chk('#8 : APPLY -> le RAW est désormais dans podcast-looks/<id>/ (marqué _raw)', after.some(n=>/_raw.*\.mp4$/i.test(n)));
chk('#8 : APPLY -> dossier projet contient final + RAW + script', after.some(n=>/_final\.mp4$/.test(n)) && after.some(n=>/_raw.*\.mp4$/i.test(n)) && after.some(n=>/\.txt$/i.test(n)));
chk('#8 : APPLY -> ORIGINAUX intacts (copie, pas déplacement)', fs.existsSync(path.join(proj,sid+'_raw_p1.mp4')) && fs.existsSync(path.join(outDay,'final.mp4')));
chk('#8 : APPLY -> journal d\'undo écrit', fs.existsSync(path.join(looks,'.v4r_cloud_consolidate_undo.json')));

// idempotence : un 2e apply ne duplique pas
const cntA=fs.readdirSync(looksId).length;
run(argsBase.concat(['--apply']));
chk('#8 : APPLY idempotent (rien de dupliqué au 2e passage)', fs.readdirSync(looksId).length===cntA);

// ── (3) UNDO : supprime UNIQUEMENT les copies, jamais les originaux ──
run(argsBase.concat(['--undo']));
const afterUndo=fs.readdirSync(looksId);
chk('#8 : UNDO -> retire les copies rapatriées (RAW retiré de looks)', !afterUndo.some(n=>/_raw.*\.mp4$/i.test(n)));
chk('#8 : UNDO -> le final d\'origine de looks RESTE (jamais touché)', afterUndo.some(n=>/_final\.mp4$/.test(n)));
chk('#8 : UNDO -> originaux toujours là', fs.existsSync(path.join(proj,sid+'_raw_p1.mp4')) && fs.existsSync(path.join(outDay,'final.mp4')));

try{fs.rmSync(BOX,{recursive:true,force:true});}catch(e){}
console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

// [W2 — Etoile] IDENTITÉ : le prompt photo (Seedream) doit renforcer l'identité FÉMININE et EXCLURE poils torse / traits masculins.
//   Seedream v1 n'a pas de champ negative_prompt -> exclusion incrustée dans le prompt. On le PROUVE sur buildPrompt + sur l'écran résultat (UX inspection).
process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const path=require('path');
const NL=require('../newlook.js');
const SC=require('../ui/screens');
let ok=0,ko=0; const chk=(m,c)=>{console.log((c?'✅':'❌')+' '+m);c?ok++:ko++;};

// lookbook minimal pour buildPrompt
const lb={ categories:{}, envs:{ bougies:{prompt:'candlelit studio'} }, pose_rules:'chest-up portrait.', style_rules:'', texture_rules:'', realism_rules:'' };

// 1) mode éco (génération standard)
const p1=NL.buildPrompt(lb,{mode:'eco'});
chk('W2 : prompt éco renforce l\'identité FÉMININE (WOMAN/feminine)', /\bWOMAN\b/i.test(p1)&&/feminine/i.test(p1));
const EXCL=['body hair','chest hair','torso hair','beard','stubble','moustache','masculine'];
chk('W2 : prompt éco EXCLUT poils torse + traits masculins', EXCL.every(w=>new RegExp(w,'i').test(p1)));

// 2) mode planche (multi-angles)
const p2=NL.buildPrompt(lb,{mode:'planche'});
chk('W2 : prompt planche porte aussi l\'exclusion', EXCL.every(w=>new RegExp(w,'i').test(p2)));

// 3) UX : écran résultat PHOTO invite à inspecter la photo AVANT de créer la vidéo
const fimg={ medias:[{id:'i',type:'image',etat:'final',file:'/i.jpg'}], draft:{photo:{}} };
const pr=SC.photoResultView(fimg,{projNum:1});
chk('W2-UX : résultat photo invite à vérifier la photo (zoom) avant la vidéo', /v[ée]rifier|en grand|👀/i.test(pr.caption));
chk('W2-UX : « 🎬 Créer vidéo » accessible depuis le résultat (après inspection)', [].concat.apply([],pr.rows).some(b=>b.cb==='R0_PH_TOVIDEO'));

console.log('\nRÉSULTAT: '+ok+' OK, '+ko+' KO'); process.exit(ko?1:0);

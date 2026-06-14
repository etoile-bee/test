process.env.R0_DRYRUN='1'; process.env.TELEGRAM_TOKEN='dry'; process.env.TELEGRAM_CHAT_ID='1';
const fs=require('fs'),path=require('path'),os=require('os');
const REAL=path.join(os.homedir(),'podcast-workflow');
const SB=fs.mkdtempSync(path.join(os.tmpdir(),'v4r-an-'));
for(const d of ['projects_r','outputs','looks']){ try{ const t=path.join(REAL,d); if(fs.existsSync(t)) fs.symlinkSync(t,path.join(SB,d)); }catch(e){} }
for(const f of ['lookbook.json','library.json','outfits_catalog.json']){ try{ fs.copyFileSync(path.join(REAL,f),path.join(SB,f)); }catch(e){} }
process.env.V4R_SANDBOX=SB; process.on('exit',()=>{try{fs.rmSync(SB,{recursive:true,force:true});}catch(e){}});
const bot=require('../telegram_bot.js'); const PN=bot.projNums();
const pn=fp=>{try{const id=bot.projectIdOf(fp);return id&&PN[id]?PN[id]:null;}catch(e){return null;}};
const imgs=bot.realImages(9999)||[], vids=bot.realVideos(9999)||[];
const ratio=(arr)=>{ let withP=0; const ex={}; for(const f of arr){ const n=pn(f); if(n!=null){withP++; ex[n]=(ex[n]||0)+1;} } return {tot:arr.length,withP,sans:arr.length-withP,distinctProj:Object.keys(ex).length}; };
console.log('PHOTOS:',JSON.stringify(ratio(imgs)));
console.log('VIDÉOS:',JSON.stringify(ratio(vids)));
console.log('projets numérotés total:',Object.keys(PN).length);

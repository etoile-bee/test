require('dotenv').config();
const fs=require('fs'),path=require('path');const {execSync}=require('child_process');
const EL_KEY=process.env.ELEVENLABS_API_KEY;
if(!EL_KEY){console.error('ELEVENLABS_API_KEY introuvable. Lance depuis ~/podcast-workflow.');process.exit(1);}
const MALE=process.env.ELEVENLABS_VOICE_ID_MALE||'pNInz6obpgDQGcFmaJgB';
const outDir=path.join(process.env.HOME||'.','podcast-workflow','reactions');
fs.mkdirSync(outDir,{recursive:true});
// sauvegarde des sons actuels
try{const bk=path.join(outDir,'_old3');fs.mkdirSync(bk,{recursive:true});['mhm','yeah','right','hmm'].forEach(n=>{const f=path.join(outDir,n+'.mp3');if(fs.existsSync(f))fs.copyFileSync(f,path.join(bk,n+'.mp3'));});console.log('Anciens sons sauvegardes dans reactions/_old3/');}catch(e){}
// reactions courtes, naturelles, PRESENTES (proches du micro)
const REACTIONS=[{name:'mhm',text:'Mhm.'},{name:'yeah',text:'Yeah.'},{name:'right',text:'Right.'},{name:'hmm',text:'Hmm.'}];
for(const r of REACTIONS){
  // plus de presence : speaker_boost ON, style leger, stabilite moyenne
  const body={text:r.text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.55,similarity_boost:0.85,style:0.15,use_speaker_boost:true}};
  const bf='/tmp/r3_'+r.name+'.json';fs.writeFileSync(bf,JSON.stringify(body));
  const raw='/tmp/r3_'+r.name+'_raw.mp3';
  const out=path.join(outDir,r.name+'.mp3');
  try{
    execSync('curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/'+MALE+'" -H "xi-api-key: '+EL_KEY+'" -H "Content-Type: application/json" -H "Accept: audio/mpeg" -d @"'+bf+'" -o "'+raw+'"');
    const sz=fs.existsSync(raw)?fs.statSync(raw).size:0;
    if(sz<800){console.error('  '+r.name+' : reponse API douteuse ('+sz+' o)');try{console.error('  '+fs.readFileSync(raw,'utf8').substring(0,200));}catch(e){}continue;}
    // post : enleve le silence de tete, fondus tres courts, leger relief aigus (presence), normalise un peu
    // silenceremove (debut) -> treble +3dB a 4kHz (presence, moins etouffe) -> afade in 0.02 / out 0.08 -> loudnorm leger
    execSync('ffmpeg -y -i "'+raw+'" -af "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-45dB,treble=g=3:f=4000,afade=t=in:st=0:d=0.02,areverse,afade=t=in:st=0:d=0.08,areverse" -ar 44100 "'+out+'" 2>/dev/null');
    const sz2=fs.existsSync(out)?fs.statSync(out).size:0;
    if(sz2>500)console.log('OK '+r.name+'.mp3  ('+sz2+' o, present + clair)');
    else{fs.copyFileSync(raw,out);console.log('OK '+r.name+'.mp3 (brut, post ignore)');}
  }catch(e){console.error('ERR '+r.name+' : '+e.message);}
}
console.log('\nDossier:',outDir);
try{execSync('open "'+outDir+'"');}catch(e){}
console.log('Pour revenir aux sons precedents : cp reactions/_old3/*.mp3 reactions/');

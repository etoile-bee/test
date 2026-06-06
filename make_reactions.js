require('dotenv').config();
const fs=require('fs'),path=require('path');const {execSync}=require('child_process');
const EL_KEY=process.env.ELEVENLABS_API_KEY;
if(!EL_KEY){console.error('ELEVENLABS_API_KEY introuvable. Lance depuis ~/podcast-workflow (la ou est le .env).');process.exit(1);}
const MALE=process.env.ELEVENLABS_VOICE_ID_MALE||'pNInz6obpgDQGcFmaJgB';
const outDir=path.join(process.env.HOME||'.', 'podcast-workflow','reactions');
fs.mkdirSync(outDir,{recursive:true});
const REACTIONS=[{name:'mhm',text:'Mm-hmm.'},{name:'yeah',text:'Yeah.'},{name:'right',text:'Right.'},{name:'hmm',text:'Hmm.'}];
for(const r of REACTIONS){
  const body={text:r.text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.8,style:0.2,use_speaker_boost:true}};
  const bf='/tmp/react_body_'+r.name+'.json';fs.writeFileSync(bf,JSON.stringify(body));
  const out=path.join(outDir,r.name+'.mp3');
  try{
    execSync('curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/'+MALE+'" -H "xi-api-key: '+EL_KEY+'" -H "Content-Type: application/json" -H "Accept: audio/mpeg" -d @"'+bf+'" -o "'+out+'"');
    const sz=fs.existsSync(out)?fs.statSync(out).size:0;
    if(sz<800){console.error('  '+r.name+' : fichier trop petit ('+sz+' o), reponse API douteuse:');try{console.error('  '+fs.readFileSync(out,'utf8').substring(0,200));}catch(e){}}
    else{console.log('OK '+r.name+'.mp3  ('+sz+' o)');}
  }catch(e){console.error('ERR '+r.name+' : '+e.message);}
}
console.log('\nDossier:',outDir);
try{execSync('open "'+outDir+'"');}catch(e){}
console.log('Ecoute les 4 sons. Si la voix ne te plait pas: mets ELEVENLABS_VOICE_ID_MALE=<id> dans .env.');

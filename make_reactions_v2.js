require('dotenv').config();
const fs=require('fs'),path=require('path');const {execSync}=require('child_process');
const EL_KEY=process.env.ELEVENLABS_API_KEY;
if(!EL_KEY){console.error('ELEVENLABS_API_KEY introuvable. Lance depuis ~/podcast-workflow (la ou est le .env).');process.exit(1);}
const MALE=process.env.ELEVENLABS_VOICE_ID_MALE||'pNInz6obpgDQGcFmaJgB';
const outDir=path.join(process.env.HOME||'.','podcast-workflow','reactions');
fs.mkdirSync(outDir,{recursive:true});

// sauvegarde des anciens sons (au cas ou tu preferes les garder)
const bak=path.join(outDir,'_old');
try{fs.mkdirSync(bak,{recursive:true});['mhm','yeah','right','hmm'].forEach(n=>{const p=path.join(outDir,n+'.mp3');if(fs.existsSync(p))fs.copyFileSync(p,path.join(bak,n+'.mp3'));});console.log('Anciens sons sauvegardes dans reactions/_old/');}catch(e){}

// textes en minuscules, sans point : sonnent moins "lus". Acquiescements doux.
const REACTIONS=[
  {name:'mhm',  text:'mm-hmm'},
  {name:'yeah', text:'yeah'},
  {name:'right',text:'right'},
  {name:'hmm',  text:'hmm'}
];
// voix posee, pas theatrale : stability haute, style 0, pas de speaker boost
const VS={stability:0.7,similarity_boost:0.85,style:0.0,use_speaker_boost:false};

for(const r of REACTIONS){
  const body={text:r.text,model_id:'eleven_multilingual_v2',voice_settings:VS};
  const bf='/tmp/react2_'+r.name+'.json';fs.writeFileSync(bf,JSON.stringify(body));
  const raw='/tmp/react2_raw_'+r.name+'.mp3';
  const out=path.join(outDir,r.name+'.mp3');
  try{
    execSync('curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/'+MALE+'" -H "xi-api-key: '+EL_KEY+'" -H "Content-Type: application/json" -H "Accept: audio/mpeg" -d @"'+bf+'" -o "'+raw+'"');
    const sz=fs.existsSync(raw)?fs.statSync(raw).size:0;
    if(sz<800){console.error('  '+r.name+' : reponse API douteuse ('+sz+' o)');try{console.error('  '+fs.readFileSync(raw,'utf8').substring(0,200));}catch(e){}continue;}
    // post-traitement : coupe le silence de debut + fondu entree 0.04s + fondu sortie 0.12s (via areverse) + volume doux
    const af='silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB,afade=t=in:st=0:d=0.04,areverse,afade=t=in:st=0:d=0.12,areverse,volume=0.85';
    execSync('ffmpeg -y -i "'+raw+'" -af "'+af+'" -ar 44100 "'+out+'" 2>/dev/null');
    const sz2=fs.existsSync(out)?fs.statSync(out).size:0;
    if(sz2>500)console.log('OK '+r.name+'.mp3  ('+sz2+' o, naturel + fondus)');
    else{console.error('  '+r.name+' : post-traitement rate, je garde le brut');fs.copyFileSync(raw,out);}
  }catch(e){console.error('ERR '+r.name+' : '+e.message);}
}
console.log('\nDossier:',outDir);
try{execSync('open "'+outDir+'"');}catch(e){}
console.log('Ecoute les 4 sons. Si la VOIX ne te plait toujours pas, mets une autre ELEVENLABS_VOICE_ID_MALE=<id> dans .env et relance.');
console.log('Pour revenir aux anciens : cp reactions/_old/*.mp3 reactions/');

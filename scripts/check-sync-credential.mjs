import {appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const shouldSync = ({event,configured}) => event!=='schedule'||configured;
async function main(){
  const enabled=shouldSync({event:process.env.GITHUB_EVENT_NAME,configured:Boolean(process.env.DSH_RELEASE_READ_TOKEN)});
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'enabled='+enabled+'\n');
  if(!enabled){
    const message='Release sync is awaiting DSH_RELEASE_READ_TOKEN setup. Scheduled sync was skipped; the verified feed and deployed website are unchanged.';
    console.log(message);
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,message+'\n');
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Could not record release-sync setup status.');process.exitCode=1;});

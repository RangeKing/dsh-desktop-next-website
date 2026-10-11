import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export async function needsDeployment(feed,{changed=false,force=false,request=fetch}={}){
  if(changed||force)return true;
  try{
    const response=await request('https://rangeking.github.io/dsh-desktop-next-website/data/releases.json',{credentials:'omit',redirect:'error',cache:'no-cache',signal:AbortSignal.timeout(15000)});
    if(!response.ok||Number(response.headers.get('content-length'))>524288||!response.body)return true;
    const reader=response.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>524288){await reader.cancel();return true;}chunks.push(value);}
    const live=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
    return JSON.stringify(live)!==JSON.stringify(feed);
  }catch{return true;}
}
async function main(){
  const feed=JSON.parse(await readFile('data/releases.json','utf8'));
  const needed=await needsDeployment(feed,{changed:process.env.FEED_CHANGED==='true',force:process.env.FORCE_DEPLOY==='true'});
  if(process.env.GITHUB_OUTPUT)await writeFile(process.env.GITHUB_OUTPUT,'needed='+needed+'\n',{flag:'a'});
  console.log(needed?'Verified feed requires deployment.':'Public deployment already matches the verified feed.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Could not verify deployment state.');process.exitCode=1;});

import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {projectRelease,buildPublicReleaseFeed} from './public-release-feed.mjs';

class SyncFailure extends Error {}
export const safeFailureMessage = error => error instanceof SyncFailure ? error.message : 'Release synchronization failed validation or transport checks. Existing release data is unchanged.';
const REPO='RangeKing/dsh-desktop-next';
const API='https://api.github.com/repos/'+REPO;
const MAX_BYTES=1048576;
export async function collectReleases({token,request=fetch,reviewedNotes={},now=()=>new Date().toISOString()}) {
  if(!token)throw new SyncFailure('Release synchronization skipped: DSH_RELEASE_READ_TOKEN is not configured. Existing release data is unchanged.');
  async function read(path,{binary=false}={}) {
    const url=API+path;
    const response=await request(url,{headers:{Accept:binary?'application/octet-stream':'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},redirect:'manual',signal:AbortSignal.timeout(20000)});
    let result=response;
    // Asset API may redirect to a short-lived GitHub storage URL. Never forward credentials.
    if(binary && [301,302,303,307,308].includes(response.status)) {
      const next=new URL(response.headers.get('location'));
      if(next.protocol!=='https:' || !['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(next.hostname) || next.username || next.password)throw new SyncFailure('Untrusted asset redirect');
      result=await request(next.href,{headers:{Accept:'application/octet-stream'},redirect:'error',signal:AbortSignal.timeout(20000)});
    }
    if(!result.ok)throw new SyncFailure('Release source request failed ('+result.status+'). Existing release data is unchanged.');
    if(Number(result.headers.get('content-length'))>MAX_BYTES || !result.body)throw new SyncFailure('Release metadata exceeds limit');
    const reader=result.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new SyncFailure('Release metadata exceeds limit');}chunks.push(value);}
    const bytes=Buffer.concat(chunks);const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    return binary?text:JSON.parse(text);
  }
  const candidates=[];
  for(let page=1;page<=4;page++){
    const list=await read('/releases?per_page=25&page='+page);
    if(!Array.isArray(list))throw new SyncFailure('Invalid release list');
    candidates.push(...list);if(list.length<25)break;
  }
  const records=[];
  for(const release of candidates) {
    if(release.draft || !release.published_at || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.tag_name) || !Array.isArray(release.assets))continue;
    const manifest=release.assets.filter(a=>a.name==='release-manifest.json');
    const checksums=release.assets.filter(a=>a.name==='SHA256SUMS.txt');
    if(!manifest.length || !checksums.length)continue; // Builds still in progress are never selected.
    if(manifest.length!==1 || checksums.length!==1)throw new SyncFailure('Ambiguous release completion metadata');
    for(const asset of [...manifest,...checksums])if(!Number.isSafeInteger(asset.id)||asset.id<=0||asset.state!=='uploaded'||asset.size>MAX_BYTES)throw new SyncFailure('Invalid completion asset');
    let ref=await read('/git/ref/tags/'+encodeURIComponent(release.tag_name));
    let object=ref.object;
    for(let depth=0;object?.type==='tag' && depth<5;depth++){
      if(!/^[a-f0-9]{40}$/.test(object.sha))throw new SyncFailure('Invalid source tag');
      object=(await read('/git/tags/'+object.sha)).object;
    }
    if(object?.type!=='commit'||!/^[a-f0-9]{40}$/.test(object.sha))throw new SyncFailure('Unresolved source tag');
    const manifestText=await read('/releases/assets/'+manifest[0].id,{binary:true});
    const checksumsText=await read('/releases/assets/'+checksums[0].id,{binary:true});
    if(!JSON.parse(manifestText).public_notes && !reviewedNotes[release.tag_name])continue;
    records.push(projectRelease({release,manifestText,checksumsText,expectedSourceSha:object.sha,reviewedNotes:reviewedNotes[release.tag_name]}));
  }
  return buildPublicReleaseFeed({records,generatedAt:now()});
}
async function main(){
  const path='data/releases.json';const old=JSON.parse(await readFile(path,'utf8'));
  const reviewedNotes=JSON.parse(await readFile('data/reviewed-release-notes.json','utf8'));
  const next=await collectReleases({token:process.env.DSH_RELEASE_READ_TOKEN,reviewedNotes});
  // Preserve reviewed history and never downgrade when an API page omits an older release.
  const merged=new Map((old.releases||[]).map(r=>[r.tagName,r]));for(const r of next.releases)merged.set(r.tagName,r);
  const feed=buildPublicReleaseFeed({records:[...merged.values()],generatedAt:next.generatedAt});
  const changed=JSON.stringify(feed.releases)!==JSON.stringify(old.releases);
  if(changed)await writeFile(path,JSON.stringify(feed,null,2)+'\n');
  if(process.env.GITHUB_OUTPUT)await writeFile(process.env.GITHUB_OUTPUT,'changed='+changed+'\n',{flag:'a'});
  console.log(changed?'Verified public release data updated.':'Verified release data is unchanged.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(error=>{console.error(safeFailureMessage(error));process.exitCode=1;});

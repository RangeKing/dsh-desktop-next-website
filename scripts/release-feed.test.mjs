import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('release-feed.js','utf8');
const ctx={window:{}};vm.runInNewContext(source,ctx);
const validate=ctx.window.DSHReleaseFeed.validate;
function fixture(version='0.2.0') {
 const repo='https://github.com/RangeKing/dsh-desktop-next';
 return {schemaVersion:1,generatedAt:'2026-10-11T00:00:00Z',releases:[{access:'repository-members',unsignedTest:true,status:'complete',version,tagName:'v'+version,publishedAt:'2026-10-11T00:00:00Z',prerelease:true,releaseUrl:repo+'/releases/tag/v'+version,notes:{en:'Reviewed public summary.',zh:'已审核的公开摘要。'},assets:[['macos','arm64','dmg'],['macos','arm64','zip'],['macos','x64','dmg'],['macos','x64','zip'],['windows','x64','exe'],['linux','x64','AppImage']].map(([platform,arch,format])=>{const name=`DSH-${version}-${platform}-${arch}-unsigned-test.${format}`;return{name,platform,arch,format,sizeBytes:123,sha256:'a'.repeat(64),url:repo+'/releases/download/v'+version+'/'+name};})}]};
}
test('accepts complete six-platform feed including prereleases',()=>{assert.equal(validate(fixture())[0].version,'0.2.0');assert.equal(validate({schemaVersion:1,generatedAt:'2026-10-11T00:00:00Z',releases:[]}).length,0)});
test('rejects missing assets, duplicates, wrong architecture and untrusted links',()=>{for(const change of [f=>f.releases[0].assets.pop(),f=>f.releases[0].assets[0].url='https://example.com/x',f=>f.releases[0].assets[0].arch='other',f=>f.releases[0].assets[0].sha256='x',f=>f.releases[0].assets[0].sizeBytes=0,f=>f.releases[0].assets[1]=f.releases[0].assets[0],f=>f.releases[0].releaseUrl+='?token=bad']){const f=fixture();change(f);assert.throws(()=>validate(f))}});
test('rejects private or unbounded extra fields and malformed metadata',()=>{for(const change of [f=>f.body='private',f=>f.releases[0].body='private',f=>f.releases[0].notes.en='x'.repeat(12001),f=>f.releases[0].publishedAt='never',f=>f.releases[0].tagName='v9.0.0',f=>f.releases.push(f.releases[0])]){const f=fixture();change(f);assert.throws(()=>validate(f))}});
test('sorts semantic versions without allowing an older selected tag to override latest',()=>{const f=fixture('0.9.0');f.releases.push(fixture('0.10.0').releases[0]);assert.equal(validate(f)[0].version,'0.10.0')});
test('consumer omits credentials, only accepts same-origin feed, and renders text safely',()=>{assert.match(source,/credentials:'omit'/);assert.match(source,/url.origin!==location.origin/);assert.match(source,/reader.cancel/);assert.match(source,/controller.abort/);assert.match(source,/textContent=r.notes/);assert.doesNotMatch(source,/innerHTML|api.github.com|localStorage|sessionStorage/)});

function browser(feed,request=async()=>{throw Error('offline')}) {
 const nodes=new Map();const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:'',href:'',hidden:true});return nodes.get(k);};
 node('#release-fallback').textContent=JSON.stringify(feed);
 node('meta[name="release-feed"]').content='./data/releases.json';
 const ctx={window:{},document:{querySelector:node},location:{href:'https://rangeking.github.io/dsh-desktop-next-website/',origin:'https://rangeking.github.io'},URL,AbortController,TextDecoder,Uint8Array,setTimeout,clearTimeout,fetch:request};
 vm.runInNewContext(source,ctx);return {api:ctx.window.DSHReleaseFeed,node};
}
test('network failure keeps the bundled last-successful release with bilingual text and exact architecture links',async()=>{const f=browser(fixture());await f.api.load();assert.equal(f.node('[data-i18n="download.release"]').href,'https://github.com/RangeKing/dsh-desktop-next/releases/tag/v0.2.0');f.api.render('zh-CN');assert.match(f.node('#release-notes-body').textContent,/公开摘要/);assert.match(f.node('[data-release-asset="macos:arm64:dmg"]').href,/arm64-unsigned-test.dmg$/);assert.match(f.node('[data-i18n="extensions.preview"]').textContent,/v0.2.0/)});
test('invalid remote data cannot replace a verified bundled release',async()=>{const f=browser(fixture(),async()=>new Response(JSON.stringify(fixture('0.1.0'))));await f.api.load();assert.match(f.node('[data-i18n="download.release"]').href,/v0.2.0$/)});
test('empty bootstrap leaves static v0.1.1 untouched, and foreign feed origins are not requested',async()=>{let calls=0;const f=browser({schemaVersion:1,generatedAt:'2026-10-11T00:00:00Z',releases:[]},async()=>{calls++;throw Error()});f.node('meta[name="release-feed"]').content='https://example.com/releases.json';await f.api.load();assert.equal(calls,0);assert.equal(f.node('[data-i18n="download.release"]').href,'')});
test('bounded twenty-release Unicode history loads above the old 128 KiB limit',async()=>{const large=fixture();large.releases=Array.from({length:20},(_,i)=>{const r=fixture(`0.2.${i}`).releases[0];r.notes={en:'界'.repeat(1200),zh:'汉'.repeat(1200)};return r});const text=JSON.stringify(large);assert.ok(Buffer.byteLength(text)>131072);assert.ok(Buffer.byteLength(text)<524288);const f=browser(fixture('0.1.1'),async()=>new Response(text));await f.api.load();assert.match(f.node('[data-i18n="download.release"]').href,/v0.2.19$/)});

test('committed feed contains complete member-only release metadata',()=>{const f=JSON.parse(readFileSync('data/releases.json','utf8'));const releases=validate(f);assert.ok(releases.length>0);assert.equal(releases[0].assets.length,6);assert.equal(new Set(releases.map(r=>r.tagName)).size,releases.length);assert.equal(releases[0].access,'repository-members');assert.equal(releases[0].unsignedTest,true)});

// Public, allowlisted release metadata only. GitHub authentication stays on GitHub.
(() => {
  'use strict';
  const REPO = 'https://github.com/RangeKing/dsh-desktop-next';
  const LIMIT = 524288;
  const expected = ['linux:x64:AppImage','macos:arm64:dmg','macos:arm64:zip','macos:x64:dmg','macos:x64:zip','windows:x64:exe'].sort();
  const exact = (x, keys) => x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).sort().join('|') === [...keys].sort().join('|');
  const plain = (x, max) => typeof x === 'string' && x.length > 0 && x.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);
  const parseVersion = x => {
    if(typeof x!=='string'||x.length>80)return null;
    const m=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(x);
    if(!m||!m.slice(1,4).every(n=>Number.isSafeInteger(Number(n))))return null;
    const pre=m[4]?.split('.')||[];
    if(pre.some(n=>/^\d+$/.test(n)&&n!=='0'&&n.startsWith('0')))return null;
    return {core:m.slice(1,4).map(Number),pre};
  };
  const version = x => !!parseVersion(x);
  const compare = (a,b) => {
    const aa=parseVersion(a),bb=parseVersion(b);
    for(let i=0;i<3;i++)if(aa.core[i]!==bb.core[i])return aa.core[i]>bb.core[i]?1:-1;
    if(!aa.pre.length||!bb.pre.length)return aa.pre.length===bb.pre.length?0:aa.pre.length?-1:1;
    for(let i=0;i<Math.max(aa.pre.length,bb.pre.length);i++){
      const x=aa.pre[i],y=bb.pre[i];if(x===y)continue;if(x===undefined||y===undefined)return x===undefined?-1:1;
      const xn=/^\d+$/.test(x),yn=/^\d+$/.test(y);if(xn&&yn)return BigInt(x)>BigInt(y)?1:-1;if(xn!==yn)return xn?-1:1;return x>y?1:-1;
    }return 0;
  };
  const date = x => typeof x==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().replace('.000Z','Z')===x.replace('.000Z','Z');
  function validate(feed) {
    if(!exact(feed,['schemaVersion','generatedAt','releases']) || feed.schemaVersion!==1 || !date(feed.generatedAt) || !Array.isArray(feed.releases) || feed.releases.length>20) throw Error('Invalid release feed');
    const tags = new Set();
    for(const r of feed.releases) {
      if(!exact(r,['access','unsignedTest','status','version','tagName','publishedAt','prerelease','releaseUrl','notes','assets']) || r.status!=='complete' || r.access!=='repository-members' || r.unsignedTest!==true || !version(r.version) || r.tagName!=='v'+r.version || tags.has(r.tagName) || !date(r.publishedAt) || typeof r.prerelease!=='boolean' || (r.version.includes('-')&&!r.prerelease) || r.releaseUrl!==REPO+'/releases/tag/'+r.tagName || !exact(r.notes,['en','zh']) || !plain(r.notes.en,1200) || !plain(r.notes.zh,1200) || !Array.isArray(r.assets) || r.assets.length!==6) throw Error('Invalid release');
      tags.add(r.tagName);
      const names = new Set();
      for(const a of r.assets) {
        if(!exact(a,['name','platform','arch','format','sizeBytes','sha256','url']) || !plain(a.name,180) || !/^[A-Za-z0-9][A-Za-z0-9._-]+$/.test(a.name) || !a.name.includes(r.version) || !a.name.endsWith('.'+a.format) || names.has(a.name) || !Number.isSafeInteger(a.sizeBytes) || a.sizeBytes<=0 || a.sizeBytes>2147483648 || !/^[a-f0-9]{64}$/.test(a.sha256) || a.url!==REPO+'/releases/download/'+r.tagName+'/'+encodeURIComponent(a.name)) throw Error('Invalid release asset');
        names.add(a.name);
      }
      if(r.assets.map(a=>[a.platform,a.arch,a.format].join(':')).sort().join('|')!==expected.join('|')) throw Error('Incomplete platform matrix');
    }
    return [...feed.releases].sort((a,b)=>compare(b.version,a.version));
  }
  let current = null, locale = 'en';
  function render(next) {
    locale = next === 'zh-CN' ? 'zh-CN' : 'en';
    if(!current)return;
    const z=locale==='zh-CN',r=current,v=r.version;
    const set=(key,text)=>{document.querySelector('[data-i18n="'+key+'"]').textContent=text;};
    set('hero.access',z?`下载 v${v} →`:`Download v${v} →`);
    set('download.body',z?`v${v} 已提供 macOS、Windows 和 Linux 安装包。使用有仓库访问权限的 GitHub 账号下载，并核对发布页中的 SHA-256 校验值。`:`Version ${v} is available for macOS, Windows, and Linux. Sign in with repository access to download an installer and verify its SHA-256 checksums.`);
    for(const os of ['macOS','Windows','Linux'])set('target.'+os,`v${v} · `+(z?'需要仓库访问权限':'Repository access required'));
    const link=document.querySelector('[data-i18n="download.release"]');link.href=r.releaseUrl;link.textContent=z?`下载 v${v} ↗`:`Download v${v} ↗`;
    for(const a of r.assets){const link=document.querySelector('[data-release-asset="'+[a.platform,a.arch,a.format].join(':')+'"]');link.href=a.url;link.title='SHA-256: '+a.sha256;}
    const notes=document.querySelector('#release-notes');notes.hidden=false;
    document.querySelector('#release-notes-title').textContent=(z?'版本更新':'What’s new')+` · v${v}`+(r.prerelease?(z?' · 预发行':' · Pre-release'):'')+(z?' · 未签名测试版':' · Unsigned test build');
    document.querySelector('#release-notes-body').textContent=r.notes[z?'zh':'en'];
    if(compare(v,'0.2.0')>=0){set('extensions.eye',z?'扩展':'Extensions');set('extensions.preview',z?'v0.2.0 起提供插件、Skills 和 MCP 管理。':'Plugin, Skill, and MCP management is available from v0.2.0.');}
  }
  function accept(feed) {
    const candidate=validate(feed)[0];
    if(candidate && compare(candidate.version,current?current.version:'0.1.1')>=0){current=candidate;render(locale);}
  }
  async function load() {
    try {accept(JSON.parse(document.querySelector('#release-fallback').textContent));} catch {}

    const path=document.querySelector('meta[name="release-feed"]').content;
    const url=new URL(path,location.href);
    if(url.origin!==location.origin)return;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-cache',signal:controller.signal});
      if(!response.ok || Number(response.headers.get('content-length'))>LIMIT || !response.body)return;
      const reader=response.body.getReader();const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMIT){await reader.cancel();return;}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      accept(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))); 
    } catch {} finally {clearTimeout(timer);}
  }
  window.DSHReleaseFeed={validate,render,load};
})();

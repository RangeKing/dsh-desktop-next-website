import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('index.html','utf8').replace(/\s+/g, ' ');
const js=readFileSync('site.js','utf8');
const css=readFileSync('site.css','utf8');
const ctx={window:{}};vm.runInNewContext(readFileSync('site-locales.js','utf8'),ctx);
const zh=ctx.window.DSHWebsiteLocales['zh-CN'];
const keys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(x=>x[1]);
test('all content has complete Chinese translations with no unused entries',()=>{assert.equal(keys.length,new Set(keys).size);assert.deepEqual([...keys].sort(),Object.keys(zh).sort());for(const v of Object.values(zh))assert.ok(v.length>0)});
test('all local images scripts styles and anchor destinations exist',()=>{for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(url.startsWith('./')&&!url.startsWith('./?'))assert.ok(existsSync(url),url);if(url.startsWith('#'))assert.ok(html.includes(`id="${url.slice(1)}"`),url)}});
test('all external links are explicit approved destinations',()=>{for(const [,url] of html.matchAll(/href="(https:[^"]+)"/g))assert.ok(['https://github.com/RangeKing/dsh-desktop-next/releases/tag/v0.1.0','https://github.com/RangeKing/dsh-desktop-next-website','https://github.com/RangeKing/vibemeter-website','https://rangeking.github.io/dsh-desktop-next-website/'].includes(url),url)});
test('important access and technical details remain in context in both locales',()=>{assert.match(html,/Sign in with repository access/);assert.match(html,/installers are unsigned/);assert.match(html,/not notarized/);assert.match(html,/SHA-256/);assert.match(html,/rather than live model execution/);assert.match(html,/rather than an OS-encrypted keychain/);assert.match(zh['download.body'],/权限/);assert.match(zh['download.warning'],/未签名/);assert.match(zh['faq.demob'],/受控事件/)});
test('no outbound tracking APIs or inline execution sinks',()=>{for(const s of [html,js])assert.doesNotMatch(s,/fetch\(|XMLHttpRequest|sendBeacon|eval\(|innerHTML|googletagmanager|cloudflareinsights|releases\/download/);assert.doesNotMatch(html,/<script[^>]+src="https:/)});
test('walkthrough is opt-in and stoppable',()=>{assert.match(html,/id="tour-image" src="\.\/assets\/preferences.jpg"/);assert.match(js,/play\.addEventListener\('click'/);assert.match(js,/stop\.addEventListener\('click'/);assert.match(js,/prefers-reduced-motion/);assert.match(css,/prefers-reduced-motion:\s*reduce/)});
test('theme query and storage are handled defensively',()=>{const p=readFileSync('preferences.js','utf8');assert.match(p,/try/);assert.match(p,/catch/);assert.match(p,/queryTheme === 'light'/);assert.doesNotMatch(p,/i18nPending/);assert.match(js,/searchParams.delete\('theme'\)/)});
test('media allowlist excludes private content',()=>{assert.deepEqual(readdirSync('assets').sort(),['background.jpg','conversation.jpg','deepseek.svg','document.jpg','preferences.jpg','process-read.jpg','process-work.jpg','process-result.jpg','walkthrough.gif'].sort())});
test('only deploy job receives Pages write permission and official actions are pinned',()=>{const w=readFileSync('.github/workflows/pages.yml','utf8');assert.match(w,/permissions:\n  contents: read/);assert.match(w,/pages: write/);assert.match(w,/id-token: write/);assert.doesNotMatch(w,/secrets\.|contents: write|DISPATCH_TOKEN/);for(const [,sha]of w.matchAll(/uses: actions\/[\w-]+@([^\s]+)/g))assert.match(sha,/^[a-f0-9]{40}$/)});
test('all images have dimensions and meaningful alternatives',()=>{for(const [img]of html.matchAll(/<img\s[^>]+>/g)){assert.match(img,/alt=/);assert.match(img,/width="\d+"/);assert.match(img,/height="\d+"/)}});
function browserFixture({lang='en',theme='system',storageThrows=false}={}) {
  class Element {
    constructor(text=''){this.textContent=text;this.listeners={};this.attrs={};this.dataset={};this.disabled=false;}
    addEventListener(n,fn){this.listeners[n]=fn;}
    setAttribute(k,v){this.attrs[k]=v;}
    getAttribute(k){return this.attrs[k];}
  }
  const els=Object.fromEntries(['#language','#theme-toggle','#theme-label','#play-demo','#stop-demo','#tour-image','#process-image','#hero-image','#context-image','#document-image','#process-zoom','#process-full','meta[name="theme-color"]'].map(k=>[k,new Element()]));
  const translationNodes=[...html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)].map(m=>{const el=new Element(m[2]);el.dataset.i18n=m[1];return el});
  const steps=[0,1,2].map(i=>{const e=new Element();e.dataset.step=String(i);return e});
  const root={dataset:{initialLocale:lang,themePreference:theme},lang};
  const media={matches:false,listeners:{},addEventListener(n,fn){this.listeners[n]=fn}};
  const storage=new Map();const history=[];
  const context={window:ctx.window,document:{documentElement:root,querySelectorAll:q=>q==='[data-step]'?steps:translationNodes,querySelector:q=>els[q]},matchMedia:()=>media,URL,location:{href:'https://example.com/?theme=light'},history:{replaceState:(...v)=>history.push(v)},localStorage:{setItem:(k,v)=>{if(storageThrows)throw Error('denied');storage.set(k,v)}}};
  vm.runInNewContext(js,context);
  return {els,root,storage,history,context,media,steps};
}
test('runtime cycles themes, persists choice, and clears stale query override',()=>{const f=browserFixture();f.els['#theme-toggle'].listeners.click();assert.equal(f.root.dataset.theme,'light');f.els['#theme-toggle'].listeners.click();assert.equal(f.root.dataset.theme,'dark');assert.equal(f.storage.get('dsh-website-theme'),'dark');assert.ok(!String(f.history.at(-1)[2]).includes('theme='));f.els['#theme-toggle'].listeners.click();assert.equal(f.root.dataset.themePreference,'system')});
test('runtime translates on language changes and persists URL',()=>{const f=browserFixture();f.els['#language'].value='zh-CN';f.els['#language'].listeners.change();assert.equal(f.root.lang,'zh-CN');assert.match(f.context.document.title,/桌面/);assert.equal(f.els['#theme-label'].textContent,'自动');assert.match(String(f.history.at(-1)[2]),/lang=zh-CN/)});
test('runtime starts and stops walkthrough repeatedly',()=>{const f=browserFixture();for(let i=0;i<3;i++){f.els['#play-demo'].listeners.click();assert.equal(f.els['#tour-image'].src,'./assets/walkthrough.gif');assert.equal(f.els['#stop-demo'].disabled,false);f.els['#stop-demo'].listeners.click();assert.equal(f.els['#tour-image'].src,'./assets/preferences.jpg');assert.equal(f.els['#stop-demo'].disabled,true)}});
test('runtime remains interactive when storage is blocked',()=>{const f=browserFixture({storageThrows:true});assert.doesNotThrow(()=>f.els['#theme-toggle'].listeners.click());f.els['#language'].value='zh-CN';assert.doesNotThrow(()=>f.els['#language'].listeners.change());assert.equal(f.root.lang,'zh-CN')});
test('preference bootstrap rejects invalid stored theme without blanking content',()=>{const root={dataset:{}};vm.runInNewContext(readFileSync('preferences.js','utf8'),{URLSearchParams,location:{search:''},localStorage:{getItem:k=>k.endsWith('theme')?'invalid':'en'},window:{matchMedia:()=>({matches:false})},document:{documentElement:root},navigator:{languages:['en']}});assert.equal(root.dataset.theme,'light');assert.equal(root.dataset.themePreference,'system')});

test('task stages switch repeatedly, update full-size links and translate descriptions',()=>{const f=browserFixture();for(const i of [1,2,0,2]){f.steps[i].listeners.click();assert.equal(f.steps[i].attrs['aria-pressed'],'true');assert.equal(f.steps.filter(s=>s.attrs['aria-pressed']==='true').length,1);assert.equal(f.els['#process-zoom'].href,f.els['#process-image'].src);assert.equal(f.els['#process-full'].href,f.els['#process-image'].src);}f.els['#language'].value='zh-CN';f.els['#language'].listeners.change();assert.match(f.els['#process-image'].alt,/审阅交付/)});

test('hero leads with product value and routes to the task story',()=>{const hero=html.match(/<section class="hero">(.*?)<section id="features">/)[1];assert.doesNotMatch(hero,/No public|not |never |unsigned|404/);assert.match(hero,/data-i18n="hero.cta" href="#process"/);assert.match(zh['hero.body'],/研究资料/);assert.doesNotMatch(zh['hero.body'],/不|未|暂无/)});
test('task story is static by default and provenance is published by the build',()=>{assert.match(html,/id="process-image" src=".\/assets\/process-read.jpg"/);assert.match(html,/href=".\/MEDIA.md"/);assert.match(readFileSync('scripts/build.mjs','utf8'),/'MEDIA.md'/);assert.match(readFileSync('MEDIA.md','utf8'),/controlled demonstration events/);assert.equal((html.match(/data-step="/g)||[]).length,3)});

test('product image alternatives follow language changes during walkthrough playback',()=>{const f=browserFixture();f.els['#play-demo'].listeners.click();f.els['#language'].value='zh-CN';f.els['#language'].listeners.change();assert.match(f.els['#tour-image'].alt,/剪辑/);assert.match(f.els['#hero-image'].alt,/实际桌面/);f.els['#stop-demo'].listeners.click();assert.match(f.els['#tour-image'].alt,/偏好设置/)});

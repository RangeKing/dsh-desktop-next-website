import vm from 'node:vm';
import {rmSync, mkdirSync, copyFileSync, cpSync, readFileSync, writeFileSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const file of ['index.html','site.css','site.js','release-feed.js','site-locales.js','preferences.js','MEDIA.md','.nojekyll']) copyFileSync(file,`dist/${file}`);
cpSync('assets','dist/assets',{recursive:true});
console.log('Built allowlisted static website in dist/');

mkdirSync('dist/data');copyFileSync('data/releases.json','dist/data/releases.json');

const feed=JSON.parse(readFileSync('data/releases.json','utf8'));
const feedContext={window:{}};vm.runInNewContext(readFileSync('release-feed.js','utf8'),feedContext);feedContext.window.DSHReleaseFeed.validate(feed);
const index=readFileSync('dist/index.html','utf8').replace(/(<script type="application\/json" id="release-fallback">)[\s\S]*?(<\/script>)/, (_,a,b)=>a+JSON.stringify(feed).replace(/</g,'\\u003c')+b);
writeFileSync('dist/index.html',index);

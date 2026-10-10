import {rmSync, mkdirSync, copyFileSync, cpSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const file of ['index.html','site.css','site.js','site-locales.js','preferences.js','MEDIA.md','.nojekyll']) copyFileSync(file,`dist/${file}`);
cpSync('assets','dist/assets',{recursive:true});
console.log('Built allowlisted static website in dist/');

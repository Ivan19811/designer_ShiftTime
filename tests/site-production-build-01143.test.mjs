import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductionFiles01143,outputPathForRoute01143} from '../src/site-production-build-01143.mjs';

test('01143 production routes become Netlify directory index files',()=>{
  assert.equal(outputPathForRoute01143('/'),'index.html');
  assert.equal(outputPathForRoute01143('/about'),'about/index.html');
  assert.equal(outputPathForRoute01143('catalog/'),'catalog/index.html');
  assert.equal(outputPathForRoute01143('/products/item?x=1#top'),'products/item/index.html');
});

test('01143 production build emits canonical standalone pages, assets and API proxy',()=>{
  const files=buildProductionFiles01143({
    version:'01143',
    revision:'rev_abc',
    site:{id:'site_1',name:'Мій сайт',description:'Опис'},
    pages:[
      {id:'page_home',path:'/',title:'Головна',pageMode:'standard',html:{header:'<header>H</header>',main:'<section contenteditable="true"><span class="st-resize">x</span><h1>Home</h1></section>',footer:'<footer>F</footer>'}},
      {id:'page_about',path:'/about',title:'Про нас',pageMode:'standard',html:{header:'<header>H2</header>',main:'<main>About</main>',footer:'<footer>F2</footer>'}},
    ],
    assets:[
      {path:'css/site.css',content:'body{margin:0}'},
      {path:'assets/site-runtime-01143.js',content:'document.body.dataset.runtime="01143";'},
      {path:'assets/photo.bin',content:Buffer.from([0,1,2,255]).toString('base64'),encoding:'base64'},
    ],
  },{
    canonicalBaseUrl:'https://demo-site.netlify.app',
    apiProxyTarget:'https://designer-shifttime.onrender.com',
  });

  assert.ok(files instanceof Map);
  assert.equal(files.get('css/site.css').toString(),'body{margin:0}');
  assert.equal(files.get('assets/site-runtime-01143.js').toString(),'document.body.dataset.runtime="01143";');
  assert.deepEqual([...files.get('assets/photo.bin')],[0,1,2,255]);
  const home=files.get('index.html').toString();
  const about=files.get('about/index.html').toString();
  assert.match(home,/<link rel="canonical" href="https:\/\/demo-site\.netlify\.app\/">/);
  assert.match(about,/<link rel="canonical" href="https:\/\/demo-site\.netlify\.app\/about">/);
  assert.match(home,/css\/site\.css/);
  assert.match(home,/assets\/site-runtime-01143\.js/);
  assert.match(home,/<h1>Home<\/h1>/);
  assert.doesNotMatch(home,/contenteditable|st-resize/);
  assert.doesNotMatch(home,/builder__|site-manager|Inspector/i);
  assert.equal(files.get('_redirects').toString().trim(),'/api/* https://designer-shifttime.onrender.com/api/:splat 200');
});

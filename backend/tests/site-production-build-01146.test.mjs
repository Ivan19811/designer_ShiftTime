import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';

test('01146 production build rewrites page navigation to real routes and preserves unmatched in-page anchors',()=>{
  const nav='<nav><a href="#">Головна</a><a href="#about">Про нас</a><a href="#contacts">Контакти</a><a href="#catalog">Каталог</a></nav>';
  const files=buildProductionFiles01143({
    version:'01143',revision:'rev_nav',site:{id:'site_1',name:'Demo'},assets:[],
    pages:[
      {id:'home',path:'/',title:'Головна',html:{header:nav,main:'<section>Home</section>',footer:''}},
      {id:'about',path:'/about-us',title:'Про нас',html:{header:nav,main:'<section>About</section>',footer:''}},
      {id:'contacts',path:'/contacts',title:'Контакти',html:{header:nav,main:'<section>Contacts</section>',footer:''}},
    ],
  },{canonicalBaseUrl:'https://demo.netlify.app'});
  const home=files.get('index.html').toString();
  assert.match(home,/href="\/"[^>]*>Головна/);
  assert.match(home,/href="\/about-us"[^>]*>Про нас/);
  assert.match(home,/href="\/contacts"[^>]*>Контакти/);
  assert.match(home,/href="#catalog"[^>]*>Каталог/);
});

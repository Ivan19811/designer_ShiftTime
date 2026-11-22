import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSiteTestProjects01614B} from '../src/site-test-compare-01614b.mjs';
const make=(text)=>({site:{id:'site_a',pages:[{id:'home',title:'Головна'}]},storage:{pageSnapshots:{'site_a:home':{siteFrameMain01040:{rootIds:['r'],nodes:{r:{content:{text}}}}}}}});
test('01614B1: shows actual before and after text from saved Main',()=>{
 const d=compareSiteTestProjects01614B(make('СКОВОРІДКИ'),make('СКОВОРІДКИ ТЕСТОВА — Копія'));
 assert.equal(d.changedPages,1);
 assert.deepEqual(d.pageChanges[0].textChanges,[{before:'СКОВОРІДКИ',after:'СКОВОРІДКИ ТЕСТОВА — Копія',nodeId:'r'}]);
});
test('01614B1: unchanged and non-visual source data never enter diff output',()=>{
 const original=make('OK');const edited=structuredClone(original);edited.orders=[{email:'private@example.org'}];
 const d=compareSiteTestProjects01614B(original,edited);
 assert.equal(d.hasChanges,false);assert.equal(JSON.stringify(d).includes('private@example.org'),false);
});
test('01614B1: text snippets bounded even for very large blocks',()=>{
 const d=compareSiteTestProjects01614B(make('X'.repeat(2000)),make('Y'.repeat(2000)));
 assert.equal(d.pageChanges[0].textChanges[0].before.length,220);
 assert.equal(d.pageChanges[0].textChanges[0].after.length,220);
});

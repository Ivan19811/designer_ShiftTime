import test from 'node:test';
import assert from 'node:assert/strict';
import {composeSafeSiteTestApply01616} from '../src/site-test-conflict-01616.mjs';
const sid='two-manager-x',key=`${sid}:page_home`;
const source=()=>({site:{id:sid,name:'Original',pages:[{id:'page_home',title:'Головна'}]},storage:{pageSnapshots:{[key]:{siteFrameMain01040:{rootIds:['hero'],nodes:{hero:{content:{text:'СКОВОРІДКИ',subtitle:'Original'},style:{color:'white'}}}}}},shoppingCart:{orders:['original']}}});
const edited=(text)=>{const next=source();next.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text=text;return next;};
const plan=(baseline,current,approved)=>composeSafeSiteTestApply01616({baseline,current,approved,siteId:sid,selection:{pages:['page_home']}});
test('01619X managers A and B: concurrent edits of same title cannot silently overwrite first owner-approved edit',()=>{
 const a=edited('СКОВОРІДКИ-МЕНЕДЖЕР-А'),b=edited('СКОВОРІДКИ-МЕНЕДЖЕР-Б');
 const out=plan(source(),a,b);
 assert.equal(out.status,'conflict');assert.equal(out.canApply,false);assert.equal(out.project,undefined);
 assert.ok(out.conflicts.some(x=>x.path.includes('content.text')));
 assert.equal(a.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.content.text,'СКОВОРІДКИ-МЕНЕДЖЕР-А');
});
test('01619X managers: independent later style edit can merge without altering unselected data',()=>{
 const a=source();a.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero.style.color='blue';
 const b=edited('СКОВОРІДКИ-МЕНЕДЖЕР-Б');b.storage.shoppingCart.orders=['manager-forgery'];
 const out=plan(source(),a,b);assert.equal(out.status,'ready');
 const hero=out.project.storage.pageSnapshots[key].siteFrameMain01040.nodes.hero;
 assert.equal(hero.style.color,'blue');assert.equal(hero.content.text,'СКОВОРІДКИ-МЕНЕДЖЕР-Б');
 assert.deepEqual(out.project.storage.shoppingCart,{orders:['original']});
});

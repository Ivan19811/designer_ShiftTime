import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSiteTestProjects01614B} from '../src/site-test-compare-01614b.mjs';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
const project=()=>({site:{id:'site_1',pages:[{id:'home',title:'Головна'},{id:'about',title:'Про нас'}]},storage:{pageSnapshots:{'site_1:home':{siteFrameMain01040:{rootIds:['root'],nodes:{root:{content:'OLD'}}}}},headerState:{global:{html:'<header>OLD</header>'}},footerState:{global:{html:'<footer>OLD</footer>'}},globalStyleStore:{}}});
test('01614B compare only visual server snapshots, no product/order scope',()=>{
 const original=project(),draft=structuredClone(original);
 draft.storage.pageSnapshots['site_1:home'].siteFrameMain01040.nodes.root.content='NEW';
 draft.storage.headerState.global.html='<header>NEW</header>';
 draft.site.pages.push({id:'contact',title:'Контакти'});
 draft.marketplace={orders:[{id:'x'}]};
 const d=compareSiteTestProjects01614B(original,draft);
 assert.equal(d.changedPages,2);assert.equal(d.headerChanged,true);assert.equal(d.footerChanged,false);
 assert.equal(d.pageChanges.find(x=>x.pageId==='home').mainChanged,true);
 assert.equal(d.pageChanges.find(x=>x.pageId==='contact').added,true);
 const onlyShop=structuredClone(original);onlyShop.marketplace={orders:[{id:'x'}]};
 assert.equal(compareSiteTestProjects01614B(original,onlyShop).hasChanges,false);
});
test('01614B Netlify non-draft response cannot cause any upload to original site',async()=>{
 const calls=[],client=createNetlifyClient01143({token:'mock',recordTraffic:()=>{},fetchImpl:async(url,options)=>{
   calls.push({url,method:options.method,body:options.body});
   if(options.method==='POST')return {ok:true,status:201,text:async()=>JSON.stringify({id:'dep_42',draft:false,required:['sha']})};
   if(options.method==='GET')return {ok:true,status:200,text:async()=>JSON.stringify({id:'dep_42',draft:false,site_id:'original'})};
   throw new Error('unsafe upload attempted');
 }});
 await assert.rejects(()=>client.deployFiles({siteId:'original',files:new Map([['index.html','<h1>test</h1>']]),draft:true}),{code:'ST_TEST_NETLIFY_NOT_DRAFT_01613D'});
 assert.equal(calls.some(x=>x.method==='PUT'),false);
});
test('01614B comparison requires read access to precise site',()=>{
 const out=classifyProtectedAction01600('GET',['api','v1','sites','site_1','test','branch_1','compare']);
 assert.equal(out.permission,'site.pages.view');assert.equal(out.siteId,'site_1');
});
test('01614B isolated preview deploys never target the production Netlify site',async()=>{
 const {readFileSync}=await import('node:fs');
 const code=readFileSync(new URL('../src/site-test-workflow-01613d.mjs',import.meta.url),'utf8');
 assert.match(code,/createSiteWithSafeName/);
 assert.match(code,/siteId:isolatedId,files:previewModeFiles01613D\(isolatedFiles\),draft:false/);
 assert.doesNotMatch(code,/netlify\.deployFiles\(\{siteId:entry\.site\.netlify_site_id/);
 assert.match(code,/const candidateId=null/);
 assert.match(code,/preview_netlify_site_id/);
 assert.match(code,/ST_TEST_CANDIDATE_NOT_READY_01613D/);
});

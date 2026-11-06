import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSiteTestShell01614A,saveSiteTestShell01614A} from '../src/site-test-shell-01614a.mjs';
import {draftFingerprint01606G} from '../src/site-canvas-draft-service-01606g.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const original=()=>({version:'01170',site:{id:'site_1',name:'ORIGINAL',pages:[{id:'page_home',title:'Головна'}],settings:{live:true}},storage:{
 pageSnapshots:{'site_1:page_home':{siteFrameMain01040:{rootIds:['root'],nodes:{root:{content:'Main content'}}}}},
 headerState:{global:{html:'<header>old</header>'},pages:{}},footerState:{global:{html:'<footer>old</footer>'},pages:{}},
 headerPageModes:{},footerPageModes:{},headerGlobalMode:'global',footerGlobalMode:'global',headerHidden:'false',footerHidden:'false',
 headerTemplateIds:['h1'],footerTemplateIds:['f1'],globalStyleStore:{color:'red'}}});
const scope={accountId:'a',workspaceId:'w',storeId:'s',role:'manager'};
function dbHarness(before,branch={state:'editing',author_user_id:'alice',revision_kind:'draft',id:'branch_1'}){
 const queries=[];let draft=structuredClone(before),state=branch.state;
 return {queries,get draft(){return draft;},get state(){return state;},run:async(fn)=>fn({query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(/SELECT b\.\*,r\.kind revision_kind/.test(sql))return {rowCount:1,rows:[{...branch,state,project_json:structuredClone(draft)}]};
  if(/UPDATE shifttime_builder_site_revisions/.test(sql)){draft=JSON.parse(args[0]);return {rowCount:1,rows:[{id:'rev_1'}]};}
  if(/UPDATE shifttime_site_test_branches/.test(sql)){state='editing';return {rowCount:1};}
  return {rowCount:1,rows:[]};
 }})};
}
test('01614A: Header/Footer update is scoped to one owned draft and preserves Main, site and shop',async()=>{
 const base=original(),db=dbHarness(base,{state:'preview',author_user_id:'alice',revision_kind:'draft',id:'b1'});
 const shell={headerState:{global:{html:'<header>new</header>'},pages:{}},footerState:{global:{html:'<footer>new</footer>'},pages:{}}};
 const ack=await saveSiteTestShell01614A(scope,'alice','site_1','rev_1',{expectedFingerprint:draftFingerprint01606G(base),shell},{run:db.run});
 assert.equal(ack.saved,true);assert.equal(ack.fingerprint,draftFingerprint01606G(db.draft));
 assert.equal(db.draft.storage.headerState.global.html,'<header>new</header>');
 assert.equal(db.draft.storage.footerState.global.html,'<footer>new</footer>');
 assert.deepEqual(db.draft.site,base.site);assert.deepEqual(db.draft.storage.pageSnapshots,base.storage.pageSnapshots);
 assert.deepEqual(db.draft.storage.globalStyleStore,base.storage.globalStyleStore);
 assert.equal(db.state,'editing');assert.equal(db.queries.some(x=>/shifttime_builder_site_projects|shifttime_published_sites/.test(x.sql)),false);
});
test('01614A: refuses foreign author and submitted test without any write',async()=>{
 const base=original();for(const {user,branch,code} of [
  {user:'mallory',branch:{state:'editing',author_user_id:'alice',revision_kind:'draft',id:'b'},code:'ST_TEST_AUTHOR_REQUIRED_01613D'},
  {user:'alice',branch:{state:'in_review',author_user_id:'alice',revision_kind:'draft',id:'b'},code:'ST_TEST_DRAFT_LOCKED_01614A'}]){
  const db=dbHarness(base,branch);await assert.rejects(()=>saveSiteTestShell01614A(scope,user,'site_1','rev_1',{
   expectedFingerprint:draftFingerprint01606G(base),shell:{headerHidden:'true'}},{run:db.run}),{code});
  assert.equal(db.queries.some(x=>/^\s*UPDATE/.test(x.sql)),false);
 }
});
test('01614A: rejects stale fingerprint, payload injection and unrelated site changes',async()=>{
 const base=original();const fp=draftFingerprint01606G(base),db=dbHarness(base);
 await assert.rejects(()=>saveSiteTestShell01614A(scope,'alice','site_1','rev_1',{expectedFingerprint:'0'.repeat(64),shell:{headerHidden:'true'}},{run:db.run}),{code:'ST_TEST_DRAFT_CONFLICT_01614A'});
 for(const shell of [
  {pageSnapshots:{}}, {headerState:{global:{html:'<header>x</header>'},pages:{other:{html:'a'}}}},
  {footerState:{global:{html:'<script>alert(1)</script>'},pages:{}}},
  {footerTemplateIds:['javascript:alert(1)']},
  {headerState:{global:{html:'<div onclick="evil()">x</div>'},pages:{}}}
 ])await assert.rejects(()=>saveSiteTestShell01614A(scope,'alice','site_1','rev_1',{expectedFingerprint:fp,shell},{run:db.run}));
 assert.equal(db.queries.some(x=>/^\s*UPDATE/.test(x.sql)),false);
});
test('01614A: route has exact tenant site edit gate; unknown mutations denied',()=>{
 const parts=['api','v1','sites','site_1','revisions','rev_1','test-shell'];
 assert.equal(classifyProtectedAction01600('POST',parts).permission,'site.pages.edit');
 assert.equal(assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'custom',permissions:['api.mode.site_actions','site.pages.edit']},'POST',parts),true);
 assert.throws(()=>assertOnlineSiteAccess01613B(scope,{allowed:true,mode:'custom',permissions:['api.mode.site_actions']},'POST',parts),{statusCode:403});
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(server,/saveSiteTestShell01614A\(scope,session\.userId/);
});

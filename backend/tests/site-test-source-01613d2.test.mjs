import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectOriginalProject01613D2,chooseOriginalSource01613D2} from '../src/site-test-source-01613d2.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const project=(id,root='main',page='page_home')=>({version:'01170',site:{id,pages:[{id:page,title:'Головна'}]},storage:{pageSnapshots:{[`${id}:${page}`]:{siteFrameMain01040:{rootIds:[root]}}}}});
test('01613D2 published snapshot outranks stale cloud project',()=>{
 const published=project('site_123','new-hero'),cloud=project('site_123','old-section');
 const chosen=chooseOriginalSource01613D2({siteProject:cloud,publishedProject:published,siteId:'site_123',publishedRevisionId:'rev_official'});
 assert.equal(chosen.project,published);assert.equal(chosen.sourceKind,'published');assert.equal(chosen.sourceRevisionId,'rev_official');
});
test('01613D2 refuses metadata-only, blank and wrong-site sources',()=>{
 assert.equal(inspectOriginalProject01613D2({site:{id:'x',pages:[{id:'page_home'}]}},'x').valid,false);
 assert.equal(chooseOriginalSource01613D2({siteProject:project('other'),siteId:'target'}),null);
});
test('01613D2 fallback is explicitly marked unverified',()=>{
 const out=chooseOriginalSource01613D2({siteProject:project('site_123'),siteId:'site_123'});
 assert.equal(out.sourceKind,'cloud_unverified');assert.equal(out.summary.authoredPageCount,1);
});
test('01613D2 delegated reset requires precise editing permission, no production right',()=>{
 const parts=['api','v1','sites','site_123','test','sttest_1','reset'];
 assert.equal(classifyProtectedAction01600('POST',parts).permission,'site.pages.edit');
 assert.equal(assertOnlineSiteAccess01613B({role:'manager'},{allowed:true,mode:'custom',permissions:['api.mode.site_actions','site.pages.edit']},'POST',parts),true);
 assert.throws(()=>assertOnlineSiteAccess01613B({role:'manager'},{allowed:true,mode:'custom',permissions:['site.pages.view']},'POST',parts));
});

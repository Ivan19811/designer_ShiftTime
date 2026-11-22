import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertTestActor01613D,assertProductionUnchanged01613D,assertDraftDeploy01613D,previewModeFiles01613D,projectSha01613D,previewPermalink01613D} from '../src/site-test-core-01613d.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';
const parts=s=>['api','v1',...s.split('/')];
const manager={role:'manager'},owner={role:'owner'};
const editGrant={allowed:true,mode:'custom',permission:'site.pages.edit',permissions:['api.mode.site_actions','site.pages.edit']};
const deny=(f,c)=>assert.throws(f,e=>e.statusCode===403&&e.code===c);

test('01613D canonical project hashes independent of object key order',()=>{
 assert.equal(projectSha01613D({site:{id:'site_1',pages:[{name:'Main',id:'main'}]},version:'01170'}),projectSha01613D({version:'01170',site:{pages:[{id:'main',name:'Main'}],id:'site_1'}}));
 assert.notEqual(projectSha01613D({site:{pages:[1]}}),projectSha01613D({site:{pages:[2]}}));
});
test('01613D only manager who authored copy can edit it',()=>{
 const row={author_user_id:'user_a',state:'editing'};
 assert.equal(assertTestActor01613D(manager,'user_a',row,{write:true}),true);
 deny(()=>assertTestActor01613D(manager,'user_b',row,{write:true}),'ST_TEST_AUTHOR_REQUIRED_01613D');
 deny(()=>assertTestActor01613D(owner,'user_b',row,{write:true}),'ST_TEST_AUTHOR_REQUIRED_01613D');
 assert.throws(()=>assertTestActor01613D(manager,'user_a',{...row,state:'published'},{write:true}),{code:'ST_TEST_ALREADY_PUBLISHED_01613D'});
 deny(()=>assertTestActor01613D(manager,'user_a',row,{promote:true}),'ST_TEST_OWNER_REQUIRED_01613D');
});
test('01613D owner promotion rejects changed main revision',()=>{
 assert.equal(assertProductionUnchanged01613D(4,4),true);
 assert.throws(()=>assertProductionUnchanged01613D(4,5),{code:'ST_TEST_ORIGINAL_CHANGED_01613D',statusCode:409});
});
test('01613D safely prepared visual preview blocks outbound browser APIs and form submits',()=>{
 const source=new Map([['index.html','<!doctype html><html><head><title>Demo</title></head><body><form action="/orders"></form></body></html>'],['page.html',Buffer.from('<head><title>Page</title></head>')]]);
 const safe=previewModeFiles01613D(source);
 assert.match(safe.get('index.html'),/connect-src 'none'/);
 assert.match(safe.get('index.html'),/form-action 'none'/);
 assert.match(safe.get('page.html'),/connect-src 'none'/);
 assert.match(safe.get('_headers'),/noindex, nofollow/);
 assert.ok(safe.get('robots.txt').includes('Disallow: /'));
 assert.equal(source.has('_headers'),false);
 assert.doesNotMatch(source.get('index.html'),/Content-Security-Policy/);
});
test('01613D refuses non-draft deploy and preview urls without HTTPS',()=>{
 assert.equal(assertDraftDeploy01613D({id:'dep',draft:true}).id,'dep');
 assert.throws(()=>assertDraftDeploy01613D({id:'dep',draft:false}),{code:'ST_TEST_NETLIFY_NOT_DRAFT_01613D'});
 assert.equal(previewPermalink01613D({deploy_ssl_url:'https://demo--site.netlify.app'}),'https://demo--site.netlify.app');
 assert.throws(()=>previewPermalink01613D({deploy_url:'http://bad.example'}),{code:'ST_TEST_PREVIEW_LINK_MISSING_01613D'});
});
test('01613D delegated test routes do not permit publish or promotion; owner route allowed',()=>{
 for(const action of ['preview','submit']){
  assert.equal(classifyProtectedAction01600('POST',parts('sites/site_1/test/test_1/'+action)).permission,'site.pages.edit');
  assert.equal(assertOnlineSiteAccess01613B(manager,editGrant,'POST',parts('sites/site_1/test/test_1/'+action)),true);
 }
 assert.equal(assertOnlineSiteAccess01613B(manager,editGrant,'POST',parts('sites/site_1/test')),true);
 deny(()=>assertOnlineSiteAccess01613B(manager,editGrant,'POST',parts('sites/site_1/test/test_1/promote')),'ST_TEST_ACTION_DENIED_01613D');
 deny(()=>assertOnlineSiteAccess01613B(manager,editGrant,'POST',parts('sites/site_1/publish')),'ST_ONLINE_SITE_OWNER_APPROVAL_REQUIRED_01613B');
 deny(()=>assertOnlineSiteAccess01613B(manager,editGrant,'DELETE',parts('sites/site_1')),'ST_ONLINE_SITE_OWNER_APPROVAL_REQUIRED_01613B');
 assert.equal(assertOnlineSiteAccess01613B(owner,{allowed:true,mode:'owner'},'POST',parts('sites/site_1/test/test_1/promote')),true);
});
test('01613D Netlify API emits explicit draft and exact site deploy restore endpoint',async()=>{
 const requests=[];
 const fetchImpl=async(u,opt)=>{
  requests.push({url:u,...opt});
  if(u.includes('/deploys')&&opt.method==='POST'&&!u.endsWith('restore'))return {ok:true,status:201,text:async()=>JSON.stringify({id:'dep_1',draft:true,deploy_ssl_url:'https://dep--site.netlify.app',required:[]})};
  if(u.endsWith('/restore'))return {ok:true,status:200,text:async()=>JSON.stringify({id:'dep_1',state:'ready'})};
  return {ok:false,status:404,text:async()=>'{"message":"not found"}'};
 };
 const client=createNetlifyClient01143({token:'test-token',fetchImpl});
 const deploy=await client.deployFiles({siteId:'site_1',files:new Map([['index.html','<h1>Hello</h1>']]),draft:true});
 assert.equal(deploy.draft,true);
 assert.equal(JSON.parse(requests[0].body).draft,true);
 assert.deepEqual(Object.keys(JSON.parse(requests[0].body).files),['/index.html']);
 await client.restoreSiteDeploy({siteId:'site_1',deployId:'dep_1'});
 assert.match(requests[1].url,/\/sites\/site_1\/deploys\/dep_1\/restore$/);
 assert.equal(requests[1].method,'POST');
});
test('01613D main-project and draft writes are separately guarded in routes',()=>{
 const src=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const service=readFileSync(new URL('../src/site-test-workflow-01613d.mjs',import.meta.url),'utf8');
 assert.ok(src.indexOf('assertNoOriginalWrite01613D(scope,p,req.method)')<src.indexOf("if(p[2]==='sites'&&p[3]&&p[4]==='publish'&&req.method==='POST'"));
 assert.match(src,/requireSiteTestRevisionAccess01613D\(scope,session\.userId/);
 assert.match(service,/state='processing'/);
 assert.match(service,/ST_TEST_PROMOTION_DISABLED_01615A/);
 assert.doesNotMatch(service,/netlify\.restoreSiteDeploy\(/);
 assert.match(service,/assertApprovedForApply01615B/);
});

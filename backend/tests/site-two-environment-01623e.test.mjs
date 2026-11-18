import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
const pkg={version:'01143',exporterVersion:'01151',site:{id:'site_1',name:'Відпочинок',slug:'vidpochynok'},revision:'rev_1',preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',ok:true}]}};
function repo(){let r=null;return {async get(){return r},async saveIdentity(_s,d){r={...d,lastDeployState:'not-published'};return r},async recordDeploy(_s,d){r={...r,lastDeployId:d.netlifyDeployId,lastDeployState:d.state,requestedRevision:d.revision};return r},async updateDeploy(_s,d){r={...r,lastDeployState:d.state,publishedRevision:d.publishedRevision||r?.publishedRevision,lastPublishedAt:d.publishedAt||r?.lastPublishedAt};return r}};}
function netlify(){let count=0;const uploads=[];return {uploads,async createSiteWithSafeName({preferredName}){count++;return {id:`np_${count}`,name:preferredName,url:`https://${preferredName}.netlify.app`,ssl_url:`https://${preferredName}.netlify.app`}},async deployFiles({siteId,files}){uploads.push({siteId,files});return {id:`dep_${uploads.length}`,state:'uploading'}},async getDeploy(){return {state:'ready'}},async getSiteFile(){return {}}};}
test('01623E: separate identities and URLs on demo + live',async()=>{
 const n=netlify(),dRepo=repo(),pRepo=repo();const files=()=>new Map([['index.html',Buffer.from('<html><head></head><body><main>Привіт</main></body></html>')]]);
 const d=createSitePublishingService01143({repo:dRepo,netlify:n,buildFiles:files,createZip:()=>Buffer.alloc(0),environment:'demo'});
 const p=createSitePublishingService01143({repo:pRepo,netlify:n,buildFiles:files,createZip:()=>Buffer.alloc(0)});
 const demo=await d.publish(scope,'user_1','site_1',pkg);
 assert.equal(demo.netlifySiteId,'np_1');assert.match(demo.url,/demo-vidpochynok/);
 assert.equal(await pRepo.get(),null,'Live is not touched by DEMO');
 const upload=n.uploads[0].files;
 assert.match(upload.get('robots.txt').toString('utf8'),/Disallow: \/\n/);
 assert.match(upload.get('index.html').toString('utf8'),/noindex,nofollow,noarchive/);
 assert.match(upload.get('index.html').toString('utf8'),/ДЕМО · ТЕСТОВИЙ САЙТ/);
 const ready=await d.status(scope,'site_1');assert.equal(ready.publishedRevision,'rev_1');
 const demoAgain=await d.publish(scope,'user_1','site_1',{...pkg,revision:'rev_2'});
 assert.equal(demoAgain.netlifySiteId,'np_1','Same DEMO project reused');
 assert.equal(await pRepo.get(),null,'Even repeated DEMO does not publish production');
 const live=await p.publish(scope,'user_1','site_1',pkg);
 assert.equal(live.netlifySiteId,'np_2');assert.match(live.url,/vidpochynok.netlify.app/);
 assert.equal(n.uploads.at(-1).files.has('robots.txt'),false,'Live does not inherit DEMO robots rules');
 assert.doesNotMatch(n.uploads.at(-1).files.get('index.html').toString(),/ДЕМО · ТЕСТОВИЙ САЙТ/);
 assert.equal((await dRepo.get()).netlifySiteId,'np_1');
 assert.equal((await pRepo.get()).netlifySiteId,'np_2');
});
test('01623E: protected site-scoped server routes',()=>{
 assert.deepEqual(classifyProtectedAction01600('POST',['api','v1','sites','site_1','demo-publish']),{permission:'site.publish.execute',siteId:'site_1',legacy:'write'});
 assert.deepEqual(classifyProtectedAction01600('GET',['api','v1','sites','site_1','demo-publish-status']),{permission:'site.pages.view',siteId:'site_1',legacy:'read'});
 assert.equal(classifyProtectedAction01600('GET',['api','v1','sites','site_1','demo-publish']),null);
});

test('01623E: deletes demo Netlify identity before production on permanent site deletion',async()=>{
 const {createBuilderSitesService01170}=await import('../src/builder-sites-core-01170.mjs');
 const calls=[];
 const service=createBuilderSitesService01170({repo:{
   async getDeleteTarget(){return {id:'site_1',netlifyDemoSiteId:'netlify_demo',netlifySiteId:'netlify_live'}},
   async remove(){calls.push('db:delete');return true}
 },netlify:{async deleteSite({siteId}){calls.push('netlify:'+siteId);return {deleted:true}}}});
 await service.delete(scope,'user_1','site_1');
 assert.deepEqual(calls,['netlify:netlify_demo','netlify:netlify_live','db:delete']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyLegacyReadAction01605E} from '../src/access-audit-core-01605e.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {listSiteRevisions01231} from '../src/site-revisions-01231.mjs';
const p=(s)=>('/api/v1/'+s).split('/').filter(Boolean);
const action=(m,s)=>classifyLegacyReadAction01605E(m,p(s));
const scope={accountId:'acct_A',workspaceId:'ws_A',storeId:'store_A',role:'viewer'};
const actor='usr_'+'c'.repeat(24);
test('01605E site revision index is a protected site-list read, not an open legacy GET',()=>{
 const a=action('GET','site-revisions');
 assert.equal(a.permission,'site.pages.view');assert.equal(a.siteList,true);assert.equal(a.legacy,'read');
});
test('01605E snapshot export requires exact product-view permission',()=>{
 assert.equal(action('GET','marketplace/snapshot/export').permission,'shop.products.view');
 assert.equal(action('GET','marketplace/snapshot/export').legacy,'read');
});
test('01605E exact routes only: no wildcard overmatch, no public checkout or mutation',()=>{
 for(const [m,path] of [['POST','site-revisions'],['GET','site-revisions/extra'],['GET','marketplace/snapshot/export/extra'],['GET','marketplace/snapshot'],['POST','marketplace/snapshot/export'],['GET','public/site-revisions'],['GET','public/marketplace/snapshot/export']])assert.equal(action(m,path),null,path);
});
test('01605E custom role limited to site A receives only permitted site IDs',async()=>{
 const calls=[];
 const run=async fn=>fn({query:async(sql,params)=>{
   calls.push({sql,params});
   if(sql.includes('FROM platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
   if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:1,rows:[{permissions:['site.pages.view'],scopeKind:'site',siteId:'site_A'}]};
   throw Error('UNEXPECTED_DB_QUERY');
 }});
 const result=await inspectProtectedAccess01600(scope,actor,action('GET','site-revisions'),{run});
 assert.deepEqual(result.allowedSiteIds,['site_A']);
 assert.equal(result.mode,'custom');
 assert.match(calls.at(-1).sql,/a\.store_id=\$3/);
});
test('01605E custom user without site or store view is refused before query',async()=>{
 const run=async fn=>fn({query:async(sql)=>sql.includes('platform_access_enrollments_01600')?{rowCount:1,rows:[{mode:'custom'}]}:{rowCount:0,rows:[]}});
 await assert.rejects(()=>inspectProtectedAccess01600(scope,actor,action('GET','site-revisions'),{run}),{statusCode:403});
});
test('01605E site-list SQL filters to allowed IDs with scoped account/workspace/store',async()=>{
 let sql='',params=[];
 const revisions=await listSiteRevisions01231(scope,'',['site_A','site_B','site_A'],async fn=>fn({query:async(s,p)=>{sql=s;params=p;return {rows:[{id:'rev_1',site_id:'site_A',kind:'draft',slot:1}]};}}));
 assert.equal(revisions.length,1);
 assert.match(sql,/s\.account_id=\$1 AND s\.workspace_id=\$2 AND s\.store_id=\$3/);
 assert.match(sql,/s\.id=ANY\(\$4::text\[\]\)/);
 assert.deepEqual(params,['acct_A','ws_A','store_A',['site_A','site_B']]);
});
test('01605E empty site allowlist makes no SQL call',async()=>{
 const data=await listSiteRevisions01231(scope,'',[],async()=>{throw Error('DATABASE_MUST_NOT_BE_QUERIED');});
 assert.deepEqual(data,[]);
});
test('01605E store-wide role keeps previous scoped SQL query',async()=>{
 let sql='',params=[];
 await listSiteRevisions01231(scope,'',null,async fn=>fn({query:async(s,p)=>{sql=s;params=p;return {rows:[]};}}));
 assert.deepEqual(params,['acct_A','ws_A','store_A']);assert.doesNotMatch(sql,/ANY\(/);
});
test('01605E server routes apply central gate to both reads and filter site list',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(server,/classifyLegacyMerchantAction01605F\(req\.method,p\)\|\|classifyLegacyReadAction01605E\(req\.method,p\)\|\|classifyTenantIsolationAction01605D/);
 assert.match(server,/listSiteRevisions01231\(scope,'',protectedDecision01600\?\.allowedSiteIds\?\?null\)/);
 assert.match(server,/p\[4\]==='export'&&p\.length===5/);
});

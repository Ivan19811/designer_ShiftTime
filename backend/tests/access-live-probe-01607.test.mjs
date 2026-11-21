import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {validateConfig01607,makeReadOnlyMatrix01607,runReadOnlyMatrix01607} from '../scripts/verify-access-live-01607.mjs';
const config={apiRoot:'https://testing.invalid/api/v1',tokens:{ownerA:'test-token-A',ownerB:'test-token-B',workerA:'test-token-C',workerB:'test-token-D'},storeA:'store_a',storeB:'store_b',siteA:'site_a',siteB:'site_b'};
test('01607 --plan is truly offline and never requires credentials',()=>{
 const output=spawnSync(process.execPath,[new URL('../scripts/verify-access-live-01607.mjs',import.meta.url).pathname,'--plan'],{encoding:'utf8',env:{PATH:process.env.PATH}});
 assert.equal(output.status,0);assert.match(output.stdout,/DRY PLAN ONLY/);
});
test('01607 matrices cover two tenants, two owners, two workers and revocation in same session',()=>{
 const before=makeReadOnlyMatrix01607(config),after=makeReadOnlyMatrix01607(config,'after');
 assert.equal(before.length,10);assert.equal(after.length,10);
 assert.equal(before.find(x=>x.actor==='workerA'&&x.site==='site_a'&&x.store==='store_a').expected,200);
 assert.equal(after.find(x=>x.actor==='workerA'&&x.site==='site_a'&&x.store==='store_a').expected,403);
 assert.equal(after.find(x=>x.actor==='workerB'&&x.site==='site_b'&&x.store==='store_b').expected,200);
});
test('01607 live probe uses ONLY GET, explicit store headers and no request body',async()=>{
 const requests=[];
 const report=await runReadOnlyMatrix01607(config,{fetchImpl:async (url,args)=>{
  requests.push({url,args});
  const c=makeReadOnlyMatrix01607(config)[requests.length-1];
  return {status:c.expected,body:{cancel:async()=>{}}};
 }});
 assert.equal(report.passed,10);assert.equal(report.total,10);
 assert.ok(requests.every(r=>r.args.method==='GET'&&!r.args.body&&r.args.redirect==='manual'));
 assert.ok(requests.every(r=>r.args.headers['x-st-store-id']==='store_a'||r.args.headers['x-st-store-id']==='store_b'));
 assert.ok(requests.every(r=>r.url.startsWith('https://testing.invalid/api/v1/sites/')));
});
test('01607 unexpected HTTP outcomes fail (no silent success on 401, 404 or 500)',async()=>{
 const report=await runReadOnlyMatrix01607(config,{fetchImpl:async()=>({status:401,body:null})});
 assert.equal(report.passed,0);assert.equal(report.results.length,10);
});
test('01607 after-revocation plan fails unless old worker token is actually denied',async()=>{
 const before=makeReadOnlyMatrix01607(config);
 let index=0;
 const result=await runReadOnlyMatrix01607(config,{phase:'after',fetchImpl:async()=>({status:before[index++].expected,body:null})});
 assert.equal(result.passed,9);assert.equal(result.results.find(x=>!x.pass)?.name,'worker A own site A after revoke');
});

test('01607 probe rejects insecure remote HTTP, URL credentials, IDs and duplicate sessions',()=>{
 const input={ST01607_API_BASE:'https://testing.invalid',ST01607_STORE_A:'store_a',ST01607_STORE_B:'store_b',ST01607_SITE_A:'site_a',ST01607_SITE_B:'site_b',ST01607_OWNER_A_TOKEN:'one',ST01607_OWNER_B_TOKEN:'two',ST01607_WORKER_A_TOKEN:'three',ST01607_WORKER_B_TOKEN:'four'};
 assert.equal(validateConfig01607(input).apiRoot,'https://testing.invalid/api/v1');
 for(const value of ['http://example.org','https://user:pass@example.org','https://example.org/path?token=x'])assert.throws(()=>validateConfig01607({...input,ST01607_API_BASE:value}));
 assert.throws(()=>validateConfig01607({...input,ST01607_SITE_A:'../sites/site_b'}));
 assert.throws(()=>validateConfig01607({...input,ST01607_WORKER_A_TOKEN:'one'}));
});

#!/usr/bin/env node
// Offline, deterministic 01605B sample route-classifier report. Not a live penetration test.
import {classifyNotificationAccess01605B} from '../src/access-audit-core-01605b.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
process.stdout.on('error',error=>{if(error?.code==='EPIPE')process.exit(0);throw error;});
const base=[
 ['GET','notifications/messages'],['GET','notifications/messages/inbox'],['GET','notifications/messages/inbox/managers'],
 ['GET','notifications/messages/inbox/sample'],['PATCH','notifications/messages/inbox/sample'],['POST','notifications/messages/inbox/sample/thread'],
 ['GET','notifications/sites'],['GET','notifications/traffic'],['GET','notifications/transports/status'],
 ['POST','notifications/transports/email/test'],['GET','notifications/deliveries'],['POST','notifications/deliveries/sample/retry'],
 ['GET','notifications/recipients'],['GET','notifications/preferences/stats'],['GET','notifications/rules'],
 ['POST','notifications/rules'],['PUT','notifications/rules/sample'],['DELETE','notifications/rules/sample'],
 ['POST','notifications/rules/sample/duplicate'],['POST','notifications/messages/sample/read'],
 ['POST','notifications/orders/sample/dismiss'],['POST','notifications/payments/sample/read'],
 ['POST','notifications/sites/sample/read'],['POST','notifications/traffic/sample/dismiss']
];
const known=new Set(ACCESS_PERMISSIONS_01597.map(x=>x.code));
const entries=base.map(([method,path])=>{
 const result=classifyNotificationAccess01605B(method,('api/v1/'+path).split('/'));
 return {method,path,permission:result?.permission||null,valid:!!result?.permission&&known.has(result.permission),storeWide:result?.siteId===''};
});
const summary={stage:'01605B',auditType:'offline-sample-classifier',tested:entries.length,valid:entries.filter(e=>e.valid&&e.storeWide).length,missing:entries.filter(e=>!e.valid||!e.storeWide).length,notFullApiCoverage:true};
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify({summary,entries},null,2)+'\n');
else{process.stdout.write(`ShiftTime 01605B: ${summary.valid}/${summary.tested} sample notification/customer-message route decisions validated. Not a live API audit.\n`);for(const e of entries)process.stdout.write(`${e.valid?'OK':'MISSING'} ${e.method} /api/v1/${e.path} => ${e.permission||'-'}\n`);}
if(summary.missing)process.exitCode=1;

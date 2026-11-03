import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyLimit01612C,emailUsageModule01612C,emailUsageThreshold01612C,reserveEmailUsage01612C,finishEmailUsage01612C,getEmailUsage01612C} from '../src/email-usage-01612c.mjs';
import {sendPlatformEmail01612B} from '../src/email-transport-01612b.mjs';
test('limit and user-controlled module labels are constrained',()=>{
 assert.equal(dailyLimit01612C({}),300);assert.equal(dailyLimit01612C({BREVO_DAILY_LIMIT_01612C:'275'}),275);assert.equal(dailyLimit01612C({BREVO_DAILY_LIMIT_01612C:'hello'}),300);
 assert.equal(emailUsageModule01612C('private-stolen-data'),'system');assert.equal(emailUsageThreshold01612C(210,300),70);assert.equal(emailUsageThreshold01612C(270,300),90);assert.equal(emailUsageThreshold01612C(300,300),100);
});
test('reservation serializes quota and blocks noncritical at 90%',async()=>{
 const log=[];
 const withDb=fn=>fn({async query(sql,args=[]){log.push({sql,args});if(sql.startsWith('SELECT COUNT'))return {rows:[{count:270}]};if(sql.startsWith('INSERT'))return {rows:[{id:'abc'}]};return {rows:[]};}});
 await assert.rejects(()=>reserveEmailUsage01612C({module:'notification',limit:300},{withDb}),{code:'EMAIL_DAILY_BUDGET_REACHED_01612C'});
 assert.ok(log.some(x=>x.sql.includes('pg_advisory_xact_lock')));assert.ok(log.some(x=>x.args.includes('blocked')));
 assert.deepEqual(await reserveEmailUsage01612C({module:'password-reset',priority:'critical',limit:300},{withDb}),{id:'abc',count:270,limit:300});
});
test('usage log records only status plus sanitized metadata',async()=>{
 const log=[];const withDb=fn=>fn({async query(sql,args){log.push({sql,args});return {rows:[],rowCount:1};}});
 await finishEmailUsage01612C(23,{accepted:false,statusCode:400,errorCode:'EMAIL_TRANSPORT_BREVO_FAILED_01612B; secret: hi'},{withDb});
 assert.equal(log[0].args[0],23);assert.equal(log[0].args[1],'failed');assert.ok(!log[0].args[3].includes(';'));
});
test('render stats are server counters, not invented vendor remaining',async()=>{
 const answers=[{rows:[{status:'accepted',count:3},{status:'failed',count:1}]},{rows:[{day:'2026-11-02',status:'accepted',count:3}]},{rows:[{module:'password-reset',site_id:'',status:'accepted',count:3}]},{rows:[]}];let i=0;
 const query=fn=>fn({query:async()=>answers[i++]});const data=await getEmailUsage01612C({query,limit:300});
 assert.equal(data.source,'shifttime-backend-only');assert.equal(data.remaining,297);assert.equal(data.totals.attempts,4);assert.equal(data.history[0].count,3);
});
test('brevo wrapper uses usage callbacks only when explicitly enabled',async()=>{
 const calls=[];
 const fetchImpl=async()=>({ok:true,status:201,json:async()=>({messageId:'x'})});
 const message={from:'ShiftTime <admin@example.com>',to:'client@example.net',subject:'test',text:'body',module:'password-reset'};
 await sendPlatformEmail01612B({provider:'brevo',apiKey:'test',usageEnabled:true},message,{fetchImpl,
  reserveUsage:async opts=>(calls.push(['reserve',opts]),{id:1}),finishUsage:async(id,opts)=>calls.push(['finish',id,opts])});
 assert.equal(calls[0][1].module,'password-reset');assert.equal(calls[1][2].accepted,true);
 await assert.rejects(()=>sendPlatformEmail01612B({provider:'brevo',apiKey:'test',usageEnabled:true},message,{fetchImpl,
 reserveUsage:async()=>{throw Object.assign(new Error('limit'),{code:'EMAIL_DAILY_BUDGET_REACHED_01612C'})}}),{code:'EMAIL_DAILY_BUDGET_REACHED_01612C'});
});

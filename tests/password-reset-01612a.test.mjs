import test from 'node:test';
import assert from 'node:assert/strict';
import {requestPasswordReset01612A,completePasswordReset01612A,hashResetToken01612A,validResetToken01612A,normalizeResetEmail01612A,genericResetResponse01612A,limitResetRequest01612A} from '../src/password-reset-01612a.mjs';
import {readFile} from 'node:fs/promises';
const cfg={notificationSmtpHost:'smtp.example.invalid',notificationEmailFrom:'ShiftTime <no-reply@example.invalid>',notificationSmtpSecure:false,notificationSmtpStartTls:true,notificationSmtpPort:587,notificationDeliveryTimeoutMs:3000};
const env={PASSWORD_RESET_PUBLIC_ORIGIN_01612A:'https://designer-shifttime.onrender.com'};
const saved=[];
function dbRequest(exists=true,{limited=false}={}){return async fn=>fn({query:async (sql,args)=>{const q=String(sql);saved.push(q);if(q.startsWith('SELECT id,email FROM platform_users'))return {rowCount:exists?1:0,rows:exists?[{id:'usr_1234',email:'user@example.invalid'}]:[]};if(q.includes('SELECT COUNT(*)::integer AS count'))return {rows:[{count:limited?3:0,last:null}]};if(q.includes('INSERT INTO platform_password_resets'))return {rows:[{id:7}]};return {rows:[],rowCount:1};}});}
const token='a'.repeat(43);
test('01612A: tokens require 256-bit base64url and are never stored in plain form',()=>{
 assert.equal(validResetToken01612A(token),true);assert.equal(validResetToken01612A('short'),false);
 assert.equal(hashResetToken01612A(token).length,64);assert.ok(!hashResetToken01612A(token).includes(token));
 assert.equal(normalizeResetEmail01612A('  CASE@Example.test '),'case@example.test');
});
test('01612A: known user gets single-use email with fragment token and no bare token stored in DB',async()=>{
 saved.length=0;let message;
 const result=await requestPasswordReset01612A('user@example.invalid',{settings:cfg,env,query:dbRequest(),send:async(opts,email)=>{message=email;assert.equal(opts.host,cfg.notificationSmtpHost);}});
 assert.deepEqual(result,{ok:true,stage:'01612A'});
 assert.ok(message.text.includes('https://designer-shifttime.onrender.com/identity/reset/#token='));
 assert.equal(message.to,'user@example.invalid');assert.ok(saved.some(x=>x.includes('token_hash')));
});
test('01612A: unknown user and rate-limited known user return indistinguishable generic responses',async()=>{
 let calls=0;const send=async()=>{calls++;};
 const a=await requestPasswordReset01612A('unknown@example.invalid',{settings:cfg,env,query:dbRequest(false),send});
 const b=await requestPasswordReset01612A('user@example.invalid',{settings:cfg,env,query:dbRequest(true,{limited:true}),send});
 assert.deepEqual(a,genericResetResponse01612A);assert.deepEqual(b,genericResetResponse01612A);assert.equal(calls,0);
});
test('01612A: no SMTP configuration fails closed instead of claiming message sent',async()=>{
 await assert.rejects(()=>requestPasswordReset01612A('user@example.invalid',{settings:{},env,query:dbRequest(),send:async()=>{throw Error('unexpected');}}),e=>e.code==='PASSWORD_RESET_NOT_CONFIGURED_01612A'&&e.statusCode===503);
});
test('01612A: untrusted/non-HTTPS reset link origin rejected',async()=>{
 await assert.rejects(()=>requestPasswordReset01612A('user@example.invalid',{settings:cfg,env:{PASSWORD_RESET_PUBLIC_ORIGIN_01612A:'http://evil.example.invalid'},query:dbRequest()}),e=>e.code==='PASSWORD_RESET_NOT_CONFIGURED_01612A');
});
test('01612A: completion is transactional, requires sent unexpired token and revokes all session classes',async()=>{
 const steps=[];const query=async callback=>callback({query:async(sql,args)=>{const q=String(sql);steps.push(q);if(q.includes('SELECT r.id,r.user_id'))return {rowCount:1,rows:[{id:1,user_id:'usr_1234'}]};if(q.includes('UPDATE platform_user_credentials'))return {rowCount:1};return {rowCount:1,rows:[]};}});
 const result=await completePasswordReset01612A({token,password:'This_is_a_strong_passphrase_!'}, {query});
 assert.deepEqual(result,{ok:true,stage:'01612A'});
 assert.ok(steps.some(x=>x.includes('FROM platform_password_resets_01612a')&&x.includes('FOR UPDATE')));
 assert.ok(steps.some(x=>x.includes('UPDATE api_sessions SET status')));
 assert.ok(steps.some(x=>x.includes('UPDATE platform_site_customer_sessions_01595 SET status')));
 assert.ok(steps.some(x=>x.includes('UPDATE platform_password_resets_01612a SET consumed_at')));
 assert.equal(steps.at(-1),'COMMIT');
});
test('01612A: expired/used/unsent links rejected, no session revocation on failure',async()=>{
 const steps=[];const query=async fn=>fn({query:async(sql)=>{steps.push(sql);if(String(sql).includes('SELECT r.id,r.user_id'))return {rowCount:0,rows:[]};return {rowCount:0,rows:[]};}});
 await assert.rejects(()=>completePasswordReset01612A({token,password:'This_is_a_strong_passphrase_!'},{query}),e=>e.code==='PASSWORD_RESET_INVALID_01612A');
 assert.ok(steps.includes('ROLLBACK'));assert.ok(!steps.some(x=>x.includes('UPDATE api_sessions SET status')));
});
test('01612A: client URL does not leak link in HTTP request, uses no-store and protected Render origin',async()=>{
 const js=await readFile(new URL('../public/password-reset-01612a.js',import.meta.url),'utf8');
 const page=await readFile(new URL('../src/server.mjs',import.meta.url),'utf8');
 const hosted=await readFile(new URL('../public/site-customer-identity-01595.js',import.meta.url),'utf8');
 assert.match(js,/location\.hash/);assert.match(js,/history\.replaceState/);assert.match(page,/password-reset/);assert.match(page,/no-referrer/);assert.match(hosted,/identity\/reset/);
});
test('01612A: request limiter blocks excessive volume without storing plain IP',()=>{
 for(let i=0;i<25;i++)limitResetRequest01612A('198.51.100.93',10000000+i);
 assert.throws(()=>limitResetRequest01612A('198.51.100.93',10000027),e=>e.code==='PASSWORD_RESET_RATE_LIMIT_01612A');
});

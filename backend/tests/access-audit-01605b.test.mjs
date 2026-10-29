import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyNotificationAccess01605B} from '../src/access-audit-core-01605b.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {assertUnmanagedAdminOperation01605} from '../src/access-audit-service-01605.mjs';
const parts=s=>('api/v1/'+s).split('/');
const named=[
 ['GET','notifications/messages','crm.messages.view'],
 ['GET','notifications/messages/inbox','crm.messages.view'],
 ['GET','notifications/messages/inbox/managers','crm.messages.view'],
 ['GET','notifications/messages/inbox/msg_x','crm.messages.view'],
 ['PATCH','notifications/messages/inbox/msg_x','crm.messages.manage'],
 ['POST','notifications/messages/inbox/msg_x/thread','crm.messages.reply'],
 ['GET','notifications/sites','site.pages.view'],
 ['GET','notifications/traffic','shop.notifications.view'],
 ['GET','notifications/transports/status','builder.integrations.view'],
 ['POST','notifications/transports/email/test','builder.integrations.manage'],
 ['GET','notifications/deliveries','shop.notifications.view'],
 ['POST','notifications/deliveries/del_x/retry','shop.notifications.manage'],
 ['GET','notifications/recipients','shop.notifications.view'],
 ['GET','notifications/preferences/stats','shop.notifications.view'],
 ['GET','notifications/rules','shop.notifications.view'],
 ['POST','notifications/rules','shop.notifications.manage'],
 ['PUT','notifications/rules/rule_x','shop.notifications.manage'],
 ['DELETE','notifications/rules/rule_x','shop.notifications.manage'],
 ['POST','notifications/rules/rule_x/duplicate','shop.notifications.manage'],
 ['POST','notifications/messages/msg_x/read','crm.messages.view'],
 ['POST','notifications/orders/msg_x/dismiss','shop.orders.view'],
 ['POST','notifications/payments/msg_x/read','shop.payments.view'],
 ['POST','notifications/sites/msg_x/read','site.pages.view'],
 ['POST','notifications/traffic/msg_x/dismiss','shop.notifications.view']
];
test('01605B positive route map uses only declared permissions and never a siteId from headers',()=>{
 const known=new Set(ACCESS_PERMISSIONS_01597.map(r=>r.code));
 for(const [method,path,permission] of named){const decision=classifyNotificationAccess01605B(method,parts(path));assert.equal(decision?.permission,permission,`${method} ${path}`);assert.ok(known.has(permission));assert.equal(decision.siteId,'');}
});
test('01605B unknown methods, buyer and auth routes, user prefs cannot be forced into store permissions',()=>{
 for(const [method,path] of [
 ['GET','public/site/messages'],['POST','public/site/messages'],['GET','notifications/rules/rule_x'],
 ['DELETE','notifications/messages/inbox/msg_x'],['POST','notifications/messages/inbox'],
 ['GET','notifications/messages/inbox/msg_x/replies'],['GET','notifications/transports/email/test'],
 ['GET','notifications/preferences'],['PUT','notifications/preferences'],
 ['POST','notifications/deliveries/del_x/retry/extra'],['GET','notifications/transports/status/extra'],
 ['PUT','admin/members/member_x'],['POST','auth/login'],['GET','notifications/orders']
 ])assert.equal(classifyNotificationAccess01605B(method,parts(path)),null,`${method} ${path}`);
});
test('01605B customer read does not allow replies, message management, notifications or admin',async()=>{
 const scope={role:'admin',accountId:'acct_A',workspaceId:'work_A',storeId:'store_A'};
 const seen=[];const run=async cb=>cb({query:async(sql,values)=>{
  seen.push({sql,values});
  if(sql.includes('platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('platform_role_assignments_01597'))return {rowCount:1,rows:[{scopeKind:'store',siteId:null,permissions:['crm.messages.view']}]};
  throw new Error('Unexpected SQL in fake client');
 }});
 await inspectProtectedAccess01600(scope,'usr_A',classifyNotificationAccess01605B('GET',parts('notifications/messages/inbox')),{run});
 for(const [method,path] of [['POST','notifications/messages/inbox/x/thread'],['PATCH','notifications/messages/inbox/x'],['POST','notifications/rules'],['GET','notifications/deliveries'],['POST','notifications/transports/email/test']]){
  await assert.rejects(inspectProtectedAccess01600(scope,'usr_A',classifyNotificationAccess01605B(method,parts(path)),{run}),{statusCode:403});
 }
 assert.deepEqual(seen.filter(q=>q.sql.includes('platform_access_enrollments_01600')).map(q=>q.values),Array(6).fill(['acct_A','store_A','usr_A']));
 assert.ok(seen.filter(q=>q.sql.includes('platform_role_assignments_01597')).every(q=>q.values[0]==='acct_A'&&q.values[1]==='work_A'&&q.values[2]==='store_A'&&q.values[3]==='usr_A'));
 await assert.rejects(assertUnmanagedAdminOperation01605(scope,'usr_A',{run}),{statusCode:403});
});
test('01605B deny site-only grant to store-wide message inbox, across different Store',async()=>{
 const scope={role:'viewer',accountId:'acct_B',workspaceId:'work_B',storeId:'store_B'};
 const seen=[];const run=async cb=>cb({query:async(sql,values)=>{
  seen.push(values);
  if(sql.includes('platform_access_enrollments_01600'))return {rowCount:1,rows:[{mode:'custom'}]};
  if(sql.includes('platform_role_assignments_01597'))return {rowCount:0,rows:[]};
  throw new Error('Unexpected SQL');
 }});
 await assert.rejects(inspectProtectedAccess01600(scope,'usr_B',classifyNotificationAccess01605B('GET',parts('notifications/messages/inbox')),{run}),{statusCode:403});
 assert.deepEqual(seen[0],['acct_B','store_B','usr_B']);
 assert.deepEqual(seen[1].slice(0,4),['acct_B','work_B','store_B','usr_B']);
 assert.equal(seen[1][4],null);assert.equal(seen[1][5],false);
});
test('01605B store preferences classified after checking target, before calling persistent save',()=>{
 const src=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(src,/classifyNotificationAccess01605B\(req\.method,p\)/);
 assert.match(src,/const protectedDecision01600=auditedAction01605\s*\? await inspectProtectedAccess01600/);
 assert.ok(src.indexOf('const protectedDecision01600=')<src.indexOf("if(p[2]==='notifications'){",src.indexOf('const protectedDecision01600=')));
 assert.match(src,/if\(String\(body\?\.target\|\|'user'\)==='store'\)\{const storePrefsDecision01605B=await inspectProtectedAccess01600/);
 assert.match(src,/assertLegacyForUnmanaged01600\(scope,storePrefsDecision01605B\);\}return sendJson\(res,200,await saveNotificationPreferences01417/);
 assert.match(src,/if\(p\[2\]==='admin'\)\{\s*assertAdminView01087\(scope\);\s*await assertUnmanagedAdminOperation01605\(scope,session\.userId\)/);
});
test('01605B owner and non-enrolled staff still have current behavior',async()=>{
 const owner={role:'owner',accountId:'acct',workspaceId:'ws',storeId:'store'};
 const decision=classifyNotificationAccess01605B('POST',parts('notifications/rules'));
 assert.equal((await inspectProtectedAccess01600(owner,'usr_o',decision,{run:()=>{throw Error('Owner does not query DB');}})).mode,'owner');
 const viewer={...owner,role:'viewer'};
 const run=async cb=>cb({query:async(sql)=>{assert.ok(sql.includes('platform_access_enrollments_01600'));return {rowCount:0,rows:[]};}});
 const result=await inspectProtectedAccess01600(viewer,'usr_v',classifyNotificationAccess01605B('GET',parts('notifications/deliveries')),{run});
 assert.equal(result.mode,'legacy');
 await assert.rejects(inspectProtectedAccess01600(viewer,'usr_v',decision,{run}),{statusCode:403});
});

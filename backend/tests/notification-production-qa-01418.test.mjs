import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateNotificationRules01408} from '../src/notification-rule-engine-core-01408.mjs';
import {notificationDecisionAllowsInAppRecipient01416} from '../src/notification-recipient-routing-core-01416.mjs';
import {normalizeNotificationPreferences01417,notificationPreferenceMode01417,notificationGroupKey01417,notificationFingerprint01417} from '../src/notification-preferences-core-01417.mjs';

const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01418 E2E policy core keeps event -> rule -> recipient -> preferences coherent',()=>{
  const event={eventKey:'order:qa-1:paid',type:'order.paid',provider:'orders',severity:'medium',data:{order:{total:15000,siteId:'site-a'},event:{severity:'medium'}}};
  const rules=[{id:'qa-rule',enabled:true,eventType:'order.paid',provider:'orders',severity:'high',conditions:{mode:'all',items:[{field:'order.total',operator:'gte',value:10000},{field:'order.siteId',operator:'eq',value:'site-a'}]},actions:{notify:true,channels:['inApp','email'],delivery:'digest',recipients:[{type:'role',role:'manager'}]},scope:{type:'store',id:'store-a'}}];
  const decision=evaluateNotificationRules01408(rules,event);
  assert.equal(decision.allowed,true);
  assert.equal(decision.effectiveSeverity,'high');
  assert.equal(notificationDecisionAllowsInAppRecipient01416(decision,{userId:'u-manager',role:'manager'}),true);
  assert.equal(notificationDecisionAllowsInAppRecipient01416(decision,{userId:'u-viewer',role:'viewer'}),false);
  const preferences=normalizeNotificationPreferences01417({quietHours:{enabled:false},digest:{enabled:true,intervalMinutes:30},grouping:{enabled:true,windowMinutes:20},dedupe:{enabled:true,windowMinutes:5}});
  const policy=notificationPreferenceMode01417({preferences,severity:decision.effectiveSeverity,ruleDelivery:'digest',now:new Date('2026-10-06T12:00:00Z')});
  assert.equal(policy.mode,'digest');
  const a={...event,notification:{title:'Paid',body:'A'},data:{order:{id:'o1'}}},b={...event,eventKey:'order:qa-2:paid',notification:{title:'Paid',body:'B'},data:{order:{id:'o2'}}};
  assert.equal(notificationGroupKey01417(a,'email','user:u-manager'),notificationGroupKey01417(b,'email','user:u-manager'));
  assert.notEqual(notificationFingerprint01417(a,'email','user:u-manager'),notificationFingerprint01417(b,'email','user:u-manager'));
});

test('01418 notification receipt cannot mutate customer-message business status',()=>{
  const service=read('src/notification-inbox-01404.mjs');
  const start=service.indexOf('export async function setNotificationReceipt01404');
  const end=service.indexOf('\n}',start)+2;
  const fn=service.slice(start,end);
  assert.match(fn,/shifttime_notification_user_receipts/);
  assert.doesNotMatch(fn,/UPDATE shifttime_customer_messages/);
});

test('01418 Inbox business read writes the actor personal receipt instead of shared receipt',()=>{
  const inbox=read('src/customer-messages-inbox-01410.mjs');
  assert.match(inbox,/markMessageNotificationReceipt01418/);
  assert.match(inbox,/shifttime_notification_user_receipts/);
  assert.match(inbox,/if\(markRead\)\{if\(row\.status==='new'\)/);
  assert.match(inbox,/await markMessageNotificationReceipt01418\(client,scope,messageId,actorUserId\)/);
});

test('01418 preference worker retries failed transport rows and requires all deliveries to succeed',()=>{
  const service=read('src/notification-preferences-01417.mjs');
  const retryCalls=service.match(/retryExisting:true/g)||[];
  const allSuccess=service.match(/deliveries\.length>0&&deliveries\.every\(x=>x\?\.status==='sent'\)/g)||[];
  assert.equal(retryCalls.length,2);
  assert.equal(allSuccess.length,2);
});

test('01418 grouping.windowMinutes is enforced by the digest worker',()=>{
  const service=read('src/notification-preferences-01417.mjs');
  assert.match(service,/groupingWindow=Math\.max\(1,Number\(pref\.preferences\.grouping\.windowMinutes\)\|\|30\)/);
  assert.match(service,/created_at<=\$6::timestamptz\+\(\$7::int\*interval '1 minute'\)/);
  assert.match(service,/ORDER BY due_at,created_at,id/);
});

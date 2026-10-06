import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  normalizeNotificationRecipients01416,
  notificationRecipientMatches01416,
  notificationDecisionAllowsInAppRecipient01416,
  notificationRecipientSelectorsForChannel01416,
  notificationRecipientKey01416
,
  normalizeNotificationRecipientCatalog01416
} from '../src/notification-recipient-routing-core-01416.mjs';
import {sendEmailNotification01409} from '../src/notification-transports-01409.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01416 recipient selectors normalize roles/users and preserve backward-compatible default routing',()=>{
  const selectors=normalizeNotificationRecipients01416([{type:'role',role:'owner'},{type:'user',userId:'u2'},{type:'role',role:'owner'},{type:'role',role:'bogus'}]);
  assert.deepEqual(selectors,[{type:'role',role:'owner'},{type:'user',userId:'u2'}]);
  assert.equal(notificationRecipientMatches01416([], {userId:'u3',role:'viewer'}),true);
  assert.equal(notificationRecipientMatches01416(selectors,{userId:'u2',role:'manager'}),true);
  assert.equal(notificationRecipientMatches01416(selectors,{userId:'u9',role:'owner'}),true);
  assert.equal(notificationRecipientMatches01416(selectors,{userId:'u9',role:'manager'}),false);
  assert.equal(notificationRecipientKey01416({userId:'u2'}),'user:u2');
  assert.equal(notificationRecipientKey01416({}),'default');
});

test('01416 in-app routing supports explicit roles/users plus default rules for the same event',()=>{
  const decision={matched:[
    {id:'owner-critical',actions:{channels:['inApp','email'],recipients:[{type:'role',role:'owner'},{type:'role',role:'admin'}]}},
    {id:'store-default',actions:{channels:['telegram'],recipients:[]}}
  ]};
  assert.equal(notificationDecisionAllowsInAppRecipient01416(decision,{userId:'u1',role:'owner'}),true);
  assert.equal(notificationDecisionAllowsInAppRecipient01416(decision,{userId:'u2',role:'manager'}),false);
  const email=notificationRecipientSelectorsForChannel01416(decision,'email');
  assert.equal(email.hasDefault,false);assert.equal(email.selectors.length,2);assert.deepEqual(email.matchedRuleIds,['owner-critical']);
  const telegram=notificationRecipientSelectorsForChannel01416(decision,'telegram');
  assert.equal(telegram.hasDefault,true);assert.equal(telegram.selectors.length,0);
});

test('01416 canonical membership catalog dedupes a user to the strongest applicable role',()=>{
  const items=normalizeNotificationRecipientCatalog01416([
    {userId:'u1',name:'Owner',email:'owner@example.com',role:'manager',membershipId:'m2'},
    {userId:'u1',name:'Owner',email:'owner@example.com',role:'owner',membershipId:'m1'},
    {userId:'u2',name:'Maria',email:'maria@example.com',role:'manager',membershipId:'m3'}
  ]);
  assert.equal(items.length,2);assert.equal(items[0].userId,'u1');assert.equal(items[0].role,'owner');assert.equal(items[1].userId,'u2');
});

test('01416 Email transport targets canonical recipient email instead of only Store default destination',async()=>{
  let message=null;
  const settings={notificationSmtpHost:'smtp.example.com',notificationSmtpPort:587,notificationSmtpSecure:false,notificationSmtpStartTls:true,notificationSmtpUser:'user',notificationSmtpPass:'secret',notificationEmailFrom:'alerts@example.com',notificationEmailTo:'owner@example.com',notificationDeliveryTimeoutMs:3000};
  const scope={accountId:'a1',workspaceId:'w1',storeId:'s1'};const event={eventKey:'e1',type:'system.error',provider:'system',severity:'critical',notification:{title:'Critical',body:'Failure'},data:{}};
  await sendEmailNotification01409(scope,event,{settings,recipient:{userId:'u2',email:'maria@example.com',role:'manager'},smtpSendImpl:async(_options,msg)=>{message=msg;return {responseCode:250};}});
  assert.equal(message.to,'maria@example.com');assert.notEqual(message.to,settings.notificationEmailTo);
});

test('01416 migration/service use canonical memberships, user receipts and recipient-aware delivery idempotency',()=>{
  const sql=read('sql/038_notification_recipient_routing.sql'),service=read('src/notification-recipient-routing-01416.mjs'),delivery=read('src/notification-delivery-01409.mjs'),inbox=read('src/notification-inbox-01404.mjs'),server=read('src/server.mjs'),supplier=read('src/marketplace-supplier-sync-alert-store-01401.mjs');
  assert.match(service,/platform_memberships/);assert.match(service,/platform_users/);assert.match(service,/m\.account_id=\$1/);assert.match(service,/m\.workspace_id IS NULL OR m\.workspace_id=\$2/);assert.match(service,/m\.store_id IS NULL OR m\.store_id=\$3/);
  assert.match(sql,/shifttime_notification_user_receipts/);assert.match(sql,/PRIMARY KEY\(store_id,provider,event_key,user_id\)/);assert.match(sql,/store_id,event_key,channel,recipient_key/);assert.match(sql,/recipient_user_id/);
  assert.match(delivery,/resolveNotificationRecipients01416/);assert.match(supplier,/shifttime_notification_user_receipts/);assert.match(supplier,/ur\.provider='suppliers'/);assert.match(delivery,/recipientKey/);assert.match(delivery,/matchedRuleIds/);assert.match(inbox,/shifttime_notification_user_receipts/);assert.match(server,/notifications.*recipients|p\[3\]==='recipients'/);
});

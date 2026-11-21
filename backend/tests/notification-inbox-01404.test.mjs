import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCustomerMessageInput01404,normalizeNotificationReceiptStatus01404,orderNotificationSeverity01404} from '../src/notification-inbox-core-01404.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01404 message validation accepts supported channels and rejects empty body',()=>{
  const x=normalizeCustomerMessageInput01404({channel:'chat',body:'Hello',customer:{name:'A'},context:{pagePath:'/contacts'}});assert.equal(x.channel,'chat');assert.equal(x.body,'Hello');assert.equal(x.context.pagePath,'/contacts');
  assert.throws(()=>normalizeCustomerMessageInput01404({body:''}),/CUSTOMER_MESSAGE_BODY_REQUIRED_01404/);
});

test('01404 receipt semantics keep notification state independent from order workflow status',()=>{
  assert.equal(normalizeNotificationReceiptStatus01404('read'),'read');assert.equal(normalizeNotificationReceiptStatus01404('dismissed'),'dismissed');assert.equal(normalizeNotificationReceiptStatus01404('new'),'unread');assert.equal(orderNotificationSeverity01404({status:'new'}),'info');assert.equal(orderNotificationSeverity01404({status:'cancelled'}),'warning');
});

test('01404 backend wiring scopes customer messages to published sites and order/message notifications to Store',()=>{
  const migration=read('sql/030_notification_orders_customer_messages.sql'),service=read('src/notification-inbox-01404.mjs'),server=read('src/server.mjs'),pkg=read('package.json'),verify=read('scripts/db-verify.mjs');
  assert.match(migration,/PRIMARY KEY \(store_id, provider, event_key\)/);assert.match(migration,/REFERENCES platform_stores\(id\) ON DELETE CASCADE/);assert.match(migration,/SELECT store_id,'orders',id,'read'/);
  assert.match(service,/identity\.storeId/);assert.match(service,/builder_site_id=\$1 AND ip_hash=\$2/);assert.match(service,/shifttime_order_notification_events/);assert.match(service,/WHERE e\.store_id=\$1/);assert.match(service,/WHERE m\.store_id=\$1/);
  assert.match(server,/PUBLISHED_SITE_IDENTITY_REQUIRED_01404/);assert.match(server,/p\[2\]==='notifications'/);assert.match(pkg,/notification-inbox-core-01404/);assert.match(verify,/shifttime_customer_messages/);
});

test('01404 production build provides opt-in contact form bridge without exposing site token in form payload',()=>{
  const build=read('src/site-production-build-01143.mjs');assert.match(build,/data-st-customer-message-form/);assert.match(build,/globalThis\.fetch\('\/api\/v1\/public\/site\/messages'/);assert.match(build,/headers\.set\('x-st-site-token',token\)/);assert.doesNotMatch(build,/payload=.*token/);
});

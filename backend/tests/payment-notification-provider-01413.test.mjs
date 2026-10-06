import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildPaymentNotificationEvent01413,paymentNotificationEventTypeForStatus01413,paymentNotificationEventTypeForCanonicalEvent01413} from '../src/payment-notification-core-01413.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01413 maps canonical Payment states and ledger event types to universal payment events',()=>{
  assert.equal(paymentNotificationEventTypeForStatus01413('paid'),'payment.succeeded');
  assert.equal(paymentNotificationEventTypeForStatus01413('failed'),'payment.failed');
  assert.equal(paymentNotificationEventTypeForStatus01413('partially-refunded'),'payment.refunded');
  assert.equal(paymentNotificationEventTypeForStatus01413('refunded'),'payment.refunded');
  assert.equal(paymentNotificationEventTypeForCanonicalEvent01413('payment-paid'),'payment.succeeded');
  assert.equal(paymentNotificationEventTypeForCanonicalEvent01413('payment-failed'),'payment.failed');
  assert.equal(paymentNotificationEventTypeForCanonicalEvent01413('payment-refunded'),'payment.refunded');
});

test('01413 payment event exposes canonical and store-scoped rule context without duplicating payment state',()=>{
  const event=buildPaymentNotificationEvent01413({eventId:'paye_1',canonicalEventType:'payment-paid',createdAt:'2026-10-06T08:00:00Z',eventPayload:{notificationEligible:true}},{id:'payment_1',marketplaceOrderId:'order_1',orderNumber:'MP-1',provider:'manual-dev',method:'card',status:'paid',currency:'UAH',amount:15000,refundedAmount:0},{storeId:'store_1',sellerOrderId:'seller_1',sellerName:'Seller',storeGross:12000,storeRefundedGross:0,storeCommission:960,storeSellerNet:11040});
  assert.equal(event.provider,'payments');assert.equal(event.type,'payment.succeeded');assert.equal(event.eventKey,'paye_1');assert.equal(event.data.payment.amount,15000);assert.equal(event.data.payment.storeGross,12000);assert.equal(event.data.payment.storeId,'store_1');assert.equal(event.data.payment.method,'card');
});

test('01413 provider reads marketplace payment ledger and reuses notification receipts/rules/delivery',()=>{
  const service=read('src/payment-notification-provider-01413.mjs'),inbox=read('src/notification-inbox-01404.mjs'),server=read('src/server.mjs');
  assert.match(service,/FROM marketplace_payment_events pe JOIN marketplace_payments p/);assert.match(service,/marketplace_payment_allocations/);assert.match(service,/listNotificationRules01408/);assert.match(service,/evaluateNotificationRules01408/);assert.match(service,/dispatchNotificationEvent01409/);
  assert.doesNotMatch(service,/CREATE TABLE|INSERT INTO marketplace_payments/);
  assert.match(inbox,/PROVIDERS=new Set\(\['orders','messages','payments'\]\)/);assert.match(inbox,/provider==='payments'/);assert.match(server,/listPaymentNotifications01413/);assert.match(server,/p\[3\]==='payments'/);
});

test('01413 payment mutation emits provider event only after COMMIT and keeps order lifecycle in parallel',()=>{
  const payments=read('src/marketplace-payment-service.mjs');
  const commit=payments.indexOf("await client.query('COMMIT')"),emit=payments.indexOf('emitPaymentLifecycleNotifications01413');
  assert.ok(commit>=0);assert.ok(emit>=0);assert.match(payments,/emitMarketplaceOrderPaymentLifecycleNotifications01412/);assert.match(payments,/paymentEventId/);assert.match(payments,/notificationEligible/);
});

test('01413 migration seeds payment rules and marks historical canonical events read instead of copying payment data',()=>{
  const migration=read('sql/035_payment_notification_provider.sql');
  for(const type of ['payment.succeeded','payment.failed','payment.refunded'])assert.match(migration,new RegExp(type.replace('.','\\.')));
  assert.match(migration,/shifttime_notification_rules/);assert.match(migration,/shifttime_notification_receipts/);assert.match(migration,/marketplace_payment_events/);assert.match(migration,/marketplace_payment_allocations/);assert.doesNotMatch(migration,/CREATE TABLE/);
});

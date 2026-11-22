import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildOrderNotificationEvent01412,orderNotificationEventKey01412,orderNotificationEventTypeForSellerStatus01412,orderNotificationEventTypeForPaymentStatus01412,orderNotificationEventTypeForDeliveryStatus01412} from '../src/order-notification-lifecycle-core-01412.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01412 maps canonical SellerOrder Payment and Delivery states to order lifecycle events',()=>{
  assert.equal(orderNotificationEventTypeForSellerStatus01412('confirmed'),'order.confirmed');
  assert.equal(orderNotificationEventTypeForSellerStatus01412('processing'),'order.processing');
  assert.equal(orderNotificationEventTypeForSellerStatus01412('shipped'),'order.shipped');
  assert.equal(orderNotificationEventTypeForSellerStatus01412('completed'),'order.delivered');
  assert.equal(orderNotificationEventTypeForSellerStatus01412('cancelled'),'order.cancelled');
  assert.equal(orderNotificationEventTypeForPaymentStatus01412('paid'),'order.paid');
  assert.equal(orderNotificationEventTypeForPaymentStatus01412('failed'),'order.payment_failed');
  assert.equal(orderNotificationEventTypeForPaymentStatus01412('refunded'),'order.refund');
  assert.equal(orderNotificationEventTypeForDeliveryStatus01412('shipped'),'order.shipped');
  assert.equal(orderNotificationEventTypeForDeliveryStatus01412('delivered'),'order.delivered');
});

test('01412 event key is stable per SellerOrder lifecycle type and preserves created receipt compatibility',()=>{
  assert.equal(orderNotificationEventKey01412('seller_1','order.created'),'seller_1');
  assert.equal(orderNotificationEventKey01412('seller_1','order.shipped'),'seller_1:order.shipped');
  assert.equal(orderNotificationEventKey01412('seller_1','order.shipped'),orderNotificationEventKey01412('seller_1','order.shipped'));
});

test('01412 event payload exposes rule fields for total items site store seller and payment status',()=>{
  const event=buildOrderNotificationEvent01412({id:'seller_1',marketplaceOrderId:'mp_1',orderNumber:'MP-1-S01',total:12000,itemsCount:3,status:'processing',payment:{status:'paid',method:'card'},currency:'UAH',sellerProfileId:'sp_1',sellerName:'Seller',storeId:'store_1',buyer:{name:'Ivan'}},'order.paid',{siteId:'site_1',siteName:'Shop'});
  assert.equal(event.data.order.total,12000);assert.equal(event.data.order.itemsCount,3);assert.equal(event.data.order.siteId,'site_1');assert.equal(event.data.order.storeId,'store_1');assert.equal(event.data.order.sellerId,'sp_1');assert.equal(event.data.order.paymentStatus,'paid');assert.equal(event.data.order.buyerName,'Ivan');
});

test('01412 migration creates durable order event journal and backfills created events plus default lifecycle rules',()=>{
  const migration=read('sql/034_order_notification_lifecycle.sql');
  assert.match(migration,/CREATE TABLE IF NOT EXISTS shifttime_order_notification_events/);
  assert.match(migration,/UNIQUE\(store_id,event_key\)/);
  for(const type of ['order.created','order.confirmed','order.processing','order.paid','order.payment_failed','order.cancelled','order.shipped','order.delivered','order.refund'])assert.match(migration,new RegExp(type.replace('.','\\.')));
  assert.match(migration,/034-backfill/);assert.match(migration,/shifttime_notification_rules/);
});

test('01412 hooks lifecycle emissions after business mutations and keeps notification state separate',()=>{
  const orders=read('src/marketplace-order-service.mjs'),payments=read('src/marketplace-payment-service.mjs'),shipping=read('src/marketplace-shipping-service.mjs'),inbox=read('src/notification-inbox-01404.mjs'),service=read('src/order-notification-lifecycle-01412.mjs'),server=read('src/server.mjs');
  assert.match(orders,/emitSellerOrderLifecycleNotification01412/);assert.match(payments,/emitMarketplaceOrderPaymentLifecycleNotifications01412/);assert.match(shipping,/orderNotificationEventTypeForDeliveryStatus01412/);
  assert.match(inbox,/FROM shifttime_order_notification_events e/);assert.match(inbox,/nr\.event_key=e\.event_key/);assert.match(inbox,/event_key=\$1 AND store_id=\$2/);
  assert.match(service,/dispatchNotificationEvent01409/);assert.match(service,/ON CONFLICT\(store_id,event_key\) DO NOTHING/);
  assert.match(server,/siteId:publishedTrafficIdentity\?\.siteId/);
});

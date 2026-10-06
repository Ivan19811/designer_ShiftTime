export const ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412='01412';
export const ORDER_NOTIFICATION_EVENT_TYPES_01412=Object.freeze([
  'order.created','order.confirmed','order.processing','order.paid','order.payment_failed','order.cancelled','order.shipped','order.delivered','order.refund'
]);
const str=value=>String(value??'').trim();
const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const severityByType=Object.freeze({
  'order.created':'low','order.confirmed':'low','order.processing':'low','order.paid':'medium','order.payment_failed':'critical','order.cancelled':'high','order.shipped':'medium','order.delivered':'low','order.refund':'high'
});
const kindByType=Object.freeze({
  'order.created':'order-created','order.confirmed':'order-confirmed','order.processing':'order-processing','order.paid':'order-paid','order.payment_failed':'order-payment-failed','order.cancelled':'order-cancelled','order.shipped':'order-shipped','order.delivered':'order-delivered','order.refund':'order-refund'
});
const titleByType=Object.freeze({
  'order.created':'Order created','order.confirmed':'Order confirmed','order.processing':'Order processing','order.paid':'Order paid','order.payment_failed':'Order payment failed','order.cancelled':'Order cancelled','order.shipped':'Order shipped','order.delivered':'Order delivered','order.refund':'Order refund'
});

export function orderNotificationEventTypeForSellerStatus01412(status=''){
  return ({confirmed:'order.confirmed',processing:'order.processing',shipped:'order.shipped',completed:'order.delivered',cancelled:'order.cancelled'})[str(status)]||'';
}
export function orderNotificationEventTypeForPaymentStatus01412(status=''){
  return ({paid:'order.paid',failed:'order.payment_failed','partially-refunded':'order.refund',refunded:'order.refund'})[str(status)]||'';
}
export function orderNotificationEventTypeForDeliveryStatus01412(status=''){
  return ({shipped:'order.shipped','in-transit':'order.shipped',delivered:'order.delivered'})[str(status)]||'';
}
export function orderNotificationEventKey01412(sellerOrderId,eventType){const id=str(sellerOrderId),type=str(eventType);if(!id||!ORDER_NOTIFICATION_EVENT_TYPES_01412.includes(type))return '';return type==='order.created'?id:`${id}:${type}`;}
export function orderNotificationSeverity01412(eventType){return severityByType[str(eventType)]||'low';}
export function orderNotificationKind01412(eventType){return kindByType[str(eventType)]||'order-created';}
export function normalizeOrderNotificationContext01412(order={},context={}){
  return Object.freeze({
    id:str(order.id||order.sellerOrderId),marketplaceOrderId:str(order.marketplaceOrderId),orderNumber:str(order.orderNumber),
    total:n(order.total??order.grossTotal),itemsCount:Math.max(0,Math.trunc(n(order.itemsCount))),buyerName:str(order.buyerName??order.buyer?.name),status:str(order.status),paymentStatus:str(order.paymentStatus??order.payment?.status),paymentMethod:str(order.paymentMethod??order.payment?.method),currency:str(order.currency)||'UAH',
    sellerId:str(order.sellerId||order.sellerProfileId),sellerName:str(order.sellerName),storeId:str(order.storeId),siteId:str(context.siteId||order.siteId),siteName:str(context.siteName||order.siteName)
  });
}
export function buildOrderNotificationEvent01412(order={},eventType='',context={}){
  const type=ORDER_NOTIFICATION_EVENT_TYPES_01412.includes(str(eventType))?str(eventType):'';if(!type)throw Object.assign(new Error('ORDER_NOTIFICATION_EVENT_TYPE_INVALID_01412'),{code:'ORDER_NOTIFICATION_EVENT_TYPE_INVALID_01412'});
  const normalized=normalizeOrderNotificationContext01412(order,context),eventKey=orderNotificationEventKey01412(normalized.id,type),severity=orderNotificationSeverity01412(type),kind=orderNotificationKind01412(type),source={type:str(context.sourceType),key:str(context.sourceKey)};
  const title=`${titleByType[type]} · ${normalized.orderNumber||normalized.id}`;
  const body=`${normalized.sellerName||'Seller'} · ${normalized.itemsCount} items · ${normalized.total} ${normalized.currency}`;
  return Object.freeze({stage:ORDER_NOTIFICATION_LIFECYCLE_STAGE_01412,eventKey,type,provider:'orders',severity,kind,notification:Object.freeze({title,body}),data:Object.freeze({order:normalized,source:Object.freeze(source)})});
}

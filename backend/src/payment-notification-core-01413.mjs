export const PAYMENT_NOTIFICATION_PROVIDER_STAGE_01413='01413';
export const PAYMENT_NOTIFICATION_EVENT_TYPES_01413=Object.freeze(['payment.succeeded','payment.failed','payment.refunded']);
const str=value=>String(value??'').trim();
const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const severityByType=Object.freeze({'payment.succeeded':'medium','payment.failed':'critical','payment.refunded':'high'});
const kindByType=Object.freeze({'payment.succeeded':'payment-succeeded','payment.failed':'payment-failed','payment.refunded':'payment-refunded'});
const titleByType=Object.freeze({'payment.succeeded':'Payment succeeded','payment.failed':'Payment failed','payment.refunded':'Payment refunded'});

export function paymentNotificationEventTypeForStatus01413(status=''){
  return ({paid:'payment.succeeded',failed:'payment.failed','partially-refunded':'payment.refunded',refunded:'payment.refunded'})[str(status)]||'';
}
export function paymentNotificationEventTypeForCanonicalEvent01413(eventType=''){
  return ({'payment-paid':'payment.succeeded','payment-failed':'payment.failed','payment-partially-refunded':'payment.refunded','payment-refunded':'payment.refunded'})[str(eventType)]||'';
}
export function paymentNotificationSeverity01413(eventType=''){return severityByType[str(eventType)]||'low';}
export function paymentNotificationKind01413(eventType=''){return kindByType[str(eventType)]||'payment-succeeded';}
export function normalizePaymentNotificationContext01413(payment={},allocation={}){
  return Object.freeze({
    id:str(payment.id||payment.paymentId),marketplaceOrderId:str(payment.marketplaceOrderId),orderNumber:str(payment.orderNumber||payment.marketplaceOrderNumber),
    provider:str(payment.provider),providerPaymentId:str(payment.providerPaymentId),method:str(payment.method),status:str(payment.status),currentStatus:str(payment.currentStatus||payment.status),currency:str(payment.currency)||'UAH',
    amount:n(payment.amount),refundedAmount:n(payment.refundedAmount),storeId:str(allocation.storeId||payment.storeId),sellerOrderId:str(allocation.sellerOrderId),sellerName:str(allocation.sellerName),
    storeGross:n(allocation.storeGross??allocation.gross),storeRefundedGross:n(allocation.storeRefundedGross??allocation.refundedGross),storeCommission:n(allocation.storeCommission??allocation.commission),storeSellerNet:n(allocation.storeSellerNet??allocation.sellerNet)
  });
}
export function buildPaymentNotificationEvent01413({eventId='',canonicalEventType='',createdAt='',eventPayload={}}={},payment={},allocation={}){
  const type=paymentNotificationEventTypeForCanonicalEvent01413(canonicalEventType)||paymentNotificationEventTypeForStatus01413(payment.status);
  if(!PAYMENT_NOTIFICATION_EVENT_TYPES_01413.includes(type))throw Object.assign(new Error('PAYMENT_NOTIFICATION_EVENT_TYPE_INVALID_01413'),{code:'PAYMENT_NOTIFICATION_EVENT_TYPE_INVALID_01413'});
  const normalized=normalizePaymentNotificationContext01413(payment,allocation),eventKey=str(eventId);
  if(!eventKey)throw Object.assign(new Error('PAYMENT_NOTIFICATION_EVENT_KEY_REQUIRED_01413'),{code:'PAYMENT_NOTIFICATION_EVENT_KEY_REQUIRED_01413'});
  const severity=paymentNotificationSeverity01413(type),kind=paymentNotificationKind01413(type),title=`${titleByType[type]} · ${normalized.orderNumber||normalized.id}`;
  const amount=type==='payment.refunded'?(normalized.storeRefundedGross||normalized.refundedAmount):(normalized.storeGross||normalized.amount);
  const body=`${normalized.sellerName||'Store'} · ${amount} ${normalized.currency}`;
  return Object.freeze({stage:PAYMENT_NOTIFICATION_PROVIDER_STAGE_01413,eventKey,type,provider:'payments',severity,kind,occurredAt:str(createdAt),notification:Object.freeze({title,body}),data:Object.freeze({payment:normalized,canonical:Object.freeze({eventType:str(canonicalEventType),payload:eventPayload&&typeof eventPayload==='object'?eventPayload:{}})})});
}

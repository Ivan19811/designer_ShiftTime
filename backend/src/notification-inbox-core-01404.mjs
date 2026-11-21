export const NOTIFICATION_INBOX_STAGE_01404='01404';
const str=v=>String(v??'').trim();
const clip=(v,n)=>str(v).slice(0,n);
const allowedChannels=new Set(['contact-form','product-question','chat','callback','other']);
const allowedReceiptStatuses=new Set(['read','dismissed']);

export function normalizeCustomerMessageInput01404(input={}){
  const customer=input.customer&&typeof input.customer==='object'?input.customer:{};
  const context=input.context&&typeof input.context==='object'?input.context:{};
  const channel=allowedChannels.has(str(input.channel))?str(input.channel):'contact-form';
  const body=clip(input.body??input.message,4000);
  if(body.length<2){const e=new Error('CUSTOMER_MESSAGE_BODY_REQUIRED_01404');e.code='CUSTOMER_MESSAGE_BODY_REQUIRED_01404';e.statusCode=400;throw e;}
  return Object.freeze({
    channel,
    subject:clip(input.subject,160),
    body,
    customer:Object.freeze({name:clip(customer.name??input.name,120),email:clip(customer.email??input.email,254),phone:clip(customer.phone??input.phone,80)}),
    context:Object.freeze({pagePath:clip(context.pagePath??input.pagePath,500),productId:clip(context.productId??input.productId,160),productName:clip(context.productName??input.productName,240),referrer:clip(context.referrer,500)}),
  });
}

export function normalizeNotificationReceiptStatus01404(value=''){
  return allowedReceiptStatuses.has(str(value))?str(value):'unread';
}

export function orderNotificationSeverity01404(order={}){
  if(str(order.status)==='cancelled')return 'warning';
  return 'info';
}

export function customerMessageSeverity01404(message={}){
  return str(message.status)==='spam'?'warning':'info';
}

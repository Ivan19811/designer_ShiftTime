import crypto from 'node:crypto';

export const NOTIFICATION_DELIVERY_STAGE_01409='01409';
export const NOTIFICATION_EXTERNAL_CHANNELS_01409=Object.freeze(['email','telegram','webhook','slack']);
const str=value=>String(value??'').trim();
const obj=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const clip=(value,length)=>str(value).slice(0,length);

export function normalizeNotificationDeliveryEvent01409(input={}){
  const data=obj(input.data),notification=obj(input.notification);
  return Object.freeze({
    eventKey:clip(input.eventKey||input.id,240),
    type:clip(input.type||input.eventType,160),
    provider:clip(input.provider,80),
    severity:['low','medium','high','critical'].includes(str(input.severity))?str(input.severity):'low',
    occurredAt:str(input.occurredAt)||new Date().toISOString(),
    notification:Object.freeze({title:clip(notification.title||input.title||input.type||input.eventType||'ShiftTime notification',240),body:clip(notification.body||input.body,5000)}),
    data:Object.freeze({...data})
  });
}

function jsonSummary(value,max=1800){
  try{const text=JSON.stringify(value);return text.length>max?`${text.slice(0,max-1)}…`:text;}catch{return '';} 
}
export function buildNotificationTransportMessage01409(eventInput={},scope={}){
  const event=normalizeNotificationDeliveryEvent01409(eventInput),title=event.notification.title||`ShiftTime · ${event.type}`;
  const fallback=[`Event: ${event.type}`,event.eventKey?`Key: ${event.eventKey}`:'',scope.storeId?`Store: ${scope.storeId}`:'',jsonSummary(event.data)].filter(Boolean).join('\n');
  const body=event.notification.body||fallback;
  return Object.freeze({
    subject:clip(`[ShiftTime] ${title}`,240),
    title:clip(title,240),
    text:clip(`${title}\n\n${body}`,12000),
    event
  });
}

export function notificationWebhookSignature01409(secret,body){return `sha256=${crypto.createHmac('sha256',String(secret||'')).update(String(body||'')).digest('hex')}`;}
export function maskNotificationDestination01409(value=''){
  const s=str(value);if(!s)return '';
  if(s.includes('@')){const [a,b]=s.split('@');return `${a.slice(0,2)}${a.length>2?'***':''}@${b}`;}
  if(s.length<=6)return '***';return `${s.slice(0,3)}***${s.slice(-3)}`;
}

export function notificationTransportStatus01409(settings={}){
  const emailConfigured=Boolean(str(settings.notificationSmtpHost)&&str(settings.notificationEmailFrom)&&str(settings.notificationEmailTo));
  const telegramConfigured=Boolean(str(settings.notificationTelegramBotToken)&&str(settings.notificationTelegramChatId));
  const webhookConfigured=Boolean(str(settings.notificationWebhookUrl));
  return Object.freeze({stage:NOTIFICATION_DELIVERY_STAGE_01409,channels:Object.freeze({
    inApp:Object.freeze({channel:'inApp',state:'live',configured:true}),
    email:Object.freeze({channel:'email',state:emailConfigured?'live':'not_configured',configured:emailConfigured,destination:emailConfigured?maskNotificationDestination01409(settings.notificationEmailTo):''}),
    telegram:Object.freeze({channel:'telegram',state:telegramConfigured?'live':'not_configured',configured:telegramConfigured,destination:telegramConfigured?maskNotificationDestination01409(settings.notificationTelegramChatId):''}),
    webhook:Object.freeze({channel:'webhook',state:webhookConfigured?'live':'not_configured',configured:webhookConfigured,destination:webhookConfigured?'configured':''}),
    slack:Object.freeze({channel:'slack',state:'prepared',configured:false})
  })});
}

export function publicNotificationDeliveryRow01409(row={}){
  return Object.freeze({id:str(row.id),eventKey:str(row.event_key??row.eventKey),eventType:str(row.event_type??row.eventType),provider:str(row.provider),channel:str(row.channel),severity:str(row.severity),status:str(row.status),attemptCount:Number(row.attempt_count??row.attemptCount)||0,responseCode:Number(row.response_code??row.responseCode)||0,errorCode:str(row.error_code??row.errorCode),errorDetail:clip(row.error_detail??row.errorDetail,500),externalId:str(row.external_id??row.externalId),recipientKey:str(row.recipient_key??row.recipientKey)||'default',recipientUserId:str(row.recipient_user_id??row.recipientUserId),recipientRole:str(row.recipient_role??row.recipientRole),recipientName:str(row.recipient_name??row.recipientName),recipientEmail:maskNotificationDestination01409(row.recipient_email??row.recipientEmail),matchedRuleIds:Array.isArray(row.matched_rule_ids??row.matchedRuleIds)?(row.matched_rule_ids??row.matchedRuleIds):[],createdAt:row.created_at??row.createdAt??'',updatedAt:row.updated_at??row.updatedAt??'',lastAttemptAt:row.last_attempt_at??row.lastAttemptAt??'',sentAt:row.sent_at??row.sentAt??'',stage:NOTIFICATION_DELIVERY_STAGE_01409});
}

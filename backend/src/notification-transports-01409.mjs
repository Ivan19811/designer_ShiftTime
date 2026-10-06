import {config} from './config.mjs';
import {buildNotificationTransportMessage01409,notificationWebhookSignature01409,notificationTransportStatus01409,NOTIFICATION_DELIVERY_STAGE_01409} from './notification-delivery-core-01409.mjs';
import {sendSmtpMail01409} from './smtp-send-01409.mjs';
const str=value=>String(value??'').trim();
const withTimeout=async(promise,timeoutMs,code)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error(code),{code})),timeoutMs);})]);}finally{clearTimeout(timer);}};
function settingsFromConfig(){return config;}
export function getNotificationTransportStatus01409(settings=settingsFromConfig()){return notificationTransportStatus01409(settings);}

export async function sendTelegramNotification01409(scope,event,{fetchImpl=globalThis.fetch,settings=settingsFromConfig()}={}){
  const token=str(settings.notificationTelegramBotToken),chatId=str(settings.notificationTelegramChatId);if(!token||!chatId)throw Object.assign(new Error('NOTIFICATION_TELEGRAM_NOT_CONFIGURED_01409'),{code:'NOTIFICATION_TELEGRAM_NOT_CONFIGURED_01409'});
  const message=buildNotificationTransportMessage01409(event,scope),url=`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,timeoutMs=Math.max(1000,Number(settings.notificationDeliveryTimeoutMs)||10000);
  const response=await withTimeout(fetchImpl(url,{method:'POST',headers:{'content-type':'application/json','user-agent':'ShiftTime-Notification-01409'},body:JSON.stringify({chat_id:chatId,text:message.text.slice(0,4096),disable_web_page_preview:true})}),timeoutMs,'NOTIFICATION_TELEGRAM_TIMEOUT_01409');
  let data={};try{data=await response.json();}catch{}
  if(!response.ok||data?.ok===false){const error=new Error('NOTIFICATION_TELEGRAM_FAILED_01409');error.code='NOTIFICATION_TELEGRAM_FAILED_01409';error.statusCode=response.status;error.detail=str(data?.description).slice(0,300);throw error;}
  return {ok:true,channel:'telegram',responseCode:response.status,externalId:str(data?.result?.message_id),stage:NOTIFICATION_DELIVERY_STAGE_01409};
}

export async function sendWebhookNotification01409(scope,event,{fetchImpl=globalThis.fetch,settings=settingsFromConfig()}={}){
  const url=str(settings.notificationWebhookUrl);if(!url)throw Object.assign(new Error('NOTIFICATION_WEBHOOK_NOT_CONFIGURED_01409'),{code:'NOTIFICATION_WEBHOOK_NOT_CONFIGURED_01409'});
  const message=buildNotificationTransportMessage01409(event,scope),payload={stage:NOTIFICATION_DELIVERY_STAGE_01409,scope:{accountId:scope.accountId||'',workspaceId:scope.workspaceId||'',storeId:scope.storeId||''},event:message.event,notification:{title:message.title,text:message.text}},body=JSON.stringify(payload),headers={'content-type':'application/json','user-agent':'ShiftTime-Notification-01409','x-shifttime-event':message.event.type,'x-shifttime-event-key':message.event.eventKey};
  if(str(settings.notificationWebhookSecret))headers['x-shifttime-signature']=notificationWebhookSignature01409(settings.notificationWebhookSecret,body);
  const timeoutMs=Math.max(1000,Number(settings.notificationDeliveryTimeoutMs)||10000),response=await withTimeout(fetchImpl(url,{method:'POST',headers,body}),timeoutMs,'NOTIFICATION_WEBHOOK_TIMEOUT_01409');
  if(!response.ok){const error=new Error('NOTIFICATION_WEBHOOK_FAILED_01409');error.code='NOTIFICATION_WEBHOOK_FAILED_01409';error.statusCode=response.status;throw error;}
  return {ok:true,channel:'webhook',responseCode:response.status,externalId:str(response.headers?.get?.('x-request-id')),stage:NOTIFICATION_DELIVERY_STAGE_01409};
}

export async function sendEmailNotification01409(scope,event,{smtpSendImpl=sendSmtpMail01409,settings=settingsFromConfig()}={}){
  if(!str(settings.notificationSmtpHost)||!str(settings.notificationEmailFrom)||!str(settings.notificationEmailTo))throw Object.assign(new Error('NOTIFICATION_EMAIL_NOT_CONFIGURED_01409'),{code:'NOTIFICATION_EMAIL_NOT_CONFIGURED_01409'});
  const message=buildNotificationTransportMessage01409(event,scope),result=await smtpSendImpl({host:settings.notificationSmtpHost,port:settings.notificationSmtpPort,secure:settings.notificationSmtpSecure,startTls:settings.notificationSmtpStartTls,user:settings.notificationSmtpUser,pass:settings.notificationSmtpPass,timeoutMs:settings.notificationDeliveryTimeoutMs,helloName:settings.notificationSmtpHelloName},{from:settings.notificationEmailFrom,to:settings.notificationEmailTo,subject:message.subject,text:message.text});
  return {ok:true,channel:'email',responseCode:Number(result?.responseCode)||250,externalId:str(result?.externalId),stage:NOTIFICATION_DELIVERY_STAGE_01409};
}

export async function sendNotificationTransport01409(channel,scope,event,options={}){
  if(channel==='telegram')return sendTelegramNotification01409(scope,event,options);
  if(channel==='webhook')return sendWebhookNotification01409(scope,event,options);
  if(channel==='email')return sendEmailNotification01409(scope,event,options);
  const error=new Error('NOTIFICATION_TRANSPORT_UNSUPPORTED_01409');error.code='NOTIFICATION_TRANSPORT_UNSUPPORTED_01409';throw error;
}

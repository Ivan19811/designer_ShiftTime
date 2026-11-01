// 01612B | Server-only transactional email. HTTPS Brevo preferred; existing SMTP fallback.
import {config} from './config.mjs';
import {sendSmtpMail01409} from './smtp-send-01409.mjs';

const str=value=>String(value??'').trim();
const fail=code=>Object.assign(new Error(code),{code});
const email=value=>{
 const s=str(value).replace(/[\r\n]/g,'');
 const match=s.match(/^(?:([^<>]*?)\s*<)?([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>?$/);
 if(!match)throw fail('EMAIL_TRANSPORT_ADDRESS_INVALID_01612B');
 return {name:str(match[1])||'ShiftTime',email:match[2]};
};
export const isBrevoConfigured01612B=settings=>Boolean(str(settings?.brevoApiKey)&&str(settings?.notificationEmailFrom));
export const emailTransportConfigured01612B=settings=>Boolean(str(settings?.notificationEmailFrom)&&(str(settings?.brevoApiKey)||(str(settings?.notificationSmtpHost)&&(settings?.notificationSmtpSecure===true||settings?.notificationSmtpStartTls===true))));
export function emailTransportOptions01612B(settings=config){
 if(!emailTransportConfigured01612B(settings))throw fail('EMAIL_TRANSPORT_NOT_CONFIGURED_01612B');
 if(str(settings.brevoApiKey))return {provider:'brevo',apiKey:settings.brevoApiKey,timeoutMs:settings.notificationDeliveryTimeoutMs||10000};
 return {provider:'smtp',host:settings.notificationSmtpHost,port:settings.notificationSmtpPort,secure:settings.notificationSmtpSecure,startTls:settings.notificationSmtpStartTls,user:settings.notificationSmtpUser,pass:settings.notificationSmtpPass,timeoutMs:settings.notificationDeliveryTimeoutMs||10000,helloName:settings.notificationSmtpHelloName};
}
export async function sendPlatformEmail01612B(options={},message={},{fetchImpl=globalThis.fetch,smtpSendImpl=sendSmtpMail01409}={}){
 if(options.provider!=='brevo')return smtpSendImpl(options,message);
 if(!str(options.apiKey))throw fail('EMAIL_TRANSPORT_NOT_CONFIGURED_01612B');
 const sender=email(message.from),recipient=email(message.to),subject=str(message.subject).replace(/[\r\n]/g,' ').slice(0,250),body=String(message.text??'');
 if(!subject||!body||body.length>200000)throw fail('EMAIL_TRANSPORT_MESSAGE_INVALID_01612B');
 const timeoutMs=Math.max(1000,Math.min(60000,Number(options.timeoutMs)||10000));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl('https://api.brevo.com/v3/smtp/email',{
   method:'POST',headers:{'api-key':options.apiKey,'accept':'application/json','content-type':'application/json'},
   body:JSON.stringify({sender,to:[{email:recipient.email}],subject,textContent:body}),signal:controller.signal
  });
  if(!response||response.status!==201||!response.ok){
   // Do not reflect provider response, credentials, email, or reset links in errors.
   const error=fail('EMAIL_TRANSPORT_BREVO_FAILED_01612B');error.statusCode=Number(response?.status)||503;throw error;
  }
  const payload=await response.json().catch(()=>({}));
  return {ok:true,provider:'brevo',responseCode:201,externalId:str(payload?.messageId).slice(0,255)};
 }catch(error){
  if(error?.code==='EMAIL_TRANSPORT_BREVO_FAILED_01612B')throw error;
  throw fail(error?.name==='AbortError'?'EMAIL_TRANSPORT_BREVO_TIMEOUT_01612B':'EMAIL_TRANSPORT_BREVO_UNAVAILABLE_01612B');
 }finally{clearTimeout(timer);}
}

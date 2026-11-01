// 01611. Telegram Gateway / Twilio Verify official verification transports. Viber requires approved business account.
import {messengerError01609} from './messenger-core-01609.mjs';
const get=(key,env)=>String(env[key]||'').trim();
export function providerStatus01611(env=process.env){
  const key=get('MESSENGER_CONTACT_SECRET_01611',env).length>=32;
  const telegram=key&&Boolean(get('TELEGRAM_GATEWAY_TOKEN',env));
  const twilio=key&&/^VA[a-f0-9]{32}$/i.test(get('TWILIO_VERIFY_SERVICE_SID',env))
    &&/^AC[a-f0-9]{32}$/i.test(get('TWILIO_ACCOUNT_SID',env))
    &&get('TWILIO_AUTH_TOKEN',env).length>=20;
  return {sms:twilio,telegram,whatsapp:twilio&&get('MESSENGER_TWILIO_WHATSAPP_ENABLED_01611',env)==='1',viber:false};
}
async function requestJson01611(url,opts){
  let response;
  try{response=await fetch(url,{...opts,signal:AbortSignal.timeout(12000)});}catch{throw messengerError01609('MESSENGER_PROVIDER_UNAVAILABLE_01611',502);}
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok===false)throw messengerError01609('MESSENGER_PROVIDER_REJECTED_01611',502);
  return data;
}
async function telegramRequest(method,body,env){
  const data=await requestJson01611('https://gatewayapi.telegram.org/'+method,{
    method:'POST',headers:{'Authorization':'Bearer '+get('TELEGRAM_GATEWAY_TOKEN',env),'content-type':'application/json'},body:JSON.stringify(body)
  });
  return data.result||{};
}
async function twilioRequest(path,body,env){
  const sid=get('TWILIO_VERIFY_SERVICE_SID',env);
  if(!/^VA[a-f0-9]{32}$/i.test(sid))throw messengerError01609('MESSENGER_PROVIDER_NOT_CONFIGURED_01611',503);
  const user=get('TWILIO_ACCOUNT_SID',env),secret=get('TWILIO_AUTH_TOKEN',env);
  return requestJson01611('https://verify.twilio.com/v2/Services/'+sid+'/'+path,{
    method:'POST',headers:{Authorization:'Basic '+Buffer.from(user+':'+secret).toString('base64'),'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)
  });
}
export async function startProviderVerification01611(channel,phone,env=process.env){
  if(!providerStatus01611(env)[channel])throw messengerError01609('MESSENGER_CHANNEL_NOT_CONFIGURED_01611',503);
  if(channel==='telegram'){
    const result=await telegramRequest('sendVerificationMessage',{phone_number:phone,code_length:6,ttl:300},env);
    if(!result.request_id)throw messengerError01609('MESSENGER_PROVIDER_REJECTED_01611',502);
    return {provider:'telegram_gateway',requestId:result.request_id};
  }
  if(channel==='sms'||channel==='whatsapp'){
    const result=await twilioRequest('Verifications',{To:phone,Channel:channel==='sms'?'sms':'whatsapp'},env);
    if(result.status!=='pending')throw messengerError01609('MESSENGER_PROVIDER_REJECTED_01611',502);
    return {provider:'twilio_verify',requestId:result.sid||''};
  }
  throw messengerError01609('MESSENGER_CHANNEL_NOT_CONFIGURED_01611',503);
}
export async function checkProviderVerification01611(channel,phone,providerRequestId,code,env=process.env){
  if(!providerStatus01611(env)[channel])throw messengerError01609('MESSENGER_CHANNEL_NOT_CONFIGURED_01611',503);
  if(channel==='telegram'){
    const status=await telegramRequest('checkVerificationStatus',{request_id:providerRequestId,code},env);
    return status?.verification_status?.status==='code_valid';
  }
  if(channel==='sms'||channel==='whatsapp'){
    const status=await twilioRequest('VerificationCheck',{To:phone,Code:code},env);
    return status.status==='approved'&&status.valid!==false;
  }
  return false;
}

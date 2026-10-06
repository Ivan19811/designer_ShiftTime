export const NOTIFICATION_PREFERENCES_STAGE_01417='01417';
export const NOTIFICATION_PREFERENCE_TIMEZONES_01417=Object.freeze(['Europe/Kyiv','UTC']);
export const NOTIFICATION_PREFERENCE_ESCALATION_ROLES_01417=Object.freeze(['owner','admin','manager']);
const str=value=>String(value??'').trim();
const bool=(value,fallback=false)=>typeof value==='boolean'?value:fallback;
const arr=value=>Array.isArray(value)?value:[];
const int=(value,fallback,min,max)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;};
const severityRank=value=>({low:1,medium:2,high:3,critical:4}[str(value)]||0);
const hhmm=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(str(value))?str(value):'';
const timezone=value=>{const next=str(value)||'Europe/Kyiv';try{new Intl.DateTimeFormat('en-US',{timeZone:next}).format(new Date());return next;}catch{return 'Europe/Kyiv';}};
export function defaultNotificationPreferences01417(){return Object.freeze({quietHours:Object.freeze({enabled:false,start:'22:00',end:'08:00',timezone:'Europe/Kyiv',criticalBypass:true}),digest:Object.freeze({enabled:true,intervalMinutes:60,maxItems:50}),grouping:Object.freeze({enabled:true,windowMinutes:30}),dedupe:Object.freeze({enabled:true,windowMinutes:5}),escalation:Object.freeze({enabled:false,afterMinutes:30,severityAtLeast:'high',roles:Object.freeze(['owner','admin']),channels:Object.freeze(['email'])})});}
export function normalizeNotificationPreferences01417(input={}){
  const defaults=defaultNotificationPreferences01417(),quiet=input?.quietHours||{},digest=input?.digest||{},grouping=input?.grouping||{},dedupe=input?.dedupe||{},escalation=input?.escalation||{};
  const severity=['low','medium','high','critical'].includes(str(escalation.severityAtLeast))?str(escalation.severityAtLeast):defaults.escalation.severityAtLeast;
  const roles=[...new Set(arr(escalation.roles).map(str).filter(x=>NOTIFICATION_PREFERENCE_ESCALATION_ROLES_01417.includes(x)))];
  const channels=[...new Set(arr(escalation.channels).map(str).filter(x=>['email','telegram','webhook'].includes(x)))];
  return Object.freeze({
    quietHours:Object.freeze({enabled:bool(quiet.enabled,defaults.quietHours.enabled),start:hhmm(quiet.start)||defaults.quietHours.start,end:hhmm(quiet.end)||defaults.quietHours.end,timezone:timezone(quiet.timezone),criticalBypass:bool(quiet.criticalBypass,defaults.quietHours.criticalBypass)}),
    digest:Object.freeze({enabled:bool(digest.enabled,defaults.digest.enabled),intervalMinutes:int(digest.intervalMinutes,defaults.digest.intervalMinutes,5,1440),maxItems:int(digest.maxItems,defaults.digest.maxItems,2,200)}),
    grouping:Object.freeze({enabled:bool(grouping.enabled,defaults.grouping.enabled),windowMinutes:int(grouping.windowMinutes,defaults.grouping.windowMinutes,1,1440)}),
    dedupe:Object.freeze({enabled:bool(dedupe.enabled,defaults.dedupe.enabled),windowMinutes:int(dedupe.windowMinutes,defaults.dedupe.windowMinutes,1,1440)}),
    escalation:Object.freeze({enabled:bool(escalation.enabled,defaults.escalation.enabled),afterMinutes:int(escalation.afterMinutes,defaults.escalation.afterMinutes,5,10080),severityAtLeast:severity,roles:Object.freeze(roles.length?roles:defaults.escalation.roles),channels:Object.freeze(channels.length?channels:defaults.escalation.channels)})
  });
}
function localMinutes01417(date,timeZone){const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);const h=Number(parts.find(x=>x.type==='hour')?.value||0),m=Number(parts.find(x=>x.type==='minute')?.value||0);return h*60+m;}
const hmMinutes=value=>{const [h,m]=str(value).split(':').map(Number);return h*60+m;};
export function notificationIsQuietHours01417(preferencesInput={},nowInput=new Date()){
  const preferences=normalizeNotificationPreferences01417(preferencesInput),quiet=preferences.quietHours;if(!quiet.enabled)return false;
  const start=hmMinutes(quiet.start),end=hmMinutes(quiet.end),current=localMinutes01417(new Date(nowInput),quiet.timezone);
  if(start===end)return true;
  return start<end?current>=start&&current<end:current>=start||current<end;
}
export function notificationQuietEndAt01417(preferencesInput={},nowInput=new Date()){
  const preferences=normalizeNotificationPreferences01417(preferencesInput),quiet=preferences.quietHours,now=new Date(nowInput);if(!quiet.enabled||!notificationIsQuietHours01417(preferences,now))return now.toISOString();
  const current=localMinutes01417(now,quiet.timezone),end=hmMinutes(quiet.end),start=hmMinutes(quiet.start);let delta;
  if(start<end)delta=end-current;else delta=current<end?end-current:(24*60-current)+end;
  return new Date(now.getTime()+Math.max(1,delta)*60000).toISOString();
}
export function notificationPreferenceMode01417({preferences:input={},severity='low',ruleDelivery='immediate',now=new Date()}={}){
  const preferences=normalizeNotificationPreferences01417(input),critical=severityRank(severity)>=severityRank('critical');
  if(critical&&preferences.quietHours.criticalBypass)return Object.freeze({mode:'immediate',reason:'critical_bypass',dueAt:new Date(now).toISOString()});
  if(notificationIsQuietHours01417(preferences,now))return Object.freeze({mode:'deferred',reason:'quiet_hours',dueAt:notificationQuietEndAt01417(preferences,now)});
  if(str(ruleDelivery)==='digest'&&preferences.digest.enabled)return Object.freeze({mode:'digest',reason:'rule_digest',dueAt:new Date(new Date(now).getTime()+preferences.digest.intervalMinutes*60000).toISOString()});
  return Object.freeze({mode:'immediate',reason:'immediate',dueAt:new Date(now).toISOString()});
}
function firstId01417(data={}){for(const key of ['sourceId','siteId','storeId','sellerId','sellerProfileId','productId','orderId','paymentId','messageId','deploymentId','integration','operation']){const value=str(data?.[key]);if(value)return `${key}:${value}`;}for(const group of ['order','payment','message','site','traffic','storage','risk']){const node=data?.[group];if(node&&typeof node==='object'){for(const key of ['id','siteId','storeId','sellerId','productId','orderId','paymentId','messageId','sourceId','integration','operation']){const value=str(node?.[key]);if(value)return `${group}.${key}:${value}`;}}}return '';}
export function notificationGroupKey01417(event={},channel='',recipientKey='default'){return [str(event.provider),str(event.type||event.eventType),str(channel),str(recipientKey)||'default'].filter(Boolean).join('|').slice(0,600);}
export function notificationFingerprint01417(event={},channel='',recipientKey='default'){const notification=event.notification||{},id=firstId01417(event.data||{});return [notificationGroupKey01417(event,channel,recipientKey),id,str(notification.title),str(notification.body),str(event.severity)].join('|').slice(0,1800);}
export function notificationShouldEscalate01417(preferencesInput={},severity='low'){const preferences=normalizeNotificationPreferences01417(preferencesInput);return preferences.escalation.enabled&&severityRank(severity)>=severityRank(preferences.escalation.severityAtLeast);}
export function notificationDigestDueAt01417(preferencesInput={},mode='digest',nowInput=new Date()){const preferences=normalizeNotificationPreferences01417(preferencesInput),now=new Date(nowInput);if(mode==='deferred')return notificationQuietEndAt01417(preferences,now);return new Date(now.getTime()+preferences.digest.intervalMinutes*60000).toISOString();}

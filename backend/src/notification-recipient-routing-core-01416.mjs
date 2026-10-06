export const NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416='01416';
export const NOTIFICATION_RECIPIENT_ROLES_01416=Object.freeze(['owner','admin','manager','editor','catalog-manager','order-manager','viewer']);
const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const clip=(value,length)=>str(value).slice(0,length);
const roleSet=new Set(NOTIFICATION_RECIPIENT_ROLES_01416);

export function normalizeNotificationRecipientSelector01416(input={}){
  const type=str(input?.type);
  if(type==='user'){
    const userId=clip(input.userId||input.id,180);
    return userId?Object.freeze({type:'user',userId}):null;
  }
  if(type==='role'){
    const role=clip(input.role||input.value,80);
    return roleSet.has(role)?Object.freeze({type:'role',role}):null;
  }
  return null;
}

export function normalizeNotificationRecipients01416(input=[]){
  const seen=new Set(),out=[];
  for(const item of arr(input)){
    const selector=normalizeNotificationRecipientSelector01416(item);if(!selector)continue;
    const key=selector.type==='user'?`user:${selector.userId}`:`role:${selector.role}`;
    if(seen.has(key))continue;seen.add(key);out.push(selector);
  }
  return Object.freeze(out.slice(0,64));
}

export function notificationRecipientMatches01416(selectors=[],recipient={}){
  const normalized=normalizeNotificationRecipients01416(selectors);
  if(!normalized.length)return true;
  const userId=str(recipient.userId||recipient.id),role=str(recipient.role);
  return normalized.some(selector=>selector.type==='user'?selector.userId===userId:selector.role===role);
}

export function notificationMatchedRulesForChannel01416(decision={},channel=''){
  const ch=str(channel);
  return arr(decision?.matched).filter(rule=>arr(rule?.actions?.channels).includes(ch));
}

export function notificationDecisionAllowsInAppRecipient01416(decision={},recipient={}){
  const rules=notificationMatchedRulesForChannel01416(decision,'inApp');
  if(!rules.length)return false;
  return rules.some(rule=>notificationRecipientMatches01416(rule?.actions?.recipients,recipient));
}

export function notificationRecipientSelectorsForChannel01416(decision={},channel=''){
  const rules=notificationMatchedRulesForChannel01416(decision,channel),selectors=[];let hasDefault=false;
  for(const rule of rules){
    const recipients=normalizeNotificationRecipients01416(rule?.actions?.recipients);
    if(!recipients.length){hasDefault=true;continue;}
    selectors.push(...recipients);
  }
  return Object.freeze({hasDefault,selectors:normalizeNotificationRecipients01416(selectors),matchedRuleIds:Object.freeze(rules.map(rule=>str(rule?.id)).filter(Boolean))});
}

export function notificationRecipientKey01416(recipient={}){
  const userId=str(recipient.userId||recipient.id);return userId?`user:${userId}`:'default';
}

const recipientRoleRank01416=role=>({owner:1,admin:2,manager:3,editor:4,'catalog-manager':5,'order-manager':5,viewer:6}[str(role)]||99);
export function normalizeNotificationRecipientCatalog01416(rows=[]){const byUser=new Map();for(const raw of arr(rows)){const item=Object.freeze({userId:str(raw?.userId??raw?.user_id),name:str(raw?.name),email:str(raw?.email),role:str(raw?.role),membershipId:str(raw?.membershipId??raw?.membership_id),scopeMode:str(raw?.scopeMode??raw?.scope_mode)||'store'});if(!item.userId||!item.role)continue;const prev=byUser.get(item.userId);if(!prev||recipientRoleRank01416(item.role)<recipientRoleRank01416(prev.role))byUser.set(item.userId,item);}return [...byUser.values()].sort((a,b)=>recipientRoleRank01416(a.role)-recipientRoleRank01416(b.role)||a.name.localeCompare(b.name,'uk')||a.email.localeCompare(b.email,'uk'));}

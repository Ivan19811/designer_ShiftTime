// ShiftTime 01605B · precise notification/customer-inbox authorization.
// Store-wide operations NEVER consume a site-only grant. Classify known methods only.
const decision=(permission,legacy='write')=>Object.freeze({permission,siteId:'',legacy});
export function classifyNotificationAccess01605B(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||p[2]!=='notifications')return null;
  const resource=p[3]||'',op=p[5]||'';
  if(m==='GET'&&p.length===4){
    if(resource==='messages')return decision('crm.messages.view','order-write');
    if(resource==='sites')return decision('site.pages.view','order-write');
    if(resource==='traffic')return decision('shop.notifications.view','order-write');
    if(resource==='deliveries')return decision('shop.notifications.view','read');
    if(resource==='recipients')return decision('shop.notifications.view','order-write');
    if(resource==='rules')return decision('shop.notifications.view','read');
  }
  if(resource==='messages'&&p[4]==='inbox'){
    if(m==='GET'&&(p.length===5||p.length===6))return decision('crm.messages.view','order-write');
    if(m==='PATCH'&&p.length===6&&p[5])return decision('crm.messages.manage');
    if(m==='POST'&&p.length===7&&p[5]&&p[6]==='thread')return decision('crm.messages.reply');
  }
  if(resource==='transports'&&p[4]==='status'&&m==='GET'&&p.length===5)return decision('builder.integrations.view','read');
  if(resource==='transports'&&m==='POST'&&p[4]&&op==='test'&&p.length===6)return decision('builder.integrations.manage');
  if(resource==='deliveries'&&m==='POST'&&p[4]&&op==='retry'&&p.length===6)return decision('shop.notifications.manage');
  if(resource==='preferences'&&p[4]==='stats'&&p.length===5&&m==='GET')return decision('shop.notifications.view','read');
  // PUT /preferences has two security modes: personal prefs versus store-wide prefs.
  // Read target once with bounded JSON, then authorize in the actual route BEFORE the write.
  if(resource==='rules'){
    if(m==='POST'&&p.length===4)return decision('shop.notifications.manage');
    if(p[4]&&p.length===5&&['PUT','DELETE'].includes(m))return decision('shop.notifications.manage');
    if(p[4]&&p.length===6&&op==='duplicate'&&m==='POST')return decision('shop.notifications.manage');
  }
  if(['orders','messages','payments','sites','traffic'].includes(resource)&&p[4]&&p.length===6&&m==='POST'&&['read','dismiss'].includes(op)){
    const code={orders:'shop.orders.view',messages:'crm.messages.view',payments:'shop.payments.view',sites:'site.pages.view',traffic:'shop.notifications.view'}[resource];
    return decision(code,'write');
  }
  return null;
}

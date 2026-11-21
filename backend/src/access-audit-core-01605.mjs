// ShiftTime 01605 · Explicit security-audit corrections, before 01600/01601 classifiers.
// No user-visible text, no runtime schema changes, and no untrusted URL/body authority.
const upper=x=>String(x||'').toUpperCase();
const decision=(permission,legacy='write')=>Object.freeze({permission,siteId:'',legacy});
export function classifyAuditedAction01605(method,parts){
  const m=upper(method),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1')return null;
  if(p[2]==='marketplace'&&p[3]==='feeds'){
    // The existing 01600 fallback treated feeds as products. The UI already uses
    // builder.integrations.*; evaluate that exact permission on the backend too.
    if(m==='GET'&&(p.length===4||p.length===5))return decision('builder.integrations.view','read');
    if(m==='POST'&&p.length===4)return decision('builder.integrations.manage');
    if(['PATCH','DELETE'].includes(m)&&p.length===5)return decision('builder.integrations.manage');
  }
  if(p[2]==='integrations'&&p[3]==='shipping-hub'&&p[4]==='stores'&&p[5]==='nova-poshta'){
    if(p.length===6){
      if(m==='GET')return decision('builder.integrations.view','read');
      if(['PUT','DELETE'].includes(m))return decision('builder.integrations.manage','admin');
    }
    if(p.length===7&&p[6]==='quote-settings'){
      if(m==='GET')return decision('shop.shipping.view','read');
      if(m==='PUT')return decision('shop.shipping.edit','admin');
    }
    if(p.length===7&&p[6]==='product-parcels'){
      if(m==='GET')return decision('shop.shipping.view','read');
      if(m==='PUT')return decision('shop.shipping.edit','admin');
    }
  }
  if(p[2]==='notifications'&&p.length===4&&m==='GET'){
    if(p[3]==='orders')return decision('shop.orders.view','order-write');
    if(p[3]==='payments')return decision('shop.payments.view','order-write');
  }
  return null;
}
export function effectiveAuditedAction01605(method,parts,olderAction=null){
  return classifyAuditedAction01605(method,parts)||olderAction;
}

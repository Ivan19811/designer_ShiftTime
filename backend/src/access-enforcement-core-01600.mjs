// 01600 · Precise allowlist for high-impact merchant API routes.
// A route not listed here is NOT claimed to be protected by this stage.
const get=v=>String(v||'').toUpperCase();
const clean=v=>String(v||'').trim();
const match=(m,...verbs)=>verbs.includes(m);
const decision=(permission,siteId='',legacy='write')=>({permission,siteId:clean(siteId),legacy});
export function classifyProtectedAction01600(method,parts){
  const m=get(method),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1')return null;
  if(p[2]==='sites'){
    if(p.length===3&&m==='POST')return decision('site.pages.create');
    if(p.length===3&&m==='GET')return {...decision('site.pages.view','','read'),siteList:true};
    if(!p[3])return null;
    const siteId=p[3];
    if(p.length===4){
      if(m==='GET')return decision('site.pages.view',siteId,'read');
      if(m==='PUT')return decision('site.pages.edit',siteId);
      if(m==='DELETE')return decision('site.publish.delete',siteId,'admin');
    }
    if(p[4]==='publish-status'&&p.length>=5&&m==='GET')return decision('site.pages.view',siteId,'read');
    if(p[4]==='canvas'&&p.length===5&&m==='POST')return decision('site.pages.edit',siteId);
    if(p[4]==='metadata'&&p.length===5&&m==='PATCH')return decision('site.pages.edit',siteId);
    if(p[4]==='publish'&&p.length>=5&&m==='POST')return decision('site.publish.execute',siteId);
    if(p[4]==='revisions'){
      if(match(m,'GET')&&[5,6].includes(p.length))return decision('site.pages.view',siteId,'read');
      if(p.length===5&&m==='POST')return decision('site.pages.edit',siteId);
      if(p.length===6){
        if(m==='PUT')return decision('site.pages.edit',siteId);
        if(m==='DELETE')return decision('site.pages.delete',siteId);
      }
      if(p.length===7&&p[6]==='details'&&m==='PATCH')return decision('site.pages.edit',siteId);
      if(p.length===7&&p[6]==='publish'&&m==='POST')return decision('site.publish.execute',siteId);
    }
    return null;
  }
  if(p[2]==='marketplace'){
    const resource=p[3],id=p[4];
    if(resource==='snapshot'){
      if(m==='GET')return decision('shop.products.view','','read');
      if(m==='PUT')return decision('shop.products.import');
      if(m==='DELETE')return decision('shop.products.delete');
    }
    if(resource==='atomic-catalog'&&m==='POST'&&p.length===4)return decision('shop.products.view','','read');
    if(resource==='products'){
      if(id==='replacement-apply'&&m==='POST')return decision('shop.products.import');
      if(id==='bulk-status'&&m==='POST')return decision('shop.products.edit');
      if(id==='replacement-preview'&&m==='POST')return decision('shop.products.view','', 'read');
    }
    // All catalog entity mutations are protected; using /variants or /feeds cannot bypass the product gate.
    if(['products','categories','attributes','attribute-values','variants','media','collections','filters','recommendations','feeds'].includes(resource)){
      if(m==='GET'&&p.length>=4)return decision('shop.products.view','','read');
      if(p.length===4&&m==='POST')return decision(resource==='products'?'shop.products.create':'shop.products.edit');
      if(p.length>=5&&m==='PATCH')return decision('shop.products.edit');
      if(p.length>=5&&m==='DELETE')return decision('shop.products.delete');
    }
    if(resource==='category-merge'&&id==='apply'&&m==='POST')return decision('shop.products.edit');
    if(resource==='category-path'&&id==='resolve'&&m==='POST')return decision('shop.products.edit');
    return null;
  }
  if(p[2]==='network'){
    if(p[3]==='orders'){
      if(p.length===4&&m==='GET')return decision('shop.orders.view','','order-read');
      if(p.length>=5&&m==='PATCH')return decision('shop.orders.edit','','order-write');
    }
    if(p[3]==='products'&&p.length>=6&&['publish','sync'].includes(p[5])&&m==='POST')return decision('shop.products.edit');
    if(p[3]==='listings'&&p.length>=6&&p[5]==='unpublish'&&m==='POST')return decision('shop.products.edit');
    return null;
  }
  if(p[2]==='integrations'&&p[3]==='shipping-hub'){
    if(p[4]==='orders-production'&&p.length===5&&m==='GET')return decision('shop.orders.view','','order-read');
    if(p[4]==='orders-review'){
      if(p.length===5&&m==='GET')return decision('shop.orders.view','','order-read');
      if(p[5]==='managers'&&p.length===6&&m==='GET')return decision('shop.orders.view','','order-read');
      if(p.length===7){
        if(m==='GET')return decision('shop.orders.view','','order-read');
        if(m==='PATCH'&&p[6]==='workflow')return decision('shop.orders.status','','order-write');
        if(m==='PATCH'&&p[6]==='priority')return decision('shop.orders.edit','','order-write');
        if(m==='POST'&&['notes','buyer-offer','production-order','carrier-quote'].includes(p[6]))return decision('shop.orders.edit','','order-write');
      }
    }
    if(p[4]==='nova-poshta'&&p[5]==='checkout-draft'&&p.length===8&&p[7]==='prepare-review'&&m==='POST')return decision('shop.orders.edit','','order-write');
    if(p[4]==='nova-poshta'&&p[5]==='checkout-draft'&&p.length===8&&p[7]==='contacts'&&match(m,'POST','DELETE'))return decision('shop.orders.edit','','order-write');
    if(p[4]==='nova-poshta'&&p[5]==='checkout-draft'&&p.length===6&&m==='POST')return decision('shop.orders.edit','','order-write');
    return null;
  }
  return null;
}
export function grantDecision01600({role='',enrolled=false,permissions=[],permission,legacyAllowed=false}={}){
  // Exact owner bypass only. No super-admin bypass from untrusted headers.
  if(role==='owner')return {allowed:true,mode:'owner'};
  if(!enrolled)return {allowed:!!legacyAllowed,mode:'legacy'};
  return {allowed:Array.isArray(permissions)&&permissions.includes(permission),mode:'custom'};
}
export function requireProtectedAccess01600(result,permission){
  if(result?.allowed)return result;
  throw Object.assign(new Error('ST_ACCESS_ACTION_DENIED_01600'),{code:'ST_ACCESS_ACTION_DENIED_01600',statusCode:403,permission});
}

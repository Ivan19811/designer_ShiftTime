// ShiftTime 01605D · Verified private merchant routes missed by the original gate.
// Buyer/public checkout, SSO, and unauthenticated tracking are deliberately excluded.
// Exact route shapes prevent over-matching unrelated endpoints.
const decision=(permission,legacy='order-write')=>Object.freeze({permission,siteId:'',legacy});
export function classifyTenantIsolationAction01605D(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||p[2]!=='integrations'||p[3]!=='shipping-hub')return null;
  if(p.length===5&&p[4]==='orders-production'&&m==='GET')return decision('shop.orders.view');
  if(p[4]!=='orders-review')return null;
  if(p.length===6&&p[5]==='managers'&&m==='GET')return decision('shop.orders.view');
  if(p.length!==7||!p[5])return null;
  const resource=p[6];
  if(m==='GET'&&['production-order','buyer-identity','buyer-offer','carrier-quote','readiness','activity','history'].includes(resource))return decision('shop.orders.view');
  if(m==='POST'&&['buyer-offer','carrier-quote'].includes(resource))return decision('shop.orders.edit');
  // Existing PATCH workflow/status and POST production/notes rules remain in 01600.
  return null;
}

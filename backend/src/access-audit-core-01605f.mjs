// 01605F · Narrow, authenticated legacy merchant reads overlooked by 01600/01601.
// Public cart/checkout, SSO, payment providers and webhooks are intentionally excluded.
// The classifier must match precisely the route the server actually handles.
const decision=(permission,legacy='read')=>Object.freeze({permission,siteId:'',legacy});
export function classifyLegacyMerchantAction01605F(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1')return null;
  if(m==='GET'&&p[2]==='network'&&p[3]==='context'&&p.length===4)return decision('shop.products.view');
  // POST is used for a read-only, no-commit preview; never classify APPLY as view.
  if(m==='POST'&&p[2]==='marketplace'&&p[3]==='category-merge'&&p[4]==='preview'&&p.length===5)return decision('shop.products.view');
  return null;
}

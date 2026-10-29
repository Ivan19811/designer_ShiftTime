// 01605 · Offline, deterministic routing inventory. Never contacts Render or prints secrets.
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {classifyAuditedAction01605} from '../src/access-audit-core-01605.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
const parts=path=>('/api/v1/'+path).split('/').filter(Boolean);
const fixed=[
  ['GET','marketplace/feeds','builder.integrations.view'],
  ['GET','marketplace/feeds/feed_1','builder.integrations.view'],
  ['POST','marketplace/feeds','builder.integrations.manage'],
  ['PATCH','marketplace/feeds/feed_1','builder.integrations.manage'],
  ['DELETE','marketplace/feeds/feed_1','builder.integrations.manage'],
  ['GET','integrations/shipping-hub/stores/nova-poshta','builder.integrations.view'],
  ['PUT','integrations/shipping-hub/stores/nova-poshta','builder.integrations.manage'],
  ['DELETE','integrations/shipping-hub/stores/nova-poshta','builder.integrations.manage'],
  ['GET','integrations/shipping-hub/stores/nova-poshta/quote-settings','shop.shipping.view'],
  ['PUT','integrations/shipping-hub/stores/nova-poshta/quote-settings','shop.shipping.edit'],
  ['GET','integrations/shipping-hub/stores/nova-poshta/product-parcels','shop.shipping.view'],
  ['PUT','integrations/shipping-hub/stores/nova-poshta/product-parcels','shop.shipping.edit'],
  ['GET','notifications/orders','shop.orders.view'],
  ['GET','notifications/payments','shop.payments.view'],
];
const existing=[
 ['GET','sites','site.pages.view'],['POST','sites','site.pages.create'],
 ['GET','sites/site_1','site.pages.view'],['PUT','sites/site_1','site.pages.edit'],
 ['POST','sites/site_1/publish','site.publish.execute'],
 ['GET','marketplace/products','shop.products.view'],
 ['POST','marketplace/products','shop.products.create'],
 ['PATCH','marketplace/products/prod_1','shop.products.edit'],
 ['DELETE','marketplace/products/prod_1','shop.products.delete'],
 ['POST','marketplace/products/bulk-status','shop.products.edit'],
 ['PUT','marketplace/snapshot','shop.products.import'],
 ['GET','network/orders','shop.orders.view'],
 ['PATCH','network/orders/order_1','shop.orders.edit'],
 ['GET','network/payments','shop.payments.view'],
 ['PATCH','network/payments/pay_1','shop.payments.edit'],
 ['GET','network/payouts','shop.payouts.view'],
 ['PATCH','network/payouts/pay_1','shop.payouts.edit'],
 ['GET','network/shipping','shop.shipping.view'],
 ['PATCH','network/shipping/d1','shop.shipping.edit'],
 ['GET','media/assets','builder.media.view'],
 ['POST','media/uploads','builder.media.upload'],
 ['DELETE','media/assets/id','builder.media.delete'],
 ['GET','tables','builder.tables.view'],
 ['PATCH','tables/t1','builder.tables.edit'],
 ['GET','marketplace/supplier-sync-approvals','shop.suppliersync.view'],
 ['POST','marketplace/supplier-sync-approvals/a1/approve','shop.suppliersync.approve'],
];
// These still need endpoint-by-endpoint audit. No claim of unguarded access: many have legacy guards.
const pending=[
 ['GET','notifications/messages','legacy-role/read'],
 ['GET','notifications/sites','legacy-role/read'],
 ['GET','notifications/traffic','legacy-role/read'],
 ['PATCH','notifications/messages/inbox/msg_1','legacy-role/write'],
 ['POST','notifications/rules','legacy-role/write'],
 ['POST','notifications/transports/smtp/test','legacy-role/write'],
 ['PUT','notifications/preferences','mixed-self-and-store'],
 ['POST','platform/workspaces','membership-gated'],
 ['POST','platform/stores','membership-gated'],
 ['POST','shop/direct-checkout/place','buyer-flow'],
 ['POST','shop/cart/bundles','buyer-cart-flow'],
 ['POST','integrations/shipping-hub/nova-poshta/cart-packing-layout','quote-preview'],
 ['POST','integrations/shipping-hub/nova-poshta/cart-multiplace-quote','quote-preview'],
 ['GET','integrations/shipping-hub/orders-review/id/buyer-identity','order-view-classified-by-01600'],
 ['GET','admin/overview','separate-admin-guard'],
 ['POST','deployment/import-local-operational','legacy-admin-guard'],
];
const known=new Set(ACCESS_PERMISSIONS_01597.map(x=>x.code));
function inspect([method,path,expected],status){
 const p=parts(path),v=classifyAuditedAction01605(method,p)||classifyProtectedAction01600(method,p)||classifyExtendedAction01601(method,p);
 return {method,path,status,expected:status==='pending'?null:expected,actual:v?.permission||null,legacy:v?.legacy||null,valid:status==='pending'||(!!v&&v.permission===expected&&known.has(expected)),note:status==='pending'?expected:null};
}
const entries=[...fixed.map(x=>inspect(x,'fixed-01605')),...existing.map(x=>inspect(x,'existing-01600-01601')),...pending.map(x=>inspect(x,'pending'))];
const summary={stage:'01605',mode:'offline-classifier-audit',fixed:fixed.length,existing:existing.length,pending:pending.length,invalid:entries.filter(x=>!x.valid).length};
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify({summary,entries},null,2)+'\n');
else {
 console.log(`01605 offline audit: ${summary.fixed} corrected routes; ${summary.existing} pre-existing route samples; ${summary.pending} pending review; ${summary.invalid} classifier mismatches`);
 for(const r of entries)console.log(`${r.valid?'OK  ':'FAIL'} ${r.status.padEnd(21)} ${r.method.padEnd(6)} ${r.path.padEnd(72)} ${r.actual||r.note||'-'}`);
}
if(summary.invalid)process.exitCode=1;

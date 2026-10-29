// 01605D · Static, side-effect-free audit of representative authenticated merchant API actions.
// Not an exhaustive route crawler and not a live Aiven/Render authorization test.
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {classifyTenantIsolationAction01605D} from '../src/access-audit-core-01605d.mjs';
import {classifyNotificationAccess01605B} from '../src/access-audit-core-01605b.mjs';
import {effectiveAuditedAction01605} from '../src/access-audit-core-01605.mjs';
const pathParts=path=>('/api/v1/'+path).split('/').filter(Boolean);
const classify=(method,path)=>{
  const parts=pathParts(path);
  return effectiveAuditedAction01605(method,parts,classifyTenantIsolationAction01605D(method,parts)||classifyNotificationAccess01605B(method,parts)||classifyProtectedAction01600(method,parts)||classifyExtendedAction01601(method,parts));
};
const cases=[
 ['GET','sites','site.pages.view'],['GET','sites/site_1','site.pages.view'],['PUT','sites/site_1','site.pages.edit'],
 ['POST','sites/site_1/publish','site.publish.execute'],['DELETE','sites/site_1','site.publish.delete'],
 ['GET','marketplace/products','shop.products.view'],['POST','marketplace/products','shop.products.create'],
 ['PATCH','marketplace/products/p1','shop.products.edit'],['DELETE','marketplace/products/p1','shop.products.delete'],
 ['GET','marketplace/feeds','builder.integrations.view'],['POST','marketplace/feeds','builder.integrations.manage'],
 ['GET','network/orders','shop.orders.view'],['PATCH','network/orders/ord1','shop.orders.edit'],
 ['GET','integrations/shipping-hub/orders-review','shop.orders.view'],
 ['GET','integrations/shipping-hub/orders-production','shop.orders.view'],
 ['GET','integrations/shipping-hub/orders-review/managers','shop.orders.view'],
 ...['production-order','buyer-identity','buyer-offer','carrier-quote','readiness','activity','history'].map(op=>['GET','integrations/shipping-hub/orders-review/orderdraft_example/'+op,'shop.orders.view']),
 ...['buyer-offer','carrier-quote'].map(op=>['POST','integrations/shipping-hub/orders-review/orderdraft_example/'+op,'shop.orders.edit']),
 ['PATCH','integrations/shipping-hub/orders-review/orderdraft_example/workflow','shop.orders.status'],
 ['POST','integrations/shipping-hub/orders-review/orderdraft_example/notes','shop.orders.edit'],
 ['GET','notifications/messages/inbox','crm.messages.view'],['POST','notifications/messages/inbox/msg1/thread','crm.messages.reply'],
 ['GET','notifications/rules','shop.notifications.view'],['POST','notifications/rules','shop.notifications.manage'],
 ['GET','integrations/shipping-hub/stores/nova-poshta','builder.integrations.view'],
 ['PUT','integrations/shipping-hub/stores/nova-poshta','builder.integrations.manage'],
 ['GET','network/payments','shop.payments.view'],['PATCH','network/payments/pay1','shop.payments.edit'],
 ['GET','network/payouts','shop.payouts.view'],['PATCH','network/payouts/pay1','shop.payouts.edit'],
 ['GET','tables','builder.tables.view'],['POST','tables','builder.tables.edit'],
 ['GET','media/assets','builder.media.view'],['POST','media/uploads','builder.media.upload']
];
const verified=cases.map(([method,path,expected])=>{
  const actual=classify(method,path)?.permission||null;
  return {method,path,expected,actual,match:actual===expected};
});
const excluded=[
 ['POST','shop/direct-checkout/place','public buyer checkout: separate authorization flow'],
 ['POST','integrations/shipping-hub/nova-poshta/cart-quote','buyer quote: separate rate and scope controls'],
 ['GET','integrations/nova-poshta/cities','directory: scope and rate limits but not staff-specific permission'],
 ['POST','public/marketplace/orders','public buyer marketplace checkout'],
];
const failures=verified.filter(r=>!r.match);
const result={stage:'01605D',mode:'static-route-sample',totalVerified:verified.length,passed:verified.length-failures.length,failed:failures.length,
  proof:'Classification only. End-to-end database tenant isolation requires live authenticated test users and stores.',verified,excluded:excluded.map(([method,path,reason])=>({method,path,reason})),
  stillPending:['all legacy endpoints not included in representative sample','2-store and 2-account live integration tests','per-site authorization in every underlying data service','independent permission keys for each button','unified audit and deny logging for historical routes']};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(failures.length)process.exitCode=1;

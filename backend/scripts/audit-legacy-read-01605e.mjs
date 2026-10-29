// 01605E · Side-effect-free static classification and SQL boundary report.
// This is NOT a live penetration test or proof of all legacy API coverage.
import fs from 'node:fs';
import {classifyLegacyReadAction01605E} from '../src/access-audit-core-01605e.mjs';
import {classifyTenantIsolationAction01605D} from '../src/access-audit-core-01605d.mjs';
import {classifyNotificationAccess01605B} from '../src/access-audit-core-01605b.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {effectiveAuditedAction01605} from '../src/access-audit-core-01605.mjs';
const parsed=path=>('/api/v1/'+path).split('/').filter(Boolean);
const classify=(method,path)=>{
 const p=parsed(path);
 return effectiveAuditedAction01605(method,p,classifyLegacyReadAction01605E(method,p)||classifyTenantIsolationAction01605D(method,p)||classifyNotificationAccess01605B(method,p)||classifyProtectedAction01600(method,p)||classifyExtendedAction01601(method,p));
};
const checks=[
 ['GET','site-revisions','site.pages.view',true],
 ['GET','marketplace/snapshot/export','shop.products.view',false],
 ['GET','sites','site.pages.view',true],
 ['GET','sites/site_A/revisions','site.pages.view',false],
 ['GET','marketplace/snapshot','shop.products.view',false],
 ['GET','marketplace/feeds','builder.integrations.view',false],
 ['POST','marketplace/feeds','builder.integrations.manage',false],
 ['GET','network/orders','shop.orders.view',false],
 ['GET','network/payments','shop.payments.view',false],
 ['GET','integrations/shipping-hub/orders-review','shop.orders.view',false],
 ['GET','notifications/messages/inbox','crm.messages.view',false],
 ['GET','notifications/rules','shop.notifications.view',false],
 ['GET','media/assets','builder.media.view',false],
 ['GET','tables','builder.tables.view',false],
];
const cases=checks.map(([method,path,expected,siteList])=>{
 const action=classify(method,path);
 return {method,path,expected,actual:action?.permission||null,siteListExpected:siteList,siteListActual:action?.siteList===true,pass:action?.permission===expected&&(action?.siteList===true)===siteList};
});
const excluded=[
 ['GET','site-revisions/extra'],['GET','marketplace/snapshot/export/extra'],['POST','site-revisions'],
 ['POST','public/shop/direct-checkout/place'],['GET','public/marketplace/snapshot/export'],
];
const excludedChecks=excluded.map(([method,path])=>({method,path,excluded:classifyLegacyReadAction01605E(method,parsed(path))===null}));
const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
const revision=fs.readFileSync(new URL('../src/site-revisions-01231.mjs',import.meta.url),'utf8');
const sqlChecks={
 revisionIndexUsesAllowedSiteIds:server.includes("listSiteRevisions01231(scope,'',protectedDecision01600?.allowedSiteIds??null)"),
 revisionQueryRestrictsAccountWorkspaceStore:revision.includes('s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3'),
 revisionQueryRestrictsAllowedSiteIds:revision.includes('s.id=ANY($${params.length}::text[])'),
 exportOnlyMatchesExactRoute:server.includes("p[4]==='export'&&p.length===5"),
};
const passed=cases.filter(c=>c.pass).length+excludedChecks.filter(c=>c.excluded).length+Object.values(sqlChecks).filter(Boolean).length;
const count=cases.length+excludedChecks.length+Object.keys(sqlChecks).length;
const report={stage:'01605E',mode:'static-sample',passed,total:count,failed:count-passed,cases,excludedChecks,sqlChecks,
 limits:['Not an exhaustive audit of historic endpoints','Not a live Render/Aiven test','Site lists are filtered at SQL level only for the verified revision endpoint','Public buyer checkout and seller-specific resources require separate tests']};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(passed!==count)process.exitCode=1;

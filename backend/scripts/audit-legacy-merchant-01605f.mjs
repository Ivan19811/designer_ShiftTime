// 01605F readonly audit of selected historical merchant endpoints, not an exhaustive API scan.
import {writeFileSync} from 'node:fs';
import {classifyLegacyMerchantAction01605F} from '../src/access-audit-core-01605f.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {ACCESS_PERMISSIONS_01597} from '../src/access-policy-core-01597.mjs';
const known=new Set(ACCESS_PERMISSIONS_01597.map(r=>r.code));
const yes=[
 ['GET','network/context','shop.products.view','01605F'],
 ['POST','marketplace/category-merge/preview','shop.products.view','01605F'],
 ['GET','marketplace/supplier-sync-approvals/a1','shop.suppliersync.view','01601'],
 ['POST','marketplace/supplier-sync-approvals/a1/approve','shop.suppliersync.approve','01601'],
 ['POST','marketplace/import-rollbacks/job1/restore','shop.products.import','01601'],
 ['GET','network/shipping','shop.shipping.view','01601'],
 ['PATCH','network/payments/p1','shop.payments.edit','01601'],
];
const no=[
 ['GET','network/context/extra'],['POST','marketplace/category-merge/preview/extra'],
 ['POST','marketplace/supplier-sync-approvals/a1/approve/extra'],
 ['PUT','marketplace/supplier-sync-schedules/source1/extra'],
 ['POST','marketplace/import-rollbacks/job1/restore/extra'],
 ['POST','public/marketplace/orders'],['POST','shop/direct-checkout/place']
];
const p=x=>`api/v1/${x}`.split('/');
const classify=(m,path)=>classifyLegacyMerchantAction01605F(m,p(path))||classifyExtendedAction01601(m,p(path));
const passed=[];const failed=[];
for(const [method,path,expected,origin] of yes){const got=classify(method,path)?.permission||null;const record={method,path,expected,got,origin};(got===expected&&known.has(got)?passed:failed).push(record);}
for(const [method,path] of no){const got=classify(method,path)?.permission||null;const record={method,path,expected:null,got};(got===null?passed:failed).push(record);}
const output={stage:'01605F',generatedAt:new Date().toISOString(),scope:'selected-classifier-routes-only',checked:passed.length+failed.length,passed:passed.length,failed:failed.length,failures:failed,limitations:['Not all historical API routes inspected','No live Render/Aiven or real HTTP authorization tested','SQL queries in seller/supplier services require full cross-tenant integration coverage','Public checkout is intentionally outside merchant-role gates']};
if(process.argv[2]==='--json')writeFileSync(process.argv[3]||'01605F-ROUTE-AUDIT.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(failed.length)process.exitCode=1;

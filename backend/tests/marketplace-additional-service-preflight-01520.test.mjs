import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyMarketplaceSnapshot01052} from '../src/vendor/marketplace-sync/marketplace-schema-01052.mjs';
import {buildProductImportPlan01060,executeProductImport01060} from '../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs';
const mapping={Name:'name',Group:'productGroup',SKU:'variant:sku',Size:'variantAttribute:diameter',Role:'catalogRole01472',Services:'additionalServices01487'};
const opts={rowMode:'variants',existingPolicy:'update',createMissingCategories:false};
const base=()=>{const s=createEmptyMarketplaceSnapshot01052();s.attributes=[{id:'diam',name:'Діаметр',key:'diameter',type:'number-unit',variantOption:true,unit:'см'}];s.attributeValues=[30,40].map(n=>({id:'d'+n,attributeId:'diam',value:String(n),label:String(n)}));return s};
const row=(name,group,sku,size,role='ТОВАР',services='')=>({Name:name,Group:group,SKU:sku,Size:String(size),Role:role,Services:services});
test('01520 missing service is a per-row Validation issue before DB writes',async()=>{
 const s=base(),rows=[row('Сковорода','PAN-001','PAN-D30',30,'ТОВАР','Неіснуюча послуга (30)')];
 const plan=buildProductImportPlan01060(rows,mapping,s,opts);
 assert.equal(plan.counts.error,1,JSON.stringify(plan.errors));
 assert.equal(plan.additionalServicePreflight01520.errors[0].line,2);
 assert.equal(plan.additionalServicePreflight01520.errors[0].field,'additionalServices01487');
 assert.equal(plan.additionalServicePreflight01520.errors[0].vars.name,'Неіснуюча послуга');
 let commits=0;const store={getState:()=>s,getRepositoryInfo:()=>({type:'api'}),replaceSnapshot:async()=>{commits++},refresh:async()=>s};
 await assert.rejects(()=>executeProductImport01060(store,rows,mapping,opts),e=>e.code==='MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387');
 assert.equal(commits,0);
});
test('01520 forward reference to a service created later in same XLSX passes and saves',async()=>{
 const s=base(),rows=[row('Сковорода','PAN-001','PAN-D30',30,'ТОВАР','Гравіювання (30)'),row('Гравіювання','SRV-001','SRV-D30',30,'ДОДАТКОВО')];
 const plan=buildProductImportPlan01060(rows,mapping,s,opts);
 assert.equal(plan.counts.error,0,JSON.stringify(plan.errors));
 let snapshot=structuredClone(s);const store={getRepositoryInfo:()=>({type:'api'}),getState:()=>structuredClone(snapshot),replaceSnapshot:async n=>{snapshot=structuredClone(n)},refresh:async()=>structuredClone(snapshot)};
 await executeProductImport01060(store,rows,mapping,opts,{sourceName:'price.xlsx'});
 const target=snapshot.variants.find(x=>x.sku==='PAN-D30');
 const service=snapshot.variants.find(x=>x.sku==='SRV-D30');
 assert.ok(service?.accessoryTargets01485?.refs?.some(ref=>ref.variantId===target.id));
});
test('01520 same-name product without service role is blocked',()=>{
 const s=base(),rows=[row('Сковорода','PAN-001','PAN-D30',30,'ТОВАР','Чохол (30)'),row('Чохол','OTH-001','OTH-D30',30,'ТОВАР')];
 const plan=buildProductImportPlan01060(rows,mapping,s,opts);
 assert.equal(plan.counts.error,1,JSON.stringify(plan.errors));
 assert.equal(plan.additionalServicePreflight01520.errors[0].vars.reason,'not-a-service');
});
test('01520 does not block ordinary import if Services field unmapped',()=>{
 const s=base(),rows=[row('Сковорода','PAN-001','PAN-D30',30,'ТОВАР','Неіснуюча послуга (30)')];
 const plan=buildProductImportPlan01060(rows,{...mapping,Services:''},s,opts);
 assert.equal(plan.counts.error,0,JSON.stringify(plan.errors));
});

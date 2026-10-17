import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductImportPlan01060,executeProductImport01060} from '../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs';
import {createMarketplaceProduct01052,createMarketplaceVariant01052} from '../src/vendor/marketplace-sync/marketplace-schema-01052.mjs';
const mapping={Name:'name',Group:'productGroup',SKU:'variant:sku',Diameter:'variantAttribute:diameter',Price:'variant:price'};
const options={rowMode:'variants',existingPolicy:'update',createMissingCategories:false};
function state(){return {revision:1,products:[createMarketplaceProduct01052({id:'p-lid',name:'Кришка',sku:'KRS-000002',productGroup01512:'KRS-000002'})],variants:[createMarketplaceVariant01052({id:'v-lid',productId:'p-lid',sku:'KRS-000002-D45',price:0,options:{diameter:'45'}})],attributes:[{id:'diam',key:'diameter',name:'Діаметр',type:'number-unit',unit:'см',variantOption:true,valueIds:['d45']}],attributeValues:[{id:'d45',attributeId:'diam',value:'45',label:'45'}],categories:[],media:[],collections:[],filters:[],recommendations:[],feeds:[],settings:{importProfiles:[],importExportHistory:[],importHistory:[]}};}
const incoming=(Group='PAN-0007',SKU='PAN-0007-D45')=>[{Name:'Кришка',Group,SKU,Diameter:'45',Price:430}];
test('01515 scheduled backend import refuses incorrect PAN group for KRS lid',async()=>{
 let catalog=state(),commits=0;
 const built=buildProductImportPlan01060(incoming(),mapping,catalog,options);
 assert.ok(built.errors.some(e=>e.code==='productGroupNameConflict01515'));
 assert.equal(built.counts.variantUpdate,0);
 const store={getState:()=>catalog,getRepositoryInfo:()=>({type:'api-server-01406'}),replaceSnapshot:async()=>{commits++},refresh:async()=>catalog};
 await assert.rejects(executeProductImport01060(store,incoming(),mapping,options),/MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387/);
 assert.equal(commits,0);
});
test('01515 scheduled backend import allows exact KRS Group and SKU match',()=>{
 const plan=buildProductImportPlan01060(incoming('KRS-000002','KRS-000002-D45'),mapping,state(),options);
 assert.equal(plan.counts.error,0);assert.equal(plan.counts.variantUpdate,1);
});
test('01515 scheduled backend import blocks different variant SKU at same options',()=>{
 const plan=buildProductImportPlan01060(incoming('KRS-000002','OTHER-D45'),mapping,state(),options);
 assert.ok(plan.errors.some(e=>e.code==='variantOptionsSkuConflict01515'));
});

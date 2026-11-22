import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductImportPlan01060,executeProductImport01060} from '../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs';
const mapping={Name:'name',Group:'productGroup',SKU:'variant:sku',Diameter:'variantAttribute:diameter',Accessories:'accessoryProducts01485'};
const options={rowMode:'variants',existingPolicy:'update',createMissingCategories:false};
const state=()=>({revision:1,products:[],variants:[],attributes:[{id:'diam',key:'diameter',name:'Діаметр',type:'number-unit',unit:'см',variantOption:true,valueIds:['d30']}],attributeValues:[{id:'d30',attributeId:'diam',value:'30',label:'30'}],categories:[],media:[],collections:[],filters:[],recommendations:[],feeds:[],settings:{importProfiles:[],importExportHistory:[],importHistory:[]}});
const row=(name,group,sku,diam,accessories='')=>({Name:name,Group:group,SKU:sku,Diameter:diam,Accessories:accessories});
test('01519 backend preflight blocks invalid linked variant before DB mutation',async()=>{
 const catalog=state(),rows=[row('Кришка','ACC-0009','KRS-D30','30','Сковорода 4 мм (90)'),row('Сковорода 4 мм','PAN-0009','PAN-D30','30')];
 const p=buildProductImportPlan01060(rows,mapping,catalog,options);
 assert.equal(p.counts.error,1);assert.equal(p.errors[0].line,2);assert.equal(p.errors[0].vars.reason,'missing-variant');
 let commits=0;const store={getState:()=>catalog,getRepositoryInfo:()=>({type:'api-server-01406'}),replaceSnapshot:async()=>{commits++},refresh:async()=>catalog};
 await assert.rejects(executeProductImport01060(store,rows,mapping,options),/MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387/);
 assert.equal(commits,0);
});
test('01519 backend preflight resolves forward references inside the same Excel import',()=>{
 const catalog=state(),rows=[row('Кришка','ACC-0009','KRS-D30','30','Сковорода 4 мм (30)'),row('Сковорода 4 мм','PAN-0009','PAN-D30','30')];
 const p=buildProductImportPlan01060(rows,mapping,catalog,options);
 assert.equal(p.counts.error,0,JSON.stringify(p.errors));
});

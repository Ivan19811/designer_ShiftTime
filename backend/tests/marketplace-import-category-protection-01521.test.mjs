import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductImportPlan01060,executeProductImport01060} from '../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs';
const mapping={Name:'name',Group:'productGroup',Category:'categories',SKU:'variant:sku',Diameter:'variantAttribute:diameter'};
const opts={rowMode:'variants',existingPolicy:'update',createMissingCategories:false};
function state(){return {products:[{id:'p1',name:'Кришка',sku:'KRS-000002',productGroup01512:'ACC-0001',categoryIds:['lids']}],variants:[{id:'v1',productId:'p1',sku:'KRS-000002-D30',options:{diameter:'30'}}],categories:[{id:'pans',name:'Сковорідки',parentId:null},{id:'a',name:'Аксесуари Сковороди',parentId:'pans'},{id:'lids',name:'Кришки',parentId:'a'},{id:'mangal',name:'Мангали',parentId:null}],attributes:[{id:'diam',key:'diameter',name:'Діаметр',variantOption:true,valueIds:['d30']}],attributeValues:[{id:'d30',attributeId:'diam',value:'30',label:'30',slug:'30'}],media:[]};}
const rows=(category)=>[{Name:'Кришка',Group:'ACC-0001',Category:category,SKU:'KRS-000002-D30',Diameter:'30'}];
test('01521 backend ancestor-only import keeps exact nested product category',()=>{
 const p=buildProductImportPlan01060(rows('Сковорідки'),mapping,state(),opts);
 assert.equal(p.counts.error,0);assert.equal(p.categoryReviews01521[0].kind,'preservedAncestor');
 assert.equal(p.diff01390.items.find(x=>x.entity==='product').changes.some(c=>c.field==='product.categories'),false);
});
test('01521 backend cross-category update cannot reach DB without explicit approved token',async()=>{
 const s=state(),r=rows('Мангали');let commits=0;
 const p=buildProductImportPlan01060(r,mapping,s,opts);
 assert.equal(p.categoryReviews01521[0].kind,'pendingMove');assert.equal(p.counts.error,1);
 const store={getRepositoryInfo:()=>({type:'api'}),getState:()=>structuredClone(s),replaceSnapshot:async()=>commits++};
 await assert.rejects(executeProductImport01060(store,r,mapping,opts),/MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387/);
 assert.equal(commits,0);
 const allowed=buildProductImportPlan01060(r,mapping,s,{...opts,categoryMoveApprovals01521:{p1:p.categoryReviews01521[0].token}});
 assert.equal(allowed.counts.error,0);assert.equal(allowed.categoryReviews01521[0].kind,'approvedMove');
});

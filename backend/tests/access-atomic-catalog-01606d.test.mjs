import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597} from '../src/access-policy-core-01597.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {catalogAction01606D,classifyCatalogAction01606D,assertCatalogAction01606D} from '../src/access-catalog-actions-core-01606d.mjs';
import {assertProductAction01606B, classifyProductAction01606B} from '../src/access-product-actions-core-01606b.mjs';
import {normalizeCatalogOperations01606D,applyAtomicCatalogOperations01606D} from '../src/marketplace-atomic-catalog-core-01606d.mjs';
const p=(path)=>['api','v1',...path.split('/')];
const base=()=>({revision:3,products:[],categories:[{id:'cat_1',name:'Existing',slug:'existing',createdAt:'yesterday'}],attributes:[],attributeValues:[],variants:[],media:[],settings:{locale:'uk-UA'}});
const normalized=(operations,expectedRevision=3)=>normalizeCatalogOperations01606D({expectedRevision,operations});
const allow=(permissions,mode='custom')=>({mode,permissions});
const denied=fn=>assert.throws(fn,e=>e.statusCode===403&&e.code==='ST_ACCESS_CATALOG_ACTION_DENIED_01606D');
test('01606D catalog role codes are unique and accepted by role normalizer',()=>{
 const keys=ACCESS_PERMISSIONS_01597.map(p=>p.code);
 assert.equal(keys.length,new Set(keys).size);
 assert.equal(keys.filter(x=>x.startsWith('shop.products.catalog.')).length,9);
 assert.ok(keys.includes('api.mode.catalog_actions'));
 assert.deepEqual(normalizeAccessPermissions01597(keys),[...keys].sort());
});
test('01606D resource routes distinguish 12 exact operations; atomic route requires base read before per-op grants',()=>{
 for(const [route,collection] of [['categories','categories'],['attributes','attributes'],['attribute-values','attributeValues'],['variants','variants']]){
  for(const [method,suffix,action] of [['POST','','create'],['PATCH','/item-1','edit'],['DELETE','/item-1','delete']]){
   const path=`marketplace/${route}${suffix}`,found=classifyCatalogAction01606D(method,p(path));
   assert.equal(found?.permission,catalogAction01606D(collection,action).permission);
   assert.equal(classifyProtectedAction01600(method,p(path))?.permission,action==='delete'?'shop.products.delete':'shop.products.edit');
  }
 }
 assert.equal(classifyProtectedAction01600('POST',p('marketplace/atomic-catalog')).permission,'shop.products.view');
 for(const [method,path] of [['GET','marketplace/categories'],['PATCH','marketplace/categories'],['POST','marketplace/variants/id'],['DELETE','marketplace/categories/id/nested'],['POST','marketplace/unknown']])assert.equal(classifyCatalogAction01606D(method,p(path)),null);
});
test('01606D require both mode and selected exact catalog grants',()=>{
 const a=catalogAction01606D('categories','edit');
 denied(()=>assertCatalogAction01606D(allow(['api.mode.catalog_actions']),a));
 denied(()=>assertCatalogAction01606D(allow(['api.mode.product_actions']),a));
 denied(()=>assertCatalogAction01606D(allow(['ui.mode.controls']),a));
 assert.equal(assertCatalogAction01606D(allow(['api.mode.catalog_actions',a.permission]),a),true);
 assert.equal(assertCatalogAction01606D(allow([]),a),true);
 assert.equal(assertCatalogAction01606D(allow([], 'legacy'),a),true);
 assert.equal(assertCatalogAction01606D(allow([], 'owner'),a),true);
 denied(()=>assertCatalogAction01606D(allow(['api.mode.catalog_actions']),catalogAction01606D('variants','edit')));
 assert.equal(assertCatalogAction01606D(allow(['api.mode.catalog_actions','shop.products.actions.variants_edit']),catalogAction01606D('variants','edit')),true);
});
test('01606D catalog mode cannot bypass snapshot replace, reset, export or product status gates',()=>{
 const catalogOnly=allow(['shop.products.import','api.mode.catalog_actions','shop.products.catalog.categories_edit']);
 for(const [verb,path] of [['PUT','marketplace/snapshot'],['GET','marketplace/snapshot/export']]){
  const action=classifyProductAction01606B(verb,p(path));
  assert.throws(()=>assertProductAction01606B(catalogOnly,action),e=>e.statusCode===403);
 }
 assert.throws(()=>assertProductAction01606B(catalogOnly,{permission:'shop.products.actions.snapshot_replace'}),e=>e.statusCode===403);
 assert.throws(()=>assertProductAction01606B(catalogOnly,{permission:'shop.products.actions.activate'}),e=>e.statusCode===403);
});
test('01606D optimistic revision and no unrelated snapshot changes',()=>{
 const snapshot=base();const plan=normalized([{collection:'categories',action:'update',id:'cat_1',value:{name:'Changed'}},{collection:'attributes',action:'create',id:'a_2',value:{name:'Diameter'}}]);
 const next=applyAtomicCatalogOperations01606D(snapshot,plan,{now:'today'});
 assert.equal(snapshot.categories[0].name,'Existing');
 assert.equal(next.categories[0].name,'Changed');
 assert.equal(next.categories[0].createdAt,'yesterday');
 assert.equal(next.attributes[0].id,'a_2');
 assert.deepEqual(next.products,snapshot.products);assert.deepEqual(next.settings,snapshot.settings);
 assert.throws(()=>applyAtomicCatalogOperations01606D(snapshot,normalized(plan.operations,2)),e=>e.statusCode===409);
});
test('01606D input strictly rejects unauthorized collections, ambiguous targets, embedded metadata and invalid shape',()=>{
 const one={collection:'categories',action:'update',id:'cat_1',value:{name:'x'}};
 for(const input of [
  {expectedRevision:-1,operations:[one]}, {expectedRevision:3,operations:[]},
  {expectedRevision:3,operations:[{...one,collection:'products'}]},
  {expectedRevision:3,operations:[one,one]},
  {expectedRevision:3,operations:[{...one,value:{id:'cat_OTHER'}}]},
  {expectedRevision:3,operations:[{...one,value:{updatedAt:'fake'}}]},
  {expectedRevision:3,operations:[{...one,value:JSON.parse('{"__proto__":{"owner":true}}')}]},
 ])assert.throws(()=>normalizeCatalogOperations01606D(input),e=>e.statusCode===400);
});
test('01606D prohibit deletion of categories with children or product references',()=>{
 const before=base();before.categories.push({id:'cat_child',parentId:'cat_1',name:'Child'});
 const deletePlan=normalized([{collection:'categories',action:'delete',id:'cat_1'}]);
 assert.throws(()=>applyAtomicCatalogOperations01606D(before,deletePlan),e=>e.statusCode===409);
 before.categories.pop();before.products.push({id:'p_1',categoryIds:['cat_1']});
 assert.throws(()=>applyAtomicCatalogOperations01606D(before,deletePlan),e=>e.statusCode===409);
});
test('01606D rejects orphaned variant and attribute value references and category cycles',()=>{
 const snapshot=base();
 assert.throws(()=>applyAtomicCatalogOperations01606D(snapshot,normalized([{collection:'variants',action:'create',id:'v_1',value:{productId:'p_foreign'}}])),e=>e.statusCode===409);
 assert.throws(()=>applyAtomicCatalogOperations01606D(snapshot,normalized([{collection:'attributeValues',action:'create',id:'av_1',value:{attributeId:'attr_missing'}}])),e=>e.statusCode===409);
 assert.throws(()=>applyAtomicCatalogOperations01606D(snapshot,normalized([{collection:'categories',action:'update',id:'cat_1',value:{parentId:'cat_1'}}])),e=>e.statusCode===409);
});
test('01606D server must enforce base then action before persistence; snapshot reset is super permission',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const i=server.indexOf("if(p[3]==='atomic-catalog'");
 assert.ok(i>server.indexOf('const protectedDecision01600='));
 assert.match(server.slice(i,i+1700),/inspectProtectedAccess01600\(scope,session.userId/);
 assert.match(server.slice(i,i+1700),/assertCatalogGate01606D\(catalogAction01606D/);
 assert.match(server.slice(i,i+1700),/atomicCatalogEdit01606D\(scope,input\)/);
 assert.match(server,/assertProductGate01606B\(\{permission:'shop.products.actions.snapshot_replace'\}\);await resetSnapshot/);
 const service=fs.readFileSync(new URL('../src/commerce-snapshot-service.mjs',import.meta.url),'utf8');
 assert.match(service,/atomicCatalogEdit01606D/);assert.match(service,/withTransaction\(async client=>/);
});

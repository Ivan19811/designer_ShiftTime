import test from 'node:test';
import assert from 'node:assert/strict';
import {FAST_MODE,normalizeFastPlan,applyFastCatalog,withFastBaseline01630,fastConflicts01630,mergeFastOperation} from '../src/marketplace-fast-catalog-core-01624h.mjs';
const snap=(rev=3)=>({revision:rev,categories:[{id:'cat1',name:'Сковорідки',parentId:null,sortOrder:0,attributes:{storefrontHidden01258:false}},{id:'cat2',name:'Кришки',parentId:null,sortOrder:1}],products:[{id:'p1',name:'Товар',status:'active',price:100,categoryIds:['cat1'],configuration:{categoryTreeOrder01257:{cat1:0}}},{id:'p2',name:'Товар 2',status:'active',price:200,categoryIds:['cat2']},{id:'p3',status:'draft',price:3,categoryIds:['cat1']}],variants:[]});
const make=(snapshot,ops,rev=3)=>normalizeFastPlan({mode:FAST_MODE,expectedRevision:rev,batchId:'batch01630',operations:ops.map(o=>withFastBaseline01630(snapshot,o))});
const conflict=(fn,code='ST_FAST_CATALOG_FIELD_CONFLICT_01630')=>assert.throws(fn,e=>e.code===code&&e.statusCode===409);
test('unrelated product field changes do not block draft status save',()=>{
 const baseline=snap();const plan=make(baseline,[{collection:'products',id:'p1',patch:{status:'draft'},bulk:true}]);const remote=snap(5);remote.products[0].price=999;
 const out=applyFastCatalog(remote,plan);assert.equal(out.products[0].price,999);assert.equal(out.products[0].status,'draft');
});
test('same product status changed remotely blocks save and retains current value',()=>{
 const plan=make(snap(),[{collection:'products',id:'p3',patch:{status:'active'}}]);const remote=snap(4);remote.products[2].status='archived';
 conflict(()=>applyFastCatalog(remote,plan));assert.equal(remote.products[2].status,'archived');
});
test('same desired value already on server can commit idempotently even for legacy plan',()=>{
 const base=snap(),remote=snap(4);remote.products[0].status='draft';
 const plan=normalizeFastPlan({mode:FAST_MODE,expectedRevision:3,batchId:'legacy',operations:[{collection:'products',id:'p1',patch:{status:'draft'}}]});
 assert.equal(applyFastCatalog(remote,plan).products[0].status,'draft');
});
test('legacy drafts never overwrite a newer different value without review',()=>{
 const remote=snap(4),plan=normalizeFastPlan({mode:FAST_MODE,expectedRevision:3,batchId:'legacy',operations:[{collection:'products',id:'p1',patch:{status:'draft'}}]});
 conflict(()=>applyFastCatalog(remote,plan));
});
test('unrelated product reorder can be merged with new price from form',()=>{
 const plan=make(snap(),[{collection:'products',id:'p1',patch:{order:{cat1:2}}}]);
 const remote=snap(7);remote.products[0].price=2000;remote.products[0].configuration.categoryTreeOrder01257.cat2=9;
 const out=applyFastCatalog(remote,plan);assert.equal(out.products[0].price,2000);assert.equal(out.products[0].configuration.categoryTreeOrder01257.cat2,9);assert.equal(out.products[0].configuration.categoryTreeOrder01257.cat1,2);
});
test('overlapping order edits are rejected',()=>{
 const plan=make(snap(),[{collection:'products',id:'p1',patch:{order:{cat1:3}}}]);const remote=snap(4);remote.products[0].configuration.categoryTreeOrder01257.cat1=2;
 conflict(()=>applyFastCatalog(remote,plan));
});
test('category tree move merges with unrelated product fields',()=>{
 const plan=make(snap(),[{collection:'categories',id:'cat2',patch:{parentId:'cat1'}}]);const remote=snap(4);remote.products[0].name='Нова назва';
 const out=applyFastCatalog(remote,plan);assert.equal(out.categories[1].parentId,'cat1');assert.equal(out.products[0].name,'Нова назва');
});
test('re-parent over a different new parent is conflict',()=>{
 const plan=make(snap(),[{collection:'categories',id:'cat2',patch:{parentId:'cat1'}}]);const remote=snap(4);remote.categories.push({id:'cat3',name:'Інша'});remote.categories[1].parentId='cat3';
 conflict(()=>applyFastCatalog(remote,plan));
});
test('category deletion after revision change requires explicit review',()=>{
 const plan=make(snap(),[{collection:'categories',id:'cat1',patch:{deleted:true}}]);
 conflict(()=>applyFastCatalog(snap(4),plan));
});
test('deletion remains functional when server revision equals draft revision',()=>{
 const plan=make(snap(),[{collection:'categories',id:'cat1',patch:{deleted:true}}]);const out=applyFastCatalog(snap(),plan);
 assert.deepEqual(out.categories.map(x=>x.id),['cat2']);assert.deepEqual(out.products.map(x=>x.id),['p2']);
});
test('baseline merge retains earliest before-values for fields staged twice',()=>{
 const first=withFastBaseline01630(snap(),{collection:'products',id:'p1',patch:{status:'draft'}});
 const second=withFastBaseline01630(snap(),{collection:'products',id:'p1',patch:{status:'active',categoryIds:['cat2']}});
 const merged=mergeFastOperation(first,second);
 assert.deepEqual(merged.before,{status:'active',categoryIds:['cat1']});assert.equal(merged.patch.status,'active');
});
test('malformed baselines rejected rather than bypass checks',()=>{
 assert.throws(()=>normalizeFastPlan({mode:FAST_MODE,expectedRevision:3,batchId:'badbefore',operations:[{collection:'products',id:'p1',patch:{status:'draft'},before:{status:{malicious:true}}}]}),e=>e.code==='ST_FAST_BASELINE_INVALID_01630');
});
test('revision check stays strict for future revision inputs',()=>{
 const remote=snap(3);const plan=make(remote,[{collection:'products',id:'p1',patch:{status:'draft'}}],3);plan.expectedRevision=99;
 conflict(()=>applyFastCatalog(remote,plan));
});
test('10,000 products: safe field-level reconcile is linear and keeps unrelated prices',()=>{
 const baseline={revision:1,categories:[{id:'c',name:'Єдина категорія'}],products:Array.from({length:10000},(_,i)=>({id:'p'+i,status:'active',price:i,categoryIds:['c']})),variants:[]};
 const index=new Map(baseline.products.map(p=>[p.id,p]));
 const ops=baseline.products.map(p=>({collection:'products',id:p.id,patch:{status:'draft'},before:{status:p.status}}));
 const plan=normalizeFastPlan({mode:FAST_MODE,expectedRevision:1,batchId:'stress01630',operations:ops});
 const remote={...baseline,revision:2,products:baseline.products.map(p=>({...p,price:p.price+10}))};
 const next=applyFastCatalog(remote,plan);
 assert.equal(next.products.length,10000);assert.equal(next.products[9999].status,'draft');assert.equal(next.products[9999].price,10009);
});

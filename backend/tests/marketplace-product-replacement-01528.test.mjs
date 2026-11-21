import test from 'node:test';
import assert from 'node:assert/strict';
import {planProductReplacement01528,applyProductReplacement01528} from '../src/marketplace-product-replacement-core-01528.mjs';
import {buildMarketplaceRollbackPatch01397,previewMarketplaceRollbackPatch01397} from '../src/marketplace-import-rollback-core-01397.mjs';
function sample(){
  return {revision:2857,products:[
    {id:'demo',name:'З Диска Борони',sku:'DEMO-PAN-60',status:'active',mediaIds:['media_old'],primaryMediaId:'media_old',categoryIds:['cat_old'],configuration:{variantGroup01315:{groupId:'variant-group:demo',ownerProductId:'demo',members:[{productId:'demo'},{productId:'partner'}]}}},
    {id:'target',name:'Сковорода з диска',sku:'PAN-0002',productGroup01512:'PAN-0002',status:'draft',mediaIds:[],primaryMediaId:'',categoryIds:['cat_new'],price:1450,configuration:{}},
    {id:'partner',name:'Стандарт',sku:'TEST-PG-01086',status:'active',configuration:{variantGroup01315:{groupId:'variant-group:demo',ownerProductId:'demo',members:[{productId:'demo'},{productId:'partner'}]}}},
    {id:'accessory',name:'Кришка',sku:'KRS-000002',status:'active'}],
    categories:[{id:'cat_old',productIds:['demo']},{id:'cat_new'}],media:[{id:'media_old',url:'https://example.com/photo.jpg'},{id:'v40media',url:'https://example.com/d40.jpg'}],
    variants:[
      {id:'v-old-30',productId:'demo',sku:'DEMO-PAN-60-30',options:{diametr:'30'},mediaIds:[],primaryMediaId:''},
      {id:'v-old-40',productId:'demo',sku:'DEMO-PAN-60-40',options:{diametr:'40'},mediaIds:['v40media'],primaryMediaId:'v40media'},
      {id:'v-new-40',productId:'target',sku:'PAN-0002-D40',options:{diametr:'40'},price:1450,mediaIds:[],primaryMediaId:''},
      {id:'accessory-var',productId:'accessory',sku:'KRS-000002-D40',accessoryTargets01485:{refs:[{productId:'demo',variantId:'v-old-40'}]}}],
    recommendations:[{id:'rec1',sourceProductIds:['demo'],targetProductIds:['accessory']}],collections:[{id:'collection1',productIds:['demo']}]
  };
}
test('safe mapping by option values, never by position or name',()=>{
  const p=planProductReplacement01528(sample(),{sourceProductId:'demo',targetProductId:'target'});
  assert.equal(p.pairs.length,1);assert.equal(p.pairs[0].targetSku,'PAN-0002-D40');assert.equal(p.unmatched[0].sku,'DEMO-PAN-60-30');assert.equal(p.blocked,false);
  assert.equal(p.canCopyProductMedia,true);assert.equal(p.variantMediaCopies,1);
});
test('atomic plan preserves imported SKU, price, variants, categories, accessory refs',()=>{
  const before=sample(),p=planProductReplacement01528(before,{sourceProductId:'demo',targetProductId:'target'});
  const {snapshot:after,report}=applyProductReplacement01528(before,{sourceProductId:'demo',targetProductId:'target',expectedRevision:2857,planHash:p.planHash,confirmArchive:true});
  assert.equal(report.matchedVariants,1);assert.equal(report.copiedVariantMedia,1);assert.equal(report.referenceRewrites>0,true);
  const target=after.products.find(x=>x.id==='target'),old=after.products.find(x=>x.id==='demo');
  assert.equal(old.status,'archived');assert.equal(target.status,'active');assert.equal(target.sku,'PAN-0002');assert.equal(target.price,1450);assert.deepEqual(target.categoryIds,['cat_new','cat_old']);assert.deepEqual(target.mediaIds,['media_old']);
  assert.equal(target.configuration.variantGroup01315.ownerProductId,'target');assert.equal(after.products.find(x=>x.id==='partner').configuration.variantGroup01315.members[0].productId,'target');
  assert.equal(after.variants.find(x=>x.id==='v-new-40').price,1450);assert.equal(after.variants.find(x=>x.id==='v-new-40').primaryMediaId,'v40media');
  assert.equal(after.variants.find(x=>x.id==='accessory-var').accessoryTargets01485.refs[0].variantId,'v-new-40');
  assert.deepEqual(after.collections[0].productIds,['target']);assert.deepEqual(after.recommendations[0].sourceProductIds,['target']);
  assert.deepEqual(before.products[0].status,'active');
  const rollback=buildMarketplaceRollbackPatch01397(before,after);
  const restored=previewMarketplaceRollbackPatch01397(after,rollback);
  assert.equal(restored.ok,true);assert.deepEqual(restored.candidate.products,before.products);
});
test('stale revisions, changed plans and missing confirmation are rejected',()=>{
  const p=planProductReplacement01528(sample(),{sourceProductId:'demo',targetProductId:'target'});
  for(const c of [
    {expectedRevision:2856,planHash:p.planHash,confirmArchive:true},
    {expectedRevision:2857,planHash:'wrong',confirmArchive:true},
    {expectedRevision:2857,planHash:p.planHash,confirmArchive:false}
  ])assert.throws(()=>applyProductReplacement01528(sample(),{sourceProductId:'demo',targetProductId:'target',...c}));
});
test('unresolved external variant references block the operation',()=>{
  const s=sample();s.variants.find(x=>x.id==='accessory-var').accessoryTargets01485.refs.push({productId:'demo',variantId:'v-old-30'});
  const p=planProductReplacement01528(s,{sourceProductId:'demo',targetProductId:'target'});
  assert.equal(p.blocked,true);assert.equal(p.refPathMissing.length,1);
});
test('missing media records and ambiguous matches block operation',()=>{
  const s=sample();s.media=[];assert.equal(planProductReplacement01528(s,{sourceProductId:'demo',targetProductId:'target'}).blocked,true);
  const x=sample();x.variants.push({...x.variants.find(y=>y.id==='v-new-40'),id:'v-new-40-duplicate'});
  const p=planProductReplacement01528(x,{sourceProductId:'demo',targetProductId:'target'});assert.equal(p.ambiguous.length,1);assert.equal(p.blocked,true);
});
test('id validation and archiving prevents replacement loops',()=>{
  assert.throws(()=>planProductReplacement01528(sample(),{sourceProductId:'demo',targetProductId:'demo'}));
  const s=sample();s.products[1].status='archived';assert.throws(()=>planProductReplacement01528(s,{sourceProductId:'demo',targetProductId:'target'}));
});
test('photo-only fallback is safe even when orphan references block full replacement',()=>{
  const state=sample();state.variants.find(x=>x.id==='accessory-var').accessoryTargets01485.refs.push({productId:'demo',variantId:'v-old-30'});
  const plan=planProductReplacement01528(state,{sourceProductId:'demo',targetProductId:'target'});assert.equal(plan.blocked,true);
  const {snapshot:result,report}=applyProductReplacement01528(state,{sourceProductId:'demo',targetProductId:'target',expectedRevision:2857,planHash:plan.planHash,mode:'media-only',confirmMediaOnly:true});
  assert.equal(report.archivedSource,false);assert.equal(report.copiedVariantMedia,1);
  assert.equal(result.products.find(x=>x.id==='demo').status,'active');assert.equal(result.products.find(x=>x.id==='target').status,'draft');
  assert.equal(result.variants.find(x=>x.id==='accessory-var').accessoryTargets01485.refs[1].variantId,'v-old-30');
  assert.equal(result.variants.find(x=>x.id==='v-new-40').primaryMediaId,'v40media');
});

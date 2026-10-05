import crypto from 'node:crypto';

export const MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397='01397';
export const MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397='MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397';
export const MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397='MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397';
export const MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397='MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397';
const COLLECTIONS=Object.freeze(['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds']);
const str=v=>String(v??'').trim();const arr=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function nowIso(){return new Date().toISOString();}
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const out={};for(const key of Object.keys(v).sort())out[key]=stable(v[key]);return out;}return v;}
function stableJson(v){return JSON.stringify(stable(v));}
export function fingerprintMarketplaceEntity01397(v){return crypto.createHash('sha256').update(stableJson(v??null)).digest('hex');}
function byId(rows){return new Map(arr(rows).filter(x=>str(x?.id)).map(x=>[str(x.id),x]));}
function same(a,b){return stableJson(a)===stableJson(b);}
export function buildMarketplaceRollbackPatch01397(before={},after={}){
  const operations=[],summary={total:0,created:0,updated:0,deleted:0,collections:{}};
  for(const collection of COLLECTIONS){const a=byId(before?.[collection]),b=byId(after?.[collection]),ids=new Set([...a.keys(),...b.keys()]),counts={created:0,updated:0,deleted:0,total:0};
    for(const id of ids){const prev=a.get(id),next=b.get(id);if(!prev&&next){operations.push({collection,id,action:'remove-created',postHash:fingerprintMarketplaceEntity01397(next)});counts.created++;summary.created++;}
      else if(prev&&!next){operations.push({collection,id,action:'restore-deleted',before:clone(prev)});counts.deleted++;summary.deleted++;}
      else if(prev&&next&&!same(prev,next)){operations.push({collection,id,action:'restore-updated',before:clone(prev),postHash:fingerprintMarketplaceEntity01397(next)});counts.updated++;summary.updated++;}}
    counts.total=counts.created+counts.updated+counts.deleted;if(counts.total){summary.collections[collection]=counts;summary.total+=counts.total;}
  }
  return {schema:'marketplace-import-rollback-v1-01397',stage:MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397,operations,summary};
}
function currentEntity(snapshot,collection,id){return arr(snapshot?.[collection]).find(x=>str(x?.id)===id)||null;}
function replaceEntity(snapshot,collection,id,value){const rows=arr(snapshot?.[collection]).slice(),index=rows.findIndex(x=>str(x?.id)===id);if(value==null){snapshot[collection]=rows.filter(x=>str(x?.id)!==id);return;}if(index>=0)rows[index]=clone(value);else rows.push(clone(value));snapshot[collection]=rows;}
function referenceConflicts(snapshot){
  const out=[],categories=new Set(arr(snapshot.categories).map(x=>str(x.id))),media=new Set(arr(snapshot.media).map(x=>str(x.id))),products=new Set(arr(snapshot.products).map(x=>str(x.id))),variants=new Set(arr(snapshot.variants).map(x=>str(x.id))),attributes=new Set(arr(snapshot.attributes).map(x=>str(x.id))),attributeValues=new Set(arr(snapshot.attributeValues).map(x=>str(x.id))),collections=new Set(arr(snapshot.collections).map(x=>str(x.id)));
  const missing=(code,collection,id,ref)=>out.push({code,collection,id:str(id),ref:str(ref)});
  for(const category of arr(snapshot.categories)){
    if(str(category.parentId)&&!categories.has(str(category.parentId)))missing('missing-category-parent','categories',category.id,category.parentId);
    if(str(category.imageMediaId)&&!media.has(str(category.imageMediaId)))missing('missing-category-media','categories',category.id,category.imageMediaId);
    if(str(category.imageSecondaryMediaId)&&!media.has(str(category.imageSecondaryMediaId)))missing('missing-category-secondary-media','categories',category.id,category.imageSecondaryMediaId);
    for(const id of arr(category.productIds).map(str).filter(Boolean))if(!products.has(id))missing('missing-category-product','categories',category.id,id);
  }
  for(const product of arr(snapshot.products)){
    for(const id of arr(product.categoryIds).map(str).filter(Boolean))if(!categories.has(id))missing('missing-product-category','products',product.id,id);
    for(const id of arr(product.collectionIds).map(str).filter(Boolean))if(!collections.has(id))missing('missing-product-collection','products',product.id,id);
    for(const id of arr(product.mediaIds).map(str).filter(Boolean))if(!media.has(id))missing('missing-product-media','products',product.id,id);
    if(str(product.primaryMediaId)&&!media.has(str(product.primaryMediaId)))missing('missing-product-primary-media','products',product.id,product.primaryMediaId);
    for(const id of arr(product.variantIds).map(str).filter(Boolean))if(!variants.has(id))missing('missing-product-variant','products',product.id,id);
    if(str(product.primaryVariantId)&&!variants.has(str(product.primaryVariantId)))missing('missing-product-primary-variant','products',product.id,product.primaryVariantId);
  }
  for(const attribute of arr(snapshot.attributes))for(const id of arr(attribute.valueIds).map(str).filter(Boolean))if(!attributeValues.has(id))missing('missing-attribute-value','attributes',attribute.id,id);
  for(const value of arr(snapshot.attributeValues)){
    if(str(value.attributeId)&&!attributes.has(str(value.attributeId)))missing('missing-attribute-value-attribute','attributeValues',value.id,value.attributeId);
    if(str(value.mediaId)&&!media.has(str(value.mediaId)))missing('missing-attribute-value-media','attributeValues',value.id,value.mediaId);
  }
  for(const variant of arr(snapshot.variants)){
    if(str(variant.productId)&&!products.has(str(variant.productId)))missing('missing-variant-product','variants',variant.id,variant.productId);
    for(const id of arr(variant.mediaIds).map(str).filter(Boolean))if(!media.has(id))missing('missing-variant-media','variants',variant.id,id);
    if(str(variant.primaryMediaId)&&!media.has(str(variant.primaryMediaId)))missing('missing-variant-primary-media','variants',variant.id,variant.primaryMediaId);
  }
  for(const collection of arr(snapshot.collections)){
    if(str(collection.imageMediaId)&&!media.has(str(collection.imageMediaId)))missing('missing-collection-media','collections',collection.id,collection.imageMediaId);
    for(const id of arr(collection.productIds).map(str).filter(Boolean))if(!products.has(id))missing('missing-collection-product','collections',collection.id,id);
  }
  for(const filter of arr(snapshot.filters)){
    if(str(filter.attributeId)&&!attributes.has(str(filter.attributeId)))missing('missing-filter-attribute','filters',filter.id,filter.attributeId);
    for(const id of arr(filter.categoryIds).map(str).filter(Boolean))if(!categories.has(id))missing('missing-filter-category','filters',filter.id,id);
  }
  for(const rec of arr(snapshot.recommendations)){
    for(const id of arr(rec.sourceProductIds).map(str).filter(Boolean))if(!products.has(id))missing('missing-recommendation-source-product','recommendations',rec.id,id);
    for(const id of arr(rec.targetProductIds).map(str).filter(Boolean))if(!products.has(id))missing('missing-recommendation-target-product','recommendations',rec.id,id);
    for(const id of arr(rec.collectionIds).map(str).filter(Boolean))if(!collections.has(id))missing('missing-recommendation-collection','recommendations',rec.id,id);
  }
  if(str(snapshot?.seo?.openGraph?.defaultImageMediaId)&&!media.has(str(snapshot.seo.openGraph.defaultImageMediaId)))missing('missing-seo-open-graph-media','seo','openGraph',snapshot.seo.openGraph.defaultImageMediaId);
  return out;
}
export function previewMarketplaceRollbackPatch01397(snapshot={},patch={}){const conflicts=[],candidate=clone(snapshot),removedMedia=[];for(const op of arr(patch.operations)){
    const collection=str(op.collection),id=str(op.id);if(!COLLECTIONS.includes(collection)||!id){conflicts.push({code:'invalid-operation',collection,id});continue;}const current=currentEntity(candidate,collection,id);
    if(op.action==='remove-created'||op.action==='restore-updated'){
      if(!current){conflicts.push({code:'entity-missing',collection,id});continue;}if(str(op.postHash)&&fingerprintMarketplaceEntity01397(current)!==str(op.postHash)){conflicts.push({code:'entity-changed',collection,id});continue;}
      if(op.action==='remove-created'){if(collection==='media')removedMedia.push(clone(current));replaceEntity(candidate,collection,id,null);}else replaceEntity(candidate,collection,id,op.before);
    }else if(op.action==='restore-deleted'){
      if(current){conflicts.push({code:'entity-recreated',collection,id});continue;}replaceEntity(candidate,collection,id,op.before);
    }else conflicts.push({code:'invalid-action',collection,id});
  }
  if(!conflicts.length)conflicts.push(...referenceConflicts(candidate));
  return {ok:conflicts.length===0,conflicts,candidate,removedMedia,summary:clone(patch.summary||{})};
}

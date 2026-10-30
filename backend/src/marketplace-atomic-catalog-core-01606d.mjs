// 01606D · Pure, allowlisted catalog transaction planner. Never accepts a whole snapshot.
import {assertUniqueCategoryIdentity01490} from './marketplace-category-identity-core-01490.mjs';
const COLLECTIONS=Object.freeze(['categories','attributes','attributeValues','variants']);
const ACTIONS=Object.freeze(['create','update','delete']);
const err=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const clean=value=>String(value??'').trim();
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
const cloned=value=>JSON.parse(JSON.stringify(value));
const protectedKeys=new Set(['__proto__','constructor','prototype']);
const forbiddenFields=new Set(['id','createdAt','updatedAt','revision','storeId','accountId','workspaceId']);
function checkSafeObject(value){
 if(!record(value))throw err('MARKETPLACE_ATOMIC_INVALID_OBJECT_01606D');
 // Reject recursively to avoid surprising prototype keys or oversize recursive documents.
 const walk=(node,depth=0)=>{
  if(depth>24)throw err('MARKETPLACE_ATOMIC_MAX_DEPTH_01606D');
  if(Array.isArray(node)){if(node.length>10000)throw err('MARKETPLACE_ATOMIC_MAX_ARRAY_01606D');for(const x of node)walk(x,depth+1);}
  else if(record(node)){for(const [k,v] of Object.entries(node)){if(protectedKeys.has(k))throw err('MARKETPLACE_ATOMIC_UNSAFE_FIELD_01606D');walk(v,depth+1);}}
 };
 walk(value);
 return cloned(value);
}
export function normalizeCatalogOperations01606D(input){
 if(!record(input)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw err('MARKETPLACE_ATOMIC_EXPECTED_REVISION_01606D');
 if(!Array.isArray(input.operations)||!input.operations.length||input.operations.length>100)throw err('MARKETPLACE_ATOMIC_OPERATIONS_INVALID_01606D');
 const seen=new Set();
 const operations=input.operations.map((raw,index)=>{
  if(!record(raw)||!COLLECTIONS.includes(raw.collection)||!ACTIONS.includes(raw.action))throw err('MARKETPLACE_ATOMIC_OPERATION_INVALID_01606D');
  const {collection,action}=raw;
  const id=clean(raw.id||raw.value?.id);
  if(!/^[-\w:.]{1,160}$/.test(id))throw err('MARKETPLACE_ATOMIC_ID_INVALID_01606D');
  const unique=collection+':'+id;
  if(seen.has(unique))throw err('MARKETPLACE_ATOMIC_DUPLICATE_TARGET_01606D');
  seen.add(unique);
  let value=null;
  if(action!=='delete'){
   value=checkSafeObject(raw.value);
   if(value.id!==undefined&&clean(value.id)!==id)throw err('MARKETPLACE_ATOMIC_ID_MISMATCH_01606D');
   if(action==='update')for(const k of forbiddenFields)if(Object.hasOwn(value,k)){
    if(k==='id'&&clean(value.id)===id)continue;
    throw err('MARKETPLACE_ATOMIC_PROTECTED_FIELD_01606D');
   }
   if(action==='create'&&(Object.hasOwn(value,'createdAt')||Object.hasOwn(value,'updatedAt')))throw err('MARKETPLACE_ATOMIC_PROTECTED_FIELD_01606D');
  }
  return {collection,action,id,value,index};
 });
 return {expectedRevision:input.expectedRevision,operations};
}
function assertDeleteReferences(state,collection,id){
 if(collection==='categories'){
  if(state.categories.some(x=>clean(x.parentId)===id&&clean(x.id)!==id)||state.products?.some(x=>clean(x.categoryId)===id||Array.isArray(x.categoryIds)&&x.categoryIds.includes(id)))throw err('MARKETPLACE_ATOMIC_CATEGORY_IN_USE_01606D',409);
 }
 if(collection==='attributes'){
  if(state.attributeValues.some(x=>clean(x.attributeId)===id))throw err('MARKETPLACE_ATOMIC_ATTRIBUTE_IN_USE_01606D',409);
 }
 if(collection==='variants'){
  if(state.products?.some(x=>clean(x.primaryVariantId)===id||Array.isArray(x.variantIds)&&x.variantIds.includes(id)))throw err('MARKETPLACE_ATOMIC_VARIANT_IN_USE_01606D',409);
 }
}
function validateLinks(state,collection,entity){
 if(collection==='variants'){
  if(!entity.productId||!state.products?.some(x=>clean(x.id)===clean(entity.productId)))throw err('MARKETPLACE_ATOMIC_VARIANT_PRODUCT_MISSING_01606D',409);
 }
 if(collection==='attributeValues'){
  if(!entity.attributeId||!state.attributes.some(x=>clean(x.id)===clean(entity.attributeId)))throw err('MARKETPLACE_ATOMIC_ATTRIBUTE_MISSING_01606D',409);
 }
 if(collection==='categories'&&entity.parentId){
  let parent=clean(entity.parentId),depth=0;
  while(parent){
   if(parent===clean(entity.id))throw err('MARKETPLACE_ATOMIC_CATEGORY_CYCLE_01606D',409);
   const p=state.categories.find(x=>clean(x.id)===parent);
   if(!p)throw err('MARKETPLACE_ATOMIC_CATEGORY_PARENT_MISSING_01606D',409);
   parent=clean(p.parentId);
   if(++depth>state.categories.length)throw err('MARKETPLACE_ATOMIC_CATEGORY_CYCLE_01606D',409);
  }
 }
}
export function applyAtomicCatalogOperations01606D(before,normalized,{now=new Date().toISOString()}={}){
 if(Number(before?.revision)!==normalized.expectedRevision)throw err('MARKETPLACE_ATOMIC_REVISION_CONFLICT_01606D',409);
 const state={...before};for(const key of COLLECTIONS)state[key]=cloned(Array.isArray(before[key])?before[key]:[]);
 for(const {collection,action,id,value} of normalized.operations){
  const list=state[collection],index=list.findIndex(x=>clean(x.id)===id);
  if(action==='create'){
   if(index!==-1)throw err('MARKETPLACE_ATOMIC_DUPLICATE_ID_01606D',409);
   const entity={...value,id,createdAt:now,updatedAt:now};
   if(collection==='categories')assertUniqueCategoryIdentity01490(list,entity);
   validateLinks(state,collection,entity);
   list.push(entity);
  }else if(action==='update'){
   if(index===-1)throw err('MARKETPLACE_ATOMIC_NOT_FOUND_01606D',404);
   const current=list[index],entity={...current,...value,id,createdAt:current.createdAt,updatedAt:now};
   if(collection==='categories')assertUniqueCategoryIdentity01490(list,entity,{exceptId:id});
   validateLinks(state,collection,entity);
   list[index]=entity;
  }else{
   if(index===-1)throw err('MARKETPLACE_ATOMIC_NOT_FOUND_01606D',404);
   assertDeleteReferences(state,collection,id);
   list.splice(index,1);
  }
 }
 return state;
}
export const CATALOG_COLLECTIONS_01606D=COLLECTIONS;

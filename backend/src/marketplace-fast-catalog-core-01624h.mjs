// 01624H: narrow catalog draft operations; no full-snapshot replacement.
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const err=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const validId=x=>typeof x==='string'&&/^[-\w:.]{1,160}$/.test(x)&&!['__proto__','constructor','prototype'].includes(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e9;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const FAST_MODE='fast-editor-01624H';
export function normalizeFastPlan(input){
 if(!isObj(input)||input.mode!==FAST_MODE||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||!validId(input.batchId)||!Array.isArray(input.operations)||!input.operations.length||input.operations.length>20000)throw err('ST_FAST_CATALOG_PLAN_INVALID_01624H');
 const seen=new Set();const operations=input.operations.map(op=>{
  if(!isObj(op)||!['categories','products'].includes(op.collection)||!validId(op.id)||!isObj(op.patch)||!Object.keys(op.patch).length)throw err('ST_FAST_CATALOG_OPERATION_INVALID_01624H');
  const key=op.collection+':'+op.id;if(seen.has(key))throw err('ST_FAST_CATALOG_DUPLICATE_01624H');seen.add(key);
  const patch={};for(const [k,v] of Object.entries(op.patch)){
   if(k==='deleted'&&v===true)patch.deleted=true;
   else if(op.collection==='categories'){
    if(k==='parentId'&&(v===null||validId(v)))patch[k]=v;
    else if(k==='sortOrder'&&integer(v))patch[k]=v;
    else if(k==='hidden'&&typeof v==='boolean')patch[k]=v;
    else throw err('ST_FAST_CATALOG_FIELD_DENIED_01624H');
   }else{
    if(k==='status'&&['active','draft'].includes(v))patch[k]=v;
    else if(k==='categoryIds'&&Array.isArray(v)&&v.length<=1000&&v.every(validId)&&new Set(v).size===v.length)patch[k]=v.slice();
    else if(k==='order'&&isObj(v)&&Object.keys(v).length<=1000&&Object.entries(v).every(([id,n])=>validId(id)&&integer(n)))patch[k]={...v};
    else throw err('ST_FAST_CATALOG_FIELD_DENIED_01624H');
   }
  }
  if(patch.deleted&&Object.keys(patch).length!==1)throw err('ST_FAST_CATALOG_DELETE_MIXED_FIELDS_01624I');
  return {collection:op.collection,id:op.id,patch,bulk:op.collection==='products'&&Object.hasOwn(patch,'status')&&op.bulk===true};
 });return {mode:FAST_MODE,expectedRevision:input.expectedRevision,batchId:input.batchId,operations};
}
export function mergeFastOperation(previous,next){if(next.patch?.deleted)return {...next,patch:{deleted:true},bulk:false};if(previous?.patch?.deleted)throw err('ST_FAST_CATALOG_ALREADY_DELETED_01624I');return {...next,patch:{...previous?.patch,...next.patch,...(next.patch.order?{order:{...previous?.patch?.order,...next.patch.order}}:{})},bulk:Object.hasOwn(next.patch,'status')?!!next.bulk:!!previous?.bulk};}
export function patchFastRow(row,op,now){
 const p=op.patch,next={...row};if(op.collection==='categories'){
  if(Object.hasOwn(p,'parentId'))next.parentId=p.parentId;
  if(Object.hasOwn(p,'sortOrder')){next.sortOrder=p.sortOrder;next.attributes={...next.attributes,__treeSortOrder:p.sortOrder};}
  if(Object.hasOwn(p,'hidden'))next.attributes={...next.attributes,storefrontHidden01258:p.hidden};
 }else{
  if(Object.hasOwn(p,'status'))next.status=p.status;
  if(p.categoryIds)next.categoryIds=p.categoryIds.slice();
  if(p.order)next.configuration={...next.configuration,categoryTreeOrder01257:{...next.configuration?.categoryTreeOrder01257,...p.order}};
 }
 if(now)next.updatedAt=now;return next;
}
// Deletion is scoped to the selected category branches and explicitly selected products.
// Variant metadata is cleaned with its parent product; media bytes are deliberately retained.
export function expandFastDeletion01624I(snapshot,operations){
 const requestedCategories=new Set(operations.filter(op=>op.collection==='categories'&&op.patch?.deleted).map(op=>op.id));
 const categoryPatches=new Map(operations.filter(op=>op.collection==='categories').map(op=>[op.id,op.patch]));
 const productPatches=new Map(operations.filter(op=>op.collection==='products').map(op=>[op.id,op.patch]));
 const deletedCategories=new Set(requestedCategories),deletedProducts=new Set(operations.filter(op=>op.collection==='products'&&op.patch?.deleted).map(op=>op.id));
 if(requestedCategories.size){
  const children=new Map();for(const c of snapshot.categories||[]){const id=String(categoryPatches.get(c.id)?.parentId??c.parentId??'');if(!children.has(id))children.set(id,[]);children.get(id).push(c.id);}
  const stack=[...requestedCategories];while(stack.length){for(const id of children.get(stack.pop())||[])if(!deletedCategories.has(id)){deletedCategories.add(id);stack.push(id);}}
  for(const p of snapshot.products||[]){const assigned=productPatches.get(p.id)?.categoryIds||p.categoryIds||[];const ids=(assigned.length?assigned:[p.categoryId]).filter(Boolean);if(ids.some(id=>deletedCategories.has(id)))deletedProducts.add(p.id);}
 }
 return {categories:deletedCategories,products:deletedProducts};
}
export function overlayFastCatalog(snapshot,operations,now){
 const entries=[...operations],by={categories:new Map(),products:new Map()};for(const op of entries)by[op.collection].set(op.id,op);
 const deleted=expandFastDeletion01624I(snapshot,entries);
 const next={...snapshot,...Object.fromEntries(Object.keys(by).map(k=>[k,by[k].size?(snapshot[k]||[]).filter(row=>!deleted[k].has(row.id)).map(row=>by[k].has(row.id)?patchFastRow(row,by[k].get(row.id),now):row):(snapshot[k]||[]).filter(row=>!deleted[k].has(row.id))]))};
 if(deleted.products.size){next.variants=(snapshot.variants||[]).filter(v=>!deleted.products.has(v.productId));}
 return next;
}
export function applyFastCatalog(snapshot,plan,now=new Date().toISOString()){
 if(snapshot.revision!==plan.expectedRevision)throw err('ST_FAST_CATALOG_REVISION_CONFLICT_01624H',409);
 const before={categories:new Map((snapshot.categories||[]).map(x=>[x.id,x])),products:new Map((snapshot.products||[]).map(x=>[x.id,x]))};
 for(const op of plan.operations){const row=before[op.collection].get(op.id);if(!row)throw err('ST_FAST_CATALOG_ENTITY_MISSING_01624H',409);if(op.collection==='products'&&Object.hasOwn(op.patch,'status')&&row.status==='archived')throw err('ST_FAST_CATALOG_ARCHIVED_01624H',409);}
 const deleted=expandFastDeletion01624I(snapshot,plan.operations);
 const next=overlayFastCatalog(snapshot,plan.operations,now),cats=new Map(next.categories.map(x=>[x.id,x]));
 const identity=x=>JSON.stringify([x.parentId||'',String(x.name||'').trim().normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ')]);
 const counts=new Map();for(const c of next.categories){const key=identity(c);counts.set(key,(counts.get(key)||0)+1);}
 // Validate final graph, including descendants of moved branches, without N×catalog scans.
 if(plan.operations.some(op=>op.collection==='categories'&&(Object.hasOwn(op.patch,'parentId')||op.patch.deleted))){
  for(const c of next.categories){const seen=new Set([c.id]);let parent=c.parentId;while(parent){if(seen.has(parent)||!cats.has(parent)||seen.size>=10)throw err('ST_FAST_CATALOG_INVALID_TREE_01624H',409);seen.add(parent);parent=cats.get(parent).parentId;}}
  for(const op of plan.operations)if(op.collection==='categories'&&Object.hasOwn(op.patch,'parentId')&&(counts.get(identity(cats.get(op.id)))||0)>1)throw err('MARKETPLACE_CATEGORY_DUPLICATE_01490',409);
 }
 for(const op of plan.operations)if(op.collection==='products'&&op.patch.categoryIds?.some(id=>!cats.has(id)))throw err('ST_FAST_CATALOG_CATEGORY_MISSING_01624H',409);
 if(deleted.categories.size&&next.products.some(p=>(p.categoryIds?.length?p.categoryIds:[p.categoryId]).filter(Boolean).some(id=>!cats.has(id))))throw err('ST_FAST_CATALOG_DELETED_CATEGORY_REFERENCED_01624I',409);
 return next;
}
export function categoryFastPatch(id,patch){return {collection:'categories',id,patch:{...(Object.hasOwn(patch,'parentId')?{parentId:patch.parentId||null}:{}),...(Object.hasOwn(patch,'sortOrder')?{sortOrder:Number(patch.sortOrder)}:{}),...(Object.hasOwn(patch.attributes||{},'storefrontHidden01258')?{hidden:!!patch.attributes.storefrontHidden01258}:{})}};}
export function productMoveFastOperations(before,after){const rows=new Map(before.map(p=>[p.id,p]));const out=[];for(const row of after){const old=rows.get(row.id);if(!old)continue;const patch={};if(!same(old.categoryIds,row.categoryIds))patch.categoryIds=row.categoryIds;const a=old.configuration?.categoryTreeOrder01257||{},b=row.configuration?.categoryTreeOrder01257||{},order={};for(const [k,v] of Object.entries(b))if(a[k]!==v)order[k]=v;if(Object.keys(order).length)patch.order=order;if(Object.keys(patch).length)out.push({collection:'products',id:row.id,patch});}return out;}

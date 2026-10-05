// 01390 · Read-only Marketplace import diff model.
// Compares the already-normalized import plan against the current canonical Marketplace snapshot.
// This module never mutates Product / Variant / Category / Media records.
import { normalizeMarketplaceMediaReference01389 } from './marketplace-import-media-service-01389.mjs';

const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const norm=v=>str(v).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[’'`]/g,'').replace(/[_./\\-]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
const equalScalar=(a,b)=>typeof a==='number'||typeof b==='number'?Number(a)===Number(b):str(a)===str(b);
const uniqueSorted=values=>[...new Set(arr(values).map(str).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uk'));
const equalList=(a,b)=>{const A=uniqueSorted(a),B=uniqueSorted(b);return A.length===B.length&&A.every((v,i)=>norm(v)===norm(B[i]));};

export const MARKETPLACE_IMPORT_DIFF_STAGE_01390='01390';

function categoryIndex(state){return new Map(arr(state?.categories).map(c=>[str(c.id),c]));}
function categoryPath(state,id){
  const map=categoryIndex(state),parts=[];let current=map.get(str(id)),guard=0;
  while(current&&guard++<40){parts.unshift(str(current.name||current.slug||current.id));current=current.parentId?map.get(str(current.parentId)):null;}
  return parts.filter(Boolean).join(' > ');
}
function productCategoryPaths(state,product){return uniqueSorted(arr(product?.categoryIds).map(id=>categoryPath(state,id)).filter(Boolean));}
function categoryPathExists(state,path){const parts=str(path).split(/\s*>\s*|\s*\/\s*/).map(str).filter(Boolean);if(!parts.length)return true;const map=categoryIndex(state);let parentId=null;for(const part of parts){const found=[...map.values()].find(c=>(c.parentId??null)===(parentId??null)&&(norm(c.name)===norm(part)||norm(c.slug)===norm(part)));if(!found)return false;parentId=found.id;}return true;}
function countMissingCategoryNodes(state,rows){const existing=new Set(arr(state?.categories).map(c=>norm(categoryPath(state,c.id))).filter(Boolean)),planned=new Set();for(const row of arr(rows)){if(!row?._mapped?.has?.('categories'))continue;for(const raw of arr(row.categories)){const parts=str(raw).split(/\s*>\s*|\s*\/\s*/).map(str).filter(Boolean),prefix=[];for(const part of parts){prefix.push(part);const key=norm(prefix.join(' > '));if(key&&!existing.has(key))planned.add(key);}}}return planned.size;}
function mediaIndex(state){return new Map(arr(state?.media).map(m=>[str(m.id),m]));}
function entityMediaUrls(state,entity){const map=mediaIndex(state);return uniqueSorted(arr(entity?.mediaIds).map(id=>normalizeMarketplaceMediaReference01389(map.get(str(id))?.url)).filter(Boolean));}
function desiredMediaUrls(values){return uniqueSorted(arr(values).map(normalizeMarketplaceMediaReference01389).filter(Boolean));}
function valueChange(field,before,after,kind='value',meta={}){return {field,kind,before,after,...meta};}
function pushScalar(changes,mapped,field,before,after,prefix){if(mapped?.has(field)&&!equalScalar(before,after))changes.push(valueChange(`${prefix}.${field}`,before,after));}
function summarize(items){
  const updates=items.filter(x=>x.action==='update'),creates=items.filter(x=>x.action==='create'),skips=items.filter(x=>x.action==='skip'),errors=items.filter(x=>x.action==='error');
  const changedUpdates=updates.filter(x=>x.changed),unchangedUpdates=updates.filter(x=>!x.changed);
  return {
    entities:items.length,creates:creates.length,updates:updates.length,skips:skips.length,errors:errors.length,
    changedUpdates:changedUpdates.length,unchangedUpdates:unchangedUpdates.length,
    fieldChanges:changedUpdates.reduce((n,x)=>n+x.changes.length,0),
    productCreates:creates.filter(x=>x.entity==='product').length,variantCreates:creates.filter(x=>x.entity==='variant').length,
    productChanged:changedUpdates.filter(x=>x.entity==='product').length,variantChanged:changedUpdates.filter(x=>x.entity==='variant').length,
    productUnchanged:unchangedUpdates.filter(x=>x.entity==='product').length,variantUnchanged:unchangedUpdates.filter(x=>x.entity==='variant').length
  };
}
function productDiff(existing,row,state,{line=0,action='update',existingId=''}={}){
  const changes=[],mapped=row?._mapped;
  for(const field of ['name','sku','status','slug','brand','price','oldPrice','currency','stock','availability','shortDescription','description'])pushScalar(changes,mapped,field,existing?.[field],row?.[field],'product');
  for(const target of mapped||[]){if(!String(target).startsWith('attribute:'))continue;const key=String(target).slice(10),before=obj(existing?.attributes)[key]??'',after=obj(row?.attributes)[key]??'';if(!equalScalar(before,after))changes.push(valueChange(`product.attribute.${key}`,before,after,'attribute',{attributeKey:key}));}
  if(mapped?.has('categories')){const before=productCategoryPaths(state,existing),after=uniqueSorted(row?.categories);if(!equalList(before,after))changes.push(valueChange('product.categories',before,after,'categories'));}
  if(mapped?.has('images')){const before=entityMediaUrls(state,existing),after=desiredMediaUrls(row?.images);if(!equalList(before,after))changes.push(valueChange('product.media',before,after,'media'));}
  return {id:`product:${existingId||row?.id||row?.sku||line}`,entity:'product',line,action,existingId:existingId||str(existing?.id),name:str(row?.name||existing?.name),sku:str(row?.sku||existing?.sku),changed:action==='create'||changes.length>0,changes};
}
function variantDiff(existing,row,state,{line=0,action='update',existingId='',productName=''}={}){
  const changes=[],mapped=row?.variant?._mapped,variant=row?.variant||{};
  for(const field of ['sku','status','price','oldPrice','stock','availability'])if(mapped?.has(`variant:${field}`)&&!equalScalar(existing?.[field],variant?.[field]))changes.push(valueChange(`variant.${field}`,existing?.[field],variant?.[field]));
  for(const target of mapped||[]){if(!String(target).startsWith('variantAttribute:'))continue;const key=String(target).slice(17),before=obj(existing?.options)[key]??'',after=obj(variant?.options)[key]??'';if(!equalScalar(before,after))changes.push(valueChange(`variant.option.${key}`,before,after,'option',{attributeKey:key}));}
  if(mapped?.has('variant:images')){const before=entityMediaUrls(state,existing),after=desiredMediaUrls(variant?.images);if(!equalList(before,after))changes.push(valueChange('variant.media',before,after,'media'));}
  return {id:`variant:${existingId||variant?.sku||line}`,entity:'variant',line,action,existingId:existingId||str(existing?.id),name:str(productName||row?.name),sku:str(variant?.sku||existing?.sku),changed:action==='create'||changes.length>0,changes};
}

export function buildMarketplaceImportDiff01390(plan,state){
  const products=new Map(arr(state?.products).map(p=>[str(p.id),p])),variants=new Map(arr(state?.variants).map(v=>[str(v.id),v])),items=[];
  if(plan?.rowMode==='variants'){
    for(const group of arr(plan?.groups)){
      const first=group?.rows?.[0],existing=group?.existing?products.get(str(group.existing.id))||group.existing:null;
      items.push(productDiff(existing,first?.row,state,{line:first?.line||0,action:group?.action||'create',existingId:existing?.id||''}));
    }
    for(const item of arr(plan?.plan)){
      const existing=item?.existingId?variants.get(str(item.existingId)):null;
      items.push(variantDiff(existing,item?.row,state,{line:item?.line||0,action:item?.action||'create',existingId:item?.existingId||'',productName:item?.existingName||item?.row?.name||''}));
    }
  }else{
    for(const item of arr(plan?.plan)){
      const existing=item?.existingId?products.get(str(item.existingId)):null;
      items.push(productDiff(existing,item?.row,state,{line:item?.line||0,action:item?.action||'create',existingId:item?.existingId||''}));
    }
  }
  const summary=summarize(items),byLine={};
  summary.categoryCreates=plan?.options?.createMissingCategories!==false?countMissingCategoryNodes(state,plan?.canonicalRows):0;summary.mediaCreates=Number(plan?.mediaSummary?.newRefs)||0;summary.mediaReused=Number(plan?.mediaSummary?.reusedRefs)||0;
  for(const item of items){const key=`${item.entity}:${item.line}`;(byLine[key]||(byLine[key]=[])).push(item);}
  return {stage:MARKETPLACE_IMPORT_DIFF_STAGE_01390,items,summary,byLine};
}

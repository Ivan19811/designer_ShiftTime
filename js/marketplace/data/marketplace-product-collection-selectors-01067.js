// 01067 · Product Collection query selectors.
// Pure/storage-agnostic projection: Marketplace snapshot -> ordered Product list.
// Product Grid never knows which repository physically stores the snapshot.
import { getMarketplaceCategoryDescendantIds01057 } from './marketplace-category-selectors-01057.js?v=01057';
import { getMarketplaceProductBindingData01064 } from './marketplace-commerce-binding-selectors-01064.js?v=01064';

const arr=v=>Array.isArray(v)?v:[];
const str=v=>String(v??'').trim();
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const uniq=v=>[...new Set(arr(v).map(str).filter(Boolean))];
const bool=v=>v===true||v===1||v==='1'||String(v||'').toLowerCase()==='true';

export const PRODUCT_COLLECTION_SOURCE_TYPES_01067=Object.freeze(['all','category','collection','manual']);
export const PRODUCT_COLLECTION_SORT_TYPES_01067=Object.freeze(['default','price-asc','price-desc','newest','name','sale','manual']);
export const PRODUCT_COLLECTION_OVERFLOW_TYPES_01067=Object.freeze(['none','load-more','pagination']);

export function normalizeMarketplaceProductCollectionQuery01067(input={}){
  const source=PRODUCT_COLLECTION_SOURCE_TYPES_01067.includes(str(input.source))?str(input.source):'category';
  const sort=PRODUCT_COLLECTION_SORT_TYPES_01067.includes(str(input.sort))?str(input.sort):'default';
  const overflow=PRODUCT_COLLECTION_OVERFLOW_TYPES_01067.includes(str(input.overflow))?str(input.overflow):'none';
  const rawLimit=Math.round(num(input.limit,12));
  return Object.freeze({
    source,
    categoryId:str(input.categoryId),
    collectionId:str(input.collectionId),
    manualProductIds:Object.freeze(uniq(input.manualProductIds)),
    includeDescendants:input.includeDescendants!==false&&!['0','false'].includes(String(input.includeDescendants).toLowerCase()),
    status:['all','active','draft','archived'].includes(str(input.status))?str(input.status):'active',
    availability:['all','in-stock','out-of-stock','preorder'].includes(str(input.availability))?str(input.availability):'all',
    sort,
    limit:rawLimit<=0?0:clamp(rawLimit,1,500),
    overflow,
    columnsDesktop:clamp(Math.round(num(input.columnsDesktop,4)),1,8),
    columnsTablet:clamp(Math.round(num(input.columnsTablet,3)),1,6),
    columnsMobile:clamp(Math.round(num(input.columnsMobile,2)),1,4),
    columnsSmall:clamp(Math.round(num(input.columnsSmall,1)),1,2),
    gap:clamp(Math.round(num(input.gap,16)),0,64)
  });
}

function discountPercent(p){const price=num(p?.price),old=num(p?.oldPrice);return old>price&&price>0?Math.round((1-price/old)*100):0;}
function inCollection(product,collection){
  if(!product||!collection)return false;
  return arr(collection.productIds).includes(product.id)||arr(product.collectionIds).includes(collection.id);
}
function sourceFilter(state,query,products){
  if(query.source==='all')return products.slice();
  if(query.source==='manual'){
    const map=new Map(products.map(p=>[p.id,p]));return query.manualProductIds.map(id=>map.get(id)).filter(Boolean);
  }
  if(query.source==='collection'){
    const collection=arr(state.collections).find(c=>c.id===query.collectionId&&c.status!=='archived');
    return collection?products.filter(p=>inCollection(p,collection)):[];
  }
  const category=arr(state.categories).find(c=>c.id===query.categoryId&&c.status!=='archived');if(!category)return [];
  const ids=new Set([category.id]);if(query.includeDescendants)for(const id of getMarketplaceCategoryDescendantIds01057(state.categories||[],category.id))ids.add(id);
  return products.filter(p=>arr(p.categoryIds).some(id=>ids.has(id)));
}
function statusFilter(query,products){return products.filter(p=>{if(query.status!=='all'&&p.status!==query.status)return false;if(query.availability==='all')return true;if(query.availability==='in-stock')return p.availability==='in-stock'&&num(p.stock)>0;if(query.availability==='out-of-stock')return p.availability==='out-of-stock'||num(p.stock)<=0;return p.availability===query.availability;});}
function sortProducts(query,products){
  const out=products.slice();
  if(query.sort==='manual'){
    const pos=new Map(query.manualProductIds.map((id,i)=>[id,i]));return out.sort((a,b)=>(pos.get(a.id)??999999)-(pos.get(b.id)??999999));
  }
  if(query.sort==='price-asc')return out.sort((a,b)=>num(a.price)-num(b.price));
  if(query.sort==='price-desc')return out.sort((a,b)=>num(b.price)-num(a.price));
  if(query.sort==='newest')return out.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
  if(query.sort==='name')return out.sort((a,b)=>str(a.name||a.sku).localeCompare(str(b.name||b.sku),'uk'));
  if(query.sort==='sale')return out.sort((a,b)=>discountPercent(b)-discountPercent(a)||num(a.price)-num(b.price));
  return out;
}

export function getMarketplaceProductCollectionResult01067(state={},input={}){
  const query=normalizeMarketplaceProductCollectionQuery01067(input),all=arr(state.products);
  const sourced=sourceFilter(state,query,all),filtered=statusFilter(query,sourced),ordered=sortProducts(query,filtered);
  const bindings=ordered.map(p=>getMarketplaceProductBindingData01064(state,p)).filter(Boolean);
  const category=query.categoryId?arr(state.categories).find(c=>c.id===query.categoryId)||null:null;
  const collection=query.collectionId?arr(state.collections).find(c=>c.id===query.collectionId)||null:null;
  const title=query.source==='category'?(category?.name||'Категорія не знайдена'):query.source==='collection'?(collection?.name||'Колекція не знайдена'):query.source==='manual'?'Ручний список':'Усі товари';
  return Object.freeze({query,total:bindings.length,productIds:Object.freeze(bindings.map(p=>p.id)),products:Object.freeze(bindings),title,category,collection,sourceExists:query.source==='all'||query.source==='manual'||!!(category||collection)});
}

export function listMarketplaceProductCollectionOptions01067(state={}){
  const categories=arr(state.categories).filter(c=>c.status!=='archived').slice().sort((a,b)=>str(a.name).localeCompare(str(b.name),'uk')).map(c=>({id:c.id,name:c.name,status:c.status,parentId:c.parentId||''}));
  const collections=arr(state.collections).filter(c=>c.status!=='archived').slice().sort((a,b)=>str(a.name).localeCompare(str(b.name),'uk')).map(c=>({id:c.id,name:c.name,status:c.status,mode:c.mode||'manual'}));
  const products=arr(state.products).filter(p=>p.status!=='archived').slice().sort((a,b)=>str(a.name||a.sku).localeCompare(str(b.name||b.sku),'uk')).map(p=>({id:p.id,name:p.name||p.sku||p.id,sku:p.sku||'',status:p.status,price:num(p.price),categoryIds:arr(p.categoryIds)}));
  return Object.freeze({categories:Object.freeze(categories),collections:Object.freeze(collections),products:Object.freeze(products)});
}

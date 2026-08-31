// 01064 · Commerce Binding selectors.
// Pure/storage-agnostic projections from canonical Marketplace snapshot to storefront card data.
// Product/Category cards never know which physical repository adapter backs MarketplaceStore.
import { getMarketplaceCategoryBindingData01057 } from './marketplace-category-selectors-01057.js?v=01057';
import { getEntitySeoData01063 } from '../services/marketplace-seo-service-01063.js?v=01063';

const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const str=v=>String(v??'').trim();
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

function mediaMap(state){ return new Map(arr(state?.media).map(m=>[m.id,m])); }
function productById(state,id){ return arr(state?.products).find(p=>p.id===id)||null; }
function categoryById(state,id){ return arr(state?.categories).find(c=>c.id===id)||null; }
function categoryNames(state,ids){ const map=new Map(arr(state?.categories).map(c=>[c.id,c]));return arr(ids).map(id=>map.get(id)?.name).filter(Boolean); }
function directCategoryChildren(state,id){ return arr(state?.categories).filter(c=>c.parentId===id&&c.status!=='archived').sort((a,b)=>str(a.name).localeCompare(str(b.name),'uk')); }
function mediaForProduct(state,product){
  const mm=mediaMap(state),ids=[product?.primaryMediaId,...arr(product?.mediaIds)].map(str).filter(Boolean),seen=new Set(),rows=[];
  for(const id of ids){ if(seen.has(id))continue;seen.add(id);const m=mm.get(id);if(m)rows.push(m); }
  return rows;
}
function percentDiscount(price,oldPrice){const p=num(price),o=num(oldPrice);return o>p&&p>0?Math.max(1,Math.round((1-p/o)*100)):0;}
function isTruthy(v){return v===true||v===1||v==='1'||String(v||'').toLowerCase()==='true';}
function deriveProductBadge(product){
  const a=obj(product?.attributes),explicit=str(a.badge||a.label||a.marketingBadge);if(explicit)return explicit;
  if(product?.availability==='out-of-stock'||num(product?.stock)<=0)return 'НЕМАЄ';
  if(percentDiscount(product?.price,product?.oldPrice)>0)return 'АКЦІЯ';
  if(isTruthy(a.isNew)||isTruthy(a.new))return 'NEW';
  if(isTruthy(a.bestSeller)||isTruthy(a.hit))return 'ХІТ';
  return '';
}
function deriveCategoryBadge(category){const a=obj(category?.attributes);return str(a.badge||a.label||a.marketingBadge);}
function normalizeRating(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(5,n)):0;}
function featureDisplay(value){
  if(value===null||value===undefined)return '';
  if(Array.isArray(value))return value.map(str).filter(Boolean).join(' · ');
  if(typeof value==='object'){
    const min=value.min,max=value.max,unit=str(value.unit);
    if(min!==undefined&&min!==null&&max!==undefined&&max!==null){const left=num(min,min),right=num(max,max);return left===right?`${left}${unit?` ${unit}`:''}`:`${left}–${right}${unit?` ${unit}`:''}`;}
    if(value.value!==undefined)return `${str(value.value)}${unit?` ${unit}`:''}`.trim();
    return '';
  }
  return str(value);
}

export function getMarketplaceProductBindingData01064(state={},productOrId=''){
  const product=typeof productOrId==='string'?productById(state,productOrId):productOrId;if(!product)return null;
  const media=mediaForProduct(state,product),primary=media[0]||null,secondary=media[1]||null;
  const seo=getEntitySeoData01063(state,'product',product)||null;
  const discountPercent=percentDiscount(product.price,product.oldPrice),attrs={...obj(product.attributes)};
  const rating=normalizeRating(attrs.rating),reviewsCount=Math.max(0,Math.round(num(attrs.reviewsCount??attrs.reviews_count,0)));
  return {
    ...product,
    attributes:attrs,
    image:primary?.url||'',imageAlt:primary?.alt||product.name||'',imageSecondary:secondary?.url||primary?.url||'',imageSecondaryAlt:secondary?.alt||primary?.alt||product.name||'',
    badge:deriveProductBadge(product),discountPercent,discount:discountPercent?`−${discountPercent}%`:'',
    rating,reviewsCount,
    stockLabel:product.availability==='preorder'?'● Передзамовлення':(product.availability==='out-of-stock'||num(product.stock)<=0?'● Немає в наявності':`● В наявності${num(product.stock)>0?` · ${Math.round(num(product.stock))} шт`:''}`),
    availabilityLabel:product.availability==='preorder'?'Передзамовлення':(product.availability==='out-of-stock'||num(product.stock)<=0?'Немає в наявності':'В наявності'),
    categoryNames:categoryNames(state,product.categoryIds),
    url:seo?.url||`product/${str(product.slug||product.id)}`,canonicalUrl:seo?.canonicalUrl||'',
    currency:str(product.currency)||str(state?.settings?.currency)||'UAH',
    computed:{discountPercent,rating,reviewsCount}
  };
}

export function getMarketplaceCategoryCardBindingData01064(state={},categoryOrId=''){
  const category=typeof categoryOrId==='string'?categoryById(state,categoryOrId):categoryOrId;if(!category)return null;
  const base=getMarketplaceCategoryBindingData01057(category,state)||category;
  const seo=getEntitySeoData01063(state,'category',category)||null;
  const children=directCategoryChildren(state,category.id),mm=mediaMap(state),primary=mm.get(category.imageMediaId),secondary=mm.get(category.imageSecondaryMediaId);
  return {
    ...base,
    description:str(category.shortDescription)||str(category.description),
    imageAlt:primary?.alt||category.name||'',imageSecondaryAlt:secondary?.alt||primary?.alt||category.name||'',
    badge:deriveCategoryBadge(category),
    icon:str(category.icon)||'↗',
    children:children.map(c=>({id:c.id,name:c.name,slug:c.slug})),
    childrenLabels:children.map(c=>c.name).join(' · '),
    url:seo?.url||str(category.url)||`category/${str(category.slug||category.id)}`,
    canonicalUrl:seo?.canonicalUrl||'',
    currency:str(state?.settings?.currency)||'UAH'
  };
}

export function getMarketplaceCommerceBindingData01064(state={},type='product-card',id=''){
  const t=str(type).toLowerCase();
  if(t==='category-card'||t==='category'){
    const category=getMarketplaceCategoryCardBindingData01064(state,id);return category?{category,entity:category,entityType:'category',componentType:'category-card'}:null;
  }
  const product=getMarketplaceProductBindingData01064(state,id);return product?{product,entity:product,entityType:'product',componentType:'product-card'}:null;
}

export function resolveMarketplaceCommerceBindingPath01064(binding,key){
  const raw=str(key);if(!raw||!binding)return undefined;
  if(Object.prototype.hasOwnProperty.call(binding,raw))return binding[raw];
  const parts=raw.split('.').filter(Boolean);let cur=binding;
  for(const p of parts){if(cur==null||typeof cur!=='object'||!(p in cur))return undefined;cur=cur[p];}
  return cur;
}

export function formatMarketplaceBindingFeature01064(value){ return featureDisplay(value); }

export function listMarketplaceBindingEntities01064(state={},componentType='product-card'){
  const isCategory=str(componentType).toLowerCase()==='category-card';const rows=isCategory?arr(state.categories):arr(state.products);
  return rows.filter(x=>x.status!=='archived').slice().sort((a,b)=>str(a.name||a.sku).localeCompare(str(b.name||b.sku),'uk')).map(x=>({id:x.id,name:x.name||x.sku||x.id,sku:x.sku||'',status:x.status||'',componentType:isCategory?'category-card':'product-card'}));
}

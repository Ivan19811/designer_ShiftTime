// 01057 · Storage-agnostic Category selectors / derived commerce data.
// Derived metrics are computed from a MarketplaceStore snapshot and are never duplicated in persistence.

function numeric(v){const n=Number(v);return Number.isFinite(n)?n:null;}

export function getMarketplaceCategoryDescendantIds01057(categories,rootId){
  const out=new Set(),byParent=new Map();
  (Array.isArray(categories)?categories:[]).forEach(c=>{const k=c.parentId||'';if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(c.id);});
  const walk=id=>(byParent.get(id)||[]).forEach(child=>{if(out.has(child))return;out.add(child);walk(child);});
  walk(rootId);return out;
}

export function getMarketplaceCategoryTree01057(categories){
  const all=Array.isArray(categories)?categories:[];
  const byParent=new Map();
  all.forEach(c=>{const key=c.parentId||'';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key).push(c);});
  byParent.forEach(arr=>arr.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'uk')));
  const result=[],seen=new Set();
  const walk=(parentId,depth,path)=>{
    (byParent.get(parentId)||[]).forEach(c=>{if(seen.has(c.id))return;seen.add(c.id);result.push({category:c,depth,path:[...path,c.id]});walk(c.id,depth+1,[...path,c.id]);});
  };
  walk('',0,[]);
  all.forEach(c=>{if(!seen.has(c.id)){seen.add(c.id);result.push({category:c,depth:0,path:[c.id],orphan:true});walk(c.id,1,[c.id]);}});
  return result;
}

export function getMarketplaceCategoryStats01057(category,snapshot){
  const state=snapshot&&typeof snapshot==='object'?snapshot:{};
  if(!category||!String(category.id||'').trim())return {productsCount:0,directProductsCount:0,priceMin:0,priceMax:0,childrenCount:0,featureMin:null,featureMax:null,featureUnit:String(category?.attributes?.[category?.featureKey]?.unit||'')};
  const descendants=getMarketplaceCategoryDescendantIds01057(state.categories||[],category.id);
  const ids=new Set([category.id,...descendants]);
  const products=(state.products||[]).filter(p=>(p.categoryIds||[]).some(id=>ids.has(id)));
  const direct=(state.products||[]).filter(p=>(p.categoryIds||[]).includes(category.id));
  const prices=products.map(p=>numeric(p.price)).filter(n=>n!==null&&n>0);
  const key=String(category.featureKey||'').trim();
  const featureValues=key?products.map(p=>numeric(p.attributes?.[key])).filter(n=>n!==null):[];
  const configured=category.attributes?.[key];
  const configuredMin=numeric(configured?.min),configuredMax=numeric(configured?.max);
  return {
    productsCount:products.length,
    directProductsCount:direct.length,
    priceMin:prices.length?Math.min(...prices):0,
    priceMax:prices.length?Math.max(...prices):0,
    childrenCount:(state.categories||[]).filter(c=>c.parentId===category.id).length,
    featureMin:featureValues.length?Math.min(...featureValues):configuredMin,
    featureMax:featureValues.length?Math.max(...featureValues):configuredMax,
    featureUnit:String(configured?.unit||'')
  };
}

export function getMarketplaceCategoryBindingData01057(category,snapshot){
  if(!category)return null;
  const state=snapshot&&typeof snapshot==='object'?snapshot:{};
  const stats=getMarketplaceCategoryStats01057(category,state);
  const media=new Map((state.media||[]).map(m=>[m.id,m]));
  const primary=media.get(category.imageMediaId),secondary=media.get(category.imageSecondaryMediaId);
  const attributes={...(category.attributes||{})};
  if(category.featureKey&&(stats.featureMin!==null||stats.featureMax!==null)){
    const base=attributes[category.featureKey];
    attributes[category.featureKey]={...(base&&typeof base==='object'&&!Array.isArray(base)?base:{}),min:stats.featureMin,max:stats.featureMax,unit:stats.featureUnit||base?.unit||''};
  }
  return {
    ...category,
    attributes,
    productsCount:stats.productsCount,
    priceMin:stats.priceMin,
    priceMax:stats.priceMax,
    image:primary?.url||'',
    imageSecondary:secondary?.url||'',
    computed:{...stats}
  };
}

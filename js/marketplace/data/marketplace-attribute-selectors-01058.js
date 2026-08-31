// 01058 · Storage-agnostic selectors for attributes, variants and catalogue filters.
// Derived filter values/ranges are computed from MarketplaceStore snapshots and are never persisted as duplicated product data.

function arr(v){return Array.isArray(v)?v:[];}
function str(v){return String(v??'').trim();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function normalizeScalar(v){
  if(v===null||v===undefined)return [];
  if(Array.isArray(v))return v.flatMap(normalizeScalar);
  if(typeof v==='object'){
    if('value' in v)return normalizeScalar(v.value);
    return [];
  }
  const s=str(v);return s?[s]:[];
}

export function getMarketplaceAttributeByKey01058(snapshot,key){
  const target=str(key).toLowerCase();
  return arr(snapshot?.attributes).find(a=>str(a.key).toLowerCase()===target)||null;
}

export function getMarketplaceAttributeValues01058(snapshot,attributeId){
  const attr=arr(snapshot?.attributes).find(a=>a.id===attributeId);
  if(!attr)return [];
  const byId=new Map(arr(snapshot?.attributeValues).map(v=>[v.id,v]));
  const explicit=arr(attr.valueIds).map(id=>byId.get(id)).filter(Boolean);
  const rest=arr(snapshot?.attributeValues).filter(v=>v.attributeId===attributeId&&!arr(attr.valueIds).includes(v.id));
  return [...explicit,...rest].sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.label||a.value).localeCompare(str(b.label||b.value),'uk'));
}

export function getMarketplaceAttributeUsage01058(snapshot,attribute){
  const key=str(attribute?.key); if(!key)return {products:[],variants:[],filters:[]};
  const products=arr(snapshot?.products).filter(p=>Object.prototype.hasOwnProperty.call(p.attributes||{},key));
  const variants=arr(snapshot?.variants).filter(v=>Object.prototype.hasOwnProperty.call(v.options||{},key));
  const filters=arr(snapshot?.filters).filter(f=>f.attributeId===attribute.id||str(f.key)===key);
  return {products,variants,filters};
}

export function getMarketplaceAttributeValueUsage01058(snapshot,attribute,value){
  const key=str(attribute?.key), target=str(value?.value); if(!key||!target)return {products:[],variants:[]};
  const products=arr(snapshot?.products).filter(p=>normalizeScalar(p.attributes?.[key]).includes(target));
  const variants=arr(snapshot?.variants).filter(v=>normalizeScalar(v.options?.[key]).includes(target));
  return {products,variants};
}

export function getMarketplaceProductVariants01058(snapshot,productId){
  return arr(snapshot?.variants).filter(v=>v.productId===productId).sort((a,b)=>str(a.sku).localeCompare(str(b.sku),'uk'));
}

export function getMarketplaceVariantOptionAttributes01058(snapshot){
  return arr(snapshot?.attributes).filter(a=>a.variantOption===true).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.name).localeCompare(str(b.name),'uk'));
}

function productInFilterCategories(product,filter,snapshot){
  const allowed=arr(filter?.categoryIds); if(!allowed.length)return true;
  const descendants=new Set(allowed);
  let changed=true;
  while(changed){
    changed=false;
    for(const c of arr(snapshot?.categories))if(c.parentId&&descendants.has(c.parentId)&&!descendants.has(c.id)){descendants.add(c.id);changed=true;}
  }
  return arr(product?.categoryIds).some(id=>descendants.has(id));
}

export function getMarketplaceFilterDerivedData01058(filter,snapshot){
  const state=snapshot&&typeof snapshot==='object'?snapshot:{};
  const attr=arr(state.attributes).find(a=>a.id===filter?.attributeId)||getMarketplaceAttributeByKey01058(state,filter?.key);
  if(!attr)return {attribute:null,productsCount:0,values:[],min:null,max:null,unit:'',kind:filter?.type||'options'};
  const products=arr(state.products).filter(p=>p.status!=='archived'&&productInFilterCategories(p,filter,state));
  const productIds=new Set(products.map(p=>p.id));
  const variants=arr(state.variants).filter(v=>productIds.has(v.productId)&&v.status!=='archived');
  const raw=[];
  for(const p of products)raw.push(...normalizeScalar(p.attributes?.[attr.key]));
  for(const v of variants)raw.push(...normalizeScalar(v.options?.[attr.key]));
  const valueRows=getMarketplaceAttributeValues01058(state,attr.id),byCanonical=new Map(valueRows.map(v=>[str(v.value),v]));
  if(attr.type==='number-unit'||attr.type==='number'||filter?.type==='range'){
    const numbers=raw.map(num).filter(v=>v!==null);
    return {attribute:attr,productsCount:products.length,values:[],min:numbers.length?Math.min(...numbers):null,max:numbers.length?Math.max(...numbers):null,unit:attr.unit||'',kind:'range',occurrences:numbers.length};
  }
  const counts=new Map();raw.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
  const values=[...counts.entries()].map(([value,count])=>{
    const dict=byCanonical.get(value);
    return {value,label:dict?.label||value,color:dict?.color||'',count};
  }).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'uk'));
  return {attribute:attr,productsCount:products.length,values,min:null,max:null,unit:attr.unit||'',kind:filter?.type||'options',occurrences:raw.length};
}

export function getMarketplaceFilterPreview01058(filter,snapshot){
  const d=getMarketplaceFilterDerivedData01058(filter,snapshot);
  if(!d.attribute)return 'Характеристика не знайдена';
  if(d.kind==='range')return d.min===null?'Немає числових значень':`${d.min}${d.unit?' '+d.unit:''} — ${d.max}${d.unit?' '+d.unit:''}`;
  if(!d.values.length)return 'Ще немає значень у товарах/варіаціях';
  return d.values.slice(0,8).map(v=>`${v.label} · ${v.count}`).join('  •  ')+(d.values.length>8?`  +${d.values.length-8}`:'');
}

export function getMarketplaceAttributeFilterType01058(attribute){
  if(!attribute)return 'options';
  if(attribute.type==='number'||attribute.type==='number-unit')return 'range';
  if(attribute.type==='color')return 'swatches';
  if(attribute.type==='boolean')return 'toggle';
  return 'options';
}

export function getMarketplaceFacetBindingData01058(snapshot){
  return arr(snapshot?.filters).filter(f=>f.enabled!==false).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)).map(filter=>({
    ...filter,
    derived:getMarketplaceFilterDerivedData01058(filter,snapshot)
  }));
}

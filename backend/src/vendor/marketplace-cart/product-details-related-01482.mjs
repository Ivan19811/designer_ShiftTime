// 01535 vendored read-only canonical selectors; source: js/design/widgets/shop/product-details-related-01482.js
// 01482 · Product Details accessory/service suggestions.
// Reads the existing canonical 01480 relations. No duplicated product links, writes or prices.
import { resolveMatchedAccessoriesForProduct01480, resolveAccessoryTargets01480, normalizeProductAccessoryLinks01480 } from './marketplace-accessory-matching-01480.mjs';
import { effectiveProductRole01472 } from './marketplace-catalog-role-01472.mjs';
const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const active=v=>str(v?.status)!=='archived'&&str(v?.status)!=='deleted';
const dedupe=values=>[...new Set(values.map(str).filter(Boolean))];

function normValue01482(state,attributeId,raw){
  let value=str(raw).toLowerCase().replace(/,/g,'.').replace(/\s+/g,'');
  const dict=arr(state.attributeValues).filter(v=>str(v.attributeId)===str(attributeId));
  const record=dict.find(v=>[v.id,v.label,v.value,v.slug].some(k=>str(k).toLowerCase()===value));
  if(record)value=str(record.value||record.label).toLowerCase().replace(/,/g,'.').replace(/\s+/g,'');
  const attribute=arr(state.attributes).find(x=>str(x.id)===str(attributeId));
  const unit=str(attribute?.unit).toLowerCase().replace(/\s+/g,'');
  if(unit&&value.endsWith(unit))value=value.slice(0,-unit.length);
  return value;
}
export function resolveProductDetailsOffers01482(state={}, {productId='',sourceProductId='',variantId='',variantOptions=[]}={}) {
  const products=arr(state.products),variants=arr(state.variants),byId=new Map(products.map(p=>[str(p.id),p]));
  const targetId=str(sourceProductId)||str(productId);
  const target=byId.get(targetId);
  if(!target||!active(target))return {accessories:[],services:[]};
  // Linked-group synthetic variants are not actual Marketplace variant IDs.
  const realVariant=variants.find(v=>str(v.id)===str(variantId)&&str(v.productId)===targetId&&active(v));
  const targetVariantId=realVariant?str(realVariant.id):'';
  const direct=resolveMatchedAccessoriesForProduct01480(state,targetId,{targetVariantId});
  const selectedOptions=arr(variantOptions);
  // Synthetic linked-group members are not Marketplace variants. Compare their
  // real selected characteristic value with the rule, never return all diameters.
  const selectedForAttribute=attributeId=>selectedOptions.find(o=>str(o.attributeId)===str(attributeId)||str(o.key)===str(arr(state.attributes).find(a=>str(a.id)===str(attributeId))?.key));
  const hasVariants=variants.some(v=>str(v.productId)===targetId&&active(v));
  if(!targetVariantId&&!selectedOptions.length&&hasVariants)return {accessories:[],services:[]};
  const accessories=[];
  for(const item of direct){
    const p=item.accessory;
    if(!p||!active(p)||effectiveProductRole01472(p,state.categories)!=='accessory')continue;
    const option=selectedForAttribute(item.attributeId);
    if(!targetVariantId&&selectedOptions.length&&!option)continue;
    const selectedValue=option?normValue01482(state,item.attributeId,option.valueId||option.value||option.label):'';
    const compatible=arr(item.pairs).filter(pair=>(!targetVariantId||!str(pair.targetVariantId)||str(pair.targetVariantId)===targetVariantId)&&(!option||normValue01482(state,item.attributeId,pair.value)===selectedValue));
    if(!compatible.length)continue;
    // One choice per linked accessory product; use only exact compatible variant IDs.
    const actual=compatible.map(pair=>variants.find(v=>str(v.id)===str(pair.accessoryVariantId)&&str(v.productId)===str(p.id)&&active(v))).find(Boolean);
    const hasVariants=variants.some(v=>str(v.productId)===str(p.id)&&active(v));
    if(hasVariants&&!actual)continue;
    const match=compatible.find(pair=>!actual||str(pair.accessoryVariantId)===str(actual.id))||compatible[0];
    accessories.push({id:str(p.id),productId:str(p.id),variantId:str(actual?.id),name:str(p.name||p.sku),variantName:str(actual?.displayName01260||actual?.name||Object.values(obj(actual?.options))[0]||match?.label),price:Number(actual?.price??p.price)||0,currency:str(p.currency||state?.settings?.currency||'UAH'),stock:Number(actual?.stock??p.stock)||0,attributeId:str(item.attributeId),value:str(match?.label),source:'matched'});
  }
  // 01487: the SAME stored accessoryTargets01485 ledger contains service owners.
  // No category-rule/runtime matching, and never widen one variant to another.
  const serviceMap=new Map();
  function collectServiceLinks(targetProductId,targetVariantId,accessoryId=''){
    for(const item of resolveMatchedAccessoriesForProduct01480(state,targetProductId,{targetVariantId})){
      const service=item.accessory;
      if(!service||!active(service)||effectiveProductRole01472(service,state.categories)!=='service')continue;
      const variant=arr(item.pairs).map(pair=>variants.find(v=>str(v.id)===str(pair.accessoryVariantId)&&str(v.productId)===str(service.id)&&active(v))).find(Boolean);
      if(variants.some(v=>str(v.productId)===str(service.id)&&active(v))&&!variant)continue;
      const entry=serviceMap.get(str(service.id))||{id:str(service.id),productId:str(service.id),name:str(service.name||service.sku),variantId:str(variant?.id),variantName:str(variant?.displayName01260||variant?.name||Object.values(obj(variant?.options))[0]||''),price:Number(variant?.price??service.price)||0,currency:str(service.currency||state?.settings?.currency||'UAH'),stock:Number(variant?.stock??service.stock)||0,requiresAccessory:true,accessoryIds:[]};
      if(!accessoryId){entry.requiresAccessory=false;entry.variantId=str(variant?.id);}
      else if(!entry.accessoryIds.includes(accessoryId))entry.accessoryIds.push(accessoryId);
      serviceMap.set(str(service.id),entry);
    }
  }
  if(targetVariantId||!hasVariants)collectServiceLinks(targetId,targetVariantId);
  for(const accessory of accessories)collectServiceLinks(accessory.productId,accessory.variantId,accessory.productId);
  const services=[...serviceMap.values()];
  return {accessories,services};
}

export function reconcileProductDetailsRelated01482(offers={}, selected={}){
  const accessories=dedupe(arr(selected.accessories)).filter(id=>arr(offers.accessories).some(x=>x.id===id));
  const services=dedupe(arr(selected.services)).filter(id=>arr(offers.services).some(x=>x.id===id&&( !x.requiresAccessory||x.accessoryIds.some(a=>accessories.includes(a)))));
  return {accessories,services};
}

// 01529 · Read-only bundle-price projection from the same canonical offers
// and selected IDs already used to render accessory/service buttons.
// Each selected accessory/service represents one item; the primary product
// alone is multiplied by the main quantity. Checkout integration is separate.
export function resolveProductDetailsBundleTotal01529({baseTotal=0,quantity=1,offers={},selected={},currency='UAH'}={}){
  const normalized=reconcileProductDetailsRelated01482(offers,selected);
  const selectedAccessories=arr(offers.accessories).filter(x=>normalized.accessories.includes(str(x.id)));
  const selectedServices=arr(offers.services).filter(x=>normalized.services.includes(str(x.id)));
  const extras=[...selectedAccessories,...selectedServices];
  const targetCurrency=str(currency)||'UAH';
  const mixedCurrency=extras.some(row=>str(row.currency||targetCurrency)!==targetCurrency);
  const accessoryTotal=selectedAccessories.reduce((sum,row)=>sum+Math.max(0,Number(row.price)||0),0);
  const serviceTotal=selectedServices.reduce((sum,row)=>sum+Math.max(0,Number(row.price)||0),0);
  const primaryTotal=Math.max(0,Number(baseTotal)||0);
  const finalTotal=mixedCurrency?null:Math.round((primaryTotal+accessoryTotal+serviceTotal)*100)/100;
  return Object.freeze({baseTotal:primaryTotal,quantity:Math.max(1,Number(quantity)||1),accessoryTotal,serviceTotal,finalTotal,
    hasExtras:extras.length>0,mixedCurrency,currency:targetCurrency,
    accessories:Object.freeze(selectedAccessories.slice()),services:Object.freeze(selectedServices.slice())});
}

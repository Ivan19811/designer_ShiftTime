// 01487 · "Додатково" is a reverse price-list view of the SAME stored
// accessoryTargets01485 ledger, owned by a service (catalogRole01472=service).
// No second relationship collection and no matching on the public page.
import {effectiveProductRole01472} from './marketplace-catalog-role-01472.mjs';
import {parseAccessoryProducts01485,resolveAccessoryPriceRefs01485,normalizeAccessoryRefs01485,explicitAccessoryPriceRefs01485,priceAccessoryValue01485} from './marketplace-accessory-price-01485.mjs';
const a=x=>Array.isArray(x)?x:[];
const s=x=>String(x??'').trim();
const o=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
function normalizeName(x){return s(x).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/[«»“”„"'’`]/g,'').replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/g,' ').trim();}
function parts(text){let quote='',depth=0,buf='',result=[];for(const c of s(text)){
  if(quote){buf+=c;if(c===quote||(quote==='«'&&c==='»')||(quote==='“'&&c==='”'))quote='';continue;}
  if('"«“'.includes(c)){quote=c;buf+=c;continue;}
  if(c==='(')depth++;if(c===')')depth=Math.max(0,depth-1);
  if(c==='/'&&!depth){result.push(buf.trim());buf='';}else buf+=c;
}result.push(buf.trim());return result.filter(Boolean);}
function ownerRecord(state,service,variantId){
  if(variantId)return a(state.variants).find(v=>s(v.id)===s(variantId)&&s(v.productId)===s(service.id));
  return service;
}
function ownerRefs(state,service,variantId){const record=ownerRecord(state,service,variantId);return explicitAccessoryPriceRefs01485(service,variantId?record:null)||[];}
function writeOwnerRefs(state,service,variantId,refs){
  const next={mode:'explicit',refs:normalizeAccessoryRefs01485(refs),generatedByRule01486:false,generatedRefs01486:[]};
  if(variantId){const record=ownerRecord(state,service,variantId);if(record)record.accessoryTargets01485=next;}
  else service.configuration={...o(service.configuration),accessoryTargets01485:next};
}
function serviceVariantValue(state,service,variant,target){
  return priceAccessoryValue01485(state,service,variant)||priceAccessoryValue01485(state,target.product,target.variant)||s(target.value);
}
// Reverse projection: show only services whose stored links point to THIS exact target.
export function buildAdditionalServiceIndex01487(state){
  const map=new Map(),variantsByProduct=new Map();
  for(const variant of a(state.variants))if(s(variant.status)!=='archived'){
    const id=s(variant.productId);if(!variantsByProduct.has(id))variantsByProduct.set(id,[]);
    variantsByProduct.get(id).push(variant);
  }
  for(const service of a(state.products)){
    if(effectiveProductRole01472(service,state.categories)!=='service'||s(service.status)==='archived')continue;
    const variants=variantsByProduct.get(s(service.id))||[];
    for(const variant of variants.length?variants:[null])for(const ref of ownerRefs(state,service,variant?.id)){
      const key=s(ref.productId)+':'+s(ref.variantId);
      if(!map.has(key))map.set(key,[]);
      map.get(key).push({service,variant,ref});
    }
  }
  return map;
}
export function additionalServicesForTarget01487(state,productId,variantId='',index){
  const key=s(productId)+':'+s(variantId);
  return (index||buildAdditionalServiceIndex01487(state)).get(key)||[];
}
export function serializeAdditionalServices01487(state,product,variant,{index}={}){
  const rows=additionalServicesForTarget01487(state,product?.id,variant?.id,index);
  const parts=[],seen=new Set();
  for(const item of rows){
    const val=serviceVariantValue(state,item.service,item.variant,{product,variant,value:item.ref.value});
    const key=s(item.service.id)+':'+s(item.variant?.id);if(seen.has(key))continue;seen.add(key);
    const name=s(item.service.name).replace(/"/g,'”');
    parts.push(val?`Товар "${name}" (${val})`:`Товар "${name}"`);
  }
  return parts.join(' / ');
}
function parseAdditional01487(state,text,defaultValue){
  const explicit=[],plain=[],errors=[];
  for(const part of parts(text)){
    if(part.includes('('))explicit.push(part);
    else if(defaultValue)explicit.push(`${part} (${defaultValue})`);
    else plain.push(part.replace(/^товар\s+/iu,'').trim().replace(/^[\"«“]+|[\"»”]+$/g,'').trim());
  }
  const parsed=parseAccessoryProducts01485(explicit.join(' / '));
  for(const name of plain){
    const hits=a(state.products).filter(p=>normalizeName(p.name)===normalizeName(name));
    if(hits.length!==1){errors.push({code:hits.length?'ambiguous-service':'missing-service',name});continue;}
    const service=hits[0],variants=a(state.variants).filter(v=>s(v.productId)===s(service.id)&&s(v.status)!=='archived');
    if(variants.length){errors.push({code:'service-value-required',name});continue;}
    parsed.entries.push({name:s(service.name),value:'',plainService:true});
  }
  return {...parsed,errors:[...parsed.errors,...errors]};
}

// XLSX's "Додатково" column is editable on the target row (product OR accessory).
// Updates write backwards into service owners' existing accessoryTargets01485 refs.
// A non-empty cell is authoritative for this specific target variant; other targets
// and variants are unaffected. Blank cells do not silently erase saved relations.
export function applyAdditionalServiceImports01487(state,pending=[]){
  const changed=[];
  for(const row of pending){
    const product=a(state.products).find(p=>s(p.id)===s(row.productId));
    const variant=row.variantId?a(state.variants).find(v=>s(v.id)===s(row.variantId)&&s(v.productId)===s(row.productId)):null;
    if(!product||(row.variantId&&!variant))throw Object.assign(new Error('MARKETPLACE_ADDITIONAL_TARGET_MISSING_01487'),{code:'MARKETPLACE_ADDITIONAL_TARGET_MISSING_01487',sku:row.sku});
    if(!s(row.text))continue;
    const defaultValue=priceAccessoryValue01485(state,product,variant);
    const parsed=parseAdditional01487(state,row.text,defaultValue);
    const resolved=resolveAccessoryPriceRefs01485(state,{entries:parsed.entries.filter(x=>!x.plainService),errors:parsed.errors});
    for(const entry of parsed.entries.filter(x=>x.plainService)){
      const service=a(state.products).find(p=>normalizeName(p.name)===normalizeName(entry.name));
      if(service)resolved.refs.push({productId:s(service.id),variantId:'',value:''});
    }
    const issues=[...resolved.errors];
    const selected=[];
    for(const ref of resolved.refs){
      const service=a(state.products).find(p=>s(p.id)===s(ref.productId));
      if(!service||effectiveProductRole01472(service,state.categories)!=='service')issues.push({code:'not-a-service',productId:ref.productId});
      else selected.push({service,variantId:ref.variantId});
    }
    if(issues.length){const error=new Error('MARKETPLACE_ADDITIONAL_RESOLUTION_FAILED_01487');error.code='MARKETPLACE_ADDITIONAL_RESOLUTION_FAILED_01487';error.details={sku:row.sku,issues};throw error;}
    const key=s(product.id)+':'+s(variant?.id),wanted=new Set(selected.map(x=>s(x.service.id)+':'+s(x.variantId)));
    const byOwner=new Map();
    for(const service of a(state.products).filter(p=>effectiveProductRole01472(p,state.categories)==='service')){
      const variants=a(state.variants).filter(v=>s(v.productId)===s(service.id)&&s(v.status)!=='archived');
      for(const sv of variants.length?variants:[null]){
        const refs=ownerRefs(state,service,sv?.id);
        const current=refs.some(x=>s(x.productId)+':'+s(x.variantId)===key);
        const choose=wanted.has(s(service.id)+':'+s(sv?.id));
        if(!choose&&!current)continue;
        const newRefs=refs.filter(ref=>s(ref.productId)+':'+s(ref.variantId)!==key);
        if(choose)newRefs.push({productId:s(product.id),variantId:s(variant?.id),value:defaultValue});
        byOwner.set(s(service.id)+':'+s(sv?.id),{service,variantId:sv?.id,refs:newRefs});
      }
    }
    for(const item of byOwner.values()){writeOwnerRefs(state,item.service,item.variantId,item.refs);changed.push(key);}
  }
  return {changed:changed.length};
}

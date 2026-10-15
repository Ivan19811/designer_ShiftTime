// 01480 · Canonical accessory matching. Read-only selectors over MarketplaceStore snapshot.
// Category rules choose product owners + characteristic once; variant compatibility is resolved lazily.
import {effectiveProductRole01472} from './marketplace-catalog-role-01472.mjs';
import {explicitAccessoryPriceRefs01485,normalizeAccessoryRefs01485} from './marketplace-accessory-price-01485.mjs';
const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const uniq=values=>[...new Set(arr(values).map(str).filter(Boolean))];
export function normalizeCategoryAccessoryRule01480(v){const x=obj(v);return {enabled:x.enabled===true,attributeId:str(x.attributeId),targetProductIds:uniq(x.targetProductIds)};}
export function normalizeProductAccessoryLinks01480(v){const x=obj(v);return {additions:uniq(x.additions),exclusions:uniq(x.exclusions),order:uniq(x.order)};}
export function productAccessoryRuleCategories01480(state,product){
  const categories=new Map(arr(state?.categories).map(c=>[str(c.id),c])),found=[],seen=new Set();
  for(const id of arr(product?.categoryIds)){
    let current=categories.get(str(id)),guard=0;
    while(current&&guard++<40&&!seen.has(current.id)){
      seen.add(current.id);
      const serviceRole=effectiveProductRole01472(product,state?.categories)==='service';
      const selectedConfig=serviceRole?(current.serviceMatching01487?.enabled?current.serviceMatching01487:(current.catalogRole01472==='service'&&current.accessoryMatching01480?.enabled?current.accessoryMatching01480:current.serviceMatching01487)):current.accessoryMatching01480;
      const rule=normalizeCategoryAccessoryRule01480(selectedConfig);
      if(rule.enabled&&rule.targetProductIds.length&&rule.attributeId)found.push({category:current,rule});
      current=categories.get(str(current.parentId));
    }
  }
  return found;
}
export function productAccessoryAttributeIds01480(state,product){
  if(!product)return [];
  const attrs=arr(state?.attributes),byKey=new Map(attrs.map(a=>[str(a.key),a]));
  const selected=new Set(),configuration=obj(product.configuration),variantConfig=obj(configuration.variantEngine01260),variantOptions=arr(state?.variants).filter(v=>str(v.productId)===str(product.id));
  for(const key of arr(variantConfig.attributeOrder))if(byKey.has(str(key)))selected.add(byKey.get(str(key)).id);
  for(const [key,value] of Object.entries(obj(product.attributes)))if(byKey.has(str(key))&&value!=null&&value!=='')selected.add(byKey.get(str(key)).id);
  for(const variant of variantOptions)for(const key of Object.keys(obj(variant.options)))if(byKey.has(str(key)))selected.add(byKey.get(str(key)).id);
  const group=obj(configuration.variantGroup01315),ownerAttribute=str(group.linkAttributeId);
  if(ownerAttribute)selected.add(ownerAttribute);
  for(const owner of arr(state?.products)){
    const otherGroup=obj(owner?.configuration?.variantGroup01315);
    if(!otherGroup.linkAttributeId)continue;
    if(arr(otherGroup.members).some(m=>str(m.productId)===str(product.id)))selected.add(str(otherGroup.linkAttributeId));
  }
  return attrs.filter(a=>selected.has(str(a.id))).map(a=>str(a.id));
}
export function targetAccessoryAttributes01480(state,targetProductIds){
  const products=new Map(arr(state?.products).map(p=>[str(p.id),p]));const targets=uniq(targetProductIds).map(id=>products.get(id)).filter(Boolean);
  if(!targets.length)return [];
  const sets=targets.map(p=>new Set(productAccessoryAttributeIds01480(state,p)));
  return arr(state?.attributes).filter(a=>sets.every(s=>s.has(str(a.id))));
}
function normalizeValue01480(state,attributeId,raw){
  let s=str(raw);if(!s)return '';
  const attr=arr(state?.attributes).find(a=>str(a.id)===str(attributeId));
  const values=arr(state?.attributeValues).filter(v=>str(v.attributeId)===str(attributeId));
  const found=values.find(v=>[v.id,v.value,v.label,v.slug].some(t=>str(t).toLocaleLowerCase('uk-UA')===s.toLocaleLowerCase('uk-UA')));
  if(found)s=str(found.value||found.label);
  s=s.toLocaleLowerCase('uk-UA').replace(/,/g,'.').replace(/\s+/g,'').replace(/\u00a0/g,'');
  const unit=str(attr?.unit).toLocaleLowerCase('uk-UA').replace(/\s+/g,'');
  if(unit&&s.endsWith(unit))s=s.slice(0,-unit.length);
  return s;
}
function productOptions01480(state,product,attribute){
  const key=str(attribute?.key);if(!key||!product)return [];
  const variants=arr(state?.variants).filter(v=>str(v.productId)===str(product.id)&&str(v.status)!=='archived');
  const selections=obj(obj(product?.configuration?.variantEngine01260).selections);
  const base=obj(product.attributes)[key];
  const values=[];
  for(const variant of variants){const raw=str(obj(variant.options)[key]);if(raw)values.push({variantId:str(variant.id),raw});}
  if(!values.length){for(const raw of arr(selections[key]))if(str(raw))values.push({variantId:'',raw});}
  if(!values.length){for(const raw of Array.isArray(base)?base:[base])if(str(raw))values.push({variantId:'',raw});}
  // Linked product-group member may be an entire variant on its own.
  if(!values.length){for(const owner of arr(state?.products)){
    const group=obj(owner?.configuration?.variantGroup01315);if(str(group.linkAttributeId)!==str(attribute.id))continue;
    for(const m of arr(group.members))if(str(m.productId)===str(product.id)&&str(m.linkValueId))values.push({variantId:'',raw:str(m.linkValueId)});
  }}
  return values.map(row=>({...row,normalized:normalizeValue01480(state,attribute.id,row.raw)})).filter(row=>row.normalized);
}
export function matchAccessoryVariants01480(state,accessory,target,attributeId,{targetVariantId='',accessoryVariantId=''}={}){
  const attribute=arr(state?.attributes).find(a=>str(a.id)===str(attributeId));
  if(!attribute||!accessory||!target)return {matched:false,pairs:[],values:[],attributeId:str(attributeId)};
  const left=productOptions01480(state,accessory,attribute).filter(o=>!accessoryVariantId||!o.variantId||o.variantId===accessoryVariantId);
  const right=productOptions01480(state,target,attribute).filter(o=>!targetVariantId||!o.variantId||o.variantId===targetVariantId);
  const pairs=[],labels=new Map(arr(state?.attributeValues).filter(v=>str(v.attributeId)===str(attributeId)).map(v=>[normalizeValue01480(state,attributeId,v.value||v.label),str(v.label||v.value)]));
  for(const a of left)for(const p of right)if(a.normalized===p.normalized)pairs.push({accessoryVariantId:a.variantId,targetVariantId:p.variantId,value:a.normalized,label:labels.get(a.normalized)||str(a.raw)});
  return {matched:pairs.length>0,pairs,values:[...new Set(pairs.map(p=>p.label))],attributeId:str(attributeId)};
}
export function calculateAccessorySuggestions01486(state,accessory,{accessoryVariantId=''}={}){
  if(!accessory)return [];
  const hasRule=productAccessoryRuleCategories01480(state,accessory).length>0;
  const hasExplicitLinks=normalizeProductAccessoryLinks01480(obj(accessory.configuration).accessoryLinks01480).additions.length>0;
  if(effectiveProductRole01472(accessory,state?.categories)!=='accessory'&&!hasRule&&!hasExplicitLinks)return [];
  const map=new Map(arr(state?.products).map(p=>[str(p.id),p]));
  const rules=productAccessoryRuleCategories01480(state,accessory),links=normalizeProductAccessoryLinks01480(obj(accessory.configuration).accessoryLinks01480),candidate=new Map();
  for(const {category,rule} of rules)for(const id of rule.targetProductIds)if(!links.exclusions.includes(id)&&str(id)!==str(accessory.id)&&map.has(id)){
    if(!candidate.has(id))candidate.set(id,{product:map.get(id),sources:[],attributeIds:[]});
    const entry=candidate.get(id);entry.sources.push(str(category.id));if(!entry.attributeIds.includes(rule.attributeId))entry.attributeIds.push(rule.attributeId);
  }
  for(const id of links.additions)if(id!==str(accessory.id)&&map.has(id)){
    if(!candidate.has(id))candidate.set(id,{product:map.get(id),sources:[],attributeIds:[]});
    const entry=candidate.get(id);entry.manual=true;
    // Explicit target uses the first mutually available characteristic from category rule, if possible.
    if(!entry.attributeIds.length){const common=targetAccessoryAttributes01480(state,[id]).filter(a=>productAccessoryAttributeIds01480(state,accessory).includes(str(a.id)));entry.attributeIds=common.map(a=>str(a.id));}
  }
  const output=[...candidate.values()].map(entry=>{
    const comparisons=entry.attributeIds.map(id=>matchAccessoryVariants01480(state,accessory,entry.product,id,{accessoryVariantId}));
    const match=comparisons.find(m=>m.matched)||comparisons[0]||{matched:false,pairs:[],values:[],attributeId:''};
    return {productId:str(entry.product.id),product:entry.product,inherited:entry.sources.length>0,manual:!!entry.manual,sourceCategoryIds:entry.sources,attributeId:match.attributeId,matched:match.matched,pairs:match.pairs,values:match.values};
  });
  const order=new Map(links.order.map((id,i)=>[id,i]));
  return output.sort((a,b)=>(order.get(a.productId)??Infinity)-(order.get(b.productId)??Infinity)||0);
}
// 01486: product pages never execute category matching. They read ONLY the stored
// price-list links, materialized at authoring/save/import time.
function storedTargetRows01486(state,accessory,refs,accessoryVariantId=''){
  const productMap=new Map(arr(state?.products).map(p=>[str(p.id),p])),variantMap=new Map(arr(state?.variants).map(v=>[str(v.id),v])),group=new Map();
  for(const ref of normalizeAccessoryRefs01485(refs)){
    const product=productMap.get(ref.productId),variant=ref.variantId?variantMap.get(ref.variantId):null;
    if(!product||product.id===accessory.id||(ref.variantId&&(!variant||str(variant.productId)!==str(product.id)||str(variant.status)==='archived')))continue;
    const item=group.get(ref.productId)||{productId:ref.productId,product,inherited:false,manual:false,sourceCategoryIds:[],attributeId:'',matched:true,pairs:[],values:[]};
    item.pairs.push({accessoryVariantId:str(accessoryVariantId),targetVariantId:str(ref.variantId),value:str(ref.value),label:str(ref.value)});
    if(ref.value&&!item.values.includes(ref.value))item.values.push(ref.value);
    group.set(ref.productId,item);
  }
  return [...group.values()];
}
export function resolveAccessoryTargets01480(state,accessory,{accessoryVariantId=''}={}){
  if(!accessory)return [];
  const variants=arr(state?.variants).filter(v=>str(v.productId)===str(accessory.id)&&str(v.status)!=='archived');
  const aid=str(accessoryVariantId);
  if(aid){
    const variant=variants.find(v=>str(v.id)===aid);
    return variant?storedTargetRows01486(state,accessory,explicitAccessoryPriceRefs01485(accessory,variant)||[],aid):[];
  }
  if(!variants.length)return storedTargetRows01486(state,accessory,explicitAccessoryPriceRefs01485(accessory,null)||[]);
  const merged=new Map();
  for(const variant of variants)for(const item of storedTargetRows01486(state,accessory,explicitAccessoryPriceRefs01485(accessory,variant)||[],variant.id)){
    const entry=merged.get(item.productId)||{...item,pairs:[],values:[],sourceCategoryIds:[]};
    for(const pair of item.pairs)if(!entry.pairs.some(p=>p.accessoryVariantId===pair.accessoryVariantId&&p.targetVariantId===pair.targetVariantId))entry.pairs.push(pair);
    entry.values=[...new Set([...entry.values,...item.values])];entry.matched=entry.pairs.length>0;
    merged.set(item.productId,entry);
  }
  return [...merged.values()];
}
export function resolveMatchedAccessoriesForProduct01480(state,targetProductId,{targetVariantId=''}={}){
  const id=str(targetProductId),tid=str(targetVariantId),out=[];
  for(const accessory of arr(state?.products)){
    const relations=resolveAccessoryTargets01480(state,accessory),target=relations.find(x=>x.productId===id);
    if(!target?.matched)continue;
    const pairs=target.pairs.filter(pair=>!tid||str(pair.targetVariantId)===tid);
    if(pairs.length)out.push({accessory,productId:accessory.id,attributeId:target.attributeId,matched:true,pairs,values:[...new Set(pairs.map(p=>p.label))]});
  }
  return out;
}

// 01481 · Strict, variant-scoped accessory → target projection.
// Never return a different diameter just because it belongs to the same target product.
// This remains a read-only projection of the existing 01480 category/product rules.
export function resolveAccessoryVariantTargets01481(state,accessory,accessoryVariantId){
  const aid=str(accessoryVariantId);
  if(!aid||!accessory)return [];
  const variants=arr(state?.variants);
  const ownerVariant=variants.find(v=>str(v.id)===aid&&str(v.productId)===str(accessory.id)&&str(v.status)!=='archived');
  if(!ownerVariant)return [];
  const byVariant=new Map(variants.map(v=>[str(v.id),v]));
  const results=[];
  for(const relation of resolveAccessoryTargets01480(state,accessory,{accessoryVariantId:aid})){
    if(!relation.matched)continue;
    const hasTargetVariants=variants.some(v=>str(v.productId)===relation.productId);
    const seen=new Set();
    for(const pair of relation.pairs){
      // 01480 also supports non-variant selection fallbacks. A specific opened
      // accessory variant must have an actual value of the matching attribute.
      if(str(pair.accessoryVariantId)!==aid)continue;
      const tid=str(pair.targetVariantId);
      const targetVariant=tid?byVariant.get(tid):null;
      if(hasTargetVariants&&(!targetVariant||str(targetVariant.productId)!==relation.productId||str(targetVariant.status)==='archived'))continue;
      if(!hasTargetVariants&&tid)continue;
      const key=relation.productId+':'+tid;
      if(seen.has(key))continue;seen.add(key);
      results.push({productId:relation.productId,product:relation.product,targetVariantId:tid,
        targetVariant:targetVariant||null,accessoryVariantId:aid,
        attributeId:relation.attributeId,value:pair.value,label:pair.label,
        inherited:relation.inherited,manual:relation.manual});
    }
  }
  return results;
}

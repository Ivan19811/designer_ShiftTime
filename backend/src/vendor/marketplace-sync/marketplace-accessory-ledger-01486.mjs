// 01486 · Materialize category/inspector matching into the ONE stored price-list relationship ledger.
// The product page and export must read accessoryTargets01485.refs only.
import {effectiveProductRole01472} from './marketplace-catalog-role-01472.mjs';
import {normalizeAccessoryRefs01485} from './marketplace-accessory-price-01485.mjs';
import {calculateAccessorySuggestions01486,productAccessoryRuleCategories01480} from './marketplace-accessory-matching-01480.mjs';
const arr=x=>Array.isArray(x)?x:[];
const str=x=>String(x??'').trim();
const key=x=>str(x.productId)+':'+str(x.variantId);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
function compatibleAutoRefs(state,product,variant){
  const rows=calculateAccessorySuggestions01486(state,product,{accessoryVariantId:str(variant?.id)});
  const refs=[];
  for(const row of rows)for(const pair of arr(row.pairs)){
    if(variant&&str(pair.accessoryVariantId)&&str(pair.accessoryVariantId)!==str(variant.id))continue;
    refs.push({productId:str(row.productId),variantId:str(pair.targetVariantId),value:str(pair.value||pair.label)});
  }
  return normalizeAccessoryRefs01485(refs);
}
function syncOne(state,product,entity,{force=false}={}){
  const config=obj(entity?.accessoryTargets01485);
  const explicit=config.mode==='explicit';
  const managed=config.generatedByRule01486===true;
  // Imported Excel values are already authoritative: never recompute them in the background.
  if(explicit&&!managed&&!force)return false;
  const shouldGenerate=force||managed||!explicit;
  if(!shouldGenerate)return false;
  const existing=normalizeAccessoryRefs01485(config.refs),previousAuto=new Set(arr(config.generatedRefs01486).map(key));
  const manual=existing.filter(ref=>!previousAuto.has(key(ref)));
  const generated=compatibleAutoRefs(state,product,entity?.options?entity:null);
  const exclusionProducts=new Set(arr(product?.configuration?.accessoryLinks01480?.exclusions).map(str));
  const effective=normalizeAccessoryRefs01485([...manual,...generated.filter(ref=>!exclusionProducts.has(ref.productId))]);
  const next={mode:'explicit',refs:effective,generatedByRule01486:true,generatedRefs01486:generated.filter(ref=>!exclusionProducts.has(ref.productId))};
  if(same(config,next))return false;
  entity.accessoryTargets01485=next;
  return true;
}
function categoryContains01486(state,product,categoryId){
  const byId=new Map(arr(state.categories).map(c=>[str(c.id),c]));
  for(const id of arr(product.categoryIds)){
    let cursor=byId.get(str(id)),limit=0;
    while(cursor&&limit++<40){if(str(cursor.id)===categoryId)return true;cursor=byId.get(str(cursor.parentId));}
  }
  return false;
}
export function materializeAccessoryLedger01486(snapshot,{force=false,forceCategoryId='',forceProductId=''}={}){
  const state=snapshot;let count=0;
  const variantsByProduct=new Map();
  for(const variant of arr(state.variants)){
    if(str(variant.status)==='archived')continue;
    const pid=str(variant.productId);
    if(!variantsByProduct.has(pid))variantsByProduct.set(pid,[]);
    variantsByProduct.get(pid).push(variant);
  }
  for(const product of arr(state.products)){
    const hasRule=productAccessoryRuleCategories01480(state,product).length>0;
    const hasManual=arr(product?.configuration?.accessoryLinks01480?.additions).length>0;
    const hadManaged=arr(variantsByProduct.get(str(product.id))).some(v=>v.accessoryTargets01485?.generatedByRule01486)||product.configuration?.accessoryTargets01485?.generatedByRule01486;
    if(!hasRule&&!hasManual&&!hadManaged)continue;
    if(effectiveProductRole01472(product,state.categories)!=='accessory'&&!hasRule&&!hasManual&&!hadManaged)continue;
    const mustForce=force||(str(forceProductId)&&str(product.id)===str(forceProductId))||(str(forceCategoryId)&&categoryContains01486(state,product,str(forceCategoryId)));
    const variants=arr(variantsByProduct.get(str(product.id)));
    if(variants.length){for(const variant of variants)if(syncOne(state,product,variant,{force:!!mustForce}))count++;}
    else{
      const config=obj(product.configuration);
      const proxy={accessoryTargets01485:config.accessoryTargets01485};
      if(syncOne(state,product,proxy,{force:!!mustForce})){
        product.configuration={...config,accessoryTargets01485:proxy.accessoryTargets01485};count++;
      }
    }
  }
  return {changed:count>0,count,snapshot:state};
}

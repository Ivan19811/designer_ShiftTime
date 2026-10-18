// 01528 · Canonical, pure replacement plan. DB and HTTP use this one planner.
// No price, SKU, stock, category or imported accessory/service binding is overwritten.
import crypto from 'node:crypto';
const val=x=>String(x??'').trim();
const list=x=>Array.isArray(x)?x:[];
const deep=x=>JSON.parse(JSON.stringify(x));
const fail=(code,statusCode=400)=>{const e=new Error(code);e.code=code;e.statusCode=statusCode;throw e;};
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sig=o=>JSON.stringify(Object.entries(o||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k, val(v).toLowerCase()]));
const refKey=k=>/^(productId|sourceProductId|targetProductId|linkedProductId|ownerProductId|variantId|sourceVariantId|targetVariantId|productIds|variantIds|sourceProductIds|targetProductIds)$/.test(k);
function remapRefs(root,sourceId,targetId,variantMap){
  let changed=0;
  const walk=(obj,key='')=>{
    if(Array.isArray(obj))return obj.map(v=>walk(v,key));
    if(obj&&typeof obj==='object')return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,walk(v,k)]));
    if(typeof obj==='string'&&refKey(key)){
      if(obj===sourceId){changed++;return targetId;}
      if(variantMap.has(obj)){changed++;return variantMap.get(obj);}
    }
    return obj;
  };
  return {value:walk(root),changed};
}
export function planProductReplacement01528(snapshot,input={}){
  const sourceId=val(input.sourceProductId),targetId=val(input.targetProductId);
  if(!sourceId||!targetId||sourceId===targetId)fail('MARKETPLACE_REPLACEMENT_DISTINCT_IDS_REQUIRED_01528');
  const products=list(snapshot.products),variants=list(snapshot.variants),source=products.find(p=>val(p.id)===sourceId),target=products.find(p=>val(p.id)===targetId);
  if(!source||!target)fail('MARKETPLACE_REPLACEMENT_PRODUCT_MISSING_01528',404);
  if(source.status==='archived'||target.status==='archived')fail('MARKETPLACE_REPLACEMENT_ARCHIVED_PRODUCT_01528');
  const oldVars=variants.filter(v=>val(v.productId)===sourceId),newVars=variants.filter(v=>val(v.productId)===targetId);
  const bySignature=new Map();
  for(const v of newVars){const key=sig(v.options);bySignature.set(key,[...(bySignature.get(key)||[]),v]);}
  const pairs=[],unmatched=[],ambiguous=[];
  for(const v of oldVars){const matches=bySignature.get(sig(v.options))||[];
    if(matches.length===1)pairs.push({sourceVariantId:v.id,targetVariantId:matches[0].id,sourceSku:v.sku||'',targetSku:matches[0].sku||'',options:v.options||{},sourceHasMedia:!!(val(v.primaryMediaId)||list(v.mediaIds).length),targetHasMedia:!!(val(matches[0].primaryMediaId)||list(matches[0].mediaIds).length)});
    else if(matches.length===0)unmatched.push({sourceVariantId:v.id,sku:v.sku||'',options:v.options||{}});
    else ambiguous.push({sourceVariantId:v.id,sku:v.sku||'',options:v.options||{},count:matches.length});
  }
  const variantMap=new Map(pairs.map(p=>[val(p.sourceVariantId),val(p.targetVariantId)]));
  // All detached refs require manual decision; never silently repoint unmatched variants.
  const refPathMissing=[];
  function scan(node,path='',parentKey=''){
    if(Array.isArray(node)){node.forEach((v,i)=>scan(v,`${path}[${i}]`,parentKey));return;}
    if(node&&typeof node==='object'){for(const [k,v] of Object.entries(node))scan(v,`${path}.${k}`,k);return;}
    if(typeof node==='string'&&refKey(parentKey)&&oldVars.some(v=>val(v.id)===node)&&!variantMap.has(node))refPathMissing.push(path);
  }
  for(const [i,p] of products.entries())if(val(p.id)!==sourceId)scan(p,`products[${i}]`);
  for(const [i,v] of variants.entries())if(val(v.productId)!==sourceId)scan(v,`variants[${i}]`);
  for(const name of ['categories','collections','recommendations'])for(const [i,c] of list(snapshot[name]).entries())scan(c,`${name}[${i}]`);
  const mediaIds=new Set(list(snapshot.media).map(m=>val(m.id)));
  const sourceProductMedia=[...new Set([...list(source.mediaIds),source.primaryMediaId].map(val).filter(Boolean))];
  const absentMedia=sourceProductMedia.filter(id=>!mediaIds.has(id));
  const additionalCategories=list(source.categoryIds).filter(id=>!list(target.categoryIds).includes(id));
  const additionalCollections=list(source.collectionIds).filter(id=>!list(target.collectionIds).includes(id));
  const canCopyProductMedia=!!(sourceProductMedia.length&&!val(target.primaryMediaId)&&!list(target.mediaIds).length);
  const variantMediaCopies=pairs.filter(p=>p.sourceHasMedia&&!p.targetHasMedia).length;
  const warnings=[];
  if(additionalCategories.length)warnings.push('source_categories_added');
  if(unmatched.length)warnings.push('unmatched_variants');
  if(refPathMissing.length)warnings.push('unmatched_variant_references');
  if(absentMedia.length)warnings.push('missing_media_records');
  if(target.primaryMediaId||list(target.mediaIds).length)warnings.push('target_media_preserved');
  warnings.push('site_page_bindings_not_automatically_modified');
  if(target.status==='draft')warnings.push('target_will_be_activated');
  if(source.configuration?.variantGroup01315&&target.configuration?.variantGroup01315&&source.configuration.variantGroup01315.groupId!==target.configuration.variantGroup01315.groupId)warnings.push('different_variant_groups_preserved');
  const blocked=ambiguous.length>0||refPathMissing.length>0||absentMedia.length>0;
  const plan={stage:'01528',source:{id:source.id,name:source.name,sku:source.sku,status:source.status},target:{id:target.id,name:target.name,sku:target.sku,status:target.status},revision:Number(snapshot.revision)||0,pairs,unmatched,ambiguous,refPathMissing,absentMedia,additionalCategories,additionalCollections,canCopyProductMedia,variantMediaCopies,warnings,blocked,sitePageBindingsRequireReview:true};
  plan.planHash=digest({revision:plan.revision,sourceId,targetId,pairs,unmatched,ambiguous,refPathMissing,absentMedia,additionalCategories,additionalCollections,copyProduct:canCopyProductMedia,variantMediaCopies});
  return plan;
}
export function applyProductReplacement01528(snapshot,input={}){
  const plan=planProductReplacement01528(snapshot,input);
  if(Number(input.expectedRevision)!==plan.revision||val(input.planHash)!==plan.planHash)fail('MARKETPLACE_REPLACEMENT_PREVIEW_STALE_01528',409);
  if(input.mode==='media-only'){
    if(input.confirmMediaOnly!==true)fail('MARKETPLACE_REPLACEMENT_MEDIA_CONFIRM_REQUIRED_01528');
    if(plan.absentMedia.length)fail('MARKETPLACE_REPLACEMENT_MEDIA_NOT_FOUND_01528',409);
    if(!plan.canCopyProductMedia&&!plan.variantMediaCopies)fail('MARKETPLACE_REPLACEMENT_NO_MEDIA_TO_COPY_01528');
    const candidate=deep(snapshot),source=candidate.products.find(p=>val(p.id)===plan.source.id),target=candidate.products.find(p=>val(p.id)===plan.target.id);
    if(plan.canCopyProductMedia){target.mediaIds=deep(source.mediaIds||[]);target.primaryMediaId=source.primaryMediaId||'';}
    let copiedVariantMedia=0;
    for(const pair of plan.pairs){const old=candidate.variants.find(v=>v.id===pair.sourceVariantId),next=candidate.variants.find(v=>v.id===pair.targetVariantId);
      if(!old||!next||val(next.primaryMediaId)||list(next.mediaIds).length||(!val(old.primaryMediaId)&&!list(old.mediaIds).length))continue;
      next.mediaIds=deep(old.mediaIds||[]);next.primaryMediaId=old.primaryMediaId||'';copiedVariantMedia++;
    }
    return {snapshot:candidate,report:{stage:'01528',sourceId:source.id,targetId:target.id,matchedVariants:plan.pairs.length,unmatchedVariants:plan.unmatched.length,copiedProductMedia:plan.canCopyProductMedia,copiedVariantMedia,referenceRewrites:0,archivedSource:false,activatedTarget:false,sitePageBindingsRequireReview:true,mode:'media-only'}};
  }
  if(plan.blocked)fail('MARKETPLACE_REPLACEMENT_PREFLIGHT_BLOCKED_01528',409);
  if(input.confirmArchive!==true)fail('MARKETPLACE_REPLACEMENT_ARCHIVE_CONFIRM_REQUIRED_01528');
  const result=deep(snapshot),source=result.products.find(p=>val(p.id)===plan.source.id),target=result.products.find(p=>val(p.id)===plan.target.id);
  const variantMap=new Map(plan.pairs.map(p=>[val(p.sourceVariantId),val(p.targetVariantId)]));
  target.categoryIds=[...new Set([...list(target.categoryIds),...plan.additionalCategories])];
  target.collectionIds=[...new Set([...list(target.collectionIds),...plan.additionalCollections])];
  if(plan.canCopyProductMedia){target.mediaIds=deep(source.mediaIds||[]);target.primaryMediaId=source.primaryMediaId||'';}
  let variantMediaTransferred=0;
  for(const pair of plan.pairs){const old=result.variants.find(v=>v.id===pair.sourceVariantId),next=result.variants.find(v=>v.id===pair.targetVariantId);
    if(!old||!next)fail('MARKETPLACE_REPLACEMENT_VARIANT_MISSING_01528',409);
    if(!val(next.primaryMediaId)&&!list(next.mediaIds).length&&(val(old.primaryMediaId)||list(old.mediaIds).length)){
      next.mediaIds=deep(old.mediaIds||[]);next.primaryMediaId=old.primaryMediaId||'';next.inheritProductMedia01260=old.inheritProductMedia01260??next.inheritProductMedia01260;next.mediaSourceMode01285=old.mediaSourceMode01285||next.mediaSourceMode01285;variantMediaTransferred++;
    }
  }
  // Preserve target price/SKU/options/categoryIds/productGroup and all imported accessory/service refs.
  // Safely transfer cross-product group structure when no group already exists on the target.
  const sourceGroup=source.configuration?.variantGroup01315;
  if(sourceGroup&&!target.configuration?.variantGroup01315){target.configuration={...(target.configuration||{}),variantGroup01315:deep(sourceGroup)};}
  const sourceTemplate=source.productDetailsTemplateId;
  if(sourceTemplate&&!target.productDetailsTemplateId)target.productDetailsTemplateId=sourceTemplate;
  if(!target.dynamicMedia&&source.dynamicMedia)target.dynamicMedia=deep(source.dynamicMedia);
  if(target.status==='draft')target.status='active';
  let referenceRewrites=0;
  // Never alter the preserved source record's IDs or historical configuration.
  for(const key of ['products','variants','categories','collections','recommendations'])for(let i=0;i<list(result[key]).length;i++){
    const row=result[key][i];if(key==='products'&&row.id===source.id)continue;
    if(key==='variants'&&row.productId===source.id)continue;
    const mapped=remapRefs(row,source.id,target.id,variantMap);
    result[key][i]=mapped.value;referenceRewrites+=mapped.changed;
  }
  source.status='archived';source.configuration={...(source.configuration||{}),replacementArchive01528:{stage:'01528',targetProductId:target.id,variantIds:plan.pairs.map(p=>p.sourceVariantId)}};
  return {snapshot:result,report:{stage:'01528',sourceId:source.id,targetId:target.id,matchedVariants:plan.pairs.length,unmatchedVariants:plan.unmatched.length,copiedProductMedia:plan.canCopyProductMedia,copiedVariantMedia:variantMediaTransferred,addedCategories:plan.additionalCategories.length,referenceRewrites,archivedSource:true,activatedTarget:target.status==='active',sitePageBindingsRequireReview:true}};
}

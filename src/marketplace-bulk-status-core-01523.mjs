// 01523 · One canonical bulk status plan. No implicit insert/delete, no category changes.
export function planBulkProductStatus01523(snapshot,{ids,status}={}){
  if(!['active','draft'].includes(status))throw Object.assign(new Error('MARKETPLACE_BULK_STATUS_INVALID_01523'),{statusCode:400});
  if(!Array.isArray(ids)||!ids.length||ids.length>5000)throw Object.assign(new Error('MARKETPLACE_BULK_IDS_LIMIT_01523'),{statusCode:400});
  const normalized=ids.map(x=>String(x||'').trim());
  if(normalized.some(x=>!x)||new Set(normalized).size!==normalized.length)throw Object.assign(new Error('MARKETPLACE_BULK_DUPLICATE_OR_EMPTY_ID_01523'),{statusCode:400});
  const byId=new Map((snapshot?.products||[]).map(p=>[String(p.id),p]));
  const targets=new Set(normalized),changedIds=[],missing=[],archived=[],unchanged=[];
  for(const id of normalized){const product=byId.get(id);if(!product){missing.push(id);continue;}
    if(product.status==='archived'){archived.push(id);continue;}
    if(String(product.status||'draft')===status){unchanged.push(id);continue;}
    changedIds.push(id);
  }
  const changedSet=new Set(changedIds),now=new Date().toISOString();
  const products=(snapshot?.products||[]).map(p=>changedSet.has(String(p.id))?{...p,status,updatedAt:now}:p);
  return {products,changedIds,missing,archived,unchanged,requested:normalized.length,status};
}

// 01521 · Canonical category policy shared by import transaction and preflight.
// Existing products keep specific categories when a supplier names only an ancestor.
// Every other category move requires a reviewed, state-bound one-product approval.
const arr=v=>Array.isArray(v)?v:[];
const str=v=>String(v??'').trim();
const sorted=v=>[...new Set(arr(v).map(str).filter(Boolean))].sort();
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function categoryPath01521(categories,id){
  const byId=new Map(arr(categories).map(c=>[str(c.id),c]));
  const names=[],seen=new Set();let current=byId.get(str(id));
  while(current&&!seen.has(str(current.id))){seen.add(str(current.id));names.unshift(str(current.name||current.slug||current.id));current=byId.get(str(current.parentId));}
  return names.join(' > ')||str(id);
}
function ancestor01521(categories,ancestorId,leafId){
  const byId=new Map(arr(categories).map(c=>[str(c.id),c]));
  let current=byId.get(str(leafId));const seen=new Set();
  while(current&&!seen.has(str(current.id))){if(str(current.id)===str(ancestorId))return true;seen.add(str(current.id));current=byId.get(str(current.parentId));}
  return false;
}
export function categoryMoveToken01521(productId,before,after){
  return JSON.stringify([str(productId),sorted(before),sorted(after)]);
}
export function decideImportCategories01521(existing,requested,categories,approvals={}){
  const before=sorted(existing?.categoryIds),after=sorted(requested),id=str(existing?.id);
  if(!existing)return {kind:'new',before,requested:after,effectiveIds:after,needsApproval:false};
  if(same(before,after))return {kind:'same',before,requested:after,effectiveIds:before,needsApproval:false};
  // An ancestor in a coarse supplier price is not an instruction to move a
  // nested product (e.g. Сковорідки > ... > Кришки) to its parent.
  if(after.length&&before.length&&after.every(target=>before.some(leaf=>ancestor01521(categories,target,leaf))))
    return {kind:'preservedAncestor',before,requested:after,effectiveIds:before,needsApproval:false};
  const token=categoryMoveToken01521(id,before,after);
  const approved=str(approvals?.[id])===token;
  return {kind:approved?'approvedMove':'pendingMove',before,requested:after,effectiveIds:approved?after:before,needsApproval:!approved,token};
}

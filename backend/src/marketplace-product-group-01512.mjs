// 01512 · Canonical per-product group code, independent from the product/variant SKUs.
// Do not infer shared groups for distinct products from category or accessory links.
const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
function prefix01512(product,categories=[]){
  const role=str(product?.catalogRole01472).toLowerCase();
  if(role==='accessory')return 'ACC';
  if(role==='service')return 'SRV';
  const byId=new Map(arr(categories).map(c=>[str(c?.id),c]));
  const names=[str(product?.name),...arr(product?.categoryIds).map(id=>str(byId.get(str(id))?.name))].join(' ').toLowerCase();
  if(/кришк|чохол|аксесуар|lid|cover|accessor/i.test(str(product?.name).toLowerCase()))return 'ACC';
  if(/сковор|skovor|\bpan\b/i.test(names))return 'PAN';
  if(/казан|kazan|cauldron/i.test(names))return 'KAZ';
  if(/мангал|mangal|brazier/i.test(names))return 'MNG';
  if(/шампур|shampur|skewer/i.test(names))return 'SHM';
  if(/наливатор|nalyvator|dispenser/i.test(names))return 'NAL';
  if(/кришк|чохол|аксесуар|lid|cover|accessor/i.test(names))return 'ACC';
  return 'PRD';
}
export function assignProductGroup01512(product,products=[],categories=[]){
  const current=str(product?.productGroup01512)||str(product?.configuration?.import01387?.externalGroupKey);
  const used=new Set(arr(products).filter(p=>!str(product?.id)||str(p?.id)!==str(product?.id)).map(p=>str(p?.productGroup01512)||str(p?.configuration?.import01387?.externalGroupKey)).filter(Boolean).map(x=>x.toUpperCase()));
  if(current){
    if(used.has(current.toUpperCase())){const error=new Error('MARKETPLACE_PRODUCT_GROUP_DUPLICATE_01512');error.code='MARKETPLACE_PRODUCT_GROUP_DUPLICATE_01512';throw error;}
    return {...product,productGroup01512:current};
  }
  const prefix=prefix01512(product,categories);
  let n=1,code='';do{code=`${prefix}-${String(n++).padStart(4,'0')}`;}while(used.has(code.toUpperCase()));
  return {...product,productGroup01512:code};
}
export function assignSnapshotProductGroups01512(snapshot){
  const seen=[];
  const products=arr(snapshot?.products).map(product=>{
    const updated=assignProductGroup01512(product,seen,arr(snapshot?.categories));
    seen.push(updated);return updated;
  });
  return {...snapshot,products};
}

// 01535 · Pure server projection of authored cart lines. Currency, price and availability are read from the canonical snapshot.
import {resolveAuthoredItem01534} from './vendor/marketplace-cart/marketplace-product-bundle-01534.mjs';
const arr=v=>Array.isArray(v)?v:[];
const money=v=>Number.isFinite(Number(v))?Number(v):0;
export function authoredView01535(state,rows,storeId,siteId){const resolved=arr(rows).map(row=>{
  const live=resolveAuthoredItem01534(state,row),quantity=Math.max(1,Math.floor(money(row.quantity)||1));
  const status=live?.status==='active'&&live.stock>=quantity?'active':'unavailable';
  return {...row,id:row.id,storeId,siteId,sellerOfferId:'',sellerProfileId:'',sellerName:'',
    sourceKind:'store-product-01534',componentKind:row.componentKind||'main',
    title:live?.title||'',sku:live?.sku||row.variantSku||'',media:live?.media||[],
    quantity,status,unitPrice:live?.price||0,lineTotal:(live?.price||0)*quantity,
    currency:live?.currency||'UAH',stock:live?.stock||0,availability:live?.availability||'out-of-stock',
    variantName:live?.variant?.displayName01260||live?.variant?.name||''};
});
  return {items:resolved,subtotal:resolved.reduce((s,x)=>s+x.lineTotal,0),issues:resolved.filter(x=>x.status!=='active').map(x=>({itemId:x.id,status:x.status}))};
}

// 01535 vendored read-only canonical selectors; source: js/marketplace/data/marketplace-product-bundle-01534.js
// 01534 · Cart source references for authored Marketplace Store products.
// Prices are NEVER read from the button, DOM, or cart identity; always resolve
// from the active canonical Marketplace snapshot at add and hydrate time.
import {resolveProductDetailsOffers01482,reconcileProductDetailsRelated01482} from './product-details-related-01482.mjs';
const arr=x=>Array.isArray(x)?x:[];
const str=x=>String(x??'').trim();
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const fail=code=>{const e=new Error('SHOP_CART_'+code+'_01534');e.code='SHOP_CART_'+code+'_01534';throw e;};
const valid=x=>x && !['archived','deleted','draft'].includes(str(x.status));
const normalizeOptions=(state,variant)=>Object.entries(variant?.options||{}).map(([key,value])=>{
  const a=arr(state.attributes).find(x=>str(x.key)===key||str(x.id)===key);
  return {key,attributeId:str(a?.id||key),value:str(value),label:str(value)};
});
export function resolveAuthoredItem01534(state={},ref={}){
  const product=arr(state.products).find(p=>str(p.id)===str(ref.productId));
  if(!product||!valid(product))return null;
  const candidates=arr(state.variants).filter(v=>str(v.productId)===str(product.id)&&valid(v));
  let variant=null;
  if(candidates.length){
    variant=candidates.find(v=>str(v.id)===str(ref.variantId));
    if(!variant&&str(ref.variantSku)){
      const bySku=candidates.filter(v=>str(v.sku)===str(ref.variantSku));
      if(bySku.length===1)variant=bySku[0];
    }
    if(!variant)return null; // Do not replace an unavailable size with the cheapest/default one.
  }else if(str(ref.variantId)||str(ref.variantSku))return null;
  const price=variant?num(variant.price):num(product.price);
  const stock=variant?num(variant.stock):num(product.stock);
  const currency=str(product.currency||state?.settings?.currency||'UAH');
  const sku=str(variant?.sku||product.sku);
  const imageIds=[str(variant?.primaryMediaId),...arr(variant?.mediaIds).map(str),str(product.primaryMediaId),...arr(product.mediaIds).map(str)].filter(Boolean);
  const mediaById=new Map(arr(state.media).map(m=>[str(m.id),m]));
  const media=imageIds.map(id=>mediaById.get(id)).filter(Boolean).slice(0,3).map(m=>({url:str(m.url||m.src),alt:str(m.alt||product.name)})).filter(x=>x.url);
  const availability=str(variant?.availability||product.availability);
  return {product,variant,price,currency,stock,sku,media,title:str(product.name),availability,
    status:stock>0&&availability!=='out-of-stock'?'active':'unavailable'};
}
export function resolveAuthoredBundle01534(state={},request={}){
  const productId=str(request.productId),main=resolveAuthoredItem01534(state,{productId,variantId:request.variantId,variantSku:request.variantSku});
  if(!main)fail('PRODUCT_OR_VARIANT_MISSING');
  const quantity=Math.floor(num(request.quantity));
  if(quantity<1||quantity>999)fail('QUANTITY');
  if(main.status!=='active'||main.stock<quantity)fail('OUT_OF_STOCK');
  const opts=main.variant?normalizeOptions(state,main.variant):[];
  const offers=resolveProductDetailsOffers01482(state,{productId,sourceProductId:productId,variantId:str(main.variant?.id),variantOptions:opts});
  const requested={accessories:[...new Set(arr(request.accessories).map(str).filter(Boolean))],services:[...new Set(arr(request.services).map(str).filter(Boolean))]};
  const selected=reconcileProductDetailsRelated01482(offers,requested);
  if(selected.accessories.length!==requested.accessories.length||selected.services.length!==requested.services.length)fail('SELECTION_CHANGED');
  const accessoryOffers=arr(offers.accessories).filter(row=>selected.accessories.includes(str(row.id)));
  const serviceOffers=arr(offers.services).filter(row=>selected.services.includes(str(row.id)));
  const accessoryLines=accessoryOffers.map(row=>{
    const item=resolveAuthoredItem01534(state,{productId:row.productId,variantId:row.variantId});
    if(!item||item.status!=='active'||item.stock<1)fail('ACCESSORY_UNAVAILABLE');
    return {...item,productId:str(row.productId),variantId:str(item.variant?.id),kind:'accessory',quantity:1,dependsOnProductId:productId};
  });
  const serviceLines=serviceOffers.map(row=>{
    const item=resolveAuthoredItem01534(state,{productId:row.productId,variantId:row.variantId});
    if(!item||item.status!=='active'||item.stock<1)fail('SERVICE_UNAVAILABLE');
    const accessoryId=row.requiresAccessory?selected.accessories.find(id=>arr(row.accessoryIds).includes(id)):'';
    if(row.requiresAccessory&&!accessoryId)fail('SELECTION_CHANGED');
    return {...item,productId:str(row.productId),variantId:str(item.variant?.id),kind:'service',quantity:1,dependsOnProductId:str(accessoryId||productId)};
  });
  const lines=[{...main,productId,variantId:str(main.variant?.id),kind:'main',quantity},...accessoryLines,...serviceLines];
  if(lines.some(x=>x.currency!==main.currency))fail('MIXED_CURRENCY');
  const total=lines.reduce((acc,x)=>acc+x.price*x.quantity,0);
  return {lines,currency:main.currency,quantity,subtotal:Math.round(total*100)/100};
}

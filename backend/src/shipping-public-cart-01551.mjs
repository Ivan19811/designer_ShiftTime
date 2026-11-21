// 01551 · Published site token establishes Store/site; unguessable cart ID is
// a separate buyer bearer capability. Public routes MUST prove both in DB.
const str=v=>String(v??'').trim();
const fail=(code,statusCode=401)=>Object.assign(new Error(code),{code,statusCode});
const limiter=new Map();
export function assertPublishedShippingRate01551(siteId,clientId,now=Date.now()){
  const bucket=Math.floor(now/60000),key=str(siteId)+':'+str(clientId).slice(0,120)+':'+bucket;
  for(const old of limiter.keys())if(!old.endsWith(':'+bucket))limiter.delete(old);
  const hits=(limiter.get(key)||0)+1;limiter.set(key,hits);
  if(hits>30)throw fail('NP_PUBLIC_PACKING_RATE_LIMIT_01551',429);
}
export async function provePublishedCart01551(identity,cartId,{client=null}={}){
  const id=str(cartId),siteId=str(identity?.siteId),storeId=str(identity?.storeId);
  if(!siteId||!storeId)throw fail('NP_PUBLIC_SITE_REQUIRED_01551');
  if(!/^cart_[a-z0-9]{24,48}$/i.test(id))throw fail('NP_PUBLIC_CART_REQUIRED_01551');
  const work=async db=>db.query(`SELECT 1 FROM marketplace_carts c JOIN marketplace_cart_items ci ON ci.cart_id=c.id
    WHERE c.id=$1 AND c.status='active' AND ci.store_id=$2 AND ci.site_id=$3 AND ci.source_kind='store-product-01534' LIMIT 1`,[id,storeId,siteId]);
  const found=client?await work(client):await (await import('./db.mjs')).withClient(work);
  if(!found.rowCount&&!found.rows?.length)throw fail('NP_PUBLIC_CART_NOT_FOUND_01551');
  return Object.freeze({storeId,siteId,cartId:id,userId:null});
}
export async function publicPackingLayout01551(identity,cartId,input,{proof=provePublishedCart01551,layout}={}){
  const scope=await proof(identity,cartId);
  if(input?.siteId!==undefined&&str(input.siteId)!==scope.siteId||input?.cartId!==undefined&&str(input.cartId)!==scope.cartId)throw fail('NP_PUBLIC_CART_SCOPE_MISMATCH_01551',403);
  const run=layout||((await import('./shipping-packing-layout-01549.mjs')).cartPackingLayout01549);
  const out=await run(scope,{action:input?.action||'load',moves:input?.moves,expectedRevision:input?.expectedRevision,siteId:scope.siteId,cartId:scope.cartId});
  return {...out,publicCart:true,orderReady:false,waybillCreated:false};
}
export async function publicMultiPlaceQuote01551(identity,cartId,input,{proof=provePublishedCart01551,quote,clientId=''}={}){
  const scope=await proof(identity,cartId);
  const run=quote||((await import('./shipping-multiplace-quote-01551.mjs')).previewCartMultiPlaceQuote01551);
  return run(scope,{cityRecipient:input?.cityRecipient,warehouseRef:input?.warehouseRef,siteId:scope.siteId,cartId:scope.cartId},{clientId});
}

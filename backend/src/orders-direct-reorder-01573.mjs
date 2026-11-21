// 01573 · Preserve an already placed order and start a new cart with the same Store-catalog items.
// Never mutate the original cart or its production order. Fresh prices, packing and shipping are checked at the next checkout.
import {randomUUID} from 'node:crypto';
import {withTransaction} from './db.mjs';
import {shopCartView01535} from './marketplace-shop-cart-service-01535.mjs';
const bad=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const token=/^cart_[a-z0-9]{24,48}$/i;
const site=/^[-\w:]{1,160}$/;
const id=prefix=>prefix+'_'+randomUUID().replaceAll('-','');
export async function renewOrderedShopCart01573(scope,cartId,{transaction=withTransaction,newId=id,view=shopCartView01535}={}){
 if(!scope?.storeId||!scope?.siteId||!site.test(String(scope.siteId))||!token.test(String(cartId)))throw bad('DIRECT_CHECKOUT_RENEW_SCOPE_INVALID_01573',403);
 const result=await transaction(async db=>{
  const old=await db.query("SELECT id,status,currency FROM marketplace_carts WHERE id=$1 AND marketplace_id='marketplace_shifttime' FOR UPDATE",[cartId]);
  if(!old.rowCount||old.rows[0].status!=='active'||old.rows[0].currency!=='UAH')throw bad('DIRECT_CHECKOUT_RENEW_CART_INVALID_01573');
  const placed=await db.query('SELECT id FROM shifttime_production_orders_01566 WHERE store_id=$1 AND site_id=$2 AND source_cart_id=$3 LIMIT 1',[scope.storeId,scope.siteId,cartId]);
  if(!placed.rowCount)throw bad('DIRECT_CHECKOUT_RENEW_NOT_ORDERED_01573');
  const items=await db.query('SELECT id,seller_offer_id,quantity,source_kind,store_id,site_id,product_id,variant_id,variant_sku,bundle_id,component_kind,parent_item_id FROM marketplace_cart_items WHERE cart_id=$1 ORDER BY added_at,id FOR UPDATE',[cartId]);
  if(!items.rowCount||items.rowCount>200||items.rows.some(r=>r.source_kind!=='store-product-01534'||r.store_id!==scope.storeId||r.site_id!==scope.siteId||r.seller_offer_id!==null||!Number.isInteger(Number(r.quantity))||Number(r.quantity)<1||Number(r.quantity)>99))throw bad('DIRECT_CHECKOUT_RENEW_ITEMS_UNSUPPORTED_01573');
  const map=new Map(items.rows.map(r=>[r.id,newId('cartitem')])),bundles=new Map();
  if([...map.values()].some(x=>!/^cartitem_[0-9a-f]{32}$/i.test(x)))throw bad('DIRECT_CHECKOUT_RENEW_ID_INVALID_01573',500);
  const nextId=newId('cart');if(!token.test(nextId)||nextId===cartId)throw bad('DIRECT_CHECKOUT_RENEW_ID_INVALID_01573',500);
  await db.query("INSERT INTO marketplace_carts(id,marketplace_id,anonymous_token,status,currency) VALUES($1,'marketplace_shifttime',$1,'active','UAH')",[nextId]);
  for(const r of items.rows){
   if(r.parent_item_id&&!map.has(r.parent_item_id))throw bad('DIRECT_CHECKOUT_RENEW_BUNDLE_INVALID_01573');
   let bundleId=null;if(r.bundle_id){if(!bundles.has(r.bundle_id))bundles.set(r.bundle_id,newId('bundle'));bundleId=bundles.get(r.bundle_id);}
   await db.query(`INSERT INTO marketplace_cart_items(id,cart_id,seller_offer_id,quantity,source_kind,store_id,site_id,product_id,variant_id,variant_sku,bundle_id,component_kind,parent_item_id) VALUES($1,$2,NULL,$3,'store-product-01534',$4,$5,$6,$7,$8,$9,$10,$11)`,[map.get(r.id),nextId,r.quantity,scope.storeId,scope.siteId,r.product_id,r.variant_id,r.variant_sku,bundleId,r.component_kind,r.parent_item_id?map.get(r.parent_item_id):null]);
  }
  return {id:nextId,sourceCartId:cartId,itemsCopied:items.rowCount};
 });
 // shopCartView resolves current catalog state. It is allowed to flag a changed/unavailable product.
 return {stage:'01573',...result,cart:await view(scope,scope.siteId,result.id)};
}

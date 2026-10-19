// 01535 · Authenticated builder testing for authored Store products in the canonical
// marketplace_carts / marketplace_cart_items PostgreSQL tables. Not a public checkout.
import crypto from 'node:crypto';
import {withTransaction,withClient} from './db.mjs';
import {getPublicCart,addPublicCartOffer} from './marketplace-cart-service.mjs';
import {resolveAuthoredBundle01534,resolveAuthoredItem01534} from './vendor/marketplace-cart/marketplace-product-bundle-01534.mjs';
import {authoredView01535} from './marketplace-shop-cart-core-01535.mjs';
const MARKETPLACE_ID='marketplace_shifttime';
const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const money=v=>Number.isFinite(Number(v))?Number(v):0;
const uid=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
const tokenOk=v=>/^cart_[a-z0-9]{24,48}$/i.test(str(v));
const bad=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
function siteIdOf(v){const id=str(v);if(!id||id.length>160||!/^[-\w:]+$/.test(id))throw bad('SHOP_CART_SITE_REQUIRED_01535',400);return id;}
function checkScope(scope){if(!str(scope?.storeId))throw bad('SHOP_CART_SCOPE_REQUIRED_01535',403);return str(scope.storeId);}
async function ensureCart(client,token){const cartId=tokenOk(token)?str(token):uid('cart');await client.query(`INSERT INTO marketplace_carts(id,marketplace_id,anonymous_token,status,currency) VALUES($1,$2,$1,'active','UAH') ON CONFLICT(id) DO NOTHING`,[cartId,MARKETPLACE_ID]);const status=await client.query(`SELECT status FROM marketplace_carts WHERE id=$1 AND marketplace_id=$2 FOR UPDATE`,[cartId,MARKETPLACE_ID]);if(status.rows[0]?.status!=='active')throw bad('SHOP_CART_ALREADY_CONVERTED_01535');return cartId;}
async function snapshot(client,storeId){const result=await client.query(`SELECT snapshot FROM commerce_store_snapshots WHERE store_id=$1`,[storeId]);if(!result.rowCount)throw bad('SHOP_CART_CATALOG_MISSING_01535',404);return result.rows[0].snapshot||{};}
const scopedRows=async(client,cartId,storeId,siteId)=>{const q=await client.query(`SELECT id,source_kind "sourceKind",store_id "storeId",site_id "siteId",product_id "productId",variant_id "variantId",variant_sku "variantSku",bundle_id "bundleId",component_kind "componentKind",parent_item_id "parentItemId",quantity,added_at "addedAt",updated_at "updatedAt" FROM marketplace_cart_items WHERE cart_id=$1 AND store_id=$2 AND site_id=$3 AND source_kind='store-product-01534' ORDER BY added_at,id`,[cartId,storeId,siteId]);return q.rows;};
export async function shopCartView01535(scope,siteId,token=''){
  const storeId=checkScope(scope),site=siteIdOf(siteId);
  const cartId=await withTransaction(async client=>ensureCart(client,token));
  const {s,rows}=await withClient(async client=>({s:await snapshot(client,storeId),rows:await scopedRows(client,cartId,storeId,site)}));
  const authored=authoredView01535(s,rows,storeId,site);
  // The existing SellerOffer entries share this very same canonical cart identity.
  const publicView=await getPublicCart(cartId);
  const publicItems=arr(publicView.items).filter(x=>str(x.storeId)===storeId);
  const items=[...publicItems,...authored.items];const groupsMap=new Map();
  for(const item of items){const key=str(item.sellerProfileId)||`store:${storeId}`;if(!groupsMap.has(key))groupsMap.set(key,{sellerProfileId:item.sellerProfileId||'',storeId,sellerName:item.sellerName||'',currency:item.currency||'UAH',items:[],subtotal:0,quantity:0});const group=groupsMap.get(key);group.items.push(item);group.subtotal+=item.lineTotal;group.quantity+=item.quantity;}
  return {...publicView,stage:'01535',mode:'api-postgresql-shop-authenticated',id:cartId,siteId:site,items,groups:[...groupsMap.values()],lineItems:items.length,quantity:items.reduce((s,x)=>s+x.quantity,0),sellerGroups:groupsMap.size,subtotal:items.reduce((s,x)=>s+x.lineTotal,0),issues:[...arr(publicView.issues).filter(x=>publicItems.some(i=>i.id===x.itemId)),...authored.issues]};
}
export async function addShopBundle01535(scope,siteId,token,input={}){
  const storeId=checkScope(scope),site=siteIdOf(siteId);
  if(str(input.siteId)!==site)throw bad('SHOP_CART_SITE_MISMATCH_01535',409);
  const cartId=await withTransaction(async client=>{
    const id=await ensureCart(client,token),state=await snapshot(client,storeId);
    // Existing canonical relations, variant, prices and stock are re-resolved from PostgreSQL.
    const bundle=resolveAuthoredBundle01534(state,input);
    if(bundle.lines.some(line=>line.quantity>99))throw bad('SHOP_CART_QUANTITY_01534',400);
    const bundleId=uid('bundle');const ids=new Map(bundle.lines.map(line=>[str(line.productId),uid('cartitem')]));
    for(const line of bundle.lines){const itemId=ids.get(str(line.productId));const parentItemId=ids.get(str(line.dependsOnProductId))||null;
      await client.query(`INSERT INTO marketplace_cart_items(id,cart_id,seller_offer_id,quantity,source_kind,store_id,site_id,product_id,variant_id,variant_sku,bundle_id,component_kind,parent_item_id) VALUES($1,$2,NULL,$3,'store-product-01534',$4,$5,$6,$7,$8,$9,$10,$11)`,[itemId,id,line.quantity,storeId,site,str(line.productId),str(line.variantId),str(line.variant?.sku),bundleId,str(line.kind),parentItemId]);
    }
    await client.query(`UPDATE marketplace_carts SET updated_at=now() WHERE id=$1`,[id]);return id;
  });return shopCartView01535(scope,site,cartId);
}
export async function setShopCartQty01535(scope,siteId,token,itemId,quantity){
  const storeId=checkScope(scope),site=siteIdOf(siteId),q=Math.floor(money(quantity));
  const cartId=await withTransaction(async client=>{
    const cid=await ensureCart(client,token),r=await scopedRows(client,cid,storeId,site),entry=r.find(x=>x.id===itemId);
    if(!entry){
      const linked=await client.query(`SELECT o.store_id "storeId",o.stock,o.availability,ci.quantity FROM marketplace_cart_items ci JOIN marketplace_seller_offers o ON o.id=ci.seller_offer_id WHERE ci.cart_id=$1 AND ci.id=$2`,[cid,itemId]);
      if(!linked.rowCount||str(linked.rows[0].storeId)!==storeId)throw bad('SHOP_CART_ITEM_NOT_FOUND_01535',404);
      if(q<1||q>99)throw bad('SHOP_CART_QUANTITY_01534',400);
      if(str(linked.rows[0].availability)!=='preorder'&&money(linked.rows[0].stock)<q)throw bad('SHOP_CART_OUT_OF_STOCK_01534');
      await client.query(`UPDATE marketplace_cart_items SET quantity=$2,updated_at=now() WHERE id=$1`,[itemId,q]);return cid;
    }
    if(q<1||q>99)throw bad('SHOP_CART_QUANTITY_01534',400);
    if(entry.componentKind!=='main')throw bad('SHOP_CART_COMPONENT_QUANTITY_FIXED_01535',409);
    const state=await snapshot(client,storeId),live=resolveAuthoredItem01534(state,entry);
    if(!live||live.status!=='active'||live.stock<q)throw bad('SHOP_CART_OUT_OF_STOCK_01534');
    await client.query(`UPDATE marketplace_cart_items SET quantity=$2,updated_at=now() WHERE id=$1`,[itemId,q]);return cid;
  });return shopCartView01535(scope,site,cartId);
}
export async function removeShopCartItem01535(scope,siteId,token,itemId){
  const storeId=checkScope(scope),site=siteIdOf(siteId);
  const cartId=await withTransaction(async client=>{
    const cid=await ensureCart(client,token),rows=await scopedRows(client,cid,storeId,site),ids=new Set();
    if(!rows.some(x=>x.id===itemId)){
      const linked=await client.query(`SELECT o.store_id "storeId" FROM marketplace_cart_items ci JOIN marketplace_seller_offers o ON o.id=ci.seller_offer_id WHERE ci.cart_id=$1 AND ci.id=$2`,[cid,itemId]);
      if(!linked.rowCount||str(linked.rows[0].storeId)!==storeId)throw bad('SHOP_CART_ITEM_NOT_FOUND_01535',404);
      await client.query(`DELETE FROM marketplace_cart_items WHERE cart_id=$1 AND id=$2`,[cid,itemId]);return cid;
    }
    ids.add(itemId);let changed=true;while(changed){changed=false;for(const row of rows){if(row.parentItemId&&ids.has(row.parentItemId)&&!ids.has(row.id)){ids.add(row.id);changed=true;}}}
    await client.query(`DELETE FROM marketplace_cart_items WHERE cart_id=$1 AND store_id=$2 AND site_id=$3 AND id=ANY($4::text[])`,[cid,storeId,site,[...ids]]);
    return cid;
  });return shopCartView01535(scope,site,cartId);
}
export async function clearShopCart01535(scope,siteId,token){
  const storeId=checkScope(scope),site=siteIdOf(siteId);
  const cid=await withTransaction(async client=>{const id=await ensureCart(client,token);await client.query(`DELETE FROM marketplace_cart_items WHERE cart_id=$1 AND store_id=$2 AND site_id=$3 AND source_kind='store-product-01534'`,[id,storeId,site]);return id;});
  return shopCartView01535(scope,site,cid);
}

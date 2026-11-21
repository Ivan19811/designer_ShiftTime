import crypto from 'node:crypto';
import {effectiveAiCartPrice01416} from './ai-consultant-offer-core-01416.mjs';
const MARKETPLACE_ID='marketplace_shifttime';
const str=value=>String(value??'').trim();
const CART_RE=/^cart_[a-z0-9]{24,48}$/i;
const id=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
export async function ensureAiOfferCart01416(client,token=''){
  const cartId=CART_RE.test(str(token))?str(token):id('cart');
  await client.query(`INSERT INTO marketplace_carts(id,marketplace_id,anonymous_token,status,currency) VALUES($1,$2,$1,'active','UAH') ON CONFLICT(id) DO UPDATE SET updated_at=now()`,[cartId,MARKETPLACE_ID]);
  const q=await client.query(`SELECT id,status FROM marketplace_carts WHERE id=$1 AND marketplace_id=$2 LIMIT 1`,[cartId,MARKETPLACE_ID]);
  if(!q.rowCount||q.rows[0].status!=='active')throw Object.assign(new Error('AI_CONSULTANT_OFFER_CART_UNAVAILABLE_01416'),{code:'AI_CONSULTANT_OFFER_CART_UNAVAILABLE_01416',statusCode:409});
  return cartId;
}
export async function applyAiOfferCartItem01416(client,cartId,sellerOfferId){
  const current=await client.query(`SELECT id,quantity FROM marketplace_cart_items WHERE cart_id=$1 AND seller_offer_id=$2 FOR UPDATE`,[cartId,sellerOfferId]);
  if(current.rowCount&&Number(current.rows[0].quantity)!==1)throw Object.assign(new Error('AI_CONSULTANT_OFFER_CART_QUANTITY_CONFLICT_01416'),{code:'AI_CONSULTANT_OFFER_CART_QUANTITY_CONFLICT_01416',statusCode:409});
  if(current.rowCount)return current.rows[0].id;
  const itemId=id('cartitem');await client.query(`INSERT INTO marketplace_cart_items(id,cart_id,seller_offer_id,quantity) VALUES($1,$2,$3,1)`,[itemId,cartId,sellerOfferId]);return itemId;
}
export async function decorateAiCartRows01416(client,rows=[]){
  const ids=rows.map(x=>str(x.itemId||x.cartItemId)).filter(Boolean);if(!ids.length)return rows;
  const q=await client.query(`SELECT cart_item_id "cartItemId",discount_amount::float8 "discountAmount",base_price::float8 "basePrice",final_price::float8 "finalPrice",currency,expires_at "expiresAt" FROM shifttime_ai_consultant_offers WHERE cart_item_id=ANY($1::text[]) AND status='cart-applied' AND expires_at>now() ORDER BY cart_applied_at DESC,id`,[ids]);
  const map=new Map();for(const row of q.rows)if(!map.has(row.cartItemId))map.set(row.cartItemId,row);
  return rows.map(row=>({...row,aiOffer:map.get(str(row.itemId||row.cartItemId))||null}));
}
export async function revokeAiCartOfferOnQuantityChange01416(client,cartId,cartItemId,quantity){if(Number(quantity)===1)return;await client.query(`UPDATE shifttime_ai_consultant_offers SET status='revoked',updated_at=now() WHERE cart_id=$1 AND cart_item_id=$2 AND status='cart-applied'`,[cartId,cartItemId]);}
export async function revokeAiCartOffers01416(client,cartId,cartItemId=''){const args=[cartId];let sql=`UPDATE shifttime_ai_consultant_offers SET status='revoked',updated_at=now() WHERE cart_id=$1 AND status='cart-applied'`;if(str(cartItemId)){args.push(str(cartItemId));sql+=` AND cart_item_id=$2`;}await client.query(sql,args);}
export async function loadAiCheckoutOffers01416(client,cartId,cartItemIds=[]){
  const ids=cartItemIds.map(str).filter(Boolean);if(!ids.length)return new Map();
  const q=await client.query(`SELECT id,cart_item_id "cartItemId",base_price::float8 "basePrice",discount_amount::float8 "discountAmount",final_price::float8 "finalPrice",currency,expires_at "expiresAt" FROM shifttime_ai_consultant_offers WHERE cart_id=$1 AND cart_item_id=ANY($2::text[]) AND status='cart-applied' AND expires_at>now() ORDER BY cart_applied_at DESC,id`,[cartId,ids]);const map=new Map();for(const row of q.rows)if(!map.has(row.cartItemId))map.set(row.cartItemId,row);return map;
}
export async function consumeAiCheckoutOffers01416(client,cartId,marketplaceOrderId,offerIds=[]){const ids=offerIds.map(str).filter(Boolean);if(!ids.length)return;await client.query(`UPDATE shifttime_ai_consultant_offers SET status='consumed',marketplace_order_id=$2,consumed_at=now(),updated_at=now() WHERE cart_id=$1 AND id=ANY($3::text[]) AND status='cart-applied' AND expires_at>now()`,[cartId,marketplaceOrderId,ids]);}
export {effectiveAiCartPrice01416};

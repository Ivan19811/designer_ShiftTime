// 01079 · Authoritative order totals. Browser may choose delivery intent, but never supplies financial totals.
import {manualDevShippingProvider01078} from './shipping-providers/manual-dev-shipping-provider.mjs';
const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export const moneyRound01079=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
export function sellerTotals01079({itemsSubtotal=0,shippingTotal=0,discountTotal=0}={}){
  const items=moneyRound01079(Math.max(0,n(itemsSubtotal))),shipping=moneyRound01079(Math.max(0,n(shippingTotal))),maxDiscount=moneyRound01079(items+shipping),discount=moneyRound01079(Math.min(maxDiscount,Math.max(0,n(discountTotal)))),gross=moneyRound01079(Math.max(0,items+shipping-discount));
  return {itemsSubtotal:items,shippingTotal:shipping,discountTotal:discount,grossTotal:gross};
}
export function marketplaceTotals01079(sellerTotals=[]){
  const rows=Array.isArray(sellerTotals)?sellerTotals:[];
  return {itemsTotal:moneyRound01079(rows.reduce((s,x)=>s+n(x.itemsSubtotal),0)),shippingTotal:moneyRound01079(rows.reduce((s,x)=>s+n(x.shippingTotal),0)),discountTotal:moneyRound01079(rows.reduce((s,x)=>s+n(x.discountTotal),0)),grandTotal:moneyRound01079(rows.reduce((s,x)=>s+n(x.grossTotal),0))};
}
export async function quoteCheckoutShipping01079(input={}){
  const quantity=Math.max(1,Math.floor(n(input.quantity,1)));
  // 01079 still executes the provider-neutral 01078 manual-dev adapter. Real adapters arrive in 01083+ without changing totals core.
  const q=await manualDevShippingProvider01078.quote({...input,quantity});
  return {...q,shippingPrice:moneyRound01079(q.shippingPrice),quoteSource:'shipping-provider',pricingStage:'01079'};
}
export async function assertOrderFinancialTotalsMutable01079(client,marketplaceOrderId,{currentShippingTotal=0,nextShippingTotal=0}={}){
  if(moneyRound01079(currentShippingTotal)===moneyRound01079(nextShippingTotal))return true;
  const q=await client.query(`SELECT id,status FROM marketplace_payments WHERE marketplace_order_id=$1 LIMIT 1`,[marketplaceOrderId]);
  if(q.rowCount)throw Object.assign(new Error(`Shipping price is financially locked because payment ${q.rows[0].status} already exists`),{statusCode:409});
  return true;
}
export async function recalculateOrderTotals01079(client,marketplaceOrderId,{lockOrder=true}={}){
  const oq=await client.query(`SELECT id,currency,discount_total::float8 "discountTotal" FROM marketplace_orders WHERE id=$1${lockOrder?' FOR UPDATE':''}`,[marketplaceOrderId]);
  if(!oq.rowCount)throw Object.assign(new Error('MarketplaceOrder not found for totals calculation'),{statusCode:404});
  const sq=await client.query(`SELECT so.id,so.discount_total::float8 "discountTotal",so.shipping_total::float8 "legacyShippingTotal",COALESCE(SUM(oi.line_total),0)::float8 "itemsSubtotal",COALESCE(MAX(d.shipping_price),so.shipping_total,0)::float8 "shippingTotal"
    FROM marketplace_seller_orders so
    LEFT JOIN marketplace_order_items oi ON oi.seller_order_id=so.id
    LEFT JOIN marketplace_seller_order_deliveries d ON d.seller_order_id=so.id
    WHERE so.marketplace_order_id=$1
    GROUP BY so.id,so.discount_total,so.shipping_total
    ORDER BY so.id`,[marketplaceOrderId]);
  const seller=[];
  for(const row of sq.rows){
    const totals=sellerTotals01079({itemsSubtotal:row.itemsSubtotal,shippingTotal:row.shippingTotal,discountTotal:row.discountTotal});
    await client.query(`UPDATE marketplace_seller_orders SET subtotal=$2,shipping_total=$3,discount_total=$4,total=$5,updated_at=now() WHERE id=$1`,[row.id,totals.itemsSubtotal,totals.shippingTotal,totals.discountTotal,totals.grossTotal]);
    seller.push({sellerOrderId:row.id,...totals});
  }
  const all=marketplaceTotals01079(seller);
  await client.query(`UPDATE marketplace_orders SET subtotal=$2,shipping_total=$3,discount_total=$4,total=$5,updated_at=now() WHERE id=$1`,[marketplaceOrderId,all.itemsTotal,all.shippingTotal,all.discountTotal,all.grandTotal]);
  return {stage:'01079',marketplaceOrderId,...all,sellerOrders:seller};
}

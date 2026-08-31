// 01079 · Shared LOCAL DEV financial totals projection. API mode remains backend-authoritative.
export const MARKETPLACE_PRICING_STAGE_01079='01079';
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export const moneyRound01079=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
export function normalizeSellerOrderTotals01079(input={}){
  const items=Array.isArray(input.items)?input.items:[];
  const itemsSubtotal=moneyRound01079(items.reduce((s,x)=>s+num(x.lineTotal),0));
  const shippingTotal=moneyRound01079(Math.max(0,num(input.delivery?.shippingPrice,input.shippingTotal)));
  const maxDiscount=moneyRound01079(itemsSubtotal+shippingTotal),discountTotal=moneyRound01079(Math.min(maxDiscount,Math.max(0,num(input.discountTotal))));
  const grossTotal=moneyRound01079(Math.max(0,itemsSubtotal+shippingTotal-discountTotal));
  return {...input,itemsSubtotal,subtotal:itemsSubtotal,shippingTotal,discountTotal,grossTotal,total:grossTotal,pricingStage:'01079'};
}
export function normalizeMarketplaceOrderTotals01079(input={}){
  const sellerOrders=(Array.isArray(input.sellerOrders)?input.sellerOrders:[]).map(normalizeSellerOrderTotals01079);
  const itemsTotal=moneyRound01079(sellerOrders.reduce((s,x)=>s+x.itemsSubtotal,0));
  const shippingTotal=moneyRound01079(sellerOrders.reduce((s,x)=>s+x.shippingTotal,0));
  const discountTotal=moneyRound01079(sellerOrders.reduce((s,x)=>s+x.discountTotal,0));
  const grandTotal=moneyRound01079(Math.max(0,itemsTotal+shippingTotal-discountTotal));
  return {...input,sellerOrders,itemsTotal,subtotal:itemsTotal,shippingTotal,discountTotal,grandTotal,total:grandTotal,pricingStage:'01079'};
}
export function summarizeOrderTotals01079(order={}){const x=normalizeMarketplaceOrderTotals01079(order);return {itemsTotal:x.itemsTotal,shippingTotal:x.shippingTotal,discountTotal:x.discountTotal,grandTotal:x.grandTotal,currency:x.currency||'UAH'};}

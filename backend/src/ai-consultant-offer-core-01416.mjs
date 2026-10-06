export const AI_CONSULTANT_OFFER_STAGE_01416='01416';
const str=value=>String(value??'').trim();
const money=value=>Math.round((Number(value)||0)*100)/100;
export function acceptedOfferSnapshot01416(item={},offer={},now=Date.now(),ttlMs=30*60*1000){
  const basePrice=money(offer.basePrice),discountAmount=money(offer.discountAmount),finalPrice=money(offer.finalPrice),currency=str(offer.currency)||str(item.currency)||'UAH';
  if(!str(item.listingId||item.id)||!str(item.sellerOfferId)||!str(offer.ruleId)||basePrice<=0||discountAmount<=0||finalPrice<0||finalPrice>=basePrice)return null;
  return {listingId:str(item.listingId||item.id),sellerOfferId:str(item.sellerOfferId),ruleId:str(offer.ruleId),basePrice,discountAmount,finalPrice,currency,expiresAt:new Date(Number(now)+Math.max(60_000,Number(ttlMs)||0)).toISOString()};
}
export function validateAcceptedOfferSnapshot01416(record={},item={},offer={},now=Date.now()){
  if(!record||!item||!offer)return {ok:false,code:'AI_CONSULTANT_OFFER_CHANGED_01416'};
  if(new Date(record.expiresAt||record.expires_at||0).getTime()<=Number(now))return {ok:false,code:'AI_CONSULTANT_OFFER_EXPIRED_01416'};
  const sameListing=str(record.listingId||record.listing_id)===str(item.listingId||item.id),sameSeller=str(record.sellerOfferId||record.seller_offer_id)===str(item.sellerOfferId),sameRule=str(record.ruleId||record.rule_id)===str(offer.ruleId),sameCurrency=str(record.currency).toUpperCase()===str(offer.currency).toUpperCase();
  const sameMoney=money(record.basePrice??record.base_price)===money(offer.basePrice)&&money(record.discountAmount??record.discount_amount)===money(offer.discountAmount)&&money(record.finalPrice??record.final_price)===money(offer.finalPrice);
  return sameListing&&sameSeller&&sameRule&&sameCurrency&&sameMoney?{ok:true}:{ok:false,code:'AI_CONSULTANT_OFFER_CHANGED_01416'};
}
export function effectiveAiCartPrice01416(basePrice,quantity,offer=null){
  const base=money(basePrice),qty=Math.max(1,Math.trunc(Number(quantity)||1));if(!offer||qty!==1)return {baseUnitPrice:base,unitPrice:base,discountAmount:0,lineTotal:money(base*qty)};
  const discount=money(Math.min(base,Math.max(0,Number(offer.discountAmount)||0))),unit=money(Math.max(0,base-discount));return {baseUnitPrice:base,unitPrice:unit,discountAmount:discount,lineTotal:unit};
}

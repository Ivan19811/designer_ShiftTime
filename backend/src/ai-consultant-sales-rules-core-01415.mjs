export const AI_CONSULTANT_SALES_RULES_STAGE_01415='01415';
const str=value=>String(value??'').trim();
const num=(value,fallback=null)=>Number.isFinite(Number(value))?Number(value):fallback;
const arr=value=>Array.isArray(value)?value:[];
const norm=value=>str(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const money=value=>Math.round((Number(value)||0)*100)/100;
function active(rule,now){const t=now instanceof Date?now:new Date(now||Date.now());const start=rule?.startsAt?new Date(rule.startsAt):null,end=rule?.endsAt?new Date(rule.endsAt):null;return (!start||start<=t)&&(!end||end>t);}
function productMatches(rule,item){const ids=arr(rule?.productIds).map(str).filter(Boolean);if(ids.length&&!ids.includes(str(item?.listingId||item?.id)))return false;const cats=arr(rule?.categories).map(norm).filter(Boolean);if(cats.length){const have=arr(item?.categories).map(x=>norm(x?.name||x?.slug||x));if(!cats.some(cat=>have.some(value=>value===cat||value.includes(cat)||cat.includes(value))))return false;}return true;}
function priceMatches(rule,item){const price=Math.max(0,num(item?.price,0)||0),oldPrice=Math.max(0,num(item?.oldPrice,0)||0);if(rule?.excludeDiscountedProducts!==false&&oldPrice>price)return false;const min=Math.max(0,num(rule?.minProductPrice,0)||0),max=num(rule?.maxProductPrice,null);if(rule?.minPriceExclusive!==false){if(!(price>min))return false;}else if(price<min)return false;if(max!=null&&price>max)return false;return true;}
export function evaluateAiConsultantSalesRule01415(rule,item,{now=Date.now()}={}){
  if(!rule?.enabled||!active(rule,now)||!productMatches(rule,item)||!priceMatches(rule,item))return null;
  const currency=str(item?.currency)||'UAH';if(str(rule?.currency||'UAH').toUpperCase()!==currency.toUpperCase())return null;
  const price=Math.max(0,num(item?.price,0)||0),value=Math.max(0,num(rule?.discountValue,0)||0),cap=Math.max(0,num(rule?.maxDiscount,0)||0);if(!price||!value||!cap)return null;
  let amount=rule?.discountType==='percent'?price*(value/100):value;amount=money(Math.min(amount,cap,price));if(amount<=0)return null;
  return {ruleId:str(rule.id),ruleName:str(rule.name),discountType:rule?.discountType==='percent'?'percent':'fixed',discountValue:value,discountAmount:amount,maxDiscount:money(cap),basePrice:money(price),finalPrice:money(Math.max(0,price-amount)),currency};
}
export function attachAiConsultantSalesOffers01415(items,rules,{discountsEnabled=false,now=Date.now()}={}){
  const ordered=arr(rules).filter(x=>x?.enabled).slice().sort((a,b)=>(Number(b?.priority)||0)-(Number(a?.priority)||0)||String(a?.id||'').localeCompare(String(b?.id||'')));
  return arr(items).map(item=>{if(!discountsEnabled)return {...item,offer:null};let offer=null;for(const rule of ordered){offer=evaluateAiConsultantSalesRule01415(rule,item,{now});if(offer)break;}return {...item,offer};});
}
export function salesOfferSummary01415(items=[]){const offers=arr(items).map(x=>x?.offer).filter(Boolean);return {offeredProducts:offers.length,bestDiscount:offers.reduce((max,x)=>Math.max(max,Number(x.discountAmount)||0),0)};}

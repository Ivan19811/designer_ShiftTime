// 01079 · Checkout Price / Shipping Totals stage.
import {initMarketplaceStudio01078} from './marketplace-studio-01078.js?v=01090';
let api=null;
export async function initMarketplaceStudio01079(){
  const base=await initMarketplaceStudio01078();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01079';
    const m=studio.querySelector('[data-mp-system-status-block]')?.querySelectorAll('.mp-context__metric')||[];
    if(m[0])m[0].innerHTML='<span>Studio stage</span><b>01079</b>';
    if(m[1])m[1].innerHTML='<span>Checkout totals</span><b>AUTHORITATIVE</b>';
    if(m[2])m[2].innerHTML='<span>Shipping</span><b>PER SELLER</b>';
    if(m[3])m[3].innerHTML='<span>Payment gross</span><b>FINAL TOTAL</b>';
    const w=studio.querySelector('.mp-context__notice.is-warn');
    if(w)w.innerHTML='<b>Totals 01079:</b> browser не задає price/shipping/discount totals. Кожен SellerOrder: Items + Shipping − Discount = Gross; MarketplaceOrder: сума SellerOrders = Grand Total. Payment/commission створюються тільки з цього фінального snapshot.';
  }
  api=Object.freeze({stage:'01079',base});
  try{window.ST_MARKETPLACE_STUDIO_01079=api;window.__ST_ALL_LOG__?.push?.('marketplace-totals:studio-ready-01079',{stage:'01079',authoritativeTotals:true,shippingInGross:true,paymentFromGrandTotal:true,next:'01080-real-postgresql-deployment-migration'});}catch{}
  return api;
}

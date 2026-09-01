// 01074 · Multi-Seller Cart stage.
import {initMarketplaceStudio01073} from './marketplace-studio-01073.js?v=01090';
import {seedMarketplaceCartDemoFixture01074} from './services/marketplace-cart-demo-fixture-01074.js?v=01082';
import {initMarketplaceCartUi01074} from './marketplace-cart-01074.js?v=01082';
let api=null;
export async function initMarketplaceStudio01074(){
  await initMarketplaceStudio01073();
  let demo=null;try{demo=await seedMarketplaceCartDemoFixture01074({force:false});}catch(e){console.warn('[01074] cart demo fixture skipped',e);}
  try{await window.ST_MARKETPLACE_GLOBAL_CATALOG_01073?.store?.search?.({page:1},'01074-demo-partner');}catch{}
  const cart=await initMarketplaceCartUi01074();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){studio.dataset.mpStage='01074';const metrics=studio.querySelector('[data-mp-system-status-block]')?.querySelectorAll('.mp-context__metric')||[];if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01074</b>';if(metrics[1])metrics[1].innerHTML='<span>Buyer cart</span><b>MULTI-SELLER</b>';if(metrics[2])metrics[2].innerHTML='<span>Cart authority</span><b>OFFER IDENTITY</b>';if(metrics[3])metrics[3].innerHTML='<span>DEMO fixture</span><b>5 PRODUCTS / 2 CATS</b>';const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Multi-Seller Cart 01074:</b> одна корзина групує позиції за Seller. У LOCAL DEMO є 5 товарів у 2 категоріях і другий тестовий продавець для двох CatalogProduct, щоб одразу перевірити multi-seller сценарій.';}
  api=Object.freeze({stage:'01074',cart,demo});try{window.ST_MARKETPLACE_STUDIO_01074=api;}catch{}
  try{window.__ST_ALL_LOG__?.push?.('marketplace-cart:studio-ready-01074',{stage:'01074',demo,multiSellerCart:true,identityOnly:true,next:['marketplace-order-seller-orders','checkout-delivery']});}catch{}
  return api;
}

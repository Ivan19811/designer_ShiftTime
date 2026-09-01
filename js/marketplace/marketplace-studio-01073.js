// 01073 · Global Marketplace Catalog + Search Index.
import {initMarketplaceStudio01072} from './marketplace-studio-01072.js?v=01090';
import {seedMarketplaceDemoFixture01073} from './services/marketplace-demo-fixture-01073.js?v=01082';
import {initMarketplaceGlobalCatalogUi01073} from './marketplace-global-catalog-01073.js?v=01082';
let api=null;
export async function initMarketplaceStudio01073(){
  await initMarketplaceStudio01072();
  let demo=null;
  try{demo=await seedMarketplaceDemoFixture01073({force:false,publish:true});}catch(e){console.warn('[01073] automatic demo fixture skipped',e);}
  const globalCatalog=await initMarketplaceGlobalCatalogUi01073();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){studio.dataset.mpStage='01073';const metrics=studio.querySelectorAll('.mp-context__metric');if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01073</b>';if(metrics[1])metrics[1].innerHTML='<span>Global catalog</span><b>SEARCH INDEX</b>';if(metrics[2])metrics[2].innerHTML='<span>Catalog model</span><b>PRODUCT + OFFERS</b>';if(metrics[3])metrics[3].innerHTML='<span>DEMO fixture</span><b>5 PRODUCTS / 2 CATS</b>';const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Global Catalog 01073:</b> центральний пошук читає тільки approved MarketplaceListing/SellerOffer. Один CatalogProduct може мати кілька пропозицій продавців. У чистому LOCAL Store автоматично додається DEMO-набір 5 товарів у 2 категоріях для тестування.';}
  api=Object.freeze({stage:'01073',globalCatalog,demo});try{window.ST_MARKETPLACE_STUDIO_01073=api;}catch{}
  try{window.__ST_ALL_LOG__?.push?.('marketplace-global-catalog:studio-ready-01073',{stage:'01073',demo,publicSearch:true,categoryFacets:true,multiSellerOfferGrouping:true,next:['multi-seller-cart','marketplace-orders']});}catch{}
  return api;
}

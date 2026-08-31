// 01062 · Marketplace Studio Search + Recommendations binding.
// Builds on 01061. 01052 MarketplaceStore/Repository core stays intact.
import { initMarketplaceStudio01061 } from './marketplace-studio-01061.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceSearchRecommendations01062 } from './marketplace-search-recommendations-01062.js?v=01062';
import {
  searchMarketplaceProducts01062,getMarketplaceAutocomplete01062,getMarketplaceSearchDiagnostics01062,
  resolveMarketplaceRecommendation01062,getMarketplaceRecommendationEngine01062,getMarketplaceRecommendationDiagnostics01062
} from './services/marketplace-search-recommendations-service-01062.js?v=01062';

let controller=null;
export async function initMarketplaceStudio01062(){
  await initMarketplaceStudio01061();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01062';
  controller=initMarketplaceSearchRecommendations01062({store,studio,activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)});
  const metrics=studio.querySelectorAll('.mp-context__metric');if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01062</b>';if(metrics[2])metrics[2].innerHTML='<span>Discovery</span><b>SEARCH + RECS LIVE</b>';const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Реальні модулі активні:</b> Products, Categories, Attributes/Variants/Filters, Media, Import/Export, Feeds, Search і Recommendations. Серверні behavioral signals та jobs підключатимуться через майбутній Commerce Backend.';
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_DISCOVERY_01062=Object.freeze({
      stage:'01062',controller,
      search:(query,options)=>searchMarketplaceProducts01062(store.getState(),query,options),
      autocomplete:(query,options)=>getMarketplaceAutocomplete01062(store.getState(),query,options),
      searchDiagnostics:()=>getMarketplaceSearchDiagnostics01062(store.getState()),
      recommendation:(id,context={})=>{const r=store.getRecommendation(id);return r?resolveMarketplaceRecommendation01062(store.getState(),r,context):null;},
      recommendationEngine:(context={})=>getMarketplaceRecommendationEngine01062(store.getState(),context),
      recommendationDiagnostics:()=>getMarketplaceRecommendationDiagnostics01062(store.getState())
    });
    window.ST_MARKETPLACE_STUDIO_01062=Object.freeze({stage:'01062',store,discovery:controller,feedManager:window.ST_MARKETPLACE_FEEDS_01061?.controller||null,importExport:window.ST_MARKETPLACE_IMPORT_EXPORT_01060?.controller||null,mediaLibrary:window.ST_MARKETPLACE_MEDIA_01059||null,attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});
  }catch{}
  return controller;
}

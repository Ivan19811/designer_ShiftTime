// 01061 · Marketplace Studio Feed Manager binding.
// Builds on 01060. 01052 MarketplaceStore/Repository core stays intact.
import { initMarketplaceStudio01060 } from './marketplace-studio-01060.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceFeedManager01061 } from './marketplace-feed-manager-01061.js?v=01061';
import { generateFeedDocument01061,validateFeed01061,getFeedManagerSummary01061 } from './services/marketplace-feed-service-01061.js?v=01061';

let controller=null;
export async function initMarketplaceStudio01061(){
  await initMarketplaceStudio01060();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01061';
  controller=initMarketplaceFeedManager01061({store,studio,activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)});
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_FEEDS_01061=Object.freeze({
      stage:'01061',controller,
      getAll:()=>store.getFeeds(),get:(id)=>store.getFeed(id),
      validate:(id)=>{const f=store.getFeed(id);return f?validateFeed01061(store.getState(),f):null;},
      generate:(id)=>{const f=store.getFeed(id);return f?generateFeedDocument01061(store.getState(),f):null;},
      summary:()=>getFeedManagerSummary01061(store.getState())
    });
    window.ST_MARKETPLACE_STUDIO_01061=Object.freeze({stage:'01061',store,feedManager:controller,importExport:window.ST_MARKETPLACE_IMPORT_EXPORT_01060?.controller||null,mediaLibrary:window.ST_MARKETPLACE_MEDIA_01059||null,attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});
  }catch{}
  return controller;
}

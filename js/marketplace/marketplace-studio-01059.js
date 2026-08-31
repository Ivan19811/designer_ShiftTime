// 01059 · Marketplace Studio Media Library binding.
// Builds on 01058 and keeps 01052 Marketplace data/repository core intact.
import { initMarketplaceStudio01058 } from './marketplace-studio-01058.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { getMarketplaceMediaAssetRepository01059 } from './data/marketplace-media-runtime-01059.js?v=01059';
import { createMarketplaceMediaService01059 } from './services/marketplace-media-service-01059.js?v=01059';
import { initMarketplaceMediaLibrary01059 } from './marketplace-media-library-01059.js?v=01059';
import { getMarketplaceMediaLibraryBindingData01059 } from './data/marketplace-media-selectors-01059.js?v=01059';

let controller=null;
export async function initMarketplaceStudio01059(){
  await initMarketplaceStudio01058();
  const store=getMarketplaceStore01052();
  const studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01059';
  const assetRepository=getMarketplaceMediaAssetRepository01059();
  const service=createMarketplaceMediaService01059(store,assetRepository);
  controller=initMarketplaceMediaLibrary01059({store,studio,service,activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)});
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_MEDIA_01059=Object.freeze({
      stage:'01059',controller,service,assetRepository,
      pick:(options)=>controller?.openPicker?.(options),
      getLibrary:()=>getMarketplaceMediaLibraryBindingData01059(store.getState()),
      getItem:(id)=>controller?.getBindingData?.(id)||null
    });
    window.ST_MARKETPLACE_STUDIO_01059=Object.freeze({
      stage:'01059',store,mediaLibrary:controller,
      attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,
      categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,
      productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null
    });
  }catch{}
  return controller;
}

// 01053 · Marketplace Studio Product Editor binding.
// 01052 remains the data foundation. This stage adds Product CRUD UI only.
import { initMarketplaceStudio01052 } from './marketplace-studio-01052.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceProductEditor01053 } from './marketplace-product-editor-01053.js?v=01053';

let controller=null;

export async function initMarketplaceStudio01053(){
  await initMarketplaceStudio01052();
  const store=getMarketplaceStore01052();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(!studio)return null;
  studio.dataset.mpStage='01053';
  controller=initMarketplaceProductEditor01053({
    store,
    studio,
    activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)
  });
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_PRODUCT_EDITOR_01053=controller;
    window.ST_MARKETPLACE_STUDIO_01053=Object.freeze({stage:'01053',store,productEditor:controller});
  }catch{}
  return controller;
}

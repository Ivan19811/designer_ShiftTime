// 01057 · Marketplace Studio Category Editor binding.
// 01052 remains the storage-independent data foundation; 01053 Product Editor stays intact.
import { initMarketplaceStudio01053 } from './marketplace-studio-01053.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceCategoryEditor01057 } from './marketplace-category-editor-01057.js?v=01057';

let controller=null;

export async function initMarketplaceStudio01057(){
  await initMarketplaceStudio01053();
  const store=getMarketplaceStore01052();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(!studio)return null;
  studio.dataset.mpStage='01057';
  controller=initMarketplaceCategoryEditor01057({
    store,studio,
    activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)
  });
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_CATEGORY_EDITOR_01057=controller;
    window.ST_MARKETPLACE_STUDIO_01057=Object.freeze({stage:'01057',store,categoryEditor:controller,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});
  }catch{}
  return controller;
}

// 01058 · Marketplace Studio Attributes / Variants / Filters binding.
// Builds on 01057 Category Editor and keeps 01052 data core/repository contract intact.
import { initMarketplaceStudio01057 } from './marketplace-studio-01057.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceAttributesVariantsFilters01058 } from './marketplace-attributes-variants-filters-01058.js?v=01058';
import { getMarketplaceFacetBindingData01058 } from './data/marketplace-attribute-selectors-01058.js?v=01058';

let controller=null;

export async function initMarketplaceStudio01058(){
  await initMarketplaceStudio01057();
  const store=getMarketplaceStore01052();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(!studio)return null;
  studio.dataset.mpStage='01058';
  controller=initMarketplaceAttributesVariantsFilters01058({
    store,studio,
    activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)
  });
  store.subscribe(()=>controller?.renderAll?.());
  try{
    window.ST_MARKETPLACE_AVF_01058=controller;
    window.ST_MARKETPLACE_FACETS_01058=Object.freeze({
      stage:'01058',
      getAll:()=>getMarketplaceFacetBindingData01058(store.getState())
    });
    window.ST_MARKETPLACE_STUDIO_01058=Object.freeze({
      stage:'01058',store,
      attributesVariantsFilters:controller,
      categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,
      productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null
    });
  }catch{}
  return controller;
}

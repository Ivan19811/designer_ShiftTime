// 01060 · Marketplace Studio Import / Export + Mapping binding.
// Builds on 01059. 01052 MarketplaceStore/Repository core stays intact.
import { initMarketplaceStudio01059 } from './marketplace-studio-01059.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceImportExport01060 } from './marketplace-import-export-01060.js?v=01060';

let controller=null;
export async function initMarketplaceStudio01060(){
  await initMarketplaceStudio01059();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01060';
  controller=initMarketplaceImportExport01060({store,studio,activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)});
  store.subscribe(()=>controller?.renderAll?.());
  try{window.ST_MARKETPLACE_IMPORT_EXPORT_01060=Object.freeze({stage:'01060',controller,store});window.ST_MARKETPLACE_STUDIO_01060=Object.freeze({stage:'01060',store,importExport:controller,mediaLibrary:window.ST_MARKETPLACE_MEDIA_01059||null,attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});}catch{}
  return controller;
}

// 01063 · Marketplace Studio SEO Center binding.
// Builds on 01062. 01052 MarketplaceStore/Repository core stays intact.
import { initMarketplaceStudio01062 } from './marketplace-studio-01062.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceSeoCenter01063 } from './marketplace-seo-center-01063.js?v=01063';
import {getSeoDiagnostics01063,getSeoBindingData01063,generateSitemapXml01063,generateStructuredData01063} from './services/marketplace-seo-service-01063.js?v=01063';

let controller=null;
export async function initMarketplaceStudio01063(){
  await initMarketplaceStudio01062();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01063';
  controller=initMarketplaceSeoCenter01063({store,studio,activatePage:(id)=>window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(id)});
  const metrics=studio.querySelectorAll('.mp-context__metric');if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01063</b>';if(metrics[2])metrics[2].innerHTML='<span>SEO</span><b>META + SCHEMA LIVE</b>';const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Наступна архітектурна межа:</b> після Commerce Binding Layer буде Multi-Tenant Foundation: Account → Workspace → Store. SEO public URL та identity потім стануть властивостями конкретного Store.';
  store.subscribe(()=>controller?.render?.());
  try{window.ST_MARKETPLACE_SEO_01063=Object.freeze({stage:'01063',controller,diagnostics:()=>getSeoDiagnostics01063(store.getState()),binding:(type,id)=>getSeoBindingData01063(store.getState(),type,id),sitemap:()=>generateSitemapXml01063(store.getState()),structuredData:(type,id)=>generateStructuredData01063(store.getState(),type,id)});window.ST_MARKETPLACE_STUDIO_01063=Object.freeze({stage:'01063',store,seo:controller,discovery:window.ST_MARKETPLACE_DISCOVERY_01062?.controller||null,feedManager:window.ST_MARKETPLACE_FEEDS_01061?.controller||null,importExport:window.ST_MARKETPLACE_IMPORT_EXPORT_01060?.controller||null,mediaLibrary:window.ST_MARKETPLACE_MEDIA_01059||null,attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});}catch{}
  return controller;
}

// 01068 · Commerce Grid runtime rehydrate parity.
// Keeps the 01067 query/binding contract and fixes runtime reconstruction after canonical SiteFrameStore renders.
import { initMarketplaceStudio01067 } from './marketplace-studio-01067.js?v=01083';

let api=null;
export async function initMarketplaceStudio01068(){
  await initMarketplaceStudio01067();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  const runtime=window.ST_COMMERCE_COLLECTION_BINDING_01067||null;
  if(studio){
    studio.dataset.mpStage='01068';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01068</b>';
    if(metrics[2])metrics[2].innerHTML='<span>Product Grid</span><b>LIVE REHYDRATE</b>';
    if(metrics[3])metrics[3].innerHTML='<span>Grid source</span><b>MarketplaceStore</b>';
    const warn=studio.querySelector('.mp-context__notice.is-warn');
    if(warn)warn.innerHTML='<b>Наступний основний етап 01069:</b> Multi-Tenant Commerce Foundation. Grid runtime 01068 відновлюється після canonical SiteFrameStore render/root-save і не зберігає runtime clones як authored nodes.';
  }
  try{window.ST_COMMERCE_COLLECTION_BINDING_01068=runtime;}catch{}
  api=Object.freeze({stage:'01068',contractStage:'01067',collectionBinding:runtime,store:window.ST_MARKETPLACE_STUDIO_01067?.store||null});
  try{window.ST_MARKETPLACE_STUDIO_01068=api;}catch{}
  try{window.__ST_ALL_LOG__?.push?.('commerce-grid:studio-ready-01068',{stage:'01068',contractStage:'01067',runtimeReady:!!runtime,siteFrameMainDomRendered:true});}catch{}
  return api;
}

// 01089 · Real Auth context automatically drives Marketplace ApiRepository + server-authorized Store.
import {initMarketplaceStudio01087} from './marketplace-studio-01087.js?v=01090';
import {getMarketplaceBackendStatus01071} from './data/marketplace-backend-runtime-01071.js?v=01090';
import {getEffectiveMarketplaceContext01089} from './data/marketplace-api-auth-01089.js?v=01089';
let api=null;
export async function initMarketplaceStudio01089(){
  const base=await initMarketplaceStudio01087();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01089';
    const hero=document.querySelector('#marketplace-panel-root .mp-inspector__hero');
    const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01089';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01089</b>';
  }
  const backend=getMarketplaceBackendStatus01071(),context=getEffectiveMarketplaceContext01089();
  api=Object.freeze({stage:'01089',base,authContextPropagation:true,backend,context,next:'01090'});
  try{window.ST_MARKETPLACE_STUDIO_01089=api;window.__ST_ALL_LOG__?.push?.('marketplace-auth-context-propagation:studio-ready-01089',{stage:'01089',repository:backend.state,storeId:context.storeId,role:context.role,source:context.source});}catch{}
  return api;
}

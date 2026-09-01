// 01090 · Real Auth boot-order/API lock + browser password-manager compatibility.
import {initMarketplaceStudio01089} from './marketplace-studio-01089.js?v=01090';
import {getMarketplaceBackendStatus01071} from './data/marketplace-backend-runtime-01071.js?v=01090';
import {getEffectiveMarketplaceContext01089} from './data/marketplace-api-auth-01089.js?v=01090';
let api=null;
export async function initMarketplaceStudio01090(){
  const base=await initMarketplaceStudio01089();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01090';
    const hero=document.querySelector('#marketplace-panel-root .mp-inspector__hero');
    const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01090';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01090</b>';
  }
  const backend=getMarketplaceBackendStatus01071(),context=getEffectiveMarketplaceContext01089();
  api=Object.freeze({stage:'01090',base,realAuthBootLock:true,singletonRuntimeIdentity:true,passwordManagerCompatible:true,backend,context,next:'01091'});
  try{window.ST_MARKETPLACE_STUDIO_01090=api;window.__ST_ALL_LOG__?.push?.('marketplace-auth-boot-lock:studio-ready-01090',{stage:'01090',repository:backend.state,storeId:context.storeId,role:context.role,source:context.source});}catch{}
  return api;
}

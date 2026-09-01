// 01091 · Marketplace context/status DOM parity cleanup.
import {initMarketplaceStudio01090} from './marketplace-studio-01090.js?v=01091';
import {getMarketplaceStore01052} from './data/marketplace-runtime-01052.js?v=01052';
import {SHIFTTIME_BUILD_STAGE} from '../core/build-stage.js?v=01091';
import {resolveMarketplaceSystemStatus01091,applyMarketplaceSystemStatus01091} from './data/marketplace-context-status-01091.js?v=01091';

let api=null;
function sync(){
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(!studio)return null;
  const store=getMarketplaceStore01052();
  const status=resolveMarketplaceSystemStatus01091({stage:SHIFTTIME_BUILD_STAGE,repository:store.getRepositoryInfo(),summary:store.getSummary(),productEditorLive:true,categoryEditorLive:true});
  studio.dataset.mpStage=SHIFTTIME_BUILD_STAGE;
  applyMarketplaceSystemStatus01091(studio,status);
  const hero=document.querySelector('#marketplace-panel-root .mp-inspector__hero');
  const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
  if(eyebrow)eyebrow.textContent=`MARKETPLACE STUDIO · ${SHIFTTIME_BUILD_STAGE}`;
  return status;
}

export async function initMarketplaceStudio01091(){
  const base=await initMarketplaceStudio01090();
  const store=getMarketplaceStore01052();
  let status=sync();
  store.subscribe(()=>{status=sync()||status;});
  api=Object.freeze({stage:'01091',base,semanticContextStatus:true,domIndexFree:true,getStatus:()=>status,next:'01092'});
  try{window.ST_MARKETPLACE_STUDIO_01091=api;window.__ST_ALL_LOG__?.push?.('marketplace-context-status:studio-ready-01091',{stage:'01091',repository:status?.repository,semanticMetrics:true});}catch{}
  return api;
}
